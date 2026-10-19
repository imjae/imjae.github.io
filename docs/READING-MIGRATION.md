# 노션 독서 기록 이관

2026년 10월 20일 확인한 독서 폴더·독서 데이터베이스와 Clean Code·C#·게임수학의 책 기록을 Reading으로 묶었다. 30권 중 독서·관람 메모는 8편(기존 글 보완 1편, 새 글 7편)이고, 감상 미작성 목록은 22권이다. 아래 날짜는 확인한 원문 생성일이며 완독일이 아니다.

## 날짜와 중복 처리

- 일반 페이지는 Notion의 `created_date_range`를 좁힌 뒤 시작일과 종료일을 같은 날로 조회해 해당 페이지 자체가 나오는지 확인했다. 마지막 수정일은 사용하지 않았다.
- 독서 데이터베이스 두 항목은 `createdTime`의 UTC 시각을 확보해 한국 날짜로 변환했다. 「죄와벌 2」의 `2021-03-24T23:39:05Z`는 2021-03-25다.
- 여러 장을 묶은 글은 실제 내용을 옮긴 중심 원문의 생성일을 사용한다. 책 목차를 먼저 만들었다는 이유만으로 목차 날짜를 독후감 작성일로 쓰지 않는다.
- 「시지프 신화」는 2024-02-23의 기존 글과 주소·Jekyll 원문을 보존했다. 노션 생성일 2023-09-22는 보완 내용의 출처로 별도 기록했다.
- 「죄와벌 2」와 「죄와벌(1~3)」은 「죄와 벌」 하나로 합쳤다. 별점은 원문에 기록한 5/5를 보존하되 예시 페이지 수를 완독 증거로 사용하지 않았다.
- 「눈물을 마시는 새」의 감상은 책 페이지가 아니라 「고도를 기다리며」 관람기에 있었다. 해당 부분을 책별로 모으고 연결했다.
- 저자가 없던 항목은 빈칸을 유지했다. 목록만으로 독서 완료나 감상을 추정하지 않았다. 샘플 제목·빈 항목·작성 템플릿은 제외했다.

## 책별 결과

| 책 | 처리 | 날짜 | 파일 |
| --- | --- | --- | --- |
| 시지프 신화 | 기존 글에 합침 | 2024-02-23 (기존 글) | [the-myth-of-sisyphus](../content/articles/reading/the-myth-of-sisyphus.md) |
| 비극의 탄생 | 독서·관람 메모 | 2024-01-09 | [the-birth-of-tragedy](../content/articles/reading/the-birth-of-tragedy.md) |
| 3부작 | 독서·관람 메모 | 2023-10-26 | [trilogy](../content/articles/reading/trilogy.md) |
| 고도를 기다리며 (연극 관람) | 독서·관람 메모 | 2023-12-24 | [waiting-for-godot](../content/articles/reading/waiting-for-godot.md) |
| 변신, 시골의사 | 독서·관람 메모 | 2024-08-01 | [kafka-short-stories](../content/articles/reading/kafka-short-stories.md) |
| 아가멤논 | 독서·관람 메모 | 2023-03-23 | [agamemnon](../content/articles/reading/agamemnon.md) |
| Clean Code | 독서·관람 메모 | 2022-10-17 | [clean-code](../content/articles/reading/clean-code.md) |
| 눈물을 마시는 새 1~4 | 독서·관람 메모 | 2023-12-24 | [the-bird-that-drinks-tears](../content/articles/reading/the-bird-that-drinks-tears.md) |
| 이 사람을 보라 | 감상 미작성 목록 | 2023-02-23 | [ecce-homo](../content/reading-list/ecce-homo.json) |
| 선악의 저편 | 감상 미작성 목록 | 2023-06-01 | [beyond-good-and-evil](../content/reading-list/beyond-good-and-evil.json) |
| 호밀밭의 파수꾼 | 감상 미작성 목록 | 2023-09-14 | [the-catcher-in-the-rye](../content/reading-list/the-catcher-in-the-rye.json) |
| 이방인 | 감상 미작성 목록 | 2023-09-14 | [the-stranger](../content/reading-list/the-stranger.json) |
| 죄와 벌 | 감상 미작성 목록 | 2021-03-25 | [crime-and-punishment](../content/reading-list/crime-and-punishment.json) |
| 카라마조프가의 형제들 | 감상 미작성 목록 | 2024-08-01 | [the-brothers-karamazov](../content/reading-list/the-brothers-karamazov.json) |
| 가난한 사람들 | 감상 미작성 목록 | 2024-11-22 | [poor-folk](../content/reading-list/poor-folk.json) |
| 노인과 바다 | 감상 미작성 목록 | 2024-11-22 | [the-old-man-and-the-sea](../content/reading-list/the-old-man-and-the-sea.json) |
| 이토록 아름다운 세상에서 | 감상 미작성 목록 | 2023-05-01 | [in-this-beautiful-world](../content/reading-list/in-this-beautiful-world.json) |
| 홍학의 자리 | 감상 미작성 목록 | 2023-05-01 | [the-flamingos-place](../content/reading-list/the-flamingos-place.json) |
| 삼체 1~3부 | 감상 미작성 목록 | 2026-04-10 | [the-three-body-problem](../content/reading-list/the-three-body-problem.json) |
| 프로젝트 헤일메리 | 감상 미작성 목록 | 2026-04-10 | [project-hail-mary](../content/reading-list/project-hail-mary.json) |
| 젊은 날의 초상 | 감상 미작성 목록 | 2026-04-10 | [portrait-of-young-days](../content/reading-list/portrait-of-young-days.json) |
| 제주를 바치는 여인들 | 감상 미작성 목록 | 2023-03-23 | [the-libation-bearers](../content/reading-list/the-libation-bearers.json) |
| 에우메니데스 | 감상 미작성 목록 | 2023-03-23 | [eumenides](../content/reading-list/eumenides.json) |
| 탄원하는 여인들 | 감상 미작성 목록 | 2023-04-26 | [the-suppliants](../content/reading-list/the-suppliants.json) |
| 사슬에 묶인 프로메테우스 | 감상 미작성 목록 | 2023-04-26 | [prometheus-bound](../content/reading-list/prometheus-bound.json) |
| 페르시아 사람들 | 감상 미작성 목록 | 2023-06-14 | [the-persians](../content/reading-list/the-persians.json) |
| 테베 공격 일곱 장군 | 감상 미작성 목록 | 2023-09-14 | [seven-against-thebes](../content/reading-list/seven-against-thebes.json) |
| 자기관리론 | 감상 미작성 목록 | 2021-02-15 | [how-to-stop-worrying-and-start-living](../content/reading-list/how-to-stop-worrying-and-start-living.json) |
| C#을 다루는 기술 | 감상 미작성 목록 | 2022-01-18 | [csharp-in-depth](../content/reading-list/csharp-in-depth.json) |
| 이득우의 게임수학 | 감상 미작성 목록 | 2022-10-01 | [lee-deukwoo-game-math](../content/reading-list/lee-deukwoo-game-math.json) |

원문별 생성일·중심 원문 선택·중복 연결은 [근거 데이터](READING-MIGRATION.json)에 저장했다. 원본 Notion은 수정하지 않았으며 책의 긴 번역문·원본 코드·이미지와 개인 동선은 옮기지 않았다. C#·게임수학의 장별 기술 개념을 새 독후감으로 복제하지 않고, 책 목록과 원문 연결을 이관했다. 기존 수학·자료구조 글은 해당 주제에 유지한다. 서지 정보가 확인되지 않은 ‘알고리즘 문제해결’·‘유니티 그래픽스 최적화’ 폴더는 별도 책으로 단정하지 않았다.

## 표시와 후속 작성

실제 글은 `content/articles/reading/`에, 제목만 있는 책은 `content/reading-list/`에 둔다. 감상이 없는 책은 Reading 목록에서 ‘감상 미작성’과 ‘감상 남기기’를 표시하고 빈 본문 페이지를 만들지 않는다. 새 감상을 같은 slug로 게시하면 목록 항목을 대체한다. Writing과 RSS에는 실제 글만 들어간다.
