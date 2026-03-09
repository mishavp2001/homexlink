import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Optional auth check - allow public access
    try {
      await base44.auth.me();
    } catch (error) {
      // Public access allowed
    }

    const { query, maxResults = 10 } = await req.json();
    
    if (!query) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'YouTube API key not configured' }, { status: 500 });
    }

    // Search YouTube videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (!response.ok) {
      console.error('YouTube API error:', data);
      return Response.json({ error: 'YouTube API error', details: data }, { status: response.status });
    }

    // Format videos
    const videos = data.items?.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    })) || [];

    return Response.json({ videos });
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});