# Pomelo Suite Release Notes Template

이 문서를 각 릴리스 버전에 맞춰 복사/수정해 GitHub 릴리스 본문으로 사용합니다.

## 1) Patch release: `@pomelo-suite/spangrid` `v0.1.1`

### Date

- 2026-06-03 (작성일 기준)

### Type

- Patch release (이전 버전: `0.1.0`)

### Scope

- 패치 대상: `@pomelo-suite/spangrid` only
- 배포 경로: `npm publish --workspace @pomelo-suite/spangrid --access public`

### Notes

- 버전 정합성 점검용으로 spangrid만 0.1.1로 bump
- package metadata(`repository`, `bugs`, `homepage`, `publishConfig`) 검증
- `package-lock.json` 내 workspace 버전 정합 반영
- `files` 정책이 공개 payload(`src`, `README.md`, `LICENSE`, `package.json`)만 포함되도록 정리

### Verification

- `npm run check`
- `npm run pack:dry-run`
- `npm view @pomelo-suite/spangrid version` → `0.1.1`

### Suggested GitHub release body

```text
## @pomelo-suite/spangrid v0.1.1

- spangrid 버전을 0.1.1로 상향
- 버전 정합성 및 공개 배포 메타 재점검
- 기존 payload 분리 정책 유지
```

### Suggested commit/tag

- Commit: `Release @pomelo-suite/spangrid v0.1.1`
- Tag: `spangrid-v0.1.1`

---

## 2) Patch release: `@pomelo-suite/timeline` `v0.1.1`

### Date

- 2026-06-23 (작성일 기준)

### Type

- Patch release (이전 버전: `0.1.0`)

### Scope

- 패치 대상: `@pomelo-suite/timeline` only
- 배포 경로: `npm publish --workspace @pomelo-suite/timeline --access public`

### Notes

- timeline 버전을 0.1.1로 상향
- clip move/resize 종료 이벤트와 change 이벤트 보강
- time ruler 렌더링 옵션(`rulerMode: "time"`) 및 시간 라벨 렌더링 보강
- `package-lock.json` 내 workspace 버전 정합 반영

### Verification

- `npm run check`
- `npm run pack:dry-run`
- `npm view @pomelo-suite/timeline version` -> `0.1.1`

### Suggested GitHub release body

```text
## @pomelo-suite/timeline v0.1.1

- timeline 버전을 0.1.1로 상향
- clip move/resize 종료 이벤트 및 change 이벤트 보강
- time ruler 렌더링 옵션과 테스트 보강
```

### Suggested commit/tag

- Commit: `Release @pomelo-suite/timeline v0.1.1`
- Tag: `timeline-v0.1.1`

---

## 3) Initial publish: `calculator`, `color-picker`, `diagram`, `input`, `runtime`, `scheduler`, `timeline`, `workqueue`

### Date

- TBD (초기 공개 배포일)

### Type

- Initial public release
- Target versions:
  - `@pomelo-suite/calculator` `0.1.0`
  - `@pomelo-suite/color-picker` `0.1.0`
  - `@pomelo-suite/diagram` `0.1.0`
  - `@pomelo-suite/input` `0.1.0`
  - `@pomelo-suite/runtime` `0.1.0`
  - `@pomelo-suite/scheduler` `0.1.0`
  - `@pomelo-suite/timeline` `0.1.1` (patch after initial `0.1.0`)
  - `@pomelo-suite/workqueue` `0.1.0`

### Scope

- 스크립트: `npm publish --workspace <패키지> --access public` 방식
- `@pomelo-suite/spangrid`는 위 patch 릴리스가 선행되어야 함

### Deploy checklist

```powershell
npm publish --workspace @pomelo-suite/calculator --access public
npm publish --workspace @pomelo-suite/color-picker --access public
npm publish --workspace @pomelo-suite/diagram --access public
npm publish --workspace @pomelo-suite/input --access public
npm publish --workspace @pomelo-suite/runtime --access public
npm publish --workspace @pomelo-suite/scheduler --access public
npm publish --workspace @pomelo-suite/timeline --access public
npm publish --workspace @pomelo-suite/workqueue --access public
```

### Verification

- `npm view @pomelo-suite/calculator version` → `0.1.0`
- `npm view @pomelo-suite/color-picker version` → `0.1.0`
- `npm view @pomelo-suite/diagram version` → `0.1.0`
- `npm view @pomelo-suite/input version` → `0.1.0`
- `npm view @pomelo-suite/runtime version` → `0.1.0`
- `npm view @pomelo-suite/scheduler version` → `0.1.0`
- `npm view @pomelo-suite/timeline version` → `0.1.1`
- `npm view @pomelo-suite/workqueue version` → `0.1.0`

### Suggested GitHub release body

```text
## Pomelo Suite Initial Public Release

- 공개 패키지: calculator, color-picker, diagram, input, runtime, scheduler, timeline, workqueue
- 각 패키지 버전: 대부분 0.1.0, timeline patch 0.1.1
- npm payload policy: `src`, `README.md`, `LICENSE`, `package.json`
- 예제/플레이그라운드: examples/*는 저장소에서 별도 확인
```

### Suggested commit/tag

- Commit: `Release initial public packages 0.1.0`
- Tag: `packages-0.1.0` (optional)
