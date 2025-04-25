<script>
    import { onMount } from "svelte";
    import DroneList from "$lib/components/DroneList.svelte";
    import { connectDrone } from "$lib/stores/drones";

    let mapController;
    let showAddDroneModal = false;
    let connectionType = "tcp";
    let droneId = "";
    let ipAddress = "127.0.0.1";
    let port = "5762";
    let isConnecting = false;
    let errorMessage = "";
    
    const handleAddDrone = () => {
        showAddDroneModal = true;
        errorMessage = "";
    };

    const handleClose = () => {
        showAddDroneModal = false;
        errorMessage = "";
    };

    const handleConnect = async () => {
        try {
            isConnecting = true;
            errorMessage = "";
            
            const connectionString = `${connectionType}:${ipAddress}:${port}`;
            await connectDrone(droneId, connectionString);

            showAddDroneModal = false;
        } catch (error) {
            console.error('드론 연결 오류:', error);
            errorMessage = error.message || '드론 연결에 실패했습니다.';
        } finally {
            isConnecting = false;
        }
    };

    onMount(async () => {
        vw.MapControllerOption = {
            container : "vmap",
            mapMode : "ws3d-map",
            basemapType : vw.ol3.BasemapType.GRAPHIC,
            controlDensity : vw.ol3.DensityType.BASIC,
            interactionDensity : vw.ol3.DensityType.BASIC,
            controlsAutoArrange : true,
            homePosition : vw.ol3.CameraPosition,
            initPosition : vw.ol3.CameraPosition,
            useControl : false,
        };
        mapController = new vw.MapController(vw.MapControllerOption);
    });
</script>

<div class="map-container">
    <div id="vmap"></div>
    <div class="button-container">
        <button class="add-drone-button" on:click={handleAddDrone}>
            <span class="plus-icon">+</span>
            <span class="button-text">드론<br/>추가</span>
        </button>
    </div>
    <div class="drone-list-wrapper">
        <DroneList />
    </div>
</div>

{#if showAddDroneModal}
<div class="modal-backdrop">
    <div class="modal">
        <div class="modal-header">
            <h2>드론연결정보</h2>
            <button class="close-button" on:click={handleClose} aria-label="닫기">×</button>
        </div>
        <div class="modal-content">
            {#if errorMessage}
                <div class="error-message" role="alert">{errorMessage}</div>
            {/if}
            <div class="input-group">
                <select bind:value={connectionType} disabled={isConnecting}>
                    <option value="tcp">TCP</option>
                </select>
            </div>
            <div class="input-group">
                <input type="text" 
                    placeholder="드론 아이디" 
                    bind:value={droneId}
                    disabled={isConnecting}
                    aria-label="드론 아이디">
            </div>
            <div class="input-group">
                <input type="text" 
                    placeholder="드론 IP 주소" 
                    bind:value={ipAddress}
                    disabled={isConnecting}
                    aria-label="드론 IP 주소">
            </div>
            <div class="input-group">
                <input type="text" 
                    placeholder="포트 번호" 
                    bind:value={port}
                    disabled={isConnecting}
                    aria-label="포트 번호">
            </div>
        </div>
        <div class="modal-footer">
            <button class="cancel-button" 
                on:click={handleClose}
                disabled={isConnecting}>취소</button>
            <button class="connect-button" 
                on:click={handleConnect}
                disabled={isConnecting}>
                {isConnecting ? '연결 중...' : '연결'}
            </button>
        </div>
    </div>
</div>
{/if}

<style>
    .map-container {
        width: 100%;
        height: 98%;
        position: relative;
    }

    #vmap {
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
    }

    .button-container {
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1000;
    }

    .add-drone-button {
        background-color: black;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px;
        width: 50px;
        height: 65px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: background-color 0.2s;
    }

    .add-drone-button:hover {
        background-color: blue;
    }

    .plus-icon {
        font-size: 20px;
        font-weight: normal;
    }

    .button-text {
        font-size: 12px;
        text-align: center;
        line-height: 1.2;
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }

    .modal {
        background-color: #2A2A2A;
        border-radius: 8px;
        width: 400px;
        color: white;
    }

    .modal-header {
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #404040;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: normal;
    }

    .close-button {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
    }

    .modal-content {
        padding: 20px;
    }

    .input-group {
        margin-bottom: 12px;
    }

    .input-group select,
    .input-group input {
        width: 100%;
        padding: 10px;
        background-color: #404040;
        border: none;
        border-radius: 4px;
        color: white;
        font-size: 14px;
    }

    .input-group input::placeholder {
        color: #888;
    }

    .input-group input:disabled,
    .input-group select:disabled {
        background-color: #333;
        color: #888;
    }

    .modal-footer {
        padding: 16px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid #404040;
    }

    .cancel-button {
        background-color: #404040;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 24px;
        cursor: pointer;
        font-size: 14px;
    }

    .connect-button {
        background-color: #00FFBF;
        color: black;
        border: none;
        border-radius: 4px;
        padding: 8px 24px;
        cursor: pointer;
        font-size: 14px;
    }

    .connect-button:hover {
        background-color: #00E6AC;
    }

    .error-message {
        background-color: rgba(255, 0, 0, 0.1);
        color: #ff4444;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 12px;
        font-size: 14px;
    }

    .cancel-button:disabled,
    .connect-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .drone-list-wrapper {
        position: absolute;
        top: 10px;
        right: 80px;
        z-index: 1000;
    }
</style>