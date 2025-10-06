import { NextRequest, NextResponse } from 'next/server';

// Market overview API - fetches sector performance and top movers
export async function GET(request: NextRequest) {
  try {
    // Define major sectors with representative stocks
    const sectors = [
      { name: 'Technology', symbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META'], color: '#3b82f6' },
      { name: 'Finance', symbols: ['JPM', 'BAC', 'WFC', 'GS', 'MS'], color: '#10b981' },
      { name: 'Healthcare', symbols: ['JNJ', 'UNH', 'PFE', 'ABBV', 'TMO'], color: '#8b5cf6' },
      { name: 'Energy', symbols: ['XOM', 'CVX', 'COP', 'SLB', 'EOG'], color: '#f59e0b' },
      { name: 'Consumer', symbols: ['AMZN', 'TSLA', 'HD', 'NKE', 'MCD'], color: '#ec4899' },
      { name: 'Industrials', symbols: ['BA', 'CAT', 'GE', 'HON', 'UPS'], color: '#6366f1' },
      { name: 'Materials', symbols: ['LIN', 'APD', 'SHW', 'FCX', 'NEM'], color: '#14b8a6' },
      { name: 'Utilities', symbols: ['NEE', 'DUK', 'SO', 'D', 'AEP'], color: '#a855f7' },
    ];

    // Symbols for top gainers/losers
    const topSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 
      'JPM', 'JNJ', 'V', 'PG', 'XOM', 'UNH', 'MA', 'HD',
      'CVX', 'PFE', 'ABBV', 'KO', 'PEP', 'COST', 'MRK', 'TMO',
      'WMT', 'BAC', 'DIS', 'CSCO', 'ADBE', 'CRM'
    ];

    // Fetch all quotes in parallel
    const allSymbols = [...new Set([...sectors.flatMap(s => s.symbols), ...topSymbols])];
    
    const quotePromises = allSymbols.map(async (symbol) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        const result = data.chart?.result?.[0];
        if (!result) return null;

        const meta = result.meta;
        const change = meta.regularMarketPrice - meta.chartPreviousClose;
        const changePercent = (change / meta.chartPreviousClose) * 100;

        return {
          symbol: meta.symbol,
          name: symbol,
          price: meta.regularMarketPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume,
        };
      } catch (err) {
        return null;
      }
    });

    const quotes = (await Promise.all(quotePromises)).filter(q => q !== null);

    // Calculate sector performance
    const sectorPerformance = sectors.map(sector => {
      const sectorQuotes = quotes.filter(q => sector.symbols.includes(q.symbol));
      if (sectorQuotes.length === 0) {
        return { ...sector, performance: 0, volume: 0 };
      }

      const avgChange = sectorQuotes.reduce((sum, q) => sum + q.changePercent, 0) / sectorQuotes.length;
      const totalVolume = sectorQuotes.reduce((sum, q) => sum + q.volume, 0);

      return {
        ...sector,
        performance: avgChange,
        volume: totalVolume,
      };
    });

    // Get top gainers and losers
    const sortedByChange = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
    const topGainers = sortedByChange.slice(0, 10);
    const topLosers = sortedByChange.slice(-10).reverse();

    // Calculate overall market sentiment
    const overallChange = quotes.reduce((sum, q) => sum + q.changePercent, 0) / quotes.length;
    const gainersCount = quotes.filter(q => q.changePercent > 0).length;
    const losersCount = quotes.filter(q => q.changePercent < 0).length;
    const sentiment = gainersCount / (gainersCount + losersCount);

    return NextResponse.json({
      sectors: sectorPerformance,
      topGainers,
      topLosers,
      marketSentiment: {
        score: sentiment,
        averageChange: overallChange,
        gainers: gainersCount,
        losers: losersCount,
        neutral: quotes.length - gainersCount - losersCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market overview', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}