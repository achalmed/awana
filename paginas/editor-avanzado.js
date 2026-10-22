/* ============================================================
   editor-avanzado.js — E.Avz: lo que acerca el editor de piezas a un editor tipo Canva
   ------------------------------------------------------------
   Se carga DESPUÉS del script de editor.html y trabaja sobre su modelo (E.State, E.Render,
   E.Ediciones, E.Export…). No introduce tipos de objeto nuevos: gráficos, tablas, QR,
   collages, insignias y marcos se COMPONEN con texto, formas e imágenes, así salen
   iguales en PNG/JPG/WebP, PDF y el SVG editable para Inkscape. Todo color sale de los
   tokens (T(), roles de la paleta o variables CSS --datos-N); el cromo, de estudio-tema.css.

     Inicio        pantalla de inicio: crear por tamaño, diseños recientes, galería de plantillas
     Elementos     formas, líneas y flechas, marcos para fotos, cuadrículas, insignias, gráficos,
                   tablas, código QR e íconos (Tabler del despacho + juego del estudio)
     Marca         kit de marca: colores, tipografías (y las del perfil), estilos, combinaciones, logos
     Fotos         elegir del banco/Fototeca con búsqueda, reemplazar en su marco, recortar dentro
                   del marco (doble clic), filtros
     Texto         estilos de marca, combinaciones, efectos (sombra, contorno, hueco, neón,
                   resaltado), encajar en la caja
     Lienzo        copiar/pegar estilo, atajos (Ctrl+Alt+C/V, Ctrl+[ ], Ctrl+Mayús+L, ?)
     Páginas       tira con miniaturas, reordenar, exportar todas (ZIP de imágenes o PDF)
     Tamaño        «Cambiar tamaño» mágico: reubica por anclas y crea copias
   ============================================================ */
(function(){
"use strict";
if(typeof E==="undefined")return;
if(new URLSearchParams(location.search).get("prueba"))return;   // modo prueba sin interfaz (generar.py comprobar)

const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ic=(n,c)=>(window.icono&&window.icono(n,c||""))||"";
const hoy=()=>new Date().toLocaleDateString("es-PE");
const redondo=v=>Math.round(v);
const roles=()=>E.State.st.palRoles||PALETAS[E.State.st.pal]||E.Pal.rolesDe(E.State.st.pal,E.State.st.palVar||0);
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const Avz={};

/* ---------------------------------------------------------- íconos extra de la interfaz (Lucide, ISC) */
const MAS_ICONOS={
  "inicio":'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "redimensionar":'<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3 9 15"/>',
  "qr":'<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
  "grafico":'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  "torta":'<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
  "tabla":'<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  "marca":'<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
  "bloques":'<path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect x="14" y="2" width="8" height="8" rx="1"/>',
  "pincel":'<path d="m14.622 17.897-10.68-2.913"/><path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z"/><path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15"/>',
  "buscar":'<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
  "izquierda":'<path d="m15 18-6-6 6-6"/>',
  "derecha":'<path d="m9 18 6-6-6-6"/>',
  "teclado":'<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>'
};
if(window.ICONOS_ESTUDIO)Object.entries(MAS_ICONOS).forEach(([k,v])=>{ if(!window.ICONOS_ESTUDIO[k])window.ICONOS_ESTUDIO[k]=v; });

/* El juego del estudio (círculos, rectángulos, líneas…) se pasa a trazados para usarlo como ÍCONO DE PIEZA
   (ICONS: lienzo, PNG y SVG editable pintan solo trazados «d»). Claves «ui-…». */
function aTrazados(cuerpo){
  const doc=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${cuerpo}</svg>`,"image/svg+xml");
  const out=[], n=v=>+v||0;
  doc.documentElement.querySelectorAll("*").forEach(el=>{
    const t=el.tagName.toLowerCase(), a=x=>el.getAttribute(x);
    if(t==="path")out.push(a("d"));
    else if(t==="circle"||t==="ellipse"){ const cx=n(a("cx")),cy=n(a("cy")),rx=n(a("r")||a("rx")),ry=n(a("r")||a("ry"));
      out.push(`M${cx-rx} ${cy}a${rx} ${ry} 0 1 0 ${2*rx} 0a${rx} ${ry} 0 1 0 ${-2*rx} 0`); }
    else if(t==="line")out.push(`M${n(a("x1"))} ${n(a("y1"))}L${n(a("x2"))} ${n(a("y2"))}`);
    else if(t==="rect"){ const x=n(a("x")),y=n(a("y")),w=n(a("width")),h=n(a("height")),r=Math.min(n(a("rx")||a("ry")),w/2,h/2);
      out.push(r?`M${x+r} ${y}h${w-2*r}a${r} ${r} 0 0 1 ${r} ${r}v${h-2*r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w-2*r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h-2*r)}a${r} ${r} 0 0 1 ${r} ${-r}z`
        :`M${x} ${y}h${w}v${h}h${-w}z`); }
    else if(t==="polyline"||t==="polygon"){ const p=(a("points")||"").trim().split(/[\s,]+/); let d="";
      for(let i=0;i+1<p.length;i+=2)d+=(i?"L":"M")+p[i]+" "+p[i+1]; out.push(d+(t==="polygon"?"z":"")); }
  });
  return out.filter(Boolean);
}
try{ Object.entries(window.ICONOS_ESTUDIO||{}).forEach(([k,v])=>{
  const clave="ui-"+k; if(!ICONS[clave])ICONS[clave]={d:aTrazados(v),k:"interfaz estudio "+k.replace(/-/g," ")}; }); }catch(_){}

/* ---------------------------------------------------------- tamaños de diseño */
const PRESETS=[
  {k:"ig-post",n:"Instagram · publicación",cat:"Redes sociales",w:1080,h:1080},
  {k:"ig-4x5",n:"Instagram · vertical 4:5",cat:"Redes sociales",w:1080,h:1350},
  {k:"ig-story",n:"Instagram · historia",cat:"Redes sociales",w:1080,h:1920},
  {k:"wa-estado",n:"WhatsApp · estado",cat:"Redes sociales",w:1080,h:1920},
  {k:"fb-post",n:"Facebook · publicación",cat:"Redes sociales",w:1200,h:630},
  {k:"fb-portada",n:"Facebook · portada",cat:"Redes sociales",w:1640,h:624},
  {k:"x-post",n:"X · publicación",cat:"Redes sociales",w:1600,h:900},
  {k:"x-cabecera",n:"X · cabecera",cat:"Redes sociales",w:1500,h:500},
  {k:"yt-miniatura",n:"YouTube · miniatura",cat:"Video y pantallas",w:1280,h:720},
  {k:"panoramica",n:"Presentación o video 16:9",cat:"Video y pantallas",w:1920,h:1080},
  {k:"banner",n:"Banner web 3:1",cat:"Video y pantallas",w:1920,h:640},
  {k:"a4",n:"A4 vertical",cat:"Impresión",w:794,h:1123,mm:[210,297]},
  {k:"a4h",n:"A4 horizontal",cat:"Impresión",w:1123,h:794,mm:[297,210]},
  {k:"carta",n:"Carta",cat:"Impresión",w:816,h:1056,mm:[216,279]},
  {k:"a5",n:"Volante A5",cat:"Impresión",w:559,h:794,mm:[148,210]},
];
const presetDe=(w,h)=>PRESETS.find(p=>p.w===w&&p.h===h);
const medida=p=>p.mm?`${p.mm[0]} × ${p.mm[1]} mm`:`${p.w} × ${p.h} px`;
/* la forma del tamaño, en pequeño (tarjeta del inicio y del cambio de tamaño) */
function formaDe(w,h,lado){ lado=lado||44; const k=lado/Math.max(w,h);
  return `<span class="av-forma" style="width:${Math.max(6,redondo(w*k))}px;height:${Math.max(6,redondo(h*k))}px"></span>`; }

/* ---------------------------------------------------------- miniaturas (cola única, caché) */
const cache=new Map(); let cola=Promise.resolve();
function huella(p){ let s;
  try{ s=JSON.stringify(p,(k,v)=>k==="src"&&typeof v==="string"?v.length+":"+v.slice(-40):v); }catch(_){ s=String(Math.random()); }
  let h=5381; for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36)+s.length; }
function miniatura(clave,fabrica,ancho,png){
  if(cache.has(clave))return cache.get(clave);
  const pr=cola=cola.then(async()=>{
    const pz=fabrica(); if(!pz||!pz.doc)return "";
    const objs=(pz.objects||[]).map((o,i)=>({...o,id:o.id||("m"+i)}));
    const cv=await E.Export.renderEstado(pz.doc,objs,Math.min(1,(ancho||200)/pz.doc.w));
    return png?cv.toDataURL("image/png"):cv.toDataURL("image/jpeg",.8);
  }).catch(()=>"");
  cache.set(clave,pr);
  if(cache.size>400)cache.delete(cache.keys().next().value);
  return pr;
}
/* las miniaturas se pintan al entrar en pantalla */
const vigia=("IntersectionObserver" in window)?new IntersectionObserver(ents=>ents.forEach(en=>{
  if(!en.isIntersecting)return; vigia.unobserve(en.target); const f=en.target._fab; if(f)f(); }),{rootMargin:"200px"}):null;
function diferir(el,fn){ if(vigia){ el._fab=fn; vigia.observe(el); } else fn(); }

/* ---------------------------------------------------------- capas modales del estudio */
function capa(id,clase){
  let c=document.getElementById(id);
  if(!c){ c=document.createElement("div"); c.id=id; c.className="av-capa "+(clase||""); document.body.appendChild(c); }
  return c;
}
const capasAbiertas=()=>[...document.querySelectorAll(".av-capa.on")];
function dialogo(titulo,cuerpo,{aceptar="Aceptar",ancho=520,alAceptar,alAbrir}={}){
  const c=capa("av-dialogo","av-capa--dialogo");
  c.innerHTML=`<div class="av-dialogo est-modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}" style="width:min(${ancho}px,94vw)">
    <div class="av-dialogo__cab"><h3>${esc(titulo)}</h3><span class="est-empuje"></span>
      <button class="est-boton est-boton--icono" data-av="cerrar" title="Cerrar (Esc)" aria-label="Cerrar">${ic("cerrar")}</button></div>
    <div class="av-dialogo__cuerpo">${cuerpo}</div>
    ${alAceptar?`<div class="av-dialogo__pie"><button class="est-boton est-boton--borde" data-av="cerrar">Cancelar</button>
      <button class="est-boton est-boton--primario" data-av="ok">${esc(aceptar)}</button></div>`:""}</div>`;
  c.classList.add("on");
  const cerrar=()=>{ c.classList.remove("on"); c.innerHTML=""; };
  c.querySelectorAll('[data-av="cerrar"]').forEach(b=>b.onclick=cerrar);
  c.onpointerdown=e=>{ if(e.target===c)cerrar(); };
  const ok=c.querySelector('[data-av="ok"]');
  if(ok)ok.onclick=async()=>{ ok.disabled=true; try{ if(await alAceptar(c)!==false)cerrar(); }catch(err){ toast("No se pudo: "+err.message); } finally{ ok.disabled=false; } };
  if(alAbrir)alAbrir(c,cerrar);
  const f=c.querySelector("input,textarea,select"); if(f)setTimeout(()=>f.focus(),30);
  return {capa:c,cerrar};
}

/* ---------------------------------------------------------- crear y agregar */
function centrarYAgregar(objs,nombre,{fondo=false,seleccionar=true,agrupar=true}={}){
  const doc=E.State.st.doc;
  const minX=Math.min(...objs.map(o=>o.x)),minY=Math.min(...objs.map(o=>o.y));
  const maxX=Math.max(...objs.map(o=>o.x+o.w)),maxY=Math.max(...objs.map(o=>o.y+(o.h||60)));
  const dx=redondo((doc.w-(maxX-minX))/2)-minX, dy=redondo((doc.h-(maxY-minY))/2)-minY, gid=uid();
  objs.forEach(o=>{ o.x+=dx; o.y+=dy; if(agrupar&&objs.length>1)o.groupId=gid; o.id=o.id||uid(); });
  if(fondo)E.State.st.objects.unshift(...objs); else E.State.st.objects.push(...objs);
  E.Render.all(); if(seleccionar)E.State.setSel(objs.map(o=>o.id)); E.Layers.refresh();
  E.History.snap(nombre||"Añadir elemento");
  return objs;
}
const base=()=>{ const d=E.State.st.doc; return Math.min(d.w,d.h*1.1); };

/* nuevo diseño en blanco de un tamaño (edición nueva; la anterior queda guardada) */
function crearDiseno(p){
  try{ E.Ediciones.persistir(); }catch(_){}
  const st=E.State.st;
  st.objects=[]; st.guides={v:[],h:[]};
  st.doc={w:p.w,h:p.h,bg:{type:"solid",c1:T("neutral.100"),c2:T("fondos.blanco"),angle:180}};
  if(p.mm)st.doc.mm={w:p.mm[0],h:p.mm[1]};
  /* lienzo papel → paleta «Papel»: los textos y acentos nuevos se leen sobre el fondo */
  if(FAMILIAS["Papel"]){ st.pal="Papel"; st.palVar=0; st.palRoles=E.Pal.rolesDe("Papel",0); }
  E.State.setSel([]); E.View.applyDocSize(); E.Render.all(); E.View.fit(); E.Panels.syncDocSel();
  E.Ediciones.nueva((p.n||"Diseño")+" · "+hoy());
  E.History.snap("Nuevo diseño: "+(p.n||p.w+"×"+p.h));
  if(E.Panels.panelActual()==="edi")E.Panels.paint();
  toast(`Nuevo diseño: ${p.n||"personalizado"} · ${medida(p)}`);
}

/* ============================================================ INICIO */
const Inicio=(()=>{
  let filtroCat="", filtroFmt="", q="";
  const info={};   // formato de cada plantilla de marca (sin pintarla)
  function fmtDe(w,h){ const r=h/w; return r>1.5?"historia":r>1.08?"vertical":r>0.92?"cuadrado":"horizontal"; }
  function plantillas(){
    const out=[];
    E.Tpl.brand.forEach((d,i)=>{
      if(!info[i]){ try{ const p=d.make(); info[i]={w:p.doc.w,h:p.doc.h}; }catch(_){ info[i]={w:1080,h:1080}; } }
      out.push({clave:"t:"+i,nombre:d.name,desc:d.desc||"",cat:d.cat,w:info[i].w,h:info[i].h,abrir:()=>E.Tpl.loadBrand(i),fab:()=>d.make()});
    });
    E.Tpl.mine().forEach((t,i)=>out.push({clave:"m:"+i+":"+huella(t).slice(0,10),nombre:t.name,desc:"Mi plantilla",cat:"Mis plantillas",
      w:t.doc.w,h:t.doc.h,abrir:()=>E.Tpl.loadMine(i),fab:()=>t}));
    return out;
  }
  function tarjeta(it,extra){
    return `<button class="av-tarjeta" data-clave="${esc(it.clave)}" title="${esc(it.nombre)}${it.desc?" — "+esc(it.desc):""}">
      <span class="av-tarjeta__img" style="aspect-ratio:${it.w}/${it.h}"><img alt="" loading="lazy"></span>
      <span class="av-tarjeta__nom">${esc(it.nombre)}</span><span class="av-tarjeta__meta">${esc(extra||"")}</span></button>`;
  }
  function enlazar(cont,items){
    cont.querySelectorAll(".av-tarjeta").forEach(el=>{
      const it=items.find(x=>x.clave===el.dataset.clave); if(!it)return;
      el.onclick=()=>{ cerrar(); it.abrir(); };
      diferir(el,()=>miniatura(it.clave,it.fab,220).then(u=>{ const im=el.querySelector("img"); if(u&&im){im.src=u; el.classList.add("lista");} }));
    });
  }
  function pintar(){
    const c=capa("av-inicio","av-capa--inicio"), act=E.Ediciones.actual;
    const cats=[...new Set(E.Tpl.brand.map(t=>t.cat))];
    const chip=(v,t,on,attr)=>`<button class="est-chip${on?" on":""}" ${attr}="${esc(v)}">${esc(t)}</button>`;
    const grupos=[...new Set(PRESETS.map(p=>p.cat))];
    c.innerHTML=`<div class="av-inicio" role="dialog" aria-modal="true" aria-label="Inicio">
      <header class="av-inicio__cab">
        <span class="av-inicio__titulo">${ic("inicio","ico--lg")}Inicio</span>
        <label class="av-busca">${ic("buscar")}<input type="search" id="av-q" placeholder="Buscar plantillas y diseños: dato, comunicado, historia…" value="${esc(q)}"></label>
        <span class="est-empuje"></span>
        ${act?`<button class="est-boton est-boton--primario" id="av-seguir" title="Volver a la edición abierta (Esc)">Seguir con «${esc(act.nombre.slice(0,38))}»</button>`:""}
        <button class="est-boton est-boton--icono" id="av-cerrar" title="Cerrar (Esc)" aria-label="Cerrar">${ic("cerrar")}</button>
      </header>
      <div class="av-inicio__cuerpo">
        <section class="av-seccion"><h4>Crear un diseño</h4>
          ${grupos.map(g=>`<div class="av-sub">${esc(g)}</div><div class="av-presets">`+
            PRESETS.filter(p=>p.cat===g).map(p=>`<button class="av-preset" data-preset="${p.k}" title="${esc(p.n)} · ${medida(p)}">
              <span class="av-preset__caja">${formaDe(p.w,p.h)}</span><span class="av-preset__nom">${esc(p.n)}</span>
              <span class="av-preset__med">${medida(p)}</span></button>`).join("")+`</div>`).join("")}
          <div class="av-sub">Personalizado</div>
          <div class="av-custom"><input type="number" id="av-w" min="16" max="20000" value="1080" aria-label="Ancho"> ×
            <input type="number" id="av-h" min="16" max="20000" value="1080" aria-label="Alto">
            <select id="av-u" aria-label="Unidad"><option value="px">px</option><option value="mm">mm (impresión)</option></select>
            <button class="est-boton est-boton--borde" id="av-crear">${ic("mas")}Crear diseño</button>
            <button class="est-boton" id="av-svg" title="Abrir un SVG exportado como «SVG editable» y trabajado en Inkscape">${ic("subir")}Importar SVG de Inkscape</button></div>
        </section>
        <section class="av-seccion"><h4>Diseños recientes</h4><div class="av-galeria" id="av-rec"></div></section>
        <section class="av-seccion"><h4>Plantillas</h4>
          <div class="av-chips" id="av-cats">${chip("","Todas",!filtroCat,"data-cat")}${cats.map(x=>chip(x,x.replace(/^[^\wÁÉÍÓÚáéíóúÑñ¿¡]+/,"").trim(),filtroCat===x,"data-cat")).join("")}${E.Tpl.mine().length?chip("Mis plantillas","Mis plantillas",filtroCat==="Mis plantillas","data-cat"):""}</div>
          <div class="av-chips" id="av-fmts">${[["","Todos los formatos"],["cuadrado","Cuadrado"],["vertical","Vertical"],["historia","Historia"],["horizontal","Horizontal"]].map(([v,t])=>chip(v,t,filtroFmt===v,"data-fmt")).join("")}</div>
          <div class="av-galeria" id="av-tpl"></div></section>
      </div></div>`;
    c.classList.add("on");
    c.querySelector("#av-cerrar").onclick=cerrar;
    const seguir=c.querySelector("#av-seguir"); if(seguir)seguir.onclick=cerrar;
    c.querySelectorAll("[data-preset]").forEach(b=>b.onclick=()=>{ cerrar(); crearDiseno(PRESETS.find(p=>p.k===b.dataset.preset)); });
    c.querySelector("#av-crear").onclick=()=>{
      const u=c.querySelector("#av-u").value, w=+c.querySelector("#av-w").value, h=+c.querySelector("#av-h").value;
      if(!(w>=16&&h>=16)){ toast("Indica ancho y alto"); return; }
      const p=u==="mm"?{n:`Impresión ${w}×${h} mm`,w:redondo(w*96/25.4),h:redondo(h*96/25.4),mm:[w,h]}:{n:`Personalizado ${w}×${h}`,w:redondo(w),h:redondo(h)};
      cerrar(); crearDiseno(p); };
    c.querySelector("#av-svg").onclick=()=>{ cerrar(); E.SvgImport.elegir(); };
    c.querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{ filtroCat=b.dataset.cat; pintar(); });
    c.querySelectorAll("[data-fmt]").forEach(b=>b.onclick=()=>{ filtroFmt=b.dataset.fmt; pintar(); });
    const iq=c.querySelector("#av-q");
    iq.oninput=()=>{ q=iq.value; galerias(c); };
    galerias(c);
  }
  function galerias(c){
    const qq=q.toLowerCase().trim(), coincide=t=>!qq||t.toLowerCase().includes(qq);
    /* recientes: las ediciones guardadas (no archivadas), la más nueva primero */
    const eds=E.Ediciones.lista().filter(e=>!e.archivado&&coincide(e.nombre)).sort((a,b)=>b.fecha-a.fecha).slice(0,12);
    const recItems=eds.map(e=>{ const p=e.paginas[0]||{doc:{w:1080,h:1080}};
      return {clave:"e:"+e.id+":"+e.fecha,nombre:e.nombre,w:p.doc.w,h:p.doc.h,abrir:()=>E.Ediciones.abrir(e.id),fab:()=>p,
        meta:new Date(e.fecha).toLocaleDateString("es-PE",{day:"2-digit",month:"short"})+(e.paginas.length>1?` · ${e.paginas.length} págs.`:"")+(e.favorito?" · ★":"")}; });
    const rec=c.querySelector("#av-rec");
    rec.innerHTML=recItems.length?recItems.map(it=>tarjeta(it,it.meta)).join(""):`<p class="est-nota">${qq?"Ningún diseño con «"+esc(q)+"».":"Aún no hay diseños guardados: crea uno arriba o parte de una plantilla."}</p>`;
    enlazar(rec,recItems);
    let items=plantillas().filter(it=>(!filtroCat||it.cat===filtroCat)&&(!filtroFmt||fmtDe(it.w,it.h)===filtroFmt)&&
      (coincide(it.nombre)||coincide(it.desc)||coincide(it.cat)));
    const g=c.querySelector("#av-tpl");
    g.innerHTML=items.length?items.map(it=>tarjeta(it,`${it.w} × ${it.h}${it.desc?" · "+it.desc:""}`)).join(""):`<p class="est-nota">Sin plantillas para ese filtro.</p>`;
    enlazar(g,items);
  }
  function abrir(){ pintar(); }
  function cerrar(){ const c=document.getElementById("av-inicio"); if(c){ c.classList.remove("on"); c.innerHTML=""; } }
  return {abrir,cerrar};
})();
Avz.inicio=Inicio;

/* ============================================================ COMPUESTOS: gráficos, tablas, QR */
function serie(i){ const v=cssVar("--datos-"+(i%6+1)); return v||[T("puka.600"),T("qillu.600"),T("neutral.700"),T("puka.300"),T("qillu.400"),T("neutral.500")][i%6]; }
function coloresDe(op,n){ const R=roles();
  if(op.colores==="acento")return Array.from({length:n},(_,i)=>i===0?R.brandA:_mix(R.brandA,R.bg,Math.min(.75,.18*i)));
  return Array.from({length:n},(_,i)=>serie(i)); }
const numero=v=>{ const s=String(v).replace(/\s/g,"").replace(/,(?=\d{1,2}$)/,".").replace(/,/g,""); const x=parseFloat(s); return isFinite(x)?x:0; };
const fmtNum=(v,op)=>(Number.isInteger(v)?v.toLocaleString("es-PE"):v.toLocaleString("es-PE",{maximumFractionDigits:1}))+(op.sufijo||"");
function leerFilas(txt){ return String(txt||"").split(/\n/).map(l=>l.trim()).filter(Boolean)
  .map(l=>l.split(/\t|;|\|/).map(c=>c.trim())); }

/* gráficos: columnas, barras, circular, anillo — en coordenadas locales 0..W × 0..H */
function grafico(datos,op,W,H){
  const R=roles(), n=Math.max(1,datos.length), col=coloresDe(op,n), o=[];
  const T_=p=>NEW.text({font:"Inter",weight:600,color:R.text,palRole:"text",lh:1.15,...p});
  const max=Math.max(...datos.map(d=>d.v),0)||1;
  if(op.tipo==="columnas"){
    const fs=Math.max(12,redondo(Math.min(W/n*.2,H*.065))), labH=fs*1.9, valH=op.valores?fs*1.6:0, areaH=H-labH-valH;
    const gap=W/n*.26, bw=(W-gap*(n-1))/n;
    datos.forEach((d,i)=>{ const bh=Math.max(2,areaH*Math.max(0,d.v)/max), x=i*(bw+gap), y=valH+areaH-bh;
      o.push(NEW.shape({name:"Gráfico · columna "+(i+1),shape:"rect",x,y,w:bw,h:bh,radius:redondo(Math.min(10,bw*.1)),fill:{type:"solid",c1:col[i],c2:col[i],angle:90}}));
      if(op.valores)o.push(T_({name:"Gráfico · valor "+(i+1),text:fmtNum(d.v,op),x:x-gap/2,y:y-fs*1.35,w:bw+gap,size:fs,weight:700,align:"center"}));
      o.push(T_({name:"Gráfico · etiqueta "+(i+1),text:d.e,font:"Source Sans 3",weight:600,x:x-gap/2,y:valH+areaH+fs*.4,w:bw+gap,size:redondo(fs*.9),align:"center",color:R.muted,palRole:"muted"})); });
    o.push(NEW.shape({name:"Gráfico · eje",shape:"rect",x:0,y:valH+areaH,w:W,h:Math.max(2,redondo(fs*.12)),fill:{type:"solid",c1:R.muted,c2:R.muted,angle:90},palRole:"muted"}));
  } else if(op.tipo==="barras"){
    const rowH=H/n, fs=Math.max(12,redondo(Math.min(rowH*.36,W*.045))), labW=W*.3, valW=op.valores?fs*4.2:0, bh=rowH*.62;
    datos.forEach((d,i)=>{ const y=i*rowH+(rowH-bh)/2, bw=Math.max(2,(W-labW-valW)*Math.max(0,d.v)/max);
      o.push(T_({name:"Gráfico · etiqueta "+(i+1),text:d.e,font:"Source Sans 3",weight:600,x:0,y:y+bh/2-fs*.62,w:labW-fs*.6,size:fs,align:"right",color:R.text}));
      o.push(NEW.shape({name:"Gráfico · barra "+(i+1),shape:"rect",x:labW,y,w:bw,h:bh,radius:redondo(Math.min(10,bh*.18)),fill:{type:"solid",c1:col[i],c2:col[i],angle:90}}));
      if(op.valores)o.push(T_({name:"Gráfico · valor "+(i+1),text:fmtNum(d.v,op),x:labW+bw+fs*.5,y:y+bh/2-fs*.62,w:valW,size:fs,weight:700})); });
  } else {   /* circular o anillo */
    const total=datos.reduce((t,d)=>t+Math.max(0,d.v),0)||1, ancho=W>=H*1.3;
    const S=ancho?Math.min(H,W*.55):Math.min(W,H*.64), r0=op.tipo==="anillo"?27:0, f=v=>+v.toFixed(3);
    const pt=(a,r)=>[50+r*Math.cos(a),50+r*Math.sin(a)];
    let a=-Math.PI/2;
    datos.forEach((d,i)=>{ const fr=Math.max(0,d.v)/total; if(fr<=0)return;
      let p;
      if(fr>=.9999){ p=`M50 0A50 50 0 1 1 49.99 0Z`+(r0?`M50 ${50-r0}A${r0} ${r0} 0 1 0 50.01 ${50-r0}Z`:""); }
      else{ const a1=a+fr*Math.PI*2, L=fr>.5?1:0, [x0,y0]=pt(a,50), [x1,y1]=pt(a1,50);
        if(r0){ const [i0,j0]=pt(a,r0), [i1,j1]=pt(a1,r0);
          p=`M${f(x0)} ${f(y0)}A50 50 0 ${L} 1 ${f(x1)} ${f(y1)}L${f(i1)} ${f(j1)}A${r0} ${r0} 0 ${L} 0 ${f(i0)} ${f(j0)}Z`; }
        else p=`M50 50L${f(x0)} ${f(y0)}A50 50 0 ${L} 1 ${f(x1)} ${f(y1)}Z`;
        a=a1; }
      o.push(NEW.shape({name:"Gráfico · sector "+(i+1),shape:"path",d:p,x:0,y:0,w:S,h:S,fill:{type:"solid",c1:col[i],c2:col[i],angle:90}})); });
    /* leyenda con porcentaje */
    const fs=Math.max(12,redondo(S*.065)), paso=fs*1.8;
    const lx=ancho?S+S*.1:0, ly0=ancho?Math.max(0,(S-paso*n)/2):S+fs;
    datos.forEach((d,i)=>{ const y=ly0+i*paso;
      o.push(NEW.shape({name:"Leyenda · color "+(i+1),shape:"rect",x:lx,y:y+fs*.1,w:fs,h:fs,radius:redondo(fs*.2),fill:{type:"solid",c1:col[i],c2:col[i],angle:90}}));
      const pc=Math.round(Math.max(0,d.v)/total*1000)/10;
      o.push(T_({name:"Leyenda · "+(i+1),text:`${d.e} · ${op.valores?fmtNum(d.v,op)+" · ":""}${pc.toLocaleString("es-PE")}%`,font:"Source Sans 3",x:lx+fs*1.6,y:y-fs*.05,w:Math.max(fs*6,(ancho?W-lx:W)-fs*1.6),size:fs})); });
  }
  return o;
}
function tabla(filas,op,W){
  const R=roles(), nf=filas.length, nc=Math.max(...filas.map(f=>f.length),1);
  const fs=Math.max(12,redondo(Math.min(36,W/nc*.085))), rowH=redondo(fs*2.3), cw=W/nc, pad=redondo(fs*.6), o=[];
  filas.forEach((f,i)=>{ const cab=op.encabezado&&i===0, alt=op.alternas&&!cab&&(i%2===(op.encabezado?0:1));
    const fondo=cab?R.brandA:alt?R.soft:R.bg, rol=cab?"brandA":alt?"soft":"bg";
    for(let j=0;j<nc;j++){ const x=j*cw, y=i*rowH, t=f[j]||"", num=/^[-+]?[\d.,\s]+%?$/.test(t)&&!cab;
      o.push(NEW.shape({name:`Tabla · celda ${i+1}.${j+1}`,shape:"rect",x,y,w:cw,h:rowH,stroke:{c:R.muted,w:cab?0:1},
        fill:{type:"solid",c1:fondo,c2:fondo,angle:90},palRole:rol}));
      if(t)o.push(NEW.text({name:`Tabla · texto ${i+1}.${j+1}`,text:t,font:cab?"Archivo":(num?"Inter":"Source Sans 3"),weight:cab?700:(num?600:400),
        size:fs,lh:1.2,x:x+pad,y:y+(rowH-fs*1.2)/2,w:cw-2*pad,align:num?"right":"left",
        color:cab?R.ctaText:R.text,palRole:cab?"ctaText":"text"})); }
  });
  return {objs:o,h:nf*rowH};
}
function qr(texto,op,S){
  const R=roles(), m=QR.codificar(texto,op.nivel||"M");
  const oscuro=op.color==="acento"?T("puka.800"):T("neutral.900"), claro=T("fondos.blanco");
  return [NEW.shape({name:"QR · fondo",shape:"rect",x:0,y:0,w:S,h:S,radius:redondo(S*.04),fill:{type:"solid",c1:claro,c2:claro,angle:90}}),
    NEW.shape({name:"Código QR · "+String(texto).slice(0,40),shape:"path",d:QR.trazado(m,3),x:0,y:0,w:S,h:S,fill:{type:"solid",c1:oscuro,c2:oscuro,angle:90}})];
}
/* un compuesto lleva sus datos en cada miembro (comp) para poder editarlo luego */
function componer(comp,W,H){
  if(comp.tipo==="grafico")return {objs:grafico(comp.datos,comp.op,W,H),w:W,h:H};
  if(comp.tipo==="tabla"){ const t=tabla(comp.filas,comp.op,W); return {objs:t.objs,w:W,h:t.h}; }
  if(comp.tipo==="qr"){ const S=Math.min(W,H); return {objs:qr(comp.texto,comp.op,S),w:S,h:S}; }
  return {objs:[],w:W,h:H};
}
function insertarCompuesto(comp,W,H){
  const r=componer(comp,W,H); if(!r.objs.length)return;
  r.objs.forEach(o=>o.comp=deep(comp));
  centrarYAgregar(r.objs,{grafico:"Añadir gráfico",tabla:"Añadir tabla",qr:"Añadir código QR"}[comp.tipo]);
}
/* rehace el compuesto seleccionado en su mismo lugar y orden de capas */
function rehacerCompuesto(gid,comp){
  const st=E.State.st, miembros=st.objects.filter(o=>o.groupId===gid); if(!miembros.length)return;
  const x=Math.min(...miembros.map(o=>o.x)), y=Math.min(...miembros.map(o=>o.y));
  const w=Math.max(...miembros.map(o=>o.x+o.w))-x, h=Math.max(...miembros.map(o=>o.y+o.h))-y;
  const idx=st.objects.indexOf(miembros[0]);
  const r=componer(comp,w,h);
  r.objs.forEach(o=>{ o.x+=x; o.y+=y; o.groupId=gid; o.comp=deep(comp); o.id=uid(); });
  st.objects=st.objects.filter(o=>o.groupId!==gid); st.objects.splice(Math.min(idx,st.objects.length),0,...r.objs);
  E.Render.all(); E.State.setSel(r.objs.map(o=>o.id)); E.History.snap("Editar datos");
}
function dlgGrafico(prev,gid){
  const op=(prev&&prev.op)||{tipo:"columnas",valores:true,sufijo:"",colores:"marca"};
  const datos=(prev&&prev.datos)||[{e:"Ene",v:12},{e:"Feb",v:19},{e:"Mar",v:15},{e:"Abr",v:24}];
  const tipos=[["columnas","Columnas"],["barras","Barras"],["circular","Circular"],["anillo","Anillo"]];
  dialogo(gid?"Editar gráfico":"Gráfico",`
    <div class="est-segmentado av-ancho" id="g-tipo">${tipos.map(([k,t])=>`<button data-t="${k}" class="${op.tipo===k?"on":""}">${t}</button>`).join("")}</div>
    <div class="av-dos">
      <label class="av-campo">Datos: una fila por barra, «etiqueta; valor»
        <textarea id="g-datos" rows="8" spellcheck="false">${esc(datos.map(d=>d.e+"; "+d.v).join("\n"))}</textarea></label>
      <div class="av-vista" id="g-vista"></div></div>
    <div class="av-fila"><label><input type="checkbox" id="g-val" ${op.valores?"checked":""}> Mostrar valores</label>
      <label>Sufijo <input type="text" id="g-suf" value="${esc(op.sufijo||"")}" placeholder="%, mil, S/" style="width:80px"></label>
      <label>Colores <select id="g-col"><option value="marca" ${op.colores!=="acento"?"selected":""}>Serie de datos de la marca</option>
        <option value="acento" ${op.colores==="acento"?"selected":""}>Tonos del acento de la paleta</option></select></label></div>
    <p class="est-nota">Se arma con formas y textos de la marca: se edita, recolorea y exporta (también al SVG de Inkscape) como el resto. Para cambiar los datos después: selecciónalo y «Editar datos».</p>`,
  {aceptar:gid?"Aplicar":"Insertar gráfico",ancho:680,alAbrir:c=>{
    let tipo=op.tipo;
    const leer=()=>({datos:leerFilas(c.querySelector("#g-datos").value).map(f=>({e:f[0]||"",v:numero(f[1]||0)})),
      op:{tipo,valores:c.querySelector("#g-val").checked,sufijo:c.querySelector("#g-suf").value,colores:c.querySelector("#g-col").value}});
    let t; const vista=()=>{ clearTimeout(t); t=setTimeout(async()=>{ const d=leer(); if(!d.datos.length)return;
      const W=640,H=400, objs=grafico(d.datos,d.op,W,H).map((o,i)=>({...o,id:"v"+i}));
      const cv=await E.Export.renderEstado({w:W,h:H,bg:{type:"solid",c1:roles().bg}},objs,.5);
      const v=c.querySelector("#g-vista"); if(v){ v.innerHTML=""; v.appendChild(cv); } },120); };
    c.querySelectorAll("#g-tipo button").forEach(b=>b.onclick=()=>{ tipo=b.dataset.t; c.querySelectorAll("#g-tipo button").forEach(x=>x.classList.toggle("on",x===b)); vista(); });
    c.querySelectorAll("textarea,input,select").forEach(el=>el.addEventListener("input",vista));
    vista();
    c._leer=leer;
  },alAceptar:c=>{ const d=c._leer(); if(!d.datos.length){ toast("Escribe al menos una fila «etiqueta; valor»"); return false; }
    const comp={tipo:"grafico",datos:d.datos,op:d.op};
    if(gid)rehacerCompuesto(gid,comp);
    else { const doc=E.State.st.doc, W=redondo(doc.w*.78), H=redondo(Math.min(doc.h*.5,W*.66)); insertarCompuesto(comp,W,H); } }});
}
function dlgTabla(prev,gid){
  const op=(prev&&prev.op)||{encabezado:true,alternas:true};
  const filas=(prev&&prev.filas)||[["Indicador","2025","2026"],["Escuelas","120","148"],["Postas","34","41"],["Kilómetros","210","265"]];
  dialogo(gid?"Editar tabla":"Tabla",`
    <label class="av-campo">Contenido: una fila por línea; columnas separadas por «;» o tabulación (puedes pegar desde una hoja de cálculo)
      <textarea id="t-datos" rows="9" spellcheck="false">${esc(filas.map(f=>f.join("; ")).join("\n"))}</textarea></label>
    <div class="av-fila"><label><input type="checkbox" id="t-cab" ${op.encabezado?"checked":""}> Primera fila como encabezado</label>
      <label><input type="checkbox" id="t-alt" ${op.alternas?"checked":""}> Filas alternas</label></div>
    <p class="est-nota">Los números se alinean a la derecha en Inter (regla tipográfica de la marca).</p>`,
  {aceptar:gid?"Aplicar":"Insertar tabla",ancho:620,alAceptar:c=>{
    const f=leerFilas(c.querySelector("#t-datos").value); if(!f.length){ toast("La tabla está vacía"); return false; }
    const comp={tipo:"tabla",filas:f,op:{encabezado:c.querySelector("#t-cab").checked,alternas:c.querySelector("#t-alt").checked}};
    if(gid)rehacerCompuesto(gid,comp); else insertarCompuesto(comp,redondo(E.State.st.doc.w*.84),0); }});
}
function dlgQR(prev,gid){
  const op=(prev&&prev.op)||{nivel:"M",color:"tinta"};
  dialogo(gid?"Editar código QR":"Código QR",`
    <div class="av-dos">
      <div><label class="av-campo">Enlace o texto
        <input type="text" id="q-txt" value="${esc((prev&&prev.texto)||"https://")}" spellcheck="false"></label>
        <div class="av-fila"><label>Corrección <select id="q-niv">${["L","M","Q","H"].map(k=>`<option ${op.nivel===k?"selected":""}>${k}</option>`).join("")}</select></label>
          <label>Color <select id="q-col"><option value="tinta" ${op.color!=="acento"?"selected":""}>Tinta</option><option value="acento" ${op.color==="acento"?"selected":""}>Vino</option></select></label></div>
        <p class="est-nota">Se genera aquí mismo, sin servicios externos. Pruébalo con el celular antes de publicar; deja el margen blanco alrededor.</p></div>
      <div class="av-vista av-vista--qr" id="q-vista"></div></div>`,
  {aceptar:gid?"Aplicar":"Insertar código QR",ancho:600,alAbrir:c=>{
    const vista=()=>{ const v=c.querySelector("#q-vista");
      try{ const m=QR.codificar(c.querySelector("#q-txt").value,c.querySelector("#q-niv").value);
        v.innerHTML=`<svg viewBox="0 0 100 100" width="100%" height="100%"><rect width="100" height="100" fill="${T("fondos.blanco")}"/><path d="${QR.trazado(m,3)}" fill="${c.querySelector("#q-col").value==="acento"?T("puka.800"):T("neutral.900")}"/></svg>
          <span class="est-nota">Versión ${m.version} · ${m.tam}×${m.tam} módulos · corrección ${m.nivel}</span>`; }
      catch(err){ v.innerHTML=`<span class="est-nota">${esc(err.message)}</span>`; } };
    c.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",vista)); vista();
  },alAceptar:c=>{ const t=c.querySelector("#q-txt").value.trim(); if(!t){ toast("Escribe el enlace o el texto"); return false; }
    const comp={tipo:"qr",texto:t,op:{nivel:c.querySelector("#q-niv").value,color:c.querySelector("#q-col").value}};
    if(gid)rehacerCompuesto(gid,comp); else { const S=redondo(Math.min(E.State.st.doc.w,E.State.st.doc.h)*.32); insertarCompuesto(comp,S,S); } }});
}
Avz.grafico=dlgGrafico; Avz.tabla=dlgTabla; Avz.qr=dlgQR;

/* ============================================================ ELEMENTOS */
const MARCOS=[
  {n:"Rectángulo",mask:"none"},{n:"Redondeado",mask:"round"},{n:"Círculo",mask:"circle"},
  {n:"Arco",mask:"path",d:"M0 100V50A50 50 0 0 1 100 50V100Z",r:[.75,1]},
  {n:"Hexágono",mask:"path",d:_ngon(6)},{n:"Rombo",mask:"path",d:_ngon(4)},{n:"Triángulo",mask:"path",d:_ngon(3)},
  {n:"Estrella",mask:"path",d:_star(5,.5)},{n:"Destello",mask:"path",d:_star(8,.72)},
  {n:"Corazón",mask:"path",d:(FORMAS.find(f=>f.n==="Corazón")||{}).d},
  {n:"Gota",mask:"path",d:(FORMAS.find(f=>f.n==="Gota")||{}).d},
  {n:"Orgánica",mask:"path",d:(FORMAS.find(f=>f.n==="Blob 2")||{}).d},
  {n:"Sello",mask:"path",d:_burst(16,40)},
  {n:"Escudo",mask:"path",d:(FORMAS.find(f=>f.n==="Escudo")||{}).d},
].filter(m=>m.mask!=="path"||m.d);
const COLLAGES=[
  {n:"Dos columnas",c:[[0,0,.5,1],[.5,0,.5,1]]},
  {n:"Dos filas",c:[[0,0,1,.5],[0,.5,1,.5]]},
  {n:"Tres columnas",c:[[0,0,1/3,1],[1/3,0,1/3,1],[2/3,0,1/3,1]]},
  {n:"Cuadrícula 2×2",c:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]},
  {n:"Destacada + 2",c:[[0,0,.62,1],[.62,0,.38,.5],[.62,.5,.38,.5]]},
  {n:"Destacada + 3",c:[[0,0,1,.62],[0,.62,1/3,.38],[1/3,.62,1/3,.38],[2/3,.62,1/3,.38]]},
  {n:"Mosaico",c:[[0,0,.5,.6],[.5,0,.5,.4],[0,.6,.5,.4],[.5,.4,.5,.6]]},
  {n:"Cuadrícula 3×3",c:[0,1,2].flatMap(i=>[0,1,2].map(j=>[j/3,i/3,1/3,1/3]))},
];
function marcoFoto(m){
  const d=E.State.st.doc, s=redondo(Math.min(d.w,d.h)*.55), r=m.r||[1,1];
  const o=NEW.image({name:"Marco · "+m.n+" (suelta una foto)",w:redondo(s*r[0]),h:redondo(s*r[1]),mask:m.mask,radius:redondo(s*.08)});
  if(m.mask==="path")o.maskD=m.d;
  E.Panels.add(o);
}
function collage(c){
  const d=E.State.st.doc, g=redondo(Math.min(d.w,d.h)*.012), objs=c.c.map(([x,y,w,h],i)=>NEW.image({name:`Collage · celda ${i+1} (suelta una foto)`,
    x:redondo(x*d.w+(x>0?g/2:0)),y:redondo(y*d.h+(y>0?g/2:0)),w:redondo(w*d.w-(x>0?g/2:0)-(x+w<.999?g/2:0)),h:redondo(h*d.h-(y>0?g/2:0)-(y+h<.999?g/2:0))}));
  objs.forEach(o=>o.id=uid()); E.State.st.objects.unshift(...objs);
  E.Render.all(); E.State.setSel(objs.map(o=>o.id)); E.Layers.refresh(); E.History.snap("Collage: "+c.n);
  toast("Collage al fondo: arrastra fotos del banco sobre cada celda (o doble clic)");
}
/* insignias y stickers de la marca (por roles: siguen la paleta) */
const INSIGNIAS=[
  {n:"Sello «Nuevo»",k:"nuevo novedad",hacer:()=>{ const R=roles(), s=redondo(base()*.22);
    return [NEW.shape({name:"Sello",shape:"path",d:_burst(16,40),w:s,h:s,x:0,y:0,fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"}),
      NEW.text({name:"Sello · texto",text:"NUEVO",font:"Archivo",weight:900,size:redondo(s*.2),x:0,y:redondo(s*.38),w:s,align:"center",upper:true,color:R.ctaText,palRole:"ctaText"})]; }},
  {n:"En vivo",k:"en vivo transmision live",hacer:()=>{ const R=roles(), fs=redondo(base()*.034), h=redondo(fs*2.1), w=redondo(fs*7.8);
    return [NEW.shape({name:"En vivo · fondo",shape:"rect",x:0,y:0,w,h,radius:redondo(h/2),fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"}),
      NEW.shape({name:"En vivo · punto",shape:"ellipse",x:redondo(h*.4),y:redondo(h*.32),w:redondo(h*.36),h:redondo(h*.36),fill:{type:"solid",c1:R.ctaText,c2:R.ctaText,angle:90},palRole:"ctaText"}),
      NEW.text({name:"En vivo · texto",text:"EN VIVO",font:"Archivo",weight:800,size:fs,x:redondo(h*.95),y:redondo((h-fs*1.2)/2),w:w-redondo(h*1.1),ls:1.5,upper:true,color:R.ctaText,palRole:"ctaText"})]; }},
  {n:"Hoy",k:"hoy fecha dia",hacer:()=>{ const R=roles(), s=redondo(base()*.16);
    return [NEW.shape({name:"Hoy · círculo",shape:"ellipse",x:0,y:0,w:s,h:s,fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"}),
      NEW.text({name:"Hoy · texto",text:"HOY",font:"Archivo",weight:900,size:redondo(s*.3),x:0,y:redondo(s*.32),w:s,align:"center",color:R.ctaText,palRole:"ctaText"})]; }},
  {n:"Última hora",k:"urgente ultima hora alerta",hacer:()=>{ const R=roles(), fs=redondo(base()*.04), w=redondo(fs*10), h=redondo(fs*2);
    return [NEW.shape({name:"Última hora · banda",shape:"rect",x:0,y:0,w,h,fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"}),
      NEW.text({name:"Última hora · texto",text:"ÚLTIMA HORA",font:"Archivo",weight:900,size:fs,x:redondo(fs*.6),y:redondo((h-fs*1.2)/2),w:w-redondo(fs*1.2),ls:2,upper:true,color:R.ctaText,palRole:"ctaText"})]; }},
  {n:"Desliza",k:"desliza carrusel siguiente flecha",hacer:()=>{ const R=roles(), fs=redondo(base()*.032);
    return [NEW.text({name:"Desliza · texto",text:"Desliza",font:"Archivo",weight:700,size:fs,x:0,y:0,w:redondo(fs*4.4),color:R.text,palRole:"text"}),
      NEW.shape({name:"Desliza · flecha",shape:"arrow",x:redondo(fs*4.6),y:redondo(fs*.1),w:redondo(fs*3),h:redondo(fs),fill:{type:"none",c1:R.brandA,c2:R.brandA,angle:90},stroke:{c:R.brandA,w:redondo(fs*.14)},palRole:"brandA",palRoleEn:"stroke"})]; }},
  {n:"Contador de página",k:"pagina carrusel 1/5 numero",hacer:()=>{ const R=roles(), fs=redondo(base()*.026), h=redondo(fs*1.9), w=redondo(fs*3.6);
    return [NEW.shape({name:"Contador · fondo",shape:"rect",x:0,y:0,w,h,radius:redondo(h/2),fill:{type:"solid",c1:R.soft,c2:R.soft,angle:90},palRole:"soft"}),
      NEW.text({name:"Contador · texto",text:"1/5",font:"Inter",weight:700,size:fs,x:0,y:redondo((h-fs*1.2)/2),w,align:"center",color:R.text,palRole:"text"})]; }},
  {n:"Comillas",k:"cita frase comillas",hacer:()=>{ const R=roles(), fs=redondo(base()*.24);
    return [NEW.text({name:"Comillas",text:"“",font:"Archivo",weight:900,size:fs,x:0,y:0,w:redondo(fs*.6),lh:1,color:R.brandA,palRole:"brandA"})]; }},
  {n:"Dato",k:"dato cifra etiqueta",hacer:()=>{ const R=roles(), fs=redondo(base()*.03), w=redondo(fs*5), h=redondo(fs*2);
    return [NEW.shape({name:"Dato · fondo",shape:"path",d:(FORMAS.find(f=>f.n==="Etiqueta")||{d:"M0 0H100V100H0Z"}).d,x:0,y:0,w,h,fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"}),
      NEW.text({name:"Dato · texto",text:"EL DATO",font:"Archivo",weight:800,size:fs,x:redondo(fs*.5),y:redondo((h-fs*1.2)/2),w:w-fs,ls:1.5,upper:true,color:R.ctaText,palRole:"ctaText"})]; }},
];
const vis=(svg)=>`<svg viewBox="0 0 100 100" aria-hidden="true">${svg}</svg>`;
function elementos(){
  const R=roles();
  const forma=(s,extra)=>()=>{ const b=NEW.shape({shape:s,...(extra||{})});
    if(s==="line"||s==="arrow"){ b.h=40; b.w=420; b.stroke={c:R.brandA,w:6}; b.fill.type="none"; b.palRole="brandA"; b.palRoleEn="stroke"; }
    else { b.fill.c1=b.fill.c2=R.brandA; b.palRole="brandA"; }
    E.Panels.add(b); };
  const ruta=(nombre,d,w,h)=>()=>E.Panels.add(NEW.shape({name:nombre,shape:"path",d,w:w||320,h:h||320,fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"}));
  const L=[];
  const add=(sec,n,k,prev,hacer)=>L.push({sec,n,k:(n+" "+(k||"")).toLowerCase(),prev,hacer});
  add("Formas","Rectángulo","cuadrado caja",vis('<rect x="14" y="24" width="72" height="52"/>'),forma("rect"));
  add("Formas","Redondeado","pastilla tarjeta",vis('<rect x="14" y="24" width="72" height="52" rx="12"/>'),forma("rect",{radius:28}));
  add("Formas","Círculo","elipse punto",vis('<circle cx="50" cy="50" r="34"/>'),forma("ellipse",{w:300,h:300}));
  add("Formas","Triángulo","",vis('<path d="M50 16 86 82H14Z"/>'),forma("triangle"));
  add("Formas","Estrella","",vis(`<path d="${_star(5,.45)}"/>`),forma("star",{w:300,h:300}));
  add("Formas","Más formas…","biblioteca blob cinta escudo",vis('<path d="M30 30h40v40H30z" opacity=".4"/><path d="M50 18v64M18 50h64" stroke-width="8" stroke="currentColor"/>'),()=>E.Panels.ir("shp"));
  add("Líneas y flechas","Línea","separador",vis('<path d="M12 50h76" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>'),forma("line"));
  add("Líneas y flechas","Línea gruesa","filete barra",vis('<rect x="12" y="44" width="76" height="12"/>'),()=>E.Panels.add(NEW.shape({name:"Filete",shape:"rect",w:420,h:12,fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA"})));
  add("Líneas y flechas","Flecha","derecha conector",vis('<path d="M12 50h62" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><path d="M90 50 66 34v32Z"/>'),forma("arrow"));
  add("Líneas y flechas","Flecha doble","",vis(`<path d="${(FORMAS.find(f=>f.n==="Doble flecha")||{}).d}"/>`),ruta("Flecha doble",(FORMAS.find(f=>f.n==="Doble flecha")||{}).d,420,200));
  add("Líneas y flechas","Flecha bloque","",vis(`<path d="${(FORMAS.find(f=>f.n==="Flecha bloque")||{}).d}"/>`),ruta("Flecha bloque",(FORMAS.find(f=>f.n==="Flecha bloque")||{}).d,360,240));
  add("Líneas y flechas","Cheurón","avance punta",vis(`<path d="${(FORMAS.find(f=>f.n==="Chevron")||{}).d}"/>`),ruta("Cheurón",(FORMAS.find(f=>f.n==="Chevron")||{}).d,240,280));
  MARCOS.forEach(m=>add("Marcos para fotos",m.n,"marco foto mascara recorte "+m.mask,
    vis(m.mask==="path"?`<path d="${m.d}" opacity=".55"/>`:m.mask==="circle"?'<circle cx="50" cy="50" r="40" opacity=".55"/>':`<rect x="12" y="16" width="76" height="68" rx="${m.mask==="round"?12:0}" opacity=".55"/>`)
      +'<path d="m30 66 14-14 10 10 8-8 10 12" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>',()=>marcoFoto(m)));
  COLLAGES.forEach(c=>add("Cuadrículas y collages",c.n,"collage cuadricula fotos grid",
    vis(c.c.map(([x,y,w,h])=>`<rect x="${8+x*84+1.5}" y="${8+y*84+1.5}" width="${w*84-3}" height="${h*84-3}" rx="2" opacity=".55"/>`).join("")),()=>collage(c)));
  INSIGNIAS.forEach(s=>add("Insignias de la marca",s.n,s.k,null,()=>centrarYAgregar(s.hacer(),"Insignia: "+s.n)));
  add("Datos","Columnas","grafico barras estadistica",ic("grafico","ico--lg"),()=>dlgGrafico({op:{tipo:"columnas",valores:true,colores:"marca"},datos:null}));
  add("Datos","Barras","grafico ranking horizontal",ic("grafico","ico--lg"),()=>dlgGrafico({op:{tipo:"barras",valores:true,colores:"marca"},datos:null}));
  add("Datos","Circular","grafico torta pastel porcentaje",ic("torta","ico--lg"),()=>dlgGrafico({op:{tipo:"circular",valores:false,colores:"marca"},datos:[{e:"Sí",v:62},{e:"No",v:28},{e:"No sabe",v:10}]}));
  add("Datos","Anillo","grafico dona porcentaje",ic("torta","ico--lg"),()=>dlgGrafico({op:{tipo:"anillo",valores:false,colores:"marca"},datos:[{e:"Ejecutado",v:68},{e:"Pendiente",v:32}]}));
  add("Datos","Tabla","tabla cuadro filas columnas",ic("tabla","ico--lg"),()=>dlgTabla());
  add("Datos","Código QR","qr enlace codigo",ic("qr","ico--lg"),()=>dlgQR());
  return L;
}
function pintarElementos(lp){
  const R=roles(), q=(Avz._eleQ||"").toLowerCase().trim(), items=elementos().filter(it=>!q||it.k.includes(q)||it.sec.toLowerCase().includes(q));
  const secs=[...new Set(items.map(i=>i.sec))];
  lp.innerHTML=`<div class="p-title">Elementos</div>
    <input type="search" id="eleq" placeholder="Buscar: marco, flecha, gráfico, QR, collage…" value="${esc(Avz._eleQ||"")}" style="width:100%;margin-bottom:6px">
    ${secs.map(s=>`<div class="av-ele-sec">${esc(s)}</div><div class="av-ele ${s==="Insignias de la marca"?"av-ele--ancha":""}">`+
      items.filter(i=>i.sec===s).map(it=>`<button class="av-celda" data-ele="${esc(it.sec+"|"+it.n)}" title="${esc(it.n)}" style="--av-color:${R.brandA}">
        ${it.prev?`<span class="av-celda__vis">${it.prev}</span>`:`<span class="av-celda__vis av-celda__vis--img" data-ins="${esc(it.n)}"></span>`}<span class="av-celda__nom">${esc(it.n)}</span></button>`).join("")+`</div>`).join("")}
    <div class="av-ele-sec">Íconos <button class="av-enlace" id="ele-ico">ver todos (${Object.keys(ICONS).length})</button></div>
    <div class="icon-grid" id="ele-icos"></div>
    <p class="note" style="margin-top:10px">Los marcos y las celdas de collage son <b>fotos con forma</b>: arrastra una foto del banco encima para colocarla, doble clic para <b>recortar</b> dentro del marco. Gráficos, tablas y QR se editan con «Editar datos».</p>`;
  const iq=lp.querySelector("#eleq");
  iq.oninput=()=>{ Avz._eleQ=iq.value; pintarElementos(lp); const n=lp.querySelector("#eleq"); n.focus(); n.setSelectionRange(n.value.length,n.value.length); };
  lp.querySelectorAll("[data-ele]").forEach(b=>b.onclick=()=>{ const it=items.find(x=>x.sec+"|"+x.n===b.dataset.ele); if(it)it.hacer(); });
  /* miniaturas reales de las insignias (con la paleta activa) */
  lp.querySelectorAll("[data-ins]").forEach(el=>{ const s=INSIGNIAS.find(x=>x.n===el.dataset.ins); if(!s)return;
    diferir(el,()=>{ const objs=s.hacer(); const W=Math.max(...objs.map(o=>o.x+o.w))+8, H=Math.max(...objs.map(o=>o.y+(o.type==="text"?o.size*1.3:o.h)))+8;
      miniatura("ins:"+s.n+":"+E.State.st.pal+(E.State.st.palVar||0),()=>({doc:{w:W,h:H,bg:{type:"none"}},objects:objs.map(o=>({...o,x:o.x+4,y:o.y+4}))}),160,true)
        .then(u=>{ if(u)el.style.backgroundImage=`url(${u})`; }); }); });
  const qi=q.replace(/\s+/g," ");
  const icos=Object.entries(ICONS).filter(([n,v])=>!qi||n.includes(qi)||(v.k||"").includes(qi)).slice(0,qi?120:24);
  const g=lp.querySelector("#ele-icos");
  g.innerHTML=icos.map(([n])=>`<button class="icon-cell" data-i="${esc(n)}" title="${esc(n)}">${E.Render.iconSvg({icon:n,color:"currentColor",sw:2})}</button>`).join("");
  g.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>E.Panels.add(NEW.icon({icon:b.dataset.i,color:R.brandA,palRole:"brandA",name:"Ícono · "+b.dataset.i})));
  lp.querySelector("#ele-ico").onclick=()=>E.Panels.ir("ico");
}

/* ============================================================ MARCA: colores, tipografías, estilos, logos */
let diseno=null;   // /api/design (con servidor): fuentes y marca del perfil
const fuentesPerfil=[];
async function cargarDiseno(){
  if(!/^https?:$/.test(location.protocol))return null;
  try{ const r=await fetch("api/design",{cache:"no-store"}); if(!r.ok)return null; diseno=await r.json(); }catch(_){ return null; }
  /* tipografías del perfil (archivos locales): se registran con su familia y peso y entran en el selector */
  const PESOS={thin:100,hairline:100,extralight:200,ultralight:200,light:300,regular:400,book:400,normal:400,medium:500,
    semibold:600,demibold:600,bold:700,extrabold:800,ultrabold:800,black:900,heavy:900};
  for(const [nom,url] of Object.entries((diseno&&diseno.fuentes)||{})){
    const partes=nom.replace(/\[.*?\]/g,"").split(/[-_]/), fam=partes[0].replace(/([a-z])([A-Z])/g,"$1 $2").trim();
    const resto=partes.slice(1).join("").toLowerCase(), italica=/italic|oblique/.test(resto), estilo=resto.replace(/italic|oblique/,"");
    const peso=PESOS[estilo]||400;
    try{ const ff=new FontFace(fam,`url("${url}")`,{weight:String(peso),style:italica?"italic":"normal"}); document.fonts.add(ff); ff.load().catch(()=>{});
      if(!FONTS.includes(fam)){ FONTS.push(fam); fuentesPerfil.push(fam); } }catch(_){}
  }
  if(E.Panels.panelActual()==="mar")E.Panels.paint();
  return diseno;
}
const ESTILOS=[
  {k:"titular",n:"Titular",font:"Archivo",weight:900,r:.085,lh:1.06,rol:"text",ej:"Titular de la pieza"},
  {k:"subtitulo",n:"Subtítulo",font:"Archivo",weight:600,r:.046,lh:1.15,rol:"text",ej:"Subtítulo de apoyo"},
  {k:"antetitulo",n:"Antetítulo",font:"Archivo",weight:700,r:.028,lh:1.2,ls:2.4,upper:true,rol:"brandA",ej:"ANTETÍTULO"},
  {k:"cuerpo",n:"Cuerpo",font:"Source Sans 3",weight:400,r:.032,lh:1.4,rol:"text",ej:"Texto corrido, claro y con datos."},
  {k:"cita",n:"Cita",font:"Source Sans 3",weight:600,italic:true,r:.046,lh:1.3,rol:"text",ej:"«Una frase que moviliza.»"},
  {k:"cifra",n:"Cifra",font:"Inter",weight:700,r:.2,lh:1,ls:-2,rol:"brandA",ej:"88%"},
  {k:"pie",n:"Pie de foto",font:"Source Sans 3",weight:400,r:.024,lh:1.35,rol:"muted",ej:"Pie de foto o fuente"},
];
const PARES=[
  {n:"Institucional",t:"Archivo",tw:900,c:"Source Sans 3"},
  {n:"Datos",t:"Inter",tw:700,c:"Source Sans 3"},
  {n:"Editorial",t:"Archivo",tw:800,c:"Inter"},
  {n:"Lectura fácil",t:"Atkinson Hyperlegible",tw:700,c:"Atkinson Hyperlegible"},
];
function aplicarEstilo(o,es){ const R=roles();
  Object.assign(o,{font:es.font,weight:es.weight,italic:!!es.italic,size:Math.max(8,redondo(base()*es.r)),lh:es.lh,ls:es.ls||0,upper:!!es.upper,
    color:R[es.rol],palRole:es.rol}); if(o.colorG)o.colorG.on=false; }
function usarEstilo(es){
  const textos=E.State.selObjs().filter(o=>o.type==="text");
  if(textos.length){ textos.forEach(o=>aplicarEstilo(o,es)); E.Render.all(); E.History.snap("Estilo: "+es.n); E.Props.refresh(); return; }
  const d=E.State.st.doc, o=NEW.text({name:es.n,text:es.ej,w:redondo(d.w*.8)}); aplicarEstilo(o,es); E.Panels.add(o);
}
function usarPar(p){
  const textos=E.State.selObjs().filter(o=>o.type==="text");
  if(textos.length){ const max=Math.max(...textos.map(o=>o.size));
    textos.forEach(o=>{ if(o.size>=max*.75){ o.font=p.t; o.weight=p.tw; } else { o.font=p.c; if(o.weight>600)o.weight=600; } });
    E.Render.all(); E.History.snap("Tipografías: "+p.n); E.Props.refresh(); return; }
  const R=roles(), d=E.State.st.doc, b=base();
  const t=NEW.text({name:"Título",text:"Titular de la pieza",font:p.t,weight:p.tw,size:redondo(b*.075),lh:1.08,w:redondo(d.w*.8),x:0,y:0,color:R.text,palRole:"text"});
  const c=NEW.text({name:"Cuerpo",text:"Texto de apoyo con la tipografía de lectura.",font:p.c,weight:400,size:redondo(b*.032),lh:1.4,w:redondo(d.w*.8),x:0,y:redondo(b*.075*2.4),color:R.text,palRole:"text"});
  centrarYAgregar([t,c],"Combinación: "+p.n,{agrupar:false});
}
function aplicarColor(c){
  const sel=E.State.selObjs();
  if(!sel.length){ E.State.st.doc.bg={type:"solid",c1:c,c2:c,angle:180}; E.Render.all(); E.History.snap("Fondo"); toast("Fondo del lienzo"); return; }
  sel.forEach(o=>{ delete o.palRole;
    if(o.type==="text"){ o.color=c; if(o.colorG)o.colorG.on=false; }
    else if(o.type==="shape"){ if(o.fill.type==="none"||o.shape==="line"||o.shape==="arrow")o.stroke.c=c; else o.fill={...o.fill,type:"solid",c1:c}; }
    else if(o.type==="icon")o.color=c; });
  E.Render.all(); E.History.snap("Color de marca"); E.Props.refresh();
}
async function insertarUrl(url,nombre,anchoRel){
  try{ const du=await E.Banco.fuenteADataURL(url), im=new Image();
    await new Promise((ok,mal)=>{ im.onload=ok; im.onerror=mal; im.src=du; });
    const d=E.State.st.doc, w=redondo(d.w*(anchoRel||.3)), h=redondo(w*(im.height/im.width||1));
    E.Panels.add(NEW.image({src:du,w,h,name:nombre,origen:url}));
  }catch(_){ toast("No se pudo cargar «"+nombre+"»"); }
}
function pintarMarca(lp){
  const R=roles(), etq={bg:"Fondo",deep:"Profundo",brandA:"Acento",text:"Texto",muted:"Tenue",ctaText:"Sobre acento",soft:"Suave"};
  const fam=(g,t)=>`<div class="av-sub">${t}</div><div class="chips">`+Object.entries(TOKENS_COLOR[g]||{}).map(([k,v])=>`<button class="chip" data-col="${v}" title="${g}.${k} · ${v}" style="background:${v}"></button>`).join("")+`</div>`;
  const m=(diseno&&diseno.marca)||{}, logos=[...(m.logos||[])];
  Object.entries((diseno&&diseno.insumos)||{}).forEach(([k,u])=>{ if(!logos.some(l=>l.url===u))logos.push({nombre:k.replace(/_/g," "),url:u}); });
  const tit=m.titular||{};
  lp.innerHTML=`<div class="p-title">Kit de marca</div>
    <p class="note" style="margin-bottom:8px">Un clic aplica a lo seleccionado (texto, forma o ícono); sin selección, al fondo o como elemento nuevo.</p>
    <div class="av-ele-sec">Colores · paleta «${esc(E.State.st.pal)}»</div>
    <div class="av-roles">${Object.entries(etq).map(([k,t])=>`<button class="av-rol" data-col="${R[k]}" title="${t} · ${R[k]}"><i style="background:${R[k]}"></i><span>${t}</span></button>`).join("")}</div>
    ${fam("puka","Puka")}${fam("qillu","Q'illu")}${fam("neutral","Neutros")}${fam("fondos","Fondos")}
    <div class="av-ele-sec">Estilos de texto</div>
    <div class="av-estilos">${ESTILOS.map(es=>`<button class="av-estilo" data-est="${es.k}" style="font-family:'${es.font}';font-weight:${es.weight};${es.italic?"font-style:italic;":""}${es.upper?"text-transform:uppercase;letter-spacing:.06em;":""}font-size:${Math.max(12,Math.min(22,es.r*190))}px">${esc(es.n)}</button>`).join("")}</div>
    <div class="av-ele-sec">Tipografías${fuentesPerfil.length?` · ${fuentesPerfil.length} del perfil`:""}</div>
    <div class="av-fuentes">${FONTS.map(f=>`<button class="av-fuente" data-fuente="${esc(f)}" style="font-family:'${esc(f)}'"><b>Aa</b><span>${esc(f)}${fuentesPerfil.includes(f)?" · perfil":""}</span></button>`).join("")}</div>
    <div class="av-ele-sec">Combinaciones tipográficas</div>
    <div class="av-pares">${PARES.concat(fuentesPerfil.slice(0,2).map(f=>({n:"Perfil · "+f,t:f,tw:700,c:"Source Sans 3"}))).map((p,i)=>`<button class="av-par" data-par="${i}">
      <span style="font-family:'${esc(p.t)}';font-weight:${p.tw}">${esc(p.n)}</span><small style="font-family:'${esc(p.c)}'">${esc(p.t)} + ${esc(p.c)}</small></button>`).join("")}</div>
    <div class="av-ele-sec">Logos y recursos del perfil</div>
    ${logos.length?`<div class="av-logos">${logos.map((l,i)=>`<button class="av-logo" data-logo="${i}" title="${esc(l.nombre)}"><img src="${esc(l.url)}" alt="" loading="lazy"></button>`).join("")}</div>`
      :`<p class="note">${E.Banco.activo()?"El perfil no tiene logos en su carpeta (<code>rutas.logos</code>).":"Abre el editor con su servidor para traer los logos y tipografías del perfil."}</p>`}
    ${tit.nombre?`<div class="av-ele-sec">Firma</div><button class="p-btn" id="mar-firma" style="width:100%">${esc(tit.nombre)}<br><small class="note">${esc(tit.rol||"")}</small></button>`:""}`;
  lp.querySelectorAll("[data-col]").forEach(b=>b.onclick=()=>aplicarColor(b.dataset.col));
  lp.querySelectorAll("[data-est]").forEach(b=>b.onclick=()=>usarEstilo(ESTILOS.find(e=>e.k===b.dataset.est)));
  const pares=PARES.concat(fuentesPerfil.slice(0,2).map(f=>({n:"Perfil · "+f,t:f,tw:700,c:"Source Sans 3"})));
  lp.querySelectorAll("[data-par]").forEach(b=>b.onclick=()=>usarPar(pares[+b.dataset.par]));
  lp.querySelectorAll("[data-fuente]").forEach(b=>b.onclick=()=>{ const f=b.dataset.fuente, textos=E.State.selObjs().filter(o=>o.type==="text");
    if(textos.length){ textos.forEach(o=>o.font=f); E.Render.all(); E.History.snap("Fuente: "+f); E.Props.refresh(); }
    else { const o=NEW.text({name:"Texto · "+f,text:"Texto en "+f,font:f,size:redondo(base()*.05),w:redondo(E.State.st.doc.w*.7),color:roles().text,palRole:"text"}); E.Panels.add(o); } });
  lp.querySelectorAll("[data-logo]").forEach(b=>b.onclick=()=>{ const l=logos[+b.dataset.logo]; insertarUrl(l.url,"Logo · "+l.nombre,.28); });
  const fb=lp.querySelector("#mar-firma");
  if(fb)fb.onclick=()=>{ const R2=roles(), b2=base();
    centrarYAgregar([NEW.text({name:"Firma · nombre",text:tit.nombre,font:"Archivo",weight:900,size:redondo(b2*.034),x:0,y:0,w:redondo(b2*.7),ls:1,upper:true,color:R2.text,palRole:"text"}),
      NEW.text({name:"Firma · cargo",text:tit.rol||"",font:"Archivo",weight:600,size:redondo(b2*.024),x:0,y:redondo(b2*.05),w:redondo(b2*.7),ls:1.5,upper:true,color:R2.muted,palRole:"muted"})],"Firma"); };
}
/* sección extra del panel Texto */
function textoExtra(lp){
  const div=document.createElement("div");
  div.innerHTML=`<div class="av-ele-sec">Estilos de la marca</div>
    <div class="av-estilos">${ESTILOS.map(es=>`<button class="av-estilo" data-est="${es.k}" style="font-family:'${es.font}';font-weight:${es.weight};${es.italic?"font-style:italic;":""}${es.upper?"text-transform:uppercase;letter-spacing:.06em;":""}font-size:${Math.max(12,Math.min(22,es.r*190))}px">${esc(es.n)}</button>`).join("")}</div>
    <div class="av-ele-sec">Combinaciones tipográficas</div>
    <div class="av-pares">${PARES.map((p,i)=>`<button class="av-par" data-par="${i}"><span style="font-family:'${esc(p.t)}';font-weight:${p.tw}">${esc(p.n)}</span><small style="font-family:'${esc(p.c)}'">${esc(p.t)} + ${esc(p.c)}</small></button>`).join("")}</div>
    <p class="note">Con un texto seleccionado, el estilo se le aplica; sin selección, se añade uno nuevo.</p>`;
  lp.appendChild(div);
  div.querySelectorAll("[data-est]").forEach(b=>b.onclick=()=>usarEstilo(ESTILOS.find(e=>e.k===b.dataset.est)));
  div.querySelectorAll("[data-par]").forEach(b=>b.onclick=()=>usarPar(PARES[+b.dataset.par]));
}
Avz.textoExtra=textoExtra;

/* ============================================================ FOTOS: elegir del banco, reemplazar, recortar */
function elegirFoto(cb,titulo){
  let carpeta="", q="";
  const d=dialogo(titulo||"Elegir una foto",`
    <div class="av-fila"><label class="av-busca av-busca--ancha">${ic("buscar")}<input type="search" id="f-q" placeholder="Buscar: nombre, carpeta, crédito…"></label>
      <button class="est-boton est-boton--borde" id="f-subir">${ic("subir")}Subir del equipo…</button></div>
    <div class="av-chips" id="f-cats"></div><div class="av-fotos" id="f-grid"></div>
    <p class="est-nota">${E.Banco.activo()?(E.Banco.fototeca()?"Banco del estudio y Fototeca del sistema.":"Banco de fotos del perfil."):"Banco embebido (sin servidor)."} El crédito de cada foto CC es obligatorio al publicar.</p>`,{ancho:900});
  const c=d.capa, todas=E.Banco.items();
  const pintar=()=>{
    const cs=[...new Set(todas.map(f=>f.carpeta||"General"))].sort();
    c.querySelector("#f-cats").innerHTML=[["","Todas"],...cs.map(x=>[x,x])].map(([v,t])=>`<button class="est-chip${carpeta===v?" on":""}" data-c="${esc(v)}">${esc(t)}</button>`).join("");
    c.querySelectorAll("#f-cats [data-c]").forEach(b=>b.onclick=()=>{ carpeta=b.dataset.c; pintar(); });
    const qq=q.toLowerCase(), vis=todas.filter(f=>(!carpeta||(f.carpeta||"General")===carpeta)&&(!qq||((f.name||"")+" "+(f.credito||"")+" "+(f.carpeta||"")).toLowerCase().includes(qq))).slice(0,240);
    const g=c.querySelector("#f-grid");
    g.innerHTML=vis.length?vis.map((f,i)=>`<button class="av-foto" data-f="${i}" title="${esc(f.name)}${f.credito?" — "+esc(f.credito):""}"><img src="${esc(f.src)}" alt="" loading="lazy"></button>`).join("")
      :`<p class="est-nota">${todas.length?"Ninguna foto coincide.":"El banco está vacío: sube una foto del equipo."}</p>`;
    g.querySelectorAll("[data-f]").forEach(b=>b.onclick=async()=>{ const f=vis[+b.dataset.f];
      try{ const du=await E.Banco.fuenteADataURL(f.src); d.cerrar(); cb(du,f.credito?f.name+" · "+f.credito:f.name,f.credito||"",f.src); }
      catch(_){ toast("No se pudo cargar la foto"); } });
  };
  c.querySelector("#f-q").oninput=e=>{ q=e.target.value; pintar(); };
  c.querySelector("#f-subir").onclick=()=>E.Panels.pickImage((src,file)=>{ d.cerrar(); cb(src,(file&&file.name)||"Imagen","",""); });
  pintar();
}
function ponerFotoEn(o,du,nombre,credito,origen){
  o.src=du; o.name=nombre||o.name;
  o.origen=origen&&!String(origen).startsWith("data:")?origen:""; o.mejora=null; o.ox=0; o.oy=0; o.scale=1;
  E.Render.one(o.id); E.Layers.refresh(); E.State.setSel([o.id]); E.History.snap("Reemplazar imagen");
  toast("Foto en su marco ✓ — doble clic para recortar"+(credito?" · crédito: "+credito:""));
  E.Mejora.auto(o);
}
Avz.elegirFoto=elegirFoto;

/* recorte dentro del marco: arrastrar desplaza, rueda o deslizador acerca; Intro/Esc o «Listo» terminan */
const Recorte=(()=>{
  let o=null, cap=null, inicio=null;
  const lim=()=>Math.max(0,(o.scale-1)*50);
  function acotar(){ o.ox=clamp(o.ox,-lim(),lim()); o.oy=clamp(o.oy,-lim(),lim()); }
  function pintar(){
    if(!o||!cap)return;
    const z=E.View.zoom, p=E.View.docToScreen(o.x,o.y), w=o.w*z, h=o.h*z, s=o.scale||1;
    const caja=cap.querySelector(".av-recorte__caja");
    Object.assign(caja.style,{left:p.x+"px",top:p.y+"px",width:w+"px",height:h+"px",transform:`rotate(${o.rot||0}deg)`});
    const fa=cap.querySelector(".av-recorte__fantasma");
    Object.assign(fa.style,{width:s*w+"px",height:s*h+"px",left:((w-s*w)/2+o.ox/100*w)+"px",top:((h-s*h)/2+o.oy/100*h)+"px"});
    const r=cap.querySelector("#rec-zoom"); if(r){ r.value=Math.round(s*100); r.style.setProperty("--valor",((s-1)/3*100)+"%"); }
    E.Render.one(o.id); E.Render.overlay();
  }
  function empezar(obj){
    if(!obj||obj.type!=="image"||!obj.src||obj.locked)return;
    terminar(true); o=obj; o.scale=o.scale||1; o.ox=o.ox||0; o.oy=o.oy||0;
    E.State.setSel([o.id]);
    cap=document.createElement("div"); cap.className="av-recorte";
    cap.innerHTML=`<div class="av-recorte__caja"><div class="av-recorte__fantasma"><img alt="" src="${o.src}"></div></div>
      <div class="av-recorte__barra est-grupo">${ic("recorte")}<b>Recortar</b>
        <input type="range" id="rec-zoom" min="100" max="400" value="${Math.round(o.scale*100)}" title="Acercar dentro del marco" aria-label="Acercar">
        <button class="est-boton est-boton--sm" id="rec-reset">Restablecer</button>
        <button class="est-boton est-boton--sm est-boton--primario" id="rec-ok">${ic("hecho","ico--sm")}Listo</button></div>`;
    $("#viewport").appendChild(cap);
    const im=cap.querySelector(".av-recorte__fantasma img");
    im.style.filter=`brightness(${o.filters.br}%) contrast(${o.filters.ct}%) saturate(${o.filters.sat}%)`;
    cap.querySelector("#rec-zoom").oninput=e=>{ o.scale=e.target.value/100; acotar(); pintar(); };
    cap.querySelector("#rec-reset").onclick=()=>{ o.scale=1; o.ox=0; o.oy=0; pintar(); };
    cap.querySelector("#rec-ok").onclick=()=>terminar();
    /* el recorte se queda con el puntero: nada llega al lienzo (selección, rueda, doble clic) */
    ["pointerdown","pointermove","pointerup","dblclick","click"].forEach(t=>cap.addEventListener(t,e=>e.stopPropagation()));
    cap.addEventListener("wheel",e=>{ e.preventDefault(); e.stopPropagation(); o.scale=clamp(o.scale*(e.deltaY<0?1.06:1/1.06),1,4); acotar(); pintar(); },{passive:false});
    cap.addEventListener("pointerdown",e=>{
      if(e.target.closest(".av-recorte__barra"))return;
      if(!e.target.closest(".av-recorte__caja")&&!e.target.closest(".av-recorte__fantasma")){ terminar(); return; }
      e.preventDefault(); inicio={x:e.clientX,y:e.clientY,ox:o.ox,oy:o.oy}; cap.setPointerCapture(e.pointerId); });
    cap.addEventListener("pointermove",e=>{ if(!inicio)return;
      const z=E.View.zoom, a=-(o.rot||0)*Math.PI/180, dx=e.clientX-inicio.x, dy=e.clientY-inicio.y;
      const lx=(dx*Math.cos(a)-dy*Math.sin(a))/z, ly=(dx*Math.sin(a)+dy*Math.cos(a))/z;
      o.ox=inicio.ox+lx/o.w*100; o.oy=inicio.oy+ly/o.h*100; acotar(); pintar(); });
    cap.addEventListener("pointerup",()=>{ inicio=null; });
    let ult="";
    const seguir=()=>{ if(!cap)return; const p=E.View.docToScreen(0,0), k=E.View.zoom+","+p.x+","+p.y;
      if(k!==ult){ ult=k; pintar(); } requestAnimationFrame(seguir); };
    pintar(); requestAnimationFrame(seguir);
    toast("Recorte: arrastra la foto, rueda para acercar · Intro o «Listo» para terminar");
  }
  function terminar(silencio){
    if(!cap)return; cap.remove(); cap=null; const fue=o; o=null; inicio=null;
    if(fue&&!silencio){ E.Render.one(fue.id); E.History.snap("Recortar en el marco"); E.Props.refresh(); }
  }
  return {empezar,terminar,activo:()=>!!cap,pintar};
})();
Avz.recorte=Recorte;

/* ============================================================ TEXTO: efectos, resaltado, encajar */
function quitarResalte(t){ const st=E.State.st; st.objects=st.objects.filter(o=>o.resalteDe!==t.id); }
function sincronizarResaltes(){
  const st=E.State.st;
  st.objects.forEach(r=>{ if(!r.resalteDe)return;
    /* su texto: el de su id dentro de su grupo; si se duplicó, el texto de su mismo grupo */
    const t=st.objects.find(o=>o.id===r.resalteDe&&o.groupId===r.groupId)||st.objects.find(o=>o.type==="text"&&o.groupId&&o.groupId===r.groupId);
    if(!t)return; r.resalteDe=t.id;
    const px=redondo(t.size*.32), py=redondo(t.size*.14);
    const nv={x:t.x-px,y:t.y-py,w:t.w+2*px,h:(t.h||t.size*t.lh)+2*py,rot:t.rot||0};
    if(nv.x!==r.x||nv.y!==r.y||nv.w!==r.w||nv.h!==r.h||nv.rot!==r.rot){ Object.assign(r,nv); E.Render.one(r.id); } });
}
function efecto(t,k){
  const R=roles(), oscuroTxt=_lum(t.color&&t.color.startsWith("#")?t.color:T("neutral.900"))<.4;
  if(t.color==="transparent"&&t.colorHueco){ t.color=t.colorHueco; delete t.colorHueco; }
  t.shadow={...(t.shadow||{}),on:false}; t.outline={w:0,color:(t.outline&&t.outline.color)||T("neutral.900")};
  quitarResalte(t);
  if(k==="sombra")t.shadow={on:true,x:0,y:Math.max(1,redondo(t.size*.06)),blur:Math.max(2,redondo(t.size*.18)),color:TA("excepcionales.negro",".45")};
  if(k==="contorno")t.outline={w:Math.max(1,redondo(t.size*.035)),color:oscuroTxt?T("fondos.blanco"):T("neutral.900")};
  if(k==="hueco"){ t.colorHueco=t.color; t.outline={w:Math.max(1,redondo(t.size*.03)),color:t.color}; t.color="transparent"; }
  if(k==="neon")t.shadow={on:true,x:0,y:0,blur:Math.max(4,redondo(t.size*.35)),color:R.brandA};
  if(k==="resaltado"){
    const st=E.State.st, i=st.objects.indexOf(t), gid=t.groupId||uid(); t.groupId=gid;
    const r=NEW.shape({name:"Resaltado de «"+String(t.text).slice(0,18)+"»",shape:"rect",x:t.x,y:t.y,w:t.w,h:t.h,radius:redondo(t.size*.18),
      fill:{type:"solid",c1:R.brandA,c2:R.brandA,angle:90},palRole:"brandA",resalteDe:t.id,groupId:gid});
    r.id=uid(); st.objects.splice(i,0,r); t.color=R.ctaText; t.palRole="ctaText"; if(t.colorG)t.colorG.on=false;
    sincronizarResaltes();
  }
  E.Render.all(); E.History.snap("Efecto de texto: "+k); E.Props.refresh();
}
function medirTexto(o,size){
  const d=document.createElement("div");
  d.style.cssText=E.Render.textStyle({...o,size})+`position:absolute;left:-99999px;top:0;width:${o.w}px;white-space:pre-wrap;word-wrap:break-word;visibility:hidden;margin:0;padding:0`;
  d.textContent=o.text; document.body.appendChild(d); const h=d.offsetHeight; d.remove();
  const cv=document.createElement("canvas").getContext("2d");
  cv.font=`${o.italic?"italic ":""}${o.weight} ${size}px '${o.font}', sans-serif`;
  const palabras=(o.upper?o.text.toUpperCase():o.text).split(/\s+/).filter(Boolean);
  const ancho=Math.max(0,...palabras.map(p=>cv.measureText(p).width+Math.max(0,o.ls||0)*p.length));
  return {h,cabe:ancho<=o.w};
}
function encajar(o,altoMax){
  let a=6,b=Math.max(8,Math.min(900,o.size*4));
  for(let i=0;i<18;i++){ const m=(a+b)/2, r=medirTexto(o,m); if(r.h<=altoMax&&r.cabe)a=m; else b=m; }
  o.size=Math.max(6,Math.floor(a)); E.Render.all(); E.History.snap("Encajar texto"); E.Props.refresh();
  toast(`Texto encajado: ${o.size} px en ${redondo(altoMax)} px de alto`);
}

/* ============================================================ COPIAR / PEGAR ESTILO */
const CAMPOS={text:["font","weight","italic","underline","color","colorG","align","lh","ls","upper","shadow","outline","size","arco"],
  shape:["fill","stroke","radius","shadow"],icon:["color","sw"],image:["filters","mask","maskD","radius"]};
let estilo=null;
function colorDe(o){ return o.type==="text"?o.color:o.type==="shape"?(o.fill.type==="none"?o.stroke.c:o.fill.c1):o.type==="icon"?o.color:null; }
function copiarEstilo(){ const o=E.State.selObjs()[0]; if(!o){ toast("Selecciona un elemento para copiar su estilo"); return; }
  estilo={type:o.type,opacity:o.opacity??1,color:colorDe(o),campos:Object.fromEntries((CAMPOS[o.type]||[]).map(k=>[k,deep(o[k]??null)]))};
  toast("Estilo copiado — Ctrl+Alt+V para pegarlo"); E.Props.refresh(); }
function pegarEstilo(){ if(!estilo){ toast("Primero copia un estilo (Ctrl+Alt+C)"); return; }
  const sel=E.State.selObjs(); if(!sel.length)return;
  sel.forEach(o=>{ o.opacity=estilo.opacity;
    if(o.type===estilo.type)Object.entries(estilo.campos).forEach(([k,v])=>{ if(v!==null)o[k]=deep(v); });
    else if(estilo.color){ if(o.type==="text")o.color=estilo.color; else if(o.type==="icon")o.color=estilo.color;
      else if(o.type==="shape"){ if(o.fill.type==="none")o.stroke.c=estilo.color; else o.fill={...o.fill,type:"solid",c1:estilo.color}; } }
    delete o.palRole; });
  E.Render.all(); E.History.snap("Pegar estilo"); E.Props.refresh(); }
Avz.copiarEstilo=copiarEstilo; Avz.pegarEstilo=pegarEstilo;

/* ============================================================ PROPIEDADES: secciones extra */
const FILTROS=[["Original",{br:100,ct:100,sat:100,blur:0}],["Vívido",{br:104,ct:112,sat:135,blur:0}],["Cálido",{br:104,ct:104,sat:112,blur:0}],
  ["Mate",{br:108,ct:86,sat:84,blur:0}],["Dramático",{br:94,ct:132,sat:88,blur:0}],["Suave",{br:106,ct:92,sat:96,blur:1}],
  ["B/N",{br:104,ct:108,sat:0,blur:0}],["B/N intenso",{br:98,ct:140,sat:0,blur:0}]];
function propsExtra(body,sel){
  const sec=(titulo,html)=>`<div class="av-props"><div class="p-title" style="margin-top:12px">${titulo}</div>${html}</div>`;
  let h="";
  if(!sel.length){
    const d=E.State.st.doc, p=presetDe(d.w,d.h);
    h+=sec("Diseño",`<p class="note" style="margin-bottom:8px">${p?esc(p.n)+" · ":""}${d.mm?d.mm.w+" × "+d.mm.h+" mm · ":""}${d.w} × ${d.h} px</p>
      <div class="av-botones"><button class="p-btn" data-av="tam">${ic("redimensionar","ico--sm")} Cambiar tamaño…</button>
      <button class="p-btn" data-av="inicio">${ic("inicio","ico--sm")} Inicio</button>
      <button class="p-btn" data-av="atajos">${ic("teclado","ico--sm")} Atajos</button></div>`);
    body.insertAdjacentHTML("beforeend",h); enlazarProps(body,sel); return;
  }
  const gid=sel[0].groupId, comp=sel[0].comp;
  if(comp&&gid&&sel.every(o=>o.groupId===gid)){
    const nom={grafico:"gráfico",tabla:"tabla",qr:"código QR"}[comp.tipo]||"elemento";
    h+=sec("Datos",`<button class="p-btn av-ancho" data-av="comp">${ic(comp.tipo==="qr"?"qr":comp.tipo==="tabla"?"tabla":"grafico","ico--sm")} Editar datos del ${nom}…</button>`);
  }
  h+=sec("Estilo",`<div class="av-botones"><button class="p-btn" data-av="copiar" title="Ctrl+Alt+C">${ic("pincel","ico--sm")} Copiar estilo</button>
    <button class="p-btn" data-av="pegar" title="Ctrl+Alt+V" ${estilo?"":"disabled"}>${ic("pincel","ico--sm")} Pegar estilo</button></div>`);
  const o=sel.length===1?sel[0]:null;
  if(o&&o.type==="text"){
    const fx=o.color==="transparent"?"hueco":E.State.st.objects.some(r=>r.resalteDe===o.id)?"resaltado":o.outline&&o.outline.w>0?"contorno":o.shadow&&o.shadow.on?(o.shadow.x===0&&o.shadow.y===0?"neon":"sombra"):"ninguno";
    h+=sec("Estilo de marca",`<select data-av="estilo" class="av-ancho"><option value="">Aplicar un estilo…</option>${ESTILOS.map(es=>`<option value="${es.k}">${es.n} · ${es.font}</option>`).join("")}</select>`);
    h+=sec("Efectos",`<div class="av-efectos">${[["ninguno","Ninguno"],["sombra","Sombra"],["contorno","Contorno"],["hueco","Hueco"],["neon","Neón"],["resaltado","Resaltado"]]
      .map(([k,t])=>`<button class="mini-btn${fx===k?" on":""}" data-fx="${k}">${t}</button>`).join("")}</div>`);
    const ar=o.arco||{on:false,radio:400,angulo:0};
    h+=sec("Texto en arco",`<label class="f-row" style="gap:6px"><input type="checkbox" data-arco="on" ${ar.on?"checked":""}> Curvar el texto (una línea)</label>
      <div class="f-row"><label>Hacia</label><select data-arco="sentido" ${ar.on?"":"disabled"}><option value="1" ${(ar.radio||0)>=0?"selected":""}>Arriba (arco)</option><option value="-1" ${(ar.radio||0)<0?"selected":""}>Abajo (sonrisa)</option></select></div>
      <div class="f-row"><label>Radio</label><input type="range" data-arco="radio" min="40" max="2400" step="10" value="${Math.abs(ar.radio||400)}" ${ar.on?"":"disabled"} style="flex:1"><output>${Math.abs(ar.radio||400)} px</output></div>
      <div class="f-row"><label>Ángulo</label><input type="range" data-arco="angulo" min="-180" max="180" step="1" value="${ar.angulo||0}" ${ar.on?"":"disabled"} style="flex:1"><output>${ar.angulo||0}°</output></div>
      <p class="note">El radio mínimo es el que da una vuelta completa. Sale igual en PNG, PDF y el SVG editable (texto en trayecto de Inkscape).</p>`);
    h+=sec("Encajar en la caja",`<div class="f-row"><label>Alto máx.</label><input type="number" id="av-alto" value="${redondo(o.h)}" min="10" style="width:72px">
      <button class="mini-btn" data-av="encajar" style="flex:1" title="El mayor tamaño que cabe en el ancho y el alto, sin partir palabras">Encajar</button></div>
      <p class="note">Ajusta el tamaño de letra al ancho de la caja y a ese alto.</p>`);
  }
  if(o&&o.type==="image"){
    h+=sec("Foto en el marco",`<div class="av-botones">
        <button class="p-btn" data-av="recortar" ${o.src?"":"disabled"} title="También con doble clic sobre la foto">${ic("recorte","ico--sm")} Recortar</button>
        <button class="p-btn" data-av="banco">${ic("imagen","ico--sm")} Elegir del banco…</button></div>
      <div class="av-marcos">${MARCOS.map((m,i)=>`<button class="av-marco${(o.mask===m.mask&&(m.mask!=="path"||o.maskD===m.d))?" on":""}" data-marco="${i}" title="${esc(m.n)}">${
        vis(m.mask==="path"?`<path d="${m.d}"/>`:m.mask==="circle"?'<circle cx="50" cy="50" r="42"/>':`<rect x="10" y="10" width="80" height="80" rx="${m.mask==="round"?16:0}"/>`)}</button>`).join("")}</div>
      <div class="p-title" style="margin-top:10px">Filtros</div>
      <div class="av-filtros">${FILTROS.map(([n,f],i)=>`<button class="av-filtro" data-filtro="${i}" title="${n}"><span style="filter:brightness(${f.br}%) contrast(${f.ct}%) saturate(${f.sat}%) blur(${f.blur*.3}px)"></span><small>${n}</small></button>`).join("")}</div>`);
  }
  body.insertAdjacentHTML("beforeend",h); enlazarProps(body,sel);
  if(o&&o.type==="image"&&o.src)miniFoto(o.src).then(u=>{ if(u)body.querySelectorAll(".av-filtro span").forEach(sp=>sp.style.backgroundImage=`url(${u})`); });
}
const fotosMini=new Map();
function miniFoto(src){
  const k=src.length+":"+src.slice(-48);
  if(!fotosMini.has(k))fotosMini.set(k,new Promise(ok=>{ const im=new Image();
    im.onload=()=>{ const cv=document.createElement("canvas"), r=72/Math.max(im.width,im.height); cv.width=Math.max(1,Math.round(im.width*r)); cv.height=Math.max(1,Math.round(im.height*r));
      cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height); try{ ok(cv.toDataURL("image/jpeg",.7)); }catch(_){ ok(""); } };
    im.onerror=()=>ok(""); im.src=src; }));
  if(fotosMini.size>60)fotosMini.delete(fotosMini.keys().next().value);
  return fotosMini.get(k);
}
function enlazarProps(body,sel){
  const B=s=>body.querySelector(s), o=sel.length===1?sel[0]:null;
  body.querySelectorAll('[data-av="tam"]').forEach(b=>b.onclick=()=>cambiarTamano());
  body.querySelectorAll('[data-av="inicio"]').forEach(b=>b.onclick=()=>Inicio.abrir());
  body.querySelectorAll('[data-av="atajos"]').forEach(b=>b.onclick=()=>atajos());
  if(B('[data-av="comp"]'))B('[data-av="comp"]').onclick=()=>{ const c=sel[0].comp, g=sel[0].groupId;
    if(c.tipo==="grafico")dlgGrafico(c,g); else if(c.tipo==="tabla")dlgTabla(c,g); else dlgQR(c,g); };
  if(B('[data-av="copiar"]'))B('[data-av="copiar"]').onclick=copiarEstilo;
  if(B('[data-av="pegar"]'))B('[data-av="pegar"]').onclick=pegarEstilo;
  if(B('[data-av="estilo"]'))B('[data-av="estilo"]').onchange=e=>{ const es=ESTILOS.find(x=>x.k===e.target.value); if(es&&o){ aplicarEstilo(o,es); E.Render.all(); E.History.snap("Estilo: "+es.n); E.Props.refresh(); } };
  body.querySelectorAll("[data-fx]").forEach(b=>b.onclick=()=>o&&efecto(o,b.dataset.fx));
  body.querySelectorAll("[data-arco]").forEach(el=>{
    const k=el.dataset.arco;
    const aplicar=final=>{ if(!o)return;
      const ar=o.arco||(o.arco={on:false,radio:400,angulo:0});
      if(k==="on"){ ar.on=el.checked; }
      else if(k==="sentido"){ ar.radio=Math.abs(ar.radio||400)*(+el.value<0?-1:1); }
      else if(k==="radio"){ ar.radio=(+el.value)*((ar.radio||0)<0?-1:1); el.nextElementSibling.textContent=el.value+" px"; }
      else if(k==="angulo"){ ar.angulo=+el.value; el.nextElementSibling.textContent=el.value+"°"; }
      E.Render.one(o.id); E.Render.overlay();
      if(final){ E.History.snap(k==="on"?(ar.on?"Texto en arco":"Texto recto"):"Arco del texto"); if(k==="on")E.Props.refresh(); }
    };
    if(el.type==="range"){ el.oninput=()=>aplicar(false); el.onchange=()=>aplicar(true); }
    else el.onchange=()=>aplicar(true);
  });
  if(B('[data-av="encajar"]'))B('[data-av="encajar"]').onclick=()=>o&&encajar(o,Math.max(10,+B("#av-alto").value||o.h));
  if(B('[data-av="recortar"]'))B('[data-av="recortar"]').onclick=()=>Recorte.empezar(o);
  if(B('[data-av="banco"]'))B('[data-av="banco"]').onclick=()=>elegirFoto((du,n,cr,src)=>ponerFotoEn(o,du,n,cr,src),"Reemplazar la foto (se queda en su marco)");
  body.querySelectorAll("[data-marco]").forEach(b=>b.onclick=()=>{ const m=MARCOS[+b.dataset.marco]; o.mask=m.mask;
    if(m.mask==="path")o.maskD=m.d; E.Render.one(o.id); E.History.snap("Marco: "+m.n); E.Props.refresh(); });
  body.querySelectorAll("[data-filtro]").forEach(b=>b.onclick=()=>{ o.filters={...FILTROS[+b.dataset.filtro][1]}; E.Render.one(o.id); E.History.snap("Filtro: "+FILTROS[+b.dataset.filtro][0]); E.Props.refresh(); });
}
Avz.propsExtra=propsExtra;

/* ============================================================ PÁGINAS: tira con miniaturas */
function tiraPaginas(bar,act){
  bar.classList.add("av-tira");
  const n=act.paginas.length;
  bar.innerHTML=`<button class="av-tira__nom" id="pg-nom" title="Clic para renombrar la edición">${esc(act.nombre)}</button>
    <span class="pg-sep"></span>
    <div class="av-tira__pags">${act.paginas.map((p,i)=>`<button class="av-pag${i===act.pag?" on":""}" data-pg="${i}" draggable="true" title="Página ${i+1} · arrastra para reordenar">
      <span class="av-pag__img" style="aspect-ratio:${p.doc.w}/${p.doc.h}"><img alt=""></span><span class="av-pag__n">${i+1}</span></button>`).join("")}</div>
    <button class="pg-ic" id="pg-add" title="Nueva página en blanco">${ic("mas","ico--sm")}</button>
    <button class="pg-ic" id="pg-dup" title="Duplicar esta página">${ic("copiar","ico--sm")}</button>
    ${n>1?`<button class="pg-ic" id="pg-izq" title="Mover la página a la izquierda" ${act.pag===0?"disabled":""}>${ic("izquierda","ico--sm")}</button>
    <button class="pg-ic" id="pg-der" title="Mover la página a la derecha" ${act.pag===n-1?"disabled":""}>${ic("derecha","ico--sm")}</button>
    <button class="pg-ic" id="pg-del" title="Eliminar esta página">${ic("papelera","ico--sm")}</button>`:""}
    <span class="pg-sep"></span>
    <button class="pg-ic av-tira__exp" id="pg-exp" title="Exportar ${n>1?"todas las páginas (ZIP o PDF)":"la página"}">${ic("descargar","ico--sm")}${n>1?" "+n:""}</button>`;
  bar.querySelector("#pg-nom").onclick=()=>{ const v=prompt("Nombre de la edición:",act.nombre); if(v)E.Ediciones.renombrar(act.id,v); };
  bar.querySelector("#pg-add").onclick=()=>E.Ediciones.nuevaPagina(false);
  bar.querySelector("#pg-dup").onclick=()=>E.Ediciones.nuevaPagina(true);
  const B=s=>bar.querySelector(s);
  if(B("#pg-izq"))B("#pg-izq").onclick=()=>E.Ediciones.moverPagina(act.pag,act.pag-1);
  if(B("#pg-der"))B("#pg-der").onclick=()=>E.Ediciones.moverPagina(act.pag,act.pag+1);
  if(B("#pg-del"))B("#pg-del").onclick=()=>{ if(confirm("¿Eliminar la página "+(act.pag+1)+"?"))E.Ediciones.borrarPagina(); };
  B("#pg-exp").onclick=()=>E.Export.openModal();
  let de=null;
  bar.querySelectorAll("[data-pg]").forEach(b=>{ const i=+b.dataset.pg;
    b.onclick=()=>E.Ediciones.irPagina(i);
    b.ondragstart=e=>{ de=i; e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain","pg"+i); };
    b.ondragover=e=>{ if(de==null||de===i)return; e.preventDefault(); b.classList.add("destino"); };
    b.ondragleave=()=>b.classList.remove("destino");
    b.ondrop=e=>{ e.preventDefault(); b.classList.remove("destino"); if(de!=null&&de!==i)E.Ediciones.moverPagina(de,i); de=null; };
    const p=act.paginas[i];
    miniatura("p:"+huella(p),()=>p,120).then(u=>{ const im=b.querySelector("img"); if(u&&im)im.src=u; });
  });
  const on=bar.querySelector(".av-pag.on"); if(on)on.scrollIntoView({block:"nearest",inline:"nearest"});
}
Avz.tiraPaginas=tiraPaginas;

/* ============================================================ EXPORTAR VARIAS PÁGINAS */
function paginas(){ const a=E.Ediciones.actual; if(!a)return [E.Ediciones.snapPag()]; E.Ediciones.sincronizar(); return a.paginas.map(p=>deep(p)); }
function renderPagina(p,{scale=1,transparent=false}={}){
  const objs=(p.objects||[]).map((o,i)=>({...o,id:o.id||("x"+i)}));
  return E.Export.renderEstado(transparent?{...p.doc,bg:{type:"none"}}:p.doc,objs,scale);
}
/* sangrado por overscan y marcas de corte (mismo criterio que renderCanvas de E.Export) */
function sangrar(art,b,mk){
  b=Math.round(b); mk=Math.round(mk); if(b<=0&&mk<=0)return art;
  const P=b+mk, aw=art.width, ah=art.height, cv=document.createElement("canvas"); cv.width=aw+2*P; cv.height=ah+2*P;
  const c=cv.getContext("2d"); c.fillStyle=T("fondos.blanco"); c.fillRect(0,0,cv.width,cv.height);
  if(b>0){ c.imageSmoothingEnabled=false;
    c.drawImage(art,0,0,aw,1,P,P-b,aw,b); c.drawImage(art,0,ah-1,aw,1,P,P+ah,aw,b);
    c.drawImage(art,0,0,1,ah,P-b,P,b,ah); c.drawImage(art,aw-1,0,1,ah,P+aw,P,b,ah);
    c.drawImage(art,0,0,1,1,P-b,P-b,b,b); c.drawImage(art,aw-1,0,1,1,P+aw,P-b,b,b);
    c.drawImage(art,0,ah-1,1,1,P-b,P+ah,b,b); c.drawImage(art,aw-1,ah-1,1,1,P+aw,P+ah,b,b); c.imageSmoothingEnabled=true; }
  c.drawImage(art,P,P);
  if(mk>0){ c.strokeStyle=T("excepcionales.negro"); c.lineWidth=Math.max(1,mk/12); c.beginPath();
    [[P,P,-1,-1],[P+aw,P,1,-1],[P,P+ah,-1,1],[P+aw,P+ah,1,1]].forEach(([x,y,sx,sy])=>{
      c.moveTo(x,y+sy*b); c.lineTo(x,y+sy*(b+mk)); c.moveTo(x+sx*b,y); c.lineTo(x+sx*(b+mk),y); }); c.stroke(); }
  return cv;
}
const ptDe=p=>p.doc.mm?[p.doc.mm.w*72/25.4,p.doc.mm.h*72/25.4]:[p.doc.w*.75,p.doc.h*.75];
async function exportarPaginas({fmt,scale,q,tr,todas,nombre}){
  const lista=todas?paginas():[E.Ediciones.snapPag()], ed=E.Ediciones.actual, titulo=(ed&&ed.nombre)||nombre;
  const NN=i=>String(i+1).padStart(2,"0");
  if(fmt==="pdf"){
    const hojas=[];
    for(let i=0;i<lista.length;i++){ const cv=await renderPagina(lista[i],{scale});
      hojas.push({jpeg:await Empaquetar.bytes(cv,"image/jpeg",Math.max(.8,q)),px:[cv.width,cv.height],pt:ptDe(lista[i])}); }
    Empaquetar.descargar(Empaquetar.pdf(hojas,titulo),nombre+".pdf");
    toast(`PDF de ${lista.length} página${lista.length>1?"s":""} ✓`); return;
  }
  const archivos=[];
  for(let i=0;i<lista.length;i++){ const p=lista[i];
    if(fmt==="svg-ink"){ const r=await E.SvgEditable.generar({doc:p.doc,objects:p.objects,pal:p.pal,palVar:p.palVar,palRoles:p.palRoles});
      archivos.push({nombre:`${nombre}_${NN(i)}-inkscape.svg`,datos:new TextEncoder().encode(r.svg)}); continue; }
    const mime=fmt==="jpg"?"image/jpeg":fmt==="webp"?"image/webp":"image/png";
    const cv=await renderPagina(p,{scale,transparent:tr&&fmt!=="jpg"});
    archivos.push({nombre:`${nombre}_${NN(i)}.${fmt}`,datos:await Empaquetar.bytes(cv,mime,q)});
  }
  if(archivos.length===1){ Empaquetar.descargar(new Blob([archivos[0].datos]),archivos[0].nombre); }
  else Empaquetar.descargar(Empaquetar.zip(archivos),nombre+".zip");
  toast(archivos.length>1?`ZIP con ${archivos.length} páginas ✓`:"Exportado ✓");
}
async function imprimirPaginas({fmt,Wmm,bleedMm,marksOn,nombre}){
  const lista=paginas(), hojas=[], archivos=[], ed=E.Ediciones.actual;
  for(let i=0;i<lista.length;i++){ const p=lista[i], d=p.doc;
    const W=d.mm&&lista.length>1?d.mm.w:Wmm, H=W*d.h/d.w;
    const scale=Math.max(1,Math.ceil(W/25.4*300/d.w)), pxMm=d.w*scale/W;
    const cv=sangrar(await renderPagina(p,{scale}),bleedMm*pxMm,marksOn?3*pxMm:0);
    const totW=W+2*bleedMm+(marksOn?6:0), totH=H+2*bleedMm+(marksOn?6:0);
    if(fmt==="pdf")hojas.push({jpeg:await Empaquetar.bytes(cv,"image/jpeg",.95),px:[cv.width,cv.height],pt:[totW*72/25.4,totH*72/25.4]});
    else archivos.push({nombre:`${nombre}-imprenta-${String(i+1).padStart(2,"0")}-${W}mm.png`,datos:await Empaquetar.bytes(cv,"image/png")});
  }
  if(fmt==="pdf")Empaquetar.descargar(Empaquetar.pdf(hojas,(ed&&ed.nombre)||nombre),nombre+"-imprenta.pdf");
  else Empaquetar.descargar(Empaquetar.zip(archivos),nombre+"-imprenta.zip");
}
Object.assign(Avz,{paginas,renderPagina,exportarPaginas,imprimirPaginas,conPagina:async(p,fn)=>fn()});

/* ============================================================ CAMBIAR TAMAÑO (mágico) */
/* Reubica una página en W2×H2: cada grupo (o elemento suelto) se ancla por tercios a su borde o al centro;
   lo que cubre el ancho o el alto se estira; el resto escala con s=min(sx,sy) y los textos anchos ganan ancho. */
function reubicar(pag,W2,H2,mm){
  const W1=pag.doc.w,H1=pag.doc.h,sx=W2/W1,sy=H2/H1,s=Math.min(sx,sy);
  const objs=deep(pag.objects), unidades=new Map();
  objs.forEach(o=>{ const k=o.groupId||o.id; if(!unidades.has(k))unidades.set(k,[]); unidades.get(k).push(o); });
  for(const us of unidades.values()){
    const alto=o=>o.type==="text"?(o.h||o.size*o.lh):o.h;
    const bx=Math.min(...us.map(o=>o.x)), by=Math.min(...us.map(o=>o.y));
    const bw=Math.max(1,Math.max(...us.map(o=>o.x+o.w))-bx), bh=Math.max(1,Math.max(...us.map(o=>o.y+alto(o)))-by);
    const anchoTotal=bw>=W1*.9&&bx<=W1*.06, altoTotal=bh>=H1*.9&&by<=H1*.06;
    const textoAncho=us.length===1&&us[0].type==="text"&&bw>=W1*.55;
    let fx=s,fy=s,nx,ny,nw,nh;
    if(anchoTotal){ fx=sx; nx=bx*sx; nw=bw*sx; }
    else if(textoAncho){ const izq=bx*s, der=(W1-bx-bw)*s; nx=izq; nw=Math.max(bw*s,W2-izq-der); fx=nw/bw; }
    else { nw=bw*s; const cx=(bx+bw/2)/W1;
      nx=cx<.36?bx*s:cx>.64?W2-(W1-bx-bw)*s-nw:cx*W2-nw/2; }
    if(altoTotal){ fy=sy; ny=by*sy; nh=bh*sy; }
    else { nh=bh*s; const cy=(by+bh/2)/H1;
      ny=cy<.3?by*s:cy>.7?H2-(H1-by-bh)*s-nh:cy*H2-nh/2; }
    const fs=anchoTotal&&altoTotal?Math.min(sx,sy):s;
    us.forEach(o=>{
      o.x=redondo(nx+(o.x-bx)*fx); o.y=redondo(ny+(o.y-by)*fy);
      o.w=Math.max(4,redondo(o.w*fx));
      if(o.type==="text"){ o.size=Math.max(6,redondo(o.size*fs)); o.ls=+(o.ls*fs).toFixed(2); if(o.outline)o.outline.w=+(o.outline.w*fs).toFixed(2); }
      else o.h=Math.max(4,redondo(o.h*fy));
      if(o.type==="icon"){ const k=Math.min(o.w,o.h); o.w=o.h=k; }
      if(o.type==="shape"&&o.stroke)o.stroke.w=+(o.stroke.w*fs).toFixed(2);
      if(o.radius)o.radius=redondo(o.radius*fs);
      if(o.shadow&&o.shadow.on){ o.shadow={...o.shadow,x:o.shadow.x*fs,y:o.shadow.y*fs,blur:o.shadow.blur*fs}; }
    });
  }
  const doc={...deep(pag.doc),w:W2,h:H2}; if(mm)doc.mm={w:mm[0],h:mm[1]}; else delete doc.mm;
  return {...deep(pag),doc,objects:objs};
}
function cambiarTamano(){
  const d=E.State.st.doc, n=(E.Ediciones.actual&&E.Ediciones.actual.paginas.length)||1;
  const grupos=[...new Set(PRESETS.map(p=>p.cat))];
  dialogo("Cambiar tamaño",`
    <p class="est-nota" style="margin-bottom:10px">Ahora: <b>${d.w} × ${d.h} px</b>${n>1?` · ${n} páginas (se adaptan todas)`:""}. Elige uno o varios tamaños: cada elemento se reubica según su ancla (bordes, centro) y se escala; los fondos a sangre se estiran.</p>
    <div class="av-tamanos">${grupos.map(g=>`<div class="av-sub">${esc(g)}</div>`+PRESETS.filter(p=>p.cat===g).map(p=>`<label class="av-tam${p.w===d.w&&p.h===d.h?" actual":""}">
      <input type="checkbox" value="${p.k}" ${p.w===d.w&&p.h===d.h?"disabled":""}>${formaDe(p.w,p.h,28)}<span>${esc(p.n)}<small>${medida(p)}</small></span></label>`).join("")).join("")}
      <div class="av-sub">Personalizado</div>
      <label class="av-tam av-tam--libre"><input type="checkbox" value="custom" id="rt-custom"><span>Ancho <input type="number" id="rt-w" value="${d.w}" style="width:76px"> × alto <input type="number" id="rt-h" value="${d.h}" style="width:76px"> px</span></label></div>
    <div class="av-fila"><label><input type="radio" name="rt-modo" value="copias" checked> Crear una copia por tamaño (ediciones nuevas)</label>
      <label><input type="radio" name="rt-modo" value="esta"> Redimensionar esta edición</label></div>`,
  {aceptar:"Cambiar tamaño",ancho:720,alAceptar:c=>{
    const elegidos=[...c.querySelectorAll(".av-tamanos input[type=checkbox]:checked")].map(i=>i.value==="custom"
      ?{k:"custom",n:"Personalizado",w:+c.querySelector("#rt-w").value,h:+c.querySelector("#rt-h").value}:PRESETS.find(p=>p.k===i.value)).filter(p=>p&&p.w>=16&&p.h>=16);
    if(!elegidos.length){ toast("Elige al menos un tamaño"); return false; }
    const modo=c.querySelector("input[name=rt-modo]:checked").value;
    aplicarTamanos(elegidos,modo==="esta"?"esta":"copias");
  }});
}
function aplicarTamanos(elegidos,modo){
  if(!E.Ediciones.actual)E.Ediciones.nueva();
  E.Ediciones.persistir();
  const act=E.Ediciones.actual, pags=act.paginas.map(p=>deep(p));
  if(modo==="esta"){ const p=elegidos[0];
    const nuevas=pags.map(pg=>reubicar(pg,p.w,p.h,p.mm));
    act.paginas=nuevas; const cur=nuevas[act.pag];
    E.State.st.doc=deep(cur.doc); E.State.st.objects=deep(cur.objects);
    E.Ediciones.persistir(); E.Ediciones.abrir(act.id);
    toast(`Redimensionado a ${p.n} · ${medida(p)}`); return; }
  const LSK="identidad_editor_ediciones_v1", lista=E.Ediciones.lista(); let primera=null;
  elegidos.forEach(p=>{ const e={id:"e"+Date.now()+"-"+Math.floor(Math.random()*1e5),
      nombre:act.nombre.replace(/ \[[^\]]*\]$/,"")+` [${p.n}]`,fecha:Date.now(),favorito:false,archivado:false,
      paginas:pags.map(pg=>reubicar(pg,p.w,p.h,p.mm)),pag:0};
    lista.unshift(e); if(!primera)primera=e; });
  E.Store.set(LSK,JSON.stringify(lista));
  E.Ediciones.abrir(primera.id);
  toast(elegidos.length>1?`${elegidos.length} copias creadas en «Mis ediciones»; abierta: ${elegidos[0].n}`:`Copia en ${elegidos[0].n} creada y abierta (la original sigue en «Mis ediciones»)`);
  if(E.Panels.panelActual()==="edi")E.Panels.paint();
}
Avz.cambiarTamano=cambiarTamano; Avz.reubicar=reubicar; Avz.aplicarTamanos=aplicarTamanos;

/* ============================================================ ATAJOS */
const ATAJOS=[["Ctrl+Z / Ctrl+Mayús+Z","Deshacer / rehacer"],["Ctrl+C / Ctrl+V","Copiar / pegar"],["Ctrl+D","Duplicar"],
  ["Ctrl+G / Ctrl+Mayús+G","Agrupar / desagrupar"],["Ctrl+Alt+C / Ctrl+Alt+V","Copiar / pegar estilo"],
  ["Ctrl+] / Ctrl+[","Traer adelante / enviar atrás (con Mayús: al frente / al fondo)"],["Ctrl+Mayús+L","Bloquear o desbloquear"],
  ["Flechas (Mayús ×10)","Mover 1 px (10 px)"],["Mayús al arrastrar","Mover solo en horizontal o vertical; escalar proporcional"],
  ["Mayús al girar","Girar de 15° en 15° (sin Mayús, imán a 0°/45°/90°)"],["Doble clic en una foto","Recortar dentro del marco"],
  ["Ctrl+A","Seleccionar todo"],["Ctrl+0 · Ctrl+rueda","Ajustar a la ventana · zoom"],["Espacio+arrastrar","Mover la vista"],
  ["Ctrl+S","Guardar como plantilla"],["?","Esta ayuda"]];
function atajos(){ dialogo("Atajos de teclado",`<table class="av-atajos">${ATAJOS.map(([k,t])=>`<tr><td>${k.split(" / ").map(x=>x.split(" · ").map(y=>`<kbd>${esc(y)}</kbd>`).join(" · ")).join(" / ")}</td><td>${esc(t)}</td></tr>`).join("")}</table>`,{ancho:620}); }
Avz.atajos=atajos;

function ordenar(delta,extremo){
  const st=E.State.st, ids=new Set(st.sel); if(!ids.size)return;
  const sel=st.objects.filter(o=>ids.has(o.id)), resto=st.objects.filter(o=>!ids.has(o.id));
  if(extremo){ st.objects=delta>0?[...resto,...sel]:[...sel,...resto]; }
  else { const arr=st.objects.slice();
    const orden=delta>0?[...arr.keys()].reverse():[...arr.keys()];
    orden.forEach(i=>{ const j=i+delta; if(!ids.has(arr[i].id)||j<0||j>=arr.length||ids.has(arr[j].id))return; [arr[i],arr[j]]=[arr[j],arr[i]]; });
    st.objects=arr; }
  E.Render.all(); E.Layers.refresh(); E.History.snap(extremo?(delta>0?"Al frente":"Al fondo"):(delta>0?"Adelante":"Atrás"));
}

/* ============================================================ ARRANQUE DEL MÓDULO */
function iniciar(){
  /* paneles nuevos del riel */
  E.Panels.registrar("ele","Elementos","bloques",pintarElementos,4);
  E.Panels.registrar("mar","Marca","marca",pintarMarca,3);
  /* cabecera: Inicio y Cambiar tamaño */
  const tb=$("#topbar"), titulo=tb.querySelector(".brand");
  const bIni=document.createElement("button"); bIni.className="est-boton"; bIni.id="btn-inicio"; bIni.title="Inicio: crear, recientes y plantillas";
  bIni.innerHTML=ic("inicio")+"Inicio"; titulo.after(bIni); bIni.onclick=()=>Inicio.abrir();
  const sel=$("#docsize");
  const bTam=document.createElement("button"); bTam.className="est-boton"; bTam.id="btn-tamano"; bTam.title="Cambiar tamaño: adapta el diseño a otros formatos y crea copias";
  bTam.innerHTML=ic("redimensionar")+"Cambiar tamaño"; sel.after(bTam); bTam.onclick=()=>cambiarTamano();
  /* el selector de tamaño conoce los formatos nuevos */
  const og=document.createElement("optgroup"); og.label="Más formatos";
  PRESETS.forEach(p=>{ const v=p.w+"x"+p.h; if(![...sel.options].some(o=>o.value===v)){ const op=document.createElement("option"); op.value=v; op.textContent=`${p.n} ${p.w}×${p.h}`; og.appendChild(op); } });
  sel.insertBefore(og,sel.querySelector('option[value="custom"]'));
  sel.addEventListener("change",()=>{ const p=presetDe(E.State.st.doc.w,E.State.st.doc.h);
    if(p&&p.mm)E.State.st.doc.mm={w:p.mm[0],h:p.mm[1]}; else delete E.State.st.doc.mm; });
  E.Panels.syncDocSel();

  /* doble clic sobre una foto: recortar dentro del marco (con foto) o elegir del banco (marco vacío) */
  const vp=$("#viewport");
  vp.addEventListener("dblclick",e=>{
    if(E.Input.editing()||Recorte.activo())return;
    let obj=null; const vistos=new Set();
    for(const el of document.elementsFromPoint(e.clientX,e.clientY)){
      const box=el.closest&&el.closest(".obj"); if(!box||vistos.has(box))continue; vistos.add(box);
      const o=E.State.byId(box.dataset.id); if(o&&!o.locked&&(o.type==="text"||o.type==="image")){ obj=o; break; } }
    if(!obj||obj.type!=="image")return;
    e.stopPropagation(); e.preventDefault();
    if(obj.src)Recorte.empezar(obj);
    else elegirFoto((du,n,cr,src)=>ponerFotoEn(obj,du,n,cr,src),"Foto para el marco");
  },true);

  /* el resaltado de texto sigue a su texto en cada paso del historial */
  const _snap=E.History.snap; E.History.snap=function(){ try{ sincronizarResaltes(); }catch(_){} return _snap.apply(this,arguments); };

  /* teclado: antes que los atajos del editor (fase de captura) */
  addEventListener("keydown",e=>{
    const k=e.key, mod=e.ctrlKey||e.metaKey, enCampo=e.target&&e.target.matches&&e.target.matches("input,textarea,select,[contenteditable]");
    if(Recorte.activo()){ if(k==="Enter"||k==="Escape"){ e.preventDefault(); Recorte.terminar(); } e.stopImmediatePropagation(); return; }
    const capas=capasAbiertas();
    if(capas.length){
      if(k==="Escape"){ e.preventDefault(); const top=capas[capas.length-1];
        if(top.id==="av-inicio")Inicio.cerrar(); else { top.classList.remove("on"); top.innerHTML=""; } }
      if(!enCampo||k==="Escape")e.stopImmediatePropagation();
      return;
    }
    if($("#modal-bg")&&$("#modal-bg").style.display==="flex"){
      if(k==="Escape"){ e.preventDefault(); $("#modal-bg").style.display="none"; }
      if(!enCampo)e.stopImmediatePropagation(); return; }
    if(E.Input.editing())return;
    if(mod&&e.altKey&&e.code==="KeyC"){ e.preventDefault(); e.stopImmediatePropagation(); copiarEstilo(); }
    else if(mod&&e.altKey&&e.code==="KeyV"){ e.preventDefault(); e.stopImmediatePropagation(); pegarEstilo(); }
    else if(mod&&(e.code==="BracketRight"||e.code==="BracketLeft")){ e.preventDefault(); e.stopImmediatePropagation(); ordenar(e.code==="BracketRight"?1:-1,e.shiftKey); }
    else if(mod&&e.shiftKey&&e.code==="KeyL"){ e.preventDefault(); e.stopImmediatePropagation();
      const s=E.State.selObjs(); if(s.length){ const v=!s[0].locked; s.forEach(o=>o.locked=v); E.Render.all(); E.History.snap(v?"Bloquear":"Desbloquear"); toast(v?"Bloqueado":"Desbloqueado"); } }
    else if(k==="?"&&!mod){ e.preventDefault(); e.stopImmediatePropagation(); atajos(); }
  },true);

  E.Ediciones.pintarPaginas();
  cargarDiseno();
}
Avz.alArrancar=function(){
  if(Avz._arrancado)return; Avz._arrancado=true;
  if(/tpl=/.test(location.hash))return;   // acceso directo a una plantilla: sin pantalla de inicio
  Inicio.abrir();
};
Avz.inicioAbrir=()=>Inicio.abrir();
Avz.PRESETS=PRESETS;
E.Avz=Avz;
iniciar();
if(E.arrancado)Avz.alArrancar();
})();
