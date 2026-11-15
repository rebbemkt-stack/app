// ─── Rebbe Club · Tarjeta para historias de Instagram ────────────────────────
// Al terminar un entreno, un HIIT o una actividad, la clienta puede crear una
// imagen 1080×1920 con sus datos (con su foto de fondo o con el fondo de la
// marca) y compartirla directamente en historias.

window.RebbeStory = (function () {
  const W = 1080, H = 1920;
  let entry = null;
  let photo = null;       // HTMLImageElement chosen by her
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

  async function draw() {
    await document.fonts.ready;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const acc = accent();

    // Background: her photo (cover) or the brand colour
    if (photo) {
      const s = Math.max(W / photo.width, H / photo.height);
      const w = photo.width * s, h = photo.height * s;
      ctx.drawImage(photo, (W - w) / 2, (H - h) / 2, w, h);
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0.62)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = acc; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W * 0.8, H * 0.15, 50, W * 0.8, H * 0.15, 1100);
      g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    const st = stats(entry);
    const cx = W / 2;
    let y = photo ? 330 : 470;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = photo ? 'rgba(0,0,0,0.35)' : 'transparent';
    ctx.shadowBlur = photo ? 14 : 0;

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
      if (i) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x0 + colW * i - 1, y - 92, 3, 168); ctx.fillStyle = '#fff'; }
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
      ctx.fillStyle = photo ? acc : 'rgba(255,255,255,0.18)';
      roundRect(ctx, cx - tw / 2, y - 58, tw, 88, 44); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(label, cx, y);
    }

    // Handle at the bottom
    ctx.shadowBlur = photo ? 14 : 0;
    ctx.font = `600 36px 'Poppins', sans-serif`; spaced(ctx, 2);
    ctx.globalAlpha = 0.9; ctx.fillText('@rebbe.club', cx, H - 200); ctx.globalAlpha = 1;

    return c;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  async function render() {
    const c = await draw();
    blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const url = c.toDataURL('image/jpeg', 0.7);
    RebbeSheet.open(`
      <div class="modal-title">¡Compártelo! 📸</div>
      <div class="modal-sub">Súbelo a tus historias y etiqueta a @rebbe.club 💗</div>
      <img class="story-preview" src="${url}" alt="Tu tarjeta para historias">
      <div class="story-actions">
        <button class="start-workout-btn" onclick="RebbeStory.share()">Compartir en historias</button>
        <label class="btn-ghost" style="text-align:center;cursor:pointer">${photo ? '🔄 Cambiar foto' : '🖼️ Poner mi foto de fondo'}<input type="file" accept="image/*" style="display:none" onchange="RebbeStory.pick(this)"></label>
        ${photo ? `<button class="btn-ghost" onclick="RebbeStory.noPhoto()">Quitar la foto</button>` : ''}
        <button class="modal-close" onclick="RebbeSheet.close()">Ahora no</button>
      </div>`);
  }

  function open(h) {
    if (!h) return;
    entry = h; photo = null;
    render();
  }

  function pick(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { photo = img; render(); };
    img.onerror = () => showToast('No se pudo abrir esa foto');
    img.src = URL.createObjectURL(f);
  }

  function noPhoto() { photo = null; render(); }

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

  return { open, pick, noPhoto, share, _draw: draw };
})();
