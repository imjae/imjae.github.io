---
title: "Behavior Tree의 Sequence·Selector·Running과 중단"
description: "반환 상태 세 가지와 메모리형 Sequence를 구현하고, 상위 조건이 바뀔 때 실행 중 행동을 취소합니다. 실행 추적 예제와 실습·풀이를 다룹니다."
slug: "behavior-tree-running-abort"
date: "2022-04-08"
dateBasis: "notion"
updated: "2026-10-23"
topic: "gameplay"
kind: "note"
tags: ["AI", "Behavior Tree", "C#"]
draft: false
---

## 행동이 한 프레임 안에 끝나지 않을 때

[Behavior Tree 노트](https://app.notion.com/p/314d3083c419405287541604be499729)는 FSM과의 비교, Composite·Decorator와 중단을 다룹니다. 특정 구현의 스택 탐색 규칙을 모든 BT에 적용하지 않고, 이 글에서 사용할 Tick·Abort 의미를 먼저 정합니다.

| 결과 | 의미 | 부모가 할 일 |
| --- | --- | --- |
| Success | 이번 행동 완료 | 다음 단계 또는 전체 성공 |
| Failure | 이번 행동 수행 실패 | 실패 반환 또는 대안 선택 |
| Running | 아직 진행 중 | 다음 Tick에서 계속 |

Sequence는 자식을 순서대로 실행하고 하나가 실패하면 실패합니다. Selector는 실패한 후보 다음을 시도하며 하나가 성공하면 성공합니다. 어느 쪽도 Running을 즉시 실패로 바꾸지 않습니다. 메모리형은 진행 위치를 저장하고, 반응형은 상위 조건을 다시 평가할 수 있습니다. 둘은 중단 정책이 다릅니다. [BehaviorTree.CPP의 Sequence 설명](https://www.behaviortree.dev/docs/nodes-library/SequenceNode/)

## 메모리형 Sequence와 외부 중단

아래 Program.cs는 .NET 콘솔용입니다. Wait는 두 번 Tick하면 성공합니다. 상위 조건이 사라지면 Abort로 누적 진행을 지웁니다.

```csharp
using System;

var wait = new WaitTwoTicks();
var sequence = new Sequence(wait, new Act());
Console.WriteLine(sequence.Tick());
sequence.Abort(); // 상위 조건 소실: 진행하던 행동을 취소한다.
Console.WriteLine(sequence.Tick());
Console.WriteLine(sequence.Tick());

enum Status { Success, Failure, Running }
interface INode { Status Tick(); void Abort(); }
sealed class WaitTwoTicks : INode
{
    int ticks;
    public Status Tick() => ++ticks >= 2 ? Status.Success : Status.Running;
    public void Abort() { ticks = 0; }
}
sealed class Act : INode
{
    public Status Tick() { Console.WriteLine("Act"); return Status.Success; }
    public void Abort() { }
}
sealed class Sequence(params INode[] children) : INode
{
    int index;
    public Status Tick()
    {
        while (index < children.Length)
        {
            var result = children[index].Tick();
            if (result == Status.Running) return result;
            if (result == Status.Failure) { Abort(); return result; }
            index++;
        }
        Abort();
        return Status.Success;
    }
    public void Abort()
    {
        foreach (var child in children) child.Abort();
        index = 0;
    }
}
```

```text
Running
Running
Act
Success
```

이 예제의 Abort는 모든 자식의 상태를 초기화하는 Reset 역할도 합니다. 그래서 여러 번 불러도 안전해야 합니다. 실제 자원 취소와 완료 후 초기화가 다른 행동이라면 `Reset`과 `Cancel`을 분리합니다. 예제의 단순 계약을 외부 라이브러리와 같다고 가정하지 않습니다.

## Selector와 조건 중단의 설계

Selector는 위 Sequence 루프에서 ‘Success면 종료, Failure면 index 증가’로 바꿔 만들 수 있습니다. 그러나 그 변경만으로 우선순위 반응형 Selector가 되는 것은 아닙니다. 저우선 이동이 Running인 동안 고우선 위험 회피 조건을 다시 검사할지 결정해야 합니다.

공격을 시작한 뒤 타깃이 사라졌다면 조건이 Failure를 반환하는 것뿐 아니라 실행 중 공격의 예약·이벤트·이동을 정리해야 합니다. 부모가 다른 가지로 넘어가기 전에 현재 가지의 Abort가 완료되는 순서를 정합니다. [BehaviorTree.CPP의 reactive 노드 설명](https://www.behaviortree.dev/docs/nodes-library/FallbackNode/)

## 실습과 풀이

1. Abort 호출을 지웁니다. **풀이:** 두 번째 Tick에서 Wait가 완료되어 Act와 Success가 먼저 나옵니다. 중단을 호출한 경우 세 번째 Tick까지 다시 기다립니다.
2. 항상 Failure인 노드를 Act 앞에 넣습니다. **풀이:** Act는 실행되지 않아야 합니다. 반환 후 Sequence 위치는 초기화됩니다.
3. 자식이 없는 Sequence의 결과를 정합니다. **풀이:** 이 구현은 모든 자식이 성공했다는 공집합 규칙으로 Success를 반환합니다. 빈 Selector는 Failure로 정하는 것이 일관되지만, 반드시 라이브러리 문서와 맞춥니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [캐릭터 방향과 이동 벡터를 같은 좌표계로 맞추기](/writing/movement-facing-coordinate-space/)
