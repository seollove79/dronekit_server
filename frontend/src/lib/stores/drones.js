import { writable, derived, get } from 'svelte/store';
import { droneApi } from '../services/api';

// restAPI 통해서 가지고온 드론 목록을 저장할 스토어 생성
export const drones = writable([]);

// 소켓 연결된 드론 목록을 저장할 스토어 생성
export const drones_socket = writable([]);

// 소켓서버 connection 관리용 스토어 생성
export const wsConnection = writable(null);

// 소켓서버로 명령 보내는 메소드 생성
export function sendSocketCommand(target_drone, command, parameters = {}) {
    const socket = get(wsConnection);
    if (socket && socket.readyState === WebSocket.OPEN) {
        const message = JSON.stringify(
            { 
                type: "command",
                target_drone: target_drone,
                command: command,
                parameters: parameters
            }
        );
        console.log('소켓 명령 전송:', message);
        socket.send(message);
    } else {
        console.error('소켓이 열려 있지 않습니다. 명령을 보낼 수 없습니다.');
    }
}

// socket드론의 텔레메트리 데이터 Map을 저장할 스토어 생성
const telemetryMapSocket = writable(new Map());

// 소켓 텔레메트리 데이터를 외부에서 사용할 수 있도록 export
export const telemetryDataSocket = derived(telemetryMapSocket, $telemetryMapSocket => $telemetryMapSocket);

// 소켓 메시지 처리 루프
export async function handleSocketMessages() {
    const socket = get(wsConnection);
    if (!socket) {
        console.error('소켓 연결이 없습니다.');
        return;
    }
    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'client_list') {
            let socketDrones = [];
            let droneList = message.drones;
            for (const drone of droneList) {
                let newDrone = {
                    id: drone,
                    type: 'socket',
                };
                socketDrones.push(newDrone);
            }
            drones_socket.set(socketDrones);
        }

        if (message.type === 'drone_status') {
            let telemetryData = {
                drone_id: message.drone,
                airspeed: message.status.airspeed,
                altitude: message.position.altitude_relative,
                altitude_asl: message.position.altitude,
                armed: message.status.armed,
                battery: message.status.battery_voltage,
                groundspeed: message.status.groundspeed,
                heading: message.status.heading,
                home_altitude: 0,
                home_latitude: 0,
                home_longitude: 0,
                latitude: message.position.latitude,
                longitude: message.position.longitude,
                mode: message.status.mode,
                pitch: message.status.pitch,
                roll: message.status.roll,
                signal_strength: 0,
                yaw: message.status.yaw,
            };

            // telemetryMapSocket에 모든 소켓 드론 데이터 누적
            telemetryMapSocket.update(currentMap => {
                const newMap = new Map(currentMap);
                newMap.set(message.drone, telemetryData);
                return newMap;
            });

            // console.log('텔레메트리 데이터 업데이트:', telemetryData);
            // console.log('telemetryMapSocket 현재 상태:', get(telemetryMapSocket));
        }

        
    };
    socket.onerror = (error) => {
        console.error('소켓 오류:', error);
        // 오류 처리 로직 추가
    };
    socket.onclose = () => {
        console.log('소켓 연결이 종료되었습니다.');
        // 연결 종료 처리 로직 추가
        wsConnection.set(null); // 연결 상태 초기화
    };
};

// 선택된 드론을 저장할 스토어 생성
export const selectedDrone = writable(null);
// 각 드론의 텔레메트리 데이터를 저장할 Map
const telemetryMap = writable(new Map());

// 텔레메트리 데이터 업데이트
export async function updateTelemetry() {
    const currentDrones = get(drones);
    const newTelemetryMap = new Map();
    
    for (const drone of currentDrones) {
        try {
            const data = await droneApi.getTelemetry(drone.id);
            newTelemetryMap.set(drone.id, data);
        } catch (error) {
            console.error('텔레메트리 데이터 조회 실패:', error);
        }
    }
    telemetryMap.set(newTelemetryMap);
}

// 특정 드론의 텔레메트리 데이터 가져오기
export function getDroneTelemetry(droneId) {
    return get(telemetryMap).get(droneId);
}

export function getDroneTelemetrySocket(droneId) {
    return get(telemetryMapSocket).get(droneId);
}

// 텔레메트리 데이터 스토어
export const telemetryData = derived(telemetryMap, $telemetryMap => $telemetryMap);

// 선택된 드론 설정
export function setSelectedDrone(drone) {
    selectedDrone.set(drone);
}

// 선택된 드론 해제
export function clearSelectedDrone() {
    selectedDrone.set(null);
}

// 드론 목록 새로고침
export async function refreshDrones() {
    try {
        const droneList = await droneApi.getList();
        let restDrones=[];
        for (const drone of droneList) {
            let newDrone = {
                id: drone,
                type: 'rest',
            }
            restDrones.push(newDrone);
        }
        drones.set(restDrones)
        return droneList;
    } catch (error) {
        console.error('드론 목록 조회 실패:', error);
        throw error;
    }
}

// 드론 연결
export async function connectDrone(droneId, connectionString, connectionType) {
    try {
        if (connectionType === 'socket') {
            // 소켓 연결 로직
            const existingDrones = get(drones_socket);
            const existingDrone = existingDrones.find(d => d.id === droneId);

            const socket = new WebSocket(connectionString);
            console.log(socket);
            
        } else {
            await droneApi.connect(droneId, connectionString);
        }
        await refreshDrones(); // 목록 새로고침
    } catch (error) {
        console.error('드론 연결 실패:', error);
        throw error;
    }
}

// 드론 연결 해제
export async function disconnectDrone(drone) {
    if (drone.type === 'socket') {
        alert('소켓 드론은 연결 해제 기능이 없습니다.');
        return;
    }
    try {
        await droneApi.disconnect(drone.id);
        await refreshDrones(); // 목록 새로고침
    } catch (error) {
        console.error('드론 연결 해제 실패:', error);
        throw error;
    }
}

// 드론 시동
export async function armDrone(drone) {
    try {
        if (drone.drone_type === 'socket') {
            // 소켓드론 시동 처리
            sendSocketCommand(drone.drone_id, 'arm');
            return;
        } else {
            await droneApi.arm(drone.drone_id);
        }
    } catch (error) {
        console.error('드론 시동 실패:', error);
        throw error;
    }
}

// 드론 시동 종료
export async function disarmDrone(droneId) {
    try {
        await droneApi.disarm(droneId);
    } catch (error) {
        console.error('드론 시동 종료 실패:', error);
        throw error;
    }
}

// 드론 이륙
export async function takeoffDrone(droneId, altitude = 3) {  // 기본 고도 3m
    try {
        await droneApi.takeoff(droneId, altitude);
    } catch (error) {
        console.error('드론 이륙 실패:', {
            message: error.message,
            status: error.status,
            details: error.response?.data
        });
        
        // ApiError인 경우 직접 메시지 사용
        if (error.status) {
            throw new Error(`드론 이륙 실패: ${error.message}`);
        }
        
        // 기타 에러 처리
        throw new Error(`드론 이륙 실패: ${error.message || '알 수 없는 오류가 발생했습니다'}`);
    }
}

// 드론 착륙
export async function landDrone(droneId) {
    try {
        await droneApi.land(droneId);
    } catch (error) {
        console.error('드론 착륙 실패:', {
            message: error.message,
            status: error.status,
            details: error.response?.data
        });
        
        // ApiError인 경우 직접 메시지 사용
        if (error.status) {
            throw new Error(`드론 착륙 실패: ${error.message}`);
        }
        
        // 기타 에러 처리
        throw new Error(`드론 착륙 실패: ${error.message || '알 수 없는 오류가 발생했습니다'}`);
    }
}

// 드론 비행 모드 변경
export async function changeFlightMode(drone, mode) {
    try {
        if (drone.drone_type === 'rest') {
            await droneApi.changeFlightMode(drone.drone_id, mode);
        }
        else if (drone.drone_type === 'socket') {
            // 소켓 드론의 경우 소켓 명령으로 처리
            sendSocketCommand(drone.drone_id, 'set_mode', { mode: mode });
        }
    } catch (error) {
        console.error('비행 모드 변경 실패:', {
            message: error.message,
            status: error.status,
            details: error.response?.data
        });
        
        // ApiError인 경우 직접 메시지 사용
        if (error.status) {
            throw new Error(`비행 모드 변경 실패: ${error.message}`);
        }
        
        // 기타 에러 처리
        throw new Error(`비행 모드 변경 실패: ${error.message || '알 수 없는 오류가 발생했습니다'}`);
    }
}

// 현재 고도 유지하며 특정 위치로 비행
export async function flyToPosition(droneId, position) {
    try {
        await droneApi.flyToPosition(droneId, position);
    } catch (error) {
        console.error('드론 비행 실패:', {
            message: error.message,
            status: error.status,
            details: error.response?.data
        });
        
        // ApiError인 경우 직접 메시지 사용
        if (error.status) {
            throw new Error(`드론 비행 실패: ${error.message}`);
        }
        
        // 기타 에러 처리
        throw new Error(`드론 비행 실패: ${error.message || '알 수 없는 오류가 발생했습니다'}`);
    }
}

// 홈 위치 설정
export async function setHomePosition(droneId, position) {
    try {
        await droneApi.setHomePosition(droneId, position);
    } catch (error) {
        console.error('홈 위치 설정 실패:', {
            message: error.message,
            status: error.status,
            details: error.response?.data
        });
        
        // ApiError인 경우 직접 메시지 사용
        if (error.status) {
            throw new Error(`홈 위치 설정 실패: ${error.message}`);
        }
        
        // 기타 에러 처리
        throw new Error(`홈 위치 설정 실패: ${error.message || '알 수 없는 오류가 발생했습니다'}`);
    }
} 

// 미션 목록 조회
export async function getMissionList(droneId) {
    try {
        const missionList = await droneApi.downloadMission(droneId);
        return missionList;
    } catch (error) {
        console.error('미션 목록 조회 실패:', error);
        throw error;
    }
}
