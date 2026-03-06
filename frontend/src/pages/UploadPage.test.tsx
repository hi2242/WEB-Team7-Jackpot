// 테스트 시 가상의 마우스 클릭이나 렌더링, 화면 검색을 도와주는 도구들
import { render, screen } from '@testing-library/react';
// 주소 표시줄이 없는 테스트 환경에서 가상의 라우터(주소)를 만들어주는 도구들
import { MemoryRouter } from 'react-router';
// Vitest의 테스트 제어 및 검증 도구들
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 테스트할 대상인 UploadPage 컴포넌트
import UploadPage from '@/pages/UploadPage';

// 라우터 이동을 추적하기 위한 가짜 함수 생성
// useNavigate가 호출될 때 진짜 페이지를 이동하는 대신, 이 빈 함수가 실행되며 기록을 남김
const mockNavigate = vi.fn();

// react-router 라이브러리 전체를 가로채서 조작
vi.mock('react-router', async (importOriginal) => {
  // 원래 react-router가 가진 모든 기능(useLocation, Outlet 등)을 그대로 가져옴
  // 여기서 <typeof import('react-router')>를 명시
  const actual = await importOriginal<typeof import('react-router')>();

  return {
    // 원래 기능들은 그대로 유지 (...actual)
    ...actual,
    // 오직 useNavigate 훅만 만든 가짜 함수를 반환하도록 덮어씌움
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid='mock-outlet'>자식 컴포넌트 영역</div>,
  };
});

// UploadPage에 대한 테스트 묶음을 시작
describe('UploadPage', () => {
  // 모든 개별 테스트(it)가 시작되기 직전에 항상 실행되는 설정 코드
  beforeEach(() => {
    // 이전 테스트에서 남은 가짜 함수들의 호출 기록을 초기화
    vi.clearAllMocks();

    // 브라우저의 뒤로 가기/앞으로 가기 API인 window.history의 함수들을 감시(Spy)
    // 실제로 동작하게 두면서 이 함수가 호출되었는지를 나중에 검증할 수 있게 해줌
    vi.spyOn(window.history, 'pushState');
    vi.spyOn(window.history, 'forward');

    // ConfirmModal이 렌더링될 수 있도록 포털 도착지(modal-root)를 가상 문서에 만들어 줌
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  });

  // 모든 개별 테스트(it)가 끝난 직후에 항상 실행되는 클린업
  afterEach(() => {
    // 감시(Spy)했던 브라우저 함수들을 원래 상태로 되돌려 놓음
    vi.restoreAllMocks();
    // 다음 테스트를 위해 가상 문서를 클린업
    document.body.innerHTML = '';
  });

  it('기본 경로(/upload) 접속 시 헤더와 Outlet 자식 영역이 렌더링된다.', () => {
    render(
      <MemoryRouter initialEntries={['/upload']}>
        <UploadPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        '회사별, 문항별로 나만의 자기소개서를 작성하고 관리할 수 있어요',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();
  });

  it('경로가 input를 포함하면 Step 1 상태로 렌더링된다', () => {
    render(
      <MemoryRouter initialEntries={['/upload/input']}>
        <UploadPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('질문과 답변으로 구성된 자기소개서 파일 혹은 텍스트를 입력해주세요!')).toBeInTheDocument();
  });

  it('경로가 labeling을 포함하면 Step 2 상태로 렌더링된다', () => {
    render(
      <MemoryRouter initialEntries={['upload/labeling']}>
        <UploadPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('라벨링이 완료되었어요!')).toBeInTheDocument();
  });

  it('경로가 complete를 포함하면 Step 3 상태로 렌더링된다', () => {
    render(
      <MemoryRouter initialEntries={['/upload/complete']}>
        <UploadPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('저장이 완료되었어요!')).toBeInTheDocument();
  });

  
});
