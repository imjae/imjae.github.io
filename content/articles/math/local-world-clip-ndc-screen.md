---
title: "Local·World·View·Clip·NDC·Screen 좌표를 구분하기"
description: "모델·뷰·투영과 원근 나눗셈·viewport의 순서를 수치로 계산합니다. clip 좌표와 NDC를 구분하는 실행 예제와 실습·풀이를 제공합니다."
slug: "local-world-clip-ndc-screen"
date: "2023-07-04"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "OpenGL", "Coordinate"]
draft: false
---

## vertex shader의 출력이 바로 픽셀 좌표는 아닙니다

<div id="vertex-shader의-출력이-바로-픽셀-좌표는-아니다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[좌표 시스템](https://app.notion.com/p/de3bfcadaeb84991918d744a9b1bd553)과 [이동 변환 노트](https://app.notion.com/p/db1946199b2e42bc8916c3ed86314b1a)를 바탕으로 단계와 단위를 정리합니다. 원문의 clip과 NDC 설명을 분리했습니다. 그림 속 강의 내용을 복제하는 대신 작은 수치를 직접 계산합니다.

```text
local --M--> world --V--> view --P--> clip
      --> clip 단계의 clipping --> w로 나누기 --> NDC --> viewport --> window
```

열벡터 규약에서는 `clip = P * V * M * local`입니다. 오른쪽 변환부터 적용됩니다. API가 행벡터를 쓰거나 행렬을 다른 순서로 저장한다면 같은 코드를 그대로 복사하면 안 됩니다. 메모리 저장 순서와 벡터를 곱하는 규약은 구분합니다.

| 공간 | 좌표가 뜻하는 것 |
| --- | --- |
| Local | 모델 자체의 기준 |
| World | 여러 모델을 배치하는 공통 기준 |
| View | 카메라를 기준으로 본 좌표 |
| Clip | 투영 행렬 결과, 아직 w를 갖는 동차 좌표 |
| NDC | clip의 xyz를 w로 나눈 좌표 |
| Window | viewport와 깊이 범위를 적용한 좌표 |

## 왜 w로 나누는가

기본 OpenGL 규약에서 clip 조건은 각 성분이 `-w ≤ x,y,z ≤ w`인 범위입니다. NDC의 xyz 범위는 -1~1입니다. w가 양수인 예제에서 clip=(1,0,0,2)는 x가 1이어도 화면 오른쪽 끝이 아니라 NDC x=0.5가 됩니다. 삼각형 일부가 경계를 넘으면 교점을 만들어 잘라낼 수 있으므로 ‘정점 하나가 밖이면 삼각형 전체 폐기’라고 쓰지 않습니다.

원근 투영의 w는 보통 view 깊이와 연결됩니다. w로 나누어 먼 대상의 화면 크기가 작아집니다. w=0 부근을 무작정 나누는 것은 유효한 표시 정책이 아닙니다. 실제 clipping은 분할 전에 처리됩니다. [Khronos OpenGL core 명세](https://registry.khronos.org/OpenGL/specs/gl/glspec46.core.pdf)

## 직접 실행하는 viewport 계산

Node.js에서 `coordinates.mjs`로 저장하고 `node coordinates.mjs`를 실행합니다. 이 함수는 유한한 clip 좌표와 양수 w, 양수 viewport를 전제로 하고 실패 입력을 거절합니다. 삼각형 clipping이나 깊이 버퍼를 구현한 함수는 아닙니다.

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

예상 출력은 다음과 같습니다.

```text
[ 600, 300, 0.5 ]
[ 400, 600, 0 ]
null
```

viewport 원점은 왼쪽 아래 (0,0), 기본 깊이 범위는 0~1로 계산했습니다. 상단 y=600은 연속 좌표의 경계이며 높이 600px의 유효한 정수 픽셀 행은 0~599입니다. 브라우저의 왼쪽 위 원점에 겹쳐 표시하려면 y를 뒤집어야 합니다. Unity의 Graphics API별 깊이 규약까지 이 식으로 일반화하지 않습니다.

## 실습과 풀이

1. 첫 입력의 w만 4로 바꿉니다. **풀이:** x NDC=0.25이므로 화면 x=500, y=300입니다. x를 w로 나누기 전에 viewport를 적용하면 이 결과가 나오지 않습니다.
2. viewport를 1,600×900으로 바꿉니다. **풀이:** 같은 NDC(0.5,0)는 (1200,450)입니다. 모델의 월드 위치를 바꾼 것이 아니라 화면 매핑이 바뀌었습니다.
3. 직교 투영에서도 단계가 같은가요? **풀이:** 단계는 같지만 보통 w=1이 유지되어 원근에 따른 축소가 생기지 않습니다. projection 행렬과 카메라 기준을 고정해 비교해야 합니다.

참고 자료: [LearnOpenGL Coordinate Systems](https://learnopengl.com/Getting-started/Coordinate-Systems).
설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [직접 참조·Resources·AssetBundle·Addressables 선택하기](/writing/unity-asset-loading-choices/)
