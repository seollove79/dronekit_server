import { API_CONFIG } from '../config';

// API 요청에 사용할 기본 설정
const defaultOptions = {
    headers: {
        'Content-Type': 'application/json',
    },
};

// API 에러 처리를 위한 커스텀 에러 클래스
class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// API 요청 래퍼 함수
async function fetchApi(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            // 422 에러 처리
            if (response.status === 422) {
                const errorDetail = data.detail || data.message || '입력값이 올바르지 않습니다.';
                throw new ApiError(response.status, errorDetail);
            }
            
            // 기타 에러 처리
            const errorMessage = data.detail || data.message || '서버 오류가 발생했습니다.';
            throw new ApiError(response.status, errorMessage);
        }

        return data;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        
        // 네트워크 오류나 CORS 오류 등
        console.error('API 요청 오류:', error);
        throw new ApiError(0, '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
    }
}

// 드론 관련 API 서비스
export const droneApi = {
    // 드론 목록 조회
    getList: async () => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.BASE);
    },

    // 드론 연결
    connect: async (drone_id, connection_string) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.CONNECT, {
            method: 'POST',
            body: JSON.stringify({ drone_id, connection_string }),
        });
    },

    // 드론 연결 해제
    disconnect: async (droneId) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.DISCONNECT(droneId), {
            method: 'DELETE',
        });
    },

    // 드론 텔레메트리 데이터 조회
    getTelemetry: async (droneId) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.TELEMETRY(droneId));
    },

    // 드론 Arm
    arm: async (droneId) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.ARM(droneId), {
            method: 'POST',
        });
    },

    // 드론 Disarm
    disarm: async (droneId) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.DISARM(droneId), {
            method: 'POST',
        });
    },

    // 드론 명령 실행
    executeCommand: async (droneId, command) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.COMMAND(droneId), {
            method: 'POST',
            body: JSON.stringify(command),
        });
    },

    // 드론 이륙
    takeoff: async (droneId, altitude) => {
        return await fetchApi(`${API_CONFIG.ENDPOINTS.DRONES.TAKEOFF(droneId)}?altitude=${altitude}`, {
            method: 'POST',
        });
    },

    // 드론 착륙
    land: async (droneId) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.LAND(droneId), {
            method: 'POST',
        });
    },

    // 드론 비행 모드 변경
    changeFlightMode: async (droneId, mode) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.MODE(droneId), {
            method: 'POST',
            body: JSON.stringify({ mode }),
        });
    },

    // 현재 고도 유지하며 특정 위치로 비행
    flyToPosition: async (droneId, position) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.FLY_TO(droneId), {
            method: 'POST',
            body: JSON.stringify({
                "latitude": position.latitude,
                "longitude": position.longitude,
                "altitude": position.altitude
            }),
        });
    },

    // 홈 위치 설정
    setHomePosition: async (droneId, position) => {
        console.log('홈 위치 설정:', droneId, position);
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.HOME_POSITION(droneId), {
            method: 'POST',
            body: JSON.stringify({
                "latitude": position.latitude,
                "longitude": position.longitude,
                "altitude": position.height,
                "set_current": false
            }),
        });
    },

    // 드론 미션 업로드
    uploadMission: async (droneId, mission) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.MISSION(droneId), {
            method: 'POST',
            body: JSON.stringify(mission),
        });
    },

    // 드론 미션 다운로드
    downloadMission: async (droneId) => {
        return await fetchApi(API_CONFIG.ENDPOINTS.DRONES.MISSION(droneId), {
            method: 'GET',
        });
    },
};