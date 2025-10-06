"use client";

import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { searchStocks, TRENDING_STOCKS } from "@/lib/stockApi";
import { motion, AnimatePresence } from "framer-motion";

interface StockSearchProps {
  onSelectStock: (symbol: string, name: string) => void;
  currentSymbol?: string;
}

export default function StockSearch({ onSelectStock, currentSymbol }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ symbol: string; name: string; exchange: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setShowTrending(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        const searchResults = await searchStocks(query);
        setResults(searchResults);
        setIsSearching(false);
        setShowDropdown(true);
        setShowTrending(false);
      }, 300);
    } else {
      setResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (symbol: string, name: string) => {
    onSelectStock(symbol, name);
    setQuery("");
    setShowDropdown(false);
    setShowTrending(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search any stock worldwide (e.g., AAPL, TSLA, BTC-USD)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => !query && setShowTrending(true)}
          className="pl-12 pr-32 h-14 text-lg border-2 focus:border-primary transition-all duration-300"
        />
        {isSearching && (
          <Loader2 className="absolute right-28 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTrending(!showTrending)}
          className="absolute right-2 top-1/2 -translate-y-1/2 gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Trending
        </Button>
      </div>

      <AnimatePresence>
        {(showDropdown || showTrending) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-card border-2 border-border rounded-lg shadow-2xl max-h-96 overflow-y-auto"
          >
            {showTrending && (
              <div className="p-2">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending Stocks
                </div>
                {TRENDING_STOCKS.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelect(stock.symbol, stock.name)}
                    className="w-full px-3 py-3 text-left hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {stock.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {stock.exchange}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && results.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                  Search Results
                </div>
                {results.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelect(result.symbol, result.name)}
                    className="w-full px-3 py-3 text-left hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {result.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">{result.name}</div>
                    </div>
                    <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full ml-2">
                      {result.exchange}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && results.length === 0 && !isSearching && (
              <div className="p-8 text-center text-muted-foreground">
                No stocks found. Try a different search term.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}