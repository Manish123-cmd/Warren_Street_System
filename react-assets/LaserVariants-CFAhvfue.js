import{i as e,n as t,r as n}from"./main-D_lyC9SF.js";var r=e(n(),1),i=t(),a=`
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,o=`
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_variant;
uniform float u_size;
uniform float u_length;
uniform float u_density;
uniform float u_hue;
uniform float u_saturation;
uniform float u_brightness;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float result = 0.0;
  float weight = 0.54;
  for (int i = 0; i < 4; i++) {
    result += valueNoise(p) * weight;
    p = mat2(1.62, 1.21, -1.21, 1.62) * p + 9.13;
    weight *= 0.48;
  }
  return result;
}

vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(0.0, 0.6666667, 0.3333333)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

vec3 accent(float baseHue, float saturationScale) {
  float hue = fract(baseHue + u_hue / 360.0);
  return hsv2rgb(vec3(hue, clamp(u_saturation * saturationScale, 0.0, 1.0), 1.0));
}

vec2 laserProfile(float distanceToLine, float coreWidth, float glowWidth) {
  float core = exp(-pow(distanceToLine / max(coreWidth, 0.0002), 2.0));
  float glow = exp(-pow(distanceToLine / max(glowWidth, 0.001), 1.25));
  return vec2(core, glow);
}

vec3 atmosphericBlade(vec2 p) {
  float drift = sin(u_time * 0.21) * 0.025;
  float center = u_pointer.x * 0.16 + drift;
  float tilt = u_pointer.x * 0.055 + sin(u_time * 0.13) * 0.018;
  float distanceToBeam = abs(p.x - center - p.y * tilt);
  float verticalMask = 1.0 - smoothstep(0.68 * u_length, 1.35 * u_length, abs(p.y));
  vec2 beam = laserProfile(distanceToBeam, 0.0028 * u_size, 0.052 * u_size);

  vec2 fogUv = vec2(p.x * 3.4, p.y * 2.15 - u_time * 0.075);
  fogUv.x += sin(p.y * 3.2 - u_time * 0.17) * 0.18;
  float fogNoise = fbm(fogUv + u_pointer * 0.35);
  float fogEnvelope = exp(-pow(distanceToBeam / (0.24 * u_size), 1.35));
  float fog = smoothstep(0.34, 0.78, fogNoise) * fogEnvelope * u_density * verticalMask;

  float mirageDistance = abs(abs(p.x - center + p.y * tilt * 0.35) - 0.105 * u_length);
  vec2 mirage = laserProfile(mirageDistance, 0.0011 * u_size, 0.016 * u_size);
  float mirageMask = (1.0 - smoothstep(0.08, 1.2, abs(p.y))) * (0.35 + 0.65 * fogNoise);

  vec3 tint = accent(0.43, 0.82);
  vec3 color = vec3(0.0025, 0.004, 0.006);
  color += tint * fog * 0.34;
  color += tint * beam.y * verticalMask * (0.48 + 0.06 * sin(u_time * 1.1));
  color += mix(tint, vec3(1.0), 0.88) * beam.x * verticalMask * 1.65;
  color += tint * mirage.y * mirageMask * 0.12 * u_density;
  color += vec3(0.8, 0.98, 0.9) * mirage.x * mirageMask * 0.35 * u_density;

  float contact = exp(-length(vec2((p.x - center) * 2.5, p.y + 0.77 * u_length)) * 7.0);
  color += tint * contact * 0.45;
  return color;
}

vec3 vanishingArray(vec2 p) {
  vec2 origin = vec2(u_pointer.x * 0.16, 0.12 + u_pointer.y * 0.075);
  vec2 q = p - origin;
  float radius = length(q);
  float angle = atan(q.y, q.x);
  float spokeCount = floor(11.0 + u_density * 10.0);
  float angularDistance = abs(sin(angle * spokeCount));
  float spoke = exp(-angularDistance * max(radius, 0.06) / (0.0075 * u_size));
  float reach = smoothstep(0.035, 0.16, radius) * (1.0 - smoothstep(0.42 * u_length, 1.55 * u_length, radius));
  float lowerField = 1.0 - smoothstep(-0.12, 0.22, q.y);
  float upperField = smoothstep(0.02, 0.52, q.y) * 0.48;
  float fieldMask = max(lowerField, upperField);

  float carrier = 0.55 + 0.45 * sin(radius * 16.0 - u_time * 4.1 + angle * 2.0);
  carrier = pow(max(carrier, 0.0), 7.0);
  float rail = spoke * reach * fieldMask;
  float railCore = pow(rail, 2.1);

  float ringPhase = abs(sin((radius * 13.0 - u_time * 1.5) / max(u_length, 0.35)));
  float rings = exp(-ringPhase / (0.035 * u_size)) * (1.0 - smoothstep(0.1, 1.2, radius)) * lowerField;
  float horizon = exp(-abs(q.y) / (0.0035 * u_size)) * (1.0 - smoothstep(0.12, 1.15, abs(q.x)));

  vec3 violet = accent(0.70, 0.78);
  vec3 amber = accent(0.055, 0.84);
  vec3 railTint = mix(violet, amber, 0.5 + 0.5 * sin(angle * 3.0));
  vec3 color = vec3(0.004, 0.0035, 0.009);
  color += railTint * rail * (0.24 + carrier * 0.72);
  color += mix(railTint, vec3(1.0), 0.9) * railCore * (0.52 + carrier * 0.92);
  color += violet * rings * 0.14 * u_density;
  color += vec3(0.82, 0.9, 1.0) * horizon * 0.38;
  color += violet * exp(-radius * 15.0) * 0.95;
  return color;
}

vec3 prismAperture(vec2 p) {
  vec2 center = u_pointer * vec2(0.12, 0.08);
  vec2 q = p - center;
  float breathing = 0.46 * u_length + sin(u_time * 0.72) * 0.012;
  float warp = (fbm(q * 3.2 + vec2(0.0, -u_time * 0.08)) - 0.5) * 0.025 * u_density;
  float diamond = abs(q.x * 0.82) + abs(q.y) - breathing - warp;
  float innerDiamond = abs(q.x * 0.82) + abs(q.y) - breathing * 0.66 + warp * 0.45;
  vec2 outer = laserProfile(abs(diamond), 0.0024 * u_size, 0.046 * u_size);
  vec2 inner = laserProfile(abs(innerDiamond), 0.0012 * u_size, 0.018 * u_size);

  float edgeMask = 1.0 - smoothstep(0.25, 1.18, length(q));
  float perimeterPhase = sin((q.x - q.y) * 15.0 - u_time * 3.3);
  float packets = pow(max(perimeterPhase, 0.0), 10.0) * outer.y;
  float axisX = exp(-abs(q.x) / (0.002 * u_size)) * (1.0 - smoothstep(0.04, breathing, abs(q.y)));
  float axisY = exp(-abs(q.y) / (0.002 * u_size)) * (1.0 - smoothstep(0.04, breathing, abs(q.x)));

  float redFringe = exp(-pow(abs(diamond - 0.011 * u_size) / (0.011 * u_size), 1.4));
  float blueFringe = exp(-pow(abs(diamond + 0.011 * u_size) / (0.011 * u_size), 1.4));
  vec3 tint = accent(0.79, 0.8);
  vec3 color = vec3(0.004, 0.0025, 0.007);
  color += tint * outer.y * edgeMask * 0.5;
  color += mix(tint, vec3(1.0), 0.9) * outer.x * edgeMask * 1.5;
  color += tint * inner.y * edgeMask * 0.18 * u_density;
  color += vec3(1.0) * inner.x * edgeMask * 0.48 * u_density;
  color += accent(0.98, 0.92) * redFringe * 0.13;
  color += accent(0.54, 0.9) * blueFringe * 0.16;
  color += vec3(0.92, 0.96, 1.0) * (axisX + axisY) * 0.2;
  color += tint * packets * 0.85;
  color += tint * exp(-length(q) * 9.0) * 0.22;
  return color;
}

vec3 halftoneRelay(vec2 p) {
  float center = 0.29 + u_pointer.x * 0.12;
  float bend = sin(p.y * 2.1 - u_time * 0.25) * 0.018;
  float mainDistance = abs(p.x - center - bend);
  float relayDistance = abs(p.x - center + 0.075 * u_length + bend * 0.45);
  vec2 mainBeam = laserProfile(mainDistance, 0.0022 * u_size, 0.072 * u_size);
  vec2 relayBeam = laserProfile(relayDistance, 0.0012 * u_size, 0.025 * u_size);

  vec2 fogUv = vec2(p.x * 3.0, p.y * 2.5 - u_time * 0.1);
  float fogNoise = fbm(fogUv + vec2(sin(u_time * 0.16), 0.0));
  float fog = smoothstep(0.28, 0.78, fogNoise) * exp(-mainDistance * 9.5 / u_size) * u_density;

  float dotScale = mix(9.0, 4.5, clamp((u_density - 0.25) / 2.25, 0.0, 1.0));
  vec2 dotCell = fract(gl_FragCoord.xy / dotScale) - 0.5;
  float dot = 1.0 - smoothstep(0.08, 0.34, length(dotCell));
  float dotMask = dot * smoothstep(0.08, 0.68, fog + mainBeam.y * 0.65);

  float pulse = pow(max(0.0, sin(p.y * 9.0 - u_time * 4.0)), 12.0);
  float horizontalRelay = exp(-abs(p.y + 0.34 - u_pointer.y * 0.08) / (0.0024 * u_size));
  horizontalRelay *= 1.0 - smoothstep(0.1, 1.05 * u_length, abs(p.x - center));

  vec3 tint = accent(0.54, 0.84);
  vec3 color = vec3(0.002, 0.005, 0.009);
  color += tint * fog * 0.24;
  color += tint * mainBeam.y * 0.54;
  color += mix(tint, vec3(1.0), 0.9) * mainBeam.x * 1.48;
  color += tint * relayBeam.y * 0.2;
  color += vec3(0.78, 0.95, 1.0) * relayBeam.x * 0.5;
  color += tint * dotMask * (0.3 + pulse * 0.42);
  color += mix(tint, vec3(1.0), 0.8) * horizontalRelay * (0.22 + pulse * 0.58);
  return color;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec3 color;

  if (u_variant < 0.5) {
    color = atmosphericBlade(p);
  } else if (u_variant < 1.5) {
    color = vanishingArray(p);
  } else if (u_variant < 2.5) {
    color = prismAperture(p);
  } else {
    color = halftoneRelay(p);
  }

  float vignette = 1.0 - smoothstep(0.24, 1.45, length(p * vec2(0.72, 0.88)));
  color *= 0.55 + vignette * 0.45;
  color *= u_brightness;
  color = color / (color + vec3(0.72));
  color = pow(max(color, vec3(0.0)), vec3(0.82));
  gl_FragColor = vec4(color, 1.0);
}
`,s={variant:`atmospheric-blade`,speed:1,size:1,length:1,density:1,opacity:1,hue:0,saturation:1,brightness:1},c={"atmospheric-blade":0,"vanishing-array":1,"prism-aperture":2,"halftone-relay":3};function l(e,t,n){return Math.min(n,Math.max(t,e))}function u(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Unable to create Laser shader`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)??`Laser shader compilation failed`;throw e.deleteShader(r),Error(t)}return r}function d({className:e=``,style:t,...n}){let d=(0,r.useRef)(null),f=(0,r.useRef)(null),p=(0,r.useRef)(()=>{}),m=(0,r.useRef)({...s,...n});m.current={...s,...n},(0,r.useEffect)(()=>{let e=d.current,t=f.current;if(!e||!t)return;let n=t.getContext(`webgl`,{alpha:!1,antialias:!1,powerPreference:`high-performance`,premultipliedAlpha:!1});if(!n)return;let r=u(n,n.VERTEX_SHADER,a),i=u(n,n.FRAGMENT_SHADER,o),h=n.createProgram();if(!h){n.deleteShader(r),n.deleteShader(i);return}if(n.attachShader(h,r),n.attachShader(h,i),n.linkProgram(h),!n.getProgramParameter(h,n.LINK_STATUS)){let e=n.getProgramInfoLog(h)??`Laser program link failed`;throw n.deleteProgram(h),n.deleteShader(r),n.deleteShader(i),Error(e)}let g=n.createBuffer();n.bindBuffer(n.ARRAY_BUFFER,g),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),n.STATIC_DRAW),n.useProgram(h);let _=n.getAttribLocation(h,`a_position`);n.enableVertexAttribArray(_),n.vertexAttribPointer(_,2,n.FLOAT,!1,0,0);let v={resolution:n.getUniformLocation(h,`u_resolution`),pointer:n.getUniformLocation(h,`u_pointer`),time:n.getUniformLocation(h,`u_time`),variant:n.getUniformLocation(h,`u_variant`),size:n.getUniformLocation(h,`u_size`),length:n.getUniformLocation(h,`u_length`),density:n.getUniformLocation(h,`u_density`),hue:n.getUniformLocation(h,`u_hue`),saturation:n.getUniformLocation(h,`u_saturation`),brightness:n.getUniformLocation(h,`u_brightness`)},y=window.matchMedia(`(prefers-reduced-motion: reduce)`),b=y.matches,x=0,S=!0,C=0,w=0,T=0,E=0,D=performance.now(),O=e=>{let r=m.current,i=r.variant in c?r.variant:s.variant;T+=(C-T)*(b?1:.055),E+=(w-E)*(b?1:.055),n.useProgram(h),n.uniform2f(v.resolution,t.width,t.height),n.uniform2f(v.pointer,T,E),n.uniform1f(v.time,b?2.75:(e-D)*.001*l(r.speed,0,3)),n.uniform1f(v.variant,c[i]),n.uniform1f(v.size,l(r.size,.35,2.5)),n.uniform1f(v.length,l(r.length,.35,2.5)),n.uniform1f(v.density,l(r.density,.25,2.5)),n.uniform1f(v.hue,l(r.hue,-180,180)),n.uniform1f(v.saturation,l(r.saturation,0,2)),n.uniform1f(v.brightness,l(r.brightness,.35,1.65)),n.drawArrays(n.TRIANGLES,0,6)},k=()=>{!b&&S&&!document.hidden&&!x&&(x=window.requestAnimationFrame(A))};function A(e){x=0,O(e),k()}let j=()=>{b||!S||document.hidden?(x&&window.cancelAnimationFrame(x),x=0,O(performance.now())):k()};p.current=()=>O(performance.now());let M=()=>{let r=e.getBoundingClientRect(),i=Math.min(window.devicePixelRatio||1,1.5);t.width=Math.max(1,Math.round(r.width*i)),t.height=Math.max(1,Math.round(r.height*i)),n.viewport(0,0,t.width,t.height),O(performance.now())},N=t=>{let n=e.getBoundingClientRect();C=(t.clientX-n.left)/Math.max(1,n.width)*2-1,w=-((t.clientY-n.top)/Math.max(1,n.height)*2-1),b&&O(performance.now())},P=()=>{C=0,w=0,b&&O(performance.now())},F=e=>{b=e.matches,j()},I=new ResizeObserver(M),L=new IntersectionObserver(([e])=>{S=e?.isIntersecting??!0,j()});return I.observe(e),L.observe(e),e.addEventListener(`pointermove`,N,{passive:!0}),e.addEventListener(`pointerleave`,P,{passive:!0}),document.addEventListener(`visibilitychange`,j),y.addEventListener(`change`,F),M(),j(),()=>{x&&window.cancelAnimationFrame(x),I.disconnect(),L.disconnect(),e.removeEventListener(`pointermove`,N),e.removeEventListener(`pointerleave`,P),document.removeEventListener(`visibilitychange`,j),y.removeEventListener(`change`,F),p.current=()=>{},n.deleteBuffer(g),n.deleteShader(r),n.deleteShader(i),n.deleteProgram(h)}},[]),(0,r.useEffect)(()=>{p.current()},[n.variant,n.speed,n.size,n.length,n.density,n.hue,n.saturation,n.brightness]);let h=l(m.current.opacity,.05,1);return(0,i.jsx)(`div`,{ref:d,className:`threeui-background laser-variant${e?` ${e}`:``}`,style:{background:`#020305`,...t},children:(0,i.jsx)(`canvas`,{ref:f,"aria-hidden":`true`,style:{opacity:h,pointerEvents:`none`}})})}export{d as LaserVariants};