import { vi } from 'vitest';

import '@testing-library/jest-dom';

// jsdom에 없는 ResizeObserver 모킹 (vi.stubGlobal 사용)
vi.stubGlobal(
  'ResizeObserver',
  vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
);

// jsdom에 없는 matchMedia 모킹 (vi.stubGlobal 사용)
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
);
