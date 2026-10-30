(function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const D=JSON.parse($('#fin-data').textContent);
const LOGO_W='/*__LOGO__*/';
const FONT_CSS=($('#fontcss')||{}).textContent||'';
const MES=D.meses, mes=MES.map(m=>m.toLowerCase());
const MESL=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const VB=D.verbas, PAL=['var(--s1)','var(--s2)','var(--s5)','var(--s3)','var(--gold)','#6f8fa3','#b5654a','#7d8f3a','#8a6fb0','#3c9aa5','var(--s4)','#c9a227'];
const VBC=VB.map((_,i)=>PAL[i%PAL.length]);const ALLV=VB.map((_,i)=>i);
const L=D.L.map(a=>({m:a[0],vb:a[1],cc:a[2],ccd:a[3],cl:a[4],sb:a[5],fx:a[6],fo:a[7],v:a[8],row:a[9],si:a[10],ds:a[11],dia:a[12]}));
const IMOB=new Map(Object.entries(D.imob).map(([k,v])=>[+k,v]));
const M_=D.meta||{};const REAL=M_.real??9, CUR=M_.cur??10;
const VGV_OK=m=>!!(D.vgvOk?D.vgvOk[m-1]:(m<=REAL&&D.vgv26[m-1]!=null));
const span_=(a,b)=>{a=Math.max(1,a);b=Math.min(12,b);return a>b?'':a===b?MES[a-1].toLowerCase():MES[a-1].toLowerCase()+'–'+MES[b-1].toLowerCase();};
const REAL_T=span_(1,REAL),CUR_T=CUR>=1&&CUR<=12?MES[CUR-1].toLowerCase():'',PROV_T=span_(CUR+1,12);
const cap=t=>t?t[0].toUpperCase()+t.slice(1):t;
const plv=(t,a,b)=>t.includes('–')?b:a;
const QI=D.qi||[];const MDN='Marketing Digital';
const nrm=x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const vbIdx=names=>VB.map((n,i)=>[n,i]).filter(([n])=>names.includes(nrm(n))).map(x=>x[1]);
const SINTTA_VB=vbIdx(['sintta','operacao']);const DIG_VB=vbIdx(['marketing digital','midia digital']);
const IMOB_CL=D.cls.map((n,i)=>[n,i]).filter(([n])=>/imobili/.test(nrm(n))).map(x=>x[1]);
const FIX={imobiliarias:{vb:false,f:r=>IMOB_CL.includes(r.cl),txt:['Classificação',(IMOB_CL.map(i=>D.cls[i]).join(', ')||'—')+' (fixa nesta tela)']},
           sintta:{vb:true,f:r=>SINTTA_VB.includes(r.vb),txt:['Verba',(SINTTA_VB.map(i=>VB[i]).join(' + ')||'—')+' (fixa nesta tela)']}};
const IMOB_LAST=D.vgvImob.reduce((a,v,i)=>v>0?i+1:a,0);
const EMP_LAST=[0,1,2,3,4,5,6,7,8,9,10,11].reduce((a,i)=>D.vendasEmp.some(e=>e.vgv[i])?i+1:a,0);const EMP_T=span_(1,EMP_LAST)||'—';const IMOB_T=span_(1,IMOB_LAST)||'—';
const DESP25=D.desp25||null; /* a planilha não traz despesas de 2025 */
const CAM='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
const OBS={};const obs=(id,arr)=>{OBS[id]=arr.filter(Boolean);};

/* ---------- formatação ---------- */
const nf=d=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const N0=nf(0),N1=nf(1),N2=nf(2);
const brl=v=>'R$ '+N2.format(v);
function brlC(v){const a=Math.abs(v);
  if(a>=1e6)return 'R$ '+(a>=1e8?N1:nf(2)).format(v/1e6)+' mi';
  if(a>=1e3)return 'R$ '+(a>=1e5?N0:N1).format(v/1e3)+' mil';
  return 'R$ '+N0.format(v);}
const pct=(x,d=1)=>isFinite(x)?nf(d).format(x*100)+'%':'—';
const kfmt=v=>v>=99950?N0.format(v/1e3):N1.format(v/1e3);
function axFmt(v){if(!v)return '0';const a=Math.abs(v);if(a>=1e6)return N1.format(v/1e6).replace(/,0$/,'')+' mi';if(a>=1e3)return N0.format(v/1e3)+' mil';return N0.format(v);}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function rangeTxt(ms){if(!ms.length)return '—';const a=ms[0],b=ms[ms.length-1];const cont=ms.every((m,i)=>!i||m===ms[i-1]+1);if(a===b)return mes[a-1];return cont?mes[a-1]+'–'+mes[b-1]:ms.map(m=>mes[m-1]).join(', ');}
function toast(t,ms){const el=$('#toast');el.textContent=t;el.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('on'),ms||2800);}
const nowTxt=()=>{const d=new Date();return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});};
const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'');
const fname=id=>IMOB.get(id)||D.forn[id];
const nLc=n=>N0.format(n)+(n===1?' lançamento':' lançamentos');

/* ---------- estado ---------- */
const FDEF=()=>({m0:1,m1:12,vb:ALLV.slice(),cc:[],cl:[],fo:[]});
let F=FDEF();
const ST={rail:false,page:'visao'};
try{const s=JSON.parse(localStorage.getItem('duefin3')||'{}');if(s.rail)ST.rail=true;if(s.page)ST.page=s.page;if(s.theme)ST.theme=s.theme;if(s.F)F=Object.assign(FDEF(),s.F);}catch(e){}
function save(){try{localStorage.setItem('duefin3',JSON.stringify({rail:ST.rail,page:ST.page,theme:ST.theme,F}))}catch(e){}}
const curSec=()=>document.getElementById('pg-'+ST.page);
const PV=()=>FIX[ST.page]||null;
function match(r,skip,pv){
  if(r.m<F.m0||r.m>F.m1)return false;
  if(pv&&!pv.f(r))return false;
  if(!(pv&&pv.vb)&&skip!=='vb'&&!F.vb.includes(r.vb))return false;
  if(skip!=='cc'&&F.cc.length&&!F.cc.includes(r.cc))return false;
  if(skip!=='cl'&&F.cl.length&&!F.cl.includes(r.cl))return false;
  if(skip!=='fo'&&F.fo.length&&!F.fo.includes(r.fo))return false;
  return true;
}
function rows(o={}){const pv=o.pv!==undefined?o.pv:PV();return L.filter(r=>match(r,o.skip,pv)&&(!o.where||o.where(r)));}
const MS=()=>{const a=[];for(let m=F.m0;m<=F.m1;m++)a.push(m);return a;};
const tot=rs=>rs.reduce((s,r)=>s+r.v,0);
function group(rs,key){const m=new Map();for(const r of rs){const k=typeof key==='function'?key(r):r[key];m.set(k,(m.get(k)||0)+r.v);}return [...m].sort((a,b)=>b[1]-a[1]);}
function monthly(rs){const a=Array(12).fill(0);for(const r of rs)a[r.m-1]+=r.v;return a;}
const stat=m=>m<=REAL?'':m===CUR?'em curso':'provisão';
const perTxt=()=>F.m0===1&&F.m1===12?'Jan–Dez/26':F.m0===F.m1?MES[F.m0-1]+'/26':`${MES[F.m0-1]}–${MES[F.m1-1]}/26`;
function pageWhere(){return {};}

/* ---------- tooltip ---------- */
const TIP=$('#tip');
function showTip(e,html){TIP.innerHTML=html;TIP.classList.add('on');const r=TIP.getBoundingClientRect();let x=e.clientX+14,y=e.clientY+14;if(x+r.width>innerWidth-8)x=e.clientX-r.width-14;if(y+r.height>innerHeight-8)y=e.clientY-r.height-14;TIP.style.left=Math.max(8,x)+'px';TIP.style.top=Math.max(8,y)+'px';}
const hideTip=()=>TIP.classList.remove('on');
const trow=(c,l,v)=>`<div class="tr"><span>${c?`<i style="--c:${c}"></i>`:''}${esc(l)}</span><b>${v}</b></div>`;

/* ---------- gráficos ---------- */
function nstep(v){if(v<=0)return 1;const e=Math.pow(10,Math.floor(Math.log10(v)));const f=v/e;return (f<=1?1:f<=2?2:f<=5?5:10)*e;}
function scale(max,n){const st=nstep(max/(n||4));const k=n||Math.max(1,Math.ceil(max/st));return {max:st*k,n:k,st};}
function barChart(el,o){
  const W=Math.max(300,el.clientWidth||640),H=o.h||250;
  const lines=o.lines||(o.line?[o.line]:[]);
  const hasSub=o.cats.some(c=>c.sub);
  const pl=54,pr=lines.length?54:8,pt=16,pb=hasSub?42:28;
  const n=o.cats.length,iw=W-pl-pr,ih=H-pt-pb,band=iw/Math.max(n,1);
  const stack=o.mode!=='group';
  const tots=o.cats.map((_,i)=>stack?o.series.reduce((s,se)=>s+Math.max(0,se.vals[i]||0),0):Math.max(0,...o.series.map(se=>se.vals[i]||0)));
  const sc=scale(Math.max(0,...tots));const ymax=sc.max,NT=sc.n;const y=v=>pt+ih-(v/ymax)*ih;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria||'gráfico')}">`;
  for(let k=0;k<=NT;k++){const v=ymax*k/NT,yy=y(v);s+=`<line class="gl" x1="${pl}" x2="${W-pr}" y1="${yy}" y2="${yy}"/><text class="ax" x="${pl-8}" y="${yy+3.5}" text-anchor="end">${axFmt(v)}</text>`;}
  let ly=null;
  if(lines.length){const lv=lines.flatMap(l=>l.vals.filter(v=>v!=null));const lmax=scale(Math.max(0,...lv),NT).max;ly=v=>pt+ih-(v/lmax)*ih;
    for(let k=0;k<=NT;k++){const v=lmax*k/NT;s+=`<text class="ax" x="${W-pr+8}" y="${ly(v)+3.5}" text-anchor="start">${axFmt(v)}</text>`;}}
  const bw=stack?Math.min(46,band*.62):Math.min(24,band*.8/o.series.length);
  o.cats.forEach((c,i)=>{
    const cx=pl+band*i+band/2,op=c.dim?' opacity=".5"':'';
    if(stack){let acc=0;o.series.forEach(se=>{const v=se.vals[i]||0;if(v<=0)return;const y0=y(acc),y1=y(acc+v);s+=`<rect x="${(cx-bw/2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,y0-y1).toFixed(1)}" style="fill:${se.color}"${op}/>`;acc+=v;});
      if(tots[i]>0&&band>=40&&!o.noTop)s+=`<text class="ax-v" x="${cx}" y="${y(tots[i])-5}" text-anchor="middle">${axFmt(tots[i])}</text>`;}
    else{o.series.forEach((se,j)=>{const v=se.vals[i];if(!v)return;const x=cx-(bw*o.series.length)/2+j*bw;s+=`<rect x="${(x+1).toFixed(1)}" y="${y(v).toFixed(1)}" width="${(bw-2).toFixed(1)}" height="${(pt+ih-y(v)).toFixed(1)}" rx="2" style="fill:${se.color}"${op}/>`;});}
    s+=`<text class="ax" x="${cx}" y="${H-pb+16}" text-anchor="middle">${esc(c.label)}</text>`;
    if(c.sub&&band>=50)s+=`<text class="ax-s" x="${cx}" y="${H-pb+29}" text-anchor="middle">${esc(c.sub)}</text>`;
  });
  lines.forEach(l=>{
    const pts=[];l.vals.forEach((v,i)=>{if(v!=null)pts.push({i,x:pl+band*i+band/2,y:ly(v)});});
    const df=l.dashFrom==null?Infinity:l.dashFrom;
    const path=arr=>arr.map((p,k)=>(k?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join('');
    const a=pts.filter(p=>p.i<df),b=pts.filter(p=>p.i>=df-1);
    const st=`fill:none;stroke:${l.color};stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round`;
    if(a.length>1)s+=`<path d="${path(a)}" style="${st}"/>`;
    if(df!==Infinity&&b.length>1)s+=`<path d="${path(b)}" style="${st};stroke-dasharray:5 5"/>`;
    pts.forEach(p=>{s+=`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.6" style="fill:${p.i>=df?l.color:'var(--card)'};stroke:${l.color};stroke-width:2"/>`;});
  });
  o.cats.forEach((c,i)=>{s+=`<rect class="hit" data-i="${i}" x="${(pl+band*i).toFixed(1)}" y="${pt}" width="${band.toFixed(1)}" height="${ih}" style="fill:transparent"/>`;});
  s+='</svg>';el.innerHTML=s;
  if(o.tip)el.querySelectorAll('.hit').forEach(h=>{const f=e=>showTip(e,o.tip(+h.dataset.i));h.addEventListener('mousemove',f);h.addEventListener('click',f);h.addEventListener('mouseleave',hideTip);});
}
function hbars(el,items){
  if(!items.length){el.innerHTML='<p class="empty">Sem lançamentos no recorte.</p>';return;}
  const max=Math.max(...items.map(it=>it.total),1);
  el.innerHTML=items.map((it,i)=>{const tag=it.act?'button type="button"':'div';const end=it.act?'button':'div';
    const segs=it.segs||[{v:it.total,c:it.c||'var(--s1)'}];
    return `<${tag} class="brow${it.on?' on':''}" data-i="${i}"><span class="n" title="${esc(it.label)}">${esc(it.label)}${it.sub?`<small>${esc(it.sub)}</small>`:''}</span><span class="track">${segs.filter(sg=>sg.v>0).map(sg=>`<i style="width:${(sg.v/max*100).toFixed(2)}%;--c:${sg.c}"></i>`).join('')}</span><span class="val">${it.val}</span></${end}>`;}).join('');
  el.querySelectorAll('.brow').forEach(b=>{const it=items[+b.dataset.i];if(it.act)b.addEventListener('click',it.act);});
}
function heatCell(v,max,cls=''){if(!v)return `<td class="z ${cls}">—</td>`;const p=Math.round(8+86*Math.sqrt(v/max));return `<td class="${cls}" style="background:color-mix(in srgb,var(--heat-hi) ${p}%,var(--heat-lo));color:${p>52?'var(--heat-ink-hi)':'var(--ink)'}" title="${esc(brl(v))}">${kfmt(v)}</td>`;}
function heat(el,o){
  const ms=o.months;const data=o.rows.filter(r=>!r.grp);
  if(!data.length||!ms.length){el.innerHTML='<tbody><tr><td class="empty">Sem lançamentos no recorte.</td></tr></tbody>';return;}
  const max=Math.max(1,...data.flatMap(r=>ms.map(m=>r.vals[m-1]||0)));
  let h=`<thead><tr><th class="l">${esc(o.head||'')}</th>${ms.map(m=>`<th class="${m>CUR?'prov':''}">${MES[m-1]}</th>`).join('')}<th>Total</th></tr></thead><tbody>`;
  for(const r of o.rows){
    if(r.grp){h+=`<tr class="grp"><td colspan="${ms.length+2}">${esc(r.grp)}</td></tr>`;continue;}
    const t=ms.reduce((s,m)=>s+(r.vals[m-1]||0),0);
    h+=`<tr class="${r.pick?'pick':''}${r.sel?' rsel':''}" data-id="${r.id??''}"><td class="l" title="${esc(r.title||r.label)}">${esc(r.label)}</td>${ms.map(m=>heatCell(r.vals[m-1]||0,max,m>CUR?'prov':'')).join('')}<td class="t">${t?kfmt(t):'—'}</td></tr>`;
  }
  h+='</tbody>';
  if(o.foot!==false){const ft=ms.map(m=>data.reduce((s,r)=>s+(r.vals[m-1]||0),0));h+=`<tfoot><tr><td class="l">Total</td>${ft.map((v,i)=>`<td class="${ms[i]>CUR?'prov':''}">${v?kfmt(v):'—'}</td>`).join('')}<td>${kfmt(ft.reduce((a,b)=>a+b,0))}</td></tr></tfoot>`;}
  el.innerHTML=h;
  if(o.onPick)el.querySelectorAll('tr.pick').forEach(tr=>tr.addEventListener('click',()=>o.onPick(tr.dataset.id)));
}
function kpis(el,items){el.innerHTML=items.map(k=>`<div class="kpi${k.lead?' lead':''}"><span class="k">${k.k}</span><span class="v${k.dash?' dash':''}">${k.v}</span>${k.s?`<span class="s">${k.s}</span>`:''}${k.share!=null?`<div class="share"><i style="width:${Math.min(100,Math.max(0,k.share*100)).toFixed(1)}%;--c:${k.c||'var(--gold)'}"></i></div>`:''}</div>`).join('');}
function sortable(table,state,cb){table.querySelectorAll('th[data-k]').forEach(th=>{if(th.dataset.k===state.k)th.setAttribute('aria-sort',state.d>0?'ascending':'descending');th.addEventListener('click',e=>{e.stopPropagation();if(state.k===th.dataset.k)state.d*=-1;else{state.k=th.dataset.k;state.d=th.dataset.t==='s'?1:-1;}cb();});});}
function pager(el,page,total,size,cb){const pages=Math.max(1,Math.ceil(total/size));const a=total?page*size+1:0,b=Math.min(total,(page+1)*size);
  el.innerHTML=`<span>${N0.format(a)}–${N0.format(b)} de ${N0.format(total)}</span><span class="pg-btns"><button type="button" data-d="-1" ${page<=0?'disabled':''}>Anterior</button><button type="button" data-d="1" ${page>=pages-1?'disabled':''}>Próxima</button></span>`;
  el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>cb(page+ +b.dataset.d)));}
function bindRows(tb,fn){tb.querySelectorAll('tr.clk').forEach(tr=>{tr.tabIndex=0;tr.addEventListener('click',e=>{if(e.target.closest('button,a,input'))return;fn(tr.dataset.id);});tr.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(tr.dataset.id);}});});}

/* ---------- textos que dependem da carga ---------- */
(()=>{const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  set('m-data',M_.dataPlanilha||'—');set('m-ncl',N0.format(D.cls.length));set('m-imobcl',IMOB_CL.map(i=>D.cls[i]).join(', ')||'nenhuma');set('m-sinttavb',SINTTA_VB.map(i=>VB[i]).join(' e ')||'—');set('m-empt',EMP_T);set('m-empt2',EMP_T);set('m-empm',EMP_LAST?MESL[EMP_LAST-1].toLowerCase()+'/26':'—');set('m-imobm',IMOB_LAST?MESL[IMOB_LAST-1].toLowerCase():'—');set('m-nlanc',N0.format(L.length));set('m-ccdv',N0.format(M_.ccdVazio??0));set('m-ccdd',N0.format(M_.ccdDif??0));
  const vm=[1,2,3,4,5,6,7,8,9,10,11,12].filter(VGV_OK);
  set('m-period',`Despesas Jan–Dez/26${REAL_T?` (realizado até ${MES[REAL-1].toLowerCase()})`:''} · VGV ${vm.length?span_(vm[0],vm[vm.length-1]).replace(/^./,c=>c.toUpperCase())+'/26':'—'}`);
  const nl=[1,2,3,4,5,6,7,8,9,10,11,12].filter(m=>m<=Math.min(CUR,12)&&!VGV_OK(m));
  set('m-vgvnote',nl.length?`${nl.map(m=>MESL[m-1]+(D.vgv26[m-1]?` (consta ${brlC(D.vgv26[m-1])})`:'')).join(', ')} ainda sem VGV lançado: ${nl.length>1?'ficam':'fica'} fora das comparações.`:'');
  const pp=(id,a,b,lab)=>{const e=document.getElementById(id);if(!e)return;if(a>b||a<1||b>12){e.remove();return;}e.dataset.p=a+'-'+b;e.textContent=`${lab} (${span_(a,b)})`;};
  pp('pp-real',1,REAL,'Realizado');pp('pp-cur',CUR,CUR,'Em curso');pp('pp-prov',CUR+1,12,'Provisão');
})();
/* ---------- filtro global ---------- */
const m0=$('#f-m0'),m1=$('#f-m1');
MES.forEach((m,i)=>{m0.add(new Option(m+'/26',i+1));m1.add(new Option(m+'/26',i+1));});
m0.addEventListener('change',()=>{F.m0=+m0.value;if(F.m1<F.m0)F.m1=F.m0;changed();});
m1.addEventListener('change',()=>{F.m1=+m1.value;if(F.m0>F.m1)F.m0=F.m1;changed();});
$$('#gf [data-p]').forEach(b=>b.addEventListener('click',()=>{const [a,c]=b.dataset.p.split('-').map(Number);F.m0=a;F.m1=c;changed();}));
$('#f-vb').innerHTML=VB.map((v,i)=>`<button class="chip" type="button" data-i="${i}" style="--c:${VBC[i]}"><span class="sw"></span>${v}</button>`).join('');
$$('#f-vb .chip').forEach(b=>b.addEventListener('click',()=>{const i=+b.dataset.i;F.vb=F.vb.includes(i)?F.vb.filter(x=>x!==i):[...F.vb,i].sort();if(!F.vb.length)F.vb=ALLV.slice();changed();}));
$('#reset').addEventListener('click',()=>{F=FDEF();changed();});

const DDS={};
function makeDD(key,opt){
  const host=$('#dd-'+key);
  host.innerHTML=`<button class="dd-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-labelledby="lab-${key}"></button><div class="dd-panel" hidden><input class="dd-srch" id="dd-${key}-q" type="search" placeholder="Buscar" aria-label="Buscar ${opt.label}"><div class="dd-actions"><button class="mini" type="button" data-a="all">Todos</button><small></small></div><div class="dd-list"></div></div>`;
  const btn=host.querySelector('.dd-btn'),panel=host.querySelector('.dd-panel'),list=host.querySelector('.dd-list'),q=host.querySelector('.dd-srch'),cnt=host.querySelector('small');
  const open=on=>{panel.hidden=!on;btn.setAttribute('aria-expanded',on);if(on){Object.values(DDS).forEach(d=>{if(d!==api)d.open(false)});q.value='';fill();setTimeout(()=>q.focus(),0);}};
  btn.addEventListener('click',e=>{e.stopPropagation();open(panel.hidden);});
  panel.addEventListener('click',e=>e.stopPropagation());
  q.addEventListener('input',fill);
  host.querySelector('[data-a="all"]').addEventListener('click',()=>{F[key]=[];changed();fill();});
  function fill(){
    const facet=new Map(group(rows({skip:key}),key));
    const term=q.value.trim().toLowerCase();
    let items=opt.items().map(it=>({...it,v:facet.get(it.id)||0}));
    if(term)items=items.filter(it=>it.name.toLowerCase().includes(term)||(it.alt||'').toLowerCase().includes(term));
    if(opt.sortByValue)items.sort((a,b)=>b.v-a.v||a.name.localeCompare(b.name,'pt'));
    const all=!F[key].length;let html='',lastG=null;const lim=opt.limit||999;
    for(const it of items.slice(0,lim)){
      if(opt.grouped&&it.group!==lastG){html+=`<div class="dd-grp">${esc(it.group)}</div>`;lastG=it.group;}
      const ck=all||F[key].includes(it.id);
      html+=`<div class="dd-item${it.v?'':' off'}"><label><input type="checkbox" data-id="${it.id}" ${ck?'checked':''}><span title="${esc(it.name)}">${esc(it.name)}</span></label><span class="v">${it.v?brlC(it.v):'—'}</span><button class="only" type="button" data-only="${it.id}">só</button></div>`;
    }
    if(items.length>lim)html+=`<div class="dd-grp" style="color:var(--muted)">+${items.length-lim}, refine a busca</div>`;
    list.innerHTML=html||'<div class="dd-grp" style="color:var(--muted)">Nada encontrado</div>';
    cnt.textContent=all?'todos':F[key].length+' selecionado'+(F[key].length>1?'s':'');
    list.querySelectorAll('input').forEach(inp=>inp.addEventListener('change',()=>{const id=+inp.dataset.id;const ids=opt.items().map(x=>x.id);
      let cur=F[key].length?F[key].slice():ids.slice();
      cur=inp.checked?[...new Set([...cur,id])]:cur.filter(x=>x!==id);
      F[key]=(cur.length===ids.length||!cur.length)?[]:cur;changed();fill();}));
    list.querySelectorAll('[data-only]').forEach(b=>b.addEventListener('click',()=>{F[key]=[+b.dataset.only];changed();fill();}));
  }
  function label(){const s=F[key];btn.classList.toggle('on',!!s.length);btn.textContent=!s.length?opt.all:s.length===1?opt.items().find(x=>x.id===s[0])?.name:s.length+' selecionados';}
  const api={open,label,fill};DDS[key]=api;return api;
}
document.addEventListener('click',()=>Object.values(DDS).forEach(d=>d.open(false)));
const TIPO_ORD=['Lançamento','Estoque','Institucional'];
makeDD('cc',{label:'centro de custo',all:'Todos os centros de custo',grouped:true,items:()=>D.ccs.map((n,i)=>({id:i,name:n,group:D.ccTipo[i]})).sort((a,b)=>TIPO_ORD.indexOf(a.group)-TIPO_ORD.indexOf(b.group)||a.name.localeCompare(b.name,'pt'))});
makeDD('cl',{label:'classificação',all:'Todas as classificações',sortByValue:true,items:()=>D.cls.map((n,i)=>({id:i,name:n}))});
makeDD('fo',{label:'fornecedor',all:'Todos os fornecedores',sortByValue:true,limit:120,items:()=>D.forn.map((n,i)=>({id:i,name:n,alt:IMOB.get(i)||''}))});

function filterList(){
  const sec=curSec();if(!sec||sec.dataset.f!=='full')return [];
  const out=[],pv=PV();
  if(pv)out.push(pv.txt);
  if(!(pv&&pv.vb)&&F.vb.length<VB.length)out.push(['Verba',F.vb.length<=4?F.vb.map(i=>VB[i]).join(', '):F.vb.length+' verbas']);
  const nm=(arr,f,w)=>arr.length<=4?arr.map(f).join(', '):`${arr.length} ${w}`;
  if(F.cc.length)out.push(['Centro de custo',nm(F.cc,i=>D.ccs[i],'centros de custo')]);
  if(F.cl.length)out.push(['Classificação',nm(F.cl,i=>D.cls[i],'classificações')]);
  if(F.fo.length)out.push(['Fornecedor',nm(F.fo,fname,'fornecedores')]);
  if(ST.page==='lancamentos'&&LC.q)out.push(['Busca','“'+LC.q+'”']);
  return out;
}
function recorteTxt(){const sec=curSec();if(!sec||sec.dataset.f==='none')return 'Dados fixos da aba, sem filtros';const fl=filterList();return perTxt()+(fl.length?' · '+fl.map(([k,v])=>`${k}: ${v}`).join(' · '):(sec.dataset.f==='period'?'':' · sem outros filtros'));}

function syncFilters(){
  m0.value=F.m0;m1.value=F.m1;
  $$('#gf [data-p]').forEach(b=>{const [a,c]=b.dataset.p.split('-').map(Number);b.setAttribute('aria-pressed',a===F.m0&&c===F.m1);});
  $$('#f-vb .chip').forEach(b=>b.setAttribute('aria-pressed',F.vb.includes(+b.dataset.i)));
  Object.values(DDS).forEach(d=>d.label());
  const sec=curSec(),mode=sec?.dataset.f;
  const rs=mode==='full'?rows(pageWhere()):null;
  const tags=[];
  if(F.m0!==1||F.m1!==12)tags.push(['per',perTxt()]);
  if(mode==='full'){
    if(!(PV()&&PV().vb)&&F.vb.length<VB.length)tags.push(['vb',F.vb.length<=3?F.vb.map(i=>VB[i]).join(' + '):F.vb.length+' verbas']);
    const nm=(arr,f,w)=>arr.length<=2?arr.map(f).join(', '):arr.length+' '+w;
    if(F.cc.length)tags.push(['cc',nm(F.cc,i=>D.ccs[i],'centros de custo')]);
    if(F.cl.length)tags.push(['cl',nm(F.cl,i=>D.cls[i],'classificações')]);
    if(F.fo.length)tags.push(['fo',nm(F.fo,fname,'fornecedores')]);
  }
  const head=rs?`<span><b>${N0.format(rs.length)}</b> lançamentos · <b>${brl(tot(rs))}</b></span>`:`<span>Esta tela usa só o filtro de período</span>`;
  $('#recorte').innerHTML=head+tags.map(([k,t])=>`<span class="tag">${esc(t)}<button type="button" data-clr="${k}" aria-label="Remover filtro ${esc(t)}">×</button></span>`).join('');
  $$('#recorte [data-clr]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.clr,d=FDEF();if(k==='per'){F.m0=1;F.m1=12;}else F[k]=d[k];changed();}));
}
function changed(){save();syncFilters();render();}
function toggleOnly(key,id){F[key]=(F[key].length===1&&F[key][0]===id)?[]:[id];changed();}

/* ---------- downloads (CSV, PNG, PDF) ---------- */
let DL=null;
(async()=>{try{if(window.claude&&window.claude.use)DL=await window.claude.use('downloads');}catch(e){DL=null;}$('#csvBtn').hidden=!DL;$('#rp-pdf').hidden=!DL;})();
function csvOf(rs){
  const q=s=>{s=String(s??'');return /[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
  const h=['Mês','Verba','Classificação','Fornecedor','Descritivo','Centro de custo (faturamento)','Centro de custo (destino)','Nº Sienge','Valor (R$)','Linha na planilha'];
  return '﻿'+[h.join(';')].concat(rs.map(r=>[MES[r.m-1]+'/26',VB[r.vb],D.cls[r.cl],D.forn[r.fo],r.ds,D.ccs[r.cc],r.ccd>=0?D.ccs[r.ccd]:'',r.si,N2.format(r.v).replace(/\./g,''),r.row].map(q).join(';'))).join('\r\n');
}
async function saveCsv(rs,name){
  if(!DL)return;if(!rs.length){toast('Nenhum lançamento para exportar.');return;}
  try{await DL.save({filename:name+'.csv',data:csvOf(rs)});toast(`${N0.format(rs.length)} lançamentos exportados.`);}
  catch(e){if(e&&e.code==='declined')return;toast(e&&e.code==='rate_limited'?'Já existe uma exportação aguardando confirmação.':'Não foi possível exportar agora.');}
}
$('#csvBtn').addEventListener('click',()=>{let rs=rows(pageWhere());if(ST.page==='lancamentos'&&LC.q)rs=rs.filter(r=>lcText(r).includes(LC.q));saveCsv(rs,`DUE_lancamentos_${slug(curSec().dataset.title)}_${MES[F.m0-1]}-${MES[F.m1-1]}_2026`);});

/* ---------- tabela de lançamentos (compartilhada) ---------- */
const lcText=r=>(r.ds+' '+D.forn[r.fo]+' '+(IMOB.get(r.fo)||'')+' '+r.si+' '+VB[r.vb]+' '+D.cls[r.cl]).toLowerCase();
const lcHead=`<thead><tr><th class="l" data-k="m">Mês</th><th class="l">Verba</th><th class="l">Classificação</th><th class="l" data-k="fo" data-t="s">Fornecedor</th><th class="l">Descritivo</th><th class="l">Centro de custo</th><th data-k="v">Valor</th><th data-k="row">Sienge · linha</th></tr></thead>`;
const lcRow=r=>`<tr><td class="l">${MES[r.m-1]}/26${r.dia?`<span class="sub2">data ${String(r.dia).padStart(2,'0')}/${String(r.m).padStart(2,'0')}</span>`:''}</td><td class="l"><span style="display:inline-flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:2px;background:${VBC[r.vb]};display:inline-block"></i>${VB[r.vb]}</span></td><td class="l" style="white-space:normal;min-width:130px;max-width:170px">${esc(D.cls[r.cl])}</td><td class="l" style="white-space:normal;min-width:150px;max-width:200px">${esc(fname(r.fo))}${IMOB.get(r.fo)?`<span class="sub2">${esc(D.forn[r.fo])}</span>`:''}</td><td class="wrap l" style="font-size:12.5px;color:var(--ink-2);min-width:220px;max-width:300px">${esc(r.ds)||'<span class="dim">—</span>'}</td><td class="l">${esc(D.ccs[r.cc])}${r.ccd>=0&&r.ccd!==r.cc?`<span class="sub2">destino: ${esc(D.ccs[r.ccd])}</span>`:''}</td><td><b style="font-weight:600">${brl(r.v)}</b></td><td class="dim">${esc(r.si)||'—'}<span class="sub2">linha ${r.row}</span></td></tr>`;
const lcKey={m:r=>r.m*1e5+r.row,v:r=>r.v,fo:r=>D.forn[r.fo].toLowerCase(),row:r=>r.row};
function lcSort(rs,st){const k=lcKey[st.k]||lcKey.m;return rs.slice().sort((a,b)=>{const x=k(a),y=k(b);return (x<y?-1:x>y?1:0)*st.d;});}

/* ================= QUADRANTE DE DESPESAS ================= */
const DR={open:false};
function openDrill(o){
  if(DR.open&&DR.page===ST.page&&DR.key===o.key&&String(DR.id)===String(o.id)){closeDrill();return;}
  Object.keys(DR).forEach(k=>delete DR[k]);
  Object.assign(DR,{open:true,page:ST.page,q:'',p:0,k:'v',d:-1},o);
  renderDrill(true);
}
function closeDrill(){DR.open=false;const el=$('#drill');if(el)el.remove();$$('tr.clk.rsel').forEach(t=>t.classList.remove('rsel'));delete OBS.drill;}
function drillBase(){return DR.base==='all'?L:DR.base==='period'?L.filter(r=>r.m>=F.m0&&r.m<=F.m1):rows(pageWhere());}
function renderDrill(scroll){
  if(!DR.open||DR.page!==ST.page){const el=$('#drill');if(el)el.remove();return;}
  const anchor=document.getElementById(DR.anchor);if(!anchor){closeDrill();return;}
  anchor.querySelectorAll('tr.clk').forEach(tr=>tr.classList.toggle('rsel',tr.dataset.id===String(DR.id)));
  let el=$('#drill');if(!el){el=document.createElement('section');el.id='drill';el.className='panel drill';el.setAttribute('aria-live','polite');}
  const host=anchor.parentElement.classList.contains('grid')?anchor.parentElement:anchor;
  if(host.nextElementSibling!==el)host.after(el);
  const all=drillBase().filter(DR.where);const T=tot(all);const nfo=new Set(all.map(r=>r.fo)).size,tfo=group(all,'fo')[0];
  const nm=new Set(all.map(r=>r.m)).size;const mx=all.reduce((a,r)=>!a||r.v>a.v?r:a,null);
  const by=DR.key==='cl'||DR.key==='sicl'?'fo':'cl';
  el.innerHTML=`<div class="ph"><div><span class="dr-eye">Despesas cadastradas · ${esc(DR.eye)}</span><h2>${esc(DR.label)}<span class="dot">.</span></h2><p>${nLc(all.length)} · ${brl(T)} · ${esc(DR.scope||recorteTxt())}</p></div>
    <div class="ph-tools">${DR.apply?'<button class="btn-out" type="button" data-a="apply">Filtrar o painel por isto</button>':''}${DL&&all.length?'<button class="btn-out" type="button" data-a="csv">Exportar CSV</button>':''}<button class="ph-act" type="button" data-a="copy">${CAM}Copiar imagem</button><button class="dr-x" type="button" data-a="close" aria-label="Fechar quadrante">×</button></div></div>
    ${DR.note?`<p class="cnote">${DR.note}</p>`:''}
    ${all.length?`<div class="dk"><div><span>Total</span><b>${brlC(T)}</b><small>${brl(T)}</small></div><div><span>Lançamentos</span><b>${N0.format(all.length)}</b><small>${nm} ${nm>1?'meses':'mês'} com despesa</small></div><div><span>Ticket médio</span><b>${brlC(T/all.length)}</b><small>maior: ${brlC(mx.v)} (${MES[mx.m-1]})</small></div><div><span>Fornecedores</span><b>${N0.format(nfo)}</b><small>maior: ${esc(fname(tfo[0]))}</small></div></div>
    <div class="dr-grid">${DR.key==='m'?'<div><h3 class="dr-h">Por verba</h3><div class="bars" id="dr-vb"></div></div>':'<div><h3 class="dr-h">Por mês</h3><div class="legend" id="dr-leg"></div><div class="chart" id="dr-ch" style="min-height:150px"></div></div>'}<div><h3 class="dr-h">${by==='fo'?'Principais fornecedores':'Principais classificações'}</h3><div class="bars" id="dr-by"></div></div></div>
    <div class="dr-tools"><h3 class="dr-h" style="margin:0" id="dr-cnt"></h3><input class="srch" id="dr-q" type="search" placeholder="Buscar nestas despesas" aria-label="Buscar nas despesas" value="${esc(DR.q)}"></div>
    <div class="scroll"><table class="det" id="dr-tb"></table></div><div class="pager" id="dr-pg"></div>`:'<p class="empty">Nenhuma despesa cadastrada para esta opção no recorte atual.</p>'}`;
  el.querySelector('[data-a="close"]').addEventListener('click',closeDrill);
  el.querySelector('[data-a="copy"]').addEventListener('click',()=>shareImage(()=>withStage(()=>shareCard($('#drill'))),'DUE_despesas_'+slug(DR.label)));
  const ap=el.querySelector('[data-a="apply"]');if(ap)ap.addEventListener('click',()=>{const f=DR.apply;closeDrill();f();});
  const cv=el.querySelector('[data-a="csv"]');if(cv)cv.addEventListener('click',()=>saveCsv(lcSort(all,{k:'m',d:1}),'DUE_despesas_'+slug(DR.label)));
  if(all.length&&DR.key==='m'){
    hbars($('#dr-vb'),group(all,'vb').map(([i,v])=>({label:VB[i],total:v,c:VBC[i],val:`${brlC(v)}<small>${pct(v/T,0)}</small>`})));
  }
  if(all.length&&DR.key!=='m'){
    const ms=DR.base==='all'?[1,2,3,4,5,6,7,8,9,10,11,12]:MS();const vbs=ALLV.filter(i=>all.some(r=>r.vb===i));
    const ser=vbs.map(i=>({name:VB[i],color:VBC[i],vals:ms.map(m=>tot(all.filter(r=>r.m===m&&r.vb===i)))}));
    $('#dr-leg').innerHTML=vbs.length>1?ser.map(se=>`<span><i style="--c:${se.color}"></i>${se.name}</span>`).join(''):'';
    barChart($('#dr-ch'),{cats:ms.map(m=>({label:MES[m-1],dim:m>CUR})),series:ser,h:170,aria:'Despesas por mês',tip:i=>{const m=ms[i];let t=`<div class="tt">${MESL[m-1]}</div>`,s=0;ser.forEach(se=>{const v=se.vals[i];s+=v;if(v)t+=trow(se.color,se.name,brl(v));});return t+`<div class="tr tf"><span>Total</span><b>${brl(s)}</b></div>`;}});
  }
  if(all.length){
    const g=group(all,by);
    hbars($('#dr-by'),g.slice(0,6).map(([id,v])=>({label:by==='fo'?fname(id):D.cls[id],total:v,c:'var(--gold)',val:`${brlC(v)}<small>${pct(v/T,0)}</small>`})));
    $('#dr-q').addEventListener('input',e=>{DR.q=e.target.value.trim().toLowerCase();DR.p=0;drillTable(all);});
    drillTable(all);
    const t1=g[0],nm1=t1?(by==='fo'?fname(t1[0]):D.cls[t1[0]]):'';
    obs('drill',[`${nLc(all.length)} ${all.length===1?'soma':'somam'} <b>${brl(T)}</b>, ticket médio de ${brlC(T/all.length)}.`,t1&&g.length>1?`<b>${esc(nm1)}</b> concentra ${pct(t1[1]/T,0)} do valor.`:'',`Maior lançamento: ${brl(mx.v)} em ${MESL[mx.m-1]} (${esc(fname(mx.fo))}${mx.ds?': '+esc(mx.ds.slice(0,90))+(mx.ds.length>90?'…':''):''}).`]);
  }else obs('drill',['Nenhuma despesa cadastrada para esta opção no recorte atual.']);
  if(scroll)setTimeout(()=>el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}),30);
}
function drillTable(all){
  let rs=DR.q?all.filter(r=>lcText(r).includes(DR.q)):all;rs=lcSort(rs,DR);
  const size=12,pages=Math.max(1,Math.ceil(rs.length/size));if(DR.p>=pages)DR.p=pages-1;
  $('#dr-cnt').textContent=`Lançamentos (${N0.format(rs.length)})`;
  $('#dr-tb').innerHTML=lcHead+'<tbody>'+(rs.slice(DR.p*size,DR.p*size+size).map(lcRow).join('')||'<tr><td class="l dim" colspan="8">Nenhum lançamento encontrado.</td></tr>')+`</tbody><tfoot><tr><td class="l" colspan="6">Total${DR.q?' da busca':''}</td><td>${brl(tot(rs))}</td><td></td></tr></tfoot>`;
  sortable($('#dr-tb'),DR,()=>{DR.p=0;drillTable(all);});
  pager($('#dr-pg'),DR.p,rs.length,size,p=>{DR.p=p;drillTable(all);});
}

/* ================= TELAS ================= */
const R={};

R.visao=()=>{
  const rs=rows(),T=tot(rs),ms=MS(),n=rs.length;
  const vms=ms.filter(VGV_OK),vgv=vms.reduce((s,m)=>s+D.vgv26[m-1],0);
  const dOv=tot(rs.filter(r=>VGV_OK(r.m)));const noVgv=F.cc.length||F.fo.length;
  const gvb=group(rs,'vb'),real=tot(rs.filter(r=>r.m<=REAL)),cur=tot(rs.filter(r=>r.m===CUR)),prov=tot(rs.filter(r=>r.m>CUR));
  kpis($('#v-kpis'),[
    {lead:1,k:'Despesa no recorte',v:brlC(T),s:`<b>${N0.format(n)}</b> lançamentos · média <b>${brlC(T/ms.length)}</b>/mês`},
    {k:'VGV do período',v:vms.length?brlC(vgv):'—',dash:!vms.length,s:vms.length?`aba 1 · ${rangeTxt(vms)}`:'sem VGV lançado no período'},
    {k:'Despesa ÷ VGV',v:(!noVgv&&vgv&&dOv)?pct(dOv/vgv,2):'—',dash:!!(noVgv||!vgv||!dOv),s:noVgv?'VGV não é aberto por centro de custo ou fornecedor':(vgv&&dOv)?`R$ 1 de despesa para <b>R$ ${N0.format(vgv/dOv)}</b> de VGV · ${rangeTxt(vms)}`:'sem VGV no período'},
    {k:'Maior verba',v:gvb.length?pct(gvb[0][1]/T,0):'—',dash:!gvb.length,s:gvb.length?`<b>${esc(VB[gvb[0][0]])}</b> · ${brlC(gvb[0][1])}`:'',share:gvb.length?gvb[0][1]/T:0,c:gvb.length?VBC[gvb[0][0]]:''},
    {k:`Realizado (${REAL_T||'—'})`,v:brlC(real),s:[CUR_T?`em curso (${CUR_T}) <b>${brlC(cur)}</b>`:'',PROV_T?`provisão <b>${brlC(prov)}</b>`:''].filter(Boolean).join(' · ')},
  ]);
  obs('v-kpis',[n?`O recorte soma <b>${brl(T)}</b> em ${N0.format(n)} lançamentos (média de ${brlC(T/ms.length)} por mês).`:'Sem lançamentos no recorte.',(!noVgv&&vgv&&dOv)?`Nos meses com VGV lançado (${rangeTxt(vms)}), a despesa equivale a <b>${pct(dOv/vgv,2)}</b> do VGV: cada R$ 1 investido acompanhou R$ ${N0.format(vgv/dOv)} em vendas.`:'',gvb.length>1?`${esc(VB[gvb[0][0]])} e ${esc(VB[gvb[1][0]])} somam ${pct((gvb[0][1]+gvb[1][1])/T,0)} do recorte.`:'',prov?`${cap(PROV_T)} já ${plv(PROV_T,'tem','têm')} ${brlC(prov)} provisionados.`:'']);
  const b=[];
  if(n){
    const gv=group(rs,'vb');if(gv.length>1)b.push(`<b>${VB[gv[0][0]]}</b> é a maior verba: ${brlC(gv[0][1])}, ${pct(gv[0][1]/T,0)} do recorte.`);
    const gc=group(rs,'cl');b.push(`Maior classificação: <b>${esc(D.cls[gc[0][0]])}</b>, ${brlC(gc[0][1])} (${pct(gc[0][1]/T,0)}).`);
    const gm=monthly(rs);let pk=ms[0];ms.forEach(m=>{if(gm[m-1]>gm[pk-1])pk=m;});if(ms.length>1)b.push(`Mês de maior despesa: <b>${MESL[pk-1]}</b>, ${brlC(gm[pk-1])}${pk>REAL?' (inclui valores provisionados)':''}.`);
    const gf=group(rs,'fo');if(gf.length>3){const t3=gf.slice(0,3);b.push(`Os 3 maiores fornecedores somam <b>${pct(t3.reduce((s,x)=>s+x[1],0)/T,0)}</b>: ${t3.map(x=>esc(fname(x[0]))).join(', ')}.`);}
    if(prov>0)b.push(`${cap(PROV_T)} já ${plv(PROV_T,'carrega','carregam')} <b>${brlC(prov)}</b> provisionados, sem VGV previsto na planilha.`);
    const md=tot(rows({skip:'vb',where:r=>DIG_VB.includes(r.vb)}));if(md&&b.length<6)b.push(`Marketing e mídia digital somam <b>${brlC(md)}</b> (verbas ${DIG_VB.map(i=>esc(VB[i])).join(' e ')}; veja o quadro abaixo).`);
  }else b.push('Nenhum lançamento no recorte. Ajuste ou limpe os filtros.');
  $('#v-read').innerHTML=b.slice(0,6).map(x=>`<li>${x}</li>`).join('');

  const mode=$('#v-evo-seg [aria-pressed="true"]').dataset.d;
  const cats=ms.map(m=>({label:MES[m-1],sub:stat(m),dim:m>CUR}));
  let series,line=null;
  if(mode==='vgv'){series=[{name:'Despesa',color:'var(--s1)',vals:ms.map(m=>tot(rs.filter(r=>r.m===m)))}];line={name:'VGV',color:'var(--gold)',vals:ms.map(m=>VGV_OK(m)?D.vgv26[m-1]:null)};}
  else{const vbs=ALLV.filter(i=>rs.some(r=>r.vb===i));series=vbs.map(i=>({name:VB[i],color:VBC[i],vals:ms.map(m=>tot(rs.filter(r=>r.m===m&&r.vb===i)))}));}
  $('#v-evo-leg').innerHTML=series.map(se=>`<span><i style="--c:${se.color}"></i>${se.name}</span>`).join('')+(line?`<span><i class="ln" style="--c:${line.color}"></i>VGV (eixo direito)</span>`:'');
  $('#v-evo-sub').textContent=mode==='vgv'?'Despesa do recorte (eixo esquerdo) e VGV da aba 1 (eixo direito)'+(ms.some(m=>!VGV_OK(m))?' · '+rangeTxt(ms.filter(m=>!VGV_OK(m)))+' sem VGV lançado':''):'Despesa por mês e verba';
  barChart($('#v-evo'),{cats,series,line,h:270,aria:'Despesa mensal',tip:i=>{const m=ms[i];let t=`<div class="tt">${MESL[m-1]}${stat(m)?' · '+stat(m):''}</div>`;let s=0;series.forEach(se=>{const v=se.vals[i]||0;s+=v;if(v)t+=trow(se.color,se.name,brl(v));});if(series.length>1)t+=`<div class="tr tf"><span>Total</span><b>${brl(s)}</b></div>`;if(line){const lv=line.vals[i];t+=trow(line.color,'VGV',lv==null?'não lançado':brl(lv));if(lv)t+=`<div class="tn">Despesa ÷ VGV: ${pct(s/lv,2)}</div>`;}return t;}});
  { const gm=monthly(rs),rm=ms.filter(m=>m<=REAL&&gm[m-1]>0);
    const hi=rm.length?rm.reduce((a,m)=>gm[m-1]>gm[a-1]?m:a):null,lo=rm.length?rm.reduce((a,m)=>gm[m-1]<gm[a-1]?m:a):null;
    const avg=rm.length?rm.reduce((s,m)=>s+gm[m-1],0)/rm.length:0;
    const s1=rm.filter(m=>m<=6),s2=rm.filter(m=>m>=7);const a1=s1.length?s1.reduce((s,m)=>s+gm[m-1],0)/s1.length:0,a2=s2.length?s2.reduce((s,m)=>s+gm[m-1],0)/s2.length:0;
    const rat=vms.filter(m=>gm[m-1]>0).map(m=>[m,gm[m-1]/D.vgv26[m-1]]);const rb=rat.length?rat.reduce((a,x)=>x[1]<a[1]?x:a):null,rw=rat.length?rat.reduce((a,x)=>x[1]>a[1]?x:a):null;
    obs('p-v-evo',[hi&&lo&&hi!==lo?`Pico de despesa em <b>${MESL[hi-1]}</b> (${brlC(gm[hi-1])}) e menor mês realizado em ${MESL[lo-1]} (${brlC(gm[lo-1])}).`:'',avg?`Média realizada de <b>${brlC(avg)}</b> por mês (${rangeTxt(rm)}).`:'',a1&&a2?`A média do 2º semestre realizado (${brlC(a2)}/mês) está ${a2>=a1?'+':''}${pct(a2/a1-1,0)} em relação ao 1º semestre (${brlC(a1)}/mês).`:'',cur&&avg&&CUR_T?`${MESL[CUR-1]}, ainda em curso, soma ${brlC(cur)} (${pct(cur/avg,0)} da média realizada).`:'',prov?`${cap(PROV_T)}: ${brlC(prov)} provisionados.`:'',mode==='vgv'&&rb&&rw&&rb[0]!==rw[0]?`Melhor relação despesa/VGV em ${MESL[rb[0]-1]} (${pct(rb[1],2)}) e pior em ${MESL[rw[0]-1]} (${pct(rw[1],2)}).`:'']);
  }

  const gv=new Map(group(rows({skip:'vb'}),'vb'));const Tall=[...gv.values()].reduce((a,b)=>a+b,0);
  const rsAll=rows({skip:'vb'});
  let ch=`<div class="stack100" style="margin-bottom:10px">${ALLV.map(i=>F.vb.includes(i)&&gv.get(i)?`<i style="width:${(gv.get(i)/Tall*100).toFixed(2)}%;--c:${VBC[i]}"></i>`:'').join('')}</div><table class="cross"><thead><tr><th>Verba</th><th>Valor</th><th>Lançamentos</th></tr></thead><tbody>`;
  ALLV.forEach(i=>{const v=gv.get(i)||0;const on=F.vb.includes(i);const nl=rsAll.filter(r=>r.vb===i).length;ch+=`<tr class="pick" data-i="${i}" style="${on?'':'opacity:.45'}"><td><span class="fname"><i style="--c:${VBC[i]}"></i>${esc(VB[i])}</span></td><td>${brlC(v)}<span class="pct">${pct(Tall?v/Tall:0,1)}</span></td><td>${N0.format(nl)}<span class="pct">ticket ${nl?brlC(v/nl):'—'}</span></td></tr>`;});
  ch+=`</tbody><tfoot><tr><td>Total</td><td>${brlC(T)}</td><td>${N0.format(rs.length)}</td></tr></tfoot></table><p class="cnote" style="margin-top:8px">Total considera só as verbas selecionadas.</p>`;
  $('#v-cross').innerHTML=ch;
  $$('#v-cross tr.pick').forEach(tr=>tr.addEventListener('click',()=>{const i=+tr.dataset.i;F.vb=(F.vb.length===1&&F.vb[0]===i)?ALLV.slice():[i];changed();}));
  { const sel=ALLV.filter(i=>F.vb.includes(i)&&gv.get(i));const srt=sel.slice().sort((a,b)=>gv.get(b)-gv.get(a));
    const tks=sel.map(i=>{const n=rsAll.filter(r=>r.vb===i).length;return [i,n?gv.get(i)/n:0];}).sort((a,b)=>b[1]-a[1]);
    obs('p-v-cross',[srt.length>1?`<b>${VB[srt[0]]}</b> (${pct(gv.get(srt[0])/T,0)}) e <b>${VB[srt[1]]}</b> (${pct(gv.get(srt[1])/T,0)}) concentram ${pct((gv.get(srt[0])+gv.get(srt[1]))/T,0)} do recorte.`:'',tks.length>1?`Maior ticket médio: ${esc(VB[tks[0][0]])} (${brlC(tks[0][1])} por lançamento).`:'']); }

  const gc=group(rs,'cl');
  hbars($('#v-cls'),gc.slice(0,8).map(([id,v])=>({label:D.cls[id],total:v,c:'var(--s1)',val:`${brlC(v)}<small>${pct(v/T,0)}</small>`,on:F.cl.includes(id),act:()=>toggleOnly('cl',id)})));
  if(gc.length){const t3=gc.slice(0,3);obs('p-v-cls',[`As 3 maiores classificações somam <b>${pct(t3.reduce((s,x)=>s+x[1],0)/T,0)}</b>: ${t3.map(x=>esc(D.cls[x[0]])).join(', ')}.`,gc.length>8?`As ${gc.length-8} classificações fora do top 8 somam ${brlC(gc.slice(8).reduce((s,x)=>s+x[1],0))}.`:'']);}else obs('p-v-cls',[]);
  const gcc=group(rs,'cc');
  hbars($('#v-cc'),gcc.slice(0,8).map(([id,v])=>({label:D.ccs[id],sub:D.ccTipo[id],total:v,c:D.ccTipo[id]==='Lançamento'?'var(--gold)':D.ccTipo[id]==='Institucional'?'var(--s4)':'var(--s1)',val:`${brlC(v)}<small>${pct(v/T,0)}</small>`,on:F.cc.includes(id),act:()=>toggleOnly('cc',id)})));
  { const byT=t=>tot(rs.filter(r=>D.ccTipo[r.cc]===t));obs('p-v-cc',[gcc.length?`<b>${D.ccs[gcc[0][0]]}</b> é o centro de custo com maior despesa (${pct(gcc[0][1]/T,0)}).`:'',T?`Por tipo: Lançamentos ${pct(byT('Lançamento')/T,0)}, Estoque ${pct(byT('Estoque')/T,0)}, Institucional ${pct(byT('Institucional')/T,0)}.`:'','O CC é o de faturamento da nota; contratos institucionais também caem em CCs de empreendimento.']); }

  const md=rows({skip:'vb',where:r=>DIG_VB.includes(r.vb)}),MDT=tot(md);
  const vbs=DIG_VB.filter(i=>md.some(r=>r.vb===i));
  const mser=vbs.map(i=>({name:VB[i],color:VBC[i],vals:ms.map(m=>tot(md.filter(r=>r.m===m&&r.vb===i)))}));
  $('#v-md-leg').innerHTML=mser.map(se=>`<span><i style="--c:${se.color}"></i>${se.name}</span>`).join('');
  if(md.length)barChart($('#v-md'),{cats:ms.map(m=>({label:MES[m-1],dim:m>CUR})),series:mser,h:210,aria:'Marketing digital por mês',tip:i=>{const m=ms[i];let t=`<div class="tt">${MESL[m-1]}</div>`,s=0;mser.forEach(se=>{const v=se.vals[i];s+=v;if(v)t+=trow(se.color,se.name,brl(v));});return t+`<div class="tr tf"><span>Total</span><b>${brl(s)}</b></div>`;}});
  else $('#v-md').innerHTML='<p class="empty">Sem marketing ou mídia digital no recorte.</p>';
  const tf=group(md,'fo').slice(0,3);
  const mcl=group(md,'cl');
  $('#v-md-cross').innerHTML=md.length?`<table class="cross"><thead><tr><th>Classificação</th><th>Valor</th></tr></thead><tbody>${mcl.map(([i,v])=>`<tr><td>${esc(D.cls[i])}</td><td>${brlC(v)}<span class="pct">${pct(v/MDT,0)}</span></td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td>${brlC(MDT)}</td></tr></tfoot></table><p class="cnote" style="margin-top:10px">Maiores fornecedores: ${tf.map(([f,v])=>`<b>${esc(fname(f))}</b> ${brlC(v)}`).join(' · ')}.</p>`:'';
  { const allc=tot(rows({skip:'vb'}));
    obs('p-v-md',[MDT?`Marketing e mídia digital: <b>${brl(MDT)}</b>${vbs.length>1?` (${vbs.map(i=>`${esc(VB[i])} ${brlC(tot(md.filter(r=>r.vb===i)))}`).join(' · ')})`:''}.`:'Sem marketing ou mídia digital no recorte.',mcl.length>1?`Por classificação: ${mcl.slice(0,3).map(([i,v])=>`${esc(D.cls[i])} ${pct(v/MDT,0)}`).join(', ')}.`:'',MDT&&allc?`Representa ${pct(MDT/allc,0)} da despesa do recorte.`:'']); }
};

R.vgv=()=>{
  const ms=MS(),vms=ms.filter(VGV_OK);
  const v26=vms.reduce((s,m)=>s+D.vgv26[m-1],0),v25=vms.reduce((s,m)=>s+D.vgv25[m-1],0);
  const full25=D.vgv25.reduce((a,b)=>a+b,0),YM=[1,2,3,4,5,6,7,8,9,10,11,12].filter(VGV_OK),ytd26=YM.reduce((s,m)=>s+D.vgv26[m-1],0);
  const var_=v25?v26/v25-1:NaN;const dm=monthly(L);
  const dOk=vms.reduce((s,m)=>s+dm[m-1],0),dAll=ms.reduce((s,m)=>s+dm[m-1],0);
  kpis($('#g-kpis'),[
    {lead:1,k:'VGV 2026 no período',v:vms.length?brlC(v26):'—',dash:!vms.length,s:vms.length?rangeTxt(vms)+' · aba 1':'sem VGV lançado no período'},
    {k:'VGV 2025 mesmos meses',v:vms.length?brlC(v25):'—',dash:!vms.length,s:'aba 2'},
    {k:'Variação',v:vms.length?(var_>=0?'+':'')+pct(var_,1):'—',dash:!vms.length,s:vms.length?`<span class="${var_>=0?'up':'down'}">${var_>=0?'+':''}${brlC(v26-v25)}</span> no mesmo período`:''},
    {k:'Despesa 2026 no período',v:brlC(dAll),s:vms.length&&dOk?`${pct(dOk/v26,2)} do VGV nos meses com VGV`:'base do Financeiro'},
    {k:`2026 até ${YM.length?MES[YM[YM.length-1]-1].toLowerCase():'—'} × 2025 inteiro`,v:(ytd26>=full25?'+':'')+pct(ytd26/full25-1,1),s:`${brlC(ytd26)} em ${YM.length} ${YM.length===1?'mês':'meses'} × ${brlC(full25)} em 12`},
  ]);
  obs('g-kpis',[vms.length?`VGV 2026 de <b>${brl(v26)}</b> contra ${brl(v25)} em 2025 nos mesmos meses (${var_>=0?'+':''}${pct(var_,1)}).`:'Sem VGV de 2026 lançado no período.',dOk&&v26?`A despesa de marketing desses meses (${brlC(dOk)}) equivale a ${pct(dOk/v26,2)} do VGV.`:'',YM.length?`Até ${MESL[YM[YM.length-1]-1].toLowerCase()}, 2026 ${ytd26>=full25?'já superou':'soma'} ${ytd26>=full25?`o ano inteiro de 2025 em ${pct(ytd26/full25-1,1)}`:`${pct(ytd26/full25,0)} do ano inteiro de 2025`}.`:'']);
  const dfi=ms.findIndex(m=>m>REAL);
  const lines=[{name:'Despesa 2026',color:'var(--gold)',vals:ms.map(m=>dm[m-1]),dashFrom:dfi<0?null:dfi}];
  if(DESP25)lines.push({name:'Despesa 2025',color:'var(--s3)',vals:ms.map(m=>DESP25[m-1])});
  $('#g-leg').innerHTML=`<span><i style="--c:var(--s4)"></i>VGV 2025</span><span><i style="--c:var(--s1)"></i>VGV 2026</span><span><i class="ln" style="--c:var(--gold)"></i>Despesa 2026</span>`+(DESP25?`<span><i class="ln" style="--c:var(--s3)"></i>Despesa 2025</span>`:`<span style="color:var(--muted)"><i class="ln" style="--c:var(--line-2)"></i>Despesa 2025: não consta na planilha</span>`);
  barChart($('#g-chart'),{mode:'group',cats:ms.map(m=>({label:MES[m-1],sub:VGV_OK(m)?'':D.vgv26[m-1]?'não lançado':'sem VGV'})),series:[{name:'2025',color:'var(--s4)',vals:ms.map(m=>D.vgv25[m-1])},{name:'2026',color:'var(--s1)',vals:ms.map(m=>VGV_OK(m)?D.vgv26[m-1]:null)}],lines,h:290,aria:'VGV e despesa mensal',
    tip:i=>{const m=ms[i],a=D.vgv25[m-1],c=VGV_OK(m)?D.vgv26[m-1]:null,d=dm[m-1];return `<div class="tt">${MESL[m-1]}${stat(m)?' · '+stat(m):''}</div>${trow('var(--s4)','VGV 2025',brl(a))}${trow('var(--s1)','VGV 2026',c==null?'não lançado':brl(c))}${trow('var(--gold)','Despesa 2026',brl(d))}${DESP25?trow('var(--s3)','Despesa 2025',brl(DESP25[m-1])):''}${c!=null?`<div class="tn">VGV ${(c/a-1>=0?'+':'')+pct(c/a-1,1)} sobre 2025 · despesa ÷ VGV ${pct(d/c,2)}</div>`:''}`;}});
  { const am=vms.filter(m=>m===4||m===5),amv=am.reduce((s,m)=>s+D.vgv26[m-1],0);const down=vms.filter(m=>D.vgv26[m-1]<D.vgv25[m-1]);
    const dr=ms.filter(m=>m<=REAL).map(m=>dm[m-1]).filter(v=>v>0),vr=vms.map(m=>D.vgv26[m-1]);
    obs('p-g-chart',[amv&&v26?`Abril e maio concentram <b>${pct(amv/v26,0)}</b> do VGV 2026 do período, puxados pelos lançamentos de Solina e Kora.`:'',down.length?`VGV abaixo de 2025 em ${rangeTxt(down)}.`:'',dr.length>1&&vr.length>1?`A despesa mensal variou ${N1.format(Math.max(...dr)/Math.min(...dr))}× entre o menor e o maior mês realizado, enquanto o VGV variou ${N1.format(Math.max(...vr)/Math.min(...vr))}×: o gasto não acompanha o ritmo de vendas.`:'',DESP25?'':'A planilha não traz despesas de 2025, por isso só a linha de 2026 aparece.']); }
  let h=`<thead><tr><th class="l">Mês</th><th>VGV 2025</th><th>VGV 2026</th><th>Variação</th><th>Var. %</th><th>Despesa 2026</th><th>Despesa ÷ VGV</th></tr></thead><tbody>`;
  ms.forEach(m=>{const a=D.vgv25[m-1],ok=VGV_OK(m),c=ok?D.vgv26[m-1]:null,d=dm[m-1];
    h+=`<tr class="clk" data-id="${m}"><td class="l">${MESL[m-1]}${stat(m)?` <span class="pill">${stat(m)}</span>`:''}</td><td>${brl(a)}</td><td>${ok?brl(c):'<span class="dim">não lançado</span>'}</td><td>${ok?((c-a>=0?'+':'')+brlC(c-a)):'—'}</td><td>${ok?`<span style="color:${c>=a?'var(--good)':'var(--bad)'};font-weight:600">${(c/a-1>=0?'+':'')+pct(c/a-1,1)}</span>`:'—'}</td><td>${brl(d)}</td><td>${ok?pct(d/c,2):'—'}</td></tr>`;});
  h+=`</tbody><tfoot><tr><td class="l">Meses com VGV (${rangeTxt(vms)})</td><td>${brl(v25)}</td><td>${brl(v26)}</td><td>${vms.length?(v26-v25>=0?'+':'')+brlC(v26-v25):'—'}</td><td>${vms.length?(var_>=0?'+':'')+pct(var_,1):'—'}</td><td>${brl(dOk)}</td><td>${v26?pct(dOk/v26,2):'—'}</td></tr></tfoot>`;
  $('#g-tb').innerHTML=h;
  bindRows($('#g-tb'),id=>{const m=+id;openDrill({anchor:'p-g-tb',key:'m',id:m,eye:'Mês',label:MESL[m-1]+'/26',base:'all',where:r=>r.m===m,scope:'Todas as verbas · '+MESL[m-1]+'/26'+(stat(m)?' ('+stat(m)+')':'')});});
  { const rat=vms.map(m=>[m,dm[m-1]/D.vgv26[m-1]]);const bb=rat.length?rat.reduce((a,x)=>x[1]<a[1]?x:a):null,w=rat.length?rat.reduce((a,x)=>x[1]>a[1]?x:a):null;
    obs('p-g-tb',[bb&&w&&bb[0]!==w[0]?`Melhor relação despesa ÷ VGV em <b>${MESL[bb[0]-1]}</b> (${pct(bb[1],2)}); a pior foi em ${MESL[w[0]-1]} (${pct(w[1],2)}).`:'','A despesa vem da base de lançamentos (fórmula), não dos valores digitados na aba 1.']); }
};

R['por-verba']=()=>{
  const rs=rows(),ms=MS(),T=tot(rs);
  const vbs=ALLV.filter(i=>F.vb.includes(i));
  heat($('#vb-heat'),{months:ms,head:'Verba',rows:vbs.map(i=>({label:VB[i],vals:monthly(rs.filter(r=>r.vb===i))}))});
  { const pk=vbs.map(i=>{const mm=monthly(rs.filter(r=>r.vb===i));let bm=ms[0];ms.forEach(m=>{if(mm[m-1]>mm[bm-1])bm=m;});return [i,bm,mm[bm-1]];}).filter(x=>x[2]>0);
    obs('p-vb-heat',[pk.length?'Pico de cada verba: '+pk.map(x=>`${VB[x[0]]} em ${MESL[x[1]-1].toLowerCase()} (${brlC(x[2])})`).join('; ')+'.':'',ms.some(m=>m>CUR)?`Valores de ${PROV_T} são provisão.`:'']); }
  const top=(arr,f)=>arr.length?`${esc(f(arr[0][0]))}<span class="sub2">${brlC(arr[0][1])}</span>`:'—';
  let h=`<thead><tr><th class="l">Verba</th><th>Despesa</th><th>% do recorte</th><th>Lançamentos</th><th>Ticket médio</th><th class="l">Maior classificação</th><th class="l">Maior centro de custo</th><th class="l">Maior fornecedor</th></tr></thead><tbody>`;
  const fxr=[];
  vbs.forEach(i=>{const r=rs.filter(x=>x.vb===i),v=tot(r);if(r.length)fxr.push([i,v/r.length]);
    h+=`<tr class="clk" data-id="${i}"><td class="l"><span class="nm" style="display:inline-flex;align-items:center;gap:7px"><i style="width:9px;height:9px;border-radius:3px;background:${VBC[i]};display:inline-block"></i>${VB[i]}</span></td><td>${brl(v)}</td><td>${pct(T?v/T:0,1)}</td><td>${N0.format(r.length)}</td><td>${r.length?brlC(v/r.length):'—'}</td><td class="l">${top(group(r,'cl'),id=>D.cls[id])}</td><td class="l">${top(group(r,'cc'),id=>D.ccs[id])}</td><td class="l">${top(group(r,'fo'),fname)}</td></tr>`;});
  h+=`</tbody><tfoot><tr><td class="l">Total</td><td>${brl(T)}</td><td>100%</td><td>${N0.format(rs.length)}</td><td>${rs.length?brlC(T/rs.length):'—'}</td><td></td><td></td><td></td></tr></tfoot>`;
  $('#vb-tb').innerHTML=h;
  bindRows($('#vb-tb'),id=>{const i=+id;openDrill({anchor:'p-vb-tb',key:'vb',id:i,eye:'Verba',label:VB[i],where:r=>r.vb===i,apply:()=>{F.vb=[i];changed();}});});
  fxr.sort((a,b)=>b[1]-a[1]);
  obs('p-vb-tb',[fxr.length>1?`Maior ticket médio: <b>${esc(VB[fxr[0][0]])}</b> (${brlC(fxr[0][1])} por lançamento); menor: ${esc(VB[fxr[fxr.length-1][0]])} (${brlC(fxr[fxr.length-1][1])}).`:'',rs.length?`Ticket médio do recorte: ${brlC(T/rs.length)} por lançamento.`:'']);
};

const VE=new Map(D.vendasEmp.map(e=>[e.nome,e])),VO=new Map(D.verbasEmp.map(e=>[e.nome,e]));
const CCI=new Map(D.ccs.map((n,i)=>[n,i]));
const CC_NOTE='Centro de custo de faturamento: inclui contratos institucionais lançados neste CC; não é rateio por produto.';
R['centro-custo']=()=>{
  const rs=rows(),ms=MS(),T=tot(rs);const g=new Map(group(rs,'cc'));
  const hr=[];TIPO_ORD.forEach(t=>{const ids=D.ccs.map((_,i)=>i).filter(i=>D.ccTipo[i]===t&&g.get(i)).sort((a,b)=>g.get(b)-g.get(a));if(!ids.length)return;hr.push({grp:t==='Lançamento'?'Lançamentos':t==='Estoque'?'Estoque':'Institucional (sem empreendimento)'});ids.forEach(i=>hr.push({id:i,label:D.ccs[i],vals:monthly(rs.filter(r=>r.cc===i)),pick:1,sel:F.cc.includes(i)}));});
  heat($('#cc-heat'),{months:ms,head:'Centro de custo',rows:hr,onPick:id=>toggleOnly('cc',+id)});
  { const act=[...g.keys()].map(i=>[i,new Set(rs.filter(r=>r.cc===i).map(r=>r.m)).size]).sort((a,b)=>b[1]-a[1]);const small=[...g].filter(([,v])=>v/T<.01).length;
    obs('p-cc-heat',[g.size?`<b>${D.ccs[[...g.keys()][0]]}</b> concentra ${pct([...g.values()][0]/T,0)} da despesa do recorte.`:'',act.length?`${D.ccs[act[0][0]]} tem despesa em ${act[0][1]} de ${ms.length} meses, o CC mais recorrente.`:'',small?`${small} centros de custo ficam abaixo de 1% do recorte cada.`:'']); }
  let h=`<thead><tr><th class="l">Centro de custo</th><th>Despesa</th><th>%</th><th class="l">Maior classificação</th><th>VGV ${EMP_T}</th><th>UH</th><th>Verba</th><th>Utilizado</th><th>% utilizado</th></tr></thead><tbody>`;
  const exc=[];
  [...g.keys()].forEach(i=>{const n=D.ccs[i],r=rs.filter(x=>x.cc===i),v=g.get(i),gc=group(r,'cl')[0];const e=VE.get(n),o=VO.get(n);
    const ev=e?e.vgv.slice(0,EMP_LAST).reduce((a,c)=>a+c,0):0,uh=e?e.uh.slice(0,EMP_LAST).reduce((a,c)=>a+c,0):0;const p=o&&o.verba?o.usado/o.verba:null;if(p>1)exc.push(n);
    h+=`<tr class="clk" data-id="${i}"><td class="l"><span class="nm">${esc(n)}</span><span class="sub2">${D.ccTipo[i]}</span></td><td>${brl(v)}</td><td>${pct(v/T,1)}</td><td class="l">${gc?esc(D.cls[gc[0]])+`<span class="sub2">${brlC(gc[1])}</span>`:'—'}</td><td>${ev?brlC(ev):'—'}</td><td>${uh||'—'}</td><td>${o&&o.verba?brlC(o.verba):'—'}</td><td>${o?brlC(o.usado):'—'}</td><td>${p==null?(o?'<span class="pill">sem verba</span>':'—'):`<span class="pill ${p>1?'bad':p>=.7?'warn':'good'}">${pct(p,0)}</span>`}</td></tr>`;});
  h+=`</tbody><tfoot><tr><td class="l">Total</td><td>${brl(T)}</td><td>100%</td><td></td><td></td><td></td><td></td><td></td><td></td></tr></tfoot>`;
  $('#cc-tb').innerHTML=h;
  bindRows($('#cc-tb'),id=>{const i=+id;openDrill({anchor:'p-cc-tb',key:'cc',id:i,eye:'Centro de custo',label:D.ccs[i],where:r=>r.cc===i,note:CC_NOTE,apply:()=>{F.cc=[i];changed();}});});
  obs('p-cc-tb',[exc.length?`Com verba já excedida na aba 6 e despesa no recorte: ${exc.map(esc).join(', ')}.`:'Nenhum CC do recorte com verba excedida na aba 6.','Verba e utilizado vêm da aba 6 (acumulado, digitado); VGV vem da abertura por empreendimento (aba 6).']);
};

let SELCL=null,CLN=15;
$$('#cl-seg button').forEach(b=>b.addEventListener('click',()=>{$$('#cl-seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));CLN=+b.dataset.n;render();}));
R.classificacao=()=>{
  const rs=rows(),ms=MS(),T=tot(rs);const g=group(rs,'cl');
  if(SELCL==null||!g.some(x=>x[0]===SELCL))SELCL=g.length?g[0][0]:null;
  const shown=g.slice(0,CLN),rest=g.slice(CLN);
  const hr=shown.map(([id])=>({id,label:D.cls[id],vals:monthly(rs.filter(r=>r.cl===id)),pick:1,sel:id===SELCL}));
  if(rest.length){const ids=new Set(rest.map(x=>x[0]));hr.push({label:`Demais ${rest.length} classificações`,vals:monthly(rs.filter(r=>ids.has(r.cl)))});}
  $('#cl-sub').textContent=`R$ mil · ${g.length} classificações no recorte · clique numa linha para ver o detalhe`;
  heat($('#cl-heat'),{months:ms,head:'Classificação',rows:hr,onPick:id=>{if(id!==''){SELCL=+id;R.classificacao();renderDrill(false);addCopies();}}});
  { const rec=g.map(([id])=>[id,new Set(rs.filter(r=>r.cl===id).map(r=>r.m)).size]).sort((a,b)=>b[1]-a[1]);
    obs('p-cl-heat',[g.length?`${g.length} classificações no recorte; as 5 maiores somam <b>${pct(g.slice(0,5).reduce((s,x)=>s+x[1],0)/T,0)}</b>.`:'',rec.length?`Mais recorrentes: ${rec.slice(0,3).map(x=>`${esc(D.cls[x[0]])} (${x[1]} meses)`).join(', ')}.`:'']); }
  const det=$('#cl-det');
  if(SELCL==null){det.innerHTML='<p class="empty">Sem lançamentos no recorte.</p>';obs('cl-det',[]);}
  else{
    const r=rs.filter(x=>x.cl===SELCL),v=tot(r);const on=F.cl.length===1&&F.cl[0]===SELCL;
    det.innerHTML=`<div class="ph"><div><h2>${esc(D.cls[SELCL])}<span class="dot">.</span></h2><p>${brl(v)} · ${pct(v/T,1)} do recorte · ${N0.format(r.length)} lançamentos</p></div><button class="btn-out" type="button" id="cl-flt">${on?'Remover filtro':'Filtrar o painel'}</button></div>
      <div class="stack100">${ALLV.map(i=>{const x=tot(r.filter(q=>q.vb===i));return x?`<i style="width:${(x/v*100).toFixed(2)}%;--c:${VBC[i]}" title="${VB[i]} ${brl(x)}"></i>`:'';}).join('')}</div>
      <div class="legend">${ALLV.map(i=>{const x=tot(r.filter(q=>q.vb===i));return x?`<span><i style="--c:${VBC[i]}"></i>${VB[i]} ${brlC(x)}</span>`:'';}).join('')}</div>
      <h3 class="dr-h" style="margin-top:6px">Principais fornecedores</h3><div class="bars" id="cl-fo"></div>`;
    const gs=group(r,'vb'),gf=group(r,'fo');
    hbars($('#cl-fo'),gf.slice(0,6).map(([id,x])=>({label:fname(id),total:x,c:'var(--gold)',val:`${brlC(x)}<small>${pct(x/v,0)}</small>`,act:()=>toggleOnly('fo',id)})));
    $('#cl-flt').addEventListener('click',()=>toggleOnly('cl',SELCL));
    obs('cl-det',[`${esc(D.cls[SELCL])}: ${brl(v)} em ${r.length} lançamentos.`,gs.length?`Verba principal: <b>${esc(VB[gs[0][0]])}</b> (${pct(gs[0][1]/v,0)}).`:'',gf.length?`Fornecedor principal: <b>${esc(fname(gf[0][0]))}</b> (${pct(gf[0][1]/v,0)}).`:'']);
  }
  const S=g.map(([id,v])=>{const r=rs.filter(x=>x.cl===id);return {id,v,n:r.length,vb:group(r,'vb')[0],fo:group(r,'fo')[0],cc:group(r,'cc')[0]};});
  let h=`<thead><tr><th class="l">Classificação</th><th>Despesa</th><th>%</th><th>Lançamentos</th><th>Ticket médio</th><th class="l">Verba principal</th><th class="l">Maior fornecedor</th><th class="l">Maior centro de custo</th></tr></thead><tbody>`;
  h+=S.map(s=>`<tr class="clk" data-id="${s.id}"><td class="l"><span class="nm">${esc(D.cls[s.id])}</span></td><td>${brl(s.v)}</td><td>${pct(s.v/T,1)}</td><td>${s.n}</td><td>${brlC(s.v/s.n)}</td><td class="l">${esc(VB[s.vb[0]])}<span class="sub2">${pct(s.vb[1]/s.v,0)}</span></td><td class="l">${esc(fname(s.fo[0]))}<span class="sub2">${brlC(s.fo[1])}</span></td><td class="l">${esc(D.ccs[s.cc[0]])}<span class="sub2">${brlC(s.cc[1])}</span></td></tr>`).join('')||'<tr><td class="l dim" colspan="8">Sem lançamentos no recorte.</td></tr>';
  h+=`</tbody><tfoot><tr><td class="l">Total</td><td>${brl(T)}</td><td>100%</td><td>${N0.format(rs.length)}</td><td>${rs.length?brlC(T/rs.length):'—'}</td><td></td><td></td><td></td></tr></tfoot>`;
  $('#cl-tb').innerHTML=h;
  bindRows($('#cl-tb'),id=>{const i=+id;openDrill({anchor:'p-cl-tb',key:'cl',id:i,eye:'Classificação',label:D.cls[i],where:r=>r.cl===i,apply:()=>{F.cl=[i];changed();}});});
  { const tk=S.slice().sort((a,c)=>c.v/c.n-a.v/a.n)[0],mn=S.slice().sort((a,c)=>c.n-a.n)[0];
    obs('p-cl-tb',[tk?`Maior ticket médio: <b>${esc(D.cls[tk.id])}</b> (${brlC(tk.v/tk.n)} por lançamento).`:'',mn?`Mais lançamentos: ${esc(D.cls[mn.id])} (${mn.n}).`:'']); }
};

const FO={k:'v',d:-1,q:'',p:0};
$('#fo-q').addEventListener('input',e=>{FO.q=e.target.value.trim().toLowerCase();FO.p=0;R.fornecedores();renderDrill(false);});
R.fornecedores=()=>{
  const rs=rows(),T=tot(rs);const S=new Map();
  for(const r of rs){let s=S.get(r.fo);if(!s){s={id:r.fo,v:0,n:0,ms:new Set(),vb:new Map(),cc:new Map()};S.set(r.fo,s);}s.v+=r.v;s.n++;s.ms.add(r.m);s.vb.set(r.vb,(s.vb.get(r.vb)||0)+r.v);s.cc.set(r.cc,(s.cc.get(r.cc)||0)+r.v);}
  const arr=[...S.values()].map(s=>({...s,name:D.forn[s.id],alias:IMOB.get(s.id)||'',t:s.v/s.n,nm:s.ms.size,vbm:[...s.vb].sort((a,c)=>c[1]-a[1])[0][0],ccm:[...s.cc].sort((a,c)=>c[1]-a[1])[0][0]})).sort((a,c)=>c.v-a.v);
  const t10=arr.slice(0,10).reduce((s,x)=>s+x.v,0);
  kpis($('#fo-kpis'),[
    {lead:1,k:'Fornecedores no recorte',v:N0.format(arr.length),s:`${N0.format(rs.length)} lançamentos · ${brlC(T)}`},
    {k:'Maior fornecedor',v:arr.length?pct(arr[0].v/T,1):'—',dash:!arr.length,s:arr.length?`<b>${esc(arr[0].alias||arr[0].name)}</b> · ${brlC(arr[0].v)}`:''},
    {k:'10 maiores',v:arr.length?pct(t10/T,0):'—',dash:!arr.length,s:'do valor do recorte',share:T?t10/T:0},
    {k:'Ticket médio',v:rs.length?brlC(T/rs.length):'—',dash:!rs.length,s:'por lançamento'},
  ]);
  const one=arr.filter(s=>s.n===1);const onev=one.reduce((s,x)=>s+x.v,0);
  obs('fo-kpis',[arr.length?`Os 10 maiores fornecedores concentram <b>${pct(t10/T,0)}</b> do recorte.`:'',one.length?`${one.length} fornecedores têm um único lançamento e somam ${brlC(onev)} (${pct(onev/T,0)}).`:'']);
  $('#fo-leg').innerHTML=ALLV.filter(i=>rs.some(r=>r.vb===i)).map(i=>`<span><i style="--c:${VBC[i]}"></i>${VB[i]}</span>`).join('');
  hbars($('#fo-bars'),arr.slice(0,15).map(s=>({label:s.alias||s.name,sub:s.alias?s.name:D.cls[group(rs.filter(r=>r.fo===s.id),'cl')[0][0]],total:s.v,segs:ALLV.map(i=>({v:s.vb.get(i)||0,c:VBC[i]})),val:`${brlC(s.v)}<small>${pct(s.v/T,0)}</small>`,on:F.fo.includes(s.id),act:()=>toggleOnly('fo',s.id)})));
  obs('p-fo-bars',[arr.length?`<b>${esc(arr[0].alias||arr[0].name)}</b> lidera com ${pct(arr[0].v/T,1)} do recorte${/DUE EMPREENDIMENTOS/.test(arr[0].name)?' (reembolso de faturas Meta lançado em nome da DUE Empreendimentos)':''}.`:'',arr.length>=15?`O top 15 soma ${pct(arr.slice(0,15).reduce((s,x)=>s+x.v,0)/T,0)} do recorte.`:'']);
  let list=arr;if(FO.q)list=arr.filter(s=>(s.name+' '+s.alias).toLowerCase().includes(FO.q));
  const key={v:s=>s.v,n:s=>s.n,t:s=>s.t,nm:s=>s.nm,name:s=>(s.alias||s.name).toLowerCase()}[FO.k];
  list=list.slice().sort((a,c)=>{const x=key(a),y=key(c);return (x<y?-1:x>y?1:0)*FO.d;});
  const size=25,pages=Math.max(1,Math.ceil(list.length/size));if(FO.p>=pages)FO.p=pages-1;
  const pg=list.slice(FO.p*size,FO.p*size+size);
  let h=`<thead><tr><th class="l" data-k="name" data-t="s">Fornecedor</th><th data-k="v">Total</th><th>%</th><th data-k="n">Lançamentos</th><th data-k="t">Ticket médio</th><th data-k="nm">Meses</th><th class="l">Verba principal</th><th class="l">Centro de custo principal</th></tr></thead><tbody>`;
  h+=pg.map(s=>`<tr class="clk" data-id="${s.id}"><td class="l"><span class="nm">${esc(s.alias||s.name)}</span>${s.alias?`<span class="sub2">${esc(s.name)}</span>`:''}</td><td>${brl(s.v)}</td><td>${pct(s.v/T,1)}</td><td>${s.n}</td><td>${brlC(s.t)}</td><td>${s.nm}</td><td class="l">${esc(VB[s.vbm])}</td><td class="l">${esc(D.ccs[s.ccm])}</td></tr>`).join('')||'<tr><td class="l dim" colspan="8">Nenhum fornecedor encontrado.</td></tr>';
  $('#fo-tb').innerHTML=h+'</tbody>';
  sortable($('#fo-tb'),FO,()=>{FO.p=0;R.fornecedores();renderDrill(false);});
  bindRows($('#fo-tb'),id=>{const i=+id;openDrill({anchor:'p-fo-tb',key:'fo',id:i,eye:'Fornecedor',label:fname(i),where:r=>r.fo===i,note:IMOB.get(i)?esc(D.forn[i]):'',apply:()=>{F.fo=[i];changed();}});});
  pager($('#fo-pg'),FO.p,list.length,size,p=>{FO.p=p;R.fornecedores();renderDrill(false);});
  const freq=arr.filter(s=>s.nm>=9).length;
  obs('p-fo-tb',[`${N0.format(list.length)} fornecedores${FO.q?' na busca':''}; a tabela mostra ${pg.length} por página.`,freq?`${freq} fornecedores aparecem em 9 meses ou mais do recorte.`:'']);
};


R['vendas-emp']=()=>{
  const ms=MS().filter(m=>m<=EMP_LAST);const E=D.vendasEmp.filter(e=>e.vendas>0);
  const vg=e=>ms.reduce((s,m)=>s+e.vgv[m-1],0),uh=e=>ms.reduce((s,m)=>s+e.uh[m-1],0);
  const V=E.reduce((s,e)=>s+vg(e),0),U=E.reduce((s,e)=>s+uh(e),0),Lc=E.filter(e=>e.tipo==='Lançamento').reduce((s,e)=>s+vg(e),0);
  const est=E.filter(e=>e.unid&&e.estoque>=0).reduce((s,e)=>s+e.estoque,0);
  kpis($('#ve-kpis'),[
    {lead:1,k:'VGV por empreendimento',v:ms.length?brlC(V):'—',dash:!ms.length,s:ms.length?rangeTxt(ms)+' · aba 6':`período fora de ${EMP_T}`},
    {k:'Unidades vendidas',v:ms.length?N0.format(U):'—',dash:!ms.length,s:'UH no período'},
    {k:'Ticket médio',v:U?brlC(V/U):'—',dash:!U,s:'VGV ÷ UH'},
    {k:'Lançamentos (Kora + Solina)',v:V?pct(Lc/V,0):'—',dash:!V,s:V?`${brlC(Lc)} do VGV`:'',share:V?Lc/V:0},
    {k:'Estoque',v:N0.format(est),s:'unidades disponíveis (posição da aba 6)'},
  ]);
  obs('ve-kpis',[V?`VGV de ${brl(V)} em ${U} unidades (ticket médio de ${brlC(V/U)}).`:`Período fora da abertura por empreendimento (${EMP_T}).`,V?`Kora e Solina respondem por <b>${pct(Lc/V,0)}</b> do VGV do período.`:'',`${est} unidades em estoque nos produtos com unidades cadastradas.`]);
  const arr=E.map(e=>({e,v:vg(e),u:uh(e)})).filter(x=>x.v>0).sort((a,c)=>c.v-a.v);
  hbars($('#ve-bars'),arr.map(x=>({label:x.e.nome,sub:x.e.tipo,total:x.v,c:x.e.tipo==='Lançamento'?'var(--gold)':'var(--s1)',val:`${brlC(x.v)}<small>${x.u} UH</small>`})));
  if(!ms.length)$('#ve-bars').innerHTML='<p class="empty">A abertura por empreendimento só existe de jan a jun. Ajuste o período.</p>';
  { const es=arr.find(x=>x.e.tipo==='Estoque');obs('p-ve-bars',[arr.length>1?`${esc(arr[0].e.nome)} (${pct(arr[0].v/V,0)}) e ${esc(arr[1].e.nome)} (${pct(arr[1].v/V,0)}) lideram o VGV do período.`:'',es?`Entre os produtos de estoque, o maior VGV é de ${esc(es.e.nome)} (${brlC(es.v)}).`:'']); }
  let h=`<thead><tr><th class="l">Empreendimento</th><th>Unid.</th><th>Vendidas</th><th>Estoque</th><th>% vendido</th></tr></thead><tbody>`;
  const srt=E.slice().sort((a,c)=>(c.unid?c.vendas/c.unid:0)-(a.unid?a.vendas/a.unid:0));
  srt.forEach(e=>{const p=e.unid?e.vendas/e.unid:null;
    h+=`<tr class="clk" data-id="${esc(e.nome)}"><td class="l"><span class="nm">${esc(e.nome)}</span>${e.tipo==='Lançamento'?' <span class="pill gold">lançamento</span>':''}</td><td>${e.unid??'—'}</td><td>${e.vendas}</td><td>${e.unid?e.estoque:'<span class="pill warn">sem unidades cadastradas</span>'}</td><td>${p==null?'—':`<span class="meter"><span class="trk"><i style="width:${Math.min(100,p*100).toFixed(1)}%;--c:${p>=.8?'var(--good)':p>=.3?'var(--s1)':'var(--warn)'}"></i></span>${pct(p,0)}</span>`}</td></tr>`;});
  $('#ve-tb').innerHTML=h+'</tbody>';
  bindRows($('#ve-tb'),nm=>{const i=CCI.get(nm);openDrill({anchor:'p-ve-tb',key:'emp',id:nm,eye:'Empreendimento',label:nm,base:'period',where:i==null?(()=>false):(r=>r.cc===i),scope:`Centro de custo ${nm} · ${perTxt()} · todas as verbas`,note:i==null?'Este empreendimento não aparece como centro de custo na base de lançamentos.':CC_NOTE});});
  { const wu=srt.filter(e=>e.unid);obs('p-ve-tb',[wu.length?`Maior velocidade: <b>${esc(wu[0].nome)}</b> (${pct(wu[0].vendas/wu[0].unid,0)} vendido); menor: ${esc(wu[wu.length-1].nome)} (${pct(wu[wu.length-1].vendas/wu[wu.length-1].unid,0)}, ${wu[wu.length-1].estoque} UH em estoque).`:'',E.some(e=>!e.unid)?`${E.filter(e=>!e.unid).map(e=>esc(e.nome)).join(' e ')} sem unidades cadastradas na aba 6.`:'']); }
  const hm=$('#ve-heat');
  if(!ms.length){hm.innerHTML=`<tbody><tr><td class="empty">Sem meses de ${EMP_T} no período.</td></tr></tbody>`;obs('p-ve-heat',[]);return;}
  heat(hm,{months:ms,head:'Empreendimento',rows:arr.map(x=>({label:x.e.nome,vals:x.e.vgv}))});
  hm.querySelectorAll('tbody tr').forEach((tr,i)=>{const e=arr[i]&&arr[i].e;if(!e)return;tr.querySelectorAll('td:not(.l):not(.t)').forEach((td,j)=>{const u=e.uh[ms[j]-1];if(u)td.innerHTML+=`<small style="display:block;font-size:9.5px;opacity:.82">${u} UH</small>`;});});
  { const mv=ms.map(m=>[m,arr.reduce((s,x)=>s+x.e.vgv[m-1],0)]).sort((a,c)=>c[1]-a[1]);obs('p-ve-heat',[mv.length>1&&V?`${MESL[mv[0][0]-1]} e ${MESL[mv[1][0]-1].toLowerCase()} concentram ${pct((mv[0][1]+mv[1][1])/V,0)} do VGV do período.`:'']); }
};

R.orcamento=()=>{
  const W=D.verbasEmp.filter(e=>e.verba),S=D.verbasEmp.filter(e=>!e.verba);
  const vt=W.reduce((s,e)=>s+e.verba,0),ut=W.reduce((s,e)=>s+e.usado,0),sv=S.reduce((s,e)=>s+e.usado,0);
  const st=e=>e.verba-e.usado<0?'bad':e.usado/e.verba>=.7?'warn':'good';
  const ex=W.filter(e=>st(e)==='bad'),estouro=ex.reduce((s,e)=>s+e.usado-e.verba,0);
  kpis($('#or-kpis'),[
    {lead:1,k:'Verba total',v:brlC(vt),s:`${W.length} empreendimentos com verba`},
    {k:'Utilizado',v:brlC(ut),s:`${pct(ut/vt,0)} da verba`,share:ut/vt},
    {k:'Saldo',v:brlC(vt-ut),s:'verba − utilizado'},
    {k:'Excedidos',v:`${ex.length} de ${W.length}`,s:`<b>${brlC(estouro)}</b> além do orçado`},
    {k:'Sem verba definida',v:brlC(sv),s:S.map(e=>esc(e.nome)).join(', ')},
  ]);
  const pos=W.filter(e=>e.verba>e.usado).sort((a,c)=>(c.verba-c.usado)-(a.verba-a.usado));const ps=pos.reduce((s,e)=>s+e.verba-e.usado,0);
  obs('or-kpis',[`${ex.length} de ${W.length} empreendimentos passaram da verba, somando <b>${brl(estouro)}</b> além do orçado.`,pos.length>1?`O saldo livre está concentrado em ${esc(pos[0].nome)} (${brlC(pos[0].verba-pos[0].usado)}) e ${esc(pos[1].nome)} (${brlC(pos[1].verba-pos[1].usado)}): ${pct((pos[0].verba-pos[0].usado+pos[1].verba-pos[1].usado)/ps,0)} do saldo positivo.`:'',sv?`${brlC(sv)} consumidos em centros sem verba cadastrada (${S.map(e=>esc(e.nome)).join(', ')}).`:'']);
  const C={bad:'var(--bad)',warn:'var(--warn)',good:'var(--good)'};
  const arr=W.slice().sort((a,c)=>c.usado/c.verba-a.usado/a.verba);
  hbars($('#or-bars'),arr.map(e=>({label:e.nome,total:e.usado/e.verba,c:C[st(e)],val:`${pct(e.usado/e.verba,1)}<small>${brlC(e.usado)}</small>`})));
  obs('p-or-bars',[ex.length?`Maiores estouros: ${ex.slice().sort((a,c)=>c.usado/c.verba-a.usado/a.verba).slice(0,3).map(e=>`${esc(e.nome)} (${pct(e.usado/e.verba,0)})`).join(', ')}.`:'',`Abaixo de 70% de consumo: ${W.filter(e=>st(e)==='good').map(e=>esc(e.nome)).join(', ')||'nenhum'}.`]);
  let h=`<thead><tr><th class="l">Empreendimento</th><th>Verba</th><th>Utilizado</th><th>Saldo</th><th class="l">Situação</th></tr></thead><tbody>`;
  arr.forEach(e=>{const s=st(e);h+=`<tr class="clk" data-id="${esc(e.nome)}"><td class="l"><span class="nm">${esc(e.nome)}</span></td><td>${brl(e.verba)}</td><td>${brl(e.usado)}</td><td style="color:${e.verba-e.usado<0?'var(--bad)':'inherit'}">${brl(e.verba-e.usado)}</td><td class="l"><span class="pill ${s}">${s==='bad'?'Excedido':s==='warn'?'Atenção':'Dentro'} · ${pct(e.usado/e.verba,0)}</span></td></tr>`;});
  S.forEach(e=>{h+=`<tr class="clk" data-id="${esc(e.nome)}"><td class="l"><span class="nm">${esc(e.nome)}</span></td><td class="dim">—</td><td>${brl(e.usado)}</td><td class="dim">—</td><td class="l"><span class="pill warn">sem verba cadastrada</span></td></tr>`;});
  h+=`</tbody><tfoot><tr><td class="l">Total</td><td>${brl(vt)}</td><td>${brl(ut+sv)}</td><td>${brl(vt-ut)}</td><td></td></tr></tfoot>`;
  $('#or-tb').innerHTML=h;
  bindRows($('#or-tb'),nm=>{const i=CCI.get(nm);openDrill({anchor:'p-or-tb',key:'emp',id:nm,eye:'Empreendimento',label:nm,base:'all',where:i==null?(()=>false):(r=>r.cc===i),scope:`Despesas de 2026 no centro de custo ${nm} · jan–dez · todas as verbas`,note:'A aba 6 não tem período declarado; aqui aparecem só os lançamentos de 2026 da base. '+CC_NOTE});});
  obs('p-or-tb',['Verba e utilizado são valores digitados na aba 6, sem ligação com a base de lançamentos.']);
};

const IMC=group(L.filter(r=>IMOB_CL.includes(r.cl)),'cl').slice(0,4).map(([id],k)=>[id,['var(--s1)','var(--s3)','var(--s2)','var(--s5)'][k]]);
const OUT='Outros fornecedores';
R.imobiliarias=()=>{
  const rs=rows(),ms=MS(),T=tot(rs);
  const pn=r=>IMOB.get(r.fo)||OUT;
  const g=group(rs,pn);const parts=g.filter(x=>x[0]!==OUT);
  const vms=ms.filter(m=>D.vgvImob[m-1]>0),vi=vms.reduce((s,m)=>s+D.vgvImob[m-1],0),inv=tot(rs.filter(r=>vms.includes(r.m)));
  const sub=F.fo.length||F.cc.length||F.cl.length;
  kpis($('#im-kpis'),[
    {lead:1,k:'Investimento em imobiliárias',v:brlC(T),s:`classificações de imobiliária · ${N0.format(rs.length)} lançamentos`},
    {k:'Parceiros com investimento',v:N0.format(parts.length),s:'imobiliárias e corretoras'},
    {k:'Maior parceiro',v:parts.length?pct(parts[0][1]/T,0):'—',dash:!parts.length,s:parts.length?`<b>${esc(parts[0][0])}</b> · ${brlC(parts[0][1])}`:''},
    {k:'VGV via imobiliárias',v:vms.length?brlC(vi):'—',dash:!vms.length,s:vms.length?`aba 4 · ${rangeTxt(vms)}${IMOB_LAST?` (lançado até ${MES[IMOB_LAST-1].toLowerCase()})`:''}`:'sem VGV de imobiliárias no período'},
    {k:'VGV ÷ investimento',v:(!sub&&inv&&vi)?'R$ '+N0.format(vi/inv):'—',dash:!!(sub||!inv||!vi),s:sub?'VGV não é aberto por parceiro na planilha':(inv&&vi)?`por R$ 1 investido · ${rangeTxt(vms)}`:''},
  ]);
  obs('im-kpis',[`<b>${brl(T)}</b> investidos em ${parts.length} parceiros${parts.length?`; ${esc(parts[0][0])} recebe ${pct(parts[0][1]/T,0)}`:''}.`,(!sub&&inv&&vi)?`Nos meses com VGV de imobiliárias (${rangeTxt(vms)}), cada R$ 1 investido acompanhou R$ ${N0.format(vi/inv)} de VGV vendido pelas parceiras.`:'']);
  const showD=rs.some(x=>!IMC.some(([id])=>x.cl===id));
  $('#im-leg').innerHTML=IMC.map(([id,c])=>`<span><i style="--c:${c}"></i>${esc(D.cls[id])}</span>`).join('')+(showD?`<span><i style="--c:var(--s4)"></i>Demais</span>`:'');
  const segsOf=r=>{const out=IMC.map(([id,c])=>({v:tot(r.filter(x=>x.cl===id)),c}));if(showD)out.push({v:tot(r.filter(x=>!IMC.some(([id])=>x.cl===id))),c:'var(--s4)'});return out;};
  const idsOf=name=>[...new Set(rs.filter(x=>pn(x)===name).map(x=>x.fo))];
  hbars($('#im-bars'),g.map(([name,v])=>{const ids=idsOf(name);const on=F.fo.length&&ids.every(i=>F.fo.includes(i))&&F.fo.length===ids.length;
    return {label:name,sub:name===OUT?`${ids.length} fornecedores fora da lista de imobiliárias`:'',total:v,segs:segsOf(rs.filter(x=>pn(x)===name)),val:`${brlC(v)}<small>${pct(v/T,0)}</small>`,on,act:()=>{F.fo=on?[]:ids;changed();}};}));
  { const gcl=group(rs,'cl'),ou=g.find(x=>x[0]===OUT);obs('p-im-bars',[parts.length>=3?`Os 3 maiores parceiros concentram <b>${pct(parts.slice(0,3).reduce((s,x)=>s+x[1],0)/T,0)}</b> do investimento.`:'',gcl.length?`${esc(D.cls[gcl[0][0]])} é ${pct(gcl[0][1]/T,0)} do investimento.`:'',ou?`${brlC(ou[1])} foram para fornecedores fora da lista de imobiliárias.`:'']); }
  barChart($('#im-chart'),{mode:'stack',cats:ms.map(m=>({label:MES[m-1]})),series:[{name:'VGV imobiliárias',color:'var(--s1)',vals:ms.map(m=>D.vgvImob[m-1]||0)}],line:{name:'Investimento',color:'var(--s5)',vals:ms.map(m=>tot(rs.filter(r=>r.m===m)))},h:260,noTop:true,aria:'VGV das imobiliárias e investimento',
    tip:i=>{const m=ms[i];const a=D.vgvImob[m-1]||null,bv=tot(rs.filter(r=>r.m===m));return `<div class="tt">${MESL[m-1]}</div>${trow('var(--s1)','VGV imobiliárias',a?brl(a):'não lançado')}${trow('var(--s5)','Investimento',brl(bv))}${a&&bv?`<div class="tn">R$ ${N0.format(a/bv)} de VGV por R$ 1</div>`:''}`;}});
  { const mm=monthly(rs);const pk=ms.slice().sort((a,c)=>mm[c-1]-mm[a-1]).slice(0,2).filter(m=>mm[m-1]>0);const after=ms.filter(m=>m>IMOB_LAST&&m<=CUR),av=after.reduce((s,m)=>s+mm[m-1],0);
    obs('p-im-chart',[pk.length?`Maiores investimentos: ${pk.map(m=>`${MESL[m-1]} (${brlC(mm[m-1])})`).join(' e ')}.`:'',av?`Em ${rangeTxt(after)} foram investidos ${brlC(av)} sem VGV de imobiliárias lançado para medir o retorno.`:'']); }
  heat($('#im-heat'),{months:ms,head:'Parceiro',rows:g.map(([name])=>({label:name,vals:monthly(rs.filter(x=>pn(x)===name))}))});
  { const once=g.filter(([name])=>name!==OUT&&new Set(rs.filter(x=>pn(x)===name).map(x=>x.m)).size===1);obs('p-im-heat',[once.length?`${once.length} parceiros receberam investimento em um único mês.`:'']); }
  let h=`<thead><tr><th class="l">Parceiro</th><th>Investimento</th><th>%</th><th>Lançamentos</th>${IMC.map(([id])=>`<th>${esc(D.cls[id])}</th>`).join('')}${showD?'<th>Demais</th>':''}<th>Meses</th></tr></thead><tbody>`;
  h+=g.map(([name,v])=>{const r=rs.filter(x=>pn(x)===name);const sg=segsOf(r);const raz=name===OUT?`${idsOf(name).length} fornecedores`:idsOf(name).map(i=>D.forn[i]).join(', ');return `<tr class="clk" data-id="${esc(name)}"><td class="l"><span class="nm">${esc(name)}</span><span class="sub2">${esc(raz)}</span></td><td>${brl(v)}</td><td>${pct(v/T,1)}</td><td>${r.length}</td>${sg.map(x=>`<td>${x.v?brlC(x.v):'<span class="dim">—</span>'}</td>`).join('')}<td>${new Set(r.map(x=>x.m)).size}</td></tr>`;}).join('')||'<tr><td class="l dim" colspan="${IMC.length+(showD?5:4)}">Sem investimento no recorte.</td></tr>';
  h+=`</tbody><tfoot><tr><td class="l">Total</td><td>${brl(T)}</td><td>100%</td><td>${rs.length}</td>${segsOf(rs).map(x=>`<td>${brlC(x.v)}</td>`).join('')}<td></td></tr></tfoot>`;
  $('#im-tb').innerHTML=h;
  bindRows($('#im-tb'),name=>{const ids=idsOf(name);openDrill({anchor:'p-im-tb',key:'imob',id:name,eye:'Parceiro',label:name,where:r=>pn(r)===name,note:name===OUT?'Fornecedores com classificação de imobiliária que não estão na lista de parceiros (associações, gráficas, promotoras…).':esc(ids.map(i=>D.forn[i]).join(', ')),apply:()=>{F.fo=ids;changed();}});});
  obs('p-im-tb',[parts.length&&IMC.length?`${parts.filter(([nm])=>tot(rs.filter(x=>pn(x)===nm&&x.cl===IMC[0][0]))>0).length} parceiros têm lançamentos em ${esc(D.cls[IMC[0][0]])}.`:'']);
};

R.sintta=()=>{
  const rs=rows(),ms=MS(),T=tot(rs);const rec=ms.reduce((s,m)=>s+D.sintta.vendas[m-1],0),mr=ms.filter(m=>D.sintta.vendas[m-1]>0);
  const met=D.sintta.metas,mt=met.reduce((s,x)=>s+x.meta,0),mrz=met.reduce((s,x)=>s+x.realizado,0);
  kpis($('#si-kpis'),[
    {lead:1,k:'Receita de vendas',v:brlC(rec),s:mr.length?`registrada em ${rangeTxt(mr)}`:'sem receita registrada no período'},
    {k:'Despesa de marketing',v:brlC(T),s:`verbas ${SINTTA_VB.map(i=>esc(VB[i])).join(' + ')} · ${N0.format(rs.length)} lançamentos`},
    {k:'Despesa ÷ receita',v:rec?pct(T/rec,1):'—',dash:!rec,s:rec?`R$ ${N2.format(T/rec*100)} de marketing a cada R$ 100 vendidos`:''},
    {k:'Metas de captação',v:pct(mrz/mt,0),s:`${brlC(mrz)} de ${brlC(mt)} (Cais e Praia)`,share:mrz/mt},
  ]);
  obs('si-kpis',[rec?`A Sintta gastou <b>R$ ${N2.format(T/rec*100)}</b> em marketing a cada R$ 100 de receita registrada no período.`:'Sem receita registrada no período.',mr.length?`Receita registrada só em ${rangeTxt(mr)}; a receita recorrente de hospedagem pode estar fora desta planilha.`:'']);
  barChart($('#si-chart'),{mode:'group',cats:ms.map(m=>({label:MES[m-1],dim:m>CUR})),series:[{name:'Receita',color:'var(--s5)',vals:ms.map(m=>D.sintta.vendas[m-1])},{name:'Despesa',color:'var(--gold)',vals:ms.map(m=>tot(rs.filter(r=>r.m===m)))}],h:250,aria:'Receita e despesa Sintta',
    tip:i=>{const m=ms[i];return `<div class="tt">${MESL[m-1]}</div>${trow('var(--s5)','Receita',brl(D.sintta.vendas[m-1]))}${trow('var(--gold)','Despesa',brl(tot(rs.filter(r=>r.m===m))))}`;}});
  { const nr=ms.filter(m=>!D.sintta.vendas[m-1]&&tot(rs.filter(r=>r.m===m))>0);obs('p-si-chart',[nr.length?`${nr.length} meses com despesa e sem receita registrada (${rangeTxt(nr)}), somando ${brlC(tot(rs.filter(r=>nr.includes(r.m))))}.`:'']); }
  $('#si-metas').innerHTML=met.map(x=>{const p=x.realizado/x.meta;return `<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:16px"><div style="display:flex;justify-content:space-between;gap:10px;font-size:13.5px"><b style="font-weight:600">${esc(x.nome)}</b><span style="color:${p<.5?'var(--bad)':'var(--good)'};font-weight:600">${pct(p,1)} da meta</span></div><div class="share" style="height:8px"><i style="width:${(Math.min(1,p)*100).toFixed(1)}%;--c:${p<.5?'var(--bad)':'var(--good)'}"></i></div><span class="cnote">Realizado ${brl(x.realizado)} · meta ${brl(x.meta)} · faltam <b>${brlC(x.meta-x.realizado)}</b></span></div>`;}).join('')+'<p class="cnote">Os demais empreendimentos aparecem como “META” na planilha porque não têm meta cadastrada, não porque atingiram.</p>';
  obs('p-si-metas',[met.map(x=>`${esc(x.nome)} em ${pct(x.realizado/x.meta,1)} da meta (faltam ${brlC(x.meta-x.realizado)})`).join('; ')+'.']);
  const g=group(rs,'cl');
  let h=`<thead><tr><th class="l">Classificação</th><th>Despesa</th><th>%</th><th>Lançamentos</th><th class="l">Maior fornecedor</th><th>Meses</th></tr></thead><tbody>`;
  h+=g.map(([id,v])=>{const r=rs.filter(x=>x.cl===id);const f=group(r,'fo')[0];return `<tr class="clk" data-id="${id}"><td class="l"><span class="nm">${esc(D.cls[id])}</span></td><td>${brl(v)}</td><td>${pct(v/T,1)}</td><td>${r.length}</td><td class="l">${esc(fname(f[0]))}<span class="sub2">${brlC(f[1])}</span></td><td>${new Set(r.map(x=>x.m)).size}</td></tr>`;}).join('')||'<tr><td class="l dim" colspan="6">Sem despesa no recorte.</td></tr>';
  h+=`</tbody><tfoot><tr><td class="l">Total</td><td>${brl(T)}</td><td>100%</td><td>${rs.length}</td><td></td><td></td></tr></tfoot>`;
  $('#si-tb').innerHTML=h;
  bindRows($('#si-tb'),id=>{const i=+id;openDrill({anchor:'p-si-tb',key:'sicl',id:i,eye:'Sintta · classificação',label:D.cls[i],where:r=>r.cl===i,apply:()=>{F.cl=[i];changed();}});});
  obs('p-si-tb',[g.length?`Maior classificação: <b>${esc(D.cls[g[0][0]])}</b> (${pct(g[0][1]/T,0)}).`:'',g.length>1?`As 3 maiores somam ${pct(g.slice(0,3).reduce((s,x)=>s+x[1],0)/T,0)} da despesa da Sintta no recorte.`:'']);
};

const LC={q:'',k:'m',d:1,p:0};
$('#lc-q').addEventListener('input',e=>{LC.q=e.target.value.trim().toLowerCase();LC.p=0;R.lancamentos();syncFilters();});
R.lancamentos=()=>{
  let rs=rows();if(LC.q)rs=rs.filter(r=>lcText(r).includes(LC.q));
  rs=lcSort(rs,LC);
  const T=tot(rs);$('#lc-sub').textContent=`${N0.format(rs.length)} lançamentos · ${brl(T)}${LC.q?' · busca: “'+LC.q+'”':''}`;
  const size=50,pages=Math.max(1,Math.ceil(rs.length/size));if(LC.p>=pages)LC.p=pages-1;
  $('#lc-tb').innerHTML=lcHead+'<tbody>'+(rs.slice(LC.p*size,LC.p*size+size).map(lcRow).join('')||'<tr><td class="l dim" colspan="8">Nenhum lançamento no recorte.</td></tr>')+`</tbody><tfoot><tr><td class="l" colspan="6">Total do recorte (${N0.format(rs.length)} lançamentos)</td><td>${brl(T)}</td><td></td></tr></tfoot>`;
  sortable($('#lc-tb'),LC,()=>{LC.p=0;R.lancamentos();});
  pager($('#lc-pg'),LC.p,rs.length,size,p=>{LC.p=p;R.lancamentos();$('#lc-tb').scrollIntoView({block:'start'});});
  const mx=rs.reduce((a,r)=>!a||r.v>a.v?r:a,null);const big=rs.filter(r=>r.v>=50000);
  obs('p-lc',[mx?`Maior lançamento do recorte: <b>${brl(mx.v)}</b> (${esc(fname(mx.fo))}, ${MESL[mx.m-1]}).`:'',big.length?`${big.length} lançamentos acima de R$ 50 mil somam ${pct(tot(big)/T,0)} do recorte.`:'','O relatório mostra a página atual da tabela; o CSV traz todos os lançamentos do recorte.']);
};

R.qualidade=()=>{
  kpis($('#q-kpis'),[
    {lead:1,k:'Base de lançamentos',v:brl(tot(L)),s:M_.conc&&M_.conc.ok?'bate com o card Total Despesas da aba 1':'<b>diverge da aba 1</b> (ver apontamentos)'},
    {k:'Lançamentos com valor',v:N0.format(L.length),s:`de ${N0.format(L.length+D.semValor.length)} com classificação`},
    {k:'Sem valor',v:N0.format(D.semValor.length),s:'fora de todos os totais'},
    {k:'Divergências',v:N0.format(QI.length),s:`${QI.filter(q=>q[0]==='C').length} críticas · ${QI.filter(q=>q[0]==='A').length} altas`},
  ]);
  obs('q-kpis',[M_.conc&&M_.conc.ok?`A base de lançamentos fecha ao centavo com o card Total Despesas da aba 1 (${brl(M_.conc.card)}).`:`A base soma ${brl(tot(L))} e o card Total Despesas da aba 1 mostra ${M_.conc&&M_.conc.card!=null?brl(M_.conc.card):'—'}: o painel usa a base (aba 7).`,QI.some(q=>q[0]==='C')?`${QI.filter(q=>q[0]==='C').length} ${QI.filter(q=>q[0]==='C').length>1?'divergências críticas precisam':'divergência crítica precisa'} ser ${QI.filter(q=>q[0]==='C').length>1?'corrigidas':'corrigida'} antes de usar a aba 1 em apresentações.`:'']);
  const SEV={C:'Crítica',A:'Alta',M:'Média',O:'Observação'};
  $('#q-tb').innerHTML=`<thead><tr><th class="l">Severidade</th><th class="l">Problema</th><th class="l">O que foi encontrado</th><th class="l">O que fazer</th></tr></thead><tbody>${QI.map(q=>`<tr><td class="l"><span class="pill sev-${q[0]}">${SEV[q[0]]}</span></td><td class="l" style="white-space:normal;min-width:180px;max-width:220px"><span class="nm">${esc(q[1])}</span></td><td class="wrap l" style="min-width:320px;max-width:520px;font-size:12.5px">${esc(q[2])}</td><td class="wrap l" style="min-width:200px;max-width:280px;font-size:12.5px;color:var(--ink-2)">${esc(q[3])}</td></tr>`).join('')}</tbody>`;
  obs('p-q-tb',[QI.length?'Prioridade: '+QI.filter(q=>q[0]==='C'||q[0]==='A').slice(0,4).map(q=>esc(q[1]).toLowerCase()).join('; ')+'.':'Nenhum apontamento nesta carga.']);
  $('#q-sv').innerHTML=`<thead><tr><th>Linha</th><th class="l">Mês</th><th class="l">Verba</th><th class="l">Classificação</th><th class="l">Fornecedor</th><th class="l">Descritivo</th><th class="l">Valor na planilha</th></tr></thead><tbody>${D.semValor.map(r=>`<tr><td class="dim">${r.row}</td><td class="l">${MES[r.m-1]}/26</td><td class="l">${esc(r.verba)}</td><td class="l">${esc(r.classif)}</td><td class="l" style="white-space:normal;max-width:220px">${esc(r.forn)}</td><td class="wrap l" style="font-size:12.5px;color:var(--ink-2)">${esc(r.desc)||'<span class="dim">—</span>'}</td><td class="l">${r.raw===''?'<span class="dim">vazio</span>':r.raw.trim()===''?'<span class="pill warn">espaço</span>':`<span class="pill warn">${esc(r.raw)}</span>`}</td></tr>`).join('')}</tbody>`;
  { const md=D.semValor.filter(r=>r.classif===MDN).length;obs('p-q-sv',[`${D.semValor.length} linhas sem valor${md?`; ${md} classificadas como Marketing Digital`:''}.`]); }
  $('#q-notes').innerHTML=`<div><h4>Como os números foram montados</h4><ul>
    <li><b>Despesas:</b> aba 7, linha a linha. O valor negativo da planilha é lido como despesa. Total de ${brl(tot(L))}${M_.conc&&M_.conc.ok?', igual ao card Total Despesas da aba 1':''}.</li>
    <li><b>Verba e classificação:</b> colunas “Verba” e “Classificação” da aba 7, como estão na planilha (revisão de 30/10/2026). Grafias que só mudam em maiúscula ou espaço são unificadas; “relacionamento” entra em “Relacionamento com o cliente” e “Exclusive praia” em “Praia Exclusive”. As colunas Classe Despesa e Sub Classificação não são usadas.</li>
    <li><b>Sintta:</b> despesa das verbas ${esc(SINTTA_VB.map(i=>VB[i]).join(' e ')||'—')}; receita e metas da aba 5.</li>
    <li><b>Mês:</b> mês da data de competência. ${[REAL_T?cap(REAL_T)+' = realizado':'',CUR_T?CUR_T+' = em curso':'',PROV_T?PROV_T+' = provisão':''].filter(Boolean).join(', ')} (pela data da atualização, ${esc(M_.geradoEm||'')}). Planilha alterada pela última vez em ${esc(M_.dataPlanilha||'—')}.</li>
    <li><b>Centro de custo:</b> coluna CC Fat.</li>
    <li><b>Imobiliárias:</b> lançamentos com classificação de imobiliária (${esc(IMOB_CL.map(i=>D.cls[i]).join(', ')||'—')}), agrupados por fornecedor. ACNO Consultoria aparece como Hub Nogueira e P e B Administrações como Paulo Miranda, conforme os descritivos dos próprios lançamentos.</li>
    <li><b>VGV:</b> aba 1 (2026), aba 2 (2025), aba 6 (empreendimento, ${EMP_T}), aba 4 (imobiliárias, ${IMOB_T}), aba 5 (Sintta). As razões com VGV só usam meses com VGV lançado.</li></ul></div>
    <div><h4>O que esta planilha não traz</h4><ul>
    <li>Despesas de 2025.</li>
    <li>Leads, MQL e SQL: sem funil não há CPL nem ROAS por canal aqui. Esses indicadores ficam no sistema DUE Marketing.</li>
    <li>Rateio de despesa por produto: o CC de faturamento é onde a nota foi lançada.</li>
    <li>Verba orçada por mês: a aba 6 só tem o acumulado de cada empreendimento.</li>
    <li>VGV de outubro, novembro e dezembro.</li></ul></div>`;
};

/* ================= IMAGEM · RELATÓRIO · PDF ================= */
const isSafari=/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent)||/iPad|iPhone|iPod/.test(navigator.userAgent);
function cleanClone(node){const c=node.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('.ph-act,.seg,.srch,.pager,.btn-out,.dr-x,.btn-rep,input,select').forEach(e=>e.remove());c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));c.querySelectorAll('.ph-tools').forEach(e=>{if(!e.children.length)e.remove();});return c;}
const STAGE_W=960;
/* Captura sempre no layout de computador: em telas estreitas, a tela é redesenhada a 960px, clonada e restaurada no mesmo ciclo (sem pintar). */
function withStage(fn){
  const sec=curSec();
  if(!sec||sec.clientWidth>=STAGE_W-60)return fn();
  const app=$('#app');app.classList.add('stage');
  try{const f=R[ST.page];if(f)f();renderDrill(false);return fn();}
  finally{app.classList.remove('stage');const f=R[ST.page];if(f)f();renderDrill(false);addCopies();}
}
function shotHost(){const h=document.createElement('div');h.className='shot-host';document.body.appendChild(h);return h;}
function shareCard(node){
  const w=Math.max(380,Math.round(node.getBoundingClientRect().width));
  const wrap=document.createElement('div');wrap.className='shot lightdoc';wrap.style.width=(w+32)+'px';
  const sec=curSec();
  wrap.innerHTML=`<div class="shot-hd"><img src="${LOGO_W}" alt=""><div><b>${esc(sec.dataset.mod)} › ${esc(sec.dataset.title)}</b><span>${esc(recorteTxt())}</span></div></div>`;
  wrap.appendChild(cleanClone(node));
  wrap.insertAdjacentHTML('beforeend',`<div class="shot-ft">DUE Incorporadora · Controle financeiro de marketing 2026 · gerado em ${esc(nowTxt())} · fonte: planilha do Financeiro</div>`);
  shotHost().appendChild(wrap);fitWide(wrap,w+32);return wrap;
}
/* se alguma tabela ainda não couber, alarga o cartão em vez de cortar colunas */
function fitWide(box,base){const ov=Math.max(0,...[...box.querySelectorAll('.scroll')].map(sc=>{const t=sc.querySelector('table');return t?t.scrollWidth-sc.clientWidth:0;}));if(ov>0)box.style.width=(base+ov+4)+'px';}
function stageReport(){const doc=document.createElement('div');doc.className='rp-doc lightdoc';doc.style.width='940px';doc.style.maxWidth='none';shotHost().appendChild(doc);withStage(()=>{doc.innerHTML=buildReport();});fitWide(doc,940);return doc;}
const dropShot=n=>{const h=n.closest('.shot-host');(h||n).remove();};
async function snap(node,opt={}){
  if(!window.htmlToImage)throw new Error('lib');
  const r=node.getBoundingClientRect();const ratio=Math.max(.6,Math.min(opt.ratio||2,Math.sqrt(15e6/Math.max(1,r.width*r.height))));
  const o={pixelRatio:ratio,backgroundColor:opt.bg||'#F2F1EC',fontEmbedCSS:FONT_CSS,cacheBust:false,style:opt.style||{}};
  if(isSafari){try{await window.htmlToImage.toCanvas(node,o);}catch(e){}}
  return window.htmlToImage.toCanvas(node,o);
}
const canvasBlob=c=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('blob')),'image/png'));
async function shareImage(makeNode,name){
  if(!window.htmlToImage){toast('O gerador de imagem ainda está carregando. Tente de novo em instantes.');return;}
  toast('Gerando imagem…',8000);
  const blobP=(async()=>{const node=makeNode();try{const c=await snap(node);return await canvasBlob(c);}finally{dropShot(node);}})();
  try{
    if(!(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem))throw new Error('noclip');
    await navigator.clipboard.write([new ClipboardItem({'image/png':blobP})]);
    toast('Imagem copiada. Cole no WhatsApp, e-mail ou apresentação.');
  }catch(e){
    let blob;try{blob=await blobP;}catch(e2){toast('Não foi possível gerar a imagem neste navegador.');return;}
    if(DL){try{await DL.save({filename:name+'.png',data:blob});toast('Imagem pronta para salvar ou compartilhar.');}catch(e3){if(e3&&e3.code==='declined'){toast('Imagem não salva.');return;}toast('Não foi possível salvar a imagem.');}}
    else toast('Este navegador não permite copiar imagens.');
  }
}
function addCopies(){$$('#pg-'+ST.page+' .panel').forEach(p=>{if(p.id==='drill')return;const ph=p.querySelector(':scope > .ph');if(!ph||ph.querySelector('.ph-act'))return;let tools=ph.querySelector(':scope > .ph-tools');if(!tools){tools=document.createElement('div');tools.className='ph-tools';[...ph.children].slice(1).forEach(c=>tools.appendChild(c));ph.appendChild(tools);}const b=document.createElement('button');b.type='button';b.className='ph-act';b.innerHTML=CAM+'Copiar imagem';b.addEventListener('click',()=>shareImage(()=>withStage(()=>shareCard(p)),'DUE_'+slug(curSec().dataset.title)+'_'+slug(p.querySelector('h2')?.textContent||'painel')));tools.appendChild(b);});}

function obsBox(id){const a=OBS[id];return a&&a.length?`<div class="rp-obs"><span>Observação</span><ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:'';}
function buildReport(){
  const sec=curSec(),title=sec.dataset.title,mod=sec.dataset.mod,desc=sec.querySelector('.page-head p')?.textContent||'';
  const mode=sec.dataset.f,fl=filterList();
  const flHtml=mode==='none'?'Esta tela não usa filtros':mode==='period'?'Só o filtro de período se aplica a esta tela':fl.length?`<span class="rp-fl">${fl.map(([k,v])=>`<i><em>${esc(k)}:</em>${esc(v)}</i>`).join('')}</span>`:'Nenhum: visão completa da base';
  let h=`<div class="rp-cover"><header class="rp-head"><img src="${LOGO_W}" alt="DUE Incorporadora"><div><span class="rp-eye">Relatório · Controle financeiro de marketing 2026</span><h1>${esc(title)}</h1><p>${esc(mod)} · ${esc(desc)}</p></div></header>
    <section class="rp-meta"><div><span>Período</span><b>${mode==='none'?'Conforme a aba 6':esc(perTxt())}</b></div><div><span>Filtros aplicados</span><b>${flHtml}</b></div><div><span>Gerado em</span><b>${esc(nowTxt())}</b></div></section></div>`;
  const blocks=[...sec.querySelectorAll('.kpis, .read, .note-box, .panel')].filter(el=>!el.parentElement.closest('.panel'));
  for(const el of blocks){
    if(el.classList.contains('panel')){
      const t=el.querySelector(':scope > .ph h2')?.textContent||'';const sb=el.querySelector(':scope > .ph p')?.textContent||'';const eye=el.querySelector(':scope > .ph .dr-eye')?.textContent||'';
      const c=cleanClone(el);c.querySelector(':scope > .ph')?.remove();
      h+=`<section class="rp-sec">${eye?`<span class="dr-eye">${esc(eye)}</span>`:''}<h2>${esc(t.replace(/\.$/,''))}<span class="dot">.</span></h2>${sb?`<p class="rp-sub">${esc(sb)}</p>`:''}<div class="rp-in">${c.innerHTML}</div>${obsBox(el.id)}</section>`;
    }else{
      const c=cleanClone(el);
      h+=`<section class="rp-sec bare">${c.outerHTML}${obsBox(el.id)}</section>`;
    }
  }
  h+=`<div class="rp-foot"><span>Fonte: CONTROLE_FINANCEIRO_MARKETING_2026 (Financeiro, planilha de ${esc(M_.dataPlanilha||'—')}) · valores em R$</span><span>DUE Incorporadora · Growth &amp; Inteligência de Dados</span></div>`;
  return h;
}
function openReport(){
  const sec=curSec();
  $('#rp-doc').innerHTML=buildReport();
  $('#rp-t').textContent='Relatório · '+sec.dataset.title;$('#rp-s').textContent=recorteTxt();
  $('#rp').hidden=false;$('#rp-body').scrollTop=0;$('#rp-x').focus();
}
function closeReport(){$('#rp').hidden=true;}
$$('.js-rep').forEach(b=>b.addEventListener('click',openReport));
$('#rp-x').addEventListener('click',closeReport);
$('#rp').addEventListener('click',e=>{if(e.target.id==='rp')closeReport();});
$('#rp-copy').addEventListener('click',()=>shareImage(stageReport,'DUE_relatorio_'+slug(curSec().dataset.title)));
$('#rp-pdf').addEventListener('click',async()=>{
  if(!window.jspdf||!window.htmlToImage){toast('O gerador de PDF ainda está carregando. Tente de novo em instantes.');return;}
  if(!DL)return;
  const btn=$('#rp-pdf'),lbl=btn.querySelector('span');btn.disabled=true;lbl.textContent='Gerando PDF…';
  let doc=null;
  try{
    doc=stageReport();
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'a4',orientation:'portrait'});
    const PW=pdf.internal.pageSize.getWidth(),PH=pdf.internal.pageSize.getHeight(),M=26,CW=PW-2*M,BOT=PH-M-14;let y=M;
    for(const b of [...doc.children]){
      const c=await snap(b,{ratio:2,bg:'#F2F1EC'});const sc=CW/c.width;const hpt=c.height*sc;
      if(hpt<=BOT-y){pdf.addImage(c.toDataURL('image/jpeg',.9),'JPEG',M,y,CW,hpt);y+=hpt+10;continue;}
      if(hpt<=BOT-M){pdf.addPage();y=M;pdf.addImage(c.toDataURL('image/jpeg',.9),'JPEG',M,y,CW,hpt);y+=hpt+10;continue;}
      const br=b.getBoundingClientRect(),k=c.width/br.width;
      /* pontos de corte seguros: bordas de linhas, gráficos e cartões que não atravessam nenhum outro elemento */
      const HD='h2,h3,.legend,.ph,.rp-obs>span,.dr-tools,thead tr';
      const atoms=[...b.querySelectorAll('tr,.chart,.brow,.kpi,.dk>div,.legend,.rp-obs li,.rp-obs>span,.cnote,h2,h3,.stack100,.dr-tools,.ph,.note-box,.read li')].map(e=>{const r=e.getBoundingClientRect();return [Math.round((r.top-br.top)*k),Math.round((r.bottom-br.top)*k),e.matches(HD)];});
      const cuts=[...new Set(atoms.flatMap(([t,u,h])=>h?[t]:[t,u]))].filter(v=>v>0&&v<c.height&&!atoms.some(([t,u,h])=>(t<v-2&&u>v+2)||(h&&u<=v+2&&u>v-28))).sort((p,q)=>p-q);
      let sy=0;while(sy<c.height){let avail=BOT-y;if(avail<90){pdf.addPage();y=M;avail=BOT-M;}let end=sy+Math.floor(avail/sc);if(end<c.height){const ok=cuts.filter(v=>v>sy+60&&v<=end);if(ok.length)end=ok[ok.length-1];}const sh=Math.min(c.height,end)-sy;const t=document.createElement('canvas');t.width=c.width;t.height=sh;t.getContext('2d').drawImage(c,0,sy,c.width,sh,0,0,c.width,sh);pdf.addImage(t.toDataURL('image/jpeg',.9),'JPEG',M,y,CW,sh*sc);y+=sh*sc+6;sy+=sh;}
      y+=4;
    }
    const n=pdf.getNumberOfPages();const ttl=curSec().dataset.title;
    for(let i=1;i<=n;i++){pdf.setPage(i);pdf.setFontSize(8);pdf.setTextColor(124,142,150);pdf.text(`DUE Incorporadora | Relatório ${ttl} | página ${i} de ${n}`,M,PH-12);}
    await DL.save({filename:`DUE_relatorio_${slug(ttl)}_${MES[F.m0-1]}-${MES[F.m1-1]}_2026.pdf`,data:pdf.output('blob')});toast('PDF pronto.');
  }catch(e){if(!(e&&e.code==='declined'))toast('Não foi possível gerar o PDF.');}
  finally{if(doc)dropShot(doc);btn.disabled=false;lbl.textContent='Baixar PDF';}
});

/* ================= NAVEGAÇÃO ================= */
const app=$('#app');const PAGES={};$$('.page').forEach(p=>{PAGES[p.id.replace('pg-','')]=p;});
const DEF='visao';
function render(){const f=R[ST.page];if(f){hideTip();f();renderDrill(false);addCopies();}}
function setPage(id,push=true){
  if(!PAGES[id])id=DEF;ST.page=id;save();if(DR.open&&DR.page!==id)closeDrill();
  Object.entries(PAGES).forEach(([k,s])=>{s.hidden=k!==id;});
  const sec=PAGES[id],gf=$('#gf');
  if(sec.dataset.f==='none'){gf.hidden=true;}else{gf.hidden=false;sec.querySelector('.gf-slot').appendChild(gf);gf.classList.toggle('p-only',sec.dataset.f==='period');gf.classList.toggle('no-vb',!!(FIX[id]&&FIX[id].vb));}
  $('#crumbMod').textContent=sec.dataset.mod;$('#crumbPage').textContent=sec.dataset.title;
  $$('.sub a,.fly a,.brand').forEach(a=>{if(a.dataset.page===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  $$('.mod').forEach(m=>{const own=!!m.querySelector(`.sub a[data-page="${id}"]`);m.classList.toggle('active',own);if(own)openMod(m,true);});
  app.classList.remove('nav-open');
  if(push&&location.hash!=='#'+id)location.hash=id;
  $('.content').scrollTop=0;syncFilters();requestAnimationFrame(render);
}
function openMod(m,o){m.classList.toggle('open',o);m.querySelector('.mod-btn').setAttribute('aria-expanded',o?'true':'false');}
$$('.mod').forEach(m=>m.querySelector('.mod-btn').addEventListener('click',()=>{if(app.classList.contains('rail')&&innerWidth>940){setPage(m.dataset.first);return;}openMod(m,!m.classList.contains('open'));}));
document.addEventListener('click',e=>{const a=e.target.closest('a[data-page]');if(!a)return;e.preventDefault();setPage(a.dataset.page);});
window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(id&&id!==ST.page)setPage(id,false);});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){Object.values(DDS).forEach(d=>d.open(false));app.classList.remove('nav-open');if(!$('#rp').hidden)closeReport();}});
function setRail(on){ST.rail=on;save();app.classList.toggle('rail',on);$('#railBtn').setAttribute('aria-label',on?'Expandir menu lateral':'Recolher menu lateral');setTimeout(render,240);}
$('#railBtn').addEventListener('click',()=>setRail(!ST.rail));
$('#navOpen').addEventListener('click',()=>app.classList.add('nav-open'));
$('#navClose').addEventListener('click',()=>app.classList.remove('nav-open'));
$('#scrim').addEventListener('click',()=>app.classList.remove('nav-open'));
$$('#v-evo-seg button').forEach(b=>b.addEventListener('click',()=>{$$('#v-evo-seg button').forEach(x=>x.setAttribute('aria-pressed',x===b));R.visao();}));
const SUN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>';
const MOON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.2A8.3 8.3 0 0 1 9.8 3.6a8.3 8.3 0 1 0 10.6 10.6z"/></svg>';
const eff=()=>document.documentElement.dataset.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function paintTheme(){const b=$('#themeBtn'),e=eff();b.innerHTML=e==='dark'?SUN:MOON;b.title=e==='dark'?'Mudar para o tema claro':'Mudar para o tema escuro';}
$('#themeBtn').addEventListener('click',()=>{const n=eff()==='dark'?'light':'dark';document.documentElement.dataset.theme=n;ST.theme=n;save();paintTheme();});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',paintTheme);paintTheme();
let rz;window.addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(render,150);});
setRail(!!ST.rail);
const hp=location.hash.slice(1);
setPage(PAGES[hp]?hp:(PAGES[ST.page]?ST.page:DEF),!PAGES[hp]);
})();
