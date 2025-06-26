import Image from 'next/image'
import { Inter } from 'next/font/google'
import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'

const inter = Inter({
  subsets: ['latin'],
})

// Language configurations and personalities
const LANGUAGES = {
  'zh-tw': {
    code: 'zh-tw',
    name: 'Traditional Chinese',
    displayName: '繁體中文',
    hasRomanization: true,
    romanizationLabel: '拼',
    romanizationName: 'pinyin',
    personality: {
      name: '小美 (Xiǎo Měi)',
      description: 'Energetic 22-year-old Taiwanese university student studying in Taipei. Loves exploring night markets, trying new bubble tea flavors, and follows Taiwanese YouTubers and influencers. Uses modern Taiwanese Mandarin with local expressions like "超棒" and "真的假的". Familiar with Taiwanese pop culture, K-dramas, and social media trends. Has a warm, encouraging personality and often shares cultural insights about Taiwan.',
      avatar: '👩',
      color: 'from-pink-400 to-rose-500'
    }
  },
  'zh-cn': {
    code: 'zh-cn',
    name: 'Simplified Chinese',
    displayName: '简体中文',
    hasRomanization: true,
    romanizationLabel: '拼',
    romanizationName: 'pinyin',
    personality: {
      name: '小明 (Xiǎo Míng)',
      description: 'Tech-savvy 23-year-old from Beijing, computer science student. Always up-to-date with the latest apps, games, and internet memes. Uses contemporary mainland slang like "绝绝子", "YYDS", and "躺平". Active on WeChat, Weibo, and Douyin. Loves discussing technology, urban lifestyle, and modern Chinese culture. Has a witty, slightly sarcastic humor typical of young Beijingers.',
      avatar: '👨',
      color: 'from-blue-400 to-cyan-500'
    }
  },
  'ja': {
    code: 'ja',
    name: 'Japanese',
    displayName: '日本語',
    hasRomanization: true,
    romanizationLabel: 'あ',
    romanizationName: 'romaji',
    personality: {
      name: 'さくら (Sakura)',
      description: '21-year-old Tokyo university student majoring in literature. Passionate about anime, manga, and kawaii culture. Uses casual Japanese with friends but knows when to switch to polite keigo. Loves Harajuku fashion, Studio Ghibli films, and seasonal activities like hanami and matsuri. Uses expressions like "やばい", "かわいい", and "お疲れ様". Always excited to share Japanese cultural nuances and seasonal traditions.',
      avatar: '👩',
      color: 'from-purple-400 to-pink-500'
    }
  },
  'ko': {
    code: 'ko',
    name: 'Korean',
    displayName: '한국어',
    hasRomanization: true,
    romanizationLabel: '한',
    romanizationName: 'romanization',
    personality: {
      name: '지민 (Jimin)',
      description: '20-year-old Seoul university student, huge K-pop and K-drama enthusiast. Follows latest Korean beauty trends, loves Korean BBQ, and is always updated on idol news. Uses modern Korean with aegyo expressions, internet slang like "대박", "헐", and cute endings like "요". Familiar with Korean gaming culture, webtoons, and social media platforms like KakaoTalk and Instagram. Has a bubbly, enthusiastic personality.',
      avatar: '👩',
      color: 'from-green-400 to-emerald-500'
    }
  },
  'fr': {
    code: 'fr',
    name: 'French',
    displayName: 'Français',
    hasRomanization: false,
    romanizationLabel: null,
    romanizationName: null,
    personality: {
      name: 'Léa',
      description: '22-year-old Parisian literature student with a passion for cinema and philosophy. Spends time in cafés discussing films, books, and politics. Uses contemporary French with some verlan and modern expressions like "c\'est ouf", "grave", and "tranquille". Loves French New Wave cinema, indie music, and weekend trips to art galleries. Has an intellectual yet playful personality, often making cultural references to French literature and cinema.',
      avatar: '👩',
      color: 'from-amber-400 to-orange-500'
    }
  }
}

// Future regional variants to implement later
// TODO: Add regional toggles for:
// - Chinese: China/Hong Kong/Singapore
// - Japanese: Tokyo/Osaka
// - French: France/Quebec

// localStorage utilities
const StorageKeys = {
  AUTH: 'trilinguo-auth',
  SETTINGS: 'trilinguo-settings',
  CHAT_PREFIX: 'trilinguo-chat-'
}

const defaultSettings = {
  currentLanguage: 'zh-tw',
  showEnglish: true,
  showRomanization: true,
  enablePredictiveText: false
}

const loadSettings = () => {
  try {
    const stored = localStorage.getItem(StorageKeys.SETTINGS)
    return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
  } catch (error) {
    console.error('Error loading settings:', error)
    return defaultSettings
  }
}

const saveSettings = (settings) => {
  try {
    localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving settings:', error)
  }
}

const loadChatHistory = (languageCode) => {
  try {
    const stored = localStorage.getItem(StorageKeys.CHAT_PREFIX + languageCode)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

const saveChatHistory = (languageCode, messages) => {
  try {
    localStorage.setItem(StorageKeys.CHAT_PREFIX + languageCode, JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}

const clearChatHistory = (languageCode) => {
  try {
    localStorage.removeItem(StorageKeys.CHAT_PREFIX + languageCode)
  } catch (error) {
    console.error('Error clearing chat history:', error)
  }
}

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
  // Enhanced state management
  const [settings, setSettings] = useState(defaultSettings)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  
  // New UI state
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [conversationStarters, setConversationStarters] = useState([])
  const [loadingStarters, setLoadingStarters] = useState(false)
  const [culturalContextModal, setCulturalContextModal] = useState(null)
  const [predictiveSuggestions, setPredictiveSuggestions] = useState([])
  const [showPredictions, setShowPredictions] = useState(false)
  const [retryingMessageIndex, setRetryingMessageIndex] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false)
  
  // Refs for dropdowns
  const languageDropdownRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const inputRef = useRef(null)

  // Derived state from settings
  const currentLanguage = LANGUAGES[settings.currentLanguage]
  const showEnglish = settings.showEnglish
  const showRomanization = settings.showRomanization && currentLanguage.hasRomanization

  // Initialize settings and chat history on mount
  useEffect(() => {
    const authStatus = localStorage.getItem(StorageKeys.AUTH)
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }

    // Load settings
    const loadedSettings = loadSettings()
    setSettings(loadedSettings)
    
    // Load chat history for current language
    const chatHistory = loadChatHistory(loadedSettings.currentLanguage)
    setMessages(chatHistory)
  }, [])

  // Load conversation starters when language changes
  useEffect(() => {
    if (isAuthenticated) {
      loadConversationStarters()
    }
  }, [settings.currentLanguage, isAuthenticated])

  // Save chat history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(settings.currentLanguage, messages)
    }
  }, [messages, settings.currentLanguage])

  // Close dropdowns when clicking outside and handle escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false)
      }
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setShowLanguageDropdown(false)
        setShowMobileMenu(false)
        setCulturalContextModal(null)
        setShowClearConfirmModal(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  // Predictive text debouncing
  useEffect(() => {
    if (!settings.enablePredictiveText || input.length < 2) {
      setPredictiveSuggestions([])
      setShowPredictions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: input,
            language: settings.currentLanguage,
            context: messages.slice(-3)
          })
        })
        const data = await response.json()
        if (data.suggestions && data.suggestions.length > 0) {
          setPredictiveSuggestions(data.suggestions)
          setShowPredictions(true)
        } else {
          setShowPredictions(false)
        }
      } catch (error) {
        console.error('Predictive text error:', error)
        setShowPredictions(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [input, settings.currentLanguage, settings.enablePredictiveText, messages])

  // Update settings helper
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    saveSettings(updatedSettings)
  }

  // Load conversation starters
  const loadConversationStarters = async (force = false) => {
    if (messages.length > 0 && !force) return // Don't load if chat already has messages
    
    setLoadingStarters(true)
    try {
      const response = await fetch('/api/conversation-starters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: settings.currentLanguage,
          count: 4
        })
      })
      const data = await response.json()
      setConversationStarters(data.starters || [])
    } catch (error) {
      console.error('Error loading conversation starters:', error)
      setConversationStarters([])
    }
    setLoadingStarters(false)
  }

  // Handle language switching
  const handleLanguageChange = (languageCode) => {
    // Save current chat history
    if (messages.length > 0) {
      saveChatHistory(settings.currentLanguage, messages)
    }
    
    // Load chat history for new language
    const newChatHistory = loadChatHistory(languageCode)
    setMessages(newChatHistory)
    
    // Update settings
    updateSettings({ currentLanguage: languageCode })
    
    // Close dropdowns
    setShowLanguageDropdown(false)
    setShowMobileMenu(false)
  }

  // Handle clearing chat for current language
  const handleClearChat = () => {
    if (messages.length === 0) {
      setShowMobileMenu(false)
      return
    }
    
    setShowClearConfirmModal(true)
  }

  // Confirm clear chat
  const confirmClearChat = () => {
    setMessages([])
    clearChatHistory(settings.currentLanguage)
    setShowMobileMenu(false)
    setShowClearConfirmModal(false)
    loadConversationStarters(true) // Force reload starters after clearing
  }

  // Handle conversation starter click
  const handleStarterClick = async (starter) => {
    setInput(starter)
    // Auto-send the message
    const syntheticEvent = { preventDefault: () => {} }
    await handleSubmit(syntheticEvent, null, starter)
  }

  // Handle predictive suggestion click
  const handlePredictionClick = (suggestion) => {
    setInput(input + suggestion)
    setShowPredictions(false)
    inputRef.current?.focus()
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    // Set your secret password here
    if (passwordInput === 'trilinguo2024') {
      setIsAuthenticated(true)
      localStorage.setItem(StorageKeys.AUTH, 'authenticated')
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

  const handleSubmit = async (e, retryIndex = null, messageContent = null) => {
    e?.preventDefault()

    let newMessages, newApiMessages, userMessage

    if (retryIndex !== null) {
      // Retrying a specific message
      setRetryingMessageIndex(retryIndex)
      userMessage = messages[retryIndex].content
      
      // Get messages up to retry point (excluding failed assistant response)
      const messagesUpToRetry = messages.slice(0, retryIndex + 1)
      newMessages = messagesUpToRetry
      
      // Convert to API format
      newApiMessages = messagesUpToRetry
        .filter(msg => msg.role === 'user' || !msg.isError) // Remove error messages
        .map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'object' 
            ? (() => {
                // Handle different message content structures
                let languageText = ''
                if (msg.content.characters && Array.isArray(msg.content.characters)) {
                  languageText = msg.content.characters.map(obj => obj.text).join('')
                } else if (msg.content.chinese && Array.isArray(msg.content.chinese)) {
                  languageText = msg.content.chinese.map(obj => obj.text).join('')
                } else if (msg.content.text) {
                  languageText = msg.content.text
                }
                
                const englishText = msg.content.english || ''
                return `${currentLanguage.name.toLowerCase()}: ${languageText} english: ${englishText}`
              })()
            : msg.content,
        }))
    } else {
      // New message
      userMessage = messageContent || input
      
      const apiMessages = messages
        .filter(msg => !msg.isError) // Remove error messages from history
        .map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'object' 
            ? (() => {
                // Handle different message content structures
                let languageText = ''
                if (msg.content.characters && Array.isArray(msg.content.characters)) {
                  languageText = msg.content.characters.map(obj => obj.text).join('')
                } else if (msg.content.chinese && Array.isArray(msg.content.chinese)) {
                  languageText = msg.content.chinese.map(obj => obj.text).join('')
                } else if (msg.content.text) {
                  languageText = msg.content.text
                }
                
                const englishText = msg.content.english || ''
                return `${currentLanguage.name.toLowerCase()}: ${languageText} english: ${englishText}`
              })()
            : msg.content,
        }))

      newMessages = [...messages, { role: 'user', content: userMessage }]
      newApiMessages = [...apiMessages, { role: 'user', content: userMessage }]
      setMessages(newMessages)
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newApiMessages,
          language: settings.currentLanguage,
          personality: currentLanguage.personality 
        }),
      })
      const data = await response.json()

      if (data.error) {
        console.error('API Error:', data.error)
        const errorMessage = { 
          role: 'assistant', 
          content: { 
            text: 'Sorry, there was an error processing your message. Please try again.',
            english: 'Sorry, there was an error processing your message. Please try again.'
          },
          isError: true
        }
        setMessages([...newMessages, errorMessage])
      } else if (data.output) {
        setMessages([...newMessages, { role: 'assistant', content: data.output }])
      } else {
        console.error('Unexpected API response format:', data)
        const errorMessage = { 
          role: 'assistant', 
          content: { 
            text: 'Received an unexpected response format. Please try again.',
            english: 'Received an unexpected response format. Please try again.'
          },
          isError: true
        }
        setMessages([...newMessages, errorMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: { 
          text: 'Sorry, I encountered an error. Please check your connection and try again.',
          english: 'Sorry, I encountered an error. Please check your connection and try again.'
        },
        isError: true
      }
      setMessages([...newMessages, errorMessage])
    }
    
    if (retryIndex === null && !messageContent) {
      setInput('')
    } else if (messageContent) {
      setInput('') // Clear input when using messageContent (starter)
    }
    setIsLoading(false)
    setRetryingMessageIndex(null)
  }

  return (
    <>
      <Head>
        <title>Trilinguo</title>
        <meta name="description" content="Trilinguo is a chat duolingo app." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      
      {/* Main App Container */}
      <div className={`${inter.className} flex flex-col h-screen relative text-white overflow-hidden`}>
        {/* Liquid Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-purple-500/5 to-transparent"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        {/* Header/Menu Bar */}
        <header className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl bg-white/5 border-b border-white/10 z-10">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">T</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold">Trilinguo</h1>
            
            {/* Language Dropdown - Desktop */}
            <div className="relative hidden sm:block" ref={languageDropdownRef}>
              <button
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 shadow-lg"
              >
                <span className="text-sm text-gray-300">{currentLanguage.displayName}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              {showLanguageDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl z-50">
                  {Object.values(LANGUAGES).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-5 py-3 hover:bg-white/20 transition-all duration-200 first:rounded-t-xl last:rounded-b-xl ${
                        settings.currentLanguage === lang.code ? 'bg-white/20 text-blue-300' : 'text-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="whitespace-nowrap">{lang.name}</span>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{lang.displayName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Menu Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Romanization Toggle - only show if current language supports it */}
            {currentLanguage.hasRomanization && (
                          <button
              onClick={() => updateSettings({ showRomanization: !showRomanization })}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 backdrop-blur-sm border shadow-lg ${
                showRomanization 
                  ? 'bg-emerald-500/90 text-white border-emerald-400/60 shadow-emerald-500/30' 
                  : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
              }`}
            >
                {currentLanguage.romanizationLabel}
              </button>
            )}
            
            <button
              onClick={() => updateSettings({ showEnglish: !showEnglish })}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 backdrop-blur-sm border shadow-lg ${
                showEnglish 
                  ? 'bg-cyan-500/90 text-white border-cyan-400/60 shadow-cyan-500/30' 
                  : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
              }`}
            >
              EN
            </button>

            {/* Clear Chat Button - Desktop */}
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-sm bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white border border-red-400/30 transition-all duration-200 shadow-lg"
                title="Clear Chat History"
              >
                <span>✕</span>
                <span>Clear</span>
              </button>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="sm:hidden p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Slide-out Menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
            <div 
              ref={mobileMenuRef}
              className="fixed left-0 top-0 h-full w-64 backdrop-blur-xl bg-gradient-to-b from-white/15 via-white/10 to-white/5 border-r border-white/20 transform transition-transform shadow-2xl"
            >
              <div className="p-4 border-b border-white/20 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white">Language & Settings</h2>
              </div>
              
              {/* Language Selection */}
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Choose Language</h3>
                <div className="space-y-2">
                  {Object.values(LANGUAGES).map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm border shadow-lg ${
                        settings.currentLanguage === lang.code 
                          ? 'bg-gradient-to-r from-blue-500/80 to-cyan-500/80 text-white border-blue-400/50 shadow-blue-500/25' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20 border-white/20 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-xs opacity-80">{lang.displayName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Settings */}
              <div className="p-4 border-t border-white/20">
                <h3 className="text-sm font-medium text-gray-300 mb-3">Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-3">
                    <span className="text-sm text-gray-200 font-medium">Predictive Text</span>
                    <button
                      onClick={() => updateSettings({ enablePredictiveText: !settings.enablePredictiveText })}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-all duration-200 backdrop-blur-sm border shadow-lg ${
                        settings.enablePredictiveText 
                          ? 'bg-gradient-to-r from-emerald-500/90 to-emerald-600/90 border-emerald-400/50 shadow-emerald-500/25' 
                          : 'bg-white/20 border-white/30'
                      }`}
                    >
                      <span className={`inline-block w-4 h-4 rounded-full bg-white transform transition-transform shadow-lg ${
                        settings.enablePredictiveText ? 'translate-x-6' : 'translate-x-1'
                      } mt-1`} />
                    </button>
                  </label>
                  
                  {messages.length > 0 && (
                    <button
                      onClick={handleClearChat}
                      className="w-full text-left px-4 py-3 rounded-xl backdrop-blur-sm bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/30 hover:to-red-600/30 text-red-200 hover:text-white transition-all duration-200 border border-red-400/30 hover:border-red-300/50 shadow-lg"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Clear Chat History
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Container */}
        <div className="relative flex-1 flex flex-col max-w-4xl mx-auto w-full z-10">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-white font-bold text-xl sm:text-2xl">三</span>
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">Welcome to Trilinguo</h2>
                <p className="text-sm sm:text-base text-gray-500 max-w-md mb-6">
                  Start a conversation to practice {currentLanguage.name} with {currentLanguage.personality.name}. 
                  {currentLanguage.hasRomanization && ' Your messages will include romanization guides.'}
                </p>
                
                {/* Conversation Starters */}
                <div className="w-full max-w-md">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Starters</h3>
                  {loadingStarters ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {conversationStarters.map((starter, index) => (
                        <button
                          key={index}
                          onClick={() => handleStarterClick(starter)}
                          className="text-left px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl text-sm text-gray-300 transition-all duration-200 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex w-full ${
                      message.role === 'user' ? 'justify-end' : 'justify-start items-end'
                    } mb-3`}
                  >
                    {/* Assistant Profile Picture */}
                    {message.role === 'assistant' && (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentLanguage.personality.color} flex items-center justify-center mr-2 mb-1 shadow-lg backdrop-blur-sm`}>
                        <span className="text-white text-sm">{currentLanguage.personality.avatar}</span>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 relative backdrop-blur-xl border shadow-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500/90 to-blue-600/90 text-white border-blue-400/30 rounded-[20px_20px_4px_20px]'
                        : 'bg-white/10 text-white border-white/20 rounded-[20px_20px_20px_4px]'
                    }`}
                  >
                  {message.role === 'user' ? (
                    <div>
                      <p className="text-sm sm:text-sm leading-relaxed">{message.content}</p>
                      {/* Retry button for user messages with no response (but not while loading) */}
                      {index === messages.length - 1 && messages[index]?.role === 'user' && !isLoading && (
                        <div className="mt-2 pt-2 border-t border-blue-500">
                          <button
                            onClick={() => handleSubmit(null, index)}
                            disabled={retryingMessageIndex === index}
                            className="inline-flex items-center text-xs text-blue-200 hover:text-white transition-colors"
                          >
                            {retryingMessageIndex === index ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-200 mr-2"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                                Retry sending
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {/* Assistant Name */}
                        <div className="text-xs text-gray-400 font-medium">
                          {currentLanguage.personality.name}
                        </div>
                        
                        {/* Check if message content exists */}
                        {!message.content ? (
                          <span className="text-lg sm:text-xl font-medium text-red-400">
                            [Message content missing]
                          </span>
                        ) : (
                          <>
                            {/* Language Characters with Romanization */}
                            <div className="flex flex-wrap gap-0.5 sm:gap-1 items-end">
                              {/* Handle different response formats with defensive checks */}
                              {message.content && message.content.characters && Array.isArray(message.content.characters) ? (
                                message.content.characters.map((obj, index) => (
                                  <div key={index} className={(obj.romanization || obj.pinyin) && showRomanization && obj.text.trim() ? "flex flex-col items-center" : "flex items-end"}>
                                    {(obj.romanization || obj.pinyin) && showRomanization && obj.text.trim() && (
                                      <span className="text-xs text-gray-400 mb-1 font-mono">
                                        {obj.romanization || obj.pinyin}
                                      </span>
                                    )}
                                    <span className="text-lg sm:text-xl font-medium">{obj.text || ''}</span>
                                  </div>
                                ))
                              ) : message.content && message.content.chinese && Array.isArray(message.content.chinese) ? (
                                /* Legacy Chinese format */
                                message.content.chinese.map((obj, index) => (
                                  <div key={index} className={obj.pinyin && showRomanization && obj.text.trim() ? "flex flex-col items-center" : "flex items-end"}>
                                    {obj.pinyin && showRomanization && obj.text.trim() && (
                                      <span className="text-xs text-gray-400 mb-1 font-mono">
                                        {obj.pinyin}
                                      </span>
                                    )}
                                    <span className="text-lg sm:text-xl font-medium">{obj.text || ''}</span>
                                  </div>
                                ))
                              ) : message.content && message.content.text ? (
                                /* Plain text format (e.g., French) */
                                <span className="text-lg sm:text-xl font-medium">{message.content.text}</span>
                              ) : (
                                /* Fallback for unknown formats */
                                <span className="text-lg sm:text-xl font-medium text-red-400">
                                  [Error displaying message]
                                </span>
                              )}
                            </div>
                            
                            {/* Retry Button for Errors */}
                            {message.isError && (
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={() => handleSubmit(null, index - 1)} // Retry the previous user message
                                  disabled={retryingMessageIndex === index - 1}
                                  className="inline-flex items-center px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                                >
                                  {retryingMessageIndex === index - 1 ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                                      Retrying...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                      </svg>
                                      Retry
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            
                            {/* Cultural Context Info Button */}
                            {message.content && message.content.culturalContext && (
                              <button 
                                onClick={() => setCulturalContextModal(message.content.culturalContext)}
                                className="inline-flex items-center text-xs text-gray-400 hover:text-blue-400 transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Cultural Context
                              </button>
                            )}
                            
                            {/* English Translation */}
                            {showEnglish && message.content && message.content.english && (
                              <div className="pt-2 border-t border-gray-600">
                                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                                  {message.content.english}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                ))}

                {/* Typing Indicator */}
                {isLoading && (
                  <div className="flex w-full justify-start items-end mb-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${currentLanguage.personality.color} flex items-center justify-center mr-2 mb-1 shadow-lg backdrop-blur-sm`}>
                      <span className="text-white text-sm">{currentLanguage.personality.avatar}</span>
                    </div>
                    
                    <div className="max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-3 relative backdrop-blur-xl border shadow-lg bg-white/10 text-white border-white/20 rounded-[20px_20px_20px_4px]">
                      <div className="text-xs text-gray-300 font-medium mb-2">
                        {currentLanguage.personality.name}
                      </div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="relative px-3 sm:px-4 py-3 sm:py-4">
            {/* Predictive Text Suggestions */}
            {showPredictions && predictiveSuggestions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {predictiveSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handlePredictionClick(suggestion)}
                    className="px-3 py-1.5 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-gray-200 text-xs rounded-full transition-all duration-200 border border-white/20 hover:border-blue-400/50 shadow-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="flex items-end gap-4 backdrop-blur-xl bg-gradient-to-r from-white/15 via-white/10 to-white/15 rounded-3xl border border-white/20 focus-within:border-blue-400/50 focus-within:shadow-lg focus-within:shadow-blue-500/25 transition-all duration-200 shadow-lg p-4">
              <div className="flex-1 min-h-0">
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
                  placeholder="Type your message..."
                  className="w-full bg-transparent text-white placeholder-gray-300 resize-none border-none outline-none text-base leading-relaxed py-1 min-h-[28px] max-h-[240px]"
                  rows="1"
                  style={{
                    height: '28px',
                    lineHeight: '1.6'
                  }}
                />
              </div>
              
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-12 h-12 bg-gradient-to-r from-blue-500/90 to-purple-600/90 hover:from-blue-600/90 hover:to-purple-700/90 disabled:from-gray-600/30 disabled:to-gray-600/30 disabled:cursor-not-allowed rounded-2xl transition-all duration-200 flex-shrink-0 flex items-center justify-center group shadow-lg backdrop-blur-sm border border-blue-400/30 hover:border-blue-300/50"
              >
                <svg 
                  className="w-6 h-6 text-white transform group-hover:scale-110 transition-transform" 
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

      {/* Cultural Context Side Panel */}
      {culturalContextModal && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setCulturalContextModal(null)}></div>
          <div className="fixed right-0 top-0 h-full w-80 max-w-[90vw] backdrop-blur-xl bg-gradient-to-b from-white/15 via-white/10 to-white/5 border-l border-white/20 shadow-2xl transform transition-transform duration-300">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-white/20 flex items-center justify-between backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Cultural Context
                </h3>
                <button
                  onClick={() => setCulturalContextModal(null)}
                  className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border border-white/10 hover:border-white/30"
                >
                  <svg className="w-4 h-4 text-gray-300 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-4">
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {culturalContextModal}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowClearConfirmModal(false)}></div>
          <div className="relative backdrop-blur-xl bg-gradient-to-b from-white/15 via-white/10 to-white/5 border border-white/20 rounded-2xl max-w-sm mx-4 w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500/90 to-red-600/90 rounded-full flex items-center justify-center mr-3 backdrop-blur-sm border border-red-400/30 shadow-lg shadow-red-500/25">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Clear Chat History</h3>
              </div>
              
              <div className="backdrop-blur-sm bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
                <p className="text-sm text-gray-200 leading-relaxed">
                  Are you sure you want to clear all chat history for <strong className="text-white">{currentLanguage.name}</strong>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowClearConfirmModal(false)}
                  className="flex-1 px-4 py-2.5 backdrop-blur-sm bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-xl transition-all duration-200 text-sm font-medium border border-white/20 hover:border-white/30 shadow-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClearChat}
                  className="flex-1 px-4 py-2.5 backdrop-blur-sm bg-gradient-to-br from-red-500/90 to-red-600/90 hover:from-red-600/90 hover:to-red-700/90 text-white rounded-xl transition-all duration-200 text-sm font-medium border border-red-400/50 hover:border-red-300/60 shadow-lg shadow-red-500/25"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
