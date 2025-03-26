'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/hooks/useAuth';
import { getContentSession, ContentSession, deleteContentSession } from '@/lib/firebase/contentService';

export default function SessionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [session, setSession] = useState<ContentSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'research' | 'details'>('content');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => {
    // If user is not logged in and not loading, redirect to home
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Load content session data
    async function loadSession() {
      if (!user || !params.id) return;
      
      try {
        setIsLoading(true);
        const sessionData = await getContentSession(params.id);
        
        // Verify that this session belongs to the current user
        if (sessionData.userId !== user.uid) {
          setError('You do not have permission to view this content');
          setSession(null);
        } else {
          setSession(sessionData);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load content. It may have been deleted or you do not have permission to view it.');
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      loadSession();
    }
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!session?.id) return;
    
    try {
      await deleteContentSession(session.id as string);
      setShowDeleteModal(false);
      router.push('/dashboard');
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete the content. Please try again.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    // Firebase timestamp can be either a seconds+nanoseconds object or a Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(`${type} copied to clipboard!`);
        setTimeout(() => setCopySuccess(null), 2000);
      },
      () => {
        setCopySuccess('Failed to copy text');
        setTimeout(() => setCopySuccess(null), 2000);
      }
    );
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType?.toLowerCase()) {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

  if (loading || isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <div className="max-w-5xl mx-auto p-6">
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

  if (error || !session) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 text-center">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              {error || 'Content not found'}
            </h2>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        {/* Header with title and actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center mb-4 gap-4">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">
              {session.title || 'Content Details'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(session.generatedContent || '', 'Content')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center text-sm transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md flex items-center text-sm transition-colors"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            <div className="flex items-center text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
              <span className="mr-1.5">{getContentTypeIcon(session.contentType || '')}</span>
              {session.contentType}
            </div>
            <div className="flex items-center text-gray-600">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Created: {formatDate(session.createdAt)}
            </div>
            {session.updatedAt && session.updatedAt !== session.createdAt && (
              <div className="flex items-center text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Updated: {formatDate(session.updatedAt)}
              </div>
            )}
            {session.contentSource && (
              <div className="flex items-center text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generated by {session.contentSource}
              </div>
            )}
          </div>

          {/* Feedback message when copying */}
          {copySuccess && (
            <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>{copySuccess}</span>
              </div>
            </div>
          )}

          {/* Tabs for navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Generated Content
              </button>
              <button
                onClick={() => setActiveTab('research')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'research'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Research & Data
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Project Details
              </button>
            </nav>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'content' && session.generatedContent && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Generated Content</h2>
                <button
                  onClick={() => copyToClipboard(session.generatedContent || '', 'Content')}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center text-sm"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="prose prose-blue max-w-none">
                  <div className="whitespace-pre-line">{session.generatedContent}</div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'research' && (
            <div className="space-y-6">
              {session.research && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Research Data</h2>
                    <button
                      onClick={() => copyToClipboard(session.research || '', 'Research')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center text-sm"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-gray-700 whitespace-pre-line">{session.research}</p>
                  </div>
                </div>
              )}
              
              {session.questions && session.questions.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Research Questions</h2>
                  <div className="space-y-3">
                    {session.questions.map((q) => (
                      <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <p className="font-medium text-gray-800 mb-2">Q: {q.text}</p>
                        <p className="text-gray-700">A: {q.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {session.transcript && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">Transcript/Additional Content</h2>
                    <button
                      onClick={() => copyToClipboard(session.transcript || '', 'Transcript')}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center text-sm"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p className="text-gray-700 whitespace-pre-line">{session.transcript}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Information</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Original Idea/Prompt</h3>
                    <p className="text-gray-700">{session.idea}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Content Type</h3>
                    <p className="text-gray-700 flex items-center">
                      <span className="mr-1.5">{getContentTypeIcon(session.contentType || '')}</span>
                      {session.contentType}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                    <p className="text-gray-700">{formatDate(session.createdAt)}</p>
                  </div>
                  {session.updatedAt && session.updatedAt !== session.createdAt && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                      <p className="text-gray-700">{formatDate(session.updatedAt)}</p>
                    </div>
                  )}
                  {session.contentSource && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Generated Using</h3>
                      <p className="text-gray-700">{session.contentSource}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
    </main>
  );
} 