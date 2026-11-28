import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{a as t}from"./useAnimPreviewStore-ChAa9W6w.js";import{$c as n,$s as r,Rl as i,_l as a,au as o,bu as s,du as c,ou as l,vs as u,xs as d}from"./AppConsole-zYBgqUnu.js";var f=e(s());function p(e,t,r,a){var s=class extends i{constructor(n){super({vertexShader:t,fragmentShader:r,...n});for(let t in e)this.uniforms[t]=new o(e[t]),Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(e){this.uniforms[t].value=e}});this.uniforms=l.clone(this.uniforms),a?.(this)}};return s.key=n.generateUUID(),s}var m=p({cellSize:.5,sectionSize:1,fadeDistance:100,fadeStrength:1,fadeFrom:1,cellThickness:.5,sectionThickness:1,cellColor:new r,sectionColor:new r,infiniteGrid:!1,followCamera:!1,worldCamProjPosition:new c,worldPlanePosition:new c},`
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform vec3 worldPlanePosition;
    uniform float fadeDistance;
    uniform bool infiniteGrid;
    uniform bool followCamera;

    void main() {
      localPosition = position.xzy;
      if (infiniteGrid) localPosition *= 1.0 + fadeDistance;
      
      worldPosition = modelMatrix * vec4(localPosition, 1.0);
      if (followCamera) {
        worldPosition.xyz += (worldCamProjPosition - worldPlanePosition);
        localPosition = (inverse(modelMatrix) * worldPosition).xyz;
      }

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,`
    varying vec3 localPosition;
    varying vec4 worldPosition;

    uniform vec3 worldCamProjPosition;
    uniform float cellSize;
    uniform float sectionSize;
    uniform vec3 cellColor;
    uniform vec3 sectionColor;
    uniform float fadeDistance;
    uniform float fadeStrength;
    uniform float fadeFrom;
    uniform float cellThickness;
    uniform float sectionThickness;

    float getGrid(float size, float thickness) {
      vec2 r = localPosition.xz / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y) + 1.0 - thickness;
      return 1.0 - min(line, 1.0);
    }

    void main() {
      float g1 = getGrid(cellSize, cellThickness);
      float g2 = getGrid(sectionSize, sectionThickness);

      vec3 from = worldCamProjPosition*vec3(fadeFrom);
      float dist = distance(from, worldPosition.xyz);
      float d = 1.0 - min(dist / fadeDistance, 1.0);
      vec3 color = mix(cellColor, sectionColor, min(1.0, sectionThickness * g2));

      gl_FragColor = vec4(color, (g1 + g2) * pow(d, fadeStrength));
      gl_FragColor.a = mix(0.75 * gl_FragColor.a, gl_FragColor.a, g2);
      if (gl_FragColor.a <= 0.0) discard;

      #include <tonemapping_fragment>
      #include <${parseInt(`186`.replace(/\D+/g,``))>=154?`colorspace_fragment`:`encodings_fragment`}>
    }
  `),h=f.forwardRef(({args:e,cellColor:n=`#000000`,sectionColor:r=`#2080ff`,cellSize:i=.5,sectionSize:o=1,followCamera:s=!1,infiniteGrid:l=!1,fadeDistance:p=100,fadeStrength:h=1,fadeFrom:g=1,cellThickness:_=.5,sectionThickness:v=1,side:y=1,...b},x)=>{u({GridMaterial:m});let S=f.useRef(null);f.useImperativeHandle(x,()=>S.current,[]);let C=new a,w=new c(0,1,0),T=new c(0,0,0);d(e=>{C.setFromNormalAndCoplanarPoint(w,T).applyMatrix4(S.current.matrixWorld);let t=S.current.material,n=t.uniforms.worldCamProjPosition,r=t.uniforms.worldPlanePosition;C.projectPoint(e.camera.position,n.value),r.value.set(0,0,0).applyMatrix4(S.current.matrixWorld)});let E={cellSize:i,sectionSize:o,cellColor:n,sectionColor:r,cellThickness:_,sectionThickness:v},D={fadeDistance:p,fadeStrength:h,fadeFrom:g,infiniteGrid:l,followCamera:s};return f.createElement(`mesh`,t({ref:S,frustumCulled:!1},b),f.createElement(`gridMaterial`,t({transparent:!0,"extensions-derivatives":!0,side:y},E,D)),f.createElement(`planeGeometry`,{args:e}))});export{h as t};