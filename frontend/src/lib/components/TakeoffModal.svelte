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
</script>

{#if show}
<div class="modal-backdrop" on:click={handleCancel}>
    <div class="modal-content" on:click|stopPropagation>
        <h2>이륙 고도 설정</h2>
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
            <button class="cancel-button" on:click={handleCancel}>취소</button>
            <button class="submit-button" on:click={handleSubmit}>이륙</button>
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
    
    h2 {
        margin: 0 0 20px 0;
        font-size: 18px;
        text-align: center;
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