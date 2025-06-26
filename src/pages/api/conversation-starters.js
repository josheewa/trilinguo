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

// Personality-based starter generation prompts
const STARTER_GENERATION_PROMPTS = {
  'zh-tw': {
    personality: 'You are 小美 (Xiǎo Měi), an energetic 22-year-old Taiwanese university student from Taipei.',
    context: 'Generate conversation starters focused on learning Traditional Chinese. Prioritize translation requests and "how do I say" prompts, with some cultural topics mixed in.',
    examples: 'Prioritize: "How do I say \'thank you\' in Chinese?", "Translate: I\'m hungry", "What does 小吃 mean?", "How do you pronounce 夜市?". Then add cultural: "Tell me about night markets", "What\'s your favorite bubble tea flavor?"'
  },
  'zh-cn': {
    personality: 'You are 小明 (Xiǎo Míng), a tech-savvy 23-year-old computer science student from Beijing.',
    context: 'Generate conversation starters focused on learning Simplified Chinese. Prioritize translation requests and "how do I say" prompts, with some tech/modern culture mixed in.',
    examples: 'Prioritize: "How do I say \'hello\' in Chinese?", "Translate: Where is the subway?", "What does 手机 mean?", "How do you say \'app\' in Chinese?". Then add cultural: "What\'s popular on Douyin?", "Tell me about Beijing life"'
  },
  'ja': {
    personality: 'You are さくら (Sakura), a 21-year-old Tokyo literature student passionate about anime, manga, and kawaii culture.',
    context: 'Generate conversation starters focused on learning Japanese. Prioritize translation requests and "how do I say" prompts, with some anime/culture mixed in.',
    examples: 'Prioritize: "How do I say \'good morning\' in Japanese?", "Translate: Nice to meet you", "What does かわいい mean?", "How do you pronounce arigatou?". Then add cultural: "What\'s your favorite anime?", "Tell me about Japanese festivals"'
  },
  'ko': {
    personality: 'You are 지민 (Jimin), a 20-year-old Seoul university student and huge K-pop/K-drama enthusiast.',
    context: 'Generate conversation starters focused on learning Korean. Prioritize translation requests and "how do I say" prompts, with some K-pop/culture mixed in.',
    examples: 'Prioritize: "How do I say \'I love you\' in Korean?", "Translate: Where is the bathroom?", "What does 사랑해 mean?", "How do you say \'music\' in Korean?". Then add cultural: "What\'s your favorite K-pop group?", "Tell me about Korean food"'
  },
  'fr': {
    personality: 'You are Léa, a 22-year-old Parisian literature student with passion for cinema and philosophy.',
    context: 'Generate conversation starters focused on learning French. Prioritize translation requests and "how do I say" prompts, with some French culture mixed in.',
    examples: 'Prioritize: "How do I say \'excuse me\' in French?", "Translate: Where is the train station?", "What does bonjour mean?", "How do you pronounce croissant?". Then add cultural: "What\'s your favorite French film?", "Tell me about Parisian cafés"'
  }
}

export default async function POST(req, res) {
  try {
    const { language = 'zh-tw', count = 4 } = await req.json()
    
    const config = STARTER_GENERATION_PROMPTS[language] || STARTER_GENERATION_PROMPTS['zh-tw']
    const responseFormat = zodResponseFormat(StartersResponseSchema, 'starters')
    
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `${config.personality}

${config.context}

Generate ${count} conversation starters for language learners. Include a good mix:
- 2-3 translation requests like "How do I say [word/phrase]?" or "Translate: [phrase]" or "What does [word] mean?"
- At least 1 normal conversation starter that encourages natural dialogue
- Focus on practical, everyday words and phrases that beginners need
- Include some pronunciation questions like "How do you pronounce [word]?"
- Make translation requests specific and useful
- Keep conversation starters culturally relevant and engaging

${config.examples}

IMPORTANT: Balance translation learning with natural conversation practice. Include both "How do I say..." prompts AND normal conversation topics.

Return exactly ${count} starters in the required JSON format.`
        },
        {
          role: 'user', 
          content: `Generate ${count} conversation starters, prioritizing translation and "how do I say" requests for language learning.`
        }
      ],
      response_format: responseFormat,
      max_tokens: 300,
      temperature: 0.8  // Slightly lower for more consistent translation-focused results
    })

    const assistantOutput = response.choices[0].message.content.trim()
    const parsed = JSON.parse(assistantOutput)
    
    if (parsed.starters && Array.isArray(parsed.starters)) {
      const validStarters = parsed.starters
        .filter(starter => starter && typeof starter === 'string' && starter.length > 0)
        .slice(0, count)
        
      return NextResponse.json({ starters: validStarters })
    }
    
    // Fallback if parsing fails
    return NextResponse.json({ starters: [] })
    
  } catch (error) {
    console.error('Conversation Starters API Error:', error)
    
    // Translation-focused fallback starters
    const translationFallbacks = [
      "How do I say 'hello'?",
      "Translate: I'm hungry",
      "What does this word mean?",
      "How do you pronounce this?"
    ]
    
    return NextResponse.json({ 
      starters: translationFallbacks.slice(0, 4) 
    })
  }
} 