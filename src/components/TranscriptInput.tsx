import { useState, ChangeEvent } from 'react';

interface TranscriptInputProps {
  transcript: string;
  onTranscriptChange: (transcript: string) => void;
}

export default function TranscriptInput({ transcript, onTranscriptChange }: TranscriptInputProps) {
  const [expanded, setExpanded] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [contentSource, setContentSource] = useState<'youtube' | 'web' | null>(null);
  
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onTranscriptChange(e.target.value);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError('');
    setSuccess(false);
    setContentSource(null);
  };

  const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const fetchContent = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);
    setContentSource(null);

    try {
      // Determine if it's a YouTube URL or regular website
      const isYouTube = isYouTubeUrl(url);
      const endpoint = isYouTube ? 'youtube' : 'web';
      
      setContentSource(isYouTube ? 'youtube' : 'web');
      console.log(`Fetching content from ${endpoint} endpoint for URL: ${url}`);
      
      // Add a loading message to show it's working
      if (isYouTube) {
        onTranscriptChange('Fetching YouTube transcript...\nThis may take a few moments, especially for longer videos.');
      } else {
        onTranscriptChange('Fetching website content...');
      }
      
      const response = await fetch(`/api/supadata/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch content from ${isYouTube ? 'YouTube' : 'website'}`);
      }

      if (data.content) {
        // For YouTube, check if the content actually has a transcript
        if (isYouTube && 
            (data.content.includes('No transcript available for this YouTube video') || 
             data.content.includes('No transcript content available'))) {
          throw new Error('No transcript available for this YouTube video. Try a different video that has captions enabled.');
        }
        
        onTranscriptChange(data.content);
        setSuccess(true);
      } else {
        throw new Error('No content received from the API');
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
      // Clear the loading message
      if (transcript.includes('Fetching')) {
        onTranscriptChange('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Examples of YouTube videos that typically have transcripts
  const youtubeExamples = [
    "TED Talks (e.g., https://www.youtube.com/watch?v=8jPQjjsBbIc)",
    "Khan Academy videos",
    "Major news channels (CNN, BBC, etc.)",
    "Official company product announcements",
    "University lectures and educational content"
  ];

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left text-gray-600 hover:text-gray-900"
      >
        <h2 className="text-xl font-semibold">
          Have a transcript, URL, or additional content? (Optional)
        </h2>
        <svg
          className={`w-5 h-5 transition-transform ${expanded ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="Enter YouTube URL or website URL to auto-fetch content..."
                  className="w-full p-3 border border-gray-700 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
                  disabled={isLoading}
                />
                {url && (
                  <div className="absolute right-3 top-3 flex items-center">
                    {isYouTubeUrl(url) ? (
                      <span className="text-xs font-medium bg-red-600 text-white px-2 py-0.5 rounded-full">YouTube</span>
                    ) : (
                      <span className="text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">Website</span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={fetchContent}
                disabled={isLoading}
                className="md:w-auto w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-r-lg md:rounded-l-none rounded-l-lg font-medium transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Fetching...</span>
                  </div>
                ) : "Fetch Content"}
              </button>
            </div>
            
            {error && (
              <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="font-medium">Error: {error}</p>
                {isYouTubeUrl(url) && (
                  <div className="mt-1">
                    <p className="font-medium">Only videos with captions can have their transcripts fetched. Try these types of videos:</p>
                    <ul className="list-disc ml-5 mt-1">
                      {youtubeExamples.map((example, index) => (
                        <li key={index}>{example}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!isYouTubeUrl(url) && (
                  <p className="mt-1">Make sure the website is publicly accessible and contains readable content.</p>
                )}
              </div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="font-medium">
                  {contentSource === 'youtube' ? 'YouTube transcript successfully fetched!' : 'Website content successfully fetched!'} 
                </p>
                <p>The transcript area has been updated with the content.</p>
              </div>
            )}
            
            <div className="text-gray-500 text-sm mt-2">
              <p className="font-medium">Tips:</p>
              <ul className="list-disc ml-5">
                <li><strong>YouTube:</strong> Only videos with captions can be transcribed. Try official channels like TED or major news outlets.</li>
                <li><strong>Websites:</strong> News sites, blogs, and documentation pages usually work best.</li>
                <li><strong>Always review</strong> the fetched content and edit if needed.</li>
              </ul>
            </div>
          </div>

          {/* Manual Transcript Input */}
          <textarea
            value={transcript}
            onChange={handleChange}
            placeholder="Paste your transcript or additional content here..."
            className="w-full h-36 p-4 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-900 text-white placeholder-gray-400"
          />
        </div>
      )}
    </div>
  );
} 