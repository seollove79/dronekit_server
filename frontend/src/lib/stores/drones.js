import { writable } from 'svelte/store';
import { droneApi } from '../services/api';

// 드론 목록을 저장할 스토어 생성
export const drones = writable([]);

// 드론 목록 새로고침
export async function refreshDrones() {
    try {
        const droneList = await droneApi.getList();
        drones.set(droneList);
        return droneList;
    } catch (error) {
        console.error('드론 목록 조회 실패:', error);
        throw error;
    }
}

// 드론 연결
export async function connectDrone(droneId, connectionString) {
    try {
        await droneApi.connect(droneId, connectionString);
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

// 드론 상태 조회
export async function getDroneTelemetry(droneId) {
    try {
        return await droneApi.getTelemetry(droneId);
    } catch (error) {
        console.error('드론 상태 조회 실패:', error);
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