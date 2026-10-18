---
title: "동적 배열과 List의 확장·삭제 구현"
description: "Count와 Capacity, 확장 시 복사, 중간 삭제와 조건 삭제를 직접 구현한다. 분할 상환 비용을 계산하고 실행 예제와 실습 네 개·풀이로 확인한다."
slug: "dynamic-array-list-growth-removal"
date: "2026-10-17"
updated: "2026-10-18"
topic: "notes"
kind: "note"
tags: ["C#", "Data Structures", "Collections", "List"]
draft: false
---

## 배열의 길이는 고정인데 List는 어떻게 늘어날까

[자료구조 선택하기](/writing/data-structures-collections/)에서는 List를 순서가 있고 개수가 변하는 목록으로 사용했다. 이번에는 그 안에서 일어나는 일을 직접 구현한다. 다룰 연산은 끝 추가, 인덱스 읽기·수정, 한 원소 삭제, 조건에 맞는 원소 삭제와 비우기다.

동적 배열은 길이가 바뀌는 배열 객체가 아니다. **고정 길이 배열, 실제 원소 수, 더 큰 배열로 교체하는 규칙을 묶은 자료구조**다. List도 내부 배열을 사용한다. 용량이 부족하면 새 배열을 확보하고 기존 원소를 옮긴다.

이 글의 `IntBuffer`는 이 과정을 관찰하기 위한 독립 예제 코드다. 정수만 저장하고 확장 규칙을 직접 정한다. .NET `List<T>`의 전체 기능·최적화·최대 용량 처리를 복제한 구현은 아니다. C# 기본 코드를 읽을 수 있다는 전제로 자료구조의 규칙과 비용에 집중한다.

## Count Capacity와 유효한 인덱스

먼저 용어를 구분한다.

| 이름 | 의미 | 예 |
| --- | --- | --- |
| 내부 배열 | 값을 보관하는 고정 길이 저장소 | 길이 4인 `int[]` |
| `Count` | 목록에 실제로 들어 있는 원소 수 | 2 |
| `Capacity` | 현재 내부 배열의 길이 | 4 |
| 유효한 인덱스 | 목록의 원소를 읽고 바꿀 수 있는 범위 | 0, 1 |
| 여유 공간 | 아직 목록의 원소로 취급하지 않는 칸 | 인덱스 2, 3 |

```text
인덱스       0    1    2    3
내부 배열   10   20    0    0
            └ 실제 원소 ┘ └ 여유 공간 ┘
Count = 2, Capacity = 4
```

여유 공간에 0이 들어 있는 것은 점유 규칙이 아니다. 정수 0도 정상 원소로 추가할 수 있다. 값이 0인지가 아니라 인덱스가 Count보다 작은지로 목록에 속하는지를 판단한다.

다음 세 조건은 모든 연산 뒤에 유지해야 한다. 항상 참이어야 하는 이런 조건을 불변식이라고 한다.

1. `0 <= Count <= Capacity`다.
2. 실제 원소는 인덱스 0부터 `Count - 1`까지 빈틈없이 모여 있다.
3. 읽기·수정·삭제는 `0 <= index < Count`에서만 허용한다.

따라서 `new List<int>(100)`은 원소 100개를 만드는 코드가 아니다. 용량을 확보했지만 Count는 0이다. `list[0] = 10`은 기존 원소 수정이므로 실패하고, `Add(10)`으로 원소를 만들어야 한다. [List.Capacity와 Count](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.capacity?view=net-10.0)

## 끝에 추가하고 용량을 확장하는 순서

용량이 남아 있으면 다음 두 작업을 수행한다.

1. 내부 배열의 `items[Count]`에 새 값을 쓴다.
2. Count를 1 늘린다.

Count와 Capacity가 같다면 먼저 저장소를 확장해야 한다. 이 글에서는 초기 용량을 0으로 시작할 수도 있게 하고, 첫 확장은 2칸, 그다음은 2배로 정한다.

```text
확장 전: [10, 20]              Count 2, Capacity 2
새 배열: [ 0,  0, 0, 0]       Capacity 4
복사 후: [10, 20, 0, 0]       기존 원소 두 개 복사
교체 후: [10, 20, 30, 0]      새 값 추가, Count 3
```

새 배열 할당과 복사가 끝난 뒤 내부 참조를 교체한다. 기존 배열 객체의 길이를 바꾸는 것이 아니다. 복사는 원소 값의 복사다. 참조 타입이라면 참조가 복사되므로 객체 자체의 깊은 복사가 되지는 않는다.

정확한 증가 폭은 이 예제 코드의 정책이다. 실제 List를 사용하는 코드는 필요한 용량을 확보할 수 있다는 계약에 맞추고, 모든 런타임에서 같은 초기 크기와 증가 폭이 나온다고 가정하지 않는다. .NET 10 구현의 세부 흐름은 [버전을 고정한 List 소스](https://github.com/dotnet/runtime/blob/v10.0.0/src/libraries/System.Private.CoreLib/src/System/Collections/Generic/List.cs)와 대조할 수 있다.

### 한 번은 비싸도 연속 추가는 분할 상환 O(1)인 이유

빈 상태에서 원소를 n개 연속으로 추가한다고 하자. 이 예제의 확장에서 옮기는 기존 원소 수는 0, 2, 4, 8처럼 늘어난다. 확장마다 값을 하나씩 늘려 복사하는 것과 다르다.

```text
원소 8개까지 추가할 때
두 배 확장:   기존 원소 복사 0 + 2 + 4 = 6
한 칸씩 확장: 기존 원소 복사 0 + 1 + 2 + ... + 7 = 28
```

2배 확장의 복사 횟수 합은 n의 상수 배수보다 작다. 여기에 새 값 n개를 쓰는 비용과 새 배열 초기화 비용을 포함해도 전체 증가량은 O(n)으로 설명할 수 있다. 전체를 n번의 추가에 나누면 한 번당 분할 상환 O(1)이다. 무작위 입력을 가정해서 싼 경우가 많이 나올 것이라고 기대하는 분석은 아니다. [List.Add의 확장 비용](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.add?view=net-10.0)

반면 확장하는 한 번의 Add는 현재 원소 n개를 옮겨야 하므로 O(n)까지 든다. 프레임 안에서 그 확장이 발생하면 순간 비용을 만들 수 있다. 예상 개수가 있으면 초기 용량이나 `EnsureCapacity`로 미리 확보할 수 있지만, 확보 자체의 할당 비용과 여유 메모리는 남는다. [List.EnsureCapacity](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.ensurecapacity?view=net-10.0)

## 한 원소를 삭제하면 뒤쪽을 당긴다

인덱스 1을 제거하는 경우를 보자.

```text
시작:       [10, 20, 30, 40, 50, 0, 0, 0] Count 5
인덱스 2→1: [10, 30, 30, 40, 50, 0, 0, 0]
인덱스 3→2: [10, 30, 40, 40, 50, 0, 0, 0]
인덱스 4→3: [10, 30, 40, 50, 50, 0, 0, 0]
끝 정리:    [10, 30, 40, 50,  0, 0, 0, 0] Count 4
```

살아남은 값의 순서를 유지하면서 빈틈을 없앤다. 뒤에 있던 세 원소가 이동했다. 일반적으로 이동 수는 `삭제 전 Count - index - 1`이다. 맨 뒤 삭제는 이동 수가 0이고 맨 앞 삭제는 나머지를 전부 당긴다. 범위 검사와 마지막 칸 정리도 있으므로 이동 수 0이 연산 비용 전체가 0이라는 뜻은 아니다. [List.RemoveAt](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.removeat?view=net-10.0)

삭제 후 인덱스 1은 20이 아니라 30을 가리킨다. UI 선택·외부 참조·딕셔너리의 값으로 List 인덱스를 저장했다면 함께 갱신해야 한다. 고유 ID와 현재 위치는 구분한다.

중간 삽입은 반대로 뒤쪽 원소를 오른쪽으로 밀어 자리를 만든다. 같은 배열에서 이를 직접 구현할 때는 뒤에서부터 복사해야 아직 옮기지 않은 값을 덮어쓰지 않는다. 이번 구현은 삭제에 집중하며 Insert는 제공하지 않는다.

## 조건 삭제는 살아남을 값을 한 번에 압축한다

여러 원소를 지울 때 RemoveAt을 반복하면 같은 값을 여러 차례 당길 수 있다. 뒤에서 앞으로 삭제하면 인덱스 누락은 피하지만, 이동 비용까지 없어지지는 않는다.

조건 삭제는 두 인덱스를 사용해 한 번의 순회로 구현할 수 있다.

- `read`는 다음에 검사할 원소다.
- `write`는 다음에 살아남을 값을 놓을 자리다.
- 제거할 값이면 read만 이동한다.
- 남길 값이면 write 위치로 복사하고 write도 이동한다.

```text
입력: [10, 20, 30, 20, 40]
제거 조건: 값이 20

read 0: 10을 인덱스 0에 유지, write 1
read 1: 20을 건너뜀,          write 1
read 2: 30을 인덱스 1로 이동, write 2
read 3: 20을 건너뜀,          write 2
read 4: 40을 인덱스 2로 이동, write 3

결과: [10, 30, 40] Count 3
```

write는 read보다 앞서 나가지 않는다. 읽기 전의 미래 원소를 덮어쓰지 않고, 남긴 원소의 순서도 유지한다. 마지막에 Count를 write로 바꾸고 사용이 끝난 뒤쪽 칸을 정리한다. 조건 검사 비용이 O(1)이라면 전체 O(n)으로 처리할 수 있다. [List.RemoveAll의 조건·순회 비용](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.removeall?view=net-10.0)

여기서 조건 함수는 원소를 보고 true·false를 반환하는 함수다. true일 때 제거한다. 예제에서는 조건 함수가 목록을 변경하거나 예외를 던지지 않는다고 전제한다. 복사 도중 조건 함수가 실패하면 이미 이동한 값이 있을 수 있다. 전체 연산의 자동 되돌리기 기능까지 있는 것은 아니다.

## 실행 예제: 작은 동적 배열 만들기

.NET 10 SDK가 설치된 터미널에서 새 콘솔 프로젝트를 만든다.

```sh
dotnet new console --framework net10.0 -n DynamicArrayStudy
cd DynamicArrayStudy
```

`Program.cs` 전체를 아래 코드로 교체하고 `dotnet run`한다. 실습의 완성 코드도 같은 방식으로 각각 파일 전체를 교체해 실행한다. 이 글의 C# 코드 블록 네 개는 서로 독립된 완성 프로그램이다.

```csharp
using System;

sealed class IntBuffer
{
    private int[] items;
    public int Count { get; private set; }
    public int Capacity => items.Length;
    public long GrowthCopyCount { get; private set; }
    public long RemovalMoveCount { get; private set; }

    public IntBuffer(int capacity = 0)
    {
        if (capacity < 0)
            throw new ArgumentOutOfRangeException(nameof(capacity));
        items = new int[capacity];
    }

    public int this[int index]
    {
        get { CheckIndex(index); return items[index]; }
        set { CheckIndex(index); items[index] = value; }
    }

    private void CheckIndex(int index)
    {
        if (index < 0 || index >= Count)
            throw new ArgumentOutOfRangeException(nameof(index));
    }

    private void EnsureCapacity(int minimum)
    {
        if (minimum <= Capacity) return;
        int next = Capacity == 0 ? 2 : checked(Capacity * 2);
        if (next < minimum) next = minimum;
        int[] expanded = new int[next];
        for (int i = 0; i < Count; i++) expanded[i] = items[i];
        GrowthCopyCount += Count;
        items = expanded;
    }

    public void Add(int value)
    {
        EnsureCapacity(checked(Count + 1));
        items[Count] = value;
        Count++;
    }

    public void RemoveAt(int index)
    {
        CheckIndex(index);
        for (int i = index + 1; i < Count; i++)
        {
            items[i - 1] = items[i];
            RemovalMoveCount++;
        }
        Count--;
        items[Count] = 0;
    }

    public int RemoveAll(Predicate<int> match)
    {
        if (match == null) throw new ArgumentNullException(nameof(match));
        int before = Count;
        int write = 0;
        for (int read = 0; read < before; read++)
        {
            if (match(items[read])) continue;
            if (write != read)
            {
                items[write] = items[read];
                RemovalMoveCount++;
            }
            write++;
        }
        int removed = before - write;
        Array.Clear(items, write, removed);
        Count = write;
        return removed;
    }

    public void Clear()
    {
        Array.Clear(items, 0, Count);
        Count = 0;
    }

    public int[] ToArray()
    {
        int[] result = new int[Count];
        Array.Copy(items, result, Count);
        return result;
    }
}

class Program
{
    static void Show(string label, IntBuffer buffer)
    {
        Console.WriteLine($"{label}: [{string.Join(", ", buffer.ToArray())}] " +
            $"Count={buffer.Count} Capacity={buffer.Capacity}");
    }

    static void Main()
    {
        IntBuffer buffer = new IntBuffer(2);
        Show("시작", buffer);
        foreach (int value in new[] { 10, 20, 30, 40, 50 })
        {
            buffer.Add(value);
            Show("추가 " + value, buffer);
        }
        Console.WriteLine("확장 복사: " + buffer.GrowthCopyCount);
        buffer.RemoveAt(1);
        Show("인덱스 1 삭제", buffer);
        Console.WriteLine("단건 삭제 이동: " + buffer.RemovalMoveCount);

        long beforeMoves = buffer.RemovalMoveCount;
        int removed = buffer.RemoveAll(value => value >= 30 && value <= 40);
        Show("조건 삭제", buffer);
        Console.WriteLine($"제거 수: {removed}, 이번 이동: " +
            (buffer.RemovalMoveCount - beforeMoves));
        buffer.Clear();
        Show("비우기", buffer);
    }
}
```

실행 결과는 다음과 같다.

```text
시작: [] Count=0 Capacity=2
추가 10: [10] Count=1 Capacity=2
추가 20: [10, 20] Count=2 Capacity=2
추가 30: [10, 20, 30] Count=3 Capacity=4
추가 40: [10, 20, 30, 40] Count=4 Capacity=4
추가 50: [10, 20, 30, 40, 50] Count=5 Capacity=8
확장 복사: 6
인덱스 1 삭제: [10, 30, 40, 50] Count=4 Capacity=8
단건 삭제 이동: 3
조건 삭제: [10, 50] Count=2 Capacity=8
제거 수: 2, 이번 이동: 1
비우기: [] Count=0 Capacity=8
```

### 코드에서 확인할 순서

1. 생성자는 용량만 확보한다. Count의 초기값은 0이다.
2. 인덱서는 배열 길이가 아니라 Count로 검사한다. 여유 공간을 읽거나 수정할 수 없다.
3. Add는 먼저 용량을 확보하고 값을 쓴 뒤 Count를 늘린다. 새 배열 할당이 실패하면 새 원소가 추가된 것으로 처리하지 않는다.
4. 세 번째 추가에서 2개, 다섯 번째 추가에서 4개를 복사해 확장 복사 합계가 6이다.
5. 단건 삭제는 30·40·50을 각각 한 칸 당긴다. 조건 삭제는 30·40을 건너뛰고 50을 한 번만 옮긴다.
6. Clear는 이 예제에서 유효 구간을 0으로 지우고 Count를 0으로 만든다. 용량은 8로 유지한다.

`GrowthCopyCount`는 확장 함수 안에서 복사한 원소 수만 센다. `RemovalMoveCount`는 삭제 중 살아남은 값을 다른 칸에 옮긴 횟수만 센다. 새 값 쓰기·뒤쪽 초기화·조건 검사·출력은 이 숫자에 포함하지 않는다. Show에 사용한 ToArray도 별도의 배열 할당과 복사를 수행한다. 따라서 이 프로그램은 내부 동작 관찰용이며 성능 벤치마크가 아니다.

`checked`는 용량 계산의 정수 넘침을 예외로 처리한다. 실제 List의 배열 최대 길이 보정·대량 삽입·열거자 무효화·동시 접근 등의 기능은 이 코드에 없다. 큰 배열의 메모리 확보가 항상 성공하는 것도 아니다. 실제 프로젝트에는 기본 List를 사용하고, 예제 코드로 원리를 확인한다.

## 삭제 Clear와 메모리 반환은 서로 다르다

Count를 줄였다고 내부 배열의 길이가 줄지는 않는다. 같은 크기의 목록을 반복해서 채우는 작업에서는 용량을 유지하면 다음 확장을 줄일 수 있다.

참조 타입을 담은 컬렉션에서는 사용이 끝난 칸에 이전 객체 참조를 남겨두면 그 객체가 계속 참조될 수 있다. 유효 구간을 줄이는 것과 참조를 지우는 것을 함께 봐야 한다. 이 예제는 정수만 저장하므로 뒤쪽에 0을 쓴다. 실제 .NET List는 타입이 참조를 포함하는지에 따라 정리 경로를 구분한다. [List.Clear의 원소·용량 처리](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.clear?view=net-10.0)

참조를 지우는 것은 객체의 Dispose를 호출하거나 즉시 메모리를 반환하는 명령이 아니다. 다른 곳에서 여전히 참조하면 객체는 살아 있다. 내부 배열도 컬렉션이 유지하는 동안 남아 있다.

배열을 축소하면 다시 할당·복사가 발생할 수 있다. 매번 추가 후 확장하고 삭제 후 정확히 축소하면 크기가 오갈 때 비싼 작업이 반복된다. 목록 크기가 안정된 시점에 축소가 필요한지 판단한다. `TrimExcess`도 매 호출마다 용량을 Count와 정확히 같게 만드는 계약으로 가정하지 않는다. 여유 비율에 따라 축소 여부를 판단한다. [List.TrimExcess](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1.trimexcess?view=net-10.0)

한 번의 2배 확장 도중에는 기존 C칸과 새 2C칸 배열이 함께 존재할 수 있다. 원소의 논리 개수만큼만 메모리가 드는 구조가 아니다. 이전 배열의 실제 수거 시점과 객체·배열 헤더 비용도 있으므로 이를 그대로 프로세스 메모리의 정확한 최대치로 해석하지 않는다.

## 실습 1: 복사·이동·용량을 먼저 계산하기

초기 용량 2인 IntBuffer에 0~8의 정수 아홉 개를 추가한다. 다음 값을 계산한 뒤 첫 예제의 입력을 바꿔 확인한다.

1. 마지막 Count와 Capacity는 얼마인가?
2. 확장 때문에 복사한 기존 원소는 총 몇 개인가?
3. 그 상태에서 인덱스 0을 삭제하면 몇 개를 당기는가?
4. 이어서 맨 뒤를 삭제하면 이동 수는 얼마인가?
5. Clear하면 Capacity도 0이 되는가?

### 풀이

추가를 마치면 Count는 9, Capacity는 16이다. 세 번째·다섯 번째·아홉 번째 추가에서 각각 2·4·8개를 복사하므로 합계는 14다. 맨 앞 삭제는 나머지 8개를 당긴다. 그 뒤 맨 뒤 삭제는 이동 수가 0이다. 두 번 삭제 후 Count는 7, Clear 후 Count는 0이며 Capacity는 계속 16이다.

처음 넣은 값 0도 정상 원소다. 이를 빈칸으로 해석하면 Count와 출력의 의미가 달라진다. 이 구현은 0을 특별한 아이템 ID로 예약하지 않는다.

## 실습 2: 실제 List의 용량과 인덱스 확인하기

용량 8을 미리 확보한 List에서 첫 값을 바로 수정해 본다. 이어서 세 값을 추가하고 중간 삭제·Clear·재사용·명시적 축소를 수행한다. 실행하기 전에 Count와 Capacity가 바뀌는 시점을 적는다.

### 풀이 코드

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> items = new List<int>(8);
        Console.WriteLine($"준비: Count={items.Count} Capacity={items.Capacity}");
        try { items[0] = 10; }
        catch (ArgumentOutOfRangeException)
        {
            Console.WriteLine("빈 목록의 인덱스 수정은 실패");
        }

        items.AddRange(new[] { 10, 20, 30 });
        items.RemoveAt(1);
        Console.WriteLine("삭제 후: " + string.Join(", ", items));
        items.Clear();
        Console.WriteLine($"Clear: Count={items.Count} Capacity={items.Capacity}");
        items.Add(99);
        Console.WriteLine($"재사용: Count={items.Count} Capacity={items.Capacity}");
        items.Capacity = items.Count;
        Console.WriteLine($"축소: Count={items.Count} Capacity={items.Capacity}");
    }
}
```

```text
준비: Count=0 Capacity=8
빈 목록의 인덱스 수정은 실패
삭제 후: 10, 30
Clear: Count=0 Capacity=8
재사용: Count=1 Capacity=8
축소: Count=1 Capacity=1
```

여유 용량은 인덱스 접근 권한을 늘리지 않는다. 삭제는 남은 원소를 당기고, Clear는 기존 용량을 재사용할 수 있게 둔다. 마지막 줄에서는 Capacity에 Count를 명시적으로 대입해 축소했다. Capacity를 Count보다 작게 설정하면 유효 원소를 담을 수 없으므로 예외가 발생한다. 이 연산과 `TrimExcess`의 동작 조건을 구분한다.

## 실습 3: 역순 RemoveAt과 한 번의 압축 비교하기

1~8 중 짝수를 모두 제거한다. 역순 RemoveAt과 read·write 압축은 결과가 같아야 한다. 살아남은 값을 다른 칸으로 옮긴 횟수도 계산한다. 뒤에서 앞으로 지우면 왜 여전히 여러 번 이동할 수 있는지 설명한다.

### 풀이 코드

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> backward = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8 };
        long backwardMoves = 0;
        for (int i = backward.Count - 1; i >= 0; i--)
        {
            if (backward[i] % 2 != 0) continue;
            backwardMoves += backward.Count - i - 1;
            backward.RemoveAt(i);
        }

        int[] packed = { 1, 2, 3, 4, 5, 6, 7, 8 };
        int write = 0;
        long compactMoves = 0;
        for (int read = 0; read < packed.Length; read++)
        {
            if (packed[read] % 2 == 0) continue;
            if (write != read)
            {
                packed[write] = packed[read];
                compactMoves++;
            }
            write++;
        }
        int[] kept = new int[write];
        Array.Copy(packed, kept, write);

        Console.WriteLine("역순 결과: " + string.Join(", ", backward));
        Console.WriteLine("압축 결과: " + string.Join(", ", kept));
        Console.WriteLine("역순 이동: " + backwardMoves);
        Console.WriteLine("압축 이동: " + compactMoves);
    }
}
```

```text
역순 결과: 1, 3, 5, 7
압축 결과: 1, 3, 5, 7
역순 이동: 6
압축 이동: 3
```

역순으로 8·6·4·2를 지울 때 이동 수는 각각 0·1·2·3이다. 압축은 3·5·7을 한 번씩만 앞에 쓴다. 역순 삭제는 방문할 원소를 건너뛰는 오류를 피하지만, 반복된 재배치 비용까지 선형으로 바꾸지는 않는다. 이런 패턴이 커지면 반복 RemoveAt은 O(n²)까지 들 수 있다.

이 숫자는 원소 이동 수를 비교한 모델이다. List 내부의 최적화된 배열 복사 시간과 C# 대입문의 실제 실행 시간을 측정한 결과가 아니다. 압축 결과를 출력하기 위해 새 배열로 복사한 마지막 작업도 압축 이동 수에서는 제외했다.

## 실습 4: 확장 정책에 따른 복사 총량 계산하기

끝 추가 때 용량이 부족하면 한 칸만 늘리는 정책과 2배로 늘리는 정책을 비교한다. n개를 추가할 때 기존 원소 복사 수가 어떻게 달라지는지 예측한 뒤 실행한다.

### 풀이 코드

```csharp
using System;

class Program
{
    static long CountCopies(int additions, bool doubleGrowth)
    {
        int count = 0;
        int capacity = 0;
        long copies = 0;
        for (int i = 0; i < additions; i++)
        {
            if (count == capacity)
            {
                copies += count;
                capacity = doubleGrowth
                    ? (capacity == 0 ? 2 : capacity * 2)
                    : capacity + 1;
            }
            count++;
        }
        return copies;
    }

    static void Main()
    {
        foreach (int n in new[] { 8, 16, 1024 })
            Console.WriteLine($"n={n}: 두 배={CountCopies(n, true)}, " +
                $"한 칸={CountCopies(n, false)}");
    }
}
```

```text
n=8: 두 배=6, 한 칸=28
n=16: 두 배=14, 한 칸=120
n=1024: 두 배=1022, 한 칸=523776
```

한 칸씩 늘리면 매 추가마다 이전 원소를 다시 복사하므로 합계가 `n * (n - 1) / 2`다. 두 배 확장은 기하급수적으로 용량이 늘어 복사 합계가 O(n)이다. 이 결과로 ‘항상 몇 배 빠르다’는 실행 시간 비율을 만들 수는 없다. 프로그램은 실제 배열을 할당하지 않고 복사할 원소 수만 계산한다. 입력도 제시한 작은 범위를 대상으로 한다.

## 실제 프로젝트에서 적용할 때 확인할 것

| 작업 | 선택과 확인할 비용 |
| --- | --- |
| 예상 개수가 있는 임시 결과 목록 | 초기 Capacity를 지정하되 과도한 여유 공간도 확인 |
| 프레임마다 같은 목록을 다시 채우기 | Clear 후 재사용과 참조·소유권 정리 확인 |
| 조건에 맞는 원소 대량 삭제 | RemoveAll이나 한 번의 압축 검토, 조건 함수 비용 포함 |
| 순서가 중요한 중간 삭제 | 뒤쪽 이동과 외부 인덱스 갱신 |
| 순서가 필요 없는 목록 | 마지막 값으로 빈자리를 메우는 별도 삭제 계약 검토 |
| 크기가 크게 줄어든 뒤 안정된 목록 | 축소 비용과 이후 재확장 가능성을 비교 |

마지막 값을 가져와 빈자리를 메우면 순서를 보존하지 않는 삭제를 O(1)에 구현할 수 있다. 하지만 UI 표시 순서·순회 결과·외부 인덱스가 달라지므로 일반 RemoveAt과 의미가 다르다. 안정적인 ID가 필요한 곳에서는 인덱스를 ID로 취급하지 않는다.

DCB에서는 파츠 자식 목록과 조립 결과 목록에 List를 사용한다. 이 글의 IntBuffer로 게임 코드를 교체한 것은 아니다. 적용 여부는 실제 호출 빈도와 데이터 크기, Profiler 결과로 판단해야 한다. 장비 데이터와 복사의 관계는 [장비 파츠 조합 글](/writing/modular-equipment/)에서 이어서 볼 수 있다.

## 복습과 검증 범위

아래 질문에 연산 순서를 설명하며 답한다.

1. Capacity가 남는데 `buffer[Count]`를 읽지 못하는 이유는 무엇인가?
2. 확장 한 번은 O(n)인데 연속 Add의 분할 상환 비용이 O(1)인 이유는 무엇인가?
3. 역순 삭제와 한 번의 압축이 같은 결과를 내면서 이동 수는 다른 이유는 무엇인가?
4. 참조를 지우는 것, Count를 줄이는 것, 배열을 축소하는 것은 어떻게 다른가?

답은 **논리 원소 범위**, **전체 확장 복사 합계의 선형 증가**, **생존 원소의 반복 이동 여부**, **객체 참조·논리 크기·저장소 수명의 차이**다. 실습 입력을 빈 목록·원소 한 개·전부 제거·하나도 제거하지 않기로 바꿔 불변식이 유지되는지도 확인한다.

2026년 10월 17일, 본문의 완성 프로그램 네 개를 .NET SDK 10.0.301에서 각각 컴파일·실행해 표시한 출력과 대조했다. IntBuffer는 빈 목록·잘못된 인덱스·0 값·전부 및 일부 제거·재사용을 확인하고, 고정 시드의 연산 5,000회를 List의 결과와 비교했다. 이는 예제 코드의 동작 검사이며 Unity 게임 플레이·GC 시간·프레임 성능을 측정한 결과는 아니다. 예제는 이 글을 위해 독립적으로 작성했고 설명·코드·검사 작성에 AI를 사용했다.
