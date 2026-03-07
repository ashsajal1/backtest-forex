"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import eurUsdData from "@/db/EURUSD.json";
import xauUsdData from "@/db/XAUUSD.json";
import TradeGame from "@/components/practice/trade-game";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  datetime: string;
}

function parseCandles(data: any[]): Candle[] {
  const filtered = data.filter((item) => {
    const date = new Date(item.datetime);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  });
  const reversed = [...filtered].reverse();
  return reversed.map((item, index) => ({
    time: index,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    datetime: item.datetime,
  }));
}

export default function TradePage() {
  const [eurusdCandles, setEurusdCandles] = useState<Candle[]>([]);
  const [xauusdCandles, setXauusdCandles] = useState<Candle[]>([]);
  const [startIndexEurusd, setStartIndexEurusd] = useState(0);
  const [startIndexXauusd, setStartIndexXauusd] = useState(0);
  const [gameKeyEurusd, setGameKeyEurusd] = useState(0);
  const [gameKeyXauusd, setGameKeyXauusd] = useState(0);
  const [balance, setBalance] = useState(100);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const eurusd = parseCandles(eurUsdData.values as any[]);
    const xauusd = parseCandles(xauUsdData.values as any[]);
    setEurusdCandles(eurusd);
    setXauusdCandles(xauusd);

    setStartIndexEurusd(
      Math.floor(Math.random() * Math.max(1, eurusd.length - 50 - 10 - 1))
    );
    setStartIndexXauusd(
      Math.floor(Math.random() * Math.max(1, xauusd.length - 50 - 10 - 1))
    );

    setMounted(true);
  }, []);

  const advanceEurusd = useCallback(() => {
    setStartIndexEurusd((prev) => {
      const maxStart = eurusdCandles.length - 50 - 10 - 1;
      const next = prev + 50;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKeyEurusd((k) => k + 1);
  }, [eurusdCandles.length]);

  const advanceXauusd = useCallback(() => {
    setStartIndexXauusd((prev) => {
      const maxStart = xauusdCandles.length - 50 - 10 - 1;
      const next = prev + 50;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKeyXauusd((k) => k + 1);
  }, [xauusdCandles.length]);

  if (!mounted || eurusdCandles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Forex Trading</h1>
            <p className="text-muted-foreground">
              Trade with ${balance.toFixed(2)} virtual money
            </p>
          </div>

          <Card className="px-4 py-2">
            <div className="text-center">
              <span className="text-muted-foreground">Balance: </span>
              <span className={`text-xl font-bold ${balance > 100 ? "text-green-500" : balance < 100 ? "text-red-500" : ""}`}>
                ${balance.toFixed(2)}
              </span>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="EURUSD" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="EURUSD">EUR/USD</TabsTrigger>
            <TabsTrigger value="XAUUSD">XAU/USD (Gold)</TabsTrigger>
          </TabsList>

          <TabsContent value="EURUSD">
            <Card>
              <CardHeader>
                <CardTitle>EUR/USD - Trading</CardTitle>
                <CardDescription>
                  Set your entry, take profit, and stop loss. Chart will reveal until TP or SL is hit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradeGame
                  allCandles={eurusdCandles}
                  startIndex={startIndexEurusd}
                  onNext={advanceEurusd}
                  gameKey={gameKeyEurusd}
                  balance={balance}
                  setBalance={setBalance}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="XAUUSD">
            <Card>
              <CardHeader>
                <CardTitle>XAU/USD - Trading</CardTitle>
                <CardDescription>
                  Set your entry, take profit, and stop loss. Chart will reveal until TP or SL is hit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TradeGame
                  allCandles={xauusdCandles}
                  startIndex={startIndexXauusd}
                  onNext={advanceXauusd}
                  gameKey={gameKeyXauusd}
                  balance={balance}
                  setBalance={setBalance}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>How to Trade</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Choose LONG (buy) or SHORT (sell)</li>
              <li>Set your entry price (default is marked candle close)</li>
              <li>Set Take Profit (TP) - price target for profit</li>
              <li>Set Stop Loss (SL) - max loss you&apos;re willing to accept</li>
              <li>Click &quot;Start Trade&quot; and watch the chart reveal</li>
              <li>Trade ends when TP or SL is hit, or when all candles are revealed</li>
              <li>P&amp;L is calculated based on your trade amount</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
