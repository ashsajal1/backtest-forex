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
  revealIndex
}: { 
  candles: Candle[];
  visibleCount: number;
  revealIndex: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const displayCandles = candles.slice(0, visibleCount + revealIndex);
  
  if (displayCandles.length === 0) return null;
  
  const minLow = Math.min(...displayCandles.map(c => c.low));
  const maxHigh = Math.max(...displayCandles.map(c => c.high));
  const range = maxHigh - minLow || 1;
  const padding = range * 0.1;
  
  const width = 900;
  const height = 300;
  
  // Time-based positioning
  const timeValues = displayCandles.map(c => new Date(c.datetime).getTime());
  const minTime = Math.min(...timeValues);
  const maxTime = Math.max(...timeValues);
  const timeRange = maxTime - minTime || 1;
  
  const scaleX = (time: number) => ((time - minTime) / timeRange) * width;
  const scaleY = (value: number) => height - ((value - minLow + padding) / (range + padding * 2)) * height;
  
  const candleWidth = Math.max(4, (width / displayCandles.length) * 0.6);
  
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
        const candleTime = new Date(candle.datetime).getTime();
        const x = scaleX(candleTime);
        const isBullish = candle.close >= candle.open;
        const color = isBullish ? "#22c55e" : "#ef4444";
        
        const isRevealing = i >= visibleCount && revealIndex > 0;
        
        const handleMouseEnter = (e: React.MouseEvent) => {
          setHoveredIndex(i);
          const rect = (e.target as Element).closest('svg')?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        };
        
        const handleMouseMove = (e: React.MouseEvent) => {
          const rect = (e.target as Element).closest('svg')?.getBoundingClientRect();
          if (rect) {
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        };
        
        const handleMouseLeave = () => {
          setHoveredIndex(null);
        };
        
        return (
          <g key={i} style={{
            opacity: isRevealing ? Math.min(1, (revealIndex - (i - visibleCount)) / 3) : 1,
            transition: 'opacity 0.3s ease-out',
            cursor: 'pointer'
          }}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          >
            <line
              x1={x}
              y1={scaleY(candle.high)}
              x2={x}
              y2={scaleY(candle.low)}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={x - candleWidth / 2}
              y={scaleY(Math.max(candle.open, candle.close))}
              width={Math.max(candleWidth - 2, 2)}
              height={Math.max(1, Math.abs(scaleY(candle.open) - scaleY(candle.close)))}
              fill={color}
            />
          </g>
        );
      })}
      
      {(revealIndex === 0 || revealIndex > 0) && displayCandles.length > 0 && (
        <g>
          <line
            x1={scaleX(new Date(displayCandles[Math.min(77, displayCandles.length - 1)].datetime).getTime())}
            y1={0}
            x2={scaleX(new Date(displayCandles[Math.min(77, displayCandles.length - 1)].datetime).getTime())}
            y2={height}
            stroke="#fbbf24"
            strokeWidth={3}
            strokeDasharray="8,4"
          />
          <rect
            x={scaleX(new Date(displayCandles[Math.min(77, displayCandles.length - 1)].datetime).getTime()) - 60}
            y={10}
            width={120}
            height={24}
            rx={4}
            fill="#fbbf24"
          />
          <text
            x={scaleX(new Date(displayCandles[Math.min(77, displayCandles.length - 1)].datetime).getTime())}
            y={26}
            textAnchor="middle"
            fill="#000"
            fontSize={12}
            fontWeight="bold"
          >
            Prediction Start
          </text>
        </g>
      )}
      
      {revealIndex > 0 && (
        <rect
          x={scaleX(new Date(displayCandles[Math.max(0, visibleCount - revealIndex)]?.datetime || displayCandles[0].datetime).getTime())}
          y={0}
          width={scaleX(new Date(displayCandles[Math.min(displayCandles.length - 1, visibleCount + revealIndex - 1)]?.datetime || displayCandles[displayCandles.length - 1].datetime).getTime()) - scaleX(new Date(displayCandles[Math.max(0, visibleCount - revealIndex)]?.datetime || displayCandles[0].datetime).getTime())}
          height={height}
          fill="#fbbf24"
          fillOpacity={0.1}
          stroke="#fbbf24"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      )}
      
      {hoveredIndex !== null && displayCandles[hoveredIndex] && (
        <g>
          <rect
            x={tooltipPos.x + 10}
            y={tooltipPos.y - 35}
            width={140}
            height={30}
            rx={4}
            fill="#1f2937"
            stroke="#374151"
            strokeWidth={1}
          />
          <text
            x={tooltipPos.x + 80}
            y={tooltipPos.y - 15}
            textAnchor="middle"
            fill="#fff"
            fontSize={11}
            fontWeight="bold"
          >
            {displayCandles[hoveredIndex].datetime}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function PracticePage() {
  const [allCandles, setAllCandles] = useState<Candle[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [showCount, setShowCount] = useState(100);
  const [hideCount, setHideCount] = useState(30);
  const [revealIndex, setRevealIndex] = useState(0);
  const [step, setStep] = useState<"predict" | "result">("predict");
  const [prediction, setPrediction] = useState<"buy" | "sell" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mounted, setMounted] = useState(false);
  const initialized = useRef(false);
  const [revealTimeout, setRevealTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const startNewRound = useCallback((useNextStart: boolean = false) => {
    const candles = parseCandles(eurUsdData.values as any[]);
    setAllCandles(candles);
    
    if (useNextStart && showCount + hideCount < candles.length) {
      setStartIndex(prev => Math.min(prev + showCount, candles.length - showCount - hideCount));
    } else {
      const maxStart = candles.length - showCount - hideCount - 1;
      const newStart = Math.floor(Math.random() * Math.max(1, maxStart));
      setStartIndex(newStart);
    }
    
    setRevealIndex(0);
    setStep("predict");
    setPrediction(null);
    
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
  }, [showCount, hideCount, revealTimeout]);
  
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
    return allCandles.slice(startIndex, startIndex + showCount + hideCount);
  }, [allCandles, startIndex, showCount, hideCount]);
  
  const visibleCount = showCount;
  
  const lastVisibleCandle = visibleCandles[visibleCount - 1];
  const firstHiddenCandle = visibleCandles[visibleCount];
  
  const actualDirection = firstHiddenCandle && lastVisibleCandle
    ? (firstHiddenCandle.close > lastVisibleCandle.close ? "buy" : "sell")
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
      setRevealIndex(reveal);
      if (reveal < hideCount) {
        const timeout = setTimeout(revealNext, 100);
        setRevealTimeout(timeout);
      }
    };
    
    const timeout = setTimeout(revealNext, 100);
    setRevealTimeout(timeout);
  }, [actualDirection, hideCount]);
  
  const handleNext = useCallback(() => {
    startNewRound(false);
  }, [startNewRound]);
  
  const handleSkip = useCallback(() => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
    setRevealIndex(hideCount);
  }, [hideCount, revealTimeout]);
  
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
            <p className="text-muted-foreground">Predict the next {hideCount} candles direction</p>
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
                  {showCount} candles shown • {hideCount} candles hidden ({Math.round((hideCount / (showCount + hideCount)) * 100)}%)
                </CardDescription>
              </div>
              <div className="text-right">
                {lastVisibleCandle && (
                  <>
                    <div className="text-2xl font-mono font-bold">
                      {lastVisibleCandle.close.toFixed(5)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last visible
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 rounded-lg p-4 relative">
              <Chart 
                candles={visibleCandles}
                visibleCount={visibleCount}
                revealIndex={revealIndex}
              />
              {step === "predict" && (
                <div 
                  className="absolute inset-y-0 bg-background/60 backdrop-blur-3xl rounded-r-lg flex items-center justify-center transition-opacity duration-300"
                  style={{ 
                    left: `${((visibleCandles.length > 0 && visibleCandles[Math.min(77, visibleCandles.length - 1)]) ? 
                      (new Date(visibleCandles[Math.min(77, visibleCandles.length - 1)].datetime).getTime() - new Date(visibleCandles[0].datetime).getTime()) / 
                      (new Date(visibleCandles[visibleCandles.length - 1].datetime).getTime() - new Date(visibleCandles[0].datetime).getTime()) * 100 : 78)}%`,
                    right: 0
                  }}
                >
                  <div className="text-center">
                    <p className="text-lg font-semibold text-muted-foreground">Hidden Area</p>
                    <p className="text-sm text-muted-foreground">{hideCount} candles</p>
                  </div>
                </div>
              )}
            </div>
            
            {step === "predict" && actualDirection && (
              <div className="mt-6 space-y-4">
                <p className="text-center text-muted-foreground">
                  Predict the next {hideCount} candles ({hideCount * 5 / 60} hours):
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    onClick={() => handlePredict("buy")}
                  >
                    <ArrowUp className="w-5 h-5" />
                    BULLISH
                  </Button>
                  <Button
                    size="lg"
                    className="gap-2 bg-red-600 hover:bg-red-700"
                    onClick={() => handlePredict("sell")}
                  >
                    <ArrowDown className="w-5 h-5" />
                    BEARISH
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
                    First hidden candle was{" "}
                    <span className="font-bold">
                      {actualDirection?.toUpperCase()}
                    </span>
                  </p>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button 
                    size="lg" 
                    onClick={handleSkip}
                    variant="outline"
                    disabled={revealIndex >= hideCount}
                  >
                    Skip Animation
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
              <li>EUR/USD 5-minute candles from random range</li>
              <li>Last {hideCount} candles ({hideCount * 5 / 60} hours) are hidden</li>
              <li>Predict whether the hidden area will be bullish or bearish</li>
              <li>Watch the hidden candles reveal one by one</li>
              <li>Click Next for another prediction</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
