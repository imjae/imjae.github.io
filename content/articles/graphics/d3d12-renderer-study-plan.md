---
title: "D3D12 Renderer 공부 계획서"
description: "Direct3D 12 렌더러를 직접 구현하기 위한 단계별 일정, Microsoft 샘플 읽기 순서, 프레임 동기화와 인스턴싱 측정 계획입니다."
slug: "d3d12-renderer-study-plan"
date: "2026-11-24"
topic: "graphics"
kind: "devlog"
tags: ["Direct3D 12", "C++", "HLSL"]
project: "d3d12-renderer"
draft: false
---

C++과 HLSL로 Windows용 Direct3D 12 렌더러를 처음부터 직접 구현합니다. 바닥과 기둥으로 테스트 장면을 만들고, 카메라를 움직이며 방향광과 그림자를 확인할 수 있게 구성합니다. 같은 장면에서 프레임 동기화 방식과 기둥을 그리는 방식을 바꿔 CPU 대기 시간과 명령 기록 시간을 비교합니다.

- **구현 기간**은 2026년 11월 24일부터 12월 18일까지 총 150시간입니다.
- **하루 6시간**을 샘플 읽기 1시간 30분, 구현 3시간 30분, 검증과 기록 1시간으로 배분합니다.
- **제출 목표일**은 12월 18일입니다. 개인 일정으로 12월 19~20일에 예비 시간 12시간을 둡니다.

펄어비스 게임 엔진 프로그래머 지원을 준비하며 작성한 계획입니다. 공고는 채용 완료 시 마감하며 관련 경력 2년 이상을 필수로 명시합니다. [펄어비스 공식 채용 공고](https://www.pearlabyss.com/ko-KR/Company/Careers/detail?_jobOpeningNo=6)

## 개발 방식과 코드 구조

AI 바이브 코딩 없이 설계, 구현, 디버깅을 직접 합니다. AI는 개념 설명, 코드 읽기, 디버깅 질문과 리뷰에 활용합니다. Microsoft 샘플에서 API 호출 순서를 살펴보고, 새 솔루션에서 디바이스, 명령 큐, 스왑 체인과 RTV를 직접 구성합니다. Win32 창 생성이나 메시지 처리 코드 일부를 가져올 경우 원본 저작권 표시와 MIT 라이선스를 유지하고 README에 재사용 범위를 기록합니다. [Microsoft DirectX Graphics Samples](https://github.com/microsoft/DirectX-Graphics-Samples)

| 구성 | 책임 |
| --- | --- |
| `Win32Application` | 창을 만들고 메시지 루프, 입력, 시간을 처리합니다. 렌더러 초기화에 `HWND`를 전달합니다. |
| `D3D12Renderer` | 디바이스, 명령 큐, 스왑 체인과 렌더링 리소스를 관리합니다. `Initialize`, `Render`, `Shutdown`으로 프레임 기록과 제출을 연결합니다. |
| `Scene` | 카메라, 방향광, 기둥의 위치·회전·색상 등 CPU 쪽 장면 데이터를 관리합니다. |
| `FrameResource` | 프레임별 Command Allocator, 상수 및 인스턴스 데이터 영역, 마지막 제출의 Fence 값을 보관합니다. 렌더러 내부 구조체로 시작합니다. |

처음에는 창과 렌더러로 배경색을 표시합니다. 카메라와 여러 물체를 추가할 때 `Scene`을 만들고, 여러 프레임을 처리할 때 `FrameResource`를 도입합니다. 프레임 리소스를 재사용할 때는 해당 Fence가 완료된 뒤 Command Allocator를 재설정하고 GPU가 읽는 버퍼 영역을 갱신합니다. [Microsoft Command Allocator 문서](https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-id3d12commandallocator-reset)

## 단계별 학습과 구현

### 11월 24~26일 · 18시간 · 첫 프레임

- **읽을 코드**는 `HelloWindow`의 `OnRender`와 `PopulateCommandList`, `HelloTriangle`의 `LoadAssets`와 `VSMain`입니다. 명령 기록, 큐 제출, `Present` 순서를 따라갑니다.
- **완료 기준**은 새 솔루션에서 배경색, 삼각형, 인덱스 버퍼를 사용한 사각형을 순서대로 띄우는 것입니다.

### 11월 27~30일 · 24시간 · 카메라와 방향광

- **읽을 코드**는 `HelloConstBuffers`의 CBV 생성과 갱신, `D3D12DynamicIndexing`의 깊이 버퍼 생성과 바인딩입니다.
- **완료 기준**은 월드·뷰·투영 변환으로 바닥과 기둥을 배치하고 카메라 조작, 깊이 테스트, 방향광을 적용하는 것입니다. 그리기 순서를 바꿔도 앞쪽 물체가 뒤쪽 물체를 가리는지 확인합니다.

### 12월 1~4일 · 24시간 · 프레임 동기화

- **읽을 코드**는 `HelloTriangle::WaitForPreviousFrame`과 `HelloFrameBuffering::MoveToNextFrame`입니다.
- **완료 기준**은 프레임 리소스 두 개로 매 프레임 GPU 완료를 기다리는 방식과 리소스 재사용 시점에만 기다리는 방식을 구현하는 것입니다. 두 모드의 화면이 같고 D3D12 Debug Layer에서 동기화 오류가 발생하지 않는지 확인합니다.

### 12월 5~8일 · 24시간 · 인스턴싱

- **읽을 코드**는 `D3D12DynamicIndexing`의 반복 draw와 `DrawIndexedInstanced`의 `InstanceCount`, `StartInstanceLocation`입니다.
- **완료 기준**은 같은 메시, 셰이더, 인스턴스 데이터를 사용해 기둥을 한 개씩 그리는 경로와 한 번에 그리는 경로를 구현하는 것입니다. 화면이 같고 기둥의 draw call 수가 달라지는지 확인합니다.

### 12월 9~13일 · 30시간 · 그림자

- **읽을 코드**는 `D3D12Multithreading`의 그림자 텍스처 DSV·SRV, 리소스 상태 전환과 HLSL 깊이 비교입니다.
- **완료 기준**은 방향광의 깊이 패스와 카메라 패스를 연결해 기둥의 그림자를 바닥에 표시하고, 전체 장면에 적용한 뒤 그림자 켜기·끄기를 추가하는 것입니다.
- **12월 11일 점검**에서 기둥 하나의 그림자가 안정적으로 표시되면 전체 장면에 적용합니다. 불안정하면 방향광 장면으로 제출 범위를 확정하고 인스턴싱 비교와 빌드 재현성에 시간을 배정합니다.

### 12월 14~15일 · 12시간 · 성능 측정

Release 빌드에서 두 성능 비교를 반복하고, 가능하면 PIX 타임라인을 확보합니다. 측정 조건, 결과, 해석을 표로 정리하면 완료입니다.

### 12월 16~18일 · 18시간 · 제출 준비

새 폴더에 저장소를 클론해 빌드하고 실행합니다. README, 1분 데모 영상, 성능 비교표를 준비해 제출합니다.

### 12월 19~20일 · 예비 12시간

빌드나 제출 링크에서 발견된 문제를 수정하고, 최종 제출물에 접근해 실행할 수 있는지 확인합니다.

## 성능 비교와 제출물

| 비교 항목 | 바꿀 조건 | 기록할 값 |
| --- | --- | --- |
| 프레임 동기화 | 매 프레임 대기 / 프레임 리소스 재사용 시 대기 | CPU의 Fence 대기 시간, 프레임 시간 |
| 인스턴싱 | 기둥을 한 개씩 그리기 / 한 번에 그리기 | 기둥의 draw call 수, CPU 명령 기록 시간 |

두 실험에서 같은 GPU, 장면, 카메라, 해상도, VSync와 그림자 설정을 유지합니다. 비교 조건은 한 번에 하나만 바꾸고 워밍업 후 반복 측정합니다. 차이가 작아도 관측한 수치와 측정 조건을 그대로 기록합니다. [Microsoft PIX 타이밍 캡처](https://learn.microsoft.com/en-us/windows/win32/direct3dtools/pix/articles/timing-captures/pix-timing-captures)

- **README**에는 스크린샷, 빌드·실행 방법, 샘플 재사용 범위와 직접 구현한 부분, 프레임 동기화 흐름과 성능 비교표를 담습니다.
- **1분 데모**는 장면과 그림자, draw call 변화, 측정 결과 순서로 보여줍니다.
- **후속 글**에는 구현 중 겪은 문제 하나를 증상, 원인, 수정, 검증 순으로 기록합니다.

## 참고 자료

- 초기화, 삼각형, 상수 버퍼, 프레임 버퍼링 예제는 Microsoft 샘플 안내에서 볼 수 있습니다. [Direct3D 12 Hello, World! 샘플](https://learn.microsoft.com/en-us/samples/microsoft/directx-graphics-samples/d3d12-hello-world-samples-win32/)
- 인스턴스 수와 시작 인덱스는 API 문서를 참고합니다. [DrawIndexedInstanced](https://learn.microsoft.com/en-us/windows/win32/api/d3d12/nf-d3d12-id3d12graphicscommandlist-drawindexedinstanced)

[← D3D12 Renderer 포트폴리오](/portfolio/d3d12-renderer/)
