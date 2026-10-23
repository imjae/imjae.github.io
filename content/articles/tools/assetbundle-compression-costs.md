---
title: "AssetBundle 구조와 LZMA·LZ4의 로딩 비용 비교"
description: "다운로드 크기·캐시 파일·로드·에셋 추출·메모리를 나눠 압축 방식을 비교합니다. 동일 프리팹의 세 가지 빌드 예제와 실습·풀이를 제공합니다."
slug: "assetbundle-compression-costs"
date: "2023-08-24"
dateBasis: "notion"
updated: "2026-10-23"
topic: "tools"
kind: "note"
tags: ["Unity", "AssetBundle", "Compression", "Profiling"]
draft: false
---

## 작은 파일이 항상 빠르게 로드되는 것은 아닙니다

<div id="작은-파일이-항상-빠르게-로드되는-것은-아니다" aria-hidden="true" style="scroll-margin-top: 90px;"></div>

[에셋 번들 노트](https://app.notion.com/p/c1c544d92c454f0a885da23da70dc918)는 번들의 헤더·데이터와 압축을 다룹니다. 번들에는 에셋과 타입·의존성 정보를 읽기 위한 데이터가 있습니다. 번들 파일을 여는 비용과 그 안의 특정 에셋을 객체로 만드는 비용을 분리해서 봅니다.

LZMA는 파일 크기를 줄이는 데 유리할 수 있지만 사용 전 압축 해제 비용을 고려해야 합니다. LZ4 기반 chunk 압축은 필요한 블록을 읽는 접근과 관계있습니다. 무압축은 압축 해제 일을 줄이지만 읽어야 할 바이트가 커질 수 있습니다. 실제 우열은 I/O·CPU·캐시·콘텐츠에 따라 달라집니다. [Unity AssetBundle 압축 문서](https://docs.unity3d.com/6000.0/Documentation/Manual/AssetBundles-Cache.html)

## 같은 입력으로 세 번 빌드하기

새 실습 프로젝트의 `Assets/Study/Marker.prefab`을 사용합니다. 아래 `BundleStudy.cs`를 Editor 폴더에 둡니다. 산출물은 프로젝트 아래 StudyBundles에 생성하며 기존 산출물을 자동 삭제하지 않습니다. Unity 6 Editor API를 사용하는 예제입니다.

```csharp
using System.IO;
using UnityEditor;

public static class BundleStudy
{
    [MenuItem("Study/Build compression samples")]
    public static void Build()
    {
        var input = new[] { new AssetBundleBuild {
            assetBundleName = "marker",
            assetNames = new[] { "Assets/Study/Marker.prefab" }
        }};
        BuildOne("lzma", BuildAssetBundleOptions.None, input);
        BuildOne("lz4", BuildAssetBundleOptions.ChunkBasedCompression, input);
        BuildOne("raw", BuildAssetBundleOptions.UncompressedAssetBundle, input);
    }
    static void BuildOne(string name, BuildAssetBundleOptions option, AssetBundleBuild[] input)
    {
        string output = Path.Combine("StudyBundles", name);
        Directory.CreateDirectory(output);
        var manifest = BuildPipeline.BuildAssetBundles(output, input, option,
            EditorUserBuildSettings.activeBuildTarget);
        if (manifest == null) throw new System.InvalidOperationException("bundle build failed");
    }
}
```

기본 AssetBundle 압축을 사용하는 None, chunk 압축, 무압축을 같은 입력으로 비교합니다. Player용 BuildOptions.CompressWithLz4와는 다른 enum이며 같은 API의 인자가 아닙니다. [BuildAssetBundleOptions](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/BuildAssetBundleOptions.html)

## 측정하는 구간 나누기

| 구간 | 기록할 값 | 혼동하지 않을 대상 |
| --- | --- | --- |
| 배포 파일 | 바이트 수·해시 | 압축 해제 뒤 메모리 |
| 다운로드 | 전송량·시간·캐시 상태 | LoadAsset 시간 |
| 번들 열기 | LoadFromFileAsync 등의 시간 | Instantiate 시간 |
| 에셋 추출 | LoadAssetAsync 시간 | 번들 개수만의 비교 |
| 사용 종료 | 해제 순서·메모리 추이 | 즉시 해제라는 추측 |

웹 요청의 캐시를 쓰면 내려받은 LZMA가 캐시에서 LZ4로 재압축되는 경로도 있습니다. 그러면 두 번째 실행은 원본 다운로드 파일과 같은 조건이 아닙니다. 버전·해시를 사용하는 요청인지, 실제 캐시 저장 형식이 무엇인지 적습니다. [Unity의 번들 캐시 설명](https://docs.unity3d.com/6000.0/Documentation/Manual/assetbundles-caching.html)

## 실습과 풀이

1. 작은 프리팹 하나와 큰 텍스처 묶음을 각각 시험합니다. **풀이:** 동일 압축 옵션도 입력의 압축 가능성과 에셋 종류에 따라 크기·시간이 달라집니다. 한 샘플의 비율을 프로젝트 전체로 확대하지 않습니다.
2. 같은 파일을 두 번 엽니다. **풀이:** OS 파일 캐시와 Unity 캐시가 영향을 줄 수 있습니다. 첫 실행과 반복 실행을 분리하며 캐시 정리는 실습 전용 디렉터리에서 통제합니다. 실제 프로젝트 캐시를 임의 삭제하지 않습니다.
3. 번들을 합치면 언제나 유리한가요? **풀이:** 메타데이터 부담은 줄 수 있지만 다운로드·업데이트·해제 단위가 커집니다. 동시에 사용되는 에셋을 기준으로 설계하고 최대 상주량을 확인합니다.

설명과 예제 작성에 AI를 활용했습니다.

## 이어 읽기

[전체 글 목차](/writing/notion-study-reading-order/) · 다음 글: [Addressables 카탈로그 옵션을 줄이기 전에 확인할 것](/writing/addressables-catalog-key-options/)
