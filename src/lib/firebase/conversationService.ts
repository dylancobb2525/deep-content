import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";

// Collection path for conversations
const CONVERSATIONS_COLLECTION = 'conversations';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: any;
}

export interface Conversation {
  id?: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Save a conversation to Firestore
 */
export const saveConversation = async (messages: Message[], title?: string): Promise<Conversation | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    console.log("saveConversation - Current auth user:", user?.uid || "No user");
    
    if (!user) {
      console.error("Cannot save conversation: No authenticated user");
      return null;
    }

    // Generate title from the first message if not provided
    const conversationTitle = title || 
      (messages.length > 0 && messages[0].role === 'user' 
        ? messages[0].content.substring(0, 50) + (messages[0].content.length > 50 ? '...' : '') 
        : 'New Conversation');

    console.log(`Creating conversation data with ${messages.length} messages`);
    
    const conversationData = {
      userId: user.uid,
      title: conversationTitle,
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || serverTimestamp()
      })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    console.log(`Saving conversation for user ${user.uid}:`, conversationTitle);
    console.log("Conversation data structure:", JSON.stringify({
      userId: conversationData.userId,
      title: conversationData.title,
      messageCount: conversationData.messages.length
    }));
    
    const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
    console.log("Document written with ID:", docRef.id);
    
    return { 
      id: docRef.id, 
      ...conversationData 
    };
  } catch (error) {
    console.error("Error saving conversation:", error);
    return null;
  }
};

/**
 * Get all conversations for the current authenticated user
 */
export const getUserConversations = async (): Promise<Conversation[]> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.log("Cannot get conversations: No authenticated user");
      return [];
    }
    
    console.log(`Fetching conversations for user: ${user.uid}`);
    
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} conversations for user ${user.uid}`);
    
    const conversations: Conversation[] = [];
    
    querySnapshot.forEach((doc) => {
      try {
        const data = doc.data();
        
        // Create a safe data extraction helper
        const safeGet = (field: string, defaultValue: any = null) => {
          return data[field] !== undefined ? data[field] : defaultValue;
        };
        
        // Ensure all required fields are present with proper defaults
        const conversation: Conversation = {
          id: doc.id,
          userId: safeGet('userId', user.uid),
          title: safeGet('title', 'Untitled Conversation'),
          messages: Array.isArray(safeGet('messages')) ? safeGet('messages') : [],
          createdAt: safeGet('createdAt'),
          updatedAt: safeGet('updatedAt')
        };
        
        conversations.push(conversation);
      } catch (docError) {
        console.error(`Error processing conversation ${doc.id}:`, docError);
        // Add a valid minimal entry
        conversations.push({
          id: doc.id,
          userId: user.uid,
          title: `Conversation (Error Loading)`,
          messages: [],
          createdAt: { seconds: Date.now() / 1000 },
          updatedAt: { seconds: Date.now() / 1000 }
        });
      }
    });
    
    return conversations;
  } catch (error) {
    console.error("Error getting conversations:", error);
    return [];
  }
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error("Cannot get conversation: No authenticated user");
      return null;
    }
    
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Verify that this conversation belongs to the current user
      if (data.userId !== user.uid) {
        console.error("Cannot access conversation: User does not have permission");
        return null;
      }
      
      return { id: docSnap.id, ...data } as Conversation;
    } else {
      console.error("Conversation not found:", conversationId);
      return null;
    }
  } catch (error) {
    console.error("Error getting conversation:", error);
    return null;
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.error("Cannot delete conversation: No authenticated user");
      return false;
    }
    
    // First verify that this conversation belongs to the current user
    const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.error("Cannot delete conversation: Conversation not found");
      return false;
    }
    
    const data = docSnap.data();
    if (data.userId !== user.uid) {
      console.error("Cannot delete conversation: User does not have permission");
      return false;
    }
    
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return false;
  }
}; 