/* ============================================================
   empaquetar.js — ZIP y PDF de varias páginas, escritos en el navegador (sin red ni dependencias)
   ------------------------------------------------------------
   Lo usa el editor de piezas para «Exportar todas las páginas» de un carrusel:
     Empaquetar.zip([{nombre, datos:Uint8Array}])                → Blob application/zip (sin compresión: PNG/JPG ya lo están)
     Empaquetar.pdf([{jpeg:Uint8Array, px:[w,h], pt:[w,h]}])    → Blob application/pdf (una imagen JPEG por página)
     Empaquetar.bytes(canvas, "image/jpeg", 0.92)              → Promise<Uint8Array>
   ============================================================ */
(function(){
"use strict";
const TABLA=(()=>{ const t=new Uint32Array(256);
  for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; }
  return t; })();
function crc32(b){ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++)c=TABLA[(c^b[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }

function zip(archivos){
  const enc=new TextEncoder(), partes=[], central=[]; let desp=0;
  const d=new Date(), hora=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),
    fecha=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  archivos.forEach(a=>{
    const nom=enc.encode(a.nombre), dat=a.datos, crc=crc32(dat);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint16(8,0,true);
    lh.setUint16(10,hora,true); lh.setUint16(12,fecha,true); lh.setUint32(14,crc,true);
    lh.setUint32(18,dat.length,true); lh.setUint32(22,dat.length,true); lh.setUint16(26,nom.length,true); lh.setUint16(28,0,true);
    partes.push(new Uint8Array(lh.buffer),nom,dat);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true);
    ch.setUint16(10,0,true); ch.setUint16(12,hora,true); ch.setUint16(14,fecha,true); ch.setUint32(16,crc,true);
    ch.setUint32(20,dat.length,true); ch.setUint32(24,dat.length,true); ch.setUint16(28,nom.length,true);
    ch.setUint16(30,0,true); ch.setUint16(32,0,true); ch.setUint16(34,0,true); ch.setUint16(36,0,true);
    ch.setUint32(38,0,true); ch.setUint32(42,desp,true);
    central.push(new Uint8Array(ch.buffer),nom);
    desp+=30+nom.length+dat.length;
  });
  const tamCentral=central.reduce((t,p)=>t+p.length,0);
  const fin=new DataView(new ArrayBuffer(22));
  fin.setUint32(0,0x06054b50,true); fin.setUint16(8,archivos.length,true); fin.setUint16(10,archivos.length,true);
  fin.setUint32(12,tamCentral,true); fin.setUint32(16,desp,true);
  return new Blob([...partes,...central,new Uint8Array(fin.buffer)],{type:"application/zip"});
}

/* PDF 1.4 mínimo: catálogo, árbol de páginas y, por página, un XObject JPEG (DCTDecode) a página completa. */
function pdf(paginas,titulo){
  const enc=new TextEncoder(), partes=[], offs=[]; let pos=0;
  const put=x=>{ const b=typeof x==="string"?enc.encode(x):x; partes.push(b); pos+=b.length; };
  const obj=(n,cuerpo,flujo)=>{ offs[n]=pos; put(`${n} 0 obj\n${cuerpo}\n`);
    if(flujo){ put("stream\n"); put(flujo); put("\nendstream\n"); } put("endobj\n"); };
  put("%PDF-1.4\n"); put(new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,0x0A]));
  const n=paginas.length, kids=[];
  for(let i=0;i<n;i++)kids.push(`${3+i*3} 0 R`);
  obj(1,"<< /Type /Catalog /Pages 2 0 R >>");
  obj(2,`<< /Type /Pages /Count ${n} /Kids [${kids.join(" ")}] >>`);
  const f=v=>(+v).toFixed(2);
  paginas.forEach((p,i)=>{
    const pg=3+i*3, cont=pg+1, im=pg+2, [W,H]=p.pt, [w,h]=p.px;
    obj(pg,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(W)} ${f(H)}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${cont} 0 R >>`);
    const c=enc.encode(`q ${f(W)} 0 0 ${f(H)} 0 0 cm /Im${i} Do Q`);
    obj(cont,`<< /Length ${c.length} >>`,c);
    obj(im,`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>`,p.jpeg);
  });
  const info=3+n*3;
  const t=String(titulo||"Pieza").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[()\\]/g,"").replace(/[^\x20-\x7E]/g,"");
  obj(info,`<< /Title (${t}) /Producer (identidad-visual - editor de piezas) >>`);
  const xref=pos;
  let x=`xref\n0 ${info+1}\n0000000000 65535 f \n`;
  for(let k=1;k<=info;k++)x+=String(offs[k]).padStart(10,"0")+" 00000 n \n";
  put(x); put(`trailer\n<< /Size ${info+1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(partes,{type:"application/pdf"});
}

function bytes(canvas,mime,calidad){
  return new Promise((ok,mal)=>canvas.toBlob(b=>{ if(!b)return mal(new Error("No se pudo codificar la imagen"));
    b.arrayBuffer().then(a=>ok(new Uint8Array(a)),mal); },mime,calidad));
}
function descargar(blob,nombre){
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=nombre; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

window.Empaquetar={zip,pdf,bytes,descargar,crc32};
})();
