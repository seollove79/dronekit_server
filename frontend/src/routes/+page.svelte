<script>
    import { onMount, onDestroy } from "svelte";
    import { browser } from '$app/environment';
    import DroneList from "$lib/components/DroneList.svelte";
    import FlyToCoordinatesModal from "$lib/components/FlyToCoordinatesModal.svelte";
    import FlyToAltitudeModal from "$lib/components/FlyToAltitudeModal.svelte";
    import { connectDrone, selectedDrone, flyToPosition, telemetryData, setHomePosition } from "$lib/stores/drones";
    import { mapViewer } from "$lib/stores/map";

    let mapController;
    let showAddDroneModal = false;
    let connectionType = "tcp";
    let droneId = "";
    let ipAddress = "127.0.0.1";
    let port = "5762";
    let isConnecting = false;
    let errorMessage = "";
    let map_viewer;
    let handler;
    
    // 컨텍스트 메뉴 관련 변수
    let showContextMenu = false;
    let contextMenuPosition = { x: 0, y: 0 };
    let selectedPosition = null;
    let selectedPositionHome = null;
    let rightMouseDownPosition = null;
    let isDragging = false;
    let lastRightClickTime = 0;
    
    // 마커와 선 관련 변수
    let positionMarker = null;
    let positionLine = null;

    let showFlyToCoordinatesModal = false;
    let showFlyToAltitudeModal = false;
    let selectedCoordinates = null;

    const handleAddDrone = () => {
        showAddDroneModal = true;
        errorMessage = "";
    };

    const handleClose = () => {
        showAddDroneModal = false;
        errorMessage = "";
    };

    const handleConnect = async () => {
        if (!droneId || !ipAddress || !port) {
            errorMessage = '모든 필드를 입력해주세요.';
            return;
        }

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

    // 마커와 선 제거
    function removePositionEntities() {
        if (!map_viewer) return;

        try {
            if (positionMarker) {
                map_viewer.entities.remove(positionMarker);
                positionMarker = null;
            }
            if (positionLine) {
                map_viewer.entities.remove(positionLine);
                positionLine = null;
            }
        } catch (error) {
            console.error('엔티티 제거 실패:', error);
        }
    }

    // 마커와 선 생성
    function createPositionEntities(longitude, latitude, altitude) {
        if (!map_viewer) {
            console.error('map_viewer가 초기화되지 않았습니다.');
            return;
        }

        // 기존 엔티티 제거
        removePositionEntities();

        console.log('마커 생성:', longitude, latitude, altitude + selectedPositionHome.height);

        try {
            console.log('마커 생성:', longitude, latitude, altitude + selectedPositionHome.height);
            // 구형 마커 생성
            positionMarker = map_viewer.entities.add({
                name: 'position-marker',
                position: Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude + selectedPositionHome.height),
                point: {
                    pixelSize: 10,  // 픽셀 단위
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                }
            });

            // 지표면까지의 점선 생성
            positionLine = map_viewer.entities.add({
                name: 'position-line',
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude + selectedPositionHome.height),
                        Cesium.Cartesian3.fromDegrees(longitude, latitude, 0)
                    ],
                    width: 3,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.YELLOW.withAlpha(0.7),
                        dashLength: 16.0,
                        dashPattern: parseInt('1111', 2)
                    })
                }
            });


        } catch (error) {
            console.error('엔티티 생성 실패:', error);
        }
    }

    // 윈도우 좌표를 캔버스 좌표로 변환하는 함수
    function windowToCanvasCoordinates(windowPosition) {
        const canvas = map_viewer.canvas;
        const rect = canvas.getBoundingClientRect();
        
        return new Cesium.Cartesian2(
            windowPosition.x - rect.left,
            windowPosition.y - rect.top
        );
    }

    // 컨텍스트 메뉴 처리 함수
    async function handleContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        
        if (isDragging) {
            isDragging = false;
            return;
        }
        
        const click = windowToCanvasCoordinates({
            x: event.clientX,
            y: event.clientY
        });
        
        const ray = map_viewer.camera.getPickRay(click);
        const cartesian = map_viewer.scene.globe.pick(ray, map_viewer.scene);
        
        if (cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;
            
            // 선택된 드론이 있는 경우 현재 고도 가져오기
            let altitude = height;
            if ($selectedDrone) {
                const telemetry = $telemetryData.get($selectedDrone.drone_id);
                altitude = telemetry?.altitude || height;
            }
            
            selectedPosition = { longitude, latitude, altitude };
            
            // 마커와 선 생성
            createPositionEntities(longitude, latitude, altitude);
            
            contextMenuPosition = {
                x: event.clientX,
                y: event.clientY
            };
            showContextMenu = true;
        }
    }

    // 컨텍스트 메뉴 항목 클릭 처리
    async function handleContextMenuAction(action) {
        if (!selectedPosition) return;

        try {
            switch (action) {
                case 'fly-to':
                    if (!$selectedDrone) {
                        alert('드론을 먼저 선택해주세요.');
                        return;
                    }
                    await flyToPosition($selectedDrone.drone_id, selectedPosition);
                    break;
                case 'fly-to-altitude':
                    showFlyToAltitudeModal = true;
                    break;
                case 'fly-to-coordinates':
                    selectedCoordinates = selectedPosition;
                    showFlyToCoordinatesModal = true;
                    break;
                case 'set-home':
                    if (!$selectedDrone) {
                        alert('드론을 먼저 선택해주세요.');
                        return;
                    }

                    await setHomePosition($selectedDrone.drone_id, selectedPositionHome);
                    alert('홈 위치가 설정되었습니다.');
                    break;
            }
        } catch (error) {
            console.error('명령 실행 실패:', error);
            alert(error.message || '명령 실행에 실패했습니다.');
        }
        
        showContextMenu = false;
    }

    async function handleFlyToCoordinates(event) {
        const { latitude, longitude, altitude } = event.detail;
        
        if (!$selectedDrone) {
            alert('드론을 먼저 선택해주세요.');
            return;
        }

        try {
            await flyToPosition($selectedDrone.drone_id, { latitude, longitude, altitude });
        } catch (error) {
            console.error('비행 명령 실행 실패:', error);
            alert(error.message || '비행 명령 실행에 실패했습니다.');
        }
    }

    async function handleFlyToAltitude(event) {
        const { altitude } = event.detail;
        
        if (!$selectedDrone) {
            alert('드론을 먼저 선택해주세요.');
            return;
        }

        try {
            await flyToPosition($selectedDrone.drone_id, {
                ...selectedPosition,
                altitude
            });
            showFlyToAltitudeModal = false;  // 비행 명령 실행 후 모달 닫기
        } catch (error) {
            console.error('비행 명령 실행 실패:', error);
            alert(error.message || '비행 명령 실행에 실패했습니다.');
        }
    }

    // 다른 곳 클릭시 메뉴 닫기
    function handleClickOutside(event) {
        if (event.target.closest('.context-menu')) {
            return;
        }
        showContextMenu = false;
        removePositionEntities();
    }

    onMount(async () => {
        if (!browser) return;

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
        map_viewer = ws3d.viewer;
        mapViewer.set(map_viewer);  // 스토어에 map_viewer 저장

        // ScreenSpaceEventHandler 설정
        handler = new Cesium.ScreenSpaceEventHandler(map_viewer.canvas);

        // 왼쪽 마우스 버튼 클릭 이벤트 처리
        handler.setInputAction((movement) => {
            const click = windowToCanvasCoordinates({
                x: movement.position.x,
                y: movement.position.y
            });
            
            const ray = map_viewer.camera.getPickRay(click);
            const cartesian = map_viewer.scene.globe.pick(ray, map_viewer.scene);
            
            if (cartesian) {
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude);
                const height = cartographic.height;
                
                console.log('클릭 위치:', {
                    longitude: longitude.toFixed(6),
                    latitude: latitude.toFixed(6),
                    altitude_asl: height.toFixed(2) + 'm'  // 해수면 고도
                });
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 오른쪽 마우스 버튼 이벤트 처리
        handler.setInputAction((movement) => {
            rightMouseDownPosition = { x: movement.position.x, y: movement.position.y };
            isDragging = false;
        }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

        handler.setInputAction((movement) => {
            if (rightMouseDownPosition) {
                const dx = movement.endPosition.x - rightMouseDownPosition.x;
                const dy = movement.endPosition.y - rightMouseDownPosition.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    isDragging = true;
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(async (movement) => {
            if (!isDragging) {
                const rect = map_viewer.canvas.getBoundingClientRect();
                const x = movement.position.x - rect.left;
                const y = movement.position.y - rect.top;
                
                const click = new Cesium.Cartesian2(x, y);
                const ray = map_viewer.camera.getPickRay(movement.position);
                const cartesian = map_viewer.scene.globe.pick(ray, map_viewer.scene);
                
                if (cartesian) {
                    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
                    const height = cartographic.height;
                    
                    // 선택된 드론이 있는 경우 현재 고도 가져오기
                    let altitude = height;
                    if ($selectedDrone) {
                        const telemetry = $telemetryData.get($selectedDrone.drone_id);
                        altitude = telemetry?.altitude || height;
                    }
                    
                    selectedPosition = { longitude, latitude, altitude };
                    selectedPositionHome = { longitude, latitude, height };
                    // 마커와 선 생성
                    createPositionEntities(longitude, latitude, altitude);
                    
                    contextMenuPosition = {
                        x: movement.position.x,
                        y: movement.position.y
                    };
                    showContextMenu = true;
                }
            }
            rightMouseDownPosition = null;
        }, Cesium.ScreenSpaceEventType.RIGHT_UP);

        // 컨텍스트 메뉴 이벤트
        const preventContextMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        // 모든 가능한 요소에 컨텍스트 메뉴 방지 이벤트 추가
        map_viewer.canvas.addEventListener('contextmenu', preventContextMenu, true);
        document.addEventListener('contextmenu', preventContextMenu, true);
        window.addEventListener('contextmenu', preventContextMenu, true);
        
        document.addEventListener('click', handleClickOutside);
    });

    // 컴포넌트가 제거될 때 이벤트 핸들러 정리
    onDestroy(() => {
        if (!browser) return;
        
        if (handler) {
            handler.destroy();
        }
        
        // 마커와 선 제거
        removePositionEntities();
        
        const preventContextMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
        
        if (map_viewer?.canvas) {
            map_viewer.canvas.removeEventListener('contextmenu', preventContextMenu, true);
        }
        document.removeEventListener('contextmenu', preventContextMenu, true);
        window.removeEventListener('contextmenu', preventContextMenu, true);
        document.removeEventListener('click', handleClickOutside);
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
    <button 
        class="map-overlay" 
        on:click={handleClickOutside}
        on:contextmenu|preventDefault|stopPropagation={(e) => {
            handleContextMenu(e);
        }}
        type="button"
        aria-label="지도 영역 클릭"
    ></button>
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
                    placeholder="드론 아이디 *" 
                    bind:value={droneId}
                    disabled={isConnecting}
                    required
                    aria-label="드론 아이디">
            </div>
            <div class="input-group">
                <input type="text" 
                    placeholder="드론 IP 주소 *" 
                    bind:value={ipAddress}
                    disabled={isConnecting}
                    required
                    aria-label="드론 IP 주소">
            </div>
            <div class="input-group">
                <input type="text" 
                    placeholder="포트 번호 *" 
                    bind:value={port}
                    disabled={isConnecting}
                    required
                    aria-label="포트 번호">
            </div>
        </div>
        <div class="modal-footer">
            <button class="cancel-button" 
                on:click={handleClose}
                disabled={isConnecting}>취소</button>
            <button class="connect-button" 
                on:click={handleConnect}
                disabled={isConnecting || !droneId || !ipAddress || !port}>
                {isConnecting ? '연결 중...' : '연결'}
            </button>
        </div>
    </div>
</div>
{/if}

{#if showContextMenu}
    <div 
        class="context-menu" 
        style="position: absolute; left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px; margin: 0;"
        role="menu"
        aria-label="지도 컨텍스트 메뉴"
    >
        <button 
            class="menu-item" 
            on:click={() => handleContextMenuAction('fly-to')}
            on:keydown={(e) => e.key === 'Enter' && handleContextMenuAction('fly-to')}
            role="menuitem"
        >
            이 위치로 비행
        </button>
        <button 
            class="menu-item" 
            on:click={() => handleContextMenuAction('fly-to-altitude')}
            on:keydown={(e) => e.key === 'Enter' && handleContextMenuAction('fly-to-altitude')}
            role="menuitem"
        >
            이 위치로 비행 (고도)
        </button>
        <button 
            class="menu-item" 
            on:click={() => handleContextMenuAction('fly-to-coordinates')}
            on:keydown={(e) => e.key === 'Enter' && handleContextMenuAction('fly-to-coordinates')}
            role="menuitem"
        >
            지정좌표로 비행
        </button>
        <button 
            class="menu-item" 
            on:click={() => handleContextMenuAction('set-home')}
            on:keydown={(e) => e.key === 'Enter' && handleContextMenuAction('set-home')}
            role="menuitem"
        >
            이 위치를 홈으로
        </button>
    </div>
{/if}

{#if showFlyToCoordinatesModal}
    <FlyToCoordinatesModal
        show={showFlyToCoordinatesModal}
        defaultLatitude={selectedCoordinates?.latitude}
        defaultLongitude={selectedCoordinates?.longitude}
        defaultAltitude={selectedCoordinates?.altitude}
        on:submit={handleFlyToCoordinates}
        on:close={() => showFlyToCoordinatesModal = false}
    />
{/if}

{#if showFlyToAltitudeModal}
    <FlyToAltitudeModal
        show={showFlyToAltitudeModal}
        defaultAltitude={selectedPosition?.altitude}
        on:submit={handleFlyToAltitude}
        on:close={() => showFlyToAltitudeModal = false}
    />
{/if}

<style>
    .map-container {
        width: 100%;
        height: 98%;
        position: relative;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .map-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        padding: 0;
        cursor: default;
        z-index: 0;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .map-overlay:focus {
        outline: none;
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

    .context-menu {
        background: #2A2A2A;
        border: 1px solid #404040;
        border-radius: 4px;
        padding: 4px 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
        min-width: 150px;
        margin: 0;
    }

    .menu-item {
        display: block;
        width: 100%;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        color: white;
        background: none;
        border: none;
        text-align: left;
        transition: background-color 0.2s;
    }

    .menu-item:hover,
    .menu-item:focus {
        background-color: #404040;
        outline: none;
    }
</style>