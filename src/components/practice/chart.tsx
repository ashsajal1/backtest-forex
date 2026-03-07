"use client";

import { Candle, StructureData } from "./structure";

interface ChartProps {
  candles: Candle[];
  visibleCount: number;
  revealCount: number;
  markIndex: number;
  structureData?: StructureData;
}

export default function Chart({
  candles,
  visibleCount,
  revealCount,
  markIndex,
  structureData,
}: ChartProps) {
  const displayCount = visibleCount + revealCount;
  const displayCandles = candles.slice(0, displayCount);

  if (displayCandles.length === 0) return null;

  const minLow = Math.min(...displayCandles.map((c) => c.low));
  const maxHigh = Math.max(...displayCandles.map((c) => c.high));
  const range = maxHigh - minLow || 1;
  const padding = range * 0.1;

  const width = 1000;
  const height = 250;
  const candleWidth = width / displayCandles.length;

  const scaleY = (value: number) =>
    height - ((value - minLow + padding) / (range + padding * 2)) * height;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[200px] sm:h-[250px]"
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
          opacity =
            revealProgress < revealCount
              ? (revealProgress + 1) / revealCount
              : 1;
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
              height={Math.max(
                1,
                Math.abs(scaleY(candle.open) - scaleY(candle.close))
              )}
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

      <text x="5" y="15" fill="#9ca3af" fontSize="8">
        {displayCandles[0]?.datetime || "-"}
      </text>
      <text x={width - 80} y="15" fill="#9ca3af" fontSize="8">
        {displayCandles[displayCandles.length - 1]?.datetime || "-"}
      </text>
    </svg>
  );
}
