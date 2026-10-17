---
title: "노이즈 임계값으로 Dissolve와 발광 경계 만들기"
description: "노이즈와 임계값의 부등호를 정하고 경계 폭·시작과 종료·투명도·깊이 쓰기를 구분한다. 수치 예제와 실습·풀이를 제공한다."
slug: "dissolve-threshold-edge"
date: "2026-10-17"
topic: "graphics"
kind: "note"
tags: ["Shader", "VFX", "Dissolve"]
draft: false
---

## 어떤 노이즈가 남을지 부등호부터 정하기

[소환 노트](https://app.notion.com/p/1363b61361d180ae960af8f2997b8266)에는 노이즈·알파·발광 경계를 사용하는 셰이더가 있다. 이 글은 내부 이름과 원문 전체를 옮기지 않고 한 픽셀의 규칙을 새로 구성했다. 실제 소환 화면을 복원한 결과는 아니다.

noise n이 0~1이고 threshold t보다 크거나 같으면 남는다고 정한다. `n ≥ t`가 보존 조건이다. t를 올리면 남는 영역이 줄어든다. 경계 발광은 살아 있는 부분 중 `0 ≤ n-t < width`에만 둔다.

```hlsl
float delta = noiseValue - threshold;
clip(delta);
float edge = 1.0 - smoothstep(0.0, edgeWidth, delta);
float3 color = baseColor + edge * edgeColor * intensity;
```

이 구간은 edgeWidth>0, 유한한 값과 linear 색을 전제로 한 HLSL 픽셀 로직이다. `clip(0)`은 폐기하지 않으므로 n=1인 픽셀은 t=1에서도 남을 수 있다. 완전 소멸이 필요하면 t를 1보다 크게 보내거나 종료 상태에서 렌더링을 끄는 계약을 둔다. [HLSL clip](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-clip)

## 단계별 수치 예제

Node.js에서 실행한다. 여기서는 부드러운 경계 강도 대신 경계 포함 여부만 확인한다.

```javascript
function sample(n,t,width) {
  if (!Number.isFinite(width) || width <= 0) throw new Error('width');
  const d=n-t;
  return {alive:d>=0, edge:d>=0 && d<width};
}
for (const n of [0.2,0.5,0.55,0.9])
  console.log(n, sample(n,0.5,0.1));
```

```text
0.2 { alive: false, edge: false }
0.5 { alive: true, edge: true }
0.55 { alive: true, edge: true }
0.9 { alive: true, edge: false }
```

## 알파·깊이·Bloom을 따로 확인하기

clip은 픽셀을 폐기한다. alpha blending은 남는 픽셀을 배경과 섞는다. 같은 효과가 아니며 RenderQueue·ZWrite·그림자 패스에서도 같은 소멸 규칙이 필요한지 결정한다. 표면은 사라졌는데 그림자가 남는 문제는 색 패스만 고쳐 해결되지 않는다.

발광 값을 추가했다고 Bloom이 자동으로 켜지지 않는다. HDR 값, 노출과 후처리 경로도 연결되어야 한다. 노이즈 스케일은 표면 패턴의 크기를 바꾸고 경계 폭은 **노이즈 값의 범위**다. width=0.1이 월드 10cm를 뜻하지 않는다. 표면 기울기와 노이즈 분포에 따라 화면 경계 두께가 달라진다.

## 실습과 풀이

1. 일정한 n=0.5 텍스처를 사용한다. **풀이:** t가 0.5를 넘을 때 한꺼번에 사라진다. 점진적인 면적 변화는 노이즈 값의 공간 분포에서 나온다.
2. t=0, 0.5, 1, 1.01을 비교한다. **풀이:** n∈[0,1]일 때 1.01은 모두 폐기한다. 정확한 0·1 경계의 정책을 코드와 맞춘다. 원문 step의 인자 순서를 그대로 옮기기 전에 보존 조건을 표로 확인한다.
3. 경계 width를 줄인다. **풀이:** 노이즈 값에 가까운 얇은 띠만 남는다. 발광 intensity를 함께 바꾸지 말고 폭과 밝기를 따로 비교한다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

노션의 코드 주제와 HLSL 명령 의미를 대조해 독립 예제를 작성했다. HLSL 컴파일·노이즈 텍스처·시작/중간/종료 화면·그림자·깊이·GPU 비용은 미검증이다. DCB 불 효과의 구현 성과로 취급하지 않는다. AI를 설명과 예제 작성에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [AA 방식과 움직일 때의 계단·흐림·잔상 비교](/writing/anti-aliasing-static-motion/)
