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