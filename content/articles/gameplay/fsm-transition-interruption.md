---
title: "FSM의 Enter·Execute·Exit와 전이·중단 규칙"
description: "상태 전이를 프레임 경계에 반영하는 작은 FSM으로 재진입·실행 중 전이·죽음 우선순위를 확인한다. 완성 예제와 실습·풀이를 제공한다."
slug: "fsm-transition-interruption"
date: "2022-03-22"
dateBasis: "notion"
updated: "2026-10-18"
topic: "gameplay"
kind: "note"
tags: ["AI", "FSM", "C#"]
draft: false
---

## 상태 이름보다 전이 계약을 먼저 정하기

[FSM 노트](https://app.notion.com/p/08e6af888c814d488d7692a7be55b8eb)의 첫 예제는 ChangeState가 비어 있고, [FSM 03](https://app.notion.com/p/3e4529998da646639846adc9947f3950)은 Enter·Execute·Exit를 분리한다. 이를 바탕으로 실행 중 전이를 언제 반영할지까지 정의한 독립 예제를 만들었다.

FSM은 현재 상태와 입력에 따라 행동·다음 상태를 정한다. Enter는 진입 시 설정, Execute는 현재 상태의 실행, Exit는 그 상태가 소유한 자원 정리다. 프레임마다 Enter를 반복하면 타이머·이벤트가 계속 초기화되거나 중복 등록될 수 있다.

| 상황 | 이 예제의 규칙 |
| --- | --- |
| 같은 상태 요청 | 무시, Enter 재호출 안 함 |
| Execute 중 전이 | 요청만 저장, Execute 종료 뒤 한 번 반영 |
| 여러 요청 | 마지막 요청, 단 Dead가 있으면 Dead 우선 |
| Dead 진입 후 | 다른 상태로 전이 금지 |

이 규칙은 모든 FSM 라이브러리의 표준이 아니다. 즉시 전이도 가능하지만 호출 스택의 재진입과 이전 상태의 남은 코드 실행을 처리해야 한다.

## .NET 콘솔 예제

`dotnet new console`로 만든 프로젝트의 Program.cs를 교체한다. 예제의 로그가 호출 순서를 나타낸다. Unity나 DCB 실행기는 포함하지 않는다.

```csharp
using System;

var machine = new Machine();
machine.Request(State.Idle);
machine.Tick(m => { m.Request(State.Move); m.Request(State.Dead); });
machine.Request(State.Move);
machine.Tick(_ => { });

enum State { Idle, Move, Dead }
sealed class Machine
{
    State current = State.Idle;
    State? pending;
    public Machine() => Console.WriteLine("Enter Idle");
    public void Request(State next)
    {
        if (current == State.Dead || pending == State.Dead) return;
        pending = next;
    }
    public void Tick(Action<Machine> execute)
    {
        Commit();
        Console.WriteLine($"Execute {current}");
        execute(this);
        Commit();
    }
    void Commit()
    {
        if (pending is not State next) return;
        pending = null;
        if (current == next || current == State.Dead) return;
        Console.WriteLine($"Exit {current}");
        current = next;
        Console.WriteLine($"Enter {current}");
    }
}
```

```text
Enter Idle
Execute Idle
Exit Idle
Enter Dead
Execute Dead
```

첫 Idle 요청은 재진입하지 않는다. Move와 Dead가 같은 Execute에서 요청되어도 Dead가 선택된다. Execute가 끝날 때까지 current는 Idle이다. 실제 동작이 여러 줄이면 요청 뒤에도 이전 상태의 코드가 이어질 수 있으므로 필요하면 return으로 그 실행을 끝낸다.

## 상태가 공유될 때 데이터는 어디에 두나

싱글턴 상태 객체에 캐릭터별 target·경과 시간을 저장하면 서로 덮어쓸 수 있다. 상태의 불변 로직과 개체별 컨텍스트를 분리하거나 상태 인스턴스를 개체마다 만든다. Exit에서 취소한 작업의 늦은 콜백도 세대 번호나 취소 상태로 차단해야 한다.

이벤트 구독은 Enter에서 한 번, 해제는 Exit에서 대응시킨다. Animator 상태 전이와 게임 로직 FSM의 전이가 항상 같은 프레임에 완료되는 것은 아니므로 애니메이션 종료·공격 취소 계약도 따로 둔다. 일반적인 상태 패턴의 비교는 [Game Programming Patterns의 State](https://gameprogrammingpatterns.com/state.html)를 참고했다.

## 실습과 풀이

1. 첫 Tick에서 Move만 요청한다. **풀이:** Execute Idle 뒤 Exit Idle, Enter Move가 나와야 한다. 다음 Tick은 Execute Move다.
2. Move 요청을 두 프레임 연속 보낸다. **풀이:** 첫 전이 뒤 두 번째 요청은 같은 상태이므로 무시한다. 공격 재시작이 필요하면 명시적인 restart 동작을 별도로 만든다.
3. 상태별 타이머를 추가한다. **풀이:** 개체별 데이터에 저장하고 Enter에서 초기화한다. Exit에서 중단을 알리고 오래된 비동기 결과가 새 상태를 바꾸지 못하게 한다. Console 예제만으로 이 콜백 계약까지 검증되지는 않는다.

## 확인한 범위

2026년 10월 17일 본문의 완성 콘솔 프로그램을 추출해 .NET SDK 10.0.301에서 경고를 오류로 처리하여 컴파일·실행했고, 적어 둔 출력과 일치했다. 이 확인은 본문의 입력과 호출 순서를 대상으로 한다.

원문의 빈 전이 예제를 그대로 게시하지 않고 전이 정책을 가진 새 콘솔 모델을 작성했다. DCB의 DSL·전투 스케줄러와 동일한 구현은 아니다. Unity 컴파일·Animator·전투·비동기 콜백은 미검증이다. 설명과 코드는 AI를 사용해 새로 작성했다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [Behavior Tree의 Sequence·Selector·Running과 중단](/writing/behavior-tree-running-abort/)
