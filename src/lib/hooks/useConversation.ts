import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { 
  saveConversation,
  getUserConversations,
  Message,
  Conversation
} from '../firebase/conversationService';

export function useConversation() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedConversationId, setSavedConversationId] = useState<string | null>(null);

  /**
   * Add a user message to the conversation
   */
  const addUserMessage = useCallback((content: string) => {
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    return userMessage;
  }, []);

  /**
   * Add an assistant message to the conversation
   */
  const addAssistantMessage = useCallback((content: string) => {
    const assistantMessage: Message = {
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    return assistantMessage;
  }, []);

  /**
   * Save the current conversation to Firebase
   */
  const saveCurrentConversation = useCallback(async (title?: string): Promise<boolean> => {
    if (!user || messages.length === 0) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await saveConversation(messages, title);
      
      if (result && result.id) {
        setSavedConversationId(result.id);
        return true;
      }
      
      setError('Failed to save conversation');
      return false;
    } catch (err) {
      console.error('Error saving conversation:', err);
      setError('Failed to save conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, messages]);

  /**
   * Clear the current conversation
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSavedConversationId(null);
    setError(null);
  }, []);

  /**
   * Load user conversations from Firebase
   */
  const loadConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) {
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const conversations = await getUserConversations();
      return conversations;
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    messages,
    isLoading,
    error,
    savedConversationId,
    addUserMessage,
    addAssistantMessage,
    saveCurrentConversation,
    clearConversation,
    loadConversations
  };
} 