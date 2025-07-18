// API 기본 설정
export const API_CONFIG = {
    BASE_URL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000'  // 개발 환경
        : 'https://dronekit.vandi.kr',  // 프로덕션 환경
    ENDPOINTS: {
        DRONES: {
            BASE: '/drones/',
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
            FLY_TO: (droneId) => `/drones/${droneId}/fly-to`,
            HOME_POSITION: (droneId) => `/drones/${droneId}/home-position`
        },
        // MISSION: {
        //     CREATE: '/mission/create',
        //     UPDATE: '/mission/update',
        //     DELETE: '/mission/delete',
        //     LIST: '/mission/list'
        // }
    }
}; 