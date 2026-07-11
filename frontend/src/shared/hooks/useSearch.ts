import { type ChangeEvent, useCallback, useEffect, useState } from 'react';

import { useSearchParams } from 'react-router';

import { useToastMessageContext } from '@/shared/hooks/toastMessage/useToastMessageContext';
import { validateSearchKeyword } from '@/shared/utils/validation';

interface UseSearchProps {
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

  // 1. 현재 URL 파라미터와 로컬 스토리지 값을 동기적으로 확인
  const currentQueryParam = searchParams.get(queryKey) || '';
  const savedKeyword =
    activeCondition && storageKey ? localStorage.getItem(storageKey) || '' : '';

  // 현재 페이지 파라미터 추출
  const rawPage = Number(searchParams.get(pageKey));
  const currentPageParam = isPagination
    ? Number.isInteger(rawPage) && rawPage > 0
      ? rawPage
      : 1
    : undefined;

  // 로컬 스토리지에는 검색어가 있는데, URL에는 아직 없는 상태인가?
  const isSyncingUrl =
    activeCondition &&
    savedKeyword !== '' &&
    currentQueryParam !== savedKeyword;

  // 2. 검색어 상태 초기화
  const [keyword, setKeyword] = useState(() => {
    if (!activeCondition) return '';
    if (savedKeyword) return savedKeyword;
    return currentQueryParam;
  });

  // 3. 탭 전환 감지 및 렌더링 중 상태 덮어쓰기
  const [prevActiveCondition, setPrevActiveCondition] =
    useState(activeCondition);
  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);

  if (
    activeCondition !== prevActiveCondition ||
    storageKey !== prevStorageKey
  ) {
    setPrevActiveCondition(activeCondition);
    setPrevStorageKey(storageKey);
    setKeyword(savedKeyword);
  }

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  }, []);

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

    // 즉시 로컬 스토리지에서 삭제하여 무한 로딩(isSyncingUrl = true) 방지
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(queryKey);
        if (isPagination) next.delete(pageKey);

        return next;
      },
      { replace: true },
    );
  }, [queryKey, pageKey, isPagination, setSearchParams, storageKey]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!isPagination) return;
      if (!Number.isInteger(newPage) || newPage < 1) return;

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(pageKey, newPage.toString());
        return next;
      });
    },
    [isPagination, pageKey, setSearchParams],
  );

  // 5. 외부 시스템(URL, 스토리지) 동기화 Effect (Calling effect 제거됨)
  useEffect(() => {
    if (!activeCondition) {
      setSearchParams(
        (prev) => {
          const hasQuery = prev.has(queryKey);
          const hasPage = isPagination && prev.has(pageKey);
          if (!hasQuery && !hasPage) return prev;

          const next = new URLSearchParams(prev);
          if (hasQuery) next.delete(queryKey);
          if (hasPage) next.delete(pageKey);
          return next;
        },
        { replace: true },
      );
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
      }

      // 로컬 스토리지 동기화
      if (storageKey) {
        if (trimmedKeyword) localStorage.setItem(storageKey, trimmedKeyword);
        else localStorage.removeItem(storageKey);
      }

      // URL 동기화
      if (currentQueryParam !== trimmedKeyword) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (trimmedKeyword) {
              next.set(queryKey, trimmedKeyword);
              if (isPagination) next.set(pageKey, '1');
            } else {
              next.delete(queryKey);
              if (isPagination) next.delete(pageKey);
            }
            return next;
          },
          { replace: true },
        );
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
