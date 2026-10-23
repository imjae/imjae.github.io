---
title: "Unity CI에서 라이선스 메시지와 패키지 다운로드 실패를 구분한 과정"
description: "노션의 Addressables 버전 변경·연결 시간 초과 기록을 분석합니다. 로그와 의존성 비교 예제, 실습·풀이를 통해 복구 결과와 아직 확인하지 못한 원인을 구분합니다."
slug: "unity-ci-package-download-failure"
date: "2024-04-29"
dateBasis: "notion"
updated: "2026-10-23"
topic: "tools"
kind: "case-study"
tags: ["Unity", "Addressables", "Azure DevOps", "CI/CD", "PowerShell", "Verification"]
draft: false
---

## 먼저 보인 인증 메시지가 실패 원인을 설명하지 못했습니다

<div id="먼저-보인-인증-메시지가-실패-원인을-설명하지-못했다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

기존에 동작하던 Windows 콘텐츠 빌드가 CI에서 실패했습니다. Azure 작업 출력에는 `Access token is unavailable; failed to update`라는 메시지가 있었습니다. 앞서 파이프라인 권한 문제를 여러 번 겪었던 탓에 이 메시지를 Azure 인증 오류로 해석하고 조사했습니다.

조사 방향이 바뀐 계기는 빌드 머신의 Unity Editor 로그였습니다. 패키지 의존성 해석 오류와 `connect ETIMEDOUT`가 있었고, 의도하지 않은 Addressables 버전 변경도 확인했습니다. 빌더의 버전을 `1.21.19`에서 기존 `1.21.18`로 복원한 뒤 해결했다고 [노션의 「어드레서블 버전」 기록](https://app.notion.com/p/ab1b0ca0622b4514b3926b4a0fd82fe1)에 적혀 있습니다.

여기서 구분할 것이 있습니다. **버전 복원 뒤 문제가 해결됐다는 기록은 있지만, 1.21.19 자체의 결함이 원인이었다는 통제 실험은 없습니다.** 다운로드가 왜 시간 초과됐는지, 캐시와 네트워크가 어떤 상태였는지는 이 기록만으로 확정할 수 없습니다.

이 글은 패키지 다운로드 실패의 조사 과정을 설명합니다. 예제에는 가상 데이터를 사용합니다. 정상적인 빌드·전달·업로드 흐름은 [Azure 콘텐츠 빌드·배포 글](/writing/azure-devops-content-build-deploy/)에서 이어서 볼 수 있습니다.

## 노션에서 확인한 관찰과 당시 대응

| 단계 | 기록에서 확인한 내용 | 여기까지 말할 수 있는 것 |
| --- | --- | --- |
| 실패 관찰 | 기존 Windows 빌드가 실패하고 토큰 관련 메시지가 보임 | 파이프라인이 실패했고 해당 메시지가 출력됨 |
| 초기 조사 | 이전 권한 문제와 연결해 Azure 설정을 조사함 | 조사 가설이 인증 쪽으로 기울었음 |
| 반대 증거 | 다른 빌드 파이프라인에도 같은 메시지가 있었고 빌드에 영향을 주지 않았다고 기록 | 메시지 하나만으로 이번 실패를 설명하기 어려움 |
| 로그 확장 | Windows 빌드 머신에서 Editor 로그 확인 | CI 요약 밖의 실패 지점을 조사함 |
| 패키지 오류 | 의존성 해석 실패와 Addressables·Scriptable Build Pipeline 관련 연결 시간 초과 | 패키지 준비 단계의 실패를 우선 조사할 근거 |
| 변경 확인 | 설정 시험 중 Addressables 1.21.18→1.21.19가 커밋에 포함됨 | 의도하지 않은 빌드 입력 변경 |
| 복구 | 빌더의 Addressables를 1.21.18로 복원해 해결했다고 기록 | 당시의 복구 조치와 결과에 대한 기록 |

의존성 버전을 복원한 뒤 빌드가 해결되었습니다. 다만 기록에는 당시 `packages-lock.json`의 변경 내용이 남아 있지 않아, manifest 복원과 lock 변경 중 어느 범위까지 영향을 주었는지는 구분하기 어렵습니다.

## 개념 1 CI 실패를 작업 단계와 로그 출처로 나누기

콘텐츠 CI의 실패 지점은 여러 곳입니다. Git checkout 권한, Unity 라이선스, 패키지 다운로드, 스크립트 컴파일, 콘텐츠 생성, 산출물 업로드는 서로 다른 작업입니다. “토큰”이라는 단어도 Git·Azure 서비스 연결·Unity 인증 중 어느 주체가 출력했는지 먼저 확인해야 합니다.

~~~mermaid
flowchart TD
    C["저장소 checkout"] --> U["Unity 시작·라이선스 확인"]
    U --> P["패키지 의존성 해석·준비"]
    P --> S["스크립트 컴파일·프로젝트 준비"]
    S --> B["사용자 콘텐츠 빌드 함수"]
    B --> A["산출물 검사·전달·업로드"]
    P --> E["Editor·UPM 로그와 버전 변경 확인"]
~~~

이 그림은 조사할 단계를 정리한 것입니다. Unity 내부의 모든 작업이 항상 이 순서로 한 번씩만 실행된다는 뜻은 아닙니다. Unity 공식 문서는 프로젝트를 로드하기 전에 Package Manager 프로세스를 시작한다고 설명합니다. 따라서 사용자 빌드 함수가 실행되기 전에도 패키지 문제로 막힐 수 있습니다. [UPM 네트워크 진단 문서](https://docs.unity3d.com/2022.3/Documentation/Manual/upm-network.html)

예를 들어 콘텐츠 빌드 코드만 고쳐도 프로젝트를 열 때 필요한 패키지를 준비하지 못하면 그 코드까지 도달하지 못할 수 있습니다. 반대로 함수 진입 표식이 없다는 사실 하나만으로 미진입을 확정할 수도 없습니다. 로그 누락·수집 범위·표식 구현 여부를 함께 봐야 합니다.

| 로그 출처 | 주로 확인할 내용 | 해석상의 한계 |
| --- | --- | --- |
| Azure 작업 출력 | 실행한 명령·작업 종료·외부 도구 출력 | Editor 상세 메시지가 모두 보장되지는 않음 |
| Editor 로그 | 프로젝트 준비·패키지 오류·컴파일·빌드 출력 | 다른 실행의 로그를 가져오지 않았는지 확인 |
| UPM 로그 | 패키지 요청·의존성·네트워크 상세 | 실제 실행 계정과 로그 수집 시간 확인 |
| Licensing Client 로그 | Unity 라이선스 관련 처리 | Azure 저장소 권한과 같은 문제로 취급하지 않음 |

Unity는 Editor·Package Manager·Licensing Client의 로그를 구분합니다. Windows에서도 사용자 계정과 SYSTEM 계정의 UPM 로그 위치가 다를 수 있습니다. 직접 로그인한 계정의 로그가 CI 에이전트가 남긴 로그와 같다고 가정하지 않습니다. 위치는 사용하는 에디터 버전의 [로그 파일 문서](https://docs.unity3d.com/2022.3/Documentation/Manual/LogFiles.html)에서 확인합니다.

노션에는 Editor 로그를 확인한 과정이 있습니다. 당시 별도의 UPM 진단 도구까지 실행했다고 기록되어 있지는 않습니다. UPM 로그와 진단 보고서를 더 모으는 것은 이 글에서 제안하는 후속 조사입니다.

## 개념 2 시간 초과는 인증 거부나 패키지 결함과 다릅니다

<div id="개념-2-시간-초과는-인증-거부나-패키지-결함과-다르다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`ETIMEDOUT`는 제한된 시간 안에 연결·요청에 필요한 응답을 얻지 못했다는 오류 신호입니다. 원문에는 `connect ETIMEDOUT`가 있어 연결 단계의 시간 초과를 조사할 근거가 있습니다. 오류 코드의 정의는 [Node.js 오류 문서](https://nodejs.org/api/errors.html#etimedout-operation-timed-out)에서 볼 수 있습니다. 이것만으로 당시 UPM 내부 런타임이나 세부 원인을 특정하지는 않습니다.

| 관찰 신호 | 우선 구분할 문제 | 바로 단정하면 안 되는 것 |
| --- | --- | --- |
| 이름 조회 실패 | DNS·호스트명·프록시 설정 | 패키지 코드의 버그 |
| `connect ETIMEDOUT` | 대상 연결·네트워크 경로·프록시·응답 지연 | HTTP 401·403을 받았다는 주장 |
| TLS 인증서 오류 | 인증서 체인·프록시·머신 신뢰 설정 | 버전 다운그레이드가 정식 해결책이라는 주장 |
| HTTP 401·403 | 해당 요청의 인증·권한 | 모든 토큰 메시지가 같은 서비스라는 주장 |
| 패키지 버전을 찾지 못함 | 레지스트리·버전 존재·소스 설정 | 연결 시간 초과와 같은 실패라는 주장 |
| 패키지 로드 뒤 컴파일 오류 | API·어셈블리·의존성 호환성 | 다운로드 자체가 실패했다는 주장 |

위 표는 조사용 구분입니다. 이번 노션 로그에서 모든 유형이 관찰된 것은 아닙니다. 특히 `Project has invalid dependencies`는 잘못된 버전 문자열만 뜻하지 않습니다. 이어진 상세 메시지가 패키지를 가져오지 못한 이유를 설명하는지 읽어야 합니다.

Unity 문서는 패키지 설치 문제의 조사 대상으로 캐시 폴더 권한, 네트워크, 방화벽·프록시를 제시합니다. 이 사건에서 어느 항목이 원인이었다는 증거는 없습니다. [UPM 문제 해결 문서](https://docs.unity.com/en-us/engine/6000.0/manual/packages-list/upm-errors) 이 문서는 추가 조사 항목을 확인하는 용도이며 당시 설치 버전이 Unity 6이었다는 근거로 사용하지 않습니다.

## 개념 3 manifest·lock·캐시를 함께 읽기

패키지 버전이 바뀌었다면 직접 요청과 해석 결과를 나눠 봅니다.

| 항목 | 역할 | CI에서 비교할 것 |
| --- | --- | --- |
| `Packages/manifest.json` | 프로젝트의 직접 의존성과 레지스트리 설정 | Addressables 요청·소스·설정 변경 |
| `Packages/packages-lock.json` | UPM이 해석해 기록한 패키지 집합과 관계 | 간접 의존성·버전·소스 차이 |
| `ProjectSettings/ProjectVersion.txt` | 프로젝트의 에디터 버전 정보 | 실제 실행한 Unity 버전과의 일치 여부 |
| 프로젝트·전역 패키지 캐시 | 이미 가져온 패키지를 재사용하는 상태 | 신규 다운로드 유무·계정·캐시 조건 |

프로젝트 manifest의 `dependencies`는 직접 의존성을 선언합니다. Addressables를 요청했다고 manifest 안에 모든 간접 패키지를 직접 나열해야 하는 것은 아닙니다. [프로젝트 manifest 문서](https://docs.unity3d.com/2022.3/Documentation/Manual/upm-manifestPrj.html)

UPM은 해석 결과를 lock에 저장합니다. Unity는 lock을 버전 관리하고 손으로 수정하지 말라고 안내합니다. 복구할 때는 정상 커밋의 manifest와 lock을 함께 대조하고, 대상 Unity에서 의존성을 해석한 결과까지 확인합니다. lock만 직접 수정하면 UPM이 변경 내용을 다시 덮어쓸 수 있습니다. [lock 파일 문서](https://docs.unity3d.com/2022.3/Documentation/Manual/upm-conflicts-auto.html)

캐시는 또 다른 변수입니다. 기존 버전이 머신에 이미 있고 새 버전은 다운로드가 필요했다면, 이전 버전의 성공과 새 버전의 실패에는 네트워크 접근 여부도 섞입니다. 이는 가능한 가설이며 당시 캐시 상태를 확인한 사실이 아닙니다. lock이 같아도 네트워크·라이선스·빌드 결과까지 보장되는 것은 아닙니다.

로그에는 Scriptable Build Pipeline도 관련 패키지로 등장합니다. 정확한 간접 의존 관계와 버전 변경 여부는 전체 의존성 그래프가 있어야 파악할 수 있습니다.

## 문제를 해결한 과정에서 무엇이 달라졌나

### 1 인증이라는 첫 가설을 비교 자료로 점검했습니다

<div id="1-인증이라는-첫-가설을-비교-자료로-점검했다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

같은 메시지가 있는 다른 빌드가 동작했다는 기록은 “이 문장이 있으면 반드시 이번과 같은 이유로 실패한다”는 해석을 약하게 만듭니다. 그래서 Azure 권한 설정을 계속 바꾸기보다 실제 실패 지점을 더 볼 필요가 있었습니다.

이 말은 모든 Unity 라이선스 오류가 무해하다는 뜻이 아닙니다. 성공한 비교 실행의 동일 메시지와 이번 실패의 후속 오류를 함께 읽자는 뜻입니다. 원문에 성공 실행 전체가 보관되어 있지는 않으므로, 아래 비교 로그는 그 판단을 연습하기 위한 가상 사례입니다.

### 2 빌드를 실행한 머신의 Editor 로그로 조사 범위를 넓혔습니다

<div id="2-빌드를-실행한-머신의-editor-로그로-조사-범위를-넓혔다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

Editor 로그에서 의존성 해석 실패와 두 개의 `ETIMEDOUT` 신호를 확인했습니다. 그 결과 저장소 접근 권한만의 문제가 아니라 Unity의 패키지 준비 실패를 조사할 이유가 생겼습니다.

로그에서 맨 처음 보이는 `Error`가 언제나 근본 원인인 것은 아닙니다. 뒤의 실패가 앞의 실패에서 파생됐는지, 다른 하위 시스템의 메시지인지 확인합니다. 서로 다른 로그를 합칠 때도 파일 내부 줄 순서를 전체 실행의 시간 순서로 오해하지 않습니다. 실행 ID·프로세스·시각의 기준을 맞춰야 합니다.

### 3 의도하지 않은 패키지 변경을 찾아 이전 버전으로 복구했습니다

<div id="3-의도하지-않은-패키지-변경을-찾아-이전-버전으로-복구했다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

설정 시험 과정의 `1.21.19` 업데이트가 커밋에 들어갔고 빌드 머신에 반영되어 있었습니다. 노션은 빌더의 Addressables를 기존 `1.21.18`로 되돌려 해결했다고 적었습니다. 실제 조치는 이 버전 복원이었습니다.

복구는 서비스를 다시 진행할 수 있게 하는 작업이고, 원인 확정은 다른 후보를 통제해 설명을 검증하는 작업입니다. 이번 기록으로는 **의도하지 않은 버전 변경을 되돌린 복구**와 **그 전 실행의 다운로드 시간 초과**까지 연결할 수 있습니다. 새 버전의 코드 결함, 일시적 레지스트리 장애, 프록시 제한, 캐시 차이 중 무엇이 결정적이었는지는 남습니다.

## 예제: 네트워크 없이 로그 신호 찾기

PowerShell 7만 사용합니다. Unity·Azure 계정·실제 패키지 다운로드는 필요 없습니다. 예제는 두 종류의 자료를 만듭니다.

1. 실패·성공·로그 누락을 비교하는 가상 로그
2. 직접 의존성 하나가 달라진 두 manifest

예제의 성공 로그와 종료 코드, `[CONTENT_BUILD]` 표식은 **실습용으로 만든 값**입니다. 원문에 있는 실행 출력을 발췌한 것이 아닙니다. 실제 CI에 적용하려면 빌드 함수의 진입·완료와 Unity 프로세스의 종료 코드를 별도로 수집하도록 구현해야 합니다.

### 예제 1 가상 로그와 manifest 만들기

빈 연습 폴더에 다음을 `Prepare-CiSample.ps1`로 저장합니다. `ci-samples`가 이미 있으면 중단하며 기존 폴더를 삭제하지 않습니다.

~~~powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$sampleRoot = Join-Path $PSScriptRoot 'ci-samples'
if (Test-Path -LiteralPath $sampleRoot) {
    throw '새 연습 폴더에서 실행한다.'
}
New-Item -ItemType Directory -Path $sampleRoot | Out-Null

$samples = [ordered]@{
    'failed-pipeline.log' = @'
[CI] Unity launched
[Licensing] Error: Access token is unavailable; failed to update
CI_UNITY_EXIT_CODE=1
'@
    'failed-editor.log' = @'
An error occurred while resolving packages: Project has invalid dependencies
com.unity.addressables@1.21.19
connect ETIMEDOUT
com.unity.scriptablebuildpipeline
connect ETIMEDOUT
'@
    'success-pipeline.log' = @'
[CI] Unity launched
[Licensing] Error: Access token is unavailable; failed to update
CI_UNITY_EXIT_CODE=0
'@
    'success-editor.log' = @'
[Package Manager] Packages resolved
[CONTENT_BUILD] BEGIN
[CONTENT_BUILD] END
'@
    'unknown-pipeline.log' = '[CI] Output collection ended early'
    'unknown-editor.log' = '[Editor] Starting'
}
foreach ($entry in $samples.GetEnumerator()) {
    $entry.Value | Set-Content -LiteralPath (
        Join-Path $sampleRoot $entry.Key) -Encoding utf8NoBOM
}

foreach ($item in @(
    @{ Name = 'before.json'; Version = '1.21.18' },
    @{ Name = 'after.json'; Version = '1.21.19' }
)) {
    @{ dependencies = @{ 'com.unity.addressables' = $item.Version } } |
        ConvertTo-Json -Depth 3 |
        Set-Content -LiteralPath (Join-Path $sampleRoot $item.Name) `
            -Encoding utf8NoBOM
}
Write-Output '예제용 로그 6개와 manifest 2개 생성'
~~~

`pwsh -File ./Prepare-CiSample.ps1`로 실행합니다. 두 JSON은 실제 프로젝트의 manifest가 아니라 비교에 필요한 필드만 가진 예제 데이터입니다. Scriptable Build Pipeline의 실제 선택 버전을 만들어 넣지 않았습니다.

### 예제 2 신호를 모으되 원인을 자동 판정하지 않기

다음은 같은 폴더의 `Get-CiSignals.ps1`입니다. 파일별 줄 번호와 미리 정한 신호 이름을 출력합니다. 로그 원문 전체를 다시 출력하지 않습니다. 임의의 업무 로그를 공개해도 안전하게 만드는 익명화 도구는 아닙니다.

~~~powershell
param(
    [Parameter(Mandatory)][string]$PipelineLog,
    [Parameter(Mandatory)][string]$EditorLog
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$signals = [Collections.Generic.List[object]]::new()
$packages = [Collections.Generic.HashSet[string]]::new(
    [StringComparer]::Ordinal)
$exitCodes = [Collections.Generic.List[int]]::new()
$beginCount = 0
$endCount = 0
$rules = [ordered]@{
    'license-token' = 'Access token is unavailable; failed to update'
    'package-resolution' = 'An error occurred while resolving packages'
    'connect-timeout' = '\bconnect\s+ETIMEDOUT\b'
}

foreach ($source in @(
    @{ Name = 'Pipeline'; Path = $PipelineLog },
    @{ Name = 'Editor'; Path = $EditorLog }
)) {
    if (-not (Test-Path -LiteralPath $source.Path -PathType Leaf)) {
        throw "$($source.Name) 로그 파일이 없다."
    }
    $raw = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $source.Path).Path)
    $lines = [regex]::Split($raw, '\r\n|\n|\r')
    for ($index = 0; $index -lt $lines.Length; $index++) {
        $line = $lines[$index]
        foreach ($rule in $rules.GetEnumerator()) {
            if ($line -match $rule.Value) {
                $signals.Add([ordered]@{
                    source = $source.Name
                    line = $index + 1
                    kind = $rule.Key
                })
            }
        }
        foreach ($match in [regex]::Matches(
            $line, '\bcom\.unity\.[a-z0-9.-]+\b')) {
            [void]$packages.Add($match.Value)
        }
        if ($source.Name -eq 'Pipeline' -and
            $line -match '^CI_UNITY_EXIT_CODE=(-?\d+)$') {
            $exitCodes.Add([int]$Matches[1])
        }
        if ($source.Name -eq 'Editor') {
            if ($line -eq '[CONTENT_BUILD] BEGIN') { $beginCount++ }
            if ($line -eq '[CONTENT_BUILD] END') { $endCount++ }
        }
    }
}

$markerState = if ($exitCodes.Count -eq 0) { 'absent' }
    elseif ($exitCodes.Count -eq 1) { 'single' }
    else { 'multiple' }
$exitCode = if ($exitCodes.Count -eq 1) { $exitCodes[0] } else { $null }
[ordered]@{
    signals = @($signals.ToArray())
    packages = @($packages | Sort-Object)
    exitMarkerState = $markerState
    unityExitCode = $exitCode
    buildBeginCount = $beginCount
    buildEndCount = $endCount
} | ConvertTo-Json -Depth 5
~~~

실패 사례는 `pwsh -File ./Get-CiSignals.ps1 -PipelineLog ./ci-samples/failed-pipeline.log -EditorLog ./ci-samples/failed-editor.log`로 읽습니다. 파일이 실제로 없으면 중단합니다. 파일은 있지만 종료 표식이 없으면 `absent`와 `null`입니다. 같은 파일에 여러 실행의 종료 표식이 섞이면 `multiple`과 `null`로 남깁니다.

이 스크립트의 종료 코드는 **파일을 분석한 도구의 종료 코드**입니다. JSON의 `unityExitCode`는 가상 로그 안의 표식입니다. 분석 도구가 0으로 끝나도 기록 속 Unity 실행이 성공한 것은 아닙니다. 실제 파이프라인의 성공·실패를 결정하는 도구로 그대로 연결하지 않습니다.

### 풀이: 실패 사례의 출력 읽기

~~~json
{
  "signals": [
    { "source": "Pipeline", "line": 2, "kind": "license-token" },
    { "source": "Editor", "line": 1, "kind": "package-resolution" },
    { "source": "Editor", "line": 3, "kind": "connect-timeout" },
    { "source": "Editor", "line": 5, "kind": "connect-timeout" }
  ],
  "packages": ["com.unity.addressables", "com.unity.scriptablebuildpipeline"],
  "exitMarkerState": "single",
  "unityExitCode": 1,
  "buildBeginCount": 0,
  "buildEndCount": 0
}
~~~

출력의 공백 배치를 줄여 적었습니다. 신호는 네 개이고 연결 시간 초과는 두 개입니다. 패키지 준비 실패를 더 조사할 근거가 있지만 자동으로 “패키지 버그”라는 결론은 내리지 않습니다. `packages`도 문자열을 찾은 목록이며 완전한 의존성 그래프나 각 오류의 소속을 해석한 결과가 아닙니다.

표식 수가 0인 것은 이 가상 파일 안에 해당 표식이 없다는 뜻입니다. 함수가 실행됐어도 표식이 다른 형식이면 집계되지 않을 수 있습니다. 표식은 예제의 정확한 줄 형식을 전제로 하므로 실제 로그의 시각·접두사·출력 형식에 맞춘 수집 규칙이 더 필요합니다.

### 예제 3 직접 의존성 변경 비교하기

다음은 `Compare-Dependencies.ps1`로 저장합니다. JSON 두 개의 직접 의존성 요청 차이를 찾습니다. registry·lock·캐시·실제 설치 결과를 비교하는 프로그램은 아닙니다.

~~~powershell
param(
    [Parameter(Mandatory)][string]$Before,
    [Parameter(Mandatory)][string]$After
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
function Read-Dependencies([string]$Path) {
    $document = Get-Content -LiteralPath $Path -Raw |
        ConvertFrom-Json -AsHashtable
    if ($document -isnot [Collections.IDictionary] -or
        -not $document.Contains('dependencies') -or
        $document.dependencies -isnot [Collections.IDictionary]) {
        throw 'dependencies 객체가 필요하다.'
    }
    foreach ($value in $document.dependencies.Values) {
        if ($value -isnot [string]) { throw '의존성 요청은 문자열이어야 한다.' }
    }
    return ,$document.dependencies
}
$left = Read-Dependencies $Before
$right = Read-Dependencies $After
$names = @(@($left.Keys) + @($right.Keys) | Sort-Object -Unique)
$changed = 0
foreach ($name in $names) {
    $old = if ($left.Contains($name)) { $left[$name] } else { '(없음)' }
    $new = if ($right.Contains($name)) { $right[$name] } else { '(없음)' }
    if ($old -cne $new) {
        Write-Output "${name}: $old -> $new"
        $changed++
    }
}
Write-Output "직접 의존성 변경: $changed"
~~~

`pwsh -File ./Compare-Dependencies.ps1 -Before ./ci-samples/before.json -After ./ci-samples/after.json`로 실행합니다.

~~~text
com.unity.addressables: 1.21.18 -> 1.21.19
직접 의존성 변경: 1
~~~

출력은 입력이 바뀌었다는 증거입니다. 새로운 요청이 실제로 설치됐는지, 간접 의존성이 무엇인지, 다운로드 서버가 응답했는지는 따로 확인해야 합니다.

## 실습 1 같은 라이선스 메시지가 있는 성공 실행과 비교하기

`success-pipeline.log`와 `success-editor.log`를 예제 2에 전달합니다.

1. 실패·성공에 공통으로 있는 신호는 무엇인가요?
2. 달라진 종료 코드와 빌드 표식은 무엇인가요?
3. `license-token`을 모든 로그에서 무시하도록 필터링해도 되는가요?

### 풀이

둘 다 `license-token`이 한 개입니다. 성공용 데이터에는 패키지 해석 실패와 연결 시간 초과가 없고 종료 표식은 0입니다. 빌드 진입·완료 표식도 각각 한 개입니다. 실패용 데이터에는 종료 표식 1과 패키지 관련 신호가 있습니다.

같은 메시지의 존재만으로 두 실행의 차이를 설명할 수 없습니다. 그렇다고 라이선스 메시지를 영구 삭제하면 실제 라이선스 실패의 근거도 잃을 수 있습니다. 원본은 보존하고 비교할 때 신호와 후속 실패를 함께 읽습니다. 가상 성공 표식과 종료 코드만으로 실제 카탈로그·번들 유효성까지 보장되는 것도 아닙니다.

## 실습 2 출력 누락을 성공으로 처리하지 않기

다음 세 경우를 비교합니다.

| 조건 | 확인할 값 |
| --- | --- |
| unknown 로그 두 개를 전달 | 종료 표식 상태·종료 코드·신호 목록 |
| 존재하지 않는 Editor 파일을 지정 | 분석 도구가 중단하는가 |
| 실패 Pipeline 복사본에 `CI_UNITY_EXIT_CODE=0` 줄을 추가 | 여러 종료 표식을 어떻게 다루는가 |

### 풀이

unknown 사례는 `signals`와 `packages`가 빈 배열, 상태는 `absent`, 종료 코드는 `null`, 두 빌드 표식 수는 0입니다. 오류 문자열이 없다는 사실은 자료가 충분하다는 뜻이 아닙니다.

파일 자체가 없으면 스크립트가 오류로 중단합니다. 파일은 있지만 표식이 없는 경우와 구분합니다. 여러 종료 표식이 있으면 `multiple`과 `null`입니다. 임의로 마지막 0만 골라 정상 처리하지 않고 실행별 로그 분리가 필요한 상태로 남깁니다.

실제 CI에서 unknown을 어떤 작업 상태로 처리할지는 별도로 정합니다. 이 예제는 자료 부족을 출력할 뿐 배포 허용 정책을 구현하지 않습니다.

## 실습 3 직접 요청과 간접 의존성을 구분하기

1. before와 after를 비교했을 때 바뀐 요청은 무엇인가요?
2. before를 양쪽에 주면 무엇이 출력되는가요?
3. 로그에 Scriptable Build Pipeline이 나온다는 이유로 그 패키지를 manifest에 직접 추가해야 하는가요?
4. `dependencies`가 없는 JSON을 주면 어떻게 되는가요?

### 풀이

Addressables 요청이 1.21.18에서 1.21.19로 바뀌며 변경 수는 1입니다. 같은 파일끼리 비교하면 `직접 의존성 변경: 0`만 나옵니다. 직접 요청이 같아도 lock·에디터·레지스트리·캐시가 같은지는 이 검사로 알 수 없습니다.

로그에 이름이 있다는 이유만으로 간접 패키지를 직접 의존성으로 추가하지 않습니다. 실제 lock과 패키지 manifest에서 관계를 확인합니다. 무작정 직접 버전을 덧붙이면 유지해야 할 의존성 선언이 늘고 기존 해석과 달라질 수 있습니다.

`dependencies` 객체가 없거나 요청 값이 문자열이 아니면 예제는 중단합니다. 오류가 없는 JSON이라는 조건과 비교에 필요한 구조를 가진 JSON이라는 조건은 다릅니다. 이 코드는 Unity manifest 전체 스키마 검증기는 아닙니다.

## 실습 4 복구와 원인 확정에 필요한 자료 나누기

아래 세 문장을 관찰·복구·미확인 가설로 분류합니다.

1. 실패 로그에서 `connect ETIMEDOUT`가 보였습니다.
2. Addressables를 이전 버전으로 복원한 뒤 해결했다고 작업 노트에 적었습니다.
3. Addressables 1.21.19의 코드 결함 때문에 다운로드가 시간 초과됐습니다.

### 풀이

첫 문장은 관찰입니다. 두 번째는 당시 조치와 복구 결과에 대한 기록입니다. 세 번째는 이번 자료로 입증하지 못한 원인 주장입니다.

더 확인하려면 CI 전용 복사본에서 두 패키지 구성을 비교합니다. 에디터·플랫폼·실행 계정·레지스트리·프록시 설정을 맞추고, 각각 정상적으로 해석한 manifest와 lock을 보존합니다. 이전 버전은 캐시가 있고 새 버전만 캐시가 없는 상태를 공정한 버전 비교로 취급하지 않습니다.

콜드 조건과 웜 조건도 나눠 기록합니다. 활성 프로젝트의 캐시를 무작정 삭제하는 대신 별도 작업 복사본과 격리한 캐시 조건을 준비합니다. 두 버전을 번갈아 반복해 시간대의 영향을 살피고, 실패 단계·실제 요청 대상·응답·Editor/UPM 로그·종료 코드를 남깁니다. Unity가 제공하는 UPM 진단 도구도 후속 자료 수집에 사용할 수 있습니다.

반복 비교에서 차이가 나더라도 버전 변경에 따라 함께 달라진 간접 패키지와 요청 경로를 구분해야 원인을 좁힐 수 있습니다.

## 실습 5 다음 실패에서 남길 조사 기록 작성하기

다음 틀을 채워 봅니다. 확인하지 못한 항목은 `미확인`으로 적습니다.

| 항목 | 작성할 내용 |
| --- | --- |
| 실행 식별 | CI 실행 ID·빌더/콘텐츠 커밋·에디터와 대상 플랫폼 |
| 입력 변경 | manifest·lock·레지스트리·빌드 설정의 차이 |
| 최초 실패 후보 | 로그 출처·줄/시각·수행 단계·후속 오류 |
| 비교 실행 | 정상/실패의 공통 메시지와 달라진 신호 |
| 환경 | 에이전트 실행 계정·프록시/네트워크·캐시 조건 |
| 조치와 복구 | 한 번에 바꾼 항목·종료 코드·산출물 확인 범위 |
| 남은 가설 | 버전·의존성·네트워크·캐시 중 아직 분리하지 못한 것 |

### 풀이

이번 기록에는 이전 버전 복원이라는 조치와 해결 설명이 있습니다. 반면 통제한 네트워크·캐시 조건과 복구 후 전체 출력은 부족합니다. 복구됐다는 기록만으로 당시 실패 원인까지 확정할 수는 없습니다.

실제 조사 자료는 접근 가능한 내부 위치에 보존하고, 블로그에는 필요한 오류 종류·변경 항목·판단 근거만 정리합니다. 실행 ID·머신 정보·로그·설정에 포함될 수 있는 비공개 값은 공개용 설명과 구분합니다. 위 표는 당시 모든 항목을 수집했다는 보고가 아니라 앞으로 사용할 기록 틀입니다.

## 예제 작성

설명과 예제 작성에 AI를 활용했습니다.
