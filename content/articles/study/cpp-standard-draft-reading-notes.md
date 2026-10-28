---
title: "C++ 표준 초안 읽기: 객체 수명·참조·복사 생략과 컨테이너"
description: "1·2주차에서 연결한 표준 초안 여섯 절의 핵심 규칙을 한국어로 요약합니다. 객체 수명, 참조 결합, NRVO, vector와 해시 컨테이너의 무효화를 자체 예제로 설명합니다."
slug: "cpp-standard-draft-reading-notes"
date: "2026-10-28"
dateBasis: "authored"
topic: "study"
kind: "note"
tags: ["C++", "Lifetime", "Memory", "Containers", "References"]
draft: false
---

## 여섯 절의 읽기 순서

[1주차 객체와 메모리](/writing/cpp-objects-memory-lifetime/)와 [2주차 코드 구조와 컨테이너](/writing/cpp-code-structure-containers/)에서 연결한 규칙을 모았습니다. 아래 내용은 원문의 핵심 요약과 자체 해설이며, 전문 번역이나 공식 번역이 아닙니다. 조항의 모든 예외·요구사항을 재현하지 않습니다.

| 원문 식별자 | 한국어로 읽을 주제 | 먼저 확인할 질문 |
| --- | --- | --- |
| [basic.life](https://eel.is/c++draft/basic.life) | 객체와 참조의 수명 | 메모리가 남아 있으면 객체도 살아 있습니까? |
| [dcl.init.ref](https://eel.is/c++draft/dcl.init.ref) | 참조 초기화 | 참조에 대입하면 연결 대상이 바뀝니까? |
| [class.copy.elision](https://eel.is/c++draft/class.copy.elision) | 복사·이동 생략 | 반환할 객체를 처음부터 결과 위치에 만들 수 있습니까? |
| [vector.capacity](https://eel.is/c++draft/vector.capacity) | 벡터의 용량 | 공간 예약과 원소 추가는 같은 동작입니까? |
| [vector.modifiers](https://eel.is/c++draft/vector.modifiers) | 벡터의 삽입·삭제 | 재할당 없이도 참조가 무효화됩니까? |
| [unord.req](https://eel.is/c++draft/unord.req) | 비정렬 연관 컨테이너 요구사항 | 재해시 이후 반복자와 원소 주소가 모두 무효화됩니까? |

원문은 2026년 10월 28일 확인한 작업 초안입니다. 링크는 이후에도 바뀔 수 있으며, C++20에 고정된 문서가 아닙니다. [초안 소스 저장소](https://github.com/cplusplus/draft)는 소스와 생성 문서가 정식으로 채택되기 전에는 ISO 간행물이 아니라고 안내합니다. 아래 코드는 C++20의 기능만 사용하는 별도 예제입니다.

각 코드 블록을 서로 다른 `.cpp` 파일로 저장해 실행합니다. 모든 예제가 자체 `main`을 가지므로 한 실행 파일에 함께 넣지 않습니다. Visual Studio의 x64 Native Tools Command Prompt에서는 다음처럼 빌드할 수 있습니다. 검사가 모두 맞으면 출력 없이 종료하고, 어긋나면 `assert`가 실패합니다. `NDEBUG`는 정의하지 않습니다.

```bat
cl /nologo /std:c++20 /EHsc /W4 /WX /utf-8 example.cpp /Fe:example.exe
example.exe
```

## 1. 객체 수명 — basic.life

수명은 객체가 실행 중 유효한 객체로 존재하는 기간입니다. 일반적으로 형식에 맞는 크기·정렬의 저장 공간을 확보하고 초기화를 마쳐야 시작됩니다. union 멤버 등에는 별도 규칙이 있습니다.

클래스 객체의 수명은 소멸자 호출이 시작될 때 끝납니다. 저장 공간을 해제하거나 조건에 해당하는 재사용을 해도 끝날 수 있습니다. 따라서 소멸자 실행, 객체 수명 종료, 메모리 해제는 같은 사건이 아닙니다. 생성·소멸 중의 접근은 별도 규칙을 따릅니다.

수명이 끝난 뒤 공간이 남아 있어도 이전 객체의 멤버를 자유롭게 읽거나 호출할 수 없습니다. 같은 주소에 새 객체를 만들었을 때 이전 포인터가 새 객체를 가리키게 되는지는 별도의 대체 조건에 달려 있습니다. [원문: 객체 수명](https://eel.is/c++draft/basic.life)

아래는 저장 공간 하나에서 객체 두 개를 차례로 생성하는 자체 예제입니다. 두 번째 객체에는 생성 함수가 돌려준 포인터를 사용합니다.

```cpp
#include <cassert>
#include <memory>

struct Item { int id; };

int main() {
    std::allocator<Item> memory;
    Item* slot = memory.allocate(1);

    Item* first = std::construct_at(slot, Item{101});
    assert(first->id == 101);
    std::destroy_at(first);
    // 공간은 남지만 첫 객체의 멤버를 읽지 않습니다.

    Item* second = std::construct_at(slot, Item{202});
    assert(second->id == 202);
    std::destroy_at(second);
    memory.deallocate(slot, 1);
}
```

확인할 차이는 `destroy_at` 뒤에도 공간이 남고, `deallocate`에서 그 공간을 반환한다는 점입니다. 일반적인 객체 관리는 RAII나 컨테이너에 맡기되, 이 둘이 분리될 수 있다는 규칙을 기억합니다.

## 2. 참조 초기화 — dcl.init.ref

참조 변수는 정의할 때 결합할 대상을 정합니다. 초기화한 뒤 대입해도 다른 객체로 연결되지 않습니다. 대입은 참조가 가리키는 객체에 적용됩니다. 함수 인수 전달과 참조 반환에서도 참조 초기화 규칙이 사용됩니다.

결합 가능 여부에는 형식과 `const` 같은 한정자, 식의 값 범주가 관여합니다. 예를 들어 일반적인 `int&`는 정수 리터럴에 결합할 수 없지만 `const int&`는 가능합니다. 이를 모든 형식 변환이나 모든 임시 객체의 수명 보장으로 확대하면 안 됩니다. [원문: 참조 초기화](https://eel.is/c++draft/dcl.init.ref)

자체 예제에서 `selected = other`는 `health`에 값을 복사합니다. 주소를 비교하면 참조의 대상이 그대로임을 볼 수 있습니다.

```cpp
#include <cassert>

int main() {
    int health = 80;
    int other = 25;
    int& selected = health;

    selected = other;
    other = 90;

    assert(health == 25);
    assert(&selected == &health);
    assert(&selected != &other);
}
```

연결 대상을 교체하는 기능이 필요하면 참조 대입을 쓰지 않고, 재지정할 수 있는 포인터 등의 표현을 선택합니다.

## 3. 복사·이동 생략 — class.copy.elision

일정한 조건에서는 복사·이동 생성자를 호출해 별도 객체를 만드는 과정을 생략할 수 있습니다. 해당 생성자에 출력 같은 부수 효과가 있어도 허용됩니다. 원래 두 객체였을 대상을 하나의 객체로 취급하므로 소멸 시점에도 관련 규칙이 적용됩니다.

대표 사례는 NRVO입니다. 조건에 맞는 이름 있는 지역 객체를 반환할 때, 그 객체를 함수 결과가 놓일 위치에 직접 만들 수 있습니다. 여기서 중요한 표현은 ‘할 수 있다’입니다. 언제나 적용된다는 보장은 아닙니다. 예외 객체·코루틴 매개변수에도 별도 생략 조건이 있습니다. [원문: 복사·이동 생략](https://eel.is/c++draft/class.copy.elision)

자체 예제는 복사를 금지하되 이동은 허용합니다. NRVO를 적용하지 않아도 이동으로 반환할 수 있습니다.

```cpp
#include <cassert>

struct Reward {
    int points;
    explicit Reward(int value) : points(value) {}
    Reward(const Reward&) = delete;
    Reward(Reward&&) = default;
};

Reward MakeReward() {
    Reward result{120};
    return result;
}

int main() {
    Reward reward = MakeReward();
    assert(reward.points == 120);
}
```

이 검사는 반환값을 확인합니다. 생성자 호출 횟수나 NRVO 적용 여부를 증명하지 않습니다. 이동 생성자까지 삭제한다면 생략이 항상 일어날 것이라고 가정해 코드를 작성할 수 없습니다.

## 4. 벡터 용량 — vector.capacity

`capacity()`는 재할당 없이 담을 수 있는 원소 수입니다. 현재 원소 수인 `size()`와 구분합니다. `reserve(n)`은 크기를 바꾸지 않으며, 현재 용량보다 큰 값을 요청할 때 재할당합니다. 재할당 후 용량은 요청한 값 이상이지 반드시 같은 값은 아닙니다.

재할당은 원소를 가리키던 포인터·참조·반복자와 이전 `end()`를 무효화합니다. 재할당하지 않는 `reserve`는 이를 유지합니다. `resize`는 실제 원소 수를 바꾸고, `shrink_to_fit`은 용량 축소 요청이므로 반드시 축소된다고 보장하지 않습니다. [원문: 벡터 용량](https://eel.is/c++draft/vector.capacity)

자체 예제의 첫 삽입에는 여유 공간이 있습니다. 마지막 `reserve`는 기존 용량을 넘겨 재할당을 요구하므로 그 뒤에는 `first`를 사용하지 않습니다.

```cpp
#include <cassert>
#include <vector>

int main() {
    std::vector<int> values{10, 20};
    values.reserve(8);
    assert(values.size() == 2);

    int* first = &values[0];
    values.push_back(30);
    assert(first == &values[0]);
    assert(*first == 10);

    const auto oldCapacity = values.capacity();
    values.reserve(oldCapacity + 1);
    assert(values[0] == 10); // 원소를 다시 조회합니다.
}
```

여유 공간은 재할당을 줄이는 수단입니다. 삽입·삭제로 인한 모든 참조 무효화를 막는 보장은 아닙니다.

## 5. 벡터 수정 — vector.modifiers

삽입으로 새 크기가 기존 용량을 넘으면 재할당합니다. 재할당하지 않아도 삽입 위치부터 뒤쪽의 포인터·참조·반복자와 이전 `end()`는 무효화됩니다. 삽입 위치보다 앞의 원소를 가리키는 것은 유지됩니다.

삭제는 삭제 위치와 그 뒤의 반복자·참조를 무효화합니다. 따라서 순회하며 삭제할 때 기존 반복자를 계속 증가시키기보다 `erase`가 반환한 반복자를 사용합니다. 가운데 삽입·삭제는 뒤쪽 원소를 옮기는 비용도 발생합니다. [원문: 벡터 수정](https://eel.is/c++draft/vector.modifiers)

자체 예제는 공간을 예약한 상태에서 가운데 삽입·삭제를 합니다. 첫 원소의 포인터는 변경 위치보다 앞에 있습니다.

```cpp
#include <cassert>
#include <vector>

int main() {
    std::vector<int> values{20, 40};
    values.reserve(8);
    int* first = &values[0];

    auto inserted = values.insert(values.begin() + 1, 30);
    assert(*inserted == 30);
    assert(*first == 20);

    auto next = values.erase(inserted);
    assert(*next == 40);
    assert(*first == 20);
    assert(values.size() == 2);
}
```

삭제 후의 `inserted`는 사용하지 않습니다. `next`는 이 예제에서 다음 원소를 가리키지만, 마지막 원소를 지운 경우에는 `end()`이므로 역참조 전에 확인해야 합니다.

## 6. 해시 컨테이너 — unord.req

`unordered_map` 등은 해시 함수와 키 동등성 비교를 사용합니다. 동등하다고 판단하는 키는 같은 해시값을 가져야 합니다. 역으로 해시값이 같다는 이유만으로 키가 같다고 판단하지는 않습니다.

원소는 버킷으로 조직됩니다. 재해시는 반복자를 무효화하고 순회 순서를 바꿀 수 있지만, 원소 자체를 가리키는 포인터·참조는 무효화하지 않습니다. 해당 원소를 삭제하면 그 원소를 계속 사용할 수 없습니다. 키 조회는 평균적으로 빠르지만 최악의 경우 선형 시간이 될 수 있습니다. [원문: 비정렬 연관 컨테이너 요구사항](https://eel.is/c++draft/unord.req)

자체 예제는 재해시 후 원소의 포인터를 사용하되, 반복자는 다시 얻습니다.

```cpp
#include <cassert>
#include <unordered_map>

int main() {
    std::unordered_map<int, int> counts{{101, 2}};
    auto found = counts.find(101);
    int* count = &found->second;

    counts.rehash(counts.bucket_count() * 2 + 1);
    assert(*count == 2);

    auto again = counts.find(101);
    assert(again != counts.end());
    assert(&again->second == count);

    counts.erase(101);
    assert(counts.find(101) == counts.end());
    // 삭제 후에는 count와 again을 사용하지 않습니다.
}
```

반복자가 무효라는 사실과 원소 주소가 무효라는 사실을 분리해서 판단합니다. 이 규칙을 언리얼의 `TMap`에 그대로 적용하면 안 되며, 2주차의 컨테이너 비교를 함께 확인합니다.

## 원문 용어를 읽는 기준

| 용어 | 이 글에서 사용하는 의미 |
| --- | --- |
| lifetime | 객체 또는 참조의 수명 |
| storage | 객체가 들어갈 저장 공간 |
| initialization | 객체 또는 참조의 초기화 |
| copy elision | 조건에 따라 복사·이동을 통한 객체 생성을 생략하는 것 |
| invalidation | 기존 포인터·참조·반복자의 유효성이 사라지는 것 |
| undefined behavior | 표준이 해당 동작에 요구사항을 부과하지 않는 것 |

실습 코드와 한국어 해설은 Codex의 도움으로 별도 작성했습니다. 원문 코드의 번역본이나 개인 게임 프로젝트의 구현을 옮긴 것은 아닙니다. [언리얼 C++과 엔진 구조의 주차별 목록](/series/unreal-cpp-engine/)으로 돌아가 각 규칙이 쓰이는 예제를 비교할 수 있습니다.
