/**
 * Main Application Orchestrator for Loy Krathong
 * Fully responsive for Mobile, iPad, Tablet, and Desktop.
 * Zero emojis, authentic Thai festival aesthetic.
 */

(function () {
  // --- App State ---
  const state = {
    screen: 'welcome',
    isCoupleMode: true,
    baseType: 'banana-leaf',
    flowerType: 'lotus-bud',
    coinType: 'gold',
    candleColor: 'gold',
    isLit: true,
    name1: 'คนที่ 1',
    name2: 'คนที่ 2',
    tagText: 'ลอยกระทงวันเพ็ญ',
    wish: 'ขอขมาพระแม่คงคา ขอให้มีความสุขความเจริญ สุขภาพแข็งแรง แคล้วคลาดปลอดภัยจากภยันตรายทั้งปวง',
    secretLetter: 'ประเพณีลอยกระทง วันเพ็ญเดือน ๑๒ ร่วมลอยกระทงลงสู่สายน้ำเพื่อความเป็นสิริมงคล ขอขมาพระแม่คงคา และขอพรให้มีแต่ความร่มเย็นเป็นสุขในชีวิต',
    
    // Photos
    photoBoy: null,
    photoGirl: null,
    
    // River Scene Entities
    krathongs: [],
    lanterns: [],
    stars: [],
    waterRipples: []
  };

  const riverCanvas = document.getElementById('river-canvas');
  const riverCtx = riverCanvas.getContext('2d');
  const previewCanvas = document.getElementById('preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');

  let fireworks = null;
  let animFrameId = null;

  function init() {
    setupCanvas();
    preloadPhotos();
    fireworks = new FireworksEngine(riverCanvas);
    generateStars();
    generateInitialLanterns();
    bindEvents();
    startLoop();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100);
    });
  }

  function setupCanvas() {
    riverCanvas.width = window.innerWidth;
    riverCanvas.height = window.innerHeight;
  }

  function handleResize() {
    setupCanvas();
    if (fireworks) fireworks.resize();
    generateStars();
    if (state.screen === 'river') {
      setupRiverKrathongs();
    }
  }

  function preloadPhotos() {
    const boyImg = new Image();
    boyImg.src = 'assets/boy.jpg';
    boyImg.onload = () => {
      state.photoBoy = boyImg;
    };

    const girlImg = new Image();
    girlImg.src = 'assets/girl.jpg';
    girlImg.onload = () => {
      state.photoGirl = girlImg;
    };
  }

  function generateStars() {
    state.stars = [];
    const count = Math.floor((window.innerWidth * window.innerHeight) / 9500);
    for (let i = 0; i < count; i++) {
      state.stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.6),
        r: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function generateInitialLanterns() {
    state.lanterns = [];
    for (let i = 0; i < 15; i++) {
      state.lanterns.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.45) + 30,
        vx: (Math.random() - 0.5) * 0.35 + 0.18,
        vy: -(Math.random() * 0.35 + 0.22),
        scale: Math.random() * 0.3 + 0.22,
        alpha: Math.random() * 0.6 + 0.35,
        text: ''
      });
    }
  }

  function setScreen(screenName) {
    state.screen = screenName;
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.classList.add('active');
    }

    if (screenName === 'river') {
      setupRiverKrathongs();
      document.getElementById('river-names-header').textContent = `${state.name1} และ ${state.name2}`;
      
      setTimeout(() => {
        const hint = document.getElementById('river-hint');
        if (hint) hint.style.opacity = '0';
      }, 5000);

      if (window.romanticAudio) {
        window.romanticAudio.playWaterSplash();
      }
    }
  }

  // Calculate dynamic river horizon based on screen aspect ratio
  function getRiverHorizon(h, w) {
    const isPortrait = h > w;
    const isMobile = w < 600;
    if (isMobile) {
      return h * 0.58; // 42% river on mobile
    } else if (isPortrait) {
      return h * 0.60; // 40% river on iPad portrait
    } else {
      return h * 0.66; // 34% river on landscape / desktop
    }
  }

  function setupRiverKrathongs() {
    state.krathongs = [];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isMobile = w < 600;
    const isTablet = w >= 600 && w <= 1024;
    
    // Position krathongs in the upper-middle region of the water surface
    const riverHorizon = getRiverHorizon(h, w);
    const krathongY = riverHorizon + (h - riverHorizon) * 0.32;
    const centerX = w * 0.5;

    // Responsive sizing and spacing
    const krathongScale = isMobile ? 0.88 : (isTablet ? 1.0 : 1.15);
    const pairSpacing = isMobile ? 48 : (isTablet ? 62 : 72);

    if (state.isCoupleMode) {
      // Krathong 1: Person 1 (Boy)
      state.krathongs.push({
        x: centerX - pairSpacing,
        y: krathongY,
        targetY: krathongY,
        vx: 0.15,
        vy: 0,
        scale: krathongScale,
        name: state.name1,
        isPartner: false,
        offsetPhase: 0,
        photoImage: state.photoBoy,
        photoImage2: null
      });

      // Krathong 2: Person 2 (Girl)
      state.krathongs.push({
        x: centerX + pairSpacing,
        y: krathongY + (isMobile ? 8 : 12),
        targetY: krathongY + (isMobile ? 8 : 12),
        vx: 0.15,
        vy: 0,
        scale: krathongScale,
        name: state.name2,
        isPartner: true,
        offsetPhase: Math.PI * 0.6,
        photoImage: state.photoGirl,
        photoImage2: null
      });
    } else {
      // Single Combined Krathong
      state.krathongs.push({
        x: centerX,
        y: krathongY,
        targetY: krathongY,
        vx: 0.15,
        vy: 0,
        scale: krathongScale * 1.25,
        name: `${state.name1} และ ${state.name2}`,
        isPartner: false,
        offsetPhase: 0,
        photoImage: state.photoBoy,
        photoImage2: state.photoGirl
      });
    }
  }

  function bindEvents() {
    document.getElementById('btn-start-create').addEventListener('click', () => {
      if (window.romanticAudio) window.romanticAudio.ensureContext();
      setScreen('customizer');
    });

    document.getElementById('btn-back-welcome').addEventListener('click', () => {
      setScreen('welcome');
    });

    document.getElementById('btn-go-river').addEventListener('click', () => {
      state.name1 = document.getElementById('input-name1').value.trim() || 'คนที่ 1';
      state.name2 = document.getElementById('input-name2').value.trim() || 'คนที่ 2';
      state.tagText = document.getElementById('input-tag').value.trim() || 'ลอยกระทงวันเพ็ญ';
      state.wish = document.getElementById('input-wish').value.trim() || 'ขอขมาพระแม่คงคา';
      state.secretLetter = document.getElementById('input-letter').value.trim() || 'ประเพณีลอยกระทง';
      
      setScreen('river');

      if (window.romanticAudio && !window.romanticAudio.isPlayingMusic) {
        window.romanticAudio.startMusic();
        updateMusicUI(true);
      }
    });

    // Customizer Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
        const targetId = btn.getAttribute('data-tab');
        const content = document.getElementById(targetId);
        if (content) content.style.display = 'block';
      });
    });

    // Option Grids
    setupOptionGrid('grid-base', (val) => { state.baseType = val; });
    setupOptionGrid('grid-flower', (val) => { state.flowerType = val; });
    setupOptionGrid('grid-coin', (val) => { state.coinType = val; });

    // Wish chips
    document.querySelectorAll('.wish-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const wishText = chip.getAttribute('data-wish');
        document.getElementById('input-wish').value = wishText;
        state.wish = wishText;
        if (window.romanticAudio) window.romanticAudio.playChime(880, 0.15);
      });
    });

    // Custom photo file input handlers
    document.getElementById('input-photo-boy').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            state.photoBoy = img;
            document.getElementById('preview-slot-boy').src = event.target.result;
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('input-photo-girl').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            state.photoGirl = img;
            document.getElementById('preview-slot-girl').src = event.target.result;
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Toggle Preview Light
    const btnPreviewLight = document.getElementById('btn-preview-light');
    btnPreviewLight.addEventListener('click', () => {
      state.isLit = !state.isLit;
      document.getElementById('preview-light-text').textContent = state.isLit ? 'ดับเทียน' : 'จุดเทียน';
      if (state.isLit && window.romanticAudio) {
        window.romanticAudio.playCandleLight();
      }
    });

    // Toggle Preview Mode
    const btnPreviewMode = document.getElementById('btn-preview-mode');
    btnPreviewMode.addEventListener('click', () => {
      state.isCoupleMode = !state.isCoupleMode;
      document.getElementById('preview-mode-text').textContent = state.isCoupleMode ? 'สลับเป็นกระทงเดี่ยว' : 'สลับเป็นสองกระทง';
      if (window.romanticAudio) window.romanticAudio.playChime(660, 0.15);
    });

    // Music Toggle
    const btnMusic = document.getElementById('btn-toggle-music');
    btnMusic.addEventListener('click', () => {
      if (window.romanticAudio) {
        const isPlaying = window.romanticAudio.toggleMusic();
        updateMusicUI(isPlaying);
      }
    });

    // Riverside Pier Widget Tap Event
    const pierWidget = document.getElementById('pier-widget');
    pierWidget.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = pierWidget.getBoundingClientRect();
      spawnFloatingSparkle(rect.left + 35, rect.top);
      spawnFloatingSparkle(rect.left + 65, rect.top - 10);
      if (window.romanticAudio) window.romanticAudio.playChime(784, 0.2);
      if (fireworks) {
        fireworks.launch(window.innerWidth * 0.25, window.innerHeight * 0.28);
      }
    });

    // River Dock Controls
    document.getElementById('dock-btn-firework').addEventListener('click', () => {
      const x = window.innerWidth * (0.25 + Math.random() * 0.5);
      const y = window.innerHeight * (0.15 + Math.random() * 0.25);
      fireworks.launch(x, y);
    });

    document.getElementById('dock-btn-lantern').addEventListener('click', () => {
      openModal('modal-lantern');
    });

    document.getElementById('btn-confirm-lantern').addEventListener('click', () => {
      const wishText = document.getElementById('lantern-wish-input').value.trim();
      releaseLantern(wishText);
      closeModal('modal-lantern');
    });

    document.getElementById('dock-btn-letter').addEventListener('click', () => {
      openSecretLetter();
    });

    document.getElementById('dock-btn-polaroid').addEventListener('click', () => {
      openPolaroid();
    });

    document.getElementById('dock-btn-relight').addEventListener('click', () => {
      state.isLit = !state.isLit;
      if (state.isLit && window.romanticAudio) {
        window.romanticAudio.playCandleLight();
      }
    });

    document.getElementById('dock-btn-edit').addEventListener('click', () => {
      setScreen('customizer');
    });

    // Interactive Tap on River Screen
    riverCanvas.addEventListener('pointerdown', (e) => {
      if (state.screen !== 'river') return;

      const rect = riverCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let clickedKrathong = false;
      for (const k of state.krathongs) {
        const dist = Math.hypot(clickX - k.x, clickY - k.y);
        if (dist < 85 * k.scale) {
          clickedKrathong = true;
          spawnWaterRipple(k.x, k.y);
          spawnFloatingSparkle(k.x, k.y);
          openSecretLetter();
          break;
        }
      }

      if (!clickedKrathong && clickY < getRiverHorizon(window.innerHeight, window.innerWidth) + 20) {
        fireworks.launch(clickX, clickY);
        spawnFloatingSparkle(clickX, clickY);
      }
    });

    // Modal Close
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal(btn.getAttribute('data-close'));
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });
  }

  function setupOptionGrid(gridId, onChange) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const items = grid.querySelectorAll('.option-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        const val = item.getAttribute('data-val');
        onChange(val);
        if (window.romanticAudio) window.romanticAudio.playChime(660, 0.1);
      });
    });
  }

  function updateMusicUI(isPlaying) {
    const label = document.getElementById('music-label');
    if (isPlaying) {
      label.textContent = 'หยุดเสียงดนตรี';
    } else {
      label.textContent = 'เปิดเสียงดนตรี';
    }
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
  }

  function openSecretLetter() {
    document.getElementById('letter-subtitle').textContent = `ผู้ร่วมลอยกระทง: ${state.name1} และ ${state.name2}`;
    document.getElementById('letter-body-text').textContent = state.wish;
    document.getElementById('letter-signature').textContent = `บันทึกคำอธิษฐานวันเพ็ญเดือน ๑๒ • ${state.name1} และ ${state.name2}`;
    openModal('modal-letter');
    if (window.romanticAudio) window.romanticAudio.playChime(950, 0.25);
  }

  function openPolaroid() {
    const dataUrl = PolaroidGenerator.generateCard({
      name1: state.name1,
      name2: state.name2,
      wish: state.wish,
      krathongConfig: {
        baseType: state.baseType,
        flowerType: state.flowerType,
        candleColor: state.candleColor,
        coinType: state.coinType,
        isCoupleMode: state.isCoupleMode
      },
      photoImage: state.photoBoy,
      photoImage2: state.photoGirl
    });

    const img = document.getElementById('polaroid-img');
    img.src = dataUrl;

    const downloadLink = document.getElementById('btn-download-polaroid');
    downloadLink.href = dataUrl;
    downloadLink.download = `LoyKrathong-${state.name1}-${state.name2}.png`;

    openModal('modal-polaroid');
    if (window.romanticAudio) window.romanticAudio.playChime(1046, 0.3);
  }

  function releaseLantern(text) {
    state.lanterns.push({
      x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 100,
      y: window.innerHeight * 0.75,
      vx: (Math.random() - 0.5) * 0.4 + 0.15,
      vy: -(Math.random() * 0.5 + 0.6),
      scale: 0.8,
      alpha: 1,
      text: text || ''
    });

    if (window.romanticAudio) {
      window.romanticAudio.playChime(784, 0.2);
    }
  }

  function spawnWaterRipple(x, y) {
    state.waterRipples.push({
      x: x,
      y: y,
      r: 8,
      maxR: 80,
      alpha: 0.55
    });
  }

  function spawnFloatingSparkle(x, y) {
    const spark = document.createElement('div');
    spark.className = 'sparkle-float';
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 2500);
  }

  function startLoop() {
    function render(time) {
      drawRiverScene(time);

      if (fireworks) {
        fireworks.updateAndDraw();
      }

      if (state.screen === 'customizer') {
        drawCustomizerPreview(time);
      }

      if (state.screen === 'river' && Math.random() < 0.003) {
        const fx = window.innerWidth * (0.15 + Math.random() * 0.7);
        const fy = window.innerHeight * (0.15 + Math.random() * 0.22);
        fireworks.launch(fx, fy);
      }

      animFrameId = requestAnimationFrame(render);
    }

    animFrameId = requestAnimationFrame(render);
  }

  function drawRiverScene(time) {
    const w = riverCanvas.width;
    const h = riverCanvas.height;
    const ctx = riverCtx;
    const isPortrait = h > w;
    const isMobile = w < 600;

    ctx.clearRect(0, 0, w, h);

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#050814');
    skyGrad.addColorStop(0.4, '#0d1933');
    skyGrad.addColorStop(0.65, '#1e1b4b');
    skyGrad.addColorStop(1, '#081426');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    if (fireworks && fireworks.ambientFlash > 0.01) {
      ctx.fillStyle = `rgba(255, 230, 240, ${fireworks.ambientFlash * 0.2})`;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Stars
    state.stars.forEach(s => {
      const alpha = s.baseAlpha + Math.sin(time * s.twinkleSpeed + s.phase) * 0.25;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
      ctx.fill();
    });

    // 3. Full Moon (Scales gracefully on mobile and iPad)
    const moonX = isMobile ? w * 0.76 : (isPortrait ? w * 0.8 : w * 0.82);
    const moonY = isMobile ? h * 0.16 : (isPortrait ? h * 0.17 : h * 0.2);
    const moonR = isMobile ? 38 : (isPortrait ? 46 : 54);

    const haloGrad = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 3);
    haloGrad.addColorStop(0, 'rgba(255, 245, 210, 0.4)');
    haloGrad.addColorStop(0.5, 'rgba(255, 215, 100, 0.12)');
    haloGrad.addColorStop(1, 'rgba(255, 215, 100, 0)');
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
    ctx.fillStyle = haloGrad;
    ctx.fill();

    const moonGrad = ctx.createRadialGradient(moonX - moonR * 0.2, moonY - moonR * 0.2, moonR * 0.1, moonX, moonY, moonR);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.5, '#fff7d6');
    moonGrad.addColorStop(1, '#ffd166');
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = moonGrad;
    ctx.fill();

    ctx.fillStyle = 'rgba(212, 163, 115, 0.22)';
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.2, moonY + moonR * 0.2, moonR * 0.25, 0, Math.PI * 2);
    ctx.arc(moonX + moonR * 0.3, moonY - moonR * 0.25, moonR * 0.18, 0, Math.PI * 2);
    ctx.arc(moonX + moonR * 0.35, moonY + moonR * 0.3, moonR * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 4. Shoreline & Pagoda (Calculated from dynamic river horizon)
    const riverY = getRiverHorizon(h, w);
    ctx.fillStyle = '#060d1b';
    ctx.beginPath();
    ctx.moveTo(0, riverY);
    const pagX = w * (isMobile ? 0.22 : 0.28);
    const pagH = isMobile ? 55 : 80;
    ctx.lineTo(pagX - (isMobile ? 40 : 60), riverY - 10);
    ctx.lineTo(pagX - (isMobile ? 18 : 25), riverY - 16);
    ctx.lineTo(pagX, riverY - pagH);
    ctx.lineTo(pagX + (isMobile ? 18 : 25), riverY - 16);
    ctx.lineTo(pagX + (isMobile ? 40 : 60), riverY - 10);
    ctx.lineTo(w, riverY - 14);
    ctx.lineTo(w, riverY);
    ctx.closePath();
    ctx.fill();

    // Shoreline lights
    const lightsCount = isMobile ? 18 : 28;
    for (let i = 0; i < lightsCount; i++) {
      const lx = (w * 0.08) + i * (w * (isMobile ? 0.05 : 0.032));
      const ly = riverY - 10 + Math.sin(i * 0.8) * 5;
      ctx.beginPath();
      ctx.arc(lx, ly, isMobile ? 1.8 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // 5. Sky Lanterns
    updateAndDrawLanterns(ctx, time);

    // 6. Water Surface
    const waterGrad = ctx.createLinearGradient(0, riverY, 0, h);
    waterGrad.addColorStop(0, '#0a192f');
    waterGrad.addColorStop(0.4, '#0d253f');
    waterGrad.addColorStop(1, '#051124');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, riverY, w, h - riverY);

    // Water Moon Reflection
    for (let y = riverY + 8; y < h; y += (isMobile ? 16 : 14)) {
      const prog = (y - riverY) / (h - riverY);
      const rw = (isMobile ? 18 : 25) + prog * (isMobile ? 65 : 95);
      const wobble = Math.sin(time * 0.002 + y * 0.05) * 8;
      ctx.beginPath();
      ctx.ellipse(moonX + wobble, y, rw, isMobile ? 2.0 : 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 235, 150, ${0.35 - prog * 0.22})`;
      ctx.fill();
    }

    // 7. Water Ripples
    for (let i = state.waterRipples.length - 1; i >= 0; i--) {
      const rp = state.waterRipples[i];
      rp.r += 0.7;
      rp.alpha -= 0.006;
      if (rp.alpha <= 0 || rp.r >= rp.maxR) {
        state.waterRipples.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.32, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 225, 255, ${rp.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 8. Draw Krathongs
    if (state.screen === 'river') {
      updateAndDrawKrathongs(ctx, time);
    }
  }

  function updateAndDrawLanterns(ctx, time) {
    for (let i = state.lanterns.length - 1; i >= 0; i--) {
      const lt = state.lanterns[i];
      lt.x += lt.vx;
      lt.y += lt.vy;
      lt.x += Math.sin(time * 0.0015 + i) * 0.3;

      if (lt.y < -50) {
        lt.y = riverCanvas.height * 0.55;
        lt.x = Math.random() * riverCanvas.width;
      }

      ctx.save();
      ctx.translate(lt.x, lt.y);
      ctx.scale(lt.scale, lt.scale);

      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 30, 0, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 32);
      glow.addColorStop(0, 'rgba(255, 200, 60, 0.8)');
      glow.addColorStop(0.6, 'rgba(255, 140, 20, 0.3)');
      glow.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(-10, -16, 20, 32, [4, 4, 2, 2]);
      const bodyGrad = ctx.createLinearGradient(0, -16, 0, 16);
      bodyGrad.addColorStop(0, '#ffd166');
      bodyGrad.addColorStop(0.6, '#ff9f1c');
      bodyGrad.addColorStop(1, '#e85d04');
      ctx.fillStyle = bodyGrad;
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 8, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      if (lt.text && lt.scale > 0.6) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "Prompt", sans-serif';
        ctx.textAlign = 'center';
        const display = lt.text.length > 10 ? lt.text.substring(0, 9) + '…' : lt.text;
        ctx.fillText(display, 0, -22);
      }

      ctx.restore();
    }
  }

  function updateAndDrawKrathongs(ctx, time) {
    if (state.krathongs.length >= 2) {
      const k1 = state.krathongs[0];
      const k2 = state.krathongs[1];
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(k1.x, k1.y + 10);
      const midX = (k1.x + k2.x) / 2;
      const midY = (k1.y + k2.y) / 2 + 16 + Math.sin(time * 0.002) * 4;
      ctx.quadraticCurveTo(midX, midY, k2.x, k2.y + 10);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([3, 3]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.fill();
      ctx.restore();
    }

    state.krathongs.forEach((k) => {
      k.x += k.vx;
      const bobbing = Math.sin(time * 0.002 + k.offsetPhase) * 6;
      const tilt = Math.cos(time * 0.0018 + k.offsetPhase) * 0.04;
      const curY = k.y + bobbing;

      if (k.x > riverCanvas.width + 120) {
        k.x = -100;
      }

      if (Math.random() < 0.035) {
        spawnWaterRipple(k.x, curY + 28);
      }

      window.KrathongArt.draw(ctx, k.x, curY, k.scale, {
        baseType: state.baseType,
        flowerType: state.flowerType,
        candleColor: state.candleColor,
        coinType: state.coinType,
        isLit: state.isLit,
        names: k.name,
        photoImage: k.photoImage,
        photoImage2: k.photoImage2,
        rotation: tilt
      }, time);
    });
  }

  function drawCustomizerPreview(time) {
    const w = previewCanvas.width;
    const h = previewCanvas.height;
    previewCtx.clearRect(0, 0, w, h);

    const bobbing = Math.sin(time * 0.0025) * 4;
    const centerX = w * 0.5;
    const centerY = h * 0.52 + bobbing;

    if (state.isCoupleMode) {
      window.KrathongArt.draw(previewCtx, centerX - 55, centerY - 6, 0.85, {
        baseType: state.baseType,
        flowerType: state.flowerType,
        candleColor: state.candleColor,
        coinType: state.coinType,
        isLit: state.isLit,
        names: state.name1,
        photoImage: state.photoBoy,
        photoImage2: null
      }, time);

      window.KrathongArt.draw(previewCtx, centerX + 55, centerY + 8, 0.85, {
        baseType: state.baseType,
        flowerType: state.flowerType,
        candleColor: state.candleColor,
        coinType: state.coinType,
        isLit: state.isLit,
        names: state.name2,
        photoImage: state.photoGirl,
        photoImage2: null
      }, time + 500);
    } else {
      window.KrathongArt.draw(previewCtx, centerX, centerY, 1.25, {
        baseType: state.baseType,
        flowerType: state.flowerType,
        candleColor: state.candleColor,
        coinType: state.coinType,
        isLit: state.isLit,
        names: `${state.name1} และ ${state.name2}`,
        photoImage: state.photoBoy,
        photoImage2: state.photoGirl
      }, time);
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
