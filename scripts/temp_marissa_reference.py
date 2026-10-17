from pathlib import Path
p=Path('src/features/scene/MarissaReferenceTattoos.ts')
s=p.read_text().replace('const cache = new Map<string, THREE.CanvasTexture>();\n','').replace('const repaints: Array<() => void> = [];\n','').replace('let skullLoaded = false;\n','').replace('    skullLoaded=true;\n','').replace('    repaints.splice(0).forEach(paint=>paint());\n','')
s=s.replace('/** Rasterize the same frontal design into each skin\'s own UVs, including bare feet. */','/** Interpolate ink coordinates on the skin, independently of overlapping UV islands. */')
a=s.index('    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];')
s=s[:a]+'''    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    if(!geometry.hasAttribute('marissaInkPosition')) {
      const coordinates=new Float32Array(pos.count*3);
      for(let i=0;i<pos.count;i++){
        const point=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(transform);
        coordinates.set([point.x*scale,(point.y-bounds.min.y)*scale,point.z],i*3);
      }
      geometry.setAttribute('marissaInkPosition',new THREE.BufferAttribute(coordinates,3));
    }
    if(!designTexture)designTexture=new THREE.CanvasTexture(artwork);
    for(const material of mats){
      const mat=material as THREE.MeshStandardMaterial;
      mat.onBeforeCompile=shader=>{
        shader.uniforms.marissaInk={value:designTexture};
        shader.vertexShader='attribute vec3 marissaInkPosition; varying vec3 vMarissaInk;\\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\nvMarissaInk=marissaInkPosition;');
        shader.fragmentShader='uniform sampler2D marissaInk; varying vec3 vMarissaInk;\\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
          float ink=0.0;
          if(vMarissaInk.z>0.0){
            vec2 inkUV=vec2(0.5+vMarissaInk.x/102.4,vMarissaInk.y/204.8);
            ink=texture2D(marissaInk,inkUV).a;
          }
          // Full circumference for the right thigh band and ankle chains.
          if((vMarissaInk.x<0.0&&vMarissaInk.y>61.0&&vMarissaInk.y<65.0)||
             (vMarissaInk.y>9.0&&vMarissaInk.y<10.0))ink=0.7;
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.01298),ink);
        `);
      };
      mat.customProgramCacheKey=()=> 'marissa-reference-ink';
      mat.needsUpdate=true;
    }
  });
}
'''
p.write_text(s)
p=Path('scripts/temp_marissa_reference.mjs');s=p.read_text();a=s.index('          const sample=m=>{');b=s.index('\n        }\n        scene.scale',a)
s=s[:a]+'''          const actual=scene.getObjectByName(name),expected=reference.getObjectByName(name);
          const a=actual.geometry.getAttribute('marissaInkPosition').array;
          const b=expected.geometry.getAttribute('marissaInkPosition').array;
          if(a.some((v,i)=>Math.abs(v-b[i])>1e-4))throw Error(`Marissa ink coordinates changed after recentring: ${name}`);
          if(actual.material.customProgramCacheKey()!=='marissa-reference-ink')throw Error(`Missing ink shader: ${name}`);'''+s[b:]
s=s.replace("['marissa','delphina'].every(style", "['delphina'].every(style")
s=s.replace("  await page.waitForFunction(()=>window.laraChecks.entries.find(e=>e.style==='marissa').scene.getObjectByName('body_legs').material.map.version>1);\n",'')
s=s.replace("    const scene=entries.find(e=>e.style==='marissa').scene;", "    const scene=entries.find(e=>e.style==='marissa').scene;",1)
p.write_text(s)
