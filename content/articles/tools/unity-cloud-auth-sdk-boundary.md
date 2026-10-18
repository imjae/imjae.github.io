---
title: "Unity에서 클라우드 데이터에 접근할 때의 인증·SDK 경계"
description: "로그인, 임시 AWS 자격 증명과 서버 권한을 구분한다. Unity SDK 통합 조건과 자체 권한 모델·실습·풀이를 정리하고 실계정 검증과 분리한다."
slug: "unity-cloud-auth-sdk-boundary"
date: "2021-12-17"
dateBasis: "notion"
updated: "2026-10-18"
topic: "tools"
kind: "note"
tags: ["Unity", "AWS", "Authentication", "SDK"]
draft: false
---

## 연결이 되는 것과 허용된 데이터만 읽는 것은 다르다

[Amazon DynamoDB 연동 테스트](https://app.notion.com/p/490a8b0a1d9f4859919f48fa9a6a36f0)는 Unity와 Cognito·DynamoDB를 연결하려던 과거 기록이다. 원문의 풀 식별자·계정·권한 설정·접속 값은 복사하지 않았다. 이번 글을 실서비스 인증이나 현재 DCB 백엔드 구현 완료로 소개하지 않는다.

Cognito user pool의 로그인 토큰과 identity pool이 제공하는 임시 AWS 자격 증명은 역할이 다르다. 임시 자격 증명도 IAM 권한 범위를 가진다. 클라이언트가 인증됐다는 이유만으로 모든 사용자의 데이터에 접근해도 되는 것은 아니다. [Cognito identity pool 설명](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-identity.html)

## 두 가지 접근 구조

```text
A: Unity → 로그인 → 자신의 토큰 → 게임 API → 서버 권한으로 DB
B: Unity → identity pool → 제한된 임시 AWS 자격 증명 → 허용된 AWS 자원
```

A에서는 서버가 토큰을 검증하고 사용자 식별자를 신뢰할 수 있는 claim에서 얻는다. B에서는 identity pool의 trust policy·IAM permission·데이터 키 제한까지 맞춰야 한다. 점수·보상처럼 클라이언트가 결정해선 안 되는 값은 서버에서 검증한다. 앱에 장기 AWS access key를 넣는 방식으로 이 경계를 대신하지 않는다.

## 로컬 권한 모델 실습

다음 Node.js 코드는 **실제 JWT 검증이나 IAM 평가가 아니다**. 서버가 인증 완료 후 얻은 주체와 요청 데이터를 구분하는 예다. claims는 클라이언트 JSON을 그대로 넣는 값이 아니라 앞 단계의 신뢰할 수 있는 인증 결과라고 가정한다.

```javascript
function authorize(claims, request) {
  if (!claims || typeof claims.sub !== 'string' || claims.sub === '') return false;
  if (request.operation !== 'readQuest') return false;
  return request.ownerId === claims.sub;
}
console.log(authorize({sub:'study-a'},{operation:'readQuest',ownerId:'study-a'}));
console.log(authorize({sub:'study-a'},{operation:'readQuest',ownerId:'study-b'}));
console.log(authorize({sub:'study-a'},{operation:'grantReward',ownerId:'study-a'}));
```

```text
true
false
false
```

이 함수가 true를 반환해도 실제 토큰 서명·issuer·audience·만료·폐기·재사용 정책을 구현한 것은 아니다. 계정별 데이터 격리와 필드별 변경 권한도 API·DB 정책에서 검증해야 한다. [Cognito identity pool 보안 지침](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools-security-best-practices.html)

## 현재 SDK를 확인할 때

2026년 10월 17일 AWS SDK for .NET V4의 Unity 지원 문서를 확인했다. .NET Standard 2.0 기반 Unity에서는 필요한 DLL을 직접 연결하는 절차, 종속 DLL과 IL2CPP stripping 대응을 설명한다. 예전 Unity SDK 패키지 설치 기록을 그대로 현재 절차로 제시하지 않는다. [AWS의 Unity 고려 사항](https://docs.aws.amazon.com/sdk-for-net/v4/developer-guide/unity-special.html)

검증할 입력은 Unity 버전·API 호환성·Mono/IL2CPP·타깃 플랫폼·SDK와 종속 DLL 버전이다. Editor에서 연결됐어도 모바일 IL2CPP의 stripping·TLS·비동기 처리까지 검증된 것은 아니다. 필요한 어셈블리와 보존 설정은 실제 사용 서비스에 맞춰 작성한다.

## 실습과 풀이

1. 다른 사용자 ownerId를 보낸다. **풀이:** 클라이언트 입력만으로 주체를 바꾸지 못해야 한다. UI에서 버튼을 숨기는 것은 서버 권한 검사가 아니다.
2. 토큰 만료와 로그아웃 직후 요청을 보낸다. **풀이:** 인증 계층에서 거절하고 UI·재인증 상태를 처리해야 한다. 위 로컬 함수에는 이 기능이 없다.
3. Editor 성공 뒤 IL2CPP 빌드를 시험한다. **풀이:** 서비스 호출·stripping·실패·재시도를 장치에서 확인한다. 이 글은 그 빌드를 실행하지 않았으며 계정 접근이나 권한 변경도 하지 않았다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

과거 노트와 AWS 공식 인증·SDK 문서를 대조해 로컬 모델을 새로 작성했다. 토큰 발급·실제 검증·IAM·SDK 연결·DynamoDB 접근·Unity 빌드와 장치는 미검증이다. 로컬 true/false 검사는 인증 시스템의 안전성 증거가 아니다. AI를 작성 보조에 사용했다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/)
