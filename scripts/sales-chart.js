(function(root){
 const NS='http://www.w3.org/2000/svg';
 const series=[{key:'ordered',label:'Ordered'},{key:'sold',label:'Estimated sold'}];
 const hidden=new Set();
 const el=(tag,attrs={},parent)=>{const node=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));if(parent)parent.append(node);return node;};
 const niceMax=value=>{const step=Math.pow(10,Math.floor(Math.log10(Math.max(1,value))));return [1,2,2.5,5,10].map(m=>m*step).find(m=>m>=value)||10*step;};
 // Rounded top corners only, so bars sit flat on the baseline.
 const barPath=(x,y,w,h,r)=>{r=Math.min(r,w/2,h);return `M${x},${y+h}V${y+r}Q${x},${y} ${x+r},${y}H${x+w-r}Q${x+w},${y} ${x+w},${y+r}V${y+h}Z`;};
 const wrap=(name,width)=>{const lines=[];name.split(' ').forEach(word=>{const last=lines[lines.length-1];if(last&&(last+' '+word).length<=width)lines[lines.length-1]=last+' '+word;else lines.push(word);});return lines.slice(0,3);};
 function render(container,products,{onScale}={}){
  container.replaceChildren();
  const legend=document.createElement('div');legend.className='sales-legend';legend.setAttribute('role','group');legend.setAttribute('aria-label','Chart series');
  const stage=document.createElement('div');stage.className='sales-stage';
  const tooltip=document.createElement('div');tooltip.className='sales-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','status');
  container.append(legend,stage);stage.append(tooltip);
  const visible=series.filter(s=>!hidden.has(s.key));
  const maximum=niceMax(Math.max(1,...products.flatMap(p=>visible.map(s=>p[s.key]||0))));
  if(onScale)onScale(maximum);
  series.forEach(s=>{
   const button=document.createElement('button');button.type='button';button.className='sales-legend-item '+s.key;
   button.setAttribute('aria-pressed',String(!hidden.has(s.key)));
   const swatch=document.createElement('span');swatch.className='sales-swatch';swatch.setAttribute('aria-hidden','true');
   button.append(swatch,s.label);
   button.addEventListener('mouseenter',()=>svg.dataset.focus=s.key);
   button.addEventListener('mouseleave',()=>delete svg.dataset.focus);
   button.addEventListener('click',()=>{if(hidden.has(s.key))hidden.delete(s.key);else if(visible.length>1)hidden.add(s.key);render(container,products,{onScale});});
   legend.append(button);
  });
  const band=72,margin={top:16,right:12,bottom:58,left:44},height=240;
  const width=margin.left+margin.right+band*products.length;
  const svg=el('svg',{viewBox:`0 0 ${width} ${height+margin.top+margin.bottom}`,class:'sales-svg',role:'img','aria-label':'Ordered and estimated sold pastries by product'});
  stage.prepend(svg);
  const y=value=>margin.top+height-(value/maximum)*height;
  const grid=el('g',{class:'sales-grid'},svg);
  for(let i=0;i<=4;i++){
   const value=maximum*i/4,top=y(value);
   el('line',{x1:margin.left,x2:width-margin.right,y1:top,y2:top,class:i?'':'baseline'},grid);
   el('text',{x:margin.left-8,y:top+4,'text-anchor':'end'},grid).textContent=Number.isInteger(value)?value.toLocaleString():value.toFixed(1);
  }
  const barWidth=visible.length>1?20:30,gap=4;
  products.forEach((product,index)=>{
   const left=margin.left+band*index;
   const group=el('g',{class:'sales-group',tabindex:'0','aria-label':`${product.name}: ordered ${product.ordered}, estimated sold ${product.sold===null?'unknown':product.sold}`},svg);
   el('rect',{class:'sales-hover',x:left+3,y:margin.top-6,width:band-6,height:height+6,rx:6},group);
   const total=visible.length*barWidth+(visible.length-1)*gap;
   visible.forEach((s,i)=>{
    const value=product[s.key],x=left+(band-total)/2+i*(barWidth+gap);
    if(value===null){el('line',{x1:x+4,x2:x+barWidth-4,y1:y(0)-2,y2:y(0)-2,class:'sales-unknown '+s.key},group);return;}
    const h=Math.max(value?2:0,height*value/maximum);
    const bar=el('path',{d:barPath(x,y(0)-h,barWidth,h,4),class:'sales-bar '+s.key},group);
    bar.style.animationDelay=`${index*30+i*60}ms`;
   });
   const label=el('text',{class:'sales-label',x:left+band/2,y:margin.top+height+18,'text-anchor':'middle'},group);
   wrap(product.name,11).forEach((line,i)=>{const t=el('tspan',{x:left+band/2,dy:i?13:0},label);t.textContent=line;});
   const show=()=>{
    svg.classList.add('is-hovering');group.classList.add('active');
    tooltip.replaceChildren();
    const title=document.createElement('strong');title.textContent=product.name;tooltip.append(title);
    series.filter(s=>!hidden.has(s.key)).forEach(s=>{
     const row=document.createElement('div');row.className='sales-tooltip-row '+s.key;
     const name=document.createElement('span');name.textContent=s.label;
     const value=document.createElement('b');value.textContent=product[s.key]===null?'Unknown':product[s.key].toLocaleString();
     row.append(name,value);tooltip.append(row);
    });
    const note=document.createElement('small');note.textContent=product.covered?`Sales: ${product.covered}/7 days recorded`:'Sales not yet known';tooltip.append(note);
    tooltip.hidden=false;
    const box=svg.getBoundingClientRect(),scale=box.width/width;
    // Sit beside the hovered band so the bars stay visible; flip left near the edge.
    const tipWidth=tooltip.offsetWidth,right=(left+band-3)*scale+8,flipped=(left+3)*scale-tipWidth-8;
    tooltip.style.left=`${right+tipWidth<=box.width?right:Math.max(0,flipped)}px`;
    tooltip.style.top=`${margin.top*scale}px`;
   };
   const hide=()=>{svg.classList.remove('is-hovering');group.classList.remove('active');tooltip.hidden=true;};
   group.addEventListener('mouseenter',show);group.addEventListener('focus',show);
   group.addEventListener('mouseleave',hide);group.addEventListener('blur',hide);
  });
 }
 root.SalesChart={render};
})(window);
