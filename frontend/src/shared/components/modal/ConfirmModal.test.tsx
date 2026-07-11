// 테스트에 필요한 도구들을 '@testing-library/react'에서 가져옴
// fireEvent: 마우스 클릭, 키보드 입력 등 사용자의 행동을 흉내 내는 도구
// render: 리액트 컴포넌트를 브라우저가 없는 가상의 화면에 그려주는 도구
// screen: 그려진 가상 화면 그 자체 (이 안에서 버튼이나 글자를 찾을 때 사용)
import { fireEvent, render, screen } from '@testing-library/react';
// 테스트 프레임워크인 'vitest'에서 필요한 도구들을 가져옴
// describe: 여러 테스트 케이스를 묶어주는 폴더 역할
// expect: 'A는 B일 것이다'라고 예상하고 검증하는 도구
// it: 개별 테스트 케이스를 작성하는 단위 (주로 이러이러해야 한다라고 적음)
// vi: 가짜 함수(Mock)를 만들거나 시간을 조작할 때 쓰는 만능 유틸리티
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 테스트할 대상인 실제 ConfirmModal 컴포넌트
import ConfirmModal from '@/shared/components/modal/ConfirmModal';

// ConfirmModal이라는 이름으로 테스트 묶음을 시작
describe('ConfirmModal', () => {
  // 각 테스트 케이스가 실행되기 직전에 한 번씩 실행되는 구문
  beforeEach(() => {
    // 가상 DOM(document.body)에 modal-root div를 강제로 만들어 줌
    // 그래야 BaseModal이 이걸 찾아서 createPortal을 정상적으로 실행할 수 있음

    // createPortal: 모달은 화면 가장 맨 위에 떠있어야 하는데 부모 요소의 z-index가
    // 낮다면 아무리 높게 해줘도 부모 아래에 깔리기 때문에 React 상으로는 컴포넌트를
    // 호출한 부분에 속해서 리액트 생명주기를 따라가지만 HTML 상으로는 독립된 공간인
    // modal-root로 보내는 용도
    const modalRoot = document.createElement('div');
    modalRoot.setAttribute('id', 'modal-root');
    document.body.appendChild(modalRoot);
  });

  // 각 테스트 케이스가 끝난 직후에 실행되는 구문
  afterEach(() => {
    // 다음 테스트에 이전 DOM 상태가 영향을 주지 못하도록 클린업
    document.body.innerHTML = '';
  });

  // 첫 번째 테스트: 모달이 화면에 잘 나타나는지 확인
  it('isOpen이 true일 때 모달이 렌더링되어야 한다', () => {
    // 컴포넌트에 넘겨줄 가짜(빈 껍데기) 함수들을 만듦
    // 당장 진짜 로직이 실행될 필요는 없고 props로 함수를 요구하니까 모양만 맞춰줌
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    // ConfirmModal 컴포넌트를 가상 화면에 렌더링
    render(
      <ConfirmModal
        // 모달을 열어둔 상태로 설정
        isOpen={true}
        // 모달 제목 설정
        title='테스트 경고'
        // 모달 설명 설정
        description='테스트 설명입니다.'
        // 아까 만든 가짜 확인 함수 전달
        onConfirm={handleConfirm}
        // 아까 만든 가짜 취소 함수 전달
        onCancel={handleCancel}
      />,
    );

    // 가상 화면(screen)에서 테스트 경고라는 글자를 찾아서
    // 그 글자가 문서 안(화면)에 실제로 존재하는지(toBeInTheDocument) 검증
    expect(screen.getByText('테스트 경고')).toBeInTheDocument();

    // 테스트 설명입니다.라는 글자가 화면에 잘 렌더링되었는지 확인
    expect(screen.getByText('테스트 설명입니다.')).toBeInTheDocument();
  });

  // 두 번째 테스트: 버튼을 눌렀을 때 함수가 제대로 실행되는지 확인
  it('취소 버튼과 확인 버튼 클릭 시 각각의 콜백 함수가 호출되어야 한다', () => {
    // 클릭했을 때 실행됐는지 기록을 남길 가짜 함수들을 만듦
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    // 컴포넌트를 가상 화면에 렌더링
    render(
      <ConfirmModal
        isOpen={true}
        title='테스트'
        description='테스트'
        // 확인 버튼에 들어갈 텍스트를 명확히 지정
        confirmText='확인버튼'
        // 취소 버튼에 들어갈 텍스트를 명확히 지정
        cancelText='취소버튼'
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
    );

    // 사용자가 마우스를 움직여서 취소버튼이라는 글자를 가진 요소를 클릭하는 행동을 흉내
    fireEvent.click(screen.getByText('취소버튼'));

    // 클릭을 했으니 취소 함수(handleCancel)가 정확히 1번(toHaveBeenCalledTimes(1)) 호출되었는지 확인
    expect(handleCancel).toHaveBeenCalledTimes(1);

    // 확인버튼을 클릭하는 행동을 흉내
    fireEvent.click(screen.getByText('확인버튼'));

    // 확인 함수(handleConfirm) 정확히 1번 호출되었는지 확인
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
