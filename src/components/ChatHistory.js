import React from 'react'
import { useAudioCache } from '../lib/useAudioCache'

const AudioButton = ({ message, messageId, currentLanguage, audioControls }) => {
  const { playAudio, stopAudio, isLoading, isPlaying, getError } = audioControls
  const loading = isLoading(messageId)
  const playing = isPlaying(messageId)
  const error = getError(messageId)

  const handleClick = () => {
    if (playing) {
      stopAudio(messageId)
    } else {
      playAudio(message.content, currentLanguage.code, messageId)
    }
  }

  const handleKeyDown = (e) => {
    // Support Enter and Space keys for activation
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const getTooltip = () => {
    if (error) return error
    if (loading) return 'Generating audio...'
    if (playing) return 'Stop audio'
    return 'Play audio'
  }

  const getButtonClass = () => {
    if (error) return "glass-button text-red-400 hover:text-red-300 p-1.5 rounded-lg transition-colors disabled:opacity-50 relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
    return "glass-button text-gray-300 hover:text-white p-1.5 rounded-lg transition-colors disabled:opacity-50 relative z-10 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
  }

  const getAriaLabel = () => {
    const languageName = currentLanguage.name
    if (error) return `Error playing ${languageName} audio: ${error}`
    if (loading) return `Generating ${languageName} audio, please wait`
    if (playing) return `Stop playing ${languageName} audio`
    return `Play ${languageName} audio for this message`
  }

  const getAriaDescription = () => {
    if (loading) return 'Audio is being generated'
    if (playing) return 'Audio is currently playing'
    if (error) return 'Audio generation failed, click to retry'
    return 'Click to play text-to-speech audio for this message'
  }

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={loading}
      className={getButtonClass()}
      title={getTooltip()}
      aria-label={getAriaLabel()}
      aria-describedby={`audio-status-${messageId}`}
      aria-pressed={playing}
      role="button"
      tabIndex={0}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b border-gray-300"></div>
      ) : error ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : playing ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.775L6.416 15H4a1 1 0 01-1-1V6a1 1 0 011-1h2.416l1.967-1.776a1 1 0 011.617.776zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      )}
      {/* Hidden status for screen readers */}
      <span 
        id={`audio-status-${messageId}`}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {getAriaDescription()}
      </span>
    </button>
  )
}

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

const AssistantMessageBubble = ({ message, index, uiState, currentLanguage, showRomanization, showEnglish, handleSubmit, updateUiState, audioControls }) => (
  <div className="flex w-full justify-start items-end mb-3">
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentLanguage.personality.color} flex items-center justify-center mr-2 mb-1 glass-surface`}>
      <span className="text-white text-sm">{currentLanguage.personality.avatar}</span>
    </div>
    <div className="max-w-[80%] sm:max-w-xs lg:max-w-md px-4 py-3 relative glass-bubble-assistant text-white rounded-[20px_20px_20px_4px]">
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-200 font-medium">{currentLanguage.personality.name}</div>
          {/* Audio button - only show for non-error messages with non-English content */}
          {!message.isError && message.content && (
            (message.content.characters && Array.isArray(message.content.characters) && message.content.characters.length > 0) ||
            (message.content.text && message.content.english !== null)
          ) && (
            <AudioButton 
              message={message}
              messageId={`msg-${index}`}
              currentLanguage={currentLanguage}
              audioControls={audioControls}
            />
          )}
        </div>
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
                      <span className="text-xs text-gray-200 mb-0.5 font-mono leading-none text-center whitespace-nowrap">
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
                className="inline-flex items-center text-xs text-gray-200 hover:text-blue-400 transition-colors cursor-pointer"
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
  const audioControls = useAudioCache()
  
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
          audioControls={audioControls}
        />
      ))}

      {uiState.isLoading && <TypingIndicator currentLanguage={currentLanguage} />}
      <div ref={messagesEndRef} />
    </>
  )
} 