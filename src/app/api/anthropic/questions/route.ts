import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface QuestionRequest {
  idea: string;
  contentType: string;
  transcript?: string;
}

export async function POST(req: Request) {
  try {
    const { idea, contentType, transcript } = await req.json() as QuestionRequest;
    
    const transcriptText = transcript ? 
      `The user has also provided this transcript or existing content for reference:\n\n${transcript}\n\n` : '';
      
    const systemPrompt = `
You are an expert content strategist who helps creators refine their ideas. Your role is to analyze the user's content type and idea, then generate tailored follow-up questions that will help them better articulate their goals.

IMPORTANT GUIDELINES:
- Generate 3-5 specific questions that directly relate to the user's content type and idea
- Each question should help the user clarify their vision, goals, or intended audience
- Analyze the specific keywords and phrases in their content idea and content type
- Focus questions on areas that would benefit from elaboration or clarification
- Ask about aspects that would help shape the research and final output
- Questions should be practical and help the user think through what they actually want
- Do not ask generic questions that could apply to any content
- Do not ask about information the user would need to research
- Focus on drawing out the user's expertise, preferences, and vision
- Questions should be clear, concise, and directly actionable
- ONLY return the numbered questions, nothing else
    `.trim();

    const userPrompt = `
Content Type: ${contentType}

User's Content Idea:
${idea}

${transcriptText}

Based on this specific content type "${contentType}" and their idea, generate 3-5 tailored follow-up questions that will help clarify:
1. The specific goals or outcomes they want to achieve with this ${contentType}
2. Any particular style, tone, or approach they prefer for this specific content
3. The knowledge gaps that research should fill to make this ${contentType} more effective
4. How they want to differentiate this content from similar content in their field
5. Any specific elements they want to emphasize or highlight

Your questions should feel like they were specifically written for someone creating a "${contentType}" about "${idea.substring(0, 50)}..."
    `.trim();

    // Direct fetch to Anthropic API
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate questions from Anthropic' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const questionsText = data.content[0].text;
    
    // Parse numbered questions from response
    const questionRegex = /(\d+)[.)\s]+(.+?)(?=\n\d+[.)\s]|$)/gs;
    const matches = [...questionsText.matchAll(questionRegex)];
    
    const questions = matches.map((match, index) => ({
      id: `q-${index + 1}`,
      text: match[2].trim(),
      answer: '',
    }));

    // If no questions were parsed, return a fallback set of contextual questions
    if (questions.length === 0) {
      return NextResponse.json({
        questions: [
          { id: 'q-1', text: `What specific goals do you want to achieve with this ${contentType}?`, answer: '' },
          { id: 'q-2', text: `Who is the target audience for this ${contentType} and what action do you want them to take?`, answer: '' },
          { id: 'q-3', text: `What tone, style, or approach would you like to use for this ${contentType}?`, answer: '' },
          { id: 'q-4', text: "What key points or information must be included to make this content successful?", answer: '' }
        ]
      });
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate follow-up questions' },
      { status: 500 }
    );
  }
} 