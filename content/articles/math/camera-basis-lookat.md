---
title: "카메라의 기준축과 LookAt 행렬 만들기"
description: "카메라의 오른쪽·위·뒤 축을 외적으로 만들고 월드 점을 카메라 좌표로 옮깁니다. 평행 벡터와 이동 역변환을 실습·풀이로 확인합니다."
slug: "camera-basis-lookat"
date: "2023-07-05"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "Camera", "OpenGL"]
draft: false
---

## 바라보는 방향과 카메라의 뒤 축 구분하기

[카메라 노트](https://app.notion.com/p/196f7909977640da8373586d4b5f1bfa)는 위치와 target에서 축을 만드는 내용을 다룹니다. `glm::vec`, `corss` 같은 조각의 오타를 옮기지 않고, 축의 정의부터 다시 적습니다. 외적은 [벡터 글](/writing/vector-length-dot-cross/)을 먼저 보면 이해하기 쉽습니다.

오른손 view 규약에서 카메라는 view의 -Z를 바라본다고 정합니다. 따라서 **뒤 축** b는 `normalize(eye-target)`입니다. 오른쪽 r은 `normalize(cross(upHint,b))`, 위 u는 `cross(b,r)`로 만듭니다. b를 전방이라고 부르면 부호가 뒤집히기 쉽습니다.

카메라 축이 직교 단위벡터라면 월드 점 p의 view 좌표는 다음과 같습니다.

```text
view(p) = ( dot(r, p-eye), dot(u, p-eye), dot(b, p-eye) )
```

먼저 카메라 위치를 빼고 축 방향의 성분을 구합니다. 카메라를 +X로 옮기면 정지한 대상의 view x는 반대 방향으로 움직입니다. [LearnOpenGL Camera](https://learnopengl.com/Getting-started/Camera)

## 평행 입력을 거절하는 실행 예제

Node.js의 `lookat.mjs`에서 실행합니다. 유한한 작은 좌표를 전제로 하며 eye와 target이 같거나 upHint가 뒤 축과 평행하면 오류를 냅니다. 평행 부근을 자동으로 다른 축에 붙이는 정책은 넣지 않았습니다.

```javascript
const sub = (a,b) => a.map((v,i) => v-b[i]);
const dot = (a,b) => a.reduce((s,v,i) => s+v*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],
  a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
function unit(v) {
  const n = Math.hypot(...v);
  if (!Number.isFinite(n) || n < 1e-6) throw new Error('degenerate basis');
  return v.map(x => x/n);
}
function camera(eye,target,upHint) {
  const b = unit(sub(eye,target));
  const r = unit(cross(unit(upHint),b));
  const u = cross(b,r);
  return p => { const d=sub(p,eye); return [dot(r,d),dot(u,d),dot(b,d)]; };
}
const view = camera([0,0,3], [0,0,0], [0,1,0]);
console.log(view([0,0,0]));
console.log(view([1,0,0]));
```

```text
[ 0, 0, -3 ]
[ 1, 0, -3 ]
```

target이 view의 음수 z에 놓이는 것을 확인합니다. `upHint`는 완성된 카메라 위 축과 같지 않을 수 있습니다. 두 외적을 거쳐 전방에 수직인 위 축으로 다시 구성합니다. 축이 일차 독립이어야 이 과정이 성립합니다.

## 실습과 풀이

1. eye=(1,0,3), target=(1,0,0)에서 월드 원점을 봅니다. **풀이:** 방향 축은 그대로이고 원점은 view=(-1,0,-3)이 됩니다. 위치를 빼지 않으면 x=-1을 얻지 못합니다.
2. eye=(0,3,0), target=(0,0,0), upHint=(0,1,0)을 넣습니다. **풀이:** upHint와 b가 평행해서 외적이 0입니다. 궤도 카메라에서는 pitch 범위를 제한하거나 이전 축을 유지하는 등 연속성 정책을 정해야 합니다. 매 프레임 임의 축으로 바꾸면 화면이 튈 수 있습니다.
3. 반지름 3으로 eye=(3sinθ,1,3cosθ)를 이동시킵니다. **풀이:** target=(0,0,0)을 고정하고 매번 view를 만듭니다. 각도는 라디안으로 계산합니다. 이는 새 궤도 카메라 실습이며 원문에 완성된 입력 구현이 있었다고 설명하지 않습니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [FSM의 Enter·Execute·Exit와 전이·중단 규칙](/writing/fsm-transition-interruption/)
