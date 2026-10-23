---
title: "Addressables 커스텀 빌드 스크립트의 호출 단계"
description: "빌드 진입점과 IDataBuilder·BuildDataImplementation의 역할을 구분합니다. 기본 packed builder에 전후 처리를 추가하는 예제와 성공·실패 실습을 다룹니다."
slug: "addressables-custom-build-stages"
date: "2024-03-23"
dateBasis: "notion"
updated: "2026-10-23"
topic: "tools"
kind: "note"
tags: ["Unity", "Addressables", "Build", "CI"]
draft: false
---

## 파이프라인 수를 늘리는 대신 입력과 빌드 단계를 나누기

[빌드 커스텀 스크립트](https://app.notion.com/p/e1094b62f6c645f7898e95507eaac7d1)의 목표는 플랫폼별 파이프라인에 환경·프로젝트 입력을 전달하는 것입니다. 당시 노트는 번들 생성까지의 상태라고 적혀 있습니다. 전체 업로드 자동화 완료 기록으로 쓰지 않습니다.

[BuildScriptBase](https://app.notion.com/p/d1bf4c1b4f8c482ab0afd98d03a400ca)는 진입·준비와 구현 지점을 설명하고, [DoBuild 단계](https://app.notion.com/p/d5ac17b636de41a8ba66176946312876)는 일부 서명과 제목만 있습니다. 빈 부분을 완성된 분석처럼 채우지 않고, 공개 API로 만들 수 있는 작은 확장을 설명합니다.

```text
CI 입력 검증 → Editor 진입 메서드 → 선택된 IDataBuilder
→ BuildData / BuildDataImplementation → 결과 검사 → 산출물 검증 → 배포
```

Addressables 콘텐츠 빌드와 Player 빌드는 다른 작업입니다. 스크립트 재컴파일이나 플랫폼 전환이 도메인 reload를 일으키면 하나의 메서드가 끝까지 이어진다고 가정하지 않습니다. [빌드 중 재컴파일 문서](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/build-scripting-recompiling.html)

## 기본 빌더의 전후에 관찰 지점 추가하기

Addressables 1.21 계열 Editor 폴더에 넣는 예제입니다. 기존 packed 알고리즘을 base로 호출하고 입력과 결과를 확인합니다. 이 코드는 노션의 비공개 빌더를 복사한 것이 아닙니다.

```csharp
using UnityEditor.AddressableAssets.Build;
using UnityEditor.AddressableAssets.Build.DataBuilders;
using UnityEngine;

[CreateAssetMenu(menuName = "Study/Observed packed builder")]
public sealed class ObservedPackedBuilder : BuildScriptPackedMode
{
    public override string Name => "Study observed packed build";

    protected override TResult BuildDataImplementation<TResult>(
        AddressablesDataBuilderInput input)
    {
        if (input == null) throw new System.ArgumentNullException(nameof(input));
        Debug.Log("Study content build begin");
        TResult result = base.BuildDataImplementation<TResult>(input);
        Debug.Log(string.IsNullOrEmpty(result.Error)
            ? "Study content build finished" : "Study content build failed");
        return result;
    }
}
```

기본 클래스에서 상속한 generic 제약을 재정의에 중복 표기하지 않았습니다. 해당 패키지 버전의 서명과 결과 타입을 확인한 뒤 사용합니다. CreateAssetMenu로 설정 에셋을 만들고 Addressables의 Build and Play Mode Scripts 목록에 추가해 선택합니다. 단순히 C# 파일을 만든 것만으로 활성 빌더가 바뀌지는 않습니다. [커스텀 빌드 스크립팅](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/build-scripting-custom.html)

## 입력 검증과 실패 처리

환경 이름은 dev·qa·production처럼 허용 목록으로 받습니다. 입력을 임의 파일 경로나 쉘 명령으로 이어 붙이지 않습니다. 출력 루트·프로파일·대상 플랫폼이 맞는지 빌드 전에 확인합니다. 빌드 결과 Error와 실제 파일 목록을 확인한 뒤 배포 단계를 시작합니다.

BuildData가 반환됐다는 사실, Error가 비었다는 사실, 카탈로그·번들이 실제로 준비됐다는 사실, 업로드 성공은 각각 다른 확인입니다. 실패한 빌드가 남긴 일부 파일을 다음 빌드의 정상 산출물로 섞지 않도록 실행별 출력 디렉터리를 사용합니다.

## 실습과 풀이

1. 기본 빌더와 새 빌더를 번갈아 선택합니다. **풀이:** 새 빌더 선택 시 전후 로그가 나와야 합니다. 로그만으로 산출물의 동일성을 판단하지 말고 카탈로그·번들 목록과 로드를 확인합니다.
2. 잘못된 환경·플랫폼 입력을 넣습니다. **풀이:** 빌드 시작 전에 거절해야 합니다. Unity의 기본 빌더가 프로젝트의 환경 허용 정책까지 자동 검증해 주지는 않습니다.
3. 실패 후 업로드가 실행되는 것을 막습니다. **풀이:** 결과 오류 또는 예외를 CI 실패로 전달하고 배포 의존 조건을 성공으로 제한합니다. 성공 마커를 finally에 쓰면 실패도 성공으로 오인할 수 있습니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [Unity 배치 빌드가 끝나지 않을 때: 종료 인수와 첫 빌드 비용](/writing/unity-batch-exit-cold-build/)
