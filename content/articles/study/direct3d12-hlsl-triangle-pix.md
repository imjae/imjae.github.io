---
title: "Direct3D 12 HLSL 삼각형과 PIX 드로우 캡처"
description: "Hello, triangle!을 빌드하고 HLSL로 삼각형의 색을 바꿉니다. PIX GPU Capture에서 DrawInstanced 호출과 정점·셰이더·렌더 타깃의 연결을 확인합니다."
slug: "direct3d12-hlsl-triangle-pix"
date: "2026-11-09"
dateBasis: "authored"
topic: "study"
kind: "note"
series: "direct3d12-renderer"
order: 3
tags: ["DirectX", "Direct3D 12", "C++", "HLSL", "Rendering", "PIX"]
draft: false
---

## 배경 위에 삼각형 그리기

[1주차](/writing/direct3d12-hello-window/)에는 백 버퍼를 단색으로 채웠습니다. 이번에는 같은 프레임에 정점 세 개를 그리는 명령을 추가한 Microsoft의 `Hello, triangle!` 샘플을 사용합니다. C++ 코드에서 정점과 드로우 호출을 찾고, HLSL의 출력색을 바꾼 뒤 PIX에서 한 프레임을 확인합니다. [Microsoft Hello, World! 샘플 안내](https://learn.microsoft.com/en-us/samples/microsoft/directx-graphics-samples/d3d12-hello-world-samples-win32/)

## 샘플 빌드와 실행

1. 1주차에 받은 `D3D12HelloWorld.slnx`를 다시 엽니다. 샘플 저장소를 처음 받는 경우 [1주차의 내려받기 절차](/writing/direct3d12-hello-window/#샘플-내려받기)를 따릅니다.
2. Visual Studio에서 **Debug**, **x64**를 선택합니다.
3. 솔루션 탐색기에서 **D3D12HelloTriangle**을 우클릭해 **시작 프로젝트로 설정**을 선택합니다. 같은 프로젝트를 우클릭해 **빌드**합니다.
4. `Ctrl+F5`로 실행합니다. **D3D12 Hello Triangle** 창에서 파란 배경 위에 삼각형이 보이는지 확인합니다. 세 꼭짓점은 각각 빨강·초록·파랑이고, 안쪽은 그 색이 섞여 보입니다.

첫 빌드에서 패키지 누락 오류가 나오면 솔루션을 우클릭해 **NuGet 패키지 복원**을 실행한 뒤 다시 빌드합니다. [NuGet 복원 안내](https://learn.microsoft.com/en-us/nuget/consume-packages/package-restore-troubleshooting)

1주차와 같은 경로에 저장소를 받았다면, 아래 명령으로 이번 실행 파일의 폴더를 엽니다. 이 폴더는 뒤에서 PIX에 지정합니다.

```powershell
explorer.exe 'D:\dx12\Samples\Desktop\D3D12HelloWorld\src\HelloTriangle\bin\x64\Debug'
```

빌드는 이 폴더에 `D3D12HelloTriangle.exe`, `shaders_VSMain.cso`, `shaders_PSMain.cso`를 만듭니다. 프로젝트는 `shaders.hlsl`의 `VSMain`과 `PSMain`을 DXC로 각각 컴파일합니다. 실행 파일은 자기 폴더에서 두 `.cso`를 읽어 그래픽스 파이프라인 상태에 넣습니다. [샘플의 HLSL 빌드 설정](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloTriangle/D3D12HelloTriangle.vcxproj#L253-L268), [셰이더를 읽는 C++ 코드](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloTriangle/D3D12HelloTriangle.cpp#L153-L186)

## 정점 버퍼와 셰이더의 연결

`D3D12HelloTriangle.cpp`에서 `triangleVertices`를 찾습니다. 정점마다 위치 세 성분과 색 네 성분이 있고, 샘플은 세 정점을 정점 버퍼에 복사합니다. 같은 파일의 `inputElementDescs`는 입력 조립기가 그 버퍼를 읽는 규칙입니다.

| 정점 속성 | 버퍼 내 시작 위치 | 입력 레이아웃 | HLSL 입력 |
| --- | --- | --- | --- |
| 위치 | 정점 시작에서 0바이트 | `R32G32B32_FLOAT` | `POSITION` |
| 색 | 정점 시작에서 12바이트 | `R32G32B32A32_FLOAT` | `COLOR` |

두 속성은 같은 버퍼 슬롯 0에서 읽습니다. 오프셋은 **한 정점 안에서** 속성이 시작하는 위치입니다. `StrideInBytes`는 **다음 정점까지**의 간격이며, 샘플에서는 `sizeof(Vertex)`로 설정합니다. 파이프라인 상태 객체인 PSO에는 이 입력 레이아웃, 컴파일한 두 셰이더와 래스터라이저 설정이 들어갑니다. [샘플의 입력 레이아웃과 정점 버퍼](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloTriangle/D3D12HelloTriangle.cpp#L165-L230)

`shaders.hlsl`의 `VSMain`은 받은 위치를 `SV_POSITION`으로 내보내고 색을 전달합니다. 래스터라이저가 삼각형 안에서 색을 보간하면, `PSMain`은 그 색을 `SV_TARGET`으로 내보냅니다. 정점 세 개에 서로 다른 색을 줬는데 삼각형 안쪽에서 색이 섞이는 이유입니다. [샘플의 정점·픽셀 셰이더](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloTriangle/shaders.hlsl#L12-L31), [HLSL 시맨틱](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-semantics)

## 픽셀 셰이더에서 삼각형 색 바꾸기

1. 실행 중인 삼각형 창을 닫습니다.
2. Visual Studio에서 **D3D12HelloTriangle** 프로젝트의 `shaders.hlsl`을 엽니다. `PSMain` 안의 `return input.color;`를 찾습니다.
3. 반환값을 아래와 같이 바꿉니다.

   ```hlsl
   float4 PSMain(PSInput input) : SV_TARGET
   {
       return float4(0.95f, 0.65f, 0.15f, 1.0f);
   }
   ```

4. 저장하고 **D3D12HelloTriangle**을 다시 빌드한 뒤 `Ctrl+F5`로 실행합니다. 배경은 파란색이고 삼각형 내부는 균일한 주황빛으로 보여야 합니다.

배경색은 여전히 C++의 `ClearRenderTargetView()`에서 결정합니다. 위 변경은 삼각형을 그리는 픽셀 셰이더의 출력에만 적용됩니다. 색이 그대로라면 프로젝트 이름과 `Debug / x64`를 확인하고, 빌드 출력에 `shaders.hlsl`이 표시되는지 또는 `shaders_PSMain.cso`의 수정 시각이 바뀌는지 봅니다.

## PIX에서 한 프레임 캡처하기

1. [Microsoft PIX 다운로드 페이지](https://devblogs.microsoft.com/pix/download/)에서 Windows용 PIX를 설치합니다. Visual Studio에서 실행한 삼각형 창을 닫습니다.
2. PIX의 **Welcome** 화면에서 **Device Connections → Local Machine → Launch Process**를 선택합니다.
3. **Win32** 실행 파일로 앞에서 확인한 `D3D12HelloTriangle.exe`를 지정합니다. 작업 폴더도 실행 파일이 있는 `bin\x64\Debug`로 지정합니다.
4. **Capture Type**을 **GPU Capture**로 선택한 뒤 **Launch**를 누릅니다.
5. 삼각형이 보이면 PIX의 캡처 화면에서 **Take Capture**를 누릅니다. 삼각형 창에 포커스를 둔 상태라면 기본 GPU 캡처 단축키인 `F11`도 사용할 수 있습니다.
6. 만들어진 캡처를 엽니다. 상단의 **Start Analysis**를 눌러 PIX가 프레임을 GPU에서 재생하고 상태를 읽도록 합니다. [PIX에서 앱 실행 및 캡처](https://learn.microsoft.com/en-us/windows/pix/get-started/take-captures), [캡처 분석 시작](https://learn.microsoft.com/en-us/windows/pix/gpu-captures/inspect-pipeline-state)

이 샘플은 PIX의 **Launch Process**에서 시작하면 캡처 준비가 앱 초기화 시점에 이루어집니다. 이미 실행한 프로세스에 GPU 캡처용으로 붙는 **Attach to Process** 경로는 앱이 캡처 DLL을 초기화 전에 로드해야 하므로, 이 실습에서는 PIX에서 실행부터 시작합니다. [PIX의 실행·연결 조건](https://learn.microsoft.com/en-us/windows/pix/get-started/take-captures#attach-to-a-running-application)

## 드로우 호출과 화면 연결하기

1. 캡처의 **Pipeline** 탭을 엽니다. **Events** 목록에서 그래픽스 큐를 선택하고 검색창에 `DrawInstanced`를 입력합니다.
2. 검색된 드로우를 클릭하고 **Event Details**에서 인자를 확인합니다. 샘플의 `DrawInstanced(3, 1, 0, 0)`은 정점 3개로 인스턴스 1개를 그립니다. 시작 정점과 시작 인스턴스는 모두 0입니다.
3. 같은 이벤트를 선택한 채 **Pipeline**에서 입력 조립기 상태와 정점 버퍼, 정점 셰이더와 픽셀 셰이더를 살펴봅니다. 출력 쪽의 렌더 타깃을 선택해 해당 드로우의 결과를 확인합니다.
4. 이벤트 검색어를 지우고 `ClearRenderTargetView`를 찾습니다. 이 호출의 파란 배경과 `DrawInstanced` 뒤의 삼각형을 비교합니다. `IASetVertexBuffers`처럼 GPU 상태를 지정하는 호출까지 보고 싶다면 Events 검색 영역에서 **!G** 필터를 끕니다. [PIX 이벤트 목록](https://learn.microsoft.com/en-us/windows/pix/gpu-captures/gpu-captures-overview), [PIX 파이프라인과 리소스 보기](https://learn.microsoft.com/en-us/windows/pix/gpu-captures/inspect-pipeline-state), [DrawInstanced 인자](https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-id3d12graphicscommandlist-drawinstanced)

C++의 `PopulateCommandList()`에서 아래 세 호출을 찾아 캡처와 대조합니다. 토폴로지는 정점을 삼각형 단위로 묶고, 버퍼 바인딩은 입력 슬롯 0에 읽을 데이터를 연결합니다. 세 번째 호출은 이 상태로 정점 세 개를 그리는 명령을 기록합니다. `OnRender()`에서 이 목록을 GPU 큐에 제출합니다. [Microsoft 샘플의 명령 기록과 제출](https://github.com/microsoft/DirectX-Graphics-Samples/blob/68a2b1e97f71642924e74c7757ca21756ad221b5/Samples/Desktop/D3D12HelloWorld/src/HelloTriangle/D3D12HelloTriangle.cpp#L259-L316)

```cpp
m_commandList->IASetPrimitiveTopology(D3D_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
m_commandList->IASetVertexBuffers(0, 1, &m_vertexBufferView);
m_commandList->DrawInstanced(3, 1, 0, 0);
```

## 드로우를 제거해 결과 비교하기

창을 닫고 `DrawInstanced(3, 1, 0, 0)` 한 줄을 주석으로 바꿉니다. 빌드한 뒤 파란 배경만 보이는지 확인합니다. PIX에서 새 캡처를 만들면 `ClearRenderTargetView`는 남고 `DrawInstanced`는 사라집니다. 확인 뒤 주석을 풀고 다시 빌드합니다.

실습을 마칠 때는 캡처에서 드로우를 선택하고 **어떤 버퍼에서 정점을 읽는지, 어떤 셰이더가 색을 정하는지, 결과를 어느 렌더 타깃에 쓰는지** 차례대로 설명합니다. 다음 주차에서는 제출한 프레임을 GPU가 끝냈는지 펜스로 확인합니다. [주차별 목록](/series/direct3d12-renderer/)
