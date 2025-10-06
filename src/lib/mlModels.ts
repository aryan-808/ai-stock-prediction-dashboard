// ML Model predictions - LSTM, GRU, Transformer
import { StockData } from './stockApi';

export interface ModelPrediction {
  date: string;
  predicted: number;
  actual?: number;
  confidence: number;
}

export interface ModelMetrics {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  r2: number; // R-squared
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
}

export type ModelType = 'LSTM' | 'GRU' | 'Transformer';

// Simulate LSTM predictions with realistic patterns
function simulateLSTM(historicalData: StockData[], days: number): ModelPrediction[] {
  const predictions: ModelPrediction[] = [];
  const lastPrice = historicalData[historicalData.length - 1].close;
  const volatility = calculateVolatility(historicalData);
  
  let currentPrice = lastPrice;
  const trend = calculateTrend(historicalData);
  
  for (let i = 1; i <= days; i++) {
    const trendComponent = trend * 0.002;
    const randomWalk = (Math.random() - 0.48) * volatility * 0.8;
    const momentum = (currentPrice - lastPrice) / lastPrice * 0.3;
    
    currentPrice = currentPrice * (1 + trendComponent + randomWalk + momentum);
    
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    lastDate.setDate(lastDate.getDate() + i);
    
    predictions.push({
      date: lastDate.toISOString().split('T')[0],
      predicted: currentPrice,
      confidence: Math.max(0.6, 1 - (i / days) * 0.4),
    });
  }
  
  return predictions;
}

// Simulate GRU predictions with different characteristics
function simulateGRU(historicalData: StockData[], days: number): ModelPrediction[] {
  const predictions: ModelPrediction[] = [];
  const lastPrice = historicalData[historicalData.length - 1].close;
  const volatility = calculateVolatility(historicalData);
  
  let currentPrice = lastPrice;
  const recentPrices = historicalData.slice(-20).map(d => d.close);
  const shortTermTrend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
  
  for (let i = 1; i <= days; i++) {
    const trendComponent = shortTermTrend * 0.015;
    const randomWalk = (Math.random() - 0.5) * volatility * 0.7;
    const meanReversion = (lastPrice - currentPrice) / lastPrice * 0.1;
    
    currentPrice = currentPrice * (1 + trendComponent + randomWalk + meanReversion);
    
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    lastDate.setDate(lastDate.getDate() + i);
    
    predictions.push({
      date: lastDate.toISOString().split('T')[0],
      predicted: currentPrice,
      confidence: Math.max(0.65, 1 - (i / days) * 0.35),
    });
  }
  
  return predictions;
}

// Simulate Transformer predictions with attention mechanism patterns
function simulateTransformer(historicalData: StockData[], days: number): ModelPrediction[] {
  const predictions: ModelPrediction[] = [];
  const lastPrice = historicalData[historicalData.length - 1].close;
  const volatility = calculateVolatility(historicalData);
  
  let currentPrice = lastPrice;
  const longTermTrend = calculateTrend(historicalData);
  const recentPrices = historicalData.slice(-10).map(d => d.close);
  const shortTermTrend = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
  
  for (let i = 1; i <= days; i++) {
    // Transformer combines long and short term patterns
    const longTrendComponent = longTermTrend * 0.003;
    const shortTrendComponent = shortTermTrend * 0.01;
    const randomWalk = (Math.random() - 0.49) * volatility * 0.6;
    const attention = Math.sin(i / 5) * 0.002; // Simulates attention mechanism
    
    currentPrice = currentPrice * (1 + longTrendComponent + shortTrendComponent + randomWalk + attention);
    
    const lastDate = new Date(historicalData[historicalData.length - 1].date);
    lastDate.setDate(lastDate.getDate() + i);
    
    predictions.push({
      date: lastDate.toISOString().split('T')[0],
      predicted: currentPrice,
      confidence: Math.max(0.7, 1 - (i / days) * 0.3),
    });
  }
  
  return predictions;
}

function calculateVolatility(data: StockData[]): number {
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateTrend(data: StockData[]): number {
  const prices = data.map(d => d.close);
  const n = prices.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = prices;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

export async function predictStock(
  symbol: string,
  historicalData: StockData[],
  model: ModelType,
  days: number
): Promise<ModelPrediction[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  switch (model) {
    case 'LSTM':
      return simulateLSTM(historicalData, days);
    case 'GRU':
      return simulateGRU(historicalData, days);
    case 'Transformer':
      return simulateTransformer(historicalData, days);
    default:
      return simulateLSTM(historicalData, days);
  }
}

export function calculateMetrics(
  predictions: ModelPrediction[],
  actualData: StockData[]
): ModelMetrics {
  // Calculate backtest metrics on historical data
  const errors = predictions
    .filter(p => p.actual !== undefined)
    .map(p => Math.abs(p.predicted - p.actual!));
  
  const mae = errors.length > 0 ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
  
  const squaredErrors = predictions
    .filter(p => p.actual !== undefined)
    .map(p => Math.pow(p.predicted - p.actual!, 2));
  const rmse = squaredErrors.length > 0 
    ? Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length)
    : 0;
  
  const percentageErrors = predictions
    .filter(p => p.actual !== undefined && p.actual !== 0)
    .map(p => Math.abs((p.predicted - p.actual!) / p.actual!) * 100);
  const mape = percentageErrors.length > 0
    ? percentageErrors.reduce((a, b) => a + b, 0) / percentageErrors.length
    : 0;
  
  // R-squared calculation
  const actualValues = predictions.filter(p => p.actual !== undefined).map(p => p.actual!);
  const predictedValues = predictions.filter(p => p.actual !== undefined).map(p => p.predicted);
  const meanActual = actualValues.reduce((a, b) => a + b, 0) / actualValues.length;
  const ssRes = actualValues.reduce((sum, actual, i) => sum + Math.pow(actual - predictedValues[i], 2), 0);
  const ssTot = actualValues.reduce((sum, actual) => sum + Math.pow(actual - meanActual, 2), 0);
  const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
  
  // Sharpe Ratio (simplified)
  const returns = [];
  for (let i = 1; i < predictedValues.length; i++) {
    returns.push((predictedValues[i] - predictedValues[i - 1]) / predictedValues[i - 1]);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(
    returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdReturn !== 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;
  
  // Volatility
  const volatility = stdReturn * Math.sqrt(252) * 100;
  
  // Max Drawdown
  let maxDrawdown = 0;
  let peak = predictedValues[0];
  for (const value of predictedValues) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  return {
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mape: Number(mape.toFixed(2)),
    r2: Number(r2.toFixed(4)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    volatility: Number(volatility.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
  };
}

// Backtest model on historical data
export async function backtestModel(
  historicalData: StockData[],
  model: ModelType,
  testDays: number
): Promise<ModelPrediction[]> {
  const trainingData = historicalData.slice(0, -testDays);
  const testData = historicalData.slice(-testDays);
  
  const predictions = await predictStock('', trainingData, model, testDays);
  
  // Add actual values for comparison
  return predictions.map((pred, i) => ({
    ...pred,
    actual: i < testData.length ? testData[i].close : undefined,
  }));
}