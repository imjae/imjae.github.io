---
title: "Local·World·View·Clip·NDC·Screen 좌표를 구분하기"
description: "모델·뷰·투영과 원근 나눗셈·viewport의 순서를 수치로 계산한다. clip 좌표와 NDC를 구분하는 실행 예제와 실습·풀이를 제공한다."
slug: "local-world-clip-ndc-screen"
date: "2023-07-04"
dateBasis: "notion"
updated: "2026-10-18"
topic: "math"
kind: "note"
tags: ["Math", "OpenGL", "Coordinate"]
draft: false
---

## vertex shader의 출력이 바로 픽셀 좌표는 아니다

[좌표 시스템](https://app.notion.com/p/de3bfcadaeb84991918d744a9b1bd553)과 [이동 변환 노트](https://app.notion.com/p/db1946199b2e42bc8916c3ed86314b1a)를 바탕으로 단계와 단위를 정리한다. 원문의 clip과 NDC 설명을 분리했다. 그림 속 강의 내용을 복제하는 대신 작은 수치를 직접 계산한다.

```text
local --M--> world --V--> view --P--> clip
      --> clip 단계의 clipping --> w로 나누기 --> NDC --> viewport --> window
```

열벡터 규약에서는 `clip = P * V * M * local`이다. 오른쪽 변환부터 적용된다. API가 행벡터를 쓰거나 행렬을 다른 순서로 저장한다면 같은 코드를 그대로 복사하면 안 된다. 메모리 저장 순서와 벡터를 곱하는 규약은 구분한다.

| 공간 | 좌표가 뜻하는 것 |
| --- | --- |
| Local | 모델 자체의 기준 |
| World | 여러 모델을 배치하는 공통 기준 |
| View | 카메라를 기준으로 본 좌표 |
| Clip | 투영 행렬 결과, 아직 w를 갖는 동차 좌표 |
| NDC | clip의 xyz를 w로 나눈 좌표 |
| Window | viewport와 깊이 범위를 적용한 좌표 |

## 왜 w로 나누는가

기본 OpenGL 규약에서 clip 조건은 각 성분이 `-w ≤ x,y,z ≤ w`인 범위다. NDC의 xyz 범위는 -1~1이다. w가 양수인 예제에서 clip=(1,0,0,2)는 x가 1이어도 화면 오른쪽 끝이 아니라 NDC x=0.5가 된다. 삼각형 일부가 경계를 넘으면 교점을 만들어 잘라낼 수 있으므로 ‘정점 하나가 밖이면 삼각형 전체 폐기’라고 쓰지 않는다.

원근 투영의 w는 보통 view 깊이와 연결된다. w로 나누어 먼 대상의 화면 크기가 작아진다. w=0 부근을 무작정 나누는 것은 유효한 표시 정책이 아니다. 실제 clipping은 분할 전에 처리된다. [Khronos OpenGL core 명세](https://registry.khronos.org/OpenGL/specs/gl/glspec46.core.pdf)

## 직접 실행하는 viewport 계산

Node.js에서 `coordinates.mjs`로 저장하고 `node coordinates.mjs`를 실행한다. 이 함수는 유한한 clip 좌표와 양수 w, 양수 viewport를 전제로 하고 실패 입력을 거절한다. 삼각형 clipping이나 깊이 버퍼를 구현한 함수는 아니다.

```javascript
function project(clip, width, height) {
  if (clip.length !== 4 || !clip.every(Number.isFinite) || clip[3] <= 0
      || !Number.isFinite(width) || !Number.isFinite(height)
      || width <= 0 || height <= 0) throw new Error('invalid input');
  const [x, y, z, w] = clip;
  if ([x, y, z].some(v => Math.abs(v) > w)) return null;
  return [(x / w + 1) * width / 2,
          (y / w + 1) * height / 2, (z / w + 1) / 2];
}
console.log(project([1, 0, 0, 2], 800, 600));
console.log(project([0, 1, -1, 1], 800, 600));
console.log(project([3, 0, 0, 2], 800, 600));
```

예상 출력은 다음과 같다.

```text
[ 600, 300, 0.5 ]
[ 400, 600, 0 ]
null
```

viewport 원점은 왼쪽 아래 (0,0), 기본 깊이 범위는 0~1로 계산했다. 상단 y=600은 연속 좌표의 경계이며 높이 600px의 유효한 정수 픽셀 행은 0~599다. 브라우저의 왼쪽 위 원점에 겹쳐 표시하려면 y를 뒤집어야 한다. Unity의 Graphics API별 깊이 규약까지 이 식으로 일반화하지 않는다.

## 실습과 풀이

1. 첫 입력의 w만 4로 바꾼다. **풀이:** x NDC=0.25이므로 화면 x=500, y=300이다. x를 w로 나누기 전에 viewport를 적용하면 이 결과가 나오지 않는다.
2. viewport를 1,600×900으로 바꾼다. **풀이:** 같은 NDC(0.5,0)는 (1200,450)이다. 모델의 월드 위치를 바꾼 것이 아니라 화면 매핑이 바뀌었다.
3. 직교 투영에서도 단계가 같은가? **풀이:** 단계는 같지만 보통 w=1이 유지되어 원근에 따른 축소가 생기지 않는다. projection 행렬과 카메라 기준을 고정해 비교해야 한다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

수치 함수는 GPU를 사용하지 않는 좌표 계산 모델이다. 노션 자료와 [LearnOpenGL Coordinate Systems](https://learnopengl.com/Getting-started/Coordinate-Systems)의 단계 설명을 대조했다. GLSL·GPU·깊이 검사·카메라 화면은 미검증이다. DCB나 LearnOpenGL 저장소의 후속 카메라 구현을 완료했다고 주장하지 않는다. 작성에 AI를 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [직접 참조·Resources·AssetBundle·Addressables 선택하기](/writing/unity-asset-loading-choices/)
