"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const reversed = [...data].reverse();
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
}) {
  const displayCount = visibleCount + revealCount;
  const displayCandles = candles.slice(0, displayCount);
  
  if (displayCandles.length === 0) return null;
  
  const minLow = Math.min(...displayCandles.map(c => c.low));
  const maxHigh = Math.max(...displayCandles.map(c => c.high));
  const range = maxHigh - minLow || 1;
  const padding = range * 0.1;
  
  const width = 900;
  const height = 300;
  const candleWidth = width / displayCandles.length;
  
  const scaleY = (value: number) => height - ((value - minLow + padding) / (range + padding * 2)) * height;
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[300px]">
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
        const isRevealed = isHidden && i < visibleCount + revealCount;
        
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
    </svg>
  );
}

export default function PracticePage() {
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [revealCount, setRevealCount] = useState(0);
  const [step, setStep] = useState<"predict" | "result">("predict");
  const [prediction, setPrediction] = useState<"buy" | "sell" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const [revealTimeout, setRevealTimeout] = useState<NodeJS.Timeout | null>(null);
  const initialized = useRef(false);
  
  const totalCandles = 50;
  const predictionIndex = 39;
  const hideCount = 10;
  
  const startNewRound = useCallback((useNextStart: boolean = false) => {
    const candles = parseCandles(eurUsdData.values as any[]);
    setAllCandles(candles);
    
    if (useNextStart) {
      setStartIndex(prev => {
        const maxStart = candles.length - totalCandles - hideCount - 1;
        return Math.min(prev + totalCandles, maxStart);
      });
    } else {
      const maxStart = candles.length - totalCandles - hideCount - 1;
      const newStart = Math.floor(Math.random() * Math.max(1, maxStart));
      setStartIndex(newStart);
    }
    
    setRevealCount(0);
    setStep("predict");
    setPrediction(null);
    
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
  }, [revealTimeout]);
  
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMounted(true);
      startNewRound();
    }
  }, [startNewRound]);
  
  useEffect(() => {
    return () => {
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [revealTimeout]);
  
  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    return allCandles.slice(startIndex, startIndex + totalCandles + hideCount);
  }, [allCandles, startIndex]);
  
  const predictionCandle = visibleCandles[predictionIndex];
  const lastCandle = visibleCandles[visibleCandles.length - 1];
  
  const actualDirection = predictionCandle && lastCandle
    ? (lastCandle.close > predictionCandle.close ? "buy" : "sell")
    : null;
  
  const priceChange = predictionCandle && lastCandle
    ? ((lastCandle.close - predictionCandle.close) * 10000).toFixed(1)
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
        const timeout = setTimeout(revealNext, 80);
        setRevealTimeout(timeout);
      }
    };
    
    const timeout = setTimeout(revealNext, 80);
    setRevealTimeout(timeout);
  }, [actualDirection, hideCount]);
  
  const handleNext = useCallback(() => {
    startNewRound(true);
  }, [startNewRound]);
  
  const handleSkip = useCallback(() => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
    setRevealCount(hideCount);
  }, [hideCount, revealTimeout]);
  
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  
  if (!mounted || visibleCandles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Forex Practice</h1>
            <p className="text-muted-foreground">Predict price direction from marked candle</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Card className="px-4 py-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{score.correct}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{score.total - score.correct}</span>
                </div>
                <div className="text-muted-foreground">
                  {accuracy}%
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">EUR/USD</CardTitle>
                <CardDescription>
                  {predictionIndex + 1} candles shown • {hideCount} candles hidden • Yellow line = prediction point
                </CardDescription>
              </div>
              <div className="text-right">
                {predictionCandle && (
                  <>
                    <div className="text-2xl font-mono font-bold">
                      {predictionCandle.close.toFixed(5)}
                    </div>
                    <div className="text-sm text-yellow-500">
                      @ candle #{predictionIndex + 1}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  Will price go UP or DOWN from the yellow line? ({hideCount} candles / {hideCount * 5} min)
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => handlePredict("buy")}
                  >
                    <ArrowUp className="w-5 h-5" />
                    LONG (UP)
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => handlePredict("sell")}
                  >
                    <ArrowDown className="w-5 h-5" />
                    SHORT (DOWN)
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
                  <p>
                    Price went <span className="font-bold">{actualDirection?.toUpperCase()}</span> ({priceChange} pips)
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
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>50 candles shown, yellow line marks candle #40</li>
              <li>Last 10 candles are hidden</li>
              <li>Predict: will price go UP (LONG) or DOWN (SHORT)?</li>
              <li>If 40th close {'<'} 50th close = LONG</li>
              <li>If 40th close {'>'} 50th close = SHORT</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
