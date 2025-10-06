"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  Shield,
  Target,
  Briefcase,
  Star,
  BarChart3,
  Info,
  Globe,
  Download,
  RefreshCw,
  Zap,
} from "lucide-react";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  onAction?: (action: string) => void;
  currentTab: string;
}

const commands = [
  { id: "market", label: "Market Overview", icon: Globe, category: "Navigate", kbd: "m" },
  { id: "predictions", label: "AI Predictions", icon: TrendingUp, category: "Navigate", kbd: "p" },
  { id: "risk", label: "Risk Analytics", icon: Shield, category: "Navigate", kbd: "r" },
  { id: "signals", label: "Trading Signals", icon: Target, category: "Navigate", kbd: "s" },
  { id: "portfolio", label: "Portfolio Tracker", icon: Briefcase, category: "Navigate", kbd: "o" },
  { id: "watchlist", label: "Watchlist", icon: Star, category: "Navigate", kbd: "w" },
  { id: "backtest", label: "Backtest Results", icon: BarChart3, category: "Navigate", kbd: "b" },
  { id: "sentiment", label: "Sentiment Analysis", icon: Info, category: "Navigate", kbd: "n" },
  { id: "refresh", label: "Refresh Data", icon: RefreshCw, category: "Actions", kbd: "ctrl+r" },
  { id: "pdf", label: "Export PDF Report", icon: Download, category: "Actions", kbd: "ctrl+p" },
  { id: "excel", label: "Export Excel Report", icon: Download, category: "Actions", kbd: "ctrl+e" },
  { id: "predict", label: "Generate Predictions", icon: Zap, category: "Actions", kbd: "ctrl+g" },
];

export default function CommandPalette({ onNavigate, onAction, currentTab }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Open/close palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setSearch("");
        setSelectedIndex(0);
      }

      // Close with Escape
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }

      if (!isOpen) {
        // Navigation shortcuts when palette is closed
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
          const cmd = commands.find((c) => c.kbd === `ctrl+${e.key}`);
          if (cmd && onAction) {
            e.preventDefault();
            onAction(cmd.id);
          }
        } else if (!e.metaKey && !e.ctrlKey && !e.altKey) {
          const cmd = commands.find((c) => c.kbd === e.key && c.category === "Navigate");
          if (cmd) {
            e.preventDefault();
            onNavigate(cmd.id);
          }
        }
        return;
      }

      // Palette navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredCommands[selectedIndex]);
      }
    },
    [isOpen, filteredCommands, selectedIndex, onNavigate, onAction]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleSelect = (cmd: typeof commands[0]) => {
    if (cmd.category === "Navigate") {
      onNavigate(cmd.id);
    } else if (onAction) {
      onAction(cmd.id);
    }
    setIsOpen(false);
    setSearch("");
    setSelectedIndex(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-card border-2 border-primary/20 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border/50">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search commands or press a key..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
                  autoFocus
                />
                <Badge variant="outline" className="text-xs">
                  ESC
                </Badge>
              </div>

              {/* Commands List */}
              <div className="max-h-[400px] overflow-y-auto p-2">
                {["Navigate", "Actions"].map((category) => {
                  const categoryCommands = filteredCommands.filter((cmd) => cmd.category === category);
                  if (categoryCommands.length === 0) return null;

                  return (
                    <div key={category} className="mb-4">
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category}
                      </div>
                      {categoryCommands.map((cmd, idx) => {
                        const globalIndex = filteredCommands.indexOf(cmd);
                        const Icon = cmd.icon;
                        const isActive = cmd.id === currentTab && category === "Navigate";
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleSelect(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${
                              isSelected
                                ? "bg-primary/10 border-2 border-primary/50"
                                : "hover:bg-accent/50 border-2 border-transparent"
                            } ${isActive ? "ring-2 ring-primary/30" : ""}`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                              <span className={`font-medium ${isActive ? "text-primary" : ""}`}>{cmd.label}</span>
                              {isActive && (
                                <Badge variant="secondary" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs font-mono">
                              {cmd.kbd}
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}

                {filteredCommands.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    No commands found
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-border/50 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">↑↓</Badge>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">↵</Badge>
                    Select
                  </span>
                </div>
                <span>Press single keys for quick navigation</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}