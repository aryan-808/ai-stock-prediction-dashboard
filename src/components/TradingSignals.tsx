"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Zap,
  BarChart3,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import toast from "react-hot-toast";

interface TradingSignal {
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  reasoning: string[];
  technicalScore: number;
  sentimentScore: number;
  mlScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

interface SignalIndicator {
  name: string;
  value: number;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL";
  weight: number;
}

interface TradingSignalsProps {
  symbol: string;
  currentPrice: number;
  predictions: any;
  sentiment?: number;
  historicalData?: any[];
}

export default function TradingSignals({
  symbol,
  currentPrice,
  predictions,
  sentiment = 0.5,
  historicalData = [],
}: TradingSignalsProps) {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [indicators, setIndicators] = useState<SignalIndicator[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateSignal();
  }, [symbol, currentPrice, predictions, sentiment, historicalData]);

  const generateSignal = () => {
    setIsAnalyzing(true);

    // Calculate technical indicators
    const technicalIndicators = calculateTechnicalIndicators();
    setIndicators(technicalIndicators);

    // Calculate ML prediction score
    const mlScore = calculateMLScore();

    // Calculate sentiment score (0-100)
    const sentimentScore = sentiment * 100;

    // Calculate technical score
    const technicalScore = calculateTechnicalScore(technicalIndicators);

    // Overall score (weighted average)
    const overallScore = (mlScore * 0.5 + sentimentScore * 0.3 + technicalScore * 0.2);

    // Determine action
    let action: "BUY" | "SELL" | "HOLD" = "HOLD";
    if (overallScore >= 70) action = "BUY";
    else if (overallScore <= 30) action = "SELL";

    // Calculate confidence
    const confidence = Math.abs(overallScore - 50) * 2; // 0-100

    // Determine risk level
    const riskLevel = confidence < 40 ? "HIGH" : confidence < 70 ? "MEDIUM" : "LOW";

    // Calculate target price and stop loss
    const targetPrice = action === "BUY" 
      ? currentPrice * (1 + (confidence / 100) * 0.15)
      : action === "SELL"
      ? currentPrice * (1 - (confidence / 100) * 0.15)
      : undefined;

    const stopLoss = action === "BUY"
      ? currentPrice * 0.95
      : action === "SELL"
      ? currentPrice * 1.05
      : undefined;

    // Generate reasoning
    const reasoning: string[] = [];
    if (mlScore > 60) reasoning.push(`ML models predict ${mlScore > 70 ? 'strong' : 'moderate'} upward movement`);
    else if (mlScore < 40) reasoning.push(`ML models predict ${mlScore < 30 ? 'strong' : 'moderate'} downward movement`);
    
    if (sentimentScore > 60) reasoning.push(`Positive market sentiment (${sentimentScore.toFixed(0)}%)`);
    else if (sentimentScore < 40) reasoning.push(`Negative market sentiment (${sentimentScore.toFixed(0)}%)`);
    
    if (technicalScore > 60) reasoning.push(`Technical indicators show bullish signals`);
    else if (technicalScore < 40) reasoning.push(`Technical indicators show bearish signals`);

    if (reasoning.length === 0) reasoning.push(`Mixed signals - recommend holding position`);

    const tradingSignal: TradingSignal = {
      action,
      confidence,
      targetPrice,
      stopLoss,
      timeframe: "1-7 days",
      reasoning,
      technicalScore,
      sentimentScore,
      mlScore,
      riskLevel,
    };

    setSignal(tradingSignal);
    setIsAnalyzing(false);
  };

  const calculateMLScore = () => {
    if (!predictions || Object.keys(predictions).length === 0) return 50;

    // Average all model predictions
    let avgPrediction = 0;
    let count = 0;

    Object.values(predictions).forEach((modelPreds: any) => {
      if (Array.isArray(modelPreds) && modelPreds.length > 0) {
        const futurePrice = modelPreds[modelPreds.length - 1]?.price || currentPrice;
        avgPrediction += futurePrice;
        count++;
      }
    });

    if (count === 0) return 50;
    avgPrediction /= count;

    const priceChange = ((avgPrediction - currentPrice) / currentPrice) * 100;
    
    // Convert to 0-100 score
    return Math.max(0, Math.min(100, 50 + priceChange * 10));
  };

  const calculateTechnicalIndicators = (): SignalIndicator[] => {
    if (!historicalData || historicalData.length < 20) return [];

    const prices = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);

    // RSI
    const rsi = calculateRSI(prices);
    const rsiSignal = rsi > 70 ? "BEARISH" : rsi < 30 ? "BULLISH" : "NEUTRAL";

    // MACD
    const macd = calculateMACD(prices);
    const macdSignal = macd > 0 ? "BULLISH" : macd < 0 ? "BEARISH" : "NEUTRAL";

    // Moving Average
    const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);
    const maSignal = sma20 > sma50 ? "BULLISH" : sma20 < sma50 ? "BEARISH" : "NEUTRAL";

    // Volume trend
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeSignal = currentVolume > avgVolume * 1.2 ? "BULLISH" : "NEUTRAL";

    return [
      { name: "RSI", value: rsi, signal: rsiSignal, weight: 0.3 },
      { name: "MACD", value: macd, signal: macdSignal, weight: 0.3 },
      { name: "Moving Average", value: (sma20 / sma50 - 1) * 100, signal: maSignal, weight: 0.25 },
      { name: "Volume", value: (currentVolume / avgVolume - 1) * 100, signal: volumeSignal, weight: 0.15 },
    ];
  };

  const calculateTechnicalScore = (indicators: SignalIndicator[]) => {
    if (indicators.length === 0) return 50;

    let score = 0;
    indicators.forEach(ind => {
      const indScore = ind.signal === "BULLISH" ? 100 : ind.signal === "BEARISH" ? 0 : 50;
      score += indScore * ind.weight;
    });

    return score;
  };

  const calculateRSI = (prices: number[], period = 14) => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (prices: number[]) => {
    if (prices.length < 26) return 0;

    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    return ema12 - ema26;
  };

  const calculateEMA = (prices: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  };

  const handleCopySignal = () => {
    if (!signal) return;

    const text = `
Trading Signal for ${symbol}
Action: ${signal.action}
Confidence: ${signal.confidence.toFixed(0)}%
Current Price: $${currentPrice.toFixed(2)}
${signal.targetPrice ? `Target Price: $${signal.targetPrice.toFixed(2)}` : ''}
${signal.stopLoss ? `Stop Loss: $${signal.stopLoss.toFixed(2)}` : ''}
Risk Level: ${signal.riskLevel}
    `.trim();

    navigator.clipboard.writeText(text);
    toast.success("Signal copied to clipboard!");
  };

  if (isAnalyzing || !signal) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Activity className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-lg text-muted-foreground">Analyzing trading signals...</p>
        </div>
      </Card>
    );
  }

  const SignalIcon = signal.action === "BUY" 
    ? ArrowUpCircle 
    : signal.action === "SELL" 
    ? ArrowDownCircle 
    : Minus;

  const signalColor = signal.action === "BUY" 
    ? "text-green-500" 
    : signal.action === "SELL" 
    ? "text-red-500" 
    : "text-yellow-500";

  const signalBg = signal.action === "BUY"
    ? "bg-green-500/10"
    : signal.action === "SELL"
    ? "bg-red-500/10"
    : "bg-yellow-500/10";

  return (
    <div className="space-y-6">
      {/* Main Signal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`p-8 border-4 backdrop-blur-lg relative overflow-hidden ${
          signal.action === "BUY" ? "border-green-500/50" : signal.action === "SELL" ? "border-red-500/50" : "border-yellow-500/50"
        }`}>
          <div className={`absolute inset-0 ${signalBg} opacity-20`} />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${signalBg}`}>
                  <SignalIcon className={`h-12 w-12 ${signalColor}`} />
                </div>
                <div>
                  <h3 className="text-4xl font-bold flex items-center gap-3">
                    {signal.action}
                    <Badge variant={signal.action === "BUY" ? "default" : signal.action === "SELL" ? "destructive" : "secondary"} className="text-lg px-4 py-1">
                      {signal.riskLevel} RISK
                    </Badge>
                  </h3>
                  <p className="text-muted-foreground mt-1">Confidence: <span className="font-bold text-lg">{signal.confidence.toFixed(0)}%</span></p>
                </div>
              </div>

              <Button onClick={handleCopySignal} variant="outline" className="gap-2">
                <Zap className="h-4 w-4" />
                Copy Signal
              </Button>
            </div>

            {/* Confidence Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Signal Strength</span>
                <span className="font-semibold">{signal.confidence.toFixed(0)}%</span>
              </div>
              <Progress value={signal.confidence} className="h-3" />
            </div>

            {/* Price Targets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${signalBg} border-2 border-border`}>
                <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
              </div>

              {signal.targetPrice && (
                <div className={`p-4 rounded-lg ${signalBg} border-2 border-green-500/30`}>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Target Price
                  </div>
                  <div className="text-2xl font-bold text-green-500">${signal.targetPrice.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((signal.targetPrice / currentPrice - 1) * 100).toFixed(1)}% potential
                  </div>
                </div>
              )}

              {signal.stopLoss && (
                <div className={`p-4 rounded-lg ${signalBg} border-2 border-red-500/30`}>
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Stop Loss
                  </div>
                  <div className="text-2xl font-bold text-red-500">${signal.stopLoss.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {((signal.stopLoss / currentPrice - 1) * 100).toFixed(1)}% risk
                  </div>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Signal Reasoning:</h4>
              {signal.reasoning.map((reason, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{reason}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="scores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scores">Score Breakdown</TabsTrigger>
          <TabsTrigger value="indicators">Technical Indicators</TabsTrigger>
        </TabsList>

        {/* Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ML Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">ML Models</h4>
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{signal.mlScore.toFixed(0)}%</div>
                <Progress value={signal.mlScore} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {signal.mlScore > 60 ? "Bullish prediction" : signal.mlScore < 40 ? "Bearish prediction" : "Neutral prediction"}
                </p>
              </Card>
            </motion.div>

            {/* Sentiment Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Sentiment</h4>
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{signal.sentimentScore.toFixed(0)}%</div>
                <Progress value={signal.sentimentScore} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {signal.sentimentScore > 60 ? "Positive sentiment" : signal.sentimentScore < 40 ? "Negative sentiment" : "Neutral sentiment"}
                </p>
              </Card>
            </motion.div>

            {/* Technical Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Technical</h4>
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold mb-2">{signal.technicalScore.toFixed(0)}%</div>
                <Progress value={signal.technicalScore} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {signal.technicalScore > 60 ? "Bullish indicators" : signal.technicalScore < 40 ? "Bearish indicators" : "Neutral indicators"}
                </p>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Indicators Tab */}
        <TabsContent value="indicators" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((indicator, idx) => (
              <motion.div
                key={indicator.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">{indicator.name}</h4>
                    <Badge 
                      variant={indicator.signal === "BULLISH" ? "default" : indicator.signal === "BEARISH" ? "destructive" : "secondary"}
                    >
                      {indicator.signal}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold mb-2">
                    {indicator.value.toFixed(2)}
                    {indicator.name === "RSI" && " / 100"}
                  </div>
                  <div className="flex items-center gap-2">
                    {indicator.signal === "BULLISH" ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : indicator.signal === "BEARISH" ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <Minus className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      Weight: {(indicator.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      <Card className="p-4 bg-muted/50 border-2 border-yellow-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Investment Disclaimer</p>
            <p className="text-muted-foreground">
              This signal is generated by AI algorithms and should not be considered as financial advice. 
              Always do your own research and consult with a financial advisor before making investment decisions.
              Past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}