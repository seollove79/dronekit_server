<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import DroneList from '$lib/components/DroneList.svelte';
    import { selectedDrone, getDroneTelemetry } from '$lib/stores/drones';
    import { drones } from '$lib/stores/drones';
    import MissionWaypointTable from '$lib/components/mission/MissionWaypointTable.svelte';
    import { mapViewer } from "$lib/stores/map";

    // 웨이포인트 설정값
    let waypointSettings = {
        altitudeType: 'relative',  // 'relative' 또는 'absolute'
        missionAltitude: 10,       // 기본 미션 고도 (미터)
        acceptanceRadius: 2        // 웨이포인트 도달 판정 반경 (미터)
    };

    // 웨이포인트 설정값 변경 핸들러
    function handleWaypointSettingsChange(settings) {
        waypointSettings = { ...settings };
    }

    // 드론별 웨이포인트 저장소
    let droneWaypoints = new Map();  // Map<droneId, waypoints[]>
    let selectedWaypoint = null;  // 선택된 웨이포인트 인덱스
    let map_viewer = null;
    let handler;
    let mapController = null;
    let droneMarker = null;
    let homePositionMarker = null;
    let waypointMarkers = new Map();  // Map<droneId, markers[]>
    let currentWaypoints = [];  // 초기값 설정

    // 현재 선택된 드론의 웨이포인트 가져오기
    $: {
        if ($selectedDrone) {
            const waypoints = droneWaypoints.get($selectedDrone.drone_id) || [];
            currentWaypoints = [...waypoints];  // 새로운 배열로 복사
        } else {
            currentWaypoints = [];
        }
    }

    // 드론 선택 시 해당 드론의 웨이포인트 마커 표시
    $: if ($selectedDrone) {
        // 이전 드론의 마커 제거
        if (waypointMarkers.size > 0) {
            // 모든 드론의 웨이포인트 엔티티 제거
            waypointMarkers.forEach((markers, droneId) => {
                removeAllWaypointEntities(droneId);
            });
            waypointMarkers.clear();
        }

        // 선택된 드론의 웨이포인트 마커 생성
        const waypoints = droneWaypoints.get($selectedDrone.drone_id) || [];
        
        // currentWaypoints 업데이트
        currentWaypoints = [...waypoints];
        
        // 마커 생성
        waypoints.forEach((waypoint, index) => {
            createWaypointMarker(waypoint, index, $selectedDrone.drone_id);
        });
    } else {
        // 드론이 선택되지 않은 경우 마커 제거
        if (waypointMarkers.size > 0) {
            // 모든 드론의 웨이포인트 엔티티 제거
            waypointMarkers.forEach((markers, droneId) => {
                removeAllWaypointEntities(droneId);
            });
            waypointMarkers.clear();
        }
        currentWaypoints = [];
    }

    // 웨이포인트 선택 핸들러
    function handleWaypointSelect(index) {
        selectedWaypoint = index;
        console.log('Selected waypoint:', index);
    }

    onMount(() => {
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

        console.log('Map viewer initialized:', map_viewer);  // 디버깅용 로그

        // VWorld 지도 클릭 이벤트 리스너 추가
        const handler = new Cesium.ScreenSpaceEventHandler(map_viewer.canvas);
        console.log('Handler created:', handler);  // 디버깅용 로그

        handler.setInputAction((movement) => {
            console.log('Click detected:', movement);  // 디버깅용 로그
            if (!$selectedDrone) {
                console.log('No drone selected');  // 디버깅용 로그
                return;
            }

            // 클릭 위치에서 카메라 레이 생성
            const ray = map_viewer.camera.getPickRay(movement.position);
            console.log('Ray:', ray);  // 디버깅용 로그

            // 레이와 지구 표면의 교차점 계산
            const cartesian = map_viewer.scene.globe.pick(ray, map_viewer.scene);
            console.log('Cartesian:', cartesian);  // 디버깅용 로그

            if (cartesian) {
                // 지구 표면에서의 정확한 위치 계산
                const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                const longitude = Cesium.Math.toDegrees(cartographic.longitude);
                const latitude = Cesium.Math.toDegrees(cartographic.latitude);

                // 카메라의 현재 위치와 방향
                const camera = map_viewer.camera;
                const cameraPosition = camera.position;
                const cameraDirection = camera.direction;

                // 클릭 위치의 방향 벡터 계산
                const direction = new Cesium.Cartesian3();
                Cesium.Cartesian3.subtract(cartesian, cameraPosition, direction);
                Cesium.Cartesian3.normalize(direction, direction);

                // 새로운 레이 생성
                const newRay = new Cesium.Ray(cameraPosition, direction);
                const newCartesian = map_viewer.scene.globe.pick(newRay, map_viewer.scene);

                if (newCartesian) {
                    const newCartographic = Cesium.Cartographic.fromCartesian(newCartesian);
                    const newLongitude = Cesium.Math.toDegrees(newCartographic.longitude);
                    const newLatitude = Cesium.Math.toDegrees(newCartographic.latitude);

                    // 카메라의 시점을 고려한 보정
                    const cameraHeight = Cesium.Cartographic.fromCartesian(cameraPosition).height;
                    const clickHeight = newCartographic.height;
                    const heightDifference = cameraHeight - clickHeight;

                    // 보정 계수 계산
                    const distance = Cesium.Cartesian3.distance(cameraPosition, newCartesian);
                    const correctionFactor = Math.min(1.0, Math.max(0.0, distance / 1000.0));

                    // 화면 중앙에서의 거리에 따른 보정 계수 조정
                    const screenCenter = new Cesium.Cartesian2(map_viewer.canvas.width / 2, map_viewer.canvas.height / 2);
                    const clickDistance = Math.sqrt(Math.pow(movement.position.x - screenCenter.x, 2) + Math.pow(movement.position.y - screenCenter.y, 2));
                    const screenCorrectionFactor = Math.min(1.0, Math.max(0.0, clickDistance / 500.0));

                    // 카메라의 시점에 따른 보정 계수 조정
                    const cameraHeading = camera.heading;
                    const cameraPitch = camera.pitch;
                    const cameraRoll = camera.roll;
                    const viewCorrectionFactor = Math.cos(cameraPitch) * Math.cos(cameraRoll);

                    // 보정된 위치 계산
                    const correctedLongitude = newLongitude + (newLongitude - longitude) * correctionFactor * screenCorrectionFactor * viewCorrectionFactor;
                    const correctedLatitude = newLatitude + (newLatitude - latitude) * correctionFactor * screenCorrectionFactor * viewCorrectionFactor;

                    console.log('Corrected position:', { longitude: correctedLongitude, latitude: correctedLatitude });  // 디버깅용 로그

                    if (selectedWaypoint !== null) {
                        // 선택된 웨이포인트 업데이트
                        const newWaypoints = [...currentWaypoints];
                        newWaypoints[selectedWaypoint] = {
                            ...newWaypoints[selectedWaypoint],
                            latitude: correctedLatitude,
                            longitude: correctedLongitude
                        };
                        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
                        currentWaypoints = [...newWaypoints];

                        // 모든 엔티티 제거 후 다시 생성
                        removeAllWaypointEntities($selectedDrone.drone_id);
                        newWaypoints.forEach((waypoint, i) => {
                            createWaypointMarker(waypoint, i, $selectedDrone.drone_id);
                        });
                        
                        selectedWaypoint = null;  // 선택 해제
                    } else {
                        // 새로운 웨이포인트 추가
                        const newWaypoint = {
                            command: 'waypoint',
                            delay: 0,
                            latitude: correctedLatitude,
                            longitude: correctedLongitude,
                            altitude: waypointSettings.missionAltitude,
                            altitudeType: waypointSettings.altitudeType,
                            acceptanceRadius: waypointSettings.acceptanceRadius
                        };

                        const newWaypoints = [...currentWaypoints, newWaypoint];
                        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
                        currentWaypoints = [...newWaypoints];

                        // 모든 엔티티 제거 후 다시 생성
                        removeAllWaypointEntities($selectedDrone.drone_id);
                        newWaypoints.forEach((waypoint, i) => {
                            createWaypointMarker(waypoint, i, $selectedDrone.drone_id);
                        });
                    }
                }
            } else {
                console.log('No valid position found');  // 디버깅용 로그
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

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

    // 윈도우 좌표를 캔버스 좌표로 변환하는 함수
    function windowToCanvasCoordinates(windowPosition) {
        const canvas = map_viewer.canvas;
        const rect = canvas.getBoundingClientRect();
        
        return new Cesium.Cartesian2(
            windowPosition.x - rect.left,
            windowPosition.y - rect.top
        );
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

    // 웨이포인트 마커 생성 함수
    function createWaypointMarker(waypoint, index, droneId) {
        if (!map_viewer) {
            console.error('map_viewer가 초기화되지 않았습니다.');
            return;
        }

        // 선택된 드론의 홈 포지션 고도 가져오기
        let homeAltitude = 0;

        if ($selectedDrone) {
            const telemetry = getDroneTelemetry($selectedDrone.drone_id);
            homeAltitude = parseFloat(telemetry.home_altitude) || 0;
        }

        // 웨이포인트 고도값 검증 및 기본값 설정
        const waypointAltitude = parseFloat(waypoint.altitude);
        const altitude = isNaN(waypointAltitude) ? waypointSettings.missionAltitude : waypointAltitude;

        let marker = null;
        let line = null;
        let connectionLine = null;
        let nextConnectionLine = null;
        
        try {
            // 구형 마커 생성 (홈 포지션 고도 더하기)
            marker = map_viewer.entities.add({
                id: `waypoint-${index}`,
                name: 'position-marker',
                position: Cesium.Cartesian3.fromDegrees(
                    waypoint.longitude, 
                    waypoint.latitude, 
                    altitude + homeAltitude
                ),
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                },
                label: {
                    text: `${index + 1}`,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -10),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });

            // 지표면까지의 점선 생성
            line = map_viewer.entities.add({
                id: `line-${index}`,
                name: 'position-line',
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(
                            waypoint.longitude, 
                            waypoint.latitude, 
                            altitude + homeAltitude
                        ),
                        Cesium.Cartesian3.fromDegrees(
                            waypoint.longitude, 
                            waypoint.latitude, 
                            homeAltitude
                        )
                    ],
                    width: 3,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.YELLOW.withAlpha(0.7),
                        dashLength: 16.0,
                        dashPattern: parseInt('1111', 2)
                    })
                }
            });

            // 이전 웨이포인트와의 연결선 생성
            const waypoints = droneWaypoints.get(droneId) || [];
            if (index > 0) {
                const prevWaypoint = waypoints[index - 1];
                const prevAltitude = parseFloat(prevWaypoint.altitude);
                const prevWaypointAltitude = isNaN(prevAltitude) ? waypointSettings.missionAltitude : prevAltitude;

                connectionLine = map_viewer.entities.add({
                    id: `connection-${index-1}-${index}`,
                    name: 'connection-line',
                    polyline: {
                        positions: [
                            Cesium.Cartesian3.fromDegrees(
                                prevWaypoint.longitude,
                                prevWaypoint.latitude,
                                prevWaypointAltitude + homeAltitude
                            ),
                            Cesium.Cartesian3.fromDegrees(
                                waypoint.longitude,
                                waypoint.latitude,
                                altitude + homeAltitude
                            )
                        ],
                        width: 2,
                        material: new Cesium.PolylineDashMaterialProperty({
                            color: Cesium.Color.WHITE.withAlpha(0.7),
                            dashLength: 16.0,
                            dashPattern: parseInt('1111', 2)
                        })
                    }
                });
            }

            // 다음 웨이포인트와의 연결선 생성
            if (index < waypoints.length - 1) {
                const nextWaypoint = waypoints[index + 1];
                const nextAltitude = parseFloat(nextWaypoint.altitude);
                const nextWaypointAltitude = isNaN(nextAltitude) ? waypointSettings.missionAltitude : nextAltitude;

                nextConnectionLine = map_viewer.entities.add({
                    id: `connection-${index}-${index+1}`,
                    name: 'connection-line',
                    polyline: {
                        positions: [
                            Cesium.Cartesian3.fromDegrees(
                                waypoint.longitude,
                                waypoint.latitude,
                                altitude + homeAltitude
                            ),
                            Cesium.Cartesian3.fromDegrees(
                                nextWaypoint.longitude,
                                nextWaypoint.latitude,
                                nextWaypointAltitude + homeAltitude
                            )
                        ],
                        width: 2,
                        material: new Cesium.PolylineDashMaterialProperty({
                            color: Cesium.Color.WHITE.withAlpha(0.7),
                            dashLength: 16.0,
                            dashPattern: parseInt('1111', 2)
                        })
                    }
                });
            }

        } catch (error) {
            console.error('엔티티 생성 실패:', error);
        }

        // 드론별 마커 저장
        const markers = waypointMarkers.get(droneId) || [];
        markers[index] = { marker, line, connectionLine, nextConnectionLine };
        waypointMarkers.set(droneId, markers);
    }

    // 모든 웨이포인트 엔티티 제거 함수
    function removeAllWaypointEntities(droneId) {
        if (!map_viewer) return;
        
        const waypoints = droneWaypoints.get(droneId) || [];
        const count = waypoints.length;
        
        // 모든 가능한 엔티티 ID에 대해 제거 시도
        for (let i = 0; i < count; i++) {
            // 웨이포인트 마커와 선 제거
            const marker = map_viewer.entities.getById(`waypoint-${i}`);
            const line = map_viewer.entities.getById(`line-${i}`);
            if (marker) map_viewer.entities.remove(marker);
            if (line) map_viewer.entities.remove(line);
            
            // 이전 웨이포인트와의 연결선 제거
            if (i > 0) {
                const connectionLine = map_viewer.entities.getById(`connection-${i-1}-${i}`);
                if (connectionLine) map_viewer.entities.remove(connectionLine);
            }
            
            // 다음 웨이포인트와의 연결선 제거
            if (i < count - 1) {
                const nextConnectionLine = map_viewer.entities.getById(`connection-${i}-${i+1}`);
                if (nextConnectionLine) map_viewer.entities.remove(nextConnectionLine);
            }
        }
        
        // 마커 배열 초기화
        waypointMarkers.set(droneId, []);
    }

    // 웨이포인트 삭제 시 마커도 함께 삭제
    function handleDeleteWaypoint(index) {
        console.log('Deleting waypoint at index:', index);
        const newWaypoints = [...currentWaypoints];
        newWaypoints.splice(index, 1);
        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
        currentWaypoints = [...newWaypoints];
        
        // 모든 엔티티 제거 후 다시 생성
        removeAllWaypointEntities($selectedDrone.drone_id);
        newWaypoints.forEach((waypoint, i) => {
            createWaypointMarker(waypoint, i, $selectedDrone.drone_id);
        });
    }

    // 웨이포인트 변경 시 마커 업데이트
    function handleWaypointChange(newWaypoints) {
        if (!$selectedDrone) return;

        console.log('Waypoints changed:', newWaypoints);
        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
        currentWaypoints = [...newWaypoints];
        
        // 모든 엔티티 제거 후 다시 생성
        removeAllWaypointEntities($selectedDrone.drone_id);
        newWaypoints.forEach((waypoint, index) => {
            createWaypointMarker(waypoint, index, $selectedDrone.drone_id);
        });
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
            droneName={$selectedDrone ? $selectedDrone.drone_id : '드론 선택'}
            altitudeType={waypointSettings.altitudeType}
            missionAltitude={waypointSettings.missionAltitude}
            acceptanceRadius={waypointSettings.acceptanceRadius}
            waypoints={currentWaypoints}
            onChange={handleWaypointChange}
            onDelete={handleDeleteWaypoint}
            onSettingsChange={handleWaypointSettingsChange}
            onSelect={handleWaypointSelect}
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