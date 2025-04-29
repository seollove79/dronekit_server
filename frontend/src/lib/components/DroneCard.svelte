<script>
    export let drone;
    export let isSelected = false;
    export let onSelect;

    $: droneId = drone.drone_id;
</script>

<div 
    class="drone-card" 
    class:selected={isSelected}
    on:click={() => onSelect(drone)}
    on:keydown={(e) => e.key === 'Enter' && onSelect(drone)}
    role="button"
    tabindex="0"
>
    <div class="drone-image"
        class:selected={isSelected}
    >
        <img src="/images/drone_01.png" alt="드론 이미지" />
    </div>
    <div class="drone-details">
        <div class="drone-header">
            <span class="drone-id">{droneId}</span>
        </div>
        <div class="status-icons">
            <div class="status-icon" title="배터리 상태">
                <i class="fas fa-battery-full"></i>
            </div>
            <div class="status-icon" title="신호 강도">
                <i class="fas fa-signal"></i>
            </div>
            <div class="status-icon" title="GPS 상태">
                <i class="fas fa-satellite"></i>
            </div>
        </div>
    </div>
</div>

<style>
    .drone-card {
        display: flex;
        background-color: rgba(0,0,0,0.8);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 200px;
        border: 2px solid transparent;
    }

    .drone-card:hover {
        background-color: #000000;
    }

    .drone-card.selected {
        border-color: #FFDA52;
        background-color: #000000;

    }

    .drone-image {
        width: 48px;
        height: 48px;
        margin-right: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #6B6B6B;
        border-radius: 4px;
        padding: 4px;
    }

    .drone-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .drone-image.selected {
        background-color: #d9d9d9;
    }

    .drone-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .drone-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
    }

    .drone-id {
        color: white;
        font-size: 14px;
        font-weight: 500;
    }

    .status-icons {
        display: flex;
        gap: 8px;
    }

    .status-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00FFBF;
        font-size: 12px;
    }
</style> 