<script>
    import { onMount, onDestroy } from 'svelte';
    import { drones, drones_socket, selectedDrone, refreshDrones, disconnectDrone, telemetryData, updateTelemetry, telemetryDataSocket } from '../stores/drones';
    import DroneCard from './DroneCard.svelte';
    import DroneStatus from './DroneStatus.svelte';

    export let showStatus = true;  // 기본값은 true로 설정
    export let rightOffset = 70;   // 기본값은 70px로 설정

    let updateInterval;
    let telemetryInterval;

    // 드론 목록 주기적 업데이트
    async function startUpdates() {
        await refreshDrones();
        updateInterval = setInterval(refreshDrones, 5000); // 5초마다 업데이트
    }

    // 드론 선택
    function selectDrone(drone) {
        if ($selectedDrone?.drone_id === drone.drone_id) {
            // 이미 선택된 드론을 다시 클릭하면 선택 해제
            selectedDrone.set(null);
        } else {
            // 새로운 드론 선택
            selectedDrone.set(drone);
            
            // 선택된 드론의 텔레메트리 데이터로 카메라 이동
            let telemetry;
            if (drone.type === 'socket') {
                telemetry = $telemetryDataSocket.get(drone.drone_id);
            } else {
                telemetry = $telemetryData.get(drone.drone_id);
            }
            if (telemetry) {
                const position = Cesium.Cartesian3.fromDegrees(
                    telemetry.longitude,
                    telemetry.latitude,
                    telemetry.altitude_asl + 7.7 // DRONE_ALTITUDE_OFFSET
                );
                
                // 카메라를 드론의 수직 상단 50m 위에 위치시킴
                const cameraPosition = Cesium.Cartesian3.fromDegrees(
                    telemetry.longitude,
                    telemetry.latitude,
                    telemetry.altitude_asl + 7.7 + 50 // 드론 위치 + 50m
                );
                
                ws3d.viewer.camera.flyTo({
                    destination: cameraPosition,
                    orientation: {
                        heading: Cesium.Math.toRadians(0),
                        pitch: Cesium.Math.toRadians(-90), // 수직 아래를 바라봄
                        roll: 0
                    },
                    duration: 2
                });
            }
        }
    }

    // 드론 연결 해제
    async function handleDisconnect(drone) {
        console.log('드론 연결 해제:', drone);
        try {
            await disconnectDrone(drone);
            if ($selectedDrone?.drone_id === drone.id) {
                selectedDrone.set(null);
            }
        } catch (error) {
            console.error('드론 연결 해제 실패:', error);
        }
    }

    onMount(() => {
        startUpdates();
        // 모든 드론의 텔레메트리 데이터 업데이트 시작
        updateTelemetry();
        telemetryInterval = setInterval(updateTelemetry, 1000);
    });

    onDestroy(() => {
        if (updateInterval) clearInterval(updateInterval);
        if (telemetryInterval) clearInterval(telemetryInterval);
    });
</script>

<div class="drone-list-container" style="right: {rightOffset}px;">
    <div class="drone-list">
        {#if $drones.length === 0 && $drones_socket.length === 0}
            <p class="no-drones">연결된 드론이 없습니다.</p>
        {:else}
            <div class="drone-cards">
                {#each $drones as drone}
                    <DroneCard 
                        drone={{ drone_id: drone.id, type: drone.type }}
                        isSelected={$selectedDrone?.drone_id === drone.id}
                        onSelect={(drone) => selectDrone(drone)}
                    />
                {/each}
                {#each $drones_socket as drone}
                    <DroneCard 
                        drone={{ drone_id: drone.id, type: drone.type }}
                        isSelected={$selectedDrone?.drone_id === drone.id}
                        onSelect={(drone) => selectDrone(drone)}
                    />
                {/each}
            </div>
        {/if}
    </div>

    {#each $drones as drone}
        <div class="drone-status-wrapper" class:visible={showStatus && $selectedDrone?.drone_id === drone.id}>
            <DroneStatus 
                drone={{ drone_id: drone.id, drone_type: drone.type }} 
                telemetryData={$telemetryData.get(drone.id)}
                on:disconnect={() => handleDisconnect(drone.id)}
            />
        </div>
    {/each}
    {#each $drones_socket as drone}
        <div class="drone-status-wrapper" class:visible={showStatus && $selectedDrone?.drone_id === drone.id}>
            <DroneStatus 
                drone={{ drone_id: drone.id, drone_type: drone.type }} 
                telemetryData={$telemetryDataSocket.get(drone.id)}
                on:disconnect={() => handleDisconnect(drone)}
            />
        </div>
    {/each}
</div>

<style>
    .drone-list-container {
        position: fixed;
        top: 48px;
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

    .drone-status-wrapper {
        position: absolute;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .drone-status-wrapper.visible {
        visibility: visible;
        opacity: 1;
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