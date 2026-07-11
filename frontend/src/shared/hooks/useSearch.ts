import { type ChangeEvent, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router';

import { useToastMessageContext } from '@/shared/hooks/toastMessage/useToastMessageContext';
import { validateSearchKeyword } from '@/shared/utils/validation';

interface UseSearchProps<T> {
  queryKey?: string;
  fetchAction?: (keyword: string) => Promise<T>;
  isEnabled?: boolean;
  // 지정 시 검색어를 localStorage에 저장/복원 (탭 이동, 새로고침에도 유지)
  storageKey?: string;
}

export const useSearch = <T = unknown>({
  queryKey = 'keyword',
  fetchAction,
  isEnabled = true,
  storageKey,
}: UseSearchProps<T> = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToastMessageContext();

  // ✅ [중요] 객체 대신 실제 문자열 값을 변수로 추출
  const currentQueryParam = searchParams.get(queryKey) || '';

  // 1. 초기값 설정
  // URL에 값이 없고 storageKey가 주어진 경우, 저장된 검색어로 복원
  const [keyword, setKeyword] = useState(() => {
    if (!isEnabled) return '';
    if (!currentQueryParam && storageKey) {
      return localStorage.getItem(storageKey) ?? currentQueryParam;
    }
    return currentQueryParam;
  });

  // storage에서 복원한 값이 아직 URL과 동기화되지 않은 상태인지 여부
  const [isInitializing, setIsInitializing] = useState(
    () => isEnabled && !currentQueryParam && keyword !== currentQueryParam,
  );

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. URL 동기화 (외부 변경 감지)
  useEffect(() => {
    if (!isEnabled) {
      setKeyword('');
      return;
    }
    // 복원된 초기값이 아직 URL에 반영되기 전이면 덮어쓰지 않음
    if (isInitializing) return;
    // ✅ 의존성에 searchParams 객체가 아닌 문자열 값(currentQueryParam)을 사용
    if (keyword !== currentQueryParam) {
      setKeyword(currentQueryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueryParam, isEnabled, isInitializing]); // queryKey는 상수라 생략 가능

  // storageKey가 있으면 검색어가 바뀔 때마다 localStorage에 동기화
  useEffect(() => {
    if (!isEnabled || !storageKey || isInitializing) return;
    if (keyword) {
      localStorage.setItem(storageKey, keyword);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [keyword, isEnabled, storageKey, isInitializing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsInitializing(false);
    setKeyword(e.target.value);
    setErrorMessage(null);
  };

  // localStorage와 URL 파라미터를 즉시 초기화
  const handleClear = () => {
    if (storageKey) localStorage.removeItem(storageKey);
    setIsInitializing(false);
    setKeyword('');
    setErrorMessage(null);
    setData(null);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(queryKey);
    setSearchParams(nextParams);
  };

  // 3. 디바운싱: 타이핑 -> URL 업데이트
  useEffect(() => {
    if (!isEnabled) return;

    const timer = setTimeout(() => {
      setIsInitializing(false);

      if (keyword.trim() === '') {
        if (currentQueryParam !== '') {
          // 값이 있을 때만 삭제 시도
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete(queryKey);
          setSearchParams(nextParams);
          setData(null);
        }
        return;
      }

      const { isValid, message } = validateSearchKeyword(keyword);
      if (!isValid) {
        setErrorMessage(message);
        return;
      }

      // ✅ 현재 URL 값과 다를 때만 업데이트 (중복 호출 방지)
      if (currentQueryParam !== keyword) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set(queryKey, keyword);
        setSearchParams(nextParams);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, currentQueryParam, isEnabled]); // searchParams 제거

  // 4. API 호출
  useEffect(() => {
    if (!isEnabled) {
      setData(null);
      return;
    }

    // ✅ 여기서도 문자열 값인 currentQueryParam을 감시
    if (!currentQueryParam || !fetchAction) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 이미 가지고 있는 문자열 변수 사용
        const result = await fetchAction(currentQueryParam);
        setData(result);
      } catch (error) {
        console.error(error);
        showToast('검색 중 오류가 발생했습니다.', false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueryParam, fetchAction, isEnabled]); // searchParams, showToast 제거

  return {
    keyword,
    handleChange,
    handleClear,
    data,
    isLoading,
    errorMessage,
    isInitializing,
  };
};

export default useSearch;
