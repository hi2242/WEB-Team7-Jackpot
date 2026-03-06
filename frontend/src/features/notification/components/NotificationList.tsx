import { useEffect, useRef } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate } from 'react-router';

import { getLabeledQnAListApi } from '@/features/notification/api/notificationApi';
import NotificationItem from '@/features/notification/components/NotificationItem';
import {
  NOTIFICATION_MESSAGES,
  NOTIFICATION_TYPE,
} from '@/features/notification/constants';
import { NOTIFICATION_QUERY_KEYS } from '@/features/notification/hooks/queries/notificationKeys';
import {
  useGetAllNotification,
  useReadEachNotification,
} from '@/features/notification/hooks/useNotification';
import type { NotificationType } from '@/features/notification/types/notification';
import { ApiError } from '@/shared/api/apiClient';
import { queryClient } from '@/shared/hooks/queries/queryClient';
import { useToastMessageContext } from '@/shared/hooks/toastMessage/useToastMessageContext';

interface NotificationListProps {
  handleDropdown: (isOpen: boolean) => void;
}

const NotificationList = ({ handleDropdown }: NotificationListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data: notificationListData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useGetAllNotification();

  // 2차원 배열(pages)을 1차원 배열로 평탄화
  const allNotifications = notificationListData
    ? notificationListData.pages.flatMap((page) => page.notifications)
    : [];

  // 가상화 설정
  const rowVirtualizer = useVirtualizer({
    // 데이터 끝에 로딩 바를 위한 알림 아이템 1개
    count: hasNextPage ? allNotifications.length + 1 : allNotifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= allNotifications.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    virtualItems,
    hasNextPage,
    isFetchingNextPage,
    allNotifications.length,
    fetchNextPage,
  ]);
  const { showToast } = useToastMessageContext();
  const { mutateAsync: readEachNotification } = useReadEachNotification();

  const navigate = useNavigate();

  const handleNotificationClick = async (notification: NotificationType) => {
    const { id, type, meta } = notification;

    // 공통: 알림 읽음 처리
    readEachNotification(Number(id));

    // 피드백 타입 처리
    if (type === NOTIFICATION_TYPE.FEEDBACK) {
      navigate(`/cover-letter/edit/${meta.coverLetterId}?qnAId=${meta.qnAId}`);
      handleDropdown(false);
      return;
    }

    // 라벨링 완료 타입 처리
    try {
      // 404 발생 시 ApiError를 던짐
      await queryClient.fetchQuery({
        queryKey: NOTIFICATION_QUERY_KEYS.qna(meta.jobId),
        queryFn: () => getLabeledQnAListApi(meta.jobId),
      });

      navigate(`/upload/labeling/${meta.jobId}/0/0`);
      handleDropdown(false);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        showToast(NOTIFICATION_MESSAGES.NOTIFICATION.ALREADY_SAVED, false);
      } else {
        showToast(NOTIFICATION_MESSAGES.NOTIFICATION.ERROR, false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-40 items-center justify-center text-gray-400'>
        {NOTIFICATION_MESSAGES.STATE.LOADING}
      </div>
    );
  }

  if (!notificationListData) return null;

  const isEmpty = notificationListData.pages[0]?.notifications.length === 0;

  if (isEmpty) {
    return (
      <div className='flex h-60 w-full flex-col items-center justify-center gap-4 text-center'>
        <div className='flex flex-col gap-1'>
          <span className='text-body-m font-medium text-gray-600'>
            {NOTIFICATION_MESSAGES.EMPTY.TITLE}
          </span>
          <span className='text-caption-m text-gray-400'>
            {NOTIFICATION_MESSAGES.EMPTY.SUB}
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={parentRef}
      className='fixed-scroll-bar max-h-100 w-full overflow-y-auto px-1'
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const isLoaderRow = virtualRow.index > allNotifications.length - 1;
          const notification = allNotifications[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className='flex items-center justify-center text-gray-400'>
                  {isFetchingNextPage
                    ? NOTIFICATION_MESSAGES.STATE.LOADING
                    : ''}
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => handleNotificationClick(notification)}
                  className='w-full cursor-pointer rounded-md py-[0.875rem] text-left transition-colors duration-200 hover:bg-gray-50'
                >
                  <NotificationItem data={notification} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationList;
