# 돌핀 데이터 (Dolphin Data)

> 모바일 핫스팟, 테더링 및 USB LTE 라우터를 위한 실시간 데이터 사용량 모니터링 데스크톱 애플리케이션

Tauri(Rust)와 React 기반으로 제작된 가볍고 정밀한 윈도우 데이터 트래픽 모니터링 프로그램입니다.

---

## 최신 버전 다운로드 (v1.2.0)

GitHub 릴리즈 페이지에서 최신 윈도우 설치 파일을 바로 다운로드하실 수 있습니다:

- **[Windows 설치 파일 (.exe)](https://github.com/DonghyuckLeeKr/DolphinData/releases/download/v1.2.0/DolphinData_1.2.0_x64-setup.exe)** (권장)
- **[Windows MSI 패키지 (.msi)](https://github.com/DonghyuckLeeKr/DolphinData/releases/download/v1.2.0/DolphinData_1.2.0_x64_en-US.msi)**
- 전체 릴리즈 내역: [GitHub Releases v1.2.0](https://github.com/DonghyuckLeeKr/DolphinData/releases/tag/v1.2.0)

## 주요 기능

### 1. 다중 요금제 프로필 지원 (최대 5개)
- 메인 데이터 요금제, 스마트폰 핫스팟 테더링, 휴대용 LTE 라우터 등 최대 5개의 프로필을 등록하고 탭으로 즉시 전환할 수 있습니다.
- 각 프로필별로 월간 한도(GB), 연결 네트워크 어댑터(Wi-Fi / 이더넷 / USB), 리셋일, 보정 데이터를 독립적으로 분리하여 측정합니다.

### 2. 통신사 사용량 기준선 보정 및 월간 자동 초기화
- 통신사 고객센터 앱 또는 웹사이트에 표시된 현재 사용량(GB)을 입력하면, 이를 기준선으로 삼아 이후 발생하는 실시간 트래픽을 정확히 합산합니다.
- 매월 지정한 리셋일(기본 매월 1일) 자정에 자동으로 당월 사용량을 0 GB로 초기화합니다.

### 3. 시스템 트레이 마우스 오버 실시간 사용량 툴팁
- 작업표시줄 트레이 아이콘에 마우스를 올리면 활성 프로필명, 사용량/한도(GB), 소진율(%), 실시간 다운로드/업로드 속도가 즉시 표시됩니다.

### 4. 일일 데이터 폭주 방지 경고 리미터
- 하루 동안 사용자가 설정한 한도(예: 5GB)를 초과하여 데이터를 소모할 경우, 윈도우 OS 푸시 알림으로 즉시 경고합니다.

### 5. 일별 소비 캘린더 및 14일 통계 리포트
- 최근 14일간의 일별 데이터 소비 추이 막대 차트, 일평균 사용량, 최대 소비일 분석 리포트를 제공합니다.

### 6. 프로세스별 누적 데이터 사용량 추적 및 킬 스위치
- 내 PC에서 데이터를 많이 사용하는 프로그램을 실시간으로 추적하고 누적 사용량을 합산합니다.
- 트래픽을 과도하게 유발하는 프로세스를 원클릭으로 강제 종료할 수 있습니다.

### 7. Always-on-Top 미니 플로팅 가젯
- 320x150 크기의 항상 위(Always-on-top) 미니 가젯으로 전환하여 작업 공간을 방해하지 않고 실시간 속도와 잔여량을 확인할 수 있습니다.

### 8. 윈도우 시작 시 자동 실행 및 설정 백업/복원
- 윈도우 부팅 시 백그라운드 트레이로 자동 실행되도록 설정할 수 있습니다.
- 전체 프로필 설정을 JSON 파일로 백업/복원할 수 있으며, 엑셀에서 한글 깨짐이 없는 UTF-8 BOM CSV 리포트 내보내기를 지원합니다.

### 9. 100% 로컬 폰트 패키징 (Pretendard)
- 외부 CDN 연결 없이 폰트 원본이 앱 내부에 자체 번들링되어 있어 오프라인 환경이나 폰트가 없는 PC에서도 일관된 레이아웃을 보장합니다.

---

## 기술 스택

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS
- **Desktop Runtime**: Tauri (Rust)
- **System Telemetry**: `sysinfo`, Windows Network Adapter Telemetry, Windows Registry API

---

## 실행 및 빌드

### 요구 사항
- Node.js 18 이상
- Rust 1.70 이상 (Tauri 빌드 시 필요)

### 개발 서버 실행
```bash
npm install
npm run dev
```

### Tauri 데스크톱 개발 모드 실행
```bash
npm run tauri dev
```

### 프로덕션 윈도우 설치 파일 빌드
```bash
npm run tauri build
```
빌드가 완료되면 `src-tauri/target/release/bundle/nsis/` 경로에 `.exe` 설치 파일이 생성됩니다.

---

## 라이선스

MIT License
