/** @type {Array<{id: string, title: string, description: string, planSlug: string, weeks: Array<{number: number, title: string, description: string, articleSlug?: string}>}>} */
export const studyCourses = [{
  id: 'unreal-cpp-engine',
  title: '언리얼 C++과 엔진 구조',
  description: 'C++ 객체 수명에서 UObject, 실행 흐름과 성능 분석까지 이어지는 12주 과정입니다.',
  planSlug: 'unreal-cpp-engine-12-week-plan',
  weeks: [
    { number: 1, title: 'C++ 객체와 메모리', description: '값과 참조, 객체 수명, RAII, 복사와 이동을 독립 예제로 확인합니다.', articleSlug: 'cpp-objects-memory-lifetime' },
    { number: 2, title: 'C++ 코드 구조와 컨테이너', description: '아이템 저장소를 만들며 소유권, 복사 비용과 헤더 의존성을 다룹니다.', articleSlug: 'cpp-code-structure-containers' },
    { number: 3, title: '빌드와 모듈', description: 'UBT·UHT·컴파일러의 역할과 모듈 의존성을 연결합니다.', articleSlug: 'unreal-build-modules' },
    { number: 4, title: 'UObject와 리플렉션', description: 'C++ 클래스, 블루프린트 기본값과 생성 코드의 관계를 살펴봅니다.', articleSlug: 'unreal-uobject-reflection' },
    { number: 5, title: '객체 수명과 GC', description: '참조 추적, EndPlay, Destroy와 메모리 정리 시점을 구분합니다.', articleSlug: 'unreal-object-lifetime-gc' },
    { number: 6, title: '게임 실행 구조', description: '레벨 전환과 Pawn 교체를 따라 객체의 유지·생성 범위를 확인합니다.' },
    { number: 7, title: '프레임과 이벤트', description: 'Tick·Timer·Delegate의 실행 순서와 해제 시점을 비교합니다.' },
    { number: 8, title: '에셋과 로딩', description: '동기·비동기 로딩과 요청 주체의 수명을 다룹니다.' },
    { number: 9, title: '데이터와 직렬화', description: '데이터 저장·복원과 필드 변경에 따른 호환성을 확인합니다.' },
    { number: 10, title: '입력과 이동 내부 구조', description: '입력부터 위치 변경까지 추적하고 짐 무게에 따른 이동속도를 구현합니다.' },
    { number: 11, title: '스레드와 실행 경계', description: '게임 스레드와 작업 스레드를 구분하고 계산 결과를 전달합니다.' },
    { number: 12, title: '프로파일링과 실제 적용', description: '작은 게임 기능을 구현하거나 개선하고 같은 조건에서 변경 전후를 측정합니다.' },
  ],
}];
