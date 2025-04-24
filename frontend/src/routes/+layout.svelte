<div class="layout">
  <header class="header">
    <div class="header-left">
      <button class="menu-button">
        <i class="fas fa-bars"></i>
      </button>
      <h1 class="title">INTOSKY Multipurpose Ground Control Station</h1>
    </div>
    <div class="header-right">
      <div class="search-box">
        <i class="fas fa-map-marker-alt location-icon"></i>
        <input type="text" placeholder="주소를 입력하세요." />
        <button class="search-button">
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>
  </header>

  <main class="main-content">
    <slot />
  </main>
</div>

<script>
  import '@fortawesome/fontawesome-free/css/all.min.css';
</script>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .header {
    background-color: #1a1a1a;
    color: white;
    padding: 0.5rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 3rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .menu-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  .title {
    font-size: 1.2rem;
    margin: 0;
    font-weight: normal;
  }

  .search-box {
    display: flex;
    align-items: center;
    background-color: #333;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
  }

  .location-icon {
    color: #888;
    margin-right: 0.5rem;
  }

  .search-box input {
    background: none;
    border: none;
    color: white;
    padding: 0.25rem 0.5rem;
    width: 200px;
  }

  .search-box input::placeholder {
    color: #888;
  }

  .search-button {
    background: none;
    border: none;
    color: #888;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
  }

  .main-content {
    flex: 1;
    position: relative;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }
</style> 