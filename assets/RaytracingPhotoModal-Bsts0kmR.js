import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{$i as t,Bo as n,Do as r,Ea as i,Eo as a,Es as o,Fa as s,Ho as c,Io as l,Ko as u,Lo as d,No as f,Or as p,Ro as m,Ss as h,Ta as g,Ts as _,Ua as v,Uo as y,Vo as b,Wi as x,Wo as S,Ya as C,Ys as w,Za as T,Zo as E,_o as ee,_s as te,bs as D,ca as O,do as ne,fo as re,ga as k,is as ie,ka as A,lo as ae,ma as j,na as M,oa as N,pa as oe,ps as P,qo as se,ra as ce,sa as le,ta as F,ts as ue,uo as I,vs as de,wo as fe,xs as L,ya as pe,yo as R,ys as me,zo as z}from"./useSceneStore-Bdu17PTE.js";import{ln as he}from"./inventory-Uk43Ce4m.js";var ge=1.25,_e=65535,ve=-65536,ye=2**-24,be=Symbol(`SKIP_GENERATION`),xe={strategy:0,maxDepth:40,targetLeafSize:10,useSharedArrayBuffer:!1,setBoundingBox:!0,onProgress:null,indirect:!1,verbose:!0,range:null,[be]:!1};function B(e,t,n){return n.min.x=t[e],n.min.y=t[e+1],n.min.z=t[e+2],n.max.x=t[e+3],n.max.y=t[e+4],n.max.z=t[e+5],n}function Se(e){let t=-1,n=-1/0;for(let r=0;r<3;r++){let i=e[r+3]-e[r];i>n&&(n=i,t=r)}return t}function Ce(e,t,n){for(let r=0;r<3;r++){let i=t[e+2*r],a=t[e+2*r+1],o=i-a,s=i+a;o<n[r]&&(n[r]=o),s>n[r+3]&&(n[r+3]=s)}}function we(e){let t=e[3]-e[0],n=e[4]-e[1],r=e[5]-e[2];return 2*(t*n+n*r+r*t)}function V(e,t){return t[e+15]===_e}function H(e,t){return t[e+6]}function U(e,t){return t[e+14]}function W(e){return e+8}function G(e,t){return e+t[e+6]*8}function Te(e,t){return t[e+7]}function K(e){return e}function Ee(e,t,n,r,i){let a=1/0,o=1/0,s=1/0,c=-1/0,l=-1/0,u=-1/0,d=1/0,f=1/0,p=1/0,m=-1/0,h=-1/0,g=-1/0,_=e.offset||0;for(let r=(t-_)*6,i=(t+n-_)*6;r<i;r+=6){let t=e[r+0],n=e[r+1],i=t-n,_=t+n;i<a&&(a=i),_>c&&(c=_),t<d&&(d=t),t>m&&(m=t);let v=e[r+2],y=e[r+3],b=v-y,x=v+y;b<o&&(o=b),x>l&&(l=x),v<f&&(f=v),v>h&&(h=v);let S=e[r+4],C=e[r+5],w=S-C,T=S+C;w<s&&(s=w),T>u&&(u=T),S<p&&(p=S),S>g&&(g=S)}r[0]=a,r[1]=o,r[2]=s,r[3]=c,r[4]=l,r[5]=u,i[0]=d,i[1]=f,i[2]=p,i[3]=m,i[4]=h,i[5]=g}var De=8,Oe=8,ke=new Int32Array(De),Ae=new Float32Array(48),je=new Float32Array(48),q=new Float32Array(6),Me=new Float32Array(6),Ne=new Int32Array(Oe),Pe=new Float32Array(48);function Fe(e,t,n,r){for(let i=0;i<3;i++){let a=t[e+2*i],o=t[e+2*i+1],s=a-o,c=a+o;s<n[r+i]&&(n[r+i]=s),c>n[r+i+3]&&(n[r+i+3]=c)}}function Ie(e,t){let n=e[t+3]-e[t],r=e[t+4]-e[t+1],i=e[t+5]-e[t+2];return 2*(n*r+r*i+i*n)}function Le(e,t,n,r,i,a){let o=-1,s=0;if(a===0)o=Se(t),o!==-1&&(s=(t[o]+t[o+3])/2);else if(a===1)o=Se(e),o!==-1&&(s=Re(n,r,i,o));else if(a===2){let a=we(e),c=ge*i,l=n.offset||0,u=(r-l)*6,d=(r+i-l)*6;for(let e=0;e<3;e++){let r=t[e],l=(t[e+3]-r)/De;if(i<Oe){for(let t=0;t<i;t++){let r=u+t*6,i=n[r+2*e],a=t;for(;a>0&&n[Ne[a-1]+2*e]>i;)Ne[a]=Ne[a-1],a--;Ne[a]=r}for(let e=0;e<3;e++)q[e]=1/0,q[e+3]=-1/0,Me[e]=1/0,Me[e+3]=-1/0;for(let e=i-1;e>=0;e--)Ce(Ne[e],n,Me),Pe.set(Me,e*6);for(let t=0;t<i-1;t++){Ce(Ne[t],n,q);let r=n[Ne[t+1]+2*e];if(n[Ne[t]+2*e]===r)continue;let l=t+1,u=i-l,d=we(q)/a,f=Ie(Pe,l*6)/a,p=1+ge*(d*l+f*u);p<c&&(o=e,c=p,s=r)}}else{for(let e=0;e<De;e++){ke[e]=0;for(let t=0;t<3;t++)Ae[e*6+t]=1/0,Ae[e*6+t+3]=-1/0}for(let t=u;t<d;t+=6){let i=~~((n[t+2*e]-r)/l);i>=De&&(i=7),ke[i]++,Fe(t,n,Ae,i*6)}for(let e=0;e<6;e++)je[42+e]=Ae[42+e];for(let e=6;e>=0;e--){let t=e*6,n=t+6;for(let e=0;e<3;e++)je[t+e]=Math.min(Ae[t+e],je[n+e]),je[t+e+3]=Math.max(Ae[t+e+3],je[n+e+3])}let t=0;for(let n=0;n<7;n++){let u=n*6,d=ke[n];if(d!==0)for(let e=0;e<3;e++)t===0?(q[e]=Ae[u+e],q[e+3]=Ae[u+e+3]):(q[e]=Math.min(q[e],Ae[u+e]),q[e+3]=Math.max(q[e+3],Ae[u+e+3]));t+=d;let f=0,p=0;t!==0&&(f=we(q)/a);let m=i-t;m!==0&&(p=Ie(je,u+6)/a);let h=1+ge*(f*t+p*m);h<c&&(o=e,c=h,s=r+l+n*l)}}}}else console.warn(`BVH: Invalid build strategy value ${a} used.`);return{axis:o,pos:s}}function Re(e,t,n,r){let i=0,a=e.offset;for(let o=t,s=t+n;o<s;o++)i+=e[(o-a)*6+r*2];return i/n}function ze(e,t,n,r,i,a){let o=r,s=r+i-1,c=a.pos,l=a.axis*2,u=n.offset||0;for(;;){for(;o<=s&&n[(o-u)*6+l]<c;)o++;for(;o<=s&&n[(s-u)*6+l]>=c;)s--;if(o<s){for(let n=0;n<t;n++){let r=e[o*t+n];e[o*t+n]=e[s*t+n],e[s*t+n]=r}for(let e=0;e<6;e++){let t=o-u,r=s-u,i=n[t*6+e];n[t*6+e]=n[r*6+e],n[r*6+e]=i}o++,s--}else return o}}var Be=2**32,Ve=new Float32Array(6),He=new Float32Array(6);function Ue(e,t,n,r,i,a){let{maxDepth:o,verbose:s,targetLeafSize:c,_strictLeafSize:l=1/0,strategy:u,onProgress:d,useSharedArrayBuffer:f=!1}=i,p=e.primitiveBuffer,m=e.primitiveBufferStride,h=new(f?SharedArrayBuffer:ArrayBuffer)(32*Math.max(1,2*Math.ceil(r)-1)),g=new Float32Array(h),_=new Uint32Array(h),v=new Uint16Array(h),y=0,b=!1;return Ee(t,n,r,Ve,He),C(n,r,0),h.slice(0,y*32);function x(e){d&&d((e-a.offset)/a.count)}function S(e,t,n){let r=e*2;_[e+6]=t,v[r+14]=n,v[r+15]=_e,x(t+n)}function C(e,n,r){let i=y++,a=i*8;g.set(Ve,a),!b&&r>=o&&(b=!0,s&&console.warn(`BVH: Max depth of ${o} reached when generating BVH. Consider increasing maxDepth.`));let d=n>l;if(n<=c&&!d||r>=o){S(a,e,n);return}let f=Le(Ve,He,t,e,n,u),h=f.axis===-1?-1:ze(p,m,t,e,n,f);if(f.axis===-1||h===e||h===e+n){if(!d){S(a,e,n);return}f.axis=Math.max(0,Se(Ve)),h=e+Math.max(1,Math.floor(n/2))}_[a+7]=f.axis;let v=h-e;Ee(t,e,v,Ve,He),C(e,v,r+1);let x=y-i;if(x>Be)throw Error(`MeshBVH: Cannot store relative child node offset greater than 32 bits.`);_[a+6]=x;let w=n-v;Ee(t,h,w,Ve,He),C(h,w,r+1)}}function We(e,t){let n=e.getRootRanges(t.range),r=n[0],i=n[n.length-1],a={offset:r.offset,count:i.offset+i.count-r.offset},o=new Float32Array(6*a.count);o.offset=a.offset,e.computePrimitiveBounds(a.offset,a.count,o),e._roots=n.map(n=>Ue(e,o,n.offset,n.count,t,a))}var Ge=class{constructor(e){this._getNewPrimitive=e,this._primitives=[]}getPrimitive(){let e=this._primitives;return e.length===0?this._getNewPrimitive():e.pop()}releasePrimitive(e){this._primitives.push(e)}},J=new class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;let e=[],t=null;this.setBuffer=n=>{t&&e.push(t),t=n,this.float32Array=new Float32Array(n),this.uint16Array=new Uint16Array(n),this.uint32Array=new Uint32Array(n)},this.clearBuffer=()=>{t=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,e.length!==0&&this.setBuffer(e.pop())}}},Ke,qe,Je=[],Ye=new Ge(()=>new t);function Xe(e,t,n,r,i,a){Ke=Ye.getPrimitive(),qe=Ye.getPrimitive(),Je.push(Ke,qe),J.setBuffer(e._roots[t]);let o=Ze(0,e.geometry,n,r,i,a);J.clearBuffer(),Ye.releasePrimitive(Ke),Ye.releasePrimitive(qe),Je.pop(),Je.pop();let s=Je.length;return s>0&&(qe=Je[s-1],Ke=Je[s-2]),o}function Ze(e,t,n,r,i=null,a=0,o=0){let{float32Array:s,uint16Array:c,uint32Array:l}=J,u=e*2;if(V(u,c)){let t=H(e,l),n=U(u,c);return B(K(e),s,Ke),r(t,n,!1,o,a+e/8,Ke)}{let u=W(e),d=G(e,l),f=u,p=d,m,h,g,_;if(i&&(g=Ke,_=qe,B(K(f),s,g),B(K(p),s,_),m=i(g),h=i(_),h<m)){f=d,p=u;let e=m;m=h,h=e,g=_}g||(g=Ke,B(K(f),s,g));let v=V(f*2,c),y=n(g,v,m,o+1,a+f/8),b;if(y===2){let e=w(f);b=r(e,T(f)-e,!0,o+1,a+f/8,g)}else b=y&&Ze(f,t,n,r,i,a,o+1);if(b)return!0;_=qe,B(K(p),s,_);let x=V(p*2,c),S=n(_,x,h,o+1,a+p/8),C;if(S===2){let e=w(p);C=r(e,T(p)-e,!0,o+1,a+p/8,_)}else C=S&&Ze(p,t,n,r,i,a,o+1);return!!C;function w(e){let{uint16Array:t,uint32Array:n}=J,r=e*2;for(;!V(r,t);)e=W(e),r=e*2;return H(e,n)}function T(e){let{uint16Array:t,uint32Array:n}=J,r=e*2;for(;!V(r,t);)e=G(e,n),r=e*2;return H(e,n)+U(r,t)}}}var Qe=new J.constructor,$e=new J.constructor,et=new Ge(()=>new t),tt=new t,nt=new t,rt=new t,it=new t,at=!1;function ot(e,t,n,r){if(at)throw Error(`MeshBVH: Recursive calls to bvhcast not supported.`);at=!0;let i=e._roots,a=t._roots,o,s=0,c=0,l=new I().copy(n).invert();for(let e=0,t=i.length;e<t;e++){Qe.setBuffer(i[e]),c=0;let t=et.getPrimitive();B(K(0),Qe.float32Array,t),t.applyMatrix4(l);for(let e=0,i=a.length;e<i&&($e.setBuffer(a[e]),o=st(0,0,n,l,r,s,c,0,0,t),$e.clearBuffer(),c+=a[e].byteLength/32,!o);e++);if(et.releasePrimitive(t),Qe.clearBuffer(),s+=i[e].byteLength/32,o)break}return at=!1,o}function st(e,t,n,r,i,a=0,o=0,s=0,c=0,l=null,u=!1){let d,f;u?(d=$e,f=Qe):(d=Qe,f=$e);let p=d.float32Array,m=d.uint32Array,h=d.uint16Array,g=f.float32Array,_=f.uint32Array,v=f.uint16Array,y=e*2,b=t*2,x=V(y,h),S=V(b,v),C=!1;if(S&&x)C=u?i(H(t,_),U(t*2,v),H(e,m),U(e*2,h),c,o+t/8,s,a+e/8):i(H(e,m),U(e*2,h),H(t,_),U(t*2,v),s,a+e/8,c,o+t/8);else if(S){let l=et.getPrimitive();B(K(t),g,l),l.applyMatrix4(n);let d=W(e),f=G(e,m);B(K(d),p,tt),B(K(f),p,nt);let h=l.intersectsBox(tt),_=l.intersectsBox(nt);C=h&&st(t,d,r,n,i,o,a,c,s+1,l,!u)||_&&st(t,f,r,n,i,o,a,c,s+1,l,!u),et.releasePrimitive(l)}else{let d=W(t),f=G(t,_);B(K(d),g,rt),B(K(f),g,it);let h=l.intersectsBox(rt),v=l.intersectsBox(it);if(h&&v)C=st(e,d,n,r,i,a,o,s,c+1,l,u)||st(e,f,n,r,i,a,o,s,c+1,l,u);else if(h){if(x)C=st(e,d,n,r,i,a,o,s,c+1,l,u);else{let t=et.getPrimitive();t.copy(rt).applyMatrix4(n);let l=W(e),f=G(e,m);B(K(l),p,tt),B(K(f),p,nt);let h=t.intersectsBox(tt),g=t.intersectsBox(nt);C=h&&st(d,l,r,n,i,o,a,c,s+1,t,!u)||g&&st(d,f,r,n,i,o,a,c,s+1,t,!u),et.releasePrimitive(t)}}else if(v){if(x)C=st(e,f,n,r,i,a,o,s,c+1,l,u);else{let t=et.getPrimitive();t.copy(it).applyMatrix4(n);let l=W(e),d=G(e,m);B(K(l),p,tt),B(K(d),p,nt);let h=t.intersectsBox(tt),g=t.intersectsBox(nt);C=h&&st(f,l,r,n,i,o,a,c,s+1,t,!u)||g&&st(f,d,r,n,i,o,a,c,s+1,t,!u),et.releasePrimitive(t)}}}return C}var ct=new class{constructor(){let e=null,t=null,n=null,r=!1;this.root=null,this.buffer=null,this.uint32Array=null,this.uint16Array=null,this.setBVH=(i,a)=>{if(r)throw Error(`BVHTraversalHelper: cannot call setBVH during an active traversal.`);this.root=a,this.buffer=e=i._roots[a],this.uint16Array=n=new Uint16Array(e),this.uint32Array=t=new Uint32Array(e)},this.reset=()=>{this.root=null,this.buffer=e=null,this.uint16Array=n=null,this.uint32Array=t=null},this.getRangeStart=e=>{let r=e*2;for(;!V(r,n);)e=W(e),r=e*2;return H(e,t)},this.getRangeEnd=e=>{let r=e*2;for(;!V(r,n);)e=G(e,t),r=e*2;return H(e,t)+U(r,n)};let i=(e,r,a)=>{let o=V(r*2,n);if(!e(a,o,r)&&!o){let n=W(r),o=G(r,t);i(e,n,a+1),i(e,o,a+1)}};this.traverseBuffer=e=>{if(r)throw Error(`BVHTraversalHelper: cannot start a traversal during an active traversal.`);r=!0;try{i(e,0,0)}finally{r=!1}},this.traverse=r=>{this.traverseBuffer((i,a,o)=>{if(a){let s=o*2,c=t[o+6],l=n[s+14];return r(i,a,new Float32Array(e,o*4,6),c,l)}{let n=Te(o,t);return r(i,a,new Float32Array(e,o*4,6),n)}})}}},lt=new t,ut=new Float32Array(6),dt=class{constructor(){this._roots=null,this.primitiveBuffer=null,this.primitiveBufferStride=null}init(e){e={...xe,...e},`maxLeafSize`in e&&(console.warn(`BVH: "maxLeafSize" option has been deprecated. Use "targetLeafSize", instead.`),e={...e,targetLeafSize:e.maxLeafSize}),We(this,e)}getRootRanges(){throw Error(`BVH: getRootRanges() not implemented`)}writePrimitiveBounds(){throw Error(`BVH: writePrimitiveBounds() not implemented`)}writePrimitiveRangeBounds(e,t,n,r){let i=1/0,a=1/0,o=1/0,s=-1/0,c=-1/0,l=-1/0;for(let n=e,r=e+t;n<r;n++){this.writePrimitiveBounds(n,ut,0);let[e,t,r,u,d,f]=ut;e<i&&(i=e),u>s&&(s=u),t<a&&(a=t),d>c&&(c=d),r<o&&(o=r),f>l&&(l=f)}return n[r+0]=i,n[r+1]=a,n[r+2]=o,n[r+3]=s,n[r+4]=c,n[r+5]=l,n}computePrimitiveBounds(e,t,n){let r=n.offset||0;for(let i=e,a=e+t;i<a;i++){this.writePrimitiveBounds(i,ut,0);let[e,t,a,o,s,c]=ut,l=(e+o)/2,u=(t+s)/2,d=(a+c)/2,f=(o-e)/2,p=(s-t)/2,m=(c-a)/2,h=(i-r)*6;n[h+0]=l,n[h+1]=f+(Math.abs(l)+f)*ye,n[h+2]=u,n[h+3]=p+(Math.abs(u)+p)*ye,n[h+4]=d,n[h+5]=m+(Math.abs(d)+m)*ye}return n}shiftPrimitiveOffsets(e){let t=this._indirectBuffer;if(t)for(let n=0,r=t.length;n<r;n++)t[n]+=e;else{let t=this._roots;for(let n=0;n<t.length;n++){let r=t[n],i=new Uint32Array(r),a=new Uint16Array(r),o=r.byteLength/32;for(let t=0;t<o;t++){let n=8*t;V(2*n,a)&&(i[n+6]+=e)}}}}traverse(e,t=0){ct.setBVH(this,t),ct.traverse(e),ct.reset()}refit(){let e=this._roots;for(let t=0,n=e.length;t<n;t++){let n=e[t],r=new Uint32Array(n),i=new Uint16Array(n),a=new Float32Array(n),o=n.byteLength/32;for(let e=o-1;e>=0;e--){let t=e*8,n=t*2;if(V(n,i)){let e=H(t,r),o=U(n,i);this.writePrimitiveRangeBounds(e,o,ut,0),a.set(ut,t)}else{let e=W(t),n=G(t,r);for(let r=0;r<3;r++){let i=a[e+r],o=a[e+r+3],s=a[n+r],c=a[n+r+3];a[t+r]=i<s?i:s,a[t+r+3]=o>c?o:c}}}}}getBoundingBox(e){return e.makeEmpty(),this._roots.forEach(t=>{B(0,new Float32Array(t),lt),e.union(lt)}),e}shapecast(e){let{boundsTraverseOrder:t,intersectsBounds:n,intersectsRange:r,intersectsPrimitive:i,scratchPrimitive:a,iterate:o}=e;if(r&&i){let e=r;r=(t,n,r,s,c)=>e(t,n,r,s,c)?!0:o(t,n,this,i,r,s,a)}else r||=i?(e,t,n,r)=>o(e,t,this,i,n,r,a):(e,t,n)=>n;let s=!1,c=0,l=this._roots;for(let e=0,i=l.length;e<i;e++){let i=l[e];if(s=Xe(this,e,n,r,t,c),s)break;c+=i.byteLength/32}return s}bvhcast(e,t,n){let{intersectsRanges:r}=n;return ot(this,e,t,r)}};function ft(){return typeof SharedArrayBuffer<`u`}function pt(e){return e.index?e.index.count:e.attributes.position.count}function mt(e){return pt(e)/3}function ht(e,t=ArrayBuffer){return e>65535?new Uint32Array(new t(4*e)):new Uint16Array(new t(2*e))}function gt(e,t){if(!e.index){let n=e.attributes.position.count,r=ht(n,t.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer);e.setIndex(new F(r,1));for(let e=0;e<n;e++)r[e]=e}}function _t(e,t,n){let r=pt(e)/n,i=t||e.drawRange,a=i.start/n,o=(i.start+i.count)/n,s=Math.max(0,a),c=Math.min(r,o)-s;return{offset:Math.floor(s),count:Math.floor(c)}}function vt(e,t){return e.groups.map(e=>({offset:e.start/t,count:e.count/t}))}function yt(e,t,n){let r=_t(e,t,n),i=vt(e,n);if(!i.length)return[r];let a=[],o=r.offset,s=r.offset+r.count,c=pt(e)/n,l=[];for(let e of i){let{offset:t,count:n}=e,r=t,i=t+(isFinite(n)?n:c-t);r<s&&i>o&&(l.push({pos:Math.max(o,r),isStart:!0}),l.push({pos:Math.min(s,i),isStart:!1}))}l.sort((e,t)=>e.pos===t.pos?e.type===`end`?-1:1:e.pos-t.pos);let u=0,d=null;for(let e of l){let t=e.pos;u!==0&&t!==d&&a.push({offset:d,count:t-d}),u+=e.isStart?1:-1,d=t}return a}function bt(e,t){let n=e[e.length-1],r=n.offset+n.count>2**16,i=e.reduce((e,t)=>e+t.count,0),a=r?4:2,o=t?new SharedArrayBuffer(i*a):new ArrayBuffer(i*a),s=r?new Uint32Array(o):new Uint16Array(o),c=0;for(let t=0;t<e.length;t++){let{offset:n,count:r}=e[t];for(let e=0;e<r;e++)s[c+e]=n+e;c+=r}return s}var xt=class extends dt{get indirect(){return!!this._indirectBuffer}get primitiveStride(){return null}get primitiveBufferStride(){return this.indirect?1:this.primitiveStride}set primitiveBufferStride(e){}get primitiveBuffer(){return this.indirect?this._indirectBuffer:this.geometry.index.array}set primitiveBuffer(e){}constructor(e,t={}){if(!e.isBufferGeometry)throw Error(`BVH: Only BufferGeometries are supported.`);if(e.index&&e.index.isInterleavedBufferAttribute)throw Error(`BVH: InterleavedBufferAttribute is not supported for the index attribute.`);if(t.useSharedArrayBuffer&&!ft())throw Error(`BVH: SharedArrayBuffer is not available.`);super(),this.geometry=e,this.resolvePrimitiveIndex=t.indirect?e=>this._indirectBuffer[e]:e=>e,this.primitiveBuffer=null,this.primitiveBufferStride=null,this._indirectBuffer=null,t={...xe,...t},t[be]||this.init(t)}init(e){let{geometry:n,primitiveStride:r}=this;if(e.indirect){let t=bt(yt(n,e.range,r),e.useSharedArrayBuffer);this._indirectBuffer=t}else gt(n,e);super.init(e),!n.boundingBox&&e.setBoundingBox&&(n.boundingBox=this.getBoundingBox(new t))}getRootRanges(e){return this.indirect?[{offset:0,count:this._indirectBuffer.length}]:yt(this.geometry,e,this.primitiveStride)}raycastObject3D(){throw Error(`BVH: raycastObject3D() not implemented`)}},St=class{constructor(){this.min=1/0,this.max=-1/0}setFromPointsField(e,t){let n=1/0,r=-1/0;for(let i=0,a=e.length;i<a;i++){let a=e[i][t];n=a<n?a:n,r=a>r?a:r}this.min=n,this.max=r}setFromPoints(e,t){let n=1/0,r=-1/0;for(let i=0,a=t.length;i<a;i++){let a=t[i],o=e.dot(a);n=o<n?o:n,r=o>r?o:r}this.min=n,this.max=r}isSeparated(e){return this.min>e.max||e.min>this.max}};St.prototype.setFromBox=(function(){let e=new L;return function(t,n){let r=n.min,i=n.max,a=1/0,o=-1/0;for(let n=0;n<=1;n++)for(let s=0;s<=1;s++)for(let c=0;c<=1;c++){e.x=r.x*n+i.x*(1-n),e.y=r.y*s+i.y*(1-s),e.z=r.z*c+i.z*(1-c);let l=t.dot(e);a=Math.min(l,a),o=Math.max(l,o)}this.min=a,this.max=o}})();var Ct=(function(){let e=new L,t=new L,n=new L;return function(r,i,a){let o=r.start,s=e,c=i.start,l=t;n.subVectors(o,c),e.subVectors(r.end,r.start),t.subVectors(i.end,i.start);let u=n.dot(l),d=l.dot(s),f=l.dot(l),p=n.dot(s),m=s.dot(s)*f-d*d,h,g;h=m===0?0:(u*d-p*f)/m,g=(u+h*d)/f,a.x=h,a.y=g}})(),wt=(function(){let e=new D,t=new L,n=new L;return function(r,i,a,o){Ct(r,i,e);let s=e.x,c=e.y;if(s>=0&&s<=1&&c>=0&&c<=1)r.at(s,a),i.at(c,o);else if(s>=0&&s<=1)c<0?i.at(0,o):i.at(1,o),r.closestPointToPoint(o,!0,a);else if(c>=0&&c<=1)s<0?r.at(0,a):r.at(1,a),i.closestPointToPoint(a,!0,o);else{let e;e=s<0?r.start:r.end;let l;l=c<0?i.start:i.end;let u=t,d=n;if(r.closestPointToPoint(l,!0,t),i.closestPointToPoint(e,!0,n),u.distanceToSquared(l)<=d.distanceToSquared(e)){a.copy(u),o.copy(l);return}a.copy(e),o.copy(d);return}}})(),Tt=(function(){let e=new L,t=new L,n=new r,i=new v;return function(r,a){let{radius:o,center:s}=r,{a:c,b:l,c:u}=a;if(i.start=c,i.end=l,i.closestPointToPoint(s,!0,e).distanceTo(s)<=o||(i.start=c,i.end=u,i.closestPointToPoint(s,!0,e).distanceTo(s)<=o)||(i.start=l,i.end=u,i.closestPointToPoint(s,!0,e).distanceTo(s)<=o))return!0;let d=a.getPlane(n);if(Math.abs(d.distanceToPoint(s))<=o){let e=d.projectPoint(s,t);if(a.containsPoint(e))return!0}return!1}})(),Et=[`x`,`y`,`z`],Dt=1e-15,Ot=Dt*Dt;function kt(e){return Math.abs(e)<Dt}var At=class extends P{constructor(...e){super(...e),this.isExtendedTriangle=!0,this.satAxes=[,,,,].fill().map(()=>new L),this.satBounds=[,,,,].fill().map(()=>new St),this.points=[this.a,this.b,this.c],this.plane=new r,this.isDegenerateIntoSegment=!1,this.isDegenerateIntoPoint=!1,this.degenerateSegment=new v,this.needsUpdate=!0}intersectsSphere(e){return Tt(e,this)}update(){let e=this.a,t=this.b,n=this.c,r=this.points,i=this.satAxes,a=this.satBounds,o=i[0],s=a[0];this.getNormal(o),s.setFromPoints(o,r);let c=i[1],l=a[1];c.subVectors(e,t),l.setFromPoints(c,r);let u=i[2],d=a[2];u.subVectors(t,n),d.setFromPoints(u,r);let f=i[3],p=a[3];f.subVectors(n,e),p.setFromPoints(f,r);let m=c.length(),h=u.length(),g=f.length();this.isDegenerateIntoPoint=!1,this.isDegenerateIntoSegment=!1,m<Dt?h<Dt||g<Dt?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(e),this.degenerateSegment.end.copy(n)):h<Dt?g<Dt?this.isDegenerateIntoPoint=!0:(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(t),this.degenerateSegment.end.copy(e)):g<Dt&&(this.isDegenerateIntoSegment=!0,this.degenerateSegment.start.copy(n),this.degenerateSegment.end.copy(t)),this.plane.setFromNormalAndCoplanarPoint(o,e),this.needsUpdate=!1}};At.prototype.closestPointToSegment=(function(){let e=new L,t=new L,n=new v;return function(r,i=null,a=null){this.needsUpdate&&this.update();let{start:o,end:s}=r,c=this.points,l,u=1/0;if(this.plane.distanceToPoint(o)*this.plane.distanceToPoint(s)<0&&this.plane.intersectLine(r,e)!==null&&this.containsPoint(e))return i&&i.copy(e),a&&a.copy(e),0;for(let o=0;o<3;o++){let s=(o+1)%3;n.start.copy(c[o]),n.end.copy(c[s]),wt(n,r,e,t),l=e.distanceToSquared(t),l<u&&(u=l,i&&i.copy(e),a&&a.copy(t))}return this.closestPointToPoint(o,e),l=o.distanceToSquared(e),l<u&&(u=l,i&&i.copy(e),a&&a.copy(o)),this.closestPointToPoint(s,e),l=s.distanceToSquared(e),l<u&&(u=l,i&&i.copy(e),a&&a.copy(s)),Math.sqrt(u)}})(),At.prototype.intersectsTriangle=(function(){let e=new At,t=new St,n=new St,r=new L,i=new L,a=new L,o=new L,s=new v,c=new v,l=new L,u=new D,d=new D;function f(e,i,a,s){let c=r;!e.isDegenerateIntoPoint&&!e.isDegenerateIntoSegment?c.copy(e.plane.normal):c.copy(i.plane.normal);let l=e.satBounds,u=e.satAxes;for(let r=1;r<4;r++){let a=l[r],s=u[r];if(t.setFromPoints(s,i.points),a.isSeparated(t)||(o.copy(c).cross(s),t.setFromPoints(o,e.points),n.setFromPoints(o,i.points),t.isSeparated(n)))return!1}let d=i.satBounds,f=i.satAxes;for(let r=1;r<4;r++){let a=d[r],s=f[r];if(t.setFromPoints(s,e.points),a.isSeparated(t)||(o.crossVectors(c,s),t.setFromPoints(o,e.points),n.setFromPoints(o,i.points),t.isSeparated(n)))return!1}return a&&(s||console.warn(`ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0.`),a.start.set(0,0,0),a.end.set(0,0,0)),!0}function p(e,t,n,r,i,a,o,s,c,l,u){let d=o/(o-s);l.x=r+(i-r)*d,u.start.subVectors(t,e).multiplyScalar(d).add(e),d=o/(o-c),l.y=r+(a-r)*d,u.end.subVectors(n,e).multiplyScalar(d).add(e)}function m(e,t,n,r,i,a,o,s,c,l,u){if(i>0)p(e.c,e.a,e.b,r,t,n,c,o,s,l,u);else if(a>0)p(e.b,e.a,e.c,n,t,r,s,o,c,l,u);else if(s*c>0||o!=0)p(e.a,e.b,e.c,t,n,r,o,s,c,l,u);else if(s!=0)p(e.b,e.a,e.c,n,t,r,s,o,c,l,u);else if(c!=0)p(e.c,e.a,e.b,r,t,n,c,o,s,l,u);else return!0;return!1}function h(e,t,n,i){let a=t.degenerateSegment,o=e.plane.distanceToPoint(a.start),s=e.plane.distanceToPoint(a.end);return kt(o)?kt(s)?f(e,t,n,i):(n&&(n.start.copy(a.start),n.end.copy(a.start)),e.containsPoint(a.start)):kt(s)?(n&&(n.start.copy(a.end),n.end.copy(a.end)),e.containsPoint(a.end)):e.plane.intersectLine(a,r)!=null&&(n&&(n.start.copy(r),n.end.copy(r)),e.containsPoint(r))}function g(e,t,n){let r=t.a;return kt(e.plane.distanceToPoint(r))&&e.containsPoint(r)?(n&&(n.start.copy(r),n.end.copy(r)),!0):!1}function _(e,t,n){let i=e.degenerateSegment,a=t.a;return i.closestPointToPoint(a,!0,r),a.distanceToSquared(r)<Ot&&(n&&(n.start.copy(a),n.end.copy(a)),!0)}function y(e,t,n,o){if(e.isDegenerateIntoSegment){if(t.isDegenerateIntoSegment){let o=e.degenerateSegment,s=t.degenerateSegment,c=i,l=a;o.delta(c),s.delta(l);let u=r.subVectors(s.start,o.start),d=c.x*l.y-c.y*l.x;if(kt(d))return!1;let f=(u.x*l.y-u.y*l.x)/d,p=-(c.x*u.y-c.y*u.x)/d;return f<0||f>1||p<0||p>1?!1:kt(o.start.z+c.z*f-(s.start.z+l.z*p))?(n&&(n.start.copy(o.start).addScaledVector(c,f),n.end.copy(o.start).addScaledVector(c,f)),!0):!1}return t.isDegenerateIntoPoint?_(e,t,n):h(t,e,n,o)}if(e.isDegenerateIntoPoint)return t.isDegenerateIntoPoint?t.a.distanceToSquared(e.a)<Ot&&(n&&(n.start.copy(e.a),n.end.copy(e.a)),!0):t.isDegenerateIntoSegment?_(t,e,n):g(t,e,n);if(t.isDegenerateIntoPoint)return g(e,t,n);if(t.isDegenerateIntoSegment)return h(e,t,n,o)}return function(t,n=null,r=!1){this.needsUpdate&&this.update(),t.isExtendedTriangle?t.needsUpdate&&t.update():(e.copy(t),e.update(),t=e);let o=y(this,t,n,r);if(o!==void 0)return o;let p=this.plane,h=t.plane,g=h.distanceToPoint(this.a),_=h.distanceToPoint(this.b),v=h.distanceToPoint(this.c);kt(g)&&(g=0),kt(_)&&(_=0),kt(v)&&(v=0);let b=g*_,x=g*v;if(b>0&&x>0)return!1;let S=p.distanceToPoint(t.a),C=p.distanceToPoint(t.b),w=p.distanceToPoint(t.c);kt(S)&&(S=0),kt(C)&&(C=0),kt(w)&&(w=0);let T=S*C,E=S*w;if(T>0&&E>0)return!1;i.copy(p.normal),a.copy(h.normal);let ee=i.cross(a),te=0,D=Math.abs(ee.x),O=Math.abs(ee.y);O>D&&(D=O,te=1),Math.abs(ee.z)>D&&(te=2);let ne=Et[te],re=this.a[ne],k=this.b[ne],ie=this.c[ne],A=t.a[ne],ae=t.b[ne],j=t.c[ne];if(m(this,re,k,ie,b,x,g,_,v,u,s)||m(t,A,ae,j,T,E,S,C,w,d,c))return f(this,t,n,r);if(u.y<u.x){let e=u.y;u.y=u.x,u.x=e,l.copy(s.start),s.start.copy(s.end),s.end.copy(l)}if(d.y<d.x){let e=d.y;d.y=d.x,d.x=e,l.copy(c.start),c.start.copy(c.end),c.end.copy(l)}return u.y<d.x||d.y<u.x?!1:(n&&(d.x>u.x?n.start.copy(c.start):n.start.copy(s.start),d.y<u.y?n.end.copy(c.end):n.end.copy(s.end)),!0)}})(),At.prototype.distanceToPoint=(function(){let e=new L;return function(t){return this.closestPointToPoint(t,e),t.distanceTo(e)}})(),At.prototype.distanceToTriangle=(function(){let e=new L,t=new L,n=[`a`,`b`,`c`],r=new v,i=new v;return function(a,o=null,s=null){let c=o||s?r:null;if(this.intersectsTriangle(a,c,!0))return(o||s)&&(o&&c.getCenter(o),s&&c.getCenter(s)),0;let l=1/0;for(let t=0;t<3;t++){let r,i=n[t],c=a[i];this.closestPointToPoint(c,e),r=c.distanceToSquared(e),r<l&&(l=r,o&&o.copy(e),s&&s.copy(c));let u=this[i];a.closestPointToPoint(u,e),r=u.distanceToSquared(e),r<l&&(l=r,o&&o.copy(u),s&&s.copy(e))}for(let c=0;c<3;c++){let u=n[c],d=n[(c+1)%3];r.set(this[u],this[d]);for(let c=0;c<3;c++){let u=n[c],d=n[(c+1)%3];i.set(a[u],a[d]),wt(r,i,e,t);let f=e.distanceToSquared(t);f<l&&(l=f,o&&o.copy(e),s&&s.copy(t))}}return Math.sqrt(l)}})();var Y=class{constructor(e,t,n){this.isOrientedBox=!0,this.min=new L,this.max=new L,this.matrix=new I,this.invMatrix=new I,this.points=Array(8).fill().map(()=>new L),this.satAxes=[,,,].fill().map(()=>new L),this.satBounds=[,,,].fill().map(()=>new St),this.alignedSatBounds=[,,,].fill().map(()=>new St),this.needsUpdate=!1,e&&this.min.copy(e),t&&this.max.copy(t),n&&this.matrix.copy(n)}set(e,t,n){this.min.copy(e),this.max.copy(t),this.matrix.copy(n),this.needsUpdate=!0}copy(e){this.min.copy(e.min),this.max.copy(e.max),this.matrix.copy(e.matrix),this.needsUpdate=!0}};Y.prototype.update=(function(){return function(){let e=this.matrix,t=this.min,n=this.max,r=this.points;for(let i=0;i<=1;i++)for(let a=0;a<=1;a++)for(let o=0;o<=1;o++){let s=r[1*i|2*a|4*o];s.x=i?n.x:t.x,s.y=a?n.y:t.y,s.z=o?n.z:t.z,s.applyMatrix4(e)}let i=this.satBounds,a=this.satAxes,o=r[0];for(let e=0;e<3;e++){let t=a[e],n=i[e],s=r[1<<e];t.subVectors(o,s),n.setFromPoints(t,r)}let s=this.alignedSatBounds;s[0].setFromPointsField(r,`x`),s[1].setFromPointsField(r,`y`),s[2].setFromPointsField(r,`z`),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=!1}})(),Y.prototype.intersectsBox=(function(){let e=new St;return function(t){this.needsUpdate&&this.update();let n=t.min,r=t.max,i=this.satBounds,a=this.satAxes,o=this.alignedSatBounds;if(e.min=n.x,e.max=r.x,o[0].isSeparated(e)||(e.min=n.y,e.max=r.y,o[1].isSeparated(e))||(e.min=n.z,e.max=r.z,o[2].isSeparated(e)))return!1;for(let n=0;n<3;n++){let r=a[n],o=i[n];if(e.setFromBox(r,t),o.isSeparated(e))return!1}return!0}})(),Y.prototype.intersectsTriangle=(function(){let e=new At,t=[,,,],n=new St,r=new St,i=new L;return function(a){this.needsUpdate&&this.update(),a.isExtendedTriangle?a.needsUpdate&&a.update():(e.copy(a),e.update(),a=e);let o=this.satBounds,s=this.satAxes;t[0]=a.a,t[1]=a.b,t[2]=a.c;for(let e=0;e<3;e++){let r=o[e],i=s[e];if(n.setFromPoints(i,t),r.isSeparated(n))return!1}let c=a.satBounds,l=a.satAxes,u=this.points;for(let e=0;e<3;e++){let t=c[e],r=l[e];if(n.setFromPoints(r,u),t.isSeparated(n))return!1}for(let e=0;e<3;e++){let a=s[e];for(let e=0;e<4;e++){let o=l[e];if(i.crossVectors(a,o),n.setFromPoints(i,t),r.setFromPoints(i,u),n.isSeparated(r))return!1}}return!0}})(),Y.prototype.closestPointToPoint=(function(){return function(e,t){return this.needsUpdate&&this.update(),t.copy(e).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),t}})(),Y.prototype.distanceToPoint=(function(){let e=new L;return function(t){return this.closestPointToPoint(t,e),t.distanceTo(e)}})(),Y.prototype.distanceToBox=(function(){let e=[`x`,`y`,`z`],t=Array(12).fill().map(()=>new v),n=Array(12).fill().map(()=>new v),r=new L,i=new L;return function(a,o=0,s=null,c=null){if(this.needsUpdate&&this.update(),this.intersectsBox(a))return(s||c)&&(a.getCenter(i),this.closestPointToPoint(i,r),a.closestPointToPoint(r,i),s&&s.copy(r),c&&c.copy(i)),0;let l=o*o,u=a.min,d=a.max,f=this.points,p=1/0;for(let e=0;e<8;e++){let t=f[e];i.copy(t).clamp(u,d);let n=t.distanceToSquared(i);if(n<p&&(p=n,s&&s.copy(t),c&&c.copy(i),n<l))return Math.sqrt(n)}let m=0;for(let r=0;r<3;r++)for(let i=0;i<=1;i++)for(let a=0;a<=1;a++){let o=(r+1)%3,s=(r+2)%3,c=i<<o|a<<s,l=1<<r|i<<o|a<<s,p=f[c],h=f[l];t[m].set(p,h);let g=e[r],_=e[o],v=e[s],y=n[m],b=y.start,x=y.end;b[g]=u[g],b[_]=i?u[_]:d[_],b[v]=a?u[v]:d[v],x[g]=d[g],x[_]=i?u[_]:d[_],x[v]=a?u[v]:d[v],m++}for(let e=0;e<=1;e++)for(let t=0;t<=1;t++)for(let n=0;n<=1;n++){i.x=e?d.x:u.x,i.y=t?d.y:u.y,i.z=n?d.z:u.z,this.closestPointToPoint(i,r);let a=i.distanceToSquared(r);if(a<p&&(p=a,s&&s.copy(r),c&&c.copy(i),a<l))return Math.sqrt(a)}for(let e=0;e<12;e++){let a=t[e];for(let e=0;e<12;e++){let t=n[e];wt(a,t,r,i);let o=r.distanceToSquared(i);if(o<p&&(p=o,s&&s.copy(r),c&&c.copy(i),o<l))return Math.sqrt(o)}}return Math.sqrt(p)}})();var jt=new class extends Ge{constructor(){super(()=>new At)}},Mt=new L,Nt=new L;function Pt(e,t,n={},r=0,i=1/0){let a=r*r,o=i*i,s=1/0,c=null;if(e.shapecast({boundsTraverseOrder:e=>(Mt.copy(t).clamp(e.min,e.max),Mt.distanceToSquared(t)),intersectsBounds:(e,t,n)=>n<s&&n<o,intersectsTriangle:(e,n)=>{e.closestPointToPoint(t,Mt);let r=t.distanceToSquared(Mt);return r<s&&(Nt.copy(Mt),s=r,c=n),r<a}}),s===1/0)return null;let l=Math.sqrt(s);return n.point?n.point.copy(Nt):n.point=Nt.clone(),n.distance=l,n.faceIndex=c,n}var Ft=!0,It=new L,Lt=new L,Rt=new L,zt=new D,Bt=new D,Vt=new D,Ht=new L,Ut=new L,Wt=new L,Gt=new L;function Kt(e,t,n,r,i,a,o,s){let c;if(c=a===1?e.intersectTriangle(r,n,t,!0,i):e.intersectTriangle(t,n,r,a!==2,i),c===null)return null;let l=e.origin.distanceTo(i);return l<o||l>s?null:{distance:l,point:i.clone()}}function qt(e,t,n,r,i,a,o,s,c,l,u){It.fromBufferAttribute(t,a),Lt.fromBufferAttribute(t,o),Rt.fromBufferAttribute(t,s);let d=Kt(e,It,Lt,Rt,Gt,c,l,u);if(d){if(r){zt.fromBufferAttribute(r,a),Bt.fromBufferAttribute(r,o),Vt.fromBufferAttribute(r,s),d.uv=new D;let e=P.getInterpolation(Gt,It,Lt,Rt,zt,Bt,Vt,d.uv);Ft||(d.uv=e)}if(i){zt.fromBufferAttribute(i,a),Bt.fromBufferAttribute(i,o),Vt.fromBufferAttribute(i,s),d.uv1=new D;let e=P.getInterpolation(Gt,It,Lt,Rt,zt,Bt,Vt,d.uv1);Ft||(d.uv1=e)}if(n){Ht.fromBufferAttribute(n,a),Ut.fromBufferAttribute(n,o),Wt.fromBufferAttribute(n,s),d.normal=new L;let t=P.getInterpolation(Gt,It,Lt,Rt,Ht,Ut,Wt,d.normal);d.normal.dot(e.direction)>0&&d.normal.multiplyScalar(-1),Ft||(d.normal=t)}let t={a,b:o,c:s,normal:new L,materialIndex:0};if(P.getNormal(It,Lt,Rt,t.normal),d.face=t,d.faceIndex=a,Ft){let e=new L;P.getBarycoord(Gt,It,Lt,Rt,e),d.barycoord=e}}return d}function Jt(e){return e&&e.isMaterial?e.side:e}function Yt(e,t,n,r,i,a,o){let s=r*3,c=s+0,l=s+1,u=s+2,{index:d,groups:f}=e;e.index&&(c=d.getX(c),l=d.getX(l),u=d.getX(u));let{position:p,normal:m,uv:h,uv1:g}=e.attributes;if(Array.isArray(t)){let e=r*3;for(let s=0,d=f.length;s<d;s++){let{start:d,count:_,materialIndex:v}=f[s];if(e>=d&&e<d+_){let e=Jt(t[v]),s=qt(n,p,m,h,g,c,l,u,e,a,o);if(s){if(s.faceIndex=r,s.face.materialIndex=v,i)i.push(s);else return s}}}}else{let e=Jt(t),s=qt(n,p,m,h,g,c,l,u,e,a,o);if(s){if(s.faceIndex=r,s.face.materialIndex=0,i)i.push(s);else return s}}return null}function X(e,t,n,r){let i=e.a,a=e.b,o=e.c,s=t,c=t+1,l=t+2;n&&(s=n.getX(s),c=n.getX(c),l=n.getX(l)),i.x=r.getX(s),i.y=r.getY(s),i.z=r.getZ(s),a.x=r.getX(c),a.y=r.getY(c),a.z=r.getZ(c),o.x=r.getX(l),o.y=r.getY(l),o.z=r.getZ(l)}function Xt(e,t,n,r,i,a,o,s){let{geometry:c,_indirectBuffer:l}=e;for(let e=r,l=r+i;e<l;e++)Yt(c,t,n,e,a,o,s)}function Zt(e,t,n,r,i,a,o){let{geometry:s,_indirectBuffer:c}=e,l=1/0,u=null;for(let e=r,c=r+i;e<c;e++){let r;r=Yt(s,t,n,e,null,a,o),r&&r.distance<l&&(u=r,l=r.distance)}return u}function Qt(e,t,n,r,i,a,o){let{geometry:s}=n,{index:c}=s,l=s.attributes.position;for(let n=e,s=t+e;n<s;n++){let e;if(e=n,X(o,e*3,c,l),o.needsUpdate=!0,r(o,e,i,a))return!0}return!1}function $t(e,t=null){t&&Array.isArray(t)&&(t=new Set(t));let n=e.geometry,r=n.index?n.index.array:null,i=n.attributes.position,a,o,s,c,l=0,u=e._roots;for(let e=0,t=u.length;e<t;e++)a=u[e],o=new Uint32Array(a),s=new Uint16Array(a),c=new Float32Array(a),d(0,l),l+=a.byteLength;function d(e,n,a=!1){let l=e*2;if(V(l,s)){let t=H(e,o),n=U(l,s),a=1/0,u=1/0,d=1/0,f=-1/0,p=-1/0,m=-1/0;for(let e=3*t,o=3*(t+n);e<o;e++){let t=r[e],n=i.getX(t),o=i.getY(t),s=i.getZ(t);n<a&&(a=n),n>f&&(f=n),o<u&&(u=o),o>p&&(p=o),s<d&&(d=s),s>m&&(m=s)}return c[e+0]!==a||c[e+1]!==u||c[e+2]!==d||c[e+3]!==f||c[e+4]!==p||c[e+5]!==m?(c[e+0]=a,c[e+1]=u,c[e+2]=d,c[e+3]=f,c[e+4]=p,c[e+5]=m,!0):!1}{let r=W(e),i=G(e,o),s=a,l=!1,u=!1;if(t){if(!s){let e=r/8+n/32,a=i/8+n/32;l=t.has(e),u=t.has(a),s=!l&&!u}}else l=!0,u=!0;let f=s||l,p=s||u,m=!1;f&&(m=d(r,n,s));let h=!1;p&&(h=d(i,n,s));let g=m||h;if(g)for(let t=0;t<3;t++){let n=r+t,a=i+t,o=c[n],s=c[n+3],l=c[a],u=c[a+3];c[e+t]=o<l?o:l,c[e+t+3]=s>u?s:u}return g}}}function en(e,t,n,r,i){let a,o,s,c,l,u,d=1/n.direction.x,f=1/n.direction.y,p=1/n.direction.z,m=n.origin.x,h=n.origin.y,g=n.origin.z,_=t[e],v=t[e+3],y=t[e+1],b=t[e+3+1],x=t[e+2],S=t[e+3+2];return d>=0?(a=(_-m)*d,o=(v-m)*d):(a=(v-m)*d,o=(_-m)*d),f>=0?(s=(y-h)*f,c=(b-h)*f):(s=(b-h)*f,c=(y-h)*f),a>c||s>o||((s>a||isNaN(a))&&(a=s),(c<o||isNaN(o))&&(o=c),p>=0?(l=(x-g)*p,u=(S-g)*p):(l=(S-g)*p,u=(x-g)*p),a>u||l>o)?!1:((l>a||a!==a)&&(a=l),(u<o||o!==o)&&(o=u),a<=i&&o>=r)}function tn(e,t,n,r,i,a,o,s){let{geometry:c,_indirectBuffer:l}=e;for(let e=r,u=r+i;e<u;e++)Yt(c,t,n,l?l[e]:e,a,o,s)}function nn(e,t,n,r,i,a,o){let{geometry:s,_indirectBuffer:c}=e,l=1/0,u=null;for(let e=r,d=r+i;e<d;e++){let r;r=Yt(s,t,n,c?c[e]:e,null,a,o),r&&r.distance<l&&(u=r,l=r.distance)}return u}function rn(e,t,n,r,i,a,o){let{geometry:s}=n,{index:c}=s,l=s.attributes.position;for(let s=e,u=t+e;s<u;s++){let e;if(e=n.resolveTriangleIndex(s),X(o,e*3,c,l),o.needsUpdate=!0,r(o,e,i,a))return!0}return!1}function an(e,t,n,r,i,a,o){J.setBuffer(e._roots[t]),en(0,J.float32Array,r,a,o)&&on(0,e,n,r,i,a,o),J.clearBuffer()}function on(e,t,n,r,i,a,o){let{float32Array:s,uint16Array:c,uint32Array:l}=J,u=e*2;if(V(u,c))Xt(t,n,r,H(e,l),U(u,c),i,a,o);else{let c=W(e);en(c,s,r,a,o)&&on(c,t,n,r,i,a,o);let u=G(e,l);en(u,s,r,a,o)&&on(u,t,n,r,i,a,o)}}var sn=[`x`,`y`,`z`];function cn(e,t,n,r,i,a){J.setBuffer(e._roots[t]);let o=null;return en(0,J.float32Array,r,i,a)&&(o=ln(0,e,n,r,i,a)),J.clearBuffer(),o}function ln(e,t,n,r,i,a){let{float32Array:o,uint16Array:s,uint32Array:c}=J,l=e*2;if(V(l,s))return Zt(t,n,r,H(e,c),U(l,s),i,a);{let s=Te(e,c),l=sn[s],u=r.direction[l]>=0,d,f;u?(d=W(e),f=G(e,c)):(d=G(e,c),f=W(e));let p=en(d,o,r,i,a)?ln(d,t,n,r,i,a):null;if(p){let e=p.point[l];if(u?e<=o[f+s]:e>=o[f+s+3])return p}let m=en(f,o,r,i,a)?ln(f,t,n,r,i,a):null;return p&&m?p.distance<=m.distance?p:m:p||m||null}}var un=new t,dn=new At,fn=new At,pn=new I,mn=new Y,hn=new Y;function gn(e,t,n,r){J.setBuffer(e._roots[t]);let i=_n(0,e,n,r);return J.clearBuffer(),i}function _n(e,t,n,r,i=null){let{float32Array:a,uint16Array:o,uint32Array:s}=J,c=e*2;if(i===null&&(n.boundingBox||n.computeBoundingBox(),mn.set(n.boundingBox.min,n.boundingBox.max,r),i=mn),V(c,o)){let i=t.geometry,l=i.index,u=i.attributes.position,d=n.index,f=n.attributes.position,p=H(e,s),m=U(c,o);if(pn.copy(r).invert(),n.boundsTree)return B(K(e),a,hn),hn.matrix.copy(pn),hn.needsUpdate=!0,n.boundsTree.shapecast({intersectsBounds:e=>hn.intersectsBox(e),intersectsTriangle:e=>{e.a.applyMatrix4(r),e.b.applyMatrix4(r),e.c.applyMatrix4(r),e.needsUpdate=!0;for(let t=p*3,n=(m+p)*3;t<n;t+=3)if(X(fn,t,l,u),fn.needsUpdate=!0,e.intersectsTriangle(fn))return!0;return!1}});{let e=mt(n);for(let t=p*3,n=(m+p)*3;t<n;t+=3){X(dn,t,l,u),dn.a.applyMatrix4(pn),dn.b.applyMatrix4(pn),dn.c.applyMatrix4(pn),dn.needsUpdate=!0;for(let t=0,n=e*3;t<n;t+=3)if(X(fn,t,d,f),fn.needsUpdate=!0,dn.intersectsTriangle(fn))return!0}}}else{let o=W(e),c=G(e,s);return B(K(o),a,un),!!(i.intersectsBox(un)&&_n(o,t,n,r,i)||(B(K(c),a,un),i.intersectsBox(un)&&_n(c,t,n,r,i)))}}var vn=new I,yn=new Y,bn=new Y,xn=new L,Sn=new L,Cn=new L,wn=new L;function Tn(e,t,n,r={},i={},a=0,o=1/0){t.boundingBox||t.computeBoundingBox(),yn.set(t.boundingBox.min,t.boundingBox.max,n),yn.needsUpdate=!0;let s=e.geometry,c=s.attributes.position,l=s.index,u=t.attributes.position,d=t.index,f=jt.getPrimitive(),p=jt.getPrimitive(),m=xn,h=Sn,g=null,_=null;i&&(g=Cn,_=wn);let v=1/0,y=null,b=null;return vn.copy(n).invert(),bn.matrix.copy(vn),e.shapecast({boundsTraverseOrder:e=>yn.distanceToBox(e),intersectsBounds:(e,t,n)=>n<v&&n<o&&(t&&(bn.min.copy(e.min),bn.max.copy(e.max),bn.needsUpdate=!0),!0),intersectsRange:(e,r)=>{if(t.boundsTree)return t.boundsTree.shapecast({boundsTraverseOrder:e=>bn.distanceToBox(e),intersectsBounds:(e,t,n)=>n<v&&n<o,intersectsRange:(t,i)=>{for(let o=t,s=t+i;o<s;o++){X(p,3*o,d,u),p.a.applyMatrix4(n),p.b.applyMatrix4(n),p.c.applyMatrix4(n),p.needsUpdate=!0;for(let t=e,n=e+r;t<n;t++){X(f,3*t,l,c),f.needsUpdate=!0;let e=f.distanceToTriangle(p,m,g);if(e<v&&(h.copy(m),_&&_.copy(g),v=e,y=t,b=o),e<a)return!0}}}});{let i=mt(t);for(let t=0,o=i;t<o;t++){X(p,3*t,d,u),p.a.applyMatrix4(n),p.b.applyMatrix4(n),p.c.applyMatrix4(n),p.needsUpdate=!0;for(let n=e,i=e+r;n<i;n++){X(f,3*n,l,c),f.needsUpdate=!0;let e=f.distanceToTriangle(p,m,g);if(e<v&&(h.copy(m),_&&_.copy(g),v=e,y=n,b=t),e<a)return!0}}}}}),jt.releasePrimitive(f),jt.releasePrimitive(p),v===1/0?null:(r.point?r.point.copy(h):r.point=h.clone(),r.distance=v,r.faceIndex=y,i&&(i.point?i.point.copy(_):i.point=_.clone(),i.point.applyMatrix4(vn),h.applyMatrix4(vn),i.distance=h.sub(i.point).length(),i.faceIndex=b),r)}function En(e,t=null){t&&Array.isArray(t)&&(t=new Set(t));let n=e.geometry,r=n.index?n.index.array:null,i=n.attributes.position,a,o,s,c,l=0,u=e._roots;for(let e=0,t=u.length;e<t;e++)a=u[e],o=new Uint32Array(a),s=new Uint16Array(a),c=new Float32Array(a),d(0,l),l+=a.byteLength;function d(n,a,l=!1){let u=n*2;if(V(u,s)){let t=H(n,o),a=U(u,s),l=1/0,d=1/0,f=1/0,p=-1/0,m=-1/0,h=-1/0;for(let n=t,o=t+a;n<o;n++){let t=3*e.resolveTriangleIndex(n);for(let e=0;e<3;e++){let n=t+e;n=r?r[n]:n;let a=i.getX(n),o=i.getY(n),s=i.getZ(n);a<l&&(l=a),a>p&&(p=a),o<d&&(d=o),o>m&&(m=o),s<f&&(f=s),s>h&&(h=s)}}return c[n+0]!==l||c[n+1]!==d||c[n+2]!==f||c[n+3]!==p||c[n+4]!==m||c[n+5]!==h?(c[n+0]=l,c[n+1]=d,c[n+2]=f,c[n+3]=p,c[n+4]=m,c[n+5]=h,!0):!1}{let e=W(n),r=G(n,o),i=l,s=!1,u=!1;if(t){if(!i){let n=e/8+a/32,o=r/8+a/32;s=t.has(n),u=t.has(o),i=!s&&!u}}else s=!0,u=!0;let f=i||s,p=i||u,m=!1;f&&(m=d(e,a,i));let h=!1;p&&(h=d(r,a,i));let g=m||h;if(g)for(let t=0;t<3;t++){let i=e+t,a=r+t,o=c[i],s=c[i+3],l=c[a],u=c[a+3];c[n+t]=o<l?o:l,c[n+t+3]=s>u?s:u}return g}}}function Dn(e,t,n,r,i,a,o){J.setBuffer(e._roots[t]),en(0,J.float32Array,r,a,o)&&On(0,e,n,r,i,a,o),J.clearBuffer()}function On(e,t,n,r,i,a,o){let{float32Array:s,uint16Array:c,uint32Array:l}=J,u=e*2;if(V(u,c))tn(t,n,r,H(e,l),U(u,c),i,a,o);else{let c=W(e);en(c,s,r,a,o)&&On(c,t,n,r,i,a,o);let u=G(e,l);en(u,s,r,a,o)&&On(u,t,n,r,i,a,o)}}var kn=[`x`,`y`,`z`];function An(e,t,n,r,i,a){J.setBuffer(e._roots[t]);let o=null;return en(0,J.float32Array,r,i,a)&&(o=jn(0,e,n,r,i,a)),J.clearBuffer(),o}function jn(e,t,n,r,i,a){let{float32Array:o,uint16Array:s,uint32Array:c}=J,l=e*2;if(V(l,s))return nn(t,n,r,H(e,c),U(l,s),i,a);{let s=Te(e,c),l=kn[s],u=r.direction[l]>=0,d,f;u?(d=W(e),f=G(e,c)):(d=G(e,c),f=W(e));let p=en(d,o,r,i,a)?jn(d,t,n,r,i,a):null;if(p){let e=p.point[l];if(u?e<=o[f+s]:e>=o[f+s+3])return p}let m=en(f,o,r,i,a)?jn(f,t,n,r,i,a):null;return p&&m?p.distance<=m.distance?p:m:p||m||null}}var Mn=new t,Nn=new At,Pn=new At,Fn=new I,In=new Y,Ln=new Y;function Rn(e,t,n,r){J.setBuffer(e._roots[t]);let i=zn(0,e,n,r);return J.clearBuffer(),i}function zn(e,t,n,r,i=null){let{float32Array:a,uint16Array:o,uint32Array:s}=J,c=e*2;if(i===null&&(n.boundingBox||n.computeBoundingBox(),In.set(n.boundingBox.min,n.boundingBox.max,r),i=In),V(c,o)){let i=t.geometry,l=i.index,u=i.attributes.position,d=n.index,f=n.attributes.position,p=H(e,s),m=U(c,o);if(Fn.copy(r).invert(),n.boundsTree)return B(K(e),a,Ln),Ln.matrix.copy(Fn),Ln.needsUpdate=!0,n.boundsTree.shapecast({intersectsBounds:e=>Ln.intersectsBox(e),intersectsTriangle:e=>{e.a.applyMatrix4(r),e.b.applyMatrix4(r),e.c.applyMatrix4(r),e.needsUpdate=!0;for(let n=p,r=m+p;n<r;n++)if(X(Pn,3*t.resolveTriangleIndex(n),l,u),Pn.needsUpdate=!0,e.intersectsTriangle(Pn))return!0;return!1}});{let e=mt(n);for(let n=p,r=m+p;n<r;n++){X(Nn,3*t.resolveTriangleIndex(n),l,u),Nn.a.applyMatrix4(Fn),Nn.b.applyMatrix4(Fn),Nn.c.applyMatrix4(Fn),Nn.needsUpdate=!0;for(let t=0,n=e*3;t<n;t+=3)if(X(Pn,t,d,f),Pn.needsUpdate=!0,Nn.intersectsTriangle(Pn))return!0}}}else{let o=W(e),c=G(e,s);return B(K(o),a,Mn),!!(i.intersectsBox(Mn)&&zn(o,t,n,r,i)||(B(K(c),a,Mn),i.intersectsBox(Mn)&&zn(c,t,n,r,i)))}}var Bn=new I,Vn=new Y,Hn=new Y,Un=new L,Wn=new L,Gn=new L,Kn=new L;function qn(e,t,n,r={},i={},a=0,o=1/0){t.boundingBox||t.computeBoundingBox(),Vn.set(t.boundingBox.min,t.boundingBox.max,n),Vn.needsUpdate=!0;let s=e.geometry,c=s.attributes.position,l=s.index,u=t.attributes.position,d=t.index,f=jt.getPrimitive(),p=jt.getPrimitive(),m=Un,h=Wn,g=null,_=null;i&&(g=Gn,_=Kn);let v=1/0,y=null,b=null;return Bn.copy(n).invert(),Hn.matrix.copy(Bn),e.shapecast({boundsTraverseOrder:e=>Vn.distanceToBox(e),intersectsBounds:(e,t,n)=>n<v&&n<o&&(t&&(Hn.min.copy(e.min),Hn.max.copy(e.max),Hn.needsUpdate=!0),!0),intersectsRange:(r,i)=>{if(t.boundsTree){let s=t.boundsTree;return s.shapecast({boundsTraverseOrder:e=>Hn.distanceToBox(e),intersectsBounds:(e,t,n)=>n<v&&n<o,intersectsRange:(t,o)=>{for(let x=t,S=t+o;x<S;x++){let t=s.resolveTriangleIndex(x);X(p,3*t,d,u),p.a.applyMatrix4(n),p.b.applyMatrix4(n),p.c.applyMatrix4(n),p.needsUpdate=!0;for(let t=r,n=r+i;t<n;t++){let n=e.resolveTriangleIndex(t);X(f,3*n,l,c),f.needsUpdate=!0;let r=f.distanceToTriangle(p,m,g);if(r<v&&(h.copy(m),_&&_.copy(g),v=r,y=t,b=x),r<a)return!0}}}})}{let o=mt(t);for(let t=0,s=o;t<s;t++){X(p,3*t,d,u),p.a.applyMatrix4(n),p.b.applyMatrix4(n),p.c.applyMatrix4(n),p.needsUpdate=!0;for(let n=r,o=r+i;n<o;n++){let r=e.resolveTriangleIndex(n);X(f,3*r,l,c),f.needsUpdate=!0;let i=f.distanceToTriangle(p,m,g);if(i<v&&(h.copy(m),_&&_.copy(g),v=i,y=n,b=t),i<a)return!0}}}}}),jt.releasePrimitive(f),jt.releasePrimitive(p),v===1/0?null:(r.point?r.point.copy(h):r.point=h.clone(),r.distance=v,r.faceIndex=y,i&&(i.point?i.point.copy(_):i.point=_.clone(),i.point.applyMatrix4(Bn),h.applyMatrix4(Bn),i.distance=h.sub(i.point).length(),i.faceIndex=b),r)}function Jn(e,t,n){return e===null?null:(e.point.applyMatrix4(t.matrixWorld),e.distance=e.point.distanceTo(n.ray.origin),e.object=t,e)}var Yn=new Y,Xn=new n,Zn=new L,Qn=new I,$n=new L,er=[`getX`,`getY`,`getZ`],tr=class e extends xt{static serialize(e,t={}){t={cloneBuffers:!0,...t};let n=e.geometry,r=e._roots,i=e._indirectBuffer,a=n.getIndex(),o={version:1,roots:null,index:null,indirectBuffer:null};return t.cloneBuffers?(o.roots=r.map(e=>e.slice()),o.index=a?a.array.slice():null,o.indirectBuffer=i?i.slice():null):(o.roots=r,o.index=a?a.array:null,o.indirectBuffer=i),o}static deserialize(t,n,r={}){r={setIndex:!0,indirect:!!t.indirectBuffer,...r};let{index:i,roots:a,indirectBuffer:o}=t;t.version||(console.warn(`MeshBVH.deserialize: Serialization format has been changed and will be fixed up. It is recommended to regenerate any stored serialized data.`),c(a));let s=new e(n,{...r,[be]:!0});if(s._roots=a,s._indirectBuffer=o||null,r.setIndex){let e=n.getIndex();if(e===null){let e=new F(t.index,1,!1);n.setIndex(e)}else e.array!==i&&(e.array.set(i),e.needsUpdate=!0)}return s;function c(e){for(let t=0;t<e.length;t++){let n=e[t],r=new Uint32Array(n),i=new Uint16Array(n);for(let e=0,t=n.byteLength/32;e<t;e++){let t=8*e;V(2*t,i)||(r[t+6]=r[t+6]/8-e)}}}}get primitiveStride(){return 3}get resolveTriangleIndex(){return this.resolvePrimitiveIndex}constructor(e,t={}){t.maxLeafTris&&(console.warn(`MeshBVH: "maxLeafTris" option has been deprecated. Use "targetLeafSize", instead.`),t={...t,targetLeafSize:t.maxLeafTris}),super(e,t)}shiftTriangleOffsets(e){return super.shiftPrimitiveOffsets(e)}writePrimitiveBounds(e,t,n){let r=this.geometry,i=this._indirectBuffer,a=r.attributes.position,o=r.index?r.index.array:null,s=(i?i[e]:e)*3,c=s+0,l=s+1,u=s+2;o&&(c=o[c],l=o[l],u=o[u]);for(let e=0;e<3;e++){let r=a[er[e]](c),i=a[er[e]](l),o=a[er[e]](u),s=r;i<s&&(s=i),o<s&&(s=o);let d=r;i>d&&(d=i),o>d&&(d=o),t[n+e]=s,t[n+e+3]=d}return t}computePrimitiveBounds(e,t,n){let r=this.geometry,i=this._indirectBuffer,a=r.attributes.position,o=r.index?r.index.array:null,s=a.normalized;if(e<0||t+e-n.offset>n.length/6)throw Error(`MeshBVH: compute triangle bounds range is invalid.`);let c=a.array,l=a.offset||0,u=3;a.isInterleavedBufferAttribute&&(u=a.data.stride);let d=[`getX`,`getY`,`getZ`],f=n.offset;for(let r=e,p=e+t;r<p;r++){let e=(i?i[r]:r)*3,t=(r-f)*6,p=e+0,m=e+1,h=e+2;o&&(p=o[p],m=o[m],h=o[h]),s||(p=p*u+l,m=m*u+l,h=h*u+l);for(let e=0;e<3;e++){let r,i,o;s?(r=a[d[e]](p),i=a[d[e]](m),o=a[d[e]](h)):(r=c[p+e],i=c[m+e],o=c[h+e]);let l=r;i<l&&(l=i),o<l&&(l=o);let u=r;i>u&&(u=i),o>u&&(u=o);let f=(u-l)/2,g=e*2;n[t+g+0]=l+f,n[t+g+1]=f+(Math.abs(l)+f)*ye}}return n}raycastObject3D(e,t,n=[]){let{material:r}=e;if(r===void 0)return;Qn.copy(e.matrixWorld).invert(),Xn.copy(t.ray).applyMatrix4(Qn),$n.setFromMatrixScale(e.matrixWorld),Zn.copy(Xn.direction).multiply($n);let i=Zn.length(),a=t.near/i,o=t.far/i;if(t.firstHitOnly===!0){let i=this.raycastFirst(Xn,r,a,o);i=Jn(i,e,t),i&&n.push(i)}else{let i=this.raycast(Xn,r,a,o);for(let r=0,a=i.length;r<a;r++){let a=Jn(i[r],e,t);a&&n.push(a)}}return n}refit(e=null){return(this.indirect?En:$t)(this,e)}raycast(e,t=0,n=0,r=1/0){let i=this._roots,a=[],o=this.indirect?Dn:an;for(let s=0,c=i.length;s<c;s++)o(this,s,t,e,a,n,r);return a}raycastFirst(e,t=0,n=0,r=1/0){let i=this._roots,a=null,o=this.indirect?An:cn;for(let s=0,c=i.length;s<c;s++){let i=o(this,s,t,e,n,r);i!=null&&(a==null||i.distance<a.distance)&&(a=i)}return a}intersectsGeometry(e,t){let n=!1,r=this._roots,i=this.indirect?Rn:gn;for(let a=0,o=r.length;a<o&&(n=i(this,a,e,t),!n);a++);return n}shapecast(e){let t=jt.getPrimitive(),n=super.shapecast({...e,intersectsPrimitive:e.intersectsTriangle,scratchPrimitive:t,iterate:this.indirect?rn:Qt});return jt.releasePrimitive(t),n}bvhcast(t,n,r){let{intersectsRanges:i,intersectsTriangles:a}=r,o=jt.getPrimitive(),s=this.geometry.index,c=this.geometry.attributes.position,l=this.indirect?e=>{let t=this.resolveTriangleIndex(e);X(o,t*3,s,c)}:e=>{X(o,e*3,s,c)},u=jt.getPrimitive(),d=t.geometry.index,f=t.geometry.attributes.position,p=t.indirect?e=>{let n=t.resolveTriangleIndex(e);X(u,n*3,d,f)}:e=>{X(u,e*3,d,f)};if(a){if(!(t instanceof e))throw Error(`MeshBVH: "intersectsTriangles" callback can only be used with another MeshBVH.`);let r=(e,t,r,i,s,c,d,f)=>{for(let m=r,h=r+i;m<h;m++){p(m),u.a.applyMatrix4(n),u.b.applyMatrix4(n),u.c.applyMatrix4(n),u.needsUpdate=!0;for(let n=e,r=e+t;n<r;n++)if(l(n),o.needsUpdate=!0,a(o,u,n,m,s,c,d,f))return!0}return!1};if(i){let e=i;i=function(t,n,i,a,o,s,c,l){return e(t,n,i,a,o,s,c,l)?!0:r(t,n,i,a,o,s,c,l)}}else i=r}return super.bvhcast(t,n,{intersectsRanges:i})}intersectsBox(e,t){return Yn.set(e.min,e.max,t),Yn.needsUpdate=!0,this.shapecast({intersectsBounds:e=>Yn.intersectsBox(e),intersectsTriangle:e=>Yn.intersectsTriangle(e)})}intersectsSphere(e){return this.shapecast({intersectsBounds:t=>e.intersectsBox(t),intersectsTriangle:t=>t.intersectsSphere(e)})}closestPointToGeometry(e,t,n={},r={},i=0,a=1/0){return(this.indirect?qn:Tn)(this,e,t,n,r,i,a)}closestPointToPoint(e,t={},n=0,r=1/0){return Pt(this,e,t,n,r)}};function nr(e){switch(e){case 1:return`R`;case 2:return`RG`;case 3:return`RGBA`;case 4:return`RGBA`}throw Error()}function rr(e){switch(e){case 1:return c;case 2:return m;case 3:return l;case 4:return l}}function ir(e){switch(e){case 1:return y;case 2:return z;case 3:return d;case 4:return d}}var ar=class extends j{constructor(){super(),this.minFilter=R,this.magFilter=R,this.generateMipmaps=!1,this.overrideItemSize=null,this._forcedType=null}updateFrom(e){let t=this.overrideItemSize,n=e.itemSize,r=e.count;if(t!==null){if(n*r%t!==0)throw Error(`VertexAttributeTexture: overrideItemSize must divide evenly into buffer length.`);e.itemSize=t,e.count=r*n/t}let a=e.itemSize,o=e.count,c=e.normalized,l=e.array.constructor,u=l.BYTES_PER_ELEMENT,d=this._forcedType,f=a;if(d===null)switch(l){case Float32Array:d=i;break;case Uint8Array:case Uint16Array:case Uint32Array:d=de;break;case Int8Array:case Int16Array:case Int32Array:d=s}let p,m,h,g,_=nr(a);switch(d){case i:h=1,m=rr(a),c&&u===1?(g=l,_+=`8`,l===Uint8Array?p=te:(p=ce,_+=`_SNORM`)):(g=Float32Array,_+=`32F`,p=i);break;case s:_+=u*8+`I`,h=c?2**(l.BYTES_PER_ELEMENT*8-1):1,m=ir(a),u===1?(g=Int8Array,p=ce):u===2?(g=Int16Array,p=E):(g=Int32Array,p=s);break;case de:_+=u*8+`UI`,h=c?2**(l.BYTES_PER_ELEMENT*8-1):1,m=ir(a),u===1?(g=Uint8Array,p=te):u===2?(g=Uint16Array,p=me):(g=Uint32Array,p=de)}f===3&&(m===1023||m===1033)&&(f=4);let v=Math.ceil(Math.sqrt(o))||1,y=f*v*v,b=new g(y),x=e.normalized;e.normalized=!1;for(let t=0;t<o;t++){let n=f*t;b[n]=e.getX(t)/h,a>=2&&(b[n+1]=e.getY(t)/h),a>=3&&(b[n+2]=e.getZ(t)/h,f===4&&(b[n+3]=1)),a>=4&&(b[n+3]=e.getW(t)/h)}e.normalized=x,this.internalFormat=_,this.format=m,this.type=p,this.image.width=v,this.image.height=v,this.image.data=b,this.needsUpdate=!0,this.dispose(),e.itemSize=n,e.count=r}},or=class extends ar{constructor(){super(),this._forcedType=de}},sr=class extends ar{constructor(){super(),this._forcedType=i}},cr=class{constructor(){this.index=new or,this.position=new sr,this.bvhBounds=new j,this.bvhContents=new j,this._cachedIndexAttr=null,this.index.overrideItemSize=3}updateFrom(e){let{geometry:t}=e;if(ur(e,this.bvhBounds,this.bvhContents),this.position.updateFrom(t.attributes.position),e.indirect){let n=e._indirectBuffer;if(this._cachedIndexAttr===null||this._cachedIndexAttr.count!==n.length){if(t.index)this._cachedIndexAttr=t.index.clone();else{let e=ht(pt(t));this._cachedIndexAttr=new F(e,1,!1)}}lr(t,n,this._cachedIndexAttr),this.index.updateFrom(this._cachedIndexAttr)}else this.index.updateFrom(t.index)}dispose(){let{index:e,position:t,bvhBounds:n,bvhContents:r}=this;e&&e.dispose(),t&&t.dispose(),n&&n.dispose(),r&&r.dispose()}};function lr(e,t,n){let r=n.array,i=e.index?e.index.array:null;for(let e=0,n=t.length;e<n;e++){let n=3*e,a=3*t[e];for(let e=0;e<3;e++)r[n+e]=i?i[a+e]:a+e}}function ur(e,t,n){let r=e._roots;if(r.length!==1)throw Error(`MeshBVHUniformStruct: Multi-root BVHs not supported.`);let a=r[0],o=new Uint16Array(a),s=new Uint32Array(a),c=new Float32Array(a),u=a.byteLength/32,d=2*Math.ceil(Math.sqrt(u/2)),f=new Float32Array(4*d*d),p=Math.ceil(Math.sqrt(u)),m=new Uint32Array(2*p*p);for(let e=0;e<u;e++){let t=e*32/4,n=t*2,r=K(t);for(let t=0;t<3;t++)f[8*e+0+t]=c[r+0+t],f[8*e+4+t]=c[r+3+t];if(V(n,o)){let r=U(n,o),i=H(t,s),a=ve|r;m[e*2+0]=a,m[e*2+1]=i}else{let n=s[t+6],r=Te(t,s);m[e*2+0]=r,m[e*2+1]=n}}t.image.data=f,t.image.width=d,t.image.height=d,t.format=l,t.type=i,t.internalFormat=`RGBA32F`,t.minFilter=R,t.magFilter=R,t.generateMipmaps=!1,t.needsUpdate=!0,t.dispose(),n.image.data=m,n.image.width=p,n.image.height=p,n.format=z,n.type=de,n.internalFormat=`RG32UI`,n.minFilter=R,n.magFilter=R,n.generateMipmaps=!1,n.needsUpdate=!0,n.dispose()}var dr=`

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
`,fr=`

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
	int pointer = 0;
	uint stack[ BVH_STACK_DEPTH ];
	stack[ 0 ] = 0u;

	float triangleDistance = INFINITY;
	bool found = false;
	while ( pointer > - 1 && pointer < BVH_STACK_DEPTH ) {

		uint currNodeIndex = stack[ pointer ];
		pointer --;

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
			uint rightIndex = currNodeIndex + boundsInfo.y;

			bool leftToRight = rayDirection[ splitAxis ] >= 0.0;
			uint c1 = leftToRight ? leftIndex : rightIndex;
			uint c2 = leftToRight ? rightIndex : leftIndex;

			// set c2 in the stack so we traverse it later. We need to keep track of a pointer in
			// the stack while we traverse. The second pointer added is the one that will be
			// traversed first
			pointer ++;
			stack[ pointer ] = c2;

			pointer ++;
			stack[ pointer ] = c1;

		}

	}

	return found;

}
`,pr=`
struct BVH {

	usampler2D index;
	sampler2D position;

	sampler2D bvhBounds;
	usampler2D bvhContents;

};
`;function mr(e,t,n=0){if(e.isInterleavedBufferAttribute){let r=e.itemSize;for(let i=0,a=e.count;i<a;i++){let a=i+n;t.setX(a,e.getX(i)),r>=2&&t.setY(a,e.getY(i)),r>=3&&t.setZ(a,e.getZ(i)),r>=4&&t.setW(a,e.getW(i))}}else{let r=t.array,i=r.constructor,a=r.BYTES_PER_ELEMENT*e.itemSize*n;new i(r.buffer,a,e.array.length).set(e.array)}}function hr(e,t=null){let n=e.array.constructor,r=e.normalized,i=e.itemSize,a=t===null?e.count:t;return new F(new n(i*a),i,r)}function gr(e,t){if(!e&&!t)return!0;if(!!e!=!!t)return!1;let n=e.count===t.count,r=e.normalized===t.normalized,i=e.array.constructor===t.array.constructor,a=e.itemSize===t.itemSize;return!(!n||!r||!i||!a)}function _r(e){let t=e[0].index!==null,n=new Set(Object.keys(e[0].attributes));if(!e[0].getAttribute(`position`))throw Error(`StaticGeometryGenerator: position attribute is required.`);for(let r=0;r<e.length;++r){let i=e[r],a=0;if(t!==(i.index!==null))throw Error(`StaticGeometryGenerator: All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`);for(let e in i.attributes){if(!n.has(e))throw Error(`StaticGeometryGenerator: All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`);a++}if(a!==n.size)throw Error(`StaticGeometryGenerator: All geometries must have the same number of attributes.`)}}function vr(e){let t=0;for(let n=0,r=e.length;n<r;n++)t+=e[n].getIndex().count;return t}function yr(e){let t=0;for(let n=0,r=e.length;n<r;n++)t+=e[n].getAttribute(`position`).count;return t}function br(e,t,n){e.index&&e.index.count!==t&&e.setIndex(null);let r=e.attributes;for(let t in r)r[t].count!==n&&e.deleteAttribute(t)}function xr(e,t={},n=new M){let{useGroups:r=!1,forceUpdate:i=!1,skipAssigningAttributes:a=[],overwriteIndex:o=!0}=t;_r(e);let s=e[0].index!==null,c=s?vr(e):-1,l=yr(e);if(br(n,c,l),r){let t=0;for(let r=0,i=e.length;r<i;r++){let i=e[r],a;a=s?i.getIndex().count:i.getAttribute(`position`).count,n.addGroup(t,a,r),t+=a}}if(s){let t=!1;if(n.index||(n.setIndex(new F(new Uint32Array(c),1,!1)),t=!0),t||o){let r=0,o=0,s=n.getIndex();for(let n=0,c=e.length;n<c;n++){let c=e[n],l=c.getIndex();if(i||t||!a[n])for(let e=0;e<l.count;++e)s.setX(r+e,l.getX(e)+o);r+=l.count,o+=c.getAttribute(`position`).count}}}let u=Object.keys(e[0].attributes);for(let t=0,r=u.length;t<r;t++){let r=!1,o=u[t];if(!n.getAttribute(o)){let t=e[0].getAttribute(o);n.setAttribute(o,hr(t,l)),r=!0}let s=0,c=n.getAttribute(o);for(let t=0,n=e.length;t<n;t++){let n=e[t],l=!i&&!r&&a[t],u=n.getAttribute(o);if(!l){if(o===`color`&&c.itemSize!==u.itemSize)for(let e=s,t=u.count;e<t;e++)u.setXYZW(e,c.getX(e),c.getY(e),c.getZ(e),1);else mr(u,c,s)}s+=u.count}}}function Sr(e,t,n){let r=e.index,i=e.attributes.position.count,a=r?r.count:i,o=e.groups;o.length===0&&(o=[{count:a,start:0,materialIndex:0}]);let s=e.getAttribute(`materialIndex`);if(!s||s.count!==i){let t;t=n.length<=255?new Uint8Array(i):new Uint16Array(i),s=new F(t,1,!1),e.deleteAttribute(`materialIndex`),e.setAttribute(`materialIndex`,s)}let c=s.array;for(let e=0;e<o.length;e++){let i=o[e],s=i.start,l=i.count,u=Math.min(l,a-s),d=Array.isArray(t)?t[i.materialIndex]:t,f=n.indexOf(d);for(let e=0;e<u;e++){let t=s+e;r&&(t=r.getX(t)),c[t]=f}}}function Cr(e,t){if(!e.index){let t=e.attributes.position.count,n=Array(t);for(let e=0;e<t;e++)n[e]=e;e.setIndex(n)}if(!e.attributes.normal&&t&&t.includes(`normal`)&&e.computeVertexNormals(),!e.attributes.uv&&t&&t.includes(`uv`)){let t=e.attributes.position.count;e.setAttribute(`uv`,new F(new Float32Array(t*2),2,!1))}if(!e.attributes.uv2&&t&&t.includes(`uv2`)){let t=e.attributes.position.count;e.setAttribute(`uv2`,new F(new Float32Array(t*2),2,!1))}if(!e.attributes.tangent&&t&&t.includes(`tangent`)){if(e.attributes.uv&&e.attributes.normal)e.computeTangents();else{let t=e.attributes.position.count;e.setAttribute(`tangent`,new F(new Float32Array(t*4),4,!1))}}if(!e.attributes.color&&t&&t.includes(`color`)){let t=e.attributes.position.count,n=new Float32Array(t*4);n.fill(1),e.setAttribute(`color`,new F(n,4))}}function wr(e){let t=0;if(e.byteLength!==0){let n=new Uint8Array(e);for(let r=0;r<e.byteLength;r++){let e=n[r];t=(t<<5)-t+e,t|=0}}return t}function Tr(e){let t=e.uuid,n=Object.values(e.attributes);e.index&&(n.push(e.index),t+=`index|${e.index.version}`);let r=Object.keys(n).sort();for(let e of r){let r=n[e];t+=`${e}_${r.version}|`}return t}function Er(e){let t=e.skeleton;return t?(t.boneTexture||t.computeBoneTexture(),`${wr(t.boneTexture.image.data.buffer)}_${t.boneTexture.uuid}`):null}var Dr=class{constructor(e=null){this.matrixWorld=new I,this.geometryHash=null,this.skeletonHash=null,this.primitiveCount=-1,e!==null&&this.updateFrom(e)}updateFrom(e){let t=e.geometry,n=(t.index?t.index.count:t.attributes.position.count)/3;this.matrixWorld.copy(e.matrixWorld),this.geometryHash=Tr(t),this.primitiveCount=n,this.skeletonHash=Er(e)}didChange(e){let t=e.geometry,n=(t.index?t.index.count:t.attributes.position.count)/3;return!(this.matrixWorld.equals(e.matrixWorld)&&this.geometryHash===Tr(t)&&this.skeletonHash===Er(e)&&this.primitiveCount===n)}},Or=new L,kr=new L,Ar=new L,jr=new h,Mr=new L,Nr=new L,Pr=new h,Fr=new h,Ir=new I,Lr=new I;function Rr(e,t,n){let r=e.skeleton,i=e.geometry,a=r.bones,o=r.boneInverses;Pr.fromBufferAttribute(i.attributes.skinIndex,t),Fr.fromBufferAttribute(i.attributes.skinWeight,t),Ir.elements.fill(0);for(let e=0;e<4;e++){let t=Fr.getComponent(e);if(t!==0){let n=Pr.getComponent(e);Lr.multiplyMatrices(a[n].matrixWorld,o[n]),Br(Ir,Lr,t)}}return Ir.multiply(e.bindMatrix).premultiply(e.bindMatrixInverse),n.transformDirection(Ir),n}function zr(e,t,n,r,i){Mr.set(0,0,0);for(let a=0,o=e.length;a<o;a++){let o=t[a],s=e[a];o!==0&&(Nr.fromBufferAttribute(s,r),n?Mr.addScaledVector(Nr,o):Mr.addScaledVector(Nr.sub(i),o))}i.add(Mr)}function Br(e,t,n){let r=e.elements,i=t.elements;for(let e=0,t=i.length;e<t;e++)r[e]+=i[e]*n}function Vr(e){let{index:t,attributes:n}=e;if(t)for(let e=0,n=t.count;e<n;e+=3){let n=t.getX(e),r=t.getX(e+2);t.setX(e,r),t.setX(e+2,n)}else for(let e in n){let t=n[e],r=t.itemSize;for(let e=0,n=t.count;e<n;e+=3)for(let n=0;n<r;n++){let r=t.getComponent(e,n),i=t.getComponent(e+2,n);t.setComponent(e,n,i),t.setComponent(e+2,n,r)}}return e}function Hr(e,t={},n=new M){t={applyWorldTransforms:!0,attributes:[],...t};let r=e.geometry,i=t.applyWorldTransforms,a=t.attributes.includes(`normal`),o=t.attributes.includes(`tangent`),s=r.attributes,c=n.attributes;for(let e in n.attributes)t.attributes.includes(e)&&e in r.attributes||n.deleteAttribute(e);!n.index&&r.index&&(n.index=r.index.clone()),c.position||n.setAttribute(`position`,hr(s.position)),a&&!c.normal&&s.normal&&n.setAttribute(`normal`,hr(s.normal)),o&&!c.tangent&&s.tangent&&n.setAttribute(`tangent`,hr(s.tangent)),gr(r.index,n.index),gr(s.position,c.position),a&&gr(s.normal,c.normal),o&&gr(s.tangent,c.tangent);let l=s.position,u=a?s.normal:null,d=o?s.tangent:null,f=r.morphAttributes.position,p=r.morphAttributes.normal,m=r.morphAttributes.tangent,h=r.morphTargetsRelative,g=e.morphTargetInfluences,_=new ae;_.getNormalMatrix(e.matrixWorld),r.index&&n.index.array.set(r.index.array);for(let t=0,n=s.position.count;t<n;t++)Or.fromBufferAttribute(l,t),u&&kr.fromBufferAttribute(u,t),d&&(jr.fromBufferAttribute(d,t),Ar.fromBufferAttribute(d,t)),g&&(f&&zr(f,g,h,t,Or),p&&zr(p,g,h,t,kr),m&&zr(m,g,h,t,Ar)),e.isSkinnedMesh&&(e.applyBoneTransform(t,Or),u&&Rr(e,t,kr),d&&Rr(e,t,Ar)),i&&Or.applyMatrix4(e.matrixWorld),c.position.setXYZ(t,Or.x,Or.y,Or.z),u&&(i&&kr.applyNormalMatrix(_),c.normal.setXYZ(t,kr.x,kr.y,kr.z)),d&&(i&&Ar.transformDirection(e.matrixWorld),c.tangent.setXYZW(t,Ar.x,Ar.y,Ar.z,jr.w));for(let e in t.attributes){let r=t.attributes[e];r!==`position`&&r!==`tangent`&&r!==`normal`&&r in s&&(c[r]||n.setAttribute(r,hr(s[r])),gr(s[r],c[r]),mr(s[r],c[r]))}return e.matrixWorld.determinant()<0&&Vr(n),n}var Ur=class extends M{constructor(){super(),this.version=0,this.hash=null,this._diff=new Dr}isCompatible(e,t){let n=e.geometry;for(let e=0;e<t.length;e++){let r=t[e],i=n.attributes[r],a=this.attributes[r];if(i&&!gr(i,a))return!1}return!0}updateFrom(e,t){let n=this._diff;return n.didChange(e)?(Hr(e,t,this),n.updateFrom(e),this.version++,this.hash=`${this.uuid}_${this.version}`,!0):!1}};function Wr(e,t){for(let n=0,r=e.length;n<r;n++)e[n].traverseVisible(e=>{e.isMesh&&t(e)})}function Gr(e){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];Array.isArray(r.material)?t.push(...r.material):t.push(r.material)}return t}function Kr(e,t,n){if(e.length===0){t.setIndex(null);let e=t.attributes;for(let n in e)t.deleteAttribute(n);for(let e in n.attributes)t.setAttribute(n.attributes[e],new F(new Float32Array,4,!1))}else xr(e,n,t);for(let e in t.attributes)t.attributes[e].needsUpdate=!0}var qr=class{constructor(e){this.objects=null,this.useGroups=!0,this.applyWorldTransforms=!0,this.generateMissingAttributes=!0,this.overwriteIndex=!0,this.attributes=[`position`,`normal`,`color`,`tangent`,`uv`,`uv2`],this._intermediateGeometry=new Map,this._geometryMergeSets=new WeakMap,this._mergeOrder=[],this._dummyMesh=null,this.setObjects(e||[])}_getDummyMesh(){if(!this._dummyMesh){let e=new re,t=new M;t.setAttribute(`position`,new F(new Float32Array(9),3)),this._dummyMesh=new ne(t,e)}return this._dummyMesh}_getMeshes(){let e=[];return Wr(this.objects,t=>{e.push(t)}),e.sort((e,t)=>e.uuid>t.uuid?1:e.uuid<t.uuid?-1:0),e.length===0&&e.push(this._getDummyMesh()),e}_updateIntermediateGeometries(){let{_intermediateGeometry:e}=this,t=this._getMeshes(),n=new Set(e.keys()),r={attributes:this.attributes,applyWorldTransforms:this.applyWorldTransforms};for(let i=0,a=t.length;i<a;i++){let a=t[i],o=a.uuid;n.delete(o);let s=e.get(o);s&&s.isCompatible(a,this.attributes)||(s&&s.dispose(),s=new Ur,e.set(o,s)),s.updateFrom(a,r)&&this.generateMissingAttributes&&Cr(s,this.attributes)}n.forEach(t=>{e.delete(t)})}setObjects(e){this.objects=Array.isArray(e)?[...e]:[e]}generate(e=new M){let{useGroups:t,overwriteIndex:n,_intermediateGeometry:r,_geometryMergeSets:i}=this,a=this._getMeshes(),o=[],s=[],c=i.get(e)||[];this._updateIntermediateGeometries();let l=!1;a.length!==c.length&&(l=!0);for(let e=0,t=a.length;e<t;e++){let t=a[e],n=r.get(t.uuid);s.push(n);let i=c[e];!i||i.uuid!==n.uuid?(o.push(!1),l=!0):i.version===n.version?o.push(!0):o.push(!1)}Kr(s,e,{useGroups:t,forceUpdate:l,skipAssigningAttributes:o,overwriteIndex:n}),l&&e.dispose(),i.set(e,s.map(e=>({version:e.version,uuid:e.uuid})));let u=0;return l?u=2:o.includes(!1)&&(u=1),{changeType:u,materials:Gr(a),geometry:e}}};function Jr(e){let t=new Set;for(let n=0,r=e.length;n<r;n++){let r=e[n];for(let e in r){let n=r[e];n&&n.isTexture&&t.add(n)}}return Array.from(t)}function Yr(e){let t=[],n=new Set;for(let r=0,i=e.length;r<i;r++)e[r].traverse(e=>{e.visible&&(e.isRectAreaLight||e.isSpotLight||e.isPointLight||e.isDirectionalLight)&&(t.push(e),e.iesMap&&n.add(e.iesMap))});return{lights:t,iesTextures:Array.from(n).sort((e,t)=>e.uuid<t.uuid?1:e.uuid>t.uuid?-1:0)}}var Xr=class{get initialized(){return!!this.bvh}constructor(e){this.bvhOptions={},this.attributes=[`position`,`normal`,`tangent`,`color`,`uv`,`uv2`],this.generateBVH=!0,this.bvh=null,this.geometry=new M,this.staticGeometryGenerator=new qr(e),this._bvhWorker=null,this._pendingGenerate=null,this._buildAsync=!1,this._materialUuids=null}setObjects(e){this.staticGeometryGenerator.setObjects(e)}setBVHWorker(e){this._bvhWorker=e}async generateAsync(e=null){if(!this._bvhWorker)throw Error(`PathTracingSceneGenerator: "setBVHWorker" must be called before "generateAsync" can be called.`);if(this.bvh instanceof Promise)return this._pendingGenerate||=new Promise(async()=>(await this.bvh,this._pendingGenerate=null,this.generateAsync(e))),this._pendingGenerate;{this._buildAsync=!0;let t=this.generate(e);return this._buildAsync=!1,t.bvh=this.bvh=await t.bvh,t}}generate(e=null){let{staticGeometryGenerator:t,geometry:n,attributes:r}=this,i=t.objects;t.attributes=r,i.forEach(e=>{e.traverse(e=>{e.isSkinnedMesh&&e.skeleton&&e.skeleton.update()})});let a=t.generate(n),o=a.materials,s=a.changeType!==0||this._materialUuids===null||this._materialUuids.length!==length;if(!s){for(let e=0,t=o.length;e<t;e++)if(o[e].uuid!==this._materialUuids[e]){s=!0;break}}let c=Jr(o),{lights:l,iesTextures:u}=Yr(i);if(s&&(Sr(n,o,o),this._materialUuids=o.map(e=>e.uuid)),this.generateBVH){if(this.bvh instanceof Promise)throw Error(`PathTracingSceneGenerator: BVH is already building asynchronously.`);if(a.changeType===2){let t={strategy:2,maxLeafTris:1,indirect:!0,onProgress:e,...this.bvhOptions};this.bvh=this._buildAsync?this._bvhWorker.generate(n,t):new tr(n,t)}else a.changeType===1&&this.bvh.refit()}return{bvhChanged:a.changeType!==0,bvh:this.bvh,needsMaterialIndexUpdate:s,lights:l,iesTextures:u,geometry:n,materials:o,textures:c,objects:i}}},Z=e(w(),1),Zr=new fe(-1,1,1,-1,0,1),Qr=new class extends M{constructor(){super(),this.setAttribute(`position`,new g([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new g([0,2,0,0,2,0],2))}},$r=class{constructor(e){this._mesh=new ne(Qr,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Zr)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},ei=class extends se{set needsUpdate(e){super.needsUpdate=!0,this.dispatchEvent({type:`recompilation`})}constructor(e){super(e);for(let e in this.uniforms)Object.defineProperty(this,e,{get(){return this.uniforms[e].value},set(t){this.uniforms[e].value=t}})}setDefine(e,t=void 0){if(t==null){if(e in this.defines)return delete this.defines[e],this.needsUpdate=!0,!0}else if(this.defines[e]!==t)return this.defines[e]=t,this.needsUpdate=!0,!0;return!1}},ti=class extends ei{constructor(e){super({blending:0,uniforms:{target1:{value:null},target2:{value:null},opacity:{value:1}},vertexShader:`

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

				}`}),this.setValues(e)}};function ni(e=1){let t=`uint`;return e>1&&(t=`uvec`+e),`
		${t} sobolReverseBits( ${t} x ) {

			x = ( ( ( x & 0xaaaaaaaau ) >> 1 ) | ( ( x & 0x55555555u ) << 1 ) );
			x = ( ( ( x & 0xccccccccu ) >> 2 ) | ( ( x & 0x33333333u ) << 2 ) );
			x = ( ( ( x & 0xf0f0f0f0u ) >> 4 ) | ( ( x & 0x0f0f0f0fu ) << 4 ) );
			x = ( ( ( x & 0xff00ff00u ) >> 8 ) | ( ( x & 0x00ff00ffu ) << 8 ) );
			return ( ( x >> 16 ) | ( x << 16 ) );

		}

		${t} sobolHashCombine( uint seed, ${t} v ) {

			return seed ^ ( v + ${t}( ( seed << 6 ) + ( seed >> 2 ) ) );

		}

		${t} sobolLaineKarrasPermutation( ${t} x, ${t} seed ) {

			x += seed;
			x ^= x * 0x6c50b47cu;
			x ^= x * 0xb82f1e52u;
			x ^= x * 0xc7afe638u;
			x ^= x * 0x8d22f6e6u;
			return x;

		}

		${t} nestedUniformScrambleBase2( ${t} x, ${t} seed ) {

			x = sobolLaineKarrasPermutation( x, seed );
			x = sobolReverseBits( x );
			return x;

		}
	`}function ri(e=1){let t=`uint`,n=`float`,r=``,i=`.r`,a=`1u`;return e>1&&(t=`uvec`+e,n=`vec`+e,r=e+``,e===2?(i=`.rg`,a=`uvec2( 1u, 2u )`):e===3?(i=`.rgb`,a=`uvec3( 1u, 2u, 3u )`):(i=``,a=`uvec4( 1u, 2u, 3u, 4u )`)),`

		${n} sobol${r}( int effect ) {

			uint seed = sobolGetSeed( sobolBounceIndex, uint( effect ) );
			uint index = sobolPathIndex;

			uint shuffle_seed = sobolHashCombine( seed, 0u );
			uint shuffled_index = nestedUniformScrambleBase2( sobolReverseBits( index ), shuffle_seed );
			${n} sobol_pt = sobolGetTexturePoint( shuffled_index )${i};
			${t} result = ${t}( sobol_pt * 16777216.0 );

			${t} seed2 = sobolHashCombine( seed, ${a} );
			result = nestedUniformScrambleBase2( result, seed2 );

			return SOBOL_FACTOR * ${n}( result >> 8 );

		}
	`}var ii=`

	// Utils
	const float SOBOL_FACTOR = 1.0 / 16777216.0;
	const uint SOBOL_MAX_POINTS = 256u * 256u;

	${ni(1)}
	${ni(2)}
	${ni(3)}
	${ni(4)}

	uint sobolHash( uint x ) {

		// finalizer from murmurhash3
		x ^= x >> 16;
		x *= 0x85ebca6bu;
		x ^= x >> 13;
		x *= 0xc2b2ae35u;
		x ^= x >> 16;
		return x;

	}

`,ai=`

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

`,oi=`

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

	${ri(1)}
	${ri(2)}
	${ri(3)}
	${ri(4)}

`,si=class extends ei{constructor(){super({blending:0,uniforms:{resolution:{value:new D}},vertexShader:`

				varying vec2 vUv;
				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}
			`,fragmentShader:`

				${ii}
				${ai}

				varying vec2 vUv;
				uniform vec2 resolution;
				void main() {

					uint index = uint( gl_FragCoord.y ) * uint( resolution.x ) + uint( gl_FragCoord.x );
					gl_FragColor = generateSobolPoint( index );

				}
			`})}},ci=class{generate(e,t=256){let n=new o(t,t,{type:i,format:l,minFilter:R,magFilter:R,generateMipmaps:!1}),r=e.getRenderTarget();e.setRenderTarget(n);let a=new $r(new si);return a.material.resolution.set(t,t),a.render(e),e.setRenderTarget(r),a.dispose(),n}},li=class extends a{set bokehSize(e){this.fStop=this.getFocalLength()/e}get bokehSize(){return this.getFocalLength()/this.fStop}constructor(...e){super(...e),this.fStop=1.4,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=25,this.anamorphicRatio=1}copy(e,t){return super.copy(e,t),this.fStop=e.fStop,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio,this}},ui=class{constructor(){this.bokehSize=0,this.apertureBlades=0,this.apertureRotation=0,this.focusDistance=10,this.anamorphicRatio=1}updateFrom(e){e instanceof li?(this.bokehSize=e.bokehSize,this.apertureBlades=e.apertureBlades,this.apertureRotation=e.apertureRotation,this.focusDistance=e.focusDistance,this.anamorphicRatio=e.anamorphicRatio):(this.bokehSize=0,this.apertureRotation=0,this.apertureBlades=0,this.focusDistance=10,this.anamorphicRatio=1)}};function di(e){let t=new Uint16Array(e.length);for(let n=0,r=e.length;n<r;++n)t[n]=k.toHalfFloat(e[n]);return t}function fi(e,t,n=0,r=e.length){let i=n,a=n+r-1;for(;i<a;){let n=i+a>>1;e[n]<t?i=n+1:a=n}return i-n}function pi(e,t,n){return .2126*e+.7152*t+.0722*n}function mi(e,t=A){let n=e.clone();n.source=new ue({...n.image});let{width:r,height:i,data:a}=n.image,o=a;if(n.type!==t){o=t===1016?new Uint16Array(a.length):new Float32Array(a.length);let e;e=a instanceof Int8Array||a instanceof Int16Array||a instanceof Int32Array?2**(8*a.BYTES_PER_ELEMENT-1)-1:2**(8*a.BYTES_PER_ELEMENT)-1;for(let r=0,i=a.length;r<i;r++){let i=a[r];n.type===1016&&(i=k.fromHalfFloat(a[r])),n.type!==1015&&n.type!==1016&&(i/=e),t===1016&&(o[r]=k.toHalfFloat(i))}n.image.data=o,n.type=t}if(n.flipY){let e=o;o=o.slice();for(let t=0;t<i;t++)for(let n=0;n<r;n++){let a=i-t-1,s=4*(t*r+n),c=4*(a*r+n);o[c+0]=e[s+0],o[c+1]=e[s+1],o[c+2]=e[s+2],o[c+3]=e[s+3]}n.flipY=!1,n.image.data=o}return n}var hi=class{constructor(){let e=new j(di(new Float32Array([0,0,0,0])),1,1);e.type=A,e.format=l,e.minFilter=C,e.magFilter=C,e.wrapS=S,e.wrapT=S,e.generateMipmaps=!1,e.needsUpdate=!0;let t=new j(di(new Float32Array([0,1])),1,2);t.type=A,t.format=c,t.minFilter=C,t.magFilter=C,t.generateMipmaps=!1,t.needsUpdate=!0;let n=new j(di(new Float32Array([0,0,1,1])),2,2);n.type=A,n.format=c,n.minFilter=C,n.magFilter=C,n.generateMipmaps=!1,n.needsUpdate=!0,this.map=e,this.marginalWeights=t,this.conditionalWeights=n,this.totalSum=0}getPixelWeight(e,t,n){return pi(e,t,n)}dispose(){this.marginalWeights.dispose(),this.conditionalWeights.dispose(),this.map.dispose()}updateFrom(e){let t=mi(e);t.wrapS=S,t.wrapT=N;let{width:n,height:r,data:i}=t.image,a=new Float32Array(n*r),o=new Float32Array(n*r),s=new Float32Array(r),c=new Float32Array(r),l=0,u=0;for(let e=0;e<r;e++){let t=0;for(let s=0;s<n;s++){let c=e*n+s,u=k.fromHalfFloat(i[4*c+0]),d=k.fromHalfFloat(i[4*c+1]),f=k.fromHalfFloat(i[4*c+2]),p=this.getPixelWeight(u,d,f,e,r);t+=p,l+=p,a[c]=p,o[c]=t}if(t!==0)for(let r=e*n,i=e*n+n;r<i;r++)a[r]/=t,o[r]/=t;u+=t,s[e]=t,c[e]=u}if(u!==0)for(let e=0,t=s.length;e<t;e++)s[e]/=u,c[e]/=u;let d=new Uint16Array(r),f=new Uint16Array(n*r);for(let e=0;e<r;e++){let t=fi(c,(e+1)/r);d[e]=k.toHalfFloat((t+.5)/r)}for(let e=0;e<r;e++)for(let t=0;t<n;t++){let r=e*n+t,i=fi(o,(t+1)/n,e*n,n);f[r]=k.toHalfFloat((i+.5)/n)}this.dispose();let{marginalWeights:p,conditionalWeights:m}=this;p.image={width:r,height:1,data:d},p.needsUpdate=!0,m.image={width:n,height:r,data:f},m.needsUpdate=!0,this.totalSum=l,this.map=t}},gi=6,_i=11,vi=0,yi=1,bi=2,xi=3,Si=4,Ci=new L,Q=new L,wi=new I,Ti=new f,Ei=new L,Di=new L,Oi=new L(0,1,0),ki=class{constructor(){let e=new j(new Float32Array(4),1,1);e.format=l,e.type=i,e.wrapS=N,e.wrapT=N,e.generateMipmaps=!1,e.minFilter=R,e.magFilter=R,this.tex=e,this.count=0}updateFrom(e,t=[]){let n=this.tex,r=Math.max(e.length*gi,1),i=Math.ceil(Math.sqrt(r));n.image.width!==i&&(n.dispose(),n.image.data=new Float32Array(i*i*4),n.image.width=i,n.image.height=i);let a=n.image.data;for(let n=0,r=e.length;n<r;n++){let r=e[n],i=n*gi*4,o=0;for(let e=0;e<24;e++)a[i+e]=0;r.getWorldPosition(Q),a[i+o++]=Q.x,a[i+o++]=Q.y,a[i+o++]=Q.z;let s=vi;if(r.isRectAreaLight&&r.isCircular?s=yi:r.isSpotLight?s=bi:r.isDirectionalLight||r.isSunLight?s=xi:r.isPointLight&&(s=Si),a[i+o++]=s,a[i+o++]=r.color.r,a[i+o++]=r.color.g,a[i+o++]=r.color.b,a[i+o++]=r.intensity,r.getWorldQuaternion(Ti),r.isRectAreaLight)Ci.set(r.width,0,0).applyQuaternion(Ti),a[i+o++]=Ci.x,a[i+o++]=Ci.y,a[i+o++]=Ci.z,o++,Q.set(0,r.height,0).applyQuaternion(Ti),a[i+o++]=Q.x,a[i+o++]=Q.y,a[i+o++]=Q.z,a[i+o++]=Ci.cross(Q).length()*(r.isCircular?Math.PI/4:1);else if(r.isSpotLight){let e=r.radius||0;Ei.setFromMatrixPosition(r.matrixWorld),Di.setFromMatrixPosition(r.target.matrixWorld),wi.lookAt(Ei,Di,Oi),Ti.setFromRotationMatrix(wi),Ci.set(1,0,0).applyQuaternion(Ti),a[i+o++]=Ci.x,a[i+o++]=Ci.y,a[i+o++]=Ci.z,o++,Q.set(0,1,0).applyQuaternion(Ti),a[i+o++]=Q.x,a[i+o++]=Q.y,a[i+o++]=Q.z,a[i+o++]=Math.PI*e*e,a[i+o++]=e,a[i+o++]=r.decay,a[i+o++]=r.distance,a[i+o++]=Math.cos(r.angle),a[i+o++]=Math.cos(r.angle*(1-r.penumbra)),a[i+o++]=r.iesMap?t.indexOf(r.iesMap):-1}else if(r.isPointLight){let e=Ci.setFromMatrixPosition(r.matrixWorld);a[i+o++]=e.x,a[i+o++]=e.y,a[i+o++]=e.z,o++,o+=4,o+=1,a[i+o++]=r.decay,a[i+o++]=r.distance}else if(r.isDirectionalLight){let e=Ci.setFromMatrixPosition(r.matrixWorld),t=Q.setFromMatrixPosition(r.target.matrixWorld);Di.subVectors(e,t).normalize(),a[i+o++]=Di.x,a[i+o++]=Di.y,a[i+o++]=Di.z}else r.isSunLight&&(Di.setFromMatrixPosition(r.matrixWorld).normalize(),a[i+o++]=Di.x,a[i+o++]=Di.y,a[i+o++]=Di.z);a[i+_i]=+!!r.visibleToCameraRays}this.count=e.length;let o=wr(a.buffer);return this.hash!==o&&(this.hash=o,n.needsUpdate=!0,!0)}};function Ai(e,t,n,r,i){if(t>r)throw Error();let a=e.length/t,o=e.constructor.BYTES_PER_ELEMENT*8,s=1;switch(e.constructor){case Uint8Array:case Uint16Array:case Uint32Array:s=2**o-1;break;case Int8Array:case Int16Array:case Int32Array:s=2**(o-1)-1}for(let o=0;o<a;o++){let a=4*o,c=t*o;for(let o=0;o<r;o++)n[i+a+o]=t>=o+1?e[c+o]/s:0}}var ji=class extends oe{constructor(){super(),this._textures=[],this.type=i,this.format=l,this.internalFormat=`RGBA32F`}updateAttribute(e,t){let n=this._textures[e];n.updateFrom(t);let r=n.image,i=this.image;if(r.width!==i.width||r.height!==i.height)throw Error(`FloatAttributeTextureArray: Attribute must be the same dimensions when updating single layer.`);let{width:a,height:o,data:s}=i,c=a*o*4*e,l=t.itemSize;l===3&&(l=4),Ai(n.image.data,l,s,4,c),this.dispose(),this.needsUpdate=!0}setAttributes(e){let t=e[0].count,n=e.length;for(let r=0,i=n;r<i;r++)if(e[r].count!==t)throw Error(`FloatAttributeTextureArray: All attributes must have the same item count.`);let r=this._textures;for(;r.length<n;){let e=new sr;r.push(e)}for(;r.length>n;)r.pop();for(let t=0,i=n;t<i;t++)r[t].updateFrom(e[t]);let i=r[0].image,a=this.image;(i.width!==a.width||i.height!==a.height||i.depth!==n)&&(a.width=i.width,a.height=i.height,a.depth=n,a.data=new Float32Array(a.width*a.height*a.depth*4));let{data:o,width:s,height:c}=a;for(let t=0,i=n;t<i;t++){let n=r[t],i=s*c*4*t,a=e[t].itemSize;a===3&&(a=4),Ai(n.image.data,a,o,4,i)}this.dispose(),this.needsUpdate=!0}},Mi=class extends ji{updateNormalAttribute(e){this.updateAttribute(0,e)}updateTangentAttribute(e){this.updateAttribute(1,e)}updateUvAttribute(e){this.updateAttribute(2,e)}updateColorAttribute(e){this.updateAttribute(3,e)}updateFrom(e,t,n,r){this.setAttributes([e,t,n,r])}};function Ni(e,t){return e.uuid<t.uuid?1:e.uuid>t.uuid?-1:0}function Pi(e){return`${e.source.uuid}:${e.colorSpace}`}function Fi(e){let t=new Set,n=[];for(let r=0,i=e.length;r<i;r++){let i=e[r],a=Pi(i);t.has(a)||(t.add(a),n.push(i))}return n}function Ii(e){let t=e.map(e=>e.iesMap||null).filter(e=>e),n=new Set(t);return Array.from(n).sort(Ni)}function Li(e){let t=new Set;for(let n=0,r=e.length;n<r;n++){let r=e[n];for(let e in r){let n=r[e];n&&n.isTexture&&t.add(n)}}return Fi(Array.from(t)).sort(Ni)}function Ri(e){let t=[];return e.traverseVisible(e=>{(e.isRectAreaLight||e.isSpotLight||e.isPointLight||e.isDirectionalLight||e.isSunLight)&&t.push(e)}),t.sort(Ni)}var zi=188,Bi=class{constructor(){this._features={}}isUsed(e){return e in this._features}setUsed(e,t=!0){t===!1?delete this._features[e]:this._features[e]=!0}reset(){this._features={}}},Vi=class extends j{constructor(){super(new Float32Array(4),1,1),this.format=l,this.type=i,this.wrapS=N,this.wrapT=N,this.minFilter=R,this.magFilter=R,this.generateMipmaps=!1,this.features=new Bi}updateFrom(e,t){function n(e,t,n=-1){if(t in e&&e[t]){let n=Pi(e[t]);return u[n]}return n}function r(e,t,n){return t in e?e[t]:n}function i(e,t,n,r){let i=e[t]&&e[t].isTexture?e[t]:null;if(i){i.matrixAutoUpdate&&i.updateMatrix();let e=i.matrix.elements,t=0;n[r+t++]=e[0],n[r+t++]=e[3],n[r+t++]=e[6],t++,n[r+t++]=e[1],n[r+t++]=e[4],n[r+t++]=e[7],t++}return 8}let a=0,o=e.length*47,s=Math.ceil(Math.sqrt(o))||1,{image:c,features:l}=this,u={};for(let e=0,n=t.length;e<n;e++)u[Pi(t[e])]=e;c.width!==s&&(this.dispose(),c.data=new Float32Array(s*s*4),c.width=s,c.height=s);let d=c.data;l.reset();for(let t=0,o=e.length;t<o;t++){let o=e[t];if(o.isFogVolumeMaterial){l.setUsed(`FOG`);for(let e=0;e<zi;e++)d[a+e]=0;d[a+0+0]=o.color.r,d[a+0+1]=o.color.g,d[a+0+2]=o.color.b,d[a+8+3]=r(o,`emissiveIntensity`,0),d[a+12+0]=o.emissive.r,d[a+12+1]=o.emissive.g,d[a+12+2]=o.emissive.b,d[a+52+1]=o.density,d[a+52+3]=0,d[a+56+2]=4,a+=zi;continue}d[a++]=o.color.r,d[a++]=o.color.g,d[a++]=o.color.b,d[a++]=n(o,`map`),d[a++]=r(o,`metalness`,0),d[a++]=n(o,`metalnessMap`),d[a++]=r(o,`roughness`,0),d[a++]=n(o,`roughnessMap`),d[a++]=r(o,`ior`,1.5),d[a++]=r(o,`transmission`,0),d[a++]=n(o,`transmissionMap`),d[a++]=r(o,`emissiveIntensity`,0),`emissive`in o?(d[a++]=o.emissive.r,d[a++]=o.emissive.g,d[a++]=o.emissive.b):(d[a++]=0,d[a++]=0,d[a++]=0),d[a++]=n(o,`emissiveMap`),d[a++]=n(o,`normalMap`),`normalScale`in o?(d[a++]=o.normalScale.x,d[a++]=o.normalScale.y):(d[a++]=1,d[a++]=1),d[a++]=r(o,`clearcoat`,0),d[a++]=n(o,`clearcoatMap`),d[a++]=r(o,`clearcoatRoughness`,0),d[a++]=n(o,`clearcoatRoughnessMap`),d[a++]=n(o,`clearcoatNormalMap`),`clearcoatNormalScale`in o?(d[a++]=o.clearcoatNormalScale.x,d[a++]=o.clearcoatNormalScale.y):(d[a++]=1,d[a++]=1),a++,d[a++]=r(o,`sheen`,0),`sheenColor`in o?(d[a++]=o.sheenColor.r,d[a++]=o.sheenColor.g,d[a++]=o.sheenColor.b):(d[a++]=0,d[a++]=0,d[a++]=0),d[a++]=n(o,`sheenColorMap`),d[a++]=r(o,`sheenRoughness`,0),d[a++]=n(o,`sheenRoughnessMap`),d[a++]=n(o,`iridescenceMap`),d[a++]=n(o,`iridescenceThicknessMap`),d[a++]=r(o,`iridescence`,0),d[a++]=r(o,`iridescenceIOR`,1.3);let s=r(o,`iridescenceThicknessRange`,[100,400]);d[a++]=s[0],d[a++]=s[1],`specularColor`in o?(d[a++]=o.specularColor.r,d[a++]=o.specularColor.g,d[a++]=o.specularColor.b):(d[a++]=1,d[a++]=1,d[a++]=1),d[a++]=n(o,`specularColorMap`),d[a++]=r(o,`specularIntensity`,1),d[a++]=n(o,`specularIntensityMap`);let c=r(o,`thickness`,0)===0&&r(o,`attenuationDistance`,1/0)===1/0;if(d[a++]=Number(c),a++,`attenuationColor`in o?(d[a++]=o.attenuationColor.r,d[a++]=o.attenuationColor.g,d[a++]=o.attenuationColor.b):(d[a++]=1,d[a++]=1,d[a++]=1),d[a++]=r(o,`attenuationDistance`,1/0),d[a++]=n(o,`alphaMap`),d[a++]=o.opacity,d[a++]=o.alphaTest,!c&&o.transmission>0)d[a++]=0;else switch(o.side){case 0:d[a++]=1;break;case 1:d[a++]=-1;break;case 2:d[a++]=0}d[a++]=Number(r(o,`matte`,!1)),d[a++]=Number(r(o,`castShadow`,!0)),d[a++]=Number(o.vertexColors)|Number(o.flatShading)<<1,d[a++]=Number(o.transparent),a+=i(o,`map`,d,a),a+=i(o,`metalnessMap`,d,a),a+=i(o,`roughnessMap`,d,a),a+=i(o,`transmissionMap`,d,a),a+=i(o,`emissiveMap`,d,a),a+=i(o,`normalMap`,d,a),a+=i(o,`clearcoatMap`,d,a),a+=i(o,`clearcoatNormalMap`,d,a),a+=i(o,`clearcoatRoughnessMap`,d,a),a+=i(o,`sheenColorMap`,d,a),a+=i(o,`sheenRoughnessMap`,d,a),a+=i(o,`iridescenceMap`,d,a),a+=i(o,`iridescenceThicknessMap`,d,a),a+=i(o,`specularColorMap`,d,a),a+=i(o,`specularIntensityMap`,d,a),a+=i(o,`alphaMap`,d,a)}let f=wr(d.buffer);return this.hash!==f&&(this.hash=f,this.needsUpdate=!0,!0)}},Hi=new O;function Ui(e){return e?`${e.uuid}:${e.version}`:null}function Wi(e,t){for(let n in t)n in e&&(e[n]=t[n])}var Gi=class extends _{constructor(e,t,n){let r={format:l,type:te,minFilter:C,magFilter:C,wrapS:S,wrapT:S,generateMipmaps:!1,...n};super(e,t,1,r),Wi(this.texture,r),this.texture.setTextures=(...e)=>{this.setTextures(...e)},this.hashes=[null];let i=new $r(new Ki);this.fsQuad=i}setTextures(e,t,n=this.width,r=this.height){let i=e.getRenderTarget(),a=e.toneMapping,o=e.getClearAlpha();e.getClearColor(Hi);let s=t.length||1;(n!==this.width||r!==this.height||this.depth!==s)&&(this.setSize(n,r,s),this.hashes=Array(s).fill(null)),e.setClearColor(0,0),e.toneMapping=0;let c=this.fsQuad,l=this.hashes,u=!1;for(let n=0,r=s;n<r;n++){let r=t[n],i=Ui(r);r&&(l[n]!==i||r.isWebGLRenderTarget)&&(r.matrixAutoUpdate=!1,r.matrix.identity(),c.material.map=r,e.setRenderTarget(this,n),c.render(e),r.updateMatrix(),r.matrixAutoUpdate=!0,l[n]=i,u=!0)}return c.material.map=null,e.setClearColor(Hi,o),e.setRenderTarget(i),e.toneMapping=a,u}dispose(){super.dispose(),this.fsQuad.dispose()}},Ki=class extends se{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}constructor(){super({uniforms:{map:{value:null}},vertexShader:`
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
			`})}};function qi(e,t=Math.random()){for(let n=e.length-1;n>0;n--){let r=Math.floor(t()*(n+1)),i=e[n];e[n]=e[r],e[r]=i}return e}var Ji=class{constructor(e,t,n=Math.random){let r=e**t,i=new Uint16Array(r),a=r;for(let e=0;e<r;e++)i[e]=e;this.samples=new Float32Array(t),this.strataCount=e,this.reset=function(){for(let e=0;e<r;e++)i[e]=e;a=0},this.reshuffle=function(){a=0},this.next=function(){let{samples:r}=this;a>=i.length&&(qi(i,n),this.reshuffle());let o=i[a++];for(let i=0;i<t;i++)r[i]=(o%e+n())/e,o=Math.floor(o/e);return r}}},Yi=class{constructor(e,t,n=Math.random){let r=0;for(let e of t)r+=e;let i=new Float32Array(r),a=[],o=0;for(let r of t){let t=new Ji(e,r,n);t.samples=new Float32Array(i.buffer,o,t.samples.length),o+=t.samples.length*4,a.push(t)}this.samples=i,this.strataCount=e,this.next=function(){for(let e of a)e.next();return i},this.reshuffle=function(){for(let e of a)e.reshuffle()},this.reset=function(){for(let e of a)e.reset()}}},Xi=class{constructor(e=0){this.m=2147483648,this.a=1103515245,this.c=12345,this.seed=e}nextInt(){return this.seed=(this.a*this.seed+this.c)%this.m,this.seed}nextFloat(){return this.nextInt()/(this.m-1)}},Zi=class extends j{constructor(e=1,t=1,n=8){super(new Float32Array(1),1,1,l,i),this.minFilter=R,this.magFilter=R,this.strata=n,this.sampler=null,this.generator=new Xi,this.stableNoise=!1,this.random=()=>this.stableNoise?this.generator.nextFloat():Math.random(),this.init(e,t,n)}init(e=this.image.height,t=this.image.width,n=this.strata){let{image:r}=this;if(r.width===t&&r.height===e&&this.sampler!==null)return;let i=new Yi(n,Array(e*t).fill(4),this.random);r.width=t,r.height=e,r.data=i.samples,this.sampler=i,this.dispose(),this.next()}next(){this.sampler.next(),this.needsUpdate=!0}reset(){this.sampler.reset(),this.generator.seed=0}};function Qi(e,t=Math.random){for(let n=e.length-1;n>0;n--){let r=~~((t()-1e-6)*n),i=e[n];e[n]=e[r],e[r]=i}}function $i(e,t){e.fill(0);for(let n=0;n<t;n++)e[n]=1}var ea=class{constructor(e){this.count=0,this.size=-1,this.sigma=-1,this.radius=-1,this.lookupTable=null,this.score=null,this.binaryPattern=null,this.resize(e),this.setSigma(1.5)}findVoid(){let{score:e,binaryPattern:t}=this,n=1/0,r=-1;for(let i=0,a=t.length;i<a;i++){if(t[i]!==0)continue;let a=e[i];a<n&&(n=a,r=i)}return r}findCluster(){let{score:e,binaryPattern:t}=this,n=-1/0,r=-1;for(let i=0,a=t.length;i<a;i++){if(t[i]!==1)continue;let a=e[i];a>n&&(n=a,r=i)}return r}setSigma(e){if(e===this.sigma)return;let t=~~(Math.sqrt(20*e**2)+1),n=2*t+1,r=new Float32Array(n*n),i=e*e;for(let e=-t;e<=t;e++)for(let a=-t;a<=t;a++){let o=(t+a)*n+e+t,s=e*e+a*a;r[o]=Math.E**(-s/(2*i))}this.lookupTable=r,this.sigma=e,this.radius=t}resize(e){this.size!==e&&(this.size=e,this.score=new Float32Array(e*e),this.binaryPattern=new Uint8Array(e*e))}invert(){let{binaryPattern:e,score:t,size:n}=this;t.fill(0);for(let t=0,r=e.length;t<r;t++)if(e[t]===0){let r=~~(t/n),i=t-r*n;this.updateScore(i,r,1),e[t]=1}else e[t]=0}updateScore(e,t,n){let{size:r,score:i,lookupTable:a}=this,o=this.radius,s=2*o+1;for(let c=-o;c<=o;c++)for(let l=-o;l<=o;l++){let u=a[(o+l)*s+c+o],d=e+c;d=d<0?r+d:d%r;let f=t+l;f=f<0?r+f:f%r;let p=f*r+d;i[p]+=n*u}}addPointIndex(e){this.binaryPattern[e]=1;let t=this.size,n=~~(e/t),r=e-n*t;this.updateScore(r,n,1),this.count++}removePointIndex(e){this.binaryPattern[e]=0;let t=this.size,n=~~(e/t),r=e-n*t;this.updateScore(r,n,-1),this.count--}copy(e){this.resize(e.size),this.score.set(e.score),this.binaryPattern.set(e.binaryPattern),this.setSigma(e.sigma),this.count=e.count}},ta=class{constructor(){this.random=Math.random,this.sigma=1.5,this.size=64,this.majorityPointsRatio=.1,this.samples=new ea(1),this.savedSamples=new ea(1)}generate(){let{samples:e,savedSamples:t,sigma:n,majorityPointsRatio:r,size:i}=this;e.resize(i),e.setSigma(n);let a=Math.floor(i*i*r),o=e.binaryPattern;$i(o,a),Qi(o,this.random);for(let t=0,n=o.length;t<n;t++)o[t]===1&&e.addPointIndex(t);for(;;){let t=e.findCluster();e.removePointIndex(t);let n=e.findVoid();if(t===n){e.addPointIndex(t);break}e.addPointIndex(n)}let s=new Uint32Array(i*i);t.copy(e);let c;for(c=e.count-1;c>=0;){let t=e.findCluster();e.removePointIndex(t),s[t]=c,c--}let l=i*i;for(c=t.count;c<l/2;){let e=t.findVoid();t.addPointIndex(e),s[e]=c,c++}for(t.invert();c<l;){let e=t.findCluster();t.removePointIndex(e),s[e]=c,c++}return{data:s,maxValue:l}}};function na(e){return e>=3?4:e}function ra(e){switch(e){case 1:return c;case 2:return m;default:return l}}var ia=class extends j{constructor(e=64,t=1){super(new Float32Array(4),1,1,l,i),this.minFilter=R,this.magFilter=R,this.size=e,this.channels=t,this.update()}update(){let e=this.channels,t=this.size,n=new ta;n.channels=e,n.size=t;let r=na(e),i=ra(r);(this.image.width!==t||i!==this.format)&&(this.image.width=t,this.image.height=t,this.image.data=new Float32Array(t**2*r),this.format=i,this.dispose());let a=this.image.data;for(let t=0,i=e;t<i;t++){let e=n.generate(),i=e.data,o=e.maxValue;for(let e=0,n=i.length;e<n;e++){let n=i[e]/o;a[e*r+t]=n}}this.needsUpdate=!0}},aa=`

	struct PhysicalCamera {

		float focusDistance;
		float anamorphicRatio;
		float bokehSize;
		int apertureBlades;
		float apertureRotation;

	};

`,oa=`

	struct EquirectHdrInfo {

		sampler2D marginalWeights;
		sampler2D conditionalWeights;
		sampler2D map;

		float totalSum;

	};

`,sa=`

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

`,ca=`

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

`,la=`

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

`,ua=`

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
`,da=`

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

`,fa=`

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


`,pa=`

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

`,ma=`

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

`,ha=`

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

`,ga=`

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

`,_a=`

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
`,va=`

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
`,ya=`

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

`,ba=`

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

`,xa=`

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

`,Sa=`

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

`,Ca=`

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

`,wa=`

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

`,Ta=`

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

`,Ea=`

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

`,Da=`

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

`,Oa=`

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

`,ka=`

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
`,Aa=`

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

`,ja=`

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

`,Ma=class extends ei{onBeforeRender(){this.setDefine(`FEATURE_DOF`,this.physicalCamera.bokehSize===0?0:1),this.setDefine(`FEATURE_BACKGROUND_MAP`,+!!this.backgroundMap),this.setDefine(`FEATURE_FOG`,+!!this.materials.features.isUsed(`FOG`))}constructor(e){super({transparent:!0,depthWrite:!1,defines:{FEATURE_MIS:1,FEATURE_RUSSIAN_ROULETTE:1,FEATURE_DOF:1,FEATURE_BACKGROUND_MAP:0,FEATURE_FOG:1,RANDOM_TYPE:2,CAMERA_TYPE:0,DEBUG_MODE:0,ATTR_NORMAL:0,ATTR_TANGENT:1,ATTR_UV:2,ATTR_COLOR:3,MATERIAL_PIXELS:47},uniforms:{resolution:{value:new D},opacity:{value:1},bounces:{value:10},transmissiveBounces:{value:10},filterGlossyFactor:{value:0},physicalCamera:{value:new ui},cameraWorldMatrix:{value:new I},invProjectionMatrix:{value:new I},bvh:{value:new cr},attributesArray:{value:new Mi},materialIndexAttribute:{value:new or},materials:{value:new Vi},textures:{value:new Gi().texture},lights:{value:new ki},iesProfiles:{value:new Gi(360,180,{type:A,wrapS:N,wrapT:N}).texture},environmentIntensity:{value:1},environmentRotation:{value:new I},envMapInfo:{value:new hi},backgroundBlur:{value:0},backgroundMap:{value:null},backgroundAlpha:{value:1},backgroundIntensity:{value:1},backgroundRotation:{value:new I},seed:{value:0},sobolTexture:{value:null},stratifiedTexture:{value:new Zi},stratifiedOffsetTexture:{value:new ia(64,1)}},vertexShader:`

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
				${dr}
				${pr}
				${fr}

				// uniform structs
				${aa}
				${sa}
				${oa}
				${ca}
				${la}

				// random
				#if RANDOM_TYPE == 2 	// Stratified List

					${ya}

				#elif RANDOM_TYPE == 1 	// Sobol

					${va}
					${ii}
					${oi}

					#define rand(v) sobol(v)
					#define rand2(v) sobol2(v)
					#define rand3(v) sobol3(v)
					#define rand4(v) sobol4(v)

				#else 					// PCG

				${va}

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
				${ga}
				${pa}
				${_a}
				${ma}
				${ha}

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
				${fa}
				${ua}
				${da}

				${Ta}
				${Sa}
				${wa}
				${Ca}
				${xa}
				${ba}

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

				${Aa}
				${Da}
				${ja}
				${Ea}
				${Oa}
				${ka}

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

			`}),this.setValues(e)}};function*Na(){let{_renderer:e,_fsQuad:t,_blendQuad:n,_primaryTarget:r,_blendTargets:i,_sobolTarget:a,_subframe:o,alpha:s,material:c}=this,l=new h,u=new h,d=n.material,[f,p]=i;for(;;){s?(d.opacity=this._opacityFactor/(this.samples+1),c.blending=0,c.opacity=1):(c.opacity=this._opacityFactor/(this.samples+1),c.blending=1);let[i,m,h,g]=o,_=r.width,v=r.height;c.resolution.set(_*h,v*g),c.sobolTexture=a.texture,c.stratifiedTexture.init(20,c.bounces+c.transmissiveBounces+5),c.stratifiedTexture.next(),c.seed++;let y=this.tiles.x||1,b=this.tiles.y||1,x=y*b,S=Math.ceil(_*h),C=Math.ceil(v*g),w=Math.floor(i*_),T=Math.floor(m*v),E=Math.ceil(S/y),ee=Math.ceil(C/b);for(let i=0;i<b;i++)for(let a=0;a<y;a++){let o=e.getRenderTarget(),c=e.autoClear,m=e.getScissorTest();e.getScissor(l),e.getViewport(u);let h=a,g=i;if(!this.stableTiles){let e=this._currentTile%(y*b);h=e%y,g=~~(e/y),this._currentTile=e+1}let _=b-g-1;r.scissor.set(w+h*E,T+_*ee,Math.min(E,S-h*E),Math.min(ee,C-_*ee)),r.viewport.set(w,T,S,C),e.setRenderTarget(r),e.setScissorTest(!0),e.autoClear=!1,t.render(e),e.setViewport(u),e.setScissor(l),e.setScissorTest(m),e.setRenderTarget(o),e.autoClear=c,s&&(d.target1=f.texture,d.target2=r.texture,e.setRenderTarget(p),n.render(e),e.setRenderTarget(o)),this.samples+=1/x,a===y-1&&i===b-1&&(this.samples=Math.round(this.samples)),yield}[f,p]=[p,f]}}var Pa=new O,Fa=class{get material(){return this._fsQuad.material}set material(e){this._fsQuad.material.removeEventListener(`recompilation`,this._compileFunction),e.addEventListener(`recompilation`,this._compileFunction),this._fsQuad.material=e}get target(){return this._alpha?this._blendTargets[1]:this._primaryTarget}set alpha(e){this._alpha!==e&&(e||(this._blendTargets[0].dispose(),this._blendTargets[1].dispose()),this._alpha=e,this.reset())}get alpha(){return this._alpha}get isCompiling(){return!!this._compilePromise}constructor(e){this.camera=null,this.tiles=new D(3,3),this.stableNoise=!1,this.stableTiles=!0,this.samples=0,this._subframe=new h(0,0,1,1),this._opacityFactor=1,this._renderer=e,this._alpha=!1,this._fsQuad=new $r(new Ma),this._blendQuad=new $r(new ti),this._task=null,this._currentTile=0,this._compilePromise=null,this._sobolTarget=new ci().generate(e),this._primaryTarget=new o(1,1,{format:l,type:i,magFilter:R,minFilter:R}),this._blendTargets=[new o(1,1,{format:l,type:i,magFilter:R,minFilter:R}),new o(1,1,{format:l,type:i,magFilter:R,minFilter:R})],this._compileFunction=()=>{let e=this.compileMaterial(this._fsQuad._mesh);e.then(()=>{this._compilePromise===e&&(this._compilePromise=null)}),this._compilePromise=e},this.material.addEventListener(`recompilation`,this._compileFunction)}compileMaterial(){return this._renderer.compileAsync(this._fsQuad._mesh)}setCamera(e){let{material:t}=this;t.cameraWorldMatrix.copy(e.matrixWorld),t.invProjectionMatrix.copy(e.projectionMatrixInverse),t.physicalCamera.updateFrom(e);let n=0;e.projectionMatrix.elements[15]>0&&(n=1),e.isEquirectCamera&&(n=2),t.setDefine(`CAMERA_TYPE`,n),this.camera=e}setSize(e,t){e=Math.ceil(e),t=Math.ceil(t),(this._primaryTarget.width!==e||this._primaryTarget.height!==t)&&(this._primaryTarget.setSize(e,t),this._blendTargets[0].setSize(e,t),this._blendTargets[1].setSize(e,t),this.reset())}getSize(e){e.x=this._primaryTarget.width,e.y=this._primaryTarget.height}dispose(){this._primaryTarget.dispose(),this._blendTargets[0].dispose(),this._blendTargets[1].dispose(),this._sobolTarget.dispose(),this._fsQuad.dispose(),this._blendQuad.dispose(),this._task=null}reset(){let{_renderer:e,_primaryTarget:t,_blendTargets:n}=this,r=e.getRenderTarget(),i=e.getClearAlpha();e.getClearColor(Pa),e.setRenderTarget(t),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(n[0]),e.setClearColor(0,0),e.clearColor(),e.setRenderTarget(n[1]),e.setClearColor(0,0),e.clearColor(),e.setClearColor(Pa,i),e.setRenderTarget(r),this.samples=0,this._task=null,this.material.stratifiedTexture.stableNoise=this.stableNoise,this.stableNoise&&(this.material.seed=0,this.material.stratifiedTexture.reset())}update(){this.material.onBeforeRender(),!this.isCompiling&&(this._task||=Na.call(this),this._task.next())}},Ia=new D,La=new D,Ra=new ie,za=new O,Ba=class extends j{constructor(e=512,t=512){super(new Uint16Array(e*t*4),e,t,l,A,303,S,N,C,C),this.generationCallback=null}update(){this.dispose(),this.needsUpdate=!0;let{data:e,width:t,height:n}=this.image;for(let r=0;r<t;r++)for(let i=0;i<n;i++){La.set(t,n),Ia.set(r/t,i/n),Ia.x-=.5,Ia.y=1-Ia.y,Ra.theta=Ia.x*2*Math.PI,Ra.phi=Ia.y*Math.PI,Ra.radius=1,this.generationCallback(Ra,Ia,La,za);let a=4*(i*t+r);e[a+0]=k.toHalfFloat(za.r),e[a+1]=k.toHalfFloat(za.g),e[a+2]=k.toHalfFloat(za.b),e[a+3]=k.toHalfFloat(1)}}copy(e){return super.copy(e),this.generationCallback=e.generationCallback,this}},Va=new L,Ha=class extends Ba{constructor(e=512){super(e,e),this.topColor=new O().set(16777215),this.bottomColor=new O().set(0),this.exponent=2,this.generationCallback=(e,t,n,r)=>{Va.setFromSpherical(e);let i=Va.y*.5+.5;r.lerpColors(this.bottomColor,this.topColor,i**this.exponent)}}copy(e){return super.copy(e),this.topColor.copy(e.topColor),this.bottomColor.copy(e.bottomColor),this}},Ua=class extends se{get map(){return this.uniforms.map.value}set map(e){this.uniforms.map.value=e}get opacity(){return this.uniforms.opacity.value}set opacity(e){this.uniforms&&(this.uniforms.opacity.value=e)}constructor(e){super({uniforms:{map:{value:null},opacity:{value:1}},vertexShader:`
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
			`}),this.setValues(e)}},Wa=class extends se{constructor(){super({uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:`
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

				${_a}

				void main() {

					vec3 rayDirection = equirectUvToDirection( vUv );
					rayDirection.x *= flipEnvMap;
					gl_FragColor = textureCube( envMap, rayDirection );

				}`}),this.depthWrite=!1,this.depthTest=!1}},Ga=class{constructor(e){this._renderer=e,this._quad=new $r(new Wa)}generate(e,t=null,n=null){if(!e.isCubeTexture)throw Error(`CubeToEquirectMaterial: Source can only be cube textures.`);let r=e.images[0],a=this._renderer,s=this._quad;t===null&&(t=4*r.height),n===null&&(n=2*r.height);let c=new o(t,n,{type:i,colorSpace:r.colorSpace}),u=r.height,d=Math.log2(u)-2,f=1/u,p=1/(3*Math.max(2**d,112));s.material.defines.CUBEUV_MAX_MIP=`${d}.0`,s.material.defines.CUBEUV_TEXEL_WIDTH=p,s.material.defines.CUBEUV_TEXEL_HEIGHT=f,s.material.uniforms.envMap.value=e,s.material.uniforms.flipEnvMap.value=e.isRenderTargetTexture?1:-1,s.material.needsUpdate=!0;let m=a.getRenderTarget(),h=a.autoClear;a.autoClear=!0,a.setRenderTarget(c),s.render(a),a.setRenderTarget(m),a.autoClear=h;let g=new Uint16Array(t*n*4),_=new Float32Array(t*n*4);a.readRenderTargetPixels(c,0,0,t,n,_),c.dispose();for(let e=0,t=_.length;e<t;e++)g[e]=k.toHalfFloat(_[e]);let v=new j(g,t,n,l,A);return v.minFilter=T,v.magFilter=C,v.wrapS=S,v.wrapT=S,v.mapping=303,v.needsUpdate=!0,v}dispose(){this._quad.dispose()}};function Ka(e){return e.extensions.get(`EXT_float_blend`)}var qa=new D,Ja=class{get multipleImportanceSampling(){return!!this._pathTracer.material.defines.FEATURE_MIS}set multipleImportanceSampling(e){this._pathTracer.material.setDefine(`FEATURE_MIS`,+!!e)}get transmissiveBounces(){return this._pathTracer.material.transmissiveBounces}set transmissiveBounces(e){this._pathTracer.material.transmissiveBounces=e}get bounces(){return this._pathTracer.material.bounces}set bounces(e){this._pathTracer.material.bounces=e}get filterGlossyFactor(){return this._pathTracer.material.filterGlossyFactor}set filterGlossyFactor(e){this._pathTracer.material.filterGlossyFactor=e}get samples(){return this._pathTracer.samples}get target(){return this._pathTracer.target}get tiles(){return this._pathTracer.tiles}get stableNoise(){return this._pathTracer.stableNoise}set stableNoise(e){this._pathTracer.stableNoise=e}get isCompiling(){return!!this._pathTracer.isCompiling}constructor(e){console.warn(`WebGLPathTracer: This class has been deprecated and will be removed in a future release. Use "WebGPUPathTracer" instead.`),this._renderer=e,this._generator=new Xr,this._pathTracer=new Fa(e),this._queueReset=!1,this._clock=new le,this._compilePromise=null,this._lowResPathTracer=new Fa(e),this._lowResPathTracer.tiles.set(1,1),this._quad=new $r(new Ua({map:null,transparent:!0,blending:0,premultipliedAlpha:e.getContextAttributes().premultipliedAlpha})),this._materials=null,this._previousEnvironment=null,this._previousBackground=null,this._internalBackground=null,this.renderDelay=100,this.minSamples=5,this.fadeDuration=500,this.enablePathTracing=!0,this.pausePathTracing=!1,this.dynamicLowRes=!1,this.lowResScale=.25,this.renderScale=1,this.synchronizeRenderSize=!0,this.rasterizeScene=!0,this.renderToCanvas=!0,this.textureSize=new D(1024,1024),this.rasterizeSceneCallback=(e,t)=>{this._renderer.render(e,t)},this.renderToCanvasCallback=(e,t,n)=>{let r=t.autoClear;t.autoClear=!1,n.render(t),t.autoClear=r},this.setScene(new u,new a)}setBVHWorker(e){this._generator.setBVHWorker(e)}setScene(e,t,n={}){e.updateMatrixWorld(!0),t.updateMatrixWorld();let r=this._generator;if(r.setObjects(e),this._buildAsync)return r.generateAsync(n.onProgress).then(n=>this._updateFromResults(e,t,n));{let n=r.generate();return this._updateFromResults(e,t,n)}}setSceneAsync(...e){this._buildAsync=!0;let t=this.setScene(...e);return this._buildAsync=!1,t}setCamera(e){this.camera=e,this.updateCamera()}updateCamera(){let e=this.camera;e.updateMatrixWorld(),this._pathTracer.setCamera(e),this._lowResPathTracer.setCamera(e),this.reset()}updateMaterials(){let e=this._pathTracer.material,t=this._renderer,n=this._materials,r=this.textureSize,i=Li(n);e.textures.setTextures(t,i,r.x,r.y),e.materials.updateFrom(n,i),this.reset()}updateLights(){let e=this.scene,t=this._renderer,n=this._pathTracer.material,r=Ri(e),i=Ii(r);n.lights.updateFrom(r,i),n.iesProfiles.setTextures(t,i),this.reset()}updateEnvironment(){let e=this.scene,t=this._pathTracer.material;if(this._internalBackground&&=(this._internalBackground.dispose(),null),t.backgroundBlur=e.backgroundBlurriness,t.backgroundIntensity=e.backgroundIntensity??1,t.backgroundRotation.makeRotationFromEuler(e.backgroundRotation).invert(),e.background===null)t.backgroundMap=null,t.backgroundAlpha=0;else if(e.background.isColor){this._colorBackground=this._colorBackground||new Ha(16);let n=this._colorBackground;n.topColor.equals(e.background)||(n.topColor.set(e.background),n.bottomColor.set(e.background),n.update()),t.backgroundMap=n,t.backgroundAlpha=1}else if(e.background.isCubeTexture){if(e.background!==this._previousBackground){let n=new Ga(this._renderer).generate(e.background);this._internalBackground=n,t.backgroundMap=n,t.backgroundAlpha=1}}else t.backgroundMap=e.background,t.backgroundAlpha=1;if(t.environmentIntensity=e.environment===null?0:e.environmentIntensity??1,t.environmentRotation.makeRotationFromEuler(e.environmentRotation).invert(),this._previousEnvironment!==e.environment&&e.environment!==null){if(e.environment.isCubeTexture){let n=new Ga(this._renderer).generate(e.environment);t.envMapInfo.updateFrom(n)}else t.envMapInfo.updateFrom(e.environment)}this._previousEnvironment=e.environment,this._previousBackground=e.background,this.reset()}_updateFromResults(e,t,n){let{materials:r,geometry:i,bvh:a,bvhChanged:o,needsMaterialIndexUpdate:s}=n;this._materials=r;let c=this._pathTracer.material;return o&&(c.bvh.updateFrom(a),c.attributesArray.updateFrom(i.attributes.normal,i.attributes.tangent,i.attributes.uv,i.attributes.color)),s&&c.materialIndexAttribute.updateFrom(i.attributes.materialIndex),this._previousScene=e,this.scene=e,this.camera=t,this.updateCamera(),this.updateMaterials(),this.updateEnvironment(),this.updateLights(),n}renderSample(){let e=this._lowResPathTracer,t=this._pathTracer,n=this._renderer,r=this._clock,i=this._quad;this._updateScale(),this._queueReset&&(t.reset(),e.reset(),this._queueReset=!1,i.material.opacity=0,r.start());let a=r.getDelta()*1e3,o=r.getElapsedTime()*1e3;if(!this.pausePathTracing&&this.enablePathTracing&&this.renderDelay<=o&&!this.isCompiling&&t.update(),t.alpha=t.material.backgroundAlpha!==1||!Ka(n),e.alpha=t.alpha,this.renderToCanvas){let n=this._renderer,r=this.minSamples;if(o>=this.renderDelay&&this.samples>=this.minSamples&&(this.fadeDuration===0?i.material.opacity=1:i.material.opacity=Math.min(i.material.opacity+a/this.fadeDuration,1)),!this.enablePathTracing||this.samples<r||i.material.opacity<1){if(this.dynamicLowRes&&!this.isCompiling){e.samples<1&&(e.material=t.material,e.update());let r=i.material.opacity;i.material.opacity=1-i.material.opacity,i.material.map=e.target.texture,i.render(n),i.material.opacity=r}(!this.dynamicLowRes&&this.rasterizeScene||this.dynamicLowRes&&this.isCompiling)&&this.rasterizeSceneCallback(this.scene,this.camera)}this.enablePathTracing&&i.material.opacity>0&&(i.material.opacity<1&&(i.material.blending=this.dynamicLowRes?2:1),i.material.map=t.target.texture,this.renderToCanvasCallback(t.target,n,i),i.material.blending=0)}}reset(){this._queueReset=!0,this._pathTracer.samples=0}dispose(){this._quad.dispose(),this._quad.material.dispose(),this._pathTracer.dispose()}_updateScale(){if(this.synchronizeRenderSize){this._renderer.getDrawingBufferSize(qa);let e=Math.floor(this.renderScale*qa.x),t=Math.floor(this.renderScale*qa.y);if(this._pathTracer.getSize(qa),qa.x!==e||qa.y!==t){let n=this.lowResScale;this._pathTracer.setSize(e,t),this._lowResPathTracer.setSize(Math.floor(e*n),Math.floor(t*n))}}}getRenderTime(){return this._clock.getElapsedTime()*1e3}},Ya=class extends ei{constructor(e){super({blending:0,transparent:!1,depthWrite:!1,depthTest:!1,defines:{USE_SLIDER:0},uniforms:{sigma:{value:5},threshold:{value:.03},kSigma:{value:1},map:{value:null},opacity:{value:1}},vertexShader:`

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

			`}),this.setValues(e)}};function Xa(e){let t=[];e.traverseVisible(e=>{let n=e;n.isMesh&&Array.isArray(n.material)&&t.push(n)});let n=[],r=()=>{for(let{source:e,geometry:t,materials:r,parts:i,geometries:a}of n){e.geometry=t,e.material=r;for(let t of i)t!==e&&t.removeFromParent();for(let e of a)e.dispose()}n.length=0};try{for(let e of t){let t=e.geometry,r=e.material,i=t.index?.count??t.attributes.position.count,a=[],o=[];n.push({source:e,geometry:t,materials:r,parts:a,geometries:o});for(let n of t.groups){let s=r[n.materialIndex??0];if(!s)throw Error(`[Raytracing] Invalid material ${n.materialIndex} on mesh "${e.name||e.uuid}".`);let c=Math.max(n.start,t.drawRange.start),l=Math.min(n.start+n.count,t.drawRange.start+t.drawRange.count,i);if(l<=c)continue;if(!Number.isInteger(c)||!Number.isInteger(l)||c%3!=0||l%3!=0)throw Error(`[Raytracing] Incomplete triangle group on mesh "${e.name||e.uuid}".`);let u=Array(l-c);for(let e=c;e<l;e++)u[e-c]=t.index?t.index.getX(e):e;let d=t.clone();o.push(d),d.setIndex(u),d.clearGroups(),d.setDrawRange(0,u.length);let f=e.clone(!1);f.geometry=d,f.material=s,a.push(f)}if(a.length===0){let t=e.clone(!1);if(t.geometry=new M,o.push(t.geometry),t.geometry.setAttribute(`position`,new g([],3)),t.material=r[0],!t.material)throw Error(`[Raytracing] Empty material array on mesh "${e.name||e.uuid}".`);a.push(t)}let s=a[0];e.geometry=s.geometry,e.material=s.material,a[0]=e;for(let t of a.slice(1))e.parent.add(t)}return e.updateMatrixWorld(!0),r}catch(e){throw r(),e}}var $=p(),Za=[{id:`720p`,label:`HD 720p (1280×720) - Rapide ⚡`,width:1280,height:720},{id:`fit`,label:`Taille Écran`,width:0,height:0},{id:`1080p`,label:`Full HD (1920×1080)`,width:1920,height:1080},{id:`2k`,label:`2K QHD (2560×1440)`,width:2560,height:1440},{id:`square`,label:`Carré 1:1 (1080×1080)`,width:1080,height:1080},{id:`portrait`,label:`Portrait 9:16 (720×1280)`,width:720,height:1280}];function Qa(e,t=1024,n=512){if(!e||!e.image)return e;let{width:r,height:i,data:a}=e.image;if(!r||!i||!a||r<=t&&i<=n)return e;let o=r/t,s=i/n,c=t*n*4,l=new a.constructor(c);for(let e=0;e<n;e++){let n=Math.min(i-1,Math.floor(e*s));for(let i=0;i<t;i++){let s=Math.min(r-1,Math.floor(i*o)),c=(n*r+s)*4,u=(e*t+i)*4;l[u]=a[c],l[u+1]=a[c+1],l[u+2]=a[c+2],l[u+3]=a[c+3]}}let u=new j(l,t,n,e.format,e.type);return u.minFilter=C,u.magFilter=C,u.wrapS=S,u.wrapT=N,u.mapping=303,u.needsUpdate=!0,u}function $a({gl:e,scene:t,camera:n,onClose:r}){let i=(0,Z.useRef)(null),a=(0,Z.useRef)(null),o=(0,Z.useRef)(null),s=(0,Z.useRef)(null),c=(0,Z.useRef)(null),l=(0,Z.useRef)(null),u=(0,Z.useRef)(new Map),d=(0,Z.useRef)(null),f=(0,Z.useRef)([]),p=(0,Z.useRef)(null),m=(0,Z.useRef)(null),h=(0,Z.useRef)(!0),g=(0,Z.useRef)(!1),_=(0,Z.useRef)(40),v=(0,Z.useRef)(!1),y=(0,Z.useRef)(void 0),S=(0,Z.useRef)(void 0),C=(0,Z.useRef)(null),w=(0,Z.useRef)([]),[T,E]=(0,Z.useState)(`split`),[te,ne]=(0,Z.useState)(null),[re,k]=(0,Z.useState)(`720p`),[ie,A]=(0,Z.useState)(!0),[ae,j]=(0,Z.useState)(!1),[M,N]=(0,Z.useState)(40),[oe,P]=(0,Z.useState)(6),[se,ce]=(0,Z.useState)(1),[le,F]=(0,Z.useState)(!1),[ue,I]=(0,Z.useState)(350),[de,L]=(0,Z.useState)(2.8),[R,me]=(0,Z.useState)(0),[z,ge]=(0,Z.useState)(!1),[_e,ve]=(0,Z.useState)(!0),[ye,be]=(0,Z.useState)(null),[xe,B]=(0,Z.useState)(0),[Se,Ce]=(0,Z.useState)(0),[we,V]=(0,Z.useState)(!1),[H,U]=(0,Z.useState)({x:0,y:0,visible:!1});(0,Z.useEffect)(()=>{let e=e=>{e.key===`Escape`||e.key===`F10`?(e.preventDefault(),r()):(e.key===` `||e.code===`Space`)&&e.target.tagName!==`INPUT`&&e.target.tagName!==`BUTTON`&&(e.preventDefault(),E(e=>e===`split`?`raster`:e===`raster`?`raytracing`:`split`))};return window.addEventListener(`keydown`,e),()=>window.removeEventListener(`keydown`,e)},[r]),(0,Z.useEffect)(()=>{let t=e?.domElement;t&&(t.style.maxHeight=T===`split`?`calc(50vh - 100px)`:`calc(100vh - 180px)`)},[T,e]),(0,Z.useEffect)(()=>{try{let e=new b;e.setFromCamera(new D(0,0),n),e.layers.mask=n.layers.mask;let r=e.intersectObjects(t.children,!0);r.length>0&&I(Math.round(r[0].distance))}catch{}},[t,n]);let W=(0,Z.useCallback)(()=>{let e=f.current,n=new Map;u.current=n,t.updateMatrixWorld(!0);let r=e=>!!(e.layers.mask&1<<18)||!!(e.layers.mask&65536)||e.userData?.itemName&&(e.userData.itemName.startsWith(`Personnage`)||e.userData.itemName.startsWith(`PNJ`))||(e.name||``).toLowerCase().includes(`personnage`)||(e.name||``).toLowerCase().includes(`pnj`)||(e.name||``).toLowerCase().includes(`walker`)||(e.name||``).toLowerCase().includes(`laracroft`);ae?t.traverse(e=>{r(e)&&(e.visible=!0)}):t.traverse(t=>{r(t)&&t.visible&&(t.visible=!1,e.push(t))}),t.traverse(t=>{let i=(t.name||``).toLowerCase();if(t.userData?.isHoverProxy||i.includes(`hoverproxy`)||i.includes(`hitbox`))t.visible&&(t.visible=!1,e.push(t));else if(!r(t)&&!(t.layers.mask&1<<20)){if(i.includes(`skysphere`)||i.includes(`skydome`)||i.includes(`spacebackdrop`)||i.includes(`sunsphere`)||t.userData&&t.userData.isSky)t.traverse(t=>{t.visible&&(t.visible=!1,e.push(t))});else if(t.isPoints||t.isLine||t.isLineSegments||t.isSprite)t.visible&&(t.visible=!1,e.push(t));else if((t.type.includes(`Helper`)||t.isSkeletonHelper||i.includes(`helper`)||i.includes(`gizmo`)||i.includes(`grid`)||i.includes(`landingstrip`)||i.includes(`collision`)||i.includes(`aizone`)||i.includes(`hoveroverlay`)||i.includes(`edgehover`)||i.includes(`measurement`)||i.includes(`skeletonhelper`))&&t.visible)t.traverse(t=>{t.visible&&(t.visible=!1,e.push(t))});else{if(t.isLight){let n=t;if(n.color&&typeof n.color.r==`number`||(n.color=new O(16777215)),t.isDirectionalLight){let e=t;e.updateMatrixWorld(!0),e.target&&e.target.updateMatrixWorld(!0)}n.intensity===0&&n.visible&&(n.visible=!1,e.push(n))}if(t.isMesh){let r=t;if(!(i.includes(`frame`)||i.includes(`cadre`)||t.parent&&((t.parent.name||``).toLowerCase().includes(`frame`)||(t.parent.name||``).toLowerCase().includes(`cadre`)))&&(t.type===`Reflector`||typeof t.getRenderTarget==`function`||t.isReflector||r.material?.name===`ReflectorShader`||r.material?.uniforms&&`textureMatrix`in r.material.uniforms)){n.set(r,r.material),r.material=new ee({color:16777215,roughness:0,metalness:1,side:2});return}if(!r.geometry||!r.geometry.attributes?.position||r.geometry.attributes.position.count===0){r.visible&&(t.visible=!1,e.push(t));return}if(!r.material){n.set(r,r.material),r.material=new ee({color:13421772,roughness:.5});return}let a=!!(r.layers.mask&1<<18),o=Array.isArray(r.material),s=o?r.material:[r.material],c=!1,l=s.map(e=>{if(!e)throw Error(`[Raytracing] Missing material on mesh "${r.name||r.uuid}".`);if(a&&e.side!==2){c=!0;let t=e.clone();return t.side=2,t.depthWrite=!0,t}return e.visible===!1||e.opacity===0?(c=!0,new ee({transparent:!0,opacity:0,roughness:1,depthWrite:!1})):!e.color||typeof e.color.r!=`number`?(c=!0,new ee({color:13684944,roughness:.5,metalness:.1})):e.type===`MeshBasicMaterial`&&!e.isMeshStandardMaterial?(c=!0,new ee({color:e.color,map:e.map??null,transparent:e.transparent,opacity:e.opacity,roughness:.8,metalness:.1})):(`emissive`in e&&(!e.emissive||typeof e.emissive.r!=`number`)&&(e.emissive=new O(0)),`sheenColor`in e&&(!e.sheenColor||typeof e.sheenColor.r!=`number`)&&(e.sheenColor=new O(0)),`specularColor`in e&&(!e.specularColor||typeof e.specularColor.r!=`number`)&&(e.specularColor=new O(16777215)),`attenuationColor`in e&&(!e.attenuationColor||typeof e.attenuationColor.r!=`number`)&&(e.attenuationColor=new O(16777215)),e)});c&&(n.set(r,r.material),r.material=o?l:l[0])}}}}),d.current=Xa(t);let i=new O(16774624),a=.6;t.traverse(e=>{if(e.isAmbientLight){let t=e;i=t.color,a=t.intensity}});let o=new pe(i,a*2.2);o.position.set(300,500,300),o.target.position.set(150,0,150),t.add(o),t.add(o.target),o.updateMatrixWorld(!0),o.target.updateMatrixWorld(!0),w.current.push(o,o.target),y.current=t.background,S.current=t.environment;let s=he()||(t.environment&&t.environment.isDataTexture?t.environment:null);if(s){t.background=s;let e=Qa(s,1024,512);e!==s&&(C.current=e),t.environment=e,`backgroundIntensity`in t&&`environmentIntensity`in t&&(t.backgroundIntensity=t.environmentIntensity)}f.current=e,u.current=n},[t,ae]),G=(0,Z.useCallback)(()=>{d.current?.(),d.current=null,w.current.forEach(e=>{t.remove(e)}),w.current=[],f.current.forEach(e=>{e.visible=!0}),f.current=[],u.current.forEach((e,t)=>{let n=Array.isArray(e)?e:[e],r=Array.isArray(t.material)?t.material:[t.material];for(let e of r)n.includes(e)||e.dispose();t.material=e}),u.current.clear(),y.current!==void 0&&(t.background=y.current,y.current=void 0),S.current!==void 0&&(t.environment=S.current,S.current=void 0),C.current&&=(C.current.dispose(),null),t.traverse(e=>{if(e.isMesh){let t=e.geometry;if(t&&t.boundsTree){try{t.disposeBoundsTree?.()}catch{}delete t.boundsTree}}})},[t]),Te=(0,Z.useCallback)(()=>{if(!i.current)return{width:1280,height:720};let e=i.current.getBoundingClientRect(),t=Math.max(300,e.width-40),n=Math.max(200,e.height-40),r=Za.find(e=>e.id===re);return!r||r.id===`fit`?{width:Math.round(t),height:Math.round(n)}:{width:r.width,height:r.height,realWidth:r.width,realHeight:r.height}},[re]);(0,Z.useEffect)(()=>{let r=e.domElement;if(!r)return;let i=r.parentElement,u={width:r.style.width,height:r.style.height,position:r.style.position,top:r.style.top,left:r.style.left,display:r.style.display,maxWidth:r.style.maxWidth,maxHeight:r.style.maxHeight,objectFit:r.style.objectFit,cursor:r.style.cursor,pointerEvents:r.style.pointerEvents},d=new D;e.getSize(d);let y=e.getPixelRatio(),b=e.toneMappingExposure;a.current&&i&&(a.current.insertBefore(r,a.current.firstChild),r.style.display=`block`,r.style.position=`relative`,r.style.maxWidth=`100%`,r.style.maxHeight=`calc(100vh - 180px)`,r.style.objectFit=`contain`,r.style.cursor=le?`crosshair`:`default`);let{width:S,height:C}=Te();e.setPixelRatio(1),e.setSize(S,C,!1),e.toneMapping=6,e.toneMappingExposure=se,s.current=e;let w=n.isOrthographicCamera===!0,T;if(w){let e=n,t=e.top-e.bottom,r=(e.top+e.bottom)/2,i=(e.right+e.left)/2,a=S/C,o=t/2,s=o*a,c=new fe(i-s,i+s,r+o,r-o,e.near,e.far);c.position.copy(e.position),c.quaternion.copy(e.quaternion),c.scale.copy(e.scale),c.zoom=e.zoom,c.updateProjectionMatrix(),c.updateMatrixWorld(!0),T=c}else{let e=n,t=new li(e.fov||50,S/C,e.near,e.far);t.position.copy(e.position),t.quaternion.copy(e.quaternion),t.scale.copy(e.scale),t.zoom=e.zoom||1,t.focusDistance=ue,t.fStop=de,t.bokehSize=le?t.getFocalLength()/t.fStop:0,t.updateProjectionMatrix(),t.updateMatrixWorld(!0),T=t}T.layers.mask=n.layers.mask,T.layers.enable(28),T.layers.enable(11),T.layers.enable(12),T.layers.enable(21),T.layers.enable(22),ae?(T.layers.enable(18),T.layers.enable(16)):(T.layers.disable(18),T.layers.disable(16)),T.layers.enable(17),T.layers.enable(20),T.layers.enable(23),c.current=T,ae||t.traverse(e=>{(e.layers.mask&1<<18||e.layers.mask&65536||e.userData?.itemName&&(e.userData.itemName.startsWith(`Personnage`)||e.userData.itemName.startsWith(`PNJ`))||(e.name||``).toLowerCase().includes(`personnage`)||(e.name||``).toLowerCase().includes(`pnj`)||(e.name||``).toLowerCase().includes(`walker`))&&e.visible&&(e.visible=!1,f.current.push(e))}),t.traverse(e=>{e.userData.isCameraViewMarker&&e.traverse(e=>{e.visible&&(e.visible=!1,f.current.push(e))})}),t.updateMatrixWorld(!0);try{let n=document.createElement(`canvas`),r=new x({canvas:n,antialias:!0,alpha:!0,preserveDrawingBuffer:!0});r.setPixelRatio(1),r.setSize(S,C,!1),r.outputColorSpace=e.outputColorSpace,r.toneMapping=e.toneMapping,r.toneMappingExposure=e.toneMappingExposure,r.shadowMap.enabled=e.shadowMap.enabled,r.shadowMap.type=e.shadowMap.type,r.render(t,T),ne(n.toDataURL(`image/png`)),r.dispose()}catch(e){console.warn(`[Raytracing] Impossible de capturer le snapshot 3D standard:`,e),ne(null)}ve(!0),be(null),me(0),B(0);let E=new Ja(e);E.bounces=oe,E.transmissiveBounces=oe,E.filterGlossyFactor=.5,E.renderToCanvas=!0,E.fadeDuration=0,E.minSamples=1,E.renderDelay=0,E.dynamicLowRes=!1;let ee=Math.max(4,Math.ceil(S/200)),te=Math.max(4,Math.ceil(C/150));E.tiles.set(ee,te),E.textureSize.set(512,512);let O=new Ya;O.uniforms.sigma.value=3.5,O.uniforms.threshold.value=.12,O.uniforms.kSigma.value=1;let re=new $r(O);m.current=O,p.current=re;let k=0;E.renderToCanvasCallback=(e,t,n)=>{let r=performance.now();(r-k>=200||o.current&&o.current.samples>=_.current)&&(k=r,n.render(t))};let ie=!1,A=!1,j=null,M=null,N=e.getContext?.(),P=null,ce=performance.now(),F=performance.now(),I=0,L=performance.now(),pe=0,R=new Blob([`let timer = null; self.onmessage = e => { if (e.data.action === "start") { clearInterval(timer); timer = setInterval(() => postMessage(0), e.data.ms || 25); } else { clearInterval(timer); } };`],{type:`application/javascript`}),z=new Worker(URL.createObjectURL(R)),he=!1,_e=(e=0)=>{document.hidden?he||=(z.postMessage({action:`start`,ms:Math.max(10,e||25)}),!0):(he&&=(z.postMessage({action:`stop`}),!1),e>0?j=setTimeout(()=>{M=requestAnimationFrame(xe)},e):M=requestAnimationFrame(xe))};z.onmessage=()=>{document.hidden&&A&&xe()};let ye=()=>{A&&(!document.hidden&&he?(z.postMessage({action:`stop`}),he=!1,M=requestAnimationFrame(xe)):document.hidden&&!he&&_e(25))};document.addEventListener(`visibilitychange`,ye);let xe=()=>{if(!o.current||g.current||ie){A=!1,he&&=(z.postMessage({action:`stop`}),!1);return}let e=o.current.samples,t=_.current;if(e<t){let t=performance.now();if(P&&N?.clientWaitSync){if(N.clientWaitSync(P,0,0)===N.TIMEOUT_EXPIRED){_e(15);return}N?.deleteSync&&N.deleteSync(P),P=null,ce=performance.now()}if(t-ce<25){let e=Math.max(5,25-(t-ce));_e(e);return}v.current=!1;try{o.current.renderSample(),N?.fenceSync?(P=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0),N.flush()):ce=performance.now(),I++}catch(e){console.error(`[Raytracing] Erreur renderSample:`,e),be(e?.message||`Erreur pendant le calcul du raytracing.`),ge(!0),A=!1,he&&=(z.postMessage({action:`stop`}),!1);return}t-pe>=120&&(me(e),pe=t),t-F>=1e3&&(Ce(Math.round(I*1e3/(t-F))),I=0,F=t,B(Math.round((t-L)/1e3))),_e(25)}else P&&N?.deleteSync&&(N.deleteSync(P),P=null),he&&=(z.postMessage({action:`stop`}),!1),v.current||=(h.current&&m.current&&p.current&&s.current&&(m.current.uniforms.map.value=o.current.target.texture,s.current.setRenderTarget(null),p.current.render(s.current)),!0),me(t),Ce(0),A=!1},Se=()=>{ie||g.current||A||o.current&&o.current.samples<_.current&&(A=!0,_e(0))};l.current=Se;let we=setTimeout(()=>{if(!ie)try{W(),console.log(`[Raytracing] Construction du BVH pour la scène...`),E.setScene(t,T),o.current=E,ve(!1),console.log(`[Raytracing] Scène prête ! Démarrage de l'accumulation.`),Se()}catch(e){G(),console.error(`[Raytracing] Erreur initialisation WebGLPathTracer:`,e),be(e?.message||`Échec de la génération du maillage BVH.`),ve(!1)}},60);return()=>{ie=!0,document.removeEventListener(`visibilitychange`,ye),z.terminate(),clearTimeout(we),j&&clearTimeout(j),M&&cancelAnimationFrame(M),P&&N?.deleteSync&&(N.deleteSync(P),P=null),l.current=null,G(),re.dispose(),O.dispose();let t=E._pathTracer,n=()=>{try{t?.material&&(t.material.textures?.dispose?.(),t.material.envMapInfo?.dispose?.(),t.material.dispose()),E.dispose()}catch(e){console.error(`[Raytracing] Erreur de libération des ressources:`,e)}},a=t?._compilePromise;a?a.then(n,e=>{console.error(`[Raytracing] Erreur de compilation du shader:`,e),n()}):n(),p.current=null,m.current=null,o.current=null,s.current=null,i&&(i.appendChild(r),r.style.width=u.width,r.style.height=u.height,r.style.position=u.position,r.style.top=u.top,r.style.left=u.left,r.style.display=u.display,r.style.maxWidth=u.maxWidth,r.style.maxHeight=u.maxHeight,r.style.objectFit=u.objectFit,r.style.cursor=u.cursor,r.style.pointerEvents=u.pointerEvents),e.setPixelRatio(y),e.setSize(d.x,d.y),e.toneMappingExposure=b}},[e,t,n,re,ae,W,G,Te]),(0,Z.useEffect)(()=>{if(h.current=ie,o.current&&s.current&&o.current.samples>0){let e=o.current,t=s.current;ie&&m.current&&p.current?(m.current.uniforms.map.value=e.target.texture,t.setRenderTarget(null),p.current.render(t)):(t.setRenderTarget(null),e._quad.material.map=e.target.texture,e._quad.render(t))}},[ie]),(0,Z.useEffect)(()=>{g.current=z,z?h.current&&m.current&&p.current&&s.current&&o.current&&(m.current.uniforms.map.value=o.current.target.texture,s.current.setRenderTarget(null),p.current.render(s.current)):l.current?.()},[z]),(0,Z.useEffect)(()=>{_.current=M,l.current?.()},[M]),(0,Z.useEffect)(()=>{if(c.current&&o.current&&typeof c.current.getFocalLength==`function`){let e=c.current;e.focusDistance=ue,e.fStop=de,e.bokehSize=le?e.getFocalLength()/e.fStop:0,e.updateProjectionMatrix(),e.updateMatrixWorld(),o.current.updateCamera(),v.current=!1,me(0),l.current?.()}},[le,ue,de]),(0,Z.useEffect)(()=>{s.current&&(v.current=!1,s.current.toneMappingExposure=se,o.current?.reset(),me(0),l.current?.())},[se]),(0,Z.useEffect)(()=>{o.current&&(v.current=!1,o.current.bounces=oe,o.current.transmissiveBounces=oe,o.current.reset(),me(0),l.current?.())},[oe]);let K=r=>{let i=e.domElement;if(!i)return;let a=i.getBoundingClientRect(),o=(r.clientX-a.left)/a.width*2-1,s=-((r.clientY-a.top)/a.height*2-1),l=new b,u=c.current||n;l.setFromCamera(new D(o,s),u),c.current&&(l.layers.mask=c.current.layers.mask);let d=l.intersectObjects(t.children,!0);if(d.length>0){let e=Math.round(d[0].distance);I(e),F(!0),U({x:r.clientX-a.left,y:r.clientY-a.top,visible:!0}),setTimeout(()=>{U(e=>({...e,visible:!1}))},700)}},Ee=t=>{let n=e.domElement;if(n){if(h.current&&m.current&&p.current&&s.current&&o.current&&(m.current.uniforms.map.value=o.current.target.texture,s.current.setRenderTarget(null),p.current.render(s.current)),T===`raster`&&te){let e=new Image;e.onload=()=>{let r=document.createElement(`canvas`);r.width=n.width,r.height=n.height;let i=r.getContext(`2d`);i&&i.drawImage(e,0,0,r.width,r.height),r.toBlob(t,`image/png`)},e.src=te}else if(T===`split`&&te){let e=new Image;e.onload=()=>{let r=document.createElement(`canvas`);r.width=n.width,r.height=n.height*2;let i=r.getContext(`2d`);i&&(i.drawImage(e,0,0,r.width,n.height),i.fillStyle=`#ffffff`,i.fillRect(0,n.height-2,r.width,4),i.drawImage(n,0,n.height,r.width,n.height)),r.toBlob(t,`image/png`)},e.src=te}else n.toBlob(t,`image/png`)}},De=()=>{Ee(e=>{if(!e)return;let t=URL.createObjectURL(e),n=new Date().toISOString().replace(/[:.]/g,`-`).slice(0,19),r=`${T===`raster`?`photo-3d-standard`:T===`split`?`photo-comparatif`:`photo-raytracing`}-${n}.png`,i=document.createElement(`a`);i.href=t,i.download=r,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(t)})},Oe=async()=>{Ee(async e=>{if(e)try{await navigator.clipboard.write([new ClipboardItem({"image/png":e})]),V(!0),setTimeout(()=>V(!1),2500)}catch(e){console.warn(`Presse-papier non supporté pour les blobs:`,e)}})},ke=()=>{v.current=!1,o.current?.reset(),me(0),B(0),l.current?.()},Ae=e=>{if(A(e),!o.current||!s.current||o.current.samples===0)return;let t=o.current,n=s.current;e&&m.current&&p.current?(m.current.uniforms.map.value=t.target.texture,n.setRenderTarget(null),p.current.render(n)):t._quad?.render(n)},je=Math.min(100,Math.round(R/M*100)),q=R>=M;return(0,$.jsxs)(`div`,{className:`position-fixed top-0 start-0 w-100 h-100 d-flex flex-column text-white`,style:{zIndex:1e4,backgroundColor:`rgba(5, 7, 15, 0.88)`,backdropFilter:`blur(16px)`,WebkitBackdropFilter:`blur(16px)`},children:[(0,$.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between px-3 py-2 border-bottom`,style:{borderColor:`rgba(255, 255, 255, 0.12)`,background:`rgba(0, 0, 0, 0.4)`},children:[(0,$.jsxs)(`div`,{className:`d-flex align-items-center gap-2`,children:[(0,$.jsx)(`span`,{className:`fs-5`,children:`📸`}),(0,$.jsxs)(`div`,{children:[(0,$.jsxs)(`h6`,{className:`mb-0 fw-bold text-uppercase d-flex align-items-center gap-2`,style:{letterSpacing:`0.08em`},children:[`Mode Photo Raytracing Ultra-Réaliste`,(0,$.jsx)(`span`,{className:`badge bg-warning text-dark font-monospace fw-bold`,style:{fontSize:`10px`},children:`GPU Path Tracing`})]}),(0,$.jsx)(`small`,{className:`text-white-50`,style:{fontSize:`11px`},children:`Illumination globale physique • Rebonds de lumière • Profondeur de champ Bokeh`})]})]}),(0,$.jsxs)(`div`,{className:`btn-group btn-group-sm shadow-sm`,role:`group`,children:[(0,$.jsx)(`button`,{type:`button`,onClick:()=>E(`raster`),className:`btn ${T===`raster`?`btn-primary fw-bold`:`btn-outline-light text-white-50`}`,style:{fontSize:`11px`},title:`Afficher le rendu 3D standard temps réel (Touche Espace pour basculer)`,children:`🎮 3D Standard`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>E(`split`),className:`btn ${T===`split`?`btn-warning text-dark fw-bold`:`btn-outline-light text-white-50`}`,style:{fontSize:`11px`},title:`Comparer les 2 rendus l'un au-dessus de l'autre (Touche Espace)`,children:`⬍ Comparer (2 Vues)`}),(0,$.jsx)(`button`,{type:`button`,onClick:()=>E(`raytracing`),className:`btn ${T===`raytracing`?`btn-info text-dark fw-bold`:`btn-outline-light text-white-50`}`,style:{fontSize:`11px`},title:`Afficher uniquement le rendu Raytracing physique (Touche Espace)`,children:`📸 Raytracing`})]}),(0,$.jsxs)(`div`,{className:`d-flex align-items-center gap-2`,children:[(0,$.jsxs)(`button`,{onClick:ke,className:`btn btn-sm btn-outline-light d-flex align-items-center gap-1.5`,title:`Réinitialiser l'accumulation des rayons`,children:[`🔄 `,(0,$.jsx)(`span`,{children:`Relancer`})]}),(0,$.jsxs)(`button`,{onClick:r,className:`btn btn-sm btn-danger px-3 fw-bold d-flex align-items-center gap-1`,title:`Fermer (Échap)`,children:[`✕ `,(0,$.jsx)(`span`,{children:`Quitter`})]})]})]}),(0,$.jsxs)(`div`,{className:`d-flex flex-grow-1 overflow-hidden`,children:[(0,$.jsxs)(`div`,{ref:i,className:`flex-grow-1 d-flex flex-column align-items-center ${T===`split`?`justify-content-start overflow-y-auto p-3 gap-3`:`justify-content-center p-3 overflow-hidden`} position-relative`,style:{background:`radial-gradient(circle at center, #111528 0%, #05070f 100%)`},children:[te&&T!==`raytracing`&&(0,$.jsxs)(`div`,{className:`position-relative shadow-lg border border-primary border-opacity-50 rounded overflow-hidden bg-black flex-shrink-0`,style:{userSelect:`none`,maxWidth:`100%`},children:[(0,$.jsxs)(`div`,{className:`position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-primary border-opacity-50 text-white pointer-events-none`,style:{fontSize:`11px`,zIndex:6},children:[`🎮 `,T===`split`?`1. Rendu 3D Standard`:`Rendu 3D Standard`]}),(0,$.jsx)(`img`,{src:te,alt:`Rendu 3D Standard`,style:{maxWidth:`100%`,maxHeight:T===`split`?`calc(50vh - 100px)`:`calc(100vh - 180px)`,objectFit:`contain`,display:`block`}})]}),(0,$.jsxs)(`div`,{ref:a,className:`position-relative shadow-lg border border-warning border-opacity-50 rounded overflow-hidden bg-black flex-shrink-0 ${T===`raster`?`d-none`:``}`,style:{userSelect:`none`,cursor:le?`crosshair`:`default`,maxWidth:`100%`},onClick:K,title:le?`Cliquez sur n'importe quel point pour ajuster l'autofocus 🎯`:void 0,children:[T===`split`&&(0,$.jsx)(`div`,{className:`position-absolute top-0 start-0 m-2 px-2 py-1 badge bg-dark bg-opacity-75 border border-warning border-opacity-50 text-warning pointer-events-none`,style:{fontSize:`11px`,zIndex:6},children:`📸 2. Rendu Raytracing`}),_e&&(0,$.jsxs)(`div`,{className:`position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center`,style:{background:`rgba(5, 7, 15, 0.94)`,zIndex:10},children:[(0,$.jsx)(`div`,{className:`spinner-border text-warning mb-3`,role:`status`,style:{width:`3rem`,height:`3rem`}}),(0,$.jsx)(`h5`,{className:`fw-bold`,children:`Génération du maillage BVH spatial…`}),(0,$.jsx)(`p`,{className:`text-white-50 small mb-0`,children:`Préparation des géométries et des textures physiques`})]}),ye&&(0,$.jsxs)(`div`,{className:`position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center p-4 text-center`,style:{background:`rgba(25, 5, 5, 0.95)`,zIndex:11},children:[(0,$.jsx)(`div`,{className:`fs-1 mb-2`,children:`⚠️`}),(0,$.jsx)(`h5`,{className:`fw-bold text-danger`,children:`Erreur Raytracing`}),(0,$.jsx)(`p`,{className:`text-white-50 small mb-3`,children:ye}),(0,$.jsx)(`button`,{onClick:ke,className:`btn btn-warning btn-sm`,children:`Réessayer`})]}),H.visible&&(0,$.jsx)(`div`,{className:`position-absolute border border-warning rounded-circle`,style:{left:H.x-20,top:H.y-20,width:40,height:40,pointerEvents:`none`,animation:`pulse 0.6s ease-out`,boxShadow:`0 0 10px rgba(255, 193, 7, 0.8)`,zIndex:10}}),!_e&&!ye&&(0,$.jsxs)(`div`,{className:`position-absolute bottom-0 start-0 w-100 p-2 d-flex align-items-center justify-content-between text-white`,style:{background:`linear-gradient(to top, rgba(0,0,0,0.85), transparent)`,fontSize:`12px`,pointerEvents:`none`,zIndex:10},children:[(0,$.jsxs)(`div`,{className:`d-flex align-items-center gap-2`,children:[(0,$.jsx)(`span`,{className:`badge ${q?`bg-success`:`bg-primary`}`,children:q?`✓ Rendu terminé`:`⚡ Calcul en cours…`}),(0,$.jsxs)(`span`,{children:[`Échantillon : `,(0,$.jsx)(`strong`,{children:R}),` / `,M,` (`,je,`%)`]})]}),(0,$.jsxs)(`div`,{className:`d-flex align-items-center gap-3 text-white-50`,children:[(0,$.jsxs)(`span`,{children:[`Temps : `,xe,`s`]}),(0,$.jsxs)(`span`,{children:[`Cadence : `,Se,` éch/s`]})]})]})]})]}),(0,$.jsxs)(`div`,{className:`border-start p-3 d-flex flex-column gap-3 overflow-auto`,style:{width:`320px`,borderColor:`rgba(255, 255, 255, 0.12)`,background:`rgba(10, 14, 25, 0.75)`},children:[(0,$.jsxs)(`div`,{className:`card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded`,children:[(0,$.jsxs)(`h6`,{className:`fw-bold mb-2 text-warning d-flex align-items-center gap-1.5`,style:{fontSize:`12px`},children:[(0,$.jsx)(`span`,{children:`⚙️`}),` Qualité du Raytracing`]}),(0,$.jsxs)(`div`,{className:`mb-2`,children:[(0,$.jsxs)(`label`,{className:`form-label d-flex justify-content-between mb-1`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`Échantillons cibles (Samples)`}),(0,$.jsx)(`span`,{className:`fw-bold text-info`,children:M})]}),(0,$.jsx)(`div`,{className:`btn-group btn-group-sm w-100 mb-2`,children:[40,100,250,500].map(e=>(0,$.jsx)(`button`,{type:`button`,onClick:()=>{N(e),R>=e&&ke()},className:`btn ${M===e?`btn-primary`:`btn-outline-secondary text-white`}`,style:{fontSize:`10px`},children:e},e))})]}),(0,$.jsxs)(`div`,{className:`mb-2`,children:[(0,$.jsxs)(`label`,{className:`form-label d-flex justify-content-between mb-1`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`Rebonds de lumière (Bounces)`}),(0,$.jsx)(`span`,{className:`fw-bold text-info`,children:oe})]}),(0,$.jsx)(`input`,{type:`range`,className:`form-range form-range-sm`,min:`1`,max:`12`,step:`1`,value:oe,onChange:e=>P(parseInt(e.target.value,10))})]}),(0,$.jsxs)(`div`,{className:`mb-1`,children:[(0,$.jsxs)(`label`,{className:`form-label d-flex justify-content-between mb-1`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`Exposition lumineuse`}),(0,$.jsx)(`span`,{className:`fw-bold text-info`,children:se.toFixed(2)})]}),(0,$.jsx)(`input`,{type:`range`,className:`form-range form-range-sm`,min:`0.4`,max:`2.2`,step:`0.05`,value:se,onChange:e=>ce(parseFloat(e.target.value))})]}),(0,$.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10`,children:[(0,$.jsxs)(`label`,{className:`form-check-label d-flex align-items-center gap-1.5 mb-0`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`✨`}),(0,$.jsx)(`span`,{children:`Débruiteur Intelligent`})]}),(0,$.jsx)(`div`,{className:`form-check form-switch mb-0`,children:(0,$.jsx)(`input`,{className:`form-check-input`,type:`checkbox`,role:`switch`,checked:ie,onChange:e=>Ae(e.target.checked)})})]}),(0,$.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between pt-2 mt-2 border-top border-white border-opacity-10`,children:[(0,$.jsxs)(`label`,{className:`form-check-label d-flex align-items-center gap-1.5 mb-0`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`👤`}),(0,$.jsx)(`span`,{children:`Calque Personnages`})]}),(0,$.jsx)(`div`,{className:`form-check form-switch mb-0`,children:(0,$.jsx)(`input`,{className:`form-check-input`,type:`checkbox`,role:`switch`,checked:ae,onChange:e=>j(e.target.checked)})})]})]}),(0,$.jsxs)(`div`,{className:`card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded`,children:[(0,$.jsxs)(`div`,{className:`d-flex align-items-center justify-content-between mb-2`,children:[(0,$.jsxs)(`h6`,{className:`fw-bold mb-0 text-warning d-flex align-items-center gap-1.5`,style:{fontSize:`12px`},children:[(0,$.jsx)(`span`,{children:`🎯`}),` Flou Bokeh / Profondeur`]}),(0,$.jsx)(`div`,{className:`form-check form-switch mb-0`,children:(0,$.jsx)(`input`,{className:`form-check-input`,type:`checkbox`,role:`switch`,checked:le&&!n.isOrthographicCamera,disabled:n.isOrthographicCamera,onChange:e=>F(e.target.checked)})})]}),n.isOrthographicCamera?(0,$.jsx)(`small`,{className:`text-white-50`,style:{fontSize:`10px`},children:`Indisponible en vue isométrique / orthographique (l'effet Bokeh optique nécessite une projection perspective).`}):le?(0,$.jsxs)($.Fragment,{children:[(0,$.jsxs)(`p`,{className:`text-white-50 mb-2`,style:{fontSize:`10px`},children:[`💡 `,(0,$.jsx)(`em`,{children:`Cliquez sur le modèle ou un objet dans l'image pour régler l'autofocus instantanément !`})]}),(0,$.jsxs)(`div`,{className:`mb-2`,children:[(0,$.jsxs)(`label`,{className:`form-label d-flex justify-content-between mb-1`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`Distance de mise au point`}),(0,$.jsxs)(`span`,{className:`fw-bold text-info`,children:[ue,` cm`]})]}),(0,$.jsx)(`input`,{type:`range`,className:`form-range form-range-sm`,min:`50`,max:`1500`,step:`5`,value:ue,onChange:e=>I(parseInt(e.target.value,10))})]}),(0,$.jsxs)(`div`,{className:`mb-1`,children:[(0,$.jsxs)(`label`,{className:`form-label d-flex justify-content-between mb-1`,style:{fontSize:`11px`},children:[(0,$.jsx)(`span`,{children:`Ouverture optique (f-stop)`}),(0,$.jsxs)(`span`,{className:`fw-bold text-info`,children:[`f/`,de]})]}),(0,$.jsx)(`div`,{className:`btn-group btn-group-sm w-100`,children:[1.4,2,2.8,5.6].map(e=>(0,$.jsxs)(`button`,{type:`button`,onClick:()=>L(e),className:`btn ${de===e?`btn-warning text-dark fw-bold`:`btn-outline-secondary text-white`}`,style:{fontSize:`10px`},children:[`f/`,e]},e))})]})]}):(0,$.jsx)(`small`,{className:`text-white-50`,style:{fontSize:`10px`},children:`Activez l'effet pour créer un arrière-plan flou d'appareil photo professionnel reflex.`})]}),(0,$.jsxs)(`div`,{className:`card bg-black bg-opacity-25 border border-white border-opacity-10 p-2.5 rounded`,children:[(0,$.jsxs)(`h6`,{className:`fw-bold mb-2 text-warning d-flex align-items-center gap-1.5`,style:{fontSize:`12px`},children:[(0,$.jsx)(`span`,{children:`📐`}),` Format & Résolution`]}),(0,$.jsx)(`select`,{className:`form-select form-select-sm bg-dark text-white border-secondary`,style:{fontSize:`11px`},value:re,onChange:e=>k(e.target.value),children:Za.map(e=>(0,$.jsx)(`option`,{value:e.id,children:e.label},e.id))})]}),(0,$.jsxs)(`div`,{className:`mt-auto d-flex flex-column gap-2 pt-2 border-top border-secondary border-opacity-25`,children:[(0,$.jsxs)(`button`,{onClick:De,className:`btn btn-success fw-bold py-2 shadow d-flex align-items-center justify-content-center gap-2`,title:`Télécharger l'image PNG`,children:[(0,$.jsx)(`span`,{children:`💾`}),(0,$.jsx)(`span`,{children:`Télécharger la photo PNG`})]}),(0,$.jsxs)(`button`,{onClick:Oe,className:`btn btn-sm ${we?`btn-info text-dark`:`btn-outline-light`} py-1.5 d-flex align-items-center justify-content-center gap-2`,title:`Copier l'image dans le presse-papier`,children:[(0,$.jsx)(`span`,{children:we?`✓`:`📋`}),(0,$.jsx)(`span`,{children:we?`Copié dans le presse-papier !`:`Copier l'image`})]}),(0,$.jsx)(`button`,{onClick:()=>ge(e=>!e),className:`btn btn-sm btn-outline-secondary text-white py-1`,children:z?`▶ Reprendre le rendu`:`⏸ Suspendre le rendu`})]})]})]}),(0,$.jsxs)(`div`,{className:`px-3 py-1.5 border-top d-flex align-items-center justify-content-between`,style:{borderColor:`rgba(255, 255, 255, 0.12)`,background:`rgba(0, 0, 0, 0.5)`,fontSize:`11px`},children:[(0,$.jsxs)(`div`,{className:`d-flex align-items-center gap-3`,children:[(0,$.jsxs)(`span`,{children:[(0,$.jsx)(`kbd`,{className:`bg-secondary text-white px-1 rounded`,children:`Espace`}),` Alterner 3D / Comparer (2 vues) / Raytracing`]}),(0,$.jsx)(`span`,{className:`text-white-50`,children:`•`}),(0,$.jsxs)(`span`,{children:[(0,$.jsx)(`kbd`,{className:`bg-secondary text-white px-1 rounded`,children:`F10`}),` Basculer mode photo`]}),(0,$.jsx)(`span`,{className:`text-white-50`,children:`•`}),(0,$.jsxs)(`span`,{className:`text-white-50`,children:[`Fermer avec `,(0,$.jsx)(`kbd`,{className:`bg-secondary text-white px-1 rounded`,children:`Échap`})]})]}),(0,$.jsxs)(`div`,{className:`text-white-50`,children:[`Moteur : `,(0,$.jsx)(`strong`,{children:`three-gpu-pathtracer`}),` (GGX / PBR / MIS / BVH)`]})]})]})}export{$a as RaytracingPhotoModal};