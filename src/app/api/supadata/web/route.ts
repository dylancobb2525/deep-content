import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Supadata API key from environment variables
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

interface WebRequest {
  url: string;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json() as WebRequest;
    
    if (!url) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    if (!SUPADATA_API_KEY) {
      console.error('Supadata API key is not configured');
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Call Supadata API to scrape website content
    const response = await fetch(`https://api.supadata.ai/v1/web/scrape?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY
      }
    });

    if (!response.ok) {
      console.error('Supadata API error:', await response.text());
      return NextResponse.json(
        { error: `Failed to fetch website content: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Format the content with metadata
    let formattedContent = '';
    
    if (data.name) {
      formattedContent += `Title: ${data.name || 'Unknown'}\n`;
      formattedContent += `Source: ${url}\n\n`;
    }
    
    if (data.content) {
      formattedContent += `CONTENT:\n\n${data.content}`;
    } else {
      formattedContent += 'No content available from this website.';
    }

    return NextResponse.json({ content: formattedContent });
  } catch (error) {
    console.error('Error processing web request:', error);
    return NextResponse.json(
      { error: 'Failed to process website content' },
      { status: 500 }
    );
  }
} 