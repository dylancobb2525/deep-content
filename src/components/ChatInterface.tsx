'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useConversation } from '@/lib/hooks/useConversation';

export default function ChatInterface() {
  const { user } = useAuth();
  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    saveCurrentConversation,
    clearConversation,
    isLoading: isSaving,
    error: saveError,
    savedConversationId
  } = useConversation();
  
  const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai'>('anthropic');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use Vercel AI SDK for handling chat interactions
  const { messages: aiMessages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `/api/${aiProvider}/chat`,
    onFinish: (message) => {
      // When AI finishes generating, add to our conversation state for saving
      addAssistantMessage(message.content);
      setSaveSuccess(false);
    }
  });

  // Sync input between AI SDK and our component
  useEffect(() => {
    setInputValue(input);
  }, [input]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  // Handle provider change
  const handleProviderChange = (provider: 'anthropic' | 'openai') => {
    setAiProvider(provider);
  };

  // Handle message submission with our own user message tracking
  const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    
    // Add to our conversation state for saving
    addUserMessage(inputValue);
    setSaveSuccess(false);
    
    // Let AI SDK handle the actual API call
    handleSubmit(e);
  };

  // Handle saving conversation
  const handleSaveConversation = async () => {
    if (aiMessages.length === 0) return;
    
    console.log("Starting to save conversation with", aiMessages.length, "messages");
    console.log("Current user:", user);
    
    // Generate title from first user message
    const userMessages = aiMessages.filter(msg => msg.role === 'user');
    const title = userMessages.length > 0 
      ? userMessages[0].content.substring(0, 50) + (userMessages[0].content.length > 50 ? '...' : '')
      : 'Conversation';
    
    console.log("Calling saveCurrentConversation with title:", title);
    const success = await saveCurrentConversation(title);
    console.log("Save result:", success, "savedConversationId:", savedConversationId);
    
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      console.error("Failed to save conversation");
    }
  };

  // Clear conversation
  const handleClearConversation = () => {
    clearConversation();
    window.location.reload(); // Reload page to reset AI SDK state as well
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto mt-6 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Chat with AI</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Model:</span>
            <select 
              value={aiProvider}
              onChange={(e) => handleProviderChange(e.target.value as 'anthropic' | 'openai')}
              className="border border-gray-300 rounded p-1 text-sm"
            >
              <option value="anthropic">Claude 3.5 Sonnet</option>
              <option value="openai">GPT-4o</option>
            </select>
          </div>
          <button 
            onClick={handleClearConversation}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Chat
          </button>
        </div>
      </div>
      
      {/* Auth status message */}
      {!user && (
        <div className="p-3 bg-yellow-50 border-b border-yellow-100 text-yellow-800 text-sm">
          <strong>Note:</strong> You must be logged in to save conversations. <a href="/login" className="underline">Sign in</a> to enable this feature.
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">How can I help you today?</p>
              <p className="text-sm">Ask me anything to start a conversation.</p>
            </div>
          </div>
        ) : (
          aiMessages.map((message, index) => (
            <div 
              key={index} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {message.role === 'user' ? 'You' : aiProvider === 'anthropic' ? 'Claude' : 'GPT'}
                </div>
                <div className="whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="text-sm font-medium mb-1">
                {aiProvider === 'anthropic' ? 'Claude' : 'GPT'}
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-gray-300 rounded-full h-2 w-2 animate-bounce"></div>
                <div className="bg-gray-300 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="bg-gray-300 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Error message */}
      {(error || saveError) && (
        <div className="p-3 bg-red-50 border-t border-red-200 text-red-600 text-sm">
          {error instanceof Error ? error.message : error}
          {saveError && saveError}
        </div>
      )}
      
      {/* Save conversation button (only for logged-in users) */}
      {user && aiMessages.length > 0 && (
        <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-center">
          <button
            onClick={handleSaveConversation}
            disabled={isSaving || aiMessages.length === 0 || savedConversationId !== null}
            className={`text-sm px-3 py-1 rounded ${
              saveSuccess 
                ? 'bg-green-100 text-green-700' 
                : savedConversationId !== null
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isSaving ? 'Saving...' : 
             saveSuccess ? 'Saved!' : 
             savedConversationId !== null ? 'Already Saved' : 'Save Conversation'}
          </button>
        </div>
      )}
      
      {/* Input */}
      <form 
        onSubmit={handleMessageSubmit} 
        className="p-4 border-t border-gray-200 flex space-x-4"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading || inputValue.trim() === ''}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  );
} 