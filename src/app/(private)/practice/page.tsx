"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import eurUsdData from "@/db/EURUSD.json";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

function parseCandles(data: any[]): Candle[] {
  return data.map((item, index) => ({
    time: index,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
  }));
}

function Chart({ 
  candles,
  startIndex,
  endIndex
}: { 
  candles: Candle[];
  startIndex: number;
  endIndex: number;
}) {
  const displayCandles = candles.slice(startIndex, endIndex);
  
  if (displayCandles.length === 0) return null;
  
  const minLow = Math.min(...displayCandles.map(c => c.low));
  const maxHigh = Math.max(...displayCandles.map(c => c.high));
  const range = maxHigh - minLow || 1;
  const padding = range * 0.1;
  
  const width = 800;
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
        
        return (
          <g key={i}>
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
          </g>
        );
      })}
    </svg>
  );
}

export default function PracticePage() {
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [predictAtIndex, setPredictAtIndex] = useState<number | null>(null);
  const [step, setStep] = useState<"predict" | "result">("predict");
  const [prediction, setPrediction] = useState<"buy" | "sell" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  
  const startNewRound = useCallback(() => {
    const candles = parseCandles(eurUsdData.values as any[]);
    setAllCandles(candles);
    
    const maxStartIndex = candles.length - 50;
    const predictIndex = Math.floor(Math.random() * (maxStartIndex - 20)) + 20;
    setPredictAtIndex(predictIndex);
    setStep("predict");
    setPrediction(null);
  }, []);
  
  useEffect(() => {
    setMounted(true);
    startNewRound();
  }, [startNewRound]);
  
  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0 || predictAtIndex === null) return [];
    
    if (step === "predict") {
      return allCandles.slice(0, predictAtIndex + 1);
    }
    
    return allCandles.slice(0, predictAtIndex + 2);
  }, [allCandles, predictAtIndex, step]);
  
  const predictionCandle = predictAtIndex !== null ? allCandles[predictAtIndex] : null;
  const nextCandle = predictAtIndex !== null ? allCandles[predictAtIndex + 1] : null;
  
  const actualDirection = nextCandle && predictionCandle
    ? (nextCandle.close > predictionCandle.close ? "buy" : "sell")
    : null;
  
  const handlePredict = useCallback((direction: "buy" | "sell") => {
    if (!actualDirection) return;
    setPrediction(direction);
    setStep("result");
    setScore(prev => ({
      correct: prev.correct + (direction === actualDirection ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [actualDirection]);
  
  const handleNext = useCallback(() => {
    startNewRound();
  }, [startNewRound]);
  
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  
  if (!mounted || allCandles.length === 0) {
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
            <p className="text-muted-foreground">Predict the next candle direction</p>
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
                <CardDescription>5 Minute Chart - Predict the next candle</CardDescription>
              </div>
              <div className="text-right">
                {predictionCandle && (
                  <>
                    <div className="text-2xl font-mono font-bold">
                      {predictionCandle.close.toFixed(5)}
                    </div>
                    <div className={`text-sm ${predictionCandle.close >= predictionCandle.open ? "text-green-500" : "text-red-500"}`}>
                      {predictionCandle.close >= predictionCandle.open ? "+" : ""}
                      {((predictionCandle.close - predictionCandle.open) * 10000).toFixed(1)} pips
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 rounded-lg p-4">
              <Chart 
                candles={allCandles}
                startIndex={0}
                endIndex={step === "predict" ? predictAtIndex! + 1 : predictAtIndex! + 2}
              />
            </div>
            
            {step === "predict" && actualDirection && (
              <div className="mt-6 space-y-4">
                <p className="text-center text-muted-foreground">
                  Based on the chart, predict the next candle direction:
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => handlePredict("buy")}
                  >
                    <ArrowUp className="w-5 h-5" />
                    BUY
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => handlePredict("sell")}
                  >
                    <ArrowDown className="w-5 h-5" />
                    SELL
                  </Button>
                </div>
              </div>
            )}
            
            {step === "result" && actualDirection && nextCandle && (
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
                    The candle was{" "}
                    <span className="font-bold">
                      {actualDirection.toUpperCase()}
                    </span>
                    {" "}({((nextCandle.close - predictionCandle.close) * 10000).toFixed(1)} pips)
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleNext} 
                    className="gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Next Chart
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
              <li>EUR/USD 5-minute chart from real data</li>
              <li>Analyze the price pattern and trend</li>
              <li>Predict whether the next candle will be bullish (BUY) or bearish (SELL)</li>
              <li>See the full chart from your prediction point</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
