import React, { useState } from 'react';

export function QuizModal({ quiz, onClose, onAnswer }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    
    // Small delay to show the loading state
    setTimeout(() => {
      const isCorrect = selectedOption === quiz.answer;
      onAnswer(isCorrect, selectedOption);
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Knowledge Check</h3>
            <div className="flex items-center">
              <span className="text-xs bg-indigo-800 px-2 py-1 rounded-full mr-2">Quiz</span>
              <button 
                onClick={onClose}
                className="text-white hover:text-indigo-200 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">{quiz.question}</h4>
          
          <div className="space-y-2 mb-6">
            {quiz.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className={`w-full text-left px-4 py-3 rounded-lg transition duration-150 border ${
                  selectedOption === option 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                    : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-3 ${
                    selectedOption === option ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Hint section */}
          {quiz.hint && (
            <div className="mb-4">
              <button 
                onClick={() => setShowHint(!showHint)}
                className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              
              {showHint && (
                <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
                  {quiz.hint}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Choose the best answer
          </div>
          <button
            type="button"
            disabled={!selectedOption || isSubmitting}
            className={`px-4 py-2 rounded-md font-medium text-white ${
              !selectedOption || isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </span>
            ) : (
              'Submit Answer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}