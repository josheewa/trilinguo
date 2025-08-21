import React from 'react'

/** Landing screen with suggested prompts per language. */
export default function WelcomeScreen({
  currentLanguage,
  loadingStarters,
  conversationStarters,
  handleStarterClick,
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 glass-button-primary rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg">
        <span className="text-white font-bold text-xl sm:text-2xl drop-shadow-md">三</span>
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
        Welcome to Trilinguo
      </h2>
      <p className="text-sm sm:text-base text-gray-700 max-w-md mb-6">
        Start a conversation to practice {currentLanguage.name} with{' '}
        {currentLanguage.personality.name}.
        {currentLanguage.hasRomanization &&
          ' Your messages will include romanization guides.'}
      </p>

      {/* Conversation Starters */}
      <div className="w-full max-w-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested prompts</h3>
        {loadingStarters ? (
          <div className="grid grid-cols-1 gap-3">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="glass-surface-subtle px-4 py-3 rounded-2xl animate-pulse"
              >
                <div
                  className={`h-4 bg-gray-400/30 rounded-md ${
                    index === 0
                      ? 'w-48'
                      : index === 1
                      ? 'w-40'
                      : index === 2
                      ? 'w-44'
                      : 'w-36'
                  }`}
                ></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {conversationStarters.map((starter, index) => (
              <button
                key={index}
                onClick={() => handleStarterClick(starter)}
                className="glass-button text-left px-4 py-3 rounded-2xl text-sm text-gray-700 cursor-pointer transition-all duration-300"
              >
                {starter}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 