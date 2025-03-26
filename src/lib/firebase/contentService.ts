import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";

// Collection name for content sessions
const CONTENT_COLLECTION = 'contentSessions';

export interface ContentSession {
  id?: string;
  userId: string;
  title: string; // Derived from the content idea
  contentType: string;
  idea: string;
  questions: {
    id: string;
    text: string;
    answer: string;
  }[];
  transcript?: string;
  research?: string;
  generatedContent?: string;
  contentSource?: 'Anthropic' | 'OpenAI';
  createdAt?: any;
  updatedAt?: any;
}

// Save a new content session
export const saveContentSession = async (contentData: Omit<ContentSession, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const sessionData = {
      ...contentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, CONTENT_COLLECTION), sessionData);
    return { id: docRef.id, ...sessionData };
  } catch (error) {
    console.error("Error saving content session:", error);
    throw error;
  }
};

// Get all content sessions for a user
export const getUserContentSessions = async (userId: string): Promise<ContentSession[]> => {
  try {
    console.log(`Fetching content sessions for user: ${userId}`);
    
    const q = query(
      collection(db, CONTENT_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} documents for user ${userId}`);
    
    if (querySnapshot.empty) {
      console.log(`No documents found for user ${userId}`);
      return [];
    }
    
    const sessions: ContentSession[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        console.log(`Processing document ${doc.id}:`, JSON.stringify(data));
        
        // Create a safe data extraction helper
        const safeGet = (field: string, defaultValue: any = null) => {
          return data[field] !== undefined ? data[field] : defaultValue;
        };
        
        // Handle potential timestamp issues by creating a proper date object
        const safeTimestamp = (timestamp: any) => {
          if (!timestamp) return { seconds: Date.now() / 1000 };
          
          if (typeof timestamp.toDate === 'function') {
            return timestamp;
          } else if (timestamp.seconds) {
            return timestamp;
          } else if (timestamp instanceof Date) {
            return { seconds: Math.floor(timestamp.getTime() / 1000) };
          } else {
            // Try to parse as a date string or number
            try {
              const date = new Date(timestamp);
              if (!isNaN(date.getTime())) {
                return { seconds: Math.floor(date.getTime() / 1000) };
              }
            } catch (e) {
              // Ignore parsing errors
            }
            return { seconds: Date.now() / 1000 };
          }
        };
        
        // Ensure all required fields are present with proper defaults
        const session: ContentSession = {
          id: doc.id,
          userId: safeGet('userId', userId),
          title: safeGet('title', 'Untitled Content'),
          contentType: safeGet('contentType', 'other'),
          idea: safeGet('idea', ''),
          questions: Array.isArray(safeGet('questions')) ? safeGet('questions') : [],
          transcript: safeGet('transcript', ''),
          research: safeGet('research', ''),
          generatedContent: safeGet('generatedContent', ''),
          contentSource: safeGet('contentSource', undefined),
          createdAt: safeTimestamp(safeGet('createdAt')),
          updatedAt: safeTimestamp(safeGet('updatedAt'))
        };
        
        console.log(`Successfully processed document ${doc.id}`);
        sessions.push(session);
      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        // Still add a minimal valid entry so the user can see something
        sessions.push({
          id: doc.id,
          userId,
          title: `Content (Error Loading)`,
          contentType: 'other',
          idea: '',
          questions: [],
          transcript: '',
          research: '',
          generatedContent: '',
          contentSource: undefined,
          createdAt: { seconds: Date.now() / 1000 },
          updatedAt: { seconds: Date.now() / 1000 }
        });
      }
    });
    
    console.log(`Returning ${sessions.length} content sessions:`, sessions.map(s => s.id));
    return sessions;
  } catch (error) {
    console.error("Error getting content sessions:", error);
    // Return empty array instead of throwing
    return [];
  }
};

// Get a single content session by ID
export const getContentSession = async (sessionId: string) => {
  try {
    const docRef = doc(db, CONTENT_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ContentSession;
    } else {
      throw new Error("Content session not found");
    }
  } catch (error) {
    console.error("Error getting content session:", error);
    throw error;
  }
};

// Update an existing content session
export const updateContentSession = async (sessionId: string, data: Partial<ContentSession>) => {
  try {
    const docRef = doc(db, CONTENT_COLLECTION, sessionId);
    
    // Add updated timestamp
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating content session:", error);
    throw error;
  }
};

// Delete a content session
export const deleteContentSession = async (sessionId: string) => {
  try {
    const docRef = doc(db, CONTENT_COLLECTION, sessionId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting content session:", error);
    throw error;
  }
};

// Function to repair corrupted content session data
export const repairContentSession = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`Attempting to repair content session: ${sessionId}`);
    
    // Get the document
    const docRef = doc(db, CONTENT_COLLECTION, sessionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error(`Document ${sessionId} does not exist`);
      return false;
    }
    
    const data = docSnap.data();
    console.log(`Repairing document ${sessionId}:`, data);
    
    // Create a repair object with proper defaults for missing fields
    const updates: Partial<ContentSession> = {};
    
    // Check and fix each required field
    if (!data.userId) {
      console.log(`Fixing missing userId in ${sessionId}`);
      // This is a critical field - we need to get the current user
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        updates.userId = user.uid;
      } else {
        console.error(`Cannot repair ${sessionId} - no current user and userId is missing`);
        return false;
      }
    }
    
    if (!data.title) {
      updates.title = 'Repaired Content';
    }
    
    if (!data.contentType) {
      updates.contentType = 'other';
    }
    
    // Ensure idea is present
    if (data.idea === undefined) {
      updates.idea = '';
    }
    
    // Ensure questions array exists
    if (!data.questions || !Array.isArray(data.questions)) {
      updates.questions = [];
    }
    
    // Ensure other optional fields are at least empty strings
    if (data.transcript === undefined) {
      updates.transcript = '';
    }
    
    if (data.research === undefined) {
      updates.research = '';
    }
    
    if (data.generatedContent === undefined) {
      updates.generatedContent = '';
    }
    
    // Fix timestamps if needed
    if (!data.createdAt) {
      updates.createdAt = serverTimestamp();
    }
    
    if (!data.updatedAt) {
      updates.updatedAt = serverTimestamp();
    }
    
    // Only update if we have changes to make
    if (Object.keys(updates).length > 0) {
      console.log(`Applying repairs to ${sessionId}:`, updates);
      await updateDoc(docRef, updates);
      return true;
    } else {
      console.log(`No repairs needed for ${sessionId}`);
      return true;
    }
  } catch (error) {
    console.error(`Error repairing content session ${sessionId}:`, error);
    return false;
  }
};

// Function to repair all content sessions for a user
export const repairAllUserSessions = async (userId: string): Promise<number> => {
  try {
    console.log(`Attempting to repair all content sessions for user: ${userId}`);
    
    // Query all sessions for this user
    const q = query(
      collection(db, CONTENT_COLLECTION),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} documents for user ${userId} to check for repair`);
    
    let repairedCount = 0;
    
    // Process each document for repair
    const repairPromises = querySnapshot.docs.map(async (docSnapshot) => {
      const sessionId = docSnapshot.id;
      const success = await repairContentSession(sessionId);
      if (success) repairedCount++;
      return success;
    });
    
    // Wait for all repair operations to complete
    await Promise.all(repairPromises);
    
    console.log(`Repaired ${repairedCount} of ${querySnapshot.size} sessions for user ${userId}`);
    return repairedCount;
  } catch (error) {
    console.error(`Error repairing sessions for user ${userId}:`, error);
    return 0;
  }
}; 