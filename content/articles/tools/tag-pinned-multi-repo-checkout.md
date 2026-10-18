---
title: "태그를 고정한 다중 저장소 checkout으로 빌드 입력 맞추기"
description: "노션의 Git 태그 fetch 권한 오류와 Azure 저장소 리소스로 전환한 과정을 정리한다. 태그·커밋·경로 개념, 로컬 Git 실습·풀이와 미실행 Azure 예제를 구분한다."
slug: "tag-pinned-multi-repo-checkout"
date: "2024-04-29"
dateBasis: "notion"
updated: "2026-10-18"
topic: "tools"
kind: "case-study"
tags: ["Git", "Azure DevOps", "CI/CD", "Unity", "PowerShell", "Verification"]
draft: false
---

## 콘텐츠 태그를 가져오는 단계에서 빌드가 막혔다

콘텐츠 빌더와 콘텐츠 자산이 서로 다른 Git 저장소에 있었다. 빌더는 콘텐츠 저장소를 서브모듈로 사용했고, CI에서도 원하는 버전의 콘텐츠를 준비해야 했다. 처음에는 Azure의 CmdLine 작업에서 Git 명령을 실행해 콘텐츠 저장소의 태그를 fetch하고 checkout하려 했다.

그 과정에서 원격 저장소 접근 권한 오류가 발생했다. [노션의 「서브모듈 적용」 기록](https://app.notion.com/p/e06c1f59bc814ee8ad82aadb813cd34b)은 대응으로 `resources.repositories`에 콘텐츠 저장소를 선언하고, 입력한 버전 태그를 `ref`로 지정해 checkout했다고 설명한다. 콘텐츠가 들어갈 경로도 따로 지정했다.

노트 제목은 서브모듈 적용이지만, 기록에 나온 CI 해결 방식은 **저장소 리소스를 선언한 다중 저장소 checkout**이다. `git submodule update` 명령 자체를 수정한 내역은 없다. 원래 빌더 저장소에서 `.gitmodules`나 gitlink를 제거했는지도 이 노트로 확인할 수 없다.

당시 빌더는 `master`의 HEAD, 콘텐츠는 입력한 태그의 커밋을 사용했다고 적혀 있다. 따라서 콘텐츠 선택은 명확해졌지만, 두 저장소의 입력 전체가 영구히 고정된 것은 아니다. 이 글에서는 그 차이를 설명한 뒤, **예상 커밋과 실제 checkout 결과를 비교하는 검사**를 새 예제로 추가한다.

전체 콘텐츠 빌드·아티팩트·Blob 업로드 흐름은 [Azure DevOps 콘텐츠 빌드·배포 글](/writing/azure-devops-content-build-deploy/)에서 다뤘다. 이번 글은 그 앞의 입력 준비에 집중한다. 원본 조직명·저장소명·연결명·머신 경로·전체 YAML은 옮기지 않았다.

## 당시 문제와 해결 과정을 구분해 읽기

| 순서 | 노션의 기록 | 해석할 범위 |
| --- | --- | --- |
| 구성 | 빌더가 별도 콘텐츠 저장소를 서브모듈로 사용 | 저장소 사이에 기존 연결이 있었음 |
| 시도 | CmdLine 작업에서 Git으로 태그 fetch·checkout | 명령을 실행한 작업의 원격 접근 권한이 필요 |
| 실패 | 태그 fetch에서 저장소 접근 권한 제한 | 빌드 함수·패키지 다운로드 전의 입력 준비 문제 |
| 변경 | 저장소 리소스에 GitHub 저장소와 endpoint·ref 선언 | 파이프라인이 사용할 저장소와 연결을 명시 |
| 준비 | 빌더 HEAD와 콘텐츠 태그를 각각 checkout | 서로 다른 버전 선택 규칙을 사용 |
| 경로 | 콘텐츠 checkout 위치를 지정 | 빌더가 기대하는 폴더와 연결할 필요 |
| 결과 | 원하는 결과를 얻었다고 기록 | 당시의 작업 결과, 이번에 클라우드 재현한 결과는 아님 |

원문에 실패 당시의 전체 Git 출력과 HTTP 상태 코드, 사용한 인증 주체의 세부 권한은 없다. 그래서 “토큰이 만료됐다”, “401이었다”, “특정 권한 하나를 켜서 해결했다”라고 확정하지 않는다. 명령을 선언형 checkout으로 바꿨다고 권한 검사가 사라진 것도 아니다.

[CI/CD 구현 기록](https://app.notion.com/p/6b4009e0624e4162bb05136e0834261b)에서도 빌더와 별도 콘텐츠의 checkout을 먼저 수행하고 Unity 콘텐츠 빌드를 시작하는 흐름을 확인할 수 있다. 이번 조사로 당시 Unity 빌드를 다시 실행하거나 산출물의 호환성을 확인한 것은 아니다.

## 개념 1 서브모듈과 다중 checkout은 무엇이 다른가

| 구분 | Git 서브모듈 | 파이프라인 다중 checkout |
| --- | --- | --- |
| 연결을 정의하는 곳 | 부모 저장소의 gitlink와 `.gitmodules` | YAML의 저장소 리소스·checkout 단계 |
| 사용할 버전 | 부모 커밋이 기록한 하위 저장소 커밋이 기본 기준 | 각 저장소의 `ref`와 해당 실행에서 선택된 버전 |
| 로컬 개발에서의 의미 | Git이 관리하는 저장소 간 관계 | CI 작업 공간의 준비 방식 |
| 경로 | 부모 저장소에 기록한 하위 경로 | checkout의 `path`로 지정 |
| 권한 | 하위 저장소 접근 권한이 필요 | 대상 저장소와 연결·파이프라인 사용 권한이 필요 |

서브모듈의 gitlink는 부모가 기대하는 하위 저장소의 커밋을 기록한다. 다중 checkout의 태그를 선택한다고 부모의 gitlink가 자동으로 갱신되는 것은 아니다. 두 방식이 같은 폴더를 각자 다른 커밋으로 준비하지 않도록 책임을 정해야 한다. [Git 서브모듈 문서](https://git-scm.com/docs/gitsubmodules)

원문의 해결은 필요한 콘텐츠를 CI의 저장소 리소스로 준비한 것이었다. 아래 새 예제도 `submodules: false`로 서브모듈 자동 다운로드를 끄고 콘텐츠를 별도로 checkout한다. 실제 프로젝트가 서브모듈 구조에 의존한다면, 그 구조와 새 경로를 연결하는 작업이 추가로 필요하다.

## 개념 2 태그 이름·커밋·HEAD를 구분하기

`v1.0.2.7`은 사람이 선택하는 버전 이름이다. `refs/tags/v1.0.2.7`은 태그임을 명시한 전체 ref다. 같은 이름의 브랜치가 있어도 `refs/heads/v1.0.2.7`과 구분된다.

커밋 ID는 실제 Git 객체를 식별한다. 브랜치와 태그는 ref이며 다른 객체를 가리키도록 변경될 수 있다. 보통 릴리스 태그를 이동하지 않는 규칙을 두지만, 이름 자체가 기술적으로 불변인 것은 아니다. Git 공식 문서도 이미 공개한 태그를 다시 붙이면 같은 이름이 다른 내용을 가리킬 수 있음을 설명한다. [Git 태그 문서](https://git-scm.com/docs/git-tag#_on_re_tagging)

~~~mermaid
flowchart TD
    T["입력 태그 refs/tags/v1.0.2.7"] --> R["태그가 가리키는 커밋"]
    R --> H["콘텐츠 작업 폴더 HEAD"]
    E["별도로 기록한 예상 콘텐츠 커밋"] --> V["콘텐츠 세 값·빌더 입력 검사"]
    R --> V
    H --> V
    B["빌더 실제 HEAD와 예상 커밋"] --> V
    V --> O["일치하면 입력 기록 생성"]
    V --> X["다르면 빌드 전 중단"]
~~~

예상 커밋은 같은 실행의 HEAD를 읽어 그대로 예상값으로 넣는 값이 아니다. 이전에 확인한 릴리스 기록 등 별도 기준에서 가져와야 비교의 의미가 있다. 태그와 예상 커밋을 함께 임의로 바꿀 수 있다면 이 검사는 변경을 막지 못한다.

### 주석 태그는 태그 객체와 커밋이 다를 수 있다

가벼운 태그는 대상 객체를 직접 가리킨다. 주석 태그는 메시지·작성자 정보 등을 담은 태그 객체를 거쳐 대상을 가리킨다. 그래서 태그 객체 ID를 곧바로 빌드 커밋 ID로 비교하면 주석 태그에서 틀릴 수 있다.

Git의 `^{commit}`은 태그를 따라가 최종적으로 커밋을 확인하는 표기다. 예제는 `refs/tags/<태그>^{commit}`과 `HEAD^{commit}`을 비교한다. [rev-parse 문서](https://git-scm.com/docs/git-rev-parse)

HEAD를 특정 커밋에 직접 둔 detached HEAD도 CI에서는 정상적인 입력 상태일 수 있다. 브랜치 이름이 없다는 이유로 실패로 판단하지 않고 실제 커밋을 확인한다. 반대로 HEAD가 맞아도 파일이 수정되어 있으면 빌드 입력이 달라질 수 있어 작업 트리도 확인한다.

## 개념 3 저장소 선언의 다섯 항목을 따로 읽기

| 항목 | 역할 | 예제 |
| --- | --- | --- |
| `repository` | YAML 안에서 참조하는 별칭 | `content` |
| `name` | 호스팅 서비스의 실제 저장소 이름 | `example-org/content-assets` |
| `endpoint` | 접근에 사용할 서비스 연결 식별자 | `content-read-connection` |
| `ref` | 준비할 브랜치·태그 | `refs/tags/v1.0.2.7` |
| `path` | 에이전트의 checkout 위치 | `s/content` |

별칭을 `content`라고 적었다고 실제 저장소 이름이나 로컬 폴더 이름이 모두 content가 되는 것은 아니다. GitHub 저장소에는 서비스 연결이 필요하며, 연결이 해당 저장소에 접근할 수 있고 이 파이프라인에서 사용하도록 허용되어 있어야 한다. [다중 저장소 checkout 문서](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/multi-repo-checkout?view=azure-devops)

원문의 서비스 연결 이름은 공개 예제의 이름으로 바꿨다. 연결 이름을 적는 것과 실제 연결을 만들고 권한을 부여하는 것은 다른 작업이다. 예제에 키나 토큰은 넣지 않는다.

### ref를 정하는 시점과 스크립트 실행 시점

`ref: refs/tags/${{ parameters.contentTag }}`는 실행을 준비할 때 태그를 선택한다. 뒤의 PowerShell에서 변수를 변경한 뒤 이미 끝난 checkout 대상이 바뀌는 구조가 아니다.

이 예제는 현재 Azure DevOps Services를 기준으로 한다. 저장소 `ref`는 템플릿 표현식을 지원하지만 일반적인 런타임 변수를 그대로 사용할 수 있는 것은 아니다. `name`도 자유롭게 변수화할 수 있다고 가정하지 않는다. Server와 구버전의 지원 범위는 해당 버전 스키마를 따로 확인한다. [저장소 리소스 스키마](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/resources-repositories-repository?view=azure-pipelines)

## 개념 4 checkout 경로와 작업 디렉터리

저장소를 하나 더 checkout하면 기본 폴더 배치가 달라질 수 있다. 예제는 기본 이름에 의존하지 않고 경로를 명시한다.

~~~text
Pipeline.Workspace/
  s/
    builder/       # self: YAML과 검사 스크립트를 가진 저장소
    content/       # 입력 태그로 선택한 별도 저장소
  evidence/
    checkout-inputs.json
~~~

checkout의 `path`는 에이전트 빌드 작업 디렉터리를 기준으로 한 상대 경로다. 위 예제의 절대 위치는 `$(Pipeline.Workspace)/s/builder`처럼 연결한다. 검사 스크립트는 `git -C <저장소 루트>`를 사용해 현재 PowerShell 위치에 의존하지 않는다.

두 checkout 경로를 형제 폴더로 나눈 이유도 있다. 부모 checkout 안에 다른 checkout을 중첩하면 부모의 정리 작업이 하위 저장소를 지울 수 있다. 이 예제는 경로를 분리해 그 충돌을 피한다. [Git checkout 경로·정리 옵션](https://learn.microsoft.com/en-us/azure/devops/pipelines/repos/pipeline-options-for-git?view=azure-devops)

원문은 빌더가 기대하는 하위 콘텐츠 경로를 지정했다. 아래 형제 폴더 배치는 새 예제의 선택이다. Unity가 `s/content`를 자동으로 `Assets` 아래 자산으로 읽는 것은 아니다. 복사·패키지 참조 등 프로젝트에 맞는 연결과 `.meta` 보존을 별도로 설계해야 한다. **이 글의 YAML은 입력 검사까지이며 Unity 빌드를 포함하지 않는다.**

## 예제 1 로컬 Git 저장소 두 개 만들기

PowerShell 7과 Git이 필요하다. 인터넷·Azure·Unity는 사용하지 않는다. 빈 연습 폴더에 다음을 `Prepare-CheckoutLab.ps1`로 저장한다. 로컬 원격 역할의 bare 저장소와 작업 복사본을 만들며 기존 대상 폴더가 있으면 중단한다.

~~~powershell
param([string]$Root = (Join-Path $PSScriptRoot 'multi-repo-lab'))
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $Root) { throw '대상 폴더가 이미 있다.' }
$labRoot = [IO.Path]::GetFullPath($Root)
New-Item -ItemType Directory -Path $labRoot | Out-Null
foreach ($name in @('seeds', 'remotes', 's', 'evidence')) {
    New-Item -ItemType Directory -Path (Join-Path $labRoot $name) | Out-Null
}
function Git-Checked([string[]]$CommandArgs) {
    $result = & git @CommandArgs
    if ($LASTEXITCODE -ne 0) { throw '예제 저장소 Git 명령 실패' }
    return $result
}
$commits = @{}
foreach ($name in @('builder', 'content')) {
    $seed = Join-Path $labRoot "seeds/$name"
    Git-Checked @('init', '--quiet', '--object-format=sha1',
        '--initial-branch=main', $seed) | Out-Null
    Set-Content -LiteralPath (Join-Path $seed 'README.txt') -Value "$name version 1"
    Git-Checked @('-C', $seed, 'add', 'README.txt') | Out-Null
    $commitArgs = @('-C', $seed,
        '-c', 'user.name=CI Lab', '-c', 'user.email=ci-lab@example.invalid',
        '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'version 1')
    Git-Checked $commitArgs | Out-Null
    $commits[$name] = Git-Checked @('-C', $seed, 'rev-parse', 'HEAD')
    if ($name -eq 'content') {
        Git-Checked @('-C', $seed, '-c', 'tag.gpgsign=false',
            'tag', 'v1.0.2.7') | Out-Null
        Git-Checked @('-C', $seed, '-c', 'tag.gpgsign=false',
            '-c', 'user.name=CI Lab', '-c', 'user.email=ci-lab@example.invalid', 'tag',
            '-a', 'v1.0.2.8', '-m', 'same commit, annotated tag') | Out-Null
    }
    Set-Content -LiteralPath (Join-Path $seed 'README.txt') -Value "$name version 2"
    Git-Checked @('-C', $seed, 'add', 'README.txt') | Out-Null
    $commitArgs[-1] = 'version 2'
    Git-Checked $commitArgs | Out-Null
    if ($name -eq 'content') {
        Git-Checked @('-C', $seed, 'branch', 'v1.0.2.7') | Out-Null
    }
    $remote = Join-Path $labRoot "remotes/$name.git"
    $work = Join-Path $labRoot "s/$name"
    Git-Checked @('clone', '--quiet', '--bare', '--no-hardlinks', $seed, $remote) |
        Out-Null
    Git-Checked @('clone', '--quiet', '--no-checkout', '--no-hardlinks',
        $remote, $work) | Out-Null
    Git-Checked @('-C', $work, 'checkout', '--quiet', '--detach',
        $commits[$name]) | Out-Null
}
[ordered]@{
    contentTag = 'v1.0.2.7'
    expectedBuilderCommit = $commits.builder
    expectedContentCommit = $commits.content
} | ConvertTo-Json | Set-Content -LiteralPath (
    Join-Path $labRoot 'release-input.json') -Encoding utf8NoBOM
Write-Output '로컬 Git 실습 준비 완료'
~~~

위 스크립트의 마지막 출력은 예제 폴더 생성 안내다. 커밋 ID는 실행 시 생성되므로 글에 고정된 가짜 해시를 넣지 않는다. `release-input.json`에는 처음 커밋 둘을 예상값으로 저장했다. 각 저장소의 main은 두 번째 커밋으로 진행되어 있지만 작업 복사본의 HEAD는 첫 커밋에 놓인다.

콘텐츠에는 같은 첫 커밋을 가리키는 가벼운 태그 `v1.0.2.7`과 주석 태그 `v1.0.2.8`이 있다. 두 번째 커밋을 가리키는 같은 이름의 브랜치도 준비한다. 태그·브랜치·HEAD를 구분하는 실습용 구성이다. `.gitmodules`나 gitlink는 만들지 않으며 서브모듈 다운로드 실습은 아니다.

## 예제 2 실제 루트·커밋·태그·작업 트리 검사하기

다음은 `Assert-CheckoutInputs.ps1`이다. 두 작업 복사본을 읽어 예상 입력과 비교하고, 일치할 때만 새 JSON을 만든다. checkout·reset·clean을 실행하지 않는다.

~~~powershell
param(
    [Parameter(Mandatory)][string]$BuilderRoot,
    [Parameter(Mandatory)][string]$ContentRoot,
    [Parameter(Mandatory)][ValidatePattern('^v\d+\.\d+\.\d+\.\d+$')]
    [string]$ContentTag,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-f]{40}$')]
    [string]$ExpectedBuilderCommit,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-f]{40}$')]
    [string]$ExpectedContentCommit,
    [Parameter(Mandatory)][string]$OutputFile
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($ExpectedBuilderCommit -eq ('0' * 40) -or
    $ExpectedContentCommit -eq ('0' * 40)) {
    throw '예시 0 값 대신 실제 예상 커밋이 필요하다.'
}
if (Test-Path -LiteralPath $OutputFile) { throw '출력 파일이 이미 있다.' }
function Git-Text([string]$Root, [string[]]$CommandArgs) {
    $result = & git -C $Root @CommandArgs
    if ($LASTEXITCODE -ne 0) { throw '저장소 또는 ref 확인 실패' }
    return ($result -join "`n").Trim()
}
function Read-Repository([string]$Root) {
    $resolved = (Resolve-Path -LiteralPath $Root).Path
    $top = Git-Text $resolved @('rev-parse', '--show-toplevel')
    $comparer = if ($IsWindows) {
        [StringComparer]::OrdinalIgnoreCase
    } else { [StringComparer]::Ordinal }
    if (-not $comparer.Equals(
        [IO.Path]::TrimEndingDirectorySeparator([IO.Path]::GetFullPath($resolved)),
        [IO.Path]::TrimEndingDirectorySeparator([IO.Path]::GetFullPath($top)))) {
        throw '지정 경로가 저장소 루트가 아니다.'
    }
    $changes = Git-Text $resolved @('status', '--porcelain', '--untracked-files=all')
    if ($changes.Length -ne 0) { throw '작업 트리에 변경이 있다.' }
    return [ordered]@{
        root = $resolved
        commit = Git-Text $resolved @('rev-parse', '--verify', 'HEAD^{commit}')
    }
}
$builder = Read-Repository $BuilderRoot
$content = Read-Repository $ContentRoot
if ($builder.commit -cne $ExpectedBuilderCommit) { throw '빌더 커밋 불일치' }
if ($content.commit -cne $ExpectedContentCommit) { throw '콘텐츠 커밋 불일치' }
$tagCommit = Git-Text $content.root @('rev-parse', '--verify',
    '--end-of-options', "refs/tags/${ContentTag}^{commit}")
if ($tagCommit -cne $ExpectedContentCommit) { throw '태그가 예상 커밋과 다르다.' }
[ordered]@{
    schema = 1
    contentTag = $ContentTag
    builderCommit = $builder.commit
    contentCommit = $content.commit
    contentTagCommit = $tagCommit
} | ConvertTo-Json | Set-Content -LiteralPath $OutputFile -Encoding utf8NoBOM
Write-Output '입력 일치: builder·content·tag'
~~~

이 예제는 SHA-1 저장소의 40자리 커밋 표기를 전제로 한다. 모든 Git 객체 형식을 지원하는 검사기는 아니다. 출력 폴더는 미리 준비하고 JSON은 두 저장소 밖에 둔다. JSON 기록은 전자서명도, Unity·패키지·환경 전체의 재현성 증명도 아니다.

`git -C`만 사용해서는 잘못된 경로를 모두 찾을 수 없다. 저장소 안의 빈 하위 폴더에서 실행해도 Git은 부모 저장소를 찾는다. 그래서 `--show-toplevel`과 지정한 경로가 같은지 검사한다.

작업 트리 검사는 추적 파일 변경과 무시되지 않은 미추적 파일을 대상으로 한다. `.gitignore`로 숨겨진 파일, LFS 실데이터, 서브모듈 내부 상태, 심볼릭 링크로 연결한 경로까지 검증하는 도구는 아니다. 실제 빌드에 영향을 주는 입력은 추가로 관리해야 한다.

### 실행과 출력

다음을 `Run-CheckoutLab.ps1`로 저장해 `pwsh -File ./Run-CheckoutLab.ps1`로 실행한다. 예제 1을 먼저 `pwsh -File ./Prepare-CheckoutLab.ps1`로 실행해야 한다. 재실행에는 새 출력 파일 이름이 필요하다.

~~~powershell
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$labRoot = Join-Path $PSScriptRoot 'multi-repo-lab'
$release = Get-Content -LiteralPath (
    Join-Path $labRoot 'release-input.json') -Raw | ConvertFrom-Json
$checkArgs = @{
    BuilderRoot = Join-Path $labRoot 's/builder'
    ContentRoot = Join-Path $labRoot 's/content'
    ContentTag = $release.contentTag
    ExpectedBuilderCommit = $release.expectedBuilderCommit
    ExpectedContentCommit = $release.expectedContentCommit
    OutputFile = Join-Path $labRoot 'evidence/checkout-inputs.json'
}
& (Join-Path $PSScriptRoot 'Assert-CheckoutInputs.ps1') @checkArgs
~~~

~~~text
입력 일치: builder·content·tag
~~~

검사한 두 HEAD와 태그의 대상 커밋이 예상값과 일치한다는 출력이다. README만 가진 예제 저장소이므로 실제 콘텐츠나 Unity 빌드를 검사한 것이 아니다.

실습에서 다른 `Root`에 저장소를 만들었다면 실행 스크립트의 `$labRoot`도 그 폴더로 바꾼다. 태그·경로·출력 이름을 바꾸는 실습은 이 파일의 `$checkArgs`를 수정한 뒤 다시 실행하면 된다. 새 출력 이름은 `evidence/annotated.json`, `evidence/missing-tag.json`처럼 구분한다.

## 예제 3 Azure의 다중 checkout과 검사 연결하기

빌더 저장소에 YAML과 앞의 검사 스크립트를 `ci/Assert-CheckoutInputs.ps1`로 준비하는 **미실행 구성 예제**다. 자동 트리거는 끄고 콘텐츠 태그 후보는 두 개로 제한했다. 실제 릴리스에 맞게 목록을 관리해야 한다.

~~~yaml
trigger: none
pr: none

parameters:
- name: contentTag
  type: string
  default: v1.0.2.7
  values: [v1.0.2.7, v1.0.2.8]
- name: expectedBuilderCommit
  type: string
  default: '0000000000000000000000000000000000000000'
- name: expectedContentCommit
  type: string
  default: '0000000000000000000000000000000000000000'

resources:
  repositories:
  - repository: content
    type: github
    endpoint: content-read-connection
    name: example-org/content-assets
    ref: refs/tags/${{ parameters.contentTag }}

pool:
  vmImage: ubuntu-latest

steps:
- checkout: self
  path: s/builder
  clean: true
  submodules: false
  fetchDepth: 0
  fetchTags: true
  persistCredentials: false
- checkout: content
  path: s/content
  clean: true
  submodules: false
  fetchDepth: 0
  fetchTags: true
  persistCredentials: false
- task: PowerShell@2
  displayName: Verify checkout inputs
  inputs:
    pwsh: true
    targetType: inline
    script: |
      $ErrorActionPreference = 'Stop'
      New-Item -ItemType Directory -Path $env:EVIDENCE_ROOT -Force | Out-Null
      $checkArgs = @{
          BuilderRoot = $env:BUILDER_ROOT
          ContentRoot = $env:CONTENT_ROOT
          ContentTag = $env:CONTENT_TAG
          ExpectedBuilderCommit = $env:EXPECTED_BUILDER
          ExpectedContentCommit = $env:EXPECTED_CONTENT
          OutputFile = Join-Path $env:EVIDENCE_ROOT 'checkout-inputs.json'
      }
      & $env:CHECKER @checkArgs
  env:
    CHECKER: $(Pipeline.Workspace)/s/builder/ci/Assert-CheckoutInputs.ps1
    BUILDER_ROOT: $(Pipeline.Workspace)/s/builder
    CONTENT_ROOT: $(Pipeline.Workspace)/s/content
    EVIDENCE_ROOT: $(Pipeline.Workspace)/evidence
    CONTENT_TAG: ${{ parameters.contentTag }}
    EXPECTED_BUILDER: ${{ parameters.expectedBuilderCommit }}
    EXPECTED_CONTENT: ${{ parameters.expectedContentCommit }}
- publish: $(Pipeline.Workspace)/evidence/checkout-inputs.json
  artifact: checkout-inputs
~~~

서비스 연결·실제 저장소·파이프라인 사용 권한을 준비하지 않으면 그대로 실행할 수 없다. 예상 커밋의 0 값도 실제 릴리스 기록으로 바꿔야 한다. self는 해당 실행에서 선택된 빌더 버전이다. 기대한 빌더 커밋과 다르면 검사에서 중단하므로, 실행할 빌더 버전도 맞춰 선택해야 한다.

태그의 대상 커밋만 받을 수 있는 구성과 모든 태그 ref·이력을 로컬에서 사용하는 구성은 다르다. 이 예제는 로컬 태그 ref를 검사하고 실습에서 다른 커밋도 비교하므로 `fetchTags: true`, `fetchDepth: 0`을 명시했다. 이 설정은 다운로드량을 늘릴 수 있고, 모든 파이프라인에 필수인 값은 아니다. 기본값도 파이프라인 생성 시점과 설정의 영향을 받을 수 있다. [checkout 스키마](https://learn.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/steps-checkout?view=azure-pipelines)

`persistCredentials: false`는 후속 Git 명령을 위해 checkout 인증 정보를 Git 설정에 남기지 않는 선택이다. 위 검사는 이미 가져온 로컬 객체를 읽기만 하므로 후속 원격 접근이 필요 없다. 따로 추가한 `git fetch`까지 자동 인증되는 예제가 아니다.

콘텐츠 태그와 예상 SHA는 스크립트 본문에 끼워 넣지 않고 환경 변수로 전달한다. `ContentTag`는 태그 형식도 검사한다. 파이프라인의 parameter는 비밀값을 전달하는 용도가 아니다. [런타임 parameter 문서](https://learn.microsoft.com/en-us/azure/devops/pipelines/process/runtime-parameters?view=azure-devops)

## 실습 1 같은 이름의 태그와 브랜치 구분하기

예제 폴더의 `s/content`에서 `refs/tags/v1.0.2.7^{commit}`과 `refs/heads/main^{commit}`을 각각 `git rev-parse --verify`로 읽는다. 같은 이름의 브랜치는 clone에 원격 추적 ref로 준비되므로 `refs/remotes/origin/v1.0.2.7^{commit}`도 읽어 본다.

1. 어느 값이 release-input의 콘텐츠 예상 커밋과 같은가?
2. 현재 HEAD와 main은 왜 달라도 되는가?
3. `v1.0.2.7` 같은 짧은 이름만 사용하면 어떤 문제가 생기는가?

### 풀이

태그와 현재 HEAD가 첫 커밋이고 main·원격 브랜치는 두 번째 커밋이다. 예제용 checkout은 detached HEAD로 첫 커밋을 선택했으므로 main의 최신 상태와 달라도 의도한 입력이다.

짧은 이름에는 브랜치·태그의 구분이 드러나지 않는다. 어떤 ref를 뜻하는지 명확하게 적고 예상 커밋과 대조한다. 이 실습은 충돌 가능성을 설명하기 위한 것이며 원래 사건이 같은 이름의 브랜치 때문에 발생했다는 뜻은 아니다.

## 실습 2 주석 태그를 커밋으로 비교하기

새 출력 파일을 지정하고 검사 인자의 `ContentTag`만 `v1.0.2.8`로 바꾼다. 예상 콘텐츠 커밋은 그대로 둔다.

### 풀이

두 태그는 같은 첫 커밋을 가리키므로 통과한다. `git rev-parse refs/tags/v1.0.2.8`의 태그 객체 ID와 `git rev-parse 'refs/tags/v1.0.2.8^{commit}'`의 커밋 ID는 다를 수 있다. 검사는 후자를 사용한다.

주석 태그라는 이유만으로 서명을 검증한 것은 아니다. 이 실습의 주석 태그는 서명 없이 만들었다. 작성자·서명·릴리스 승인 여부는 커밋 일치 검사와 다른 조건이다.

## 실습 3 태그 누락·HEAD 불일치·태그 이동 찾기

변경을 섞지 말고 예제 1을 서로 다른 새 Root에 실행해 각 실험을 진행한다. 예제용 복사본만 변경하며 공개 저장소에 push하지 않는다.

| 바꿀 조건 | 예상 결과 | 찾는 문제 |
| --- | --- | --- |
| 없는 태그 `v9.9.9.9` 지정 | 실패 | 해당 태그를 커밋으로 읽을 수 없음 |
| 콘텐츠 HEAD를 로컬 main으로 checkout | 실패 | 태그는 맞아도 현재 콘텐츠 커밋이 다름 |
| 빌더 HEAD를 로컬 main으로 checkout | 실패 | 콘텐츠 태그만으로 빌더 입력은 고정되지 않음 |
| 콘텐츠 복사본의 태그를 `git tag -f v1.0.2.7 main`으로 이동 | 실패 | HEAD는 첫 커밋인데 태그는 두 번째 커밋 |

### 풀이

태그 누락은 권한 오류와 구분해야 한다. 위 실험은 이미 로컬에 있는 저장소에서 ref가 없는 상황이다. 실제 원격의 존재 여부·접근 권한·fetch 범위·선택한 태그를 각각 확인해야 한다.

HEAD 불일치는 지정한 태그 이름이 맞다는 것만으로 찾지 못한다. 빌드가 읽을 작업 복사본의 HEAD를 확인해야 한다. 태그 이동도 별도 예상 커밋이 있어야 감지할 수 있다. 예상값을 현재 태그에서 매번 새로 읽으면 그 변경을 그대로 받아들이게 된다.

태그 이동은 이 실습의 로컬 복사본에서만 재현한다. 실제 운영에서는 이미 공개한 태그를 강제로 바꾸는 대신 새 버전 이름을 사용하는 규칙과 변경 이력을 관리한다.

## 실습 4 잘못된 폴더와 변경 파일 찾기

1. 콘텐츠 저장소 안에 빈 `empty-folder`를 만들고 `ContentRoot`로 지정한다.
2. 새 실험 폴더에서 콘텐츠의 `README.txt`를 바꾼다.
3. 같은 출력 JSON 이름으로 정상 검사를 다시 실행한다.

### 풀이

첫 경우 Git 자체는 부모 저장소를 찾을 수 있다. 하지만 예제는 지정 경로와 저장소 루트가 다른 것을 확인해 중단한다. 빈 폴더만 생성하면 Git이 파일 변경으로 추적하지 않으므로 루트 검사의 역할을 따로 볼 수 있다.

두 번째 경우는 작업 트리 변경으로 실패한다. HEAD가 그대로라고 파일 내용도 그대로인 것은 아니다. 세 번째는 기존 출력 파일이 있어 실패한다. 과거 기록을 덮어쓰거나 새 검사 결과처럼 재사용하지 않도록 출력 이름도 분리한다.

실제 CI의 clean·LFS·무시 파일·서브모듈 검사까지 같은 조건으로 검증했다고 해석하지 않는다. 예제의 검사 범위는 앞에서 구분했다.

## 실습 5 Azure 입력과 경로 오류를 찾아 수정하기

다음 구성을 검토한다.

| 설정 | 확인할 문제 |
| --- | --- |
| `ref`에 실행 도중 만든 매크로 변수만 적음 | checkout을 준비하는 시점에 대상이 결정되는가 |
| 콘텐츠만 checkout하고 self 생략 | 빌더의 검사 스크립트는 어디서 오는가 |
| builder 안에 content를 중첩하고 부모 clean 사용 | 정리 작업이 어떤 폴더를 지울 수 있는가 |
| 서비스 연결 이름만 선언 | 연결의 저장소 접근·파이프라인 사용 권한이 있는가 |
| expectedBuilder를 현재 HEAD에서 즉석 생성 | 빌더가 바뀐 것을 실제로 감지할 수 있는가 |

### 풀이

실행 전에 선택할 태그는 지원되는 parameter와 템플릿 표현식으로 `ref`에 전달한다. 현재 저장소도 필요하면 `checkout: self`를 명시한다. 경로는 형제 폴더로 나누고 검사·후속 작업에 정확한 루트를 전달한다.

권한은 YAML 문자열만으로 생기지 않는다. 서비스 연결이 실제 대상에 접근할 수 있는지와 파이프라인이 그 연결을 사용할 수 있는지 확인한다. 예상 커밋은 별도 릴리스 기록의 기준값이어야 한다.

마지막으로 checkout 성공은 콘텐츠 사용 성공과 다르다. 두 입력을 맞춘 다음 Unity가 자산을 읽는 경로, `.meta`·LFS 실데이터, 패키지·에디터 버전, 콘텐츠 빌드 결과를 이어서 확인해야 한다. 이 글의 실습은 Azure 권한 오류를 실제로 재현한 결과가 아니다.

## 확인한 내용과 남은 실행 검증

| 대상 | 확인 범위 |
| --- | --- |
| 당시 fetch 권한 오류·리소스 선언·태그·경로 변경 | 노션 두 기록의 설명과 코드 조각 확인 |
| 당시 결과 | 원하는 결과를 얻었다는 기록, 이번에 클라우드 재실행하지 않음 |
| 당시 HTTP 상태·인증 주체·세부 권한·전체 checkout 로그 | 원문에서 확인하지 못함 |
| Git·Azure 개념과 스키마 | 연결한 공식 문서와 대조 |
| 로컬 두 저장소·bare 원격·태그·detached HEAD | 본문 PowerShell을 추출해 실행 |
| 정상·주석 태그·누락·불일치·태그 이동·잘못된 경로·작업 트리 | 독립된 로컬 Git 실험으로 확인 |
| Azure YAML | 일반 YAML 파싱과 내장 PowerShell 구문 확인 |
| Azure 템플릿 확장·서비스 연결·실제 다중 checkout | 미실행 |
| Linux 에이전트의 검사 스크립트 실행 | 미실행, 로컬 검사는 Windows |
| Unity 자산 연결·LFS·패키지·콘텐츠 빌드·런타임 로드 | 미실행 |

예제·실습·풀이와 설명 그림은 AI의 도움을 받아 새로 작성했다. Windows의 PowerShell 7.6.5·Git 2.48.1에서 로컬 실험을 실행했다. 로컬 Git 실험의 통과를 과거 권한 오류의 재현이나 Azure·Unity 전체 파이프라인 성공으로 확대하지 않는다.

남은 확인은 실제 서비스 연결이 있는 전용 파이프라인에서 선택한 두 커밋·경로·입력 기록을 대조하는 것이다. 이후 Unity 콘텐츠 연결과 빌드까지 확인한 자료를 추가한다. 이 글에서 직접 실행해 확인한 범위는 로컬 Git 실험이다.
