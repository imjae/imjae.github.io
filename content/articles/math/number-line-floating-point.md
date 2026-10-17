---
title: "수직선과 부동소수점: 이동·배율·오차"
description: "수직선의 평행이동·배율·반사에서 출발해 float의 표현 간격과 반올림을 살펴본다. 절대·상대 오차 비교를 C# 예제와 실습·풀이로 확인한다."
slug: "number-line-floating-point"
date: "2026-10-18"
topic: "math"
kind: "note"
tags: ["Math", "Number", "Precision", "C#"]
draft: false
---

## 수직선의 점과 계산에 저장한 값

노션의 [수의 표현](https://app.notion.com/p/2bf395fb8bbd40c99c99b08259348c83)은 수직선에서 덧셈과 곱셈을 해석하는 기록이다. 『이득우의 게임수학』을 읽으며 남긴 내용을 바탕으로 설명을 다시 썼다. 부동소수점과 오차 비교 코드는 이번 정리에서 추가했다.

실수 $x$는 수직선의 한 점으로 나타낸다. 원점에서의 거리는 절댓값 $|x|$다. 두 점 $a,b$ 사이의 거리는 $|b-a|$이며 음수가 되지 않는다.

| 식 | 수직선에서의 의미 | 예 |
| --- | --- | --- |
| $x+t$ | 모든 점을 같은 거리만큼 이동 | $x+3$은 오른쪽 3 |
| $sx$ | 원점 기준 배율과 방향 변경 | $2x$는 거리 2배 |
| $-x$ | 원점에 대한 반사 | 4와 -4를 교환 |
| $0x$ | 모든 점을 원점으로 모음 | 서로 다른 입력을 구분할 수 없음 |

유리수 사이에는 항상 다른 유리수가 있다. 예를 들어 서로 다른 $a,b$의 중간값 $(a+b)/2$도 유리수다. 따라서 유리수가 수직선에서 일정한 간격으로 떨어져 있는 것은 아니다. 다만 $\sqrt2$ 같은 무리수를 포함하지 않아 실수 전체와는 다르다.

## float의 간격은 일정하지 않다

유한한 비트로 모든 실수를 저장할 수는 없다. 일반적인 IEEE 754 이진32 형식인 C# `float`는 부호, 지수, 유효숫자로 값을 표현한다. 정상 수의 유효숫자는 숨은 선행 비트를 포함해 24비트다. 값의 크기가 커지면 인접한 표현 가능 값 사이의 간격도 커진다.

$$
2^{24}=16\,777\,216
$$

이 값 바로 위에서 표현 간격은 2다. 따라서 실수의 계산과 달리 `16_777_216f + 1f`를 `float`로 저장하면 원래 값과 같아진다. `double`로 **나중에** 바꿔도 이미 사라진 1을 복원할 수 없다. 처음부터 `double`로 계산해야 한다.

`0.1`도 이진 유한 소수로 정확히 표현되지 않는다. `float`와 `double`의 범위·정밀도와 소수 표현의 차이는 [C# 부동소수점 형식 문서](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/floating-point-numeric-types)를 참고한다. 큰 월드 좌표에서 작은 이동이 사라지는 문제와 관련이 있지만, 아래 예제만으로 특정 Unity 씬에서 문제가 발생했다고 단정하지 않는다.

## 결합법칙과 비교

실수 덧셈은 결합법칙을 만족한다. 반올림이 있는 덧셈은 중간에 무엇을 저장했는지에 따라 결과가 달라질 수 있다. 큰 수와 작은 수를 합친 뒤 큰 수를 빼면 작은 수가 복원되지 않을 수 있다.

근삿값 비교는 용도에 맞는 허용 오차를 정해서 수행한다.

$$
|a-b|\le\max\left(\varepsilon_{abs},\varepsilon_{rel}\max(|a|,|b|)\right)
$$

절대 오차는 0 부근의 작은 차이를 다룬다. 상대 오차는 비교 값의 크기에 비례한다. 1m 단위 좌표의 허용 거리와 데미지 정수의 일치는 서로 다른 요구다. 모든 비교를 같은 epsilon으로 바꾸면 안 된다. ID·개수·명시적인 상태는 정확한 비교가 적합할 수 있다.

## 실행 예제

.NET SDK의 콘솔 프로젝트를 만들고 `Program.cs`를 다음 코드로 바꾼다. `dotnet run`으로 실행한다. 표준 라이브러리만 사용한다.

```csharp
using System;

static bool NearlyEqual(double a, double b, double absTol, double relTol)
{
    if (!double.IsFinite(absTol) || !double.IsFinite(relTol)
        || absTol < 0 || relTol < 0)
        throw new ArgumentOutOfRangeException(nameof(absTol));
    if (double.IsNaN(a) || double.IsNaN(b)) return false;
    if (a == b) return true;
    if (!double.IsFinite(a) || !double.IsFinite(b)) return false;
    return Math.Abs(a - b) <= Math.Max(absTol, relTol * Math.Max(Math.Abs(a), Math.Abs(b)));
}

static void Check(bool ok, string label)
{
    if (!ok) throw new Exception(label);
}

float large = 16_777_216f;
float rounded = large + 1f;
Check(rounded == large, "float spacing");
Check((double)rounded == 16_777_216d, "late conversion");
Check((double)large + 1d == 16_777_217d, "early conversion");

float huge = 100_000_000f;
float smallFirst = 1f + (-huge);
float left = (huge + (-huge)) + 1f;
float right = huge + smallFirst;
Check(left == 1f && right == 0f, "association");

Check(0.1d + 0.2d != 0.3d, "binary rounding");
Check(NearlyEqual(0.1d + 0.2d, 0.3d, 1e-12, 1e-12), "decimal sum");
Check(NearlyEqual(0d, 1e-10, 1e-9, 1e-6), "near zero");
Check(NearlyEqual(1_000_000d, 1_000_000.1d, 1e-9, 1e-6), "relative");
Check(!NearlyEqual(1d, 1.1d, 1e-9, 1e-6), "different");
Check(!NearlyEqual(double.NaN, double.NaN, 1e-9, 1e-6), "NaN");
Check(NearlyEqual(double.PositiveInfinity, double.PositiveInfinity, 0, 0), "same infinity");
Check(!NearlyEqual(double.PositiveInfinity, 1d, 1e-9, 1e-6), "finite versus infinity");
Console.WriteLine("floating point: all checks passed");
```

위 비교식은 설명용이다. 극단적으로 큰 `double` 값에서는 차이나 허용 폭 계산도 오버플로할 수 있다.

## 실습

1. $x=-4$에 대해 $2x+3$과 $2(x+3)$을 계산한다.
2. `float`의 `16_777_216` 다음으로 큰 표현 가능 값을 답한다.
3. 절대 오차를 0으로 하고 상대 오차만 쓰면 0과 아주 작은 양수를 비교할 때 어떤 문제가 생기는가?
4. `float`에 저장한 좌표를 `double`로 바꾸면 이전 계산에서 사라진 소수 부분을 복원할 수 있는가?

## 풀이

1. $2(-4)+3=-5$, $2(-4+3)=-2$다. 배율과 이동 순서가 다르다.
2. `16_777_218`이다. `16_777_217`은 이 구간의 `float`로 정확히 저장되지 않는다.
3. 상대 오차가 1보다 작을 때 $|b|\le\varepsilon_{rel}|b|$가 양수 $b$에 대해 성립하지 않는다. 0 부근에는 단위에 맞는 절대 오차가 필요하다.
4. 복원할 수 없다. 변환은 저장된 근삿값을 더 넓은 형식으로 옮긴다. 원래 입력과 잃어버린 계산 이력을 알아내는 연산이 아니다.

## 확인한 범위

본문의 C# 예제를 .NET 콘솔에서 실행해 표현 간격, 결합 순서, 허용 오차와 NaN·무한대 처리를 확인했다. Unity의 실제 대규모 월드, 물리 오차, GPU 셰이더 정밀도는 실행하지 않았다. 비교 함수는 유한한 보통 크기의 학습 데이터에 쓰는 예제이며 범용 수치 라이브러리의 대체품은 아니다.

노션 원문에서 가져온 주제와 새로 보완한 수치 계산을 구분했다. 작성·예제 검사에 AI를 사용했다. 다음은 [함수·합성·역함수](/writing/functions-composition-inverse/), 전체 순서는 [수학 읽기 순서](/writing/game-math-reading-order/)다.
