(() => {
  'use strict';

  /* ==========================================================
     0. PERFORMANCE MODE & THREE-TIER CAPABILITY DETECTION
     ========================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const perfOverrideParam = urlParams.get('performance');
  const perfSavedOverride = localStorage.getItem('the_weeknd_performance');
  const fpsOverrideParam = urlParams.get('fps');
  const showDebugBadge = urlParams.get('debug') === '1' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Multi-signal hardware heuristics (handles missing APIs safely)
  const numCores = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : 4;
  const devMem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : 4;
  const isSaveData = Boolean(navigator.connection && navigator.connection.saveData);
  const isSlowNetwork = Boolean(navigator.connection && ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType));
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmallScreen = window.innerWidth <= 1024 && window.innerHeight <= 800;
  const initialReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ultra heuristic: very weak devices (<= 2 cores, <= 2GB memory, or saveData + slow network)
  const isAutoUltra = Boolean(numCores <= 2 || (numCores <= 4 && devMem <= 2) || (isSaveData && isSlowNetwork) || initialReducedMotion);
  // Low heuristic: moderate low-end devices (<= 4 cores, <= 4GB memory, saveData, or slow network)
  const isAutoLow = Boolean(numCores <= 4 || devMem <= 4 || isSaveData || isSlowNetwork || (isCoarsePointer && isSmallScreen));

  // Tiers: 'normal', 'low', 'ultra'
  let currentPerfMode = 'normal';
  let detectionSource = 'auto';

  let isStaticMode = perfOverrideParam === 'static';

  // Priority: URL override -> saved override -> automatic detection
  if (perfOverrideParam === 'static') {
    currentPerfMode = 'ultra';
    isStaticMode = true;
    detectionSource = 'url-override-static';
  } else if (perfOverrideParam === 'ultra') {
    currentPerfMode = 'ultra';
    detectionSource = 'url-override';
  } else if (perfOverrideParam === 'low') {
    currentPerfMode = 'low';
    detectionSource = 'url-override';
  } else if (perfOverrideParam === 'normal') {
    currentPerfMode = 'normal';
    detectionSource = 'url-override';
  } else if (perfSavedOverride === 'ultra') {
    currentPerfMode = 'ultra';
    detectionSource = 'localstorage-override';
  } else if (perfSavedOverride === 'low') {
    currentPerfMode = 'low';
    detectionSource = 'localstorage-override';
  } else if (perfSavedOverride === 'normal') {
    currentPerfMode = 'normal';
    detectionSource = 'localstorage-override';
  } else if (isAutoUltra) {
    currentPerfMode = 'ultra';
    detectionSource = 'auto-heuristic-ultra';
  } else if (isAutoLow) {
    currentPerfMode = 'low';
    detectionSource = 'auto-heuristic-low';
  } else {
    currentPerfMode = 'normal';
    detectionSource = 'auto-heuristic-normal';
  }

  // Boolean helper accessors
  let isLowPerformance = currentPerfMode === 'low' || currentPerfMode === 'ultra';
  let isUltraPerformance = currentPerfMode === 'ultra';

  // Frame rate budget: In ULTRA mode, default to 60 FPS visual updates unless ?fps=30 is specified (Requirement 1)
  let use30FpsThrottle = fpsOverrideParam === '30';

  let debugBadge = null;

  function updateDebugBadge() {
    if (!debugBadge) return;
    const colors = { normal: '#22c55e', low: '#eab308', ultra: '#ef4444' };
    debugBadge.innerHTML = `<span style="color:${colors[currentPerfMode] || '#fff'}">●</span> ${currentPerfMode.toUpperCase()}${isStaticMode ? '-STATIC' : ''} (${use30FpsThrottle ? '30fps' : '60fps'})`;
  }

  function initDebugBadge() {
    if (!showDebugBadge || debugBadge) return;
    debugBadge = document.createElement('div');
    debugBadge.id = 'perfDebugBadge';
    debugBadge.style.cssText = 'position:fixed;top:10px;right:10px;z-index:999999;background:rgba(0,0,0,0.85);color:#fff;font-family:monospace;font-size:11px;font-weight:700;padding:4px 9px;border-radius:4px;border:1px solid rgba(255,255,255,0.2);cursor:pointer;pointer-events:auto;user-select:none;letter-spacing:0.05em;';
    debugBadge.title = 'Click to switch Performance Mode (NORMAL -> LOW -> ULTRA)';
    debugBadge.addEventListener('click', () => {
      const nextMode = currentPerfMode === 'normal' ? 'low' : currentPerfMode === 'low' ? 'ultra' : 'normal';
      currentPerfMode = nextMode;
      localStorage.setItem('the_weeknd_performance', nextMode);
      applyPerformanceClasses();
      console.log(`[Performance] Switched to ${currentPerfMode.toUpperCase()} via debug badge`);
      setupPointerListeners();
      requestTick();
    });
    document.body.appendChild(debugBadge);
    updateDebugBadge();
  }

  function updatePortraitSources() {
    const isUltra = currentPerfMode === 'ultra';
    const heroWrap = document.querySelector('#portraitWrap');
    const heroImg = heroWrap?.querySelector('.portrait');
    const heroSource = heroWrap?.querySelector('source');

    const ascWrap = document.querySelector('.hut-plane--ascension-hero');
    const ascImg = ascWrap?.querySelector('img');
    const ascSource = ascWrap?.querySelector('source');

    const rebWrap = document.querySelector('.rebirth-hero-wrap');
    const rebImg = rebWrap?.querySelector('.rebirth-hero');
    const rebSource = rebWrap?.querySelector('source');

    const legWrap = document.querySelector('#legacyPortrait');
    const legImg = legWrap?.querySelector('img');
    const legSource = legWrap?.querySelector('source');

    const aftWrap = document.querySelector('#afterlifeRitual');
    const aftImg = aftWrap?.querySelector('img');
    const aftSource = aftWrap?.querySelector('source');

    const ascBgWrap = document.querySelector('.hut-plane--inferno');
    const ascBgImg = ascBgWrap?.querySelector('img');
    const ascBgSources = ascBgWrap?.querySelectorAll('source');

    const rebBgWrap = document.querySelector('.rebirth-world picture');
    const rebBgImg = rebBgWrap?.querySelector('.rebirth-bg');
    const rebBgSources = rebBgWrap?.querySelectorAll('source');

    const aftBgWrap = document.querySelector('.afterlife-bg picture');
    const aftBgImg = aftBgWrap?.querySelector('img');
    const aftBgSources = aftBgWrap?.querySelectorAll('source');

    if (isUltra) {
      if (heroSource) heroSource.srcset = 'assets/images/hero-ultra.webp';
      if (heroImg && !heroImg.src.includes('hero-ultra')) heroImg.src = 'assets/images/hero-ultra.webp';

      if (ascSource) ascSource.srcset = 'assets/chapter2/abel-ascension-ultra.webp';
      if (ascImg && !ascImg.src.includes('abel-ascension-ultra')) ascImg.src = 'assets/chapter2/abel-ascension-ultra.webp';

      if (rebSource) rebSource.srcset = 'assets/chapter3/abel-rebirth-ultra.webp';
      if (rebImg && !rebImg.src.includes('abel-rebirth-ultra')) rebImg.src = 'assets/chapter3/abel-rebirth-ultra.webp';

      if (legSource) legSource.srcset = 'assets/chapter4/abel-legacy-ultra.webp';
      if (legImg && !legImg.src.includes('abel-legacy-ultra')) legImg.src = 'assets/chapter4/abel-legacy-ultra.webp';

      if (aftSource) aftSource.srcset = 'assets/chapter5/afterlife-ritual-ultra.webp';
      if (aftImg && !aftImg.src.includes('afterlife-ritual-ultra')) aftImg.src = 'assets/chapter5/afterlife-ritual-ultra.webp';

      if (ascBgSources) ascBgSources.forEach(s => s.srcset = 'assets/chapter2/ascension-world-ultra.webp');
      if (ascBgImg && !ascBgImg.src.includes('ascension-world-ultra')) ascBgImg.src = 'assets/chapter2/ascension-world-ultra.webp';

      if (rebBgSources) rebBgSources.forEach(s => s.srcset = 'assets/chapter3/rebirth-world-ultra.webp');
      if (rebBgImg && !rebBgImg.src.includes('rebirth-world-ultra')) rebBgImg.src = 'assets/chapter3/rebirth-world-ultra.webp';

      if (aftBgSources) aftBgSources.forEach(s => s.srcset = 'assets/chapter5/afterlife-temple-ultra.webp');
      if (aftBgImg && !aftBgImg.src.includes('afterlife-temple-ultra')) aftBgImg.src = 'assets/chapter5/afterlife-temple-ultra.webp';
    } else {
      if (heroSource) heroSource.srcset = 'assets/images/hero-mobile.webp';
      if (heroImg && heroImg.src.includes('hero-ultra')) heroImg.src = 'assets/images/hero.webp';

      if (ascSource) ascSource.srcset = 'assets/chapter2/abel-ascension-mobile.webp';
      if (ascImg && ascImg.src.includes('abel-ascension-ultra')) ascImg.src = 'assets/chapter2/abel-ascension.webp';

      if (rebSource) rebSource.srcset = 'assets/chapter3/abel-rebirth-mobile.webp';
      if (rebImg && rebImg.src.includes('abel-rebirth-ultra')) rebImg.src = 'assets/chapter3/abel-rebirth.webp';

      if (legSource) legSource.srcset = 'assets/chapter4/abel-legacy-mobile.webp';
      if (legImg && legImg.src.includes('abel-legacy-ultra')) legImg.src = 'assets/chapter4/abel-legacy.webp';

      if (aftSource) aftSource.srcset = 'assets/chapter5/afterlife-ritual-mobile.webp';
      if (aftImg && aftImg.src.includes('afterlife-ritual-ultra')) aftImg.src = 'assets/chapter5/afterlife-ritual.webp';

      if (ascBgSources && ascBgSources[2]) ascBgSources[2].srcset = 'assets/chapter2/ascension-world.avif';
      if (ascBgImg && ascBgImg.src.includes('ascension-world-ultra')) ascBgImg.src = 'assets/chapter2/ascension-world.webp';

      if (rebBgSources && rebBgSources[2]) rebBgSources[2].srcset = 'assets/chapter3/rebirth-world.avif';
      if (rebBgImg && rebBgImg.src.includes('rebirth-world-ultra')) rebBgImg.src = 'assets/chapter3/rebirth-world.webp';

      if (aftBgSources && aftBgSources[2]) aftBgSources[2].srcset = 'assets/chapter5/afterlife-temple.avif';
      if (aftBgImg && aftBgImg.src.includes('afterlife-temple-ultra')) aftBgImg.src = 'assets/chapter5/afterlife-temple.webp';
    }
  }

  function applyPerformanceClasses() {
    isLowPerformance = currentPerfMode === 'low' || currentPerfMode === 'ultra';
    isUltraPerformance = currentPerfMode === 'ultra';
    if (window.__fpsOverride !== undefined) {
      use30FpsThrottle = window.__fpsOverride === 30 || window.__fpsOverride === '30';
    } else {
      use30FpsThrottle = fpsOverrideParam === '30';
    }

    document.documentElement.classList.remove('performance-normal', 'performance-low', 'performance-ultra', 'performance-static');
    if (currentPerfMode === 'ultra') {
      document.documentElement.classList.add('performance-ultra', 'performance-low');
      if (isStaticMode) {
        document.documentElement.classList.add('performance-static');
      }
    } else if (currentPerfMode === 'low') {
      document.documentElement.classList.add('performance-low');
    } else {
      document.documentElement.classList.add('performance-normal');
    }
    updatePortraitSources();
    updateDebugBadge();
  }
  applyPerformanceClasses();

  window.__setPerfMode = function(mode, fps) {
    if (mode === 'static') {
      currentPerfMode = 'ultra';
      isStaticMode = true;
    } else if (mode) {
      currentPerfMode = mode;
      isStaticMode = false;
    }
    if (fps !== undefined) window.__fpsOverride = fps;
    applyPerformanceClasses();
    setupPointerListeners();
    requestTick();
  };

  console.log(`[Performance] ${currentPerfMode.toUpperCase()} (source: ${detectionSource}, concurrency: ${navigator.hardwareConcurrency || 'n/a'}, memory: ${navigator.deviceMemory || 'n/a'}GB, visualFPS: ${use30FpsThrottle ? '30' : '60'})`);

  function downgradePerformance(targetMode, reason) {
    if (targetMode === currentPerfMode) return;
    if (currentPerfMode === 'ultra') return; // Cannot downgrade further
    if (currentPerfMode === 'low' && targetMode !== 'ultra') return;

    currentPerfMode = targetMode;
    applyPerformanceClasses();
    console.log(`[Performance] Downgraded to ${currentPerfMode.toUpperCase()} (reason: ${reason})`);
    setupPointerListeners();
    requestTick();
  }

  // Lightweight runtime frame-drop monitor (only measures after page stabilized, stops after decision)
  let pageStabilized = false;
  let frameDropMonitorActive = perfOverrideParam !== 'normal' && perfOverrideParam !== 'low' && perfOverrideParam !== 'ultra';
  let longFramesCountNormal = 0;
  let longFramesCountLow = 0;
  let monitorFramesSampled = 0;
  const MAX_MONITOR_SAMPLES = 120;
  let lastMonitorTimestamp = 0;

  function sampleRuntimePerformance(now) {
    if (!pageStabilized || !frameDropMonitorActive || currentPerfMode === 'ultra') return;

    if (lastMonitorTimestamp > 0) {
      const delta = now - lastMonitorTimestamp;
      if (currentPerfMode === 'normal' && delta >= 30) {
        longFramesCountNormal += 1;
        if (longFramesCountNormal >= 3) {
          downgradePerformance('low', 'runtime-frame-drops-normal');
          lastMonitorTimestamp = now;
          return;
        }
      } else if (currentPerfMode === 'low' && delta >= 38) {
        longFramesCountLow += 1;
        if (longFramesCountLow >= 3) {
          downgradePerformance('ultra', 'runtime-frame-drops-low');
          frameDropMonitorActive = false;
          return;
        }
      }
      monitorFramesSampled += 1;
      if (monitorFramesSampled >= MAX_MONITOR_SAMPLES) {
        frameDropMonitorActive = false;
      }
    }
    lastMonitorTimestamp = now;
  }

  /* ==========================================================
     1. ACCESSIBILITY & POINTER CAPABILITY
     ========================================================== */
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reducedMotionQuery.matches;
  reducedMotionQuery.addEventListener('change', (e) => {
    reducedMotion = e.matches;
    requestTick();
  });

  const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  let hasFinePointer = pointerQuery.matches;
  pointerQuery.addEventListener('change', (e) => {
    hasFinePointer = e.matches;
    setupPointerListeners();
    requestTick();
  });


  /* ==========================================================
     2. UTILITY FUNCTIONS
     ========================================================== */
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  /* ==========================================================
     3. ELEMENT REFERENCES & PARSED LAYER DATA
     ========================================================== */
  const experience = document.querySelector('.experience');
  const heroWorld = document.getElementById('heroWorld');
  const titleDepth = document.getElementById('titleDepth');
  const portraitWrap = document.getElementById('portraitWrap');
  const leftMeta = document.getElementById('leftMeta');
  const rightMeta = document.getElementById('rightMeta');
  const releaseCard = document.getElementById('releaseCard');
  const chapterCard = document.getElementById('chapterCard');
  const scrollPercent = document.getElementById('scrollPercent');
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloaderBar');
  const preloaderValue = document.getElementById('preloaderValue');
  const railDots = [...document.querySelectorAll('.rail-dot')];
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const releasePlay = document.getElementById('releasePlay');
  const waveform = document.querySelector('.waveform');
  const soundToggle = document.getElementById('soundToggle');
  const smokeA = document.querySelector('.smoke--back');
  const smokeB = document.querySelector('.smoke--front');
  const titleThe = titleDepth ? titleDepth.querySelector('.title-word--the') : null;
  const titleWeeknd = titleDepth ? titleDepth.querySelector('.title-word--weeknd') : null;

  // Pre-parse depths to avoid dataset lookups in hot animation loop
  const heroLayers = [...document.querySelectorAll('.hero-world .layer')].map(layer => ({
    element: layer,
    depth: parseFloat(layer.dataset.depth || '0') || 0
  }));

  const hutEra = document.querySelector('.hut-era');
  const hutScene = document.getElementById('hutScene');
  const hutCopy = document.getElementById('hutCopy');
  const hutHalo = document.getElementById('hutHalo');
  const hutNext = document.getElementById('hutNext');
  const hutGhostTitle = document.querySelector('.hut-ghost-title');
  const hutPlaneData = [...document.querySelectorAll('.hut-plane')].map(plane => ({
    element: plane,
    depth: parseFloat(plane.dataset.hutDepth || '0') || 0
  }));

  const rebirthEra = document.querySelector('.rebirth-era');
  const rebirthWorld = document.getElementById('rebirthWorld');
  const rebirthTitleBlock = document.getElementById('rebirthTitleBlock');
  const rebirthLockup = document.getElementById('rebirthLockup');
  const rebirthLayerData = [...document.querySelectorAll('.rebirth-layer')].map(layer => ({
    element: layer,
    depth: parseFloat(layer.dataset.rebirthDepth || '0') || 0
  }));
  const rebirthHeroWrap = document.querySelector('.rebirth-hero-wrap');
  const rebirthSmokeLeft = document.querySelector('.rebirth-smoke--left');
  const rebirthSmokeRight = document.querySelector('.rebirth-smoke--right');
  const rebirthTitleWords = [...document.querySelectorAll('.rebirth-word')];
  const rebirthManifestoParts = [...document.querySelectorAll('.rebirth-manifesto span, .rebirth-manifesto em')];
  const rebirthEclipse = document.getElementById('rebirthEclipse');
  const rebirthGlow = document.getElementById('rebirthGlow');
  const rebirthGrid = document.getElementById('rebirthGrid');
  const rebirthFrame = document.getElementById('rebirthFrame');
  const rebirthSideQuote = document.getElementById('rebirthSideQuote');
  const rebirthNext = document.getElementById('rebirthNext');

  const legacyEra = document.querySelector('.legacy-era');
  const legacyWorld = document.getElementById('legacyWorld');
  const legacyPortrait = document.getElementById('legacyPortrait');
  const legacyCopy = document.getElementById('legacyCopy');
  const legacyEclipse = document.getElementById('legacyEclipse');
  const legacyFloor = document.getElementById('legacyFloor');
  const legacyRedHaze = document.getElementById('legacyRedHaze');
  const legacyLayerData = [...document.querySelectorAll('.legacy-layer')].map(layer => ({
    element: layer,
    depth: parseFloat(layer.dataset.legacyDepth || '0') || 0
  }));
  const legacyFrame = document.querySelector('.legacy-frame');

  const afterlifeEra = document.querySelector('.afterlife-era');
  const afterlifeWorld = document.getElementById('afterlifeWorld');
  const afterlifeRitual = document.getElementById('afterlifeRitual');
  const afterlifeCopy = document.getElementById('afterlifeCopy');
  const afterlifePortal = document.getElementById('afterlifePortal');
  const afterlifeBeam = document.getElementById('afterlifeBeam');
  const afterlifeFloor = document.getElementById('afterlifeFloor');
  const afterlifeMist = document.getElementById('afterlifeMist');
  const afterlifeLayerData = [...document.querySelectorAll('.afterlife-layer')].map(layer => ({
    element: layer,
    depth: parseFloat(layer.dataset.afterlifeDepth || '0') || 0
  }));
  const afterlifeFrame = document.querySelector('.afterlife-frame');

  const finaleEra = document.querySelector('.finale-outro');
  const finaleContent = document.getElementById('finaleContent');
  const finaleOrbitOne = document.querySelector('.finale-orbit--one');
  const finaleOrbitTwo = document.querySelector('.finale-orbit--two');
  const finaleLight = document.querySelector('.finale-light');
  const finaleStars = document.getElementById('finaleStars');
  const masterProgressBar = document.getElementById('masterProgressBar');
  const chapterTransition = document.getElementById('chapterTransition');
  const customCursor = document.getElementById('customCursor');

  const heroStage = document.querySelector('.hero-stage');
  const hutStage = document.getElementById('hutStage') || document.querySelector('.hut-stage');
  const rebirthStage = document.getElementById('rebirthStage');
  const legacyStage = document.getElementById('legacyStage');
  const afterlifeStage = document.getElementById('afterlifeStage');
  const finaleStage = document.querySelector('.finale-stage');
  const stageList = [heroStage, hutStage, rebirthStage, legacyStage, afterlifeStage, finaleStage].filter(Boolean);
  const hutAbelHero = document.querySelector('.hut-plane--ascension-hero');

  /* ==========================================================
     4. SECTION GEOMETRY & CACHED VIEWPORT VALUES
     ========================================================== */
  const sectionList = [experience, hutEra, rebirthEra, legacyEra, afterlifeEra, finaleEra].filter(Boolean);
  let sectionMetrics = [];
  let cachedMaxScroll = 1;
  let cachedTransitionRange = 120;
  let cachedProbeOffset = 300;
  let isCompactHero = false;
  let isCompactHut = false;
  let isCompactRebirth = false;
  let isCompactLegacy = false;
  let isCompactAfterlife = false;

  function cacheSectionMetrics() {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    isCompactHero = vw <= 820;
    isCompactHut = vw <= 900;
    isCompactRebirth = vw <= 760;
    isCompactLegacy = vw <= 760;
    isCompactAfterlife = vw <= 760;
    cachedMaxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    cachedTransitionRange = Math.max(120, vh * 0.14);
    cachedProbeOffset = vh * 0.38;

    sectionMetrics = sectionList.map(section => ({
      section,
      start: section.offsetTop,
      total: Math.max(1, section.offsetHeight - vh)
    }));
  }

  function getMetric(section) {
    for (let i = 0; i < sectionMetrics.length; i++) {
      if (sectionMetrics[i].section === section) return sectionMetrics[i];
    }
    return null;
  }

  function getSectionProgress(section) {
    const metric = getMetric(section);
    return metric ? clamp((latestScrollY - metric.start) / metric.total) : 0;
  }

  /* ==========================================================
     PERFORMANCE INSTRUMENTATION & BENCHMARK COUNTERS
     ========================================================== */
  const perfCounters = {
    rafCallbacks: 0,
    visualRenderCalls: 0,
    scrollEvents: 0,
    visualUpdateDurations: [],
    visualFrameDeltas: [],
    lastVisualRenderTime: 0
  };
  window.__perfCounters = perfCounters;

  const preparedChapters = new Set();
  function prepareChapterAssets(index) {
    if (index < 0 || index >= stageList.length || preparedChapters.has(index)) return;
    preparedChapters.add(index);
    const stage = stageList[index];
    if (!stage) return;
    const imgs = stage.querySelectorAll('img');
    imgs.forEach(img => {
      if (img.loading === 'lazy') {
        img.loading = 'eager';
      }
      if (typeof img.decode === 'function' && !img.dataset.decoded) {
        img.decode().then(() => {
          img.dataset.decoded = 'true';
        }).catch(() => {});
      }
    });
  }

  /* ==========================================================
     5. SCROLL & POINTER STATE
     ========================================================== */
  let latestScrollY = window.scrollY || 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;
  let cursorClientX = 0;
  let cursorClientY = 0;
  let hasCursorMoved = false;

  let isRunning = false;
  let needsRender = true;
  let rafId = 0;
  let lastPct = -1;
  let lastActiveRailDot = -1;
  let lastProgressValue = '';
  let lastTransitionOpacity = -1;
  let lastChapterIndex = -1;

  /* ==========================================================
     6. INTERSECTION OBSERVERS (ACTIVE SECTIONS SLEEP/WAKE)
     ========================================================== */
  const activeMotionSections = new Set();
  const motionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeMotionSections.add(entry.target);
        entry.target.classList.add('is-motion-active');
      } else {
        activeMotionSections.delete(entry.target);
        entry.target.classList.remove('is-motion-active');
      }
    });
    requestTick();
  }, { rootMargin: '60% 0px 60% 0px', threshold: 0 });

  sectionList.forEach(section => motionObserver.observe(section));

  /* ==========================================================
     7. MASTER UI (PROGRESS & CHAPTER BOUNDARIES)
     ========================================================== */
  function updateMasterUI() {
    const pageProgress = clamp(latestScrollY / cachedMaxScroll);
    const progressValue = `${(pageProgress * 100).toFixed(2)}%`;
    if (progressValue !== lastProgressValue) {
      lastProgressValue = progressValue;
      if (masterProgressBar) masterProgressBar.style.width = progressValue;
    }

    let nearest = Infinity;
    for (let i = 1; i < sectionMetrics.length; i++) {
      const dist = Math.abs(latestScrollY - sectionMetrics[i].start);
      if (dist < nearest) nearest = dist;
    }

    const transitionOpacity = clamp(1 - nearest / cachedTransitionRange) * 0.9;
    if (Math.abs(transitionOpacity - lastTransitionOpacity) > 0.004) {
      lastTransitionOpacity = transitionOpacity;
      const formatted = transitionOpacity.toFixed(3);
      if (chapterTransition) {
        chapterTransition.style.opacity = formatted;
        if (isUltraPerformance) {
          chapterTransition.style.display = transitionOpacity > 0.01 ? 'block' : 'none';
        }
      }
    }

    let activeIndex = 0;
    const probe = latestScrollY + cachedProbeOffset;
    for (let i = 0; i < sectionMetrics.length; i++) {
      if (sectionMetrics[i].start <= probe) activeIndex = i;
    }
    if (activeIndex !== lastChapterIndex) {
      lastChapterIndex = activeIndex;
      if (typeof updateActiveChapterUI === 'function') {
        updateActiveChapterUI(activeIndex);
      }
      // Progressive decode: Current chapter + next chapter only (Requirements 8 & 9)
      prepareChapterAssets(activeIndex);
      prepareChapterAssets(activeIndex + 1);

      // Natural scroll hash updates via replaceState (Requirement 39 - only on chapter change)
      if (typeof CHAPTER_CONFIG !== 'undefined' && CHAPTER_CONFIG[activeIndex]) {
        const chapterId = CHAPTER_CONFIG[activeIndex].id;
        if (window.location.hash !== '#' + chapterId) {
          history.replaceState(null, '', '#' + chapterId);
        }
      }
    }
  }

  function updateRail(progress) {
    const active = Math.min(railDots.length - 1, Math.floor(progress * railDots.length));
    if (active !== lastActiveRailDot) {
      lastActiveRailDot = active;
      railDots.forEach((dot, index) => dot.classList.toggle('is-active', index === active));
    }
  }

  /* ==========================================================
     8. SECTION ANIMATIONS
     ========================================================== */
  function applyMotion(progress) {
    if (!heroWorld) return;

    const heroTravel = smoothstep(0, 0.82, progress);
    const finalExit = smoothstep(0.84, 1, progress);
    const interfaceExit = smoothstep(0.76, 0.94, progress);
    const chapterReveal = smoothstep(0.86, 0.94, progress) * (1 - smoothstep(0.965, 1, progress));

    if (isLowPerformance) {
      // LOW-END MODE: Max 3 major moving visual layers (Background, Abel portrait, Interface text)
      heroWorld.style.opacity = String(1 - finalExit);
      heroWorld.style.transform = `scale(${1 + heroTravel * 0.04}) translate3d(0, ${finalExit * -1.5}%, 0)`;

      if (portraitWrap) {
        portraitWrap.style.opacity = String(1 - finalExit);
        portraitWrap.style.transform = `translateX(-50%) translateY(${-heroTravel * 0.8}%) scale(${1.02 + heroTravel * 0.03})`;
      }

      if (titleThe && titleWeeknd) {
        const titleOpacity = String(0.9 * (1 - finalExit));
        titleThe.style.opacity = titleOpacity;
        titleWeeknd.style.opacity = titleOpacity;
        titleThe.style.transform = `translate3d(${-2 - heroTravel * 2}vw, 0, 0)`;
        titleWeeknd.style.transform = `translate3d(${2 + heroTravel * 2}vw, 0, 0)`;
      }

      const interfaceOpacity = String(1 - interfaceExit);
      if (leftMeta) {
        leftMeta.style.opacity = interfaceOpacity;
        leftMeta.style.transform = isCompactHero ? `translateY(${-interfaceExit * 10}px)` : `translateY(calc(-42% - ${interfaceExit * 10}px))`;
      }
      if (rightMeta) {
        rightMeta.style.opacity = interfaceOpacity;
        rightMeta.style.transform = `translateY(calc(-42% - ${interfaceExit * 10}px))`;
      }
      if (releaseCard) {
        releaseCard.style.opacity = interfaceOpacity;
        releaseCard.style.transform = `translateY(${interfaceExit * 12}px)`;
      }
      if (chapterCard) {
        chapterCard.style.opacity = String(chapterReveal);
        chapterCard.style.transform = `translate(-50%,-50%) scale(${lerp(0.95, 1, chapterReveal)})`;
      }

      if (smokeA) {
        smokeA.style.transform = `translate3d(0, ${lerp(2, -2, heroTravel)}vh, 0)`;
      }
    } else {
      // NORMAL MODE: Full cinematic layers & mouse parallax
      heroWorld.style.opacity = String(1 - finalExit);
      heroWorld.style.transform = `scale(${1 + heroTravel * 0.085 + finalExit * 0.08}) translate3d(0, ${finalExit * -2.2}%, 0)`;

      heroLayers.forEach(({ element, depth }) => {
        const x = smoothMouseX * depth * 38;
        const y = smoothMouseY * depth * 24;
        element.style.translate = `${x}px ${y}px`;
      });

      if (titleThe && titleWeeknd) {
        const titleOpacity = String(0.9 * (1 - finalExit));
        titleThe.style.opacity = titleOpacity;
        titleWeeknd.style.opacity = titleOpacity;
        titleThe.style.transform = `translate3d(${-2 - heroTravel * 4.5}vw, ${smoothMouseY * -3}px, 0) scale(${1.04 + heroTravel * 0.07})`;
        titleWeeknd.style.transform = `translate3d(${2 + heroTravel * 4.5}vw, ${smoothMouseY * 3}px, 0) scale(${1.04 + heroTravel * 0.07})`;
      }

      if (portraitWrap) {
        const portraitScale = 1.03 + heroTravel * 0.1;
        portraitWrap.style.opacity = String(1 - finalExit);
        portraitWrap.style.transform = `translateX(calc(-50% + ${smoothMouseX * 7}px)) translateY(${smoothMouseY * 2 - heroTravel * 1.2}%) scale(${portraitScale}) rotateY(${smoothMouseX * 1.8}deg)`;
      }

      const interfaceOpacity = String(1 - interfaceExit);
      if (leftMeta) {
        leftMeta.style.opacity = interfaceOpacity;
        leftMeta.style.transform = isCompactHero
          ? `translateY(${-interfaceExit * 18}px)`
          : `translateY(calc(-42% - ${interfaceExit * 18}px))`;
      }
      if (rightMeta) {
        rightMeta.style.opacity = interfaceOpacity;
        rightMeta.style.transform = `translateY(calc(-42% - ${interfaceExit * 18}px))`;
      }
      if (releaseCard) {
        releaseCard.style.opacity = interfaceOpacity;
        releaseCard.style.transform = `translateY(${interfaceExit * 22}px)`;
      }

      if (chapterCard) {
        chapterCard.style.opacity = String(chapterReveal);
        chapterCard.style.transform = `translate(-50%,-50%) scale(${lerp(0.92, 1, chapterReveal)})`;
      }

      if (smokeA) {
        smokeA.style.transform = `translate3d(${lerp(-5, 10, heroTravel)}vw, ${lerp(5, -5, heroTravel)}vh, 0) scale(${lerp(0.96, 1.12, heroTravel)})`;
      }
      if (smokeB) {
        smokeB.style.transform = `translate3d(${lerp(7, -10, heroTravel)}vw, ${lerp(7, -6, heroTravel)}vh, 0) scale(${lerp(0.98, 1.16, heroTravel)})`;
      }
    }

    const pct = Math.round(progress * 100);
    if (pct !== lastPct && scrollPercent) {
      lastPct = pct;
      scrollPercent.textContent = String(pct).padStart(2, '0');
    }
    updateRail(progress);
  }

  function applyHutMotion(progress) {
    if (!hutEra || !hutScene) return;

    const intro = smoothstep(0, 0.12, progress);
    const journey = smoothstep(0.02, 0.78, progress);
    const exit = smoothstep(0.84, 1, progress);

    if (isLowPerformance) {
      // LOW-END MODE: Max 3 layers (Hut Scene, Abel plane, Copy)
      const sceneZoom = 1 + journey * 0.02;
      hutScene.style.transform = `translate3d(0, ${-journey * 0.4}vh, 0) scale(${sceneZoom})`;
      hutScene.style.opacity = String(1 - exit * 0.9);

      const abelPlane = hutPlaneData.find(p => p.element && p.element.classList.contains('hut-plane--abel'));
      if (abelPlane) {
        abelPlane.element.style.translate = `0px ${-journey * 10}px 0px`;
        abelPlane.element.style.scale = String(1 + journey * 0.03);
      }

      if (hutCopy) {
        const copyOpacity = 1 - smoothstep(0.68, 0.91, progress);
        hutCopy.style.opacity = String(copyOpacity);
        hutCopy.style.transform = isCompactHut
          ? `translate3d(0, ${-journey * 6}px, 0)`
          : `translate3d(0, calc(-48% - ${journey * 8}px), 0)`;
      }

      if (hutNext) {
        const nextLift = smoothstep(0.64, 0.88, progress);
        hutNext.style.transform = `translateY(${(1 - nextLift) * 10}px)`;
        hutNext.style.opacity = String(0.72 + nextLift * 0.28);
      }
    } else {
      // NORMAL MODE: Full planes, halo, ghost title, mouse parallax
      const cameraX = smoothMouseX * (isCompactHut ? 2.6 : 5.4);
      const cameraY = smoothMouseY * (isCompactHut ? 1.8 : 3.6);
      const sceneZoom = 1 + journey * (isCompactHut ? 0.025 : 0.045);
      hutScene.style.transform = `translate3d(${cameraX - journey * 0.7}vw, ${cameraY - journey * 0.55}vh, 0) rotateY(${smoothMouseX * 0.75 - journey * 0.38}deg) scale(${sceneZoom})`;
      hutScene.style.opacity = String(1 - exit * 0.9);

      if (hutCopy) {
        const copyOpacity = 1 - smoothstep(0.68, 0.91, progress);
        hutCopy.style.opacity = String(copyOpacity);
        hutCopy.style.transform = isCompactHut
          ? `translate3d(${-journey * 1.8}vw, ${-journey * 10}px, 0)`
          : `translate3d(${-journey * 1.35}vw, calc(-48% - ${journey * 13}px), 0)`;
      }

      hutPlaneData.forEach(({ element, depth }) => {
        const x = smoothMouseX * depth * (isCompactHut ? 20 : 36) + journey * depth * 10;
        const y = smoothMouseY * depth * (isCompactHut ? 14 : 25) - journey * depth * 18;
        const z = journey * depth * 135;
        element.style.translate = `${x}px ${y}px ${z}px`;
        element.style.scale = String(1 + journey * depth * 0.07);
      });

      if (hutHalo) {
        const haloRotation = journey * 14 + smoothMouseX * 1.4;
        hutHalo.style.transform = `translate(-50%, -50%) translateZ(10px) rotateZ(${haloRotation}deg) scale(${0.94 + intro * 0.07 + journey * 0.025})`;
        hutHalo.style.opacity = String(0.08 + intro * 0.17 - exit * 0.12);
      }

      if (hutGhostTitle) {
        hutGhostTitle.style.opacity = String(0.08 + journey * 0.16);
        hutGhostTitle.style.translate = `${journey * -1.2}vw ${journey * -0.8}vh`;
      }

      if (hutNext) {
        const nextLift = smoothstep(0.64, 0.88, progress);
        hutNext.style.transform = `translateY(${(1 - nextLift) * 18}px)`;
        hutNext.style.opacity = String(0.72 + nextLift * 0.28);
      }
    }
  }

  function applyRebirthMotion(progress) {
    if (!rebirthEra || !rebirthWorld) return;

    const intro = smoothstep(0.0, 0.14, progress);
    const reveal = smoothstep(0.06, 0.3, progress);
    const journey = smoothstep(0.08, 0.78, progress);
    const climax = smoothstep(0.42, 0.72, progress);
    const exit = smoothstep(0.86, 1, progress);

    if (isLowPerformance) {
      // LOW-END MODE: Max 3 layers (World, Hero, Title Block)
      const worldScale = 1.008 + journey * 0.02;
      rebirthWorld.style.transform = `translate3d(0, ${-journey * 0.3}vh, 0) scale(${worldScale})`;
      rebirthWorld.style.opacity = String(1 - exit * 0.96);
      rebirthWorld.style.filter = '';

      if (rebirthHeroWrap) {
        const heroIn = smoothstep(0.06, 0.28, progress);
        const heroOut = smoothstep(0.84, 0.99, progress);
        const heroScale = 0.96 + heroIn * 0.04 + journey * 0.02;
        const heroShift = (1 - heroIn) * 20 - journey * (isCompactRebirth ? 4 : 8);
        rebirthHeroWrap.style.opacity = String(heroIn * (1 - heroOut * 0.96));
        rebirthHeroWrap.style.filter = '';
        rebirthHeroWrap.style.transform = `translateX(-50%) translate3d(0, ${heroShift}px, 0) scale(${heroScale})`;
      }

      if (rebirthTitleBlock) {
        const titleIn = smoothstep(0.08, 0.27, progress);
        const titleOut = smoothstep(0.74, 0.92, progress);
        rebirthTitleBlock.style.opacity = String(titleIn * (1 - titleOut));
        rebirthTitleBlock.style.transform = `translate3d(0, ${(1 - titleIn) * 18 - journey * 4}px, 0)`;
      }

      if (rebirthLockup) {
        const lockupIn = smoothstep(0.015, 0.15, progress);
        const lockupOut = smoothstep(0.78, 0.94, progress);
        rebirthLockup.style.opacity = String(lockupIn * (1 - lockupOut * 0.9));
        rebirthLockup.style.transform = `translate3d(0, ${(1 - lockupIn) * -8}px, 0)`;
      }

      if (rebirthNext) {
        const nextIn = smoothstep(0.58, 0.82, progress);
        rebirthNext.style.opacity = String(0.25 + nextIn * 0.75 - exit * 0.55);
        rebirthNext.style.transform = `translate3d(${(1 - nextIn) * 14}px, 0, 0)`;
      }
    } else {
      // NORMAL MODE
      const px = smoothMouseX * (isCompactRebirth ? 2.5 : 6.5);
      const py = smoothMouseY * (isCompactRebirth ? 1.7 : 4.2);
      const worldScale = 1.008 + journey * 0.035 + exit * 0.018;
      rebirthWorld.style.transform = `translate3d(${px * 0.12}px, ${py * 0.08 - journey * 0.5}vh, 0) scale(${worldScale})`;
      rebirthWorld.style.opacity = String(1 - exit * 0.96);

      if (exit > 0.01) {
        rebirthWorld.style.filter = `brightness(${(1 - exit * 0.16).toFixed(3)})`;
      } else {
        rebirthWorld.style.filter = '';
      }

      rebirthLayerData.forEach(({ element, depth }) => {
        const x = smoothMouseX * depth * (isCompactRebirth ? 10 : 25);
        const y = smoothMouseY * depth * (isCompactRebirth ? 7 : 16) - journey * depth * 13;
        element.style.translate = `${x}px ${y}px`;
      });

      if (rebirthHeroWrap) {
        const heroIn = smoothstep(0.06, 0.28, progress);
        const heroOut = smoothstep(0.84, 0.99, progress);
        const heroScale = 0.94 + heroIn * 0.06 + journey * 0.035;
        const heroShift = (1 - heroIn) * 38 - journey * (isCompactRebirth ? 7 : 14);
        rebirthHeroWrap.style.opacity = String(heroIn * (1 - heroOut * 0.96));
        if (heroIn < 0.98) {
          rebirthHeroWrap.style.filter = `blur(${((1 - heroIn) * 5).toFixed(1)}px)`;
        } else {
          rebirthHeroWrap.style.filter = '';
        }
        rebirthHeroWrap.style.transform = `translateX(-50%) translate3d(${journey * (isCompactRebirth ? -1 : -1.6)}vw, ${heroShift}px, ${journey * 30}px) scale(${heroScale}) rotateY(${smoothMouseX * 1.1}deg)`;
      }

      if (rebirthEclipse) {
        const eclipseIn = smoothstep(0.02, 0.24, progress);
        const eclipsePulse = 1 + Math.sin(progress * Math.PI * 2.2) * 0.008 * eclipseIn;
        rebirthEclipse.style.opacity = String((0.18 + eclipseIn * 0.68 + climax * 0.08) * (1 - exit));
        rebirthEclipse.style.transform = `translate(-50%, -50%) rotate(${journey * 16 + smoothMouseX * 1.2}deg) scale(${(0.9 + eclipseIn * 0.1 + climax * 0.04) * eclipsePulse})`;
      }

      if (rebirthGlow) {
        rebirthGlow.style.opacity = String((0.35 + reveal * 0.45 + climax * 0.18) * (1 - exit * 0.8));
        rebirthGlow.style.transform = `translate3d(${smoothMouseX * -4}px, ${smoothMouseY * -2 - journey * 5}px, 0) scale(${0.96 + journey * 0.08})`;
      }

      if (rebirthGrid) {
        rebirthGrid.style.opacity = String((0.03 + reveal * 0.15) * (1 - exit));
        rebirthGrid.style.transform = `perspective(700px) rotateX(66deg) scaleX(${1.4 + journey * 0.06}) translateY(${18 - journey * 7}%)`;
        rebirthGrid.style.backgroundPosition = `${journey * -36}px ${journey * -24}px`;
      }

      if (rebirthSmokeLeft && rebirthSmokeRight) {
        const smokeOpacity = 0.06 + reveal * 0.3 + climax * 0.08 - exit * 0.32;
        rebirthSmokeLeft.style.opacity = String(smokeOpacity);
        rebirthSmokeRight.style.opacity = String(smokeOpacity * 0.9);
        rebirthSmokeLeft.style.transform = `translate3d(${journey * 3.2}vw, ${-journey * 1.6}vh, 0) scale(${0.94 + reveal * 0.16})`;
        rebirthSmokeRight.style.transform = `translate3d(${-journey * 2.8}vw, ${-journey * 1.1}vh, 0) scale(${0.96 + reveal * 0.14})`;
      }

      if (rebirthTitleBlock) {
        const titleIn = smoothstep(0.08, 0.27, progress);
        const titleOut = smoothstep(0.74, 0.92, progress);
        rebirthTitleBlock.style.opacity = String(titleIn * (1 - titleOut));
        rebirthTitleBlock.style.transform = `translate3d(${journey * -0.8}vw, ${(1 - titleIn) * 30 - journey * 7}px, ${titleIn * 18}px)`;

        rebirthTitleWords.forEach((word, index) => {
          const localIn = smoothstep(0.1 + index * 0.055, 0.28 + index * 0.055, progress);
          word.style.opacity = String(localIn);
          word.style.transform = `translate3d(0, ${(1 - localIn) * 105}%, 0) skewY(${(1 - localIn) * 2.5}deg)`;
          if (localIn < 0.98) {
            word.style.filter = `blur(${((1 - localIn) * 5).toFixed(1)}px)`;
          } else {
            word.style.filter = '';
          }
        });

        rebirthManifestoParts.forEach((part, index) => {
          const copyIn = smoothstep(0.25 + index * 0.045, 0.42 + index * 0.045, progress);
          part.style.opacity = String(copyIn);
          part.style.transform = `translateY(${(1 - copyIn) * 10}px)`;
          if (copyIn < 0.98) {
            part.style.filter = `blur(${((1 - copyIn) * 2.5).toFixed(1)}px)`;
          } else {
            part.style.filter = '';
          }
        });
      }

      if (rebirthLockup) {
        const lockupIn = smoothstep(0.015, 0.15, progress);
        const lockupOut = smoothstep(0.78, 0.94, progress);
        rebirthLockup.style.opacity = String(lockupIn * (1 - lockupOut * 0.9));
        rebirthLockup.style.transform = `translate3d(${journey * -0.3}vw, ${(1 - lockupIn) * -12 - journey * 5}px, 0)`;
      }

      if (rebirthSideQuote) {
        const quoteIn = smoothstep(0.27, 0.47, progress);
        const quoteOut = smoothstep(0.72, 0.9, progress);
        rebirthSideQuote.style.opacity = String(quoteIn * (1 - quoteOut));
        rebirthSideQuote.style.transform = `translate3d(${(1 - quoteIn) * 16}px, ${journey * -4}px, 0)`;
      }

      if (rebirthNext) {
        const nextIn = smoothstep(0.58, 0.82, progress);
        rebirthNext.style.opacity = String(0.25 + nextIn * 0.75 - exit * 0.55);
        rebirthNext.style.transform = `translate3d(${(1 - nextIn) * 22}px, 0, 0)`;
      }

      if (rebirthFrame) {
        rebirthFrame.style.opacity = String((0.28 + intro * 0.42) * (1 - exit * 0.75));
      }
    }
  }

  function applyLegacyMotion(progress) {
    if (!legacyEra || !legacyWorld) return;

    const intro = smoothstep(0, 0.15, progress);
    const journey = smoothstep(0.06, 0.78, progress);
    const climax = smoothstep(0.42, 0.76, progress);
    const exit = smoothstep(0.86, 1, progress);

    if (isLowPerformance) {
      // LOW-END MODE: Max 3 layers (World, Portrait, Copy)
      legacyWorld.style.transform = `translate3d(0, ${-journey * 0.3}vh, 0) scale(${1.01 + journey * 0.02})`;
      legacyWorld.style.opacity = String(1 - exit * 0.96);
      legacyWorld.style.filter = '';

      if (legacyPortrait) {
        const portraitIn = smoothstep(0.02, 0.22, progress);
        const portraitOut = smoothstep(0.82, 0.99, progress);
        const scale = 0.97 + portraitIn * 0.03 + journey * 0.02;
        legacyPortrait.style.opacity = String(portraitIn * (1 - portraitOut * 0.88));
        legacyPortrait.style.transform = `translate3d(${(1 - portraitIn) * -3}vw, ${(1 - portraitIn) * 1.5 - journey * 0.8}vh, 0) scale(${scale})`;
      }

      if (legacyCopy) {
        const copyIn = smoothstep(0.12, 0.32, progress);
        const copyOut = smoothstep(0.78, 0.96, progress);
        legacyCopy.style.opacity = String(copyIn * (1 - copyOut));
        legacyCopy.style.transform = `translate3d(${(1 - copyIn) * 20 - journey * 5}px, ${(1 - copyIn) * 8}px, 0)`;
      }
    } else {
      // NORMAL MODE
      const px = smoothMouseX * (isCompactLegacy ? 2.2 : 6.2);
      const py = smoothMouseY * (isCompactLegacy ? 1.4 : 3.8);
      legacyWorld.style.transform = `translate3d(${px * 0.18}px, ${py * 0.1 - journey * 0.5}vh, 0) scale(${1.01 + journey * 0.045 + exit * 0.025})`;
      legacyWorld.style.opacity = String(1 - exit * 0.96);
      legacyWorld.style.filter = `brightness(${.86 + intro * .14 - exit * .16}) saturate(${.9 + climax * .18})`;

      legacyLayerData.forEach(({ element, depth }) => {
        const x = smoothMouseX * depth * (isCompactLegacy ? 12 : 28);
        const y = smoothMouseY * depth * (isCompactLegacy ? 8 : 18) - journey * depth * 18;
        element.style.translate = `${x}px ${y}px`;
      });

      if (legacyPortrait) {
        const portraitIn = smoothstep(0.02, 0.22, progress);
        const portraitOut = smoothstep(0.82, 0.99, progress);
        const scale = 0.965 + portraitIn * 0.035 + journey * 0.035;
        legacyPortrait.style.opacity = String(portraitIn * (1 - portraitOut * 0.88));
        legacyPortrait.style.transform = `translate3d(${(1 - portraitIn) * -5 + smoothMouseX * 1.1}vw, ${(1 - portraitIn) * 2 - journey * 1.4}vh, ${journey * 32}px) rotateY(${smoothMouseX * 1.6}deg) scale(${scale})`;
      }

      if (legacyCopy) {
        const copyIn = smoothstep(0.12, 0.32, progress);
        const copyOut = smoothstep(0.78, 0.96, progress);
        legacyCopy.style.opacity = String(copyIn * (1 - copyOut));
        legacyCopy.style.transform = `translate3d(${(1 - copyIn) * 34 - journey * 8}px, ${(1 - copyIn) * 14 - journey * 5}px, ${copyIn * 22}px)`;
      }

      if (legacyEclipse) {
        const eclipseScale = 0.86 + intro * 0.1 + journey * 0.08;
        legacyEclipse.style.opacity = String(0.12 + intro * 0.56 + climax * 0.18 - exit * 0.72);
        legacyEclipse.style.transform = `translate(-50%, -50%) rotateZ(${journey * 16 + smoothMouseX * 1.2}deg) scale(${eclipseScale})`;
      }

      if (legacyFloor) {
        legacyFloor.style.opacity = String(0.12 + journey * 0.24 - exit * 0.22);
        legacyFloor.style.translate = `${smoothMouseX * 3}px ${journey * -12}px`;
      }

      if (legacyRedHaze) {
        legacyRedHaze.style.opacity = String(0.25 + climax * 0.48 - exit * 0.5);
        legacyRedHaze.style.transform = `translate3d(${smoothMouseX * 8}px, ${smoothMouseY * 5 - journey * 8}px, 0) scale(${1 + climax * 0.16})`;
      }

      if (legacyFrame) {
        legacyFrame.style.opacity = String((0.12 + intro * 0.38) * (1 - exit * 0.8));
      }
    }
  }

  function applyAfterlifeMotion(progress) {
    if (!afterlifeEra || !afterlifeWorld) return;

    const intro = smoothstep(0, 0.16, progress);
    const journey = smoothstep(0.06, 0.78, progress);
    const transcend = smoothstep(0.36, 0.78, progress);
    const exit = smoothstep(0.89, 1, progress);

    if (isLowPerformance) {
      // LOW-END MODE: Max 3 layers (World, Ritual figure, Copy)
      afterlifeWorld.style.transform = `translate3d(0, ${-journey * 0.3}vh, 0) scale(${1.01 + journey * 0.02})`;
      afterlifeWorld.style.opacity = String(1 - exit * 0.98);
      afterlifeWorld.style.filter = '';

      if (afterlifeRitual) {
        const ritualIn = smoothstep(0.015, 0.22, progress);
        const ritualOut = smoothstep(0.86, 0.995, progress);
        const scale = 0.94 + ritualIn * 0.06 + journey * 0.025;
        afterlifeRitual.style.opacity = String(ritualIn * (1 - ritualOut * 0.92));
        afterlifeRitual.style.transform = `translate3d(0, ${(1 - ritualIn) * 3 - journey * 1}vh, 0) scale(${scale})`;
      }

      if (afterlifeCopy) {
        const copyIn = smoothstep(0.12, 0.34, progress);
        const copyOut = smoothstep(0.8, 0.965, progress);
        afterlifeCopy.style.opacity = String(copyIn * (1 - copyOut));
        afterlifeCopy.style.transform = `translate3d(${(1 - copyIn) * 22 - journey * 5}px, ${(1 - copyIn) * 8}px, 0)`;
      }
    } else {
      // NORMAL MODE
      const px = smoothMouseX * (isCompactAfterlife ? 2.2 : 6.2);
      const py = smoothMouseY * (isCompactAfterlife ? 1.4 : 3.8);
      afterlifeWorld.style.transform = `translate3d(${px * 0.14}px, ${py * 0.08 - journey * 0.65}vh, 0) scale(${1.015 + journey * 0.055 + exit * 0.025})`;
      afterlifeWorld.style.opacity = String(1 - exit * 0.98);
      afterlifeWorld.style.filter = `brightness(${.82 + intro * .18 + transcend * .05 - exit * .18}) saturate(${.92 + transcend * .2}) contrast(${1.03 + transcend * .05})`;

      afterlifeLayerData.forEach(({ element, depth }) => {
        if (element === afterlifeRitual) return;
        const x = smoothMouseX * depth * (isCompactAfterlife ? 11 : 28);
        const y = smoothMouseY * depth * (isCompactAfterlife ? 7 : 18) - journey * depth * 22;
        element.style.translate = `${x}px ${y}px`;
      });

      if (afterlifeRitual) {
        const ritualIn = smoothstep(0.015, 0.22, progress);
        const ritualOut = smoothstep(0.86, 0.995, progress);
        const floatY = Math.sin(progress * Math.PI * 2.05) * 0.45;
        const scale = 0.92 + ritualIn * 0.08 + journey * 0.045 + transcend * 0.02;
        afterlifeRitual.style.opacity = String(ritualIn * (1 - ritualOut * 0.92));
        afterlifeRitual.style.transform = `translate3d(0, ${(1 - ritualIn) * 5 + floatY - journey * 1.8}vh, ${40 + journey * 58}px) rotateY(${smoothMouseX * 0.35}deg) rotateX(${smoothMouseY * -0.18}deg) scale(${scale})`;
      }

      if (afterlifeCopy) {
        const copyIn = smoothstep(0.12, 0.34, progress);
        const copyOut = smoothstep(0.8, 0.965, progress);
        afterlifeCopy.style.opacity = String(copyIn * (1 - copyOut));
        afterlifeCopy.style.transform = `translate3d(${(1 - copyIn) * 40 - journey * 8}px, ${(1 - copyIn) * 14 - journey * 5}px, ${copyIn * 28}px)`;
      }

      if (afterlifePortal) {
        const portalScale = 0.9 + intro * 0.08 + transcend * 0.08;
        afterlifePortal.style.opacity = String(0.2 + intro * 0.48 + transcend * 0.18 - exit * 0.8);
        afterlifePortal.style.transform = `translate(-50%, -50%) rotateZ(${journey * 12 + smoothMouseX * 1.2}deg) scale(${portalScale})`;
      }

      if (afterlifeBeam) {
        afterlifeBeam.style.opacity = String(0.22 + intro * 0.3 + transcend * 0.35 - exit * 0.7);
        afterlifeBeam.style.transform = `translateX(calc(-50% + ${smoothMouseX * 4}px)) scaleX(${1 + transcend * 0.1})`;
      }

      if (afterlifeFloor) {
        afterlifeFloor.style.opacity = String(0.08 + journey * 0.2 - exit * 0.2);
        afterlifeFloor.style.translate = `${smoothMouseX * 3}px ${journey * -14}px`;
      }

      if (afterlifeMist) {
        afterlifeMist.style.opacity = String(0.28 + transcend * 0.42 - exit * 0.52);
        afterlifeMist.style.transform = `translate3d(${smoothMouseX * 8}px, ${smoothMouseY * 5 - journey * 10}px, 0) scale(${1 + transcend * 0.14})`;
      }

      if (afterlifeFrame) {
        afterlifeFrame.style.opacity = String((0.14 + intro * 0.36) * (1 - exit * 0.86));
      }
    }
  }

  function applyFinaleMotion(progress) {
    if (!finaleEra || !finaleContent) return;

    const intro = smoothstep(0.02, 0.34, progress);
    const settle = smoothstep(0.2, 0.78, progress);

    if (isLowPerformance) {
      // LOW-END MODE: Max 3 layers (Background, Typography, Signoff)
      finaleContent.style.opacity = String(intro);
      finaleContent.style.filter = '';
      finaleContent.style.transform = `translate3d(0, ${(1 - intro) * 18 - settle * 4}px, 0) scale(${0.96 + intro * 0.04})`;
    } else {
      // NORMAL MODE
      const pulse = 1 + Math.sin(progress * Math.PI * 2) * 0.006;
      finaleContent.style.opacity = String(intro);
      if (intro < 0.98) {
        finaleContent.style.filter = `blur(${((1 - intro) * 8).toFixed(1)}px)`;
      } else {
        finaleContent.style.filter = '';
      }
      finaleContent.style.transform = `translate3d(0, ${(1 - intro) * 32 - settle * 7}px, ${intro * 54}px) scale(${(0.94 + intro * 0.06) * pulse})`;

      if (finaleOrbitOne) {
        finaleOrbitOne.style.opacity = String(0.08 + intro * 0.22);
        finaleOrbitOne.style.transform = `rotate(${settle * 18 + smoothMouseX * 0.7}deg) scale(${0.88 + intro * 0.12 + settle * 0.035})`;
      }
      if (finaleOrbitTwo) {
        finaleOrbitTwo.style.opacity = String(0.08 + intro * 0.3);
        finaleOrbitTwo.style.transform = `rotate(${-settle * 24 - smoothMouseX * 0.9}deg) scale(${0.9 + intro * 0.1})`;
      }
      if (finaleLight) {
        finaleLight.style.opacity = String(0.12 + intro * 0.42);
        finaleLight.style.transform = `translateX(${smoothMouseX * 3}px) scaleX(${1 + settle * 0.12})`;
      }
    }
  }

  /* ==========================================================
     9. CENTRAL SCROLL ANIMATION ENGINE
     ========================================================== */
  function renderUltraMode() {
    const vStart = performance.now();
    perfCounters.visualRenderCalls++;
    if (perfCounters.lastVisualRenderTime > 0) {
      perfCounters.visualFrameDeltas.push(vStart - perfCounters.lastVisualRenderTime);
    }
    perfCounters.lastVisualRenderTime = vStart;

    updateMasterUI();

    const activeIndex = lastChapterIndex >= 0 ? lastChapterIndex : 0;
    const isTransitioning = lastTransitionOpacity > 0.05;
    const currentProgress = getSectionProgress(sectionList[activeIndex]);

    // Just-In-Time Stage Visibility (Requirements 19, 21, 22):
    // Active stage always visible; previous stage visible only during exit (progress < 0.15);
    // next stage visible only during entry preparation (progress >= 0.85).
    // All other distant stages get .stage--hidden (display: none !important) to eliminate GPU composite surfaces.
    for (let i = 0; i < stageList.length; i++) {
      let isVisible = false;
      if (i === activeIndex) {
        isVisible = true;
      } else if (i === activeIndex - 1 && currentProgress < 0.15) {
        isVisible = true;
      } else if (i === activeIndex + 1 && currentProgress >= 0.85) {
        isVisible = true;
      }
      const stage = stageList[i];
      if (isVisible) {
        if (stage.classList.contains('stage--hidden')) {
          stage.classList.remove('stage--hidden');
        }
      } else {
        if (!stage.classList.contains('stage--hidden')) {
          stage.classList.add('stage--hidden');
        }
      }
    }

    // ULTRA MODE: Max 2 moving elements (subject translateY + text opacity/translateY)
    // 100% static backgrounds, zero 3D math, zero filter writes, zero layer arrays iterations.

    // 1. Hero Chapter
    if (activeIndex === 0 || (isTransitioning && activeIndex === 1)) {
      const p = getSectionProgress(experience);
      const heroTravel = smoothstep(0, 0.82, p);
      const finalExit = smoothstep(0.84, 1, p);
      const interfaceExit = smoothstep(0.76, 0.94, p);
      const chapterReveal = smoothstep(0.86, 0.94, p) * (1 - smoothstep(0.965, 1, p));

      if (portraitWrap) {
        portraitWrap.style.transform = isStaticMode
          ? 'translateX(-50%)'
          : `translateX(-50%) translateY(${-heroTravel * 18}px)`;
        portraitWrap.style.opacity = String(1 - finalExit);
      }
      const titleOpacity = String(1 - finalExit);
      if (titleThe) {
        titleThe.style.opacity = titleOpacity;
        titleThe.style.transform = `translate3d(${-heroTravel * 10}px, 0, 0)`;
      }
      if (titleWeeknd) {
        titleWeeknd.style.opacity = titleOpacity;
        titleWeeknd.style.transform = `translate3d(${heroTravel * 10}px, 0, 0)`;
      }
      const ifaceOp = String(1 - interfaceExit);
      if (leftMeta) leftMeta.style.opacity = ifaceOp;
      if (rightMeta) rightMeta.style.opacity = ifaceOp;
      if (releaseCard) releaseCard.style.opacity = ifaceOp;
      if (chapterCard) chapterCard.style.opacity = String(chapterReveal);

      const pct = Math.round(p * 100);
      if (pct !== lastPct && scrollPercent) {
        lastPct = pct;
        scrollPercent.textContent = String(pct).padStart(2, '0');
      }
      updateRail(p);
    }

    // 2. Ascension Chapter
    if (activeIndex === 1 || (isTransitioning && (activeIndex === 0 || activeIndex === 2))) {
      const p = getSectionProgress(hutEra);
      const journey = smoothstep(0.02, 0.78, p);
      const exit = smoothstep(0.84, 1, p);

      if (hutAbelHero) {
        hutAbelHero.style.translate = isStaticMode ? '0px 0px 0px' : `0px ${-journey * 16}px 0px`;
        hutAbelHero.style.opacity = String(1 - exit * 0.9);
      }
      if (hutCopy) {
        hutCopy.style.opacity = String(1 - smoothstep(0.68, 0.91, p));
        hutCopy.style.transform = `translate3d(0, ${-journey * 10}px, 0)`;
      }
      if (hutNext) {
        const nextLift = smoothstep(0.64, 0.88, p);
        hutNext.style.transform = `translateY(${(1 - nextLift) * 10}px)`;
        hutNext.style.opacity = String(0.72 + nextLift * 0.28);
      }
    }

    // 3. Rebirth Chapter
    if (activeIndex === 2 || (isTransitioning && (activeIndex === 1 || activeIndex === 3))) {
      const p = getSectionProgress(rebirthEra);
      const heroIn = smoothstep(0.06, 0.28, p);
      const heroOut = smoothstep(0.84, 0.99, p);
      const journey = smoothstep(0.08, 0.78, p);
      const exit = smoothstep(0.86, 1, p);

      if (rebirthHeroWrap) {
        rebirthHeroWrap.style.transform = isStaticMode
          ? 'translateX(-50%)'
          : `translateX(-50%) translateY(${((1 - heroIn) * 16 - journey * 10)}px)`;
        rebirthHeroWrap.style.opacity = String(heroIn * (1 - heroOut * 0.96));
      }
      if (rebirthTitleBlock) {
        const titleIn = smoothstep(0.08, 0.27, p);
        const titleOut = smoothstep(0.74, 0.92, p);
        rebirthTitleBlock.style.transform = `translateY(${((1 - titleIn) * 14 - journey * 6)}px)`;
        rebirthTitleBlock.style.opacity = String(titleIn * (1 - titleOut));
      }
      if (rebirthLockup) {
        const lockupIn = smoothstep(0.015, 0.15, p);
        const lockupOut = smoothstep(0.78, 0.94, p);
        rebirthLockup.style.opacity = String(lockupIn * (1 - lockupOut * 0.9));
      }
      if (rebirthNext) {
        const nextIn = smoothstep(0.58, 0.82, p);
        rebirthNext.style.opacity = String(0.25 + nextIn * 0.75 - exit * 0.55);
        rebirthNext.style.transform = `translate3d(${(1 - nextIn) * 10}px, 0, 0)`;
      }
    }

    // 4. Legacy Chapter
    if (activeIndex === 3 || (isTransitioning && (activeIndex === 2 || activeIndex === 4))) {
      const p = getSectionProgress(legacyEra);
      const portraitIn = smoothstep(0.02, 0.22, p);
      const portraitOut = smoothstep(0.82, 0.99, p);
      const journey = smoothstep(0.06, 0.78, p);

      if (legacyPortrait) {
        legacyPortrait.style.transform = isStaticMode ? 'translateY(0px)' : `translateY(${((1 - portraitIn) * 14 - journey * 10)}px)`;
        legacyPortrait.style.opacity = String(portraitIn * (1 - portraitOut * 0.88));
      }
      if (legacyCopy) {
        const copyIn = smoothstep(0.12, 0.32, p);
        const copyOut = smoothstep(0.78, 0.96, p);
        legacyCopy.style.transform = `translateY(${((1 - copyIn) * 12 - journey * 6)}px)`;
        legacyCopy.style.opacity = String(copyIn * (1 - copyOut));
      }
    }

    // 5. Afterlife Chapter
    if (activeIndex === 4 || (isTransitioning && (activeIndex === 3 || activeIndex === 5))) {
      const p = getSectionProgress(afterlifeEra);
      const ritualIn = smoothstep(0.015, 0.22, p);
      const ritualOut = smoothstep(0.86, 0.995, p);
      const journey = smoothstep(0.06, 0.78, p);

      if (afterlifeRitual) {
        afterlifeRitual.style.transform = isStaticMode ? 'translateY(0px)' : `translateY(${((1 - ritualIn) * 14 - journey * 10)}px)`;
        afterlifeRitual.style.opacity = String(ritualIn * (1 - ritualOut * 0.92));
      }
      if (afterlifeCopy) {
        const copyIn = smoothstep(0.12, 0.34, p);
        const copyOut = smoothstep(0.8, 0.965, p);
        afterlifeCopy.style.transform = `translateY(${((1 - copyIn) * 12 - journey * 6)}px)`;
        afterlifeCopy.style.opacity = String(copyIn * (1 - copyOut));
      }
    }

    // 6. Finale Chapter
    if (activeIndex === 5 || (isTransitioning && activeIndex === 4)) {
      const p = getSectionProgress(finaleEra);
      const intro = smoothstep(0.02, 0.34, p);
      if (finaleContent) {
        finaleContent.style.transform = `translateY(${((1 - intro) * 14)}px)`;
        finaleContent.style.opacity = String(intro);
      }
    }

    const vDuration = performance.now() - vStart;
    perfCounters.visualUpdateDurations.push(vDuration);
  }

  function render() {
    const vStart = performance.now();
    perfCounters.visualRenderCalls++;
    if (perfCounters.lastVisualRenderTime > 0) {
      perfCounters.visualFrameDeltas.push(vStart - perfCounters.lastVisualRenderTime);
    }
    perfCounters.lastVisualRenderTime = vStart;

    updateMasterUI();

    if (activeMotionSections.has(experience)) {
      applyMotion(getSectionProgress(experience));
    }
    if (activeMotionSections.has(hutEra)) {
      applyHutMotion(getSectionProgress(hutEra));
    }
    if (activeMotionSections.has(rebirthEra)) {
      applyRebirthMotion(getSectionProgress(rebirthEra));
    }
    if (activeMotionSections.has(legacyEra)) {
      applyLegacyMotion(getSectionProgress(legacyEra));
    }
    if (activeMotionSections.has(afterlifeEra)) {
      applyAfterlifeMotion(getSectionProgress(afterlifeEra));
    }
    if (activeMotionSections.has(finaleEra)) {
      applyFinaleMotion(getSectionProgress(finaleEra));
    }

    const vDuration = performance.now() - vStart;
    perfCounters.visualUpdateDurations.push(vDuration);
  }

  function requestTick() {
    needsRender = true;
    if (!isRunning) {
      isRunning = true;
      rafId = requestAnimationFrame(animationLoop);
    }
  }

  let lastRenderTimestamp = 0;
  const ULTRA_FRAME_INTERVAL_30 = 1000 / 30; // 33.333 ms
  const ULTRA_FRAME_INTERVAL_60 = 1000 / 60; // 16.666 ms

  function animationLoop(timestamp) {
    perfCounters.rafCallbacks++;

    if (document.hidden && !window.__perfBenchmarkRunning) {
      isRunning = false;
      return;
    }
    const now = typeof timestamp === 'number' ? timestamp : performance.now();
    sampleRuntimePerformance(now);

    let keepRunning = false;

    // Mouse parallax easing (strictly disabled in low/ultra performance modes or reduced motion or touch devices)
    if (!isLowPerformance && hasFinePointer && !reducedMotion) {
      const dx = targetMouseX - smoothMouseX;
      const dy = targetMouseY - smoothMouseY;
      if (Math.abs(dx) > 0.0004 || Math.abs(dy) > 0.0004) {
        smoothMouseX += dx * 0.075;
        smoothMouseY += dy * 0.075;
        keepRunning = true;
        needsRender = true;
      } else {
        smoothMouseX = targetMouseX;
        smoothMouseY = targetMouseY;
      }

      if (customCursor && hasCursorMoved) {
        customCursor.style.transform = `translate3d(${cursorClientX}px, ${cursorClientY}px, 0)`;
        hasCursorMoved = false;
      }
    } else {
      smoothMouseX = 0;
      smoothMouseY = 0;
    }

    if (needsRender) {
      if (isUltraPerformance) {
        // ULTRA PERFORMANCE PATH:
        // No normal or low render paths execute. Skipped RAF callbacks do zero DOM/transform work.
        if (use30FpsThrottle) {
          const elapsed = now - lastRenderTimestamp;
          // In standard 60Hz display, RAF ticks arrive at ~16.67ms and ~33.33ms.
          // Using (1000 / 30) - 3.5ms (~29.83ms) ensures tick 1 (16.67ms) is skipped
          // and tick 2 (~33.33ms) renders, ensuring ~30 visual updates/sec.
          if (elapsed >= ULTRA_FRAME_INTERVAL_30 - 3.5) {
            lastRenderTimestamp = now;
            renderUltraMode();
            needsRender = false;
          } else {
            // Skipped RAF callback: DO NOT execute transforms, opacity, or DOM writes!
            keepRunning = true;
          }
        } else {
          lastRenderTimestamp = now;
          renderUltraMode();
          needsRender = false;
        }
      } else {
        // NORMAL / LOW PERFORMANCE PATH
        if (use30FpsThrottle) {
          const elapsed = now - lastRenderTimestamp;
          if (elapsed >= (1000 / 30) - 3.5) {
            lastRenderTimestamp = now;
            render();
            needsRender = false;
          } else {
            keepRunning = true;
          }
        } else {
          lastRenderTimestamp = now;
          render();
          needsRender = false;
        }
      }
    }

    if (keepRunning) {
      rafId = requestAnimationFrame(animationLoop);
    } else {
      isRunning = false;
    }
  }

  function onScroll() {
    latestScrollY = window.scrollY || window.pageYOffset || 0;
    perfCounters.scrollEvents++;
    requestTick();
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  window.__startBenchmark = function(durationSeconds = 5, onComplete) {
    window.__perfBenchmarkRunning = true;
    perfCounters.rafCallbacks = 0;
    perfCounters.visualRenderCalls = 0;
    perfCounters.scrollEvents = 0;
    perfCounters.visualUpdateDurations = [];
    perfCounters.visualFrameDeltas = [];
    perfCounters.lastVisualRenderTime = 0;

    const startTime = performance.now();
    const durationMs = durationSeconds * 1000;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    let scrollRafId = 0;
    const scrollTick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      window.scrollTo(0, t * maxScroll);
      latestScrollY = t * maxScroll;
      perfCounters.scrollEvents++;
      requestTick();

      if (elapsed < durationMs) {
        scrollRafId = requestAnimationFrame(scrollTick);
      } else {
        cancelAnimationFrame(scrollRafId);
        window.__perfBenchmarkRunning = false;
        const actualDuration = performance.now() - startTime;
        const durArr = perfCounters.visualUpdateDurations;
        const deltaArr = perfCounters.visualFrameDeltas;

        const avgTask = durArr.length ? (durArr.reduce((a, b) => a + b, 0) / durArr.length) : 0;
        const maxTask = durArr.length ? Math.max(...durArr) : 0;

        let framesOver33 = 0;
        let framesOver50 = 0;
        for (let i = 0; i < deltaArr.length; i++) {
          if (deltaArr[i] > 50.0) framesOver50++;
          else if (deltaArr[i] > 33.3) framesOver33++;
        }

        const report = {
          durationMs: actualDuration,
          rafCallbacks: perfCounters.rafCallbacks,
          visualRenderCalls: perfCounters.visualRenderCalls,
          scrollEvents: perfCounters.scrollEvents,
          rafFps: Number((perfCounters.rafCallbacks / (actualDuration / 1000)).toFixed(2)),
          visualFps: Number((perfCounters.visualRenderCalls / (actualDuration / 1000)).toFixed(2)),
          avgVisualTaskMs: Number(avgTask.toFixed(3)),
          maxVisualTaskMs: Number(maxTask.toFixed(3)),
          totalIntervals: deltaArr.length,
          framesOver33ms: framesOver33,
          framesOver33msPercent: Number((deltaArr.length ? (framesOver33 / deltaArr.length * 100) : 0).toFixed(2)),
          framesOver50ms: framesOver50,
          framesOver50msPercent: Number((deltaArr.length ? (framesOver50 / deltaArr.length * 100) : 0).toFixed(2))
        };

        console.log('=== BENCHMARK RESULTS (5-SECOND TEST) ===');
        console.log(`RAF callbacks: ${report.rafCallbacks}`);
        console.log(`Visual render calls: ${report.visualRenderCalls}`);
        console.log(`Scroll events: ${report.scrollEvents}`);
        console.log(`Visual FPS: ${report.visualFps}`);
        console.log(`RAF FPS: ${report.rafFps}`);
        console.log(`Avg visual task time: ${report.avgVisualTaskMs} ms`);
        console.log(`Frames > 33.3ms: ${report.framesOver33ms} (${report.framesOver33msPercent}%)`);
        console.log(`Frames > 50.0ms: ${report.framesOver50ms} (${report.framesOver50msPercent}%)`);

        if (typeof onComplete === 'function') onComplete(report);
        return report;
      }
    };
    scrollRafId = requestAnimationFrame(scrollTick);
  };

  /* ==========================================================
     10. POINTER STATE & MOBILE ISOLATION
     ========================================================== */
  let pointerListenersAttached = false;

  function onPointerMove(event) {
    if (event.pointerType === 'touch') return;
    targetMouseX = ((event.clientX / window.innerWidth) - 0.5) * 2;
    targetMouseY = ((event.clientY / window.innerHeight) - 0.5) * 2;
    cursorClientX = event.clientX;
    cursorClientY = event.clientY;
    hasCursorMoved = true;
    requestTick();
  }

  function onPointerLeave() {
    targetMouseX = 0;
    targetMouseY = 0;
    if (customCursor) customCursor.style.opacity = '0';
    requestTick();
  }

  function onPointerEnter() {
    if (!isLowPerformance && customCursor && hasFinePointer && !reducedMotion) {
      customCursor.style.opacity = '1';
    }
  }

  function onPointerOver(event) {
    if (!customCursor || isLowPerformance) return;
    customCursor.classList.toggle('is-hovering', Boolean(event.target.closest('a, button')));
  }

  function setupPointerListeners() {
    if (isLowPerformance) {
      // In LOW-END mode, completely remove custom cursor and pointer tracking
      if (customCursor) {
        document.documentElement.classList.remove('has-custom-cursor');
        customCursor.style.opacity = '0';
        customCursor.style.display = 'none';
      }
      if (pointerListenersAttached) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('pointerenter', onPointerEnter);
        document.removeEventListener('pointerover', onPointerOver);
        pointerListenersAttached = false;
      }
      targetMouseX = 0;
      targetMouseY = 0;
      smoothMouseX = 0;
      smoothMouseY = 0;
      return;
    }

    if (hasFinePointer && !reducedMotion) {
      if (customCursor) {
        document.documentElement.classList.add('has-custom-cursor');
        customCursor.style.display = '';
        customCursor.style.opacity = '1';
      }
      if (!pointerListenersAttached) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerleave', onPointerLeave, { passive: true });
        window.addEventListener('pointerenter', onPointerEnter, { passive: true });
        document.addEventListener('pointerover', onPointerOver, { passive: true });
        pointerListenersAttached = true;
      }
    } else {
      if (customCursor) {
        document.documentElement.classList.remove('has-custom-cursor');
        customCursor.style.opacity = '0';
      }
      if (pointerListenersAttached) {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerleave', onPointerLeave);
        window.removeEventListener('pointerenter', onPointerEnter);
        document.removeEventListener('pointerover', onPointerOver);
        pointerListenersAttached = false;
      }
      targetMouseX = 0;
      targetMouseY = 0;
      smoothMouseX = 0;
      smoothMouseY = 0;
    }
  }

  /* ==========================================================
     11. RESIZE & PAGE VISIBILITY HANDLING
     ========================================================== */
  let resizeTimer = 0;
  function handleLayoutMetricsRefresh() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      cacheSectionMetrics();
      latestScrollY = window.scrollY || window.pageYOffset || 0;
      requestTick();
    }, 100);
  }
  window.addEventListener('resize', handleLayoutMetricsRefresh, { passive: true });
  window.addEventListener('orientationchange', handleLayoutMetricsRefresh, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      isRunning = false;
    } else {
      latestScrollY = window.scrollY || window.pageYOffset || 0;
      requestTick();
    }
  });

  /* ==========================================================
     12. PARTICLE & AMBIENT DECORATION CREATION
     ========================================================== */
  function createEmbers() {
    if (isLowPerformance) return;
    const parent = document.getElementById('embers');
    if (!parent) return;
    const count = window.innerWidth < 760 ? 8 : 18;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const ember = document.createElement('i');
      ember.className = 'ember';
      ember.style.left = `${8 + Math.random() * 84}%`;
      ember.style.top = `${58 + Math.random() * 35}%`;
      ember.style.setProperty('--duration', `${5 + Math.random() * 7}s`);
      ember.style.setProperty('--delay', `${-Math.random() * 10}s`);
      ember.style.setProperty('--drift', `${-45 + Math.random() * 90}px`);
      fragment.appendChild(ember);
    }
    parent.appendChild(fragment);
  }

  function createHutEmbers() {
    if (isLowPerformance) return;
    const parent = document.getElementById('hutEmbers');
    if (!parent) return;
    const count = window.innerWidth < 760 ? 10 : 20;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const ember = document.createElement('i');
      ember.className = 'hut-ember';
      ember.style.left = `${38 + Math.random() * 58}%`;
      ember.style.top = `${48 + Math.random() * 48}%`;
      ember.style.setProperty('--hut-duration', `${5.5 + Math.random() * 8}s`);
      ember.style.setProperty('--hut-delay', `${-Math.random() * 12}s`);
      ember.style.setProperty('--hut-drift', `${-60 + Math.random() * 120}px`);
      fragment.appendChild(ember);
    }
    parent.appendChild(fragment);
  }

  function createRebirthParticles() {
    if (isLowPerformance) return;
    const parent = document.getElementById('rebirthParticles');
    if (!parent) return;
    const count = window.innerWidth < 760 ? 8 : 18;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement('i');
      particle.className = 'rebirth-particle';
      particle.style.left = `${5 + Math.random() * 90}%`;
      particle.style.top = `${58 + Math.random() * 38}%`;
      particle.style.setProperty('--rb-duration', `${6 + Math.random() * 9}s`);
      particle.style.setProperty('--rb-delay', `${-Math.random() * 12}s`);
      particle.style.setProperty('--rb-drift', `${-55 + Math.random() * 110}px`);
      particle.style.setProperty('--rb-size', `${1 + Math.random() * 2.2}px`);
      fragment.appendChild(particle);
    }
    parent.appendChild(fragment);
  }

  function createLegacyDust() {
    if (isLowPerformance) return;
    const parent = document.getElementById('legacyDust');
    if (!parent) return;
    const count = window.innerWidth < 760 ? 10 : 22;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const dust = document.createElement('i');
      dust.style.left = `${20 + Math.random() * 78}%`;
      dust.style.top = `${42 + Math.random() * 52}%`;
      dust.style.setProperty('--lg-duration', `${6 + Math.random() * 10}s`);
      dust.style.setProperty('--lg-delay', `${-Math.random() * 12}s`);
      dust.style.setProperty('--lg-drift', `${-70 + Math.random() * 140}px`);
      dust.style.setProperty('--lg-size', `${0.8 + Math.random() * 2.2}px`);
      fragment.appendChild(dust);
    }
    parent.appendChild(fragment);
  }

  function createAfterlifeDust() {
    if (isLowPerformance) return;
    const parent = document.getElementById('afterlifeDust');
    if (!parent) return;
    const count = window.innerWidth < 760 ? 10 : 22;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const dust = document.createElement('i');
      dust.style.left = `${8 + Math.random() * 84}%`;
      dust.style.top = `${44 + Math.random() * 52}%`;
      dust.style.setProperty('--al-duration', `${6 + Math.random() * 10}s`);
      dust.style.setProperty('--al-delay', `${-Math.random() * 14}s`);
      dust.style.setProperty('--al-drift', `${-80 + Math.random() * 160}px`);
      dust.style.setProperty('--al-size', `${0.8 + Math.random() * 2.4}px`);
      fragment.appendChild(dust);
    }
    parent.appendChild(fragment);
  }

  function createFinaleStars() {
    if (isLowPerformance || !finaleStars) return;
    const count = window.innerWidth < 760 ? 14 : 32;
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i += 1) {
      const star = document.createElement('i');
      star.style.left = `${8 + Math.random() * 84}%`;
      star.style.top = `${5 + Math.random() * 83}%`;
      star.style.setProperty('--fs', `${0.6 + Math.random() * 1.7}px`);
      star.style.setProperty('--fd', `${5 + Math.random() * 8}s`);
      star.style.setProperty('--fdelay', `${-Math.random() * 10}s`);
      fragment.appendChild(star);
    }
    finaleStars.appendChild(fragment);
  }

  /* ==========================================================
     13. CENTRAL NAVIGATION & INTERACTION CONTROLLER
     ========================================================== */
  const CHAPTER_CONFIG = [
    { id: 'hero', aliases: ['home', '01'], section: experience, stage: heroStage, name: 'Hero' },
    { id: 'ascension', aliases: ['release', '02'], section: hutEra, stage: hutStage, name: 'Ascension' },
    { id: 'rebirth', aliases: ['03'], section: rebirthEra, stage: rebirthStage, name: 'Rebirth' },
    { id: 'legacy', aliases: ['04'], section: legacyEra, stage: legacyStage, name: 'Legacy' },
    { id: 'afterlife', aliases: ['05'], section: afterlifeEra, stage: afterlifeStage, name: 'Afterlife' },
    { id: 'finale', aliases: ['06'], section: finaleEra, stage: finaleStage, name: 'Finale' }
  ];

  function getChapterIndex(targetId) {
    if (typeof targetId === 'number') {
      return targetId >= 0 && targetId < CHAPTER_CONFIG.length ? targetId : -1;
    }
    const clean = String(targetId || '').replace(/^#/, '').toLowerCase().trim();
    for (let i = 0; i < CHAPTER_CONFIG.length; i++) {
      if (CHAPTER_CONFIG[i].id === clean || CHAPTER_CONFIG[i].aliases.includes(clean)) {
        return i;
      }
    }
    return -1;
  }

  function getChapterScrollTarget(index) {
    cacheSectionMetrics();
    if (index <= 0) return 0;
    const m = sectionMetrics[index];
    if (!m) return 0;
    return m.start;
  }

  function updateActiveChapterUI(index) {
    if (index < 0 || index >= CHAPTER_CONFIG.length) return;

    // 1. Desktop Navs (.site-header, .hut-nav, .legacy-nav, .afterlife-nav)
    document.querySelectorAll('.desktop-nav a, .hut-nav nav a, .legacy-nav nav a, .afterlife-nav nav a').forEach(link => {
      const href = (link.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
      const linkIdx = getChapterIndex(href);
      const isMatch = linkIdx === index;
      link.classList.toggle('is-active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    // 2. Mobile Nav
    if (mobileMenu) {
      mobileMenu.querySelectorAll('nav a').forEach(link => {
        const href = (link.getAttribute('href') || '').replace(/^#/, '').toLowerCase();
        const linkIdx = getChapterIndex(href);
        const isMatch = linkIdx === index;
        link.classList.toggle('is-active', isMatch);
        if (isMatch) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    // 3. Chapter Rails (.progress-rail, .hut-chapter-rail, .rebirth-rail, .legacy-rail, .afterlife-rail)
    const rails = document.querySelectorAll('.progress-rail, .hut-chapter-rail, .rebirth-rail, .legacy-rail, .afterlife-rail');
    rails.forEach(rail => {
      const items = rail.querySelectorAll('a, div, span.rail-dot');
      items.forEach((item, itemIdx) => {
        const href = item.getAttribute && item.getAttribute('href');
        let isMatch = false;
        if (href) {
          isMatch = getChapterIndex(href) === index;
        } else {
          isMatch = itemIdx === index;
        }
        item.classList.toggle('is-active', isMatch);
        if (isMatch) {
          item.setAttribute('aria-current', 'step');
        } else if (item.hasAttribute('aria-current')) {
          item.removeAttribute('aria-current');
        }
      });
    });

    // 4. Update body dataset
    document.body.dataset.chapter = String(Math.min(index + 1, 6)).padStart(2, '0');
  }

  function navigateToChapter(chapterIdentifier, options = {}) {
    const targetIdx = getChapterIndex(chapterIdentifier);
    if (targetIdx === -1) return false;
    const cfg = CHAPTER_CONFIG[targetIdx];

    // Requirement 8: Prepare target assets immediately
    prepareChapterAssets(targetIdx);
    prepareChapterAssets(targetIdx + 1);
    prefetchChapter(cfg.id);

    // Requirement 7: Stage culling compatibility - immediately unhide target stage so no black flash or blank screen
    if (stageList[targetIdx] && stageList[targetIdx].classList.contains('stage--hidden')) {
      stageList[targetIdx].classList.remove('stage--hidden');
    }
    // If target is hero (replaying or jumping home), ensure heroStage is fully unhidden
    if (targetIdx === 0 && heroStage && heroStage.classList.contains('stage--hidden')) {
      heroStage.classList.remove('stage--hidden');
    }

    // Requirement 4 & 5: Determine target scroll position
    const targetY = getChapterScrollTarget(targetIdx);

    // Requirement 10: Reduced motion handling
    const isReduced = reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = (options.immediate || isReduced) ? 'auto' : 'smooth';

    // Requirement 5 & 9: Native smooth scroll
    window.scrollTo({
      top: targetY,
      behavior
    });
    latestScrollY = targetY;
    requestTick();

    // Requirement 13: Update active chapter UI state
    updateActiveChapterUI(targetIdx);

    // Requirement 38: URL hash & History management
    const cleanId = cfg.id;
    if (options.historyAction === 'push') {
      if (window.location.hash !== '#' + cleanId) {
        history.pushState(null, '', '#' + cleanId);
      }
    } else if (options.historyAction === 'replace') {
      if (window.location.hash !== '#' + cleanId) {
        history.replaceState(null, '', '#' + cleanId);
      }
    }
    return true;
  }

  // Expose for global / programmatic access
  window.navigateToChapter = navigateToChapter;

  // Visualizer control
  const headerAudioCue = document.getElementById('headerAudioCue');
  function toggleVisualizer(forceState) {
    const isCurrentlyPlaying = releasePlay && releasePlay.classList.contains('is-playing');
    const next = typeof forceState === 'boolean' ? forceState : !isCurrentlyPlaying;

    if (releasePlay) {
      releasePlay.classList.toggle('is-playing', next);
      releasePlay.setAttribute('aria-pressed', String(next));
    }
    if (waveform) {
      waveform.classList.toggle('is-playing', next);
    }
    if (soundToggle) {
      soundToggle.classList.toggle('is-playing', next);
      soundToggle.setAttribute('aria-pressed', String(next));
    }
    if (headerAudioCue) {
      headerAudioCue.classList.toggle('is-playing', next);
      headerAudioCue.setAttribute('aria-pressed', String(next));
    }
  }

  if (releasePlay) releasePlay.addEventListener('click', () => toggleVisualizer());
  if (soundToggle) soundToggle.addEventListener('click', () => toggleVisualizer());
  if (headerAudioCue) headerAudioCue.addEventListener('click', () => toggleVisualizer());

  // Mobile menu with focus trap, scroll lock, and escape key
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  let savedScrollY = 0;
  let lastFocusedElement = null;

  function openMenu() {
    if (!menuToggle || !mobileMenu) return;
    lastFocusedElement = document.activeElement;
    savedScrollY = window.scrollY || window.pageYOffset || 0;

    menuToggle.classList.add('is-open');
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');

    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
    document.body.classList.add('menu-open');

    const firstFocusable = mobileMenu.querySelector('a, button');
    if (firstFocusable) {
      window.setTimeout(() => firstFocusable.focus(), 60);
    }
  }

  function closeMenu() {
    if (!menuToggle || !mobileMenu || !mobileMenu.classList.contains('is-open')) return;

    menuToggle.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('menu-open');

    window.scrollTo(0, savedScrollY);
    latestScrollY = savedScrollY;
    requestTick();

    if (lastFocusedElement && lastFocusedElement !== document.body && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    } else if (menuToggle) {
      menuToggle.focus();
    }
  }

  // Skip link activation ensures smooth transfer of focus to hero
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('click', () => {
      const hero = document.getElementById('hero');
      if (hero) {
        window.setTimeout(() => hero.focus(), 60);
      }
    });
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      if (mobileMenu.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', (e) => {
      if (!mobileMenu.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key === 'Tab') {
        const focusables = Array.from(mobileMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || !mobileMenu.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !mobileMenu.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });
  }

  // Global anchor click handler: routes all internal hash links through navigateToChapter
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const targetId = href.replace(/^#/, '');
    const targetIdx = getChapterIndex(targetId);
    if (targetIdx !== -1) {
      event.preventDefault();
      closeMenu();
      navigateToChapter(targetId, { historyAction: 'push' });
    }
  });

  // Browser Back/Forward support (Requirement 40)
  window.addEventListener('popstate', () => {
    const hash = window.location.hash;
    if (hash) {
      navigateToChapter(hash, { historyAction: 'none' });
    } else {
      navigateToChapter('hero', { historyAction: 'none' });
    }
  });

  /* ==========================================================
     14. PROGRESSIVE CHAPTER PRELOADING
     ========================================================== */
  const chapterAssetsMap = {
    hero: [
      'assets/chapter2/ascension-world.webp',
      'assets/chapter2/abel-ascension.webp'
    ],
    home: [
      'assets/chapter2/ascension-world.webp',
      'assets/chapter2/abel-ascension.webp'
    ],
    ascension: [
      'assets/chapter3/rebirth-world.webp',
      'assets/chapter3/abel-rebirth.webp'
    ],
    release: [
      'assets/chapter3/rebirth-world.webp',
      'assets/chapter3/abel-rebirth.webp'
    ],
    rebirth: [
      'assets/chapter4/abel-legacy.webp'
    ],
    legacy: [
      'assets/chapter5/afterlife-temple.webp',
      'assets/chapter5/afterlife-ritual.webp'
    ],
    afterlife: [],
    finale: []
  };

  const preloadedUrls = new Set();

  function prefetchChapter(sectionId) {
    const canonicalKey = (sectionId || '').replace(/^#/, '').toLowerCase();
    const urls = chapterAssetsMap[canonicalKey];
    if (!urls) return;
    urls.forEach(url => {
      if (preloadedUrls.has(url)) return;
      preloadedUrls.add(url);
      const img = new Image();
      img.src = url;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }

  const chapterPreloadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target.id) {
        prefetchChapter(entry.target.id);
      }
    });
  }, { rootMargin: '100% 0px 100% 0px', threshold: 0 });

  sectionList.forEach(section => chapterPreloadObserver.observe(section));

  /* ==========================================================
     15. HERO PRELOADER & INITIALIZATION
     ========================================================== */
  function handleInitialDeepLink() {
    const hash = window.location.hash;
    if (hash && hash !== '#') {
      const idx = getChapterIndex(hash);
      if (idx !== -1) {
        window.setTimeout(() => {
          navigateToChapter(hash, { historyAction: 'replace', immediate: true });
        }, 120);
      }
    }
  }

  function preloadHeroAssets() {
    if (!preloader || !preloaderBar || !preloaderValue) return;

    // Only load critical Hero imagery in WebP for fast initial paint
    const heroCriticalAssets = [
      'assets/images/hero.webp',
      isLowPerformance ? 'assets/images/hero_background-mobile.webp' : 'assets/images/hero_background.webp',
      'assets/images/smoke_hero.webp',
      'assets/images/smoke_hero1.webp',
      'assets/images/album_artwork.webp'
    ];
    let completed = 0;
    let hidden = false;

    const finish = () => {
      if (hidden) return;
      hidden = true;
      preloaderBar.style.width = '100%';
      preloaderValue.textContent = '100';
      window.setTimeout(() => {
        preloader.classList.add('is-hidden');
        document.body.classList.add('is-ready');
        // Stabilize page before enabling runtime frame-drop monitoring
        window.setTimeout(() => {
          pageStabilized = true;
        }, 300);
        // Idle prefetch Chapter 2 once the hero is ready
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(() => prefetchChapter('hero'));
        } else {
          window.setTimeout(() => prefetchChapter('hero'), 250);
        }
        // Handle deep-link anchor if URL had #chapter on load
        handleInitialDeepLink();
      }, 160);
    };

    const update = () => {
      completed += 1;
      const progress = Math.round((completed / heroCriticalAssets.length) * 100);
      preloaderBar.style.width = `${progress}%`;
      preloaderValue.textContent = String(progress);
      if (completed >= heroCriticalAssets.length) finish();
    };

    heroCriticalAssets.forEach(src => {
      const image = new Image();
      image.onload = update;
      image.onerror = update;
      image.src = src;
    });

    window.setTimeout(finish, 1800);
  }

  cacheSectionMetrics();
  activeMotionSections.add(experience);
  setupPointerListeners();

  createEmbers();
  createHutEmbers();
  createRebirthParticles();
  createLegacyDust();
  createAfterlifeDust();
  createFinaleStars();
  preloadHeroAssets();
  initDebugBadge();

  // Prepare current chapter + next chapter only (Requirements 8 & 9)
  prepareChapterAssets(0);
  prepareChapterAssets(1);

  // Initial pass
  latestScrollY = window.scrollY || window.pageYOffset || 0;
  if (isUltraPerformance) {
    renderUltraMode();
  } else {
    render();
  }
})();

