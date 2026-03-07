"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, TrendingUp } from "lucide-react";
import eurUsdData from "@/db/EURUSD.json";
import xauUsdData from "@/db/XAUUSD.json";
import { parseCandles, Candle } from "@/components/practice/structure";
import ScoreCard from "@/components/practice/score-card";
import PracticeGame from "@/components/practice/practice-game";

export default function PracticePage() {
  const [currency, setCurrency] = useState<"EUR/USD" | "XAU/USD">("EUR/USD");
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [startIndex50, setStartIndex50] = useState(0);
  const [startIndex100, setStartIndex100] = useState(0);
  const [startIndex200, setStartIndex200] = useState(0);
  const [gameKey50, setGameKey50] = useState(0);
  const [gameKey100, setGameKey100] = useState(0);
  const [gameKey200, setGameKey200] = useState(0);
  const [score50, setScore50] = useState({ correct: 0, total: 0 });
  const [score100, setScore100] = useState({ correct: 0, total: 0 });
  const [score200, setScore200] = useState({ correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);

  const config = {
    "50": { total: 50, predictionIndex: 39, hideCount: 10 },
    "100": { total: 100, predictionIndex: 79, hideCount: 20 },
    "200": { total: 200, predictionIndex: 179, hideCount: 20 },
  };

  useEffect(() => {
    const data = currency === "EUR/USD" ? eurUsdData : xauUsdData;
    const candles = parseCandles(data);
    setAllCandles(candles);

    const maxStart50 = candles.length - 50 - 10 - 1;
    const maxStart100 = candles.length - 100 - 20 - 1;
    const maxStart200 = candles.length - 200 - 20 - 1;

    setStartIndex50(Math.floor(Math.random() * Math.max(1, maxStart50)));
    setStartIndex100(Math.floor(Math.random() * Math.max(1, maxStart100)));
    setStartIndex200(Math.floor(Math.random() * Math.max(1, maxStart200)));

    setScore50({ correct: 0, total: 0 });
    setScore100({ correct: 0, total: 0 });
    setScore200({ correct: 0, total: 0 });
    setGameKey50(0);
    setGameKey100(0);
    setGameKey200(0);

    setMounted(true);
  }, [currency]);

  const accuracy50 =
    score50.total > 0 ? Math.round((score50.correct / score50.total) * 100) : 0;
  const accuracy100 =
    score100.total > 0
      ? Math.round((score100.correct / score100.total) * 100)
      : 0;
  const accuracy200 =
    score200.total > 0
      ? Math.round((score200.correct / score200.total) * 100)
      : 0;

  const advance50 = useCallback(() => {
    setStartIndex50((prev) => {
      const maxStart = allCandles.length - 50 - 10 - 1;
      const next = prev + 50;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKey50((k) => k + 1);
  }, [allCandles.length]);

  const advance100 = useCallback(() => {
    setStartIndex100((prev) => {
      const maxStart = allCandles.length - 100 - 20 - 1;
      const next = prev + 100;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKey100((k) => k + 1);
  }, [allCandles.length]);

  const advance200 = useCallback(() => {
    setStartIndex200((prev) => {
      const maxStart = allCandles.length - 200 - 20 - 1;
      const next = prev + 200;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKey200((k) => k + 1);
  }, [allCandles.length]);

  if (!mounted || allCandles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-6">
      <div className="w-full space-y-8">
        <Card className="border-primary/10">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{currency} Practice</CardTitle>
                  <CardDescription>Predict price direction</CardDescription>
                </div>
              </div>

              <Select
                value={currency}
                onValueChange={(v) =>
                  setCurrency(v as "EUR/USD" | "XAU/USD")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR/USD">EUR/USD</SelectItem>
                  <SelectItem value="XAU/USD">XAU/USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="50" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  <ScoreCard label="50" score={score50} accuracy={accuracy50} />
                  <ScoreCard
                    label="100"
                    score={score100}
                    accuracy={accuracy100}
                  />
                  <ScoreCard
                    label="200"
                    score={score200}
                    accuracy={accuracy200}
                  />
                </div>

                <TabsList>
                  <TabsTrigger value="50">50</TabsTrigger>
                  <TabsTrigger value="100">100</TabsTrigger>
                  <TabsTrigger value="200">200</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="50" className="mt-0">
                <PracticeGame
                  totalCandles={config["50"].total}
                  predictionIndex={config["50"].predictionIndex}
                  hideCount={config["50"].hideCount}
                  score={score50}
                  setScore={setScore50}
                  allCandles={allCandles}
                  startIndex={startIndex50}
                  onNext={advance50}
                  gameKey={gameKey50}
                />
              </TabsContent>

              <TabsContent value="100" className="mt-0">
                <PracticeGame
                  totalCandles={config["100"].total}
                  predictionIndex={config["100"].predictionIndex}
                  hideCount={config["100"].hideCount}
                  score={score100}
                  setScore={setScore100}
                  allCandles={allCandles}
                  startIndex={startIndex100}
                  onNext={advance100}
                  gameKey={gameKey100}
                />
              </TabsContent>

              <TabsContent value="200" className="mt-0">
                <PracticeGame
                  totalCandles={config["200"].total}
                  predictionIndex={config["200"].predictionIndex}
                  hideCount={config["200"].hideCount}
                  score={score200}
                  setScore={setScore200}
                  allCandles={allCandles}
                  startIndex={startIndex200}
                  onNext={advance200}
                  gameKey={gameKey200}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Choose Difficulty</p>
                  <p className="text-sm text-muted-foreground">
                    Select 50, 100, or 200 candles
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Analyze Price</p>
                  <p className="text-sm text-muted-foreground">
                    Yellow line marks candle #
                    {config["50"].predictionIndex + 1}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Predict Direction</p>
                  <p className="text-sm text-muted-foreground">
                    Last {config["50"].hideCount}-{config["100"].hideCount}{" "}
                    candles hidden
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                <div className="w-8 h-8 rounded-full bg-green-600/10 flex items-center justify-center text-green-600 font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">LONG vs SHORT</p>
                  <p className="text-sm text-muted-foreground">
                    If last close &gt; marked close ={" "}
                    <span className="text-green-500 font-medium">
                      LONG (price UP)
                    </span>
                    . If last close &lt; marked close ={" "}
                    <span className="text-red-500 font-medium">
                      SHORT (price DOWN)
                    </span>
                    .
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  5
                </div>
                <div>
                  <p className="font-medium">Track Score</p>
                  <p className="text-sm text-muted-foreground">
                    Your accuracy improves over time
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
