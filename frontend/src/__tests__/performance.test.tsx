import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  performanceMonitor,
  measureAsync,
  withPerformanceTracking,
} from '../utils/performance';

// Mock component for testing
const TestComponent: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  React.useEffect(() => {
    if (delay > 0) {
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait
      }
    }
  }, [delay]);

  return <div>Test Component</div>;
};

const TrackedTestComponent = withPerformanceTracking(
  TestComponent,
  'test-component'
);

describe('Performance Monitoring', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Performance Monitor', () => {
    it('should record metrics correctly', () => {
      performanceMonitor.recordMetric('test-metric', 100);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('test-metric');
      expect(metrics[0].value).toBe(100);
    });

    it('should calculate average metrics', () => {
      performanceMonitor.recordMetric('test-metric', 100);
      performanceMonitor.recordMetric('test-metric', 200);
      performanceMonitor.recordMetric('test-metric', 300);

      const average = performanceMonitor.getAverageMetric('test-metric');
      expect(average).toBe(200);
    });

    it('should limit metrics to prevent memory leaks', () => {
      // Record more than 100 metrics
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric(`metric-${i}`, i);
      }

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Component Performance Tracking', () => {
    it('should track component render time', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TrackedTestComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const metrics = performanceMonitor.getMetrics();
        const renderMetric = metrics.find(
          (m) => m.name === 'component-test-component-render'
        );
        expect(renderMetric).toBeDefined();
        expect(renderMetric?.value).toBeGreaterThan(0);
      });
    });

    it('should detect slow component renders', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(
        <QueryClientProvider client={queryClient}>
          <TrackedTestComponent delay={50} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        const metrics = performanceMonitor.getMetrics();
        expect(metrics.length).toBeGreaterThan(0);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Async Operation Measurement', () => {
    it('should measure async operations', async () => {
      const asyncOperation = () =>
        new Promise((resolve) => setTimeout(resolve, 100));

      await measureAsync(asyncOperation, 'test-async-operation');

      const metrics = performanceMonitor.getMetrics();
      const asyncMetric = metrics.find(
        (m) => m.name === 'test-async-operation'
      );
      expect(asyncMetric).toBeDefined();
      expect(asyncMetric?.value).toBeGreaterThanOrEqual(100);
    });

    it('should measure failed async operations', async () => {
      const failingOperation = () => Promise.reject(new Error('Test error'));

      try {
        await measureAsync(failingOperation, 'test-failing-operation');
      } catch (error) {
        // Expected to fail
      }

      const metrics = performanceMonitor.getMetrics();
      const errorMetric = metrics.find(
        (m) => m.name === 'test-failing-operation-error'
      );
      expect(errorMetric).toBeDefined();
    });
  });

  describe('Performance Thresholds', () => {
    it('should warn about slow API calls', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceMonitor.recordMetric('api-companies', 2000); // 2 seconds

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Slow performance detected: api-companies took 2000ms'
        )
      );

      consoleSpy.mockRestore();
    });

    it('should warn about slow page loads', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceMonitor.recordMetric('page-load-time', 5000); // 5 seconds

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Slow performance detected: page-load-time took 5000ms'
        )
      );

      consoleSpy.mockRestore();
    });
  });
});

// Integration test for React Query performance
describe('React Query Performance', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should cache queries effectively', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });

    // First call
    await queryClient.fetchQuery({
      queryKey: ['test'],
      queryFn: mockFetch,
    });

    // Second call should use cache
    await queryClient.fetchQuery({
      queryKey: ['test'],
      queryFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle cache invalidation correctly', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ data: 'test' });

    // First call
    await queryClient.fetchQuery({
      queryKey: ['test'],
      queryFn: mockFetch,
    });

    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: ['test'] });

    // Second call should fetch again
    await queryClient.fetchQuery({
      queryKey: ['test'],
      queryFn: mockFetch,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
