import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const client = new OpenAI()
export const runtime = 'edge'

// Response schema for conversation starters
const StartersResponseSchema = z.object({
  starters: z.array(z.string()),
})

// Hardcoded conversation starters per language
const HARDCODED_STARTERS = {
  'zh-tw': [
    "How do you say 'hello' in Chinese?",
    "Translate: I'm hungry",
    "What's the weather like today?",
    "Can you teach me basic greetings?"
  ],
  'zh-cn': [
    "How do you say 'thank you' in Chinese?", 
    "Translate: Where is the bathroom?",
    "Tell me about Chinese food",
    "What's popular in Beijing right now?"
  ],
  'ja': [
    "How do you say 'good morning' in Japanese?",
    "Translate: Nice to meet you",
    "Tell me about Japanese culture",
    "What's trending in Tokyo?"
  ],
  'ko': [
    "How do you say 'goodbye' in Korean?",
    "Translate: I love K-pop",
    "Tell me about Korean food",
    "What's popular in Seoul?"
  ],
  'fr': [
    "How do you say 'please' in French?",
    "Translate: Where is the train station?",
    "Tell me about French culture",
    "What's happening in Paris?"
  ]
}

const STARTER_GENERATION_PROMPTS = {
  'zh-tw': 'You are helping someone learn Traditional Chinese. Generate conversation starters focused on Taiwanese culture, food, and daily life.',
  'zh-cn': 'You are helping someone learn Simplified Chinese. Generate conversation starters focused on mainland Chinese culture, technology, and modern life.',
  'ja': 'You are helping someone learn Japanese. Generate conversation starters focused on Japanese culture, anime, food, and daily life.',
  'ko': 'You are helping someone learn Korean. Generate conversation starters focused on K-pop, Korean culture, food, and daily life.',
  'fr': 'You are helping someone learn French. Generate conversation starters focused on French culture, food, art, and daily life.'
}

export default async function POST(req, res) {
  try {
    const { language = 'zh-tw', count = 4 } = await req.json()
    
    const hardcodedStarters = HARDCODED_STARTERS[language] || HARDCODED_STARTERS['zh-tw']
    
    // Always return hardcoded starters first, then try to add AI-generated ones
    const selectedHardcoded = hardcodedStarters
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(count, hardcodedStarters.length))

    let allStarters = [...selectedHardcoded]
    
    // If we need more starters, try to generate them with AI
    const remaining = count - selectedHardcoded.length
    if (remaining > 0) {
      try {
        const prompt = STARTER_GENERATION_PROMPTS[language] || STARTER_GENERATION_PROMPTS['zh-tw']
        const responseFormat = zodResponseFormat(StartersResponseSchema, 'starters')
        
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `${prompt}

Generate ${remaining} conversation starters for language learners. Each should be:
- In English (prompts for learners to use)
- Short and beginner-friendly
- Focused on practical, everyday topics
- Include cultural elements specific to the region

Return in the required JSON format.`
            },
            {
              role: 'user', 
              content: `Generate ${remaining} conversation starters.`
            }
          ],
          response_format: responseFormat,
          max_tokens: 200,
          temperature: 0.8
        })

        const assistantOutput = response.choices[0].message.content.trim()
        const parsed = JSON.parse(assistantOutput)
        
        if (parsed.starters && Array.isArray(parsed.starters)) {
          allStarters = [...allStarters, ...parsed.starters.slice(0, remaining)]
        }
      } catch (aiError) {
        console.error('AI generation failed:', aiError)
        // If AI fails, just use more hardcoded starters if available
        const additionalHardcoded = hardcodedStarters.slice(selectedHardcoded.length, count)
        allStarters = [...allStarters, ...additionalHardcoded]
      }
    }
    
    return NextResponse.json({ 
      starters: allStarters.filter(starter => starter && starter.length > 0).slice(0, count)
    })
  } catch (error) {
    console.error('Conversation Starters API Error:', error)
    
    // Fallback to hardcoded starters only
    const language = 'zh-tw' // Default fallback
    const fallbackStarters = HARDCODED_STARTERS[language] || HARDCODED_STARTERS['zh-tw']
    return NextResponse.json({ 
      starters: fallbackStarters.slice(0, 4) 
    })
  }
} 