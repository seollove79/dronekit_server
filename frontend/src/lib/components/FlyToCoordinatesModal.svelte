<script>
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    export let defaultLatitude = 0;
    export let defaultLongitude = 0;
    export let defaultAltitude = 0;

    let latitude = defaultLatitude;
    let longitude = defaultLongitude;
    let altitude = defaultAltitude;
    let errorMessage = "";

    const dispatch = createEventDispatcher();

    function handleSubmit() {
        if (!latitude || !longitude || !altitude) {
            errorMessage = '모든 필드를 입력해주세요.';
            return;
        }

        if (latitude < -90 || latitude > 90) {
            errorMessage = '위도는 -90에서 90 사이여야 합니다.';
            return;
        }

        if (longitude < -180 || longitude > 180) {
            errorMessage = '경도는 -180에서 180 사이여야 합니다.';
            return;
        }

        if (altitude < 0) {
            errorMessage = '고도는 0 이상이어야 합니다.';
            return;
        }

        dispatch('submit', { latitude, longitude, altitude });
        show = false;
    }

    function handleClose() {
        show = false;
        dispatch('close');
    }
</script>

{#if show}
<div class="modal-backdrop">
    <div class="modal">
        <div class="modal-header">
            <h2>지정좌표로 비행</h2>
            <button class="close-button" on:click={handleClose} aria-label="닫기">×</button>
        </div>
        <div class="modal-content">
            {#if errorMessage}
                <div class="error-message" role="alert">{errorMessage}</div>
            {/if}
            <div class="input-group">
                <input 
                    type="number" 
                    placeholder="위도 (-90 ~ 90) *" 
                    bind:value={latitude}
                    step="0.000001"
                    required
                    aria-label="위도">
            </div>
            <div class="input-group">
                <input 
                    type="number" 
                    placeholder="경도 (-180 ~ 180) *" 
                    bind:value={longitude}
                    step="0.000001"
                    required
                    aria-label="경도">
            </div>
            <div class="input-group">
                <input 
                    type="number" 
                    placeholder="고도 (m) *" 
                    bind:value={altitude}
                    step="0.1"
                    min="0"
                    required
                    aria-label="고도">
            </div>
        </div>
        <div class="modal-footer">
            <button class="cancel-button" on:click={handleClose}>취소</button>
            <button class="submit-button" on:click={handleSubmit}>비행시작</button>
        </div>
    </div>
</div>
{/if}

<style>
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

    .submit-button {
        background-color: #00FFBF;
        color: black;
        border: none;
        border-radius: 4px;
        padding: 8px 24px;
        cursor: pointer;
        font-size: 14px;
    }

    .submit-button:hover {
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
</style> 