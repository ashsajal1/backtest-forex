export type DrawingTool = "trendline" | "measurement" | "fibonacci" | "none";

export interface Point {
  x: number;
  y: number;
  price?: number;
  candleIndex?: number;
}

export interface Trendline {
  id: string;
  type: "trendline";
  startPoint: Point;
  endPoint: Point;
}

export interface Measurement {
  id: string;
  type: "measurement";
  startPoint: Point;
  endPoint: Point;
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

export type Drawing = Trendline | Measurement | Fibonacci;

export const FIBONACCI_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function calculateFibonacciLevels(startPrice: number, endPrice: number): FibonacciLevel[] {
  const diff = endPrice - startPrice;
  return FIBONACCI_LEVELS.map((level) => ({
    level,
    price: startPrice + diff * level,
  }));
}

export function calculateMeasurement(
  startPoint: Point,
  endPoint: Point,
  candles: { close: number }[]
): Measurement {
  const priceDiff = Math.abs((endPoint.price || 0) - (startPoint.price || 0));
  const pipDiff = priceDiff * 10000;
  const candleCount = Math.abs(
    (endPoint.candleIndex || 0) - (startPoint.candleIndex || 0)
  );

  return {
    id: crypto.randomUUID(),
    type: "measurement",
    startPoint,
    endPoint,
    priceDiff,
    pipDiff,
    candleCount,
  };
}

export function generateDrawingId(): string {
  return crypto.randomUUID();
}
