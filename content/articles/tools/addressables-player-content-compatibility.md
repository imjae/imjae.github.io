---
title: "스크립트와 Addressables 콘텐츠의 버전 호환성"
description: "Player 코드와 콘텐츠를 함께 식별하고 변경 종류에 따라 전체 빌드와 콘텐츠 업데이트를 나눈다. 상태 파일·이전 번들·롤백을 예제와 실습·풀이로 설명한다."
slug: "addressables-player-content-compatibility"
date: "2026-10-17"
topic: "tools"
kind: "note"
tags: ["Unity", "Addressables", "CI", "Versioning"]
draft: false
---

## 카탈로그가 바뀌어도 설치된 코드는 그대로다

[관리 팁](https://app.notion.com/p/eb44c410f42b451f95252113acb3cb4f), [어드레서블 빌드](https://app.notion.com/p/84031fd94b9a4f3bb071bba99b9b7e34), [빌드·배포 순서](https://app.notion.com/p/8634dae5619e41bdaee2cc075f7be6c5)에는 스크립트 버전과 리소스 버전, 이전 파일을 남기는 메모가 있다. 이 구분을 호환성 계약으로 확장했다.

AssetBundle은 새 C# 실행 코드를 Player에 설치하는 수단이 아니다. 콘텐츠의 직렬화 데이터가 요구하는 타입은 설치된 Player에서 해석할 수 있어야 한다. 클래스·namespace·어셈블리 변경은 단순 텍스처 교체와 같은 배포로 취급하지 않는다.

| 변경 예 | 판단의 출발점 |
| --- | --- |
| 같은 타입을 쓰는 텍스처 교체 | 콘텐츠 업데이트 후보, 그룹 제한·플랫폼 확인 |
| 새 MonoBehaviour 타입 | 해당 코드를 포함한 새 Player 필요 |
| 어셈블리·namespace·클래스 이름 변경 | Player와 콘텐츠의 타입 참조 일관성 검토 |
| Unity·Addressables 버전 변경 | 새 Player·콘텐츠 기준으로 전체 검증 |

필드 변경은 직렬화 호환성·마이그레이션·stripping 등을 함께 판단한다. 위 표가 모든 직렬화 변경의 완전한 규칙은 아니다. [콘텐츠 업데이트 개요](https://docs.unity3d.com/Packages/com.unity.addressables@1.21/manual/content-update-builds-overview.html)

## 배포 입력을 한 묶음으로 기록하기

다음 JSON은 자체 설계한 릴리스 메타데이터 예다. Unity가 자동 해석하는 표준 스키마가 아니며 실제 계정·파일 해시가 아니다.

```json
{
  "playerVersion": "study-1",
  "contentVersion": "content-2",
  "target": "StandaloneWindows64",
  "baselineState": "study-1-content-state.bin",
  "catalog": "catalog-content-2.json",
  "requiredBundles": ["marker-a.bundle", "marker-b.bundle"]
}
```

실제 배포에서는 Player 빌드·패키지 lock·커밋·content state의 해시·카탈로그·번들 목록을 묶는다. `addressables_content_state.bin`은 공개 클라이언트 다운로드 파일과 별도로 빌드 기준 자료로 보관한다. 새 빌드의 파일로 덮어써 이전 기준을 잃지 않는다.

```text
기준 Player + 기준 content state
      → 제한 검사 → 업데이트 콘텐츠 생성
      → 새 번들 준비 → 카탈로그 전환 → 구 Player로 로드 검사
```

카탈로그가 참조하는 파일을 먼저 준비하고 이전 카탈로그가 쓰는 번들도 보존한다. 카탈로그만 되돌렸는데 이전 번들이 삭제됐다면 롤백이 완성되지 않는다. 캐시가 있는 기기에서만 성공하는 상황도 걸러야 한다.

## 실습과 풀이

1. 같은 프리팹의 텍스처만 교체한다. **풀이:** 기준 Player로 업데이트 카탈로그를 읽어 본다. 새/기존 캐시 상태와 업데이트 제한을 확인한다. 에디터에서 새 프로젝트로 보는 성공은 구 Player 호환성 검사와 다르다.
2. 새 스크립트를 붙인 프리팹을 구 Player에 보낸다. **풀이:** 콘텐츠만 갱신해 새 실행 코드가 추가되지는 않는다. Player 재빌드가 필요한 변경으로 처리하고 구버전 접근을 차단하거나 호환 콘텐츠를 유지한다.
3. 롤백 절차를 작성한다. **풀이:** 카탈로그와 해시·버전 메타데이터의 전환, 이전 번들 접근, 캐시·서버 전파를 함께 확인한다. 단순히 버전 숫자를 낮추는 것과 같지 않다.

## 확인한 범위

노션의 버전 메모와 공식 업데이트 흐름을 대조해 새 메타데이터·절차를 작성했다. 실제 콘텐츠 업데이트·구 Player·캐시·서버·롤백은 실행하지 않았다. 과거의 ‘파일을 남기자’는 기록을 무중단 운영 완료로 확대하지 않는다. AI를 작성 보조에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [Addressables 커스텀 빌드 스크립트의 호출 단계](/writing/addressables-custom-build-stages/)
