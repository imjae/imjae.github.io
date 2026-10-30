# Games 표지

앨범의 이름은 DCB, 도형 공방, 던전 탐사로 정했다. 도형 공방과 던전 탐사는 사용자가 설명한 기획을 구분하기 위한 간단한 제목이며, 게임의 완성도나 세부 규칙을 뜻하지 않는다.

| 게임 | 사용 파일 | 출처 |
| --- | --- | --- |
| DCB | `public/media/games/dcb.webp` | 기존 공개 이미지 `src/assets/home/dcb-shrine.png`의 4:3 크롭. 실제 개발 화면이며 외부·재사용 자산이 포함된 프로젝트의 장면이다. |
| 도형 공방 | `public/media/games/shape-workshop.webp` | 내장 imagegen으로 만든 콘셉트 표지. 실제 게임 화면이 아니다. |
| 던전 탐사 | `public/media/games/dungeon-exploration.webp` | 내장 imagegen으로 만든 콘셉트 표지. 실제 게임 화면이 아니다. |

생성일: 2026-10-30. CLI나 외부 이미지 검색 없이 내장 imagegen을 사용했다. 생성한 두 이미지는 960×720 WebP로 변환했다. 상세 진입 화면의 캡션과 이미지 대체 텍스트에도 출처를 구분한다. 기획 본문·캐릭터·플레이 결과를 새로 만들지 않았다.

## 도형 공방 생성 프롬프트

```text
Use case: stylized-concept. Asset type: 4:3 landscape album cover for a game-in-development titled 도형 공방. Create a restrained editorial concept image about building shapes: a small group of flat, solid polygon tiles being fitted together into one larger irregular geometric figure, seen directly from above on a lightly textured pale stone-gray work surface. The geometry must be crisp and mathematically legible, with believable gentle contact shadows and matte material texture. Muted graphite, sage and a small clay-colored accent. Clear large forms that read well as a thumbnail. Carefully composed with some open space, sophisticated and quiet, minimal visual clutter. This is symbolic game concept cover art, not a screenshot or interface. No text, no logo, no UI, no numbers, no grid, no decorative border, no gradients or neon glow, no extra props or characters.
```

## 던전 탐사 생성 프롬프트

```text
Use case: stylized-concept. Asset type: 4:3 landscape album cover for a dungeon exploration game-in-development. Create a restrained atmospheric environment concept painting: a weathered stone arch and a short flight of worn steps descending into a quiet underground passage, a subtle warm light deeper inside giving a sense of space to explore. Medium-wide composition with one strong doorway silhouette; visible stone texture, simple shadow shapes, muted slate and earth tones. Understated painterly detail and natural light falloff, easy to read at thumbnail size. It is concept cover art, not a gameplay screenshot. No people, no monsters, no treasure spectacle, no text, no logos, no HUD, no border, no ornate fantasy ornament, no excessive fog, no neon, no dramatic magic effects.
```
