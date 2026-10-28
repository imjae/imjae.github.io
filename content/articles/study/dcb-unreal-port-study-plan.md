---
title: "DCB 언리얼 전환: 기능별 구현과 12주 계획"
description: "DCB의 채집·운반·전투·귀환을 이어 가며 Enhanced Input, 애니메이션, AI, UMG, 저장, Niagara와 패키징을 적용하는 순서와 완료 기준을 정합니다."
slug: "dcb-unreal-port-study-plan"
date: "2026-10-29"
dateBasis: "authored"
topic: "study"
kind: "note"
project: "dcb"
series: "dcb-unreal-port"
order: 1
tags: ["Unreal Engine", "DCB", "C++", "Blueprint", "Migration"]
draft: false
---

## 먼저 이어 볼 게임 구간

DCB의 언리얼 전환은 **출발 → 이동 → 채집 → 지게에 적재 → 적과 전투 → 귀환 → 저장 → 재출발**이 이어지는 작은 구간부터 진행합니다. 각 작업에서 필요한 엔진 기능을 익히고, 같은 구간에 적용한 뒤 동작을 비교합니다.

예를 들어 입력을 다룰 때는 짐을 든 상태의 질주와 인벤토리 입력을 고칩니다. 애니메이션을 다룰 때는 운반 자세와 공격 타격 시점을 연결합니다. 저장을 다룰 때는 귀환 성공과 사망 이후에 어떤 물건이 남는지 확인합니다. 매주 게임에서 달라지는 동작을 하나씩 남기는 것이 기준입니다.

첫 범위는 플레이어 한 명, 아이템 한 종류, 적 한 종류, 낮은 턱 한 종류와 짧은 이동 동선입니다. 기존 리소스와 모션을 사용하며, 전체 게임의 모든 기능을 12주 안에 옮긴다는 일정으로 잡지 않습니다.

[주차별 글 목록](/series/dcb-unreal-port/)에서 각 작업을 이어 갑니다. 현재 공개된 1주차 글은 실행·관찰 절차이며, 글의 공개 여부는 해당 기능의 구현 완료를 뜻하지 않습니다.

## 현재 전환본에서 출발하는 위치

2026년 10월 29일 기준 전환본에는 기본 입력·이동, 지게 적재와 스태미너, 단순 공격과 채집, 귀환·저장 흐름이 있습니다. UMG 레이아웃과 일부 동작, 기존 모션과 Niagara 효과도 연결되어 있습니다. 이제 각 기능의 세부 규칙과 표현을 언리얼의 실행 구조에 맞게 다듬습니다.

| 현재 출발점 | 다음에 다룰 문제 | 연결할 엔진 기능 |
| --- | --- | --- |
| 기본 이동과 운반 상태 | 입력 종료, UI를 열 때의 조작, 속도와 가속의 관계 | Enhanced Input, CharacterMovement, SpringArm |
| 클립 재생과 변환된 Animator 데이터 | 이동 블렌딩, 운반 자세, 전이와 중단 | Animation Blueprint, Blend Space, Montage |
| 입력 직후의 기본 공격 판정 | 실제 타격 구간, 중복 피해, 공격 취소 | Anim Notify State, 충돌 Query |
| 적의 단순 방향 추적 | 장애물 우회, 시야 상실과 복귀 | AIController, NavMesh, AI Perception, StateTree |
| 인벤토리 선택·내려놓기·재수거 | 실제 아이템 표현과 UI 포커스 | DataAsset, UMG, Delegate |
| 캠프 위치로의 복귀와 별도 저장 슬롯 | 로비·필드 전환, 앱 재시작, 저장 버전 | GameInstanceSubsystem, SaveGame, 레벨 전환 |
| 변환된 레벨·재질·파티클 | 충돌, 지면 반응, 외형과 실행 비용 | Landscape, Physical Material, Niagara, Unreal Insights |

변환된 에셋과 기본 동작을 기준으로 삼되, 기존 에셋을 일괄 교체하지 않습니다. 작은 실험 맵과 파생 에셋에서 변경하고 비교한 뒤, 동작이 맞는 부분을 실제 구간에 반영합니다.

## 기간과 한 주의 결과물

하루 2시간, 주 5일을 가정한 **12주·120시간의 첫 진행안**입니다. 개인 일정에 맞춰 시작하며, 한 주의 완료 기준을 만족하지 못하면 다음 주에 이어서 진행합니다. 특히 애니메이션·턱 이동·레벨 작업은 모델과 모션 상태에 따라 기간을 늘릴 수 있습니다.

하루는 엔진 문서와 현재 동작 확인 20분, 직접 수정과 실행 70분, 호출 흐름 확인 20분, 기록 10분으로 나눕니다. 매주 다음 자료를 같은 글에 모읍니다.

- 바꿀 게임 동작과 변경 전 재현 방법
- 해당 동작을 맡는 C++·블루프린트·에셋의 연결
- 직접 바꾼 값이나 로직과 선택한 이유
- 같은 입력으로 비교한 결과와 실패 조건
- 다음 작업으로 넘길 범위

AI가 제안한 코드나 그래프를 사용했을 때는 수정한 부분과 직접 확인한 동작을 구분합니다. 핵심 흐름 하나는 참고 자료를 닫고 다시 설명하거나 구성해 봅니다. 기능이 실행되는 것과 그 동작을 이해하는 것을 함께 확인합니다.

## 12주 진행표

| 주차 | DCB에서 할 작업 | 사용할 엔진 기능 | 다음 단계로 넘어가는 기준 |
| --- | --- | --- | --- |
| 1 | 현재 실행 구간을 열고 플레이어·HUD·저장 연결을 찾습니다. | World Settings, GameMode, Controller, Character, Component | 생성·조종·UI·저장의 담당 객체를 설명하고 실험 맵에서 같은 순서로 재현합니다. |
| 2 | 짐 무게·질주·스태미너와 UI 입력 전환을 정리합니다. | Enhanced Input, CharacterMovement, SpringArm | 입력을 놓거나 UI를 여닫은 뒤 이동이 남지 않고, 무게와 스태미너에 따른 속도 변화를 설명합니다. |
| 3 | 아이템 한 종류의 ID·무게·아이콘·메시를 연결합니다. | DataAsset, 소프트 참조, 비동기 로딩, 쿠킹 | 내려놓은 물건에 해당 메시가 나오고, 누락·지연 로딩을 처리하며 첫 Windows 패키지에서 에셋을 찾습니다. |
| 4 | 맨손과 운반의 대기·걷기·달리기를 연결합니다. | Animation Blueprint, Blend Space, 상태 전이 | 속도·방향·운반 전환을 반복하며 자세 끊김과 발 미끄러짐을 같은 조건에서 비교합니다. |
| 5 | 공격 한 종류의 타격 구간을 모션에 맞춥니다. | Montage, Notify State, Sweep/Overlap | 타격 구간에만 피해가 들어가고, 대상별 중복 피해와 피격·사망 중단 후 잔여 판정이 없습니다. |
| 6 | 적 한 종류의 탐지·추적·공격·복귀를 만듭니다. | AIController, NavMesh, AI Perception, StateTree | 벽을 우회하고, 시야 상실·경로 실패·대상 사망에서 정해 둔 상태로 돌아갑니다. |
| 7 | 채집·아이템 선택·내려놓기·재수거를 UI와 연결합니다. | Interface, UMG, Delegate, 입력 포커스 | 수량·무게·화면이 함께 바뀌고, 중복 수거와 UI 뒤의 공격을 막습니다. |
| 8 | 출정·성공 귀환·사망·재출정을 두 레벨로 연결합니다. | GameInstanceSubsystem, SaveGame, 레벨 전환 | 앱을 다시 실행해도 성공 시 보관함은 유지되고 실패 시 적재물 처리 규칙이 맞습니다. |
| 9 | 낮은 턱 한 종류의 진입·넘기·착지를 만듭니다. | Trace, CharacterMovement, Root Motion, IK | 정면·사선·과도한 높이·착지 공간 부족에서 성공과 거절 조건을 재현합니다. |
| 10 | 타격·채집 효과와 두 지면의 발소리를 맞춥니다. | Niagara, Material Instance, Physical Material | 효과의 위치·방향·수명과 표면 반응을 확인하고 동시 발생 비용을 기록합니다. |
| 11 | 기존 장면의 짧은 동선에 앞선 기능을 옮깁니다. | Landscape, Collision, 스트리밍, 조명 | 동선의 낙하·끼임·로딩 경계와 채집·적 배치 문제를 해결합니다. |
| 12 | 같은 구간을 실행 파일에서 반복하고 병목 하나를 줄입니다. | 패키징, Unreal Insights, CPU/GPU 분석 | 에디터 없이 새 출정·귀환·재시작을 수행하고 같은 조건의 변경 전후를 설명합니다. |

## 1~3주차: 실행 구조와 데이터를 먼저 연결합니다

첫 주는 [첫 실행 구간과 게임 프레임워크](/writing/dcb-unreal-first-playable-framework/)의 순서를 따릅니다. 현재 시작 맵, 기능을 확인하는 작은 맵, 기존 장면을 불러오는 맵의 역할을 구분합니다. 플레이어를 누가 만들고 누가 조종하는지 찾은 뒤, HUD 생성과 저장 데이터의 수명까지 연결합니다.

둘째 주에는 키 입력을 엔진의 이동으로 전달하는 경로를 다룹니다. 먼저 현재 속도·가속·감속·카메라 값을 적습니다. 그다음 빈 지게와 적재 상태, 스태미너 충분·고갈 상태를 같은 거리에서 비교합니다. 질주 키를 누른 채 인벤토리를 열었다가 닫는 경우도 포함합니다. Input Action과 Mapping Context는 행동과 입력 구성을 나누는 도구로 사용합니다. [Enhanced Input](https://dev.epicgames.com/documentation/en-us/unreal-engine/enhanced-input-in-unreal-engine)

셋째 주에는 임시 물체로 표현된 내려놓기 기능을 아이템 한 종류의 실제 메시와 연결합니다. 원본 식별자와 언리얼 에셋 참조를 연결하고, 로딩 완료 전에 물체가 사라지는 경우와 참조가 잘못된 경우를 다룹니다. 처음부터 모든 데이터를 Asset Manager에 넣기보다, 소프트 참조 한 건의 요청·완료·해제를 이해한 뒤 관리 범위를 정합니다. [Asset Management](https://dev.epicgames.com/documentation/unreal-engine/asset-management-in-unreal-engine)

패키징 문제를 마지막 주까지 미루지 않도록 이때 작은 맵으로 첫 Windows 패키지를 만듭니다. 에디터에서 보이던 아이콘·메시·데이터가 실행 파일에도 들어 있는지 확인하고, 실패했다면 맵 포함과 참조 경로부터 해결합니다.

## 4~6주차: 애니메이션·전투·AI를 한 종류씩 바꿉니다

넷째 주에는 기존 클립을 사용하는 Animation Blueprint를 만듭니다. 속도·이동 방향·운반 여부를 입력으로 정하고, 대기·걷기·달리기를 연결합니다. 현재의 직접 클립 재생과 새 AnimGraph가 동시에 같은 메시를 제어하지 않도록 실행 경로를 하나로 정합니다. Skeleton 호환성과 클립의 루트 이동을 먼저 살핀 뒤, 문제가 있는 클립만 별도로 다룹니다. [Animation Blueprints](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-blueprints-in-unreal-engine)

다섯째 주에는 공격 한 종류를 Montage로 재생하고 Notify State로 타격 구간을 표시합니다. 판정 활성화·피해 적용·종료 처리를 구분합니다. 피격이나 사망으로 재생이 끊겨도 판정과 입력 제한이 남지 않게 합니다. 무기별 콤보·패링·가드 전체는 이후 확장으로 둡니다. [Animation Montage](https://dev.epicgames.com/documentation/unreal-engine/animation-montage-in-unreal-engine), [Animation Notifies](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-notifies-in-unreal-engine)

여섯째 주에는 적 한 종류를 대상으로 탐지·추적·공격·복귀 상태를 작성합니다. NavMesh 위의 경로 이동과 행동 선택을 구분하고, 현재 방향 추적을 경로 요청으로 바꿉니다. StateTree를 우선 후보로 사용하되, 현재 플러그인이 켜져 있다는 사실을 실제 AI 구현 완료로 보지 않습니다. Behavior Tree는 같은 행동을 표현하는 방법을 비교할 때 참고하며 두 구조를 동시에 유지하지 않습니다. [StateTree](https://dev.epicgames.com/documentation/en-us/unreal-engine/state-tree-in-unreal-engine), [Behavior Trees](https://dev.epicgames.com/documentation/unreal-engine/behavior-trees-in-unreal-engine)

## 7~8주차: UI와 저장으로 한 차례의 출정을 마칩니다

일곱째 주에는 기존 UMG에서 아이템 선택·내려놓기·재수거 흐름을 이어 갑니다. 게임 데이터가 바뀌는 시점과 UI 갱신 시점을 정하고, 위젯을 닫거나 다시 만들 때 이벤트 연결이 중복되지 않게 합니다. 마우스 커서·포커스·이동·공격 입력을 함께 확인합니다. CommonUI 도입은 화면 전환이나 여러 입력 장치 처리가 필요해지는 시점에 판단합니다.

여덟째 주에는 작은 출발 레벨과 필드 레벨을 연결합니다. 레벨을 떠나도 유지할 상태는 GameInstanceSubsystem에, 디스크에 보관할 값은 SaveGame에 둡니다. 레벨 Actor 자체를 저장 대상으로 삼기보다 아이템 ID·수량·진행 상태를 저장하고 재구성합니다. [Saving and Loading Your Game](https://dev.epicgames.com/documentation/unreal-engine/saving-and-loading-your-game-in-unreal-engine?lang=en-US)

성공 귀환·사망·새 출정·앱 종료 뒤 재실행을 각각 확인합니다. 저장 파일이 없는 최초 실행과 이전 버전 데이터의 기본값도 정합니다. 이 단계의 기준은 언리얼 전환본의 별도 슬롯이며 Unity 저장 파일 호환은 이후 별도 작업으로 둡니다.

## 9~10주차: 턱 이동과 효과를 게임 조건에 맞춥니다

아홉째 주에는 자동으로 걸어 올라가는 낮은 단차와 전용 모션이 필요한 턱을 구분합니다. 먼저 높이·전방 공간·착지 공간을 Trace로 표시합니다. 그다음 턱 한 종류에 진입·이동·착지를 연결하고, 손발 접촉은 IK로 다룹니다.

Motion Warping은 모션의 루트 이동을 목표 위치에 맞추는 후보입니다. 사용할 클립에 유효한 Root Motion이 있는지 먼저 확인합니다. 없으면 기본 이동과 접지부터 완성하고, 루트 이동을 준비하는 일을 별도 과제로 남깁니다. 손발 IK와 캐릭터 전체 이동 보정은 각각 비교합니다. [Motion Warping](https://dev.epicgames.com/documentation/en-us/unreal-engine/motion-warping-in-unreal-engine)

열째 주에는 변환된 효과 중 타격과 채집 두 종류를 고릅니다. Niagara의 발생 위치·회전·수명·색을 조정하고, Material Instance에서 바꿀 값을 구분합니다. 지면 두 종류에는 Physical Material을 연결해 발소리나 접촉 효과를 선택합니다. 같은 위치에서 효과 하나와 여러 개를 발생시키며 비용을 비교합니다. [Measuring Performance in Niagara](https://dev.epicgames.com/documentation/en-us/unreal-engine/measuring-performance-in-niagara)

## 11~12주차: 기존 장면과 실행 파일에서 확인합니다

열한째 주에는 기존 장면 전체 중 짧은 동선을 고릅니다. Landscape의 높이·충돌, 메시 충돌, 스트리밍 경계, 노출·조명을 확인합니다. 원본 장면을 기준으로 유지하고 별도 레벨에서 플레이어·적·채집 지점을 연결합니다. World Partition 전환이나 대규모 지형 재구성은 이 동선에 꼭 필요한 경우에만 범위를 다시 정합니다.

열두째 주에는 Windows 실행 파일에서 출발부터 귀환·저장·재실행까지 반복합니다. 빌드는 실행 코드를 만들고 쿠킹은 대상 플랫폼에 사용할 콘텐츠를 준비하므로, C++ 컴파일과 별도로 확인합니다. [Packaging Unreal Engine Projects](https://dev.epicgames.com/documentation/unreal-engine/packaging-your-project)

성능 비교는 같은 맵·카메라·해상도·그래픽 설정·적 수·입력 순서를 고정합니다. 로딩·AI·애니메이션·VFX 중 실제로 비용이 큰 구간 하나를 고르고, CPU와 GPU 중 어느 쪽의 문제인지 확인한 뒤 수정합니다. 개선한 함수의 시간과 전체 프레임 시간을 구분해 적습니다.

## 기존 C++ 과정과 함께 읽는 순서

[언리얼 C++과 엔진 구조](/series/unreal-cpp-engine/)는 이식 중 막힌 개념을 다시 확인하는 자료로 사용합니다. 12주를 모두 끝낸 뒤 이식을 시작할 필요는 없습니다.

| 이식 중 생긴 질문 | 연결할 기존 글 |
| --- | --- |
| 클래스와 헤더를 추가했는데 왜 빌드·링크가 실패합니까? | [빌드와 모듈](/writing/unreal-build-modules/) |
| 블루프린트 기본값과 레벨 인스턴스 값은 왜 다릅니까? | [UObject와 리플렉션](/writing/unreal-uobject-reflection/) |
| 레벨을 떠난 뒤 위젯·Actor 참조와 콜백은 어떻게 다룹니까? | [객체 수명과 GC](/writing/unreal-object-lifetime-gc/) |
| 아이템 데이터를 복사하거나 포인터로 보관해도 됩니까? | [C++ 객체와 메모리](/writing/cpp-objects-memory-lifetime/), [코드 구조와 컨테이너](/writing/cpp-code-structure-containers/) |

첫 진행 이후에는 무기별 콤보·가드·패링, 높은 등반·SideStep, 지게와 짐의 물리 표현, 군집 전투, 상점·제작·퀘스트, 물·불의 복합 표현을 별도 과정으로 확장합니다. Gameplay Ability System이나 Motion Matching도 해당 요구사항과 데이터가 준비되었을 때 적용 여부를 결정합니다.

이 계획은 DCB 전환본의 현재 구조와 남은 기능을 바탕으로 Codex와 함께 구성했습니다. 기존 모델·모션·텍스처를 재사용하며, 이후 글에는 새로 작성한 로직과 AI가 보조한 범위를 해당 작업에 맞게 기록합니다.
