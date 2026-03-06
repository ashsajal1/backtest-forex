"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, RefreshCw, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import eurUsdData from "@/db/EURUSD.json";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  datetime: string;
}

function parseCandles(data: any[]): Candle[] {
  const filtered = data.filter(item => {
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

function Chart({ 
  candles,
  visibleCount,
  revealCount,
  markIndex
}: { 
  candles: Candle[];
  visibleCount: number;
  revealCount: number;
  markIndex: number;
  startTime?: string;
  endTime?: string;
}) {
  const displayCount = visibleCount + revealCount;
  const displayCandles = candles.slice(0, displayCount);
  
  if (displayCandles.length === 0) return null;
  
  const minLow = Math.min(...displayCandles.map(c => c.low));
  const maxHigh = Math.max(...displayCandles.map(c => c.high));
  const range = maxHigh - minLow || 1;
  const padding = range * 0.1;
  
  const width = 1200;
  const height = 400;
  const candleWidth = width / displayCandles.length;
  
  const scaleY = (value: number) => height - ((value - minLow + padding) / (range + padding * 2)) * height;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[400px]">
      {[0, 0.25, 0.5, 0.75, 1].map((pos) => (
        <line
          key={pos}
          x1={0}
          y1={pos * height}
          x2={width}
          y2={pos * height}
          stroke="#374151"
          strokeWidth={1}
        />
      ))}
      
      {displayCandles.map((candle, i) => {
        const x = i * candleWidth + candleWidth / 2;
        const isBullish = candle.close >= candle.open;
        const color = isBullish ? "#22c55e" : "#ef4444";
        
        const isHidden = i >= visibleCount;
        
        let opacity = 1;
        if (isHidden && revealCount > 0) {
          const revealProgress = i - visibleCount;
          opacity = revealProgress < revealCount ? (revealProgress + 1) / revealCount : 1;
        } else if (isHidden && revealCount === 0) {
          opacity = 0;
        }
        
        const isMarked = i === markIndex;
        
        return (
          <g key={i} style={{ opacity }}>
            <line
              x1={x}
              y1={scaleY(candle.high)}
              x2={x}
              y2={scaleY(candle.low)}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={i * candleWidth + 1}
              y={scaleY(Math.max(candle.open, candle.close))}
              width={Math.max(candleWidth - 2, 2)}
              height={Math.max(1, Math.abs(scaleY(candle.open) - scaleY(candle.close)))}
              fill={color}
            />
            {isMarked && (
              <line
                x1={i * candleWidth}
                y1={0}
                x2={i * candleWidth}
                y2={height}
                stroke="#fbbf24"
                strokeWidth={2}
              />
            )}
          </g>
        );
      })}
      
      {revealCount === 0 && (
        <line
          x1={visibleCount * candleWidth}
          y1={0}
          x2={visibleCount * candleWidth}
          y2={height}
          stroke="#fbbf24"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      )}
      
      {revealCount > 0 && (
        <rect
          x={visibleCount * candleWidth}
          y={0}
          width={revealCount * candleWidth}
          height={height}
          fill="#fbbf24"
          fillOpacity={0.1}
          stroke="#fbbf24"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}
      
      <text x="5" y="15" fill="#9ca3af" fontSize="10">{displayCandles[0]?.datetime || "-"}</text>
      <text x={width - 100} y="15" fill="#9ca3af" fontSize="10">{displayCandles[displayCandles.length - 1]?.datetime || "-"}</text>
    </svg>
  );
}

interface PracticeGameProps {
  totalCandles: number;
  predictionIndex: number;
  hideCount: number;
  score: { correct: number; total: number };
  setScore: React.Dispatch<React.SetStateAction<{ correct: number; total: number }>>;
  allCandles: Candle[];
  startIndex: number;
  onNext: () => void;
  gameKey: number;
}

function PracticeGame({
  totalCandles,
  predictionIndex,
  hideCount,
  score,
  setScore,
  allCandles,
  startIndex,
  onNext,
  gameKey,
}: PracticeGameProps) {
  const [revealCount, setRevealCount] = useState(0);
  const [step, setStep] = useState<"predict" | "result">("predict");
  const [prediction, setPrediction] = useState<"buy" | "sell" | null>(null);
  const [revealTimeout, setRevealTimeout] = useState<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    setRevealCount(0);
    setStep("predict");
    setPrediction(null);
  }, [gameKey]);
  
  useEffect(() => {
    return () => {
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [revealTimeout]);
  
  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    return allCandles.slice(startIndex, startIndex + totalCandles + hideCount);
  }, [allCandles, startIndex, totalCandles, hideCount]);
  
  const markedCandle = visibleCandles[predictionIndex];
  const lastCandle = visibleCandles[totalCandles - 1];
  
  const actualDirection = markedCandle && lastCandle
    ? (lastCandle.close > markedCandle.close ? "buy" : "sell")
    : null;
  
  const priceChange = markedCandle && lastCandle
    ? ((lastCandle.close - markedCandle.close) * 10000).toFixed(1)
    : null;
  
  const handlePredict = useCallback((direction: "buy" | "sell") => {
    if (!actualDirection) return;
    setPrediction(direction);
    setStep("result");
    setScore(prev => ({
      correct: prev.correct + (direction === actualDirection ? 1 : 0),
      total: prev.total + 1,
    }));
    
    let reveal = 0;
    const revealNext = () => {
      reveal++;
      setRevealCount(reveal);
      if (reveal < hideCount) {
        const timeout = setTimeout(revealNext, 50);
        setRevealTimeout(timeout);
      }
    };
    
    const timeout = setTimeout(revealNext, 50);
    setRevealTimeout(timeout);
  }, [actualDirection, hideCount, setScore]);
  
  const handleSkip = useCallback(() => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
    setRevealCount(hideCount);
  }, [hideCount, revealTimeout]);
  
  const handleNext = useCallback(() => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
    onNext();
  }, [onNext, revealTimeout]);
  
  if (visibleCandles.length === 0) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {markedCandle && (
            <>
              <div className="text-lg font-mono">
                Marked: {markedCandle.close.toFixed(5)}
              </div>
              <div className="text-xs text-yellow-500">
                @ candle #{predictionIndex + 1} ({markedCandle.datetime})
              </div>
            </>
          )}
        </div>
        <div className="text-right">
          {lastCandle && step === "result" && (
            <>
              <div className="text-lg font-mono">
                Last: {lastCandle.close.toFixed(5)}
              </div>
              <div className="text-xs text-muted-foreground">
                @ candle #{totalCandles} ({lastCandle.datetime})
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-muted/20 rounded-lg p-4">
        <Chart 
          candles={visibleCandles}
          visibleCount={predictionIndex + 1}
          revealCount={revealCount}
          markIndex={predictionIndex}
        />
      </div>
      
      {step === "predict" && actualDirection && (
        <div className="mt-6 space-y-4">
          <p className="text-center text-muted-foreground">
            Compare candle #{predictionIndex + 1} ({markedCandle?.close.toFixed(5)}) with candle #{totalCandles}
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => handlePredict("buy")}
            >
              <ArrowUp className="w-5 h-5" />
              LONG
            </Button>
            <Button
              size="lg"
              className="gap-2 bg-red-600 hover:bg-red-700"
              onClick={() => handlePredict("sell")}
            >
              <ArrowDown className="w-5 h-5" />
              SHORT
            </Button>
          </div>
        </div>
      )}
      
      {step === "result" && (
        <div className="mt-6 space-y-4">
          <div className={`text-center p-4 rounded-lg ${
            prediction === actualDirection 
              ? "bg-green-500/20 text-green-500" 
              : "bg-red-500/20 text-red-500"
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {prediction === actualDirection ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
              <span className="text-xl font-bold">
                {prediction === actualDirection ? "Correct!" : "Wrong!"}
              </span>
            </div>
            <p className="text-sm">
              {markedCandle?.close.toFixed(5)} → {lastCandle?.close.toFixed(5)} = {priceChange} pips<br/>
              <span className="font-bold">{actualDirection?.toUpperCase()}</span> ({actualDirection === "buy" ? "price UP" : "price DOWN"})
            </p>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button 
              size="lg" 
              onClick={handleSkip}
              variant="outline"
              disabled={revealCount >= hideCount}
            >
              Skip
            </Button>
            <Button 
              size="lg" 
              onClick={handleNext}
              className="gap-2"
            >
              <ChevronRight className="w-5 h-5" />
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
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
    const candles = parseCandles(eurUsdData.values as any[]);
    setAllCandles(candles);
    
    const maxStart50 = candles.length - 50 - 10 - 1;
    const maxStart100 = candles.length - 100 - 20 - 1;
    const maxStart200 = candles.length - 200 - 20 - 1;
    
    setStartIndex50(Math.floor(Math.random() * Math.max(1, maxStart50)));
    setStartIndex100(Math.floor(Math.random() * Math.max(1, maxStart100)));
    setStartIndex200(Math.floor(Math.random() * Math.max(1, maxStart200)));
    
    setMounted(true);
  }, []);
  
  const accuracy50 = score50.total > 0 ? Math.round((score50.correct / score50.total) * 100) : 0;
  const accuracy100 = score100.total > 0 ? Math.round((score100.correct / score100.total) * 100) : 0;
  const accuracy200 = score200.total > 0 ? Math.round((score200.correct / score200.total) * 100) : 0;
  
  const advance50 = useCallback(() => {
    setStartIndex50(prev => {
      const maxStart = allCandles.length - 50 - 10 - 1;
      const next = prev + 50;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKey50(k => k + 1);
  }, [allCandles.length]);
  
  const advance100 = useCallback(() => {
    setStartIndex100(prev => {
      const maxStart = allCandles.length - 100 - 20 - 1;
      const next = prev + 100;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKey100(k => k + 1);
  }, [allCandles.length]);
  
  const advance200 = useCallback(() => {
    setStartIndex200(prev => {
      const maxStart = allCandles.length - 200 - 20 - 1;
      const next = prev + 200;
      if (next > maxStart) {
        return Math.floor(Math.random() * Math.max(1, maxStart));
      }
      return next;
    });
    setGameKey200(k => k + 1);
  }, [allCandles.length]);
  
  if (!mounted || allCandles.length === 0) {
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
            <h1 className="text-3xl font-bold">Forex Practice</h1>
            <p className="text-muted-foreground">Compare marked candle with last candle</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Card className="px-3 py-1 text-xs">
              <span className="text-muted-foreground">50:</span> <span className="font-bold">{score50.correct}/{score50.total}</span> <span className="text-muted-foreground">({accuracy50}%)</span>
            </Card>
            <Card className="px-3 py-1 text-xs">
              <span className="text-muted-foreground">100:</span> <span className="font-bold">{score100.correct}/{score100.total}</span> <span className="text-muted-foreground">({accuracy100}%)</span>
            </Card>
            <Card className="px-3 py-1 text-xs">
              <span className="text-muted-foreground">200:</span> <span className="font-bold">{score200.correct}/{score200.total}</span> <span className="text-muted-foreground">({accuracy200}%)</span>
            </Card>
          </div>
        </div>
        
        <Tabs defaultValue="50" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="50">50 Candles</TabsTrigger>
            <TabsTrigger value="100">100 Candles</TabsTrigger>
            <TabsTrigger value="200">200 Candles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="50">
            <Card>
              <CardHeader>
                <CardTitle>EUR/USD - 50 Candles</CardTitle>
                <CardDescription>
                  Compare candle #{config["50"].predictionIndex + 1} with candle #{config["50"].total}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="100">
            <Card>
              <CardHeader>
                <CardTitle>EUR/USD - 100 Candles</CardTitle>
                <CardDescription>
                  Compare candle #{config["100"].predictionIndex + 1} with candle #{config["100"].total}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="200">
            <Card>
              <CardHeader>
                <CardTitle>EUR/USD - 200 Candles</CardTitle>
                <CardDescription>
                  Compare candle #{config["200"].predictionIndex + 1} with candle #{config["200"].total}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Choose candle count: 50, 100, or 200</li>
              <li>Yellow line marks candle #{config["50"].predictionIndex + 1}, {config["100"].predictionIndex + 1}, or {config["200"].predictionIndex + 1}</li>
              <li>Last 10-20 candles are hidden</li>
              <li>If last close &gt; marked close = LONG (price went UP)</li>
              <li>If last close &lt; marked close = SHORT (price went DOWN)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
