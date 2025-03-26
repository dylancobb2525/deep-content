'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  getUserContentSessions, 
  deleteContentSession,
  repairContentSession,
  repairAllUserSessions,
  ContentSession 
} from '@/lib/firebase/contentService';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [sessions, setSessions] = useState<ContentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type'>('newest');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [repairing, setRepairing] = useState<string | null>(null);
  const [repairSuccess, setRepairSuccess] = useState<boolean>(false);
  const [repairingAll, setRepairingAll] = useState<boolean>(false);
  const [repairAllCount, setRepairAllCount] = useState<number>(0);

  useEffect(() => {
    // If user is not logged in and not loading, redirect to home
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load user's content sessions
    async function loadSessions() {
      if (!user) return;
      
      let retries = 0;
      const maxRetries = 3;
      
      const attemptLoad = async () => {
        let userSessions: ContentSession[] = [];
        
        try {
          setIsLoading(true);
          console.log("Fetching content sessions for user:", user.uid);
          userSessions = await getUserContentSessions(user.uid);
          console.log("Retrieved content sessions:", userSessions);
          
          if (userSessions && Array.isArray(userSessions)) {
            if (userSessions.length === 0 && retries < maxRetries) {
              console.log(`No sessions found, retrying (${retries + 1}/${maxRetries})...`);
              retries++;
              setTimeout(attemptLoad, 1000); // Wait 1 second before retry
              return;
            }
            
            setSessions(userSessions);
            setError(null);
          } else {
            console.error("Received invalid sessions data structure:", userSessions);
            setSessions([]);
            setError("Failed to load content: Invalid data received");
          }
        } catch (err) {
          console.error('Error loading sessions:', err);
          
          if (retries < maxRetries) {
            console.log(`Error loading sessions, retrying (${retries + 1}/${maxRetries})...`);
            retries++;
            setTimeout(attemptLoad, 1000); // Wait 1 second before retry
            return;
          }
          
          setError('Failed to load your content. Please try again.');
          setSessions([]);
        } finally {
          if (retries >= maxRetries || (Array.isArray(userSessions) && userSessions.length > 0)) {
            setIsLoading(false);
          }
        }
      };
      
      attemptLoad();
    }

    if (user) {
      loadSessions();
    }
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteContentSession(deleteId);
      setSessions(sessions.filter(session => session.id !== deleteId));
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete the content. Please try again.');
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date;
      
      // Firebase timestamp can be in different formats
      if (typeof timestamp.toDate === 'function') {
        // Native Firestore timestamp
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        // Serialized Firestore timestamp
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        // Try to parse as a date string or number
        date = new Date(timestamp);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", timestamp);
        return 'N/A';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Error formatting date:", error, timestamp);
      return 'N/A';
    }
  };

  // Function to reload user content
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Manually refreshing content for user:", user.uid);
      const userSessions = await getUserContentSessions(user.uid);
      
      if (userSessions && Array.isArray(userSessions)) {
        setSessions(userSessions);
      } else {
        console.error("Invalid data structure on refresh:", userSessions);
        setError("Failed to refresh: Invalid data received");
      }
    } catch (err) {
      console.error('Error refreshing sessions:', err);
      setError('Failed to refresh your content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'blog post':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        );
      case 'social media post':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'youtube script':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Get all unique content types
  const contentTypes = [...new Set(sessions.map(session => session.contentType))];

  // Sort and filter sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    // Safely handle timestamps that might be missing or in different formats
    let dateA, dateB;
    
    try {
      // Handle various timestamp formats or fallback to current date
      if (a.createdAt) {
        if (typeof a.createdAt.toDate === 'function') {
          // Firestore Timestamp
          dateA = a.createdAt.toDate();
        } else if (a.createdAt.seconds) {
          // Firestore Timestamp in serialized form
          dateA = new Date(a.createdAt.seconds * 1000);
        } else {
          // ISO string or timestamp number
          dateA = new Date(a.createdAt);
        }
      } else {
        dateA = new Date(0); // Default to epoch start if missing
      }
    } catch (error) {
      console.error("Error parsing date A:", error, a.createdAt);
      dateA = new Date(0);
    }
    
    try {
      if (b.createdAt) {
        if (typeof b.createdAt.toDate === 'function') {
          dateB = b.createdAt.toDate();
        } else if (b.createdAt.seconds) {
          dateB = new Date(b.createdAt.seconds * 1000);
        } else {
          dateB = new Date(b.createdAt);
        }
      } else {
        dateB = new Date(0);
      }
    } catch (error) {
      console.error("Error parsing date B:", error, b.createdAt);
      dateB = new Date(0);
    }
    
    if (sortBy === 'newest') {
      return dateB.getTime() - dateA.getTime();
    } else if (sortBy === 'oldest') {
      return dateA.getTime() - dateB.getTime();
    } else if (sortBy === 'type') {
      return (a.contentType || '').localeCompare(b.contentType || '');
    }
    return 0;
  });
  
  // Apply filter if active
  const filteredSessions = activeFilter 
    ? sortedSessions.filter(session => session.contentType === activeFilter)
    : sortedSessions;

  // Function to repair a content session
  const handleRepairSession = async (sessionId: string) => {
    if (!user) return;
    
    try {
      setRepairing(sessionId);
      const success = await repairContentSession(sessionId);
      
      if (success) {
        setRepairSuccess(true);
        // Refresh the sessions after repair
        await handleRefresh();
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRepairSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Error repairing session:', err);
      setError('Failed to repair content. Please try again.');
    } finally {
      setRepairing(null);
    }
  };

  // Function to repair all user content sessions
  const handleRepairAll = async () => {
    if (!user) return;
    
    try {
      setRepairingAll(true);
      setError(null);
      
      console.log(`Starting repair of all content for user: ${user.uid}`);
      const repairedCount = await repairAllUserSessions(user.uid);
      
      setRepairAllCount(repairedCount);
      setRepairSuccess(true);
      
      // Refresh the sessions after repair
      await handleRefresh();
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setRepairSuccess(false);
        setRepairAllCount(0);
      }, 5000);
    } catch (err) {
      console.error('Error repairing all sessions:', err);
      setError('Failed to repair content. Please try again.');
    } finally {
      setRepairingAll(false);
    }
  };

  const renderSessionCard = (session: ContentSession) => {
    // Check if session might be corrupted
    const mightBeCorrupted = !session.title || 
                           !session.contentType || 
                           session.title.includes('Error Loading');
    
    return (
      <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Corruption indicator if needed */}
        {mightBeCorrupted && (
          <div className="bg-yellow-100 px-4 py-2 border-b border-yellow-200 text-yellow-800 text-sm flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            This content may be corrupted
          </div>
        )}
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <div className="mr-2 text-blue-600">
                {getContentTypeIcon(session.contentType || 'document')}
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {session.contentType}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {session.contentSource && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {session.contentSource}
                </span>
              )}
            </div>
          </div>
          
          <Link 
            href={session.id ? `/session/${session.id}` : '#'} 
            className={`block group ${!session.id ? 'pointer-events-none' : ''}`}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {session.title || session.idea?.substring(0, 50) + (session.idea && session.idea.length > 50 ? '...' : '')}
            </h2>
          </Link>
          
          <p className="text-gray-600 text-sm mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(session.createdAt)}
            {session.updatedAt && session.updatedAt !== session.createdAt && (
              <span className="ml-2 text-xs text-gray-500">(Updated: {formatDate(session.updatedAt)})</span>
            )}
          </p>
          
          <p className="text-gray-700 mb-4 line-clamp-3 text-sm">
            {session.idea}
          </p>

          {session.questions && session.questions.length > 0 && (
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1">Research Topics:</p>
              <div className="flex flex-wrap gap-2">
                {session.questions.slice(0, 3).map((q: any, i: number) => (
                  <span key={i} className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs truncate max-w-[150px]">
                    {q.text}
                  </span>
                ))}
                {session.questions.length > 3 && (
                  <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                    +{session.questions.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => confirmDelete(session.id as string)}
              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
              aria-label="Delete content"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
            
            {mightBeCorrupted && (
              <button
                onClick={() => handleRepairSession(session.id || '')}
                disabled={repairing === session.id || !session.id}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                aria-label="Repair content"
              >
                {repairing === session.id ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Repairing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Repair
                  </>
                )}
              </button>
            )}
          </div>
          
          <Link
            href={session.id ? `/session/${session.id}` : '#'}
            className={`text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center ${!session.id ? 'opacity-50 pointer-events-none' : ''}`}
          >
            View Details
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  };

  if (loading || (isLoading && user)) {
    return (
      <main className="min-h-screen bg-white text-gray-900">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // This will handle the redirect in the useEffect
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">My Content Library</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 w-full sm:w-auto appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="type">By Content Type</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={activeFilter || 'all'}
                  onChange={(e) => setActiveFilter(e.target.value === 'all' ? null : e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 w-full sm:w-auto appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Content Types</option>
                  {contentTypes.length > 0 ? (
                    contentTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))
                  ) : (
                    <>
                      <option value="Blog Post">Blog Post</option>
                      <option value="Social Media Post">Social Media Post</option>
                      <option value="YouTube Script">YouTube Script</option>
                      <option value="Email">Email</option>
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              
              <button 
                onClick={handleRefresh}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                )}
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>

              <button 
                onClick={handleRepairAll}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                disabled={repairingAll || isLoading || sessions.length === 0}
              >
                {repairingAll ? (
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                )}
                {repairingAll ? 'Repairing All Content...' : 'Repair All Content'}
              </button>
            </div>
          </div>

          {repairSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <div>
                <p className="font-medium">Content repaired successfully!</p>
                {repairAllCount > 0 ? (
                  <p className="text-sm mt-1">Successfully repaired {repairAllCount} content items.</p>
                ) : (
                  <p className="text-sm mt-1">The content has been repaired and should now display correctly.</p>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">Try using the "Repair All Content" button to resolve data issues, or refresh the page.</p>
              </div>
            </div>
          )}
          
          {isLoading && !sessions.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-gray-600">Loading your content...</p>
            </div>
          ) : !sessions.length ? (
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Content Library is Empty</h2>
              <p className="text-gray-600 mb-6">
                Create and save your first piece of content to get started with Deep Content.
              </p>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Content
              </Link>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No Content Found</h2>
              <p className="text-gray-600 mb-4">
                No content matches your current filter selection.
              </p>
              <button
                onClick={() => setActiveFilter(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Content
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSessions.map((session) => renderSessionCard(session))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Delete Content</h3>
              <p className="mb-6 text-gray-700">
                Are you sure you want to delete this content? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 