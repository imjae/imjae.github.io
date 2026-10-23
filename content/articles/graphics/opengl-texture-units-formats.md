---
title: "텍스처 객체·텍스처 유닛·sampler와 이미지 포맷"
description: "객체 이름과 유닛 번호를 구분하고 RGBA 데이터, 행 정렬과 sampler 연결을 확인합니다. 직접 만든 2×2 텍스처 예제와 실패 조건별 실습을 다룹니다."
slug: "opengl-texture-units-formats"
date: "2023-06-25"
dateBasis: "notion"
updated: "2026-10-23"
topic: "graphics"
kind: "note"
tags: ["OpenGL", "GLSL", "Texture"]
draft: false
---

## 텍스처를 만들었는데 다른 이미지가 나오는 이유

[Textures 노트](https://app.notion.com/p/09cffc4abe964bc89989e30e866b84ae)에는 이미지 로드, 텍스처 생성과 두 이미지 혼합이 함께 있습니다. 연결을 세 단계로 나누면 어디가 틀렸는지 찾기 쉽습니다.

```text
sampler uniform의 값 1 → 텍스처 유닛 1 → 그 유닛의 GL_TEXTURE_2D 객체
```

`glGenTextures`가 돌려준 객체 이름이 7이어도 sampler에 7을 넣는 것이 아닙니다. 유닛 1에 그 객체를 연결했다면 sampler 값은 정수 1입니다. `GL_TEXTURE1` 열거값 자체를 전달하지도 않습니다.

## 포맷은 저장 형식과 입력 해석으로 나뉩니다

<div id="포맷은-저장-형식과-입력-해석으로-나뉜다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

`glTexImage2D`의 internalFormat은 GPU 쪽 저장 형식, format과 type은 CPU 입력 바이트의 해석입니다. 알파가 필요한 RGBA 이미지라면 내부 형식에도 알파가 있어야 합니다. 입력을 RGBA로 읽으면서 내부를 RGB로 저장하면 입력 정렬은 맞더라도 알파 보존 목적에는 맞지 않습니다.

| 입력 예 | 한 픽셀 | 행 크기 | 확인할 점 |
| --- | --- | --- | --- |
| RGB unsigned byte, 폭 3 | 3바이트 | 9바이트 | 기본 unpack alignment 4와 패딩 불일치 |
| RGBA unsigned byte, 폭 2 | 4바이트 | 8바이트 | 행 정렬 4에 맞음 |
| 단일 채널 마스크 | 1바이트 | 폭에 따라 다름 | 색 데이터·감마 처리와 구분 |

아래 예제는 패딩 없는 바이트 배열을 쓰기 위해 upload 중 unpack alignment를 1로 설정한 뒤 이전 상태를 복원합니다. [OpenGL 텍스처 참조](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glTexImage2D.xhtml)

## 외부 이미지 없이 텍스처 만들기

OpenGL 3.3 컨텍스트와 로더가 준비된 C++ 파일에서 사용합니다. GL 객체는 컨텍스트가 살아 있을 때 만듭니다. 원문 이미지 대신 아래 네 픽셀을 새로 구성했습니다.

```cpp
const unsigned char pixels[] = {
    255, 0, 0, 255,    0, 255, 0, 255,
    0, 0, 255, 255,    255, 255, 255, 128
};
GLuint texture = 0;
glGenTextures(1, &texture);
glActiveTexture(GL_TEXTURE1);
glBindTexture(GL_TEXTURE_2D, texture);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
GLint previousAlignment = 4;
glGetIntegerv(GL_UNPACK_ALIGNMENT, &previousAlignment);
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, 2, 2, 0,
             GL_RGBA, GL_UNSIGNED_BYTE, pixels);
glPixelStorei(GL_UNPACK_ALIGNMENT, previousAlignment);
glUseProgram(program);
GLint location = glGetUniformLocation(program, "sourceImage");
if (location >= 0) glUniform1i(location, 1);
// draw 직전에도 유닛 1과 이 텍스처의 연결을 유지한다.
```

다음 fragment shader는 vertex shader에서 전달한 vec2 uv를 사용합니다. 위치·UV의 속성 설정도 필요합니다. 이는 텍스처 연결 구간의 예제이며 창 생성을 포함한 전체 프로그램은 아닙니다.

```glsl
#version 330 core
in vec2 uv;
out vec4 fragColor;
uniform sampler2D sourceImage;
void main() {
    fragColor = texture(sourceImage, uv);
}
```

알파가 128인 픽셀을 읽어도 blending이 자동 활성화되지는 않습니다. 배경과 섞으려면 원하는 블렌드 방정식과 깊이 쓰기·정렬 정책을 따로 정합니다. 이 예제는 색 데이터의 sRGB 디코딩까지 다루지 않으며 우선 RGBA 바이트와 연결을 확인합니다.

CPU의 이미지 버퍼와 GL 텍스처는 수명이 다릅니다. 일반적인 `glTexImage2D` 업로드 뒤 CPU 배열을 더 이상 유지할 필요는 없지만, 텍스처 객체는 draw에서 계속 참조합니다. 마지막 사용 뒤 `glDeleteTextures(1, &texture)`로 정리합니다. [LearnOpenGL Textures](https://learnopengl.com/Getting-started/Textures)

## 실습과 풀이

1. sampler 값을 0으로 바꾸되 객체는 유닛 1에 둡니다. **풀이:** 다른 유닛을 읽게 됩니다. 두 값의 연결을 맞춥니다. 검정이나 다른 색이 보일 수 있으며 특정 드라이버의 화면을 예상값으로 단정하지 않습니다.
2. 폭 3의 RGB 두 행을 패딩 없이 만들고 alignment 4·1을 비교합니다. **풀이:** 행의 실제 간격은 9바이트입니다. alignment 1은 이를 그대로 읽습니다. alignment 4를 쓰려면 각 행에 12바이트 간격을 갖도록 패딩을 넣어야 합니다.
3. 두 번째 텍스처를 유닛 2에 연결하고 `mix(texture(a,uv), texture(b,uv), factor)`를 사용합니다. **풀이:** 두 sampler에 각각 1·2를 넣습니다. factor 0과 1에서 각 원본, 0.5에서 산술 혼합을 기대합니다. 이것은 알파 합성 규칙과 별개입니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [텍스처 반복·필터링·mipmap을 같은 조건에서 비교하기](/writing/opengl-filtering-mipmaps/)
