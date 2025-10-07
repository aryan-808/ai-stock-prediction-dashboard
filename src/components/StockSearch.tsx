"use client";

import { useState, useEffect, useRef } from "react";
import { Search, TrendingUp, Loader2 } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);
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

    if (query.length >= 1) {
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const searchResults = await searchStocks(query);
          setResults(searchResults);
          setShowDropdown(true);
          setShowTrending(false);
        } catch (error) {
          console.error("Search error:", error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 250);
    } else {
      setResults([]);
      setShowDropdown(false);
      setIsSearching(false);
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
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value) {
      setShowTrending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQuery("");
      setShowDropdown(false);
      setShowTrending(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stocks... (e.g., AAPL, TSLA)"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !query && setShowTrending(true)}
          className="flex h-12 sm:h-14 w-full rounded-md border-2 border-input bg-transparent px-3 pl-10 sm:pl-12 pr-20 sm:pr-32 py-1 text-base sm:text-lg shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Search stocks"
        />
        {isSearching && (
          <Loader2 className="absolute right-16 sm:right-28 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary pointer-events-none z-10" />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setShowTrending(!showTrending);
            setShowDropdown(false);
          }}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 gap-1 sm:gap-2 z-10 h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm"
          type="button"
        >
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Trending</span>
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
                <div className="px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  Trending Stocks
                </div>
                {TRENDING_STOCKS.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => handleSelect(stock.symbol, stock.name)}
                    className="w-full px-3 py-2 sm:py-3 text-left hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-between group"
                    type="button"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                        {stock.symbol}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{stock.name}</div>
                    </div>
                    <div className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 text-primary rounded-full flex-shrink-0">
                      {stock.exchange}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && results.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                  Search Results ({results.length})
                </div>
                {results.map((result) => (
                  <button
                    key={`${result.symbol}-${result.exchange}`}
                    onClick={() => handleSelect(result.symbol, result.name)}
                    className="w-full px-3 py-2 sm:py-3 text-left hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-between group"
                    type="button"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                        {result.symbol}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">{result.name}</div>
                    </div>
                    <div className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary/10 text-primary rounded-full flex-shrink-0">
                      {result.exchange}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && results.length === 0 && !isSearching && query.length > 0 && (
              <div className="p-6 sm:p-8 text-center text-muted-foreground">
                <p className="font-semibold mb-1 text-sm sm:text-base">No stocks found for &quot;{query}&quot;</p>
                <p className="text-xs sm:text-sm">Try a different search term or browse trending stocks</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
