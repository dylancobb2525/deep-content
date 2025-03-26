'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoadingPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if there's state in sessionStorage
    const contentState = sessionStorage.getItem('contentState');
    const questions = sessionStorage.getItem('questions');
    
    if (!contentState || !questions) {
      // Redirect back to step 1 if no state is found
      router.push('/');
      return;
    }
    
    // Wait a bit to show the loading animation, then redirect to research results
    const timer = setTimeout(() => {
      router.push('/research-results');
    }, 3000); // 3 seconds delay
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <main className="min-h-screen bg-white text-gray-900 flex items-center justify-center">
      <div className="max-w-5xl mx-auto p-6 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Researching Your Content</h1>
          <p className="mt-4 text-lg text-gray-600">
            We&apos;re gathering the most relevant information to make your content exceptional.
          </p>
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-12">
          {/* Loading animation */}
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          
          {/* Research steps */}
          <div className="max-w-md">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Analyzing your content idea</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium">Gathering relevant information</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-gray-100 text-gray-400 w-8 h-8 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-400">Preparing your content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 