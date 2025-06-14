from pydantic import BaseModel
from typing import List, Optional

# 드론 연결 요청 모델 정의
class DroneConnectionRequest(BaseModel):
    drone_id: str  # 드론의 고유 ID
    connection_string: str  # 드론 연결을 위한 문자열

# 드론 텔레메트리 응답 모델 정의
class TelemetryResponse(BaseModel):
    drone_id: str  # 드론의 고유 ID
    latitude: float  # 위도
    longitude: float  # 경도
    altitude: float  # 상대 고도
    altitude_asl: float  # 해수면 고도 (ASL)
    battery: float  # 배터리 상태
    airspeed: float  # 공중 속도
    groundspeed: float  # 지상 속도
    heading: int  # 방향
    mode: str  # 드론 모드
    armed: bool  # Arm 상태
    pitch: float  # 기체의 피치(앞뒤 기울기)
    roll: float  # 기체의 롤(좌우 기울기)
    yaw: float  # 기체의 요(방향)
    signal_strength: float  # 수신 감도값
    home_latitude: float  # 홈 위치 위도
    home_longitude: float  # 홈 위치 경도
    home_altitude: float  # 홈 위치 고도

# 드론 명령 요청 모델 정의
class CommandRequest(BaseModel):
    drone_id: str  # 드론의 고유 ID
    command: str  # 실행할 명령
    params: Optional[List[float]] = []  # 명령에 필요한 매개변수

# 드론 비행 모드 변경 요청 모델 정의
class FlightModeRequest(BaseModel):
    mode: str  # 변경할 비행 모드 (예: "GUIDED", "AUTO", "RTL", "LAND" 등)

# GPS 좌표 모델 정의
class GPSPosition(BaseModel):
    latitude: float  # 위도
    longitude: float  # 경도
    altitude: float  # 고도 (상대 고도)

# 홈 포지션 설정 요청 모델 정의
class HomePositionRequest(BaseModel):
    latitude: float  # 위도
    longitude: float  # 경도
    altitude: float  # 고도 (상대 고도)
    set_current: bool = False  # 현재 위치를 홈으로 설정할지 여부