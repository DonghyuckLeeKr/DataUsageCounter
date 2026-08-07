# 📡 DataUsageCounter

> **LG U+ 데이터 쉐어링 & USB LTE 라우터 맞춤형 실시간 데이터 모니터링 데스크톱 앱**  
> Tauri + React + Rust 기반으로 구축된 최신 Apple Minimal Clean Glassmorphism 모니터링 대시보드입니다.

---

## ✨ 핵심 기능

1. **📱 통신사 요금제 & USIM 라우터 자동 감지**:
   - USB LTE 라우터 웹 게이트웨이(`192.168.8.1`, `192.168.0.1` 등) 자동 스캔을 통한 USIM 통신사 및 LTE 신호 세기 탐지.
   - 통신사/요금제 이름 커스텀 설정 (`LG U+ 데이터 쉐어링`, `SKT 함께쓰기`, `KT Y덤` 등).

2. **🎯 통신사 조회 사용량 초기 보정 (Baseline Calibration)**:
   - 통신사 홈페이지/앱의 현재 사용 수치(예: 34.5 GB)를 직접 입력해 보정 기준선으로 삼아 실시간 트래픽을 정확히 누적 계산.

3. **📅 매월 1일 자동 초기화 (Monthly Auto-Reset)**:
   - 매월 1일 00:00시 달력 자동 감지로 당월 사용량 0 GB 리셋 (설정에서 리셋 날짜 변경 가능).

4. **📊 80GB 데이터 쿼터 & 오늘의 안전 사용량 가이드 (Pacing Budget)**:
   - 80GB 한도 링 메터 (80% 주의 / 90% 위험 / 95% 긴급 알림).
   - 이번 달 남은 날짜 수와 남은 용량을 계산하여 **"초과 없이 완주하기 위한 하루 권장 사용량 (예: 2.14 GB/일)"** 제시.

5. **🗔 Always-On-Top 미니 콤팩트 가젯 (Mini Floating Widget)**:
   - 화면 구석 상시 고정 투명 모드로 전환하여 작업 중 실시간 다운로드/업로드 속도 및 80GB 남은 퍼센트 모니터링.

6. **🎨 눈이 편안한 디자인 테마 4종**:
   - 🍃 **소프트 다크 슬레이트**: 눈 피로 방지용 차분한 딥 슬레이트 (기본값)
   - ⬛ **미드나잇 매트**: 차콜/무광 블랙
   - ☀️ **노르딕 라이트**: 고대비 텍스트 크림 샌드
   - ⚡ **네온 사이버**

---

## 🛠️ 기술 스택 (Tech Stack)

- **Frontend**: React, Vite, Lucide Icons, Vanilla CSS (Design Tokens & Glassmorphism)
- **Desktop Container & Backend**: Tauri (Rust), `sysinfo`, `serde`
- **Data Telemetry**: Windows Network Adapter Telemetry & Gateway Probing

---

## 🚀 개발 및 실행 방법 (Getting Started)

### 1. 웹 개발 서버 실행
```bash
npm install
npm run dev
```

### 2. 프로덕션 빌드 검증
```bash
npm run build
```

### 3. Tauri 데스크톱 앱 Dev 실행 (Rust)
```bash
npm run tauri dev
```

---

## 📄 License
MIT License
