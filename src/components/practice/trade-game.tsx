"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowUp,
  ArrowDown,
  Target,
  RotateCcw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Candle } from "./structure";

interface TradeGameProps {
  allCandles: Candle[];
  startIndex: number;
  onNext: () => void;
  gameKey: number;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
}

export default function TradeGame({
  allCandles,
  startIndex,
  onNext,
  gameKey,
  balance,
  setBalance,
}: TradeGameProps) {
  const TOTAL_CANDLES = 50;
  const PREDICTION_INDEX = 39;
  const HIDE_COUNT = 10;

  const [revealCount, setRevealCount] = useState(0);
  const [step, setStep] = useState<"setup" | "trading" | "result">("setup");
  const [tradeType, setTradeType] = useState<"long" | "short" | null>(null);
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [tpPrice, setTpPrice] = useState<string>("");
  const [slPrice, setSlPrice] = useState<string>("");
  const [tradeAmount, setTradeAmount] = useState<string>("100");
  const [revealTimeout, setRevealTimeout] = useState<NodeJS.Timeout | null>(null);
  const [tradeResult, setTradeResult] = useState<"tp" | "sl" | null>(null);
  const [pnl, setPnl] = useState<number>(0);

  useEffect(() => {
    setRevealCount(0);
    setStep("setup");
    setTradeType(null);
    setEntryPrice("");
    setTpPrice("");
    setSlPrice("");
    setTradeResult(null);
    setPnl(0);
  }, [gameKey]);

  useEffect(() => {
    return () => {
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [revealTimeout]);

  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    return allCandles.slice(startIndex, startIndex + TOTAL_CANDLES + HIDE_COUNT);
  }, [allCandles, startIndex]);

  const markedCandle = visibleCandles[PREDICTION_INDEX];

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartSize, setChartSize] = useState({ width: 1000, height: 250 });

  useEffect(() => {
    const updateSize = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setChartSize({
          width: rect.width * 1.5 || 1000,
          height: 250,
        });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const { minLow, maxHigh, range, padding, candleWidth, scaleY } = useMemo(() => {
    const displayCandles = visibleCandles.slice(0, PREDICTION_INDEX + 1);
    if (displayCandles.length === 0) {
      return { minLow: 0, maxHigh: 1, range: 1, padding: 0.1, candleWidth: 20, scaleY: (_: number) => 125 };
    }
    const min = Math.min(...displayCandles.map((c) => c.low));
    const max = Math.max(...displayCandles.map((c) => c.high));
    const r = max - min || 1;
    const p = r * 0.1;
    const cw = chartSize.width / displayCandles.length;
    const s = (value: number) =>
      chartSize.height - ((value - min + p) / (r + p * 2)) * chartSize.height;
    return { minLow: min, maxHigh: max, range: r, padding: p, candleWidth: cw, scaleY: s };
  }, [visibleCandles, chartSize]);

  const handleSetEntry = useCallback(() => {
    if (!markedCandle || !tradeType || !entryPrice || !tpPrice || !slPrice) return;

    const entry = parseFloat(entryPrice);
    const tp = parseFloat(tpPrice);
    const sl = parseFloat(slPrice);

    if (isNaN(entry) || isNaN(tp) || isNaN(sl)) return;

    if ((tradeType === "long" && (tp <= entry || sl >= entry)) ||
        (tradeType === "short" && (tp >= entry || sl <= entry))) {
      return;
    }

    setStep("trading");

    let reveal = 0;
    const revealNext = () => {
      const currentRevealIndex = PREDICTION_INDEX + 1 + reveal;
      if (currentRevealIndex >= visibleCandles.length) {
        return;
      }

      const candle = visibleCandles[currentRevealIndex];
      if (!candle) return;

      reveal++;
      setRevealCount(reveal);

      let hitTp = false;
      let hitSl = false;

      if (tradeType === "long") {
        if (candle.high >= tp) hitTp = true;
        if (candle.low <= sl) hitSl = true;
      } else {
        if (candle.low <= tp) hitTp = true;
        if (candle.high >= sl) hitSl = true;
      }

      if (hitTp || hitSl || reveal >= HIDE_COUNT) {
        const result: "tp" | "sl" | null = hitTp ? "tp" : hitSl ? "sl" : null;
        setTradeResult(result);

        const amount = parseFloat(tradeAmount) || 100;
        let profit = 0;

        if (result === "tp") {
          if (tradeType === "long") {
            profit = ((tp - entry) / entry) * amount * 100;
          } else {
            profit = ((entry - tp) / entry) * amount * 100;
          }
        } else if (result === "sl") {
          if (tradeType === "long") {
            profit = ((sl - entry) / entry) * amount * 100;
          } else {
            profit = ((entry - sl) / entry) * amount * 100;
          }
        }

        setPnl(profit);
        setBalance((prev) => prev + profit);
        setStep("result");
      } else {
        const timeout = setTimeout(revealNext, 100);
        setRevealTimeout(timeout);
      }
    };

    const timeout = setTimeout(revealNext, 100);
    setRevealTimeout(timeout);
  }, [markedCandle, tradeType, entryPrice, tpPrice, slPrice, tradeAmount, visibleCandles, setBalance]);

  const handleNext = useCallback(() => {
    if (revealTimeout) {
      clearTimeout(revealTimeout);
      setRevealTimeout(null);
    }
    onNext();
  }, [onNext, revealTimeout]);

  const handleRestart = useCallback(() => {
    setBalance(100);
  }, [setBalance]);

  if (visibleCandles.length === 0) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <div className="text-lg font-mono font-semibold">
              Balance: <span className="text-green-500">${balance.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Set up your trade
            </div>
          </div>
        </div>
        {step === "result" && (
          <div className="text-right">
            <div className={`text-lg font-mono font-semibold ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
              {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              {tradeResult === "tp" ? "Take Profit Hit!" : tradeResult === "sl" ? "Stop Loss Hit!" : "Expired"}
            </div>
          </div>
        )}
      </div>

      <div ref={chartRef} className="bg-muted/20 rounded-lg p-2 overflow-hidden">
        <svg viewBox={`0 0 ${chartSize.width} ${chartSize.height}`} className="w-full h-[200px] sm:h-[250px]">
          {[0, 0.25, 0.5, 0.75, 1].map((pos) => (
            <line
              key={pos}
              x1={0}
              y1={pos * chartSize.height}
              x2={chartSize.width}
              y2={pos * chartSize.height}
              stroke="#374151"
              strokeWidth={1}
            />
          ))}

          {visibleCandles.map((candle, i) => {
            if (i > PREDICTION_INDEX + revealCount) return null;

            const x = i * candleWidth + candleWidth / 2;
            const isBullish = candle.close >= candle.open;
            const color = isBullish ? "#22c55e" : "#ef4444";

            const isMarked = i === PREDICTION_INDEX;

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
                {isMarked && (
                  <line
                    x1={i * candleWidth}
                    y1={0}
                    x2={i * candleWidth}
                    y2={chartSize.height}
                    stroke="#fbbf24"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {tradeType && entryPrice && (
            <>
              <line
                x1={0}
                y1={scaleY(parseFloat(entryPrice))}
                x2={chartSize.width}
                y2={scaleY(parseFloat(entryPrice))}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5,5"
              />
              <text x="5" y={scaleY(parseFloat(entryPrice)) - 5} fill="#3b82f6" fontSize="10">
                Entry: {parseFloat(entryPrice).toFixed(5)}
              </text>
            </>
          )}

          {tradeType && tpPrice && (
            <line
              x1={0}
              y1={scaleY(parseFloat(tpPrice))}
              x2={chartSize.width}
              y2={scaleY(parseFloat(tpPrice))}
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}

          {tradeType && slPrice && (
            <line
              x1={0}
              y1={scaleY(parseFloat(slPrice))}
              x2={chartSize.width}
              y2={scaleY(parseFloat(slPrice))}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          )}

          <line
            x1={(PREDICTION_INDEX + 1) * candleWidth}
            y1={0}
            x2={(PREDICTION_INDEX + 1) * candleWidth}
            y2={chartSize.height}
            stroke="#fbbf24"
            strokeWidth={2}
            strokeDasharray="5,5"
          />

          <text x="5" y="15" fill="#9ca3af" fontSize="8">
            {visibleCandles[0]?.datetime || "-"}
          </text>
          <text x={chartSize.width - 80} y="15" fill="#9ca3af" fontSize="8">
            {visibleCandles[PREDICTION_INDEX]?.datetime || "-"}
          </text>
        </svg>
      </div>

      {step === "setup" && markedCandle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Set Up Trade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trade Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={tradeType === "long" ? "default" : "outline"}
                    className={`flex-1 gap-1 ${tradeType === "long" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={() => {
                      setTradeType("long");
                      setEntryPrice(markedCandle.close.toFixed(5));
                      const pip = 0.00050;
                      setTpPrice((markedCandle.close + pip * 3).toFixed(5));
                      setSlPrice((markedCandle.close - pip * 2).toFixed(5));
                    }}
                  >
                    <ArrowUp className="w-4 h-4" />
                    LONG
                  </Button>
                  <Button
                    variant={tradeType === "short" ? "default" : "outline"}
                    className={`flex-1 gap-1 ${tradeType === "short" ? "bg-red-600 hover:bg-red-700" : ""}`}
                    onClick={() => {
                      setTradeType("short");
                      setEntryPrice(markedCandle.close.toFixed(5));
                      const pip = 0.00050;
                      setTpPrice((markedCandle.close - pip * 3).toFixed(5));
                      setSlPrice((markedCandle.close + pip * 2).toFixed(5));
                    }}
                  >
                    <ArrowDown className="w-4 h-4" />
                    SHORT
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  min={1}
                  max={balance}
                />
              </div>
            </div>

            {tradeType && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry">Entry Price</Label>
                  <Input
                    id="entry"
                    type="text"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tp" className="text-green-500">Take Profit</Label>
                  <Input
                    id="tp"
                    type="text"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    className="border-green-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sl" className="text-red-500">Stop Loss</Label>
                  <Input
                    id="sl"
                    type="text"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    className="border-red-500/50"
                  />
                </div>
              </div>
            )}

            {tradeType && entryPrice && tpPrice && slPrice && (
              <Button
                className="w-full gap-2"
                onClick={handleSetEntry}
              >
                <Target className="w-4 h-4" />
                Start Trade
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === "trading" && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              {tradeType === "long" ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
              <span className="text-2xl font-bold uppercase">{tradeType}</span>
              <span className="text-muted-foreground">@ {entryPrice}</span>
            </div>
            <p className="text-muted-foreground">Watching for TP or SL...</p>
            <div className="mt-4 flex justify-center gap-8">
              <div className="text-center">
                <div className="text-green-500 font-bold">TP: {tpPrice}</div>
              </div>
              <div className="text-center">
                <div className="text-red-500 font-bold">SL: {slPrice}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "result" && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {tradeResult === "tp" ? (
                <>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-green-500">TAKE PROFIT!</span>
                </>
              ) : tradeResult === "sl" ? (
                <>
                  <XCircle className="w-8 h-8 text-red-500" />
                  <span className="text-2xl font-bold text-red-500">STOP LOSS!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-yellow-500" />
                  <span className="text-2xl font-bold text-yellow-500">EXPIRED!</span>
                </>
              )}
            </div>
            <div className="text-lg mb-4">
              P&L: <span className={`font-bold ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
              </span>
            </div>
            <Button onClick={handleNext} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Next Trade
            </Button>
          </CardContent>
        </Card>
      )}

      {balance <= 0 && (
        <Card className="border-red-500">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 text-xl font-bold mb-4">Game Over! You lost all your money.</p>
            <Button onClick={handleRestart} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Restart with $100
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
