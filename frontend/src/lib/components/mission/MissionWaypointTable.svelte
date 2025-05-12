<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let droneName = 'drone#01';
  export let altitudeType = 'relative';
  export let missionAltitude = 10;
  export let acceptanceRadius = 2;
  export let waypoints = [];
  export let onChange = () => {};
  export let onDelete = () => {};
  export let onSettingsChange = () => {};
  export let onSelect;

  const altitudeTypes = ['relative', 'absolute', 'agl'];
  const commands = ['waypoint', 'takeoff', 'land', 'do_set_servo'];

  let selectedIndex = null;
  let tbody;
  let prevWaypointsLength = 0;

  // 웨이포인트가 추가될 때만 스크롤
  $: if (waypoints && waypoints.length > prevWaypointsLength) {
    setTimeout(() => {
      if (tbody) {
        tbody.scrollTop = tbody.scrollHeight;
      }
    }, 0);
    prevWaypointsLength = waypoints.length;
  }

  // 설정값 변경 처리
  $: if (altitudeType || missionAltitude || acceptanceRadius) {
    onSettingsChange({
      altitudeType,
      missionAltitude,
      acceptanceRadius
    });
  }

  function handleSelect(index) {
    selectedIndex = index;
    if (onSelect) {
      onSelect(index);
    }
  }

  function handleInputChange(idx, key, value) {
    console.log('Input changed:', { idx, key, value });
    const newWaypoints = [...waypoints];
    newWaypoints[idx][key] = value;
    
    // 지도 업데이트를 위한 이벤트 발생
    const event = new CustomEvent('waypointUpdate', {
      detail: {
        index: idx,
        waypoint: newWaypoints[idx]
      }
    });
    window.dispatchEvent(event);
    
    onChange(newWaypoints);
  }

  function handleDelete(idx) {
    console.log('Deleting waypoint at index:', idx);
    onDelete(idx);
    prevWaypointsLength = waypoints.length - 1;
  }

  function handleMoveUp(idx) {
    if (idx > 0) {
      console.log('Moving waypoint up:', idx);
      const newWaypoints = [...waypoints];
      [newWaypoints[idx], newWaypoints[idx - 1]] = [newWaypoints[idx - 1], newWaypoints[idx]];
      onChange(newWaypoints);
    }
  }

  function handleMoveDown(idx) {
    if (idx < waypoints.length - 1) {
      console.log('Moving waypoint down:', idx);
      const newWaypoints = [...waypoints];
      [newWaypoints[idx], newWaypoints[idx + 1]] = [newWaypoints[idx + 1], newWaypoints[idx]];
      onChange(newWaypoints);
    }
  }

  function handleSettingsChange(field, value) {
    const settings = {
      altitudeType,
      missionAltitude,
      acceptanceRadius,
      [field]: value
    };
    onSettingsChange(settings);
  }
</script>

<div class="mission-table-container">
  <div class="mission-table-header">
    <span class="drone-name">{droneName}</span>
    <div class="header-fields">
      <span>고도타입</span>
      <select bind:value={altitudeType}>
        {#each altitudeTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
      <span>임무고도</span>
      <input type="number" bind:value={missionAltitude} min="0" />
      <span>인정범위</span>
      <input type="number" bind:value={acceptanceRadius} min="0" />
    </div>
  </div>
  <table class="mission-table">
    <thead>
      <tr>
        <th width="7%">No</th>
        <th>commnad</th>
        <th>Delay</th>
        <th width="15%">Latitude</th>
        <th width="15%">Longitude</th>
        <th>altitude</th>
        <th>고도타입</th>
        <th>순서</th>
        <th width="10%">삭제</th>
      </tr>
    </thead>
    <tbody bind:this={tbody}>
      {#if waypoints && waypoints.length > 0}
        {#each waypoints as wp, i}
          <tr class:selected={selectedIndex === i}>
            <td width="7%" class="clickable" on:click={() => handleSelect(i)}>{i + 1}</td>
            <td>
              <select bind:value={wp.command} on:change={e => handleInputChange(i, 'command', e.target.value)} style="width: 100px;">
                {#each commands as cmd}
                  <option value={cmd}>{cmd}</option>
                {/each}
              </select>
            </td>
            <td>
              <input type="number" bind:value={wp.delay} min="0" on:input={e => handleInputChange(i, 'delay', e.target.value)} style="width: 60px;" />
            </td>
            <td width="15%">
              <input type="number" bind:value={wp.latitude} step="0.000001" on:input={e => handleInputChange(i, 'latitude', e.target.value)} style="width: 110px;" />
            </td>
            <td width="15%">
              <input type="number" bind:value={wp.longitude} step="0.000001" on:input={e => handleInputChange(i, 'longitude', e.target.value)} style="width: 110px;"/>
            </td>
            <td>
              <input type="number" bind:value={wp.altitude} min="0" on:input={e => handleInputChange(i, 'altitude', e.target.value)}  style="width: 60px;"/>
            </td>
            <td>
              <select bind:value={wp.altitudeType} on:change={e => handleInputChange(i, 'altitudeType', e.target.value)}>
                {#each altitudeTypes as type}
                  <option value={type}>{type}</option>
                {/each}
              </select>
            </td>
            <td>
              <div class="order-buttons">
                <button class="order-btn" on:click={() => handleMoveUp(i)} disabled={i === 0} aria-label="위로 이동">
                  <i class="fas fa-chevron-up"></i>
                </button>
                <button class="order-btn" on:click={() => handleMoveDown(i)} disabled={i === waypoints.length - 1} aria-label="아래로 이동">
                  <i class="fas fa-chevron-down"></i>
                </button>
              </div>
            </td>
            <td width="10%">
              <button class="delete-btn" on:click={() => handleDelete(i)}>삭제</button>
            </td>
          </tr>
        {/each}
      {:else}
        <tr>
          <td colspan="9" style="text-align: center; padding: 20px;">
            웨이포인트가 없습니다. 지도에서 클릭하여 웨이포인트를 추가하세요.
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
.mission-table-container {
  background: rgba(0,0,0,0.85);
  border-radius: 14px;
  padding: 10px 10px 10px 10px;
  color: #fff;
  width: 1000px;
  margin: 0 auto 0 auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
  max-height: 38vh;
  overflow-y: auto;
}
.mission-table-header {
  display: flex;
  align-items: center;
  background: #111;
  border-radius: 8px 8px 0 0;
  padding: 10px 18px;
  margin-bottom: 5px;
  position: sticky;
  top: 0;
  z-index: 1;
}
.drone-name {
  font-weight: bold;
  font-size: 0.8em;
  margin-right: 24px;
}
.header-fields {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-fields span {
  color: #b2ffb2;
  font-size: 0.8em;
}
.header-fields input, .header-fields select {
  background: #222;
  color: #b2ffb2;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8em;
  margin-right: 6px;
}
.mission-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
  table-layout: fixed;
}
.mission-table thead {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #111;
}
.mission-table tbody {
  display: block;
  max-height: calc(5 * 2.5em); /* 5행의 높이 */
  overflow-y: auto;
  padding-right: 8px; /* 스크롤바 공간 확보 */
}
.mission-table thead tr,
.mission-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}
.mission-table th, .mission-table td {
  padding: 2px 2px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mission-table th {
  background: #111;
  color: #b2ffb2;
  font-weight: 500;
  font-size: 0.8em;
}
.mission-table td select, .mission-table td input {
  background: #444;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8em;
}
.mission-table td input[type="number"] {
  text-align: right;
}
.delete-btn {
  background: #222;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.delete-btn:hover {
  background: #c00;
  color: #fff;
}

.order-buttons {
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: center;
}

.order-btn {
  background: #222;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 1px 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.order-btn:hover:not(:disabled) {
  background: #444;
}

.order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 스크롤바 스타일링 */
.mission-table tbody::-webkit-scrollbar {
  width: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.mission-table tbody::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.mission-table tbody::-webkit-scrollbar-thumb {
  background: rgba(178, 255, 178, 0.3);
  border-radius: 4px;
  border: 2px solid rgba(0, 0, 0, 0.2);
}

.mission-table tbody::-webkit-scrollbar-thumb:hover {
  background: rgba(178, 255, 178, 0.5);
}

.clickable {
  cursor: pointer;
  color: #b2ffb2;
}
.clickable:hover {
  text-decoration: underline;
}
.selected {
  background-color: rgba(178, 255, 178, 0.1);
}
</style> 