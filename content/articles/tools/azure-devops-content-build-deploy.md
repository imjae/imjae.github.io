---
title: "Azure DevOps로 Addressables 콘텐츠를 빌드·배포한 과정"
description: "노션의 에이전트·태그 checkout·아티팩트·Blob 업로드 기록을 바탕으로 원인과 해결 과정을 정리한다. 공개용 빌드 예제와 파일 검증 실습·풀이, 아직 실행하지 않은 범위를 구분한다."
slug: "azure-devops-content-build-deploy"
date: "2026-10-17"
topic: "tools"
kind: "case-study"
tags: ["Unity", "Addressables", "Azure DevOps", "CI/CD", "Git", "PowerShell", "Verification"]
draft: false
---

## 배포 대상은 Unity 실행 파일이 아니라 콘텐츠였다

목표는 게임과 별도 콘텐츠 프로젝트의 리소스를 Addressables로 빌드하고, 이를 다른 클라이언트가 받아 쓸 수 있게 배포하는 것이었다. [노션의 CI/CD 구현 기록](https://app.notion.com/p/6b4009e0624e4162bb05136e0834261b)은 대상이 **Unity Player가 아닌 Addressables 번들**이라고 명시한다.

처음에는 명령줄 빌드 뒤 파일을 Storage에 복사하는 흐름을 생각했다. 실제로 구성하면서 업로드 작업의 OS 제약, 서로 다른 실행 머신 사이의 파일 경로, Git 태그 조회 권한, Unity 프로세스 종료 문제를 만났다. 해결 방향은 빌드 입력과 실행 머신을 정하고, 결과를 아티팩트로 전달한 뒤 업로드하는 것이었다.

이 글은 당시 기록을 설명한 뒤 작은 학습 예제로 다시 구성한다. 원본 프로젝트명·조직·서비스 연결·머신 경로·접속정보와 전체 YAML은 옮기지 않았다. 현재 DCB의 CI를 구현하거나 검증한 글도 아니다.

기록의 목표에는 CDN 배포가 나오고 수행 내용에는 Azure Blob Storage 업로드가 적혀 있다. Blob 업로드와 CDN 캐시 갱신, 클라이언트의 실제 콘텐츠 로딩까지 같은 완료 상태로 취급하지 않는다. 이 글을 쓰면서 Azure와 Unity를 새로 실행한 것은 아니다.

## 빌드·전달·업로드·사용을 구분하기

| 용어 | 이 글에서 뜻하는 것 | 확인할 결과 |
| --- | --- | --- |
| Pipeline | 여러 작업의 실행 흐름 | 어떤 입력으로 어떤 단계가 실행되는가 |
| Stage·Job·Step | 단계·실행 작업·그 안의 개별 동작 | 어느 머신에서 무엇이 실패했는가 |
| Agent | Job을 실행하는 머신과 에이전트 프로그램 | OS·Unity·모듈·작업 폴더 |
| Checkout | 저장소의 특정 내용을 작업 폴더에 준비 | 실제 커밋과 파일 위치 |
| Content build | 자산을 번들·카탈로그 등으로 변환 | 빌드 오류와 생성 파일 |
| Artifact | 다른 Job에도 전달할 빌드 산출물 | 같은 실행에서 만든 파일인가 |
| Upload | 산출물을 Blob의 경로에 기록 | 대상 경로에 파일이 있는가 |
| 콘텐츠 사용 | 클라이언트가 카탈로그·번들을 로드 | 호환되는 실행 파일에서 표시·동작하는가 |

카탈로그는 자산을 찾는 데 필요한 위치와 의존 관계 등을 담고, 번들은 자산 데이터를 담는다. Player는 그 데이터를 해석하고 사용하는 실행 파일이다. 새 번들을 올렸다는 사실만으로 이미 배포된 Player와의 호환성을 보장할 수 없다.

에이전트는 작업을 실행하는 머신과 에이전트 프로그램을 뜻한다. 개발 PC의 폴더와 hosted agent의 같은 이름 폴더는 별개다. Microsoft-hosted 환경은 Job마다 새 VM을 사용하며 self-hosted에는 설치 도구와 캐시가 남을 수 있다. 다른 Job에서도 같은 머신·파일이 유지된다고 가정하면 안 된다. [Azure 에이전트 문서](https://learn.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops)

~~~mermaid
flowchart TD
    I["태그·환경·플랫폼 입력"] --> C["빌더와 콘텐츠 checkout"]
    C --> U["전용 에이전트에서 Unity 콘텐츠 빌드"]
    U --> F["카탈로그·번들·파일 목록 검사"]
    F --> A["아티팩트 게시"]
    A --> D["같은 실행의 아티팩트 다운로드"]
    D --> V["입력 정보·파일 해시 재검사"]
    V --> B["새 Blob 경로에 후보 업로드"]
    B --> R["원격 파일·클라이언트 로딩 확인"]
    R --> P["사용할 카탈로그 선택 전환"]
~~~

앞부분의 구성은 노션 기록을 바탕으로 한다. 파일 목록 재검사와 후보 경로·사용 전환의 분리는 이번 예제에서 보강한 설계다. 마지막 두 단계는 아래 YAML이 자동으로 완료하는 범위에 포함하지 않는다.

## 노션에 남은 문제와 해결 과정

### 1 업로드 작업과 실행 OS가 맞지 않았다

[초기 DevOps 기록](https://app.notion.com/p/49e52b6b0fcb40ae9f0b1819a7529636)에는 명령줄 콘텐츠 빌드는 성공했으나 Azure File Copy의 실행 환경에서 막힌 과정이 있다. 노트의 당시 에이전트 OS는 추정 표현으로 적혀 있어 정확한 이미지까지 확정하지 않는다.

현재 공식 `AzureFileCopy@6` 문서도 Windows 에이전트에서 실행하는 작업이라고 설명한다. Linux에서 Blob 복사를 하려면 Azure CLI 작업을 대안으로 사용할 수 있다. 이는 특정 작업의 제약이지 Azure Pipelines가 Windows에서만 동작한다는 뜻이 아니다. [Azure File Copy 문서](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/azure-file-copy-v6?view=azure-pipelines)

후속 기록은 빌드 전용 Windows·macOS 머신과 Agent Pool을 사용했다. 당시 플랫폼별 머신 배치를 현재 Unity의 보편적인 필수 조건으로 일반화하지 않는다. 실제 배치는 설치된 Unity·플랫폼 모듈·라이선스와 실행할 작업에 맞춰 결정한다.

### 2 다른 머신의 로컬 폴더를 복사하려고 했다

초기 기록은 개발 PC에서 생성한 결과에 클라우드 작업이 접근하지 못한 상황을 설명한다. 문제는 경로 문자열이 아니라 **그 파일을 가진 실행 주체가 다르다는 것**이다.

`CopyFiles`는 현재 에이전트가 접근할 수 있는 파일을 지정한 위치로 복사한다. 이 작업만으로 개발 PC의 폴더가 업로드 Job에 나타나는 것은 아니다. 후속 기록은 다음과 같이 구성했다.

1. Unity를 실행한 에이전트에서 빌드한다.
2. 그 에이전트의 결과를 아티팩트 게시용 경로로 복사한다.
3. 아티팩트로 게시한다.
4. 배포 파이프라인에서 그 결과를 받아 Blob Storage로 업로드한다.

같은 결과를 전달하는 구성이므로 업로드 단계에서 콘텐츠를 다시 빌드할 필요가 없다. 아래 예제는 빌드 출력 자체를 아티팩트 준비 폴더에 지정해 중간 복사를 줄였다. 노션의 `PublishBuildArtifacts@1`과 달리 예제는 Azure DevOps Services의 Pipeline Artifact 게시·다운로드를 사용한다. [Pipeline Artifact 문서](https://learn.microsoft.com/en-us/azure/devops/pipelines/artifacts/pipeline-artifacts?view=azure-devops)

CI는 변경을 통합하고 검사·빌드하는 흐름이고, CD는 검사한 결과를 전달·배포하는 흐름이다. CD가 모든 실행을 자동으로 실서비스에 공개해야 한다는 뜻은 아니다. 아래 예제도 후보 업로드 여부를 따로 선택한다.

### 3 명령줄의 태그 조회가 권한 오류로 실패했다

[저장소 연결 실패 기록](https://app.notion.com/p/e06c1f59bc814ee8ad82aadb813cd34b)은 빌더가 별도 콘텐츠 저장소를 사용하고, 그 저장소의 태그를 조회하는 Git 명령이 권한 문제로 실패했다고 설명한다.

기록의 해결은 YAML의 `resources.repositories`에 저장소와 서비스 연결을 선언하고 입력 태그의 `ref`로 checkout하는 것이었다. 빌더 저장소와 콘텐츠 저장소의 경로도 각각 지정했다.

이것은 CI의 **다중 저장소 checkout**이다. 원문 제목에 서브모듈이 나오더라도 Git submodule update로 해결했다고 바꿔 쓰지 않는다. 서비스 연결과 저장소 사용 권한은 여전히 필요하다. 선언만으로 권한 제한이 사라지는 것도 아니다. [다중 저장소 checkout](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/multi-repo-checkout?view=azure-devops)

태그를 입력했다고 모든 빌드 입력이 고정되는 것은 아니다. 빌더 커밋, 콘텐츠 커밋, Unity 버전, 패키지 lock과 설정도 영향을 준다. 아래 예제는 두 저장소의 실제 커밋을 기록한다. 태그 이름만으로 태그가 가리키는 커밋의 변경까지 방지하지는 못한다.

### 4 Unity가 끝나지 않는 경우와 실제로 오래 걸린 경우가 섞였다

[시간 초과 기록](https://app.notion.com/p/49a3baf2d6c64db48bb2c54dc3615c0b)은 서로 다른 두 경우를 남겼다.

| 당시 기록 | 대응 | 해석할 때 주의할 점 |
| --- | --- | --- |
| 빌드 명령에 `-quit` 누락 | 종료 인수 추가 | 콘텐츠 생성과 프로세스 종료는 다른 결과 |
| 첫 플랫폼 전환과 첫 빌드가 합쳐져 제한 시간 초과 | 전환 정보가 남은 상태에서 재시도 후 통과 | 캐시가 없는 상태의 비용이 해결됐다는 뜻은 아님 |

“한 시간 넘으면 종료 옵션 문제”라고 단정하지 않는다. 로그가 계속 진행되는지, 프로세스가 종료됐는지, 콜드 상태의 가져오기·플랫폼 전환 비용이 얼마인지 나눠 본다. 예제의 시간 제한도 정답 수치가 아니라 학습용 값이다.

### 5 스크립트 버전과 리소스 버전을 나눴다

[빌드·배포 순서 노트](https://app.notion.com/p/8634dae5619e41bdaee2cc075f7be6c5)는 스크립트 변경·리소스 변경·둘 다 변경을 나눈다. 게임 콘텐츠 버전은 `v1.0.[scriptVersion].[resourceVersion]` 형태다. 리소스 전용 콘텐츠는 리소스 버전만 사용했다. 네 숫자를 쓰는 자체 규칙이며 일반적인 SemVer의 세 숫자 형식과 같다고 부르지 않는다.

| 변경 | 기록에서 올리려던 값 | 추가로 판단할 것 |
| --- | --- | --- |
| 그림·프리팹 등 리소스 | 리소스 버전 | 기존 Player가 해당 데이터를 읽을 수 있는가 |
| 스크립트 | 스크립트 버전 | 직렬화·타입·어셈블리와 콘텐츠의 관계 |
| 양쪽 변경 | 둘 다 | 어떤 Player와 콘텐츠를 함께 사용해야 하는가 |

버전을 나누는 것은 대상을 식별하는 규칙이다. 스크립트만 바뀌면 항상 같은 카탈로그를 재사용할 수 있다는 호환성 증명은 아니다.

[Addressables 빌드 메모](https://app.notion.com/p/84031fd94b9a4f3bb071bba99b9b7e34)는 이전 카탈로그가 참조하는 번들도 남겨야 한다고 적었다. 이전 카탈로그만 보관하고 번들을 삭제하면 복원할 수 없다. 변경 자산만의 배포와 아래 예제의 전체 콘텐츠 빌드도 구분한다. 정식 콘텐츠 업데이트 빌드에는 이전 `addressables_content_state.bin` 등 해당 워크플로의 입력을 함께 관리해야 한다. [Addressables 콘텐츠 업데이트 개요](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/content-update-builds-overview.html)

## 학습 예제의 준비 조건

코드는 원본 업무 파이프라인을 복사한 것이 아니다. **Unity C#과 Azure YAML은 실제 컴파일·클라우드 실행을 아직 하지 않았다.** PowerShell의 실행 범위는 뒤의 가상 파일 실습으로 구분한다.

| 준비 항목 | 예제에서 사용할 조건 |
| --- | --- |
| 서비스 | Azure DevOps Services의 YAML 파이프라인 |
| 빌드 머신 | Windows self-hosted, PowerShell 7·Git·정확한 Unity와 Windows 빌드 모듈 |
| Unity 프로젝트 | 다른 에디터가 열고 있지 않은 CI 전용 작업 복사본 |
| Addressables API | 1.21 계열 문서 기준, 실제 사용할 패키지·Unity 버전은 별도 고정 |
| 프로필 | `dev`·`qa`·`stage`, `Remote.BuildPath`와 `Remote.LoadPath` 변수 |
| 그룹 설정 | 실습 자산은 Remote 경로를 사용하는 그룹, Packed Mode 빌더 |
| 카탈로그 | Remote Catalog 생성 활성화, 실습은 JSON 카탈로그와 `.bundle` 사용 |
| 저장소 | 빌더와 콘텐츠 저장소, GitHub 서비스 연결과 태그 접근 권한 |
| Storage | 기존 Blob 컨테이너 `content`, 업로드 가능한 서비스 연결 |
| 실행 상태 | 자동 트리거 없음, 후보 업로드도 기본값은 꺼짐 |

`example-org`, Pool 이름과 서비스 연결 이름은 예시다. 실제 연결을 만들었다는 뜻이 아니다. `UnityEditorPath`와 `ContentStorageAccount`는 파이프라인에서 지정할 값이며 키나 토큰을 YAML에 넣지 않는다.

새 예제의 배포 경로는 `환경/플랫폼/전체태그`로 잡는다.

~~~text
content/
  dev/StandaloneWindows64/v1.0.2.7/
    catalog_....json
    catalog_....hash
    ...bundle
    manifest.json
~~~

원문의 리소스 버전 중심 카탈로그 이름을 그대로 재현하는 예제는 아니다. 카탈로그의 실제 이름은 산출물에서 확인한다. Blob의 접두사와 카탈로그 안의 Remote Load URL도 맞아야 한다.

## 예제 1 Unity 콘텐츠 빌드 진입점

빌더 프로젝트의 `Assets/Editor/ContentBuildEntry.cs`에 둘 코드다. 블로그 설명용으로 작성했으며 다른 저장소에 실제로 추가하지 않았다.

~~~csharp
using System;
using System.IO;
using UnityEditor;
using UnityEditor.AddressableAssets;
using UnityEditor.AddressableAssets.Build;
using UnityEditor.AddressableAssets.Settings;
using UnityEngine;

public static class ContentBuildEntry
{
    public static void Build()
    {
        try
        {
            var settings = AddressableAssetSettingsDefaultObject.Settings;
            if (settings == null)
                throw new InvalidOperationException("Addressables 설정이 없다.");

            string profile = Required("CONTENT_PROFILE");
            string profileId = settings.profileSettings.GetProfileId(profile);
            if (string.IsNullOrEmpty(profileId))
                throw new InvalidOperationException("지정한 프로필이 없다.");

            string output = Path.GetFullPath(Required("CONTENT_OUTPUT_DIR"));
            if (Directory.Exists(output) &&
                Directory.GetFileSystemEntries(output).Length != 0)
                throw new InvalidOperationException("출력 폴더가 비어 있지 않다.");

            string remoteUrl = Required("CONTENT_LOAD_URL");
            if (!Uri.TryCreate(remoteUrl, UriKind.Absolute, out var uri) ||
                uri.Scheme != Uri.UriSchemeHttps)
                throw new InvalidOperationException("HTTPS Load URL이 필요하다.");

            Directory.CreateDirectory(output);
            settings.activeProfileId = profileId;
            settings.profileSettings.SetValue(
                profileId, "Remote.BuildPath", output.Replace('\\', '/'));
            settings.profileSettings.SetValue(
                profileId, "Remote.LoadPath", remoteUrl.TrimEnd('/'));

            AddressableAssetSettings.BuildPlayerContent(
                out AddressablesPlayerBuildResult result);
            if (result == null || !string.IsNullOrEmpty(result.Error))
                throw new InvalidOperationException(
                    result == null ? "빌드 결과가 없다." : result.Error);

            Debug.Log("콘텐츠 빌드 함수가 정상 반환했다.");
        }
        catch (Exception error)
        {
            Debug.LogException(error);
            EditorApplication.Exit(1);
        }
    }

    private static string Required(string name)
    {
        string value = Environment.GetEnvironmentVariable(name);
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException(name + " 값이 필요하다.");
        return value;
    }
}
~~~

`BuildPlayerContent`라는 이름에 Player가 들어 있지만 여기서는 Addressables 콘텐츠를 빌드한다. 실행 파일을 만드는 `BuildPipeline.BuildPlayer` 호출은 없다. 프로필·활성 빌더와 결과의 `Error` 확인은 [스크립트 빌드 문서](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/build-scripting-start-build.html)를 기준으로 했다. 프로필 변수 설정은 [SetValue API](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/api/UnityEditor.AddressableAssets.Settings.AddressableAssetProfileSettings.SetValue.html)와 대조했다.

출력 폴더를 자동 삭제하는 대신 비어 있지 않으면 중단한다. 지난 결과가 섞인 상태를 정상 결과로 넘기지 않기 위한 학습 규칙이다. 실제 프로젝트는 그룹이 프로필 변수를 참조하는지, 로컬·원격 번들과 카탈로그의 출력 위치가 어디인지 확인해야 한다.

함수 정상 반환은 첫 관문이다. 다음 검사에서 기대한 카탈로그와 번들을 확인하고, 그다음 원격 클라이언트 로딩을 확인한다.

## 예제 2 파일 목록을 만들고 전달 후 다시 검사하기

빌더 저장소의 `ci/ContentArtifact.ps1`에 둘 완성 스크립트다. PowerShell 7을 전제로 한다. Unity 없이도 파일 전달의 일부 계약을 연습할 수 있다.

~~~powershell
param(
    [Parameter(Mandatory)]
    [ValidateSet('Write', 'Verify')]
    [string]$Mode,
    [Parameter(Mandatory)]
    [string]$Root,
    [Parameter(Mandatory)]
    [ValidatePattern('^v\d+\.\d+\.\d+\.\d+$')]
    [string]$Tag,
    [Parameter(Mandatory)]
    [ValidateSet('dev', 'qa', 'stage')]
    [string]$EnvironmentName,
    [string]$Target = 'StandaloneWindows64',
    [string]$BuilderCommit = '',
    [string]$ContentCommit = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$artifactRoot = (Resolve-Path -LiteralPath $Root).Path
if (-not (Test-Path -LiteralPath $artifactRoot -PathType Container)) {
    throw '산출물 폴더가 필요하다.'
}
$manifestPath = Join-Path $artifactRoot 'manifest.json'
$files = @(Get-ChildItem -LiteralPath $artifactRoot -Recurse -File -Force |
    Where-Object { $_.FullName -ne $manifestPath } |
    Sort-Object FullName)

if (@($files | Where-Object { $_.Name -like 'catalog*.json' }).Count -eq 0) {
    throw 'JSON 카탈로그가 없다.'
}
if (@($files | Where-Object { $_.Extension -eq '.bundle' }).Count -eq 0) {
    throw '번들이 없다.'
}

$rows = @(foreach ($file in $files) {
    $digest = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    [ordered]@{
        path = [IO.Path]::GetRelativePath(
            $artifactRoot, $file.FullName).Replace('\', '/')
        bytes = $file.Length
        sha256 = $digest
    }
})

if ($Mode -eq 'Write') {
    if ($BuilderCommit -notmatch '^[0-9a-f]{40}$' -or
        $ContentCommit -notmatch '^[0-9a-f]{40}$') {
        throw '두 저장소의 실제 SHA-1 커밋이 필요하다.'
    }
    $document = [ordered]@{
        schema = 1
        tag = $Tag
        environment = $EnvironmentName
        target = $Target
        builderCommit = $BuilderCommit
        contentCommit = $ContentCommit
        files = $rows
    }
    $document | ConvertTo-Json -Depth 6 |
        Set-Content -LiteralPath $manifestPath -Encoding utf8NoBOM
    Write-Output "목록 생성: $($rows.Count)개 파일"
    return
}

$document = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($document.schema -ne 1 -or $document.tag -ne $Tag -or
    $document.environment -ne $EnvironmentName -or
    $document.target -ne $Target) {
    throw '산출물의 버전·환경·플랫폼이 예상과 다르다.'
}
$expected = [Collections.Generic.Dictionary[string, object]]::new(
    [StringComparer]::Ordinal)
foreach ($entry in @($document.files)) {
    $expected.Add([string]$entry.path, $entry)
}
if ($expected.Count -ne $rows.Count) {
    throw '파일 수가 다르다.'
}
foreach ($row in $rows) {
    if (-not $expected.ContainsKey($row.path)) {
        throw "목록에 없는 파일: $($row.path)"
    }
    $entry = $expected[$row.path]
    if ($entry.bytes -ne $row.bytes -or $entry.sha256 -ne $row.sha256) {
        throw "내용이 달라진 파일: $($row.path)"
    }
}
Write-Output "검사 통과: $($rows.Count)개 파일"
~~~

검사에는 세 가지 의미가 있다.

1. **식별:** 요청한 태그·환경·플랫폼과 같은 결과인가?
2. **목록:** 파일 누락·추가·같은 개수의 이름 변경이 있는가?
3. **내용:** 각 파일의 길이와 SHA-256이 같은가?

예제는 Git SHA-1 커밋 표기와 JSON 카탈로그·`.bundle` 이름을 전제로 한다. 다른 형식의 프로젝트에는 조건을 맞춰야 한다. manifest는 전자서명이 아니므로 파일과 manifest를 함께 바꿀 수 있는 주체까지 검증하지는 못한다. Unity 버전·패키지 lock·프로필을 모두 보존하는 재현성 증명도 아니다.

## 예제 3 빌드와 후보 업로드를 나눈 YAML

앞의 파일 두 개를 준비한 뒤 사용할 **미실행 구성 예제**다. 서비스 연결·Pool·프로필·저장소를 실제 환경에 맞춰야 한다. 기본 실행은 빌드와 아티팩트 게시까지다.

~~~yaml
trigger: none
pr: none

parameters:
- name: contentTag
  type: string
  default: v1.0.2.7
- name: environmentName
  type: string
  default: dev
  values: [dev, qa, stage]
- name: uploadCandidate
  type: boolean
  default: false

resources:
  repositories:
  - repository: content
    type: github
    endpoint: content-repo-connection
    name: example-org/content-assets
    ref: refs/tags/${{ parameters.contentTag }}

variables:
  releasePrefix: '${{ parameters.environmentName }}/StandaloneWindows64/${{ parameters.contentTag }}'

stages:
- stage: BuildContent
  jobs:
  - job: Build
    timeoutInMinutes: 120
    pool:
      name: UnityContentWindows
      demands:
      - Agent.OS -equals Windows_NT
    steps:
    - checkout: self
      clean: true
      submodules: false
      path: s/builder
    - checkout: content
      clean: true
      fetchDepth: 0
      path: s/builder/Assets/Content
    - task: PowerShell@2
      displayName: Build content and write manifest
      inputs:
        pwsh: true
        targetType: inline
        workingDirectory: '$(Pipeline.Workspace)/s/builder'
        script: |
          $ErrorActionPreference = 'Stop'
          if (-not (Test-Path -LiteralPath $env:UNITY_EDITOR)) {
              throw 'Unity 실행 파일을 찾지 못했다.'
          }
          $unityArgs = @(
              '-batchmode', '-quit',
              '-projectPath', $env:BUILDER_ROOT,
              '-buildTarget', 'Win64',
              '-executeMethod', 'ContentBuildEntry.Build',
              '-logFile', '-'
          )
          & $env:UNITY_EDITOR @unityArgs | Out-Host
          if ($LASTEXITCODE -ne 0) { throw 'Unity 프로세스가 실패했다.' }

          $builderCommit = & git -C $env:BUILDER_ROOT rev-parse HEAD
          if ($LASTEXITCODE -ne 0) { throw '빌더 커밋 확인 실패' }
          $contentCommit = & git -C $env:CONTENT_ROOT rev-parse HEAD
          if ($LASTEXITCODE -ne 0) { throw '콘텐츠 커밋 확인 실패' }

          $manifestScript = Join-Path $env:BUILDER_ROOT 'ci/ContentArtifact.ps1'
          $manifestArgs = @{
              Mode = 'Write'
              Root = $env:CONTENT_OUTPUT_DIR
              Tag = $env:CONTENT_TAG
              EnvironmentName = $env:CONTENT_PROFILE
              BuilderCommit = $builderCommit
              ContentCommit = $contentCommit
          }
          & $manifestScript @manifestArgs
      env:
        UNITY_EDITOR: $(UnityEditorPath)
        BUILDER_ROOT: $(Pipeline.Workspace)/s/builder
        CONTENT_ROOT: $(Pipeline.Workspace)/s/builder/Assets/Content
        CONTENT_OUTPUT_DIR: $(Build.ArtifactStagingDirectory)/payload
        CONTENT_PROFILE: ${{ parameters.environmentName }}
        CONTENT_TAG: ${{ parameters.contentTag }}
        CONTENT_LOAD_URL: https://cdn.example.invalid/content/$(releasePrefix)
    - publish: '$(Build.ArtifactStagingDirectory)/payload'
      artifact: content

- stage: UploadCandidate
  dependsOn: BuildContent
  condition: and(succeeded(), ${{ eq(parameters.uploadCandidate, true) }})
  jobs:
  - job: Upload
    pool:
      vmImage: ubuntu-latest
    steps:
    - checkout: self
      clean: true
      path: s/builder
    - download: current
      artifact: content
    - task: PowerShell@2
      displayName: Verify downloaded artifact
      inputs:
        pwsh: true
        targetType: inline
        script: |
          $verifyArgs = @{
              Mode = 'Verify'
              Root = $env:ARTIFACT_ROOT
              Tag = $env:CONTENT_TAG
              EnvironmentName = $env:CONTENT_PROFILE
          }
          & $env:CHECKER @verifyArgs
      env:
        CHECKER: $(Pipeline.Workspace)/s/builder/ci/ContentArtifact.ps1
        ARTIFACT_ROOT: $(Pipeline.Workspace)/content
        CONTENT_TAG: ${{ parameters.contentTag }}
        CONTENT_PROFILE: ${{ parameters.environmentName }}
    - task: AzureCLI@2
      displayName: Upload a candidate prefix
      inputs:
        azureSubscription: content-storage-connection
        scriptType: pscore
        scriptLocation: inlineScript
        inlineScript: |
          $ErrorActionPreference = 'Stop'
          $uploadArgs = @(
              'storage', 'blob', 'upload-batch',
              '--account-name', $env:STORAGE_ACCOUNT,
              '--auth-mode', 'login',
              '--destination', 'content',
              '--source', $env:ARTIFACT_ROOT,
              '--destination-path', $env:RELEASE_PREFIX,
              '--overwrite', 'false',
              '--only-show-errors'
          )
          az @uploadArgs
          if ($LASTEXITCODE -ne 0) { throw '후보 업로드 실패' }
      env:
        STORAGE_ACCOUNT: $(ContentStorageAccount)
        ARTIFACT_ROOT: $(Pipeline.Workspace)/content
        RELEASE_PREFIX: $(releasePrefix)
~~~

### 경로와 입력을 따라 읽기

`path`는 `Pipeline.Workspace` 아래의 checkout 위치다. 빌더 안의 `Assets/Content`는 해당 프로젝트에서 콘텐츠가 들어오도록 정한 경로여야 한다. 부모 저장소를 먼저 checkout하고 자식 경로를 준비한다. 기존 내용과 정리 순서가 충돌하는 구성에서는 경로를 분리하고 별도 가져오기 단계를 설계한다.

`ref`의 `${{ parameters.contentTag }}`는 YAML을 준비하는 시점의 템플릿 표현식이다. 명령줄에서 뒤늦게 태그를 바꾸는 구조가 아니다. 일반 변수와 지원 범위가 다르다. [저장소 리소스 스키마](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-repositories-repository?view=azure-pipelines) 문자열 인자는 스크립트 본문에 끼워 넣기보다 환경 변수로 전달했다.

업로드 Job의 `download: current`는 **같은 파이프라인 실행**이 게시한 `content`를 받는다. 머신에 우연히 남은 폴더나 다른 최신 실행의 아티팩트를 사용하지 않는다.

### Unity 종료와 실패 전달

`-batchmode`는 배치 실행, `-projectPath`는 프로젝트 선택, `-buildTarget`은 학습의 Windows 64비트 대상, `-executeMethod`는 Editor 폴더의 static 진입점, `-quit`는 작업 후 종료를 위한 인수다. C#은 오류 시 0이 아닌 종료 코드를 요청하고 호출 스크립트도 확인한다. [Unity CLI 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/EditorCommandLineArguments.html)와 대조했지만 이 조합을 Unity에서 실행하지 않았다.

`-logFile -`는 로그를 작업 출력으로 보낸다. 원본 업무 로그를 공개 글에 붙인 것은 아니다. 실제 운용에서는 접근 가능한 빌드 로그와 실패 당시 환경 정보의 보존 범위를 따로 정한다.

### 업로드와 배포 완료의 차이

`AzureCLI@2`는 Linux에서도 PowerShell Core를 실행할 수 있다. 서비스 연결로 인증하고 `--auth-mode login`을 사용하며 Storage 키는 넣지 않는다. Azure 구독 접근과 Blob 데이터 업로드 권한은 별도로 확인한다. [Azure CLI 작업](https://learn.microsoft.com/en-us/azure/devops/pipelines/tasks/reference/azure-cli-v2?view=azure-pipelines), [Blob 업로드 명령](https://learn.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az-storage-blob-upload-batch)

`cdn.example.invalid`는 실행용 주소가 아니다. 실제 Storage 컨테이너와 원본 경로를 가리키는 읽기 URL로 바꾸고 카탈로그의 URL과 업로드 접두사를 맞춰야 한다. 다르면 업로드가 성공해도 로드는 실패할 수 있다.

`--overwrite false`는 기존 파일을 덮어쓰지 않기 위한 선택이다. 부분 업로드 뒤 재시도가 성공하도록 만드는 멱등성 구현은 아니다. 기존 파일의 동일성 검사나 새 릴리스 식별자 등 재시도 규칙이 더 필요하다.

일괄 업로드는 여러 파일의 원자적 게시도 아니다. 이 예제는 아직 클라이언트가 선택하지 않는 후보 경로에 파일을 올린다. 원격 파일과 카탈로그 참조 번들, 실제 로드를 확인한 다음 사용할 카탈로그를 전환하는 과정은 별도로 구현해야 한다. CDN 캐시 정책·전환·롤백까지 완료했다고 쓰지 않는다.

## 실습 1 머신이 바뀌면 파일을 어떻게 전달할까

빌드 Job은 머신 A에서 성공했고 업로드 Job은 머신 B에서 시작했다. 두 곳에 같은 `output` 경로를 적었다.

1. B에서 A의 결과를 바로 읽을 수 있는가?
2. B에서 다시 빌드하면 같은 결과라는 보장이 생기는가?
3. 어떤 자료를 전달하고 대조해야 하는가?

### 풀이

같은 문자열은 같은 파일 시스템을 뜻하지 않는다. 명시적으로 접근 가능한 공유 저장소를 사용하는 경우가 아니라면 아티팩트 게시·다운로드가 필요하다. B에서 재빌드하면 입력·캐시·도구가 달라져 A에서 검사한 결과와 다른 파일을 업로드할 수 있다.

같은 실행의 아티팩트와 manifest를 전달하고 경로·길이·해시·요청한 환경·태그를 대조한다. 이 검사는 전송 전후 파일 관계를 확인한다. Unity와 클라우드의 실행 성공을 대신 증명하지 않는다.

## 실습 2 Unity 없이 산출물 전달 검사하기

빈 연습 폴더에 예제 2를 `ContentArtifact.ps1`로 저장한다. 아래는 `Prepare-Sample.ps1`로 저장한다. 기존 폴더를 지우지 않으며 대상 폴더가 있으면 중단한다.

~~~powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$sampleRoot = Join-Path $PSScriptRoot 'artifact-sample'
if (Test-Path -LiteralPath $sampleRoot) {
    throw '새 연습 폴더에서 실행한다.'
}
New-Item -ItemType Directory -Path $sampleRoot | Out-Null
$catalogArgs = @{
    LiteralPath = Join-Path $sampleRoot 'catalog_demo.json'
    Value = '{"demo":true}'
    Encoding = 'utf8NoBOM'
}
Set-Content @catalogArgs
$bundleArgs = @{
    LiteralPath = Join-Path $sampleRoot 'demo.bundle'
    Value = '실제 번들이 아닌 파일 전달 실습 데이터'
    Encoding = 'utf8NoBOM'
}
Set-Content @bundleArgs
$inputArgs = @{
    Root = $sampleRoot
    Tag = 'v1.0.2.7'
    EnvironmentName = 'dev'
}
$writeArgs = @{
    Mode = 'Write'
    BuilderCommit = 'a' * 40
    ContentCommit = 'b' * 40
}
$checker = Join-Path $PSScriptRoot 'ContentArtifact.ps1'
& $checker @writeArgs @inputArgs
& $checker -Mode Verify @inputArgs
~~~

PowerShell 7에서 `pwsh -File ./Prepare-Sample.ps1`로 실행한다. 확장자만 카탈로그·번들과 같은 **가상 텍스트 파일** 두 개를 만든다. Unity가 읽을 수 있는 데이터가 아니다. 반복 문자열 커밋도 학습용 값이며 실제 이력을 가리키지 않는다.

### 풀이와 확인한 출력

~~~text
목록 생성: 2개 파일
검사 통과: 2개 파일
~~~

본문에서 추출한 두 PowerShell 스크립트를 Windows의 PowerShell 7에서 실행해 이 출력을 확인했다. 다음 실습의 변조·누락·추가·환경 불일치도 별도 샘플에서 거부하는지 확인했다. 실제 Unity 빌드·Azure Artifact 전달·Blob 업로드 성공 결과는 아니다.

## 실습 3 바뀐 파일과 잘못된 환경을 찾기

각 실험에는 새 샘플 복사본을 사용한다. 모든 변경을 한 폴더에 누적하면 첫 오류만 보일 수 있다.

| 바꿀 조건 | 예상 판정 | 이유 |
| --- | --- | --- |
| bundle의 글자 하나를 같은 길이로 변경 | 실패 | 크기가 같아도 SHA-256이 달라짐 |
| 카탈로그 삭제 | 실패 | 필수 카탈로그가 없음 |
| 여분의 파일 추가 | 실패 | manifest와 파일 수가 다름 |
| 파일 하나의 이름 변경 | 실패 | 개수는 같아도 목록 경로가 다름 |
| manifest는 dev인데 검사 인자는 qa | 실패 | 환경이 다름 |
| 검사 태그를 v1.0.2.8로 변경 | 실패 | 요청 버전이 다름 |

### 풀이

“폴더가 비어 있지 않다”와 “이번 빌드의 올바른 파일 집합이다”는 다르다. 개수만 맞아도 부족하다. 경로와 길이를 포함한 목록을 맞추고 해시도 대조한다.

예제는 manifest 자체의 수정과 저장소 권한까지 보호하는 서명 시스템이 아니다. 게시 주체와 실행 결과를 신뢰할 수 있게 관리하는 것은 별도 책임이다.

## 실습 4 버전과 경로를 계산하고 호환성 판단하기

태그는 `v1.0.2.7`, 환경은 `qa`, 플랫폼은 `StandaloneWindows64`다.

1. Blob의 후보 접두사는 무엇인가?
2. 업로드 위치를 dev로 잘못 지정했다면 해시만으로 찾을 수 있는가?
3. 스크립트 버전만 2에서 3으로 바꾸면 모든 기존 Player에서 같은 카탈로그를 써도 되는가?
4. 이전 번들을 삭제한 뒤 카탈로그만 되돌리면 롤백되는가?

### 풀이

접두사는 `qa/StandaloneWindows64/v1.0.2.7`다. 같은 파일을 잘못된 환경에 올리면 해시는 그대로다. 예상 환경·접두사·카탈로그 Load URL도 검사해야 한다. 로컬 Verify는 예상 환경을 비교하지만 실제 업로드 목적지를 읽어 검증하지는 않는다.

버전 규칙만으로 Player 호환성을 보장하지 못한다. 타입·직렬화·어셈블리와 콘텐츠의 관계를 확인해야 한다. 카탈로그가 같아도 필요한 번들이 없으면 로드할 수 없다. 롤백 대상은 선택 정보·카탈로그·참조 번들·호환 Player를 함께 생각한다.

## 실습 5 실패 지점과 다음에 모을 증거 정하기

| 증상 | 먼저 볼 자료 |
| --- | --- |
| checkout 전에 인증 실패 | 서비스 연결·저장소 사용 권한·태그 존재 |
| Unity가 실행되지 않음 | OS·설치 경로·버전·플랫폼 모듈 |
| 파일은 생성됐는데 Job이 끝나지 않음 | 프로세스 종료·-quit·진행 로그 |
| 프로세스 성공인데 카탈로그가 없음 | 프로필·원격 그룹·카탈로그 설정·출력 경로 |
| 받은 산출물의 태그가 다름 | 어느 실행·이름의 아티팩트를 받았는가 |
| 업로드 성공인데 런타임 로드 실패 | 원격 URL·카탈로그 참조·누락 번들·호환성 |

### 풀이

한 단계가 성공했다고 다음 단계까지 성공한 것은 아니다. 로그의 마지막 문장만 보지 않고 최초 실패와 입력·출력·종료 코드를 연결한다. 콜드 빌드와 종료 누락도 분리한다.

위 표는 조사 순서이며 이 조건을 Azure에서 모두 재현한 결과가 아니다. 라이선스·패키지 다운로드 등 다른 실패를 분석하려면 해당 실행의 로그와 환경을 별도로 확인한다.

## 확인한 내용과 남은 실행 검증

| 대상 | 이번 확인 범위 |
| --- | --- |
| 당시 목표·에이전트·태그·아티팩트·업로드 구성 | 노션 기록에서 확인 |
| 당시 원본 전체 YAML·정확한 설치 환경·전후 측정 | 이번에는 확보하지 않음 |
| Azure 작업과 Unity API | 연결한 공식 문서와 대조 |
| PowerShell 파일 목록 생성·검사 | 가상 파일로 Windows의 PowerShell 7에서 실행 |
| Azure YAML | 일반 YAML 파싱 확인, Azure 템플릿 확장·서비스 검증은 미실행 |
| Unity C# 진입점·실제 번들 생성 | 컴파일·실행 미확인 |
| 에이전트 사이 실제 아티팩트 전달 | 미실행 |
| 서비스 연결·Blob·CDN·Player 로딩·롤백 | 미실행 |

예제·파일 검증·실습·설명 그림은 AI의 도움을 받아 새로 작성했다. 실제 계정의 파이프라인을 변경하거나 업로드하지 않았다. 검사를 통과한 가상 데이터는 Unity 자산의 유효성이나 실서비스 배포 성공을 증명하지 않는다.

남은 실행 확인은 버전·프로필을 고정한 CI 전용 프로젝트의 빌드와 산출물 전달·원격 로드다. 실행 후에는 실행 ID·커밋·실제 파일과 미해결 항목을 추가한다.
