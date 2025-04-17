# 드론 제어 서버 (Drone Control Server)

이 프로젝트는 FastAPI를 사용하여 드론을 제어하고 모니터링하기 위한 REST API 서버입니다.

## 프로젝트 구조

```
app/
├── libs/           # 외부 라이브러리 및 유틸리티
├── log/            # 로그 파일 저장
├── models/         # 데이터 모델 정의
├── routers/        # API 라우터
├── services/       # 비즈니스 로직
└── main.py         # 애플리케이션 진입점
```

## 주요 기능

### 드론 연결 관리
- 드론 연결 및 연결 해제
- 연결된 드론 목록 조회

### 드론 제어
- Arm/Disarm 상태 변경
- 이륙 및 착륙
- 비행 모드 변경
- 자동비행 미션 업로드
- 사용자 정의 명령 실행
- GPS 좌표로 비행 (상대 고도 사용)

### 텔레메트리 모니터링
- 실시간 위치 정보 (위도, 경도, 고도)
  - 상대 고도 (현재 위치 기준)
  - 해수면 고도 (ASL - Above Sea Level)
- 배터리 상태
- 비행 속도 (공중 속도, 지상 속도)
- 기체 자세 (피치, 롤, 요)
- 비행 모드 및 Arm 상태
- 신호 강도

## API 엔드포인트

### 드론 연결
- `POST /drones/connect` - 드론 연결
- `DELETE /drones/{drone_id}` - 드론 연결 해제
- `GET /drones` - 연결된 드론 목록 조회

### 드론 제어
- `POST /drones/{drone_id}/arm` - 드론 Arm
- `POST /drones/{drone_id}/disarm` - 드론 Disarm
- `POST /drones/{drone_id}/takeoff` - 드론 이륙
- `POST /drones/{drone_id}/land` - 드론 착륙
- `POST /drones/{drone_id}/mode` - 비행 모드 변경
- `POST /drones/{drone_id}/mission` - 자동비행 미션 업로드
- `POST /drones/{drone_id}/command` - 사용자 정의 명령 실행
- `POST /drones/{drone_id}/fly-to` - GPS 좌표로 비행
  ```json
  {
      "latitude": 37.12345,  // 위도
      "longitude": 127.12345,  // 경도
      "altitude": 10.0  // 상대 고도 (미터)
  }
  ```

### 텔레메트리
- `GET /drones/{drone_id}/telemetry` - 드론 텔레메트리 데이터 조회
  ```json
  {
      "drone_id": "drone1",
      "latitude": 37.12345,
      "longitude": 127.12345,
      "altitude": 10.0,        // 상대 고도
      "altitude_asl": 50.0,    // 해수면 고도 (ASL)
      "battery": 95.5,
      "airspeed": 5.0,
      "groundspeed": 4.8,
      "heading": 90,
      "mode": "GUIDED",
      "armed": true,
      "pitch": 0.1,
      "roll": 0.0,
      "yaw": 45.0,
      "signal_strength": 100
  }
  ```

## 기술 스택

- FastAPI - 웹 프레임워크
- DroneKit - 드론 제어 라이브러리
- Pymavlink - MAVLink 프로토콜 구현
- Pydantic - 데이터 검증 및 설정 관리

## 시작하기

1. 필요한 패키지 설치:
```bash
pip install -r requirements.txt
```

2. 서버 실행:
```bash
uvicorn app.main:app --reload
```

3. API 문서 확인:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 주의사항

- 드론 연결 시 올바른 연결 문자열을 사용해야 합니다.
- 드론 제어 명령은 안전을 위해 신중하게 사용해야 합니다.
- 실제 비행 전에 시뮬레이션 환경에서 충분한 테스트를 진행하세요.
- GPS 좌표로 비행 시 상대 고도를 사용하므로, 현재 위치를 기준으로 한 고도를 입력해야 합니다. 