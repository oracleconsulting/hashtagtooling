import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not set' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { product, platform, tone, extraNotes } = body

    if (!product || !platform) {
      return NextResponse.json({ error: 'Missing product or platform' }, { status: 400 })
    }

    const platformGuides: Record<string, string> = {
      instagram: `Instagram: conversational, personal, craftsperson voice. 150–220 words. Lead with a hook. Use line breaks for rhythm. End with a soft CTA. 25–30 hashtags in a separate block — mix niche (#woodworkingtools, #malletmaker), craft (#handtools, #woodcraft, #joinery), material (#exotictimber, #cocobolo), and broad (#woodworking, #handmade, #madeinuk). No hashtags in the caption body.`,
      pinterest: `Pinterest: descriptive, keyword-rich, searchable. 80–120 words. Lead with the most important keyword naturally. Focus on what it is, what it's made from, and who it's for. Include wood species, construction method, and use case. 5–10 hashtags maximum, keyword-focused only. Tone is editorial, not chatty.`,
      facebook: `Facebook: friendly, story-driven, slightly longer. 100–180 words. Can include a backstory or process detail. Ask a question to encourage comments. 5–8 hashtags at the end. Less hashtag-heavy than Instagram.`,
    }

    const toneGuides: Record<string, string> = {
      craft: 'Focus on the making — process, material choice, technique, the hours of handwork.',
      product: 'Focus on the finished piece — beauty, rarity of the timber, what it feels like to use.',
      story: 'Tell a short story — where this piece came from, why this wood was chosen, who it might be for.',
    }

    const woodLine = product.wood_species ? `- Primary timber: ${product.wood_species}` : ''
    const notesLine = extraNotes ? `- Additional context from James: ${extraNotes}` : ''

    const prompt = `You are writing social media content for #TOOLING, a one-person UK workshop making premium handcrafted woodworking mallets and awls from exotic timber. The maker is James — direct, passionate about his craft, not corporate, not salesy. Every post should feel like it was written by a craftsperson who loves what they make, not a marketing team.

Product details:
- Name: ${product.name}
- Category: ${product.category}
- Price: £${product.price}
- Description: ${product.description}
${woodLine}
${notesLine}

Platform: ${String(platform).toUpperCase()}
${platformGuides[platform] || ''}

Tone focus: ${toneGuides[tone] || toneGuides.craft}

Brand voice rules:
- First person ("I made", "I chose", "this one took")
- Never use the word "stunning" or "beautiful" — show it through specifics instead
- Name the timber species and say something true about it
- Mention brass dowel construction if it's a mallet (this is a key differentiator)
- Never use corporate phrases like "premium quality" or "perfect for"
- Hashtag casing: camelCase for multi-word tags (#WoodworkingTools not #woodworkingtools)

Respond ONLY with valid JSON in this exact structure, no markdown, no preamble:
{
  "caption": "the full caption text",
  "hashtags": "space-separated hashtags starting with #",
  "tip": "one short posting tip specific to this content (timing, first comment strategy, etc.)"
}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://hashtag.guru',
        'X-Title': '#TOOLING Admin',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('OpenRouter API error:', err)
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''

    const clean = text.replace(/```json|```/g, '').trim()

    let parsed: { caption: string; hashtags: string; tip: string }
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({
        caption: text,
        hashtags: '',
        tip: '',
      })
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Social content generation error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
