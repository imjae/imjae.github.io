---
title: "자료구조 선택하기: 배열, List, Dictionary, HashSet, Queue, Stack"
description: "순서·검색·중복·처리 순서를 기준으로 자료구조를 고릅니다. 내부 동작과 비용을 설명하고 인벤토리 예제, 실습 네 개와 풀이를 함께 다룹니다."
slug: "data-structures-collections"
date: "2026-10-17"
updated: "2026-10-23"
topic: "notes"
kind: "note"
tags: ["C#", "Data Structures", "Collections"]
draft: false
---

## 무엇을 기준으로 자료구조를 고를까

자료구조는 데이터를 보관하는 방식과 그 데이터에 허용할 연산을 함께 정한 것입니다. 같은 아이템 ID 여러 개를 저장하더라도 슬롯 번호를 유지할지, 종류별 수량만 셀지, 먼저 들어온 요청부터 처리할지에 따라 적합한 구조가 달라집니다.

이 글은 C#의 변수·조건문·반복문·메서드를 읽을 수 있다는 전제로 시작합니다. 예제의 C#은 자료구조의 동작을 확인하는 도구로 사용합니다. **자주 사용하는 연산과 지켜야 할 규칙을 정하고, 그에 맞는 구조를 선택하는 것**이 목표입니다.

먼저 요구사항을 네 질문으로 바꿉니다.

1. **위치와 순서:** 3번 슬롯이라는 위치가 중요한가요? 입력 순서나 정렬 순서를 유지해야 하는가요?
2. **찾는 기준:** 번호로 접근하는가, 값이 있는지 찾는가, 고유 키로 값을 찾는가요?
3. **중복:** 같은 값 두 개를 별개로 보관하는가, 하나로 합치는가요?
4. **변경과 소비:** 중간 삽입·삭제가 많은가요? 먼저 들어온 것 또는 마지막에 들어온 것을 꺼내는가요?

| 필요한 규칙 | 먼저 검토할 구조 | 선택 이유 |
| --- | --- | --- |
| 칸 수와 슬롯 번호가 고정 | 배열 `T[]` | 길이가 정해진 상태에서 인덱스로 접근 |
| 순서가 있고 개수가 변하는 목록 | `List<T>` | 인덱스 접근과 끝 추가가 편리 |
| 아이템 ID로 수량·데이터 조회 | `Dictionary<TKey, TValue>` | 키와 값을 연결 |
| 이미 사용한 피벗인지 확인 | `HashSet<T>` | 같은 값을 중복 저장하지 않고 포함 여부 조회 |
| 접수 순서대로 요청 처리 | `Queue<T>` | 먼저 넣은 것을 먼저 꺼냄 |
| 최근 작업부터 취소·반납 객체 재사용 | `Stack<T>` | 마지막에 넣은 것을 먼저 꺼냄 |

이는 출발점입니다. 데이터 크기, 메모리, 동등성 규칙과 다른 코드의 소유권도 함께 확인해야 합니다. .NET의 기본 용도 분류는 [컬렉션 선택 문서](https://learn.microsoft.com/en-us/dotnet/standard/collections/selecting-a-collection-class)에서 볼 수 있습니다.

## 배열과 List: 위치와 개수가 어떻게 바뀌는가

### 배열은 길이가 고정된 인덱스 공간입니다

<div id="배열은-길이가-고정된-인덱스-공간이다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

길이 5인 `int[]`를 만들면 유효한 인덱스는 0~4입니다. `slots[3]`은 네 번째 원소를 뜻합니다. 배열 객체의 길이는 생성 후 바뀌지 않습니다. 더 큰 배열이 필요하면 다른 배열을 만들고 내용을 옮겨야 합니다. `Array.Resize`도 배열 자체를 늘리는 대신 새 배열로 참조를 교체할 수 있습니다. [배열의 길이와 인덱스](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/arrays)

이 글의 슬롯 예제에서는 아이템 ID 0을 빈칸으로 약속합니다. 이는 배열의 기능이 아니라 예제가 정한 규칙입니다. 실제 ID에 0이 포함된다면 별도의 점유 표시나 nullable 값 같은 표현이 필요합니다.

```text
인덱스   0    1    2    3    4
아이템  100   0   200   0   100
```

2번 슬롯을 비울 때 `slots[2] = 0`으로 값을 바꾸면 다른 슬롯 번호는 유지됩니다. 슬롯 UI와 데이터 위치가 고정되어야 할 때 유용합니다. 반면 특정 아이템이 있는지는 처음부터 비교해야 하므로 최악에는 다섯 칸 모두를 읽습니다.

배열에 참조 타입을 넣으면 원소에는 객체를 가리키는 참조가 들어갑니다. 배열을 복사했다고 그 객체까지 독립적으로 복제되는 것은 아닙니다. 여기서는 정수 ID만 사용해 이 문제를 분리합니다.

### List는 내부 배열과 실제 원소 수를 따로 관리합니다

<div id="list는-내부-배열과-실제-원소-수를-따로-관리한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`List<T>`는 내부 배열을 이용해 인덱스 접근을 제공합니다. `Count`는 실제 원소 수이고 `Capacity`는 재할당 없이 담을 수 있는 용량입니다. `new List<int>(8)`은 빈 목록에 여덟 칸을 미리 확보하는 것이므로 `Count`는 0입니다. 아직 `list[0]`을 읽을 수 없습니다. [Count와 Capacity](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.capacity?view=net-10.0)

끝에 `Add`할 때 빈 용량이 있으면 다음 칸에 넣습니다. 용량이 모자라면 더 큰 내부 배열을 확보하고 기존 원소를 복사합니다. 따라서 한 번의 추가가 항상 같은 비용은 아닙니다. 빈 목록에 연속해서 추가하는 전체 비용을 추가 횟수에 나눠 계산하면, 한 번당 비용을 상수 범위로 설명할 수 있습니다. 이를 분할 상환 O(1)이라고 합니다. 무작위 입력의 평균을 구하는 분석과는 다릅니다. 정확히 몇 칸씩 확장하는지는 고정 규칙으로 가정하지 않습니다. [List.Add의 비용](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.add?view=net-10.0)

중간 원소를 제거하면 뒤쪽 원소들이 앞으로 이동합니다.

```text
제거 전: [100, 200, 300]
RemoveAt(1)
제거 후: [100, 300]
```

이제 인덱스 1은 300입니다. 인덱스를 아이템의 영구 식별자로 저장해 둔 코드가 있다면 다른 아이템을 가리키게 됩니다. `RemoveAt`은 뒤쪽을 이동시키므로 제거 위치에 따라 O(n)까지 듭니다. [List.RemoveAt의 재배치](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.removeat?view=net-10.0)

배열과 List 모두 중복 값을 저장할 수 있습니다. List가 삽입 순서를 유지한다고 해서 자동으로 ID나 등급순으로 정렬되지는 않습니다. 정렬은 별도의 연산입니다.

## Dictionary와 HashSet: 키와 중복 규칙

### Dictionary는 키 하나에 값 하나를 연결합니다

<div id="dictionary는-키-하나에-값-하나를-연결한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`Dictionary<int, int>`를 아이템 ID→수량으로 사용하면 ID 100의 값은 2처럼 표현할 수 있습니다. 같은 키를 두 번 `Add`하면 예외가 발생합니다. 기존 수량을 바꾸려면 그 키의 값을 갱신합니다. 서로 다른 키가 같은 수량을 갖는 것은 허용됩니다.

조회할 때 키가 없을 수 있으면 `TryGetValue`를 사용합니다. 반환값이 `true`이면 찾은 값이 있고, `false`이면 해당 키가 없습니다. `out` 값이 0이라는 이유만으로 부재를 판정하면 안 됩니다. 저장 규칙에 따라 0도 정상 값일 수 있기 때문입니다. 없는 키를 인덱서로 읽으면 예외가 발생합니다. [Dictionary의 키·조회 규칙](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2?view=net-10.0)

해시 기반 조회는 키에서 **해시 코드**를 계산하고 이를 이용해 후보 저장 위치를 좁힙니다. 다른 키가 같은 해시를 가질 수 있는데 이를 충돌이라고 합니다. 따라서 해시가 같다는 사실만으로 같은 키라고 판단하지 않고 동등성 비교를 추가합니다.

보통의 조회가 빠르더라도 충돌이 몰리거나 해시·동등성 계산이 비싸면 비용이 커집니다. 직접 만든 키 타입은 서로 같다고 판단되는 값이 같은 해시 코드를 반환해야 합니다. 저장한 뒤 키의 동등성에 영향을 주는 필드를 바꾸면 조회가 어긋날 수 있습니다. 이 글에서는 변경되지 않는 정수 ID를 키로 씁니다.

UI 표시 순서를 Dictionary의 열거 순서에 맡기지 않습니다. 현재 실행에서 삽입 순서처럼 보여도 정렬 계약으로 사용하지 않습니다. 슬롯 순서가 필요하면 별도의 목록이나 배열을 기준으로 조회합니다.

### HashSet은 중복 없는 값의 집합입니다

<div id="hashset은-중복-없는-값의-집합이다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`HashSet<int>`는 사용한 피벗 ID처럼 포함 여부만 필요한 데이터를 담습니다. `Add(7)`이 처음 성공하면 `true`, 이미 7이 있으면 `false`를 반환합니다. 별도의 `Contains` 후 `Add` 대신 이 반환값으로 새로 추가됐는지 판단할 수 있습니다. [HashSet.Add의 반환값](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.hashset-1.add?view=net-10.0)

HashSet도 해시와 동등성 규칙을 사용합니다. 무엇을 같은 값으로 볼지는 컬렉션이 사용하는 비교 규칙으로 결정됩니다. 직접 만든 참조 타입은 별도 규칙이 없으면 같은 객체 참조인지로 비교할 수 있습니다. 문자열은 대소문자를 무시하는 비교기를 지정할지에 따라 `Blade`와 `blade`를 하나로 볼지가 달라집니다.

HashSet에는 순서 인덱스가 없습니다. 삽입 순서와 중복 제거가 모두 필요하면 **List로 순서, HashSet으로 포함 여부**를 관리할 수 있습니다. 다만 두 구조를 갱신하는 경로를 일치시켜야 합니다. 한쪽에서만 삭제하면 서로 다른 상태가 남습니다. 실습에서는 같은 ID를 다시 허용할 시점까지 정해 봅니다.

## Queue와 Stack: 꺼내는 순서를 구조로 표현하기

### Queue는 먼저 들어온 것을 먼저 꺼냅니다

<div id="queue는-먼저-들어온-것을-먼저-꺼낸다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`Enqueue`는 뒤에 넣고 `Dequeue`는 앞에서 꺼내며 제거합니다. `Peek`는 다음 값을 제거하지 않고 읽습니다. 이 규칙을 FIFO라고 합니다. A, B 순서로 접수하면 A, B 순서로 처리합니다.

.NET Queue는 원형 버퍼를 사용합니다. 맨 앞 원소를 꺼낼 때 남은 모든 원소를 한 칸씩 이동시키는 대신 앞쪽 위치를 갱신합니다. 따라서 접수 순서로 계속 소비할 때 List의 `RemoveAt(0)`보다 목적에 맞습니다. 용량 확장은 복사를 동반할 수 있습니다. 빈 큐에서 `Dequeue`나 `Peek`를 호출하지 않도록 확인합니다. [Queue의 동작과 내부 배열](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.queue-1?view=net-10.0)

Queue는 우선순위가 높은 작업을 먼저 선택하지 않습니다. 접수 순서와 우선순위는 다른 요구사항입니다. 두 우선순위가 같을 때 접수 순서를 유지할지도 별도 규칙으로 정해야 합니다.

### Stack은 마지막에 들어온 것을 먼저 꺼냅니다

<div id="stack은-마지막에-들어온-것을-먼저-꺼낸다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`Push`로 넣고 `Pop`으로 최근 값을 꺼내며 제거합니다. `Peek`는 제거하지 않고 확인합니다. 이 규칙을 LIFO라고 합니다. 손잡이 부착 다음 칼날 부착을 기록했다면 먼저 취소할 작업은 칼날 부착입니다. [Stack의 Push·Pop·Peek](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.stack-1?view=net-10.0)

하지만 문자열을 Pop한다고 실제 장비 상태가 되돌아가는 것은 아닙니다. 실행 취소에는 원래 값을 복원하는 명령이나 이전 상태도 저장해야 합니다. 반납 객체를 Stack에 넣는 풀도 마찬가지입니다. Stack은 순서만 제공하며 중복 반납, 사용 중 객체의 반환, 초기화 누락을 막아 주지는 않습니다.

## 시간 복잡도를 실제 연산과 연결하기

시간 복잡도는 원소 수 n이 늘 때 연산량이 어떻게 증가하는지를 표현합니다. O(1)은 n에 따라 연산량이 계속 늘지 않는다는 뜻이며, 실행 시간이 1나노초라는 뜻은 아닙니다. O(n)은 충분히 큰 n에서 연산량의 상한을 n의 상수 배수로 나타낼 수 있다는 뜻입니다. 여기서는 순차 검색이나 원소 이동처럼 n에 비례하는 작업을 떠올리면 됩니다. 상수 비용과 메모리 접근 차이 때문에 작은 목록의 순회가 해시 조회보다 유리할 수도 있습니다.

아래 표는 단일 스레드의 일반적인 사용을 요약합니다. 해시 계산과 비교 자체의 비용은 작다고 가정합니다.

| 구조·연산 | 일반적인 비용 | 주의할 조건 |
| --- | --- | --- |
| 배열·List 인덱스 읽기 | O(1) | 유효한 인덱스 필요 |
| 배열·List에서 값 검색 | O(n) | 정렬되지 않은 데이터의 순차 검색 |
| List 끝 추가 | 분할 상환 O(1) | 확장하는 한 번은 O(n) |
| List 중간 삽입·삭제 | O(n) | 뒤쪽 이동량에 따라 달라짐 |
| Dictionary 키 조회·HashSet 포함 확인 | 평균 O(1), 최악 O(n) | 충돌과 비교 규칙의 영향 |
| Queue 넣기·Stack 넣기 | 분할 상환 O(1) | 내부 배열 확장 시 O(n) |
| Queue 꺼내기·Stack 꺼내기 | O(1) | 비어 있지 않은 경우 |
| 모든 원소 방문 | O(n) | 구조와 별개로 n개를 처리 |

시간 복잡도와 함께 메모리 구조도 고려합니다. List·Queue·Stack은 여유 용량을 가질 수 있고, Dictionary·HashSet은 해시 관리를 위한 추가 공간을 사용합니다.

## 실행 예제: 슬롯과 집계, 중복과 처리 순서

예제는 Unity 없이 .NET 10 콘솔에서 실행합니다. .NET SDK가 설치된 터미널에서 새 연습 폴더에 다음 명령을 실행합니다.

```sh
dotnet new console --framework net10.0 -n CollectionStudy
cd CollectionStudy
dotnet run
```

처음에는 기본 인사말이 출력됩니다. 생성된 `Program.cs` 전체를 아래 코드로 교체하고 다시 `dotnet run`합니다. 이후 실습의 완성 코드도 각각 파일 전체를 교체해 실행합니다. 여러 예제의 `Main`을 한 파일에 합치지 않습니다.

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        int[] slots = { 100, 0, 200, 0, 100 };
        List<int> orderedItems = new List<int>();
        Dictionary<int, int> counts = new Dictionary<int, int>();

        foreach (int itemId in slots)
        {
            if (itemId == 0) continue;
            orderedItems.Add(itemId);
            counts.TryGetValue(itemId, out int previousCount);
            counts[itemId] = previousCount + 1;
        }

        Console.WriteLine("슬롯: " + string.Join(", ", slots));
        Console.WriteLine("보관 목록: " + string.Join(", ", orderedItems));
        Console.WriteLine("100 수량: " + counts[100]);
        Console.WriteLine("999 존재: " + counts.TryGetValue(999, out _));

        HashSet<int> usedPivots = new HashSet<int>();
        Console.WriteLine("피벗 7 첫 사용: " + usedPivots.Add(7));
        Console.WriteLine("피벗 7 재사용: " + usedPivots.Add(7));

        Queue<string> requests = new Queue<string>();
        requests.Enqueue("손잡이 검사");
        requests.Enqueue("칼날 검사");
        while (requests.Count > 0)
            Console.WriteLine("처리: " + requests.Dequeue());

        Stack<string> history = new Stack<string>();
        history.Push("손잡이 부착");
        history.Push("칼날 부착");
        while (history.Count > 0)
            Console.WriteLine("취소 대상: " + history.Pop());
    }
}
```

실행 결과는 다음과 같습니다.

```text
슬롯: 100, 0, 200, 0, 100
보관 목록: 100, 200, 100
100 수량: 2
999 존재: False
피벗 7 첫 사용: True
피벗 7 재사용: False
처리: 손잡이 검사
처리: 칼날 검사
취소 대상: 칼날 부착
취소 대상: 손잡이 부착
```

읽을 때는 다음 순서로 추적합니다.

1. `slots`는 빈칸을 포함한 원본입니다. 순회는 인덱스 순서이며 배열은 변경하지 않습니다.
2. `orderedItems.Add`는 빈칸을 제외한 등장 순서를 보관합니다. 이 목록의 인덱스는 원본 슬롯 번호와 다릅니다.
3. `TryGetValue`가 실패하면 `previousCount`는 정수 기본값 0입니다. 예제는 그 값에 1을 더해 첫 수량을 기록합니다.
4. HashSet의 두 번째 `Add(7)`은 값 7을 하나 더 만들지 않습니다.
5. Queue의 출력과 Stack의 출력을 비교하면 넣는 순서가 같아도 소비 규칙이 다른 것을 볼 수 있습니다.

`counts`와 `orderedItems`는 이 시점에 만든 집계 결과입니다. 나중에 `slots[0]`만 바꿔도 나머지가 자동으로 갱신되지는 않습니다. 원본에서 매번 다시 계산하거나, 변경을 담당하는 한 경로에서 관련 구조를 함께 갱신해야 합니다.

## 실습 1: 요구사항에 맞는 구조 선택하기

코드를 작성하기 전에 아래 요구사항마다 자료구조와 이유를 적습니다. 특히 중복과 순서 규칙을 빠뜨리지 않습니다.

| 문제 | 요구사항 |
| --- | --- |
| 1 | 퀵슬롯은 여덟 칸이며 아이템을 빼도 다른 칸 번호가 유지되어야 합니다. |
| 2 | 재료 ID로 보유 수량을 찾고, 수량이 0이 되면 항목을 없앱니다. |
| 3 | 같은 적을 한 번의 공격에서 두 번 맞히지 않아야 합니다. |
| 4 | 접수된 검사 요청을 들어온 순서로 처리합니다. |
| 5 | 편집 작업을 최근 순서로 취소합니다. |
| 6 | 정렬된 표시 목록을 유지하면서 ID로도 자주 조회합니다. |

### 풀이

1. 길이 8인 배열이 출발점입니다. 삭제를 빈 값 대입으로 표현합니다. 고정 길이 List도 가능하지만 중간 제거로 칸을 당기지 않는 계약이 필요합니다.
2. ID→수량 Dictionary가 맞습니다. 감소 후 0이면 `Remove`하는 규칙을 둡니다. 음수 수량을 허용할지도 정합니다.
3. 공격 한 번의 수명에 속한 HashSet이 맞습니다. 다음 공격에서 다시 맞을 수 있으려면 그때 비우거나 새 집합을 사용합니다. ID 재사용 문제도 확인합니다.
4. Queue가 맞습니다. 중요도 순서가 추가되면 이 선택을 다시 검토합니다.
5. Stack이 맞습니다. 저장할 것은 작업 이름만이 아니라 되돌릴 정보입니다.
6. List로 표시 순서, Dictionary로 ID 조회를 맡길 수 있습니다. 추가·삭제·정렬 후 두 구조가 일치하도록 한 소유자가 관리합니다. 데이터가 적고 조회가 드물다면 List만 유지하는 편이 단순합니다.

## 실습 2: List에서 삭제할 때 다음 원소를 건너뛰는 문제

목록 `[10, 20, 20, 30]`에서 값 20을 모두 제거하려 합니다. 앞에서부터 인덱스를 하나씩 늘리며 `RemoveAt(i)`하면 어떤 문제가 생길까? 먼저 인덱스와 목록을 종이에 적고 추적합니다.

첫 20을 제거하면 뒤의 20이 인덱스 1로 이동합니다. 그런데 반복문의 인덱스는 2가 되어 그 값을 건너뜁니다. 이 문제는 뒤에서 앞으로 순회하면 피할 수 있습니다. 제거로 이동하는 것은 이미 확인한 뒤쪽 원소이기 때문입니다.

### 풀이 코드

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> items = new List<int> { 10, 20, 20, 30 };
        for (int i = items.Count - 1; i >= 0; i--)
        {
            if (items[i] == 20) items.RemoveAt(i);
        }
        Console.WriteLine(string.Join(", ", items));
    }
}
```

```text
10, 30
```

이 방식도 여러 번 중간 원소를 옮기므로 대량 삭제에 항상 효율적인 것은 아닙니다. 조건에 맞는 모든 원소를 지우는 작업이라면 `RemoveAll`이나 살아남을 값을 압축하는 순회도 검토합니다. `foreach`로 순회 중 구조를 바꾸는 방법에 의존하지 않습니다. 이 예제의 List에서 `foreach` 중 `Remove`를 호출하면 열거가 무효화되어 예외가 발생합니다.

## 실습 3: 중복을 막는 작업 대기열

접수 ID가 `[42, 42, 7, 42]`일 때 현재 대기 중인 같은 ID는 한 번만 보관하되, 처리 후에는 다시 접수할 수 있게 만듭니다. 처리 순서는 첫 접수 순서를 따릅니다. 대기열을 모두 처리한 뒤 42를 다시 접수하면 한 번 더 처리되어야 합니다.

여기서 집합은 ‘과거에 본 모든 ID’가 아니라 **현재 대기 중인 ID**를 뜻합니다. 이 수명을 다르게 잡으면 마지막 재접수가 무시됩니다.

### 풀이 코드

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void EnqueueOnce(int id, Queue<int> queue, HashSet<int> pending)
    {
        if (pending.Add(id)) queue.Enqueue(id);
    }

    static void Drain(Queue<int> queue, HashSet<int> pending)
    {
        while (queue.Count > 0)
        {
            int id = queue.Dequeue();
            pending.Remove(id);
            Console.WriteLine("처리: " + id);
        }
    }

    static void Main()
    {
        Queue<int> queue = new Queue<int>();
        HashSet<int> pending = new HashSet<int>();
        foreach (int id in new[] { 42, 42, 7, 42 })
            EnqueueOnce(id, queue, pending);

        Drain(queue, pending);
        EnqueueOnce(42, queue, pending);
        Drain(queue, pending);
        Console.WriteLine("남은 대기 ID: " + pending.Count);
    }
}
```

```text
처리: 42
처리: 7
처리: 42
남은 대기 ID: 0
```

`pending.Add`가 성공했을 때만 큐에 넣으므로 두 구조가 같이 증가합니다. 꺼낼 때 집합에서도 제거합니다. 이 예제는 단일 스레드에서 동기적으로 처리합니다. 처리 중에도 중복을 막아야 한다면 집합에서 제거하는 시점을 처리 완료 뒤로 바꾸고, 실패·재시도 규칙도 추가해야 합니다. 여러 스레드에서 호출하려면 두 연산 전체의 동기화가 필요합니다. 기본 Queue와 HashSet을 각각 사용한 것만으로 이 묶음이 원자적이 되지는 않습니다.

## 실습 4: 실제 값을 복원하는 실행 취소

장비의 공격력을 10→15→8로 편집했습니다. 두 번 취소했을 때 15→10으로 복원되어야 합니다. 더 취소할 작업이 없으면 값을 유지합니다. 이번에는 최근 작업의 이름 대신 **변경 전 값**을 Stack에 저장합니다.

### 풀이 코드

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Change(ref int value, int next, Stack<int> history)
    {
        history.Push(value);
        value = next;
    }

    static bool Undo(ref int value, Stack<int> history)
    {
        if (history.Count == 0) return false;
        value = history.Pop();
        return true;
    }

    static void Main()
    {
        int attack = 10;
        Stack<int> history = new Stack<int>();
        Change(ref attack, 15, history);
        Change(ref attack, 8, history);
        Console.WriteLine("편집 후: " + attack);
        Undo(ref attack, history);
        Console.WriteLine("첫 취소: " + attack);
        Undo(ref attack, history);
        Console.WriteLine("둘째 취소: " + attack);
        Console.WriteLine("추가 취소 성공: " + Undo(ref attack, history));
        Console.WriteLine("최종 값: " + attack);
    }
}
```

```text
편집 후: 8
첫 취소: 15
둘째 취소: 10
추가 취소 성공: False
최종 값: 10
```

정수는 값을 복사해 저장하므로 이전 값이 유지됩니다. 수정 가능한 장비 객체의 참조만 Push하면 같은 객체가 나중에 변경되어 과거 상태도 바뀐 것처럼 보일 수 있습니다. 그 경우 필요한 상태를 독립적으로 복사하거나 역연산을 저장합니다. 재실행 기능은 또 다른 Stack과 새 편집 시 재실행 기록을 지우는 규칙이 필요합니다. 이 예제는 단일 값의 실행 취소까지 다룹니다.

## DCB의 코드에서 같은 선택을 찾기

DCB 장비 조합의 `PartsInfo`는 자식 파츠 목록을 보관합니다. 각 노드의 자식 목록을 읽고 재귀적으로 조립·복사·저장 경로를 따라갑니다. 여기서 List 하나는 자식들의 순서를 나타내고, 노드와 자식의 연결 전체가 트리를 이룹니다. **List를 쓴다는 사실과 전체 데이터가 트리라는 사실은 함께 성립합니다.**

`CombinerBase`는 아이템별 조립 여부를 Dictionary에, 사용한 피벗을 HashSet에 기록합니다. 전자는 아이템과 상태를 연결하고 후자는 사용 여부의 중복을 막습니다. 공통 `ObjectPool<T>`는 반납된 객체를 Stack에 넣고 최근 반납 객체부터 꺼냅니다.

이 선택들이 전체 게임 성능이나 중복 반환의 안전성을 자동으로 보장하지는 않습니다. 자료구조와 별개로 상태를 초기화하는 시점, 소유자와 반환 규칙을 확인해야 합니다. 실제 장비의 연결은 [2D·3D 장비 파츠 조합 글](/writing/modular-equipment/)에서 이어서 볼 수 있습니다.

## 복습 질문

다음 질문은 API 이름 대신 선택 이유를 설명하며 답합니다.

1. `new List<int>(100)`을 만들자마자 인덱스 99에 쓸 수 있나요?
2. Dictionary가 있는데도 표시 순서용 List를 따로 두는 이유는 무엇인가요?
3. HashSet에 넣은 피격 ID를 언제 비워야 다음 공격이 가능해지는가요?
4. Queue 대신 List의 맨 앞을 계속 제거하면 어떤 비용이 생기는가요?
5. Stack에서 이전 객체를 꺼내도 원래 상태가 복원되지 않는 이유는 무엇인가요?

답은 각각 **Count는 아직 0**, **조회와 표시 순서는 다른 요구사항**, **공격 또는 판정 수명에 맞춘 초기화**, **뒤쪽 원소 이동의 누적**, **가변 객체의 공유 참조**입니다. 답을 이해했다면 자신의 코드에서 원본·집계·수명·동등성 규칙을 한 줄씩 적어 봅니다.

설명과 예제 작성에 AI를 활용했습니다.
