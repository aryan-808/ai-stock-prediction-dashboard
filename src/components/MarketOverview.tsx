"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Loader2, RefreshCw } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

interface SectorData {
  name: string;
  performance: number;
  volume: number;
  color: string;
}

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface MarketSentiment {
  score: number;
  averageChange: number;
  gainers: number;
  losers: number;
  neutral: number;
}

interface MarketData {
  sectors: SectorData[];
  topGainers: StockMover[];
  topLosers: StockMover[];
  marketSentiment: MarketSentiment;
  timestamp: string;
}

export default function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/market/overview');
      const data = await response.json();
      setMarketData(data);
      toast.success('Market data updated');
    } catch (error) {
      toast.error('Failed to fetch market data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !marketData) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading market overview...</p>
        </div>
      </Card>
    );
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.6) return 'text-green-500';
    if (score < 0.4) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.65) return 'Bullish';
    if (score > 0.55) return 'Slightly Bullish';
    if (score > 0.45) return 'Neutral';
    if (score > 0.35) return 'Slightly Bearish';
    return 'Bearish';
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Market Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time sector performance and market movers
          </p>
        </div>
        <Button onClick={fetchMarketData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Market Sentiment Gauge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-blue-500/10">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Market Sentiment
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getSentimentColor(marketData.marketSentiment.score)}`}>
                  {(marketData.marketSentiment.score * 100).toFixed(0)}%
                </div>
                <div className="text-2xl font-semibold mt-2">
                  {getSentimentLabel(marketData.marketSentiment.score)}
                </div>
              </div>
              
              {/* Sentiment bar */}
              <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8 }}
                />
                <motion.div
                  className="absolute top-0 h-full w-1 bg-white shadow-lg"
                  initial={{ left: '50%' }}
                  animate={{ left: `${marketData.marketSentiment.score * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-card rounded-lg border">
                <div className="text-3xl font-bold text-green-500">
                  {marketData.marketSentiment.gainers}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Gainers</div>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border">
                <div className="text-3xl font-bold text-yellow-500">
                  {marketData.marketSentiment.neutral}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Neutral</div>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border">
                <div className="text-3xl font-bold text-red-500">
                  {marketData.marketSentiment.losers}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Losers</div>
              </div>
              <div className="col-span-3 text-center p-4 bg-card rounded-lg border">
                <div className={`text-3xl font-bold ${marketData.marketSentiment.averageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {marketData.marketSentiment.averageChange >= 0 ? '+' : ''}{marketData.marketSentiment.averageChange.toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">Average Change</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Sector Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">Sector Heatmap</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketData.sectors.map((sector, index) => (
              <motion.div
                key={sector.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`relative p-6 rounded-lg overflow-hidden group cursor-pointer transition-transform hover:scale-105`}
                style={{
                  background: sector.performance >= 0 
                    ? `linear-gradient(135deg, ${sector.color}20, ${sector.color}40)`
                    : `linear-gradient(135deg, #ef444420, #ef444440)`,
                  borderLeft: `4px solid ${sector.performance >= 0 ? sector.color : '#ef4444'}`,
                }}
              >
                <div className="relative z-10">
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    {sector.name}
                  </div>
                  <div className={`text-3xl font-bold ${sector.performance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Vol: {(sector.volume / 1000000).toFixed(0)}M
                  </div>
                </div>
                
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-10"
                  style={{ background: sector.color }}
                  initial={false}
                  whileHover={{ scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Top Gainers and Losers */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Gainers
            </h3>
            <div className="space-y-3">
              {marketData.topGainers.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 hover:bg-green-500/10 transition-colors border border-green-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        ${stock.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-500">
                      +{stock.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +${stock.change.toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Losers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Top Losers
            </h3>
            <div className="space-y-3">
              {marketData.topLosers.map((stock, index) => (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-bold">{stock.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        ${stock.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-500">
                      {stock.changePercent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${stock.change.toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}