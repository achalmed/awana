/* ============================================================
   qr.js — codificador QR local (sin red ni dependencias) para el editor de piezas
   ------------------------------------------------------------
   Modo byte (UTF-8), versiones 1–40, corrección L/M/Q/H y elección de la máscara
   por penalización, según ISO/IEC 18004 (algoritmo de referencia de Project Nayuki,
   reescrito aquí). Devuelve la matriz de módulos; el editor la convierte en UNA forma
   vectorial (trazado 0..100), así el QR se exporta igual en PNG, PDF y SVG editable.

   Uso:
     const m = QR.codificar("https://ejemplo.org", "M");   // {tam, modulos:[[bool]], version}
     const d = QR.trazado(m, 4);                             // «d» de un path en 0..100 con zona tranquila de 4
   ============================================================ */
(function(){
"use strict";
const NIVELES={L:0,M:1,Q:2,H:3};
const BITS_FORMATO=[1,0,3,2];   // L, M, Q, H en los bits de formato
const ECC_POR_BLOQUE=[
  [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
  [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30]];
const BLOQUES=[
  [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
  [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
  [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
  [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81]];

const bit=(x,i)=>((x>>>i)&1)!==0;
function modulosCrudos(v){
  let r=(16*v+128)*v+64;
  if(v>=2){ const n=Math.floor(v/7)+2; r-=(25*n-10)*n-55; if(v>=7)r-=36; }
  return r;
}
const palabrasDatos=(v,e)=>Math.floor(modulosCrudos(v)/8)-ECC_POR_BLOQUE[e][v]*BLOQUES[e][v];

/* ---- Reed-Solomon sobre GF(2^8), polinomio 0x11D ---- */
function mulGF(x,y){ let z=0; for(let i=7;i>=0;i--){ z=(z<<1)^((z>>>7)*0x11D); z^=((y>>>i)&1)*x; } return z; }
function divisorRS(grado){
  const r=new Array(grado).fill(0); r[grado-1]=1; let raiz=1;
  for(let i=0;i<grado;i++){
    for(let j=0;j<grado;j++){ r[j]=mulGF(r[j],raiz); if(j+1<grado)r[j]^=r[j+1]; }
    raiz=mulGF(raiz,0x02);
  }
  return r;
}
function restoRS(datos,div){
  const r=new Array(div.length).fill(0);
  for(const b of datos){ const f=b^r.shift(); r.push(0); div.forEach((c,i)=>{ r[i]^=mulGF(c,f); }); }
  return r;
}

function posicionesAlineacion(v,tam){
  if(v===1)return [];
  const n=Math.floor(v/7)+2;
  const paso=(v===32)?26:Math.ceil((v*4+4)/(n*2-2))*2;
  const r=[6];
  for(let p=tam-7;r.length<n;p-=paso)r.splice(1,0,p);
  return r;
}

function codificar(texto,nivel){
  const bytes=[...new TextEncoder().encode(String(texto||""))];
  let e=NIVELES[nivel||"M"]; if(e==null)e=1;
  /* versión mínima en la que caben los datos */
  let v, cap;
  for(v=1;v<=40;v++){
    const ccBits=v<=9?8:16;
    cap=palabrasDatos(v,e)*8;
    if(4+ccBits+bytes.length*8<=cap)break;
  }
  if(v>40)throw new Error("El texto es demasiado largo para un código QR");
  /* subir la corrección si cabe en la misma versión */
  for(let e2=e+1;e2<=3;e2++){ const ccBits=v<=9?8:16; if(4+ccBits+bytes.length*8<=palabrasDatos(v,e2)*8)e=e2; else break; }
  cap=palabrasDatos(v,e)*8;
  /* flujo de bits */
  const bb=[]; const push=(val,n)=>{ for(let i=n-1;i>=0;i--)bb.push((val>>>i)&1); };
  push(0x4,4); push(bytes.length,v<=9?8:16); bytes.forEach(b=>push(b,8));
  push(0,Math.min(4,cap-bb.length));
  push(0,(8-bb.length%8)%8);
  for(let p=0xEC;bb.length<cap;p^=0xEC^0x11)push(p,8);
  const datos=[]; for(let i=0;i<bb.length;i+=8){ let b=0; for(let j=0;j<8;j++)b=(b<<1)|bb[i+j]; datos.push(b); }
  /* bloques + corrección + intercalado */
  const nb=BLOQUES[e][v], eccLen=ECC_POR_BLOQUE[e][v], crudas=Math.floor(modulosCrudos(v)/8);
  const cortos=nb-crudas%nb, largoCorto=Math.floor(crudas/nb), div=divisorRS(eccLen), bloques=[];
  for(let i=0,k=0;i<nb;i++){
    const d=datos.slice(k,k+largoCorto-eccLen+(i<cortos?0:1)); k+=d.length;
    const ecc=restoRS(d,div); if(i<cortos)d.push(0); bloques.push(d.concat(ecc));
  }
  const final=[];
  for(let i=0;i<bloques[0].length;i++)bloques.forEach((b,j)=>{ if(i!==largoCorto-eccLen||j>=cortos)final.push(b[i]); });

  /* matriz */
  const tam=v*4+17;
  const mod=Array.from({length:tam},()=>new Array(tam).fill(false));
  const fun=Array.from({length:tam},()=>new Array(tam).fill(false));
  const fijar=(x,y,o)=>{ mod[y][x]=o; fun[y][x]=true; };
  for(let i=0;i<tam;i++){ fijar(6,i,i%2===0); fijar(i,6,i%2===0); }
  const buscador=(x,y)=>{ for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
      const d=Math.max(Math.abs(dx),Math.abs(dy)), xx=x+dx, yy=y+dy;
      if(xx>=0&&xx<tam&&yy>=0&&yy<tam)fijar(xx,yy,d!==2&&d!==4); } };
  buscador(3,3); buscador(tam-4,3); buscador(3,tam-4);
  const al=posicionesAlineacion(v,tam), na=al.length;
  for(let i=0;i<na;i++)for(let j=0;j<na;j++){
    if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))continue;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)fijar(al[i]+dx,al[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
  }
  const formato=mascara=>{
    const d=(BITS_FORMATO[e]<<3)|mascara; let r=d;
    for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);
    const b=((d<<10)|r)^0x5412;
    for(let i=0;i<=5;i++)fijar(8,i,bit(b,i));
    fijar(8,7,bit(b,6)); fijar(8,8,bit(b,7)); fijar(7,8,bit(b,8));
    for(let i=9;i<15;i++)fijar(14-i,8,bit(b,i));
    for(let i=0;i<8;i++)fijar(tam-1-i,8,bit(b,i));
    for(let i=8;i<15;i++)fijar(8,tam-15+i,bit(b,i));
    fijar(8,tam-8,true);
  };
  formato(0);
  if(v>=7){ let r=v; for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1F25);
    const b=(v<<12)|r;
    for(let i=0;i<18;i++){ const o=bit(b,i), a=tam-11+i%3, c=Math.floor(i/3); fijar(a,c,o); fijar(c,a,o); } }
  /* palabras en zigzag */
  let i=0;
  for(let der=tam-1;der>=1;der-=2){
    if(der===6)der=5;
    for(let vert=0;vert<tam;vert++)for(let j=0;j<2;j++){
      const x=der-j, sube=((der+1)&2)===0, y=sube?tam-1-vert:vert;
      if(!fun[y][x]&&i<final.length*8){ mod[y][x]=bit(final[i>>>3],7-(i&7)); i++; }
    }
  }
  const invertir=(y,x,m)=>{
    switch(m){
      case 0:return (x+y)%2===0; case 1:return y%2===0; case 2:return x%3===0; case 3:return (x+y)%3===0;
      case 4:return (Math.floor(x/3)+Math.floor(y/2))%2===0; case 5:return x*y%2+x*y%3===0;
      case 6:return (x*y%2+x*y%3)%2===0; default:return ((x+y)%2+x*y%3)%2===0;
    }
  };
  const aplicar=m=>{ for(let y=0;y<tam;y++)for(let x=0;x<tam;x++)if(!fun[y][x]&&invertir(y,x,m))mod[y][x]=!mod[y][x]; };
  let mejor=0, minPen=Infinity;
  for(let m=0;m<8;m++){ aplicar(m); formato(m); const p=penalizacion(mod,tam); if(p<minPen){minPen=p;mejor=m;} aplicar(m); }
  aplicar(mejor); formato(mejor);
  return {tam,modulos:mod,version:v,nivel:"LMQH"[e],mascara:mejor};
}

/* Penalización de la norma (rachas, bloques 2×2, patrones parecidos al buscador y balance). */
function penalizacion(m,tam){
  let p=0, oscuros=0;
  const fila=(get)=>{
    let s="";
    for(let k=0;k<tam;k++)s+=get(k)?"1":"0";
    s.replace(/0{5,}|1{5,}/g,r=>{ p+=3+(r.length-5); return r; });
    let k=-1; while((k=s.indexOf("1011101",k+1))>=0){
      const antes=s.slice(Math.max(0,k-4),k), despues=s.slice(k+7,k+11);
      if((k<4||antes==="0000")||(k+11>tam||despues==="0000"))p+=40;
    }
  };
  for(let y=0;y<tam;y++)fila(x=>m[y][x]);
  for(let x=0;x<tam;x++)fila(y=>m[y][x]);
  for(let y=0;y<tam-1;y++)for(let x=0;x<tam-1;x++){
    const c=m[y][x]; if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])p+=3; }
  for(let y=0;y<tam;y++)for(let x=0;x<tam;x++)if(m[y][x])oscuros++;
  const total=tam*tam, k=Math.ceil(Math.abs(oscuros*20-total*10)/total)-1;
  return p+Math.max(0,k)*10;
}

/* Trazado único (rachas horizontales como rectángulos) en el espacio 0..100 de las formas del editor. */
function trazado(q,margen){
  margen=margen==null?4:margen;
  const n=q.tam+2*margen, u=100/n, f=v=>+(v).toFixed(3);
  let d="";
  for(let y=0;y<q.tam;y++){
    let x=0;
    while(x<q.tam){
      if(!q.modulos[y][x]){x++;continue;}
      let x2=x; while(x2<q.tam&&q.modulos[y][x2])x2++;
      d+=`M${f((x+margen)*u)} ${f((y+margen)*u)}h${f((x2-x)*u)}v${f(u)}h${f(-(x2-x)*u)}z`;
      x=x2;
    }
  }
  return d;
}

window.QR={codificar,trazado};
})();
