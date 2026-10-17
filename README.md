# imjae Dev Notes

게임 개발과 학습 내용을 정리하는 기술 블로그입니다.

- 블로그: https://imjae.github.io/
- 포트폴리오 입구: https://imjae.github.io/portfolio/dcb/
- 구성: Astro 정적 사이트, Markdown 콘텐츠, GitHub Pages 자동 배포.
- 요구 환경: Node.js 24 이상. Ruby와 Jekyll 설치는 필요하지 않습니다.

Codex 프로젝트에서 작업을 이어갈 때는 [블로그 관리 인수인계](docs/HANDOFF.md)를 먼저 읽습니다. 현재 구성, 글 목록, 작성 지침과 남은 확인 사항을 정리했습니다.

## 글 작성

웹에서는 [수정 모드](https://imjae.github.io/editor/)에서 새 글을 만들거나 기존 글의 수정·삭제 화면을 엽니다. GitHub 로그인 후 **Commit changes**로 저장하며, `main`에 저장하면 검증·빌드 후 배포합니다. 초안은 GitHub의 파일 목록에서 관리합니다.

로컬에서 작성하려면 다음 명령을 사용합니다.

```sh
npm ci
npm run new -- --title "물의 깊이와 지형 접점" --slug water-contact --topic graphics --kind case-study --project dcb --series dcb
npm run dev
```

생성한 `content/articles/graphics/water-contact.md`를 편집합니다. 로컬 미리보기에는 초안도 표시됩니다. 본문·설명을 완성하고 `draft: false`로 바꾸면 공개 대상이 됩니다. `main`에 push하면 검증·빌드 후 배포합니다.

| 분류 | 저장 폴더 | 내용 |
| --- | --- | --- |
| 게임플레이 | `content/articles/gameplay/` | 이동·IK·전투·상호작용 |
| 그래픽스 | `content/articles/graphics/` | 셰이더·물·불·VFX·성능 |
| 도구와 구조 | `content/articles/tools/` | 장비 조합·데이터·저작 도구 |
| AI 협업 | `content/articles/ai/` | 요구사항·후보 비교·검증 |
| 학습 메모 | `content/articles/notes/` | 학습·읽기·짧은 기록 |
| 수학 | `content/articles/math/` | 수·함수·벡터·행렬·회전과 수치 예제 |

문체와 표현 기준은 [문구 작성 지침](docs/EDITORIAL.md), 세부 작업 순서는 [글쓰기 가이드](docs/WRITING.md), 이전 구조와 배포 정보는 [이관 기록](docs/MIGRATION.md)을 참고합니다.

## 확인과 배포

```sh
npm run verify
npm run preview
```

검증에는 글 생성·원문 보존 검사, 타입 검사, 실제 정적 빌드, 내부 링크·공개 상태·예전 URL 검사가 포함됩니다. GitHub Pages 설정의 Source는 **GitHub Actions**입니다. API 자격 증명 없이 `main` push로 배포합니다.

원본 Jekyll 소스와 글은 `legacy/jekyll/`에 보존합니다. 기존 자산은 `public/assets/`로 옮겨 URL을 유지합니다. 원본 테마의 라이선스는 `LICENSE.txt`에 남아 있습니다.
