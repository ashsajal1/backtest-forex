"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
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

const FOREX_PAIRS = [
  { label: "EUR/USD", pips: 10000, data: eurUsdData.values as any[] },
];

function parseCandles(data: any[]): Candle[] {
  const startTime = Date.now() - data.length * 5 * 60 * 1000;
  return data.map((item, index) => ({
    time: startTime + index * 5 * 60 * 1000,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
  }));
}

function ForexChart({ 
  candles, 
  showFull 
}: { 
  candles: Candle[]; 
  showFull: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  
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
      seriesRef.current = candlestickSeries;
      
      const visibleCandles = showFull ? candles : candles.slice(0, Math.floor(candles.length / 2));
      candlestickSeries.setData(visibleCandles);
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
  }, [candles, showFull]);
  
  return <div ref={containerRef} className="w-full h-[350px]" />;
}

export default function PracticePage() {
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(50);
  const [step, setStep] = useState<"predict" | "result">("predict");
  const [prediction, setPrediction] = useState<"buy" | "sell" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const candles = parseCandles(FOREX_PAIRS[0].data);
    setAllCandles(candles);
    setMounted(true);
  }, []);
  
  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    return allCandles.slice(0, currentIndex + 1);
  }, [allCandles, currentIndex]);
  
  const lastCandle = visibleCandles[visibleCandles.length - 1];
  const secondLastCandle = visibleCandles[visibleCandles.length - 2];
  
  const actualDirection = lastCandle && secondLastCandle 
    ? (lastCandle.close > secondLastCandle.close ? "buy" : "sell")
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
    setCurrentIndex(prev => Math.min(prev + 1, allCandles.length - 1));
    setStep("predict");
    setPrediction(null);
  }, [allCandles.length]);
  
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  
  if (!mounted || allCandles.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <p>Loading chart data...</p>
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
                  {accuracy}% accuracy
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
                {lastCandle && (
                  <>
                    <div className="text-2xl font-mono font-bold">
                      {lastCandle.close.toFixed(5)}
                    </div>
                    <div className={`text-sm ${lastCandle.close >= lastCandle.open ? "text-green-500" : "text-red-500"}`}>
                      {lastCandle.close >= lastCandle.open ? "+" : ""}
                      {((lastCandle.close - lastCandle.open) * 10000).toFixed(1)} pips
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
                showFull={step === "result"}
              />
            </div>
            
            {step === "predict" && actualDirection && (
              <div className="mt-6 space-y-4">
                <p className="text-center text-muted-foreground">
                  Based on the chart pattern, predict the next 5-minute candle:
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
            
            {step === "result" && actualDirection && (
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
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleNext} 
                    className="gap-2"
                    disabled={currentIndex >= allCandles.length - 1}
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
              <li>A EUR/USD 5-minute chart is displayed (50% visible)</li>
              <li>Analyze the price pattern and trend</li>
              <li>Predict whether the next candle will be bullish (BUY) or bearish (SELL)</li>
              <li>See if you were correct and learn from each prediction</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
