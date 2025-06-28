import React from 'react'

const MessageBubble = ({ message, ...props }) => {
  if (message.role === 'user') {
    return <UserMessageBubble message={message} {...props} />
  }
  return <AssistantMessageBubble message={message} {...props} />
}

const UserMessageBubble = ({ message, index, messages, uiState, handleSubmit }) => (
  <div className="flex w-full justify-end items-end mb-3">
    <div className="max-w-[80%] sm:max-w-xs lg:max-w-md px-4 py-3 relative glass-bubble-user text-white rounded-[20px_20px_4px_20px]">
      <div>
        <p className="text-sm sm:text-sm leading-relaxed">{message.content}</p>
        {/* Retry button for user messages with no response (but not while loading) */}
        {index === messages.length - 1 && !uiState.isLoading && (
          <div className="mt-2 pt-2 border-t border-blue-500">
            <button
              onClick={() => handleSubmit(null, index)}
              disabled={uiState.retryingMessageIndex === index}
              className="inline-flex items-center text-xs text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              {uiState.retryingMessageIndex === index ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-200 mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    ></path>
                  </svg>
                  Retry sending
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)

const AssistantMessageBubble = ({ message, index, uiState, currentLanguage, showRomanization, showEnglish, handleSubmit, updateUiState }) => (
  <div className="flex w-full justify-start items-end mb-3">
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentLanguage.personality.color} flex items-center justify-center mr-2 mb-1 glass-surface`}>
      <span className="text-white text-sm">{currentLanguage.personality.avatar}</span>
    </div>
    <div className="max-w-[80%] sm:max-w-xs lg:max-w-md px-4 py-3 relative glass-bubble-assistant text-white rounded-[20px_20px_20px_4px]">
      <div className="space-y-2 sm:space-y-3">
        <div className="text-xs text-gray-400 font-medium">{currentLanguage.personality.name}</div>
        {!message.content ? (
          <span className="text-base sm:text-lg font-medium text-red-400">[Message content missing]</span>
        ) : (
          <>
            <div className="flex flex-wrap items-end leading-relaxed">
              {message.content.characters && Array.isArray(message.content.characters) ? (
                message.content.characters.map((obj, i) => (
                  <div
                    key={i}
                    className={
                      (obj.romanization || obj.pinyin) && showRomanization && obj.text.trim()
                        ? 'flex flex-col items-center mx-0.5 min-w-0'
                        : 'flex items-end mx-0.5'
                    }
                  >
                    {(obj.romanization || obj.pinyin) && showRomanization && obj.text.trim() && (
                      <span className="text-xs text-gray-400 mb-0.5 font-mono leading-none text-center whitespace-nowrap">
                        {obj.romanization || obj.pinyin}
                      </span>
                    )}
                    <span className="text-base sm:text-lg font-medium leading-none">{obj.text || ''}</span>
                  </div>
                ))
              ) : message.content.text ? (
                <span className="text-base sm:text-lg font-medium leading-relaxed">{message.content.text}</span>
              ) : (
                <span className="text-base sm:text-lg font-medium text-red-400 leading-relaxed">
                  [Error displaying message]
                </span>
              )}
            </div>

            {message.isError && (
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleSubmit(null, index - 1)} // Retry the previous user message
                  disabled={uiState.retryingMessageIndex === index - 1}
                  className="glass-button-danger inline-flex items-center px-3 py-1.5 text-xs text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uiState.retryingMessageIndex === index - 1 ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        ></path>
                      </svg>
                      Retry
                    </>
                  )}
                </button>
              </div>
            )}

            {message.content.culturalContext && (
              <button
                onClick={() => updateUiState({ culturalContextModal: message.content.culturalContext })}
                className="inline-flex items-center text-xs text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Cultural Context
              </button>
            )}

            {showEnglish && message.content.english && (
              <div className="pt-2 border-t border-gray-600">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{message.content.english}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)

const TypingIndicator = ({ currentLanguage }) => (
  <div className="flex w-full justify-start items-end mb-3">
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentLanguage.personality.color} flex items-center justify-center mr-2 mb-1 glass-surface`}>
      <span className="text-white text-sm">{currentLanguage.personality.avatar}</span>
    </div>
    <div className="max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 relative glass-bubble-assistant text-white rounded-[20px_20px_20px_4px]">
      <div className="text-xs text-gray-300 font-medium mb-2">{currentLanguage.personality.name}</div>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        ></div>
        <div
          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        ></div>
      </div>
    </div>
  </div>
)

export default function ChatHistory({
  messages,
  uiState,
  currentLanguage,
  showRomanization,
  showEnglish,
  handleSubmit,
  updateUiState,
  messagesEndRef,
}) {
  return (
    <>
      {messages.map((message, index) => (
        <MessageBubble
          key={index}
          index={index}
          message={message}
          messages={messages}
          uiState={uiState}
          currentLanguage={currentLanguage}
          showRomanization={showRomanization}
          showEnglish={showEnglish}
          handleSubmit={handleSubmit}
          updateUiState={updateUiState}
        />
      ))}

      {uiState.isLoading && <TypingIndicator currentLanguage={currentLanguage} />}
      <div ref={messagesEndRef} />
    </>
  )
} 