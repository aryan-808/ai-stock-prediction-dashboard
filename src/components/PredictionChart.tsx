"use client";

import { StockData } from "@/lib/stockApi";
import { ModelPrediction } from "@/lib/mlModels";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { motion } from "framer-motion";

interface PredictionChartProps {
  historicalData: StockData[];
  predictions: {
    lstm?: ModelPrediction[];
    gru?: ModelPrediction[];
    transformer?: ModelPrediction[];
  };
  selectedModels: string[];
}

export default function PredictionChart({
  historicalData,
  predictions,
  selectedModels,
}: PredictionChartProps) {
  const chartData = [
    ...historicalData.slice(-90).map((d) => ({
      date: d.date,
      actual: d.close,
      type: "historical",
    })),
    ...(selectedModels.includes("LSTM") && predictions.lstm
      ? predictions.lstm.map((p) => ({
          date: p.date,
          lstm: p.predicted,
          type: "prediction",
        }))
      : []),
  ];

  // Merge all data by date
  const mergedData = chartData.reduce((acc: any[], curr) => {
    const existing = acc.find((item) => item.date === curr.date);
    if (existing) {
      Object.assign(existing, curr);
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []);

  // Add GRU predictions
  if (selectedModels.includes("GRU") && predictions.gru) {
    predictions.gru.forEach((p) => {
      const existing = mergedData.find((item) => item.date === p.date);
      if (existing) {
        existing.gru = p.predicted;
      } else {
        mergedData.push({ date: p.date, gru: p.predicted, type: "prediction" });
      }
    });
  }

  // Add Transformer predictions
  if (selectedModels.includes("Transformer") && predictions.transformer) {
    predictions.transformer.forEach((p) => {
      const existing = mergedData.find((item) => item.date === p.date);
      if (existing) {
        existing.transformer = p.predicted;
      } else {
        mergedData.push({ date: p.date, transformer: p.predicted, type: "prediction" });
      }
    });
  }

  const lastHistoricalDate = historicalData[historicalData.length - 1]?.date;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-xl" />
          <div className="relative bg-gray-900/95 backdrop-blur-2xl border-2 border-white/20 rounded-2xl p-6 shadow-2xl">
            <p className="font-bold text-white text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
              {format(new Date(label), "MMM dd, yyyy")}
            </p>
            <div className="space-y-2">
              {payload.map((entry: any, index: number) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="text-sm font-semibold flex items-center justify-between gap-4"
                  style={{ color: entry.color }}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
                    {entry.name}:
                  </span>
                  <span className="text-white font-bold text-base">${Number(entry.value).toFixed(2)}</span>
                </motion.p>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full"
    >
      {/* Animated gradient glow background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Frosted glass container */}
      <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 dark:from-gray-950/90 dark:via-gray-900/90 dark:to-gray-950/90 rounded-3xl p-8 border-2 border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden">
        {/* Ice crystal effect overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,200,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(200,150,255,0.15),transparent_40%)] pointer-events-none" />
        
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={mergedData} margin={{ top: 20, right: 40, left: 20, bottom: 80 }}>
            <defs>
              {/* Enhanced gradient fills */}
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="lstmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="gruGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="transformerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
              </linearGradient>
              
              {/* Enhanced glow filters */}
              <filter id="glowActual">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glowLSTM">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glowGRU">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="glowTransformer">
                <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="dropShadow">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.4"/>
              </filter>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="5 5" 
              stroke="#ffffff15" 
              strokeWidth={1.5}
              opacity={0.5}
            />
            
            <XAxis
              dataKey="date"
              tickFormatter={(date) => {
                try {
                  return format(new Date(date), "MMM dd");
                } catch {
                  return date;
                }
              }}
              tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 700 }}
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="#ffffff80"
              strokeWidth={2}
            />
            
            <YAxis 
              tick={{ fill: "#ffffff", fontSize: 13, fontWeight: 700 }}
              domain={["auto", "auto"]}
              stroke="#ffffff80"
              strokeWidth={2}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#ffffff40", strokeWidth: 2 }} />
            
            <Legend 
              wrapperStyle={{ paddingTop: "30px" }}
              iconType="line"
              iconSize={24}
            />
            
            {lastHistoricalDate && (
              <ReferenceLine
                x={lastHistoricalDate}
                stroke="#ffffff"
                strokeDasharray="8 8"
                strokeWidth={3}
                filter="url(#dropShadow)"
                label={{ 
                  value: "TODAY", 
                  position: "top",
                  fill: "#ffffff",
                  fontSize: 16,
                  fontWeight: "bold",
                  style: { textShadow: "0 0 10px rgba(255,255,255,0.5)" }
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="actual"
              stroke="url(#actualGradient)"
              strokeWidth={6}
              dot={{ fill: "#fbbf24", r: 6, strokeWidth: 4, stroke: "#fff", filter: "url(#dropShadow)" }}
              name="Actual Price"
              filter="url(#glowActual)"
              activeDot={{ r: 10, fill: "#fbbf24", stroke: "#fff", strokeWidth: 4, filter: "url(#dropShadow)" }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            
            {selectedModels.includes("LSTM") && (
              <Line
                type="monotone"
                dataKey="lstm"
                stroke="url(#lstmGradient)"
                strokeWidth={6}
                strokeDasharray="12 6"
                dot={{ fill: "#3b82f6", r: 7, strokeWidth: 4, stroke: "#fff", filter: "url(#dropShadow)" }}
                name="LSTM Prediction"
                filter="url(#glowLSTM)"
                activeDot={{ r: 11, fill: "#3b82f6", stroke: "#fff", strokeWidth: 4, filter: "url(#dropShadow)" }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            )}
            
            {selectedModels.includes("GRU") && (
              <Line
                type="monotone"
                dataKey="gru"
                stroke="url(#gruGradient)"
                strokeWidth={6}
                strokeDasharray="12 6"
                dot={{ fill: "#10b981", r: 7, strokeWidth: 4, stroke: "#fff", filter: "url(#dropShadow)" }}
                name="GRU Prediction"
                filter="url(#glowGRU)"
                activeDot={{ r: 11, fill: "#10b981", stroke: "#fff", strokeWidth: 4, filter: "url(#dropShadow)" }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            )}
            
            {selectedModels.includes("Transformer") && (
              <Line
                type="monotone"
                dataKey="transformer"
                stroke="url(#transformerGradient)"
                strokeWidth={6}
                strokeDasharray="12 6"
                dot={{ fill: "#a855f7", r: 7, strokeWidth: 4, stroke: "#fff", filter: "url(#dropShadow)" }}
                name="Transformer Prediction"
                filter="url(#glowTransformer)"
                activeDot={{ r: 11, fill: "#a855f7", stroke: "#fff", strokeWidth: 4, filter: "url(#dropShadow)" }}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}