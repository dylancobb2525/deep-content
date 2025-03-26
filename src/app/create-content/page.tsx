'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ContentTypeSelector from '@/components/ContentTypeSelector';
import IdeaInput from '@/components/IdeaInput';
import TranscriptInput from '@/components/TranscriptInput';
import Navbar from "@/components/Navbar";
import { useAuth } from '@/lib/hooks/useAuth';

interface ContentState {
  contentType: string;
  idea: string;
  transcript: string;
}

export default function CreateContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // State for user inputs
  const [contentType, setContentType] = useState('');
  const [idea, setIdea] = useState('');
  const [transcript, setTranscript] = useState('');
  const [processingContent, setProcessingContent] = useState(false);
  
  // Redirect to home if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Generate follow-up questions and go to the next step
  const handleContinue = async () => {
    if (idea.trim() === '' || contentType.trim() === '') return;
    
    setProcessingContent(true);
    
    try {
      // Save the current state to sessionStorage so it can be accessed in the next page
      const contentState: ContentState = {
        contentType,
        idea,
        transcript
      };
      
      sessionStorage.setItem('contentState', JSON.stringify(contentState));
      
      // Pre-fetch questions in the background
      fetch('/api/anthropic/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea,
          contentType,
          transcript: transcript || undefined,
        }),
      });
      
      // Navigate to the next step
      router.push('/follow-up-questions');
    } catch (error) {
      console.error('Error preparing for next step:', error);
      setProcessingContent(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <div className="max-w-5xl mx-auto mt-20 p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <div className="max-w-5xl mx-auto p-6">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Deep Content</h1>
          <p className="mt-2 text-lg text-gray-600">
            Create well-researched, authentic content that reflects your voice
          </p>
        </header>
        
        <div className="space-y-10">
          {/* Step 1: Initial Input */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Step 1: Your Content Idea</h2>
            
            <ContentTypeSelector 
              contentType={contentType} 
              onContentTypeChange={setContentType} 
            />
            
            <IdeaInput 
              idea={idea} 
              onIdeaChange={setIdea} 
            />
            
            <TranscriptInput 
              transcript={transcript} 
              onTranscriptChange={setTranscript} 
            />
            
            <div className="pt-4">
              <button
                onClick={handleContinue}
                disabled={!contentType.trim() || idea.trim() === '' || processingContent}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {processingContent ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Preparing next step...</span>
                  </div>
                ) : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 