---
title: "오브젝트 풀의 생성·대여·반환과 중복 반환 방지"
description: "노션의 Dictionary·Queue와 OnDisable 반환 구조를 분석한다. 소속·대여 번호·초기화 계약을 새 예제로 설명하고, 콘솔 실습·풀이와 아직 실행하지 않은 Unity 검증을 구분한다."
slug: "object-pool-lease-return"
date: "2022-01-20"
dateBasis: "notion"
updated: "2026-10-18"
topic: "tools"
kind: "note"
tags: ["Unity", "C#", "Object Pool", "Collections", "Verification"]
draft: false
---

## 재사용할 객체를 보관하는 것과 반환을 관리하는 것

오브젝트 풀은 사용이 끝난 객체를 보관했다가 다음 요청에 다시 빌려주는 구조다. 예를 들어 투사체·피격 효과·반복 UI를 매번 생성하고 파괴하는 대신, 필요한 상태를 설정하고 활성화한 뒤 반환할 수 있다.

그렇다고 큐에 객체를 넣는 것만으로 풀의 동작이 보장되는 것은 아니다. 같은 객체가 두 번 반환되면 서로 다른 요청이 같은 객체를 동시에 사용할 수 있다. 반환한 객체에 이전 대상·이벤트·예약 호출이 남아 있으면 새 사용에도 영향을 준다.

[노션의 「Object Pool」 기록](https://app.notion.com/p/b26c1a9fb20b49e8927453549cba2030)은 `Dictionary<string, Queue<GameObject>>`로 여러 종류를 관리하고, `SpawnFromPool`로 대여하며, `OnDisable`에서 반환하는 구조를 설명한다. 초기 큐 개수로 반환 누락·중복을 점검하는 코드와 `CancelInvoke` 호출도 있다.

이 자료는 구현 흐름을 정리한 **과거 학습 노트**다. 특정 게임의 버그 수정 결과를 확인할 수 있는 실행 기록은 없다. 이 글은 원문 구조에서 주의할 지점을 분석하고 새 독립 예제로 보완한다. DCB의 현재 풀 구현을 분석한 글과도 구분한다. 원문의 전체 코드와 Inspector 이미지는 옮기지 않았으며, 이미지 내용은 이번에 확인하지 않았다.

## 노션에 있는 흐름과 코드에서 확인할 수 있는 한계

| 단계 | 기록에 있는 구현 | 조사할 부분 |
| --- | --- | --- |
| 준비 | 태그마다 Queue를 만들고 지정 개수 사전 생성 | 중복 태그·잘못된 크기·호출 시점 |
| 생성 | Instantiate 뒤 이름을 태그로 바꾸고 SetActive(false) | 비활성화 콜백으로 Enqueue가 이루어진다는 의존성 |
| 대여 | 대기 큐가 비면 추가 생성, Dequeue 뒤 위치·회전·활성화 | 생성 상한·이전 상태 초기화·준비 순서 |
| 반환 | obj.name으로 큐를 찾아 Enqueue | 이름 변경·잘못된 소속·같은 참조의 재삽입 |
| 초기 점검 | 큐 개수를 설정 size와 비교 | 개수가 같아도 중복·누락이 서로 상쇄될 수 있음 |
| 예약 해제 | OnDisable에서 ReturnToPool과 CancelInvoke | 다른 컴포넌트·이벤트·외부 비동기 작업의 수명 |

원문의 `ReturnToPool`에는 같은 객체가 이미 대기 중인지 검사하는 코드가 없다. 초기 개수 검사는 문제를 알리는 진단이고, 모든 반환에서 중복을 막는 계약은 아니다. 이 결론은 코드 조각을 읽은 분석이며 원래 Unity 프로젝트에서 중복 대여를 재현했다는 뜻은 아니다.

예를 들어 크기 2인 풀에서 A를 두 번 넣고 B를 한 번도 넣지 않으면 큐 개수는 여전히 2다. 개수 조건만으로 객체의 소속과 유일성을 증명할 수 없다.

## 개념 1 풀의 소유 상태와 활성 상태는 다르다

풀 관점에서는 다음 상태를 구분한다.

| 상태 | 의미 | 대기 큐에 있는가 |
| --- | --- | --- |
| Available | 다음 요청에 빌려줄 수 있음 | 한 번만 있음 |
| Borrowed | 특정 대여가 사용 중 | 없음 |
| Returning | 반환을 접수했고 정리 중 | 없음 |
| Retired | 더 이상 재사용하지 않음 | 없음 |

반면 Unity의 `activeSelf`·`activeInHierarchy`는 GameObject의 활성 상태다. 부모 비활성화로 화면에서 사라진 객체가 풀에 반환된 것은 아닐 수 있다. MonoBehaviour 하나만 비활성화된 경우에도 객체 전체의 소유권이 바뀌었다고 단정할 수 없다.

`OnDisable`은 컴포넌트 비활성화 외에도 GameObject 비활성화·파괴·씬 언로드·스크립트 재로드 등에 관련된다. 그래서 이를 반환 신호로 사용하려면 정상 반납과 종료 상황을 구분해야 한다. [Unity OnDisable 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.OnDisable.html)

또한 이미 비활성 상태인 프리팹을 생성한 뒤 다시 `SetActive(false)`를 호출한다고 항상 `OnDisable`이 발생하는 것은 아니다. Unity는 `activeInHierarchy`가 바뀌는 경우 활성화·비활성화 콜백을 발생시킨다고 설명한다. 원문처럼 콜백이 Enqueue를 담당하면 사전 생성도 그 호출 조건에 의존한다. [SetActive 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/GameObject.SetActive.html)

새 예제는 생성 시 대기 큐 등록을 풀에서 직접 수행한다. 반환도 `TryReturn`으로 요청한다. `OnDisable`은 큐에 다시 넣지 않는다. 활성 상태를 바꾸는 코드와 대여를 끝내는 코드를 구분하기 위한 선택이다.

~~~mermaid
flowchart TD
    C["사전 생성·대기 큐 등록"] --> A["Available"]
    A -->|"TryRent·대여 번호 증가"| B["Borrowed"]
    B -->|"소속·번호 검사 후 TryReturn"| R["Returning"]
    R -->|"정리 성공"| A
    R -->|"정리 예외"| X["Retired"]
    B -->|"이전 번호·중복·다른 풀"| F["반환 거부·현재 대여 유지"]
    A -->|"Close"| X
    B -->|"Close"| X
~~~

## 개념 2 Queue·Dictionary·대여 번호가 맡는 일

Queue는 대기 객체를 꺼내는 순서를 담당한다. Dictionary는 종류별 풀을 찾는 데 사용한다. 둘만으로 중복 반환이나 이전 대여의 콜백까지 구분되지는 않는다. 컬렉션 기본 동작은 [자료구조 선택하기](/writing/data-structures-collections/)와 연결된다.

반환 검사에는 세 값이 필요하다.

1. **소속 풀:** 이 객체를 빌려준 풀이 맞는가?
2. **슬롯:** 풀 안의 어느 객체인가?
3. **대여 번호:** 현재 사용과 같은 차례에 발급된 요청인가?

대여 번호가 필요한 상황은 다음과 같다.

~~~text
같은 객체 X, 대여 번호 1: 사용 → 반환
같은 객체 X, 대여 번호 2: 다시 사용 중
대여 번호 1의 지연 콜백 도착 → 현재 객체가 사용 중이라는 조건만으로는 부족
~~~

“사용 중인가”만 보면 오래된 콜백도 반환을 시도할 수 있다. 번호까지 비교하면 이전 요청을 거부할 수 있다. 콜백을 등록할 때 **당시 발급한 표식**을 캡처해야 한다. 실행 시 객체에서 최신 표식을 읽어 반환하면 새 대여를 반환하는 문제가 다시 생긴다.

대여 표식은 재사용 계약을 확인하는 값이지 보안 토큰이 아니다. 객체의 원시 참조를 보관한 코드가 반환 후 상태를 직접 바꾸는 것까지 이 방식으로 막을 수는 없다. 호출자도 반환 뒤 참조를 사용하지 않는 규칙을 지켜야 한다.

## 개념 3 초기화는 무엇을 언제 지울 것인가

| 시점 | 할 일 | 예시 |
| --- | --- | --- |
| 생성 | 다음 대여를 기다릴 수 있는 기본 상태 준비 | 비활성 프리팹·필수 컴포넌트 |
| 대여 직후 | 이번 사용의 데이터를 먼저 설정 | 대상·위치·수명·피해량 |
| 활성화 | 완성된 데이터를 컴포넌트가 읽게 함 | 마지막에 SetActive(true) |
| 반환 접수 | 같은 요청이 다시 반환하지 못하도록 상태 전환 | Borrowed→Returning |
| 반환 정리 | 예약·이벤트·참조·물리·시각 상태 정리 | 구독 해제·대상 null·트레일 초기화 |
| 정리 완료 | 다음 요청이 사용할 수 있도록 등록 | Available→Enqueue |

정리 전에 먼저 Enqueue하면 정리 도중 같은 객체가 다시 대여될 수 있다. 새 예제는 Returning 상태를 먼저 기록하고, 정리가 끝난 뒤 대기 큐에 넣는다. 정리 함수가 예외를 던지면 해당 슬롯은 Retired로 남겨 재사용하지 않는다.

노션의 `CancelInvoke()`는 해당 MonoBehaviour에 예약된 Invoke를 취소한다. 다른 객체의 이벤트 구독, Task·외부 타이머·네트워크 요청을 모두 취소하는 명령은 아니다. 별도의 구독 해제·취소와 대여 번호 검사가 필요하다. [CancelInvoke 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.CancelInvoke.html)

## 개념 4 사전 생성·동시 사용 상한·보관 상한

세 숫자는 의미가 다르다.

| 숫자 | 뜻 |
| --- | --- |
| 사전 생성 개수 | 시작할 때 미리 만드는 객체 수 |
| 동시 사용 상한 | 동시에 빌려줄 수 있는 최대 수 |
| 반환 후 보관 상한 | 비활성 객체를 남겨두는 최대 수 |

원문은 큐가 비면 객체를 추가 생성한다. 처음 정한 size가 동시 사용 상한은 아니다. 새 콘솔 예제는 **고정 개수 사전 생성·부족하면 대여 거부**를 선택한다. 자동 확장과 초과 객체 파괴는 구현하지 않는다.

Unity의 `ObjectPool<T>`를 사용할 때도 이름만 보고 의미를 섞지 않는다. 생성자의 `defaultCapacity`는 내부 컬렉션 용량이며 그 수만큼 객체를 생성하는 호출이 아니다. `maxSize`도 아래 예제의 고정 대여 상한과 다르다. 반환받은 객체의 보관과 초과 반환 처리에 관련된다. [Unity 풀 생성자 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Pool.ObjectPool_1-ctor.html)

풀링은 생성·파괴 횟수를 줄이는 선택이다. 초기 생성 비용과 메모리 보관 비용은 남고, 사용 중 객체의 Update·물리·렌더링 비용도 사라지지 않는다. 이번 글에는 FPS·GC Alloc·프레임 시간 개선 측정이 없다.

## 예제 1 같은 참조를 큐에 두 번 넣으면

Unity 없이 실행하는 문제 모델이다. 노션의 Unity 실행을 재현한 것은 아니다. 별도 콘솔 프로젝트의 `Program.cs`에 넣는다.

~~~csharp
using System;
using System.Collections.Generic;

var queue = new Queue<object>();
var effect = new object();
queue.Enqueue(effect);
queue.Enqueue(effect);
var first = queue.Dequeue();
var second = queue.Dequeue();
Console.WriteLine($"두 대여가 같은 참조: {ReferenceEquals(first, second)}");
~~~

~~~text
두 대여가 같은 참조: True
~~~

Queue는 같은 참조를 중복 삽입하는 것을 금지하지 않는다. 반환 경로에서 같은 대여를 한 번만 접수하는 검사가 필요하다.

## 예제 2 소속과 대여 번호를 확인하는 고정 풀

새 콘솔 프로젝트에 다음을 `LeasePool.cs`로 저장한다. Unity와 무관한 C# 코드이며, 뒤의 Unity 연결 예제에서도 같은 파일을 사용한다. 단일 스레드 호출을 전제로 한다.

~~~csharp
#nullable enable
using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;

public sealed class LeasePool<T> where T : class
{
    private enum State { Available, Borrowed, Returning, Retired }
    private sealed class Slot
    {
        public readonly T Item;
        public long Version;
        public State Status;
        public Slot(T item) { Item = item; }
    }
    private sealed class ByReference : IEqualityComparer<T>
    {
        public bool Equals(T? x, T? y) => ReferenceEquals(x, y);
        public int GetHashCode(T obj) => RuntimeHelpers.GetHashCode(obj);
    }
    public readonly struct Ticket
    {
        internal readonly LeasePool<T>? Owner;
        internal readonly int Index;
        internal readonly long Version;
        internal Ticket(LeasePool<T> owner, int index, long version)
        { Owner = owner; Index = index; Version = version; }
        public int SlotId => Index;
    }

    private readonly Slot[] slots;
    private readonly Queue<int> available;
    private readonly Action<T> reset;
    private bool closed;
    public int Capacity => slots.Length;
    public int AvailableCount => available.Count;
    public int BorrowedCount { get; private set; }
    public int RetiredCount { get; private set; }

    public LeasePool(int capacity, Func<T> create, Action<T> reset)
    {
        if (capacity <= 0) throw new ArgumentOutOfRangeException(nameof(capacity));
        if (create == null) throw new ArgumentNullException(nameof(create));
        this.reset = reset ?? throw new ArgumentNullException(nameof(reset));
        slots = new Slot[capacity];
        available = new Queue<int>(capacity);
        var unique = new HashSet<T>(new ByReference());
        for (int i = 0; i < capacity; i++)
        {
            T item = create() ?? throw new InvalidOperationException("생성 결과가 없다.");
            if (!unique.Add(item))
                throw new InvalidOperationException("생성 함수가 같은 참조를 반환했다.");
            slots[i] = new Slot(item);
            available.Enqueue(i);
        }
    }

    public bool TryRent(out Ticket ticket)
    {
        ticket = default;
        if (closed || available.Count == 0) return false;
        int index = available.Peek();
        Slot slot = slots[index];
        long nextVersion = checked(slot.Version + 1);
        available.Dequeue();
        slot.Version = nextVersion;
        slot.Status = State.Borrowed;
        BorrowedCount++;
        ticket = new Ticket(this, index, nextVersion);
        return true;
    }

    private bool IsCurrent(Ticket ticket)
    {
        return !closed && ReferenceEquals(ticket.Owner, this) &&
            ticket.Index >= 0 && ticket.Index < slots.Length &&
            slots[ticket.Index].Status == State.Borrowed &&
            slots[ticket.Index].Version == ticket.Version;
    }

    public T Get(Ticket ticket)
    {
        if (!IsCurrent(ticket)) throw new InvalidOperationException("유효한 대여가 아니다.");
        return slots[ticket.Index].Item;
    }

    public bool TryReturn(Ticket ticket)
    {
        if (!IsCurrent(ticket)) return false;
        Slot slot = slots[ticket.Index];
        slot.Status = State.Returning;
        BorrowedCount--;
        try { reset(slot.Item); }
        catch
        {
            if (!closed) { slot.Status = State.Retired; RetiredCount++; }
            throw;
        }
        if (!closed)
        {
            slot.Status = State.Available;
            available.Enqueue(ticket.Index);
        }
        return true;
    }

    public void Close()
    {
        if (closed) return;
        closed = true;
        available.Clear();
        BorrowedCount = 0;
        RetiredCount = slots.Length;
        foreach (Slot slot in slots) slot.Status = State.Retired;
    }
}
~~~

각 슬롯은 하나의 객체를 맡고 대기 큐에는 슬롯 인덱스만 넣는다. 생성 함수가 같은 참조를 반복 반환하면 초기화 단계에서 거부한다. `Get`과 `TryReturn`은 같은 소속·슬롯·번호 검사를 사용한다.

초기 생성과 Close는 슬롯 수만큼 처리한다. 대여·현재 표식 검사는 슬롯을 직접 찾으며, 반환 비용에는 사용자가 제공한 정리 함수의 비용이 더해진다. 상태 검사 몇 번이 상수 개수라고 실제 효과 초기화·이벤트 정리까지 같은 비용인 것은 아니다.

`TryReturn`이 false면 중복·이전 대여·다른 풀·종료 상태 때문에 접수하지 않은 것이다. 정리 함수의 실패는 false로 숨기지 않고 예외를 전달한다. 그 슬롯은 다시 빌려주지 않으므로 사용 가능한 총량이 줄어든다. 자동 복구·새 객체 보충은 구현하지 않았다.

`Close`는 모든 대여를 무효화하고 대기 큐를 비운다. 객체의 Destroy·Dispose까지 대신하지는 않는다. 풀 자체가 객체 참조를 가지고 있으므로 관리 객체의 메모리도 그 즉시 해제됐다고 볼 수 없다. Unity 객체 파괴는 뒤의 소유 컴포넌트가 맡는다. 생성 함수가 도중에 실패할 때 이미 만든 외부 자원의 정리 역시 호출자가 담당한다.

### 실행 프로그램

같은 프로젝트의 `Program.cs`다. 예제 1은 별도 프로젝트에서 실행한다.

~~~csharp
#nullable enable
using System;

var pool = new LeasePool<EffectState>(1, () => new EffectState(), x => x.Reset());
Console.WriteLine($"첫 대여: {pool.TryRent(out var first)}");
pool.Get(first).Target = "enemy-A";
pool.Get(first).Damage = 50;
Console.WriteLine($"상한 도달: {pool.TryRent(out _)}");
Console.WriteLine($"정상 반환: {pool.TryReturn(first)}");
pool.TryRent(out var second);
Console.WriteLine($"같은 슬롯 재사용: {first.SlotId == second.SlotId}");
Console.WriteLine($"초기화: {pool.Get(second).Target == null && pool.Get(second).Damage == 0}");
Console.WriteLine($"이전 대여 반환: {pool.TryReturn(first)}");
Console.WriteLine($"현재 사용 수: {pool.BorrowedCount}");
Console.WriteLine($"현재 대여 반환: {pool.TryReturn(second)}");
Console.WriteLine($"중복 반환: {pool.TryReturn(second)}");
pool.Close();
Console.WriteLine($"종료 후 대여: {pool.TryRent(out _)}");

public sealed class EffectState
{
    public string? Target;
    public int Damage;
    public void Reset() { Target = null; Damage = 0; }
}
~~~

빈 폴더에서 `dotnet new console --framework net10.0`을 실행한 뒤 두 파일을 저장하고 `dotnet run`으로 실행한다. 이 글의 콘솔 확인 환경은 .NET SDK 10.0.301이다. 이것이 Unity 프로젝트의 .NET 대상이나 C# 설정을 같게 만드는 것은 아니다.

~~~text
첫 대여: True
상한 도달: False
정상 반환: True
같은 슬롯 재사용: True
초기화: True
이전 대여 반환: False
현재 사용 수: 1
현재 대여 반환: True
중복 반환: False
종료 후 대여: False
~~~

같은 객체를 다시 사용해도 first의 표식은 second의 표식과 다르다. 오래된 반환을 거부한 뒤에도 현재 대여 수가 1이라는 점을 확인한다.

## 예제 3 Unity의 활성화·반환 연결하기

다음 두 파일과 `LeasePool.cs`를 별도 연습 프로젝트에 넣는 연결 예제다. **Unity에서 컴파일하거나 Play Mode로 실행하지 않았다.** Unity 6.0 공식 API 문서와 대조했지만 설치 버전별 동작을 실행으로 확인한 결과는 아니다.

`LeaseEffectPool.cs`는 풀을 소유한다. Inspector에서 **루트가 비활성인 프리팹**을 지정한다. 프리팹에는 다음의 `LeaseEffectView`를 하나 붙인다. 여기서는 물리·파티클·트레일을 사용하지 않는 최소 표시 객체를 전제로 한다.

~~~csharp
using System;
using System.Collections.Generic;
using UnityEngine;

public sealed class LeaseEffectPool : MonoBehaviour
{
    [SerializeField] private LeaseEffectView prefab;
    [SerializeField, Min(1)] private int capacity = 8;
    private LeasePool<LeaseEffectView> pool;
    private readonly List<LeaseEffectView> created = new List<LeaseEffectView>();

    private void Awake()
    {
        if (prefab == null || prefab.gameObject.activeSelf || capacity <= 0)
            throw new InvalidOperationException("비활성 프리팹과 양수 capacity가 필요하다.");
        try
        {
            pool = new LeasePool<LeaseEffectView>(capacity,
                () =>
                {
                    var view = Instantiate(prefab, transform);
                    created.Add(view);
                    return view;
                },
                view => view.ResetForPool());
        }
        catch { DestroyCreated(); throw; }
    }

    public bool TrySpawn(Vector3 position, float lifetime,
        out LeasePool<LeaseEffectView>.Ticket ticket)
    {
        ticket = default;
        if (!isActiveAndEnabled || pool == null) return false;
        if (float.IsNaN(lifetime) || float.IsInfinity(lifetime) || lifetime <= 0)
            throw new ArgumentOutOfRangeException(nameof(lifetime));
        if (!pool.TryRent(out ticket)) return false;
        pool.Get(ticket).Begin(this, ticket, position, lifetime);
        return true;
    }

    public bool TryReturn(LeasePool<LeaseEffectView>.Ticket ticket)
        => pool != null && pool.TryReturn(ticket);

    [ContextMenu("Spawn One In Play Mode")]
    private void SpawnOne()
    {
        if (Application.isPlaying) TrySpawn(transform.position, 1f, out _);
    }

    private void OnDestroy()
    {
        pool?.Close();
        DestroyCreated();
    }

    private void DestroyCreated()
    {
        foreach (var view in created)
            if (view != null) Destroy(view.gameObject);
        created.Clear();
    }
}
~~~

`LeaseEffectView.cs`는 현재 대여 데이터를 준비하고, 활성화한 뒤 수명이 끝나면 명시적으로 반환을 요청한다.

~~~csharp
using UnityEngine;

public sealed class LeaseEffectView : MonoBehaviour
{
    private LeaseEffectPool owner;
    private LeasePool<LeaseEffectView>.Ticket ticket;
    private float remaining;

    public void Begin(LeaseEffectPool nextOwner,
        LeasePool<LeaseEffectView>.Ticket nextTicket, Vector3 position, float lifetime)
    {
        owner = nextOwner;
        ticket = nextTicket;
        remaining = lifetime;
        transform.SetPositionAndRotation(position, Quaternion.identity);
        gameObject.SetActive(true);
    }

    private void Update()
    {
        remaining -= Time.deltaTime;
        if (remaining <= 0 && owner != null) owner.TryReturn(ticket);
    }

    public void ResetForPool()
    {
        CancelInvoke();
        StopAllCoroutines();
        remaining = 0;
        ticket = default;
        owner = null;
        gameObject.SetActive(false);
    }

    private void OnDisable()
    {
        CancelInvoke();
        StopAllCoroutines();
    }
}
~~~

반환 처리 중 `SetActive(false)`로 `OnDisable`이 호출되어도 이 컴포넌트는 큐에 넣지 않는다. 풀의 Returning→Available 전환만 대기 큐에 등록한다. `OnDisable` 정리가 두 번 호출되어도 안전하도록 여기서는 취소 동작만 넣었다.

외부에서 표시 객체를 직접 비활성화하면 이 예제의 대여는 그대로 남는다. 수명 Update도 멈추므로 호출자가 표식으로 반환하거나 소유 풀을 종료해야 한다. 부모를 잠시 비활성화하는 경우도 자동 반납으로 취급하지 않는다. 이런 정책이 게임과 맞는지 실제 장면에서 확인해야 한다.

이 연결 예제에는 다른 컴포넌트의 OnEnable·OnDisable 재진입, 외부 Destroy로 사라진 슬롯의 보충, 씬을 넘는 풀 유지, 이벤트·파티클·물리 상태 초기화가 구현되어 있지 않다. 씬 종료 시 풀을 먼저 닫아 표식을 무효화하는 의도와 Unity의 실제 콜백 순서는 별도로 시험해야 한다.

## 실습 1 중복 반환이 큐에 무엇을 남기는가

예제 1에서 같은 참조를 두 번 넣은 뒤 두 번 대여한다. 예제 2에서는 같은 Ticket을 두 번 반환한다.

1. Queue 자체가 중복을 거부하는가?
2. 정상 반환 뒤 AvailableCount와 BorrowedCount는 각각 얼마인가?
3. 같은 표식의 두 번째 반환은 개수를 바꾸는가?

### 풀이

Queue는 중복 참조를 허용한다. 예제 1의 두 대여는 같은 참조다. 반면 용량 1인 새 풀에서 정상 반환하면 대기 1·사용 0이다. 두 번째 반환은 false이며 두 개수는 그대로다.

원문의 초기 개수 검사와 달리 새 예제는 반환을 접수할 때마다 현재 대여인지 확인한다. 초기 size와 대기 수가 같다는 조건만으로 대체할 수 없다.

## 실습 2 이전 대여의 지연 반환과 다른 풀의 반환

first를 반환하고 같은 슬롯을 second로 다시 빌린다. first를 캡처한 콜백이 뒤늦게 도착한 상황으로 `TryReturn(first)`를 호출한다. 별도로 만든 다른 풀에도 second를 반환해 본다.

### 풀이

이전 번호는 false이며 second는 계속 유효하다. 다른 풀도 Owner가 다르므로 false다. `Get(first)`는 예외를 던지고, `Get(second)`는 현재 객체를 돌려준다.

이벤트에서 객체의 최신 ticket을 읽는 코드로 바꾸면 이 실습의 의미가 사라진다. 콜백이 속한 대여의 표식을 저장하고, 작업 취소와 함께 사용한다. 이 실습은 동기 호출로 순서를 재현했으며 실제 Task·네트워크 경합을 실행한 것은 아니다.

## 실습 3 정리 함수의 재진입과 예외

다음 조건을 각각 독립된 풀에서 시험한다.

| 정리 중 할 일 | 예상 상태 |
| --- | --- |
| 같은 표식으로 TryReturn을 다시 호출 | false, 중복 등록 없음 |
| 용량 1에서 TryRent 호출 | false, 아직 정리 중 |
| 정리 함수가 예외를 던짐 | 예외 전달, Retired 1·대기 0·사용 0 |
| 정리 함수에서 Close 호출 | 종료 유지, 정리 후 다시 Enqueue하지 않음 |

### 풀이

반환 접수 때 Borrowed를 Returning으로 바꾸고 사용 수를 줄인다. 그래서 재진입해도 현재 대여로 인정되지 않는다. 정리 완료 전에는 대기 큐에 없으므로 같은 슬롯을 다시 빌릴 수 없다.

정리에 실패한 객체는 상태를 신뢰할 수 없어 Retired로 남긴다. 슬롯은 자동으로 복구되지 않는다. Close가 정리 중 호출돼도 닫힌 뒤 큐에 다시 넣지 않는다. 다른 스레드에서 동시에 실행해도 안전하다는 증명은 아니다.

## 실습 4 사전 생성과 상한을 계산하기

용량 2인 새 풀에서 세 번 대여한다. 생성 함수 호출 수를 직접 세어 보고, 두 표식을 반환한 뒤 다시 빌린다.

### 풀이

생성 함수는 초기화 때 두 번 호출된다. 첫 두 대여는 성공하고 세 번째는 false다. 반환 후 다시 대여해도 생성 함수가 추가 호출되지 않는다. 대기 수·사용 수는 객체의 활성 여부가 아니라 대여 상태로 계산한다.

이것은 새 예제의 고정 상한 정책이다. 원문처럼 부족할 때 확장하거나 Unity ObjectPool의 보관 상한 정책과 같지 않다. 물량이 부족할 때 효과를 생략할지, 별도 한도 안에서 확장할지, 요청을 기다리게 할지는 사용처별로 결정한다.

## 실습 5 Unity 장면에서 확인할 순서

이 실습은 **계획이며 아직 실행하지 않았다.** 빈 연습 씬에서 단순 표시 프리팹과 소유 풀을 준비한다. Play Mode의 컴포넌트 메뉴 `Spawn One In Play Mode`로 대여를 요청한다.

| 시험 | 확인할 결과 |
| --- | --- |
| 비활성 프리팹으로 시작 | 사전 생성이 OnDisable 호출 여부에 의존하지 않는가 |
| 수명 종료와 같은 표식의 추가 반환 | 한 번만 반환되는가 |
| 부모 비활성화·재활성화 | 대여 유지 정책과 일시 정지가 의도와 맞는가 |
| 표시 객체만 직접 비활성화 | 자동 반환되지 않는 상태를 호출자가 처리하는가 |
| 풀 소유 객체 파괴·씬 종료 | 표식이 무효화되고 생성 객체가 정리되는가 |
| 외부에서 표시 객체 Destroy | 현재 미지원 정책이 어떻게 드러나는가 |

### 풀이

콘솔에서 확인한 상태 전환과 Unity가 실제 호출하는 수명주기는 다른 근거다. 먼저 컴파일·콜백 순서·객체 수·재사용 상태를 확인하고 이후 실제 파티클·트레일·Rigidbody·이벤트를 하나씩 붙여 본다.

성능을 비교하려면 같은 프리팹·동시 사용량·발생 주기·플랫폼으로 생성/파괴 방식과 풀 방식을 실행한다. 사전 생성 구간과 반복 구간을 나누고 프레임 시간·할당·메모리·실제 생성 수를 기록한다. 이번 글에는 그 측정 결과가 없다.

## 확인한 내용과 남은 실행 검증

문제 모델과 완성 콘솔 프로그램은 본문에서 추출해 .NET SDK 10.0.301에서 경고를 오류로 처리해 컴파일·실행했고, 위 출력과 일치했다. 별도 검사 32개 항목에는 고정 시드의 연산 1,000회에서 사용 수·대기 수와 동시 대여 객체의 유일성을 확인한 항목도 포함한다. 이 수는 실행 시간이나 Unity 성능 측정값이 아니다.

| 대상 | 확인 범위 |
| --- | --- |
| Dictionary·Queue·사전 생성·OnDisable 반환·초기 개수 검사 | 노션 텍스트·코드 조각 확인 |
| 원래 게임의 중복 반환 버그·수정 완료·성능 개선 | 실행 근거 없음, 완료 사례로 쓰지 않음 |
| OnDisable·SetActive·CancelInvoke·Unity 풀 API | 연결한 공식 문서와 대조 |
| 중복 참조 큐·LeasePool·콘솔 프로그램 | 본문 코드 추출 후 .NET에서 컴파일·실행 |
| 중복·이전 번호·다른 풀·재진입·정리 예외·상한·종료 | 독립 콘솔 검사로 확인 |
| Unity 연결 컴포넌트 두 개 | Unity 컴파일·Play Mode 미실행 |
| 부모 비활성화·씬 종료·외부 Destroy·실제 효과 초기화 | Unity에서 미확인 |
| GC Alloc·메모리·프레임 시간·개선율 | 미측정 |

예제·상태 그림·실습·풀이와 콘솔 검사는 AI의 도움을 받아 새로 작성했다. 실제 프로젝트 저장소는 변경하지 않았다. 이 글의 실행 근거는 독립 C# 모델까지이며 Unity의 실제 재사용·화면·성능 검증으로 확대하지 않는다.
