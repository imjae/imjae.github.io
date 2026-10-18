---
title: "벡터 공간·선형 결합·기저와 좌표의 의미"
description: "벡터 공간의 두 연산과 공리, 생성·독립·기저·차원을 연결한다. 같은 벡터를 다른 기저의 좌표로 표현하는 계산을 예제·실습·풀이로 확인한다."
slug: "vector-space-basis-coordinates"
date: "2022-10-10"
dateBasis: "notion"
updated: "2026-10-18"
topic: "math"
kind: "note"
tags: ["Math", "Vector", "Basis", "Coordinate"]
draft: false
---

## 좌표는 선택한 기저에 대한 숫자다

노션의 [벡터 장](https://app.notion.com/p/c488dcc264164a06bca0f64667d1e1f7), [스칼라와 벡터](https://app.notion.com/p/a13e9720265543a2bdc9a51e5e86da4e), [벡터 공간의 연산](https://app.notion.com/p/1e7065060ef9429a845e321b45eec73a)을 바탕으로 다시 구성했다. 『이득우의 게임수학』 독서 기록의 주제를 따르되 설명과 수치 예제는 새로 작성했다.

위치 `(7, 6)`은 어떤 축과 단위를 사용했는지 알아야 해석할 수 있다. 표준기저 $(1,0),(0,1)$에 대한 좌표라면 오른쪽 7, 위쪽 6에 해당한다. 다른 기저를 선택하면 같은 벡터도 다른 숫자로 표현된다.

원점을 정한 좌표계에서 점과 그 위치 벡터를 같은 성분으로 표시할 수 있다. 하지만 점과 변위의 의미는 다르다. `목표점 - 현재점`은 변위이고 `현재점 + 변위`는 새 점이다. 원점을 바꾸면 점의 좌표가 바뀌며 같은 두 점 사이의 변위에는 그 평행이동이 상쇄된다.

## 벡터 공간의 두 기본 연산

스칼라는 여기서 실수다. 벡터 공간 $V$는 벡터 덧셈과 스칼라배가 정의되어 있고 다음 성질을 만족한다. $u,v,w\in V$, $a,b\in\mathbb R$로 둔다.

| 성질 | 식 |
| --- | --- |
| 덧셈의 결합·교환 | $(u+v)+w=u+(v+w)$, $u+v=v+u$ |
| 덧셈의 항등원·역원 | $v+0=v$, $v+(-v)=0$ |
| 스칼라배의 호환·항등 | $a(bv)=(ab)v$, $1v=v$ |
| 두 분배법칙 | $a(u+v)=au+av$, $(a+b)v=av+bv$ |

연산의 닫힘도 필요하다. 평면 $\mathbb R^2$에서는 성분끼리 더하고, 모든 성분에 같은 스칼라를 곱하면 이 조건을 만족한다. 스칼라배 $av$와 내적 $u\cdot v$는 다른 연산이다.

벡터 공간은 숫자 좌표 묶음만을 뜻하지 않는다. 고정된 차수 이하의 다항식도 다항식 덧셈과 실수배로 벡터 공간을 이룬다. 반대로 단위벡터만 모은 집합은 덧셈과 스칼라배에 닫혀 있지 않다. 단위벡터를 2배 하면 집합을 벗어난다.

## 선형 결합과 생성

$a_1v_1+\cdots+a_kv_k$를 선형 결합이라고 한다. 스칼라를 자유롭게 바꾸어 만들 수 있는 벡터 전체가 이 벡터들의 생성 공간, 즉 span이다.

벡터 $(1,2)$ 하나로 만들 수 있는 것은 $(a,2a)$ 모양의 직선뿐이다. $(2,4)$를 추가해도 같은 직선만 만든다. 두 벡터의 방향이 겹치기 때문이다.

반면 $u=(2,0)$, $v=(1,3)$이면

$$
au+bv=(2a+b,3b)
$$

다. 임의의 $(x,y)$에 대해 $b=y/3$, $a=(x-y/3)/2$를 선택하면 된다. 따라서 두 벡터는 평면 전체를 생성한다.

## 독립·기저·차원

벡터들이 선형 독립이라는 말은

$$
a_1v_1+\cdots+a_kv_k=0
$$

의 해가 $a_1=\cdots=a_k=0$뿐이라는 뜻이다. 모든 계수를 0으로 넣었을 때 영벡터가 된다는 사실만 보여서는 독립을 증명할 수 없다. 그 사실은 종속인 벡터에서도 성립한다.

$u=(2,0)$, $v=(1,3)$에서는 $3b=0$에서 $b=0$, $2a+b=0$에서 $a=0$을 얻는다. 독립이고 평면을 생성하므로 기저다. **기저는 독립성과 생성 조건을 함께 만족한다.** $\mathbb R^3$의 독립인 벡터 하나가 공간 전체를 생성하는 것은 아니다.

유한 차원 공간의 기저 원소 수를 차원이라 한다. $\mathbb R^2$의 기저는 2개, $\mathbb R^3$의 기저는 3개다. 평면의 세 벡터가 항상 종속이라는 결론을 모든 차원의 세 벡터에 적용하면 안 된다.

## 다른 기저의 좌표 구하기

기저를 열로 둔 행렬을 $B=[u\ v]$라고 하면

$$
p=B[p]_B,\qquad [p]_B=B^{-1}p
$$

다. 예제의 $p=(7,6)$에 대해 $b=2$, $a=2.5$이므로 $[p]_B=(2.5,2)$다. 벡터가 이동한 것이 아니라 **같은 벡터의 표현**을 바꿨다. 반면 표준 좌표 숫자를 그대로 두고 행렬 $B$를 곱하면 벡터 자체를 변환하는 해석이 된다.

2차원에서 $\det B=u_xv_y-u_yv_x$가 0이면 역행렬이 없다. 거의 평행하면 작은 입력 오차가 좌표 오차로 크게 확대될 수 있다. 단순히 `det != 0`만 검사하는 것보다 벡터 길이와 함께 판단해야 한다.

## 실행 예제

`basis.mjs`에 저장하고 `node basis.mjs`로 실행한다. 유한한 보통 크기의 좌표를 사용하는 예제용 계산이다.

```js
import assert from 'node:assert/strict';

const cross2 = (a, b) => a[0] * b[1] - a[1] * b[0];
const toWorld = (c, u, v) => [c[0] * u[0] + c[1] * v[0], c[0] * u[1] + c[1] * v[1]];
function toBasis(p, u, v) {
  if (![...p, ...u, ...v].every(Number.isFinite)) throw new RangeError('finite values required');
  const lu = Math.hypot(...u), lv = Math.hypot(...v);
  if (lu === 0 || lv === 0) throw new RangeError('zero basis vector');
  const sine = cross2(u.map(x => x / lu), v.map(x => x / lv));
  if (Math.abs(sine) <= 1e-12) throw new RangeError('parallel or nearly parallel');
  const det = cross2(u, v);
  return [cross2(p, v) / det, cross2(u, p) / det];
}

const u = [2, 0], v = [1, 3];
assert.deepEqual(toBasis([7, 6], u, v), [2.5, 2]);
assert.deepEqual(toWorld([2.5, 2], u, v), [7, 6]);
for (let x = -10; x <= 10; x++) {
  for (let y = -10; y <= 10; y++) {
    const restored = toWorld(toBasis([x, y], u, v), u, v);
    assert.ok(Math.hypot(restored[0] - x, restored[1] - y) < 1e-12);
  }
}
assert.throws(() => toBasis([1, 1], [1, 2], [2, 4]), RangeError);
assert.throws(() => toBasis([1, 1], [0, 0], v), RangeError);
assert.throws(() => toBasis([1, 1], [1, 0], [1, 1e-14]), RangeError);
console.log('basis: 441 round trips and edge checks passed');
```

## 실습

1. $u=(2,0)$, $v=(1,3)$에서 $p=(4,3)$의 좌표를 구한다.
2. $(1,2),(2,4)$가 종속임을 0이 아닌 계수로 보인다.
3. $\mathbb R^3$의 $(1,0,0),(0,1,0)$은 독립인가? 기저인가?
4. 기저를 바꾸면 원래 벡터가 반드시 이동하는가?

## 풀이

1. $3b=3$에서 $b=1$, $2a+1=4$에서 $a=1.5$다.
2. $2(1,2)-(2,4)=(0,0)$이다. 모든 계수가 0인 해 외에 해가 있으므로 종속이다.
3. 독립이다. 하지만 z 성분을 만들지 못해 $\mathbb R^3$ 전체의 기저는 아니다. z=0 평면의 기저는 된다.
4. 아니다. 같은 벡터를 다른 기저에 대한 좌표로 다시 표현할 수 있다. 수동적인 좌표 표현 변경과 능동적인 벡터 변환을 구분한다.

## 확인한 범위

Node.js에서 441개 좌표 왕복과 종속·영벡터·거의 평행한 기저의 거부를 실행했다. 임계값은 예제의 정책이며 모든 스케일에서 충분한 조건수 검사는 아니다. Unity Transform의 부모 계층·음수 스케일을 실행한 결과는 아니다. AI로 원문 대조와 설명·예제 작성·검사를 보조했다.

다음은 [벡터 길이·정규화·내적·외적](/writing/vector-length-dot-cross/)이다. 전체 순서는 [수학 읽기 순서](/writing/game-math-reading-order/)에 있다.
