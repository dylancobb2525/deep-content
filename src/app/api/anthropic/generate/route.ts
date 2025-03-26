import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const runtime = 'edge';

// Define the request body interface
export interface GenerateRequest {
  idea: string;
  contentType: string;
  questions: { id: string; text: string; answer: string }[];
  research: string;
  transcript?: string;
  feedback?: string; // Optional feedback for regeneration
}

export async function POST(req: NextRequest) {
  try {
    const { idea, contentType, questions, research, transcript, feedback } = await req.json() as GenerateRequest;
    
    // Format the user input
    const formattedQuestions = questions.map(q => `Question: ${q.text}\nAnswer: ${q.answer}`).join('\n\n');
    
    // Construct the system prompt
    const systemPrompt = `You are an expert content creator that specializes in creating high-quality, well-researched ${contentType} content. 
You help users by generating content based on their ideas, their answers to specific questions, and provided research.
The content you create should be original, engaging, and reflect the user's authentic voice based on how they've answered the questions.

When generating content, follow these rules:
1. Use the research provided to inform the content, incorporating relevant facts, statistics, and insights.
2. Maintain the user's perspective and opinions as expressed in their answers to questions.
3. Format the content appropriately for the chosen content type (${contentType}).
4. Create content that is ready to use without requiring additional editing.
5. Do not mention that the content was AI-generated or include any meta-commentary about the content generation process.
6. Focus on creating authentic, human-sounding content that reflects the user's voice.`;

    // Construct the user prompt based on content type
    let userPrompt = `Please create a ${contentType} based on the following:

IDEA: ${idea}

USER'S PERSPECTIVE (based on answers to questions):
${formattedQuestions}

RESEARCH TO INCORPORATE:
${research}`;

    // Add transcript if provided
    if (transcript) {
      userPrompt += `\n\nTRANSCRIPT OR ADDITIONAL CONTENT:
${transcript}`;
    }

    // Add feedback if provided
    if (feedback) {
      userPrompt += `\n\nUSER FEEDBACK FOR IMPROVEMENT:
${feedback}

Please regenerate the content taking this feedback into account while maintaining the original purpose and incorporating the research.`;
    }

    // Add formatting instructions based on content type
    if (contentType.toLowerCase().includes('blog')) {
      userPrompt += `\n\nPlease format this as a complete blog post with a compelling headline, introduction, properly structured sections with subheadings, and a conclusion.`;
    } else if (contentType.toLowerCase().includes('social')) {
      userPrompt += `\n\nPlease format this as social media content with appropriate hashtags and engaging language for the platform.`;
    } else if (contentType.toLowerCase().includes('youtube')) {
      userPrompt += `\n\nPlease format this as a YouTube script with intro, main content sections, and an outro including a call to action.`;
    } else if (contentType.toLowerCase().includes('email')) {
      userPrompt += `\n\nPlease format this as an email with subject line, greeting, main content, and signature.`;
    }

    // Try using Anthropic first
    try {
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      
      console.log('Using Anthropic API with key starting with:', ANTHROPIC_API_KEY?.substring(0, 10));
      
      if (!ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key is not configured');
      }
      
      const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
      });
      
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      });
      
      // Check if there's content in the response and it's a text type
      let content = '';
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if (firstContent.type === 'text') {
          content = firstContent.text;
        } else {
          throw new Error('Unexpected content type in Anthropic response');
        }
      } else {
        throw new Error('No content in Anthropic response');
      }
      
      return NextResponse.json({ 
        content: content,
        source: 'Anthropic'
      }, { status: 200 });
    } catch (anthropicError) {
      console.error('Anthropic API error:', anthropicError);
      console.log('Falling back to OpenAI API');
      
      // Fallback to OpenAI
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured for fallback');
      }
      
      console.log('Using OpenAI API with key starting with:', OPENAI_API_KEY.substring(0, 10));
      
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });
      
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message.content) {
        throw new Error('OpenAI did not generate any content');
      }
      
      return NextResponse.json({ 
        content: response.choices[0].message.content,
        source: 'OpenAI'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 