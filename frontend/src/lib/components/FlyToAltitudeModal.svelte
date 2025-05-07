<script>
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    export let defaultAltitude = 0;
    
    let altitude = defaultAltitude;
    const dispatch = createEventDispatcher();
    
    function handleSubmit() {
        dispatch('submit', { altitude: Number(altitude) });
    }
    
    function handleClose() {
        dispatch('close');
    }
</script>

{#if show}
<div class="modal-backdrop">
    <div class="modal">
        <div class="modal-header">
            <h2>고도 설정</h2>
            <button class="close-button" on:click={handleClose} aria-label="닫기">×</button>
        </div>
        <div class="modal-content">
            <div class="input-group">
                <input 
                    type="number" 
                    placeholder="고도 (미터) *" 
                    bind:value={altitude}
                    required
                    aria-label="고도"
                >
            </div>
        </div>
        <div class="modal-footer">
            <button class="cancel-button" on:click={handleClose}>취소</button>
            <button 
                class="submit-button" 
                on:click={handleSubmit}
                disabled={!altitude}
            >
                확인
            </button>
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

    .submit-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style> 