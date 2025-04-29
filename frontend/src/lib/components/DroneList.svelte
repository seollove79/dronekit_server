<script>
    import { onMount, onDestroy } from 'svelte';
    import { drones, refreshDrones, disconnectDrone, getDroneTelemetry } from '../stores/drones';
    import DroneCard from './DroneCard.svelte';
    import DroneStatus from './DroneStatus.svelte';

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
        if (selectedDrone?.drone_id === drone.drone_id) {
            // 이미 선택된 드론을 다시 클릭하면 선택 해제
            selectedDrone = null;
            telemetryData = null;
        } else {
            // 새로운 드론 선택
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
        <DroneStatus drone={selectedDrone} telemetryData={telemetryData} />
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
        align-items: flex-end;
    }

    .drone-cards {
        display: flex;
        flex-direction: row;
        gap: 8px;
        align-items: flex-start;
        flex-wrap: wrap;
        justify-content: flex-end;
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
</style> 