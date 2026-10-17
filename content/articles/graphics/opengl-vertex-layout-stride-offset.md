---
title: "VBO·VAO·EBO와 정점 속성의 stride·offset"
description: "위치와 색을 섞은 정점의 바이트 주소를 계산하고, 인덱스와 VAO 상태를 연결한다. 잘못된 stride·offset·개수를 고치는 실습과 풀이를 다룬다."
slug: "opengl-vertex-layout-stride-offset"
date: "2026-10-17"
topic: "graphics"
kind: "note"
tags: ["OpenGL", "C++", "Vertex", "Buffer"]
draft: false
---

## 버퍼의 값만 맞아도 삼각형이 깨질 수 있다

[Hello Triangle 노트](https://app.notion.com/p/f2adc4fc52d14d0a92646d015dd1b2d2)를 바탕으로 정점 입력을 바이트 단위로 정리한다. 버퍼는 위치나 색이라는 의미를 스스로 알지 못한다. 속성 설정이 ‘몇 바이트 간격으로 어떤 자료형을 읽을지’를 연결한다.

VBO는 정점 데이터 저장에 사용하는 버퍼 객체다. VAO는 활성 속성과 각 속성의 읽기 설정, EBO 연결 같은 정점 입력 상태를 묶는다. EBO는 인덱스를 저장하는 버퍼다. VAO가 VBO의 내용을 복사해서 보관하는 것은 아니다.

이 글은 OpenGL 3.3 core의 기존 바인딩 API를 사용한다. 실행 환경은 [컨텍스트와 렌더 루프 글](/writing/opengl-context-render-loop/)에서 준비한다. 실제 GPU 화면은 미검증이다.

## 한 정점의 배치부터 그리기

32비트 float를 사용해 정점 하나를 `x y z r g b`로 둔다.

```text
바이트       0  4  8 |12 16 20|24 28 32 |36 40 44
내용        x0 y0 z0|r0 g0 b0|x1 y1 z1|r1 g1 b1
정점 시작    └──── 0번 ────┘ └──── 1번 ────┘
stride = 24, 위치 offset = 0, 색 offset = 12
```

정점 i의 색은 `bufferStart + i * stride + colorOffset`에서 읽는다. 1번 정점의 색 시작은 36바이트다. 색의 offset을 3으로 주면 float 세 개가 아니라 3바이트부터 읽게 된다.

## 업로드·연결·그리기의 최소 코드

아래는 컨텍스트와 GL 함수 로더가 준비된 C++ 코드에 넣는 초기화·그리기·정리 구간이다. 셰이더 입력은 location 0에 vec3 위치, location 1에 vec3 색으로 맞춘다. 프로그램의 컴파일·링크는 [셰이더 글](/writing/opengl-shader-errors-uniforms/)에서 다룬다.

```cpp
#include <cstdint>
static_assert(sizeof(float) == 4);
const float vertices[] = {
    -0.6f, -0.4f, 0.f,  1.f, 0.f, 0.f,
     0.6f, -0.4f, 0.f,  0.f, 1.f, 0.f,
     0.0f,  0.6f, 0.f,  0.f, 0.f, 1.f
};
const std::uint32_t indices[] = {0, 1, 2};
GLuint vao = 0, vbo = 0, ebo = 0;
glGenVertexArrays(1, &vao);
glGenBuffers(1, &vbo);
glGenBuffers(1, &ebo);
glBindVertexArray(vao);
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), nullptr);
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float),
                      reinterpret_cast<void*>(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
glBindVertexArray(0);

// 매 프레임: program은 링크에 성공한 셰이더 프로그램이다.
glUseProgram(program);
glBindVertexArray(vao);
glDrawElements(GL_TRIANGLES, 3, GL_UNSIGNED_INT, nullptr);

// 종료: 컨텍스트가 살아 있을 때 한 번 실행한다.
glDeleteBuffers(1, &ebo);
glDeleteBuffers(1, &vbo);
glDeleteVertexArrays(1, &vao);
```

`glVertexAttribPointer`를 부를 때 현재 ARRAY_BUFFER 연결이 해당 속성에 기록된다. 이후 ARRAY_BUFFER를 바꿨다고 기존 속성의 VBO가 바뀌지는 않는다. 반면 ELEMENT_ARRAY_BUFFER 연결은 VAO 상태다. VAO가 선택된 채 EBO 연결을 0으로 바꾸면 해당 VAO의 EBO도 해제된다. [LearnOpenGL의 정점 입력 설명](https://learnopengl.com/Getting-started/Hello-Triangle)

DrawElements의 3은 인덱스 개수다. 버퍼 크기인 12바이트를 전달하지 않는다. 인덱스 타입과 실제 배열 원소 크기도 일치해야 한다. GL_STATIC_DRAW는 사용 패턴 힌트이며 데이터 변경을 금지하거나 특정 성능을 보장하는 계약이 아니다.

## 실습 1: 잘못된 stride 찾기

위 코드의 두 stride를 `3 * sizeof(float)`로 바꾸면 어떤 값을 다음 정점으로 읽는지 종이에 적는다.

**풀이:** 1번 위치를 색0 `(1,0,0)`에서 읽는다. 두 속성 모두 한 정점 전체인 24바이트를 건너야 한다. 위치 속성의 구성요소가 세 개라는 이유로 stride도 세 float가 되는 것은 아니다.

## 실습 2: UV를 추가하기

정점을 `x y z r g b u v`로 바꾼다. 위치·색·UV의 stride와 offset을 계산한다.

**풀이:** stride는 32바이트, 위치 0, 색 12, UV 24다. UV 속성의 size는 2이며 세 속성의 stride는 같다. 구조체를 사용할 경우에는 패딩을 고려해 `sizeof(Vertex)`와 `offsetof(Vertex, uv)`를 사용하고 표준 레이아웃 여부를 확인한다.

## 실습 3: 두 삼각형으로 사각형 만들기

정점 네 개와 인덱스 `0,1,2, 2,3,0`을 사용한다. 무엇을 바꿔야 하는가?

**풀이:** VBO에는 네 정점 전체를, EBO에는 여섯 인덱스를 업로드한다. draw count는 6이다. 두 삼각형의 winding을 맞추고 face culling을 켰을 때도 확인한다. 유효한 인덱스는 0~3이며 4는 버퍼 범위 밖이다.

## 확인한 범위

노션 텍스트와 공개 튜토리얼을 대조했고 위 배치표와 예제를 새로 작성했다. 노트의 그림과 긴 번역문은 옮기지 않았다. C++ 빌드, GL 오류 조회, 삼각형·사각형의 실제 출력은 이번에 실행하지 않았다. 주소 계산이 맞는 것과 드라이버에서 올바르게 그려지는 것은 별도 검사다. AI를 설명·예제 작성에 사용했다.

## 이어 읽기

[전체 학습 순서](/writing/notion-study-reading-order/) · 다음 글: [GLSL 컴파일·링크 오류와 uniform 갱신](/writing/opengl-shader-errors-uniforms/)
