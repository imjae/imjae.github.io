---
title: "Unity 배치 빌드가 끝나지 않을 때: 종료 인수와 첫 빌드 비용"
description: "빌드는 끝났지만 프로세스가 남은 경우와 최초 플랫폼 전환이 오래 걸린 경우를 구분합니다. 종료 코드·로그·콜드/웜 상태를 읽는 예제와 실습을 다룹니다."
slug: "unity-batch-exit-cold-build"
date: "2024-04-29"
dateBasis: "notion"
updated: "2026-10-23"
topic: "tools"
kind: "note"
tags: ["Unity", "CI", "Debugging", "Build"]
draft: false
---

## 같은 시간 초과에도 원인은 다릅니다

<div id="같은-시간-초과에도-원인은-다르다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[빌드 시간 초과 기록](https://app.notion.com/p/49a3baf2d6c64db48bb2c54dc3615c0b)에는 두 사례가 있습니다. 첫 번째는 콘텐츠 빌드 호출에 -quit이 빠져 명령이 끝나지 않은 경우입니다. 두 번째는 첫 플랫폼 전환과 첫 콘텐츠 빌드의 합이 제한을 넘었고, 다시 실행했을 때 통과한 경우입니다.

노트의 30분·한 시간은 당시 관찰입니다. 현재 환경에서 같은 시간이 걸린다는 뜻은 아닙니다. 재시도 성공은 캐시·플랫폼 준비의 영향과 일치할 수 있지만 모든 재시도의 성공 원인을 증명하지는 않습니다.

| 관찰 | 먼저 구분할 것 |
| --- | --- |
| 완료 로그 뒤 출력 없음, 프로세스 생존 | 종료 인수·남은 작업·교착 |
| import·플랫폼 전환 로그 계속 진행 | 실제 준비 비용과 CI 제한 |
| 오류 뒤에도 프로세스 생존 | 오류 전파·종료 코드 계약 |
| 웜 실행만 성공 | 캐시·준비 단계·네트워크 조건 |

## 명령과 종료 계약

다음은 실습용 PowerShell 호출 형태입니다. 변수는 자신의 전용 실습 프로젝트와 Editor 경로로 설정합니다. 실제 비공개 경로나 인증 정보는 포함하지 않았습니다.

```powershell
& $unityEditor -batchmode -quit -projectPath $studyProject `
    -executeMethod StudyBuild.Run -logFile $studyLog
$buildExitCode = $LASTEXITCODE
if ($buildExitCode -ne 0) { throw "Unity build failed: $buildExitCode" }
```

StudyBuild.Run은 사용자가 작성한 정적 Editor 메서드입니다. Unity에 기본 내장된 함수가 아닙니다. 필요한 파일이 모두 완성되기 전에 반환하는 async void 진입점은 이 명령과 맞지 않을 수 있습니다. 동기 빌드 결과를 검사하거나 비동기 완료를 기다린 뒤 명시적으로 종료하는 방식을 해당 Editor·파이프라인에 맞춰 정합니다. [Unity 명령줄 인수](https://docs.unity3d.com/6000.0/Documentation/Manual/EditorCommandLineArguments.html)

프로세스 종료 0만으로 모든 산출물이 완성됐다고 보지 않습니다. 메서드에서 빌드 결과 오류를 전달하고, 이후 단계에서 예상 파일·크기·manifest를 확인합니다. 성공 마커는 모든 작업이 완료된 뒤 기록합니다. 로그 파일 자체는 원본째 공개하지 않고 민감 정보를 제거한 요약을 사용합니다.

## 가상 타임라인 읽기

```text
A: import → bundle complete → success marker → [프로세스 생존]
B: platform switch 진행 → import 진행 → [CI 제한 도달]
C: package download error → build failure → [종료 코드 1]
```

A는 종료 계약부터, B는 준비 단계와 제한·캐시부터, C는 최초 실패부터 조사합니다. B를 빨리 만들려고 종료 인수만 추가하거나 C를 해결하려고 제한만 늘리는 것은 관찰과 맞지 않습니다. 패키지 오류 분석은 [별도 글](/writing/unity-ci-package-download-failure/)에서 이어집니다.

## 실습과 풀이

1. 즉시 끝나는 정적 메서드로 -quit 유무를 비교합니다. **풀이:** 빌드와 무관한 빈 메서드로 프로세스 종료부터 확인합니다. 자동 종료가 있는 CI 확장과 직접 실행은 다를 수 있으므로 실제 명령을 기록합니다.
2. 별도 실습 복사본에서 최초·반복 실행을 기록합니다. **풀이:** 에디터 버전·플랫폼·패키지 lock·캐시 상태를 적습니다. 운영 프로젝트의 Library를 임의로 지우지 않습니다. 반복 실행 결과를 최초 빌드 소요로 보고하지 않습니다.
3. 오류가 발생한 메서드가 성공 코드로 끝납니다. **풀이:** 예외·BuildResult의 실패를 명시적으로 CI에 전달하고 실패 뒤 배포가 막히는지 확인합니다. 제한 시간 연장은 이 계약을 대신하지 않습니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [Spine 텍스처의 PMA·Straight Alpha·색 공간 맞추기](/writing/spine-alpha-color-space/)
