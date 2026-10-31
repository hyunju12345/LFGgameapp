# PartyUp 모바일 앱

Figma의 Raina project 3-1, Page 3을 React Native + Expo SDK 58로 구현한 iOS / Android 앱입니다. 원본 이미지, 아이콘, Pretendard 글꼴을 프로젝트에 저장했으며 임시 Figma URL에 의존하지 않습니다.

## VS Code에서 열기

1. VS Code의 **Git: Clone**에서 이 저장소 URL을 입력합니다.
2. 복제한 `LFGgameapp` 폴더를 엽니다.
3. 터미널에서 `npm ci`를 실행합니다.
4. `npm run dev -- --web`을 실행하면 서버와 화면 미리보기가 함께 열립니다.
5. `src/app/`의 화면 코드를 수정하면 변경 사항이 미리보기에 반영됩니다.

VS Code의 **Terminal → Run Task → PartyUp: live preview**로도 실행할 수 있습니다. 코드는 TypeScript / React Native이며 SwiftUI 프로젝트는 아닙니다. Expo Go의 실기기 지원 버전은 전환 기간에 다를 수 있으므로 현재 SDK 58 앱은 우선 브라우저 미리보기나 development build로 확인하세요. 설치 파일 빌드는 자동 실행하지 않습니다.

## 실행

Node.js 24 이상이 필요합니다. 저장소를 복제한 후 `npm ci`로 의존성을 설치하세요.

```sh
cd LFGgameapp
npm run dev
```

이 명령은 데이터 서버(8787)와 Expo 개발 서버(8081)를 함께 실행하고 컴퓨터의 Wi-Fi IP를 앱의 API 주소로 설정합니다. 휴대폰과 컴퓨터가 같은 Wi-Fi에 연결되어 있어야 합니다. 회사·학교 Wi-Fi에서 기기 간 통신을 막으면 개인 Wi-Fi 또는 핫스팟을 사용하세요. 종료는 Ctrl+C입니다.

브라우저에서 먼저 확인하려면 `npm run dev -- --web`을 실행한 뒤 `http://localhost:8081`을 여세요. 브라우저는 화면 확인용이며, 앱 코드는 React Native입니다.

## 휴대폰에 설치

이 결과물은 실행 가능한 앱 소스와 서버입니다. 서명된 APK / IPA 및 스토어 배포는 아직 생성하지 않았습니다. 이 환경에는 전체 Xcode가 없어 네이티브 앱의 실기기 실행을 검증하지 못했습니다. iOS·Android JavaScript/Hermes 번들 생성과 브라우저 렌더링을 검증했습니다.

SDK 58용 **development build**를 권장합니다. Expo 계정과 플랫폼별 서명 설정이 필요합니다. Apple 개발자 계정이나 Expo 로그인을 대신 생성하지 않았습니다.

```sh
# Android 개발 빌드
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development

# iPhone 개발 빌드: 먼저 개발 기기 등록
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile development
```

빌드 완료 후 EAS에서 제공하는 설치 링크로 앱을 설치하세요. 이후 `npm run dev`로 개발 서버를 열고 QR 코드 또는 개발 클라이언트의 서버 선택 화면으로 연결합니다. 전체 Xcode 또는 Android Studio가 설치된 컴퓨터에서는 `npx expo run:ios` / `npx expo run:android`로 로컬 빌드할 수도 있습니다.

컴퓨터 없이 사용하는 독립 설치본은 먼저 API 서버를 HTTPS로 배포하고 `EXPO_PUBLIC_API_URL=https://실제-서버-주소`를 빌드 환경에 설정한 뒤 preview / production 프로필로 빌드해야 합니다. EAS 프로젝트 연결, 서명, 실제 API 호스팅은 계정이 필요한 남은 단계입니다. 관련 공식 문서: [Expo 개발 빌드](https://docs.expo.dev/develop/development-builds/introduction/), [EAS 빌드](https://docs.expo.dev/build/setup/).

## 구현한 기능

- 홈, 친구 목록, 게임 목록, 파티 상세, 파티 생성, 추천 팀원, 파티 채팅, 프로필
- 이메일·비밀번호 회원가입 / 로그인 / 로그아웃. 비밀번호는 salt + scrypt로 해시하며 네이티브 로그인 토큰은 SecureStore에 저장
- 친구 요청·수락, 이름으로 플레이어 검색
- 파티 이름·게임·게임 모드·정원·플레이 스타일·공개 여부 설정
- 공개 파티 탐색·참여·탈퇴, 정원 검사, 파티장이 나갈 때 다른 멤버에게 소유권 이전
- 파티 멤버만 채팅 조회·전송 가능. 2.5초 간격으로 메시지 갱신, SQLite 영구 저장
- 게임·플레이 스타일·랭크에 따른 간단한 호환도 계산, 프로필 수정
- 연결 실패·입력 오류·빈 목록·정원 초과·로그인 만료 처리

처음에는 **Design preview** 배너가 있는 디자인 미리보기가 나옵니다. Raina / May 등의 예시 인물은 실제 계정이 아니며, 미리보기에서 데이터 변경 버튼을 누르면 가입 화면으로 이동합니다. 회원가입 후에는 실제 서버 데이터만 표시합니다. 친구와 각자 가입해 같은 서버에 연결하면 서로 검색하고 같은 파티에서 채팅할 수 있습니다.

## 사용 순서

1. 두 기기에서 각각 회원가입합니다.
2. My에서 선호 게임·플레이 스타일·랭크를 저장합니다.
3. Friend에서 상대에게 요청을 보내고 상대가 Accept를 누릅니다.
4. Game → 게임 선택 → Make party에서 공개 파티를 만듭니다.
5. 상대가 같은 게임의 Open parties에서 참여합니다.
6. Chat에서 대화합니다. 앱을 재시작해도 계정·파티·메시지는 보존됩니다.

## 아직 연결하지 않은 기능

음성 통화, 푸시 알림, 게임 계정 연동·게임 실행·실제 게임 접속 상태 조회, 이메일 인증·비밀번호 재설정·차단·신고·계정 삭제는 구현 범위에 포함하지 않았습니다. 온라인 표시는 PartyUp 최근 접속 기준이며 게임 실행 상태가 아닙니다. 비공개 파티는 기존 멤버에게만 보이며 초대 링크 기능은 없습니다. 앱 내부의 채팅·파티는 실제 동작합니다.

공개 서비스로 운영하기 전에는 계정 복구·삭제, 개인정보 처리 안내, 모니터링, 백업, HTTPS 배포 등의 운영 작업이 필요합니다. 현재 로컬 서버는 개발과 소규모 기능 검증용입니다. 자동 배포나 과금 계정 생성은 하지 않았습니다.

## 서버

`server/server.mjs`는 외부 서버 패키지 없이 Node.js 내장 HTTP / SQLite / crypto를 사용합니다. 데이터는 기본적으로 `server/data/partyup.sqlite`에 저장됩니다. 이 디렉터리는 소스 관리와 전달용 ZIP에서 제외됩니다.

```sh
npm run server
# PORT, DATA_DIR, WEB_ORIGIN 환경변수 지원
# Docker로 실행할 때 server/ 디렉터리를 빌드 컨텍스트로 사용
docker build -t partyup-api server
docker run -p 8787:8787 -v partyup-data:/data partyup-api
```

호스팅할 때는 HTTPS 리버스 프록시와 영구 볼륨을 구성하고, 웹도 제공한다면 `WEB_ORIGIN`을 실제 웹 주소로 설정하세요. 모바일 앱에는 CORS 제한이 적용되지 않습니다. 로그인·메시지 전송에는 기본적인 요청 빈도 제한을 적용했습니다.

## 검증

```sh
npm run typecheck
npm run lint
npm test
npm run export
```

친구 요청·수락, 로그인 실패, 중복 가입, 미인증 요청, 파티 정원, 비멤버 채팅 접근 차단, 한글 메시지 전송·조회, 프로필 저장, 파티장 이전, 비공개 파티, 로그아웃 무효화가 통합 테스트 대상입니다. Figma 홈·파티 상세를 402×874 뷰포트로 비교하고 이미지 비율을 수정했습니다.

설치 당시 npm audit은 Expo CLI / ESLint 계열 전이 의존성에 26건(High 2, Moderate 22, Low 2)을 보고했습니다. 제시된 자동 해결책은 SDK의 큰 버전 하향을 포함하므로 강제로 적용하지 않았습니다. API 서버는 npm 의존성을 사용하지 않습니다. 배포 전에 Expo 호환 업데이트와 개발 도구의 보안 패치를 다시 확인하세요.

## 디자인 출처와 자산

[원본 Figma](https://www.figma.com/design/hKbU34pQo2UzK4zTr6GBCs/Raina-project-3-1?node-id=116-283)

홈 `125:762`, 파티 상세 `125:903`, 파티 생성 `130:1498`, 추천 `148:2689`, 채팅 `166:4869`를 기준으로 구현했습니다. 가입·빈 상태·오류·프로필 설정은 실제 사용을 위해 추가했습니다. 원본에서 반복되어 있던 게임명은 해당 이미지의 게임명으로 정리했습니다. OS 상태 표시줄은 실제 기기의 것을 사용합니다. 글꼴 라이선스는 `assets/fonts/OFL.txt`에 있습니다. 게임 아트와 아바타의 공개 배포 권한은 제공된 디자인의 권리 범위에 따릅니다.
