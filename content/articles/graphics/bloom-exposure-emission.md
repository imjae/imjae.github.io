---
title: "Bloom과 노출을 분리해서 발광 조절하기"
description: "표면 발광·HDR 값·노출·Bloom의 역할을 나누고 같은 노출에서 효과를 비교한다. 밝은 값 추출 모델과 실습·풀이를 제공한다."
slug: "bloom-exposure-emission"
date: "2024-05-05"
dateBasis: "notion"
updated: "2026-10-18"
topic: "graphics"
kind: "note"
tags: ["Graphics", "Bloom", "Exposure", "VFX"]
draft: false
---

## 주변이 번지는 것과 장면 전체가 밝아지는 것

[Bloom 노트](https://app.notion.com/p/3bc274ba4f974068b1e661f6eecac793)는 과거 후처리 설정을 정리했다. Soft Knee·Diffusion·Fast Mode 등의 이름을 현재 모든 파이프라인의 메뉴라고 쓰지 않는다. 여기서는 Unity HDRP 17 계열 문서의 Bloom·Exposure를 참고해 역할을 분리한다.

발광은 재질이 내보내는 색 값이다. 노출은 장면의 밝기를 카메라 기준으로 조정한다. Bloom은 밝은 영역 주변으로 빛이 번지는 표현을 만든다. 톤매핑은 넓은 밝기 범위를 출력에 맞게 옮긴다. Bloom을 켰다는 사실만으로 물체가 주변을 실제로 조명하거나 GI에 기여하는 것은 아니다. [HDRP Bloom](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/Post-Processing-Bloom.html)

## 설명용 밝은 값 추출 모델

다음은 실제 HDRP 알고리즘이 아니라 threshold·blur·합성을 이해하기 위해 만든 1차원 모델이다. Node.js에서 실행한다. 입력은 선형의 비음수 밝기 값이며 렌더링·노출·색 채널은 생략했다.

```javascript
const scene = [0,0,4,0,0], threshold = 1, intensity = 0.5;
const bright = scene.map(v => Math.max(v-threshold,0));
const at = i => bright[Math.max(0,Math.min(bright.length-1,i))];
const spread = bright.map((_,i) => .25*at(i-1)+.5*at(i)+.25*at(i+1));
console.log(bright);
console.log(scene.map((v,i) => v+spread[i]*intensity));
```

```text
[ 0, 0, 3, 0, 0 ]
[ 0, 0.375, 4.75, 0.375, 0 ]
```

중앙의 밝은 값이 주변에 기여하는 구조를 볼 수 있다. 실제 파이프라인의 threshold 단위·pre-exposure·다단계 필터는 패키지 문서와 셰이더로 확인해야 한다. 모델 숫자를 Inspector의 동일한 수치로 해석하지 않는다.

## 비교할 때 노출을 고정하기

자동 노출은 장면 구성이 바뀔 때 밝기를 조정할 수 있다. 이 상태에서 Bloom 강도만 바꿨다고 생각해도 다른 변수가 움직일 수 있다. 먼저 고정 노출과 같은 카메라·해상도·배경에서 발광 값, Bloom 강도, 번짐 범위를 각각 바꾼다. [HDRP Exposure](https://docs.unity3d.com/Packages/com.unity.render-pipelines.high-definition@17.0/manual/Override-Exposure.html)

| 비교 | 고정할 값 | 관찰 |
| --- | --- | --- |
| emission 변화 | 노출·Bloom | 표면 밝기와 주변 번짐 |
| Bloom 강도 변화 | emission·노출 | 번짐의 기여 |
| 노출 변화 | 같은 장면·발광 | 장면 전체의 밝기 관계 |
| 품질 변화 | 위 값·출력 해상도 | 형태·GPU 비용 |

## 실습과 풀이

1. Bloom만 끄고 emission은 유지한다. **풀이:** 밝은 표면과 주변 번짐을 분리해서 본다. 주변 조명까지 사라진다면 다른 조명·GI 설정도 조사한다.
2. 밝은 배경을 큰 면적으로 넣는다. **풀이:** 자동 노출과 고정 노출을 구분한다. 화면이 어두워졌다고 발광 재질이 잘못됐다고 즉시 결론 내리지 않는다.
3. 위 모델에서 intensity를 0으로 한다. **풀이:** 결과는 원래 scene이다. threshold를 바꾸는 것과 intensity를 바꾸는 것은 밝은 값 추출 범위·기여량이라는 다른 조작이다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

노션의 설정 메모와 HDRP 문서를 대조해 수치 예제를 작성했다. 실제 HDRP 볼륨·발광·노출·톤매핑 화면과 GPU 비용은 미검증이다. 기존 [불 이펙트 글](/writing/fire-vfx/)의 성능 근거를 추가한 것은 아니다. AI를 작성 보조에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [React useEffect로 작업 상태를 동기화하고 정리하기](/writing/react-effect-task-cleanup/)
