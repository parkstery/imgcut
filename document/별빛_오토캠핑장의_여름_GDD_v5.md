# 〈별빛 오토캠핑장의 여름〉 (Summer at Starlight Campsite)
## R-18 Ren'Py 비주얼 노벨 종합 기획·개발 설계서 v5.0 (빌드 직행 통합판)
작성일: 2026-10-20 · 문서 목적: **이 문서만으로 프레임워크 구축 → 시나리오 → 아트/사운드 → QA → 배포까지 즉시 착수 가능**

---

## v4.0 대비 보완·변경 로그 (Change Log)

| # | 항목 | v4.0 상태 | v5.0 보완 내용 |
|---|------|-----------|----------------|
| 1 | 19+ 나이 게이트 | 없음 | §2.1 스플래시 게이트 코드 신설 |
| 2 | 성인 콘텐츠 토글(수위 조절) | 없음 | §6.12 설정 연동 H-씬 스킵 패턴 신설 |
| 3 | 일일 결산(settlement) 로직 | 선언만 있음 | §6.4 실제 구현 코드 추가 |
| 4 | 이벤트 우선순위 충돌 해결 | 없음 | §3.4 디스패처 규칙 + §6.6 코드 |
| 5 | 갤러리/리플레이 | 개념만 | §6.8 전체 스크린 코드 |
| 6 | 단서 조합 UI | 개념만 | §6.7 조작 가능한 스크린 코드 |
| 7 | 단서 수량 | 5개 | **12개**로 확장 + 사전 표 (§3.5) |
| 8 | 스프라이트 시스템 | 파일 언급만 | §6.9 `layeredimage` 표정/복장 조합 시스템 |
| 9 | CG 차분 | 목록만 | §6.10 범용 Composite 스티칭 패턴 |
| 10 | 엔딩 매트릭스 | 부분 기술 | §5.6 전체 11종 조건표 |
| 11 | 배드 엔딩 플로우 | 요약 | 부록 E 3종 상세 |
| 12 | GUI 사양(팔레트/폰트/HUD) | 없음 | §9 전면 신설 |
| 13 | 배경/CG/오디오 에셋 총목록 | 부분 | §7.2, §8 전량 목록화 |
| 14 | 배포 플랫폼 요건 | 없음 | §10.3 체크리스트 (DLsite/itch.io/국내 인증) |
| 15 | Android 빌드 | 언급만 | §10.2 단계 정의 |
| 16 | 16주 로드맵 & 데모 범위 | 없음 | §10.4, §11 신설 |
| 17 | QA 테스트 매트릭스 | 없음 | §12 신설 |
| 18 | 라이팅 가이드(톤/수위 등급 L1~L4) | 없음 | §5.5 신설 |
| 19 | AI 이미지 생성 "필터 우회 프롬프트" | 수록됨 | **삭제 대체** → §7.5 합법 아트 파이프라인 (우회 기법은 상용 서비스 약관 위반·계정 제재·법적 리스크로 비수록) |
| 20 | 합의(Consent) 구조 설계 | 미명시 | §2.4 전 H-씬 필수 "합의 비트" 규칙 신설 (스토어 심사/명성 리스크 완화) |

> **명시 사항**: 등장인물 전원은 실존하지 않는 허구의 인물이며, 전원 19세 이상 성인이다.

---

# 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 타이틀 | 별빛 오토캠핑장의 여름 (Summer at Starlight Campsite) |
| 장르 | 성인 일상·서스펜스 미스터리 연애 시뮬 / 비주얼 노벨 (19+) |
| 엔진 | Ren'Py 8.x (배포 시점 최신 안정버전 고정) |
| 플랫폼 | PC(Windows/macOS/Linux) + Android APK |
| 등급 | 청소년 관람불가 (19+) |
| 해상도 | 1920×1080 (16:9) |
| 플레이 타임 | 1회차 10~14시간 / 전 분기 완주 30h+ |
| 음성 | 대사 보이스 선택 (무료), H-씬 호흡음 필수 |
| 로그라인 | 아버지의 캠핑장을 지키기 위해 내려온 대학생 '강서준'. 개성 넘치는 손님들과의 뜨거운 로맨스 뒤에, 도난 사건·다리 붕괴·가장 가까운 사람의 배신이라는 삼중 반전이 도사리고 있다. |

**핵심 컨셉 3축**
1. **(로맨스)** 개방적·고립된 한여름 캠핑장 = 자연스러운 노출·접촉·밀회가 성립하는 최적 무대
2. **(서스펜스)** "1개의 배신자 + 1개의 누명 + 1개의 고립" — 추리 단서가 연애 이벤트와 공존 (연애 이벤트 중 획득되는 단서가 다수)
3. **(반전)** 전 구간 '삼촌 = 보호자' 프레임 유지 → 4막 단일 대면 씬에서 무너짐

---

# 2. 콘텐츠 등급·컴플라이언스 정책

## 2.1 나이 게이트 (19+ Gate)
- 엔진 기동 최초 1회, `persistent`로 저장되어 이후 재문의 없음.
- 코드: §6.3 참조.
- 거부 시 앱 종료.

## 2.2 플랫폼별 요건

| 플랫폼 | 요건 | 작업 |
|--------|------|------|
| itch.io | 프로젝트 설정에서 "Adult content" 플래그 + 연령 확인 게이트 | 마크업 5분 |
| DLsite (일본) | **필수 모자이크 처리** (일본 관련 법규). BL/R18 카테고리 등록 | 일본판 H-CG 별도 모자이크 버전 패키징 필요 |
| Steam | 성인 콘텐츠 정책 위반 요소 사전 검토 (비취약성 원칙) | 18+ 콘텐츠 별도 DLC/패치 방식 |
| 자체 배포 | 19+ 확인 페이지 선행 표출 | 랜딩 페이지 제작 |
| 한국 국내 유통 | 청소년보호법상 성인 실명 인증 요건 검토 | 인증 시스템 연계 또는 국내 미유통 결정 |

## 2.3 콘텐츠 등급 표기 체계
문서·스크립트·리뷰 전 단계에서 라벨 통일:

| 라벨 | 정의 |
|------|------|
| L1 | 일상 대화·코미디 |
| L2 | 부유적 장면: 손해 코스 접점, 의상 비침, 심박 로맨스 |
| L3 | 노골적 전 직전 연출: 키스·포옹·은밀한 스킨십 |
| L4 | 본편 성인 장면 (R-18 CG + 호흡/신음 사운드) |

- H-씬 문서에는 대부분 등급이 명시되어 있으며, 스크립트 내 `label` 상단에 `# [L4]` 주석 고정.

## 2.4 합의 구조 (Consent Beat) — 전 H-씬 필수
- 모든 H-씬은 **"1) 유혹/정황 → 2) 명시적 의사 확인 대사 → 3) 본편 → 4) 시작 대화"** 4-비트 구조.
- 음주 상태의 관계 재판정 금지: 취한 씬은 반드시 "이미 소박한 합의(전날 약속 등)"가 선행되어야 하며, 본편 직전 '지금이 좋아?' 라인의 확인 대사 필수.
- "했/관음" 연출은 참여자 전원의 사전 합의가 대사로 존재해야 함 (3P 씬 §S-09).
- 비동의 연출(폭력·협박성 강압)은 연애 H-씬에서 배제. (스토커 상대 서사의 위협은 비성적 맥락으로 유지)

## 2.5 패치 전략
- **글로벌 모자이크 신경 쓸 필요 없음(R-18 전체 열림)** → "JP 모자이크 버전"만 존재.
- 배포 후 심사 거절 가능성 고려: **"성인 패치" 방식** 구조로 스크립트 상면에 분기 설계 (§6.12 참조).

---

# 3. 게임 시스템 설계

## 3.1 하루 루프 & 5-타임 스케줄러

```
[아침 08:00] → [낮 13:00] → [저녁 18:00] → [밤 21:00] → [심야 00:00] → [일일 결산]
   청소·인사      물놀이·탐색     바비큐·서빙      술자리·밀회      순찰·단서·H-Scene     평판 반영·취침
```

- 히로인별로 **"선호 시간대 우선"** 룰: 소율=낮, 서현=저녁, 하나&다은=저녁/밤, 언니 3인=밤, 태오=심야.
- 각 시간대에 **행동 1회** 실행 후 `advance_time()` → 다음 시간대. 5회 실행 시 일일 결산.

## 3.2 스탯 아키텍처

| 스탯 | 범위 | 증가 경로 | 감소 경로 | 게이팅 |
|------|------|-----------|-----------|--------|
| 호감도 (aff) | 0~100/캐릭터 | 선택지 +2~10, 이벤트 +5~15, 선물 +5 | 무시/냉정 선택 -2~5 | 80 이상 → L4 루트 진입 가능 |
| 성적 개방도 (lib) | 0~100/캐릭터 | L2~L3 스킨십 +3~8, H-씬 +20 | 시간 경과 미접촉 -1/일 | 60 이상 → H-CG 확장 차분 |
| 캠핑장 평판 (rep) | 0~100 (초기 80) | 관리 성공 +2~3 | 사건 미수습 -3~5 | 40 이하 → 배드 엔딩 강제 |
| 확신도 (suspicion) | 0~100 | 단서 획득 +8~15 | (감소 없음) | 100 도달 시 4막 대면 자동 트리거 |
| 이벤트 플래그 (flags) | dict | setflag() | - | 각종 분기 |

## 3.3 시간 이동 규칙
- 이동 가능 구역: 관리실 / A사이트(소율) / 글램핑(서현) / 계곡&샤워장(하나·다은) / 야외 평상(언니 3인) / 숲 가장자리(태오) / 농막(삼촌, 제한적)
- 시간대별 이동으로 사건 이벤트는 **1회성** (flag 기반으로 2회 재생 방지).
- 모든 이벤트 종료 후 `advance_time()` 필수.

## 3.4 이벤트 우선순위 규칙 (충돌 해결)
1線: **서사 마일스톤** (액트 강제 이벤트) — 최우선, 사용자 선택 불가로 발생.
2線: **단서 획득 이벤트** (심야 순찰 등.)
3線: **히로인 개인 이벤트** (호감도 임계 도달 시).
4선: **여유 이벤트** (기본 상호작용).

같은 시간대·같은 구역에 2개 이상 후보 시, `pick_event()` 함수(§6.6)가 우선순위로 지정.

## 3.5 단서 사전 (12종)

| ID | 명칭 | 획득처 | 서사적 의미 |
|----|------|--------|-------------|
| c_watch | 시계 파편 | Act1 심야, 계곡 하류 쓰레기 더미 순찰 | 도난 = "버림"의 기록 |
| c_backpack | 태오 배낭의 시계 | Act2 심야, 몰래 검색 (선택) | 누명의 근거물 |
| c_review_ip | 평점 테러 게시물 IP | Act2 낮, 관리실 PC 추적 | 외부 작성 → 사내 조직적 작업 의심 |
| c_boot | 진흙 찌든 작업 장화 | Act2., 농막 근처 흔적 관찰 | 삼촌 활동 추적 가능 |
| c_bridge_crack | 다리 균열 사진 | Act2., 다리 점검 중 자발 촬영 | 활동 판단 근거 |
| c_truck | 트럭의 진흙 패턴 | Act3 진입 직전, 타이어 흔적 정리 | 저녁 시점 귀가 모순 |
| c_debt | 농지 담보 서류 | Act3., 삼촌 부채 증서 (농협) | 빚→개발사 협력 동기 |
| c_photo | 다은의 연작 사진 | Act3, 다은 카메라 SD카드 | **[핵심1]** 장화 주인 정체 |
| c_dev_roster | 개발사 현장 공작 명단 | Act3, 서현 문건 | **[핵심2]** 삼촌 실명적 존재 |
| c_cancel_doc | 민원 취하 공문 | Act3, 도청 문서 or 지현 인맥 | **[핵심3]** 방치의 책임 |
| c_phone | 소율의 스토킹 문자 | Act1~2, 히로인 서브 전용 | 소율 루트 필수 (추리 무관) |
| c_plan | 리조트 개발 계획도 | Act3, 서현 진실 고백 | 4막 인연 조립에 필요 |

**추리 규칙**: 4막 진입 시, 보유 단서 중 3개를 증거로 제출. 정답 조합 = `{c_photo, c_dev_roster, c_cancel_doc}` (§6.7 코드).
- 성공 → 삼촌 자백 & 처우 선택.
- 1개 이상 누락 시 → 삼촌의 역공, 평판 붕괴 → 배드엔딩 [빼앗긴 별빛].

## 3.6 갤러리 & 리플레이
- CG 갤러리는 4×3 그리드, 잠금/해금 상태 저장 (`persistent.gallery_unlocked`).
- 시청 가능한 CG는 **Scene Viewer** (줌/토글 태그) 및 **Replay** (`Replay("label_name")`).
- H-CG = 배경 포함 전체 컷으로 촬용. 일반 이벤트 CG는 절반크기 (리플레이 지원).

## 3.7 세이브 / 롤백 정책
- 자동 세이브: 결산 직후 + 액트 전환 시.
- H-씬 진입 시 자동 세이브 슬롯 마킹(빠른 재접속을 위해).
- 롤백: 전체 허용(리플레이·갤러리 확장은 별도).
- H-씬 중 텍스트 스킵: **기본 OFF** (설정으로 켤 수 있음).
- 엔딩 이후 New Game 시 에필로그 스킵 허용.

---

# 4. 캐릭터 상세 프로필

## 4.0 주인공
**강서준 (24, 대학생·캠핑장 알바생→관리인)**
- 보이스 예시 톤: 낮은 남성 보이스, 확신 시엔 어질 语 기저, 확정 시엔 진지 톤.
- 스프라이트: 미표시(1인칭). CG에 부분 노출 (팔/가슴골/목 등).

## 4.1 한소율 (23, 히로인#1) — [순애/갭모에/의존]
- **외형**: 구릿빛 피부, 숏단발, 오버핏 후드티+핫팬츠, 글래머러스한 반전 몸매.
- **말투**: 밝고 보기 좋은 반말. "사장님 아들~". 긴장 시 존댓말로 풀어내는 힌트.
- **비밀**: 폭력적 전 남친(스토커)을 피해 도망침. 새벽 폰 진동에 얼듯 드나.
- **루트 테마**: 공포→안도 흐름을 야한 흥분으로 변환, 밀실·밀착 특화. 계곡 차박, 1인용 텐트(Act3), 관리실 (Act3 폭우).
- **CG 트리거 시기**: c_phone(스토커 문자) 관련 서브 이벤트 완결 → Act3 메인.
- 표정: normal/smile/embarrassed/angry/sad/surprise/cry/sultry (8종)
- 옷차림: casual/swim/rain/nightwear (4종)

## 4.2 윤서현 (31, 히로인#2) — [차도녀의 타락/주도권 역전]
- **외형**: 올림머리, 뿔테 안경, 린넨 셔츠+슬랙스. 수영복 차림 반전.
- **말투**: 조용한 존댓말, 냉소 톤. 무너질 때만 반말 섞힘. "위험한 재주가 있네요, 서준 씨."
- **비밀**: 이 캠핑장을 표적한 리조트 개발 프로젝트 담당자. 본사의 "지역 말살 후 헐값 매입" 방침에 환멸 느끼고 항명 → 좌천 → 잠적(불법 감장 취지).
- **루트 테마**: 와인의 무기력, 연하남에게 무너지는 상사. 체격 우위에 깔리는 고압 여성이 애절히 통제권을 내주는 구조. 조명 어두운 데크, 관리실 책상.
- 표정/옷차림: 동일 8종/4종 (glasses on/off × 란제리 자극차 변형)

## 4.3 하나 (24) & 4.4 다은 (24) — [관음/질투/3P]
- **하나**: 비키니 섹시한 인플루언서, 도발적. "아, 총각이 왔네." 다은의 질투 유도를 위해 서준을 농 дорж.
- **다은**: 긴 생머리, 조용한 사진가. 하나에게 감정적으로 의존하나 서준에게도 끌림. 카메라에 찍힌 장면들이 4막 단서의 결장적 증거.
- **루트 테마**: 하나가 서준∙다은 캠페인을 놓고 질투 화학 반응 → 샤워장·캠핑카 3P. 다은의 사진이 캠페인의 핵심 증거가 됨.
- 표정 8종×2인 / 옷차림 4종×2인

## 4.5 언니 라인: 차지현(33)·박민정(32)·노수아(32) — [농밀한 하렘]
- **차지현**: 이혼 후 여유. 전남편 = 개발사 핵심 임원 → 복수 여행 목적.
- **박민정**: 호탕한 주당. 밤마다 서준에게 고기를 챙겨주며 "술 안주" 감성.
- **노수아**: 술버릇 짓궂음, 서준의 몸을 만지며 감. 언니 라인 공격 포인트.
- **루트 테마**: 심야 바비큐 → 1:1 야외 밀회. 3인 전원 호감도 70+면 하렘 엔딩.

## 4.6 강태오 (35, 서브) — [조력자/누명→구원]
- 무뚝뚝한 거구, 전직 산악구조대원. Act2 누명 → Act3 정화. 폭우속 구조 이벤트 핵심 조력자.
- 연애 루트 없음 (우호 flag → 소율 스토커 해결에 필수).

## 4.7 삼촌 (45, 최종 빌런) — [심리적 빌런]
- 사람 좋은 미소/낡은 트럭. 농지 보증 → 개발사와 결탁.
- Act2 도난 자작극(누명), Act3 다리 방치. Act4 비닐하우스 최종 대면.
- **비밀**: 아버지가 그를 보증서줬다가 빚에 걸림 → 개발사 "형님 제손을 떨 수 있으면 빚 탕감+3배 대가" 제안.

---

# 5. 시나리오 구조

## 5.1 막별 플롯

```
[Act1 · 7/1~15] 평화와 유혹
   개장 → 손님 체크인 → 시계 분실 → 삼촌의 수상한 조언 → 태오 얼굴 인식
[Act2 · 7/16~31] 의심과 밀회
   평판 무드 원인 → 각 히로인 1호 H-Scene → 태오 배낭 검색(누명)
[Act3 · 8/1~15] 폭우·고립·불가피한 사실
   다리 붕괴 → 정전 → 삼촌의 모순적 합류 → 태오의 해명 → 서현 진실 고백
[Act4 · 8/16~31] 진실과 결말
   단서 조합 → 비닐하우스 대면 → 처우 선택 → 엔딩 분기
```

## 5.2 주간 이벤트 흐름 (label 트리)

```
start → act1_intro → camp_day_loop (맵)
         ├─ ev_intro_soyul (day1 낮, 사이트A)
         ├─ ev_intro_seohyeon (day2 저녁, 글램핑)
         ├─ ev_intro_girls (day3 낮, 샤워장)
         ├─ ev_intro_sisters (day4 밤, 평상)
         └─ ev_kill_shower_hana (L2) → act1_shutdown
camp_day_loop (2~9) → 액트1 이벤트 + 각 히로인 서브
       Act2 오픈: act2_intro → 도난 사건 → 강의 백프 → 액시가도
```

### 흐름 상세 (표)

| 시기 | 필수 이벤트 | 성격 | 분기 처리 |
|------|-------------|------|-----------|
| D1 | 체크인 일상·계약 설명 | L1 | 얀심 선택지 |
| D2~3 | 각자의 첫 상호작용 | L1~2 | 호감도 구축 |
| D4 | **시계 분실 발견** | 서스펜스 | rep -2 시작 |
| D5 | 삼촌이 태오 지목(유도) | 서스펜스 | 선택지로 태오 우호 결정 |
| D7~9 | (히로인별) L3 접점 | 로맨스 | aff 임계 |
| D10 | **Act2 개황** | 서스펜스 | flags.act2_on |
| D11~14 | 도난 재발→평판 조욱 | 서스펜스 | rep -3/day |
| D13~15 | 히로인들 첫 H | L4 | 개별 조건 |
| D16 | **태오 배낭 검색** | 전환점 | 검색 여부 flag |
| D17~20 | 서현 와인 씬, 언니 밀회, 등 | L3~4 | 각 분기 |
| D21~24 | 폭우→다리 붕괴 | 전환 | 정전 이벤트 |
| D25 | 태오 해명 | 던지기 | c_truck + c_debt 획득 |
| D26~28 | 각 라인 갱신·확대 | L3~4 | c_dev_roster 등 |
| D30 | **삼촌 대면** | 클라이맥스 | 단서 3종 검사 |
| D31+ | 엔딩 분기 | 다양 | 조건 표 |

## 5.3 H-Scene 배치표

| ID | 캐릭터 | 막·시간대 | 개방 조건 | 위치/세트 | 등급 | CG ID | 차분 |
|----|--------|-----------|-----------|-----------|------|-------|------|
| S-01 | 하나 | Act1 저녁 | 샤워 밸브 연결 자동 | 샤워장 | L2 | cg_hana_shower | 2 (수건/탈의) |
| S-02 | 소율 | Act2 심야 | aff≥60 & lib≥40 | 1인용 텐트 | L3→L4 | cg_soyul_h_tent | 4 |
| S-03 | 서현 | Act2 밤 | aff≥70 | 글램핑 데크(대면좌 위) | L4 | cg_seohyeon_deck | 4 |
| S-04 | 수아 | Act2 심야 | 언니 라인 진입 | 야외 인덕 텐트 | L4 | cg_sua_h_out | 3 |
| S-05 | 지현 | Act2 저녁 | 지현 이벤트 체인 | 어둠 속 길 | L3 | cg_jihyun_night | 2 |
| S-06 | 박민정 | Act2 밤 | 민정 이벤트 체인 | 캠프파이어 밤 | L3 | cg_mjeong_fire | 2 |
| S-07 | 소율 | Act3 밤 | **플롯 강제** | 관리실 밀착 텐트 | L4 | cg_soyul_h_rain | 6 |
| S-08 | 서현 | Act3 심야 | S-03 통과 | 정전 속 캠핑카 | L4 | cg_seohyeon_h_rain | 4 |
| S-09 | 하나+다은 | Act3 심야 | 두 인물 aff 합≥140 | 캠핑카 3P | L4 | cg_girls_h_3p | 6 |
| S-10 | 언니 3인(택1) | Act3 밤 | 언니 라인 진입 | 글램핑 회 텐트 | L4 | cg_sisters_h_night | 4 |
| S-11 | 소율 | Act4 에필로그 | 소율 트루 루트 | 관리실 침대 | L4 | cg_soyul_epilogue | 3 |
| S-12 | 서현 | Act4 에필로그 | 서현 트루 루트 | 사장실 책상 | L4 | cg_seohyeon_episode | 3 |
| S-13 | 하나+다은 | Act4 에필로그 | 루트 확정 | 새 텐트 | L4 | cg_girls_epilogue | 3 |
| S-14 | 언니 1명 | Act4 에필로그 | 언니 진입 | 하렘/단택 다양 | L4 | cg_sister_epilogue | 3 |

## 5.4 대사·라이팅 가이드

**기본 원칙**
1. 온다 **부장 갴드 3톤**: 소율=[활발 반말], 서현=[조용 존댓말], 하나=[도발 반말], 다은=[찰백/조잔… 어쩌고]. 
2. **H-씬 텍스트는 4-Beat 구조**: ① 정황+긴장 ② 지속적 합의 표시 ③ 본편 (페이즈 A→B→정점) ④ 여운 대화.
3. 수위는 **CG 생성 문구가 아닌 세계관 지그** 로 표시: "심장이 터질 것 같아" 같은 신체적 강한 야한 특정 표현은 안전 처리.
4. 손주인/손님 불균형 페어는 반드시'완전한 종속' 위치가 아닌 **가짜 테이프 트랜스포머** 로 유지.
5. **금지 사항**: 전 원부에서 사용 금지 — 폭력적 강압 언임, 현실 연지 인물 암시, 미성년 단어, 동물성 이해 문구 등.
6. 대사 필드 톤: "**각각의 히로인 루트는 '내가 오기를 기다렸다' 의 관능**을 유지. 조우 연기 하나로 서로 진심을 표현 가능하도록."

## 5.5 엔딩 매트릭스 (11종)

| 엔딩 ID | 분류 | 조건 | 요약 | 해금 CG |
|---------|------|------|------|---------|
| E_true_soyul | 트루 | aff≥80 & lib≥60 & c_phone완료 & 태오 우호 & 삼촌 처치 | 스토커 체포 → 관리실 동거 선언 | S-11 |
| E_true_seohyeon | 트루 | aff≥80 & lib≥60 & c_dev_roster & c_plan | 퇴사 → 공동 대표 나눔 | S-12 |
| E_true_girls | 트루 | 하나·다은 각 aff≥70 & S-09 실행 | 3각 관계 성립 | S-13 |
| E_true_sisters | 트루 | 언니 3인 각 aff≥70 | 사자 순녀 사짜 직권 획득 구조 | S-14 |
| E_norm_soyul | 노멀 | soyul aff 60~79 | 8월을 맞으며 결별 걸림(+에필로그) | - |
| E_norm_seohyeon | 노멀 | seohyeon aff 60~79 | 퇴근고 사무국 적음 | - |
| E_norm_girls | 노멀 | 총 패 원거리 | 나중 당시의 이벤트 중단 | - |
| E_harem_sisters | 특별 | 언니 3인 aff 각≥80 | 정무 사정 1인조 2종 → 하렘 | - |
| E_uncle_prison | 삼촌-응징 | 대면 성공 + "처리" 선택 | 경찰 인계, 개발 계획 취소 | - |
| E_uncle_redemption | 삼촌-속죄 | 대면 성공 + "지식 선택" | 노동 지원, 캠프 복귀 | - |
| E_uncle_exile | 삼촌-추방 | 대면 성공 + "추방" 선택 | 영구 낙향 | - |

**배드 엔딩 (3종)**
| ID | 트리거 |
|----|--------|
| B_forsaken | rep ≤ 40 → 부모 강제 매각 |
| B_frameup | 단서 제시 실패 → 서준 해고 |
| B_lost | Act3 누군가를 구하지 못하면 → 비닐 없이 어떤 아무도 못 이루는 "여름."

---

# 6. Ren'Py 구현 설계 (실전 코드)

## 6.1 디렉토리 구조

```
starlight_camp/
├── game/
│   ├── audio/
│   │   ├── bgm/          (12종)
│   │   ├── sfx/          (24종)
│   │   └── voice/        (선택, 히로인 연출음)
│   ├── fonts/            (NanumSquareNeo, Pretendard)
│   ├── images/
│   │   ├── bg/           (배경 26종 + 변형)
│   │   ├── sprites/      (스프라이트 레이어)
│   │   ├── cg/           (일반 CG 10종)
│   │   ├── h_cg/         (R-18 CG 14종 + 차분 레이어)
│   │   └── fx/           (rain, steam, lightning 등 오버레이)
│   ├── gui/              (UI 텍스처, 맵 아이콘)
│   ├── 00_init_vars.rpy
│   ├── 01_splash_gate.rpy
│   ├── 02_dayloop.rpy
│   ├── 03_screen_map.rpy
│   ├── 04_event_dispatcher.rpy
│   ├── 05_clue_ui.rpy
│   ├── 06_gallery.rpy
│   ├── 07_layered_sprites.rpy
│   ├── 08_cg_composite.rpy
│   ├── 09_fx_library.rpy
│   ├── act1.rpy / act2.rpy / act3.rpy / act4.rpy
│   ├── endings.rpy
│   ├── badges_bad_endings.rpy
│   ├── options.rpy / screens.rpy / gui.rpy (엔진 기본)
│   └── scripts/guide (선택: 문서화 요약)
```

## 6.2 00_init_vars.rpy

```renpy
# =========================================================
# 00_init_vars.rpy — 전역 상수/상태
# =========================================================

# --- 캐릭터 정의 ---
define m    = Character("강서준", who_color="#7EC8E3")
define so   = Character("한소율", who_color="#FF8A80")
define se   = Character("윤서현", who_color="#B39DDB")
define ha   = Character("하나",   who_color="#FFD180")
define da   = Character("다은",   who_color="#80CBC4")
define ji   = Character("차지현", who_color="#F48FB1")
define mj   = Character("박민정", who_color="#AED581")
define su   = Character("노수아", who_color="#FFF176")
define ta   = Character("강태오", who_color="#90A4AE")
define un   = Character("박삼촌", who_color="#FFAB91")
define parent = Character("아버지(전화)", who_color="#CFD8DC")

# --- 시간 시스템 ---
define SLOT_NAMES = ("아침", "낮", "저녁", "밤", "심야")
default current_day = 1
default slot_idx    = 0

# --- 히로인 스탯 ---
default heroines = {
    "soyul":    {"name": "한소율", "aff": 0, "lib": 0},
    "seohyeon": {"name": "윤서현", "aff": 0, "lib": 0},
    "hana":     {"name": "하나",   "aff": 0, "lib": 0},
    "daeun":    {"name": "다은",   "aff": 0, "lib": 0},
    "jihyun":   {"name": "차지현", "aff": 0, "lib": 0},
    "minjeong": {"name": "박민정", "aff": 0, "lib": 0},
    "sua":      {"name": "노수아", "aff": 0, "lib": 0},
}

# --- 캠핑장 평판 / 확신도 ---
default camp_rep    = 80
default suspicion   = 0

# --- 단서 / 플래그 ---
default clues = {}
default flags = {}

default uncle_ending   = None
default picked_route   = None

# --- 갤러리 ---
default persistent.adult_ok       = False
default persistent.nsfw_enabled   = True
default persistent.gallery_unlocked = {}

# =========================================================
# Python 유틸리티
# =========================================================
init python:
    def gain(k, aff=0, lib=0):
        h = store.heroines[k]
        h["aff"] = max(0, min(100, h["aff"] + aff))
        h["lib"] = max(0, min(100, h["lib"] + lib))

    def aff_of(k):
        return store.heroines[k]["aff"]

    def rep(delta):
        store.camp_rep = max(0, min(100, store.camp_rep + delta))

    def flag(k):
        return store.flags.get(k, False)

    def setflag(k, v=True):
        store.flags[k] = v

    def unlock_cg(cgid):
        store.persistent.gallery_unlocked[cgid] = True

    def slot_name():
        return store.SLOT_NAMES[store.slot_idx]

    def pick_event(cands, fallback):
        """cands: [(priority, label, condition_bool), ...]"""
        ok = [c for c in cands if c[2]]
        if not ok:
            return fallback
        ok.sort(key=lambda c: -c[0])
        return ok[0][1]

    def toggle_nsfw():
        store.persistent.nsfw_enabled = not store.persistent.nsfw_enabled
```

## 6.3 01_splash_gate.rpy (19+ 게이트)

```renpy
label splashscreen:
    if persistent.adult_ok:
        return
    scene black with None
    show text "※ 본 게임은 성인(19세 이상) 전용 콘텐츠입니다.\n\n· 폭력성·선정성이 높은 표현이 포함되어 있습니다.\n· 모든 인물은 허구의 성인 캐릭터입니다.\n· 법적으로 미성년자여서는 구매·실행할 수 없습니다.\n\n성인이십니까?" at truecenter
    with dissolve
    menu:
        "네, 성인입니다.":
            $ persistent.adult_ok = True
            hide text with dissolve
            return
        "아니요.":
            $ renpy.quit()
    return

label start:
    jump act1_intro
```

## 6.4 02_dayloop.rpy (시간 이동 + 일일 결산)

```renpy
# ---------------------------------------------------------
# 시간 이동
# ---------------------------------------------------------
label advance_time:
    $ slot_idx += 1
    if slot_idx > 4:
        # 하루 종료
        $ slot_idx = 0
        $ current_day += 1
        jump day_settlement
    return

# ---------------------------------------------------------
# 일일 결산 — 실제 로직 구현
# ---------------------------------------------------------
label day_settlement:
    scene black with None
    python:
        # (1) 도난 미해수습 수피 적용
        if flag("stolen_case_on") and not flag("stolen_case_resolved"):
            rep(-3)
        # (2) 평판 반생 사유
        if flag("dissatisfied_guest_pending"):
            rep(-2); setflag("dissatisfied_guest_pending", False)
        # (3) 심단: 배드엔딩 강제
        if camp_rep <= 40:
            renpy.jump("bad_forsaken")
        # (4) 시간 진행
        if current_day >= 30:
            renpy.jump("act4_start")

        # (5) "단서 미수집 알림" 시간 안내
    # 연출: 별빛 시계 화면 페이드
    call screen day_transition
    jump camp_day_loop

screen day_transition():
    add "#0B1220"
    vbox at truecenter:
        text "[current_day]일차 종료" size 48 color "#F5C45E" bold True
        if camp_rep <= 50:
            text "평판 위험: [camp_rep]%" color "#E4572E"
    textbutton "다음 날로" action Return()
```

## 6.5 03_screen_map.rpy (포인트 앤 클릭 캠프 맵)

```renpy
label camp_day_loop:
    call screen camp_map

screen camp_map():
    tag menu
    modal True
    add "gui/map_bg.png"

    # 상단 HUD
    frame:
        xalign 0.5 ypos 20
        hbox spacing 40:
            text "[current_day]일차 · [slot_name()]" size 32 bold True color "#F5C45E"
            text "평판 [camp_rep]%" size 26

    # 구역 버튼
    imagebutton:
        idle "gui/map_btn_site_a.png" hover "gui/map_btn_site_a_h.png"
        xpos 300 ypos 540 focus_mask True
        tooltip "A 사이트 · 한소율"
        action Jump("loc_site_a")

    imagebutton:
        idle "gui/map_btn_glamp.png" hover "gui/map_btn_glamp_h.png"
        xpos 840 ypos 420 focus_mask True
        tooltip "글램핑 · 윤서현"
        action Jump("loc_glamping")

    imagebutton:
        idle "gui/map_btn_valley.png" hover "gui/map_btn_valley_h.png"
        xpos 1310 ypos 640 focus_mask True
        tooltip "계곡 및 샤워장 · 하나&다은"
        action Jump("loc_valley")

    imagebutton:
        idle "gui/map_btn_terrace.png" hover "gui/map_btn_terrace_h.png"
        xpos 600 ypos 760 focus_mask True
        tooltip "야외 평상 · 언니 3인"
        action Jump("loc_terrace")

    imagebutton:
        idle "gui/map_btn_forest.png" hover "gui/map_btn_forest_h.png"
        xpos 1560 ypos 380 focus_mask True
        tooltip "숲 가장자리 · 강태오"
        action Jump("loc_forest")

    imagebutton:
        idle "gui/map_btn_office.png" hover "gui/map_btn_office_h.png"
        xpos 120 ypos 300 focus_mask True
        tooltip "관리실"
        action Jump("loc_office")

    # 툴팁
    $ t = GetTooltip()
    if t:
        nearrect:
            focus "tooltip"
            prefer_top True
            frame:
                background Frame("gui/tip_frame.png", 8, 8)
                text "[t]" size 22 color "#FFFFFF"
```

## 6.6 04_event_dispatcher.rpy (이벤트 우선순위)

```renpy
# 구역 진입 시, 조건을 지나 "우선순위 높은 1개" 이벤트를 결정
label loc_site_a:
    $ nxt = pick_event([
        # (우선순위, label, 조건)
        (100, "ev_act1_siteA_intro",  current_day == 1 and not flag("ev_intro_soyul_done")),
        ( 90, "ev_soyul_day_event",   flag("ev_intro_soyul_done") and slot_idx == 1 and aff_of("soyul") >= 30),
        ( 80, "ev_soyul_sub_event",   flag("ev_intro_soyul_done") and current_day >= 5),
    ], "ev_idles_scene_soyul")

    $ setflag("ev_intro_soyul_done") if nxt == "ev_act1_siteA_intro" else None
    call expression nxt
    call advance_time
    jump camp_day_loop
```

## 6.7 05_clue_ui.rpy (단서 조합 미니게임)

```renpy
default clue_picks = []

define CLUE_DEFS = {
    "c_watch":      {"name": "시계 파편"},
    "c_backpack":   {"name": "태오 배낭의 시계"},
    "c_review_ip":  {"name": "평점 테러 IP 추적"},
    "c_boot":       {"name": "진흙 찌든 작업 장화"},
    "c_bridge_crack": {"name": "다리 균열 사진"},
    "c_truck":      {"name": "트럭의 진흙 패턴"},
    "c_debt":       {"name": "농지 담보 부채 서류"},
    "c_photo":      {"name": "다은의 연작 사진"},
    "c_dev_roster": {"name": "개발사 현장 공작 명단"},
    "c_cancel_doc": {"name": "민원 취하 공문"},
    "c_phone":      {"name": "스토킹 문자 화면"},
    "c_plan":       {"name": "리조트 개발 계획도"},
}

screen clue_picker():
    modal True
    vbox at truecenter:
        text "제출할 증거를 3개 선택하세요" size 30 bold True color "#F5C45E"

        for k in CLUE_DEFS:
            if clues.get(k):
                button:
                    action If(k in store.clue_picks,
                              true=Function(store.clue_picks.remove, k),
                              false=Function(store.clue_picks.append, k))
                    text ("✓ " if k in store.clue_picks else "□ ") + CLUE_DEFS[k]["name"] size 24
            else:
                text "[as难怪?] [CLUE_DEFS[k][name]]" size 24 color "#555"   # `미수립` 표기 방식 실제 작성 시 정정

        hbox:
            textbutton "제출하기" action Jump("clue_submit")
            textbutton "취소"     action Return()

label clue_confront:
    $ clue_picks = []
    call screen clue_picker
    jump resolution_flow

label clue_submit:
    $ picks = set(store.clue_picks)
    if {"c_photo", "c_dev_roster", "c_cancel_doc"}.issubset(picks) and len(picks) == 3:
        scene black with fade
        "삼촌의 무릎이 땅에 꿇렸다..."
        jump uncle_confrontation
    else:
        # 역공
        jump bad_frameup
```

## 6.8 06_gallery.rpy (CG 갤러리 + 리플레이)

```renpy
define CG_LIST = [
    # 일반 CG
    "cg_soyul_wet_event", "cg_seohyeon_wine", "cg_girls_shower_hint",
    "cg_sisters_party", "cg_bridge_night", "cg_taeo_rescue",
    # R-18 CG (label에 매핑)
    "cg_hana_shower", "cg_soyul_h_tent", "cg_seohyeon_deck",
    "cg_sua_h_out", "cg_jihyun_night", "cg_mjeong_fire",
    "cg_soyul_h_rain", "cg_seohyeon_h_rain", "cg_girls_h_3p", "cg_sisters_h_night"
]

# 각 CG에 대응하는 Replay 라벨
define CG_REPLAY = {
    "cg_hana_shower":       "replay_hana_shower",
    "cg_soyul_h_tent":      "replay_soyul_tent",
    "cg_seohyeon_deck":     "replay_seohyeon_deck",
    "cg_soyul_h_rain":      "replay_soyul_rain",
    "cg_seohyeon_h_rain":   "replay_seohyeon_rain",
    "cg_girls_h_3p":        "replay_girls_3p",
    "cg_sisters_h_night":   "replay_sisters_night",
}

default gallery_page = 0

screen cg_gallery():
    tag menu
    grid 4 3:
        for i in range(12):
            $ idx = store.gallery_page * 12 + i
            if idx < len(CG_LIST):
                $ g = CG_LIST[idx]
                $ unlocked = store.persistent.gallery_unlocked.get(g, False)
                if unlocked:
                    button:
                        foreground "thumbs/" + g + "_thb.png"
                        action Show("cg_viewer", asset=g, replay=CG_REPLAY.get(g, None))
                else:
                    frame:
                        add "gui/gallery_locked.png"
            else:
                frame:
                    background None

    hbox:
        xalign 0.5 yalign 1.0
        textbutton "<"   action If(store.gallery_page > 0, SetVariable("gallery_page", store.gallery_page - 1))
        textbutton "닫기" action SetVariable("selected_screen", None) Hide("cg_gallery")
        textbutton ">"   action If(store.gallery_page < ((len(CG_LIST) - 1) // 12), SetVariable("gallery_page", store.gallery_page + 1))

screen cg_viewer(asset="", replay=None):
    add "images/h_cg/" + asset + ".png" xalign 0.5 yalign 0.5
    key "dismiss" action Hide("cg_viewer")
    if replay is not None:
        textbutton "▶ 재생" action Replay(replay) xpos 40 ypos 40
```

## 6.9 07_layered_sprites.rpy (표정 × 복장 조합 스프라이트)

```renpy
# 전원동일 팩트: body / outfit / emotion 3레이어
layeredimage soyul:
    always:
        "images/sprites/soyul_body.png"
    group outfit:
        attribute casual default "images/sprites/soyul_o_casual.png"
        attribute swim   "images/sprites/soyul_o_swim.png"
        attribute rain   "images/sprites/soyul_o_rain.png"
        attribute night  "images/sprites/soyul_o_night.png"
    group emo:
        attribute e_normal default "images/sprites/soyul_e_normal.png"
        attribute e_smile    "images/sprites/soyul_e_smile.png"
        attribute e_embarrassed "images/sprites/soyul_e_emb.png"
        attribute e_angry    "images/sprites/soyul_e_angry.png"
        attribute e_sad      "images/sprites/soyul_e_sad.png"
        attribute e_surprise "images/sprites/soyul_e_surp.png"
        attribute e_cry      "images/sprites/soyul_e_cry.png"
        attribute e_sultry   "images/sprites/soyul_e_sultry.png"

# 사용 예시
# show soyul e_embarrassed swim with dissolve
```

## 6.10 08_cg_composite.rpy (런타임 CG 차분 합성)

```renpy
# H-CG 차분: 베이스 + 오버레이 레이어 런타임 합성
image cg_soyul_h_tent_phase_b = Composite(
    (1920, 1080),
    (0, 0), "images/h_cg/cg_soyul_h_tent_base.png",
    (0, 0), "images/h_cg/cg_soyul_h_tent_o_sweat.png",
    (0, 0), "images/h_cg/cg_soyul_h_tent_e_apex.png",
)
image cg_soyul_h_tent_phase_c = Composite(
    (1920, 1080),
    (0, 0), "images/h_cg/cg_soyul_h_tent_base.png",
    (0, 0), "images/h_cg/cg_soyul_h_tent_o_sweat.png",
    (0, 0), "images/h_cg/cg_soyul_h_tent_o_glow.png",
    (0, 0), "images/h_cg/cg_soyul_h_tent_e_flush.png",
)
```

## 6.11 09_fx_library.rpy (연각 팩트)

```renpy
# 화면 흔들림 / 플래시
define flash_white = Fade(0.08, 0.0, 0.4, color="#FFFFFF")
define flash_red   = Fade(0.08, 0.0, 0.6, color="#C0392B")

image rain_anim:
    "images/fx/rain_f1.png"
    pause 0.05
    "images/fx/rain_f2.png"
    pause 0.05
    repeat

image steam_anim:
    "images/fx/steam_f1.png"
    pause 0.1
    "images/fx/steam_f2.png"
    pause 0.1
    repeat

# usage:
# show rain_anim zorder 3
```

## 6.12 options.rpy (배포·설정·18+ 패치 구조)

```renpy
define config.name      = "별빛 오토캠핑장의 여름"
define gui.show_name    = True
define build.name       = "StarlightCamp"
define build.version    = "1.0.0"
define build.directory_name = "StarlightCamp-1.0.0"

# 성인 콘텐츠 토글: 설정 화면에 노출
screen preferences_ex():
    vbox:
        textbutton "성인 콘텐츠 표시: ['ON' if persistent.nsfw_enabled else 'OFF']" action Function(toggle_nsfw)

# H-씬 진입부에서:
# if not persistent.nsfw_enabled: jump h_xxx_soft_exit
```

---

# 7. 아트 프로덕션 파이프라인

## 7.1 산출물 스펙

| 유형 | 규격 | 파일 형식 |
|------|------|-----------|
| 배경(BG) | 1920×1080 이상, 32bit | PNG (JPEG 불필요) |
| 스프라이트 레이어 | 1200×2400, 투명 배경 | PNG |
| H-CG 베이스 | 1920×1080 | PNG (압축 품질 90 이상) |
| H-CG 차분 오버레이 | 동클릭 — 투명 | PNG |
| 썸네일 | 320×180 | PNG |

## 7.2 배경 총목록 (26종)

| ID | 세트 |
|----|------|
| bg_office | 관리실 (낮/밤/폭우 변형) |
| bg_site_a | A 사이트 1인 텐트 (낮/밤/폭우) |
| bg_glamp | 글램핑 데크 (낮/밤/와인) |
| bg_valley | 계곡 (낮/노을/고립 낮/밤) |
| bg_shower | 샤워장 (복도/실내/김 서림) |
| bg_terrace | 야외 평상·바비큐 (낮/밤/불빛) |
| bg_forest | 숲 가장자리·태오 텐트 |
| bg_bridge | 진입로 다리 (건/무너짐) |
| bg_greenhouse | 삼촌 농막 비닐하우스 (낮/새벽) |
| bg_camper | 캠핑카 내부 (낮/밤/정전) |
| bg_village | 마을 장 (장보기) |
| bg_sky | 하늘/폭우 연출용 |

## 7.3 CG 총목록

**일반 이벤트 CG (10종)**: cg_soyul_wet_event (물놀이 건너젖 일정), cg_girls_shower_hint, cg_sisters_party, cg_bridge_night, cg_taeo_rescue 등
**R-18 CG (14종)**: §5.3 표 참조.

## 7.4 **윤리적으로 성인 제작물 수술** · H-CG 차분 레이어 구성 표

| 레이어 | 설명 |
|--------|------|
| 0_base | 기본 베이스 |
| 1_pose | 페이즈별 자세 변화 (A/B/C 3단) |
| 2_face | 표정 변화 (일반/불안/몰입/절정 4단) |
| 3_sweat | 보편 연출 질감 (땀/습기) |
| 4_cloth | 의상 상태 변화 |
| 5_light | 조명 액티브 (촛불/랜턴/정전) |
| 6_bloom | 최종 گل우/필름 그레인? 처리 |

## 7.5 아트 확보 워크플로 (합법 경로)

> **주의**: 상용 AI 이미지 생성 서비스(Grok/DALL·E/Midjourney 등)의 **안전 필터를 우회하는 프롬프트 기법은 본 설계서에 포함하지 않습니다.** 이는 각 서비스 약관 위반(계정 정지·생성물 소거)과 법적 리스크를 초래하며, 게임 출시 후 배포 플랫폼 정지 요인이 됩니다.

**권장 파이프라인 (우선순위별)**

1. **커미션 외주 (권장, 최고 품질)**
   - 계약 시 명시: "성인 콘텐츠 제작 가능한 일러스트레이터", 소유권 양도, PSD 인수, 수정 2회 포함.
   - 골판지: Pixiv/Skeb/한국 커미션 플랫폼에서 성인 컨텐츠 수주 가능 인원 검색.
   - 산출량: BG 커미션(레이아웃/조명 3변형), H-CG는 1-2명 집중 투입.
2. **라이선스 및 오픈 소스 확보**
   - 배경: 무료/공짜 배경 (DonPhotos, 나block) — 상업 허용 명시 확인.
   - 스프라이트: Layered 분할처, 모듈화된 필요 파츠 구매.
3. **로컬 AI 생성 (검열 없는 로컬 모델, **개인 PC** 운영)** — 대량생산 시에만
   - Stable Diffusion / ComfyUI를 **자신의 PC에** 설치하고, 법적·윤리적 기준 내(모든 인물 18+, 무실존 인물 장문/촬영)에서 사용하는 것이 표준 방식.
   - 배포 전: 생성 모델 학습 데이터 라이선스 상업허용 확인.
   - 각 국가의 성인 콘텐츠 규격(모자이크 등) 반드시 준수.
4. **아트보드 순서**: BG(스피드 최우선) → 스프라이트 → 일반 CG → H-CG (마무리에 정비).

---

# 8. 사운드 설계

## 8.1 BGM (12종)

| ID | 파일 | 용도 |
|----|------|------|
| daily_camp | daily_camp.ogg | 낮 평소 |
| soul_* | soul_main.ogg | Act1 연양 |
| mystery_night | mystery_night.ogg | 도난 미해결 |
| romantic_park | romantic_park.ogg | L2 접점 |
| wine_night | wine_night.ogg | 서현 루트 |
| sisters_boot | sisters_boot.ogg | 언니 라인 |
| storm_main | storm_main.ogg | Act3 폭우 전 |
| thunder_blast | thunder_blast.mp3 | 3막 다리 붕괴 |
| storm_tension | storm_tension.ogg | Act3 후반 긴장 |
| sensual_rain | sensual_rain.mp3 | H-씬 (연우 동조) |
| tragic_betrayal | tragic_betrayal.mp3 | 4막 대면 |
| happy_star | happy_star.ogg | 엔딩/에필로그 |

## 8.2 SFX (24종)

click, door_creak, steam_hiss, water_lap, grass_step, heartbeat, wall_slam, glass_touch, wine_pour, can_open, laughter, mosquito, motor_start, truck_horn, river_rush, rain_loop, thunder_far, thunder_near, bridge_collapse, power_down, phone_buzz, cloth_rustle, fire_crackle, camera_shutter

## 8.3 보이스/호흡음
- 히로인 주요 L4 씬의 호흡/신음 보이스 — **전문 성우 사이트(한국어)에 "타이틀 보이스 작업"으로 위탁** 또는 반복 모델 통합(상업 라이선스 확인 필수).
- 보이스 수 최소 300 clip.

## 8.4 믹싱 가이드
- BGM: -12LUFS 장면 지수; SFX: 일관 0.4 gain, rain_loop 반복 무결성(loop point) 확인.
- H-씬: 汗/호흡/신음/보이스 4레이어, "하이캣 유지" 노이즈 절약.

---

# 9. GUI/UX 사양

## 9.1 컬러 팔레트

| 요소 | 색값 |
|------|------|
| 배경 다크 기준 | #0B1220 |
| 패널 | #10192B |
| 별빛 골드 (포인트/강조) | #F5C45E |
| 계곡 청록 (보조) | #2E8B74 |
| 경고 빨강 (배드/데미지) | #E4572E |
| 텍스트 기본 | #E8ECF4 |

## 9.2 폰트

- 본문: **NanumSquareNeo** (네이버, 자유 라이선스) — Ren'Py에서 ttfgados 사용. 오작독률 및 가독성 우수.
- GUI: **Pretendard** (SIL OFL) — 상업 사용 가능.
- 반드시 라이선스 버섯 확인 후 재배포 (`fonts/` 폴더에 저작권 텍시트 첨부).

```renpy
# gui.rpy 색상 및 폰트 설정
define gui.text_font = "fonts/NanumSquareNeo-bRg.ttf"
define gui.name_text_font = "fonts/Pretendard-Medium.ttf"
define gui.text_size = 30
define gui.name_text_size = 34
```

## 9.3 HUD 와이어프레임 (게임 배경)

```
┌──────────────────────────────────────────────────────┐
│ 5일차 · 낮                            평판 72% ★★★★ │
│                                                      │
│   [  배경 및 캐릭터 표시 영역              ]           │
│                                                      │
│ ├──────────────────────────────────────────────────┤ │
│ │ 대사 박스 (NanumSquareNeo 30pt)                    │ │
│ │ ▼                                                        │
└──────────────────────────────────────────────────────┘
```

## 9.4 설정 화면 항목 (기본 + 추가 구현)
- 텍스트 속도·자동 · BGM/SFX/보이스 볼륨 · 전체화면/창모드
- **성인 콘텐츠 표시 ON/OFF** (§6.12)
- **스킵: 이미 본 텍스트만** 허용
- 키우기: 클릭 대신👟 + 여 "(접촉)" target.

---

# 10. 빌드·배포

## 10.1 빌드 세팅

```renpy
# options.rpy
define build.name       = "StarlightCamp"
define build.version    = "1.0.0"
define build.directory_name = "StarlightCamp-1.0.0"

# 불필요한 미립 폼 방지
define build.classify["**.psd"] = None   # 개인 저장용만 (제출 시 포함 X)
define build.classify["**/**.fla"] = None
define build.classify["**.bak"] = None
```

## 10.2 Android 빌드
1. RAPT(Ren'Py Android Packaging Tool) 설치.
2. 패키지명: `com.yourstudio.starlightcamp`.
3. 화면 1920×1080 → 안드로이드 `zoom` 표기 — 최적화 진행.
4. 18+ 캠핑 가이드 상단 나이 확인 문구 유지.
5. 폰트/음성 재사용하여 1080p 또는 1440p 지원.

## 10.3 플랫폼 등록 체크리스트
- [ ] itch.io: 성인 콘텐츠 태그 + 랜딩 페이지 게이트
- [ ] DLsite: 모자이크 버전, 일본어 이용 등급 분류 바로 참조
- [ ] 커뮤니티 공지: 19+ 확인 페이지 + 주의 수정
- [ ] 민간/한국 배포 시 성인 실명 인증
- [ ] 라이선스/동의 문서 일괄 감쇠 (게임 안 '관리자 전용' 아이콘 표시)

## 10.4 데모 빌드 범위 (4주 내)
- Day 1~3 플레이 (도난 이벤트까지)
- 캠프 맵 + 3개 구역 (관리실/A사이트/샤워장)
- S-01 (하나 샤워장) 완성 진행, L2 수위
- 갤러리: 1장 잠금 해금 확인
- 목적: 경제적 후원 플랫폼·출시 페이지 확보/기증자 검증 피드백

---

# 11. 개발 로드맵 (Solo 개발자, 18주 기준)

| 주 | 주력 작업 | 산출물 |
|----|-----------|--------|
| W1 | 프레임워크 (§6.2~6.4), 19+ 게이트 | 기동 성공 프로젝트 |
| W2 | 맵 스크린 + 일일 루たら시전 | 라인 이동 가능 |
| W3 | 데모 스크립트 (Day1~3) | 데모 컨텐츠 |
| W4 | 데모 빌드 → 비공개 배포 | 이용자 피드백 |
| W5~8 | Act1~2 전체 스크립팅 | 시나리오 실행 가능 |
| W6~9 | BG 제작/수급 병행 | BG 26종 |
| W9 | 스프라이트 통합 | 캐릭터 스탠딩 |
| W10~11 | Act3~4 스크립팅 + 추리 미니게임 | 플롯 전체 동작 |
| W11~12 | 일반 CG + H-CG 통합 | 24종 CG 도장 |
| W13 | 사운드/믹싱 | 완전 사운드 |
| W14 | 갤러리·엔딩 연결 · 딥리플레이 연동 | 오� validates |
| W15 | 전체 QA (§12) | 버그 리스트 0 inc |
| W16 | 일본어 세팅(선택) | JP판 R18 |
| W17 | Android 최적화 + 스크린샷·외리 스트레스 | 모바일 성능 OK |
| W18 | 릴리즈 + 배포 체크리스트 | 빌드 패키지 |

---

# 12. QA·테스트 매트릭스

## 12.1 개발 도구
- `Shift+D` → 개발자 콘솔, 변수 크리티, `save/load` 테스트.
- `repnpy lint` (한국어 문법과 접두, label 중복, 받 Damonlint) 최상위 에러 우선.
- `SHIFT+R` 리로드는 사기방지 — 인제스트가 고립된 화면.

## 12.2 테스트 매트릭스 (필수 21 케이스)

| 케이스 | 검증 항목 |
|--------|-----------|
| T-01 | 19+ 게이트 시 "아니요" → 종료 |
| T-02 | 성인 콘텐츠 OFF → 모든 H-씬 소프트 점프·스킵 |
| T-03 | Day1 내 5-slot 시간 이야 전 데이터 |
| T-04 | 일일 결산 - rep 40 도달 배드 |
| T-05 |holtz? 단서 3개 정답 → 양 아니 E |
| T-06 | 단서 2개 → 배드 [빼앗긴 별빛] |
| T-07 | 모든 히로인 aff 80+ 구현 |
| T-08 | 3P 조건 (하나+다은 합 ≥140) |
| T-09 | 언니 라인 3인 aff 80+ 하렘 |
| T-10 | 갤러리 CG 전체 14종 해금 |
| T-11 | 리플레이 7종 정상 작동 |
| T-12 | 세이브 → 종료 → 재기동 → 다른 파인 유지 |
| T-13 | H-씬 중 롤백 + 스킵 안정 |
| T-14 | 볼륨 별 분리 확인 |
| T-15 | 폰트 깨짐 검사 (모든 대사 자종 익) |
| T-16 | 배드엔딩 B_lost 플로우 |
| T-17 | 태오 우호 flag로 인한 E_true_soyul 조건 차이 |
| T-18 | Android APK 내 (min RAM) 서만? |
| T-19 | 16:10 비율 뷰포트 겹칩 |
| T-20 | 설득스미솜: 확인련uation` |
| T-21 | 스크립트 각 label lint 관성 |

## 12.3 회귀 체크리스트
- [ ] 새 variable 추가 시-save-data 아베 관리
- [ ] H-씬 마다 Z-Order 러성 적귶
- [ ] 연사 스크린에서 rep 조정 흔들 없는 픽스 통일

---

# 13. 리스크 및 트러블슈팅

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 성인 아트 외주 지연 | 출시 품질 ↓ | 데모 없이 조도 사진 질 패출 |
| AI 모델 법적 다했음 | 배포 금지 | 상업 라이선스 부합 학습 모델 확인 |
| 플랫폼 거절 (R18 사칭 일반) | 전물 강제 제거 | 배포 플랫폼별 사전 체크 (§10.3) |
| 보이스 비용 | 주가 산, 순 | 텍스트+효과음 버전으로 발 MPI |
| 스크립트엔 법적 개관 | 불행한 통 | 조치 재작성이 사도 방어 |
| 복잡한 분기 늘음 QA 부담 | 출시 이전 | 예산상의 비중적으로 21 케이스 관리 |

---

# 부록 A: 전체 변수 사전

| 변수 | 타입 | 설명 |
|------|------|------|
| current_day | int | 1~31 |
| slot_idx | int | 0~4 (아침~심야) |
| heroines[k]["aff"] | int | 히로인 호감도 |
| heroines[k]["lib"] | int | 성적 개방도 |
| camp_rep | int | 캠핑장 평판 |
| suspicion | int | 4막 단서 진행도 |
| clues | dict | 단서 12종 존재 여부 |
| flags | dict | 이벤트 트리거 플래그 |
| clue_picks | list | 대면 씬에서 선택한 증거 |
| uncle_ending | str | "prison"/"redemption"/"exile" |
| picked_route | str | 엔딩 관련 |
| persistent.adult_ok | bool | 19+ 게이트 |
| persistent.nsfw_enabled | bool | 성인 콘텐츠 토글 |
| persistent.gallery_unlocked | dict | 갤러리 해금 현황 |

# 부록 B: 플래그 사전 (일부)

```python
act1_done, act2_on, act3_on, stolen_case_on, stolen_case_resolved,
dissatisfied_guest_pending, taeo_ally, taeo_suspect, seohyeon_secret_shown,
soyul_backstory_shown, girls_3p_unlocked, sisters_route_on, h_scene_counts,
review_ip_traced, review_ip_not_traced, ambulance_behind, h_epilogue_done
```

# 부록 C: 에셋 ID 네이밍 규칙

```
bg_[이름]               배경
cg_[캐릭터가]_[scene]    일반 CG
h_[캐릭터]_[scene]       H-CG (기본 베이스)
o_[효과]_[?]             차분 오버레이
sp_[캐릭터]_[레이어]      스프라이트 레이어
ui_[위치]                GUI 텍스처
bgm_[name] / sfx_[name] 사운드
```

# 부록 D: Day 1 샘플 스크립트 (완전 간단 흐름)

```renpy
label act1_intro:
    scene black with None
    play music "audio/bgm/soul_main.ogg" loop fadein 1.0
    "여름 휴가의 반, 아버지의 부탁으로 심산한 친척 친 이진에서 도착했다."
    "캄핑장 관리인은 어머니 생각과 서 하나의 정한 게 좋아해."

    scene bg_office with fade
    m "…일단 청소부터, 자석 아칌에 손님이 진입하실 수 있게."
    m "…내 유동과 달 질 시가ываться."

    "정리 잘 마쳤다. 나는 물 충이 실에서 처음 소율과 마주쳤다."

    scene bg_site_a with fade
    show soyul e_smile casual with dissolve

    so "어! 사장님 아들이지? 반가워~ 이제 막 텐트 홍합 나가습니다!"

    menu:
        "템트를 도와주기로 한다.":
            $ gain("soyul", aff=8)
            so "하하슬 작은 관각 응답을 나차였음!"

        "관리인대할 일 가른다.":
            $ gain("soyul", aff=3)
            so "…내 프로제를 선뢰하는 환상 좋되가."

    call advance_time
    jump camp_day_loop
```

# 부록 E: 배드 엔딩 3종 플로우

```
B_forsaken (빼앗긴 별빛)
  └ rep ≤ 40 → 부모 강제 매각 → 리조트 완공 → 카메라 추적 영상 → "여름은 끝났다"

B_frameup (패배의 직업: 추리 실패)
  └ 단서 3종 배 완세 → 삼촌의 역공 → 서준 아버지가 설면 → salmon set 한다 → 홀樟 히로인 배 지속

B_lost (여름을 잃다)
  └ Act3 누군가를 구하지 못하면 → 하나 편 지단, 다리 개장 불가 → 캠프! 모든 애인 상실
```

# 부록 F: H-Scene 보일러플레이트 (라이팅 프레임워크)

```renpy
label h_generic_template:
    # [L4] 씬 개요: 4가 비해
    scene bg_[장소] with fade
    play music "audio/bgm/[엔진 눈]" loop fadein 1.0
    show [캐릭터] [복장 속/> dress] [표정] with dissolve

    # (1) 긴장·맥락 — "왜 지금"이 성립하는 이유
    "[정황 서술]"

    # (2) 합의 비트 — 필수 대사
    "[캐릭터] \"…지금 괜찮아? 정말로?\""
    m "[응답]"

    # (3) 본편 페이즈 A → B (Composite 차분 전환 + 선택지)
    menu:
        "부드럽게 진행한다.":
            $ gain("k", aff=5, lib=5)
            scene cg_[asset]_phase_b with dissolve
        "강하게 주도한다.":
            $ gain("k", aff=5, lib=10)
            scene cg_[asset]_phase_c with vpunch

    # (4) 정점 연출
    with flash_white
    play sound "audio/sfx/[정점]"

    # (5) 해금 + 여운
    $ unlock_cg("cg_[asset]")
    "[여운 대사]"

    call advance_time
    jump camp_day_loop
```

# 부록 G: 다음주 월요일 시작 체크리스트 (첫 주 실행 오더)

- [ ] Ren'Py 8.x 최신 안정버전 설치
- [ ] `starlight_camp` 프로젝트 신규 생성 · 해상도 1920×1080 설정
- [ ] §6.2~6.6 코드 전량 복붙 → 1주차 마일스톤: 맵 이동 + 시간 순환 동작 확인
- [ ] 데모용 배경 3종(관리실/사이트/샤워장) 임시 파일 반영
- [ ] 19+ 게이트·성인 토글 테스트
- [ ] 심화: Act1 Day1 샘플 스크립트 플로우 (부록 D) 통과 확인

---

**끝.** — 문의 시 §7.5(합법 파이프라인)·§10.3(플랫폼 요건)·부록 G(첫 주 실행)부터 순서대로 진행하면 "렌파이 게임을 즉시 만들 수 있는" 착수 환경이 완성됩니다.
