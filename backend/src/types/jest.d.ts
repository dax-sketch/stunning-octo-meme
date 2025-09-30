/// <reference types="jest" />

// This file ensures Jest types are available globally in test files
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add any custom matchers here if needed
    }
  }
}

export {};