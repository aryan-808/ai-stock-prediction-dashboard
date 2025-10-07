"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Loader2, Download, BarChart3, TrendingUp, Info, AlertCircle, Briefcase, Star, Target, Globe, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import ThemeToggle from "./ThemeToggle";
import StockSearch from "./StockSearch";
import ModelSelector from "./ModelSelector";
import PredictionChart from "./PredictionChart";
import MetricsComparison from "./MetricsComparison";
import ModelComparisonChart from "./ModelComparisonChart";
import SentimentAnalysis from "./SentimentAnalysis";
import BacktestResults from "./BacktestResults";
import PortfolioTracker from "./PortfolioTracker";
import WatchlistManager from "./WatchlistManager";
import TradingSignals from "./TradingSignals";
import MarketOverview from "./MarketOverview";
import RiskAnalytics from "./RiskAnalytics";
import CommandPalette from "./CommandPalette";
import QuickNav from "./QuickNav";
import { fetchStockData, fetchStockQuote, fetchNewsAndSentiment, StockData, StockQuote, NewsItem } from "@/lib/stockApi";
import { predictStock, calculateMetrics, backtestModel, ModelType, ModelPrediction, ModelMetrics } from "@/lib/mlModels";
import { generatePDFReport, generateExcelReport } from "@/lib/reportGenerator";
import toast, { Toaster } from "react-hot-toast";

export default function StockDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [selectedName, setSelectedName] = useState("Apple Inc.");
  const [selectedModel, setSelectedModel] = useState<ModelType>("LSTM");
  const [predictionDays, setPredictionDays] = useState(7);
  const [historicalData, setHistoricalData] = useState<StockData[]>([]);
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [predictions, setPredictions] = useState<{
    lstm?: ModelPrediction[];
    gru?: ModelPrediction[];
    transformer?: ModelPrediction[];
  }>({});
  const [metrics, setMetrics] = useState<{
    lstm?: ModelMetrics;
    gru?: ModelMetrics;
    transformer?: ModelMetrics;
  }>({});
  const [backtestData, setBacktestData] = useState<{
    lstm?: ModelPrediction[];
    gru?: ModelPrediction[];
    transformer?: ModelPrediction[];
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModels, setActiveModels] = useState<string[]>(["LSTM"]);
  const [currentTab, setCurrentTab] = useState("predictions");

  // Load data when symbol changes
  useEffect(() => {
    loadStockData();
  }, [selectedSymbol]);

  // Generate predictions for selected model when data, model, or days change
  useEffect(() => {
    if (historicalData.length > 0 && !isPredicting) {
      generatePredictions();
    }
  }, [selectedModel, predictionDays, historicalData]);

  const loadStockData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [histData, quoteData, newsData] = await Promise.all([
        fetchStockData(selectedSymbol, "1y"),
        fetchStockQuote(selectedSymbol),
        fetchNewsAndSentiment(selectedSymbol),
      ]);

      setHistoricalData(histData);
      setQuote(quoteData);
      setNews(newsData);
      
      // Clear old data when loading new stock
      setPredictions({});
      setMetrics({});
      setBacktestData({});
      setActiveModels([selectedModel]);
      
      toast.success(`Loaded data for ${selectedSymbol}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load stock data";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePredictions = async () => {
    if (historicalData.length === 0) return;

    setIsPredicting(true);
    try {
      const modelPredictions = await predictStock(selectedSymbol, historicalData, selectedModel, predictionDays);
      
      setPredictions((prev) => ({
        ...prev,
        [selectedModel.toLowerCase()]: modelPredictions,
      }));

      // Calculate metrics using backtest
      const backtestResults = await backtestModel(historicalData, selectedModel, Math.min(30, historicalData.length / 3));
      const modelMetrics = calculateMetrics(backtestResults, historicalData.slice(-backtestResults.length));
      
      setMetrics((prev) => ({
        ...prev,
        [selectedModel.toLowerCase()]: modelMetrics,
      }));

      // Store backtest data for the selected model
      setBacktestData((prev) => ({
        ...prev,
        [selectedModel.toLowerCase()]: backtestResults,
      }));

      if (!activeModels.includes(selectedModel)) {
        setActiveModels([...activeModels, selectedModel]);
      }

      toast.success(`Generated ${selectedModel} predictions for ${selectedSymbol}`);
    } catch (err) {
      toast.error(`Failed to generate predictions: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const runBacktest = async () => {
    if (historicalData.length === 0) return;

    setIsBacktesting(true);
    try {
      const testDays = Math.min(60, Math.floor(historicalData.length / 3));
      const results = await backtestModel(historicalData, selectedModel, testDays);
      
      setBacktestData((prev) => ({
        ...prev,
        [selectedModel.toLowerCase()]: results,
      }));
      
      toast.success(`Backtest completed for ${selectedModel} on ${selectedSymbol}`);
    } catch (err) {
      toast.error("Failed to run backtest");
    } finally {
      setIsBacktesting(false);
    }
  };

  const generateAllModelPredictions = async () => {
    if (historicalData.length === 0) {
      toast.error("No historical data available");
      return;
    }

    setIsPredicting(true);
    const models: ModelType[] = ["LSTM", "GRU", "Transformer"];
    
    try {
      toast("Generating predictions for all models...");
      
      for (const model of models) {
        const modelPredictions = await predictStock(selectedSymbol, historicalData, model, predictionDays);
        
        setPredictions((prev) => ({
          ...prev,
          [model.toLowerCase()]: modelPredictions,
        }));

        // Calculate metrics
        const backtestResults = await backtestModel(historicalData, model, Math.min(30, historicalData.length / 3));
        const modelMetrics = calculateMetrics(backtestResults, historicalData.slice(-backtestResults.length));
        
        setMetrics((prev) => ({
          ...prev,
          [model.toLowerCase()]: modelMetrics,
        }));

        // Store backtest data
        setBacktestData((prev) => ({
          ...prev,
          [model.toLowerCase()]: backtestResults,
        }));
      }

      setActiveModels(models);
      toast.success(`Generated predictions for all models on ${selectedSymbol}`);
    } catch (err) {
      toast.error(`Failed to generate all predictions: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const handleGenerateReport = (format: "pdf" | "excel") => {
    if (!quote || historicalData.length === 0) {
      toast.error("No data available for report");
      return;
    }

    try {
      const reportData = {
        symbol: selectedSymbol,
        historicalData,
        predictions,
        metrics,
        news,
        selectedModels: activeModels,
      };

      if (format === "pdf") {
        generatePDFReport(reportData);
        toast.success("PDF report generated");
      } else {
        generateExcelReport(reportData);
        toast.success("Excel report generated");
      }
    } catch (err) {
      toast.error(`Failed to generate ${format.toUpperCase()} report`);
    }
  };

  const handleSelectStock = (symbol: string, name: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(name);
    // Data will be cleared and reloaded in the useEffect
  };

  // Handle command palette actions
  const handleCommandAction = (action: string) => {
    switch (action) {
      case "refresh":
        loadStockData();
        toast.success("Refreshing data...");
        break;
      case "pdf":
        handleGenerateReport("pdf");
        break;
      case "excel":
        handleGenerateReport("excel");
        break;
      case "predict":
        generatePredictions();
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Toaster position="top-right" />
      
      {/* Command Palette */}
      <CommandPalette
        onNavigate={setCurrentTab}
        onAction={handleCommandAction}
        currentTab={currentTab}
      />

      {/* Quick Navigation FAB */}
      <QuickNav currentTab={currentTab} onNavigate={setCurrentTab} />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <BarChart3 className="h-8 w-8 text-primary" />
              </motion.div>
              <div>
                <Link 
                  href="/" 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setCurrentTab("market")}
                >
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                    AI Stock Predictor
                  </h1>
                </Link>
                <p className="text-xs text-muted-foreground">Deep Learning • Real-time Analysis • Global Markets</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <StockSearch onSelectStock={handleSelectStock} currentSymbol={selectedSymbol} />
        </motion.div>

        {/* Stock Info Card */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 border-2">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold">{selectedSymbol}</h2>
                    <span className="text-lg text-muted-foreground">{selectedName}</span>
                  </div>
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-4xl font-bold">${quote.price.toFixed(2)}</span>
                    <span className={`text-xl font-semibold ${quote.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Open</div>
                    <div className="font-semibold">${quote.open.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">High</div>
                    <div className="font-semibold text-green-500">${quote.high.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Low</div>
                    <div className="font-semibold text-red-500">${quote.low.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Volume</div>
                    <div className="font-semibold">{(quote.volume / 1000000).toFixed(2)}M</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Loading stock data for {selectedSymbol}...</p>
            </div>
          </Card>
        )}

        {/* Main Dashboard */}
        {!isLoading && historicalData.length > 0 && (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 lg:w-auto lg:inline-grid">
              <TabsTrigger value="market" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Market</span>
              </TabsTrigger>
              <TabsTrigger value="predictions" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Predictions</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Risk</span>
              </TabsTrigger>
              <TabsTrigger value="signals" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Signals</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Watchlist</span>
              </TabsTrigger>
              <TabsTrigger value="backtest" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Backtest</span>
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Sentiment</span>
              </TabsTrigger>
            </TabsList>

            {/* Market Overview Tab */}
            <TabsContent value="market" className="space-y-6">
              <MarketOverview />
            </TabsContent>

            {/* Predictions Tab */}
            <TabsContent value="predictions" className="space-y-6">
              {/* Model Selection & Controls */}
              <Card className="p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Select ML Model for {selectedSymbol}</h3>
                    <Button 
                      onClick={generateAllModelPredictions} 
                      disabled={isPredicting}
                      variant="outline"
                      size="sm"
                    >
                      {isPredicting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate All Models"
                      )}
                    </Button>
                  </div>
                  <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Prediction Period</h3>
                    <span className="text-2xl font-bold text-primary">{predictionDays} Days</span>
                  </div>
                  <Slider
                    value={[predictionDays]}
                    onValueChange={(value) => setPredictionDays(value[0])}
                    min={7}
                    max={30}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>7 days</span>
                    <span>15 days</span>
                    <span>30 days</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={generatePredictions} disabled={isPredicting} className="flex-1">
                    {isPredicting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      `Generate ${selectedModel} Predictions`
                    )}
                  </Button>
                  <Button onClick={() => handleGenerateReport("pdf")} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button onClick={() => handleGenerateReport("excel")} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </Card>

              {/* Prediction Chart */}
              {activeModels.length > 0 && Object.keys(predictions).length > 0 && (
                <Card className="p-6 min-h-[700px]">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Price Predictions for {selectedSymbol}
                  </h3>
                  <div className="w-full h-[600px]">
                    <PredictionChart
                      historicalData={historicalData}
                      predictions={predictions}
                      selectedModels={activeModels}
                    />
                  </div>
                </Card>
              )}

              {/* Individual Metrics Comparison */}
              {Object.keys(metrics).length > 0 && (
                <MetricsComparison metrics={metrics} />
              )}

              {/* Comprehensive Model Comparison Chart */}
              {Object.keys(metrics).length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ModelComparisonChart metrics={metrics} />
                </motion.div>
              )}
            </TabsContent>

            {/* Risk Analytics Tab */}
            <TabsContent value="risk" className="space-y-6">
              <RiskAnalytics historicalData={historicalData} symbol={selectedSymbol} />
            </TabsContent>

            {/* Trading Signals Tab */}
            <TabsContent value="signals" className="space-y-6">
              <TradingSignals
                symbol={selectedSymbol}
                currentPrice={quote?.price || 0}
                predictions={predictions}
                sentiment={news.length > 0 ? news.reduce((acc, item) => acc + item.sentiment, 0) / news.length : 0}
                historicalData={historicalData}
              />
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              <PortfolioTracker />
            </TabsContent>

            {/* Watchlist Tab */}
            <TabsContent value="watchlist" className="space-y-6">
              <WatchlistManager />
            </TabsContent>

            {/* Backtest Tab */}
            <TabsContent value="backtest" className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">Model Backtesting for {selectedSymbol}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Test {selectedModel} model performance on historical unseen data
                    </p>
                  </div>
                  <Button onClick={runBacktest} disabled={isBacktesting}>
                    {isBacktesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      `Run ${selectedModel} Backtest`
                    )}
                  </Button>
                </div>
              </Card>

              {/* Display backtest results for the selected model */}
              {backtestData[selectedModel.toLowerCase() as keyof typeof backtestData] && 
               backtestData[selectedModel.toLowerCase() as keyof typeof backtestData]!.length > 0 && (
                <BacktestResults 
                  backtestData={backtestData[selectedModel.toLowerCase() as keyof typeof backtestData]!} 
                  modelName={`${selectedModel} (${selectedSymbol})`} 
                />
              )}

              {/* Show message if no backtest data */}
              {!backtestData[selectedModel.toLowerCase() as keyof typeof backtestData] && (
                <Card className="p-12">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">No Backtest Data Available</h3>
                      <p className="text-muted-foreground">
                        Click "Run {selectedModel} Backtest" to test the model on historical data for {selectedSymbol}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Sentiment Tab */}
            <TabsContent value="sentiment" className="space-y-6">
              <SentimentAnalysis news={news} symbol={selectedSymbol} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 AI Stock Predictor | Powered by LSTM, GRU & Transformer Models</p>
          <p className="mt-2">Real-time data from global exchanges | For educational purposes only</p>
          <p className="mt-2 font-semibold">Admin - Aryan Samal (Owner)</p>
        </div>
      </footer>
    </div>
  );
}
