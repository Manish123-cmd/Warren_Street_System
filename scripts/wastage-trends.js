(function(root){
 const NS='http://www.w3.org/2000/svg',W=220,H=56,PAD=4;
 const el=(tag,attrs={},parent)=>{const node=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));if(parent)parent.append(node);return node;};
 const html=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 const label=date=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
 const cards=[
  {key:'total',title:'Pastries wasted',kind:'area',format:v=>v.toLocaleString()},
  {key:'rate',title:'Wastage rate',kind:'line',format:v=>v.toFixed(1)+'%',empty:'Needs 10 AM preparation records'},
  {key:'products',title:'Pastries with wastage',kind:'bars',format:v=>`${v}`,suffix:' / 16'}
 ];
 // Compare a day with the closest earlier recorded day; less wastage is the good direction.
 function change(points,index){
  const value=points[index].value;
  for(let i=index-1;i>=0;i--){
   const previous=points[i].value;if(previous===null)continue;
   if(previous===value)return {text:'No change',tone:'flat'};
   const up=value>previous,arrow=up?'↑':'↓';
   return {text:previous?`${arrow} ${Math.abs((value-previous)/previous*100).toFixed(1)}%`:`${arrow} from 0`,tone:up?'bad':'good',detail:`vs ${label(points[i].date)}`};
  }
  return {text:'First record',tone:'flat'};
 }
 function card(spec,days){
  const points=days.map(day=>({date:day.date,value:day[spec.key]}));
  const known=points.map((p,i)=>p.value===null?-1:i).filter(i=>i>=0);
  const node=html('article','trend-card '+spec.key);
  const head=html('div','trend-head');const title=html('span','trend-title',spec.title),day=html('span','trend-day');head.append(title,day);
  const figure=html('div','trend-figure');const value=html('strong','trend-value'),delta=html('span','trend-delta');figure.append(value,delta);
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,class:'trend-spark',preserveAspectRatio:'none','aria-hidden':'true'});
  node.append(head,figure,svg);
  const show=index=>{
   if(index<0){day.textContent='No records';value.textContent='—';delta.textContent=spec.empty||'';delta.className='trend-delta flat';return;}
   const point=points[index],diff=change(points,index);
   day.textContent=label(point.date);value.textContent=spec.format(point.value);
   if(spec.suffix)value.append(html('small','',spec.suffix));
   delta.textContent=diff.text;delta.className='trend-delta '+diff.tone;delta.title=diff.detail||'';
   svg.querySelectorAll('.active').forEach(n=>n.classList.remove('active'));
   svg.querySelector(`[data-index="${index}"]`)?.classList.add('active');
  };
  const latest=known.length?known[known.length-1]:-1;
  node.setAttribute('aria-label',`${spec.title}: ${latest<0?'no records':spec.format(points[latest].value)+' on '+label(points[latest].date)}`);
  if(known.length){
   const step=(W-PAD*2)/(points.length-1),max=Math.max(...known.map(i=>points[i].value),spec.key==='rate'?1:1);
   const x=i=>PAD+i*step,y=v=>H-PAD-(v/max)*(H-PAD*2);
   if(spec.kind==='bars'){
    const width=step*.68;
    points.forEach((p,i)=>{
     const h=p.value===null?0:Math.max(2,(p.value/max)*(H-PAD*2));
     el('rect',{class:p.value===null?'trend-bar missing':'trend-bar',x:x(i)-width/2,y:p.value===null?H-PAD-2:H-PAD-h,width,height:p.value===null?2:h,rx:1.5,'data-index':i},svg);
    });
   }else{
    const line=known.map((i,n)=>`${n?'L':'M'}${x(i)},${y(points[i].value)}`).join('');
    if(spec.kind==='area'){
     const id='trend-fill-'+spec.key;
     const gradient=el('linearGradient',{id,x1:0,x2:0,y1:0,y2:1},el('defs',{},svg));
     el('stop',{offset:'0','stop-color':'currentColor','stop-opacity':'.28'},gradient);el('stop',{offset:'1','stop-color':'currentColor','stop-opacity':'0'},gradient);
     el('path',{d:`${line}L${x(known[known.length-1])},${H}L${x(known[0])},${H}Z`,fill:`url(#${id})`},svg);
    }
    el('path',{d:line,class:'trend-line','vector-effect':'non-scaling-stroke'},svg);
    known.forEach(i=>el('circle',{class:'trend-dot'+(i===latest&&spec.kind==='line'?' end':''),cx:x(i),cy:y(points[i].value),r:2.5,'data-index':i},svg));
   }
   // Hover targets cover each day's column so any day can be compared.
   points.forEach((p,i)=>{
    const hit=el('rect',{class:'trend-hit',x:x(i)-step/2,y:0,width:step,height:H},svg);
    hit.addEventListener('mouseenter',()=>{if(p.value!==null)show(i);});
   });
   svg.addEventListener('mouseleave',()=>show(latest));
  }
  show(latest);
  return node;
 }
 function render(container,days){container.replaceChildren(...cards.map(spec=>card(spec,days)));}
 root.WastageTrends={render,change};
 if(typeof module!=='undefined')module.exports=root.WastageTrends;
})(typeof window==='undefined'?globalThis:window);
