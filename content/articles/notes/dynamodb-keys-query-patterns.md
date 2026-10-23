---
title: "DynamoDB의 Partition Key·Sort Key와 조회 패턴 설계"
description: "가상의 퀘스트 데이터에서 키와 접두어 조회를 설계합니다. Query와 Filter, 정렬·페이지네이션의 차이를 로컬 모델과 실습·풀이로 설명합니다."
slug: "dynamodb-keys-query-patterns"
date: "2022-01-20"
dateBasis: "notion"
updated: "2026-10-23"
topic: "notes"
kind: "note"
tags: ["DynamoDB", "Database", "Query"]
draft: false
---

## 먼저 어떤 요청이 필요한지 적습니다

<div id="먼저-어떤-요청이-필요한지-적는다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[DynamoDB 설계 예시](https://app.notion.com/p/71571eaafa394f82849288319a59d906)는 접근 패턴 중심의 모델링을, [C# 테스트](https://app.notion.com/p/bcbc3a319d334fe08e9a2dcae18a1ef9)는 QueryRequest와 begins_with를 다룹니다. 원래 계정·사용자·서비스 데이터를 사용하지 않고 자체 퀘스트 샘플로 다시 구성했습니다.

원문의 ‘NoSQL은 어떤 규모에서나 일정 성능’ 같은 일반화는 사용하지 않습니다. 키 분포, 항목 크기, 처리량, 인덱스와 접근 패턴에 따라 비용·지연·제한이 달라집니다. RDB보다 언제나 빠르다는 비교도 이 글의 근거에 없습니다.

## 복합 기본 키 예제

| PK | SK | 상태 |
| --- | --- | --- |
| USER#study-a | QUEST#001 | completed |
| USER#study-a | QUEST#002 | active |
| USER#study-a | PROFILE | — |
| USER#study-b | QUEST#001 | active |

PK는 파티션 키, SK는 정렬 키인 문자열 속성으로 정합니다. 기본 키 조합이 항목을 식별합니다. ‘사용자 a의 퀘스트 목록’은 PK 동등 조건과 SK 접두어 조건으로 표현할 수 있습니다. 다른 사용자의 항목을 같은 Query로 읽는 것은 이 키 조건과 다릅니다.

```text
KeyConditionExpression: #pk = :user AND begins_with(#sk, :prefix)
ExpressionAttributeNames: #pk → PK, #sk → SK
ExpressionAttributeValues: :user → USER#study-a, :prefix → QUEST#
```

문자열을 표현식에 이어 붙이지 않고 값 파라미터를 사용합니다. 숫자처럼 정렬할 문자열 ID는 001·002처럼 고정 폭을 쓰거나 별도 숫자 키 설계를 선택합니다. 문자열 1,10,2는 숫자 순서가 아닙니다.

## 로컬에서 키 조건 확인하기

Node.js 모델이며 DynamoDB의 실제 엔진·용량·일관성·페이지 제한을 구현한 것은 아닙니다.

```javascript
const rows = [
  {PK:'USER#study-a',SK:'QUEST#002'},
  {PK:'USER#study-a',SK:'PROFILE'},
  {PK:'USER#study-b',SK:'QUEST#001'},
  {PK:'USER#study-a',SK:'QUEST#001'}
];
const selected = rows.filter(x => x.PK==='USER#study-a' && x.SK.startsWith('QUEST#'));
selected.sort((a,b) => a.SK < b.SK ? -1 : a.SK > b.SK ? 1 : 0);
console.log(selected.map(x=>x.SK).join(', '));
```

```text
QUEST#001, QUEST#002
```

## Query 뒤의 Filter와 페이지 끝

Query는 파티션 키 동등 조건을 사용하고 선택적으로 정렬 키 조건을 더합니다. FilterExpression은 읽은 뒤 결과에서 걸러냅니다. 따라서 Filter로 적게 반환됐다고 읽기 작업도 그만큼 줄었다고 해석하지 않습니다. [DynamoDB Query API](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html)

한 요청은 제한된 페이지를 반환합니다. LastEvaluatedKey가 있으면 다음 요청의 ExclusiveStartKey에 넘깁니다. Filter로 모두 빠진 페이지는 Items가 비어 있어도 다음 키가 있을 수 있습니다. 항목 수가 0이라는 이유로 반복을 끝내지 않습니다. [페이지네이션 문서](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.Pagination.html)

## 실습과 풀이

1. ‘모든 사용자의 active 퀘스트’가 새 요구사항이면 어떻게 할까? **풀이:** 현재 PK 조건만으로 효율적인 동일 Query가 되지 않습니다. 추가 접근 패턴을 위한 인덱스·데이터 중복·집계 설계를 검토합니다. 무조건 Scan으로 대체한 뒤 같은 비용이라고 설명하지 않습니다.
2. 결과가 0인데 LastEvaluatedKey가 있습니다. **풀이:** 다음 페이지를 요청합니다. 완전한 마지막은 다음 키가 없는 조건으로 판단합니다.
3. SK에 QUEST#1, QUEST#10, QUEST#2를 넣습니다. **풀이:** 문자열 정렬은 1,10,2입니다. 생성 규칙을 바꾸거나 숫자 속성·키 구조를 목적에 맞게 설계합니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [HTTP 요청·응답·실패·취소를 작업 API로 이해하기](/writing/http-response-failure-cancellation/)
