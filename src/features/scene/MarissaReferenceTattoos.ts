import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();
let design: HTMLCanvasElement | undefined;

/** Front reference in anatomical coordinates: positive X is her left. */
function reference() {
  if (design) return design;
  design = document.createElement('canvas');
  design.width = 1024; design.height = 2048;
  const c = design.getContext('2d');
  if (!c) throw new Error('Cannot draw Marissa reference tattoos');
  // Centimetres in the rest pose, with the floor at zero.
  c.translate(512, 2048); c.scale(10, -10);
  c.strokeStyle = 'rgba(29,31,35,.72)'; c.fillStyle = 'rgba(29,31,35,.72)'; c.lineWidth = .22;
  const path = (points: number[][], close = false) => {
    c.beginPath(); points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));
    if(close)c.closePath(); c.stroke();
  };
  const text = (x:number,y:number,lines:string[],size:number) => {
    c.save(); c.translate(x,y); c.scale(1,-1);
    c.font = `bold ${size}px Georgia, serif`; c.textAlign='center';
    lines.forEach((line,i)=>c.fillText(line,0,i*size*1.15)); c.restore();
  };
  // Right thigh, above the knee band. Preserve the user's four-line wording.
  text(-9,83,['Beauty','has','beauty','does'],2.3);
  // Left shin, the exact wording supplied by the user.
  text(9,35,['Destroy what','destroy you'],1.55);
  // Diamond and feathered wings across the lower abdomen.
  c.save(); c.translate(0,13);
  path([[-3,97],[0,94],[3,97],[1.7,99],[-1.7,99]],true);
  path([[-3,97],[3,97],[0,94],[-1.7,99],[1.7,99],[0,94]]);
  for(const side of [-1,1]) {
    path([[side*3,97],[side*7,98],[side*13,104],[side*12,99],[side*8,94],[side*4,95]],true);
    for(let feather=0;feather<8;feather++) {
      const x=4+feather; path([[side*3,97],[side*x,96+feather*.8],[side*(x+1),98+feather*.8]]);
    }
  }
  c.restore();
  // Left thigh: shaded skull, jaw, serpent coils and pointed leaves.
  c.save(); c.translate(9,75);
  c.beginPath();c.ellipse(0,0,4.6,5.7,0,0,Math.PI*2);c.stroke();
  for(const x of [-2,2]){c.beginPath();c.ellipse(x,.6,1.4,1.6,x*.2,0,Math.PI*2);c.fill();}
  c.beginPath();c.moveTo(0,-.5);c.lineTo(-.8,-2);c.lineTo(.8,-2);c.closePath();c.fill();
  path([[-3,-3],[-2.6,-6],[2.6,-6],[3,-3]]);
  for(let tooth=-2;tooth<=2;tooth++)path([[tooth,-3],[tooth,-5.8]]);
  c.lineWidth=.55;
  c.beginPath();c.moveTo(2,13);c.bezierCurveTo(-6,12,6,8,-1,6);c.bezierCurveTo(-8,4,8,-3,3,-8);c.bezierCurveTo(-5,-14,-7,-5,0,-7);c.stroke();
  c.beginPath();c.ellipse(2,13,1.8,.9,-.4,0,Math.PI*2);c.stroke();
  for(const side of [-1,1]) for(let i=0;i<5;i++)path([[side*4,-5+i*2],[side*6,-3+i*2],[side*4.5,-1+i*2]],true);
  c.restore();
  // Left foot anchor and rope; right ankle fine chain.
  c.save();c.translate(9,5);c.lineWidth=.4;
  path([[0,3],[0,-3],[-3,-1],[-3,0]]);path([[0,-3],[3,-1],[3,0]]);path([[-1.8,1],[1.8,1]]);
  c.beginPath();c.arc(0,3.8,.75,0,Math.PI*2);c.stroke();c.restore();
  return design;
}

/** Rasterize the same frontal design into each skin's own UVs, including bare feet. */
export function applyMarissaReferenceTattoos(model: THREE.Object3D) {
  // Character setup recentres the hips immediately before styling. Unlike
  // updateWorldMatrix, updateMatrixWorld also refreshes SkinnedMesh.bindMatrixInverse.
  model.updateWorldMatrix(true, false);
  model.updateMatrixWorld(true);
  model.traverse(n=>{if((n as THREE.SkinnedMesh).isSkinnedMesh)(n as THREE.SkinnedMesh).skeleton.update();});
  const inverse = model.matrixWorld.clone().invert();
  const bounds = new THREE.Box3();
  model.traverse(n=>{if((n as THREE.Mesh).isMesh && (n.name==='face'||n.name.startsWith('body_nude_feet'))) {
    const m=n as THREE.Mesh, p=m.geometry.attributes.position;
    for(let i=0;i<p.count;i++)bounds.expandByPoint(m.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(m.matrixWorld).applyMatrix4(inverse));
  }});
  if(bounds.isEmpty())throw new Error('Missing Marissa anatomical reference meshes');
  const scale=173.4/(bounds.max.y-bounds.min.y);
  const art=reference().getContext('2d')!.getImageData(0,0,1024,2048).data;
  model.traverse(n=>{
    if(!(n as THREE.Mesh).isMesh || !/^(body_(nude_)?(legs|feet|torso|panties)|body_bare_feet)/.test(n.name))return;
    const mesh=n as THREE.Mesh, geometry=mesh.geometry, pos=geometry.attributes.position, uv=geometry.attributes.uv;
    if(!uv)throw new Error(`Missing Marissa UVs: ${mesh.name}`);
    const transform=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    mats.forEach((material,slot)=>{
      const mat=material as THREE.MeshStandardMaterial, base=mat.map;
      if(!base?.image)throw new Error(`Missing Marissa skin: ${mesh.name}`);
      const key=`${mesh.name}:${slot}:${base.uuid}`;
      const cached=cache.get(key);if(cached){mat.map=cached;return;}
      const image=base.image as HTMLImageElement;
      const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Cannot project Marissa tattoos');
      ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
      const index=geometry.index, count=index?index.count:pos.count;
      for(let i=0;i<count;i+=3){
        if(geometry.groups.length&&!geometry.groups.some(g=>g.materialIndex===slot&&i>=g.start&&i<g.start+g.count))continue;
        const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j);
        const p=ids.map(j=>mesh.getVertexPosition(j,new THREE.Vector3()).applyMatrix4(transform));
        const t=ids.map(j=>[uv.getX(j)*canvas.width,uv.getY(j)*canvas.height]);
        const ax=t[1][0]-t[0][0],ay=t[1][1]-t[0][1],bx=t[2][0]-t[0][0],by=t[2][1]-t[0][1],det=ax*by-ay*bx;
        if(!det)continue;
        for(let y=Math.max(0,Math.floor(Math.min(...t.map(v=>v[1]))));y<Math.min(canvas.height,Math.ceil(Math.max(...t.map(v=>v[1]))));y++)
        for(let x=Math.max(0,Math.floor(Math.min(...t.map(v=>v[0]))));x<Math.min(canvas.width,Math.ceil(Math.max(...t.map(v=>v[0]))));x++){
          const dx=x+.5-t[0][0],dy=y+.5-t[0][1],a=(dx*by-dy*bx)/det,b=(ax*dy-ay*dx)/det;
          if(a<0||b<0||a+b>1)continue;
          const point=p[0].clone().addScaledVector(new THREE.Vector3().subVectors(p[1],p[0]),a).addScaledVector(new THREE.Vector3().subVectors(p[2],p[0]),b);
          const cx=point.x*scale,cy=(point.y-bounds.min.y)*scale;
          let alpha=0;
          // Bands wrap around the limbs; the other motifs face forward (+Z).
          if((cx<0&&cy>61&&cy<65)||(cy>9&&cy<10))alpha=.7;
          else if(point.z>0){
            const sx=Math.floor(512+cx*10),sy=Math.floor(2048-cy*10);
            if(sx>=0&&sx<1024&&sy>=0&&sy<2048)alpha=art[(sy*1024+sx)*4+3]/255;
          }
          if(!alpha)continue;
          const offset=(y*canvas.width+x)*4;
          for(let channel=0;channel<3;channel++)pixels.data[offset+channel]=pixels.data[offset+channel]*(1-alpha)+30*alpha;
        }
      }
      ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
      cache.set(key,texture);mat.map=texture;mat.needsUpdate=true;
    });
  });
}
