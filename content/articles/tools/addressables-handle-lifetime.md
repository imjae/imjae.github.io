---
title: "Addressables 로드 핸들의 수명과 해제 책임"
description: "로드 작업의 소유자를 정하고 성공·실패·중복 로드·늦은 완료를 구분한다. 핸들 복사와 Acquire, 일반 Instantiate의 차이를 실습과 풀이로 설명한다."
slug: "addressables-handle-lifetime"
date: "2023-11-08"
dateBasis: "notion"
updated: "2026-10-18"
topic: "tools"
kind: "note"
tags: ["Unity", "Addressables", "Lifetime"]
draft: false
---

## Release가 호출됐다는 것만으로 수명이 맞지는 않는다

[TIP](https://app.notion.com/p/8196f0c10b5f4eeb87e032069ba1a1ea)의 짧은 참조 카운트 메모와 [개발 고려 사항](https://app.notion.com/p/57c308a328ea4ef19ec5650a2674fdde)을 출발점으로 소유권 예제를 새로 만들었다. 원문만으로 실제 프로젝트의 누수를 해결했다고 설명하지 않는다.

핸들은 비동기 작업을 가리킨다. C# 구조체 핸들을 다른 변수에 복사했다고 로드 참조를 하나 더 얻는 것은 아니다. 별도 Load나 명시적인 Acquire로 얻은 소유권을 각각 대응해 해제한다. 반대로 두 곳에서 같은 획득분을 Release하면 중복 해제가 된다.

| 상황 | 정해야 할 책임 |
| --- | --- |
| LoadAssetAsync 성공 | 사용이 끝난 소유자가 Release |
| 단일 LoadAssetAsync 실패 | 실패한 작업 핸들도 정리 |
| 일반 Instantiate | 인스턴스가 에셋 의존성을 쓰는 동안 로드 참조 유지 |
| InstantiateAsync 성공 | 해당 인스턴스를 ReleaseInstance로 반환 |
| owner 소멸 후 완료 | 결과를 사용하지 않고 획득한 참조는 정리 |

Release는 참조 카운트를 낮추는 일이다. 번들에 다른 살아 있는 참조가 있으면 메모리가 바로 내려가지 않을 수 있다. [Addressables 1.21 메모리 관리](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/MemoryManagement.html)

## 사용 구간을 함수 안에 묶기

다음은 Addressables 1.21 계열, Unity 메인 스레드에서 호출하는 Task 기반 도우미다. WebGL의 Task 지원은 이 예제의 전제에서 제외한다. `use`가 반환하는 Task는 에셋 사용 종료를 뜻해야 한다.

```csharp
using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public static class AssetUse
{
    public static async Task WithPrefab(string key, Func<GameObject, Task> use)
    {
        if (string.IsNullOrWhiteSpace(key)) throw new ArgumentException(nameof(key));
        if (use == null) throw new ArgumentNullException(nameof(use));
        var handle = Addressables.LoadAssetAsync<GameObject>(key);
        try
        {
            await handle.Task;
            if (handle.Status != AsyncOperationStatus.Succeeded)
                throw new InvalidOperationException("load failed", handle.OperationException);
            await use(handle.Result);
        }
        finally
        {
            if (handle.IsValid()) Addressables.Release(handle);
        }
    }
}
```

이 함수는 에셋의 소유권을 콜백 밖으로 넘기지 않는 계약이다. 콜백이 만든 인스턴스나 Renderer가 에셋을 계속 사용하면서 완료를 반환하면 너무 일찍 해제한다. 일반 `Destroy`는 지연되므로 같은 줄에서 Destroy 후 곧바로 해제해 안전하다고 가정하지 않는다. 인스턴스 수명이 길면 명시적인 lease 객체나 InstantiateAsync 소유자를 설계한다.

try/finally는 성공·실패·사용 중 예외에서 같은 획득분을 정리한다. 이 코드에는 다운로드 중단, owner 취소와 자동 인스턴스 정리가 없다. CancellationToken을 추가해도 Addressables 로드 자체가 자동 취소된다고 설명하면 안 된다. [LoadAssetAsync 문서](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/load-assets.html)

## 실습과 풀이

1. 같은 키를 두 번 Load한다. **풀이:** 호출마다 얻은 참조를 각 소유자가 정리한다. 핸들의 내부 작업이 공유되는 것과 소유권 획득 횟수는 구분한다. 구조체 대입으로 복사한 변수까지 추가 소유자로 세지 않는다.
2. 잘못된 키와 use 내부 예외를 넣는다. **풀이:** 실패 경로에서도 finally에 도달해야 한다. 예외가 없다는 이유로 성공이라고 보지 말고 Status와 오류도 확인한다. 이미 다른 곳에서 해제한 핸들을 공유하는 구조는 예제 계약 위반이다.
3. 장면을 떠난 후 로드가 완료된다. **풀이:** 요청에 owner 세대 번호나 취소 상태를 붙이고 오래된 결과는 표시하지 않는다. 결과를 버려도 작업 소유권 정리는 필요하다. 실제 씬 종료 테스트에서 지연 완료·성공·실패를 모두 시험한다.

## 확인한 범위

원문과 문서에 근거해 수명 규칙과 새 코드를 구성했다. Unity 컴파일·핸들 진단·실제 번들 메모리·씬 종료·누수 관찰은 미검증이다. 글의 finally 구조 검토는 리소스 수명 전체의 실행 증거가 아니다. AI를 설명과 예제 작성에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [AssetBundle 구조와 LZMA·LZ4의 로딩 비용 비교](/writing/assetbundle-compression-costs/)
