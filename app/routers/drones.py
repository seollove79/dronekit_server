from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.models import DroneConnectionRequest, TelemetryResponse, CommandRequest, FlightModeRequest, GPSPosition, HomePositionRequest
from app.services import drone_service
import os

# 드론 관련 API 라우터 생성
router = APIRouter(prefix="/drones", tags=["drones"])

# 드론 연결 엔드포인트
@router.post("/connect")
async def connect_drone(request: DroneConnectionRequest):
    # 드론 연결 요청을 처리하고 결과 반환
    return await drone_service.connect_drone(request)

# 연결된 드론 목록 조회 엔드포인트
@router.get("/")
async def list_connected_drones():
    # 현재 연결된 드론 목록 반환 (await 추가)
    return await drone_service.list_connected_drones()

# 특정 드론의 텔레메트리 데이터 조회 엔드포인트
@router.get("/{drone_id}/telemetry", response_model=TelemetryResponse)
async def get_telemetry(drone_id: str):
    # 드론 ID를 기반으로 텔레메트리 데이터 반환
    return await drone_service.get_telemetry(drone_id)

# 드론 Arm 명령 엔드포인트
@router.post("/{drone_id}/arm")
async def arm_drone(drone_id: str):
    # 드론을 Arm 상태로 전환
    return await drone_service.arm_drone(drone_id)

# 드론 Disarm 명령 엔드포인트
@router.post("/{drone_id}/disarm")
async def disarm_drone(drone_id: str):
    # 드론을 Disarm 상태로 전환
    return await drone_service.disarm_drone(drone_id)

# 드론 연결 해제 엔드포인트
@router.delete("/{drone_id}")
async def disconnect_drone(drone_id: str):
    # 드론 연결 해제 처리
    return await drone_service.disconnect_drone(drone_id)

# 드론 명령 실행 엔드포인트
@router.post("/{drone_id}/command")
async def execute_command(drone_id: str, request: CommandRequest):
    # 드론에 특정 명령 실행 요청
    return await drone_service.execute_command(drone_id, request)

# 드론 이륙 엔드포인트
@router.post("/{drone_id}/takeoff")
async def takeoff_drone(drone_id: str, altitude: float):
    """
    드론을 지정된 고도까지 이륙시키는 API
    :param drone_id: 드론의 고유 ID
    :param altitude: 이륙할 목표 고도 (미터 단위)
    """
    return await drone_service.takeoff_drone(drone_id, altitude)

# 드론 착륙 엔드포인트
@router.post("/{drone_id}/land")
async def land_drone(drone_id: str):
    """
    드론을 착륙시키는 API
    :param drone_id: 드론의 고유 ID
    """
    return await drone_service.land_drone(drone_id)

# 드론 자동비행 미션 업로드 엔드포인트
@router.post("/{drone_id}/mission")
async def upload_mission(drone_id: str, mission: list[dict]):
    """
    드론에 자동비행 미션을 업로드하는 API
    :param drone_id: 드론의 고유 ID
    :param mission: 미션 리스트 (각 미션은 위도, 경도, 고도를 포함)
    """
    return await drone_service.upload_mission(drone_id, mission)

# 드론 비행 모드 변경 엔드포인트
@router.post("/{drone_id}/mode")
async def change_flight_mode(drone_id: str, request: FlightModeRequest):
    """
    드론의 비행 모드를 변경하는 API
    :param drone_id: 드론의 고유 ID
    :param request: 변경할 비행 모드 정보
    """
    return await drone_service.change_flight_mode(drone_id, request.mode)

# GPS 위치로 비행하는 엔드포인트
@router.post("/{drone_id}/fly-to")
async def fly_to_position(drone_id: str, position: GPSPosition):
    """
    드론을 지정된 GPS 좌표로 비행시키는 API
    :param drone_id: 드론의 고유 ID
    :param position: 목표 GPS 좌표 (위도, 경도, 고도)
    """
    return await drone_service.fly_to_position(drone_id, position)

# 홈 포지션 설정 엔드포인트
@router.post("/{drone_id}/home-position")
async def set_home_position(drone_id: str, request: HomePositionRequest):
    """
    드론의 홈 포지션을 설정하는 API
    :param drone_id: 드론의 고유 ID
    :param request: 홈 포지션 정보 (위도, 경도, 고도) 또는 현재 위치 설정 여부
    """
    return await drone_service.set_home_position(drone_id, request)

# 드론의 현재 미션을 읽어오는 API
@router.get("/{drone_id}/mission", response_model=dict)
async def get_drone_mission(drone_id: str):
    """
    드론의 현재 미션을 읽어오는 API
    """
    return await drone_service.get_mission(drone_id)

# 드론 미션 파일 업로드 및 저장 엔드포인트
@router.post("/{drone_id}/upload-mission-file")
async def upload_mission_file(drone_id: str, file: UploadFile = File(...)):
    """
    드론 ID와 미션 파일을 업로드 받아 서버에 저장하는 API
    :param drone_id: 드론의 고유 ID
    :param file: 업로드할 미션 파일
    """
    # 파일 저장 로직을 drone_service로 이동
    return await drone_service.save_mission_file(drone_id, file)