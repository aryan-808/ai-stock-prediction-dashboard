// Stock data API utilities - supports multiple exchanges worldwide
import axios from 'axios';

export interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: number; // -1 to 1
}

// Trending stocks across global exchanges
export const TRENDING_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'BTC-USD', name: 'Bitcoin', exchange: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', exchange: 'Crypto' },
];

// Fetch real-time stock data using Yahoo Finance API alternative
export async function fetchStockData(symbol: string, period: string = '1y'): Promise<StockData[]> {
  try {
    // Using Yahoo Finance API through RapidAPI or similar service
    const response = await fetch(`/api/stocks/history?symbol=${symbol}&period=${period}`);
    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const response = await fetch(`/api/stocks/quote?symbol=${symbol}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
}

export async function searchStocks(query: string): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  try {
    const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}

export async function fetchNewsAndSentiment(symbol: string): Promise<NewsItem[]> {
  try {
    const response = await fetch(`/api/stocks/news?symbol=${symbol}`);
    const data = await response.json();
    return data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
}

// Technical indicators
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[i]);
    } else {
      ema.push((data[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const changes: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      rsi.push(NaN);
    } else {
      const recentChanges = changes.slice(i - period, i);
      const gains = recentChanges.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
      const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
      const rs = gains / (losses || 1);
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}