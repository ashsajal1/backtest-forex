"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Candle, StructureData } from "./structure";
import {
  Drawing,
  DrawingTool,
  Trendline,
  Line,
  LongShort,
  Fibonacci,
  calculateFibonacciLevels,
  calculateLongShort,
  generateDrawingId,
  Point,
} from "./drawings";

interface ChartProps {
  candles: Candle[];
  visibleCount: number;
  revealCount: number;
  markIndex: number;
  structureData?: StructureData;
  activeTool?: DrawingTool;
  drawings?: Drawing[];
  onAddDrawing?: (drawing: Drawing) => void;
  gameKey?: number;
  width?: number;
  height?: number;
  entryPrice?: number | null;
  tpPrice?: number | null;
  slPrice?: number | null;
  tradeDirection?: "buy" | "sell" | null;
  onTpSlChange?: (tp: number | null, sl: number | null) => void;
}

export default function Chart({
  candles,
  visibleCount,
  revealCount,
  markIndex,
  structureData,
  activeTool = "none",
  drawings = [],
  onAddDrawing,
  gameKey,
  width = 1000,
  height = 250,
  entryPrice,
  tpPrice,
  slPrice,
  tradeDirection,
  onTpSlChange,
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [trendlinePoints, setTrendlinePoints] = useState<Point[]>([]);
  const [draggingTpSl, setDraggingTpSl] = useState<"tp" | "sl" | null>(null);
  const [draggingNewLine, setDraggingNewLine] = useState<{price: number; y: number} | null>(null);

  const entryCandleIndex = useMemo(() => {
    if (!entryPrice) return markIndex;
    return markIndex;
  }, [entryPrice, markIndex]);

  useEffect(() => {
    if (activeTool !== "trendline") {
      setTrendlinePoints([]);
    }
  }, [activeTool]);

  useEffect(() => {
    setTrendlinePoints([]);
  }, [gameKey]);

  const displayCount = visibleCount + revealCount;
  const displayCandles = candles.slice(0, displayCount);

  const minLow = displayCandles.length > 0 ? Math.min(...displayCandles.map((c) => c.low)) : 0;
  const maxHigh = displayCandles.length > 0 ? Math.max(...displayCandles.map((c) => c.high)) : 0;
  const range = maxHigh - minLow || 1;
  const padding = range * 0.1;

  const candleWidth = width / (displayCandles.length || 1);

  const scaleY = useCallback(
    (value: number) => {
      return height - ((value - minLow + padding) / (range + padding * 2)) * height;
    },
    [minLow, range, padding, height]
  );

  const getXFromCandleIndex = useCallback(
    (index: number | undefined) => {
      if (index === undefined) return 0;
      return index * candleWidth + candleWidth / 2;
    },
    [candleWidth]
  );

  const getYFromPrice = useCallback(
    (price: number | undefined) => {
      if (price === undefined) return height / 2;
      return scaleY(price);
    },
    [scaleY]
  );

  const invertY = useCallback(
    (y: number) => {
      const normalizedY = 1 - y / height;
      return minLow - padding + (normalizedY * (range + padding * 2));
    },
    [minLow, range, padding, height]
  );

  const getCandleIndexFromX = useCallback(
    (x: number) => {
      return Math.floor(x / candleWidth);
    },
    [candleWidth]
  );

  const getPointFromEvent = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): Point => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };

      const rect = svg.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY_ = height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY_;

      const candleIndex = getCandleIndexFromX(x);
      const price = invertY(y);

      return { x, y, price, candleIndex: Math.max(0, Math.min(candleIndex, displayCandles.length - 1)) };
    },
    [width, height, candleWidth, invertY, getCandleIndexFromX, displayCandles.length]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (entryPrice && tradeDirection && onTpSlChange && activeTool === "none") {
        const point = getPointFromEvent(e);
        if (point.price !== undefined) {
          setDraggingNewLine({ price: point.price, y: point.y });
          return;
        }
      }

      if (activeTool === "none") return;

      const point = getPointFromEvent(e);

      if (activeTool === "trendline") {
        const newPoints = [...trendlinePoints, point];
        setTrendlinePoints(newPoints);
        
        if (newPoints.length >= 3) {
          const trendline: Trendline = {
            id: generateDrawingId(),
            type: "trendline",
            points: newPoints,
          };
          onAddDrawing?.(trendline);
          setTrendlinePoints([newPoints[newPoints.length - 1]]);
        }
        return;
      }

      setDrawStartPoint(point);
      setIsDrawing(true);
      setCurrentPoint(point);
    },
    [activeTool, getPointFromEvent, trendlinePoints, onAddDrawing, entryPrice, tradeDirection, onTpSlChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (draggingNewLine) {
        const point = getPointFromEvent(e);
        if (point.price !== undefined) {
          setDraggingNewLine({ price: point.price, y: point.y });
        }
        return;
      }

      if (!isDrawing || !drawStartPoint) return;
      const point = getPointFromEvent(e);
      setCurrentPoint(point);
    },
    [isDrawing, drawStartPoint, getPointFromEvent, draggingNewLine]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (draggingNewLine && entryPrice && onTpSlChange) {
        const isAboveEntry = draggingNewLine.price > entryPrice;
        
        if (tradeDirection === "buy") {
          if (isAboveEntry) {
            onTpSlChange(draggingNewLine.price, slPrice ?? null);
          } else {
            onTpSlChange(tpPrice ?? null, draggingNewLine.price);
          }
        } else {
          if (isAboveEntry) {
            onTpSlChange(tpPrice ?? null, draggingNewLine.price);
          } else {
            onTpSlChange(draggingNewLine.price, slPrice ?? null);
          }
        }
        
        setDraggingNewLine(null);
        return;
      }

      if (!isDrawing || !drawStartPoint || activeTool === "none") {
        setIsDrawing(false);
        setDrawStartPoint(null);
        setCurrentPoint(null);
        return;
      }

      const endPoint = getPointFromEvent(e);

      if (activeTool === "line") {
        const line: Line = {
          id: generateDrawingId(),
          type: "line",
          startPoint: drawStartPoint,
          endPoint,
        };
        onAddDrawing?.(line);
      } else if (activeTool === "longshort") {
        const candleAtStart = displayCandles[drawStartPoint.candleIndex || 0];
        const candleAtEnd = displayCandles[endPoint.candleIndex || 0];

        const longshort: LongShort = {
          id: generateDrawingId(),
          type: "longshort",
          startPoint: { ...drawStartPoint, price: candleAtStart?.close, candleIndex: drawStartPoint.candleIndex },
          endPoint: { ...endPoint, price: candleAtEnd?.close, candleIndex: endPoint.candleIndex },
          direction: "long",
          priceDiff: 0,
          pipDiff: 0,
          candleCount: 0,
        };

        const calculated = calculateLongShort(
          { ...drawStartPoint, price: candleAtStart?.close, candleIndex: drawStartPoint.candleIndex },
          { ...endPoint, price: candleAtEnd?.close, candleIndex: endPoint.candleIndex },
          displayCandles
        );

        onAddDrawing?.({
          ...longshort,
          direction: calculated.direction,
          priceDiff: calculated.priceDiff,
          pipDiff: calculated.pipDiff,
          candleCount: calculated.candleCount,
        });
      } else if (activeTool === "fibonacci") {
        const startPrice = drawStartPoint.price || displayCandles[0]?.close || 0;
        const endPrice = endPoint.price || displayCandles[displayCandles.length - 1]?.close || 0;

        const levels = calculateFibonacciLevels(startPrice, endPrice);

        const fibonacci: Fibonacci = {
          id: generateDrawingId(),
          type: "fibonacci",
          startPoint: drawStartPoint,
          endPoint,
          levels,
        };
        onAddDrawing?.(fibonacci);
      }

      setIsDrawing(false);
      setDrawStartPoint(null);
      setCurrentPoint(null);
    },
    [isDrawing, drawStartPoint, activeTool, getPointFromEvent, onAddDrawing, displayCandles, draggingNewLine, entryPrice, tradeDirection, onTpSlChange, tpPrice, slPrice]
  );

  const handleTpSlMouseDown = useCallback((e: React.MouseEvent<SVGGElement>, type: "tp" | "sl") => {
    e.stopPropagation();
    setDraggingTpSl(type);
  }, []);

  const handleTpSlMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggingTpSl || !onTpSlChange) return;
      
      const point = getPointFromEvent(e);
      if (point.price === undefined) return;

      if (draggingTpSl === "tp") {
        onTpSlChange(point.price, slPrice ?? null);
      } else {
        onTpSlChange(tpPrice ?? null, point.price);
      }
    },
    [draggingTpSl, onTpSlChange, getPointFromEvent, tpPrice, slPrice]
  );

  const handleTpSlMouseUp = useCallback(() => {
    setDraggingTpSl(null);
  }, []);

  const renderTpSl = useMemo(() => {
    if (!entryPrice || !tradeDirection || !onTpSlChange) return null;

    const tpY = tpPrice ? scaleY(tpPrice) : null;
    const slY = slPrice ? scaleY(slPrice) : null;
    const entryY = scaleY(entryPrice);
    const startX = getXFromCandleIndex(markIndex);
    const endX = width;

    const isBuy = tradeDirection === "buy";

    return (
      <g>
        {tpY !== null && (
          <g>
            <line
              x1={startX}
              y1={tpY}
              x2={endX}
              y2={tpY}
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <rect
              x={startX}
              y={tpY - 10}
              width={60}
              height={20}
              fill="#22c55e"
              rx={4}
              className="cursor-move"
              onMouseDown={(e) => handleTpSlMouseDown(e, "tp")}
            />
            <text
              x={startX + 30}
              y={tpY + 4}
              textAnchor="middle"
              fill="white"
              fontSize={10}
              fontWeight="bold"
              pointerEvents="none"
            >
              TP
            </text>
            <text
              x={endX - 5}
              y={tpY + 3}
              fill="#22c55e"
              fontSize={10}
              fontWeight="bold"
              textAnchor="end"
            >
              {tpPrice?.toFixed(5)}
            </text>
          </g>
        )}

        {slY !== null && (
          <g>
            <line
              x1={startX}
              y1={slY}
              x2={endX}
              y2={slY}
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <rect
              x={startX}
              y={slY - 10}
              width={60}
              height={20}
              fill="#ef4444"
              rx={4}
              className="cursor-move"
              onMouseDown={(e) => handleTpSlMouseDown(e, "sl")}
            />
            <text
              x={startX + 30}
              y={slY + 4}
              textAnchor="middle"
              fill="white"
              fontSize={10}
              fontWeight="bold"
              pointerEvents="none"
            >
              SL
            </text>
            <text
              x={endX - 5}
              y={slY + 3}
              fill="#ef4444"
              fontSize={10}
              fontWeight="bold"
              textAnchor="end"
            >
              {slPrice?.toFixed(5)}
            </text>
          </g>
        )}

        <line
          x1={startX}
          y1={entryY}
          x2={endX}
          y2={entryY}
          stroke="#fbbf24"
          strokeWidth={2}
        />
        <text
          x={startX + 5}
          y={entryY - 5}
          fill="#fbbf24"
          fontSize={10}
          fontWeight="bold"
        >
          ENTRY {entryPrice.toFixed(5)}
        </text>
      </g>
    );
  }, [entryPrice, tpPrice, slPrice, tradeDirection, onTpSlChange, markIndex, width, scaleY, getXFromCandleIndex, handleTpSlMouseDown]);

  const renderDrawings = useMemo(() => {
    return drawings.map((drawing) => {
      if (drawing.type === "trendline") {
        const points = drawing.points;
        if (points.length < 2) return null;
        
        const pathD = points.map((p, i) => {
          const x = getXFromCandleIndex(p.candleIndex);
          const y = getYFromPrice(p.price);
          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        }).join(" ");

        return (
          <path
            key={drawing.id}
            d={pathD}
            stroke="#3b82f6"
            strokeWidth={2}
            fill="none"
          />
        );
      }

      if (drawing.type === "line") {
        const x1 = getXFromCandleIndex(drawing.startPoint.candleIndex);
        const y1 = getYFromPrice(drawing.startPoint.price);
        const x2 = getXFromCandleIndex(drawing.endPoint.candleIndex);
        const y2 = getYFromPrice(drawing.endPoint.price);

        return (
          <line
            key={drawing.id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      }

      if (drawing.type === "longshort") {
        const x1 = getXFromCandleIndex(drawing.startPoint.candleIndex);
        const y1 = getYFromPrice(drawing.startPoint.price);
        const x2 = getXFromCandleIndex(drawing.endPoint.candleIndex);
        const y2 = getYFromPrice(drawing.endPoint.price);
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const isLong = drawing.direction === "long";
        const color = isLong ? "#22c55e" : "#ef4444";

        return (
          <g key={drawing.id}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth={2}
            />
            <circle
              cx={x1}
              cy={y1}
              r={4}
              fill={color}
            />
            <circle
              cx={x2}
              cy={y2}
              r={4}
              fill={color}
            />
            <rect
              x={midX - 45}
              y={midY - 12}
              width={90}
              height={24}
              fill={color}
              rx={4}
            />
            <text
              x={midX}
              y={midY + 4}
              textAnchor="middle"
              fill="white"
              fontSize={10}
              fontWeight="bold"
            >
              {isLong ? "LONG" : "SHORT"} {drawing.pipDiff.toFixed(1)} pips
            </text>
          </g>
        );
      }

      if (drawing.type === "fibonacci") {
        const startPrice = drawing.startPoint.price || displayCandles[drawing.startPoint.candleIndex || 0]?.close || 0;
        const endPrice = drawing.endPoint.price || displayCandles[drawing.endPoint.candleIndex || 0]?.close || 0;
        const startX = getXFromCandleIndex(drawing.startPoint.candleIndex);
        const endX = getXFromCandleIndex(drawing.endPoint.candleIndex);
        const x = Math.min(startX, endX);
        const fibWidth = Math.abs(endX - startX);

        const fibColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6"];

        return (
          <g key={drawing.id}>
            {drawing.levels.map((level, idx) => {
              const levelPrice = startPrice + (endPrice - startPrice) * level.level;
              const y = getYFromPrice(levelPrice);
              return (
                <g key={level.level}>
                  <line
                    x1={x - fibWidth}
                    y1={y}
                    x2={x + fibWidth}
                    y2={y}
                    stroke={fibColors[idx]}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  <text
                    x={x - fibWidth - 5}
                    y={y + 3}
                    fill={fibColors[idx]}
                    fontSize={9}
                    fontWeight="bold"
                    textAnchor="end"
                  >
                    {(level.level * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            <line
              x1={x - fibWidth}
              y1={getYFromPrice(startPrice)}
              x2={x + fibWidth}
              y2={getYFromPrice(startPrice)}
              stroke="#fff"
              strokeWidth={2}
            />
            <line
              x1={x - fibWidth}
              y1={getYFromPrice(endPrice)}
              x2={x + fibWidth}
              y2={getYFromPrice(endPrice)}
              stroke="#fff"
              strokeWidth={2}
            />
            
            <text
              x={x - fibWidth - 5}
              y={getYFromPrice(startPrice) + 3}
              fill="#9ca3af"
              fontSize={8}
              textAnchor="end"
            >
              {startPrice.toFixed(5)}
            </text>
            <text
              x={x - fibWidth - 5}
              y={getYFromPrice(endPrice) + 3}
              fill="#9ca3af"
              fontSize={8}
              textAnchor="end"
            >
              {endPrice.toFixed(5)}
            </text>
          </g>
        );
      }

      return null;
    });
  }, [drawings, displayCandles, getXFromCandleIndex, getYFromPrice]);

  const renderDrawingPreview = useMemo(() => {
    if (activeTool === "trendline") {
      if (trendlinePoints.length === 0) return null;
      
      const allPoints = [...trendlinePoints];
      const pathD = allPoints.map((p, i) => 
        i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
      ).join(" ");

      return (
        <g>
          {allPoints.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={i === 0 ? 6 : 4}
              fill={i === 0 ? "#3b82f6" : "#60a5fa"}
              stroke="white"
              strokeWidth={1}
            />
          ))}
          {allPoints.length >= 2 && (
            <path
              d={pathD}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5,5"
              fill="none"
            />
          )}
        </g>
      );
    }

    if (!isDrawing || !drawStartPoint || !currentPoint) return null;

    if (activeTool === "line") {
      return (
        <line
          x1={drawStartPoint.x}
          y1={drawStartPoint.y}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      );
    }

    if (activeTool === "longshort") {
      const isLong = currentPoint.y < drawStartPoint.y;
      const color = isLong ? "#22c55e" : "#ef4444";

      return (
        <line
          x1={drawStartPoint.x}
          y1={drawStartPoint.y}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="5,5"
        />
      );
    }

    if (activeTool === "fibonacci" && drawStartPoint && currentPoint) {
      const startX = Math.min(drawStartPoint.x, currentPoint.x);
      const endX = Math.max(drawStartPoint.x, currentPoint.x);
      const fibWidth = Math.abs(endX - startX);
      const x = startX;

      const startPrice = invertY(Math.min(drawStartPoint.y, currentPoint.y));
      const endPrice = invertY(Math.max(drawStartPoint.y, currentPoint.y));

      const fibColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6"];

      const levels = calculateFibonacciLevels(startPrice, endPrice);

      return (
        <g>
          {levels.map((level, idx) => {
            const levelPrice = startPrice + (endPrice - startPrice) * level.level;
            const y = getYFromPrice(levelPrice);
            return (
              <line
                key={level.level}
                x1={x - fibWidth}
                y1={y}
                x2={x + fibWidth}
                y2={y}
                stroke={fibColors[idx]}
                strokeWidth={1}
                strokeDasharray="4,4"
                opacity={0.6}
              />
            );
          })}
        </g>
      );
    }

    return null;
  }, [isDrawing, drawStartPoint, currentPoint, activeTool, invertY, trendlinePoints, getYFromPrice]);

  const cursorStyle = activeTool === "none" 
    ? (entryPrice && tradeDirection ? "ns-resize" : "default") 
    : "crosshair";

  if (displayCandles.length === 0) return null;

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingTpSl) {
      handleTpSlMouseMove(e);
    } else {
      handleMouseMove(e);
    }
  };

  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingTpSl) {
      handleTpSlMouseUp();
    } else if (draggingNewLine) {
      handleMouseUp(e);
    } else {
      // original mouseUp doesn't need event
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[200px] sm:h-[250px]"
      style={{ cursor: draggingTpSl || draggingNewLine ? "ns-resize" : cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleSvgMouseMove}
      onMouseUp={handleSvgMouseUp}
      onMouseLeave={() => {
        if (isDrawing) {
          setIsDrawing(false);
          setDrawStartPoint(null);
          setCurrentPoint(null);
        }
        if (draggingTpSl) {
          setDraggingTpSl(null);
        }
        if (draggingNewLine) {
          setDraggingNewLine(null);
        }
      }}
    >
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

      {renderDrawingPreview}

      {renderDrawings}

      {draggingNewLine && (
        <g>
          <line
            x1={0}
            y1={draggingNewLine.y}
            x2={width}
            y2={draggingNewLine.y}
            stroke={entryPrice ? (draggingNewLine.price > entryPrice ? "#22c55e" : "#ef4444") : "#3b82f6"}
            strokeWidth={2}
            strokeDasharray="5,5"
          />
          <text
            x={width / 2}
            y={draggingNewLine.y - 5}
            fill={entryPrice ? (draggingNewLine.price > entryPrice ? "#22c55e" : "#ef4444") : "#3b82f6"}
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
          >
            {entryPrice 
              ? (draggingNewLine.price > entryPrice 
                  ? (tradeDirection === "buy" ? "TP" : "SL")
                  : (tradeDirection === "buy" ? "SL" : "TP"))
              : "SET LEVEL"}: {draggingNewLine.price.toFixed(5)}
          </text>
        </g>
      )}

      {renderTpSl}

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

      <text x="5" y="15" fill="#9ca3af" fontSize="8">
        {displayCandles[0]?.datetime || "-"}
      </text>
      <text x={width - 80} y="15" fill="#9ca3af" fontSize="8">
        {displayCandles[displayCandles.length - 1]?.datetime || "-"}
      </text>
    </svg>
  );
}
