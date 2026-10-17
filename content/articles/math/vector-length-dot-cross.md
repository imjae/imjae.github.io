---
title: "벡터의 길이·정규화·내적·외적을 게임 판정에 쓰기"
description: "위치 차이에서 이동 방향을 구하고, 내적으로 시야각을, 외적으로 법선과 좌우를 판단한다. 노션의 설명을 보완한 수식·좌표 그림·실행 예제·실습과 풀이를 담았다."
slug: "vector-length-dot-cross"
date: "2026-10-17"
topic: "math"
kind: "note"
tags: ["Math", "Vector", "C#", "Unity", "Verification"]
draft: false
---

## 위치에서 방향을 만들고 방향으로 판정하기

캐릭터가 목표를 향해 이동하려면 현재 위치와 목표 위치의 차이가 필요하다. 목표가 앞에 있는지 판단하려면 전방과 목표 방향의 관계를 봐야 한다. 지면의 방향을 구하려면 평면 위의 두 변에서 법선을 만들 수 있다.

각 작업은 서로 다른 벡터 연산을 사용한다.

| 알고 싶은 것 | 사용할 연산 | 주의할 조건 |
| --- | --- | --- |
| A에서 B까지의 변위 | B−A | 같은 좌표계의 위치인가 |
| 거리·크기 | 길이 또는 길이의 제곱 | 거리와 방향을 섞지 않는가 |
| 크기와 분리한 방향 | 정규화 | 영벡터·작은 벡터를 어떻게 처리하는가 |
| 앞뒤·각도·투영 | 내적 | 단위벡터인지, 투영축 길이가 1인지 |
| 법선·회전 방향·평행성 | 외적 | 인자 순서·축 규약·영벡터 예외 |

이 글은 [벡터 수학](https://app.notion.com/p/3835c49926f740bd9e79034a7159c7a0), [벡터의 내적과 외적](https://app.notion.com/p/cc2887ab622b4f378e2d09d8a6604bca), [물체의 수학 3: 벡터의 내적과 외적](https://app.notion.com/p/6eb70c7ac1964221b1271b9196b91e3d) 노션 기록을 묶어 새로 정리했다. 노트의 거리·방향·시야각·법선 주제를 사용하되, 원문 그림과 긴 설명을 옮기지 않고 수식·예제·좌표 그림을 새로 작성했다. 노트에 포함된 책·강의의 정확한 원 출처와 이미지 내용은 이번에 확인하지 못했다.

일부 설명에는 조건을 보완했다. 내적이 언제나 투영 길이인 것은 아니며, 외적이 0이라고 영벡터까지 방향이 평행하다고 부르지는 않는다. 외적 판정이 항상 더 빠르다는 성능 결론도 사용하지 않는다.

실행 예제는 .NET의 `System.Numerics.Vector3`를 사용한다. Unity의 `Vector3`와 수학적 역할을 연결하지만 타입·API·작은 값 처리까지 동일하다고 가정하지 않는다. 이 글은 DCB의 전투·IK 구현을 새로 실행해 검증한 기록이 아니다.

## 1 위치·변위·방향을 구분하기

위치는 기준 원점에서 물체가 어디 있는지를 나타낸다. 변위는 한 위치에서 다른 위치까지 얼마나, 어느 방향으로 이동하는지를 나타낸다. 같은 세 숫자 타입으로 저장해도 뜻이 다르다.

$$
A=(1,2,3),\quad B=(4,6,3)
$$

$$
\mathbf d=B-A=(3,4,0)
$$

A에서 B로 가는 변위는 `(3,4,0)`이다. 반대로 `A−B`를 계산하면 `(-3,-4,0)`이며 방향이 뒤집힌다. 위치 A에 변위 d를 더하면 B가 된다.

`target.position`과 `transform.position`처럼 같은 월드 좌표계의 위치끼리 뺀다. 한쪽은 로컬 위치, 다른 쪽은 월드 위치라면 뺄셈 전에 기준을 맞춰야 한다. [몬스터 전투 글](/writing/monster-combat/)의 목표 방향이나 [OpenGL 글](/writing/opengl-vertex-texture-pipeline/)의 공간 변환도 이런 구분을 전제로 읽을 수 있다.

스칼라를 곱하면 길이가 바뀐다. 양수를 곱하면 방향을 유지하고, 음수를 곱하면 방향을 뒤집는다. 벡터 덧셈은 이동량을 합성하는 데 사용한다.

## 2 길이와 길이의 제곱

직교 좌표계에서 벡터의 길이는 피타고라스 정리로 구한다.

$$
\|\mathbf v\|=\sqrt{x^2+y^2+z^2},\qquad
\|\mathbf v\|^2=x^2+y^2+z^2
$$

앞의 변위는 길이가 5다. 실제 거리도 `|B−A|`로 계산한다.

![변위 3,4의 성분과 길이 5, 정규화 결과를 나타낸 좌표 그림](/media/vector-length-dot-cross/length-normalize.svg)

그림은 z 성분이 0인 변위를 x-y 평면에 그린 것이다. 점선의 수평·수직 이동량은 각각 3과 4이며, 대각선 길이는 5다. 정규화한 성분 `(0.6,0.8)`은 위치가 아니라 길이 1의 방향이다.

### 범위 검사에는 제곱끼리 비교할 수 있다

반지름 r이 0 이상일 때 다음 두 조건은 수학적으로 같다.

$$
\|B-A\|\le r
\quad\Longleftrightarrow\quad
\|B-A\|^2\le r^2
$$

예를 들어 거리 제곱 25와 반지름 5를 비교하려면 `25 <= 25`다. `25 <= 5`로 비교하면 단위가 맞지 않는다. 음수 반지름을 그대로 제곱해 양수 범위로 만드는 것도 잘못된 입력 처리다.

제곱 비교는 제곱근 계산을 생략할 수 있다. 이것만으로 실제 게임의 프레임 시간이 얼마나 줄어드는지는 알 수 없다. 자료형의 범위·정밀도와 전체 호출량도 함께 봐야 한다.

## 3 정규화: 방향을 유지하면서 길이를 1로 만들기

길이가 0이 아닌 벡터의 단위벡터는 다음과 같다.

$$
\hat{\mathbf v}=\frac{\mathbf v}{\|\mathbf v\|}
$$

`(3,4,0)`을 5로 나누면 `(0.6,0.8,0)`이며 길이는 1이다. 원래 길이 정보는 사라지므로 거리가 필요하면 정규화 전에 따로 보관한다.

정규화한 방향에 속력과 시간을 곱하면 이동량을 만들 수 있다.

$$
\Delta\mathbf p=\hat{\mathbf d}\,s\,\Delta t
$$

속력 2, 시간 0.5초라면 이동량은 `(0.6,0.8,0)`이고 길이는 1이다. 변위 `(3,4,0)` 자체에 속력을 곱하면 목표까지의 거리가 이동 속도에 섞인다.

키보드의 디지털 대각선 입력 `(1,0,1)`도 길이는 $\sqrt 2$다. 정규화하면 축 방향과 속력을 맞출 수 있다. 다만 아날로그 입력을 항상 단위 길이로 만들면 약한 입력까지 최대 속도가 된다. 그 경우 길이가 1을 넘을 때만 줄이는 정책 등을 별도로 선택한다.

### 영벡터에는 방향이 없다

`(0,0,0)`을 길이 0으로 나눌 수 없다. 매우 작은 벡터도 방향 계산에 사용하기 전에 정책을 정한다. 아래 예제는 최소 길이 이하를 false로 반환하고 출력 방향을 0으로 둔다.

그때 출력된 0은 단위벡터가 아니다. 호출자가 이동 중단·마지막 방향 유지 등 다음 동작을 선택해야 한다. Unity도 너무 작은 벡터의 정규화 결과를 0으로 처리한다고 설명하지만, 그 판정 기준과 새 예제의 epsilon이 같다는 뜻은 아니다. [Unity Normalize 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Vector3.Normalize.html)

단위 방향으로 한 프레임의 이동량을 정했다고 목표 지점에 정확히 멈추는 것도 아니다. 이동량이 남은 거리보다 크면 목표를 넘는다. 목표까지의 거리로 이동량을 제한하는 처리는 별도다.

## 4 내적: 성분 계산과 각도 관계

내적의 결과는 벡터가 아니라 스칼라다.

$$
\mathbf a\cdot\mathbf b=a_xb_x+a_yb_y+a_zb_z
$$

$$
\mathbf a\cdot\mathbf b=\|\mathbf a\|\|\mathbf b\|\cos\theta
$$

두 벡터의 차이 길이를 전개하면 $\|\mathbf a-\mathbf b\|^2=\|\mathbf a\|^2+\|\mathbf b\|^2-2\mathbf a\cdot\mathbf b$가 된다. 같은 삼각형의 코사인 법칙과 비교하면 길이·각도의 식을 얻는다.

| 0이 아닌 두 벡터의 내적 | 사이각 | 방향 관계 |
| --- | --- | --- |
| 양수 | 90°보다 작음 | 비슷한 쪽 |
| 0 | 90° | 수직 |
| 음수 | 90°보다 큼 | 반대쪽 |

앞뒤를 부호로만 나눌 때는 길이가 양수인 한 꼭 정규화할 필요는 없다. 하지만 내적값을 cosine으로 읽으려면 두 벡터가 단위벡터여야 한다. 일반 내적은 `[-1,1]` 범위에 묶이지 않는다. 자기 자신과의 내적은 길이의 제곱이다. [Unity Dot 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Vector3.Dot.html)

### 투영 길이에는 축의 길이 조건이 있다

노션의 “벡터를 다른 벡터에 투영한 길이” 설명에는 축의 정규화 조건을 추가한다. a가 0이 아닐 때 b를 a 방향으로 투영한 **부호 있는 길이**는 다음과 같다.

$$
\ell=\mathbf b\cdot\hat{\mathbf a}
=\frac{\mathbf b\cdot\mathbf a}{\|\mathbf a\|}
$$

투영 **벡터**는 길이와 다르다.

$$
\operatorname{proj}_{\mathbf a}\mathbf b
=\frac{\mathbf b\cdot\mathbf a}{\mathbf a\cdot\mathbf a}\mathbf a
$$

`a=(2,0,0)`, `b=(3,4,0)`이면 원래 내적은 6이다. 부호 있는 투영 길이는 3이고 투영 벡터는 `(3,0,0)`이다. 축을 `(-2,0,0)`으로 뒤집으면 길이의 부호는 -3이지만, 같은 직선 위의 투영 벡터는 여전히 `(3,0,0)`이다.

단위 법선 n을 가진 평면 위로 벡터 v를 투영할 때는 $\mathbf v_{plane}=\mathbf v-(\mathbf v\cdot\mathbf n)\mathbf n$처럼 법선 방향 성분을 뺀다. 법선을 단위 길이로 가정한 식이다.

## 5 내적으로 시야각 판정하기

전체 시야각을 $\alpha$, 전방 단위벡터를 $\hat{\mathbf f}$, 목표 방향 단위벡터를 $\hat{\mathbf d}$라고 하자. 정면을 중심으로 좌우에 반씩 배치된 시야는 다음 조건으로 검사할 수 있다.

$$
\hat{\mathbf f}\cdot\hat{\mathbf d}\ge\cos(\alpha/2)
$$

전체 시야각이 90°라면 반각은 45°이고 기준은 약 0.7071이다. 90°를 그대로 cosine에 넣으면 좌우 90°씩, 총 180°인 다른 범위를 검사하게 된다.

![XZ 평면의 반지름 5, 전체 시야각 90도와 목표 P 및 Q](/media/vector-length-dot-cross/fov-xz.svg)

위에서 내려다본 그림에서 x는 오른쪽, z는 전방이다. P의 수평 변위 `(3,0,4)`는 길이가 5이고 전방과의 단위 내적은 0.8이다. Q `(4,0,3)`은 거리도 5지만 단위 내적이 0.6이므로 각도 범위 밖이다. P는 각도 내부이며 거리 경계에 포함한다.

시야 판정에 실제 각도 수치가 필요 없다면 `acos` 없이 cosine 기준과 비교할 수 있다. 각도를 구할 때는 $\theta=\arccos(\operatorname{clamp}(\hat f\cdot\hat d,-1,1))$로 범위를 맞춘다. 부동소수점 오차로 입력이 범위를 조금 넘을 수 있기 때문이다.

### XZ 평면 판정과 3차원 판정

지상 캐릭터의 수평 시야라면 높이 성분을 제거한 뒤 길이와 방향을 구한다. 3차원 방향을 먼저 정규화하고 y만 지우면 남은 벡터의 길이가 달라지므로 다시 정규화해야 한다.

아래 예제는 각도와 거리 모두 XZ 평면에서 검사한다. 높이 100인 대상도 수평 거리가 같으면 같은 결과다. 실제 시야에는 높이 제한·가림·대상의 크기·여러 판정점이 더 필요할 수 있다. 이 조건은 시야 후보 범위이며 벽 뒤 대상을 실제로 볼 수 있다는 판정이 아니다.

## 6 외적: 수직 방향과 넓이

이 글의 3차원 외적은 다음 성분식으로 계산한다.

$$
\mathbf a\times\mathbf b=
(a_yb_z-a_zb_y,\ a_zb_x-a_xb_z,\ a_xb_y-a_yb_x)
$$

결과가 0이 아니라면 두 입력 모두에 수직이다. 크기는 두 변이 만드는 평행사변형 넓이다.

$$
\|\mathbf a\times\mathbf b\|=\|\mathbf a\|\|\mathbf b\|\sin\theta
$$

삼각형의 넓이는 그 절반이다. 순서를 바꾸면 부호가 뒤집힌다.

$$
\mathbf b\times\mathbf a=-(\mathbf a\times\mathbf b)
$$

### 세 점에서 법선 구하기

삼각형의 꼭짓점 A·B·C에서 두 변을 만든다.

$$
\mathbf u=B-A,\quad \mathbf v=C-A,\quad
\hat{\mathbf n}=\frac{\mathbf u\times\mathbf v}{\|\mathbf u\times\mathbf v\|}
$$

`A=(0,0,0)`, `B=(1,0,0)`, `C=(0,0,1)`이면 외적은 `(0,-1,0)`이다. B와 C의 순서를 바꾸면 `(0,1,0)`이다. 세 점이 겹치거나 한 직선 위에 있으면 방향이 있는 법선을 만들 수 없다.

법선은 수직 방향이며 자동으로 원하는 “위쪽”을 선택하지 않는다. 메시에서 노멀을 바꾸는 것과 삼각형 인덱스 순서로 앞뒤 면을 정하는 것도 별개다. 이 글은 메시 렌더링·뒷면 제거를 실행해 확인한 글이 아니다.

### 외적이 0일 때의 예외와 허용 오차

0이 아닌 두 벡터의 외적이 0이면 평행 또는 반평행이다. 한쪽이 영벡터여도 외적은 0이지만 영벡터의 방향은 정의되지 않는다.

거의 평행한지를 판단할 때 원래 외적의 절댓값만 비교하면 입력 길이에 영향을 받는다. 먼저 두 벡터가 유효한지 확인하고 단위벡터 외적의 크기와 각도 허용치를 비교할 수 있다.

$$
\|\hat{\mathbf a}\times\hat{\mathbf b}\|^2
\le \sin^2(\theta_{tol})
$$

이 조건은 같은 방향과 반대 방향을 모두 포함한다. 둘을 나누려면 내적 부호도 함께 본다. 내적·외적 중 어느 방법이 더 빠른지는 필요한 출력·정규화 재사용·플랫폼과 측정 조건에 따라 달라진다.

## 7 외적 순서와 좌우 판정의 축 규약

이번 수평 예제는 `+X=오른쪽`, `+Y=위`, `+Z=전방`을 사용한다. 전방 f에서 목표 방향 d가 오른쪽에 있는지 볼 때 다음 부호를 사용한다.

$$
s=\mathbf{up}\cdot(\mathbf f\times\mathbf d)
$$

`f=(0,0,1)`, `d=(1,0,0)`, `up=(0,1,0)`이면 s는 1이다. 이 규약에서는 양수가 오른쪽이다. 외적 순서를 바꾸거나 up의 방향을 바꾸면 부호가 반대가 된다. 전방·후방으로 나란하면 0이므로 좌우 부호만으로 앞뒤를 구별하지 못한다.

Unity의 Cross 문서는 엔진 좌표계에서 외적 방향을 왼손 법칙으로 설명한다. 다른 책·그래픽스 문맥의 손 규칙만 가져오기보다 축과 인자 순서를 먼저 고정하고 기준 벡터로 확인한다. 여기서의 수치 예제와 Unity 실제 장면의 확인은 구분한다. [Unity Cross 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Vector3.Cross.html)

## 예제 1 안전하게 실패를 알리는 계산 함수

아래는 새로 작성한 .NET 콘솔용 `VectorStudy.cs`다. `System.Numerics.Vector3`의 성분을 사용하고 일부 중간 계산은 double로 수행한다. Unity의 `Vector3` 구현을 복사하거나 성능을 비교한 코드는 아니다. [System.Numerics.Vector3 문서](https://learn.microsoft.com/en-us/dotnet/api/system.numerics.vector3?view=net-10.0)

~~~csharp
using System;
using System.Numerics;

public static class VectorStudy
{
    public const double DirectionEpsilon = 1e-6;
    public const double DotTolerance = 1e-6;

    public static void RequireFinite(Vector3 value)
    {
        if (!float.IsFinite(value.X) || !float.IsFinite(value.Y) ||
            !float.IsFinite(value.Z))
            throw new ArgumentException("유한한 벡터가 필요하다.");
    }

    public static double Dot(Vector3 a, Vector3 b)
    {
        RequireFinite(a); RequireFinite(b);
        return (double)a.X * b.X + (double)a.Y * b.Y + (double)a.Z * b.Z;
    }

    public static double LengthSquared(Vector3 value) => Dot(value, value);

    public static bool TryNormalize(Vector3 value, out Vector3 unit,
        double minLength = DirectionEpsilon)
    {
        if (!double.IsFinite(minLength) || minLength <= 0)
            throw new ArgumentOutOfRangeException(nameof(minLength));
        double length = Math.Sqrt(LengthSquared(value));
        unit = Vector3.Zero;
        if (length <= minLength) return false;
        unit = new Vector3((float)(value.X / length),
            (float)(value.Y / length), (float)(value.Z / length));
        return true;
    }

    public static double ScalarProjection(Vector3 value, Vector3 axis)
    {
        RequireFinite(value);
        if (!TryNormalize(axis, out var unitAxis))
            throw new ArgumentException("투영축의 방향이 필요하다.");
        return Dot(value, unitAxis);
    }

    public static bool IsInViewXZ(Vector3 origin, Vector3 forward, Vector3 target,
        float radius, float fullAngleDegrees)
    {
        RequireFinite(origin); RequireFinite(forward); RequireFinite(target);
        if (!float.IsFinite(radius) || radius < 0)
            throw new ArgumentOutOfRangeException(nameof(radius));
        if (!float.IsFinite(fullAngleDegrees) || fullAngleDegrees < 0 ||
            fullAngleDegrees > 360)
            throw new ArgumentOutOfRangeException(nameof(fullAngleDegrees));
        double dx = (double)target.X - origin.X;
        double dz = (double)target.Z - origin.Z;
        double distanceSquared = dx * dx + dz * dz;
        if (distanceSquared <= DirectionEpsilon * DirectionEpsilon ||
            distanceSquared > (double)radius * radius) return false;
        var flatForward = new Vector3(forward.X, 0, forward.Z);
        if (!TryNormalize(flatForward, out var unitForward)) return false;
        double distance = Math.Sqrt(distanceSquared);
        var direction = new Vector3((float)(dx / distance), 0, (float)(dz / distance));
        double cosine = Math.Clamp(Dot(unitForward, direction), -1d, 1d);
        double threshold = Math.Cos(fullAngleDegrees * Math.PI / 360d);
        return cosine >= threshold - DotTolerance;
    }

    public static bool TryTriangleNormal(Vector3 a, Vector3 b, Vector3 c,
        out Vector3 normal, out double twiceArea, double minTwiceArea = 1e-8)
    {
        RequireFinite(a); RequireFinite(b); RequireFinite(c);
        if (!double.IsFinite(minTwiceArea) || minTwiceArea <= 0)
            throw new ArgumentOutOfRangeException(nameof(minTwiceArea));
        double ux = (double)b.X - a.X, uy = (double)b.Y - a.Y, uz = (double)b.Z - a.Z;
        double vx = (double)c.X - a.X, vy = (double)c.Y - a.Y, vz = (double)c.Z - a.Z;
        double nx = uy * vz - uz * vy;
        double ny = uz * vx - ux * vz;
        double nz = ux * vy - uy * vx;
        twiceArea = Math.Sqrt(nx * nx + ny * ny + nz * nz);
        normal = Vector3.Zero;
        if (twiceArea <= minTwiceArea) return false;
        normal = new Vector3((float)(nx / twiceArea),
            (float)(ny / twiceArea), (float)(nz / twiceArea));
        return true;
    }
}
~~~

길이와 외적 크기의 단위가 다르므로 임곗값도 구분했다. `DirectionEpsilon`은 예제에서 방향으로 취급할 최소 크기다. 위치 차이에 적용하면 월드 길이 단위이고, 전방 입력에 적용하면 그 입력 벡터의 크기 기준이다. `minTwiceArea`는 두 배 넓이의 기준이며 길이 기준과 같지 않다. `DotTolerance`는 단위 내적에 더한 무차원 허용치다.

이 숫자는 모든 프로젝트의 정답이 아니다. 단위와 장면 크기에 맞게 정해야 한다. dot 허용치로 각도 경계가 조금 넓어지므로 정확히 0°의 시야도 수치적으로 완벽한 일직선만 허용하는 조건은 아니다. 거리에는 같은 허용치를 더하지 않는다.

NaN·Infinity·음수 범위 등의 잘못된 입력은 예외로 구분한다. 방향이 너무 작거나 대상의 수평 위치가 같은 경우는 false다. 같은 위치를 범위 안으로 볼지, 공격 가능한 별도 상태로 처리할지는 호출자의 정책이다. double 중간 계산도 float로 저장한 원래 좌표의 정밀도를 복원하지는 못한다.

## 예제 2 출력으로 계산 결과 확인하기

빈 폴더에서 `dotnet new console --framework net10.0`을 실행하고 앞의 파일과 다음 `Program.cs`를 저장한다. `dotnet run`으로 실행한다. 이 글의 확인 환경은 .NET SDK 10.0.301이다.

~~~csharp
using System;
using System.Numerics;

static string V(Vector3 v) => FormattableString.Invariant($"({v.X:F3}, {v.Y:F3}, {v.Z:F3})");
var a = new Vector3(1, 2, 3);
var b = new Vector3(4, 6, 3);
var delta = b - a;
Console.WriteLine($"변위: {V(delta)}");
Console.WriteLine(FormattableString.Invariant($"길이: {Math.Sqrt(VectorStudy.LengthSquared(delta)):F3}"));
VectorStudy.TryNormalize(delta, out var unit);
Console.WriteLine($"단위 방향: {V(unit)}");
Console.WriteLine($"영벡터 정규화: {VectorStudy.TryNormalize(Vector3.Zero, out _)}");
var axis = new Vector3(2, 0, 0);
Console.WriteLine(FormattableString.Invariant($"원래 내적: {VectorStudy.Dot(axis, delta):F3}"));
Console.WriteLine(FormattableString.Invariant($"투영 길이: {VectorStudy.ScalarProjection(delta, axis):F3}"));
VectorStudy.TryTriangleNormal(Vector3.Zero, Vector3.UnitX, Vector3.UnitZ,
    out var normal, out var twiceArea);
Console.WriteLine($"삼각형 법선: {V(normal)}");
Console.WriteLine(FormattableString.Invariant($"삼각형 넓이: {twiceArea / 2:F3}"));
var turn = Vector3.Cross(Vector3.UnitZ, Vector3.UnitX);
Console.WriteLine(FormattableString.Invariant($"오른쪽 부호: {VectorStudy.Dot(Vector3.UnitY, turn):F3}"));

var cases = new (string Name, Vector3 Target)[]
{
    ("P", new Vector3(3, 0, 4)),
    ("Q", new Vector3(4, 0, 3)),
    ("각도 경계", new Vector3(3, 0, 3)),
    ("뒤", new Vector3(0, 0, -4)),
    ("높이만 변경", new Vector3(0, 100, 4)),
    ("범위 밖", new Vector3(0, 0, 6)),
    ("같은 수평 위치", Vector3.Zero)
};
foreach (var item in cases)
    Console.WriteLine($"{item.Name}: {VectorStudy.IsInViewXZ(Vector3.Zero, Vector3.UnitZ, item.Target, 5, 90)}");
~~~

~~~text
변위: (3.000, 4.000, 0.000)
길이: 5.000
단위 방향: (0.600, 0.800, 0.000)
영벡터 정규화: False
원래 내적: 6.000
투영 길이: 3.000
삼각형 법선: (0.000, -1.000, 0.000)
삼각형 넓이: 0.500
오른쪽 부호: 1.000
P: True
Q: False
각도 경계: True
뒤: False
높이만 변경: True
범위 밖: False
같은 수평 위치: False
~~~

높이만 변경한 대상이 true인 것은 오류가 아니라 수평 판정의 선택이다. 3차원 거리·시야를 원한다면 y도 포함하는 다른 조건이 필요하다. 예제는 장애물 검사를 하지 않는다.

## 실습 1 변위·길이·한 프레임 이동 계산하기

`A=(2,0,-1)`, `B=(5,0,3)`이고 속력은 2, 시간은 0.25초다.

1. A에서 B로 향하는 변위와 길이를 구한다.
2. 단위 방향과 한 프레임의 이동량을 구한다.
3. 방향을 정규화하지 않으면 이동량의 길이는 얼마인가?

### 풀이

변위는 `(3,0,4)`, 길이는 5다. 단위 방향은 `(0.6,0,0.8)`이다. 속력×시간은 0.5이므로 이동량은 `(0.3,0,0.4)`이고 길이는 0.5다.

정규화하지 않은 변위에 0.5를 곱하면 `(1.5,0,2)`이고 길이는 2.5다. 목표까지의 거리 5가 이동량에 섞였다. 반대로 목적지가 0.1만큼 남았는데 길이 0.5를 계속 이동하면 지나치므로 남은 거리 제한도 필요하다.

## 실습 2 영벡터·작은 벡터·잘못된 입력

예제 함수에 다음을 전달하고 결과를 예상한다.

| 입력 | 확인할 것 |
| --- | --- |
| `(0,0,0)` 정규화 | false일 때 출력 방향 |
| `(1e-9,0,0)` 정규화 | 최소 크기 기준 |
| `(3,4,0)` 정규화 | 결과 길이가 약 1인가 |
| NaN 성분 | 예외와 방향 미정의를 구분하는가 |
| 시야 반지름 -5 | 제곱하기 전에 거부하는가 |

### 풀이

앞의 두 경우는 false이며 출력은 Zero다. `(3,4,0)`은 성공하고 길이가 부동소수점 오차 범위에서 1이다. NaN은 유한한 벡터가 아니므로 예외다. 음수 반지름도 예외다.

실제 입력에서 false가 나오면 마지막 방향 유지·이동 중단 등 정책을 선택한다. 예외 입력을 모두 영벡터처럼 취급하면 설정 오류와 정상적인 정지 상태를 구분하기 어렵다.

## 실습 3 내적과 투영을 분리하기

`a=(2,0,0)`, `b=(3,4,0)`을 사용한다.

1. 원래 내적과 단위벡터끼리의 내적을 구한다.
2. b의 a 방향 투영 길이와 투영 벡터를 구한다.
3. `a=(-2,0,0)`으로 바꾸면 무엇이 달라지는가?

### 풀이

원래 내적은 6이다. 단위벡터끼리의 내적은 `(1,0,0)·(0.6,0.8,0)=0.6`이다. 부호 있는 투영 길이는 3이고 투영 벡터는 `(3,0,0)`이다.

축을 뒤집으면 원래 내적은 -6, 단위 내적은 -0.6, 투영 길이는 -3이다. 하지만 투영 벡터는 `(-3)×(-1,0,0)=(3,0,0)`이다. 길이·단위 cosine·투영 벡터를 같은 결과로 읽지 않는다.

## 실습 4 외적의 순서·퇴화·좌우 판정

다음 결과를 먼저 손으로 구하고 코드와 비교한다.

| 연산 | 결과 또는 정책 |
| --- | --- |
| `(1,0,0)×(0,0,1)` | `(0,-1,0)` |
| `(0,0,1)×(1,0,0)` | `(0,1,0)` |
| `(1,0,0)×(-2,0,0)` | 0, 반평행 |
| `(0,0,0)×(1,0,0)` | 0, 첫 벡터의 방향 없음 |
| A·B·C가 한 직선 위인 삼각형 | 법선 생성 false |

### 풀이

순서를 바꾸면 법선 부호가 반대다. 크기는 그대로이므로 삼각형 넓이는 같다. 외적이 0인 두 행은 결과는 같지만 입력의 방향 조건이 다르다.

전방 +Z·위 +Y 규약에서 오른쪽 +X는 `up·Cross(forward,right)=1`이다. 왼쪽 -X는 -1, 전방과 후방은 0이다. 좌우 0이라는 결과를 “앞에 있다”로 바꾸지 않고 내적 부호도 확인한다.

## 실습 5 시야각의 전체 각도와 판정 평면 바꾸기

예제 프로그램의 P·Q·각도 경계·높이 변경을 실행 전에 예측한다. 이어 전체 시야각을 60°·180°·360°로 바꾼다.

### 풀이

90°에서는 단위 내적 0.8인 P가 통과하고 0.6인 Q는 실패한다. 60°에서는 반각 30°의 기준이 약 0.8660이므로 둘 다 실패한다. 180°에서는 정면 반구의 둘 다 통과하며, 360°는 유효한 전방·거리·목표 방향 조건 아래 모든 수평 방향을 포함한다.

같은 수평 위치는 360°에서도 false다. 각도 입력이 넓다고 이 예제의 방향 미정의 정책까지 바뀌지는 않는다. 높이 차이를 포함하려면 거리 계산과 각도 계산 모두에서 원하는 공간을 다시 정해야 한다.

경계는 딱 같은 숫자 한 개만 시험하지 말고 안쪽·바깥쪽도 함께 본다. 예제의 dot 허용치는 아주 가까운 각도 바깥점도 포함할 수 있으므로 게임 규칙에 맞는 오차 범위를 정한다.

## 실습 6 Unity에서 확인할 내용

다음은 **실행 계획이며 아직 수행하지 않았다.** Unity의 별도 연습 씬에서 위치·전방·목표를 준비하고 선을 표시한다.

| 연결할 연산 | Unity에서 사용할 수 있는 API | 확인할 것 |
| --- | --- | --- |
| 길이·길이 제곱 | magnitude·sqrMagnitude | 3-4-5 계산과 범위 경계 |
| 단위 방향 | normalized·Normalize | 영벡터·아주 작은 입력의 정책 |
| 내적·외적 | Vector3.Dot·Vector3.Cross | 기준 축·인자 순서 |
| 방향 표시 | Debug.DrawRay·Gizmos | 월드·로컬 혼용 여부 |
| 실제 인식 | 프로젝트에 맞는 추가 검사 | 높이·가림·대상 크기 |

### 풀이

먼저 정면·후면·좌우·같은 위치의 기준 사례부터 본다. 대상만 높이 이동한 경우 수평 판정이 유지되는지, 관찰자의 전방이 수직이 되면 수평 방향을 정의할 수 없는지도 확인한다.

이후 부모 회전과 비균일 스케일, 실제 경사면, 목표점 선택·가림 검사를 붙인다. 법선의 순서를 바꾼 뒤 화면도 비교한다. 콘솔 수치가 맞는 것과 Unity 장면의 데이터·좌표 변환·판정이 맞는 것은 다른 확인이다.

## 확인한 범위와 남은 검증

본문의 C# 두 블록을 추출해 .NET SDK 10.0.301에서 경고를 오류로 처리해 컴파일·실행했고, 예제 출력과 일치했다. 별도 검사 49개 항목에는 경계·오류 입력과 고정 시드 벡터 쌍 1,000개의 단위 길이·외적 수직성·순서에 따른 부호 확인이 포함된다. 실제 게임 실행이나 성능 측정 횟수는 아니다.

| 대상 | 확인 범위 |
| --- | --- |
| 노션의 거리·방향·시야각·법선 주제 | 텍스트와 코드 조각 대조 |
| 원문의 그림·책/강의 원 출처 | 이번에 미확인, 그림·긴 설명을 복제하지 않음 |
| 정규화·내적·외적 API | 연결한 공식 문서와 대조 |
| 새 계산 함수·실행 프로그램 | 본문에서 추출해 .NET에서 컴파일·실행 |
| 영벡터·투영·거리/각도 경계·퇴화 법선·오류 입력 | 독립 수치 검사로 확인 |
| 좌표 그림 두 개 | 새로 그린 설명 자료, 게임 캡처 아님 |
| Unity 컴파일·장면·API의 작은 값 처리 비교 | 미실행 |
| DCB 전투·IK·카메라 적용·GPU 화면·성능 | 이번에 검증하지 않음 |

설명·수치 예제·좌표 그림·실습·풀이와 검사는 AI의 도움을 받아 새로 작성했다. 독립 콘솔의 수치 검증을 현재 게임의 실행 결과나 성능 개선으로 확대하지 않는다. 원문에 있던 쿼터니언·행렬 전체는 이 글의 범위에 넣지 않았으며, 좌표 변환과 회전은 후속 학습에서 다룬다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [화면 좌표를 월드로, 월드 위치를 UI로 옮기기](/writing/unity-screen-world-ui-coordinates/)
