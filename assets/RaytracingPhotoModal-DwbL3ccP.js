import{bk as oe,V as D,bl as _e,P as Ir,i as J,bm as dt,aX as rs,bn as Z,f as we,B as Cr,D as Ii,bo as mi,bp as gt,bq as ue,br as G,bs as Zt,bt as Q,bu as pi,bv as ss,bw as qi,bx as ns,by as X,bz as gi,bA as Pr,bB as as,bC as Fr,bD as Vt,l as Oe,bE as os,bF as st,bG as cs,bH as Dr,bI as ls,F as ji,S as jt,bJ as yt,bK as vt,bL as Er,bM as Se,bN as ye,bO as pe,bP as Pe,bQ as De,bR as us,bS as fs,bT as hs,bU as ds,C as be,bV as ms,bW as Br,bX as kr,bY as ps,bZ as gs,b_ as vs,b$ as xs,c0 as ys,r as L,c1 as Gi,h as We,c2 as $i,c3 as bs,c4 as ws,c5 as Ts,c6 as Ss,c7 as _s,c8 as As,c9 as Rs,ca as Ms,cb as Is,cc as Cs,j as _}from"./inventory-CWPuwBCN.js";const Nr=0,Ps=1,zr=2,Yi=2,Jt=1.25,Xi=1,Fe=6*4+4+4,Gt=65535,Fs=Math.pow(2,-24),ei=Symbol("SKIP_GENERATION");function Or(s){return s.index?s.index.count:s.attributes.position.count}function at(s){return Or(s)/3}function Lr(s,e=ArrayBuffer){return s>65535?new Uint32Array(new e(4*s)):new Uint16Array(new e(2*s))}function Ds(s,e){if(!s.index){const t=s.attributes.position.count,i=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=Lr(t,i);s.setIndex(new oe(n,1));for(let a=0;a<t;a++)n[a]=a}}function Hr(s,e){const t=at(s),i=e||s.drawRange,n=i.start/3,a=(i.start+i.count)/3,r=Math.max(0,n),c=Math.min(t,a)-r;return[{offset:Math.floor(r),count:Math.floor(c)}]}function Ur(s,e){if(!s.groups||!s.groups.length)return Hr(s,e);const t=[],i=new Set,n=e||s.drawRange,a=n.start/3,r=(n.start+n.count)/3;for(const l of s.groups){const h=l.start/3,f=(l.start+l.count)/3;i.add(Math.max(a,h)),i.add(Math.min(r,f))}const c=Array.from(i.values()).sort((l,h)=>l-h);for(let l=0;l<c.length-1;l++){const h=c[l],f=c[l+1];t.push({offset:Math.floor(h),count:Math.floor(f-h)})}return t}function Es(s,e){const t=at(s),i=Ur(s,e).sort((r,c)=>r.offset-c.offset),n=i[i.length-1];n.count=Math.min(t-n.offset,n.count);let a=0;return i.forEach(({count:r})=>a+=r),t!==a}function ti(s,e,t,i,n){let a=1/0,r=1/0,c=1/0,l=-1/0,h=-1/0,f=-1/0,u=1/0,o=1/0,m=1/0,p=-1/0,y=-1/0,d=-1/0;for(let g=e*6,v=(e+t)*6;g<v;g+=6){const x=s[g+0],b=s[g+1],w=x-b,T=x+b;w<a&&(a=w),T>l&&(l=T),x<u&&(u=x),x>p&&(p=x);const S=s[g+2],A=s[g+3],M=S-A,I=S+A;M<r&&(r=M),I>h&&(h=I),S<o&&(o=S),S>y&&(y=S);const P=s[g+4],R=s[g+5],F=P-R,E=P+R;F<c&&(c=F),E>f&&(f=E),P<m&&(m=P),P>d&&(d=P)}i[0]=a,i[1]=r,i[2]=c,i[3]=l,i[4]=h,i[5]=f,n[0]=u,n[1]=o,n[2]=m,n[3]=p,n[4]=y,n[5]=d}function Bs(s,e=null,t=null,i=null){const n=s.attributes.position,a=s.index?s.index.array:null,r=at(s),c=n.normalized;let l;e===null?(l=new Float32Array(r*6*4),t=0,i=r):(l=e,t=t||0,i=i||r);const h=n.array,f=n.offset||0;let u=3;n.isInterleavedBufferAttribute&&(u=n.data.stride);const o=["getX","getY","getZ"];for(let m=t;m<t+i;m++){const p=m*3,y=m*6;let d=p+0,g=p+1,v=p+2;a&&(d=a[d],g=a[g],v=a[v]),c||(d=d*u+f,g=g*u+f,v=v*u+f);for(let x=0;x<3;x++){let b,w,T;c?(b=n[o[x]](d),w=n[o[x]](g),T=n[o[x]](v)):(b=h[d+x],w=h[g+x],T=h[v+x]);let S=b;w<S&&(S=w),T<S&&(S=T);let A=b;w>A&&(A=w),T>A&&(A=T);const M=(A-S)/2,I=x*2;l[y+I+0]=S+M,l[y+I+1]=M+(Math.abs(S)+M)*Fs}}return l}function j(s,e,t){return t.min.x=e[s],t.min.y=e[s+1],t.min.z=e[s+2],t.max.x=e[s+3],t.max.y=e[s+4],t.max.z=e[s+5],t}function Qi(s){let e=-1,t=-1/0;for(let i=0;i<3;i++){const n=s[i+3]-s[i];n>t&&(t=n,e=i)}return e}function Ki(s,e){e.set(s)}function Zi(s,e,t){let i,n;for(let a=0;a<3;a++){const r=a+3;i=s[a],n=e[a],t[a]=i<n?i:n,i=s[r],n=e[r],t[r]=i>n?i:n}}function Tt(s,e,t){for(let i=0;i<3;i++){const n=e[s+2*i],a=e[s+2*i+1],r=n-a,c=n+a;r<t[i]&&(t[i]=r),c>t[i+3]&&(t[i+3]=c)}}function ot(s){const e=s[3]-s[0],t=s[4]-s[1],i=s[5]-s[2];return 2*(e*t+t*i+i*e)}const Te=32,ks=(s,e)=>s.candidate-e.candidate,Me=new Array(Te).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),St=new Float32Array(6);function Ns(s,e,t,i,n,a){let r=-1,c=0;if(a===Nr)r=Qi(e),r!==-1&&(c=(e[r]+e[r+3])/2);else if(a===Ps)r=Qi(s),r!==-1&&(c=zs(t,i,n,r));else if(a===zr){const l=ot(s);let h=Jt*n;const f=i*6,u=(i+n)*6;for(let o=0;o<3;o++){const m=e[o],d=(e[o+3]-m)/Te;if(n<Te/4){const g=[...Me];g.length=n;let v=0;for(let b=f;b<u;b+=6,v++){const w=g[v];w.candidate=t[b+2*o],w.count=0;const{bounds:T,leftCacheBounds:S,rightCacheBounds:A}=w;for(let M=0;M<3;M++)A[M]=1/0,A[M+3]=-1/0,S[M]=1/0,S[M+3]=-1/0,T[M]=1/0,T[M+3]=-1/0;Tt(b,t,T)}g.sort(ks);let x=n;for(let b=0;b<x;b++){const w=g[b];for(;b+1<x&&g[b+1].candidate===w.candidate;)g.splice(b+1,1),x--}for(let b=f;b<u;b+=6){const w=t[b+2*o];for(let T=0;T<x;T++){const S=g[T];w>=S.candidate?Tt(b,t,S.rightCacheBounds):(Tt(b,t,S.leftCacheBounds),S.count++)}}for(let b=0;b<x;b++){const w=g[b],T=w.count,S=n-w.count,A=w.leftCacheBounds,M=w.rightCacheBounds;let I=0;T!==0&&(I=ot(A)/l);let P=0;S!==0&&(P=ot(M)/l);const R=Xi+Jt*(I*T+P*S);R<h&&(r=o,h=R,c=w.candidate)}}else{for(let x=0;x<Te;x++){const b=Me[x];b.count=0,b.candidate=m+d+x*d;const w=b.bounds;for(let T=0;T<3;T++)w[T]=1/0,w[T+3]=-1/0}for(let x=f;x<u;x+=6){let T=~~((t[x+2*o]-m)/d);T>=Te&&(T=Te-1);const S=Me[T];S.count++,Tt(x,t,S.bounds)}const g=Me[Te-1];Ki(g.bounds,g.rightCacheBounds);for(let x=Te-2;x>=0;x--){const b=Me[x],w=Me[x+1];Zi(b.bounds,w.rightCacheBounds,b.rightCacheBounds)}let v=0;for(let x=0;x<Te-1;x++){const b=Me[x],w=b.count,T=b.bounds,A=Me[x+1].rightCacheBounds;w!==0&&(v===0?Ki(T,St):Zi(T,St,St)),v+=w;let M=0,I=0;v!==0&&(M=ot(St)/l);const P=n-v;P!==0&&(I=ot(A)/l);const R=Xi+Jt*(M*v+I*P);R<h&&(r=o,h=R,c=b.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${a} used.`);return{axis:r,pos:c}}function zs(s,e,t,i){let n=0;for(let a=e,r=e+t;a<r;a++)n+=s[a*6+i*2];return n/t}class ii{constructor(){this.boundingData=new Float32Array(6)}}function Os(s,e,t,i,n,a){let r=i,c=i+n-1;const l=a.pos,h=a.axis*2;for(;;){for(;r<=c&&t[r*6+h]<l;)r++;for(;r<=c&&t[c*6+h]>=l;)c--;if(r<c){for(let f=0;f<3;f++){let u=e[r*3+f];e[r*3+f]=e[c*3+f],e[c*3+f]=u}for(let f=0;f<6;f++){let u=t[r*6+f];t[r*6+f]=t[c*6+f],t[c*6+f]=u}r++,c--}else return r}}function Ls(s,e,t,i,n,a){let r=i,c=i+n-1;const l=a.pos,h=a.axis*2;for(;;){for(;r<=c&&t[r*6+h]<l;)r++;for(;r<=c&&t[c*6+h]>=l;)c--;if(r<c){let f=s[r];s[r]=s[c],s[c]=f;for(let u=0;u<6;u++){let o=t[r*6+u];t[r*6+u]=t[c*6+u],t[c*6+u]=o}r++,c--}else return r}}function K(s,e){return e[s+15]===65535}function re(s,e){return e[s+6]}function se(s,e){return e[s+14]}function ce(s){return s+8}function ne(s,e){return e[s+6]}function Ci(s,e){return e[s+7]}let Wr,mt,Wt,Vr;const Hs=Math.pow(2,32);function vi(s){return"count"in s?1:1+vi(s.left)+vi(s.right)}function Us(s,e,t){return Wr=new Float32Array(t),mt=new Uint32Array(t),Wt=new Uint16Array(t),Vr=new Uint8Array(t),xi(s,e)}function xi(s,e){const t=s/4,i=s/2,n="count"in e,a=e.boundingData;for(let r=0;r<6;r++)Wr[t+r]=a[r];if(n)if(e.buffer){const r=e.buffer;Vr.set(new Uint8Array(r),s);for(let c=s,l=s+r.byteLength;c<l;c+=Fe){const h=c/2;K(h,Wt)||(mt[c/4+6]+=t)}return s+r.byteLength}else{const r=e.offset,c=e.count;return mt[t+6]=r,Wt[i+14]=c,Wt[i+15]=Gt,s+Fe}else{const r=e.left,c=e.right,l=e.splitAxis;let h;if(h=xi(s+Fe,r),h/4>Hs)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return mt[t+6]=h/4,h=xi(h,c),mt[t+7]=l,h}}function Ws(s,e){const t=(s.index?s.index.count:s.attributes.position.count)/3,i=t>2**16,n=i?4:2,a=e?new SharedArrayBuffer(t*n):new ArrayBuffer(t*n),r=i?new Uint32Array(a):new Uint16Array(a);for(let c=0,l=r.length;c<l;c++)r[c]=c;return r}function Vs(s,e,t,i,n){const{maxDepth:a,verbose:r,maxLeafTris:c,strategy:l,onProgress:h,indirect:f}=n,u=s._indirectBuffer,o=s.geometry,m=o.index?o.index.array:null,p=f?Ls:Os,y=at(o),d=new Float32Array(6);let g=!1;const v=new ii;return ti(e,t,i,v.boundingData,d),b(v,t,i,d),v;function x(w){h&&h(w/y)}function b(w,T,S,A=null,M=0){if(!g&&M>=a&&(g=!0,r&&(console.warn(`MeshBVH: Max depth of ${a} reached when generating BVH. Consider increasing maxDepth.`),console.warn(o))),S<=c||M>=a)return x(T+S),w.offset=T,w.count=S,w;const I=Ns(w.boundingData,A,e,T,S,l);if(I.axis===-1)return x(T+S),w.offset=T,w.count=S,w;const P=p(u,m,e,T,S,I);if(P===T||P===T+S)x(T+S),w.offset=T,w.count=S;else{w.splitAxis=I.axis;const R=new ii,F=T,E=P-T;w.left=R,ti(e,F,E,R.boundingData,d),b(R,F,E,d,M+1);const k=new ii,V=P,te=S-E;w.right=k,ti(e,V,te,k.boundingData,d),b(k,V,te,d,M+1)}return w}}function qs(s,e){const t=s.geometry;e.indirect&&(s._indirectBuffer=Ws(t,e.useSharedArrayBuffer),Es(t,e.range)&&!e.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),s._indirectBuffer||Ds(t,e);const i=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=Bs(t),a=e.indirect?Hr(t,e.range):Ur(t,e.range);s._roots=a.map(r=>{const c=Vs(s,n,r.offset,r.count,e),l=vi(c),h=new i(Fe*l);return Us(0,c,h),h})}class Ae{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let i=1/0,n=-1/0;for(let a=0,r=e.length;a<r;a++){const l=e[a][t];i=l<i?l:i,n=l>n?l:n}this.min=i,this.max=n}setFromPoints(e,t){let i=1/0,n=-1/0;for(let a=0,r=t.length;a<r;a++){const c=t[a],l=e.dot(c);i=l<i?l:i,n=l>n?l:n}this.min=i,this.max=n}isSeparated(e){return this.min>e.max||e.min>this.max}}Ae.prototype.setFromBox=function(){const s=new D;return function(t,i){const n=i.min,a=i.max;let r=1/0,c=-1/0;for(let l=0;l<=1;l++)for(let h=0;h<=1;h++)for(let f=0;f<=1;f++){s.x=n.x*l+a.x*(1-l),s.y=n.y*h+a.y*(1-h),s.z=n.z*f+a.z*(1-f);const u=t.dot(s);r=Math.min(u,r),c=Math.max(u,c)}this.min=r,this.max=c}}();const js=function(){const s=new D,e=new D,t=new D;return function(n,a,r){const c=n.start,l=s,h=a.start,f=e;t.subVectors(c,h),s.subVectors(n.end,n.start),e.subVectors(a.end,a.start);const u=t.dot(f),o=f.dot(l),m=f.dot(f),p=t.dot(l),d=l.dot(l)*m-o*o;let g,v;d!==0?g=(u*o-p*m)/d:g=0,v=(u+g*o)/m,r.x=g,r.y=v}}(),Pi=function(){const s=new J,e=new D,t=new D;return function(n,a,r,c){js(n,a,s);let l=s.x,h=s.y;if(l>=0&&l<=1&&h>=0&&h<=1){n.at(l,r),a.at(h,c);return}else if(l>=0&&l<=1){h<0?a.at(0,c):a.at(1,c),n.closestPointToPoint(c,!0,r);return}else if(h>=0&&h<=1){l<0?n.at(0,r):n.at(1,r),a.closestPointToPoint(r,!0,c);return}else{let f;l<0?f=n.start:f=n.end;let u;h<0?u=a.start:u=a.end;const o=e,m=t;if(n.closestPointToPoint(u,!0,e),a.closestPointToPoint(f,!0,t),o.distanceToSquared(u)<=m.distanceToSquared(f)){r.copy(o),c.copy(u);return}else{r.copy(f),c.copy(m);return}}}}(),Gs=function(){const s=new D,e=new D,t=new Ir,i=new _e;return function(a,r){const{radius:c,center:l}=a,{a:h,b:f,c:u}=r;if(i.start=h,i.end=f,i.closestPointToPoint(l,!0,s).distanceTo(l)<=c||(i.start=h,i.end=u,i.closestPointToPoint(l,!0,s).distanceTo(l)<=c)||(i.start=f,i.end=u,i.closestPointToPoint(l,!0,s).distanceTo(l)<=c))return!0;const y=r.getPlane(t);if(Math.abs(y.distanceToPoint(l))<=c){const g=y.projectPoint(l,e);if(r.containsPoint(g))return!0}return!1}}(),$s=1e-15;function ri(s){return Math.abs(s)<$s}class ge extends dt{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new D),this.satBounds=new Array(4).fill().map(()=>new Ae),this.points=[this.a,this.b,this.c],this.sphere=new rs,this.plane=new Ir,this.needsUpdate=!0}intersectsSphere(e){return Gs(e,this)}update(){const e=this.a,t=this.b,i=this.c,n=this.points,a=this.satAxes,r=this.satBounds,c=a[0],l=r[0];this.getNormal(c),l.setFromPoints(c,n);const h=a[1],f=r[1];h.subVectors(e,t),f.setFromPoints(h,n);const u=a[2],o=r[2];u.subVectors(t,i),o.setFromPoints(u,n);const m=a[3],p=r[3];m.subVectors(i,e),p.setFromPoints(m,n),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(c,e),this.needsUpdate=!1}}ge.prototype.closestPointToSegment=function(){const s=new D,e=new D,t=new _e;return function(n,a=null,r=null){const{start:c,end:l}=n,h=this.points;let f,u=1/0;for(let o=0;o<3;o++){const m=(o+1)%3;t.start.copy(h[o]),t.end.copy(h[m]),Pi(t,n,s,e),f=s.distanceToSquared(e),f<u&&(u=f,a&&a.copy(s),r&&r.copy(e))}return this.closestPointToPoint(c,s),f=c.distanceToSquared(s),f<u&&(u=f,a&&a.copy(s),r&&r.copy(c)),this.closestPointToPoint(l,s),f=l.distanceToSquared(s),f<u&&(u=f,a&&a.copy(s),r&&r.copy(l)),Math.sqrt(u)}}();ge.prototype.intersectsTriangle=function(){const s=new ge,e=new Array(3),t=new Array(3),i=new Ae,n=new Ae,a=new D,r=new D,c=new D,l=new D,h=new D,f=new _e,u=new _e,o=new _e,m=new D;function p(y,d,g){const v=y.points;let x=0,b=-1;for(let w=0;w<3;w++){const{start:T,end:S}=f;T.copy(v[w]),S.copy(v[(w+1)%3]),f.delta(r);const A=ri(d.distanceToPoint(T));if(ri(d.normal.dot(r))&&A){g.copy(f),x=2;break}const M=d.intersectLine(f,m);if(!M&&A&&m.copy(T),(M||A)&&!ri(m.distanceTo(S))){if(x<=1)(x===1?g.start:g.end).copy(m),A&&(b=x);else if(x>=2){(b===1?g.start:g.end).copy(m),x=2;break}if(x++,x===2&&b===-1)break}}return x}return function(d,g=null,v=!1){this.needsUpdate&&this.update(),d.isExtendedTriangle?d.needsUpdate&&d.update():(s.copy(d),s.update(),d=s);const x=this.plane,b=d.plane;if(Math.abs(x.normal.dot(b.normal))>1-1e-10){const w=this.satBounds,T=this.satAxes;t[0]=d.a,t[1]=d.b,t[2]=d.c;for(let M=0;M<4;M++){const I=w[M],P=T[M];if(i.setFromPoints(P,t),I.isSeparated(i))return!1}const S=d.satBounds,A=d.satAxes;e[0]=this.a,e[1]=this.b,e[2]=this.c;for(let M=0;M<4;M++){const I=S[M],P=A[M];if(i.setFromPoints(P,e),I.isSeparated(i))return!1}for(let M=0;M<4;M++){const I=T[M];for(let P=0;P<4;P++){const R=A[P];if(a.crossVectors(I,R),i.setFromPoints(a,e),n.setFromPoints(a,t),i.isSeparated(n))return!1}}return g&&(v||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),g.start.set(0,0,0),g.end.set(0,0,0)),!0}else{const w=p(this,b,u);if(w===1&&d.containsPoint(u.end))return g&&(g.start.copy(u.end),g.end.copy(u.end)),!0;if(w!==2)return!1;const T=p(d,x,o);if(T===1&&this.containsPoint(o.end))return g&&(g.start.copy(o.end),g.end.copy(o.end)),!0;if(T!==2)return!1;if(u.delta(c),o.delta(l),c.dot(l)<0){let F=o.start;o.start=o.end,o.end=F}const S=u.start.dot(c),A=u.end.dot(c),M=o.start.dot(c),I=o.end.dot(c),P=A<M,R=S<I;return S!==I&&M!==A&&P===R?!1:(g&&(h.subVectors(u.start,o.start),h.dot(c)>0?g.start.copy(u.start):g.start.copy(o.start),h.subVectors(u.end,o.end),h.dot(c)<0?g.end.copy(u.end):g.end.copy(o.end)),!0)}}}();ge.prototype.distanceToPoint=function(){const s=new D;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}}();ge.prototype.distanceToTriangle=function(){const s=new D,e=new D,t=["a","b","c"],i=new _e,n=new _e;return function(r,c=null,l=null){const h=c||l?i:null;if(this.intersectsTriangle(r,h))return(c||l)&&(c&&h.getCenter(c),l&&h.getCenter(l)),0;let f=1/0;for(let u=0;u<3;u++){let o;const m=t[u],p=r[m];this.closestPointToPoint(p,s),o=p.distanceToSquared(s),o<f&&(f=o,c&&c.copy(s),l&&l.copy(p));const y=this[m];r.closestPointToPoint(y,s),o=y.distanceToSquared(s),o<f&&(f=o,c&&c.copy(y),l&&l.copy(s))}for(let u=0;u<3;u++){const o=t[u],m=t[(u+1)%3];i.set(this[o],this[m]);for(let p=0;p<3;p++){const y=t[p],d=t[(p+1)%3];n.set(r[y],r[d]),Pi(i,n,s,e);const g=s.distanceToSquared(e);g<f&&(f=g,c&&c.copy(s),l&&l.copy(e))}}return Math.sqrt(f)}}();class ee{constructor(e,t,i){this.isOrientedBox=!0,this.min=new D,this.max=new D,this.matrix=new Z,this.invMatrix=new Z,this.points=new Array(8).fill().map(()=>new D),this.satAxes=new Array(3).fill().map(()=>new D),this.satBounds=new Array(3).fill().map(()=>new Ae),this.alignedSatBounds=new Array(3).fill().map(()=>new Ae),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),i&&this.matrix.copy(i)}set(e,t,i){this.min.copy(e),this.max.copy(t),this.matrix.copy(i),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}}ee.prototype.update=function(){return function(){const e=this.matrix,t=this.min,i=this.max,n=this.points;for(let h=0;h<=1;h++)for(let f=0;f<=1;f++)for(let u=0;u<=1;u++){const o=1*h|2*f|4*u,m=n[o];m.x=h?i.x:t.x,m.y=f?i.y:t.y,m.z=u?i.z:t.z,m.applyMatrix4(e)}const a=this.satBounds,r=this.satAxes,c=n[0];for(let h=0;h<3;h++){const f=r[h],u=a[h],o=1<<h,m=n[o];f.subVectors(c,m),u.setFromPoints(f,n)}const l=this.alignedSatBounds;l[0].setFromPointsField(n,"x"),l[1].setFromPointsField(n,"y"),l[2].setFromPointsField(n,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}}();ee.prototype.intersectsBox=function(){const s=new Ae;return function(t){this.needsUpdate&&this.update();const i=t.min,n=t.max,a=this.satBounds,r=this.satAxes,c=this.alignedSatBounds;if(s.min=i.x,s.max=n.x,c[0].isSeparated(s)||(s.min=i.y,s.max=n.y,c[1].isSeparated(s))||(s.min=i.z,s.max=n.z,c[2].isSeparated(s)))return!1;for(let l=0;l<3;l++){const h=r[l],f=a[l];if(s.setFromBox(h,t),f.isSeparated(s))return!1}return!0}}();ee.prototype.intersectsTriangle=function(){const s=new ge,e=new Array(3),t=new Ae,i=new Ae,n=new D;return function(r){this.needsUpdate&&this.update(),r.isExtendedTriangle?r.needsUpdate&&r.update():(s.copy(r),s.update(),r=s);const c=this.satBounds,l=this.satAxes;e[0]=r.a,e[1]=r.b,e[2]=r.c;for(let o=0;o<3;o++){const m=c[o],p=l[o];if(t.setFromPoints(p,e),m.isSeparated(t))return!1}const h=r.satBounds,f=r.satAxes,u=this.points;for(let o=0;o<3;o++){const m=h[o],p=f[o];if(t.setFromPoints(p,u),m.isSeparated(t))return!1}for(let o=0;o<3;o++){const m=l[o];for(let p=0;p<4;p++){const y=f[p];if(n.crossVectors(m,y),t.setFromPoints(n,e),i.setFromPoints(n,u),t.isSeparated(i))return!1}}return!0}}();ee.prototype.closestPointToPoint=function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}}();ee.prototype.distanceToPoint=function(){const s=new D;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}}();ee.prototype.distanceToBox=function(){const s=["x","y","z"],e=new Array(12).fill().map(()=>new _e),t=new Array(12).fill().map(()=>new _e),i=new D,n=new D;return function(r,c=0,l=null,h=null){if(this.needsUpdate&&this.update(),this.intersectsBox(r))return(l||h)&&(r.getCenter(n),this.closestPointToPoint(n,i),r.closestPointToPoint(i,n),l&&l.copy(i),h&&h.copy(n)),0;const f=c*c,u=r.min,o=r.max,m=this.points;let p=1/0;for(let d=0;d<8;d++){const g=m[d];n.copy(g).clamp(u,o);const v=g.distanceToSquared(n);if(v<p&&(p=v,l&&l.copy(g),h&&h.copy(n),v<f))return Math.sqrt(v)}let y=0;for(let d=0;d<3;d++)for(let g=0;g<=1;g++)for(let v=0;v<=1;v++){const x=(d+1)%3,b=(d+2)%3,w=g<<x|v<<b,T=1<<d|g<<x|v<<b,S=m[w],A=m[T];e[y].set(S,A);const I=s[d],P=s[x],R=s[b],F=t[y],E=F.start,k=F.end;E[I]=u[I],E[P]=g?u[P]:o[P],E[R]=v?u[R]:o[P],k[I]=o[I],k[P]=g?u[P]:o[P],k[R]=v?u[R]:o[P],y++}for(let d=0;d<=1;d++)for(let g=0;g<=1;g++)for(let v=0;v<=1;v++){n.x=d?o.x:u.x,n.y=g?o.y:u.y,n.z=v?o.z:u.z,this.closestPointToPoint(n,i);const x=n.distanceToSquared(i);if(x<p&&(p=x,l&&l.copy(i),h&&h.copy(n),x<f))return Math.sqrt(x)}for(let d=0;d<12;d++){const g=e[d];for(let v=0;v<12;v++){const x=t[v];Pi(g,x,i,n);const b=i.distanceToSquared(n);if(b<p&&(p=b,l&&l.copy(i),h&&h.copy(n),b<f))return Math.sqrt(b)}}return Math.sqrt(p)}}();class Fi{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){const e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}}class Ys extends Fi{constructor(){super(()=>new ge)}}const le=new Ys;class Xs{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;const e=[];let t=null;this.setBuffer=i=>{t&&e.push(t),t=i,this.float32Array=new Float32Array(i),this.uint16Array=new Uint16Array(i),this.uint32Array=new Uint32Array(i)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}}const q=new Xs;let Ce,rt;const Ve=[],_t=new Fi(()=>new we);function Qs(s,e,t,i,n,a){Ce=_t.getPrimitive(),rt=_t.getPrimitive(),Ve.push(Ce,rt),q.setBuffer(s._roots[e]);const r=yi(0,s.geometry,t,i,n,a);q.clearBuffer(),_t.releasePrimitive(Ce),_t.releasePrimitive(rt),Ve.pop(),Ve.pop();const c=Ve.length;return c>0&&(rt=Ve[c-1],Ce=Ve[c-2]),r}function yi(s,e,t,i,n=null,a=0,r=0){const{float32Array:c,uint16Array:l,uint32Array:h}=q;let f=s*2;if(K(f,l)){const o=re(s,h),m=se(f,l);return j(s,c,Ce),i(o,m,!1,r,a+s,Ce)}else{let I=function(R){const{uint16Array:F,uint32Array:E}=q;let k=R*2;for(;!K(k,F);)R=ce(R),k=R*2;return re(R,E)},P=function(R){const{uint16Array:F,uint32Array:E}=q;let k=R*2;for(;!K(k,F);)R=ne(R,E),k=R*2;return re(R,E)+se(k,F)};const o=ce(s),m=ne(s,h);let p=o,y=m,d,g,v,x;if(n&&(v=Ce,x=rt,j(p,c,v),j(y,c,x),d=n(v),g=n(x),g<d)){p=m,y=o;const R=d;d=g,g=R,v=x}v||(v=Ce,j(p,c,v));const b=K(p*2,l),w=t(v,b,d,r+1,a+p);let T;if(w===Yi){const R=I(p),E=P(p)-R;T=i(R,E,!0,r+1,a+p,v)}else T=w&&yi(p,e,t,i,n,a,r+1);if(T)return!0;x=rt,j(y,c,x);const S=K(y*2,l),A=t(x,S,g,r+1,a+y);let M;if(A===Yi){const R=I(y),E=P(y)-R;M=i(R,E,!0,r+1,a+y,x)}else M=A&&yi(y,e,t,i,n,a,r+1);return!!M}}const ct=new D,si=new D;function Ks(s,e,t={},i=0,n=1/0){const a=i*i,r=n*n;let c=1/0,l=null;if(s.shapecast({boundsTraverseOrder:f=>(ct.copy(e).clamp(f.min,f.max),ct.distanceToSquared(e)),intersectsBounds:(f,u,o)=>o<c&&o<r,intersectsTriangle:(f,u)=>{f.closestPointToPoint(e,ct);const o=e.distanceToSquared(ct);return o<c&&(si.copy(ct),c=o,l=u),o<a}}),c===1/0)return null;const h=Math.sqrt(c);return t.point?t.point.copy(si):t.point=si.clone(),t.distance=h,t.faceIndex=l,t}const qe=new D,je=new D,Ge=new D,At=new J,Rt=new J,Mt=new J,Ji=new D,er=new D,tr=new D,It=new D;function Zs(s,e,t,i,n,a,r,c){let l;if(a===Cr?l=s.intersectTriangle(i,t,e,!0,n):l=s.intersectTriangle(e,t,i,a!==Ii,n),l===null)return null;const h=s.origin.distanceTo(n);return h<r||h>c?null:{distance:h,point:n.clone()}}function Js(s,e,t,i,n,a,r,c,l,h,f){qe.fromBufferAttribute(e,a),je.fromBufferAttribute(e,r),Ge.fromBufferAttribute(e,c);const u=Zs(s,qe,je,Ge,It,l,h,f);if(u){i&&(At.fromBufferAttribute(i,a),Rt.fromBufferAttribute(i,r),Mt.fromBufferAttribute(i,c),u.uv=dt.getInterpolation(It,qe,je,Ge,At,Rt,Mt,new J)),n&&(At.fromBufferAttribute(n,a),Rt.fromBufferAttribute(n,r),Mt.fromBufferAttribute(n,c),u.uv1=dt.getInterpolation(It,qe,je,Ge,At,Rt,Mt,new J)),t&&(Ji.fromBufferAttribute(t,a),er.fromBufferAttribute(t,r),tr.fromBufferAttribute(t,c),u.normal=dt.getInterpolation(It,qe,je,Ge,Ji,er,tr,new D),u.normal.dot(s.direction)>0&&u.normal.multiplyScalar(-1));const o={a,b:r,c,normal:new D,materialIndex:0};dt.getNormal(qe,je,Ge,o.normal),u.face=o,u.faceIndex=a}return u}function $t(s,e,t,i,n,a,r){const c=i*3;let l=c+0,h=c+1,f=c+2;const u=s.index;s.index&&(l=u.getX(l),h=u.getX(h),f=u.getX(f));const{position:o,normal:m,uv:p,uv1:y}=s.attributes,d=Js(t,o,m,p,y,l,h,f,e,a,r);return d?(d.faceIndex=i,n&&n.push(d),d):null}function Y(s,e,t,i){const n=s.a,a=s.b,r=s.c;let c=e,l=e+1,h=e+2;t&&(c=t.getX(c),l=t.getX(l),h=t.getX(h)),n.x=i.getX(c),n.y=i.getY(c),n.z=i.getZ(c),a.x=i.getX(l),a.y=i.getY(l),a.z=i.getZ(l),r.x=i.getX(h),r.y=i.getY(h),r.z=i.getZ(h)}function en(s,e,t,i,n,a,r,c){const{geometry:l,_indirectBuffer:h}=s;for(let f=i,u=i+n;f<u;f++)$t(l,e,t,f,a,r,c)}function tn(s,e,t,i,n,a,r){const{geometry:c,_indirectBuffer:l}=s;let h=1/0,f=null;for(let u=i,o=i+n;u<o;u++){let m;m=$t(c,e,t,u,null,a,r),m&&m.distance<h&&(f=m,h=m.distance)}return f}function rn(s,e,t,i,n,a,r){const{geometry:c}=t,{index:l}=c,h=c.attributes.position;for(let f=s,u=e+s;f<u;f++){let o;if(o=f,Y(r,o*3,l,h),r.needsUpdate=!0,i(r,o,n,a))return!0}return!1}function sn(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));const t=s.geometry,i=t.index?t.index.array:null,n=t.attributes.position;let a,r,c,l,h=0;const f=s._roots;for(let o=0,m=f.length;o<m;o++)a=f[o],r=new Uint32Array(a),c=new Uint16Array(a),l=new Float32Array(a),u(0,h),h+=a.byteLength;function u(o,m,p=!1){const y=o*2;if(c[y+15]===Gt){const g=r[o+6],v=c[y+14];let x=1/0,b=1/0,w=1/0,T=-1/0,S=-1/0,A=-1/0;for(let M=3*g,I=3*(g+v);M<I;M++){let P=i[M];const R=n.getX(P),F=n.getY(P),E=n.getZ(P);R<x&&(x=R),R>T&&(T=R),F<b&&(b=F),F>S&&(S=F),E<w&&(w=E),E>A&&(A=E)}return l[o+0]!==x||l[o+1]!==b||l[o+2]!==w||l[o+3]!==T||l[o+4]!==S||l[o+5]!==A?(l[o+0]=x,l[o+1]=b,l[o+2]=w,l[o+3]=T,l[o+4]=S,l[o+5]=A,!0):!1}else{const g=o+8,v=r[o+6],x=g+m,b=v+m;let w=p,T=!1,S=!1;e?w||(T=e.has(x),S=e.has(b),w=!T&&!S):(T=!0,S=!0);const A=w||T,M=w||S;let I=!1;A&&(I=u(g,m,w));let P=!1;M&&(P=u(v,m,w));const R=I||P;if(R)for(let F=0;F<3;F++){const E=g+F,k=v+F,V=l[E],te=l[E+3],fe=l[k],ae=l[k+3];l[o+F]=V<fe?V:fe,l[o+F+3]=te>ae?te:ae}return R}}}function Ee(s,e,t,i,n){let a,r,c,l,h,f;const u=1/t.direction.x,o=1/t.direction.y,m=1/t.direction.z,p=t.origin.x,y=t.origin.y,d=t.origin.z;let g=e[s],v=e[s+3],x=e[s+1],b=e[s+3+1],w=e[s+2],T=e[s+3+2];return u>=0?(a=(g-p)*u,r=(v-p)*u):(a=(v-p)*u,r=(g-p)*u),o>=0?(c=(x-y)*o,l=(b-y)*o):(c=(b-y)*o,l=(x-y)*o),a>l||c>r||((c>a||isNaN(a))&&(a=c),(l<r||isNaN(r))&&(r=l),m>=0?(h=(w-d)*m,f=(T-d)*m):(h=(T-d)*m,f=(w-d)*m),a>f||h>r)?!1:((h>a||a!==a)&&(a=h),(f<r||r!==r)&&(r=f),a<=n&&r>=i)}function nn(s,e,t,i,n,a,r,c){const{geometry:l,_indirectBuffer:h}=s;for(let f=i,u=i+n;f<u;f++){let o=h?h[f]:f;$t(l,e,t,o,a,r,c)}}function an(s,e,t,i,n,a,r){const{geometry:c,_indirectBuffer:l}=s;let h=1/0,f=null;for(let u=i,o=i+n;u<o;u++){let m;m=$t(c,e,t,l?l[u]:u,null,a,r),m&&m.distance<h&&(f=m,h=m.distance)}return f}function on(s,e,t,i,n,a,r){const{geometry:c}=t,{index:l}=c,h=c.attributes.position;for(let f=s,u=e+s;f<u;f++){let o;if(o=t.resolveTriangleIndex(f),Y(r,o*3,l,h),r.needsUpdate=!0,i(r,o,n,a))return!0}return!1}function cn(s,e,t,i,n,a,r){q.setBuffer(s._roots[e]),bi(0,s,t,i,n,a,r),q.clearBuffer()}function bi(s,e,t,i,n,a,r){const{float32Array:c,uint16Array:l,uint32Array:h}=q,f=s*2;if(K(f,l)){const o=re(s,h),m=se(f,l);en(e,t,i,o,m,n,a,r)}else{const o=ce(s);Ee(o,c,i,a,r)&&bi(o,e,t,i,n,a,r);const m=ne(s,h);Ee(m,c,i,a,r)&&bi(m,e,t,i,n,a,r)}}const ln=["x","y","z"];function un(s,e,t,i,n,a){q.setBuffer(s._roots[e]);const r=wi(0,s,t,i,n,a);return q.clearBuffer(),r}function wi(s,e,t,i,n,a){const{float32Array:r,uint16Array:c,uint32Array:l}=q;let h=s*2;if(K(h,c)){const u=re(s,l),o=se(h,c);return tn(e,t,i,u,o,n,a)}else{const u=Ci(s,l),o=ln[u],p=i.direction[o]>=0;let y,d;p?(y=ce(s),d=ne(s,l)):(y=ne(s,l),d=ce(s));const v=Ee(y,r,i,n,a)?wi(y,e,t,i,n,a):null;if(v){const w=v.point[o];if(p?w<=r[d+u]:w>=r[d+u+3])return v}const b=Ee(d,r,i,n,a)?wi(d,e,t,i,n,a):null;return v&&b?v.distance<=b.distance?v:b:v||b||null}}const Ct=new we,$e=new ge,Ye=new ge,lt=new Z,ir=new ee,Pt=new ee;function fn(s,e,t,i){q.setBuffer(s._roots[e]);const n=Ti(0,s,t,i);return q.clearBuffer(),n}function Ti(s,e,t,i,n=null){const{float32Array:a,uint16Array:r,uint32Array:c}=q;let l=s*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),ir.set(t.boundingBox.min,t.boundingBox.max,i),n=ir),K(l,r)){const f=e.geometry,u=f.index,o=f.attributes.position,m=t.index,p=t.attributes.position,y=re(s,c),d=se(l,r);if(lt.copy(i).invert(),t.boundsTree)return j(s,a,Pt),Pt.matrix.copy(lt),Pt.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:v=>Pt.intersectsBox(v),intersectsTriangle:v=>{v.a.applyMatrix4(i),v.b.applyMatrix4(i),v.c.applyMatrix4(i),v.needsUpdate=!0;for(let x=y*3,b=(d+y)*3;x<b;x+=3)if(Y(Ye,x,u,o),Ye.needsUpdate=!0,v.intersectsTriangle(Ye))return!0;return!1}});for(let g=y*3,v=(d+y)*3;g<v;g+=3){Y($e,g,u,o),$e.a.applyMatrix4(lt),$e.b.applyMatrix4(lt),$e.c.applyMatrix4(lt),$e.needsUpdate=!0;for(let x=0,b=m.count;x<b;x+=3)if(Y(Ye,x,m,p),Ye.needsUpdate=!0,$e.intersectsTriangle(Ye))return!0}}else{const f=s+8,u=c[s+6];return j(f,a,Ct),!!(n.intersectsBox(Ct)&&Ti(f,e,t,i,n)||(j(u,a,Ct),n.intersectsBox(Ct)&&Ti(u,e,t,i,n)))}}const Ft=new Z,ni=new ee,ut=new ee,hn=new D,dn=new D,mn=new D,pn=new D;function gn(s,e,t,i={},n={},a=0,r=1/0){e.boundingBox||e.computeBoundingBox(),ni.set(e.boundingBox.min,e.boundingBox.max,t),ni.needsUpdate=!0;const c=s.geometry,l=c.attributes.position,h=c.index,f=e.attributes.position,u=e.index,o=le.getPrimitive(),m=le.getPrimitive();let p=hn,y=dn,d=null,g=null;n&&(d=mn,g=pn);let v=1/0,x=null,b=null;return Ft.copy(t).invert(),ut.matrix.copy(Ft),s.shapecast({boundsTraverseOrder:w=>ni.distanceToBox(w),intersectsBounds:(w,T,S)=>S<v&&S<r?(T&&(ut.min.copy(w.min),ut.max.copy(w.max),ut.needsUpdate=!0),!0):!1,intersectsRange:(w,T)=>{if(e.boundsTree)return e.boundsTree.shapecast({boundsTraverseOrder:A=>ut.distanceToBox(A),intersectsBounds:(A,M,I)=>I<v&&I<r,intersectsRange:(A,M)=>{for(let I=A,P=A+M;I<P;I++){Y(m,3*I,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let R=w,F=w+T;R<F;R++){Y(o,3*R,h,l),o.needsUpdate=!0;const E=o.distanceToTriangle(m,p,d);if(E<v&&(y.copy(p),g&&g.copy(d),v=E,x=R,b=I),E<a)return!0}}}});{const S=at(e);for(let A=0,M=S;A<M;A++){Y(m,3*A,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let I=w,P=w+T;I<P;I++){Y(o,3*I,h,l),o.needsUpdate=!0;const R=o.distanceToTriangle(m,p,d);if(R<v&&(y.copy(p),g&&g.copy(d),v=R,x=I,b=A),R<a)return!0}}}}}),le.releasePrimitive(o),le.releasePrimitive(m),v===1/0?null:(i.point?i.point.copy(y):i.point=y.clone(),i.distance=v,i.faceIndex=x,n&&(n.point?n.point.copy(g):n.point=g.clone(),n.point.applyMatrix4(Ft),y.applyMatrix4(Ft),n.distance=y.sub(n.point).length(),n.faceIndex=b),i)}function vn(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));const t=s.geometry,i=t.index?t.index.array:null,n=t.attributes.position;let a,r,c,l,h=0;const f=s._roots;for(let o=0,m=f.length;o<m;o++)a=f[o],r=new Uint32Array(a),c=new Uint16Array(a),l=new Float32Array(a),u(0,h),h+=a.byteLength;function u(o,m,p=!1){const y=o*2;if(c[y+15]===Gt){const g=r[o+6],v=c[y+14];let x=1/0,b=1/0,w=1/0,T=-1/0,S=-1/0,A=-1/0;for(let M=g,I=g+v;M<I;M++){const P=3*s.resolveTriangleIndex(M);for(let R=0;R<3;R++){let F=P+R;F=i?i[F]:F;const E=n.getX(F),k=n.getY(F),V=n.getZ(F);E<x&&(x=E),E>T&&(T=E),k<b&&(b=k),k>S&&(S=k),V<w&&(w=V),V>A&&(A=V)}}return l[o+0]!==x||l[o+1]!==b||l[o+2]!==w||l[o+3]!==T||l[o+4]!==S||l[o+5]!==A?(l[o+0]=x,l[o+1]=b,l[o+2]=w,l[o+3]=T,l[o+4]=S,l[o+5]=A,!0):!1}else{const g=o+8,v=r[o+6],x=g+m,b=v+m;let w=p,T=!1,S=!1;e?w||(T=e.has(x),S=e.has(b),w=!T&&!S):(T=!0,S=!0);const A=w||T,M=w||S;let I=!1;A&&(I=u(g,m,w));let P=!1;M&&(P=u(v,m,w));const R=I||P;if(R)for(let F=0;F<3;F++){const E=g+F,k=v+F,V=l[E],te=l[E+3],fe=l[k],ae=l[k+3];l[o+F]=V<fe?V:fe,l[o+F+3]=te>ae?te:ae}return R}}}function xn(s,e,t,i,n,a,r){q.setBuffer(s._roots[e]),Si(0,s,t,i,n,a,r),q.clearBuffer()}function Si(s,e,t,i,n,a,r){const{float32Array:c,uint16Array:l,uint32Array:h}=q,f=s*2;if(K(f,l)){const o=re(s,h),m=se(f,l);nn(e,t,i,o,m,n,a,r)}else{const o=ce(s);Ee(o,c,i,a,r)&&Si(o,e,t,i,n,a,r);const m=ne(s,h);Ee(m,c,i,a,r)&&Si(m,e,t,i,n,a,r)}}const yn=["x","y","z"];function bn(s,e,t,i,n,a){q.setBuffer(s._roots[e]);const r=_i(0,s,t,i,n,a);return q.clearBuffer(),r}function _i(s,e,t,i,n,a){const{float32Array:r,uint16Array:c,uint32Array:l}=q;let h=s*2;if(K(h,c)){const u=re(s,l),o=se(h,c);return an(e,t,i,u,o,n,a)}else{const u=Ci(s,l),o=yn[u],p=i.direction[o]>=0;let y,d;p?(y=ce(s),d=ne(s,l)):(y=ne(s,l),d=ce(s));const v=Ee(y,r,i,n,a)?_i(y,e,t,i,n,a):null;if(v){const w=v.point[o];if(p?w<=r[d+u]:w>=r[d+u+3])return v}const b=Ee(d,r,i,n,a)?_i(d,e,t,i,n,a):null;return v&&b?v.distance<=b.distance?v:b:v||b||null}}const Dt=new we,Xe=new ge,Qe=new ge,ft=new Z,rr=new ee,Et=new ee;function wn(s,e,t,i){q.setBuffer(s._roots[e]);const n=Ai(0,s,t,i);return q.clearBuffer(),n}function Ai(s,e,t,i,n=null){const{float32Array:a,uint16Array:r,uint32Array:c}=q;let l=s*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),rr.set(t.boundingBox.min,t.boundingBox.max,i),n=rr),K(l,r)){const f=e.geometry,u=f.index,o=f.attributes.position,m=t.index,p=t.attributes.position,y=re(s,c),d=se(l,r);if(ft.copy(i).invert(),t.boundsTree)return j(s,a,Et),Et.matrix.copy(ft),Et.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:v=>Et.intersectsBox(v),intersectsTriangle:v=>{v.a.applyMatrix4(i),v.b.applyMatrix4(i),v.c.applyMatrix4(i),v.needsUpdate=!0;for(let x=y,b=d+y;x<b;x++)if(Y(Qe,3*e.resolveTriangleIndex(x),u,o),Qe.needsUpdate=!0,v.intersectsTriangle(Qe))return!0;return!1}});for(let g=y,v=d+y;g<v;g++){const x=e.resolveTriangleIndex(g);Y(Xe,3*x,u,o),Xe.a.applyMatrix4(ft),Xe.b.applyMatrix4(ft),Xe.c.applyMatrix4(ft),Xe.needsUpdate=!0;for(let b=0,w=m.count;b<w;b+=3)if(Y(Qe,b,m,p),Qe.needsUpdate=!0,Xe.intersectsTriangle(Qe))return!0}}else{const f=s+8,u=c[s+6];return j(f,a,Dt),!!(n.intersectsBox(Dt)&&Ai(f,e,t,i,n)||(j(u,a,Dt),n.intersectsBox(Dt)&&Ai(u,e,t,i,n)))}}const Bt=new Z,ai=new ee,ht=new ee,Tn=new D,Sn=new D,_n=new D,An=new D;function Rn(s,e,t,i={},n={},a=0,r=1/0){e.boundingBox||e.computeBoundingBox(),ai.set(e.boundingBox.min,e.boundingBox.max,t),ai.needsUpdate=!0;const c=s.geometry,l=c.attributes.position,h=c.index,f=e.attributes.position,u=e.index,o=le.getPrimitive(),m=le.getPrimitive();let p=Tn,y=Sn,d=null,g=null;n&&(d=_n,g=An);let v=1/0,x=null,b=null;return Bt.copy(t).invert(),ht.matrix.copy(Bt),s.shapecast({boundsTraverseOrder:w=>ai.distanceToBox(w),intersectsBounds:(w,T,S)=>S<v&&S<r?(T&&(ht.min.copy(w.min),ht.max.copy(w.max),ht.needsUpdate=!0),!0):!1,intersectsRange:(w,T)=>{if(e.boundsTree){const S=e.boundsTree;return S.shapecast({boundsTraverseOrder:A=>ht.distanceToBox(A),intersectsBounds:(A,M,I)=>I<v&&I<r,intersectsRange:(A,M)=>{for(let I=A,P=A+M;I<P;I++){const R=S.resolveTriangleIndex(I);Y(m,3*R,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let F=w,E=w+T;F<E;F++){const k=s.resolveTriangleIndex(F);Y(o,3*k,h,l),o.needsUpdate=!0;const V=o.distanceToTriangle(m,p,d);if(V<v&&(y.copy(p),g&&g.copy(d),v=V,x=F,b=I),V<a)return!0}}}})}else{const S=at(e);for(let A=0,M=S;A<M;A++){Y(m,3*A,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let I=w,P=w+T;I<P;I++){const R=s.resolveTriangleIndex(I);Y(o,3*R,h,l),o.needsUpdate=!0;const F=o.distanceToTriangle(m,p,d);if(F<v&&(y.copy(p),g&&g.copy(d),v=F,x=I,b=A),F<a)return!0}}}}}),le.releasePrimitive(o),le.releasePrimitive(m),v===1/0?null:(i.point?i.point.copy(y):i.point=y.clone(),i.distance=v,i.faceIndex=x,n&&(n.point?n.point.copy(g):n.point=g.clone(),n.point.applyMatrix4(Bt),y.applyMatrix4(Bt),n.distance=y.sub(n.point).length(),n.faceIndex=b),i)}function Mn(){return typeof SharedArrayBuffer<"u"}const xt=new q.constructor,qt=new q.constructor,Ie=new Fi(()=>new we),Ke=new we,Ze=new we,oi=new we,ci=new we;let li=!1;function In(s,e,t,i){if(li)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");li=!0;const n=s._roots,a=e._roots;let r,c=0,l=0;const h=new Z().copy(t).invert();for(let f=0,u=n.length;f<u;f++){xt.setBuffer(n[f]),l=0;const o=Ie.getPrimitive();j(0,xt.float32Array,o),o.applyMatrix4(h);for(let m=0,p=a.length;m<p&&(qt.setBuffer(a[m]),r=me(0,0,t,h,i,c,l,0,0,o),qt.clearBuffer(),l+=a[m].length,!r);m++);if(Ie.releasePrimitive(o),xt.clearBuffer(),c+=n[f].length,r)break}return li=!1,r}function me(s,e,t,i,n,a=0,r=0,c=0,l=0,h=null,f=!1){let u,o;f?(u=qt,o=xt):(u=xt,o=qt);const m=u.float32Array,p=u.uint32Array,y=u.uint16Array,d=o.float32Array,g=o.uint32Array,v=o.uint16Array,x=s*2,b=e*2,w=K(x,y),T=K(b,v);let S=!1;if(T&&w)f?S=n(re(e,g),se(e*2,v),re(s,p),se(s*2,y),l,r+e,c,a+s):S=n(re(s,p),se(s*2,y),re(e,g),se(e*2,v),c,a+s,l,r+e);else if(T){const A=Ie.getPrimitive();j(e,d,A),A.applyMatrix4(t);const M=ce(s),I=ne(s,p);j(M,m,Ke),j(I,m,Ze);const P=A.intersectsBox(Ke),R=A.intersectsBox(Ze);S=P&&me(e,M,i,t,n,r,a,l,c+1,A,!f)||R&&me(e,I,i,t,n,r,a,l,c+1,A,!f),Ie.releasePrimitive(A)}else{const A=ce(e),M=ne(e,g);j(A,d,oi),j(M,d,ci);const I=h.intersectsBox(oi),P=h.intersectsBox(ci);if(I&&P)S=me(s,A,t,i,n,a,r,c,l+1,h,f)||me(s,M,t,i,n,a,r,c,l+1,h,f);else if(I)if(w)S=me(s,A,t,i,n,a,r,c,l+1,h,f);else{const R=Ie.getPrimitive();R.copy(oi).applyMatrix4(t);const F=ce(s),E=ne(s,p);j(F,m,Ke),j(E,m,Ze);const k=R.intersectsBox(Ke),V=R.intersectsBox(Ze);S=k&&me(A,F,i,t,n,r,a,l,c+1,R,!f)||V&&me(A,E,i,t,n,r,a,l,c+1,R,!f),Ie.releasePrimitive(R)}else if(P)if(w)S=me(s,M,t,i,n,a,r,c,l+1,h,f);else{const R=Ie.getPrimitive();R.copy(ci).applyMatrix4(t);const F=ce(s),E=ne(s,p);j(F,m,Ke),j(E,m,Ze);const k=R.intersectsBox(Ke),V=R.intersectsBox(Ze);S=k&&me(M,F,i,t,n,r,a,l,c+1,R,!f)||V&&me(M,E,i,t,n,r,a,l,c+1,R,!f),Ie.releasePrimitive(R)}}return S}const kt=new ee,sr=new we,Cn={strategy:Nr,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null};class Di{static serialize(e,t={}){t={cloneBuffers:!0,...t};const i=e.geometry,n=e._roots,a=e._indirectBuffer,r=i.getIndex();let c;return t.cloneBuffers?c={roots:n.map(l=>l.slice()),index:r?r.array.slice():null,indirectBuffer:a?a.slice():null}:c={roots:n,index:r?r.array:null,indirectBuffer:a},c}static deserialize(e,t,i={}){i={setIndex:!0,indirect:!!e.indirectBuffer,...i};const{index:n,roots:a,indirectBuffer:r}=e,c=new Di(t,{...i,[ei]:!0});if(c._roots=a,c._indirectBuffer=r||null,i.setIndex){const l=t.getIndex();if(l===null){const h=new oe(e.index,1,!1);t.setIndex(h)}else l.array!==n&&(l.array.set(n),l.needsUpdate=!0)}return c}get indirect(){return!!this._indirectBuffer}constructor(e,t={}){if(e.isBufferGeometry){if(e.index&&e.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(t=Object.assign({...Cn,[ei]:!1},t),t.useSharedArrayBuffer&&!Mn())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=e,this._roots=null,this._indirectBuffer=null,t[ei]||(qs(this,t),!e.boundingBox&&t.setBoundingBox&&(e.boundingBox=this.getBoundingBox(new we))),this.resolveTriangleIndex=t.indirect?i=>this._indirectBuffer[i]:i=>i}refit(e=null){return(this.indirect?vn:sn)(this,e)}traverse(e,t=0){const i=this._roots[t],n=new Uint32Array(i),a=new Uint16Array(i);r(0);function r(c,l=0){const h=c*2,f=a[h+15]===Gt;if(f){const u=n[c+6],o=a[h+14];e(l,f,new Float32Array(i,c*4,6),u,o)}else{const u=c+Fe/4,o=n[c+6],m=n[c+7];e(l,f,new Float32Array(i,c*4,6),m)||(r(u,l+1),r(o,l+1))}}}raycast(e,t=mi,i=0,n=1/0){const a=this._roots,r=this.geometry,c=[],l=t.isMaterial,h=Array.isArray(t),f=r.groups,u=l?t.side:t,o=this.indirect?xn:cn;for(let m=0,p=a.length;m<p;m++){const y=h?t[f[m].materialIndex].side:u,d=c.length;if(o(this,m,y,e,c,i,n),h){const g=f[m].materialIndex;for(let v=d,x=c.length;v<x;v++)c[v].face.materialIndex=g}}return c}raycastFirst(e,t=mi,i=0,n=1/0){const a=this._roots,r=this.geometry,c=t.isMaterial,l=Array.isArray(t);let h=null;const f=r.groups,u=c?t.side:t,o=this.indirect?bn:un;for(let m=0,p=a.length;m<p;m++){const y=l?t[f[m].materialIndex].side:u,d=o(this,m,y,e,i,n);d!=null&&(h==null||d.distance<h.distance)&&(h=d,l&&(d.face.materialIndex=f[m].materialIndex))}return h}intersectsGeometry(e,t){let i=!1;const n=this._roots,a=this.indirect?wn:fn;for(let r=0,c=n.length;r<c&&(i=a(this,r,e,t),!i);r++);return i}shapecast(e){const t=le.getPrimitive(),i=this.indirect?on:rn;let{boundsTraverseOrder:n,intersectsBounds:a,intersectsRange:r,intersectsTriangle:c}=e;if(r&&c){const u=r;r=(o,m,p,y,d)=>u(o,m,p,y,d)?!0:i(o,m,this,c,p,y,t)}else r||(c?r=(u,o,m,p)=>i(u,o,this,c,m,p,t):r=(u,o,m)=>m);let l=!1,h=0;const f=this._roots;for(let u=0,o=f.length;u<o;u++){const m=f[u];if(l=Qs(this,u,a,r,n,h),l)break;h+=m.byteLength}return le.releasePrimitive(t),l}bvhcast(e,t,i){let{intersectsRanges:n,intersectsTriangles:a}=i;const r=le.getPrimitive(),c=this.geometry.index,l=this.geometry.attributes.position,h=this.indirect?p=>{const y=this.resolveTriangleIndex(p);Y(r,y*3,c,l)}:p=>{Y(r,p*3,c,l)},f=le.getPrimitive(),u=e.geometry.index,o=e.geometry.attributes.position,m=e.indirect?p=>{const y=e.resolveTriangleIndex(p);Y(f,y*3,u,o)}:p=>{Y(f,p*3,u,o)};if(a){const p=(y,d,g,v,x,b,w,T)=>{for(let S=g,A=g+v;S<A;S++){m(S),f.a.applyMatrix4(t),f.b.applyMatrix4(t),f.c.applyMatrix4(t),f.needsUpdate=!0;for(let M=y,I=y+d;M<I;M++)if(h(M),r.needsUpdate=!0,a(r,f,M,S,x,b,w,T))return!0}return!1};if(n){const y=n;n=function(d,g,v,x,b,w,T,S){return y(d,g,v,x,b,w,T,S)?!0:p(d,g,v,x,b,w,T,S)}}else n=p}return In(this,e,t,n)}intersectsBox(e,t){return kt.set(e.min,e.max,t),kt.needsUpdate=!0,this.shapecast({intersectsBounds:i=>kt.intersectsBox(i),intersectsTriangle:i=>kt.intersectsTriangle(i)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,i={},n={},a=0,r=1/0){return(this.indirect?Rn:gn)(this,e,t,i,n,a,r)}closestPointToPoint(e,t={},i=0,n=1/0){return Ks(this,e,t,i,n)}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(i=>{j(0,new Float32Array(i),sr),e.union(sr)}),e}}function Pn(s){switch(s){case 1:return"R";case 2:return"RG";case 3:return"RGBA";case 4:return"RGBA"}throw new Error}function Fn(s){switch(s){case 1:return Vt;case 2:return Fr;case 3:return X;case 4:return X}}function nr(s){switch(s){case 1:return as;case 2:return Pr;case 3:return gi;case 4:return gi}}class qr extends ue{constructor(){super(),this.minFilter=G,this.magFilter=G,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(e){const t=this.overrideItemSize,i=e.itemSize,n=e.count;if(t!==null){if(i*n%t!==0)throw new Error("VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.");e.itemSize=t,e.count=n*i/t}const a=e.itemSize,r=e.count,c=e.normalized,l=e.array.constructor,h=l.BYTES_PER_ELEMENT;let f=this._forcedType,u=a;if(f===null)switch(l){case Float32Array:f=Q;break;case Uint8Array:case Uint16Array:case Uint32Array:f=gt;break;case Int8Array:case Int16Array:case Int32Array:f=Zt;break}let o,m,p,y,d=Pn(a);switch(f){case Q:p=1,m=Fn(a),c&&h===1?(y=l,d+="8",l===Uint8Array?o=pi:(o=qi,d+="_SNORM")):(y=Float32Array,d+="32F",o=Q);break;case Zt:d+=h*8+"I",p=c?Math.pow(2,l.BYTES_PER_ELEMENT*8-1):1,m=nr(a),h===1?(y=Int8Array,o=qi):h===2?(y=Int16Array,o=ns):(y=Int32Array,o=Zt);break;case gt:d+=h*8+"UI",p=c?Math.pow(2,l.BYTES_PER_ELEMENT*8-1):1,m=nr(a),h===1?(y=Uint8Array,o=pi):h===2?(y=Uint16Array,o=ss):(y=Uint32Array,o=gt);break}u===3&&(m===X||m===gi)&&(u=4);const g=Math.ceil(Math.sqrt(r))||1,v=u*g*g,x=new y(v),b=e.normalized;e.normalized=!1;for(let w=0;w<r;w++){const T=u*w;x[T]=e.getX(w)/p,a>=2&&(x[T+1]=e.getY(w)/p),a>=3&&(x[T+2]=e.getZ(w)/p,u===4&&(x[T+3]=1)),a>=4&&(x[T+3]=e.getW(w)/p)}e.normalized=b,this.internalFormat=d,this.format=m,this.type=o,this.image.width=g,this.image.height=g,this.image.data=x,this.needsUpdate=!0,this.dispose(),e.itemSize=i,e.count=n}}class jr extends qr{constructor(){super(),this._forcedType=gt}}class Gr extends qr{constructor(){super(),this._forcedType=Q}}class Dn{constructor(){this.index=new jr,this.position=new Gr,this.bvhBounds=new ue,this.bvhContents=new ue,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(e){const{geometry:t}=e;if(Bn(e,this.bvhBounds,this.bvhContents),this.position.updateFrom(t.attributes.position),e.indirect){const i=e._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==i.length)if(t.index)this._cachedIndexAttr=t.index.clone();else{const n=Lr(Or(t));this._cachedIndexAttr=new oe(n,1,!1)}En(t,i,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(t.index)}dispose(){const{index:e,position:t,bvhBounds:i,bvhContents:n}=this;e&&e.dispose(),t&&t.dispose(),i&&i.dispose(),n&&n.dispose()}}function En(s,e,t){const i=t.array,n=s.index?s.index.array:null;for(let a=0,r=e.length;a<r;a++){const c=3*a,l=3*e[a];for(let h=0;h<3;h++)i[c+h]=n?n[l+h]:l+h}}function Bn(s,e,t){const i=s._roots;if(i.length!==1)throw new Error("MeshBVHUniformStruct: Multi-root BVHs not supported.");const n=i[0],a=new Uint16Array(n),r=new Uint32Array(n),c=new Float32Array(n),l=n.byteLength/Fe,h=2*Math.ceil(Math.sqrt(l/2)),f=new Float32Array(4*h*h),u=Math.ceil(Math.sqrt(l)),o=new Uint32Array(2*u*u);for(let m=0;m<l;m++){const p=m*Fe/4,y=p*2,d=p;for(let g=0;g<3;g++)f[8*m+0+g]=c[d+0+g],f[8*m+4+g]=c[d+3+g];if(K(y,a)){const g=se(y,a),v=re(p,r),x=4294901760|g;o[m*2+0]=x,o[m*2+1]=v}else{const g=4*ne(p,r)/Fe,v=Ci(p,r);o[m*2+0]=v,o[m*2+1]=g}}e.image.data=f,e.image.width=h,e.image.height=h,e.format=X,e.type=Q,e.internalFormat="RGBA32F",e.minFilter=G,e.magFilter=G,e.generateMipmaps=!1,e.needsUpdate=!0,e.dispose(),t.image.data=o,t.image.width=u,t.image.height=u,t.format=Pr,t.type=gt,t.internalFormat="RG32UI",t.minFilter=G,t.magFilter=G,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose()}const kn=`

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
`,Nn=`

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
`,zn=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;function $r(s,e,t=0){if(s.isInterleavedBufferAttribute){const i=s.itemSize;for(let n=0,a=s.count;n<a;n++){const r=n+t;e.setX(r,s.getX(n)),i>=2&&e.setY(r,s.getY(n)),i>=3&&e.setZ(r,s.getZ(n)),i>=4&&e.setW(r,s.getW(n))}}else{const i=e.array,n=i.constructor,a=i.BYTES_PER_ELEMENT*s.itemSize*t;new n(i.buffer,a,s.array.length).set(s.array)}}function pt(s,e=null){const t=s.array.constructor,i=s.normalized,n=s.itemSize,a=e===null?s.count:e;return new oe(new t(n*a),n,i)}function it(s,e){if(!s&&!e)return!0;if(!!s!=!!e)return!1;const t=s.count===e.count,i=s.normalized===e.normalized,n=s.array.constructor===e.array.constructor,a=s.itemSize===e.itemSize;return!(!t||!i||!n||!a)}function On(s){const e=s[0].index!==null,t=new Set(Object.keys(s[0].attributes));if(!s[0].getAttribute("position"))throw new Error("StaticGeometryGenerator: position attribute is required.");for(let i=0;i<s.length;++i){const n=s[i];let a=0;if(e!==(n.index!==null))throw new Error("StaticGeometryGenerator: All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.");for(const r in n.attributes){if(!t.has(r))throw new Error('StaticGeometryGenerator: All geometries must have compatible attributes; make sure "'+r+'" attribute exists among all geometries, or in none of them.');a++}if(a!==t.size)throw new Error("StaticGeometryGenerator: All geometries must have the same number of attributes.")}}function Ln(s){let e=0;for(let t=0,i=s.length;t<i;t++)e+=s[t].getIndex().count;return e}function Hn(s){let e=0;for(let t=0,i=s.length;t<i;t++)e+=s[t].getAttribute("position").count;return e}function Un(s,e,t){s.index&&s.index.count!==e&&s.setIndex(null);const i=s.attributes;for(const n in i)i[n].count!==t&&s.deleteAttribute(n)}function Wn(s,e={},t=new Oe){const{useGroups:i=!1,forceUpdate:n=!1,skipAssigningAttributes:a=[],overwriteIndex:r=!0}=e;On(s);const c=s[0].index!==null,l=c?Ln(s):-1,h=Hn(s);if(Un(t,l,h),i){let u=0;for(let o=0,m=s.length;o<m;o++){const p=s[o];let y;c?y=p.getIndex().count:y=p.getAttribute("position").count,t.addGroup(u,y,o),u+=y}}if(c){let u=!1;if(t.index||(t.setIndex(new oe(new Uint32Array(l),1,!1)),u=!0),u||r){let o=0,m=0;const p=t.getIndex();for(let y=0,d=s.length;y<d;y++){const g=s[y],v=g.getIndex();if(!(!n&&!u&&a[y]))for(let b=0;b<v.count;++b)p.setX(o+b,v.getX(b)+m);o+=v.count,m+=g.getAttribute("position").count}}}const f=Object.keys(s[0].attributes);for(let u=0,o=f.length;u<o;u++){let m=!1;const p=f[u];if(!t.getAttribute(p)){const g=s[0].getAttribute(p);t.setAttribute(p,pt(g,h)),m=!0}let y=0;const d=t.getAttribute(p);for(let g=0,v=s.length;g<v;g++){const x=s[g],b=!n&&!m&&a[g],w=x.getAttribute(p);if(!b)if(p==="color"&&d.itemSize!==w.itemSize)for(let T=y,S=w.count;T<S;T++)w.setXYZW(T,d.getX(T),d.getY(T),d.getZ(T),1);else $r(w,d,y);y+=w.count}}}function Vn(s,e,t){const i=s.index,a=s.attributes.position.count,r=i?i.count:a;let c=s.groups;c.length===0&&(c=[{count:r,start:0,materialIndex:0}]);let l=s.getAttribute("materialIndex");if(!l||l.count!==a){let f;t.length<=255?f=new Uint8Array(a):f=new Uint16Array(a),l=new oe(f,1,!1),s.deleteAttribute("materialIndex"),s.setAttribute("materialIndex",l)}const h=l.array;for(let f=0;f<c.length;f++){const u=c[f],o=u.start,m=u.count,p=Math.min(m,r-o),y=Array.isArray(e)?e[u.materialIndex]:e,d=t.indexOf(y);for(let g=0;g<p;g++){let v=o+g;i&&(v=i.getX(v)),h[v]=d}}}function qn(s,e){if(!s.index){const t=s.attributes.position.count,i=new Array(t);for(let n=0;n<t;n++)i[n]=n;s.setIndex(i)}if(!s.attributes.normal&&e&&e.includes("normal")&&s.computeVertexNormals(),!s.attributes.uv&&e&&e.includes("uv")){const t=s.attributes.position.count;s.setAttribute("uv",new oe(new Float32Array(t*2),2,!1))}if(!s.attributes.uv2&&e&&e.includes("uv2")){const t=s.attributes.position.count;s.setAttribute("uv2",new oe(new Float32Array(t*2),2,!1))}if(!s.attributes.tangent&&e&&e.includes("tangent"))if(s.attributes.uv&&s.attributes.normal)s.computeTangents();else{const t=s.attributes.position.count;s.setAttribute("tangent",new oe(new Float32Array(t*4),4,!1))}if(!s.attributes.color&&e&&e.includes("color")){const t=s.attributes.position.count,i=new Float32Array(t*4);i.fill(1),s.setAttribute("color",new oe(i,4))}}function Ei(s){let e=0;if(s.byteLength!==0){const t=new Uint8Array(s);for(let i=0;i<s.byteLength;i++){const n=t[i];e=(e<<5)-e+n,e|=0}}return e}function ar(s){let e=s.uuid;const t=Object.values(s.attributes);s.index&&(t.push(s.index),e+=`index|${s.index.version}`);const i=Object.keys(t).sort();for(const n of i){const a=t[n];e+=`${n}_${a.version}|`}return e}function or(s){const e=s.skeleton;return e?(e.boneTexture||e.computeBoneTexture(),`${Ei(e.boneTexture.image.data.buffer)}_${e.boneTexture.uuid}`):null}class jn{constructor(e=null){this.matrixWorld=new Z,this.geometryHash=null,this.skeletonHash=null,this.primitiveCount=-1,e!==null&&this.updateFrom(e)}updateFrom(e){const t=e.geometry,i=(t.index?t.index.count:t.attributes.position.count)/3;this.matrixWorld.copy(e.matrixWorld),this.geometryHash=ar(t),this.primitiveCount=i,this.skeletonHash=or(e)}didChange(e){const t=e.geometry,i=(t.index?t.index.count:t.attributes.position.count)/3;return!(this.matrixWorld.equals(e.matrixWorld)&&this.geometryHash===ar(t)&&this.skeletonHash===or(e)&&this.primitiveCount===i)}}const Be=new D,ke=new D,Ne=new D,cr=new st,Nt=new D,ui=new D,lr=new st,ur=new st,zt=new Z,fr=new Z;function hr(s,e,t){const i=s.skeleton,n=s.geometry,a=i.bones,r=i.boneInverses;lr.fromBufferAttribute(n.attributes.skinIndex,e),ur.fromBufferAttribute(n.attributes.skinWeight,e),zt.elements.fill(0);for(let c=0;c<4;c++){const l=ur.getComponent(c);if(l!==0){const h=lr.getComponent(c);fr.multiplyMatrices(a[h].matrixWorld,r[h]),Gn(zt,fr,l)}}return zt.multiply(s.bindMatrix).premultiply(s.bindMatrixInverse),t.transformDirection(zt),t}function fi(s,e,t,i,n){Nt.set(0,0,0);for(let a=0,r=s.length;a<r;a++){const c=e[a],l=s[a];c!==0&&(ui.fromBufferAttribute(l,i),t?Nt.addScaledVector(ui,c):Nt.addScaledVector(ui.sub(n),c))}n.add(Nt)}function Gn(s,e,t){const i=s.elements,n=e.elements;for(let a=0,r=n.length;a<r;a++)i[a]+=n[a]*t}function $n(s){const{index:e,attributes:t}=s;if(e)for(let i=0,n=e.count;i<n;i+=3){const a=e.getX(i),r=e.getX(i+2);e.setX(i,r),e.setX(i+2,a)}else for(const i in t){const n=t[i],a=n.itemSize;for(let r=0,c=n.count;r<c;r+=3)for(let l=0;l<a;l++){const h=n.getComponent(r,l),f=n.getComponent(r+2,l);n.setComponent(r,l,f),n.setComponent(r+2,l,h)}}return s}function Yn(s,e={},t=new Oe){e={applyWorldTransforms:!0,attributes:[],...e};const i=s.geometry,n=e.applyWorldTransforms,a=e.attributes.includes("normal"),r=e.attributes.includes("tangent"),c=i.attributes,l=t.attributes;for(const v in t.attributes)(!e.attributes.includes(v)||!(v in i.attributes))&&t.deleteAttribute(v);!t.index&&i.index&&(t.index=i.index.clone()),l.position||t.setAttribute("position",pt(c.position)),a&&!l.normal&&c.normal&&t.setAttribute("normal",pt(c.normal)),r&&!l.tangent&&c.tangent&&t.setAttribute("tangent",pt(c.tangent)),it(i.index,t.index),it(c.position,l.position),a&&it(c.normal,l.normal),r&&it(c.tangent,l.tangent);const h=c.position,f=a?c.normal:null,u=r?c.tangent:null,o=i.morphAttributes.position,m=i.morphAttributes.normal,p=i.morphAttributes.tangent,y=i.morphTargetsRelative,d=s.morphTargetInfluences,g=new os;g.getNormalMatrix(s.matrixWorld),i.index&&t.index.array.set(i.index.array);for(let v=0,x=c.position.count;v<x;v++)Be.fromBufferAttribute(h,v),f&&ke.fromBufferAttribute(f,v),u&&(cr.fromBufferAttribute(u,v),Ne.fromBufferAttribute(u,v)),d&&(o&&fi(o,d,y,v,Be),m&&fi(m,d,y,v,ke),p&&fi(p,d,y,v,Ne)),s.isSkinnedMesh&&(s.applyBoneTransform(v,Be),f&&hr(s,v,ke),u&&hr(s,v,Ne)),n&&Be.applyMatrix4(s.matrixWorld),l.position.setXYZ(v,Be.x,Be.y,Be.z),f&&(n&&ke.applyNormalMatrix(g),l.normal.setXYZ(v,ke.x,ke.y,ke.z)),u&&(n&&Ne.transformDirection(s.matrixWorld),l.tangent.setXYZW(v,Ne.x,Ne.y,Ne.z,cr.w));for(const v in e.attributes){const x=e.attributes[v];x==="position"||x==="tangent"||x==="normal"||!(x in c)||(l[x]||t.setAttribute(x,pt(c[x])),it(c[x],l[x]),$r(c[x],l[x]))}return s.matrixWorld.determinant()<0&&$n(t),t}class Xn extends Oe{constructor(){super(),this.version=0,this.hash=null,this._diff=new jn}isCompatible(e,t){const i=e.geometry;for(let n=0;n<t.length;n++){const a=t[n],r=i.attributes[a],c=this.attributes[a];if(r&&!it(r,c))return!1}return!0}updateFrom(e,t){const i=this._diff;return i.didChange(e)?(Yn(e,t,this),i.updateFrom(e),this.version++,this.hash=`${this.uuid}_${this.version}`,!0):!1}}const Ri=0,Yr=1,Xr=2;function Qn(s,e){for(let t=0,i=s.length;t<i;t++)s[t].traverseVisible(a=>{a.isMesh&&e(a)})}function Kn(s){const e=[];for(let t=0,i=s.length;t<i;t++){const n=s[t];Array.isArray(n.material)?e.push(...n.material):e.push(n.material)}return e}function Zn(s,e,t){if(s.length===0){e.setIndex(null);const i=e.attributes;for(const n in i)e.deleteAttribute(n);for(const n in t.attributes)e.setAttribute(t.attributes[n],new oe(new Float32Array(0),4,!1))}else Wn(s,t,e);for(const i in e.attributes)e.attributes[i].needsUpdate=!0}class Jn{constructor(e){this.objects=null,this.useGroups=!0,this.applyWorldTransforms=!0,this.generateMissingAttributes=!0,this.overwriteIndex=!0,this.attributes=["position","normal","color","tangent","uv","uv2"],this._intermediateGeometry=new Map,this._geometryMergeSets=new WeakMap,this._mergeOrder=[],this._dummyMesh=null,this.setObjects(e||[])}_getDummyMesh(){if(!this._dummyMesh){const e=new cs,t=new Oe;t.setAttribute("position",new oe(new Float32Array(9),3)),this._dummyMesh=new Dr(t,e)}return this._dummyMesh}_getMeshes(){const e=[];return Qn(this.objects,t=>{e.push(t)}),e.sort((t,i)=>t.uuid>i.uuid?1:t.uuid<i.uuid?-1:0),e.length===0&&e.push(this._getDummyMesh()),e}_updateIntermediateGeometries(){const{_intermediateGeometry:e}=this,t=this._getMeshes(),i=new Set(e.keys()),n={attributes:this.attributes,applyWorldTransforms:this.applyWorldTransforms};for(let a=0,r=t.length;a<r;a++){const c=t[a],l=c.uuid;i.delete(l);let h=e.get(l);(!h||!h.isCompatible(c,this.attributes))&&(h&&h.dispose(),h=new Xn,e.set(l,h)),h.updateFrom(c,n)&&this.generateMissingAttributes&&qn(h,this.attributes)}i.forEach(a=>{e.delete(a)})}setObjects(e){Array.isArray(e)?this.objects=[...e]:this.objects=[e]}generate(e=new Oe){const{useGroups:t,overwriteIndex:i,_intermediateGeometry:n,_geometryMergeSets:a}=this,r=this._getMeshes(),c=[],l=[],h=a.get(e)||[];this._updateIntermediateGeometries();let f=!1;r.length!==h.length&&(f=!0);for(let o=0,m=r.length;o<m;o++){const p=r[o],y=n.get(p.uuid);l.push(y);const d=h[o];!d||d.uuid!==y.uuid?(c.push(!1),f=!0):d.version!==y.version?c.push(!1):c.push(!0)}Zn(l,e,{useGroups:t,forceUpdate:f,skipAssigningAttributes:c,overwriteIndex:i}),f&&e.dispose(),a.set(e,l.map(o=>({version:o.version,uuid:o.uuid})));let u=Ri;return f?u=Xr:c.includes(!1)&&(u=Yr),{changeType:u,materials:Kn(r),geometry:e}}}function ea(s){const e=new Set;for(let t=0,i=s.length;t<i;t++){const n=s[t];for(const a in n){const r=n[a];r&&r.isTexture&&e.add(r)}}return Array.from(e)}function ta(s){const e=[],t=new Set;for(let n=0,a=s.length;n<a;n++)s[n].traverse(r=>{r.visible&&(r.isRectAreaLight||r.isSpotLight||r.isPointLight||r.isDirectionalLight)&&(e.push(r),r.iesMap&&t.add(r.iesMap))});const i=Array.from(t).sort((n,a)=>n.uuid<a.uuid?1:n.uuid>a.uuid?-1:0);return{lights:e,iesTextures:i}}class ia{get initialized(){return!!this.bvh}constructor(e){this.bvhOptions={},this.attributes=["position","normal","tangent","color","uv","uv2"],this.generateBVH=!0,this.bvh=null,this.geometry=new Oe,this.staticGeometryGenerator=new Jn(e),this._bvhWorker=null,this._pendingGenerate=null,this._buildAsync=!1,this._materialUuids=null}setObjects(e){this.staticGeometryGenerator.setObjects(e)}setBVHWorker(e){this._bvhWorker=e}async generateAsync(e=null){if(!this._bvhWorker)throw new Error('PathTracingSceneGenerator: "setBVHWorker" must be called before "generateAsync" can be called.');if(this.bvh instanceof Promise)return this._pendingGenerate||(this._pendingGenerate=new Promise(async()=>(await this.bvh,this._pendingGenerate=null,this.generateAsync(e)))),this._pendingGenerate;{this._buildAsync=!0;const t=this.generate(e);return this._buildAsync=!1,t.bvh=this.bvh=await t.bvh,t}}generate(e=null){const{staticGeometryGenerator:t,geometry:i,attributes:n}=this,a=t.objects;t.attributes=n,a.forEach(o=>{o.traverse(m=>{m.isSkinnedMesh&&m.skeleton&&m.skeleton.update()})});const r=t.generate(i),c=r.materials;let l=r.changeType!==Ri||this._materialUuids===null||this._materialUuids.length!==length;if(!l){for(let o=0,m=c.length;o<m;o++)if(c[o].uuid!==this._materialUuids[o]){l=!0;break}}const h=ea(c),{lights:f,iesTextures:u}=ta(a);if(l&&(Vn(i,c,c),this._materialUuids=c.map(o=>o.uuid)),this.generateBVH){if(this.bvh instanceof Promise)throw new Error("PathTracingSceneGenerator: BVH is already building asynchronously.");if(r.changeType===Xr){const o={strategy:zr,maxLeafTris:1,indirect:!0,onProgress:e,...this.bvhOptions};this._buildAsync?this.bvh=this._bvhWorker.generate(i,o):this.bvh=new Di(i,o)}else r.changeType===Yr&&this.bvh.refit()}return{bvhChanged:r.changeType!==Ri,bvh:this.bvh,needsMaterialIndexUpdate:l,lights:f,iesTextures:u,geometry:i,materials:c,textures:h,objects:a}}}const ra=new ls(-1,1,1,-1,0,1);class sa extends Oe{constructor(){super(),this.setAttribute("position",new ji([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new ji([0,2,0,0,2,0],2))}}const na=new sa;class nt{constructor(e){this._mesh=new Dr(na,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,ra)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Bi extends jt{set needsUpdate(e){super.needsUpdate=!0,this.dispatchEvent({type:"recompilation"})}constructor(e){super(e);for(const t in this.uniforms)Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(i){this.uniforms[t].value=i}})}setDefine(e,t=void 0){if(t==null){if(e in this.defines)return delete this.defines[e],this.needsUpdate=!0,!0}else if(this.defines[e]!==t)return this.defines[e]=t,this.needsUpdate=!0,!0;return!1}}class aa extends Bi{constructor(e){super({blending:yt,uniforms:{target1:{value:null},target2:{value:null},opacity:{value:1}},vertexShader:`

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

				}`}),this.setValues(e)}}function Ot(s=1){let e="uint";return s>1&&(e="uvec"+s),`
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
	`}function Lt(s=1){let e="uint",t="float",i="",n=".r",a="1u";return s>1&&(e="uvec"+s,t="vec"+s,i=s+"",s===2?(n=".rg",a="uvec2( 1u, 2u )"):s===3?(n=".rgb",a="uvec3( 1u, 2u, 3u )"):(n="",a="uvec4( 1u, 2u, 3u, 4u )")),`

		${t} sobol${i}( int effect ) {

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
	`}const Qr=`

	// Utils
	const float SOBOL_FACTOR = 1.0 / 16777216.0;
	const uint SOBOL_MAX_POINTS = 256u * 256u;

	${Ot(1)}
	${Ot(2)}
	${Ot(3)}
	${Ot(4)}

	uint sobolHash( uint x ) {

		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}

`,oa=`

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

`,ca=`

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

	${Lt(1)}
	${Lt(2)}
	${Lt(3)}
	${Lt(4)}

`;class la extends Bi{constructor(){super({blending:yt,uniforms:{resolution:{value:new J}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`

				${Qr}
				${oa}

				varying vec2 vUv;
				uniform vec2 resolution;
				void main() {

					uint index = uint( gl_FragCoord.y ) * uint( resolution.x ) + uint( gl_FragCoord.x );
					gl_FragColor = generateSobolPoint( index );

				}
			`})}}class ua{generate(e,t=256){const i=new vt(t,t,{type:Q,format:X,minFilter:G,magFilter:G,generateMipmaps:!1}),n=e.getRenderTarget();e.setRenderTarget(i);const a=new nt(new la);return a.material.resolution.set(t,t),a.render(e),e.setRenderTarget(n),a.dispose(),i}}class Kr extends Er{set bokehSize(e){this.fStop=this.getFocalLength()/e}get bokehSize(){return this.getFocalLength()/this.fStop}constructor(...e){super(...e),this.fStop=1.4,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=25,this.anamorphicRatio=1}copy(e,t){return super.copy(e,t),this.fStop=e.fStop,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio,this}}class fa{constructor(){this.bokehSize=0,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=10,this.anamorphicRatio=1}updateFrom(e){e instanceof Kr?(this.bokehSize=e.bokehSize,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio):(this.bokehSize=0,this.apertureRotation=0,this.apertureBlades=0,this.focusDistance=10,this.anamorphicRatio=1)}}function hi(s){const e=new Uint16Array(s.length);for(let t=0,i=s.length;t<i;++t)e[t]=Se.toHalfFloat(s[t]);return e}function dr(s,e,t=0,i=s.length){let n=t,a=t+i-1;for(;n<a;){const r=n+a>>1;s[r]<e?n=r+1:a=r}return n-t}function ha(s,e,t){return .2126*s+.7152*e+.0722*t}function da(s,e=ye){const t=s.clone();t.source=new us({...t.image});const{width:i,height:n,data:a}=t.image;let r=a;if(t.type!==e){e===ye?r=new Uint16Array(a.length):r=new Float32Array(a.length);let c;a instanceof Int8Array||a instanceof Int16Array||a instanceof Int32Array?c=2**(8*a.BYTES_PER_ELEMENT-1)-1:c=2**(8*a.BYTES_PER_ELEMENT)-1;for(let l=0,h=a.length;l<h;l++){let f=a[l];t.type===ye&&(f=Se.fromHalfFloat(a[l])),t.type!==Q&&t.type!==ye&&(f/=c),e===ye&&(r[l]=Se.toHalfFloat(f))}t.image.data=r,t.type=e}if(t.flipY){const c=r;r=r.slice();for(let l=0;l<n;l++)for(let h=0;h<i;h++){const f=n-l-1,u=4*(l*i+h),o=4*(f*i+h);r[o+0]=c[u+0],r[o+1]=c[u+1],r[o+2]=c[u+2],r[o+3]=c[u+3]}t.flipY=!1,t.image.data=r}return t}class ma{constructor(){const e=new ue(hi(new Float32Array([0,0,0,0])),1,1);e.type=ye,e.format=X,e.minFilter=pe,e.magFilter=pe,e.wrapS=Pe,e.wrapT=Pe,e.generateMipmaps=!1,e.needsUpdate=!0;const t=new ue(hi(new Float32Array([0,1])),1,2);t.type=ye,t.format=Vt,t.minFilter=pe,t.magFilter=pe,t.generateMipmaps=!1,t.needsUpdate=!0;const i=new ue(hi(new Float32Array([0,0,1,1])),2,2);i.type=ye,i.format=Vt,i.minFilter=pe,i.magFilter=pe,i.generateMipmaps=!1,i.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=i,this.totalSum=0}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){const t=da(e);t.wrapS=Pe,t.wrapT=De;const{width:i,height:n,data:a}=t.image,r=new Float32Array(i*n),c=new Float32Array(i*n),l=new Float32Array(n),h=new Float32Array(n);let f=0,u=0;for(let d=0;d<n;d++){let g=0;for(let v=0;v<i;v++){const x=d*i+v,b=Se.fromHalfFloat(a[4*x+0]),w=Se.fromHalfFloat(a[4*x+1]),T=Se.fromHalfFloat(a[4*x+2]),S=ha(b,w,T);g+=S,f+=S,r[x]=S,c[x]=g}if(g!==0)for(let v=d*i,x=d*i+i;v<x;v++)r[v]/=g,c[v]/=g;u+=g,l[d]=g,h[d]=u}if(u!==0)for(let d=0,g=l.length;d<g;d++)l[d]/=u,h[d]/=u;const o=new Uint16Array(n),m=new Uint16Array(i*n);for(let d=0;d<n;d++){const g=(d+1)/n,v=dr(h,g);o[d]=Se.toHalfFloat((v+.5)/n)}for(let d=0;d<n;d++)for(let g=0;g<i;g++){const v=d*i+g,x=(g+1)/i,b=dr(c,x,d*i,i);m[v]=Se.toHalfFloat((b+.5)/i)}this.dispose();const{marginalWeights:p,conditionalWeights:y}=this;p.image={width:n,height:1,data:o},p.needsUpdate=!0,y.image={width:i,height:n,data:m},y.needsUpdate=!0,this.totalSum=f,this.map=t}}const di=6,pa=0,ga=1,va=2,xa=3,ya=4,de=new D,ie=new D,mr=new Z,Je=new fs,pr=new D,et=new D,ba=new D(0,1,0);class wa{constructor(){const e=new ue(new Float32Array(4),1,1);e.format=X,e.type=Q,e.wrapS=De,e.wrapT=De,e.generateMipmaps=!1,e.minFilter=G,e.magFilter=G,this.tex=e,this.count=0}updateFrom(e,t=[]){const i=this.tex,n=Math.max(e.length*di,1),a=Math.ceil(Math.sqrt(n));i.image.width!==a&&(i.dispose(),i.image.data=new Float32Array(a*a*4),i.image.width=a,i.image.height=a);const r=i.image.data;for(let l=0,h=e.length;l<h;l++){const f=e[l],u=l*di*4;let o=0;for(let p=0;p<di*4;p++)r[u+p]=0;f.getWorldPosition(ie),r[u+o++]=ie.x,r[u+o++]=ie.y,r[u+o++]=ie.z;let m=pa;if(f.isRectAreaLight&&f.isCircular?m=ga:f.isSpotLight?m=va:f.isDirectionalLight?m=xa:f.isPointLight&&(m=ya),r[u+o++]=m,r[u+o++]=f.color.r,r[u+o++]=f.color.g,r[u+o++]=f.color.b,r[u+o++]=f.intensity,f.getWorldQuaternion(Je),f.isRectAreaLight)de.set(f.width,0,0).applyQuaternion(Je),r[u+o++]=de.x,r[u+o++]=de.y,r[u+o++]=de.z,o++,ie.set(0,f.height,0).applyQuaternion(Je),r[u+o++]=ie.x,r[u+o++]=ie.y,r[u+o++]=ie.z,r[u+o++]=de.cross(ie).length()*(f.isCircular?Math.PI/4:1);else if(f.isSpotLight){const p=f.radius||0;pr.setFromMatrixPosition(f.matrixWorld),et.setFromMatrixPosition(f.target.matrixWorld),mr.lookAt(pr,et,ba),Je.setFromRotationMatrix(mr),de.set(1,0,0).applyQuaternion(Je),r[u+o++]=de.x,r[u+o++]=de.y,r[u+o++]=de.z,o++,ie.set(0,1,0).applyQuaternion(Je),r[u+o++]=ie.x,r[u+o++]=ie.y,r[u+o++]=ie.z,r[u+o++]=Math.PI*p*p,r[u+o++]=p,r[u+o++]=f.decay,r[u+o++]=f.distance,r[u+o++]=Math.cos(f.angle),r[u+o++]=Math.cos(f.angle*(1-f.penumbra)),r[u+o++]=f.iesMap?t.indexOf(f.iesMap):-1}else if(f.isPointLight){const p=de.setFromMatrixPosition(f.matrixWorld);r[u+o++]=p.x,r[u+o++]=p.y,r[u+o++]=p.z,o++,o+=4,o+=1,r[u+o++]=f.decay,r[u+o++]=f.distance}else if(f.isDirectionalLight){const p=de.setFromMatrixPosition(f.matrixWorld),y=ie.setFromMatrixPosition(f.target.matrixWorld);et.subVectors(p,y).normalize(),r[u+o++]=et.x,r[u+o++]=et.y,r[u+o++]=et.z}}this.count=e.length;const c=Ei(r.buffer);return this.hash!==c?(this.hash=c,i.needsUpdate=!0,!0):!1}}function gr(s,e,t,i,n){if(e>i)throw new Error;const a=s.length/e,r=s.constructor.BYTES_PER_ELEMENT*8;let c=1;switch(s.constructor){case Uint8Array:case Uint16Array:case Uint32Array:c=2**r-1;break;case Int8Array:case Int16Array:case Int32Array:c=2**(r-1)-1;break}for(let l=0;l<a;l++){const h=4*l,f=e*l;for(let u=0;u<i;u++)t[n+h+u]=e>=u+1?s[f+u]/c:0}}class Ta extends hs{constructor(){super(),this._textures=[],this.type=Q,this.format=X,this.internalFormat="RGBA32F"}updateAttribute(e,t){const i=this._textures[e];i.updateFrom(t);const n=i.image,a=this.image;if(n.width!==a.width||n.height!==a.height)throw new Error("FloatAttributeTextureArray: Attribute must be the same dimensions when updating single layer.");const{width:r,height:c,data:l}=a,f=r*c*4*e;let u=t.itemSize;u===3&&(u=4),gr(i.image.data,u,l,4,f),this.dispose(),this.needsUpdate=!0}setAttributes(e){const t=e[0].count,i=e.length;for(let u=0,o=i;u<o;u++)if(e[u].count!==t)throw new Error("FloatAttributeTextureArray: All attributes must have the same item count.");const n=this._textures;for(;n.length<i;){const u=new Gr;n.push(u)}for(;n.length>i;)n.pop();for(let u=0,o=i;u<o;u++)n[u].updateFrom(e[u]);const r=n[0].image,c=this.image;(r.width!==c.width||r.height!==c.height||r.depth!==i)&&(c.width=r.width,c.height=r.height,c.depth=i,c.data=new Float32Array(c.width*c.height*c.depth*4));const{data:l,width:h,height:f}=c;for(let u=0,o=i;u<o;u++){const m=n[u],y=h*f*4*u;let d=e[u].itemSize;d===3&&(d=4),gr(m.image.data,d,l,4,y)}this.dispose(),this.needsUpdate=!0}}class Sa extends Ta{updateNormalAttribute(e){this.updateAttribute(0,e)}updateTangentAttribute(e){this.updateAttribute(1,e)}updateUvAttribute(e){this.updateAttribute(2,e)}updateColorAttribute(e){this.updateAttribute(3,e)}updateFrom(e,t,i,n){this.setAttributes([e,t,i,n])}}function ki(s,e){return s.uuid<e.uuid?1:s.uuid>e.uuid?-1:0}function Mi(s){return`${s.source.uuid}:${s.colorSpace}`}function _a(s){const e=new Set,t=[];for(let i=0,n=s.length;i<n;i++){const a=s[i],r=Mi(a);e.has(r)||(e.add(r),t.push(a))}return t}function Aa(s){const e=s.map(i=>i.iesMap||null).filter(i=>i),t=new Set(e);return Array.from(t).sort(ki)}function Ra(s){const e=new Set;for(let i=0,n=s.length;i<n;i++){const a=s[i];for(const r in a){const c=a[r];c&&c.isTexture&&e.add(c)}}const t=Array.from(e);return _a(t).sort(ki)}function Ma(s){const e=[];return s.traverse(t=>{t.visible&&(t.isRectAreaLight||t.isSpotLight||t.isPointLight||t.isDirectionalLight)&&e.push(t)}),e.sort(ki)}const Ni=47,vr=Ni*4;class Ia{constructor(){this._features={}}isUsed(e){return e in this._features}setUsed(e,t=!0){t===!1?delete this._features[e]:this._features[e]=!0}reset(){this._features={}}}class Ca extends ue{constructor(){super(new Float32Array(4),1,1),this.format=X,this.type=Q,this.wrapS=De,this.wrapT=De,this.minFilter=G,this.magFilter=G,this.generateMipmaps=!1,this.features=new Ia}updateFrom(e,t){function i(p,y,d=-1){if(y in p&&p[y]){const g=Mi(p[y]);return u[g]}else return d}function n(p,y,d){return y in p?p[y]:d}function a(p,y,d,g){const v=p[y]&&p[y].isTexture?p[y]:null;if(v){v.matrixAutoUpdate&&v.updateMatrix();const x=v.matrix.elements;let b=0;d[g+b++]=x[0],d[g+b++]=x[3],d[g+b++]=x[6],b++,d[g+b++]=x[1],d[g+b++]=x[4],d[g+b++]=x[7],b++}return 8}let r=0;const c=e.length*Ni,l=Math.ceil(Math.sqrt(c))||1,{image:h,features:f}=this,u={};for(let p=0,y=t.length;p<y;p++)u[Mi(t[p])]=p;h.width!==l&&(this.dispose(),h.data=new Float32Array(l*l*4),h.width=l,h.height=l);const o=h.data;f.reset();for(let p=0,y=e.length;p<y;p++){const d=e[p];if(d.isFogVolumeMaterial){f.setUsed("FOG");for(let x=0;x<vr;x++)o[r+x]=0;o[r+0*4+0]=d.color.r,o[r+0*4+1]=d.color.g,o[r+0*4+2]=d.color.b,o[r+2*4+3]=n(d,"emissiveIntensity",0),o[r+3*4+0]=d.emissive.r,o[r+3*4+1]=d.emissive.g,o[r+3*4+2]=d.emissive.b,o[r+13*4+1]=d.density,o[r+13*4+3]=0,o[r+14*4+2]=4,r+=vr;continue}o[r++]=d.color.r,o[r++]=d.color.g,o[r++]=d.color.b,o[r++]=i(d,"map"),o[r++]=n(d,"metalness",0),o[r++]=i(d,"metalnessMap"),o[r++]=n(d,"roughness",0),o[r++]=i(d,"roughnessMap"),o[r++]=n(d,"ior",1.5),o[r++]=n(d,"transmission",0),o[r++]=i(d,"transmissionMap"),o[r++]=n(d,"emissiveIntensity",0),"emissive"in d?(o[r++]=d.emissive.r,o[r++]=d.emissive.g,o[r++]=d.emissive.b):(o[r++]=0,o[r++]=0,o[r++]=0),o[r++]=i(d,"emissiveMap"),o[r++]=i(d,"normalMap"),"normalScale"in d?(o[r++]=d.normalScale.x,o[r++]=d.normalScale.y):(o[r++]=1,o[r++]=1),o[r++]=n(d,"clearcoat",0),o[r++]=i(d,"clearcoatMap"),o[r++]=n(d,"clearcoatRoughness",0),o[r++]=i(d,"clearcoatRoughnessMap"),o[r++]=i(d,"clearcoatNormalMap"),"clearcoatNormalScale"in d?(o[r++]=d.clearcoatNormalScale.x,o[r++]=d.clearcoatNormalScale.y):(o[r++]=1,o[r++]=1),r++,o[r++]=n(d,"sheen",0),"sheenColor"in d?(o[r++]=d.sheenColor.r,o[r++]=d.sheenColor.g,o[r++]=d.sheenColor.b):(o[r++]=0,o[r++]=0,o[r++]=0),o[r++]=i(d,"sheenColorMap"),o[r++]=n(d,"sheenRoughness",0),o[r++]=i(d,"sheenRoughnessMap"),o[r++]=i(d,"iridescenceMap"),o[r++]=i(d,"iridescenceThicknessMap"),o[r++]=n(d,"iridescence",0),o[r++]=n(d,"iridescenceIOR",1.3);const g=n(d,"iridescenceThicknessRange",[100,400]);o[r++]=g[0],o[r++]=g[1],"specularColor"in d?(o[r++]=d.specularColor.r,o[r++]=d.specularColor.g,o[r++]=d.specularColor.b):(o[r++]=1,o[r++]=1,o[r++]=1),o[r++]=i(d,"specularColorMap"),o[r++]=n(d,"specularIntensity",1),o[r++]=i(d,"specularIntensityMap");const v=n(d,"thickness",0)===0&&n(d,"attenuationDistance",1/0)===1/0;if(o[r++]=Number(v),r++,"attenuationColor"in d?(o[r++]=d.attenuationColor.r,o[r++]=d.attenuationColor.g,o[r++]=d.attenuationColor.b):(o[r++]=1,o[r++]=1,o[r++]=1),o[r++]=n(d,"attenuationDistance",1/0),o[r++]=i(d,"alphaMap"),o[r++]=d.opacity,o[r++]=d.alphaTest,!v&&d.transmission>0)o[r++]=0;else switch(d.side){case mi:o[r++]=1;break;case Cr:o[r++]=-1;break;case Ii:o[r++]=0;break}o[r++]=Number(n(d,"matte",!1)),o[r++]=Number(n(d,"castShadow",!0)),o[r++]=Number(d.vertexColors)|Number(d.flatShading)<<1,o[r++]=Number(d.transparent),r+=a(d,"map",o,r),r+=a(d,"metalnessMap",o,r),r+=a(d,"roughnessMap",o,r),r+=a(d,"transmissionMap",o,r),r+=a(d,"emissiveMap",o,r),r+=a(d,"normalMap",o,r),r+=a(d,"clearcoatMap",o,r),r+=a(d,"clearcoatNormalMap",o,r),r+=a(d,"clearcoatRoughnessMap",o,r),r+=a(d,"sheenColorMap",o,r),r+=a(d,"sheenRoughnessMap",o,r),r+=a(d,"iridescenceMap",o,r),r+=a(d,"iridescenceThicknessMap",o,r),r+=a(d,"specularColorMap",o,r),r+=a(d,"specularIntensityMap",o,r),r+=a(d,"alphaMap",o,r)}const m=Ei(o.buffer);return this.hash!==m?(this.hash=m,this.needsUpdate=!0,!0):!1}}const xr=new be;function Pa(s){return s?`${s.uuid}:${s.version}`:null}function Fa(s,e){for(const t in e)t in s&&(s[t]=e[t])}class yr extends ds{constructor(e,t,i){const n={format:X,type:pi,minFilter:pe,magFilter:pe,wrapS:Pe,wrapT:Pe,generateMipmaps:!1,...i};super(e,t,1,n),Fa(this.texture,n),this.texture.setTextures=(...r)=>{this.setTextures(...r)},this.hashes=[null];const a=new nt(new Da);this.fsQuad=a}setTextures(e,t,i=this.width,n=this.height){const a=e.getRenderTarget(),r=e.toneMapping,c=e.getClearAlpha();e.getClearColor(xr);const l=t.length||1;(i!==this.width||n!==this.height||this.depth!==l)&&(this.setSize(i,n,l),this.hashes=new Array(l).fill(null)),e.setClearColor(0,0),e.toneMapping=ms;const h=this.fsQuad,f=this.hashes;let u=!1;for(let o=0,m=l;o<m;o++){const p=t[o],y=Pa(p);p&&(f[o]!==y||p.isWebGLRenderTarget)&&(p.matrixAutoUpdate=!1,p.matrix.identity(),h.material.map=p,e.setRenderTarget(this,o),h.render(e),p.updateMatrix(),p.matrixAutoUpdate=!0,f[o]=y,u=!0)}return h.material.map=null,e.setClearColor(xr,c),e.setRenderTarget(a),e.toneMapping=r,u}dispose(){super.dispose(),this.fsQuad.dispose()}}class Da extends jt{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}constructor(){super({uniforms:{map:{value:null}},vertexShader:`
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
			`})}}function Ea(s,e=Math.random()){for(let t=s.length-1;t>0;t--){const i=Math.floor(e()*(t+1)),n=s[t];s[t]=s[i],s[i]=n}return s}class Ba{constructor(e,t,i=Math.random){const n=e**t,a=new Uint16Array(n);let r=n;for(let c=0;c<n;c++)a[c]=c;this.samples=new Float32Array(t),this.strataCount=e,this.reset=function(){for(let c=0;c<n;c++)a[c]=c;r=0},this.reshuffle=function(){r=0},this.next=function(){const{samples:c}=this;r>=a.length&&(Ea(a,i),this.reshuffle());let l=a[r++];for(let h=0;h<t;h++)c[h]=(l%e+i())/e,l=Math.floor(l/e);return c}}}class ka{constructor(e,t,i=Math.random){let n=0;for(const l of t)n+=l;const a=new Float32Array(n),r=[];let c=0;for(const l of t){const h=new Ba(e,l,i);h.samples=new Float32Array(a.buffer,c,h.samples.length),c+=h.samples.length*4,r.push(h)}this.samples=a,this.strataCount=e,this.next=function(){for(const l of r)l.next();return a},this.reshuffle=function(){for(const l of r)l.reshuffle()},this.reset=function(){for(const l of r)l.reset()}}}class Na{constructor(e=0){this.m=2147483648,this.a=1103515245,this.c=12345,this.seed=e}nextInt(){return this.seed=(this.a*this.seed+this.c)%this.m,this.seed}nextFloat(){return this.nextInt()/(this.m-1)}}class za extends ue{constructor(e=1,t=1,i=8){super(new Float32Array(1),1,1,X,Q),this.minFilter=G,this.magFilter=G,this.strata=i,this.sampler=null,this.generator=new Na,this.stableNoise=!1,this.random=()=>this.stableNoise?this.generator.nextFloat():Math.random(),this.init(e,t,i)}init(e=this.image.height,t=this.image.width,i=this.strata){const{image:n}=this;if(n.width===t&&n.height===e&&this.sampler!==null)return;const a=new Array(e*t).fill(4),r=new ka(i,a,this.random);n.width=t,n.height=e,n.data=r.samples,this.sampler=r,this.dispose(),this.next()}next(){this.sampler.next(),this.needsUpdate=!0}reset(){this.sampler.reset(),this.generator.seed=0}}function Oa(s,e=Math.random){for(let t=s.length-1;t>0;t--){const i=~~((e()-1e-6)*t),n=s[t];s[t]=s[i],s[i]=n}}function La(s,e){s.fill(0);for(let t=0;t<e;t++)s[t]=1}class br{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){const{score:e,binaryPattern:t}=this;let i=1/0,n=-1;for(let a=0,r=t.length;a<r;a++){if(t[a]!==0)continue;const c=e[a];c<i&&(i=c,n=a)}return n}findCluster(){const{score:e,binaryPattern:t}=this;let i=-1/0,n=-1;for(let a=0,r=t.length;a<r;a++){if(t[a]!==1)continue;const c=e[a];c>i&&(i=c,n=a)}return n}setSigma(e){if(e===this.sigma)return;const t=~~(Math.sqrt(10*2*e**2)+1),i=2*t+1,n=new Float32Array(i*i),a=e*e;for(let r=-t;r<=t;r++)for(let c=-t;c<=t;c++){const l=(t+c)*i+r+t,h=r*r+c*c;n[l]=Math.E**(-h/(2*a))}this.lookupTable=n,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){const{binaryPattern:e,score:t,size:i}=this;t.fill(0);for(let n=0,a=e.length;n<a;n++)if(e[n]===0){const r=~~(n/i),c=n-r*i;this.updateScore(c,r,1),e[n]=1}else e[n]=0}updateScore(e,t,i){const{size:n,score:a,lookupTable:r}=this,c=this.radius,l=2*c+1;for(let h=-c;h<=c;h++)for(let f=-c;f<=c;f++){const u=(c+f)*l+h+c,o=r[u];let m=e+h;m=m<0?n+m:m%n;let p=t+f;p=p<0?n+p:p%n;const y=p*n+m;a[y]+=i*o}}addPointIndex(e){this.binaryPattern[e]=1;const t=this.size,i=~~(e/t),n=e-i*t;this.updateScore(n,i,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;const t=this.size,i=~~(e/t),n=e-i*t;this.updateScore(n,i,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}}class Ha{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new br(1),this.savedSamples=new br(1)}generate(){const{samples:e,savedSamples:t,sigma:i,majorityPointsRatio:n,size:a}=this;e.resize(a),e.setSigma(i);const r=Math.floor(a*a*n),c=e.binaryPattern;La(c,r),Oa(c,this.random);for(let u=0,o=c.length;u<o;u++)c[u]===1&&e.addPointIndex(u);for(;;){const u=e.findCluster();e.removePointIndex(u);const o=e.findVoid();if(u===o){e.addPointIndex(u);break}e.addPointIndex(o)}const l=new Uint32Array(a*a);t.copy(e);let h;for(h=e.count-1;h>=0;){const u=e.findCluster();e.removePointIndex(u),l[u]=h,h--}const f=a*a;for(h=t.count;h<f/2;){const u=t.findVoid();t.addPointIndex(u),l[u]=h,h++}for(t.invert();h<f;){const u=t.findCluster();t.removePointIndex(u),l[u]=h,h++}return{data:l,maxValue:f}}}function Ua(s){return s>=3?4:s}function Wa(s){switch(s){case 1:return Vt;case 2:return Fr;default:return X}}class Va extends ue{constructor(e=64,t=1){super(new Float32Array(4),1,1,X,Q),this.minFilter=G,this.magFilter=G,this.size=e,this.channels=t,this.update()}update(){const e=this.channels,t=this.size,i=new Ha;i.channels=e,i.size=t;const n=Ua(e),a=Wa(n);(this.image.width!==t||a!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*n),this.format=a,this.dispose());const r=this.image.data;for(let c=0,l=e;c<l;c++){const h=i.generate(),f=h.data,u=h.maxValue;for(let o=0,m=f.length;o<m;o++){const p=f[o]/u;r[o*n+c]=p}}this.needsUpdate=!0}}const qa=`

	struct PhysicalCamera {

		float focusDistance;
		float anamorphicRatio;
		float bokehSize;
		int apertureBlades;
		float apertureRotation;

	};

`,ja=`

	struct EquirectHdrInfo {

		sampler2D marginalWeights;
		sampler2D conditionalWeights;
		sampler2D map;

		float totalSum;

	};

`,Ga=`

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

`,$a=`

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

`,Ya=`

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

`,Xa=`

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
`,Qa=`

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

`,Ka=`

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


`,Za=`

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

`,Ja=`

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

`,eo=`

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

`,to=`

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

`,Zr=`

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
`,wr=`

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
`,io=`

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

`,ro=`

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

`,so=`

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

`,no=`

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

`,ao=`

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

`,oo=`

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

`,co=`

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

`,lo=`

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

`,uo=`

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

`,fo=`

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

`,ho=`

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
`,mo=`

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

`,po=`

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

`;class go extends Bi{onBeforeRender(){this.setDefine("FEATURE_DOF",this.physicalCamera.bokehSize===0?0:1),this.setDefine("FEATURE_BACKGROUND_MAP",this.backgroundMap?1:0),this.setDefine("FEATURE_FOG",this.materials.features.isUsed("FOG")?1:0)}constructor(e){super({transparent:!0,depthWrite:!1,defines:{FEATURE_MIS:1,FEATURE_RUSSIAN_ROULETTE:1,FEATURE_DOF:1,FEATURE_BACKGROUND_MAP:0,FEATURE_FOG:1,RANDOM_TYPE:2,CAMERA_TYPE:0,DEBUG_MODE:0,ATTR_NORMAL:0,ATTR_TANGENT:1,ATTR_UV:2,ATTR_COLOR:3,MATERIAL_PIXELS:Ni},uniforms:{resolution:{value:new J},opacity:{value:1},bounces:{value:10},transmissiveBounces:{value:10},filterGlossyFactor:{value:0},physicalCamera:{value:new fa},cameraWorldMatrix:{value:new Z},invProjectionMatrix:{value:new Z},bvh:{value:new Dn},attributesArray:{value:new Sa},materialIndexAttribute:{value:new jr},materials:{value:new Ca},textures:{value:new yr().texture},lights:{value:new wa},iesProfiles:{value:new yr(360,180,{type:ye,wrapS:De,wrapT:De}).texture},environmentIntensity:{value:1},environmentRotation:{value:new Z},envMapInfo:{value:new ma},backgroundBlur:{value:0},backgroundMap:{value:null},backgroundAlpha:{value:1},backgroundIntensity:{value:1},backgroundRotation:{value:new Z},seed:{value:0},sobolTexture:{value:null},stratifiedTexture:{value:new za},stratifiedOffsetTexture:{value:new Va(64,1)}},vertexShader:`

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
				${kn}
				${zn}
				${Nn}

				// uniform structs
				${qa}
				${Ga}
				${ja}
				${$a}
				${Ya}

				// random
				#if RANDOM_TYPE == 2 	// Stratified List

					${io}

				#elif RANDOM_TYPE == 1 	// Sobol

					${wr}
					${Qr}
					${ca}

					#define rand(v) sobol(v)
					#define rand2(v) sobol2(v)
					#define rand3(v) sobol3(v)
					#define rand4(v) sobol4(v)

				#else 					// PCG

				${wr}

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
				${to}
				${Za}
				${Zr}
				${Ja}
				${eo}

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
				${Ka}
				${Xa}
				${Qa}

				${co}
				${no}
				${oo}
				${ao}
				${so}
				${ro}

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

				${mo}
				${uo}
				${po}
				${lo}
				${fo}
				${ho}

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

			`}),this.setValues(e)}}function*vo(){const{_renderer:s,_fsQuad:e,_blendQuad:t,_primaryTarget:i,_blendTargets:n,_sobolTarget:a,_subframe:r,alpha:c,material:l}=this,h=new st,f=new st,u=t.material;let[o,m]=n;for(;;){c?(u.opacity=this._opacityFactor/(this.samples+1),l.blending=yt,l.opacity=1):(l.opacity=this._opacityFactor/(this.samples+1),l.blending=Br);const[p,y,d,g]=r,v=i.width,x=i.height;l.resolution.set(v*d,x*g),l.sobolTexture=a.texture,l.stratifiedTexture.init(20,l.bounces+l.transmissiveBounces+5),l.stratifiedTexture.next(),l.seed++;const b=this.tiles.x||1,w=this.tiles.y||1,T=b*w,S=Math.ceil(v*d),A=Math.ceil(x*g),M=Math.floor(p*v),I=Math.floor(y*x),P=Math.ceil(S/b),R=Math.ceil(A/w);for(let F=0;F<w;F++)for(let E=0;E<b;E++){const k=s.getRenderTarget(),V=s.autoClear,te=s.getScissorTest();s.getScissor(h),s.getViewport(f);let fe=E,ae=F;if(!this.stableTiles){const Le=this._currentTile%(b*w);fe=Le%b,ae=~~(Le/b),this._currentTile=Le+1}const bt=w-ae-1;i.scissor.set(M+fe*P,I+bt*R,Math.min(P,S-fe*P),Math.min(R,A-bt*R)),i.viewport.set(M,I,S,A),s.setRenderTarget(i),s.setScissorTest(!0),s.autoClear=!1,e.render(s),s.setViewport(f),s.setScissor(h),s.setScissorTest(te),s.setRenderTarget(k),s.autoClear=V,c&&(u.target1=o.texture,u.target2=i.texture,s.setRenderTarget(m),t.render(s),s.setRenderTarget(k)),this.samples+=1/T,E===b-1&&F===w-1&&(this.samples=Math.round(this.samples)),yield}[o,m]=[m,o]}}const Tr=new be;class Sr{get material(){return this._fsQuad.material}set material(e){this._fsQuad.material.removeEventListener("recompilation",this._compileFunction),e.addEventListener("recompilation",this._compileFunction),this._fsQuad.material=e}get target(){return this._alpha?this._blendTargets[1]:this._primaryTarget}set alpha(e){this._alpha!==e&&(e||(this._blendTargets[0].dispose(),this._blendTargets[1].dispose()),this._alpha=e,this.reset())}get alpha(){return this._alpha}get isCompiling(){return!!this._compilePromise}constructor(e){this.camera=null,this.tiles=new J(3,3),this.stableNoise=!1,this.stableTiles=!0,this.samples=0,this._subframe=new st(0,0,1,1),this._opacityFactor=1,this._renderer=e,this._alpha=!1,this._fsQuad=new nt(new go),this._blendQuad=new nt(new aa),this._task=null,this._currentTile=0,this._compilePromise=null,this._sobolTarget=new ua().generate(e),this._primaryTarget=new vt(1,1,{format:X,type:Q,magFilter:G,minFilter:G}),this._blendTargets=[new vt(1,1,{format:X,type:Q,magFilter:G,minFilter:G}),new vt(1,1,{format:X,type:Q,magFilter:G,minFilter:G})],this._compileFunction=()=>{const t=this.compileMaterial(this._fsQuad._mesh);t.then(()=>{this._compilePromise===t&&(this._compilePromise=null)}),this._compilePromise=t},this.material.addEventListener("recompilation",this._compileFunction)}compileMaterial(){return this._renderer.compileAsync(this._fsQuad._mesh)}setCamera(e){const{material:t}=this;t.cameraWorldMatrix.copy(e.matrixWorld),t.invProjectionMatrix.copy(e.projectionMatrixInverse),t.physicalCamera.updateFrom(e);let i=0;e.projectionMatrix.elements[15]>0&&(i=1),e.isEquirectCamera&&(i=2),t.setDefine("CAMERA_TYPE",i),this.camera=e}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t),!(this._primaryTarget.width===e&&this._primaryTarget.height===t)&&(this._primaryTarget.setSize(e,t),this._blendTargets[0].setSize(e,t),this._blendTargets[1].setSize(e,t),this.reset())}getSize(e){e.x=this._primaryTarget.width,e.y=this._primaryTarget.height}dispose(){this._primaryTarget.dispose(),this._blendTargets[0].dispose(),this._blendTargets[1].dispose(),this._sobolTarget.dispose(),this._fsQuad.dispose(),this._blendQuad.dispose(),this._task=null}reset(){const{_renderer:e,_primaryTarget:t,_blendTargets:i}=this,n=e.getRenderTarget(),a=e.getClearAlpha();e.getClearColor(Tr),e.setRenderTarget(t),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(i[0]),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(i[1]),e.setClearColor(0,0),e.clearColor(),e.setClearColor(Tr,a),e.setRenderTarget(n),this.samples=0,this._task=null,this.material.stratifiedTexture.stableNoise=this.stableNoise,this.stableNoise&&(this.material.seed=0,this.material.stratifiedTexture.reset())}update(){this.material.onBeforeRender(),!this.isCompiling&&(this._task||(this._task=vo.call(this)),this._task.next())}}const ze=new J,_r=new J,Ht=new ps,Ut=new be;class xo extends ue{constructor(e=512,t=512){super(new Float32Array(e*t*4),e,t,X,Q,kr,Pe,De,pe,pe),this.generationCallback=null}update(){this.dispose(),this.needsUpdate=!0;const{data:e,width:t,height:i}=this.image;for(let n=0;n<t;n++)for(let a=0;a<i;a++){_r.set(t,i),ze.set(n/t,a/i),ze.x-=.5,ze.y=1-ze.y,Ht.theta=ze.x*2*Math.PI,Ht.phi=ze.y*Math.PI,Ht.radius=1,this.generationCallback(Ht,ze,_r,Ut);const c=4*(a*t+n);e[c+0]=Ut.r,e[c+1]=Ut.g,e[c+2]=Ut.b,e[c+3]=1}}copy(e){return super.copy(e),this.generationCallback=e.generationCallback,this}}const Ar=new D;class yo extends xo{constructor(e=512){super(e,e),this.topColor=new be().set(16777215),this.bottomColor=new be().set(0),this.exponent=2,this.generationCallback=(t,i,n,a)=>{Ar.setFromSpherical(t);const r=Ar.y*.5+.5;a.lerpColors(this.bottomColor,this.topColor,r**this.exponent)}}copy(e){return super.copy(e),this.topColor.copy(e.topColor),this.bottomColor.copy(e.bottomColor),this}}class bo extends jt{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}constructor(e){super({uniforms:{map:{value:null},opacity:{value:1}},vertexShader:`
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
			`}),this.setValues(e)}}class wo extends jt{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
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

				${Zr}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}}class Rr{constructor(e){this._renderer=e,this._quad=new nt(new wo)}generate(e,t=null,i=null){if(!e.isCubeTexture)throw new Error("CubeToEquirectMaterial: Source can only be cube textures.");const n=e.images[0],a=this._renderer,r=this._quad;t===null&&(t=4*n.height),i===null&&(i=2*n.height);const c=new vt(t,i,{type:Q,colorSpace:n.colorSpace}),l=n.height,h=Math.log2(l)-2,f=1/l,u=1/(3*Math.max(Math.pow(2,h),7*16));r.material.defines.CUBEUV_MAX_MIP=`${h}.0`,r.material.defines.CUBEUV_TEXEL_WIDTH=u,r.material.defines.CUBEUV_TEXEL_HEIGHT=f,r.material.uniforms.envMap.value=e,r.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,r.material.needsUpdate=!0;const o=a.getRenderTarget(),m=a.autoClear;a.autoClear=!0,a.setRenderTarget(c),r.render(a),a.setRenderTarget(o),a.autoClear=m;const p=new Uint16Array(t*i*4),y=new Float32Array(t*i*4);a.readRenderTargetPixels(c,0,0,t,i,y),c.dispose();for(let g=0,v=y.length;g<v;g++)p[g]=Se.toHalfFloat(y[g]);const d=new ue(p,t,i,X,ye);return d.minFilter=gs,d.magFilter=pe,d.wrapS=Pe,d.wrapT=Pe,d.mapping=kr,d.needsUpdate=!0,d}dispose(){this._quad.dispose()}}function To(s){return s.extensions.get("EXT_float_blend")}const tt=new J;class So{get multipleImportanceSampling(){return!!this._pathTracer.material.defines.FEATURE_MIS}set multipleImportanceSampling(e){this._pathTracer.material.setDefine("FEATURE_MIS",e?1:0)}get transmissiveBounces(){return this._pathTracer.material.transmissiveBounces}set transmissiveBounces(e){this._pathTracer.material.transmissiveBounces=e}get bounces(){return this._pathTracer.material.bounces}set bounces(e){this._pathTracer.material.bounces=e}get filterGlossyFactor(){return this._pathTracer.material.filterGlossyFactor}set filterGlossyFactor(e){this._pathTracer.material.filterGlossyFactor=e}get samples(){return this._pathTracer.samples}get target(){return this._pathTracer.target}get tiles(){return this._pathTracer.tiles}get stableNoise(){return this._pathTracer.stableNoise}set stableNoise(e){this._pathTracer.stableNoise=e}get isCompiling(){return!!this._pathTracer.isCompiling}constructor(e){this._renderer=e,this._generator=new ia,this._pathTracer=new Sr(e),this._queueReset=!1,this._clock=new vs,this._compilePromise=null,this._lowResPathTracer=new Sr(e),this._lowResPathTracer.tiles.set(1,1),this._quad=new nt(new bo({map:null,transparent:!0,blending:yt,premultipliedAlpha:e.getContextAttributes().premultipliedAlpha})),this._materials=null,this._previousEnvironment=null,this._previousBackground=null,this._internalBackground=null,this.renderDelay=100,this.minSamples=5,this.fadeDuration=500,this.enablePathTracing=!0,this.pausePathTracing=!1,this.dynamicLowRes=!1,this.lowResScale=.25,this.renderScale=1,this.synchronizeRenderSize=!0,this.rasterizeScene=!0,this.renderToCanvas=!0,this.textureSize=new J(1024,1024),this.rasterizeSceneCallback=(t,i)=>{this._renderer.render(t,i)},this.renderToCanvasCallback=(t,i,n)=>{const a=i.autoClear;i.autoClear=!1,n.render(i),i.autoClear=a},this.setScene(new xs,new Er)}setBVHWorker(e){this._generator.setBVHWorker(e)}setScene(e,t,i={}){e.updateMatrixWorld(!0),t.updateMatrixWorld();const n=this._generator;if(n.setObjects(e),this._buildAsync)return n.generateAsync(i.onProgress).then(a=>this._updateFromResults(e,t,a));{const a=n.generate();return this._updateFromResults(e,t,a)}}setSceneAsync(...e){this._buildAsync=!0;const t=this.setScene(...e);return this._buildAsync=!1,t}setCamera(e){this.camera=e,this.updateCamera()}updateCamera(){const e=this.camera;e.updateMatrixWorld(),this._pathTracer.setCamera(e),this._lowResPathTracer.setCamera(e),this.reset()}updateMaterials(){const e=this._pathTracer.material,t=this._renderer,i=this._materials,n=this.textureSize,a=Ra(i);e.textures.setTextures(t,a,n.x,n.y),e.materials.updateFrom(i,a),this.reset()}updateLights(){const e=this.scene,t=this._renderer,i=this._pathTracer.material,n=Ma(e),a=Aa(n);i.lights.updateFrom(n,a),i.iesProfiles.setTextures(t,a),this.reset()}updateEnvironment(){const e=this.scene,t=this._pathTracer.material;if(this._internalBackground&&(this._internalBackground.dispose(),this._internalBackground=null),t.backgroundBlur=e.backgroundBlurriness,t.backgroundIntensity=e.backgroundIntensity??1,t.backgroundRotation.makeRotationFromEuler(e.backgroundRotation).invert(),e.background===null)t.backgroundMap=null,t.backgroundAlpha=0;else if(e.background.isColor){this._colorBackground=this._colorBackground||new yo(16);const i=this._colorBackground;i.topColor.equals(e.background)||(i.topColor.set(e.background),i.bottomColor.set(e.background),i.update()),t.backgroundMap=i,t.backgroundAlpha=1}else if(e.background.isCubeTexture){if(e.background!==this._previousBackground){const i=new Rr(this._renderer).generate(e.background);this._internalBackground=i,t.backgroundMap=i,t.backgroundAlpha=1}}else t.backgroundMap=e.background,t.backgroundAlpha=1;if(t.environmentIntensity=e.environment!==null?e.environmentIntensity??1:0,t.environmentRotation.makeRotationFromEuler(e.environmentRotation).invert(),this._previousEnvironment!==e.environment&&e.environment!==null)if(e.environment.isCubeTexture){const i=new Rr(this._renderer).generate(e.environment);t.envMapInfo.updateFrom(i)}else t.envMapInfo.updateFrom(e.environment);this._previousEnvironment=e.environment,this._previousBackground=e.background,this.reset()}_updateFromResults(e,t,i){const{materials:n,geometry:a,bvh:r,bvhChanged:c,needsMaterialIndexUpdate:l}=i;this._materials=n;const f=this._pathTracer.material;return c&&(f.bvh.updateFrom(r),f.attributesArray.updateFrom(a.attributes.normal,a.attributes.tangent,a.attributes.uv,a.attributes.color)),l&&f.materialIndexAttribute.updateFrom(a.attributes.materialIndex),this._previousScene=e,this.scene=e,this.camera=t,this.updateCamera(),this.updateMaterials(),this.updateEnvironment(),this.updateLights(),i}renderSample(){const e=this._lowResPathTracer,t=this._pathTracer,i=this._renderer,n=this._clock,a=this._quad;this._updateScale(),this._queueReset&&(t.reset(),e.reset(),this._queueReset=!1,a.material.opacity=0,n.start());const r=n.getDelta()*1e3,c=n.getElapsedTime()*1e3;if(!this.pausePathTracing&&this.enablePathTracing&&this.renderDelay<=c&&!this.isCompiling&&t.update(),t.alpha=t.material.backgroundAlpha!==1||!To(i),e.alpha=t.alpha,this.renderToCanvas){const l=this._renderer,h=this.minSamples;if(c>=this.renderDelay&&this.samples>=this.minSamples&&(this.fadeDuration!==0?a.material.opacity=Math.min(a.material.opacity+r/this.fadeDuration,1):a.material.opacity=1),!this.enablePathTracing||this.samples<h||a.material.opacity<1){if(this.dynamicLowRes&&!this.isCompiling){e.samples<1&&(e.material=t.material,e.update());const f=a.material.opacity;a.material.opacity=1-a.material.opacity,a.material.map=e.target.texture,a.render(l),a.material.opacity=f}(!this.dynamicLowRes&&this.rasterizeScene||this.dynamicLowRes&&this.isCompiling)&&this.rasterizeSceneCallback(this.scene,this.camera)}this.enablePathTracing&&a.material.opacity>0&&(a.material.opacity<1&&(a.material.blending=this.dynamicLowRes?ys:Br),a.material.map=t.target.texture,this.renderToCanvasCallback(t.target,l,a),a.material.blending=yt)}}reset(){this._queueReset=!0,this._pathTracer.samples=0}dispose(){this._quad.dispose(),this._quad.material.dispose(),this._pathTracer.dispose()}_updateScale(){if(this.synchronizeRenderSize){this._renderer.getDrawingBufferSize(tt);const e=Math.floor(this.renderScale*tt.x),t=Math.floor(this.renderScale*tt.y);if(this._pathTracer.getSize(tt),tt.x!==e||tt.y!==t){const i=this.lowResScale;this._pathTracer.setSize(e,t),this._lowResPathTracer.setSize(Math.floor(e*i),Math.floor(t*i))}}}}const Mr=[{id:"fit",label:"Taille Écran",width:0,height:0},{id:"1080p",label:"Full HD (1920×1080)",width:1920,height:1080},{id:"2k",label:"2K QHD (2560×1440)",width:2560,height:1440},{id:"square",label:"Carré 1:1 (1440×1440)",width:1440,height:1440},{id:"portrait",label:"Portrait 9:16 (1080×1920)",width:1080,height:1920}];function Ao({scene:s,camera:e,onClose:t}){const i=L.useRef(null),n=L.useRef(null),a=L.useRef(null),r=L.useRef(null),c=L.useRef(null),l=L.useRef(null),h=L.useRef(new Map),f=L.useRef([]),u=L.useRef([]),[o,m]=L.useState("fit"),[p,y]=L.useState(40),[d,g]=L.useState(6),[v,x]=L.useState(1),[b,w]=L.useState(!1),[T,S]=L.useState(350),[A,M]=L.useState(2.8),[I,P]=L.useState(0),[R,F]=L.useState(!1),[E,k]=L.useState(!0),[V,te]=L.useState(null),[fe,ae]=L.useState(0),[bt,Le]=L.useState(0),[Yt,zi]=L.useState(!1),[Xt,Oi]=L.useState({x:0,y:0,visible:!1});L.useEffect(()=>{const C=z=>{(z.key==="Escape"||z.key==="F10")&&(z.preventDefault(),t())};return window.addEventListener("keydown",C),()=>window.removeEventListener("keydown",C)},[t]),L.useEffect(()=>{try{const C=new Gi;C.setFromCamera(new J(0,0),e),C.layers.mask=e.layers.mask;const z=C.intersectObjects(s.children,!0);z.length>0&&S(Math.round(z[0].distance))}catch{}},[s,e]);const Li=L.useCallback(()=>{const C=[],z=new Map;s.traverse(B=>{var Re,Ue,wt;const O=(B.name||"").toLowerCase();if(O.includes("skysphere")||O.includes("skydome")||O.includes("spacebackdrop")||O.includes("sunsphere")||B.userData&&B.userData.isSky){B.traverse(N=>{N.visible&&(N.visible=!1,C.push(N))});return}if(B.isPoints||B.isLine||B.isLineSegments||B.isSprite){B.visible&&(B.visible=!1,C.push(B));return}if((B.type.includes("Helper")||B.isSkeletonHelper||O.includes("helper")||O.includes("gizmo")||O.includes("grid")||O.includes("landingstrip")||O.includes("collision")||O.includes("aizone")||O.includes("hoveroverlay")||O.includes("edgehover")||O.includes("measurement")||O.includes("skeletonhelper"))&&B.visible){B.traverse(N=>{N.visible&&(N.visible=!1,C.push(N))});return}if(B.isLight){const N=B;(!N.color||typeof N.color.r!="number")&&(N.color=new be(16777215))}if(B.isMesh){const N=B;if(B.type==="Reflector"||typeof B.getRenderTarget=="function"||B.isReflector||((Re=N.material)==null?void 0:Re.name)==="ReflectorShader"||((Ue=N.material)==null?void 0:Ue.uniforms)&&"textureMatrix"in N.material.uniforms||O.includes("reflector")||O.includes("mirror")||O.includes("miroir")||B.parent&&((B.parent.name||"").toLowerCase().includes("reflector")||(B.parent.name||"").toLowerCase().includes("mirror"))){z.set(N,N.material),N.material=new We({color:16777215,roughness:0,metalness:1,side:Ii});return}if(!N.geometry||!((wt=N.geometry.attributes)!=null&&wt.position)||N.geometry.attributes.position.count===0){N.visible&&(B.visible=!1,C.push(B));return}if(!N.material){z.set(N,N.material),N.material=new We({color:13421772,roughness:.5});return}const ve=Array.isArray(N.material),he=ve?N.material:[N.material];let xe=!1;const Vi=he.map(W=>W?W.visible===!1||W.opacity===0?(xe=!0,new We({transparent:!0,opacity:0,roughness:1,depthWrite:!1})):!W.color||typeof W.color.r!="number"?(xe=!0,new We({color:13684944,roughness:.5,metalness:.1})):W.type==="MeshBasicMaterial"&&!W.isMeshStandardMaterial?(xe=!0,new We({color:W.color,map:W.map??null,transparent:W.transparent,opacity:W.opacity,roughness:.8,metalness:.1})):("emissive"in W&&(!W.emissive||typeof W.emissive.r!="number")&&(W.emissive=new be(0)),"sheenColor"in W&&(!W.sheenColor||typeof W.sheenColor.r!="number")&&(W.sheenColor=new be(0)),"specularColor"in W&&(!W.specularColor||typeof W.specularColor.r!="number")&&(W.specularColor=new be(16777215)),"attenuationColor"in W&&(!W.attenuationColor||typeof W.attenuationColor.r!="number")&&(W.attenuationColor=new be(16777215)),W):(xe=!0,new We({color:13684944,roughness:.5})));xe&&(z.set(N,N.material),N.material=ve?Vi:Vi[0])}});const U=[],$=new $i(11585768,.7);$.position.set(-500,600,-300),$.name="raytracing-fill-1",s.add($),U.push($);const H=new $i(16772829,.5);H.position.set(150,400,200),H.name="raytracing-fill-2",s.add(H),U.push(H),u.current=U,f.current=C,h.current=z},[s]),Hi=L.useCallback(()=>{f.current.forEach(C=>{C.visible=!0}),f.current=[],h.current.forEach((C,z)=>{z.material=C}),h.current.clear(),u.current.forEach(C=>{s.remove(C),C.dispose()}),u.current=[],s.traverse(C=>{var z;if(C.isMesh){const U=C.geometry;if(U&&U.boundsTree){try{(z=U.disposeBoundsTree)==null||z.call(U)}catch{}delete U.boundsTree}}})},[s]),Ui=L.useCallback(()=>{if(!n.current)return{width:1280,height:720};const C=n.current.getBoundingClientRect(),z=Math.max(300,C.width-40),U=Math.max(200,C.height-40),$=Mr.find(He=>He.id===o);if(!$||$.id==="fit")return{width:Math.round(z),height:Math.round(U)};const H=$.width/$.height;let B=z,O=B/H;return O>U&&(O=U,B=O*H),{width:Math.round(B),height:Math.round(O),realWidth:$.width,realHeight:$.height}},[o]);L.useEffect(()=>{const C=i.current;if(!C)return;Li(),k(!0),te(null),P(0),ae(0);const{width:z,height:U}=Ui();C.width=z,C.height=U;const $=new bs({canvas:C,antialias:!1,powerPreference:"high-performance",preserveDrawingBuffer:!0});$.toneMapping=ws,$.toneMappingExposure=v,$.setSize(z,U,!1),r.current=$;const H=new Kr(e.fov,z/U,e.near,e.far);H.position.copy(e.position),H.quaternion.copy(e.quaternion),H.focusDistance=T,H.fStop=A,H.bokehSize=b?H.getFocalLength()/H.fStop:0,H.updateProjectionMatrix(),H.updateMatrixWorld(),H.layers.mask=e.layers.mask,H.layers.enable(Ts),H.layers.enable(Ss),H.layers.enable(_s),H.layers.enable(As),H.layers.enable(Rs),H.layers.enable(Ms),H.layers.enable(Is),H.layers.enable(Cs),c.current=H;const B=new So($);B.bounces=d,B.transmissiveBounces=d,B.filterGlossyFactor=.5,B.renderToCanvas=!0,B.fadeDuration=0,B.minSamples=1,B.renderDelay=0,B.dynamicLowRes=!0,B.lowResScale=.25,B.textureSize.set(1024,1024);let O=!1;const He=setTimeout(()=>{if(!O)try{console.log("[Raytracing] Construction du BVH pour la scène..."),B.setScene(s,H),a.current=B,k(!1),console.log("[Raytracing] Scène prête ! Démarrage de l'accumulation.")}catch(ve){console.error("[Raytracing] Erreur initialisation WebGLPathTracer:",ve),te((ve==null?void 0:ve.message)||"Échec de la génération du maillage BVH."),k(!1)}},60);let Re=performance.now(),Ue=0,wt=performance.now(),N=0;const Kt=()=>{if(a.current&&!R){const ve=a.current.samples;if(ve<p){try{a.current.renderSample(),Ue++}catch(xe){console.error("[Raytracing] Erreur renderSample:",xe),te((xe==null?void 0:xe.message)||"Erreur pendant le calcul du raytracing."),F(!0);return}const he=performance.now();he-N>=120&&(P(ve),N=he),he-Re>=1e3&&(Le(Math.round(Ue*1e3/(he-Re))),Ue=0,Re=he,ae(Math.round((he-wt)/1e3)))}else{const he=performance.now();he-N>=250&&(P(p),Le(0),N=he)}}l.current=requestAnimationFrame(Kt)};return l.current=requestAnimationFrame(Kt),()=>{O=!0,clearTimeout(He),l.current&&cancelAnimationFrame(l.current),Hi();try{B.dispose(),$.dispose()}catch{}a.current=null,r.current=null}},[s,e,o,Li,Hi,Ui]),L.useEffect(()=>{if(!c.current||!a.current)return;const C=c.current;C.focusDistance=T,C.fStop=A,C.bokehSize=b?C.getFocalLength()/C.fStop:0,C.updateProjectionMatrix(),C.updateMatrixWorld(),a.current.updateCamera(),P(0)},[b,T,A]),L.useEffect(()=>{var C;r.current&&(r.current.toneMappingExposure=v,(C=a.current)==null||C.reset(),P(0))},[v]),L.useEffect(()=>{a.current&&(a.current.bounces=d,a.current.transmissiveBounces=d,a.current.reset(),P(0))},[d]);const Jr=C=>{const z=i.current;if(!z)return;const U=z.getBoundingClientRect(),$=(C.clientX-U.left)/U.width*2-1,H=-((C.clientY-U.top)/U.height*2-1),B=new Gi;B.setFromCamera(new J($,H),e),c.current&&(B.layers.mask=c.current.layers.mask);const O=B.intersectObjects(s.children,!0);if(O.length>0){const He=Math.round(O[0].distance);S(He),w(!0),Oi({x:C.clientX-U.left,y:C.clientY-U.top,visible:!0}),setTimeout(()=>{Oi(Re=>({...Re,visible:!1}))},700)}},es=()=>{const C=i.current;C&&C.toBlob(z=>{if(!z)return;const U=URL.createObjectURL(z),B=`photo-raytracing-${new Date().toISOString().replace(/[:.]/g,"-").slice(0,19)}.png`,O=document.createElement("a");O.href=U,O.download=B,document.body.appendChild(O),O.click(),document.body.removeChild(O),URL.revokeObjectURL(U)},"image/png")},ts=async()=>{const C=i.current;if(C)try{C.toBlob(async z=>{z&&(await navigator.clipboard.write([new ClipboardItem({"image/png":z})]),zi(!0),setTimeout(()=>zi(!1),2500))},"image/png")}catch(z){console.warn("Presse-papier non supporté pour les blobs:",z)}},Qt=()=>{var C;(C=a.current)==null||C.reset(),P(0),ae(0)},is=Math.min(100,Math.round(I/p*100)),Wi=I>=p;return _.jsxs("div",{className:"position-fixed top-0 start-0 w-100 h-100 d-flex flex-column text-white",style:{zIndex:1e4,backgroundColor:"rgba(5, 7, 15, 0.88)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"},children:[_.jsxs("div",{className:"d-flex align-items-center justify-content-between px-3 py-2 border-bottom",style:{borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(0, 0, 0, 0.4)"},children:[_.jsxs("div",{className:"d-flex align-items-center gap-2",children:[_.jsx("span",{className:"fs-5",children:"📸"}),_.jsxs("div",{children:[_.jsxs("h6",{className:"mb-0 fw-bold text-uppercase d-flex align-items-center gap-2",style:{letterSpacing:"0.08em"},children:["Mode Photo Raytracing Ultra-Réaliste",_.jsx("span",{className:"badge bg-warning text-dark font-monospace fw-bold",style:{fontSize:"10px"},children:"GPU Path Tracing"})]}),_.jsx("small",{className:"text-white-50",style:{fontSize:"11px"},children:"Illumination globale physique • Rebonds de lumière • Profondeur de champ Bokeh"})]})]}),_.jsxs("div",{className:"d-flex align-items-center gap-2",children:[_.jsxs("button",{onClick:Qt,className:"btn btn-sm btn-outline-light d-flex align-items-center gap-1.5",title:"Réinitialiser l'accumulation des rayons",children:["🔄 ",_.jsx("span",{children:"Relancer"})]}),_.jsxs("button",{onClick:t,className:"btn btn-sm btn-danger px-3 fw-bold d-flex align-items-center gap-1",title:"Fermer (Échap)",children:["✕ ",_.jsx("span",{children:"Quitter"})]})]})]}),_.jsxs("div",{className:"d-flex flex-grow-1 overflow-hidden",children:[_.jsx("div",{ref:n,className:"flex-grow-1 d-flex flex-column align-items-center justify-content-center p-3 position-relative overflow-hidden",style:{background:"radial-gradient(circle at center, #111528 0%, #05070f 100%)"},children:_.jsxs("div",{className:"position-relative shadow-lg border border-secondary border-opacity-25 rounded overflow-hidden",children:[_.jsx("canvas",{ref:i,onClick:Jr,style:{display:"block",cursor:b?"crosshair":"default",maxWidth:"100%",maxHeight:"calc(100vh - 180px)",objectFit:"contain"},title:b?"Cliquez sur n'importe quel point pour ajuster l'autofocus 🎯":void 0}),E&&_.jsxs("div",{className:"position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center",style:{background:"rgba(5, 7, 15, 0.94)",zIndex:10},children:[_.jsx("div",{className:"spinner-border text-warning mb-3",role:"status",style:{width:"3rem",height:"3rem"}}),_.jsx("h5",{className:"fw-bold",children:"Génération du maillage BVH spatial…"}),_.jsx("p",{className:"text-white-50 small mb-0",children:"Préparation des géométries et des textures physiques"})]}),V&&_.jsxs("div",{className:"position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center",style:{background:"rgba(25, 5, 5, 0.95)",zIndex:11},children:[_.jsx("div",{className:"fs-1 mb-2",children:"⚠️"}),_.jsx("h5",{className:"fw-bold text-danger",children:"Erreur Raytracing"}),_.jsx("p",{className:"text-white-50 small mb-3",children:V}),_.jsx("button",{onClick:Qt,className:"btn btn-warning btn-sm",children:"Réessayer"})]}),Xt.visible&&_.jsx("div",{className:"position-absolute border border-warning rounded-circle",style:{left:Xt.x-20,top:Xt.y-20,width:40,height:40,pointerEvents:"none",animation:"pulse 0.6s ease-out",boxShadow:"0 0 10px rgba(255, 193, 7, 0.8)"}}),!E&&!V&&_.jsxs("div",{className:"position-absolute bottom-0 start-0 w-100 p-2 d-flex align-items-center justify-content-between text-white",style:{background:"linear-gradient(to top, rgba(0,0,0,0.85), transparent)",fontSize:"12px",pointerEvents:"none"},children:[_.jsxs("div",{className:"d-flex align-items-center gap-2",children:[_.jsx("span",{className:`badge ${Wi?"bg-success":"bg-primary"}`,children:Wi?"✓ Rendu terminé":"⚡ Calcul en cours…"}),_.jsxs("span",{children:["Échantillon : ",_.jsx("strong",{children:I})," / ",p," (",is,"%)"]})]}),_.jsxs("div",{className:"d-flex align-items-center gap-3 text-white-50",children:[_.jsxs("span",{children:["Temps : ",fe,"s"]}),_.jsxs("span",{children:["Cadence : ",bt," éch/s"]})]})]})]})}),_.jsxs("div",{className:"border-start p-3 d-flex flex-column gap-3 overflow-auto",style:{width:"320px",borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(10, 14, 25, 0.75)",scrollbarWidth:"thin"},children:[_.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[_.jsxs("h6",{className:"fw-bold mb-2 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[_.jsx("span",{children:"⚙️"})," Qualité du Raytracing"]}),_.jsxs("div",{className:"mb-2",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Échantillons cibles (Samples)"}),_.jsx("span",{className:"fw-bold text-info",children:p})]}),_.jsx("div",{className:"btn-group btn-group-sm w-100 mb-2",children:[40,100,250,500].map(C=>_.jsx("button",{type:"button",onClick:()=>{y(C),I>=C&&Qt()},className:`btn ${p===C?"btn-primary":"btn-outline-secondary text-white"}`,style:{fontSize:"10px"},children:C},C))})]}),_.jsxs("div",{className:"mb-2",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Rebonds de lumière (Bounces)"}),_.jsx("span",{className:"fw-bold text-info",children:d})]}),_.jsx("input",{type:"range",className:"form-range",min:"2",max:"12",step:"1",value:d,onChange:C=>g(parseInt(C.target.value,10))})]}),_.jsxs("div",{className:"mb-1",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Exposition lumineuse"}),_.jsx("span",{className:"fw-bold text-info",children:v.toFixed(2)})]}),_.jsx("input",{type:"range",className:"form-range",min:"0.4",max:"2.2",step:"0.05",value:v,onChange:C=>x(parseFloat(C.target.value))})]})]}),_.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[_.jsxs("div",{className:"d-flex align-items-center justify-content-between mb-2",children:[_.jsxs("h6",{className:"fw-bold mb-0 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[_.jsx("span",{children:"🎯"})," Flou Bokeh / Profondeur"]}),_.jsx("div",{className:"form-check form-switch mb-0",children:_.jsx("input",{className:"form-check-input",type:"checkbox",role:"switch",checked:b,onChange:C=>w(C.target.checked)})})]}),b?_.jsxs(_.Fragment,{children:[_.jsxs("p",{className:"text-white-50 mb-2",style:{fontSize:"10px"},children:["💡 ",_.jsx("em",{children:"Cliquez sur le modèle ou un objet dans l'image pour régler l'autofocus instantanément !"})]}),_.jsxs("div",{className:"mb-2",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Distance de mise au point"}),_.jsxs("span",{className:"fw-bold text-info",children:[T," cm"]})]}),_.jsx("input",{type:"range",className:"form-range",min:"50",max:"1500",step:"5",value:T,onChange:C=>S(parseInt(C.target.value,10))})]}),_.jsxs("div",{className:"mb-1",children:[_.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[_.jsx("span",{children:"Ouverture optique (f-stop)"}),_.jsxs("span",{className:"fw-bold text-info",children:["f/",A]})]}),_.jsx("div",{className:"btn-group btn-group-sm w-100",children:[1.4,2,2.8,5.6].map(C=>_.jsxs("button",{type:"button",onClick:()=>M(C),className:`btn ${A===C?"btn-warning text-dark fw-bold":"btn-outline-secondary text-white"}`,style:{fontSize:"10px"},children:["f/",C]},C))})]})]}):_.jsx("small",{className:"text-white-50",style:{fontSize:"10px"},children:"Activez l'effet pour créer un arrière-plan flou d'appareil photo professionnel reflex."})]}),_.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[_.jsxs("h6",{className:"fw-bold mb-2 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[_.jsx("span",{children:"📐"})," Format & Résolution"]}),_.jsx("select",{className:"form-select form-select-sm bg-dark text-white border-secondary",style:{fontSize:"11px"},value:o,onChange:C=>m(C.target.value),children:Mr.map(C=>_.jsx("option",{value:C.id,children:C.label},C.id))})]}),_.jsxs("div",{className:"mt-auto d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25",children:[_.jsxs("button",{onClick:es,className:"btn btn-success fw-bold py-2 shadow d-flex align-items-center justify-content-center gap-2",title:"Télécharger l'image PNG",children:[_.jsx("span",{children:"💾"}),_.jsx("span",{children:"Télécharger la photo PNG"})]}),_.jsxs("button",{onClick:ts,className:`btn btn-sm ${Yt?"btn-info text-dark":"btn-outline-light"} py-1.5 d-flex align-items-center justify-content-center gap-2`,title:"Copier l'image dans le presse-papier",children:[_.jsx("span",{children:Yt?"✓":"📋"}),_.jsx("span",{children:Yt?"Copié dans le presse-papier !":"Copier l'image"})]}),_.jsx("button",{onClick:()=>F(C=>!C),className:"btn btn-sm btn-outline-secondary text-white py-1",children:R?"▶ Reprendre le rendu":"⏸ Suspendre le rendu"})]})]})]}),_.jsxs("div",{className:"px-3 py-1.5 border-top d-flex align-items-center justify-content-between",style:{borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(0, 0, 0, 0.5)",fontSize:"11px"},children:[_.jsxs("div",{className:"d-flex align-items-center gap-3",children:[_.jsxs("span",{children:["Raccourci : ",_.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"F10"})," pour basculer en mode photo"]}),_.jsx("span",{className:"text-white-50",children:"•"}),_.jsxs("span",{className:"text-white-50",children:["Fermer avec ",_.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"Échap"})]})]}),_.jsxs("div",{className:"text-white-50",children:["Moteur : ",_.jsx("strong",{children:"three-gpu-pathtracer"})," (GGX / PBR / MIS / BVH)"]})]})]})}export{Ao as RaytracingPhotoModal};
