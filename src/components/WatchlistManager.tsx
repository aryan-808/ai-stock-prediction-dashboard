"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  Bell,
  BellOff,
  Star,
  TrendingUp,
  TrendingDown,
  Folder,
  FolderPlus,
  Search,
  Filter,
  AlertTriangle,
  Check,
  X,
  MoreVertical,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { fetchStockQuote, StockQuote } from "@/lib/stockApi";
import toast from "react-hot-toast";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  addedDate: string;
  listId: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface PriceAlert {
  id: string;
  symbol: string;
  type: "above" | "below";
  price: number;
  isActive: boolean;
  createdDate: string;
  triggeredDate?: string;
}

interface Watchlist {
  id: string;
  name: string;
  color: string;
  icon: string;
  itemCount: number;
}

const DEFAULT_LISTS: Watchlist[] = [
  { id: "all", name: "All Stocks", color: "blue", icon: "⭐", itemCount: 0 },
  { id: "tech", name: "Technology", color: "purple", icon: "💻", itemCount: 0 },
  { id: "growth", name: "Growth", color: "green", icon: "🚀", itemCount: 0 },
  { id: "dividend", name: "Dividend", color: "yellow", icon: "💰", itemCount: 0 },
];

export default function WatchlistManager() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>(DEFAULT_LISTS);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [selectedList, setSelectedList] = useState("all");
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAddListOpen, setIsAddListOpen] = useState(false);
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [newStock, setNewStock] = useState({ symbol: "", name: "", listId: "all" });
  const [newList, setNewList] = useState({ name: "", color: "blue", icon: "📁" });
  const [newAlert, setNewAlert] = useState({ symbol: "", type: "above" as "above" | "below", price: "" });

  // Load data from localStorage
  useEffect(() => {
    const savedLists = localStorage.getItem("watchlists");
    const savedItems = localStorage.getItem("watchlist_items");
    const savedAlerts = localStorage.getItem("price_alerts");

    if (savedLists) setWatchlists(JSON.parse(savedLists));
    if (savedItems) setItems(JSON.parse(savedItems));
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("watchlists", JSON.stringify(watchlists));
  }, [watchlists]);

  useEffect(() => {
    localStorage.setItem("watchlist_items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("price_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Update item counts for watchlists
  useEffect(() => {
    const updatedLists = watchlists.map((list) => ({
      ...list,
      itemCount: list.id === "all" ? items.length : items.filter((item) => item.listId === list.id).length,
    }));
    setWatchlists(updatedLists);
  }, [items]);

  // Fetch live prices
  useEffect(() => {
    const fetchPrices = async () => {
      if (items.length === 0) return;

      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const quote = await fetchStockQuote(item.symbol);
            return {
              ...item,
              currentPrice: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
            };
          } catch {
            return item;
          }
        })
      );

      setItems(updatedItems);
      checkAlerts(updatedItems);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [items.length]);

  const checkAlerts = (currentItems: WatchlistItem[]) => {
    alerts.forEach((alert) => {
      if (!alert.isActive || alert.triggeredDate) return;

      const item = currentItems.find((i) => i.symbol === alert.symbol);
      if (!item?.currentPrice) return;

      const triggered =
        (alert.type === "above" && item.currentPrice >= alert.price) ||
        (alert.type === "below" && item.currentPrice <= alert.price);

      if (triggered) {
        toast.success(
          `Alert: ${alert.symbol} is ${alert.type} $${alert.price}! Current: $${item.currentPrice.toFixed(2)}`,
          { duration: 10000 }
        );
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id ? { ...a, triggeredDate: new Date().toISOString(), isActive: false } : a
          )
        );
      }
    });
  };

  const handleAddStock = async () => {
    if (!newStock.symbol) {
      toast.error("Please enter a stock symbol");
      return;
    }

    setIsLoading(true);
    try {
      const quote = await fetchStockQuote(newStock.symbol.toUpperCase());
      
      const item: WatchlistItem = {
        id: Date.now().toString(),
        symbol: newStock.symbol.toUpperCase(),
        name: newStock.name || quote.symbol,
        addedDate: new Date().toISOString(),
        listId: newStock.listId,
        currentPrice: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
      };

      setItems([...items, item]);
      setNewStock({ symbol: "", name: "", listId: "all" });
      setIsAddStockOpen(false);
      toast.success(`Added ${item.symbol} to watchlist`);
    } catch {
      toast.error("Failed to add stock. Check the symbol.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStock = (id: string) => {
    const item = items.find((i) => i.id === id);
    setItems(items.filter((i) => i.id !== id));
    toast.success(`Removed ${item?.symbol} from watchlist`);
  };

  const handleAddList = () => {
    if (!newList.name) {
      toast.error("Please enter a list name");
      return;
    }

    const list: Watchlist = {
      id: Date.now().toString(),
      name: newList.name,
      color: newList.color,
      icon: newList.icon,
      itemCount: 0,
    };

    setWatchlists([...watchlists, list]);
    setNewList({ name: "", color: "blue", icon: "📁" });
    setIsAddListOpen(false);
    toast.success(`Created ${list.name} watchlist`);
  };

  const handleDeleteList = (id: string) => {
    if (id === "all") {
      toast.error("Cannot delete default watchlist");
      return;
    }

    const list = watchlists.find((l) => l.id === id);
    setWatchlists(watchlists.filter((l) => l.id !== id));
    setItems(items.map((item) => (item.listId === id ? { ...item, listId: "all" } : item)));
    
    if (selectedList === id) setSelectedList("all");
    toast.success(`Deleted ${list?.name} watchlist`);
  };

  const handleAddAlert = () => {
    if (!newAlert.symbol || !newAlert.price) {
      toast.error("Please fill in all alert fields");
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol.toUpperCase(),
      type: newAlert.type,
      price: parseFloat(newAlert.price),
      isActive: true,
      createdDate: new Date().toISOString(),
    };

    setAlerts([...alerts, alert]);
    setNewAlert({ symbol: "", type: "above", price: "" });
    setIsAddAlertOpen(false);
    toast.success(`Alert created for ${alert.symbol}`);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
    toast.success("Alert deleted");
  };

  const toggleAlert = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesList = selectedList === "all" || item.listId === selectedList;
    return matchesSearch && matchesList;
  });

  const activeAlerts = alerts.filter((a) => a.isActive && !a.triggeredDate);
  const triggeredAlerts = alerts.filter((a) => a.triggeredDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 backdrop-blur-lg bg-gradient-to-br from-card via-card to-primary/5 border-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-500" />
              Smart Watchlists
            </h2>
            <p className="text-muted-foreground mt-1">Organize and monitor your favorite stocks with intelligent alerts</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Stock to Watchlist</DialogTitle>
                  <DialogDescription>Enter stock details to add to your watchlist</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="stock-symbol">Stock Symbol *</Label>
                    <Input
                      id="stock-symbol"
                      placeholder="AAPL"
                      value={newStock.symbol}
                      onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock-name">Company Name (Optional)</Label>
                    <Input
                      id="stock-name"
                      placeholder="Apple Inc."
                      value={newStock.name}
                      onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-select">Add to List</Label>
                    <Select value={newStock.listId} onValueChange={(value) => setNewStock({ ...newStock, listId: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {watchlists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.icon} {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddStockOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddStock} disabled={isLoading}>
                    {isLoading ? "Adding..." : "Add Stock"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddListOpen} onOpenChange={setIsAddListOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FolderPlus className="h-4 w-4" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Watchlist</DialogTitle>
                  <DialogDescription>Organize your stocks into custom lists</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="list-name">List Name *</Label>
                    <Input
                      id="list-name"
                      placeholder="My Growth Stocks"
                      value={newList.name}
                      onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-icon">Icon</Label>
                    <Input
                      id="list-icon"
                      placeholder="📊"
                      value={newList.icon}
                      onChange={(e) => setNewList({ ...newList, icon: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddListOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddList}>Create List</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Lists */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-1"
        >
          <Card className="p-4 backdrop-blur-lg bg-card/80 border-2">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              Lists
            </h3>
            <div className="space-y-2">
              {watchlists.map((list) => (
                <motion.div
                  key={list.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={selectedList === list.id ? "default" : "ghost"}
                    className="w-full justify-between group"
                    onClick={() => setSelectedList(list.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span>{list.icon}</span>
                      <span>{list.name}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{list.itemCount}</Badge>
                      {list.id !== "all" && list.id !== "tech" && list.id !== "growth" && list.id !== "dividend" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Main Content - Stocks & Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3"
        >
          <Tabs defaultValue="stocks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stocks">Stocks ({filteredItems.length})</TabsTrigger>
              <TabsTrigger value="alerts">Alerts ({activeAlerts.length})</TabsTrigger>
            </TabsList>

            {/* Stocks Tab */}
            <TabsContent value="stocks" className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Stock List */}
              {filteredItems.length === 0 ? (
                <Card className="p-12">
                  <div className="flex flex-col items-center text-center">
                    <Star className="h-16 w-16 text-muted-foreground mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No Stocks in Watchlist</h4>
                    <p className="text-muted-foreground mb-6">Start adding stocks to track them here</p>
                    <Button onClick={() => setIsAddStockOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Stock
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  <AnimatePresence>
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="p-4 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xl font-bold">{item.symbol}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {watchlists.find((l) => l.id === item.listId)?.icon}{" "}
                                    {watchlists.find((l) => l.id === item.listId)?.name}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.name}</p>
                              </div>

                              {item.currentPrice && (
                                <div className="text-right">
                                  <div className="text-2xl font-bold">${item.currentPrice.toFixed(2)}</div>
                                  <div className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                                    (item.change || 0) >= 0 ? "text-green-500" : "text-red-500"
                                  }`}>
                                    {(item.change || 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    {(item.change || 0) >= 0 ? "+" : ""}{item.change?.toFixed(2)} ({item.changePercent?.toFixed(2)}%)
                                  </div>
                                </div>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setNewAlert({ ...newAlert, symbol: item.symbol });
                                  setIsAddAlertOpen(true);
                                }}>
                                  <Bell className="mr-2 h-4 w-4" />
                                  Set Alert
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteStock(item.id)} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Price Alerts</h3>
                <Dialog open={isAddAlertOpen} onOpenChange={setIsAddAlertOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Alert
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Price Alert</DialogTitle>
                      <DialogDescription>Get notified when a stock reaches your target price</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="alert-symbol">Stock Symbol *</Label>
                        <Input
                          id="alert-symbol"
                          placeholder="AAPL"
                          value={newAlert.symbol}
                          onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alert-type">Alert Type</Label>
                        <Select value={newAlert.type} onValueChange={(value: "above" | "below") => setNewAlert({ ...newAlert, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="above">Price Goes Above</SelectItem>
                            <SelectItem value="below">Price Goes Below</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="alert-price">Target Price *</Label>
                        <Input
                          id="alert-price"
                          type="number"
                          step="0.01"
                          placeholder="150.00"
                          value={newAlert.price}
                          onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsAddAlertOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddAlert}>Create Alert</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Active Alerts */}
              {activeAlerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Active Alerts</h4>
                  <AnimatePresence>
                    {activeAlerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card className="p-4 border-2 border-green-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Bell className="h-5 w-5 text-green-500" />
                              <div>
                                <div className="font-bold">{alert.symbol}</div>
                                <div className="text-sm text-muted-foreground">
                                  Alert when price goes {alert.type} ${alert.price.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAlert(alert.id)}
                              >
                                <BellOff className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAlert(alert.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Triggered Alerts */}
              {triggeredAlerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Triggered Alerts</h4>
                  {triggeredAlerts.map((alert) => (
                    <Card key={alert.id} className="p-4 border-2 border-yellow-500/20 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Check className="h-5 w-5 text-yellow-500" />
                          <div>
                            <div className="font-bold">{alert.symbol}</div>
                            <div className="text-sm text-muted-foreground">
                              Triggered on {new Date(alert.triggeredDate!).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {activeAlerts.length === 0 && triggeredAlerts.length === 0 && (
                <Card className="p-12">
                  <div className="flex flex-col items-center text-center">
                    <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No Alerts Set</h4>
                    <p className="text-muted-foreground mb-6">Create price alerts to get notified</p>
                    <Button onClick={() => setIsAddAlertOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Alert
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}