/**
 * Festival Polaroid Souvenir Generator
 * Generates an HD photographic keepsake card for Loy Krathong festival.
 * Zero emojis and zero love messages.
 */

class PolaroidGenerator {
  /**
   * Render Polaroid Card
   * @param {Object} data - Information and Krathong config
   * @returns {string} - Data URL of PNG image
   */
  static generateCard(data) {
    const {
      name1 = 'คนที่ 1',
      name2 = 'คนที่ 2',
      wish = 'ขอขมาพระแม่คงคา ขอให้มีความสุขความเจริญ สุขภาพแข็งแรง แคล้วคลาดปลอดภัย',
      krathongConfig = {},
      photoImage = null,
      photoImage2 = null
    } = data;

    const width = 800;
    const height = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Polaroid Outer Card Base
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2ded7';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // 2. Main Photo Area (Night Sky & River)
    const photoX = 48;
    const photoY = 48;
    const photoW = width - 96;
    const photoH = 680;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 8);
    ctx.clip();

    // Night Sky
    const skyGrad = ctx.createLinearGradient(0, photoY, 0, photoY + photoH);
    skyGrad.addColorStop(0, '#060a17');
    skyGrad.addColorStop(0.5, '#0f172a');
    skyGrad.addColorStop(0.7, '#1e1b4b');
    skyGrad.addColorStop(1, '#0c1b33');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    // Stars
    for (let i = 0; i < 90; i++) {
      const sx = photoX + Math.random() * photoW;
      const sy = photoY + Math.random() * (photoH * 0.65);
      const sr = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
      ctx.fill();
    }

    // Full Moon
    const moonX = photoX + photoW - 130;
    const moonY = photoY + 120;
    const moonR = 48;

    const moonHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.8);
    moonHalo.addColorStop(0, 'rgba(255, 245, 200, 0.45)');
    moonHalo.addColorStop(0.5, 'rgba(255, 215, 0, 0.15)');
    moonHalo.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = moonHalo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.8, 0, Math.PI * 2);
    ctx.fill();

    const moonBody = ctx.createRadialGradient(moonX - 12, moonY - 12, 5, moonX, moonY, moonR);
    moonBody.addColorStop(0, '#ffffff');
    moonBody.addColorStop(0.4, '#fff8e7');
    moonBody.addColorStop(1, '#fde047');
    ctx.fillStyle = moonBody;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();

    // River Shoreline & Pagoda
    const riverY = photoY + photoH * 0.62;
    ctx.fillStyle = '#060d1d';
    ctx.beginPath();
    ctx.moveTo(photoX, riverY);
    ctx.lineTo(photoX + 80, riverY - 14);
    ctx.lineTo(photoX + 150, riverY - 14);
    ctx.lineTo(photoX + 165, riverY - 70);
    ctx.lineTo(photoX + 170, riverY - 10);
    ctx.lineTo(photoX + photoW, riverY - 18);
    ctx.lineTo(photoX + photoW, riverY);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 18; i++) {
      const lx = photoX + 60 + i * 28;
      const ly = riverY - 10 + (Math.sin(i) * 6);
      ctx.beginPath();
      ctx.arc(lx, ly, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.85)';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 6;
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Water Surface
    const waterGrad = ctx.createLinearGradient(0, riverY, 0, photoY + photoH);
    waterGrad.addColorStop(0, '#0a192f');
    waterGrad.addColorStop(0.5, '#0d233a');
    waterGrad.addColorStop(1, '#051124');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(photoX, riverY, photoW, photoH - (riverY - photoY));

    // Moon Water Reflection
    for (let y = riverY + 10; y < photoY + photoH; y += 12) {
      const prog = (y - riverY) / (photoY + photoH - riverY);
      const rw = 20 + prog * 60;
      ctx.beginPath();
      ctx.ellipse(moonX, y, rw, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 235, 150, ${0.4 - prog * 0.25})`;
      ctx.fill();
    }

    // Sky Lanterns
    const lanterns = [
      { x: photoX + 120, y: photoY + 160, s: 0.6 },
      { x: photoX + 220, y: photoY + 110, s: 0.45 },
      { x: photoX + 340, y: photoY + 80, s: 0.5 },
      { x: photoX + 480, y: photoY + 130, s: 0.7 }
    ];
    lanterns.forEach(lt => {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(lt.x, lt.y, 9 * lt.s, 14 * lt.s, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb703';
      ctx.shadowColor = '#fb8500';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    });

    // Celebratory Festival Fireworks (Spherical bursts)
    const fwColors = ['#ffd166', '#48cae4', '#a7c957', '#ffffff'];
    for (let i = 0; i < 45; i++) {
      const angle = (i / 45) * Math.PI * 2;
      const r = 35 + Math.random() * 8;
      const fx = photoX + 240 + Math.cos(angle) * r;
      const fy = photoY + 200 + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = fwColors[i % fwColors.length];
      ctx.fill();
    }

    // Draw Two Krathongs Floating Together
    const isTwin = krathongConfig.isCoupleMode !== false;
    const pairText = `${name1} และ ${name2}`;

    if (isTwin) {
      const k1X = photoX + photoW * 0.38;
      const k2X = photoX + photoW * 0.62;
      const kY = riverY + 130;

      // Traditional golden garland thread connecting both krathongs
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(k1X, kY + 10);
      ctx.quadraticCurveTo((k1X + k2X) / 2, kY + 25, k2X, kY + 10);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      // Krathong 1
      window.KrathongArt.draw(ctx, k1X, kY, 1.05, {
        ...krathongConfig,
        names: name1,
        isLit: true,
        photoImage: photoImage
      }, 100);

      // Krathong 2
      window.KrathongArt.draw(ctx, k2X, kY + 10, 1.05, {
        ...krathongConfig,
        names: name2,
        isLit: true,
        photoImage: photoImage2
      }, 500);
    } else {
      const kX = photoX + photoW * 0.5;
      const kY = riverY + 130;

      window.KrathongArt.draw(ctx, kX, kY, 1.35, {
        ...krathongConfig,
        names: pairText,
        isLit: true,
        photoImage: photoImage,
        photoImage2: photoImage2
      }, 200);
    }

    ctx.restore(); // end clip photo

    // Photo frame border
    ctx.strokeStyle = '#d6d3cd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(photoX, photoY, photoW, photoH, 8);
    ctx.stroke();

    // 3. Dual Photo Cameos on Top-Left Corner
    if (photoImage && photoImage2) {
      this.drawPhotosCorner(ctx, photoX + 18, photoY + 16, photoImage, photoImage2, name1, name2);
    }

    // 4. Clean Decorative Header Ribbon on Top Center
    ctx.save();
    ctx.translate(width / 2, 38);
    ctx.fillStyle = 'rgba(217, 119, 6, 0.9)';
    ctx.fillRect(-85, -12, 170, 24);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.strokeRect(-85, -12, 170, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOY KRATHONG FESTIVAL', 0, 4);
    ctx.restore();

    // 5. Typography (Bottom Area)
    const textStartY = photoY + photoH + 40;

    // Names Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${name1} และ ${name2}`, width / 2, textStartY);

    // Festival Subtitle
    ctx.font = '600 16px "Prompt", sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText('งานประเพณีลอยกระทง วันเพ็ญเดือนสิบสอง', width / 2, textStartY + 32);

    ctx.font = '400 14px "Prompt", sans-serif';
    ctx.fillStyle = '#64748b';
    const now = new Date();
    const thaiYear = now.getFullYear() + 543;
    const dateStr = `วันขึ้น ๑๕ ค่ำ เดือน ๑๒ ประจำปี พ.ศ. ${thaiYear}`;
    ctx.fillText(dateStr, width / 2, textStartY + 56);

    // Divider Line
    ctx.beginPath();
    ctx.moveTo(width / 2 - 80, textStartY + 76);
    ctx.lineTo(width / 2 + 80, textStartY + 76);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wish Text
    ctx.font = '400 17px "Prompt", sans-serif';
    ctx.fillStyle = '#334155';
    const maxWishWidth = photoW - 60;
    const wishLines = this.wrapText(ctx, `“${wish}”`, maxWishWidth);
    wishLines.forEach((line, idx) => {
      ctx.fillText(line, width / 2, textStartY + 110 + (idx * 28));
    });

    // Traditional Wax Stamp in bottom-right corner
    ctx.save();
    const stampX = width - 92;
    const stampY = height - 85;
    ctx.beginPath();
    ctx.arc(stampX, stampY, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('วันเพ็ญ', stampX, stampY - 3);
    ctx.fillText('เดือน ๑๒', stampX, stampY + 11);
    ctx.restore();

    return canvas.toDataURL('image/png');
  }

  static drawPhotosCorner(ctx, x, y, img1, img2, n1, n2) {
    ctx.save();
    ctx.translate(x, y);

    this.drawCameo(ctx, 0, 0, -0.06, img1, n1);
    this.drawCameo(ctx, 52, 4, 0.06, img2, n2);

    ctx.restore();
  }

  static drawCameo(ctx, cx, cy, rot, img, label) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    const w = 50;
    const h = 64;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.fillRect(0, 0, w, h);
    ctx.shadowBlur = 0;

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(4, 4, w - 8, w - 8);
      ctx.clip();
      const minSide = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - minSide) / 2;
      const sy = (img.naturalHeight - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 4, 4, w - 8, w - 8);
      ctx.restore();
    }

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 8px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    const shortLabel = label.length > 7 ? label.substring(0, 6) + '..' : label;
    ctx.fillText(shortLabel, w / 2, h - 6);

    ctx.restore();
  }

  static wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    if (words.length <= 2 && text.length > 25) {
      let temp = '';
      for (let i = 0; i < text.length; i++) {
        temp += text[i];
        if (ctx.measureText(temp).width > maxWidth) {
          lines.push(temp.slice(0, -1));
          temp = text[i];
        }
      }
      if (temp) lines.push(temp);
      return lines;
    }

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(currentLine);
        currentLine = words[n];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }
}

window.PolaroidGenerator = PolaroidGenerator;
