---
title: "삼각형의 방향·넓이·무게중심 좌표와 보간"
description: "세 점에서 변·부호 있는 넓이·무게중심 좌표를 유도한다. 삼각형 내부 판정과 속성 보간, 퇴화·투영의 제한을 예제·실습·풀이로 확인한다."
slug: "triangle-barycentric-interpolation"
date: "2022-01-20"
dateBasis: "notion"
updated: "2026-10-18"
topic: "math"
kind: "note"
tags: ["Math", "Vector", "Triangle", "Interpolation"]
draft: false
---

## 세 점을 지정한 뒤 확인할 것

노션의 [삼각형 정점](https://app.notion.com/p/7441463202a1429db96c6dfd7b8c7bd8)은 로컬 좌표의 점에 관한 짧은 메모이며, 정점 관련 수학을 끝까지 정리한 기록은 아니었다. 이번 글의 넓이·내부 판정·보간과 실행 코드는 새로 보완했다. 과거에 래스터라이저나 충돌 시스템을 완성했다는 뜻은 아니다.

이 글은 y가 위쪽인 2D 직교 좌표를 사용한다. 세 점 A, B, C가 주어지면 변은 $e_1=B-A$, $e_2=C-A$다. 점 세 개가 모두 다르더라도 한 직선 위에 있으면 삼각형의 넓이는 0이다.

## 외적의 z 성분과 부호 있는 넓이

2D 벡터 $u,v$에 대해 $u_xv_y-u_yv_x$를 사용한다. 이는 z=0인 3D 벡터 외적의 z 성분과 같다.

$$
D=(B_x-A_x)(C_y-A_y)-(B_y-A_y)(C_x-A_x)
$$

삼각형 넓이는 $|D|/2$다. y가 위쪽인 이 규약에서 D>0이면 A→B→C가 반시계 방향이다. B와 C를 바꾸면 D의 부호만 바뀐다. y가 아래로 증가하는 화면 좌표에서는 시각적으로 보이는 시계·반시계 관계가 뒤집힐 수 있다.

A=(0,0), B=(6,0), C=(0,4)라면 D=24이고 넓이는 12다. D=0이면 이후에 D로 나누는 계산을 할 수 없다.

## 무게중심 좌표 유도

점 P를 다음과 같이 표현해 보자.

$$
P=\alpha A+\beta B+\gamma C,\qquad\alpha+\beta+\gamma=1
$$

이를 A 기준 변위로 정리하면 $P-A=\beta(B-A)+\gamma(C-A)$다. 양변에 외적의 z 성분을 적용해 각각의 계수를 구한다.

$$
\beta=\frac{(P-A)\times(C-A)}{D},\qquad
\gamma=\frac{(B-A)\times(P-A)}{D},\qquad
\alpha=1-\beta-\gamma
$$

여기서 $\times$는 위에서 정의한 2D 스칼라 연산이다. 세 계수는 해당 점을 세 정점의 가중합으로 만드는 무게중심 좌표다. A에서 `(1,0,0)`, B에서 `(0,1,0)`, C에서 `(0,0,1)`이 된다.

P=(1.5,1)에서는 $\beta=1/4$, $\gamma=1/4$, $\alpha=1/2$다. 세 계수가 모두 0 이상이면 경계를 포함한 삼각형 안이다. 하나라도 음수면 바깥이다. 부동소수점에서는 경계 오차에 맞는 허용 폭을 정한다.

## 속성 보간과 투영의 조건

정점의 스칼라 속성이 각각 $q_A,q_B,q_C$라면 $q(P)=\alpha q_A+\beta q_B+\gamma q_C$로 선형 보간할 수 있다. 벡터 속성은 성분별로 같은 계산을 한다.

예를 들어 높이가 0, 60, 100이면 위의 P에서 $0.5\cdot0+0.25\cdot60+0.25\cdot100=40$이다. 평균한 법선이 단위 길이를 유지하는 것은 아니므로 조명 계산용 방향은 별도 정규화가 필요할 수 있다.

아래 코드는 같은 2D 평면의 **아핀 보간**이다. 원근 투영 뒤 화면의 무게중심 좌표로 UV를 그대로 보간하면 일반적으로 원근 보정이 빠진다. 클립 w가 다른 경우에는 보통

$$
q=\frac{\sum_i\lambda_iq_i/w_i}{\sum_i\lambda_i/w_i}
$$

형태를 사용한다. 이 식의 $\lambda_i$는 화면 공간 계수다. 이는 여기서의 CPU 예제를 GPU 래스터라이저 전체로 확대해서 읽지 않기 위한 조건이며, 이 글에서는 실제 셰이더 보간을 실행하지 않았다.

## 실행 예제

`triangle.mjs`에 저장하고 `node triangle.mjs`로 실행한다. 면적에 대한 epsilon과 무게중심 계수에 대한 epsilon은 단위가 다르므로 구분한다.

```js
import assert from 'node:assert/strict';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
function barycentric(p, a, b, c) {
  if (![...p, ...a, ...b, ...c].every(Number.isFinite)) throw new RangeError('finite vertices required');
  const u = sub(b, a), v = sub(c, a), w = sub(p, a);
  const d = cross(u, v);
  // 이 예제의 좌표 단위에 맞춘 넓이 임계값이다.
  if (Math.abs(d) <= 1e-10) return null;
  const beta = cross(w, v) / d;
  const gamma = cross(u, w) / d;
  return [1 - beta - gamma, beta, gamma];
}
const inside = weights => weights !== null && weights.every(x => x >= -1e-9);
const interpolate = (weights, values) => weights.reduce((sum, w, i) => sum + w * values[i], 0);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10);
const a = [0, 0], b = [6, 0], c = [0, 4], p = [1.5, 1];
const weights = barycentric(p, a, b, c);
assert.deepEqual(weights, [0.5, 0.25, 0.25]);
near(interpolate(weights, [0, 60, 100]), 40);
assert.ok(inside(weights));
assert.ok(inside(barycentric([3, 0], a, b, c)));
assert.ok(!inside(barycentric([6, 4], a, b, c)));
assert.equal(barycentric([1, 1], [0, 0], [1, 1], [2, 2]), null);
const reversed = barycentric(p, a, c, b);
assert.ok(inside(reversed));
near(interpolate(reversed, [0, 100, 60]), 40);
for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20 - i; j++) {
  const beta = i / 20, gamma = j / 20;
  const point = [6 * beta, 4 * gamma];
  const w = barycentric(point, a, b, c);
  assert.ok(inside(w));
  near(w[0] + w[1] + w[2], 1);
  near(interpolate(w, [a[0], b[0], c[0]]), point[0]);
  near(interpolate(w, [a[1], b[1], c[1]]), point[1]);
}
console.log('triangle: 231 reconstructions and edge checks passed');
```

## 실습

1. A=(0,0), B=(4,0), C=(0,2)의 넓이와 방향을 구한다.
2. 위 삼각형의 P=(1,0.5)에 대한 세 계수를 구한다.
3. 정점 속성이 10, 30, 50이면 P의 보간값은 얼마인가?
4. 삼각형을 작은 크기로 축소할 때 고정된 `1e-10` 넓이 임계값에 어떤 한계가 있는가?

## 풀이

1. D=8이므로 넓이 4, 이 글의 좌표 규약에서는 반시계 방향이다.
2. $\beta=1/4$, $\gamma=1/4$, $\alpha=1/2$다.
3. $0.5\cdot10+0.25\cdot30+0.25\cdot50=25$다.
4. 길이를 k배 하면 D는 $k^2$배가 된다. 충분히 작은 유효 삼각형도 고정 임계값으로 퇴화 처리할 수 있다. 입력 스케일과 요구 정확도에 맞추어 정책을 정하거나 상대적인 조건을 함께 확인해야 한다.

## 확인한 범위

Node.js에서 231개 점의 좌표 복원·계수 합, 정점 순서 반전·경계·바깥 점·퇴화를 실행했다. 삼각형 메시의 winding 설정, GPU의 원근 보정·깊이·클리핑·픽셀 소유 규칙은 실행하지 않았다. 원문과 신규 보완 범위를 구분했고 설명·예제 작성·검사에 AI를 사용했다. [수학 읽기 순서](/writing/game-math-reading-order/)에서 관련 글을 찾을 수 있다.
