# WhiteStudio

WebGL2 기반 2D 게임/그래픽 엔진입니다. Canvas 하나에 씬(scene), 오브젝트, 카메라, 타일맵, 엔티티, 파티클, 애니메이션(모션), 텍스트, 네트워크 기능을 붙여 게임을 만들 수 있도록 구성되어 있습니다.

## 특징

- **WebGL2 렌더러**: 셰이더 기반 이미지/텍스트/비디오 렌더링, 텍스트 아틀라스 배칭, 비디오 텍스처 스트리밍 지원 (`core.js`)
- **오브젝트 시스템**: 위치·크기·회전·정점(vertex) 단위로 제어되는 렌더 오브젝트 (`object.js`)
- **씬(Scene) 기반 구조**: 씬별 업데이트/렌더 루프 분리, 화면 리사이즈 자동 대응
- **카메라**: 오프셋 이동, 특정 오브젝트 트래킹(부드러운 추적) 지원 (`cameraManager.js`)
- **타일맵**: 무한 스크롤 타일, 청크(chunk) 단위 지형 생성, 타일 블로킹(충돌) 처리 (`tileManager.js`, `mapExtension.js`)
- **엔티티 시스템**: 플레이어/오브젝트 생성, 히트박스, 이동, 네트워크 동기화 (`entityExtension.js`)
- **모션/애니메이션 관리**: 이벤트 기반 프레임 애니메이션, 오프셋/뒤집기 처리 (`motionManager.js`)
- **파티클 시스템**: 타입별 파티클 생성 및 수명 관리 (`particleExtension.js`)
- **입력 이벤트 관리**: 키보드/마우스 상태 추적 (`eventManger.js`)
- **이동 처리**: WASD 기반 이동, 벽 충돌 체크, 부드러운 감속(smoothing) (`movementExtension.js`)
- **텍스트 렌더링**: 화면 비율에 맞춘 텍스트 오브젝트 (`textManager.js`)
- **네트워크**: `wingAPI` 기반 로그인/연결 헬퍼 (`networkManager.js`)
- **유틸리티**: 랜덤 값/ID 생성 (`random.js`), 로그 출력 (`Log.js`)

## 프로젝트 구조

```
├── core.js                # WebGL2 렌더링 코어 (셰이더, 텍스처, 텍스트 아틀라스, 비디오)
├── gameManger.js           # 엔진 진입점 - 캔버스 생성, 메인 루프, 씬 관리
├── object.js               # 기본 렌더 오브젝트 / 비디오 오브젝트
├── imageObject.js          # 이미지 리소스 래퍼
├── cameraManager.js        # 카메라 이동 및 트래킹
├── cobj.js                 # 씬에 자동 배치되는 UI/오브젝트 관리
├── entityExtension.js      # 엔티티(플레이어 등) 생성 및 관리
├── eventManger.js          # 키보드/마우스 입력 이벤트 관리
├── mapExtension.js         # 맵/청크 기반 지형 데이터 관리
├── tileManager.js          # 타일 배치, 무한 스크롤, 충돌 처리
├── motionManager.js        # 프레임 애니메이션(모션) 관리
├── movementExtension.js    # 캐릭터 이동 로직 (WASD, 충돌)
├── particleExtension.js    # 파티클 생성/업데이트/렌더링
├── textManager.js          # 텍스트 오브젝트 관리
├── networkManager.js       # 네트워크(wingAPI) 연결/로그인
├── random.js                # 랜덤 숫자/ID 유틸리티
└── Log.js                   # 콘솔 로그 포맷터
```

## 요구 사항

- WebGL2를 지원하는 브라우저
- ES Modules(`import`/`export`)를 지원하는 환경

## 시작하기

```js
import { gametManager } from './gameManger.js'

const studio = new gametManager()
await studio.init([1920, 1080]) // 기준 해상도 설정

studio.update(() => {
    // 매 프레임 실행되는 로직
})

studio.scene('main', () => {
    // 'main' 씬에서만 실행되는 로직
})

studio.sceneChange('main')
```

### 오브젝트 생성 및 렌더링

```js
const img = await studio.imgLoad('./assets/player.png')
const player = studio.object(img, [100, 100], [64, 64])

studio.update(() => {
    player.render()
})
```

### 카메라 사용

```js
studio.camera.trackingSet(10, [0, 0])

studio.update(() => {
    studio.camera.tracking(player)
})
```

### 엔티티 생성

```js
const entities = new entityExtension(studio)
const player = entities.newPlayer([0, 0], [50, 50], 'Player1')

studio.update(() => {
    entities.renderAll()
})
```

## 주의사항

- 일부 모듈(`cobj.js`, `random.js` import 경로 등)은 외부 `init.js`, `api.js`, `wingAPI/wingAPI.js` 모듈에 의존하므로 별도로 준비되어야 합니다.
- `gameManger.js`는 `./WhiteStudio/src/...` 경로의 스타일시트/아이콘/시스템 이미지를 로드하므로, 해당 디렉토리 구조를 프로젝트에 맞게 준비해야 합니다.

## 라이선스

All Rights Reserved © 2026 wh-snuwman