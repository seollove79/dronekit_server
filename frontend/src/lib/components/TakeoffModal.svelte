<script>
    import { createEventDispatcher } from 'svelte';
    
    export let show = false;
    export let defaultAltitude = 3;
    
    let altitude = defaultAltitude;
    const dispatch = createEventDispatcher();
    
    function handleSubmit() {
        dispatch('submit', { altitude });
        show = false;
    }
    
    function handleCancel() {
        show = false;
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            handleCancel();
        }
    }
</script>

{#if show}
<div 
    class="modal-backdrop" 
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    tabindex="-1"
    on:keydown={handleKeydown}
>
    <div 
        class="modal-content" 
        role="document"
    >
        <div class="modal-header">
            <h2 id="modal-title">이륙 고도 설정</h2>
            <button
                type="button"
                class="close-button"
                on:click={handleCancel}
                aria-label="모달 닫기"
            >
                ×
            </button>
        </div>
        <div class="input-group">
            <label for="altitude">이륙 고도 (미터)</label>
            <input 
                type="number" 
                id="altitude" 
                bind:value={altitude} 
                min="1" 
                max="100" 
                step="0.1"
            />
        </div>
        <div class="button-group">
            <button 
                type="button"
                class="cancel-button" 
                on:click={handleCancel}
            >
                취소
            </button>
            <button 
                type="button"
                class="submit-button" 
                on:click={handleSubmit}
            >
                이륙
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
        z-index: 1000;
    }
    
    .modal-content {
        background-color: #1a1a1a;
        padding: 20px;
        border-radius: 8px;
        width: 300px;
        color: white;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .close-button {
        background: none;
        border: none;
        color: #888;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .close-button:hover {
        color: white;
    }
    
    h2 {
        margin: 0;
        font-size: 18px;
    }
    
    .input-group {
        margin-bottom: 20px;
    }
    
    label {
        display: block;
        margin-bottom: 8px;
        color: #888;
    }
    
    input {
        width: 100%;
        padding: 8px;
        border: 1px solid #333;
        border-radius: 4px;
        background-color: #2a2a2a;
        color: white;
    }
    
    .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    
    button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .cancel-button {
        background-color: #333;
        color: white;
    }
    
    .submit-button {
        background-color: #4CAF50;
        color: white;
    }
    
    button:hover {
        opacity: 0.9;
    }
</style> 