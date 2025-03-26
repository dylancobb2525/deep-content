'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FollowUpQuestions from '@/components/FollowUpQuestions';

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

export default function FollowUpQuestionsPage() {
  const router = useRouter();
  
  // State from previous step
  const [contentState, setContentState] = useState<ContentState | null>(null);
  
  // State for follow-up questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  
  useEffect(() => {
    // Load state from sessionStorage
    const storedState = sessionStorage.getItem('contentState');
    if (!storedState) {
      // Redirect back to step 1 if no state is found
      router.push('/');
      return;
    }
    
    const parsedState = JSON.parse(storedState) as ContentState;
    setContentState(parsedState);
    
    // Fetch questions
    generateQuestions(parsedState);
  }, [router]);
  
  // Generate follow-up questions
  const generateQuestions = async (state: ContentState) => {
    setLoadingQuestions(true);
    try {
      const response = await fetch('/api/anthropic/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idea: state.idea,
          contentType: state.contentType,
          transcript: state.transcript || undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate questions');
      
      const data = await response.json();
      setQuestions(data.questions);
    } catch (error) {
      console.error('Error generating questions:', error);
      // Create some fallback questions
      setQuestions([
        { id: 'q-1', text: "What is your personal connection to or interest in this topic?", answer: '' },
        { id: 'q-2', text: "Who is your target audience and what do you want them to take away from this content?", answer: '' },
        { id: 'q-3', text: "What unique perspective or angle do you want to emphasize in this content?", answer: '' }
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };
  
  // Handle question answer updates
  const handleAnswerChange = (id: string, answer: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, answer } : q
    ));
  };
  
  // Continue to research step
  const handleContinue = async () => {
    if (!contentState) return;
    
    setIsNavigating(true);
    
    try {
      // Save questions to sessionStorage
      sessionStorage.setItem('questions', JSON.stringify(questions));
      
      // Pre-fetch research in the background
      fetch('/api/perplexity/research', {
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
      
      // Navigate to the loading page before showing the research
      router.push('/loading');
    } catch (error) {
      console.error('Error preparing for research:', error);
      setIsNavigating(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto p-6">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Deep Content</h1>
          <p className="mt-2 text-lg text-gray-600">
            Create well-researched, authentic content that reflects your voice
          </p>
        </header>
        
        <div className="space-y-10">
          {/* Step 2: Follow-up Questions */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">Step 2: Follow-up Questions</h2>
            <FollowUpQuestions 
              questions={questions} 
              onAnswerChange={handleAnswerChange}
              onContinue={handleContinue}
              loading={loadingQuestions || isNavigating} 
            />
          </div>
        </div>
      </div>
    </main>
  );
} 