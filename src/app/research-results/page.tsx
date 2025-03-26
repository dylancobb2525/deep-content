'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResearchResults from '@/components/ResearchResults';
import ContentOutput from '@/components/ContentOutput';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/hooks/useAuth';
import { saveContentSession } from '@/lib/firebase/contentService';
import Link from 'next/link';

interface Question {
  id: string;
  text: string;
  answer: string;
}

interface ContentState {
  contentType: string;
  idea: string;
  transcript: string;
}

export default function ResearchResultsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State from previous steps
  const [contentState, setContentState] = useState<ContentState | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // State for research
  const [research, setResearch] = useState('');
  const [loadingResearch, setLoadingResearch] = useState(true);
  
  // State for generated content
  const [generatedContent, setGeneratedContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(true);
  const [contentSource, setContentSource] = useState<'Anthropic' | 'OpenAI'>('Anthropic');
  
  // State for content saving
  const [savedToFirebase, setSavedToFirebase] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  useEffect(() => {
    // Load state from sessionStorage
    const storedContentState = sessionStorage.getItem('contentState');
    const storedQuestions = sessionStorage.getItem('questions');
    
    if (!storedContentState || !storedQuestions) {
      // Redirect back to step 1 if no state is found
      router.push('/');
      return;
    }
    
    const parsedContentState = JSON.parse(storedContentState) as ContentState;
    const parsedQuestions = JSON.parse(storedQuestions) as Question[];
    
    setContentState(parsedContentState);
    setQuestions(parsedQuestions);
    
    // Generate research and content
    generateResearch(parsedContentState, parsedQuestions);
  }, [router]);
  
  // Save content to Firebase when user is logged in and content is generated
  useEffect(() => {
    const saveContent = async () => {
      if (!user || !contentState || !generatedContent || savedToFirebase || sessionId) return;
      
      try {
        const title = contentState.idea.substring(0, 50) + (contentState.idea.length > 50 ? '...' : '');
        
        const sessionData = await saveContentSession({
          userId: user.uid,
          title,
          contentType: contentState.contentType,
          idea: contentState.idea,
          questions,
          transcript: contentState.transcript || undefined,
          research,
          generatedContent,
          contentSource
        });
        
        setSavedToFirebase(true);
        setSessionId(sessionData.id as string);
        setSaveError(null);
      } catch (error) {
        console.error('Error saving content:', error);
        setSaveError('Failed to save your content to your account.');
        setSavedToFirebase(false);
      }
    };
    
    if (user && generatedContent && !loadingContent) {
      saveContent();
    }
  }, [user, contentState, questions, research, generatedContent, loadingContent, contentSource, savedToFirebase, sessionId]);
  
  // Generate research
  const generateResearch = async (contentState: ContentState, questions: Question[]) => {
    setLoadingResearch(true);
    try {
      const response = await fetch('/api/perplexity/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: contentState.idea,
          contentType: contentState.contentType,
          questions,
          transcript: contentState.transcript || undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate research');
      
      const data = await response.json();
      setResearch(data.research);
      
      // After getting research, generate content
      generateContent(contentState, questions, data.research);
      
    } catch (error) {
      console.error('Error generating research:', error);
      // Set fallback research
      const fallbackResearch = `[Demo research]\n\n` +
        `Based on the content idea and questions, here's what research shows:\n\n` +
        `1. Key statistics related to this topic\n` +
        `2. Expert opinions from leading authorities\n` +
        `3. Case studies and examples that illustrate important points\n` +
        `4. Recent developments and trends in this area\n` +
        `5. Historical context that helps frame the discussion\n\n` +
        `This demonstrates how the deep research feature would work with a valid API connection.`;
      
      setResearch(fallbackResearch);
      
      // Still try to generate content with fallback research
      generateContent(contentState, questions, fallbackResearch);
    } finally {
      setLoadingResearch(false);
    }
  };
  
  // Generate final content
  const generateContent = async (contentState: ContentState, questions: Question[], researchText: string) => {
    setLoadingContent(true);
    try {
      console.log("Generating content with:", {
        contentType: contentState.contentType,
        hasTranscript: !!contentState.transcript,
        transcriptLength: contentState.transcript?.length || 0,
        questionsCount: questions.length
      });
      
      // Make up to 3 attempts to generate content
      let attempts = 0;
      let success = false;
      let finalError = null;
      
      while (attempts < 3 && !success) {
        attempts++;
        try {
          const response = await fetch('/api/anthropic/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idea: contentState.idea,
              contentType: contentState.contentType,
              questions,
              research: researchText,
              transcript: contentState.transcript || undefined,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to generate content: ${errorData.error || response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.content || data.content.trim() === '') {
            throw new Error('No content was generated');
          }
          
          // Check if content includes a source indicator (added by our API)
          if (data.source) {
            setContentSource(data.source as 'Anthropic' | 'OpenAI');
          } else {
            // Default to Anthropic unless specified otherwise
            setContentSource('Anthropic');
          }
          
          setGeneratedContent(data.content);
          success = true;
          break;
        } catch (err) {
          console.error(`Attempt ${attempts} failed:`, err);
          finalError = err;
          // Wait a short time before retrying
          if (attempts < 3) await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!success) {
        throw finalError || new Error('All attempts to generate content failed');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      // Set fallback content only if all attempts failed
      setGeneratedContent(`[Unable to generate content]\n\nWe encountered a technical issue while generating your ${contentState.contentType}. 
      
Here's what you can try:
      
1. Press "Suggest Changes" below and enter "Please regenerate the content" - this will trigger a new generation attempt
2. If that doesn't work, try starting over with a new content idea
3. Ensure you have a valid OpenAI API key configured in your .env.local file

Your original inputs, answers, and research have been saved and can still be used when the service is working again.`);
      
      setContentSource('OpenAI');
    } finally {
      setLoadingContent(false);
    }
  };

  // Regenerate content with user feedback
  const regenerateContent = async (feedback: string) => {
    if (!contentState || !research) return;
    
    setLoadingContent(true);
    try {
      console.log("Regenerating content with user feedback:", feedback.substring(0, 50) + "...");
      
      const response = await fetch('/api/anthropic/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: contentState.idea,
          contentType: contentState.contentType,
          questions,
          research,
          transcript: contentState.transcript || undefined,
          feedback, // Add the user's feedback
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to regenerate content: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.content || data.content.trim() === '') {
        throw new Error('No content was regenerated');
      }
      
      // Check if source changed during regeneration
      if (data.source) {
        setContentSource(data.source as 'Anthropic' | 'OpenAI');
      }
      
      setGeneratedContent(data.content);
      
      // If the user is logged in and content was already saved, update it with the new content
      if (user && sessionId) {
        try {
          // Import here to avoid circular dependency
          const { updateContentSession } = require('@/lib/firebase/contentService');
          await updateContentSession(sessionId, { 
            generatedContent: data.content,
            contentSource: data.source || contentSource
          });
          
          // Show a temporary notification that the content was updated
          setSaveError(null);
          setSavedToFirebase(true);
        } catch (error) {
          console.error('Error updating saved content:', error);
          setSaveError('Your regenerated content was created but could not be saved to your account.');
        }
      } else if (user && !sessionId && !savedToFirebase) {
        // If user is logged in but content hasn't been saved yet, trigger a save
        const title = contentState.idea.substring(0, 50) + (contentState.idea.length > 50 ? '...' : '');
        
        try {
          const sessionData = await saveContentSession({
            userId: user.uid,
            title,
            contentType: contentState.contentType,
            idea: contentState.idea,
            questions,
            transcript: contentState.transcript || undefined,
            research,
            generatedContent: data.content,
            contentSource: data.source as 'Anthropic' | 'OpenAI' || contentSource
          });
          
          setSavedToFirebase(true);
          setSessionId(sessionData.id as string);
          setSaveError(null);
        } catch (error) {
          console.error('Error saving content:', error);
          setSaveError('Failed to save your content to your account.');
          setSavedToFirebase(false);
        }
      }
    } catch (error) {
      console.error('Error regenerating content:', error);
      // Inform user of the error but keep existing content
      alert(`Error regenerating content: ${error instanceof Error ? error.message : 'Unknown error'}. Your previous content has been preserved.`);
    } finally {
      setLoadingContent(false);
    }
  };

  // Manual save content
  const handleSaveContent = async () => {
    if (!user || !contentState || !generatedContent || savedToFirebase || sessionId) return;
    
    try {
      const title = contentState.idea.substring(0, 50) + (contentState.idea.length > 50 ? '...' : '');
      
      const sessionData = await saveContentSession({
        userId: user.uid,
        title,
        contentType: contentState.contentType,
        idea: contentState.idea,
        questions,
        transcript: contentState.transcript || undefined,
        research,
        generatedContent,
        contentSource
      });
      
      setSavedToFirebase(true);
      setSessionId(sessionData.id as string);
      setSaveError(null);
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveError('Failed to save your content to your account.');
      setSavedToFirebase(false);
    }
  };

  // Start over from the beginning
  const handleStartOver = () => {
    // Clear sessionStorage
    sessionStorage.removeItem('contentState');
    sessionStorage.removeItem('questions');
    
    // Redirect to home page
    router.push('/');
  };

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
          {/* Research Results - Deemphasized */}
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h2 className="text-xl font-medium text-gray-700 border-b pb-2 mb-3">Deep Research Results</h2>
            <div className="opacity-75">
              <ResearchResults research={research} loading={loadingResearch} />
            </div>
          </div>
          
          {/* Generated Content - Main focus */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Step 3: Your Generated Content</h2>
            
            <ContentOutput 
              content={generatedContent} 
              loading={loadingContent} 
              onRegenerateContent={regenerateContent}
            />
            
            {/* Source info */}
            {!loadingContent && generatedContent && (
              <div className="mt-3 text-right text-sm text-gray-500">
                Powered by {contentSource}
              </div>
            )}
            
            {/* Bottom navigation */}
            <div className="mt-8 grid grid-cols-1 gap-4">
              <button
                onClick={handleStartOver}
                className="py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors w-full flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Start Over with New Content
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 