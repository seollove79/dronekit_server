<script>
    import { armDrone, disarmDrone, takeoffDrone, landDrone, changeFlightMode, getDroneTelemetry } from '../stores/drones';
    import TakeoffModal from './TakeoffModal.svelte';
    import { onMount, onDestroy, createEventDispatcher } from 'svelte';
    export let drone;
    export let telemetryData;

    let showTakeoffModal = false;
    let updateInterval;
    const dispatch = createEventDispatcher();

    // 비행 모드 목록
    const flightModes = [
        { value: 'STABILIZE', label: 'STABILIZE' },
        { value: 'ALT_HOLD', label: 'ALT HOLD' },
        { value: 'LOITER', label: 'LOITER' },
        { value: 'GUIDED', label: 'GUIDED' },
        { value: 'AUTO', label: 'AUTO' },
        { value: 'ZIGZAG', label: 'ZIGZAG' },
        { value: 'RTL', label: 'RTL' },
        { value: 'LAND', label: 'LAND' }
    ];

    let selectedMode = 'STABILIZE';

    // 텔레메트리 데이터 업데이트 함수
    async function updateTelemetry() {
        try {
            const newData = await getDroneTelemetry(drone.drone_id);
            dispatch('telemetryUpdate', newData);
        } catch (error) {
            console.error('텔레메트리 데이터 업데이트 실패:', error);
        }
    }

    onMount(() => {
        // 컴포넌트가 마운트될 때 텔레메트리 데이터 업데이트 시작
        updateTelemetry();
        // 1초마다 텔레메트리 데이터 업데이트
        updateInterval = setInterval(updateTelemetry, 1000);
    });

    onDestroy(() => {
        // 컴포넌트가 언마운트될 때 인터벌 정리
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    });

    async function handleArmDisarm() {
        try {
            if (!telemetryData.armed) {
                await armDrone(drone.drone_id);
            } else {
                await disarmDrone(drone.drone_id);
            }
        } catch (error) {
            console.error('시동/종료 실패:', error);
            alert('시동/종료에 실패했습니다: ' + error.message);
        }
    }

    function handleTakeoffClick() {
        if (!telemetryData.armed) {
            alert('드론의 시동이 꺼져있습니다. 먼저 시동을 켜주세요.');
            return;
        }
        showTakeoffModal = true;
    }

    async function handleTakeoff(event) {
        try {
            const { altitude } = event.detail;
            await takeoffDrone(drone.drone_id, altitude);
        } catch (error) {
            console.error('이륙 실패:', error);
            const errorMessage = error.message || '알 수 없는 오류가 발생했습니다';
            alert(`이륙에 실패했습니다.\n\n상세 오류: ${errorMessage}`);
        }
    }

    async function handleLand() {
        try {
            if (!telemetryData.armed) {
                alert('드론의 시동이 꺼져있습니다.');
                return;
            }
            await landDrone(drone.drone_id);
        } catch (error) {
            console.error('착륙 실패:', error);
            const errorMessage = error.message || '알 수 없는 오류가 발생했습니다';
            alert(`착륙에 실패했습니다.\n\n상세 오류: ${errorMessage}`);
        }
    }

    async function handleFlightModeChange() {
        try {
            await changeFlightMode(drone.drone_id, selectedMode);
        } catch (error) {
            console.error(`${selectedMode} 모드 변경 실패:`, error);
            const errorMessage = error.message || '알 수 없는 오류가 발생했습니다';
            alert(`${selectedMode} 모드 변경에 실패했습니다.\n\n상세 오류: ${errorMessage}`);
        }
    }
</script>

<div class="telemetry-data">
    <div class="telemetry-header">
        <span class="label">드론 ID:</span><span class="value">{drone.drone_id}</span>
    </div>
    
    <div class="telemetry-section">
        <div class="telemetry-row">
            <div class="telemetry-item">
                <span class="label">배터리</span>
                <span class="value">{telemetryData.battery?.toFixed(1)}V</span>
            </div>
            <div class="telemetry-item">
                <span class="label">GPS</span>
                <span class="value">{telemetryData.mode}</span>
            </div>
            <div class="telemetry-item">
                <span class="label">Signal</span>
                <span class="value">{(telemetryData.signal_strength * 100).toFixed(0)}%</span>
            </div>
        </div>
        
        <div class="telemetry-row status-row">
            <div class="status-item">{telemetryData.armed ? 'ARMED' : 'DISARMED'}</div>
            <div class="status-item">{telemetryData.mode}</div>
            <div class="status-item">OK</div>
        </div>

        <div class="telemetry-row">
            <div class="altitude-section">
                <div class="label">고도(m)</div>
                <div class="altitude-values">
                    <div class="altitude-item">
                        <span>{telemetryData.altitude?.toFixed(1)}</span>
                        <span class="sub-label">(상대)</span>
                    </div>
                    <div class="altitude-item">
                        <span>{telemetryData.altitude_asl?.toFixed(1)}</span>
                        <span class="sub-label">(해발)</span>
                    </div>
                </div>
            </div>
            <div class="speed-section">
                <div class="label">속도(m/s)</div>
                <div class="speed-values">
                    <div class="speed-item">
                        <span>{telemetryData.airspeed?.toFixed(1)}</span>
                        <span class="sub-label">(air)</span>
                    </div>
                    <div class="speed-item">
                        <span>{telemetryData.groundspeed?.toFixed(1)}</span>
                        <span class="sub-label">(Ground)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="control-section">
        <div class="section-title">시점제어</div>
        <div class="button-grid">
            <button class="control-button">위에서 보기</button>
            <button class="control-button">뒤에서 보기</button>
            <button class="control-button">FPV 시점</button>
        </div>
    </div>

    <div class="control-section">
        <div class="section-title">제어명령</div>
        <div class="button-grid">
            <button 
                class="control-button" 
                class:armed={telemetryData.armed}
                on:click={handleArmDisarm}
            >
                {telemetryData.armed ? '시동 종료' : '시동'}
            </button>
            <button 
                class="control-button"
                on:click={handleTakeoffClick}
                disabled={!telemetryData.armed}
            >
                이륙
            </button>
            <button 
                class="control-button"
                on:click={handleLand}
                disabled={!telemetryData.armed}
            >
                착륙
            </button>
        </div>
        <div class="button-grid">
            <select 
                bind:value={selectedMode}
                class="control-button"
            >
                {#each flightModes as mode}
                    <option value={mode.value}>{mode.label}</option>
                {/each}
            </select>
            <button 
                class="control-button"
                on:click={handleFlightModeChange}
            >
                모드변경
            </button>
            <button class="control-button">연결종료</button>
        </div>
        
    </div>

    <div class="control-section">
        <div class="section-title">비행계획</div>
        <div class="button-grid">
            <button class="control-button">계획모드활성화</button>
            <button class="control-button">계획전송</button>
            <button class="control-button">자동비행시작</button>
            <button class="control-button">읽어오기</button>
            <button class="control-button">회편조기화</button>
            <button class="control-button">자동비행중지</button>
        </div>
    </div>
</div>

<TakeoffModal 
    bind:show={showTakeoffModal}
    defaultAltitude={3}
    on:submit={handleTakeoff}
/>

<style>
    .telemetry-data {
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        padding: 10px;
        margin-top: 16px;
        width: 350px;
        position: fixed;
        right: 10px;
        top: 120px;
    }

    .telemetry-header {
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .telemetry-header .label {
        margin-bottom: 0;
    }

    .telemetry-section {
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 10px;
    }

    .telemetry-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
    }

    .telemetry-item {
        flex: 1;
    }


    .status-row {
        background-color: #1a1a1a;
        padding: 8px;
        border-radius: 4px;
        margin: 12px 0;
    }

    .status-item {
        color: #FFDA52;
        font-size: 12px;
        text-align: center;
    }

    .label {
        color: #888;
        font-size: 12px;
        margin-bottom: 4px;
        display: block;
    }

    .value {
        color: white;
        font-size: 14px;
        font-weight: 500;
    }

    .altitude-section, .speed-section {
        flex: 1;
    }

    .altitude-values, .speed-values {
        display: flex;
        gap: 12px;
    }

    .altitude-item, .speed-item {
        color: white;
        font-size: 14px;
    }

    .sub-label {
        color: #888;
        font-size: 12px;
        margin-left: 4px;
    }

    .control-section {
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 10px;
    }

    .section-title {
        color: white;
        font-size: 14px;
        margin-bottom: 12px;
    }

    .button-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 8px;
    }

    .control-button {
        background-color: #1a1a1a;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .control-button:hover {
        background-color: #333;
    }

    .control-button.armed {
        background-color: #FF4444;
    }

    .control-button.armed:hover {
        background-color: #CC3333;
    }

    .control-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .control-button:disabled:hover {
        background-color: #1a1a1a;
    }
</style> 