---
title: "Spine 마스크의 머티리얼 복제로 배칭이 나뉜 문제"
description: "Spine 심볼의 마스크용 재질을 공유하도록 바꾼 노션 기록을 정리한다. 배칭·스텐실·재질 참조를 설명하고 교체 예제와 실습·풀이, 아직 재현하지 않은 항목을 구분한다."
slug: "spine-mask-material-batching"
date: "2024-05-02"
dateBasis: "notion"
updated: "2026-10-18"
topic: "graphics"
kind: "case-study"
tags: ["Unity", "Spine", "SpriteMask", "Material", "Batching"]
draft: false
---

## 같은 아틀라스를 썼는데 심볼마다 그리기가 나뉘었다

Spine으로 만든 여러 심볼에 같은 아틀라스와 머티리얼을 사용했다. 그런데 마스크를 적용한 심볼들이 따로 그려지는 문제가 있었다. [당시 노션 기록](https://app.notion.com/p/5ee92b3fd3044af2b3d6fa6ad875a07f)은 원인을 **런타임에 생성되는 마스크용 머티리얼 복사본**으로 정리했다.

기록에 남긴 해결 방법은 마스크가 설정된 머티리얼을 미리 준비하고, 여러 심볼이 그 머티리얼을 공유하게 하는 것이었다. 각 Spine의 자동 `Mask Interaction`을 `None`으로 돌린 뒤 `CustomMaterialOverride`로 원본과 대체 머티리얼을 연결했다.

이 글은 그 작업 기록을 바탕으로 원리와 재현 방법을 설명한다. 당시의 Unity·Spine 버전, 원본 `SpineOverrideMaterials` 구현, 전후 Frame Debugger 캡처와 측정 수치는 확보하지 못했다. 따라서 설정 방법이 기록돼 있다는 사실과, 현재 환경에서 같은 결과를 확인했다는 주장은 구분한다. DCB의 현재 기능을 검증한 글도 아니다.

## 준비할 환경과 글의 범위

C#의 클래스·메서드·Dictionary를 읽을 수 있다고 가정한다. Dictionary의 키와 값이 낯설다면 [자료구조 선택하기](/writing/data-structures-collections/)의 해당 절을 먼저 읽으면 된다.

| 구분 | 이 글에서 사용할 조건 |
| --- | --- |
| Spine 표시 방식 | `SkeletonRenderer` 계열과 `MeshRenderer` |
| 마스크 | Unity `SpriteMask` |
| 재현 장면 | 한 페이지 아틀라스, 같은 블렌드 모드의 작은 스켈레톤 여러 개 |
| Unity 예제의 API 기준 | spine-unity 4.2 공개 소스 |
| 파이프라인 기준 | Built-in과 이에 맞는 Spine 셰이더를 사용하는 예제 장면 |
| 별도 확인할 환경 | URP·HDRP, 여러 아틀라스 페이지, 다른 블렌드 모드와 렌더 분리 |

여기서 다루는 `SpriteMask`와 Canvas UI의 `Mask`·`RectMask2D`는 적용 경로가 다르다. `SkeletonGraphic`은 `CanvasRenderer`를 사용하는 UI 컴포넌트이므로 아래의 `MeshRenderer`용 재질과 코드를 그대로 적용하지 않는다. [Spine 4.2 컴포넌트 문서](https://esotericsoftware.com/spine-unity-main-components-4.2#SkeletonGraphic-Component)

버전도 고정해서 읽어야 한다. 4.3에서는 애니메이션과 렌더 컴포넌트가 분리됐고, `maskInteraction`이 `MaskInteraction` 프로퍼티로 바뀌었다. 아래 코드를 4.3에서 그대로 컴파일할 수 있다고 보장하지 않는다. 현재 프로젝트에 적용할 때는 설치 버전과 공식 변경 문서를 먼저 맞춘다. [Spine 4.3 이전 안내](https://github.com/EsotericSoftware/spine-runtimes/blob/4.3/spine-unity/Assets/Spine/Documentation/4.3-split-component-upgrade-guide.md)

## 배칭을 이해하는 데 필요한 개념

### 아틀라스·머티리얼·드로우콜은 다른 대상이다

**아틀라스**는 여러 그림을 한 텍스처에 모은 것이다. **머티리얼**은 셰이더와 텍스처, 블렌딩·스텐실 등의 설정을 연결한다. **드로우콜**은 정점과 인덱스, 그리기 상태를 사용해 GPU에 그리기를 요청하는 명령이다.

같은 텍스처를 읽는다고 해서 모든 오브젝트가 한 번에 그려지는 것은 아니다. 다음 두 재질은 같은 그림을 읽어도 서로 다른 객체다.

~~~text
Material A → Shader S, Texture T, 마스크 설정 X
Material B → Shader S, Texture T, 마스크 설정 X

속성 값이 같음
≠
같은 Material 객체를 참조함
~~~

이 사례에서 없애려는 것은 같은 설정을 가진 불필요한 재질 복사본이다. 재질을 공유한 뒤에도 셰이더 패스, 정렬, 메시 크기와 배칭 방식 등의 조건을 만족해야 실제 드로우콜이 합쳐진다. 특히 투명 메시의 뒤에서 앞으로 그리는 순서는 배칭을 제한할 수 있다. [Unity 드로우콜 배칭](https://docs.unity3d.com/6000.0/Documentation/Manual/DrawCallBatching.html)

### 스켈레톤 하나 안에서도 재질 전환이 생긴다

부착물의 그리기 순서가 다음과 같다고 하자.

~~~text
A 재질 → A 재질 → B 재질 → A 재질
~~~

연속된 A는 묶을 수 있지만 B 뒤의 A를 앞으로 옮기면 겹침 결과가 달라질 수 있다. Spine에서는 이와 같은 순서가 A·B·A 재질 구간과 서브메시를 만들 수 있다. 여러 심볼 사이에서 재질을 공유하는 문제와, 한 스켈레톤 내부의 재질 전환 문제를 나눠 봐야 한다. [Spine 재질 전환 설명](https://esotericsoftware.com/spine-unity-rendering#Material-Switching-and-Draw-Calls)

따라서 아틀라스 페이지가 두 개라는 이유만으로 그리기 구간도 두 개라고 계산하지 않는다. 블렌드 모드가 달라져 별도 재질이 필요한 경우도 함께 확인한다.

### SRP Batcher와 드로우콜 합치기를 구분한다

SRP Batcher는 같은 셰이더 변형을 사용하는 그리기의 CPU 준비 비용을 줄이는 경로다. 여러 드로우콜이 하나의 그리기 명령으로 합쳐졌다는 뜻은 아니다. 이 글의 공유 재질 실습을 URP·HDRP에서 시험한다면, SRP 배치 수와 실제 그리기 이벤트 수를 따로 기록해야 한다. [Unity SRP Batcher](https://docs.unity3d.com/6000.0/Documentation/Manual/SRPBatcher.html)

## 마스크가 머티리얼과 연결되는 방식

### 스텐실은 픽셀을 그릴 조건을 정한다

스텐실 버퍼는 화면 위치마다 작은 정수 값을 보관한다. 마스크를 그리는 단계가 값을 기록하고, 대상 셰이더가 비교 조건에 따라 픽셀을 통과시키거나 버리는 방식으로 영역을 제한할 수 있다.

설명을 위한 단순한 예로, 마스크 안을 1·밖을 0으로 기록했다고 가정하자.

| 비교 조건의 예 | 값 1인 위치 | 값 0인 위치 |
| --- | --- | --- |
| 항상 통과 | 그림 | 그림 |
| 1과 같을 때 통과 | 그림 | 버림 |
| 1과 다를 때 통과 | 버림 | 그림 |

이 표는 원리를 설명하는 모델이다. 실제 `SpriteMask`가 사용하는 참조 값·비교 방식·정렬 범위 전체를 0과 1의 규칙으로 단정한 것은 아니다. 중첩 마스크나 다른 마스킹 시스템에는 추가 조건이 있다. [Unity 스텐실 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/SL-Stencil.html)

Spine 4.2의 `Spine/Skeleton` 셰이더는 `_StencilRef`와 `_StencilComp`를 스텐실 상태에 사용한다. 따라서 마스크에 반응하는 조건은 단순한 텍스처 속성이 아니라 그리기 상태의 일부다. [확인한 셰이더 소스](https://github.com/EsotericSoftware/spine-runtimes/blob/e7dc1435fa4a0083ab431f1b28e083c14a1f5c68/spine-unity/Assets/Spine/Runtime/spine-unity/Shaders/Spine-Skeleton.shader)

### 런타임 복사본이 생기는 지점

노션의 설명을 공개 4.2 소스와 대조했다. `AssignSpriteMaskMaterials`는 Inside·Outside 상태에 필요한 재질이 없으면 초기화 함수를 호출한다. 그 경로는 원본을 바탕으로 새 `Material`을 만들고 스텐실 비교 설정을 바꾼다. `CustomMaterialOverride`는 원본 재질을 다른 재질로 연결하는 Dictionary다. [확인한 SkeletonRenderer 소스](https://github.com/EsotericSoftware/spine-runtimes/blob/e7dc1435fa4a0083ab431f1b28e083c14a1f5c68/spine-unity/Assets/Spine/Runtime/spine-unity/Components/SkeletonRenderer.cs)

이 경로에서는 **필요한 마스크 재질이 없을 때 복사본을 만들 수 있다**. 매 프레임 모든 심볼의 재질을 새로 만든다는 뜻은 아니다. 원문에 없는 할당 빈도와 메모리 증가량을 추정하지 않는다. 이 소스 대조도 당시 설치 버전이 4.2였다는 증거는 아니다.

~~~mermaid
flowchart TD
    O["아틀라스 원본 재질"]
    O --> A["심볼 A의 자동 마스크 재질"]
    O --> B["심볼 B의 자동 마스크 재질"]
    O --> C["심볼 C의 자동 마스크 재질"]
    A --> X["서로 다른 재질 참조"]
    B --> X
    C --> X
    O --> M["CustomMaterialOverride"]
    M --> S["미리 준비한 공유 마스크 재질"]
    S --> P["심볼 A"]
    S --> Q["심볼 B"]
    S --> R["심볼 C"]
~~~

위쪽은 기록에 남은 문제의 구조, 아래쪽은 해결 설정의 구조다. 실제 프레임 캡처를 대신하는 그림은 아니다.

## 노션에 남긴 원인과 해결 과정

### 1 아틀라스 설정에서 런타임 재질 참조로 확인 대상을 옮겼다

기록의 출발점은 같은 아틀라스와 머티리얼을 지정했는데도 심볼이 따로 그려졌다는 관찰이다. 노트는 `Mask Interaction`이 적용되는 과정에서 별도 재질 복사본을 사용하는 점을 원인으로 설명했다.

여기서 확인할 대상은 Inspector에 처음 지정한 자산뿐 아니라 **실제로 렌더러에 들어간 재질 참조**다. 이름·텍스처·속성이 같다는 정보만으로는 그 참조가 공유되는지 알 수 없다. 다만 당시 원본 캡처와 측정표는 이번에 확보하지 못했다.

### 2 InsideMask 재질을 미리 준비했다

원문은 `Mask Interaction`을 선택해 InsideMask 설정의 재질을 생성하는 과정을 적었다. 그리고 그 재질을 대체용으로 지정했다.

이를 다시 시험할 때는 생성물이 프로젝트의 `.mat` 자산인지 확인한다. 플레이 중에만 존재하는 임시 복사본을 재사용 대상으로 잡으면 다음 실행이나 다른 심볼에서 같은 참조를 유지하기 어렵다. 생성 메뉴와 저장 방식은 설치된 Spine 버전에서 확인해야 한다.

확인한 4.2 Inspector 소스에는 `Mask Interaction Materials`의 `Inside Mask` 재질을 준비하는 `Set` 경로도 있다. 해당 버전에서는 플레이를 종료한 상태에서 스켈레톤의 원본 재질을 확인하고, 이 경로로 Inside 재질을 준비한 다음 생성된 자산 참조를 확인할 수 있다. 그 자산을 여러 심볼의 대체 재질로 지정한다. 이는 소스로 확인한 절차이며 실제 에디터에서 메뉴·생성 결과를 실행 확인한 것은 아니다. [확인한 Inspector 소스](https://github.com/EsotericSoftware/spine-runtimes/blob/e7dc1435fa4a0083ab431f1b28e083c14a1f5c68/spine-unity/Assets/Spine/Editor/spine-unity/Editor/Components/SkeletonRendererInspector.cs)

설치 버전에서 이미 준비된 마스크 재질을 공유한다면 자동 경로만으로도 이 문제가 재현되지 않을 수 있다. 수동 교체 컴포넌트가 모든 Spine 버전에 필수라는 결론은 내리지 않는다. 현재 환경에서 최종 참조를 먼저 확인한다.

새 재질을 만들 때 원본과 맞춰야 할 항목은 다음과 같다.

- 아틀라스 텍스처와 UV에 맞는 페이지
- 셰이더와 블렌드 모드
- PMA·Straight Alpha 입력 설정
- 스텐실 참조·비교 설정과 적용할 마스크 범위
- 렌더 큐 등 실제 표시 결과에 영향을 주는 상태

여러 심볼의 마스크 조건이 같을 때 같은 대체 재질을 사용한다. 다른 스텐실 조건을 하나의 공유 재질로 억지로 묶지 않는다.

### 3 자동 Mask Interaction을 None으로 바꿨다

원문은 공유할 마스크 재질을 만든 뒤 각 Spine의 `Mask Interaction`을 `None`으로 변경했다.

여기서 `None`은 이 구성에서 Spine의 자동 마스크 재질 선택 경로를 사용하지 않게 하려는 설정이다. 뒤에서 교체할 재질에 스텐실 테스트가 남아 있다면, 그 셰이더의 마스크 동작까지 사라지는 것은 아니다. 반대로 `None`만 설정하고 원본 재질을 그대로 쓰면 같은 화면 결과를 기대할 수 없다.

자동 마스크 재질과 수동 교체를 함께 켜 놓으면 최종 재질과 교체 키가 예상과 달라질 수 있다. 재현 장면에서는 두 경로를 섞지 않는다.

### 4 원본 재질에서 공유 재질로 교체했다

기록에는 `SpineOverrideMaterials`라는 컴포넌트가 나온다. `Original Material`과 `Replacement Material`을 지정하고, `OnEnable`에서 교체하는 구성이다. 런타임에는 `SetMaterialOverrides()`와 `RemoveMaterialOverrides()`로 적용·해제를 제어했다.

원본 키는 **Spine이 아틀라스에서 사용하던 실제 재질 객체**여야 한다. 단순히 이름이 같거나 속성을 복사한 다른 재질은 키로 일치하지 않는다. `MeshRenderer`에서 확인할 때도 자동 마스킹·수동 교체가 적용되기 전의 원본인지 구분한다.

공식 `SkeletonRendererCustomMaterials`도 설정된 교체를 활성화·비활성화 시점에 적용·해제한다. 따라서 원문의 “런타임 조작용이 아니다”라는 설명을 현재 컴포넌트가 런타임에 동작하지 않는다는 뜻으로 확대하지 않는다. 실행 중 교체를 직접 제어하려고 `CustomMaterialOverride`를 사용했다는 맥락으로 읽는다. [공식 컴포넌트 소스](https://github.com/EsotericSoftware/spine-runtimes/blob/e7dc1435fa4a0083ab431f1b28e083c14a1f5c68/spine-unity/Assets/Spine/Runtime/spine-unity/Components/SkeletonRendererCustomMaterials/SkeletonRendererCustomMaterials.cs)

### 5 공유 재질 변경의 영향 범위를 주의사항으로 남겼다

원문은 공유 재질을 런타임에 수정하면 그 재질을 사용하는 모든 오브젝트에 영향을 준다고 적었다.

이는 `sharedMaterials`가 돌려주는 배열과 배열 안의 재질을 구분하면 이해하기 쉽다. 배열은 복사본이지만 그 원소는 같은 재질 객체를 가리킬 수 있다. 배열 원소를 바꾸는 일과 재질의 색·스텐실 값을 바꾸는 일은 다르다. [Unity Renderer.sharedMaterials](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Renderer-sharedMaterials.html)

한 심볼만 다른 효과가 필요하면 어떤 데이터를 개별화할지 먼저 결정한다. 별도 재질이나 MaterialPropertyBlock을 적용하면 공유 상태와 배칭 조건도 다시 확인해야 한다. 색상 변경만으로 모든 렌더링 설정을 개별화할 필요가 있는지부터 살펴본다.

## 예제 1 원본 하나를 공유 재질 하나로 연결하기

아래는 별도로 작성한 예제 컴포넌트다. 노션에 나온 `SpineOverrideMaterials`의 원본 구현은 아니다. **Spine 4.2 API와 대조했지만 Unity에서 컴파일·실행하지 않은 예제**다.

파일 이름은 `SharedSpineMaskMaterial.cs`로 한다. 한 컴포넌트가 한 쌍의 교체를 맡는다.

~~~csharp
using Spine.Unity;
using UnityEngine;

[DisallowMultipleComponent]
[RequireComponent(typeof(SkeletonRenderer))]
public sealed class SharedSpineMaskMaterial : MonoBehaviour
{
    [SerializeField] private Material originalMaterial;
    [SerializeField] private Material replacementMaterial;

    private SkeletonRenderer target;
    private Material appliedOriginal;
    private Material appliedReplacement;

    private void OnEnable()
    {
        target = GetComponent<SkeletonRenderer>();
        target.Initialize(false);
        SetMaterialOverrides();
    }

    [ContextMenu("Set Material Overrides")]
    public void SetMaterialOverrides()
    {
        if (!isActiveAndEnabled || target == null || !target.valid)
            return;

        if (originalMaterial == null || replacementMaterial == null)
        {
            Debug.LogError("원본과 대체 재질을 지정해야 한다.", this);
            return;
        }

        if (target.maskInteraction != SpriteMaskInteraction.None)
        {
            Debug.LogError("자동 Mask Interaction을 None으로 설정한다.", this);
            return;
        }

        var overrides = target.CustomMaterialOverride;

        // 이 컴포넌트가 적용한 같은 쌍이면 반복 호출해도 유지한다.
        if (appliedOriginal == originalMaterial &&
            appliedReplacement == replacementMaterial &&
            overrides.TryGetValue(originalMaterial, out var current) &&
            current == replacementMaterial)
        {
            return;
        }

        RemoveMaterialOverrides();

        // 다른 제어기가 사용 중인 키는 덮어쓰지 않는다.
        if (overrides.ContainsKey(originalMaterial))
        {
            Debug.LogWarning("원본 재질의 교체가 이미 등록돼 있다.", this);
            return;
        }

        overrides.Add(originalMaterial, replacementMaterial);
        appliedOriginal = originalMaterial;
        appliedReplacement = replacementMaterial;
    }

    [ContextMenu("Remove Material Overrides")]
    public void RemoveMaterialOverrides()
    {
        if (target != null && appliedOriginal != null)
        {
            var overrides = target.CustomMaterialOverride;
            if (overrides.TryGetValue(appliedOriginal, out var current) &&
                current == appliedReplacement)
            {
                overrides.Remove(appliedOriginal);
            }
        }

        appliedOriginal = null;
        appliedReplacement = null;
    }

    private void OnDisable()
    {
        RemoveMaterialOverrides();
    }
}
~~~

설정 순서는 다음과 같다.

1. 동작하는 `SkeletonAnimation` 오브젝트에 컴포넌트를 추가한다. 4.2에서는 `SkeletonAnimation`이 `SkeletonRenderer`를 상속하는 구성을 전제로 한다.
2. `Original Material`에는 아틀라스의 원본 재질 자산을 지정한다.
3. `Replacement Material`에는 그 페이지와 호환되는 공유 InsideMask 재질 자산을 지정한다.
4. Spine의 `Mask Interaction`은 `None`으로 저장한다.
5. 여러 심볼에 **같은 Replacement 자산**을 할당한다. 심볼마다 자산을 복제하지 않는다.
6. 플레이 후 다음 예제와 Frame Debugger로 최종 참조와 마스크 결과를 확인한다.

`CustomMaterialOverride`의 Dictionary는 심볼별로 따로 있어도 된다. 중요한 것은 각 Dictionary의 값이 같은 공유 재질을 가리키는가다.

`Initialize(false)`는 유효한 스켈레톤을 매번 강제로 재생성하려는 호출이 아니다. 필요한 초기화를 요청한 뒤 교체를 등록한다. Dictionary 수정이 그 자리에서 최종 `MeshRenderer` 배열을 갱신하는 것도 아니다. Spine이 다음 메시·재질 갱신에서 이 정보를 사용하므로, 적용·해제 직후 같은 호출 안에서 화면 결과까지 완료됐다고 판단하지 않는다. 이 예제는 대상 Spine 컴포넌트도 활성화돼 정상 갱신되는 조건을 전제로 한다.

### 적용과 해제에서 지키는 규칙

이 예제는 새 재질을 생성하지 않는다. 이미 준비된 자산의 참조를 등록하고 제거한다. 공유 자산을 소유하지 않으므로 해제할 때 `Destroy`하지 않는다.

같은 키가 다른 제어기에 등록돼 있으면 적용을 거절한다. 자신이 등록한 뒤 다른 제어기가 값을 바꿨다면 해제 시 그 값을 삭제하지 않는다. `Clear()`로 Dictionary 전체를 비우는 것도 피한다.

이 규칙은 충돌을 줄이는 최소한의 처리다. 같은 키를 여러 제어기가 동시에 관리해야 한다면 우선순위·소유자·복원 순서를 가진 별도 관리가 필요하다. 값이 같은 경우에도 두 제어기의 소유권을 완전히 판별하지는 못한다.

이 코드는 스켈레톤 데이터 교체와 강제 재초기화를 자동 추적하지 않는다. 비활성화 후 다시 켜지면 적용하지만, 실행 중 `SkeletonDataAsset`이나 아틀라스를 바꾸는 경우는 별도 수명 설계와 검증 대상이다. 여러 아틀라스 페이지를 처리하려면 실제 원본 재질마다 교체 쌍도 준비해야 한다.

## 예제 2 최종 재질을 복제하지 않고 관찰하기

진단하면서 `renderer.material`을 읽으면 필요에 따라 개별 재질이 만들어질 수 있다. 원본 참조를 관찰하려던 코드가 관찰 대상을 바꿀 수 있는 것이다. 이 예제는 `sharedMaterials`를 읽는다. [Unity Renderer.material](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Renderer-material.html)

다음 코드를 `SpineMaterialSnapshot.cs`로 저장하고 각 심볼에 붙인다. 플레이 중 해당 컴포넌트의 메뉴에서 `Log Material Snapshot`을 실행한다. 화면에 반영되는 프레임을 한 번 진행한 뒤 확인한다.

~~~csharp
using UnityEngine;

[RequireComponent(typeof(MeshRenderer))]
public sealed class SpineMaterialSnapshot : MonoBehaviour
{
    [ContextMenu("Log Material Snapshot")]
    private void LogSnapshot()
    {
        var meshRenderer = GetComponent<MeshRenderer>();
        var materials = meshRenderer.sharedMaterials;

        for (int i = 0; i < materials.Length; i++)
        {
            var material = materials[i];
            if (material == null)
            {
                Debug.Log($"{name}[{i}]: null", this);
                continue;
            }

            var texture = material.mainTexture;
            int textureId = texture == null ? 0 : texture.GetInstanceID();

            Debug.Log(
                $"{name}[{i}]: material={material.name}, " +
                $"materialId={material.GetInstanceID()}, textureId={textureId}",
                this);
        }
    }
}
~~~

이 진단 코드도 아직 Unity에서 실행하지 않았다. 예상해서 확인할 관계는 다음과 같으며, 실제 로그 숫자를 제시한 표는 아니다.

| 확인할 값 | 별도 복사본을 사용하는 경우 | 같은 공유 자산을 사용하는 경우 |
| --- | --- | --- |
| 텍스처 ID | 같을 수 있음 | 같음 |
| 재질 이름 | 같거나 비슷할 수 있음 | 같음 |
| 같은 용도의 재질 ID | 심볼마다 다를 수 있음 | 같은 참조라면 같음 |
| 실제 드로우콜 수 | 별도 관찰 필요 | 별도 관찰 필요 |

Instance ID는 해당 실행 안에서 비교한다. 다음 실행의 번호와 일치해야 하는 영구 ID가 아니다. 재질 배열 길이도 화면 전체 드로우콜 수가 아니므로 통계처럼 사용하지 않는다.

## 실습 1 같은 값과 같은 참조 구분하기

Unity 없이 먼저 교체 키를 확인한다. 아래 프로그램의 `MaterialToken`은 실제 Unity `Material`을 대신하는 **참조 모델**이다. 배칭이나 GPU 렌더링을 시뮬레이션하지 않는다.

.NET 10 SDK가 설치된 터미널에서 다음과 같이 콘솔 프로젝트를 만든다.

~~~sh
dotnet new console --framework net10.0 -n SpineMaterialReference
cd SpineMaterialReference
~~~

`Program.cs` 전체를 다음 내용으로 바꾸고 `dotnet run`으로 실행한다.

~~~csharp
using System;
using System.Collections.Generic;

var atlas = new MaterialToken("Atlas");
var inside = new MaterialToken("Inside");
var lookalike = new MaterialToken("Atlas");

var symbolA = new Dictionary<MaterialToken, MaterialToken>();
var symbolB = new Dictionary<MaterialToken, MaterialToken>();

// 이름이 같은 다른 객체를 키로 넣었다.
symbolA[lookalike] = inside;
Console.WriteLine(
    $"잘못된 키로 교체됨: {ReferenceEquals(Resolve(symbolA, atlas), inside)}");

// 실제 원본 참조를 키로 넣는다.
symbolA.Clear();
symbolA[atlas] = inside;
symbolB[atlas] = inside;

Console.WriteLine(
    $"두 심볼의 결과 참조가 같음: " +
    $"{ReferenceEquals(Resolve(symbolA, atlas), Resolve(symbolB, atlas))}");

symbolB[atlas] = new MaterialToken("Inside");
Console.WriteLine(
    $"같은 이름의 복사본도 같음: " +
    $"{ReferenceEquals(Resolve(symbolA, atlas), Resolve(symbolB, atlas))}");

static MaterialToken Resolve(
    Dictionary<MaterialToken, MaterialToken> overrides,
    MaterialToken original)
{
    return overrides.TryGetValue(original, out var value) ? value : original;
}

sealed class MaterialToken
{
    public string Name { get; }

    public MaterialToken(string name)
    {
        Name = name;
    }
}
~~~

실행하기 전에 다음을 답해 본다.

1. `lookalike`의 이름이 같아도 교체가 되지 않는 이유는 무엇인가?
2. 두 Dictionary가 다른 객체여도 결과 재질을 공유할 수 있는가?
3. 마지막 줄에서 같은 이름의 새 객체를 넣으면 결과는 어떻게 되는가?

### 풀이와 확인한 출력

이 클래스는 동등성 비교를 재정의하지 않았으므로 서로 다른 인스턴스는 다른 키다. `atlas`를 조회하면서 `lookalike` 키에 등록한 값을 얻을 수 없다. Dictionary가 심볼마다 달라도 값으로 같은 `inside`를 저장하면 결과 참조는 공유된다. 마지막에는 새 인스턴스를 넣으므로 이름이 같아도 참조는 다르다.

~~~text
잘못된 키로 교체됨: False
두 심볼의 결과 참조가 같음: True
같은 이름의 복사본도 같음: False
~~~

이 프로그램은 .NET SDK 10.0.301에서 컴파일·실행해 위 출력을 확인했다. 실제 Unity `Material`은 Unity의 객체 비교 규칙을 사용하지만, 여기서 익힐 점은 이름이 같은 별도 복사본을 원본 키로 사용할 수 없다는 것이다. 이 콘솔 결과로 Unity 예제의 컴파일이나 배칭을 검증한 것은 아니다.

## 실습 2 자동 마스크와 공유 마스크 비교하기

아래 실습은 **아직 실행하지 않은 재현 절차**다. 예상되는 관계를 가설로 두고 실제 결과를 기록한다.

### 장면 만들기

1. 단일 페이지 아틀라스와 일반 블렌드 모드 부착물만 쓰는 작은 스켈레톤을 준비한다. 사용 권한이 있는 자신의 자산이나 설치된 Spine 예제 중 조건이 맞는 것을 사용한다.
2. 같은 프리팹 여섯 개를 겹치지 않게 배치하고 카메라가 모두 보게 한다.
3. `SpriteMask` 하나가 심볼의 일부만 덮게 배치한다. 마스크가 전체를 덮으면 경계 표시가 유지되는지 비교하기 어렵다.
4. 마스크의 Sorting Layer·Order 범위 안에 대상들이 들어가게 한다. 주변의 다른 투명 렌더러·그림자·후처리는 비교에 섞이지 않도록 통제한다.
5. 같은 애니메이션 시점·카메라·해상도에서 다음 세 조건을 각각 실행한다.

| 조건 | 자동 Mask Interaction | 수동 교체 | 확인 목적 |
| --- | --- | --- | --- |
| C0 | None | 없음 | 마스크 전 원본 참조와 표시 상태 |
| C1 | Visible Inside Mask | 없음 | 자동 마스크 경로의 참조·표시 |
| C2 | None | 공유 InsideMask 재질 | 같은 마스크 결과를 유지하며 참조를 공유하는가 |

조건을 바꿀 때는 플레이를 종료하고 설정한 뒤 다시 시작한다. C1에서 생성된 캐시나 교체 상태를 남긴 채 C2로 전환한 결과를 기본 비교로 사용하지 않는다. 자동 마스크 상태를 실행 중 바꾸는 경우는 별도 실습으로 분리한다.

### 관찰할 것

`Window → Analysis → Frame Debugger`에서 심볼의 색상 렌더링 이벤트를 찾는다. 먼저 어떤 렌더러·재질·패스가 사용됐는지 확인하고, 그다음 같은 그룹의 이벤트 수를 비교한다. Frame Debugger는 한 프레임의 그리기 순서와 상태를 살펴보는 도구다. [Unity Frame Debugger](https://docs.unity3d.com/6000.0/Documentation/Manual/FrameDebugger.html)

C0은 마스크 결과가 다를 수 있으므로 성능 비교의 동등한 결과물로 취급하지 않는다. 해결의 주요 비교는 **동일한 마스크 결과를 보이는 C1과 C2**다.

C1에서 이미 공유 참조를 사용한다면 그 사실을 기록한다. 과거 문제를 재현하려고 현재 정상 설정을 일부러 망가뜨린 뒤 이를 기본 동작처럼 설명하지 않는다. CPU·GPU 시간은 Frame Debugger의 프레임 정지를 끄고 별도의 Profiler 측정으로 수집한다. 에디터 관찰과 실제 기기 측정도 구분한다.

기록할 항목은 다음과 같다.

| 항목 | C1 | C2 |
| --- | --- | --- |
| Unity·Spine·파이프라인·배칭 설정 | 미확인 | 미확인 |
| 같은 시점의 마스크 경계와 겹침 결과 | 미확인 | 미확인 |
| 심볼 사이 최종 재질 참조의 공유 여부 | 미확인 | 미확인 |
| 심볼 색상 그리기 이벤트 수 | 미측정 | 미측정 |
| 마스크 작성 등 나머지 이벤트 수 | 미측정 | 미측정 |
| 같은 조건의 CPU·GPU 시간 | 미측정 | 미측정 |

### 풀이: C2가 한 드로우콜이 아니면 실패인가?

그 숫자만으로 판정하지 않는다. 먼저 다음 두 질문을 나눈다.

1. 같은 용도의 최종 재질 참조가 실제로 공유됐는가?
2. 그 상태에서 해당 환경의 배칭 조건이 충족됐는가?

첫 질문이 아니면 원본 키, 다른 컴포넌트의 교체, 자동 마스크 상태, 아틀라스 페이지를 다시 본다. 첫 질문이 맞아도 그리기가 나뉘면 정렬·블렌드 모드·서브메시·셰이더 패스·정점 데이터와 사용 중인 배칭 경로를 확인한다.

C2의 가설은 불필요한 재질 분리를 없앤다는 것이다. 모든 심볼과 마스크 작성 패스까지 한 번에 그린다는 가설은 아니다. 최종 성능은 실제 대상 기기와 같은 화면 결과에서 측정한다.

## 실습 3 잘못된 키와 해제 충돌 고치기

다음 세 상황의 문제를 설명하고 수정해 본다.

### 문제 A 원본과 이름이 같은 복사본을 키로 넣었다

~~~csharp
var wrongKey = new Material(originalMaterial);
target.CustomMaterialOverride[wrongKey] = replacementMaterial;
~~~

### 풀이 A

Spine이 요청하는 재질은 `originalMaterial`인데 등록한 키는 새 복사본이다. 실제 아틀라스 원본을 키로 사용한다.

~~~csharp
target.CustomMaterialOverride[originalMaterial] = replacementMaterial;
~~~

잘못 만든 복사본을 삭제하는 책임도 별도로 생긴다. 이 글의 공유 예제는 처음부터 런타임 복사본을 만들지 않는다. 코드 두 줄은 키를 설명하기 위한 조각이며 완성 컴포넌트가 아니다.

### 문제 B 비활성화될 때 모든 교체를 지웠다

~~~csharp
target.CustomMaterialOverride.Clear();
~~~

### 풀이 B

다른 재질이나 다른 기능이 등록한 교체까지 사라진다. 자신이 맡은 키를 알고, 그 키가 여전히 자신이 등록한 값일 때만 제거한다. 예제 1의 `RemoveMaterialOverrides`가 이 조건을 검사한다.

원래 Dictionary에 아무 교체도 없었다는 단순한 경우라면 제거 후 원본 재질을 사용한다. 이전 교체를 임시로 가렸다가 복원해야 하는 기능에는 이 예제를 그대로 쓰지 않는다. 그 경우에는 이전 상태와 소유권을 관리해야 한다.

### 문제 C 심볼 하나만 바꾸려고 공유 재질의 스텐실 값을 수정했다

수정한 재질을 다른 심볼도 사용한다면 그 심볼의 마스크 결과까지 바뀔 수 있다. 공유 범위를 유지할 수 있는지부터 판단한다. Inside와 Outside처럼 상태가 다른 그룹에는 각각 맞는 공유 재질을 준비한다.

이 실습의 Unity 코드 조각은 실행하지 않았다. 수정의 근거는 참조·키·소유권의 관계이며, 실제 표시 결과와 충돌 동작은 Unity에서 확인해야 한다.

## 실습 4 재사용과 여러 재질의 경계 확인하기

### 과제

- 예제 1의 `SetMaterialOverrides()`를 두 번 호출한다.
- `RemoveMaterialOverrides()`를 두 번 호출한다.
- 다른 제어기가 같은 키의 값을 바꾼 뒤 `RemoveMaterialOverrides()`를 호출한다.
- 오브젝트를 비활성화·활성화하며 반복 재사용한다.
- A·B·A 재질 순서를 사용하는 스켈레톤으로 바꾸고 A만 교체한다.
- 강제 재초기화 또는 다른 `SkeletonDataAsset` 할당을 별도 조건에서 시험한다.

각 상황의 **Dictionary 상태**와 **최종 렌더링 결과**를 나눠 적는다.

### 풀이와 예상

같은 쌍을 두 번 적용하면 이미 자신이 등록한 상태를 유지한다. 두 번 해제해도 두 번째 호출에서 다른 키를 지우지 않아야 한다. 다른 제어기가 값을 바꿨다면 그 값을 해제하지 않아야 한다.

오브젝트 재활성화는 `OnEnable`의 적용 경로를 다시 거친다. 하지만 컴포넌트 실행 순서, `Clear State on Disable`, 스켈레톤의 초기화·가시성 조건까지 현재 환경에서 시험한 것은 아니다. 한 프레임의 표시 오류가 없는지도 함께 본다.

A만 교체해도 B가 필요한 그리기 구간은 남는다. A의 공유 참조가 맞는지와 A·B·A 순서를 유지하는지는 별도 조건이다. 그리기 수를 줄이려고 순서를 바꿔 화면을 틀리게 만들면 올바른 수정이 아니다.

강제 재초기화·데이터 교체는 예제 1의 지원 범위 밖이다. 새 원본 키가 무엇인지 다시 구하고, 교체 재등록 시점과 프레임 반영을 설계해야 한다. 성공했다고 가정하는 대신 미지원 조건을 확인하는 과제로 둔다.

## 확인한 내용과 아직 남은 검증

| 대상 | 현재 확인 범위 |
| --- | --- |
| 당시 문제와 설정 방법 | 노션 본문에서 확인 |
| 당시 원본 컴포넌트·정확한 버전·성능 수치 | 확보하지 못함 |
| 마스크 재질 생성·교체 API | 공개 Spine 4.2 소스와 대조 |
| 콘솔 참조 모델 | .NET SDK 10.0.301 컴파일·실행, 출력 확인 |
| Unity 컴포넌트 두 개 | 독립 예제로 새로 작성, Unity 컴파일 미실행 |
| SpriteMask 시각 결과와 Frame Debugger | 재현 절차 작성, 실행 미확인 |
| 활성화·해제 충돌·반복 재사용 | 코드의 의도 설명, Unity 실행 미확인 |
| URP·HDRP·4.3·여러 아틀라스·실제 기기 성능 | 이 예제에서 미검증 |

당시 기록에서 가져온 것은 문제의 관찰과 공유 재질로 바꾸는 설정 과정이다. 재현용 코드·참조 모델·실습·설명 그림은 이번 글을 위해 AI의 도움을 받아 새로 구성했다. 원본 프로젝트의 코드와 화면, Spine 예제 자산은 복사하지 않았다.

남은 실행 확인은 Unity·Spine 버전을 고정한 C1·C2의 동일 화면 비교와 최종 재질 참조 검사다. 이를 재현한 뒤 그리기 이벤트와 측정 조건을 추가한다. 이 글의 설정 설명과 콘솔 결과를 실제 배칭 개선의 측정 결과로 확대하지 않는다.

