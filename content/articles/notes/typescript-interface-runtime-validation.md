---
title: "TypeScript interface와 실행 중 데이터 검증을 구분하기"
description: "컴파일 시 타입과 외부 JSON 검증의 경계를 나누고 상태별 결과를 판별 유니온으로 표현합니다. 잘못된 필드·누락·상태 조합의 실습과 풀이를 포함합니다."
slug: "typescript-interface-runtime-validation"
date: "2022-01-18"
dateBasis: "notion"
updated: "2026-10-23"
topic: "notes"
kind: "note"
tags: ["TypeScript", "Validation", "JSON"]
draft: false
---

## 타입을 붙였다고 JSON이 바뀌지는 않습니다

<div id="타입을-붙였다고-json이-바뀌지는-않는다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[Interface 정리](https://app.notion.com/p/b6213ce8acbb45958e96077a6fc2f8c4)의 구조적 타입 설명을 외부 작업 결과 검증으로 연결했습니다. interface는 컴파일 시 계약입니다. `JSON.parse(text) as Result`는 실행 중 검사도 데이터 변환도 하지 않습니다. 외부 입력은 unknown에서 시작해 필요한 필드를 검사합니다. [TypeScript의 타입 단언 설명](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)

성공·실패를 한 interface에 선택 속성으로 모두 넣으면 `succeeded`인데 error만 있는 조합도 쉽게 만들 수 있습니다. status로 분기하는 판별 유니온과 실행 중 검증을 함께 사용합니다.

## 독립 실행 예제

다음을 `result.ts`로 저장합니다. TypeScript의 strict 검사로 JavaScript를 생성한 뒤 Node.js로 실행합니다. 이 블로그 저장소의 실제 하네스 스키마를 복사한 코드는 아닙니다.

```typescript
interface Success { id: string; status: 'succeeded'; artifactCount: number }
interface Failure { id: string; status: 'failed'; error: string }
type Result = Success | Failure;

function parseResult(value: unknown): Result {
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    throw new Error('object required');
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || row.id.trim() === '') throw new Error('id');
  if (row.status === 'succeeded') {
    if (typeof row.artifactCount !== 'number'
        || !Number.isSafeInteger(row.artifactCount) || row.artifactCount < 0
        || 'error' in row) throw new Error('success fields');
    return {id:row.id, status:'succeeded', artifactCount:row.artifactCount};
  }
  if (row.status === 'failed') {
    if (typeof row.error !== 'string' || row.error.trim() === ''
        || 'artifactCount' in row) throw new Error('failure fields');
    return {id:row.id, status:'failed', error:row.error};
  }
  throw new Error('status');
}
const input: unknown = JSON.parse('{"id":"study-1","status":"succeeded","artifactCount":2}');
console.log(JSON.stringify(parseResult(input)));
try { parseResult({id:'study-2',status:'succeeded',error:'bad'}); }
catch { console.log('invalid rejected'); }
```

```text
{"id":"study-1","status":"succeeded","artifactCount":2}
invalid rejected
```

object를 확인한 뒤 Record로 좁힌 단언은 필드의 타입을 신뢰하는 단언과 다릅니다. 각 필드는 여전히 unknown이며 실제 검사를 거칩니다. 반환값은 검사한 필드로 새로 만듭니다. 이 정책에서는 알 수 없는 부가 필드는 버리고, 상태와 충돌하는 error·artifactCount는 거절합니다.

```sh
tsc result.ts --strict --target ES2022 --module commonjs --outDir out
node out/result.js
```

위 실행 명령은 주변 package.json에 type: module이 없는 별도 실습 폴더 기준입니다. ESM 프로젝트에서는 확장자·module 설정을 맞춥니다. interface 선언 자체는 JavaScript 결과물에서 사라집니다.

## 실습과 풀이

1. artifactCount를 문자열 "2", -1, 0.5로 보냅니다. **풀이:** 모두 거절합니다. 이 예제는 자동 숫자 변환을 하지 않으며 0은 유효합니다.
2. failed에서 error가 빈 문자열이거나 누락됩니다. **풀이:** 실패 사유가 없는 결과로 거절합니다. 사용자에게 보여 줄 오류의 공개 범위는 별도로 정해야 합니다.
3. 모든 경우에 `as Result`만 쓰도록 바꿉니다. **풀이:** 컴파일을 통과해도 위 실패 입력을 막지 못합니다. UI에서 필드를 읽기 전에 검증해야 합니다. [TypeScript narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [CSS Grid·Flex와 긴 코드·표의 가로 넘침 해결](/writing/css-grid-flex-overflow/)
