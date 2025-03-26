import { useState } from 'react';

interface ResearchResultsProps {
  research: string;
  loading: boolean;
}

export default function ResearchResults({ research, loading }: ResearchResultsProps) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Deep Research in Progress...</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!research) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Deep Research Results</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[1000px]' : 'max-h-48'}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
            {research}
          </pre>
        </div>
      </div>
      {!expanded && (
        <div className="relative bottom-8 w-full h-8 bg-gradient-to-t from-white to-transparent">
          <button
            onClick={() => setExpanded(true)}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-blue-600 hover:underline text-sm font-medium"
          >
            Read More
          </button>
        </div>
      )}
    </div>
  );
} 