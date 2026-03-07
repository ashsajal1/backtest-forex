"use client";

import { useRef, useState, useCallback, useMemo } from "react";
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
  activeTool: DrawingTool;
  drawings: Drawing[];
  onAddDrawing: (drawing: Drawing) => void;
  width?: number;
  height?: number;
}

export default function Chart({
  candles,
  visibleCount,
  revealCount,
  markIndex,
  structureData,
  activeTool,
  drawings,
  onAddDrawing,
  width = 1000,
  height = 250,
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartPoint, setDrawStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [trendlinePoints, setTrendlinePoints] = useState<Point[]>([]);

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
          onAddDrawing(trendline);
          setTrendlinePoints([newPoints[newPoints.length - 1]]);
        }
        return;
      }

      setDrawStartPoint(point);
      setIsDrawing(true);
      setCurrentPoint(point);
    },
    [activeTool, getPointFromEvent, trendlinePoints, onAddDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawing || !drawStartPoint) return;
      const point = getPointFromEvent(e);
      setCurrentPoint(point);
    },
    [isDrawing, drawStartPoint, getPointFromEvent]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
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
        onAddDrawing(line);
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

        onAddDrawing({
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
        onAddDrawing(fibonacci);
      }

      setIsDrawing(false);
      setDrawStartPoint(null);
      setCurrentPoint(null);
    },
    [isDrawing, drawStartPoint, activeTool, getPointFromEvent, onAddDrawing, displayCandles]
  );

  const renderDrawings = useMemo(() => {
    return drawings.map((drawing) => {
      if (drawing.type === "trendline") {
        const points = drawing.points;
        if (points.length < 2) return null;
        
        const pathD = points.map((p, i) => 
          i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        ).join(" ");

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
        return (
          <line
            key={drawing.id}
            x1={drawing.startPoint.x}
            y1={drawing.startPoint.y}
            x2={drawing.endPoint.x}
            y2={drawing.endPoint.y}
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5,5"
          />
        );
      }

      if (drawing.type === "longshort") {
        const midX = (drawing.startPoint.x + drawing.endPoint.x) / 2;
        const midY = (drawing.startPoint.y + drawing.endPoint.y) / 2;
        const isLong = drawing.direction === "long";
        const color = isLong ? "#22c55e" : "#ef4444";

        return (
          <g key={drawing.id}>
            <line
              x1={drawing.startPoint.x}
              y1={drawing.startPoint.y}
              x2={drawing.endPoint.x}
              y2={drawing.endPoint.y}
              stroke={color}
              strokeWidth={2}
            />
            <circle
              cx={drawing.startPoint.x}
              cy={drawing.startPoint.y}
              r={4}
              fill={color}
            />
            <circle
              cx={drawing.endPoint.x}
              cy={drawing.endPoint.y}
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
        const startY = drawing.startPoint.y;
        const endY = drawing.endPoint.y;
        const x = Math.min(drawing.startPoint.x, drawing.endPoint.x);
        const fibWidth = Math.abs(drawing.endPoint.x - drawing.startPoint.x);

        const fibColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6"];

        return (
          <g key={drawing.id}>
            {drawing.levels.map((level, idx) => {
              const y = startY + (endY - startY) * level.level;
              return (
                <g key={level.level}>
                  <line
                    x1={x}
                    y1={y}
                    x2={x + fibWidth}
                    y2={y}
                    stroke={fibColors[idx]}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                  <rect
                    x={x + fibWidth + 2}
                    y={y - 8}
                    width={45}
                    height={16}
                    fill={fibColors[idx]}
                    rx={2}
                  />
                  <text
                    x={x + fibWidth + 4}
                    y={y + 3}
                    fill="white"
                    fontSize={9}
                    fontWeight="bold"
                  >
                    {(level.level * 100).toFixed(1)}%
                  </text>
                </g>
              );
            })}

            <line
              x1={x}
              y1={startY}
              x2={x + fibWidth}
              y2={startY}
              stroke="#fff"
              strokeWidth={2}
            />
            <line
              x1={x}
              y1={endY}
              x2={x + fibWidth}
              y2={endY}
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        );
      }

      return null;
    });
  }, [drawings]);

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

    if (activeTool === "fibonacci") {
      const startY = Math.min(drawStartPoint.y, currentPoint.y);
      const endY = Math.max(drawStartPoint.y, currentPoint.y);
      const x = Math.min(drawStartPoint.x, currentPoint.x);
      const fibWidth = Math.abs(currentPoint.x - drawStartPoint.x);

      const fibColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6"];

      const levels = calculateFibonacciLevels(
        invertY(drawStartPoint.y),
        invertY(currentPoint.y)
      );

      return (
        <g>
          {levels.map((level, idx) => {
            const y = startY + (endY - startY) * level.level;
            return (
              <line
                key={level.level}
                x1={x}
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
  }, [isDrawing, drawStartPoint, currentPoint, activeTool, invertY, trendlinePoints]);

  const cursorStyle = activeTool === "none" ? "default" : "crosshair";

  if (displayCandles.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[200px] sm:h-[250px]"
      style={{ cursor: cursorStyle }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDrawing) {
          setIsDrawing(false);
          setDrawStartPoint(null);
          setCurrentPoint(null);
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
