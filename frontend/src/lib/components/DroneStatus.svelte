<script>
    export let drone;
    export let telemetryData;
</script>

<div class="telemetry-data">
    <div class="telemetry-header">
        <span class="label">드론 ID:</span><span class="value">{drone.drone_id}</span>
    </div>
    
    <div class="telemetry-section">
        <div class="telemetry-row">
            <div class="telemetry-item">
                <span class="label">배터리</span>
                <span class="value">{telemetryData.battery}V(100%)</span>
            </div>
            <div class="telemetry-item">
                <span class="label">GPS</span>
                <span class="value">10(3D)</span>
            </div>
            <div class="telemetry-item">
                <span class="label">Telemetry</span>
                <span class="value">99%(25%)</span>
            </div>
        </div>
        
        <div class="telemetry-row status-row">
            <div class="status-item">DISARMED</div>
            <div class="status-item">STABILIZE</div>
            <div class="status-item">EFK OK</div>
        </div>

        <div class="telemetry-row">
            <div class="altitude-section">
                <div class="label">고도(m)</div>
                <div class="altitude-values">
                    <div class="altitude-item">
                        <span>0.0</span>
                        <span class="sub-label">(상대)</span>
                    </div>
                    <div class="altitude-item">
                        <span>0.0</span>
                        <span class="sub-label">(해발)</span>
                    </div>
                </div>
            </div>
            <div class="speed-section">
                <div class="label">속도(m/s)</div>
                <div class="speed-values">
                    <div class="speed-item">
                        <span>0.0</span>
                        <span class="sub-label">(air)</span>
                    </div>
                    <div class="speed-item">
                        <span>0.0</span>
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
            <button class="control-button">시동/중로</button>
            <button class="control-button">이륙</button>
            <button class="control-button">착륙</button>
            <button class="control-button">LOITER</button>
            <button class="control-button">ALT HOLD</button>
            <button class="control-button">STABILIZE</button>
        </div>
        <button class="full-width-button">연결종료</button>
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

<style>
    .telemetry-data {
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
        width: 350px;
        position: fixed;
        right: 10px;
        top: 50;
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
        margin-bottom: 5px;
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
        margin-bottom: 16px;
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

    .full-width-button {
        width: 100%;
        background-color: #1a1a1a;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .full-width-button:hover {
        background-color: #333;
    }
</style> 