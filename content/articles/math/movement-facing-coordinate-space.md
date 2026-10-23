---
title: "캐릭터 방향과 이동 벡터를 같은 좌표계로 맞추기"
description: "월드 이동을 캐릭터 로컬의 오른쪽·전방 성분으로 바꿔 Blend Tree 입력을 만듭니다. 0·90·180도 표와 역변환 실습으로 부호 문제를 확인합니다."
slug: "movement-facing-coordinate-space"
date: "2023-12-12"
dateBasis: "notion"
updated: "2026-10-23"
topic: "math"
kind: "note"
tags: ["Unity", "Math", "Animation"]
draft: false
---

## 왼쪽 입력인데 뒤로 걸어야 하는 상황

[오브젝트 회전 노트](https://app.notion.com/p/2ff48514531147a7a34e83370aa3dca8)에는 마우스를 바라보는 캐릭터의 키보드 이동을 Blend Tree에 전달할 때 앞뒤가 바뀐 기록이 있습니다. 여러 Quaternion 표현을 바꿔 적용했지만 기준 좌표계의 설명이 부족했습니다.

회전의 부호는 축과 좌표계 규약에 따라 달라집니다. 여기서는 월드 이동을 캐릭터 로컬로 옮기는 **역변환** 문제로 설명합니다. 관련 노트는 [유니티 상식](https://app.notion.com/p/2c83b61361d180bcab16f64a3676626a)에 있습니다.

## 방향을 회전하는 것과 기준을 바꾸는 것

캐릭터가 +Z를 보고 있고 입력이 +Z면 로컬 전진입니다. 캐릭터가 +X를 보고 입력이 -X면 월드의 왼쪽 이동이지만 캐릭터 기준으로 후진입니다. Blend Tree의 x를 좌우, y를 앞뒤로 정했다면 두 번째 결과는 대략 (0,-1)입니다.

월드 방향을 로컬로 바꾸려면 캐릭터 회전의 역을 적용합니다. Unity에서는 다음 구간으로 표현할 수 있습니다. `worldMove`는 월드 기준 이동 방향이며, Transform의 위치가 아닙니다.

```csharp
Vector3 local = transform.InverseTransformDirection(worldMove);
animator.SetFloat("MoveX", local.x);
animator.SetFloat("MoveY", local.z);
```

InverseTransformDirection은 방향의 좌표 기준을 바꿉니다. 위치에는 InverseTransformPoint를 사용합니다. 카메라 기준 입력이라면 먼저 카메라의 수평 right·forward로 월드 방향을 만든 후 위 변환을 적용합니다. 기울어진 카메라의 축을 평면에 투영한 뒤 정규화하는 순서도 확인합니다. [Unity API 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Transform.InverseTransformDirection.html)

## 숫자로 먼저 검증하기

다음은 yaw=0에서 forward=+Z, yaw=90°에서 forward=+X라는 규약의 수평 계산입니다. Node.js에서 실행합니다. dot 성분은 [벡터 글](/writing/vector-length-dot-cross/)과 연결됩니다.

```javascript
function localMove(yawDegrees, x, z) {
  const a = yawDegrees * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return [x*c-z*s, x*s+z*c];
}
const format = v => (Math.abs(v)<1e-9 ? 0 : v).toFixed(3);
for (const yaw of [0,90,180]) {
  console.log(yaw, localMove(yaw,-1,0).map(format).join(', '));
}
```

```text
0 -1.000, 0.000
90 0.000, -1.000
180 1.000, 0.000
```

같은 월드 이동이 캐릭터를 어떻게 돌려 놓느냐에 따라 좌·후·우가 됩니다. 쿼터니언 생성 함수를 바꾸는 것만으로는 정방향 변환과 역변환을 뒤바꾼 문제가 없어지지 않습니다.

## 실습과 풀이

1. yaw=90°, worldMove=(0,0,1)을 넣습니다. **풀이:** 캐릭터가 +X를 보고 있으므로 +Z는 왼쪽입니다. 결과는 (-1,0)입니다.
2. 입력 길이를 0.3으로 낮춥니다. **풀이:** 로컬 변환 후에도 길이가 0.3입니다. 애니메이션에서 아날로그 세기를 유지하려면 항상 정규화하지 않습니다. 디지털 대각 입력의 최대 길이 제한은 별도 정책입니다.
3. localMove를 다시 월드로 복원합니다. **풀이:** world=(localX*c+localZ*s, -localX*s+localZ*c)입니다. 원래 입력과 작은 오차 안에서 같아야 합니다. 모델의 시각적 전방이 +Z가 아니라면 모델 자식의 보정 회전도 조사합니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [Addressables 로드 핸들의 수명과 해제 책임](/writing/addressables-handle-lifetime/)
