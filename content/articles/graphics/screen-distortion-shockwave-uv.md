---
title: "화면 텍스처 왜곡과 충격파: UV 오프셋부터 계산하기"
description: "화면 색 복사와 UV 이동을 나누고 방사형 파형·종횡비·중심 예외를 계산합니다. Built-in GrabPass와 SRP의 차이를 실습·풀이로 정리합니다."
slug: "screen-distortion-shockwave-uv"
date: "2024-11-06"
dateBasis: "notion"
updated: "2026-10-23"
topic: "graphics"
kind: "note"
tags: ["Shader", "UV", "VFX", "Unity"]
draft: false
---

## 화면을 휘게 만드는 것은 샘플 위치입니다

<div id="화면을-휘게-만드는-것은-샘플-위치다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[왜곡](https://app.notion.com/p/1363b61361d18071a8fac0a1efe06f70)과 [충격파](https://app.notion.com/p/1363b61361d180f4baabce9945942b26)는 GrabPass 기반 셰이더 코드 노트입니다. 결과 캡처나 성능 기록이 없어 실행 완료 사례로 소개하지 않습니다. 원문 코드 전체와 내부 이름 대신 작은 UV 함수로 원리를 새로 설명합니다.

```text
원래 화면 UV → 파형·마스크 계산 → UV + offset → 준비된 화면 색 샘플
```

GrabPass는 Built-in 파이프라인의 기능입니다. URP·HDRP에 같은 블록을 붙이는 방식은 지원되지 않습니다. SRP에서는 파이프라인이 제공하는 화면 색·opaque texture·custom pass 등의 접근 시점과 범위를 정해야 합니다. [Unity GrabPass 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/SL-GrabPass.html)

## 원형 파형을 만드는 네 값

중심 c와 UV의 차이를 q라 하고, 가로에 화면 종횡비를 곱합니다. `distance=length(q)`에서 파의 반지름 r과 차이가 작은 곳에만 오프셋을 줍니다. width는 띠의 두께, strength는 이동량입니다. 비율을 보정하지 않으면 넓은 화면에서 원이 타원처럼 보일 수 있습니다.

다음 HLSL 함수는 **이미 0~1로 정규화된 화면 UV**에 적용합니다. 투영 좌표를 입력받지 않으며 완성된 Unity 셰이더는 아닙니다. aspect>0, width>0, radius≥0인 유한 입력을 전제로 합니다.

```hlsl
float2 ShockOffset(float2 uv, float2 center, float aspect,
                   float radius, float width, float strength)
{
    float2 q = (uv - center) * float2(aspect, 1.0);
    float d = length(q);
    if (d < 0.000001) return float2(0.0, 0.0);
    float band = 1.0 - smoothstep(0.0, width, abs(d - radius));
    float2 offset = q / d * band * strength;
    return offset / float2(aspect, 1.0);
}
```

중심에서 방향이 정의되지 않으므로 0을 반환합니다. radial 좌표에서 만든 offset을 UV로 되돌릴 때 종횡비도 다시 나눕니다. 원문의 파형 누적 변수처럼 합산하는 값은 반드시 0으로 초기화합니다. 초기화하지 않은 지역 변수는 예측 가능한 시작값으로 취급할 수 없습니다.

## 샘플링 전후의 공간을 섞지 않기

화면 투영 좌표가 float4라면 사용하는 API의 원근 나눗셈·Y 반전·렌더 타깃 배율을 확인합니다. clip 좌표의 z를 임의로 UV 보정에 곱하지 않습니다. [좌표 변환 글](/writing/local-world-clip-ndc-screen/)의 clip·NDC 차이가 여기에 연결됩니다.

또한 화면 색 복사에 투명 객체가 포함되는지, 왜곡 오브젝트 자신이 포함되는지, 깊이 경계를 넘어서 뒤 배경을 끌어오는지를 확인합니다. 노멀 텍스처를 오프셋 가이드로 쓰면 unpack 뒤 xy와 마스크를 사용하고 컬러 텍스처의 sRGB 규약을 그대로 적용하지 않습니다.

## 실습과 풀이

1. aspect=2, center=(0.5,0.5), radius=0.2인 파에서 오른쪽 경계 UV를 구합니다. **풀이:** q.x=0.2이므로 UV x=0.6입니다. 위 경계는 y=0.7입니다. 픽셀 공간에서는 같은 반지름이 됩니다.
2. strength를 0으로 만듭니다. **풀이:** offset은 모든 위치에서 0입니다. 이때도 색이 달라지면 화면 색 취득·색 공간·블렌딩 문제부터 확인합니다.
3. width를 0으로 넣습니다. **풀이:** 함수 전제 위반입니다. CPU에서 양수로 제한하거나 셰이더에서 최소값을 정합니다. 화면 크기가 달라도 일정 픽셀 두께가 필요하면 정규화 UV 대신 픽셀 단위 계약을 추가합니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [텍스처를 여러 번 샘플링해 블러 만들기](/writing/texture-blur-kernel-texel/)
