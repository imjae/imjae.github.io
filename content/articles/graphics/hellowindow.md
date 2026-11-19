---
title: "D3D12HelloWorld_01_HelloWindow"
description: "DXSample과 D3D12HelloWindow의 초기화, GPU 명령 기록·제출, 화면 표시와 펜스 동기화 과정을 살펴봅니다."
slug: "hellowindow"
date: "2026-11-17"
dateBasis: "notion"
topic: "graphics"
kind: "note"
tags: ["Direct3D 12"]
draft: false
---

## 서론

시작하기 앞서 Microsoft 에서 제공하는 <a href="https://app.notion.com/p/41b3b61361d1806a8756f607df0e54f2#41c3b61361d18065b9e3d24842fec913" aria-label="원문의 링크 미리보기"></a> 의 샘플 코드를 활용해 Direct3D 12 를 공부해 나간다는 것을 알리고 싶다.

앞으로 반복적으로 사용할 DXSample의 구조를 살펴보는 시간이기 때문에 한줄한줄 꼼꼼하게 분석해 나가기로 한다.

## 0. 개요 및 용어 정리

Microsoft에서 제공하는 샘플 코드의 경우 Windows Desktop Application 프로젝트 위에서 돌아간다. 때문에 각 솔루션마다 정의되어 있는 Main.cpp파일(파일명은 중요하지 않음)의 WinMain()함수(함수명 중요)에서 프로젝트가 시작된다. (기본 설정이라면)

각 단계별 코드들은 DXSample 라는 클래스를 상속받아 추가 동작들이 구현되어지는데 해당 HelloWindow의 경우 DXSample을 상속받은 D3D12HelloWindow 클래스에 동작이 구현된다.

```c++
class D3D12HelloWindow : public DXSample
{
public:
    D3D12HelloWindow(UINT width, UINT height, std::wstring name);

    virtual void OnInit();
    virtual void OnUpdate();
    virtual void OnRender();
    virtual void OnDestroy();

private:
    static const UINT FrameCount = 2;

    // Pipeline objects. | 파이프라인 객체.
    ComPtr<IDXGISwapChain3> m_swapChain;
    ComPtr<ID3D12Device> m_device;
    ComPtr<ID3D12Resource> m_renderTargets[FrameCount];
    ComPtr<ID3D12CommandAllocator> m_commandAllocator;
    ComPtr<ID3D12CommandQueue> m_commandQueue;
    ComPtr<ID3D12DescriptorHeap> m_rtvHeap;
    ComPtr<ID3D12PipelineState> m_pipelineState;
    ComPtr<ID3D12GraphicsCommandList> m_commandList;
    UINT m_rtvDescriptorSize;

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

<p>
해당 클래스의 헤더파일을 살펴보면 꽤나 간단하다.  첫 단계인 Window 띄우기를 위한 필드들만 선언되어 있어 Direct3D를 처음 접하는 사람들에 대한 배려가 꽤나 느껴진다. 
</p>

여기서 중요하게 알아야할 것들은 각 파이프라인 객체들의 용도, 그리고 동기화 객체가 어떤 방식으로 맞춰지고 있는지 정도 일것이다.

윈도우 클래스의 초기화 과정이나 윈도우 창 핸들을 저장하고 사용하는 등의 그래픽 렌더 목적 외의 로직들은 추후에 차차 알아보도록 하고 추상함수로 선언된 OnInit, OnUpdate, OnRender, OnDestory 시점의 동작들을 집중적으로 알아보자.

해당 동작들을 알아보기전 용어부터 간단하게 짚고 넘어가는게 좋아 보이는데 D3D12(Direct3D 12) 와 DXGI(DirectX Graphics Infrastructure) API를 사용하는 과정에서 나올 용어들이므로 앞으로 다양한 샘플코드들을 분석할때 꾸준히 나올 용어들이다. DXGI는 사용할 그래픽 장치를 찾고 완성된 그림을 화면에 표시하는 일을 주로 담당한다. 그리고 D3D12는 GPU로 그림을 만드는 작업을 담당한다고 보면 좋겠다. (인터페이스 이름으로 명시되어있어 구분하기 편하다)

\[ 명칭 ( 타입, 변수명 ) : 설명 \]

1. 스왑체인 (IDXGISwapChain3, m\_swapChain) : 백 버퍼들을 관리하고, Present() 로 완성된 프레임의 화면 표시를 요청한다.
2. 디바이스 (ID3D12Device, m\_device) : 버퍼, 텍스처, 명령 큐 등 Direct3D 객체를 생성하고, GPU가 지원하는 기능을 확인한다.
3. 리소스, 백 버퍼 배열 (ID3D12Resource, m\_renderTargets) : 배열로 선언되어 화면에 표시할 이미지의 픽셀값을 저장하는 백 버퍼 들을 참조한다.
4. 명령 할당자 (ID3D12CommandAllocator, m\_commandAllocator) : GPU 명령을 기록하는데 필요한 메모리를 할당하고, 재사용할 수 있도록 관리한다.
5. 명령 큐 (ID3D12CommandQueue, m\_commandQueue) : 기록한 명령 리스트를 GPU에 제출하고, 해당 큐의 작업 실행과 동기화를 관리한다.
6. 설명자(디스크럽터) 힙 (ID3D12DescriptorHeap, m\_rtvHeap) : 리소스의 사용 방법을 설명하는 디스크럽터들을 저장한다. 이 예제에서는 백 버퍼 별 RTV(Render Target View)를 보관한다.
7. 파이프라인 상태 객체 (ID3D12PipelineState, m\_pipelineState) : 셰이더, 블렌딩, 깊이 검사 등 그리기에 사용할 설정을 저장한다. HelloWindow 에서는 nullptr 상태이다.
8. 그래픽 명령 리스트 (ID3D12GraphicsCommandList, m\_commandList) : 배경색 칠하기, 삼각형 그리기, 리소스 상태 전환 등 GPU 가 실행할 명령을 기록한다.

이제 본격적으로 구조를 파악해보자.

![프로그램 실행과 창 렌더링 순서도](/media/hellowindow/program-flow.png)

위 순서도는 프로프램이 실행되고 생성된 창이 렌더되는 과정을 표현했다.

여기서 우리가 파악할 부분은 창이 생성된 후 실행되는 OnInit() 구간과 WM\_PAINT 메시지를 받아 WindowProc() 이벤트가 실행되면서 동작 될 OnUpdate(), OnRender() 구간, 그리고 WM\_QUIT 메시지를 받아 실행되는 OnDestory() 구간이다. 앞서 잠깐 언급했던 추상화된 DXSample 코드의 함수들이 기억날 것이다.

실제로 코드를 분석한다면 OnRender() 구간부터 보면서 백버퍼나 스왑체인, 그리고 명령할당자나 명령큐와 같은 것들이 어떤 동작을 하는 지 본 후 OnInit() 구간에서 해당 개체들이 어떻게 초기화 되는지 보는게 좋겠지만 지금은 프로그램이 실행되는 순서에 따라 정리를 해보려고 한다.

## 1. OnInit()

LoadPipeline() 과 LoadAssets() 이 실행되며, 파이프라인 객체와 동기화 객체 등이 초기화된다.

### 1-1. LoadPipeline()

렌더링을 시작하는데 필요한 디바이스, 명령큐, 스왑체인, 백 버퍼의 RTV 등을 준비하는 초기화 함수이다. 앞서 설명한 파이프라인 객체들을 초기화하는게 주 역할이다.

#### 1-1-1. Factory와 그래픽 어댑터 그리고 Device 생성

먼저 그래픽 어댑터와 스왑체인을 생성하는데 사용하는 factory를 생성하고 WARP를 사용할지 여부(프로그램 시작 인자로 주어짐) 를 체크해서 알맞은 그래픽 어댑터를 찾아 설정한다. WARP를 사용하지 않는다면 하드웨어 어댑터를 할당하고 WARP를 사용한다면 WARP어댑터를 할당하는 방식이다.

IDXGIAdapter1 타입의 어댑터는 앞으로 그래픽 파이프라인 객체를 생성하는데 필요한 device 객체를 생성하는데 사용되며, 하드웨어 렌더링(그래픽카드의 GPU가 렌더)을 할지, WARP를 이용한 소프트웨어 렌더링(CPU가 렌더) 할지를 결정한다.<br />(참고로 WARP를 사용할 경우 지원되는 GPU나 정상적인 그래픽 드라이버를 이용하기 어려운 환경에서도 Direct3D로 그림을 그릴 수 있어 테스트나 서버 환경에서 활용한다고 한다)

할당된 그래픽 어댑터를 사용해 최종적으로 Device (m\_device 객체)가 할당된다.

#### 1-1-2. 명령 큐 설정

```c++
D3D12_COMMAND_QUEUE_DESC queueDesc = {};
queueDesc.Flags = D3D12_COMMAND_QUEUE_FLAG_NONE;
queueDesc.Type = D3D12_COMMAND_LIST_TYPE_DIRECT;

ThrowIfFailed(m_device->CreateCommandQueue(&queueDesc, IID_PPV_ARGS(&m_commandQueue)));
```

앞으로 계속 보게될 방식인데 Microsoft 샘플 코드에서 정의된 ThrowIfFailed 함수를 사용해 그래픽 API의 HRESULT 를 검사해 실패할 경우 예외를 던지며 코드 진행을 멈추는 방식이다.

명령큐의 설정을 정의하고 해당 설정에 맞게 명령큐(m\_commandQueue)를 생성하여 할당한다.

Flags 값으로 설정된 D3D12\_COMMAND\_QUEUE\_FLAG\_NONE 는 기본 동작을 사용하는 명령큐를 만든다는 의미이다. 그리고 Type 에 설정된 D3D12\_COMMAND\_LIST\_TYPE\_DIRECT 의 경우 그래픽 그리기, 계산, 복사 작업을 처리할 수 있는 범용 그래픽 큐를 의미한다.

삼각형을 그리거나 렌더 타깃에 색을 칠하는 작업에 사용할 수 있다.

#### 1-1-3. 스왑체인 설정

```c++
// Describe and create the swap chain. | 스왑 체인의 설정을 정의하고 스왑 체인을 생성한다.
DXGI_SWAP_CHAIN_DESC1 swapChainDesc = {};
swapChainDesc.BufferCount = FrameCount;
swapChainDesc.Width = m_width;
swapChainDesc.Height = m_height;
swapChainDesc.Format = DXGI_FORMAT_R8G8B8A8_UNORM;
swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
swapChainDesc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_DISCARD;
swapChainDesc.SampleDesc.Count = 1;

ComPtr<IDXGISwapChain1> swapChain;
ThrowIfFailed(factory->CreateSwapChainForHwnd(
    m_commandQueue.Get(),        // Swap chain needs the queue so that it can force a flush on it. | 스왑 체인은 필요할 때 큐를 강제로 플러시할 수 있도록 이 큐를 참조한다.
    Win32Application::GetHwnd(),
    &swapChainDesc,
    nullptr,
    nullptr,
    &swapChain
    ));
```

스왑 체인은 백 버퍼를 만들고 화면 표시를 관리한다. 따라서 어떤 이미지를 몇 장 준비하고, 어떤 방식으로 사용할지를 셋팅해야한다. 그리고 이런 설정을 담는 구조체가 DXGI\_SWAP\_CHAIN\_DESC1 이다.

BufferCount 의 경우 순환해서 사용할 이미지 버퍼를 몇 개 준비할지 정하는 속성이다. 해당 프로젝트의 경우 특이한 점으로 D3D12HelloWindow 클래스 생성 시점에 FrameCount라는 변수에 2를 할당해 두개의 이미지 버퍼를 번갈아가며 보여준다. (단순 Window 배경 색칠 프로젝트이기 때문)

Width,Height의 경우 각 백버퍼가 몇 픽셀의 이미지를 저장할지 정할때 사용한다. 지금은 윈도우 사이즈를 그대로 입력했다.

Format의 경우 픽셀 하나의 색을 몇비트에 어떤 방식으로 저장할지에 대한건데 색상에 관련된 내용은 다음에 기회가 되면 공부겸 다뤄보면 좋겠다. DXGI\_FORMAT\_R8G8B8A8\_UNORM 의 경우 RGBA 값을 각각 8비트에 저장한다는 의미이다.

BufferUsage는 백버퍼를 어떤 작업의 대상으로 사용할지 설정한다. DXGI\_USAGE\_RENDER\_TARGET\_OUTPUT 의 경우 GPU가 그린 그림을 이 백버퍼에 저장하겠다는 뜻이다. GPU가 백버퍼의 각 픽셀에 빨간색 값을 기록할 경우 백버퍼에는 완성된 빨간색 이미지가 저장되고, Present() 로 저장된 이미지가 화면에 표시되는 방식이다.

SwapEffect의 경우 버퍼를 화면에 표시하는 방식과 표시 후 기존 내용을 어떻게 취급할지에 대한 규칙을 설정한다. DXGI\_SWAP\_EFFECT\_FLIP\_DISCARD 의 경우 플립 모델을 사용하고, 표시 후 버퍼의 이전 내용을 폐기한다.

마지막으로 SampleDesc.Count 의 경우 픽셀 당 샘플 수를 설정한다. 여러 샘플은 모서리의 계단 현상을 줄이는 MSAA 에 사용된다. 1의 경우 픽셀당 샘플을 하나를 사용한다는 설정이다.

이제 스왑 체인을 생성하면서 설정한 인자들을 살펴보자.

첫번째 인자의 경우 렌더링에 사용할 명령큐를 할당한다. 앞서 생성한 m\_commandQueue를 할당하는데 ComPtr의 Get 함수를 사용해 ComPtr이 가지고있는 명령큐를 인자로 전달한다.

두번째 인자의 경우 이미지를 표시할 창을 설정하는데 Win32Application::GetHwnd() 함수로 앞서 생성한 윈도우의 핸들을 인자로 전달한다.

세번째 인자의 경우 생성할 스왑 체인의 설정을 설정하는데 바로 직전에 선언한 swapChainDesc를 인자로 전달한다.

네번째와 다섯번째 인자의 경우 전체화면 설정과 표시할 모니터 제한과 같은 윈도우 설정인데 nullptr 를 전달해 기본 설정을 유지한다.

마지막 여섯번째 인자로 생성된 스왑체인을 받을 주소값을 전달한다.

#### 1-1-4. 동기화 객체인 m\_frameIndex 초기 설정

```c++
ThrowIfFailed(swapChain.As(&m_swapChain));
m_frameIndex = m_swapChain->GetCurrentBackBufferIndex();
```

직전에 생성한 스왑체인의 As 함수 사용해 앞으로 사용할 스왑체인 클래스 변수인 m\_swapChain에 IDXGISwapChain3 타입의 스왑체인 할당한다. 앞서 생성한 지역변수의 스왑체인은 IDXGISwapChain1 타입인데 내부적으로 인터페이스를 쿼리해 IDXGISwapChain3 으로 사용하기위해 As 함수를 사용한다. IDXGISwapChain3 를 사용하려는 이유는 바로 다음줄인 GetCurrentBackBufferIndex() 함수를 사용하기 위해서 이다.

백버퍼의 개수를 앞에서 2개로 설정했기 때문에 백버퍼의 인덱스는 0 아니면 1이다. 여기서 초기값을 0으로 직접 할당하는 것 보다 스왑체인의 현재 백버퍼 인덱스를 가져와 할당하는 것이 깔끔하다.

나중에 렌더 단계에서 스왑체인의 Present() 함수를 호출하여 화면에 표시할 프레임을 제출하는 순간에 내부적으로 현재 화면에 표시될 프레임 인덱스를 업데이트 하면서 동기화된다.

#### 1-1-5. 디스크립터힙 생성

```c++
// Create descriptor heaps. | 디스크립터 힙을 생성한다.
{
    // Describe and create a render target view (RTV) descriptor heap. | 렌더 타깃 뷰(RTV)용 디스크립터 힙의 설정을 정의하고 힙을 생성한다.
    D3D12_DESCRIPTOR_HEAP_DESC rtvHeapDesc = {};
    rtvHeapDesc.NumDescriptors = FrameCount;
    rtvHeapDesc.Type = D3D12_DESCRIPTOR_HEAP_TYPE_RTV;
    rtvHeapDesc.Flags = D3D12_DESCRIPTOR_HEAP_FLAG_NONE;
    ThrowIfFailed(m_device->CreateDescriptorHeap(&rtvHeapDesc, IID_PPV_ARGS(&m_rtvHeap)));

    m_rtvDescriptorSize = m_device->GetDescriptorHandleIncrementSize(D3D12_DESCRIPTOR_HEAP_TYPE_RTV);
}
```

여기서 디스크립터힙이란 말 그대로 디스크립터(Descriptor)를 저장하는 힙이다. 디스크립터란 그래픽 작업에 사용할 수 있는 형식으로 담은 데이터 블록을 뜻하는데 지금 사용하는 RTV가 이러한 디스크립터의 한 종류이다.

디스크립터에는 RTV(색상  출력 대상으로 사용), DSV(깊이, 스텐실 검사 대상으로 사용), SRV(셰이더가 읽는 데이터로 사용), CBV(셰이더에 전달할 상수 데이터로 사용) 가 있다.

때문에 해당 rtvHeapDesc 에는 총 FrameCount(=2) 개수 만큼 NumDescriptors 를 설정하고, Type에는 RTV를 설정한다. 그리고 Flags의 경우 셰이더가 해당 디스크립터를 읽을지에 대한 여부를 결정하는데 RTV의 경우엔 셰이더가 읽는 디스크립터가 아니기 때문에 None 으로 설정한다.

그리고 디스크립터 힙을 생성한 후 m\_rtvHeap 에 할당한다.

Device의 구현에 따라 디스크립터의 슬롯 간격이 정해지므로 m\_device에서 D3D12\_DESCRIPTOR\_HEAP\_TYPE\_RTV 타입의 사이즈를 가져와 m\_rtvDescriptorSize  변수에 저장한다. 추후 Render 과정에서 사용한다.

#### 1.1.6. 프레임 리소스 생성

```c++
// Create frame resources. | 프레임 리소스를 생성한다.
{
    CD3DX12_CPU_DESCRIPTOR_HANDLE rtvHandle(m_rtvHeap->GetCPUDescriptorHandleForHeapStart());

    // Create a RTV for each frame. | 각 프레임의 RTV를 생성한다.
    for (UINT n = 0; n < FrameCount; n++)
    {
        ThrowIfFailed(m_swapChain->GetBuffer(n, IID_PPV_ARGS(&m_renderTargets[n])));
        m_device->CreateRenderTargetView(m_renderTargets[n].Get(), nullptr, rtvHandle);
        rtvHandle.Offset(1, m_rtvDescriptorSize);
    }
}
```

스왑체인의 백버퍼들을 m\_renderTargets 배열에 할당하고 각각의 백버퍼에 RTV를 생성해 연결하는 단계이다. 여기서 CD3DX12\_CPU\_DESCRIPTOR\_HANDLE 타입의 rtvHandle은 직전에 만든 RTV가 설정된 디스크립터 힙의 슬롯을 가리키는 용도로 사용된다. 힙의 슬롯 이동을 편하게 해주는 도우미 구조체이다.

반복문의 경우 코드가 꽤나 직관적이라 위 설명으로 충분히 이해가 될 것이라고 생각한다.

#### 1.1.7. 명령 할당자 생성

```c++
ThrowIfFailed(m_device->CreateCommandAllocator(D3D12_COMMAND_LIST_TYPE_DIRECT, IID_PPV_ARGS(&m_commandAllocator)));
```

명령할당자를 생성할때 중요한 것은 타입이다. 일반적인 그래픽 명령 리스트를 기록할 메모리를 관리할 목적으로는 D3D12\_COMMAND\_LIST\_TYPE\_DIRECT 타입을 사용한다. 해당 타입은 배경색 칠하기, 삼각형 그리기, 계산, 데이터 복사 같은 명령을 실행할 메모리를 기록할 수 있다.

해당 명령 할당자(m\_commandAllocator)의 경우 명령리스트(m\_commandList) 와 맞물리는 객체이기 때문에 바로 뒤에 후술할 LoadAssets 함수에서 명령리스트를 생성하면서 더 자세히 다룰것이다.

### 1-2. LoadAssets()

GPU 명령을 기록할 CommandList와 GPU 작업 완료를 확인하고 기다릴 동기화 객체를 준비하는 함수이다.

#### 1-2-1. 명령리스트 생성

```c++
ThrowIfFailed(m_device->CreateCommandList(
    0,
    D3D12_COMMAND_LIST_TYPE_DIRECT,
    m_commandAllocator.Get(),
    nullptr,
    IID_PPV_ARGS(&m_commandList)));
    
ThrowIfFailed(m_commandList->Close());
```

첫번째 인자는 노드 마스크로 ID3D12Device 안에서 구별되는 GPU 단위라고 보면 된다. 일반적인 구성에서는 디바이스에 노드가 하나가 있고, 멀티 GPU 구성에서는 여러 노드가 있을 수 있다.

노드가 하나인 지금과 같은 환경에서는 0을 지정하면 된다. 여러 노드 중 특정 노드를 선택하고 싶을 땐 비트마스트 형태로 값을 지정한다. (0b0100 = 4, 즉 노드 2를 가리킴)

앞에서 만든 명령할당자와 명령리스트가 연결되는 단계로 이후 이 리스트에 기록하는 명령은 m\_commandAllocator 가 관리하는 공간을 사용하게 된다.

생성한 명령리스트는 Close() → Reset() 사이클로 관리되는데 명령리스트의 경우 생성 직후에는 기록중 상태이다. 따라서 Close()로 닫아준다. 명령 기록을 시작하려면 Reset() 함수를 호출해 기록상태로 설정하고 명령 기록이 끝났다면 기록 완료를 뜻하는 Close()함수로 닫아줘야한다.

#### 1-2-2. 동기화 객체 생성

```c++
ThrowIfFailed(m_device->CreateFence(0, D3D12_FENCE_FLAG_NONE, IID_PPV_ARGS(&m_fence)));
m_fenceValue = 1;

// Create an event handle to use for frame synchronization. | 프레임 동기화에 사용할 이벤트 핸들을 생성한다.
m_fenceEvent = CreateEvent(nullptr, FALSE, FALSE, nullptr);
if (m_fenceEvent == nullptr)
{
    ThrowIfFailed(HRESULT_FROM_WIN32(GetLastError()));
}
```

여기서 동기화를 위한 Fence 라는것이 등장하는데 GPU의 작업이 어디까지 끝났는지 숫자로 확인하는 동기화 객체이다. 펜스의 초기값을 첫번째 인자에 할당한 0으로 설정하고 CPU가 다음 Signal() 함수에 사용할 목표 값으로 m\_fenceValue 에 1을 할당한다. 이 부분은 추후 Signal() 함수 사용되는 부분에서 자세하게 다루고 지금은 0 과 1 이 할당됐네 정도로 넘어가자.

그리고 CPU쪽 스레드가 기다릴 윈도우 이벤트를 만든다.

이는 해당 프로젝트에서 단순히 배경을 칠하는 렌더 동작을 하기 때문에 한 화면을 그릴때 프레임을 기다려주는 구조로 되어있다. 그리고 지금 할당한 이벤트가 신호상태가 되면 대기가 끝나도록 되어있다.

이 또한 추후 동기화 로직 확인하는 단계에서 조금 더 자세하게 살펴보자.

## 2. OnUpdate()

해당 프로젝트에서 OnUpdate 구간의 로직은 없다.

## 3. OnRender()

### 3.1. PopulateCommandList()

이번 프레임에 GPU가 실행할 명령을 명령리스트에 순서대로 기록하는 함수이다.

#### 3.1.1. 명령 할당자 Reset

```c++
ThrowIfFailed(m_commandAllocator->Reset());
```

이전 GPU 명령을 기록하는데 썼던 메모리를 다음 명령 기록에 다시 쓸 수 있도록 명령 할당자를 Reset 한다. 이전 프레임에서 ClearRenderTargetView() 호출하면, 어느 백버퍼를 어떤 색으로 채울지에 대한 명령이 기록된다. 명령 할당자는 이 명령을 저장할 메모리를 관리하게 되는데 Reset()을 호출하게 되면 다음에 명령을 기록할 수 있도록 메모리를 준비한다고 보면 된다.

<p>
즉 해당 메모리를 사용해 새 명령을 기록할 수 있도록 메모리를 준비하는 단계이다. 
</p>

#### 3.1.2. 명령 리스트 Reset

```c++
ThrowIfFailed(m_commandList->Reset(m_commandAllocator.Get(), m_pipelineState.Get()));
```

앞서 명령을 저장할 메모리를 재사용할 수 있도록 준비 했다면, 이번에는 명령리스트를 Reset할 차례이다. 이 작업은 닫힌 명령 리스트를 다시 열어 새 명령을 기록할 수 있게 해준다.

여기서 인자로 이번 기록에 사용할 명령  할당자를 지정하고, 기록을 시작할 때 사용할 파이프라인 상태 객체를 지정한다. 이번 프로젝트의 경우 단순 배경 색칠이기 때문에 파이프라인 상태 객체(PSO)가 지정되지 않아. nullptr 이 전달된다.

#### 3.1.3. 백버퍼 상태 전환(Present → RenderTarget)

```c++
const auto barrier = CD3DX12_RESOURCE_BARRIER::Transition(
    m_renderTargets[m_frameIndex].Get(), // 어떤 백 버퍼를 바꿀지
    D3D12_RESOURCE_STATE_PRESENT,        // 전환 전 상태
    D3D12_RESOURCE_STATE_RENDER_TARGET  // 전환 후 상태
);

m_commandList->ResourceBarrier(1, &barrier);
```

CD3DX12\_RESOURCE\_BARRIER::Transition 함수 사용해 명령 리스트에 Transition 명령을 기록한다.

#### 3.1.4. RTV 에 지정한 색 채우는 명령 기록

```c++
CD3DX12_CPU_DESCRIPTOR_HANDLE rtvHandle(
	m_rtvHeap->GetCPUDescriptorHandleForHeapStart(),
	m_frameIndex,
	m_rtvDescriptorSize);

// Record commands. | 명령을 기록한다.
const float clearColor[] = { 0.0f, 0.2f, 0.4f, 1.0f };
m_commandList->ClearRenderTargetView(rtvHandle, clearColor, 0, nullptr);
```

<p>
이번 프레임에 알맞는 RTV 핸들을 계산해 구하고, 해당 핸들을 사용한 색칠 명령을 기록한다. 
</p>

#### 3.1.5. 백버퍼 상태 전환 (RenderTarget → Present)

```c++
// Indicate that the back buffer will now be used to present. 
// 백 버퍼를 화면에 표시할 수 있도록 상태를 전환한다.
m_commandList->ResourceBarrier(
	1,
	&CD3DX12_RESOURCE_BARRIER::Transition(m_renderTargets[m_frameIndex].Get(),
	D3D12_RESOURCE_STATE_RENDER_TARGET,
	D3D12_RESOURCE_STATE_PRESENT));
```

백버퍼의 상태를 다시 Preset 로 전환한다.

#### 3.1.6. 명령 리스트 Close

```c++
ThrowIfFailed(m_commandList->Close());
```

Reset 함수로 열었던 명령리스트를 Close 한다. 이때 기록 과정에서 잘못된 인자를 전달했다면 HRESULT로 오류가 반환되어 예외를 던지며 프로그램이 중단된다.

### 3.2. ExecuteCommandLists()

```c++
// Execute the command list. | 명령 목록을 실행한다.
ID3D12CommandList* ppCommandLists[] = { m_commandList.Get() };
m_commandQueue->ExecuteCommandLists(_countof(ppCommandLists), ppCommandLists);
```

명령목록 배열을 명령큐의 ExcuteCommandLists 함수를 통해 GPU에 제출한다. 이 호출로 작업이 큐에 들어가게 되고 GPU는 해당 작업을 실행한다. GPU가 해당 작업을 끝냈는지는 이후 호출되는 WaitForPreviousFrame 함수에서 펜스로 확인한다.

### 3.3. Present()

```c++
// Present the frame. | 프레임을 화면에 표시한다.
ThrowIfFailed(m_swapChain->Present(1, 0));
```

스왑체인의 현재 백 버퍼를 화면에 표시해 달라고 DXGI에 요청하는 함수이다. 첫 번째 인자인 1은 SyncInterval 로 모니터의 갱신 시점에 맞춰 프레임을 표시하도록 한다는 것이고, 두번째 인자는 Flags 값으로 화면 표시 요청에 적용할 추가 옵션이다. 0은 기본 표시 동작을 뜻한다.

해당 요청이 성공하면 스왑체인은 내부적으로 다음에 그릴 버퍼로 넘어간다. 앞서 언급했던 스왑체인의 GetCurrentBackBufferIndex 함수가 반환하는 현재 백버퍼의 인덱스가 이때 갱신되어진다.

### 3.4. WaitForPreviousFrame()

방금 제출한 프레임의 GPU 작업이 끝났는지 확인하고, 다음에 그릴 백 버퍼 번호를 가녀오는 함수이다. OnRender()에서 Present() 호출 바로 뒤에 호출되므로 PreviousFrame은 방금 제출한 프레임을 의미한다.

```c++
const UINT64 fence = m_fenceValue;
ThrowIfFailed(m_commandQueue->Signal(m_fence.Get(), fence));
m_fenceValue++;
```

첫 프레임에서는 펜스의 객체 완료 값이 0이고 프로그램이 사용할 첫 목표값인 m\_fenceValue는 1이다. 이때 로컬변수로 선언된 fence에 목표값인 m\_fenceValue를 저장한다. 그리고 해당 값을 현재 펜스객체와 함께 명령큐의 Signal 함수의 인자로 보낸다.

이때 Signal함수의 경우 앞서 제출한 큐 작업이 끝나면 지정된 목표값을 펜스 객체에 기록한다. 해당 함수 역히 명령큐에 작업이 추가되기 때문에 CPU가 해당 라인을 실행하는 순간 GPU가 아직 작업중이라면 펜스의 완료값은 여전히 목표값으로 갱신이 되어있지 않을 수 있다.

Signal 함수를 호출한 후 펜스의 목표값을 하나 증가시킨다.

```c++
if (m_fence->GetCompletedValue() < fence)
{
    ThrowIfFailed(m_fence->SetEventOnCompletion(fence, m_fenceEvent));
    WaitForSingleObject(m_fenceEvent, INFINITE);
}
```

펜스 객체의 CompletedValue 값과 목표값을 비교해 펜스 객체의 현제 CompletedValue가 목표값에 도달하지 못했다면 펜스의 OnCompletion 이벤트를 등록하고 WaitForSingleObject로 대기상태에 들아간다. INFINITE로 시간제한 없이 기다리는 로직이다. 이렇게 대기중이다가 Completion 이벤트 신호가 오게되면 대기가 끝나고 다음 로직이 실행된다.

```c++
m_frameIndex = m_swapChain->GetCurrentBackBufferIndex();
```

스왑 체인에 다음에 그릴 백버퍼 인덱스를 요청해 m\_frameIndex에 저장한다. 다음 프레임의 OnRender 함수가 기준으로 잡을 인덱스가 여기서 대기모드가 풀리면서 결정되어진다.

## 4. OnDestroy()

창이 닫힌 뒤 GPU가 사용하던 리소스를 안전하게 정리하는 작업을 담당한다.

바로 위에서 설명했던 WaitForPreviousFrame() 함수가 한번더 호출되어 GPU가 여전히 백버퍼에 색을 칠하거나 명령 할당자에 기록된 명령을 실행 중이라면, 대기상태에 들어가 GPU 작업이 끝날때까지 기다린다.

그리고 CloseHandle 함수를 사용해 생성 했던 펜스 이벤트 핸들도 닫아준다.

GPU 작업 완료 확인 → 이벤트 핸들 닫기 → 프로젝트 소멸

