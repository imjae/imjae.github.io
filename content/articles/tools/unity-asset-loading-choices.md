---
title: "직접 참조·Resources·AssetBundle·Addressables 선택하기"
description: "참조, 로드, 인스턴스와 해제 책임을 나누고 네 가지 자원 접근 방식의 선택 조건을 비교합니다. 같은 프리팹을 대상으로 한 예제·실습·풀이를 담았습니다."
slug: "unity-asset-loading-choices"
date: "2023-08-29"
dateBasis: "notion"
updated: "2026-10-23"
topic: "tools"
kind: "note"
tags: ["Unity", "Addressables", "AssetBundle", "Resources"]
draft: false
---

## 로드 API보다 먼저 수명과 배포를 정합니다

<div id="로드-api보다-먼저-수명과-배포를-정한다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[에셋 관리](https://app.notion.com/p/a7922dd7d82444628d80f8575ce3a141), [리소스 시스템](https://app.notion.com/p/736f59c4ec454b7eba591678cb9b27a8), [에셋 번들](https://app.notion.com/p/c1c544d92c454f0a885da23da70dc918), [개발 고려 사항](https://app.notion.com/p/57c308a328ea4ef19ec5650a2674fdde)을 하나의 선택 문제로 정리했습니다. 노션에 적힌 검토 항목은 완료한 마이그레이션 성과로 쓰지 않습니다.

프리팹을 가리키는 참조, 에셋을 준비하는 로드, 장면에 객체를 만드는 Instantiate, 사용을 끝내는 해제는 서로 다른 동작입니다. 로드된 프리팹 하나로 인스턴스를 열 개 만들 수 있습니다. 인스턴스를 하나 지웠다고 프리팹의 모든 참조가 사라지는 것도 아닙니다.

| 방식 | 접근 기준 | 별도 배포 | 관리해야 할 책임 |
| --- | --- | --- | --- |
| 직접 참조 | 직렬화된 객체 참조 | 기본적으로 Player 구성에 따름 | 씬·프리팹 의존성 |
| Resources | Resources 아래 상대 경로 | 해당 자원은 Player에 포함 | 경로·포함량·로드한 참조 |
| AssetBundle | 번들 파일과 에셋 이름 | 가능 | 의존 번들·버전·로드·언로드 |
| Addressables | 주소·GUID·Label 등 키 | 구성에 따라 로컬·원격 | 카탈로그·핸들·빌드·배포 |

어떤 방식이 무조건 빠르다고 결정하지 않습니다. 런타임 검색 비용뿐 아니라 빌드 크기, 최초 다운로드, 패치 단위와 소유권을 함께 봅니다. 노트의 Resources 조회 복잡도 설명을 현재 모든 플랫폼의 보장으로 재사용하지 않았습니다.

## 같은 프리팹을 놓는 코드 비교

다음은 각 API를 보여 주는 독립 구간이며 하나의 함수에 합쳐 동시에 실행하지 않습니다. 첫 두 예제는 MonoBehaviour 안의 필드·메서드입니다.

```csharp
[UnityEngine.SerializeField] UnityEngine.GameObject prefab;
void PlaceDirect()
{
    if (prefab) UnityEngine.Object.Instantiate(prefab);
}
void PlaceResource()
{
    var loaded = UnityEngine.Resources.Load<UnityEngine.GameObject>("Study/Marker");
    if (loaded) UnityEngine.Object.Instantiate(loaded);
}
```

Resources 경로는 예를 들어 `Assets/Resources/Study/Marker.prefab`에서 확장자와 Resources 앞부분을 뺀 값입니다. 포함된 모든 객체를 자동으로 화면에 생성하는 방식은 아닙니다. 직접 참조와 Resources에서 같은 에셋을 중복 관리하면 포함 관계를 별도 조사해야 합니다. [Unity Resources 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/LoadingResourcesatRuntime.html)

번들은 해당 플랫폼에서 미리 빌드한 파일을 전제로 합니다. 파일 로드와 에셋 추출을 분리합니다.

```csharp
var bundle = UnityEngine.AssetBundle.LoadFromFile(bundlePath);
if (!bundle) throw new System.InvalidOperationException("bundle load failed");
var loaded = bundle.LoadAsset<UnityEngine.GameObject>(assetName);
if (!loaded) { bundle.Unload(false); throw new System.InvalidOperationException("asset missing"); }
var instance = UnityEngine.Object.Instantiate(loaded);
// bundle과 instance의 소유자가 사용 종료 순서를 관리한다.
// 종속 번들이 있다면 이를 먼저 준비해야 한다.
```

`Unload(false)`와 `Unload(true)`는 같은 정리가 아닙니다. 특히 살아 있는 인스턴스·재질이 사용하는 에셋을 강제로 제거하면 참조가 깨질 수 있습니다. 이 예제는 의존성 그래프를 자동 처리하지 않습니다.

Addressables는 `InstantiateAsync`로 만든 인스턴스를 해당 작업의 계약에 따라 반환합니다.

```csharp
var handle = UnityEngine.AddressableAssets.Addressables.InstantiateAsync("study-marker");
try
{
    await handle.Task;
    if (handle.Status != UnityEngine.ResourceManagement.AsyncOperations.AsyncOperationStatus.Succeeded)
        throw new System.InvalidOperationException("instance load failed");
    // 여기에서 handle.Result를 사용하고 사용이 끝난 뒤 블록을 벗어난다.
}
finally
{
    if (handle.IsValid())
    {
        if (handle.Status == UnityEngine.ResourceManagement.AsyncOperations.AsyncOperationStatus.Succeeded)
            UnityEngine.AddressableAssets.Addressables.ReleaseInstance(handle);
        else
            UnityEngine.AddressableAssets.Addressables.Release(handle);
    }
}
```

이는 Addressables 1.21 계열의 비-WebGL Task 예입니다. 성공 분기에서는 실제 사용이 끝난 뒤 ReleaseInstance합니다. 사용 예를 짧게 보이려고 여기서는 곧바로 반환했습니다. LoadAssetAsync 후 일반 Instantiate를 사용하는 경우와 소유권 규칙이 다릅니다. [메모리 관리 문서](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html)

## 실습과 풀이

1. ‘항상 쓰는 시작 UI’와 ‘주마다 교체하는 큰 스테이지’를 비교합니다. **풀이:** 시작 UI는 직접 참조로 단순하게 구성할 수 있고, 원격 갱신이 필요한 스테이지는 별도 콘텐츠 배포 구조를 검토합니다. Addressables를 쓴다는 이유만으로 모든 자원이 원격화되지는 않습니다.
2. 에셋 하나를 두 번 로드하고 인스턴스 세 개를 만듭니다. **풀이:** 로드 작업과 인스턴스마다 소유자를 표로 적습니다. 일반 Instantiate는 Addressables 로드 참조를 자동으로 추가하지 않으므로 마지막 인스턴스 사용 전 에셋 핸들을 해제하지 않습니다.
3. 네 방식을 비교 측정한다면 조건은 무엇인가요? **풀이:** 같은 플랫폼·프리팹·의존성·캐시 상태를 사용합니다. 다운로드·디스크 읽기·역직렬화·인스턴스 생성 시간을 나누며 콜드/웜 결과를 섞지 않습니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [GLFW·GLAD·컨텍스트와 첫 렌더 루프 만들기](/writing/opengl-context-render-loop/)
