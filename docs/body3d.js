/* A procedural 3D body for the "Show me" panels, drawn with three.js.
   index.html solves each pose in 2D (side view); this file turns the joints into a shaded 3D body,
   colours the working muscles, adds the equipment, and draws it onto a 2D canvas from any camera angle. */
import * as THREE from "./vendor/three.module.min.js";

const W = 640, H = 400;
const V = (x,y,z) => new THREE.Vector3(x,y,z);
const UP = V(0,1,0);
let G = null;

// Radius along a limb, 0 = start joint, 1 = end joint (smoothly interpolated).
function prof(pts){
  return t => {
    if(t <= pts[0][0]) return pts[0][1];
    for(let i=1;i<pts.length;i++){
      if(t <= pts[i][0]){ const [t0,r0]=pts[i-1], [t1,r1]=pts[i], u=(t-t0)/(t1-t0), s=u*u*(3-2*u); return r0+(r1-r0)*s }
    }
    return pts[pts.length-1][1];
  };
}
const UA = prof([[0,2.6],[.25,3.1],[.55,3.1],[.85,2.4],[1,2.0]]);
const FA = prof([[0,2.1],[.25,2.6],[.6,2.0],[1,1.4]]);
const TH = prof([[0,4.8],[.3,5.2],[.65,4.3],[1,3.2]]);
const SH = prof([[0,3.2],[.28,3.7],[.55,3.0],[1,1.9]]);
const TO = prof([[0,4.2],[.12,4.4],[.4,3.8],[.68,4.9],[.9,4.7],[1,3.4]]);

function lathe(rf, t0, t1, off, phiStart=0, phiLen=Math.PI*2){
  const pts=[]; for(let i=0;i<=14;i++){ const t=t0+(t1-t0)*i/14; pts.push(new THREE.Vector2(Math.max(rf(t)+off,.05), t)) }
  return new THREE.LatheGeometry(pts, 28, phiStart, phiLen);
}
function radialTexture(alpha){
  const c=document.createElement("canvas"); c.width=c.height=128; const x=c.getContext("2d");
  const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,`rgba(0,0,0,${alpha})`); g.addColorStop(1,"rgba(0,0,0,0)");
  x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c);
}

export function init(){
  if(G) return;
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:"low-power"});
  renderer.setPixelRatio(1); renderer.setSize(W,H,false); renderer.setClearColor(0x000000,0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, W/H, 10, 900);
  scene.add(new THREE.HemisphereLight(0xffffff,0x8a97a6,1.05));
  const key = new THREE.DirectionalLight(0xffffff,1.9); key.position.set(70,120,110); scene.add(key);
  const rim = new THREE.DirectionalLight(0xb5c8ff,.8); rim.position.set(-80,60,-110); scene.add(rim);

  const skin = new THREE.MeshStandardMaterial({color:0xd9b394, roughness:.62});
  const mk = (color) => new THREE.MeshStandardMaterial({color, roughness:.48, polygonOffset:true, polygonOffsetFactor:-1, polygonOffsetUnits:-1});
  const matMain = mk(0xd8352a), matAlso = mk(0xf0a93e);
  const ridge = new THREE.MeshStandardMaterial({color:0x8c2a22, roughness:.7});
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); scene.add(m); return m };
  const sphere = new THREE.SphereGeometry(1,24,16);
  const cyl = r => { const g = new THREE.CylinderGeometry(r,r,1,14); g.translate(0,.5,0); return g };

  const B = {renderer, scene, camera, matMain, matAlso, ridge, skin, sphere, cyl, add};
  B.torso = add(lathe(TO,0,1,0), skin);
  B.neck = add(cyl(2.1), skin);
  B.head = add(sphere, skin); B.nose = add(sphere, skin);
  B.hair = add(sphere, new THREE.MeshStandardMaterial({color:0x4b3a2e, roughness:.8}));
  B.sh = [0,1].map(()=>add(sphere,skin)); B.el = [0,1].map(()=>add(sphere,skin)); B.hd = [0,1].map(()=>add(sphere,skin));
  B.ua = [0,1].map(()=>add(lathe(UA,0,1,0),skin)); B.fa = [0,1].map(()=>add(lathe(FA,0,1,0),skin));
  B.hp = [0,1].map(()=>add(sphere,skin)); B.kn = [0,1].map(()=>add(sphere,skin)); B.an = [0,1].map(()=>add(sphere,skin)); B.ft = [0,1].map(()=>add(sphere,skin));
  B.th = [0,1].map(()=>add(lathe(TH,0,1,0),skin)); B.sk = [0,1].map(()=>add(lathe(SH,0,1,0),skin));
  // Muscle overlays, one set per group; each is a slightly larger shell over the skin.
  const front = (c,w) => [c-w, 2*w], PI = Math.PI;
  B.ov = {
    delt:[0,1].map(()=>add(sphere,matMain)),
    arm:[0,1].map(()=>add(lathe(UA,.1,.95,.38),matMain)),
    fore:[0,1].map(()=>add(lathe(FA,.05,.9,.32),matMain)),
    chest:[add(lathe(TO,.5,.9,.4,...front(PI/2,1.0)),matMain)],
    back:[add(lathe(TO,.28,.92,.4,...front(-PI/2,1.3)),matMain)],
    core:[add(lathe(TO,.06,.5,.32,...front(PI/2,.85)),matMain)],
    glute:[0,1].map(()=>add(sphere,matMain)),
    thigh:[0,1].map(()=>add(lathe(TH,.1,.95,.4),matMain)),
    calf:[0,1].map(()=>add(lathe(SH,.08,.8,.34),matMain))
  };
  B.ridges = [0,1,2].map(()=>add(new THREE.BoxGeometry(.5,.35,3.6), ridge));
  // Equipment.
  const blue = new THREE.MeshStandardMaterial({color:0x2f45c8, roughness:.4, metalness:.2});
  const wood = new THREE.MeshStandardMaterial({color:0x9b8c7c, roughness:.8});
  const wallMat = new THREE.MeshStandardMaterial({color:0xcfd6d3, roughness:.9, transparent:true, opacity:.4, depthWrite:false});
  B.bar = {top:add(cyl(.9),blue), l:add(cyl(.8),blue), r:add(cyl(.8),blue)};
  B.par = [0,1].map(()=>({rail:add(cyl(1.1),blue), a:add(cyl(.6),blue), b:add(cyl(.6),blue)}));
  B.chair = {seat:add(new THREE.BoxGeometry(1,1,1),wood), legs:[0,1,2,3].map(()=>add(new THREE.BoxGeometry(1,1,1),wood))};
  B.wall = add(new THREE.BoxGeometry(1,1,1), wallMat);
  const sh1 = new THREE.MeshBasicMaterial({map:radialTexture(.42), transparent:true, depthWrite:false});
  const sh2 = new THREE.MeshBasicMaterial({map:radialTexture(.1), transparent:true, depthWrite:false});
  B.shadow = add(new THREE.PlaneGeometry(1,1), sh1); B.floor = add(new THREE.PlaneGeometry(1,1), sh2);
  [B.shadow,B.floor].forEach(m=>{ m.rotation.x=-PI/2 });
  G = B;
}

function place(mesh, a, b){
  const d = b.clone().sub(a), len = d.length() || .001;
  mesh.position.copy(a); mesh.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1/len)); mesh.scale.set(1,len,1);
}
function orient(mesh, pos, X, Y, Z, scale){
  mesh.position.copy(pos); mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z)); mesh.scale.copy(scale);
}
const ball = (m, p, r) => { m.position.copy(p); m.scale.set(r,r,r) };

// st: {S (solved joints, 2D), dx, dy (placement), P (pose with fc, sp, p), mu ({main, also}), az (camera angle, radians)}
export function draw(canvas, st){
  const B = G, {S,dx,dy,P,mu} = st;
  const w = p => V(p[0]+dx-80, 91-(p[1]+dy), 0);
  const N=w(S.n), Hp=w(S.hip), E0=w(S.el), Hd0=w(S.hand), K0=w(S.kn), F0=w(S.ft), Hh=w(S.head);
  const K1 = S.k2 ? w(S.k2) : K0, F1 = S.f2 ? w(S.f2) : F0;
  // Which way the chest faces: a quarter turn from the hip-to-neck direction, flipped by pose.fc.
  const ux=S.n[0]-S.hip[0], uy=S.n[1]-S.hip[1], fc=P.fc||1;
  const f3 = V(-uy*fc, -ux*fc, 0).normalize();
  const Y = N.clone().sub(Hp).normalize(), X = f3.clone().sub(Y.clone().multiplyScalar(f3.dot(Y))).normalize(), Z = X.clone().cross(Y);
  const len = N.distanceTo(Hp);
  orient(B.torso, Hp, X, Y, Z, V(.85,len,1.5));
  [B.ov.chest[0], B.ov.back[0], B.ov.core[0]].forEach(m=>orient(m, Hp, X, Y, Z, V(.85,len,1.5)));
  // Head, neck and a nose so the camera angle reads.
  const hy = Hh.clone().sub(N).normalize(), hx = f3.clone().sub(hy.clone().multiplyScalar(f3.dot(hy))).normalize(), hz = hx.clone().cross(hy);
  orient(B.head, Hh, hx, hy, hz, V(4.7,5.6,4.3));
  ball(B.nose, Hh.clone().addScaledVector(hx,4.6).addScaledVector(hy,-.4), .95);
  orient(B.hair, Hh.clone().addScaledVector(hy,1.1).addScaledVector(hx,-.7), hx, hy, hz, V(4.9,5.2,4.5));
  place(B.neck, N, N.clone().lerp(Hh,.62));
  // Arms: both in the pose's plane, a shoulder width apart.
  const armZ = [7.2,-7.2], hipZ = [3.8,-3.8], phi = (P.sp||0)*Math.PI/180;
  for(let i=0;i<2;i++){
    const z = V(0,0,armZ[i]), sh = N.clone().add(z), el = E0.clone().add(z), hd = Hd0.clone().add(z);
    place(B.ua[i], sh, el); place(B.fa[i], el, hd);
    ball(B.sh[i], sh, 3.1); ball(B.el[i], el, 2.2); ball(B.hd[i], hd, 1.9);
    place(B.ov.arm[i], sh, el); place(B.ov.fore[i], el, hd);
    ball(B.ov.delt[i], sh.clone().add(V(0,0,armZ[i]>0?.4:-.4)), 3.7);
    // Legs: the far leg follows l2 when the pose has one; spread legs fan out sideways.
    const hz0 = V(0,0,hipZ[i]), hip = Hp.clone().add(hz0), s = i ? 1 : 0;
    const kn = i ? K1 : K0, an = i ? F1 : F0, sg = i ? -1 : 1;
    const fan = p => { const d = p.clone().sub(Hp), l = d.length(); return Hp.clone().add(hz0).add(V(d.x*Math.cos(phi), d.y*Math.cos(phi), sg*l*Math.sin(phi))) };
    const k = fan(kn), a = fan(an);
    place(B.th[i], hip, k); place(B.sk[i], k, a);
    ball(B.hp[i], hip, 4.5); ball(B.kn[i], k, 3.4); ball(B.an[i], a, 2.1);
    place(B.ov.thigh[i], hip, k); place(B.ov.calf[i], k, a);
    ball(B.ov.glute[i], hip.clone().addScaledVector(f3,-1.8).add(V(0,0,0)), 4.9);
    orient(B.ft[i], a.clone().addScaledVector(f3,2.4).add(V(0,-.5,0)), f3, UP, f3.clone().cross(UP), V(4.2,1.7,2.2));
  }
  // Muscles: show the groups this exercise works, main in red and supporting in amber.
  Object.entries(B.ov).forEach(([k,list])=>{
    const on = mu.main.includes(k) || mu.also.includes(k), mat = mu.main.includes(k) ? B.matMain : B.matAlso;
    list.forEach(m=>{ m.visible = on; m.material = mat });
  });
  const core = mu.main.includes("core") || mu.also.includes("core");
  B.ridges.forEach((m,i)=>{
    m.visible = core; const t = .16+.12*i;
    orient(m, Hp.clone().addScaledVector(Y,t*len).addScaledVector(X,TO(t)*.85+.5), X, Y, Z, V(1,1,1));
  });
  // Equipment, placed from where the hands are.
  const hand = Hd0, props = P.p || [];
  const has = k => props.find(p=>p[0]===k);
  const bar = has("bar"), sup = has("sup"), wall = has("wall");
  B.bar.top.visible = B.bar.l.visible = B.bar.r.visible = !!bar;
  if(bar){
    const y = hand.y, x = hand.x;
    B.bar.top.position.set(x,y,-32); B.bar.top.rotation.set(Math.PI/2,0,0); B.bar.top.scale.set(1,64,1);
    [B.bar.l,B.bar.r].forEach((m,i)=>{ m.position.set(x,0,i?32:-32); m.scale.set(1,y,1) });
  }
  B.par.forEach((p,i)=>{
    const on = !!sup && sup[1]==="par"; p.rail.visible = p.a.visible = p.b.visible = on;
    if(on){ const y = hand.y-1.4, z = armZ[i], x = hand.x;
      p.rail.position.set(x-13,y,z); p.rail.rotation.set(0,0,-Math.PI/2); p.rail.scale.set(1,26,1);
      p.a.position.set(x-11,0,z); p.a.scale.set(1,y,1); p.b.position.set(x+11,0,z); p.b.scale.set(1,y,1) }
  });
  const chair = !!sup && sup[1]==="chair"; B.chair.seat.visible = chair; B.chair.legs.forEach(l=>l.visible = chair);
  if(chair){ const y = hand.y-1.3, x = hand.x;
    B.chair.seat.position.set(x,y,0); B.chair.seat.scale.set(30,2.6,32);
    B.chair.legs.forEach((l,i)=>{ l.position.set(x+(i&1?12:-12), (y-1.3)/2, i&2?13:-13); l.scale.set(2,y-1.3,2) }) }
  B.wall.visible = !!wall;
  if(wall){ const mx = Math.max(...[N,Hp,E0,Hd0,K0,F0,Hh,K1,F1].map(p=>p.x))+5; B.wall.position.set(mx,46,0); B.wall.scale.set(2,96,70) }
  const mid = (Math.min(N.x,Hp.x,K0.x,F0.x,Hd0.x,Hh.x)+Math.max(N.x,Hp.x,K0.x,F0.x,Hd0.x,Hh.x))/2;
  B.shadow.position.set(mid,.1,0); B.shadow.scale.set(90,50,1);
  B.floor.position.set(mid,.05,0); B.floor.scale.set(260,170,1);
  // The camera orbits the middle of the figure and backs off to fit it; az 0 is a side view, 90 degrees from the front.
  const az = st.az, el = .2, fit = st.fit, R = (fit.ext/2)/Math.tan(13*Math.PI/180);
  B.camera.position.set(fit.cx+Math.sin(az)*Math.cos(el)*R, fit.cy+Math.sin(el)*R, Math.cos(az)*Math.cos(el)*R);
  B.camera.lookAt(fit.cx,fit.cy,0);
  B.renderer.render(B.scene, B.camera);
  const ctx = canvas.getContext("2d"); ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(B.renderer.domElement, 0, 0, canvas.width, canvas.height);
}
