---
title: "텍스처 반복·필터링·mipmap을 같은 조건에서 비교하기"
description: "Repeat와 Clamp, Nearest와 Linear, mipmap 생성과 필터 선택을 구분한다. 축소와 경계 문제를 확인하는 실습과 풀이를 정리한다."
slug: "opengl-filtering-mipmaps"
date: "2026-10-17"
topic: "graphics"
kind: "note"
tags: ["OpenGL", "Texture", "Sampling"]
draft: false
---

## 이미지 파일이 같아도 읽는 규칙에 따라 달라진다

[Textures 노트](https://app.notion.com/p/09cffc4abe964bc89989e30e866b84ae)에서 샘플링 부분을 분리했다. 객체·유닛·포맷은 [앞 글](/writing/opengl-texture-units-formats/)에서 다뤘다. 여기서는 UV가 범위를 벗어나거나 텍셀보다 작은 화면 픽셀에 많은 정보가 몰릴 때의 규칙을 본다.

Wrapping은 범위를 벗어난 UV의 처리다. 필터는 선택된 이미지에서 주변 텍셀을 읽는 방식이다. mipmap은 같은 이미지를 여러 해상도로 준비하는 구조다. 세 가지를 한 옵션으로 취급하지 않는다.

| 설정 | 다루는 문제 | 직접 바꿀 입력 |
| --- | --- | --- |
| Repeat / ClampToEdge | 0~1 밖 UV | UV 0~4 |
| Nearest / Linear | 한 레벨의 텍셀 사이 | 가까운 확대 사각형 |
| mipmap 필터 | 축소 시 사용할 레벨과 보간 | 먼 거리·기울어진 사각형 |

## mipmap을 생성하는 것과 사용하는 것은 다르다

64×64 이미지는 32,16,8,4,2,1의 레벨로 줄일 수 있다. 이 정사각형 예에서 전체 텍셀 수는 5,461이고 원본은 4,096이다. 증가분은 약 1/3이지만 실제 GPU 메모리는 포맷·블록 압축·정렬에 따라 달라진다. 이 비율을 모든 텍스처의 메모리 실측으로 쓰지 않는다.

기본 레벨 업로드가 끝난 뒤 실행하는 설정 구간이다.

```cpp
glBindTexture(GL_TEXTURE_2D, texture);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
glGenerateMipmap(GL_TEXTURE_2D);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
```

MIN_FILTER를 GL_LINEAR로 두면 mipmap을 만들어도 해당 축소 필터는 기본 레벨을 사용한다. 반대로 mipmap 필터를 지정하면서 필요한 레벨을 준비하지 않으면 텍스처 완전성 문제가 생길 수 있다. sampler 객체로 필터를 별도 지정했다면 그 설정도 조사한다.

MAG_FILTER에는 GL_NEAREST 또는 GL_LINEAR를 사용한다. mipmap 필터를 넣는 것은 잘못된 enum이다. [OpenGL glTexParameter](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glTexParameter.xhtml)

GL_LINEAR_MIPMAP_LINEAR는 한 레벨 내부의 선형 보간과 레벨 사이 보간을 함께 사용한다. 레벨 선택은 단순한 카메라 거리 임계표가 아니라 화면에서 UV가 변하는 크기와 관계있다. 비스듬한 면은 같은 거리에서도 방향별 샘플 범위가 달라진다. 이방성 필터링은 별도 기능으로 다룬다.

## 비교 장면을 통제하기

자체 생성한 64×64 흑백 체크무늬를 동일한 두 사각형에 넣는다. 텍스처 데이터, 해상도, 카메라 경로, 조명과 출력 크기는 같게 유지한다. 차이는 필터 한 항목으로 제한한다. 확대에서 Nearest/Linear를 비교한 뒤 축소에서 mipmap 유무를 비교한다.

반복 경계에는 네 가장자리의 색이 다른 자체 테스트 이미지를 추가한다. ClampToEdge는 텍스처 가장자리의 색을 확장한다. 아틀라스 내부의 다른 스프라이트 경계까지 보호해 주지는 않는다. 아틀라스에는 padding·extrusion과 mip 레벨의 번짐을 함께 확인해야 한다. [LearnOpenGL의 필터·mipmap 설명](https://learnopengl.com/Getting-started/Textures)

## 실습과 풀이

1. UV를 0~4로 넓혀 Repeat와 ClampToEdge를 비교한다. **풀이:** Repeat는 패턴을 반복하고 Clamp는 바깥에서 가장자리 텍셀을 읽는다. 단순히 이미지를 확대하는 것과 UV 반복은 다르다.
2. mipmap 생성만 남기고 MIN_FILTER를 GL_NEAREST로 바꾼다. **풀이:** 기본 레벨의 최근접 샘플이다. ‘생성했다’는 사실만으로 레벨이 사용된다고 기록하지 않는다.
3. 8×8부터 1×1까지의 텍셀 수를 계산한다. **풀이:** 64+16+4+1=85다. 원본 대비 21 텍셀이 추가된다. 이 숫자는 RGBA8 바이트 수로 바꿀 때 4를 곱하지만 드라이버 할당량과는 구분한다.

## 확인한 범위

원문을 대조하고 옵션·수치 예제를 새로 정리했다. GPU 장면, 움직일 때의 깜박임, 샘플 비용과 메모리는 측정하지 않았다. 비교 화면이나 FPS를 만들어 첨부하지 않았다. AI를 설명과 실습 구성에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [Local·World·View·Clip·NDC·Screen 좌표를 구분하기](/writing/local-world-clip-ndc-screen/)
