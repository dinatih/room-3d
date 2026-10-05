import{bl as ue,V as B,bm as Ae,P as qr,i as Z,bn as St,aX as _s,bo as ee,f as Te,B as Gr,D as Hi,bp as Ai,bq as At,br as he,bs as G,bt as ui,bu as K,bv as Mi,bw as Rs,bx as ar,by as As,bz as Q,bA as Ii,bB as $r,bC as Ms,bD as Yr,bE as Kt,l as Ge,bF as Is,bG as dt,bH as Ps,bI as Xr,bJ as Cs,F as or,S as Jt,bK as ht,bL as Mt,bM as Qr,bN as Re,bO as be,bP as xe,bQ as De,bR as Be,bS as Fs,bT as Ds,bU as Es,bV as Bs,C as we,bW as ks,bX as Kr,bY as Zr,bZ as Ns,b_ as zs,b$ as Os,c0 as Ls,c1 as Hs,r as z,c2 as lr,c3 as cr,c4 as ur,h as Qe,c5 as Us,aN as Ws,c6 as Vs,c7 as js,c8 as qs,c9 as Gs,ca as $s,cb as Ys,cc as Xs,j as _}from"./inventory-Clr3yLA8.js";const Jr=0,Qs=1,es=2,fr=2,fi=1.25,dr=1,Ee=6*4+4+4,ei=65535,Ks=Math.pow(2,-24),di=Symbol("SKIP_GENERATION");function ts(s){return s.index?s.index.count:s.attributes.position.count}function mt(s){return ts(s)/3}function is(s,e=ArrayBuffer){return s>65535?new Uint32Array(new e(4*s)):new Uint16Array(new e(2*s))}function Zs(s,e){if(!s.index){const t=s.attributes.position.count,r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=is(t,r);s.setIndex(new ue(n,1));for(let a=0;a<t;a++)n[a]=a}}function rs(s,e){const t=mt(s),r=e||s.drawRange,n=r.start/3,a=(r.start+r.count)/3,i=Math.max(0,n),l=Math.min(t,a)-i;return[{offset:Math.floor(i),count:Math.floor(l)}]}function ss(s,e){if(!s.groups||!s.groups.length)return rs(s,e);const t=[],r=new Set,n=e||s.drawRange,a=n.start/3,i=(n.start+n.count)/3;for(const c of s.groups){const h=c.start/3,f=(c.start+c.count)/3;r.add(Math.max(a,h)),r.add(Math.min(i,f))}const l=Array.from(r.values()).sort((c,h)=>c-h);for(let c=0;c<l.length-1;c++){const h=l[c],f=l[c+1];t.push({offset:Math.floor(h),count:Math.floor(f-h)})}return t}function Js(s,e){const t=mt(s),r=ss(s,e).sort((i,l)=>i.offset-l.offset),n=r[r.length-1];n.count=Math.min(t-n.offset,n.count);let a=0;return r.forEach(({count:i})=>a+=i),t!==a}function hi(s,e,t,r,n){let a=1/0,i=1/0,l=1/0,c=-1/0,h=-1/0,f=-1/0,u=1/0,o=1/0,m=1/0,v=-1/0,y=-1/0,d=-1/0;for(let p=e*6,g=(e+t)*6;p<g;p+=6){const x=s[p+0],w=s[p+1],b=x-w,S=x+w;b<a&&(a=b),S>c&&(c=S),x<u&&(u=x),x>v&&(v=x);const R=s[p+2],M=s[p+3],I=R-M,P=R+M;I<i&&(i=I),P>h&&(h=P),R<o&&(o=R),R>y&&(y=R);const F=s[p+4],A=s[p+5],D=F-A,E=F+A;D<l&&(l=D),E>f&&(f=E),F<m&&(m=F),F>d&&(d=F)}r[0]=a,r[1]=i,r[2]=l,r[3]=c,r[4]=h,r[5]=f,n[0]=u,n[1]=o,n[2]=m,n[3]=v,n[4]=y,n[5]=d}function en(s,e=null,t=null,r=null){const n=s.attributes.position,a=s.index?s.index.array:null,i=mt(s),l=n.normalized;let c;e===null?(c=new Float32Array(i*6*4),t=0,r=i):(c=e,t=t||0,r=r||i);const h=n.array,f=n.offset||0;let u=3;n.isInterleavedBufferAttribute&&(u=n.data.stride);const o=["getX","getY","getZ"];for(let m=t;m<t+r;m++){const v=m*3,y=m*6;let d=v+0,p=v+1,g=v+2;a&&(d=a[d],p=a[p],g=a[g]),l||(d=d*u+f,p=p*u+f,g=g*u+f);for(let x=0;x<3;x++){let w,b,S;l?(w=n[o[x]](d),b=n[o[x]](p),S=n[o[x]](g)):(w=h[d+x],b=h[p+x],S=h[g+x]);let R=w;b<R&&(R=b),S<R&&(R=S);let M=w;b>M&&(M=b),S>M&&(M=S);const I=(M-R)/2,P=x*2;c[y+P+0]=R+I,c[y+P+1]=I+(Math.abs(R)+I)*Ks}}return c}function q(s,e,t){return t.min.x=e[s],t.min.y=e[s+1],t.min.z=e[s+2],t.max.x=e[s+3],t.max.y=e[s+4],t.max.z=e[s+5],t}function hr(s){let e=-1,t=-1/0;for(let r=0;r<3;r++){const n=s[r+3]-s[r];n>t&&(t=n,e=r)}return e}function mr(s,e){e.set(s)}function pr(s,e,t){let r,n;for(let a=0;a<3;a++){const i=a+3;r=s[a],n=e[a],t[a]=r<n?r:n,r=s[i],n=e[i],t[i]=r>n?r:n}}function Ct(s,e,t){for(let r=0;r<3;r++){const n=e[s+2*r],a=e[s+2*r+1],i=n-a,l=n+a;i<t[r]&&(t[r]=i),l>t[r+3]&&(t[r+3]=l)}}function vt(s){const e=s[3]-s[0],t=s[4]-s[1],r=s[5]-s[2];return 2*(e*t+t*r+r*e)}const _e=32,tn=(s,e)=>s.candidate-e.candidate,Pe=new Array(_e).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),Ft=new Float32Array(6);function rn(s,e,t,r,n,a){let i=-1,l=0;if(a===Jr)i=hr(e),i!==-1&&(l=(e[i]+e[i+3])/2);else if(a===Qs)i=hr(s),i!==-1&&(l=sn(t,r,n,i));else if(a===es){const c=vt(s);let h=fi*n;const f=r*6,u=(r+n)*6;for(let o=0;o<3;o++){const m=e[o],d=(e[o+3]-m)/_e;if(n<_e/4){const p=[...Pe];p.length=n;let g=0;for(let w=f;w<u;w+=6,g++){const b=p[g];b.candidate=t[w+2*o],b.count=0;const{bounds:S,leftCacheBounds:R,rightCacheBounds:M}=b;for(let I=0;I<3;I++)M[I]=1/0,M[I+3]=-1/0,R[I]=1/0,R[I+3]=-1/0,S[I]=1/0,S[I+3]=-1/0;Ct(w,t,S)}p.sort(tn);let x=n;for(let w=0;w<x;w++){const b=p[w];for(;w+1<x&&p[w+1].candidate===b.candidate;)p.splice(w+1,1),x--}for(let w=f;w<u;w+=6){const b=t[w+2*o];for(let S=0;S<x;S++){const R=p[S];b>=R.candidate?Ct(w,t,R.rightCacheBounds):(Ct(w,t,R.leftCacheBounds),R.count++)}}for(let w=0;w<x;w++){const b=p[w],S=b.count,R=n-b.count,M=b.leftCacheBounds,I=b.rightCacheBounds;let P=0;S!==0&&(P=vt(M)/c);let F=0;R!==0&&(F=vt(I)/c);const A=dr+fi*(P*S+F*R);A<h&&(i=o,h=A,l=b.candidate)}}else{for(let x=0;x<_e;x++){const w=Pe[x];w.count=0,w.candidate=m+d+x*d;const b=w.bounds;for(let S=0;S<3;S++)b[S]=1/0,b[S+3]=-1/0}for(let x=f;x<u;x+=6){let S=~~((t[x+2*o]-m)/d);S>=_e&&(S=_e-1);const R=Pe[S];R.count++,Ct(x,t,R.bounds)}const p=Pe[_e-1];mr(p.bounds,p.rightCacheBounds);for(let x=_e-2;x>=0;x--){const w=Pe[x],b=Pe[x+1];pr(w.bounds,b.rightCacheBounds,w.rightCacheBounds)}let g=0;for(let x=0;x<_e-1;x++){const w=Pe[x],b=w.count,S=w.bounds,M=Pe[x+1].rightCacheBounds;b!==0&&(g===0?mr(S,Ft):pr(S,Ft,Ft)),g+=b;let I=0,P=0;g!==0&&(I=vt(Ft)/c);const F=n-g;F!==0&&(P=vt(M)/c);const A=dr+fi*(I*g+P*F);A<h&&(i=o,h=A,l=w.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${a} used.`);return{axis:i,pos:l}}function sn(s,e,t,r){let n=0;for(let a=e,i=e+t;a<i;a++)n+=s[a*6+r*2];return n/t}class mi{constructor(){this.boundingData=new Float32Array(6)}}function nn(s,e,t,r,n,a){let i=r,l=r+n-1;const c=a.pos,h=a.axis*2;for(;;){for(;i<=l&&t[i*6+h]<c;)i++;for(;i<=l&&t[l*6+h]>=c;)l--;if(i<l){for(let f=0;f<3;f++){let u=e[i*3+f];e[i*3+f]=e[l*3+f],e[l*3+f]=u}for(let f=0;f<6;f++){let u=t[i*6+f];t[i*6+f]=t[l*6+f],t[l*6+f]=u}i++,l--}else return i}}function an(s,e,t,r,n,a){let i=r,l=r+n-1;const c=a.pos,h=a.axis*2;for(;;){for(;i<=l&&t[i*6+h]<c;)i++;for(;i<=l&&t[l*6+h]>=c;)l--;if(i<l){let f=s[i];s[i]=s[l],s[l]=f;for(let u=0;u<6;u++){let o=t[i*6+u];t[i*6+u]=t[l*6+u],t[l*6+u]=o}i++,l--}else return i}}function J(s,e){return e[s+15]===65535}function re(s,e){return e[s+6]}function oe(s,e){return e[s+14]}function fe(s){return s+8}function le(s,e){return e[s+6]}function Ui(s,e){return e[s+7]}let ns,_t,Qt,as;const on=Math.pow(2,32);function Pi(s){return"count"in s?1:1+Pi(s.left)+Pi(s.right)}function ln(s,e,t){return ns=new Float32Array(t),_t=new Uint32Array(t),Qt=new Uint16Array(t),as=new Uint8Array(t),Ci(s,e)}function Ci(s,e){const t=s/4,r=s/2,n="count"in e,a=e.boundingData;for(let i=0;i<6;i++)ns[t+i]=a[i];if(n)if(e.buffer){const i=e.buffer;as.set(new Uint8Array(i),s);for(let l=s,c=s+i.byteLength;l<c;l+=Ee){const h=l/2;J(h,Qt)||(_t[l/4+6]+=t)}return s+i.byteLength}else{const i=e.offset,l=e.count;return _t[t+6]=i,Qt[r+14]=l,Qt[r+15]=ei,s+Ee}else{const i=e.left,l=e.right,c=e.splitAxis;let h;if(h=Ci(s+Ee,i),h/4>on)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return _t[t+6]=h/4,h=Ci(h,l),_t[t+7]=c,h}}function cn(s,e){const t=(s.index?s.index.count:s.attributes.position.count)/3,r=t>2**16,n=r?4:2,a=e?new SharedArrayBuffer(t*n):new ArrayBuffer(t*n),i=r?new Uint32Array(a):new Uint16Array(a);for(let l=0,c=i.length;l<c;l++)i[l]=l;return i}function un(s,e,t,r,n){const{maxDepth:a,verbose:i,maxLeafTris:l,strategy:c,onProgress:h,indirect:f}=n,u=s._indirectBuffer,o=s.geometry,m=o.index?o.index.array:null,v=f?an:nn,y=mt(o),d=new Float32Array(6);let p=!1;const g=new mi;return hi(e,t,r,g.boundingData,d),w(g,t,r,d),g;function x(b){h&&h(b/y)}function w(b,S,R,M=null,I=0){if(!p&&I>=a&&(p=!0,i&&(console.warn(`MeshBVH: Max depth of ${a} reached when generating BVH. Consider increasing maxDepth.`),console.warn(o))),R<=l||I>=a)return x(S+R),b.offset=S,b.count=R,b;const P=rn(b.boundingData,M,e,S,R,c);if(P.axis===-1)return x(S+R),b.offset=S,b.count=R,b;const F=v(u,m,e,S,R,P);if(F===S||F===S+R)x(S+R),b.offset=S,b.count=R;else{b.splitAxis=P.axis;const A=new mi,D=S,E=F-S;b.left=A,hi(e,D,E,A.boundingData,d),w(A,D,E,d,I+1);const L=new mi,W=F,ce=R-E;b.right=L,hi(e,W,ce,L.boundingData,d),w(L,W,ce,d,I+1)}return b}}function fn(s,e){const t=s.geometry;e.indirect&&(s._indirectBuffer=cn(t,e.useSharedArrayBuffer),Js(t,e.range)&&!e.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),s._indirectBuffer||Zs(t,e);const r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=en(t),a=e.indirect?rs(t,e.range):ss(t,e.range);s._roots=a.map(i=>{const l=un(s,n,i.offset,i.count,e),c=Pi(l),h=new r(Ee*c);return ln(0,l,h),h})}class Me{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let r=1/0,n=-1/0;for(let a=0,i=e.length;a<i;a++){const c=e[a][t];r=c<r?c:r,n=c>n?c:n}this.min=r,this.max=n}setFromPoints(e,t){let r=1/0,n=-1/0;for(let a=0,i=t.length;a<i;a++){const l=t[a],c=e.dot(l);r=c<r?c:r,n=c>n?c:n}this.min=r,this.max=n}isSeparated(e){return this.min>e.max||e.min>this.max}}Me.prototype.setFromBox=function(){const s=new B;return function(t,r){const n=r.min,a=r.max;let i=1/0,l=-1/0;for(let c=0;c<=1;c++)for(let h=0;h<=1;h++)for(let f=0;f<=1;f++){s.x=n.x*c+a.x*(1-c),s.y=n.y*h+a.y*(1-h),s.z=n.z*f+a.z*(1-f);const u=t.dot(s);i=Math.min(u,i),l=Math.max(u,l)}this.min=i,this.max=l}}();const dn=function(){const s=new B,e=new B,t=new B;return function(n,a,i){const l=n.start,c=s,h=a.start,f=e;t.subVectors(l,h),s.subVectors(n.end,n.start),e.subVectors(a.end,a.start);const u=t.dot(f),o=f.dot(c),m=f.dot(f),v=t.dot(c),d=c.dot(c)*m-o*o;let p,g;d!==0?p=(u*o-v*m)/d:p=0,g=(u+p*o)/m,i.x=p,i.y=g}}(),Wi=function(){const s=new Z,e=new B,t=new B;return function(n,a,i,l){dn(n,a,s);let c=s.x,h=s.y;if(c>=0&&c<=1&&h>=0&&h<=1){n.at(c,i),a.at(h,l);return}else if(c>=0&&c<=1){h<0?a.at(0,l):a.at(1,l),n.closestPointToPoint(l,!0,i);return}else if(h>=0&&h<=1){c<0?n.at(0,i):n.at(1,i),a.closestPointToPoint(i,!0,l);return}else{let f;c<0?f=n.start:f=n.end;let u;h<0?u=a.start:u=a.end;const o=e,m=t;if(n.closestPointToPoint(u,!0,e),a.closestPointToPoint(f,!0,t),o.distanceToSquared(u)<=m.distanceToSquared(f)){i.copy(o),l.copy(u);return}else{i.copy(f),l.copy(m);return}}}}(),hn=function(){const s=new B,e=new B,t=new qr,r=new Ae;return function(a,i){const{radius:l,center:c}=a,{a:h,b:f,c:u}=i;if(r.start=h,r.end=f,r.closestPointToPoint(c,!0,s).distanceTo(c)<=l||(r.start=h,r.end=u,r.closestPointToPoint(c,!0,s).distanceTo(c)<=l)||(r.start=f,r.end=u,r.closestPointToPoint(c,!0,s).distanceTo(c)<=l))return!0;const y=i.getPlane(t);if(Math.abs(y.distanceToPoint(c))<=l){const p=y.projectPoint(c,e);if(i.containsPoint(p))return!0}return!1}}(),mn=1e-15;function pi(s){return Math.abs(s)<mn}class ye extends St{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new B),this.satBounds=new Array(4).fill().map(()=>new Me),this.points=[this.a,this.b,this.c],this.sphere=new _s,this.plane=new qr,this.needsUpdate=!0}intersectsSphere(e){return hn(e,this)}update(){const e=this.a,t=this.b,r=this.c,n=this.points,a=this.satAxes,i=this.satBounds,l=a[0],c=i[0];this.getNormal(l),c.setFromPoints(l,n);const h=a[1],f=i[1];h.subVectors(e,t),f.setFromPoints(h,n);const u=a[2],o=i[2];u.subVectors(t,r),o.setFromPoints(u,n);const m=a[3],v=i[3];m.subVectors(r,e),v.setFromPoints(m,n),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(l,e),this.needsUpdate=!1}}ye.prototype.closestPointToSegment=function(){const s=new B,e=new B,t=new Ae;return function(n,a=null,i=null){const{start:l,end:c}=n,h=this.points;let f,u=1/0;for(let o=0;o<3;o++){const m=(o+1)%3;t.start.copy(h[o]),t.end.copy(h[m]),Wi(t,n,s,e),f=s.distanceToSquared(e),f<u&&(u=f,a&&a.copy(s),i&&i.copy(e))}return this.closestPointToPoint(l,s),f=l.distanceToSquared(s),f<u&&(u=f,a&&a.copy(s),i&&i.copy(l)),this.closestPointToPoint(c,s),f=c.distanceToSquared(s),f<u&&(u=f,a&&a.copy(s),i&&i.copy(c)),Math.sqrt(u)}}();ye.prototype.intersectsTriangle=function(){const s=new ye,e=new Array(3),t=new Array(3),r=new Me,n=new Me,a=new B,i=new B,l=new B,c=new B,h=new B,f=new Ae,u=new Ae,o=new Ae,m=new B;function v(y,d,p){const g=y.points;let x=0,w=-1;for(let b=0;b<3;b++){const{start:S,end:R}=f;S.copy(g[b]),R.copy(g[(b+1)%3]),f.delta(i);const M=pi(d.distanceToPoint(S));if(pi(d.normal.dot(i))&&M){p.copy(f),x=2;break}const I=d.intersectLine(f,m);if(!I&&M&&m.copy(S),(I||M)&&!pi(m.distanceTo(R))){if(x<=1)(x===1?p.start:p.end).copy(m),M&&(w=x);else if(x>=2){(w===1?p.start:p.end).copy(m),x=2;break}if(x++,x===2&&w===-1)break}}return x}return function(d,p=null,g=!1){this.needsUpdate&&this.update(),d.isExtendedTriangle?d.needsUpdate&&d.update():(s.copy(d),s.update(),d=s);const x=this.plane,w=d.plane;if(Math.abs(x.normal.dot(w.normal))>1-1e-10){const b=this.satBounds,S=this.satAxes;t[0]=d.a,t[1]=d.b,t[2]=d.c;for(let I=0;I<4;I++){const P=b[I],F=S[I];if(r.setFromPoints(F,t),P.isSeparated(r))return!1}const R=d.satBounds,M=d.satAxes;e[0]=this.a,e[1]=this.b,e[2]=this.c;for(let I=0;I<4;I++){const P=R[I],F=M[I];if(r.setFromPoints(F,e),P.isSeparated(r))return!1}for(let I=0;I<4;I++){const P=S[I];for(let F=0;F<4;F++){const A=M[F];if(a.crossVectors(P,A),r.setFromPoints(a,e),n.setFromPoints(a,t),r.isSeparated(n))return!1}}return p&&(g||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),p.start.set(0,0,0),p.end.set(0,0,0)),!0}else{const b=v(this,w,u);if(b===1&&d.containsPoint(u.end))return p&&(p.start.copy(u.end),p.end.copy(u.end)),!0;if(b!==2)return!1;const S=v(d,x,o);if(S===1&&this.containsPoint(o.end))return p&&(p.start.copy(o.end),p.end.copy(o.end)),!0;if(S!==2)return!1;if(u.delta(l),o.delta(c),l.dot(c)<0){let D=o.start;o.start=o.end,o.end=D}const R=u.start.dot(l),M=u.end.dot(l),I=o.start.dot(l),P=o.end.dot(l),F=M<I,A=R<P;return R!==P&&I!==M&&F===A?!1:(p&&(h.subVectors(u.start,o.start),h.dot(l)>0?p.start.copy(u.start):p.start.copy(o.start),h.subVectors(u.end,o.end),h.dot(l)<0?p.end.copy(u.end):p.end.copy(o.end)),!0)}}}();ye.prototype.distanceToPoint=function(){const s=new B;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}}();ye.prototype.distanceToTriangle=function(){const s=new B,e=new B,t=["a","b","c"],r=new Ae,n=new Ae;return function(i,l=null,c=null){const h=l||c?r:null;if(this.intersectsTriangle(i,h))return(l||c)&&(l&&h.getCenter(l),c&&h.getCenter(c)),0;let f=1/0;for(let u=0;u<3;u++){let o;const m=t[u],v=i[m];this.closestPointToPoint(v,s),o=v.distanceToSquared(s),o<f&&(f=o,l&&l.copy(s),c&&c.copy(v));const y=this[m];i.closestPointToPoint(y,s),o=y.distanceToSquared(s),o<f&&(f=o,l&&l.copy(y),c&&c.copy(s))}for(let u=0;u<3;u++){const o=t[u],m=t[(u+1)%3];r.set(this[o],this[m]);for(let v=0;v<3;v++){const y=t[v],d=t[(v+1)%3];n.set(i[y],i[d]),Wi(r,n,s,e);const p=s.distanceToSquared(e);p<f&&(f=p,l&&l.copy(s),c&&c.copy(e))}}return Math.sqrt(f)}}();class te{constructor(e,t,r){this.isOrientedBox=!0,this.min=new B,this.max=new B,this.matrix=new ee,this.invMatrix=new ee,this.points=new Array(8).fill().map(()=>new B),this.satAxes=new Array(3).fill().map(()=>new B),this.satBounds=new Array(3).fill().map(()=>new Me),this.alignedSatBounds=new Array(3).fill().map(()=>new Me),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),r&&this.matrix.copy(r)}set(e,t,r){this.min.copy(e),this.max.copy(t),this.matrix.copy(r),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}}te.prototype.update=function(){return function(){const e=this.matrix,t=this.min,r=this.max,n=this.points;for(let h=0;h<=1;h++)for(let f=0;f<=1;f++)for(let u=0;u<=1;u++){const o=1*h|2*f|4*u,m=n[o];m.x=h?r.x:t.x,m.y=f?r.y:t.y,m.z=u?r.z:t.z,m.applyMatrix4(e)}const a=this.satBounds,i=this.satAxes,l=n[0];for(let h=0;h<3;h++){const f=i[h],u=a[h],o=1<<h,m=n[o];f.subVectors(l,m),u.setFromPoints(f,n)}const c=this.alignedSatBounds;c[0].setFromPointsField(n,"x"),c[1].setFromPointsField(n,"y"),c[2].setFromPointsField(n,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}}();te.prototype.intersectsBox=function(){const s=new Me;return function(t){this.needsUpdate&&this.update();const r=t.min,n=t.max,a=this.satBounds,i=this.satAxes,l=this.alignedSatBounds;if(s.min=r.x,s.max=n.x,l[0].isSeparated(s)||(s.min=r.y,s.max=n.y,l[1].isSeparated(s))||(s.min=r.z,s.max=n.z,l[2].isSeparated(s)))return!1;for(let c=0;c<3;c++){const h=i[c],f=a[c];if(s.setFromBox(h,t),f.isSeparated(s))return!1}return!0}}();te.prototype.intersectsTriangle=function(){const s=new ye,e=new Array(3),t=new Me,r=new Me,n=new B;return function(i){this.needsUpdate&&this.update(),i.isExtendedTriangle?i.needsUpdate&&i.update():(s.copy(i),s.update(),i=s);const l=this.satBounds,c=this.satAxes;e[0]=i.a,e[1]=i.b,e[2]=i.c;for(let o=0;o<3;o++){const m=l[o],v=c[o];if(t.setFromPoints(v,e),m.isSeparated(t))return!1}const h=i.satBounds,f=i.satAxes,u=this.points;for(let o=0;o<3;o++){const m=h[o],v=f[o];if(t.setFromPoints(v,u),m.isSeparated(t))return!1}for(let o=0;o<3;o++){const m=c[o];for(let v=0;v<4;v++){const y=f[v];if(n.crossVectors(m,y),t.setFromPoints(n,e),r.setFromPoints(n,u),t.isSeparated(r))return!1}}return!0}}();te.prototype.closestPointToPoint=function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}}();te.prototype.distanceToPoint=function(){const s=new B;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}}();te.prototype.distanceToBox=function(){const s=["x","y","z"],e=new Array(12).fill().map(()=>new Ae),t=new Array(12).fill().map(()=>new Ae),r=new B,n=new B;return function(i,l=0,c=null,h=null){if(this.needsUpdate&&this.update(),this.intersectsBox(i))return(c||h)&&(i.getCenter(n),this.closestPointToPoint(n,r),i.closestPointToPoint(r,n),c&&c.copy(r),h&&h.copy(n)),0;const f=l*l,u=i.min,o=i.max,m=this.points;let v=1/0;for(let d=0;d<8;d++){const p=m[d];n.copy(p).clamp(u,o);const g=p.distanceToSquared(n);if(g<v&&(v=g,c&&c.copy(p),h&&h.copy(n),g<f))return Math.sqrt(g)}let y=0;for(let d=0;d<3;d++)for(let p=0;p<=1;p++)for(let g=0;g<=1;g++){const x=(d+1)%3,w=(d+2)%3,b=p<<x|g<<w,S=1<<d|p<<x|g<<w,R=m[b],M=m[S];e[y].set(R,M);const P=s[d],F=s[x],A=s[w],D=t[y],E=D.start,L=D.end;E[P]=u[P],E[F]=p?u[F]:o[F],E[A]=g?u[A]:o[F],L[P]=o[P],L[F]=p?u[F]:o[F],L[A]=g?u[A]:o[F],y++}for(let d=0;d<=1;d++)for(let p=0;p<=1;p++)for(let g=0;g<=1;g++){n.x=d?o.x:u.x,n.y=p?o.y:u.y,n.z=g?o.z:u.z,this.closestPointToPoint(n,r);const x=n.distanceToSquared(r);if(x<v&&(v=x,c&&c.copy(r),h&&h.copy(n),x<f))return Math.sqrt(x)}for(let d=0;d<12;d++){const p=e[d];for(let g=0;g<12;g++){const x=t[g];Wi(p,x,r,n);const w=r.distanceToSquared(n);if(w<v&&(v=w,c&&c.copy(r),h&&h.copy(n),w<f))return Math.sqrt(w)}}return Math.sqrt(v)}}();class Vi{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){const e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}}class pn extends Vi{constructor(){super(()=>new ye)}}const de=new pn;class gn{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;const e=[];let t=null;this.setBuffer=r=>{t&&e.push(t),t=r,this.float32Array=new Float32Array(r),this.uint16Array=new Uint16Array(r),this.uint32Array=new Uint32Array(r)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}}const j=new gn;let Fe,ft;const Ke=[],Dt=new Vi(()=>new Te);function vn(s,e,t,r,n,a){Fe=Dt.getPrimitive(),ft=Dt.getPrimitive(),Ke.push(Fe,ft),j.setBuffer(s._roots[e]);const i=Fi(0,s.geometry,t,r,n,a);j.clearBuffer(),Dt.releasePrimitive(Fe),Dt.releasePrimitive(ft),Ke.pop(),Ke.pop();const l=Ke.length;return l>0&&(ft=Ke[l-1],Fe=Ke[l-2]),i}function Fi(s,e,t,r,n=null,a=0,i=0){const{float32Array:l,uint16Array:c,uint32Array:h}=j;let f=s*2;if(J(f,c)){const o=re(s,h),m=oe(f,c);return q(s,l,Fe),r(o,m,!1,i,a+s,Fe)}else{let P=function(A){const{uint16Array:D,uint32Array:E}=j;let L=A*2;for(;!J(L,D);)A=fe(A),L=A*2;return re(A,E)},F=function(A){const{uint16Array:D,uint32Array:E}=j;let L=A*2;for(;!J(L,D);)A=le(A,E),L=A*2;return re(A,E)+oe(L,D)};const o=fe(s),m=le(s,h);let v=o,y=m,d,p,g,x;if(n&&(g=Fe,x=ft,q(v,l,g),q(y,l,x),d=n(g),p=n(x),p<d)){v=m,y=o;const A=d;d=p,p=A,g=x}g||(g=Fe,q(v,l,g));const w=J(v*2,c),b=t(g,w,d,i+1,a+v);let S;if(b===fr){const A=P(v),E=F(v)-A;S=r(A,E,!0,i+1,a+v,g)}else S=b&&Fi(v,e,t,r,n,a,i+1);if(S)return!0;x=ft,q(y,l,x);const R=J(y*2,c),M=t(x,R,p,i+1,a+y);let I;if(M===fr){const A=P(y),E=F(y)-A;I=r(A,E,!0,i+1,a+y,x)}else I=M&&Fi(y,e,t,r,n,a,i+1);return!!I}}const xt=new B,gi=new B;function xn(s,e,t={},r=0,n=1/0){const a=r*r,i=n*n;let l=1/0,c=null;if(s.shapecast({boundsTraverseOrder:f=>(xt.copy(e).clamp(f.min,f.max),xt.distanceToSquared(e)),intersectsBounds:(f,u,o)=>o<l&&o<i,intersectsTriangle:(f,u)=>{f.closestPointToPoint(e,xt);const o=e.distanceToSquared(xt);return o<l&&(gi.copy(xt),l=o,c=u),o<a}}),l===1/0)return null;const h=Math.sqrt(l);return t.point?t.point.copy(gi):t.point=gi.clone(),t.distance=h,t.faceIndex=c,t}const Ze=new B,Je=new B,et=new B,Et=new Z,Bt=new Z,kt=new Z,gr=new B,vr=new B,xr=new B,Nt=new B;function yn(s,e,t,r,n,a,i,l){let c;if(a===Gr?c=s.intersectTriangle(r,t,e,!0,n):c=s.intersectTriangle(e,t,r,a!==Hi,n),c===null)return null;const h=s.origin.distanceTo(n);return h<i||h>l?null:{distance:h,point:n.clone()}}function bn(s,e,t,r,n,a,i,l,c,h,f){Ze.fromBufferAttribute(e,a),Je.fromBufferAttribute(e,i),et.fromBufferAttribute(e,l);const u=yn(s,Ze,Je,et,Nt,c,h,f);if(u){r&&(Et.fromBufferAttribute(r,a),Bt.fromBufferAttribute(r,i),kt.fromBufferAttribute(r,l),u.uv=St.getInterpolation(Nt,Ze,Je,et,Et,Bt,kt,new Z)),n&&(Et.fromBufferAttribute(n,a),Bt.fromBufferAttribute(n,i),kt.fromBufferAttribute(n,l),u.uv1=St.getInterpolation(Nt,Ze,Je,et,Et,Bt,kt,new Z)),t&&(gr.fromBufferAttribute(t,a),vr.fromBufferAttribute(t,i),xr.fromBufferAttribute(t,l),u.normal=St.getInterpolation(Nt,Ze,Je,et,gr,vr,xr,new B),u.normal.dot(s.direction)>0&&u.normal.multiplyScalar(-1));const o={a,b:i,c:l,normal:new B,materialIndex:0};St.getNormal(Ze,Je,et,o.normal),u.face=o,u.faceIndex=a}return u}function ti(s,e,t,r,n,a,i){const l=r*3;let c=l+0,h=l+1,f=l+2;const u=s.index;s.index&&(c=u.getX(c),h=u.getX(h),f=u.getX(f));const{position:o,normal:m,uv:v,uv1:y}=s.attributes,d=bn(t,o,m,v,y,c,h,f,e,a,i);return d?(d.faceIndex=r,n&&n.push(d),d):null}function $(s,e,t,r){const n=s.a,a=s.b,i=s.c;let l=e,c=e+1,h=e+2;t&&(l=t.getX(l),c=t.getX(c),h=t.getX(h)),n.x=r.getX(l),n.y=r.getY(l),n.z=r.getZ(l),a.x=r.getX(c),a.y=r.getY(c),a.z=r.getZ(c),i.x=r.getX(h),i.y=r.getY(h),i.z=r.getZ(h)}function wn(s,e,t,r,n,a,i,l){const{geometry:c,_indirectBuffer:h}=s;for(let f=r,u=r+n;f<u;f++)ti(c,e,t,f,a,i,l)}function Tn(s,e,t,r,n,a,i){const{geometry:l,_indirectBuffer:c}=s;let h=1/0,f=null;for(let u=r,o=r+n;u<o;u++){let m;m=ti(l,e,t,u,null,a,i),m&&m.distance<h&&(f=m,h=m.distance)}return f}function Sn(s,e,t,r,n,a,i){const{geometry:l}=t,{index:c}=l,h=l.attributes.position;for(let f=s,u=e+s;f<u;f++){let o;if(o=f,$(i,o*3,c,h),i.needsUpdate=!0,r(i,o,n,a))return!0}return!1}function _n(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));const t=s.geometry,r=t.index?t.index.array:null,n=t.attributes.position;let a,i,l,c,h=0;const f=s._roots;for(let o=0,m=f.length;o<m;o++)a=f[o],i=new Uint32Array(a),l=new Uint16Array(a),c=new Float32Array(a),u(0,h),h+=a.byteLength;function u(o,m,v=!1){const y=o*2;if(l[y+15]===ei){const p=i[o+6],g=l[y+14];let x=1/0,w=1/0,b=1/0,S=-1/0,R=-1/0,M=-1/0;for(let I=3*p,P=3*(p+g);I<P;I++){let F=r[I];const A=n.getX(F),D=n.getY(F),E=n.getZ(F);A<x&&(x=A),A>S&&(S=A),D<w&&(w=D),D>R&&(R=D),E<b&&(b=E),E>M&&(M=E)}return c[o+0]!==x||c[o+1]!==w||c[o+2]!==b||c[o+3]!==S||c[o+4]!==R||c[o+5]!==M?(c[o+0]=x,c[o+1]=w,c[o+2]=b,c[o+3]=S,c[o+4]=R,c[o+5]=M,!0):!1}else{const p=o+8,g=i[o+6],x=p+m,w=g+m;let b=v,S=!1,R=!1;e?b||(S=e.has(x),R=e.has(w),b=!S&&!R):(S=!0,R=!0);const M=b||S,I=b||R;let P=!1;M&&(P=u(p,m,b));let F=!1;I&&(F=u(g,m,b));const A=P||F;if(A)for(let D=0;D<3;D++){const E=p+D,L=g+D,W=c[E],ce=c[E+3],X=c[L],me=c[L+3];c[o+D]=W<X?W:X,c[o+D+3]=ce>me?ce:me}return A}}}function ke(s,e,t,r,n){let a,i,l,c,h,f;const u=1/t.direction.x,o=1/t.direction.y,m=1/t.direction.z,v=t.origin.x,y=t.origin.y,d=t.origin.z;let p=e[s],g=e[s+3],x=e[s+1],w=e[s+3+1],b=e[s+2],S=e[s+3+2];return u>=0?(a=(p-v)*u,i=(g-v)*u):(a=(g-v)*u,i=(p-v)*u),o>=0?(l=(x-y)*o,c=(w-y)*o):(l=(w-y)*o,c=(x-y)*o),a>c||l>i||((l>a||isNaN(a))&&(a=l),(c<i||isNaN(i))&&(i=c),m>=0?(h=(b-d)*m,f=(S-d)*m):(h=(S-d)*m,f=(b-d)*m),a>f||h>i)?!1:((h>a||a!==a)&&(a=h),(f<i||i!==i)&&(i=f),a<=n&&i>=r)}function Rn(s,e,t,r,n,a,i,l){const{geometry:c,_indirectBuffer:h}=s;for(let f=r,u=r+n;f<u;f++){let o=h?h[f]:f;ti(c,e,t,o,a,i,l)}}function An(s,e,t,r,n,a,i){const{geometry:l,_indirectBuffer:c}=s;let h=1/0,f=null;for(let u=r,o=r+n;u<o;u++){let m;m=ti(l,e,t,c?c[u]:u,null,a,i),m&&m.distance<h&&(f=m,h=m.distance)}return f}function Mn(s,e,t,r,n,a,i){const{geometry:l}=t,{index:c}=l,h=l.attributes.position;for(let f=s,u=e+s;f<u;f++){let o;if(o=t.resolveTriangleIndex(f),$(i,o*3,c,h),i.needsUpdate=!0,r(i,o,n,a))return!0}return!1}function In(s,e,t,r,n,a,i){j.setBuffer(s._roots[e]),Di(0,s,t,r,n,a,i),j.clearBuffer()}function Di(s,e,t,r,n,a,i){const{float32Array:l,uint16Array:c,uint32Array:h}=j,f=s*2;if(J(f,c)){const o=re(s,h),m=oe(f,c);wn(e,t,r,o,m,n,a,i)}else{const o=fe(s);ke(o,l,r,a,i)&&Di(o,e,t,r,n,a,i);const m=le(s,h);ke(m,l,r,a,i)&&Di(m,e,t,r,n,a,i)}}const Pn=["x","y","z"];function Cn(s,e,t,r,n,a){j.setBuffer(s._roots[e]);const i=Ei(0,s,t,r,n,a);return j.clearBuffer(),i}function Ei(s,e,t,r,n,a){const{float32Array:i,uint16Array:l,uint32Array:c}=j;let h=s*2;if(J(h,l)){const u=re(s,c),o=oe(h,l);return Tn(e,t,r,u,o,n,a)}else{const u=Ui(s,c),o=Pn[u],v=r.direction[o]>=0;let y,d;v?(y=fe(s),d=le(s,c)):(y=le(s,c),d=fe(s));const g=ke(y,i,r,n,a)?Ei(y,e,t,r,n,a):null;if(g){const b=g.point[o];if(v?b<=i[d+u]:b>=i[d+u+3])return g}const w=ke(d,i,r,n,a)?Ei(d,e,t,r,n,a):null;return g&&w?g.distance<=w.distance?g:w:g||w||null}}const zt=new Te,tt=new ye,it=new ye,yt=new ee,yr=new te,Ot=new te;function Fn(s,e,t,r){j.setBuffer(s._roots[e]);const n=Bi(0,s,t,r);return j.clearBuffer(),n}function Bi(s,e,t,r,n=null){const{float32Array:a,uint16Array:i,uint32Array:l}=j;let c=s*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),yr.set(t.boundingBox.min,t.boundingBox.max,r),n=yr),J(c,i)){const f=e.geometry,u=f.index,o=f.attributes.position,m=t.index,v=t.attributes.position,y=re(s,l),d=oe(c,i);if(yt.copy(r).invert(),t.boundsTree)return q(s,a,Ot),Ot.matrix.copy(yt),Ot.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:g=>Ot.intersectsBox(g),intersectsTriangle:g=>{g.a.applyMatrix4(r),g.b.applyMatrix4(r),g.c.applyMatrix4(r),g.needsUpdate=!0;for(let x=y*3,w=(d+y)*3;x<w;x+=3)if($(it,x,u,o),it.needsUpdate=!0,g.intersectsTriangle(it))return!0;return!1}});for(let p=y*3,g=(d+y)*3;p<g;p+=3){$(tt,p,u,o),tt.a.applyMatrix4(yt),tt.b.applyMatrix4(yt),tt.c.applyMatrix4(yt),tt.needsUpdate=!0;for(let x=0,w=m.count;x<w;x+=3)if($(it,x,m,v),it.needsUpdate=!0,tt.intersectsTriangle(it))return!0}}else{const f=s+8,u=l[s+6];return q(f,a,zt),!!(n.intersectsBox(zt)&&Bi(f,e,t,r,n)||(q(u,a,zt),n.intersectsBox(zt)&&Bi(u,e,t,r,n)))}}const Lt=new ee,vi=new te,bt=new te,Dn=new B,En=new B,Bn=new B,kn=new B;function Nn(s,e,t,r={},n={},a=0,i=1/0){e.boundingBox||e.computeBoundingBox(),vi.set(e.boundingBox.min,e.boundingBox.max,t),vi.needsUpdate=!0;const l=s.geometry,c=l.attributes.position,h=l.index,f=e.attributes.position,u=e.index,o=de.getPrimitive(),m=de.getPrimitive();let v=Dn,y=En,d=null,p=null;n&&(d=Bn,p=kn);let g=1/0,x=null,w=null;return Lt.copy(t).invert(),bt.matrix.copy(Lt),s.shapecast({boundsTraverseOrder:b=>vi.distanceToBox(b),intersectsBounds:(b,S,R)=>R<g&&R<i?(S&&(bt.min.copy(b.min),bt.max.copy(b.max),bt.needsUpdate=!0),!0):!1,intersectsRange:(b,S)=>{if(e.boundsTree)return e.boundsTree.shapecast({boundsTraverseOrder:M=>bt.distanceToBox(M),intersectsBounds:(M,I,P)=>P<g&&P<i,intersectsRange:(M,I)=>{for(let P=M,F=M+I;P<F;P++){$(m,3*P,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let A=b,D=b+S;A<D;A++){$(o,3*A,h,c),o.needsUpdate=!0;const E=o.distanceToTriangle(m,v,d);if(E<g&&(y.copy(v),p&&p.copy(d),g=E,x=A,w=P),E<a)return!0}}}});{const R=mt(e);for(let M=0,I=R;M<I;M++){$(m,3*M,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let P=b,F=b+S;P<F;P++){$(o,3*P,h,c),o.needsUpdate=!0;const A=o.distanceToTriangle(m,v,d);if(A<g&&(y.copy(v),p&&p.copy(d),g=A,x=P,w=M),A<a)return!0}}}}}),de.releasePrimitive(o),de.releasePrimitive(m),g===1/0?null:(r.point?r.point.copy(y):r.point=y.clone(),r.distance=g,r.faceIndex=x,n&&(n.point?n.point.copy(p):n.point=p.clone(),n.point.applyMatrix4(Lt),y.applyMatrix4(Lt),n.distance=y.sub(n.point).length(),n.faceIndex=w),r)}function zn(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));const t=s.geometry,r=t.index?t.index.array:null,n=t.attributes.position;let a,i,l,c,h=0;const f=s._roots;for(let o=0,m=f.length;o<m;o++)a=f[o],i=new Uint32Array(a),l=new Uint16Array(a),c=new Float32Array(a),u(0,h),h+=a.byteLength;function u(o,m,v=!1){const y=o*2;if(l[y+15]===ei){const p=i[o+6],g=l[y+14];let x=1/0,w=1/0,b=1/0,S=-1/0,R=-1/0,M=-1/0;for(let I=p,P=p+g;I<P;I++){const F=3*s.resolveTriangleIndex(I);for(let A=0;A<3;A++){let D=F+A;D=r?r[D]:D;const E=n.getX(D),L=n.getY(D),W=n.getZ(D);E<x&&(x=E),E>S&&(S=E),L<w&&(w=L),L>R&&(R=L),W<b&&(b=W),W>M&&(M=W)}}return c[o+0]!==x||c[o+1]!==w||c[o+2]!==b||c[o+3]!==S||c[o+4]!==R||c[o+5]!==M?(c[o+0]=x,c[o+1]=w,c[o+2]=b,c[o+3]=S,c[o+4]=R,c[o+5]=M,!0):!1}else{const p=o+8,g=i[o+6],x=p+m,w=g+m;let b=v,S=!1,R=!1;e?b||(S=e.has(x),R=e.has(w),b=!S&&!R):(S=!0,R=!0);const M=b||S,I=b||R;let P=!1;M&&(P=u(p,m,b));let F=!1;I&&(F=u(g,m,b));const A=P||F;if(A)for(let D=0;D<3;D++){const E=p+D,L=g+D,W=c[E],ce=c[E+3],X=c[L],me=c[L+3];c[o+D]=W<X?W:X,c[o+D+3]=ce>me?ce:me}return A}}}function On(s,e,t,r,n,a,i){j.setBuffer(s._roots[e]),ki(0,s,t,r,n,a,i),j.clearBuffer()}function ki(s,e,t,r,n,a,i){const{float32Array:l,uint16Array:c,uint32Array:h}=j,f=s*2;if(J(f,c)){const o=re(s,h),m=oe(f,c);Rn(e,t,r,o,m,n,a,i)}else{const o=fe(s);ke(o,l,r,a,i)&&ki(o,e,t,r,n,a,i);const m=le(s,h);ke(m,l,r,a,i)&&ki(m,e,t,r,n,a,i)}}const Ln=["x","y","z"];function Hn(s,e,t,r,n,a){j.setBuffer(s._roots[e]);const i=Ni(0,s,t,r,n,a);return j.clearBuffer(),i}function Ni(s,e,t,r,n,a){const{float32Array:i,uint16Array:l,uint32Array:c}=j;let h=s*2;if(J(h,l)){const u=re(s,c),o=oe(h,l);return An(e,t,r,u,o,n,a)}else{const u=Ui(s,c),o=Ln[u],v=r.direction[o]>=0;let y,d;v?(y=fe(s),d=le(s,c)):(y=le(s,c),d=fe(s));const g=ke(y,i,r,n,a)?Ni(y,e,t,r,n,a):null;if(g){const b=g.point[o];if(v?b<=i[d+u]:b>=i[d+u+3])return g}const w=ke(d,i,r,n,a)?Ni(d,e,t,r,n,a):null;return g&&w?g.distance<=w.distance?g:w:g||w||null}}const Ht=new Te,rt=new ye,st=new ye,wt=new ee,br=new te,Ut=new te;function Un(s,e,t,r){j.setBuffer(s._roots[e]);const n=zi(0,s,t,r);return j.clearBuffer(),n}function zi(s,e,t,r,n=null){const{float32Array:a,uint16Array:i,uint32Array:l}=j;let c=s*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),br.set(t.boundingBox.min,t.boundingBox.max,r),n=br),J(c,i)){const f=e.geometry,u=f.index,o=f.attributes.position,m=t.index,v=t.attributes.position,y=re(s,l),d=oe(c,i);if(wt.copy(r).invert(),t.boundsTree)return q(s,a,Ut),Ut.matrix.copy(wt),Ut.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:g=>Ut.intersectsBox(g),intersectsTriangle:g=>{g.a.applyMatrix4(r),g.b.applyMatrix4(r),g.c.applyMatrix4(r),g.needsUpdate=!0;for(let x=y,w=d+y;x<w;x++)if($(st,3*e.resolveTriangleIndex(x),u,o),st.needsUpdate=!0,g.intersectsTriangle(st))return!0;return!1}});for(let p=y,g=d+y;p<g;p++){const x=e.resolveTriangleIndex(p);$(rt,3*x,u,o),rt.a.applyMatrix4(wt),rt.b.applyMatrix4(wt),rt.c.applyMatrix4(wt),rt.needsUpdate=!0;for(let w=0,b=m.count;w<b;w+=3)if($(st,w,m,v),st.needsUpdate=!0,rt.intersectsTriangle(st))return!0}}else{const f=s+8,u=l[s+6];return q(f,a,Ht),!!(n.intersectsBox(Ht)&&zi(f,e,t,r,n)||(q(u,a,Ht),n.intersectsBox(Ht)&&zi(u,e,t,r,n)))}}const Wt=new ee,xi=new te,Tt=new te,Wn=new B,Vn=new B,jn=new B,qn=new B;function Gn(s,e,t,r={},n={},a=0,i=1/0){e.boundingBox||e.computeBoundingBox(),xi.set(e.boundingBox.min,e.boundingBox.max,t),xi.needsUpdate=!0;const l=s.geometry,c=l.attributes.position,h=l.index,f=e.attributes.position,u=e.index,o=de.getPrimitive(),m=de.getPrimitive();let v=Wn,y=Vn,d=null,p=null;n&&(d=jn,p=qn);let g=1/0,x=null,w=null;return Wt.copy(t).invert(),Tt.matrix.copy(Wt),s.shapecast({boundsTraverseOrder:b=>xi.distanceToBox(b),intersectsBounds:(b,S,R)=>R<g&&R<i?(S&&(Tt.min.copy(b.min),Tt.max.copy(b.max),Tt.needsUpdate=!0),!0):!1,intersectsRange:(b,S)=>{if(e.boundsTree){const R=e.boundsTree;return R.shapecast({boundsTraverseOrder:M=>Tt.distanceToBox(M),intersectsBounds:(M,I,P)=>P<g&&P<i,intersectsRange:(M,I)=>{for(let P=M,F=M+I;P<F;P++){const A=R.resolveTriangleIndex(P);$(m,3*A,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let D=b,E=b+S;D<E;D++){const L=s.resolveTriangleIndex(D);$(o,3*L,h,c),o.needsUpdate=!0;const W=o.distanceToTriangle(m,v,d);if(W<g&&(y.copy(v),p&&p.copy(d),g=W,x=D,w=P),W<a)return!0}}}})}else{const R=mt(e);for(let M=0,I=R;M<I;M++){$(m,3*M,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let P=b,F=b+S;P<F;P++){const A=s.resolveTriangleIndex(P);$(o,3*A,h,c),o.needsUpdate=!0;const D=o.distanceToTriangle(m,v,d);if(D<g&&(y.copy(v),p&&p.copy(d),g=D,x=P,w=M),D<a)return!0}}}}}),de.releasePrimitive(o),de.releasePrimitive(m),g===1/0?null:(r.point?r.point.copy(y):r.point=y.clone(),r.distance=g,r.faceIndex=x,n&&(n.point?n.point.copy(p):n.point=p.clone(),n.point.applyMatrix4(Wt),y.applyMatrix4(Wt),n.distance=y.sub(n.point).length(),n.faceIndex=w),r)}function $n(){return typeof SharedArrayBuffer<"u"}const It=new j.constructor,Zt=new j.constructor,Ce=new Vi(()=>new Te),nt=new Te,at=new Te,yi=new Te,bi=new Te;let wi=!1;function Yn(s,e,t,r){if(wi)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");wi=!0;const n=s._roots,a=e._roots;let i,l=0,c=0;const h=new ee().copy(t).invert();for(let f=0,u=n.length;f<u;f++){It.setBuffer(n[f]),c=0;const o=Ce.getPrimitive();q(0,It.float32Array,o),o.applyMatrix4(h);for(let m=0,v=a.length;m<v&&(Zt.setBuffer(a[m]),i=ve(0,0,t,h,r,l,c,0,0,o),Zt.clearBuffer(),c+=a[m].length,!i);m++);if(Ce.releasePrimitive(o),It.clearBuffer(),l+=n[f].length,i)break}return wi=!1,i}function ve(s,e,t,r,n,a=0,i=0,l=0,c=0,h=null,f=!1){let u,o;f?(u=Zt,o=It):(u=It,o=Zt);const m=u.float32Array,v=u.uint32Array,y=u.uint16Array,d=o.float32Array,p=o.uint32Array,g=o.uint16Array,x=s*2,w=e*2,b=J(x,y),S=J(w,g);let R=!1;if(S&&b)f?R=n(re(e,p),oe(e*2,g),re(s,v),oe(s*2,y),c,i+e,l,a+s):R=n(re(s,v),oe(s*2,y),re(e,p),oe(e*2,g),l,a+s,c,i+e);else if(S){const M=Ce.getPrimitive();q(e,d,M),M.applyMatrix4(t);const I=fe(s),P=le(s,v);q(I,m,nt),q(P,m,at);const F=M.intersectsBox(nt),A=M.intersectsBox(at);R=F&&ve(e,I,r,t,n,i,a,c,l+1,M,!f)||A&&ve(e,P,r,t,n,i,a,c,l+1,M,!f),Ce.releasePrimitive(M)}else{const M=fe(e),I=le(e,p);q(M,d,yi),q(I,d,bi);const P=h.intersectsBox(yi),F=h.intersectsBox(bi);if(P&&F)R=ve(s,M,t,r,n,a,i,l,c+1,h,f)||ve(s,I,t,r,n,a,i,l,c+1,h,f);else if(P)if(b)R=ve(s,M,t,r,n,a,i,l,c+1,h,f);else{const A=Ce.getPrimitive();A.copy(yi).applyMatrix4(t);const D=fe(s),E=le(s,v);q(D,m,nt),q(E,m,at);const L=A.intersectsBox(nt),W=A.intersectsBox(at);R=L&&ve(M,D,r,t,n,i,a,c,l+1,A,!f)||W&&ve(M,E,r,t,n,i,a,c,l+1,A,!f),Ce.releasePrimitive(A)}else if(F)if(b)R=ve(s,I,t,r,n,a,i,l,c+1,h,f);else{const A=Ce.getPrimitive();A.copy(bi).applyMatrix4(t);const D=fe(s),E=le(s,v);q(D,m,nt),q(E,m,at);const L=A.intersectsBox(nt),W=A.intersectsBox(at);R=L&&ve(I,D,r,t,n,i,a,c,l+1,A,!f)||W&&ve(I,E,r,t,n,i,a,c,l+1,A,!f),Ce.releasePrimitive(A)}}return R}const Vt=new te,wr=new Te,Xn={strategy:Jr,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null};class ji{static serialize(e,t={}){t={cloneBuffers:!0,...t};const r=e.geometry,n=e._roots,a=e._indirectBuffer,i=r.getIndex();let l;return t.cloneBuffers?l={roots:n.map(c=>c.slice()),index:i?i.array.slice():null,indirectBuffer:a?a.slice():null}:l={roots:n,index:i?i.array:null,indirectBuffer:a},l}static deserialize(e,t,r={}){r={setIndex:!0,indirect:!!e.indirectBuffer,...r};const{index:n,roots:a,indirectBuffer:i}=e,l=new ji(t,{...r,[di]:!0});if(l._roots=a,l._indirectBuffer=i||null,r.setIndex){const c=t.getIndex();if(c===null){const h=new ue(e.index,1,!1);t.setIndex(h)}else c.array!==n&&(c.array.set(n),c.needsUpdate=!0)}return l}get indirect(){return!!this._indirectBuffer}constructor(e,t={}){if(e.isBufferGeometry){if(e.index&&e.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(t=Object.assign({...Xn,[di]:!1},t),t.useSharedArrayBuffer&&!$n())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=e,this._roots=null,this._indirectBuffer=null,t[di]||(fn(this,t),!e.boundingBox&&t.setBoundingBox&&(e.boundingBox=this.getBoundingBox(new Te))),this.resolveTriangleIndex=t.indirect?r=>this._indirectBuffer[r]:r=>r}refit(e=null){return(this.indirect?zn:_n)(this,e)}traverse(e,t=0){const r=this._roots[t],n=new Uint32Array(r),a=new Uint16Array(r);i(0);function i(l,c=0){const h=l*2,f=a[h+15]===ei;if(f){const u=n[l+6],o=a[h+14];e(c,f,new Float32Array(r,l*4,6),u,o)}else{const u=l+Ee/4,o=n[l+6],m=n[l+7];e(c,f,new Float32Array(r,l*4,6),m)||(i(u,c+1),i(o,c+1))}}}raycast(e,t=Ai,r=0,n=1/0){const a=this._roots,i=this.geometry,l=[],c=t.isMaterial,h=Array.isArray(t),f=i.groups,u=c?t.side:t,o=this.indirect?On:In;for(let m=0,v=a.length;m<v;m++){const y=h?t[f[m].materialIndex].side:u,d=l.length;if(o(this,m,y,e,l,r,n),h){const p=f[m].materialIndex;for(let g=d,x=l.length;g<x;g++)l[g].face.materialIndex=p}}return l}raycastFirst(e,t=Ai,r=0,n=1/0){const a=this._roots,i=this.geometry,l=t.isMaterial,c=Array.isArray(t);let h=null;const f=i.groups,u=l?t.side:t,o=this.indirect?Hn:Cn;for(let m=0,v=a.length;m<v;m++){const y=c?t[f[m].materialIndex].side:u,d=o(this,m,y,e,r,n);d!=null&&(h==null||d.distance<h.distance)&&(h=d,c&&(d.face.materialIndex=f[m].materialIndex))}return h}intersectsGeometry(e,t){let r=!1;const n=this._roots,a=this.indirect?Un:Fn;for(let i=0,l=n.length;i<l&&(r=a(this,i,e,t),!r);i++);return r}shapecast(e){const t=de.getPrimitive(),r=this.indirect?Mn:Sn;let{boundsTraverseOrder:n,intersectsBounds:a,intersectsRange:i,intersectsTriangle:l}=e;if(i&&l){const u=i;i=(o,m,v,y,d)=>u(o,m,v,y,d)?!0:r(o,m,this,l,v,y,t)}else i||(l?i=(u,o,m,v)=>r(u,o,this,l,m,v,t):i=(u,o,m)=>m);let c=!1,h=0;const f=this._roots;for(let u=0,o=f.length;u<o;u++){const m=f[u];if(c=vn(this,u,a,i,n,h),c)break;h+=m.byteLength}return de.releasePrimitive(t),c}bvhcast(e,t,r){let{intersectsRanges:n,intersectsTriangles:a}=r;const i=de.getPrimitive(),l=this.geometry.index,c=this.geometry.attributes.position,h=this.indirect?v=>{const y=this.resolveTriangleIndex(v);$(i,y*3,l,c)}:v=>{$(i,v*3,l,c)},f=de.getPrimitive(),u=e.geometry.index,o=e.geometry.attributes.position,m=e.indirect?v=>{const y=e.resolveTriangleIndex(v);$(f,y*3,u,o)}:v=>{$(f,v*3,u,o)};if(a){const v=(y,d,p,g,x,w,b,S)=>{for(let R=p,M=p+g;R<M;R++){m(R),f.a.applyMatrix4(t),f.b.applyMatrix4(t),f.c.applyMatrix4(t),f.needsUpdate=!0;for(let I=y,P=y+d;I<P;I++)if(h(I),i.needsUpdate=!0,a(i,f,I,R,x,w,b,S))return!0}return!1};if(n){const y=n;n=function(d,p,g,x,w,b,S,R){return y(d,p,g,x,w,b,S,R)?!0:v(d,p,g,x,w,b,S,R)}}else n=v}return Yn(this,e,t,n)}intersectsBox(e,t){return Vt.set(e.min,e.max,t),Vt.needsUpdate=!0,this.shapecast({intersectsBounds:r=>Vt.intersectsBox(r),intersectsTriangle:r=>Vt.intersectsTriangle(r)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,r={},n={},a=0,i=1/0){return(this.indirect?Gn:Nn)(this,e,t,r,n,a,i)}closestPointToPoint(e,t={},r=0,n=1/0){return xn(this,e,t,r,n)}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(r=>{q(0,new Float32Array(r),wr),e.union(wr)}),e}}function Qn(s){switch(s){case 1:return"R";case 2:return"RG";case 3:return"RGBA";case 4:return"RGBA"}throw new Error}function Kn(s){switch(s){case 1:return Kt;case 2:return Yr;case 3:return Q;case 4:return Q}}function Tr(s){switch(s){case 1:return Ms;case 2:return $r;case 3:return Ii;case 4:return Ii}}class os extends he{constructor(){super(),this.minFilter=G,this.magFilter=G,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(e){const t=this.overrideItemSize,r=e.itemSize,n=e.count;if(t!==null){if(r*n%t!==0)throw new Error("VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.");e.itemSize=t,e.count=n*r/t}const a=e.itemSize,i=e.count,l=e.normalized,c=e.array.constructor,h=c.BYTES_PER_ELEMENT;let f=this._forcedType,u=a;if(f===null)switch(c){case Float32Array:f=K;break;case Uint8Array:case Uint16Array:case Uint32Array:f=At;break;case Int8Array:case Int16Array:case Int32Array:f=ui;break}let o,m,v,y,d=Qn(a);switch(f){case K:v=1,m=Kn(a),l&&h===1?(y=c,d+="8",c===Uint8Array?o=Mi:(o=ar,d+="_SNORM")):(y=Float32Array,d+="32F",o=K);break;case ui:d+=h*8+"I",v=l?Math.pow(2,c.BYTES_PER_ELEMENT*8-1):1,m=Tr(a),h===1?(y=Int8Array,o=ar):h===2?(y=Int16Array,o=As):(y=Int32Array,o=ui);break;case At:d+=h*8+"UI",v=l?Math.pow(2,c.BYTES_PER_ELEMENT*8-1):1,m=Tr(a),h===1?(y=Uint8Array,o=Mi):h===2?(y=Uint16Array,o=Rs):(y=Uint32Array,o=At);break}u===3&&(m===Q||m===Ii)&&(u=4);const p=Math.ceil(Math.sqrt(i))||1,g=u*p*p,x=new y(g),w=e.normalized;e.normalized=!1;for(let b=0;b<i;b++){const S=u*b;x[S]=e.getX(b)/v,a>=2&&(x[S+1]=e.getY(b)/v),a>=3&&(x[S+2]=e.getZ(b)/v,u===4&&(x[S+3]=1)),a>=4&&(x[S+3]=e.getW(b)/v)}e.normalized=w,this.internalFormat=d,this.format=m,this.type=o,this.image.width=p,this.image.height=p,this.image.data=x,this.needsUpdate=!0,this.dispose(),e.itemSize=r,e.count=n}}class ls extends os{constructor(){super(),this._forcedType=At}}class cs extends os{constructor(){super(),this._forcedType=K}}class Zn{constructor(){this.index=new ls,this.position=new cs,this.bvhBounds=new he,this.bvhContents=new he,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(e){const{geometry:t}=e;if(ea(e,this.bvhBounds,this.bvhContents),this.position.updateFrom(t.attributes.position),e.indirect){const r=e._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==r.length)if(t.index)this._cachedIndexAttr=t.index.clone();else{const n=is(ts(t));this._cachedIndexAttr=new ue(n,1,!1)}Jn(t,r,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(t.index)}dispose(){const{index:e,position:t,bvhBounds:r,bvhContents:n}=this;e&&e.dispose(),t&&t.dispose(),r&&r.dispose(),n&&n.dispose()}}function Jn(s,e,t){const r=t.array,n=s.index?s.index.array:null;for(let a=0,i=e.length;a<i;a++){const l=3*a,c=3*e[a];for(let h=0;h<3;h++)r[l+h]=n?n[c+h]:c+h}}function ea(s,e,t){const r=s._roots;if(r.length!==1)throw new Error("MeshBVHUniformStruct: Multi-root BVHs not supported.");const n=r[0],a=new Uint16Array(n),i=new Uint32Array(n),l=new Float32Array(n),c=n.byteLength/Ee,h=2*Math.ceil(Math.sqrt(c/2)),f=new Float32Array(4*h*h),u=Math.ceil(Math.sqrt(c)),o=new Uint32Array(2*u*u);for(let m=0;m<c;m++){const v=m*Ee/4,y=v*2,d=v;for(let p=0;p<3;p++)f[8*m+0+p]=l[d+0+p],f[8*m+4+p]=l[d+3+p];if(J(y,a)){const p=oe(y,a),g=re(v,i),x=4294901760|p;o[m*2+0]=x,o[m*2+1]=g}else{const p=4*le(v,i)/Ee,g=Ui(v,i);o[m*2+0]=g,o[m*2+1]=p}}e.image.data=f,e.image.width=h,e.image.height=h,e.format=Q,e.type=K,e.internalFormat="RGBA32F",e.minFilter=G,e.magFilter=G,e.generateMipmaps=!1,e.needsUpdate=!0,e.dispose(),t.image.data=o,t.image.width=u,t.image.height=u,t.format=$r,t.type=At,t.internalFormat="RG32UI",t.minFilter=G,t.magFilter=G,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose()}const ta=`

// A stack of uint32 indices can can store the indices for
// a perfectly balanced tree with a depth up to 31. Lower stack
// depth gets higher performance.
//
// However not all trees are balanced. Best value to set this to
// is the trees max depth.
#ifndef BVH_STACK_DEPTH
#define BVH_STACK_DEPTH 60
#endif

#ifndef INFINITY
#define INFINITY 1e20
#endif

// Utilities
uvec4 uTexelFetch1D( usampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

ivec4 iTexelFetch1D( isampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 texelFetch1D( sampler2D tex, uint index ) {

	uint width = uint( textureSize( tex, 0 ).x );
	uvec2 uv;
	uv.x = index % width;
	uv.y = index / width;

	return texelFetch( tex, ivec2( uv ), 0 );

}

vec4 textureSampleBarycoord( sampler2D tex, vec3 barycoord, uvec3 faceIndices ) {

	return
		barycoord.x * texelFetch1D( tex, faceIndices.x ) +
		barycoord.y * texelFetch1D( tex, faceIndices.y ) +
		barycoord.z * texelFetch1D( tex, faceIndices.z );

}

void ndcToCameraRay(
	vec2 coord, mat4 cameraWorld, mat4 invProjectionMatrix,
	out vec3 rayOrigin, out vec3 rayDirection
) {

	// get camera look direction and near plane for camera clipping
	vec4 lookDirection = cameraWorld * vec4( 0.0, 0.0, - 1.0, 0.0 );
	vec4 nearVector = invProjectionMatrix * vec4( 0.0, 0.0, - 1.0, 1.0 );
	float near = abs( nearVector.z / nearVector.w );

	// get the camera direction and position from camera matrices
	vec4 origin = cameraWorld * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec4 direction = invProjectionMatrix * vec4( coord, 0.5, 1.0 );
	direction /= direction.w;
	direction = cameraWorld * direction - origin;

	// slide the origin along the ray until it sits at the near clip plane position
	origin.xyz += direction.xyz * near / dot( direction, lookDirection );

	rayOrigin = origin.xyz;
	rayDirection = direction.xyz;

}
`,ia=`

#ifndef TRI_INTERSECT_EPSILON
#define TRI_INTERSECT_EPSILON 1e-5
#endif

// Raycasting
bool intersectsBounds( vec3 rayOrigin, vec3 rayDirection, vec3 boundsMin, vec3 boundsMax, out float dist ) {

	// https://www.reddit.com/r/opengl/comments/8ntzz5/fast_glsl_ray_box_intersection/
	// https://tavianator.com/2011/ray_box.html
	vec3 invDir = 1.0 / rayDirection;

	// find intersection distances for each plane
	vec3 tMinPlane = invDir * ( boundsMin - rayOrigin );
	vec3 tMaxPlane = invDir * ( boundsMax - rayOrigin );

	// get the min and max distances from each intersection
	vec3 tMinHit = min( tMaxPlane, tMinPlane );
	vec3 tMaxHit = max( tMaxPlane, tMinPlane );

	// get the furthest hit distance
	vec2 t = max( tMinHit.xx, tMinHit.yz );
	float t0 = max( t.x, t.y );

	// get the minimum hit distance
	t = min( tMaxHit.xx, tMaxHit.yz );
	float t1 = min( t.x, t.y );

	// set distance to 0.0 if the ray starts inside the box
	dist = max( t0, 0.0 );

	return t1 >= dist;

}

bool intersectsTriangle(
	vec3 rayOrigin, vec3 rayDirection, vec3 a, vec3 b, vec3 c,
	out vec3 barycoord, out vec3 norm, out float dist, out float side
) {

	// https://stackoverflow.com/questions/42740765/intersection-between-line-and-triangle-in-3d
	vec3 edge1 = b - a;
	vec3 edge2 = c - a;
	norm = cross( edge1, edge2 );

	float det = - dot( rayDirection, norm );
	float invdet = 1.0 / det;

	vec3 AO = rayOrigin - a;
	vec3 DAO = cross( AO, rayDirection );

	vec4 uvt;
	uvt.x = dot( edge2, DAO ) * invdet;
	uvt.y = - dot( edge1, DAO ) * invdet;
	uvt.z = dot( AO, norm ) * invdet;
	uvt.w = 1.0 - uvt.x - uvt.y;

	// set the hit information
	barycoord = uvt.wxy; // arranged in A, B, C order
	dist = uvt.z;
	side = sign( det );
	norm = side * normalize( norm );

	// add an epsilon to avoid misses between triangles
	uvt += vec4( TRI_INTERSECT_EPSILON );

	return all( greaterThanEqual( uvt, vec4( 0.0 ) ) );

}

bool intersectTriangles(
	// geometry info and triangle range
	sampler2D positionAttr, usampler2D indexAttr, uint offset, uint count,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// outputs
	inout float minDistance, inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	bool found = false;
	vec3 localBarycoord, localNormal;
	float localDist, localSide;
	for ( uint i = offset, l = offset + count; i < l; i ++ ) {

		uvec3 indices = uTexelFetch1D( indexAttr, i ).xyz;
		vec3 a = texelFetch1D( positionAttr, indices.x ).rgb;
		vec3 b = texelFetch1D( positionAttr, indices.y ).rgb;
		vec3 c = texelFetch1D( positionAttr, indices.z ).rgb;

		if (
			intersectsTriangle( rayOrigin, rayDirection, a, b, c, localBarycoord, localNormal, localDist, localSide )
			&& localDist < minDistance
		) {

			found = true;
			minDistance = localDist;

			faceIndices = uvec4( indices.xyz, i );
			faceNormal = localNormal;

			side = localSide;
			barycoord = localBarycoord;
			dist = localDist;

		}

	}

	return found;

}

bool intersectsBVHNodeBounds( vec3 rayOrigin, vec3 rayDirection, sampler2D bvhBounds, uint currNodeIndex, out float dist ) {

	uint cni2 = currNodeIndex * 2u;
	vec3 boundsMin = texelFetch1D( bvhBounds, cni2 ).xyz;
	vec3 boundsMax = texelFetch1D( bvhBounds, cni2 + 1u ).xyz;
	return intersectsBounds( rayOrigin, rayDirection, boundsMin, boundsMax, dist );

}

// use a macro to hide the fact that we need to expand the struct into separate fields
#define	bvhIntersectFirstHit(		bvh,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)	_bvhIntersectFirstHit(		bvh.position, bvh.index, bvh.bvhBounds, bvh.bvhContents,		rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist	)

bool _bvhIntersectFirstHit(
	// bvh info
	sampler2D bvh_position, usampler2D bvh_index, sampler2D bvh_bvhBounds, usampler2D bvh_bvhContents,

	// ray
	vec3 rayOrigin, vec3 rayDirection,

	// output variables split into separate variables due to output precision
	inout uvec4 faceIndices, inout vec3 faceNormal, inout vec3 barycoord,
	inout float side, inout float dist
) {

	// stack needs to be twice as long as the deepest tree we expect because
	// we push both the left and right child onto the stack every traversal
	int ptr = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float triangleDistance = INFINITY;
	bool found = false;
	while ( ptr > - 1 && ptr < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ ptr ];
		ptr --;

		// check if we intersect the current bounds
		float boundsHitDistance;
		if (
			! intersectsBVHNodeBounds( rayOrigin, rayDirection, bvh_bvhBounds, currNodeIndex, boundsHitDistance )
			|| boundsHitDistance > triangleDistance
		) {

			continue;

		}

		uvec2 boundsInfo = uTexelFetch1D( bvh_bvhContents, currNodeIndex ).xy;
		bool isLeaf = bool( boundsInfo.x & 0xffff0000u );

		if ( isLeaf ) {

			uint count = boundsInfo.x & 0x0000ffffu;
			uint offset = boundsInfo.y;

			found = intersectTriangles(
				bvh_position, bvh_index, offset, count,
				rayOrigin, rayDirection, triangleDistance,
				faceIndices, faceNormal, barycoord, side, dist
			) || found;

		} else {

			uint leftIndex = currNodeIndex + 1u;
			uint splitAxis = boundsInfo.x & 0x0000ffffu;
			uint rightIndex = boundsInfo.y;

			bool leftToRight = rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			ptr ++;
			stack[ ptr ] = c2;

			ptr ++;
			stack[ ptr ] = c1;

		}

	}

	return found;

}
`,ra=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;function us(s,e,t=0){if(s.isInterleavedBufferAttribute){const r=s.itemSize;for(let n=0,a=s.count;n<a;n++){const i=n+t;e.setX(i,s.getX(n)),r>=2&&e.setY(i,s.getY(n)),r>=3&&e.setZ(i,s.getZ(n)),r>=4&&e.setW(i,s.getW(n))}}else{const r=e.array,n=r.constructor,a=r.BYTES_PER_ELEMENT*s.itemSize*t;new n(r.buffer,a,s.array.length).set(s.array)}}function Rt(s,e=null){const t=s.array.constructor,r=s.normalized,n=s.itemSize,a=e===null?s.count:e;return new ue(new t(n*a),n,r)}function ut(s,e){if(!s&&!e)return!0;if(!!s!=!!e)return!1;const t=s.count===e.count,r=s.normalized===e.normalized,n=s.array.constructor===e.array.constructor,a=s.itemSize===e.itemSize;return!(!t||!r||!n||!a)}function sa(s){const e=s[0].index!==null,t=new Set(Object.keys(s[0].attributes));if(!s[0].getAttribute("position"))throw new Error("StaticGeometryGenerator: position attribute is required.");for(let r=0;r<s.length;++r){const n=s[r];let a=0;if(e!==(n.index!==null))throw new Error("StaticGeometryGenerator: All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.");for(const i in n.attributes){if(!t.has(i))throw new Error('StaticGeometryGenerator: All geometries must have compatible attributes; make sure "'+i+'" attribute exists among all geometries, or in none of them.');a++}if(a!==t.size)throw new Error("StaticGeometryGenerator: All geometries must have the same number of attributes.")}}function na(s){let e=0;for(let t=0,r=s.length;t<r;t++)e+=s[t].getIndex().count;return e}function aa(s){let e=0;for(let t=0,r=s.length;t<r;t++)e+=s[t].getAttribute("position").count;return e}function oa(s,e,t){s.index&&s.index.count!==e&&s.setIndex(null);const r=s.attributes;for(const n in r)r[n].count!==t&&s.deleteAttribute(n)}function la(s,e={},t=new Ge){const{useGroups:r=!1,forceUpdate:n=!1,skipAssigningAttributes:a=[],overwriteIndex:i=!0}=e;sa(s);const l=s[0].index!==null,c=l?na(s):-1,h=aa(s);if(oa(t,c,h),r){let u=0;for(let o=0,m=s.length;o<m;o++){const v=s[o];let y;l?y=v.getIndex().count:y=v.getAttribute("position").count,t.addGroup(u,y,o),u+=y}}if(l){let u=!1;if(t.index||(t.setIndex(new ue(new Uint32Array(c),1,!1)),u=!0),u||i){let o=0,m=0;const v=t.getIndex();for(let y=0,d=s.length;y<d;y++){const p=s[y],g=p.getIndex();if(!(!n&&!u&&a[y]))for(let w=0;w<g.count;++w)v.setX(o+w,g.getX(w)+m);o+=g.count,m+=p.getAttribute("position").count}}}const f=Object.keys(s[0].attributes);for(let u=0,o=f.length;u<o;u++){let m=!1;const v=f[u];if(!t.getAttribute(v)){const p=s[0].getAttribute(v);t.setAttribute(v,Rt(p,h)),m=!0}let y=0;const d=t.getAttribute(v);for(let p=0,g=s.length;p<g;p++){const x=s[p],w=!n&&!m&&a[p],b=x.getAttribute(v);if(!w)if(v==="color"&&d.itemSize!==b.itemSize)for(let S=y,R=b.count;S<R;S++)b.setXYZW(S,d.getX(S),d.getY(S),d.getZ(S),1);else us(b,d,y);y+=b.count}}}function ca(s,e,t){const r=s.index,a=s.attributes.position.count,i=r?r.count:a;let l=s.groups;l.length===0&&(l=[{count:i,start:0,materialIndex:0}]);let c=s.getAttribute("materialIndex");if(!c||c.count!==a){let f;t.length<=255?f=new Uint8Array(a):f=new Uint16Array(a),c=new ue(f,1,!1),s.deleteAttribute("materialIndex"),s.setAttribute("materialIndex",c)}const h=c.array;for(let f=0;f<l.length;f++){const u=l[f],o=u.start,m=u.count,v=Math.min(m,i-o),y=Array.isArray(e)?e[u.materialIndex]:e,d=t.indexOf(y);for(let p=0;p<v;p++){let g=o+p;r&&(g=r.getX(g)),h[g]=d}}}function ua(s,e){if(!s.index){const t=s.attributes.position.count,r=new Array(t);for(let n=0;n<t;n++)r[n]=n;s.setIndex(r)}if(!s.attributes.normal&&e&&e.includes("normal")&&s.computeVertexNormals(),!s.attributes.uv&&e&&e.includes("uv")){const t=s.attributes.position.count;s.setAttribute("uv",new ue(new Float32Array(t*2),2,!1))}if(!s.attributes.uv2&&e&&e.includes("uv2")){const t=s.attributes.position.count;s.setAttribute("uv2",new ue(new Float32Array(t*2),2,!1))}if(!s.attributes.tangent&&e&&e.includes("tangent"))if(s.attributes.uv&&s.attributes.normal)s.computeTangents();else{const t=s.attributes.position.count;s.setAttribute("tangent",new ue(new Float32Array(t*4),4,!1))}if(!s.attributes.color&&e&&e.includes("color")){const t=s.attributes.position.count,r=new Float32Array(t*4);r.fill(1),s.setAttribute("color",new ue(r,4))}}function qi(s){let e=0;if(s.byteLength!==0){const t=new Uint8Array(s);for(let r=0;r<s.byteLength;r++){const n=t[r];e=(e<<5)-e+n,e|=0}}return e}function Sr(s){let e=s.uuid;const t=Object.values(s.attributes);s.index&&(t.push(s.index),e+=`index|${s.index.version}`);const r=Object.keys(t).sort();for(const n of r){const a=t[n];e+=`${n}_${a.version}|`}return e}function _r(s){const e=s.skeleton;return e?(e.boneTexture||e.computeBoneTexture(),`${qi(e.boneTexture.image.data.buffer)}_${e.boneTexture.uuid}`):null}class fa{constructor(e=null){this.matrixWorld=new ee,this.geometryHash=null,this.skeletonHash=null,this.primitiveCount=-1,e!==null&&this.updateFrom(e)}updateFrom(e){const t=e.geometry,r=(t.index?t.index.count:t.attributes.position.count)/3;this.matrixWorld.copy(e.matrixWorld),this.geometryHash=Sr(t),this.primitiveCount=r,this.skeletonHash=_r(e)}didChange(e){const t=e.geometry,r=(t.index?t.index.count:t.attributes.position.count)/3;return!(this.matrixWorld.equals(e.matrixWorld)&&this.geometryHash===Sr(t)&&this.skeletonHash===_r(e)&&this.primitiveCount===r)}}const We=new B,Ve=new B,je=new B,Rr=new dt,jt=new B,Ti=new B,Ar=new dt,Mr=new dt,qt=new ee,Ir=new ee;function Pr(s,e,t){const r=s.skeleton,n=s.geometry,a=r.bones,i=r.boneInverses;Ar.fromBufferAttribute(n.attributes.skinIndex,e),Mr.fromBufferAttribute(n.attributes.skinWeight,e),qt.elements.fill(0);for(let l=0;l<4;l++){const c=Mr.getComponent(l);if(c!==0){const h=Ar.getComponent(l);Ir.multiplyMatrices(a[h].matrixWorld,i[h]),da(qt,Ir,c)}}return qt.multiply(s.bindMatrix).premultiply(s.bindMatrixInverse),t.transformDirection(qt),t}function Si(s,e,t,r,n){jt.set(0,0,0);for(let a=0,i=s.length;a<i;a++){const l=e[a],c=s[a];l!==0&&(Ti.fromBufferAttribute(c,r),t?jt.addScaledVector(Ti,l):jt.addScaledVector(Ti.sub(n),l))}n.add(jt)}function da(s,e,t){const r=s.elements,n=e.elements;for(let a=0,i=n.length;a<i;a++)r[a]+=n[a]*t}function ha(s){const{index:e,attributes:t}=s;if(e)for(let r=0,n=e.count;r<n;r+=3){const a=e.getX(r),i=e.getX(r+2);e.setX(r,i),e.setX(r+2,a)}else for(const r in t){const n=t[r],a=n.itemSize;for(let i=0,l=n.count;i<l;i+=3)for(let c=0;c<a;c++){const h=n.getComponent(i,c),f=n.getComponent(i+2,c);n.setComponent(i,c,f),n.setComponent(i+2,c,h)}}return s}function ma(s,e={},t=new Ge){e={applyWorldTransforms:!0,attributes:[],...e};const r=s.geometry,n=e.applyWorldTransforms,a=e.attributes.includes("normal"),i=e.attributes.includes("tangent"),l=r.attributes,c=t.attributes;for(const g in t.attributes)(!e.attributes.includes(g)||!(g in r.attributes))&&t.deleteAttribute(g);!t.index&&r.index&&(t.index=r.index.clone()),c.position||t.setAttribute("position",Rt(l.position)),a&&!c.normal&&l.normal&&t.setAttribute("normal",Rt(l.normal)),i&&!c.tangent&&l.tangent&&t.setAttribute("tangent",Rt(l.tangent)),ut(r.index,t.index),ut(l.position,c.position),a&&ut(l.normal,c.normal),i&&ut(l.tangent,c.tangent);const h=l.position,f=a?l.normal:null,u=i?l.tangent:null,o=r.morphAttributes.position,m=r.morphAttributes.normal,v=r.morphAttributes.tangent,y=r.morphTargetsRelative,d=s.morphTargetInfluences,p=new Is;p.getNormalMatrix(s.matrixWorld),r.index&&t.index.array.set(r.index.array);for(let g=0,x=l.position.count;g<x;g++)We.fromBufferAttribute(h,g),f&&Ve.fromBufferAttribute(f,g),u&&(Rr.fromBufferAttribute(u,g),je.fromBufferAttribute(u,g)),d&&(o&&Si(o,d,y,g,We),m&&Si(m,d,y,g,Ve),v&&Si(v,d,y,g,je)),s.isSkinnedMesh&&(s.applyBoneTransform(g,We),f&&Pr(s,g,Ve),u&&Pr(s,g,je)),n&&We.applyMatrix4(s.matrixWorld),c.position.setXYZ(g,We.x,We.y,We.z),f&&(n&&Ve.applyNormalMatrix(p),c.normal.setXYZ(g,Ve.x,Ve.y,Ve.z)),u&&(n&&je.transformDirection(s.matrixWorld),c.tangent.setXYZW(g,je.x,je.y,je.z,Rr.w));for(const g in e.attributes){const x=e.attributes[g];x==="position"||x==="tangent"||x==="normal"||!(x in l)||(c[x]||t.setAttribute(x,Rt(l[x])),ut(l[x],c[x]),us(l[x],c[x]))}return s.matrixWorld.determinant()<0&&ha(t),t}class pa extends Ge{constructor(){super(),this.version=0,this.hash=null,this._diff=new fa}isCompatible(e,t){const r=e.geometry;for(let n=0;n<t.length;n++){const a=t[n],i=r.attributes[a],l=this.attributes[a];if(i&&!ut(i,l))return!1}return!0}updateFrom(e,t){const r=this._diff;return r.didChange(e)?(ma(e,t,this),r.updateFrom(e),this.version++,this.hash=`${this.uuid}_${this.version}`,!0):!1}}const Oi=0,fs=1,ds=2;function ga(s,e){for(let t=0,r=s.length;t<r;t++)s[t].traverseVisible(a=>{a.isMesh&&e(a)})}function va(s){const e=[];for(let t=0,r=s.length;t<r;t++){const n=s[t];Array.isArray(n.material)?e.push(...n.material):e.push(n.material)}return e}function xa(s,e,t){if(s.length===0){e.setIndex(null);const r=e.attributes;for(const n in r)e.deleteAttribute(n);for(const n in t.attributes)e.setAttribute(t.attributes[n],new ue(new Float32Array(0),4,!1))}else la(s,t,e);for(const r in e.attributes)e.attributes[r].needsUpdate=!0}class ya{constructor(e){this.objects=null,this.useGroups=!0,this.applyWorldTransforms=!0,this.generateMissingAttributes=!0,this.overwriteIndex=!0,this.attributes=["position","normal","color","tangent","uv","uv2"],this._intermediateGeometry=new Map,this._geometryMergeSets=new WeakMap,this._mergeOrder=[],this._dummyMesh=null,this.setObjects(e||[])}_getDummyMesh(){if(!this._dummyMesh){const e=new Ps,t=new Ge;t.setAttribute("position",new ue(new Float32Array(9),3)),this._dummyMesh=new Xr(t,e)}return this._dummyMesh}_getMeshes(){const e=[];return ga(this.objects,t=>{e.push(t)}),e.sort((t,r)=>t.uuid>r.uuid?1:t.uuid<r.uuid?-1:0),e.length===0&&e.push(this._getDummyMesh()),e}_updateIntermediateGeometries(){const{_intermediateGeometry:e}=this,t=this._getMeshes(),r=new Set(e.keys()),n={attributes:this.attributes,applyWorldTransforms:this.applyWorldTransforms};for(let a=0,i=t.length;a<i;a++){const l=t[a],c=l.uuid;r.delete(c);let h=e.get(c);(!h||!h.isCompatible(l,this.attributes))&&(h&&h.dispose(),h=new pa,e.set(c,h)),h.updateFrom(l,n)&&this.generateMissingAttributes&&ua(h,this.attributes)}r.forEach(a=>{e.delete(a)})}setObjects(e){Array.isArray(e)?this.objects=[...e]:this.objects=[e]}generate(e=new Ge){const{useGroups:t,overwriteIndex:r,_intermediateGeometry:n,_geometryMergeSets:a}=this,i=this._getMeshes(),l=[],c=[],h=a.get(e)||[];this._updateIntermediateGeometries();let f=!1;i.length!==h.length&&(f=!0);for(let o=0,m=i.length;o<m;o++){const v=i[o],y=n.get(v.uuid);c.push(y);const d=h[o];!d||d.uuid!==y.uuid?(l.push(!1),f=!0):d.version!==y.version?l.push(!1):l.push(!0)}xa(c,e,{useGroups:t,forceUpdate:f,skipAssigningAttributes:l,overwriteIndex:r}),f&&e.dispose(),a.set(e,c.map(o=>({version:o.version,uuid:o.uuid})));let u=Oi;return f?u=ds:l.includes(!1)&&(u=fs),{changeType:u,materials:va(i),geometry:e}}}function ba(s){const e=new Set;for(let t=0,r=s.length;t<r;t++){const n=s[t];for(const a in n){const i=n[a];i&&i.isTexture&&e.add(i)}}return Array.from(e)}function wa(s){const e=[],t=new Set;for(let n=0,a=s.length;n<a;n++)s[n].traverse(i=>{i.visible&&(i.isRectAreaLight||i.isSpotLight||i.isPointLight||i.isDirectionalLight)&&(e.push(i),i.iesMap&&t.add(i.iesMap))});const r=Array.from(t).sort((n,a)=>n.uuid<a.uuid?1:n.uuid>a.uuid?-1:0);return{lights:e,iesTextures:r}}class Ta{get initialized(){return!!this.bvh}constructor(e){this.bvhOptions={},this.attributes=["position","normal","tangent","color","uv","uv2"],this.generateBVH=!0,this.bvh=null,this.geometry=new Ge,this.staticGeometryGenerator=new ya(e),this._bvhWorker=null,this._pendingGenerate=null,this._buildAsync=!1,this._materialUuids=null}setObjects(e){this.staticGeometryGenerator.setObjects(e)}setBVHWorker(e){this._bvhWorker=e}async generateAsync(e=null){if(!this._bvhWorker)throw new Error('PathTracingSceneGenerator: "setBVHWorker" must be called before "generateAsync" can be called.');if(this.bvh instanceof Promise)return this._pendingGenerate||(this._pendingGenerate=new Promise(async()=>(await this.bvh,this._pendingGenerate=null,this.generateAsync(e)))),this._pendingGenerate;{this._buildAsync=!0;const t=this.generate(e);return this._buildAsync=!1,t.bvh=this.bvh=await t.bvh,t}}generate(e=null){const{staticGeometryGenerator:t,geometry:r,attributes:n}=this,a=t.objects;t.attributes=n,a.forEach(o=>{o.traverse(m=>{m.isSkinnedMesh&&m.skeleton&&m.skeleton.update()})});const i=t.generate(r),l=i.materials;let c=i.changeType!==Oi||this._materialUuids===null||this._materialUuids.length!==length;if(!c){for(let o=0,m=l.length;o<m;o++)if(l[o].uuid!==this._materialUuids[o]){c=!0;break}}const h=ba(l),{lights:f,iesTextures:u}=wa(a);if(c&&(ca(r,l,l),this._materialUuids=l.map(o=>o.uuid)),this.generateBVH){if(this.bvh instanceof Promise)throw new Error("PathTracingSceneGenerator: BVH is already building asynchronously.");if(i.changeType===ds){const o={strategy:es,maxLeafTris:1,indirect:!0,onProgress:e,...this.bvhOptions};this._buildAsync?this.bvh=this._bvhWorker.generate(r,o):this.bvh=new ji(r,o)}else i.changeType===fs&&this.bvh.refit()}return{bvhChanged:i.changeType!==Oi,bvh:this.bvh,needsMaterialIndexUpdate:c,lights:f,iesTextures:u,geometry:r,materials:l,textures:h,objects:a}}}const Sa=new Cs(-1,1,1,-1,0,1);class _a extends Ge{constructor(){super(),this.setAttribute("position",new or([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new or([0,2,0,0,2,0],2))}}const Ra=new _a;class $e{constructor(e){this._mesh=new Xr(Ra,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Sa)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class ii extends Jt{set needsUpdate(e){super.needsUpdate=!0,this.dispatchEvent({type:"recompilation"})}constructor(e){super(e);for(const t in this.uniforms)Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(r){this.uniforms[t].value=r}})}setDefine(e,t=void 0){if(t==null){if(e in this.defines)return delete this.defines[e],this.needsUpdate=!0,!0}else if(this.defines[e]!==t)return this.defines[e]=t,this.needsUpdate=!0,!0;return!1}}class Aa extends ii{constructor(e){super({blending:ht,uniforms:{target1:{value:null},target2:{value:null},opacity:{value:1}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				uniform float opacity;

				uniform sampler2D target1;
				uniform sampler2D target2;

				varying vec2 vUv;

				void main() {

					vec4 color1 = texture2D( target1, vUv );
					vec4 color2 = texture2D( target2, vUv );

					float invOpacity = 1.0 - opacity;
					float totalAlpha = color1.a * invOpacity + color2.a * opacity;

					if ( color1.a != 0.0 || color2.a != 0.0 ) {

						gl_FragColor.rgb = color1.rgb * ( invOpacity * color1.a / totalAlpha ) + color2.rgb * ( opacity * color2.a / totalAlpha );
						gl_FragColor.a = totalAlpha;

					} else {

						gl_FragColor = vec4( 0.0 );

					}

				}`}),this.setValues(e)}}function Gt(s=1){let e="uint";return s>1&&(e="uvec"+s),`
		${e} sobolReverseBits( ${e} x ) {

			x = ( ( ( x & 0xaaaaaaaau ) >> 1 ) | ( ( x & 0x55555555u ) << 1 ) );
			x = ( ( ( x & 0xccccccccu ) >> 2 ) | ( ( x & 0x33333333u ) << 2 ) );
			x = ( ( ( x & 0xf0f0f0f0u ) >> 4 ) | ( ( x & 0x0f0f0f0fu ) << 4 ) );
			x = ( ( ( x & 0xff00ff00u ) >> 8 ) | ( ( x & 0x00ff00ffu ) << 8 ) );
			return ( ( x >> 16 ) | ( x << 16 ) );

		}

		${e} sobolHashCombine( uint seed, ${e} v ) {

			return seed ^ ( v + ${e}( ( seed << 6 ) + ( seed >> 2 ) ) );

		}

		${e} sobolLaineKarrasPermutation( ${e} x, ${e} seed ) {

			x += seed;
			x ^= x * 0x6c50b47cu;
			x ^= x * 0xb82f1e52u;
			x ^= x * 0xc7afe638u;
			x ^= x * 0x8d22f6e6u;
			return x;

		}

		${e} nestedUniformScrambleBase2( ${e} x, ${e} seed ) {

			x = sobolLaineKarrasPermutation( x, seed );
			x = sobolReverseBits( x );
			return x;

		}
	`}function $t(s=1){let e="uint",t="float",r="",n=".r",a="1u";return s>1&&(e="uvec"+s,t="vec"+s,r=s+"",s===2?(n=".rg",a="uvec2( 1u, 2u )"):s===3?(n=".rgb",a="uvec3( 1u, 2u, 3u )"):(n="",a="uvec4( 1u, 2u, 3u, 4u )")),`

		${t} sobol${r}( int effect ) {

			uint seed = sobolGetSeed( sobolBounceIndex, uint( effect ) );
			uint index = sobolPathIndex;

			uint shuffle_seed = sobolHashCombine( seed, 0u );
			uint shuffled_index = nestedUniformScrambleBase2( sobolReverseBits( index ), shuffle_seed );
			${t} sobol_pt = sobolGetTexturePoint( shuffled_index )${n};
			${e} result = ${e}( sobol_pt * 16777216.0 );

			${e} seed2 = sobolHashCombine( seed, ${a} );
			result = nestedUniformScrambleBase2( result, seed2 );

			return SOBOL_FACTOR * ${t}( result >> 8 );

		}
	`}const hs=`

	// Utils
	const float SOBOL_FACTOR = 1.0 / 16777216.0;
	const uint SOBOL_MAX_POINTS = 256u * 256u;

	${Gt(1)}
	${Gt(2)}
	${Gt(3)}
	${Gt(4)}

	uint sobolHash( uint x ) {

		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}

`,Ma=`

	const uint SOBOL_DIRECTIONS_1[ 32 ] = uint[ 32 ](
		0x80000000u, 0xc0000000u, 0xa0000000u, 0xf0000000u,
		0x88000000u, 0xcc000000u, 0xaa000000u, 0xff000000u,
		0x80800000u, 0xc0c00000u, 0xa0a00000u, 0xf0f00000u,
		0x88880000u, 0xcccc0000u, 0xaaaa0000u, 0xffff0000u,
		0x80008000u, 0xc000c000u, 0xa000a000u, 0xf000f000u,
		0x88008800u, 0xcc00cc00u, 0xaa00aa00u, 0xff00ff00u,
		0x80808080u, 0xc0c0c0c0u, 0xa0a0a0a0u, 0xf0f0f0f0u,
		0x88888888u, 0xccccccccu, 0xaaaaaaaau, 0xffffffffu
	);

	const uint SOBOL_DIRECTIONS_2[ 32 ] = uint[ 32 ](
		0x80000000u, 0xc0000000u, 0x60000000u, 0x90000000u,
		0xe8000000u, 0x5c000000u, 0x8e000000u, 0xc5000000u,
		0x68800000u, 0x9cc00000u, 0xee600000u, 0x55900000u,
		0x80680000u, 0xc09c0000u, 0x60ee0000u, 0x90550000u,
		0xe8808000u, 0x5cc0c000u, 0x8e606000u, 0xc5909000u,
		0x6868e800u, 0x9c9c5c00u, 0xeeee8e00u, 0x5555c500u,
		0x8000e880u, 0xc0005cc0u, 0x60008e60u, 0x9000c590u,
		0xe8006868u, 0x5c009c9cu, 0x8e00eeeeu, 0xc5005555u
	);

	const uint SOBOL_DIRECTIONS_3[ 32 ] = uint[ 32 ](
		0x80000000u, 0xc0000000u, 0x20000000u, 0x50000000u,
		0xf8000000u, 0x74000000u, 0xa2000000u, 0x93000000u,
		0xd8800000u, 0x25400000u, 0x59e00000u, 0xe6d00000u,
		0x78080000u, 0xb40c0000u, 0x82020000u, 0xc3050000u,
		0x208f8000u, 0x51474000u, 0xfbea2000u, 0x75d93000u,
		0xa0858800u, 0x914e5400u, 0xdbe79e00u, 0x25db6d00u,
		0x58800080u, 0xe54000c0u, 0x79e00020u, 0xb6d00050u,
		0x800800f8u, 0xc00c0074u, 0x200200a2u, 0x50050093u
	);

	const uint SOBOL_DIRECTIONS_4[ 32 ] = uint[ 32 ](
		0x80000000u, 0x40000000u, 0x20000000u, 0xb0000000u,
		0xf8000000u, 0xdc000000u, 0x7a000000u, 0x9d000000u,
		0x5a800000u, 0x2fc00000u, 0xa1600000u, 0xf0b00000u,
		0xda880000u, 0x6fc40000u, 0x81620000u, 0x40bb0000u,
		0x22878000u, 0xb3c9c000u, 0xfb65a000u, 0xddb2d000u,
		0x78022800u, 0x9c0b3c00u, 0x5a0fb600u, 0x2d0ddb00u,
		0xa2878080u, 0xf3c9c040u, 0xdb65a020u, 0x6db2d0b0u,
		0x800228f8u, 0x400b3cdcu, 0x200fb67au, 0xb00ddb9du
	);

	uint getMaskedSobol( uint index, uint directions[ 32 ] ) {

		uint X = 0u;
		for ( int bit = 0; bit < 32; bit ++ ) {

			uint mask = ( index >> bit ) & 1u;
			X ^= mask * directions[ bit ];

		}
		return X;

	}

	vec4 generateSobolPoint( uint index ) {

		if ( index >= SOBOL_MAX_POINTS ) {

			return vec4( 0.0 );

		}

		// NOTE: this sobol "direction" is also available but we can't write out 5 components
		// uint x = index & 0x00ffffffu;
		uint x = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_1 ) ) & 0x00ffffffu;
		uint y = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_2 ) ) & 0x00ffffffu;
		uint z = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_3 ) ) & 0x00ffffffu;
		uint w = sobolReverseBits( getMaskedSobol( index, SOBOL_DIRECTIONS_4 ) ) & 0x00ffffffu;

		return vec4( x, y, z, w ) * SOBOL_FACTOR;

	}

`,Ia=`

	// Seeds
	uniform sampler2D sobolTexture;
	uint sobolPixelIndex = 0u;
	uint sobolPathIndex = 0u;
	uint sobolBounceIndex = 0u;

	uint sobolGetSeed( uint bounce, uint effect ) {

		return sobolHash(
			sobolHashCombine(
				sobolHashCombine(
					sobolHash( bounce ),
					sobolPixelIndex
				),
				effect
			)
		);

	}

	vec4 sobolGetTexturePoint( uint index ) {

		if ( index >= SOBOL_MAX_POINTS ) {

			index = index % SOBOL_MAX_POINTS;

		}

		uvec2 dim = uvec2( textureSize( sobolTexture, 0 ).xy );
		uint y = index / dim.x;
		uint x = index - y * dim.x;
		vec2 uv = vec2( x, y ) / vec2( dim );
		return texture( sobolTexture, uv );

	}

	${$t(1)}
	${$t(2)}
	${$t(3)}
	${$t(4)}

`;class Pa extends ii{constructor(){super({blending:ht,uniforms:{resolution:{value:new Z}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`

				${hs}
				${Ma}

				varying vec2 vUv;
				uniform vec2 resolution;
				void main() {

					uint index = uint( gl_FragCoord.y ) * uint( resolution.x ) + uint( gl_FragCoord.x );
					gl_FragColor = generateSobolPoint( index );

				}
			`})}}class Ca{generate(e,t=256){const r=new Mt(t,t,{type:K,format:Q,minFilter:G,magFilter:G,generateMipmaps:!1}),n=e.getRenderTarget();e.setRenderTarget(r);const a=new $e(new Pa);return a.material.resolution.set(t,t),a.render(e),e.setRenderTarget(n),a.dispose(),r}}class ms extends Qr{set bokehSize(e){this.fStop=this.getFocalLength()/e}get bokehSize(){return this.getFocalLength()/this.fStop}constructor(...e){super(...e),this.fStop=1.4,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=25,this.anamorphicRatio=1}copy(e,t){return super.copy(e,t),this.fStop=e.fStop,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio,this}}class Fa{constructor(){this.bokehSize=0,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=10,this.anamorphicRatio=1}updateFrom(e){e instanceof ms?(this.bokehSize=e.bokehSize,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio):(this.bokehSize=0,this.apertureRotation=0,this.apertureBlades=0,this.focusDistance=10,this.anamorphicRatio=1)}}function _i(s){const e=new Uint16Array(s.length);for(let t=0,r=s.length;t<r;++t)e[t]=Re.toHalfFloat(s[t]);return e}function Cr(s,e,t=0,r=s.length){let n=t,a=t+r-1;for(;n<a;){const i=n+a>>1;s[i]<e?n=i+1:a=i}return n-t}function Da(s,e,t){return .2126*s+.7152*e+.0722*t}function Ea(s,e=be){const t=s.clone();t.source=new Fs({...t.image});const{width:r,height:n,data:a}=t.image;let i=a;if(t.type!==e){e===be?i=new Uint16Array(a.length):i=new Float32Array(a.length);let l;a instanceof Int8Array||a instanceof Int16Array||a instanceof Int32Array?l=2**(8*a.BYTES_PER_ELEMENT-1)-1:l=2**(8*a.BYTES_PER_ELEMENT)-1;for(let c=0,h=a.length;c<h;c++){let f=a[c];t.type===be&&(f=Re.fromHalfFloat(a[c])),t.type!==K&&t.type!==be&&(f/=l),e===be&&(i[c]=Re.toHalfFloat(f))}t.image.data=i,t.type=e}if(t.flipY){const l=i;i=i.slice();for(let c=0;c<n;c++)for(let h=0;h<r;h++){const f=n-c-1,u=4*(c*r+h),o=4*(f*r+h);i[o+0]=l[u+0],i[o+1]=l[u+1],i[o+2]=l[u+2],i[o+3]=l[u+3]}t.flipY=!1,t.image.data=i}return t}class Ba{constructor(){const e=new he(_i(new Float32Array([0,0,0,0])),1,1);e.type=be,e.format=Q,e.minFilter=xe,e.magFilter=xe,e.wrapS=De,e.wrapT=De,e.generateMipmaps=!1,e.needsUpdate=!0;const t=new he(_i(new Float32Array([0,1])),1,2);t.type=be,t.format=Kt,t.minFilter=xe,t.magFilter=xe,t.generateMipmaps=!1,t.needsUpdate=!0;const r=new he(_i(new Float32Array([0,0,1,1])),2,2);r.type=be,r.format=Kt,r.minFilter=xe,r.magFilter=xe,r.generateMipmaps=!1,r.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=r,this.totalSum=0}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){const t=Ea(e);t.wrapS=De,t.wrapT=Be;const{width:r,height:n,data:a}=t.image,i=new Float32Array(r*n),l=new Float32Array(r*n),c=new Float32Array(n),h=new Float32Array(n);let f=0,u=0;for(let d=0;d<n;d++){let p=0;for(let g=0;g<r;g++){const x=d*r+g,w=Re.fromHalfFloat(a[4*x+0]),b=Re.fromHalfFloat(a[4*x+1]),S=Re.fromHalfFloat(a[4*x+2]),R=Da(w,b,S);p+=R,f+=R,i[x]=R,l[x]=p}if(p!==0)for(let g=d*r,x=d*r+r;g<x;g++)i[g]/=p,l[g]/=p;u+=p,c[d]=p,h[d]=u}if(u!==0)for(let d=0,p=c.length;d<p;d++)c[d]/=u,h[d]/=u;const o=new Uint16Array(n),m=new Uint16Array(r*n);for(let d=0;d<n;d++){const p=(d+1)/n,g=Cr(h,p);o[d]=Re.toHalfFloat((g+.5)/n)}for(let d=0;d<n;d++)for(let p=0;p<r;p++){const g=d*r+p,x=(p+1)/r,w=Cr(l,x,d*r,r);m[g]=Re.toHalfFloat((w+.5)/r)}this.dispose();const{marginalWeights:v,conditionalWeights:y}=this;v.image={width:n,height:1,data:o},v.needsUpdate=!0,y.image={width:r,height:n,data:m},y.needsUpdate=!0,this.totalSum=f,this.map=t}}const Ri=6,ka=0,Na=1,za=2,Oa=3,La=4,ge=new B,ie=new B,Fr=new ee,ot=new Ds,Dr=new B,lt=new B,Ha=new B(0,1,0);class Ua{constructor(){const e=new he(new Float32Array(4),1,1);e.format=Q,e.type=K,e.wrapS=Be,e.wrapT=Be,e.generateMipmaps=!1,e.minFilter=G,e.magFilter=G,this.tex=e,this.count=0}updateFrom(e,t=[]){const r=this.tex,n=Math.max(e.length*Ri,1),a=Math.ceil(Math.sqrt(n));r.image.width!==a&&(r.dispose(),r.image.data=new Float32Array(a*a*4),r.image.width=a,r.image.height=a);const i=r.image.data;for(let c=0,h=e.length;c<h;c++){const f=e[c],u=c*Ri*4;let o=0;for(let v=0;v<Ri*4;v++)i[u+v]=0;f.getWorldPosition(ie),i[u+o++]=ie.x,i[u+o++]=ie.y,i[u+o++]=ie.z;let m=ka;if(f.isRectAreaLight&&f.isCircular?m=Na:f.isSpotLight?m=za:f.isDirectionalLight?m=Oa:f.isPointLight&&(m=La),i[u+o++]=m,i[u+o++]=f.color.r,i[u+o++]=f.color.g,i[u+o++]=f.color.b,i[u+o++]=f.intensity,f.getWorldQuaternion(ot),f.isRectAreaLight)ge.set(f.width,0,0).applyQuaternion(ot),i[u+o++]=ge.x,i[u+o++]=ge.y,i[u+o++]=ge.z,o++,ie.set(0,f.height,0).applyQuaternion(ot),i[u+o++]=ie.x,i[u+o++]=ie.y,i[u+o++]=ie.z,i[u+o++]=ge.cross(ie).length()*(f.isCircular?Math.PI/4:1);else if(f.isSpotLight){const v=f.radius||0;Dr.setFromMatrixPosition(f.matrixWorld),lt.setFromMatrixPosition(f.target.matrixWorld),Fr.lookAt(Dr,lt,Ha),ot.setFromRotationMatrix(Fr),ge.set(1,0,0).applyQuaternion(ot),i[u+o++]=ge.x,i[u+o++]=ge.y,i[u+o++]=ge.z,o++,ie.set(0,1,0).applyQuaternion(ot),i[u+o++]=ie.x,i[u+o++]=ie.y,i[u+o++]=ie.z,i[u+o++]=Math.PI*v*v,i[u+o++]=v,i[u+o++]=f.decay,i[u+o++]=f.distance,i[u+o++]=Math.cos(f.angle),i[u+o++]=Math.cos(f.angle*(1-f.penumbra)),i[u+o++]=f.iesMap?t.indexOf(f.iesMap):-1}else if(f.isPointLight){const v=ge.setFromMatrixPosition(f.matrixWorld);i[u+o++]=v.x,i[u+o++]=v.y,i[u+o++]=v.z,o++,o+=4,o+=1,i[u+o++]=f.decay,i[u+o++]=f.distance}else if(f.isDirectionalLight){const v=ge.setFromMatrixPosition(f.matrixWorld),y=ie.setFromMatrixPosition(f.target.matrixWorld);lt.subVectors(v,y).normalize(),i[u+o++]=lt.x,i[u+o++]=lt.y,i[u+o++]=lt.z}}this.count=e.length;const l=qi(i.buffer);return this.hash!==l?(this.hash=l,r.needsUpdate=!0,!0):!1}}function Er(s,e,t,r,n){if(e>r)throw new Error;const a=s.length/e,i=s.constructor.BYTES_PER_ELEMENT*8;let l=1;switch(s.constructor){case Uint8Array:case Uint16Array:case Uint32Array:l=2**i-1;break;case Int8Array:case Int16Array:case Int32Array:l=2**(i-1)-1;break}for(let c=0;c<a;c++){const h=4*c,f=e*c;for(let u=0;u<r;u++)t[n+h+u]=e>=u+1?s[f+u]/l:0}}class Wa extends Es{constructor(){super(),this._textures=[],this.type=K,this.format=Q,this.internalFormat="RGBA32F"}updateAttribute(e,t){const r=this._textures[e];r.updateFrom(t);const n=r.image,a=this.image;if(n.width!==a.width||n.height!==a.height)throw new Error("FloatAttributeTextureArray: Attribute must be the same dimensions when updating single layer.");const{width:i,height:l,data:c}=a,f=i*l*4*e;let u=t.itemSize;u===3&&(u=4),Er(r.image.data,u,c,4,f),this.dispose(),this.needsUpdate=!0}setAttributes(e){const t=e[0].count,r=e.length;for(let u=0,o=r;u<o;u++)if(e[u].count!==t)throw new Error("FloatAttributeTextureArray: All attributes must have the same item count.");const n=this._textures;for(;n.length<r;){const u=new cs;n.push(u)}for(;n.length>r;)n.pop();for(let u=0,o=r;u<o;u++)n[u].updateFrom(e[u]);const i=n[0].image,l=this.image;(i.width!==l.width||i.height!==l.height||i.depth!==r)&&(l.width=i.width,l.height=i.height,l.depth=r,l.data=new Float32Array(l.width*l.height*l.depth*4));const{data:c,width:h,height:f}=l;for(let u=0,o=r;u<o;u++){const m=n[u],y=h*f*4*u;let d=e[u].itemSize;d===3&&(d=4),Er(m.image.data,d,c,4,y)}this.dispose(),this.needsUpdate=!0}}class Va extends Wa{updateNormalAttribute(e){this.updateAttribute(0,e)}updateTangentAttribute(e){this.updateAttribute(1,e)}updateUvAttribute(e){this.updateAttribute(2,e)}updateColorAttribute(e){this.updateAttribute(3,e)}updateFrom(e,t,r,n){this.setAttributes([e,t,r,n])}}function Gi(s,e){return s.uuid<e.uuid?1:s.uuid>e.uuid?-1:0}function Li(s){return`${s.source.uuid}:${s.colorSpace}`}function ja(s){const e=new Set,t=[];for(let r=0,n=s.length;r<n;r++){const a=s[r],i=Li(a);e.has(i)||(e.add(i),t.push(a))}return t}function qa(s){const e=s.map(r=>r.iesMap||null).filter(r=>r),t=new Set(e);return Array.from(t).sort(Gi)}function Ga(s){const e=new Set;for(let r=0,n=s.length;r<n;r++){const a=s[r];for(const i in a){const l=a[i];l&&l.isTexture&&e.add(l)}}const t=Array.from(e);return ja(t).sort(Gi)}function $a(s){const e=[];return s.traverse(t=>{t.visible&&(t.isRectAreaLight||t.isSpotLight||t.isPointLight||t.isDirectionalLight)&&e.push(t)}),e.sort(Gi)}const $i=47,Br=$i*4;class Ya{constructor(){this._features={}}isUsed(e){return e in this._features}setUsed(e,t=!0){t===!1?delete this._features[e]:this._features[e]=!0}reset(){this._features={}}}class Xa extends he{constructor(){super(new Float32Array(4),1,1),this.format=Q,this.type=K,this.wrapS=Be,this.wrapT=Be,this.minFilter=G,this.magFilter=G,this.generateMipmaps=!1,this.features=new Ya}updateFrom(e,t){function r(v,y,d=-1){if(y in v&&v[y]){const p=Li(v[y]);return u[p]}else return d}function n(v,y,d){return y in v?v[y]:d}function a(v,y,d,p){const g=v[y]&&v[y].isTexture?v[y]:null;if(g){g.matrixAutoUpdate&&g.updateMatrix();const x=g.matrix.elements;let w=0;d[p+w++]=x[0],d[p+w++]=x[3],d[p+w++]=x[6],w++,d[p+w++]=x[1],d[p+w++]=x[4],d[p+w++]=x[7],w++}return 8}let i=0;const l=e.length*$i,c=Math.ceil(Math.sqrt(l))||1,{image:h,features:f}=this,u={};for(let v=0,y=t.length;v<y;v++)u[Li(t[v])]=v;h.width!==c&&(this.dispose(),h.data=new Float32Array(c*c*4),h.width=c,h.height=c);const o=h.data;f.reset();for(let v=0,y=e.length;v<y;v++){const d=e[v];if(d.isFogVolumeMaterial){f.setUsed("FOG");for(let x=0;x<Br;x++)o[i+x]=0;o[i+0*4+0]=d.color.r,o[i+0*4+1]=d.color.g,o[i+0*4+2]=d.color.b,o[i+2*4+3]=n(d,"emissiveIntensity",0),o[i+3*4+0]=d.emissive.r,o[i+3*4+1]=d.emissive.g,o[i+3*4+2]=d.emissive.b,o[i+13*4+1]=d.density,o[i+13*4+3]=0,o[i+14*4+2]=4,i+=Br;continue}o[i++]=d.color.r,o[i++]=d.color.g,o[i++]=d.color.b,o[i++]=r(d,"map"),o[i++]=n(d,"metalness",0),o[i++]=r(d,"metalnessMap"),o[i++]=n(d,"roughness",0),o[i++]=r(d,"roughnessMap"),o[i++]=n(d,"ior",1.5),o[i++]=n(d,"transmission",0),o[i++]=r(d,"transmissionMap"),o[i++]=n(d,"emissiveIntensity",0),"emissive"in d?(o[i++]=d.emissive.r,o[i++]=d.emissive.g,o[i++]=d.emissive.b):(o[i++]=0,o[i++]=0,o[i++]=0),o[i++]=r(d,"emissiveMap"),o[i++]=r(d,"normalMap"),"normalScale"in d?(o[i++]=d.normalScale.x,o[i++]=d.normalScale.y):(o[i++]=1,o[i++]=1),o[i++]=n(d,"clearcoat",0),o[i++]=r(d,"clearcoatMap"),o[i++]=n(d,"clearcoatRoughness",0),o[i++]=r(d,"clearcoatRoughnessMap"),o[i++]=r(d,"clearcoatNormalMap"),"clearcoatNormalScale"in d?(o[i++]=d.clearcoatNormalScale.x,o[i++]=d.clearcoatNormalScale.y):(o[i++]=1,o[i++]=1),i++,o[i++]=n(d,"sheen",0),"sheenColor"in d?(o[i++]=d.sheenColor.r,o[i++]=d.sheenColor.g,o[i++]=d.sheenColor.b):(o[i++]=0,o[i++]=0,o[i++]=0),o[i++]=r(d,"sheenColorMap"),o[i++]=n(d,"sheenRoughness",0),o[i++]=r(d,"sheenRoughnessMap"),o[i++]=r(d,"iridescenceMap"),o[i++]=r(d,"iridescenceThicknessMap"),o[i++]=n(d,"iridescence",0),o[i++]=n(d,"iridescenceIOR",1.3);const p=n(d,"iridescenceThicknessRange",[100,400]);o[i++]=p[0],o[i++]=p[1],"specularColor"in d?(o[i++]=d.specularColor.r,o[i++]=d.specularColor.g,o[i++]=d.specularColor.b):(o[i++]=1,o[i++]=1,o[i++]=1),o[i++]=r(d,"specularColorMap"),o[i++]=n(d,"specularIntensity",1),o[i++]=r(d,"specularIntensityMap");const g=n(d,"thickness",0)===0&&n(d,"attenuationDistance",1/0)===1/0;if(o[i++]=Number(g),i++,"attenuationColor"in d?(o[i++]=d.attenuationColor.r,o[i++]=d.attenuationColor.g,o[i++]=d.attenuationColor.b):(o[i++]=1,o[i++]=1,o[i++]=1),o[i++]=n(d,"attenuationDistance",1/0),o[i++]=r(d,"alphaMap"),o[i++]=d.opacity,o[i++]=d.alphaTest,!g&&d.transmission>0)o[i++]=0;else switch(d.side){case Ai:o[i++]=1;break;case Gr:o[i++]=-1;break;case Hi:o[i++]=0;break}o[i++]=Number(n(d,"matte",!1)),o[i++]=Number(n(d,"castShadow",!0)),o[i++]=Number(d.vertexColors)|Number(d.flatShading)<<1,o[i++]=Number(d.transparent),i+=a(d,"map",o,i),i+=a(d,"metalnessMap",o,i),i+=a(d,"roughnessMap",o,i),i+=a(d,"transmissionMap",o,i),i+=a(d,"emissiveMap",o,i),i+=a(d,"normalMap",o,i),i+=a(d,"clearcoatMap",o,i),i+=a(d,"clearcoatNormalMap",o,i),i+=a(d,"clearcoatRoughnessMap",o,i),i+=a(d,"sheenColorMap",o,i),i+=a(d,"sheenRoughnessMap",o,i),i+=a(d,"iridescenceMap",o,i),i+=a(d,"iridescenceThicknessMap",o,i),i+=a(d,"specularColorMap",o,i),i+=a(d,"specularIntensityMap",o,i),i+=a(d,"alphaMap",o,i)}const m=qi(o.buffer);return this.hash!==m?(this.hash=m,this.needsUpdate=!0,!0):!1}}const kr=new we;function Qa(s){return s?`${s.uuid}:${s.version}`:null}function Ka(s,e){for(const t in e)t in s&&(s[t]=e[t])}class Nr extends Bs{constructor(e,t,r){const n={format:Q,type:Mi,minFilter:xe,magFilter:xe,wrapS:De,wrapT:De,generateMipmaps:!1,...r};super(e,t,1,n),Ka(this.texture,n),this.texture.setTextures=(...i)=>{this.setTextures(...i)},this.hashes=[null];const a=new $e(new Za);this.fsQuad=a}setTextures(e,t,r=this.width,n=this.height){const a=e.getRenderTarget(),i=e.toneMapping,l=e.getClearAlpha();e.getClearColor(kr);const c=t.length||1;(r!==this.width||n!==this.height||this.depth!==c)&&(this.setSize(r,n,c),this.hashes=new Array(c).fill(null)),e.setClearColor(0,0),e.toneMapping=ks;const h=this.fsQuad,f=this.hashes;let u=!1;for(let o=0,m=c;o<m;o++){const v=t[o],y=Qa(v);v&&(f[o]!==y||v.isWebGLRenderTarget)&&(v.matrixAutoUpdate=!1,v.matrix.identity(),h.material.map=v,e.setRenderTarget(this,o),h.render(e),v.updateMatrix(),v.matrixAutoUpdate=!0,f[o]=y,u=!0)}return h.material.map=null,e.setClearColor(kr,l),e.setRenderTarget(a),e.toneMapping=i,u}dispose(){super.dispose(),this.fsQuad.dispose()}}class Za extends Jt{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}constructor(){super({uniforms:{map:{value:null}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`
				uniform sampler2D map;
				varying vec2 vUv;
				void main() {

					gl_FragColor = texture2D( map, vUv );

				}
			`})}}function Ja(s,e=Math.random()){for(let t=s.length-1;t>0;t--){const r=Math.floor(e()*(t+1)),n=s[t];s[t]=s[r],s[r]=n}return s}class eo{constructor(e,t,r=Math.random){const n=e**t,a=new Uint16Array(n);let i=n;for(let l=0;l<n;l++)a[l]=l;this.samples=new Float32Array(t),this.strataCount=e,this.reset=function(){for(let l=0;l<n;l++)a[l]=l;i=0},this.reshuffle=function(){i=0},this.next=function(){const{samples:l}=this;i>=a.length&&(Ja(a,r),this.reshuffle());let c=a[i++];for(let h=0;h<t;h++)l[h]=(c%e+r())/e,c=Math.floor(c/e);return l}}}class to{constructor(e,t,r=Math.random){let n=0;for(const c of t)n+=c;const a=new Float32Array(n),i=[];let l=0;for(const c of t){const h=new eo(e,c,r);h.samples=new Float32Array(a.buffer,l,h.samples.length),l+=h.samples.length*4,i.push(h)}this.samples=a,this.strataCount=e,this.next=function(){for(const c of i)c.next();return a},this.reshuffle=function(){for(const c of i)c.reshuffle()},this.reset=function(){for(const c of i)c.reset()}}}class io{constructor(e=0){this.m=2147483648,this.a=1103515245,this.c=12345,this.seed=e}nextInt(){return this.seed=(this.a*this.seed+this.c)%this.m,this.seed}nextFloat(){return this.nextInt()/(this.m-1)}}class ro extends he{constructor(e=1,t=1,r=8){super(new Float32Array(1),1,1,Q,K),this.minFilter=G,this.magFilter=G,this.strata=r,this.sampler=null,this.generator=new io,this.stableNoise=!1,this.random=()=>this.stableNoise?this.generator.nextFloat():Math.random(),this.init(e,t,r)}init(e=this.image.height,t=this.image.width,r=this.strata){const{image:n}=this;if(n.width===t&&n.height===e&&this.sampler!==null)return;const a=new Array(e*t).fill(4),i=new to(r,a,this.random);n.width=t,n.height=e,n.data=i.samples,this.sampler=i,this.dispose(),this.next()}next(){this.sampler.next(),this.needsUpdate=!0}reset(){this.sampler.reset(),this.generator.seed=0}}function so(s,e=Math.random){for(let t=s.length-1;t>0;t--){const r=~~((e()-1e-6)*t),n=s[t];s[t]=s[r],s[r]=n}}function no(s,e){s.fill(0);for(let t=0;t<e;t++)s[t]=1}class zr{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){const{score:e,binaryPattern:t}=this;let r=1/0,n=-1;for(let a=0,i=t.length;a<i;a++){if(t[a]!==0)continue;const l=e[a];l<r&&(r=l,n=a)}return n}findCluster(){const{score:e,binaryPattern:t}=this;let r=-1/0,n=-1;for(let a=0,i=t.length;a<i;a++){if(t[a]!==1)continue;const l=e[a];l>r&&(r=l,n=a)}return n}setSigma(e){if(e===this.sigma)return;const t=~~(Math.sqrt(10*2*e**2)+1),r=2*t+1,n=new Float32Array(r*r),a=e*e;for(let i=-t;i<=t;i++)for(let l=-t;l<=t;l++){const c=(t+l)*r+i+t,h=i*i+l*l;n[c]=Math.E**(-h/(2*a))}this.lookupTable=n,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){const{binaryPattern:e,score:t,size:r}=this;t.fill(0);for(let n=0,a=e.length;n<a;n++)if(e[n]===0){const i=~~(n/r),l=n-i*r;this.updateScore(l,i,1),e[n]=1}else e[n]=0}updateScore(e,t,r){const{size:n,score:a,lookupTable:i}=this,l=this.radius,c=2*l+1;for(let h=-l;h<=l;h++)for(let f=-l;f<=l;f++){const u=(l+f)*c+h+l,o=i[u];let m=e+h;m=m<0?n+m:m%n;let v=t+f;v=v<0?n+v:v%n;const y=v*n+m;a[y]+=r*o}}addPointIndex(e){this.binaryPattern[e]=1;const t=this.size,r=~~(e/t),n=e-r*t;this.updateScore(n,r,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;const t=this.size,r=~~(e/t),n=e-r*t;this.updateScore(n,r,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}}class ao{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new zr(1),this.savedSamples=new zr(1)}generate(){const{samples:e,savedSamples:t,sigma:r,majorityPointsRatio:n,size:a}=this;e.resize(a),e.setSigma(r);const i=Math.floor(a*a*n),l=e.binaryPattern;no(l,i),so(l,this.random);for(let u=0,o=l.length;u<o;u++)l[u]===1&&e.addPointIndex(u);for(;;){const u=e.findCluster();e.removePointIndex(u);const o=e.findVoid();if(u===o){e.addPointIndex(u);break}e.addPointIndex(o)}const c=new Uint32Array(a*a);t.copy(e);let h;for(h=e.count-1;h>=0;){const u=e.findCluster();e.removePointIndex(u),c[u]=h,h--}const f=a*a;for(h=t.count;h<f/2;){const u=t.findVoid();t.addPointIndex(u),c[u]=h,h++}for(t.invert();h<f;){const u=t.findCluster();t.removePointIndex(u),c[u]=h,h++}return{data:c,maxValue:f}}}function oo(s){return s>=3?4:s}function lo(s){switch(s){case 1:return Kt;case 2:return Yr;default:return Q}}class co extends he{constructor(e=64,t=1){super(new Float32Array(4),1,1,Q,K),this.minFilter=G,this.magFilter=G,this.size=e,this.channels=t,this.update()}update(){const e=this.channels,t=this.size,r=new ao;r.channels=e,r.size=t;const n=oo(e),a=lo(n);(this.image.width!==t||a!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*n),this.format=a,this.dispose());const i=this.image.data;for(let l=0,c=e;l<c;l++){const h=r.generate(),f=h.data,u=h.maxValue;for(let o=0,m=f.length;o<m;o++){const v=f[o]/u;i[o*n+l]=v}}this.needsUpdate=!0}}const uo=`

	struct PhysicalCamera {

		float focusDistance;
		float anamorphicRatio;
		float bokehSize;
		int apertureBlades;
		float apertureRotation;

	};

`,fo=`

	struct EquirectHdrInfo {

		sampler2D marginalWeights;
		sampler2D conditionalWeights;
		sampler2D map;

		float totalSum;

	};

`,ho=`

	#define RECT_AREA_LIGHT_TYPE 0
	#define CIRC_AREA_LIGHT_TYPE 1
	#define SPOT_LIGHT_TYPE 2
	#define DIR_LIGHT_TYPE 3
	#define POINT_LIGHT_TYPE 4

	struct LightsInfo {

		sampler2D tex;
		uint count;

	};

	struct Light {

		vec3 position;
		int type;

		vec3 color;
		float intensity;

		vec3 u;
		vec3 v;
		float area;

		// spot light fields
		float radius;
		float near;
		float decay;
		float distance;
		float coneCos;
		float penumbraCos;
		int iesProfile;

	};

	Light readLightInfo( sampler2D tex, uint index ) {

		uint i = index * 6u;

		vec4 s0 = texelFetch1D( tex, i + 0u );
		vec4 s1 = texelFetch1D( tex, i + 1u );
		vec4 s2 = texelFetch1D( tex, i + 2u );
		vec4 s3 = texelFetch1D( tex, i + 3u );

		Light l;
		l.position = s0.rgb;
		l.type = int( round( s0.a ) );

		l.color = s1.rgb;
		l.intensity = s1.a;

		l.u = s2.rgb;
		l.v = s3.rgb;
		l.area = s3.a;

		if ( l.type == SPOT_LIGHT_TYPE || l.type == POINT_LIGHT_TYPE ) {

			vec4 s4 = texelFetch1D( tex, i + 4u );
			vec4 s5 = texelFetch1D( tex, i + 5u );
			l.radius = s4.r;
			l.decay = s4.g;
			l.distance = s4.b;
			l.coneCos = s4.a;

			l.penumbraCos = s5.r;
			l.iesProfile = int( round( s5.g ) );

		} else {

			l.radius = 0.0;
			l.decay = 0.0;
			l.distance = 0.0;

			l.coneCos = 0.0;
			l.penumbraCos = 0.0;
			l.iesProfile = - 1;

		}

		return l;

	}

`,mo=`

	struct Material {

		vec3 color;
		int map;

		float metalness;
		int metalnessMap;

		float roughness;
		int roughnessMap;

		float ior;
		float transmission;
		int transmissionMap;

		float emissiveIntensity;
		vec3 emissive;
		int emissiveMap;

		int normalMap;
		vec2 normalScale;

		float clearcoat;
		int clearcoatMap;
		int clearcoatNormalMap;
		vec2 clearcoatNormalScale;
		float clearcoatRoughness;
		int clearcoatRoughnessMap;

		int iridescenceMap;
		int iridescenceThicknessMap;
		float iridescence;
		float iridescenceIor;
		float iridescenceThicknessMinimum;
		float iridescenceThicknessMaximum;

		vec3 specularColor;
		int specularColorMap;

		float specularIntensity;
		int specularIntensityMap;
		bool thinFilm;

		vec3 attenuationColor;
		float attenuationDistance;

		int alphaMap;

		bool castShadow;
		float opacity;
		float alphaTest;

		float side;
		bool matte;

		float sheen;
		vec3 sheenColor;
		int sheenColorMap;
		float sheenRoughness;
		int sheenRoughnessMap;

		bool vertexColors;
		bool flatShading;
		bool transparent;
		bool fogVolume;

		mat3 mapTransform;
		mat3 metalnessMapTransform;
		mat3 roughnessMapTransform;
		mat3 transmissionMapTransform;
		mat3 emissiveMapTransform;
		mat3 normalMapTransform;
		mat3 clearcoatMapTransform;
		mat3 clearcoatNormalMapTransform;
		mat3 clearcoatRoughnessMapTransform;
		mat3 sheenColorMapTransform;
		mat3 sheenRoughnessMapTransform;
		mat3 iridescenceMapTransform;
		mat3 iridescenceThicknessMapTransform;
		mat3 specularColorMapTransform;
		mat3 specularIntensityMapTransform;
		mat3 alphaMapTransform;

	};

	mat3 readTextureTransform( sampler2D tex, uint index ) {

		mat3 textureTransform;

		vec4 row1 = texelFetch1D( tex, index );
		vec4 row2 = texelFetch1D( tex, index + 1u );

		textureTransform[0] = vec3(row1.r, row2.r, 0.0);
		textureTransform[1] = vec3(row1.g, row2.g, 0.0);
		textureTransform[2] = vec3(row1.b, row2.b, 1.0);

		return textureTransform;

	}

	Material readMaterialInfo( sampler2D tex, uint index ) {

		uint i = index * uint( MATERIAL_PIXELS );

		vec4 s0 = texelFetch1D( tex, i + 0u );
		vec4 s1 = texelFetch1D( tex, i + 1u );
		vec4 s2 = texelFetch1D( tex, i + 2u );
		vec4 s3 = texelFetch1D( tex, i + 3u );
		vec4 s4 = texelFetch1D( tex, i + 4u );
		vec4 s5 = texelFetch1D( tex, i + 5u );
		vec4 s6 = texelFetch1D( tex, i + 6u );
		vec4 s7 = texelFetch1D( tex, i + 7u );
		vec4 s8 = texelFetch1D( tex, i + 8u );
		vec4 s9 = texelFetch1D( tex, i + 9u );
		vec4 s10 = texelFetch1D( tex, i + 10u );
		vec4 s11 = texelFetch1D( tex, i + 11u );
		vec4 s12 = texelFetch1D( tex, i + 12u );
		vec4 s13 = texelFetch1D( tex, i + 13u );
		vec4 s14 = texelFetch1D( tex, i + 14u );

		Material m;
		m.color = s0.rgb;
		m.map = int( round( s0.a ) );

		m.metalness = s1.r;
		m.metalnessMap = int( round( s1.g ) );
		m.roughness = s1.b;
		m.roughnessMap = int( round( s1.a ) );

		m.ior = s2.r;
		m.transmission = s2.g;
		m.transmissionMap = int( round( s2.b ) );
		m.emissiveIntensity = s2.a;

		m.emissive = s3.rgb;
		m.emissiveMap = int( round( s3.a ) );

		m.normalMap = int( round( s4.r ) );
		m.normalScale = s4.gb;

		m.clearcoat = s4.a;
		m.clearcoatMap = int( round( s5.r ) );
		m.clearcoatRoughness = s5.g;
		m.clearcoatRoughnessMap = int( round( s5.b ) );
		m.clearcoatNormalMap = int( round( s5.a ) );
		m.clearcoatNormalScale = s6.rg;

		m.sheen = s6.a;
		m.sheenColor = s7.rgb;
		m.sheenColorMap = int( round( s7.a ) );
		m.sheenRoughness = s8.r;
		m.sheenRoughnessMap = int( round( s8.g ) );

		m.iridescenceMap = int( round( s8.b ) );
		m.iridescenceThicknessMap = int( round( s8.a ) );
		m.iridescence = s9.r;
		m.iridescenceIor = s9.g;
		m.iridescenceThicknessMinimum = s9.b;
		m.iridescenceThicknessMaximum = s9.a;

		m.specularColor = s10.rgb;
		m.specularColorMap = int( round( s10.a ) );

		m.specularIntensity = s11.r;
		m.specularIntensityMap = int( round( s11.g ) );
		m.thinFilm = bool( s11.b );

		m.attenuationColor = s12.rgb;
		m.attenuationDistance = s12.a;

		m.alphaMap = int( round( s13.r ) );

		m.opacity = s13.g;
		m.alphaTest = s13.b;
		m.side = s13.a;

		m.matte = bool( s14.r );
		m.castShadow = bool( s14.g );
		m.vertexColors = bool( int( s14.b ) & 1 );
		m.flatShading = bool( int( s14.b ) & 2 );
		m.fogVolume = bool( int( s14.b ) & 4 );
		m.transparent = bool( s14.a );

		uint firstTextureTransformIdx = i + 15u;

		// mat3( 1.0 ) is an identity matrix
		m.mapTransform = m.map == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx );
		m.metalnessMapTransform = m.metalnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 2u );
		m.roughnessMapTransform = m.roughnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 4u );
		m.transmissionMapTransform = m.transmissionMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 6u );
		m.emissiveMapTransform = m.emissiveMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 8u );
		m.normalMapTransform = m.normalMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 10u );
		m.clearcoatMapTransform = m.clearcoatMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 12u );
		m.clearcoatNormalMapTransform = m.clearcoatNormalMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 14u );
		m.clearcoatRoughnessMapTransform = m.clearcoatRoughnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 16u );
		m.sheenColorMapTransform = m.sheenColorMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 18u );
		m.sheenRoughnessMapTransform = m.sheenRoughnessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 20u );
		m.iridescenceMapTransform = m.iridescenceMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 22u );
		m.iridescenceThicknessMapTransform = m.iridescenceThicknessMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 24u );
		m.specularColorMapTransform = m.specularColorMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 26u );
		m.specularIntensityMapTransform = m.specularIntensityMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 28u );
		m.alphaMapTransform = m.alphaMap == - 1 ? mat3( 1.0 ) : readTextureTransform( tex, firstTextureTransformIdx + 30u );

		return m;

	}

`,po=`

	struct SurfaceRecord {

		// surface type
		bool volumeParticle;

		// geometry
		vec3 faceNormal;
		bool frontFace;
		vec3 normal;
		mat3 normalBasis;
		mat3 normalInvBasis;

		// cached properties
		float eta;
		float f0;

		// material
		float roughness;
		float filteredRoughness;
		float metalness;
		vec3 color;
		vec3 emission;

		// transmission
		float ior;
		float transmission;
		bool thinFilm;
		vec3 attenuationColor;
		float attenuationDistance;

		// clearcoat
		vec3 clearcoatNormal;
		mat3 clearcoatBasis;
		mat3 clearcoatInvBasis;
		float clearcoat;
		float clearcoatRoughness;
		float filteredClearcoatRoughness;

		// sheen
		float sheen;
		vec3 sheenColor;
		float sheenRoughness;

		// iridescence
		float iridescence;
		float iridescenceIor;
		float iridescenceThickness;

		// specular
		vec3 specularColor;
		float specularIntensity;
	};

	struct ScatterRecord {
		float specularPdf;
		float pdf;
		vec3 direction;
		vec3 color;
	};

`,go=`

	// samples the the given environment map in the given direction
	vec3 sampleEquirectColor( sampler2D envMap, vec3 direction ) {

		return texture2D( envMap, equirectDirectionToUv( direction ) ).rgb;

	}

	// gets the pdf of the given direction to sample
	float equirectDirectionPdf( vec3 direction ) {

		vec2 uv = equirectDirectionToUv( direction );
		float theta = uv.y * PI;
		float sinTheta = sin( theta );
		if ( sinTheta == 0.0 ) {

			return 0.0;

		}

		return 1.0 / ( 2.0 * PI * PI * sinTheta );

	}

	// samples the color given env map with CDF and returns the pdf of the direction
	float sampleEquirect( vec3 direction, inout vec3 color ) {

		float totalSum = envMapInfo.totalSum;
		if ( totalSum == 0.0 ) {

			color = vec3( 0.0 );
			return 1.0;

		}

		vec2 uv = equirectDirectionToUv( direction );
		color = texture2D( envMapInfo.map, uv ).rgb;

		float lum = luminance( color );
		ivec2 resolution = textureSize( envMapInfo.map, 0 );
		float pdf = lum / totalSum;

		return float( resolution.x * resolution.y ) * pdf * equirectDirectionPdf( direction );

	}

	// samples a direction of the envmap with color and retrieves pdf
	float sampleEquirectProbability( vec2 r, inout vec3 color, inout vec3 direction ) {

		// sample env map cdf
		float v = texture2D( envMapInfo.marginalWeights, vec2( r.x, 0.0 ) ).x;
		float u = texture2D( envMapInfo.conditionalWeights, vec2( r.y, v ) ).x;
		vec2 uv = vec2( u, v );

		vec3 derivedDirection = equirectUvToDirection( uv );
		direction = derivedDirection;
		color = texture2D( envMapInfo.map, uv ).rgb;

		float totalSum = envMapInfo.totalSum;
		float lum = luminance( color );
		ivec2 resolution = textureSize( envMapInfo.map, 0 );
		float pdf = lum / totalSum;

		return float( resolution.x * resolution.y ) * pdf * equirectDirectionPdf( direction );

	}
`,vo=`

	float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {

		return smoothstep( coneCosine, penumbraCosine, angleCosine );

	}

	float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {

		// based upon Frostbite 3 Moving to Physically-based Rendering
		// page 32, equation 26: E[window1]
		// https://seblagarde.files.wordpress.com/2015/07/course_notes_moving_frostbite_to_pbr_v32.pdf
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), EPSILON );

		if ( cutoffDistance > 0.0 ) {

			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );

		}

		return distanceFalloff;

	}

	float getPhotometricAttenuation( sampler2DArray iesProfiles, int iesProfile, vec3 posToLight, vec3 lightDir, vec3 u, vec3 v ) {

		float cosTheta = dot( posToLight, lightDir );
		float angle = acos( cosTheta ) / PI;

		return texture2D( iesProfiles, vec3( angle, 0.0, iesProfile ) ).r;

	}

	struct LightRecord {

		float dist;
		vec3 direction;
		float pdf;
		vec3 emission;
		int type;

	};

	bool intersectLightAtIndex( sampler2D lights, vec3 rayOrigin, vec3 rayDirection, uint l, inout LightRecord lightRec ) {

		bool didHit = false;
		Light light = readLightInfo( lights, l );

		vec3 u = light.u;
		vec3 v = light.v;

		// check for backface
		vec3 normal = normalize( cross( u, v ) );
		if ( dot( normal, rayDirection ) > 0.0 ) {

			u *= 1.0 / dot( u, u );
			v *= 1.0 / dot( v, v );

			float dist;

			// MIS / light intersection is not supported for punctual lights.
			if(
				( light.type == RECT_AREA_LIGHT_TYPE && intersectsRectangle( light.position, normal, u, v, rayOrigin, rayDirection, dist ) ) ||
				( light.type == CIRC_AREA_LIGHT_TYPE && intersectsCircle( light.position, normal, u, v, rayOrigin, rayDirection, dist ) )
			) {

				float cosTheta = dot( rayDirection, normal );
				didHit = true;
				lightRec.dist = dist;
				lightRec.pdf = ( dist * dist ) / ( light.area * cosTheta );
				lightRec.emission = light.color * light.intensity;
				lightRec.direction = rayDirection;
				lightRec.type = light.type;

			}

		}

		return didHit;

	}

	LightRecord randomAreaLightSample( Light light, vec3 rayOrigin, vec2 ruv ) {

		vec3 randomPos;
		if( light.type == RECT_AREA_LIGHT_TYPE ) {

			// rectangular area light
			randomPos = light.position + light.u * ( ruv.x - 0.5 ) + light.v * ( ruv.y - 0.5 );

		} else if( light.type == CIRC_AREA_LIGHT_TYPE ) {

			// circular area light
			float r = 0.5 * sqrt( ruv.x );
			float theta = ruv.y * 2.0 * PI;
			float x = r * cos( theta );
			float y = r * sin( theta );

			randomPos = light.position + light.u * x + light.v * y;

		}

		vec3 toLight = randomPos - rayOrigin;
		float lightDistSq = dot( toLight, toLight );
		float dist = sqrt( lightDistSq );
		vec3 direction = toLight / dist;
		vec3 lightNormal = normalize( cross( light.u, light.v ) );

		LightRecord lightRec;
		lightRec.type = light.type;
		lightRec.emission = light.color * light.intensity;
		lightRec.dist = dist;
		lightRec.direction = direction;

		// TODO: the denominator is potentially zero
		lightRec.pdf = lightDistSq / ( light.area * dot( direction, lightNormal ) );

		return lightRec;

	}

	LightRecord randomSpotLightSample( Light light, sampler2DArray iesProfiles, vec3 rayOrigin, vec2 ruv ) {

		float radius = light.radius * sqrt( ruv.x );
		float theta = ruv.y * 2.0 * PI;
		float x = radius * cos( theta );
		float y = radius * sin( theta );

		vec3 u = light.u;
		vec3 v = light.v;
		vec3 normal = normalize( cross( u, v ) );

		float angle = acos( light.coneCos );
		float angleTan = tan( angle );
		float startDistance = light.radius / max( angleTan, EPSILON );

		vec3 randomPos = light.position - normal * startDistance + u * x + v * y;
		vec3 toLight = randomPos - rayOrigin;
		float lightDistSq = dot( toLight, toLight );
		float dist = sqrt( lightDistSq );

		vec3 direction = toLight / max( dist, EPSILON );
		float cosTheta = dot( direction, normal );

		float spotAttenuation = light.iesProfile != - 1 ?
			getPhotometricAttenuation( iesProfiles, light.iesProfile, direction, normal, u, v ) :
			getSpotAttenuation( light.coneCos, light.penumbraCos, cosTheta );

		float distanceAttenuation = getDistanceAttenuation( dist, light.distance, light.decay );
		LightRecord lightRec;
		lightRec.type = light.type;
		lightRec.dist = dist;
		lightRec.direction = direction;
		lightRec.emission = light.color * light.intensity * distanceAttenuation * spotAttenuation;
		lightRec.pdf = 1.0;

		return lightRec;

	}

	LightRecord randomLightSample( sampler2D lights, sampler2DArray iesProfiles, uint lightCount, vec3 rayOrigin, vec3 ruv ) {

		LightRecord result;

		// pick a random light
		uint l = uint( ruv.x * float( lightCount ) );
		Light light = readLightInfo( lights, l );

		if ( light.type == SPOT_LIGHT_TYPE ) {

			result = randomSpotLightSample( light, iesProfiles, rayOrigin, ruv.yz );

		} else if ( light.type == POINT_LIGHT_TYPE ) {

			vec3 lightRay = light.u - rayOrigin;
			float lightDist = length( lightRay );
			float cutoffDistance = light.distance;
			float distanceFalloff = 1.0 / max( pow( lightDist, light.decay ), 0.01 );
			if ( cutoffDistance > 0.0 ) {

				distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDist / cutoffDistance ) ) );

			}

			LightRecord rec;
			rec.direction = normalize( lightRay );
			rec.dist = length( lightRay );
			rec.pdf = 1.0;
			rec.emission = light.color * light.intensity * distanceFalloff;
			rec.type = light.type;
			result = rec;

		} else if ( light.type == DIR_LIGHT_TYPE ) {

			LightRecord rec;
			rec.dist = 1e10;
			rec.direction = light.u;
			rec.pdf = 1.0;
			rec.emission = light.color * light.intensity;
			rec.type = light.type;

			result = rec;

		} else {

			// sample the light
			result = randomAreaLightSample( light, rayOrigin, ruv.yz );

		}

		return result;

	}

`,xo=`

	vec3 sampleHemisphere( vec3 n, vec2 uv ) {

		// https://www.rorydriscoll.com/2009/01/07/better-sampling/
		// https://graphics.pixar.com/library/OrthonormalB/paper.pdf
		float sign = n.z == 0.0 ? 1.0 : sign( n.z );
		float a = - 1.0 / ( sign + n.z );
		float b = n.x * n.y * a;
		vec3 b1 = vec3( 1.0 + sign * n.x * n.x * a, sign * b, - sign * n.x );
		vec3 b2 = vec3( b, sign + n.y * n.y * a, - n.y );

		float r = sqrt( uv.x );
		float theta = 2.0 * PI * uv.y;
		float x = r * cos( theta );
		float y = r * sin( theta );
		return x * b1 + y * b2 + sqrt( 1.0 - uv.x ) * n;

	}

	vec2 sampleTriangle( vec2 a, vec2 b, vec2 c, vec2 r ) {

		// get the edges of the triangle and the diagonal across the
		// center of the parallelogram
		vec2 e1 = a - b;
		vec2 e2 = c - b;
		vec2 diag = normalize( e1 + e2 );

		// pick the point in the parallelogram
		if ( r.x + r.y > 1.0 ) {

			r = vec2( 1.0 ) - r;

		}

		return e1 * r.x + e2 * r.y;

	}

	vec2 sampleCircle( vec2 uv ) {

		float angle = 2.0 * PI * uv.x;
		float radius = sqrt( uv.y );
		return vec2( cos( angle ), sin( angle ) ) * radius;

	}

	vec3 sampleSphere( vec2 uv ) {

		float u = ( uv.x - 0.5 ) * 2.0;
		float t = uv.y * PI * 2.0;
		float f = sqrt( 1.0 - u * u );

		return vec3( f * cos( t ), f * sin( t ), u );

	}

	vec2 sampleRegularPolygon( int sides, vec3 uvw ) {

		sides = max( sides, 3 );

		vec3 r = uvw;
		float anglePerSegment = 2.0 * PI / float( sides );
		float segment = floor( float( sides ) * r.x );

		float angle1 = anglePerSegment * segment;
		float angle2 = angle1 + anglePerSegment;
		vec2 a = vec2( sin( angle1 ), cos( angle1 ) );
		vec2 b = vec2( 0.0, 0.0 );
		vec2 c = vec2( sin( angle2 ), cos( angle2 ) );

		return sampleTriangle( a, b, c, r.yz );

	}

	// samples an aperture shape with the given number of sides. 0 means circle
	vec2 sampleAperture( int blades, vec3 uvw ) {

		return blades == 0 ?
			sampleCircle( uvw.xy ) :
			sampleRegularPolygon( blades, uvw );

	}


`,yo=`

	bool totalInternalReflection( float cosTheta, float eta ) {

		float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		return eta * sinTheta > 1.0;

	}

	// https://google.github.io/filament/Filament.md.html#materialsystem/diffusebrdf
	float schlickFresnel( float cosine, float f0 ) {

		return f0 + ( 1.0 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

	vec3 schlickFresnel( float cosine, vec3 f0 ) {

		return f0 + ( 1.0 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

	vec3 schlickFresnel( float cosine, vec3 f0, vec3 f90 ) {

		return f0 + ( f90 - f0 ) * pow( 1.0 - cosine, 5.0 );

	}

	float dielectricFresnel( float cosThetaI, float eta ) {

		// https://schuttejoe.github.io/post/disneybsdf/
		float ni = eta;
		float nt = 1.0;

		// Check for total internal reflection
		float sinThetaISq = 1.0f - cosThetaI * cosThetaI;
		float sinThetaTSq = eta * eta * sinThetaISq;
		if( sinThetaTSq >= 1.0 ) {

			return 1.0;

		}

		float sinThetaT = sqrt( sinThetaTSq );

		float cosThetaT = sqrt( max( 0.0, 1.0f - sinThetaT * sinThetaT ) );
		float rParallel = ( ( nt * cosThetaI ) - ( ni * cosThetaT ) ) / ( ( nt * cosThetaI ) + ( ni * cosThetaT ) );
		float rPerpendicular = ( ( ni * cosThetaI ) - ( nt * cosThetaT ) ) / ( ( ni * cosThetaI ) + ( nt * cosThetaT ) );
		return ( rParallel * rParallel + rPerpendicular * rPerpendicular ) / 2.0;

	}

	// https://raytracing.github.io/books/RayTracingInOneWeekend.html#dielectrics/schlickapproximation
	float iorRatioToF0( float eta ) {

		return pow( ( 1.0 - eta ) / ( 1.0 + eta ), 2.0 );

	}

	vec3 evaluateFresnel( float cosTheta, float eta, vec3 f0, vec3 f90 ) {

		if ( totalInternalReflection( cosTheta, eta ) ) {

			return f90;

		}

		return schlickFresnel( cosTheta, f0, f90 );

	}

	// TODO: disney fresnel was removed and replaced with this fresnel function to better align with
	// the glTF but is causing blown out pixels. Should be revisited
	// float evaluateFresnelWeight( float cosTheta, float eta, float f0 ) {

	// 	if ( totalInternalReflection( cosTheta, eta ) ) {

	// 		return 1.0;

	// 	}

	// 	return schlickFresnel( cosTheta, f0 );

	// }

	// https://schuttejoe.github.io/post/disneybsdf/
	float disneyFresnel( vec3 wo, vec3 wi, vec3 wh, float f0, float eta, float metalness ) {

		float dotHV = dot( wo, wh );
		if ( totalInternalReflection( dotHV, eta ) ) {

			return 1.0;

		}

		float dotHL = dot( wi, wh );
		float dielectricFresnel = dielectricFresnel( abs( dotHV ), eta );
		float metallicFresnel = schlickFresnel( dotHL, f0 );

		return mix( dielectricFresnel, metallicFresnel, metalness );

	}

`,bo=`

	// Fast arccos approximation used to remove banding artifacts caused by numerical errors in acos.
	// This is a cubic Lagrange interpolating polynomial for x = [-1, -1/2, 0, 1/2, 1].
	// For more information see: https://github.com/gkjohnson/three-gpu-pathtracer/pull/171#issuecomment-1152275248
	float acosApprox( float x ) {

		x = clamp( x, -1.0, 1.0 );
		return ( - 0.69813170079773212 * x * x - 0.87266462599716477 ) * x + 1.5707963267948966;

	}

	// An acos with input values bound to the range [-1, 1].
	float acosSafe( float x ) {

		return acos( clamp( x, -1.0, 1.0 ) );

	}

	float saturateCos( float val ) {

		return clamp( val, 0.001, 1.0 );

	}

	float square( float t ) {

		return t * t;

	}

	vec2 square( vec2 t ) {

		return t * t;

	}

	vec3 square( vec3 t ) {

		return t * t;

	}

	vec4 square( vec4 t ) {

		return t * t;

	}

	vec2 rotateVector( vec2 v, float t ) {

		float ac = cos( t );
		float as = sin( t );
		return vec2(
			v.x * ac - v.y * as,
			v.x * as + v.y * ac
		);

	}

	// forms a basis with the normal vector as Z
	mat3 getBasisFromNormal( vec3 normal ) {

		vec3 other;
		if ( abs( normal.x ) > 0.5 ) {

			other = vec3( 0.0, 1.0, 0.0 );

		} else {

			other = vec3( 1.0, 0.0, 0.0 );

		}

		vec3 ortho = normalize( cross( normal, other ) );
		vec3 ortho2 = normalize( cross( normal, ortho ) );
		return mat3( ortho2, ortho, normal );

	}

`,wo=`

	// Finds the point where the ray intersects the plane defined by u and v and checks if this point
	// falls in the bounds of the rectangle on that same plane.
	// Plane intersection: https://lousodrome.net/blog/light/2020/07/03/intersection-of-a-ray-and-a-plane/
	bool intersectsRectangle( vec3 center, vec3 normal, vec3 u, vec3 v, vec3 rayOrigin, vec3 rayDirection, inout float dist ) {

		float t = dot( center - rayOrigin, normal ) / dot( rayDirection, normal );

		if ( t > EPSILON ) {

			vec3 p = rayOrigin + rayDirection * t;
			vec3 vi = p - center;

			// check if p falls inside the rectangle
			float a1 = dot( u, vi );
			if ( abs( a1 ) <= 0.5 ) {

				float a2 = dot( v, vi );
				if ( abs( a2 ) <= 0.5 ) {

					dist = t;
					return true;

				}

			}

		}

		return false;

	}

	// Finds the point where the ray intersects the plane defined by u and v and checks if this point
	// falls in the bounds of the circle on that same plane. See above URL for a description of the plane intersection algorithm.
	bool intersectsCircle( vec3 position, vec3 normal, vec3 u, vec3 v, vec3 rayOrigin, vec3 rayDirection, inout float dist ) {

		float t = dot( position - rayOrigin, normal ) / dot( rayDirection, normal );

		if ( t > EPSILON ) {

			vec3 hit = rayOrigin + rayDirection * t;
			vec3 vi = hit - position;

			float a1 = dot( u, vi );
			float a2 = dot( v, vi );

			if( length( vec2( a1, a2 ) ) <= 0.5 ) {

				dist = t;
				return true;

			}

		}

		return false;

	}

`,To=`

	// add texel fetch functions for texture arrays
	vec4 texelFetch1D( sampler2DArray tex, int layer, uint index ) {

		uint width = uint( textureSize( tex, 0 ).x );
		uvec2 uv;
		uv.x = index % width;
		uv.y = index / width;

		return texelFetch( tex, ivec3( uv, layer ), 0 );

	}

	vec4 textureSampleBarycoord( sampler2DArray tex, int layer, vec3 barycoord, uvec3 faceIndices ) {

		return
			barycoord.x * texelFetch1D( tex, layer, faceIndices.x ) +
			barycoord.y * texelFetch1D( tex, layer, faceIndices.y ) +
			barycoord.z * texelFetch1D( tex, layer, faceIndices.z );

	}

`,ps=`

	// TODO: possibly this should be renamed something related to material or path tracing logic

	#ifndef RAY_OFFSET
	#define RAY_OFFSET 1e-4
	#endif

	// adjust the hit point by the surface normal by a factor of some offset and the
	// maximum component-wise value of the current point to accommodate floating point
	// error as values increase.
	vec3 stepRayOrigin( vec3 rayOrigin, vec3 rayDirection, vec3 offset, float dist ) {

		vec3 point = rayOrigin + rayDirection * dist;
		vec3 absPoint = abs( point );
		float maxPoint = max( absPoint.x, max( absPoint.y, absPoint.z ) );
		return point + offset * ( maxPoint + 1.0 ) * RAY_OFFSET;

	}

	// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
	vec3 transmissionAttenuation( float dist, vec3 attColor, float attDist ) {

		vec3 ot = - log( attColor ) / attDist;
		return exp( - ot * dist );

	}

	vec3 getHalfVector( vec3 wi, vec3 wo, float eta ) {

		// get the half vector - assuming if the light incident vector is on the other side
		// of the that it's transmissive.
		vec3 h;
		if ( wi.z > 0.0 ) {

			h = normalize( wi + wo );

		} else {

			// Scale by the ior ratio to retrieve the appropriate half vector
			// From Section 2.2 on computing the transmission half vector:
			// https://blog.selfshadow.com/publications/s2015-shading-course/burley/s2015_pbs_disney_bsdf_notes.pdf
			h = normalize( wi + wo * eta );

		}

		h *= sign( h.z );
		return h;

	}

	vec3 getHalfVector( vec3 a, vec3 b ) {

		return normalize( a + b );

	}

	// The discrepancy between interpolated surface normal and geometry normal can cause issues when a ray
	// is cast that is on the top side of the geometry normal plane but below the surface normal plane. If
	// we find a ray like that we ignore it to avoid artifacts.
	// This function returns if the direction is on the same side of both planes.
	bool isDirectionValid( vec3 direction, vec3 surfaceNormal, vec3 geometryNormal ) {

		bool aboveSurfaceNormal = dot( direction, surfaceNormal ) > 0.0;
		bool aboveGeometryNormal = dot( direction, geometryNormal ) > 0.0;
		return aboveSurfaceNormal == aboveGeometryNormal;

	}

	// ray sampling x and z are swapped to align with expected background view
	vec2 equirectDirectionToUv( vec3 direction ) {

		// from Spherical.setFromCartesianCoords
		vec2 uv = vec2( atan( direction.z, direction.x ), acos( direction.y ) );
		uv /= vec2( 2.0 * PI, PI );

		// apply adjustments to get values in range [0, 1] and y right side up
		uv.x += 0.5;
		uv.y = 1.0 - uv.y;
		return uv;

	}

	vec3 equirectUvToDirection( vec2 uv ) {

		// undo above adjustments
		uv.x -= 0.5;
		uv.y = 1.0 - uv.y;

		// from Vector3.setFromSphericalCoords
		float theta = uv.x * 2.0 * PI;
		float phi = uv.y * PI;

		float sinPhi = sin( phi );

		return vec3( sinPhi * cos( theta ), cos( phi ), sinPhi * sin( theta ) );

	}

	// power heuristic for multiple importance sampling
	float misHeuristic( float a, float b ) {

		float aa = a * a;
		float bb = b * b;
		return aa / ( aa + bb );

	}

	// tentFilter from Peter Shirley's 'Realistic Ray Tracing (2nd Edition)' book, pg. 60
	// erichlof/THREE.js-PathTracing-Renderer/
	float tentFilter( float x ) {

		return x < 0.5 ? sqrt( 2.0 * x ) - 1.0 : 1.0 - sqrt( 2.0 - ( 2.0 * x ) );

	}
`,Or=`

	// https://www.shadertoy.com/view/wltcRS
	uvec4 WHITE_NOISE_SEED;

	void rng_initialize( vec2 p, int frame ) {

		// white noise seed
		WHITE_NOISE_SEED = uvec4( p, uint( frame ), uint( p.x ) + uint( p.y ) );

	}

	// https://www.pcg-random.org/
	void pcg4d( inout uvec4 v ) {

		v = v * 1664525u + 1013904223u;
		v.x += v.y * v.w;
		v.y += v.z * v.x;
		v.z += v.x * v.y;
		v.w += v.y * v.z;
		v = v ^ ( v >> 16u );
		v.x += v.y*v.w;
		v.y += v.z*v.x;
		v.z += v.x*v.y;
		v.w += v.y*v.z;

	}

	// returns [ 0, 1 ]
	float pcgRand() {

		pcg4d( WHITE_NOISE_SEED );
		return float( WHITE_NOISE_SEED.x ) / float( 0xffffffffu );

	}

	vec2 pcgRand2() {

		pcg4d( WHITE_NOISE_SEED );
		return vec2( WHITE_NOISE_SEED.xy ) / float(0xffffffffu);

	}

	vec3 pcgRand3() {

		pcg4d( WHITE_NOISE_SEED );
		return vec3( WHITE_NOISE_SEED.xyz ) / float( 0xffffffffu );

	}

	vec4 pcgRand4() {

		pcg4d( WHITE_NOISE_SEED );
		return vec4( WHITE_NOISE_SEED ) / float( 0xffffffffu );

	}
`,So=`

	uniform sampler2D stratifiedTexture;
	uniform sampler2D stratifiedOffsetTexture;

	uint sobolPixelIndex = 0u;
	uint sobolPathIndex = 0u;
	uint sobolBounceIndex = 0u;
	vec4 pixelSeed = vec4( 0 );

	vec4 rand4( int v ) {

		ivec2 uv = ivec2( v, sobolBounceIndex );
		vec4 stratifiedSample = texelFetch( stratifiedTexture, uv, 0 );
		return fract( stratifiedSample + pixelSeed.r ); // blue noise + stratified samples

	}

	vec3 rand3( int v ) {

		return rand4( v ).xyz;

	}

	vec2 rand2( int v ) {

		return rand4( v ).xy;

	}

	float rand( int v ) {

		return rand4( v ).x;

	}

	void rng_initialize( vec2 screenCoord, int frame ) {

		// tile the small noise texture across the entire screen
		ivec2 noiseSize = ivec2( textureSize( stratifiedOffsetTexture, 0 ) );
		ivec2 pixel = ivec2( screenCoord.xy ) % noiseSize;
		vec2 pixelWidth = 1.0 / vec2( noiseSize );
		vec2 uv = vec2( pixel ) * pixelWidth + pixelWidth * 0.5;

		// note that using "texelFetch" here seems to break Android for some reason
		pixelSeed = texture( stratifiedOffsetTexture, uv );

	}

`,_o=`

	// diffuse
	float diffuseEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		// https://schuttejoe.github.io/post/disneybsdf/
		float fl = schlickFresnel( wi.z, 0.0 );
		float fv = schlickFresnel( wo.z, 0.0 );

		float metalFactor = ( 1.0 - surf.metalness );
		float transFactor = ( 1.0 - surf.transmission );
		float rr = 0.5 + 2.0 * surf.roughness * fl * fl;
		float retro = rr * ( fl + fv + fl * fv * ( rr - 1.0f ) );
		float lambert = ( 1.0f - 0.5f * fl ) * ( 1.0f - 0.5f * fv );

		// TODO: subsurface approx?

		// float F = evaluateFresnelWeight( dot( wo, wh ), surf.eta, surf.f0 );
		float F = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );
		color = ( 1.0 - F ) * transFactor * metalFactor * wi.z * surf.color * ( retro + lambert ) / PI;

		return wi.z / PI;

	}

	vec3 diffuseDirection( vec3 wo, SurfaceRecord surf ) {

		vec3 lightDirection = sampleSphere( rand2( 11 ) );
		lightDirection.z += 1.0;
		lightDirection = normalize( lightDirection );

		return lightDirection;

	}

	// specular
	float specularEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		// if roughness is set to 0 then D === NaN which results in black pixels
		float metalness = surf.metalness;
		float roughness = surf.filteredRoughness;

		float eta = surf.eta;
		float f0 = surf.f0;

		vec3 f0Color = mix( f0 * surf.specularColor * surf.specularIntensity, surf.color, surf.metalness );
		vec3 f90Color = vec3( mix( surf.specularIntensity, 1.0, surf.metalness ) );
		vec3 F = evaluateFresnel( dot( wo, wh ), eta, f0Color, f90Color );

		vec3 iridescenceF = evalIridescence( 1.0, surf.iridescenceIor, dot( wi, wh ), surf.iridescenceThickness, f0Color );
		F = mix( F, iridescenceF,  surf.iridescence );

		// PDF
		// See 14.1.1 Microfacet BxDFs in https://www.pbr-book.org/
		float incidentTheta = acos( wo.z );
		float G = ggxShadowMaskG2( wi, wo, roughness );
		float D = ggxDistribution( wh, roughness );
		float G1 = ggxShadowMaskG1( incidentTheta, roughness );
		float ggxPdf = D * G1 * max( 0.0, abs( dot( wo, wh ) ) ) / abs ( wo.z );

		color = wi.z * F * G * D / ( 4.0 * abs( wi.z * wo.z ) );
		return ggxPdf / ( 4.0 * dot( wo, wh ) );

	}

	vec3 specularDirection( vec3 wo, SurfaceRecord surf ) {

		// sample ggx vndf distribution which gives a new normal
		float roughness = surf.filteredRoughness;
		vec3 halfVector = ggxDirection(
			wo,
			vec2( roughness ),
			rand2( 12 )
		);

		// apply to new ray by reflecting off the new normal
		return - reflect( wo, halfVector );

	}


	// transmission
	/*
	float transmissionEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		// See section 4.2 in https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf

		float filteredRoughness = surf.filteredRoughness;
		float eta = surf.eta;
		bool frontFace = surf.frontFace;
		bool thinFilm = surf.thinFilm;

		color = surf.transmission * surf.color;

		float denom = pow( eta * dot( wi, wh ) + dot( wo, wh ), 2.0 );
		return ggxPDF( wo, wh, filteredRoughness ) / denom;

	}

	vec3 transmissionDirection( vec3 wo, SurfaceRecord surf ) {

		float filteredRoughness = surf.filteredRoughness;
		float eta = surf.eta;
		bool frontFace = surf.frontFace;

		// sample ggx vndf distribution which gives a new normal
		vec3 halfVector = ggxDirection(
			wo,
			vec2( filteredRoughness ),
			rand2( 13 )
		);

		vec3 lightDirection = refract( normalize( - wo ), halfVector, eta );
		if ( surf.thinFilm ) {

			lightDirection = - refract( normalize( - lightDirection ), - vec3( 0.0, 0.0, 1.0 ), 1.0 / eta );

		}

		return normalize( lightDirection );

	}
	*/

	// TODO: This is just using a basic cosine-weighted specular distribution with an
	// incorrect PDF value at the moment. Update it to correctly use a GGX distribution
	float transmissionEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		color = surf.transmission * surf.color;

		// PDF
		// float F = evaluateFresnelWeight( dot( wo, wh ), surf.eta, surf.f0 );
		// float F = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );
		// if ( F >= 1.0 ) {

		// 	return 0.0;

		// }

		// return 1.0 / ( 1.0 - F );

		// reverted to previous to transmission. The above was causing black pixels
		float eta = surf.eta;
		float f0 = surf.f0;
		float cosTheta = min( wo.z, 1.0 );
		float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );
		float reflectance = schlickFresnel( cosTheta, f0 );
		bool cannotRefract = eta * sinTheta > 1.0;
		if ( cannotRefract ) {

			return 0.0;

		}

		return 1.0 / ( 1.0 - reflectance );

	}

	vec3 transmissionDirection( vec3 wo, SurfaceRecord surf ) {

		float roughness = surf.filteredRoughness;
		float eta = surf.eta;
		vec3 halfVector = normalize( vec3( 0.0, 0.0, 1.0 ) + sampleSphere( rand2( 13 ) ) * roughness );
		vec3 lightDirection = refract( normalize( - wo ), halfVector, eta );

		if ( surf.thinFilm ) {

			lightDirection = - refract( normalize( - lightDirection ), - vec3( 0.0, 0.0, 1.0 ), 1.0 / eta );

		}
		return normalize( lightDirection );

	}

	// clearcoat
	float clearcoatEval( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf, inout vec3 color ) {

		float ior = 1.5;
		float f0 = iorRatioToF0( ior );
		bool frontFace = surf.frontFace;
		float roughness = surf.filteredClearcoatRoughness;

		float eta = frontFace ? 1.0 / ior : ior;
		float G = ggxShadowMaskG2( wi, wo, roughness );
		float D = ggxDistribution( wh, roughness );
		float F = schlickFresnel( dot( wi, wh ), f0 );

		float fClearcoat = F * D * G / ( 4.0 * abs( wi.z * wo.z ) );
		color = color * ( 1.0 - surf.clearcoat * F ) + fClearcoat * surf.clearcoat * wi.z;

		// PDF
		// See equation (27) in http://jcgt.org/published/0003/02/03/
		return ggxPDF( wo, wh, roughness ) / ( 4.0 * dot( wi, wh ) );

	}

	vec3 clearcoatDirection( vec3 wo, SurfaceRecord surf ) {

		// sample ggx vndf distribution which gives a new normal
		float roughness = surf.filteredClearcoatRoughness;
		vec3 halfVector = ggxDirection(
			wo,
			vec2( roughness ),
			rand2( 14 )
		);

		// apply to new ray by reflecting off the new normal
		return - reflect( wo, halfVector );

	}

	// sheen
	vec3 sheenColor( vec3 wo, vec3 wi, vec3 wh, SurfaceRecord surf ) {

		float cosThetaO = saturateCos( wo.z );
		float cosThetaI = saturateCos( wi.z );
		float cosThetaH = wh.z;

		float D = velvetD( cosThetaH, surf.sheenRoughness );
		float G = velvetG( cosThetaO, cosThetaI, surf.sheenRoughness );

		// See equation (1) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
		vec3 color = surf.sheenColor;
		color *= D * G / ( 4.0 * abs( cosThetaO * cosThetaI ) );
		color *= wi.z;

		return color;

	}

	// bsdf
	void getLobeWeights(
		vec3 wo, vec3 wi, vec3 wh, vec3 clearcoatWo, SurfaceRecord surf,
		inout float diffuseWeight, inout float specularWeight, inout float transmissionWeight, inout float clearcoatWeight
	) {

		float metalness = surf.metalness;
		float transmission = surf.transmission;
		// float fEstimate = evaluateFresnelWeight( dot( wo, wh ), surf.eta, surf.f0 );
		float fEstimate = disneyFresnel( wo, wi, wh, surf.f0, surf.eta, surf.metalness );

		float transSpecularProb = mix( max( 0.25, fEstimate ), 1.0, metalness );
		float diffSpecularProb = 0.5 + 0.5 * metalness;

		diffuseWeight = ( 1.0 - transmission ) * ( 1.0 - diffSpecularProb );
		specularWeight = transmission * transSpecularProb + ( 1.0 - transmission ) * diffSpecularProb;
		transmissionWeight = transmission * ( 1.0 - transSpecularProb );
		clearcoatWeight = surf.clearcoat * schlickFresnel( clearcoatWo.z, 0.04 );

		float totalWeight = diffuseWeight + specularWeight + transmissionWeight + clearcoatWeight;
		diffuseWeight /= totalWeight;
		specularWeight /= totalWeight;
		transmissionWeight /= totalWeight;
		clearcoatWeight /= totalWeight;
	}

	float bsdfEval(
		vec3 wo, vec3 clearcoatWo, vec3 wi, vec3 clearcoatWi, SurfaceRecord surf,
		float diffuseWeight, float specularWeight, float transmissionWeight, float clearcoatWeight, inout float specularPdf, inout vec3 color
	) {

		float metalness = surf.metalness;
		float transmission = surf.transmission;

		float spdf = 0.0;
		float dpdf = 0.0;
		float tpdf = 0.0;
		float cpdf = 0.0;
		color = vec3( 0.0 );

		vec3 halfVector = getHalfVector( wi, wo, surf.eta );

		// diffuse
		if ( diffuseWeight > 0.0 && wi.z > 0.0 ) {

			dpdf = diffuseEval( wo, wi, halfVector, surf, color );
			color *= 1.0 - surf.transmission;

		}

		// ggx specular
		if ( specularWeight > 0.0 && wi.z > 0.0 ) {

			vec3 outColor;
			spdf = specularEval( wo, wi, getHalfVector( wi, wo ), surf, outColor );
			color += outColor;

		}

		// transmission
		if ( transmissionWeight > 0.0 && wi.z < 0.0 ) {

			tpdf = transmissionEval( wo, wi, halfVector, surf, color );

		}

		// sheen
		color *= mix( 1.0, sheenAlbedoScaling( wo, wi, surf ), surf.sheen );
		color += sheenColor( wo, wi, halfVector, surf ) * surf.sheen;

		// clearcoat
		if ( clearcoatWi.z >= 0.0 && clearcoatWeight > 0.0 ) {

			vec3 clearcoatHalfVector = getHalfVector( clearcoatWo, clearcoatWi );
			cpdf = clearcoatEval( clearcoatWo, clearcoatWi, clearcoatHalfVector, surf, color );

		}

		float pdf =
			dpdf * diffuseWeight
			+ spdf * specularWeight
			+ tpdf * transmissionWeight
			+ cpdf * clearcoatWeight;

		// retrieve specular rays for the shadows flag
		specularPdf = spdf * specularWeight + cpdf * clearcoatWeight;

		return pdf;

	}

	float bsdfResult( vec3 worldWo, vec3 worldWi, SurfaceRecord surf, inout vec3 color ) {

		if ( surf.volumeParticle ) {

			color = surf.color / ( 4.0 * PI );
			return 1.0 / ( 4.0 * PI );

		}

		vec3 wo = normalize( surf.normalInvBasis * worldWo );
		vec3 wi = normalize( surf.normalInvBasis * worldWi );

		vec3 clearcoatWo = normalize( surf.clearcoatInvBasis * worldWo );
		vec3 clearcoatWi = normalize( surf.clearcoatInvBasis * worldWi );

		vec3 wh = getHalfVector( wo, wi, surf.eta );
		float diffuseWeight;
		float specularWeight;
		float transmissionWeight;
		float clearcoatWeight;
		getLobeWeights( wo, wi, wh, clearcoatWo, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight );

		float specularPdf;
		return bsdfEval( wo, clearcoatWo, wi, clearcoatWi, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight, specularPdf, color );

	}

	ScatterRecord bsdfSample( vec3 worldWo, SurfaceRecord surf ) {

		if ( surf.volumeParticle ) {

			ScatterRecord sampleRec;
			sampleRec.specularPdf = 0.0;
			sampleRec.pdf = 1.0 / ( 4.0 * PI );
			sampleRec.direction = sampleSphere( rand2( 16 ) );
			sampleRec.color = surf.color / ( 4.0 * PI );
			return sampleRec;

		}

		vec3 wo = normalize( surf.normalInvBasis * worldWo );
		vec3 clearcoatWo = normalize( surf.clearcoatInvBasis * worldWo );
		mat3 normalBasis = surf.normalBasis;
		mat3 invBasis = surf.normalInvBasis;
		mat3 clearcoatNormalBasis = surf.clearcoatBasis;
		mat3 clearcoatInvBasis = surf.clearcoatInvBasis;

		float diffuseWeight;
		float specularWeight;
		float transmissionWeight;
		float clearcoatWeight;
		// using normal and basically-reflected ray since we don't have proper half vector here
		getLobeWeights( wo, wo, vec3( 0, 0, 1 ), clearcoatWo, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight );

		float pdf[4];
		pdf[0] = diffuseWeight;
		pdf[1] = specularWeight;
		pdf[2] = transmissionWeight;
		pdf[3] = clearcoatWeight;

		float cdf[4];
		cdf[0] = pdf[0];
		cdf[1] = pdf[1] + cdf[0];
		cdf[2] = pdf[2] + cdf[1];
		cdf[3] = pdf[3] + cdf[2];

		if( cdf[3] != 0.0 ) {

			float invMaxCdf = 1.0 / cdf[3];
			cdf[0] *= invMaxCdf;
			cdf[1] *= invMaxCdf;
			cdf[2] *= invMaxCdf;
			cdf[3] *= invMaxCdf;

		} else {

			cdf[0] = 1.0;
			cdf[1] = 0.0;
			cdf[2] = 0.0;
			cdf[3] = 0.0;

		}

		vec3 wi;
		vec3 clearcoatWi;

		float r = rand( 15 );
		if ( r <= cdf[0] ) { // diffuse

			wi = diffuseDirection( wo, surf );
			clearcoatWi = normalize( clearcoatInvBasis * normalize( normalBasis * wi ) );

		} else if ( r <= cdf[1] ) { // specular

			wi = specularDirection( wo, surf );
			clearcoatWi = normalize( clearcoatInvBasis * normalize( normalBasis * wi ) );

		} else if ( r <= cdf[2] ) { // transmission / refraction

			wi = transmissionDirection( wo, surf );
			clearcoatWi = normalize( clearcoatInvBasis * normalize( normalBasis * wi ) );

		} else if ( r <= cdf[3] ) { // clearcoat

			clearcoatWi = clearcoatDirection( clearcoatWo, surf );
			wi = normalize( invBasis * normalize( clearcoatNormalBasis * clearcoatWi ) );

		}

		ScatterRecord result;
		result.pdf = bsdfEval( wo, clearcoatWo, wi, clearcoatWi, surf, diffuseWeight, specularWeight, transmissionWeight, clearcoatWeight, result.specularPdf, result.color );
		result.direction = normalize( surf.normalBasis * wi );

		return result;

	}

`,Ro=`

	// returns the hit distance given the material density
	float intersectFogVolume( Material material, float u ) {

		// https://raytracing.github.io/books/RayTracingTheNextWeek.html#volumes/constantdensitymediums
		return material.opacity == 0.0 ? INFINITY : ( - 1.0 / material.opacity ) * log( u );

	}

	ScatterRecord sampleFogVolume( SurfaceRecord surf, vec2 uv ) {

		ScatterRecord sampleRec;
		sampleRec.specularPdf = 0.0;
		sampleRec.pdf = 1.0 / ( 2.0 * PI );
		sampleRec.direction = sampleSphere( uv );
		sampleRec.color = surf.color;
		return sampleRec;

	}

`,Ao=`

	// The GGX functions provide sampling and distribution information for normals as output so
	// in order to get probability of scatter direction the half vector must be computed and provided.
	// [0] https://www.cs.cornell.edu/~srm/publications/EGSR07-btdf.pdf
	// [1] https://hal.archives-ouvertes.fr/hal-01509746/document
	// [2] http://jcgt.org/published/0007/04/01/
	// [4] http://jcgt.org/published/0003/02/03/

	// trowbridge-reitz === GGX === GTR

	vec3 ggxDirection( vec3 incidentDir, vec2 roughness, vec2 uv ) {

		// TODO: try GGXVNDF implementation from reference [2], here. Needs to update ggxDistribution
		// function below, as well

		// Implementation from reference [1]
		// stretch view
		vec3 V = normalize( vec3( roughness * incidentDir.xy, incidentDir.z ) );

		// orthonormal basis
		vec3 T1 = ( V.z < 0.9999 ) ? normalize( cross( V, vec3( 0.0, 0.0, 1.0 ) ) ) : vec3( 1.0, 0.0, 0.0 );
		vec3 T2 = cross( T1, V );

		// sample point with polar coordinates (r, phi)
		float a = 1.0 / ( 1.0 + V.z );
		float r = sqrt( uv.x );
		float phi = ( uv.y < a ) ? uv.y / a * PI : PI + ( uv.y - a ) / ( 1.0 - a ) * PI;
		float P1 = r * cos( phi );
		float P2 = r * sin( phi ) * ( ( uv.y < a ) ? 1.0 : V.z );

		// compute normal
		vec3 N = P1 * T1 + P2 * T2 + V * sqrt( max( 0.0, 1.0 - P1 * P1 - P2 * P2 ) );

		// unstretch
		N = normalize( vec3( roughness * N.xy, max( 0.0, N.z ) ) );

		return N;

	}

	// Below are PDF and related functions for use in a Monte Carlo path tracer
	// as specified in Appendix B of the following paper
	// See equation (34) from reference [0]
	float ggxLamda( float theta, float roughness ) {

		float tanTheta = tan( theta );
		float tanTheta2 = tanTheta * tanTheta;
		float alpha2 = roughness * roughness;

		float numerator = - 1.0 + sqrt( 1.0 + alpha2 * tanTheta2 );
		return numerator / 2.0;

	}

	// See equation (34) from reference [0]
	float ggxShadowMaskG1( float theta, float roughness ) {

		return 1.0 / ( 1.0 + ggxLamda( theta, roughness ) );

	}

	// See equation (125) from reference [4]
	float ggxShadowMaskG2( vec3 wi, vec3 wo, float roughness ) {

		float incidentTheta = acos( wi.z );
		float scatterTheta = acos( wo.z );
		return 1.0 / ( 1.0 + ggxLamda( incidentTheta, roughness ) + ggxLamda( scatterTheta, roughness ) );

	}

	// See equation (33) from reference [0]
	float ggxDistribution( vec3 halfVector, float roughness ) {

		float a2 = roughness * roughness;
		a2 = max( EPSILON, a2 );
		float cosTheta = halfVector.z;
		float cosTheta4 = pow( cosTheta, 4.0 );

		if ( cosTheta == 0.0 ) return 0.0;

		float theta = acosSafe( halfVector.z );
		float tanTheta = tan( theta );
		float tanTheta2 = pow( tanTheta, 2.0 );

		float denom = PI * cosTheta4 * pow( a2 + tanTheta2, 2.0 );
		return ( a2 / denom );

	}

	// See equation (3) from reference [2]
	float ggxPDF( vec3 wi, vec3 halfVector, float roughness ) {

		float incidentTheta = acos( wi.z );
		float D = ggxDistribution( halfVector, roughness );
		float G1 = ggxShadowMaskG1( incidentTheta, roughness );

		return D * G1 * max( 0.0, dot( wi, halfVector ) ) / wi.z;

	}

`,Mo=`

	// XYZ to sRGB color space
	const mat3 XYZ_TO_REC709 = mat3(
		3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);

	vec3 fresnel0ToIor( vec3 fresnel0 ) {

		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );

	}

	// Conversion FO/IOR
	vec3 iorToFresnel0( vec3 transmittedIor, float incidentIor ) {

		return square( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );

	}

	// ior is a value between 1.0 and 3.0. 1.0 is air interface
	float iorToFresnel0( float transmittedIor, float incidentIor ) {

		return square( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ) );

	}

	// Fresnel equations for dielectric/dielectric interfaces. See https://belcour.github.io/blog/research/2017/05/01/brdf-thin-film.html
	vec3 evalSensitivity( float OPD, vec3 shift ) {

		float phase = 2.0 * PI * OPD * 1.0e-9;

		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );

		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - square( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * square( phase ) );
		xyz /= 1.0685e-7;

		vec3 srgb = XYZ_TO_REC709 * xyz;
		return srgb;

	}

	// See Section 4. Analytic Spectral Integration, A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence, https://hal.archives-ouvertes.fr/hal-01518344/document
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {

		vec3 I;

		// Force iridescenceIor -> outsideIOR when thinFilmThickness -> 0.0
		float iridescenceIor = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );

		// Evaluate the cosTheta on the base layer (Snell law)
		float sinTheta2Sq = square( outsideIOR / iridescenceIor ) * ( 1.0 - square( cosTheta1 ) );

		// Handle TIR:
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {

			return vec3( 1.0 );

		}

		float cosTheta2 = sqrt( cosTheta2Sq );

		// First interface
		float R0 = iorToFresnel0( iridescenceIor, outsideIOR );
		float R12 = schlickFresnel( cosTheta1, R0 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIor < outsideIOR ) {

			phi12 = PI;

		}

		float phi21 = PI - phi12;

		// Second interface
		vec3 baseIOR = fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) ); // guard against 1.0
		vec3 R1 = iorToFresnel0( baseIOR, iridescenceIor );
		vec3 R23 = schlickFresnel( cosTheta2, R1 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[0] < iridescenceIor ) {

			phi23[ 0 ] = PI;

		}

		if ( baseIOR[1] < iridescenceIor ) {

			phi23[ 1 ] = PI;

		}

		if ( baseIOR[2] < iridescenceIor ) {

			phi23[ 2 ] = PI;

		}

		// Phase shift
		float OPD = 2.0 * iridescenceIor * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;

		// Compound terms
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = square( T121 ) * R23 / ( vec3( 1.0 ) - R123 );

		// Reflectance term for m = 0 (DC term amplitude)
		vec3 C0 = R12 + Rs;
		I = C0;

		// Reflectance term for m > 0 (pairs of diracs)
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {

			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;

		}

		// Since out of gamut colors might be produced, negative color values are clamped to 0.
		return max( I, vec3( 0.0 ) );

	}

`,Io=`

	// See equation (2) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float velvetD( float cosThetaH, float roughness ) {

		float alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		float invAlpha = 1.0 / alpha;

		float sqrCosThetaH = cosThetaH * cosThetaH;
		float sinThetaH = max( 1.0 - sqrCosThetaH, 0.001 );

		return ( 2.0 + invAlpha ) * pow( sinThetaH, 0.5 * invAlpha ) / ( 2.0 * PI );

	}

	float velvetParamsInterpolate( int i, float oneMinusAlphaSquared ) {

		const float p0[5] = float[5]( 25.3245, 3.32435, 0.16801, -1.27393, -4.85967 );
		const float p1[5] = float[5]( 21.5473, 3.82987, 0.19823, -1.97760, -4.32054 );

		return mix( p1[i], p0[i], oneMinusAlphaSquared );

	}

	float velvetL( float x, float alpha ) {

		float oneMinusAlpha = 1.0 - alpha;
		float oneMinusAlphaSquared = oneMinusAlpha * oneMinusAlpha;

		float a = velvetParamsInterpolate( 0, oneMinusAlphaSquared );
		float b = velvetParamsInterpolate( 1, oneMinusAlphaSquared );
		float c = velvetParamsInterpolate( 2, oneMinusAlphaSquared );
		float d = velvetParamsInterpolate( 3, oneMinusAlphaSquared );
		float e = velvetParamsInterpolate( 4, oneMinusAlphaSquared );

		return a / ( 1.0 + b * pow( abs( x ), c ) ) + d * x + e;

	}

	// See equation (3) in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float velvetLambda( float cosTheta, float alpha ) {

		return abs( cosTheta ) < 0.5 ? exp( velvetL( cosTheta, alpha ) ) : exp( 2.0 * velvetL( 0.5, alpha ) - velvetL( 1.0 - cosTheta, alpha ) );

	}

	// See Section 3, Shadowing Term, in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float velvetG( float cosThetaO, float cosThetaI, float roughness ) {

		float alpha = max( roughness, 0.07 );
		alpha = alpha * alpha;

		return 1.0 / ( 1.0 + velvetLambda( cosThetaO, alpha ) + velvetLambda( cosThetaI, alpha ) );

	}

	float directionalAlbedoSheen( float cosTheta, float alpha ) {

		cosTheta = saturate( cosTheta );

		float c = 1.0 - cosTheta;
		float c3 = c * c * c;

		return 0.65584461 * c3 + 1.0 / ( 4.16526551 + exp( -7.97291361 * sqrt( alpha ) + 6.33516894 ) );

	}

	float sheenAlbedoScaling( vec3 wo, vec3 wi, SurfaceRecord surf ) {

		float alpha = max( surf.sheenRoughness, 0.07 );
		alpha = alpha * alpha;

		float maxSheenColor = max( max( surf.sheenColor.r, surf.sheenColor.g ), surf.sheenColor.b );

		float eWo = directionalAlbedoSheen( saturateCos( wo.z ), alpha );
		float eWi = directionalAlbedoSheen( saturateCos( wi.z ), alpha );

		return min( 1.0 - maxSheenColor * eWo, 1.0 - maxSheenColor * eWi );

	}

	// See Section 5, Layering, in http://www.aconty.com/pdf/s2017_pbs_imageworks_sheen.pdf
	float sheenAlbedoScaling( vec3 wo, SurfaceRecord surf ) {

		float alpha = max( surf.sheenRoughness, 0.07 );
		alpha = alpha * alpha;

		float maxSheenColor = max( max( surf.sheenColor.r, surf.sheenColor.g ), surf.sheenColor.b );

		float eWo = directionalAlbedoSheen( saturateCos( wo.z ), alpha );

		return 1.0 - maxSheenColor * eWo;

	}

`,Po=`

#ifndef FOG_CHECK_ITERATIONS
#define FOG_CHECK_ITERATIONS 30
#endif

// returns whether the given material is a fog material or not
bool isMaterialFogVolume( sampler2D materials, uint materialIndex ) {

	uint i = materialIndex * uint( MATERIAL_PIXELS );
	vec4 s14 = texelFetch1D( materials, i + 14u );
	return bool( int( s14.b ) & 4 );

}

// returns true if we're within the first fog volume we hit
bool bvhIntersectFogVolumeHit(
	vec3 rayOrigin, vec3 rayDirection,
	usampler2D materialIndexAttribute, sampler2D materials,
	inout Material material
) {

	material.fogVolume = false;

	for ( int i = 0; i < FOG_CHECK_ITERATIONS; i ++ ) {

		// find nearest hit
		uvec4 faceIndices = uvec4( 0u );
		vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
		vec3 barycoord = vec3( 0.0 );
		float side = 1.0;
		float dist = 0.0;
		bool hit = bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
		if ( hit ) {

			// if it's a fog volume return whether we hit the front or back face
			uint materialIndex = uTexelFetch1D( materialIndexAttribute, faceIndices.x ).r;
			if ( isMaterialFogVolume( materials, materialIndex ) ) {

				material = readMaterialInfo( materials, materialIndex );
				return side == - 1.0;

			} else {

				// move the ray forward
				rayOrigin = stepRayOrigin( rayOrigin, rayDirection, - faceNormal, dist );

			}

		} else {

			return false;

		}

	}

	return false;

}

`,Co=`

	// step through multiple surface hits and accumulate color attenuation based on transmissive surfaces
	// returns true if a solid surface was hit
	bool attenuateHit(
		RenderState state,
		Ray ray, float rayDist,
		out vec3 color
	) {

		// store the original bounce index so we can reset it after
		uint originalBounceIndex = sobolBounceIndex;

		int traversals = state.traversals;
		int transmissiveTraversals = state.transmissiveTraversals;
		bool isShadowRay = state.isShadowRay;
		Material fogMaterial = state.fogMaterial;

		vec3 startPoint = ray.origin;

		// hit results
		SurfaceHit surfaceHit;

		color = vec3( 1.0 );

		bool result = true;
		for ( int i = 0; i < traversals; i ++ ) {

			sobolBounceIndex ++;

			int hitType = traceScene( ray, fogMaterial, surfaceHit );

			if ( hitType == FOG_HIT ) {

				result = true;
				break;

			} else if ( hitType == SURFACE_HIT ) {

				float totalDist = distance( startPoint, ray.origin + ray.direction * surfaceHit.dist );
				if ( totalDist > rayDist ) {

					result = false;
					break;

				}

				// TODO: attenuate the contribution based on the PDF of the resulting ray including refraction values
				// Should be able to work using the material BSDF functions which will take into account specularity, etc.
				// TODO: should we account for emissive surfaces here?

				uint materialIndex = uTexelFetch1D( materialIndexAttribute, surfaceHit.faceIndices.x ).r;
				Material material = readMaterialInfo( materials, materialIndex );

				// adjust the ray to the new surface
				bool isEntering = surfaceHit.side == 1.0;
				ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );

				#if FEATURE_FOG

				if ( material.fogVolume ) {

					fogMaterial = material;
					fogMaterial.fogVolume = surfaceHit.side == 1.0;
					i -= sign( transmissiveTraversals );
					transmissiveTraversals --;
					continue;

				}

				#endif

				if ( ! material.castShadow && isShadowRay ) {

					continue;

				}

				vec2 uv = textureSampleBarycoord( attributesArray, ATTR_UV, surfaceHit.barycoord, surfaceHit.faceIndices.xyz ).xy;
				vec4 vertexColor = textureSampleBarycoord( attributesArray, ATTR_COLOR, surfaceHit.barycoord, surfaceHit.faceIndices.xyz );

				// albedo
				vec4 albedo = vec4( material.color, material.opacity );
				if ( material.map != - 1 ) {

					vec3 uvPrime = material.mapTransform * vec3( uv, 1 );
					albedo *= texture2D( textures, vec3( uvPrime.xy, material.map ) );

				}

				if ( material.vertexColors ) {

					albedo *= vertexColor;

				}

				// alphaMap
				if ( material.alphaMap != - 1 ) {

					vec3 uvPrime = material.alphaMapTransform * vec3( uv, 1 );
					albedo.a *= texture2D( textures, vec3( uvPrime.xy, material.alphaMap ) ).x;

				}

				// transmission
				float transmission = material.transmission;
				if ( material.transmissionMap != - 1 ) {

					vec3 uvPrime = material.transmissionMapTransform * vec3( uv, 1 );
					transmission *= texture2D( textures, vec3( uvPrime.xy, material.transmissionMap ) ).r;

				}

				// metalness
				float metalness = material.metalness;
				if ( material.metalnessMap != - 1 ) {

					vec3 uvPrime = material.metalnessMapTransform * vec3( uv, 1 );
					metalness *= texture2D( textures, vec3( uvPrime.xy, material.metalnessMap ) ).b;

				}

				float alphaTest = material.alphaTest;
				bool useAlphaTest = alphaTest != 0.0;
				float transmissionFactor = ( 1.0 - metalness ) * transmission;
				if (
					transmissionFactor < rand( 9 ) && ! (
						// material sidedness
						material.side != 0.0 && surfaceHit.side == material.side

						// alpha test
						|| useAlphaTest && albedo.a < alphaTest

						// opacity
						|| material.transparent && ! useAlphaTest && albedo.a < rand( 10 )
					)
				) {

					result = true;
					break;

				}

				if ( surfaceHit.side == 1.0 && isEntering ) {

					// only attenuate by surface color on the way in
					color *= mix( vec3( 1.0 ), albedo.rgb, transmissionFactor );

				} else if ( surfaceHit.side == - 1.0 ) {

					// attenuate by medium once we hit the opposite side of the model
					color *= transmissionAttenuation( surfaceHit.dist, material.attenuationColor, material.attenuationDistance );

				}

				bool isTransmissiveRay = dot( ray.direction, surfaceHit.faceNormal * surfaceHit.side ) < 0.0;
				if ( ( isTransmissiveRay || isEntering ) && transmissiveTraversals > 0 ) {

					i -= sign( transmissiveTraversals );
					transmissiveTraversals --;

				}

			} else {

				result = false;
				break;

			}

		}

		// reset the bounce index
		sobolBounceIndex = originalBounceIndex;
		return result;

	}

`,Fo=`

	vec3 ndcToRayOrigin( vec2 coord ) {

		vec4 rayOrigin4 = cameraWorldMatrix * invProjectionMatrix * vec4( coord, - 1.0, 1.0 );
		return rayOrigin4.xyz / rayOrigin4.w;
	}

	Ray getCameraRay() {

		vec2 ssd = vec2( 1.0 ) / resolution;

		// Jitter the camera ray by finding a uv coordinate at a random sample
		// around this pixel's UV coordinate for AA
		vec2 ruv = rand2( 0 );
		vec2 jitteredUv = vUv + vec2( tentFilter( ruv.x ) * ssd.x, tentFilter( ruv.y ) * ssd.y );
		Ray ray;

		#if CAMERA_TYPE == 2

			// Equirectangular projection
			vec4 rayDirection4 = vec4( equirectUvToDirection( jitteredUv ), 0.0 );
			vec4 rayOrigin4 = vec4( 0.0, 0.0, 0.0, 1.0 );

			rayDirection4 = cameraWorldMatrix * rayDirection4;
			rayOrigin4 = cameraWorldMatrix * rayOrigin4;

			ray.direction = normalize( rayDirection4.xyz );
			ray.origin = rayOrigin4.xyz / rayOrigin4.w;

		#else

			// get [- 1, 1] normalized device coordinates
			vec2 ndc = 2.0 * jitteredUv - vec2( 1.0 );
			ray.origin = ndcToRayOrigin( ndc );

			#if CAMERA_TYPE == 1

				// Orthographic projection
				ray.direction = ( cameraWorldMatrix * vec4( 0.0, 0.0, - 1.0, 0.0 ) ).xyz;
				ray.direction = normalize( ray.direction );

			#else

				// Perspective projection
				ray.direction = normalize( mat3( cameraWorldMatrix ) * ( invProjectionMatrix * vec4( ndc, 0.0, 1.0 ) ).xyz );

			#endif

		#endif

		#if FEATURE_DOF
		{

			// depth of field
			vec3 focalPoint = ray.origin + normalize( ray.direction ) * physicalCamera.focusDistance;

			// get the aperture sample
			// if blades === 0 then we assume a circle
			vec3 shapeUVW= rand3( 1 );
			int blades = physicalCamera.apertureBlades;
			float anamorphicRatio = physicalCamera.anamorphicRatio;
			vec2 apertureSample = sampleAperture( blades, shapeUVW );
			apertureSample *= physicalCamera.bokehSize * 0.5 * 1e-3;

			// rotate the aperture shape
			apertureSample =
				rotateVector( apertureSample, physicalCamera.apertureRotation ) *
				saturate( vec2( anamorphicRatio, 1.0 / anamorphicRatio ) );

			// create the new ray
			ray.origin += ( cameraWorldMatrix * vec4( apertureSample, 0.0, 0.0 ) ).xyz;
			ray.direction = focalPoint - ray.origin;

		}
		#endif

		ray.direction = normalize( ray.direction );

		return ray;

	}

`,Do=`

	vec3 directLightContribution( vec3 worldWo, SurfaceRecord surf, RenderState state, vec3 rayOrigin ) {

		vec3 result = vec3( 0.0 );

		// uniformly pick a light or environment map
		if( lightsDenom != 0.0 && rand( 5 ) < float( lights.count ) / lightsDenom ) {

			// sample a light or environment
			LightRecord lightRec = randomLightSample( lights.tex, iesProfiles, lights.count, rayOrigin, rand3( 6 ) );

			bool isSampleBelowSurface = ! surf.volumeParticle && dot( surf.faceNormal, lightRec.direction ) < 0.0;
			if ( isSampleBelowSurface ) {

				lightRec.pdf = 0.0;

			}

			// check if a ray could even reach the light area
			Ray lightRay;
			lightRay.origin = rayOrigin;
			lightRay.direction = lightRec.direction;
			vec3 attenuatedColor;
			if (
				lightRec.pdf > 0.0 &&
				isDirectionValid( lightRec.direction, surf.normal, surf.faceNormal ) &&
				! attenuateHit( state, lightRay, lightRec.dist, attenuatedColor )
			) {

				// get the material pdf
				vec3 sampleColor;
				float lightMaterialPdf = bsdfResult( worldWo, lightRec.direction, surf, sampleColor );
				bool isValidSampleColor = all( greaterThanEqual( sampleColor, vec3( 0.0 ) ) );
				if ( lightMaterialPdf > 0.0 && isValidSampleColor ) {

					// weight the direct light contribution
					float lightPdf = lightRec.pdf / lightsDenom;
					float misWeight = lightRec.type == SPOT_LIGHT_TYPE || lightRec.type == DIR_LIGHT_TYPE || lightRec.type == POINT_LIGHT_TYPE ? 1.0 : misHeuristic( lightPdf, lightMaterialPdf );
					result = attenuatedColor * lightRec.emission * state.throughputColor * sampleColor * misWeight / lightPdf;

				}

			}

		} else if ( envMapInfo.totalSum != 0.0 && environmentIntensity != 0.0 ) {

			// find a sample in the environment map to include in the contribution
			vec3 envColor, envDirection;
			float envPdf = sampleEquirectProbability( rand2( 7 ), envColor, envDirection );
			envDirection = invEnvRotation3x3 * envDirection;

			// this env sampling is not set up for transmissive sampling and yields overly bright
			// results so we ignore the sample in this case.
			// TODO: this should be improved but how? The env samples could traverse a few layers?
			bool isSampleBelowSurface = ! surf.volumeParticle && dot( surf.faceNormal, envDirection ) < 0.0;
			if ( isSampleBelowSurface ) {

				envPdf = 0.0;

			}

			// check if a ray could even reach the surface
			Ray envRay;
			envRay.origin = rayOrigin;
			envRay.direction = envDirection;
			vec3 attenuatedColor;
			if (
				envPdf > 0.0 &&
				isDirectionValid( envDirection, surf.normal, surf.faceNormal ) &&
				! attenuateHit( state, envRay, INFINITY, attenuatedColor )
			) {

				// get the material pdf
				vec3 sampleColor;
				float envMaterialPdf = bsdfResult( worldWo, envDirection, surf, sampleColor );
				bool isValidSampleColor = all( greaterThanEqual( sampleColor, vec3( 0.0 ) ) );
				if ( envMaterialPdf > 0.0 && isValidSampleColor ) {

					// weight the direct light contribution
					envPdf /= lightsDenom;
					float misWeight = misHeuristic( envPdf, envMaterialPdf );
					result = attenuatedColor * environmentIntensity * envColor * state.throughputColor * sampleColor * misWeight / envPdf;

				}

			}

		}

		// Function changed to have a single return statement to potentially help with crashes on Mac OS.
		// See issue #470
		return result;

	}

`,Eo=`

	#define SKIP_SURFACE 0
	#define HIT_SURFACE 1
	int getSurfaceRecord(
		Material material, SurfaceHit surfaceHit, sampler2DArray attributesArray,
		float accumulatedRoughness,
		inout SurfaceRecord surf
	) {

		if ( material.fogVolume ) {

			vec3 normal = vec3( 0, 0, 1 );

			SurfaceRecord fogSurface;
			fogSurface.volumeParticle = true;
			fogSurface.color = material.color;
			fogSurface.emission = material.emissiveIntensity * material.emissive;
			fogSurface.normal = normal;
			fogSurface.faceNormal = normal;
			fogSurface.clearcoatNormal = normal;

			surf = fogSurface;
			return HIT_SURFACE;

		}

		// uv coord for textures
		vec2 uv = textureSampleBarycoord( attributesArray, ATTR_UV, surfaceHit.barycoord, surfaceHit.faceIndices.xyz ).xy;
		vec4 vertexColor = textureSampleBarycoord( attributesArray, ATTR_COLOR, surfaceHit.barycoord, surfaceHit.faceIndices.xyz );

		// albedo
		vec4 albedo = vec4( material.color, material.opacity );
		if ( material.map != - 1 ) {

			vec3 uvPrime = material.mapTransform * vec3( uv, 1 );
			albedo *= texture2D( textures, vec3( uvPrime.xy, material.map ) );

		}

		if ( material.vertexColors ) {

			albedo *= vertexColor;

		}

		// alphaMap
		if ( material.alphaMap != - 1 ) {

			vec3 uvPrime = material.alphaMapTransform * vec3( uv, 1 );
			albedo.a *= texture2D( textures, vec3( uvPrime.xy, material.alphaMap ) ).x;

		}

		// possibly skip this sample if it's transparent, alpha test is enabled, or we hit the wrong material side
		// and it's single sided.
		// - alpha test is disabled when it === 0
		// - the material sidedness test is complicated because we want light to pass through the back side but still
		// be able to see the front side. This boolean checks if the side we hit is the front side on the first ray
		// and we're rendering the other then we skip it. Do the opposite on subsequent bounces to get incoming light.
		float alphaTest = material.alphaTest;
		bool useAlphaTest = alphaTest != 0.0;
		if (
			// material sidedness
			material.side != 0.0 && surfaceHit.side != material.side

			// alpha test
			|| useAlphaTest && albedo.a < alphaTest

			// opacity
			|| material.transparent && ! useAlphaTest && albedo.a < rand( 3 )
		) {

			return SKIP_SURFACE;

		}

		// fetch the interpolated smooth normal
		vec3 normal = normalize( textureSampleBarycoord(
			attributesArray,
			ATTR_NORMAL,
			surfaceHit.barycoord,
			surfaceHit.faceIndices.xyz
		).xyz );

		// roughness
		float roughness = material.roughness;
		if ( material.roughnessMap != - 1 ) {

			vec3 uvPrime = material.roughnessMapTransform * vec3( uv, 1 );
			roughness *= texture2D( textures, vec3( uvPrime.xy, material.roughnessMap ) ).g;

		}

		// metalness
		float metalness = material.metalness;
		if ( material.metalnessMap != - 1 ) {

			vec3 uvPrime = material.metalnessMapTransform * vec3( uv, 1 );
			metalness *= texture2D( textures, vec3( uvPrime.xy, material.metalnessMap ) ).b;

		}

		// emission
		vec3 emission = material.emissiveIntensity * material.emissive;
		if ( material.emissiveMap != - 1 ) {

			vec3 uvPrime = material.emissiveMapTransform * vec3( uv, 1 );
			emission *= texture2D( textures, vec3( uvPrime.xy, material.emissiveMap ) ).xyz;

		}

		// transmission
		float transmission = material.transmission;
		if ( material.transmissionMap != - 1 ) {

			vec3 uvPrime = material.transmissionMapTransform * vec3( uv, 1 );
			transmission *= texture2D( textures, vec3( uvPrime.xy, material.transmissionMap ) ).r;

		}

		// normal
		if ( material.flatShading ) {

			// if we're rendering a flat shaded object then use the face normals - the face normal
			// is provided based on the side the ray hits the mesh so flip it to align with the
			// interpolated vertex normals.
			normal = surfaceHit.faceNormal * surfaceHit.side;

		}

		vec3 baseNormal = normal;
		if ( material.normalMap != - 1 ) {

			vec4 tangentSample = textureSampleBarycoord(
				attributesArray,
				ATTR_TANGENT,
				surfaceHit.barycoord,
				surfaceHit.faceIndices.xyz
			);

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( tangentSample.xyz ) > 0.0 ) {

				vec3 tangent = normalize( tangentSample.xyz );
				vec3 bitangent = normalize( cross( normal, tangent ) * tangentSample.w );
				mat3 vTBN = mat3( tangent, bitangent, normal );

				vec3 uvPrime = material.normalMapTransform * vec3( uv, 1 );
				vec3 texNormal = texture2D( textures, vec3( uvPrime.xy, material.normalMap ) ).xyz * 2.0 - 1.0;
				texNormal.xy *= material.normalScale;
				normal = vTBN * texNormal;

			}

		}

		normal *= surfaceHit.side;

		// clearcoat
		float clearcoat = material.clearcoat;
		if ( material.clearcoatMap != - 1 ) {

			vec3 uvPrime = material.clearcoatMapTransform * vec3( uv, 1 );
			clearcoat *= texture2D( textures, vec3( uvPrime.xy, material.clearcoatMap ) ).r;

		}

		// clearcoatRoughness
		float clearcoatRoughness = material.clearcoatRoughness;
		if ( material.clearcoatRoughnessMap != - 1 ) {

			vec3 uvPrime = material.clearcoatRoughnessMapTransform * vec3( uv, 1 );
			clearcoatRoughness *= texture2D( textures, vec3( uvPrime.xy, material.clearcoatRoughnessMap ) ).g;

		}

		// clearcoatNormal
		vec3 clearcoatNormal = baseNormal;
		if ( material.clearcoatNormalMap != - 1 ) {

			vec4 tangentSample = textureSampleBarycoord(
				attributesArray,
				ATTR_TANGENT,
				surfaceHit.barycoord,
				surfaceHit.faceIndices.xyz
			);

			// some provided tangents can be malformed (0, 0, 0) causing the normal to be degenerate
			// resulting in NaNs and slow path tracing.
			if ( length( tangentSample.xyz ) > 0.0 ) {

				vec3 tangent = normalize( tangentSample.xyz );
				vec3 bitangent = normalize( cross( clearcoatNormal, tangent ) * tangentSample.w );
				mat3 vTBN = mat3( tangent, bitangent, clearcoatNormal );

				vec3 uvPrime = material.clearcoatNormalMapTransform * vec3( uv, 1 );
				vec3 texNormal = texture2D( textures, vec3( uvPrime.xy, material.clearcoatNormalMap ) ).xyz * 2.0 - 1.0;
				texNormal.xy *= material.clearcoatNormalScale;
				clearcoatNormal = vTBN * texNormal;

			}

		}

		clearcoatNormal *= surfaceHit.side;

		// sheenColor
		vec3 sheenColor = material.sheenColor;
		if ( material.sheenColorMap != - 1 ) {

			vec3 uvPrime = material.sheenColorMapTransform * vec3( uv, 1 );
			sheenColor *= texture2D( textures, vec3( uvPrime.xy, material.sheenColorMap ) ).rgb;

		}

		// sheenRoughness
		float sheenRoughness = material.sheenRoughness;
		if ( material.sheenRoughnessMap != - 1 ) {

			vec3 uvPrime = material.sheenRoughnessMapTransform * vec3( uv, 1 );
			sheenRoughness *= texture2D( textures, vec3( uvPrime.xy, material.sheenRoughnessMap ) ).a;

		}

		// iridescence
		float iridescence = material.iridescence;
		if ( material.iridescenceMap != - 1 ) {

			vec3 uvPrime = material.iridescenceMapTransform * vec3( uv, 1 );
			iridescence *= texture2D( textures, vec3( uvPrime.xy, material.iridescenceMap ) ).r;

		}

		// iridescence thickness
		float iridescenceThickness = material.iridescenceThicknessMaximum;
		if ( material.iridescenceThicknessMap != - 1 ) {

			vec3 uvPrime = material.iridescenceThicknessMapTransform * vec3( uv, 1 );
			float iridescenceThicknessSampled = texture2D( textures, vec3( uvPrime.xy, material.iridescenceThicknessMap ) ).g;
			iridescenceThickness = mix( material.iridescenceThicknessMinimum, material.iridescenceThicknessMaximum, iridescenceThicknessSampled );

		}

		iridescence = iridescenceThickness == 0.0 ? 0.0 : iridescence;

		// specular color
		vec3 specularColor = material.specularColor;
		if ( material.specularColorMap != - 1 ) {

			vec3 uvPrime = material.specularColorMapTransform * vec3( uv, 1 );
			specularColor *= texture2D( textures, vec3( uvPrime.xy, material.specularColorMap ) ).rgb;

		}

		// specular intensity
		float specularIntensity = material.specularIntensity;
		if ( material.specularIntensityMap != - 1 ) {

			vec3 uvPrime = material.specularIntensityMapTransform * vec3( uv, 1 );
			specularIntensity *= texture2D( textures, vec3( uvPrime.xy, material.specularIntensityMap ) ).a;

		}

		surf.volumeParticle = false;

		surf.faceNormal = surfaceHit.faceNormal;
		surf.normal = normal;

		surf.metalness = metalness;
		surf.color = albedo.rgb;
		surf.emission = emission;

		surf.ior = material.ior;
		surf.transmission = transmission;
		surf.thinFilm = material.thinFilm;
		surf.attenuationColor = material.attenuationColor;
		surf.attenuationDistance = material.attenuationDistance;

		surf.clearcoatNormal = clearcoatNormal;
		surf.clearcoat = clearcoat;

		surf.sheen = material.sheen;
		surf.sheenColor = sheenColor;

		surf.iridescence = iridescence;
		surf.iridescenceIor = material.iridescenceIor;
		surf.iridescenceThickness = iridescenceThickness;

		surf.specularColor = specularColor;
		surf.specularIntensity = specularIntensity;

		// apply perceptual roughness factor from gltf. sheen perceptual roughness is
		// applied by its brdf function
		// https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#microfacet-surfaces
		surf.roughness = roughness * roughness;
		surf.clearcoatRoughness = clearcoatRoughness * clearcoatRoughness;
		surf.sheenRoughness = sheenRoughness;

		// frontFace is used to determine transmissive properties and PDF. If no transmission is used
		// then we can just always assume this is a front face.
		surf.frontFace = surfaceHit.side == 1.0 || transmission == 0.0;
		surf.eta = material.thinFilm || surf.frontFace ? 1.0 / material.ior : material.ior;
		surf.f0 = iorRatioToF0( surf.eta );

		// Compute the filtered roughness value to use during specular reflection computations.
		// The accumulated roughness value is scaled by a user setting and a "magic value" of 5.0.
		// If we're exiting something transmissive then scale the factor down significantly so we can retain
		// sharp internal reflections
		surf.filteredRoughness = applyFilteredGlossy( surf.roughness, accumulatedRoughness );
		surf.filteredClearcoatRoughness = applyFilteredGlossy( surf.clearcoatRoughness, accumulatedRoughness );

		// get the normal frames
		surf.normalBasis = getBasisFromNormal( surf.normal );
		surf.normalInvBasis = inverse( surf.normalBasis );

		surf.clearcoatBasis = getBasisFromNormal( surf.clearcoatNormal );
		surf.clearcoatInvBasis = inverse( surf.clearcoatBasis );

		return HIT_SURFACE;

	}
`,Bo=`

	struct Ray {

		vec3 origin;
		vec3 direction;

	};

	struct SurfaceHit {

		uvec4 faceIndices;
		vec3 barycoord;
		vec3 faceNormal;
		float side;
		float dist;

	};

	struct RenderState {

		bool firstRay;
		bool transmissiveRay;
		bool isShadowRay;
		float accumulatedRoughness;
		int transmissiveTraversals;
		int traversals;
		uint depth;
		vec3 throughputColor;
		Material fogMaterial;

	};

	RenderState initRenderState() {

		RenderState result;
		result.firstRay = true;
		result.transmissiveRay = true;
		result.isShadowRay = false;
		result.accumulatedRoughness = 0.0;
		result.transmissiveTraversals = 0;
		result.traversals = 0;
		result.throughputColor = vec3( 1.0 );
		result.depth = 0u;
		result.fogMaterial.fogVolume = false;
		return result;

	}

`,ko=`

	#define NO_HIT 0
	#define SURFACE_HIT 1
	#define LIGHT_HIT 2
	#define FOG_HIT 3

	// Passing the global variable 'lights' into this function caused shader program errors.
	// So global variables like 'lights' and 'bvh' were moved out of the function parameters.
	// For more information, refer to: https://github.com/gkjohnson/three-gpu-pathtracer/pull/457
	int traceScene(
		Ray ray, Material fogMaterial, inout SurfaceHit surfaceHit
	) {

		int result = NO_HIT;
		bool hit = bvhIntersectFirstHit( bvh, ray.origin, ray.direction, surfaceHit.faceIndices, surfaceHit.faceNormal, surfaceHit.barycoord, surfaceHit.side, surfaceHit.dist );

		#if FEATURE_FOG

		if ( fogMaterial.fogVolume ) {

			// offset the distance so we don't run into issues with particles on the same surface
			// as other objects
			float particleDist = intersectFogVolume( fogMaterial, rand( 1 ) );
			if ( particleDist + RAY_OFFSET < surfaceHit.dist ) {

				surfaceHit.side = 1.0;
				surfaceHit.faceNormal = normalize( - ray.direction );
				surfaceHit.dist = particleDist;
				return FOG_HIT;

			}

		}

		#endif

		if ( hit ) {

			result = SURFACE_HIT;

		}

		return result;

	}

`;class No extends ii{onBeforeRender(){this.setDefine("FEATURE_DOF",this.physicalCamera.bokehSize===0?0:1),this.setDefine("FEATURE_BACKGROUND_MAP",this.backgroundMap?1:0),this.setDefine("FEATURE_FOG",this.materials.features.isUsed("FOG")?1:0)}constructor(e){super({transparent:!0,depthWrite:!1,defines:{FEATURE_MIS:1,FEATURE_RUSSIAN_ROULETTE:1,FEATURE_DOF:1,FEATURE_BACKGROUND_MAP:0,FEATURE_FOG:1,RANDOM_TYPE:2,CAMERA_TYPE:0,DEBUG_MODE:0,ATTR_NORMAL:0,ATTR_TANGENT:1,ATTR_UV:2,ATTR_COLOR:3,MATERIAL_PIXELS:$i},uniforms:{resolution:{value:new Z},opacity:{value:1},bounces:{value:10},transmissiveBounces:{value:10},filterGlossyFactor:{value:0},physicalCamera:{value:new Fa},cameraWorldMatrix:{value:new ee},invProjectionMatrix:{value:new ee},bvh:{value:new Zn},attributesArray:{value:new Va},materialIndexAttribute:{value:new ls},materials:{value:new Xa},textures:{value:new Nr().texture},lights:{value:new Ua},iesProfiles:{value:new Nr(360,180,{type:be,wrapS:Be,wrapT:Be}).texture},environmentIntensity:{value:1},environmentRotation:{value:new ee},envMapInfo:{value:new Ba},backgroundBlur:{value:0},backgroundMap:{value:null},backgroundAlpha:{value:1},backgroundIntensity:{value:1},backgroundRotation:{value:new ee},seed:{value:0},sobolTexture:{value:null},stratifiedTexture:{value:new ro},stratifiedOffsetTexture:{value:new co(64,1)}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vec4 mvPosition = vec4( position, 1.0 );
					mvPosition = modelViewMatrix * mvPosition;
					gl_Position = projectionMatrix * mvPosition;

					vUv = uv;

				}

			`,fragmentShader:`
				#define RAY_OFFSET 1e-4
				#define INFINITY 1e20

				precision highp isampler2D;
				precision highp usampler2D;
				precision highp sampler2DArray;
				vec4 envMapTexelToLinear( vec4 a ) { return a; }
				#include <common>

				// bvh intersection
				${ta}
				${ra}
				${ia}

				// uniform structs
				${uo}
				${ho}
				${fo}
				${mo}
				${po}

				// random
				#if RANDOM_TYPE == 2 	// Stratified List

					${So}

				#elif RANDOM_TYPE == 1 	// Sobol

					${Or}
					${hs}
					${Ia}

					#define rand(v) sobol(v)
					#define rand2(v) sobol2(v)
					#define rand3(v) sobol3(v)
					#define rand4(v) sobol4(v)

				#else 					// PCG

				${Or}

					// Using the sobol functions seems to break the the compiler on MacOS
					// - specifically the "sobolReverseBits" function.
					uint sobolPixelIndex = 0u;
					uint sobolPathIndex = 0u;
					uint sobolBounceIndex = 0u;

					#define rand(v) pcgRand()
					#define rand2(v) pcgRand2()
					#define rand3(v) pcgRand3()
					#define rand4(v) pcgRand4()

				#endif

				// common
				${To}
				${yo}
				${ps}
				${bo}
				${wo}

				// environment
				uniform EquirectHdrInfo envMapInfo;
				uniform mat4 environmentRotation;
				uniform float environmentIntensity;

				// lighting
				uniform sampler2DArray iesProfiles;
				uniform LightsInfo lights;

				// background
				uniform float backgroundBlur;
				uniform float backgroundAlpha;
				#if FEATURE_BACKGROUND_MAP

				uniform sampler2D backgroundMap;
				uniform mat4 backgroundRotation;
				uniform float backgroundIntensity;

				#endif

				// camera
				uniform mat4 cameraWorldMatrix;
				uniform mat4 invProjectionMatrix;
				#if FEATURE_DOF

				uniform PhysicalCamera physicalCamera;

				#endif

				// geometry
				uniform sampler2DArray attributesArray;
				uniform usampler2D materialIndexAttribute;
				uniform sampler2D materials;
				uniform sampler2DArray textures;
				uniform BVH bvh;

				// path tracer
				uniform int bounces;
				uniform int transmissiveBounces;
				uniform float filterGlossyFactor;
				uniform int seed;

				// image
				uniform vec2 resolution;
				uniform float opacity;

				varying vec2 vUv;

				// globals
				mat3 envRotation3x3;
				mat3 invEnvRotation3x3;
				float lightsDenom;

				// sampling
				${xo}
				${go}
				${vo}

				${Po}
				${Ao}
				${Io}
				${Mo}
				${Ro}
				${_o}

				float applyFilteredGlossy( float roughness, float accumulatedRoughness ) {

					return clamp(
						max(
							roughness,
							accumulatedRoughness * filterGlossyFactor * 5.0 ),
						0.0,
						1.0
					);

				}

				vec3 sampleBackground( vec3 direction, vec2 uv ) {

					vec3 sampleDir = sampleHemisphere( direction, uv ) * 0.5 * backgroundBlur;

					#if FEATURE_BACKGROUND_MAP

					sampleDir = normalize( mat3( backgroundRotation ) * direction + sampleDir );
					return backgroundIntensity * sampleEquirectColor( backgroundMap, sampleDir );

					#else

					sampleDir = normalize( envRotation3x3 * direction + sampleDir );
					return environmentIntensity * sampleEquirectColor( envMapInfo.map, sampleDir );

					#endif

				}

				${Bo}
				${Fo}
				${ko}
				${Co}
				${Do}
				${Eo}

				void main() {

					// init
					rng_initialize( gl_FragCoord.xy, seed );
					sobolPixelIndex = ( uint( gl_FragCoord.x ) << 16 ) | uint( gl_FragCoord.y );
					sobolPathIndex = uint( seed );

					// get camera ray
					Ray ray = getCameraRay();

					// inverse environment rotation
					envRotation3x3 = mat3( environmentRotation );
					invEnvRotation3x3 = inverse( envRotation3x3 );
					lightsDenom =
						( environmentIntensity == 0.0 || envMapInfo.totalSum == 0.0 ) && lights.count != 0u ?
							float( lights.count ) :
							float( lights.count + 1u );

					// final color
					gl_FragColor = vec4( 0, 0, 0, 1 );

					// surface results
					SurfaceHit surfaceHit;
					ScatterRecord scatterRec;

					// path tracing state
					RenderState state = initRenderState();
					state.transmissiveTraversals = transmissiveBounces;
					#if FEATURE_FOG

					state.fogMaterial.fogVolume = bvhIntersectFogVolumeHit(
						ray.origin, - ray.direction,
						materialIndexAttribute, materials,
						state.fogMaterial
					);

					#endif

					for ( int i = 0; i < bounces; i ++ ) {

						sobolBounceIndex ++;

						state.depth ++;
						state.traversals = bounces - i;
						state.firstRay = i == 0 && state.transmissiveTraversals == transmissiveBounces;

						int hitType = traceScene( ray, state.fogMaterial, surfaceHit );

						// check if we intersect any lights and accumulate the light contribution
						// TODO: we can add support for light surface rendering in the else condition if we
						// add the ability to toggle visibility of the the light
						if ( ! state.firstRay && ! state.transmissiveRay ) {

							LightRecord lightRec;
							float lightDist = hitType == NO_HIT ? INFINITY : surfaceHit.dist;
							for ( uint i = 0u; i < lights.count; i ++ ) {

								if (
									intersectLightAtIndex( lights.tex, ray.origin, ray.direction, i, lightRec ) &&
									lightRec.dist < lightDist
								) {

									#if FEATURE_MIS

									// weight the contribution
									// NOTE: Only area lights are supported for forward sampling and can be hit
									float misWeight = misHeuristic( scatterRec.pdf, lightRec.pdf / lightsDenom );
									gl_FragColor.rgb += lightRec.emission * state.throughputColor * misWeight;

									#else

									gl_FragColor.rgb += lightRec.emission * state.throughputColor;

									#endif

								}

							}

						}

						if ( hitType == NO_HIT ) {

							if ( state.firstRay || state.transmissiveRay ) {

								gl_FragColor.rgb += sampleBackground( ray.direction, rand2( 2 ) ) * state.throughputColor;
								gl_FragColor.a = backgroundAlpha;

							} else {

								#if FEATURE_MIS

								// get the PDF of the hit envmap point
								vec3 envColor;
								float envPdf = sampleEquirect( envRotation3x3 * ray.direction, envColor );
								envPdf /= lightsDenom;

								// and weight the contribution
								float misWeight = misHeuristic( scatterRec.pdf, envPdf );
								gl_FragColor.rgb += environmentIntensity * envColor * state.throughputColor * misWeight;

								#else

								gl_FragColor.rgb +=
									environmentIntensity *
									sampleEquirectColor( envMapInfo.map, envRotation3x3 * ray.direction ) *
									state.throughputColor;

								#endif

							}
							break;

						}

						uint materialIndex = uTexelFetch1D( materialIndexAttribute, surfaceHit.faceIndices.x ).r;
						Material material = readMaterialInfo( materials, materialIndex );

						#if FEATURE_FOG

						if ( hitType == FOG_HIT ) {

							material = state.fogMaterial;
							state.accumulatedRoughness += 0.2;

						} else if ( material.fogVolume ) {

							state.fogMaterial = material;
							state.fogMaterial.fogVolume = surfaceHit.side == 1.0;

							ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );

							i -= sign( state.transmissiveTraversals );
							state.transmissiveTraversals -= sign( state.transmissiveTraversals );
							continue;

						}

						#endif

						// early out if this is a matte material
						if ( material.matte && state.firstRay ) {

							gl_FragColor = vec4( 0.0 );
							break;

						}

						// if we've determined that this is a shadow ray and we've hit an item with no shadow casting
						// then skip it
						if ( ! material.castShadow && state.isShadowRay ) {

							ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );
							continue;

						}

						SurfaceRecord surf;
						if (
							getSurfaceRecord(
								material, surfaceHit, attributesArray, state.accumulatedRoughness,
								surf
							) == SKIP_SURFACE
						) {

							// only allow a limited number of transparency discards otherwise we could
							// crash the context with too long a loop.
							i -= sign( state.transmissiveTraversals );
							state.transmissiveTraversals -= sign( state.transmissiveTraversals );

							ray.origin = stepRayOrigin( ray.origin, ray.direction, - surfaceHit.faceNormal, surfaceHit.dist );
							continue;

						}

						scatterRec = bsdfSample( - ray.direction, surf );
						state.isShadowRay = scatterRec.specularPdf < rand( 4 );

						bool isBelowSurface = ! surf.volumeParticle && dot( scatterRec.direction, surf.faceNormal ) < 0.0;
						vec3 hitPoint = stepRayOrigin( ray.origin, ray.direction, isBelowSurface ? - surf.faceNormal : surf.faceNormal, surfaceHit.dist );

						// next event estimation
						#if FEATURE_MIS

						gl_FragColor.rgb += directLightContribution( - ray.direction, surf, state, hitPoint );

						#endif

						// accumulate a roughness value to offset diffuse, specular, diffuse rays that have high contribution
						// to a single pixel resulting in fireflies
						// TODO: handle transmissive surfaces
						if ( ! surf.volumeParticle && ! isBelowSurface ) {

							// determine if this is a rough normal or not by checking how far off straight up it is
							vec3 halfVector = normalize( - ray.direction + scatterRec.direction );
							state.accumulatedRoughness += max(
								sin( acosApprox( dot( halfVector, surf.normal ) ) ),
								sin( acosApprox( dot( halfVector, surf.clearcoatNormal ) ) )
							);

							state.transmissiveRay = false;

						}

						// accumulate emissive color
						gl_FragColor.rgb += ( surf.emission * state.throughputColor );

						// skip the sample if our PDF or ray is impossible
						if ( scatterRec.pdf <= 0.0 || ! isDirectionValid( scatterRec.direction, surf.normal, surf.faceNormal ) ) {

							break;

						}

						// if we're bouncing around the inside a transmissive material then decrement
						// perform this separate from a bounce
						bool isTransmissiveRay = ! surf.volumeParticle && dot( scatterRec.direction, surf.faceNormal * surfaceHit.side ) < 0.0;
						if ( ( isTransmissiveRay || isBelowSurface ) && state.transmissiveTraversals > 0 ) {

							state.transmissiveTraversals --;
							i --;

						}

						//

						// handle throughput color transformation
						// attenuate the throughput color by the medium color
						if ( ! surf.frontFace ) {

							state.throughputColor *= transmissionAttenuation( surfaceHit.dist, surf.attenuationColor, surf.attenuationDistance );

						}

						#if FEATURE_RUSSIAN_ROULETTE

						// russian roulette path termination
						// https://www.arnoldrenderer.com/research/physically_based_shader_design_in_arnold.pdf
						uint minBounces = 3u;
						float depthProb = float( state.depth < minBounces );

						float rrProb = luminance( state.throughputColor * scatterRec.color / scatterRec.pdf );
						rrProb /= luminance( state.throughputColor );
						rrProb = sqrt( rrProb );
						rrProb = max( rrProb, depthProb );
						rrProb = min( rrProb, 1.0 );
						if ( rand( 8 ) > rrProb ) {

							break;

						}

						// perform sample clamping here to avoid bright pixels
						state.throughputColor *= min( 1.0 / rrProb, 20.0 );

						#endif

						// adjust the throughput and discard and exit if we find discard the sample if there are any NaNs
						state.throughputColor *= scatterRec.color / scatterRec.pdf;
						if ( any( isnan( state.throughputColor ) ) || any( isinf( state.throughputColor ) ) ) {

							break;

						}

						//

						// prepare for next ray
						ray.direction = scatterRec.direction;
						ray.origin = hitPoint;

					}

					gl_FragColor.a *= opacity;

					#if DEBUG_MODE == 1

					// output the number of rays checked in the path and number of
					// transmissive rays encountered.
					gl_FragColor.rgb = vec3(
						float( state.depth ),
						transmissiveBounces - state.transmissiveTraversals,
						0.0
					);
					gl_FragColor.a = 1.0;

					#endif

				}

			`}),this.setValues(e)}}function*zo(){const{_renderer:s,_fsQuad:e,_blendQuad:t,_primaryTarget:r,_blendTargets:n,_sobolTarget:a,_subframe:i,alpha:l,material:c}=this,h=new dt,f=new dt,u=t.material;let[o,m]=n;for(;;){l?(u.opacity=this._opacityFactor/(this.samples+1),c.blending=ht,c.opacity=1):(c.opacity=this._opacityFactor/(this.samples+1),c.blending=Kr);const[v,y,d,p]=i,g=r.width,x=r.height;c.resolution.set(g*d,x*p),c.sobolTexture=a.texture,c.stratifiedTexture.init(20,c.bounces+c.transmissiveBounces+5),c.stratifiedTexture.next(),c.seed++;const w=this.tiles.x||1,b=this.tiles.y||1,S=w*b,R=Math.ceil(g*d),M=Math.ceil(x*p),I=Math.floor(v*g),P=Math.floor(y*x),F=Math.ceil(R/w),A=Math.ceil(M/b);for(let D=0;D<b;D++)for(let E=0;E<w;E++){const L=s.getRenderTarget(),W=s.autoClear,ce=s.getScissorTest();s.getScissor(h),s.getViewport(f);let X=E,me=D;if(!this.stableTiles){const Ne=this._currentTile%(w*b);X=Ne%w,me=~~(Ne/w),this._currentTile=Ne+1}const Ie=b-me-1;r.scissor.set(I+X*F,P+Ie*A,Math.min(F,R-X*F),Math.min(A,M-Ie*A)),r.viewport.set(I,P,R,M),s.setRenderTarget(r),s.setScissorTest(!0),s.autoClear=!1,e.render(s),s.setViewport(f),s.setScissor(h),s.setScissorTest(ce),s.setRenderTarget(L),s.autoClear=W,l&&(u.target1=o.texture,u.target2=r.texture,s.setRenderTarget(m),t.render(s),s.setRenderTarget(L)),this.samples+=1/S,E===w-1&&D===b-1&&(this.samples=Math.round(this.samples)),yield}[o,m]=[m,o]}}const Lr=new we;class Hr{get material(){return this._fsQuad.material}set material(e){this._fsQuad.material.removeEventListener("recompilation",this._compileFunction),e.addEventListener("recompilation",this._compileFunction),this._fsQuad.material=e}get target(){return this._alpha?this._blendTargets[1]:this._primaryTarget}set alpha(e){this._alpha!==e&&(e||(this._blendTargets[0].dispose(),this._blendTargets[1].dispose()),this._alpha=e,this.reset())}get alpha(){return this._alpha}get isCompiling(){return!!this._compilePromise}constructor(e){this.camera=null,this.tiles=new Z(3,3),this.stableNoise=!1,this.stableTiles=!0,this.samples=0,this._subframe=new dt(0,0,1,1),this._opacityFactor=1,this._renderer=e,this._alpha=!1,this._fsQuad=new $e(new No),this._blendQuad=new $e(new Aa),this._task=null,this._currentTile=0,this._compilePromise=null,this._sobolTarget=new Ca().generate(e),this._primaryTarget=new Mt(1,1,{format:Q,type:K,magFilter:G,minFilter:G}),this._blendTargets=[new Mt(1,1,{format:Q,type:K,magFilter:G,minFilter:G}),new Mt(1,1,{format:Q,type:K,magFilter:G,minFilter:G})],this._compileFunction=()=>{const t=this.compileMaterial(this._fsQuad._mesh);t.then(()=>{this._compilePromise===t&&(this._compilePromise=null)}),this._compilePromise=t},this.material.addEventListener("recompilation",this._compileFunction)}compileMaterial(){return this._renderer.compileAsync(this._fsQuad._mesh)}setCamera(e){const{material:t}=this;t.cameraWorldMatrix.copy(e.matrixWorld),t.invProjectionMatrix.copy(e.projectionMatrixInverse),t.physicalCamera.updateFrom(e);let r=0;e.projectionMatrix.elements[15]>0&&(r=1),e.isEquirectCamera&&(r=2),t.setDefine("CAMERA_TYPE",r),this.camera=e}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t),!(this._primaryTarget.width===e&&this._primaryTarget.height===t)&&(this._primaryTarget.setSize(e,t),this._blendTargets[0].setSize(e,t),this._blendTargets[1].setSize(e,t),this.reset())}getSize(e){e.x=this._primaryTarget.width,e.y=this._primaryTarget.height}dispose(){this._primaryTarget.dispose(),this._blendTargets[0].dispose(),this._blendTargets[1].dispose(),this._sobolTarget.dispose(),this._fsQuad.dispose(),this._blendQuad.dispose(),this._task=null}reset(){const{_renderer:e,_primaryTarget:t,_blendTargets:r}=this,n=e.getRenderTarget(),a=e.getClearAlpha();e.getClearColor(Lr),e.setRenderTarget(t),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(r[0]),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(r[1]),e.setClearColor(0,0),e.clearColor(),e.setClearColor(Lr,a),e.setRenderTarget(n),this.samples=0,this._task=null,this.material.stratifiedTexture.stableNoise=this.stableNoise,this.stableNoise&&(this.material.seed=0,this.material.stratifiedTexture.reset())}update(){this.material.onBeforeRender(),!this.isCompiling&&(this._task||(this._task=zo.call(this)),this._task.next())}}const qe=new Z,Ur=new Z,Yt=new Ns,Xt=new we;class Oo extends he{constructor(e=512,t=512){super(new Float32Array(e*t*4),e,t,Q,K,Zr,De,Be,xe,xe),this.generationCallback=null}update(){this.dispose(),this.needsUpdate=!0;const{data:e,width:t,height:r}=this.image;for(let n=0;n<t;n++)for(let a=0;a<r;a++){Ur.set(t,r),qe.set(n/t,a/r),qe.x-=.5,qe.y=1-qe.y,Yt.theta=qe.x*2*Math.PI,Yt.phi=qe.y*Math.PI,Yt.radius=1,this.generationCallback(Yt,qe,Ur,Xt);const l=4*(a*t+n);e[l+0]=Xt.r,e[l+1]=Xt.g,e[l+2]=Xt.b,e[l+3]=1}}copy(e){return super.copy(e),this.generationCallback=e.generationCallback,this}}const Wr=new B;class Lo extends Oo{constructor(e=512){super(e,e),this.topColor=new we().set(16777215),this.bottomColor=new we().set(0),this.exponent=2,this.generationCallback=(t,r,n,a)=>{Wr.setFromSpherical(t);const i=Wr.y*.5+.5;a.lerpColors(this.bottomColor,this.topColor,i**this.exponent)}}copy(e){return super.copy(e),this.topColor.copy(e.topColor),this.bottomColor.copy(e.bottomColor),this}}class Ho extends Jt{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}constructor(e){super({uniforms:{map:{value:null},opacity:{value:1}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`
				uniform sampler2D map;
				uniform float opacity;
				varying vec2 vUv;

				vec4 clampedTexelFatch( sampler2D map, ivec2 px, int lod ) {

					vec4 res = texelFetch( map, ivec2( px.x, px.y ), 0 );

					#if defined( TONE_MAPPING )

					res.xyz = toneMapping( res.xyz );

					#endif

			  		return linearToOutputTexel( res );

				}

				void main() {

					vec2 size = vec2( textureSize( map, 0 ) );
					vec2 pxUv = vUv * size;
					vec2 pxCurr = floor( pxUv );
					vec2 pxFrac = fract( pxUv ) - 0.5;
					vec2 pxOffset;
					pxOffset.x = pxFrac.x > 0.0 ? 1.0 : - 1.0;
					pxOffset.y = pxFrac.y > 0.0 ? 1.0 : - 1.0;

					vec2 pxNext = clamp( pxOffset + pxCurr, vec2( 0.0 ), size - 1.0 );
					vec2 alpha = abs( pxFrac );

					vec4 p1 = mix(
						clampedTexelFatch( map, ivec2( pxCurr.x, pxCurr.y ), 0 ),
						clampedTexelFatch( map, ivec2( pxNext.x, pxCurr.y ), 0 ),
						alpha.x
					);

					vec4 p2 = mix(
						clampedTexelFatch( map, ivec2( pxCurr.x, pxNext.y ), 0 ),
						clampedTexelFatch( map, ivec2( pxNext.x, pxNext.y ), 0 ),
						alpha.x
					);

					gl_FragColor = mix( p1, p2, alpha.y );
					gl_FragColor.a *= opacity;
					#include <premultiplied_alpha_fragment>

				}
			`}),this.setValues(e)}}class Uo extends Jt{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`
				#define ENVMAP_TYPE_CUBE_UV

				uniform samplerCube envMap;
				uniform float flipEnvMap;
				varying vec2 vUv;

				#include <common>
				#include <cube_uv_reflection_fragment>

				${ps}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}}class Vr{constructor(e){this._renderer=e,this._quad=new $e(new Uo)}generate(e,t=null,r=null){if(!e.isCubeTexture)throw new Error("CubeToEquirectMaterial: Source can only be cube textures.");const n=e.images[0],a=this._renderer,i=this._quad;t===null&&(t=4*n.height),r===null&&(r=2*n.height);const l=new Mt(t,r,{type:K,colorSpace:n.colorSpace}),c=n.height,h=Math.log2(c)-2,f=1/c,u=1/(3*Math.max(Math.pow(2,h),7*16));i.material.defines.CUBEUV_MAX_MIP=`${h}.0`,i.material.defines.CUBEUV_TEXEL_WIDTH=u,i.material.defines.CUBEUV_TEXEL_HEIGHT=f,i.material.uniforms.envMap.value=e,i.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,i.material.needsUpdate=!0;const o=a.getRenderTarget(),m=a.autoClear;a.autoClear=!0,a.setRenderTarget(l),i.render(a),a.setRenderTarget(o),a.autoClear=m;const v=new Uint16Array(t*r*4),y=new Float32Array(t*r*4);a.readRenderTargetPixels(l,0,0,t,r,y),l.dispose();for(let p=0,g=y.length;p<g;p++)v[p]=Re.toHalfFloat(y[p]);const d=new he(v,t,r,Q,be);return d.minFilter=zs,d.magFilter=xe,d.wrapS=De,d.wrapT=De,d.mapping=Zr,d.needsUpdate=!0,d}dispose(){this._quad.dispose()}}function Wo(s){return s.extensions.get("EXT_float_blend")}const ct=new Z;class Vo{get multipleImportanceSampling(){return!!this._pathTracer.material.defines.FEATURE_MIS}set multipleImportanceSampling(e){this._pathTracer.material.setDefine("FEATURE_MIS",e?1:0)}get transmissiveBounces(){return this._pathTracer.material.transmissiveBounces}set transmissiveBounces(e){this._pathTracer.material.transmissiveBounces=e}get bounces(){return this._pathTracer.material.bounces}set bounces(e){this._pathTracer.material.bounces=e}get filterGlossyFactor(){return this._pathTracer.material.filterGlossyFactor}set filterGlossyFactor(e){this._pathTracer.material.filterGlossyFactor=e}get samples(){return this._pathTracer.samples}get target(){return this._pathTracer.target}get tiles(){return this._pathTracer.tiles}get stableNoise(){return this._pathTracer.stableNoise}set stableNoise(e){this._pathTracer.stableNoise=e}get isCompiling(){return!!this._pathTracer.isCompiling}constructor(e){this._renderer=e,this._generator=new Ta,this._pathTracer=new Hr(e),this._queueReset=!1,this._clock=new Os,this._compilePromise=null,this._lowResPathTracer=new Hr(e),this._lowResPathTracer.tiles.set(1,1),this._quad=new $e(new Ho({map:null,transparent:!0,blending:ht,premultipliedAlpha:e.getContextAttributes().premultipliedAlpha})),this._materials=null,this._previousEnvironment=null,this._previousBackground=null,this._internalBackground=null,this.renderDelay=100,this.minSamples=5,this.fadeDuration=500,this.enablePathTracing=!0,this.pausePathTracing=!1,this.dynamicLowRes=!1,this.lowResScale=.25,this.renderScale=1,this.synchronizeRenderSize=!0,this.rasterizeScene=!0,this.renderToCanvas=!0,this.textureSize=new Z(1024,1024),this.rasterizeSceneCallback=(t,r)=>{this._renderer.render(t,r)},this.renderToCanvasCallback=(t,r,n)=>{const a=r.autoClear;r.autoClear=!1,n.render(r),r.autoClear=a},this.setScene(new Ls,new Qr)}setBVHWorker(e){this._generator.setBVHWorker(e)}setScene(e,t,r={}){e.updateMatrixWorld(!0),t.updateMatrixWorld();const n=this._generator;if(n.setObjects(e),this._buildAsync)return n.generateAsync(r.onProgress).then(a=>this._updateFromResults(e,t,a));{const a=n.generate();return this._updateFromResults(e,t,a)}}setSceneAsync(...e){this._buildAsync=!0;const t=this.setScene(...e);return this._buildAsync=!1,t}setCamera(e){this.camera=e,this.updateCamera()}updateCamera(){const e=this.camera;e.updateMatrixWorld(),this._pathTracer.setCamera(e),this._lowResPathTracer.setCamera(e),this.reset()}updateMaterials(){const e=this._pathTracer.material,t=this._renderer,r=this._materials,n=this.textureSize,a=Ga(r);e.textures.setTextures(t,a,n.x,n.y),e.materials.updateFrom(r,a),this.reset()}updateLights(){const e=this.scene,t=this._renderer,r=this._pathTracer.material,n=$a(e),a=qa(n);r.lights.updateFrom(n,a),r.iesProfiles.setTextures(t,a),this.reset()}updateEnvironment(){const e=this.scene,t=this._pathTracer.material;if(this._internalBackground&&(this._internalBackground.dispose(),this._internalBackground=null),t.backgroundBlur=e.backgroundBlurriness,t.backgroundIntensity=e.backgroundIntensity??1,t.backgroundRotation.makeRotationFromEuler(e.backgroundRotation).invert(),e.background===null)t.backgroundMap=null,t.backgroundAlpha=0;else if(e.background.isColor){this._colorBackground=this._colorBackground||new Lo(16);const r=this._colorBackground;r.topColor.equals(e.background)||(r.topColor.set(e.background),r.bottomColor.set(e.background),r.update()),t.backgroundMap=r,t.backgroundAlpha=1}else if(e.background.isCubeTexture){if(e.background!==this._previousBackground){const r=new Vr(this._renderer).generate(e.background);this._internalBackground=r,t.backgroundMap=r,t.backgroundAlpha=1}}else t.backgroundMap=e.background,t.backgroundAlpha=1;if(t.environmentIntensity=e.environment!==null?e.environmentIntensity??1:0,t.environmentRotation.makeRotationFromEuler(e.environmentRotation).invert(),this._previousEnvironment!==e.environment&&e.environment!==null)if(e.environment.isCubeTexture){const r=new Vr(this._renderer).generate(e.environment);t.envMapInfo.updateFrom(r)}else t.envMapInfo.updateFrom(e.environment);this._previousEnvironment=e.environment,this._previousBackground=e.background,this.reset()}_updateFromResults(e,t,r){const{materials:n,geometry:a,bvh:i,bvhChanged:l,needsMaterialIndexUpdate:c}=r;this._materials=n;const f=this._pathTracer.material;return l&&(f.bvh.updateFrom(i),f.attributesArray.updateFrom(a.attributes.normal,a.attributes.tangent,a.attributes.uv,a.attributes.color)),c&&f.materialIndexAttribute.updateFrom(a.attributes.materialIndex),this._previousScene=e,this.scene=e,this.camera=t,this.updateCamera(),this.updateMaterials(),this.updateEnvironment(),this.updateLights(),r}renderSample(){const e=this._lowResPathTracer,t=this._pathTracer,r=this._renderer,n=this._clock,a=this._quad;this._updateScale(),this._queueReset&&(t.reset(),e.reset(),this._queueReset=!1,a.material.opacity=0,n.start());const i=n.getDelta()*1e3,l=n.getElapsedTime()*1e3;if(!this.pausePathTracing&&this.enablePathTracing&&this.renderDelay<=l&&!this.isCompiling&&t.update(),t.alpha=t.material.backgroundAlpha!==1||!Wo(r),e.alpha=t.alpha,this.renderToCanvas){const c=this._renderer,h=this.minSamples;if(l>=this.renderDelay&&this.samples>=this.minSamples&&(this.fadeDuration!==0?a.material.opacity=Math.min(a.material.opacity+i/this.fadeDuration,1):a.material.opacity=1),!this.enablePathTracing||this.samples<h||a.material.opacity<1){if(this.dynamicLowRes&&!this.isCompiling){e.samples<1&&(e.material=t.material,e.update());const f=a.material.opacity;a.material.opacity=1-a.material.opacity,a.material.map=e.target.texture,a.render(c),a.material.opacity=f}(!this.dynamicLowRes&&this.rasterizeScene||this.dynamicLowRes&&this.isCompiling)&&this.rasterizeSceneCallback(this.scene,this.camera)}this.enablePathTracing&&a.material.opacity>0&&(a.material.opacity<1&&(a.material.blending=this.dynamicLowRes?Hs:Kr),a.material.map=t.target.texture,this.renderToCanvasCallback(t.target,c,a),a.material.blending=ht)}}reset(){this._queueReset=!0,this._pathTracer.samples=0}dispose(){this._quad.dispose(),this._quad.material.dispose(),this._pathTracer.dispose()}_updateScale(){if(this.synchronizeRenderSize){this._renderer.getDrawingBufferSize(ct);const e=Math.floor(this.renderScale*ct.x),t=Math.floor(this.renderScale*ct.y);if(this._pathTracer.getSize(ct),ct.x!==e||ct.y!==t){const r=this.lowResScale;this._pathTracer.setSize(e,t),this._lowResPathTracer.setSize(Math.floor(e*r),Math.floor(t*r))}}}}class jo extends ii{constructor(e){super({blending:ht,transparent:!1,depthWrite:!1,depthTest:!1,defines:{USE_SLIDER:0},uniforms:{sigma:{value:5},threshold:{value:.03},kSigma:{value:1},map:{value:null},opacity:{value:1}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}

			`,fragmentShader:`

				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
				//  Copyright (c) 2018-2019 Michele Morrone
				//  All rights reserved.
				//
				//  https://michelemorrone.eu - https://BrutPitt.com
				//
				//  me@michelemorrone.eu - brutpitt@gmail.com
				//  twitter: @BrutPitt - github: BrutPitt
				//
				//  https://github.com/BrutPitt/glslSmartDeNoise/
				//
				//  This software is distributed under the terms of the BSD 2-Clause license
				//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

				uniform sampler2D map;

				uniform float sigma;
				uniform float threshold;
				uniform float kSigma;
				uniform float opacity;

				varying vec2 vUv;

				#define INV_SQRT_OF_2PI 0.39894228040143267793994605993439
				#define INV_PI 0.31830988618379067153776752674503

				// Parameters:
				//	 sampler2D tex	 - sampler image / texture
				//	 vec2 uv		   - actual fragment coord
				//	 float sigma  >  0 - sigma Standard Deviation
				//	 float kSigma >= 0 - sigma coefficient
				//		 kSigma * sigma  -->  radius of the circular kernel
				//	 float threshold   - edge sharpening threshold
				vec4 smartDeNoise( sampler2D tex, vec2 uv, float sigma, float kSigma, float threshold ) {

					float radius = round( kSigma * sigma );
					float radQ = radius * radius;

					float invSigmaQx2 = 0.5 / ( sigma * sigma );
					float invSigmaQx2PI = INV_PI * invSigmaQx2;

					float invThresholdSqx2 = 0.5 / ( threshold * threshold );
					float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;

					vec4 centrPx = texture2D( tex, uv );
					centrPx.rgb *= centrPx.a;

					float zBuff = 0.0;
					vec4 aBuff = vec4( 0.0 );
					vec2 size = vec2( textureSize( tex, 0 ) );

					vec2 d;
					for ( d.x = - radius; d.x <= radius; d.x ++ ) {

						float pt = sqrt( radQ - d.x * d.x );

						for ( d.y = - pt; d.y <= pt; d.y ++ ) {

							float blurFactor = exp( - dot( d, d ) * invSigmaQx2 ) * invSigmaQx2PI;

							vec4 walkPx = texture2D( tex, uv + d / size );
							walkPx.rgb *= walkPx.a;

							vec4 dC = walkPx - centrPx;
							float deltaFactor = exp( - dot( dC.rgba, dC.rgba ) * invThresholdSqx2 ) * invThresholdSqrt2PI * blurFactor;

							zBuff += deltaFactor;
							aBuff += deltaFactor * walkPx;

						}

					}

					return aBuff / zBuff;

				}

				void main() {

					gl_FragColor = smartDeNoise( map, vec2( vUv.x, vUv.y ), sigma, kSigma, threshold );
					#include <tonemapping_fragment>
					#include <colorspace_fragment>
					#include <premultiplied_alpha_fragment>

					gl_FragColor.a *= opacity;

				}

			`}),this.setValues(e)}}const jr=[{id:"720p",label:"HD 720p (1280×720) - Rapide ⚡",width:1280,height:720},{id:"fit",label:"Taille Écran",width:0,height:0},{id:"1080p",label:"Full HD (1920×1080)",width:1920,height:1080},{id:"2k",label:"2K QHD (2560×1440)",width:2560,height:1440},{id:"square",label:"Carré 1:1 (1080×1080)",width:1080,height:1080},{id:"portrait",label:"Portrait 9:16 (720×1280)",width:720,height:1280}];function Go({gl:s,scene:e,camera:t,onClose:r}){const n=z.useRef(null),a=z.useRef(null),i=z.useRef(null),l=z.useRef(null),c=z.useRef(null),h=z.useRef(null),f=z.useRef(new Map),u=z.useRef([]),o=z.useRef(null),m=z.useRef(null),v=z.useRef(!0),y=z.useRef(void 0),[d,p]=z.useState("split"),[g,x]=z.useState(50),[w,b]=z.useState(!1),[S,R]=z.useState(null),[M,I]=z.useState("720p"),[P,F]=z.useState(!0),[A,D]=z.useState(40),[E,L]=z.useState(2),[W,ce]=z.useState(1),[X,me]=z.useState(!1),[Ie,Ne]=z.useState(350),[pt,gs]=z.useState(2.8),[Pt,ze]=z.useState(0),[Yi,Xi]=z.useState(!1),[Qi,ri]=z.useState(!0),[si,ni]=z.useState(null),[vs,ai]=z.useState(0),[xs,Ki]=z.useState(0),[oi,Zi]=z.useState(!1),[li,Ji]=z.useState({x:0,y:0,visible:!1});z.useEffect(()=>{const T=k=>{k.key==="Escape"||k.key==="F10"?(k.preventDefault(),r()):(k.key===" "||k.code==="Space")&&k.target.tagName!=="INPUT"&&k.target.tagName!=="BUTTON"&&(k.preventDefault(),p(N=>N==="split"?"raster":N==="raster"?"raytracing":"split"))};return window.addEventListener("keydown",T),()=>window.removeEventListener("keydown",T)},[r]),z.useEffect(()=>{const T=()=>b(!1);return window.addEventListener("mouseup",T),window.addEventListener("touchend",T),()=>{window.removeEventListener("mouseup",T),window.removeEventListener("touchend",T)}},[]),z.useEffect(()=>{try{const T=new lr;T.setFromCamera(new Z(0,0),t),T.layers.mask=t.layers.mask;const k=T.intersectObjects(e.children,!0);k.length>0&&Ne(Math.round(k[0].distance))}catch{}},[e,t]);const er=z.useCallback(()=>{const T=[],k=new Map;e.updateMatrixWorld(!0),e.traverse(C=>{var O;(O=C.userData)!=null&&O.itemName&&(C.userData.itemName.startsWith("Personnage")||C.userData.itemName.startsWith("PNJ"))&&(C.visible=!0)}),e.traverse(C=>{var Oe,V,Y,Se;const O=(C.name||"").toLowerCase();if((Oe=C.userData)!=null&&Oe.isHoverProxy||O.includes("hoverproxy")||O.includes("hitbox")){C.visible&&(C.visible=!1,T.push(C));return}if((C.layers.mask&1<<cr)!==0||(C.layers.mask&1<<ur)!==0)return;if(O.includes("skysphere")||O.includes("skydome")||O.includes("spacebackdrop")||O.includes("sunsphere")||C.userData&&C.userData.isSky){C.traverse(H=>{H.visible&&(H.visible=!1,T.push(H))});return}if(C.isPoints||C.isLine||C.isLineSegments||C.isSprite){C.visible&&(C.visible=!1,T.push(C));return}if((C.type.includes("Helper")||C.isSkeletonHelper||O.includes("helper")||O.includes("gizmo")||O.includes("grid")||O.includes("landingstrip")||O.includes("collision")||O.includes("aizone")||O.includes("hoveroverlay")||O.includes("edgehover")||O.includes("measurement")||O.includes("skeletonhelper"))&&C.visible){C.traverse(H=>{H.visible&&(H.visible=!1,T.push(H))});return}if(C.isLight){const H=C;if((!H.color||typeof H.color.r!="number")&&(H.color=new we(16777215)),C.isDirectionalLight){const Le=C;Le.updateMatrixWorld(!0),Le.target&&Le.target.updateMatrixWorld(!0)}}if(C.isMesh){const H=C;if(!(O.includes("frame")||O.includes("cadre")||C.parent&&((C.parent.name||"").toLowerCase().includes("frame")||(C.parent.name||"").toLowerCase().includes("cadre")))&&(C.type==="Reflector"||typeof C.getRenderTarget=="function"||C.isReflector||((V=H.material)==null?void 0:V.name)==="ReflectorShader"||((Y=H.material)==null?void 0:Y.uniforms)&&"textureMatrix"in H.material.uniforms)){k.set(H,H.material),H.material=new Qe({color:16777215,roughness:0,metalness:1,side:Hi});return}if(!H.geometry||!((Se=H.geometry.attributes)!=null&&Se.position)||H.geometry.attributes.position.count===0){H.visible&&(C.visible=!1,T.push(C));return}if(!H.material){k.set(H,H.material),H.material=new Qe({color:13421772,roughness:.5});return}const Ye=Array.isArray(H.material),gt=Ye?H.material:[H.material];let He=!1;const Ue=gt.map(U=>U?U.visible===!1||U.opacity===0?(He=!0,new Qe({transparent:!0,opacity:0,roughness:1,depthWrite:!1})):!U.color||typeof U.color.r!="number"?(He=!0,new Qe({color:13684944,roughness:.5,metalness:.1})):U.type==="MeshBasicMaterial"&&!U.isMeshStandardMaterial?(He=!0,new Qe({color:U.color,map:U.map??null,transparent:U.transparent,opacity:U.opacity,roughness:.8,metalness:.1})):("emissive"in U&&(!U.emissive||typeof U.emissive.r!="number")&&(U.emissive=new we(0)),"sheenColor"in U&&(!U.sheenColor||typeof U.sheenColor.r!="number")&&(U.sheenColor=new we(0)),"specularColor"in U&&(!U.specularColor||typeof U.specularColor.r!="number")&&(U.specularColor=new we(16777215)),"attenuationColor"in U&&(!U.attenuationColor||typeof U.attenuationColor.r!="number")&&(U.attenuationColor=new we(16777215)),U):(He=!0,new Qe({color:13684944,roughness:.5})));He&&(k.set(H,H.material),H.material=Ye?Ue:Ue[0])}}),y.current=e.background;const N=Us()||(e.environment&&e.environment.isDataTexture?e.environment:null);N&&(e.background=N,e.environment=N,"backgroundIntensity"in e&&"environmentIntensity"in e&&(e.backgroundIntensity=e.environmentIntensity)),u.current=T,f.current=k},[e]),tr=z.useCallback(()=>{u.current.forEach(T=>{T.visible=!0}),u.current=[],f.current.forEach((T,k)=>{k.material=T}),f.current.clear(),y.current!==void 0&&(e.background=y.current,y.current=void 0),e.traverse(T=>{var k;if(T.isMesh){const N=T.geometry;if(N&&N.boundsTree){try{(k=N.disposeBoundsTree)==null||k.call(N)}catch{}delete N.boundsTree}}})},[e]),ir=z.useCallback(()=>{if(!n.current)return{width:1280,height:720};const T=n.current.getBoundingClientRect(),k=Math.max(300,T.width-40),N=Math.max(200,T.height-40),C=jr.find(O=>O.id===M);return!C||C.id==="fit"?{width:Math.round(k),height:Math.round(N)}:{width:C.width,height:C.height,realWidth:C.width,realHeight:C.height}},[M]);z.useEffect(()=>{const T=s.domElement;if(!T)return;const k=T.parentElement,N={width:T.style.width,height:T.style.height,position:T.style.position,top:T.style.top,left:T.style.left,display:T.style.display,maxWidth:T.style.maxWidth,maxHeight:T.style.maxHeight,objectFit:T.style.objectFit,cursor:T.style.cursor,pointerEvents:T.style.pointerEvents},C=new Z;s.getSize(C);const O=s.getPixelRatio(),pe=s.toneMappingExposure;a.current&&k&&(a.current.insertBefore(T,a.current.firstChild),T.style.display="block",T.style.position="relative",T.style.maxWidth="100%",T.style.maxHeight="calc(100vh - 180px)",T.style.objectFit="contain",T.style.cursor=X?"crosshair":"default");const{width:se,height:Oe}=ir();s.setPixelRatio(1),s.setSize(se,Oe,!1),s.toneMapping=Ws,s.toneMappingExposure=W,l.current=s;const V=new ms(t.fov,se/Oe,t.near,t.far);V.position.copy(t.position),V.quaternion.copy(t.quaternion),V.focusDistance=Ie,V.fStop=pt,V.bokehSize=X?V.getFocalLength()/V.fStop:0,V.updateProjectionMatrix(),V.updateMatrixWorld(),V.layers.mask=t.layers.mask,V.layers.enable(Vs),V.layers.enable(js),V.layers.enable(qs),V.layers.enable(Gs),V.layers.enable($s),V.layers.enable(cr),V.layers.enable(Ys),V.layers.enable(ur),V.layers.enable(Xs),c.current=V,e.updateMatrixWorld(!0);try{s.render(e,V);const ne=T.toDataURL("image/png");R(ne)}catch(ne){console.warn("[Raytracing] Impossible de capturer le snapshot 3D standard:",ne)}er(),ri(!0),ni(null),ze(0),ai(0);const Y=new Vo(s);Y.bounces=E,Y.transmissiveBounces=E,Y.filterGlossyFactor=.5,Y.renderToCanvas=!0,Y.fadeDuration=0,Y.minSamples=1,Y.renderDelay=0,Y.dynamicLowRes=!0,Y.lowResScale=.25,se>1920?Y.tiles.set(2,2):Y.tiles.set(1,1),Y.textureSize.set(1024,1024);const Se=new jo;Se.uniforms.sigma.value=4,Se.uniforms.threshold.value=.05,Se.uniforms.kSigma.value=1;const H=new $e(Se);m.current=Se,o.current=H,Y.renderToCanvasCallback=(ne,ae,Xe)=>{v.current&&m.current&&o.current?(m.current.uniforms.map.value=ne.texture,ae.setRenderTarget(null),o.current.render(ae)):Xe.render(ae)};let Le=!1;const nr=setTimeout(()=>{if(!Le)try{console.log("[Raytracing] Construction du BVH pour la scène..."),Y.setScene(e,V),i.current=Y,ri(!1),console.log("[Raytracing] Scène prête ! Démarrage de l'accumulation.")}catch(ne){console.error("[Raytracing] Erreur initialisation WebGLPathTracer:",ne),ni((ne==null?void 0:ne.message)||"Échec de la génération du maillage BVH."),ri(!1)}},60);let Ye=performance.now(),gt=0,He=performance.now(),Ue=0;const U=()=>{if(i.current&&!Yi){const ne=i.current.samples;if(ne<A){try{i.current.renderSample(),gt++}catch(Xe){console.error("[Raytracing] Erreur renderSample:",Xe),ni((Xe==null?void 0:Xe.message)||"Erreur pendant le calcul du raytracing."),Xi(!0);return}const ae=performance.now();ae-Ue>=120&&(ze(ne),Ue=ae),ae-Ye>=1e3&&(Ki(Math.round(gt*1e3/(ae-Ye))),gt=0,Ye=ae,ai(Math.round((ae-He)/1e3)))}else{const ae=performance.now();ae-Ue>=250&&(ze(A),Ki(0),Ue=ae)}}h.current=requestAnimationFrame(U)};return h.current=requestAnimationFrame(U),()=>{Le=!0,clearTimeout(nr),h.current&&cancelAnimationFrame(h.current),tr();try{H.dispose(),Se.dispose(),Y.dispose()}catch{}o.current=null,m.current=null,i.current=null,l.current=null,k&&(k.appendChild(T),T.style.width=N.width,T.style.height=N.height,T.style.position=N.position,T.style.top=N.top,T.style.left=N.left,T.style.display=N.display,T.style.maxWidth=N.maxWidth,T.style.maxHeight=N.maxHeight,T.style.objectFit=N.objectFit,T.style.cursor=N.cursor,T.style.pointerEvents=N.pointerEvents),s.setPixelRatio(O),s.setSize(C.x,C.y),s.toneMappingExposure=pe}},[s,e,t,M,er,tr,ir]),z.useEffect(()=>{if(v.current=P,i.current&&l.current&&i.current.samples>0){const T=i.current,k=l.current;P&&m.current&&o.current?(m.current.uniforms.map.value=T.target.texture,k.setRenderTarget(null),o.current.render(k)):(k.setRenderTarget(null),T._quad.material.map=T.target.texture,T._quad.render(k))}},[P]),z.useEffect(()=>{if(!c.current||!i.current)return;const T=c.current;T.focusDistance=Ie,T.fStop=pt,T.bokehSize=X?T.getFocalLength()/T.fStop:0,T.updateProjectionMatrix(),T.updateMatrixWorld(),i.current.updateCamera(),ze(0)},[X,Ie,pt]),z.useEffect(()=>{var T;l.current&&(l.current.toneMappingExposure=W,(T=i.current)==null||T.reset(),ze(0))},[W]),z.useEffect(()=>{i.current&&(i.current.bounces=E,i.current.transmissiveBounces=E,i.current.reset(),ze(0))},[E]);const ys=T=>{const k=s.domElement;if(!k)return;const N=k.getBoundingClientRect(),C=(T.clientX-N.left)/N.width*2-1,O=-((T.clientY-N.top)/N.height*2-1),pe=new lr;pe.setFromCamera(new Z(C,O),t),c.current&&(pe.layers.mask=c.current.layers.mask);const se=pe.intersectObjects(e.children,!0);if(se.length>0){const Oe=Math.round(se[0].distance);Ne(Oe),me(!0),Ji({x:T.clientX-N.left,y:T.clientY-N.top,visible:!0}),setTimeout(()=>{Ji(V=>({...V,visible:!1}))},700)}},rr=T=>{const k=s.domElement;if(k){if(d==="raster"&&S){const N=new Image;N.onload=()=>{const C=document.createElement("canvas");C.width=k.width,C.height=k.height;const O=C.getContext("2d");O&&O.drawImage(N,0,0,C.width,C.height),C.toBlob(T,"image/png")},N.src=S;return}if(d==="split"&&S){const N=new Image;N.onload=()=>{const C=document.createElement("canvas");C.width=k.width,C.height=k.height;const O=C.getContext("2d");if(O){O.drawImage(k,0,0);const pe=Math.round(g/100*C.width);O.save(),O.beginPath(),O.rect(0,0,pe,C.height),O.clip(),O.drawImage(N,0,0,C.width,C.height),O.restore(),O.fillStyle="#ffffff",O.fillRect(pe-1,0,3,C.height)}C.toBlob(T,"image/png")},N.src=S;return}k.toBlob(T,"image/png")}},bs=()=>{rr(T=>{if(!T)return;const k=URL.createObjectURL(T),C=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),pe=`${d==="raster"?"photo-3d-standard":d==="split"?"photo-comparatif":"photo-raytracing"}-${C}.png`,se=document.createElement("a");se.href=k,se.download=pe,document.body.appendChild(se),se.click(),document.body.removeChild(se),URL.revokeObjectURL(k)})},ws=async()=>{rr(async T=>{if(T)try{await navigator.clipboard.write([new ClipboardItem({"image/png":T})]),Zi(!0),setTimeout(()=>Zi(!1),2500)}catch(k){console.warn("Presse-papier non supporté pour les blobs:",k)}})},ci=()=>{var T;(T=i.current)==null||T.reset(),ze(0),ai(0)},Ts=T=>{var C;if(F(T),!i.current||!l.current||i.current.samples===0)return;const k=i.current,N=l.current;T&&m.current&&o.current?(m.current.uniforms.map.value=k.target.texture,N.setRenderTarget(null),o.current.render(N)):(C=k._quad)==null||C.render(N)},Ss=Math.min(100,Math.round(Pt/A*100)),sr=Pt>=A;return _.jsxs("div",{className:"position-fixed top-0 start-0 w-100 h-100 d-flex flex-column text-white",style:{zIndex:1e4,backgroundColor:"rgba(5, 7, 15, 0.88)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"},children:[_.jsxs("div",{className:"d-flex align-items-center justify-content-between px-3 py-2 border-bottom",style:{borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(0, 0, 0, 0.4)"},children:[_.jsxs("div",{className:"d-flex align-items-center gap-2",children:[_.jsx("span",{className:"fs-5",children:"📸"}),_.jsxs("div",{children:[_.jsxs("h6",{className:"mb-0 fw-bold text-uppercase d-flex align-items-center gap-2",style:{letterSpacing:"0.08em"},children:["Mode Photo Raytracing Ultra-Réaliste",_.jsx("span",{className:"badge bg-warning text-dark font-monospace fw-bold",style:{fontSize:"10px"},children:"GPU Path Tracing"})]}),_.jsx("small",{className:"text-white-50",style:{fontSize:"11px"},children:"Illumination globale physique • Rebonds de lumière • Profondeur de champ Bokeh"})]})]}),_.jsxs("div",{className:"btn-group btn-group-sm shadow-sm",role:"group",children:[_.jsx("button",{type:"button",onClick:()=>p("raster"),className:`btn ${d==="raster"?"btn-primary fw-bold":"btn-outline-light text-white-50"}`,style:{fontSize:"11px"},title:"Afficher le rendu 3D standard temps réel (Touche Espace pour basculer)",children:"🎮 3D Standard"}),_.jsx("button",{type:"button",onClick:()=>p("split"),className:`btn ${d==="split"?"btn-warning text-dark fw-bold":"btn-outline-light text-white-50"}`,style:{fontSize:"11px"},title:"Comparer les deux rendus côte à côte avec le séparateur (Touche Espace)",children:"◧ Comparer (Split)"}),_.jsx("button",{type:"button",onClick:()=>p("raytracing"),className:`btn ${d==="raytracing"?"btn-info text-dark fw-bold":"btn-outline-light text-white-50"}`,style:{fontSize:"11px"},title:"Afficher uniquement le rendu Raytracing physique (Touche Espace)",children:"📸 Raytracing"})]}),_.jsxs("div",{className:"d-flex align-items-center gap-2",children:[_.jsxs("button",{onClick:ci,className:"btn btn-sm btn-outline-light d-flex align-items-center gap-1.5",title:"Réinitialiser l'accumulation des rayons",children:["🔄 ",_.jsx("span",{children:"Relancer"})]}),_.jsxs("button",{onClick:r,className:"btn btn-sm btn-danger px-3 fw-bold d-flex align-items-center gap-1",title:"Fermer (Échap)",children:["✕ ",_.jsx("span",{children:"Quitter"})]})]})]}),_.jsxs("div",{className:"d-flex flex-grow-1 overflow-hidden",children:[_.jsx("div",{ref:n,className:"flex-grow-1 d-flex flex-column align-items-center justify-content-center p-3 position-relative overflow-hidden",style:{background:"radial-gradient(circle at center, #111528 0%, #05070f 100%)"},children:_.jsxs("div",{ref:a,className:"position-relative shadow-lg border border-secondary border-opacity-25 rounded overflow-hidden",style:{userSelect:"none",cursor:X?"crosshair":"default"},onClick:ys,title:X?"Cliquez sur n'importe quel point pour ajuster l'autofocus 🎯":void 0,onMouseMove:T=>{if(w&&a.current){const k=a.current.getBoundingClientRect(),N=Math.max(0,Math.min(100,Math.round((T.clientX-k.left)/k.width*100)));x(N)}},onTouchMove:T=>{if(w&&a.current&&T.touches.length>0){const k=a.current.getBoundingClientRect(),N=Math.max(0,Math.min(100,Math.round((T.touches[0].clientX-k.left)/k.width*100)));x(N)}},children:[S&&d!=="raytracing"&&_.jsx("div",{className:"position-absolute top-0 start-0 w-100 h-100 pointer-events-none overflow-hidden",style:{clipPath:d==="raster"?"none":`polygon(0 0, ${g}% 0, ${g}% 100%, 0 100%)`,WebkitClipPath:d==="raster"?"none":`polygon(0 0, ${g}% 0, ${g}% 100%, 0 100%)`,zIndex:2},children:_.jsx("img",{src:S,alt:"Rendu 3D Standard",style:{width:"100%",height:"100%",objectFit:"contain",display:"block"}})}),S&&d==="split"&&_.jsx("div",{className:"position-absolute top-0 bottom-0",style:{left:`${g}%`,width:"4px",backgroundColor:"#ffffff",boxShadow:"0 0 10px rgba(0,0,0,0.85), 0 0 3px #ffffff",cursor:"ew-resize",transform:"translateX(-50%)",zIndex:5},onMouseDown:T=>{T.preventDefault(),b(!0)},onTouchStart:()=>b(!0),children:_.jsx("div",{className:"position-absolute top-50 start-50 translate-middle badge bg-dark text-white border border-light rounded-pill shadow d-flex align-items-center justify-content-center",style:{width:"32px",height:"32px",fontSize:"13px",cursor:"ew-resize",userSelect:"none"},title:"Glissez horizontalement pour comparer",children:"↔"})}),S&&d==="split"&&_.jsxs(_.Fragment,{children:[_.jsx("div",{className:"position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-white border-opacity-25 pointer-events-none",style:{fontSize:"10px",zIndex:6},children:"🎮 3D Standard"}),_.jsx("div",{className:"position-absolute top-0 end-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-warning border-opacity-25 text-warning pointer-events-none",style:{fontSize:"10px",zIndex:6},children:"📸 Raytracing"})]}),Qi&&_.jsxs("div",{className:"position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center",style:{background:"rgba(5, 7, 15, 0.94)",zIndex:10},children:[_.jsx("div",{className:"spinner-border text-warning mb-3",role:"status",style:{width:"3rem",height:"3rem"}}),_.jsx("h5",{className:"fw-bold",children:"Génération du maillage BVH spatial…"}),_.jsx("p",{className:"text-white-50 small mb-0",children:"Préparation des géométries et des textures physiques"})]}),si&&_.jsxs("div",{className:"position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center",style:{background:"rgba(25, 5, 5, 0.95)",zIndex:11},children:[_.jsx("div",{className:"fs-1 mb-2",children:"⚠️"}),_.jsx("h5",{className:"fw-bold text-danger",children:"Erreur Raytracing"}),_.jsx("p",{className:"text-white-50 small mb-3",children:si}),_.jsx("button",{onClick:ci,className:"btn btn-warning btn-sm",children:"Réessayer"})]}),li.visible&&_.jsx("div",{className:"position-absolute border border-warning rounded-circle",style:{left:li.x-20,top:li.y-20,width:40,height:40,pointerEvents:"none",animation:"pulse 0.6s ease-out",boxShadow:"0 0 10px rgba(255, 193, 7, 0.8)",zIndex:10}}),!Qi&&!si&&_.jsxs("div",{className:"position-absolute bottom-0 start-0 w-100 p-2 d-flex align-items-center justify-content-between text-white",style:{background:"linear-gradient(to top, rgba(0,0,0,0.85), transparent)",fontSize:"12px",pointerEvents:"none",zIndex:10},children:[_.jsxs("div",{className:"d-flex align-items-center gap-2",children:[_.jsx("span",{className:`badge ${sr?"bg-success":"bg-primary"}`,children:sr?"✓ Rendu terminé":"⚡ Calcul en cours…"}),_.jsxs("span",{children:["Échantillon : ",_.jsx("strong",{children:Pt})," / ",A," (",Ss,"%)"]})]}),_.jsxs("div",{className:"d-flex align-items-center gap-3 text-white-50",children:[_.jsxs("span",{children:["Temps : ",vs,"s"]}),_.jsxs("span",{children:["Cadence : ",xs," éch/s"]})]})]})]})}),_.jsxs("div",{className:"border-start p-3 d-flex flex-column gap-3 overflow-auto",style:{width:"320px",borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(10, 14, 25, 0.75)",scrollbarWidth:"thin"},children:[_.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[_.jsxs("h6",{className:"fw-bold mb-2 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[_.jsx("span",{children:"⚙️"})," Qualité du Raytracing"]}),_.jsxs("div",{className:"mb-2",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Échantillons cibles (Samples)"}),_.jsx("span",{className:"fw-bold text-info",children:A})]}),_.jsx("div",{className:"btn-group btn-group-sm w-100 mb-2",children:[40,100,250,500].map(T=>_.jsx("button",{type:"button",onClick:()=>{D(T),Pt>=T&&ci()},className:`btn ${A===T?"btn-primary":"btn-outline-secondary text-white"}`,style:{fontSize:"10px"},children:T},T))})]}),_.jsxs("div",{className:"mb-2",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Rebonds de lumière (Bounces)"}),_.jsx("span",{className:"fw-bold text-info",children:E})]}),_.jsx("input",{type:"range",className:"form-range form-range-sm",min:"1",max:"12",step:"1",value:E,onChange:T=>L(parseInt(T.target.value,10))})]}),_.jsxs("div",{className:"mb-1",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Exposition lumineuse"}),_.jsx("span",{className:"fw-bold text-info",children:W.toFixed(2)})]}),_.jsx("input",{type:"range",className:"form-range form-range-sm",min:"0.4",max:"2.2",step:"0.05",value:W,onChange:T=>ce(parseFloat(T.target.value))})]}),_.jsxs("div",{className:"d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10",children:[_.jsxs("label",{className:"form-check-label d-flex align-items-center gap-1.5 mb-0",style:{fontSize:"11px"},children:[_.jsx("span",{children:"✨"}),_.jsx("span",{children:"Débruiteur Intelligent"})]}),_.jsx("div",{className:"form-check form-switch mb-0",children:_.jsx("input",{className:"form-check-input",type:"checkbox",role:"switch",checked:P,onChange:T=>Ts(T.target.checked)})})]})]}),_.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[_.jsxs("div",{className:"d-flex align-items-center justify-content-between mb-2",children:[_.jsxs("h6",{className:"fw-bold mb-0 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[_.jsx("span",{children:"🎯"})," Flou Bokeh / Profondeur"]}),_.jsx("div",{className:"form-check form-switch mb-0",children:_.jsx("input",{className:"form-check-input",type:"checkbox",role:"switch",checked:X,onChange:T=>me(T.target.checked)})})]}),X?_.jsxs(_.Fragment,{children:[_.jsxs("p",{className:"text-white-50 mb-2",style:{fontSize:"10px"},children:["💡 ",_.jsx("em",{children:"Cliquez sur le modèle ou un objet dans l'image pour régler l'autofocus instantanément !"})]}),_.jsxs("div",{className:"mb-2",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Distance de mise au point"}),_.jsxs("span",{className:"fw-bold text-info",children:[Ie," cm"]})]}),_.jsx("input",{type:"range",className:"form-range form-range-sm",min:"50",max:"1500",step:"5",value:Ie,onChange:T=>Ne(parseInt(T.target.value,10))})]}),_.jsxs("div",{className:"mb-1",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Ouverture optique (f-stop)"}),_.jsxs("span",{className:"fw-bold text-info",children:["f/",pt]})]}),_.jsx("div",{className:"btn-group btn-group-sm w-100",children:[1.4,2,2.8,5.6].map(T=>_.jsxs("button",{type:"button",onClick:()=>gs(T),className:`btn ${pt===T?"btn-warning text-dark fw-bold":"btn-outline-secondary text-white"}`,style:{fontSize:"10px"},children:["f/",T]},T))})]})]}):_.jsx("small",{className:"text-white-50",style:{fontSize:"10px"},children:"Activez l'effet pour créer un arrière-plan flou d'appareil photo professionnel reflex."})]}),_.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[_.jsxs("h6",{className:"fw-bold mb-2 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[_.jsx("span",{children:"📐"})," Format & Résolution"]}),_.jsx("select",{className:"form-select form-select-sm bg-dark text-white border-secondary",style:{fontSize:"11px"},value:M,onChange:T=>I(T.target.value),children:jr.map(T=>_.jsx("option",{value:T.id,children:T.label},T.id))})]}),_.jsxs("div",{className:"mt-auto d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25",children:[_.jsxs("button",{onClick:bs,className:"btn btn-success fw-bold py-2 shadow d-flex align-items-center justify-content-center gap-2",title:"Télécharger l'image PNG",children:[_.jsx("span",{children:"💾"}),_.jsx("span",{children:"Télécharger la photo PNG"})]}),_.jsxs("button",{onClick:ws,className:`btn btn-sm ${oi?"btn-info text-dark":"btn-outline-light"} py-1.5 d-flex align-items-center justify-content-center gap-2`,title:"Copier l'image dans le presse-papier",children:[_.jsx("span",{children:oi?"✓":"📋"}),_.jsx("span",{children:oi?"Copié dans le presse-papier !":"Copier l'image"})]}),_.jsx("button",{onClick:()=>Xi(T=>!T),className:"btn btn-sm btn-outline-secondary text-white py-1",children:Yi?"▶ Reprendre le rendu":"⏸ Suspendre le rendu"})]})]})]}),_.jsxs("div",{className:"px-3 py-1.5 border-top d-flex align-items-center justify-content-between",style:{borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(0, 0, 0, 0.5)",fontSize:"11px"},children:[_.jsxs("div",{className:"d-flex align-items-center gap-3",children:[_.jsxs("span",{children:[_.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"Espace"})," Alterner 3D / Split / Raytracing"]}),_.jsx("span",{className:"text-white-50",children:"•"}),_.jsxs("span",{children:[_.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"F10"})," Basculer mode photo"]}),_.jsx("span",{className:"text-white-50",children:"•"}),_.jsxs("span",{className:"text-white-50",children:["Fermer avec ",_.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"Échap"})]})]}),_.jsxs("div",{className:"text-white-50",children:["Moteur : ",_.jsx("strong",{children:"three-gpu-pathtracer"})," (GGX / PBR / MIS / BVH)"]})]})]})}export{Go as RaytracingPhotoModal};
