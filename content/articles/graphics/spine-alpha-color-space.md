---
title: "Spine 텍스처의 PMA·Straight Alpha·색 공간 맞추기"
description: "내보낸 RGB·알파와 셰이더 블렌딩을 맞추고 Alpha Is Transparency·sRGB·mipmap의 역할을 구분한다. 수치 예제와 경계 실습·풀이를 담았다."
slug: "spine-alpha-color-space"
date: "2026-10-17"
topic: "graphics"
kind: "note"
tags: ["Unity", "Spine", "Alpha", "Texture"]
draft: false
---

## 경고를 없애기 전에 데이터와 셰이더의 짝을 확인하기

[스파인 텍스처 알파값 설정](https://app.notion.com/p/03524cd5da6e474b985ca057f71420b4)에는 UI Spine의 mipmap 경고와 설정 조사 과정이 있다. Sprite에서 Default로 바꾸면서 기본 mipmap 설정이 달라진 관찰을 확인했다. 원문 이미지·일부 외부 블록은 확인하지 못했고 사내 경로와 캡처는 옮기지 않았다.

이 글은 **노트의 설명을 바로잡은 학습 글**이다. 원문의 설정 변경이 모든 조합에서 올바른 해결이라는 뜻은 아니다. 특히 Alpha Is Transparency가 PMA 변환이라는 설명을 사용하지 않는다.

## Straight와 PMA는 저장된 RGB가 다르다

불투명한 빨강 C=(1,0,0)의 alpha가 0.25라면 Straight는 RGB=(1,0,0), PMA는 RGB=(0.25,0,0)을 저장한다. 같은 선형 색 값에서 파란 배경 B=(0,0,1)에 합성하면 두 올바른 규약은 같은 RGB를 만든다.

```text
Straight 출력: C * a + B * (1-a)
PMA 출력:     Cp     + B * (1-a),  Cp=C*a
```

이 식은 셰이더의 **출력 RGB** 기준이다. Straight 텍스처를 셰이더 안에서 PMA로 바꾼 뒤 PMA 블렌드를 사용하는 방식도 있다. 따라서 텍스처 형식과 ShaderLab Blend 한 줄만 보고 일치 여부를 단정하지 않는다. Spine의 Straight Alpha Texture 옵션과 셰이더 내부 처리를 함께 본다. [Spine 렌더링 설명](https://esotericsoftware.com/spine-unity-rendering)

## 수치로 보는 이중 곱셈

Node.js에서 실행하는 독립 RGB 모델이다. 색 공간 변환·필터링·톤매핑을 포함하지 않는다.

```javascript
const a = 0.25, color = [1,0,0], background = [0,0,1];
const pma = color.map(c => c*a);
const straightResult = color.map((c,i) => c*a+background[i]*(1-a));
const pmaResult = pma.map((c,i) => c+background[i]*(1-a));
const doubleAlpha = pma.map((c,i) => c*a+background[i]*(1-a));
console.log(straightResult);
console.log(pmaResult);
console.log(doubleAlpha);
```

```text
[ 0.25, 0, 0.75 ]
[ 0.25, 0, 0.75 ]
[ 0.0625, 0, 0.75 ]
```

이미 곱한 RGB에 alpha를 다시 곱하면 빨강 기여가 작아진다. 실제 경계의 검은 띠는 이 문제뿐 아니라 투명 텍셀 RGB의 필터 번짐에서도 생길 수 있다.

## 임포트 옵션과 색 공간의 역할

| 항목 | 다루는 것 | 혼동하지 않을 것 |
| --- | --- | --- |
| Alpha Is Transparency | 투명 주변 RGB 확장으로 필터 경계 보완 | RGB에 alpha를 곱하는 변환 |
| sRGB | 색 데이터의 읽기 변환 | 알파 형식 선택 |
| Generate Mip Maps | 축소 레벨 생성 | 마스크 경계의 자동 정답 |
| Straight Alpha Texture | 해당 Spine 셰이더의 입력 해석 | 모든 셰이더에 같은 이름·동작 |

[Unity alphaIsTransparency 문서](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/TextureImporter-alphaIsTransparency.html)는 투명 영역의 색 확장을 설명한다. Spine의 현재 자산 문서는 Linear에서는 Straight workflow를 안내하며 Gamma 전용 PMA와 구분한다. 예전 노트의 ‘sRGB를 끄자’를 전체 프로젝트에 적용하지 않는다. 사용하는 Spine 런타임 버전의 export·import·shader 조합으로 확인한다. [Spine 자산 workflow](https://esotericsoftware.com/spine-unity-assets)

## 실습과 풀이

1. 자체 제작한 반투명 원을 검정·흰색·파랑 배경에 겹친다. **풀이:** Straight와 PMA를 각각 올바른 출력·블렌드로 맞춰 비교한다. 두 배경에서만 정상이면 경계 데이터와 필터를 추가 확인한다.
2. 같은 atlas로 mipmap만 켜고 끈다. **풀이:** 확대·축소를 모두 확인한다. 확대만 보고 mipmap 경계가 해결됐다고 결론 내리지 않는다. 컬러 공간과 export 형식은 고정한다.
3. SkeletonGraphic의 공유 재질 옵션을 바꾼다. **풀이:** 같은 재질을 사용하는 다른 UI에도 영향이 간다. 필요한 경우 호환되는 별도 재질을 관리하고 [마스크 배칭 글](/writing/spine-mask-material-batching/)처럼 재질 수·배칭도 따로 확인한다.

## 확인한 범위

2026년 10월 17일 본문의 JavaScript를 추출해 Node.js 24.15.0에서 실행했고, 표시한 입력의 출력과 일치했다. 이 확인은 독립 수치·응답 모델의 해당 예제 입력을 대상으로 한다.

노션 텍스트와 Unity·Spine 문서를 대조하고 합성 모델을 새로 작성했다. Unity·Spine 컴파일, atlas export·import, UI 캡처·경계·배칭·색 공간 비교는 미검증이다. 수치 합성이 실제 파이프라인의 화면 검증을 대신하지 않는다. 설명·예제 작성에 AI를 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [화면 텍스처 왜곡과 충격파: UV 오프셋부터 계산하기](/writing/screen-distortion-shockwave-uv/)
