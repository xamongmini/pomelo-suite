# Pomelo Suite 릴리스 가이드

이 문서는 GitHub 업로드와 npm 배포를 한 번에 진행할 수 있게 정리한 체크리스트입니다.

- 루트 버전: `0.1.0`
- 공개 패키지 기준: `calculator/color-picker/diagram/input/runtime/scheduler/timeline/workqueue` = `0.1.0`
- `@pomelo-suite/spangrid` = `0.1.1`

## 1) 버전/메타 점검

1. 패키지 버전 정합성

```powershell
Get-Content package.json
Get-Content packages/calculator/package.json | Out-String
Get-Content packages/spangrid/package.json | Out-String
...
```

확인 항목:

- `name`/`version`/`private`이 의도와 일치
- `main`, `files`, `scripts`, `dependencies`가 패키지 정책과 맞음
- `repository`, `bugs.url`, `homepage`가 GitHub를 가리키는지
- `publishConfig.access`가 `public`인지

2. 공개 범위 점검

```powershell
npm run check
npm run pack:dry-run
```

점검할 내용:

- `pack:dry-run`의 tarball 목록에 `LICENSE`, `README.md`, `package.json`, `src/*`만 들어가는지
- `examples`, `docs`, `test`, `drafts`, 로그/캐시가 포함되지 않는지
- `package-lock.json`은 변경 시 커밋 범위에 반영했는지

## 2) GitHub 업로드

### 2-1. 원격 상태 점검

```powershell
git remote -v
git branch --show-current
git status --short
```

원격이 이미 등록되어 있으면 `git remote add origin`은 생략합니다.

### 2-2. 권한 문제(403) 처리

`remote: Permission denied`가 나오면 현재 저장 자격증명이 다른 계정입니다.

```txt
remote: Permission to xamongmini/pomelo-suite.git denied to ...
```

Windows 기준:

1. Credential Manager에서 GitHub 관련 항목 삭제
2. `%USERPROFILE%\.git-credentials`에서 잘못된 토큰 삭제
3. 다시 인증 후 push

권장 Push:

```powershell
git add -A -- . ':!drafts'
git add -A -- . ':!node_modules'
git add -A -- . ':!package-lock.json'
git status --short
git commit -m "Prepare release content"
git push -u origin HEAD
```

`main`이 아닌 브랜치에서 작업 중이라면 `git push -u origin HEAD`를 사용하면 브랜치 이름으로 push됩니다.

### 2-3. GitHub 탭 확인

Repository 페이지에서 아래 항목을 확인합니다.

- README 렌더링
- 패키지/예제 구조
- `drafts`, 로그, 캐시가 보이지 않음
- MIT 라이선스 노출

## 3) npm 배포

### 3-1. 인증 점검

```powershell
npm whoami
npm config get registry
```

`registry`는 `https://registry.npmjs.org/` 이어야 합니다.

### 3-2. 패키지별 배포

패키지는 workspace 기준으로 독립 배포합니다.

```powershell
.\scripts\npm-publish-order.ps1
```

#### 배포 스크립트

`scripts/npm-publish-order.ps1`를 실행하면 현재 기준 9개 패키지를 고정 순서로 배포합니다.  
(spangrid는 `0.1.1`, 나머지는 `0.1.0` 기준)

```powershell
# scripts/npm-publish-order.ps1
$ErrorActionPreference = 'Stop'

npm publish --workspace @pomelo-suite/spangrid --access public
npm publish --workspace @pomelo-suite/calculator --access public
npm publish --workspace @pomelo-suite/scheduler --access public
npm publish --workspace @pomelo-suite/workqueue --access public
npm publish --workspace @pomelo-suite/runtime --access public
npm publish --workspace @pomelo-suite/color-picker --access public
npm publish --workspace @pomelo-suite/input --access public
npm publish --workspace @pomelo-suite/timeline --access public
npm publish --workspace @pomelo-suite/diagram --access public
```

권장 테스트:

```powershell
npm pack --workspace @pomelo-suite/spangrid
tar -tf pomelo-suite-spangrid-0.1.1.tgz
Remove-Item -LiteralPath pomelo-suite-spangrid-0.1.1.tgz
```

배포 후 검증:

```powershell
npm view @pomelo-suite/spangrid version
npm view @pomelo-suite/spangrid dist.integrity
```

### 3-3. 버전 갱신

패키지 배포 전 버전 업데이트:

```powershell
cd <repo-root>
npm version patch --workspace @pomelo-suite/spangrid --no-git-tag-version
```

`patch`/`minor`/`major`로 조절합니다.

주의:

- 한 번 publish된 버전은 재사용할 수 없습니다.
- 배포할 버전은 `package-lock.json`과 일치시켜야 합니다.
- 배포 후 Git 태그와 커밋을 남기는 것을 추천합니다.

```powershell
git add package.json package-lock.json packages/spangrid/package.json packages/*/package.json
git add packages/spangrid/README.md docs/release.md
git commit -m "Release @pomelo-suite/spangrid v0.1.1"
git tag spangrid-v0.1.1
git push origin HEAD --follow-tags
```

### 3-4. 최초 공개 패키지 일괄 배포 체크포인트

아래 순서로 태그 없이 바로 배포를 진행하거나, 각 패키지별 태그를 찍어도 됩니다.

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

각 패키지 배포 후 확인:

```powershell
npm view @pomelo-suite/calculator version
npm view @pomelo-suite/color-picker version
npm view @pomelo-suite/diagram version
npm view @pomelo-suite/input version
npm view @pomelo-suite/runtime version
npm view @pomelo-suite/scheduler version
npm view @pomelo-suite/timeline version
npm view @pomelo-suite/workqueue version
```

최초 공개 이후에는 패치 배포를 다음과 같이 수행합니다.

```powershell
npm version patch --workspace @pomelo-suite/<패키지이름> --no-git-tag-version
npm publish --workspace @pomelo-suite/<패키지이름> --access public
```

## 4) 권장 공개 범위(최종 점검)

- 패키지 npm payload: `src`, `README.md`, `LICENSE`, `package.json`만
- 예제/플레이그라운드: `examples/*`는 저장소에서 확인
- 초안/로그/개발 산출물: `drafts/**`, `node_modules`, 로그/캐시는 `.gitignore` 또는 수동 제외

## 5) 릴리스 노트 템플릿

- [docs/release-notes.md](./release-notes.md)
