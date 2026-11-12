// Camões Conta: página "Viagem", mapa 3D das lendas de Portugal.
// Relevo real em cartoon, câmara guiada pelo scroll, monumentos e navios dentro da cena 3D,
// Camões animado, e acessibilidade (teclado, leitor de ecrã, movimento reduzido).
import * as THREE from './three.module.min.js';

const D2R = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const EX = 0.0105, FOV = 34;
const REGNAMES = ['', 'Minho', 'Trás-os-Montes', 'Douro Litoral', 'Beira', 'Estremadura', 'Ribatejo', 'Alentejo', 'Algarve'];
const REGCOL = ['', '#f0c4b8', '#efe09a', '#c9e0c0', '#f2d3a0', '#cddbef', '#e2d0ec', '#f3e5b0', '#f0b9a6'];
const FOGPOS = { ep2: { lon: -7.55, lat: 39.95 } };
const POSES = ['idle', 'walk', 'point', 'wave', 'spy', 'write', 'cheer', 'think'];

// Monumentos: lat/lon, largura no mundo, camada (1 = visível no mapa geral), texto PT/EN
const LM = [
  { id: 'pena', lat: 38.7876, lon: -9.3906, off: [0, 0], w: 16, t: 1, pt: ['Palácio da Pena', 'Palácio romântico do século XIX no alto da serra de Sintra, mandado construir por D. Fernando II.'], en: ['Pena Palace', 'A 19th-century Romantic palace on top of the Sintra hills, built for King Ferdinand II.'] },
  { id: 'belem', lat: 38.6916, lon: -9.2160, off: [0, 2], w: 12, t: 1, pt: ['Torre de Belém', 'Torre manuelina do século XVI que guardava a entrada do Tejo. É Património Mundial da UNESCO.'], en: ['Belém Tower', 'A 16th-century Manueline tower that guarded the mouth of the Tagus. A UNESCO World Heritage site.'] },
  { id: 'saojorge', lat: 38.7139, lon: -9.1334, off: [4, -3], w: 14, t: 2, pt: ['Castelo de São Jorge', 'Fortaleza medieval numa colina de Lisboa, com vista sobre a cidade e o Tejo.'], en: ['São Jorge Castle', 'A medieval fortress on a Lisbon hilltop, with views over the city and the Tagus.'] },
  { id: 'clerigos', lat: 41.1458, lon: -8.6139, off: [0, 0], w: 9, t: 1, pt: ['Torre dos Clérigos', 'Torre barroca do Porto com cerca de 75 metros, desenhada por Nicolau Nasoni no século XVIII.'], en: ['Clérigos Tower', 'A Baroque bell tower in Porto, about 75 metres tall, designed by Nicolau Nasoni in the 18th century.'] },
  { id: 'galo', lat: 41.5388, lon: -8.6151, off: [-3, -2], w: 10, t: 1, pt: ['Galo de Barcelos', 'Símbolo de Portugal. Nasceu da lenda do galo assado que cantou para provar a inocência de um peregrino.'], en: ['Rooster of Barcelos', 'A symbol of Portugal, born from the legend of the roasted rooster that crowed to prove a pilgrim innocent.'] },
  { id: 'bomjesus', lat: 41.5547, lon: -8.3772, off: [3, 2], w: 13, t: 2, pt: ['Bom Jesus do Monte', 'Santuário de Braga famoso pela escadaria barroca em ziguezague, no cimo do monte.'], en: ['Bom Jesus do Monte', 'A sanctuary in Braga famous for its zigzag Baroque staircase at the top of the hill.'] },
  { id: 'guimaraes', lat: 41.4478, lon: -8.2900, off: [3, -3], w: 14, t: 2, pt: ['Castelo de Guimarães', 'Diz a tradição que aqui nasceu D. Afonso Henriques. Guimarães chama-se o berço de Portugal.'], en: ['Guimarães Castle', 'Tradition says Afonso Henriques, the first king, was born here. Guimarães is called the cradle of Portugal.'] },
  { id: 'braganca', lat: 41.8066, lon: -6.7600, off: [0, 2], w: 14, t: 2, pt: ['Castelo de Bragança', 'Castelo medieval com torre de menagem, no alto da cidade velha de Bragança.'], en: ['Bragança Castle', 'A medieval castle with a keep, at the top of the old town of Bragança.'] },
  { id: 'douro', lat: 41.17, lon: -7.70, off: [0, 2], w: 15, t: 2, pt: ['Barco rabelo do Douro', 'O rabelo descia o Douro carregado de pipas de vinho do Porto, entre socalcos de vinhas.'], en: ['Douro rabelo boat', 'The rabelo sailed down the Douro loaded with port wine barrels, between terraced vineyards.'] },
  { id: 'aveiro', lat: 40.6443, lon: -8.6455, off: [-3, 1], w: 12, t: 2, pt: ['Moliceiro de Aveiro', 'Barco típico da Ria de Aveiro, de proa curva pintada com cenas e rimas bem-humoradas.'], en: ['Aveiro moliceiro', 'A traditional boat of the Aveiro lagoon, with a curved prow painted with scenes and witty rhymes.'] },
  { id: 'coimbra', lat: 40.2075, lon: -8.4263, off: [2, -1], w: 14, t: 1, pt: ['Universidade de Coimbra', 'Uma das universidades mais antigas da Europa, fundada em 1290. A Torre é o seu postal.'], en: ['University of Coimbra', 'One of the oldest universities in Europe, founded in 1290. Its Tower is its postcard.'] },
  { id: 'batalha', lat: 39.6597, lon: -8.8256, off: [-2, 1], w: 14, t: 2, pt: ['Mosteiro da Batalha', 'Mosteiro gótico mandado erguer por D. João I depois da vitória em Aljubarrota, em 1385.'], en: ['Batalha Monastery', 'A Gothic monastery ordered by King John I after the victory at Aljubarrota in 1385.'] },
  { id: 'tomar', lat: 39.6039, lon: -8.4167, off: [3, 0], w: 14, t: 2, pt: ['Convento de Cristo', 'Antiga sede dos Templários em Portugal, com a Charola e a célebre janela manuelina.'], en: ['Convent of Christ', 'Former seat of the Templars in Portugal, with its Charola and famous Manueline window.'] },
  { id: 'almourol', lat: 39.4686, lon: -8.3836, off: [2, 3], w: 12, t: 2, pt: ['Castelo de Almourol', 'Castelo templário numa pequena ilha do Tejo, rodeado de lendas.'], en: ['Almourol Castle', 'A Templar castle on a small island in the Tagus, wrapped in legends.'] },
  { id: 'obidos', lat: 39.3600, lon: -9.1573, off: [-3, 2], w: 13, t: 2, pt: ['Óbidos', 'Vila medieval cercada por muralhas, oferecida durante séculos às rainhas de Portugal.'], en: ['Óbidos', 'A medieval walled town, given to the queens of Portugal for centuries.'] },
  { id: 'evora', lat: 38.5726, lon: -7.9072, off: [0, 0], w: 14, t: 1, pt: ['Templo Romano de Évora', 'Templo romano do século I, conhecido como Templo de Diana, no centro de Évora.'], en: ['Roman Temple of Évora', 'A 1st-century Roman temple, known as the Temple of Diana, in the centre of Évora.'] },
  { id: 'piedade', lat: 37.0795, lon: -8.6667, off: [0, -2], w: 13, t: 2, pt: ['Ponta da Piedade', 'Falésias douradas, arcos e grutas junto a Lagos, no Algarve.'], en: ['Ponta da Piedade', 'Golden cliffs, arches and sea caves near Lagos, in the Algarve.'] },
  { id: 'saovicente', lat: 37.0230, lon: -8.9966, off: [-2, 2], w: 11, t: 1, pt: ['Cabo de São Vicente', 'Considerado o ponto mais a sudoeste da Europa continental, com o seu farol.'], en: ['Cape St. Vincent', 'Considered the south-westernmost point of mainland Europe, with its lighthouse.'] }
];

const STR = {
  pt: {
    hi: 'Olá! Sou o Camões. Faz scroll e eu levo-te às lendas.',
    stop: 'Estamos em {p}. Toca no medalhão para ver a lenda.',
    fog: 'Esta ainda não ta posso contar. Estreia {d}.',
    bye: 'Até à próxima lenda!',
    ep: 'Lenda {a} de {b}', explore: 'Explorar livremente', exit: 'Voltar ao percurso', classic: 'Mapa em pergaminho',
    back: 'Voltar ao site', back2: 'Voltar ao site', prev: 'Anterior', next: 'Seguinte', close: 'Fechar', north: 'Virar para norte',
    open: 'Ler a história', date: 'Ver a data de estreia', pub: 'Publicado', soon: 'Em breve',
    tip: 'Arrasta para mover, roda para aproximar, Shift e arrasta para rodar. Ou usa os botões e as setas do teclado.',
    ocean: 'Oceano Atlântico', spain: 'Espanha', scroll: 'Faz scroll para voar', fogl: 'Estreia {d}',
    sea1: 'Não mordo, prometo.', sea2: 'Glub glub!', sea3: 'Quem passa pelo meu mar?',
    skip: 'Saltar o mapa e ir para a lista das lendas', listh: 'As lendas do mapa', lmh: 'Pontos icónicos do mapa',
    zin: 'Aproximar', zout: 'Afastar', rl: 'Rodar para a esquerda', rr: 'Rodar para a direita', reg: 'Regiões',
    stage: 'Mapa 3D ilustrado das lendas de Portugal. A mesma informação está na lista de texto que vem a seguir.',
    lmtag: 'Ponto icónico', live: 'Lenda {a} de {b}: {t}, {p}.', live0: 'Mapa das lendas. Faz scroll para viajar até à primeira lenda.',
    soonlist: 'Estreia {d}', lmsay: 'Olha que bonito: {n}!'
  },
  en: {
    hi: 'Hello! I am Camões. Scroll and I will take you to the legends.',
    stop: 'We are in {p}. Tap the medallion to see the legend.',
    fog: 'I cannot tell you this one yet. It premieres {d}.',
    bye: 'See you at the next legend!',
    ep: 'Legend {a} of {b}', explore: 'Explore freely', exit: 'Back to the journey', classic: 'Parchment map',
    back: 'Back to the site', back2: 'Back to the site', prev: 'Previous', next: 'Next', close: 'Close', north: 'Face north',
    open: 'Read the story', date: 'See the premiere date', pub: 'Published', soon: 'Coming soon',
    tip: 'Drag to move, wheel to zoom, Shift and drag to rotate. Or use the buttons and the arrow keys.',
    ocean: 'Atlantic Ocean', spain: 'Spain', scroll: 'Scroll to fly', fogl: 'Premieres {d}',
    sea1: 'I do not bite, I promise.', sea2: 'Glub glub!', sea3: 'Who sails through my sea?',
    skip: 'Skip the map and go to the list of legends', listh: 'The legends on the map', lmh: 'Landmarks on the map',
    zin: 'Zoom in', zout: 'Zoom out', rl: 'Rotate left', rr: 'Rotate right', reg: 'Regions',
    stage: 'Illustrated 3D map of the legends of Portugal. The same information is in the text list that follows.',
    lmtag: 'Landmark', live: 'Legend {a} of {b}: {t}, {p}.', live0: 'Legend map. Scroll to travel to the first legend.',
    soonlist: 'Premieres {d}', lmsay: 'Look at that: {n}!'
  }
};

const VERT = `
attribute float aH; varying vec2 vUv; varying vec3 vN; varying float vH; varying vec3 vW;
void main(){ vUv=uv; vN=normal; vH=aH; vW=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D tSdf,tReg,tLines; uniform float uTime,uActive,uAnim; uniform vec3 uBg,uCam,uDeep; uniform vec4 uCl[6]; uniform vec3 uPal[10];
varying vec2 vUv; varying vec3 vN; varying float vH; varying vec3 vW;
const vec3 INK=vec3(.169,.141,.094);
float stroke(float q,float w){ float f=abs(fract(q)-.5); float a=fwidth(q)*1.4+.002; return 1.-smoothstep(w,w+a,f); }
vec3 fogLand(){ return vec3(.84,.79,.64); }
vec3 seaCol(float seaD){
  float es=fwidth(seaD)*1.0+.4;
  vec3 S0=vec3(.64,.84,.82),S1=vec3(.52,.77,.78),S2=vec3(.38,.66,.72);
  vec3 sea=S0; sea=mix(sea,S1,smoothstep(9.-es,9.+es,seaD)); sea=mix(sea,S2,smoothstep(26.-es,26.+es,seaD)); sea=mix(sea,uDeep,smoothstep(58.-es,58.+es,seaD));
  float cl=0.; for(int i=0;i<3;i++){ float T=i==0?9.:(i==1?26.:58.); cl=max(cl,1.-smoothstep(0.,es*1.3,abs(seaD-T))); }
  sea=mix(sea,vec3(1.),cl*.35);
  float t=uTime*uAnim;
  float dcam=length(uCam-vW);
  float q=sin(vW.x*.30+sin(vW.z*.22+t*.4)*1.3)*sin(vW.z*.26-t*.5+sin(vW.x*.09)*2.2);
  float wv=smoothstep(.82,.96,q)*smoothstep(8.,16.,seaD)*(1.-smoothstep(650.,1500.,dcam));
  return mix(sea,vec3(1.),wv*.5);
}
void main(){
  float far=smoothstep(950.,2300.,length(uCam-vW));
  if(vUv.x<0.||vUv.x>1.||vUv.y<0.||vUv.y>1.){
    vec2 cu=clamp(vUv,0.,1.);
    vec4 e0=texture2D(tSdf,cu); float s0=(e0.r*255.-128.)/10.; float l0=1.-smoothstep(-.6,.6,s0);
    vec2 ov=vec2(abs(vUv.x-cu.x)*968.,abs(vUv.y-cu.y)*982.);
    float sd0=e0.g*255./2.4+length(ov)*.9;
    vec3 oc=mix(seaCol(sd0),fogLand(),l0);
    gl_FragColor=vec4(mix(oc,uBg,far),1.); return;
  }
  vec4 sd=texture2D(tSdf,vUv); float s=(sd.r*255.-128.)/10.; float seaD=sd.g*255./2.4; float pt=sd.b;
  float aa=fwidth(s)*.9+.03; float landM=1.-smoothstep(-aa,aa,s);
  int id=int(texture2D(tReg,vUv).r*255.+.5);
  vec3 tint=uPal[id];
  vec3 N=normalize(vN); vec3 L=normalize(vec3(-.5,.8,-.42)); float d=dot(N,L);
  float h=max(vH,0.); float e=fwidth(h)*.9+2.5;
  float dry=smoothstep(-80.,330.,vW.z);
  vec3 C0=mix(vec3(.62,.78,.45),vec3(.84,.78,.48),dry*.75);
  vec3 C1=mix(vec3(.74,.80,.48),vec3(.86,.77,.46),dry*.7);
  vec3 C2=mix(vec3(.85,.78,.47),vec3(.84,.70,.42),dry*.6);
  vec3 C3=vec3(.78,.62,.41); vec3 C4=vec3(.64,.49,.35); vec3 C5=vec3(.55,.44,.36); vec3 C6=vec3(.90,.87,.78);
  vec3 land=C0;
  land=mix(land,C1,smoothstep(70.-e,70.+e,h)); land=mix(land,C2,smoothstep(220.-e,220.+e,h)); land=mix(land,C3,smoothstep(480.-e,480.+e,h));
  land=mix(land,C4,smoothstep(820.-e,820.+e,h)); land=mix(land,C5,smoothstep(1250.-e,1250.+e,h)); land=mix(land,C6,smoothstep(1720.-e,1720.+e,h));
  float isPt=smoothstep(.35,.65,pt);
  land=mix(land,tint,.22*isPt);
  float grey=dot(land,vec3(.3,.59,.11));
  vec3 esp=mix(land,vec3(grey),.45); esp=mix(esp,tint,.5);
  land=mix(esp,land,isPt);
  if(id==int(uActive+.5)) land*=1.07;
  float lit=mix(.70,1.10,smoothstep(.18,.5,d)); land*=lit;
  float ang=.62; vec2 hp=vec2(vW.x*cos(ang)+vW.z*sin(ang),-vW.x*sin(ang)+vW.z*cos(ang));
  float shadow=1.-smoothstep(.16,.46,d); float cross_=1.-smoothstep(.04,.2,d);
  float hatch=stroke(hp.x*.55,.09)*shadow*step(25.,h)+stroke(hp.y*.55,.08)*cross_*step(120.,h);
  land=mix(land,INK,clamp(hatch,0.,1.)*.34);
  vec4 ln=texture2D(tLines,vUv); land=mix(land,ln.rgb,ln.a*.95);
  float t=uTime*uAnim;
  vec3 sea=seaCol(seaD);
  float fo=sin(seaD*1.15-t*1.5); float foam=smoothstep(.78,.95,fo)*(1.-smoothstep(3.,15.,seaD))*step(0.,s);
  sea=mix(sea,vec3(1.),foam*.85);
  vec3 col=mix(sea,land,landM);
  float c=1.-smoothstep(.4,.4+aa*1.5,abs(s)); col=mix(col,INK,c*.92);
  float sh=0.; for(int i=0;i<6;i++){ vec4 q=uCl[i]; sh=max(sh,(1.-smoothstep(q.z*.55,q.z,length(vW.xz-q.xy)))*q.w); }
  col*=1.-.2*sh;
  float ed=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
  col=mix(mix(seaCol(seaD),fogLand(),landM),col,smoothstep(.0,.07,ed));
  col=mix(col,uBg,far);
  gl_FragColor=vec4(col,1.);
}`;

const PVERT = `uniform float uScale; attribute float aT; varying float vT;
void main(){ vT=aT; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=clamp(uScale*3.6/-mv.z,3.,9.); gl_Position=projectionMatrix*mv; }`;
const PFRAG = `precision mediump float; uniform float uProg; varying float vT;
void main(){ vec2 p=gl_PointCoord-.5; float r=length(p); if(r>.5) discard; vec3 ink=vec3(.169,.141,.094);
  float done=step(vT,uProg); vec3 c=mix(vec3(1.,.97,.88),ink,done); float ring=smoothstep(.34,.46,r); c=mix(c,mix(ink,vec3(1.),1.-done),ring);
  gl_FragColor=vec4(c,mix(.75,1.,done)); }`;

const loadImg = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
const pixels = (img) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
const hex3 = (h, V) => { const n = parseInt(h.replace('#', ''), 16); return new V((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255); };

export async function initViagem(root, ctx) {
  const { EPS, COV, tx, out, placeLine, dshort, when, lang } = ctx;
  const base = ctx.base || 'assets/viagem/';
  const S = () => STR[lang()] || STR.pt;
  const q = (s) => root.querySelector(s);
  const stage = q('[data-stage]'), canvas = q('[data-canvas]'), world = q('[data-world]'), track = q('[data-track]'), hero = q('[data-hero]');
  const narrow = matchMedia('(max-width: 52rem)'), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) root.classList.add('vg-static');

  // ---------- relevo
  const [meta, imgTerrain, imgSdf, imgReg, imgLines] = await Promise.all([
    fetch(base + 'meta.json').then(r => r.json()), loadImg(base + 'terrain.png'), loadImg(base + 'sdf.png'), loadImg(base + 'regions.png'), loadImg(base + 'lines.png')]);
  const TW = meta.W, TH = meta.H, FW = meta.fw, FH = meta.fh;
  const tp = pixels(imgTerrain), rp = pixels(imgReg);
  const hs = new Float32Array(TW * TH), lmA = new Float32Array(TW * TH), reg = new Uint8Array(TW * TH);
  for (let i = 0; i < TW * TH; i++) { hs[i] = ((tp[i * 4] * 256 + tp[i * 4 + 1]) / 65535) * meta.hrange + meta.hmin; lmA[i] = tp[i * 4 + 2] / 255; reg[i] = rp[i * 4]; }
  const X0 = -FW / 2, Z0 = -FH / 2;
  const svgToW = (sx, sy) => [sx - meta.mx - FW / 2, sy - meta.my - FH / 2];
  const llToW = (lon, lat) => svgToW(meta.mx + (lon - meta.lon0) * meta.kx, meta.my + (meta.lat1 - lat) * meta.ky);
  const bil = (arr, fx, fy) => { fx = clamp(fx, 0, TW - 1.001); fy = clamp(fy, 0, TH - 1.001); const x = fx | 0, y = fy | 0, a = fx - x, b = fy - y, i = y * TW + x; return lerp(lerp(arr[i], arr[i + 1], a), lerp(arr[i + TW], arr[i + TW + 1], a), b); };
  const heightAtUV = (u, v) => { const fx = u * (TW - 1), fy = v * (TH - 1), l = bil(lmA, fx, fy), h = bil(hs, fx, fy); return Math.max(h, 0) * EX * clamp((l - .3) / .4, 0, 1); };
  const ground = (x, z) => heightAtUV(clamp((x - X0) / FW, 0, 1), clamp((z - Z0) / FH, 0, 1));
  const regionAt = (x, z) => { const u = clamp((x - X0) / FW, 0, 1), v = clamp((z - Z0) / FH, 0, 1); return reg[Math.round(v * (TH - 1)) * TW + Math.round(u * (TW - 1))]; };

  // ---------- renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !narrow.matches, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('sem WebGL2');
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  let dpr = Math.min(devicePixelRatio || 1, narrow.matches ? 1.5 : 1.75);
  const BG = new THREE.Color().setRGB(0x16 / 255, 0x45 / 255, 0x5a / 255, THREE.LinearSRGBColorSpace);
  const scene = new THREE.Scene(); scene.background = BG;
  scene.fog = new THREE.Fog(BG, 1500, 3100);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 4, 6000);
  const V3 = THREE.Vector3;

  const GN = narrow.matches ? 340 : 500, GM = Math.round(GN * TH / TW);
  const pos = new Float32Array(GN * GM * 3), uvs = new Float32Array(GN * GM * 2), aH = new Float32Array(GN * GM);
  for (let j = 0; j < GM; j++) for (let i = 0; i < GN; i++) {
    const u = i / (GN - 1), v = j / (GM - 1), k = j * GN + i, y = heightAtUV(u, v);
    pos[k * 3] = X0 + u * FW; pos[k * 3 + 1] = y; pos[k * 3 + 2] = Z0 + v * FH; uvs[k * 2] = u; uvs[k * 2 + 1] = v;
    aH[k] = bil(hs, u * (TW - 1), v * (TH - 1));
  }
  const idx = new Uint32Array((GN - 1) * (GM - 1) * 6); let n = 0;
  for (let j = 0; j < GM - 1; j++) for (let i = 0; i < GN - 1; i++) { const a = j * GN + i, b = a + 1, c = a + GN, d = c + 1; idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geo.setAttribute('aH', new THREE.BufferAttribute(aH, 1));
  geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeVertexNormals();

  const mkTex = (img, o = {}) => { const t = new THREE.Texture(img); t.flipY = false; t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.magFilter = o.nearest ? THREE.NearestFilter : THREE.LinearFilter; t.minFilter = o.nearest ? THREE.NearestFilter : (o.mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter); t.generateMipmaps = !!o.mips; t.anisotropy = o.mips ? 4 : 1; t.needsUpdate = true; return t; };
  const pal = ['#0b2230', ...REGCOL.slice(1), '#d9cfb0'].map(h => hex3(h, V3));
  const clouds = Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 60, 0));
  const uni = { tSdf: { value: mkTex(imgSdf) }, tReg: { value: mkTex(imgReg, { nearest: true }) }, tLines: { value: mkTex(imgLines, { mips: true }) }, uTime: { value: 0 }, uAnim: { value: reduced ? 0 : 1 }, uActive: { value: 0 }, uBg: { value: new V3(BG.r, BG.g, BG.b) }, uDeep: { value: hex3('#2f7790', V3) }, uCam: { value: new V3() }, uCl: { value: clouds }, uPal: { value: pal } };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: uni, fog: false });
  scene.add(new THREE.Mesh(geo, mat));
  { // mar à volta do mapa, para nunca se ver o fim do mundo
    const R = 4200, p = new Float32Array([-R, -.4, -R, R, -.4, -R, -R, -.4, R, R, -.4, R]), u = new Float32Array([(-R - X0) / FW, (-R - Z0) / FH, (R - X0) / FW, (-R - Z0) / FH, (-R - X0) / FW, (R - Z0) / FH, (R - X0) / FW, (R - Z0) / FH]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.BufferAttribute(u, 2)); g.setAttribute('aH', new THREE.BufferAttribute(new Float32Array(4), 1)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3)); g.setIndex([0, 2, 1, 1, 2, 3]);
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; scene.add(m);
  }

  // ---------- figuras dentro da cena (ficam coladas ao terreno)
  const QUAD = new THREE.PlaneGeometry(1, 1).translate(0, .5, 0);
  const texL = new THREE.TextureLoader();
  const figs = [];
  function fig(url, o) {
    const m = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: o.at != null ? o.at : .35, depthWrite: o.dw !== false, toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(QUAD, m); mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = o.order || 0;
    scene.add(mesh);
    const f = Object.assign({ mesh, ar: 1, w: o.w || 10, lift: 0, minPx: 0, grow: 1, dmin: 0, dmax: 1e5, sc: 1, show: 0 }, o);
    texL.load(url, t => { t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; m.map = t; m.needsUpdate = true; f.ar = t.image.height / t.image.width; });
    figs.push(f); return f;
  }
  const pt4 = [new V3(-.5, 0, 0), new V3(.5, 0, 0), new V3(-.5, 1, 0), new V3(.5, 1, 0)], tmp = new V3();

  // monumentos
  const lms = LM.map(m => {
    const p = llToW(m.lon, m.lat), off = m.off || [0, 0];
    const f = fig(base + 'lm/' + m.id + '.webp', { w: m.w, x: p[0] + off[0], z: p[1] + off[1], minPx: m.t === 1 ? 46 : 42, grow: 1.9, dmax: m.t === 1 ? 3400 : 620 });
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'vhit'; btn.setAttribute('aria-haspopup', 'dialog');
    const lbl = document.createElement('span'); lbl.className = 'lbl'; btn.appendChild(lbl); world.appendChild(btn);
    const L = { m, f, btn, lbl }; f.btn = btn;
    btn.addEventListener('click', () => showLM(L));
    return L;
  });
  // navios e criaturas
  const ships = [
    { n: 'nau', w: 24, a: [-336, -150], b: [-250, -116], t: 0, sp: .010 },
    { n: 'caravela', w: 20, a: [-352, 118], b: [-268, 152], t: .5, sp: .013 },
    { n: 'caravela', w: 17, a: [-258, 382], b: [-168, 398], t: .2, sp: .009 }
  ].map(s => { s.f = fig(base + 'sea/' + s.n + '.webp', { w: s.w, x: s.a[0], z: s.a[1], minPx: 30, grow: 1.8, dmax: 3200 }); return s; });
  const crit = [
    { n: 'serpente', w: 34, x: -330, z: -196, say: 'sea1' },
    { n: 'baleia', w: 28, x: -368, z: 16, say: 'sea2' },
    { n: 'adamastor', w: 38, x: -384, z: 292, say: 'sea3' }
  ].map(c => {
    c.f = fig(base + 'sea/' + c.n + '.webp', { w: c.w, x: c.x, z: c.z, minPx: 34, grow: 1.8, dmax: 3200 });
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'vhit'; world.appendChild(btn);
    btn.addEventListener('click', () => bubble(c.f, S()[c.say]));
    c.f.btn = btn; return c;
  });
  // nuvens
  const cl = [];
  for (let i = 0; i < 6; i++) {
    const f = fig(base + 'sea/nuvem.webp', { w: 38 + (i % 3) * 12, x: -430 + i * 168, z: -400 + ((i * 337) % 820), lift: 72 + (i % 3) * 18, at: .04, dw: false, order: 2, minPx: 30, grow: 1.5, dmin: 150, dmax: 2800 });
    f.vx = (6 + i * 1.7) * (i % 2 ? 1 : -1) * .5; f.gate = () => rig.d > 460; cl.push(f);
  }
  // Camões no canto: moldura fixa com poses e fala, fora do mapa
  const camBox = document.createElement('div'); camBox.className = 'vcambox';
  camBox.innerHTML = `<button type="button" class="fig">${POSES.map(p => `<img data-p="${p}" src="${base}cam/cam_${p}.webp" alt="" decoding="async">`).join('')}<span class="plq" aria-hidden="true">Camões</span></button><div class="say" aria-hidden="true" hidden></div>`;
  stage.appendChild(camBox);
  const camImgs = {}; camBox.querySelectorAll('img').forEach(i => camImgs[i.dataset.p] = i);
  const camFig = camBox.querySelector('.fig'), camSay = camBox.querySelector('.say');
  camFig.setAttribute('aria-label', 'Camões');
  const cam = { pose: 'idle', hold: 0, lastAct: 0, introDone: false };
  let sayT = 0;
  function say(txt, ms = 6500) { camSay.textContent = txt; camSay.hidden = false; clearTimeout(sayT); sayT = setTimeout(() => { camSay.hidden = true }, ms); }
  function setPose(p, _d, ms = 0) {
    if (p !== cam.pose) { camImgs[cam.pose].classList.remove('on'); camImgs[p].classList.add('on'); cam.pose = p; camBox.classList.toggle('walking', p === 'walk'); camFig.classList.remove('pop'); void camFig.offsetWidth; camFig.classList.add('pop'); }
    if (p !== 'write') cam.lastAct = performance.now();
    cam.hold = ms ? performance.now() + ms : 0;
  }
  camImgs.idle.classList.add('on');

  // ---------- paragens e percurso
  const stops = EPS.filter(e => (e.lat != null && e.lon != null) || FOGPOS[e.id]).sort((a, b) => a.n - b.n).map(e => {
    const p = e.lat != null ? llToW(e.lon, e.lat) : llToW(FOGPOS[e.id].lon, FOGPOS[e.id].lat);
    return { e, x: p[0], z: p[1] };
  });
  const SEG = 70, pathPts = [];
  if (stops.length > 1) {
    const curve = new THREE.CatmullRomCurve3(stops.map(s => new V3(s.x, 0, s.z)), false, 'centripetal'), N = SEG * (stops.length - 1);
    for (let i = 0; i <= N; i++) { const p = curve.getPoint(i / N); pathPts.push([p.x, p.z]); }
  }
  const pathAt = (seg, u) => { const f = clamp(u, 0, 1) * SEG, i = Math.min(Math.floor(f), SEG - 1), a = pathPts[seg * SEG + i], b = pathPts[seg * SEG + i + 1], t = f - i; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; };
  let pathMat = null;
  if (pathPts.length) {
    const pg = new THREE.BufferGeometry(), pp = new Float32Array(pathPts.length * 3), ptt = new Float32Array(pathPts.length);
    pathPts.forEach((p, i) => { pp.set([p[0], ground(p[0], p[1]) + 1.4, p[1]], i * 3); ptt[i] = i / (pathPts.length - 1); });
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('aT', new THREE.BufferAttribute(ptt, 1));
    pathMat = new THREE.ShaderMaterial({ vertexShader: PVERT, fragmentShader: PFRAG, transparent: true, fog: false, uniforms: { uScale: { value: 600 }, uProg: { value: 0 } } });
    scene.add(new THREE.Points(pg, pathMat));
  }

  // ---------- câmara
  const rig = { x: 0, z: 0, d: 1200, p: 46, h: 0 }, tgt = { x: 0, z: 0, d: 1200, p: 46, h: 0 };
  const WP = [{ x: 0, z: 0, d: 1180, p: 44, h: 0 }];
  stops.forEach((s, i) => WP.push({ x: s.x, z: s.z, d: 150, p: 50, h: [-8, 10, -6, 8][i % 4] }));
  const fitDist = () => { const asp = vw / vh, t = Math.tan(FOV * D2R / 2); return clamp(Math.max(FH * .72 / (2 * t), (FW * (asp < 1 ? .46 : .95)) / (2 * t * asp)), 600, 1900); };
  let vw = 1, vh = 1, trackTop = 0, pieces = [], total = 0;
  function buildPieces() {
    const many = stops.length > 6, hold = many ? .6 : .8, fly = many ? .7 : .9, u = vh;
    pieces = [{ k: 'intro', len: vh }, { k: 'hold', i: 0, len: u * .35 }];
    for (let i = 1; i < WP.length; i++) { pieces.push({ k: 'fly', i, len: u * fly }); pieces.push({ k: 'hold', i, len: u * hold }); }
    pieces.push({ k: 'outro', len: vh });
    let c = 0; pieces.forEach(p => { p.s = c; c += p.len; p.e = c; }); total = c;
  }
  function wpState(px) {
    let pc = pieces[pieces.length - 1]; for (const c of pieces) if (px <= c.e) { pc = c; break; }
    const t = clamp((px - pc.s) / Math.max(1, pc.e - pc.s), 0, 1), u = sstep(0, 1, t), W0 = WP[0], last = WP[WP.length - 1];
    if (pc.k === 'intro') return { x: 0, z: 0, d: lerp(W0.d * 1.55, W0.d, u), p: lerp(62, W0.p, u), h: lerp(16, 0, u), stop: 0, mode: 'intro', t };
    if (pc.k === 'hold') { const w = WP[pc.i]; return { x: w.x, z: w.z, d: w.d, p: w.p, h: w.h, stop: pc.i, mode: 'hold', t }; }
    if (pc.k === 'outro') return { x: lerp(last.x, 0, u), z: lerp(last.z, 0, u), d: lerp(last.d, W0.d * 1.4, u), p: lerp(last.p, 58, u), h: lerp(last.h, -12, u), stop: 0, mode: 'outro', t };
    const a = WP[pc.i - 1], b = WP[pc.i], xz = pc.i >= 2 && pathPts.length ? pathAt(pc.i - 2, u) : [lerp(a.x, b.x, u), lerp(a.z, b.z, u)];
    const arc = Math.hypot(a.x - b.x, a.z - b.z) * .5 + 80;
    return { x: xz[0], z: xz[1], d: lerp(a.d, b.d, u) + Math.sin(Math.PI * u) * arc, p: lerp(a.p, b.p, u) - Math.sin(Math.PI * u) * 6, h: lerp(a.h, b.h, u), stop: 0, mode: 'fly', pseg: pc.i >= 2 ? pc.i - 2 : -1, t, u };
  }
  let manual = 0;
  const staticState = () => ({ x: WP[manual].x, z: WP[manual].z, d: WP[manual].d, p: WP[manual].p, h: WP[manual].h, stop: manual, mode: manual ? 'hold' : 'static', t: .5 });

  // ---------- etiquetas em HTML
  const labels = [];
  const mkL = (cls, html, o) => { const el = document.createElement('div'); el.className = 'vl ' + cls; el.innerHTML = html; el.style.visibility = 'hidden'; el.setAttribute('aria-hidden', 'true'); world.appendChild(el); const it = Object.assign({ el, lift: 0, dmin: 0, dmax: 1e5, pri: 5 }, o); labels.push(it); return it; };
  meta.cities.forEach(c => { const p = svgToW(c.x, c.y); if (stops.some(s => Math.hypot(s.x - p[0], s.z - p[1]) < 18)) return; mkL('vcity' + (c.big ? ' big' : ''), `<i></i><span>${c.n}</span>`, { x: p[0], z: p[1], dmax: c.big ? 760 : 300, pri: c.big ? 2 : 3 }); });
  meta.capes.forEach(c => { const p = svgToW(c[1], c[2]); mkL('vcape', `<span>${c[0]}</span>`, { x: p[0], z: p[1], dmax: 380, pri: 4 }); });
  meta.regs.forEach(r => { const p = svgToW(r[1], r[2]); mkL('vreg', `<span>${r[0]}</span>`, { x: p[0], z: p[1], dmin: 520, dmax: 2300, lift: 4, pri: 5 }); });
  const ocL = mkL('vsea', '', { x: -286, z: 70, dmin: 300, dmax: 2600, pri: 6 }), esL = mkL('vsea', '', { x: 322, z: 150, dmin: 480, dmax: 2600, pri: 6 });

  // medalhões das lendas
  const pins = stops.map((s, i) => {
    const o = out(s.e);
    const el = document.createElement('button'); el.type = 'button'; el.className = 'vpin ' + (o ? 'on' : 'soon');
    el.innerHTML = o ? `<span class="ring">${COV[s.e.id] ? `<img src="${COV[s.e.id]}" alt="" draggable="false">` : ''}</span><i class="tail"></i><span class="cap"></span>`
      : `<span class="puff p1"></span><span class="puff p2"></span><span class="puff p3"></span><b class="q">?</b><span class="cap"></span>`;
    el.style.visibility = 'hidden'; world.appendChild(el);
    el.addEventListener('click', () => goStop(i + 1));
    const it = { el, x: s.x, z: s.z, lift: 7, pri: 0 };
    return it;
  });

  // ---------- Camões
  const bub = document.createElement('div'); bub.className = 'vbub'; bub.hidden = true; bub.setAttribute('role', 'status'); world.appendChild(bub);
  let bubT = 0, bubF = null;
  function bubble(f, txt, ms = 6000) { bubF = f; bub.textContent = txt; bub.hidden = false; clearTimeout(bubT); bubT = setTimeout(() => { bub.hidden = true; bubF = null }, ms); }
  const sayStop = (st) => out(st.e) ? S().stop.replace('{p}', tx(st.e).place || '') : S().fog.replace('{d}', dshort(st.e));
  camFig.addEventListener('click', () => { setPose('wave', 0, 2200); say(activeStop ? sayStop(stops[activeStop - 1]) : S().hi); });

  // ---------- cartão do monumento
  const lmCard = document.createElement('div'); lmCard.className = 'vlmc'; lmCard.hidden = true; lmCard.setAttribute('role', 'dialog'); lmCard.setAttribute('aria-modal', 'false');
  lmCard.innerHTML = '<button type="button" class="x"></button><b class="tag"></b><h4></h4><p></p>'; world.appendChild(lmCard);
  let lmActive = null;
  function showLM(L) {
    lmActive = L; const T = L.m[lang()] || L.m.pt;
    lmCard.querySelector('h4').textContent = T[0]; lmCard.querySelector('p').textContent = T[1];
    lmCard.querySelector('.tag').textContent = S().lmtag; const x = lmCard.querySelector('.x'); x.setAttribute('aria-label', S().close); x.innerHTML = '&times;';
    lmCard.setAttribute('aria-label', T[0]); lmCard.hidden = false; lms.forEach(o => o.btn.setAttribute('aria-expanded', String(o === L)));
    bub.hidden = true; panel.classList.remove('in'); panel.setAttribute('aria-hidden', 'true');
    setPose('point', 0, 9000); say(S().lmsay.replace('{n}', T[0]), 5000);
    announce(T[0] + '. ' + T[1]);
  }
  function hideLM() { if (!lmActive) return; lmActive = null; lmCard.hidden = true; lms.forEach(o => o.btn.setAttribute('aria-expanded', 'false')); if (activeStop && !explore && dismissed !== activeStop) showPanel(activeStop); }
  lmCard.querySelector('.x').addEventListener('click', () => { const b = lmActive && lmActive.btn; hideLM(); b && b.focus(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && lmActive) { const b = lmActive.btn; hideLM(); b.focus(); e.stopPropagation(); } }, true);

  // ---------- HUD
  const chipEp = q('[data-chip-ep]'), chipRg = q('[data-chip-rg]'), compass = q('[data-compass]'), rail = q('[data-rail]'), mini = q('[data-mini]'), time = q('[data-time]'), panel = q('[data-panel]'), btnEx = q('[data-explore]'), tip = q('[data-tip]'), cue = q('[data-cue]'), live = q('[data-live]'), hud = q('[data-hud]');
  function announce(t) { live.textContent = ''; setTimeout(() => live.textContent = t, 60); }
  REGNAMES.slice(1).forEach((r, i) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.r = i + 1; b.style.setProperty('--c', REGCOL[i + 1]); b.textContent = r; rail.appendChild(b); });
  rail.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const r = meta.regs[b.dataset.r - 1], p = svgToW(r[1], r[2]); setExplore(true); tgt.x = p[0]; tgt.z = p[1]; tgt.d = 380; tgt.p = 52; need(); });
  const mc = mini.querySelector('canvas'), mx = mc.getContext('2d'); mc.width = 108; mc.height = Math.round(108 * TH / TW);
  { const id = mx.createImageData(mc.width, mc.height); for (let y = 0; y < mc.height; y++) for (let x = 0; x < mc.width; x++) { const r = reg[Math.floor(y / mc.height * TH) * TW + Math.floor(x / mc.width * TW)], k = (y * mc.width + x) * 4; if (r === 0) { id.data[k + 3] = 0 } else { const c = r === 9 ? [150, 140, 112] : [226, 196, 120]; id.data[k] = c[0]; id.data[k + 1] = c[1]; id.data[k + 2] = c[2]; id.data[k + 3] = 255 } } mx.putImageData(id, 0, 0); }
  const miniBase = mx.getImageData(0, 0, mc.width, mc.height);
  function drawMini() { mx.putImageData(miniBase, 0, 0); stops.forEach(s => { const x = (s.x - X0) / FW * mc.width, y = (s.z - Z0) / FH * mc.height; mx.beginPath(); mx.arc(x, y, 3, 0, 7); mx.fillStyle = out(s.e) ? '#8b5a2b' : '#d3dcdb'; mx.fill(); mx.strokeStyle = '#2b2418'; mx.lineWidth = 1.2; mx.stroke(); }); const x = (rig.x - X0) / FW * mc.width, y = (rig.z - Z0) / FH * mc.height; mx.beginPath(); mx.arc(x, y, 6, 0, 7); mx.strokeStyle = '#c0392b'; mx.lineWidth = 2; mx.stroke(); }
  const ROM = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
  function buildTime() {
    time.innerHTML = '<div class="bar"><i data-fill></i></div>';
    EPS.forEach(e => { const i = stops.findIndex(s => s.e === e), b = document.createElement('button'); b.type = 'button'; b.className = 'tn' + (out(e) ? '' : ' soon'); b.dataset.i = i + 1; b.innerHTML = `<b>${ROM[e.n] || e.n}</b><small>${e.date && !out(e) ? dshort(e) : ''}</small>`; if (i < 0) b.disabled = true; b.setAttribute('aria-label', S().ep.replace('{a}', e.n).replace('{b}', EPS.length) + ': ' + tx(e).t); b.style.left = (EPS.length > 1 ? 8 + 84 * (e.n - 1) / (EPS.length - 1) : 50) + '%'; time.appendChild(b); });
  }
  time.addEventListener('click', e => { const b = e.target.closest('.tn'); if (b && +b.dataset.i > 0) goStop(+b.dataset.i); });
  compass.addEventListener('click', () => { if (explore) { tgt.h = 0; need() } });

  // ---------- painel da lenda
  let activeStop = 0, dismissed = -1;
  function showPanel(i) {
    const st = stops[i - 1]; if (!st) { panel.classList.remove('in'); panel.setAttribute('aria-hidden', 'true'); return; }
    const e = st.e, o = out(e), X = tx(e);
    panel.innerHTML = `<button class="x" type="button" aria-label="${S().close}">&times;</button>${COV[e.id] ? `<img class="cv" src="${COV[e.id]}" alt="">` : ''}<div class="pb"><span class="pt">${o ? S().pub : S().soon + ' · ' + when(e)}</span><h3></h3><p class="ln"></p><p class="pl"></p><div class="pa"><a class="go vbtn sm"><span class="em" aria-hidden="true"></span><span class="tx"></span></a></div><div class="pn"><button type="button" data-p>${'← ' + S().prev}</button><button type="button" data-n>${S().next + ' →'}</button></div></div>`;
    panel.querySelector('h3').textContent = X.t; panel.querySelector('.ln').textContent = o ? (X.line || '') : (X.teaser || ''); panel.querySelector('.pl').textContent = placeLine(e);
    const a = panel.querySelector('.go'); a.href = '#' + e.id; a.querySelector('.tx').textContent = o ? S().open : S().date;
    panel.querySelector('[data-p]').disabled = i <= 1; panel.querySelector('[data-n]').disabled = i >= stops.length;
    panel.setAttribute('aria-label', X.t); panel.removeAttribute('aria-hidden'); panel.classList.add('in');
  }
  panel.addEventListener('click', e => {
    if (e.target.closest('.x')) { dismissed = activeStop; panel.classList.remove('in'); panel.setAttribute('aria-hidden', 'true'); }
    else if (e.target.closest('[data-p]')) goStop(activeStop - 1); else if (e.target.closest('[data-n]')) goStop(activeStop + 1);
  });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('in')) { dismissed = activeStop; panel.classList.remove('in'); panel.setAttribute('aria-hidden', 'true'); } });

  // ---------- modo explorar
  let explore = false;
  const bound = () => { tgt.x = clamp(tgt.x, X0 - 60, -X0 + 60); tgt.z = clamp(tgt.z, Z0 - 60, -Z0 + 60); tgt.d = clamp(tgt.d, 60, 1500); tgt.p = clamp(tgt.p, 26, 74); };
  function setExplore(on) {
    if (on === explore) return; explore = on; root.classList.toggle('vg-explore', on); btnEx.setAttribute('aria-pressed', String(on)); refreshBtn();
    if (on) { panel.classList.remove('in'); panel.setAttribute('aria-hidden', 'true'); hideLM(); tgt.x = rig.x; tgt.z = rig.z; tgt.d = rig.d; tgt.p = rig.p; tgt.h = rig.h; tip.hidden = false; setTimeout(() => tip.hidden = true, 9000); setPose('spy', 1); announce(S().tip); }
    else { tip.hidden = true; setPose('idle'); if (activeStop && dismissed !== activeStop) showPanel(activeStop); }
    need();
  }
  btnEx.addEventListener('click', () => setExplore(!explore));
  const pan = (dx, dy) => { const th = tgt.h * D2R, s = tgt.d * .0019, fx = -Math.sin(th), fz = -Math.cos(th), rx = Math.cos(th), rz = -Math.sin(th); tgt.x -= rx * dx * s - fx * dy * s * 1.35; tgt.z -= rz * dx * s - fz * dy * s * 1.35; bound(); need(); };
  const zoom = (f) => { tgt.d *= f; bound(); need(); }, rot = (dh) => { tgt.h += dh; need(); };
  q('[data-zin]').addEventListener('click', () => zoom(.72)); q('[data-zout]').addEventListener('click', () => zoom(1.38));
  q('[data-rotl]').addEventListener('click', () => rot(-20)); q('[data-rotr]').addEventListener('click', () => rot(20));
  stage.addEventListener('keydown', e => {
    if (e.key === 'Escape' && explore) { setExplore(false); btnEx.focus(); return; }
    if (!explore || e.target.closest('input,textarea')) return;
    const k = e.key, st = 110;
    if (k === 'ArrowLeft') pan(st, 0); else if (k === 'ArrowRight') pan(-st, 0); else if (k === 'ArrowUp') pan(0, st); else if (k === 'ArrowDown') pan(0, -st);
    else if (k === '+' || k === '=') zoom(.8); else if (k === '-' || k === '_') zoom(1.25); else if (k === 'q' || k === 'Q') rot(-15); else if (k === 'e' || k === 'E') rot(15); else return;
    e.preventDefault();
  });
  const pts = new Map(); let drag = null;
  stage.addEventListener('pointerdown', e => { if (!explore || e.target.closest('button,a,.vpanel,.vlmc,aside')) return; stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); drag = { rot: e.shiftKey || e.button === 2 }; });
  stage.addEventListener('pointermove', e => {
    if (!explore || !pts.has(e.pointerId)) return; const o = pts.get(e.pointerId), dx = e.clientX - o[0], dy = e.clientY - o[1]; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size >= 2) { const k = [...pts.values()], dd = Math.hypot(k[0][0] - k[1][0], k[0][1] - k[1][1]); if (stage._pd) { tgt.d *= stage._pd / dd; bound(); } stage._pd = dd; need(); return; }
    if (drag && drag.rot) { tgt.h += dx * .35; tgt.p -= dy * .25; bound(); need(); } else pan(dx, dy);
  });
  const up = e => { pts.delete(e.pointerId); stage._pd = 0; if (!pts.size) drag = null; };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up); stage.addEventListener('contextmenu', e => { if (explore) e.preventDefault() });
  stage.addEventListener('wheel', e => { if (!explore) return; e.preventDefault(); tgt.d *= Math.exp(e.deltaY * .0012); bound(); need(); }, { passive: false });

  // ---------- scroll
  function measure() {
    vw = stage.clientWidth || innerWidth; vh = stage.clientHeight || innerHeight; buildPieces();
    const stick = parseFloat(getComputedStyle(stage).top) || 0;
    track.style.height = reduced ? '' : Math.round(total + vh + stick) + 'px';
    trackTop = track.getBoundingClientRect().top + scrollY;
    renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false); camera.aspect = vw / vh; camera.updateProjectionMatrix();
    if (pathMat) pathMat.uniforms.uScale.value = (vh * dpr) / (2 * Math.tan(FOV * D2R / 2));
    WP[0].d = fitDist(); if (!started) { rig.x = tgt.x = 0; rig.z = tgt.z = 0; rig.d = WP[0].d * 1.55; rig.p = 62; rig.h = 16; }
    need();
  }
  const spx = () => clamp(scrollY - trackTop, 0, total);
  function goStop(i) {
    i = clamp(i, 1, stops.length); if (explore) setExplore(false);
    if (reduced) { manual = i; dismissed = -1; need(); return; }
    const pc = pieces.find(p => p.k === 'hold' && p.i === i); if (!pc) return;
    scrollTo({ top: trackTop + (pc.s + pc.e) / 2, behavior: 'smooth' });
  }

  // ---------- desenho
  let running = false, raf = 0, last = 0, started = false, frames = 0, fpsT = 0, inView = false, lastReg = -1, lastScrollT = 0, ppuK = 800, heroUp = false, shX = 0, shY = 0;
  function need() { if (!raf && running) raf = requestAnimationFrame(frame); }
  const prj = new V3();
  function project(x, y, z) { prj.set(x, y, z); const d = camera.position.distanceTo(prj); prj.project(camera); return [(prj.x * .5 + .5) * vw, (-prj.y * .5 + .5) * vh, prj.z, d]; }

  function updateFigs(now) {
    const cx = camera.position;
    for (const f of figs) {
      const gy = f.lift ? ground(f.x, f.z) + f.lift : ground(f.x, f.z);
      const dist = Math.hypot(cx.x - f.x, cx.y - gy, cx.z - f.z);
      const vis = dist >= f.dmin && dist <= f.dmax && (!f.gate || f.gate());
      if (!vis) { if (f.mesh.visible) { f.mesh.visible = false; if (f.shadow) f.shadow.visible = false; f.show = 0 } f.box = null; continue; }
      if (!f.mesh.visible) { f.mesh.visible = true; if (f.shadow) f.shadow.visible = true; f.t0 = now }
      // cresce um pouco quando está longe, para continuar legível, mas sempre assente no mesmo ponto
      let k = 1;
      if (f.minPx) { const px = f.w * f.ar * ppuK / dist; if (px < f.minPx) k = Math.min(f.minPx / px, f.grow); }
      const grow = f.t0 ? clamp((now - f.t0) / 240, 0, 1) : 1;
      const w = f.w * k * (.88 + .12 * grow), h = w * f.ar;
      f.mesh.position.set(f.x, gy, f.z);
      f.mesh.scale.set(w, h, 1);
      f.mesh.rotation.y = Math.atan2(cx.x - f.x, cx.z - f.z);
      f.sc = w;
      if (f.shadow) { f.shadow.position.set(f.x, gy + .35, f.z); f.shadow.scale.set(w * .5, 1, w * .22); }
      if (f.btn) {
        f.mesh.updateMatrixWorld();
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, front = false;
        for (const c of pt4) { tmp.copy(c).applyMatrix4(f.mesh.matrixWorld); const p = project(tmp.x, tmp.y, tmp.z); if (p[2] < 1) front = true; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
        if (!front) { f.btn.style.display = 'none'; f.box = null; }
        else {
          const bw = Math.max(28, x1 - x0), bh = Math.max(28, y1 - y0);
          f.box = [(x0 + x1) / 2 - bw / 2, (y0 + y1) / 2 - bh / 2, bw, bh, dist];
          f.bx = (x0 + x1) / 2; f.by = y0; f.bb = y1;
        }
      }
    }
  }

  // zonas clicáveis: a mais próxima ganha, as que ficam escondidas por trás deixam de receber cliques
  function placeHits() {
    const list = figs.filter(f => f.btn && f.box).sort((a, b) => a.box[4] - b.box[4]), done = [];
    for (const f of list) {
      const b = f.box; let blocked = false;
      for (const t of done) {
        const ox = Math.min(b[0] + b[2], t[0] + t[2]) - Math.max(b[0], t[0]), oy = Math.min(b[1] + b[3], t[1] + t[3]) - Math.max(b[1], t[1]);
        if (ox <= 0 || oy <= 0) continue;
        // tem de sobrar uma faixa livre de 24 px, senão o alvo fica ambíguo
        const freeX = Math.max(t[0] - b[0], b[0] + b[2] - (t[0] + t[2])), freeY = Math.max(t[1] - b[1], b[1] + b[3] - (t[1] + t[3]));
        if (freeX < 24 && freeY < 24) { blocked = true; break; }
      }
      if (blocked) { f.btn.style.display = 'none'; continue; }
      done.push(b);
      f.btn.style.display = ''; f.btn.style.transform = `translate3d(${b[0].toFixed(1)}px,${b[1].toFixed(1)}px,0)`;
      f.btn.style.width = b[2].toFixed(0) + 'px'; f.btn.style.height = b[3].toFixed(0) + 'px';
    }
    for (const f of figs) if (f.btn && !f.box) f.btn.style.display = 'none';
  }

  // etiquetas: prioridade e colisão, para nunca ficar texto por cima de texto
  const taken = [];
  function updateLabels() {
    taken.length = 0;
    const all = [];
    for (const p of pins) { const gy = ground(p.x, p.z) + p.lift, s = project(p.x, gy, p.z); p.vis = !heroUp && s[2] < 1 && Math.abs(s[0] - vw / 2) < vw * .75 && Math.abs(s[1] - vh / 2) < vh * .75; if (p.vis) { p.sx = s[0]; p.sy = s[1]; p.dist = s[3]; p.scl = clamp(560 / s[3], .62, 1.12); all.push(p) } else if (p.on) { p.el.style.visibility = 'hidden'; p.on = false } }
    for (const l of labels) {
      const gy = ground(l.x, l.z) + l.lift, s = project(l.x, gy, l.z);
      l.vis = s[2] < 1 && s[3] >= l.dmin && s[3] <= l.dmax && Math.abs(s[0] - vw / 2) < vw * .8 && Math.abs(s[1] - vh / 2) < vh * .8;
      if (!l.vis) { if (l.on) { l.el.style.visibility = 'hidden'; l.on = false } continue; }
      l.sx = s[0]; l.sy = s[1]; l.dist = s[3];
      l.scl = l.el.classList.contains('vreg') ? clamp(1250 / s[3], .6, 1.6) : l.el.classList.contains('vsea') ? clamp(1500 / s[3], .8, 1.9) : clamp(380 / s[3], .8, 1.3);
      all.push(l);
    }
    all.sort((a, b) => (a.pri - b.pri) || (a.dist - b.dist));
    for (const it of all) {
      const isPin = it.el.classList.contains('vpin');
      if (!it.w0 || it.measured !== it.el.textContent) { it.w0 = it.el.offsetWidth || 60; it.h0 = it.el.offsetHeight || 20; it.measured = it.el.textContent; }
      const w = it.w0 * it.scl, h = it.h0 * it.scl;
      const cxp = it.sx, cyp = isPin ? it.sy - h / 2 : it.sy;
      const r = [cxp - w / 2 - 3, cyp - h / 2 - 3, cxp + w / 2 + 3, cyp + h / 2 + 3];
      let hit = false;
      for (const t of taken) if (r[0] < t[2] && r[2] > t[0] && r[1] < t[3] && r[3] > t[1]) { hit = true; break; }
      if (hit && it.pri > 0) { if (it.on) { it.el.style.visibility = 'hidden'; it.on = false } continue; }
      taken.push(r);
      if (!it.on) { it.el.style.visibility = ''; it.on = true }
      const fade = Math.min(it.dmin ? sstep(it.dmin, it.dmin + 110, it.dist) : 1, it.dmax < 1e4 ? 1 - sstep(it.dmax - 110, it.dmax, it.dist) : 1);
      it.el.style.opacity = fade.toFixed(2);
      it.el.style.zIndex = isPin ? 5000 - Math.round(it.dist) : 1500 - Math.round(it.dist / 2);
      it.el.style.transform = `translate3d(${it.sx.toFixed(1)}px,${it.sy.toFixed(1)}px,0) translate(-50%,${isPin ? '-100%' : '-50%'}) scale(${it.scl.toFixed(3)})`;
    }
    // balão e cartão seguem a figura
    if (!bub.hidden && bubF) {
      if (!bubF.mesh.visible || bubF.bx == null) bub.hidden = true;
      else { const bw = bub.offsetWidth, lim = panel.classList.contains('in') && !narrow.matches ? panel.offsetLeft - 12 : vw - 12, bx = clamp(bubF.bx, 12 + bw / 2, Math.max(12 + bw / 2, lim - bw / 2)); bub.style.transform = `translate3d(${bx.toFixed(1)}px,${(bubF.by - 8).toFixed(1)}px,0) translate(-50%,-100%)`; bub.style.zIndex = 7000; }
    }
    if (!lmCard.hidden && lmActive) {
      const f = lmActive.f;
      if (!f.mesh.visible || f.bx == null) hideLM();
      else if (narrow.matches) { lmCard.classList.add('sheet'); lmCard.style.transform = ''; lmCard.style.zIndex = 7000; }
      else {
        lmCard.classList.remove('sheet');
        const cw = lmCard.offsetWidth, ch = lmCard.offsetHeight;
        let x = clamp(f.bx - cw / 2, 12, vw - cw - 12), y = f.by - 14 - ch, below = false;
        if (y < 72) { y = f.bb + 14; below = true; if (y + ch > vh - 90) y = Math.max(72, f.by - 14 - ch), below = false; }
        lmCard.classList.toggle('below', below);
        lmCard.style.setProperty('--ax', clamp(f.bx - x, 24, cw - 24).toFixed(0) + 'px');
        lmCard.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`; lmCard.style.zIndex = 7000;
      }
    }
  }

  function frame(now) {
    raf = 0; if (!running) return;
    const dt = Math.min(60, now - (last || now)); last = now;
    const px = spx(), st = reduced ? staticState() : wpState(px);
    if (!explore) {
      tgt.x = st.x; tgt.z = st.z; tgt.d = st.d; tgt.p = st.p; tgt.h = st.h;
      const ns = st.mode === 'hold' ? st.stop : 0;
      if (ns !== activeStop) {
        activeStop = ns; hideLM();
        if (ns) {
          if (dismissed !== ns) showPanel(ns);
          const S0 = stops[ns - 1];
          if (out(S0.e)) { setPose('cheer', 0, 1400); setTimeout(() => { if (activeStop === ns && !lmActive) setPose('point', 0, 0) }, 1400); } else setPose('think');
          say(sayStop(S0), 7000);
          announce(S().live.replace('{a}', S0.e.n).replace('{b}', EPS.length).replace('{t}', tx(S0.e).t).replace('{p}', placeLine(S0.e)));
        } else { panel.classList.remove('in'); panel.setAttribute('aria-hidden', 'true'); dismissed = -1; }
      }
      if (st.mode === 'fly' && cam.pose !== 'walk' && !cam.hold) setPose('walk');
      if (st.mode === 'outro' && st.t > .3 && cam.pose !== 'wave') { setPose('wave', 0, 0); say(S().bye, 4000); }
      if (st.mode === 'intro' && st.t > .5 && !cam.introDone) { cam.introDone = true; setPose('wave', 0, 3000); say(S().hi, 5500); }
    }
    const k = reduced || !started ? 1 : 1 - Math.exp(-dt / 150); started = true;
    let moving = false;
    for (const key of ['x', 'z', 'd', 'p', 'h']) { const dv = tgt[key] - rig[key]; if (Math.abs(dv) > (key === 'd' ? .3 : .02)) { rig[key] += dv * k; moving = true } else rig[key] = tgt[key]; }
    const ph = rig.p * D2R, th = rig.h * D2R, gy = ground(rig.x, rig.z);
    camera.position.set(rig.x + Math.sin(th) * Math.cos(ph) * rig.d, gy + Math.sin(ph) * rig.d, rig.z + Math.cos(th) * Math.cos(ph) * rig.d);
    camera.lookAt(rig.x, gy, rig.z);
    { const open = panel.classList.contains('in') && !explore;
      const wx = open && !narrow.matches ? vw * .17 : 0, wy = open && narrow.matches ? vh * .15 : 0;
      shX += (wx - shX) * k; shY += (wy - shY) * k;
      if (Math.abs(wx - shX) > .5 || Math.abs(wy - shY) > .5) moving = true;
      if (Math.abs(shX) < .5 && Math.abs(shY) < .5) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); }
      else camera.setViewOffset(vw, vh, shX, shY, vw, vh);
    }
    camera.updateMatrixWorld();
    uni.uCam.value.copy(camera.position); uni.uTime.value = now / 1000;
    ppuK = vh / (2 * Math.tan(FOV * D2R / 2));
    const tsec = now / 1000;
    cl.forEach((c, i) => { if (!reduced) { c.x += c.vx * dt / 1000; if (c.x > 520) c.x = -520; if (c.x < -520) c.x = 520; } clouds[i].set(c.x, c.z, 34 + c.w * .4, .7); });
    ships.forEach(s => { if (!reduced) s.t = (s.t + s.sp * dt / 1000) % 2; const u = s.t < 1 ? s.t : 2 - s.t; s.f.x = lerp(s.a[0], s.b[0], u); s.f.z = lerp(s.a[1], s.b[1], u) + Math.sin(tsec * .9 + s.w) * .5; });
    // Camões reage no seu quadro
    if (st.mode !== 'fly' && cam.pose === 'walk' && !cam.hold) setPose(explore ? 'spy' : 'idle');
    if (cam.hold && now > cam.hold) { cam.hold = 0; setPose(explore ? 'spy' : (activeStop ? (out(stops[activeStop - 1].e) ? 'point' : 'think') : 'idle')); }
    if (!reduced && !explore && !lmActive && now - Math.max(cam.lastAct, lastScrollT) > 9000 && cam.pose !== 'write') setPose('write');
    updateFigs(now);
    if (!(frames % 3)) {
      const r = regionAt(rig.x, rig.z); if (r !== lastReg) { lastReg = r; uni.uActive.value = r; chipRg.textContent = REGNAMES[r] || ''; rail.querySelectorAll('button').forEach(b => { const on = +b.dataset.r === r; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'true' : 'false'); }); }
      compass.firstElementChild.style.transform = `rotate(${(-rig.h).toFixed(1)}deg)`; drawMini();
      const coreS = vh, coreE = total - vh, prog = reduced ? (manual ? manual / stops.length : 0) : clamp((px - coreS) / Math.max(1, coreE - coreS), 0, 1);
      const fill = q('[data-fill]'); if (fill) fill.style.width = (prog * 92).toFixed(1) + '%';
      if (pathMat) pathMat.uniforms.uProg.value = prog;
      time.querySelectorAll('.tn').forEach(b => { const on = +b.dataset.i === activeStop; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      chipEp.textContent = activeStop ? S().ep.replace('{a}', stops[activeStop - 1].e.n).replace('{b}', EPS.length) : '';
      chipEp.hidden = !activeStop;
      const heroO = reduced ? 0 : 1 - sstep(.12, .62, px / Math.max(1, vh)); heroUp = heroO > .5;
      const hb = heroO > .02 ? 'blur(' + (heroO * 12).toFixed(1) + 'px)' : '';
      hero.style.backdropFilter = hb; hero.style.webkitBackdropFilter = hb;
      hero.style.opacity = heroO.toFixed(2); hero.style.visibility = heroO < .02 ? 'hidden' : '';
      const hudO = reduced || explore ? 1 : (st.mode === 'intro' ? sstep(.5, .95, st.t) : st.mode === 'outro' ? 1 - sstep(.35, .85, st.t) : 1);
      hud.style.opacity = hudO.toFixed(2); hud.toggleAttribute('inert', hudO < .3);
    }
    root.classList.toggle('vg-sheet', panel.classList.contains('in') || !lmCard.hidden);
    renderer.render(scene, camera); placeHits(); updateLabels();
    frames++; if (!fpsT) fpsT = now;
    if (now - fpsT > 2500) { const fps = frames / ((now - fpsT) / 1000); if (fps < 26 && dpr > 1) { dpr = Math.max(1, dpr - .5); renderer.setPixelRatio(dpr); renderer.setSize(vw, vh, false); } frames = 0; fpsT = now; }
    if (running) { if (moving) raf = requestAnimationFrame(frame); else setTimeout(() => { if (running && !raf) raf = requestAnimationFrame(frame) }, reduced ? 400 : 33); }
  }

  // ---------- ligação à página
  new ResizeObserver(() => measure()).observe(stage);
  addEventListener('scroll', () => { lastScrollT = performance.now(); if (cam.pose === 'write') setPose('idle'); if (running && !explore) need(); }, { passive: true });
  new IntersectionObserver(es => { inView = es.some(e => e.isIntersecting); running = inView && !document.hidden; if (running) { last = 0; need(); } }, { rootMargin: '10% 0px' }).observe(track);
  document.addEventListener('visibilitychange', () => { running = inView && !document.hidden; if (running) { last = 0; need(); } });
  function refreshBtn() { btnEx.querySelector('.tx').textContent = explore ? S().exit : S().explore; }
  function refresh() {
    const lg = lang();
    buildTime();
    ocL.el.innerHTML = `<span>${S().ocean}</span>`; esL.el.innerHTML = `<span>${S().spain}</span>`; ocL.w0 = esL.w0 = 0;
    pins.forEach((p, i) => { const e = stops[i].e; p.el.setAttribute('aria-label', S().ep.replace('{a}', e.n).replace('{b}', EPS.length) + ': ' + tx(e).t + (out(e) ? '' : ', ' + S().fogl.replace('{d}', dshort(e)))); const c = p.el.querySelector('.cap'); if (c) c.textContent = out(e) ? tx(e).place || '' : S().fogl.replace('{d}', dshort(e)); p.w0 = 0; });
    lms.forEach(L => { const T = L.m[lg] || L.m.pt; L.btn.setAttribute('aria-label', T[0]); L.lbl.textContent = T[0]; });
    crit.forEach(c => c.f.btn.setAttribute('aria-label', S()[c.say]));
    q('[data-classic]').textContent = S().classic; q('[data-back]').textContent = '← ' + S().back;
    const b2 = q('[data-back2]'); if (b2) b2.querySelector('.tx').textContent = S().back2;
    refreshBtn(); tip.textContent = S().tip; compass.setAttribute('aria-label', S().north); rail.setAttribute('aria-label', S().reg);
    q('[data-skip]').textContent = S().skip; q('[data-list-h]').textContent = S().listh; q('[data-lm-h]').textContent = S().lmh; cue.querySelector('span').textContent = S().scroll;
    q('[data-zin]').setAttribute('aria-label', S().zin); q('[data-zout]').setAttribute('aria-label', S().zout); q('[data-rotl]').setAttribute('aria-label', S().rl); q('[data-rotr]').setAttribute('aria-label', S().rr);
    stage.setAttribute('aria-label', S().stage);
    lmCard.querySelector('.x').setAttribute('aria-label', S().close); if (lmActive) showLM(lmActive);
    q('[data-list]').innerHTML = EPS.map(e => { const o = out(e), X = tx(e); return `<li><a href="#${e.id}">${ROM[e.n] || e.n}. ${X.t}</a> <span>${o ? placeLine(e) : S().soonlist.replace('{d}', dshort(e))}</span></li>`; }).join('');
    q('[data-lm-list]').innerHTML = LM.map(m => `<li><b>${(m[lg] || m.pt)[0]}.</b> ${(m[lg] || m.pt)[1]}</li>`).join('');
    if (activeStop) showPanel(activeStop);
    need();
  }
  ctx.onRefresh = refresh;
  ctx.dbg = { renderer, figs, labels, pins, rig, cam, stops, camera, lms, setExplore, get activeStop() { return activeStop }, get total() { return total } };
  refresh(); measure();
  announce(S().live0);
  root.classList.add('vg-ready');
  return { measure, dispose() { running = false; renderer.dispose() } };
}
