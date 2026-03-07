"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Wallet, RotateCcw } from "lucide-react";
import Link from "next/link";
import eurUsdData from "@/db/EURUSD.json";
import xauUsdData from "@/db/XAUUSD.json";
import { parseCandles, Candle } from "@/components/practice/structure";
import Chart from "@/components/practice/chart";

const INITIAL_BALANCE = 100;

export default function TradePage() {
  const [currency, setCurrency] = useState<"EUR/USD" | "XAU/USD">("EUR/USD");
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [mounted, setMounted] = useState(false);

  const [tpPrice, setTpPrice] = useState<number | null>(null);
  const [slPrice, setSlPrice] = useState<number | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [tradeDirection, setTradeDirection] = useState<"buy" | "sell" | null>(null);
  const [positionSize, setPositionSize] = useState<number>(1);
  const [revealCount, setRevealCount] = useState(0);
  const [tradeResult, setTradeResult] = useState<"win" | "loss" | "pending" | null>(null);
  const [tradePnl, setTradePnl] = useState<number>(0);

  const config = useMemo(() => ({
    "50": { total: 50, predictionIndex: 39, hideCount: 10 },
    "100": { total: 100, predictionIndex: 79, hideCount: 20 },
    "200": { total: 200, predictionIndex: 179, hideCount: 20 },
  }), []);

  const [difficulty, setDifficulty] = useState<"50" | "100" | "200">("100");

  const resetTrade = useCallback(() => {
    setTpPrice(null);
    setSlPrice(null);
    setEntryPrice(null);
    setTradeDirection(null);
    setPositionSize(1);
    setRevealCount(0);
    setTradeResult(null);
    setTradePnl(0);
    setGameKey(k => k + 1);
  }, []);

  const handleReset = useCallback(() => {
    setBalance(INITIAL_BALANCE);
    resetTrade();
  }, [resetTrade]);

  useEffect(() => {
    const data = currency === "EUR/USD" ? eurUsdData : xauUsdData;
    const candles = parseCandles(data);
    setAllCandles(candles);

    const maxStart = candles.length - config[difficulty].total - config[difficulty].hideCount - 1;
    setStartIndex(Math.floor(Math.random() * Math.max(1, maxStart)));

    setMounted(true);
  }, [currency, difficulty, config]);

  useEffect(() => {
    if (allCandles.length === 0) return;
    
    const maxStart = allCandles.length - config[difficulty].total - config[difficulty].hideCount - 1;
    setStartIndex(Math.floor(Math.random() * Math.max(1, maxStart)));
    resetTrade();
  }, [difficulty, allCandles.length, config, resetTrade]);

  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    return allCandles.slice(
      startIndex,
      startIndex + config[difficulty].total + config[difficulty].hideCount
    );
  }, [allCandles, startIndex, difficulty, config]);

  const markedCandle = visibleCandles[config[difficulty].predictionIndex];

  const handleSetEntry = useCallback((direction: "buy" | "sell") => {
    if (!markedCandle) return;
    setTradeDirection(direction);
    setEntryPrice(markedCandle.close);
    setTpPrice(null);
    setSlPrice(null);
    setRevealCount(0);
    setTradeResult(null);
    setTradePnl(0);
    setGameKey(k => k + 1);
  }, [markedCandle]);

  const handleSetTpSl = useCallback((tp: number | null, sl: number | null) => {
    setTpPrice(tp);
    setSlPrice(sl);
  }, []);

  const handleStartTrade = useCallback(() => {
    if (!entryPrice || !tradeDirection || !tpPrice || !slPrice) return;

    let reveal = 0;
    const totalCandlesToReveal = config[difficulty].hideCount;

    const checkTrade = () => {
      const currentCandleIndex = config[difficulty].predictionIndex + reveal;
      if (currentCandleIndex >= visibleCandles.length) {
        setTradeResult("loss");
        setTradePnl(0);
        setBalance(b => b - positionSize * 10);
        return;
      }

      const currentCandle = visibleCandles[currentCandleIndex];
      if (!currentCandle) return;

      const isBuy = tradeDirection === "buy";
      
      let hitTp = false;
      let hitSl = false;

      if (isBuy) {
        if (tpPrice && currentCandle.high >= tpPrice) hitTp = true;
        if (slPrice && currentCandle.low <= slPrice) hitSl = true;
      } else {
        if (tpPrice && currentCandle.low <= tpPrice) hitTp = true;
        if (slPrice && currentCandle.high >= slPrice) hitSl = true;
      }

      if (hitTp) {
        const pips = isBuy 
          ? (tpPrice - entryPrice) * 10000
          : (entryPrice - tpPrice) * 10000;
        const pnl = pips * positionSize;
        setTradeResult("win");
        setTradePnl(pnl);
        setBalance(b => b + pnl);
      } else if (hitSl) {
        const pips = isBuy
          ? (entryPrice - slPrice) * 10000
          : (slPrice - entryPrice) * 10000;
        const pnl = -pips * positionSize;
        setTradeResult("loss");
        setTradePnl(pnl);
        setBalance(b => b + pnl);
      } else {
        reveal++;
        setRevealCount(reveal);
        if (reveal < totalCandlesToReveal) {
          setTimeout(checkTrade, 50);
        } else {
          const lastCandle = visibleCandles[visibleCandles.length - 1];
          if (lastCandle) {
            const pips = isBuy
              ? (lastCandle.close - entryPrice) * 10000
              : (entryPrice - lastCandle.close) * 10000;
            const pnl = pips * positionSize;
            if (pnl > 0) {
              setTradeResult("win");
              setTradePnl(pnl);
              setBalance(b => b + pnl);
            } else {
              setTradeResult("loss");
              setTradePnl(pnl);
              setBalance(b => b + pnl);
            }
          }
        }
      }
    };

    checkTrade();
  }, [entryPrice, tradeDirection, tpPrice, slPrice, positionSize, visibleCandles, config, difficulty]);

  const handleNext = useCallback(() => {
    if (allCandles.length === 0) return;
    const maxStart = allCandles.length - config[difficulty].total - config[difficulty].hideCount - 1;
    const nextStart = startIndex + config[difficulty].total;
    
    if (nextStart > maxStart) {
      setStartIndex(Math.floor(Math.random() * Math.max(1, maxStart)));
    } else {
      setStartIndex(nextStart);
    }
    resetTrade();
    setGameKey(k => k + 1);
  }, [allCandles.length, startIndex, difficulty, config, resetTrade]);

  if (!mounted || allCandles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-6">
      <div className="w-full space-y-4">
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/10 rounded-lg">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>{currency} Trading</CardTitle>
                  <CardDescription>Demo Trading with TP/SL</CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-lg bg-green-600 text-white font-bold">
                  ${balance.toFixed(2)}
                </div>

                <Select
                  value={currency}
                  onValueChange={(v) => setCurrency(v as "EUR/USD" | "XAU/USD")}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                    <SelectItem value="XAU/USD">XAU/USD</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v as "50" | "100" | "200")}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Candles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>

                <Link
                  href="/"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  Practice
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {markedCandle && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-lg font-mono font-semibold">
                        Entry:{" "}
                        <span className="text-yellow-500">
                          {markedCandle.close.toFixed(5)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        #{config[difficulty].predictionIndex + 1} ({markedCandle.datetime})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-muted-foreground">Position Size</div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPositionSize(Math.max(0.1, positionSize - 0.1))}
                          disabled={tradeResult !== null}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-mono">{positionSize.toFixed(1)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPositionSize(positionSize + 0.1)}
                          disabled={tradeResult !== null}
                        >
                          +
                        </Button>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      title="Reset Balance"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="bg-muted/20 rounded-lg p-2 sm:p-4">
                    <Chart
                      key={gameKey}
                      candles={visibleCandles}
                      visibleCount={config[difficulty].predictionIndex + 1}
                      revealCount={revealCount}
                      markIndex={config[difficulty].predictionIndex}
                      entryPrice={entryPrice}
                      tpPrice={tpPrice}
                      slPrice={slPrice}
                      tradeDirection={tradeDirection}
                      onTpSlChange={handleSetTpSl}
                    />
                  </div>
                </div>

                <div className="w-full lg:w-80 space-y-3">
                  {!entryPrice && markedCandle && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground text-center">
                        Choose trade direction
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          className="gap-1 bg-green-600 hover:bg-green-700 h-12"
                          onClick={() => handleSetEntry("buy")}
                        >
                          <TrendingUp className="w-4 h-4" />
                          BUY / LONG
                        </Button>
                        <Button
                          className="gap-1 bg-red-600 hover:bg-red-700 h-12"
                          onClick={() => handleSetEntry("sell")}
                        >
                          <TrendingDown className="w-4 h-4" />
                          SELL / SHORT
                        </Button>
                      </div>
                    </div>
                  )}

                  {entryPrice && !tradeResult && (
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">Set TP & SL (drag on chart or enter manually)</div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Take Profit</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={tpPrice?.toFixed(5) || ""}
                              onChange={(e) => setTpPrice(e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-2 py-1 text-sm bg-background border rounded"
                              placeholder="TP Price"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Stop Loss</label>
                            <input
                              type="number"
                              step="0.00001"
                              value={slPrice?.toFixed(5) || ""}
                              onChange={(e) => setSlPrice(e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-2 py-1 text-sm bg-background border rounded"
                              placeholder="SL Price"
                            />
                          </div>
                        </div>

                        {tpPrice && slPrice && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-500">
                                TP: {((tradeDirection === "buy" ? tpPrice - entryPrice : entryPrice - tpPrice) * 10000).toFixed(1)} pips
                              </span>
                              <span className="text-red-500">
                                SL: {((tradeDirection === "buy" ? entryPrice - slPrice : slPrice - entryPrice) * 10000).toFixed(1)} pips
                              </span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-green-500">
                                +${((tradeDirection === "buy" ? tpPrice - entryPrice : entryPrice - tpPrice) * 10000 * positionSize).toFixed(2)}
                              </span>
                              <span className="text-red-500">
                                -${((tradeDirection === "buy" ? entryPrice - slPrice : slPrice - entryPrice) * 10000 * positionSize).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                        onClick={handleStartTrade}
                        disabled={!tpPrice || !slPrice}
                      >
                        Start Trade
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={resetTrade}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {tradeResult && (
                    <div
                      className={`text-center p-4 rounded-xl border-2 ${
                        tradeResult === "win"
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 mb-2">
                        {tradeResult === "win" ? (
                          <TrendingUp className="w-6 h-6 text-green-500" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-red-500" />
                        )}
                        <span className="text-xl font-bold">
                          {tradeResult === "win" ? "WIN!" : "LOSS"}
                        </span>
                      </div>
                      
                      <div className="text-2xl font-mono font-bold mb-2">
                        {tradePnl >= 0 ? "+" : ""}${tradePnl.toFixed(2)}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={handleNext}
                        >
                          Next Trade
                        </Button>
                      </div>
                    </div>
                  )}

                  {tradeDirection && entryPrice && (
                    <div className="flex items-center justify-center gap-2">
                      <Badge
                        variant={tradeDirection === "buy" ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {tradeDirection === "buy" ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {tradeDirection.toUpperCase()} @ {entryPrice.toFixed(5)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
