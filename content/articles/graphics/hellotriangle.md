---
title: "D3D12HelloWorld_01_HelloTriangle"
description: "HelloTriangle 샘플의 루트 시그니처, 셰이더, 입력 레이아웃, PSO와 정점 버퍼를 살펴보고 삼각형을 그리는 명령의 연결을 정리합니다."
slug: "hellotriangle"
date: "2026-11-19"
dateBasis: "notion"
updated: "2026-11-23"
topic: "graphics"
kind: "note"
tags: ["Direct3D 12"]
draft: false
---

## 서론

앞서 HelloWindow 에서 기본적인 프로젝트 구조를 꼼꼼하게 살펴봤기 때문에 해당 삼각형 그리기 예제의 경우 보기가 한결 수월해졌을 것이다. 버텍스 셰이더와 픽셀 셰이더를 사용하는 부분도 OpenGL 에서 다루어 보았기 때문에 점을 찍고 색을 입히는 과정에 유의해 해당 프로젝트를 분석해 보자.

## 0. 개요 및 용어 정리

HelloTriangle의 헤더파일부터 확인해보자.

```c++
#pragma once

#include "DXSample.h"

using namespace DirectX;

// Note that while ComPtr is used to manage the lifetime of resources on the CPU,
// it has no understanding of the lifetime of resources on the GPU. Apps must account
// for the GPU lifetime of resources to avoid destroying objects that may still be
// referenced by the GPU.
//
// ComPtr는 CPU에서 리소스의 수명을 관리하지만 GPU에서의 리소스 수명은 추적하지 않는다.
// 앱은 GPU가 아직 참조할 수 있는 객체를 파괴하지 않도록 GPU에서의 리소스 수명도 관리해야 한다.
// An example of this can be found in the class method: OnDestroy(). | 이 클래스의 OnDestroy() 메서드에서 예를 볼 수 있다.
using Microsoft::WRL::ComPtr;

class D3D12HelloTriangle : public DXSample
{
public:
    D3D12HelloTriangle(UINT width, UINT height, std::wstring name);

    virtual void OnInit();
    virtual void OnUpdate();
    virtual void OnRender();
    virtual void OnDestroy();

private:
    static const UINT FrameCount = 2;

    struct Vertex
    {
        XMFLOAT3 position;
        XMFLOAT4 color;
    };

    // Pipeline objects. | 파이프라인 객체.
    CD3DX12_VIEWPORT m_viewport;
    CD3DX12_RECT m_scissorRect;
    ComPtr<IDXGISwapChain3> m_swapChain;
    ComPtr<ID3D12Device> m_device;
    ComPtr<ID3D12Resource> m_renderTargets[FrameCount];
    ComPtr<ID3D12CommandAllocator> m_commandAllocator;
    ComPtr<ID3D12CommandQueue> m_commandQueue;
    ComPtr<ID3D12RootSignature> m_rootSignature;
    ComPtr<ID3D12DescriptorHeap> m_rtvHeap;
    ComPtr<ID3D12PipelineState> m_pipelineState;
    ComPtr<ID3D12GraphicsCommandList> m_commandList;
    UINT m_rtvDescriptorSize;

    // App resources. | 앱 리소스.
    ComPtr<ID3D12Resource> m_vertexBuffer;
    D3D12_VERTEX_BUFFER_VIEW m_vertexBufferView;

    // Synchronization objects. | 동기화 객체.
    UINT m_frameIndex;
    HANDLE m_fenceEvent;
    ComPtr<ID3D12Fence> m_fence;
    UINT64 m_fenceValue;

    void LoadPipeline();
    void LoadAssets();
    void PopulateCommandList();
    void WaitForPreviousFrame();
};

```

여기서 이전 HelloWindow 에서 추가된 부분만 아래에서 간단하게 살펴보자.

\[ 명칭 ( 타입, 변수명 ) : 설명 \]

1. 뷰포트 (CD3DX12\_VIEWPORT, m\_viewport) : D3D12\_VIEWPORT를 쉽게 초기화하는 도우미 구조체. 정점 좌표를 렌더 타깃 좌표로 변환할 때 사용할 시작위치, 너비, 높이, 깊이 범위를 정할 때 사용. 해당 프로젝트에서는 창의 그리기 영역 전체를 뷰포트로 설정한다.
2. 시저 사각형 (CD3DX12\_RECT, m\_scissorRect) : D3D12\_RECT 를 쉽게 초기화 하는 도우미 구조체. left, top, right, bottom 네 좌표를 저장하며, RSSetScissorRects() 에 전달해 삼각형을 그릴 때 픽셀을 쓸 수 있는 범위를 제한한다.
3. 루트 시그니처 (ID3D12RootSignature, m\_rootSignature) : 셰이더가 텍스처나 상수 버퍼 같은 리소스를 어떤 슬롯에서 읽을지를 저장한다. C++ 함수 시그니처가 어떤 인자를 받을지 정하는 것과 비슷하다.
4. 정점 버퍼 (ID3D12Resource, m\_vertexBuffer) : 실제 정점 데이터가 들어있는 버퍼 리소스를 가리킨다. 이 예제에서는 삼각형을 이루는 정점 세 개의 위치(x, y, z)와 색(r, g, b, a) 을 저장한다.
5. 정점 버퍼 뷰 (D3D12\_VERTEX\_BUFFER\_VIEW, m\_vertexBufferView) :  정점 버퍼를 어디서부터, 얼마나, 몇 바이트씩 읽을지 알려주는 구조체이다. 버퍼의 GPU 시작 주소, 읽을 범위의 크기, 정점 사이의 바이트 간격을 저장하고 IASetVertexBuffers() 에 전달한다.

여기서 새롭게 등장한 뷰포트와 시저 사각형이라는 개념을 간단하게 이야기해보면 뷰포트를 창 전체로 두고, 시저 사각형만 왼쪽 절반으로 줄이면 삼각형의 위치와 크기는 창 전체를 기준으로 계산되고 시저 사각형 범위인 왼쪽 절반에 걸친 부분만 그려지게 된다.  


## 1. OnInit()

### 1-1. LoadPipeline()

해당 파이프라인 객체 생성에는 이전 HelloWindow 프로젝트와 달라진 것이 없기 때문에 넘어가겠다.

### 1-2. LoadAssets()

#### 1-2-1. 루트 시그니처 생성

```c++
// Create an empty root signature. | 루트 매개변수가 없는 루트 시그니처를 생성한다.
CD3DX12_ROOT_SIGNATURE_DESC rootSignatureDesc;
rootSignatureDesc.Init(
  0,
  nullptr,
  0,
  nullptr,
  D3D12_ROOT_SIGNATURE_FLAG_ALLOW_INPUT_ASSEMBLER_INPUT_LAYOUT);

```

루트 시그니처를 설정하고 Direct3D 12 가 읽을 수 있는 바이트로 변환한 후 실제 객체를 만들어 m\_rootSignature 변수에 저장한다.

먼저 루트 시그니처의 Init() 함수 호출부를 살펴보자.

첫 번째, 두 번째 인자의 경우 루트 매개변수의 개수와 루트 매개변수를 전달할 배열 주소이다. 그리고 세 번째, 네 번째 인자의 경우 정적 샘플러의 개수와 정적 샘플러를 전달할 배열의 주소이다. 그리고 마지막 인자는 플래그 값인데 입력 어셈블러(Input Assembler)가 정점 입력 레이아웃을 사용하도록 허용하는 플래그 값이 들어있다. 이 프로젝트의 경우 해당 레이아웃에 따라 정점 버퍼의 POSITION 과 COLOR 를 읽는다.

해당 프로젝트의 경우 루트 매개변수와 정적 샘플러를 사용하지 않기 때문에 0과 nullptr을 넘긴다. 이것들에 대한 설명은 실제로 해당 데이터들을 사용할 때 자세하게 공부하기로 하고 지금은 간단한 정의 정도만 하고 넘어가보자.

먼저 루트 매개변수는 앱이 셰이더에 데이터나 리소스를 연결하는 슬롯이다. 예를들어 픽셀 셰이더가 Texture2D image : register(t0) 을 사용한다고 했을 때 루트 시그니처에 해당 슬롯으로 t0 에서 읽을 텍스처를 연결한다는 항목을 정의할 수 있다. 

그리고 정적 샘플러에 대해 알아보자. 셰이더는 특정 좌표에서 색을 읽을 때 가장 가까운 텍스처 픽셀 하나의 색을 쓸지, 주변 픽셀의 색을 섞을지 정해야하는데, 좌표가 텍스처 범위를 벗어날 경우 이미지를 반복할지, 가장자리의 색을 쓸지도 정해야 한다. 이런 규칙을 정하는게 샘플러이다. 루트 시그니처를 생성할 때 샘플러 슬롯에 미리 정의를 한 후 해당 시그니처를 사용하는 동안 변경되지 않는다면 정적 샘플러 이다.

이 프로젝트에서 루트 매개변수와 정적 샘플러 둘다 전달하지 않는 이유는 정점 버퍼에서 위치와 색을 받아 삼각형 내부의 색을 보간하는 것으로 충분하기 때문이다.

```c++
ComPtr<ID3DBlob> signature;
ComPtr<ID3DBlob> error;
ThrowIfFailed(D3D12SerializeRootSignature(
  &rootSignatureDesc,
  D3D_ROOT_SIGNATURE_VERSION_1,
  &signature,
  &error));
ThrowIfFailed(m_device->CreateRootSignature(
  0, signature->GetBufferPointer(),
  signature->GetBufferSize(),
  IID_PPV_ARGS(&m_rootSignature)));
```

이제 위에서 설정한 루트 시그니처의 Desc를 직렬화해 ID3DBlob 타입의 signature로 받는다. 그리고 디바이스가 실제 루트 시그니처를 생성한다.

signature의 GetBufferPointer()와 GetBufferSize()의 경우 각각 직렬화된 바이트의 시작 주소와 바이트의 수를 반환한다. 디바이스는 두 값으로 어디서부터 얼마만큼 데이터를 읽어 루트 시그니처를 생성한다.

#### 1-2-2. 셰이더 로드

```c++
UINT8* pVertexShaderData = nullptr;
UINT8* pPixelShaderData = nullptr;
UINT vertexShaderDataLength = 0;
UINT pixelShaderDataLength = 0;

ThrowIfFailed(ReadDataFromFile(
	GetAssetFullPath(L"shaders_VSMain.cso").c_str(),
	&pVertexShaderData,
	&vertexShaderDataLength));
ThrowIfFailed(ReadDataFromFile(
	GetAssetFullPath(L"shaders_PSMain.cso").c_str(),
	&pPixelShaderData,
	&pixelShaderDataLength));
```

Assets의 Shaders 경로 하위에 있는 shaders.hlsl이 빌드될 때 내부에 정의된 VSMain과 PSMain을 각각 cso 파일로 분할 생성한다. 그리고 이를 읽어 버텍스 셰이더와 픽셀 셰이더 데이터로 저장하는 코드이다.

#### 1-2-3. 버텍스 입력 레이아웃 정의

```c++
// Define the vertex input layout. | 정점 입력 레이아웃을 정의한다.
D3D12_INPUT_ELEMENT_DESC inputElementDescs[] =
{
    { "POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0, D3D12_INPUT_CLASSIFICATION_PER_VERTEX_DATA, 0 },
    { "COLOR", 0, DXGI_FORMAT_R32G32B32A32_FLOAT, 0, 12, D3D12_INPUT_CLASSIFICATION_PER_VERTEX_DATA, 0 }
};
```

버텍스 버퍼에서 위치와 색을 각각 몇 번째 바이트부터 읽고, 버텍스 셰이더의 어느 입력에 넘길지 정하는 배열이다. 첫째 원소는 POSITION을 두 번째 원소는 COLOR 를 설명한다.

해당 프로젝트의 헤더파일에 정의된 Vertex의 경우 position은 XMFLOAT3, color는 XMFLOAT4 를 사용하고있다. float 하나가 4바이트이므로 버텍스 하나는 다음과 같이 배치된다.

```txt
정점 시작부터    +0      +4      +8    +12  +16  +20  +24
저장된 값         x       y       z     r    g    b    a
                └─ 위치 12바이트 ─┘    └── 색 16바이트 ──┘
```


| 필드 | `POSITION` 줄 | `COLOR` 줄 | 의미 |
| --- | --- | --- | --- |
| `SemanticName` | `"POSITION"` | `"COLOR"` | HLSL의 `: POSITION`, `: COLOR` 입력과 연결하는 이름이다. |
| `SemanticIndex` | `0` | `0` | 이름별 번호. `POSITION`과 `COLOR`는 서로 다른 이름이므로 각각 `0`번을 사용한다. 같은 이름으로 여러 입력을 두면 `TEXCOORD0`, `TEXCOORD1`처럼 구분할 수 있다 |
| `Format` | `R32G32B32_FLOAT` | `R32G32B32A32_FLOAT` | 읽을 데이터 형식이다. 각각 32비트 `float` 3개와 4개를 뜻한다. |
| `InputSlot` | `0` | `0` | 둘 다 **0번 정점 버퍼 슬롯**에서 읽는다. `IASetVertexBuffers(0, 1, &m_vertexBufferView)`의 첫 번째 `0`과 연결된다. |
| `AlignedByteOffset` | `0` | `12` | 정점 하나의 시작 주소에서 해당 항목까지의 바이트 거리 |
| `InputSlotClass` | `PER_VERTEX_DATA` | `PER_VERTEX_DATA` | 정점마다 위치와 색을 한 세트씩 읽는다. |
| `InstanceDataStepRate` | `0` | `0` | 인스턴스별 데이터가 얼마나 자주 바뀌는지 정하는 필드이다. 이 예제의 두 항목은 정점별 데이터라 `0`을 지정한다. |


#### 1-2-4. 파이프라인 상태 객체(PSO) 정의 및 생성

```c++
D3D12_GRAPHICS_PIPELINE_STATE_DESC psoDesc = {};
// 정점을 어떻게 읽고 처리할지
psoDesc.InputLayout = { inputElementDescs, _countof(inputElementDescs) };
psoDesc.pRootSignature = m_rootSignature.Get();
psoDesc.VS = CD3DX12_SHADER_BYTECODE(pVertexShaderData, vertexShaderDataLength);
psoDesc.PS = CD3DX12_SHADER_BYTECODE(pPixelShaderData, pixelShaderDataLength);
psoDesc.PrimitiveTopologyType = D3D12_PRIMITIVE_TOPOLOGY_TYPE_TRIANGLE;
// 삼각형을 어떻게 그리고, 어디에 쓸지
psoDesc.RasterizerState = CD3DX12_RASTERIZER_DESC(D3D12_DEFAULT);
psoDesc.BlendState = CD3DX12_BLEND_DESC(D3D12_DEFAULT);
psoDesc.DepthStencilState.DepthEnable = FALSE;
psoDesc.DepthStencilState.StencilEnable = FALSE;
psoDesc.SampleMask = UINT_MAX;
psoDesc.NumRenderTargets = 1;
psoDesc.RTVFormats[0] = DXGI_FORMAT_R8G8B8A8_UNORM;
psoDesc.SampleDesc.Count = 1;
ThrowIfFailed(m_device->CreateGraphicsPipelineState(
	&psoDesc,
	IID_PPV_ARGS(&m_pipelineState)));
```

psoDesc 는 GPU가 정점 데이터를 받아 삼각형을 그리고 그 결과를 백 버퍼에 쓰는데 필요한 설정을 저장한다. CreateGraphicsPipelineState() 에 이 desc를 넘기면 실제 PSO가 생성되고 m\_pipelineState에 할당된다.

이 PSO 설정에서 실제 렌더링 관련 용어들이 많이 등장한다. 


| 속성 | 설명 |
| --- | --- |
| `InputLayout` | 정점 버퍼에서 각 속성을 어느 바이트 위치에서 어떤 형식으로 읽을지 정의한다. HelloTriangle은 `inputElementDescs`의 두 항목을 사용해 정점의 위치와 색을 정점 셰이더에 전달한다. |
| `pRootSignature` | 셰이더의 리소스 연결 방식을 정의하는 루트 시그니처를 지정한다. 이 예제에서는 루트 매개변수가 0개이고 정점 입력 레이아웃을 허용하는 `m_rootSignature`를 사용한다. |
| `VS` | 파이프라인에서 실행할 정점 셰이더를 지정한다. `shaders_VSMain.cso`에서 읽은 바이트의 주소와 크기를 설정하며, 이 셰이더는 정점의 위치와 색을 다음 단계로 전달한다. |
| `PS` | 파이프라인에서 실행할 픽셀 셰이더를 지정한다. `shaders_PSMain.cso`에서 읽은 바이트의 주소와 크기를 설정하며, 이 셰이더는 보간된 색을 출력한다. |
| `PrimitiveTopologyType` | 이 PSO가 처리할 도형의 종류를 정한다. 삼각형을 그리므로 `TRIANGLE`로 지정하고, 정점을 세 개씩 묶는 방식은 명령 리스트에서 `TRIANGLELIST`로 설정한다. |
| `RasterizerState` | 삼각형이 화면에서 덮는 영역을 어떻게 처리할지 정한다. 기본 설정은 삼각형 내부를 채우고 뒷면을 제외한다. 예제의 삼각형은 화면에서 정점이 시계 방향으로 배치되므로 앞면으로 처리된다. |
| `BlendState` | 픽셀 셰이더의 출력 색과 렌더 타깃에 이미 저장된 색을 어떻게 합칠지 정한다. 기본 설정은 블렌딩을 끄고 RGBA 네 채널의 쓰기를 허용하므로, 삼각형이 덮는 곳에 픽셀 셰이더의 출력 색을 기록한다. |
| `DepthStencilState.DepthEnable` | 깊이 테스트의 사용 여부를 정한다. 이 예제는 배경 위에 삼각형 하나를 그리므로, 겹친 도형의 깊이를 비교할 필요가 없어 `FALSE`로 설정한다. |
| `DepthStencilState.StencilEnable` | 저장된 스텐실 값에 따라 픽셀을 그릴지 결정하는 테스트의 사용 여부를 정한다. 이 예제는 스텐실 마스크 없이 그리므로 `FALSE`로 설정한다. |
| `SampleMask` | 어떤 샘플의 갱신을 허용할지 비트 단위로 정한다. 모든 비트가 `1`인 `UINT_MAX`를 사용해 마스크에서 모든 샘플을 허용한다. |
| `NumRenderTargets` | 한 번의 그리기에서 동시에 색을 출력할 렌더 타깃의 수를 지정한다. 현재 백 버퍼의 RTV 한 개에 그리므로 `1`로 설정한다. |
| `RTVFormats[0]` | 첫 번째 렌더 타깃의 픽셀 형식을 지정한다. 스왑 체인의 백 버퍼 형식에 맞춰 RGBA 채널마다 8비트를 사용하는 `DXGI_FORMAT_R8G8B8A8_UNORM`으로 설정한다. |
| `SampleDesc.Count` | 픽셀당 샘플 수를 지정한다. MSAA 없이 백 버퍼에 직접 그리므로 백 버퍼와 같은 `1`을 사용한다. `SampleDesc.Quality`는 구조체 초기화로 설정된 `0`을 사용한다. |


#### 1-2-5. 정점버퍼 생성

```c++
// Define the geometry for a triangle. | 삼각형을 이루는 정점의 위치와 색을 정의한다.
Vertex triangleVertices[] =
{
    { { 0.0f, 0.25f * m_aspectRatio, 0.0f }, { 1.0f, 0.0f, 0.0f, 1.0f } },
    { { 0.25f, -0.25f * m_aspectRatio, 0.0f }, { 0.0f, 1.0f, 0.0f, 1.0f } },
    { { -0.25f, -0.25f * m_aspectRatio, 0.0f }, { 0.0f, 0.0f, 1.0f, 1.0f } }
};

const UINT vertexBufferSize = sizeof(triangleVertices);

// Note: using upload heaps to transfer static data like vert buffers is not 
// recommended. Every time the GPU needs it, the upload heap will be marshalled 
// over. Please read up on Default Heap usage. An upload heap is used here for 
// code simplicity and because there are very few verts to actually transfer.
//
// 정점 버퍼처럼 내용이 바뀌지 않는 데이터는 기본 힙(Default Heap)에 두는 것이 좋다.
// 업로드 힙에 두면 GPU가 정점 데이터를 필요로 할 때마다 업로드 힙에서 읽는다.
// 이 예제는 정점 수가 적고 코드를 단순하게 유지하기 위해 업로드 힙을 사용한다.
ThrowIfFailed(m_device->CreateCommittedResource(
    &CD3DX12_HEAP_PROPERTIES(D3D12_HEAP_TYPE_UPLOAD),
    D3D12_HEAP_FLAG_NONE,
    &CD3DX12_RESOURCE_DESC::Buffer(vertexBufferSize),
    D3D12_RESOURCE_STATE_GENERIC_READ,
    nullptr,
    IID_PPV_ARGS(&m_vertexBuffer)));
```

먼저 Vertex 구조체의 데이터에 대한 설명이다. 정점의 위치가 뷰포트 위에서 어떤 방식으로 찍히는지에 대한 그림이다

![1280×720 뷰포트에서 삼각형 정점의 정규화 좌표와 픽셀 좌표](/media/hellotriangle/vertex-positions.png)

현재 프로그램에서 설정한 윈도우의 해상도는 1280x720 이다. 따라서 화면 가운데를 기준으로 0.25만큼씩 이동한 거리에 점을 찍는다면 삼각형은 가로로 길게 그려질 것이다. 따라서 세로 길이를 가로 비율에 맞추기 위해 m\_aspectRatio 변수는 윈도우 창이 만들어 지는 시점에서 width/height 값을 할당해 놓았다.

그리고 해당 Vertex배열의 사이즈를 vertexBufferSize 변수에 저장하고 CommittedResource(버퍼리소스)를 생성한다.

정점 데이터를 담을 메모리를 확보하고, 그 메모리를 사용할 Direct3D 12 버퍼 객체를 만드는 함수이다. 해당 함수 호출이 성공하면 m\_vertexBuffer 가 그 객체를 가리킨다. 삼각형의 실제 좌표와 색은 다음에 나오는 memcpy() 에서 버퍼에 할당되어진다.


| 인자 | 이 호출에서 지정하는 내용 |
| --- | --- |
| `&CD3DX12_HEAP_PROPERTIES(D3D12_HEAP_TYPE_UPLOAD)` | **메모리의 접근 방식**을 정한다. 업로드 힙은 CPU가 데이터를 쓰고 GPU가 읽을 수 있다. 그래서 이 예제는 `Map()`으로 CPU 주소를 얻어 정점 데이터를 쓸 수 있다. |
| `D3D12_HEAP_FLAG_NONE` | 힙을 만들 때 기본 옵션을 사용한다. |
| `&CD3DX12_RESOURCE_DESC::Buffer(vertexBufferSize)` | **만들 리소스의 형태와 크기**를 정한다. `Buffer()`는 `Dimension = BUFFER`, `Width = vertexBufferSize`인 설명 구조체를 만든다. 버퍼에서 `Width`의 단위는 바이트다. 이 예제에서는 정점 하나가 28바이트이고 정점이 세 개이므로 `Width`는 **84**다. |
| `D3D12_RESOURCE_STATE_GENERIC_READ` | **GPU가 리소스를 어떤 용도로 사용할 수 있는지** 정한다. 업로드 힙의 리소스에 필요한 상태이고, GPU가 정점 버퍼로 읽는 용도가 여기에 포함된다. CPU가 쓸 수 있는지는 첫 번째 인자의 업로드 힙 설정으로 결정된다. |
| `nullptr` | 최적화된 지우기 값을 받는 자리다. 렌더 타깃이나 깊이 텍스처에서 사용할 수 있는 값이며, 버퍼 생성 시에는 `nullptr`를 전달해야 한다. |
| `IID_PPV_ARGS(&m_vertexBuffer)` | `ID3D12Resource` 인터페이스를 요청하고, 생성된 인터페이스 포인터를 `m_vertexBuffer`에 기록할 수 있도록 출력 위치를 전달한다. |


위 인자들로 디바이스에 어떤 메모리와 버퍼가 필요한지를 전달한다. 그리고 Direct3D 12 가 메모리를 마련하고 버퍼를 연결한다. 이 함수는 힙을 만들고, 리소스를 그 힙에 연결하는 일을 한 번에 처리한다. 여기서 힙은 바이트가 실제로 저장되는 메모리 할당이고, 버퍼 리소스는 그 메모리의 일부를 84바이트짜리 버퍼로 사용할 수 있게 해주는 객체이다.

이 함수의 동작이 완료되어지면 GPU가 이 메모리에 접근할 수 있도록 준비된 상태로 m\_vertexBuffer 변수가 설정된다. 이런 방식으로 내부에서 함께 만든 힙을 암시적 힙 이라고 한다.

m\_vertexBuffer 에 실제로 할당되는 값은 버퍼 객체의 인터페이스 포인터이다. 그래서 이후 m\_vertexBuffer→Map() 으로 CPU가 쓸 주소를 요청하고, GetGPUVirtualAddress() 로 GPU가 읽을 주소도 얻을 수 있다.

```c++
// Copy the triangle data to the vertex buffer. | 삼각형의 정점 데이터를 정점 버퍼에 복사한다.
UINT8* pVertexDataBegin;
CD3DX12_RANGE readRange(0, 0);        // We do not intend to read from this resource on the CPU. | CPU는 이 리소스에서 데이터를 읽을 계획이 없다.
ThrowIfFailed(m_vertexBuffer->Map(
		0,
		&readRange,
		reinterpret_cast<void**>(&pVertexDataBegin)));
memcpy(pVertexDataBegin, triangleVertices, sizeof(triangleVertices));
m_vertexBuffer->Unmap(0, nullptr);
```

앞서 만든 triangleVertices 배열의 위치와 색 데이터를 복사한다. Map 함수 사용해 CPU가 쓸 주소를 제공하고 memcpy()  사용해 그 주소에 실제로 데이터를 작성한다.

m\_vertexBuffer의 Map 함수를 조금 더 자세히 살펴보자.

해당 함수의 경우 이미 만들어진 정점 버퍼의 첫 바이트에 CPU가 접근할 수 있도록 하고, 그 CPU 가상 주소를 pVertexDataBegin 에 기록하는 함수이다. 첫 번째 인자는 접근할 하위 리소스 인덱스이다. 정점 버퍼에는 하위 리소스가 하나라서 0을 넘긴다.

그리고 &readRange 인자의 경우 CPU가 정점 버퍼에서 읽을 범위이다. (0, 0)은 해당 CPU가 해당 버퍼를 읽지 않는다는 의미이다. CPU가 정점 버퍼를 읽는 경우는 정상 렌더 로직에서는 거의 없다고 봐도 된다. CPU에서 정점 데이터를 읽는 작업은 디버깅 등에 활용할 수 있다.

reinterpret\_cast\<void\*\*>(&pVertexDataBegin) 의 경우 Map 함수의 결과 주소를 써 넣을 변수의 주소 이다. void\* 의 경우 가리키는 데이터의 타입을 지정하지 않은 포인터인데 여기서는 버퍼의 시작 주소값을 가리킨다. 이 주소값의 위치를 받기 때문에 void\*의 포인터인 void\*\* 로 캐스팅한다. 애초에 pVertexDataBegin 변수를 void\*로 선언하게 되면 해당 캐스팅 과정이 필요없게 되지만 해당 샘플 코드에서는 버퍼의 첫 바이트를 가리키는 변수임을 명시하기 위해 UINT8\* 타입을 명시한 것으로 보인다.

마지막으로 memcpy 함수 사용해 triangleVertices Vertex 객체를 해당 사이즈만큼 복사해서 pVertexDataBegin 에 붙여넣는다.

그리고 정점버퍼의 Unmap 함수사용해서 Map() 으로 열어둔 CPU 접근을 끝낸다. 이 줄 이후에는 pVertexDataBegin으로 버퍼에 접근할 수 있는 기간이 끝난다.

첫 번째 인자인 0은 Map() 함수와 같이 하위 리소스의 인덱스이다. 정점 버퍼에는 하위 리소스가 하나이기 때문에 0을 넘긴다. 그리고 두 번째 인자의 경우 nullptr을 넘기는데 이는 CPU가 하위 리소스 전체를 수정했을 수 있다는걸 의미한다. 바로 앞의 memcpy()가 정점 버퍼 전체인 84 바이트를 채웠으므로 이 예제에서는 nullptr이 맞다.

만약 Map 함수로 버텍스 주소를 연결하고 memcpy를 사용해 두 번째 정점 데이터만 복사했을 경우 Unmap 함수에서 주어지는 두 번째 인자에는 현재 Vertex 구조체를 기준으로 CD3DX12\_RANGE readRange(28, 56) 를 전달하면 된다. 이는 CPU가 수정한 바이트 범위를 그래픽 디버거와 캡처 도구에 알리는 값이다.

```c++
// Initialize the vertex buffer view. | 정점 버퍼 뷰를 초기화한다.
m_vertexBufferView.BufferLocation = m_vertexBuffer->GetGPUVirtualAddress();
m_vertexBufferView.StrideInBytes = sizeof(Vertex);
m_vertexBufferView.SizeInBytes = vertexBufferSize;
```

직전의 memcpy() 가 정점 버퍼에 실제 데이터를 채웠다면, 이 세 줄은 GPU가 그 데이터를 읽을 때 필요한 정보를 정점버퍼뷰(m\_vertexBufferView) 에 세팅한다.

BufferLocation 의 경우 정점 데이터의 시작 주소이다. GetGPUVirtualAddress() 함수로 첫 번째 정점이 있는 GPU 가상 주소를 얻는다. 앞에서 Map() 으로 받은 주소는 CPU가 사용하는 주소이고 이 경우 GPU가 같은 버퍼를 읽을 때 사용하는 가상의 주소이다.

StrideInBytes 는 정점 하나의 시작점에서 다음 정점의 시작점까지의 간격이다. OpenGL 에서도 Stride 라는 용어로 데이터간의 간격을 지정했었던 기억이 난다. 이 경우 Vertex 구조체의 사이즈를 할당해 정점 간격을 알린다.

SizeInBytes 는 시작 주소부터 이 뷰가 사용할 수 있는 전체 바이트 수이다. 앞선 코드에서 vertexBufferSize 변수에 버텍스 데이터 전체 크기를 할당해 놓았다.

#### 1-2-6. 동기화 객체 설정

```c++
// Create synchronization objects and wait until assets have been uploaded to the GPU. | 동기화 객체를 생성하고 초기화가 끝날 때까지 기다린다.
{
  ThrowIfFailed(m_device->CreateFence(0, D3D12_FENCE_FLAG_NONE, IID_PPV_ARGS(&m_fence)));
  m_fenceValue = 1;

  // Create an event handle to use for frame synchronization. | 프레임 동기화에 사용할 이벤트 핸들을 생성한다.
  m_fenceEvent = CreateEvent(nullptr, FALSE, FALSE, nullptr);
  if (m_fenceEvent == nullptr)
  {
      ThrowIfFailed(HRESULT_FROM_WIN32(GetLastError()));
  }

  // Wait for the command list to execute; we are reusing the same command 
  // list in our main loop but for now, we just want to wait for setup to 
  // complete before continuing.
  //
  // 메인 루프에서는 같은 명령 목록을 재사용한다.
  // 이 예제는 정점 데이터를 CPU에서 업로드 힙에 쓴 뒤, 큐에 넣은 펜스 신호가 완료되면 계속 진행한다.
  WaitForPreviousFrame();
}
```

LoadAssets() 마지막 코드이다. HelloWindow와 다른 점은 마지막에 WaitForPreviousFrame() 함수를 한 번 호출한다는 것이다.

해당 함수의 경우 HelloWindow와 같다. GPU에 맡긴 작업을 기다린 후 다음 프레임으로 넘어가는 동작이다. 이 호출은 큐의 펜스 신호 완료를 확인하고 백 버퍼 인덱스를 갱신한다. 이 초기화 구간에는 GPU 복사 명령을 제출하지 않았으므로 기다릴 업로드 작업은 없다.

## 2. OnUpdate()

해당 프로젝트도 OnUpdate 는 비어 있다.

## 3. OnRender()

PopulateCommandList() 함수 내부 동작만 달라지고 나머지 OnRender() 로직은 이전 프로젝트인 HelloWindow와 동일하다. 따라서 이 글에서는 PopulateCommandList() 함수까지만 자세하게 살펴보고 나머지는 간략하게 넘어갈 것이다.

### 3-1. PopulateCommandList()

기존 명령 리스트를 Reset하고 배경색 채우기와 삼각형 그리기 명령을 다시 기록한다.

명령 리스트에는 배경을 칠하고, 삼각형을 그리는 명령이 차례로 기록되어진다. 이 동작 내부에서도 명령 할당자와 리스트를 열고 닫는 과정은 HelloWindow 프로젝트와 동일하기 때문에 간단하게 넘어가고 삼각형을 그리는 부분을 중점적으로 살펴보자.

#### 3-1-1. 그리기 상태 설정

```c++
// Set necessary state. | 그리기에 필요한 상태를 설정한다.
m_commandList->SetGraphicsRootSignature(m_rootSignature.Get());
m_commandList->RSSetViewports(1, &m_viewport);
m_commandList->RSSetScissorRects(1, &m_scissorRect);
```

명령 할당자와 리스트를 Reset해 명령 기록 상태를 만드는 작업 후, 명령 리스트에 다음과 같이 그리기에 필요한 상태를 설정한다. 순서대로 셰이더의 리소스 연결 규칙, 정점 좌표를 픽셀 좌표로 바꾸는 기준, 픽셀을 그릴 수 있는 범위를 지정한다.

1. m\_commandList 의 SetGraphicsRootSignature 함수를 사용해 LoadAssets 시점에 설정한 루트 시그니처를 가져와 명령리스트에 세팅한다.
2. m\_commandList 의 RSSetViewports 함수를 사용해 정점이 렌더 타깃의 어디에 놓일지를 결정한다. 접두어인 RS는 래스터라이저 단계(Rasterizer Stage)를 의미한다.

첫 번째 인자인 1은 뷰포트 하나를 설정한다는 뜻이다.

&m\_viewport 는 해당 뷰포트 설정이 담긴 구조체이다.

```c++
D3D12HelloTriangle::D3D12HelloTriangle(UINT width, UINT height, std::wstring name) :
    DXSample(width, height, name),
    m_frameIndex(0),
    m_viewport(0.0f, 0.0f, static_cast<float>(width), static_cast<float>(height)),
    m_scissorRect(0, 0, static_cast<LONG>(width), static_cast<LONG>(height)),
    m_rtvDescriptorSize(0)
{
}
```

해당 클래스 생성 시점에 viewport 와 scissorRect의 값이 다음과 같이 설정되어진다.

해당 값은 뷰포트가 왼쪽 위를 가리키는 0, 0 좌표에서 윈도우의 너비와 높이 값과 같은  크기를 가진다는 것을 의미한다. 그리고 RSSetViewports 함수로 해당 구조체를 넘길 경우 정규화 좌표 (-1, +1(좌상단)) 과 뷰포트의 0, 0이 일치하고 정규화 좌표 0, 0은 뷰포트의 중앙, 그리고 (+1, -1(우하단)) 은 뷰포트의 오른쪽 아래를 의미하게 된다.

3. m\_commandList 의 RSSetScissorRects 함수를 사용해 삼각형에서 어느 픽셀을 그릴 수 있는지 정한다.

위 코드를 보면 알 수 있듯이 뷰포트와 동일한 값으로 설정되어 있다. 첫 번째 인자인 1 은 시저 사각형 하나를 설정한다는 뜻이다.

예를들어 뷰포트를 800x600 그대로 두고, 시저 사각형만 (0, 0, 400, 600)으로 바꿀 경우 삼각형의 정점은 여전히 같은 픽셀 좌표에 놓인다. 하지만 그중 왼쪽 절반에 걸친 픽셀만 그려진다.

뷰포트의 경우 삼각형을 어디에 배치할지를 정하고, 시저는 배치된 삼각형을 어디까지 그릴지를 정한다고 생각하면 된다. 또 배경을 채우는 ClearRenderTargetView() 의 경우 함수에 직접 넘긴 사각형 인자로 범위를 정한다.

#### 3-1-2. 픽셀 셰이더와 렌더타깃 연결

```c++
CD3DX12_CPU_DESCRIPTOR_HANDLE rtvHandle(m_rtvHeap->GetCPUDescriptorHandleForHeapStart(), m_frameIndex, m_rtvDescriptorSize);
m_commandList->OMSetRenderTargets(1, &rtvHandle, FALSE, nullptr);
```

rtvHandle 생성은 HelloWindow프로젝트와 같다. 이후 그리기 명령에서 픽셀 셰이더의 색을 어느 렌더 타깃에 사용할지를 명령 목록에 설정을 해준다. OM은 (Output Merger)로 출력 병합 단계를 뜻한다.

해당 프로젝트에서 실제로 연결되는 것은 다음과 같다.

픽셀 셰이더의 return input.color는 SV\_TARGET이 붙어있는데, SV\_TARGET 의 경우 SV\_TARGET0을 의미한다. SV\_Target0, SV\_Target1, SV\_Target2, SV\_Target3은 각각 0·1·2·3번 렌더 타깃 출력에 대응한다.

그리고 이 출력번호에 대응하는 렌더 타깃을 연결한다.

OMSetRenderTargets의 두 번째 인자에 들어가는 rtv 의 순서가 슬롯의 번호가 된다. 지금의 경우 rtvHandle 하나를 넘기기 때문에 0번 슬롯만 존재하게 된다. 결과적으로 rtvHandle(프레임에 따라 핸들의 위치가 결정됨) 을 OMSetRenderTargets으로 넘겨 픽셀 셰이더와 연결된다고 생각하면 되겠다.

추가로 인자에 대해 설명하자면 첫 번째 인자인 1은 이번 그리기에 사용할 컬러 렌더 타깃의 수 이다. 스왑체인의 백 버퍼 두 개 중 이번에 고른 하나를 두 번째 인자로 전달된 rtvHandle 을 사용해 연결한다.

세 번째 인자는 연결할 RTV의 핸들을 전달하는 방식이다. TRUE의 경우 연속된 RTV 의 첫 핸들만 넘기는 방식이다. 연속되지 않은 RTV 핸들을 넘기려면 FALSE를 할당한다.

네 번째의 경우 깊이, 스텐실 뷰 연결에 사용된다. 사용하지 않기 때문에 nullptr을 넘긴다.

#### 3-1-3. 배경, 삼각형 그리기 명령 기록

```c++
// Record commands. | 명령을 기록한다.
const float clearColor[] = { 0.0f, 0.2f, 0.4f, 1.0f };
m_commandList->ClearRenderTargetView(rtvHandle, clearColor, 0, nullptr);
m_commandList->IASetPrimitiveTopology(D3D_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
m_commandList->IASetVertexBuffers(0, 1, &m_vertexBufferView);
m_commandList->DrawInstanced(3, 1, 0, 0);
```

ClearRenderTargetView 함수로 배경색을 칠하는 명령을 먼저 기록한다.  중요한건 다음의 세 함수들이다. 각각 살펴보자.

먼저 IASetPrimitiveTopology() 함수이다. 정점을 어떻게 묶을지에 대해 정하게 되는데 D3D\_PRIMITIVE\_TOPOLOGY\_TRIANGLELIST 값의 경우 연속된 정점 3개씩을 독립된 삼각형으로 인식하여 조립하는 방식이다.

그리고 IASetVertexBuffers()의 경우 정점데이터를 어디서 가져올지 정한다. 첫 번째, 두 번째 인자인 0, 1 은 입력슬롯 0으로부터 정점 버퍼 뷰 하나를 연결한다는 뜻이다. 앞에서 채운 m\_vertexBufferView 가 버퍼의 GPU 시작주소, 정점 사이 간격인 28바이트, 전체범위인 84바이트를 알려준다.

여기서 IA의 경우 (Input Assembler)의 약자이다. Direct3D의 그래픽 파이프라인에서 정점 데이터를 읽고, 지정된 규칙에 따라 점,선, 삼각형으로 조립하는 단계이다.

여기서 정점버퍼를 직접 사용하지 않고 정점버퍼뷰를 IA단계에서 설정하는 이유는 이렇게 뷰 구조를 따로 두면 하나의 버퍼에 여러 물체의 정점 데이터를 넣어두고, 그릴 물체에 해당하는 구간만 골라 IA에 연결할 수 있기 때문이다.

그리고 IA 단계에서 사용하는 데이터가 LoadAssets() 함수 초반부에 선언한 Input Layout 정보이다.

```c++
D3D12_INPUT_ELEMENT_DESC inputElementDescs[] =
{
    { "POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, 0, D3D12_INPUT_CLASSIFICATION_PER_VERTEX_DATA, 0 },
    { "COLOR", 0, DXGI_FORMAT_R32G32B32A32_FLOAT, 0, 12, D3D12_INPUT_CLASSIFICATION_PER_VERTEX_DATA, 0 }
};
```

 IASetVertexBuffers의 시작 슬롯 번호와 연결되는 값은 입력 레이아웃의 InputSlot이다. POSITION과 COLOR 바로 다음의 0은 SemanticIndex이다. 그리고 이 Input Layout은 m\_commandList가 Reset될 때 두 번째 인자로 주어지는 m\_pipelineState로 인해 전달되어진다.

이제 DrawInstanced 함수이다. 이 함수의 경우 순서대로 각각 인스턴스 하나에 사용할 정점의 수, 그리고 그릴 인스턴스의 수, 시작 정점 인덱스, 시작 인스턴스 인덱스이다. 각각 3, 1, 0, 0 이 전달됐다.

첫 번째 두 번째 인자의 경우 명확하다. 세 번째인 시작 정점 인덱스의 경우 설정된 정점버퍼의 버텍스중 설정한 인덱스부터 차례로 사용한다는 뜻이다. 지금 이 프로젝트의 경우 1을 할당할 경우 정점 데이터가 3개만 세팅되어 있기 때문에 마지막점은 0,0 위치에 색도 지정되지 않아 검은색으로 출력된다.

네 번째 인자의 경우 StartInstanceLocation 으로 인스턴스 데이터의 시작 위치를 지정한다. 이 인스턴스 데이터에는 위치값이나 컬러와같은 데이터가 들어갈 수 있는데 해당 프로젝트에서는 아직 사용하지 않기 때문에 0 값을 넘기고 무시한다.

#### 3-1-4. 마무리

m\_commandList->ResourceBarrier 로 현재 백 버퍼의 상태를 렌더 타깃에서 다시 표시 상태로 전환하고 명령 리스트를 Close 한다.

## 4. OnDestroy()

HelloWindow와 같다.

