---
title: "화면 좌표를 월드로, 월드 위치를 UI로 옮기기"
description: "클릭 위치의 Raycast와 머리 위 UI를 구현하며 화면 깊이, 카메라 뒤 대상, Canvas 모드와 RectTransform 좌표를 구분한다. 실습 세 개와 풀이를 포함한다."
slug: "unity-screen-world-ui-coordinates"
date: "2022-03-17"
dateBasis: "notion"
updated: "2026-10-18"
topic: "tools"
kind: "note"
tags: ["Unity", "UI", "Math"]
draft: false
---

## 마우스의 숫자를 Transform에 바로 넣으면 안 되는 이유

[UGUI 노트](https://app.notion.com/p/2dedcd0be37142609e6e076c6d6aef76)는 마우스 좌표를 월드 위치로 사용해 엉뚱한 곳에 객체가 생기는 문제에서 시작한다. 화면의 `(300, 200)`은 픽셀 위치이고, 월드의 `(300, 200, 0)`은 게임 공간의 위치다. 단위와 기준이 다르다.

화면의 한 점에는 깊이 정보가 없다. 원근 카메라에서는 그 픽셀을 통과하는 광선 위에 여러 월드 위치가 있다. 직교 카메라에서는 광선들이 평행하지만, 여전히 어느 표면을 선택할지 정해야 한다. 노트의 ‘수직으로 레이를 쏜다’는 설명은 모든 카메라에 적용하지 않는다.

| 출발 → 도착 | 필요한 정보 | API |
| --- | --- | --- |
| 화면 → 월드 표면 | 카메라, 충돌체, 거리와 레이어 | ScreenPointToRay, Physics.Raycast |
| 월드 → 화면 | 투영할 카메라와 월드 위치 | WorldToScreenPoint |
| 화면 → UI 부모 로컬 | 부모 RectTransform, Canvas 카메라 | ScreenPointToLocalPointInRectangle |

## 클릭한 바닥에 객체 놓기

Unity 6의 빈 3D 장면에서 Collider가 있는 바닥을 만들고 전용 Ground 레이어를 지정한다. 빈 객체에 다음 `ClickPlacement.cs`를 붙인다. `view`, `prefab`, `ground`를 Inspector에서 연결한다. 기존 Input Manager 입력 API 예제이므로 프로젝트의 Active Input Handling이 이를 허용해야 한다. 새 Input System을 쓰는 프로젝트에서는 클릭 이벤트와 화면 위치를 해당 입력 액션에서 전달한다.

```csharp
using UnityEngine;

public sealed class ClickPlacement : MonoBehaviour
{
    [SerializeField] Camera view;
    [SerializeField] GameObject prefab;
    [SerializeField] LayerMask ground;

    void Update()
    {
        if (!view || !prefab || !Input.GetMouseButtonDown(0)) return;
        Ray ray = view.ScreenPointToRay(Input.mousePosition);
        if (Physics.Raycast(ray, out RaycastHit hit, 100f, ground,
                            QueryTriggerInteraction.Ignore))
            Instantiate(prefab, hit.point, Quaternion.identity);
    }
}
```

레이어를 제한하지 않으면 먼저 놓은 객체나 캐릭터를 다시 맞힐 수 있다. Collider가 없는 평면을 대상으로 할 때는 `Plane.Raycast`를 사용하는 별도 계약을 만들 수 있다. 배치 높이와 프리팹 pivot의 위치도 구분한다. pivot이 바닥에 없으면 hit.point에 놓아도 메시가 파묻힐 수 있다.

`ScreenToWorldPoint`의 z는 단순히 ‘월드 z=0’이 아니다. 카메라로부터의 깊이를 지정해야 한다. 표면을 찾는 작업에서는 충돌 결과가 이 깊이를 대신 결정한다. [Unity Camera 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Camera.ScreenPointToRay.html)

## 머리 위 라벨을 Canvas의 로컬 좌표로 옮기기

다음 `WorldLabel.cs`는 Screen Space Overlay 또는 Screen Space Camera Canvas를 대상으로 한다. 라벨의 부모를 `parent`에 연결한다. 라벨은 그 부모의 직계 자식이어야 한다. `canvas`는 실제 화면 모드와 카메라를 결정하는 루트 Canvas다. World Space Canvas는 이 예제의 지원 범위에서 제외한다.

```csharp
using UnityEngine;

public sealed class WorldLabel : MonoBehaviour
{
    [SerializeField] Camera view;
    [SerializeField] Transform target;
    [SerializeField] Canvas canvas;
    [SerializeField] RectTransform parent;
    [SerializeField] RectTransform label;
    [SerializeField] CanvasGroup visibility;

    void LateUpdate()
    {
        if (!view || !target || !canvas || !parent || !label || !visibility)
            return;
        bool supported = canvas.renderMode != RenderMode.WorldSpace;
        Vector3 screen = view.WorldToScreenPoint(target.position);
        bool visible = supported && screen.z >= view.nearClipPlane
            && screen.z <= view.farClipPlane
            && view.pixelRect.Contains(new Vector2(screen.x, screen.y));
        Camera uiCamera = canvas.renderMode == RenderMode.ScreenSpaceOverlay
            ? null : canvas.worldCamera;
        if (canvas.renderMode == RenderMode.ScreenSpaceCamera && !uiCamera)
            visible = false;
        if (visible && RectTransformUtility.ScreenPointToLocalPointInRectangle(
                parent, screen, uiCamera, out Vector2 local))
            label.localPosition = new Vector3(local.x, local.y, 0f);
        else
            visible = false;
        visibility.alpha = visible ? 1f : 0f;
        visibility.blocksRaycasts = false;
        visibility.interactable = false;
    }
}
```

라벨에 CanvasGroup을 추가하고 연결한다. 부모 평면의 로컬 점을 얻었으므로 `localPosition`을 사용한다. `anchoredPosition`으로 대입하려면 앵커 기준점과 pivot에 따른 차이를 처리해야 한다. LayoutGroup이나 애니메이션이 위치를 덮어쓰는 라벨에는 이 스크립트를 그대로 붙이지 않는다.

Overlay의 변환 카메라는 null이다. Camera 모드에서는 해당 Canvas의 카메라를 사용한다. 변환 함수의 true는 RectTransform의 평면과 만났다는 뜻이며 사각형 내부라는 뜻은 아니다. 여기서는 별도로 카메라 픽셀 영역을 검사했다. [RectTransformUtility 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/RectTransformUtility.ScreenPointToLocalPointInRectangle.html)

## 실습과 풀이

1. 원근 카메라와 직교 카메라를 번갈아 사용해 같은 화면 위치를 클릭한다. **풀이:** 두 경우 모두 광선과 바닥의 교점을 사용한다. 픽셀 좌표 자체는 월드 위치가 되지 않는다. 바닥이 없거나 100 단위보다 멀면 생성되지 않는 것이 이 예제의 계약이다.
2. 라벨 대상을 카메라 뒤, 화면 밖, near plane 안쪽으로 옮긴다. **풀이:** 해당 조건에서 alpha는 0이어야 한다. 화면 안에 있다는 것과 다른 물체에 가려지지 않았다는 것은 다르므로 가림 판정에는 별도 Raycast가 필요하다.
3. CanvasScaler의 기준 해상도와 창 크기를 바꾼다. **풀이:** 픽셀 위치를 UI 위치에 직접 대입하는 방식과 비교한다. 부모의 로컬 좌표 변환을 거친 쪽은 배율을 임의로 한 번 더 나누지 않는다. 두 카메라의 viewport가 다를 때는 실제 출력 화면에서 확인한다.

## 확인한 범위

노션의 두 좌표 변환 코드와 Unity 6 API 문서를 대조해 예제를 새로 구성했다. Unity 컴파일, 클릭 배치, 해상도별 라벨 추적과 DCB 적용은 이번에 실행하지 않았다. 위 실습의 결과는 확인해야 할 예상 동작이며 플레이 결과가 아니다. 설명과 예제 작성에 AI를 사용했다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [VBO·VAO·EBO와 정점 속성의 stride·offset](/writing/opengl-vertex-layout-stride-offset/)
