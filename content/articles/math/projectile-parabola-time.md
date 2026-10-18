---
title: "시간에 따른 포물선 운동과 일정 가속도"
description: "위치·속도·가속도에서 포물선 운동식을 유도한다. 최고점·비행시간과 이산 갱신 오차를 C# 예제·실습·풀이로 확인한다."
slug: "projectile-parabola-time"
date: "2022-01-20"
dateBasis: "notion"
updated: "2026-10-18"
topic: "math"
kind: "note"
tags: ["Math", "Motion", "Physics", "C#"]
draft: false
---

## 노션에 남은 제목에서 계산을 보완한다

노션의 [포물선 공식](https://app.notion.com/p/d6a79b1acc034bf28e8cee0e3e4b919f)은 제목과 달리 피타고라스 정리와 미완성 삼각함수 항목만 있었다. 아래 운동식 유도·수치 예제·실습은 이번 정리에서 새로 작성했다. 기존 게임에서 투사체 기능을 완성하거나 플레이로 검증한 기록으로 읽지 않는다.

이 글의 모델은 2D이며 x는 수평, y는 위쪽이다. 길이는 m, 시간은 s다. 중력 가속도는 아래쪽으로 일정하고 공기 저항·충돌·회전은 없다. 예제의 $g=10\,m/s^2$는 계산을 쉽게 하려고 정한 예제용 값이다.

## 속도와 가속도에서 위치를 구한다

속도는 위치의 시간 변화율, 가속도는 속도의 시간 변화율이다. 일정한 가속도 a에서 시작 시간 0의 속도가 v0이면

$$
v(t)=v_0+at
$$

이다. 시간 0부터 t까지 속도의 평균은 $(v_0+v(t))/2$이므로 위치 변화는 $v_0t+\frac12at^2$다. 이를 적분으로도 얻을 수 있다.

$$
p(t)=p_0+v_0t+\frac12at^2
$$

단위를 확인하면 속도 $m/s$에 시간 s를 곱한 항과 가속도 $m/s^2$에 $s^2$를 곱한 항이 모두 m가 된다. 가속도에 `deltaTime`을 한 번만 곱해 위치에 바로 더하면 단위가 맞지 않는다.

## 수평과 수직을 나눈다

초기 속력을 s, 발사각을 $\theta$라 하면 $v_{0x}=s\cos\theta$, $v_{0y}=s\sin\theta$다. 가속도를 $(0,-g)$로 두면

$$
x(t)=x_0+v_{0x}t,\qquad
y(t)=y_0+v_{0y}t-\frac12gt^2
$$

다. $v_{0x}\ne0$일 때 t를 없애면

$$
y=y_0+\frac{v_{0y}}{v_{0x}}(x-x_0)-\frac{g}{2v_{0x}^2}(x-x_0)^2
$$

가 되어 x에 대한 포물선임을 알 수 있다. 수직으로 쏘면 $v_{0x}=0$이므로 이 형태로 나눌 수 없다. 시간 함수 $p(t)$는 그 경우에도 사용할 수 있다.

## 최고점·같은 높이의 비행시간

위쪽 초기 속도가 양수일 때 최고점에서는 $v_y(t)=v_{0y}-gt=0$이다.

$$
t_{peak}=v_{0y}/g,\qquad \Delta y_{peak}=v_{0y}^2/(2g)
$$

출발과 같은 높이로 돌아오는 시간은 t=0 이외의 해인 $t_{flight}=2v_{0y}/g$다. 수평 도달 거리는 $v_{0x}t_{flight}$다. 이 식을 높이가 다른 지면의 충돌 시간으로 그대로 쓰면 안 된다.

예를 들어 p0=(0,0), v0=(6,8), g=10이면 최고점은 0.8초, 추가 높이는 3.2m다. 같은 높이로 돌아오는 시간은 1.6초, 수평 거리는 9.6m다.

목표 높이 $y_g$가 다르면 $y_0+v_{0y}t-gt^2/2=y_g$의 근을 구한다. 판별식 $v_{0y}^2+2g(y_0-y_g)$가 음수이면 그 높이에 도달하지 못한다. 양수면 두 시간이 양수일 수도 있으므로 상승·하강 중 어느 접점을 원하는지 고르고, 음수 시간을 제외한다. 실제 지형 충돌은 선분·스윕·물리 엔진의 별도 문제다.

## 실행 예제와 Euler 갱신의 차이

다음 .NET 콘솔 코드는 해석식과 explicit Euler를 비교한다. Euler는 각 단계에서 **기존 속도로 위치를 먼저 갱신**하고 속도에 가속도를 더한다. 속도를 먼저 갱신하는 semi-implicit Euler와 구분한다.

```csharp
using System;

static (double x, double y) Position(double time)
{
    if (!double.IsFinite(time) || time < 0) throw new ArgumentOutOfRangeException(nameof(time));
    return (6 * time, 8 * time - 0.5 * 10 * time * time);
}
static (double x, double y) ExplicitEuler(double total, int steps)
{
    if (steps <= 0) throw new ArgumentOutOfRangeException(nameof(steps));
    double dt = total / steps;
    double x = 0, y = 0, vx = 6, vy = 8;
    for (int i = 0; i < steps; i++)
    {
        x += vx * dt;
        y += vy * dt;
        vy -= 10 * dt;
    }
    return (x, y);
}
static void Near(double actual, double expected)
{
    if (Math.Abs(actual - expected) > 1e-10) throw new Exception($"expected {expected}, got {actual}");
}

Near(Position(0).x, 0);
Near(Position(0).y, 0);
Near(Position(0.8).y, 3.2);
Near(Position(1.6).y, 0);
Near(Position(1.6).x, 9.6);
Near(Position(0.5).y, 2.75);
Near(ExplicitEuler(1, 10).y - Position(1).y, 0.5);
Near(ExplicitEuler(1, 20).y - Position(1).y, 0.25);
Near(ExplicitEuler(1, 100).y - Position(1).y, 0.05);
for (int i = 0; i <= 100; i++)
{
    double t = i / 100d;
    double h = 1e-4;
    if (t > 0)
    {
        double derivative = (Position(t + h).y - Position(t - h).y) / (2 * h);
        Near(derivative, 8 - 10 * t);
    }
}
Console.WriteLine("projectile: position, peak, flight and Euler checks passed");
```

일정한 가속도를 쓰는 위 explicit Euler에서 총 시간 T의 높이 오차는 $\frac12gT\Delta t$다. 시간 간격을 절반으로 줄이면 이 모델의 오차도 절반이 된다.

## 매 프레임 누적과 경과 시간

해석식을 쓴다면 시작 위치·초기 속도·시작 이후 경과 시간을 보관해 매번 `Position(elapsed)`를 평가할 수 있다. 현재 위치를 새 시작점으로 쓰면서 전체 elapsed를 다시 넣으면 이동량을 중복 적용한다.

일정 가속도에서 현재 상태로 한 단계씩 갱신하려면 $p_{next}=p+v\Delta t+\frac12a\Delta t^2$, $v_{next}=v+a\Delta t$로 일관되게 갱신할 수 있다. 그러나 충돌과 힘이 바뀌는 실제 물리 시스템을 이 공식 하나로 대체할 수는 없다. Rigidbody를 쓰는 경우에는 물리 엔진의 갱신 방식과 힘의 소유권을 확인해야 한다.

## 실습

1. 초기 수직 속도 12m/s, g=10에서 최고점 시간과 추가 높이를 구한다.
2. 수평 속도 5m/s로 같은 높이에 착지하면 비행시간과 수평 거리는 얼마인가?
3. 예제의 explicit Euler에서 T=1초, dt=0.02초인 높이 오차를 구한다.
4. y0=0, 초기 수직 속도 8m/s에서 목표 높이 4m에 도달할 수 있는가?

## 풀이

1. $12/10=1.2$초, $12^2/20=7.2$m다.
2. $2\cdot12/10=2.4$초, $5\cdot2.4=12$m다.
3. $0.5\cdot10\cdot1\cdot0.02=0.1$m다. 이 explicit Euler 예제는 낙하 가속도를 위치에 한 단계 늦게 반영하므로 해석식보다 높다.
4. 최고 높이가 3.2m여서 불가능하다. 판별식도 $8^2-2\cdot10\cdot4=-16$으로 음수다.

## 확인한 범위

.NET 콘솔에서 위치·최고점·같은 높이의 비행시간, 세 시간 간격의 Euler 오차와 위치 미분을 검사했다. Unity 물리·Rigidbody·충돌·프레임 의존성·실제 투사체 궤적 화면은 실행하지 않았다. 원문에 없던 유도와 예제는 신규 보완이며 AI를 사용해 작성·검사했다. 관련 기초는 [삼각함수·Atan2](/writing/trigonometry-radians-atan2/), 전체 순서는 [수학 읽기 순서](/writing/game-math-reading-order/)에 있다.
