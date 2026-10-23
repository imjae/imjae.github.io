---
title: "함수·합성·역함수와 되돌릴 수 없는 계산"
description: "정의역·공역·치역, 단사·전사, 합성과 역함수를 게임 수치 변환으로 설명합니다. 이동·배율의 역변환과 Clamp의 정보 손실을 예제·실습·풀이로 확인합니다."
slug: "functions-composition-inverse"
date: "2022-10-02"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "Function", "Transform"]
draft: false
---

## 함수는 입력과 출력의 약속을 포함합니다

<div id="함수는-입력과-출력의-약속을-포함한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

노션의 [함수](https://app.notion.com/p/2d95780ade1342629bb221766e365a2f), [합성함수](https://app.notion.com/p/b751eee4c9a34bc5924f7a34f392c1ed), [항등함수와 역함수](https://app.notion.com/p/e34414cfddb1408189f498afb8aae802)를 묶어 다시 썼습니다. 『이득우의 게임수학』 독서 기록을 바탕으로 하며, 아래 체력·변환 예제와 실습은 새로 작성했습니다.

함수 $f:A\to B$는 정의역 $A$의 **각 원소에 정확히 하나의 출력**을 대응시킵니다. 공역 $B$는 출력이 속하기로 정한 집합입니다. 실제로 도달하는 출력 집합 $f(A)$를 치역이라고 합니다.

예를 들어 $f(x)=x^2$를 실수에서 실수로 정의하면 정의역과 공역은 모두 $\mathbb R$이고 치역은 $[0,\infty)$입니다. 같은 식을 써도 공역을 $[0,\infty)$로 정하면 전사 여부가 달라집니다.

| 성질 | 뜻 | 예 |
| --- | --- | --- |
| 단사 | 다른 입력은 다른 출력으로 갑니다 | $f:\mathbb R\to\mathbb R$, $f(x)=2x+1$ |
| 전사 | 공역의 모든 원소에 도달합니다 | $f:\mathbb R\to[0,\infty)$, $f(x)=x^2$ |
| 전단사 | 단사이면서 전사입니다 | 실수 전체에서 $2x+1$ |

`Clamp(hp, 0, 100)`은 여러 입력을 0이나 100으로 모읍니다. 입력이 `-20`인지 `-1`인지 출력 0만 보고 구분할 수 없습니다. 따라서 실수 입력 전체에서 단사가 아닙니다.

## 합성은 오른쪽 함수부터 적용합니다

<div id="합성은-오른쪽-함수부터-적용한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

$(g\circ f)(x)=g(f(x))$입니다. $f$의 출력이 $g$의 정의역에 들어가야 합성을 정의할 수 있습니다.

이동 $T(x)=x+3$과 배율 $S(x)=2x$를 합성해 보자.

$$
(S\circ T)(x)=2(x+3)=2x+6
$$

$$
(T\circ S)(x)=2x+3
$$

합성은 보통 교환되지 않습니다. 반면 함수의 정의역·공역이 맞으면 $(h\circ g)\circ f=h\circ(g\circ f)$입니다. 이는 함수의 결합법칙입니다. 부동소수점 구현에서 식의 계산 순서를 바꾸며 반올림까지 같다고 주장하는 것과는 구분합니다.

## 역함수는 입력을 유일하게 복원합니다

<div id="역함수는-입력을-유일하게-복원한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

항등함수는 $I_A(x)=x$입니다. $f:A\to B$의 양방향 역함수 $f^{-1}:B\to A$가 존재하려면 전단사여야 합니다.

$$
f^{-1}(f(x))=x,\qquad f(f^{-1}(y))=y
$$

$f(x)=ax+b$이고 $a\ne0$이면 $f^{-1}(y)=(y-b)/a$입니다. $a=0$이면 모든 입력을 같은 값으로 보내므로 복원할 수 없습니다. 단사 함수는 공역을 치역으로 좁히면 그 치역 위에서 역함수를 가질 수 있습니다.

합성의 역함수는 순서를 뒤집습니다.

$$
(g\circ f)^{-1}=f^{-1}\circ g^{-1}
$$

예를 들어 이동 후 배율을 적용했다면 복원할 때 배율을 먼저 되돌리고 이동을 되돌립니다. 이 순서는 [행렬 변환](/writing/matrix-transform-order/)에서도 이어집니다.

## 두 입력도 하나의 순서쌍으로 볼 수 있습니다

<div id="두-입력도-하나의-순서쌍으로-볼-수-있다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

노션의 [곱집합과 좌표 평면](https://app.notion.com/p/1455e1a4ccc54c15aec71015119f7db8)을 함께 정리합니다. $A\times B$는 $(a,b)$ 순서쌍의 집합입니다. 일반적으로 $(a,b)$와 $(b,a)$는 다릅니다. 곱집합 자체가 두 집합을 실제로 수직 배치하라는 조건을 갖는 것은 아닙니다. $\mathbb R\times\mathbb R$를 좌표 평면으로 나타낼 때 직교하는 두 축을 선택할 수 있습니다.

덧셈은 $+:\mathbb R^2\to\mathbb R$로 볼 수 있습니다. `(2, 3)`을 받아 5를 돌려줍니다. `(1, 4)`도 5를 돌려주므로 출력만으로 두 입력을 모두 복원할 수 없습니다.

## 실행 예제

전체 코드를 `functions.mjs`로 저장하고 `node functions.mjs`로 실행합니다. 함수 합성과 입력 복원 여부를 직접 검사합니다.

```js
import assert from 'node:assert/strict';

const compose = (g, f) => x => g(f(x));
const translate = x => x + 3;
const scale = x => 2 * x;
const undoTranslate = y => y - 3;
const undoScale = y => y / 2;
const forward = compose(scale, translate);
const backward = compose(undoTranslate, undoScale);
const clampHp = x => Math.max(0, Math.min(100, x));

assert.equal(forward(4), 14);
assert.equal(compose(translate, scale)(4), 11);
for (const x of [-10, -0.5, 0, 4, 20]) {
  assert.equal(backward(forward(x)), x);
}
assert.equal(clampHp(-20), 0);
assert.equal(clampHp(-1), 0);
assert.equal(clampHp(120), 100);
assert.equal(clampHp(1000), 100);
assert.equal(Math.round(1.1), Math.round(1.4));

function affineInverse(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0)
    throw new RangeError('finite nonzero slope required');
  return y => (y - b) / a;
}
assert.equal(affineInverse(2, 6)(14), 4);
assert.throws(() => affineInverse(0, 3), RangeError);
console.log('functions: all checks passed');
```

Clamp나 반올림을 포함한 처리를 되돌리려면 변경 전 값이나 작업 이력을 따로 보존하는 설계가 필요합니다.

## 실습

1. $f(x)=3x-2$의 역함수를 구하고 $x=5$로 왕복을 확인합니다.
2. $f(x)=x^2$가 실수 전체에서 단사가 아닌 반례를 듭니다. 정의역과 공역을 어떻게 줄이면 역함수 $\sqrt{x}$를 둘 수 있나요?
3. 배율 2 → 이동 3 순서의 변환을 되돌리는 수식과 순서를 적습니다.
4. 체력을 0~100으로 Clamp한 결과 100을 받았습니다. 원래 체력이 정확히 100이었다고 말할 수 있나요?

## 풀이

1. $y=3x-2$를 풀면 $x=(y+2)/3$입니다. $f(5)=13$, $(13+2)/3=5$입니다.
2. $f(2)=f(-2)=4$입니다. $f:[0,\infty)\to[0,\infty)$로 제한하면 전단사이며 역함수는 음이 아닌 제곱근입니다.
3. $y=2x+3$이므로 $x=(y-3)/2$입니다. 이동을 먼저 취소하고 배율을 취소합니다.
4. 아닙니다. 입력 100, 120, 1000이 모두 같은 출력으로 갑니다. 원래 값을 보존하려면 Clamp 전 값을 따로 저장해야 합니다.

관련 글: [벡터 공간과 기저](/writing/vector-space-basis-coordinates/), [수학 읽기 순서](/writing/game-math-reading-order/).
설명과 예제 작성에 AI를 활용했습니다.
