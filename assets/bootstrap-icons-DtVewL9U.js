import{Cc as e,Cs as t,Dc as n,Ga as r,Il as i,Ll as a,Ml as o,Oc as s,Rl as c,Tc as l,Ua as u,Ul as d,Us as f,Va as p,Xs as m,Ya as h,Zs as g,_a as _,_u as v,bs as y,da as b,fs as x,ga as ee,hl as te,kc as S,lc as C,ma as w,ms as ne,mu as T,oc as E,rs as D,sl as O,tc as k,ul as A,vl as j,wa as re}from"./app-DLARg_8r.js";var ie=w>=125?`uv1`:`uv2`,ae=new x,M=new a,N=class extends m{constructor(){super(),this.isLineSegmentsGeometry=!0,this.type=`LineSegmentsGeometry`,this.setIndex([0,2,1,2,3,1,2,4,3,4,5,3,4,6,5,6,7,5]),this.setAttribute(`position`,new f([-1,2,0,1,2,0,-1,1,0,1,1,0,-1,0,0,1,0,0,-1,-1,0,1,-1,0],3)),this.setAttribute(`uv`,new f([-1,2,1,2,-1,1,1,1,-1,-1,1,-1,-1,-2,1,-2],2))}applyMatrix4(e){let t=this.attributes.instanceStart,n=this.attributes.instanceEnd;return t!==void 0&&(t.applyMatrix4(e),n.applyMatrix4(e),t.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}setPositions(e){let t;e instanceof Float32Array?t=e:Array.isArray(e)&&(t=new Float32Array(e));let n=new g(t,6,1);return this.setAttribute(`instanceStart`,new k(n,3,0)),this.setAttribute(`instanceEnd`,new k(n,3,3)),this.computeBoundingBox(),this.computeBoundingSphere(),this}setColors(e,t=3){let n;e instanceof Float32Array?n=e:Array.isArray(e)&&(n=new Float32Array(e));let r=new g(n,t*2,1);return this.setAttribute(`instanceColorStart`,new k(r,t,0)),this.setAttribute(`instanceColorEnd`,new k(r,t,t)),this}fromWireframeGeometry(e){return this.setPositions(e.attributes.position.array),this}fromEdgesGeometry(e){return this.setPositions(e.attributes.position.array),this}fromMesh(e){return this.fromWireframeGeometry(new d(e.geometry)),this}fromLineSegments(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new x);let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;e!==void 0&&t!==void 0&&(this.boundingBox.setFromBufferAttribute(e),ae.setFromBufferAttribute(t),this.boundingBox.union(ae))}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new j),this.boundingBox===null&&this.computeBoundingBox();let e=this.attributes.instanceStart,t=this.attributes.instanceEnd;if(e!==void 0&&t!==void 0){let n=this.boundingSphere.center;this.boundingBox.getCenter(n);let r=0;for(let i=0,a=e.count;i<a;i++)M.fromBufferAttribute(e,i),r=Math.max(r,n.distanceToSquared(M)),M.fromBufferAttribute(t,i),r=Math.max(r,n.distanceToSquared(M));this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.LineSegmentsGeometry.computeBoundingSphere(): Computed radius is NaN. The instanced position data is likely to have NaN values.`,this)}}toJSON(){}applyMatrix(e){return console.warn(`THREE.LineSegmentsGeometry: applyMatrix() has been renamed to applyMatrix4().`),this.applyMatrix4(e)}},P=class extends N{constructor(){super(),this.isLineGeometry=!0,this.type=`LineGeometry`}setPositions(e){let t=e.length-3,n=new Float32Array(2*t);for(let r=0;r<t;r+=3)n[2*r]=e[r],n[2*r+1]=e[r+1],n[2*r+2]=e[r+2],n[2*r+3]=e[r+3],n[2*r+4]=e[r+4],n[2*r+5]=e[r+5];return super.setPositions(n),this}setColors(e,t=3){let n=e.length-t,r=new Float32Array(2*n);if(t===3)for(let i=0;i<n;i+=t)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5];else for(let i=0;i<n;i+=t)r[2*i]=e[i],r[2*i+1]=e[i+1],r[2*i+2]=e[i+2],r[2*i+3]=e[i+3],r[2*i+4]=e[i+4],r[2*i+5]=e[i+5],r[2*i+6]=e[i+6],r[2*i+7]=e[i+7];return super.setColors(r,t),this}fromLine(e){let t=e.geometry;return this.setPositions(t.attributes.position.array),this}},F=class extends A{constructor(e){super({type:`LineMaterial`,uniforms:o.clone(o.merge([D.common,D.fog,{worldUnits:{value:1},linewidth:{value:1},resolution:{value:new i(1,1)},dashOffset:{value:0},dashScale:{value:1},dashSize:{value:1},gapSize:{value:1}}])),vertexShader:`
				#include <common>
				#include <fog_pars_vertex>
				#include <logdepthbuf_pars_vertex>
				#include <clipping_planes_pars_vertex>

				uniform float linewidth;
				uniform vec2 resolution;

				attribute vec3 instanceStart;
				attribute vec3 instanceEnd;

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
						attribute vec4 instanceColorStart;
						attribute vec4 instanceColorEnd;
					#else
						varying vec3 vLineColor;
						attribute vec3 instanceColorStart;
						attribute vec3 instanceColorEnd;
					#endif
				#endif

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#ifdef USE_DASH

					uniform float dashScale;
					attribute float instanceDistanceStart;
					attribute float instanceDistanceEnd;
					varying float vLineDistance;

				#endif

				void trimSegment( const in vec4 start, inout vec4 end ) {

					// trim end segment so it terminates between the camera plane and the near plane

					// conservative estimate of the near plane
					float a = projectionMatrix[ 2 ][ 2 ]; // 3nd entry in 3th column
					float b = projectionMatrix[ 3 ][ 2 ]; // 3nd entry in 4th column
					float nearEstimate = - 0.5 * b / a;

					float alpha = ( nearEstimate - start.z ) / ( end.z - start.z );

					end.xyz = mix( start.xyz, end.xyz, alpha );

				}

				void main() {

					#ifdef USE_COLOR

						vLineColor = ( position.y < 0.5 ) ? instanceColorStart : instanceColorEnd;

					#endif

					#ifdef USE_DASH

						vLineDistance = ( position.y < 0.5 ) ? dashScale * instanceDistanceStart : dashScale * instanceDistanceEnd;
						vUv = uv;

					#endif

					float aspect = resolution.x / resolution.y;

					// camera space
					vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
					vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );

					#ifdef WORLD_UNITS

						worldStart = start.xyz;
						worldEnd = end.xyz;

					#else

						vUv = uv;

					#endif

					// special case for perspective projection, and segments that terminate either in, or behind, the camera plane
					// clearly the gpu firmware has a way of addressing this issue when projecting into ndc space
					// but we need to perform ndc-space calculations in the shader, so we must address this issue directly
					// perhaps there is a more elegant solution -- WestLangley

					bool perspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 ); // 4th entry in the 3rd column

					if ( perspective ) {

						if ( start.z < 0.0 && end.z >= 0.0 ) {

							trimSegment( start, end );

						} else if ( end.z < 0.0 && start.z >= 0.0 ) {

							trimSegment( end, start );

						}

					}

					// clip space
					vec4 clipStart = projectionMatrix * start;
					vec4 clipEnd = projectionMatrix * end;

					// ndc space
					vec3 ndcStart = clipStart.xyz / clipStart.w;
					vec3 ndcEnd = clipEnd.xyz / clipEnd.w;

					// direction
					vec2 dir = ndcEnd.xy - ndcStart.xy;

					// account for clip-space aspect ratio
					dir.x *= aspect;
					dir = normalize( dir );

					#ifdef WORLD_UNITS

						// get the offset direction as perpendicular to the view vector
						vec3 worldDir = normalize( end.xyz - start.xyz );
						vec3 offset;
						if ( position.y < 0.5 ) {

							offset = normalize( cross( start.xyz, worldDir ) );

						} else {

							offset = normalize( cross( end.xyz, worldDir ) );

						}

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						float forwardOffset = dot( worldDir, vec3( 0.0, 0.0, 1.0 ) );

						// don't extend the line if we're rendering dashes because we
						// won't be rendering the endcaps
						#ifndef USE_DASH

							// extend the line bounds to encompass  endcaps
							start.xyz += - worldDir * linewidth * 0.5;
							end.xyz += worldDir * linewidth * 0.5;

							// shift the position of the quad so it hugs the forward edge of the line
							offset.xy -= dir * forwardOffset;
							offset.z += 0.5;

						#endif

						// endcaps
						if ( position.y > 1.0 || position.y < 0.0 ) {

							offset.xy += dir * 2.0 * forwardOffset;

						}

						// adjust for linewidth
						offset *= linewidth * 0.5;

						// set the world position
						worldPos = ( position.y < 0.5 ) ? start : end;
						worldPos.xyz += offset;

						// project the worldpos
						vec4 clip = projectionMatrix * worldPos;

						// shift the depth of the projected points so the line
						// segments overlap neatly
						vec3 clipPose = ( position.y < 0.5 ) ? ndcStart : ndcEnd;
						clip.z = clipPose.z * clip.w;

					#else

						vec2 offset = vec2( dir.y, - dir.x );
						// undo aspect ratio adjustment
						dir.x /= aspect;
						offset.x /= aspect;

						// sign flip
						if ( position.x < 0.0 ) offset *= - 1.0;

						// endcaps
						if ( position.y < 0.0 ) {

							offset += - dir;

						} else if ( position.y > 1.0 ) {

							offset += dir;

						}

						// adjust for linewidth
						offset *= linewidth;

						// adjust for clip-space to screen-space conversion // maybe resolution should be based on viewport ...
						offset /= resolution.y;

						// select end
						vec4 clip = ( position.y < 0.5 ) ? clipStart : clipEnd;

						// back to clip space
						offset *= clip.w;

						clip.xy += offset;

					#endif

					gl_Position = clip;

					vec4 mvPosition = ( position.y < 0.5 ) ? start : end; // this is an approximation

					#include <logdepthbuf_vertex>
					#include <clipping_planes_vertex>
					#include <fog_vertex>

				}
			`,fragmentShader:`
				uniform vec3 diffuse;
				uniform float opacity;
				uniform float linewidth;

				#ifdef USE_DASH

					uniform float dashOffset;
					uniform float dashSize;
					uniform float gapSize;

				#endif

				varying float vLineDistance;

				#ifdef WORLD_UNITS

					varying vec4 worldPos;
					varying vec3 worldStart;
					varying vec3 worldEnd;

					#ifdef USE_DASH

						varying vec2 vUv;

					#endif

				#else

					varying vec2 vUv;

				#endif

				#include <common>
				#include <fog_pars_fragment>
				#include <logdepthbuf_pars_fragment>
				#include <clipping_planes_pars_fragment>

				#ifdef USE_COLOR
					#ifdef USE_LINE_COLOR_ALPHA
						varying vec4 vLineColor;
					#else
						varying vec3 vLineColor;
					#endif
				#endif

				vec2 closestLineToLine(vec3 p1, vec3 p2, vec3 p3, vec3 p4) {

					float mua;
					float mub;

					vec3 p13 = p1 - p3;
					vec3 p43 = p4 - p3;

					vec3 p21 = p2 - p1;

					float d1343 = dot( p13, p43 );
					float d4321 = dot( p43, p21 );
					float d1321 = dot( p13, p21 );
					float d4343 = dot( p43, p43 );
					float d2121 = dot( p21, p21 );

					float denom = d2121 * d4343 - d4321 * d4321;

					float numer = d1343 * d4321 - d1321 * d4343;

					mua = numer / denom;
					mua = clamp( mua, 0.0, 1.0 );
					mub = ( d1343 + d4321 * ( mua ) ) / d4343;
					mub = clamp( mub, 0.0, 1.0 );

					return vec2( mua, mub );

				}

				void main() {

					#include <clipping_planes_fragment>

					#ifdef USE_DASH

						if ( vUv.y < - 1.0 || vUv.y > 1.0 ) discard; // discard endcaps

						if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX

					#endif

					float alpha = opacity;

					#ifdef WORLD_UNITS

						// Find the closest points on the view ray and the line segment
						vec3 rayEnd = normalize( worldPos.xyz ) * 1e5;
						vec3 lineDir = worldEnd - worldStart;
						vec2 params = closestLineToLine( worldStart, worldEnd, vec3( 0.0, 0.0, 0.0 ), rayEnd );

						vec3 p1 = worldStart + lineDir * params.x;
						vec3 p2 = rayEnd * params.y;
						vec3 delta = p1 - p2;
						float len = length( delta );
						float norm = len / linewidth;

						#ifndef USE_DASH

							#ifdef USE_ALPHA_TO_COVERAGE

								float dnorm = fwidth( norm );
								alpha = 1.0 - smoothstep( 0.5 - dnorm, 0.5 + dnorm, norm );

							#else

								if ( norm > 0.5 ) {

									discard;

								}

							#endif

						#endif

					#else

						#ifdef USE_ALPHA_TO_COVERAGE

							// artifacts appear on some hardware if a derivative is taken within a conditional
							float a = vUv.x;
							float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
							float len2 = a * a + b * b;
							float dlen = fwidth( len2 );

							if ( abs( vUv.y ) > 1.0 ) {

								alpha = 1.0 - smoothstep( 1.0 - dlen, 1.0 + dlen, len2 );

							}

						#else

							if ( abs( vUv.y ) > 1.0 ) {

								float a = vUv.x;
								float b = ( vUv.y > 0.0 ) ? vUv.y - 1.0 : vUv.y + 1.0;
								float len2 = a * a + b * b;

								if ( len2 > 1.0 ) discard;

							}

						#endif

					#endif

					vec4 diffuseColor = vec4( diffuse, alpha );
					#ifdef USE_COLOR
						#ifdef USE_LINE_COLOR_ALPHA
							diffuseColor *= vLineColor;
						#else
							diffuseColor.rgb *= vLineColor;
						#endif
					#endif

					#include <logdepthbuf_fragment>

					gl_FragColor = diffuseColor;

					#include <tonemapping_fragment>
					#include <${w>=154?`colorspace_fragment`:`encodings_fragment`}>
					#include <fog_fragment>
					#include <premultiplied_alpha_fragment>

				}
			`,clipping:!0}),this.isLineMaterial=!0,this.onBeforeCompile=function(){this.transparent?this.defines.USE_LINE_COLOR_ALPHA=`1`:delete this.defines.USE_LINE_COLOR_ALPHA},Object.defineProperties(this,{color:{enumerable:!0,get:function(){return this.uniforms.diffuse.value},set:function(e){this.uniforms.diffuse.value=e}},worldUnits:{enumerable:!0,get:function(){return`WORLD_UNITS`in this.defines},set:function(e){e===!0?this.defines.WORLD_UNITS=``:delete this.defines.WORLD_UNITS}},linewidth:{enumerable:!0,get:function(){return this.uniforms.linewidth.value},set:function(e){this.uniforms.linewidth.value=e}},dashed:{enumerable:!0,get:function(){return`USE_DASH`in this.defines},set(e){!!e!=`USE_DASH`in this.defines&&(this.needsUpdate=!0),e===!0?this.defines.USE_DASH=``:delete this.defines.USE_DASH}},dashScale:{enumerable:!0,get:function(){return this.uniforms.dashScale.value},set:function(e){this.uniforms.dashScale.value=e}},dashSize:{enumerable:!0,get:function(){return this.uniforms.dashSize.value},set:function(e){this.uniforms.dashSize.value=e}},dashOffset:{enumerable:!0,get:function(){return this.uniforms.dashOffset.value},set:function(e){this.uniforms.dashOffset.value=e}},gapSize:{enumerable:!0,get:function(){return this.uniforms.gapSize.value},set:function(e){this.uniforms.gapSize.value=e}},opacity:{enumerable:!0,get:function(){return this.uniforms.opacity.value},set:function(e){this.uniforms.opacity.value=e}},resolution:{enumerable:!0,get:function(){return this.uniforms.resolution.value},set:function(e){this.uniforms.resolution.value.copy(e)}},alphaToCoverage:{enumerable:!0,get:function(){return`USE_ALPHA_TO_COVERAGE`in this.defines},set:function(e){!!e!=`USE_ALPHA_TO_COVERAGE`in this.defines&&(this.needsUpdate=!0),e===!0?(this.defines.USE_ALPHA_TO_COVERAGE=``,this.extensions.derivatives=!0):(delete this.defines.USE_ALPHA_TO_COVERAGE,this.extensions.derivatives=!1)}}}),this.setValues(e)}},I=new c,L=new a,R=new a,z=new c,B=new c,V=new c,H=new a,U=new n,W=new E,G=new a,K=new x,q=new j,J=new c,Y,X;function Z(e,t,n){return J.set(0,0,-t,1).applyMatrix4(e.projectionMatrix),J.multiplyScalar(1/J.w),J.x=X/n.width,J.y=X/n.height,J.applyMatrix4(e.projectionMatrixInverse),J.multiplyScalar(1/J.w),Math.abs(Math.max(J.x,J.y))}function oe(e,t){let n=e.matrixWorld,r=e.geometry,i=r.attributes.instanceStart,o=r.attributes.instanceEnd,s=Math.min(r.instanceCount,i.count);for(let r=0,c=s;r<c;r++){W.start.fromBufferAttribute(i,r),W.end.fromBufferAttribute(o,r),W.applyMatrix4(n);let s=new a,c=new a;Y.distanceSqToSegment(W.start,W.end,c,s),c.distanceTo(s)<X*.5&&t.push({point:c,pointOnLine:s,distance:Y.origin.distanceTo(c),object:e,face:null,faceIndex:r,uv:null,[ie]:null})}}function se(e,t,n){let r=t.projectionMatrix,i=e.material.resolution,o=e.matrixWorld,s=e.geometry,c=s.attributes.instanceStart,u=s.attributes.instanceEnd,d=Math.min(s.instanceCount,c.count),f=-t.near;Y.at(1,V),V.w=1,V.applyMatrix4(t.matrixWorldInverse),V.applyMatrix4(r),V.multiplyScalar(1/V.w),V.x*=i.x/2,V.y*=i.y/2,V.z=0,H.copy(V),U.multiplyMatrices(t.matrixWorldInverse,o);for(let t=0,s=d;t<s;t++){if(z.fromBufferAttribute(c,t),B.fromBufferAttribute(u,t),z.w=1,B.w=1,z.applyMatrix4(U),B.applyMatrix4(U),z.z>f&&B.z>f)continue;if(z.z>f){let e=z.z-B.z,t=(z.z-f)/e;z.lerp(B,t)}else if(B.z>f){let e=B.z-z.z,t=(B.z-f)/e;B.lerp(z,t)}z.applyMatrix4(r),B.applyMatrix4(r),z.multiplyScalar(1/z.w),B.multiplyScalar(1/B.w),z.x*=i.x/2,z.y*=i.y/2,B.x*=i.x/2,B.y*=i.y/2,W.start.copy(z),W.start.z=0,W.end.copy(B),W.end.z=0;let s=W.closestPointToPointParameter(H,!0);W.at(s,G);let d=l.lerp(z.z,B.z,s),p=d>=-1&&d<=1,m=H.distanceTo(G)<X*.5;if(p&&m){W.start.fromBufferAttribute(c,t),W.end.fromBufferAttribute(u,t),W.start.applyMatrix4(o),W.end.applyMatrix4(o);let r=new a,i=new a;Y.distanceSqToSegment(W.start,W.end,i,r),n.push({point:i,pointOnLine:r,distance:Y.origin.distanceTo(i),object:e,face:null,faceIndex:t,uv:null,[ie]:null})}}}var ce=class extends s{constructor(e=new N,t=new F({color:Math.random()*16777215})){super(e,t),this.isLineSegments2=!0,this.type=`LineSegments2`}computeLineDistances(){let e=this.geometry,t=e.attributes.instanceStart,n=e.attributes.instanceEnd,r=new Float32Array(2*t.count);for(let e=0,i=0,a=t.count;e<a;e++,i+=2)L.fromBufferAttribute(t,e),R.fromBufferAttribute(n,e),r[i]=i===0?0:r[i-1],r[i+1]=r[i]+L.distanceTo(R);let i=new g(r,2,1);return e.setAttribute(`instanceDistanceStart`,new k(i,1,0)),e.setAttribute(`instanceDistanceEnd`,new k(i,1,1)),this}raycast(e,t){let n=this.material.worldUnits,r=e.camera;r===null&&!n&&console.error(`LineSegments2: "Raycaster.camera" needs to be set in order to raycast against LineSegments2 while worldUnits is set to false.`);let i=e.params.Line2===void 0?0:e.params.Line2.threshold||0;Y=e.ray;let a=this.matrixWorld,o=this.geometry,s=this.material;X=s.linewidth+i,o.boundingSphere===null&&o.computeBoundingSphere(),q.copy(o.boundingSphere).applyMatrix4(a);let c;if(c=n?X*.5:Z(r,Math.max(r.near,q.distanceToPoint(Y.origin)),s.resolution),q.radius+=c,Y.intersectsSphere(q)===!1)return;o.boundingBox===null&&o.computeBoundingBox(),K.copy(o.boundingBox).applyMatrix4(a);let l;l=n?X*.5:Z(r,Math.max(r.near,K.distanceToPoint(Y.origin)),s.resolution),K.expandByScalar(l),Y.intersectsBox(K)!==!1&&(n?oe(this,t):se(this,r,t))}onBeforeRender(e){let t=this.material.uniforms;t&&t.resolution&&(e.getViewport(I),this.material.uniforms.resolution.value.set(I.z,I.w))}},le=class extends ce{constructor(e=new P,t=new F({color:Math.random()*16777215})){super(e,t),this.isLine2=!0,this.type=`Line2`}},Q=v(T()),ue=Q.forwardRef(function({points:e,color:n=16777215,vertexColors:r,linewidth:o,lineWidth:s,segments:l,dashed:d,...f},p){var m;let h=u(e=>e.size),g=Q.useMemo(()=>l?new ce:new le,[l]),[v]=Q.useState(()=>new F),y=(r==null||(m=r[0])==null?void 0:m.length)===4?4:3,b=Q.useMemo(()=>{let o=l?new N:new P,s=e.map(e=>{let t=Array.isArray(e);return e instanceof a||e instanceof c?[e.x,e.y,e.z]:e instanceof i?[e.x,e.y,0]:t&&e.length===3?[e[0],e[1],e[2]]:t&&e.length===2?[e[0],e[1],0]:e});if(o.setPositions(s.flat()),r){n=16777215;let e=r.map(e=>e instanceof t?e.toArray():e);o.setColors(e.flat(),y)}return o},[e,l,r,y]);return Q.useLayoutEffect(()=>{g.computeLineDistances()},[e,g]),Q.useLayoutEffect(()=>{d?v.defines.USE_DASH=``:delete v.defines.USE_DASH,v.needsUpdate=!0},[d,v]),Q.useEffect(()=>()=>{b.dispose(),v.dispose()},[b]),Q.createElement(`primitive`,_({object:g,ref:p},f),Q.createElement(`primitive`,{object:b,attach:`geometry`}),Q.createElement(`primitive`,_({object:v,attach:`material`,color:n,vertexColors:!!r,resolution:[h.width,h.height],linewidth:o??s??1,dashed:d,transparent:y===4},f)))}),$=r(),de=re([new O(.65,1,32),new y(.2,16)]),fe=new S({color:`#ff0000`,transparent:!0,opacity:.25,depthTest:!1,depthWrite:!1,toneMapped:!1,side:2}),pe=new C({color:`#ff0000`,dashSize:4,gapSize:3,transparent:!0,opacity:.4,depthTest:!1,depthWrite:!1,toneMapped:!1}),me=(0,Q.forwardRef)(function({zoomScope:t=`preview`,showTargetMarker:n=!0,...r},i){let[a,o]=(0,Q.useState)(null),s=(0,Q.useRef)(null),c=(0,Q.useRef)(null),l=(0,Q.useRef)(null),u=(0,Q.useRef)(null),d=(0,Q.useRef)(null),f=(0,Q.useMemo)(()=>new Float32Array(6),[]),m=(0,Q.useRef)(!1),g=(0,Q.useCallback)(e=>{o(e),typeof i==`function`?i(e):i&&(i.current=e)},[i]);return p(({camera:e,viewport:t,size:n})=>{let r=s.current;if(!r||!a||(r.visible=(m.current||h.isDragging||h.isUserMovingCamera)&&!h.isIntroRunning&&!h.isXR&&h.mode!==`fpv`&&h.mode!==`plane`,!r.visible))return;r.position.set(a.target.x,0,a.target.z);let i=a.target.y,o=8*t.getCurrentViewport(e,a.target).height/n.height;for(let e of[l.current,u.current])e?.scale.setScalar(o);l.current&&(l.current.position.y=i,l.current.quaternion.copy(e.quaternion));let p=Math.abs(i)>=1;c.current&&(c.current.visible=p),p&&d.current&&(f[4]=i,d.current.geometry.getAttribute(`position`).needsUpdate=!0,d.current.computeLineDistances())}),(0,Q.useEffect)(()=>{if(!a)return;let e=e=>{let{direction:n,scope:r,amount:i}=e.detail;if(r!==t||!a.enabled||!a.enableZoom)return;let o=.95**((i??1)*10);n===`in`?a.dollyIn(o):a.dollyOut(o)};return document.addEventListener(`camera-zoom`,e),()=>document.removeEventListener(`camera-zoom`,e)},[a,t]),(0,Q.useEffect)(()=>{a&&(r.mouseButtons&&(a.mouseButtons=r.mouseButtons),r.touches&&(a.touches=r.touches))},[a,r.mouseButtons,r.touches]),(0,Q.useEffect)(()=>{if(!a)return;let t=a.domElement;if(!t)throw Error(`OrbitControls doit être connecté à un élément DOM.`);let n,r=()=>{m.current=!1,n=void 0,delete t.dataset.orbitDrag,s.current&&(s.current.visible=!1)},i=t=>{if(n=void 0,t.pointerType!==`mouse`||!a.enabled)return;let r=t.button===0?a.mouseButtons.LEFT:t.button===1?a.mouseButtons.MIDDLE:t.button===2?a.mouseButtons.RIGHT:void 0;(t.ctrlKey||t.metaKey||t.shiftKey)&&(r===e.ROTATE?r=e.PAN:r===e.PAN&&(r=e.ROTATE)),r===e.ROTATE&&a.enableRotate?n=`rotate`:r===e.PAN&&a.enablePan?n=`pan`:r===e.DOLLY&&a.enableZoom&&(n=`zoom`)},o=()=>{m.current=!0,n&&(t.dataset.orbitDrag=n)};return t.addEventListener(`pointerdown`,i,!0),a.addEventListener(`start`,o),a.addEventListener(`end`,r),window.addEventListener(`pointerup`,r),window.addEventListener(`pointercancel`,r),window.addEventListener(`blur`,r),()=>{r(),t.removeEventListener(`pointerdown`,i,!0),a.removeEventListener(`start`,o),a.removeEventListener(`end`,r),window.removeEventListener(`pointerup`,r),window.removeEventListener(`pointercancel`,r),window.removeEventListener(`blur`,r)}},[a]),(0,$.jsxs)($.Fragment,{children:[(0,$.jsx)(b,{...r,ref:g}),t===`scene`&&n&&(0,$.jsxs)(`group`,{ref:s,name:`orbit-target-helper`,visible:!1,children:[(0,$.jsxs)(`group`,{ref:c,visible:!1,children:[(0,$.jsx)(`lineSegments`,{ref:d,material:pe,renderOrder:1e3,raycast:()=>{},children:(0,$.jsx)(`bufferGeometry`,{children:(0,$.jsx)(`bufferAttribute`,{attach:`attributes-position`,args:[f,3]})})}),(0,$.jsx)(`mesh`,{ref:u,geometry:de,material:fe,position:[0,.05,0],rotation:[-Math.PI/2,0,0],renderOrder:1e3,raycast:()=>{}})]}),(0,$.jsx)(`mesh`,{ref:l,geometry:de,material:fe,renderOrder:1e3,raycast:()=>{}})]})]})});function he(e,t){if(e<=1e-4){t.setRGB(.06,.1,.3);return}let n=Math.max(0,Math.min(1,e));if(n<.25){let e=n/.25;t.setRGB(.06*(1-e),.1+.75*e,.3+.65*e)}else if(n<.5){let e=(n-.25)/.25;t.setRGB(0,.85+.12*e,.95*(1-e))}else if(n<.75){let e=(n-.5)/.25;t.setRGB(.95*e,.97,0)}else{let e=(n-.75)/.25;t.setRGB(.95+.05*e,.97*(1-e),0)}}function ge(e,t=new Set){t.add(e);let n=[];for(let r=0;r<e.children.length;r++){let i=e.children[r];i.isBone&&!t.has(i)&&n.push(ge(i,t))}return{name:e.name||`Sans-nom`,bone:e,children:n}}function _e(e){let t=1;for(let n=0;n<e.children.length;n++)t+=_e(e.children[n]);return t}function ve({show:e,enableInfluence:n=!0,selectedBoneName:r,onSelectBoneName:i,onSkeletonGroupsChange:o}){let{scene:s,camera:c,gl:l}=u(),d=(0,Q.useRef)(new Map),[m,h]=(0,Q.useState)(null),g=(0,Q.useRef)(null),_=r===void 0?m?.name||null:r,v=(0,Q.useRef)(new Map),y=(0,Q.useRef)(new Map),b=(0,Q.useRef)(new a),x=(0,Q.useRef)(new a),C=(0,Q.useRef)(null),w=(0,Q.useRef)(null),T=(0,Q.useRef)(null),E=(0,Q.useRef)(null),D=(0,Q.useRef)(null),O=(0,Q.useRef)(``),k=(0,Q.useCallback)(()=>{v.current.forEach((e,t)=>{t.material=e,Array.isArray(e)?e.forEach(e=>{e.needsUpdate=!0}):e&&(e.needsUpdate=!0);let n=y.current.get(t);n&&t.geometry?(t.geometry.setAttribute(`color`,n),t.geometry.attributes.color.needsUpdate=!0):t.geometry&&t.geometry.attributes.color&&t.geometry.deleteAttribute(`color`)}),v.current.clear(),y.current.clear()},[]),A=(0,Q.useCallback)(e=>{if(k(),!e||!n)return;let r=new t;s.traverse(t=>{if(t.isSkinnedMesh){let n=t;if(!n.skeleton||!n.geometry)return;let i=n.skeleton.bones.indexOf(e);if(i<0)return;let a=n.geometry,o=a.attributes.skinIndex,s=a.attributes.skinWeight;if(!o||!s)return;let c=a.attributes.position.count,l=new Float32Array(c*3),u=0;for(let e=0;e<c;e++){let t=0;for(let n=0;n<4;n++)o.getComponent(e,n)===i&&(t+=s.getComponent(e,n));t>u&&(u=t),he(t,r),l[e*3]=r.r,l[e*3+1]=r.g,l[e*3+2]=r.b}if(u<=1e-4)return;v.current.has(n)||(v.current.set(n,n.material),a.attributes.color&&y.current.set(n,a.attributes.color.clone())),a.setAttribute(`color`,new ne(l,3)),a.attributes.color.needsUpdate=!0,n.material=new S({vertexColors:!0,wireframe:!1,depthTest:!0,depthWrite:!0})}})},[n,k,s]);return(0,Q.useEffect)(()=>{if(!e){k();return}let t=null;_&&s.traverse(e=>{e.isBone&&e.name===_&&(t=e)}),g.current=t,A(t)},[e,_,A,k,s]),p(t=>{if(!e){C.current&&(C.current.visible=!1),w.current&&(w.current.visible=!1),T.current&&(T.current.visible=!1);return}let n=g.current;if(n){n.getWorldPosition(b.current);let e=b.current;if(D.current&&D.current.position.copy(e),C.current&&(C.current.position.copy(e),C.current.visible=!0),w.current){w.current.position.copy(e),w.current.quaternion.copy(c.quaternion);let n=1+.15*Math.sin(t.clock.getElapsedTime()*6);w.current.scale.set(n,n,n),w.current.visible=!0}if(E.current){let t=[];n.parent&&n.parent.isBone&&(n.parent.getWorldPosition(x.current),t.push(x.current.x,x.current.y,x.current.z,e.x,e.y,e.z));for(let r=0;r<n.children.length;r++){let i=n.children[r];i.isBone&&(i.getWorldPosition(x.current),t.push(e.x,e.y,e.z,x.current.x,x.current.y,x.current.z))}t.length>0?(E.current.setAttribute(`position`,new f(t,3)),T.current&&(T.current.visible=!0)):T.current&&(T.current.visible=!1)}}else C.current&&(C.current.visible=!1),w.current&&(w.current.visible=!1),T.current&&(T.current.visible=!1)}),(0,Q.useEffect)(()=>{if(!e)return;let t=l.domElement,n=0,r=0,o=0,s=e=>{n=Date.now(),r=e.clientX,o=e.clientY},u=e=>{if(Date.now()-n>350||Math.hypot(e.clientX-r,e.clientY-o)>6)return;let s=t.getBoundingClientRect(),l=e.clientX-s.left,u=e.clientY-s.top,f=s.width,p=s.height;if(f<=0||p<=0)return;let m=24,g=null,v=new a,y=new a;if(d.current.forEach((e,t)=>{t.traverse(e=>{if(!e.isBone)return;let t=e;if(t.getWorldPosition(v),v.project(c),v.z>1)return;let n=(v.x*.5+.5)*f,r=(-v.y*.5+.5)*p,i=Math.hypot(n-l,r-u);i<m&&(m=i,g=t);for(let e=0;e<t.children.length;e++){let i=t.children[e];if(!i.isBone||(i.getWorldPosition(y),y.project(c),y.z>1))continue;let a=(y.x*.5+.5)*f,o=(-y.y*.5+.5)*p,s=(a-n)*(a-n)+(o-r)*(o-r);if(s>1e-4){let e=Math.max(0,Math.min(1,((l-n)*(a-n)+(u-r)*(o-r))/s)),i=n+e*(a-n),c=r+e*(o-r),d=Math.hypot(i-l,c-u);d<m&&(m=d,g=t)}}})}),g){let e=g.name,t=_===e?null:e;i?i(t):h(t?g:null)}else _&&(i?i(null):h(null))};return t.addEventListener(`pointerdown`,s),t.addEventListener(`pointerup`,u),()=>{t.removeEventListener(`pointerdown`,s),t.removeEventListener(`pointerup`,u)}},[e,_,i,l.domElement,c]),(0,Q.useEffect)(()=>{if(!e){d.current.forEach(e=>{e.removeFromParent(),e.dispose()}),d.current.clear(),k(),O.current=``,o?.([]);return}let t=setInterval(()=>{let e=new Set;if(s.traverse(t=>{if(t.isSkinnedMesh){let n=t,r=n.visible,i=n.parent;for(;i&&r;)i.visible||(r=!1),i=i.parent;if(!r)return;if(n.skeleton&&n.skeleton.bones.length>0){let t=n.skeleton.bones,r=new Set(t);t.filter(e=>!e.parent||!e.parent.isBone||!r.has(e.parent)).forEach(t=>{let n=t;for(;n.parent&&n.parent.isBone;)n=n.parent;e.add(n)})}}}),e.forEach(e=>{if(!d.current.has(e)){let t=new te(e),n=t.material;n.color.set(54527),n.depthTest=!1,t.renderOrder=99990,t.raycast=()=>{},t.traverse(e=>{e.raycast=()=>{}}),s.add(t),d.current.set(e,t)}}),d.current.forEach((t,n)=>{e.has(n)||(t.removeFromParent(),t.dispose(),d.current.delete(n))}),o){let t=[],n=new Set;e.forEach(e=>{if(n.has(e))return;n.add(e);let r=[],i=new Set;e.traverse(e=>{e.isBone&&i.add(e)}),s.traverse(e=>{if(e.isSkinnedMesh){let t=e;t.skeleton&&t.skeleton.bones.some(e=>i.has(e))&&t.name&&!r.includes(t.name)&&r.push(t.name)}});let a=(e.name+` `+Array.from(i).map(e=>e.name).join(` `)+` `+r.join(` `)).toLowerCase(),o=`other`,c=`Squelette (${e.name})`;a.includes(`hair`)||a.includes(`wig`)||a.includes(`tresse`)||a.includes(`chignon`)||a.includes(`frange`)||a.includes(`coupe`)?(o=`wig`,c=`Perruque (${r[0]||e.name})`):(a.includes(`hips`)||a.includes(`spine`)||a.includes(`pelvis`)||a.includes(`character`)||a.includes(`body`)||a.includes(`head`))&&(o=`character`,c=`Personnage (${r[0]||e.name})`);let l=ge(e),u=_e(l);t.push({id:e.uuid||e.name,label:c,type:o,meshNames:r,rootNodes:[l],totalBones:u})});let r=t.map(e=>`${e.id}:${e.totalBones}:${e.label}`).join(`|`);r!==O.current&&(O.current=r,o(t))}},1e3);return()=>{clearInterval(t),d.current.forEach(e=>{e.removeFromParent(),e.dispose()}),d.current.clear(),k(),O.current=``}},[e,s,k,o]),e?(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`mesh`,{ref:C,renderOrder:999999,frustumCulled:!1,visible:!1,children:[(0,$.jsx)(`sphereGeometry`,{args:[.9,16,16]}),(0,$.jsx)(`meshBasicMaterial`,{color:`#ff1e42`,depthTest:!1,transparent:!0,opacity:.95})]}),(0,$.jsxs)(`mesh`,{ref:w,renderOrder:999999,frustumCulled:!1,visible:!1,children:[(0,$.jsx)(`ringGeometry`,{args:[1.2,1.6,24]}),(0,$.jsx)(`meshBasicMaterial`,{color:`#fffa65`,depthTest:!1,side:2,transparent:!0,opacity:.9})]}),(0,$.jsxs)(`lineSegments`,{ref:T,renderOrder:999998,frustumCulled:!1,visible:!1,children:[(0,$.jsx)(`bufferGeometry`,{ref:E}),(0,$.jsx)(`lineBasicMaterial`,{color:`#fffa65`,depthTest:!1,linewidth:3})]}),_&&(0,$.jsx)(`group`,{ref:D,children:(0,$.jsx)(ee,{style:{pointerEvents:`none`,transform:`translate3d(-50%, -120%, 0)`,transition:`transform 0.05s ease-out`,zIndex:1e4},children:(0,$.jsxs)(`div`,{style:{background:`rgba(15, 23, 42, 0.9)`,color:`#fffa65`,border:`1px solid rgba(255, 250, 101, 0.8)`,borderRadius:4,padding:`2px 8px`,fontSize:11,fontWeight:600,fontFamily:`monospace`,whiteSpace:`nowrap`,boxShadow:`0 2px 8px rgba(0, 0, 0, 0.5)`,display:`flex`,alignItems:`center`,gap:5},children:[(0,$.jsx)(`span`,{children:`🦴`}),(0,$.jsx)(`span`,{children:_})]})})})]}):null}function ye({options:e,value:t,onChange:n}){let r=e.findIndex(e=>e.value===t),i=t=>{e.length&&n(e[r<0?t>0?0:e.length-1:(r+t+e.length)%e.length].value)};return(0,$.jsxs)(`div`,{className:`input-group input-group-sm flex-nowrap w-auto`,role:`group`,"aria-label":`Navigation des animations`,children:[(0,$.jsx)(`button`,{type:`button`,className:`btn btn-outline-secondary text-dark`,"aria-label":`Animation précédente`,title:`Animation précédente`,disabled:e.length<2,onClick:()=>i(-1),children:(0,$.jsx)(`i`,{className:`bi bi-chevron-left`})}),(0,$.jsx)(`select`,{className:`form-select form-select-sm w-auto`,"aria-label":`Animation`,value:t,onChange:e=>n(e.target.value),children:e.map(e=>(0,$.jsx)(`option`,{value:e.value,children:e.label},e.value))}),(0,$.jsx)(`button`,{type:`button`,className:`btn btn-outline-secondary text-dark`,"aria-label":`Animation suivante`,title:`Animation suivante`,disabled:e.length<2,onClick:()=>i(1),children:(0,$.jsx)(`i`,{className:`bi bi-chevron-right`})}),(0,$.jsxs)(`span`,{className:`input-group-text text-nowrap`,"aria-label":`Nombre d’animations`,children:[r<0?`—`:r+1,` / `,e.length]})]})}export{ue as i,ve as n,me as r,ye as t};