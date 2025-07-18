import { writable, derived, get } from 'svelte/store';
import { droneApi } from '../services/api';

// restAPI 통해서 가지고온 드론 목록을 저장할 스토어 생성
export const drones = writable([]);

// 소켓 연결된 드론 목록을 저장할 스토어 생성
export const drones_socket = writable([]);

// 소켓서버 connection 관리용 스토어 생성
export const wsConnection = writable(null);

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
            let droneList = message.drones;
            drones_socket.set(droneList);
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
    
    for (const droneId of currentDrones) {
        try {
            const data = await droneApi.getTelemetry(droneId);
            newTelemetryMap.set(droneId, data);
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
        // let restDrones=[];
        // for (const drone of droneList) {
        //     let newDrone = {
        //         id: drone,
        //         type: 'rest',
        //     }
        //     restDrones.push(newDrone);
        // }

        // console.log('드론 목록:', restDrones);
        // drones.set(restDrones)
        drones.set(droneList);
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
export async function disconnectDrone(droneId) {
    try {
        await droneApi.disconnect(droneId);
        await refreshDrones(); // 목록 새로고침
    } catch (error) {
        console.error('드론 연결 해제 실패:', error);
        throw error;
    }
}

// 드론 시동
export async function armDrone(droneId) {
    try {
        await droneApi.arm(droneId);
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
export async function changeFlightMode(droneId, mode) {
    try {
        await droneApi.changeFlightMode(droneId, mode);
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
