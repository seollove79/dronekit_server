// API 기본 설정
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',  // FastAPI 서버 주소
    ENDPOINTS: {
        DRONES: {
            BASE: '/drones',
            CONNECT: '/drones/connect',
            TELEMETRY: (droneId) => `/drones/${droneId}/telemetry`,
            ARM: (droneId) => `/drones/${droneId}/arm`,
            DISARM: (droneId) => `/drones/${droneId}/disarm`,
            DISCONNECT: (droneId) => `/drones/${droneId}`,
            COMMAND: (droneId) => `/drones/${droneId}/command`,
            TAKEOFF: (droneId) => `/drones/${droneId}/takeoff`,
            LAND: (droneId) => `/drones/${droneId}/land`,
            MISSION: (droneId) => `/drones/${droneId}/mission`,
            MODE: (droneId) => `/drones/${droneId}/mode`,
            FLY_TO: (droneId) => `/drones/${droneId}/fly-to`
        },
        MISSION: {
            CREATE: '/mission/create',
            UPDATE: '/mission/update',
            DELETE: '/mission/delete',
            LIST: '/mission/list'
        }
    }
}; 