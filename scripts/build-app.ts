/**
 * Ensambla el frontend servible en public/app/ a partir de Grabber.dc.html
 * (fuente de verdad del diseño, que NO se modifica) + app-src/component.js
 * (la capa de datos real). Los componentes y sus props quedan intactos;
 * solo se hacen retoques mínimos de bindings donde el mock era decorativo.
 *
 *   npx tsx scripts/build-app.ts
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('.');
const src = readFileSync(path.join(ROOT, 'Grabber.dc.html'), 'utf8');
const component = readFileSync(path.join(ROOT, 'app-src', 'component.js'), 'utf8');

let out = src;
let edits = 0;

function replaceOnce(from: string, to: string, label: string): void {
  const idx = out.indexOf(from);
  if (idx === -1) throw new Error(`ancla no encontrada: ${label}`);
  if (out.indexOf(from, idx + 1) !== -1) throw new Error(`ancla ambigua: ${label}`);
  out = out.slice(0, idx) + to + out.slice(idx + from.length);
  edits++;
}

function replaceEvery(from: string, to: string, label: string, expected: number): void {
  let count = 0;
  while (out.includes(from)) {
    out = out.replace(from, to);
    count++;
    if (count > 50) throw new Error(`bucle en: ${label}`);
  }
  if (count !== expected) throw new Error(`${label}: esperaba ${expected} coincidencias, hubo ${count}`);
  edits++;
}

/** <img> de miniatura superpuesta (la insignia de duración queda encima). */
function thumbImg(expr: string): string {
  return `<sc-if value="{{ ${expr} }}" hint-placeholder-val="{{ false }}"><img src="{{ ${expr} }}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" /></sc-if>`;
}

// 1. <head>: título, favicon, manifest (spec §11)
replaceOnce(
  '<script src="./support.js"></script>',
  `<title>Grabber</title>
<link rel="icon" type="image/svg+xml" href="/public/brand/favicon.svg">
<link rel="alternate icon" href="/public/brand/favicon.ico" sizes="16x16 32x32">
<link rel="apple-touch-icon" href="/public/brand/apple-touch-icon-v3.png">
<link rel="manifest" href="/public/manifest.webmanifest">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0A0A0A">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F4F2">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Grabber">
<meta name="application-name" content="Grabber">
<style>
.gr-avatar:hover .gr-avatar-ov{opacity:1 !important;}
.gr-skel{background:linear-gradient(90deg,var(--skel) 25%,var(--surface-pressed) 42%,var(--skel) 60%) 0 0/300% 100%;animation:gr-shimmer 1.5s ease-in-out infinite;}
@keyframes gr-shimmer{from{background-position:150% 0;}to{background-position:-50% 0;}}
@keyframes gr-pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(.82);opacity:.55;}}
@keyframes gr-sheet-up{from{transform:translateY(100%);}to{transform:translateY(0);}}
@keyframes gr-sheet-down{from{transform:translateY(0);}to{transform:translateY(100%);}}
@keyframes gr-fade-out{from{opacity:1;}to{opacity:0;}}
/* panel de filtros: animación de entrada y de SALIDA (antes cerraba de golpe) */
.gr-lib-sheet-panel{animation:gr-sheet-up .3s cubic-bezier(.22,1,.36,1) both;will-change:transform;}
.gr-sheet-closing .gr-lib-sheet-panel{animation:gr-sheet-down .24s cubic-bezier(.4,0,1,1) both !important;}
.gr-sheet-closing .gr-lib-sheet-ov{animation:gr-fade-out .24s ease both !important;}
/* bloquea el scroll del fondo mientras el panel está abierto (no arrastra
   Biblioteca). Bloquea html Y body para cubrir donde sea que ocurra el scroll. */
html.gr-scroll-lock,html.gr-scroll-lock body{overflow:hidden !important;height:100%;touch-action:none;}
html.gr-scroll-lock .gr-lib-sheet-panel{touch-action:pan-y;}
/* el panel de filtros es solo móvil; en desktop se usan los chips en línea */
@media (min-width:641px){.gr-lib-sheet{display:none !important;}}
/* sin rebote/pull-to-refresh: mata el "scroll" fantasma cuando el contenido cabe */
html,body{overscroll-behavior:none;}
/* barra superior que se desliza al ocultarse. El transform se controla con una
   variable CSS en <html> (que el runtime dc NO reescribe, a diferencia del style
   inline del propio elemento, que sí borraba en cada render). */
.gr-topbar{transform:translateY(var(--gr-topbar-y,0px));transition:transform .28s ease;will-change:transform;}
@media (prefers-reduced-motion:reduce){.gr-skel{animation:none;}}
@media (max-width:900px){
  .gr-doc{grid-template-columns:1fr !important;overflow-y:auto !important;}
  /* páginas doc (Términos/Privacidad/Ayuda/Contacto): en móvil apilan y fluyen
     con scroll natural, sin recortar el contenido (quita overflow:hidden y el
     reparto space-between pensado para caber en una pantalla de PC) */
  /* Doc pages en móvil: minimal — sin las formas decorativas pesadas (que
     además tapaban el texto), panel compacto, solo kicker + título. */
  .gr-doc-side{justify-content:flex-start !important;gap:14px !important;padding:22px 20px 18px !important;}
  .gr-doc-side>[style*="position: absolute"]{display:none !important;}
  .gr-doc-side h1{font-size:34px !important;line-height:1.05 !important;}
  .gr-doc-main{overflow:visible !important;}
  .gr-doc-secs{display:block !important;flex:none !important;}
  .gr-status-grid{grid-template-columns:repeat(2,1fr) !important;}
}
@media (max-width:760px){ .gr-doc-row{flex-direction:column !important;gap:8px !important;} .gr-doc-row>div{width:auto !important;} }
@media (max-width:820px){ .gr-perfil{grid-template-columns:1fr !important;} .gr-perfil>*{grid-column:auto !important;} }
@media (max-width:560px){
  .gr-status-grid{grid-template-columns:1fr !important;}
}
/* —— Móvil (teléfono): menos padding lateral, sin recortes, tarjetas al alto natural —— */
@media (max-width:640px){
  /* Se usa main.gr-main (no .gr-main a secas) para GANAR a la regla original
     del mock, que reserva 90px abajo para una barra inferior que no existe:
     ese era el hueco vacío artificial al final de la página en móvil. */
  main.gr-main{padding:20px 16px 26px !important;}
  .gr-main{padding:20px 16px 26px !important;}
  /* Estado: en desktop centra y recorta; en móvil debe fluir y hacer scroll.
     El runtime dc quita la clase y re-serializa el style CON espacios → lo targeteo así. */
  [style*="padding: 24px 44px 56px"]{justify-content:flex-start !important;overflow-y:auto !important;}
  /* Perfil: las filas 1fr estiran las tarjetas; en móvil, alto natural.
     Y la tarjeta de identidad (con la foto) va PRIMERO al entrar. */
  .gr-perfil{grid-template-rows:none !important;min-height:auto !important;flex:none !important;}
  .gr-perfil>*{min-height:0 !important;}
  .gr-perfil-id{order:-1 !important;}
  /* Doc pages: padding móvil compacto (estilo Hibi: ~16-20px lateral) */
  .gr-doc-side{padding:26px 20px !important;}
  .gr-doc-main{padding:18px 20px 36px !important;}
  .gr-doc-row{padding:16px 0 !important;}
  /* Preferencias: apilar cada fila (label arriba, control full-width) al estilo
     Hibi, en vez de label-izq/control-der que aprieta en móvil */
  .gr-prefs-card>div{flex-direction:column !important;align-items:stretch !important;gap:12px !important;}
  .gr-prefs-card [data-dd]{width:100% !important;}
  .gr-prefs-card [data-dd]>button{width:100% !important;justify-content:space-between !important;max-width:none !important;}
  .gr-prefs-card [data-dd]>button>span:first-child{overflow:hidden;text-overflow:ellipsis;}
  /* NEUTRALIZAR el "llenar alto" de PC en móvil: en pantalla chica el contenido
     debe fluir natural (arriba, gaps normales, con scroll), NO esparcirse con
     space-around/space-between/flex:1 que deja huecos "a lo loco". */
  .gr-prefs-card,.gr-notifdata,.gr-notif-card,.gr-seg-fill{flex:none !important;justify-content:flex-start !important;}
  .gr-notif-card{gap:6px !important;}
  /* Cola: la fila horizontal de PC aplastaba el texto (una palabra por línea).
     En móvil el título+info va arriba y progreso+controles en fila completa abajo */
  .gr-queue-row{flex-wrap:wrap !important;}
  .gr-queue-side{width:100% !important;justify-content:space-between !important;margin-top:10px !important;gap:10px !important;}
  .gr-queue-prog{min-width:0 !important;text-align:left !important;}
  /* Popovers de cuenta y notificaciones: en móvil el offset derecho de PC los
     sacaba de pantalla; aquí van con margen a ambos lados, siempre visibles */
  .gr-pop{left:12px !important;right:12px !important;width:auto !important;}
  /* enlaces del pie del menú de cuenta (Términos/Privacidad/Estado/Contacto):
     centrados en móvil, que ahí el popover ocupa todo el ancho */
  .gr-menu-links{justify-content:center !important;text-align:center !important;gap:10px 18px !important;}
  /* Barra superior más compacta en móvil (menos alta) */
  .gr-bar{height:50px !important;padding:0 14px !important;gap:12px !important;}
  /* BUSCADOR en móvil: el CSS original deja SOLO la lupa (input display:none),
     así que no se podía escribir. Al tocarla se añade .gr-search-open y aquí se
     despliega el campo, ocultando los otros iconos para dejarle sitio. */
  .gr-bar-actions.gr-search-open{flex:1 1 auto !important;}
  .gr-bar-actions.gr-search-open .gr-search{width:auto !important;flex:1 1 auto;justify-content:flex-start !important;}
  .gr-bar-actions.gr-search-open input.gr-search-x{display:block !important;}
  .gr-bar-actions.gr-search-open > button{display:none !important;}
  .gr-mobile-nav button{padding:8px 12px !important;}
  /* Biblioteca: MENOS saturación en móvil — búsqueda a lo ancho, y los 4 filtros
     se colapsan tras un botón "Filtros" (ocultos por defecto). Se oculta el
     toggle de vista (grid por defecto). Al pulsar Filtros, los chips bajan. */
  /* la búsqueda y el botón "Filtros" en la MISMA fila (Filtros al lado del input) */
  .gr-lib-search{max-width:none !important;min-width:0 !important;}
  .gr-lib-sp{display:none !important;}
  .gr-lib-view,.gr-lib-sort,.gr-lib-chips{display:none !important;}
  .gr-lib-filtbtn{display:flex !important;flex-shrink:0 !important;}
  /* Cola en móvil: los 3 controles de arriba (Pausar todo/Limpiar/Simultáneas)
     se ocultan y van dentro del panel de "Opciones" */
  .gr-cola-ctrl{display:none !important;}
  .gr-lib-tb{gap:8px !important;flex-wrap:nowrap !important;}
  /* Header de páginas públicas: compacto y sin tanto espacio lateral en móvil */
  .gr-page-bar{padding:0 16px !important;height:58px !important;}
  .gr-page-bar span[style*="font-size:23px"],.gr-page-bar span[style*="font-size: 23px"]{font-size:19px !important;}
  /* Auth (login/registro/recuperar): contenido compacto para que quepa sin
     scroll (área útil móvil ~600px). NO usamos position:fixed/overflow:hidden
     porque al abrir el teclado recortaban el botón (no se podía hacer login).
     El rebote de scroll se mata con overscroll-behavior en html/body. */
  .gr-authcol{padding:16px 20px 18px !important;}
  .gr-authcol>div{max-width:none !important;margin:auto !important;}
  .gr-authcol>div>*{margin-top:0 !important;margin-bottom:13px !important;}
  .gr-authcol>div>*:last-child{margin-bottom:0 !important;}
  .gr-authcol input{padding-top:11px !important;padding-bottom:11px !important;}
  /* Footer de la home: en móvil apilado y centrado */
  .gr-homefoot{flex-direction:column !important;justify-content:center !important;align-items:center !important;text-align:center !important;gap:18px !important;padding:36px 24px !important;}
  .gr-homefoot>div{justify-content:center !important;}
}
/* avatar con hover para cambiar la foto (sin botón) */
.gr-avatar:hover .gr-avatar-ov{opacity:1;}
/* ————————————————————————————————————————————————————————————————
   SISTEMA DE MOVIMIENTO (premium): SOLO opacidad + translate (compositado,
   no reflota el layout). Nada de blur, scale (cambiar tamaño), rebotes ni
   brincos. Curvas expresivas + cascadas escalonadas para que se sienta
   trabajado, no el fade plano de siempre.
   ———————————————————————————————————————————————————————————————— */
/* micro-interacciones: SOLO color/opacidad. Nada de movimiento en hover. */
button,a,input,textarea,[data-dd] button,.gr-card{transition:background-color .18s ease,color .18s ease,border-color .18s ease,opacity .18s ease;}

/* keyframes (redefinen los de Grabber.dc.html: en CSS gana la última def.) */
@keyframes gr-fade{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
@keyframes gr-in{from{opacity:0;}to{opacity:1;}}
@keyframes gr-enter{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:none;}}
@keyframes gr-pop-in{from{opacity:0;transform:translateY(-7px);}to{opacity:1;transform:none;}}
/* estado "vivo" (puntito de en curso): parpadeo de OPACIDAD, sin scale */
@keyframes gr-pulse{0%,100%{opacity:1;}50%{opacity:.35;}}

/* Entrada de CADA vista/página/auth: el contenedor entero entra como un BLOQUE
   (opacidad + deslizamiento hacia arriba). Al moverse todo junto NADA se encima
   con nada (el solape de antes venía de escalonar secciones sueltas). Cubre la
   app, las páginas públicas (Términos/Contacto/…) y login/registro: todas
   llevan data-screen-label. Se dispara solo al cambiar de vista (el nodo es
   estable dentro de la vista → no re-anima en cada tecla).
   OJO: fill-mode "backwards" (NO "both"): con "both" el transform quedaba en
   matrix(1,0,0,1,0,0) al terminar, y esa matriz crea un CONTAINING BLOCK que
   rompia el position:fixed de dentro (sheet de filtros, panel de detalle,
   popovers) en movil. "backwards" deja transform:none real al acabar. */
[data-screen-label]{animation:gr-enter .5s cubic-bezier(.16,1,.3,1) backwards;}

/* Entrada RICA de cada apartado de la app (Descargar/Cola/Biblioteca/Ajustes):
   la vista hace wash-in (solo opacidad) y sus SECCIONES entran escalonadas —
   título, barra de herramientas, tarjetas… varias cosas, no un bloque plano.
   Desplazamiento corto (10px) < separación entre secciones (16px+) → nunca se
   tapan entre sí (medido). Más específico que [data-screen-label] → gana. */
.gr-main > div{animation:gr-in .4s ease backwards;}
.gr-main > div > *{animation:gr-build .52s cubic-bezier(.16,1,.3,1) backwards;}
.gr-main > div > *:nth-child(1){animation-delay:.05s;}
.gr-main > div > *:nth-child(2){animation-delay:.10s;}
.gr-main > div > *:nth-child(3){animation-delay:.15s;}
.gr-main > div > *:nth-child(4){animation-delay:.20s;}
.gr-main > div > *:nth-child(5){animation-delay:.24s;}
.gr-main > div > *:nth-child(6){animation-delay:.28s;}
.gr-main > div > *:nth-child(7){animation-delay:.31s;}
.gr-main > div > *:nth-child(n+8){animation-delay:.34s;}

/* Páginas públicas (Términos/Privacidad/Estado/Contacto/Ayuda): igual, la barra
   y el contenido entran por separado en vez de todo de golpe. */
[data-screen-label="Página"] > *{animation:gr-build .52s cubic-bezier(.16,1,.3,1) backwards;}
[data-screen-label="Página"] > *:nth-child(1){animation-delay:.05s;}
[data-screen-label="Página"] > *:nth-child(2){animation-delay:.13s;}
[data-screen-label="Página"] > *:nth-child(n+3){animation-delay:.20s;}

/* AUTH (entrar / crear cuenta / verificar / recuperar / restablecer):
   la vista entra con un wash-in SIN desplazamiento (para no duplicar el
   movimiento) y lo que se anima es la CONSTRUCCIÓN del formulario: logo,
   título, cada campo y el botón entran escalonados, de arriba a abajo.
   Desplazamiento corto (10px) < separación entre campos (13-16px) → no se
   solapan en ningún momento. Al cambiar entre login/registro/recuperar la
   vista se reconstruye entera, así que el efecto se repite en cada cambio. */
[data-screen-label="Login"],[data-screen-label="Signup"],[data-screen-label="Verify"],[data-screen-label="Forgot"],[data-screen-label="Reset"]{animation:gr-in .4s ease backwards;}
@keyframes gr-build{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
.gr-authcol > div{animation:gr-in .28s ease backwards !important;}
.gr-authcol > div > *{animation:gr-build .5s cubic-bezier(.16,1,.3,1) backwards;}
.gr-authcol > div > *:nth-child(1){animation-delay:.05s;}
.gr-authcol > div > *:nth-child(2){animation-delay:.10s;}
.gr-authcol > div > *:nth-child(3){animation-delay:.14s;}
.gr-authcol > div > *:nth-child(4){animation-delay:.18s;}
.gr-authcol > div > *:nth-child(5){animation-delay:.22s;}
.gr-authcol > div > *:nth-child(6){animation-delay:.26s;}
.gr-authcol > div > *:nth-child(7){animation-delay:.29s;}
.gr-authcol > div > *:nth-child(8){animation-delay:.32s;}
.gr-authcol > div > *:nth-child(9){animation-delay:.35s;}
.gr-authcol > div > *:nth-child(10){animation-delay:.38s;}
.gr-authcol > div > *:nth-child(n+11){animation-delay:.41s;}

/* PANEL DECORADO de auth: antes estaba muerto (las figuras no se movían y los
   bloques entraban todos a la vez). Ahora la decoración TAMBIÉN entra: cada
   figura llega desde su lado y el contenido se escalona. Son elementos
   absolutos → moverlos no afecta al layout ni tapa nada. Se respeta la
   rotación de cada figura en el keyframe (si no, se enderezarían). */
@keyframes gr-deco-tr{from{opacity:0;transform:rotate(18deg) translate(46px,-38px);}to{opacity:1;transform:rotate(18deg);}}
@keyframes gr-deco-bl{from{opacity:0;transform:rotate(-12deg) translate(-46px,38px);}to{opacity:1;transform:rotate(-12deg);}}
@keyframes gr-deco-pop{from{opacity:0;transform:translateY(-26px);}to{opacity:1;transform:none;}}
@keyframes gr-deco-bar{from{opacity:0;transform:translateX(-46px);}to{opacity:1;transform:none;}}
@keyframes gr-deco-arrow{from{opacity:0;transform:translateY(52px);}to{opacity:1;transform:none;}}
/* 1-5 = figuras decorativas (absolutas); 6 = logo, 7 = titular, 8 = filas */
.gr-auth-panel > div:nth-child(1){animation:gr-deco-tr .95s cubic-bezier(.16,1,.3,1) .05s backwards;}
.gr-auth-panel > div:nth-child(2){animation:gr-deco-pop .8s cubic-bezier(.16,1,.3,1) .22s backwards, gr-float 7s ease-in-out 1s infinite !important;}
.gr-auth-panel > div:nth-child(3){animation:gr-deco-bl .95s cubic-bezier(.16,1,.3,1) .12s backwards;}
.gr-auth-panel > div:nth-child(4){animation:gr-deco-bar .8s cubic-bezier(.16,1,.3,1) .34s backwards;}
.gr-auth-panel > div:nth-child(5){animation:gr-deco-arrow 1s cubic-bezier(.16,1,.3,1) .28s backwards;}
.gr-auth-panel > div:nth-child(6){animation:gr-build .6s cubic-bezier(.16,1,.3,1) .14s backwards !important;}
.gr-auth-panel > div:nth-child(7){animation:gr-build .6s cubic-bezier(.16,1,.3,1) .24s backwards !important;}
.gr-auth-panel > div:nth-child(8){animation:gr-build .6s cubic-bezier(.16,1,.3,1) .40s backwards !important;}
/* las píldoras de plataforma y las filas falsas entran una tras otra */
.gr-auth-panel > div:nth-child(7) span{animation:gr-build .5s cubic-bezier(.16,1,.3,1) backwards;}
.gr-auth-panel > div:nth-child(7) span:nth-child(1){animation-delay:.40s;}
.gr-auth-panel > div:nth-child(7) span:nth-child(2){animation-delay:.45s;}
.gr-auth-panel > div:nth-child(7) span:nth-child(3){animation-delay:.50s;}
.gr-auth-panel > div:nth-child(7) span:nth-child(4){animation-delay:.55s;}
.gr-auth-panel > div:nth-child(7) span:nth-child(5){animation-delay:.60s;}
.gr-auth-panel > div:nth-child(7) span:nth-child(n+6){animation-delay:.65s;}
.gr-auth-panel > div:nth-child(8) > div{animation:gr-build .55s cubic-bezier(.16,1,.3,1) backwards !important;}
.gr-auth-panel > div:nth-child(8) > div:nth-child(1){animation-delay:.50s;}
.gr-auth-panel > div:nth-child(8) > div:nth-child(2){animation-delay:.58s;}
.gr-auth-panel > div:nth-child(8) > div:nth-child(n+3){animation-delay:.66s;}

/* Cambio de tema (claro/oscuro): crossfade suave de TODOS los colores (~.4s).
   Se activa SOLO mientras dura el cambio (clase temporal en <html>), no de
   forma permanente, para no ensuciar los hovers. */
html.gr-theming, html.gr-theming *{transition:background-color .4s ease,color .4s ease,border-color .4s ease,fill .4s ease !important;}

/* Popovers (cuenta / notificaciones): entran deslizando un pelo desde arriba */
.gr-pop{animation:gr-pop-in .26s cubic-bezier(.16,1,.3,1) both;}

@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important;}
}
</style>
<script>
/* PWA: registra el service worker en cuanto carga la página (como Vexcel),
   independiente del framework de la app, para que sea instalable de inmediato.
   Idempotente con el registro del componente (misma URL). */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
</script>
<script src="./support.js"></script>`,
  'head',
);

// 2. Forgot: el botón enviaba a la pantalla reset; ahora pide el enlace real
replaceOnce(
  '<button onClick="{{ nav.reset }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:14px;border-radius:10px;">Enviar enlace</button>',
  '<button onClick="{{ doForgot }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:14px;border-radius:10px;">Enviar enlace</button>',
  'forgot',
);

// 3. Reset: guardar de verdad la contraseña nueva
replaceOnce(
  '<button onClick="{{ nav.login }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:14px;border-radius:10px;">Guardar y entrar</button>',
  '<button onClick="{{ doReset }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:14px;border-radius:10px;">Guardar y entrar</button>',
  'reset',
);

// 4. Botón de Google: decorativo en local (antes disparaba el login falso)
replaceOnce(
  '<button onClick="{{ doLogin }}" style="width:100%;background:var(--surface-raised);color:var(--text);font-size:14px;font-weight:500;padding:13px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .18s;" style-hover="background:var(--surface-pressed);"><span style="font-weight:600;">G</span> Continuar con Google</button>',
  '<button onClick="{{ googleStub }}" style="width:100%;background:var(--surface-raised);color:var(--text);font-size:14px;font-weight:500;padding:13px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .18s;" style-hover="background:var(--surface-pressed);"><span style="font-weight:600;">G</span> Continuar con Google</button>',
  'google',
);

// 5. Modal 2FA: mostrar el secreto real y capturar el código de la app
replaceOnce(
  '<p style="font-size:13px;color:var(--text-muted);margin:0 0 20px;">Escanea el código con tu app de autenticación.</p>',
  `<p style="font-size:13px;color:var(--text-muted);margin:0 0 10px;">Añade esta clave en tu app de autenticación y escribe el código de 6 dígitos.</p>
                <p style="font-size:12px;color:var(--text-faint);word-break:break-all;margin:0 0 14px;">Clave: <span style="color:var(--text);font-weight:600;">{{ twofaSecret }}</span></p>
                <input value="{{ twofaCode }}" onInput="{{ setTwofaCode }}" placeholder="Código de 6 dígitos" style="width:100%;background:var(--surface);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:16px;text-align:center;letter-spacing:0.2em;" />`,
  'twofa',
);

// 6. Seguridad: inputs de contraseña con binding real y botón propio
replaceOnce(
  '<input type="password" placeholder="••••••••" style="width:100%;background:var(--surface-raised);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:14px;" />',
  '<input value="{{ pwCurrent }}" onInput="{{ setPwCurrent }}" type="password" placeholder="••••••••" style="width:100%;background:var(--surface-raised);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:14px;" />',
  'pw-actual',
);
replaceOnce(
  '<input type="password" placeholder="••••••••" style="width:100%;background:var(--surface-raised);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:16px;" />',
  '<input value="{{ pwNew }}" onInput="{{ setPwNew }}" type="password" placeholder="••••••••" style="width:100%;background:var(--surface-raised);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:14px;" />' +
  '<label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:7px;">Confirmar contraseña</label>' +
  '<input value="{{ pwConfirm }}" onInput="{{ setPwConfirm }}" type="password" placeholder="••••••••" style="width:100%;background:var(--surface-raised);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:8px;" />' +
  '<div style="font-size:12px;color:{{ pwMatchColor }};margin-bottom:16px;min-height:16px;">{{ pwMatchMsg }}</div>',
  'pw-nueva',
);
replaceOnce(
  '<button onClick="{{ saveProfile }}" style="background:var(--accent);color:#0F0F0F;font-weight:600;font-size:13px;padding:11px 20px;border-radius:10px;">Actualizar</button>',
  '<button onClick="{{ changePassword }}" style="background:var(--accent);color:#0F0F0F;font-weight:600;font-size:13px;padding:11px 20px;border-radius:10px;">Actualizar</button>',
  'pw-boton',
);

// 7. Exportar: cada botón con su formato
replaceOnce(
  '<button onClick="{{ exportData }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Exportar CSV</button>',
  '<button onClick="{{ exportCsv }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Exportar CSV</button>',
  'export-csv',
);
replaceOnce(
  '<button onClick="{{ exportData }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Exportar JSON</button>',
  '<button onClick="{{ exportJson }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Exportar JSON</button>',
  'export-json',
);

// ——— Retroalimentación ronda 2 ———

// R1. Logo oficial en lugar de los cuadrados rosas del mock (spec §11: wordmark)
replaceEvery(
  '<div style="width:26px;height:26px;border-radius:7px;background:var(--accent);"></div>',
  '<span style="display:flex;color:var(--accent);">{{ brandMark26 }}</span>',
  'logo-26', 1,
);
replaceEvery(
  '<div style="width:22px;height:22px;border-radius:6px;background:var(--accent);"></div>',
  '<span style="display:flex;color:var(--accent);">{{ brandMark22 }}</span>',
  'logo-22', 5,
);
// barras superiores: logo grande y en el rosa de la marca (#FA05A0 = --accent)
replaceEvery(
  '<div style="width:20px;height:20px;border-radius:6px;background:var(--accent);"></div>',
  '<span style="display:flex;color:var(--accent);">{{ brandMark36 }}</span>',
  'logo-20', 2,
);
replaceEvery(
  '<div style="width:18px;height:18px;border-radius:5px;background:var(--accent);"></div>',
  '<span style="display:flex;color:var(--accent);">{{ brandMark18 }}</span>',
  'logo-18', 1,
);

// wordmark de barra mayor para acompañar el logo grande
replaceEvery(
  '<span style="font-size:17px;font-weight:600;letter-spacing:-0.02em;">grabber</span>',
  '<span style="font-size:23px;font-weight:600;letter-spacing:-0.02em;">grabber</span>',
  'wordmark-bar', 2,
);

// footer con páginas en la pantalla de login (no debe faltar al iniciar sesión)
replaceOnce(
  '<p style="font-size:13px;color:var(--text-muted);margin:26px 0 0;text-align:center;">¿No tienes cuenta? <span onClick="{{ nav.signup }}" style="color:var(--text);cursor:pointer;font-weight:500;">Crear cuenta</span></p>',
  '<p style="font-size:13px;color:var(--text-muted);margin:26px 0 0;text-align:center;">¿No tienes cuenta? <span onClick="{{ nav.signup }}" style="color:var(--text);cursor:pointer;font-weight:500;">Crear cuenta</span></p>' +
  '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;margin-top:28px;font-size:12px;color:var(--text-faint);">' +
  '<span onClick="{{ openTerms }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--accent);">Términos</span>' +
  '<span onClick="{{ openPrivacy }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--accent);">Privacidad</span>' +
  '<span onClick="{{ openStatus }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--accent);">Estado</span>' +
  '<span onClick="{{ openContact }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--accent);">Contacto</span>' +
  '<span onClick="{{ openHelp }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--accent);">Ayuda</span>' +
  '</div>',
  'login-footer',
);

// Buscador móvil: el grupo de acciones necesita una clase para poder darle
// sitio al input cuando se despliega (en móvil el input va oculto por defecto).
replaceOnce(
  '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">\n          <div onClick="{{ focusSearch }}" class="gr-search"',
  '<div class="gr-bar-actions {{ searchOpenCls }}" style="display:flex;align-items:center;gap:6px;flex-shrink:0;">\n          <div onClick="{{ focusSearch }}" class="gr-search"',
  'barra-acciones-clase',
);

// Crear cuenta: también con "Continuar con Google" (mismo bloque del login)
replaceOnce(
  '<button onClick="{{ doSignup }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:14px;border-radius:10px;transition:background .18s;" style-hover="background:var(--accent-hover);">Crear cuenta</button>',
  '<button onClick="{{ doSignup }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:14px;border-radius:10px;transition:background .18s;" style-hover="background:var(--accent-hover);">Crear cuenta</button>' +
  '<div style="display:flex;align-items:center;gap:14px;margin:22px 0;">' +
    '<div style="flex:1;height:1px;background:var(--surface-pressed);"></div>' +
    '<span style="font-size:12px;color:var(--text-faint);">o</span>' +
    '<div style="flex:1;height:1px;background:var(--surface-pressed);"></div>' +
  '</div>' +
  '<button onClick="{{ googleStub }}" style="width:100%;background:var(--surface-raised);color:var(--text);font-size:14px;font-weight:500;padding:13px;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .18s;" style-hover="background:var(--surface-pressed);"><span style="font-weight:600;">G</span> Continuar con Google</button>',
  'signup-google',
);

// Panel decorado reutilizable (mismo estilo premium del login) para dar a
// Crear cuenta / Recuperar / Restablecer la misma decoración en PC.
const authPanel = (headline: string, subtitle: string) =>
  '<div class="gr-auth-panel" style="position:relative;background:var(--surface);overflow:hidden;order:2;display:flex;flex-direction:column;justify-content:space-between;padding:56px;min-height:100dvh;">' +
    '<div style="position:absolute;top:-80px;right:-90px;width:340px;height:340px;border-radius:40px;background:var(--surface-raised);transform:rotate(18deg);"></div>' +
    '<div style="position:absolute;top:120px;right:60px;width:120px;height:120px;border-radius:24px;background:var(--accent-soft);animation:gr-float 7s ease-in-out infinite;"></div>' +
    '<div style="position:absolute;bottom:-60px;left:-70px;width:260px;height:260px;border-radius:36px;background:var(--surface-raised);transform:rotate(-12deg);"></div>' +
    '<div style="position:absolute;top:44%;left:-30px;width:60px;height:6px;border-radius:6px;background:var(--accent);"></div>' +
    '<div style="position:absolute;bottom:180px;right:40px;font-size:200px;font-weight:700;letter-spacing:-0.06em;color:var(--surface-raised);line-height:1;user-select:none;">↓</div>' +
    '<div style="position:relative;display:flex;align-items:center;gap:10px;animation:gr-fade .5s ease both;"><span style="display:flex;color:var(--accent);">{{ brandMark26 }}</span><span style="font-size:20px;font-weight:600;letter-spacing:-0.02em;">grabber</span></div>' +
    '<div style="position:relative;animation:gr-fade .6s ease both;"><div style="font-size:clamp(48px,6vw,92px);font-weight:600;letter-spacing:-0.03em;line-height:0.95;color:var(--text);">' + headline + '</div>' +
      '<p style="font-size:16px;color:var(--text-muted);max-width:380px;margin:24px 0 28px;">' + subtitle + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;max-width:380px;"><sc-for list="{{ platformStrip }}" as="p" hint-placeholder-count="6"><span style="font-size:12px;font-weight:500;color:var(--text-muted);background:var(--surface-raised);padding:7px 13px;border-radius:999px;">{{ p.label }}</span></sc-for></div></div>' +
    '<div style="position:relative;display:flex;flex-direction:column;gap:10px;max-width:460px;"><sc-for list="{{ decoRows }}" as="row" hint-placeholder-count="3"><div style="display:flex;align-items:center;gap:14px;background:var(--surface-raised);border-radius:12px;padding:13px 15px;animation:gr-fade .5s ease both;"><div style="width:56px;height:34px;border-radius:7px;background:var(--surface-pressed);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:10px;font-weight:600;">{{ row.code }}</div><div style="flex:1;min-width:0;"><div style="height:9px;width:{{ row.w1 }};background:var(--surface-pressed);border-radius:3px;margin-bottom:8px;"></div><div style="height:3px;width:100%;background:var(--surface-pressed);border-radius:3px;position:relative;overflow:hidden;"><div style="position:absolute;inset:0 auto 0 0;width:{{ row.pct }};background:{{ row.barColor }};border-radius:3px;{{ row.anim }}"></div></div></div><span style="font-size:11px;color:var(--text-faint);">{{ row.pctLabel }}</span></div></sc-for></div>' +
  '</div>';

// Crear cuenta: cambiar el panel plano por el decorado premium
replaceOnce(
  '<div class="gr-auth-panel" style="background:var(--surface);order:2;display:flex;flex-direction:column;justify-content:center;padding:56px;">\n          <div style="font-size:clamp(40px,5vw,72px);font-weight:600;letter-spacing:-0.03em;line-height:0.98;">Tu archivo,<br/>ordenado.</div>\n          <p style="font-size:16px;color:var(--text-muted);max-width:340px;margin:22px 0 0;">Colecciones, etiquetas, notas y detalle completo de cada descarga.</p>\n        </div>',
  authPanel('Tu archivo,<br/>ordenado.', 'Colecciones, etiquetas, notas y detalle completo de cada descarga.'),
  'signup-panel',
);

// Recuperar: envolver el form en el grid 2-columnas + panel decorado
replaceOnce(
  '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:100vh;padding:24px;" data-screen-label="Forgot">\n        <div style="width:100%;max-width:380px;animation:gr-fade .5s ease both;">',
  '<div class="gr-auth" style="display:grid;min-height:100dvh;" data-screen-label="Forgot">\n        <div class="gr-authcol" style="display:flex;flex-direction:column;justify-content:center;align-items:center;padding:48px 24px;background:var(--canvas);order:1;">\n        <div style="width:100%;max-width:380px;animation:gr-fade .5s ease both;">',
  'forgot-grid-open',
);
replaceOnce(
  '<p style="font-size:13px;color:var(--text-muted);margin:22px 0 0;text-align:center;"><span onClick="{{ nav.login }}" style="color:var(--text);cursor:pointer;font-weight:500;">Volver a iniciar sesión</span></p>\n        </div>\n      </div>\n    </sc-if>\n\n    <!-- RESET -->',
  '<p style="font-size:13px;color:var(--text-muted);margin:22px 0 0;text-align:center;"><span onClick="{{ nav.login }}" style="color:var(--text);cursor:pointer;font-weight:500;">Volver a iniciar sesión</span></p>\n        </div>\n        </div>\n        ' + authPanel('Recupera<br/>tu acceso.', 'Te enviamos un enlace y vuelves a tu biblioteca en segundos.') + '\n      </div>\n    </sc-if>\n\n    <!-- RESET -->',
  'forgot-grid-close',
);

// DOS casillas separadas: términos y privacidad (con enlaces reales)
replaceOnce(
  `<label style="display:flex;align-items:flex-start;gap:9px;font-size:13px;color:var(--text-muted);margin-bottom:22px;cursor:pointer;line-height:1.4;">
              <span onClick="{{ toggleTerms }}" style="width:18px;height:18px;border-radius:6px;background:{{ termsBg }};display:inline-flex;align-items:center;justify-content:center;color:#0F0F0F;flex-shrink:0;margin-top:1px;">{{ termsCheck }}</span>
              Acepto los términos de servicio y la política de privacidad.
            </label>`,
  `<div style="display:flex;flex-direction:column;gap:11px;margin-bottom:22px;font-size:13px;color:var(--text-muted);line-height:1.4;">
              <label style="display:flex;align-items:flex-start;gap:9px;cursor:pointer;"><span onClick="{{ toggleTerms }}" style="width:18px;height:18px;border-radius:6px;background:{{ termsBg }};display:inline-flex;align-items:center;justify-content:center;color:#0F0F0F;flex-shrink:0;margin-top:1px;">{{ termsCheck }}</span><span>Acepto los <span onClick="{{ openTerms }}" style="color:var(--text);cursor:pointer;font-weight:500;transition:color .16s;" style-hover="color:var(--accent);">términos de servicio</span></span></label>
              <label style="display:flex;align-items:flex-start;gap:9px;cursor:pointer;"><span onClick="{{ togglePrivacy }}" style="width:18px;height:18px;border-radius:6px;background:{{ privacyBg }};display:inline-flex;align-items:center;justify-content:center;color:#0F0F0F;flex-shrink:0;margin-top:1px;">{{ privacyCheck }}</span><span>Acepto la <span onClick="{{ openPrivacy }}" style="color:var(--text);cursor:pointer;font-weight:500;transition:color .16s;" style-hover="color:var(--accent);">política de privacidad</span></span></label>
            </div>`,
  'terms-two-checkboxes',
);

// el punto de la campana solo aparece si hay notificaciones sin leer
replaceOnce(
  '{{ iconBell }}<span style="position:absolute;top:8px;right:8px;width:6px;height:6px;border-radius:999px;background:var(--accent);"></span>',
  '{{ iconBell }}<sc-if value="{{ hasUnread }}" hint-placeholder-val="{{ true }}"><span style="position:absolute;top:8px;right:8px;width:6px;height:6px;border-radius:999px;background:var(--accent);"></span></sc-if>',
  'notif-dot',
);
// estado vacío del popover de notificaciones
replaceOnce(
  '<div style="padding:12px 12px 10px;font-size:13px;font-weight:600;">Notificaciones</div>',
  '<div style="padding:12px 12px 10px;font-size:13px;font-weight:600;">Notificaciones</div><sc-if value="{{ notifEmpty }}" hint-placeholder-val="{{ false }}"><div style="padding:20px 12px 22px;text-align:center;font-size:13px;color:var(--text-muted);">Sin notificaciones nuevas.</div></sc-if>',
  'notif-empty',
);

// footer accesible logueado: enlaces a páginas al pie del menú de cuenta
replaceOnce(
  '<button onClick="{{ doLogout }}" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;font-size:14px;color:var(--text);display:flex;align-items:center;gap:10px;transition:background .16s;" style-hover="background:var(--surface-pressed);">{{ iconLogout }} Cerrar sesión</button>',
  '<button onClick="{{ doLogout }}" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;font-size:14px;color:var(--text);display:flex;align-items:center;gap:10px;transition:background .16s;" style-hover="background:var(--surface-pressed);">{{ iconLogout }} Cerrar sesión</button>' +
  '<div class="gr-menu-links" style="display:flex;flex-wrap:wrap;gap:10px 14px;padding:12px 12px 4px;margin-top:6px;border-top:1px solid var(--surface-pressed);font-size:11px;color:var(--text-faint);">' +
  '<span onClick="{{ openTerms }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text-muted);">Términos</span>' +
  '<span onClick="{{ openPrivacy }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text-muted);">Privacidad</span>' +
  '<span onClick="{{ openStatus }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text-muted);">Estado</span>' +
  '<span onClick="{{ openContact }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text-muted);">Contacto</span>' +
  '</div>',
  'menu-footer-links',
);

// botón Ayuda del menú de cuenta → abre el centro de ayuda; y antes de él, el
// botón "Instalar app" (PWA), visible solo cuando el navegador lo permite.
replaceOnce(
  '<button style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;font-size:14px;color:var(--text);display:flex;align-items:center;gap:10px;transition:background .16s;" style-hover="background:var(--surface-pressed);">{{ iconHelp }} Ayuda</button>',
  '<sc-if value="{{ canInstall }}" hint-placeholder-val="{{ false }}"><button onClick="{{ installApp }}" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;font-size:14px;color:var(--accent);display:flex;align-items:center;gap:10px;transition:background .16s;" style-hover="background:var(--surface-pressed);">{{ iconInstall }} Instalar app</button></sc-if>' +
  '<button onClick="{{ openHelp }}" style="width:100%;text-align:left;padding:10px 12px;border-radius:8px;font-size:14px;color:var(--text);display:flex;align-items:center;gap:10px;transition:background .16s;" style-hover="background:var(--surface-pressed);">{{ iconHelp }} Ayuda</button>',
  'ayuda-boton',
);

// §10 Descargar: centrar el hero cuando está vacío (menos vacío abajo) y que
// suba al analizar un enlace (justify pasa a flex-start).
replaceOnce(
  '<div data-screen-label="Descargar" data-comment-anchor="download">',
  '<div data-screen-label="Descargar" data-comment-anchor="download" style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:{{ dlJustify }};transition:none;">',
  'descargar-centrado',
);

// §10 el toggle Uno/Lote no debe ir pegado al título: a su propia línea
replaceOnce(
  '<div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:10px;">\n              <h1 style="font-size:32px;font-weight:600;letter-spacing:-0.02em;margin:0;">Descargar</h1>',
  '<div style="display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;margin-bottom:16px;">\n              <h1 style="font-size:32px;font-weight:600;letter-spacing:-0.02em;margin:0;">Descargar</h1>',
  'modo-lote-linea',
);

// §10 Modo lote: reemplazar la píldora por un segmentado limpio (Uno / Lote)
replaceOnce(
  `<label style="display:flex;align-items:center;gap:9px;font-size:13px;color:var(--text-muted);cursor:pointer;background:var(--surface);padding:8px 12px;border-radius:999px;">
                <span onClick="{{ toggleBatch }}" style="width:34px;height:19px;border-radius:999px;background:{{ batchTrackBg }};position:relative;transition:background .18s;flex-shrink:0;"><span style="position:absolute;top:2px;left:{{ batchThumbX }};width:15px;height:15px;border-radius:999px;background:{{ batchThumbBg }};transition:left .18s;"></span></span>
                Modo lote
              </label>`,
  `<div style="display:inline-flex;background:var(--surface);border-radius:11px;padding:3px;">
                <button onClick="{{ setSingleMode }}" style="font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;color:{{ singleTabColor }};background:{{ singleTabBg }};transition:background .16s,color .16s;">Uno</button>
                <button onClick="{{ setBatchMode }}" style="font-size:13px;font-weight:600;padding:8px 18px;border-radius:8px;color:{{ batchTabColor }};background:{{ batchTabBg }};transition:background .16s,color .16s;">Lote</button>
              </div>`,
  'modo-lote',
);
// §10 quitar el resize handle del textarea de lote
replaceOnce(
  '<textarea value="{{ url }}" onInput="{{ setUrl }}" placeholder="Un enlace por línea…" style="width:100%;min-height:140px;resize:vertical;',
  '<textarea value="{{ url }}" onInput="{{ setUrl }}" placeholder="Un enlace por línea…" style="width:100%;min-height:96px;resize:none;',
  'lote-textarea-noresize',
);

// §10 Skeleton de análisis: shimmer animado + estructura realista (miniatura,
// líneas de título, opciones de calidad), que se vea que carga de verdad.
replaceOnce(
  `<div style="background:var(--surface);border-radius:16px;padding:16px;"><div style="width:100%;aspect-ratio:16/9;border-radius:12px;background:var(--skel);margin-bottom:16px;"></div><div style="height:18px;width:80%;background:var(--skel);border-radius:5px;margin-bottom:12px;"></div><div style="height:14px;width:50%;background:var(--skel);border-radius:5px;"></div></div>
              <div style="background:var(--surface);border-radius:16px;padding:20px;"><div style="height:14px;width:40%;background:var(--skel);border-radius:5px;margin-bottom:16px;"></div><div style="height:52px;width:100%;background:var(--skel);border-radius:10px;margin-bottom:10px;"></div><div style="height:52px;width:100%;background:var(--skel);border-radius:10px;"></div></div>`,
  `<div style="background:var(--surface);border-radius:16px;padding:16px;">
                <div class="gr-skel" style="width:100%;aspect-ratio:16/9;border-radius:12px;margin-bottom:18px;"></div>
                <div class="gr-skel" style="height:20px;width:85%;border-radius:6px;margin-bottom:12px;"></div>
                <div class="gr-skel" style="height:20px;width:55%;border-radius:6px;margin-bottom:20px;"></div>
                <div style="display:flex;gap:22px;">
                  <div><div class="gr-skel" style="height:11px;width:40px;border-radius:4px;margin-bottom:8px;"></div><div class="gr-skel" style="height:15px;width:60px;border-radius:5px;"></div></div>
                  <div><div class="gr-skel" style="height:11px;width:40px;border-radius:4px;margin-bottom:8px;"></div><div class="gr-skel" style="height:15px;width:50px;border-radius:5px;"></div></div>
                  <div><div class="gr-skel" style="height:11px;width:55px;border-radius:4px;margin-bottom:8px;"></div><div class="gr-skel" style="height:15px;width:70px;border-radius:5px;"></div></div>
                </div>
              </div>
              <div style="background:var(--surface);border-radius:16px;padding:20px;">
                <div class="gr-skel" style="height:12px;width:35%;border-radius:4px;margin-bottom:14px;"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;">
                  <div class="gr-skel" style="height:46px;border-radius:11px;"></div>
                  <div class="gr-skel" style="height:46px;border-radius:11px;"></div>
                  <div class="gr-skel" style="height:46px;border-radius:11px;"></div>
                  <div class="gr-skel" style="height:46px;border-radius:11px;"></div>
                </div>
                <div class="gr-skel" style="height:12px;width:28%;border-radius:4px;margin-bottom:14px;"></div>
                <div class="gr-skel" style="height:48px;width:100%;border-radius:12px;"></div>
              </div>`,
  'skeleton-shimmer',
);

// Detalle: notas funcionales sin resize + acciones (descargar al PC / eliminar)
replaceOnce(
  '<textarea placeholder="Añade una nota…" style="width:100%;min-height:70px;resize:vertical;background:var(--surface-raised);border-radius:10px;padding:12px;font-size:13px;margin-bottom:22px;"></textarea>',
  '<textarea value="{{ detailNotes }}" onInput="{{ setDetailNotes }}" placeholder="Añade una nota…" style="width:100%;min-height:70px;resize:none;background:var(--surface-raised);border-radius:10px;padding:12px;font-size:13px;margin-bottom:22px;"></textarea>',
  'detail-notes',
);
replaceOnce(
  `                  <button style="font-size:12px;background:var(--surface-raised);color:var(--text-faint);padding:5px 11px;border-radius:999px;">+ añadir</button>
                </div>
              </div>`,
  `                  <button style="font-size:12px;background:var(--surface-raised);color:var(--text-faint);padding:5px 11px;border-radius:999px;">+ añadir</button>
                </div>
                <div style="display:flex;gap:10px;margin-top:26px;">
                  <button onClick="{{ saveDetailToPC }}" style="flex:1;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:13px;border-radius:11px;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .16s;" style-hover="background:var(--accent-hover);">{{ iconDownload }} Descargar al PC</button>
                  <button onClick="{{ deleteDetail }}" aria-label="Eliminar" style="width:48px;flex-shrink:0;background:var(--surface-raised);color:var(--text-muted);border-radius:11px;display:flex;align-items:center;justify-content:center;transition:color .16s,background .16s;" style-hover="color:var(--warning);background:var(--surface-pressed);">{{ iconTrash }}</button>
                </div>
              </div>`,
  'detail-actions',
);

// §8 Cola: usar más ancho (como las otras vistas) + vacío centrado vertical
replaceOnce(
  '<div style="max-width:960px;margin:0 auto;" data-screen-label="Cola">',
  '<div data-screen-label="Cola">',
  'cola-ancho',
);
replaceOnce(
  '<sc-if value="{{ queueEmpty }}" hint-placeholder-val="{{ false }}">\n            <div style="text-align:center;padding:80px 20px;">',
  '<sc-if value="{{ queueEmpty }}" hint-placeholder-val="{{ false }}">\n            <div style="text-align:center;min-height:calc(100vh - 220px);display:flex;flex-direction:column;align-items:center;justify-content:center;">',
  'cola-vacio-centro',
);

// §9 Biblioteca: estado vacío centrado vertical
replaceOnce(
  '<sc-if value="{{ cardsEmpty }}" hint-placeholder-val="{{ false }}">\n              <div style="text-align:center;padding:80px 20px;">',
  '<sc-if value="{{ cardsEmpty }}" hint-placeholder-val="{{ false }}">\n              <div style="text-align:center;min-height:calc(100vh - 320px);display:flex;flex-direction:column;align-items:center;justify-content:center;">',
  'biblio-vacio-centro',
);

// R2. FAQ: la respuesta entra con fade para que el layout no salte en seco
replaceOnce(
  '<sc-if value="{{ fq.open }}" hint-placeholder-val="{{ false }}"><div style="padding:0 20px 20px;font-size:14px;color:var(--text-muted);line-height:1.6;">{{ fq.a }}</div></sc-if>',
  '<sc-if value="{{ fq.open }}" hint-placeholder-val="{{ false }}"><div style="padding:0 20px 20px;font-size:14px;color:var(--text-muted);line-height:1.6;animation:gr-fade .22s ease both;">{{ fq.a }}</div></sc-if>',
  'faq-fade',
);

// R3. Footer: enlaces reales + fila de redes
replaceOnce(
  '<span style="cursor:pointer;">Términos</span><span style="cursor:pointer;">Privacidad</span><span style="cursor:pointer;">Estado</span><span style="cursor:pointer;">Contacto</span>',
  '<span onClick="{{ openTerms }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text);">Términos</span><span onClick="{{ openPrivacy }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text);">Privacidad</span><span onClick="{{ openStatus }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text);">Estado</span><span onClick="{{ openContact }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text);">Contacto</span><span onClick="{{ openHelp }}" style="cursor:pointer;transition:color .16s;" style-hover="color:var(--text);">Ayuda</span>',
  'footer-links',
);
// redes junto al copyright del footer
replaceOnce(
  '<span style="font-size:12px;color:var(--text-faint);">© 2026 Grabber</span>',
  '<div style="display:flex;align-items:center;gap:16px;"><div style="display:flex;gap:8px;"><sc-for list="{{ socials }}" as="so" hint-placeholder-count="4"><div title="{{ so.label }}" style="width:34px;height:34px;border-radius:10px;background:var(--surface);color:var(--text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color .16s,background .16s;" style-hover="color:var(--accent);background:var(--surface-raised);">{{ so.icon }}</div></sc-for></div><span style="font-size:12px;color:var(--text-faint);">© 2026 Grabber</span></div>',
  'footer-socials',
);

// R4. El texto del input no debe meterse debajo del botón Analizar
replaceOnce(
  '<input value="{{ homeUrl }}" onInput="{{ setHomeUrl }}" placeholder="Pega un enlace…" style="flex:1;font-size:16px;padding:13px 0;min-width:0;" />',
  '<input value="{{ homeUrl }}" onInput="{{ setHomeUrl }}" placeholder="Pega un enlace…" style="flex:1;font-size:16px;padding:13px 0;min-width:0;margin-right:14px;" />',
  'home-input-espacio',
);
replaceOnce(
  '<input value="{{ url }}" onInput="{{ setUrl }}" placeholder="https://…" style="flex:1;font-size:17px;padding:15px 0;min-width:0;" />',
  '<input value="{{ url }}" onInput="{{ setUrl }}" placeholder="https://…" style="flex:1;font-size:17px;padding:15px 0;min-width:0;margin-right:14px;" />',
  'dl-input-espacio',
);

// R5. Tarjeta de invitado: aire entre etiqueta y botón + bloque de progreso con cancelar
replaceOnce(
  `<sc-if value="{{ homeCanDownload }}" hint-placeholder-val="{{ true }}">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;gap:12px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:var(--text-muted);">{{ guestLabel }}</span>
                    <button onClick="{{ homeDownload }}" style="background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:11px 22px;border-radius:10px;">Descargar 1080p</button>
                  </div>
                </sc-if>`,
  `<sc-if value="{{ homeCanDownload }}" hint-placeholder-val="{{ true }}">
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;gap:14px;row-gap:12px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:var(--text-muted);padding:4px 0;">{{ guestLabel }}</span>
                    <button onClick="{{ homeDownload }}" style="background:var(--accent);color:#0F0F0F;font-weight:600;font-size:14px;padding:11px 22px;border-radius:10px;flex-shrink:0;">Descargar 1080p</button>
                  </div>
                </sc-if>
                <sc-if value="{{ homeJob }}" hint-placeholder-val="{{ false }}">
                  <div style="margin-top:20px;background:var(--surface-raised);border-radius:12px;padding:16px 18px;animation:gr-fade .2s ease both;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px;">
                      <span style="font-size:13px;color:var(--text-muted);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ homeJobLabel }}</span>
                      <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;">
                        <span style="font-size:13px;font-weight:600;">{{ homeJobPct }}</span>
                        <sc-if value="{{ homeJobCancelable }}" hint-placeholder-val="{{ true }}">
                          <button onClick="{{ homeJobCancel }}" aria-label="Cancelar descarga" style="width:28px;height:28px;border-radius:8px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;background:var(--surface);transition:color .16s;" style-hover="color:var(--warning);">{{ iconX }}</button>
                        </sc-if>
                        <sc-if value="{{ homeJobDone }}" hint-placeholder-val="{{ false }}">
                          <button onClick="{{ homeJobClear }}" aria-label="Cerrar" style="width:28px;height:28px;border-radius:8px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;background:var(--surface);">{{ iconCheck }}</button>
                        </sc-if>
                      </div>
                    </div>
                    <div style="height:8px;border-radius:6px;background:var(--surface-pressed);overflow:hidden;"><div style="height:100%;width:{{ homeJobBarW }};background:{{ homeJobBarColor }};border-radius:6px;transition:width .5s ease;box-shadow:0 0 12px color-mix(in srgb,{{ homeJobBarColor }} 60%,transparent);"></div></div>
                  </div>
                </sc-if>`,
  'guest-progreso',
);

// R6. Miniaturas reales donde hay metadatos (con la insignia de duración encima)
replaceOnce(
  '<div style="position:relative;width:200px;height:112px;border-radius:10px;background:var(--surface-pressed);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:12px;font-weight:600;">{{ homeResult.platform }}<span',
  '<div style="position:relative;width:200px;height:112px;border-radius:10px;background:var(--surface-pressed);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:12px;font-weight:600;overflow:hidden;">{{ homeResult.platform }}' + thumbImg('homeResult.thumb') + '<span',
  'thumb-home',
);
replaceOnce(
  '{{ result.platformLabel }}\n                  <span style="position:absolute;bottom:12px;right:12px;',
  '{{ result.platformLabel }}\n                  ' + thumbImg('result.thumb') + '\n                  <span style="position:absolute;bottom:12px;right:12px;',
  'thumb-result',
);
replaceOnce(
  '<div style="position:relative;aspect-ratio:16/9;border-radius:10px;background:var(--surface-pressed);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:12px;font-weight:600;">{{ v.plat }}<span',
  '<div style="position:relative;aspect-ratio:16/9;border-radius:10px;background:var(--surface-pressed);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:12px;font-weight:600;overflow:hidden;">{{ v.plat }}' + thumbImg('v.thumbnailUrl') + '<span',
  'thumb-recientes',
);
replaceOnce(
  `{{ v.plat }}
                      <span style="position:absolute;bottom:8px;right:8px;background:#0A0A0A;color:#F2F0ED;font-size:11px;font-weight:600;padding:2px 6px;border-radius:5px;">{{ v.duration }}</span>
                      <button onClick="{{ v.onToggleSel }}"`,
  `{{ v.plat }}
                      ${thumbImg('v.thumbnailUrl')}
                      <span style="position:absolute;bottom:8px;right:8px;background:#0A0A0A;color:#F2F0ED;font-size:11px;font-weight:600;padding:2px 6px;border-radius:5px;">{{ v.duration }}</span>
                      <button onClick="{{ v.onToggleSel }}"`,
  'thumb-grid',
);
replaceOnce(
  '<div style="position:relative;width:88px;height:50px;border-radius:8px;background:var(--surface-pressed);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:10px;font-weight:600;">{{ v.plat }}<span',
  '<div style="position:relative;width:88px;height:50px;border-radius:8px;background:var(--surface-pressed);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:10px;font-weight:600;overflow:hidden;">{{ v.plat }}' + thumbImg('v.thumbnailUrl') + '<span',
  'thumb-lista',
);
replaceOnce(
  '<div style="position:relative;aspect-ratio:16/9;border-radius:12px;background:var(--surface-pressed);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:13px;font-weight:600;margin-bottom:18px;">{{ detail.plat }}<span',
  '<div style="position:relative;aspect-ratio:16/9;border-radius:12px;background:var(--surface-pressed);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:13px;font-weight:600;margin-bottom:18px;overflow:hidden;">{{ detail.plat }}' + thumbImg('detail.thumbnailUrl') + '<span',
  'thumb-detalle',
);

// R7. Páginas públicas: a pantalla completa, premium, sin montón de cards
const PAGES_HTML = `
    <!-- PÁGINAS PÚBLICAS -->
    <sc-if value="{{ isPage }}" hint-placeholder-val="{{ false }}">
      <div data-screen-label="Página" style="height:100dvh;display:flex;flex-direction:column;overflow:hidden;background:var(--canvas);">
        <!-- barra -->
        <div class="gr-page-bar" style="height:68px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 44px;z-index:2;">
          <div onClick="{{ pageBack }}" style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <span style="display:flex;color:var(--accent);">{{ brandMark36 }}</span>
            <span style="font-size:23px;font-weight:600;letter-spacing:-0.02em;">grabber</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <button onClick="{{ cycleTheme }}" aria-label="Cambiar tema" style="width:40px;height:40px;border-radius:12px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;transition:background .16s,color .16s;" style-hover="background:var(--surface);color:var(--text);">{{ themeIcon }}</button>
            <button onClick="{{ pageBack }}" style="font-size:14px;font-weight:500;color:var(--text-muted);padding:10px 18px;border-radius:11px;background:var(--surface);transition:color .16s;" style-hover="color:var(--text);">{{ pageBackLabel }}</button>
          </div>
        </div>

        <!-- DOCUMENTOS: términos / privacidad / ayuda -->
        <sc-if value="{{ pageIsDoc }}" hint-placeholder-val="{{ true }}">
          <div class="gr-doc" style="flex:1;display:grid;grid-template-columns:minmax(360px,460px) 1fr;overflow:hidden;">
            <!-- panel izquierdo -->
            <div class="gr-doc-side" style="position:relative;background:var(--chrome);padding:56px 52px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;">
              <div style="position:absolute;top:-70px;right:-80px;width:280px;height:280px;border-radius:48px;background:var(--surface);transform:rotate(18deg);"></div>
              <div style="position:absolute;bottom:-70px;left:-70px;width:220px;height:220px;border-radius:38px;background:var(--surface);transform:rotate(-12deg);"></div>
              <div style="position:absolute;top:44%;left:-24px;width:56px;height:6px;border-radius:6px;background:var(--accent);"></div>
              <div style="position:relative;">
                <div style="font-size:12px;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:18px;">{{ pageKicker }}</div>
                <h1 style="font-size:clamp(40px,4.6vw,64px);font-weight:600;letter-spacing:-0.035em;line-height:0.98;margin:0 0 20px;">{{ pageTitle }}</h1>
                <p style="font-size:16px;color:var(--text-muted);max-width:340px;line-height:1.6;margin:0;">{{ pageSubtitle }}</p>
              </div>
              <div style="position:relative;display:flex;align-items:center;gap:10px;">
                <sc-for list="{{ socials }}" as="so" hint-placeholder-count="3">
                  <div title="{{ so.label }}" style="width:40px;height:40px;border-radius:12px;background:var(--surface);color:var(--text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color .16s,background .16s;" style-hover="color:var(--accent);background:var(--surface-pressed);">{{ so.icon }}</div>
                </sc-for>
              </div>
            </div>
            <!-- una sección por fila, repartidas para llenar el alto (sin scroll) -->
            <div class="gr-doc-main" style="padding:44px 72px;display:flex;flex-direction:column;overflow:hidden;">
              <div class="gr-doc-secs" style="flex:1;display:flex;flex-direction:column;justify-content:space-between;">
                <sc-for list="{{ pageSections }}" as="sec" hint-placeholder-count="6">
                  <div class="gr-doc-row" style="display:flex;gap:40px;align-items:baseline;padding:20px 0;border-top:1px solid var(--surface-pressed);">
                    <div style="width:250px;flex-shrink:0;display:flex;align-items:baseline;gap:12px;">
                      <span style="font-size:13px;font-weight:600;color:var(--accent);">{{ sec.n }}</span>
                      <h2 style="font-size:19px;font-weight:600;letter-spacing:-0.02em;margin:0;line-height:1.25;">{{ sec.h }}</h2>
                    </div>
                    <p style="flex:1;font-size:15px;color:var(--text-muted);line-height:1.65;margin:0;max-width:70ch;">{{ sec.p }}</p>
                  </div>
                </sc-for>
              </div>
              <p style="font-size:13px;color:var(--text-faint);margin:28px 0 0;padding-top:20px;border-top:1px solid var(--surface-pressed);">© 2026 Grabber · Todo corre en tu equipo.</p>
            </div>
          </div>
        </sc-if>

        <!-- ESTADO: dashboard a pantalla completa, sin scroll -->
        <sc-if value="{{ pageIsStatus }}" hint-placeholder-val="{{ false }}">
          <div class="gr-status-wrap" style="flex:1;position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px 44px 56px;overflow:hidden;">
            <!-- decoración acorde a la app: mismas formas redondeadas de las demás
                 páginas. Sin glow, sin sombras, sin rejilla. -->
            <div style="position:absolute;top:-90px;right:-70px;width:300px;height:300px;border-radius:52px;background:var(--surface);transform:rotate(18deg);pointer-events:none;"></div>
            <div style="position:absolute;bottom:-90px;left:-80px;width:260px;height:260px;border-radius:44px;background:var(--surface);transform:rotate(-12deg);pointer-events:none;"></div>
            <div style="position:absolute;top:50%;left:-26px;width:60px;height:6px;border-radius:6px;background:var(--accent);pointer-events:none;"></div>
            <div style="position:relative;text-align:center;max-width:1120px;width:100%;">
              <div style="display:inline-flex;align-items:center;gap:10px;background:var(--surface);border-radius:999px;padding:8px 16px;margin-bottom:26px;">
                <span style="width:9px;height:9px;border-radius:999px;background:{{ statusDot }};"></span>
                <span style="font-size:13px;font-weight:500;color:var(--text-muted);">En vivo</span>
              </div>
              <h1 style="font-size:clamp(36px,5vw,60px);font-weight:600;letter-spacing:-0.035em;line-height:1.02;margin:0 auto 14px;max-width:820px;">{{ statusHeadline }}</h1>
              <p style="font-size:16px;color:var(--text-muted);margin:0 auto 52px;max-width:460px;">{{ statusSub }}</p>
              <div class="gr-status-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:left;">
                <sc-for list="{{ statusRows }}" as="st" hint-placeholder-count="4">
                  <div style="position:relative;background:var(--surface);border-radius:18px;padding:26px 24px;display:flex;flex-direction:column;gap:22px;min-height:180px;justify-content:space-between;overflow:hidden;">
                    <div style="position:absolute;top:-34px;right:-34px;width:96px;height:96px;border-radius:999px;background:var(--accent-soft);opacity:.45;pointer-events:none;"></div>
                    <div style="position:relative;display:flex;align-items:center;justify-content:space-between;">
                      <span style="width:40px;height:40px;border-radius:11px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;">{{ st.icon }}</span>
                      <span style="width:9px;height:9px;border-radius:999px;background:{{ st.dot }};box-shadow:0 0 0 4px color-mix(in srgb, {{ st.dot }} 22%, transparent);"></span>
                    </div>
                    <div style="position:relative;">
                      <div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">{{ st.name }}</div>
                      <div style="font-size:23px;font-weight:600;letter-spacing:-0.02em;">{{ st.value }}</div>
                      <div style="width:28px;height:3px;border-radius:3px;background:var(--accent);margin-top:12px;"></div>
                    </div>
                  </div>
                </sc-for>
              </div>
              <p style="font-size:12px;color:var(--text-faint);margin:34px 0 0;">Grabber v0.1.0 · comprobación en tiempo real contra tu servidor local</p>
            </div>
          </div>
        </sc-if>

        <!-- CONTACTO: split premium, sin scroll -->
        <sc-if value="{{ pageIsContact }}" hint-placeholder-val="{{ false }}">
          <div class="gr-doc" style="flex:1;display:grid;grid-template-columns:1fr 1fr;overflow:hidden;">
            <div class="gr-doc-side" style="position:relative;background:var(--chrome);padding:56px 60px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;">
              <div style="position:absolute;top:60px;right:60px;width:130px;height:130px;border-radius:28px;background:var(--accent-soft);animation:gr-float 7s ease-in-out infinite;"></div>
              <div style="position:absolute;bottom:-80px;left:-60px;width:260px;height:260px;border-radius:42px;background:var(--surface);transform:rotate(-12deg);"></div>
              <div style="position:relative;margin-top:auto;">
                <div style="font-size:12px;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:0.14em;margin-bottom:20px;">{{ pageKicker }}</div>
                <h1 style="font-size:clamp(48px,5.6vw,86px);font-weight:600;letter-spacing:-0.04em;line-height:0.96;margin:0 0 22px;">{{ pageTitle }}</h1>
                <p style="font-size:17px;color:var(--text-muted);max-width:380px;line-height:1.6;margin:0;">{{ pageSubtitle }} En esta versión local el mensaje se guarda en tu equipo.</p>
              </div>
              <div style="position:relative;margin-top:40px;">
                <div style="font-size:12px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">Síguenos</div>
                <div style="display:flex;gap:10px;">
                  <sc-for list="{{ contactSocials }}" as="so" hint-placeholder-count="4">
                    <div title="{{ so.label }}" style="width:42px;height:42px;border-radius:12px;background:var(--surface);color:var(--text-muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:color .16s,background .16s;" style-hover="color:var(--accent);background:var(--surface-pressed);">{{ so.icon }}</div>
                  </sc-for>
                </div>
              </div>
            </div>
            <div class="gr-hide-scroll gr-doc-main" style="display:flex;flex-direction:column;justify-content:center;padding:48px 56px;overflow-y:auto;">
              <div style="width:100%;max-width:480px;margin:0 auto;animation:gr-fade .4s ease both;">
                <h2 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;margin:0 0 20px;">Escríbenos</h2>
                <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:8px;">Tu email</label>
                <input value="{{ cEmail }}" onInput="{{ setCEmail }}" type="email" placeholder="tu@correo.com" style="width:100%;background:var(--surface);border-radius:12px;padding:15px 16px;font-size:15px;margin-bottom:18px;" />
                <label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:8px;">Mensaje</label>
                <textarea value="{{ cMsg }}" onInput="{{ setCMsg }}" placeholder="Cuéntanos qué necesitas…" style="width:100%;min-height:150px;resize:none;background:var(--surface);border-radius:12px;padding:15px 16px;font-size:15px;line-height:1.6;margin-bottom:18px;"></textarea>
                <button onClick="{{ sendContact }}" style="width:100%;background:var(--accent);color:#0F0F0F;font-weight:600;font-size:15px;padding:15px;border-radius:12px;transition:background .18s;" style-hover="background:var(--accent-hover);">Enviar mensaje</button>
                <div style="height:1px;background:var(--surface-pressed);margin:28px 0;"></div>
                <div style="font-size:12px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px;">Otras formas</div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <sc-for list="{{ contactSocials }}" as="so" hint-placeholder-count="4">
                    <div style="display:flex;align-items:center;gap:14px;background:var(--surface);border-radius:12px;padding:13px 16px;cursor:pointer;transition:background .16s;" style-hover="background:var(--surface-raised);">
                      <span style="color:var(--text-muted);display:flex;">{{ so.icon }}</span>
                      <span style="font-size:14px;font-weight:500;flex:1;">{{ so.label }}</span>
                      <span style="font-size:13px;color:var(--text-muted);">{{ so.handle }}</span>
                    </div>
                  </sc-for>
                </div>
              </div>
            </div>
          </div>
        </sc-if>
      </div>
    </sc-if>
`;
// Páginas públicas al NIVEL SUPERIOR (fuera de logueado/no-logueado), así abren
// también estando logueado (arregla "Ayuda"). Se controlan solo por {{ isPage }}.
replaceOnce('<!-- TOASTS -->', PAGES_HTML + '\n<!-- TOASTS -->', 'paginas-publicas');
// Ocultar home/app cuando route === 'page' (si no, se renderizan encima).
replaceOnce(
  '<sc-if value="{{ notAuthed }}" hint-placeholder-val="{{ true }}">',
  '<sc-if value="{{ notAuthedNoPage }}" hint-placeholder-val="{{ true }}">',
  'route-notauthed',
);
replaceOnce(
  '<sc-if value="{{ authed }}" hint-placeholder-val="{{ false }}">',
  '<sc-if value="{{ authedNoPage }}" hint-placeholder-val="{{ false }}">',
  'route-authed',
);
// Splash de arranque: mientras tryRefresh resuelve la sesión no mostramos la
// landing (antes "recargar → inicio"): un loader neutro y luego la vista real.
replaceOnce(
  '<sc-if value="{{ notAuthedNoPage }}" hint-placeholder-val="{{ true }}">',
  `<sc-if value="{{ booting }}" hint-placeholder-val="{{ true }}">
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;">
    <div style="display:flex;flex-direction:column;align-items:center;gap:18px;">
      <div style="width:44px;height:44px;border-radius:13px;background:var(--accent);animation:gr-pulse 1.1s ease-in-out infinite;"></div>
      <span style="font-size:14px;color:var(--text-muted);letter-spacing:.01em;">Cargando…</span>
    </div>
  </div>
</sc-if>
<sc-if value="{{ notAuthedNoPage }}" hint-placeholder-val="{{ false }}">`,
  'boot-splash',
);

// 8. Etiquetas de almacenamiento → binding real (la del perfil se absorbe en R8)
replaceOnce(
  '<div style="font-size:13px;color:var(--text-muted);">42 GB de 200 GB usados</div>',
  '<div style="font-size:13px;color:var(--text-muted);">{{ storageHeader }} usados</div>',
  'storage-header-2',
);

// §6 Notificaciones + Datos en una sola vista (2 columnas, sin scroll)
replaceOnce(
  `<sc-if value="{{ setIsNotif }}" hint-placeholder-val="{{ false }}">
              <div style="background:var(--surface);border-radius:14px;padding:6px 20px;">`,
  `<sc-if value="{{ setIsNotif }}" hint-placeholder-val="{{ false }}">
              <div class="gr-notifdata" style="display:flex;flex-direction:column;gap:16px;flex:1;min-height:0;">
              <div class="gr-notif-card" style="background:var(--surface);border-radius:16px;padding:10px 22px;display:flex;flex-direction:column;justify-content:space-between;flex:1;min-height:0;">`,
  'notifdata-open',
);
replaceOnce(
  `                  </div>
                </sc-for>
              </div>
            </sc-if>

            <!-- DATA -->
            <sc-if value="{{ setIsData }}" hint-placeholder-val="{{ false }}">
              <div style="display:flex;flex-direction:column;gap:20px;">
                <div style="background:var(--surface);border-radius:14px;padding:20px;">
                  <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Exportar biblioteca</div>
                  <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Descarga el índice de tus videos y colecciones.</div>
                  <div style="display:flex;gap:10px;">
                    <button onClick="{{ exportCsv }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Exportar CSV</button>
                    <button onClick="{{ exportJson }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Exportar JSON</button>
                  </div>
                </div>
                <div style="background:var(--surface);border-radius:14px;padding:20px;">
                  <div style="font-size:14px;font-weight:600;margin-bottom:4px;">Eliminar cuenta</div>
                  <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">Se borra tu biblioteca, colecciones y ajustes. No se puede deshacer.</div>
                  <button onClick="{{ openDelete }}" style="font-size:13px;font-weight:600;color:var(--warning);background:var(--surface-raised);padding:11px 18px;border-radius:10px;">Eliminar mi cuenta</button>
                </div>
              </div>
            </sc-if>`,
  `                  </div>
                </sc-for>
              </div>
              <div style="background:var(--surface);border-radius:16px;padding:22px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
                <div><div style="font-size:14px;font-weight:600;">Exportar biblioteca</div><div style="font-size:13px;color:var(--text-muted);margin-top:3px;">Descarga el índice de tus videos y colecciones.</div></div>
                <div style="display:flex;gap:10px;flex-shrink:0;">
                  <button onClick="{{ exportCsv }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;" style-hover="background:var(--surface-pressed);">CSV</button>
                  <button onClick="{{ exportJson }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 18px;border-radius:10px;" style-hover="background:var(--surface-pressed);">JSON</button>
                </div>
              </div>
              <div style="background:var(--surface);border-radius:16px;padding:22px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
                <div><div style="font-size:14px;font-weight:600;">Eliminar cuenta</div><div style="font-size:13px;color:var(--text-muted);margin-top:3px;line-height:1.5;">Se borra tu biblioteca, colecciones y ajustes. No se puede deshacer.</div></div>
                <button onClick="{{ openDelete }}" style="font-size:13px;font-weight:600;color:var(--warning);background:var(--surface-raised);padding:11px 18px;border-radius:10px;flex-shrink:0;" style-hover="background:var(--surface-pressed);">Eliminar mi cuenta</button>
              </div>
              </div>
            </sc-if>`,
  'notifdata-merge',
);

// §5 Plan → complementos: precio y botón alineados en línea (no torcidos)
replaceOnce(
  '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;flex-shrink:0;"><span style="font-size:14px;font-weight:600;">{{ ad.price }}</span><button style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:8px 16px;border-radius:10px;" style-hover="background:var(--surface-pressed);">Añadir</button></div>',
  '<div style="display:flex;align-items:center;gap:14px;flex-shrink:0;"><span style="font-size:15px;font-weight:600;">{{ ad.price }}</span><button style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:9px 18px;border-radius:10px;" style-hover="background:var(--surface-pressed);">Añadir</button></div>',
  'plan-addon-align',
);

// §4 Seguridad: cards de contraseña/2FA más compactos (para caber sin scroll)
replaceOnce(
  '<div style="background:var(--surface);border-radius:14px;padding:20px;">\n                  <div style="font-size:14px;font-weight:600;margin-bottom:16px;">Cambiar contraseña</div>',
  '<div style="background:var(--surface);border-radius:14px;padding:16px 20px;">\n                  <div style="font-size:14px;font-weight:600;margin-bottom:12px;">Cambiar contraseña</div>',
  'seg-pwcard-compact',
);
// §quitar 2FA: eliminar la tarjeta de "Verificación en dos pasos"
replaceOnce(
  `<div style="background:var(--surface);border-radius:14px;padding:20px;display:flex;justify-content:space-between;align-items:center;gap:16px;">
                  <div style="display:flex;align-items:center;gap:14px;">
                    <span style="color:var(--text-muted);display:flex;">{{ iconShield }}</span>
                    <div><div style="font-size:14px;font-weight:600;">Verificación en dos pasos</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Un código adicional al iniciar sesión.</div></div>
                  </div>
                  <span onClick="{{ toggle2fa }}" style="width:36px;height:20px;border-radius:999px;background:{{ twofaTrackBg }};position:relative;flex-shrink:0;cursor:pointer;transition:background .18s;"><span style="position:absolute;top:2px;left:{{ twofaThumbX }};width:16px;height:16px;border-radius:999px;background:{{ twofaThumbBg }};transition:left .18s;"></span></span>
                </div>`,
  '',
  'seg-remove-2fa',
);

// §4 Seguridad: la lista de sesiones activas ocupa el alto restante
replaceOnce(
  `<sc-if value="{{ setIsSecurity }}" hint-placeholder-val="{{ false }}">
              <div style="display:flex;flex-direction:column;gap:20px;">`,
  `<sc-if value="{{ setIsSecurity }}" hint-placeholder-val="{{ false }}">
              <div class="gr-seg-fill" style="display:flex;flex-direction:column;gap:12px;flex:1;min-height:0;">`,
  'seguridad-fill',
);
replaceOnce(
  `<div style="background:var(--surface);border-radius:14px;padding:6px 20px;">
                  <div style="font-size:14px;font-weight:600;padding:16px 0 4px;">Sesiones activas</div>`,
  `<div class="gr-hide-scroll" style="background:var(--surface);border-radius:14px;padding:6px 22px;flex:1;min-height:0;overflow-y:auto;">
                  <div style="font-size:14px;font-weight:600;padding:16px 0 4px;">Sesiones activas</div>`,
  'seguridad-sesiones-flex',
);

// §2 Recortador de avatar REAL (visor circular, arrastrar/zoom, guías) estilo Hibi
replaceOnce(
  `<div onClick="{{ closeModal }}" style="position:fixed;inset:0;z-index:75;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:24px;">
              <div onClick="{{ stop }}" style="width:360px;max-width:100%;background:var(--surface-raised);border-radius:16px;padding:24px;animation:gr-fade .18s ease both;">
                <div style="font-size:15px;font-weight:600;margin-bottom:18px;">Recortar foto</div>
                <div style="width:200px;height:200px;border-radius:999px;background:var(--surface-pressed);margin:0 auto 20px;overflow:hidden;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:13px;">Vista previa</div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;">
                  <span style="font-size:12px;color:var(--text-muted);">Zoom</span>
                  <div style="flex:1;height:2px;background:var(--surface-pressed);border-radius:2px;position:relative;"><div style="position:absolute;left:0;top:0;bottom:0;width:40%;background:var(--accent);border-radius:2px;"></div><div style="position:absolute;left:40%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:999px;background:var(--accent);"></div></div>
                </div>
                <div style="display:flex;gap:10px;">
                  <button onClick="{{ closeModal }}" style="flex:1;font-size:13px;font-weight:500;color:var(--text-muted);padding:11px;border-radius:10px;background:var(--surface);">Cancelar</button>
                  <button onClick="{{ applyCrop }}" style="flex:1;font-size:13px;font-weight:600;color:#0F0F0F;padding:11px;border-radius:10px;background:var(--accent);">Guardar</button>
                </div>
              </div>
            </div>`,
  `<div onClick="{{ closeCrop }}" style="position:fixed;inset:0;z-index:75;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:24px;">
              <div onClick="{{ stop }}" style="width:360px;max-width:100%;background:var(--surface-raised);border-radius:20px;padding:22px;animation:gr-fade .18s ease both;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px;">
                  <div><div style="font-size:16px;font-weight:600;">Ajustar foto</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Arrastra para encuadrar, rueda para acercar.</div></div>
                  <button onClick="{{ closeCrop }}" aria-label="Cerrar" style="width:34px;height:34px;border-radius:999px;background:var(--surface);color:var(--text-muted);display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ iconClose }}</button>
                </div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
                  <div onPointerDown="{{ cropDown }}" onPointerMove="{{ cropMove }}" onPointerUp="{{ cropUp }}" onPointerCancel="{{ cropUp }}" onWheel="{{ cropWheel }}" style="position:relative;width:{{ cropDiam }};height:{{ cropDiam }};max-width:100%;border-radius:999px;overflow:hidden;background:var(--surface-pressed);touch-action:none;cursor:grab;user-select:none;">
                    <sc-if value="{{ cropUrl }}" hint-placeholder-val="{{ true }}"><img src="{{ cropUrl }}" alt="" draggable="false" style="position:absolute;max-width:none;user-select:none;pointer-events:none;width:{{ cropImgW }};height:{{ cropImgH }};left:{{ cropImgLeft }};top:{{ cropImgTop }};" /></sc-if>
                    <div style="position:absolute;inset:0;pointer-events:none;transition:opacity .3s;opacity:{{ cropGuideOpacity }};">
                      <div style="position:absolute;top:0;bottom:0;left:33.33%;width:1px;background:rgba(255,255,255,.4);"></div>
                      <div style="position:absolute;top:0;bottom:0;left:66.66%;width:1px;background:rgba(255,255,255,.4);"></div>
                      <div style="position:absolute;left:0;right:0;top:33.33%;height:1px;background:rgba(255,255,255,.4);"></div>
                      <div style="position:absolute;left:0;right:0;top:66.66%;height:1px;background:rgba(255,255,255,.4);"></div>
                    </div>
                  </div>
                  <button onClick="{{ cropCenter }}" style="display:inline-flex;align-items:center;gap:7px;height:32px;padding:0 14px;border-radius:999px;font-size:12px;font-weight:600;color:var(--text-muted);background:var(--surface);transition:color .16s,background .16s;" style-hover="color:var(--accent);background:var(--surface-pressed);">{{ iconLocate }} Centrar</button>
                </div>
                <div style="display:flex;gap:10px;margin-top:18px;">
                  <button onClick="{{ closeCrop }}" style="flex:1;font-size:14px;font-weight:600;color:var(--text);padding:12px;border-radius:12px;background:var(--surface);">Cancelar</button>
                  <button onClick="{{ applyCrop }}" style="flex:1.4;font-size:14px;font-weight:600;color:#0F0F0F;padding:12px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;gap:8px;">{{ iconCheck }} {{ cropSaveLabel }}</button>
                </div>
              </div>
            </div>`,
  'crop-real',
);

// §3 Preferencias: filas compactas + la tarjeta llena TODO el alto (sin scroll)
replaceEvery('padding:18px 0;', 'padding:12px 0;', 'prefs-compact', 8);
replaceOnce(
  `<sc-if value="{{ setIsPrefs }}" hint-placeholder-val="{{ false }}">
              <div style="background:var(--surface);border-radius:14px;padding:6px 20px;">`,
  `<sc-if value="{{ setIsPrefs }}" hint-placeholder-val="{{ false }}">
              <div class="gr-prefs-card" style="background:var(--surface);border-radius:14px;padding:8px 24px;display:flex;flex-direction:column;justify-content:space-around;flex:1;min-height:0;">`,
  'prefs-fill',
);
// dropdowns con ancho FIJO (no se desplaza el layout al cambiar el valor)
replaceOnce(
  '<button onClick="{{ dd.lang.toggle }}" style="display:flex;align-items:center;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);">',
  '<button onClick="{{ dd.lang.toggle }}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);min-width:150px;">',
  'dd-lang-w',
);
replaceOnce(
  '<button onClick="{{ dd.tz.toggle }}" style="display:flex;align-items:center;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);max-width:260px;">',
  '<button onClick="{{ dd.tz.toggle }}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);width:230px;">',
  'dd-tz-w',
);
replaceOnce(
  '<button onClick="{{ dd.prefConc.toggle }}" style="display:flex;align-items:center;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);">',
  '<button onClick="{{ dd.prefConc.toggle }}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);min-width:90px;">',
  'dd-conc-w',
);
replaceOnce(
  '<button onClick="{{ dd.trash.toggle }}" style="display:flex;align-items:center;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);">',
  '<button onClick="{{ dd.trash.toggle }}" style="display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--surface-raised);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--text);min-width:130px;">',
  'dd-trash-w',
);

// §5 Facturas vacías (plan Free): mostrar estado, no un bloque vacío torcido
replaceOnce(
  `<sc-for list="{{ invoices }}" as="inv" hint-placeholder-count="3">
                    <div style="display:flex;align-items:center;gap:16px;padding:14px 0;font-size:13px;">`,
  `<sc-if value="{{ invoicesEmpty }}" hint-placeholder-val="{{ false }}"><div style="padding:14px 0 20px;font-size:13px;color:var(--text-muted);">Aún no hay facturas.</div></sc-if>
                  <sc-for list="{{ invoices }}" as="inv" hint-placeholder-count="3">
                    <div style="display:flex;align-items:center;gap:16px;padding:14px 0;font-size:13px;">`,
  'facturas-vacio',
);

// §5 Plan: el botón de cada tarjeta abre el checkout de Wompi (o baja a Free)
replaceOnce(
  '<button style="width:100%;font-size:14px;font-weight:600;padding:12px;border-radius:11px;background:{{ pl.ctaBg }};color:{{ pl.ctaFg }};">{{ pl.cta }}</button>',
  '<button onClick="{{ pl.onCta }}" style="width:100%;font-size:14px;font-weight:600;padding:12px;border-radius:11px;background:{{ pl.ctaBg }};color:{{ pl.ctaFg }};">{{ pl.cta }}</button>',
  'plan-cta',
);

// §5 Reemplazar la tarjeta falsa de "Método de pago · Visa 4242" por el estado
// real de la suscripción (con cancelar renovación cuando aplica).
replaceOnce(
  `<div><div style="font-size:14px;font-weight:600;">Método de pago</div><div style="font-size:13px;color:var(--text-muted);margin-top:3px;">Visa terminada en 4242 · expira 08/28</div></div>
                  <button style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:10px 16px;border-radius:10px;" style-hover="background:var(--surface-pressed);">Actualizar</button>`,
  `<div style="min-width:0;"><div style="font-size:14px;font-weight:600;">{{ subTitle }}</div><div style="font-size:13px;color:var(--text-muted);margin-top:3px;">{{ subDetail }}</div></div>
                  <sc-if value="{{ subCanCancel }}" hint-placeholder-val="{{ false }}"><button onClick="{{ cancelRenewal }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:10px 16px;border-radius:10px;flex-shrink:0;" style-hover="background:var(--surface-pressed);">Cancelar renovación</button></sc-if>`,
  'metodo-pago-a-suscripcion',
);

// Footer en la app logueada (sticky al fondo): shell flex-column + main flex:1 + footer
replaceOnce(
  `<sc-if value="{{ authedNoPage }}" hint-placeholder-val="{{ false }}">
  <div>
    <!-- TOP BAR -->`,
  `<sc-if value="{{ authedNoPage }}" hint-placeholder-val="{{ false }}">
  <div style="display:flex;flex-direction:column;min-height:100vh;">
    <!-- TOP BAR -->`,
  'app-shell-flex',
);
replaceOnce(
  '<main class="gr-main" style="max-width:1720px;margin:0 auto;padding:36px 40px 100px;min-height:calc(100vh - 56px);">',
  '<main class="gr-main" style="width:100%;max-width:1720px;margin:0 auto;padding:32px 40px 40px;flex:1;min-height:0;display:flex;flex-direction:column;">',
  'app-main-flex',
);
// (sin footer en la vista logueada — el usuario lo pidió fuera)

// R8. Ajustes: el contenedor fija la altura UNA vez y cada pestaña la llena al 100%
// (así TODAS las pestañas tienen exactamente el mismo alto, no cada una el suyo).
replaceOnce(
  '<div data-screen-label="Ajustes">',
  '<div data-screen-label="Ajustes" style="display:flex;flex-direction:column;flex:1;min-height:0;">',
  'ajustes-flex',
);
replaceOnce('<div style="max-width:1200px;">', '<div class="gr-hide-scroll" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;">', 'settings-full-width');
// el relleno inferior lo maneja ahora app-main-flex (main como columna flex)
replaceOnce(
  `<div style="display:flex;flex-direction:column;gap:16px;">
                <div style="background:var(--surface);border-radius:16px;padding:32px;display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
                  <div style="width:104px;height:104px;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-size:38px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ profileInitials }}</div>
                  <div style="flex:1;min-width:220px;">
                    <input value="{{ P.name }}" onInput="{{ setPName }}" aria-label="Nombre" style="font-size:28px;font-weight:600;letter-spacing:-0.02em;background:none;width:100%;margin-bottom:8px;" />
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                      <span style="font-size:12px;font-weight:600;color:var(--accent);background:var(--accent-soft);padding:5px 11px;border-radius:999px;">Plan Pro</span>
                      <span style="font-size:13px;color:var(--text-muted);">Miembro desde marzo 2025</span>
                    </div>
                  </div>
                  <div style="display:flex;gap:10px;flex-shrink:0;">
                    <button onClick="{{ changePhoto }}" style="font-size:13px;font-weight:500;color:var(--text);background:var(--surface-raised);padding:11px 16px;border-radius:11px;display:flex;align-items:center;gap:8px;" style-hover="background:var(--surface-pressed);">{{ iconCamera }} Cambiar foto</button>
                    <button onClick="{{ removePhoto }}" style="font-size:13px;font-weight:500;color:var(--text-muted);padding:11px 14px;border-radius:11px;" style-hover="background:var(--surface-raised);">Eliminar</button>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
                  <sc-for list="{{ profileStats }}" as="st" hint-placeholder-count="4">
                    <div style="background:var(--surface);border-radius:16px;padding:24px;">
                      <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">{{ st.label }}</div>
                      <div style="font-size:32px;font-weight:600;letter-spacing:-0.02em;line-height:1;">{{ st.value }}</div>
                      <sc-if value="{{ st.sub }}" hint-placeholder-val="{{ false }}"><div style="font-size:12px;color:var(--text-faint);margin-top:6px;">{{ st.sub }}</div></sc-if>
                    </div>
                  </sc-for>
                </div>
                <div style="background:var(--surface);border-radius:16px;padding:24px;">
                  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;"><div style="font-size:14px;font-weight:600;">Almacenamiento por tipo</div><div style="font-size:13px;color:var(--text-muted);">42 GB de 200 GB</div></div>
                  <div style="display:flex;height:8px;border-radius:999px;overflow:hidden;gap:2px;margin-bottom:18px;">
                    <sc-for list="{{ storageBars }}" as="b" hint-placeholder-count="3"><div style="width:{{ b.pct }};background:{{ b.color }};"></div></sc-for>
                  </div>
                  <div style="display:flex;gap:28px;flex-wrap:wrap;">
                    <sc-for list="{{ storageBars }}" as="b" hint-placeholder-count="3"><div style="display:flex;align-items:center;gap:9px;font-size:13px;"><span style="width:10px;height:10px;border-radius:3px;background:{{ b.color }};"></span><span style="color:var(--text-muted);">{{ b.label }}</span><span style="font-weight:600;">{{ b.value }}</span></div></sc-for>
                  </div>
                </div>
              </div>`,
  `<div class="gr-perfil" style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:auto 1fr;gap:16px;flex:1;min-height:0;">
                  <sc-for list="{{ profileStats }}" as="st" hint-placeholder-count="4">
                    <div style="background:var(--surface);border-radius:18px;padding:24px;display:flex;flex-direction:column;justify-content:center;gap:10px;">
                      <div style="font-size:13px;color:var(--text-muted);">{{ st.label }}</div>
                      <div style="font-size:36px;font-weight:600;letter-spacing:-0.025em;line-height:1;">{{ st.value }}</div>
                      <sc-if value="{{ st.sub }}" hint-placeholder-val="{{ false }}"><div style="font-size:12px;color:var(--text-faint);">{{ st.sub }}</div></sc-if>
                    </div>
                  </sc-for>
                  <div class="gr-perfil-id" style="background:var(--surface);border-radius:18px;padding:28px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;min-height:0;">
                    <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;">
                      <div onClick="{{ changePhoto }}" class="gr-avatar" title="Cambiar foto" style="position:relative;width:144px;height:144px;border-radius:999px;overflow:hidden;flex-shrink:0;cursor:pointer;background:var(--accent-soft);color:var(--accent);font-size:54px;font-weight:600;display:flex;align-items:center;justify-content:center;">
                        <sc-if value="{{ profileHasAvatar }}" hint-placeholder-val="{{ false }}"><img src="{{ avatarUrl }}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" /></sc-if>
                        {{ profileInitials }}
                        <div class="gr-avatar-ov" style="position:absolute;inset:0;background:rgba(10,10,10,.55);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;opacity:0;transition:opacity .18s;"><span style="display:flex;">{{ iconCamera }}</span><span style="font-size:11px;font-weight:600;">Cambiar</span></div>
                      </div>
                      <div style="display:flex;flex-direction:column;align-items:center;gap:9px;width:100%;">
                        <input value="{{ P.name }}" onInput="{{ setPName }}" aria-label="Nombre" style="font-size:26px;font-weight:600;letter-spacing:-0.02em;background:none;width:100%;text-align:center;" />
                        <span style="font-size:12px;font-weight:600;color:var(--accent);background:var(--accent-soft);padding:5px 12px;border-radius:999px;">Plan {{ profilePlan }}</span>
                        <sc-if value="{{ profileHasAvatar }}" hint-placeholder-val="{{ false }}"><button onClick="{{ removePhoto }}" style="font-size:12px;color:var(--text-muted);" style-hover="color:var(--warning);">Quitar foto</button></sc-if>
                      </div>
                    </div>
                    <div style="display:flex;flex-direction:column;">
                      <div style="display:flex;align-items:center;justify-content:space-between;font-size:14px;gap:10px;padding:14px 0;border-top:1px solid var(--surface-pressed);"><span style="color:var(--text-muted);">Correo</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ profileEmail }}</span></div>
                      <div style="display:flex;align-items:center;justify-content:space-between;font-size:14px;gap:10px;padding:14px 0;border-top:1px solid var(--surface-pressed);"><span style="color:var(--text-muted);">Miembro desde</span><span>{{ profileMemberSince }}</span></div>
                      <div style="display:flex;align-items:center;justify-content:space-between;font-size:14px;gap:10px;padding:14px 0;border-top:1px solid var(--surface-pressed);"><span style="color:var(--text-muted);">Almacenamiento</span><span>{{ storageHeader }}</span></div>
                    </div>
                    <button onClick="{{ doLogout }}" style="width:100%;font-size:14px;font-weight:600;color:var(--text);background:var(--surface-raised);padding:14px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .16s,color .16s;" style-hover="background:var(--surface-pressed);color:var(--warning);">{{ iconLogout }} Cerrar sesión</button>
                  </div>
                  <div style="background:var(--surface);border-radius:18px;padding:32px;display:flex;flex-direction:column;gap:22px;grid-column:span 3;min-height:0;">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;"><div style="font-size:15px;font-weight:600;">Almacenamiento por tipo</div><div style="font-size:13px;color:var(--text-muted);">{{ storageHeader }}</div></div>
                    <div style="flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:10px;min-height:0;">
                      <sc-for list="{{ storageBars }}" as="b" hint-placeholder-count="5"><div style="display:flex;align-items:center;gap:16px;"><span style="width:11px;height:11px;border-radius:4px;background:{{ b.color }};flex-shrink:0;"></span><span style="width:84px;font-size:14px;color:{{ b.labelColor }};font-weight:{{ b.labelWeight }};flex-shrink:0;">{{ b.label }}</span><div style="flex:1;height:{{ b.barH }};border-radius:999px;background:var(--surface-pressed);overflow:hidden;"><div style="height:100%;width:{{ b.pct }};background:{{ b.color }};border-radius:999px;"></div></div><span style="width:72px;text-align:right;font-size:14px;font-weight:600;flex-shrink:0;">{{ b.value }}</span></div></sc-for>
                    </div>
                  </div>
              </div>`,
  'perfil-dashboard',
);
// (perfil responsive ya está en el <style> del head)

// Filtros de Biblioteca (Plataforma/Formato/Calidad/Fecha): el menú debe tener
// el ANCHO del botón que lo abre (no un min-width fijo que lo hacía más ancho).
// width:100% resuelve contra el wrapper position:relative = ancho del botón.
replaceOnce(
  'position:absolute;top:44px;left:0;z-index:30;min-width:160px;background:var(--surface-raised);',
  'position:absolute;top:44px;left:0;z-index:30;width:100%;background:var(--surface-raised);',
  'filtros-ancho',
);

// Etiquetas del detalle: cablear el botón "+ añadir" (antes no hacía NADA).
// Al pulsarlo aparece un input; "Añadir" (o Enter) guarda vía PATCH /library/:id.
replaceOnce(
  '<button style="font-size:12px;background:var(--surface-raised);color:var(--text-faint);padding:5px 11px;border-radius:999px;">+ añadir</button>',
  '<sc-if value="{{ tagAdding }}" hint-placeholder-val="{{ false }}"><input value="{{ tagInput }}" onInput="{{ setTagInput }}" onKeyDown="{{ onTagKey }}" placeholder="nueva etiqueta" style="font-size:12px;background:var(--surface-raised);color:var(--text);padding:5px 11px;border-radius:999px;width:130px;outline:none;border:1px solid var(--accent);" /><button onClick="{{ commitTag }}" style="font-size:12px;background:var(--accent);color:#0F0F0F;font-weight:600;padding:5px 12px;border-radius:999px;">Añadir</button></sc-if><sc-if value="{{ tagNotAdding }}" hint-placeholder-val="{{ true }}"><button onClick="{{ startAddTag }}" style="font-size:12px;background:var(--surface-raised);color:var(--text-faint);padding:5px 11px;border-radius:999px;">+ añadir</button></sc-if>',
  'tags-add',
);

// Movimiento premium en superficies con animación inline (modales, toasts):
// sube la duración y usa la curva expresiva (easeOutExpo) en vez del ease corto.
replaceEvery(
  'animation:gr-fade .18s ease both',
  'animation:gr-fade .34s cubic-bezier(.16,1,.3,1) both',
  'anim-modales', 6,
);
replaceEvery(
  'animation:gr-fade .2s ease both',
  'animation:gr-fade .4s cubic-bezier(.16,1,.3,1) both',
  'anim-reveal-02', 2,
);
// Popovers (cuenta / notificaciones): entrada con deslizamiento desde arriba
replaceEvery(
  'animation:gr-fade .16s ease both',
  'animation:gr-pop-in .26s cubic-bezier(.16,1,.3,1) both',
  'anim-popover', 2,
);
// El resto de reveals inline (dropdowns .14s, paneles auth .3s/.5s/.6s): misma
// curva expresiva, conservando su duración. Regex acotado a gr-fade con `ease`.
{
  const before = out;
  out = out.replace(/animation:gr-fade (\.[0-9]+s) ease both/g, 'animation:gr-fade $1 cubic-bezier(.16,1,.3,1) both');
  if (out !== before) edits++;
}

// La "g" del nombre la pone el LOGO: el wordmark pierde su "g" inicial y se
// pega a la marca para que se lea como una sola palabra ([G]rabber).
{
  let n = 0;
  out = out.replace(
    /<span style="font-size:(\d+)px;font-weight:600;letter-spacing:-0\.02em;">grabber<\/span>/g,
    (_m, size) => {
      n++;
      return `<span style="font-size:${size}px;font-weight:600;letter-spacing:-0.02em;margin-left:-6px;">rabber</span>`;
    },
  );
  if (n === 0) throw new Error('wordmark: no se encontró ningún "grabber" junto a la marca');
  console.log(`  · wordmark con la G del logo: ${n}`);
  edits++;
}

// Auth: los enlaces que llevan a OTRA vista se ponen del rosa de la app AL PASAR
// EL RATÓN (color normal en reposo; el rosa es el hover).
replaceOnce(
  '<span onClick="{{ nav.forgot }}" style="font-size:12px;color:var(--text-muted);cursor:pointer;">¿Olvidaste?</span>',
  '<span onClick="{{ nav.forgot }}" style="font-size:12px;color:var(--text-muted);cursor:pointer;transition:color .16s;" style-hover="color:var(--accent);">¿Olvidaste?</span>',
  'login-olvidaste-hover',
);
replaceEvery(
  '<span onClick="{{ nav.signup }}" style="color:var(--text);cursor:pointer;font-weight:500;">Crear cuenta</span>',
  '<span onClick="{{ nav.signup }}" style="color:var(--text);cursor:pointer;font-weight:500;transition:color .16s;" style-hover="color:var(--accent);">Crear cuenta</span>',
  'login-crearcuenta-hover', 1,
);
// "Inicia sesión" (registro) y "Volver a iniciar sesión" (recuperar/restablecer)
replaceEvery(
  '<span onClick="{{ nav.login }}" style="color:var(--text);cursor:pointer;font-weight:500;">',
  '<span onClick="{{ nav.login }}" style="color:var(--text);cursor:pointer;font-weight:500;transition:color .16s;" style-hover="color:var(--accent);">',
  'auth-volver-login-hover', 2,
);

// 9. Reemplazar la capa de datos simulados por la real,
//    conservando el preludio (PLATFORMS, PLAT_CODE, svg, svgEls, IC)
const scriptOpen = out.indexOf('<script type="text/x-dc" data-dc-script');
if (scriptOpen === -1) throw new Error('no se encontró el data-dc-script');
const openEnd = out.indexOf('>', scriptOpen) + 1;
const scriptClose = out.indexOf('</script>', openEnd);
const origScript = out.slice(openEnd, scriptClose);
const classAt = origScript.indexOf('class Component');
if (classAt === -1) throw new Error('no se encontró class Component');
const prelude = origScript.slice(0, classAt);
out = out.slice(0, openEnd) + '\n' + prelude + component + '\n' + out.slice(scriptClose);
edits++;

const dest = path.join(ROOT, 'public', 'app');
mkdirSync(dest, { recursive: true });
writeFileSync(path.join(dest, 'index.html'), out, 'utf8');
copyFileSync(path.join(ROOT, 'support.js'), path.join(dest, 'support.js'));
console.log(`public/app/index.html generado (${edits} retoques aplicados)`);
