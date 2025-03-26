import { useState, ChangeEvent } from 'react';

interface IdeaInputProps {
  idea: string;
  onIdeaChange: (idea: string) => void;
}

export default function IdeaInput({ idea, onIdeaChange }: IdeaInputProps) {
  const [charCount, setCharCount] = useState<number>(0);
  
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setCharCount(newText.length);
    onIdeaChange(newText);
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-2">What's your content idea?</h2>
      <p className="text-gray-600 mb-4">
        Describe your content idea in detail. What's the main topic? What key points do you want to cover?
      </p>
      <div className="relative">
        <textarea
          value={idea}
          onChange={handleChange}
          placeholder="Enter your content idea here..."
          className="w-full h-36 p-4 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-900 text-white placeholder-gray-400"
        />
        <div className="absolute bottom-3 right-3 text-sm text-gray-400">
          {charCount} characters
        </div>
      </div>
    </div>
  );
} 