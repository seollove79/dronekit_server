<div class="layout">
  <header class="header">
    <div class="header-left">
      <button class="menu-button" on:click={toggleMenu} aria-label="메뉴 열기">
        <i class="fas fa-bars"></i>
      </button>
      <h1 class="title">INTOSKY Multipurpose Ground Control Station</h1>
    </div>
    <div class="header-right">
      <div class="search-box">
        <i class="fas fa-map-marker-alt location-icon"></i>
        <input type="text" placeholder="주소를 입력하세요." aria-label="주소 검색" />
        <button class="search-button" aria-label="주소 검색하기">
          <i class="fas fa-search"></i>
        </button>
      </div>
    </div>
  </header>

  {#if isMenuOpen}
    <div class="expanded-menu" role="menu">
      <button 
        class="menu-item" 
        on:click={() => handleMenuClick('메인페이지')}
        on:keydown={(e) => e.key === 'Enter' && handleMenuClick('메인페이지')}
        role="menuitem"
      >
      메인페이지
      </button>
      <button 
        class="menu-item" 
        on:click={() => handleMenuClick('비행계획 수립')}
        on:keydown={(e) => e.key === 'Enter' && handleMenuClick('비행계획 수립')}
        role="menuitem"
      >
        비행계획 수립
      </button>
    </div>
  {/if}

  <main class="main-content">
    <slot />
  </main>
</div>

<script>
  import '@fortawesome/fontawesome-free/css/all.min.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { slide } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import { ws3d } from '$lib/stores/ws3d';

  let isMenuOpen = false;
  let menuHeight = 0;
  let menuRef;

  function toggleMenu() {
    isMenuOpen = !isMenuOpen;
  }

  // 메뉴 외부 클릭 시 메뉴 닫기
  function handleClickOutside(event) {
    const menu = document.querySelector('.expanded-menu');
    const menuButton = document.querySelector('.menu-button');
    
    if (menu && !menu.contains(event.target) && !menuButton.contains(event.target)) {
      isMenuOpen = false;
    }
  }

  onMount(() => {
    if (browser) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function handleMenuClick(item) {
    // 현재 맵 뷰어 정리
    if (ws3d.viewer) {
      ws3d.viewer.destroy();
      ws3d.set(null);
    }

    if (item === '메인페이지') {
      await goto('/');
      window.location.reload();
    } else if (item === '비행계획 수립') {
      await goto('/mission');
      window.location.reload();
    }
    isMenuOpen = false;
  }
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
    position: relative;
    z-index: 1000;
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
    transition: color 0.2s;
  }

  .menu-button:hover {
    color: #00FFBF;
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

  .expanded-menu {
    position: absolute;
    top: 3rem;
    left: 0;
    background-color: #1a1a1a;
    width: 200px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 999;
  }

  .menu-item {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 1rem;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 1rem;
  }

  .menu-item:hover,
  .menu-item:focus {
    background-color: #333;
    color: #00FFBF;
    outline: none;
  }

  .menu-item:focus-visible {
    outline: 2px solid #00FFBF;
    outline-offset: -2px;
  }

  :global(body) {
    margin: 0;
    padding: 0;
  }
</style> 