// ─── Rebbe Club · Tarjeta para historias de Instagram ────────────────────────
// Al terminar un entreno, un HIIT o una actividad, la clienta crea una imagen con
// sus datos. Tres fondos:
//   · 'clear' (por defecto): sticker TRANSPARENTE, recortado al contenido, para
//     ponerlo encima de su propia foto en Instagram (copiar y pegar, o guardar).
//   · 'photo': su foto de fondo, 1080×1920.
//   · 'brand': fondo con el color de la marca, 1080×1920.

window.RebbeStory = (function () {
  const W = 1080, H = 1920;
  let entry = null;
  let photo = null;       // HTMLImageElement chosen by her
  let mode = 'clear';     // 'clear' | 'brand' | 'photo'
  let blob = null;

  const accent = () => (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#8B2A4C').trim();

  // Kcal aproximadas: MET × peso (kg) × horas. Usa su último peso de Medidas
  // (rebbe_measures) o 65 kg si no tiene ninguno. Es una estimación, como Strava.
  const ACTIVITY_MET = { Pilates: 3, Barre: 3.5, Zumba: 6.5, GAP: 5, 'V Power': 6, Spinning: 8.5, Correr: 9, Caminar: 3.5, Yoga: 2.5, 'Natación': 6 };
  function bodyWeight() {
    const ms = (typeof loadJSON === 'function' ? loadJSON('rebbe_measures', []) : []).filter(m => +m.weight > 30).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return ms.length ? +ms[ms.length - 1].weight : 65;
  }
  function kcal(h) {
    const met = h.express ? 7 : h.type === 'hiit' ? 8 : h.type === 'activity' ? (ACTIVITY_MET[h.name] || 5) : 5;
    return Math.round(met * bodyWeight() * (+h.duration || 0) / 60);
  }
  const dots = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Thin white line icon for each kind of workout (instead of the workout name)
  function iconKind(h) {
    if (h.express) return 'house';
    if (h.type === 'hiit') {
      const k = String(h.day || '');
      if (/tabata/.test(k)) return 'stopwatch';
      if (/bike|bici/.test(k)) return 'bike';
      if (/escalera/.test(k)) return 'stairs';
      return 'bolt';
    }
    if (h.type === 'activity') return h.name === 'Spinning' ? 'bike' : 'pulse';
    return 'dumbbell';
  }
  function drawIcon(ctx, kind, cx, cy, s) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(s / 100, s / 100);
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff';
    const line = (...p) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i], p[i + 1]); ctx.stroke(); };
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); ctx.stroke(); };
    const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); };
    if (kind === 'dumbbell') {
      line(-24, 0, 24, 0);
      rr(-40, -26, 14, 52, 5); rr(26, -26, 14, 52, 5);
      line(-48, -12, -48, 12); line(48, -12, 48, 12);
    } else if (kind === 'bolt') {
      line(8, -44, -20, 6, 4, 6, -8, 44, 22, -6, -2, -6, 8, -44);
    } else if (kind === 'house') {
      line(-38, -2, 0, -36, 38, -2);
      line(-28, -10, -28, 36, 28, 36, 28, -10);
      line(-9, 36, -9, 12, 9, 12, 9, 36);
    } else if (kind === 'stopwatch') {
      circle(0, 6, 34); line(0, 6, 0, -14); line(-8, -40, 8, -40); line(0, -40, 0, -28); line(26, -24, 32, -30);
    } else if (kind === 'bike') {
      circle(-27, 14, 18); circle(27, 14, 18);
      line(-27, 14, -6, -16, 18, -16, 27, 14); line(-6, -16, 2, 14, -27, 14); line(2, 14, 18, -16);
      line(-12, -26, 0, -26); line(18, -16, 14, -28, 22, -28);
    } else if (kind === 'stairs') {
      line(-40, 34, -40, 14, -18, 14, -18, -6, 4, -6, 4, -26, 26, -26, 26, -42, 40, -42);
    } else {
      line(-44, 4, -20, 4, -10, -22, 4, 30, 14, 4, 44, 4);
    }
    ctx.restore();
  }

  // Rows of [label, value, unit] for the minimal sticker
  function stats(h) {
    const time = ['Tiempo', `${h.duration}`, 'min'];
    const cal = ['Calorías', dots(kcal(h)), 'kcal'];
    if (h.express) return { name: 'Entreno exprés', rows: [time, cal, ['Circuitos', '3', '']] };
    if (h.type === 'hiit' || h.type === 'activity') return { name: h.name, rows: [time, cal] };
    const vol = h.volume >= 10000 ? [(h.volume / 1000).toFixed(1).replace('.', ','), 't'] : [dots(h.volume), 'kg'];
    return { name: h.focus || h.name, rows: [time, cal, h.volume > 0 ? ['Volumen', vol[0], vol[1]] : ['Series', `${h.doneSets}`, '']] };
  }

  function spaced(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; }

  // Crop a transparent canvas to the drawn content (+ margin), so it works as a sticker
  function trim(c, pad) {
    const ctx = c.getContext('2d');
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (data[(y * c.width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return c;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(c.width - 1, x1 + pad); y1 = Math.min(c.height - 1, y1 + pad);
    const out = document.createElement('canvas');
    out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
    out.getContext('2d').drawImage(c, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  async function draw() {
    await document.fonts.ready;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const acc = accent();
    const clear = mode === 'clear';
    const usePhoto = mode === 'photo' && photo;

    if (usePhoto) {
      const s = Math.max(W / photo.width, H / photo.height);
      const w = photo.width * s, h = photo.height * s;
      ctx.drawImage(photo, (W - w) / 2, (H - h) / 2, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0.62)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else if (!clear) {
      ctx.fillStyle = acc; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W * 0.8, H * 0.15, 50, W * 0.8, H * 0.15, 1100);
      g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // clear: nothing behind, the PNG stays transparent

    const st = stats(entry);
    const cx = W / 2;
    const shadow = usePhoto || clear;   // white text needs a soft shadow over any photo
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = shadow ? 'rgba(0,0,0,0.35)' : 'transparent';
    ctx.shadowBlur = shadow ? 10 : 0;

    // Minimal row, Strava style: columns side by side, small label over the number
    let y = clear ? 140 : (H - 330) / 2 + (usePhoto ? 300 : 40);
    drawIcon(ctx, iconKind(entry), cx, y - 14, 84);
    y += 112;
    const colW = 300, x0 = cx - (colW * st.rows.length) / 2;
    st.rows.forEach(([label, v, unit], i) => {
      const x = x0 + colW * i + colW / 2;
      ctx.font = `400 24px 'Poppins', sans-serif`; spaced(ctx, 3);
      ctx.globalAlpha = 0.85; ctx.fillText(label.toUpperCase(), x, y); ctx.globalAlpha = 1;
      spaced(ctx, 0);
      ctx.font = `600 64px 'Poppins', sans-serif`;
      const vw = ctx.measureText(v).width;
      ctx.font = `400 30px 'Poppins', sans-serif`;
      const uw = unit ? ctx.measureText(' ' + unit).width : 0;
      const start = x - (vw + uw) / 2;
      ctx.textAlign = 'left';
      ctx.font = `600 64px 'Poppins', sans-serif`; ctx.fillText(v, start, y + 74);
      if (unit) { ctx.font = `400 30px 'Poppins', sans-serif`; ctx.fillText(' ' + unit, start + vw, y + 74); }
      ctx.textAlign = 'center';
    });
    y += 74;

    // Logo + challenge day, small
    y += 78;
    ctx.font = `52px 'DM Serif Display', serif`; spaced(ctx, 0);
    ctx.fillText('rebbe club.', cx, y);
    const day = window.RebbeChallenge && RebbeChallenge.dayNumber ? RebbeChallenge.dayNumber(entry.date) : 0;
    if (day > 0) {
      const len = typeof CHALLENGE !== 'undefined' && CHALLENGE.length;
      y += 46;
      ctx.font = `500 22px 'Poppins', sans-serif`; spaced(ctx, 3);
      ctx.globalAlpha = 0.9; ctx.fillText(`DÍA ${day}${len ? ` DE ${len}` : ''} DEL DESAFÍO`, cx, y); ctx.globalAlpha = 1;
    }

    return clear ? trim(c, 24) : c;
  }


  async function render() {
    const c = await draw();
    blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const url = mode === 'clear' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.7);
    const canCopy = !!(navigator.clipboard && window.ClipboardItem);
    const tab = (k, l) => `<button class="diet-opt ${mode === k ? 'on' : ''}" onclick="RebbeStory.mode('${k}')">${l}</button>`;
    RebbeSheet.open(`
      <div class="modal-title">¡Compártelo! 📸</div>
      <div class="modal-sub">${mode === 'clear'
        ? 'Sticker transparente para ponerlo encima de tu foto en historias. Etiqueta a @rebbe.club 💗'
        : 'Súbelo a tus historias y etiqueta a @rebbe.club 💗'}</div>
      <div class="diet-opts chal-tabs">${tab('clear', 'Transparente')}${tab('photo', 'Con mi foto')}${tab('brand', 'Color')}</div>
      <div class="story-stage ${mode === 'clear' ? 'clear' : ''}"><img class="story-preview" src="${url}" alt="Tu tarjeta para historias"></div>
      <div class="story-actions">
        ${mode === 'clear' ? `
          ${canCopy ? `<button class="start-workout-btn" onclick="RebbeStory.copy()">📋 Copiar sticker</button>` : ''}
          <button class="${canCopy ? 'btn-ghost' : 'start-workout-btn'}" onclick="RebbeStory.share()">💾 Guardar imagen</button>
          <div class="story-howto">En Instagram: abre tu historia con tu foto, toca <b>Aa</b> y <b>pega</b> (o usa el sticker de <b>foto</b> 🖼️ y elige la imagen guardada).</div>`
        : mode === 'photo' && !photo ? `
          <label class="start-workout-btn" style="text-align:center;cursor:pointer;display:block">🖼️ Elegir mi foto<input type="file" accept="image/*" style="display:none" onchange="RebbeStory.pick(this)"></label>`
        : `
          <button class="start-workout-btn" onclick="RebbeStory.share()">Compartir en historias</button>
          ${mode === 'photo' ? `<label class="btn-ghost" style="text-align:center;cursor:pointer">🔄 Cambiar foto<input type="file" accept="image/*" style="display:none" onchange="RebbeStory.pick(this)"></label>` : ''}`}
        <button class="modal-close" onclick="RebbeSheet.close()">Ahora no</button>
      </div>`);
  }

  function open(h) {
    if (!h) return;
    entry = h; photo = null; mode = 'clear';
    render();
  }

  function setMode(m) { mode = m; render(); }

  function pick(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { photo = img; mode = 'photo'; render(); };
    img.onerror = () => showToast('No se pudo abrir esa foto');
    img.src = URL.createObjectURL(f);
  }

  function noPhoto() { photo = null; mode = 'clear'; render(); }

  async function copy() {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📋 Copiado. Pégalo en tu historia de Instagram');
    } catch (e) {
      share();
    }
  }

  async function share() {
    if (!blob) return;
    const file = new File([blob], `rebbe-club-${entry.date}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); } catch (e) { /* she closed the share sheet */ }
      return;
    }
    // Fallback (ordenador / navegadores sin compartir): descargar la imagen
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    showToast('Imagen descargada 📥');
  }

  return { open, pick, noPhoto, share, copy, mode: setMode, _draw: draw, _kcal: kcal };
})();
