---
title: "CSS Grid·Flex와 긴 코드·표의 가로 넘침 해결"
description: "min-content와 자동 최소 크기를 바탕으로 긴 코드가 문서 폭을 넓히는 이유를 설명한다. min-width: 0·minmax(0,1fr)·내부 스크롤을 실습과 풀이로 비교한다."
slug: "css-grid-flex-overflow"
date: "2022-01-18"
dateBasis: "notion"
updated: "2026-10-18"
topic: "tools"
kind: "note"
tags: ["CSS", "Grid", "Flex", "Astro"]
draft: false
---

## 안쪽 코드만 길어야 하는데 페이지 전체가 넓어질 때

[Grid](https://app.notion.com/p/8dfcc5f9dfbc416793d07aafc3126f3a)와 [Flexbox](https://app.notion.com/p/54552d8fd76e41e79f7377ed6ab3647c) 노트의 속성을 이 블로그의 가로 넘침 사례와 연결했다. 이전 몬스터 글 보완 때 본문 열에 `min-width: 0`을 추가한 이력이 있다. 이번에는 최소 크기와 스크롤의 역할을 설명한다.

Grid는 행·열 배치를, Flex는 주로 한 축의 배치를 다룬다. Flex의 main axis는 항상 가로가 아니다. flex-direction: column이면 세로다. 원문의 grow·shrink를 단순 우선순위로 표현한 설명도 보완한다. 남거나 부족한 공간을 계산하며 basis·최소 크기의 제약이 함께 작용한다.

## 자동 최소 크기 때문에 줄지 않는 열

줄바꿈하지 않는 긴 코드의 min-content 크기가 크면 Grid/Flex 자식의 자동 최소 너비가 컨테이너를 밀어낼 수 있다. 코드 안에 overflow-x:auto만 넣어도 바깥 열의 최소 크기 제약이 남으면 페이지가 넓어질 수 있다.

| 조치 | 역할 |
| --- | --- |
| 자식 min-width:0 | 콘텐츠 고유 최소 폭 아래로 열이 줄어들게 허용 |
| minmax(0,1fr) | 유연한 Grid track의 최소값을 명시 |
| pre의 overflow-x:auto | 긴 내용은 코드 블록 안에서 스크롤 |
| 긴 일반 문장 overflow-wrap:anywhere | 필요할 때 단어 안 줄바꿈 |

코드의 들여쓰기와 표의 열을 보존해야 할 때는 무조건 모든 문자를 줄바꿈시키지 않는다. [MDN Flex 최소 크기](https://developer.mozilla.org/en-US/docs/Web/CSS/flex), [CSS Grid 명세의 자동 최소 크기](https://www.w3.org/TR/css-grid-1/#min-size-auto)

## 재현용 HTML

다음을 `overflow.html`로 저장해 브라우저에서 연다. 외부 라이브러리는 없다.

```html
<!doctype html>
<html lang="ko">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>가로 넘침 실습</title>
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 16px; }
.layout { display: grid; grid-template-columns: minmax(0,1fr) 160px; gap: 16px; }
.article { min-width: 0; }
pre { max-width: 100%; overflow-x: auto; padding: 16px; background: #eee; }
aside { overflow-wrap: anywhere; }
@media(max-width:600px) { .layout { grid-template-columns:minmax(0,1fr); } }
</style>
<main class="layout">
  <article class="article"><h1>긴 코드</h1>
    <pre>StudyResult result = BuildAndValidateWithAnIntentionallyLongIdentifierToReproduceOverflow(input, target, settings, manifest, cancellationToken);</pre>
  </article>
  <aside>목차와 보조 정보</aside>
</main>
</html>
```

먼저 두 최소 크기 수정을 제거하고 `grid-template-columns:1fr 160px`로 바꿔 본다. 이어 자식 min-width와 track 최소값을 각각 적용한다. 재현 결과는 콘텐츠·브라우저에 따라 달라질 수 있으므로 computed style과 실제 폭을 함께 본다.

## 실습과 풀이

1. 폭 390·768·1280px에서 documentElement의 scrollWidth와 clientWidth를 비교한다. **풀이:** 본문 페이지는 넓어지지 않고 pre만 내부 스크롤을 가져야 한다. 세로 스크롤바로 clientWidth가 viewport보다 작을 수 있다.
2. 레이아웃을 display:flex로 바꾼다. **풀이:** 본문에 flex:1과 min-width:0을 적용하고 보조 열은 축소 정책을 정한다. Flex로 바꿨다는 것만으로 자동 최소 크기 문제가 없어지지는 않는다.
3. 긴 표를 추가한다. **풀이:** 표 바깥 wrapper에 overflow-x:auto를 둔다. 표 자체를 무조건 좁혀 열의 의미를 잃게 하지 않는다. 키보드 접근과 스크롤 표시도 확인한다.

## 확인한 범위

노션·공개 CSS 문서와 블로그의 기존 수정 기록을 대조했다. 실제 블로그의 모바일 페이지 폭은 이번 게시 점검에서 확인하되, 위 독립 HTML의 모든 브라우저·접근성 조합은 미검증이다. 이전 수정이 다른 사이트의 모든 넘침 문제를 해결한다고 일반화하지 않는다. AI를 설명과 예제 작성에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [DynamoDB의 Partition Key·Sort Key와 조회 패턴 설계](/writing/dynamodb-keys-query-patterns/)
