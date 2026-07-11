import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- 외부 의존성 모킹 ---
const mockSetSearchParams = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

vi.mock('@/shared/hooks/toastMessage/useToastMessageContext', () => ({
  useToastMessageContext: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/shared/utils/validation', () => ({
  validateSearchKeyword: () => ({ isValid: true, message: '' }),
}));

// 모킹 선언 후에 import (호이스팅 주의)
import useSearch from '@/shared/hooks/useSearch';

const typeChar = (
  fn: (e: ChangeEvent<HTMLInputElement>) => void,
  value: string,
) => fn({ target: { value } } as ChangeEvent<HTMLInputElement>);

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetSearchParams.mockClear();
    mockSearchParams = new URLSearchParams();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('연속 입력해도 300ms 후 URL 동기화는 단 한 번만 일어난다 (디바운싱)', () => {
    const { result } = renderHook(() => useSearch());

    // "react" 를 한 글자씩 5번 입력
    ['r', 're', 'rea', 'reac', 'react'].forEach((v) => {
      act(() => typeChar(result.current.handleChange, v));
    });

    // 디바운스 시간 경과 전에는 동기화 안 됨
    expect(mockSetSearchParams).not.toHaveBeenCalled();

    // 300ms 점프
    act(() => vi.advanceTimersByTime(300));

    // 5번 입력했지만 동기화(=API 트리거)는 1번
    expect(mockSetSearchParams).toHaveBeenCalledTimes(1);
  });

  it('localStorage에 저장된 검색어가 있으면 그 값으로 초기화되고 isInitializing이 true다', () => {
    localStorage.setItem('recentSearch', 'saved-keyword');
    // URL은 아직 비어있는 상태

    const { result } = renderHook(() =>
      useSearch({ storageKey: 'recentSearch' }),
    );

    expect(result.current.keyword).toBe('saved-keyword');
    expect(result.current.isInitializing).toBe(true); // URL 동기화 전이므로
  });

  it('handleClear는 localStorage와 URL 파라미터를 즉시 제거한다', () => {
    localStorage.setItem('recentSearch', 'saved-keyword');

    const { result } = renderHook(() =>
      useSearch({ storageKey: 'recentSearch' }),
    );

    act(() => result.current.handleClear());

    expect(localStorage.getItem('recentSearch')).toBeNull();
    expect(result.current.keyword).toBe('');
    expect(mockSetSearchParams).toHaveBeenCalled();
  });
});
