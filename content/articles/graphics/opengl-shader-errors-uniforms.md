---
title: "GLSL 컴파일·링크 오류와 uniform 갱신"
description: "파일 읽기, 셰이더 단계 컴파일, 프로그램 링크, uniform 갱신을 나눠 실패를 찾는다. 생성자와 입출력 오류를 수정하는 실습과 풀이를 제공한다."
slug: "opengl-shader-errors-uniforms"
date: "2023-06-20"
dateBasis: "notion"
updated: "2026-10-18"
topic: "graphics"
kind: "note"
tags: ["OpenGL", "GLSL", "C++", "Debugging"]
draft: false
---

## 검은 화면을 하나의 오류로 취급하지 않기

[Shaders 노트](https://app.notion.com/p/361921119b954fb2ad51834ff987c002)의 입출력과 uniform을 오류 확인 순서로 다시 구성했다. C++가 컴파일됐다는 사실은 문자열 안의 GLSL까지 컴파일됐다는 뜻이 아니다. GLSL은 현재 컨텍스트의 드라이버가 처리한다.

| 단계 | 확인할 값 | 실패했을 때 |
| --- | --- | --- |
| 소스 읽기 | 실제 읽은 파일과 문자열 | 작업 디렉터리·빈 파일·인코딩 확인 |
| 셰이더 컴파일 | GL_COMPILE_STATUS | 해당 단계의 info log |
| 프로그램 링크 | GL_LINK_STATUS | 단계 간 타입·이름·버전 확인 |
| 사용·갱신 | 현재 program과 uniform location | 다른 프로그램·오타·최적화 제거 확인 |

OpenGL 3.3 core를 기준으로 한다. 컨텍스트와 함수 로더는 [렌더 루프 글](/writing/opengl-context-render-loop/)의 전제다.

## 위치와 색을 연결하는 두 셰이더

`basic.vert`는 다음과 같다. `new vec4`처럼 C# 생성 문법을 붙이지 않는다.

```glsl
#version 330 core
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 color;
out vec3 vertexColor;
uniform float offsetX;
void main() {
    vertexColor = color;
    gl_Position = vec4(position + vec3(offsetX, 0.0, 0.0), 1.0);
}
```

`basic.frag`에서 연결된 색에 tint를 곱한다.

```glsl
#version 330 core
in vec3 vertexColor;
out vec4 fragColor;
uniform vec3 tint;
void main() {
    fragColor = vec4(vertexColor * tint, 1.0);
}
```

location 0·1의 CPU 입력 설정은 [정점 배치 글](/writing/opengl-vertex-layout-stride-offset/)과 맞춘다. 프로그램은 링크 성공 직후 uniform 값을 초기화한다. offsetX=0, tint=(1,1,1)이 기준이다.

## 로그를 읽고 실패한 객체를 정리하기

다음 함수는 GL 헤더를 포함한 C++ 파일에 넣는 컴파일 도우미다. 문자열 src의 길이가 GLint 범위를 넘지 않는 작은 예제를 전제로 한다.

```cpp
#include <stdexcept>
#include <string>
#include <vector>

GLuint compileStage(GLenum type, const std::string& src) {
    GLuint shader = glCreateShader(type);
    if (!shader) throw std::runtime_error("glCreateShader failed");
    const char* text = src.c_str();
    glShaderSource(shader, 1, &text, nullptr);
    glCompileShader(shader);
    GLint ok = GL_FALSE;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        GLint size = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &size);
        std::vector<char> log(size > 0 ? size : 1, '\0');
        glGetShaderInfoLog(shader, static_cast<GLsizei>(log.size()), nullptr, log.data());
        std::string message(log.data());
        glDeleteShader(shader);
        throw std::runtime_error(message);
    }
    return shader;
}
```

두 셰이더를 얻으면 `glCreateProgram`, `glAttachShader` 두 번, `glLinkProgram` 순서로 연결한다. 링크 확인은 `glGetProgramiv(program, GL_LINK_STATUS, &ok)`다. 실패 로그는 `glGetProgramInfoLog`로 읽는다. 성공 여부와 관계없이 만든 셰이더는 정리하고, 실패한 프로그램도 삭제한다. 컴파일 도중 두 번째 단계가 실패해도 첫 번째 셰이더를 누락하지 않도록 소유 객체나 try/catch로 감싼다.

## uniform의 위치는 프로그램에 속한다

링크가 끝난 program에 다음을 실행한 뒤 draw한다.

```cpp
glUseProgram(program);
GLint tintLocation = glGetUniformLocation(program, "tint");
GLint offsetLocation = glGetUniformLocation(program, "offsetX");
if (tintLocation < 0 || offsetLocation < 0)
    throw std::runtime_error("required uniform missing");
glUniform3f(tintLocation, 1.0f, 1.0f, 1.0f);
glUniform1f(offsetLocation, 0.2f);
```

location -1은 오타일 수도 있고 사용되지 않아 제거된 uniform일 수도 있다. -1에 대한 갱신은 무시되므로 필수 입력이라면 직접 오류로 취급한다. location은 다른 프로그램과 공유하지 않으며 재링크 후 다시 얻는다. `glUniform`은 현재 사용 중인 프로그램을 갱신한다. [LearnOpenGL Shaders](https://learnopengl.com/Getting-started/Shaders)

## 실습과 풀이

1. `vec4` 앞에 `new`를 붙인다. **풀이:** 정점 셰이더 컴파일 단계의 실패를 기록하고 GLSL 생성자 문법으로 되돌린다. 드라이버별 로그 문구와 줄 번호는 같다고 가정하지 않는다.
2. fragment 입력을 `in vec2 vertexColor`로 바꾼다. **풀이:** 셰이더가 각각 컴파일되더라도 단계 간 인터페이스가 맞지 않아 링크가 실패할 수 있다. 두 단계의 타입을 vec3로 일치시킨다.
3. tint를 `tintColor`라는 이름으로 조회한다. **풀이:** -1을 필수 uniform 검사에서 잡아야 한다. 값을 갱신하지 않은 tint가 검은 화면의 원인이 될 수 있지만, 검은 화면의 모든 원인이 uniform인 것은 아니다.

## 확인한 범위

기존 노트의 단계와 공개 API 사용법을 대조해 코드를 새로 작성했다. 원문 번역이나 Shader 클래스 전체를 복제하지 않았다. C++·GLSL 컴파일, 드라이버 info log와 실제 색·이동 화면은 이번에 실행하지 않았다. 실습의 실패 지점은 검증할 예상이며 실측 로그가 아니다. AI를 작성 보조에 사용했다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [텍스처 객체·텍스처 유닛·sampler와 이미지 포맷](/writing/opengl-texture-units-formats/)
