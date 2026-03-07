import { describe, expect, it } from 'vitest'

const mockData = [
  { datetime: '2026-02-16 11:35:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
  { datetime: '2026-02-16 11:40:00', open: '1.18050', high: '1.18150', low: '1.18000', close: '1.18100' },
  { datetime: '2026-02-16 11:45:00', open: '1.18100', high: '1.18200', low: '1.18050', close: '1.18150' },
  { datetime: '2026-02-17 11:35:00', open: '1.18150', high: '1.18250', low: '1.18100', close: '1.18200' },
  { datetime: '2026-02-17 11:40:00', open: '1.18200', high: '1.18300', low: '1.18150', close: '1.18250' },
  { datetime: '2026-02-17 11:45:00', open: '1.18250', high: '1.18350', low: '1.18200', close: '1.18300' },
  { datetime: '2026-02-20 11:35:00', open: '1.18300', high: '1.18400', low: '1.18250', close: '1.18350' },
  { datetime: '2026-02-20 11:40:00', open: '1.18350', high: '1.18450', low: '1.18300', close: '1.18400' },
  { datetime: '2026-02-20 11:45:00', open: '1.18400', high: '1.18500', low: '1.18350', close: '1.18450' },
]

function parseCandles(data: any[]): any[] {
  const filtered = data.filter(item => {
    const date = new Date(item.datetime);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  });
  const reversed = [...filtered].reverse();
  return reversed.map((item, index) => ({
    time: index,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    datetime: item.datetime,
  }));
}

describe('parseCandles', () => {
  it('should filter out Saturday', () => {
    const saturdayData = [
      { datetime: '2026-02-21 11:35:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
    ]
    const result = parseCandles(saturdayData)
    expect(result.length).toBe(0)
  })

  it('should filter out Sunday', () => {
    const sundayData = [
      { datetime: '2026-02-22 11:35:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
    ]
    const result = parseCandles(sundayData)
    expect(result.length).toBe(0)
  })

  it('should keep weekdays', () => {
    const result = parseCandles(mockData)
    expect(result.length).toBe(9)
  })

  it('should reverse data', () => {
    const result = parseCandles(mockData)
    expect(result[0].datetime).toBe('2026-02-20 11:45:00')
    expect(result[result.length - 1].datetime).toBe('2026-02-16 11:35:00')
  })
})
