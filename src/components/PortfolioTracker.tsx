"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertCircle,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { fetchStockQuote, StockQuote } from "@/lib/stockApi";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import toast from "react-hot-toast";

interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice?: number;
  currentValue?: number;
  totalCost?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6"];

export default function PortfolioTracker() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHolding, setNewHolding] = useState({
    symbol: "",
    name: "",
    quantity: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  // Load holdings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("portfolio_holdings");
    if (saved) {
      setHoldings(JSON.parse(saved));
    }
  }, []);

  // Save holdings to localStorage
  useEffect(() => {
    if (holdings.length > 0) {
      localStorage.setItem("portfolio_holdings", JSON.stringify(holdings));
    }
  }, [holdings]);

  // Fetch current prices for all holdings
  useEffect(() => {
    const fetchPrices = async () => {
      if (holdings.length === 0) return;

      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const quote = await fetchStockQuote(holding.symbol);
            const currentValue = holding.quantity * quote.price;
            const totalCost = holding.quantity * holding.purchasePrice;
            const profitLoss = currentValue - totalCost;
            const profitLossPercent = (profitLoss / totalCost) * 100;

            return {
              ...holding,
              currentPrice: quote.price,
              currentValue,
              totalCost,
              profitLoss,
              profitLossPercent,
            };
          } catch (error) {
            return holding;
          }
        })
      );

      setHoldings(updatedHoldings);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [holdings.length]);

  const handleAddHolding = async () => {
    if (!newHolding.symbol || !newHolding.quantity || !newHolding.purchasePrice) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const quote = await fetchStockQuote(newHolding.symbol.toUpperCase());
      
      const holding: PortfolioHolding = {
        id: Date.now().toString(),
        symbol: newHolding.symbol.toUpperCase(),
        name: newHolding.name || quote.symbol,
        quantity: parseFloat(newHolding.quantity),
        purchasePrice: parseFloat(newHolding.purchasePrice),
        purchaseDate: newHolding.purchaseDate,
        currentPrice: quote.price,
      };

      const currentValue = holding.quantity * quote.price;
      const totalCost = holding.quantity * holding.purchasePrice;
      const profitLoss = currentValue - totalCost;
      const profitLossPercent = (profitLoss / totalCost) * 100;

      holding.currentValue = currentValue;
      holding.totalCost = totalCost;
      holding.profitLoss = profitLoss;
      holding.profitLossPercent = profitLossPercent;

      setHoldings([...holdings, holding]);
      setNewHolding({
        symbol: "",
        name: "",
        quantity: "",
        purchasePrice: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      setIsAddDialogOpen(false);
      toast.success(`Added ${holding.symbol} to portfolio`);
    } catch (error) {
      toast.error("Failed to add holding. Please check the symbol.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHolding = (id: string) => {
    setHoldings(holdings.filter((h) => h.id !== id));
    toast.success("Holding removed");
  };

  // Portfolio calculations
  const portfolioStats = useMemo(() => {
    const totalValue = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0);
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;
    const dayGain = holdings.reduce((sum, h) => {
      if (h.currentPrice && h.quantity) {
        // Estimate day gain (would need previous close for accuracy)
        return sum + h.quantity * (h.currentPrice * 0.01); // Placeholder
      }
      return sum;
    }, 0);

    return {
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercent,
      dayGain,
      holdingsCount: holdings.length,
    };
  }, [holdings]);

  // Pie chart data
  const pieChartData = holdings
    .filter((h) => h.currentValue)
    .map((h) => ({
      name: h.symbol,
      value: h.currentValue || 0,
    }));

  // Risk exposure (by position size)
  const riskExposure = holdings
    .filter((h) => h.currentValue)
    .map((h) => ({
      symbol: h.symbol,
      percentage: portfolioStats.totalValue > 0 ? (h.currentValue! / portfolioStats.totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card via-card to-primary/5">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">Total Value</span>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="text-3xl font-bold">${portfolioStats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Cost: ${portfolioStats.totalCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Total P&L */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card via-card to-green-500/5">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">Total P&L</span>
                {portfolioStats.totalProfitLoss >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className={`text-3xl font-bold ${portfolioStats.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolioStats.totalProfitLoss >= 0 ? "+" : ""}${portfolioStats.totalProfitLoss.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
              <div className={`text-xs font-semibold mt-1 ${portfolioStats.totalProfitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                {portfolioStats.totalProfitLoss >= 0 ? "+" : ""}{portfolioStats.totalProfitLossPercent.toFixed(2)}%
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Day Gain */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card via-card to-blue-500/5">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">Holdings</span>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{portfolioStats.holdingsCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Active positions</div>
            </div>
          </Card>
        </motion.div>

        {/* Holdings Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-card via-card to-purple-500/5">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground font-medium">Diversification</span>
                <PieChart className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-3xl font-bold">{riskExposure.length > 0 ? "Good" : "N/A"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {riskExposure.length > 0 ? `Top: ${riskExposure[0]?.percentage.toFixed(1)}%` : "Add holdings"}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="p-6 backdrop-blur-lg bg-card/80 border-2 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Holdings
              </h3>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Position
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Holding</DialogTitle>
                    <DialogDescription>
                      Enter the details of your stock purchase to track it in your portfolio.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="symbol">Stock Symbol *</Label>
                      <Input
                        id="symbol"
                        placeholder="AAPL"
                        value={newHolding.symbol}
                        onChange={(e) => setNewHolding({ ...newHolding, symbol: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Company Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder="Apple Inc."
                        value={newHolding.name}
                        onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        placeholder="10"
                        value={newHolding.quantity}
                        onChange={(e) => setNewHolding({ ...newHolding, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Purchase Price *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        value={newHolding.purchasePrice}
                        onChange={(e) => setNewHolding({ ...newHolding, purchasePrice: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Purchase Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newHolding.purchaseDate}
                        onChange={(e) => setNewHolding({ ...newHolding, purchaseDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddHolding} disabled={isLoading}>
                      {isLoading ? "Adding..." : "Add Holding"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {holdings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h4 className="text-xl font-semibold mb-2">No Holdings Yet</h4>
                <p className="text-muted-foreground mb-6">Start building your portfolio by adding your first stock position.</p>
                <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Holding
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {holdings.map((holding, index) => (
                        <motion.tr
                          key={holding.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="group hover:bg-muted/50"
                        >
                          <TableCell className="font-bold">
                            <div>
                              <div className="text-sm font-bold">{holding.symbol}</div>
                              <div className="text-xs text-muted-foreground">{holding.name}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{holding.quantity}</TableCell>
                          <TableCell className="text-right">${holding.purchasePrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {holding.currentPrice ? `$${holding.currentPrice.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ${holding.currentValue?.toFixed(2) || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {holding.profitLoss !== undefined && holding.profitLossPercent !== undefined ? (
                              <div className="flex flex-col items-end">
                                <span className={`font-bold ${holding.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                                  {holding.profitLoss >= 0 ? "+" : ""}${holding.profitLoss.toFixed(2)}
                                </span>
                                <span className={`text-xs ${holding.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                                  {holding.profitLoss >= 0 ? "+" : ""}{holding.profitLossPercent.toFixed(2)}%
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHolding(holding.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Right Sidebar - Allocation & Risk */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-6"
        >
          {/* Portfolio Allocation Pie Chart */}
          {pieChartData.length > 0 && (
            <Card className="p-6 backdrop-blur-lg bg-card/80 border-2 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Allocation
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                      } 
                      outerRadius={80}
                      fill="#8884d8" 
                      dataKey="value"
                    />

                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Risk Exposure */}
          {riskExposure.length > 0 && (
            <Card className="p-6 backdrop-blur-lg bg-card/80 border-2 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Risk Exposure
              </h3>
              <div className="space-y-4">
                {riskExposure.map((risk, index) => (
                  <motion.div
                    key={risk.symbol}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{risk.symbol}</span>
                      <Badge
                        variant={risk.percentage > 30 ? "destructive" : risk.percentage > 20 ? "secondary" : "outline"}
                      >
                        {risk.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={risk.percentage} className="h-2" />
                  </motion.div>
                ))}
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> For optimal diversification, no single position should exceed 20-25% of your portfolio.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
