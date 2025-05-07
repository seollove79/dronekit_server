<script>
    import { onMount } from 'svelte';
    import { ws3d } from '$lib/stores/ws3d';
    import { browser } from '$app/environment';
    import DroneList from '$lib/components/DroneList.svelte';
    import { selectedDrone } from '$lib/stores/drones';
    import { drones } from '$lib/stores/drones';
    import MissionWaypointTable from '$lib/components/mission/MissionWaypointTable.svelte';

    let waypoints = [
        { command: 'waypoint', delay: 0, latitude: 36.29664487304268, longitude: 127.16118161647057, altitude: 10, altitudeType: 'relative' },
        { command: 'waypoint', delay: 0, latitude: 36.29234394857392, longitude: 127.16113847283728, altitude: 10, altitudeType: 'relative' },
        { command: 'waypoint', delay: 0, latitude: 36.27362837382718, longitude: 127.19534212347583, altitude: 10, altitudeType: 'relative' }
    ];
    let selectedWaypoint = null;
    let map_viewer = null;
    let mapController = null;
    let droneMarker = null;
    let homePositionMarker = null;

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
        ws3d.set(map_viewer);  // 스토어에 map_viewer 저장

        // 드론 위치 업데이트 구독
        drones.subscribe(drones => {
            if (selectedDrone) {
                const drone = drones.find(d => d.id === selectedDrone);
                if (drone) {
                    updateDroneMarker(drone);
                    updateHomePositionMarker(drone);
                }
            }
        });
    });

    // 드론 마커 업데이트
    function updateDroneMarker(drone) {
        if (!map_viewer) return;

        // 기존 마커 제거
        if (droneMarker) {
            map_viewer.removeFeature(droneMarker);
        }

        // 새 마커 생성
        const feature = new vw.ol.Feature({
            geometry: new vw.ol.geom.Point([drone.longitude, drone.latitude]),
            properties: {
                name: 'Drone',
                altitude: drone.altitude
            }
        });

        const style = new vw.ol.style.Style({
            image: new vw.ol.style.Icon({
                src: '/images/drone.png',
                scale: 0.5
            }),
            zIndex: 1000  // 다른 레이어보다 위에 표시
        });

        feature.setStyle(style);
        droneMarker = map_viewer.addFeature(feature, {
            layerType: 'overlay',  // 오버레이 레이어로 추가
            zIndex: 1000  // 다른 레이어보다 위에 표시
        });
    }

    // 홈 포지션 마커 업데이트
    function updateHomePositionMarker(drone) {
        if (!map_viewer) return;

        // 기존 마커 제거
        if (homePositionMarker) {
            map_viewer.removeFeature(homePositionMarker);
        }

        // 새 마커 생성
        const size = 0.0000125; // 약 1.25m
        const coordinates = [
            [drone.home_longitude - size, drone.home_latitude - size],
            [drone.home_longitude + size, drone.home_latitude - size],
            [drone.home_longitude + size, drone.home_latitude + size],
            [drone.home_longitude - size, drone.home_latitude + size],
            [drone.home_longitude - size, drone.home_latitude - size]
        ];

        const feature = new vw.ol.Feature({
            geometry: new vw.ol.geom.Polygon([coordinates]),
            properties: {
                name: 'Home Position'
            }
        });

        const style = new vw.ol.style.Style({
            fill: new vw.ol.style.Fill({
                color: 'rgba(255, 0, 0, 0.5)'
            }),
            stroke: new vw.ol.style.Stroke({
                color: 'white',
                width: 2
            }),
            zIndex: 1000  // 다른 레이어보다 위에 표시
        });

        feature.setStyle(style);
        homePositionMarker = map_viewer.addFeature(feature, {
            layerType: 'overlay',  // 오버레이 레이어로 추가
            zIndex: 1000  // 다른 레이어보다 위에 표시
        });
    }

    // 파일 불러오기
    function handleFileLoad() {
        // TODO: 파일 불러오기 구현
    }

    // 파일 저장하기
    function handleFileSave() {
        // TODO: 파일 저장하기 구현
    }

    // 드론에서 읽기
    function handleReadFromDrone() {
        // TODO: 드론에서 읽기 구현
    }

    // 드론에 쓰기
    function handleWriteToDrone() {
        // TODO: 드론에 쓰기 구현
    }

    function handleWaypointChange(newWaypoints) {
        waypoints = newWaypoints;
    }
    function handleWaypointDelete(idx) {
        waypoints = waypoints.filter((_, i) => i !== idx);
    }
</script>

<div class="mission-page">
    <!-- 지도 영역 -->
    <div class="map-container">
        <div id="vmap"></div>
    </div>

    <!-- 우측 컨트롤 영역 -->
    <div class="control-panel">
        <div class="control-section">
            <div class="section-header">
                <h3>임무 관리</h3>
            </div>
            <div class="section-content">
                <div class="button-group">
                    <button class="control-button" on:click={handleFileLoad}>
                        <span class="button-icon">📂</span>
                        <span class="button-text">파일 불러오기</span>
                    </button>
                    <button class="control-button" on:click={handleFileSave}>
                        <span class="button-icon">💾</span>
                        <span class="button-text">파일 저장하기</span>
                    </button>
                    <button class="control-button" on:click={handleReadFromDrone}>
                        <span class="button-icon">📥</span>
                        <span class="button-text">읽기</span>
                    </button>
                    <button class="control-button" on:click={handleWriteToDrone}>
                        <span class="button-icon">📤</span>
                        <span class="button-text">쓰기</span>
                    </button>
                </div>
            </div>
        </div>
        <DroneList showStatus={false} rightOffset={10} />
    </div>

    <div class="waypoint-table-area">
        <MissionWaypointTable
            droneName="drone#03"
            altitudeType="relative"
            missionAltitude={10}
            acceptanceRadius={2}
            {waypoints}
            onChange={handleWaypointChange}
            onDelete={handleWaypointDelete}
        />
    </div>
</div>

<style>
    .mission-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
        overflow: hidden;
    }

    .map-container {
        flex: 1 1 auto;
        min-height: 0;
        height: 100%;
        position: relative;
    }

    #vmap {
        width: 100%;
        height: 100%;
    }

    .control-panel {
        position: absolute;
        top: 90px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 200px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }

    .control-section {
        padding: 15px;
    }

    .section-header {
        margin-bottom: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 10px;
    }

    .section-header h3 {
        color: white;
        margin: 0;
        font-size: 16px;
        font-weight: 500;
    }

    .section-content {
        padding: 5px 0;
    }

    .button-group {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .control-button {
        display: flex;
        align-items: center;
        gap: 10px;
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
        border: none;
        border-radius: 4px;
        padding: 10px 15px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        width: 100%;
    }

    .control-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }

    .control-button:active {
        background-color: rgba(255, 255, 255, 0.15);
    }

    .button-icon {
        font-size: 16px;
    }

    .button-text {
        flex: 1;
        text-align: left;
    }

    .waypoint-table-area {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1100;
        display: flex;
        justify-content: center;
        pointer-events: auto;
    }
</style> 