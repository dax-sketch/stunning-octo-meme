// Performance monitoring utilities
import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric(
                'page-load-time',
                navEntry.loadEventEnd - navEntry.fetchStart
              );
              this.recordMetric(
                'dom-content-loaded',
                navEntry.domContentLoadedEventEnd - navEntry.fetchStart
              );
              this.recordMetric(
                'first-paint',
                navEntry.responseEnd - navEntry.fetchStart
              );
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              // Track API calls
              if (resourceEntry.name.includes('/api/')) {
                this.recordMetric(
                  `api-${resourceEntry.name.split('/api/')[1]?.split('?')[0] || 'unknown'}`,
                  resourceEntry.responseEnd - resourceEntry.fetchStart
                );
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('largest-contentful-paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Type assertion for first-input entries which have processingStart
            const fidEntry = entry as PerformanceEntry & {
              processingStart: number;
            };
            if ('processingStart' in fidEntry) {
              this.recordMetric(
                'first-input-delay',
                fidEntry.processingStart - entry.startTime
              );
            }
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }
  }

  recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log significant performance issues
    if (this.isSlowMetric(name, value)) {
      console.warn(`Slow performance detected: ${name} took ${value}ms`);
    }
  }

  private isSlowMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      'page-load-time': 3000,
      'dom-content-loaded': 2000,
      'largest-contentful-paint': 2500,
      'first-input-delay': 100,
    };

    // API calls should be under 1 second
    if (name.startsWith('api-')) {
      return value > 1000;
    }

    return value > (thresholds[name] || 1000);
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAverageMetric(name: string): number {
    const relevantMetrics = this.metrics.filter((m) => m.name === name);
    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  const recordMetric = (name: string, value: number) => {
    performanceMonitor.recordMetric(name, value);
  };

  const getMetrics = () => performanceMonitor.getMetrics();

  const getAverageMetric = (name: string) =>
    performanceMonitor.getAverageMetric(name);

  return {
    recordMetric,
    getMetrics,
    getAverageMetric,
  };
};

// Higher-order component for measuring component render time
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      performanceMonitor.recordMetric(
        `component-${componentName}-render`,
        endTime - startTime
      );
    });

    return React.createElement(WrappedComponent, props);
  };
};

// Utility for measuring async operations
export const measureAsync = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  try {
    const result = await operation();
    const endTime = performance.now();
    performanceMonitor.recordMetric(operationName, endTime - startTime);
    return result;
  } catch (error) {
    const endTime = performance.now();
    performanceMonitor.recordMetric(
      `${operationName}-error`,
      endTime - startTime
    );
    throw error;
  }
};

// Web Vitals reporting
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};
