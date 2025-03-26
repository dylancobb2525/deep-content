'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is already logged in, redirect to the content creation page
  useEffect(() => {
    if (user && !loading) {
      router.push('/create-content');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      setLoginInProgress(true);
      setError(null);
      await signInWithGoogle();
      // The redirection will happen automatically via the useEffect
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to sign in. Please try again.');
    } finally {
      setLoginInProgress(false);
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

  // Welcome screen
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-blue-50 text-gray-900">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mt-12 mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Deep Content</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Research Made Easy. Create well-researched, authentic content in minutes.
          </p>
        </div>
        
        {/* Feature boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="mb-4 text-blue-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Research</h3>
            <p className="text-gray-600">
              Our AI automatically researches your topic and gathers relevant information from credible sources.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="mb-4 text-blue-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Quality Content</h3>
            <p className="text-gray-600">
              Generate blog posts, articles, social media content, and more with your unique voice and style.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="mb-4 text-blue-600">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Save hours of research and writing time. Create well-researched content in just minutes.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="flex justify-center">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md max-w-md">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleSignIn}
            disabled={loginInProgress}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg shadow-md transition-colors flex items-center disabled:opacity-70"
          >
            {loginInProgress ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                <span>Sign in with Google to Get Started</span>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
