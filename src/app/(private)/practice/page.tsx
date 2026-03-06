"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, RefreshCw, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const FOREX_PAIRS = [
  { label: "EUR/USD", pips: 10000, basePrice: 1.0850 },
  { label: "GBP/USD", pips: 10000, basePrice: 1.2650 },
  { label: "USD/JPY", basePrice: 149.50, pips: 100 },
  { label: "AUD/USD", pips: 10000, basePrice: 0.6550 },
  { label: "USD/CAD", pips: 10000, basePrice: 1.3650 },
];

function generateCandles(pair: typeof FOREX_PAIRS[0], count: number = 100): Candle[] {
  const candles: Candle[] = [];
  let price = pair.basePrice + (Math.random() - 0.5) * 0.01;
  const now = Date.now();
  const volatility = pair.pips === 100 ? 0.01 : 0.0001;
  
  for (let i = 0; i < count; i++) {
    const trend = i > count * 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    const change = (Math.random() * volatility * 2 - volatility) + (trend * volatility * 0.5);
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    
    candles.push({
      time: now - (count - i) * 5 * 60 * 1000,
      open,
      high,
      low,
      close,
    });
    
    price = close;
  }
  
  return candles;
}

function ForexChart({ 
  candles,
  highlightFrom 
}: { 
  candles: Candle[];
  highlightFrom?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  
  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    
    const initChart = async () => {
      const { createChart } = await import("lightweight-charts");
      
      if (chartRef.current) {
        chartRef.current.remove();
      }
    
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 350,
        layout: {
          background: { color: "transparent" },
          textColor: "#9ca3af",
        },
        grid: {
          vertLines: { color: "#374151" },
          horzLines: { color: "#374151" },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: "#374151",
        },
        timeScale: {
          borderColor: "#374151",
          timeVisible: true,
        },
      });
      
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      
      chartRef.current = chart;
      
      const chartData = candles.map(c => ({
        time: c.time / 1000 as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      
      candlestickSeries.setData(chartData);
      chart.timeScale().fitContent();
    };
    
    initChart();
    
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, highlightFrom]);
  
  return <div ref={containerRef} className="w-full h-[350px]" />;
}

export default function PracticePage() {
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [pair, setPair] = useState(FOREX_PAIRS[0]);
  const [predictAtIndex, setPredictAtIndex] = useState<number | null>(null);
  const [step, setStep] = useState<"predict" | "result">("predict");
  const [prediction, setPrediction] = useState<"buy" | "sell" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  
  const startNewRound = useCallback(() => {
    const newPair = FOREX_PAIRS[Math.floor(Math.random() * FOREX_PAIRS.length)];
    setPair(newPair);
    const candles = generateCandles(newPair, 100);
    setAllCandles(candles);
    
    const predictIndex = 40 + Math.floor(Math.random() * 20);
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
                <CardTitle className="text-2xl">{pair.label}</CardTitle>
                <CardDescription>5 Minute Chart - Predict the next candle</CardDescription>
              </div>
              <div className="text-right">
                {predictionCandle && (
                  <>
                    <div className="text-2xl font-mono font-bold">
                      {predictionCandle.close.toFixed(pair.pips === 100 ? 2 : 5)}
                    </div>
                    <div className={`text-sm ${predictionCandle.close >= predictionCandle.open ? "text-green-500" : "text-red-500"}`}>
                      {predictionCandle.close >= predictionCandle.open ? "+" : ""}
                      {((predictionCandle.close - predictionCandle.open) * pair.pips).toFixed(1)} pips
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 rounded-lg p-2">
              <ForexChart 
                candles={visibleCandles}
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
                    {" "}({((nextCandle.close - predictionCandle.close) * pair.pips).toFixed(1)} pips)
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
              <li>A random forex pair chart is displayed</li>
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
