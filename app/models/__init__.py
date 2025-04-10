from pydantic import BaseModel
from typing import List, Optional

# 드론 연결 요청 모델 정의
class DroneConnectionRequest(BaseModel):
    drone_id: str  # 드론의 고유 ID
    connection_string: str  # 드론 연결을 위한 문자열

# 드론 텔레메트리 응답 모델 정의
class TelemetryResponse(BaseModel):
    drone_id: str  # 드론의 고유 ID
    gps: dict  # GPS 데이터
    altitude: float  # 고도 정보
    battery: dict  # 배터리 상태

# 드론 명령 요청 모델 정의
class CommandRequest(BaseModel):
    drone_id: str  # 드론의 고유 ID
    command: str  # 실행할 명령
    params: Optional[List[float]] = []  # 명령에 필요한 매개변수