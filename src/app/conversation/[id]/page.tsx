'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/hooks/useAuth';
import { 
  getConversation,
  deleteConversation,
  Conversation,
  Message
} from '@/lib/firebase/conversationService';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ConversationPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // If user is not logged in and not loading, redirect to home
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load conversation details
    async function loadConversation() {
      if (!user || !id) return;
      
      setIsLoading(true);
      try {
        console.log(`Fetching conversation ${id}`);
        const conversationData = await getConversation(id);
        
        if (conversationData) {
          setConversation(conversationData);
          setError(null);
        } else {
          setError('Conversation not found or you do not have permission to view it.');
          setConversation(null);
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load conversation. Please try again.');
        setConversation(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadConversation();
    }
  }, [user, id]);

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      const success = await deleteConversation(id);
      if (success) {
        router.push('/conversations');
      } else {
        setError('Failed to delete the conversation. Please try again.');
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Failed to delete the conversation. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date;
      
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return '';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      let date;
      
      if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    
    return (
      <div 
        key={index} 
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div 
          className={`max-w-3/4 rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}
        >
          <div className="text-sm font-medium mb-1">
            {isUser ? 'You' : 'Assistant'}
            {message.timestamp && (
              <span className="ml-2 font-normal text-xs opacity-75">
                {formatTimestamp(message.timestamp)}
              </span>
            )}
          </div>
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center mb-2">
                <Link href="/conversations" className="text-blue-600 hover:text-blue-700 flex items-center mr-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="ml-1">Back</span>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">
                  {conversation?.title || 'Conversation'}
                </h1>
              </div>
              {conversation?.createdAt && (
                <p className="text-sm text-gray-500">
                  {formatDate(conversation.createdAt)}
                </p>
              )}
            </div>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="mt-3 md:mt-0 text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Conversation
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">{error}</p>
            </div>
          )}
          
          {/* Messages */}
          {conversation && conversation.messages && conversation.messages.length > 0 ? (
            <div className="space-y-2">
              {conversation.messages.map((message, index) => renderMessage(message, index))}
            </div>
          ) : !error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <p className="text-gray-500">No messages found in this conversation.</p>
            </div>
          ) : null}
        </div>
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
    </main>
  );
} 