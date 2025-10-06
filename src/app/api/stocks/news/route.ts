import { NextRequest, NextResponse } from 'next/server';

// News and sentiment API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Fetch news from Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&quotesCount=0&newsCount=20`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Simple sentiment analysis based on keywords
    const analyzeSentiment = (title: string): number => {
      const positive = ['profit', 'gain', 'rise', 'surge', 'beat', 'high', 'growth', 'bull', 'upgrade', 'strong'];
      const negative = ['loss', 'drop', 'fall', 'decline', 'miss', 'low', 'weak', 'bear', 'downgrade', 'concern'];
      
      const lowerTitle = title.toLowerCase();
      let score = 0;
      
      positive.forEach(word => {
        if (lowerTitle.includes(word)) score += 0.2;
      });
      
      negative.forEach(word => {
        if (lowerTitle.includes(word)) score -= 0.2;
      });
      
      return Math.max(-1, Math.min(1, score));
    };

    const news = data.news?.map((item: any) => ({
      title: item.title,
      url: item.link,
      source: item.publisher || 'Unknown',
      publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
      sentiment: analyzeSentiment(item.title),
    })) || [];

    return NextResponse.json({ news, symbol });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}