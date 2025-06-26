import Image from 'next/image'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import { useState, useEffect } from 'react'

const inter = Inter({
  subsets: ['latin'],
})

const convertPinyin = (pinyin) => {
  const vowelRegex = /[aeiou]/

  words = pinyin.split(' ')
  result = []

  words.map((word) => {
    const tone = Number(word.slice(-1)) - 1
    const wordWithoutTone = word.slice(0, -1)

    // bad tone
    if (tone < 0 || tone > 4) {
      result.push(wordWithoutTone)
    }
    
  })
  return result.join(' ')
}

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [showEnglish, setShowEnglish] = useState(true)
  const [showPinyin, setShowPinyin] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')

  useEffect(() => {
    const authStatus = localStorage.getItem('trilinguo-auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    // Set your secret password here
    if (passwordInput === 'trilinguo2024') {
      setIsAuthenticated(true)
      localStorage.setItem('trilinguo-auth', 'authenticated')
      setPasswordInput('')
    } else {
      alert('Incorrect password')
      setPasswordInput('')
    }
  }

  // Password screen - show this if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Trilinguo - Access Required</title>
          <meta name="description" content="Access required for Trilinguo chat app." />
        </Head>
        <div className={`${inter.className} flex items-center justify-center min-h-screen bg-gray-900`}>
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">三</span>
              </div>
              <h1 className="text-xl font-semibold text-white">Access Required</h1>
              <p className="text-gray-400 mt-2">Enter the access code to continue</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter access code"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Access Trilinguo
              </button>
            </form>
          </div>
        </div>
      </>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const apiMessages = messages.map((msg) => ({
      role: msg.role,
      content:
        typeof msg.content === 'object'
          ? `chinese: ${msg.content.chinese.map((obj) => obj.text).join('')} english: ${msg.content.english}`
          : msg.content,
    }))

    const newMessages = [...messages, { role: 'user', content: input }]
    const newApiMessages = [...apiMessages, { role: 'user', content: input }]
    console.log(newApiMessages)
    setMessages(newMessages)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newApiMessages }),
    })
    const data = await response.json()

    setMessages([...newMessages, { role: 'assistant', content: data.output }])
    console.log(newMessages)
    setInput('')
  }

  return (
    <>
      <Head>
        <title>Trilinguo</title>
        <meta name="description" content="Trilinguo is a chat duolingo app." />
      </Head>
      
      {/* Main App Container */}
      <div className={`${inter.className} flex flex-col h-screen bg-gray-900 text-white`}>
        
        {/* Header/Menu Bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">T</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold">Trilinguo</h1>
          </div>
          
          {/* Menu Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showPinyin 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              拼
            </button>
            
            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showEnglish 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              EN
            </button>
            
            {/* Menu dots for future options */}
            <button className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-white font-bold text-xl sm:text-2xl">三</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">Welcome to Trilinguo</h2>
                <p className="text-sm sm:text-base text-gray-500 max-w-md">Start a conversation to practice Chinese with AI assistance. Your messages will be translated and include pinyin pronunciation guides.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex w-full ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white border border-gray-700'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm sm:text-sm leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {/* Chinese Characters with Pinyin */}
                        <div className="flex flex-wrap gap-0.5 sm:gap-1 items-end">
                          {message.content.chinese.map((obj, index) => (
                            <div key={index} className={obj.pinyin && showPinyin ? "flex flex-col items-center" : "flex items-end"}>
                              {obj.pinyin && showPinyin && (
                                <span className="text-xs text-gray-400 mb-1 font-mono">
                                  {obj.pinyin}
                                </span>
                              )}
                              <span className="text-lg sm:text-xl font-medium">{obj.text}</span>
                            </div>
                          ))}
                        </div>
                        
                        {/* English Translation */}
                        {showEnglish && (
                          <div className="pt-2 border-t border-gray-600">
                            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                              {message.content.english}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="bg-gray-800 px-3 sm:px-4 py-3 sm:py-4">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3 bg-gray-700 rounded-3xl p-2 sm:p-3 border border-gray-600 focus-within:border-blue-500 transition-colors">
              <div className="flex-1 min-h-0">
                <textarea
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
                  placeholder="Type your message..."
                  className="w-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none text-sm sm:text-base leading-relaxed py-2 px-2 sm:px-3 min-h-[20px] max-h-[240px]"
                  rows="1"
                  style={{
                    height: '20px',
                    lineHeight: '1.5'
                  }}
                />
              </div>
              
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full transition-all duration-200 flex-shrink-0 flex items-center justify-center group"
              >
                <svg 
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white transform group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
