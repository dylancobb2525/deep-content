'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  getUserConversations,
  deleteConversation,
  Conversation 
} from '@/lib/firebase/conversationService';

export default function ConversationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // If user is not logged in and not loading, redirect to home
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load user's conversations
    async function loadConversations() {
      if (!user) return;
      
      let retries = 0;
      const maxRetries = 3;
      
      const attemptLoad = async () => {
        let userConversations: Conversation[] = [];
        
        try {
          setIsLoading(true);
          console.log("Fetching conversations for user:", user.uid);
          userConversations = await getUserConversations();
          console.log("Retrieved conversations:", userConversations);
          
          if (userConversations && Array.isArray(userConversations)) {
            if (userConversations.length === 0 && retries < maxRetries) {
              console.log(`No conversations found, retrying (${retries + 1}/${maxRetries})...`);
              retries++;
              setTimeout(attemptLoad, 1000); // Wait 1 second before retry
              return;
            }
            
            setConversations(userConversations);
            setError(null);
          } else {
            console.error("Received invalid conversations data structure:", userConversations);
            setConversations([]);
            setError("Failed to load conversations: Invalid data received");
          }
        } catch (err) {
          console.error('Error loading conversations:', err);
          
          if (retries < maxRetries) {
            console.log(`Error loading conversations, retrying (${retries + 1}/${maxRetries})...`);
            retries++;
            setTimeout(attemptLoad, 1000); // Wait 1 second before retry
            return;
          }
          
          setError('Failed to load your conversations. Please try again.');
          setConversations([]);
        } finally {
          if (retries >= maxRetries || (Array.isArray(userConversations) && userConversations.length > 0)) {
            setIsLoading(false);
          }
        }
      };
      
      attemptLoad();
    }

    if (user) {
      loadConversations();
    }
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const success = await deleteConversation(deleteId);
      if (success) {
        setConversations(conversations.filter(conversation => conversation.id !== deleteId));
        setShowDeleteModal(false);
        setDeleteId(null);
      } else {
        setError('Failed to delete the conversation. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete the conversation. Please try again.');
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

  // Function to reload user conversations
  const handleRefresh = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Manually refreshing conversations for user:", user.uid);
      const userConversations = await getUserConversations();
      
      if (userConversations && Array.isArray(userConversations)) {
        setConversations(userConversations);
      } else {
        console.error("Invalid data structure on refresh:", userConversations);
        setError("Failed to refresh: Invalid data received");
      }
    } catch (err) {
      console.error('Error refreshing conversations:', err);
      setError('Failed to refresh your conversations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderConversationCard = (conversation: Conversation) => {
    const messageCount = conversation.messages?.length || 0;
    const lastMessage = messageCount > 0 ? conversation.messages[messageCount - 1] : null;
    
    return (
      <div key={conversation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-4">
          <Link 
            href={conversation.id ? `/conversation/${conversation.id}` : '#'} 
            className={`block group ${!conversation.id ? 'pointer-events-none' : ''}`}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {conversation.title || 'Untitled Conversation'}
            </h2>
          </Link>
          
          <p className="text-gray-600 text-sm mb-3 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(conversation.createdAt)}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {messageCount} message{messageCount !== 1 ? 's' : ''}
          </div>
          
          {lastMessage && (
            <div className="p-3 bg-gray-50 rounded border border-gray-100 mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                {lastMessage.role === 'user' ? 'You' : 'Assistant'}:
              </p>
              <p className="text-gray-700 text-sm line-clamp-2">
                {lastMessage.content}
              </p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
          <button
            onClick={() => confirmDelete(conversation.id as string)}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
            aria-label="Delete conversation"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
          
          <Link
            href={conversation.id ? `/conversation/${conversation.id}` : '#'}
            className={`text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center ${!conversation.id ? 'opacity-50 pointer-events-none' : ''}`}
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
            <h1 className="text-3xl font-bold mb-4 md:mb-0">My Conversations</h1>
            
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
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-start">
              <svg className="h-6 w-6 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">Please try refreshing the page or logging out and back in.</p>
              </div>
            </div>
          )}
          
          {isLoading && !conversations.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-lg text-gray-600">Loading your conversations...</p>
            </div>
          ) : !conversations.length ? (
            <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Conversation History is Empty</h2>
              <p className="text-gray-600 mb-6">
                Start chatting with Deep Content to see your conversation history here.
              </p>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start a New Conversation
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conversations.map((conversation) => renderConversationCard(conversation))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Delete Conversation</h3>
              <p className="mb-6 text-gray-700">
                Are you sure you want to delete this conversation? This action cannot be undone.
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