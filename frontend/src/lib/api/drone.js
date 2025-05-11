const API_BASE_URL = '/api';

export async function getDroneMission(droneId) {
    try {
        const response = await fetch(`${API_BASE_URL}/drones/${droneId}/mission`);
        if (!response.ok) {
            throw new Error('미션을 읽어오는데 실패했습니다.');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('미션 읽기 오류:', error);
        throw error;
    }
} 