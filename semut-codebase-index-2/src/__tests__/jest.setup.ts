// Jest setup file for browser API mocking

// Mock matchMedia which is not available in jsdom by default
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver which is often needed for UI libraries
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver which might be used by some components
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock File and related APIs if needed for file upload components
global.File = class MockFile {
  constructor(parts: any[], filename: string, properties: any) {
    this.name = filename;
    this.size = properties.size || 1024;
    this.type = properties.type || 'application/pdf';
    this.lastModified = Date.now();
  }
  name: string;
  size: number;
  type: string;
  lastModified: number;
} as any;

global.Blob = class MockBlob {
  constructor() {
    // Mock blob implementation
  }
} as any;

// Mock HTMLInputElement.files property
Object.defineProperty(HTMLInputElement.prototype, 'files', {
  writable: true,
  value: null
});

// Mock fetch API if needed for network requests
global.fetch = jest.fn();

// Suppress console.log in tests unless explicitly needed
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };