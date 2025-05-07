<script>
  export let droneName = 'drone#01';
  export let altitudeType = 'relative';
  export let missionAltitude = 10;
  export let acceptanceRadius = 2;
  export let waypoints = [];
  export let onChange = () => {};
  export let onDelete = () => {};

  const altitudeTypes = ['relative', 'absolute', 'agl'];
  const commands = ['waypoint', 'takeoff', 'land'];

  function handleInputChange(idx, key, value) {
    waypoints[idx][key] = value;
    onChange([...waypoints]);
  }
  function handleDelete(idx) {
    onDelete(idx);
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
        <th>No</th>
        <th>commnad</th>
        <th>Delay</th>
        <th>Latitude</th>
        <th>Longitude</th>
        <th>altitude</th>
        <th>고도타입</th>
        <th>삭제</th>
      </tr>
    </thead>
    <tbody>
      {#each waypoints as wp, i}
        <tr>
          <td>{i + 1}</td>
          <td>
            <select bind:value={wp.command} on:change={e => handleInputChange(i, 'command', e.target.value)}>
              {#each commands as cmd}
                <option value={cmd}>{cmd}</option>
              {/each}
            </select>
          </td>
          <td>
            <input type="number" bind:value={wp.delay} min="0" on:input={e => handleInputChange(i, 'delay', e.target.value)} />
          </td>
          <td>{wp.latitude}</td>
          <td>{wp.longitude}</td>
          <td>
            <input type="number" bind:value={wp.altitude} min="0" on:input={e => handleInputChange(i, 'altitude', e.target.value)} />
          </td>
          <td>
            <select bind:value={wp.altitudeType} on:change={e => handleInputChange(i, 'altitudeType', e.target.value)}>
              {#each altitudeTypes as type}
                <option value={type}>{type}</option>
              {/each}
            </select>
          </td>
          <td>
            <button class="delete-btn" on:click={() => handleDelete(i)}>삭제</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
.mission-table-container {
  background: rgba(0,0,0,0.85);
  border-radius: 14px;
  padding: 18px 18px 10px 18px;
  color: #fff;
  min-width: 600px;
  max-width: 98vw;
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
  margin-bottom: 8px;
}
.drone-name {
  font-weight: bold;
  font-size: 1.2em;
  margin-right: 24px;
}
.header-fields {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-fields span {
  color: #b2ffb2;
  font-size: 1em;
}
.header-fields input, .header-fields select {
  background: #222;
  color: #b2ffb2;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 1em;
  margin-right: 6px;
}
.mission-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}
.mission-table th, .mission-table td {
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.mission-table th {
  background: #111;
  color: #b2ffb2;
  font-weight: 500;
}
.mission-table td select, .mission-table td input {
  background: #444;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 1em;
  width: 90px;
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
</style> 