import { describe, expect, it, vi } from 'vitest'

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
  it('should filter out weekend days (Saturday)', () => {
    const saturdayData = [
      { datetime: '2026-02-21 11:35:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
      { datetime: '2026-02-21 11:40:00', open: '1.18050', high: '1.18150', low: '1.18000', close: '1.18100' },
    ]
    const result = parseCandles(saturdayData)
    expect(result.length).toBe(0)
  })

  it('should filter out weekend days (Sunday)', () => {
    const sundayData = [
      { datetime: '2026-02-22 11:35:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
      { datetime: '2026-02-22 11:40:00', open: '1.18050', high: '1.18150', low: '1.18000', close: '1.18100' },
    ]
    const result = parseCandles(sundayData)
    expect(result.length).toBe(0)
  })

  it('should keep weekdays (Monday to Friday)', () => {
    const result = parseCandles(mockData)
    expect(result.length).toBe(9)
  })

  it('should reverse data so oldest is first', () => {
    const result = parseCandles(mockData)
    expect(result[0].datetime).toBe('2026-02-20 11:45:00')
    expect(result[result.length - 1].datetime).toBe('2026-02-16 11:35:00')
  })

  it('should parse string values to floats', () => {
    const result = parseCandles(mockData)
    expect(result[0].open).toBe(1.184)
    expect(result[result.length - 1].close).toBe(1.1805)
    expect(typeof result[0].open).toBe('number')
  })

  it('should handle empty data', () => {
    const result = parseCandles([])
    expect(result.length).toBe(0)
  })

  it('should remove all weekend data from mixed data', () => {
    const mixedData = [
      { datetime: '2026-02-16 11:35:00', open: '1.18000', high: '1.18100', low: '1.17900', close: '1.18050' },
      { datetime: '2026-02-17 11:35:00', open: '1.18100', high: '1.18200', low: '1.18000', close: '1.18150' },
      { datetime: '2026-02-18 11:35:00', open: '1.18200', high: '1.18300', low: '1.18100', close: '1.18250' },
      { datetime: '2026-02-19 11:35:00', open: '1.18300', high: '1.18400', low: '1.18200', close: '1.18300' },
      { datetime: '2026-02-20 11:35:00', open: '1.18400', high: '1.18500', low: '1.18300', close: '1.18450' },
      { datetime: '2026-02-21 11:35:00', open: '1.18500', high: '1.18600', low: '1.18400', close: '1.18550' },
      { datetime: '2026-02-22 11:35:00', open: '1.18600', high: '1.18700', low: '1.18500', close: '1.18650' },
      { datetime: '2026-02-23 11:35:00', open: '1.18700', high: '1.18800', low: '1.18600', close: '1.18750' },
    ]
    const result = parseCandles(mixedData)
    expect(result.length).toBe(6)
  })
})
