// ─── Rebbe Club · cuentas y sincronización con Supabase ──────────────────────
// La app sigue guardando todo en el móvil (localStorage + IndexedDB) y este
// módulo copia esos datos a la cuenta de cada clienta, para que no se pierdan
// y para que la coach los vea en su panel. Sin config.js rellenado, no hace nada.

(function () {
  const cfg = window.REBBE_CONFIG || {};
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);

  // Keys that belong to the client's data (everything else is a device preference)
  const SYNC_RE = /^(bloco_|rebbe_)/;
  const NO_SYNC = new Set(['bloco_rest_timer_end', 'rebbe_splash_seen', 'rebbe_photo_count', 'rebbe_uid', 'rebbe_personal_cache']);
  const APP_URL = location.origin + location.pathname;

  let sb = null, user = null, profile = null, bootFn = null, booted = false, recovering = false;
  let dirty = new Set(), flushTimer = null, pulling = false;

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    remove(k) { try { localStorage.removeItem(k); } catch {} },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch {} return out; },
  };
  const syncable = k => SYNC_RE.test(k) && !NO_SYNC.has(k);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function clearLocalData() { ls.keys().filter(syncable).forEach(k => ls.remove(k)); ls.remove('rebbe_personal_cache'); }

  // ─── sync ──────────────────────────────────────────────────────────────────

  function touch(key) {
    if (!enabled || !user || pulling || !syncable(key)) return;
    dirty.add(key);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 1200);
  }

  async function flush() {
    if (!user || !dirty.size) return;
    const keys = [...dirty];
    dirty.clear();
    const rows = [], removed = [];
    keys.forEach(k => {
      const raw = ls.get(k);
      if (raw === null) { removed.push(k); return; }
      let value;
      try { value = JSON.parse(raw); } catch { value = raw; }
      rows.push({ user_id: user.id, key: k, value, updated_at: new Date().toISOString() });
    });
    try {
      if (rows.length) { const { error } = await sb.from('user_data').upsert(rows); if (error) throw error; }
      if (removed.length) { const { error } = await sb.from('user_data').delete().eq('user_id', user.id).in('key', removed); if (error) throw error; }
    } catch (e) {
      console.warn('No se pudo sincronizar, se reintentará', e);
      keys.forEach(k => dirty.add(k));
      clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 15000);
    }
  }

  async function pull() {
    const { data, error } = await sb.from('user_data').select('key,value').eq('user_id', user.id);
    if (error) throw error;
    const onServer = new Set();
    pulling = true;
    (data || []).forEach(r => {
      onServer.add(r.key);
      ls.set(r.key, typeof r.value === 'string' ? r.value : JSON.stringify(r.value));
    });
    pulling = false;
    // Data saved on this phone before having an account (or offline) goes up to her account
    ls.keys().filter(k => syncable(k) && !onServer.has(k)).forEach(k => dirty.add(k));
    if (dirty.size) flush();
  }

  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);

  // ─── announcements & profile ───────────────────────────────────────────────

  async function loadAnnouncements() {
    const { data, error } = await sb.from('announcements').select('tag,title,text').order('created_at', { ascending: false }).limit(20);
    if (error || !data || !data.length || typeof ANNOUNCEMENTS === 'undefined') return;
    ANNOUNCEMENTS.length = 0;
    data.forEach(a => ANNOUNCEMENTS.push({ tag: esc(a.tag), title: esc(a.title), text: esc(a.text).replace(/\n/g, '<br>') }));
    if (typeof currentSection !== 'undefined') {
      if (currentSection === 'home') renderHome();
      if (currentSection === 'club') renderClub();
    }
  }

  function setPlan(level) {
    if (!user) return;
    sb.from('profiles').update({ plan: level }).eq('id', user.id).then(() => {});
  }

  // ─── progress photos (IndexedDB on the phone + private cloud storage) ──────

  async function uploadPhoto(entry) {
    if (!user) return;
    try {
      const blob = await (await fetch(entry.data)).blob();
      const path = `${user.id}/${entry.id}.jpg`;
      const up = await sb.storage.from('progress-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (up.error) throw up.error;
      const ins = await sb.from('photos').upsert({ id: entry.id, user_id: user.id, date: entry.date, pose: entry.pose, path });
      if (ins.error) throw ins.error;
    } catch (e) { console.warn('No se pudo subir la foto', e); }
  }

  async function deletePhoto(id) {
    if (!user) return;
    try {
      await sb.storage.from('progress-photos').remove([`${user.id}/${id}.jpg`]);
      await sb.from('photos').delete().eq('id', id).eq('user_id', user.id);
    } catch (e) { console.warn('No se pudo borrar la foto de la nube', e); }
  }

  function blobToDataUrl(blob) {
    return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
  }

  // Bring down photos taken on another phone
  async function pullPhotos() {
    if (typeof photoAll !== 'function') return;
    try {
      const { data } = await sb.from('photos').select('*').eq('user_id', user.id);
      if (!data || !data.length) return;
      const local = new Set((await photoAll()).map(p => p.id));
      for (const p of data.filter(p => !local.has(p.id))) {
        const dl = await sb.storage.from('progress-photos').download(p.path);
        if (dl.error) continue;
        const dataUrl = await blobToDataUrl(dl.data);
        await photoWrite(store => store.put({ id: p.id, date: p.date, pose: p.pose, data: dataUrl }));
      }
      storage.set('rebbe_photo_count', String((await photoAll()).length));
    } catch (e) { console.warn('No se pudieron bajar las fotos', e); }
  }

  // ─── login screens ─────────────────────────────────────────────────────────

  function overlay() {
    let el = document.getElementById('authOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'authOverlay';
      document.body.appendChild(el);
    }
    return el;
  }

  function hideOverlay() { const el = document.getElementById('authOverlay'); if (el) el.remove(); }

  function screen(inner) {
    overlay().innerHTML = `<div class="auth-box"><img class="logo-img auth-logo" src="logo.png" alt="rebbe club">${inner}</div>`;
  }

  function msg(text, ok) {
    const m = document.getElementById('authMsg');
    if (m) { m.textContent = text; m.className = 'auth-msg' + (ok ? ' ok' : ''); }
  }

  function busy(on) {
    document.querySelectorAll('#authOverlay button').forEach(b => { b.disabled = on; });
  }

  const views = {
    loading() { screen('<div class="auth-sub">Cargando…</div>'); },
    login() {
      screen(`
        <h1 class="ob-title">Entra en tu <span>club</span></h1>
        <form onsubmit="RebbeCloud.login(event)">
          <input class="text-input" id="authEmail" type="email" autocomplete="email" placeholder="Tu email" required>
          <input class="text-input" id="authPass" type="password" autocomplete="current-password" placeholder="Contraseña" required>
          <div class="auth-msg" id="authMsg"></div>
          <button class="start-workout-btn" type="submit">Entrar</button>
        </form>
        <button class="auth-link" onclick="RebbeCloud.show('forgot')">¿Olvidaste tu contraseña?</button>
        <div class="auth-switch">¿Primera vez? <button class="auth-link" onclick="RebbeCloud.show('signup')">Crea tu cuenta</button></div>`);
    },
    signup() {
      screen(`
        <h1 class="ob-title">Crea tu <span>cuenta</span></h1>
        <div class="auth-sub">Después, Rebe activará tu acceso.</div>
        <form onsubmit="RebbeCloud.signup(event)">
          <input class="text-input" id="authName" type="text" autocomplete="given-name" placeholder="Tu nombre" required maxlength="40">
          <input class="text-input" id="authEmail" type="email" autocomplete="email" placeholder="Tu email" required>
          <input class="text-input" id="authPass" type="password" autocomplete="new-password" placeholder="Contraseña (mínimo 6)" required minlength="6">
          <div class="auth-msg" id="authMsg"></div>
          <button class="start-workout-btn" type="submit">Crear cuenta</button>
        </form>
        <div class="auth-switch">¿Ya tienes cuenta? <button class="auth-link" onclick="RebbeCloud.show('login')">Entra</button></div>`);
    },
    forgot() {
      screen(`
        <h1 class="ob-title">Recupera tu <span>contraseña</span></h1>
        <div class="auth-sub">Te enviaremos un email con un enlace para crear una nueva.</div>
        <form onsubmit="RebbeCloud.forgot(event)">
          <input class="text-input" id="authEmail" type="email" autocomplete="email" placeholder="Tu email" required>
          <div class="auth-msg" id="authMsg"></div>
          <button class="start-workout-btn" type="submit">Enviar enlace</button>
        </form>
        <button class="auth-link" onclick="RebbeCloud.show('login')">‹ Volver</button>`);
    },
    reset() {
      screen(`
        <h1 class="ob-title">Nueva <span>contraseña</span></h1>
        <form onsubmit="RebbeCloud.reset(event)">
          <input class="text-input" id="authPass" type="password" autocomplete="new-password" placeholder="Nueva contraseña (mínimo 6)" required minlength="6">
          <div class="auth-msg" id="authMsg"></div>
          <button class="start-workout-btn" type="submit">Guardar contraseña</button>
        </form>`);
    },
    checkEmail() {
      screen(`
        <h1 class="ob-title">Revisa tu <span>email</span> 💌</h1>
        <div class="auth-sub">Te hemos enviado un enlace para confirmar tu cuenta. Ábrelo desde este mismo móvil.</div>
        <button class="auth-link" onclick="RebbeCloud.show('login')">‹ Volver a entrar</button>`);
    },
    pending() {
      screen(`
        <h1 class="ob-title">¡Ya casi, <span>${esc(profile && profile.name || '')}</span>! 💖</h1>
        <div class="auth-sub">Tu cuenta está creada. En cuanto Rebe active tu acceso, podrás entrar a la app.</div>
        <button class="start-workout-btn" onclick="RebbeCloud.recheck()">Comprobar de nuevo</button>
        <button class="auth-link" onclick="RebbeCloud.logout()">Cerrar sesión</button>`);
    },
    inactive() {
      screen(`
        <h1 class="ob-title">Acceso <span>pausado</span></h1>
        <div class="auth-sub">Tu acceso a rebbe club está desactivado. Escribe a Rebe para reactivarlo. Tus datos siguen guardados.</div>
        <button class="start-workout-btn" onclick="RebbeCloud.recheck()">Comprobar de nuevo</button>
        <button class="auth-link" onclick="RebbeCloud.logout()">Cerrar sesión</button>`);
    },
    error(text) {
      screen(`
        <h1 class="ob-title">Algo ha <span>fallado</span></h1>
        <div class="auth-sub">${esc(text || 'Revisa tu conexión a internet.')}</div>
        <button class="start-workout-btn" onclick="location.reload()">Reintentar</button>
        <button class="auth-link" onclick="RebbeCloud.logout()">Cerrar sesión</button>`);
    },
  };

  function show(name, arg) { views[name](arg); }

  function friendly(error) {
    const m = (error && error.message || '').toLowerCase();
    if (m.includes('invalid login')) return 'Email o contraseña incorrectos.';
    if (m.includes('email not confirmed')) return 'Confirma tu email: revisa tu bandeja de entrada (y spam).';
    if (m.includes('already registered')) return 'Ese email ya tiene cuenta. Prueba a entrar.';
    if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.';
    if (m.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos.';
    return 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.';
  }

  async function login(e) {
    e.preventDefault();
    busy(true);
    const { data, error } = await sb.auth.signInWithPassword({
      email: document.getElementById('authEmail').value.trim(),
      password: document.getElementById('authPass').value,
    });
    busy(false);
    if (error) return msg(friendly(error));
    afterLogin(data.user);
  }

  async function signup(e) {
    e.preventDefault();
    busy(true);
    const name = document.getElementById('authName').value.trim();
    const { data, error } = await sb.auth.signUp({
      email: document.getElementById('authEmail').value.trim(),
      password: document.getElementById('authPass').value,
      options: { data: { name }, emailRedirectTo: APP_URL },
    });
    busy(false);
    if (error) return msg(friendly(error));
    if (data.session) afterLogin(data.user);
    else show('checkEmail');
  }

  async function forgot(e) {
    e.preventDefault();
    busy(true);
    const { error } = await sb.auth.resetPasswordForEmail(document.getElementById('authEmail').value.trim(), { redirectTo: APP_URL });
    busy(false);
    if (error) return msg(friendly(error));
    msg('Listo: revisa tu email (y la carpeta de spam).', true);
  }

  async function reset(e) {
    e.preventDefault();
    busy(true);
    const { data, error } = await sb.auth.updateUser({ password: document.getElementById('authPass').value });
    busy(false);
    if (error) return msg(friendly(error));
    recovering = false;
    history.replaceState(null, '', APP_URL);
    afterLogin(data.user);
  }

  async function recheck() {
    const { data } = await sb.auth.getUser();
    if (data && data.user) afterLogin(data.user);
    else show('login');
  }

  async function logout() {
    try { await flush(); } catch {}
    try { await sb.auth.signOut(); } catch {}
    clearLocalData();
    ls.remove('rebbe_uid');
    try { indexedDB.deleteDatabase('rebbe-club'); } catch {}
    location.replace(APP_URL);
  }

  // Her own training plan, if the coach made one for her (before boot, so "Mi plan" exists)
  async function loadPersonalPlan(uid) {
    try {
      const { data, error } = await sb.from('personal_plans').select('data').eq('user_id', uid).maybeSingle();
      if (error) return;
      if (data) ls.set('rebbe_personal_cache', JSON.stringify(data.data)); else ls.remove('rebbe_personal_cache');
      if (window.registerPersonalPlan) registerPersonalPlan(data ? data.data : null);
    } catch (e) { console.warn('No se pudo cargar el plan personal', e); }
  }

  async function afterLogin(u) {
    user = u;
    show('loading');
    const prevUid = ls.get('rebbe_uid');
    if (prevUid && prevUid !== u.id) {
      clearLocalData();
      try { indexedDB.deleteDatabase('rebbe-club'); } catch {}
    }
    ls.set('rebbe_uid', u.id);

    const { data: p, error } = await sb.from('profiles').select('*').eq('id', u.id).single();
    if (error) return show('error', 'No encontramos tu perfil. ' + (error.message || ''));
    profile = p;
    const isCoach = p.role === 'coach';
    if (!isCoach && p.status === 'pending') return show('pending');
    if (!isCoach && p.status === 'inactive') return show('inactive');

    try { await pull(); } catch (e) { console.warn('No se pudieron traer los datos', e); }
    if (p.name && !ls.get('rebbe_name')) ls.set('rebbe_name', p.name);
    sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', u.id).then(() => {});

    await loadPersonalPlan(u.id);

    hideOverlay();
    renderAccountSection();
    if (!booted && bootFn) { booted = true; bootFn(); }
    loadAnnouncements();
    if (window.RebbeCourses) RebbeCourses.load();
    if (window.RebbeDiet) RebbeDiet.load();
    pullPhotos();
  }

  // Account block inside the ⚙️ / 🎨 settings panel
  function renderAccountSection() {
    const el = document.getElementById('accountSection');
    if (!el || !user) return;
    el.style.display = '';
    el.innerHTML = `
      <div class="alert-pref-label">Tu cuenta</div>
      <div class="alert-pref-sub">${esc(user.email)}</div>
      ${profile && profile.role === 'coach' ? '<a class="theme-panel-close" style="display:block;text-align:center;text-decoration:none;margin-bottom:8px" href="panel.html">Abrir mi panel de coach</a>' : ''}
      <button class="theme-panel-close" onclick="RebbeCloud.logout()">Cerrar sesión</button>`;
  }

  async function start(boot) {
    bootFn = boot;
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    recovering = /type=recovery/.test(location.hash);
    show('loading');
    sb.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') { recovering = true; show('reset'); }
    });
    const { data } = await sb.auth.getSession();
    if (recovering) return show('reset');
    if (!data.session) return show('login');
    afterLogin(data.session.user);
  }

  window.RebbeCloud = {
    enabled, start, touch, flush, setPlan, uploadPhoto, deletePhoto,
    client: () => (user ? sb : null),
    show, login, signup, forgot, reset, recheck, logout,
  };
})();
