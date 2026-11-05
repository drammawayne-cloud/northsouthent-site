import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp=THREE.MathUtils.clamp, mix=THREE.MathUtils.lerp;
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const asset=n=>new URL(n,import.meta.url).href;
const SEEN='ns-cinema-compass-v1';
const safeGet=k=>{try{return sessionStorage.getItem(k)}catch{return null}};
const safeSet=(k,v)=>{try{sessionStorage.setItem(k,v)}catch{}};

export async function startIntro(intro) {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let closed=false, renderer, frame, started=0, audio, soundSources=[], master, audioPromise,resize;
 const root=document.documentElement;
 const finish=()=>{if(closed)return;closed=true;cancelAnimationFrame(frame);if(resize)removeEventListener('resize',resize);clearTimeout(watchdog);intro.classList.add('hidden');root.classList.remove('cinema-active');document.querySelectorAll('body > .header,body > main,body > .footer').forEach(e=>e.inert=false);root.classList.add('cinema-arrived');safeSet(SEEN,'yes');for(const s of soundSources){try{s.stop()}catch{}}if(audio)audio.close().catch(()=>{});setTimeout(()=>{if(renderer){renderer.dispose();renderer.domElement.remove()}intro.hidden=true;root.classList.remove('cinema-arrived')},1100);document.removeEventListener('keydown',onKey)};
 const onKey=e=>{if(e.key==='Escape')finish()};
 const watchdog=setTimeout(finish,14000);
 const replay=new URL(location.href).searchParams.get('intro')==='1';
 if((safeGet(SEEN)&&!replay)||reduced){finish();return}
 intro.hidden=false;root.classList.add('cinema-active');document.querySelectorAll('body > .header,body > main,body > .footer').forEach(e=>e.inert=true);intro.classList.add('cinema-intro');
 intro.innerHTML='<div class="cinema-fallback"><img src="assets/logo-transparent.webp" width="360" height="240" alt="North South Entertainment"></div><div class="cinema-vignette" aria-hidden="true"></div><div class="cinema-caption"><span>NORTH SOUTH ENTERTAINMENT</span><small>A WORLD OF POSSIBILITIES</small></div><div class="cinema-controls"><button type="button" id="intro-sound" aria-pressed="false">◖ Sound on</button><button type="button" id="intro-skip">Skip intro ↗</button></div>';
 const sound=intro.querySelector('#intro-sound');
 intro.querySelector('#intro-skip').addEventListener('click',finish);document.addEventListener('keydown',onKey);
 async function playSound(){
  try {
   if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();master=audio.createGain();master.gain.value=.6;master.connect(audio.destination)}
   await audio.resume();if(audio.state!=='running')return;
   audioPromise ||= fetch(asset('jaguar-call.m4a')).then(r=>{if(!r.ok)throw Error('audio');return r.arrayBuffer()}).then(b=>audio.decodeAudioData(b));
   const buffer=await audioPromise;if(closed)return;
   for(const s of soundSources){try{s.stop()}catch{}}soundSources=[];
   const now=audio.currentTime;
   // Sustain the licensed jaguar call as a single long, layered cinematic roar.
   const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-14;compressor.knee.value=18;compressor.ratio.value=4;compressor.attack.value=.008;compressor.release.value=.2;compressor.connect(master);
   [.69,.91].forEach((rate,i)=>{
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;source.playbackRate.value=rate;source.loop=true;source.loopStart=.08;source.loopEnd=Math.min(buffer.duration-.04,1.2);filter.type='lowpass';filter.frequency.value=i?3100:1700;
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(i?.32:.78,now+.18);gain.gain.setValueAtTime(i?.3:.7,now+5.65);gain.gain.exponentialRampToValueAtTime(.001,now+7.35);
    source.connect(filter);filter.connect(gain);gain.connect(compressor);source.start(now);source.stop(now+7.4);soundSources.push(source)
   });
   intro.dataset.audio='playing';sound.textContent='◖ Sound off';sound.setAttribute('aria-pressed','true');
  }catch{sound.textContent='◖ Try sound again'}
 }
 sound.addEventListener('click',()=>{if(audio?.state==='running'&&sound.getAttribute('aria-pressed')==='true'){master.gain.value=0;sound.textContent='◖ Sound on';sound.setAttribute('aria-pressed','false')}else{if(master)master.gain.value=.6;started=performance.now();playSound()}});
 try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0x03070d,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  renderer.domElement.setAttribute('aria-hidden','true');intro.prepend(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x03070d,.018);
  const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.035,120);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=environment.texture;
  scene.add(new THREE.AmbientLight(0x9ebad4,1.15));
  const key=new THREE.DirectionalLight(0xffd181,4.2);key.position.set(-4,4,5);scene.add(key);
  const rim=new THREE.PointLight(0x80bfff,25,30);rim.position.set(4,1,-1);scene.add(rim);
  const sweep=new THREE.PointLight(0xffcc65,30,25);sweep.position.set(-5,2,4);scene.add(sweep);
  const loader=new THREE.TextureLoader();
  const [logo,earth]=await Promise.all([loader.loadAsync(asset('logo-transparent.webp')),loader.loadAsync(asset('earth.jpg'))]);
  if(closed){environment.dispose();pmrem.dispose();return}
  logo.colorSpace=earth.colorSpace=THREE.SRGBColorSpace;logo.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const W=6,H=W*733/1100,compassY=-.36;
  const group=new THREE.Group();scene.add(group);
  const opening={value:0};
  const face=new THREE.MeshStandardMaterial({map:logo,transparent:true,alphaTest:.15,roughness:.34,metalness:.45,emissive:0xffffff,emissiveMap:logo,emissiveIntensity:.13,side:THREE.DoubleSide});
  face.onBeforeCompile=shader=>{shader.uniforms.portalRadius=opening;shader.fragmentShader='uniform float portalRadius;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\n if(distance((vMapUv-vec2(0.5,0.41))*vec2(1.0,0.66636),vec2(0.0)) < portalRadius) discard;')};
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(W,H),face);plane.position.z=.19;group.add(plane);
  // The outline is physically extruded from the original transparent artwork.
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=171;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(logo.image,0,0,256,171);const pixels=ctx.getImageData(0,0,256,171).data,verts=[];
  const solid=(x,y)=>x>=0&&y>=0&&x<256&&y<171&&pixels[(y*256+x)*4+3]>100;
  const wall=(x1,y1,x2,y2)=>{let a=[(x1/256-.5)*W,(.5-y1/171)*H],b=[(x2/256-.5)*W,(.5-y2/171)*H];verts.push(...a,.18,...b,.18,...a,.07,...b,.18,...b,.07,...a,.07)};
  for(let y=0;y<171;y++)for(let x=0;x<256;x++)if(solid(x,y)){if(!solid(x-1,y))wall(x,y,x,y+1);if(!solid(x+1,y))wall(x+1,y+1,x+1,y);if(!solid(x,y-1))wall(x+1,y,x,y);if(!solid(x,y+1))wall(x,y+1,x+1,y+1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.computeVertexNormals();
  const gold=new THREE.MeshStandardMaterial({color:0xc79839,metalness:.94,roughness:.23,side:THREE.DoubleSide});const depth=new THREE.Mesh(geo,gold);group.add(depth);
  const compass=new THREE.Group();compass.position.set(0,compassY,.25);group.add(compass);
  const hoop=new THREE.Mesh(new THREE.TorusGeometry(.49,.035,12,80),gold);compass.add(hoop);
  const silver=new THREE.MeshStandardMaterial({color:0xdce5ec,metalness:.95,roughness:.23});
  const needle=new THREE.Group();for(let i=0;i<8;i++){const n=new THREE.Mesh(new THREE.ConeGeometry(i%2?.065:.09,i%2?.34:.55,4),i%2?silver:gold);n.rotation.x=Math.PI/2;n.rotation.z=-i*Math.PI/4;n.position.set(Math.sin(i*Math.PI/4)*.17,Math.cos(i*Math.PI/4)*.17,.035);needle.add(n)}compass.add(needle);
  const jewel=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),silver);jewel.position.z=.15;needle.add(jewel);
  const jaguar=makeJaguar();group.add(jaguar.root);
  const globe=new THREE.Group();globe.position.set(0,compassY,-8);scene.add(globe);
  const planet=new THREE.Mesh(new THREE.SphereGeometry(2.5,64,48),new THREE.MeshStandardMaterial({map:earth,roughness:.82,metalness:.06,emissive:0x0c1a30,emissiveIntensity:.25}));globe.add(planet);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(2.55,48,32),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,uniforms:{glowColor:{value:new THREE.Color(0x609cda)}},vertexShader:'varying vec3 vN;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vP=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 glowColor;varying vec3 vN;varying vec3 vP;void main(){float a=pow(1.-abs(dot(normalize(vN),normalize(-vP))),3.);gl_FragColor=vec4(glowColor,a*.65);}'}));globe.add(atmosphere);
  const starGeo=new THREE.BufferGeometry(),starPos=[];let seed=19;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};for(let i=0;i<650;i++)starPos.push((rand()-.5)*70,(rand()-.5)*50,-10-rand()*35);starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xb6c5d8,size:.045,transparent:true,opacity:.65})));
  resize=()=>{const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};resize();addEventListener('resize',resize);
  intro.classList.add('cinema-ready');started=performance.now();
  // Sound may start automatically only where the browser already allows it.
  if(navigator.userActivation?.hasBeenActive)playSound();
  function tick(now){
   if(closed){removeEventListener('resize',resize);environment.dispose();pmrem.dispose();return}
   const t=(now-started)/1000,mobile=camera.aspect<.85,baseZ=Math.max(10.1,6/(2*Math.tan(THREE.MathUtils.degToRad(43/2))*camera.aspect)*1.22);
   group.rotation.y=mix(-.27,0,smooth(0,2.7,t));group.rotation.x=mix(.035,0,smooth(0,2.7,t));
   const push=smooth(3.7,6.1,t),earthPush=smooth(6.1,8,t);
   camera.position.set(mix(.45,0,smooth(0,3,t)),mix(.2,compassY,smooth(2.2,4,t)),mix(mix(baseZ,baseZ-.9,smooth(0,2.5,t)),-1.3,push)-earthPush*3.8);
   camera.lookAt(0,mix(0,compassY,smooth(2.2,4,t)),-7);
   opening.value=smooth(4.4,5.85,t)*.44;depth.visible=t<5.65;needle.scale.setScalar(1-smooth(4.2,5.25,t));hoop.rotation.z=t*.08;
   sweep.position.x=mix(-6,6,smooth(.3,3.1,t));sweep.intensity=26+Math.sin(t*1.7)*8;
   planet.rotation.y=.7+t*.055;
   // Jaguar follows the upward arrow, then bounds away before the fly-through.
   const run=smooth(.35,3.7,t);jaguar.root.position.set(mix(-1.1,1.85,run),mix(.55,1.7,run)+Math.abs(Math.sin(t*10))*.055,.85);jaguar.root.rotation.y=-.12;jaguar.root.rotation.z=.23;jaguar.root.scale.setScalar(.65);jaguar.root.visible=t<3.85;
   jaguar.legs.forEach((leg,i)=>{leg.rotation.z=Math.sin(t*12+(i%2?Math.PI:0)+(i>1?.9:0))*.8});jaguar.tail.rotation.y=Math.sin(t*5)*.16;
   intro.classList.toggle('cinema-diving',t>3.7);intro.classList.toggle('cinema-reveal',t>7.05);
   if(t>8){root.classList.add('cinema-arrived');finish();return}
   renderer.render(scene,camera);frame=requestAnimationFrame(tick)
  }
  frame=requestAnimationFrame(tick);
  renderer.domElement.addEventListener('webglcontextlost',finish,{once:true});
 }catch(error){console.warn('Cinema fallback:',error);intro.classList.add('cinema-fallback-only');setTimeout(finish,1800)}
}

function makeJaguar(){
 const root=new THREE.Group();
 const textureCanvas=document.createElement('canvas');textureCanvas.width=512;textureCanvas.height=256;const c=textureCanvas.getContext('2d');c.fillStyle='#bb872f';c.fillRect(0,0,512,256);
 for(let row=0;row<7;row++)for(let col=0;col<17;col++){let x=col*32+(row%2?15:0),y=row*38;c.strokeStyle='#281a11';c.lineWidth=4;c.beginPath();c.ellipse(x,y,8+(col%3),6+(row%3),col*.73,0,Math.PI*1.8);c.stroke();c.fillStyle='#402613';c.beginPath();c.arc(x+1,y,2,0,7);c.fill()}
 const furTexture=new THREE.CanvasTexture(textureCanvas);furTexture.colorSpace=THREE.SRGBColorSpace;
 const fur=new THREE.MeshStandardMaterial({map:furTexture,color:0xe7bb6c,roughness:.8}),belly=new THREE.MeshStandardMaterial({color:0xe3c78b,roughness:.9}),black=new THREE.MeshStandardMaterial({color:0x17110c,roughness:.6}),eye=new THREE.MeshStandardMaterial({color:0x7ca35a,emissive:0x414c14,emissiveIntensity:.3});
 const ell=(parent,x,y,z,sx,sy,sz,mat=fur)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m};
 ell(root,0,0,0,.66,.23,.22);ell(root,.36,.06,0,.27,.27,.23);ell(root,-.4,0,0,.28,.25,.22);ell(root,.63,.15,0,.25,.22,.2);ell(root,.81,.06,0,.17,.11,.16,belly);ell(root,.94,.085,0,.055,.045,.07,black);
 for(const z of [-.14,.14]){ell(root,.59,.35,z,.085,.095,.05,black);ell(root,.61,.365,z,.049,.05,.03,belly);ell(root,.78,.19,z*1.2,.035,.026,.018,eye)}
 const legs=[];
 for(const x of [-.43,.38])for(const z of [-.14,.14]){const pivot=new THREE.Group();pivot.position.set(x,-.12,z);root.add(pivot);ell(pivot,0,-.13,0,.095,.2,.085);ell(pivot,.045,-.35,0,.065,.17,.06,belly);ell(pivot,.105,-.49,0,.14,.065,.08,belly);legs.push(pivot)}
 const tail=new THREE.Group();tail.position.set(-.59,.04,0);root.add(tail);const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(),new THREE.Vector3(-.25,.05,0),new THREE.Vector3(-.5,.18,.04),new THREE.Vector3(-.64,.4,.06)]);tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.043,8,false),fur));ell(tail,-.64,.4,.06,.05,.065,.05,black);
 return {root,legs,tail};
}
