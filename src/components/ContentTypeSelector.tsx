import React, { ChangeEvent, useState } from 'react';

interface ContentTypeSelectorProps {
  contentType: string;
  onContentTypeChange: (type: string) => void;
}

export default function ContentTypeSelector({ contentType, onContentTypeChange }: ContentTypeSelectorProps) {
  const [placeholderExamples, setPlaceholderExamples] = useState<string[]>([
    'Blog Post',
    'YouTube Script',
    'Instagram Post',
    'LinkedIn Article',
    'Twitter Thread',
    'Email Newsletter',
    'Podcast Script',
    'News Article',
    'Sales Page',
    'Product Description'
  ]);
  
  // Rotate through placeholder examples every 3 seconds
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholderExamples.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [placeholderExamples.length]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onContentTypeChange(e.target.value);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">What type of content are you creating?</h2>
      <p className="text-gray-600 mb-4">
        Enter any content type you need - be as specific as possible for better results.
      </p>
      <div className="relative">
        <input
          type="text"
          value={contentType}
          onChange={handleChange}
          placeholder={`e.g., ${placeholderExamples[placeholderIndex]}`}
          className="w-full p-4 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-white placeholder-gray-400"
        />
      </div>
    </div>
  );
} 