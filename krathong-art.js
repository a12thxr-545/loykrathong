/**
 * Krathong Visual Art & Rendering Engine
 * Authentic Thai aesthetic: traditional banana leaf, lotus petals, bread base,
 * flickering candles, incense sticks, and realistic water reflections.
 * Completely free of emojis and romantic themes.
 */

class KrathongArt {
  /**
   * Draw a krathong on a canvas 2D context
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} scale - Scaling factor
   * @param {Object} options - Customization options
   * @param {number} time - Animation timestamp (ms)
   */
  static draw(ctx, x, y, scale = 1, options = {}, time = 0) {
    const {
      baseType = 'banana-leaf',
      flowerType = 'lotus-bud',
      candleColor = 'gold',
      coinType = 'gold',
      isLit = true,
      names = '',
      photoImage = null,
      photoImage2 = null,
      rotation = 0
    } = options;

    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) ctx.rotate(rotation);
    ctx.scale(scale, scale);

    // 1. Water shadow & ambient water glow
    this.drawBaseShadow(ctx, baseType, isLit);

    // 2. Base Krathong
    switch (baseType) {
      case 'lotus':
        this.drawLotusBase(ctx, '#ffb3c6', '#fb6f92', '#800f2f');
        break;
      case 'royal':
        this.drawLotusBase(ctx, '#e9d8a6', '#ee9b00', '#9b2226');
        break;
      case 'bread':
        this.drawBreadBase(ctx);
        break;
      case 'natural-leaf':
        this.drawNaturalLeafBase(ctx);
        break;
      case 'banana-leaf':
      default:
        this.drawBananaLeafBase(ctx);
        break;
    }

    // 3. Flower Fillings
    this.drawFlowers(ctx, flowerType, baseType);

    // 4. Coin / Token (Traditional Thai offering)
    if (coinType !== 'none') {
      this.drawCoin(ctx, coinType);
    }

    // 5. Mini Photo / Name Tag
    this.drawNameTagOrPhoto(ctx, names, photoImage, photoImage2);

    // 6. Incense Sticks (ธูป 3 ดอก) with smoke
    this.drawIncense(ctx, isLit, time);

    // 7. Candle (เทียนบูชา)
    this.drawCandle(ctx, candleColor, isLit, time);

    ctx.restore();
  }

  // Draw soft water shadow & water reflection
  static drawBaseShadow(ctx, baseType, isLit) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 32, 68, 22, 0, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(0, 32, 10, 0, 32, 70);
    grad.addColorStop(0, 'rgba(0, 10, 25, 0.7)');
    grad.addColorStop(1, 'rgba(0, 10, 25, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    if (isLit) {
      ctx.beginPath();
      ctx.ellipse(0, 38, 55, 16, 0, 0, Math.PI * 2);
      const glowGrad = ctx.createRadialGradient(0, 38, 5, 0, 38, 60);
      glowGrad.addColorStop(0, 'rgba(255, 180, 50, 0.45)');
      glowGrad.addColorStop(0.5, 'rgba(255, 120, 20, 0.2)');
      glowGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fill();
    }
    ctx.restore();
  }

  // Traditional Folded Banana Leaf (กระทงใบตอง)
  static drawBananaLeafBase(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 18, 48, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1b4332';
    ctx.fill();

    const petalsCount = 14;
    for (let i = 0; i < petalsCount; i++) {
      const angle = (i / petalsCount) * Math.PI * 2;
      const px = Math.cos(angle) * 58;
      const py = Math.sin(angle) * 24 + 16;
      this.drawBananaPetal(ctx, px, py, angle, false);
    }

    for (let i = 0; i < petalsCount; i++) {
      const angle = ((i + 0.5) / petalsCount) * Math.PI * 2;
      const px = Math.cos(angle) * 44;
      const py = Math.sin(angle) * 18 + 14;
      this.drawBananaPetal(ctx, px, py, angle, true);
    }

    ctx.beginPath();
    ctx.ellipse(0, 14, 38, 14, 0, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(0, 14, 5, 0, 14, 40);
    innerGrad.addColorStop(0, '#40916c');
    innerGrad.addColorStop(1, '#1b4332');
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.restore();
  }

  static drawBananaPetal(ctx, x, y, angle, isInner) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    const w = isInner ? 14 : 18;
    const h = isInner ? 26 : 32;

    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(w * 0.9, -h * 0.4, w, h * 0.5, 0, h);
    ctx.bezierCurveTo(-w, h * 0.5, -w * 0.9, -h * 0.4, 0, -h);

    const grad = ctx.createLinearGradient(0, -h, 0, h);
    if (isInner) {
      grad.addColorStop(0, '#74c69d');
      grad.addColorStop(0.5, '#40916c');
      grad.addColorStop(1, '#1b4332');
    } else {
      grad.addColorStop(0, '#52b788');
      grad.addColorStop(0.6, '#2d6a4f');
      grad.addColorStop(1, '#081c15');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.lineTo(0, h * 0.8);
    ctx.strokeStyle = isInner ? '#d8f3dc' : '#95d5b2';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -h + 2, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();

    ctx.restore();
  }

  // Natural Leaf / Banana Trunk Krathong (กาบกล้วยธรรมชาติ)
  static drawNaturalLeafBase(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 18, 54, 20, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2d6a4f';
    ctx.fill();

    const petalsCount = 12;
    for (let i = 0; i < petalsCount; i++) {
      const angle = (i / petalsCount) * Math.PI * 2;
      const px = Math.cos(angle) * 52;
      const py = Math.sin(angle) * 22 + 16;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 26, 0, 0, Math.PI * 2);
      const lg = ctx.createLinearGradient(0, -26, 0, 26);
      lg.addColorStop(0, '#95d5b2');
      lg.addColorStop(0.7, '#2d6a4f');
      lg.addColorStop(1, '#1b4332');
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.ellipse(0, 14, 36, 13, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1b4332';
    ctx.fill();
    ctx.restore();
  }

  // Lotus Petal Krathong (กระทงกลีบบัวหลวง)
  static drawLotusBase(ctx, cLight, cMid, cDark) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 18, 50, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2d6a4f';
    ctx.fill();

    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const px = Math.cos(angle) * 56;
      const py = Math.sin(angle) * 22 + 16;
      this.drawLotusPetal(ctx, px, py, angle, 20, 36, cLight, cMid, cDark);
    }

    for (let i = 0; i < count; i++) {
      const angle = ((i + 0.5) / count) * Math.PI * 2;
      const px = Math.cos(angle) * 40;
      const py = Math.sin(angle) * 16 + 14;
      this.drawLotusPetal(ctx, px, py, angle, 16, 28, '#ffffff', cLight, cMid);
    }

    ctx.beginPath();
    ctx.ellipse(0, 14, 32, 12, 0, 0, Math.PI * 2);
    const podGrad = ctx.createRadialGradient(0, 14, 2, 0, 14, 32);
    podGrad.addColorStop(0, '#ffd166');
    podGrad.addColorStop(1, '#2d6a4f');
    ctx.fillStyle = podGrad;
    ctx.fill();
    ctx.restore();
  }

  static drawLotusPetal(ctx, x, y, angle, w, h, c1, c2, c3) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.bezierCurveTo(w, -h * 0.3, w * 0.8, h * 0.6, 0, h);
    ctx.bezierCurveTo(-w * 0.8, h * 0.6, -w, -h * 0.3, 0, -h);

    const grad = ctx.createLinearGradient(0, -h, 0, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.4, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  // Eco Bread Krathong (กระทงขนมปังย่อยสลายง่าย)
  static drawBreadBase(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 16, 54, 24, 0, 0, Math.PI * 2);
    const breadGrad = ctx.createRadialGradient(0, 10, 8, 0, 16, 56);
    breadGrad.addColorStop(0, '#f4d06f');
    breadGrad.addColorStop(0.6, '#e09f3e');
    breadGrad.addColorStop(1, '#9e5a1b');
    ctx.fillStyle = breadGrad;
    ctx.fill();
    ctx.strokeStyle = '#7f4410';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 14, 38, 16, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Flowers
  static drawFlowers(ctx, flowerType, baseType) {
    ctx.save();
    const flowerPositions = [
      { x: -22, y: 12, s: 0.9 },
      { x: 22, y: 12, s: 0.9 },
      { x: 0, y: 22, s: 1.05 },
      { x: -14, y: 20, s: 0.85 },
      { x: 14, y: 20, s: 0.85 },
      { x: -28, y: 18, s: 0.75 },
      { x: 28, y: 18, s: 0.75 }
    ];

    flowerPositions.forEach((pos, idx) => {
      let type = flowerType;
      if (flowerType === 'mix') {
        const types = ['marigold', 'lotus-bud', 'orchid', 'jasmine'];
        type = types[idx % types.length];
      }

      switch (type) {
        case 'lotus-bud':
          this.drawLotusBud(ctx, pos.x, pos.y, pos.s);
          break;
        case 'orchid':
          this.drawOrchid(ctx, pos.x, pos.y, pos.s);
          break;
        case 'jasmine':
          this.drawJasmine(ctx, pos.x, pos.y, pos.s);
          break;
        case 'marigold':
        default:
          this.drawMarigold(ctx, pos.x, pos.y, pos.s);
          break;
      }
    });
    ctx.restore();
  }

  static drawMarigold(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const petals = 16;
    for (let r = 12; r >= 4; r -= 3) {
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * (r * 0.65);
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = r > 8 ? '#ffb703' : (r > 5 ? '#fb8500' : '#ffd166');
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#d46b08';
    ctx.fill();
    ctx.restore();
  }

  static drawLotusBud(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.bezierCurveTo(8, -8, 8, 6, 0, 10);
    ctx.bezierCurveTo(-8, 6, -8, -8, 0, -14);
    const grad = ctx.createLinearGradient(0, -14, 0, 10);
    grad.addColorStop(0, '#f72585');
    grad.addColorStop(0.5, '#ff70a6');
    grad.addColorStop(1, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  static drawOrchid(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const petals = [
      { r: 0, w: 10, h: 6 },
      { r: 1.2, w: 9, h: 5 },
      { r: 2.2, w: 9, h: 5 },
      { r: 3.5, w: 10, h: 6 },
      { r: 4.8, w: 8, h: 5 }
    ];

    petals.forEach(p => {
      ctx.save();
      ctx.rotate(p.r);
      ctx.beginPath();
      ctx.ellipse(0, -6, p.w * 0.6, p.h * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#9b5de5';
      ctx.fill();
      ctx.strokeStyle = '#f15bb5';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fee440';
    ctx.fill();
    ctx.restore();
  }

  static drawJasmine(ctx, x, y, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const px = Math.cos(angle) * 7;
      const py = Math.sin(angle) * 4;
      ctx.beginPath();
      ctx.ellipse(px, py, 4.5, 3.2, angle, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#80ed99';
    ctx.fill();
    ctx.restore();
  }

  // Traditional Coins (เหรียญบาท / เหรียญทอง)
  static drawCoin(ctx, type) {
    ctx.save();
    ctx.translate(16, 16);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 5.5, -0.2, 0, Math.PI * 2);
    const coinGrad = ctx.createLinearGradient(-5, -5, 5, 5);
    if (type === 'silver') {
      coinGrad.addColorStop(0, '#f8f9fa');
      coinGrad.addColorStop(0.5, '#ced4da');
      coinGrad.addColorStop(1, '#6c757d');
    } else {
      coinGrad.addColorStop(0, '#ffe49e');
      coinGrad.addColorStop(0.5, '#ffd166');
      coinGrad.addColorStop(1, '#b38200');
    }
    ctx.fillStyle = coinGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  // Mini Polaroid Picture on Krathong (No emojis, clean label)
  static drawNameTagOrPhoto(ctx, names, photoImage, photoImage2 = null) {
    ctx.save();

    if (photoImage && photoImage2) {
      this.drawSingleMiniPolaroid(ctx, -26, -16, -0.1, photoImage, 'คนที่ 1');
      this.drawSingleMiniPolaroid(ctx, 4, -14, 0.1, photoImage2, 'คนที่ 2');
    } else if (photoImage) {
      this.drawSingleMiniPolaroid(ctx, -14, -16, -0.05, photoImage, names);
    } else if (names) {
      ctx.translate(0, 28);
      ctx.beginPath();
      const txtWidth = Math.min(90, Math.max(50, names.length * 7));
      ctx.roundRect(-txtWidth / 2, -7, txtWidth, 14, 6);
      ctx.fillStyle = 'rgba(20, 20, 35, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px "Mali", "Prompt", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayTxt = names.length > 14 ? names.substring(0, 13) + '…' : names;
      ctx.fillText(displayTxt, 0, 0);
    }
    ctx.restore();
  }

  static drawSingleMiniPolaroid(ctx, x, y, rot, img, label) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    const pw = 34;
    const ph = 42;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.fillRect(0, 0, pw, ph);
    ctx.shadowBlur = 0;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(3, 3, 28, 28);
      ctx.clip();
      const minSide = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - minSide) / 2;
      const sy = (img.naturalHeight - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 3, 3, 28, 28);
      ctx.restore();
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(3, 3, 28, 28);
    }

    if (label) {
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 6px "Prompt", sans-serif';
      ctx.textAlign = 'center';
      const short = label.length > 8 ? label.substring(0, 7) + '..' : label;
      ctx.fillText(short, pw / 2, 37);
    }

    // Brass pin clip on top
    ctx.beginPath();
    ctx.arc(pw / 2, 2, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
  }

  // Incense Sticks (ธูป 3 ดอก)
  static drawIncense(ctx, isLit, time) {
    ctx.save();
    const sticks = [
      { x: -6, angle: -0.08, h: 46 },
      { x: -3, angle: 0.02, h: 48 },
      { x: 0, angle: 0.09, h: 44 }
    ];

    sticks.forEach((s, idx) => {
      ctx.save();
      ctx.translate(s.x, 8);
      ctx.rotate(s.angle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -s.h);
      ctx.strokeStyle = '#b08968';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, -s.h);
      ctx.strokeStyle = '#7f5539';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      if (isLit) {
        ctx.beginPath();
        ctx.arc(0, -s.h, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3838';
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 8;
        ctx.fill();

        this.drawSmoke(ctx, 0, -s.h - 2, time + idx * 700);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  static drawSmoke(ctx, sx, sy, time) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    const smokeLen = 35;
    for (let i = 0; i < smokeLen; i += 5) {
      const wobble = Math.sin((time * 0.003) + (i * 0.2)) * (3 + i * 0.2);
      ctx.lineTo(sx + wobble, sy - i);
    }
    ctx.strokeStyle = 'rgba(240, 240, 255, 0.22)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
  }

  // Candle (เทียนบูชา)
  static drawCandle(ctx, candleColor, isLit, time) {
    ctx.save();
    ctx.translate(8, 10);

    const candleH = 36;
    const candleW = 8;

    ctx.beginPath();
    ctx.roundRect(-candleW / 2, -candleH, candleW, candleH, [2, 2, 0, 0]);
    const cGrad = ctx.createLinearGradient(-candleW / 2, 0, candleW / 2, 0);
    if (candleColor === 'white') {
      cGrad.addColorStop(0, '#f8f9fa');
      cGrad.addColorStop(0.5, '#ffffff');
      cGrad.addColorStop(1, '#dee2e6');
    } else if (candleColor === 'red') {
      cGrad.addColorStop(0, '#e63946');
      cGrad.addColorStop(0.5, '#ff758f');
      cGrad.addColorStop(1, '#9b111e');
    } else {
      cGrad.addColorStop(0, '#ffb703');
      cGrad.addColorStop(0.5, '#ffe49e');
      cGrad.addColorStop(1, '#d48b00');
    }
    ctx.fillStyle = cGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, -candleH);
    ctx.lineTo(0, -candleH - 5);
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    if (isLit) {
      const jitterX = Math.sin(time * 0.015) * 1.2;
      const jitterY = Math.cos(time * 0.02) * 1.5;
      const flameH = 22 + jitterY;
      const flameW = 8;

      ctx.save();
      ctx.translate(0, -candleH - 4);

      ctx.beginPath();
      ctx.arc(0, -flameH * 0.5, 34, 0, Math.PI * 2);
      const aura = ctx.createRadialGradient(0, -flameH * 0.5, 2, 0, -flameH * 0.5, 34);
      aura.addColorStop(0, 'rgba(255, 220, 100, 0.45)');
      aura.addColorStop(0.4, 'rgba(255, 140, 20, 0.2)');
      aura.addColorStop(1, 'rgba(255, 80, 0, 0)');
      ctx.fillStyle = aura;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -flameH);
      ctx.bezierCurveTo(flameW + jitterX, -flameH * 0.6, flameW, 0, 0, 0);
      ctx.bezierCurveTo(-flameW, 0, -flameW + jitterX, -flameH * 0.6, 0, -flameH);

      const flameGrad = ctx.createLinearGradient(0, -flameH, 0, 0);
      flameGrad.addColorStop(0, '#fff3b0');
      flameGrad.addColorStop(0.3, '#ffb703');
      flameGrad.addColorStop(0.7, '#fb5607');
      flameGrad.addColorStop(1, '#3a86ff');
      ctx.fillStyle = flameGrad;
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 14;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -flameH * 0.7);
      ctx.bezierCurveTo(flameW * 0.4, -flameH * 0.4, flameW * 0.4, 0, 0, 0);
      ctx.bezierCurveTo(-flameW * 0.4, 0, -flameW * 0.4, -flameH * 0.4, 0, -flameH * 0.7);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}

window.KrathongArt = KrathongArt;
