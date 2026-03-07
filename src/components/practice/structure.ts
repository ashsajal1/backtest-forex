export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  datetime: string;
}

export interface SwingPoint {
  index: number;
  type: "high" | "low";
  price: number;
  label: "HH" | "HL" | "LH" | "LL" | null;
}

export interface StructureData {
  swings: SwingPoint[];
}

export function detectStructure(candles: Candle[]): StructureData {
  const swings: SwingPoint[] = [];
  if (candles.length < 5) return { swings };

  let swingHigh = -1;
  let swingLow = -1;

  for (let i = 2; i < candles.length - 2; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    const isSwingHigh =
      curr.high > prev.high &&
      curr.high > next.high &&
      curr.high > candles[i - 2].high &&
      curr.high > candles[i + 2].high;
    const isSwingLow =
      curr.low < prev.low &&
      curr.low < next.low &&
      curr.low < candles[i - 2].low &&
      curr.low < candles[i + 2].low;

    if (isSwingHigh) {
      let label: "HH" | "LH" | null = null;
      if (swingHigh !== -1 && curr.high > candles[swingHigh].high) {
        label = "HH";
      } else if (swingHigh !== -1) {
        label = "LH";
      }
      swings.push({ index: i, type: "high", price: curr.high, label });
      swingHigh = i;
    }

    if (isSwingLow) {
      let label: "HL" | "LL" | null = null;
      if (swingLow !== -1 && curr.low > candles[swingLow].low) {
        label = "HL";
      } else if (swingLow !== -1) {
        label = "LL";
      }
      swings.push({ index: i, type: "low", price: curr.low, label });
      swingLow = i;
    }
  }

  return { swings };
}

export function parseCandles(data: any): Candle[] {
  const values = Array.isArray(data) ? data : data.values;
  const filtered = values.filter((item: any) => {
    const date = new Date(item.datetime);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  });
  const reversed = [...filtered].reverse();
  return reversed.map((item: any, index: number) => ({
    time: index,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    datetime: item.datetime,
  }));
}
