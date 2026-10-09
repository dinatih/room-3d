import{bS as ye,V as k,bT as Ne,P as hs,bU as le,bV as Bt,ba as Xs,bW as fe,h as Ie,B as ms,D as zt,bX as Yi,bY as Ot,bZ as xe,b_ as X,b$ as Di,c0 as ae,c1 as Xi,c2 as Qs,c3 as Pr,c4 as Ks,c5 as se,c6 as Qi,c7 as ps,c8 as Zs,c9 as gs,ca as gi,cb as Ge,cc as Js,cd as yt,ce as en,b9 as vs,bk as xs,cf as Ki,S as xi,cg as bt,ch as Lt,ci as ys,cj as ke,ck as Me,cl as pe,cm as ze,cn as Oe,co as tn,cp as rn,cq as sn,cr as nn,C as Re,cs as an,ct as bs,cu as lr,cv as on,cw as cn,cx as ln,cy as un,cz as fn,r as z,cA as Fr,bB as Dr,o as At,br as Mt,cB as dn,cC as hn,aT as mn,cD as pn,bs as gn,bu as vn,bw as xn,bz as yn,bi as Yt,bD as bn,cE as wn,cF as Tn,j as R}from"./inventory-CXTNWr6S.js";const ws=0,Sn=1,Ts=2,Er=2,Ei=1.25,Br=1,je=6*4+4+4,yi=65535,_n=Math.pow(2,-24),Bi=Symbol("SKIP_GENERATION");function Ss(s){return s.index?s.index.count:s.attributes.position.count}function wt(s){return Ss(s)/3}function _s(s,e=ArrayBuffer){return s>65535?new Uint32Array(new e(4*s)):new Uint16Array(new e(2*s))}function Rn(s,e){if(!s.index){const t=s.attributes.position.count,r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=_s(t,r);s.setIndex(new ye(n,1));for(let a=0;a<t;a++)n[a]=a}}function Rs(s,e){const t=wt(s),r=e||s.drawRange,n=r.start/3,a=(r.start+r.count)/3,i=Math.max(0,n),c=Math.min(t,a)-i;return[{offset:Math.floor(i),count:Math.floor(c)}]}function As(s,e){if(!s.groups||!s.groups.length)return Rs(s,e);const t=[],r=new Set,n=e||s.drawRange,a=n.start/3,i=(n.start+n.count)/3;for(const l of s.groups){const d=l.start/3,f=(l.start+l.count)/3;r.add(Math.max(a,d)),r.add(Math.min(i,f))}const c=Array.from(r.values()).sort((l,d)=>l-d);for(let l=0;l<c.length-1;l++){const d=c[l],f=c[l+1];t.push({offset:Math.floor(d),count:Math.floor(f-d)})}return t}function An(s,e){const t=wt(s),r=As(s,e).sort((i,c)=>i.offset-c.offset),n=r[r.length-1];n.count=Math.min(t-n.offset,n.count);let a=0;return r.forEach(({count:i})=>a+=i),t!==a}function ki(s,e,t,r,n){let a=1/0,i=1/0,c=1/0,l=-1/0,d=-1/0,f=-1/0,u=1/0,o=1/0,m=1/0,p=-1/0,x=-1/0,h=-1/0;for(let g=e*6,v=(e+t)*6;g<v;g+=6){const y=s[g+0],w=s[g+1],b=y-w,_=y+w;b<a&&(a=b),_>l&&(l=_),y<u&&(u=y),y>p&&(p=y);const T=s[g+2],M=s[g+3],A=T-M,C=T+M;A<i&&(i=A),C>d&&(d=C),T<o&&(o=T),T>x&&(x=T);const F=s[g+4],I=s[g+5],D=F-I,N=F+I;D<c&&(c=D),N>f&&(f=N),F<m&&(m=F),F>h&&(h=F)}r[0]=a,r[1]=i,r[2]=c,r[3]=l,r[4]=d,r[5]=f,n[0]=u,n[1]=o,n[2]=m,n[3]=p,n[4]=x,n[5]=h}function Mn(s,e=null,t=null,r=null){const n=s.attributes.position,a=s.index?s.index.array:null,i=wt(s),c=n.normalized;let l;e===null?(l=new Float32Array(i*6*4),t=0,r=i):(l=e,t=t||0,r=r||i);const d=n.array,f=n.offset||0;let u=3;n.isInterleavedBufferAttribute&&(u=n.data.stride);const o=["getX","getY","getZ"];for(let m=t;m<t+r;m++){const p=m*3,x=m*6;let h=p+0,g=p+1,v=p+2;a&&(h=a[h],g=a[g],v=a[v]),c||(h=h*u+f,g=g*u+f,v=v*u+f);for(let y=0;y<3;y++){let w,b,_;c?(w=n[o[y]](h),b=n[o[y]](g),_=n[o[y]](v)):(w=d[h+y],b=d[g+y],_=d[v+y]);let T=w;b<T&&(T=b),_<T&&(T=_);let M=w;b>M&&(M=b),_>M&&(M=_);const A=(M-T)/2,C=y*2;l[x+C+0]=T+A,l[x+C+1]=A+(Math.abs(T)+A)*_n}}return l}function Y(s,e,t){return t.min.x=e[s],t.min.y=e[s+1],t.min.z=e[s+2],t.max.x=e[s+3],t.max.y=e[s+4],t.max.z=e[s+5],t}function kr(s){let e=-1,t=-1/0;for(let r=0;r<3;r++){const n=s[r+3]-s[r];n>t&&(t=n,e=r)}return e}function Nr(s,e){e.set(s)}function zr(s,e,t){let r,n;for(let a=0;a<3;a++){const i=a+3;r=s[a],n=e[a],t[a]=r<n?r:n,r=s[i],n=e[i],t[i]=r>n?r:n}}function Xt(s,e,t){for(let r=0;r<3;r++){const n=e[s+2*r],a=e[s+2*r+1],i=n-a,c=n+a;i<t[r]&&(t[r]=i),c>t[r+3]&&(t[r+3]=c)}}function It(s){const e=s[3]-s[0],t=s[4]-s[1],r=s[5]-s[2];return 2*(e*t+t*r+r*e)}const Be=32,In=(s,e)=>s.candidate-e.candidate,We=new Array(Be).fill().map(()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0})),Qt=new Float32Array(6);function Cn(s,e,t,r,n,a){let i=-1,c=0;if(a===ws)i=kr(e),i!==-1&&(c=(e[i]+e[i+3])/2);else if(a===Sn)i=kr(s),i!==-1&&(c=Pn(t,r,n,i));else if(a===Ts){const l=It(s);let d=Ei*n;const f=r*6,u=(r+n)*6;for(let o=0;o<3;o++){const m=e[o],h=(e[o+3]-m)/Be;if(n<Be/4){const g=[...We];g.length=n;let v=0;for(let w=f;w<u;w+=6,v++){const b=g[v];b.candidate=t[w+2*o],b.count=0;const{bounds:_,leftCacheBounds:T,rightCacheBounds:M}=b;for(let A=0;A<3;A++)M[A]=1/0,M[A+3]=-1/0,T[A]=1/0,T[A+3]=-1/0,_[A]=1/0,_[A+3]=-1/0;Xt(w,t,_)}g.sort(In);let y=n;for(let w=0;w<y;w++){const b=g[w];for(;w+1<y&&g[w+1].candidate===b.candidate;)g.splice(w+1,1),y--}for(let w=f;w<u;w+=6){const b=t[w+2*o];for(let _=0;_<y;_++){const T=g[_];b>=T.candidate?Xt(w,t,T.rightCacheBounds):(Xt(w,t,T.leftCacheBounds),T.count++)}}for(let w=0;w<y;w++){const b=g[w],_=b.count,T=n-b.count,M=b.leftCacheBounds,A=b.rightCacheBounds;let C=0;_!==0&&(C=It(M)/l);let F=0;T!==0&&(F=It(A)/l);const I=Br+Ei*(C*_+F*T);I<d&&(i=o,d=I,c=b.candidate)}}else{for(let y=0;y<Be;y++){const w=We[y];w.count=0,w.candidate=m+h+y*h;const b=w.bounds;for(let _=0;_<3;_++)b[_]=1/0,b[_+3]=-1/0}for(let y=f;y<u;y+=6){let _=~~((t[y+2*o]-m)/h);_>=Be&&(_=Be-1);const T=We[_];T.count++,Xt(y,t,T.bounds)}const g=We[Be-1];Nr(g.bounds,g.rightCacheBounds);for(let y=Be-2;y>=0;y--){const w=We[y],b=We[y+1];zr(w.bounds,b.rightCacheBounds,w.rightCacheBounds)}let v=0;for(let y=0;y<Be-1;y++){const w=We[y],b=w.count,_=w.bounds,M=We[y+1].rightCacheBounds;b!==0&&(v===0?Nr(_,Qt):zr(_,Qt,Qt)),v+=b;let A=0,C=0;v!==0&&(A=It(Qt)/l);const F=n-v;F!==0&&(C=It(M)/l);const I=Br+Ei*(A*v+C*F);I<d&&(i=o,d=I,c=w.candidate)}}}}else console.warn(`MeshBVH: Invalid build strategy value ${a} used.`);return{axis:i,pos:c}}function Pn(s,e,t,r){let n=0;for(let a=e,i=e+t;a<i;a++)n+=s[a*6+r*2];return n/t}class Ni{constructor(){this.boundingData=new Float32Array(6)}}function Fn(s,e,t,r,n,a){let i=r,c=r+n-1;const l=a.pos,d=a.axis*2;for(;;){for(;i<=c&&t[i*6+d]<l;)i++;for(;i<=c&&t[c*6+d]>=l;)c--;if(i<c){for(let f=0;f<3;f++){let u=e[i*3+f];e[i*3+f]=e[c*3+f],e[c*3+f]=u}for(let f=0;f<6;f++){let u=t[i*6+f];t[i*6+f]=t[c*6+f],t[c*6+f]=u}i++,c--}else return i}}function Dn(s,e,t,r,n,a){let i=r,c=r+n-1;const l=a.pos,d=a.axis*2;for(;;){for(;i<=c&&t[i*6+d]<l;)i++;for(;i<=c&&t[c*6+d]>=l;)c--;if(i<c){let f=s[i];s[i]=s[c],s[c]=f;for(let u=0;u<6;u++){let o=t[i*6+u];t[i*6+u]=t[c*6+u],t[c*6+u]=o}i++,c--}else return i}}function ue(s,e){return e[s+15]===65535}function me(s,e){return e[s+6]}function ge(s,e){return e[s+14]}function be(s){return s+8}function ve(s,e){return e[s+6]}function ur(s,e){return e[s+7]}let Ms,kt,pi,Is;const En=Math.pow(2,32);function Zi(s){return"count"in s?1:1+Zi(s.left)+Zi(s.right)}function Bn(s,e,t){return Ms=new Float32Array(t),kt=new Uint32Array(t),pi=new Uint16Array(t),Is=new Uint8Array(t),Ji(s,e)}function Ji(s,e){const t=s/4,r=s/2,n="count"in e,a=e.boundingData;for(let i=0;i<6;i++)Ms[t+i]=a[i];if(n)if(e.buffer){const i=e.buffer;Is.set(new Uint8Array(i),s);for(let c=s,l=s+i.byteLength;c<l;c+=je){const d=c/2;ue(d,pi)||(kt[c/4+6]+=t)}return s+i.byteLength}else{const i=e.offset,c=e.count;return kt[t+6]=i,pi[r+14]=c,pi[r+15]=yi,s+je}else{const i=e.left,c=e.right,l=e.splitAxis;let d;if(d=Ji(s+je,i),d/4>En)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return kt[t+6]=d/4,d=Ji(d,c),kt[t+7]=l,d}}function kn(s,e){const t=(s.index?s.index.count:s.attributes.position.count)/3,r=t>2**16,n=r?4:2,a=e?new SharedArrayBuffer(t*n):new ArrayBuffer(t*n),i=r?new Uint32Array(a):new Uint16Array(a);for(let c=0,l=i.length;c<l;c++)i[c]=c;return i}function Nn(s,e,t,r,n){const{maxDepth:a,verbose:i,maxLeafTris:c,strategy:l,onProgress:d,indirect:f}=n,u=s._indirectBuffer,o=s.geometry,m=o.index?o.index.array:null,p=f?Dn:Fn,x=wt(o),h=new Float32Array(6);let g=!1;const v=new Ni;return ki(e,t,r,v.boundingData,h),w(v,t,r,h),v;function y(b){d&&d(b/x)}function w(b,_,T,M=null,A=0){if(!g&&A>=a&&(g=!0,i&&(console.warn(`MeshBVH: Max depth of ${a} reached when generating BVH. Consider increasing maxDepth.`),console.warn(o))),T<=c||A>=a)return y(_+T),b.offset=_,b.count=T,b;const C=Cn(b.boundingData,M,e,_,T,l);if(C.axis===-1)return y(_+T),b.offset=_,b.count=T,b;const F=p(u,m,e,_,T,C);if(F===_||F===_+T)y(_+T),b.offset=_,b.count=T;else{b.splitAxis=C.axis;const I=new Ni,D=_,N=F-_;b.left=I,ki(e,D,N,I.boundingData,h),w(I,D,N,h,A+1);const U=new Ni,j=F,ie=T-N;b.right=U,ki(e,j,ie,U.boundingData,h),w(U,j,ie,h,A+1)}return b}}function zn(s,e){const t=s.geometry;e.indirect&&(s._indirectBuffer=kn(t,e.useSharedArrayBuffer),An(t,e.range)&&!e.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),s._indirectBuffer||Rn(t,e);const r=e.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,n=Mn(t),a=e.indirect?Rs(t,e.range):As(t,e.range);s._roots=a.map(i=>{const c=Nn(s,n,i.offset,i.count,e),l=Zi(c),d=new r(je*l);return Bn(0,c,d),d})}class Le{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let r=1/0,n=-1/0;for(let a=0,i=e.length;a<i;a++){const l=e[a][t];r=l<r?l:r,n=l>n?l:n}this.min=r,this.max=n}setFromPoints(e,t){let r=1/0,n=-1/0;for(let a=0,i=t.length;a<i;a++){const c=t[a],l=e.dot(c);r=l<r?l:r,n=l>n?l:n}this.min=r,this.max=n}isSeparated(e){return this.min>e.max||e.min>this.max}}Le.prototype.setFromBox=function(){const s=new k;return function(t,r){const n=r.min,a=r.max;let i=1/0,c=-1/0;for(let l=0;l<=1;l++)for(let d=0;d<=1;d++)for(let f=0;f<=1;f++){s.x=n.x*l+a.x*(1-l),s.y=n.y*d+a.y*(1-d),s.z=n.z*f+a.z*(1-f);const u=t.dot(s);i=Math.min(u,i),c=Math.max(u,c)}this.min=i,this.max=c}}();const On=function(){const s=new k,e=new k,t=new k;return function(n,a,i){const c=n.start,l=s,d=a.start,f=e;t.subVectors(c,d),s.subVectors(n.end,n.start),e.subVectors(a.end,a.start);const u=t.dot(f),o=f.dot(l),m=f.dot(f),p=t.dot(l),h=l.dot(l)*m-o*o;let g,v;h!==0?g=(u*o-p*m)/h:g=0,v=(u+g*o)/m,i.x=g,i.y=v}}(),fr=function(){const s=new le,e=new k,t=new k;return function(n,a,i,c){On(n,a,s);let l=s.x,d=s.y;if(l>=0&&l<=1&&d>=0&&d<=1){n.at(l,i),a.at(d,c);return}else if(l>=0&&l<=1){d<0?a.at(0,c):a.at(1,c),n.closestPointToPoint(c,!0,i);return}else if(d>=0&&d<=1){l<0?n.at(0,i):n.at(1,i),a.closestPointToPoint(i,!0,c);return}else{let f;l<0?f=n.start:f=n.end;let u;d<0?u=a.start:u=a.end;const o=e,m=t;if(n.closestPointToPoint(u,!0,e),a.closestPointToPoint(f,!0,t),o.distanceToSquared(u)<=m.distanceToSquared(f)){i.copy(o),c.copy(u);return}else{i.copy(f),c.copy(m);return}}}}(),Ln=function(){const s=new k,e=new k,t=new hs,r=new Ne;return function(a,i){const{radius:c,center:l}=a,{a:d,b:f,c:u}=i;if(r.start=d,r.end=f,r.closestPointToPoint(l,!0,s).distanceTo(l)<=c||(r.start=d,r.end=u,r.closestPointToPoint(l,!0,s).distanceTo(l)<=c)||(r.start=f,r.end=u,r.closestPointToPoint(l,!0,s).distanceTo(l)<=c))return!0;const x=i.getPlane(t);if(Math.abs(x.distanceToPoint(l))<=c){const g=x.projectPoint(l,e);if(i.containsPoint(g))return!0}return!1}}(),Hn=1e-15;function zi(s){return Math.abs(s)<Hn}class Ae extends Bt{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=new Array(4).fill().map(()=>new k),this.satBounds=new Array(4).fill().map(()=>new Le),this.points=[this.a,this.b,this.c],this.sphere=new Xs,this.plane=new hs,this.needsUpdate=!0}intersectsSphere(e){return Ln(e,this)}update(){const e=this.a,t=this.b,r=this.c,n=this.points,a=this.satAxes,i=this.satBounds,c=a[0],l=i[0];this.getNormal(c),l.setFromPoints(c,n);const d=a[1],f=i[1];d.subVectors(e,t),f.setFromPoints(d,n);const u=a[2],o=i[2];u.subVectors(t,r),o.setFromPoints(u,n);const m=a[3],p=i[3];m.subVectors(r,e),p.setFromPoints(m,n),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(c,e),this.needsUpdate=!1}}Ae.prototype.closestPointToSegment=function(){const s=new k,e=new k,t=new Ne;return function(n,a=null,i=null){const{start:c,end:l}=n,d=this.points;let f,u=1/0;for(let o=0;o<3;o++){const m=(o+1)%3;t.start.copy(d[o]),t.end.copy(d[m]),fr(t,n,s,e),f=s.distanceToSquared(e),f<u&&(u=f,a&&a.copy(s),i&&i.copy(e))}return this.closestPointToPoint(c,s),f=c.distanceToSquared(s),f<u&&(u=f,a&&a.copy(s),i&&i.copy(c)),this.closestPointToPoint(l,s),f=l.distanceToSquared(s),f<u&&(u=f,a&&a.copy(s),i&&i.copy(l)),Math.sqrt(u)}}();Ae.prototype.intersectsTriangle=function(){const s=new Ae,e=new Array(3),t=new Array(3),r=new Le,n=new Le,a=new k,i=new k,c=new k,l=new k,d=new k,f=new Ne,u=new Ne,o=new Ne,m=new k;function p(x,h,g){const v=x.points;let y=0,w=-1;for(let b=0;b<3;b++){const{start:_,end:T}=f;_.copy(v[b]),T.copy(v[(b+1)%3]),f.delta(i);const M=zi(h.distanceToPoint(_));if(zi(h.normal.dot(i))&&M){g.copy(f),y=2;break}const A=h.intersectLine(f,m);if(!A&&M&&m.copy(_),(A||M)&&!zi(m.distanceTo(T))){if(y<=1)(y===1?g.start:g.end).copy(m),M&&(w=y);else if(y>=2){(w===1?g.start:g.end).copy(m),y=2;break}if(y++,y===2&&w===-1)break}}return y}return function(h,g=null,v=!1){this.needsUpdate&&this.update(),h.isExtendedTriangle?h.needsUpdate&&h.update():(s.copy(h),s.update(),h=s);const y=this.plane,w=h.plane;if(Math.abs(y.normal.dot(w.normal))>1-1e-10){const b=this.satBounds,_=this.satAxes;t[0]=h.a,t[1]=h.b,t[2]=h.c;for(let A=0;A<4;A++){const C=b[A],F=_[A];if(r.setFromPoints(F,t),C.isSeparated(r))return!1}const T=h.satBounds,M=h.satAxes;e[0]=this.a,e[1]=this.b,e[2]=this.c;for(let A=0;A<4;A++){const C=T[A],F=M[A];if(r.setFromPoints(F,e),C.isSeparated(r))return!1}for(let A=0;A<4;A++){const C=_[A];for(let F=0;F<4;F++){const I=M[F];if(a.crossVectors(C,I),r.setFromPoints(a,e),n.setFromPoints(a,t),r.isSeparated(n))return!1}}return g&&(v||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),g.start.set(0,0,0),g.end.set(0,0,0)),!0}else{const b=p(this,w,u);if(b===1&&h.containsPoint(u.end))return g&&(g.start.copy(u.end),g.end.copy(u.end)),!0;if(b!==2)return!1;const _=p(h,y,o);if(_===1&&this.containsPoint(o.end))return g&&(g.start.copy(o.end),g.end.copy(o.end)),!0;if(_!==2)return!1;if(u.delta(c),o.delta(l),c.dot(l)<0){let D=o.start;o.start=o.end,o.end=D}const T=u.start.dot(c),M=u.end.dot(c),A=o.start.dot(c),C=o.end.dot(c),F=M<A,I=T<C;return T!==C&&A!==M&&F===I?!1:(g&&(d.subVectors(u.start,o.start),d.dot(c)>0?g.start.copy(u.start):g.start.copy(o.start),d.subVectors(u.end,o.end),d.dot(c)<0?g.end.copy(u.end):g.end.copy(o.end)),!0)}}}();Ae.prototype.distanceToPoint=function(){const s=new k;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}}();Ae.prototype.distanceToTriangle=function(){const s=new k,e=new k,t=["a","b","c"],r=new Ne,n=new Ne;return function(i,c=null,l=null){const d=c||l?r:null;if(this.intersectsTriangle(i,d))return(c||l)&&(c&&d.getCenter(c),l&&d.getCenter(l)),0;let f=1/0;for(let u=0;u<3;u++){let o;const m=t[u],p=i[m];this.closestPointToPoint(p,s),o=p.distanceToSquared(s),o<f&&(f=o,c&&c.copy(s),l&&l.copy(p));const x=this[m];i.closestPointToPoint(x,s),o=x.distanceToSquared(s),o<f&&(f=o,c&&c.copy(x),l&&l.copy(s))}for(let u=0;u<3;u++){const o=t[u],m=t[(u+1)%3];r.set(this[o],this[m]);for(let p=0;p<3;p++){const x=t[p],h=t[(p+1)%3];n.set(i[x],i[h]),fr(r,n,s,e);const g=s.distanceToSquared(e);g<f&&(f=g,c&&c.copy(s),l&&l.copy(e))}}return Math.sqrt(f)}}();class de{constructor(e,t,r){this.isOrientedBox=!0,this.min=new k,this.max=new k,this.matrix=new fe,this.invMatrix=new fe,this.points=new Array(8).fill().map(()=>new k),this.satAxes=new Array(3).fill().map(()=>new k),this.satBounds=new Array(3).fill().map(()=>new Le),this.alignedSatBounds=new Array(3).fill().map(()=>new Le),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),r&&this.matrix.copy(r)}set(e,t,r){this.min.copy(e),this.max.copy(t),this.matrix.copy(r),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}}de.prototype.update=function(){return function(){const e=this.matrix,t=this.min,r=this.max,n=this.points;for(let d=0;d<=1;d++)for(let f=0;f<=1;f++)for(let u=0;u<=1;u++){const o=1*d|2*f|4*u,m=n[o];m.x=d?r.x:t.x,m.y=f?r.y:t.y,m.z=u?r.z:t.z,m.applyMatrix4(e)}const a=this.satBounds,i=this.satAxes,c=n[0];for(let d=0;d<3;d++){const f=i[d],u=a[d],o=1<<d,m=n[o];f.subVectors(c,m),u.setFromPoints(f,n)}const l=this.alignedSatBounds;l[0].setFromPointsField(n,"x"),l[1].setFromPointsField(n,"y"),l[2].setFromPointsField(n,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}}();de.prototype.intersectsBox=function(){const s=new Le;return function(t){this.needsUpdate&&this.update();const r=t.min,n=t.max,a=this.satBounds,i=this.satAxes,c=this.alignedSatBounds;if(s.min=r.x,s.max=n.x,c[0].isSeparated(s)||(s.min=r.y,s.max=n.y,c[1].isSeparated(s))||(s.min=r.z,s.max=n.z,c[2].isSeparated(s)))return!1;for(let l=0;l<3;l++){const d=i[l],f=a[l];if(s.setFromBox(d,t),f.isSeparated(s))return!1}return!0}}();de.prototype.intersectsTriangle=function(){const s=new Ae,e=new Array(3),t=new Le,r=new Le,n=new k;return function(i){this.needsUpdate&&this.update(),i.isExtendedTriangle?i.needsUpdate&&i.update():(s.copy(i),s.update(),i=s);const c=this.satBounds,l=this.satAxes;e[0]=i.a,e[1]=i.b,e[2]=i.c;for(let o=0;o<3;o++){const m=c[o],p=l[o];if(t.setFromPoints(p,e),m.isSeparated(t))return!1}const d=i.satBounds,f=i.satAxes,u=this.points;for(let o=0;o<3;o++){const m=d[o],p=f[o];if(t.setFromPoints(p,u),m.isSeparated(t))return!1}for(let o=0;o<3;o++){const m=l[o];for(let p=0;p<4;p++){const x=f[p];if(n.crossVectors(m,x),t.setFromPoints(n,e),r.setFromPoints(n,u),t.isSeparated(r))return!1}}return!0}}();de.prototype.closestPointToPoint=function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}}();de.prototype.distanceToPoint=function(){const s=new k;return function(t){return this.closestPointToPoint(t,s),t.distanceTo(s)}}();de.prototype.distanceToBox=function(){const s=["x","y","z"],e=new Array(12).fill().map(()=>new Ne),t=new Array(12).fill().map(()=>new Ne),r=new k,n=new k;return function(i,c=0,l=null,d=null){if(this.needsUpdate&&this.update(),this.intersectsBox(i))return(l||d)&&(i.getCenter(n),this.closestPointToPoint(n,r),i.closestPointToPoint(r,n),l&&l.copy(r),d&&d.copy(n)),0;const f=c*c,u=i.min,o=i.max,m=this.points;let p=1/0;for(let h=0;h<8;h++){const g=m[h];n.copy(g).clamp(u,o);const v=g.distanceToSquared(n);if(v<p&&(p=v,l&&l.copy(g),d&&d.copy(n),v<f))return Math.sqrt(v)}let x=0;for(let h=0;h<3;h++)for(let g=0;g<=1;g++)for(let v=0;v<=1;v++){const y=(h+1)%3,w=(h+2)%3,b=g<<y|v<<w,_=1<<h|g<<y|v<<w,T=m[b],M=m[_];e[x].set(T,M);const C=s[h],F=s[y],I=s[w],D=t[x],N=D.start,U=D.end;N[C]=u[C],N[F]=g?u[F]:o[F],N[I]=v?u[I]:o[F],U[C]=o[C],U[F]=g?u[F]:o[F],U[I]=v?u[I]:o[F],x++}for(let h=0;h<=1;h++)for(let g=0;g<=1;g++)for(let v=0;v<=1;v++){n.x=h?o.x:u.x,n.y=g?o.y:u.y,n.z=v?o.z:u.z,this.closestPointToPoint(n,r);const y=n.distanceToSquared(r);if(y<p&&(p=y,l&&l.copy(r),d&&d.copy(n),y<f))return Math.sqrt(y)}for(let h=0;h<12;h++){const g=e[h];for(let v=0;v<12;v++){const y=t[v];fr(g,y,r,n);const w=r.distanceToSquared(n);if(w<p&&(p=w,l&&l.copy(r),d&&d.copy(n),w<f))return Math.sqrt(w)}}return Math.sqrt(p)}}();class dr{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){const e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}}class Un extends dr{constructor(){super(()=>new Ae)}}const we=new Un;class Wn{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;const e=[];let t=null;this.setBuffer=r=>{t&&e.push(t),t=r,this.float32Array=new Float32Array(r),this.uint16Array=new Uint16Array(r),this.uint32Array=new Uint32Array(r)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}}const $=new Wn;let qe,xt;const st=[],Kt=new dr(()=>new Ie);function Vn(s,e,t,r,n,a){qe=Kt.getPrimitive(),xt=Kt.getPrimitive(),st.push(qe,xt),$.setBuffer(s._roots[e]);const i=er(0,s.geometry,t,r,n,a);$.clearBuffer(),Kt.releasePrimitive(qe),Kt.releasePrimitive(xt),st.pop(),st.pop();const c=st.length;return c>0&&(xt=st[c-1],qe=st[c-2]),i}function er(s,e,t,r,n=null,a=0,i=0){const{float32Array:c,uint16Array:l,uint32Array:d}=$;let f=s*2;if(ue(f,l)){const o=me(s,d),m=ge(f,l);return Y(s,c,qe),r(o,m,!1,i,a+s,qe)}else{let C=function(I){const{uint16Array:D,uint32Array:N}=$;let U=I*2;for(;!ue(U,D);)I=be(I),U=I*2;return me(I,N)},F=function(I){const{uint16Array:D,uint32Array:N}=$;let U=I*2;for(;!ue(U,D);)I=ve(I,N),U=I*2;return me(I,N)+ge(U,D)};const o=be(s),m=ve(s,d);let p=o,x=m,h,g,v,y;if(n&&(v=qe,y=xt,Y(p,c,v),Y(x,c,y),h=n(v),g=n(y),g<h)){p=m,x=o;const I=h;h=g,g=I,v=y}v||(v=qe,Y(p,c,v));const w=ue(p*2,l),b=t(v,w,h,i+1,a+p);let _;if(b===Er){const I=C(p),N=F(p)-I;_=r(I,N,!0,i+1,a+p,v)}else _=b&&er(p,e,t,r,n,a,i+1);if(_)return!0;y=xt,Y(x,c,y);const T=ue(x*2,l),M=t(y,T,g,i+1,a+x);let A;if(M===Er){const I=C(x),N=F(x)-I;A=r(I,N,!0,i+1,a+x,y)}else A=M&&er(x,e,t,r,n,a,i+1);return!!A}}const Ct=new k,Oi=new k;function qn(s,e,t={},r=0,n=1/0){const a=r*r,i=n*n;let c=1/0,l=null;if(s.shapecast({boundsTraverseOrder:f=>(Ct.copy(e).clamp(f.min,f.max),Ct.distanceToSquared(e)),intersectsBounds:(f,u,o)=>o<c&&o<i,intersectsTriangle:(f,u)=>{f.closestPointToPoint(e,Ct);const o=e.distanceToSquared(Ct);return o<c&&(Oi.copy(Ct),c=o,l=u),o<a}}),c===1/0)return null;const d=Math.sqrt(c);return t.point?t.point.copy(Oi):t.point=Oi.clone(),t.distance=d,t.faceIndex=l,t}const nt=new k,at=new k,ot=new k,Zt=new le,Jt=new le,ei=new le,Or=new k,Lr=new k,Hr=new k,ti=new k;function jn(s,e,t,r,n,a,i,c){let l;if(a===ms?l=s.intersectTriangle(r,t,e,!0,n):l=s.intersectTriangle(e,t,r,a!==zt,n),l===null)return null;const d=s.origin.distanceTo(n);return d<i||d>c?null:{distance:d,point:n.clone()}}function Gn(s,e,t,r,n,a,i,c,l,d,f){nt.fromBufferAttribute(e,a),at.fromBufferAttribute(e,i),ot.fromBufferAttribute(e,c);const u=jn(s,nt,at,ot,ti,l,d,f);if(u){r&&(Zt.fromBufferAttribute(r,a),Jt.fromBufferAttribute(r,i),ei.fromBufferAttribute(r,c),u.uv=Bt.getInterpolation(ti,nt,at,ot,Zt,Jt,ei,new le)),n&&(Zt.fromBufferAttribute(n,a),Jt.fromBufferAttribute(n,i),ei.fromBufferAttribute(n,c),u.uv1=Bt.getInterpolation(ti,nt,at,ot,Zt,Jt,ei,new le)),t&&(Or.fromBufferAttribute(t,a),Lr.fromBufferAttribute(t,i),Hr.fromBufferAttribute(t,c),u.normal=Bt.getInterpolation(ti,nt,at,ot,Or,Lr,Hr,new k),u.normal.dot(s.direction)>0&&u.normal.multiplyScalar(-1));const o={a,b:i,c,normal:new k,materialIndex:0};Bt.getNormal(nt,at,ot,o.normal),u.face=o,u.faceIndex=a}return u}function bi(s,e,t,r,n,a,i){const c=r*3;let l=c+0,d=c+1,f=c+2;const u=s.index;s.index&&(l=u.getX(l),d=u.getX(d),f=u.getX(f));const{position:o,normal:m,uv:p,uv1:x}=s.attributes,h=Gn(t,o,m,p,x,l,d,f,e,a,i);return h?(h.faceIndex=r,n&&n.push(h),h):null}function J(s,e,t,r){const n=s.a,a=s.b,i=s.c;let c=e,l=e+1,d=e+2;t&&(c=t.getX(c),l=t.getX(l),d=t.getX(d)),n.x=r.getX(c),n.y=r.getY(c),n.z=r.getZ(c),a.x=r.getX(l),a.y=r.getY(l),a.z=r.getZ(l),i.x=r.getX(d),i.y=r.getY(d),i.z=r.getZ(d)}function $n(s,e,t,r,n,a,i,c){const{geometry:l,_indirectBuffer:d}=s;for(let f=r,u=r+n;f<u;f++)bi(l,e,t,f,a,i,c)}function Yn(s,e,t,r,n,a,i){const{geometry:c,_indirectBuffer:l}=s;let d=1/0,f=null;for(let u=r,o=r+n;u<o;u++){let m;m=bi(c,e,t,u,null,a,i),m&&m.distance<d&&(f=m,d=m.distance)}return f}function Xn(s,e,t,r,n,a,i){const{geometry:c}=t,{index:l}=c,d=c.attributes.position;for(let f=s,u=e+s;f<u;f++){let o;if(o=f,J(i,o*3,l,d),i.needsUpdate=!0,r(i,o,n,a))return!0}return!1}function Qn(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));const t=s.geometry,r=t.index?t.index.array:null,n=t.attributes.position;let a,i,c,l,d=0;const f=s._roots;for(let o=0,m=f.length;o<m;o++)a=f[o],i=new Uint32Array(a),c=new Uint16Array(a),l=new Float32Array(a),u(0,d),d+=a.byteLength;function u(o,m,p=!1){const x=o*2;if(c[x+15]===yi){const g=i[o+6],v=c[x+14];let y=1/0,w=1/0,b=1/0,_=-1/0,T=-1/0,M=-1/0;for(let A=3*g,C=3*(g+v);A<C;A++){let F=r[A];const I=n.getX(F),D=n.getY(F),N=n.getZ(F);I<y&&(y=I),I>_&&(_=I),D<w&&(w=D),D>T&&(T=D),N<b&&(b=N),N>M&&(M=N)}return l[o+0]!==y||l[o+1]!==w||l[o+2]!==b||l[o+3]!==_||l[o+4]!==T||l[o+5]!==M?(l[o+0]=y,l[o+1]=w,l[o+2]=b,l[o+3]=_,l[o+4]=T,l[o+5]=M,!0):!1}else{const g=o+8,v=i[o+6],y=g+m,w=v+m;let b=p,_=!1,T=!1;e?b||(_=e.has(y),T=e.has(w),b=!_&&!T):(_=!0,T=!0);const M=b||_,A=b||T;let C=!1;M&&(C=u(g,m,b));let F=!1;A&&(F=u(v,m,b));const I=C||F;if(I)for(let D=0;D<3;D++){const N=g+D,U=v+D,j=l[N],ie=l[N+3],Te=l[U],oe=l[U+3];l[o+D]=j<Te?j:Te,l[o+D+3]=ie>oe?ie:oe}return I}}}function $e(s,e,t,r,n){let a,i,c,l,d,f;const u=1/t.direction.x,o=1/t.direction.y,m=1/t.direction.z,p=t.origin.x,x=t.origin.y,h=t.origin.z;let g=e[s],v=e[s+3],y=e[s+1],w=e[s+3+1],b=e[s+2],_=e[s+3+2];return u>=0?(a=(g-p)*u,i=(v-p)*u):(a=(v-p)*u,i=(g-p)*u),o>=0?(c=(y-x)*o,l=(w-x)*o):(c=(w-x)*o,l=(y-x)*o),a>l||c>i||((c>a||isNaN(a))&&(a=c),(l<i||isNaN(i))&&(i=l),m>=0?(d=(b-h)*m,f=(_-h)*m):(d=(_-h)*m,f=(b-h)*m),a>f||d>i)?!1:((d>a||a!==a)&&(a=d),(f<i||i!==i)&&(i=f),a<=n&&i>=r)}function Kn(s,e,t,r,n,a,i,c){const{geometry:l,_indirectBuffer:d}=s;for(let f=r,u=r+n;f<u;f++){let o=d?d[f]:f;bi(l,e,t,o,a,i,c)}}function Zn(s,e,t,r,n,a,i){const{geometry:c,_indirectBuffer:l}=s;let d=1/0,f=null;for(let u=r,o=r+n;u<o;u++){let m;m=bi(c,e,t,l?l[u]:u,null,a,i),m&&m.distance<d&&(f=m,d=m.distance)}return f}function Jn(s,e,t,r,n,a,i){const{geometry:c}=t,{index:l}=c,d=c.attributes.position;for(let f=s,u=e+s;f<u;f++){let o;if(o=t.resolveTriangleIndex(f),J(i,o*3,l,d),i.needsUpdate=!0,r(i,o,n,a))return!0}return!1}function ea(s,e,t,r,n,a,i){$.setBuffer(s._roots[e]),tr(0,s,t,r,n,a,i),$.clearBuffer()}function tr(s,e,t,r,n,a,i){const{float32Array:c,uint16Array:l,uint32Array:d}=$,f=s*2;if(ue(f,l)){const o=me(s,d),m=ge(f,l);$n(e,t,r,o,m,n,a,i)}else{const o=be(s);$e(o,c,r,a,i)&&tr(o,e,t,r,n,a,i);const m=ve(s,d);$e(m,c,r,a,i)&&tr(m,e,t,r,n,a,i)}}const ta=["x","y","z"];function ia(s,e,t,r,n,a){$.setBuffer(s._roots[e]);const i=ir(0,s,t,r,n,a);return $.clearBuffer(),i}function ir(s,e,t,r,n,a){const{float32Array:i,uint16Array:c,uint32Array:l}=$;let d=s*2;if(ue(d,c)){const u=me(s,l),o=ge(d,c);return Yn(e,t,r,u,o,n,a)}else{const u=ur(s,l),o=ta[u],p=r.direction[o]>=0;let x,h;p?(x=be(s),h=ve(s,l)):(x=ve(s,l),h=be(s));const v=$e(x,i,r,n,a)?ir(x,e,t,r,n,a):null;if(v){const b=v.point[o];if(p?b<=i[h+u]:b>=i[h+u+3])return v}const w=$e(h,i,r,n,a)?ir(h,e,t,r,n,a):null;return v&&w?v.distance<=w.distance?v:w:v||w||null}}const ii=new Ie,ct=new Ae,lt=new Ae,Pt=new fe,Ur=new de,ri=new de;function ra(s,e,t,r){$.setBuffer(s._roots[e]);const n=rr(0,s,t,r);return $.clearBuffer(),n}function rr(s,e,t,r,n=null){const{float32Array:a,uint16Array:i,uint32Array:c}=$;let l=s*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),Ur.set(t.boundingBox.min,t.boundingBox.max,r),n=Ur),ue(l,i)){const f=e.geometry,u=f.index,o=f.attributes.position,m=t.index,p=t.attributes.position,x=me(s,c),h=ge(l,i);if(Pt.copy(r).invert(),t.boundsTree)return Y(s,a,ri),ri.matrix.copy(Pt),ri.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:v=>ri.intersectsBox(v),intersectsTriangle:v=>{v.a.applyMatrix4(r),v.b.applyMatrix4(r),v.c.applyMatrix4(r),v.needsUpdate=!0;for(let y=x*3,w=(h+x)*3;y<w;y+=3)if(J(lt,y,u,o),lt.needsUpdate=!0,v.intersectsTriangle(lt))return!0;return!1}});for(let g=x*3,v=(h+x)*3;g<v;g+=3){J(ct,g,u,o),ct.a.applyMatrix4(Pt),ct.b.applyMatrix4(Pt),ct.c.applyMatrix4(Pt),ct.needsUpdate=!0;for(let y=0,w=m.count;y<w;y+=3)if(J(lt,y,m,p),lt.needsUpdate=!0,ct.intersectsTriangle(lt))return!0}}else{const f=s+8,u=c[s+6];return Y(f,a,ii),!!(n.intersectsBox(ii)&&rr(f,e,t,r,n)||(Y(u,a,ii),n.intersectsBox(ii)&&rr(u,e,t,r,n)))}}const si=new fe,Li=new de,Ft=new de,sa=new k,na=new k,aa=new k,oa=new k;function ca(s,e,t,r={},n={},a=0,i=1/0){e.boundingBox||e.computeBoundingBox(),Li.set(e.boundingBox.min,e.boundingBox.max,t),Li.needsUpdate=!0;const c=s.geometry,l=c.attributes.position,d=c.index,f=e.attributes.position,u=e.index,o=we.getPrimitive(),m=we.getPrimitive();let p=sa,x=na,h=null,g=null;n&&(h=aa,g=oa);let v=1/0,y=null,w=null;return si.copy(t).invert(),Ft.matrix.copy(si),s.shapecast({boundsTraverseOrder:b=>Li.distanceToBox(b),intersectsBounds:(b,_,T)=>T<v&&T<i?(_&&(Ft.min.copy(b.min),Ft.max.copy(b.max),Ft.needsUpdate=!0),!0):!1,intersectsRange:(b,_)=>{if(e.boundsTree)return e.boundsTree.shapecast({boundsTraverseOrder:M=>Ft.distanceToBox(M),intersectsBounds:(M,A,C)=>C<v&&C<i,intersectsRange:(M,A)=>{for(let C=M,F=M+A;C<F;C++){J(m,3*C,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let I=b,D=b+_;I<D;I++){J(o,3*I,d,l),o.needsUpdate=!0;const N=o.distanceToTriangle(m,p,h);if(N<v&&(x.copy(p),g&&g.copy(h),v=N,y=I,w=C),N<a)return!0}}}});{const T=wt(e);for(let M=0,A=T;M<A;M++){J(m,3*M,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let C=b,F=b+_;C<F;C++){J(o,3*C,d,l),o.needsUpdate=!0;const I=o.distanceToTriangle(m,p,h);if(I<v&&(x.copy(p),g&&g.copy(h),v=I,y=C,w=M),I<a)return!0}}}}}),we.releasePrimitive(o),we.releasePrimitive(m),v===1/0?null:(r.point?r.point.copy(x):r.point=x.clone(),r.distance=v,r.faceIndex=y,n&&(n.point?n.point.copy(g):n.point=g.clone(),n.point.applyMatrix4(si),x.applyMatrix4(si),n.distance=x.sub(n.point).length(),n.faceIndex=w),r)}function la(s,e=null){e&&Array.isArray(e)&&(e=new Set(e));const t=s.geometry,r=t.index?t.index.array:null,n=t.attributes.position;let a,i,c,l,d=0;const f=s._roots;for(let o=0,m=f.length;o<m;o++)a=f[o],i=new Uint32Array(a),c=new Uint16Array(a),l=new Float32Array(a),u(0,d),d+=a.byteLength;function u(o,m,p=!1){const x=o*2;if(c[x+15]===yi){const g=i[o+6],v=c[x+14];let y=1/0,w=1/0,b=1/0,_=-1/0,T=-1/0,M=-1/0;for(let A=g,C=g+v;A<C;A++){const F=3*s.resolveTriangleIndex(A);for(let I=0;I<3;I++){let D=F+I;D=r?r[D]:D;const N=n.getX(D),U=n.getY(D),j=n.getZ(D);N<y&&(y=N),N>_&&(_=N),U<w&&(w=U),U>T&&(T=U),j<b&&(b=j),j>M&&(M=j)}}return l[o+0]!==y||l[o+1]!==w||l[o+2]!==b||l[o+3]!==_||l[o+4]!==T||l[o+5]!==M?(l[o+0]=y,l[o+1]=w,l[o+2]=b,l[o+3]=_,l[o+4]=T,l[o+5]=M,!0):!1}else{const g=o+8,v=i[o+6],y=g+m,w=v+m;let b=p,_=!1,T=!1;e?b||(_=e.has(y),T=e.has(w),b=!_&&!T):(_=!0,T=!0);const M=b||_,A=b||T;let C=!1;M&&(C=u(g,m,b));let F=!1;A&&(F=u(v,m,b));const I=C||F;if(I)for(let D=0;D<3;D++){const N=g+D,U=v+D,j=l[N],ie=l[N+3],Te=l[U],oe=l[U+3];l[o+D]=j<Te?j:Te,l[o+D+3]=ie>oe?ie:oe}return I}}}function ua(s,e,t,r,n,a,i){$.setBuffer(s._roots[e]),sr(0,s,t,r,n,a,i),$.clearBuffer()}function sr(s,e,t,r,n,a,i){const{float32Array:c,uint16Array:l,uint32Array:d}=$,f=s*2;if(ue(f,l)){const o=me(s,d),m=ge(f,l);Kn(e,t,r,o,m,n,a,i)}else{const o=be(s);$e(o,c,r,a,i)&&sr(o,e,t,r,n,a,i);const m=ve(s,d);$e(m,c,r,a,i)&&sr(m,e,t,r,n,a,i)}}const fa=["x","y","z"];function da(s,e,t,r,n,a){$.setBuffer(s._roots[e]);const i=nr(0,s,t,r,n,a);return $.clearBuffer(),i}function nr(s,e,t,r,n,a){const{float32Array:i,uint16Array:c,uint32Array:l}=$;let d=s*2;if(ue(d,c)){const u=me(s,l),o=ge(d,c);return Zn(e,t,r,u,o,n,a)}else{const u=ur(s,l),o=fa[u],p=r.direction[o]>=0;let x,h;p?(x=be(s),h=ve(s,l)):(x=ve(s,l),h=be(s));const v=$e(x,i,r,n,a)?nr(x,e,t,r,n,a):null;if(v){const b=v.point[o];if(p?b<=i[h+u]:b>=i[h+u+3])return v}const w=$e(h,i,r,n,a)?nr(h,e,t,r,n,a):null;return v&&w?v.distance<=w.distance?v:w:v||w||null}}const ni=new Ie,ut=new Ae,ft=new Ae,Dt=new fe,Wr=new de,ai=new de;function ha(s,e,t,r){$.setBuffer(s._roots[e]);const n=ar(0,s,t,r);return $.clearBuffer(),n}function ar(s,e,t,r,n=null){const{float32Array:a,uint16Array:i,uint32Array:c}=$;let l=s*2;if(n===null&&(t.boundingBox||t.computeBoundingBox(),Wr.set(t.boundingBox.min,t.boundingBox.max,r),n=Wr),ue(l,i)){const f=e.geometry,u=f.index,o=f.attributes.position,m=t.index,p=t.attributes.position,x=me(s,c),h=ge(l,i);if(Dt.copy(r).invert(),t.boundsTree)return Y(s,a,ai),ai.matrix.copy(Dt),ai.needsUpdate=!0,t.boundsTree.shapecast({intersectsBounds:v=>ai.intersectsBox(v),intersectsTriangle:v=>{v.a.applyMatrix4(r),v.b.applyMatrix4(r),v.c.applyMatrix4(r),v.needsUpdate=!0;for(let y=x,w=h+x;y<w;y++)if(J(ft,3*e.resolveTriangleIndex(y),u,o),ft.needsUpdate=!0,v.intersectsTriangle(ft))return!0;return!1}});for(let g=x,v=h+x;g<v;g++){const y=e.resolveTriangleIndex(g);J(ut,3*y,u,o),ut.a.applyMatrix4(Dt),ut.b.applyMatrix4(Dt),ut.c.applyMatrix4(Dt),ut.needsUpdate=!0;for(let w=0,b=m.count;w<b;w+=3)if(J(ft,w,m,p),ft.needsUpdate=!0,ut.intersectsTriangle(ft))return!0}}else{const f=s+8,u=c[s+6];return Y(f,a,ni),!!(n.intersectsBox(ni)&&ar(f,e,t,r,n)||(Y(u,a,ni),n.intersectsBox(ni)&&ar(u,e,t,r,n)))}}const oi=new fe,Hi=new de,Et=new de,ma=new k,pa=new k,ga=new k,va=new k;function xa(s,e,t,r={},n={},a=0,i=1/0){e.boundingBox||e.computeBoundingBox(),Hi.set(e.boundingBox.min,e.boundingBox.max,t),Hi.needsUpdate=!0;const c=s.geometry,l=c.attributes.position,d=c.index,f=e.attributes.position,u=e.index,o=we.getPrimitive(),m=we.getPrimitive();let p=ma,x=pa,h=null,g=null;n&&(h=ga,g=va);let v=1/0,y=null,w=null;return oi.copy(t).invert(),Et.matrix.copy(oi),s.shapecast({boundsTraverseOrder:b=>Hi.distanceToBox(b),intersectsBounds:(b,_,T)=>T<v&&T<i?(_&&(Et.min.copy(b.min),Et.max.copy(b.max),Et.needsUpdate=!0),!0):!1,intersectsRange:(b,_)=>{if(e.boundsTree){const T=e.boundsTree;return T.shapecast({boundsTraverseOrder:M=>Et.distanceToBox(M),intersectsBounds:(M,A,C)=>C<v&&C<i,intersectsRange:(M,A)=>{for(let C=M,F=M+A;C<F;C++){const I=T.resolveTriangleIndex(C);J(m,3*I,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let D=b,N=b+_;D<N;D++){const U=s.resolveTriangleIndex(D);J(o,3*U,d,l),o.needsUpdate=!0;const j=o.distanceToTriangle(m,p,h);if(j<v&&(x.copy(p),g&&g.copy(h),v=j,y=D,w=C),j<a)return!0}}}})}else{const T=wt(e);for(let M=0,A=T;M<A;M++){J(m,3*M,u,f),m.a.applyMatrix4(t),m.b.applyMatrix4(t),m.c.applyMatrix4(t),m.needsUpdate=!0;for(let C=b,F=b+_;C<F;C++){const I=s.resolveTriangleIndex(C);J(o,3*I,d,l),o.needsUpdate=!0;const D=o.distanceToTriangle(m,p,h);if(D<v&&(x.copy(p),g&&g.copy(h),v=D,y=C,w=M),D<a)return!0}}}}}),we.releasePrimitive(o),we.releasePrimitive(m),v===1/0?null:(r.point?r.point.copy(x):r.point=x.clone(),r.distance=v,r.faceIndex=y,n&&(n.point?n.point.copy(g):n.point=g.clone(),n.point.applyMatrix4(oi),x.applyMatrix4(oi),n.distance=x.sub(n.point).length(),n.faceIndex=w),r)}function ya(){return typeof SharedArrayBuffer<"u"}const Ht=new $.constructor,vi=new $.constructor,Ve=new dr(()=>new Ie),dt=new Ie,ht=new Ie,Ui=new Ie,Wi=new Ie;let Vi=!1;function ba(s,e,t,r){if(Vi)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");Vi=!0;const n=s._roots,a=e._roots;let i,c=0,l=0;const d=new fe().copy(t).invert();for(let f=0,u=n.length;f<u;f++){Ht.setBuffer(n[f]),l=0;const o=Ve.getPrimitive();Y(0,Ht.float32Array,o),o.applyMatrix4(d);for(let m=0,p=a.length;m<p&&(vi.setBuffer(a[m]),i=_e(0,0,t,d,r,c,l,0,0,o),vi.clearBuffer(),l+=a[m].length,!i);m++);if(Ve.releasePrimitive(o),Ht.clearBuffer(),c+=n[f].length,i)break}return Vi=!1,i}function _e(s,e,t,r,n,a=0,i=0,c=0,l=0,d=null,f=!1){let u,o;f?(u=vi,o=Ht):(u=Ht,o=vi);const m=u.float32Array,p=u.uint32Array,x=u.uint16Array,h=o.float32Array,g=o.uint32Array,v=o.uint16Array,y=s*2,w=e*2,b=ue(y,x),_=ue(w,v);let T=!1;if(_&&b)f?T=n(me(e,g),ge(e*2,v),me(s,p),ge(s*2,x),l,i+e,c,a+s):T=n(me(s,p),ge(s*2,x),me(e,g),ge(e*2,v),c,a+s,l,i+e);else if(_){const M=Ve.getPrimitive();Y(e,h,M),M.applyMatrix4(t);const A=be(s),C=ve(s,p);Y(A,m,dt),Y(C,m,ht);const F=M.intersectsBox(dt),I=M.intersectsBox(ht);T=F&&_e(e,A,r,t,n,i,a,l,c+1,M,!f)||I&&_e(e,C,r,t,n,i,a,l,c+1,M,!f),Ve.releasePrimitive(M)}else{const M=be(e),A=ve(e,g);Y(M,h,Ui),Y(A,h,Wi);const C=d.intersectsBox(Ui),F=d.intersectsBox(Wi);if(C&&F)T=_e(s,M,t,r,n,a,i,c,l+1,d,f)||_e(s,A,t,r,n,a,i,c,l+1,d,f);else if(C)if(b)T=_e(s,M,t,r,n,a,i,c,l+1,d,f);else{const I=Ve.getPrimitive();I.copy(Ui).applyMatrix4(t);const D=be(s),N=ve(s,p);Y(D,m,dt),Y(N,m,ht);const U=I.intersectsBox(dt),j=I.intersectsBox(ht);T=U&&_e(M,D,r,t,n,i,a,l,c+1,I,!f)||j&&_e(M,N,r,t,n,i,a,l,c+1,I,!f),Ve.releasePrimitive(I)}else if(F)if(b)T=_e(s,A,t,r,n,a,i,c,l+1,d,f);else{const I=Ve.getPrimitive();I.copy(Wi).applyMatrix4(t);const D=be(s),N=ve(s,p);Y(D,m,dt),Y(N,m,ht);const U=I.intersectsBox(dt),j=I.intersectsBox(ht);T=U&&_e(A,D,r,t,n,i,a,l,c+1,I,!f)||j&&_e(A,N,r,t,n,i,a,l,c+1,I,!f),Ve.releasePrimitive(I)}}return T}const ci=new de,Vr=new Ie,wa={strategy:ws,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null};class hr{static serialize(e,t={}){t={cloneBuffers:!0,...t};const r=e.geometry,n=e._roots,a=e._indirectBuffer,i=r.getIndex();let c;return t.cloneBuffers?c={roots:n.map(l=>l.slice()),index:i?i.array.slice():null,indirectBuffer:a?a.slice():null}:c={roots:n,index:i?i.array:null,indirectBuffer:a},c}static deserialize(e,t,r={}){r={setIndex:!0,indirect:!!e.indirectBuffer,...r};const{index:n,roots:a,indirectBuffer:i}=e,c=new hr(t,{...r,[Bi]:!0});if(c._roots=a,c._indirectBuffer=i||null,r.setIndex){const l=t.getIndex();if(l===null){const d=new ye(e.index,1,!1);t.setIndex(d)}else l.array!==n&&(l.array.set(n),l.needsUpdate=!0)}return c}get indirect(){return!!this._indirectBuffer}constructor(e,t={}){if(e.isBufferGeometry){if(e.index&&e.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.")}else throw new Error("MeshBVH: Only BufferGeometries are supported.");if(t=Object.assign({...wa,[Bi]:!1},t),t.useSharedArrayBuffer&&!ya())throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=e,this._roots=null,this._indirectBuffer=null,t[Bi]||(zn(this,t),!e.boundingBox&&t.setBoundingBox&&(e.boundingBox=this.getBoundingBox(new Ie))),this.resolveTriangleIndex=t.indirect?r=>this._indirectBuffer[r]:r=>r}refit(e=null){return(this.indirect?la:Qn)(this,e)}traverse(e,t=0){const r=this._roots[t],n=new Uint32Array(r),a=new Uint16Array(r);i(0);function i(c,l=0){const d=c*2,f=a[d+15]===yi;if(f){const u=n[c+6],o=a[d+14];e(l,f,new Float32Array(r,c*4,6),u,o)}else{const u=c+je/4,o=n[c+6],m=n[c+7];e(l,f,new Float32Array(r,c*4,6),m)||(i(u,l+1),i(o,l+1))}}}raycast(e,t=Yi,r=0,n=1/0){const a=this._roots,i=this.geometry,c=[],l=t.isMaterial,d=Array.isArray(t),f=i.groups,u=l?t.side:t,o=this.indirect?ua:ea;for(let m=0,p=a.length;m<p;m++){const x=d?t[f[m].materialIndex].side:u,h=c.length;if(o(this,m,x,e,c,r,n),d){const g=f[m].materialIndex;for(let v=h,y=c.length;v<y;v++)c[v].face.materialIndex=g}}return c}raycastFirst(e,t=Yi,r=0,n=1/0){const a=this._roots,i=this.geometry,c=t.isMaterial,l=Array.isArray(t);let d=null;const f=i.groups,u=c?t.side:t,o=this.indirect?da:ia;for(let m=0,p=a.length;m<p;m++){const x=l?t[f[m].materialIndex].side:u,h=o(this,m,x,e,r,n);h!=null&&(d==null||h.distance<d.distance)&&(d=h,l&&(h.face.materialIndex=f[m].materialIndex))}return d}intersectsGeometry(e,t){let r=!1;const n=this._roots,a=this.indirect?ha:ra;for(let i=0,c=n.length;i<c&&(r=a(this,i,e,t),!r);i++);return r}shapecast(e){const t=we.getPrimitive(),r=this.indirect?Jn:Xn;let{boundsTraverseOrder:n,intersectsBounds:a,intersectsRange:i,intersectsTriangle:c}=e;if(i&&c){const u=i;i=(o,m,p,x,h)=>u(o,m,p,x,h)?!0:r(o,m,this,c,p,x,t)}else i||(c?i=(u,o,m,p)=>r(u,o,this,c,m,p,t):i=(u,o,m)=>m);let l=!1,d=0;const f=this._roots;for(let u=0,o=f.length;u<o;u++){const m=f[u];if(l=Vn(this,u,a,i,n,d),l)break;d+=m.byteLength}return we.releasePrimitive(t),l}bvhcast(e,t,r){let{intersectsRanges:n,intersectsTriangles:a}=r;const i=we.getPrimitive(),c=this.geometry.index,l=this.geometry.attributes.position,d=this.indirect?p=>{const x=this.resolveTriangleIndex(p);J(i,x*3,c,l)}:p=>{J(i,p*3,c,l)},f=we.getPrimitive(),u=e.geometry.index,o=e.geometry.attributes.position,m=e.indirect?p=>{const x=e.resolveTriangleIndex(p);J(f,x*3,u,o)}:p=>{J(f,p*3,u,o)};if(a){const p=(x,h,g,v,y,w,b,_)=>{for(let T=g,M=g+v;T<M;T++){m(T),f.a.applyMatrix4(t),f.b.applyMatrix4(t),f.c.applyMatrix4(t),f.needsUpdate=!0;for(let A=x,C=x+h;A<C;A++)if(d(A),i.needsUpdate=!0,a(i,f,A,T,y,w,b,_))return!0}return!1};if(n){const x=n;n=function(h,g,v,y,w,b,_,T){return x(h,g,v,y,w,b,_,T)?!0:p(h,g,v,y,w,b,_,T)}}else n=p}return ba(this,e,t,n)}intersectsBox(e,t){return ci.set(e.min,e.max,t),ci.needsUpdate=!0,this.shapecast({intersectsBounds:r=>ci.intersectsBox(r),intersectsTriangle:r=>ci.intersectsTriangle(r)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,r={},n={},a=0,i=1/0){return(this.indirect?xa:ca)(this,e,t,r,n,a,i)}closestPointToPoint(e,t={},r=0,n=1/0){return qn(this,e,t,r,n)}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(r=>{Y(0,new Float32Array(r),Vr),e.union(Vr)}),e}}function Ta(s){switch(s){case 1:return"R";case 2:return"RG";case 3:return"RGBA";case 4:return"RGBA"}throw new Error}function Sa(s){switch(s){case 1:return gi;case 2:return gs;case 3:return se;case 4:return se}}function qr(s){switch(s){case 1:return Zs;case 2:return ps;case 3:return Qi;case 4:return Qi}}class Cs extends xe{constructor(){super(),this.minFilter=X,this.magFilter=X,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(e){const t=this.overrideItemSize,r=e.itemSize,n=e.count;if(t!==null){if(r*n%t!==0)throw new Error("VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.");e.itemSize=t,e.count=n*r/t}const a=e.itemSize,i=e.count,c=e.normalized,l=e.array.constructor,d=l.BYTES_PER_ELEMENT;let f=this._forcedType,u=a;if(f===null)switch(l){case Float32Array:f=ae;break;case Uint8Array:case Uint16Array:case Uint32Array:f=Ot;break;case Int8Array:case Int16Array:case Int32Array:f=Di;break}let o,m,p,x,h=Ta(a);switch(f){case ae:p=1,m=Sa(a),c&&d===1?(x=l,h+="8",l===Uint8Array?o=Xi:(o=Pr,h+="_SNORM")):(x=Float32Array,h+="32F",o=ae);break;case Di:h+=d*8+"I",p=c?Math.pow(2,l.BYTES_PER_ELEMENT*8-1):1,m=qr(a),d===1?(x=Int8Array,o=Pr):d===2?(x=Int16Array,o=Ks):(x=Int32Array,o=Di);break;case Ot:h+=d*8+"UI",p=c?Math.pow(2,l.BYTES_PER_ELEMENT*8-1):1,m=qr(a),d===1?(x=Uint8Array,o=Xi):d===2?(x=Uint16Array,o=Qs):(x=Uint32Array,o=Ot);break}u===3&&(m===se||m===Qi)&&(u=4);const g=Math.ceil(Math.sqrt(i))||1,v=u*g*g,y=new x(v),w=e.normalized;e.normalized=!1;for(let b=0;b<i;b++){const _=u*b;y[_]=e.getX(b)/p,a>=2&&(y[_+1]=e.getY(b)/p),a>=3&&(y[_+2]=e.getZ(b)/p,u===4&&(y[_+3]=1)),a>=4&&(y[_+3]=e.getW(b)/p)}e.normalized=w,this.internalFormat=h,this.format=m,this.type=o,this.image.width=g,this.image.height=g,this.image.data=y,this.needsUpdate=!0,this.dispose(),e.itemSize=r,e.count=n}}class Ps extends Cs{constructor(){super(),this._forcedType=Ot}}class Fs extends Cs{constructor(){super(),this._forcedType=ae}}class _a{constructor(){this.index=new Ps,this.position=new Fs,this.bvhBounds=new xe,this.bvhContents=new xe,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(e){const{geometry:t}=e;if(Aa(e,this.bvhBounds,this.bvhContents),this.position.updateFrom(t.attributes.position),e.indirect){const r=e._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==r.length)if(t.index)this._cachedIndexAttr=t.index.clone();else{const n=_s(Ss(t));this._cachedIndexAttr=new ye(n,1,!1)}Ra(t,r,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(t.index)}dispose(){const{index:e,position:t,bvhBounds:r,bvhContents:n}=this;e&&e.dispose(),t&&t.dispose(),r&&r.dispose(),n&&n.dispose()}}function Ra(s,e,t){const r=t.array,n=s.index?s.index.array:null;for(let a=0,i=e.length;a<i;a++){const c=3*a,l=3*e[a];for(let d=0;d<3;d++)r[c+d]=n?n[l+d]:l+d}}function Aa(s,e,t){const r=s._roots;if(r.length!==1)throw new Error("MeshBVHUniformStruct: Multi-root BVHs not supported.");const n=r[0],a=new Uint16Array(n),i=new Uint32Array(n),c=new Float32Array(n),l=n.byteLength/je,d=2*Math.ceil(Math.sqrt(l/2)),f=new Float32Array(4*d*d),u=Math.ceil(Math.sqrt(l)),o=new Uint32Array(2*u*u);for(let m=0;m<l;m++){const p=m*je/4,x=p*2,h=p;for(let g=0;g<3;g++)f[8*m+0+g]=c[h+0+g],f[8*m+4+g]=c[h+3+g];if(ue(x,a)){const g=ge(x,a),v=me(p,i),y=4294901760|g;o[m*2+0]=y,o[m*2+1]=v}else{const g=4*ve(p,i)/je,v=ur(p,i);o[m*2+0]=v,o[m*2+1]=g}}e.image.data=f,e.image.width=d,e.image.height=d,e.format=se,e.type=ae,e.internalFormat="RGBA32F",e.minFilter=X,e.magFilter=X,e.generateMipmaps=!1,e.needsUpdate=!0,e.dispose(),t.image.data=o,t.image.width=u,t.image.height=u,t.format=ps,t.type=Ot,t.internalFormat="RG32UI",t.minFilter=X,t.magFilter=X,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose()}const Ma=`

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
`,Ia=`

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
`,Ca=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;function Ds(s,e,t=0){if(s.isInterleavedBufferAttribute){const r=s.itemSize;for(let n=0,a=s.count;n<a;n++){const i=n+t;e.setX(i,s.getX(n)),r>=2&&e.setY(i,s.getY(n)),r>=3&&e.setZ(i,s.getZ(n)),r>=4&&e.setW(i,s.getW(n))}}else{const r=e.array,n=r.constructor,a=r.BYTES_PER_ELEMENT*s.itemSize*t;new n(r.buffer,a,s.array.length).set(s.array)}}function Nt(s,e=null){const t=s.array.constructor,r=s.normalized,n=s.itemSize,a=e===null?s.count:e;return new ye(new t(n*a),n,r)}function vt(s,e){if(!s&&!e)return!0;if(!!s!=!!e)return!1;const t=s.count===e.count,r=s.normalized===e.normalized,n=s.array.constructor===e.array.constructor,a=s.itemSize===e.itemSize;return!(!t||!r||!n||!a)}function Pa(s){const e=s[0].index!==null,t=new Set(Object.keys(s[0].attributes));if(!s[0].getAttribute("position"))throw new Error("StaticGeometryGenerator: position attribute is required.");for(let r=0;r<s.length;++r){const n=s[r];let a=0;if(e!==(n.index!==null))throw new Error("StaticGeometryGenerator: All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.");for(const i in n.attributes){if(!t.has(i))throw new Error('StaticGeometryGenerator: All geometries must have compatible attributes; make sure "'+i+'" attribute exists among all geometries, or in none of them.');a++}if(a!==t.size)throw new Error("StaticGeometryGenerator: All geometries must have the same number of attributes.")}}function Fa(s){let e=0;for(let t=0,r=s.length;t<r;t++)e+=s[t].getIndex().count;return e}function Da(s){let e=0;for(let t=0,r=s.length;t<r;t++)e+=s[t].getAttribute("position").count;return e}function Ea(s,e,t){s.index&&s.index.count!==e&&s.setIndex(null);const r=s.attributes;for(const n in r)r[n].count!==t&&s.deleteAttribute(n)}function Ba(s,e={},t=new Ge){const{useGroups:r=!1,forceUpdate:n=!1,skipAssigningAttributes:a=[],overwriteIndex:i=!0}=e;Pa(s);const c=s[0].index!==null,l=c?Fa(s):-1,d=Da(s);if(Ea(t,l,d),r){let u=0;for(let o=0,m=s.length;o<m;o++){const p=s[o];let x;c?x=p.getIndex().count:x=p.getAttribute("position").count,t.addGroup(u,x,o),u+=x}}if(c){let u=!1;if(t.index||(t.setIndex(new ye(new Uint32Array(l),1,!1)),u=!0),u||i){let o=0,m=0;const p=t.getIndex();for(let x=0,h=s.length;x<h;x++){const g=s[x],v=g.getIndex();if(!(!n&&!u&&a[x]))for(let w=0;w<v.count;++w)p.setX(o+w,v.getX(w)+m);o+=v.count,m+=g.getAttribute("position").count}}}const f=Object.keys(s[0].attributes);for(let u=0,o=f.length;u<o;u++){let m=!1;const p=f[u];if(!t.getAttribute(p)){const g=s[0].getAttribute(p);t.setAttribute(p,Nt(g,d)),m=!0}let x=0;const h=t.getAttribute(p);for(let g=0,v=s.length;g<v;g++){const y=s[g],w=!n&&!m&&a[g],b=y.getAttribute(p);if(!w)if(p==="color"&&h.itemSize!==b.itemSize)for(let _=x,T=b.count;_<T;_++)b.setXYZW(_,h.getX(_),h.getY(_),h.getZ(_),1);else Ds(b,h,x);x+=b.count}}}function ka(s,e,t){const r=s.index,a=s.attributes.position.count,i=r?r.count:a;let c=s.groups;c.length===0&&(c=[{count:i,start:0,materialIndex:0}]);let l=s.getAttribute("materialIndex");if(!l||l.count!==a){let f;t.length<=255?f=new Uint8Array(a):f=new Uint16Array(a),l=new ye(f,1,!1),s.deleteAttribute("materialIndex"),s.setAttribute("materialIndex",l)}const d=l.array;for(let f=0;f<c.length;f++){const u=c[f],o=u.start,m=u.count,p=Math.min(m,i-o),x=Array.isArray(e)?e[u.materialIndex]:e,h=t.indexOf(x);for(let g=0;g<p;g++){let v=o+g;r&&(v=r.getX(v)),d[v]=h}}}function Na(s,e){if(!s.index){const t=s.attributes.position.count,r=new Array(t);for(let n=0;n<t;n++)r[n]=n;s.setIndex(r)}if(!s.attributes.normal&&e&&e.includes("normal")&&s.computeVertexNormals(),!s.attributes.uv&&e&&e.includes("uv")){const t=s.attributes.position.count;s.setAttribute("uv",new ye(new Float32Array(t*2),2,!1))}if(!s.attributes.uv2&&e&&e.includes("uv2")){const t=s.attributes.position.count;s.setAttribute("uv2",new ye(new Float32Array(t*2),2,!1))}if(!s.attributes.tangent&&e&&e.includes("tangent"))if(s.attributes.uv&&s.attributes.normal)s.computeTangents();else{const t=s.attributes.position.count;s.setAttribute("tangent",new ye(new Float32Array(t*4),4,!1))}if(!s.attributes.color&&e&&e.includes("color")){const t=s.attributes.position.count,r=new Float32Array(t*4);r.fill(1),s.setAttribute("color",new ye(r,4))}}function mr(s){let e=0;if(s.byteLength!==0){const t=new Uint8Array(s);for(let r=0;r<s.byteLength;r++){const n=t[r];e=(e<<5)-e+n,e|=0}}return e}function jr(s){let e=s.uuid;const t=Object.values(s.attributes);s.index&&(t.push(s.index),e+=`index|${s.index.version}`);const r=Object.keys(t).sort();for(const n of r){const a=t[n];e+=`${n}_${a.version}|`}return e}function Gr(s){const e=s.skeleton;return e?(e.boneTexture||e.computeBoneTexture(),`${mr(e.boneTexture.image.data.buffer)}_${e.boneTexture.uuid}`):null}class za{constructor(e=null){this.matrixWorld=new fe,this.geometryHash=null,this.skeletonHash=null,this.primitiveCount=-1,e!==null&&this.updateFrom(e)}updateFrom(e){const t=e.geometry,r=(t.index?t.index.count:t.attributes.position.count)/3;this.matrixWorld.copy(e.matrixWorld),this.geometryHash=jr(t),this.primitiveCount=r,this.skeletonHash=Gr(e)}didChange(e){const t=e.geometry,r=(t.index?t.index.count:t.attributes.position.count)/3;return!(this.matrixWorld.equals(e.matrixWorld)&&this.geometryHash===jr(t)&&this.skeletonHash===Gr(e)&&this.primitiveCount===r)}}const Ze=new k,Je=new k,et=new k,$r=new yt,li=new k,qi=new k,Yr=new yt,Xr=new yt,ui=new fe,Qr=new fe;function Kr(s,e,t){const r=s.skeleton,n=s.geometry,a=r.bones,i=r.boneInverses;Yr.fromBufferAttribute(n.attributes.skinIndex,e),Xr.fromBufferAttribute(n.attributes.skinWeight,e),ui.elements.fill(0);for(let c=0;c<4;c++){const l=Xr.getComponent(c);if(l!==0){const d=Yr.getComponent(c);Qr.multiplyMatrices(a[d].matrixWorld,i[d]),Oa(ui,Qr,l)}}return ui.multiply(s.bindMatrix).premultiply(s.bindMatrixInverse),t.transformDirection(ui),t}function ji(s,e,t,r,n){li.set(0,0,0);for(let a=0,i=s.length;a<i;a++){const c=e[a],l=s[a];c!==0&&(qi.fromBufferAttribute(l,r),t?li.addScaledVector(qi,c):li.addScaledVector(qi.sub(n),c))}n.add(li)}function Oa(s,e,t){const r=s.elements,n=e.elements;for(let a=0,i=n.length;a<i;a++)r[a]+=n[a]*t}function La(s){const{index:e,attributes:t}=s;if(e)for(let r=0,n=e.count;r<n;r+=3){const a=e.getX(r),i=e.getX(r+2);e.setX(r,i),e.setX(r+2,a)}else for(const r in t){const n=t[r],a=n.itemSize;for(let i=0,c=n.count;i<c;i+=3)for(let l=0;l<a;l++){const d=n.getComponent(i,l),f=n.getComponent(i+2,l);n.setComponent(i,l,f),n.setComponent(i+2,l,d)}}return s}function Ha(s,e={},t=new Ge){e={applyWorldTransforms:!0,attributes:[],...e};const r=s.geometry,n=e.applyWorldTransforms,a=e.attributes.includes("normal"),i=e.attributes.includes("tangent"),c=r.attributes,l=t.attributes;for(const v in t.attributes)(!e.attributes.includes(v)||!(v in r.attributes))&&t.deleteAttribute(v);!t.index&&r.index&&(t.index=r.index.clone()),l.position||t.setAttribute("position",Nt(c.position)),a&&!l.normal&&c.normal&&t.setAttribute("normal",Nt(c.normal)),i&&!l.tangent&&c.tangent&&t.setAttribute("tangent",Nt(c.tangent)),vt(r.index,t.index),vt(c.position,l.position),a&&vt(c.normal,l.normal),i&&vt(c.tangent,l.tangent);const d=c.position,f=a?c.normal:null,u=i?c.tangent:null,o=r.morphAttributes.position,m=r.morphAttributes.normal,p=r.morphAttributes.tangent,x=r.morphTargetsRelative,h=s.morphTargetInfluences,g=new Js;g.getNormalMatrix(s.matrixWorld),r.index&&t.index.array.set(r.index.array);for(let v=0,y=c.position.count;v<y;v++)Ze.fromBufferAttribute(d,v),f&&Je.fromBufferAttribute(f,v),u&&($r.fromBufferAttribute(u,v),et.fromBufferAttribute(u,v)),h&&(o&&ji(o,h,x,v,Ze),m&&ji(m,h,x,v,Je),p&&ji(p,h,x,v,et)),s.isSkinnedMesh&&(s.applyBoneTransform(v,Ze),f&&Kr(s,v,Je),u&&Kr(s,v,et)),n&&Ze.applyMatrix4(s.matrixWorld),l.position.setXYZ(v,Ze.x,Ze.y,Ze.z),f&&(n&&Je.applyNormalMatrix(g),l.normal.setXYZ(v,Je.x,Je.y,Je.z)),u&&(n&&et.transformDirection(s.matrixWorld),l.tangent.setXYZW(v,et.x,et.y,et.z,$r.w));for(const v in e.attributes){const y=e.attributes[v];y==="position"||y==="tangent"||y==="normal"||!(y in c)||(l[y]||t.setAttribute(y,Nt(c[y])),vt(c[y],l[y]),Ds(c[y],l[y]))}return s.matrixWorld.determinant()<0&&La(t),t}class Ua extends Ge{constructor(){super(),this.version=0,this.hash=null,this._diff=new za}isCompatible(e,t){const r=e.geometry;for(let n=0;n<t.length;n++){const a=t[n],i=r.attributes[a],c=this.attributes[a];if(i&&!vt(i,c))return!1}return!0}updateFrom(e,t){const r=this._diff;return r.didChange(e)?(Ha(e,t,this),r.updateFrom(e),this.version++,this.hash=`${this.uuid}_${this.version}`,!0):!1}}const or=0,Es=1,Bs=2;function Wa(s,e){for(let t=0,r=s.length;t<r;t++)s[t].traverseVisible(a=>{a.isMesh&&e(a)})}function Va(s){const e=[];for(let t=0,r=s.length;t<r;t++){const n=s[t];Array.isArray(n.material)?e.push(...n.material):e.push(n.material)}return e}function qa(s,e,t){if(s.length===0){e.setIndex(null);const r=e.attributes;for(const n in r)e.deleteAttribute(n);for(const n in t.attributes)e.setAttribute(t.attributes[n],new ye(new Float32Array(0),4,!1))}else Ba(s,t,e);for(const r in e.attributes)e.attributes[r].needsUpdate=!0}class ja{constructor(e){this.objects=null,this.useGroups=!0,this.applyWorldTransforms=!0,this.generateMissingAttributes=!0,this.overwriteIndex=!0,this.attributes=["position","normal","color","tangent","uv","uv2"],this._intermediateGeometry=new Map,this._geometryMergeSets=new WeakMap,this._mergeOrder=[],this._dummyMesh=null,this.setObjects(e||[])}_getDummyMesh(){if(!this._dummyMesh){const e=new en,t=new Ge;t.setAttribute("position",new ye(new Float32Array(9),3)),this._dummyMesh=new vs(t,e)}return this._dummyMesh}_getMeshes(){const e=[];return Wa(this.objects,t=>{e.push(t)}),e.sort((t,r)=>t.uuid>r.uuid?1:t.uuid<r.uuid?-1:0),e.length===0&&e.push(this._getDummyMesh()),e}_updateIntermediateGeometries(){const{_intermediateGeometry:e}=this,t=this._getMeshes(),r=new Set(e.keys()),n={attributes:this.attributes,applyWorldTransforms:this.applyWorldTransforms};for(let a=0,i=t.length;a<i;a++){const c=t[a],l=c.uuid;r.delete(l);let d=e.get(l);(!d||!d.isCompatible(c,this.attributes))&&(d&&d.dispose(),d=new Ua,e.set(l,d)),d.updateFrom(c,n)&&this.generateMissingAttributes&&Na(d,this.attributes)}r.forEach(a=>{e.delete(a)})}setObjects(e){Array.isArray(e)?this.objects=[...e]:this.objects=[e]}generate(e=new Ge){const{useGroups:t,overwriteIndex:r,_intermediateGeometry:n,_geometryMergeSets:a}=this,i=this._getMeshes(),c=[],l=[],d=a.get(e)||[];this._updateIntermediateGeometries();let f=!1;i.length!==d.length&&(f=!0);for(let o=0,m=i.length;o<m;o++){const p=i[o],x=n.get(p.uuid);l.push(x);const h=d[o];!h||h.uuid!==x.uuid?(c.push(!1),f=!0):h.version!==x.version?c.push(!1):c.push(!0)}qa(l,e,{useGroups:t,forceUpdate:f,skipAssigningAttributes:c,overwriteIndex:r}),f&&e.dispose(),a.set(e,l.map(o=>({version:o.version,uuid:o.uuid})));let u=or;return f?u=Bs:c.includes(!1)&&(u=Es),{changeType:u,materials:Va(i),geometry:e}}}function Ga(s){const e=new Set;for(let t=0,r=s.length;t<r;t++){const n=s[t];for(const a in n){const i=n[a];i&&i.isTexture&&e.add(i)}}return Array.from(e)}function $a(s){const e=[],t=new Set;for(let n=0,a=s.length;n<a;n++)s[n].traverse(i=>{i.visible&&(i.isRectAreaLight||i.isSpotLight||i.isPointLight||i.isDirectionalLight)&&(e.push(i),i.iesMap&&t.add(i.iesMap))});const r=Array.from(t).sort((n,a)=>n.uuid<a.uuid?1:n.uuid>a.uuid?-1:0);return{lights:e,iesTextures:r}}class Ya{get initialized(){return!!this.bvh}constructor(e){this.bvhOptions={},this.attributes=["position","normal","tangent","color","uv","uv2"],this.generateBVH=!0,this.bvh=null,this.geometry=new Ge,this.staticGeometryGenerator=new ja(e),this._bvhWorker=null,this._pendingGenerate=null,this._buildAsync=!1,this._materialUuids=null}setObjects(e){this.staticGeometryGenerator.setObjects(e)}setBVHWorker(e){this._bvhWorker=e}async generateAsync(e=null){if(!this._bvhWorker)throw new Error('PathTracingSceneGenerator: "setBVHWorker" must be called before "generateAsync" can be called.');if(this.bvh instanceof Promise)return this._pendingGenerate||(this._pendingGenerate=new Promise(async()=>(await this.bvh,this._pendingGenerate=null,this.generateAsync(e)))),this._pendingGenerate;{this._buildAsync=!0;const t=this.generate(e);return this._buildAsync=!1,t.bvh=this.bvh=await t.bvh,t}}generate(e=null){const{staticGeometryGenerator:t,geometry:r,attributes:n}=this,a=t.objects;t.attributes=n,a.forEach(o=>{o.traverse(m=>{m.isSkinnedMesh&&m.skeleton&&m.skeleton.update()})});const i=t.generate(r),c=i.materials;let l=i.changeType!==or||this._materialUuids===null||this._materialUuids.length!==length;if(!l){for(let o=0,m=c.length;o<m;o++)if(c[o].uuid!==this._materialUuids[o]){l=!0;break}}const d=Ga(c),{lights:f,iesTextures:u}=$a(a);if(l&&(ka(r,c,c),this._materialUuids=c.map(o=>o.uuid)),this.generateBVH){if(this.bvh instanceof Promise)throw new Error("PathTracingSceneGenerator: BVH is already building asynchronously.");if(i.changeType===Bs){const o={strategy:Ts,maxLeafTris:1,indirect:!0,onProgress:e,...this.bvhOptions};this._buildAsync?this.bvh=this._bvhWorker.generate(r,o):this.bvh=new hr(r,o)}else i.changeType===Es&&this.bvh.refit()}return{bvhChanged:i.changeType!==or,bvh:this.bvh,needsMaterialIndexUpdate:l,lights:f,iesTextures:u,geometry:r,materials:c,textures:d,objects:a}}}const Xa=new xs(-1,1,1,-1,0,1);class Qa extends Ge{constructor(){super(),this.setAttribute("position",new Ki([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new Ki([0,2,0,0,2,0],2))}}const Ka=new Qa;class it{constructor(e){this._mesh=new vs(Ka,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Xa)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class wi extends xi{set needsUpdate(e){super.needsUpdate=!0,this.dispatchEvent({type:"recompilation"})}constructor(e){super(e);for(const t in this.uniforms)Object.defineProperty(this,t,{get(){return this.uniforms[t].value},set(r){this.uniforms[t].value=r}})}setDefine(e,t=void 0){if(t==null){if(e in this.defines)return delete this.defines[e],this.needsUpdate=!0,!0}else if(this.defines[e]!==t)return this.defines[e]=t,this.needsUpdate=!0,!0;return!1}}class Za extends wi{constructor(e){super({blending:bt,uniforms:{target1:{value:null},target2:{value:null},opacity:{value:1}},vertexShader:`

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

				}`}),this.setValues(e)}}function fi(s=1){let e="uint";return s>1&&(e="uvec"+s),`
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
	`}function di(s=1){let e="uint",t="float",r="",n=".r",a="1u";return s>1&&(e="uvec"+s,t="vec"+s,r=s+"",s===2?(n=".rg",a="uvec2( 1u, 2u )"):s===3?(n=".rgb",a="uvec3( 1u, 2u, 3u )"):(n="",a="uvec4( 1u, 2u, 3u, 4u )")),`

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
	`}const ks=`

	// Utils
	const float SOBOL_FACTOR = 1.0 / 16777216.0;
	const uint SOBOL_MAX_POINTS = 256u * 256u;

	${fi(1)}
	${fi(2)}
	${fi(3)}
	${fi(4)}

	uint sobolHash( uint x ) {

		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}

`,Ja=`

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

`,eo=`

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

	${di(1)}
	${di(2)}
	${di(3)}
	${di(4)}

`;class to extends wi{constructor(){super({blending:bt,uniforms:{resolution:{value:new le}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`

				${ks}
				${Ja}

				varying vec2 vUv;
				uniform vec2 resolution;
				void main() {

					uint index = uint( gl_FragCoord.y ) * uint( resolution.x ) + uint( gl_FragCoord.x );
					gl_FragColor = generateSobolPoint( index );

				}
			`})}}class io{generate(e,t=256){const r=new Lt(t,t,{type:ae,format:se,minFilter:X,magFilter:X,generateMipmaps:!1}),n=e.getRenderTarget();e.setRenderTarget(r);const a=new it(new to);return a.material.resolution.set(t,t),a.render(e),e.setRenderTarget(n),a.dispose(),r}}class Ns extends ys{set bokehSize(e){this.fStop=this.getFocalLength()/e}get bokehSize(){return this.getFocalLength()/this.fStop}constructor(...e){super(...e),this.fStop=1.4,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=25,this.anamorphicRatio=1}copy(e,t){return super.copy(e,t),this.fStop=e.fStop,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio,this}}class ro{constructor(){this.bokehSize=0,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=10,this.anamorphicRatio=1}updateFrom(e){e instanceof Ns?(this.bokehSize=e.bokehSize,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio):(this.bokehSize=0,this.apertureRotation=0,this.apertureBlades=0,this.focusDistance=10,this.anamorphicRatio=1)}}function Gi(s){const e=new Uint16Array(s.length);for(let t=0,r=s.length;t<r;++t)e[t]=ke.toHalfFloat(s[t]);return e}function Zr(s,e,t=0,r=s.length){let n=t,a=t+r-1;for(;n<a;){const i=n+a>>1;s[i]<e?n=i+1:a=i}return n-t}function so(s,e,t){return .2126*s+.7152*e+.0722*t}function no(s,e=Me){const t=s.clone();t.source=new tn({...t.image});const{width:r,height:n,data:a}=t.image;let i=a;if(t.type!==e){e===Me?i=new Uint16Array(a.length):i=new Float32Array(a.length);let c;a instanceof Int8Array||a instanceof Int16Array||a instanceof Int32Array?c=2**(8*a.BYTES_PER_ELEMENT-1)-1:c=2**(8*a.BYTES_PER_ELEMENT)-1;for(let l=0,d=a.length;l<d;l++){let f=a[l];t.type===Me&&(f=ke.fromHalfFloat(a[l])),t.type!==ae&&t.type!==Me&&(f/=c),e===Me&&(i[l]=ke.toHalfFloat(f))}t.image.data=i,t.type=e}if(t.flipY){const c=i;i=i.slice();for(let l=0;l<n;l++)for(let d=0;d<r;d++){const f=n-l-1,u=4*(l*r+d),o=4*(f*r+d);i[o+0]=c[u+0],i[o+1]=c[u+1],i[o+2]=c[u+2],i[o+3]=c[u+3]}t.flipY=!1,t.image.data=i}return t}class ao{constructor(){const e=new xe(Gi(new Float32Array([0,0,0,0])),1,1);e.type=Me,e.format=se,e.minFilter=pe,e.magFilter=pe,e.wrapS=ze,e.wrapT=ze,e.generateMipmaps=!1,e.needsUpdate=!0;const t=new xe(Gi(new Float32Array([0,1])),1,2);t.type=Me,t.format=gi,t.minFilter=pe,t.magFilter=pe,t.generateMipmaps=!1,t.needsUpdate=!0;const r=new xe(Gi(new Float32Array([0,0,1,1])),2,2);r.type=Me,r.format=gi,r.minFilter=pe,r.magFilter=pe,r.generateMipmaps=!1,r.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=r,this.totalSum=0}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){const t=no(e);t.wrapS=ze,t.wrapT=Oe;const{width:r,height:n,data:a}=t.image,i=new Float32Array(r*n),c=new Float32Array(r*n),l=new Float32Array(n),d=new Float32Array(n);let f=0,u=0;for(let h=0;h<n;h++){let g=0;for(let v=0;v<r;v++){const y=h*r+v,w=ke.fromHalfFloat(a[4*y+0]),b=ke.fromHalfFloat(a[4*y+1]),_=ke.fromHalfFloat(a[4*y+2]),T=so(w,b,_);g+=T,f+=T,i[y]=T,c[y]=g}if(g!==0)for(let v=h*r,y=h*r+r;v<y;v++)i[v]/=g,c[v]/=g;u+=g,l[h]=g,d[h]=u}if(u!==0)for(let h=0,g=l.length;h<g;h++)l[h]/=u,d[h]/=u;const o=new Uint16Array(n),m=new Uint16Array(r*n);for(let h=0;h<n;h++){const g=(h+1)/n,v=Zr(d,g);o[h]=ke.toHalfFloat((v+.5)/n)}for(let h=0;h<n;h++)for(let g=0;g<r;g++){const v=h*r+g,y=(g+1)/r,w=Zr(c,y,h*r,r);m[v]=ke.toHalfFloat((w+.5)/r)}this.dispose();const{marginalWeights:p,conditionalWeights:x}=this;p.image={width:n,height:1,data:o},p.needsUpdate=!0,x.image={width:r,height:n,data:m},x.needsUpdate=!0,this.totalSum=f,this.map=t}}const $i=6,oo=0,co=1,lo=2,uo=3,fo=4,Se=new k,he=new k,Jr=new fe,mt=new rn,es=new k,pt=new k,ho=new k(0,1,0);class mo{constructor(){const e=new xe(new Float32Array(4),1,1);e.format=se,e.type=ae,e.wrapS=Oe,e.wrapT=Oe,e.generateMipmaps=!1,e.minFilter=X,e.magFilter=X,this.tex=e,this.count=0}updateFrom(e,t=[]){const r=this.tex,n=Math.max(e.length*$i,1),a=Math.ceil(Math.sqrt(n));r.image.width!==a&&(r.dispose(),r.image.data=new Float32Array(a*a*4),r.image.width=a,r.image.height=a);const i=r.image.data;for(let l=0,d=e.length;l<d;l++){const f=e[l],u=l*$i*4;let o=0;for(let p=0;p<$i*4;p++)i[u+p]=0;f.getWorldPosition(he),i[u+o++]=he.x,i[u+o++]=he.y,i[u+o++]=he.z;let m=oo;if(f.isRectAreaLight&&f.isCircular?m=co:f.isSpotLight?m=lo:f.isDirectionalLight?m=uo:f.isPointLight&&(m=fo),i[u+o++]=m,i[u+o++]=f.color.r,i[u+o++]=f.color.g,i[u+o++]=f.color.b,i[u+o++]=f.intensity,f.getWorldQuaternion(mt),f.isRectAreaLight)Se.set(f.width,0,0).applyQuaternion(mt),i[u+o++]=Se.x,i[u+o++]=Se.y,i[u+o++]=Se.z,o++,he.set(0,f.height,0).applyQuaternion(mt),i[u+o++]=he.x,i[u+o++]=he.y,i[u+o++]=he.z,i[u+o++]=Se.cross(he).length()*(f.isCircular?Math.PI/4:1);else if(f.isSpotLight){const p=f.radius||0;es.setFromMatrixPosition(f.matrixWorld),pt.setFromMatrixPosition(f.target.matrixWorld),Jr.lookAt(es,pt,ho),mt.setFromRotationMatrix(Jr),Se.set(1,0,0).applyQuaternion(mt),i[u+o++]=Se.x,i[u+o++]=Se.y,i[u+o++]=Se.z,o++,he.set(0,1,0).applyQuaternion(mt),i[u+o++]=he.x,i[u+o++]=he.y,i[u+o++]=he.z,i[u+o++]=Math.PI*p*p,i[u+o++]=p,i[u+o++]=f.decay,i[u+o++]=f.distance,i[u+o++]=Math.cos(f.angle),i[u+o++]=Math.cos(f.angle*(1-f.penumbra)),i[u+o++]=f.iesMap?t.indexOf(f.iesMap):-1}else if(f.isPointLight){const p=Se.setFromMatrixPosition(f.matrixWorld);i[u+o++]=p.x,i[u+o++]=p.y,i[u+o++]=p.z,o++,o+=4,o+=1,i[u+o++]=f.decay,i[u+o++]=f.distance}else if(f.isDirectionalLight){const p=Se.setFromMatrixPosition(f.matrixWorld),x=he.setFromMatrixPosition(f.target.matrixWorld);pt.subVectors(p,x).normalize(),i[u+o++]=pt.x,i[u+o++]=pt.y,i[u+o++]=pt.z}}this.count=e.length;const c=mr(i.buffer);return this.hash!==c?(this.hash=c,r.needsUpdate=!0,!0):!1}}function ts(s,e,t,r,n){if(e>r)throw new Error;const a=s.length/e,i=s.constructor.BYTES_PER_ELEMENT*8;let c=1;switch(s.constructor){case Uint8Array:case Uint16Array:case Uint32Array:c=2**i-1;break;case Int8Array:case Int16Array:case Int32Array:c=2**(i-1)-1;break}for(let l=0;l<a;l++){const d=4*l,f=e*l;for(let u=0;u<r;u++)t[n+d+u]=e>=u+1?s[f+u]/c:0}}class po extends sn{constructor(){super(),this._textures=[],this.type=ae,this.format=se,this.internalFormat="RGBA32F"}updateAttribute(e,t){const r=this._textures[e];r.updateFrom(t);const n=r.image,a=this.image;if(n.width!==a.width||n.height!==a.height)throw new Error("FloatAttributeTextureArray: Attribute must be the same dimensions when updating single layer.");const{width:i,height:c,data:l}=a,f=i*c*4*e;let u=t.itemSize;u===3&&(u=4),ts(r.image.data,u,l,4,f),this.dispose(),this.needsUpdate=!0}setAttributes(e){const t=e[0].count,r=e.length;for(let u=0,o=r;u<o;u++)if(e[u].count!==t)throw new Error("FloatAttributeTextureArray: All attributes must have the same item count.");const n=this._textures;for(;n.length<r;){const u=new Fs;n.push(u)}for(;n.length>r;)n.pop();for(let u=0,o=r;u<o;u++)n[u].updateFrom(e[u]);const i=n[0].image,c=this.image;(i.width!==c.width||i.height!==c.height||i.depth!==r)&&(c.width=i.width,c.height=i.height,c.depth=r,c.data=new Float32Array(c.width*c.height*c.depth*4));const{data:l,width:d,height:f}=c;for(let u=0,o=r;u<o;u++){const m=n[u],x=d*f*4*u;let h=e[u].itemSize;h===3&&(h=4),ts(m.image.data,h,l,4,x)}this.dispose(),this.needsUpdate=!0}}class go extends po{updateNormalAttribute(e){this.updateAttribute(0,e)}updateTangentAttribute(e){this.updateAttribute(1,e)}updateUvAttribute(e){this.updateAttribute(2,e)}updateColorAttribute(e){this.updateAttribute(3,e)}updateFrom(e,t,r,n){this.setAttributes([e,t,r,n])}}function pr(s,e){return s.uuid<e.uuid?1:s.uuid>e.uuid?-1:0}function cr(s){return`${s.source.uuid}:${s.colorSpace}`}function vo(s){const e=new Set,t=[];for(let r=0,n=s.length;r<n;r++){const a=s[r],i=cr(a);e.has(i)||(e.add(i),t.push(a))}return t}function xo(s){const e=s.map(r=>r.iesMap||null).filter(r=>r),t=new Set(e);return Array.from(t).sort(pr)}function yo(s){const e=new Set;for(let r=0,n=s.length;r<n;r++){const a=s[r];for(const i in a){const c=a[i];c&&c.isTexture&&e.add(c)}}const t=Array.from(e);return vo(t).sort(pr)}function bo(s){const e=[];return s.traverse(t=>{t.visible&&(t.isRectAreaLight||t.isSpotLight||t.isPointLight||t.isDirectionalLight)&&e.push(t)}),e.sort(pr)}const gr=47,is=gr*4;class wo{constructor(){this._features={}}isUsed(e){return e in this._features}setUsed(e,t=!0){t===!1?delete this._features[e]:this._features[e]=!0}reset(){this._features={}}}class To extends xe{constructor(){super(new Float32Array(4),1,1),this.format=se,this.type=ae,this.wrapS=Oe,this.wrapT=Oe,this.minFilter=X,this.magFilter=X,this.generateMipmaps=!1,this.features=new wo}updateFrom(e,t){function r(p,x,h=-1){if(x in p&&p[x]){const g=cr(p[x]);return u[g]}else return h}function n(p,x,h){return x in p?p[x]:h}function a(p,x,h,g){const v=p[x]&&p[x].isTexture?p[x]:null;if(v){v.matrixAutoUpdate&&v.updateMatrix();const y=v.matrix.elements;let w=0;h[g+w++]=y[0],h[g+w++]=y[3],h[g+w++]=y[6],w++,h[g+w++]=y[1],h[g+w++]=y[4],h[g+w++]=y[7],w++}return 8}let i=0;const c=e.length*gr,l=Math.ceil(Math.sqrt(c))||1,{image:d,features:f}=this,u={};for(let p=0,x=t.length;p<x;p++)u[cr(t[p])]=p;d.width!==l&&(this.dispose(),d.data=new Float32Array(l*l*4),d.width=l,d.height=l);const o=d.data;f.reset();for(let p=0,x=e.length;p<x;p++){const h=e[p];if(h.isFogVolumeMaterial){f.setUsed("FOG");for(let y=0;y<is;y++)o[i+y]=0;o[i+0*4+0]=h.color.r,o[i+0*4+1]=h.color.g,o[i+0*4+2]=h.color.b,o[i+2*4+3]=n(h,"emissiveIntensity",0),o[i+3*4+0]=h.emissive.r,o[i+3*4+1]=h.emissive.g,o[i+3*4+2]=h.emissive.b,o[i+13*4+1]=h.density,o[i+13*4+3]=0,o[i+14*4+2]=4,i+=is;continue}o[i++]=h.color.r,o[i++]=h.color.g,o[i++]=h.color.b,o[i++]=r(h,"map"),o[i++]=n(h,"metalness",0),o[i++]=r(h,"metalnessMap"),o[i++]=n(h,"roughness",0),o[i++]=r(h,"roughnessMap"),o[i++]=n(h,"ior",1.5),o[i++]=n(h,"transmission",0),o[i++]=r(h,"transmissionMap"),o[i++]=n(h,"emissiveIntensity",0),"emissive"in h?(o[i++]=h.emissive.r,o[i++]=h.emissive.g,o[i++]=h.emissive.b):(o[i++]=0,o[i++]=0,o[i++]=0),o[i++]=r(h,"emissiveMap"),o[i++]=r(h,"normalMap"),"normalScale"in h?(o[i++]=h.normalScale.x,o[i++]=h.normalScale.y):(o[i++]=1,o[i++]=1),o[i++]=n(h,"clearcoat",0),o[i++]=r(h,"clearcoatMap"),o[i++]=n(h,"clearcoatRoughness",0),o[i++]=r(h,"clearcoatRoughnessMap"),o[i++]=r(h,"clearcoatNormalMap"),"clearcoatNormalScale"in h?(o[i++]=h.clearcoatNormalScale.x,o[i++]=h.clearcoatNormalScale.y):(o[i++]=1,o[i++]=1),i++,o[i++]=n(h,"sheen",0),"sheenColor"in h?(o[i++]=h.sheenColor.r,o[i++]=h.sheenColor.g,o[i++]=h.sheenColor.b):(o[i++]=0,o[i++]=0,o[i++]=0),o[i++]=r(h,"sheenColorMap"),o[i++]=n(h,"sheenRoughness",0),o[i++]=r(h,"sheenRoughnessMap"),o[i++]=r(h,"iridescenceMap"),o[i++]=r(h,"iridescenceThicknessMap"),o[i++]=n(h,"iridescence",0),o[i++]=n(h,"iridescenceIOR",1.3);const g=n(h,"iridescenceThicknessRange",[100,400]);o[i++]=g[0],o[i++]=g[1],"specularColor"in h?(o[i++]=h.specularColor.r,o[i++]=h.specularColor.g,o[i++]=h.specularColor.b):(o[i++]=1,o[i++]=1,o[i++]=1),o[i++]=r(h,"specularColorMap"),o[i++]=n(h,"specularIntensity",1),o[i++]=r(h,"specularIntensityMap");const v=n(h,"thickness",0)===0&&n(h,"attenuationDistance",1/0)===1/0;if(o[i++]=Number(v),i++,"attenuationColor"in h?(o[i++]=h.attenuationColor.r,o[i++]=h.attenuationColor.g,o[i++]=h.attenuationColor.b):(o[i++]=1,o[i++]=1,o[i++]=1),o[i++]=n(h,"attenuationDistance",1/0),o[i++]=r(h,"alphaMap"),o[i++]=h.opacity,o[i++]=h.alphaTest,!v&&h.transmission>0)o[i++]=0;else switch(h.side){case Yi:o[i++]=1;break;case ms:o[i++]=-1;break;case zt:o[i++]=0;break}o[i++]=Number(n(h,"matte",!1)),o[i++]=Number(n(h,"castShadow",!0)),o[i++]=Number(h.vertexColors)|Number(h.flatShading)<<1,o[i++]=Number(h.transparent),i+=a(h,"map",o,i),i+=a(h,"metalnessMap",o,i),i+=a(h,"roughnessMap",o,i),i+=a(h,"transmissionMap",o,i),i+=a(h,"emissiveMap",o,i),i+=a(h,"normalMap",o,i),i+=a(h,"clearcoatMap",o,i),i+=a(h,"clearcoatNormalMap",o,i),i+=a(h,"clearcoatRoughnessMap",o,i),i+=a(h,"sheenColorMap",o,i),i+=a(h,"sheenRoughnessMap",o,i),i+=a(h,"iridescenceMap",o,i),i+=a(h,"iridescenceThicknessMap",o,i),i+=a(h,"specularColorMap",o,i),i+=a(h,"specularIntensityMap",o,i),i+=a(h,"alphaMap",o,i)}const m=mr(o.buffer);return this.hash!==m?(this.hash=m,this.needsUpdate=!0,!0):!1}}const rs=new Re;function So(s){return s?`${s.uuid}:${s.version}`:null}function _o(s,e){for(const t in e)t in s&&(s[t]=e[t])}class ss extends nn{constructor(e,t,r){const n={format:se,type:Xi,minFilter:pe,magFilter:pe,wrapS:ze,wrapT:ze,generateMipmaps:!1,...r};super(e,t,1,n),_o(this.texture,n),this.texture.setTextures=(...i)=>{this.setTextures(...i)},this.hashes=[null];const a=new it(new Ro);this.fsQuad=a}setTextures(e,t,r=this.width,n=this.height){const a=e.getRenderTarget(),i=e.toneMapping,c=e.getClearAlpha();e.getClearColor(rs);const l=t.length||1;(r!==this.width||n!==this.height||this.depth!==l)&&(this.setSize(r,n,l),this.hashes=new Array(l).fill(null)),e.setClearColor(0,0),e.toneMapping=an;const d=this.fsQuad,f=this.hashes;let u=!1;for(let o=0,m=l;o<m;o++){const p=t[o],x=So(p);p&&(f[o]!==x||p.isWebGLRenderTarget)&&(p.matrixAutoUpdate=!1,p.matrix.identity(),d.material.map=p,e.setRenderTarget(this,o),d.render(e),p.updateMatrix(),p.matrixAutoUpdate=!0,f[o]=x,u=!0)}return d.material.map=null,e.setClearColor(rs,c),e.setRenderTarget(a),e.toneMapping=i,u}dispose(){super.dispose(),this.fsQuad.dispose()}}class Ro extends xi{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}constructor(){super({uniforms:{map:{value:null}},vertexShader:`
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
			`})}}function Ao(s,e=Math.random()){for(let t=s.length-1;t>0;t--){const r=Math.floor(e()*(t+1)),n=s[t];s[t]=s[r],s[r]=n}return s}class Mo{constructor(e,t,r=Math.random){const n=e**t,a=new Uint16Array(n);let i=n;for(let c=0;c<n;c++)a[c]=c;this.samples=new Float32Array(t),this.strataCount=e,this.reset=function(){for(let c=0;c<n;c++)a[c]=c;i=0},this.reshuffle=function(){i=0},this.next=function(){const{samples:c}=this;i>=a.length&&(Ao(a,r),this.reshuffle());let l=a[i++];for(let d=0;d<t;d++)c[d]=(l%e+r())/e,l=Math.floor(l/e);return c}}}class Io{constructor(e,t,r=Math.random){let n=0;for(const l of t)n+=l;const a=new Float32Array(n),i=[];let c=0;for(const l of t){const d=new Mo(e,l,r);d.samples=new Float32Array(a.buffer,c,d.samples.length),c+=d.samples.length*4,i.push(d)}this.samples=a,this.strataCount=e,this.next=function(){for(const l of i)l.next();return a},this.reshuffle=function(){for(const l of i)l.reshuffle()},this.reset=function(){for(const l of i)l.reset()}}}class Co{constructor(e=0){this.m=2147483648,this.a=1103515245,this.c=12345,this.seed=e}nextInt(){return this.seed=(this.a*this.seed+this.c)%this.m,this.seed}nextFloat(){return this.nextInt()/(this.m-1)}}class Po extends xe{constructor(e=1,t=1,r=8){super(new Float32Array(1),1,1,se,ae),this.minFilter=X,this.magFilter=X,this.strata=r,this.sampler=null,this.generator=new Co,this.stableNoise=!1,this.random=()=>this.stableNoise?this.generator.nextFloat():Math.random(),this.init(e,t,r)}init(e=this.image.height,t=this.image.width,r=this.strata){const{image:n}=this;if(n.width===t&&n.height===e&&this.sampler!==null)return;const a=new Array(e*t).fill(4),i=new Io(r,a,this.random);n.width=t,n.height=e,n.data=i.samples,this.sampler=i,this.dispose(),this.next()}next(){this.sampler.next(),this.needsUpdate=!0}reset(){this.sampler.reset(),this.generator.seed=0}}function Fo(s,e=Math.random){for(let t=s.length-1;t>0;t--){const r=~~((e()-1e-6)*t),n=s[t];s[t]=s[r],s[r]=n}}function Do(s,e){s.fill(0);for(let t=0;t<e;t++)s[t]=1}class ns{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){const{score:e,binaryPattern:t}=this;let r=1/0,n=-1;for(let a=0,i=t.length;a<i;a++){if(t[a]!==0)continue;const c=e[a];c<r&&(r=c,n=a)}return n}findCluster(){const{score:e,binaryPattern:t}=this;let r=-1/0,n=-1;for(let a=0,i=t.length;a<i;a++){if(t[a]!==1)continue;const c=e[a];c>r&&(r=c,n=a)}return n}setSigma(e){if(e===this.sigma)return;const t=~~(Math.sqrt(10*2*e**2)+1),r=2*t+1,n=new Float32Array(r*r),a=e*e;for(let i=-t;i<=t;i++)for(let c=-t;c<=t;c++){const l=(t+c)*r+i+t,d=i*i+c*c;n[l]=Math.E**(-d/(2*a))}this.lookupTable=n,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){const{binaryPattern:e,score:t,size:r}=this;t.fill(0);for(let n=0,a=e.length;n<a;n++)if(e[n]===0){const i=~~(n/r),c=n-i*r;this.updateScore(c,i,1),e[n]=1}else e[n]=0}updateScore(e,t,r){const{size:n,score:a,lookupTable:i}=this,c=this.radius,l=2*c+1;for(let d=-c;d<=c;d++)for(let f=-c;f<=c;f++){const u=(c+f)*l+d+c,o=i[u];let m=e+d;m=m<0?n+m:m%n;let p=t+f;p=p<0?n+p:p%n;const x=p*n+m;a[x]+=r*o}}addPointIndex(e){this.binaryPattern[e]=1;const t=this.size,r=~~(e/t),n=e-r*t;this.updateScore(n,r,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;const t=this.size,r=~~(e/t),n=e-r*t;this.updateScore(n,r,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}}class Eo{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new ns(1),this.savedSamples=new ns(1)}generate(){const{samples:e,savedSamples:t,sigma:r,majorityPointsRatio:n,size:a}=this;e.resize(a),e.setSigma(r);const i=Math.floor(a*a*n),c=e.binaryPattern;Do(c,i),Fo(c,this.random);for(let u=0,o=c.length;u<o;u++)c[u]===1&&e.addPointIndex(u);for(;;){const u=e.findCluster();e.removePointIndex(u);const o=e.findVoid();if(u===o){e.addPointIndex(u);break}e.addPointIndex(o)}const l=new Uint32Array(a*a);t.copy(e);let d;for(d=e.count-1;d>=0;){const u=e.findCluster();e.removePointIndex(u),l[u]=d,d--}const f=a*a;for(d=t.count;d<f/2;){const u=t.findVoid();t.addPointIndex(u),l[u]=d,d++}for(t.invert();d<f;){const u=t.findCluster();t.removePointIndex(u),l[u]=d,d++}return{data:l,maxValue:f}}}function Bo(s){return s>=3?4:s}function ko(s){switch(s){case 1:return gi;case 2:return gs;default:return se}}class No extends xe{constructor(e=64,t=1){super(new Float32Array(4),1,1,se,ae),this.minFilter=X,this.magFilter=X,this.size=e,this.channels=t,this.update()}update(){const e=this.channels,t=this.size,r=new Eo;r.channels=e,r.size=t;const n=Bo(e),a=ko(n);(this.image.width!==t||a!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*n),this.format=a,this.dispose());const i=this.image.data;for(let c=0,l=e;c<l;c++){const d=r.generate(),f=d.data,u=d.maxValue;for(let o=0,m=f.length;o<m;o++){const p=f[o]/u;i[o*n+c]=p}}this.needsUpdate=!0}}const zo=`

	struct PhysicalCamera {

		float focusDistance;
		float anamorphicRatio;
		float bokehSize;
		int apertureBlades;
		float apertureRotation;

	};

`,Oo=`

	struct EquirectHdrInfo {

		sampler2D marginalWeights;
		sampler2D conditionalWeights;
		sampler2D map;

		float totalSum;

	};

`,Lo=`

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

`,Ho=`

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

`,Uo=`

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

`,Wo=`

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
`,Vo=`

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

`,qo=`

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


`,jo=`

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

`,Go=`

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

`,$o=`

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

`,Yo=`

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

`,zs=`

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
`,as=`

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
`,Xo=`

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

`,Qo=`

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

`,Ko=`

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

`,Zo=`

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

`,Jo=`

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

`,ec=`

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

`,tc=`

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

`,ic=`

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

`,rc=`

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

`,sc=`

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

`,nc=`

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
`,ac=`

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

`,oc=`

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

`;class cc extends wi{onBeforeRender(){this.setDefine("FEATURE_DOF",this.physicalCamera.bokehSize===0?0:1),this.setDefine("FEATURE_BACKGROUND_MAP",this.backgroundMap?1:0),this.setDefine("FEATURE_FOG",this.materials.features.isUsed("FOG")?1:0)}constructor(e){super({transparent:!0,depthWrite:!1,defines:{FEATURE_MIS:1,FEATURE_RUSSIAN_ROULETTE:1,FEATURE_DOF:1,FEATURE_BACKGROUND_MAP:0,FEATURE_FOG:1,RANDOM_TYPE:2,CAMERA_TYPE:0,DEBUG_MODE:0,ATTR_NORMAL:0,ATTR_TANGENT:1,ATTR_UV:2,ATTR_COLOR:3,MATERIAL_PIXELS:gr},uniforms:{resolution:{value:new le},opacity:{value:1},bounces:{value:10},transmissiveBounces:{value:10},filterGlossyFactor:{value:0},physicalCamera:{value:new ro},cameraWorldMatrix:{value:new fe},invProjectionMatrix:{value:new fe},bvh:{value:new _a},attributesArray:{value:new go},materialIndexAttribute:{value:new Ps},materials:{value:new To},textures:{value:new ss().texture},lights:{value:new mo},iesProfiles:{value:new ss(360,180,{type:Me,wrapS:Oe,wrapT:Oe}).texture},environmentIntensity:{value:1},environmentRotation:{value:new fe},envMapInfo:{value:new ao},backgroundBlur:{value:0},backgroundMap:{value:null},backgroundAlpha:{value:1},backgroundIntensity:{value:1},backgroundRotation:{value:new fe},seed:{value:0},sobolTexture:{value:null},stratifiedTexture:{value:new Po},stratifiedOffsetTexture:{value:new No(64,1)}},vertexShader:`

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
				${Ma}
				${Ca}
				${Ia}

				// uniform structs
				${zo}
				${Lo}
				${Oo}
				${Ho}
				${Uo}

				// random
				#if RANDOM_TYPE == 2 	// Stratified List

					${Xo}

				#elif RANDOM_TYPE == 1 	// Sobol

					${as}
					${ks}
					${eo}

					#define rand(v) sobol(v)
					#define rand2(v) sobol2(v)
					#define rand3(v) sobol3(v)
					#define rand4(v) sobol4(v)

				#else 					// PCG

				${as}

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
				${Yo}
				${jo}
				${zs}
				${Go}
				${$o}

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
				${qo}
				${Wo}
				${Vo}

				${tc}
				${Zo}
				${ec}
				${Jo}
				${Ko}
				${Qo}

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

				${ac}
				${rc}
				${oc}
				${ic}
				${sc}
				${nc}

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

			`}),this.setValues(e)}}function*lc(){const{_renderer:s,_fsQuad:e,_blendQuad:t,_primaryTarget:r,_blendTargets:n,_sobolTarget:a,_subframe:i,alpha:c,material:l}=this,d=new yt,f=new yt,u=t.material;let[o,m]=n;for(;;){c?(u.opacity=this._opacityFactor/(this.samples+1),l.blending=bt,l.opacity=1):(l.opacity=this._opacityFactor/(this.samples+1),l.blending=bs);const[p,x,h,g]=i,v=r.width,y=r.height;l.resolution.set(v*h,y*g),l.sobolTexture=a.texture,l.stratifiedTexture.init(20,l.bounces+l.transmissiveBounces+5),l.stratifiedTexture.next(),l.seed++;const w=this.tiles.x||1,b=this.tiles.y||1,_=w*b,T=Math.ceil(v*h),M=Math.ceil(y*g),A=Math.floor(p*v),C=Math.floor(x*y),F=Math.ceil(T/w),I=Math.ceil(M/b);for(let D=0;D<b;D++)for(let N=0;N<w;N++){const U=s.getRenderTarget(),j=s.autoClear,ie=s.getScissorTest();s.getScissor(d),s.getViewport(f);let Te=N,oe=D;if(!this.stableTiles){const Ce=this._currentTile%(w*b);Te=Ce%w,oe=~~(Ce/w),this._currentTile=Ce+1}const Ut=b-oe-1;r.scissor.set(A+Te*F,C+Ut*I,Math.min(F,T-Te*F),Math.min(I,M-Ut*I)),r.viewport.set(A,C,T,M),s.setRenderTarget(r),s.setScissorTest(!0),s.autoClear=!1,e.render(s),s.setViewport(f),s.setScissor(d),s.setScissorTest(ie),s.setRenderTarget(U),s.autoClear=j,c&&(u.target1=o.texture,u.target2=r.texture,s.setRenderTarget(m),t.render(s),s.setRenderTarget(U)),this.samples+=1/_,N===w-1&&D===b-1&&(this.samples=Math.round(this.samples)),yield}[o,m]=[m,o]}}const os=new Re;class cs{get material(){return this._fsQuad.material}set material(e){this._fsQuad.material.removeEventListener("recompilation",this._compileFunction),e.addEventListener("recompilation",this._compileFunction),this._fsQuad.material=e}get target(){return this._alpha?this._blendTargets[1]:this._primaryTarget}set alpha(e){this._alpha!==e&&(e||(this._blendTargets[0].dispose(),this._blendTargets[1].dispose()),this._alpha=e,this.reset())}get alpha(){return this._alpha}get isCompiling(){return!!this._compilePromise}constructor(e){this.camera=null,this.tiles=new le(3,3),this.stableNoise=!1,this.stableTiles=!0,this.samples=0,this._subframe=new yt(0,0,1,1),this._opacityFactor=1,this._renderer=e,this._alpha=!1,this._fsQuad=new it(new cc),this._blendQuad=new it(new Za),this._task=null,this._currentTile=0,this._compilePromise=null,this._sobolTarget=new io().generate(e),this._primaryTarget=new Lt(1,1,{format:se,type:ae,magFilter:X,minFilter:X}),this._blendTargets=[new Lt(1,1,{format:se,type:ae,magFilter:X,minFilter:X}),new Lt(1,1,{format:se,type:ae,magFilter:X,minFilter:X})],this._compileFunction=()=>{const t=this.compileMaterial(this._fsQuad._mesh);t.then(()=>{this._compilePromise===t&&(this._compilePromise=null)}),this._compilePromise=t},this.material.addEventListener("recompilation",this._compileFunction)}compileMaterial(){return this._renderer.compileAsync(this._fsQuad._mesh)}setCamera(e){const{material:t}=this;t.cameraWorldMatrix.copy(e.matrixWorld),t.invProjectionMatrix.copy(e.projectionMatrixInverse),t.physicalCamera.updateFrom(e);let r=0;e.projectionMatrix.elements[15]>0&&(r=1),e.isEquirectCamera&&(r=2),t.setDefine("CAMERA_TYPE",r),this.camera=e}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t),!(this._primaryTarget.width===e&&this._primaryTarget.height===t)&&(this._primaryTarget.setSize(e,t),this._blendTargets[0].setSize(e,t),this._blendTargets[1].setSize(e,t),this.reset())}getSize(e){e.x=this._primaryTarget.width,e.y=this._primaryTarget.height}dispose(){this._primaryTarget.dispose(),this._blendTargets[0].dispose(),this._blendTargets[1].dispose(),this._sobolTarget.dispose(),this._fsQuad.dispose(),this._blendQuad.dispose(),this._task=null}reset(){const{_renderer:e,_primaryTarget:t,_blendTargets:r}=this,n=e.getRenderTarget(),a=e.getClearAlpha();e.getClearColor(os),e.setRenderTarget(t),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(r[0]),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(r[1]),e.setClearColor(0,0),e.clearColor(),e.setClearColor(os,a),e.setRenderTarget(n),this.samples=0,this._task=null,this.material.stratifiedTexture.stableNoise=this.stableNoise,this.stableNoise&&(this.material.seed=0,this.material.stratifiedTexture.reset())}update(){this.material.onBeforeRender(),!this.isCompiling&&(this._task||(this._task=lc.call(this)),this._task.next())}}const tt=new le,ls=new le,hi=new on,mi=new Re;class uc extends xe{constructor(e=512,t=512){super(new Float32Array(e*t*4),e,t,se,ae,lr,ze,Oe,pe,pe),this.generationCallback=null}update(){this.dispose(),this.needsUpdate=!0;const{data:e,width:t,height:r}=this.image;for(let n=0;n<t;n++)for(let a=0;a<r;a++){ls.set(t,r),tt.set(n/t,a/r),tt.x-=.5,tt.y=1-tt.y,hi.theta=tt.x*2*Math.PI,hi.phi=tt.y*Math.PI,hi.radius=1,this.generationCallback(hi,tt,ls,mi);const c=4*(a*t+n);e[c+0]=mi.r,e[c+1]=mi.g,e[c+2]=mi.b,e[c+3]=1}}copy(e){return super.copy(e),this.generationCallback=e.generationCallback,this}}const us=new k;class fc extends uc{constructor(e=512){super(e,e),this.topColor=new Re().set(16777215),this.bottomColor=new Re().set(0),this.exponent=2,this.generationCallback=(t,r,n,a)=>{us.setFromSpherical(t);const i=us.y*.5+.5;a.lerpColors(this.bottomColor,this.topColor,i**this.exponent)}}copy(e){return super.copy(e),this.topColor.copy(e.topColor),this.bottomColor.copy(e.bottomColor),this}}class dc extends xi{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}constructor(e){super({uniforms:{map:{value:null},opacity:{value:1}},vertexShader:`
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
			`}),this.setValues(e)}}class hc extends xi{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
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

				${zs}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}}class fs{constructor(e){this._renderer=e,this._quad=new it(new hc)}generate(e,t=null,r=null){if(!e.isCubeTexture)throw new Error("CubeToEquirectMaterial: Source can only be cube textures.");const n=e.images[0],a=this._renderer,i=this._quad;t===null&&(t=4*n.height),r===null&&(r=2*n.height);const c=new Lt(t,r,{type:ae,colorSpace:n.colorSpace}),l=n.height,d=Math.log2(l)-2,f=1/l,u=1/(3*Math.max(Math.pow(2,d),7*16));i.material.defines.CUBEUV_MAX_MIP=`${d}.0`,i.material.defines.CUBEUV_TEXEL_WIDTH=u,i.material.defines.CUBEUV_TEXEL_HEIGHT=f,i.material.uniforms.envMap.value=e,i.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,i.material.needsUpdate=!0;const o=a.getRenderTarget(),m=a.autoClear;a.autoClear=!0,a.setRenderTarget(c),i.render(a),a.setRenderTarget(o),a.autoClear=m;const p=new Uint16Array(t*r*4),x=new Float32Array(t*r*4);a.readRenderTargetPixels(c,0,0,t,r,x),c.dispose();for(let g=0,v=x.length;g<v;g++)p[g]=ke.toHalfFloat(x[g]);const h=new xe(p,t,r,se,Me);return h.minFilter=cn,h.magFilter=pe,h.wrapS=ze,h.wrapT=ze,h.mapping=lr,h.needsUpdate=!0,h}dispose(){this._quad.dispose()}}function mc(s){return s.extensions.get("EXT_float_blend")}const gt=new le;class pc{get multipleImportanceSampling(){return!!this._pathTracer.material.defines.FEATURE_MIS}set multipleImportanceSampling(e){this._pathTracer.material.setDefine("FEATURE_MIS",e?1:0)}get transmissiveBounces(){return this._pathTracer.material.transmissiveBounces}set transmissiveBounces(e){this._pathTracer.material.transmissiveBounces=e}get bounces(){return this._pathTracer.material.bounces}set bounces(e){this._pathTracer.material.bounces=e}get filterGlossyFactor(){return this._pathTracer.material.filterGlossyFactor}set filterGlossyFactor(e){this._pathTracer.material.filterGlossyFactor=e}get samples(){return this._pathTracer.samples}get target(){return this._pathTracer.target}get tiles(){return this._pathTracer.tiles}get stableNoise(){return this._pathTracer.stableNoise}set stableNoise(e){this._pathTracer.stableNoise=e}get isCompiling(){return!!this._pathTracer.isCompiling}constructor(e){this._renderer=e,this._generator=new Ya,this._pathTracer=new cs(e),this._queueReset=!1,this._clock=new ln,this._compilePromise=null,this._lowResPathTracer=new cs(e),this._lowResPathTracer.tiles.set(1,1),this._quad=new it(new dc({map:null,transparent:!0,blending:bt,premultipliedAlpha:e.getContextAttributes().premultipliedAlpha})),this._materials=null,this._previousEnvironment=null,this._previousBackground=null,this._internalBackground=null,this.renderDelay=100,this.minSamples=5,this.fadeDuration=500,this.enablePathTracing=!0,this.pausePathTracing=!1,this.dynamicLowRes=!1,this.lowResScale=.25,this.renderScale=1,this.synchronizeRenderSize=!0,this.rasterizeScene=!0,this.renderToCanvas=!0,this.textureSize=new le(1024,1024),this.rasterizeSceneCallback=(t,r)=>{this._renderer.render(t,r)},this.renderToCanvasCallback=(t,r,n)=>{const a=r.autoClear;r.autoClear=!1,n.render(r),r.autoClear=a},this.setScene(new un,new ys)}setBVHWorker(e){this._generator.setBVHWorker(e)}setScene(e,t,r={}){e.updateMatrixWorld(!0),t.updateMatrixWorld();const n=this._generator;if(n.setObjects(e),this._buildAsync)return n.generateAsync(r.onProgress).then(a=>this._updateFromResults(e,t,a));{const a=n.generate();return this._updateFromResults(e,t,a)}}setSceneAsync(...e){this._buildAsync=!0;const t=this.setScene(...e);return this._buildAsync=!1,t}setCamera(e){this.camera=e,this.updateCamera()}updateCamera(){const e=this.camera;e.updateMatrixWorld(),this._pathTracer.setCamera(e),this._lowResPathTracer.setCamera(e),this.reset()}updateMaterials(){const e=this._pathTracer.material,t=this._renderer,r=this._materials,n=this.textureSize,a=yo(r);e.textures.setTextures(t,a,n.x,n.y),e.materials.updateFrom(r,a),this.reset()}updateLights(){const e=this.scene,t=this._renderer,r=this._pathTracer.material,n=bo(e),a=xo(n);r.lights.updateFrom(n,a),r.iesProfiles.setTextures(t,a),this.reset()}updateEnvironment(){const e=this.scene,t=this._pathTracer.material;if(this._internalBackground&&(this._internalBackground.dispose(),this._internalBackground=null),t.backgroundBlur=e.backgroundBlurriness,t.backgroundIntensity=e.backgroundIntensity??1,t.backgroundRotation.makeRotationFromEuler(e.backgroundRotation).invert(),e.background===null)t.backgroundMap=null,t.backgroundAlpha=0;else if(e.background.isColor){this._colorBackground=this._colorBackground||new fc(16);const r=this._colorBackground;r.topColor.equals(e.background)||(r.topColor.set(e.background),r.bottomColor.set(e.background),r.update()),t.backgroundMap=r,t.backgroundAlpha=1}else if(e.background.isCubeTexture){if(e.background!==this._previousBackground){const r=new fs(this._renderer).generate(e.background);this._internalBackground=r,t.backgroundMap=r,t.backgroundAlpha=1}}else t.backgroundMap=e.background,t.backgroundAlpha=1;if(t.environmentIntensity=e.environment!==null?e.environmentIntensity??1:0,t.environmentRotation.makeRotationFromEuler(e.environmentRotation).invert(),this._previousEnvironment!==e.environment&&e.environment!==null)if(e.environment.isCubeTexture){const r=new fs(this._renderer).generate(e.environment);t.envMapInfo.updateFrom(r)}else t.envMapInfo.updateFrom(e.environment);this._previousEnvironment=e.environment,this._previousBackground=e.background,this.reset()}_updateFromResults(e,t,r){const{materials:n,geometry:a,bvh:i,bvhChanged:c,needsMaterialIndexUpdate:l}=r;this._materials=n;const f=this._pathTracer.material;return c&&(f.bvh.updateFrom(i),f.attributesArray.updateFrom(a.attributes.normal,a.attributes.tangent,a.attributes.uv,a.attributes.color)),l&&f.materialIndexAttribute.updateFrom(a.attributes.materialIndex),this._previousScene=e,this.scene=e,this.camera=t,this.updateCamera(),this.updateMaterials(),this.updateEnvironment(),this.updateLights(),r}renderSample(){const e=this._lowResPathTracer,t=this._pathTracer,r=this._renderer,n=this._clock,a=this._quad;this._updateScale(),this._queueReset&&(t.reset(),e.reset(),this._queueReset=!1,a.material.opacity=0,n.start());const i=n.getDelta()*1e3,c=n.getElapsedTime()*1e3;if(!this.pausePathTracing&&this.enablePathTracing&&this.renderDelay<=c&&!this.isCompiling&&t.update(),t.alpha=t.material.backgroundAlpha!==1||!mc(r),e.alpha=t.alpha,this.renderToCanvas){const l=this._renderer,d=this.minSamples;if(c>=this.renderDelay&&this.samples>=this.minSamples&&(this.fadeDuration!==0?a.material.opacity=Math.min(a.material.opacity+i/this.fadeDuration,1):a.material.opacity=1),!this.enablePathTracing||this.samples<d||a.material.opacity<1){if(this.dynamicLowRes&&!this.isCompiling){e.samples<1&&(e.material=t.material,e.update());const f=a.material.opacity;a.material.opacity=1-a.material.opacity,a.material.map=e.target.texture,a.render(l),a.material.opacity=f}(!this.dynamicLowRes&&this.rasterizeScene||this.dynamicLowRes&&this.isCompiling)&&this.rasterizeSceneCallback(this.scene,this.camera)}this.enablePathTracing&&a.material.opacity>0&&(a.material.opacity<1&&(a.material.blending=this.dynamicLowRes?fn:bs),a.material.map=t.target.texture,this.renderToCanvasCallback(t.target,l,a),a.material.blending=bt)}}reset(){this._queueReset=!0,this._pathTracer.samples=0}dispose(){this._quad.dispose(),this._quad.material.dispose(),this._pathTracer.dispose()}_updateScale(){if(this.synchronizeRenderSize){this._renderer.getDrawingBufferSize(gt);const e=Math.floor(this.renderScale*gt.x),t=Math.floor(this.renderScale*gt.y);if(this._pathTracer.getSize(gt),gt.x!==e||gt.y!==t){const r=this.lowResScale;this._pathTracer.setSize(e,t),this._lowResPathTracer.setSize(Math.floor(e*r),Math.floor(t*r))}}}}class gc extends wi{constructor(e){super({blending:bt,transparent:!1,depthWrite:!1,depthTest:!1,defines:{USE_SLIDER:0},uniforms:{sigma:{value:5},threshold:{value:.03},kSigma:{value:1},map:{value:null},opacity:{value:1}},vertexShader:`

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

			`}),this.setValues(e)}}function vc(s){var n;const e=[];s.traverseVisible(a=>{const i=a;i.isMesh&&Array.isArray(i.material)&&e.push(i)});const t=[],r=()=>{for(const{source:a,geometry:i,materials:c,parts:l,geometries:d}of t){a.geometry=i,a.material=c;for(const f of l)f!==a&&f.removeFromParent();for(const f of d)f.dispose()}t.length=0};try{for(const a of e){const i=a.geometry,c=a.material,l=((n=i.index)==null?void 0:n.count)??i.attributes.position.count,d=[],f=[];t.push({source:a,geometry:i,materials:c,parts:d,geometries:f});for(const o of i.groups){const m=c[o.materialIndex??0];if(!m)throw new Error(`[Raytracing] Invalid material ${o.materialIndex} on mesh "${a.name||a.uuid}".`);const p=Math.max(o.start,i.drawRange.start),x=Math.min(o.start+o.count,i.drawRange.start+i.drawRange.count,l);if(x<=p)continue;if(!Number.isInteger(p)||!Number.isInteger(x)||p%3!==0||x%3!==0)throw new Error(`[Raytracing] Incomplete triangle group on mesh "${a.name||a.uuid}".`);const h=new Array(x-p);for(let y=p;y<x;y++)h[y-p]=i.index?i.index.getX(y):y;const g=i.clone();f.push(g),g.setIndex(h),g.clearGroups(),g.setDrawRange(0,h.length);const v=a.clone(!1);v.geometry=g,v.material=m,d.push(v)}if(d.length===0){const o=a.clone(!1);if(o.geometry=new Ge,f.push(o.geometry),o.geometry.setAttribute("position",new Ki([],3)),o.material=c[0],!o.material)throw new Error(`[Raytracing] Empty material array on mesh "${a.name||a.uuid}".`);d.push(o)}const u=d[0];a.geometry=u.geometry,a.material=u.material,d[0]=a;for(const o of d.slice(1))a.parent.add(o)}return s.updateMatrixWorld(!0),r}catch(a){throw r(),a}}const ds=[{id:"720p",label:"HD 720p (1280×720) - Rapide ⚡",width:1280,height:720},{id:"fit",label:"Taille Écran",width:0,height:0},{id:"1080p",label:"Full HD (1920×1080)",width:1920,height:1080},{id:"2k",label:"2K QHD (2560×1440)",width:2560,height:1440},{id:"square",label:"Carré 1:1 (1080×1080)",width:1080,height:1080},{id:"portrait",label:"Portrait 9:16 (720×1280)",width:720,height:1280}];function xc(s,e=1024,t=512){if(!s||!s.image)return s;const{width:r,height:n,data:a}=s.image;if(!r||!n||!a||r<=e&&n<=t)return s;const i=r/e,c=n/t,l=e*t*4,d=new a.constructor(l);for(let u=0;u<t;u++){const o=Math.min(n-1,Math.floor(u*c));for(let m=0;m<e;m++){const p=Math.min(r-1,Math.floor(m*i)),x=(o*r+p)*4,h=(u*e+m)*4;d[h]=a[x],d[h+1]=a[x+1],d[h+2]=a[x+2],d[h+3]=a[x+3]}}const f=new xe(d,e,t,s.format,s.type);return f.minFilter=pe,f.magFilter=pe,f.wrapS=ze,f.wrapT=Oe,f.mapping=lr,f.needsUpdate=!0,f}function bc({gl:s,scene:e,camera:t,onClose:r}){const n=z.useRef(null),a=z.useRef(null),i=z.useRef(null),c=z.useRef(null),l=z.useRef(null),d=z.useRef(null),f=z.useRef(new Map),u=z.useRef(null),o=z.useRef([]),m=z.useRef(null),p=z.useRef(null),x=z.useRef(!0),h=z.useRef(!1),g=z.useRef(40),v=z.useRef(!1),y=z.useRef(void 0),w=z.useRef(void 0),b=z.useRef(null),_=z.useRef([]),[T,M]=z.useState("split"),[A,C]=z.useState(null),[F,I]=z.useState("720p"),[D,N]=z.useState(!0),[U,j]=z.useState(!1),[ie,Te]=z.useState(40),[oe,Ut]=z.useState(6),[Ce,Os]=z.useState(1),[He,vr]=z.useState(!1),[Tt,Ti]=z.useState(350),[St,Ls]=z.useState(2.8),[Wt,Ye]=z.useState(0),[Vt,xr]=z.useState(!1),[yr,Si]=z.useState(!0),[_i,Ri]=z.useState(null),[Hs,Ai]=z.useState(0),[Us,br]=z.useState(0),[Mi,wr]=z.useState(!1),[Ii,Tr]=z.useState({x:0,y:0,visible:!1});z.useEffect(()=>{const S=P=>{P.key==="Escape"||P.key==="F10"?(P.preventDefault(),r()):(P.key===" "||P.code==="Space")&&P.target.tagName!=="INPUT"&&P.target.tagName!=="BUTTON"&&(P.preventDefault(),M(O=>O==="split"?"raster":O==="raster"?"raytracing":"split"))};return window.addEventListener("keydown",S),()=>window.removeEventListener("keydown",S)},[r]),z.useEffect(()=>{const S=s==null?void 0:s.domElement;S&&(S.style.maxHeight=T==="split"?"calc(50vh - 100px)":"calc(100vh - 180px)")},[T,s]),z.useEffect(()=>{try{const S=new Fr;S.setFromCamera(new le(0,0),t),S.layers.mask=t.layers.mask;const P=S.intersectObjects(e.children,!0);P.length>0&&Ti(Math.round(P[0].distance))}catch{}},[e,t]);const Sr=z.useCallback(()=>{const S=o.current,P=new Map;f.current=P,e.updateMatrixWorld(!0);const O=E=>{var q;return(E.layers.mask&1<<Mt)!==0||(E.layers.mask&1<<Yt)!==0||((q=E.userData)==null?void 0:q.itemName)&&(E.userData.itemName.startsWith("Personnage")||E.userData.itemName.startsWith("PNJ"))||(E.name||"").toLowerCase().includes("personnage")||(E.name||"").toLowerCase().includes("pnj")||(E.name||"").toLowerCase().includes("walker")||(E.name||"").toLowerCase().includes("laracroft")};U?e.traverse(E=>{O(E)&&(E.visible=!0)}):e.traverse(E=>{O(E)&&E.visible&&(E.visible=!1,S.push(E))}),e.traverse(E=>{var qt,jt,Pe,_t;const q=(E.name||"").toLowerCase();if((qt=E.userData)!=null&&qt.isHoverProxy||q.includes("hoverproxy")||q.includes("hitbox")){E.visible&&(E.visible=!1,S.push(E));return}if(O(E)||(E.layers.mask&1<<Dr)!==0)return;if(q.includes("skysphere")||q.includes("skydome")||q.includes("spacebackdrop")||q.includes("sunsphere")||E.userData&&E.userData.isSky){E.traverse(H=>{H.visible&&(H.visible=!1,S.push(H))});return}if(E.isPoints||E.isLine||E.isLineSegments||E.isSprite){E.visible&&(E.visible=!1,S.push(E));return}if((E.type.includes("Helper")||E.isSkeletonHelper||q.includes("helper")||q.includes("gizmo")||q.includes("grid")||q.includes("landingstrip")||q.includes("collision")||q.includes("aizone")||q.includes("hoveroverlay")||q.includes("edgehover")||q.includes("measurement")||q.includes("skeletonhelper"))&&E.visible){E.traverse(H=>{H.visible&&(H.visible=!1,S.push(H))});return}if(E.isLight){const H=E;if((!H.color||typeof H.color.r!="number")&&(H.color=new Re(16777215)),E.isDirectionalLight){const Fe=E;Fe.updateMatrixWorld(!0),Fe.target&&Fe.target.updateMatrixWorld(!0)}H.intensity===0&&H.visible&&(H.visible=!1,S.push(H))}if(E.isMesh){const H=E;if(!(q.includes("frame")||q.includes("cadre")||E.parent&&((E.parent.name||"").toLowerCase().includes("frame")||(E.parent.name||"").toLowerCase().includes("cadre")))&&(E.type==="Reflector"||typeof E.getRenderTarget=="function"||E.isReflector||((jt=H.material)==null?void 0:jt.name)==="ReflectorShader"||((Pe=H.material)==null?void 0:Pe.uniforms)&&"textureMatrix"in H.material.uniforms)){P.set(H,H.material),H.material=new At({color:16777215,roughness:0,metalness:1,side:zt});return}if(!H.geometry||!((_t=H.geometry.attributes)!=null&&_t.position)||H.geometry.attributes.position.count===0){H.visible&&(E.visible=!1,S.push(E));return}if(!H.material){P.set(H,H.material),H.material=new At({color:13421772,roughness:.5});return}const Xe=(H.layers.mask&1<<Mt)!==0,De=Array.isArray(H.material),G=De?H.material:[H.material];let ne=!1;const Qe=G.map(V=>{if(!V)throw new Error(`[Raytracing] Missing material on mesh "${H.name||H.uuid}".`);if(Xe&&V.side!==zt){ne=!0;const Ke=V.clone();return Ke.side=zt,Ke.depthWrite=!0,Ke}return V.visible===!1||V.opacity===0?(ne=!0,new At({transparent:!0,opacity:0,roughness:1,depthWrite:!1})):!V.color||typeof V.color.r!="number"?(ne=!0,new At({color:13684944,roughness:.5,metalness:.1})):V.type==="MeshBasicMaterial"&&!V.isMeshStandardMaterial?(ne=!0,new At({color:V.color,map:V.map??null,transparent:V.transparent,opacity:V.opacity,roughness:.8,metalness:.1})):("emissive"in V&&(!V.emissive||typeof V.emissive.r!="number")&&(V.emissive=new Re(0)),"sheenColor"in V&&(!V.sheenColor||typeof V.sheenColor.r!="number")&&(V.sheenColor=new Re(0)),"specularColor"in V&&(!V.specularColor||typeof V.specularColor.r!="number")&&(V.specularColor=new Re(16777215)),"attenuationColor"in V&&(!V.attenuationColor||typeof V.attenuationColor.r!="number")&&(V.attenuationColor=new Re(16777215)),V)});ne&&(P.set(H,H.material),H.material=De?Qe:Qe[0])}}),u.current=vc(e);let L=new Re(16774624),K=.6;e.traverse(E=>{if(E.isAmbientLight){const q=E;L=q.color,K=q.intensity}});const ee=new dn(L,K*2.2);ee.position.set(300,500,300),ee.target.position.set(150,0,150),e.add(ee),e.add(ee.target),ee.updateMatrixWorld(!0),ee.target.updateMatrixWorld(!0),_.current.push(ee,ee.target),y.current=e.background,w.current=e.environment;const re=hn()||(e.environment&&e.environment.isDataTexture?e.environment:null);if(re){e.background=re;const E=xc(re,1024,512);E!==re&&(b.current=E),e.environment=E,"backgroundIntensity"in e&&"environmentIntensity"in e&&(e.backgroundIntensity=e.environmentIntensity)}o.current=S,f.current=P},[e,U]),Ci=z.useCallback(()=>{var S;(S=u.current)==null||S.call(u),u.current=null,_.current.forEach(P=>{e.remove(P)}),_.current=[],o.current.forEach(P=>{P.visible=!0}),o.current=[],f.current.forEach((P,O)=>{const L=Array.isArray(P)?P:[P],K=Array.isArray(O.material)?O.material:[O.material];for(const ee of K)L.includes(ee)||ee.dispose();O.material=P}),f.current.clear(),y.current!==void 0&&(e.background=y.current,y.current=void 0),w.current!==void 0&&(e.environment=w.current,w.current=void 0),b.current&&(b.current.dispose(),b.current=null),e.traverse(P=>{var O;if(P.isMesh){const L=P.geometry;if(L&&L.boundsTree){try{(O=L.disposeBoundsTree)==null||O.call(L)}catch{}delete L.boundsTree}}})},[e]),_r=z.useCallback(()=>{if(!n.current)return{width:1280,height:720};const S=n.current.getBoundingClientRect(),P=Math.max(300,S.width-40),O=Math.max(200,S.height-40),L=ds.find(K=>K.id===F);return!L||L.id==="fit"?{width:Math.round(P),height:Math.round(O)}:{width:L.width,height:L.height,realWidth:L.width,realHeight:L.height}},[F]);z.useEffect(()=>{var Cr;const S=s.domElement;if(!S)return;const P=S.parentElement,O={width:S.style.width,height:S.style.height,position:S.style.position,top:S.style.top,left:S.style.left,display:S.style.display,maxWidth:S.style.maxWidth,maxHeight:S.style.maxHeight,objectFit:S.style.objectFit,cursor:S.style.cursor,pointerEvents:S.style.pointerEvents},L=new le;s.getSize(L);const K=s.getPixelRatio(),ee=s.toneMappingExposure;a.current&&P&&(a.current.insertBefore(S,a.current.firstChild),S.style.display="block",S.style.position="relative",S.style.maxWidth="100%",S.style.maxHeight="calc(100vh - 180px)",S.style.objectFit="contain",S.style.cursor=He?"crosshair":"default");const{width:re,height:E}=_r();s.setPixelRatio(1),s.setSize(re,E,!1),s.toneMapping=mn,s.toneMappingExposure=Ce,c.current=s;const q=t.isOrthographicCamera===!0;let Q;if(q){const B=t,W=B.top-B.bottom,te=(B.top+B.bottom)/2,Z=(B.right+B.left)/2,$t=re/E,Ue=W/2,Rt=Ue*$t,Ee=new xs(Z-Rt,Z+Rt,te+Ue,te-Ue,B.near,B.far);Ee.position.copy(B.position),Ee.quaternion.copy(B.quaternion),Ee.scale.copy(B.scale),Ee.zoom=B.zoom,Ee.updateProjectionMatrix(),Ee.updateMatrixWorld(!0),Q=Ee}else{const B=t,W=new Ns(B.fov||50,re/E,B.near,B.far);W.position.copy(B.position),W.quaternion.copy(B.quaternion),W.scale.copy(B.scale),W.zoom=B.zoom||1,W.focusDistance=Tt,W.fStop=St,W.bokehSize=He?W.getFocalLength()/W.fStop:0,W.updateProjectionMatrix(),W.updateMatrixWorld(!0),Q=W}Q.layers.mask=t.layers.mask,Q.layers.enable(pn),Q.layers.enable(gn),Q.layers.enable(vn),Q.layers.enable(xn),Q.layers.enable(yn),U?(Q.layers.enable(Mt),Q.layers.enable(Yt)):(Q.layers.disable(Mt),Q.layers.disable(Yt)),Q.layers.enable(bn),Q.layers.enable(Dr),Q.layers.enable(wn),l.current=Q,U||e.traverse(B=>{var te;((B.layers.mask&1<<Mt)!==0||(B.layers.mask&1<<Yt)!==0||((te=B.userData)==null?void 0:te.itemName)&&(B.userData.itemName.startsWith("Personnage")||B.userData.itemName.startsWith("PNJ"))||(B.name||"").toLowerCase().includes("personnage")||(B.name||"").toLowerCase().includes("pnj")||(B.name||"").toLowerCase().includes("walker"))&&B.visible&&(B.visible=!1,o.current.push(B))}),e.traverse(B=>{B.userData.isCameraViewMarker&&B.traverse(W=>{W.visible&&(W.visible=!1,o.current.push(W))})}),e.updateMatrixWorld(!0);try{const B=document.createElement("canvas"),W=new Tn({canvas:B,antialias:!0,alpha:!0,preserveDrawingBuffer:!0});W.setPixelRatio(1),W.setSize(re,E,!1),W.outputColorSpace=s.outputColorSpace,W.toneMapping=s.toneMapping,W.toneMappingExposure=s.toneMappingExposure,W.shadowMap.enabled=s.shadowMap.enabled,W.shadowMap.type=s.shadowMap.type,W.render(e,Q),C(B.toDataURL("image/png")),W.dispose()}catch(B){console.warn("[Raytracing] Impossible de capturer le snapshot 3D standard:",B),C(null)}Si(!0),Ri(null),Ye(0),Ai(0);const ce=new pc(s);ce.bounces=oe,ce.transmissiveBounces=oe,ce.filterGlossyFactor=.5,ce.renderToCanvas=!0,ce.fadeDuration=0,ce.minSamples=1,ce.renderDelay=0,ce.dynamicLowRes=!1;const qt=Math.max(4,Math.ceil(re/200)),jt=Math.max(4,Math.ceil(E/150));ce.tiles.set(qt,jt),ce.textureSize.set(512,512);const Pe=new gc;Pe.uniforms.sigma.value=3.5,Pe.uniforms.threshold.value=.12,Pe.uniforms.kSigma.value=1;const _t=new it(Pe);p.current=Pe,m.current=_t;let H=0;ce.renderToCanvasCallback=(B,W,te)=>{const Z=performance.now();(Z-H>=200||i.current&&i.current.samples>=g.current)&&(H=Z,te.render(W))};let Fe=!1,rt=!1,Xe=null,De=null;const G=(Cr=s.getContext)==null?void 0:Cr.call(s);let ne=null,Qe=performance.now();const V=25;let Ke=performance.now(),Fi=0,$s=performance.now(),Mr=0;const Gt=()=>{if(!i.current||h.current||Fe){rt=!1;return}const B=i.current.samples,W=g.current;if(B<W){const te=performance.now();if(ne&&(G!=null&&G.clientWaitSync)){if(G.clientWaitSync(ne,0,0)===G.TIMEOUT_EXPIRED){Xe=setTimeout(()=>{De=requestAnimationFrame(Gt)},15);return}G!=null&&G.deleteSync&&G.deleteSync(ne),ne=null,Qe=performance.now()}if(te-Qe<V){const Z=Math.max(5,V-(te-Qe));Xe=setTimeout(()=>{De=requestAnimationFrame(Gt)},Z);return}v.current=!1;try{i.current.renderSample(),G!=null&&G.fenceSync?(ne=G.fenceSync(G.SYNC_GPU_COMMANDS_COMPLETE,0),G.flush()):Qe=performance.now(),Fi++}catch(Z){console.error("[Raytracing] Erreur renderSample:",Z),Ri((Z==null?void 0:Z.message)||"Erreur pendant le calcul du raytracing."),xr(!0),rt=!1;return}te-Mr>=120&&(Ye(B),Mr=te),te-Ke>=1e3&&(br(Math.round(Fi*1e3/(te-Ke))),Fi=0,Ke=te,Ai(Math.round((te-$s)/1e3))),Xe=setTimeout(()=>{De=requestAnimationFrame(Gt)},V)}else ne&&(G!=null&&G.deleteSync)&&(G.deleteSync(ne),ne=null),v.current||(x.current&&p.current&&m.current&&c.current&&(p.current.uniforms.map.value=i.current.target.texture,c.current.setRenderTarget(null),m.current.render(c.current)),v.current=!0),Ye(W),br(0),rt=!1},Ir=()=>{Fe||h.current||rt||i.current&&i.current.samples<g.current&&(rt=!0,De=requestAnimationFrame(Gt))};d.current=Ir;const Ys=setTimeout(()=>{if(!Fe)try{Sr(),console.log("[Raytracing] Construction du BVH pour la scène..."),ce.setScene(e,Q),i.current=ce,Si(!1),console.log("[Raytracing] Scène prête ! Démarrage de l'accumulation."),Ir()}catch(B){Ci(),console.error("[Raytracing] Erreur initialisation WebGLPathTracer:",B),Ri((B==null?void 0:B.message)||"Échec de la génération du maillage BVH."),Si(!1)}},60);return()=>{Fe=!0,clearTimeout(Ys),Xe&&clearTimeout(Xe),De&&cancelAnimationFrame(De),ne&&(G!=null&&G.deleteSync)&&(G.deleteSync(ne),ne=null),d.current=null,Ci(),_t.dispose(),Pe.dispose();const B=ce._pathTracer,W=()=>{var Z,$t,Ue,Rt;try{B!=null&&B.material&&(($t=(Z=B.material.textures)==null?void 0:Z.dispose)==null||$t.call(Z),(Rt=(Ue=B.material.envMapInfo)==null?void 0:Ue.dispose)==null||Rt.call(Ue),B.material.dispose()),ce.dispose()}catch(Ee){console.error("[Raytracing] Erreur de libération des ressources:",Ee)}},te=B==null?void 0:B._compilePromise;te?te.then(W,Z=>{console.error("[Raytracing] Erreur de compilation du shader:",Z),W()}):W(),m.current=null,p.current=null,i.current=null,c.current=null,P&&(P.appendChild(S),S.style.width=O.width,S.style.height=O.height,S.style.position=O.position,S.style.top=O.top,S.style.left=O.left,S.style.display=O.display,S.style.maxWidth=O.maxWidth,S.style.maxHeight=O.maxHeight,S.style.objectFit=O.objectFit,S.style.cursor=O.cursor,S.style.pointerEvents=O.pointerEvents),s.setPixelRatio(K),s.setSize(L.x,L.y),s.toneMappingExposure=ee}},[s,e,t,F,U,Sr,Ci,_r]),z.useEffect(()=>{if(x.current=D,i.current&&c.current&&i.current.samples>0){const S=i.current,P=c.current;D&&p.current&&m.current?(p.current.uniforms.map.value=S.target.texture,P.setRenderTarget(null),m.current.render(P)):(P.setRenderTarget(null),S._quad.material.map=S.target.texture,S._quad.render(P))}},[D]),z.useEffect(()=>{var S;h.current=Vt,Vt?x.current&&p.current&&m.current&&c.current&&i.current&&(p.current.uniforms.map.value=i.current.target.texture,c.current.setRenderTarget(null),m.current.render(c.current)):(S=d.current)==null||S.call(d)},[Vt]),z.useEffect(()=>{var S;g.current=ie,(S=d.current)==null||S.call(d)},[ie]),z.useEffect(()=>{var S;if(!(!l.current||!i.current)&&typeof l.current.getFocalLength=="function"){const P=l.current;P.focusDistance=Tt,P.fStop=St,P.bokehSize=He?P.getFocalLength()/P.fStop:0,P.updateProjectionMatrix(),P.updateMatrixWorld(),i.current.updateCamera(),v.current=!1,Ye(0),(S=d.current)==null||S.call(d)}},[He,Tt,St]),z.useEffect(()=>{var S,P;c.current&&(v.current=!1,c.current.toneMappingExposure=Ce,(S=i.current)==null||S.reset(),Ye(0),(P=d.current)==null||P.call(d))},[Ce]),z.useEffect(()=>{var S;i.current&&(v.current=!1,i.current.bounces=oe,i.current.transmissiveBounces=oe,i.current.reset(),Ye(0),(S=d.current)==null||S.call(d))},[oe]);const Ws=S=>{const P=s.domElement;if(!P)return;const O=P.getBoundingClientRect(),L=(S.clientX-O.left)/O.width*2-1,K=-((S.clientY-O.top)/O.height*2-1),ee=new Fr,re=l.current||t;ee.setFromCamera(new le(L,K),re),l.current&&(ee.layers.mask=l.current.layers.mask);const E=ee.intersectObjects(e.children,!0);if(E.length>0){const q=Math.round(E[0].distance);Ti(q),vr(!0),Tr({x:S.clientX-O.left,y:S.clientY-O.top,visible:!0}),setTimeout(()=>{Tr(Q=>({...Q,visible:!1}))},700)}},Rr=S=>{const P=s.domElement;if(P){if(x.current&&p.current&&m.current&&c.current&&i.current&&(p.current.uniforms.map.value=i.current.target.texture,c.current.setRenderTarget(null),m.current.render(c.current)),T==="raster"&&A){const O=new Image;O.onload=()=>{const L=document.createElement("canvas");L.width=P.width,L.height=P.height;const K=L.getContext("2d");K&&K.drawImage(O,0,0,L.width,L.height),L.toBlob(S,"image/png")},O.src=A;return}if(T==="split"&&A){const O=new Image;O.onload=()=>{const L=document.createElement("canvas");L.width=P.width,L.height=P.height*2;const K=L.getContext("2d");K&&(K.drawImage(O,0,0,L.width,P.height),K.fillStyle="#ffffff",K.fillRect(0,P.height-2,L.width,4),K.drawImage(P,0,P.height,L.width,P.height)),L.toBlob(S,"image/png")},O.src=A;return}P.toBlob(S,"image/png")}},Vs=()=>{Rr(S=>{if(!S)return;const P=URL.createObjectURL(S),L=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19),ee=`${T==="raster"?"photo-3d-standard":T==="split"?"photo-comparatif":"photo-raytracing"}-${L}.png`,re=document.createElement("a");re.href=P,re.download=ee,document.body.appendChild(re),re.click(),document.body.removeChild(re),URL.revokeObjectURL(P)})},qs=async()=>{Rr(async S=>{if(S)try{await navigator.clipboard.write([new ClipboardItem({"image/png":S})]),wr(!0),setTimeout(()=>wr(!1),2500)}catch(P){console.warn("Presse-papier non supporté pour les blobs:",P)}})},Pi=()=>{var S,P;v.current=!1,(S=i.current)==null||S.reset(),Ye(0),Ai(0),(P=d.current)==null||P.call(d)},js=S=>{var L;if(N(S),!i.current||!c.current||i.current.samples===0)return;const P=i.current,O=c.current;S&&p.current&&m.current?(p.current.uniforms.map.value=P.target.texture,O.setRenderTarget(null),m.current.render(O)):(L=P._quad)==null||L.render(O)},Gs=Math.min(100,Math.round(Wt/ie*100)),Ar=Wt>=ie;return R.jsxs("div",{className:"position-fixed top-0 start-0 w-100 h-100 d-flex flex-column text-white",style:{zIndex:1e4,backgroundColor:"rgba(5, 7, 15, 0.88)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"},children:[R.jsxs("div",{className:"d-flex align-items-center justify-content-between px-3 py-2 border-bottom",style:{borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(0, 0, 0, 0.4)"},children:[R.jsxs("div",{className:"d-flex align-items-center gap-2",children:[R.jsx("span",{className:"fs-5",children:"📸"}),R.jsxs("div",{children:[R.jsxs("h6",{className:"mb-0 fw-bold text-uppercase d-flex align-items-center gap-2",style:{letterSpacing:"0.08em"},children:["Mode Photo Raytracing Ultra-Réaliste",R.jsx("span",{className:"badge bg-warning text-dark font-monospace fw-bold",style:{fontSize:"10px"},children:"GPU Path Tracing"})]}),R.jsx("small",{className:"text-white-50",style:{fontSize:"11px"},children:"Illumination globale physique • Rebonds de lumière • Profondeur de champ Bokeh"})]})]}),R.jsxs("div",{className:"btn-group btn-group-sm shadow-sm",role:"group",children:[R.jsx("button",{type:"button",onClick:()=>M("raster"),className:`btn ${T==="raster"?"btn-primary fw-bold":"btn-outline-light text-white-50"}`,style:{fontSize:"11px"},title:"Afficher le rendu 3D standard temps réel (Touche Espace pour basculer)",children:"🎮 3D Standard"}),R.jsx("button",{type:"button",onClick:()=>M("split"),className:`btn ${T==="split"?"btn-warning text-dark fw-bold":"btn-outline-light text-white-50"}`,style:{fontSize:"11px"},title:"Comparer les 2 rendus l'un au-dessus de l'autre (Touche Espace)",children:"⬍ Comparer (2 Vues)"}),R.jsx("button",{type:"button",onClick:()=>M("raytracing"),className:`btn ${T==="raytracing"?"btn-info text-dark fw-bold":"btn-outline-light text-white-50"}`,style:{fontSize:"11px"},title:"Afficher uniquement le rendu Raytracing physique (Touche Espace)",children:"📸 Raytracing"})]}),R.jsxs("div",{className:"d-flex align-items-center gap-2",children:[R.jsxs("button",{onClick:Pi,className:"btn btn-sm btn-outline-light d-flex align-items-center gap-1.5",title:"Réinitialiser l'accumulation des rayons",children:["🔄 ",R.jsx("span",{children:"Relancer"})]}),R.jsxs("button",{onClick:r,className:"btn btn-sm btn-danger px-3 fw-bold d-flex align-items-center gap-1",title:"Fermer (Échap)",children:["✕ ",R.jsx("span",{children:"Quitter"})]})]})]}),R.jsxs("div",{className:"d-flex flex-grow-1 overflow-hidden",children:[R.jsxs("div",{ref:n,className:`flex-grow-1 d-flex flex-column align-items-center ${T==="split"?"justify-content-start overflow-y-auto p-3 gap-3":"justify-content-center p-3 overflow-hidden"} position-relative`,style:{background:"radial-gradient(circle at center, #111528 0%, #05070f 100%)"},children:[A&&T!=="raytracing"&&R.jsxs("div",{className:"position-relative shadow-lg border border-primary border-opacity-50 rounded overflow-hidden bg-black flex-shrink-0",style:{userSelect:"none",maxWidth:"100%"},children:[R.jsxs("div",{className:"position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-primary border-opacity-50 text-white pointer-events-none",style:{fontSize:"11px",zIndex:6},children:["🎮 ",T==="split"?"1. Rendu 3D Standard":"Rendu 3D Standard"]}),R.jsx("img",{src:A,alt:"Rendu 3D Standard",style:{maxWidth:"100%",maxHeight:T==="split"?"calc(50vh - 100px)":"calc(100vh - 180px)",objectFit:"contain",display:"block"}})]}),R.jsxs("div",{ref:a,className:`position-relative shadow-lg border border-warning border-opacity-50 rounded overflow-hidden bg-black flex-shrink-0 ${T==="raster"?"d-none":""}`,style:{userSelect:"none",cursor:He?"crosshair":"default",maxWidth:"100%"},onClick:Ws,title:He?"Cliquez sur n'importe quel point pour ajuster l'autofocus 🎯":void 0,children:[T==="split"&&R.jsx("div",{className:"position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-warning border-opacity-50 text-warning pointer-events-none",style:{fontSize:"11px",zIndex:6},children:"📸 2. Rendu Raytracing"}),yr&&R.jsxs("div",{className:"position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center",style:{background:"rgba(5, 7, 15, 0.94)",zIndex:10},children:[R.jsx("div",{className:"spinner-border text-warning mb-3",role:"status",style:{width:"3rem",height:"3rem"}}),R.jsx("h5",{className:"fw-bold",children:"Génération du maillage BVH spatial…"}),R.jsx("p",{className:"text-white-50 small mb-0",children:"Préparation des géométries et des textures physiques"})]}),_i&&R.jsxs("div",{className:"position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center",style:{background:"rgba(25, 5, 5, 0.95)",zIndex:11},children:[R.jsx("div",{className:"fs-1 mb-2",children:"⚠️"}),R.jsx("h5",{className:"fw-bold text-danger",children:"Erreur Raytracing"}),R.jsx("p",{className:"text-white-50 small mb-3",children:_i}),R.jsx("button",{onClick:Pi,className:"btn btn-warning btn-sm",children:"Réessayer"})]}),Ii.visible&&R.jsx("div",{className:"position-absolute border border-warning rounded-circle",style:{left:Ii.x-20,top:Ii.y-20,width:40,height:40,pointerEvents:"none",animation:"pulse 0.6s ease-out",boxShadow:"0 0 10px rgba(255, 193, 7, 0.8)",zIndex:10}}),!yr&&!_i&&R.jsxs("div",{className:"position-absolute bottom-0 start-0 w-100 p-2 d-flex align-items-center justify-content-between text-white",style:{background:"linear-gradient(to top, rgba(0,0,0,0.85), transparent)",fontSize:"12px",pointerEvents:"none",zIndex:10},children:[R.jsxs("div",{className:"d-flex align-items-center gap-2",children:[R.jsx("span",{className:`badge ${Ar?"bg-success":"bg-primary"}`,children:Ar?"✓ Rendu terminé":"⚡ Calcul en cours…"}),R.jsxs("span",{children:["Échantillon : ",R.jsx("strong",{children:Wt})," / ",ie," (",Gs,"%)"]})]}),R.jsxs("div",{className:"d-flex align-items-center gap-3 text-white-50",children:[R.jsxs("span",{children:["Temps : ",Hs,"s"]}),R.jsxs("span",{children:["Cadence : ",Us," éch/s"]})]})]})]})]}),R.jsxs("div",{className:"border-start p-3 d-flex flex-column gap-3 overflow-auto",style:{width:"320px",borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(10, 14, 25, 0.75)"},children:[R.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[R.jsxs("h6",{className:"fw-bold mb-2 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[R.jsx("span",{children:"⚙️"})," Qualité du Raytracing"]}),R.jsxs("div",{className:"mb-2",children:[R.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[R.jsx("span",{children:"Échantillons cibles (Samples)"}),R.jsx("span",{className:"fw-bold text-info",children:ie})]}),R.jsx("div",{className:"btn-group btn-group-sm w-100 mb-2",children:[40,100,250,500].map(S=>R.jsx("button",{type:"button",onClick:()=>{Te(S),Wt>=S&&Pi()},className:`btn ${ie===S?"btn-primary":"btn-outline-secondary text-white"}`,style:{fontSize:"10px"},children:S},S))})]}),R.jsxs("div",{className:"mb-2",children:[R.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[R.jsx("span",{children:"Rebonds de lumière (Bounces)"}),R.jsx("span",{className:"fw-bold text-info",children:oe})]}),R.jsx("input",{type:"range",className:"form-range form-range-sm",min:"1",max:"12",step:"1",value:oe,onChange:S=>Ut(parseInt(S.target.value,10))})]}),R.jsxs("div",{className:"mb-1",children:[R.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[R.jsx("span",{children:"Exposition lumineuse"}),R.jsx("span",{className:"fw-bold text-info",children:Ce.toFixed(2)})]}),R.jsx("input",{type:"range",className:"form-range form-range-sm",min:"0.4",max:"2.2",step:"0.05",value:Ce,onChange:S=>Os(parseFloat(S.target.value))})]}),R.jsxs("div",{className:"d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10",children:[R.jsxs("label",{className:"form-check-label d-flex align-items-center gap-1.5 mb-0",style:{fontSize:"11px"},children:[R.jsx("span",{children:"✨"}),R.jsx("span",{children:"Débruiteur Intelligent"})]}),R.jsx("div",{className:"form-check form-switch mb-0",children:R.jsx("input",{className:"form-check-input",type:"checkbox",role:"switch",checked:D,onChange:S=>js(S.target.checked)})})]}),R.jsxs("div",{className:"d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10",children:[R.jsxs("label",{className:"form-check-label d-flex align-items-center gap-1.5 mb-0",style:{fontSize:"11px"},children:[R.jsx("span",{children:"👤"}),R.jsx("span",{children:"Calque Personnages"})]}),R.jsx("div",{className:"form-check form-switch mb-0",children:R.jsx("input",{className:"form-check-input",type:"checkbox",role:"switch",checked:U,onChange:S=>j(S.target.checked)})})]})]}),R.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[R.jsxs("div",{className:"d-flex align-items-center justify-content-between mb-2",children:[R.jsxs("h6",{className:"fw-bold mb-0 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[R.jsx("span",{children:"🎯"})," Flou Bokeh / Profondeur"]}),R.jsx("div",{className:"form-check form-switch mb-0",children:R.jsx("input",{className:"form-check-input",type:"checkbox",role:"switch",checked:He&&!t.isOrthographicCamera,disabled:t.isOrthographicCamera,onChange:S=>vr(S.target.checked)})})]}),t.isOrthographicCamera?R.jsx("small",{className:"text-white-50",style:{fontSize:"10px"},children:"Indisponible en vue isométrique / orthographique (l'effet Bokeh optique nécessite une projection perspective)."}):He?R.jsxs(R.Fragment,{children:[R.jsxs("p",{className:"text-white-50 mb-2",style:{fontSize:"10px"},children:["💡 ",R.jsx("em",{children:"Cliquez sur le modèle ou un objet dans l'image pour régler l'autofocus instantanément !"})]}),R.jsxs("div",{className:"mb-2",children:[R.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[R.jsx("span",{children:"Distance de mise au point"}),R.jsxs("span",{className:"fw-bold text-info",children:[Tt," cm"]})]}),R.jsx("input",{type:"range",className:"form-range form-range-sm",min:"50",max:"1500",step:"5",value:Tt,onChange:S=>Ti(parseInt(S.target.value,10))})]}),R.jsxs("div",{className:"mb-1",children:[R.jsxs("label",{className:"form-label d-flex justify-content-between mb-1",style:{fontSize:"11px"},children:[R.jsx("span",{children:"Ouverture optique (f-stop)"}),R.jsxs("span",{className:"fw-bold text-info",children:["f/",St]})]}),R.jsx("div",{className:"btn-group btn-group-sm w-100",children:[1.4,2,2.8,5.6].map(S=>R.jsxs("button",{type:"button",onClick:()=>Ls(S),className:`btn ${St===S?"btn-warning text-dark fw-bold":"btn-outline-secondary text-white"}`,style:{fontSize:"10px"},children:["f/",S]},S))})]})]}):R.jsx("small",{className:"text-white-50",style:{fontSize:"10px"},children:"Activez l'effet pour créer un arrière-plan flou d'appareil photo professionnel reflex."})]}),R.jsxs("div",{className:"card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded",children:[R.jsxs("h6",{className:"fw-bold mb-2 text-warning d-flex align-items-center gap-1.5",style:{fontSize:"12px"},children:[R.jsx("span",{children:"📐"})," Format & Résolution"]}),R.jsx("select",{className:"form-select form-select-sm bg-dark text-white border-secondary",style:{fontSize:"11px"},value:F,onChange:S=>I(S.target.value),children:ds.map(S=>R.jsx("option",{value:S.id,children:S.label},S.id))})]}),R.jsxs("div",{className:"mt-auto d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25",children:[R.jsxs("button",{onClick:Vs,className:"btn btn-success fw-bold py-2 shadow d-flex align-items-center justify-content-center gap-2",title:"Télécharger l'image PNG",children:[R.jsx("span",{children:"💾"}),R.jsx("span",{children:"Télécharger la photo PNG"})]}),R.jsxs("button",{onClick:qs,className:`btn btn-sm ${Mi?"btn-info text-dark":"btn-outline-light"} py-1.5 d-flex align-items-center justify-content-center gap-2`,title:"Copier l'image dans le presse-papier",children:[R.jsx("span",{children:Mi?"✓":"📋"}),R.jsx("span",{children:Mi?"Copié dans le presse-papier !":"Copier l'image"})]}),R.jsx("button",{onClick:()=>xr(S=>!S),className:"btn btn-sm btn-outline-secondary text-white py-1",children:Vt?"▶ Reprendre le rendu":"⏸ Suspendre le rendu"})]})]})]}),R.jsxs("div",{className:"px-3 py-1.5 border-top d-flex align-items-center justify-content-between",style:{borderColor:"rgba(255, 255, 255, 0.12)",background:"rgba(0, 0, 0, 0.5)",fontSize:"11px"},children:[R.jsxs("div",{className:"d-flex align-items-center gap-3",children:[R.jsxs("span",{children:[R.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"Espace"})," Alterner 3D / Comparer (2 vues) / Raytracing"]}),R.jsx("span",{className:"text-white-50",children:"•"}),R.jsxs("span",{children:[R.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"F10"})," Basculer mode photo"]}),R.jsx("span",{className:"text-white-50",children:"•"}),R.jsxs("span",{className:"text-white-50",children:["Fermer avec ",R.jsx("kbd",{className:"bg-secondary text-white px-1 rounded",children:"Échap"})]})]}),R.jsxs("div",{className:"text-white-50",children:["Moteur : ",R.jsx("strong",{children:"three-gpu-pathtracer"})," (GGX / PBR / MIS / BVH)"]})]})]})}export{bc as RaytracingPhotoModal};
