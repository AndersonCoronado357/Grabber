/* Capa de datos real: mismo Component y mismos bindings que el mock,
 * pero respaldado por la API de Grabber (misma-origen, /api/v1). */
const API = '/api/v1';

/* Marca oficial (public/brand/grabber-mark.svg) como elemento React,
 * para el wordmark de barras y footer — hereda color vía currentColor. */
const BRAND_PATH = 'M 604.8 247.08 C 440.12 258.24, 301.92 387.13, 278.04 551.85 C 267.4 625.21, 280.34 698.08, 316.32 767.39 C 325.73 785.52, 330.36 792.64, 334.32 795.06 L 337.5 797 392.39 796.75 L 447.28 796.5 449.24 793.88 L 451.19 791.27 449.67 788.38 C 448.84 786.8, 445.83 783.25, 442.98 780.5 C 386.04 725.48, 359.78 638.48, 375.66 557.5 C 401.45 426.01, 518.88 336.3, 650 347.92 C 727.41 354.78, 792.48 394.48, 838.15 462.73 C 843.61 470.89, 848.34 476.85, 850.3 478.04 L 853.5 479.99 903.22 480 L 952.93 480 954.03 477.95 C 955.46 475.27, 954.47 472.32, 946.02 453.95 C 884.76 320.8, 747.26 237.43, 604.8 247.08 M 584.5 460.87 C 580.32 463.47, 577.36 466.89, 575.55 471.23 L 574 474.94 574 589.97 L 574 705 533.25 705.01 L 492.5 705.02 487.43 707.38 C 475.96 712.72, 471.08 725.53, 476.52 736.03 C 478.86 740.55, 616.62 877.33, 620.75 879.22 C 625.16 881.25, 627.11 881.37, 632.5 879.91 L 636.5 878.83 705.78 809.66 C 778.63 736.93, 780 735.4, 780 726.77 C 780 718.61, 774.97 711.39, 766.5 707.38 L 761.5 705.02 720.75 705.01 L 680 705 680 589.32 L 680 473.63 677.86 469.2 C 676.43 466.26, 674.19 463.81, 671.16 461.89 L 666.61 459 627.05 459 L 587.5 459.01 584.5 460.87 M 736.46 561.25 C 736.19 561.94, 736.1 581.85, 736.24 605.5 L 736.5 648.5 805.29 649 L 874.07 649.5 875.02 651 C 876.55 653.42, 876.2 655.88, 872.46 669.04 C 860.73 710.3, 841.01 745.84, 810.75 780.27 C 802.4 789.77, 801.76 791.48, 805.31 794.83 L 807.63 797 862.06 797 L 916.5 796.99 919.65 795.07 C 926.84 790.69, 947.34 750.02, 959 717 C 974.57 672.9, 982.52 615.44, 978.58 575.53 L 977.79 567.55 974.01 563.78 L 970.24 560 853.59 560 C 761.19 560, 736.84 560.26, 736.46 561.25 M 365.5 835.14 C 362.64 836.75, 360.05 840.19, 360.02 842.41 C 359.97 846.75, 409.11 939.77, 415.95 948.28 C 428.21 963.54, 445.52 975.33, 463.5 980.67 L 469.5 982.45 623.5 982.75 L 777.5 983.06 785.5 981.45 C 807.37 977.06, 830.11 961.44, 842.22 942.5 C 846.72 935.45, 860.82 908.88, 882.46 866.66 C 894.92 842.34, 895.3 840.98, 890.91 836.5 L 888.95 834.5 852.96 834.21 C 829.56 834.03, 815.59 834.3, 812.99 835 C 805.5 837.02, 802.07 841.68, 790 866.18 C 775.89 894.87, 770.84 900.46, 755.54 904.45 L 749.58 906 627.04 905.98 C 498.23 905.95, 499.99 906.01, 490.17 901.22 C 480.4 896.44, 476.41 891.37, 465.94 870.38 C 452.92 844.27, 450.81 840.81, 445.8 837.42 L 441.5 834.5 404.5 834.26 C 378.52 834.08, 366.9 834.35, 365.5 835.14';

// viewBox recortado al glifo (el original 0 0 1254 1254 tiene mucho margen
// interno que hacía ver la marca pequeña). Ahora llena el cuadro.
function brandMark(size){
  return React.createElement('svg', { width:size, height:size, viewBox:'250 232 756 756', fill:'currentColor' },
    React.createElement('path', { fillRule:'evenodd', d:BRAND_PATH }));
}

// glifos de redes (line-style, heredan currentColor)
function socialIcon(name){
  const h=(d,extra)=>React.createElement('svg',Object.assign({width:18,height:18,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.6,strokeLinecap:'round',strokeLinejoin:'round'},extra||{}),
    (Array.isArray(d)?d:[d]).map((p,i)=>React.createElement('path',{key:i,d:p})));
  if(name==='x') return React.createElement('svg',{width:18,height:18,viewBox:'0 0 24 24',fill:'currentColor'},React.createElement('path',{d:'M18.9 2H22l-7 8 8.2 12h-6.5l-5-6.8L5.4 22H2.3l7.5-8.6L2 2h6.6l4.5 6.2L18.9 2Zm-2.3 18h1.7L7.5 3.8H5.6L16.6 20Z'}));
  if(name==='instagram') return h(['M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5','M16 11.4a4 4 0 1 1-8 .6 4 4 0 0 1 8-.6','M17.5 6.5h.01']);
  if(name==='youtube') return h(['M22 8.2a2.6 2.6 0 0 0-1.8-1.8C18.6 6 12 6 12 6s-6.6 0-8.2.4A2.6 2.6 0 0 0 2 8.2 27 27 0 0 0 1.7 12 27 27 0 0 0 2 15.8a2.6 2.6 0 0 0 1.8 1.8C5.4 18 12 18 12 18s6.6 0 8.2-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22.3 12 27 27 0 0 0 22 8.2Z','M10 9.2l5 2.8-5 2.8Z']);
  if(name==='whatsapp') return h(['M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3Z','M8.5 8.2c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6a6 6 0 0 0 2.6 2.3c.3.1.4.1.6-.1l.6-.7c.2-.2.3-.2.6-.1l1.6.8c.2.1.4.2.4.4v.6c0 .5-.5 1-1 1.2-.5.2-1.5.3-3-.3a8 8 0 0 1-4.4-4.4c-.5-1.3-.3-2.3 0-2.8Z']);
  return h('M12 12h.01');
}
// redes por defecto (footer, términos, privacidad) — YouTube se mantiene, GitHub fuera
// LAS MISMAS redes en TODOS lados (footer, términos, privacidad, contacto).
// GitHub fuera; YouTube y WhatsApp presentes en todos.
const SOCIALS = [
  { name:'x', label:'X', handle:'@grabber' },
  { name:'instagram', label:'Instagram', handle:'@grabber.app' },
  { name:'youtube', label:'YouTube', handle:'/grabber' },
  { name:'whatsapp', label:'WhatsApp', handle:'+1 555 019' },
];
const CONTACT_SOCIALS = SOCIALS;

const PAGE_DOCS = {
  terms: {
    kicker: 'Legal',
    title: 'Términos de servicio',
    subtitle: 'Las reglas del juego, en claro. Última actualización: julio de 2026.',
    sections: [
      { h:'El servicio', p:'Grabber es una herramienta local para descargar y archivar video y audio en tu propia biblioteca. El software corre en tu equipo: los archivos, la base de datos y las credenciales no salen de tu máquina.' },
      { h:'Uso responsable', p:'Grabber está pensado para contenido propio o de libre distribución. Varias plataformas prohíben la extracción por terceros en sus términos; eres responsable de respetar los derechos de autor y las condiciones de cada plataforma. Grabber registra la URL de origen de cada descarga.' },
      { h:'Cuentas', p:'Los invitados tienen tres descargas al día. Con una cuenta, las descargas se guardan en tu biblioteca con colecciones, etiquetas y notas. Eres responsable de mantener tu contraseña segura; puedes activar verificación en dos pasos en Ajustes.' },
      { h:'Planes', p:'Los planes Pro y Studio amplían la calidad máxima, el almacenamiento y el modo lote. En esta versión local la facturación es simulada y no se realiza ningún cargo real.' },
      { h:'Garantías', p:'El servicio se ofrece «tal cual». La disponibilidad de una descarga depende de la plataforma de origen: un video privado, eliminado o restringido no se puede descargar.' },
    ],
  },
  privacy: {
    kicker: 'Legal',
    title: 'Privacidad',
    subtitle: 'Tus datos no salen de tu equipo. Aquí el detalle. Julio de 2026.',
    sections: [
      { h:'Todo queda en tu equipo', p:'Grabber corre íntegramente en tu máquina: la base de datos es local (SQL Server), los archivos se guardan en tu disco y no hay telemetría ni analítica de terceros.' },
      { h:'Qué guardamos', p:'Tu correo, nombre de usuario y contraseña (con hash argon2id, nunca en claro), tus preferencias, tu biblioteca y el historial de descargas con su URL de origen. El secreto de la verificación en dos pasos se guarda cifrado.' },
      { h:'Sesiones', p:'Cada inicio de sesión crea una sesión con dispositivo y dirección IP para que puedas revisarlas y revocarlas desde Ajustes → Seguridad. Los tokens expirados se limpian automáticamente.' },
      { h:'Invitados', p:'Para el límite de tres descargas diarias se guarda una huella anónima (hash de IP y navegador) que se elimina a los siete días. No identifica tu persona.' },
      { h:'Tus datos, tuyos', p:'Puedes exportar toda tu biblioteca en CSV o JSON desde Ajustes → Datos, y eliminar tu cuenta definitivamente cuando quieras.' },
    ],
  },
  contact: {
    kicker: 'Contacto',
    title: 'Hablemos.',
    subtitle: 'Dudas, ideas o errores. Te leemos.',
    sections: [],
  },
  status: {
    kicker: 'Estado',
    title: 'Estado del sistema',
    subtitle: 'Comprobación en vivo de los componentes de Grabber.',
    sections: [],
  },
  help: {
    kicker: 'Ayuda',
    title: 'Centro de ayuda',
    subtitle: 'Las respuestas rápidas. Si necesitas más, escríbenos.',
    sections: [
      { h:'¿Necesito una cuenta para descargar?', p:'No para probar. Los invitados tienen tres descargas al día; con una cuenta son ilimitadas y se guardan en tu biblioteca con colecciones, etiquetas y notas.' },
      { h:'¿Qué plataformas admite?', p:'YouTube, Instagram, TikTok, X, Facebook y Reddit. Pega el enlace y Grabber detecta la fuente automáticamente.' },
      { h:'¿Puedo bajar solo el audio?', p:'Sí. Elige MP3 o M4A en el selector de calidad y se descarga únicamente la pista de audio.' },
      { h:'¿Dónde se guardan mis descargas?', p:'En tu biblioteca personal, en tu propio equipo. Puedes exportarlas o eliminarlas cuando quieras desde Ajustes → Datos.' },
      { h:'¿Cómo pauso o cancelo una descarga?', p:'En la Cola, cada descarga tiene controles para pausar, reanudar, reintentar o cancelar. El progreso se ve en tiempo real.' },
      { h:'¿Mis datos están seguros?', p:'Todo corre localmente: la base de datos, los archivos y las credenciales no salen de tu máquina. Las contraseñas se guardan con hash argon2id.' },
    ],
  },
};

class Component extends DCLogic {
  state = {
    theme:'system',
    authed:false,
    route:'home',
    booting:true,
    f:{ email:'', pass:'', name:'' },
    showPass:false, remember:true, terms:false, privacyAcc:false,
    pendingEmail:'', verifyCode:'', resendIn:42, resetToken:'',
    // download
    url:'', batchMode:false, analyzing:false, result:null, dlError:'',
    quality:'1080p', dlOpts:{subs:false,thumb:true,collection:false}, showClip:true,
    // search / overlays
    searchExpanded:false, avatarOpen:false, notifOpen:false,
    q:{ global:'' },
    // queue
    concurrency:'2', doneExpanded:true, openDropdown:null,
    queue:[],
    toasts:[],
    videos:[],
    collections:[],
    trash:[],
    notifItemsSrv:[], unread:0,
    lib:{ tab:'all', view:'grid', search:'', sort:'recent', filters:{platform:null,format:null,quality:null,date:null}, sel:[], openFilter:null },
    colaF:{ estado:null, platform:null, open:false, closing:false },
    detailId:null,
    setTab:'profile',
    profile:{ name:'', username:'', email:'', bio:'', hasAvatar:false },
    profileDirty:false, usernameEdited:false,
    prefs:{ language:'Español', timezone:'GMT−6 · Ciudad de México', quality:'1080p', format:'MP4', filename:'{titulo}-{calidad}', concurrency:'2', autoTrash:'30 días' },
    notif:{
      done:{email:true,push:true,app:true},
      error:{email:true,push:false,app:true},
      features:{email:false,push:false,app:true},
      weekly:{email:true,push:false,app:false},
      billing:{email:true,push:false,app:true},
    },
    twofa:false, twofaSecret:'', twofaCode:'',
    pwCurrent:'', pwNew:'', pwConfirm:'',
    sessions:[],
    invoices:[],
    payEnabled:false,
    sub:null,
    checkingOut:false,
    canInstall:false,
    tagAdding:false,
    tagInput:'',
    stats:{ downloads:'0', storage:'0', storageSub:'', collections:'0', since:'—' },
    usage:{ label:'0 / 200 GB', pct:'0%', downloads:'0', downloadsSub:'', bandwidth:'—', renews:'—' },
    plan:'Free',
    modal:null, deleteConfirm:'',
    home:{ url:'', analyzing:false, result:null, guestLeft:3, faqOpen:[], job:null, jobDone:false },
    page:'terms', pageOrigin:'home',
    statusData:null,
    cEmail:'', cMsg:'',
    crop:{ url:'', w:0, h:0, zoom:1, panX:0, panY:0, guide:false, saving:false },
  };

  // ———————————————————————— API ————————————————————————

  async api(path, opts){
    opts = opts || {};
    const headers = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (this._token) headers['Authorization'] = 'Bearer ' + this._token;
    let res = await fetch(API + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : opts.form,
      credentials: 'include',
    });
    if (res.status === 401 && this._token && !opts._retried) {
      if (await this.tryRefresh()) return this.api(path, { ...opts, _retried:true });
    }
    let body = null;
    try { body = await res.json(); } catch(e) { /* respuestas vacías */ }
    if (!res.ok) {
      const err = (body && body.error) || { code:'INTERNAL', message:'Algo salió mal' };
      const e = new Error(err.message); e.code = err.code; e.field = err.field;
      throw e;
    }
    return body || {};
  }

  async apiUpload(path, formData){
    const headers = {};
    if (this._token) headers['Authorization'] = 'Bearer ' + this._token;
    const res = await fetch(API + path, { method:'POST', headers, body:formData, credentials:'include' });
    const body = await res.json().catch(()=>null);
    if (!res.ok) { const err=(body&&body.error)||{message:'Algo salió mal'}; throw new Error(err.message); }
    return body;
  }

  async tryRefresh(){
    try {
      const res = await fetch(API + '/auth/refresh', { method:'POST', credentials:'include' });
      if (!res.ok) return false;
      const j = await res.json();
      this._token = j.accessToken;
      return true;
    } catch(e){ return false; }
  }

  // ———————————————————————— ciclo de vida ————————————————————————

  componentDidMount(){
    try {
      const saved = localStorage.getItem('grabber-theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') this.state.theme = saved;
    } catch(e){ /* almacenamiento bloqueado */ }
    this._mq = window.matchMedia('(prefers-color-scheme: dark)');
    this.applyTheme();
    this._mqL = ()=>{ if(this.state.theme==='system') this.applyTheme(); };
    this._mq.addEventListener('change', this._mqL);
    this._toastId = 0;
    this._formats = [];
    this._batch = null;
    this._debounce = {};
    this._key = (e)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); this.setState({searchExpanded:true}); const el=document.querySelector('input[placeholder="Buscar"]'); if(el) el.focus(); return; }
      // captura de dígitos en verificación y en el modal 2FA
      const digit = /^[0-9]$/.test(e.key);
      if(this.state.route==='verify'){
        if(digit && this.state.verifyCode.length<6) this.setState(s=>({verifyCode:s.verifyCode+e.key}));
        else if(e.key==='Backspace') this.setState(s=>({verifyCode:s.verifyCode.slice(0,-1)}));
      }
    };
    window.addEventListener('keydown', this._key);
    this._ddClose = (e)=>{ if(this.state.openDropdown && e.target.closest && !e.target.closest('[data-dd]')) this.setState({openDropdown:null}); };
    document.addEventListener('mousedown', this._ddClose);
    // routing por URL: atrás/adelante del navegador y enlaces con hash
    this._onHash = ()=>{ if(this._skipHash){ this._skipHash=false; return; } this.applyHash(); };
    window.addEventListener('hashchange', this._onHash);
    // barra superior que se oculta al hacer scroll hacia abajo (solo móvil),
    // para recuperar espacio; reaparece al subir. Se manipula el DOM directo
    // (no estado) para no re-renderizar en cada evento de scroll.
    this._lastScrollY = 0;
    const root = document.documentElement; // <html>: fuera del árbol que dc reescribe
    this._onScroll = (e)=>{
      if (!window.matchMedia('(max-width:640px)').matches){ root.style.setProperty('--gr-topbar-y','0px'); return; }
      // ignora el scroll del panel de filtros (si no, mueve la barra de arriba)
      if ((this.state.lib && this.state.lib.filtersOpen) || (this.state.colaF && this.state.colaF.open)) return;
      const t = e && e.target;
      if (t && t.closest && t.closest('.gr-lib-sheet-panel')) return;
      let y = 0;
      if (!t || t===document || t===window || t===document.documentElement || t===document.body)
        y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      else y = t.scrollTop || 0;
      if (y > 56 && y > this._lastScrollY + 3) root.style.setProperty('--gr-topbar-y','-110%');
      else if (y < this._lastScrollY - 3 || y <= 4) root.style.setProperty('--gr-topbar-y','0px');
      this._lastScrollY = y;
    };
    // fase de captura: atrapa el scroll de la ventana Y de cualquier panel interno
    window.addEventListener('scroll', this._onScroll, { passive:true, capture:true });
    // registra el service worker de push (idempotente) desde el arranque
    void this._registerSW();
    // PWA: captura el evento de instalación para ofrecer un botón propio.
    // No dispara si ya está instalada o si no cumple los criterios (https/localhost).
    this._onBIP = (e)=>{ e.preventDefault(); this._deferredPrompt = e; this.setState({canInstall:true}); };
    window.addEventListener('beforeinstallprompt', this._onBIP);
    this._onInstalled = ()=>{ this._deferredPrompt=null; this.setState({canInstall:false}); this.toast('Grabber se instaló en tu dispositivo'); };
    window.addEventListener('appinstalled', this._onInstalled);
    void this.boot();
  }
  componentWillUnmount(){
    this._mq&&this._mq.removeEventListener('change',this._mqL);
    window.removeEventListener('keydown',this._key);
    document.removeEventListener('mousedown',this._ddClose);
    if(this._onHash) window.removeEventListener('hashchange', this._onHash);
    if(this._es) this._es.close();
    if(this._resendT) clearInterval(this._resendT);
    if(this._guestPoll) clearInterval(this._guestPoll);
    if(this._ddRAF) cancelAnimationFrame(this._ddRAF);
    if(this._onBIP) window.removeEventListener('beforeinstallprompt', this._onBIP);
    if(this._onInstalled) window.removeEventListener('appinstalled', this._onInstalled);
  }

  /** PWA: dispara el diálogo nativo de instalación (o guía si no hay evento). */
  async installApp(){
    this.setState({avatarOpen:false});
    const p = this._deferredPrompt;
    if(!p){ this.toast('Para instalar, usa el menú del navegador → «Instalar app» / «Añadir a pantalla de inicio»'); return; }
    this._deferredPrompt = null;
    this.setState({canInstall:false});
    try { p.prompt(); await p.userChoice; } catch(e){ /* el usuario cerró el diálogo */ }
  }

  // ———————————————————————— routing por URL (hash) ————————————————————————
  // Cada vista tiene su URL; al recargar se restaura la vista (no vuelve al inicio).
  routeToHash(){
    const s=this.state;
    if(s.route==='page') return '#/'+({terms:'terminos',privacy:'privacidad',status:'estado',contact:'contacto',help:'ayuda'}[s.page]||'terminos');
    if(s.route==='settings') return '#/ajustes/'+(s.setTab||'profile');
    const map={download:'descargar',queue:'cola',library:'biblioteca',home:'inicio',login:'entrar',signup:'registro',verify:'verificar',forgot:'recuperar',reset:'restablecer'};
    return '#/'+(map[s.route]||'inicio');
  }
  syncUrl(){
    if(this.state.booting) return;
    const h=this.routeToHash();
    if(location.hash!==h){ this._skipHash=true; try{ history.replaceState(null,'',h); }catch(e){ location.hash=h; } }
  }
  applyHash(){
    const parts=(location.hash||'').replace(/^#\/?/,'').split('/');
    const seg=parts[0]||'';
    const pageMap={terminos:'terms',privacidad:'privacy',estado:'status',contacto:'contact',ayuda:'help'};
    if(pageMap[seg]){ this.openPage(pageMap[seg]); return; }
    if(seg==='ajustes'){ if(this.state.authed){ this.setState({route:'settings', setTab:parts[1]||'profile', avatarOpen:false, notifOpen:false}); } return; }
    const rmap={descargar:'download',cola:'queue',biblioteca:'library',entrar:'login',registro:'signup',verificar:'verify',recuperar:'forgot',restablecer:'reset',inicio:'home'};
    const r=rmap[seg];
    if(!r) return;
    if(['download','queue','library'].includes(r)){ if(this.state.authed) this.go(r); return; }
    if(['login','signup','forgot'].includes(r)){ if(!this.state.authed) this.go(r); return; }
    if(r==='home' && !this.state.authed){ this.go('home'); }
  }

  // dropdowns inteligentes: mismo ancho que su disparador y que abran hacia
  // arriba si no caben abajo (nunca se cortan), sin mover el layout.
  componentDidUpdate(){
    this.syncUrl();
    // panel de filtros: deslizar hacia abajo para cerrar (como una hoja nativa)
    const sheet=document.querySelector('.gr-lib-sheet-panel');
    if(sheet && !sheet._swipeBound){
      sheet._swipeBound=true;
      let startY=0, dragging=false;
      sheet.addEventListener('touchstart',(e)=>{ if(sheet.scrollTop<=0){ startY=e.touches[0].clientY; dragging=true; } },{passive:true});
      sheet.addEventListener('touchmove',(e)=>{ if(!dragging) return; const dy=e.touches[0].clientY-startY; if(dy>0){ sheet.style.transform='translateY('+dy+'px)'; sheet.style.transition='none'; } },{passive:true});
      sheet.addEventListener('touchend',(e)=>{ if(!dragging) return; dragging=false; const dy=e.changedTouches[0].clientY-startY; sheet.style.transition=''; sheet.style.transform=''; if(dy>80) this._closeAnySheet(); },{passive:true});
    }
    if(!this.state.openDropdown) return;
    if(this._ddRAF) cancelAnimationFrame(this._ddRAF);
    this._ddRAF = requestAnimationFrame(()=>{
      document.querySelectorAll('[data-dd]').forEach(dd=>{
        let menu=null;
        dd.querySelectorAll('div').forEach(d=>{ if(d.style && d.style.position==='absolute') menu=d; });
        if(!menu) return;
        const trigger = dd.querySelector('button');
        // ancho = el del disparador (mínimo el suyo propio)
        const w = Math.max(dd.offsetWidth, trigger?trigger.offsetWidth:0);
        menu.style.minWidth = w+'px';
        menu.style.left='0'; menu.style.right='auto';
        // gap respecto al disparador (no pegado) + abrir hacia arriba si no cabe
        menu.style.bottom='auto'; menu.style.top='calc(100% + 6px)';
        const r = menu.getBoundingClientRect();
        if(r.bottom > window.innerHeight - 8){
          menu.style.top='auto'; menu.style.bottom='calc(100% + 6px)';
        }
        // si aun así es muy alto, scroll interno
        menu.style.maxHeight = 'min(320px, '+(window.innerHeight-24)+'px)';
        menu.style.overflowY='auto';
      });
    });
  }

  async boot(){
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get('token');
    if (resetToken){
      this.setState({ booting:false, route:'reset', resetToken });
      return;
    }
    // Regreso desde el checkout de Wompi: ?wompi=1&id=<transactionId>
    const wompiId = params.get('wompi')==='1' ? params.get('id') : null;
    // Vuelta del login con Google cuando algo falló (?oauth=<motivo>)
    const oauth = params.get('oauth');
    if (oauth){
      const MOT = { disabled:'El acceso con Google no está configurado', cancelado:'Cancelaste el acceso con Google',
                    estado:'La sesión de Google caducó, inténtalo de nuevo', token:'Google rechazó la conexión',
                    perfil:'No se pudo leer tu perfil de Google', cuenta:'Esa cuenta ya no está disponible' };
      setTimeout(()=>this.toast(MOT[oauth] || 'No se pudo entrar con Google'), 600);
      try { history.replaceState(null,'',location.pathname+location.hash); } catch(e){}
    }
    const ok = await this.tryRefresh();
    if (ok){
      this.setState({ authed:true, route:'download', booting:false });
      this.applyHash(); // restaura la vista del hash YA, antes de cargar datos (sin flash de Descargar)
      await this.loadAll();
      this.openStream();
      this.applyHash(); // reasegura por si el hash cambió durante la carga
      if (wompiId) await this.confirmWompiPayment(wompiId);
    } else {
      this.setState({ booting:false, route:'home' });
      try {
        const q = await this.api('/downloads/guest-quota');
        if (!q.unlimited) this.setHome({ guestLeft: q.guestLeft });
      } catch(e) { /* sin backend no hay muro */ }
      this.applyHash(); // restaurar página pública si el hash apunta a una
    }
  }

  // ———————————————————————— carga de datos ————————————————————————

  async loadAll(){
    await Promise.all([
      this.loadMe(), this.loadPrefs(), this.loadQueue(), this.loadLibrary(),
      this.loadNotifications(), this.loadSessions(), this.loadBilling(),
    ].map(p=>p.catch(err=>console.warn('carga parcial:', err.message))));
  }

  async loadMe(){
    const j = await this.api('/me');
    const u = j.user, st = j.stats;
    const since = new Date(st.memberSince);
    const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    this.setState({
      profile:{ name:u.name, username:u.username, email:u.email, bio:u.bio, hasAvatar:u.hasAvatar },
      plan:u.plan,
      twofa: !!u.twofaEnabled,
      stats:{
        downloads: String(st.totalDownloads),
        storage: st.storageLabel,
        storageSub: u.plan==='Studio' ? 'de 1 TB' : u.plan==='Pro' ? 'de 200 GB' : '',
        collections: String(st.collections),
        since: MES[since.getMonth()] + ' ' + since.getFullYear(),
      },
    });
  }

  async loadPrefs(){
    const j = await this.api('/me/preferences');
    const p = j.preferences;
    this.setState({
      prefs:{ language:p.language, timezone:p.timezone, quality:p.quality, format:p.format, filename:p.filename, concurrency:p.concurrency, autoTrash:p.autoTrash },
      concurrency: p.concurrency,
      notif: p.notifications && p.notifications.done ? p.notifications : this.state.notif,
      theme: p.theme || this.state.theme,
    }, ()=>{
      this.applyTheme();
      // si ya tenía push activo y el permiso está concedido, refresca la suscripción
      // en silencio (sin mandar push de prueba en cada recarga)
      if(this._anyPushOn() && this.pushSupported() && Notification.permission==='granted'){
        void this.enablePush(true);
      }
    });
  }

  async loadQueue(){
    const j = await this.api('/downloads');
    this.setState({ queue: j.jobs });
  }

  async loadLibrary(){
    const [lib, trash, cols] = await Promise.all([
      this.api('/library?limit=100'),
      this.api('/library/trash'),
      this.api('/collections'),
    ]);
    this.setState({
      videos: lib.items,
      trash: trash.items,
      collections: cols.collections.map(c=>({ id:c.id, name:c.name, color:c.color, days:c.days, count:c.count })),
    });
  }

  async loadNotifications(){
    const j = await this.api('/notifications');
    this.setState({ notifItemsSrv: j.notifications, unread: j.unread });
  }

  // ———————————————————————— Web Push (VAPID) ————————————————————————
  pushSupported(){ return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }

  _urlB64ToUint8(base64){
    const pad='='.repeat((4-base64.length%4)%4);
    const b64=(base64+pad).replace(/-/g,'+').replace(/_/g,'/');
    const raw=atob(b64); const out=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
    return out;
  }

  async _registerSW(){
    if(!('serviceWorker' in navigator)) return null;
    try { return await navigator.serviceWorker.register('/sw.js'); }
    catch(e){ return null; }
  }

  // pide permiso, se suscribe y guarda la suscripción en el backend.
  // silent=true: re-suscripción al arrancar (NO manda push de prueba ni toast;
  // antes eso disparaba una notificación en CADA recarga).
  async enablePush(silent){
    if(!this.pushSupported()){ if(!silent) this.toast('Tu navegador no soporta notificaciones push'); return false; }
    let perm = Notification.permission;
    if(perm==='default'){ if(silent) return false; perm = await Notification.requestPermission(); }
    if(perm!=='granted'){ if(!silent) this.toast('Permiso de notificaciones denegado'); return false; }
    await this._registerSW();
    const reg = await navigator.serviceWorker.ready;
    try {
      const { publicKey, enabled } = await this.api('/push/vapid-key');
      if(!enabled || !publicKey){ if(!silent) this.toast('Push no está configurado en el servidor'); return false; }
      let sub = await reg.pushManager.getSubscription();
      if(!sub){
        sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:this._urlB64ToUint8(publicKey) });
      }
      const j = sub.toJSON();
      await this.api('/push/subscribe', { method:'POST', body:{ endpoint:j.endpoint, keys:j.keys } });
      this._pushOn = true;
      if(!silent){
        // confirmación SOLO al activar manualmente: notif local + push del servidor
        void this.showLocalNotification('Grabber', { body:'Notificaciones activadas ✓', tag:'grabber-test' });
        void this.api('/push/test', { method:'POST' }).catch(()=>{});
        this.toast('Notificaciones push activadas');
      }
      return true;
    } catch(e){ if(!silent) this.toast('No se pudo activar el push'); return false; }
  }

  // borra la suscripción local y en el backend
  async disablePush(){
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if(sub){
        await this.api('/push/unsubscribe', { method:'POST', body:{ endpoint:sub.endpoint } }).catch(()=>{});
        await sub.unsubscribe().catch(()=>{});
      }
    } catch(e){ /* nada que limpiar */ }
    this._pushOn = false;
  }

  // ¿hay alguna fila con push activo? (para saber si debemos estar suscritos)
  _anyPushOn(){ const n=this.state.notif; return Object.keys(n).some(k=>n[k] && n[k].push); }

  // notificación LOCAL inmediata (cliente), como Hibi: cuando la app está
  // abierta no esperamos el viaje al servidor. En Chrome `new Notification` desde
  // la página está prohibido → se usa el service worker; si no hay, se cae al
  // constructor. Requiere permiso concedido.
  async showLocalNotification(title, opts){
    if(!('Notification'in window) || Notification.permission!=='granted') return false;
    const o={ icon:'/public/brand/icon-192.png', badge:'/public/brand/icon-192.png', tag:'grabber', ...(opts||{}) };
    if('serviceWorker'in navigator){
      try{
        const reg=await Promise.race([navigator.serviceWorker.ready, new Promise(r=>setTimeout(()=>r(null),2000))]);
        if(reg){ await reg.showNotification(title,o); return true; }
      }catch(e){ /* cae al constructor */ }
    }
    try{ new Notification(title,o); return true; }catch(e){ return false; }
  }

  // dispara la notificación local si el usuario tiene ese evento con push activo
  _localNotifyForEvent(prefKey, title, body, url){
    if(!this._anyPushOn()) return;
    const row=this.state.notif[prefKey];
    if(row && row.push===false) return;
    void this.showLocalNotification(title, { body, tag:'grabber-dl', data:{url:url||'/'} });
  }

  async loadSessions(){
    try {
      const j = await this.api('/auth/sessions');
      const rel = (iso)=>{ const m=Math.round((Date.now()-new Date(iso).getTime())/60000); if(m<2) return 'ahora'; if(m<60) return 'hace '+m+' min'; const h=Math.round(m/60); if(h<24) return 'hace '+h+' h'; return 'hace '+Math.round(h/24)+' días'; };
      this.setState({ sessions: j.sessions.map(s=>({ id:s.id, device:s.device, browser:s.browser, loc:s.loc, last: s.current?'ahora':rel(s.last), current:s.current })) });
    } catch(e){ /* opcional */ }
  }

  async loadBilling(){
    try {
      const [inv, usage] = await Promise.all([ this.api('/billing/history'), this.api('/me/usage') ]);
      const bu = await this.api('/billing/usage').catch(()=>null);
      const [status, sub] = await Promise.all([
        this.api('/billing/pay/status').catch(()=>({enabled:false})),
        this.api('/billing/subscription').catch(()=>null),
      ]);
      this.setState({
        invoices: inv.invoices,
        payEnabled: !!status.enabled,
        sub,
        usage:{
          label: usage.usage.usageLabel,
          pct: usage.usage.usagePct + '%',
          downloads: String(usage.usage.downloadsThisPeriod),
          downloadsSub: bu ? bu.usage.downloadsLabel : '',
          bandwidth: bu ? bu.usage.bandwidthLabel : '—',
          renews: bu ? bu.usage.renewsLabel : '—',
        },
      });
    } catch(e){ /* opcional */ }
  }

  // ———————————————————————— pagos (Wompi) ————————————————————————

  /** Fecha del vencimiento/renovación formateada en español. */
  _subDateLabel(iso){
    if(!iso) return '';
    const d = new Date(iso);
    const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return d.getDate()+' de '+MES[d.getMonth()]+' de '+d.getFullYear();
  }

  /** Inicia el pago de un plan: pide los parámetros firmados y redirige a Wompi. */
  async startCheckout(planId){
    if(this.state.checkingOut) return;
    if(planId==='free'){ return this.downgradeToFree(); }
    if(!this.state.payEnabled){ this.toast('Los pagos aún no están configurados en el servidor'); return; }
    this.setState({checkingOut:true});
    try {
      const c = await this.api('/billing/checkout', { method:'POST', body:{ plan:planId } });
      const url = c.checkoutUrl
        + '?public-key=' + encodeURIComponent(c.publicKey)
        + '&currency=' + c.currency
        + '&amount-in-cents=' + c.amountInCents
        + '&reference=' + encodeURIComponent(c.reference)
        + '&signature:integrity=' + c.signature
        + '&redirect-url=' + encodeURIComponent(c.redirectUrl)
        + '&customer-data:email=' + encodeURIComponent(c.customerEmail);
      window.location.href = url; // salimos hacia el checkout de Wompi
    } catch(e){
      this.setState({checkingOut:false});
      this.toast(e.message || 'No se pudo iniciar el pago');
    }
  }

  /** Baja a Free (sin pago). */
  async downgradeToFree(){
    try {
      const r = await this.api('/billing/plan', { method:'POST', body:{ plan:'free' } });
      this.setState({ plan: r.user.plan });
      await this.loadBilling();
      this.toast('Ahora estás en el plan Free');
    } catch(e){ this.toast(e.message || 'No se pudo cambiar el plan'); }
  }

  /** Confirma el pago al volver del checkout: verifica y activa el plan. */
  async confirmWompiPayment(id){
    // limpia los parámetros de la URL y abre la pestaña de Plan
    try{ history.replaceState(null,'','/#/ajustes/plan'); }catch(e){ location.hash='#/ajustes/plan'; }
    this.setState({ route:'settings', setTab:'plan', avatarOpen:false, notifOpen:false });
    this.toast('Confirmando tu pago…');
    try {
      const r = await this.api('/billing/verify?id=' + encodeURIComponent(id));
      if (r.activated && r.user){
        this.setState({ plan:r.user.plan });
        await Promise.all([ this.loadMe(), this.loadBilling() ]);
        this.toast('¡Pago aprobado! Tu plan '+r.user.plan+' está activo');
      } else if (r.status==='PENDING'){
        this.toast('Pago pendiente. Te avisaremos cuando se confirme');
      } else {
        this.toast('El pago no se completó. No se realizó ningún cargo');
      }
    } catch(e){ this.toast(e.message || 'No se pudo verificar el pago'); }
  }

  /** Cancela la renovación automática (el plan sigue activo hasta vencer). */
  async cancelRenewal(){
    try {
      const r = await this.api('/billing/cancel', { method:'POST' });
      this.setState(s=>({ sub: s.sub ? { ...s.sub, autoRenew:false } : s.sub }));
      const until = this._subDateLabel(r.planUntil);
      this.toast(until ? ('Renovación cancelada. Tu plan sigue activo hasta el '+until) : 'Renovación cancelada');
    } catch(e){ this.toast(e.message || 'No se pudo cancelar'); }
  }

  // ———————————————————————— SSE ————————————————————————

  openStream(){
    if (this._es) this._es.close();
    if (!this._token) return;
    const es = new EventSource(API + '/downloads/stream?token=' + encodeURIComponent(this._token));
    this._es = es;
    const speedLabel = (b)=>{ if(!b||b<=0) return '—'; const mb=b/1048576; return (mb>=10?Math.round(mb):Math.round(mb*10)/10)+' MB/s'; };
    es.addEventListener('progress', (e)=>{
      const d = JSON.parse(e.data);
      this.setState(s=>({ queue: s.queue.map(q=> q.id===d.jobId ? { ...q, status:'downloading', pct:d.pct, etaS:d.etaS||0, speed:speedLabel(d.speed) } : q) }));
    });
    const replaceJob = (e)=>{
      const d = JSON.parse(e.data);
      this.setState(s=>{
        const exists = s.queue.some(q=>q.id===d.jobId);
        const queue = exists ? s.queue.map(q=>q.id===d.jobId?d.job:q) : [d.job, ...s.queue];
        return { queue };
      });
    };
    es.addEventListener('status', replaceJob);
    es.addEventListener('completed', (e)=>{
      replaceJob(e);
      const d = JSON.parse(e.data);
      const title = (d.job&&d.job.title) || 'Descarga';
      this._pcJobs = this._pcJobs || new Set();
      if (this._pcJobs.has(d.jobId)){
        this._pcJobs.delete(d.jobId);
        // baja el archivo directo al PC y avisa según el resultado real
        void this.pcDownload('/downloads/'+d.jobId+'/file', title).then(ok=>{
          if (ok) this.toast('«'+title+'» guardada en tu PC', 'Ver biblioteca', ()=>this.go('library'));
          else this.toast('«'+title+'» lista. No se pudo bajar sola', 'Descargar al PC', ()=>{ void this.pcDownload('/downloads/'+d.jobId+'/file', title); });
        });
      } else {
        this.toast('«'+title+'» completada', 'Ver biblioteca', ()=>this.go('library'));
      }
      // notificación local inmediata (como Hibi) — la del servidor cubre app cerrada
      this._localNotifyForEvent('done', 'Descarga completada', '«'+title+'» ya está en tu biblioteca', '/#/biblioteca');
      void this.loadLibrary(); void this.loadNotifications(); void this.loadBilling();
    });
    es.addEventListener('failed', (e)=>{
      replaceJob(e);
      const d = JSON.parse(e.data);
      const t=(d.job&&d.job.title)||'Tu descarga';
      this.toast((d.job&&d.job.errorMessage) || 'La descarga falló');
      this._localNotifyForEvent('error', 'Descarga fallida', '«'+t+'» no se pudo completar', '/#/cola');
      void this.loadNotifications();
    });
    es.onerror = ()=>{
      // token caducado: reintentar con uno fresco (con calma)
      if (this._esRetry) return;
      this._esRetry = setTimeout(async ()=>{
        this._esRetry = null;
        if (this.state.authed && await this.tryRefresh()) this.openStream();
      }, 5000);
    };
  }

  // ———————————————————————— tema / navegación ————————————————————————

  applyTheme(){
    // OJO: no depender de que _mq ya exista (applyTheme se llama en el arranque
    // ANTES de componentDidMount terminar). Si falta, se crea aquí; si no, el
    // tema 'system' caía siempre en 'light' aunque el equipo estuviera oscuro.
    if(!this._mq && window.matchMedia) this._mq = window.matchMedia('(prefers-color-scheme: dark)');
    const prefiereOscuro = this._mq ? this._mq.matches : false;
    const t = this.state.theme==='system' ? (prefiereOscuro?'dark':'light') : this.state.theme;
    document.documentElement.setAttribute('data-theme', t);
  }
  setTheme(t){
    // crossfade suave de colores: activa la transición global solo durante el cambio
    const el = document.documentElement;
    el.classList.add('gr-theming');
    clearTimeout(this._themeT);
    this._themeT = setTimeout(()=>el.classList.remove('gr-theming'), 450);
    this.setState({theme:t}, ()=>this.applyTheme());
    try { localStorage.setItem('grabber-theme', t); } catch(e){ /* opcional */ }
    if (this.state.authed) this.debounced('theme', ()=>this.api('/me/preferences',{method:'PATCH',body:{theme:t}}).catch(()=>{}));
  }
  cycleTheme(){ const o=['dark','light','system']; const i=o.indexOf(this.state.theme); this.setTheme(o[(i+1)%3]); }

  go(route){ this.setState({route, avatarOpen:false, notifOpen:false, openDropdown:null}); window.scrollTo(0,0); }

  debounced(key, fn, ms){
    clearTimeout(this._debounce[key]);
    this._debounce[key] = setTimeout(fn, ms||600);
  }

  mkDD(id, value, options, setter){
    const s=this.state;
    const selOpt = options.find(o=>(typeof o==='object'?o.value:o)===value);
    const label = selOpt ? (typeof selOpt==='object'?selOpt.label:selOpt) : value;
    return { value, label, open:s.openDropdown===id,
      toggle:(e)=>{ e&&e.stopPropagation&&e.stopPropagation(); this.setState(st=>({openDropdown:st.openDropdown===id?null:id})); },
      options: options.map(opt=>{ const val=typeof opt==='object'?opt.value:opt; const lab=typeof opt==='object'?opt.label:opt; const sel=val===value; return { label:lab, sel, selColor:sel?'var(--text)':'var(--text-muted)', selBg:sel?'var(--surface-pressed)':'transparent', onClick:()=>{ setter(val); this.setState({openDropdown:null}); } }; }) };
  }

  toast(msg, action, onAction){
    const id = ++this._toastId;
    this.setState(s=>({toasts:[...s.toasts,{id,msg,action,onAction}]}));
    setTimeout(()=>this.setState(s=>({toasts:s.toasts.filter(t=>t.id!==id)})), 4000);
  }

  detectPlatform(url){
    const u=(url||'').toLowerCase();
    if(u.includes('youtu')) return 'YouTube';
    if(u.includes('instagram')) return 'Instagram';
    if(u.includes('tiktok')) return 'TikTok';
    if(u.includes('x.com')||u.includes('twitter')) return 'X';
    if(u.includes('facebook')||u.includes('fb.watch')) return 'Facebook';
    if(u.includes('reddit')) return 'Reddit';
    return null;
  }

  // ———————————————————————— auth ————————————————————————

  async doLogin(){
    const { email, pass } = { email:this.state.f.email.trim(), pass:this.state.f.pass };
    if(!email || !pass){ this.toast('Escribe tu correo y contraseña'); return; }
    try {
      const body = { email, password: pass };
      if (this._pendingTotp) body.totp = this._pendingTotp;
      const j = await this.api('/auth/login', { method:'POST', body });
      this._token = j.accessToken; this._pendingTotp = null;
      this.setState({ authed:true, route:'download', f:{email:'',pass:'',name:''} });
      window.scrollTo(0,0);
      await this.loadAll();
      this.openStream();
    } catch(e){
      if (e.code === 'TWOFA_REQUIRED'){
        const code = window.prompt('Introduce tu código de verificación (2FA):');
        if (code){ this._pendingTotp = code.trim(); return this.doLogin(); }
        return;
      }
      this.toast(e.message || 'No se pudo iniciar sesión');
    }
  }

  async doSignup(){
    const f = this.state.f;
    if(!this.state.terms || !this.state.privacyAcc){ this.toast('Acepta los términos y la política de privacidad'); return; }
    if(!f.email.trim() || f.pass.length<8){ this.toast('Revisa el correo y una contraseña de 8+ caracteres'); return; }
    const email = f.email.trim().toLowerCase();
    const base = (f.name.trim()||email.split('@')[0]).toLowerCase().normalize('NFKD').replace(/[^a-z0-9_.]+/g,'').slice(0,24) || 'usuario';
    let username = base;
    for (let intento=0; intento<3; intento++){
      try {
        await this.api('/auth/register', { method:'POST', body:{ email, username, password:f.pass, displayName:f.name.trim()||undefined } });
        // sin muro de verificación: entramos directo
        const j = await this.api('/auth/login', { method:'POST', body:{ email, password:f.pass } });
        this._token = j.accessToken;
        this.setState({ authed:true, route:'download', f:{email:'',pass:'',name:''}, terms:false });
        window.scrollTo(0,0);
        await this.loadAll();
        this.openStream();
        this.toast('¡Bienvenido a Grabber!');
        return;
      } catch(e){
        if (e.code === 'USERNAME_TAKEN'){ username = base.slice(0,19) + Math.floor(1000+Math.random()*9000); continue; }
        this.toast(e.message || 'No se pudo crear la cuenta');
        return;
      }
    }
    this.toast('No se pudo crear la cuenta');
  }

  startResendTimer(){
    if(this._resendT) clearInterval(this._resendT);
    this.setState({resendIn:42});
    this._resendT = setInterval(()=>{
      this.setState(s=>{
        if(s.resendIn<=1){ clearInterval(this._resendT); this._resendT=null; void this.api('/auth/verify-email/resend',{method:'POST',body:{email:s.pendingEmail}}).catch(()=>{}); return {resendIn:42}; }
        return { resendIn: s.resendIn-1 };
      });
    }, 1000);
  }

  async doVerify(){
    const code = this.state.verifyCode;
    if (code.length !== 6){ this.toast('Escribe los 6 dígitos del código (te llegó por correo)'); return; }
    try {
      const j = await this.api('/auth/verify-email', { method:'POST', body:{ email:this.state.pendingEmail, code } });
      this._token = j.accessToken;
      if(this._resendT){ clearInterval(this._resendT); this._resendT=null; }
      this.setState({ authed:true, route:'download', verifyCode:'' });
      window.scrollTo(0,0);
      await this.loadAll();
      this.openStream();
    } catch(e){ this.toast(e.message || 'El código no es válido'); }
  }

  async doForgot(){
    const email = this.state.f.email.trim();
    if(!email){ this.toast('Escribe tu correo'); return; }
    try {
      await this.api('/auth/password/forgot', { method:'POST', body:{ email } });
      this.toast('Si el correo existe, te llegó un enlace (mira C:/Grabber/downloads/.mail en local)');
    } catch(e){ this.toast(e.message); }
  }

  async doReset(){
    const pass = this.state.f.pass;
    if(pass.length<8){ this.toast('La contraseña necesita 8+ caracteres'); return; }
    try {
      await this.api('/auth/password/reset', { method:'POST', body:{ token:this.state.resetToken, password:pass } });
      window.history.replaceState({}, '', '/');
      this.setState({ resetToken:'', f:{...this.state.f, pass:''} });
      this.go('login');
      this.toast('Contraseña actualizada, inicia sesión');
    } catch(e){ this.toast(e.message); }
  }

  async doLogout(){
    try { await this.api('/auth/logout', { method:'POST' }); } catch(e){ /* igual salimos */ }
    if (this._es) this._es.close();
    this._token = null;
    this.setState({ authed:false, route:'login', avatarOpen:false, queue:[], videos:[], trash:[], collections:[], notifItemsSrv:[], sessions:[] });
  }

  // ———————————————————————— descargar ————————————————————————

  async analyze(){
    const url=this.state.url.trim();
    if(!url){ this.setState({dlError:'El enlace no parece válido'}); return; }
    this.setState({analyzing:true,result:null,dlError:''});
    try {
      if (this.state.batchMode){
        const urls = url.split('\n').map(l=>l.trim()).filter(Boolean).slice(0,20);
        const j = await this.api('/media/analyze/batch', { method:'POST', body:{ urls } });
        this._batch = j.results;
        const ok = j.results.filter(r=>r.ok);
        if (!ok.length){ this.setState({analyzing:false, dlError:(j.results[0]&&j.results[0].error&&j.results[0].error.message)||'No se pudo analizar ningún enlace'}); return; }
        const m = ok[0].media;
        this._formats = m.formats||[];
        this.setState({analyzing:false, result:{ title: ok.length+' enlaces listos · '+m.title, author:m.author, views:m.views, date:m.date, duration:m.duration, platform:m.platform, platformLabel:m.platform, mediaSourceId:m.mediaSourceId, thumb:m.thumbnailUrl }});
        return;
      }
      const j = await this.api('/media/analyze', { method:'POST', body:{ url } });
      const m = j.media;
      this._formats = m.formats||[];
      this._batch = null;
      this.setState({analyzing:false, result:{ title:m.title, author:m.author, views:m.views, date:m.date, duration:m.duration, platform:m.platform, platformLabel:m.platform, mediaSourceId:m.mediaSourceId, thumb:m.thumbnailUrl }});
    } catch(e){
      this.setState({analyzing:false, dlError: e.message || 'No se pudo analizar el enlace'});
    }
  }

  qualitySizes(){
    const out = {'2160p':'—','1440p':'—','1080p':'—','720p':'—','480p':'—','360p':'—','Audio MP3':'—','Audio M4A':'—'};
    for (const f of (this._formats||[])) if (f.quality in out) out[f.quality] = f.sizeLabel || '—';
    return out;
  }

  async addToQueue(autoPc){
    const r=this.state.result; if(!r) return;
    const quality = this.state.quality;
    const options = { subtitles:this.state.dlOpts.subs, thumbnail:this.state.dlOpts.thumb };
    const targets = this.state.batchMode && this._batch ? this._batch.filter(x=>x.ok).map(x=>x.media.mediaSourceId) : [r.mediaSourceId];
    this._pcJobs = this._pcJobs || new Set();
    try {
      for (const mediaSourceId of targets){
        const j = await this.api('/downloads', { method:'POST', body:{ mediaSourceId, quality, options } });
        // los iniciados con "Descargar" bajan solos al PC al terminar
        if (autoPc && j.job && j.job.id) this._pcJobs.add(j.job.id);
        this.setState(s=>({ queue:[j.job, ...s.queue] }));
      }
    } catch(e){ this.toast(e.message || 'No se pudo encolar'); }
  }

  // baja un archivo del servidor al PC del usuario (con token, vía blob para que
  // el navegador respete la autenticación y el nombre real del archivo)
  async pcDownload(fileApiPath, fallbackName){
    try {
      const headers = {}; if (this._token) headers['Authorization'] = 'Bearer ' + this._token;
      const res = await fetch(API + fileApiPath, { headers, credentials:'include' });
      if (!res.ok) return false;
      const cd = res.headers.get('Content-Disposition') || '';
      const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
      const name = (m ? decodeURIComponent(m[1]) : '') || fallbackName || 'grabber';
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 15000);
      return true;
    } catch(e){ return false; }
  }

  // ———————————————————————— biblioteca ————————————————————————

  setLib(patch){ this.setState(s=>({lib:{...s.lib, ...patch}})); }
  // bloqueo del scroll de fondo. Se pone una CLASE en <html> (el framework NO
  // reescribe html, a diferencia de body/topbar cuyos estilos inline sí borra).
  // La regla CSS bloquea html Y body, cubra donde cubra el scroll.
  _lockScroll(){
    if(this._scrollLocked) return;
    this._scrollLocked = true;
    document.documentElement.classList.add('gr-scroll-lock');
    document.documentElement.style.overflow='hidden';
    // bloqueo DEFINITIVO: cancela cualquier touchmove que NO ocurra dentro del
    // panel de filtros. Así el fondo no se mueve, sin importar qué elemento
    // scrollee. Dentro del panel sí se permite (para poder scrollear sus filtros).
    if(!this._blockBg){
      this._blockBg = (e)=>{
        const panel = document.querySelector('.gr-lib-sheet-panel');
        if(panel && panel.contains(e.target)){
          // permite el scroll interno, pero corta el encadenamiento en los bordes
          if(panel.scrollHeight <= panel.clientHeight) e.preventDefault();
          return;
        }
        e.preventDefault();
      };
    }
    document.addEventListener('touchmove', this._blockBg, { passive:false, capture:true });
  }
  _unlockScroll(){
    if(!this._scrollLocked) return;
    this._scrollLocked = false;
    document.documentElement.classList.remove('gr-scroll-lock');
    document.documentElement.style.overflow='';
    if(this._blockBg) document.removeEventListener('touchmove', this._blockBg, { capture:true });
  }
  // cierra el panel de filtros con animación de salida (deslizar hacia abajo)
  closeLibFilters(){
    if(!this.state.lib.filtersOpen || this.state.lib.filtersClosing) return;
    this.setLib({filtersClosing:true, openFilter:null});
    clearTimeout(this._sheetT);
    this._sheetT = setTimeout(()=>{ this._unlockScroll(); this.setLib({filtersOpen:false, filtersClosing:false}); }, 280);
  }
  // —— filtros de la Cola (mismo panel deslizante que Biblioteca) ——
  setColaF(patch){ this.setState(s=>({colaF:{...s.colaF, ...patch}})); }
  closeColaFilters(){
    if(!this.state.colaF.open || this.state.colaF.closing) return;
    this.setColaF({closing:true});
    clearTimeout(this._colaT);
    this._colaT = setTimeout(()=>{ this._unlockScroll(); this.setColaF({open:false, closing:false}); }, 280);
  }
  // cierra el panel de filtros que esté abierto (para el gesto de deslizar)
  _closeAnySheet(){ if(this.state.lib.filtersOpen) this.closeLibFilters(); else if(this.state.colaF.open) this.closeColaFilters(); }

  libVals(){
    const s=this.state, L=s.lib;
    const collById = Object.fromEntries(s.collections.map(c=>[c.id,c]));
    const platCode=PLAT_CODE;

    let base = s.videos.slice();
    if(L.tab==='favorites') base = base.filter(v=>v.favorite);
    const dateMax={ 'Hoy':1,'Esta semana':7,'Este mes':30,'Este año':365 }[L.filters.date];
    const list = base.filter(v=>{
      // búsqueda SIN tildes: "compresion" también encuentra "compresión"
      if(L.search && !this._norm((v.title||'')+' '+(v.author||'')).includes(this._norm(L.search))) return false;
      if(L.filters.platform && v.platform!==L.filters.platform) return false;
      if(L.filters.format && !v.format.includes(L.filters.format)) return false;
      if(L.filters.quality && v.quality!==L.filters.quality) return false;
      if(dateMax && v.days>dateMax) return false;
      return true;
    });
    if(L.sort==='recent') list.sort((a,b)=>a.days-b.days);
    else if(L.sort==='title') list.sort((a,b)=>a.title.localeCompare(b.title));
    else if(L.sort==='size') list.sort((a,b)=>b.sizeB-a.sizeB);

    const selSet=new Set(L.sel);
    const mkCard=(v)=>({
      ...v, plat:v.platform, code:platCode[v.platform]||v.platform,
      collName: v.collectionId&&collById[v.collectionId]?collById[v.collectionId].name:null,
      selected:selSet.has(v.id),
      selBg: selSet.has(v.id)?'var(--accent)':'var(--surface-raised)',
      selCheck: selSet.has(v.id)?IC.check():null,
      favColor: v.favorite?'var(--accent)':'var(--text-muted)',
      favIcon: v.favorite?IC.starFill():IC.star(),
      onOpen:()=>this.setState({detailId:v.id}),
      onToggleSel:(e)=>{ e && e.stopPropagation && e.stopPropagation(); this.toggleSel(v.id); },
      onFav:(e)=>{ e && e.stopPropagation && e.stopPropagation(); this.toggleFav(v.id); },
    });
    const cards=list.map(mkCard);

    const libTabs=[['Todo','all'],['Favoritos','favorites'],['Colecciones','collections'],['Papelera','trash']].map(([label,val])=>({label,val,active:L.tab===val,color:L.tab===val?'var(--text)':'var(--text-muted)',onClick:()=>this.setLib({tab:val,sel:[]})}));

    const filterDefs=[
      {key:'platform',name:'Plataforma',options:PLATFORMS},
      {key:'format',name:'Formato',options:['MP4','MP3','M4A']},
      {key:'quality',name:'Calidad',options:['2160p','1440p','1080p','720p','480p','Audio']},
      {key:'date',name:'Fecha',options:['Hoy','Esta semana','Este mes','Este año']},
    ];
    const filterChips=filterDefs.map(fd=>({
      key:fd.key, name:fd.name, value: L.filters[fd.key]||'Todas', label: L.filters[fd.key]||fd.name,
      active: !!L.filters[fd.key],
      color: L.filters[fd.key]?'var(--text)':'var(--text-muted)',
      bg: L.filters[fd.key]?'var(--surface-raised)':'var(--surface)',
      open: L.openFilter===fd.key,
      onClick:()=>this.setLib({openFilter: L.openFilter===fd.key?null:fd.key}),
      options: fd.options.map(o=>({label:o, color:L.filters[fd.key]===o?'var(--text)':'var(--text-muted)', selBg:L.filters[fd.key]===o?'var(--surface-pressed)':'transparent', pillBg:L.filters[fd.key]===o?'var(--accent)':'var(--surface)', pillColor:L.filters[fd.key]===o?'#0F0F0F':'var(--text-muted)', onClick:()=>this.setLib({filters:{...L.filters,[fd.key]:L.filters[fd.key]===o?null:o}, openFilter:null})})),
    }));

    const sortLabels={recent:'Recientes',title:'Título',size:'Tamaño'};

    const cols=s.collections.map(c=>({
      ...c, count: c.count!=null?c.count:s.videos.filter(v=>v.collectionId===c.id).length,
      dateLabel:'actualizada hace '+(c.days<1?'poco':c.days<7?c.days+' días':Math.round(c.days/7)+' sem'),
      thumbs:[0,1,2,3],
      onOpen:()=>this.setLib({tab:'all', filters:{...L.filters}, search:''}),
    }));

    const detail = s.detailId ? s.videos.find(v=>v.id===s.detailId) : null;
    const detailVM = detail ? {
      ...detail, plat:detail.platform, code:platCode[detail.platform]||detail.platform,
      collName: detail.collectionId&&collById[detail.collectionId]?collById[detail.collectionId].name:'Sin colección',
      favIcon: detail.favorite?IC.starFill():IC.star(),
      favColor: detail.favorite?'var(--accent)':'var(--text-muted)',
      onFav:()=>this.toggleFav(detail.id),
      history:[{q:detail.format, when:detail.dateLabel}],
      fileUrl: '/api/v1/library/'+detail.id+'/file',
    } : null;

    const showItems = L.tab==='all'||L.tab==='favorites';
    const emptyTitle = L.search||L.filters.platform||L.filters.format||L.filters.quality||L.filters.date ? 'Sin resultados' : (L.tab==='favorites'?'Aún no hay favoritos':'La biblioteca está vacía');
    const emptySub = L.search||L.filters.platform ? 'Prueba con otros filtros o términos de búsqueda.' : (L.tab==='favorites'?'Marca videos con la estrella para verlos aquí.':'Descarga tu primer video para empezar a archivar.');
    return {
      libTabs, libView:L.view,
      libShowToolbar:showItems, libShowItems:showItems,
      showGrid:showItems && L.view==='grid', showList:showItems && L.view==='list',
      emptyTitle, emptySub, iconChevDown:IC.chevronDown(),
      createCollection:()=>this.createCollection(),
      libGrid:L.view==='grid', libList:L.view==='list',
      setGridView:()=>this.setLib({view:'grid'}), setListView:()=>this.setLib({view:'list'}),
      gridColor:L.view==='grid'?'var(--text)':'var(--text-muted)', listColor:L.view==='list'?'var(--text)':'var(--text-muted)',
      gridBg:L.view==='grid'?'var(--surface-raised)':'transparent', listBg:L.view==='list'?'var(--surface-raised)':'transparent',
      libSearch:L.search, setLibSearch:(e)=>this.setLib({search:e.target.value}),
      libSort:L.sort, sortLabel:sortLabels[L.sort], setLibSort:(e)=>this.setLib({sort:e.target.value}),
      filterChips,
      // en móvil los filtros van en un panel deslizante (sheet)
      toggleLibFilters:()=>{ if(L.filtersOpen) this.closeLibFilters(); else { this._lockScroll(); this.setLib({filtersOpen:true, filtersClosing:false, openFilter:null}); } },
      libFiltClass: L.filtersOpen?'gr-filters-open':'',
      filtersOpen: !!L.filtersOpen,
      sheetCloseClass: L.filtersClosing?'gr-sheet-closing':'',
      clearLibFilters:()=>this.setLib({filters:{platform:null,format:null,quality:null,date:null}}),
      sortOptions: [['recent','Recientes'],['title','Título'],['size','Tamaño']].map(([v,label])=>({label, pillBg:L.sort===v?'var(--accent)':'var(--surface)', pillColor:L.sort===v?'#0F0F0F':'var(--text-muted)', onClick:()=>this.setLib({sort:v})})),
      libIsAll:L.tab==='all', libIsFav:L.tab==='favorites', libIsCollections:L.tab==='collections', libIsTrash:L.tab==='trash',
      cards, cardCount:cards.length, cardsEmpty:cards.length===0,
      cols, collectionsEmpty:s.collections.length===0,
      trashItems:s.trash.map(t=>({...t, onRestore:()=>this.restoreItem(t.id)})), trashEmpty:s.trash.length===0,
      restoreItem:(id)=>this.restoreItem(id),
      emptyTrash:()=>this.emptyTrash(),
      iconStar:IC.star(), iconGrid:IC.grid(), iconList:IC.list(), iconFolder:IC.folder(), iconTrash:IC.trash(),
      iconMore:IC.more(), iconCopy:IC.copy(), iconDownload:IC.download(), iconPlusSm:IC.plus(), iconClose:IC.x(),
      iconFilm:IC.film(),
      selCount:L.sel.length, hasSel:L.sel.length>0,
      clearSel:()=>this.setLib({sel:[]}),
      favSel:()=>this.bulk('favorite', 'Marcados como favoritos'),
      deleteSel:()=>this.bulk('delete', L.sel.length+' movidos a la papelera'),
      moveSel:()=>this.moveToCollection(),
      redownloadSel:()=>this.redownloadSel(),
      detail:detailVM, detailOpen:!!detailVM, closeDetail:()=>this.setState({detailId:null, tagAdding:false, tagInput:''}),
      copyUrl:()=>{ if(detailVM){ navigator.clipboard && navigator.clipboard.writeText(detailVM.url); } this.toast('URL copiada'); },
      // Etiquetas: el botón "+ añadir" abre un input; "Añadir" (o Enter) guarda
      tagAdding: s.tagAdding, tagNotAdding: !s.tagAdding, tagInput: s.tagInput,
      startAddTag:()=>this.setState({tagAdding:true, tagInput:''}),
      setTagInput:(e)=>this.setState({tagInput:e.target.value}),
      onTagKey:(e)=>{ if(e.key==='Enter'){ e.preventDefault(); this.commitTag(); } else if(e.key==='Escape'){ this.setState({tagAdding:false, tagInput:''}); } },
      commitTag:()=>this.commitTag(),
      detailNotes: detailVM?detailVM.notes:'',
      setDetailNotes:(e)=>{ const v=e.target.value; const id=detailVM.id; this.setState(s=>({videos:s.videos.map(x=>x.id===id?{...x,notes:v}:x)})); this.debounced('note-'+id,()=>this.api('/library/'+id,{method:'PATCH',body:{notes:v}}).catch(()=>{})); },
      saveDetailToPC:()=>{ if(!detailVM) return; const a=document.createElement('a'); a.href=detailVM.fileUrl; a.download=''; document.body.appendChild(a); a.click(); a.remove(); this.toast('Descargando a tu PC…'); },
      deleteDetail:async ()=>{ if(!detailVM) return; const id=detailVM.id; try{ await this.api('/library/'+id,{method:'DELETE'}); this.setState({detailId:null}); await this.loadLibrary(); this.toast('Movido a la papelera'); }catch(e){ this.toast(e.message); } },
      closeLibOverlay:()=>this.setLib({openFilter:null}),
      libOverlayOpen:!!L.openFilter,
    };
  }

  async bulk(action, msg, collectionId){
    const ids = this.state.lib.sel;
    if(!ids.length) return;
    try {
      await this.api('/library/bulk', { method:'POST', body:{ ids, action, collectionId } });
      this.setLib({sel:[]});
      this.toast(msg);
      await this.loadLibrary();
    } catch(e){ this.toast(e.message); }
  }

  moveToCollection(){
    const c = this.state.collections[0];
    if(!c){ this.toast('Crea una colección primero'); return; }
    void this.bulk('move', 'Movidos a «'+c.name+'»', c.id);
  }

  async redownloadSel(){
    const sel = new Set(this.state.lib.sel);
    const items = this.state.videos.filter(v=>sel.has(v.id));
    this.setLib({sel:[]});
    try {
      for (const v of items){
        const j = await this.api('/downloads', { method:'POST', body:{ mediaSourceId:v.mediaSourceId, quality:v.rawQuality||'1080p' } });
        this.setState(s=>({ queue:[j.job, ...s.queue] }));
      }
      this.toast('Descargando de nuevo');
    } catch(e){ this.toast(e.message); }
  }

  async createCollection(){
    const name = 'Colección ' + (this.state.collections.length + 1);
    try {
      await this.api('/collections', { method:'POST', body:{ name } });
      await this.loadLibrary();
      this.toast('Colección creada');
    } catch(e){ this.toast(e.message); }
  }

  toggleSel(id){ this.setState(s=>{ const sel=s.lib.sel.includes(id)?s.lib.sel.filter(x=>x!==id):[...s.lib.sel,id]; return {lib:{...s.lib,sel}}; }); }

  /** Normaliza para buscar: minúsculas y sin tildes ni diacríticos. */
  _norm(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }

  toggleFav(id){
    const v = this.state.videos.find(x=>x.id===id);
    if(!v) return;
    this.setState(s=>({videos:s.videos.map(x=>x.id===id?{...x,favorite:!x.favorite}:x)}));
    this.api('/library/'+id, { method:'PATCH', body:{ isFavorite: !v.favorite } }).catch(()=>{
      this.setState(s=>({videos:s.videos.map(x=>x.id===id?{...x,favorite:v.favorite}:x)}));
    });
  }

  /** Añade la etiqueta escrita al video abierto en el detalle (PATCH /library/:id). */
  commitTag(){
    const id = this.state.detailId;
    const name = (this.state.tagInput||'').trim().toLowerCase();
    const v = id ? this.state.videos.find(x=>x.id===id) : null;
    if(!v || !name){ this.setState({tagAdding:false, tagInput:''}); return; }
    const cur = Array.isArray(v.tags) ? v.tags : [];
    if(cur.map(t=>String(t).toLowerCase()).includes(name)){ this.setState({tagAdding:false, tagInput:''}); return; }
    const tags = [...cur, name].slice(0,20);
    // optimista + persistencia (revierte y avisa si falla)
    this.setState(s=>({videos:s.videos.map(x=>x.id===id?{...x,tags}:x), tagAdding:false, tagInput:''}));
    this.api('/library/'+id, { method:'PATCH', body:{ tags } }).catch(e=>{
      this.setState(s=>({videos:s.videos.map(x=>x.id===id?{...x,tags:cur}:x)}));
      this.toast(e.message || 'No se pudo añadir la etiqueta');
    });
  }

  async restoreItem(id){
    try {
      await this.api('/library/'+id+'/restore', { method:'POST' });
      await this.loadLibrary();
      this.toast('Restaurado');
    } catch(e){ this.toast(e.message); }
  }

  async emptyTrash(){
    try {
      await this.api('/library/trash', { method:'DELETE' });
      await this.loadLibrary();
      this.toast('Papelera vacía');
    } catch(e){ this.toast(e.message); }
  }

  // ———————————————————————— perfil / ajustes ————————————————————————

  setProfile(k,v){ this.setState(s=>({profile:{...s.profile,[k]:v}, profileDirty:true})); }

  setPref(k,v){
    this.setState(s=>({prefs:{...s.prefs,[k]:v}}));
    const map = { language:'language', timezone:'timezone', quality:'quality', format:'format', filename:'filename', concurrency:'concurrency', autoTrash:'autoTrash' };
    if (map[k]) this.debounced('pref-'+k, ()=>this.api('/me/preferences',{method:'PATCH',body:{[map[k]]:v}}).then(()=>{ if(k!=='filename') this.toast('Preferencia guardada'); }).catch(e=>this.toast(e.message)));
  }

  toggleNotif(ev,ch){
    const turningOn = !this.state.notif[ev][ch];
    this.setState(s=>({notif:{...s.notif,[ev]:{...s.notif[ev],[ch]:!s.notif[ev][ch]}}}), async ()=>{
      // al ENCENDER un push, asegura permiso + suscripción; si se deniega, revierte
      if(ch==='push' && turningOn){
        const ok = await this.enablePush();
        if(!ok){ this.setState(s=>({notif:{...s.notif,[ev]:{...s.notif[ev],push:false}}})); return; }
      }
      // al APAGAR el último push, cancela la suscripción del navegador
      if(ch==='push' && !turningOn && !this._anyPushOn()){ await this.disablePush(); }
      this.debounced('notif', ()=>this.api('/me/preferences',{method:'PATCH',body:{notifications:this.state.notif}}).catch(()=>{}));
    });
  }

  async saveProfile(){
    const P = this.state.profile;
    try {
      const j = await this.api('/me', { method:'PATCH', body:{ displayName:P.name, username:P.username, bio:P.bio } });
      this.setState({ profileDirty:false, profile:{ ...P, name:j.user.name, username:j.user.username } });
      this.toast('Cambios guardados');
      if (P.email !== j.user.email) this.toast('El correo no se puede cambiar en esta versión');
    } catch(e){ this.toast(e.message); }
  }

  async changePassword(){
    const { pwCurrent, pwNew, pwConfirm } = this.state;
    if (pwNew.length < 8){ this.toast('La nueva contraseña necesita 8+ caracteres'); return; }
    if (pwNew !== pwConfirm){ this.toast('Las contraseñas no coinciden'); return; }
    try {
      await this.api('/me/password', { method:'POST', body:{ currentPassword:pwCurrent, newPassword:pwNew } });
      this.setState({ pwCurrent:'', pwNew:'', pwConfirm:'' });
      this.toast('Contraseña actualizada');
    } catch(e){ this.toast(e.message); }
  }

  // —— Recortador de avatar real (visor circular, arrastrar/zoom, guías) ——
  changePhoto(){
    let input = this._fileInput;
    if (!input){
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp';
      input.style.display = 'none';
      document.body.appendChild(input);
      this._fileInput = input;
      input.addEventListener('change', ()=>{
        const f = input.files && input.files[0];
        input.value = '';
        if (f) this.openCropper(f);
      });
    }
    input.click();
  }

  openCropper(file){
    if (this._cropUrl) URL.revokeObjectURL(this._cropUrl);
    const url = URL.createObjectURL(file);
    this._cropUrl = url;
    this._cropFile = file;
    this.setState({ modal:'crop', crop:{ url, w:0, h:0, zoom:1, panX:0, panY:0, guide:false, saving:false } });
    const img = new Image();
    img.onload = ()=> this.setState(s=>({ crop:{ ...s.crop, w:img.naturalWidth, h:img.naturalHeight } }));
    img.src = url;
  }

  cropGeom(){
    const C = 264; const c = this.state.crop;
    const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
    if (!c.w || !c.h) return { C, dispW:C, dispH:C, left:0, top:0 };
    const cover = Math.max(C/c.w, C/c.h);
    const scale = cover * c.zoom;
    const dispW = c.w*scale, dispH = c.h*scale;
    const halfX = (C-dispW)/2, halfY = (C-dispH)/2;
    const left = halfX + clamp(c.panX, halfX, -halfX);
    const top = halfY + clamp(c.panY, halfY, -halfY);
    return { C, dispW, dispH, left, top, halfX, halfY };
  }

  _cropTouchGuide(){
    this.setState(s=>({crop:{...s.crop,guide:true}}));
    clearTimeout(this._cropGuideT);
    this._cropGuideT = setTimeout(()=>this.setState(s=>({crop:{...s.crop,guide:false}})), 700);
  }
  cropDown(e){
    e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
    this._cropPtrs = [...(this._cropPtrs||[]), {id:e.pointerId,x:e.clientX,y:e.clientY}];
    if (this._cropPtrs.length===1){ this._cropLast={x:e.clientX,y:e.clientY}; }
    else if (this._cropPtrs.length===2){ this._pinchDist=Math.hypot(this._cropPtrs[0].x-this._cropPtrs[1].x,this._cropPtrs[0].y-this._cropPtrs[1].y); this._pinchZoom=this.state.crop.zoom; }
    this._cropTouchGuide();
  }
  cropMove(e){
    const ps=this._cropPtrs||[]; const i=ps.findIndex(p=>p.id===e.pointerId); if(i===-1) return;
    ps[i]={id:e.pointerId,x:e.clientX,y:e.clientY};
    const g=this.cropGeom(); const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    if (ps.length===1){
      const dx=e.clientX-this._cropLast.x, dy=e.clientY-this._cropLast.y;
      this._cropLast={x:e.clientX,y:e.clientY};
      this.setState(s=>({crop:{...s.crop, panX:clamp(s.crop.panX+dx,g.halfX,-g.halfX), panY:clamp(s.crop.panY+dy,g.halfY,-g.halfY)}}));
    } else if (ps.length===2 && this._pinchDist>0){
      const d=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);
      this.setState(s=>({crop:{...s.crop, zoom:clamp(this._pinchZoom*(d/this._pinchDist),1,3)}}));
    }
    this._cropTouchGuide();
  }
  cropUp(e){ this._cropPtrs=(this._cropPtrs||[]).filter(p=>p.id!==e.pointerId); if(this._cropPtrs[0]) this._cropLast={x:this._cropPtrs[0].x,y:this._cropPtrs[0].y}; }
  cropWheel(e){ e.preventDefault(); const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); this.setState(s=>({crop:{...s.crop, zoom:clamp(s.crop.zoom*(e.deltaY>0?0.94:1.06),1,3)}})); this._cropTouchGuide(); }
  cropCenter(){ this.setState(s=>({crop:{...s.crop, zoom:1, panX:0, panY:0}})); this._cropTouchGuide(); }
  closeCrop(){ this.setState({modal:null}); if(this._cropUrl){ URL.revokeObjectURL(this._cropUrl); this._cropUrl=null; } this._cropFile=null; }

  async applyCrop(){
    const c=this.state.crop; if (!c.w || c.saving) return;
    this.setState(s=>({crop:{...s.crop,saving:true}}));
    try {
      const g=this.cropGeom(); const OUT=512; const s=OUT/g.C;
      const img=new Image(); img.src=c.url; await img.decode().catch(()=>{});
      const canvas=document.createElement('canvas'); canvas.width=OUT; canvas.height=OUT;
      const ctx=canvas.getContext('2d'); if(!ctx) return;
      ctx.fillStyle='#0F0F0F'; ctx.fillRect(0,0,OUT,OUT);
      ctx.drawImage(img, g.left*s, g.top*s, g.dispW*s, g.dispH*s);
      const blob = await new Promise(res=>canvas.toBlob(res,'image/webp',0.92));
      const fd=new FormData(); fd.append('avatar', blob, 'avatar.webp');
      await this.apiUpload('/me/avatar', fd);
      this.setState(st=>({profile:{...st.profile,hasAvatar:true}}));
      this.toast('Foto actualizada');
      this.closeCrop();
    } catch(e){ this.toast(e.message||'No se pudo guardar'); this.setState(s=>({crop:{...s.crop,saving:false}})); }
  }

  async removePhoto(){
    try {
      await this.api('/me/avatar', { method:'DELETE' });
      this.setState(st=>({profile:{...st.profile,hasAvatar:false}}));
      this.toast('Foto eliminada');
    } catch(e){ this.toast(e.message); }
  }

  async toggle2fa(){
    if (!this.state.twofa){
      try {
        const j = await this.api('/auth/2fa/setup', { method:'POST' });
        const uri = j.otpauthUri || '';
        const m = /[?&]secret=([A-Z2-7]+)/i.exec(uri);
        this.setState({ modal:'twofa', twofaSecret: m?m[1]:uri, twofaCode:'' });
      } catch(e){ this.toast(e.message); }
    } else {
      this.setState({ modal:'twofa', twofaSecret:'', twofaCode:'' });
    }
  }

  async confirm2fa(){
    const code = this.state.twofaCode.trim();
    if (code.length < 6){ this.toast('Escribe el código de 6 dígitos de tu app'); return; }
    try {
      if (!this.state.twofa){
        const j = await this.api('/auth/2fa/enable', { method:'POST', body:{ code } });
        this.setState({ twofa:true, modal:null, twofaCode:'' });
        this.toast('2FA activado');
        if (j.recoveryCodes) window.alert('Guarda tus códigos de recuperación:\n\n' + j.recoveryCodes.join('\n'));
      } else {
        await this.api('/auth/2fa/disable', { method:'POST', body:{ code } });
        this.setState({ twofa:false, modal:null, twofaCode:'' });
        this.toast('2FA desactivado');
      }
    } catch(e){ this.toast(e.message); }
  }

  async exportData(fmt){
    try {
      const headers = this._token ? { Authorization:'Bearer '+this._token } : {};
      const res = await fetch(API + '/me/export?format=' + fmt, { headers, credentials:'include' });
      if (!res.ok) throw new Error('No se pudo exportar');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'grabber-export.' + fmt;
      a.click();
      URL.revokeObjectURL(a.href);
      this.toast('Exportando ' + fmt.toUpperCase());
    } catch(e){ this.toast(e.message); }
  }

  async confirmDelete(){
    try {
      await this.api('/me', { method:'DELETE', body:{ username: this.state.profile.username } });
      if (this._es) this._es.close();
      this._token = null;
      this.setState({ modal:null, authed:false, route:'home' });
      this.toast('Cuenta eliminada');
    } catch(e){ this.toast(e.message); }
  }

  settingsVals(){
    const s=this.state, P=s.profile, PR=s.prefs;
    const tabs=[['Perfil','profile'],['Preferencias','preferences'],['Seguridad','security'],['Plan','plan'],['Notificaciones y datos','notifications']]
      .map(([label,val])=>({label,val,active:s.setTab===val,color:s.setTab===val?'var(--text)':'var(--text-muted)',onClick:()=>this.setState({setTab:val})}));

    const initials = (P.name||'?').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
    const nameOk = P.username.length>=3;
    const themeSeg2=[['Claro','light'],['Oscuro','dark'],['Sistema','system']].map(([label,val])=>({label,onClick:()=>this.setTheme(val),color:s.theme===val?'#0F0F0F':'var(--text-muted)',bg:s.theme===val?'var(--accent)':'transparent'}));

    const qualitySeg=['2160p','1440p','1080p','720p','480p'].map(q=>({label:q,onClick:()=>this.setPref('quality',q),bg:PR.quality===q?'var(--accent)':'var(--surface-raised)',fg:PR.quality===q?'#0F0F0F':'var(--text)'}));
    const formatSeg=['MP4','MP3','M4A'].map(fo=>({label:fo,onClick:()=>this.setPref('format',fo),bg:PR.format===fo?'var(--accent)':'var(--surface-raised)',fg:PR.format===fo?'#0F0F0F':'var(--text)'}));
    const filenamePreview = PR.filename.replace('{titulo}','como-funciona-la-compresion').replace('{calidad}',PR.quality).replace('{plataforma}','youtube').replace('{fecha}',new Date().toISOString().slice(0,10)) + (PR.format==='MP4'?'.mp4':PR.format==='MP3'?'.mp3':'.m4a');

    const notifRows=[
      {key:'done',label:'Descarga completada'},
      {key:'error',label:'Error de descarga'},
      {key:'features',label:'Nuevas funciones'},
      {key:'weekly',label:'Resumen semanal'},
      {key:'billing',label:'Facturación y recibos'},
    ].map(r=>({ label:r.label, chans:['email','push','app'].map(ch=>({ on:s.notif[r.key][ch], trackBg:s.notif[r.key][ch]?'var(--accent)':'var(--surface-pressed)', thumbX:s.notif[r.key][ch]?'18px':'2px', thumbBg:s.notif[r.key][ch]?'#0F0F0F':'var(--text-muted)', onToggle:()=>this.toggleNotif(r.key,ch) })) }));

    const sessions=s.sessions.map(x=>({...x, revokable:!x.current, onRevoke:async ()=>{ try{ await this.api('/auth/sessions/'+x.id,{method:'DELETE'}); this.setState(st=>({sessions:st.sessions.filter(y=>y.id!==x.id)})); this.toast('Sesión cerrada'); }catch(e){ this.toast(e.message); } }}));

    const planName = s.plan;
    const plans=[
      {id:'free',name:'Free',price:'$0',feats:['3 descargas al día','720p máximo','Sin biblioteca']},
      {id:'pro',name:'Pro',price:'$30.000',feats:['Ilimitado','Hasta 4K','200 GB de biblioteca','Colecciones']},
      {id:'studio',name:'Studio',price:'$60.000',feats:['Todo de Pro','1 TB de biblioteca','Descargas en lote','API']},
    ].map(p=>({...p, current:p.name===planName,
      cta:p.name===planName?'Tu plan':(p.id==='free'?'Cambiar a Free':(s.checkingOut?'Redirigiendo…':'Suscribirme')),
      onCta: p.name===planName ? (()=>{}) : (()=>this.startCheckout(p.id)),
      bg:p.name===planName?'var(--surface-raised)':'var(--surface)',
      ctaBg:p.name===planName?'var(--surface-pressed)':'var(--accent)',
      ctaFg:p.name===planName?'var(--text-muted)':'#0F0F0F'}));

    // Suscripción (tarjeta de estado + cancelar renovación)
    const sub = s.sub;
    const isPaid = planName==='Pro' || planName==='Studio';
    const subActive = !!(sub && sub.active);
    const subUntil = subActive ? this._subDateLabel(sub.planUntil) : '';
    const subAmount = planName==='Studio' ? '$60.000' : planName==='Pro' ? '$30.000' : '';
    const subTitle = isPaid ? ('Suscripción '+ ((sub&&sub.planLabel)||planName)) : 'Sin suscripción activa';
    let subDetail;
    if (!isPaid) subDetail = 'Estás en el plan Free. Elige Pro o Studio para desbloquear todo.';
    else if (subActive && sub.autoRenew) subDetail = 'Se renueva el '+subUntil+' · '+subAmount+'/mes';
    else if (subActive && !sub.autoRenew) subDetail = 'Activo hasta el '+subUntil+' · no se renovará';
    else subDetail = 'Tu plan '+planName+' está activo.';
    const subCanCancel = subActive && !!sub.autoRenew;

    // almacenamiento por tipo (más categorías, derivado de la biblioteca real)
    const gb = (mb)=> mb>=1024 ? (Math.round(mb/1024*10)/10)+' GB' : Math.round(mb)+' MB';
    const bucket = (q)=> q==='2160p'?'4K' : (q==='1080p'||q==='1440p')?'Full HD' : q==='Audio'?'Audio' : 'HD/SD';
    const cats = { '4K':0, 'Full HD':0, 'HD/SD':0, 'Audio':0 };
    for (const v of s.videos) cats[bucket(v.quality)] += (v.sizeB||0);
    const totalB = Object.values(cats).reduce((a,b)=>a+b,0) || 1;
    // tonos de la app (rosa acento → neutros), no arcoíris
    const CATDEF = [
      { label:'4K',      color:'var(--accent)' },
      { label:'Full HD', color:'var(--accent-hover)' },
      { label:'HD/SD',   color:'var(--accent-pressed)' },
      { label:'Audio',   color:'var(--text-faint)' },
    ];
    const hasData = totalB > 1;
    const storageBars = [
      // barra de total arriba: resumen de todo el almacenamiento usado, destacada
      { label:'Total', color:'var(--accent)', value: gb(hasData?totalB:0), pct: hasData?'100%':'0%',
        labelColor:'var(--text)', labelWeight:'700', barH:'10px' },
      ...CATDEF.map(c => ({
        label:c.label, color:c.color,
        value: gb(cats[c.label]),
        pct: Math.round(cats[c.label]/totalB*100)+'%',
        labelColor:'var(--text-muted)', labelWeight:'500', barH:'8px',
      })),
    ];
    // encabezado de almacenamiento: arregla el "— / 0 GB" del plan Free
    const limitGbP = s.plan==='Studio'?1024 : s.plan==='Pro'?200 : 0;
    const usedLabel = totalB>1 ? gb(totalB) : '0 MB';
    const storageHeaderVal = limitGbP>0 ? (usedLabel+' / '+limitGbP+' GB') : (usedLabel+' usados');

    return {
      setTabs:tabs,
      setIsProfile:s.setTab==='profile', setIsPrefs:s.setTab==='preferences', setIsSecurity:s.setTab==='security',
      setIsPlan:s.setTab==='plan', setIsNotif:s.setTab==='notifications', setIsData:s.setTab==='data',
      P, profileInitials:initials, profileHasAvatar:P.hasAvatar,
      avatarUrl: P.hasAvatar ? ('/api/v1/me/avatar?v='+(this._avatarV||0)) : '',
      profilePlan: s.plan, profileMemberSince: s.stats.since, profileEmail: P.email,
      profileStats:[
        {label:'Descargas totales', value:s.stats.downloads},
        {label:'Almacenamiento', value:s.stats.storage, sub:s.stats.storageSub},
        {label:'Colecciones', value:s.stats.collections},
        {label:'Miembro desde', value:s.stats.since},
      ],
      storageBars,
      storageHeader: storageHeaderVal,
      planUsage:[
        {label:'Descargas este mes', value:s.usage.downloads, sub:s.usage.downloadsSub},
        {label:'Ancho de banda', value:s.usage.bandwidth, sub:'este ciclo'},
        {label:'Renueva', value:s.usage.renews, sub:String(new Date().getFullYear())},
      ],
      addons:[
        {name:'Almacenamiento extra', desc:'+500 GB de biblioteca', price:'$12.000/mes'},
        {name:'Descargas en lote', desc:'Cola ilimitada y prioridad', price:'$10.000/mes'},
      ],
      subTitle, subDetail, subCanCancel, cancelRenewal:()=>this.cancelRenewal(),
      setPName:(e)=>this.setProfile('name',e.target.value),
      setPUser:(e)=>this.setProfile('username',e.target.value),
      setPEmail:(e)=>this.setProfile('email',e.target.value),
      setPBio:(e)=>this.setProfile('bio',e.target.value),
      usernameStatus: nameOk?'Disponible':'Muy corto', usernameColor: nameOk?'var(--success)':'var(--warning)',
      changePhoto:()=>this.changePhoto(),
      removePhoto:()=>this.removePhoto(),
      profileDirty:s.profileDirty,
      saveProfile:()=>this.saveProfile(),
      discardProfile:()=>{ this.setState({profileDirty:false}); void this.loadMe(); },
      PR, themeSeg2, qualitySeg, formatSeg, filenamePreview,
      setLang:(e)=>this.setPref('language',e.target.value),
      setTz:(e)=>this.setPref('timezone',e.target.value),
      setFilename:(e)=>this.setPref('filename',e.target.value),
      setConc:(e)=>this.setPref('concurrency',e.target.value),
      setAutoTrash:(e)=>this.setPref('autoTrash',e.target.value),
      notifRows, sessions, plans, invoices:s.invoices, invoicesEmpty: s.invoices.length===0,
      pwCurrent:s.pwCurrent, pwNew:s.pwNew, pwConfirm:s.pwConfirm,
      setPwCurrent:(e)=>this.setState({pwCurrent:e.target.value}),
      setPwNew:(e)=>this.setState({pwNew:e.target.value}),
      setPwConfirm:(e)=>this.setState({pwConfirm:e.target.value}),
      pwMatchMsg: (s.pwConfirm && s.pwNew!==s.pwConfirm) ? 'No coinciden' : (s.pwConfirm && s.pwNew===s.pwConfirm ? 'Coinciden' : ''),
      pwMatchColor: (s.pwConfirm && s.pwNew!==s.pwConfirm) ? 'var(--warning)' : 'var(--success)',
      changePassword:()=>this.changePassword(),
      twofa:s.twofa, twofaTrackBg:s.twofa?'var(--accent)':'var(--surface-pressed)', twofaThumbX:s.twofa?'18px':'2px', twofaThumbBg:s.twofa?'#0F0F0F':'var(--text-muted)',
      toggle2fa:()=>this.toggle2fa(),
      twofaSecret:s.twofaSecret, twofaCode:s.twofaCode,
      setTwofaCode:(e)=>this.setState({twofaCode:e.target.value.replace(/[^0-9a-f]/gi,'').slice(0,10)}),
      openDelete:()=>this.setState({modal:'delete',deleteConfirm:''}),
      exportData:(fmt)=>this.exportData(typeof fmt==='string'?fmt:'json'),
      exportCsv:()=>this.exportData('csv'),
      exportJson:()=>this.exportData('json'),
      modal:s.modal, closeModal:()=>this.setState({modal:null}),
      modalIsCrop:s.modal==='crop', modalIsTwofa:s.modal==='twofa', modalIsDelete:s.modal==='delete',
      confirm2fa:()=>this.confirm2fa(),
      deleteConfirm:s.deleteConfirm, setDeleteConfirm:(e)=>this.setState({deleteConfirm:e.target.value}),
      deleteEnabled:s.deleteConfirm===s.profile.name,
      deleteBtnBg:s.deleteConfirm===s.profile.name?'var(--warning)':'var(--surface-pressed)',
      deleteBtnFg:s.deleteConfirm===s.profile.name?'#0F0F0F':'var(--text-faint)',
      confirmDelete:()=>{ if(s.deleteConfirm===s.profile.name) void this.confirmDelete(); },
      applyCrop:()=>this.applyCrop(),
      // recortador real
      cropUrl:s.crop.url, cropSaving:s.crop.saving, cropGuideOpacity:s.crop.guide?'1':'0',
      cropDiam:(this.cropGeom().C)+'px',
      cropImgW:Math.round(this.cropGeom().dispW)+'px', cropImgH:Math.round(this.cropGeom().dispH)+'px',
      cropImgLeft:Math.round(this.cropGeom().left)+'px', cropImgTop:Math.round(this.cropGeom().top)+'px',
      cropReset:(s.crop.zoom!==1||s.crop.panX!==0||s.crop.panY!==0),
      cropDown:(e)=>this.cropDown(e), cropMove:(e)=>this.cropMove(e), cropUp:(e)=>this.cropUp(e),
      cropWheel:(e)=>this.cropWheel(e), cropCenter:()=>this.cropCenter(), closeCrop:()=>this.closeCrop(),
      cropSaveLabel: s.crop.saving?'Guardando…':'Usar foto',
      iconCamera:IC.camera(), iconShield:IC.shield(), iconMonitorSm:IC.monitorSm(),
      iconLocate:svgEls([React.createElement('circle',{key:0,cx:12,cy:12,r:3}),React.createElement('path',{key:1,d:'M12 2v3M12 19v3M2 12h3M19 12h3'})]),
      stop:(e)=>{ e && e.stopPropagation && e.stopPropagation(); },
      qrCells: Array.from({length:49},(_,i)=>{ const pat=[0,1,2,7,8,9,14,15,16,4,5,6,11,12,13,42,43,44,45,46,47,48,21,23,25,28,30,33,35,38,17,19,3,10,24,31,40]; return pat.includes(i)?'#0A0A0A':'transparent'; }),
    };
  }

  // ———————————————————————— home (invitado) ————————————————————————

  setHome(patch){ this.setState(s=>({home:{...s.home, ...patch}})); }

  async analyzeHome(){
    const H=this.state.home; const url=H.url.trim();
    if(!url){ this.setHome({result:null}); return; }
    this.setHome({analyzing:true,result:null,job:null,jobDone:false});
    try {
      const j = await this.api('/media/analyze', { method:'POST', body:{ url } });
      const m = j.media;
      this.setHome({analyzing:false, result:{ title:m.title, author:m.author, duration:m.duration, platform:m.platform, views:m.views, mediaSourceId:m.mediaSourceId, thumb:m.thumbnailUrl }});
    } catch(e){
      this.setHome({analyzing:false, result:null});
      this.toast(e.message || 'No se pudo analizar el enlace');
    }
  }

  async homeDownload(){
    const H = this.state.home;
    if (!H.result || H.guestLeft<=0 || H.job) return;
    try {
      const j = await this.api('/downloads', { method:'POST', body:{ mediaSourceId:H.result.mediaSourceId, quality:'1080p' } });
      const left = j.guestLeft != null ? j.guestLeft : H.guestLeft-1;
      this.setHome({ guestLeft:left, job:j.job, jobDone:false });
      this.toast('Descarga iniciada · quedan '+left);
      this.pollGuestJob(j.job.id);
    } catch(e){
      if (e.code==='QUOTA_EXCEEDED') this.setHome({guestLeft:0});
      this.toast(e.message);
    }
  }

  pollGuestJob(jobId){
    if (this._guestPoll) clearInterval(this._guestPoll);
    this._guestPoll = setInterval(async ()=>{
      try {
        const j = await this.api('/downloads/'+jobId);
        this.setHome({ job:j.job });
        if (j.job.status==='done'){
          clearInterval(this._guestPoll); this._guestPoll=null;
          if (!this.state.home.jobDone){
            this.setHome({ jobDone:true });
            this.toast('Tu archivo está listo, se descarga al navegador');
            window.location.href = API+'/downloads/'+jobId+'/file';
          }
        } else if (j.job.status==='error'){
          clearInterval(this._guestPoll); this._guestPoll=null;
        }
      } catch(e){
        clearInterval(this._guestPoll); this._guestPoll=null;
        this.setHome({ job:null });
      }
    }, 1500);
  }

  async cancelGuestJob(){
    const job = this.state.home.job;
    if (!job) return;
    if (this._guestPoll){ clearInterval(this._guestPoll); this._guestPoll=null; }
    try { await this.api('/downloads/'+job.id, { method:'DELETE' }); } catch(e){ /* igual se limpia */ }
    this.setHome({ job:null, jobDone:false });
    // recuperar el cupo reembolsado por el backend
    try { const q = await this.api('/downloads/guest-quota'); if(!q.unlimited) this.setHome({ guestLeft:q.guestLeft }); } catch(e){ /* opcional */ }
    this.toast('Descarga cancelada');
  }

  // —— páginas públicas (términos, privacidad, estado, contacto) ——

  openPage(key){
    // recordar de dónde venimos para que "Volver" no pierda el estado (p. ej. el
    // formulario de registro). Solo si no estábamos ya en una página.
    const origin = this.state.route==='page' ? this.state.pageOrigin : this.state.route;
    this.setState({ route:'page', page:key, statusData:null, pageOrigin:origin });
    window.scrollTo(0,0);
    if (key==='status'){
      void this.api('/status').then(d=>this.setState({statusData:d})).catch(()=>this.setState({statusData:{api:false,db:false,extractor:false,queue:{active:0,queued:0}}}));
    }
  }

  async sendContact(){
    const { cEmail, cMsg } = this.state;
    if (!/.+@.+\..+/.test(cEmail)){ this.toast('Escribe un correo válido'); return; }
    if (cMsg.trim().length < 5){ this.toast('Cuéntanos un poco más en el mensaje'); return; }
    try {
      await this.api('/contact', { method:'POST', body:{ email:cEmail.trim(), message:cMsg.trim() } });
      this.setState({ cMsg:'' });
      this.toast('Mensaje enviado, gracias');
    } catch(e){ this.toast(e.message); }
  }

  homeVals(){
    const s=this.state, H=s.home;
    const det=this.detectPlatform(H.url);
    const platformStripH=PLATFORMS.map(p=>({label:p,opacity:!det?0.55:(det===p?1:0.25),color:det===p?'var(--text)':'var(--text-muted)'}));
    const steps=[
      {n:'01',title:'Pega el enlace',desc:'De YouTube, Instagram, TikTok, X, Facebook o Reddit.'},
      {n:'02',title:'Elige calidad',desc:'Desde 4K hasta solo audio. Ves el peso antes de bajar.'},
      {n:'03',title:'Guárdalo',desc:'En tu biblioteca, con colecciones, etiquetas y notas.'},
    ];
    const formats=[
      {q:'2160p',d:'4K · MP4'},{q:'1440p',d:'2K · MP4'},{q:'1080p',d:'Full HD · MP4'},
      {q:'720p',d:'HD · MP4'},{q:'MP3',d:'Audio'},{q:'M4A',d:'Audio'},
    ];
    const plansH=[
      {name:'Free',price:'$0',feats:['3 descargas al día','720p máximo','Sin biblioteca'],cta:'Empezar',hi:false},
      {name:'Pro',price:'$30.000',feats:['Descargas ilimitadas','Hasta 4K','200 GB de biblioteca','Colecciones y etiquetas'],cta:'Elegir Pro',hi:true},
      {name:'Studio',price:'$60.000',feats:['Todo de Pro','1 TB de biblioteca','Modo lote','Acceso a la API'],cta:'Elegir Studio',hi:false},
    ].map(p=>({...p, bg:p.hi?'var(--surface-raised)':'var(--surface)', ctaBg:p.hi?'var(--accent)':'var(--surface-raised)', ctaFg:p.hi?'#0F0F0F':'var(--text)'}));
    const faqs=[
      {q:'¿Necesito una cuenta para descargar?',a:'No para probar. Los invitados tienen tres descargas; con una cuenta son ilimitadas y se guardan en tu biblioteca.'},
      {q:'¿Qué plataformas admite?',a:'YouTube, Instagram, TikTok, X, Facebook y Reddit. Pega el enlace y detectamos la fuente.'},
      {q:'¿Puedo bajar solo el audio?',a:'Sí. Elige MP3 o M4A en el selector de calidad y descargamos únicamente la pista de audio.'},
      {q:'¿Dónde se guardan mis descargas?',a:'En tu biblioteca personal, organizadas por colecciones, con notas y etiquetas propias.'},
    ].map((f,i)=>{
      const open = H.faqOpen.includes(i);
      return {...f, open, chevron: open?IC.chevronDown():IC.chevronRight(),
        onClick:()=>this.setHome({faqOpen: open ? H.faqOpen.filter(x=>x!==i) : [...H.faqOpen, i]})};
    });

    // progreso del job de invitado
    const job = H.job;
    const jobStatusLabel = job
      ? job.status==='queued' ? 'En cola'
      : job.status==='downloading' ? ('Descargando' + (job.speed && job.speed!=='—' ? ' · '+job.speed : ''))
      : job.status==='done' ? 'Completado, guardado en tu navegador'
      : job.status==='error' ? (job.errorMessage || 'La descarga falló')
      : 'Preparando'
      : '';

    // páginas públicas
    const doc = PAGE_DOCS[this.state.page] || PAGE_DOCS.terms;
    const sd = this.state.statusData;
    // sistemas en la identidad rosa de la app: activo = acento, inactivo = gris
    const dot = (ok)=> ok ? 'var(--accent)' : 'var(--text-faint)';
    const statusRows = [
      { name:'API', icon:IC.monitorSm(), dot: sd ? dot(sd.api) : 'var(--text-faint)', value: sd ? (sd.api?'Operativa':'Sin respuesta') : '···', ok: sd?sd.api:false },
      { name:'Base de datos', icon:IC.folder(), dot: sd ? dot(sd.db) : 'var(--text-faint)', value: sd ? (sd.db?'Conectada':'Sin conexión') : '···', ok: sd?sd.db:false },
      { name:'Extractor', icon:IC.download(), dot: sd ? dot(sd.extractor) : 'var(--text-faint)', value: sd ? (sd.extractor?'Disponible':'No encontrado') : '···', ok: sd?sd.extractor:false },
      { name:'Cola', icon:IC.clip(), dot: sd ? 'var(--accent)' : 'var(--text-faint)', value: sd ? (sd.queue.active+' activas') : '···', ok:true },
    ];
    const allOk = !!sd && sd.api && sd.db && sd.extractor;
    const statusHeadline = !sd ? 'Comprobando el sistema…' : allOk ? 'Todos los sistemas operativos' : 'Hay un componente con incidencias';
    const statusSub = !sd ? 'Un momento.' : allOk ? 'Grabber funciona con normalidad en tu equipo.' : 'Revisa el detalle abajo; el servicio sigue en pie.';

    return {
      homeUrl:H.url, setHomeUrl:(e)=>this.setHome({url:e.target.value}),
      analyzeHome:()=>this.analyzeHome(), homeAnalyzing:H.analyzing, homeResult:H.result,
      platformStripH, homeSteps:steps, homeFormats:formats, plansH, faqs,
      guestLeft:H.guestLeft, guestWall:H.result && H.guestLeft<=0 && !job,
      homeCanDownload:H.result && H.guestLeft>0 && !job,
      homeDownload:()=>this.homeDownload(),
      guestLabel: H.guestLeft>0 ? ('Te quedan '+H.guestLeft+' descargas de invitado') : 'Sin descargas de invitado',
      // progreso + cancelar del invitado
      homeJob: job,
      homeJobLabel: jobStatusLabel,
      homeJobPct: job ? Math.round(job.pct)+'%' : '0%',
      homeJobBarW: job ? Math.max(2, Math.round(job.pct))+'%' : '0%',
      homeJobBarColor: job && job.status==='error' ? 'var(--warning)' : 'var(--accent)',
      homeJobDone: !!job && job.status==='done',
      homeJobCancelable: !!job && (job.status==='queued'||job.status==='downloading'),
      homeJobCancel:()=>this.cancelGuestJob(),
      homeJobClear:()=>this.setHome({job:null, jobDone:false}),
      // páginas
      isPage: this.state.route==='page',
      pageTitle: doc.title, pageSubtitle: doc.subtitle,
      pageKicker: doc.kicker,
      pageSections: doc.sections.map((s,i)=>({...s, n:String(i+1).padStart(2,'0')})),
      pageIndex: doc.sections.map((s,i)=>({h:s.h, n:String(i+1).padStart(2,'0')})),
      pageIsDoc: this.state.page==='terms'||this.state.page==='privacy'||this.state.page==='help',
      pageIsStatus: this.state.page==='status',
      pageIsContact: this.state.page==='contact',
      statusRows, statusHeadline, statusSub, statusAllOk: allOk,
      statusDot: !sd ? 'var(--text-faint)' : allOk ? 'var(--accent)' : 'var(--text-faint)',
      pageBack:()=>{
        const o = this.state.pageOrigin;
        // volver exactamente a donde estabas (registro/login conservan su formulario,
        // porque openPage no toca s.f). Si no hay origen claro, al inicio o a la app.
        if (o && o!=='page') this.go(o);
        else if (this.state.authed) this.go('download');
        else this.go('home');
      },
      pageBackLabel: (this.state.pageOrigin==='signup'||this.state.pageOrigin==='login') ? 'Volver al registro'
        : this.state.authed ? 'Volver a la app' : 'Volver al inicio',
      socials: SOCIALS.map(s=>({...s, icon:socialIcon(s.name)})),
      contactSocials: CONTACT_SOCIALS.map(s=>({...s, icon:socialIcon(s.name)})),
      openHelp:()=>this.openPage('help'),
      openTerms:()=>this.openPage('terms'), openPrivacy:()=>this.openPage('privacy'),
      openStatus:()=>this.openPage('status'), openContact:()=>this.openPage('contact'),
      cEmail:this.state.cEmail, setCEmail:(e)=>this.setState({cEmail:e.target.value}),
      cMsg:this.state.cMsg, setCMsg:(e)=>this.setState({cMsg:e.target.value}),
      sendContact:()=>this.sendContact(),
    };
  }

  // ———————————————————————— renderVals ————————————————————————

  renderVals(){
    const s=this.state, f=s.f;
    const authed=s.authed;
    const user={ name:s.profile.name||'—', plan:s.plan, initials:(s.profile.name||'?').split(' ').map(w=>w[0]).filter(Boolean).slice(0,2).join('').toUpperCase(), usageLabel:s.usage.label, usagePct:s.usage.pct };

    const pl=f.pass.length;
    const score = pl===0?0: pl<6?1: pl<9?2: (/[0-9]/.test(f.pass)&&/[A-Z]/.test(f.pass))?4: 3;
    // 4 niveles con 4 colores distintos: rojo → ámbar → lima → verde
    const LEVELCOL = ['var(--surface-pressed)','#F0483E','var(--warning)','#8FD14F','var(--success)'];
    const seg=(n)=> n<=score ? LEVELCOL[score] : 'var(--surface-pressed)';
    const pw={ s1:seg(1),s2:seg(2),s3:seg(3),s4:seg(4), label:['—','Débil','Regular','Buena','Fuerte'][score], color: LEVELCOL[score] };

    const pwReqs=[
      {label:'Al menos 8 caracteres', ok:pl>=8},
      {label:'Una mayúscula', ok:/[A-Z]/.test(f.pass)},
      {label:'Un número', ok:/[0-9]/.test(f.pass)},
      {label:'Un símbolo', ok:/[^A-Za-z0-9]/.test(f.pass)},
    ].map(r=>({label:r.label, color:r.ok?'var(--success)':'var(--text-faint)', icon: r.ok?IC.check():svg(['M12 8v8M8 12h8'],18)}));

    const vc = s.verifyCode;
    const codeCells=[0,1,2,3,4,5].map((i)=>({v: vc[i]||'', bg: i===vc.length?'var(--surface-pressed)':'var(--surface)'}));

    const decoRows=[
      {w1:'70%',pct:'100%',pctLabel:'100%',code:'YT',barColor:'var(--surface-pressed)',anim:''},
      {w1:'52%',pct:'64%',pctLabel:'64%',code:'IG',barColor:'var(--accent)',anim:'animation:gr-load 3.4s ease-in-out infinite;'},
      {w1:'80%',pct:'28%',pctLabel:'28%',code:'TT',barColor:'var(--surface-pressed)',anim:''},
    ];

    const mk=(label,route,badge)=>({label,badge:badge||null,active:s.route===route, color:s.route===route?'var(--text)':'var(--text-muted)', onClick:()=>this.go(route)});
    const activeQ=s.queue.filter(q=>q.status==='downloading'||q.status==='queued'||q.status==='paused').length;
    const topTabs=[ mk('Descargar','download'), mk('Cola','queue', activeQ||null), mk('Biblioteca','library') ];

    const themeSeg=[['Claro','light'],['Oscuro','dark'],['Sistema','system']].map(([label,val])=>({label, onClick:()=>this.setTheme(val), color:s.theme===val?'#0F0F0F':'var(--text-muted)', bg:s.theme===val?'var(--accent)':'transparent'}));

    const det=this.detectPlatform(s.url);
    const platformStrip=PLATFORMS.map(p=>({label:p, opacity: !det?1: (det===p?1:0.32), color: det===p?'var(--text)':'var(--text-muted)'}));

    const sizes=this.qualitySizes();
    const mkOpt=(id)=>({label:id.replace('Audio ',''), size:sizes[id], onSelect:()=>this.setState({quality:id}), bg:s.quality===id?'var(--accent)':'var(--surface-raised)', fg:s.quality===id?'#0F0F0F':'var(--text)'});
    const qualityVideo=['2160p','1440p','1080p','720p','480p','360p'].map(mkOpt);
    const qualityAudio=['Audio MP3','Audio M4A'].map(id=>({...mkOpt(id), label: id}));

    const dc=s.dlOpts;
    const mkChk=(key,label)=>({label, bg:dc[key]?'var(--accent)':'var(--surface-raised)', check:dc[key]?IC.check():null, onToggle:()=>this.setState(st=>({dlOpts:{...st.dlOpts,[key]:!st.dlOpts[key]}}))});
    const dlChecks=[mkChk('subs','Subtítulos'),mkChk('thumb','Miniatura'),mkChk('collection','Guardar en colección')];

    const fmtEta=(x)=> x<=0?'—': x<60?Math.round(x)+'s':Math.floor(x/60)+'m '+Math.round(x%60)+'s';

    // progreso en vivo del media analizado, en el propio panel de descarga
    const curMsId = s.result && s.result.mediaSourceId;
    const activeJob = curMsId ? s.queue.find(j=>j.mediaSourceId===curMsId && (j.status==='downloading'||j.status==='queued'||j.status==='analyzing')) : null;
    const justDone = curMsId ? s.queue.find(j=>j.mediaSourceId===curMsId && j.status==='done') : null;
    const failedJob = curMsId ? s.queue.find(j=>j.mediaSourceId===curMsId && j.status==='error') : null;
    const aPct = activeJob ? Math.max(0, Math.min(100, Math.round(activeJob.pct))) : 0;
    const aStatus = activeJob ? (activeJob.status==='downloading'?'Descargando' : activeJob.status==='analyzing'?'Analizando' : 'En cola') : '';
    const aInfo = activeJob
      ? (activeJob.status==='downloading' ? (aPct+'% · '+activeJob.speed+' · '+fmtEta(activeJob.etaS)+' restante') : aPct+'%')
      : '';
    const statusMap={downloading:'Descargando',queued:'En cola',paused:'En pausa',analyzing:'Analizando',error:'Error',done:'Completado'};
    const mkRow=(q)=>({
      ...q, pctLabel: Math.round(q.pct)+'%', eta: q.status==='error'?'—':fmtEta(q.etaS),
      statusLabel: q.status==='error' ? (q.errorMessage||'Error') : statusMap[q.status],
      barColor: q.status==='error'?'var(--warning)': q.status==='paused'?'var(--text-faint)':'var(--accent)',
      toggleIcon: q.status==='paused'||q.status==='error'?IC.play():IC.pause(),
      onToggle:()=>this.jobToggle(q),
      onCancel:()=>this.jobCancel(q.id),
    });
    const cf=s.colaF;
    const active=s.queue.filter(q=>q.status!=='done');
    const done=s.queue.filter(q=>q.status==='done');
    const activeRows=active.map(mkRow);
    const doneRows=done.map(q=>({...q}));
    // opciones de "Simultáneas" como píldoras dentro del panel de la cola
    const colaConcOptions=['1','2','3','5'].map(v=>({label:v, pillBg:String(s.concurrency)===v?'var(--accent)':'var(--surface)', pillColor:String(s.concurrency)===v?'#0F0F0F':'var(--text-muted)', onClick:()=>{ this.setState({concurrency:v}); this.setPref('concurrency', v); }}));

    const dd = {
      conc: this.mkDD('conc', s.concurrency, ['1','2','3','5'], v=>{ this.setState({concurrency:v}); this.setPref('concurrency', v); }),
      sort: this.mkDD('sort', s.lib.sort, [{value:'recent',label:'Recientes'},{value:'title',label:'Título'},{value:'size',label:'Tamaño'}], v=>this.setLib({sort:v})),
      lang: this.mkDD('lang', s.prefs.language, ['Español','English','Português'], v=>this.setPref('language',v)),
      tz: this.mkDD('tz', s.prefs.timezone, ['GMT−6 · Ciudad de México','GMT−5 · Bogotá','GMT−3 · Buenos Aires','GMT+1 · Madrid'], v=>this.setPref('timezone',v)),
      prefConc: this.mkDD('prefConc', s.prefs.concurrency, ['1','2','3','5'], v=>this.setPref('concurrency',v)),
      trash: this.mkDD('trash', s.prefs.autoTrash, ['7 días','30 días','90 días','Nunca'], v=>this.setPref('autoTrash',v)),
    };

    const notifDot = (t)=> t==='download_completed'?'var(--success)': t==='download_failed'||t==='library_file_missing'?'var(--warning)':'var(--text-faint)';

    return {
      ...this.libVals(),
      ...this.settingsVals(),
      ...this.homeVals(),
      authed, booting:s.booting, notAuthed: !authed && !s.booting,
      notAuthedNoPage: !authed && !s.booting && s.route!=='page',
      authedNoPage: authed && !s.booting && s.route!=='page',
      isLogin:s.route==='login', isSignup:s.route==='signup', isVerify:s.route==='verify',
      isForgot:s.route==='forgot', isReset:s.route==='reset', isHome:s.route==='home',
      isDownload:s.route==='download', isQueue:s.route==='queue', isLibrary:s.route==='library', isSettings:s.route==='settings',
      dd, ddOpen:!!s.openDropdown, closeDropdown:()=>this.setState({openDropdown:null}),
      dlIdle: !s.result && !s.analyzing,
      dlJustify: (s.result||s.analyzing) ? 'flex-start' : 'center',
      dlSteps:[
        {icon:IC.link(), title:'Pega el enlace', desc:'Copia la URL desde la app o el navegador y pégala arriba.'},
        {icon:IC.grid(), title:'Elige calidad', desc:'Desde 4K hasta solo audio. Ves el peso antes de bajar.'},
        {icon:IC.download(), title:'Guárdalo', desc:'Va a tu cola y luego a la biblioteca, con notas y etiquetas.'},
      ],
      dlRecent: s.videos.slice(0,4).map(v=>({title:v.title, plat:v.platform, duration:v.duration, meta:v.format+' · '+v.size, thumbnailUrl:v.thumbnailUrl||null})),
      user,
      cycleTheme:()=>this.cycleTheme(),
      brandMark18: brandMark(18), brandMark20: brandMark(20), brandMark22: brandMark(22), brandMark26: brandMark(26),
      brandMark28: brandMark(28), brandMark32: brandMark(32), brandMark36: brandMark(36), brandMark40: brandMark(40),
      brandMark120: brandMark(120), brandMark140: brandMark(140),
      f,
      setEmail:(e)=>this.setState({f:{...f,email:e.target.value}}),
      setPass:(e)=>this.setState({f:{...f,pass:e.target.value}}),
      setName:(e)=>this.setState({f:{...f,name:e.target.value}}),
      passType:s.showPass?'text':'password',
      eyeIcon: s.showPass?IC.eyeOff():IC.eye(),
      togglePass:()=>this.setState({showPass:!s.showPass}),
      remember:s.remember, rememberBg:s.remember?'var(--accent)':'var(--surface-pressed)', rememberCheck:s.remember?IC.check():null, toggleRemember:()=>this.setState({remember:!s.remember}),
      terms:s.terms, termsBg:s.terms?'var(--accent)':'var(--surface-pressed)', termsCheck:s.terms?IC.check():null, toggleTerms:()=>this.setState({terms:!s.terms}),
      privacyBg:s.privacyAcc?'var(--accent)':'var(--surface-pressed)', privacyCheck:s.privacyAcc?IC.check():null, togglePrivacy:()=>this.setState({privacyAcc:!s.privacyAcc}),
      pw, pwReqs, codeCells, resendIn:s.resendIn, decoRows,
      doLogin:()=>this.doLogin(),
      doSignup:()=>this.doSignup(),
      doVerify:()=>this.doVerify(),
      doForgot:()=>this.doForgot(),
      doReset:()=>this.doReset(),
      googleStub:()=>{ window.location.href = '/auth/google'; },
      doLogout:()=>this.doLogout(),
      canInstall:s.canInstall, installApp:()=>this.installApp(), iconInstall:IC.download(),
      nav:{ login:()=>this.go('login'), signup:()=>this.go('signup'), verify:()=>this.go('verify'), forgot:()=>this.go('forgot'), reset:()=>this.go('reset'), home:()=>this.go('home'), download:()=>this.go('download'), queue:()=>this.go('queue'), library:()=>this.go('library'), settings:()=>this.go('settings') },
      topTabs,
      // OJO: el binding {{ q.global }} del input de la barra NO resolvía porque
      // renderVals no devolvía `q` → la caja se pintaba siempre vacía.
      q: s.q,
      searchWidth: s.searchExpanded?'260px':'150px',
      // en móvil el input está oculto hasta que se toca la lupa: esta clase lo
      // despliega y hace sitio escondiendo los otros iconos de la barra
      searchOpenCls: s.searchExpanded ? 'gr-search-open' : '',
      // el foco va diferido: al pulsar, el input aún está display:none
      focusSearch:()=>{ this.setState({searchExpanded:true}); setTimeout(()=>{ const el=document.querySelector('input[placeholder="Buscar"]'); if(el) el.focus(); }, 30); },
      expandSearch:()=>this.setState({searchExpanded:true}),
      collapseSearch:()=>{ if(!s.q.global) this.setState({searchExpanded:false}); },
      // El buscador de la barra era decorativo (nadie leía q.global). Ahora
      // busca de verdad: escribe en el filtro de la biblioteca y lleva allí
      // para ver los resultados en vivo.
      setGlobalSearch:(e)=>{
        const v = e.target.value;
        this.setState({ q:{...s.q, global:v} });
        this.setLib({ search:v });
        if (v && this.state.route !== 'library') this.go('library');
      },
      iconSearch:IC.search(), iconBell:IC.bell(), iconUser:IC.user(), iconGear:IC.gear(), iconHelp:IC.help(), iconLogout:IC.logout(),
      iconLink:IC.link(), iconClip:IC.clip(), iconX:IC.x(), iconCheck:IC.check(), iconInboxLg:IC.inbox(),
      themeIcon: s.theme==='light'?IC.sun(): s.theme==='dark'?IC.moon():IC.monitor(),
      notifOpen:s.notifOpen,
      hasUnread: s.unread>0,
      notifEmpty: s.notifItemsSrv.length===0,
      notifItems: s.notifItemsSrv.slice(0,8).map(n=>({title:n.title, time:n.time, dot:notifDot(n.type)})),
      toggleNotif:()=>{ const opening=!s.notifOpen; this.setState({notifOpen:opening, avatarOpen:false}); if(opening && s.unread>0){ void this.api('/notifications/read-all',{method:'POST'}).then(()=>this.loadNotifications()).catch(()=>{}); } },
      toggleAvatar:()=>this.setState({avatarOpen:!s.avatarOpen, notifOpen:false}),
      avatarOpen:s.avatarOpen, closeOverlays:()=>this.setState({avatarOpen:false,notifOpen:false}),
      themeSeg,
      goSettings:()=>this.go('settings'), goSettingsProfile:()=>this.go('settings'),
      url:s.url, setUrl:(e)=>this.setState({url:e.target.value, dlError:''}),
      batchMode:s.batchMode, singleMode:!s.batchMode, toggleBatch:()=>this.setState({batchMode:!s.batchMode, result:null}),
      setSingleMode:()=>this.setState({batchMode:false, result:null}), setBatchMode:()=>this.setState({batchMode:true, result:null}),
      singleTabBg: !s.batchMode?'var(--accent)':'transparent', singleTabColor: !s.batchMode?'#0F0F0F':'var(--text-muted)',
      batchTabBg: s.batchMode?'var(--accent)':'transparent', batchTabColor: s.batchMode?'#0F0F0F':'var(--text-muted)',
      batchTrackBg:s.batchMode?'var(--accent)':'var(--surface-pressed)', batchThumbX:s.batchMode?'18px':'2px', batchThumbBg:s.batchMode?'#0F0F0F':'var(--text-muted)',
      batchCount: s.url.split('\n').filter(l=>l.trim()).length,
      showClip:s.showClip && !s.url, pasteClip:async ()=>{ try{ const t=await navigator.clipboard.readText(); if(t) this.setState({url:t, showClip:false}); else this.setState({showClip:false}); }catch(e){ this.setState({showClip:false}); } },
      platformStrip, analyzing:s.analyzing, result:s.result, dlError:s.dlError, analyze:()=>this.analyze(),
      qualityVideo, qualityAudio, dlChecks,
      downloadResult:()=>{ void this.addToQueue(true).then(()=>this.toast('Descargando… se guardará en tu PC al terminar', 'Ver cola', ()=>this.go('queue'))); },
      queueResult:()=>{ void this.addToQueue(false).then(()=>this.toast('Añadido a la cola', 'Ver cola', ()=>this.go('queue'))); },
      // barra de progreso dentro del panel de descarga
      dlActive: !!activeJob, dlIdle: !activeJob,
      dlActivePct: aPct+'%', dlActiveStatus: aStatus, dlActiveInfo: aInfo,
      dlActiveIndeterminate: activeJob && activeJob.status!=='downloading',
      dlJustDone: !activeJob && !!justDone, dlFailed: !activeJob && !justDone && !!failedJob,
      dlFailedMsg: failedJob ? (failedJob.errorMessage || 'La descarga falló') : '',
      cancelActiveDl: async ()=>{ if(!activeJob) return; try{ await this.api('/downloads/'+activeJob.id,{method:'DELETE'}); this.setState(st=>({queue:st.queue.filter(j=>j.id!==activeJob.id)})); this.toast('Descarga cancelada'); }catch(e){ this.toast(e.message||'No se pudo cancelar'); } },
      saveJustDoneToPC: ()=>{ if(justDone) void this.pcDownload('/downloads/'+justDone.id+'/file', justDone.title); },
      activeRows, doneRows, hasActive:active.length>0, queueEmpty:active.length===0 && done.length===0,
      // panel de OPCIONES de la Cola (mismo panel deslizante que Biblioteca):
      // agrupa Pausar todo / Limpiar completados / Simultáneas en un solo botón
      colaConcOptions, colaFiltersOpen: !!cf.open, colaSheetCloseClass: cf.closing?'gr-sheet-closing':'',
      toggleColaFilters: ()=>{ if(cf.open) this.closeColaFilters(); else { this._lockScroll(); this.setColaF({open:true, closing:false}); } },
      hasDone:done.length>0, doneExpanded:s.doneExpanded, toggleDoneGroup:()=>this.setState({doneExpanded:!s.doneExpanded}),
      doneChevron: s.doneExpanded?IC.chevronDown():IC.chevronRight(),
      activeCount:active.filter(q=>q.status!=='error').length, doneCount:done.length,
      concurrency:s.concurrency, setConcurrency:(e)=>{ this.setState({concurrency:e.target.value}); this.setPref('concurrency', e.target.value); },
      pauseAll:async ()=>{ try{ await this.api('/downloads/pause-all',{method:'POST'}); await this.loadQueue(); }catch(e){ this.toast(e.message); } },
      clearDone:async ()=>{ try{ await this.api('/downloads/completed',{method:'DELETE'}); await this.loadQueue(); }catch(e){ this.toast(e.message); } },
      toasts:s.toasts,
    };
  }

  async jobToggle(q){
    try {
      if (q.status==='paused'){
        const j = await this.api('/downloads/'+q.id+'/resume', { method:'POST' });
        this.setState(s=>({queue:s.queue.map(x=>x.id===q.id?j.job:x)}));
      } else if (q.status==='error'){
        const j = await this.api('/downloads/'+q.id+'/retry', { method:'POST' });
        this.setState(s=>({queue:s.queue.map(x=>x.id===q.id?j.job:x)}));
      } else {
        const j = await this.api('/downloads/'+q.id+'/pause', { method:'POST' });
        this.setState(s=>({queue:s.queue.map(x=>x.id===q.id?j.job:x)}));
      }
    } catch(e){ this.toast(e.message); }
  }

  async jobCancel(id){
    try {
      await this.api('/downloads/'+id, { method:'DELETE' });
      this.setState(s=>({queue:s.queue.filter(x=>x.id!==id)}));
    } catch(e){ this.toast(e.message); }
  }
}
