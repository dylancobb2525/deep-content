'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user is already logged in, redirect to the home page
    if (user && !loading) {
      router.push('/');
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
        <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
          <p className="text-center">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loginInProgress}
            className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md shadow-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loginInProgress ? (
              <span>Signing in...</span>
            ) : (
              <span>Sign in with Google</span>
            )}
          </button>
        </div>
        
        <p className="mt-6 text-center text-sm text-gray-600">
          Sign in to save your conversations and access your history
        </p>
      </div>
    </main>
  );
} 