import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Supadata API key from environment variables
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

interface YouTubeRequest {
  url: string;
}

// Function to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  // Regular expression to match YouTube video IDs
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[1]) ? match[1] : null;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json() as YouTubeRequest;
    
    if (!url) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
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

    console.log('Fetching transcript for YouTube URL:', url);
    
    // According to Supadata docs, we can pass the full URL directly
    // Also, adding text=true to get plain text transcript
    const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}&text=true`, {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supadata API error:', errorText);
      
      // If we get rate limited or other error, try with video ID instead
      const videoId = extractYouTubeId(url);
      if (videoId) {
        console.log('Retrying with video ID:', videoId);
        
        const retryResponse = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
          method: 'GET',
          headers: {
            'x-api-key': SUPADATA_API_KEY,
          }
        });
        
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          const formattedContent = formatYouTubeTranscript(url, videoId, data);
          return NextResponse.json({ content: formattedContent });
        } else {
          console.error('Retry with video ID failed:', await retryResponse.text());
        }
      }
      
      // If no language specified, try also with English language parameter
      console.log('Trying with English language parameter');
      const langResponse = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}&text=true&lang=en`, {
        method: 'GET',
        headers: {
          'x-api-key': SUPADATA_API_KEY,
        }
      });
      
      if (langResponse.ok) {
        const data = await langResponse.json();
        const formattedContent = formatYouTubeTranscript(url, extractYouTubeId(url), data);
        return NextResponse.json({ content: formattedContent });
      }
      
      // If all attempts failed, return an informative error
      return NextResponse.json(
        { content: `No transcript available for this YouTube video. 

Possible reasons:
- The video doesn't have captions enabled
- The creator hasn't added captions
- YouTube auto-generated captions aren't available
- The video is too new and captions haven't been processed yet

Try a different video from an official channel (like news, education, etc.) that is more likely to have captions.` },
        { status: 200 }
      );
    }

    const data = await response.json();
    const videoId = extractYouTubeId(url);
    const formattedContent = formatYouTubeTranscript(url, videoId, data);
    
    return NextResponse.json({ content: formattedContent });
  } catch (error) {
    console.error('Error processing YouTube request:', error);
    return NextResponse.json(
      { error: 'Failed to process YouTube video' },
      { status: 500 }
    );
  }
}

// Format the YouTube transcript response into user-friendly content
function formatYouTubeTranscript(url: string, videoId: string | null, data: any): string {
  let formattedContent = '';
  
  // Add video info at the top
  formattedContent += `YouTube Video: ${url}\n`;
  if (videoId) {
    formattedContent += `Video ID: ${videoId}\n`;
  }
  
  // Add language info if available
  if (data.lang) {
    formattedContent += `Transcript Language: ${data.lang}\n`;
  }
  
  // Add available languages if there are multiple
  if (data.availableLangs && data.availableLangs.length > 0) {
    formattedContent += `Available Languages: ${data.availableLangs.join(', ')}\n`;
  }
  
  formattedContent += '\nTRANSCRIPT:\n\n';
  
  // Add the actual transcript content
  if (data.content) {
    formattedContent += data.content;
  } else {
    formattedContent += 'No transcript content available.';
  }
  
  return formattedContent;
}

// Helper function to format duration in seconds to readable format
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Helper function to format timestamp for captions
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
} 