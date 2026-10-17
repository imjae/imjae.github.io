---
title: "텍스처를 여러 번 샘플링해 블러 만들기"
description: "샘플 위치·가중치·텍셀 크기·경계를 나눠 블러를 설계한다. 대각 다섯 점 평균과 분리형 커널의 차이를 수치 예제·실습·풀이로 설명한다."
slug: "texture-blur-kernel-texel"
date: "2026-10-17"
topic: "graphics"
kind: "note"
tags: ["Shader", "Texture", "Filtering"]
draft: false
---

## 다섯 번 읽었다고 가우시안 블러가 되지는 않는다

[블러 노트](https://app.notion.com/p/1363b61361d18028bb07c5df82b4689d)의 코드는 중앙과 양쪽 대각선의 두 거리, 총 다섯 점을 같은 비중으로 평균한다. 2차원 대칭 가우시안 커널로 이름 붙이지 않는다. 특정 방향의 형태가 남는 이유를 샘플 위치에서 설명할 수 있다.

블러는 주변 값의 가중합이다. 가중치 합이 1이면 일정한 입력을 같은 값으로 유지할 수 있다. 합이 2면 단순 평균이 아니라 밝기 증폭이 섞인다. 색은 보통 선형 공간에서 평균할지 정하고, sRGB 값의 산술 평균과 구분한다.

## 텍셀 하나의 UV 크기

폭 W, 높이 H에서 한 텍셀 이동은 `(1/W,1/H)`다. UV에 0.01을 더하면 100px 이미지에서는 1px, 1,000px 이미지에서는 10px에 해당한다. 해상도와 무관한 픽셀 반경이 필요하면 texelSize를 곱한다.

아래 HLSL은 준비된 Texture2D·SamplerState에 넣는 **가로 3탭 구간**이다. 파이프라인 바인딩·화면 색 복사는 포함하지 않는다.

```hlsl
float4 BlurHorizontal(Texture2D source, SamplerState linearClamp,
                      float2 uv, float2 texelSize)
{
    float2 dx = float2(texelSize.x, 0.0);
    return source.Sample(linearClamp, uv - dx) * 0.25
         + source.Sample(linearClamp, uv)      * 0.50
         + source.Sample(linearClamp, uv + dx) * 0.25;
}
```

세로 패스도 같은 가중치로 적용하면 두 커널의 곱으로 3×3의 이항 커널이 된다. 이것은 연속 가우시안의 정확한 적분이 아니라 가우시안 모양에 가까운 이산 근사다. 가로 결과를 중간 타깃에 쓰고 세로에서 읽어야 한다. 같은 타깃에 동시에 읽고 쓰는 일반 렌더 패스로 설명하지 않는다. [LearnOpenGL의 분리형 blur 설명](https://learnopengl.com/Advanced-Lighting/Bloom)

## Node.js에서 1차원 커널 확인하기

`blur.mjs`로 실행한다. 범위 밖은 가장자리 값으로 clamp한다.

```javascript
function blur(a) {
  const at = i => a[Math.min(a.length-1, Math.max(0,i))];
  return a.map((_,i) => 0.25*at(i-1)+0.5*at(i)+0.25*at(i+1));
}
console.log(blur([0,0,1,0,0]));
console.log(blur([1,1,1,1,1]));
```

```text
[ 0, 0.25, 0.5, 0.25, 0 ]
[ 1, 1, 1, 1, 1 ]
```

첫 입력은 한 점의 에너지가 이웃으로 퍼지는 것을 보여 준다. 두 번째는 가중치 합 검사용이다. 경계 정책이 repeat라면 오른쪽 끝 값이 왼쪽에 섞일 수 있다. 알파가 있는 이미지에는 PMA·Straight 처리도 함께 결정해야 경계가 어두워지는 문제를 해석할 수 있다.

## 실습과 풀이

1. 중앙 가중치를 1로 바꾸고 양옆 0.25는 유지한다. **풀이:** 합이 1.5이므로 균일한 1 입력이 1.5가 된다. 흐림 정도만 바꾸는 실험이 아니다.
2. 폭만 두 배로 늘린다. **풀이:** 1px 반경을 유지하려면 texelSize.x가 절반이 되어야 한다. 고정 UV 오프셋은 반경이 커진다.
3. 대각 다섯 점 평균과 가로·세로 패스를 비교한다. **풀이:** 샘플의 지지 영역과 방향성이 다르다. 횟수만으로 품질이나 GPU 비용을 비교하지 말고 중간 타깃·대역폭·해상도도 기록한다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

원문 샘플 위치를 읽고 커널·수치 예제를 새로 작성했다. HLSL 컴파일·렌더 타깃·영상 블러·알파 경계·GPU 시간은 미검증이다. 콘솔 배열 결과는 실제 이미지 캡처가 아니다. 작성에 AI를 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [노이즈 임계값으로 Dissolve와 발광 경계 만들기](/writing/dissolve-threshold-edge/)
