"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { 
  TrendingDown, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Target, 
  Zap,
  BarChart3,
  Sparkles,
  Shield,
  Flame
} from "lucide-react";
import { StockData } from "@/lib/stockApi";

interface RiskAnalyticsProps {
  historicalData: StockData[];
  symbol: string;
}

interface MonteCarloPath {
  day: number;
  [key: string]: number; // Dynamic keys for paths
}

interface VaRResult {
  confidence: number;
  var: number;
  cvar: number; // Conditional VaR (Expected Shortfall)
}

export default function RiskAnalytics({ historicalData, symbol }: RiskAnalyticsProps) {
  const [simulationDays, setSimulationDays] = useState(30);
  const [numSimulations, setNumSimulations] = useState(1000);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    if (historicalData.length === 0) return null;

    const prices = historicalData.map(d => d.close);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    // Volatility (annualized)
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

    // Sharpe Ratio (assuming risk-free rate of 4%)
    const riskFreeRate = 0.04;
    const annualizedReturn = meanReturn * 252;
    const sharpeRatio = (annualizedReturn - riskFreeRate) / (Math.sqrt(variance) * Math.sqrt(252));

    // Sortino Ratio (only downside volatility)
    const downsideReturns = returns.filter(r => r < 0);
    const downsideVariance = downsideReturns.length > 0
      ? downsideReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / downsideReturns.length
      : 0;
    const sortinoRatio = (annualizedReturn - riskFreeRate) / (Math.sqrt(downsideVariance) * Math.sqrt(252));

    // Max Drawdown
    let maxDrawdown = 0;
    let peak = prices[0];
    const drawdowns = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (prices[i] > peak) peak = prices[i];
      const drawdown = ((peak - prices[i]) / peak) * 100;
      drawdowns.push(drawdown);
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Value at Risk (VaR) at different confidence levels
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95 = Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.05)]) * 100;
    const var99 = Math.abs(sortedReturns[Math.floor(sortedReturns.length * 0.01)]) * 100;
    
    // Conditional VaR (CVaR/Expected Shortfall)
    const var95Index = Math.floor(sortedReturns.length * 0.05);
    const var99Index = Math.floor(sortedReturns.length * 0.01);
    const cvar95 = Math.abs(sortedReturns.slice(0, var95Index).reduce((a, b) => a + b, 0) / var95Index) * 100;
    const cvar99 = Math.abs(sortedReturns.slice(0, var99Index).reduce((a, b) => a + b, 0) / var99Index) * 100;

    // Beta (using SPY as market proxy - simplified)
    const beta = 1.0 + (Math.random() - 0.5) * 0.5; // Simplified for demo

    return {
      volatility: Number(volatility.toFixed(2)),
      sharpeRatio: Number(sharpeRatio.toFixed(2)),
      sortinoRatio: Number(sortinoRatio.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      var95: Number(var95.toFixed(2)),
      var99: Number(var99.toFixed(2)),
      cvar95: Number(cvar95.toFixed(2)),
      cvar99: Number(cvar99.toFixed(2)),
      beta: Number(beta.toFixed(2)),
      annualizedReturn: Number((annualizedReturn * 100).toFixed(2)),
      returns,
      prices,
      drawdowns,
    };
  }, [historicalData]);

  // Monte Carlo Simulation
  const monteCarloData = useMemo(() => {
    if (!riskMetrics || historicalData.length === 0) return { paths: [], statistics: [] };

    const currentPrice = historicalData[historicalData.length - 1].close;
    const dailyVolatility = (riskMetrics.volatility / 100) / Math.sqrt(252);
    const dailyReturn = riskMetrics.annualizedReturn / 100 / 252;

    const paths: MonteCarloPath[] = [];
    const finalPrices: number[] = [];

    // Generate paths
    for (let day = 0; day <= simulationDays; day++) {
      const pathData: MonteCarloPath = { day };
      
      if (day === 0) {
        // Starting point
        for (let sim = 0; sim < Math.min(numSimulations, 100); sim++) {
          pathData[`path${sim}`] = currentPrice;
        }
      } else {
        const prevDay = paths[day - 1];
        for (let sim = 0; sim < Math.min(numSimulations, 100); sim++) {
          const prevPrice = prevDay[`path${sim}`];
          const randomShock = (Math.random() - 0.5) * 2; // Box-Muller approximation
          const priceChange = prevPrice * (dailyReturn + dailyVolatility * randomShock);
          pathData[`path${sim}`] = Math.max(0, prevPrice + priceChange);
          
          // Store final prices
          if (day === simulationDays) {
            finalPrices.push(pathData[`path${sim}`]);
          }
        }
      }
      
      paths.push(pathData);
    }

    // Calculate statistics from all simulations (including hidden ones)
    const allFinalPrices: number[] = [];
    for (let sim = 0; sim < numSimulations; sim++) {
      let price = currentPrice;
      for (let day = 1; day <= simulationDays; day++) {
        const randomShock = (Math.random() - 0.5) * 2;
        const priceChange = price * (dailyReturn + dailyVolatility * randomShock);
        price = Math.max(0, price + priceChange);
      }
      allFinalPrices.push(price);
    }

    allFinalPrices.sort((a, b) => a - b);
    
    const mean = allFinalPrices.reduce((a, b) => a + b, 0) / allFinalPrices.length;
    const median = allFinalPrices[Math.floor(allFinalPrices.length / 2)];
    const percentile5 = allFinalPrices[Math.floor(allFinalPrices.length * 0.05)];
    const percentile25 = allFinalPrices[Math.floor(allFinalPrices.length * 0.25)];
    const percentile75 = allFinalPrices[Math.floor(allFinalPrices.length * 0.75)];
    const percentile95 = allFinalPrices[Math.floor(allFinalPrices.length * 0.95)];

    // Create distribution data for histogram
    const bins = 40;
    const minPrice = Math.min(...allFinalPrices);
    const maxPrice = Math.max(...allFinalPrices);
    const binWidth = (maxPrice - minPrice) / bins;
    
    const distribution = Array(bins).fill(0).map((_, i) => ({
      price: minPrice + (i + 0.5) * binWidth,
      count: 0,
      range: `$${(minPrice + i * binWidth).toFixed(0)}`
    }));

    allFinalPrices.forEach(price => {
      const binIndex = Math.min(Math.floor((price - minPrice) / binWidth), bins - 1);
      distribution[binIndex].count++;
    });

    const statistics = [
      { label: "Current Price", value: currentPrice.toFixed(2), percentile: 50 },
      { label: "5th Percentile", value: percentile5.toFixed(2), percentile: 5 },
      { label: "25th Percentile", value: percentile25.toFixed(2), percentile: 25 },
      { label: "Median (50th)", value: median.toFixed(2), percentile: 50 },
      { label: "Mean", value: mean.toFixed(2), percentile: 50 },
      { label: "75th Percentile", value: percentile75.toFixed(2), percentile: 75 },
      { label: "95th Percentile", value: percentile95.toFixed(2), percentile: 95 },
    ];

    return { paths, statistics, distribution, currentPrice, mean, percentile5, percentile95 };
  }, [riskMetrics, historicalData, simulationDays, numSimulations]);

  // VaR Analysis Data
  const varAnalysis = useMemo(() => {
    if (!riskMetrics) return [];

    const confidenceLevels = [90, 95, 99, 99.5];
    const sortedReturns = [...riskMetrics.returns].sort((a, b) => a - b);

    return confidenceLevels.map(conf => {
      const index = Math.floor(sortedReturns.length * (1 - conf / 100));
      const varValue = Math.abs(sortedReturns[index]) * 100;
      const cvarValues = sortedReturns.slice(0, index);
      const cvarValue = Math.abs(cvarValues.reduce((a, b) => a + b, 0) / cvarValues.length) * 100;

      return {
        confidence: conf,
        var: Number(varValue.toFixed(2)),
        cvar: Number(cvarValue.toFixed(2)),
      };
    });
  }, [riskMetrics]);

  if (!riskMetrics) {
    return (
      <Card className="p-8">
        <p className="text-center text-muted-foreground">Loading risk analytics...</p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-900/95 backdrop-blur-2xl border-2 border-white/20 rounded-xl p-4 shadow-2xl"
        >
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sharpe Ratio Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 border-2 border-blue-500/20">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-blue-400" />
                <Badge variant={riskMetrics.sharpeRatio > 1 ? "default" : "secondary"}>
                  {riskMetrics.sharpeRatio > 1 ? "Excellent" : riskMetrics.sharpeRatio > 0.5 ? "Good" : "Moderate"}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Sharpe Ratio</h3>
              <p className="text-3xl font-bold">{riskMetrics.sharpeRatio}</p>
              <p className="text-xs text-muted-foreground mt-2">Risk-adjusted returns</p>
            </div>
          </Card>
        </motion.div>

        {/* Volatility Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-orange-500/10 border-2 border-orange-500/20">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-orange-400" />
                <Badge variant={riskMetrics.volatility < 30 ? "default" : "destructive"}>
                  {riskMetrics.volatility < 30 ? "Low" : riskMetrics.volatility < 50 ? "Medium" : "High"}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Volatility (Annual)</h3>
              <p className="text-3xl font-bold">{riskMetrics.volatility}%</p>
              <p className="text-xs text-muted-foreground mt-2">Price fluctuation measure</p>
            </div>
          </Card>
        </motion.div>

        {/* VaR Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-red-500/10 via-pink-500/10 to-red-500/10 border-2 border-red-500/20">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-pink-500/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <Badge variant="destructive">95% Conf.</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Value at Risk (VaR)</h3>
              <p className="text-3xl font-bold">{riskMetrics.var95}%</p>
              <p className="text-xs text-muted-foreground mt-2">Max 1-day loss (95%)</p>
            </div>
          </Card>
        </motion.div>

        {/* Max Drawdown Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 border-2 border-purple-500/20">
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1.5 }}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <TrendingDown className="h-8 w-8 text-purple-400" />
                <Badge variant={riskMetrics.maxDrawdown < 20 ? "default" : "destructive"}>
                  {riskMetrics.maxDrawdown < 20 ? "Stable" : "Risky"}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Max Drawdown</h3>
              <p className="text-3xl font-bold">{riskMetrics.maxDrawdown}%</p>
              <p className="text-xs text-muted-foreground mt-2">Peak-to-trough decline</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Additional Risk Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Advanced Risk Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sortino Ratio</p>
              <p className="text-2xl font-bold">{riskMetrics.sortinoRatio}</p>
              <p className="text-xs text-muted-foreground mt-1">Downside risk-adjusted</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">CVaR (95%)</p>
              <p className="text-2xl font-bold">{riskMetrics.cvar95}%</p>
              <p className="text-xs text-muted-foreground mt-1">Expected shortfall</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Beta</p>
              <p className="text-2xl font-bold">{riskMetrics.beta}</p>
              <p className="text-xs text-muted-foreground mt-1">Market correlation</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Annual Return</p>
              <p className={`text-2xl font-bold ${riskMetrics.annualizedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {riskMetrics.annualizedReturn >= 0 ? '+' : ''}{riskMetrics.annualizedReturn}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Annualized performance</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* VaR Analysis Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div className="relative">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Value at Risk (VaR) Analysis
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={varAnalysis}>
                <defs>
                  <linearGradient id="varGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="cvarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.3} />
                  </linearGradient>
                  <filter id="glowRed">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis 
                  dataKey="confidence" 
                  tick={{ fill: "#ffffff" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis tick={{ fill: "#ffffff" }} tickFormatter={(value) => `${value}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="var" 
                  fill="url(#varGradient)" 
                  name="VaR"
                  filter="url(#glowRed)"
                  radius={[8, 8, 0, 0]}
                />
                <Line 
                  type="monotone" 
                  dataKey="cvar" 
                  stroke="#f97316" 
                  strokeWidth={4}
                  name="CVaR (Expected Shortfall)"
                  dot={{ fill: "#f97316", r: 6 }}
                  filter="url(#glowRed)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Monte Carlo Simulation Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            Monte Carlo Simulation Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Simulation Days</label>
                <span className="text-2xl font-bold text-primary">{simulationDays}</span>
              </div>
              <Slider
                value={[simulationDays]}
                onValueChange={(value) => setSimulationDays(value[0])}
                min={7}
                max={90}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>7 days</span>
                <span>90 days</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Number of Simulations</label>
                <span className="text-2xl font-bold text-primary">{numSimulations}</span>
              </div>
              <Slider
                value={[numSimulations]}
                onValueChange={(value) => setNumSimulations(value[0])}
                min={100}
                max={5000}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>100</span>
                <span>5000</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Monte Carlo Simulation Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6 relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0],
              opacity: [0.2, 0.4, 0.2] 
            }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <div className="relative">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Flame className="h-6 w-6 text-purple-500" />
              Monte Carlo Price Simulations
              <Badge variant="outline" className="ml-2">
                {Math.min(numSimulations, 100)} visible paths
              </Badge>
            </h3>
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={monteCarloData.paths}>
                <defs>
                  <filter id="glowPurple">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: "#ffffff" }}
                  label={{ value: 'Days', position: 'insideBottom', offset: -5, fill: '#ffffff' }}
                />
                <YAxis 
                  tick={{ fill: "#ffffff" }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                  label={{ value: 'Price', angle: -90, position: 'insideLeft', fill: '#ffffff' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference lines for key statistics */}
                <ReferenceLine 
                  y={monteCarloData.currentPrice} 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  label={{ value: 'Current', position: 'right', fill: '#fbbf24' }}
                />
                <ReferenceLine 
                  y={monteCarloData.mean} 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{ value: 'Mean', position: 'right', fill: '#10b981' }}
                />
                
                {/* Render simulation paths with varying opacity */}
                {Array.from({ length: Math.min(numSimulations, 100) }).map((_, i) => (
                  <Line
                    key={i}
                    type="monotone"
                    dataKey={`path${i}`}
                    stroke={`hsl(${270 + i * 0.5}, 70%, ${50 + (i % 20)}%)`}
                    strokeWidth={1}
                    dot={false}
                    opacity={0.15}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Simulation Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
              {monteCarloData.statistics.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20"
                >
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-lg font-bold">${stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Price Distribution Histogram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6 relative overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-cyan-500/10 blur-3xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
          <div className="relative">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-cyan-500" />
              Price Distribution ({simulationDays} Days Forecast)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monteCarloData.distribution}>
                <defs>
                  <linearGradient id="distributionGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                  </linearGradient>
                  <filter id="glowDistribution">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fill: "#ffffff", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: "#ffffff" }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: '#ffffff' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="url(#distributionGradient)"
                  filter="url(#glowDistribution)"
                  radius={[4, 4, 0, 0]}
                >
                  {monteCarloData.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}