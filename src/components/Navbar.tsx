'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Navbar() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Deep Content
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-gray-700 hover:text-gray-900 py-2 px-3 rounded-md">
            Home
          </Link>
          
          {user ? (
            <div className="flex items-center ml-4">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600">{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</span>
                </div>
              )}
              <button
                onClick={signOut}
                className="ml-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-2 border-t border-gray-200">
          <div className="flex flex-col space-y-4 px-2 py-3">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {loading ? (
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded mx-3"></div>
            ) : user ? (
              <>
                <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600">{user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}</span>
                      </div>
                    )}
                    <span className="ml-2 text-sm text-gray-700 truncate max-w-[150px]">
                      {user.displayName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-700 hover:text-gray-900"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-3">
                <Link
                  href="/login"
                  className="flex items-center justify-center mx-3 mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 