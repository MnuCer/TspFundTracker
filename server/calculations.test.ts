import { describe, expect, it } from 'vitest';
import {
  calculateEMA,
  calculateMACD,
  calculatePercentageChange,
  calculateMomentum,
  calculateMomentumPeriods,
  calculatePerformanceStats,
} from './calculations';

describe('Calculations', () => {
  describe('calculatePercentageChange', () => {
    it('should calculate positive percentage change', () => {
      const result = calculatePercentageChange(110, 100);
      expect(result).toBeCloseTo(10, 2);
    });

    it('should calculate negative percentage change', () => {
      const result = calculatePercentageChange(90, 100);
      expect(result).toBeCloseTo(-10, 2);
    });

    it('should handle zero previous price', () => {
      const result = calculatePercentageChange(100, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateMomentum', () => {
    it('should calculate momentum correctly', () => {
      const result = calculateMomentum(120, 100);
      expect(result).toBeCloseTo(20, 2);
    });

    it('should calculate negative momentum', () => {
      const result = calculateMomentum(80, 100);
      expect(result).toBeCloseTo(-20, 2);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate EMA for sufficient data', () => {
      const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const ema = calculateEMA(prices, 3);
      expect(ema.length).toBeGreaterThan(0);
      expect(ema[ema.length - 1]).toBeGreaterThan(0);
    });

    it('should return empty array for insufficient data', () => {
      const prices = [1, 2];
      const ema = calculateEMA(prices, 5);
      expect(ema.length).toBe(0);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD for sufficient data', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
      const { macdLine, signal, histogram } = calculateMACD(prices);
      expect(macdLine.length).toBeGreaterThan(0);
      expect(signal.length).toBeGreaterThan(0);
      expect(histogram.length).toBeGreaterThan(0);
    });

    it('should return empty arrays for insufficient data', () => {
      const prices = [1, 2, 3, 4, 5];
      const { macdLine, signal, histogram } = calculateMACD(prices);
      expect(macdLine.length).toBe(0);
      expect(signal.length).toBe(0);
      expect(histogram.length).toBe(0);
    });
  });

  describe('calculateMomentumPeriods', () => {
    it('should calculate momentum for multiple periods', () => {
      const now = new Date();
      const prices = [
        { date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), price: 100 },
        { date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), price: 110 },
        { date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), price: 115 },
        { date: now, price: 120 },
      ];

      const result = calculateMomentumPeriods(prices);
      expect(result.momentum3Month).toBeGreaterThan(0);
      expect(result.momentum1Month).toBeGreaterThan(0);
      expect(result.momentum2Week).toBeGreaterThan(0);
    });

    it('should return zero momentum for empty array', () => {
      const result = calculateMomentumPeriods([]);
      expect(result.momentum1Month).toBe(0);
      expect(result.momentum2Week).toBe(0);
      expect(result.momentum3Month).toBe(0);
    });
  });

  describe('calculatePerformanceStats', () => {
    it('should calculate performance statistics', () => {
      const prices = [100, 105, 103, 108, 110, 102, 115];
      const stats = calculatePerformanceStats(prices);

      expect(stats.min).toBe(100);
      expect(stats.max).toBe(115);
      expect(stats.current).toBe(115);
      expect(stats.average).toBeGreaterThan(100);
      expect(stats.average).toBeLessThan(115);
      expect(stats.volatility).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const stats = calculatePerformanceStats([]);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.current).toBe(0);
      expect(stats.volatility).toBe(0);
    });

    it('should handle single price', () => {
      const stats = calculatePerformanceStats([100]);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(100);
      expect(stats.current).toBe(100);
      expect(stats.average).toBe(100);
      expect(stats.volatility).toBe(0);
    });
  });
});
