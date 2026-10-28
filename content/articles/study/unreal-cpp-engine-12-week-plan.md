---
title: "언리얼 C++과 엔진 구조: 12주 계획"
description: "C++ 객체 수명부터 UObject, 리플렉션, 실행 흐름, 에셋 로딩과 스레드까지 작은 실험과 엔진 소스 추적으로 연결하는 12주 계획입니다."
slug: "unreal-cpp-engine-12-week-plan"
date: "2026-10-28"
dateBasis: "authored"
topic: "study"
kind: "note"
series: "unreal-cpp-engine"
order: 1
tags: ["Unreal Engine", "C++", "UObject", "Memory", "Profiling"]
draft: false
---

## 목표와 진행 범위

언리얼 C++에서 작성한 기능이 언제 호출되고, 어떤 객체를 참조하며, 어느 실행 단계에서 처리되는지 설명하는 것을 목표로 합니다. 객체 수명과 모듈 의존성을 이해한 뒤 프레임 실행, 에셋 로딩, 스레드와 성능 분석으로 범위를 넓힙니다.

기간은 하루 2시간, 주 5일을 기준으로 12주입니다. 총 120시간을 배정한 첫 과정이며, 각 주의 실험을 설명하기 어렵다면 해당 주를 연장합니다. C++의 포인터·참조·생성자·소멸자가 낯설면 첫 두 주에 1~2주를 추가합니다.

기준 버전은 Unreal Engine 5.8입니다. 작은 실험용 프로젝트에 주제별 예제를 추가하고, 마지막에는 실제 게임 기능 하나에 적용합니다. 각 항목은 앞으로 수행할 과제와 완료 기준입니다.

## 12주 진행표

| 기간 | 주제 | 실습과 완료 기준 |
| --- | --- | --- |
| 1주차 | C++ 객체와 메모리 | 생성·복사·이동·소멸을 기록하고 객체의 수명을 누가 책임지는지 설명합니다. |
| 2주차 | C++ 코드 구조와 컨테이너 | 작은 아이템 저장소를 작성하고 소유권, 복사 비용, 헤더 의존성을 설명합니다. |
| 3주차 | 빌드와 모듈 | 모듈을 추가하고 UBT·UHT·컴파일러의 역할과 컴파일·링크 오류를 구분합니다. |
| 4주차 | UObject와 리플렉션 | C++ 클래스와 블루프린트 자식의 기본값, 인스턴스 값, 생성 코드를 연결합니다. |
| 5주차 | 객체 수명과 GC | 참조와 생명주기 로그를 관찰하고 EndPlay·Destroy·메모리 정리의 차이를 설명합니다. |
| 6주차 | 게임 실행 구조 | 레벨 전환과 Pawn 교체에서 유지되거나 다시 생성되는 객체를 구분합니다. |
| 7주차 | 프레임과 이벤트 | Tick·Timer·Delegate로 같은 요구사항을 구현하고 실행 순서와 해제 시점을 비교합니다. |
| 8주차 | 에셋과 로딩 | 비동기 로딩과 요청 주체의 수명을 다루고 참조가 로딩에 미치는 영향을 확인합니다. |
| 9주차 | 데이터와 직렬화 | 데이터를 저장·복원하고 필드가 추가된 뒤 이전 저장 데이터를 처리합니다. |
| 10주차 | 입력과 이동 내부 구조 | 입력부터 위치 변경까지 추적하고 짐 무게에 따른 이동속도를 구현합니다. |
| 11주차 | 스레드와 실행 경계 | 순수 데이터 계산을 작업 스레드에서 수행하고 결과를 게임 스레드에서 적용합니다. |
| 12주차 | 프로파일링과 실제 적용 | 기능 하나를 구현하거나 개선하고 같은 조건의 변경 전후를 측정합니다. |

## 1~2주차: C++ 객체 수명과 코드 구조

첫 주에는 값·포인터·참조, const, 스택·힙, 생성자·소멸자, RAII를 다룹니다. RAII는 자원 확보와 해제를 객체 수명에 연결하는 방식입니다. 작은 C++ 프로그램에서 생성자·복사 생성자·이동 생성자·소멸자에 로그를 넣고, 실행 전에 호출 순서를 예상합니다. 복사 생략처럼 예상한 호출이 나타나지 않는 경우도 컴파일 조건과 함께 확인합니다.

둘째 주에는 상속·가상 함수, 템플릿 기초, 람다, 스마트 포인터, 헤더와 구현 파일의 분리를 다룹니다. 아이템 저장소를 만들며 값을 복사하는 경우와 참조하는 경우를 비교하고, 언리얼의 TArray·TMap도 사용합니다.

완료 기준은 코드의 각 포인터가 무엇을 가리키는지, 대상이 언제 사라지는지, 복사와 이동이 발생하는 이유를 설명하는 것입니다. 일반 C++ 객체의 소유권을 먼저 정리한 뒤 UObject의 GC 참조와 비교합니다.

첫 주는 다음 순서로 진행합니다.

| 날짜 | 실험 |
| --- | --- |
| 1일차 | 값·포인터·참조로 같은 데이터를 전달하고 원본 변경 여부를 비교합니다. |
| 2일차 | 스코프를 바꾸며 생성자·소멸자 로그와 객체 수명을 확인합니다. |
| 3일차 | 자원을 가진 작은 클래스에 RAII를 적용하고 조기 반환 시 정리를 확인합니다. |
| 4일차 | 객체를 복사·이동하고 컨테이너에 넣으며 호출 로그를 비교합니다. |
| 5일차 | 예제를 다시 작성하고 호출 순서 예상과 실제 결과의 차이를 설명합니다. |

## 3~5주차: 빌드, 리플렉션과 UObject

3주차에는 Build.cs·Target.cs, Runtime·Editor 모듈, 모듈 의존성을 다룹니다. 작은 모듈을 추가하고 헤더 누락과 링크 의존성 누락을 각각 재현합니다. 언리얼 빌드는 UBT가 UHT를 호출해 헤더의 메타데이터를 바탕으로 코드를 생성한 뒤, C++ 컴파일러로 결과를 컴파일합니다. 이 흐름을 생성된 헤더·소스와 빌드 로그에서 연결합니다. [Unreal Engine Modules](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-modules), [Unreal Header Tool](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-header-tool-for-unreal-engine)

4주차에는 UObject·UClass, UCLASS·UPROPERTY·UFUNCTION, CDO를 다룹니다. 리플렉션은 엔진이 클래스·속성·함수 정보를 다룰 수 있게 하는 구조이며, CDO는 클래스의 기본값을 보관하는 객체입니다. C++ 클래스와 블루프린트 자식, 레벨에 배치한 인스턴스의 값을 바꾸며 어디에 변경이 남는지 확인합니다.

5주차에는 NewObject·SpawnActor, Actor와 컴포넌트의 생명주기, 강한 참조와 약한 참조를 다룹니다. TObjectPtr는 일반적인 UObject 멤버에서 UPROPERTY와 함께 사용해 GC가 추적하는 참조로 둡니다. TWeakObjectPtr는 대상의 수명을 유지하지 않는 참조에 사용하며, 사용할 때 유효성을 확인합니다. [Object Pointers](https://dev.epicgames.com/documentation/en-us/unreal-engine/object-pointers-in-unreal-engine)

생명주기 실험은 레벨에 배치한 Actor, 실행 중 생성한 Actor, 레벨 전환으로 종료되는 Actor를 나누어 진행합니다. 생성자·초기화·BeginPlay·EndPlay·정리 시점의 로그를 비교하고, Destroy 요청을 실제 메모리 해제와 구분합니다. [Actor Lifecycle](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-actor-lifecycle)

## 6~7주차: 게임 실행 구조와 프레임

6주차에는 Engine·World·GameInstance, GameMode·Controller·Pawn, Subsystem의 책임과 수명을 다룹니다. 레벨을 전환하거나 Controller가 다른 Pawn을 조종하게 만들고, 객체 주소와 초기화·종료 로그를 기록합니다. 데이터가 유지되어야 하는 범위에 맞춰 저장 위치를 정합니다. [Gameplay Framework](https://dev.epicgames.com/documentation/en-us/unreal-engine/gameplay-framework-in-unreal-engine)

7주차에는 Tick·Tick Group, Timer, Delegate와 바인딩 해제를 다룹니다. 일정 시간마다 상태를 검사하는 기능과 상태가 바뀔 때 반응하는 기능을 각각 구현합니다. Actor가 사라지거나 레벨이 바뀔 때 예약된 작업과 이벤트 연결이 어떻게 처리되는지도 확인합니다.

완료 기준은 어떤 객체가 무엇을 호출하는지 그릴 수 있고, 실행 순서가 필요한 이유와 객체 종료 시 정리할 항목을 설명하는 것입니다.

## 8~9주차: 에셋 로딩과 저장 데이터

8주차에는 하드·소프트 참조, Package, AssetManager와 비동기 로딩을 다룹니다. 필요한 시점에 에셋을 요청하고 로딩 완료 후 사용하는 예제를 만듭니다. 소프트 참조는 에셋 경로를 보관하며, 사용 전에 로딩이 필요할 수 있습니다. 에디터에서 이미 열린 에셋이 결과에 영향을 주지 않도록 독립 실행에서도 비교합니다. [Object Pointers](https://dev.epicgames.com/documentation/en-us/unreal-engine/object-pointers-in-unreal-engine)

로딩이 끝나기 전에 요청 주체가 사라지는 경우, 같은 에셋을 다시 요청하는 경우, 참조를 정리하는 경우를 실험합니다. 각 경우에 필요한 수명 검사와 결과 적용 조건을 정리합니다.

9주차에는 DataAsset·DataTable, FArchive, SaveGame과 저장 버전을 다룹니다. 아이템 데이터를 저장·복원하고, 저장 형식에 필드를 추가한 뒤 이전 데이터를 읽습니다. 누락된 값의 기본값과 변환 규칙을 명시합니다.

완료 기준은 에셋의 로딩 시점과 수명을 설명하고, 저장 데이터의 변경을 처리하는 규칙을 코드와 예제로 보여 주는 것입니다.

## 10~11주차: 이동과 스레드

10주차에는 Enhanced Input, Possession, CharacterMovement와 충돌 처리를 연결합니다. 입력 이벤트에서 시작해 이동 요청, 이동 계산, 위치 변경까지 추적합니다. 실습은 짐 무게에 따라 이동속도가 달라지는 기능으로 한정합니다.

11주차에는 Game·Render·RHI Thread의 역할과 Task, 동기화 기초를 다룹니다. 먼저 일반 데이터만 사용하는 계산을 작업 스레드로 옮기고, 결과를 게임 스레드로 전달합니다. UObject 참조의 수명 보장과 해당 API의 스레드 안전성은 별도로 확인합니다.

실험에는 계산 중 요청 취소와 대상 종료를 포함합니다. 완료 기준은 어느 스레드가 어떤 데이터를 읽고 쓰는지, 결과가 늦게 도착했을 때 적용해도 되는지 설명하는 것입니다.

## 12주차: 프로파일링과 실제 기능 적용

마지막 주에는 실제 프로젝트에서 기능 하나를 선택합니다. 이동속도 계산, 반복되는 상태 조회, 에셋 로딩처럼 앞선 실험과 연결할 수 있는 범위로 정합니다.

Unreal Insights로 실행 구간을 관찰하고, 변경할 대상과 이유를 먼저 기록합니다. 같은 맵·입력·객체 수·빌드 설정에서 변경 전후를 비교합니다. 일부 함수의 CPU 시간 감소는 해당 구간의 결과로 적고 전체 프레임 성능과 구분합니다. [Unreal Insights](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-insights-in-unreal-engine)

결과물에는 구현 코드, 호출 흐름, 객체 수명 설명, 측정 조건과 결과를 남깁니다. 에디터 실행과 패키징 실행의 결과도 구분합니다.

## 엔진 소스를 읽는 방법

엔진 소스는 관찰한 동작을 설명하는 함수와 호출자를 따라 읽습니다. 한 번에 확인할 질문을 하나 정하고, 호출 스택과 관련 데이터가 바뀌는 지점을 함께 기록합니다.

| 질문 | 읽기 시작점 |
| --- | --- |
| 한 프레임에서 엔진과 World는 무엇을 처리하는가? | LaunchEngineLoop.cpp의 FEngineLoop::Tick, GameEngine.cpp의 UGameEngine::Tick, LevelTick.cpp의 UWorld::Tick |
| Actor는 플레이를 어떻게 시작하고 종료하는가? | Actor.cpp의 AActor::BeginPlay, AActor::EndPlay, AActor::Destroy |
| UObject는 어떻게 생성되고 정리되는가? | UObjectGlobals.cpp, GarbageCollection.cpp의 관련 생성·참조 추적 경로 |
| 캐릭터의 이동 계산은 어디서 시작되는가? | CharacterMovementComponent.cpp의 TickComponent, PerformMovement |

위 함수들은 소스를 읽기 위한 시작점입니다. 에디터의 PIE와 독립 실행은 진입 경로가 다를 수 있으므로 실제 실행 모드에서 호출 스택을 확인합니다. 엔진 버전이 바뀌면 파일과 구현 위치도 다시 찾습니다.

## 하루 진행 방식과 기록

하루 2시간은 자료 확인 20분, 구현과 디버깅 60분, 관련 엔진 소스 추적 30분, 기록 10분으로 나눕니다. 첫 두 주에는 엔진 소스 추적 시간을 C++ 호출 로그와 라이브러리 동작 확인에 사용합니다.

실험마다 다음 순서를 반복합니다.

1. 질문 하나를 정합니다. 예를 들어 참조를 제거하면 객체가 언제 정리되는지 묻습니다.
2. 호출 순서와 객체 상태를 먼저 예상합니다.
3. Actor 하나나 컴포넌트 하나처럼 관찰 대상을 작게 만듭니다.
4. 로그와 중단점으로 실제 순서와 상태를 확인합니다.
5. 관련 엔진 구현을 읽고 예상과 달랐던 이유를 찾습니다.
6. 레벨 전환, 객체 종료, 참조 해제 등 조건을 바꾸어 다시 확인합니다.

주차별 기록은 질문, 예상, 예제, 관찰, 관련 함수, 조건을 바꾼 결과로 구성합니다. 로그와 측정 결과를 남기고, 소스에서 읽은 내용과 실제 실행으로 확인한 내용을 구분합니다.

AI는 계획 구성, 개념 설명, 오류 해석과 코드 리뷰에 활용합니다. 매주 핵심 예제 하나는 참고 자료를 닫고 다시 작성하며, 실행 순서와 설계 이유를 직접 설명합니다. 이 계획의 주제 순서와 실험 항목은 Codex와의 대화를 바탕으로 구성했습니다.

## 주차별 완료 기준

각 실험에서 다음 네 질문에 답할 수 있으면 다음 단계로 넘어갑니다.

- 이 코드는 누가 호출합니까?
- 이 객체는 누가 참조하고 언제 정리됩니까?
- 이 작업은 어느 스레드와 실행 단계에서 수행됩니까?
- 이 설계의 비용과 문제를 어떻게 재현하고 측정할 수 있습니까?

전체 진행에서는 작동하는 실험 코드, 호출 흐름 그림, 관찰 기록을 남깁니다. 마지막 주에는 같은 조건의 측정 결과와 실제 기능에 적용한 이유를 더합니다.

## 참고 자료

- [Unity 개발자를 위한 Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-for-unity-developers): 용어와 객체 구조를 비교할 때 참고합니다.
- [C++와 블루프린트의 역할](https://dev.epicgames.com/documentation/en-us/unreal-engine/coding-in-unreal-engine-blueprint-vs-cplusplus): C++ 기반 클래스와 블루프린트 연결 방식을 다룹니다.
- [공식 C++ 게임 제작 예제](https://dev.epicgames.com/documentation/unreal-engine/code-a-firstperson-adventure-game-in-unreal-engine?lang=en-US): 입력·이동·아이템 구현이 필요한 주차에 해당 부분을 참고합니다.

공식 문서는 사용하는 엔진 버전에 맞춰 읽고, 예제의 API와 실제 프로젝트의 동작이 다르면 현재 버전의 구현과 호출 스택을 함께 확인합니다.
