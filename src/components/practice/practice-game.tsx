"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Candle, StructureData, detectStructure } from "./structure";
import Chart from "./chart";
import DrawingToolbar from "./drawing-toolbar";
import { Drawing, DrawingTool } from "./drawings";

interface PracticeGameProps {
  totalCandles: number;
  predictionIndex: number;
  hideCount: number;
  score: { correct: number; total: number };
  setScore: React.Dispatch<
    React.SetStateAction<{ correct: number; total: number }>
  >;
  allCandles: Candle[];
  startIndex: number;
  onNext: () => void;
  gameKey: number;
}

export default function PracticeGame({
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
  const [revealTimeout, setRevealTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [activeTool, setActiveTool] = useState<DrawingTool>("none");
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  const handleAddDrawing = useCallback((drawing: Drawing) => {
    setDrawings((prev) => [...prev, drawing]);
  }, []);

  const handleClearDrawings = useCallback(() => {
    setDrawings([]);
  }, []);

  useEffect(() => {
    setRevealCount(0);
    setStep("predict");
    setPrediction(null);
    setDrawings([]);
    setActiveTool("none");
  }, [gameKey]);

  useEffect(() => {
    return () => {
      if (revealTimeout) clearTimeout(revealTimeout);
    };
  }, [revealTimeout]);

  const visibleCandles = useMemo(() => {
    if (allCandles.length === 0) return [];
    return allCandles.slice(
      startIndex,
      startIndex + totalCandles + hideCount
    );
  }, [allCandles, startIndex, totalCandles, hideCount]);

  const structureData = useMemo(() => {
    if (visibleCandles.length === 0) return { swings: [] };
    return detectStructure(visibleCandles);
  }, [visibleCandles]);

  const markedCandle = visibleCandles[predictionIndex];
  const lastCandle = visibleCandles[totalCandles - 1];

  const actualDirection =
    markedCandle && lastCandle
      ? lastCandle.close > markedCandle.close
        ? "buy"
        : "sell"
      : null;

  const priceChange =
    markedCandle && lastCandle
      ? ((lastCandle.close - markedCandle.close) * 10000).toFixed(1)
      : null;

  const handlePredict = useCallback(
    (direction: "buy" | "sell") => {
      if (!actualDirection) return;
      setPrediction(direction);
      setStep("result");
      setScore((prev) => ({
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
    },
    [actualDirection, hideCount, setScore]
  );

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

  const explanation = useMemo(() => {
    if (!markedCandle || !lastCandle || step !== "result") return null;

    const swings = structureData.swings;
    const markedIdx = predictionIndex;

    const swingsBeforeMarked = swings.filter((s) => s.index < markedIdx);
    const swingsAfterMarked = swings.filter(
      (s) => s.index >= markedIdx && s.index < totalCandles
    );

    const hasHH = swingsBeforeMarked.some((s) => s.label === "HH");
    const hasHL = swingsBeforeMarked.some((s) => s.label === "HL");
    const hasLH = swingsBeforeMarked.some((s) => s.label === "LH");
    const hasLL = swingsBeforeMarked.some((s) => s.label === "LL");

    const isBullish = actualDirection === "buy";
    const correct = prediction === actualDirection;

    let reason = "";

    if (correct) {
      if (isBullish) {
        if (hasHH && hasHL) {
          reason =
            "Bullish structure confirmed: Higher High (HH) and Higher Low (HL) formed. Price broke above previous swing high.";
        } else if (hasHL) {
          reason =
            "Bullish move: Higher Low (HL) held as support. Price moved up from the HL.";
        } else {
          reason =
            "Price moved up from marked candle. Look for HH/HL formation for bullish setups.";
        }
      } else {
        if (hasLH && hasLL) {
          reason =
            "Bearish structure confirmed: Lower High (LH) and Lower Low (LL) formed. Price broke below previous swing low.";
        } else if (hasLL) {
          reason =
            "Bearish move: Lower Low (LL) formed as resistance failed. Price dropped from the LH.";
        } else {
          reason =
            "Price moved down from marked candle. Look for LH/LL formation for bearish setups.";
        }
      }
    } else {
      if (isBullish) {
        if (hasLH || hasLL) {
          reason =
            "Failed bullish move: Despite some structure, LH or LL formed indicating bearish pressure.";
        } else {
          reason =
            "Price didn't follow bullish structure. Market may be in consolidation or reversed.";
        }
      } else {
        if (hasHH || hasHL) {
          reason =
            "Failed bearish move: Despite some structure, HH or HL formed indicating bullish pressure.";
        } else {
          reason =
            "Price didn't follow bearish structure. Market may be in consolidation or reversed.";
        }
      }
    }

    return { reason, hasHH, hasHL, hasLH, hasLL, swingsAfterMarked };
  }, [
    markedCandle,
    lastCandle,
    step,
    structureData,
    predictionIndex,
    totalCandles,
    actualDirection,
    prediction,
  ]);

  if (visibleCandles.length === 0) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Target className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            {markedCandle && (
              <>
                <div className="text-lg font-mono font-semibold">
                  Marked:{" "}
                  <span className="text-yellow-500">
                    {markedCandle.close.toFixed(5)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  #{predictionIndex + 1} ({markedCandle.datetime})
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          {lastCandle && step === "result" && (
            <>
              <div className="text-right">
                <div className="text-lg font-mono font-semibold">
                  Last:{" "}
                  <span
                    className={
                      actualDirection === "buy"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {lastCandle.close.toFixed(5)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  #{totalCandles} ({lastCandle.datetime})
                </div>
              </div>
              <div
                className={`p-2 rounded-lg ${
                  actualDirection === "buy"
                    ? "bg-green-500/10"
                    : "bg-red-500/10"
                }`}
              >
                {actualDirection === "buy" ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="bg-muted/20 rounded-lg p-2 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onClearDrawings={handleClearDrawings}
                hasDrawings={drawings.length > 0}
              />
            </div>
            <Chart
              candles={visibleCandles}
              visibleCount={predictionIndex + 1}
              revealCount={revealCount}
              markIndex={predictionIndex}
              structureData={structureData}
              activeTool={activeTool}
              drawings={drawings}
              onAddDrawing={handleAddDrawing}
            />
          </div>
        </div>

        <div className="w-full lg:w-72 space-y-3">
          {step === "predict" && actualDirection && (
            <div className="space-y-2 sm:space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Predict price direction
              </p>
              <Button
                className="w-full gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 h-10 sm:h-12 text-sm sm:text-base"
                onClick={() => handlePredict("buy")}
              >
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                LONG
              </Button>
              <Button
                className="w-full gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 h-10 sm:h-12 text-sm sm:text-base"
                onClick={() => handlePredict("sell")}
              >
                <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                SHORT
              </Button>
            </div>
          )}

          {step === "result" && (
            <div
              className={`text-center p-2 sm:p-4 rounded-xl border-2 ${
                prediction === actualDirection
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                {prediction === actualDirection ? (
                  <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" />
                )}
                <span className="text-base sm:text-xl font-bold">
                  {prediction === actualDirection ? "Correct!" : "Wrong!"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {markedCandle?.close.toFixed(5)} →{" "}
                {lastCandle?.close.toFixed(5)} ={" "}
                <span className="font-mono font-semibold text-foreground">
                  {priceChange} pips
                </span>
              </p>
              <div className="mt-1 sm:mt-2">
                <Badge
                  variant={
                    actualDirection === "buy" ? "default" : "destructive"
                  }
                  className="gap-1"
                >
                  {actualDirection === "buy" ? (
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  {actualDirection?.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-2 sm:mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSkip}
                  variant="outline"
                  disabled={revealCount >= hideCount}
                >
                  Skip
                </Button>
                <Button
                  className="flex-1 gap-1 sm:gap-2"
                  onClick={handleNext}
                >
                  Next
                  <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5" />
                </Button>
              </div>

              {explanation && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg text-left">
                  <p className="text-xs sm:text-sm font-medium mb-2">
                    Analysis:
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {explanation.reason}
                  </p>
                  {explanation.swingsAfterMarked.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {explanation.swingsAfterMarked.slice(0, 3).map((s, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={`text-xs ${
                            s.label === "HH" || s.label === "HL"
                              ? "text-green-500 border-green-500"
                              : "text-red-500 border-red-500"
                          }`}
                        >
                          {s.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
