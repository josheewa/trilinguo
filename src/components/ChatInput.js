import React from 'react'

export default function ChatInput({
  settings,
  suggestions,
  input,
  setInput,
  setSuggestions,
  handleSubmit,
  inputRef,
}) {
  return (
    <div className="flex-shrink-0 relative z-10 max-w-4xl mx-auto w-full p-4 chat-input-safe-area" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}>
      {/* Predictive Text Suggestions */}
      {settings.enablePredictiveText &&
        suggestions.length > 0 &&
        input.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => {
              // Ensure suggestion still starts with the current input before rendering
              if (!suggestion.toLowerCase().startsWith(input.toLowerCase())) {
                return null
              }
              const remainingPart = suggestion.slice(input.length)

              return (
                <button
                  key={index}
                  onClick={() => {
                    setInput(suggestion)
                    setSuggestions([])
                    inputRef.current?.focus()
                  }}
                  className="glass-button px-3 py-1.5 text-gray-200 text-xs rounded-full cursor-pointer flex items-baseline"
                >
                  <span className="opacity-60 whitespace-pre-wrap">{input}</span>
                  <span className="font-medium text-blue-300 whitespace-pre-wrap">
                    {remainingPart}
                  </span>
                </button>
              )
            })}
          </div>
        )}

      <form
        onSubmit={handleSubmit}
        className="glass-surface rounded-3xl focus-within:border-blue-400/50 focus-within:shadow-lg focus-within:shadow-blue-500/25 transition-all duration-200 p-4"
        style={{ 
          minHeight: '64px',
          marginBottom: '8px'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-h-0 flex items-center">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // Auto-resize functionality
                const textarea = e.target
                textarea.style.height = 'auto'
                const newHeight = Math.min(textarea.scrollHeight, 240) // ~10 lines max
                textarea.style.height = `${newHeight}px`
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              placeholder="Say something..."
              className="w-full bg-transparent text-white placeholder-gray-300 resize-none border-none outline-none text-sm leading-relaxed min-h-[32px] max-h-[240px]"
              rows="1"
              style={{
                height: '32px',
                lineHeight: '1.5',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-12 h-12 glass-button-primary disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl transition-all duration-200 flex-shrink-0 flex items-center justify-center group"
          >
            <svg
              className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              ></path>
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
} 