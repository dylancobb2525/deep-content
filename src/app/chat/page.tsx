'use client';

import Navbar from '@/components/Navbar';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <ChatInterface />
      </div>
    </main>
  );
} 