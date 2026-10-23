---
title: "평면 방정식과 반공간으로 앞뒤·거리·영역 판정하기"
description: "법선과 평면 방정식에서 부호 있는 거리를 유도합니다. 법선 정규화와 여섯 반공간의 영역 판정을 예제·실습·풀이로 확인합니다."
slug: "plane-equation-halfspaces"
date: "2022-01-20"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "Vector", "Plane", "Coordinate"]
draft: false
---

## 평면에 대한 위치를 숫자 하나로 표현합니다

<div id="평면에-대한-위치를-숫자-하나로-표현한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

노션의 [공간의 수학 개요](https://app.notion.com/p/b03c7afde7414da1aa32aa7495570a70)에 있는 평면 방정식과 절두체의 여섯 평면을 출발점으로 삼았습니다. 거리 유도·실행 예제·실습은 새로 작성했습니다. 실제 카메라 행렬에서 절두체 평면을 추출하거나 GPU 컬링을 구현한 기록은 아닙니다.

평면은 평면 위의 한 점 $p_0$와 0이 아닌 법선 $n$으로 정의할 수 있습니다. 평면 위 점 $p$의 차이 $p-p_0$는 법선과 수직이므로 내적이 0입니다.

$$
n\cdot(p-p_0)=0
$$

$d=-n\cdot p_0$로 두면 익숙한 식을 얻습니다.

$$
n\cdot p+d=0\quad\Longleftrightarrow\quad ax+by+cz+d=0
$$

법선 $(a,b,c)$가 평면의 방향을 정하고 d가 원점과의 관계를 정합니다. d만을 무조건 원점에서의 거리라고 부르면 안 됩니다. 법선의 길이와 부호를 함께 봐야 합니다.

## 식의 부호와 부호 있는 거리

$s(p)=n\cdot p+d$의 부호는 평면 어느 쪽에 점이 있는지 알려줍니다. 양수는 법선이 향하는 쪽, 음수는 반대쪽입니다. $n,d$를 모두 -1배 하면 같은 평면이지만 부호는 뒤집힙니다.

점 $p$를 법선 방향으로 $\lambda$만큼 옮긴 $q=p-\lambda n$이 평면 위에 있다고 하자.

$$
n\cdot(p-\lambda n)+d=0
\quad\Rightarrow\quad
\lambda=\frac{n\cdot p+d}{\|n\|^2}
$$

따라서 실제 이동 길이에 부호를 붙인 거리는 다음과 같습니다.

$$
\delta(p)=\frac{n\cdot p+d}{\|n\|}
$$

법선이 단위벡터일 때만 분모를 생략할 수 있습니다. 평면을 정규화할 때도 **n과 d를 함께** $\|n\|$로 나눕니다.

예를 들어 $2y-4=0$은 $y=2$ 평면입니다. 점 `(0, 3, 0)`을 넣으면 식의 값은 2지만 거리는 1입니다. `(0, 1, 0)`의 부호 있는 거리는 -1입니다.

## 반공간을 교집합으로 묶습니다

<div id="반공간을-교집합으로-묶는다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

$n\cdot p+d\ge0$을 만족하는 영역을 이 글에서 안쪽 반공간이라고 정합니다. 여섯 평면의 법선을 모두 안쪽으로 두면 모든 부등식을 만족하는 점이 영역 안에 있습니다.

축 정렬 상자 $[-2,2]\times[-1,1]\times[0,5]$의 조건은 다음과 같습니다.

| 경계 | 안쪽 부등식 | $(n,d)$ |
| --- | --- | --- |
| 왼쪽 | $x+2\ge0$ | ((1,0,0), 2) |
| 오른쪽 | $-x+2\ge0$ | ((-1,0,0), 2) |
| 아래 | $y+1\ge0$ | ((0,1,0), 1) |
| 위 | $-y+1\ge0$ | ((0,-1,0), 1) |
| 앞 | $z\ge0$ | ((0,0,1), 0) |
| 뒤 | $-z+5\ge0$ | ((0,0,-1), 5) |

카메라 절두체도 반공간 교집합이라는 원리는 같습니다. 다만 행렬 규약·클립 공간 깊이 범위·법선 방향을 확인해 평면을 만들어야 합니다. 여기서는 그 추출 과정을 생략하고 상자를 사용합니다.

구의 중심 c와 반지름 r이 있을 때 어떤 안쪽 평면에 대해 $\delta(c)<-r$이면 구 전체가 그 평면 바깥입니다. 모든 평면에서 탈락하지 않았다고 실제 다면체와 반드시 교차하는 것은 아닙니다. 모서리 근처에서 추가 검사에 따라 제외될 수 있는 보수적인 후보 판정입니다.

## 실행 예제

`planes.mjs`로 저장하고 `node planes.mjs`로 실행합니다. epsilon은 정규화된 거리 단위로 비교합니다.

```js
import assert from 'node:assert/strict';

const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
function signedDistance(p, n, d) {
  if (![...p, ...n, d].every(Number.isFinite)) throw new RangeError('finite values required');
  const length = Math.hypot(...n);
  if (length === 0) throw new RangeError('zero normal');
  return (dot(n, p) + d) / length;
}
const box = [
  [[1, 0, 0], 2], [[-1, 0, 0], 2],
  [[0, 1, 0], 1], [[0, -1, 0], 1],
  [[0, 0, 1], 0], [[0, 0, -1], 5]
];
const inside = p => box.every(([n, d]) => signedDistance(p, n, d) >= -1e-9);
function sphereCandidate(c, radius) {
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError('invalid radius');
  return box.every(([n, d]) => signedDistance(c, n, d) >= -radius - 1e-9);
}

assert.equal(signedDistance([0, 3, 0], [0, 2, 0], -4), 1);
assert.equal(signedDistance([0, 1, 0], [0, 2, 0], -4), -1);
assert.equal(signedDistance([0, 3, 0], [0, -2, 0], 4), -1);
assert.ok(inside([0, 0, 2]));
assert.ok(!inside([2.1, 0, 2]));
assert.ok(!inside([0, 0, -0.1]));
for (const x of [-2, 2]) for (const y of [-1, 1]) for (const z of [0, 5]) {
  assert.ok(inside([x, y, z]));
}
assert.ok(!sphereCandidate([4, 0, 2], 1));
assert.ok(sphereCandidate([3, 0, 2], 1));
assert.ok(sphereCandidate([2.8, 1.8, 2], 1));
assert.ok(Math.hypot(0.8, 0.8) > 1); // 모서리까지 거리는 반지름보다 크다.
assert.throws(() => signedDistance([0, 0, 0], [0, 0, 0], 1), RangeError);
console.log('planes: distance, box, boundary and candidate checks passed');
```

## 실습

1. 평면 $3x-6=0$과 점 `(5, 0, 0)`의 부호 있는 거리를 구합니다.
2. 같은 평면을 $6x-12=0$으로 바꾸면 거리가 달라지는가요?
3. 법선만 단위벡터로 만들고 d를 그대로 두면 어떤 평면이 되는가요?
4. 모든 평면에 대한 구 후보 검사가 통과했는데 왜 모서리에서는 실제 교차가 없을 수 있나요?

## 풀이

1. $(15-6)/3=3$입니다. 평면은 x=2이고 점은 법선의 양의 방향으로 3 떨어져 있습니다.
2. 아닙니다. 분자와 법선 길이가 같은 양수 배율로 커져 거리는 같습니다.
3. 예제에서 $x-6=0$이 되어 원래 x=2가 x=6으로 바뀝니다. d도 3으로 나눠야 합니다.
4. 각 평면까지의 거리는 따로 측정합니다. 상자 오른쪽 위 모서리에서 두 축으로 각각 0.8 떨어진 중심은 각 평면까지 0.8이라 반지름 1 검사에 통과하지만 모서리까지는 $\sqrt{0.8^2+0.8^2}>1$입니다.

관련 글: [카메라 기저와 LookAt](/writing/camera-basis-lookat/), [좌표 변환 단계](/writing/local-world-clip-ndc-screen/), [수학 읽기 순서](/writing/game-math-reading-order/).
설명과 예제 작성에 AI를 활용했습니다.
