---
title: "쿼터니언의 축·각과 회전 합성 순서"
description: "단위 쿼터니언의 네 성분, 반각, 벡터 회전과 곱셈 순서를 연결합니다. q와 -q, 역회전과 잘못된 입력을 C# 예제·실습·풀이로 확인합니다."
slug: "quaternion-rotation-composition"
date: "2022-01-20"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Math", "Quaternion", "Transform", "C#", "Unity"]
draft: false
---

## 네 성분을 각도 네 개로 읽지 않습니다

<div id="네-성분을-각도-네-개로-읽지-않는다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[벡터 수학](https://app.notion.com/p/3835c49926f740bd9e79034a7159c7a0)의 쿼터니언 메모를 바탕으로 Euler 표현과 회전 합성을 설명합니다. 수식 유도와 독립 예제로 합성 순서와 입력 조건을 다룹니다.

Euler 각은 세 축의 회전을 정해진 순서로 표현합니다. 같은 최종 방향을 서로 다른 숫자로 나타낼 수 있고, 순서도 결과에 영향을 줍니다. 쿼터니언 $q=(x,y,z,w)$의 네 성분은 Euler 각 네 개가 아닙니다. Unity의 `new Quaternion(x, y, z, w)`에 원하는 Euler 각을 직접 넣으면 안 됩니다.

회전에는 길이 1인 **단위 쿼터니언**을 사용합니다. 성분 네 개에 조건 하나가 있으므로 회전의 자유도가 네 개로 늘어나는 것은 아닙니다.

## 축·각에서 반각을 사용하는 표현

단위 회전축 $u=(u_x,u_y,u_z)$와 각 $\theta$에 대한 회전은 다음과 같이 표현합니다.

$$
q=\left(u_x\sin\frac\theta2,\ u_y\sin\frac\theta2,\ u_z\sin\frac\theta2,\ \cos\frac\theta2\right)
$$

축 길이는 반드시 1이어야 합니다. 네 성분의 길이 제곱은 $\sin^2(\theta/2)+\cos^2(\theta/2)=1$입니다. 회전이 없는 항등 쿼터니언은 `(0, 0, 0, 1)`입니다. 영 쿼터니언 `(0, 0, 0, 0)`은 회전이 아닙니다.

예를 들어 +z축 90도 회전은 $(0,0,\sqrt2/2,\sqrt2/2)$입니다. 아래 실행 모델은 오른손 회전 규약으로 +x를 +y로 보냅니다. 엔진에서 적용할 때는 축 방향·좌표계·API의 인자 단위를 함께 확인합니다.

## 벡터 회전과 곱셈

벡터 v를 순허수 쿼터니언 $(v_x,v_y,v_z,0)$로 놓으면 회전은 $qvq^{-1}$로 쓸 수 있습니다. 단위 q의 역원은 켤레 $q^{-1}=(-x,-y,-z,w)$입니다.

반각이 등장하는 이유를 z축 회전으로 확인할 수 있습니다. $q=(0,0,s,c)$에서 $s=\sin(\theta/2)$, $c=\cos(\theta/2)$라 하면 `(1,0,0)`을 회전한 결과는 $(c^2-s^2,2sc,0)=(\cos\theta,\sin\theta,0)$입니다. 양쪽에서 곱하는 표현이 반각을 실제 회전각으로 연결합니다.

쿼터니언 곱셈은 행렬을 반드시 만들어야 가능한 연산이 아닙니다. 벡터부 a, b와 실수부 s, t를 쓰면 다음의 직접 계산입니다.

$$
(a,s)(b,t)=(sb+ta+a\times b,\ st-a\cdot b)
$$

내적은 [벡터 글](/writing/vector-length-dot-cross/)에서, 외적의 순서도 같은 글에서 확인할 수 있습니다. $a\times b$의 부호 때문에 일반적으로 곱셈은 교환되지 않습니다.

## 합성은 실제 벡터에 적용해 확인합니다

<div id="합성은-실제-벡터에-적용해-확인한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

이 글의 $qvq^{-1}$ 규약에서 $(q_2q_1)v(q_2q_1)^{-1}$는 q1을 먼저, q2를 다음에 적용합니다. 곱의 역원 순서가 뒤집히기 때문입니다.

$$
(q_2q_1)v(q_1^{-1}q_2^{-1})
=q_2(q_1vq_1^{-1})q_2^{-1}
$$

[Unity의 곱셈 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Quaternion-operator_multiply.html)도 원래 기준 좌표계에 대한 `lhs * rhs`를 벡터에 적용하면 rhs를 먼저, lhs를 다음에 적용한다고 설명합니다. 로컬 축을 회전시킨 뒤 그 새 축을 기준으로 돌린다는 서술과 혼동하지 않도록, 비교할 때는 원래 기준 축을 고정합니다.

아래 .NET 예제는 호출 순서를 명확히 드러내기 위해 [Quaternion.Concatenate](https://learn.microsoft.com/en-us/dotnet/api/system.numerics.quaternion.concatenate?view=net-10.0)를 사용합니다. `Concatenate(first, second)`는 first 후 second입니다. Unity와 함수 이름·단위를 같다고 간주해서 코드를 복사하면 안 됩니다. Unity의 `AngleAxis`는 도 단위이고 아래 `CreateFromAxisAngle`은 라디안을 받습니다.

## 실행 예제

.NET SDK의 콘솔 프로젝트에서 `Program.cs`를 다음으로 바꿔 `dotnet run`을 실행합니다. 순수 수치 모델이며 Unity 어셈블리는 필요 없습니다.

```csharp
using System;
using System.Numerics;

static Quaternion AxisAngle(Vector3 axis, float degrees)
{
    if (!float.IsFinite(degrees)
        || !float.IsFinite(axis.X) || !float.IsFinite(axis.Y) || !float.IsFinite(axis.Z)
        || axis.LengthSquared() <= 1e-12f || !float.IsFinite(axis.LengthSquared()))
        throw new ArgumentException("finite nonzero axis required");
    return Quaternion.CreateFromAxisAngle(Vector3.Normalize(axis), degrees * MathF.PI / 180f);
}

static Quaternion Unit(Quaternion q)
{
    float lengthSquared = q.LengthSquared();
    if (!float.IsFinite(lengthSquared) || lengthSquared <= 1e-12f)
        throw new ArgumentException("finite nonzero quaternion required");
    return Quaternion.Normalize(q);
}

static void Near(Vector3 actual, Vector3 expected)
{
    if (Vector3.Distance(actual, expected) > 1e-5f)
        throw new Exception($"expected {expected}, got {actual}");
}

Quaternion x = AxisAngle(Vector3.UnitX, 90);
Quaternion y = AxisAngle(Vector3.UnitY, 90);
Quaternion z = AxisAngle(Vector3.UnitZ, 90);
Near(Vector3.Transform(Vector3.UnitX, z), Vector3.UnitY);

Quaternion firstXThenY = Unit(Quaternion.Concatenate(x, y));
Quaternion firstYThenX = Unit(Quaternion.Concatenate(y, x));
Near(Vector3.Transform(Vector3.UnitZ, firstXThenY), -Vector3.UnitY);
Near(Vector3.Transform(Vector3.UnitZ, firstYThenX), Vector3.UnitX);
Near(Vector3.Transform(Vector3.Transform(Vector3.UnitZ, x), y),
     Vector3.Transform(Vector3.UnitZ, firstXThenY));

Quaternion negative = new(-z.X, -z.Y, -z.Z, -z.W);
Near(Vector3.Transform(Vector3.UnitX, z), Vector3.Transform(Vector3.UnitX, negative));
for (int angle = -180; angle <= 180; angle += 5)
{
    Quaternion q = AxisAngle(new Vector3(1, 2, 3), angle);
    Vector3 p = new(2, -1, 4);
    Vector3 rotated = Vector3.Transform(p, q);
    Near(Vector3.Transform(rotated, Quaternion.Inverse(q)), p);
    if (MathF.Abs(rotated.Length() - p.Length()) > 1e-5f) throw new Exception("length changed");
}
bool rejected = false;
try { Unit(new Quaternion(0, 0, 0, 0)); }
catch (ArgumentException) { rejected = true; }
if (!rejected) throw new Exception("zero quaternion accepted");
Console.WriteLine("quaternion: order, inverse, sign and length checks passed");
```

## q와 -q, 보간과 Euler 표시

$q$와 $-q$는 같은 3D 회전을 나타냅니다. $(-q)v(-q)^{-1}$에서 두 음수가 상쇄됩니다. 성분이 다른데 실제 방향은 같을 수 있으므로 네 성분의 정확한 일치만으로 회전의 동등성을 판정하지 않습니다. 단위 q1, q2의 내적 절댓값이 1에 가까운지 보는 방법이 있습니다.

단순히 성분 평균을 내면 q와 -q의 중간값이 영 쿼터니언이 될 수 있습니다. 보간 경로를 정하고 필요하면 한쪽 부호를 바꾸며 단위 길이를 유지해야 합니다. Slerp 등의 실제 API를 사용해도 입력·회전 속도·시간 처리 정책은 확인해야 합니다.

Euler 숫자 하나가 경계에서 크게 바뀌어도 실제 회전은 조금 변했을 수 있습니다. 반대로 Euler 각을 세 축에 더하는 것과 쿼터니언 곱셈은 같은 연산이 아닙니다. 결과는 기준 방향 벡터 몇 개를 돌려 비교하는 편이 명확합니다.

## 실습

1. 항등 쿼터니언이 `(0,0,0,0)`이 아닌 이유를 설명합니다.
2. 단위 q의 역원을 적고 q와 곱하면 무엇이 되는지 설명합니다.
3. 같은 기준 축에서 x축 90도 후 y축 90도를 적용한 +z 방향을 예제와 비교합니다. 순서를 바꾸면 어떻게 되는가요?
4. q와 -q의 성분 평균이 회전 보간으로 부적절할 수 있는 이유를 설명합니다.

## 풀이

1. 회전에는 길이 1이 필요합니다. 항등은 벡터부 0, 실수부 1이고 영 쿼터니언은 역원이 없습니다.
2. $(-x,-y,-z,w)$입니다. 단위 q와 곱하면 `(0,0,0,1)`입니다.
3. 예제의 오른손 규약에서 +z는 x 회전으로 -y가 되고 y축 회전에서 그대로여서 -y입니다. 순서를 바꾸면 +z → +x → +x입니다.
4. 평균이 영 쿼터니언이 됩니다. 같은 회전을 나타내는 표현의 부호를 맞추지 않은 채 성분만 섞었기 때문입니다.

관련 글: [수학 읽기 순서](/writing/game-math-reading-order/).
설명과 예제 작성에 AI를 활용했습니다.
