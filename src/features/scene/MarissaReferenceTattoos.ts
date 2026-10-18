import * as THREE from 'three';
import skullUrl from './assets/marissa-skull-roses.png';

let design: HTMLCanvasElement | undefined;
let designTexture: THREE.CanvasTexture | undefined;
const skull = new Image();
skull.onerror = () => { throw new Error('Cannot load Marissa skull tattoo'); };
skull.src = skullUrl;

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
    c.save();c.scale(side,1);c.lineWidth=.18;
    for(let feather=0;feather<8;feather++){
      c.beginPath();c.moveTo(2.8+feather*.34,97-feather*.25);
      c.quadraticCurveTo(6,100-feather*.45,10.7-feather*.48,104-feather*1.12);
      c.quadraticCurveTo(10-feather*.48,99-feather*.65,4+feather*.28,94.5-feather*.12);
      c.quadraticCurveTo(3,95.5,2.8+feather*.34,97-feather*.25);c.stroke();
    }
    c.restore();
  }
  c.restore();
  // Preserve the supplied skull and roses; use a 192 x 256 ink stamp.
  const stamp = () => {
    const small = document.createElement('canvas');small.width=192;small.height=256;
    const ink=small.getContext('2d');if(!ink)throw new Error('Cannot prepare skull ink');
    ink.drawImage(skull,0,0,192,256);
    const pixels=ink.getImageData(0,0,192,256);
    for(let i=0;i<pixels.data.length;i+=4){
      const grey=(pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;
      pixels.data[i+3]*=(1-grey/255)*.88;
      pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=30;
    }
    ink.putImageData(pixels,0,0);
    c.save();c.translate(2.5,89);c.scale(1,-1);c.drawImage(small,0,0,13,28);c.restore();
    if(designTexture)designTexture.needsUpdate=true;
  };
  if(skull.complete && skull.naturalWidth)stamp();else skull.onload=stamp;
  // Left foot anchor and rope; right ankle fine chain.
  c.save();c.translate(9,5);c.lineWidth=.4;
  path([[0,3],[0,-3],[-3,-1],[-3,0]]);path([[0,-3],[3,-1],[3,0]]);path([[-1.8,1],[1.8,1]]);
  c.beginPath();c.arc(0,3.8,.75,0,Math.PI*2);c.stroke();c.restore();
  return design;
}

/** Interpolate ink coordinates on the skin, independently of overlapping UV islands. */
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
  const artwork=reference();
  model.traverse(n=>{
    if(!(n as THREE.Mesh).isMesh || !/^(body_(nude_)?(legs|feet|torso|panties)|body_bare_feet)/.test(n.name))return;
    const mesh=n as THREE.Mesh, geometry=mesh.geometry, pos=geometry.attributes.position, uv=geometry.attributes.uv;
    if(!uv)throw new Error(`Missing Marissa UVs: ${mesh.name}`);
    const transform=new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld);
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(!geometry.hasAttribute('marissaSurfaceInkPosition')) {
      const coordinates=new Float32Array(pos.count*4);
      for(let i=0;i<pos.count;i++){
        const point=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(transform);
        const height=(point.y-bounds.min.y)*scale;
        let x=point.x*scale, front=point.z*scale;
        // Unwrap arc length around the anatomical axis, so frontal ink does
        // not become an infinitely stretched stripe at a tangent to the skin.
        if(height>55 && height<95 || height>100){
          const bone=model.getObjectByName(height<95
            ? (point.x>0 ? 'leg_left_thigh' : 'leg_right_thigh') : 'spine_lower');
          if(!bone)throw new Error('Missing Marissa tattoo projection axis');
          const axis=bone.getWorldPosition(new THREE.Vector3()).applyMatrix4(inverse);
          const dx=(point.x-axis.x)*scale,dz=(point.z-axis.z)*scale;
          x=axis.x*scale+Math.atan2(dx,dz)*Math.hypot(dx,dz);
          front=dz;
        }
        coordinates.set([x,height,front,point.x*scale],i*4);
      }
      geometry.setAttribute('marissaSurfaceInkPosition',new THREE.BufferAttribute(coordinates,4));
    }
    if(!designTexture)designTexture=new THREE.CanvasTexture(artwork);
    for(const material of mats){
      const mat=material as THREE.MeshStandardMaterial;
      if(!mat.userData.__ownedCharacterMaterial)throw new Error(`Unowned Marissa skin material: ${mesh.name}`);
      mat.onBeforeCompile=shader=>{
        shader.uniforms.marissaInk={value:designTexture};
        shader.vertexShader='attribute vec4 marissaSurfaceInkPosition; varying vec4 vMarissaInk;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMarissaInk=marissaSurfaceInkPosition;');
        shader.fragmentShader='uniform sampler2D marissaInk; varying vec4 vMarissaInk;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float ink=0.0;
          if(vMarissaInk.z>0.0){
            vec2 inkUV=vec2(0.5+vMarissaInk.x/102.4,vMarissaInk.y/204.8);
            ink=texture2D(marissaInk,inkUV).a;
          }
          // Full circumference for the right thigh band and ankle chains.
          if((vMarissaInk.w<0.0&&vMarissaInk.y>61.0&&vMarissaInk.y<65.0)||
             (vMarissaInk.y>9.0&&vMarissaInk.y<10.0))ink=0.7;
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.01298),ink);
        `);
      };
      mat.customProgramCacheKey=()=> 'marissa-reference-ink';
      mat.needsUpdate=true;
    }
  });
}
