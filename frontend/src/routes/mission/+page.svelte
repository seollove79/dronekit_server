<script>
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import DroneList from '$lib/components/DroneList.svelte';
    import { selectedDrone, getDroneTelemetry, getMissionList } from '$lib/stores/drones';
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
    let selectedDroneId = ''; // 선택된 드론 ID를 저장할 변수
    let fileInput; // 파일 입력 요소에 대한 참조
    let uploadStatus = ''; // 업로드 상태 메시지를 저장할 변수

    // 현재 선택된 드론의 웨이포인트 가져오기
    $: {
        if ($selectedDrone) {
            const waypoints = droneWaypoints.get($selectedDrone.drone_id) || [];
            currentWaypoints = [...waypoints];  // 새로운 배열로 복사
        } else {
            currentWaypoints = [];
        }
    }

    // currentWaypoints가 변경될 때마다 마커를 다시 그리는 반응형 선언
    $: if ($selectedDrone && currentWaypoints) {
        createAllWaypointEntities($selectedDrone.drone_id);
    }

    // 드론 선택 시 해당 드론의 웨이포인트 마커 표시
    $: if ($selectedDrone) {
        // 이전 드론의 마커 제거
        if (waypointMarkers.size > 0) {
            removeAllWaypointEntities($selectedDrone.drone_id);
        }

        // 선택된 드론의 웨이포인트 마커 생성
        const waypoints = droneWaypoints.get($selectedDrone.drone_id) || [];
        currentWaypoints = [...waypoints];
        createAllWaypointEntities($selectedDrone.drone_id);
    } else {
        // 드론이 선택되지 않은 경우 마커 제거
        if (waypointMarkers.size > 0) {
            removeAllWaypointEntities($selectedDrone.drone_id);
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
                        selectedWaypoint = null;  // 선택 해제
                    } else {
                        // 새로운 웨이포인트 추가
                        const newWaypoint = {
                            index: currentWaypoints.length + 1,
                            command: 'waypoint',
                            param1: 0,
                            param2: 0,
                            param3: 0,
                            param4: 0,
                            latitude: correctedLatitude,
                            longitude: correctedLongitude,
                            altitude: waypointSettings.missionAltitude,
                            altitudeType: waypointSettings.altitudeType,
                            acceptanceRadius: waypointSettings.acceptanceRadius
                        };

                        const newWaypoints = [...currentWaypoints, newWaypoint];
                        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
                        currentWaypoints = [...newWaypoints];
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
        try {
            if (!$selectedDrone) {
                alert('드론을 선택해주세요.');
                return;
            }

            // 파일 입력 요소 생성 및 클릭
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.waypoints';
            input.style.display = 'none';
            document.body.appendChild(input);

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch(`/api/drones/${$selectedDrone.drone_id}/upload-mission-file`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    alert('미션 파일이 성공적으로 업로드되었습니다.');
                    console.log('Upload success:', result);
                } catch (error) {
                    console.error('Upload failed:', error);
                    alert(`업로드 실패: ${error.message}`);
                }

                // 사용이 끝난 input 요소 제거
                document.body.removeChild(input);
            };

            input.click();
        } catch (error) {
            console.error('File save error:', error);
            alert(`파일 저장 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    // 파일 저장하기
    async function handleFileSave() {
        // TODO: 파일 저장하기 구현
    }

    // 드론에서 읽기
    async function handleReadFromDrone() {
        if (!$selectedDrone) {
            alert('드론을 선택해주세요.');
            return;
        }

        try {
            const missionList = await getMissionList($selectedDrone.drone_id);
            if(missionList && missionList.mission_items) {
                const waypoints = missionList.mission_items.map(item => ({
                    index: item.index,
                    command: item.command === 16 ? 'waypoint' : (item.command === 22 ? 'takeoff' : (item.command === 183 ? 'do_set_servo' : (item.command === 178 ? 'do_change_speed' : (item.command === 21 ? 'land' : 'unknown')))),
                    param1: item.param1,
                    param2: item.param2,
                    param3: item.param3,
                    param4: item.param4,
                    latitude: item.latitude,
                    longitude: item.longitude,
                    altitude: item.altitude,
                    altitudeType: item.frame === 0 ? 'absolute' : (item.frame === 3 ? 'relative' : 'relative'),  // 기본값은 relative
                }));

                droneWaypoints.set($selectedDrone.drone_id, waypoints);
                currentWaypoints = [...waypoints];

                // 웨이포인트 마커 업데이트
                createAllWaypointEntities($selectedDrone.drone_id);

                alert('미션을 성공적으로 읽어왔습니다.');
            } else {
                alert('미션 데이터가 없습니다.');
            }
        } catch (error) {
            console.error('미션 목록 조회 실패:', error);
        }
    }

    // 드론에 쓰기
    async function handleWriteToDrone() {
        if (!$selectedDrone) {
            alert('드론을 선택해주세요.');
            return;
        }

        if (currentWaypoints.length === 0) {
            alert('웨이포인트가 없습니다.');
            return;
        }

        try {
            console.log('currentWaypoints:', currentWaypoints);
            // 미션 데이터 준비
            const missionData = currentWaypoints.map(waypoint => ({
                latitude: waypoint.latitude,
                longitude: waypoint.longitude,
                param1: parseFloat(waypoint.param1),
                param2: parseFloat(waypoint.param2),
                param3: parseFloat(waypoint.param3),
                param4: parseFloat(waypoint.param4),
                altitude: parseFloat(waypoint.altitude),
                altitude_type: waypoint.altitudeType,
                command: waypoint.command,
                acceptance_radius: waypoint.acceptanceRadius
            }));

            // API 호출
            const response = await fetch(`/api/drones/${$selectedDrone.drone_id}/mission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(missionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '미션 업로드 실패');
            }

            const result = await response.json();
            alert('미션이 성공적으로 업로드되었습니다.');
            console.log('Mission upload result:', result);

        } catch (error) {
            console.error('미션 업로드 중 오류 발생:', error);
            alert('미션 업로드 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // 웨이포인트 엔티티 관리 함수들
    function removeAllWaypointEntities(droneId) {
        if (!map_viewer) return;
        
        // 모든 엔티티를 순회하면서 웨이포인트 관련 엔티티 제거
        const entities = map_viewer.entities.values;
        const entitiesToRemove = [];
        
        // 먼저 제거할 엔티티들을 수집
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (entity.id && (
                entity.id.startsWith('waypoint-') ||
                entity.id.startsWith('line-') ||
                entity.id.startsWith('connection-')
            )) {
                entitiesToRemove.push(entity);
            }
        }
        
        // 수집된 엔티티들을 제거
        entitiesToRemove.forEach(entity => {
            try {
                map_viewer.entities.remove(entity);
            } catch (error) {
                console.warn('엔티티 제거 실패:', error);
            }
        });
    }

    // 모든 웨이포인트 엔티티를 한 번에 생성하는 함수
    function createAllWaypointEntities(droneId) {
        if (!map_viewer || !$selectedDrone) return;

        const waypoints = droneWaypoints.get(droneId) || [];
        const homeAltitude = parseFloat(getDroneTelemetry(droneId).home_altitude) || 0;

        // 먼저 모든 기존 엔티티 제거
        removeAllWaypointEntities(droneId);

        // waypoint 타입의 웨이포인트만 필터링
        const waypointIndices = waypoints
            .map((wp, idx) => ({ wp, idx }))
            .filter(({ wp }) => wp.command === 'waypoint')
            .map(({ idx }) => idx);

        // 각 웨이포인트에 대해 마커와 연결선 생성
        waypointIndices.forEach((index, arrayIndex) => {
            const waypoint = waypoints[index];
            const altitude = parseFloat(waypoint.altitude);
            const finalAltitude = waypoint.altitudeType === 'absolute' ? altitude : altitude + homeAltitude;

            // 웨이포인트 마커 생성
            map_viewer.entities.add({
                id: `waypoint-${index}`,
                name: 'position-marker',
                position: Cesium.Cartesian3.fromDegrees(
                    waypoint.longitude, 
                    waypoint.latitude, 
                    finalAltitude
                ),
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                },
                label: {
                    text: `${waypoint.index}`,
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
            map_viewer.entities.add({
                id: `line-${index}`,
                name: 'position-line',
                polyline: {
                    positions: [
                        Cesium.Cartesian3.fromDegrees(
                            waypoint.longitude, 
                            waypoint.latitude, 
                            finalAltitude
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
            if (arrayIndex > 0) {
                const prevIndex = waypointIndices[arrayIndex - 1];
                const prevWaypoint = waypoints[prevIndex];
                const prevAltitude = parseFloat(prevWaypoint.altitude);
                const prevFinalAltitude = prevWaypoint.altitudeType === 'absolute' ? prevAltitude : prevAltitude + homeAltitude;

                map_viewer.entities.add({
                    id: `connection-${prevIndex}-${index}`,
                    name: 'connection-line',
                    polyline: {
                        positions: [
                            Cesium.Cartesian3.fromDegrees(
                                prevWaypoint.longitude,
                                prevWaypoint.latitude,
                                prevFinalAltitude
                            ),
                            Cesium.Cartesian3.fromDegrees(
                                waypoint.longitude,
                                waypoint.latitude,
                                finalAltitude
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
        });
    }

    // 웨이포인트 변경 시 마커 업데이트
    function handleWaypointChange(newWaypoints) {
        if (!$selectedDrone) return;

        console.log('Waypoints changed:', newWaypoints);
        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
        currentWaypoints = [...newWaypoints];
        createAllWaypointEntities($selectedDrone.drone_id);
    }

    // 웨이포인트 삭제 시 마커도 함께 삭제
    function handleDeleteWaypoint(index) {
        console.log('Deleting waypoint at index:', index);
        const newWaypoints = [...currentWaypoints];
        newWaypoints.splice(index, 1);
        droneWaypoints.set($selectedDrone.drone_id, newWaypoints);
        currentWaypoints = [...newWaypoints];
        createAllWaypointEntities($selectedDrone.drone_id);
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