---
title: "이동·회전·크기 행렬과 변환 순서 직접 계산하기"
description: "열벡터 규약에서 동차 좌표와 T·R·S의 순서를 계산합니다. 점과 방향, 회전 중심의 차이를 작은 실행 예제와 실습·풀이로 확인합니다."
slug: "matrix-transform-order"
date: "2023-07-01"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "Matrix", "Transform"]
draft: false
---

## 회전 후 이동과 이동 후 회전은 다릅니다

<div id="회전-후-이동과-이동-후-회전은-다르다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[Transformations](https://app.notion.com/p/7cac09ec960344eba90c283a115cfbf7)와 [이동 변환](https://app.notion.com/p/db1946199b2e42bc8916c3ed86314b1a) 노트에는 행렬 그림과 GLM 조각이 있습니다. 이미지의 수식을 복제하지 않고 2D 점을 동차 좌표로 확장해 순서를 계산합니다. 3D의 4×4 행렬도 같은 원리입니다.

이 글은 **열벡터를 오른쪽에 놓는 규약**입니다. `p' = T R S p`는 S, R, T 순서입니다. 행렬을 메모리에 행 우선으로 저장하는 것과 수학적으로 행벡터를 쓰는 것은 별개입니다. 코드의 저장 방식만 보고 곱셈 순서를 뒤집지 않습니다.

## 점과 방향에 마지막 성분을 붙이는 이유

점은 `(x,y,1)`, 방향은 `(dx,dy,0)`으로 나타냅니다. 아래 이동 행렬을 곱하면 점에는 이동량이 더해지고 방향에는 더해지지 않습니다.

이 추가 성분은 동차 좌표를 위한 수학적 표현입니다. 실제 월드가 공간 축 네 개를 갖는다는 뜻은 아닙니다. 3D의 평행이동은 원래 3D 벡터 공간에서 원점을 보존하는 선형변환이 아니며 아핀변환입니다. 이를 동차 좌표로 확장하면 4×4 행렬 곱으로 표현할 수 있습니다. 노션의 ‘나머지 한 차원으로 이동한다’는 메모는 이 표현 방식으로 구분해 읽습니다.

```text
T = [1 0 tx]   R(90°) = [0 -1 0]   S = [sx  0 0]
    [0 1 ty]            [1  0 0]       [ 0 sy 0]
    [0 0  1]            [0  0 1]       [ 0  0 1]
```

회전은 x가 오른쪽, y가 위인 2D에서 반시계 90°로 정했습니다. Unity의 월드 yaw와 부호를 비교할 때는 먼저 기준축과 바라보는 방향을 맞춥니다. GLM에서는 초기 행렬을 `glm::mat4(1.0f)`처럼 항등으로 명시해 미초기화 값에 기대지 않습니다. [GLM 행렬 변환 문서](https://glm.g-truc.net/0.9.9/api/a00668.html)

## 직접 실행하기

다음을 `matrix.mjs`로 저장해 Node.js에서 실행합니다. 배열은 읽기 쉽게 행 단위로 적었고, 함수는 수학적으로 행렬×열벡터를 계산합니다.

```javascript
const apply = (m, v) => m.map(row => row.reduce((s, n, i) => s + n * v[i], 0));
const T = [[1,0,2], [0,1,0], [0,0,1]];
const R = [[0,-1,0], [1,0,0], [0,0,1]];
const p = [1,0,1];
console.log('rotate then move', apply(T, apply(R,p)));
console.log('move then rotate', apply(R, apply(T,p)));
console.log('direction', apply(T, [1,0,0]));
```

```text
rotate then move [ 2, 1, 1 ]
move then rotate [ 0, 3, 1 ]
direction [ 1, 0, 0 ]
```

첫 경우는 원점에서 회전한 점 `(0,1)`을 오른쪽으로 2 이동합니다. 두 번째는 먼저 `(3,0)`이 된 점을 원점 주위로 회전합니다. 위치가 다른 것은 계산 오류가 아니라 회전할 때의 위치가 다르기 때문입니다.

## 실습과 풀이

1. 점 `(2,1)`을 중심 c=(1,1) 주위로 90° 회전합니다. **풀이:** `T(c) R T(-c) p`를 사용합니다. 중심을 빼면 (1,0), 회전하면 (0,1), 중심을 더하면 (1,2)입니다. 중심을 더하는 것만으로는 이 순서가 되지 않습니다.
2. x를 2배 늘리는 S와 90° 회전의 순서를 바꿉니다. **풀이:** p=(1,0)일 때 RSp=(0,2), SRp=(0,1)입니다. 비균일 스케일과 회전은 일반적으로 교환되지 않습니다.
3. 방향에 w=1을 잘못 붙입니다. **풀이:** 이동량까지 더해져 방향이 바뀝니다. 또한 비균일 스케일 아래의 **법선**은 일반 방향과 달라 역전치 행렬과 정규화를 검토해야 합니다.

## 로컬·월드 변환의 활용

장비 소켓이나 캐릭터의 자식 객체를 배치할 때 로컬 기준과 월드 기준을 구분합니다. [LearnOpenGL Transformations](https://learnopengl.com/Getting-started/Transformations)에서 변환 행렬의 활용을 이어서 볼 수 있습니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [카메라의 기준축과 LookAt 행렬 만들기](/writing/camera-basis-lookat/)
