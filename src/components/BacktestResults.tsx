"use client";

import { ModelPrediction } from "@/lib/mlModels";
import { Card } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar, ComposedChart, Scatter } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Calendar, CheckCircle2, AlertCircle, Zap, Target, Award } from "lucide-react";
import { motion } from "framer-motion";

interface BacktestResultsProps {
  backtestData: ModelPrediction[];
  modelName: string;
}

export default function BacktestResults({ backtestData, modelName }: BacktestResultsProps) {
  if (backtestData.length === 0) {
    return null;
  }

  const chartData = backtestData.map(d => ({
    date: d.date,
    predicted: d.predicted,
    actual: d.actual,
    error: d.actual ? Math.abs(d.predicted - d.actual) : 0,
    errorPercent: d.actual ? (Math.abs(d.predicted - d.actual) / d.actual) * 100 : 0,
    accuracy: d.actual ? 100 - ((Math.abs(d.predicted - d.actual) / d.actual) * 100) : 0,
  }));

  // Calculate accuracy
  const validPredictions = backtestData.filter(d => d.actual !== undefined);
  const accuracy = validPredictions.length > 0
    ? (validPredictions.filter(d => {
        const error = Math.abs(d.predicted - d.actual!) / d.actual!;
        return error < 0.05; // Within 5%
      }).length / validPredictions.length) * 100
    : 0;

  const avgError = validPredictions.length > 0
    ? (validPredictions.reduce((sum, d) => 
        sum + Math.abs(d.predicted - d.actual!) / d.actual!, 0
      ) / validPredictions.length * 100)
    : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 rounded-2xl blur-2xl" />
          <div className="relative bg-card/95 backdrop-blur-3xl border-2 border-primary/40 rounded-2xl p-6 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.9)]">
            <p className="font-bold text-foreground mb-4 text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {format(new Date(label), "MMM dd, yyyy")}
            </p>
            <div className="space-y-2">
              {payload.map((entry: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2">
                    <motion.span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color, boxShadow: `0 0 12px ${entry.color}` }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="font-medium text-sm" style={{ color: entry.color }}>
                      {entry.name}
                    </span>
                  </div>
                  <span className="text-foreground font-bold text-sm">
                    ${Number(entry.value).toFixed(2)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const CustomErrorTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 via-orange-500/40 to-yellow-500/40 rounded-2xl blur-2xl" />
          <div className="relative bg-card/95 backdrop-blur-3xl border-2 border-red-500/40 rounded-2xl p-6 shadow-[0_25px_60px_-10px_rgba(239,68,68,0.5)]">
            <p className="font-bold text-foreground mb-3 text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              {format(new Date(label), "MMM dd, yyyy")}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">Error:</span>
                <span className="text-red-500 font-bold">${payload[0]?.value.toFixed(2)}</span>
              </div>
              {payload[1] && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Error %:</span>
                  <span className="text-orange-500 font-bold">{payload[1]?.value.toFixed(2)}%</span>
                </div>
              )}
            </div>
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
      className="space-y-8"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px]"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Header Card */}
      <div className="relative">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-violet-500/20 rounded-3xl blur-3xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.8, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-10 bg-gradient-to-br from-emerald-500/5 via-card/90 to-violet-500/5 border-2 border-primary/30 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl overflow-hidden">
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                               linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>
          
          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <motion.div 
                className="relative p-5 bg-gradient-to-br from-primary/30 to-primary/10 rounded-3xl backdrop-blur-sm border-2 border-primary/40"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                <Calendar className="relative h-10 w-10 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" />
              </motion.div>
              <div>
                <motion.h3 
                  className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Backtest Results - {modelName}
                </motion.h3>
                <motion.p 
                  className="text-sm text-muted-foreground mt-2 flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Testing on last {backtestData.length} days of historical data
                </motion.p>
              </div>
            </div>
            
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 to-blue-500/40 rounded-full blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative flex items-center gap-4 px-10 py-6 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.4)] backdrop-blur-xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  {accuracy >= 70 ? (
                    <Award className="h-9 w-9 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  ) : (
                    <Target className="h-9 w-9 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                  )}
                </motion.div>
                <div>
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Accuracy</div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                    {accuracy.toFixed(1)}%
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>
      </div>

      {/* Main Chart - Enhanced Design */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative group"
      >
        <motion.div 
          className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-3xl blur-2xl"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-10 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.8)] border-2 border-primary/20 bg-card/80 backdrop-blur-3xl overflow-hidden">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 opacity-30">
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
              }}
              animate={{
                background: [
                  'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          <div className="relative flex items-center justify-between mb-8">
            <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <TrendingUp className="h-7 w-7 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </motion.div>
              Predicted vs Actual Prices
            </h4>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              <span className="text-xs font-semibold text-muted-foreground">Live Tracking</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 20, bottom: 10 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05}/>
                </linearGradient>
                <filter id="glowBacktest">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="shadowBacktest">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.5"/>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted/10" 
                opacity={0.3} 
                strokeWidth={1}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                className="text-muted-foreground text-xs"
                angle={-45}
                textAnchor="end"
                height={90}
                stroke="hsl(var(--primary))"
                tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ strokeWidth: 2, stroke: "hsl(var(--primary))", opacity: 0.3 }}
              />
              <YAxis 
                className="text-muted-foreground text-xs" 
                domain={["auto", "auto"]}
                stroke="hsl(var(--primary))"
                tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ strokeWidth: 2, stroke: "hsl(var(--primary))", opacity: 0.3 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(168, 85, 247, 0.2)", strokeWidth: 3 }} />
              <Legend 
                iconType="circle" 
                iconSize={14} 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-sm font-semibold text-foreground">{value}</span>}
              />
              
              {/* Area fills */}
              <Area
                type="monotone"
                dataKey="actual"
                fill="url(#colorActual)"
                stroke="none"
                animationDuration={2000}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                fill="url(#colorPredicted)"
                stroke="none"
                animationDuration={2000}
                animationEasing="ease-out"
              />
              
              {/* Lines */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={4}
                dot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: "#3b82f6", filter: "url(#shadowBacktest)" }}
                name="Actual Price"
                filter="url(#glowBacktest)"
                activeDot={{ 
                  r: 10, 
                  fill: "#3b82f6", 
                  stroke: "#fff", 
                  strokeWidth: 3, 
                  filter: "url(#shadowBacktest)",
                  style: { cursor: "pointer" }
                }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#a855f7"
                strokeWidth={4}
                strokeDasharray="8 4"
                dot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: "#a855f7", filter: "url(#shadowBacktest)" }}
                name="Predicted Price"
                filter="url(#glowBacktest)"
                activeDot={{ 
                  r: 10, 
                  fill: "#a855f7", 
                  stroke: "#fff", 
                  strokeWidth: 3, 
                  filter: "url(#shadowBacktest)",
                  style: { cursor: "pointer" }
                }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Error Chart - Redesigned with dual visualization */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="relative group"
      >
        <motion.div 
          className="absolute -inset-1 bg-gradient-to-r from-red-600/30 via-orange-600/30 to-yellow-600/30 rounded-3xl blur-2xl"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-10 shadow-[0_30px_90px_-15px_rgba(239,68,68,0.5)] border-2 border-red-500/20 bg-card/80 backdrop-blur-3xl overflow-hidden">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 opacity-20">
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)',
              }}
              animate={{
                background: [
                  'radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 70% 30%, rgba(249, 115, 22, 0.3) 0%, transparent 50%), radial-gradient(circle at 30% 70%, rgba(239, 68, 68, 0.3) 0%, transparent 50%)',
                  'radial-gradient(circle at 30% 30%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(249, 115, 22, 0.3) 0%, transparent 50%)',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          
          <div className="relative flex items-center justify-between mb-8">
            <h4 className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertCircle className="h-7 w-7 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </motion.div>
              Prediction Error Analysis
            </h4>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
              <span className="text-xs font-semibold text-muted-foreground">Precision Metrics</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 20, bottom: 10 }}>
              <defs>
                <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="colorErrorPercent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05}/>
                </linearGradient>
                <filter id="errorGlow">
                  <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-muted/10" 
                opacity={0.3}
                strokeWidth={1}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), "MMM dd")}
                className="text-muted-foreground text-xs"
                angle={-45}
                textAnchor="end"
                height={90}
                stroke="hsl(var(--primary))"
                tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ strokeWidth: 2, stroke: "hsl(var(--primary))", opacity: 0.3 }}
              />
              <YAxis 
                yAxisId="left"
                className="text-muted-foreground text-xs"
                stroke="#ef4444"
                tick={{ fontSize: 11, fontWeight: 600, fill: "#ef4444" }}
                axisLine={{ strokeWidth: 2, stroke: "#ef4444", opacity: 0.5 }}
                label={{ value: 'Error ($)', angle: -90, position: 'insideLeft', fill: '#ef4444', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-muted-foreground text-xs"
                stroke="#f97316"
                tick={{ fontSize: 11, fontWeight: 600, fill: "#f97316" }}
                axisLine={{ strokeWidth: 2, stroke: "#f97316", opacity: 0.5 }}
                label={{ value: 'Error (%)', angle: 90, position: 'insideRight', fill: '#f97316', fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip content={<CustomErrorTooltip />} cursor={{ fill: "rgba(239, 68, 68, 0.05)" }} />
              <Legend 
                iconType="circle" 
                iconSize={14} 
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => <span className="text-sm font-semibold text-foreground">{value}</span>}
              />
              
              {/* Bar for absolute error */}
              <Bar
                yAxisId="left"
                dataKey="error"
                fill="url(#colorError)"
                stroke="#ef4444"
                strokeWidth={2}
                name="Absolute Error ($)"
                radius={[8, 8, 0, 0]}
                filter="url(#errorGlow)"
                animationDuration={2000}
                animationEasing="ease-out"
              />
              
              {/* Line for error percentage */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="errorPercent"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#f97316" }}
                name="Error Percentage (%)"
                filter="url(#errorGlow)"
                activeDot={{ 
                  r: 8, 
                  fill: "#f97316", 
                  stroke: "#fff", 
                  strokeWidth: 2,
                  style: { cursor: "pointer" }
                }}
                animationDuration={2000}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        {validPredictions.length > 0 && (
          <>
            <StatCard
              label="Total Predictions"
              value={validPredictions.length.toString()}
              icon={TrendingUp}
              color="blue"
              delay={0.1}
            />
            <StatCard
              label="Avg Error"
              value={`${avgError.toFixed(2)}%`}
              icon={AlertCircle}
              color="orange"
              delay={0.2}
            />
            <StatCard
              label="Best Prediction"
              value={`${(Math.min(...validPredictions.map(d => 
                Math.abs(d.predicted - d.actual!) / d.actual!
              )) * 100).toFixed(2)}%`}
              icon={CheckCircle2}
              color="green"
              delay={0.3}
            />
            <StatCard
              label="Within 5%"
              value={`${accuracy.toFixed(1)}%`}
              icon={Award}
              color="purple"
              delay={0.4}
            />
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  delay 
}: { 
  label: string; 
  value: string; 
  icon: any; 
  color: string;
  delay: number;
}) {
  const colorClasses = {
    blue: "from-blue-500/25 to-blue-600/25 border-blue-500/40 text-blue-500",
    green: "from-green-500/25 to-green-600/25 border-green-500/40 text-green-500",
    orange: "from-orange-500/25 to-orange-600/25 border-orange-500/40 text-orange-500",
    purple: "from-purple-500/25 to-purple-600/25 border-purple-500/40 text-purple-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200 }}
      className="relative group"
      whileHover={{ y: -5 }}
    >
      <motion.div 
        className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-2xl blur-xl`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <Card className={`relative p-6 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border-2 shadow-[0_15px_40px_-5px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_60px_-5px_rgba(0,0,0,0.8)] transition-all duration-300 cursor-pointer backdrop-blur-xl overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Icon className="w-full h-full" />
        </div>
        <div className="relative flex items-center justify-between mb-3">
          <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{label}</div>
          <motion.div
            whileHover={{ scale: 1.3, rotate: 15 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className={`h-6 w-6 ${colorClasses[color as keyof typeof colorClasses].split(' ')[3]} drop-shadow-[0_0_8px_currentColor]`} />
          </motion.div>
        </div>
        <div className="relative text-3xl font-bold text-foreground">{value}</div>
      </Card>
    </motion.div>
  );
}