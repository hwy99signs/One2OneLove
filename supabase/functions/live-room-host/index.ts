// Supabase Edge Function: live-room-host
// Generates a short discussion invitation for a quiet One2OneLove Live Community room.
// Server-side only: OPENAI_API_KEY must be stored as a Supabase secret, never in browser code.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const rooms: Record<string, { name: string; fallback: string }> = {
  'vent-room': {
    name: 'Vent Room',
    fallback: 'When you need to vent about your relationship, what do you actually want from the other person: advice, validation, or just somebody to listen?',
  },
  'modern-dating-unfiltered': {
    name: 'Modern Dating Unfiltered',
    fallback: 'Has modern dating made people more selective — or just more afraid to commit?',
  },
  'love-talk': {
    name: 'Love Talk',
    fallback: 'What is one small thing your partner can do that makes you feel genuinely loved?',
  },
  'marriage-matters': {
    name: 'Marriage Matters',
    fallback: 'Should married couples combine all of their money, keep some separate, or does it depend on the marriage?',
  },
  'starting-over': {
    name: 'Starting Over',
    fallback: 'How do you know when you are actually ready to date again instead of just trying to stop feeling lonely?',
  },
}

const cleanText = (value: unknown, max = 500) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const extractResponseText = (payload: any) => {
  const output = Array.isArray(payload?.output) ? payload.output : []
  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue
    for (const part of item.content) {
      if (part?.type === 'output_text' && typeof part.text === 'string') {
        return part.text.trim()
      }
    }
  }
  return ''
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const roomSlug = cleanText(body?.room_slug, 80)
    const room = rooms[roomSlug]
    if (!room) {
      return new Response(JSON.stringify({ error: 'Unknown live room' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const reason = body?.reason === 'room_quiet' ? 'room_quiet' : 'room_empty'
    const recentMessages = Array.isArray(body?.recent_messages)
      ? body.recent_messages.slice(-12).map((message: any) => ({
          sender: cleanText(message?.sender_name, 80) || 'Member',
          content: cleanText(message?.content, 500),
        })).filter((message: any) => message.content)
      : []

    const fallback = room.fallback
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ prompt: fallback, source: 'fallback' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const conversationContext = recentMessages.length
      ? recentMessages.map((message: any) => `${message.sender}: ${message.content}`).join('\n')
      : '(No recent member messages.)'

    const instructions = `You are the O2OL Host inside a public relationship discussion room called "${room.name}".
Your job is to restart or open human conversation, not to become the conversation.

Behavior rules:
- Write ONE brief invitation, question, or conversational nudge, ideally 1 sentence and never more than 2 sentences.
- Keep it under 45 words.
- Warm, curious, human-sounding, lightly playful when appropriate, and occasionally mildly mischievous — never mean.
- Do not identify yourself as a counselor, therapist, expert, or authority.
- Do not diagnose people, prescribe treatment, negotiate relationships, or tell members what they must do.
- Do not impersonate another member or imply that humans are present when they are not.
- Do not repeat names, emails, locations, or identifying details from member messages.
- If recent messages exist, build naturally on the theme without quoting sensitive details.
- Ask something people can actually answer in a group chat.
- Do not use hashtags, disclaimers, headings, or bullet points.
- If the topic appears dangerous, abusive, self-harm-related, or otherwise too serious for a playful public prompt, respond with a calm, nonjudgmental invitation to seek appropriate real-world support instead of trying to counsel the room.

The room is ${reason === 'room_quiet' ? 'quiet after a recent human conversation' : 'waiting for a conversation to begin'}.
The default room topic is: ${fallback}`

    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-5.6',
        store: false,
        max_output_tokens: 120,
        instructions,
        input: `Recent room conversation:\n${conversationContext}`,
      }),
    })

    if (!openAIResponse.ok) {
      console.error('OpenAI host request failed:', openAIResponse.status, await openAIResponse.text())
      return new Response(JSON.stringify({ prompt: fallback, source: 'fallback' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = await openAIResponse.json()
    const prompt = extractResponseText(payload) || fallback

    return new Response(JSON.stringify({ prompt, source: prompt === fallback ? 'fallback' : 'ai' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('live-room-host error:', error)
    return new Response(JSON.stringify({ error: 'Unable to generate a room prompt right now.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
