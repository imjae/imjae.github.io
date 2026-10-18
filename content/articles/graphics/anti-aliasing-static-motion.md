---
title: "AA 방식과 움직일 때의 계단·흐림·잔상 비교"
description: "MSAA·FXAA·SMAA·TAA가 사용하는 정보를 구분하고 동일한 정지·이동 장면에서 비교할 조건을 정한다. 커버리지 계산과 실습·풀이를 담았다."
slug: "anti-aliasing-static-motion"
date: "2024-05-05"
dateBasis: "notion"
updated: "2026-10-18"
topic: "graphics"
kind: "note"
tags: ["Graphics", "Anti-aliasing", "Rendering"]
draft: false
---

## 사선의 계단과 움직이는 잔상을 따로 보기

[Anti-aliasing](https://app.notion.com/p/1481dc86e8024d2eab5f23ebd7dfcb35)과 [AA](https://app.notion.com/p/3a43b61361d180718a2ee9da8190ffcd) 노트를 하나로 묶었다. 과거 Post Processing Stack 옵션과 현재 렌더 파이프라인의 지원을 섞지 않는다. 이 글은 새 비교 화면이 없는 개념·실험 가이드다.

앨리어싱은 연속적인 형태·신호를 제한된 샘플로 표현할 때 생기는 문제다. 실루엣의 계단뿐 아니라 작은 무늬의 깜박임도 포함한다. 화면을 흐리는 것과 필요한 신호를 더 잘 샘플링하는 것은 결과와 비용이 다르다.

| 방식 | 주요 정보 | 함께 볼 한계 |
| --- | --- | --- |
| MSAA | 픽셀 안의 여러 coverage·깊이 샘플 | 모든 셰이더·텍스처 aliasing을 해결하지 않음 |
| FXAA | 현재 이미지의 경계 | 세부 표현이 부드러워질 수 있음 |
| SMAA | 현재 이미지의 형태 기반 경계 | 설정·단계별 구현 차이 |
| TAA | 여러 프레임, jitter·motion 정보 등 | history 거절·잔상·disocclusion |

MSAA에서 셰이딩이 ‘항상 픽셀당 정확히 한 번’이라고 일반화하지 않는다. sample shading과 픽셀 안에 겹치는 프리미티브 등 조건이 다르다. 또한 Deferred와 Forward의 MSAA 지원은 대상 엔진·파이프라인에 맞춰 확인한다. [Khronos OpenGL core 명세](https://registry.khronos.org/OpenGL/specs/gl/glspec46.core.pdf), [Unity HDRP AA](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/Anti-Aliasing.html)

## 커버리지의 작은 수치 예

검은 배경 위의 흰 삼각형이 한 픽셀 안의 네 표본 중 하나만 덮는다고 하자. 단순 resolve 모델은 `(1+0+0+0)/4=0.25`다. 두 표본이면 0.5다. 실제 GPU resolve·색 공간·셰이딩은 더 많은 조건을 가지므로 이 계산을 완성된 MSAA 구현으로 보지 않는다.

TAA도 단순히 현재 값과 이전 값을 평균하는 것만으로는 충분하지 않다. 카메라가 이동하면 이전 프레임의 대응 위치가 달라지고, 새로 드러난 배경에는 올바른 history가 없을 수 있다. 잘못된 history를 오래 유지하면 잔상이 생길 수 있다.

## 비교 장면과 기록표 만들기

자체 실습 장면에 얇은 막대, 사선, 작은 반복 무늬, 움직이는 물체와 UI 글자를 둔다. 해상도·렌더 스케일·노출·카메라 경로를 고정한다. 정지 화면과 같은 속도의 이동을 각각 캡처한다.

```text
조건: 파이프라인/버전, 렌더 경로, 출력 해상도, 렌더 스케일
항목: 실루엣, 무늬 깜박임, 가는 선 소실, 움직임 잔상, UI 선명도
비용: 같은 장치의 GPU 구간과 메모리, 워밍업·샘플 수
```

## 실습과 풀이

1. 정지 화면만으로 TAA를 판단한다. **풀이:** 이동과 새로 드러나는 영역의 history 오류를 보지 못한다. 정지 선명도와 시간 안정성을 따로 기록한다.
2. MSAA를 켰는데 텍스처가 계속 반짝인다. **풀이:** coverage 샘플만으로 고주파 텍스처 문제가 모두 해결되지는 않는다. mipmap·필터·shader aliasing을 함께 조사한다.
3. 더 작은 해상도에서 한 방식이 빨라졌다. **풀이:** 방식만 바뀐 비교가 아니다. 출력·렌더 해상도와 카메라 경로를 맞춘 뒤 비용을 다시 측정한다.

## 확인한 범위

두 노션과 공개 렌더링 문서를 대조했다. 실제 AA 지원 설정·정지/이동 캡처·GPU 시간·잔상 비교는 미검증이다. 방식의 우열이나 FPS 감소율을 만들지 않았다. 작성과 실습 설계에 AI를 사용했다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [Bloom과 노출을 분리해서 발광 조절하기](/writing/bloom-exposure-emission/)
