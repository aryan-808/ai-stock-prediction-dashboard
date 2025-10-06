"use client";

import { NewsItem } from "@/lib/stockApi";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ExternalLink, Newspaper } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

interface SentimentAnalysisProps {
  news: NewsItem[];
  symbol: string;
}

export default function SentimentAnalysis({ news, symbol }: SentimentAnalysisProps) {
  if (news.length === 0) {
    return null;
  }

  // Calculate overall sentiment
  const avgSentiment = news.reduce((sum, item) => sum + item.sentiment, 0) / news.length;
  
  // Group by date for trend chart
  const sentimentByDate = news.reduce((acc, item) => {
    const date = item.publishedAt.split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, sentiments: [], count: 0 };
    }
    acc[date].sentiments.push(item.sentiment);
    acc[date].count++;
    return acc;
  }, {} as Record<string, { date: string; sentiments: number[]; count: number }>);

  const sentimentTrend = Object.values(sentimentByDate)
    .map(({ date, sentiments }) => ({
      date,
      sentiment: sentiments.reduce((a, b) => a + b, 0) / sentiments.length,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.1) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (sentiment < -0.1) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.1) return "text-green-500";
    if (sentiment < -0.1) return "text-red-500";
    return "text-gray-500";
  };

  const getSentimentBg = (sentiment: number) => {
    if (sentiment > 0.1) return "bg-green-500/15 border-green-500/30";
    if (sentiment < -0.1) return "bg-red-500/15 border-red-500/30";
    return "bg-gray-500/15 border-gray-500/30";
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-xl blur-xl" />
          <div className="relative bg-card/98 backdrop-blur-2xl border-2 border-primary/30 rounded-xl p-5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]">
            <p className="font-bold text-foreground mb-2">{format(new Date(label), "MMM dd, yyyy")}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
                Sentiment: <span className="text-foreground font-bold">{Number(entry.value).toFixed(2)}</span>
              </p>
            ))}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="p-6 bg-card/90 backdrop-blur-2xl border-2 border-border/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-primary/20 rounded-2xl backdrop-blur-sm border border-primary/30"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Newspaper className="h-8 w-8 text-primary" />
              </motion.div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Sentiment Analysis
              </h3>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <motion.div
                className={`absolute inset-0 ${getSentimentBg(avgSentiment)} rounded-full blur-xl`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className={`relative flex items-center gap-3 px-8 py-4 rounded-full border-2 ${getSentimentBg(avgSentiment)} shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-sm`}>
                <motion.div
                  animate={{ rotate: avgSentiment > 0 ? [0, 10, 0] : avgSentiment < 0 ? [0, -10, 0] : 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {getSentimentIcon(avgSentiment)}
                </motion.div>
                <div>
                  <span className={`font-bold text-xl ${getSentimentColor(avgSentiment)}`}>
                    {avgSentiment > 0 ? "Bullish" : avgSentiment < 0 ? "Bearish" : "Neutral"}
                  </span>
                  <span className="text-muted-foreground text-sm ml-2">
                    ({(avgSentiment * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>
      </div>

      {/* Sentiment Trend Chart */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-2xl blur-xl" />
        <Card className="p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] border-2 border-border/50 bg-card/90 backdrop-blur-2xl relative overflow-hidden">
          {/* Ice crystal overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(100,180,255,0.1),transparent_50%)] pointer-events-none" />
          
          <h4 className="text-xl font-bold mb-6 relative z-10">Sentiment Trend (Last 14 Days)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sentimentTrend} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                </linearGradient>
                <filter id="sentimentGlow">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="sentimentShadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.4"/>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="5 5" className="stroke-muted/20" opacity={0.4} strokeWidth={1.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                className="text-muted-foreground text-xs"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fontWeight: 600 }}
              />
              <YAxis 
                domain={[-1, 1]} 
                className="text-muted-foreground text-xs"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 }} />
              <Line
                type="monotone"
                dataKey="sentiment"
                stroke="url(#sentimentGradient)"
                strokeWidth={5}
                dot={{ r: 7, fill: "hsl(var(--primary))", strokeWidth: 3, stroke: "#fff", filter: "url(#sentimentShadow)" }}
                filter="url(#sentimentGlow)"
                activeDot={{ r: 10, fill: "hsl(var(--primary))", stroke: "#fff", strokeWidth: 3, filter: "url(#sentimentShadow)" }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* News List */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="space-y-4"
      >
        <h4 className="text-xl font-bold">Recent News ({news.length})</h4>
        <div className="grid gap-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          {news.slice(0, 20).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className="relative group"
            >
              <motion.div
                className={`absolute inset-0 ${getSentimentBg(item.sentiment)} rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <Card className={`relative p-6 border-l-4 ${getSentimentBg(item.sentiment)} hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 backdrop-blur-xl`}>
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="flex-shrink-0 pt-1"
                    whileHover={{ scale: 1.3, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {getSentimentIcon(item.sentiment)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-2 group/link text-base"
                    >
                      <span>{item.title}</span>
                      <ExternalLink className="h-4 w-4 flex-shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity mt-1" />
                    </a>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-semibold">{item.source}</span>
                      <span>•</span>
                      <span>{format(new Date(item.publishedAt), "MMM dd, yyyy HH:mm")}</span>
                      <span>•</span>
                      <motion.span 
                        className={`${getSentimentColor(item.sentiment)} font-bold`}
                        whileHover={{ scale: 1.1 }}
                      >
                        Sentiment: {(item.sentiment * 100).toFixed(0)}%
                      </motion.span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}