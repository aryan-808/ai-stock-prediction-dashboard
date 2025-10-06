import { NextRequest, NextResponse } from 'next/server';

// Real-time stock data API - fetches from Yahoo Finance
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');
  const period = searchParams.get('period') || '1y';

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    // Use Yahoo Finance API v8
    const periodMap: { [key: string]: { range: string; interval: string } } = {
      '1mo': { range: '1mo', interval: '1d' },
      '3mo': { range: '3mo', interval: '1d' },
      '6mo': { range: '6mo', interval: '1d' },
      '1y': { range: '1y', interval: '1d' },
      '2y': { range: '2y', interval: '1wk' },
      '5y': { range: '5y', interval: '1wk' },
    };

    const { range, interval } = periodMap[period] || periodMap['1y'];

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      return NextResponse.json({ error: 'No data found for symbol' }, { status: 404 });
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const history = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().split('T')[0],
      open: quotes.open[index] || 0,
      high: quotes.high[index] || 0,
      low: quotes.low[index] || 0,
      close: quotes.close[index] || 0,
      volume: quotes.volume[index] || 0,
    })).filter((item: any) => item.close > 0);

    return NextResponse.json({ history, symbol });
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}