<script>
    import { onMount, onDestroy } from 'svelte';
    import { drones, refreshDrones, disconnectDrone, getDroneTelemetry } from '../stores/drones';
    import DroneCard from './DroneCard.svelte';

    let updateInterval;
    let selectedDrone = null;
    let telemetryData = null;

    // 드론 목록 주기적 업데이트
    async function startUpdates() {
        await refreshDrones();
        updateInterval = setInterval(refreshDrones, 5000); // 5초마다 업데이트
    }

    // 드론 선택
    async function selectDrone(drone) {
        selectedDrone = drone;
        if (drone) {
            try {
                telemetryData = await getDroneTelemetry(drone.drone_id);
            } catch (error) {
                console.error('텔레메트리 데이터 조회 실패:', error);
            }
        } else {
            telemetryData = null;
        }
    }

    // 드론 연결 해제
    async function handleDisconnect(droneId) {
        try {
            await disconnectDrone(droneId);
            if (selectedDrone?.drone_id === droneId) {
                selectedDrone = null;
                telemetryData = null;
            }
        } catch (error) {
            console.error('드론 연결 해제 실패:', error);
        }
    }

    onMount(startUpdates);
    onDestroy(() => {
        if (updateInterval) clearInterval(updateInterval);
    });

    // 디버깅용 로그
    $: console.log('현재 드론 목록:', $drones);
</script>

<div class="drone-list-container">
    <div class="drone-list">
        {#if $drones.length === 0}
            <p class="no-drones">연결된 드론이 없습니다.</p>
        {:else}
            <div class="drone-cards">
                {#each $drones as droneId (droneId)}
                    <DroneCard 
                        drone={{ drone_id: droneId }}
                        isSelected={selectedDrone?.drone_id === droneId}
                        onSelect={(drone) => selectDrone(drone)}
                    />
                {/each}
            </div>
        {/if}
    </div>

    {#if selectedDrone && telemetryData}
        <div class="telemetry-data">
            <h3>{selectedDrone.drone_id} 상태 정보</h3>
            <div class="telemetry-grid">
                <div class="telemetry-item">
                    <span class="label">고도</span>
                    <span class="value">{telemetryData.altitude.toFixed(1)}m</span>
                </div>
                <div class="telemetry-item">
                    <span class="label">속도</span>
                    <span class="value">{telemetryData.groundspeed.toFixed(1)}m/s</span>
                </div>
                <div class="telemetry-item">
                    <span class="label">배터리</span>
                    <span class="value">{telemetryData.battery}%</span>
                </div>
                <div class="telemetry-item">
                    <span class="label">비행 모드</span>
                    <span class="value">{telemetryData.mode}</span>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .drone-list-container {
        position: fixed;
        top: 48px;
        right: 70px;
        z-index: 1000;
        padding-top: 10px;
        max-height: 100vh;
        overflow-y: auto;
    }

    .drone-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .drone-cards {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
    }

    .no-drones {
        color: rgba(255, 255, 255, 0.6);
        text-align: right;
        padding: 8px;
        font-size: 14px;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 4px;
    }

    /* 스크롤바 스타일링 */
    .drone-list-container::-webkit-scrollbar {
        width: 6px;
    }

    .drone-list-container::-webkit-scrollbar-track {
        background: transparent;
    }

    .drone-list-container::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
    }

    .drone-list-container::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.5);
    }

    .telemetry-data {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #404040;
    }

    h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: normal;
    }

    .telemetry-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }

    .telemetry-item {
        background-color: #333;
        padding: 12px;
        border-radius: 4px;
    }

    .label {
        display: block;
        font-size: 12px;
        color: #888;
        margin-bottom: 4px;
    }

    .value {
        font-size: 16px;
        font-weight: bold;
    }
</style> 