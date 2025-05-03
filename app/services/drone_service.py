from app.libs.dronekit import connect, Command, LocationGlobalRelative
from fastapi import HTTPException
import asyncio
from pymavlink import mavutil
import os
from app.models import GPSPosition, HomePositionRequest

# 연결된 드론을 저장하는 딕셔너리
connected_drones = {}

# 드론 연결 처리 함수
async def connect_drone(request):
    # 이미 연결된 드론인지 확인
    if request.drone_id in connected_drones:
        raise HTTPException(status_code=400, detail="Drone already connected")
    try:
        # 드론 연결 시도
        vehicle = connect(request.connection_string, wait_ready=True, drone_id=request.drone_id)
        connected_drones[request.drone_id] = vehicle  # 연결된 드론 저장
        return {"message": f"Drone {request.drone_id} connected successfully"}
    except Exception as e:
        # 연결 실패 시 예외 처리
        raise HTTPException(status_code=500, detail=f"Failed to connect to drone: {str(e)}")

# 드론을 Arm 상태로 전환하는 함수
async def arm_drone(drone_id: str):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]
        # Arm 상태로 전환
        vehicle.armed = True
        return {"message": f"Drone {drone_id} is now armed."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to arm drone: {str(e)}")

# 드론을 Disarm 상태로 전환하는 함수
async def disarm_drone(drone_id: str):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]
        # Disarm 상태로 전환
        vehicle.armed = False
        return {"message": f"Drone {drone_id} is now disarmed."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to disarm drone: {str(e)}")

# 드론 이륙 함수
async def takeoff_drone(drone_id: str, altitude: float):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]

        # 드론이 Arm 상태인지 확인
        if not vehicle.armed:
            raise HTTPException(status_code=400, detail="Drone is not armed")

        # 드론이 Guided 모드인지 확인
        if vehicle.mode.name != "GUIDED":
            vehicle.mode = "GUIDED"  # Guided 모드로 변경
            while vehicle.mode.name != "GUIDED":
                await asyncio.sleep(0.5)  # 모드 변경 대기

        # 이륙 명령 실행
        vehicle.simple_takeoff(altitude)
        return {"message": f"Drone {drone_id} is taking off to {altitude} meters."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to take off: {str(e)}")

# 드론 착륙 함수
async def land_drone(drone_id: str):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]

        # 드론이 Guided 모드인지 확인
        if vehicle.mode.name != "GUIDED":
            vehicle.mode = "GUIDED"  # Guided 모드로 변경
            while vehicle.mode.name != "GUIDED":
                await asyncio.sleep(0.5)  # 모드 변경 대기

        # 착륙 명령 실행
        vehicle.mode = "LAND"
        return {"message": f"Drone {drone_id} is landing."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to land drone: {str(e)}")

# 드론 연결 해제 함수
async def disconnect_drone(drone_id: str):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones.pop(drone_id)
        # 드론 연결 해제
        vehicle.close()
        return {"message": f"Drone {drone_id} has been disconnected."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to disconnect drone: {str(e)}")

# 드론 명령 실행 함수
async def execute_command(drone_id: str, request):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]
        # 명령 실행 (예: 특정 속성 설정)
        if request.command == "set_speed":
            vehicle.airspeed = request.params[0]
        elif request.command == "set_altitude":
            vehicle.simple_takeoff(request.params[0])
        else:
            raise HTTPException(status_code=400, detail="Unsupported command")
        return {"message": f"Command {request.command} executed successfully on drone {drone_id}."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to execute command: {str(e)}")

# 드론 자동비행 미션 업로드 함수
async def upload_mission(drone_id: str, mission: list[dict]):
    #TODO: 미션 하나더 올라가는 것 해결 해야 함
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]

        # 미션 초기화
        cmds = vehicle.commands
        cmds.clear()
        vehicle.flush()

        # 홈 포지션 추가 (기본값)
        home_position = Command(0, 0, 1, mavutil.mavlink.MAV_FRAME_GLOBAL, mavutil.mavlink.MAV_CMD_NAV_WAYPOINT, 0, 1, 0, 0, 0, 0, vehicle.location.global_relative_frame.lat, vehicle.location.global_relative_frame.lon, 0)
        cmds.add(home_position)

        # 미션 추가
        for index, waypoint in enumerate(mission):
            lat = waypoint.get("latitude")
            lon = waypoint.get("longitude")
            alt = waypoint.get("altitude")
            alt_type = waypoint.get("altitude_type", "relative")  # 기본값: relative
            delay = waypoint.get("delay", 0)
            radius = waypoint.get("radius", 0)

            if lat is None or lon is None or alt is None:
                raise HTTPException(status_code=400, detail="Invalid mission format")

            # 고도 타입에 따라 프레임 설정
            if alt_type == "relative":
                frame = mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT
            elif alt_type == "absolute":
                frame = mavutil.mavlink.MAV_FRAME_GLOBAL
            elif alt_type == "terrain":
                frame = mavutil.mavlink.MAV_FRAME_GLOBAL_TERRAIN_ALT
            else:
                raise HTTPException(status_code=400, detail="Invalid altitude type")

            # 명령 생성 및 추가
            cmds.add(
                Command(index + 1, 0, 0, frame, mavutil.mavlink.MAV_CMD_NAV_WAYPOINT, 0, 1, delay, radius, 0, 0, lat, lon, alt)
            )

        # 미션 업로드
        cmds.upload()

        return {"message": f"Mission uploaded successfully to drone {drone_id}."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to upload mission: {str(e)}")

# 드론 텔레메트리 데이터 수집 함수
async def get_telemetry(drone_id: str):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]

        # 텔레메트리 데이터 수집
        telemetry_data = {
            "drone_id": drone_id,  # 드론 ID 추가
            "latitude": vehicle.location.global_relative_frame.lat,
            "longitude": vehicle.location.global_relative_frame.lon,
            "altitude": vehicle.location.global_relative_frame.alt,  # 상대 고도
            "altitude_asl": vehicle.location.global_frame.alt,  # 해수면 고도 (ASL)
            "battery": vehicle.battery.level,
            "airspeed": vehicle.airspeed,
            "groundspeed": vehicle.groundspeed,
            "heading": vehicle.heading,
            "mode": vehicle.mode.name,
            "armed": vehicle.armed,
            "pitch": vehicle.attitude.pitch,  # 기체의 피치(앞뒤 기울기)
            "roll": vehicle.attitude.roll,    # 기체의 롤(좌우 기울기)
            "yaw": vehicle.attitude.yaw,     # 기체의 요(방향)
            "signal_strength": vehicle.last_heartbeat,  # 수신 감도값 (마지막 신호 수신 시간)
        }

        # 홈 위치 정보가 있는 경우에만 추가
        if vehicle.home_location is not None:
            telemetry_data.update({
                "home_latitude": vehicle.home_location.lat,
                "home_longitude": vehicle.home_location.lon,
                "home_altitude": vehicle.home_location.alt
            })
        else:
            # 홈 위치가 없는 경우 현재 위치를 홈 위치로 사용
            telemetry_data.update({
                "home_latitude": vehicle.location.global_relative_frame.lat,
                "home_longitude": vehicle.location.global_relative_frame.lon,
                "home_altitude": vehicle.location.global_relative_frame.alt
            })

        return telemetry_data
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to get telemetry: {str(e)}")

# 연결된 드론 목록을 반환하는 함수
async def list_connected_drones():
    # connected_drones 딕셔너리에서 모든 드론 ID를 리스트로 반환
    return list(connected_drones.keys())

# 드론 비행 모드 변경 함수
async def change_flight_mode(drone_id: str, mode: str):
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]
        
        # 현재 모드와 요청된 모드가 같은지 확인
        if vehicle.mode.name == mode:
            return {"message": f"Drone {drone_id} is already in {mode} mode."}
        
        # 모드 변경 시도
        vehicle.mode = mode
        
        # 모드 변경이 완료될 때까지 대기
        while vehicle.mode.name != mode:
            await asyncio.sleep(0.5)
            
        return {"message": f"Drone {drone_id} flight mode changed to {mode}."}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to change flight mode: {str(e)}")

# GPS 위치로 비행하는 함수
async def fly_to_position(drone_id: str, position: GPSPosition):
    """
    드론을 지정된 GPS 좌표로 비행시키는 함수
    """
    # 드론이 연결되어 있는지 확인
    if drone_id not in connected_drones:
        raise HTTPException(status_code=404, detail="Drone not connected")
    try:
        # 드론 객체 가져오기
        vehicle = connected_drones[drone_id]

        # 드론이 Guided 모드인지 확인
        if vehicle.mode.name != "GUIDED":
            vehicle.mode = "GUIDED"  # Guided 모드로 변경
            while vehicle.mode.name != "GUIDED":
                await asyncio.sleep(0.5)  # 모드 변경 대기

        # 목표 위치 객체 생성
        target_location = LocationGlobalRelative(
            position.latitude,
            position.longitude,
            position.altitude
        )

        # simple_goto를 사용하여 목표 위치로 이동
        vehicle.simple_goto(target_location)

        return {"message": f"Drone {drone_id} is flying to position: lat={position.latitude}, lon={position.longitude}, alt={position.altitude}"}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=f"Failed to fly to position: {str(e)}")

async def set_home_position(drone_id: str, request: HomePositionRequest):
    """
    드론의 홈 포지션을 설정하는 함수
    """
    try:
        # 드론 연결 확인
        if drone_id not in connected_drones:
            raise HTTPException(status_code=404, detail="드론이 연결되어 있지 않습니다.")

        drone = connected_drones[drone_id]
        
        if request.set_current:
            # 현재 위치를 홈으로 설정
            vehicle = drone['vehicle']
            current_location = vehicle.location.global_relative_frame
            vehicle.home_location = current_location
            
            # 홈 위치 설정 확인
            if not vehicle.home_location:
                raise HTTPException(status_code=500, detail="홈 위치 설정에 실패했습니다.")
                
            return {
                "status": "success",
                "message": "현재 위치가 홈으로 설정되었습니다.",
                "home_position": {
                    "latitude": current_location.lat,
                    "longitude": current_location.lon,
                    "altitude": current_location.alt
                }
            }
        else:
            # 지정된 위치를 홈으로 설정
            vehicle = drone['vehicle']
            
            # 홈 위치 설정
            home_location = dronekit.LocationGlobalRelative(
                request.latitude,
                request.longitude,
                request.altitude
            )
            vehicle.home_location = home_location
            
            # 홈 위치 설정 확인
            if not vehicle.home_location:
                raise HTTPException(status_code=500, detail="홈 위치 설정에 실패했습니다.")
                
            return {
                "status": "success",
                "message": "지정된 위치가 홈으로 설정되었습니다.",
                "home_position": {
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "altitude": request.altitude
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
