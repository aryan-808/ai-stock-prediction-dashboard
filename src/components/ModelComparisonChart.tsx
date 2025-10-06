"use client";

import React from "react";
import { ModelMetrics } from "@/lib/mlModels";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { TrendingUp, Award, Target, Zap, BarChart3, Activity } from "lucide-react";

interface ModelComparisonChartProps {
  metrics: {
    lstm?: ModelMetrics;
    gru?: ModelMetrics;
    transformer?: ModelMetrics;
  };
}

const modelColors = {
  LSTM: "#3b82f6",
  GRU: "#10b981",
  Transformer: "#a855f7"
};

export default function ModelComparisonChart({ metrics }: ModelComparisonChartProps) {
  const models = Object.entries(metrics).filter(([_, m]) => m !== undefined) as [
    string,
    ModelMetrics][];

  if (models.length === 0) {
    return null;
  }

  // Prepare error metrics data for comparison
  const errorData = [
  {
    metric: "MAE",
    ...Object.fromEntries(
      models.map(([name, m]) => [name.toUpperCase(), m.mae])
    )
  },
  {
    metric: "RMSE",
    ...Object.fromEntries(
      models.map(([name, m]) => [name.toUpperCase(), m.rmse])
    )
  },
  {
    metric: "MAPE (%)",
    ...Object.fromEntries(
      models.map(([name, m]) => [name.toUpperCase(), m.mape])
    )
  }];

  // Prepare accuracy data (inverse of error for visualization)
  const accuracyData = models.map(([name, m]) => ({
    model: name.toUpperCase(),
    "R² Score": (m.r2 * 100).toFixed(2),
    "Sharpe Ratio": m.sharpeRatio.toFixed(2),
    "Accuracy": ((1 - m.mape / 100) * 100).toFixed(2)
  }));

  // Radar chart data for comprehensive comparison
  const radarData = [
  {
    metric: "Accuracy",
    ...Object.fromEntries(
      models.map(([name, m]) => [
      name.toUpperCase(),
      Number(((1 - m.mape / 100) * 100).toFixed(2))]
      )
    ),
    fullMark: 100,
  },
  {
    metric: "R² Score",
    ...Object.fromEntries(
      models.map(([name, m]) => [name.toUpperCase(), Number((m.r2 * 100).toFixed(2))])
    ),
    fullMark: 100,
  },
  {
    metric: "Low Error",
    ...Object.fromEntries(
      models.map(([name, m]) => [
      name.toUpperCase(),
      Number((100 - m.mae * 2).toFixed(2))]
      )
    ),
    fullMark: 100,
  },
  {
    metric: "Sharpe",
    ...Object.fromEntries(
      models.map(([name, m]) => [
      name.toUpperCase(),
      Number((Math.max(0, m.sharpeRatio) * 20).toFixed(2))]
      )
    ),
    fullMark: 100,
  },
  {
    metric: "Stability",
    ...Object.fromEntries(
      models.map(([name, m]) => [
      name.toUpperCase(),
      Number((Math.max(0, 100 - m.volatility)).toFixed(2))]
      )
    ),
    fullMark: 100,
  }];

  // Find best model
  const bestModel = models.reduce((best, [name, m]) =>
  !best || m.mae < best[1].mae ? [name, m] : best
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-50"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl blur-2xl" />
          <div className="relative bg-gray-900/98 backdrop-blur-2xl border-2 border-white/30 rounded-2xl p-6 shadow-[0_30px_80px_-10px_rgba(0,0,0,0.9)]">
            <p className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.8)]" />
              {label}
            </p>
            <div className="space-y-2">
              {payload.map((entry: any, index: number) =>
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="text-sm font-semibold flex items-center justify-between gap-4"
                style={{ color: entry.color }}>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 12px ${entry.color}` }} />
                    {entry.name}:
                  </span>
                  <span className="text-white font-bold text-base">{Number(entry.value).toFixed(2)}</span>
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>);
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Best Model */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/30 via-blue-500/30 to-purple-500/30 rounded-3xl blur-3xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }} />
        <Card className="p-8 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-950/95 dark:via-gray-900/95 dark:to-gray-950/95 border-2 border-primary/40 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] relative backdrop-blur-2xl rounded-3xl overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.15),transparent_50%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.15),transparent_50%)] pointer-events-none" />
          <motion.div
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-5">
              <motion.div
                className="p-4 bg-gradient-to-br from-primary/30 via-blue-500/30 to-purple-500/30 rounded-2xl backdrop-blur-sm border-2 border-primary/40 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300 }}>
                <Target className="h-12 w-12 text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.9)]" />
              </motion.div>
              <div>
                <h3 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                  Model Performance Comparison
                </h3>
                <p className="text-sm text-muted-foreground mt-2 font-medium">
                  All models evaluated on identical datasets • Real-time analysis
                </p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-500/40 to-orange-500/40 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.9, 0.5],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }} />
              <div className="relative flex items-center gap-4 px-8 py-5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 rounded-full shadow-[0_0_40px_rgba(234,179,8,0.5)] backdrop-blur-sm">
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Award className="h-8 w-8 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.9)]" />
                </motion.div>
                <div>
                  <div className="text-xs text-yellow-200/80 font-bold uppercase tracking-wider">Champion Model</div>
                  <div className="text-3xl font-bold text-yellow-400 drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]">
                    {bestModel[0].toUpperCase()}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Error Metrics Comparison with ComposedChart */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-8 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] border-2 border-border/50 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-950/95 dark:via-gray-900/95 dark:to-gray-950/95 backdrop-blur-2xl overflow-hidden rounded-3xl">
          {/* Animated mesh gradients */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent_50%)]"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(168,85,247,0.15),transparent_50%)]"
            animate={{
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <div className="relative flex items-center gap-3 mb-8">
            <motion.div
              className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl backdrop-blur-sm border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.8 }}>
              <BarChart3 className="h-7 w-7 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            </motion.div>
            <div>
              <h4 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Error Metrics Analysis
              </h4>
              <p className="text-sm text-muted-foreground mt-1">Lower values indicate better performance</p>
            </div>
            <motion.span 
              className="ml-auto text-xs font-bold text-muted-foreground bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(59,130,246,0.3)",
                  "0 0 30px rgba(168,85,247,0.5)",
                  "0 0 20px rgba(59,130,246,0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ⬇️ Lower is Better
            </motion.span>
          </div>
          
          <ResponsiveContainer width="100%" height={450}>
            <ComposedChart data={errorData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
              <defs>
                {/* Enhanced gradients with glow */}
                {Object.entries(modelColors).map(([name, color]) => (
                  <React.Fragment key={name}>
                    <linearGradient id={`gradient${name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                      <stop offset="50%" stopColor={color} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id={`area${name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  </React.Fragment>
                ))}
                
                {/* Stronger glow filters */}
                <filter id="strongGlow">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="barShadow">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.6"/>
                </filter>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="8 8" 
                stroke="#ffffff20" 
                strokeWidth={2}
                opacity={0.3}
              />
              
              <XAxis
                dataKey="metric"
                tick={{ fill: "#ffffff", fontSize: 14, fontWeight: 700 }}
                stroke="#ffffff60"
                strokeWidth={2}
              />
              
              <YAxis
                tick={{ fill: "#ffffff", fontSize: 14, fontWeight: 700 }}
                stroke="#ffffff60"
                strokeWidth={2}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)", strokeWidth: 2 }} />
              <Legend iconSize={24} wrapperStyle={{ paddingTop: "20px" }} />
              
              {/* Area fills for depth */}
              {models.map(([name], index) => (
                <Area
                  key={`area-${name}`}
                  type="monotone"
                  dataKey={name.toUpperCase()}
                  fill={`url(#area${name.charAt(0).toUpperCase() + name.slice(1)})`}
                  stroke="none"
                  animationDuration={2000}
                  animationBegin={index * 200}
                />
              ))}
              
              {/* Enhanced bars with shadows */}
              {models.map(([name], index) => (
                <Bar
                  key={`bar-${name}`}
                  dataKey={name.toUpperCase()}
                  fill={`url(#gradient${name.charAt(0).toUpperCase() + name.slice(1)})`}
                  radius={[16, 16, 0, 0]}
                  filter="url(#barShadow)"
                  animationDuration={2000}
                  animationBegin={index * 200}
                  animationEasing="ease-out"
                />
              ))}
              
              {/* Trend lines overlay */}
              {models.map(([name], index) => (
                <Line
                  key={`line-${name}`}
                  type="monotone"
                  dataKey={name.toUpperCase()}
                  stroke={modelColors[name.toUpperCase() as keyof typeof modelColors]}
                  strokeWidth={4}
                  dot={{ r: 7, strokeWidth: 3, stroke: "#fff", fill: modelColors[name.toUpperCase() as keyof typeof modelColors] }}
                  filter="url(#strongGlow)"
                  animationDuration={2000}
                  animationBegin={index * 200}
                  animationEasing="ease-out"
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Enhanced Radar Chart */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-cyan-500/20 rounded-3xl blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, -2, 2, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-8 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] border-2 border-purple-500/30 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-950/95 dark:via-gray-900/95 dark:to-gray-950/95 backdrop-blur-2xl overflow-hidden rounded-3xl">
          {/* Animated mesh gradients */}
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.2),transparent_60%)]"
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.15),transparent_60%)]"
            animate={{
              opacity: [0.7, 0.4, 0.7],
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2.5,
            }}
          />
          
          <div className="relative flex items-center gap-3 mb-8">
            <motion.div
              className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl backdrop-blur-sm border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}>
              <Activity className="h-7 w-7 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </motion.div>
            <div>
              <h4 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Overall Performance Radar
              </h4>
              <p className="text-sm text-muted-foreground mt-1">Comprehensive multi-dimensional analysis</p>
            </div>
            <motion.span 
              className="ml-auto text-xs font-bold text-muted-foreground bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(168,85,247,0.3)",
                  "0 0 30px rgba(236,72,153,0.5)",
                  "0 0 20px rgba(168,85,247,0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              360° Evaluation
            </motion.span>
          </div>
          
          <ResponsiveContainer width="100%" height={520}>
            <RadarChart data={radarData}>
              <defs>
                {/* Enhanced radar glow */}
                <filter id="radarStrongGlow">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="dotGlow">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <PolarGrid
                stroke="#ffffff30"
                strokeWidth={2}
                opacity={0.5}
              />
              
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: "#ffffff", fontSize: 14, fontWeight: 800 }}
              />
              
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#ffffff80", fontSize: 13, fontWeight: 700 }}
                stroke="#ffffff40"
                strokeWidth={2}
              />

              {models.map(([name], index) => (
                <Radar
                  key={name}
                  name={name.toUpperCase()}
                  dataKey={name.toUpperCase()}
                  stroke={modelColors[name.toUpperCase() as keyof typeof modelColors]}
                  fill={modelColors[name.toUpperCase() as keyof typeof modelColors]}
                  fillOpacity={0.45}
                  strokeWidth={5}
                  filter="url(#radarStrongGlow)"
                  animationDuration={2500}
                  animationBegin={index * 300}
                  animationEasing="ease-out"
                  dot={{ 
                    r: 8, 
                    strokeWidth: 4, 
                    stroke: "#fff",
                    filter: "url(#dotGlow)"
                  }}
                  activeDot={{
                    r: 12,
                    strokeWidth: 5,
                    stroke: "#fff",
                  }}
                />
              ))}
              
              <Legend 
                iconSize={28} 
                wrapperStyle={{ paddingTop: "30px" }}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Enhanced Detailed Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-blue-500/15 to-purple-500/15 rounded-3xl blur-3xl"
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-8 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] border-2 border-blue-500/30 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-950/95 dark:via-gray-900/95 dark:to-gray-950/95 backdrop-blur-2xl overflow-x-auto rounded-3xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)] pointer-events-none" />
          
          <div className="relative flex items-center gap-3 mb-8">
            <motion.div
              whileHover={{ scale: 1.2, rotate: 180 }}
              transition={{ duration: 0.5 }}
            >
              <Zap className="h-8 w-8 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.9)]" />
            </motion.div>
            <h4 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Detailed Metrics Comparison
            </h4>
          </div>
          
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary/40 bg-gradient-to-r from-primary/20 to-blue-500/20 backdrop-blur-sm">
                  <th className="text-left py-5 px-6 font-bold text-lg text-white">Metric</th>
                  {models.map(([name]) => (
                    <th
                      key={name}
                      className="text-center py-5 px-6 font-bold text-lg"
                      style={{ 
                        color: modelColors[name.toUpperCase() as keyof typeof modelColors],
                        textShadow: `0 0 20px ${modelColors[name.toUpperCase() as keyof typeof modelColors]}80`
                      }}>
                      {name.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                { key: "mae", label: "MAE (Mean Absolute Error)", format: (v: number) => v.toFixed(2), lower: true },
                { key: "rmse", label: "RMSE (Root Mean Squared Error)", format: (v: number) => v.toFixed(2), lower: true },
                { key: "mape", label: "MAPE (Mean Abs % Error)", format: (v: number) => `${v.toFixed(2)}%`, lower: true },
                { key: "r2", label: "R² Score (Accuracy)", format: (v: number) => (v * 100).toFixed(2) + "%", lower: false },
                { key: "sharpeRatio", label: "Sharpe Ratio", format: (v: number) => v.toFixed(2), lower: false },
                { key: "volatility", label: "Volatility", format: (v: number) => `${v.toFixed(2)}%`, lower: true },
                { key: "maxDrawdown", label: "Max Drawdown", format: (v: number) => `${v.toFixed(2)}%`, lower: true }].
                map((metric, index) => {
                  const values = models.map(([_, m]) => (m as any)[metric.key]);
                  const bestValue = metric.lower ? Math.min(...values) : Math.max(...values);

                  return (
                    <motion.tr
                      key={metric.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="border-b border-white/5 hover:bg-white/5 transition-all duration-300 group">
                      <td className="py-5 px-6 font-bold text-base text-white group-hover:text-primary transition-colors">
                        {metric.label}
                      </td>
                      {models.map(([name, m]) => {
                        const value = (m as any)[metric.key];
                        const isBest = value === bestValue;
                        return (
                          <motion.td
                            key={name}
                            className={`text-center py-5 px-6 font-mono font-bold text-lg relative`}
                            style={{
                              color: isBest ? "#eab308" : modelColors[name.toUpperCase() as keyof typeof modelColors],
                            }}
                            whileHover={{ scale: 1.05 }}
                          >
                            {isBest && (
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg"
                                animate={{
                                  opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                            )}
                            <span className="relative z-10">
                              {metric.format(value)}
                              {isBest && (
                                <motion.span
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                  className="ml-2"
                                >
                                  🏆
                                </motion.span>
                              )}
                            </span>
                          </motion.td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}