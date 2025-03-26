import { useState } from 'react';

interface Question {
  id: string;
  text: string;
  answer: string;
}

interface FollowUpQuestionsProps {
  questions: Question[];
  onAnswerChange: (id: string, answer: string) => void;
  onContinue: () => void;
  loading: boolean;
}

export default function FollowUpQuestions({ questions, onAnswerChange, onContinue, loading }: FollowUpQuestionsProps) {
  const [activeQuestion, setActiveQuestion] = useState<string | null>(
    questions.length > 0 ? questions[0].id : null
  );

  // Check if all questions are answered
  const allQuestionsAnswered = questions.every(q => q.answer.trim() !== '');

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-xl font-semibold mb-4">Generating tailored follow-up questions...</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-2">Please answer these follow-up questions</h2>
      <p className="text-gray-600 mb-6">
        These questions are tailored to your specific content idea and will help create more focused, 
        relevant research and content. Your answers will guide the AI in understanding your goals and preferences.
      </p>
      
      <div className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              className={`w-full p-4 text-left font-medium flex justify-between items-center ${
                activeQuestion === question.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-white'
              }`}
              onClick={() => setActiveQuestion(activeQuestion === question.id ? null : question.id)}
            >
              <span>{question.text}</span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  activeQuestion === question.id ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {activeQuestion === question.id && (
              <div className="p-4 bg-gray-50">
                <textarea
                  value={question.answer}
                  onChange={(e) => onAnswerChange(question.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-3 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none bg-gray-900 text-white placeholder-gray-400"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="pt-6">
        <button
          onClick={onContinue}
          disabled={!allQuestionsAnswered}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
        >
          {allQuestionsAnswered ? 'Continue to Deep Research' : 'Please answer all questions to continue'}
        </button>
      </div>
    </div>
  );
} 