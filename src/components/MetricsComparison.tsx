"use client";

import { ModelMetrics, ModelType } from "@/lib/mlModels";
import { Card } from "./ui/card";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, Target, Award, Zap, Shield, TrendingUpDown } from "lucide-react";

interface MetricsComparisonProps {
  metrics: {
    lstm?: ModelMetrics;
    gru?: ModelMetrics;
    transformer?: ModelMetrics;
  };
}

const modelColors = {
  LSTM: { 
    color: "text-blue-500", 
    bg: "bg-blue-500/10", 
    border: "border-blue-500",
    gradient: "from-blue-500/20 via-blue-600/20 to-cyan-500/20",
    glow: "from-blue-500/30 via-blue-600/30 to-cyan-500/30",
    solid: "#3b82f6"
  },
  GRU: { 
    color: "text-green-500", 
    bg: "bg-green-500/10", 
    border: "border-green-500",
    gradient: "from-green-500/20 via-green-600/20 to-emerald-500/20",
    glow: "from-green-500/30 via-green-600/30 to-emerald-500/30",
    solid: "#10b981"
  },
  Transformer: { 
    color: "text-purple-500", 
    bg: "bg-purple-500/10", 
    border: "border-purple-500",
    gradient: "from-purple-500/20 via-purple-600/20 to-pink-500/20",
    glow: "from-purple-500/30 via-purple-600/30 to-pink-500/30",
    solid: "#a855f7"
  },
};

export default function MetricsComparison({ metrics }: MetricsComparisonProps) {
  const models = Object.entries(metrics).filter(([_, m]) => m !== undefined) as [string, ModelMetrics][];

  if (models.length === 0) {
    return null;
  }

  // Find best model for each metric
  const bestMAE = models.reduce((best, [name, m]) => 
    !best || m.mae < best[1].mae ? [name, m] as [string, ModelMetrics] : best
  , null as [string, ModelMetrics] | null);

  const bestR2 = models.reduce((best, [name, m]) => 
    !best || m.r2 > best[1].r2 ? [name, m] as [string, ModelMetrics] : best
  , null as [string, ModelMetrics] | null);

  const bestSharpe = models.reduce((best, [name, m]) => 
    !best || m.sharpeRatio > best[1].sharpeRatio ? [name, m] as [string, ModelMetrics] : best
  , null as [string, ModelMetrics] | null);

  return (
    <div className="space-y-8">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-2xl"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Card className="relative p-6 bg-gradient-to-r from-primary/10 via-transparent to-blue-500/10 border-2 border-primary/30 backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,200,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
          
          <div className="relative flex items-center gap-4">
            <motion.div 
              className="p-3 bg-gradient-to-br from-primary/30 to-blue-500/30 rounded-2xl backdrop-blur-sm border-2 border-primary/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Target className="h-8 w-8 text-primary drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
            </motion.div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Individual Model Performance
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Real-time metrics and accuracy analysis</p>
            </div>
            <motion.div
              className="ml-auto"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="h-6 w-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Model Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {models.map(([modelName, modelMetrics], index) => {
          const modelKey = modelName.toUpperCase() as keyof typeof modelColors;
          const colors = modelColors[modelKey] || modelColors.LSTM;
          const isBestMAE = bestMAE && bestMAE[0] === modelName;
          const isBestR2 = bestR2 && bestR2[0] === modelName;
          const isBestSharpe = bestSharpe && bestSharpe[0] === modelName;

          return (
            <motion.div
              key={modelName}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
              className="relative group"
            >
              {/* Animated Glow Background */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${colors.glow} rounded-3xl blur-2xl`}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5,
                }}
              />
              
              {/* Glassmorphic Card */}
              <Card className={`relative p-8 border-2 ${colors.border} bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 dark:from-gray-950/90 dark:via-gray-900/90 dark:to-gray-950/90 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.9)] transition-all duration-500 backdrop-blur-2xl group-hover:scale-[1.02] rounded-3xl overflow-hidden`}>
                {/* Ice crystal overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,200,255,0.15),transparent_50%)] pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(200,150,255,0.15),transparent_50%)] pointer-events-none" />
                
                {/* Floating background icon */}
                <motion.div
                  className="absolute top-4 right-4 opacity-10"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.3
                  }}
                >
                  <Activity className={`h-32 w-32 ${colors.color}`} />
                </motion.div>

                {/* Header */}
                <div className="relative flex items-center justify-between mb-6">
                  <motion.h4 
                    className={`text-2xl font-bold ${colors.color} drop-shadow-[0_0_20px_${colors.solid}]`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {modelName.toUpperCase()}
                  </motion.h4>
                  <motion.div
                    className={`p-3 bg-gradient-to-br ${colors.gradient} rounded-xl backdrop-blur-sm border border-${colors.border.split('-')[1]}-500/30 shadow-[0_0_20px_rgba(${colors.solid},0.3)]`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Activity className={`h-6 w-6 ${colors.color}`} />
                  </motion.div>
                </div>

                {/* Best Model Badge */}
                {(isBestMAE || isBestR2 || isBestSharpe) && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5 + index * 0.2, type: "spring", stiffness: 200 }}
                    className="relative mb-6"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-500/40 to-orange-500/40 rounded-xl blur-lg"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="relative flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500/50 rounded-xl backdrop-blur-sm">
                      <Award className="h-5 w-5 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                      <span className="text-sm font-bold text-yellow-500">
                        Top Performer
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Metrics */}
                <div className="relative space-y-4">
                  <MetricRow
                    label="MAE"
                    value={modelMetrics.mae.toFixed(2)}
                    isBest={isBestMAE}
                    tooltip="Mean Absolute Error (lower is better)"
                    color={colors.color}
                    icon={Shield}
                  />
                  <MetricRow
                    label="RMSE"
                    value={modelMetrics.rmse.toFixed(2)}
                    tooltip="Root Mean Squared Error"
                    color={colors.color}
                    icon={Shield}
                  />
                  <MetricRow
                    label="MAPE"
                    value={`${modelMetrics.mape.toFixed(2)}%`}
                    tooltip="Mean Absolute Percentage Error"
                    color={colors.color}
                    icon={TrendingUpDown}
                  />
                  <MetricRow
                    label="R² Score"
                    value={(modelMetrics.r2 * 100).toFixed(2) + "%"}
                    isBest={isBestR2}
                    tooltip="R-squared (higher is better)"
                    color={colors.color}
                    icon={Target}
                  />
                  <MetricRow
                    label="Sharpe Ratio"
                    value={modelMetrics.sharpeRatio.toFixed(2)}
                    isBest={isBestSharpe}
                    icon={modelMetrics.sharpeRatio > 0 ? TrendingUp : TrendingDown}
                    iconColor={modelMetrics.sharpeRatio > 0 ? "text-green-500" : "text-red-500"}
                    tooltip="Risk-adjusted return (higher is better)"
                    color={colors.color}
                  />
                  <MetricRow
                    label="Volatility"
                    value={`${modelMetrics.volatility.toFixed(2)}%`}
                    tooltip="Annualized volatility"
                    color={colors.color}
                    icon={Activity}
                  />
                  <MetricRow
                    label="Max Drawdown"
                    value={`${modelMetrics.maxDrawdown.toFixed(2)}%`}
                    icon={TrendingDown}
                    iconColor="text-red-500"
                    tooltip="Maximum peak-to-trough decline"
                    color={colors.color}
                  />
                </div>

                {/* Animated bottom accent */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`}
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Best Model Showcase */}
      {bestMAE && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-orange-500/30 to-red-500/30 rounded-3xl blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <Card className="relative p-8 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border-2 border-yellow-500/40 shadow-[0_20px_60px_-15px_rgba(234,179,8,0.8)] backdrop-blur-2xl rounded-3xl overflow-hidden">
            {/* Animated grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
            
            <div className="relative flex items-center justify-center gap-4 flex-wrap">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Award className="h-10 w-10 text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.9)]" />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-bold text-muted-foreground mb-1">
                  🏆 Champion Model 🏆
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                  {bestMAE[0].toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Lowest MAE: <span className="font-bold text-yellow-500">{bestMAE[1].mae.toFixed(2)}</span> • 
                  R² Score: <span className="font-bold text-yellow-500">{(bestMAE[1].r2 * 100).toFixed(2)}%</span>
                </p>
              </div>
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                <Award className="h-10 w-10 text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.9)]" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  isBest,
  icon: Icon,
  iconColor,
  tooltip,
  color,
}: {
  label: string;
  value: string;
  isBest?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  tooltip?: string;
  color?: string;
}) {
  return (
    <motion.div 
      className="group relative flex items-center justify-between py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 rounded-xl backdrop-blur-sm" 
      title={tooltip}
      whileHover={{ x: 6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      
      <div className="relative flex items-center gap-2">
        {Icon && (
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className={`h-4 w-4 ${iconColor || color || "text-muted-foreground"}`} />
          </motion.div>
        )}
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      
      <div className="relative flex items-center gap-2">
        <motion.span 
          className={`font-mono font-bold text-base ${isBest ? "text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" : "text-foreground"}`}
          animate={isBest ? { scale: [1, 1.05, 1] } : {}}
          transition={isBest ? { duration: 2, repeat: Infinity } : {}}
        >
          {value}
        </motion.span>
        {isBest && (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            ⭐
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
