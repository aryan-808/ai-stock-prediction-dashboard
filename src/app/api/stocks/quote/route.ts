import { NextRequest, NextResponse } from 'next/server';

// Real-time stock quote API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quote: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      return NextResponse.json({ error: 'No data found for symbol' }, { status: 404 });
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    const latestIndex = quote.close.length - 1;

    const quoteData = {
      symbol: meta.symbol,
      price: meta.regularMarketPrice || quote.close[latestIndex],
      change: meta.regularMarketPrice - meta.chartPreviousClose,
      changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      open: quote.open[0],
      previousClose: meta.chartPreviousClose,
      volume: meta.regularMarketVolume,
    };

    return NextResponse.json(quoteData);
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}