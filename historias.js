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

  function stats(h) {
    if (h.express) return { title: 'ENTRENO COMPLETADO', sub: 'Entreno exprés en casa', cols: [[`${h.duration}`, 'MINUTOS'], ['3', 'CIRCUITOS'], [h.completed ? '100%' : '✓', 'HECHO']] };
    if (h.type === 'hiit') return { title: 'HIIT COMPLETADO', sub: h.name, cols: [[`${h.duration}`, 'MINUTOS'], ['HIIT', 'TIPO'], [h.completed ? '100%' : '✓', 'HECHO']] };
    if (h.type === 'activity') return { title: 'ACTIVIDAD COMPLETADA', sub: `${h.name}`, cols: [[`${h.duration}`, 'MINUTOS'], [h.name.length > 9 ? h.name.slice(0, 8) + '…' : h.name, 'ACTIVIDAD']] };
    const vol = h.volume >= 10000 ? `${(h.volume / 1000).toFixed(1).replace('.', ',')}t` : String(Math.round(h.volume)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return { title: 'ENTRENO COMPLETADO', sub: h.focus || h.name, cols: [[`${h.duration}`, 'MINUTOS'], [`${h.doneSets}`, 'SERIES'], [vol, h.volume >= 10000 ? 'VOLUMEN' : 'KG TOTALES']] };
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
    let y = usePhoto ? 330 : clear ? 300 : 470;
    const shadow = usePhoto || clear;   // white text needs a soft shadow over any photo
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = shadow ? 'rgba(0,0,0,0.38)' : 'transparent';
    ctx.shadowBlur = shadow ? 14 : 0;

    // Logo
    ctx.font = `128px 'DM Serif Display', serif`; spaced(ctx, 0);
    ctx.fillText('rebbe club.', cx, y);

    // Title + date
    y += 170;
    ctx.font = `600 42px 'Poppins', sans-serif`; spaced(ctx, 8);
    ctx.fillText(`${st.title} ✓`, cx, y);
    y += 66;
    ctx.font = `500 36px 'Poppins', sans-serif`; spaced(ctx, 3);
    ctx.globalAlpha = 0.9;
    ctx.fillText(new Date(entry.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }), cx, y);
    ctx.globalAlpha = 1;

    // Stat columns with thin dividers
    y += 170;
    const n = st.cols.length, colW = n === 2 ? 400 : 330, x0 = cx - (colW * n) / 2;
    st.cols.forEach(([v, l], i) => {
      const x = x0 + colW * i + colW / 2;
      ctx.font = `700 ${v.length > 5 ? 76 : v.length > 4 ? 88 : 100}px 'Poppins', sans-serif`; spaced(ctx, 0);
      ctx.fillText(v, x, y);
      ctx.font = `600 26px 'Poppins', sans-serif`; spaced(ctx, 5);
      ctx.globalAlpha = 0.85; ctx.fillText(l, x, y + 60); ctx.globalAlpha = 1;
      if (i) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x0 + colW * i - 1, y - 92, 3, 168); ctx.fillStyle = '#fff'; }
    });

    // Workout name
    y += 170;
    ctx.font = `500 42px 'Poppins', sans-serif`; spaced(ctx, 0);
    ctx.fillText(st.sub, cx, y);

    // Challenge day, if she's in the challenge
    const day = window.RebbeChallenge && RebbeChallenge.dayNumber ? RebbeChallenge.dayNumber(entry.date) : 0;
    if (day > 0) {
      y += 120;
      const len = typeof CHALLENGE !== 'undefined' && CHALLENGE.length;
      const label = `DÍA ${day}${len ? ` DE ${len}` : ''} DEL DESAFÍO 🔥`;
      ctx.font = `700 34px 'Poppins', sans-serif`; spaced(ctx, 5);
      const tw = ctx.measureText(label).width + 90;
      ctx.shadowBlur = 0;
      ctx.fillStyle = (usePhoto || clear) ? acc : 'rgba(255,255,255,0.18)';
      roundRect(ctx, cx - tw / 2, y - 58, tw, 88, 44); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(label, cx, y);
    }

    // Handle
    ctx.shadowBlur = shadow ? 14 : 0;
    ctx.font = `600 36px 'Poppins', sans-serif`; spaced(ctx, 2);
    ctx.globalAlpha = 0.9; ctx.fillText('@rebbe.club', cx, clear ? y + 120 : H - 200); ctx.globalAlpha = 1;

    return clear ? trim(c, 30) : c;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
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

  return { open, pick, noPhoto, share, copy, mode: setMode, _draw: draw };
})();
