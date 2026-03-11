"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, TrendingUp, Wallet, TrendingDown, CheckCircle, XCircle, ChevronRight, Target } from "lucide-react";
import Link from "next/link";
import eurUsdData from "@/db/EURUSD.json";
import xauUsdData from "@/db/XAUUSD.json";
import { parseCandles, Candle, detectStructure, detectAllPullbacks, StructureData, PullbackData as PullbackDataType } from "@/components/practice/structure";
import Chart from "@/components/practice/chart";
import DrawingToolbar from "@/components/practice/drawing-toolbar";
import { Drawing, DrawingTool, Trendline, Point } from "@/components/practice/drawings";

interface PullbackData {
  trend: "bullish" | "bearish";
  swingIndex: number;
  pullbackIndex: number;
  trendlineStart: { index: number; price: number };
  trendlineEnd: { index: number; price: number };
}

export default function PullbackPage() {
  const [currency, setCurrency] = useState<"EUR/USD" | "XAU/USD">("EUR/USD");
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [startIndex50, setStartIndex50] = useState(0);
  const [startIndex100, setStartIndex100] = useState(0);
  const [startIndex200, setStartIndex200] = useState(0);
  const [gameKey50, setGameKey50] = useState(0);
  const [gameKey100, setGameKey100] = useState(0);
  const [gameKey200, setGameKey200] = useState(0);
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

    setGameKey50(0);
    setGameKey100(0);
    setGameKey200(0);

    setMounted(true);
  }, [currency]);

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
                  <CardTitle>Pullback Practice</CardTitle>
                  <CardDescription>Mark all pullbacks and compare with actual</CardDescription>
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

              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium text-sm transition-colors"
              >
                <TrendingDown className="w-4 h-4" />
                Regular Practice
              </Link>

              <Link
                href="/trade"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Trade
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="50" className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  <div className="text-center px-4 py-2 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className="text-lg font-bold">50 / 100 / 200</p>
                  </div>
                </div>

                <TabsList>
                  <TabsTrigger value="50">50</TabsTrigger>
                  <TabsTrigger value="100">100</TabsTrigger>
                  <TabsTrigger value="200">200</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="50" className="mt-0">
                <PullbackGame
                  totalCandles={config["50"].total}
                  predictionIndex={config["50"].predictionIndex}
                  hideCount={config["50"].hideCount}
                  allCandles={allCandles}
                  startIndex={startIndex50}
                  onNext={advance50}
                  gameKey={gameKey50}
                />
              </TabsContent>

              <TabsContent value="100" className="mt-0">
                <PullbackGame
                  totalCandles={config["100"].total}
                  predictionIndex={config["100"].predictionIndex}
                  hideCount={config["100"].hideCount}
                  allCandles={allCandles}
                  startIndex={startIndex100}
                  onNext={advance100}
                  gameKey={gameKey100}
                />
              </TabsContent>

              <TabsContent value="200" className="mt-0">
                <PullbackGame
                  totalCandles={config["200"].total}
                  predictionIndex={config["200"].predictionIndex}
                  hideCount={config["200"].hideCount}
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
                  <p className="font-medium">Identify Swings</p>
                  <p className="text-sm text-muted-foreground">
                    Look for HH/HL (bullish) or LH/LL (bearish) structure
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Mark Pullbacks</p>
                  <p className="text-sm text-muted-foreground">
                    Use trendline tool to mark pullback zones (click 3 points per trendline)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Auto-Snap</p>
                  <p className="text-sm text-muted-foreground">
                    Points snap to candle highs/lows based on trend direction
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 md:col-span-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium">Reveal &amp; Compare</p>
                  <p className="text-sm text-muted-foreground">
                    Click &quot;Reveal Actual&quot; to see all real pullbacks and compare
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

interface PullbackGameProps {
  totalCandles: number;
  predictionIndex: number;
  hideCount: number;
  allCandles: Candle[];
  startIndex: number;
  onNext: () => void;
  gameKey: number;
}

function PullbackGame({
  totalCandles,
  predictionIndex,
  hideCount,
  allCandles,
  startIndex,
  onNext,
  gameKey,
}: PullbackGameProps) {
  const [revealCount, setRevealCount] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [activeTool, setActiveTool] = useState<DrawingTool>("trendline");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [structureData, setStructureData] = useState<StructureData | null>(null);
  const [allPullbacks, setAllPullbacks] = useState<PullbackDataType[]>([]);

  const visibleCandles = useMemo(() =>
    allCandles.slice(
      startIndex,
      startIndex + totalCandles + hideCount
    ),
    [allCandles, startIndex, totalCandles, hideCount]
  );

  // Detect all pullbacks on mount
  useEffect(() => {
    if (visibleCandles.length > 0) {
      const structure = detectStructure(visibleCandles);
      setStructureData(structure);
      const pullbacks = detectAllPullbacks(visibleCandles, structure);
      setAllPullbacks(pullbacks);
    }
  }, [visibleCandles]);

  // Reset on gameKey change
  useEffect(() => {
    setRevealCount(0);
    setRevealed(false);
    setDrawings([]);
    setActiveTool("trendline");
  }, [gameKey]);

  // Auto-snap trendline points to candle high/low based on trend direction
  const snapToCandleExtreme = useCallback((points: Point[], candles: Candle[], trend: "bullish" | "bearish"): Point[] => {
    return points.map((point) => {
      const candleIndex = point.candleIndex;
      if (candleIndex === undefined || candleIndex < 0 || candleIndex >= candles.length) {
        return point;
      }

      const candle = candles[candleIndex];
      // For bearish trend (pullback from high), snap to candle high
      // For bullish trend (pullback from low), snap to candle low
      const snappedPrice = trend === "bearish" ? candle.high : candle.low;

      return {
        ...point,
        price: snappedPrice,
      };
    });
  }, []);

  const handleAddDrawing = useCallback((drawing: Drawing) => {
    if (drawing.type === "trendline") {
      // Find the closest pullback to snap to
      if (drawing.points.length >= 2) {
        const avgIndex = drawing.points.reduce((sum, p) => sum + (p.candleIndex || 0), 0) / drawing.points.length;
        
        // Find closest pullback by candle index
        let closestPullback: PullbackDataType | null = null;
        let minDistance = Infinity;
        
        for (const pullback of allPullbacks) {
          const midIndex = (pullback.trendlineStart.index + pullback.trendlineEnd.index) / 2;
          const distance = Math.abs(midIndex - avgIndex);
          if (distance < minDistance) {
            minDistance = distance;
            closestPullback = pullback;
          }
        }
        
        // Snap to the closest pullback's trend direction
        if (closestPullback) {
          const snappedPoints = snapToCandleExtreme(drawing.points, visibleCandles, closestPullback.trend);
          const snappedTrendline: Trendline = {
            ...drawing,
            points: snappedPoints,
          };
          setDrawings((prev) => [...prev, snappedTrendline]);
          return;
        }
      }
      
      setDrawings((prev) => [...prev, drawing]);
    } else {
      setDrawings((prev) => [...prev, drawing]);
    }
  }, [allPullbacks, visibleCandles, snapToCandleExtreme]);

  const handleClearDrawings = useCallback(() => {
    setDrawings([]);
  }, []);

  const handleClearUserDrawings = useCallback(() => {
    setDrawings([]);
  }, []);

  const handleReveal = useCallback(() => {
    setRevealed(true);
    // Reveal hidden candles
    let reveal = 0;
    const revealNext = () => {
      reveal++;
      setRevealCount(reveal);
      if (reveal < hideCount) {
        const timeout = setTimeout(revealNext, 50);
      }
    };
    revealNext();
  }, [hideCount]);

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  const markedCandle = visibleCandles[predictionIndex];

  if (visibleCandles.length === 0) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // Separate user drawings from actual pullback drawings
  const userDrawings = drawings;
  const actualPullbackDrawings: Trendline[] = revealed
    ? allPullbacks.map((pullback, idx) => ({
        id: `actual-${idx}`,
        type: "trendline" as const,
        points: [
          {
            x: 0,
            y: 0,
            price: pullback.trendlineStart.price,
            candleIndex: pullback.trendlineStart.index,
          },
          {
            x: 0,
            y: 0,
            price: pullback.trendlineEnd.price,
            candleIndex: pullback.trendlineEnd.index,
          },
        ],
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {revealed
                ? `Found ${allPullbacks.length} pullbacks. Compare your markings!`
                : "Mark all pullbacks you can find"}
            </p>
            <div className="text-xs text-muted-foreground mt-1">
              Tool: <span className="font-medium text-blue-500">Trendline (T)</span>
              {allPullbacks.length > 0 && !revealed && (
                <span className="ml-2 text-muted-foreground">
                  | Detected: {allPullbacks.length} pullbacks
                </span>
              )}
            </div>
          </div>
        </div>
        {markedCandle && (
          <div className="text-right">
            <div className="text-lg font-mono font-semibold">
              Marked:{" "}
              <span className="text-yellow-500">
                {markedCandle.close.toFixed(5)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              #{predictionIndex + 1} ({markedCandle.datetime})
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="bg-muted/20 rounded-lg p-2 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onClearDrawings={handleClearUserDrawings}
                hasDrawings={drawings.length > 0}
              />
            </div>
            <Chart
              candles={visibleCandles}
              visibleCount={predictionIndex + 1}
              revealCount={revealCount}
              markIndex={predictionIndex}
              structureData={structureData || undefined}
              activeTool={activeTool}
              drawings={[...userDrawings, ...actualPullbackDrawings]}
              onAddDrawing={handleAddDrawing}
              gameKey={gameKey}
              showActualPullbacks={revealed}
            />
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-3">
          <div className="space-y-3">
            {!revealed ? (
              <Button
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 h-12 text-base"
                onClick={handleReveal}
              >
                <Target className="w-5 h-5" />
                Reveal Actual Pullbacks
              </Button>
            ) : (
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 h-12 text-base"
                onClick={handleNext}
              >
                Next Round
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            )}

            <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-500 font-medium">
                ✨ Auto-snap enabled
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Points snap to candle highs/lows
              </p>
            </div>

            {revealed && allPullbacks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Detected Pullbacks</p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allPullbacks.map((pullback, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-muted/50 border border-muted text-xs"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={pullback.trend === "bullish" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {pullback.trend === "bullish" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {pullback.trend.toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="text-muted-foreground space-y-0.5">
                        <p>Start: #{pullback.trendlineStart.index + 1} @ {pullback.trendlineStart.price.toFixed(5)}</p>
                        <p>End: #{pullback.trendlineEnd.index + 1} @ {pullback.trendlineEnd.price.toFixed(5)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drawings.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Your Markings</p>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {drawings.filter(d => d.type === "trendline").map((drawing, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs"
                    >
                      <p className="text-blue-500 font-medium">Trendline #{idx + 1}</p>
                      {drawing.points.length >= 2 && (
                        <div className="text-muted-foreground space-y-0.5 mt-1">
                          <p>Start: #{(drawing.points[0].candleIndex || 0) + 1} @ {drawing.points[0].price?.toFixed(5)}</p>
                          <p>End: #{(drawing.points[drawing.points.length - 1].candleIndex || 0) + 1} @ {drawing.points[drawing.points.length - 1].price?.toFixed(5)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-blue-500"></div>
                <span>Your markings</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-0.5 bg-gray-400 border-t border-dashed"></div>
                <span>Actual pullbacks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
