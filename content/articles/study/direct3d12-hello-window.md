---
title: "Direct3D 12 첫 프레임과 배경색"
description: "Microsoft의 Hello, window! 샘플을 내려받아 빌드하고 배경색을 바꿉니다. Win32 창, Direct3D 12 명령 기록·제출, DXGI 화면 표시를 코드에서 구분합니다."
slug: "direct3d12-hello-window"
date: "2026-11-09"
dateBasis: "authored"
topic: "study"
kind: "note"
series: "direct3d12-renderer"
order: 2
tags: ["DirectX", "Direct3D 12", "C++", "Win32", "DXGI"]
draft: false
---

## 창과 GPU가 맡는 일

Win32가 창을 만들고, Direct3D 12가 그 창에 표시할 백 버퍼를 단색으로 채웁니다. 애플리케이션은 DXGI 스왑 체인에 그려진 버퍼의 화면 표시를 요청합니다. 색을 바꿔 본 뒤, C++ 코드에서 GPU 명령을 기록하는 지점과 제출하는 지점을 각각 찾습니다. 전체 순서는 [12주 계획](/writing/direct3d12-renderer-12-week-plan/)에서 확인합니다. [Microsoft Hello, World! 샘플 안내](https://learn.microsoft.com/en-us/samples/microsoft/directx-graphics-samples/d3d12-hello-world-samples-win32/)

## 샘플 내려받기

Windows에서 Git과 Visual Studio를 준비합니다. Visual Studio Installer의 **C++를 사용한 데스크톱 개발**에서 MSVC와 Windows SDK가 설치되어 있어야 합니다. 아래는 짧은 경로인 `D:\dx12`를 사용하는 예입니다. 다른 드라이브를 사용한다면 세 명령에서 경로를 동일하게 바꿉니다. [Visual Studio C++ 설치 안내](https://learn.microsoft.com/en-us/cpp/build/vscpp-step-0-installation)

PowerShell에서 세 줄을 차례대로 실행합니다. 첫 두 줄은 Microsoft 공식 저장소에서 필요한 샘플 폴더를 가져오고, 마지막 줄은 솔루션이 있는 폴더를 엽니다.

```powershell
git clone --depth 1 --filter=blob:none --sparse https://github.com/microsoft/DirectX-Graphics-Samples.git D:\dx12
git -C D:\dx12 sparse-checkout set Samples/Desktop/D3D12HelloWorld
explorer.exe 'D:\dx12\Samples\Desktop\D3D12HelloWorld\src'
```

## 빌드하고 실행하기

1. 탐색기에서 `D3D12HelloWorld.slnx`를 엽니다.
2. Visual Studio 상단에서 구성을 **Debug**, 플랫폼을 **x64**로 선택합니다.
3. 솔루션 탐색기에서 **D3D12HelloWindow** 프로젝트를 우클릭해 **시작 프로젝트로 설정**을 선택합니다.
4. 같은 프로젝트를 우클릭해 **빌드**를 선택합니다. 첫 빌드에서는 샘플이 참조하는 NuGet 패키지를 복원합니다.
5. 빌드가 끝나면 `Ctrl+F5`로 실행합니다. **D3D12 Hello Window**라는 창에 파란색 배경이 표시되는지 확인합니다.

패키지 누락 오류가 나오면 솔루션을 우클릭해 **NuGet 패키지 복원**을 선택한 뒤 해당 프로젝트를 다시 빌드합니다. 복원 중 경로 길이 오류가 나오면 저장소를 드라이브의 짧은 경로에 둡니다. 실행할 때 다른 샘플까지 빌드된다면 Visual Studio의 **Build and Run** 옵션에서 **Only build startup projects and dependencies on Run**을 켭니다. [NuGet 복원 안내](https://learn.microsoft.com/en-us/nuget/consume-packages/package-restore-troubleshooting), [Visual Studio 빌드·실행 옵션](https://learn.microsoft.com/en-us/visualstudio/ide/configure-build-run-options)

## 배경색 바꾸기

파란 창을 닫고 `D3D12HelloWindow.cpp`를 엽니다. `Ctrl+F`로 `clearColor`를 찾으면 `PopulateCommandList()` 안에 네 개의 값이 있습니다. 순서대로 빨강·초록·파랑·알파입니다.

```cpp
const float clearColor[] = { 0.0f, 0.2f, 0.4f, 1.0f };
```

아래 값으로 바꿉니다. `Ctrl+S`로 저장하고 **D3D12HelloWindow** 프로젝트를 다시 빌드한 뒤 `Ctrl+F5`로 실행합니다. 창 전체가 파란색에서 붉은색으로 바뀌는지 확인합니다. [Microsoft 샘플의 색상 및 상태 전환 코드](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloWindow/D3D12HelloWindow.cpp#L192-L216)

```cpp
const float clearColor[] = { 0.65f, 0.12f, 0.20f, 1.0f };
```

## 명령 기록에서 화면 표시까지

| 위치 | 호출 | 역할 |
| --- | --- | --- |
| `PopulateCommandList()` | 첫 번째 `ResourceBarrier()` | 현재 백 버퍼를 `PRESENT`에서 `RENDER_TARGET`으로 전환하는 명령을 기록합니다. |
| `PopulateCommandList()` | `ClearRenderTargetView()` | 백 버퍼를 `clearColor`로 채우는 명령을 기록합니다. |
| `PopulateCommandList()` | 두 번째 `ResourceBarrier()` | 백 버퍼를 표시할 수 있도록 `PRESENT` 상태로 되돌리는 명령을 기록합니다. |
| `OnRender()` | `ExecuteCommandLists()` | 기록을 마친 커맨드 리스트를 Direct3D 12 커맨드 큐에 제출합니다. |
| `OnRender()` | `Present()` | DXGI 스왑 체인에 현재 버퍼의 화면 표시를 요청합니다. |

색 배열은 CPU 코드에서 바꿉니다. `ClearRenderTargetView()`가 이 값을 사용해 GPU가 실행할 명령을 기록합니다. `OnRender()`가 리스트를 제출하면 기록된 상태 전환과 지우기 작업이 순서대로 처리됩니다. [Microsoft 샘플의 프레임 호출 흐름](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloWindow/D3D12HelloWindow.cpp#L168-L217), [Direct3D 12 리소스 배리어](https://learn.microsoft.com/en-us/windows/win32/direct3d12/using-resource-barriers-to-synchronize-resource-states-in-direct3d-12)

## 1회차 확인

- 샘플을 빌드하고 배경색을 바꾼 뒤 다시 실행합니다.
- 같은 파일에서 명령을 기록하는 `ClearRenderTargetView()`와 제출하는 `ExecuteCommandLists()`를 각각 찾습니다.
- 코드를 덮고 **Win32 창 → Direct3D 12 명령 기록·제출 → DXGI 화면 표시**를 자기 말로 설명합니다.

다음 실습에서는 이 흐름에 정점 버퍼와 HLSL 셰이더, 드로우 호출을 추가해 삼각형을 그립니다. [주차별 목록](/series/direct3d12-renderer/)
