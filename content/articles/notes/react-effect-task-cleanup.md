---
title: "React useEffect로 작업 상태를 동기화하고 정리하기"
description: "작업 ID 변경에 맞춰 요청을 시작하고 취소·늦은 응답·오류를 처리한다. 의존성과 StrictMode를 구분하는 컴포넌트 예제와 실습·풀이를 다룬다."
slug: "react-effect-task-cleanup"
date: "2022-01-18"
dateBasis: "notion"
updated: "2026-10-18"
topic: "notes"
kind: "note"
tags: ["React", "JavaScript", "Async"]
draft: false
---

## 요청한 순서와 응답한 순서는 다를 수 있다

[useEffect 노트](https://app.notion.com/p/3801f85868094581b9dff3ed27f52826)와 [UI 런타임 노트](https://app.notion.com/p/0f3fab6a743d4c2ea2510d7e51f65e2b)는 외부 가이드를 참고한 기록이다. 긴 번역문과 예제를 복제하지 않고 가상의 작업 조회 UI로 다시 구성했다. 원 출처는 [Dan Abramov의 useEffect 글](https://overreacted.io/a-complete-guide-to-useeffect/)이며 동작은 현재 [React useEffect 문서](https://react.dev/reference/react/useEffect)와 대조했다.

렌더는 현재 props·state로 UI를 계산한다. Effect는 네트워크·구독 같은 외부 시스템과 동기화한다. 단순히 props를 가공해 화면에 보여 줄 값을 만들기 위해 매번 Effect와 추가 state를 사용할 필요는 없다.

작업 A 요청 뒤 B로 전환했는데 A가 더 늦게 완료되면 B 화면을 A가 덮어쓸 수 있다. cleanup에서 이전 요청을 취소하고, 취소가 늦게 반영되더라도 이전 결과를 적용하지 않는 계약이 필요하다.

## 작은 작업 상태 컴포넌트

다음은 React 프로젝트의 `TaskStatus.jsx`다. API는 `/api/study/tasks/<id>`에서 `{ "status": "running" }` 같은 JSON을 반환한다고 가정한다. 실제 하네스 API가 아니다. React가 설치된 프로젝트에 이 컴포넌트를 import하고 `taskId`를 전달한다.

```jsx
import { useEffect, useState } from 'react';

export default function TaskStatus({ taskId }) {
  const [view, setView] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setView({ id: taskId, text: '불러오는 중' });
    async function load() {
      try {
        const response = await fetch('/api/study/tasks/' + encodeURIComponent(taskId),
          { signal: controller.signal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const body = await response.json();
        const allowed = ['queued', 'running', 'succeeded', 'failed'];
        if (!body || typeof body !== 'object' || !allowed.includes(body.status))
          throw new Error('응답 형식 오류');
        if (active) setView({ id: taskId, text: body.status });
      } catch (error) {
        if (active) setView({ id: taskId,
          text: error instanceof Error ? error.message : '요청 실패' });
      }
    }
    load();
    return () => { active = false; controller.abort(); };
  }, [taskId]);
  return <p role="status">{view?.id === taskId ? view.text : '불러오는 중'}</p>;
}
```

의존성은 taskId다. taskId가 바뀌면 이전 cleanup 후 새 setup이 실행된다. active는 각 Effect 실행의 클로저에 별도로 존재한다. 화면에서도 view.id를 비교해 다음 Effect 실행 전의 이전 결과를 새 작업 결과처럼 표시하지 않는다.

AbortController는 전송·응답 읽기를 취소할 수 있지만 서버가 이미 시작한 작업을 되돌리는 명령은 아니다. 작업 취소 API는 별도 기능이다. 네트워크 오류와 HTTP 비정상 응답도 다르므로 response.ok를 검사한다.

## StrictMode에서 중복처럼 보일 때

개발 StrictMode는 Effect의 setup·cleanup을 추가로 실행해 정리 누락을 드러낸다. 이 컴포넌트가 ‘요청이 무조건 한 번만 발생한다’고 보장하지 않는다. 서버의 변경 작업을 조회 Effect에 섞지 않고, 구독·타이머는 cleanup에서 대응해 해제한다. [React StrictMode](https://react.dev/reference/react/StrictMode)

## 실습과 풀이

1. A 응답을 500ms, B 응답을 50ms 늦춘다. A를 열고 곧바로 B를 연다. **풀이:** A가 늦게 도착해도 화면은 B 상태를 유지해야 한다. 단순 요청 횟수보다 최종 표시와 cleanup을 확인한다.
2. endpoint가 500 또는 잘못된 JSON을 돌려준다. **풀이:** 성공 상태로 표시하지 않고 오류가 보여야 한다. 유효한 JSON이어도 status가 허용 값이 아니면 형식 오류다.
3. 의존성을 빈 배열로 바꾼다. **풀이:** 최초 taskId의 조회만 유지되어 props와 동기화되지 않는다. lint 경고를 제거하려고 필요한 의존성을 숨기지 않는다.

## 확인한 범위

노션의 원 출처와 React 문서를 확인하고 컴포넌트를 새로 작성했다. React 빌드·브라우저 요청·StrictMode·지연 응답·실제 하네스 UI는 이번에 실행하지 않았다. 별도의 검증된 API 클라이언트나 캐시 기능을 포함한 예제도 아니다. AI를 작성 보조에 사용했다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [TypeScript interface와 실행 중 데이터 검증을 구분하기](/writing/typescript-interface-runtime-validation/)
