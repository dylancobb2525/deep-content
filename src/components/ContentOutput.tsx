import { useState, useRef } from 'react';

interface ContentOutputProps {
  content: string;
  loading: boolean;
  onRegenerateContent: (feedback: string) => void;
}

export default function ContentOutput({ content, loading, onRegenerateContent }: ContentOutputProps) {
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleRegenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onRegenerateContent(feedback);
    setShowForm(false);
    setFeedback('');
    setIsSubmitting(false);
  };
  
  const copyToClipboard = () => {
    if (contentRef.current) {
      navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2.5"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2.5"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <h3 className="text-lg font-medium text-gray-800">Generated Content</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors flex items-center"
            aria-label="Suggest changes to improve content"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            Suggest Changes
          </button>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors flex items-center"
            aria-label="Copy all content to clipboard"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
            </svg>
            {copySuccess ? 'Copied!' : 'Copy All'}
          </button>
        </div>
      </div>

      {showForm ? (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <form onSubmit={handleRegenerateClick}>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              How would you like the content to be improved?
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-3"
              rows={4}
              placeholder="Examples: Make it more formal, add more examples, shorter paragraphs, etc."
              required
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Regenerate Content
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div 
          ref={contentRef}
          className="prose prose-blue max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="whitespace-pre-line">{content}</div>
        </div>
      )}
      
      {copySuccess && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Content copied to clipboard!</span>
          </div>
        </div>
      )}
    </div>
  );
} 