import React from 'react';

export function JustificationModal({ isLoading, justification, wrongAnswer, isQuiz, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
        {/* Header with different colors for quiz vs poll */}
        <div className={`px-6 py-4 ${isQuiz ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
          <h3 className="text-lg font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isQuiz ? 'Incorrect Answer' : 'Feedback on Your Response'}
          </h3>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Generating feedback...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-500 font-medium">Your answer:</p>
                <p className="font-medium text-red-600">{wrongAnswer}</p>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <h4 className="text-base font-bold text-gray-800 mb-2">Explanation:</h4>
                <div className="text-gray-700 mb-4 leading-relaxed">
                  {justification}
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      {isQuiz 
                        ? "Don't worry! Learning from mistakes is part of the process." 
                        : "Thanks for your perspective! This feedback might help you understand the topic better."}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-right">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            onClick={onClose}
          >
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  );
}