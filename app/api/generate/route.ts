import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, getRateLimitHeaders, checkRateLimit } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';

type AIProvider = 'openai' | 'gemini' | 'claude';

async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  model: string = 'gpt-4o'
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: OpenAI API did not respond within 60 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callGemini(
  prompt: string,
  systemPrompt: string,
  model: string = 'gemini-1.5-pro'
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY not configured');
  }

  // Combine system prompt and user prompt for Gemini
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n${prompt}`
    : prompt;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Gemini API did not respond within 60 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callClaude(
  prompt: string,
  systemPrompt: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const messages = [
    {
      role: 'user' as const,
      content: prompt,
    },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system: systemPrompt || undefined,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API error');
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout: Claude API did not respond within 60 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    
    const rateLimitError = applyRateLimit(request, userId);
    if (rateLimitError) {
      return rateLimitError;
    }
    
    const { prompt, context, agent } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (prompt.length > 50000) {
      return NextResponse.json(
        { error: 'Prompt is too long. Maximum 50000 characters' },
        { status: 400 }
      );
    }

    // Validate context if provided
    if (context !== undefined) {
      if (!Array.isArray(context)) {
        return NextResponse.json(
          { error: 'Context must be an array' },
          { status: 400 }
        );
      }
      if (context.length > 100) {
        return NextResponse.json(
          { error: 'Too many context items. Maximum 100' },
          { status: 400 }
        );
      }
      // Validate each context item
      for (const ctx of context) {
        if (typeof ctx !== 'object' || ctx === null) {
          return NextResponse.json(
            { error: 'Each context item must be an object' },
            { status: 400 }
          );
        }
        if (ctx.content && typeof ctx.content !== 'string') {
          return NextResponse.json(
            { error: 'Context content must be a string' },
            { status: 400 }
          );
        }
        if (ctx.content && ctx.content.length > 100000) {
          return NextResponse.json(
            { error: 'Context item content is too long. Maximum 100000 characters per item' },
            { status: 400 }
          );
        }
      }
    }

    // Determine provider and configuration
    const provider: AIProvider = agent?.provider || 'openai';
    const model = agent?.model || (provider === 'openai' ? 'gpt-4o' : provider === 'gemini' ? 'gemini-1.5-pro' : 'claude-3-5-sonnet-20241022');
    const systemPrompt = agent?.systemPrompt || '';
    
    // Build context text from connected nodes in the required format
    let contextText = '';
    if (context && context.length > 0) {
      contextText = context
        .map((ctx: any) => {
          const label = ctx.label || 'Untitled';
          const content = ctx.content || '';
          return `[${label}]\n${content}`;
        })
        .join('\n\n');
    }

    let finalPrompt = '';
    
    // Add Role section (from agent node input)
    if (systemPrompt && systemPrompt.trim()) {
      finalPrompt += `---\n# Role\n${systemPrompt}\n`;
    }
    
    // Add Context section (from note nodes)
    finalPrompt += `---\n# Context\n`;
    if (contextText) {
      finalPrompt += `${contextText}\n`;
    } else {
      finalPrompt += `(No context provided)\n`;
    }
    
    // Add Task section (from prompt node)
    finalPrompt += `---\n# Task\n${prompt}`;

    // Log the final prompt for debugging
    console.log('\n========== FINAL PROMPT TO AI ==========\n');
    console.log(`${finalPrompt}`);
    console.log('========================================\n');

    // Call the appropriate API
    // For OpenAI and Claude, we pass system prompt separately (but now it's in the prompt)
    // For Gemini, we combine everything
    let generatedText: string;
    switch (provider) {
      case 'openai':
        // For OpenAI, we can pass the full prompt as user message
        // and optionally still use system prompt if needed, but the Role is already in the prompt
        generatedText = await callOpenAI(finalPrompt, '', model);
        break;
      case 'gemini':
        // For Gemini, send the full prompt
        generatedText = await callGemini(finalPrompt, '', model);
        break;
      case 'claude':
        // For Claude, send the full prompt as user message
        generatedText = await callClaude(finalPrompt, '', model);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log('Generated text length:', generatedText.length);
    
    // Get rate limit info for headers
    const identifier = userId || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitInfo = checkRateLimit(identifier, request.nextUrl.pathname);
    const headers = getRateLimitHeaders(
      request.nextUrl.pathname,
      rateLimitInfo.remaining,
      rateLimitInfo.resetTime
    );
    
    return NextResponse.json(
      {
        content: generatedText,
      },
      { headers }
    );
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

