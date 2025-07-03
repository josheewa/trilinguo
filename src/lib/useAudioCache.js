import { useState, useRef, useCallback, useEffect } from 'react'

// Global audio cache to persist across component re-renders
const audioCache = new Map()
const audioRefs = new Map()

export const useAudioCache = () => {
  const [loadingStates, setLoadingStates] = useState(new Map())
  const [playingStates, setPlayingStates] = useState(new Map())
  
  // Generate cache key from message content
  const generateCacheKey = useCallback((messageContent, language) => {
    if (!messageContent) return null
    
    let text = ''
    if (messageContent.characters && Array.isArray(messageContent.characters)) {
      text = messageContent.characters.map(char => char.text).join('')
    } else if (messageContent.text) {
      text = messageContent.text
    }
    
    return `${language}-${text.slice(0, 100)}` // Use first 100 chars as key
  }, [])

  // Set loading state for a specific message
  const setLoading = useCallback((messageId, isLoading) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev)
      if (isLoading) {
        newStates.set(messageId, true)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Set playing state for a specific message
  const setPlaying = useCallback((messageId, isPlaying) => {
    setPlayingStates(prev => {
      const newStates = new Map(prev)
      if (isPlaying) {
        newStates.set(messageId, true)
      } else {
        newStates.delete(messageId)
      }
      return newStates
    })
  }, [])

  // Generate and cache audio for a message
  const generateAudio = useCallback(async (messageContent, language, messageId) => {
    const cacheKey = generateCacheKey(messageContent, language)
    if (!cacheKey) return null

    // Return cached audio if available
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey)
    }

    setLoading(messageId, true)

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageContent,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Cache the audio URL
      audioCache.set(cacheKey, audioUrl)
      
      return audioUrl
    } catch (error) {
      console.error('Error generating audio:', error)
      return null
    } finally {
      setLoading(messageId, false)
    }
  }, [generateCacheKey, setLoading])

  // Play audio for a message
  const playAudio = useCallback(async (messageContent, language, messageId) => {
    // Stop any currently playing audio
    audioRefs.forEach((audio, id) => {
      if (id !== messageId && !audio.paused) {
        audio.pause()
        audio.currentTime = 0
        setPlaying(id, false)
      }
    })

    let audioUrl = audioCache.get(generateCacheKey(messageContent, language))
    
    // Generate audio if not cached
    if (!audioUrl) {
      audioUrl = await generateAudio(messageContent, language, messageId)
    }

    if (!audioUrl) return

    // Create or get audio element
    let audio = audioRefs.get(messageId)
    if (!audio) {
      audio = new Audio(audioUrl)
      audioRefs.set(messageId, audio)
      
      // Setup event listeners
      audio.addEventListener('ended', () => {
        setPlaying(messageId, false)
      })
      
      audio.addEventListener('error', () => {
        console.error('Audio playback error')
        setPlaying(messageId, false)
      })
    }

    // Play audio
    try {
      setPlaying(messageId, true)
      await audio.play()
    } catch (error) {
      console.error('Audio play error:', error)
      setPlaying(messageId, false)
    }
  }, [generateAudio, generateCacheKey, setPlaying])

  // Stop audio for a message
  const stopAudio = useCallback((messageId) => {
    const audio = audioRefs.get(messageId)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setPlaying(messageId, false)
  }, [setPlaying])

  // Get loading state for a message
  const isLoading = useCallback((messageId) => {
    return loadingStates.has(messageId)
  }, [loadingStates])

  // Get playing state for a message
  const isPlaying = useCallback((messageId) => {
    return playingStates.has(messageId)
  }, [playingStates])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Stop all audio
    audioRefs.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    audioRefs.clear()
    
    // Clear states
    setLoadingStates(new Map())
    setPlayingStates(new Map())
    
    // Note: We keep audioCache for performance, but could clear it here if needed
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  return {
    playAudio,
    stopAudio,
    isLoading,
    isPlaying,
    cleanup,
  }
}