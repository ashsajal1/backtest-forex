export type DrawingTool = "trendline" | "line" | "longshort" | "fibonacci" | "none";

export interface Point {
  x: number;
  y: number;
  price?: number;
  candleIndex?: number;
}

export interface Trendline {
  id: string;
  type: "trendline";
  points: Point[];
}

export interface Line {
  id: string;
  type: "line";
  startPoint: Point;
  endPoint: Point;
}

export interface LongShort {
  id: string;
  type: "longshort";
  startPoint: Point;
  endPoint: Point;
  direction: "long" | "short";
  priceDiff: number;
  pipDiff: number;
  candleCount: number;
}

export interface FibonacciLevel {
  level: number;
  price: number;
}

export interface Fibonacci {
  id: string;
  type: "fibonacci";
  startPoint: Point;
  endPoint: Point;
  levels: FibonacciLevel[];
}

export type Drawing = Trendline | Line | LongShort | Fibonacci;

export const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function calculateFibonacciLevels(startPrice: number, endPrice: number): FibonacciLevel[] {
  const diff = endPrice - startPrice;
  return FIBONACCI_LEVELS.map((level) => ({
    level,
    price: startPrice + diff * level,
  }));
}

export function calculateLongShort(
  startPoint: Point,
  endPoint: Point,
  candles: { close: number }[]
): LongShort {
  const priceDiff = Math.abs((endPoint.price || 0) - (startPoint.price || 0));
  const pipDiff = priceDiff * 10000;
  const candleCount = Math.abs(
    (endPoint.candleIndex || 0) - (startPoint.candleIndex || 0)
  );

  const startPrice = startPoint.price || 0;
  const endPrice = endPoint.price || 0;
  const direction: "long" | "short" = endPrice > startPrice ? "long" : "short";

  return {
    id: crypto.randomUUID(),
    type: "longshort",
    startPoint,
    endPoint,
    direction,
    priceDiff,
    pipDiff,
    candleCount,
  };
}

export function generateDrawingId(): string {
  return crypto.randomUUID();
}
