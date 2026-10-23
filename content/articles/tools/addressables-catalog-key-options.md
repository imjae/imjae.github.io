---
title: "Addressables 카탈로그 옵션을 줄이기 전에 확인할 것"
description: "주소·GUID·Label 사용 경로와 내부 이름·카탈로그 압축을 분리합니다. 옵션 변경으로 로드가 깨지는 조건을 예제·실습·풀이로 확인합니다."
slug: "addressables-catalog-key-options"
date: "2023-09-11"
dateBasis: "notion"
updated: "2026-10-23"
topic: "tools"
kind: "note"
tags: ["Unity", "Addressables", "Catalog"]
draft: false
---

## 카탈로그에서 문자열을 빼도 로드 계약은 남아야 합니다

<div id="카탈로그에서-문자열을-빼도-로드-계약은-남아야-한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[어드레서블 관리 팁](https://app.notion.com/p/eb44c410f42b451f95252113acb3cb4f)의 용량 설정을 실제 키 사용과 연결해 정리했습니다. 카탈로그는 키를 자원 위치와 의존성 등에 연결하는 메타데이터입니다. 카탈로그 파일 크기, 파싱 시간, 전체 번들 다운로드 크기는 서로 다른 값입니다.

Addressables 1.21 문서를 기준으로 설명합니다. 현재 프로젝트가 다른 버전이면 해당 패키지 문서와 메뉴를 먼저 확인합니다. 원문의 ‘켜면 로드 시간이 늘어난다’ 같은 문장은 측정 조건 없이 고정 수치나 보편적인 성능 결과로 옮기지 않았습니다.

| 옵션 | 영향을 받는 호출 예 | 변경 전 확인 |
| --- | --- | --- |
| Include Addresses | LoadAssetAsync("marker") | 문자열 주소를 사용하는 코드·데이터 |
| Include GUIDs | AssetReference | Inspector 참조와 GUID 키 |
| Include Labels | LoadAssetsAsync("stage-a") | Label 조회와 다운로드 의존성 |
| Internal Asset Naming | 번들 내부 식별 | 업데이트 기준 상태·ID 일관성 |
| Compress Local Catalog | 로컬 카탈로그 보관 형태 | 파일 크기와 초기화 시간 |

AssetReference를 쓰는 그룹에서 GUID를 빼면 필요한 조회 키가 사라질 수 있습니다. [콘텐츠 패킹·로딩 스키마](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/ContentPackingAndLoadingSchema.html), [AssetReference 문서](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/asset-reference-intro.html)

## 세 가지 접근 경로의 예

같은 marker를 주소·AssetReference·Label 세 경로로 사용하는 가상의 실습 장면을 만듭니다. 아래는 각각의 로드 구간이며 실제 게임의 키가 아닙니다.

```csharp
var byAddress = Addressables.LoadAssetAsync<GameObject>("study-marker");
var byReference = Addressables.LoadAssetAsync<GameObject>(markerReference);
var byLabel = Addressables.LoadAssetsAsync<GameObject>("study-markers", null);
```

Addressables·UnityEngine 네임스페이스와 AssetReference인 markerReference가 필요합니다. 각 작업은 완료 상태를 검사하고 사용 종료 시 해당 획득분을 Release합니다. 이 세 줄 자체는 핸들 수명을 구현한 완성 프로그램이 아닙니다. 수명은 [핸들 글](/writing/addressables-handle-lifetime/)에서 다룹니다.

## 설정 한 개씩 비교하기

1. 기준 카탈로그와 content state, 패키지·Player 버전을 보관합니다.
2. 새 실습 빌드에서 한 옵션만 변경합니다.
3. 주소·AssetReference·Label 경로의 성공·실패를 각각 기록합니다.
4. 빌드한 카탈로그 크기와 초기화 구간을 같은 캐시 조건에서 비교합니다.
5. 원래 설정으로 되돌린 뒤 같은 검사를 반복합니다.

Built In Data의 Resources·Build Settings Scenes 포함을 끄는 것은 카탈로그의 조회 항목을 줄이는 설정입니다. 해당 에셋이 Player에서 자동 제거되는 뜻은 아닙니다. 직접 참조·Resources·씬의 빌드 포함 여부는 별도로 조사합니다. [콘텐츠 카탈로그 문서](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/build-content-catalogs.html)

Internal Asset Naming 변경은 번들 해시·CRC와 콘텐츠 상태 일관성에 영향을 줄 수 있습니다. 이미 배포한 Player의 업데이트 과정에 용량만 보고 적용하지 않습니다. 새 전체 빌드와 이전 콘텐츠 업데이트의 계약을 구분합니다.

## 실습과 풀이

1. 주소 로드가 없는 그룹에서 Include Addresses만 끕니다. **풀이:** GUID와 Label 경로가 유지되는지 확인합니다. 빌드 성공만으로 런타임 키가 유효하다고 결론 내리지 않습니다.
2. AssetReference가 있는 상태에서 GUID 옵션을 끕니다. **풀이:** 실패를 재현할 대상입니다. 원복 후 성공을 대조하고 필요한 키를 보존합니다. ‘문자열이 길다’는 이유만으로 GUID를 제거하지 않습니다.
3. 압축 후 파일이 작아졌습니다. 성공인가요? **풀이:** 파일 크기는 한 지표입니다. 초기화·메모리·조회 성공을 함께 기록합니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [스크립트와 Addressables 콘텐츠의 버전 호환성](/writing/addressables-player-content-compatibility/)
