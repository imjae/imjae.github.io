---
title: "GLFW·GLAD·컨텍스트와 첫 렌더 루프 만들기"
description: "창과 컨텍스트, 함수 로더의 역할을 구분하고 초기화 실패·framebuffer 크기·이벤트·버퍼 교환·종료를 처리하는 최소 프로그램을 구성합니다."
slug: "opengl-context-render-loop"
date: "2023-06-14"
dateBasis: "notion"
updated: "2026-10-23"
topic: "graphics"
kind: "note"
tags: ["OpenGL", "GLFW", "C++"]
draft: false
---

## 헤더를 include했다고 컨텍스트가 생기지는 않습니다

<div id="헤더를-include했다고-컨텍스트가-생기지는-않는다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[OpenGL](https://app.notion.com/p/053f9f0c4fc24fe98807fb8f7bddec11), [Window 생성](https://app.notion.com/p/c73955f31a904b6dbf933438eedfc702), [Hello Window](https://app.notion.com/p/f57cae548a8d433086bb02894e9e19c1) 노트에서 다룬 GLFW·GLAD 초기화와 창 생성 과정을 설명합니다.

GLFW는 창·입력·컨텍스트 생성을 돕습니다. GLAD는 현재 컨텍스트에서 사용할 GL 함수 주소를 연결합니다. OpenGL은 렌더링 API입니다. 세 역할을 구분하면 ‘링크 성공 뒤 함수 호출에서 실패’하는 문제도 초기화 순서부터 볼 수 있습니다.

```text
GLFW 초기화 → 창·컨텍스트 생성 → 현재 스레드에 연결
→ GLAD 로드 → GL 호출·렌더 루프 → GL 자원 정리 → 창 파괴
```

## 예제의 환경 규약

OpenGL 3.3 core, C++17, GLFW 3.x와 **GLAD 2 C 생성물**의 `glad/gl.h`, `src/gl.c`를 사용합니다. GLAD 1의 `glad/glad.h`·`gladLoadGLLoader`와 섞지 않습니다. GLAD 2는 생성 옵션에 따라 파일 구성이 달라지므로 생성한 헤더와 소스의 쌍을 함께 보관합니다. [GLAD C 문서](https://github.com/Dav1dde/glad/wiki/C)

프로젝트에는 GLFW의 include·라이브러리와 생성한 GLAD의 include·C 소스를 연결해야 합니다. 기존 LearnOpenGL 저장소를 수정하는 예제가 아니며, 특정 IDE 설치 화면을 최신 절차라고 소개하지 않습니다.

## main.cpp

```cpp
#include <glad/gl.h>
#define GLFW_INCLUDE_NONE
#include <GLFW/glfw3.h>
#include <iostream>

void onError(int code, const char* message) {
    std::cerr << code << ": " << message << '\n';
}
void onFramebufferSize(GLFWwindow*, int width, int height) {
    glViewport(0, 0, width, height);
}
int main() {
    glfwSetErrorCallback(onError);
    if (!glfwInit()) return 1;
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GLFW_TRUE);
#endif
    GLFWwindow* window = glfwCreateWindow(800, 600, "GL study", nullptr, nullptr);
    if (!window) { glfwTerminate(); return 2; }
    glfwMakeContextCurrent(window);
    if (!gladLoadGL(glfwGetProcAddress)) {
        glfwDestroyWindow(window);
        glfwTerminate();
        return 3;
    }
    int width = 0, height = 0;
    glfwGetFramebufferSize(window, &width, &height);
    glViewport(0, 0, width, height);
    glfwSetFramebufferSizeCallback(window, onFramebufferSize);
    glfwSwapInterval(1);
    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, GLFW_TRUE);
        glClearColor(0.08f, 0.12f, 0.18f, 1.f);
        glClear(GL_COLOR_BUFFER_BIT);
        glfwSwapBuffers(window);
    }
    // 추가한 버퍼·텍스처·프로그램은 이 지점에서 먼저 정리한다.
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}
```

이 프로그램의 예상 결과는 단색 창과 Escape 종료입니다. 삼각형은 아직 없습니다. glClear 호출도 컨텍스트와 함수 로드 뒤에 둡니다. 화면 크기는 논리적 window size가 아닌 framebuffer 픽셀 수를 사용했습니다. 고해상도 배율이 있는 환경에서는 둘이 다를 수 있습니다. [GLFW 컨텍스트 문서](https://www.glfw.org/docs/latest/context_guide.html)

## 실습과 풀이

1. 창을 늘려 봅니다. **풀이:** framebuffer callback에서 viewport가 갱신되어야 합니다. 이후 투영 행렬을 추가하면 종횡비도 별도로 갱신합니다. viewport만 바꾸면 원근 비율까지 자동 수정되지는 않습니다.
2. 지원하지 않는 컨텍스트 버전을 요구합니다. **풀이:** 생성 실패를 처리해야 합니다. 어떤 환경에서는 더 높은 버전을 제공하므로 실패 여부는 실제 드라이버와 요청 조합에 따라 확인합니다. null window에 GLAD를 실행하지 않습니다.
3. GLAD 로드 전후의 호출을 비교합니다. **풀이:** 로드 전 GL 함수를 일부러 실행해 충돌을 재현할 필요는 없습니다. 코드 순서를 점검하고 실패 분기에서 자원이 정리되는지 확인합니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [이동·회전·크기 행렬과 변환 순서 직접 계산하기](/writing/matrix-transform-order/)
