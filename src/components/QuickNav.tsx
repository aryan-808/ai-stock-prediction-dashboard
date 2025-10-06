"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  TrendingUp,
  Shield,
  Target,
  Briefcase,
  Star,
  BarChart3,
  Info,
  Globe,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface QuickNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

const navItems = [
  { id: "market", label: "Market", icon: Globe, color: "text-blue-500" },
  { id: "predictions", label: "Predictions", icon: TrendingUp, color: "text-emerald-500" },
  { id: "risk", label: "Risk", icon: Shield, color: "text-purple-500" },
  { id: "signals", label: "Signals", icon: Target, color: "text-orange-500" },
  { id: "portfolio", label: "Portfolio", icon: Briefcase, color: "text-cyan-500" },
  { id: "watchlist", label: "Watchlist", icon: Star, color: "text-yellow-500" },
  { id: "backtest", label: "Backtest", icon: BarChart3, color: "text-pink-500" },
  { id: "sentiment", label: "Sentiment", icon: Info, color: "text-indigo-500" },
];

export default function QuickNav({ currentTab, onNavigate }: QuickNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <Button
          size="lg"
          onClick={() => setIsOpen(!isOpen)}
          className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-primary via-blue-500 to-purple-500 hover:scale-110 transition-transform duration-300 relative overflow-hidden group"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Command className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
        </Button>

        {/* Keyboard Shortcut Hint */}
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute -top-12 right-0 whitespace-nowrap"
          >
            <Badge variant="secondary" className="shadow-lg">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono mx-1">⌘K</kbd> for quick nav
            </Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-28 right-8 z-40 bg-card border-2 border-primary/20 rounded-2xl shadow-2xl p-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Quick Navigation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 min-w-[320px]">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative overflow-hidden group ${
                      isActive
                        ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20"
                        : "bg-accent/30 hover:bg-accent border-2 border-transparent hover:border-primary/30"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? "text-primary" : item.color}`} />
                    <div className="flex flex-col items-start">
                      <span className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          Active
                        </Badge>
                      )}
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground text-center">
              Use keyboard shortcuts for faster navigation
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}