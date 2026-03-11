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

export interface PullbackData {
  trend: "bullish" | "bearish";
  swingIndex: number;
  pullbackIndex: number;
  trendlineStart: { index: number; price: number };
  trendlineEnd: { index: number; price: number };
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

export function detectPullback(candles: Candle[], structureData: StructureData, markedIndex: number): PullbackData | null {
  const { swings } = structureData;
  if (swings.length < 2) return null;

  const swingsBeforeMarked = swings.filter(s => s.index < markedIndex && s.index >= markedIndex - 30);
  if (swingsBeforeMarked.length < 2) return null;

  const lastSwing = swingsBeforeMarked[swingsBeforeMarked.length - 1];
  const prevSwing = swingsBeforeMarked[swingsBeforeMarked.length - 2];

  // Bullish trend: HH + HL pattern, pullback from high
  if (lastSwing.type === "high" && prevSwing.type === "high") {
    if (lastSwing.price > prevSwing.price) {
      // Find the lowest point after the last swing high (pullback)
      const afterSwing = candles.slice(lastSwing.index + 1, markedIndex + 1);
      if (afterSwing.length === 0) return null;

      let minLow = afterSwing[0].low;
      let minIndex = lastSwing.index + 1;

      for (let i = 0; i < afterSwing.length; i++) {
        if (afterSwing[i].low < minLow) {
          minLow = afterSwing[i].low;
          minIndex = lastSwing.index + 1 + i;
        }
      }

      return {
        trend: "bearish",
        swingIndex: lastSwing.index,
        pullbackIndex: minIndex,
        trendlineStart: { index: prevSwing.index, price: prevSwing.price },
        trendlineEnd: { index: minIndex, price: minLow },
      };
    }
  }

  // Bearish trend: LL + LH pattern, pullback from low
  if (lastSwing.type === "low" && prevSwing.type === "low") {
    if (lastSwing.price > prevSwing.price) {
      // Find the highest point after the last swing low (pullback)
      const afterSwing = candles.slice(lastSwing.index + 1, markedIndex + 1);
      if (afterSwing.length === 0) return null;

      let maxHigh = afterSwing[0].high;
      let maxIndex = lastSwing.index + 1;

      for (let i = 0; i < afterSwing.length; i++) {
        if (afterSwing[i].high > maxHigh) {
          maxHigh = afterSwing[i].high;
          maxIndex = lastSwing.index + 1 + i;
        }
      }

      return {
        trend: "bullish",
        swingIndex: lastSwing.index,
        pullbackIndex: maxIndex,
        trendlineStart: { index: prevSwing.index, price: prevSwing.price },
        trendlineEnd: { index: maxIndex, price: maxHigh },
      };
    }
  }

  return null;
}

export function detectAllPullbacks(candles: Candle[], structureData: StructureData): PullbackData[] {
  const { swings } = structureData;
  const pullbacks: PullbackData[] = [];
  
  if (swings.length < 2) return pullbacks;

  // Find consecutive swing highs (HH pattern) - bearish pullbacks
  for (let i = 1; i < swings.length; i++) {
    const currSwing = swings[i];
    const prevSwing = swings[i - 1];

    // Check for HH pattern (two consecutive swing highs where current is higher)
    if (currSwing.type === "high" && prevSwing.type === "high" && currSwing.price > prevSwing.price) {
      // Find the lowest point after the current swing high (pullback)
      const afterSwing = candles.slice(currSwing.index + 1);
      if (afterSwing.length === 0) continue;

      let minLow = afterSwing[0].low;
      let minIndex = currSwing.index + 1;

      for (let j = 0; j < afterSwing.length; j++) {
        if (afterSwing[j].low < minLow) {
          minLow = afterSwing[j].low;
          minIndex = currSwing.index + 1 + j;
        }
      }

      pullbacks.push({
        trend: "bearish",
        swingIndex: currSwing.index,
        pullbackIndex: minIndex,
        trendlineStart: { index: prevSwing.index, price: prevSwing.price },
        trendlineEnd: { index: minIndex, price: minLow },
      });
    }

    // Check for LL pattern (two consecutive swing lows where current is higher)
    if (currSwing.type === "low" && prevSwing.type === "low" && currSwing.price > prevSwing.price) {
      // Find the highest point after the current swing low (pullback)
      const afterSwing = candles.slice(currSwing.index + 1);
      if (afterSwing.length === 0) continue;

      let maxHigh = afterSwing[0].high;
      let maxIndex = currSwing.index + 1;

      for (let j = 0; j < afterSwing.length; j++) {
        if (afterSwing[j].high > maxHigh) {
          maxHigh = afterSwing[j].high;
          maxIndex = currSwing.index + 1 + j;
        }
      }

      pullbacks.push({
        trend: "bullish",
        swingIndex: currSwing.index,
        pullbackIndex: maxIndex,
        trendlineStart: { index: prevSwing.index, price: prevSwing.price },
        trendlineEnd: { index: maxIndex, price: maxHigh },
      });
    }
  }

  return pullbacks;
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
