import OpenAI from 'openai'
import { getAuth } from '@clerk/nextjs/server'

const client = new OpenAI()

const VOICE_MAP = {
  'zh-tw': 'nova',
  'zh-cn': 'alloy', 
  'ja': 'shimmer', 
  'ko': 'nova', 
  'fr': 'echo', 
}

/** Extract text content from a structured message for TTS generation. */
const extractTextForTTS = (messageContent, language) => {
  if (!messageContent) return ''
  
  if (messageContent.characters && Array.isArray(messageContent.characters)) {
    return messageContent.characters.map(char => char.text).join('')
  }
  
  if (messageContent.text) {
    return messageContent.text
  }
  
  return ''
}

/**
 * POST /api/tts
 * Auth required. Generates MP3 audio for model output text.
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json({ error: 'Method Not Allowed' })
    }

    // Check authentication
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { messageContent, language = 'zh-tw' } = req.body || {}
    
    if (!messageContent) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    const textToSpeak = extractTextForTTS(messageContent, language)
    
    if (!textToSpeak.trim()) {
      return res.status(400).json({ error: 'No text content found to synthesize' })
    }

    if (textToSpeak.length > 4000) {
      return res.status(400).json({ 
        error: 'Text too long for synthesis',
        details: 'Maximum 4000 characters supported' 
      })
    }

    const voice = VOICE_MAP[language] || 'alloy'

    const mp3Response = await client.audio.speech.create({
      model: 'tts-1',
      voice: voice,
      input: textToSpeak,
      response_format: 'mp3',
    })

    const audioBuffer = await mp3Response.arrayBuffer()
    
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from OpenAI')
    }
    
    res.status(200)
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audioBuffer.byteLength.toString())
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('X-Audio-Text-Length', textToSpeak.length.toString())
    return res.end(Buffer.from(audioBuffer))
  } catch (error) {
    console.error('TTS API Error:', error)
    
    if (error.message?.includes('rate limit')) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Please wait a moment before trying again' 
      })
    }
    
    if (error.message?.includes('quota')) {
      return res.status(503).json({ 
        error: 'Service temporarily unavailable',
        details: 'Please try again later' 
      })
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message?.substring(0, 100) || 'Unknown error' 
    })
  }
}