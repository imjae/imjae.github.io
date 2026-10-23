---
title: "삼각함수·라디안·Atan2로 방향과 각도 구하기"
description: "단위원의 sin·cos, 도와 라디안 변환, Atan2의 사분면 처리를 연결합니다. 영벡터와 각도 경계, 2D·XZ 평면의 축 규약을 예제·실습·풀이로 다룹니다."
slug: "trigonometry-radians-atan2"
date: "2022-05-23"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "Trigonometry", "Vector", "Unity"]
draft: false
---

## 방향에서 각도로, 각도에서 방향으로

노션의 [Atan2 기록](https://app.notion.com/p/0d0b5038df1d42739da82697eb1967d4)을 바탕으로 정리했습니다. 별도로 만들어 둔 삼각함수 장은 본문이 비어 있어, 단위원·경계 처리·실습은 이번 글에서 새로 보완했습니다. 원문의 `Vector2.y`처럼 타입에서 성분을 바로 읽는 표기는 실제 벡터 인스턴스 `direction.y`로 고쳐 읽어야 합니다.

이 글의 2D 규약은 x가 오른쪽, y가 위쪽이며 +x에서 반시계 방향으로 각도를 잽니다. 반지름 1인 원 위에서 각 $\theta$에 해당하는 점은 다음과 같습니다.

$$
d=(\cos\theta,\sin\theta),\qquad\cos^2\theta+\sin^2\theta=1
$$

직각삼각형에서는 cos가 빗변 대비 인접변, sin이 빗변 대비 대변의 비입니다. 단위원은 이를 모든 사분면으로 확장합니다. tan은 $\sin\theta/\cos\theta$이며 cos가 0인 각에서는 정의되지 않습니다.

## 라디안은 호의 길이를 반지름으로 나눈 값입니다

<div id="라디안은-호의-길이를-반지름으로-나눈-값이다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

반지름 $r$의 원에서 호 길이를 $s$라 하면 $\theta=s/r$ 라디안입니다. 한 바퀴의 호 길이는 $2\pi r$이므로 한 바퀴는 $2\pi$ 라디안, 180도는 $\pi$ 라디안입니다.

$$
\theta_{rad}=\theta_{deg}\frac\pi{180},\qquad
\theta_{deg}=\theta_{rad}\frac{180}\pi
$$

`sin(90)`에 90도를 넣었다고 생각하면 단위 오류가 생깁니다. 일반적인 수학 API의 sin·cos는 라디안을 받습니다. Unity에서는 `Mathf.Deg2Rad`, `Mathf.Rad2Deg`로 변환할 수 있습니다.

| 방향 | 도 | 라디안 | 단위벡터 |
| --- | --- | --- | --- |
| 오른쪽 | 0 | 0 | (1, 0) |
| 위 | 90 | $\pi/2$ | (0, 1) |
| 왼쪽 | 180 또는 -180 | $\pi$ 또는 $-\pi$ | (-1, 0) |
| 아래 | -90 | $-\pi/2$ | (0, -1) |

## Atan과 Atan2의 차이

`atan(y / x)`는 비율만 봅니다. `(1, 1)`과 `(-1, -1)`의 비는 모두 1이지만 방향은 반대입니다. `atan2(y, x)`는 두 성분의 부호를 따로 받아 사분면까지 판단합니다. x=0도 직접 나눗셈 없이 다룹니다. 이를 단지 영 나누기 방지 함수라고 설명하면 사분면 정보가 빠집니다.

[Unity Mathf.Atan2 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Mathf.Atan2.html)는 인자 순서를 **y, x**, 반환 단위를 라디안으로 설명합니다. 음의 x축에서는 부호 있는 0과 API 규약에 따라 $\pi$ 또는 $-\pi$ 표현이 나올 수 있습니다. 둘은 같은 방향입니다.

영벡터 `(0, 0)`에는 수학적으로 방향이 없습니다. API가 숫자를 반환하더라도 게임 로직에서는 이전 방향 유지, 회전 생략 등 정책을 먼저 정합니다. 아주 작은 벡터도 입력 노이즈로 보아 제외할 수 있습니다.

## 각도 차이는 경계를 넘어 계산합니다

<div id="각도-차이는-경계를-넘어-계산한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

현재 각도 179도에서 목표 -179도로 회전할 때 단순 차는 -358도입니다. 하지만 최단 차는 +2도입니다. 차이를 $[-180,180)$로 접으면 됩니다. 정확히 180도 차이일 때 어느 쪽으로 도는지는 별도 약속이며 아래 코드는 -180을 선택합니다.

여러 바퀴 회전 횟수나 누적 각도가 필요하면 정규화 전 정보를 별도로 보관합니다. 방향 하나만 저장해서 지나온 바퀴 수를 복원할 수는 없습니다.

## 실행 예제

`angles.mjs`로 저장하고 `node angles.mjs`로 실행합니다. 화면 회전 대신 순수한 2D 수치 모델을 검사합니다.

```js
import assert from 'node:assert/strict';

const deg = rad => rad * 180 / Math.PI;
const rad = degrees => degrees * Math.PI / 180;
const wrap = degrees => ((degrees + 180) % 360 + 360) % 360 - 180;
function heading(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new RangeError('finite direction required');
  if (Math.hypot(x, y) <= 1e-8) return null;
  return deg(Math.atan2(y, x));
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-10);

near(heading(1, 1), 45);
near(heading(-1, 1), 135);
near(heading(-1, -1), -135);
near(heading(1, -1), -45);
near(heading(0, 1), 90);
assert.equal(heading(0, 0), null);
assert.equal(heading(1e-10, 0), null);
near(wrap(-179 - 179), 2);
near(wrap(179 - (-179)), -2);
assert.equal(wrap(180), -180);
for (let angle = -179; angle <= 179; angle++) {
  const x = Math.cos(rad(angle)), y = Math.sin(rad(angle));
  near(wrap(heading(x, y) - angle), 0);
  near(Math.hypot(x, y), 1);
}
console.log('angles: 359 direction round trips and edge checks passed');
```

## Unity의 XZ 평면에 적용할 때

Unity에서 +z를 전방, +x를 오른쪽으로 삼고 월드 위쪽 y축에 대한 yaw를 계산한다면 식의 성분 이름을 바꿔 읽습니다. 같은 좌표계의 목표 변위 `d`에 대해 `Mathf.Atan2(d.x, d.z) * Mathf.Rad2Deg`가 +z 기준 각도입니다. +z는 0도, +x는 90도입니다. 2D 공식의 인자를 그대로 `d.z, d.x`로 옮기면 기준 축이 달라집니다.

부모 로컬 공간에서 얻은 각도를 월드 회전에 그대로 넣는 오류도 피해야 합니다. 관련 예제는 [이동 방향과 바라보는 방향](/writing/movement-facing-coordinate-space/)에서 이어집니다. 모델의 원래 정면이 +z인지, 스프라이트의 정면이 +x인지도 따로 확인합니다.

## 실습

1. 30도를 라디안으로 바꾸고 단위 방향을 구합니다.
2. `(-2, 2)`와 `(2, -2)`의 각도를 구합니다.
3. 현재 -170도, 목표 170도의 최단 각도 차를 구합니다.
4. 목표와 현재 위치가 같은데 Atan2에 그대로 넣어 회전을 바꾸면 어떤 문제가 생길 수 있나요?

## 풀이

1. $\pi/6$ 라디안이고 $(\sqrt3/2,1/2)$입니다.
2. 각각 135도, -45도입니다. 둘의 `y/x`가 -1로 같아도 사분면이 다릅니다.
3. 단순 차 340도를 접으면 -20도입니다.
4. 변위가 영벡터여서 목표 방향이 없습니다. 임의의 API 결과로 정면이 바뀔 수 있으므로 회전을 유지하는 등의 정책이 필요합니다.

관련 글: [수학 읽기 순서](/writing/game-math-reading-order/).
설명과 예제 작성에 AI를 활용했습니다.
