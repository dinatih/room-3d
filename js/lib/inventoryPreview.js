import * as he from "three";
import { TrianglesDrawMode as X1, TriangleFanDrawMode as Vc, TriangleStripDrawMode as hg, Loader as mg, LoaderUtils as Vo, FileLoader as $s, MeshPhysicalMaterial as In, Vector2 as Ft, Color as Pr, LinearSRGBColorSpace as zn, SRGBColorSpace as yr, SpotLight as Y1, PointLight as Z1, DirectionalLight as J1, Matrix4 as bs, Vector3 as at, Quaternion as eu, InstancedMesh as q1, InstancedBufferAttribute as $1, Object3D as gg, TextureLoader as b1, ImageBitmapLoader as eS, BufferAttribute as Go, InterleavedBuffer as tS, InterleavedBufferAttribute as nS, LinearMipmapLinearFilter as yg, NearestMipmapLinearFilter as rS, LinearMipmapNearestFilter as iS, NearestMipmapNearestFilter as oS, LinearFilter as Gc, NearestFilter as vg, RepeatWrapping as Kc, MirroredRepeatWrapping as lS, ClampToEdgeWrapping as sS, PointsMaterial as uS, Material as ec, LineBasicMaterial as aS, MeshStandardMaterial as Sg, DoubleSide as cS, MeshBasicMaterial as Fo, PropertyBinding as fS, BufferGeometry as wg, SkinnedMesh as dS, Mesh as pS, LineSegments as hS, Line as mS, LineLoop as gS, Points as yS, Group as tc, PerspectiveCamera as vS, MathUtils as _g, OrthographicCamera as SS, Skeleton as wS, AnimationClip as _S, Bone as ES, InterpolateDiscrete as xS, InterpolateLinear as Eg, Texture as Nh, VectorKeyframeTrack as Mh, NumberKeyframeTrack as zh, QuaternionKeyframeTrack as Ih, ColorManagement as Qc, FrontSide as kS, Interpolant as TS, Box3 as PS, Sphere as CS, Controls as RS, MOUSE as Fi, TOUCH as ki, Spherical as Oh, Ray as AS, Plane as LS } from "three";
function NS(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var xg = { exports: {} }, Cu = {}, kg = { exports: {} }, ue = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var yl = Symbol.for("react.element"), MS = Symbol.for("react.portal"), zS = Symbol.for("react.fragment"), IS = Symbol.for("react.strict_mode"), OS = Symbol.for("react.profiler"), DS = Symbol.for("react.provider"), jS = Symbol.for("react.context"), FS = Symbol.for("react.forward_ref"), US = Symbol.for("react.suspense"), HS = Symbol.for("react.memo"), BS = Symbol.for("react.lazy"), Dh = Symbol.iterator;
function WS(e) {
  return e === null || typeof e != "object" ? null : (e = Dh && e[Dh] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Tg = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, Pg = Object.assign, Cg = {};
function eo(e, t, n) {
  this.props = e, this.context = t, this.refs = Cg, this.updater = n || Tg;
}
eo.prototype.isReactComponent = {};
eo.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
eo.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Rg() {
}
Rg.prototype = eo.prototype;
function Kf(e, t, n) {
  this.props = e, this.context = t, this.refs = Cg, this.updater = n || Tg;
}
var Qf = Kf.prototype = new Rg();
Qf.constructor = Kf;
Pg(Qf, eo.prototype);
Qf.isPureReactComponent = !0;
var jh = Array.isArray, Ag = Object.prototype.hasOwnProperty, Xf = { current: null }, Lg = { key: !0, ref: !0, __self: !0, __source: !0 };
function Ng(e, t, n) {
  var o, l = {}, s = null, a = null;
  if (t != null) for (o in t.ref !== void 0 && (a = t.ref), t.key !== void 0 && (s = "" + t.key), t) Ag.call(t, o) && !Lg.hasOwnProperty(o) && (l[o] = t[o]);
  var d = arguments.length - 2;
  if (d === 1) l.children = n;
  else if (1 < d) {
    for (var p = Array(d), m = 0; m < d; m++) p[m] = arguments[m + 2];
    l.children = p;
  }
  if (e && e.defaultProps) for (o in d = e.defaultProps, d) l[o] === void 0 && (l[o] = d[o]);
  return { $$typeof: yl, type: e, key: s, ref: a, props: l, _owner: Xf.current };
}
function VS(e, t) {
  return { $$typeof: yl, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Yf(e) {
  return typeof e == "object" && e !== null && e.$$typeof === yl;
}
function GS(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var Fh = /\/+/g;
function nc(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? GS("" + e.key) : t.toString(36);
}
function Us(e, t, n, o, l) {
  var s = typeof e;
  (s === "undefined" || s === "boolean") && (e = null);
  var a = !1;
  if (e === null) a = !0;
  else switch (s) {
    case "string":
    case "number":
      a = !0;
      break;
    case "object":
      switch (e.$$typeof) {
        case yl:
        case MS:
          a = !0;
      }
  }
  if (a) return a = e, l = l(a), e = o === "" ? "." + nc(a, 0) : o, jh(l) ? (n = "", e != null && (n = e.replace(Fh, "$&/") + "/"), Us(l, t, n, "", function(m) {
    return m;
  })) : l != null && (Yf(l) && (l = VS(l, n + (!l.key || a && a.key === l.key ? "" : ("" + l.key).replace(Fh, "$&/") + "/") + e)), t.push(l)), 1;
  if (a = 0, o = o === "" ? "." : o + ":", jh(e)) for (var d = 0; d < e.length; d++) {
    s = e[d];
    var p = o + nc(s, d);
    a += Us(s, t, n, p, l);
  }
  else if (p = WS(e), typeof p == "function") for (e = p.call(e), d = 0; !(s = e.next()).done; ) s = s.value, p = o + nc(s, d++), a += Us(s, t, n, p, l);
  else if (s === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return a;
}
function Ss(e, t, n) {
  if (e == null) return e;
  var o = [], l = 0;
  return Us(e, o, "", "", function(s) {
    return t.call(n, s, l++);
  }), o;
}
function KS(e) {
  if (e._status === -1) {
    var t = e._result;
    t = t(), t.then(function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 1, e._result = n);
    }, function(n) {
      (e._status === 0 || e._status === -1) && (e._status = 2, e._result = n);
    }), e._status === -1 && (e._status = 0, e._result = t);
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var gt = { current: null }, Hs = { transition: null }, QS = { ReactCurrentDispatcher: gt, ReactCurrentBatchConfig: Hs, ReactCurrentOwner: Xf };
function Mg() {
  throw Error("act(...) is not supported in production builds of React.");
}
ue.Children = { map: Ss, forEach: function(e, t, n) {
  Ss(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return Ss(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return Ss(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!Yf(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
ue.Component = eo;
ue.Fragment = zS;
ue.Profiler = OS;
ue.PureComponent = Kf;
ue.StrictMode = IS;
ue.Suspense = US;
ue.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = QS;
ue.act = Mg;
ue.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var o = Pg({}, e.props), l = e.key, s = e.ref, a = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (s = t.ref, a = Xf.current), t.key !== void 0 && (l = "" + t.key), e.type && e.type.defaultProps) var d = e.type.defaultProps;
    for (p in t) Ag.call(t, p) && !Lg.hasOwnProperty(p) && (o[p] = t[p] === void 0 && d !== void 0 ? d[p] : t[p]);
  }
  var p = arguments.length - 2;
  if (p === 1) o.children = n;
  else if (1 < p) {
    d = Array(p);
    for (var m = 0; m < p; m++) d[m] = arguments[m + 2];
    o.children = d;
  }
  return { $$typeof: yl, type: e.type, key: l, ref: s, props: o, _owner: a };
};
ue.createContext = function(e) {
  return e = { $$typeof: jS, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: DS, _context: e }, e.Consumer = e;
};
ue.createElement = Ng;
ue.createFactory = function(e) {
  var t = Ng.bind(null, e);
  return t.type = e, t;
};
ue.createRef = function() {
  return { current: null };
};
ue.forwardRef = function(e) {
  return { $$typeof: FS, render: e };
};
ue.isValidElement = Yf;
ue.lazy = function(e) {
  return { $$typeof: BS, _payload: { _status: -1, _result: e }, _init: KS };
};
ue.memo = function(e, t) {
  return { $$typeof: HS, type: e, compare: t === void 0 ? null : t };
};
ue.startTransition = function(e) {
  var t = Hs.transition;
  Hs.transition = {};
  try {
    e();
  } finally {
    Hs.transition = t;
  }
};
ue.unstable_act = Mg;
ue.useCallback = function(e, t) {
  return gt.current.useCallback(e, t);
};
ue.useContext = function(e) {
  return gt.current.useContext(e);
};
ue.useDebugValue = function() {
};
ue.useDeferredValue = function(e) {
  return gt.current.useDeferredValue(e);
};
ue.useEffect = function(e, t) {
  return gt.current.useEffect(e, t);
};
ue.useId = function() {
  return gt.current.useId();
};
ue.useImperativeHandle = function(e, t, n) {
  return gt.current.useImperativeHandle(e, t, n);
};
ue.useInsertionEffect = function(e, t) {
  return gt.current.useInsertionEffect(e, t);
};
ue.useLayoutEffect = function(e, t) {
  return gt.current.useLayoutEffect(e, t);
};
ue.useMemo = function(e, t) {
  return gt.current.useMemo(e, t);
};
ue.useReducer = function(e, t, n) {
  return gt.current.useReducer(e, t, n);
};
ue.useRef = function(e) {
  return gt.current.useRef(e);
};
ue.useState = function(e) {
  return gt.current.useState(e);
};
ue.useSyncExternalStore = function(e, t, n) {
  return gt.current.useSyncExternalStore(e, t, n);
};
ue.useTransition = function() {
  return gt.current.useTransition();
};
ue.version = "18.3.1";
kg.exports = ue;
var Q = kg.exports;
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var XS = Q, YS = Symbol.for("react.element"), ZS = Symbol.for("react.fragment"), JS = Object.prototype.hasOwnProperty, qS = XS.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, $S = { key: !0, ref: !0, __self: !0, __source: !0 };
function zg(e, t, n) {
  var o, l = {}, s = null, a = null;
  n !== void 0 && (s = "" + n), t.key !== void 0 && (s = "" + t.key), t.ref !== void 0 && (a = t.ref);
  for (o in t) JS.call(t, o) && !$S.hasOwnProperty(o) && (l[o] = t[o]);
  if (e && e.defaultProps) for (o in t = e.defaultProps, t) l[o] === void 0 && (l[o] = t[o]);
  return { $$typeof: YS, type: e, key: s, ref: a, props: l, _owner: qS.current };
}
Cu.Fragment = ZS;
Cu.jsx = zg;
Cu.jsxs = zg;
xg.exports = Cu;
var q = xg.exports, Ig = { exports: {} }, Vt = {}, Og = { exports: {} }, Dg = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(N, F) {
    var j = N.length;
    N.push(F);
    e: for (; 0 < j; ) {
      var X = j - 1 >>> 1, te = N[X];
      if (0 < l(te, F)) N[X] = F, N[j] = te, j = X;
      else break e;
    }
  }
  function n(N) {
    return N.length === 0 ? null : N[0];
  }
  function o(N) {
    if (N.length === 0) return null;
    var F = N[0], j = N.pop();
    if (j !== F) {
      N[0] = j;
      e: for (var X = 0, te = N.length, ae = te >>> 1; X < ae; ) {
        var Me = 2 * (X + 1) - 1, tt = N[Me], Ge = Me + 1, Kt = N[Ge];
        if (0 > l(tt, j)) Ge < te && 0 > l(Kt, tt) ? (N[X] = Kt, N[Ge] = j, X = Ge) : (N[X] = tt, N[Me] = j, X = Me);
        else if (Ge < te && 0 > l(Kt, j)) N[X] = Kt, N[Ge] = j, X = Ge;
        else break e;
      }
    }
    return F;
  }
  function l(N, F) {
    var j = N.sortIndex - F.sortIndex;
    return j !== 0 ? j : N.id - F.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var s = performance;
    e.unstable_now = function() {
      return s.now();
    };
  } else {
    var a = Date, d = a.now();
    e.unstable_now = function() {
      return a.now() - d;
    };
  }
  var p = [], m = [], g = 1, y = null, v = 3, _ = !1, k = !1, R = !1, A = typeof setTimeout == "function" ? setTimeout : null, w = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function E(N) {
    for (var F = n(m); F !== null; ) {
      if (F.callback === null) o(m);
      else if (F.startTime <= N) o(m), F.sortIndex = F.expirationTime, t(p, F);
      else break;
      F = n(m);
    }
  }
  function C(N) {
    if (R = !1, E(N), !k) if (n(p) !== null) k = !0, Je(I);
    else {
      var F = n(m);
      F !== null && St(C, F.startTime - N);
    }
  }
  function I(N, F) {
    k = !1, R && (R = !1, w(H), H = -1), _ = !0;
    var j = v;
    try {
      for (E(F), y = n(p); y !== null && (!(y.expirationTime > F) || N && !G()); ) {
        var X = y.callback;
        if (typeof X == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = X(y.expirationTime <= F);
          F = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && o(p), E(F);
        } else o(p);
        y = n(p);
      }
      if (y !== null) var ae = !0;
      else {
        var Me = n(m);
        Me !== null && St(C, Me.startTime - F), ae = !1;
      }
      return ae;
    } finally {
      y = null, v = j, _ = !1;
    }
  }
  var O = !1, D = null, H = -1, J = 5, W = -1;
  function G() {
    return !(e.unstable_now() - W < J);
  }
  function le() {
    if (D !== null) {
      var N = e.unstable_now();
      W = N;
      var F = !0;
      try {
        F = D(!0, N);
      } finally {
        F ? ve() : (O = !1, D = null);
      }
    } else O = !1;
  }
  var ve;
  if (typeof S == "function") ve = function() {
    S(le);
  };
  else if (typeof MessageChannel < "u") {
    var vt = new MessageChannel(), Mt = vt.port2;
    vt.port1.onmessage = le, ve = function() {
      Mt.postMessage(null);
    };
  } else ve = function() {
    A(le, 0);
  };
  function Je(N) {
    D = N, O || (O = !0, ve());
  }
  function St(N, F) {
    H = A(function() {
      N(e.unstable_now());
    }, F);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    k || _ || (k = !0, Je(I));
  }, e.unstable_forceFrameRate = function(N) {
    0 > N || 125 < N ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : J = 0 < N ? Math.floor(1e3 / N) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return v;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(p);
  }, e.unstable_next = function(N) {
    switch (v) {
      case 1:
      case 2:
      case 3:
        var F = 3;
        break;
      default:
        F = v;
    }
    var j = v;
    v = F;
    try {
      return N();
    } finally {
      v = j;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(N, F) {
    switch (N) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        N = 3;
    }
    var j = v;
    v = N;
    try {
      return F();
    } finally {
      v = j;
    }
  }, e.unstable_scheduleCallback = function(N, F, j) {
    var X = e.unstable_now();
    switch (typeof j == "object" && j !== null ? (j = j.delay, j = typeof j == "number" && 0 < j ? X + j : X) : j = X, N) {
      case 1:
        var te = -1;
        break;
      case 2:
        te = 250;
        break;
      case 5:
        te = 1073741823;
        break;
      case 4:
        te = 1e4;
        break;
      default:
        te = 5e3;
    }
    return te = j + te, N = { id: g++, callback: F, priorityLevel: N, startTime: j, expirationTime: te, sortIndex: -1 }, j > X ? (N.sortIndex = j, t(m, N), n(p) === null && N === n(m) && (R ? (w(H), H = -1) : R = !0, St(C, j - X))) : (N.sortIndex = te, t(p, N), k || _ || (k = !0, Je(I))), N;
  }, e.unstable_shouldYield = G, e.unstable_wrapCallback = function(N) {
    var F = v;
    return function() {
      var j = v;
      v = F;
      try {
        return N.apply(this, arguments);
      } finally {
        v = j;
      }
    };
  };
})(Dg);
Og.exports = Dg;
var bS = Og.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ew = Q, Wt = bS;
function U(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var jg = /* @__PURE__ */ new Set(), el = {};
function ni(e, t) {
  Qi(e, t), Qi(e + "Capture", t);
}
function Qi(e, t) {
  for (el[e] = t, e = 0; e < t.length; e++) jg.add(t[e]);
}
var Xn = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Xc = Object.prototype.hasOwnProperty, tw = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Uh = {}, Hh = {};
function nw(e) {
  return Xc.call(Hh, e) ? !0 : Xc.call(Uh, e) ? !1 : tw.test(e) ? Hh[e] = !0 : (Uh[e] = !0, !1);
}
function rw(e, t, n, o) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return o ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function iw(e, t, n, o) {
  if (t === null || typeof t > "u" || rw(e, t, n, o)) return !0;
  if (o) return !1;
  if (n !== null) switch (n.type) {
    case 3:
      return !t;
    case 4:
      return t === !1;
    case 5:
      return isNaN(t);
    case 6:
      return isNaN(t) || 1 > t;
  }
  return !1;
}
function yt(e, t, n, o, l, s, a) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = o, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = s, this.removeEmptyString = a;
}
var et = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  et[e] = new yt(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  et[t] = new yt(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  et[e] = new yt(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  et[e] = new yt(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  et[e] = new yt(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  et[e] = new yt(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  et[e] = new yt(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  et[e] = new yt(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  et[e] = new yt(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Zf = /[\-:]([a-z])/g;
function Jf(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    Zf,
    Jf
  );
  et[t] = new yt(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(Zf, Jf);
  et[t] = new yt(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(Zf, Jf);
  et[t] = new yt(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  et[e] = new yt(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
et.xlinkHref = new yt("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  et[e] = new yt(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function qf(e, t, n, o) {
  var l = et.hasOwnProperty(t) ? et[t] : null;
  (l !== null ? l.type !== 0 : o || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (iw(t, n, l, o) && (n = null), o || l === null ? nw(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, o = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, o ? e.setAttributeNS(o, t, n) : e.setAttribute(t, n))));
}
var qn = ew.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ws = Symbol.for("react.element"), Ti = Symbol.for("react.portal"), Pi = Symbol.for("react.fragment"), $f = Symbol.for("react.strict_mode"), Yc = Symbol.for("react.profiler"), Fg = Symbol.for("react.provider"), Ug = Symbol.for("react.context"), bf = Symbol.for("react.forward_ref"), Zc = Symbol.for("react.suspense"), Jc = Symbol.for("react.suspense_list"), ed = Symbol.for("react.memo"), fr = Symbol.for("react.lazy"), Hg = Symbol.for("react.offscreen"), Bh = Symbol.iterator;
function Co(e) {
  return e === null || typeof e != "object" ? null : (e = Bh && e[Bh] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Ne = Object.assign, rc;
function Uo(e) {
  if (rc === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    rc = t && t[1] || "";
  }
  return `
` + rc + e;
}
var ic = !1;
function oc(e, t) {
  if (!e || ic) return "";
  ic = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t) if (t = function() {
      throw Error();
    }, Object.defineProperty(t.prototype, "props", { set: function() {
      throw Error();
    } }), typeof Reflect == "object" && Reflect.construct) {
      try {
        Reflect.construct(t, []);
      } catch (m) {
        var o = m;
      }
      Reflect.construct(e, [], t);
    } else {
      try {
        t.call();
      } catch (m) {
        o = m;
      }
      e.call(t.prototype);
    }
    else {
      try {
        throw Error();
      } catch (m) {
        o = m;
      }
      e();
    }
  } catch (m) {
    if (m && o && typeof m.stack == "string") {
      for (var l = m.stack.split(`
`), s = o.stack.split(`
`), a = l.length - 1, d = s.length - 1; 1 <= a && 0 <= d && l[a] !== s[d]; ) d--;
      for (; 1 <= a && 0 <= d; a--, d--) if (l[a] !== s[d]) {
        if (a !== 1 || d !== 1)
          do
            if (a--, d--, 0 > d || l[a] !== s[d]) {
              var p = `
` + l[a].replace(" at new ", " at ");
              return e.displayName && p.includes("<anonymous>") && (p = p.replace("<anonymous>", e.displayName)), p;
            }
          while (1 <= a && 0 <= d);
        break;
      }
    }
  } finally {
    ic = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? Uo(e) : "";
}
function ow(e) {
  switch (e.tag) {
    case 5:
      return Uo(e.type);
    case 16:
      return Uo("Lazy");
    case 13:
      return Uo("Suspense");
    case 19:
      return Uo("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = oc(e.type, !1), e;
    case 11:
      return e = oc(e.type.render, !1), e;
    case 1:
      return e = oc(e.type, !0), e;
    default:
      return "";
  }
}
function qc(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Pi:
      return "Fragment";
    case Ti:
      return "Portal";
    case Yc:
      return "Profiler";
    case $f:
      return "StrictMode";
    case Zc:
      return "Suspense";
    case Jc:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Ug:
      return (e.displayName || "Context") + ".Consumer";
    case Fg:
      return (e._context.displayName || "Context") + ".Provider";
    case bf:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case ed:
      return t = e.displayName || null, t !== null ? t : qc(e.type) || "Memo";
    case fr:
      t = e._payload, e = e._init;
      try {
        return qc(e(t));
      } catch {
      }
  }
  return null;
}
function lw(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return "Cache";
    case 9:
      return (t.displayName || "Context") + ".Consumer";
    case 10:
      return (t._context.displayName || "Context") + ".Provider";
    case 18:
      return "DehydratedFragment";
    case 11:
      return e = t.render, e = e.displayName || e.name || "", t.displayName || (e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef");
    case 7:
      return "Fragment";
    case 5:
      return t;
    case 4:
      return "Portal";
    case 3:
      return "Root";
    case 6:
      return "Text";
    case 16:
      return qc(t);
    case 8:
      return t === $f ? "StrictMode" : "Mode";
    case 22:
      return "Offscreen";
    case 12:
      return "Profiler";
    case 21:
      return "Scope";
    case 13:
      return "Suspense";
    case 19:
      return "SuspenseList";
    case 25:
      return "TracingMarker";
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == "function") return t.displayName || t.name || null;
      if (typeof t == "string") return t;
  }
  return null;
}
function Cr(e) {
  switch (typeof e) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return e;
    case "object":
      return e;
    default:
      return "";
  }
}
function Bg(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function sw(e) {
  var t = Bg(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), o = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var l = n.get, s = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return l.call(this);
    }, set: function(a) {
      o = "" + a, s.call(this, a);
    } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
      return o;
    }, setValue: function(a) {
      o = "" + a;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function _s(e) {
  e._valueTracker || (e._valueTracker = sw(e));
}
function Wg(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), o = "";
  return e && (o = Bg(e) ? e.checked ? "true" : "false" : e.value), e = o, e !== n ? (t.setValue(e), !0) : !1;
}
function tu(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function $c(e, t) {
  var n = t.checked;
  return Ne({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function Wh(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, o = t.checked != null ? t.checked : t.defaultChecked;
  n = Cr(t.value != null ? t.value : n), e._wrapperState = { initialChecked: o, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Vg(e, t) {
  t = t.checked, t != null && qf(e, "checked", t, !1);
}
function bc(e, t) {
  Vg(e, t);
  var n = Cr(t.value), o = t.type;
  if (n != null) o === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (o === "submit" || o === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? ef(e, t.type, n) : t.hasOwnProperty("defaultValue") && ef(e, t.type, Cr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function Vh(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var o = t.type;
    if (!(o !== "submit" && o !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function ef(e, t, n) {
  (t !== "number" || tu(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var Ho = Array.isArray;
function Ui(e, t, n, o) {
  if (e = e.options, t) {
    t = {};
    for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
    for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && o && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + Cr(n), t = null, l = 0; l < e.length; l++) {
      if (e[l].value === n) {
        e[l].selected = !0, o && (e[l].defaultSelected = !0);
        return;
      }
      t !== null || e[l].disabled || (t = e[l]);
    }
    t !== null && (t.selected = !0);
  }
}
function tf(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(U(91));
  return Ne({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function Gh(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(U(92));
      if (Ho(n)) {
        if (1 < n.length) throw Error(U(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: Cr(n) };
}
function Gg(e, t) {
  var n = Cr(t.value), o = Cr(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), o != null && (e.defaultValue = "" + o);
}
function Kh(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Kg(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function nf(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Kg(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Es, Qg = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, o, l) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, o, l);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (Es = Es || document.createElement("div"), Es.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Es.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function tl(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Ko = {
  animationIterationCount: !0,
  aspectRatio: !0,
  borderImageOutset: !0,
  borderImageSlice: !0,
  borderImageWidth: !0,
  boxFlex: !0,
  boxFlexGroup: !0,
  boxOrdinalGroup: !0,
  columnCount: !0,
  columns: !0,
  flex: !0,
  flexGrow: !0,
  flexPositive: !0,
  flexShrink: !0,
  flexNegative: !0,
  flexOrder: !0,
  gridArea: !0,
  gridRow: !0,
  gridRowEnd: !0,
  gridRowSpan: !0,
  gridRowStart: !0,
  gridColumn: !0,
  gridColumnEnd: !0,
  gridColumnSpan: !0,
  gridColumnStart: !0,
  fontWeight: !0,
  lineClamp: !0,
  lineHeight: !0,
  opacity: !0,
  order: !0,
  orphans: !0,
  tabSize: !0,
  widows: !0,
  zIndex: !0,
  zoom: !0,
  fillOpacity: !0,
  floodOpacity: !0,
  stopOpacity: !0,
  strokeDasharray: !0,
  strokeDashoffset: !0,
  strokeMiterlimit: !0,
  strokeOpacity: !0,
  strokeWidth: !0
}, uw = ["Webkit", "ms", "Moz", "O"];
Object.keys(Ko).forEach(function(e) {
  uw.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), Ko[t] = Ko[e];
  });
});
function Xg(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Ko.hasOwnProperty(e) && Ko[e] ? ("" + t).trim() : t + "px";
}
function Yg(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var o = n.indexOf("--") === 0, l = Xg(n, t[n], o);
    n === "float" && (n = "cssFloat"), o ? e.setProperty(n, l) : e[n] = l;
  }
}
var aw = Ne({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function rf(e, t) {
  if (t) {
    if (aw[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(U(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(U(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(U(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(U(62));
  }
}
function of(e, t) {
  if (e.indexOf("-") === -1) return typeof t.is == "string";
  switch (e) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var lf = null;
function td(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var sf = null, Hi = null, Bi = null;
function Qh(e) {
  if (e = wl(e)) {
    if (typeof sf != "function") throw Error(U(280));
    var t = e.stateNode;
    t && (t = Mu(t), sf(e.stateNode, e.type, t));
  }
}
function Zg(e) {
  Hi ? Bi ? Bi.push(e) : Bi = [e] : Hi = e;
}
function Jg() {
  if (Hi) {
    var e = Hi, t = Bi;
    if (Bi = Hi = null, Qh(e), t) for (e = 0; e < t.length; e++) Qh(t[e]);
  }
}
function qg(e, t) {
  return e(t);
}
function $g() {
}
var lc = !1;
function bg(e, t, n) {
  if (lc) return e(t, n);
  lc = !0;
  try {
    return qg(e, t, n);
  } finally {
    lc = !1, (Hi !== null || Bi !== null) && ($g(), Jg());
  }
}
function nl(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var o = Mu(n);
  if (o === null) return null;
  n = o[t];
  e: switch (t) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (o = !o.disabled) || (e = e.type, o = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !o;
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != "function") throw Error(U(231, t, typeof n));
  return n;
}
var uf = !1;
if (Xn) try {
  var Ro = {};
  Object.defineProperty(Ro, "passive", { get: function() {
    uf = !0;
  } }), window.addEventListener("test", Ro, Ro), window.removeEventListener("test", Ro, Ro);
} catch {
  uf = !1;
}
function cw(e, t, n, o, l, s, a, d, p) {
  var m = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, m);
  } catch (g) {
    this.onError(g);
  }
}
var Qo = !1, nu = null, ru = !1, af = null, fw = { onError: function(e) {
  Qo = !0, nu = e;
} };
function dw(e, t, n, o, l, s, a, d, p) {
  Qo = !1, nu = null, cw.apply(fw, arguments);
}
function pw(e, t, n, o, l, s, a, d, p) {
  if (dw.apply(this, arguments), Qo) {
    if (Qo) {
      var m = nu;
      Qo = !1, nu = null;
    } else throw Error(U(198));
    ru || (ru = !0, af = m);
  }
}
function ri(e) {
  var t = e, n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do
      t = e, t.flags & 4098 && (n = t.return), e = t.return;
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function ey(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function Xh(e) {
  if (ri(e) !== e) throw Error(U(188));
}
function hw(e) {
  var t = e.alternate;
  if (!t) {
    if (t = ri(e), t === null) throw Error(U(188));
    return t !== e ? null : e;
  }
  for (var n = e, o = t; ; ) {
    var l = n.return;
    if (l === null) break;
    var s = l.alternate;
    if (s === null) {
      if (o = l.return, o !== null) {
        n = o;
        continue;
      }
      break;
    }
    if (l.child === s.child) {
      for (s = l.child; s; ) {
        if (s === n) return Xh(l), e;
        if (s === o) return Xh(l), t;
        s = s.sibling;
      }
      throw Error(U(188));
    }
    if (n.return !== o.return) n = l, o = s;
    else {
      for (var a = !1, d = l.child; d; ) {
        if (d === n) {
          a = !0, n = l, o = s;
          break;
        }
        if (d === o) {
          a = !0, o = l, n = s;
          break;
        }
        d = d.sibling;
      }
      if (!a) {
        for (d = s.child; d; ) {
          if (d === n) {
            a = !0, n = s, o = l;
            break;
          }
          if (d === o) {
            a = !0, o = s, n = l;
            break;
          }
          d = d.sibling;
        }
        if (!a) throw Error(U(189));
      }
    }
    if (n.alternate !== o) throw Error(U(190));
  }
  if (n.tag !== 3) throw Error(U(188));
  return n.stateNode.current === n ? e : t;
}
function ty(e) {
  return e = hw(e), e !== null ? ny(e) : null;
}
function ny(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = ny(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var ry = Wt.unstable_scheduleCallback, Yh = Wt.unstable_cancelCallback, mw = Wt.unstable_shouldYield, gw = Wt.unstable_requestPaint, De = Wt.unstable_now, yw = Wt.unstable_getCurrentPriorityLevel, nd = Wt.unstable_ImmediatePriority, iy = Wt.unstable_UserBlockingPriority, iu = Wt.unstable_NormalPriority, vw = Wt.unstable_LowPriority, oy = Wt.unstable_IdlePriority, Ru = null, Nn = null;
function Sw(e) {
  if (Nn && typeof Nn.onCommitFiberRoot == "function") try {
    Nn.onCommitFiberRoot(Ru, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var vn = Math.clz32 ? Math.clz32 : Ew, ww = Math.log, _w = Math.LN2;
function Ew(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (ww(e) / _w | 0) | 0;
}
var xs = 64, ks = 4194304;
function Bo(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function ou(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var o = 0, l = e.suspendedLanes, s = e.pingedLanes, a = n & 268435455;
  if (a !== 0) {
    var d = a & ~l;
    d !== 0 ? o = Bo(d) : (s &= a, s !== 0 && (o = Bo(s)));
  } else a = n & ~l, a !== 0 ? o = Bo(a) : s !== 0 && (o = Bo(s));
  if (o === 0) return 0;
  if (t !== 0 && t !== o && !(t & l) && (l = o & -o, s = t & -t, l >= s || l === 16 && (s & 4194240) !== 0)) return t;
  if (o & 4 && (o |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= o; 0 < t; ) n = 31 - vn(t), l = 1 << n, o |= e[n], t &= ~l;
  return o;
}
function xw(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function kw(e, t) {
  for (var n = e.suspendedLanes, o = e.pingedLanes, l = e.expirationTimes, s = e.pendingLanes; 0 < s; ) {
    var a = 31 - vn(s), d = 1 << a, p = l[a];
    p === -1 ? (!(d & n) || d & o) && (l[a] = xw(d, t)) : p <= t && (e.expiredLanes |= d), s &= ~d;
  }
}
function cf(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function ly() {
  var e = xs;
  return xs <<= 1, !(xs & 4194240) && (xs = 64), e;
}
function sc(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function vl(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - vn(t), e[t] = n;
}
function Tw(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var o = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var l = 31 - vn(n), s = 1 << l;
    t[l] = 0, o[l] = -1, e[l] = -1, n &= ~s;
  }
}
function rd(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var o = 31 - vn(n), l = 1 << o;
    l & t | e[o] & t && (e[o] |= t), n &= ~l;
  }
}
var me = 0;
function sy(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var uy, id, ay, cy, fy, ff = !1, Ts = [], vr = null, Sr = null, wr = null, rl = /* @__PURE__ */ new Map(), il = /* @__PURE__ */ new Map(), pr = [], Pw = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Zh(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      vr = null;
      break;
    case "dragenter":
    case "dragleave":
      Sr = null;
      break;
    case "mouseover":
    case "mouseout":
      wr = null;
      break;
    case "pointerover":
    case "pointerout":
      rl.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      il.delete(t.pointerId);
  }
}
function Ao(e, t, n, o, l, s) {
  return e === null || e.nativeEvent !== s ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: o, nativeEvent: s, targetContainers: [l] }, t !== null && (t = wl(t), t !== null && id(t)), e) : (e.eventSystemFlags |= o, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
}
function Cw(e, t, n, o, l) {
  switch (t) {
    case "focusin":
      return vr = Ao(vr, e, t, n, o, l), !0;
    case "dragenter":
      return Sr = Ao(Sr, e, t, n, o, l), !0;
    case "mouseover":
      return wr = Ao(wr, e, t, n, o, l), !0;
    case "pointerover":
      var s = l.pointerId;
      return rl.set(s, Ao(rl.get(s) || null, e, t, n, o, l)), !0;
    case "gotpointercapture":
      return s = l.pointerId, il.set(s, Ao(il.get(s) || null, e, t, n, o, l)), !0;
  }
  return !1;
}
function dy(e) {
  var t = Kr(e.target);
  if (t !== null) {
    var n = ri(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = ey(n), t !== null) {
          e.blockedOn = t, fy(e.priority, function() {
            ay(n);
          });
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function Bs(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = df(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var o = new n.constructor(n.type, n);
      lf = o, n.target.dispatchEvent(o), lf = null;
    } else return t = wl(n), t !== null && id(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function Jh(e, t, n) {
  Bs(e) && n.delete(t);
}
function Rw() {
  ff = !1, vr !== null && Bs(vr) && (vr = null), Sr !== null && Bs(Sr) && (Sr = null), wr !== null && Bs(wr) && (wr = null), rl.forEach(Jh), il.forEach(Jh);
}
function Lo(e, t) {
  e.blockedOn === t && (e.blockedOn = null, ff || (ff = !0, Wt.unstable_scheduleCallback(Wt.unstable_NormalPriority, Rw)));
}
function ol(e) {
  function t(l) {
    return Lo(l, e);
  }
  if (0 < Ts.length) {
    Lo(Ts[0], e);
    for (var n = 1; n < Ts.length; n++) {
      var o = Ts[n];
      o.blockedOn === e && (o.blockedOn = null);
    }
  }
  for (vr !== null && Lo(vr, e), Sr !== null && Lo(Sr, e), wr !== null && Lo(wr, e), rl.forEach(t), il.forEach(t), n = 0; n < pr.length; n++) o = pr[n], o.blockedOn === e && (o.blockedOn = null);
  for (; 0 < pr.length && (n = pr[0], n.blockedOn === null); ) dy(n), n.blockedOn === null && pr.shift();
}
var Wi = qn.ReactCurrentBatchConfig, lu = !0;
function Aw(e, t, n, o) {
  var l = me, s = Wi.transition;
  Wi.transition = null;
  try {
    me = 1, od(e, t, n, o);
  } finally {
    me = l, Wi.transition = s;
  }
}
function Lw(e, t, n, o) {
  var l = me, s = Wi.transition;
  Wi.transition = null;
  try {
    me = 4, od(e, t, n, o);
  } finally {
    me = l, Wi.transition = s;
  }
}
function od(e, t, n, o) {
  if (lu) {
    var l = df(e, t, n, o);
    if (l === null) yc(e, t, o, su, n), Zh(e, o);
    else if (Cw(l, e, t, n, o)) o.stopPropagation();
    else if (Zh(e, o), t & 4 && -1 < Pw.indexOf(e)) {
      for (; l !== null; ) {
        var s = wl(l);
        if (s !== null && uy(s), s = df(e, t, n, o), s === null && yc(e, t, o, su, n), s === l) break;
        l = s;
      }
      l !== null && o.stopPropagation();
    } else yc(e, t, o, null, n);
  }
}
var su = null;
function df(e, t, n, o) {
  if (su = null, e = td(o), e = Kr(e), e !== null) if (t = ri(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = ey(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return su = e, null;
}
function py(e) {
  switch (e) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 1;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 4;
    case "message":
      switch (yw()) {
        case nd:
          return 1;
        case iy:
          return 4;
        case iu:
        case vw:
          return 16;
        case oy:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var mr = null, ld = null, Ws = null;
function hy() {
  if (Ws) return Ws;
  var e, t = ld, n = t.length, o, l = "value" in mr ? mr.value : mr.textContent, s = l.length;
  for (e = 0; e < n && t[e] === l[e]; e++) ;
  var a = n - e;
  for (o = 1; o <= a && t[n - o] === l[s - o]; o++) ;
  return Ws = l.slice(e, 1 < o ? 1 - o : void 0);
}
function Vs(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Ps() {
  return !0;
}
function qh() {
  return !1;
}
function Gt(e) {
  function t(n, o, l, s, a) {
    this._reactName = n, this._targetInst = l, this.type = o, this.nativeEvent = s, this.target = a, this.currentTarget = null;
    for (var d in e) e.hasOwnProperty(d) && (n = e[d], this[d] = n ? n(s) : s[d]);
    return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? Ps : qh, this.isPropagationStopped = qh, this;
  }
  return Ne(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Ps);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Ps);
  }, persist: function() {
  }, isPersistent: Ps }), t;
}
var to = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, sd = Gt(to), Sl = Ne({}, to, { view: 0, detail: 0 }), Nw = Gt(Sl), uc, ac, No, Au = Ne({}, Sl, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: ud, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== No && (No && e.type === "mousemove" ? (uc = e.screenX - No.screenX, ac = e.screenY - No.screenY) : ac = uc = 0, No = e), uc);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : ac;
} }), $h = Gt(Au), Mw = Ne({}, Au, { dataTransfer: 0 }), zw = Gt(Mw), Iw = Ne({}, Sl, { relatedTarget: 0 }), cc = Gt(Iw), Ow = Ne({}, to, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Dw = Gt(Ow), jw = Ne({}, to, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), Fw = Gt(jw), Uw = Ne({}, to, { data: 0 }), bh = Gt(Uw), Hw = {
  Esc: "Escape",
  Spacebar: " ",
  Left: "ArrowLeft",
  Up: "ArrowUp",
  Right: "ArrowRight",
  Down: "ArrowDown",
  Del: "Delete",
  Win: "OS",
  Menu: "ContextMenu",
  Apps: "ContextMenu",
  Scroll: "ScrollLock",
  MozPrintableKey: "Unidentified"
}, Bw = {
  8: "Backspace",
  9: "Tab",
  12: "Clear",
  13: "Enter",
  16: "Shift",
  17: "Control",
  18: "Alt",
  19: "Pause",
  20: "CapsLock",
  27: "Escape",
  32: " ",
  33: "PageUp",
  34: "PageDown",
  35: "End",
  36: "Home",
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
  45: "Insert",
  46: "Delete",
  112: "F1",
  113: "F2",
  114: "F3",
  115: "F4",
  116: "F5",
  117: "F6",
  118: "F7",
  119: "F8",
  120: "F9",
  121: "F10",
  122: "F11",
  123: "F12",
  144: "NumLock",
  145: "ScrollLock",
  224: "Meta"
}, Ww = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Vw(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Ww[e]) ? !!t[e] : !1;
}
function ud() {
  return Vw;
}
var Gw = Ne({}, Sl, { key: function(e) {
  if (e.key) {
    var t = Hw[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = Vs(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Bw[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: ud, charCode: function(e) {
  return e.type === "keypress" ? Vs(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Vs(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), Kw = Gt(Gw), Qw = Ne({}, Au, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), em = Gt(Qw), Xw = Ne({}, Sl, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: ud }), Yw = Gt(Xw), Zw = Ne({}, to, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Jw = Gt(Zw), qw = Ne({}, Au, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), $w = Gt(qw), bw = [9, 13, 27, 32], ad = Xn && "CompositionEvent" in window, Xo = null;
Xn && "documentMode" in document && (Xo = document.documentMode);
var e_ = Xn && "TextEvent" in window && !Xo, my = Xn && (!ad || Xo && 8 < Xo && 11 >= Xo), tm = " ", nm = !1;
function gy(e, t) {
  switch (e) {
    case "keyup":
      return bw.indexOf(t.keyCode) !== -1;
    case "keydown":
      return t.keyCode !== 229;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function yy(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var Ci = !1;
function t_(e, t) {
  switch (e) {
    case "compositionend":
      return yy(t);
    case "keypress":
      return t.which !== 32 ? null : (nm = !0, tm);
    case "textInput":
      return e = t.data, e === tm && nm ? null : e;
    default:
      return null;
  }
}
function n_(e, t) {
  if (Ci) return e === "compositionend" || !ad && gy(e, t) ? (e = hy(), Ws = ld = mr = null, Ci = !1, e) : null;
  switch (e) {
    case "paste":
      return null;
    case "keypress":
      if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case "compositionend":
      return my && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var r_ = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function rm(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!r_[e.type] : t === "textarea";
}
function vy(e, t, n, o) {
  Zg(o), t = uu(t, "onChange"), 0 < t.length && (n = new sd("onChange", "change", null, n, o), e.push({ event: n, listeners: t }));
}
var Yo = null, ll = null;
function i_(e) {
  Ay(e, 0);
}
function Lu(e) {
  var t = Li(e);
  if (Wg(t)) return e;
}
function o_(e, t) {
  if (e === "change") return t;
}
var Sy = !1;
if (Xn) {
  var fc;
  if (Xn) {
    var dc = "oninput" in document;
    if (!dc) {
      var im = document.createElement("div");
      im.setAttribute("oninput", "return;"), dc = typeof im.oninput == "function";
    }
    fc = dc;
  } else fc = !1;
  Sy = fc && (!document.documentMode || 9 < document.documentMode);
}
function om() {
  Yo && (Yo.detachEvent("onpropertychange", wy), ll = Yo = null);
}
function wy(e) {
  if (e.propertyName === "value" && Lu(ll)) {
    var t = [];
    vy(t, ll, e, td(e)), bg(i_, t);
  }
}
function l_(e, t, n) {
  e === "focusin" ? (om(), Yo = t, ll = n, Yo.attachEvent("onpropertychange", wy)) : e === "focusout" && om();
}
function s_(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return Lu(ll);
}
function u_(e, t) {
  if (e === "click") return Lu(t);
}
function a_(e, t) {
  if (e === "input" || e === "change") return Lu(t);
}
function c_(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var wn = typeof Object.is == "function" ? Object.is : c_;
function sl(e, t) {
  if (wn(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), o = Object.keys(t);
  if (n.length !== o.length) return !1;
  for (o = 0; o < n.length; o++) {
    var l = n[o];
    if (!Xc.call(t, l) || !wn(e[l], t[l])) return !1;
  }
  return !0;
}
function lm(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function sm(e, t) {
  var n = lm(e);
  e = 0;
  for (var o; n; ) {
    if (n.nodeType === 3) {
      if (o = e + n.textContent.length, e <= t && o >= t) return { node: n, offset: t - e };
      e = o;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = lm(n);
  }
}
function _y(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? _y(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Ey() {
  for (var e = window, t = tu(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = tu(e.document);
  }
  return t;
}
function cd(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function f_(e) {
  var t = Ey(), n = e.focusedElem, o = e.selectionRange;
  if (t !== n && n && n.ownerDocument && _y(n.ownerDocument.documentElement, n)) {
    if (o !== null && cd(n)) {
      if (t = o.start, e = o.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var l = n.textContent.length, s = Math.min(o.start, l);
        o = o.end === void 0 ? s : Math.min(o.end, l), !e.extend && s > o && (l = o, o = s, s = l), l = sm(n, s);
        var a = sm(
          n,
          o
        );
        l && a && (e.rangeCount !== 1 || e.anchorNode !== l.node || e.anchorOffset !== l.offset || e.focusNode !== a.node || e.focusOffset !== a.offset) && (t = t.createRange(), t.setStart(l.node, l.offset), e.removeAllRanges(), s > o ? (e.addRange(t), e.extend(a.node, a.offset)) : (t.setEnd(a.node, a.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var d_ = Xn && "documentMode" in document && 11 >= document.documentMode, Ri = null, pf = null, Zo = null, hf = !1;
function um(e, t, n) {
  var o = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  hf || Ri == null || Ri !== tu(o) || (o = Ri, "selectionStart" in o && cd(o) ? o = { start: o.selectionStart, end: o.selectionEnd } : (o = (o.ownerDocument && o.ownerDocument.defaultView || window).getSelection(), o = { anchorNode: o.anchorNode, anchorOffset: o.anchorOffset, focusNode: o.focusNode, focusOffset: o.focusOffset }), Zo && sl(Zo, o) || (Zo = o, o = uu(pf, "onSelect"), 0 < o.length && (t = new sd("onSelect", "select", null, t, n), e.push({ event: t, listeners: o }), t.target = Ri)));
}
function Cs(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var Ai = { animationend: Cs("Animation", "AnimationEnd"), animationiteration: Cs("Animation", "AnimationIteration"), animationstart: Cs("Animation", "AnimationStart"), transitionend: Cs("Transition", "TransitionEnd") }, pc = {}, xy = {};
Xn && (xy = document.createElement("div").style, "AnimationEvent" in window || (delete Ai.animationend.animation, delete Ai.animationiteration.animation, delete Ai.animationstart.animation), "TransitionEvent" in window || delete Ai.transitionend.transition);
function Nu(e) {
  if (pc[e]) return pc[e];
  if (!Ai[e]) return e;
  var t = Ai[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in xy) return pc[e] = t[n];
  return e;
}
var ky = Nu("animationend"), Ty = Nu("animationiteration"), Py = Nu("animationstart"), Cy = Nu("transitionend"), Ry = /* @__PURE__ */ new Map(), am = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Ar(e, t) {
  Ry.set(e, t), ni(t, [e]);
}
for (var hc = 0; hc < am.length; hc++) {
  var mc = am[hc], p_ = mc.toLowerCase(), h_ = mc[0].toUpperCase() + mc.slice(1);
  Ar(p_, "on" + h_);
}
Ar(ky, "onAnimationEnd");
Ar(Ty, "onAnimationIteration");
Ar(Py, "onAnimationStart");
Ar("dblclick", "onDoubleClick");
Ar("focusin", "onFocus");
Ar("focusout", "onBlur");
Ar(Cy, "onTransitionEnd");
Qi("onMouseEnter", ["mouseout", "mouseover"]);
Qi("onMouseLeave", ["mouseout", "mouseover"]);
Qi("onPointerEnter", ["pointerout", "pointerover"]);
Qi("onPointerLeave", ["pointerout", "pointerover"]);
ni("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
ni("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
ni("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
ni("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
ni("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
ni("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Wo = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), m_ = new Set("cancel close invalid load scroll toggle".split(" ").concat(Wo));
function cm(e, t, n) {
  var o = e.type || "unknown-event";
  e.currentTarget = n, pw(o, t, void 0, e), e.currentTarget = null;
}
function Ay(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var o = e[n], l = o.event;
    o = o.listeners;
    e: {
      var s = void 0;
      if (t) for (var a = o.length - 1; 0 <= a; a--) {
        var d = o[a], p = d.instance, m = d.currentTarget;
        if (d = d.listener, p !== s && l.isPropagationStopped()) break e;
        cm(l, d, m), s = p;
      }
      else for (a = 0; a < o.length; a++) {
        if (d = o[a], p = d.instance, m = d.currentTarget, d = d.listener, p !== s && l.isPropagationStopped()) break e;
        cm(l, d, m), s = p;
      }
    }
  }
  if (ru) throw e = af, ru = !1, af = null, e;
}
function ke(e, t) {
  var n = t[Sf];
  n === void 0 && (n = t[Sf] = /* @__PURE__ */ new Set());
  var o = e + "__bubble";
  n.has(o) || (Ly(t, e, 2, !1), n.add(o));
}
function gc(e, t, n) {
  var o = 0;
  t && (o |= 4), Ly(n, e, o, t);
}
var Rs = "_reactListening" + Math.random().toString(36).slice(2);
function ul(e) {
  if (!e[Rs]) {
    e[Rs] = !0, jg.forEach(function(n) {
      n !== "selectionchange" && (m_.has(n) || gc(n, !1, e), gc(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Rs] || (t[Rs] = !0, gc("selectionchange", !1, t));
  }
}
function Ly(e, t, n, o) {
  switch (py(t)) {
    case 1:
      var l = Aw;
      break;
    case 4:
      l = Lw;
      break;
    default:
      l = od;
  }
  n = l.bind(null, t, n, e), l = void 0, !uf || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), o ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
}
function yc(e, t, n, o, l) {
  var s = o;
  if (!(t & 1) && !(t & 2) && o !== null) e: for (; ; ) {
    if (o === null) return;
    var a = o.tag;
    if (a === 3 || a === 4) {
      var d = o.stateNode.containerInfo;
      if (d === l || d.nodeType === 8 && d.parentNode === l) break;
      if (a === 4) for (a = o.return; a !== null; ) {
        var p = a.tag;
        if ((p === 3 || p === 4) && (p = a.stateNode.containerInfo, p === l || p.nodeType === 8 && p.parentNode === l)) return;
        a = a.return;
      }
      for (; d !== null; ) {
        if (a = Kr(d), a === null) return;
        if (p = a.tag, p === 5 || p === 6) {
          o = s = a;
          continue e;
        }
        d = d.parentNode;
      }
    }
    o = o.return;
  }
  bg(function() {
    var m = s, g = td(n), y = [];
    e: {
      var v = Ry.get(e);
      if (v !== void 0) {
        var _ = sd, k = e;
        switch (e) {
          case "keypress":
            if (Vs(n) === 0) break e;
          case "keydown":
          case "keyup":
            _ = Kw;
            break;
          case "focusin":
            k = "focus", _ = cc;
            break;
          case "focusout":
            k = "blur", _ = cc;
            break;
          case "beforeblur":
          case "afterblur":
            _ = cc;
            break;
          case "click":
            if (n.button === 2) break e;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            _ = $h;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            _ = zw;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            _ = Yw;
            break;
          case ky:
          case Ty:
          case Py:
            _ = Dw;
            break;
          case Cy:
            _ = Jw;
            break;
          case "scroll":
            _ = Nw;
            break;
          case "wheel":
            _ = $w;
            break;
          case "copy":
          case "cut":
          case "paste":
            _ = Fw;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            _ = em;
        }
        var R = (t & 4) !== 0, A = !R && e === "scroll", w = R ? v !== null ? v + "Capture" : null : v;
        R = [];
        for (var S = m, E; S !== null; ) {
          E = S;
          var C = E.stateNode;
          if (E.tag === 5 && C !== null && (E = C, w !== null && (C = nl(S, w), C != null && R.push(al(S, C, E)))), A) break;
          S = S.return;
        }
        0 < R.length && (v = new _(v, k, null, n, g), y.push({ event: v, listeners: R }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (v = e === "mouseover" || e === "pointerover", _ = e === "mouseout" || e === "pointerout", v && n !== lf && (k = n.relatedTarget || n.fromElement) && (Kr(k) || k[Yn])) break e;
        if ((_ || v) && (v = g.window === g ? g : (v = g.ownerDocument) ? v.defaultView || v.parentWindow : window, _ ? (k = n.relatedTarget || n.toElement, _ = m, k = k ? Kr(k) : null, k !== null && (A = ri(k), k !== A || k.tag !== 5 && k.tag !== 6) && (k = null)) : (_ = null, k = m), _ !== k)) {
          if (R = $h, C = "onMouseLeave", w = "onMouseEnter", S = "mouse", (e === "pointerout" || e === "pointerover") && (R = em, C = "onPointerLeave", w = "onPointerEnter", S = "pointer"), A = _ == null ? v : Li(_), E = k == null ? v : Li(k), v = new R(C, S + "leave", _, n, g), v.target = A, v.relatedTarget = E, C = null, Kr(g) === m && (R = new R(w, S + "enter", k, n, g), R.target = E, R.relatedTarget = A, C = R), A = C, _ && k) t: {
            for (R = _, w = k, S = 0, E = R; E; E = Si(E)) S++;
            for (E = 0, C = w; C; C = Si(C)) E++;
            for (; 0 < S - E; ) R = Si(R), S--;
            for (; 0 < E - S; ) w = Si(w), E--;
            for (; S--; ) {
              if (R === w || w !== null && R === w.alternate) break t;
              R = Si(R), w = Si(w);
            }
            R = null;
          }
          else R = null;
          _ !== null && fm(y, v, _, R, !1), k !== null && A !== null && fm(y, A, k, R, !0);
        }
      }
      e: {
        if (v = m ? Li(m) : window, _ = v.nodeName && v.nodeName.toLowerCase(), _ === "select" || _ === "input" && v.type === "file") var I = o_;
        else if (rm(v)) if (Sy) I = a_;
        else {
          I = s_;
          var O = l_;
        }
        else (_ = v.nodeName) && _.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (I = u_);
        if (I && (I = I(e, m))) {
          vy(y, I, n, g);
          break e;
        }
        O && O(e, v, m), e === "focusout" && (O = v._wrapperState) && O.controlled && v.type === "number" && ef(v, "number", v.value);
      }
      switch (O = m ? Li(m) : window, e) {
        case "focusin":
          (rm(O) || O.contentEditable === "true") && (Ri = O, pf = m, Zo = null);
          break;
        case "focusout":
          Zo = pf = Ri = null;
          break;
        case "mousedown":
          hf = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          hf = !1, um(y, n, g);
          break;
        case "selectionchange":
          if (d_) break;
        case "keydown":
        case "keyup":
          um(y, n, g);
      }
      var D;
      if (ad) e: {
        switch (e) {
          case "compositionstart":
            var H = "onCompositionStart";
            break e;
          case "compositionend":
            H = "onCompositionEnd";
            break e;
          case "compositionupdate":
            H = "onCompositionUpdate";
            break e;
        }
        H = void 0;
      }
      else Ci ? gy(e, n) && (H = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (H = "onCompositionStart");
      H && (my && n.locale !== "ko" && (Ci || H !== "onCompositionStart" ? H === "onCompositionEnd" && Ci && (D = hy()) : (mr = g, ld = "value" in mr ? mr.value : mr.textContent, Ci = !0)), O = uu(m, H), 0 < O.length && (H = new bh(H, e, null, n, g), y.push({ event: H, listeners: O }), D ? H.data = D : (D = yy(n), D !== null && (H.data = D)))), (D = e_ ? t_(e, n) : n_(e, n)) && (m = uu(m, "onBeforeInput"), 0 < m.length && (g = new bh("onBeforeInput", "beforeinput", null, n, g), y.push({ event: g, listeners: m }), g.data = D));
    }
    Ay(y, t);
  });
}
function al(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function uu(e, t) {
  for (var n = t + "Capture", o = []; e !== null; ) {
    var l = e, s = l.stateNode;
    l.tag === 5 && s !== null && (l = s, s = nl(e, n), s != null && o.unshift(al(e, s, l)), s = nl(e, t), s != null && o.push(al(e, s, l))), e = e.return;
  }
  return o;
}
function Si(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function fm(e, t, n, o, l) {
  for (var s = t._reactName, a = []; n !== null && n !== o; ) {
    var d = n, p = d.alternate, m = d.stateNode;
    if (p !== null && p === o) break;
    d.tag === 5 && m !== null && (d = m, l ? (p = nl(n, s), p != null && a.unshift(al(n, p, d))) : l || (p = nl(n, s), p != null && a.push(al(n, p, d)))), n = n.return;
  }
  a.length !== 0 && e.push({ event: t, listeners: a });
}
var g_ = /\r\n?/g, y_ = /\u0000|\uFFFD/g;
function dm(e) {
  return (typeof e == "string" ? e : "" + e).replace(g_, `
`).replace(y_, "");
}
function As(e, t, n) {
  if (t = dm(t), dm(e) !== t && n) throw Error(U(425));
}
function au() {
}
var mf = null, gf = null;
function yf(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var vf = typeof setTimeout == "function" ? setTimeout : void 0, v_ = typeof clearTimeout == "function" ? clearTimeout : void 0, pm = typeof Promise == "function" ? Promise : void 0, S_ = typeof queueMicrotask == "function" ? queueMicrotask : typeof pm < "u" ? function(e) {
  return pm.resolve(null).then(e).catch(w_);
} : vf;
function w_(e) {
  setTimeout(function() {
    throw e;
  });
}
function vc(e, t) {
  var n = t, o = 0;
  do {
    var l = n.nextSibling;
    if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
      if (o === 0) {
        e.removeChild(l), ol(t);
        return;
      }
      o--;
    } else n !== "$" && n !== "$?" && n !== "$!" || o++;
    n = l;
  } while (n);
  ol(t);
}
function _r(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (t = e.data, t === "$" || t === "$!" || t === "$?") break;
      if (t === "/$") return null;
    }
  }
  return e;
}
function hm(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === "$" || n === "$!" || n === "$?") {
        if (t === 0) return e;
        t--;
      } else n === "/$" && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var no = Math.random().toString(36).slice(2), Ln = "__reactFiber$" + no, cl = "__reactProps$" + no, Yn = "__reactContainer$" + no, Sf = "__reactEvents$" + no, __ = "__reactListeners$" + no, E_ = "__reactHandles$" + no;
function Kr(e) {
  var t = e[Ln];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[Yn] || n[Ln]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = hm(e); e !== null; ) {
        if (n = e[Ln]) return n;
        e = hm(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function wl(e) {
  return e = e[Ln] || e[Yn], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function Li(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(U(33));
}
function Mu(e) {
  return e[cl] || null;
}
var wf = [], Ni = -1;
function Lr(e) {
  return { current: e };
}
function Te(e) {
  0 > Ni || (e.current = wf[Ni], wf[Ni] = null, Ni--);
}
function Ee(e, t) {
  Ni++, wf[Ni] = e.current, e.current = t;
}
var Rr = {}, ft = Lr(Rr), At = Lr(!1), qr = Rr;
function Xi(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Rr;
  var o = e.stateNode;
  if (o && o.__reactInternalMemoizedUnmaskedChildContext === t) return o.__reactInternalMemoizedMaskedChildContext;
  var l = {}, s;
  for (s in n) l[s] = t[s];
  return o && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
}
function Lt(e) {
  return e = e.childContextTypes, e != null;
}
function cu() {
  Te(At), Te(ft);
}
function mm(e, t, n) {
  if (ft.current !== Rr) throw Error(U(168));
  Ee(ft, t), Ee(At, n);
}
function Ny(e, t, n) {
  var o = e.stateNode;
  if (t = t.childContextTypes, typeof o.getChildContext != "function") return n;
  o = o.getChildContext();
  for (var l in o) if (!(l in t)) throw Error(U(108, lw(e) || "Unknown", l));
  return Ne({}, n, o);
}
function fu(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Rr, qr = ft.current, Ee(ft, e), Ee(At, At.current), !0;
}
function gm(e, t, n) {
  var o = e.stateNode;
  if (!o) throw Error(U(169));
  n ? (e = Ny(e, t, qr), o.__reactInternalMemoizedMergedChildContext = e, Te(At), Te(ft), Ee(ft, e)) : Te(At), Ee(At, n);
}
var Vn = null, zu = !1, Sc = !1;
function My(e) {
  Vn === null ? Vn = [e] : Vn.push(e);
}
function x_(e) {
  zu = !0, My(e);
}
function Nr() {
  if (!Sc && Vn !== null) {
    Sc = !0;
    var e = 0, t = me;
    try {
      var n = Vn;
      for (me = 1; e < n.length; e++) {
        var o = n[e];
        do
          o = o(!0);
        while (o !== null);
      }
      Vn = null, zu = !1;
    } catch (l) {
      throw Vn !== null && (Vn = Vn.slice(e + 1)), ry(nd, Nr), l;
    } finally {
      me = t, Sc = !1;
    }
  }
  return null;
}
var Mi = [], zi = 0, du = null, pu = 0, nn = [], rn = 0, $r = null, Gn = 1, Kn = "";
function Vr(e, t) {
  Mi[zi++] = pu, Mi[zi++] = du, du = e, pu = t;
}
function zy(e, t, n) {
  nn[rn++] = Gn, nn[rn++] = Kn, nn[rn++] = $r, $r = e;
  var o = Gn;
  e = Kn;
  var l = 32 - vn(o) - 1;
  o &= ~(1 << l), n += 1;
  var s = 32 - vn(t) + l;
  if (30 < s) {
    var a = l - l % 5;
    s = (o & (1 << a) - 1).toString(32), o >>= a, l -= a, Gn = 1 << 32 - vn(t) + l | n << l | o, Kn = s + e;
  } else Gn = 1 << s | n << l | o, Kn = e;
}
function fd(e) {
  e.return !== null && (Vr(e, 1), zy(e, 1, 0));
}
function dd(e) {
  for (; e === du; ) du = Mi[--zi], Mi[zi] = null, pu = Mi[--zi], Mi[zi] = null;
  for (; e === $r; ) $r = nn[--rn], nn[rn] = null, Kn = nn[--rn], nn[rn] = null, Gn = nn[--rn], nn[rn] = null;
}
var Bt = null, Ht = null, Ce = !1, yn = null;
function Iy(e, t) {
  var n = on(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function ym(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Bt = e, Ht = _r(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Bt = e, Ht = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = $r !== null ? { id: Gn, overflow: Kn } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = on(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Bt = e, Ht = null, !0) : !1;
    default:
      return !1;
  }
}
function _f(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Ef(e) {
  if (Ce) {
    var t = Ht;
    if (t) {
      var n = t;
      if (!ym(e, t)) {
        if (_f(e)) throw Error(U(418));
        t = _r(n.nextSibling);
        var o = Bt;
        t && ym(e, t) ? Iy(o, n) : (e.flags = e.flags & -4097 | 2, Ce = !1, Bt = e);
      }
    } else {
      if (_f(e)) throw Error(U(418));
      e.flags = e.flags & -4097 | 2, Ce = !1, Bt = e;
    }
  }
}
function vm(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Bt = e;
}
function Ls(e) {
  if (e !== Bt) return !1;
  if (!Ce) return vm(e), Ce = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !yf(e.type, e.memoizedProps)), t && (t = Ht)) {
    if (_f(e)) throw Oy(), Error(U(418));
    for (; t; ) Iy(e, t), t = _r(t.nextSibling);
  }
  if (vm(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(U(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Ht = _r(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Ht = null;
    }
  } else Ht = Bt ? _r(e.stateNode.nextSibling) : null;
  return !0;
}
function Oy() {
  for (var e = Ht; e; ) e = _r(e.nextSibling);
}
function Yi() {
  Ht = Bt = null, Ce = !1;
}
function pd(e) {
  yn === null ? yn = [e] : yn.push(e);
}
var k_ = qn.ReactCurrentBatchConfig;
function Mo(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(U(309));
        var o = n.stateNode;
      }
      if (!o) throw Error(U(147, e));
      var l = o, s = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === s ? t.ref : (t = function(a) {
        var d = l.refs;
        a === null ? delete d[s] : d[s] = a;
      }, t._stringRef = s, t);
    }
    if (typeof e != "string") throw Error(U(284));
    if (!n._owner) throw Error(U(290, e));
  }
  return e;
}
function Ns(e, t) {
  throw e = Object.prototype.toString.call(t), Error(U(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function Sm(e) {
  var t = e._init;
  return t(e._payload);
}
function Dy(e) {
  function t(w, S) {
    if (e) {
      var E = w.deletions;
      E === null ? (w.deletions = [S], w.flags |= 16) : E.push(S);
    }
  }
  function n(w, S) {
    if (!e) return null;
    for (; S !== null; ) t(w, S), S = S.sibling;
    return null;
  }
  function o(w, S) {
    for (w = /* @__PURE__ */ new Map(); S !== null; ) S.key !== null ? w.set(S.key, S) : w.set(S.index, S), S = S.sibling;
    return w;
  }
  function l(w, S) {
    return w = Tr(w, S), w.index = 0, w.sibling = null, w;
  }
  function s(w, S, E) {
    return w.index = E, e ? (E = w.alternate, E !== null ? (E = E.index, E < S ? (w.flags |= 2, S) : E) : (w.flags |= 2, S)) : (w.flags |= 1048576, S);
  }
  function a(w) {
    return e && w.alternate === null && (w.flags |= 2), w;
  }
  function d(w, S, E, C) {
    return S === null || S.tag !== 6 ? (S = Pc(E, w.mode, C), S.return = w, S) : (S = l(S, E), S.return = w, S);
  }
  function p(w, S, E, C) {
    var I = E.type;
    return I === Pi ? g(w, S, E.props.children, C, E.key) : S !== null && (S.elementType === I || typeof I == "object" && I !== null && I.$$typeof === fr && Sm(I) === S.type) ? (C = l(S, E.props), C.ref = Mo(w, S, E), C.return = w, C) : (C = Js(E.type, E.key, E.props, null, w.mode, C), C.ref = Mo(w, S, E), C.return = w, C);
  }
  function m(w, S, E, C) {
    return S === null || S.tag !== 4 || S.stateNode.containerInfo !== E.containerInfo || S.stateNode.implementation !== E.implementation ? (S = Cc(E, w.mode, C), S.return = w, S) : (S = l(S, E.children || []), S.return = w, S);
  }
  function g(w, S, E, C, I) {
    return S === null || S.tag !== 7 ? (S = Jr(E, w.mode, C, I), S.return = w, S) : (S = l(S, E), S.return = w, S);
  }
  function y(w, S, E) {
    if (typeof S == "string" && S !== "" || typeof S == "number") return S = Pc("" + S, w.mode, E), S.return = w, S;
    if (typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case ws:
          return E = Js(S.type, S.key, S.props, null, w.mode, E), E.ref = Mo(w, null, S), E.return = w, E;
        case Ti:
          return S = Cc(S, w.mode, E), S.return = w, S;
        case fr:
          var C = S._init;
          return y(w, C(S._payload), E);
      }
      if (Ho(S) || Co(S)) return S = Jr(S, w.mode, E, null), S.return = w, S;
      Ns(w, S);
    }
    return null;
  }
  function v(w, S, E, C) {
    var I = S !== null ? S.key : null;
    if (typeof E == "string" && E !== "" || typeof E == "number") return I !== null ? null : d(w, S, "" + E, C);
    if (typeof E == "object" && E !== null) {
      switch (E.$$typeof) {
        case ws:
          return E.key === I ? p(w, S, E, C) : null;
        case Ti:
          return E.key === I ? m(w, S, E, C) : null;
        case fr:
          return I = E._init, v(
            w,
            S,
            I(E._payload),
            C
          );
      }
      if (Ho(E) || Co(E)) return I !== null ? null : g(w, S, E, C, null);
      Ns(w, E);
    }
    return null;
  }
  function _(w, S, E, C, I) {
    if (typeof C == "string" && C !== "" || typeof C == "number") return w = w.get(E) || null, d(S, w, "" + C, I);
    if (typeof C == "object" && C !== null) {
      switch (C.$$typeof) {
        case ws:
          return w = w.get(C.key === null ? E : C.key) || null, p(S, w, C, I);
        case Ti:
          return w = w.get(C.key === null ? E : C.key) || null, m(S, w, C, I);
        case fr:
          var O = C._init;
          return _(w, S, E, O(C._payload), I);
      }
      if (Ho(C) || Co(C)) return w = w.get(E) || null, g(S, w, C, I, null);
      Ns(S, C);
    }
    return null;
  }
  function k(w, S, E, C) {
    for (var I = null, O = null, D = S, H = S = 0, J = null; D !== null && H < E.length; H++) {
      D.index > H ? (J = D, D = null) : J = D.sibling;
      var W = v(w, D, E[H], C);
      if (W === null) {
        D === null && (D = J);
        break;
      }
      e && D && W.alternate === null && t(w, D), S = s(W, S, H), O === null ? I = W : O.sibling = W, O = W, D = J;
    }
    if (H === E.length) return n(w, D), Ce && Vr(w, H), I;
    if (D === null) {
      for (; H < E.length; H++) D = y(w, E[H], C), D !== null && (S = s(D, S, H), O === null ? I = D : O.sibling = D, O = D);
      return Ce && Vr(w, H), I;
    }
    for (D = o(w, D); H < E.length; H++) J = _(D, w, H, E[H], C), J !== null && (e && J.alternate !== null && D.delete(J.key === null ? H : J.key), S = s(J, S, H), O === null ? I = J : O.sibling = J, O = J);
    return e && D.forEach(function(G) {
      return t(w, G);
    }), Ce && Vr(w, H), I;
  }
  function R(w, S, E, C) {
    var I = Co(E);
    if (typeof I != "function") throw Error(U(150));
    if (E = I.call(E), E == null) throw Error(U(151));
    for (var O = I = null, D = S, H = S = 0, J = null, W = E.next(); D !== null && !W.done; H++, W = E.next()) {
      D.index > H ? (J = D, D = null) : J = D.sibling;
      var G = v(w, D, W.value, C);
      if (G === null) {
        D === null && (D = J);
        break;
      }
      e && D && G.alternate === null && t(w, D), S = s(G, S, H), O === null ? I = G : O.sibling = G, O = G, D = J;
    }
    if (W.done) return n(
      w,
      D
    ), Ce && Vr(w, H), I;
    if (D === null) {
      for (; !W.done; H++, W = E.next()) W = y(w, W.value, C), W !== null && (S = s(W, S, H), O === null ? I = W : O.sibling = W, O = W);
      return Ce && Vr(w, H), I;
    }
    for (D = o(w, D); !W.done; H++, W = E.next()) W = _(D, w, H, W.value, C), W !== null && (e && W.alternate !== null && D.delete(W.key === null ? H : W.key), S = s(W, S, H), O === null ? I = W : O.sibling = W, O = W);
    return e && D.forEach(function(le) {
      return t(w, le);
    }), Ce && Vr(w, H), I;
  }
  function A(w, S, E, C) {
    if (typeof E == "object" && E !== null && E.type === Pi && E.key === null && (E = E.props.children), typeof E == "object" && E !== null) {
      switch (E.$$typeof) {
        case ws:
          e: {
            for (var I = E.key, O = S; O !== null; ) {
              if (O.key === I) {
                if (I = E.type, I === Pi) {
                  if (O.tag === 7) {
                    n(w, O.sibling), S = l(O, E.props.children), S.return = w, w = S;
                    break e;
                  }
                } else if (O.elementType === I || typeof I == "object" && I !== null && I.$$typeof === fr && Sm(I) === O.type) {
                  n(w, O.sibling), S = l(O, E.props), S.ref = Mo(w, O, E), S.return = w, w = S;
                  break e;
                }
                n(w, O);
                break;
              } else t(w, O);
              O = O.sibling;
            }
            E.type === Pi ? (S = Jr(E.props.children, w.mode, C, E.key), S.return = w, w = S) : (C = Js(E.type, E.key, E.props, null, w.mode, C), C.ref = Mo(w, S, E), C.return = w, w = C);
          }
          return a(w);
        case Ti:
          e: {
            for (O = E.key; S !== null; ) {
              if (S.key === O) if (S.tag === 4 && S.stateNode.containerInfo === E.containerInfo && S.stateNode.implementation === E.implementation) {
                n(w, S.sibling), S = l(S, E.children || []), S.return = w, w = S;
                break e;
              } else {
                n(w, S);
                break;
              }
              else t(w, S);
              S = S.sibling;
            }
            S = Cc(E, w.mode, C), S.return = w, w = S;
          }
          return a(w);
        case fr:
          return O = E._init, A(w, S, O(E._payload), C);
      }
      if (Ho(E)) return k(w, S, E, C);
      if (Co(E)) return R(w, S, E, C);
      Ns(w, E);
    }
    return typeof E == "string" && E !== "" || typeof E == "number" ? (E = "" + E, S !== null && S.tag === 6 ? (n(w, S.sibling), S = l(S, E), S.return = w, w = S) : (n(w, S), S = Pc(E, w.mode, C), S.return = w, w = S), a(w)) : n(w, S);
  }
  return A;
}
var Zi = Dy(!0), jy = Dy(!1), hu = Lr(null), mu = null, Ii = null, hd = null;
function md() {
  hd = Ii = mu = null;
}
function gd(e) {
  var t = hu.current;
  Te(hu), e._currentValue = t;
}
function xf(e, t, n) {
  for (; e !== null; ) {
    var o = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, o !== null && (o.childLanes |= t)) : o !== null && (o.childLanes & t) !== t && (o.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function Vi(e, t) {
  mu = e, hd = Ii = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (Rt = !0), e.firstContext = null);
}
function sn(e) {
  var t = e._currentValue;
  if (hd !== e) if (e = { context: e, memoizedValue: t, next: null }, Ii === null) {
    if (mu === null) throw Error(U(308));
    Ii = e, mu.dependencies = { lanes: 0, firstContext: e };
  } else Ii = Ii.next = e;
  return t;
}
var Qr = null;
function yd(e) {
  Qr === null ? Qr = [e] : Qr.push(e);
}
function Fy(e, t, n, o) {
  var l = t.interleaved;
  return l === null ? (n.next = n, yd(t)) : (n.next = l.next, l.next = n), t.interleaved = n, Zn(e, o);
}
function Zn(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var dr = !1;
function vd(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function Uy(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function Qn(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Er(e, t, n) {
  var o = e.updateQueue;
  if (o === null) return null;
  if (o = o.shared, ce & 2) {
    var l = o.pending;
    return l === null ? t.next = t : (t.next = l.next, l.next = t), o.pending = t, Zn(e, n);
  }
  return l = o.interleaved, l === null ? (t.next = t, yd(o)) : (t.next = l.next, l.next = t), o.interleaved = t, Zn(e, n);
}
function Gs(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var o = t.lanes;
    o &= e.pendingLanes, n |= o, t.lanes = n, rd(e, n);
  }
}
function wm(e, t) {
  var n = e.updateQueue, o = e.alternate;
  if (o !== null && (o = o.updateQueue, n === o)) {
    var l = null, s = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var a = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        s === null ? l = s = a : s = s.next = a, n = n.next;
      } while (n !== null);
      s === null ? l = s = t : s = s.next = t;
    } else l = s = t;
    n = { baseState: o.baseState, firstBaseUpdate: l, lastBaseUpdate: s, shared: o.shared, effects: o.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function gu(e, t, n, o) {
  var l = e.updateQueue;
  dr = !1;
  var s = l.firstBaseUpdate, a = l.lastBaseUpdate, d = l.shared.pending;
  if (d !== null) {
    l.shared.pending = null;
    var p = d, m = p.next;
    p.next = null, a === null ? s = m : a.next = m, a = p;
    var g = e.alternate;
    g !== null && (g = g.updateQueue, d = g.lastBaseUpdate, d !== a && (d === null ? g.firstBaseUpdate = m : d.next = m, g.lastBaseUpdate = p));
  }
  if (s !== null) {
    var y = l.baseState;
    a = 0, g = m = p = null, d = s;
    do {
      var v = d.lane, _ = d.eventTime;
      if ((o & v) === v) {
        g !== null && (g = g.next = {
          eventTime: _,
          lane: 0,
          tag: d.tag,
          payload: d.payload,
          callback: d.callback,
          next: null
        });
        e: {
          var k = e, R = d;
          switch (v = t, _ = n, R.tag) {
            case 1:
              if (k = R.payload, typeof k == "function") {
                y = k.call(_, y, v);
                break e;
              }
              y = k;
              break e;
            case 3:
              k.flags = k.flags & -65537 | 128;
            case 0:
              if (k = R.payload, v = typeof k == "function" ? k.call(_, y, v) : k, v == null) break e;
              y = Ne({}, y, v);
              break e;
            case 2:
              dr = !0;
          }
        }
        d.callback !== null && d.lane !== 0 && (e.flags |= 64, v = l.effects, v === null ? l.effects = [d] : v.push(d));
      } else _ = { eventTime: _, lane: v, tag: d.tag, payload: d.payload, callback: d.callback, next: null }, g === null ? (m = g = _, p = y) : g = g.next = _, a |= v;
      if (d = d.next, d === null) {
        if (d = l.shared.pending, d === null) break;
        v = d, d = v.next, v.next = null, l.lastBaseUpdate = v, l.shared.pending = null;
      }
    } while (!0);
    if (g === null && (p = y), l.baseState = p, l.firstBaseUpdate = m, l.lastBaseUpdate = g, t = l.shared.interleaved, t !== null) {
      l = t;
      do
        a |= l.lane, l = l.next;
      while (l !== t);
    } else s === null && (l.shared.lanes = 0);
    ei |= a, e.lanes = a, e.memoizedState = y;
  }
}
function _m(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var o = e[t], l = o.callback;
    if (l !== null) {
      if (o.callback = null, o = n, typeof l != "function") throw Error(U(191, l));
      l.call(o);
    }
  }
}
var _l = {}, Mn = Lr(_l), fl = Lr(_l), dl = Lr(_l);
function Xr(e) {
  if (e === _l) throw Error(U(174));
  return e;
}
function Sd(e, t) {
  switch (Ee(dl, t), Ee(fl, e), Ee(Mn, _l), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : nf(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = nf(t, e);
  }
  Te(Mn), Ee(Mn, t);
}
function Ji() {
  Te(Mn), Te(fl), Te(dl);
}
function Hy(e) {
  Xr(dl.current);
  var t = Xr(Mn.current), n = nf(t, e.type);
  t !== n && (Ee(fl, e), Ee(Mn, n));
}
function wd(e) {
  fl.current === e && (Te(Mn), Te(fl));
}
var Ae = Lr(0);
function yu(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || n.data === "$!")) return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      t.child.return = t, t = t.child;
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    t.sibling.return = t.return, t = t.sibling;
  }
  return null;
}
var wc = [];
function _d() {
  for (var e = 0; e < wc.length; e++) wc[e]._workInProgressVersionPrimary = null;
  wc.length = 0;
}
var Ks = qn.ReactCurrentDispatcher, _c = qn.ReactCurrentBatchConfig, br = 0, Le = null, We = null, Ye = null, vu = !1, Jo = !1, pl = 0, T_ = 0;
function st() {
  throw Error(U(321));
}
function Ed(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!wn(e[n], t[n])) return !1;
  return !0;
}
function xd(e, t, n, o, l, s) {
  if (br = s, Le = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Ks.current = e === null || e.memoizedState === null ? A_ : L_, e = n(o, l), Jo) {
    s = 0;
    do {
      if (Jo = !1, pl = 0, 25 <= s) throw Error(U(301));
      s += 1, Ye = We = null, t.updateQueue = null, Ks.current = N_, e = n(o, l);
    } while (Jo);
  }
  if (Ks.current = Su, t = We !== null && We.next !== null, br = 0, Ye = We = Le = null, vu = !1, t) throw Error(U(300));
  return e;
}
function kd() {
  var e = pl !== 0;
  return pl = 0, e;
}
function An() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return Ye === null ? Le.memoizedState = Ye = e : Ye = Ye.next = e, Ye;
}
function un() {
  if (We === null) {
    var e = Le.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = We.next;
  var t = Ye === null ? Le.memoizedState : Ye.next;
  if (t !== null) Ye = t, We = e;
  else {
    if (e === null) throw Error(U(310));
    We = e, e = { memoizedState: We.memoizedState, baseState: We.baseState, baseQueue: We.baseQueue, queue: We.queue, next: null }, Ye === null ? Le.memoizedState = Ye = e : Ye = Ye.next = e;
  }
  return Ye;
}
function hl(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function Ec(e) {
  var t = un(), n = t.queue;
  if (n === null) throw Error(U(311));
  n.lastRenderedReducer = e;
  var o = We, l = o.baseQueue, s = n.pending;
  if (s !== null) {
    if (l !== null) {
      var a = l.next;
      l.next = s.next, s.next = a;
    }
    o.baseQueue = l = s, n.pending = null;
  }
  if (l !== null) {
    s = l.next, o = o.baseState;
    var d = a = null, p = null, m = s;
    do {
      var g = m.lane;
      if ((br & g) === g) p !== null && (p = p.next = { lane: 0, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), o = m.hasEagerState ? m.eagerState : e(o, m.action);
      else {
        var y = {
          lane: g,
          action: m.action,
          hasEagerState: m.hasEagerState,
          eagerState: m.eagerState,
          next: null
        };
        p === null ? (d = p = y, a = o) : p = p.next = y, Le.lanes |= g, ei |= g;
      }
      m = m.next;
    } while (m !== null && m !== s);
    p === null ? a = o : p.next = d, wn(o, t.memoizedState) || (Rt = !0), t.memoizedState = o, t.baseState = a, t.baseQueue = p, n.lastRenderedState = o;
  }
  if (e = n.interleaved, e !== null) {
    l = e;
    do
      s = l.lane, Le.lanes |= s, ei |= s, l = l.next;
    while (l !== e);
  } else l === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function xc(e) {
  var t = un(), n = t.queue;
  if (n === null) throw Error(U(311));
  n.lastRenderedReducer = e;
  var o = n.dispatch, l = n.pending, s = t.memoizedState;
  if (l !== null) {
    n.pending = null;
    var a = l = l.next;
    do
      s = e(s, a.action), a = a.next;
    while (a !== l);
    wn(s, t.memoizedState) || (Rt = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), n.lastRenderedState = s;
  }
  return [s, o];
}
function By() {
}
function Wy(e, t) {
  var n = Le, o = un(), l = t(), s = !wn(o.memoizedState, l);
  if (s && (o.memoizedState = l, Rt = !0), o = o.queue, Td(Ky.bind(null, n, o, e), [e]), o.getSnapshot !== t || s || Ye !== null && Ye.memoizedState.tag & 1) {
    if (n.flags |= 2048, ml(9, Gy.bind(null, n, o, l, t), void 0, null), Ze === null) throw Error(U(349));
    br & 30 || Vy(n, t, l);
  }
  return l;
}
function Vy(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = Le.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Le.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function Gy(e, t, n, o) {
  t.value = n, t.getSnapshot = o, Qy(t) && Xy(e);
}
function Ky(e, t, n) {
  return n(function() {
    Qy(t) && Xy(e);
  });
}
function Qy(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !wn(e, n);
  } catch {
    return !0;
  }
}
function Xy(e) {
  var t = Zn(e, 1);
  t !== null && Sn(t, e, 1, -1);
}
function Em(e) {
  var t = An();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: hl, lastRenderedState: e }, t.queue = e, e = e.dispatch = R_.bind(null, Le, e), [t.memoizedState, e];
}
function ml(e, t, n, o) {
  return e = { tag: e, create: t, destroy: n, deps: o, next: null }, t = Le.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Le.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (o = n.next, n.next = e, e.next = o, t.lastEffect = e)), e;
}
function Yy() {
  return un().memoizedState;
}
function Qs(e, t, n, o) {
  var l = An();
  Le.flags |= e, l.memoizedState = ml(1 | t, n, void 0, o === void 0 ? null : o);
}
function Iu(e, t, n, o) {
  var l = un();
  o = o === void 0 ? null : o;
  var s = void 0;
  if (We !== null) {
    var a = We.memoizedState;
    if (s = a.destroy, o !== null && Ed(o, a.deps)) {
      l.memoizedState = ml(t, n, s, o);
      return;
    }
  }
  Le.flags |= e, l.memoizedState = ml(1 | t, n, s, o);
}
function xm(e, t) {
  return Qs(8390656, 8, e, t);
}
function Td(e, t) {
  return Iu(2048, 8, e, t);
}
function Zy(e, t) {
  return Iu(4, 2, e, t);
}
function Jy(e, t) {
  return Iu(4, 4, e, t);
}
function qy(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function $y(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Iu(4, 4, qy.bind(null, t, e), n);
}
function Pd() {
}
function by(e, t) {
  var n = un();
  t = t === void 0 ? null : t;
  var o = n.memoizedState;
  return o !== null && t !== null && Ed(t, o[1]) ? o[0] : (n.memoizedState = [e, t], e);
}
function ev(e, t) {
  var n = un();
  t = t === void 0 ? null : t;
  var o = n.memoizedState;
  return o !== null && t !== null && Ed(t, o[1]) ? o[0] : (e = e(), n.memoizedState = [e, t], e);
}
function tv(e, t, n) {
  return br & 21 ? (wn(n, t) || (n = ly(), Le.lanes |= n, ei |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Rt = !0), e.memoizedState = n);
}
function P_(e, t) {
  var n = me;
  me = n !== 0 && 4 > n ? n : 4, e(!0);
  var o = _c.transition;
  _c.transition = {};
  try {
    e(!1), t();
  } finally {
    me = n, _c.transition = o;
  }
}
function nv() {
  return un().memoizedState;
}
function C_(e, t, n) {
  var o = kr(e);
  if (n = { lane: o, action: n, hasEagerState: !1, eagerState: null, next: null }, rv(e)) iv(t, n);
  else if (n = Fy(e, t, n, o), n !== null) {
    var l = mt();
    Sn(n, e, o, l), ov(n, t, o);
  }
}
function R_(e, t, n) {
  var o = kr(e), l = { lane: o, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (rv(e)) iv(t, l);
  else {
    var s = e.alternate;
    if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
      var a = t.lastRenderedState, d = s(a, n);
      if (l.hasEagerState = !0, l.eagerState = d, wn(d, a)) {
        var p = t.interleaved;
        p === null ? (l.next = l, yd(t)) : (l.next = p.next, p.next = l), t.interleaved = l;
        return;
      }
    } catch {
    } finally {
    }
    n = Fy(e, t, l, o), n !== null && (l = mt(), Sn(n, e, o, l), ov(n, t, o));
  }
}
function rv(e) {
  var t = e.alternate;
  return e === Le || t !== null && t === Le;
}
function iv(e, t) {
  Jo = vu = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function ov(e, t, n) {
  if (n & 4194240) {
    var o = t.lanes;
    o &= e.pendingLanes, n |= o, t.lanes = n, rd(e, n);
  }
}
var Su = { readContext: sn, useCallback: st, useContext: st, useEffect: st, useImperativeHandle: st, useInsertionEffect: st, useLayoutEffect: st, useMemo: st, useReducer: st, useRef: st, useState: st, useDebugValue: st, useDeferredValue: st, useTransition: st, useMutableSource: st, useSyncExternalStore: st, useId: st, unstable_isNewReconciler: !1 }, A_ = { readContext: sn, useCallback: function(e, t) {
  return An().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: sn, useEffect: xm, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Qs(
    4194308,
    4,
    qy.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return Qs(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return Qs(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = An();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var o = An();
  return t = n !== void 0 ? n(t) : t, o.memoizedState = o.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, o.queue = e, e = e.dispatch = C_.bind(null, Le, e), [o.memoizedState, e];
}, useRef: function(e) {
  var t = An();
  return e = { current: e }, t.memoizedState = e;
}, useState: Em, useDebugValue: Pd, useDeferredValue: function(e) {
  return An().memoizedState = e;
}, useTransition: function() {
  var e = Em(!1), t = e[0];
  return e = P_.bind(null, e[1]), An().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var o = Le, l = An();
  if (Ce) {
    if (n === void 0) throw Error(U(407));
    n = n();
  } else {
    if (n = t(), Ze === null) throw Error(U(349));
    br & 30 || Vy(o, t, n);
  }
  l.memoizedState = n;
  var s = { value: n, getSnapshot: t };
  return l.queue = s, xm(Ky.bind(
    null,
    o,
    s,
    e
  ), [e]), o.flags |= 2048, ml(9, Gy.bind(null, o, s, n, t), void 0, null), n;
}, useId: function() {
  var e = An(), t = Ze.identifierPrefix;
  if (Ce) {
    var n = Kn, o = Gn;
    n = (o & ~(1 << 32 - vn(o) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = pl++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = T_++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, L_ = {
  readContext: sn,
  useCallback: by,
  useContext: sn,
  useEffect: Td,
  useImperativeHandle: $y,
  useInsertionEffect: Zy,
  useLayoutEffect: Jy,
  useMemo: ev,
  useReducer: Ec,
  useRef: Yy,
  useState: function() {
    return Ec(hl);
  },
  useDebugValue: Pd,
  useDeferredValue: function(e) {
    var t = un();
    return tv(t, We.memoizedState, e);
  },
  useTransition: function() {
    var e = Ec(hl)[0], t = un().memoizedState;
    return [e, t];
  },
  useMutableSource: By,
  useSyncExternalStore: Wy,
  useId: nv,
  unstable_isNewReconciler: !1
}, N_ = { readContext: sn, useCallback: by, useContext: sn, useEffect: Td, useImperativeHandle: $y, useInsertionEffect: Zy, useLayoutEffect: Jy, useMemo: ev, useReducer: xc, useRef: Yy, useState: function() {
  return xc(hl);
}, useDebugValue: Pd, useDeferredValue: function(e) {
  var t = un();
  return We === null ? t.memoizedState = e : tv(t, We.memoizedState, e);
}, useTransition: function() {
  var e = xc(hl)[0], t = un().memoizedState;
  return [e, t];
}, useMutableSource: By, useSyncExternalStore: Wy, useId: nv, unstable_isNewReconciler: !1 };
function mn(e, t) {
  if (e && e.defaultProps) {
    t = Ne({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function kf(e, t, n, o) {
  t = e.memoizedState, n = n(o, t), n = n == null ? t : Ne({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var Ou = { isMounted: function(e) {
  return (e = e._reactInternals) ? ri(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var o = mt(), l = kr(e), s = Qn(o, l);
  s.payload = t, n != null && (s.callback = n), t = Er(e, s, l), t !== null && (Sn(t, e, l, o), Gs(t, e, l));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var o = mt(), l = kr(e), s = Qn(o, l);
  s.tag = 1, s.payload = t, n != null && (s.callback = n), t = Er(e, s, l), t !== null && (Sn(t, e, l, o), Gs(t, e, l));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = mt(), o = kr(e), l = Qn(n, o);
  l.tag = 2, t != null && (l.callback = t), t = Er(e, l, o), t !== null && (Sn(t, e, o, n), Gs(t, e, o));
} };
function km(e, t, n, o, l, s, a) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(o, s, a) : t.prototype && t.prototype.isPureReactComponent ? !sl(n, o) || !sl(l, s) : !0;
}
function lv(e, t, n) {
  var o = !1, l = Rr, s = t.contextType;
  return typeof s == "object" && s !== null ? s = sn(s) : (l = Lt(t) ? qr : ft.current, o = t.contextTypes, s = (o = o != null) ? Xi(e, l) : Rr), t = new t(n, s), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Ou, e.stateNode = t, t._reactInternals = e, o && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = s), t;
}
function Tm(e, t, n, o) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, o), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, o), t.state !== e && Ou.enqueueReplaceState(t, t.state, null);
}
function Tf(e, t, n, o) {
  var l = e.stateNode;
  l.props = n, l.state = e.memoizedState, l.refs = {}, vd(e);
  var s = t.contextType;
  typeof s == "object" && s !== null ? l.context = sn(s) : (s = Lt(t) ? qr : ft.current, l.context = Xi(e, s)), l.state = e.memoizedState, s = t.getDerivedStateFromProps, typeof s == "function" && (kf(e, t, s, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && Ou.enqueueReplaceState(l, l.state, null), gu(e, n, l, o), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
}
function qi(e, t) {
  try {
    var n = "", o = t;
    do
      n += ow(o), o = o.return;
    while (o);
    var l = n;
  } catch (s) {
    l = `
Error generating stack: ` + s.message + `
` + s.stack;
  }
  return { value: e, source: t, stack: l, digest: null };
}
function kc(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Pf(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var M_ = typeof WeakMap == "function" ? WeakMap : Map;
function sv(e, t, n) {
  n = Qn(-1, n), n.tag = 3, n.payload = { element: null };
  var o = t.value;
  return n.callback = function() {
    _u || (_u = !0, Df = o), Pf(e, t);
  }, n;
}
function uv(e, t, n) {
  n = Qn(-1, n), n.tag = 3;
  var o = e.type.getDerivedStateFromError;
  if (typeof o == "function") {
    var l = t.value;
    n.payload = function() {
      return o(l);
    }, n.callback = function() {
      Pf(e, t);
    };
  }
  var s = e.stateNode;
  return s !== null && typeof s.componentDidCatch == "function" && (n.callback = function() {
    Pf(e, t), typeof o != "function" && (xr === null ? xr = /* @__PURE__ */ new Set([this]) : xr.add(this));
    var a = t.stack;
    this.componentDidCatch(t.value, { componentStack: a !== null ? a : "" });
  }), n;
}
function Pm(e, t, n) {
  var o = e.pingCache;
  if (o === null) {
    o = e.pingCache = new M_();
    var l = /* @__PURE__ */ new Set();
    o.set(t, l);
  } else l = o.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), o.set(t, l));
  l.has(n) || (l.add(n), e = Q_.bind(null, e, t, n), t.then(e, e));
}
function Cm(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Rm(e, t, n, o, l) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = l, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = Qn(-1, 1), t.tag = 2, Er(n, t, 1))), n.lanes |= 1), e);
}
var z_ = qn.ReactCurrentOwner, Rt = !1;
function ht(e, t, n, o) {
  t.child = e === null ? jy(t, null, n, o) : Zi(t, e.child, n, o);
}
function Am(e, t, n, o, l) {
  n = n.render;
  var s = t.ref;
  return Vi(t, l), o = xd(e, t, n, o, s, l), n = kd(), e !== null && !Rt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Jn(e, t, l)) : (Ce && n && fd(t), t.flags |= 1, ht(e, t, o, l), t.child);
}
function Lm(e, t, n, o, l) {
  if (e === null) {
    var s = n.type;
    return typeof s == "function" && !Id(s) && s.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = s, av(e, t, s, o, l)) : (e = Js(n.type, null, o, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (s = e.child, !(e.lanes & l)) {
    var a = s.memoizedProps;
    if (n = n.compare, n = n !== null ? n : sl, n(a, o) && e.ref === t.ref) return Jn(e, t, l);
  }
  return t.flags |= 1, e = Tr(s, o), e.ref = t.ref, e.return = t, t.child = e;
}
function av(e, t, n, o, l) {
  if (e !== null) {
    var s = e.memoizedProps;
    if (sl(s, o) && e.ref === t.ref) if (Rt = !1, t.pendingProps = o = s, (e.lanes & l) !== 0) e.flags & 131072 && (Rt = !0);
    else return t.lanes = e.lanes, Jn(e, t, l);
  }
  return Cf(e, t, n, o, l);
}
function cv(e, t, n) {
  var o = t.pendingProps, l = o.children, s = e !== null ? e.memoizedState : null;
  if (o.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, Ee(Di, Ut), Ut |= n;
  else {
    if (!(n & 1073741824)) return e = s !== null ? s.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, Ee(Di, Ut), Ut |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, o = s !== null ? s.baseLanes : n, Ee(Di, Ut), Ut |= o;
  }
  else s !== null ? (o = s.baseLanes | n, t.memoizedState = null) : o = n, Ee(Di, Ut), Ut |= o;
  return ht(e, t, l, n), t.child;
}
function fv(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Cf(e, t, n, o, l) {
  var s = Lt(n) ? qr : ft.current;
  return s = Xi(t, s), Vi(t, l), n = xd(e, t, n, o, s, l), o = kd(), e !== null && !Rt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, Jn(e, t, l)) : (Ce && o && fd(t), t.flags |= 1, ht(e, t, n, l), t.child);
}
function Nm(e, t, n, o, l) {
  if (Lt(n)) {
    var s = !0;
    fu(t);
  } else s = !1;
  if (Vi(t, l), t.stateNode === null) Xs(e, t), lv(t, n, o), Tf(t, n, o, l), o = !0;
  else if (e === null) {
    var a = t.stateNode, d = t.memoizedProps;
    a.props = d;
    var p = a.context, m = n.contextType;
    typeof m == "object" && m !== null ? m = sn(m) : (m = Lt(n) ? qr : ft.current, m = Xi(t, m));
    var g = n.getDerivedStateFromProps, y = typeof g == "function" || typeof a.getSnapshotBeforeUpdate == "function";
    y || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (d !== o || p !== m) && Tm(t, a, o, m), dr = !1;
    var v = t.memoizedState;
    a.state = v, gu(t, o, a, l), p = t.memoizedState, d !== o || v !== p || At.current || dr ? (typeof g == "function" && (kf(t, n, g, o), p = t.memoizedState), (d = dr || km(t, n, d, o, v, p, m)) ? (y || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = o, t.memoizedState = p), a.props = o, a.state = p, a.context = m, o = d) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), o = !1);
  } else {
    a = t.stateNode, Uy(e, t), d = t.memoizedProps, m = t.type === t.elementType ? d : mn(t.type, d), a.props = m, y = t.pendingProps, v = a.context, p = n.contextType, typeof p == "object" && p !== null ? p = sn(p) : (p = Lt(n) ? qr : ft.current, p = Xi(t, p));
    var _ = n.getDerivedStateFromProps;
    (g = typeof _ == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (d !== y || v !== p) && Tm(t, a, o, p), dr = !1, v = t.memoizedState, a.state = v, gu(t, o, a, l);
    var k = t.memoizedState;
    d !== y || v !== k || At.current || dr ? (typeof _ == "function" && (kf(t, n, _, o), k = t.memoizedState), (m = dr || km(t, n, m, o, v, k, p) || !1) ? (g || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(o, k, p), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(o, k, p)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || d === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || d === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = o, t.memoizedState = k), a.props = o, a.state = k, a.context = p, o = m) : (typeof a.componentDidUpdate != "function" || d === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || d === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), o = !1);
  }
  return Rf(e, t, n, o, s, l);
}
function Rf(e, t, n, o, l, s) {
  fv(e, t);
  var a = (t.flags & 128) !== 0;
  if (!o && !a) return l && gm(t, n, !1), Jn(e, t, s);
  o = t.stateNode, z_.current = t;
  var d = a && typeof n.getDerivedStateFromError != "function" ? null : o.render();
  return t.flags |= 1, e !== null && a ? (t.child = Zi(t, e.child, null, s), t.child = Zi(t, null, d, s)) : ht(e, t, d, s), t.memoizedState = o.state, l && gm(t, n, !0), t.child;
}
function dv(e) {
  var t = e.stateNode;
  t.pendingContext ? mm(e, t.pendingContext, t.pendingContext !== t.context) : t.context && mm(e, t.context, !1), Sd(e, t.containerInfo);
}
function Mm(e, t, n, o, l) {
  return Yi(), pd(l), t.flags |= 256, ht(e, t, n, o), t.child;
}
var Af = { dehydrated: null, treeContext: null, retryLane: 0 };
function Lf(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function pv(e, t, n) {
  var o = t.pendingProps, l = Ae.current, s = !1, a = (t.flags & 128) !== 0, d;
  if ((d = a) || (d = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), d ? (s = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), Ee(Ae, l & 1), e === null)
    return Ef(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (a = o.children, e = o.fallback, s ? (o = t.mode, s = t.child, a = { mode: "hidden", children: a }, !(o & 1) && s !== null ? (s.childLanes = 0, s.pendingProps = a) : s = Fu(a, o, 0, null), e = Jr(e, o, n, null), s.return = t, e.return = t, s.sibling = e, t.child = s, t.child.memoizedState = Lf(n), t.memoizedState = Af, e) : Cd(t, a));
  if (l = e.memoizedState, l !== null && (d = l.dehydrated, d !== null)) return I_(e, t, a, o, d, l, n);
  if (s) {
    s = o.fallback, a = t.mode, l = e.child, d = l.sibling;
    var p = { mode: "hidden", children: o.children };
    return !(a & 1) && t.child !== l ? (o = t.child, o.childLanes = 0, o.pendingProps = p, t.deletions = null) : (o = Tr(l, p), o.subtreeFlags = l.subtreeFlags & 14680064), d !== null ? s = Tr(d, s) : (s = Jr(s, a, n, null), s.flags |= 2), s.return = t, o.return = t, o.sibling = s, t.child = o, o = s, s = t.child, a = e.child.memoizedState, a = a === null ? Lf(n) : { baseLanes: a.baseLanes | n, cachePool: null, transitions: a.transitions }, s.memoizedState = a, s.childLanes = e.childLanes & ~n, t.memoizedState = Af, o;
  }
  return s = e.child, e = s.sibling, o = Tr(s, { mode: "visible", children: o.children }), !(t.mode & 1) && (o.lanes = n), o.return = t, o.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = o, t.memoizedState = null, o;
}
function Cd(e, t) {
  return t = Fu({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function Ms(e, t, n, o) {
  return o !== null && pd(o), Zi(t, e.child, null, n), e = Cd(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function I_(e, t, n, o, l, s, a) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, o = kc(Error(U(422))), Ms(e, t, a, o)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (s = o.fallback, l = t.mode, o = Fu({ mode: "visible", children: o.children }, l, 0, null), s = Jr(s, l, a, null), s.flags |= 2, o.return = t, s.return = t, o.sibling = s, t.child = o, t.mode & 1 && Zi(t, e.child, null, a), t.child.memoizedState = Lf(a), t.memoizedState = Af, s);
  if (!(t.mode & 1)) return Ms(e, t, a, null);
  if (l.data === "$!") {
    if (o = l.nextSibling && l.nextSibling.dataset, o) var d = o.dgst;
    return o = d, s = Error(U(419)), o = kc(s, o, void 0), Ms(e, t, a, o);
  }
  if (d = (a & e.childLanes) !== 0, Rt || d) {
    if (o = Ze, o !== null) {
      switch (a & -a) {
        case 4:
          l = 2;
          break;
        case 16:
          l = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          l = 32;
          break;
        case 536870912:
          l = 268435456;
          break;
        default:
          l = 0;
      }
      l = l & (o.suspendedLanes | a) ? 0 : l, l !== 0 && l !== s.retryLane && (s.retryLane = l, Zn(e, l), Sn(o, e, l, -1));
    }
    return zd(), o = kc(Error(U(421))), Ms(e, t, a, o);
  }
  return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = X_.bind(null, e), l._reactRetry = t, null) : (e = s.treeContext, Ht = _r(l.nextSibling), Bt = t, Ce = !0, yn = null, e !== null && (nn[rn++] = Gn, nn[rn++] = Kn, nn[rn++] = $r, Gn = e.id, Kn = e.overflow, $r = t), t = Cd(t, o.children), t.flags |= 4096, t);
}
function zm(e, t, n) {
  e.lanes |= t;
  var o = e.alternate;
  o !== null && (o.lanes |= t), xf(e.return, t, n);
}
function Tc(e, t, n, o, l) {
  var s = e.memoizedState;
  s === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: o, tail: n, tailMode: l } : (s.isBackwards = t, s.rendering = null, s.renderingStartTime = 0, s.last = o, s.tail = n, s.tailMode = l);
}
function hv(e, t, n) {
  var o = t.pendingProps, l = o.revealOrder, s = o.tail;
  if (ht(e, t, o.children, n), o = Ae.current, o & 2) o = o & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && zm(e, n, t);
      else if (e.tag === 19) zm(e, n, t);
      else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break e;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) break e;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    o &= 1;
  }
  if (Ee(Ae, o), !(t.mode & 1)) t.memoizedState = null;
  else switch (l) {
    case "forwards":
      for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && yu(e) === null && (l = n), n = n.sibling;
      n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), Tc(t, !1, l, n, s);
      break;
    case "backwards":
      for (n = null, l = t.child, t.child = null; l !== null; ) {
        if (e = l.alternate, e !== null && yu(e) === null) {
          t.child = l;
          break;
        }
        e = l.sibling, l.sibling = n, n = l, l = e;
      }
      Tc(t, !0, n, null, s);
      break;
    case "together":
      Tc(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function Xs(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function Jn(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), ei |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(U(153));
  if (t.child !== null) {
    for (e = t.child, n = Tr(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Tr(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function O_(e, t, n) {
  switch (t.tag) {
    case 3:
      dv(t), Yi();
      break;
    case 5:
      Hy(t);
      break;
    case 1:
      Lt(t.type) && fu(t);
      break;
    case 4:
      Sd(t, t.stateNode.containerInfo);
      break;
    case 10:
      var o = t.type._context, l = t.memoizedProps.value;
      Ee(hu, o._currentValue), o._currentValue = l;
      break;
    case 13:
      if (o = t.memoizedState, o !== null)
        return o.dehydrated !== null ? (Ee(Ae, Ae.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? pv(e, t, n) : (Ee(Ae, Ae.current & 1), e = Jn(e, t, n), e !== null ? e.sibling : null);
      Ee(Ae, Ae.current & 1);
      break;
    case 19:
      if (o = (n & t.childLanes) !== 0, e.flags & 128) {
        if (o) return hv(e, t, n);
        t.flags |= 128;
      }
      if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), Ee(Ae, Ae.current), o) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, cv(e, t, n);
  }
  return Jn(e, t, n);
}
var mv, Nf, gv, yv;
mv = function(e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      n.child.return = n, n = n.child;
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    n.sibling.return = n.return, n = n.sibling;
  }
};
Nf = function() {
};
gv = function(e, t, n, o) {
  var l = e.memoizedProps;
  if (l !== o) {
    e = t.stateNode, Xr(Mn.current);
    var s = null;
    switch (n) {
      case "input":
        l = $c(e, l), o = $c(e, o), s = [];
        break;
      case "select":
        l = Ne({}, l, { value: void 0 }), o = Ne({}, o, { value: void 0 }), s = [];
        break;
      case "textarea":
        l = tf(e, l), o = tf(e, o), s = [];
        break;
      default:
        typeof l.onClick != "function" && typeof o.onClick == "function" && (e.onclick = au);
    }
    rf(n, o);
    var a;
    n = null;
    for (m in l) if (!o.hasOwnProperty(m) && l.hasOwnProperty(m) && l[m] != null) if (m === "style") {
      var d = l[m];
      for (a in d) d.hasOwnProperty(a) && (n || (n = {}), n[a] = "");
    } else m !== "dangerouslySetInnerHTML" && m !== "children" && m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && m !== "autoFocus" && (el.hasOwnProperty(m) ? s || (s = []) : (s = s || []).push(m, null));
    for (m in o) {
      var p = o[m];
      if (d = l != null ? l[m] : void 0, o.hasOwnProperty(m) && p !== d && (p != null || d != null)) if (m === "style") if (d) {
        for (a in d) !d.hasOwnProperty(a) || p && p.hasOwnProperty(a) || (n || (n = {}), n[a] = "");
        for (a in p) p.hasOwnProperty(a) && d[a] !== p[a] && (n || (n = {}), n[a] = p[a]);
      } else n || (s || (s = []), s.push(
        m,
        n
      )), n = p;
      else m === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, d = d ? d.__html : void 0, p != null && d !== p && (s = s || []).push(m, p)) : m === "children" ? typeof p != "string" && typeof p != "number" || (s = s || []).push(m, "" + p) : m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && (el.hasOwnProperty(m) ? (p != null && m === "onScroll" && ke("scroll", e), s || d === p || (s = [])) : (s = s || []).push(m, p));
    }
    n && (s = s || []).push("style", n);
    var m = s;
    (t.updateQueue = m) && (t.flags |= 4);
  }
};
yv = function(e, t, n, o) {
  n !== o && (t.flags |= 4);
};
function zo(e, t) {
  if (!Ce) switch (e.tailMode) {
    case "hidden":
      t = e.tail;
      for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
      n === null ? e.tail = null : n.sibling = null;
      break;
    case "collapsed":
      n = e.tail;
      for (var o = null; n !== null; ) n.alternate !== null && (o = n), n = n.sibling;
      o === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : o.sibling = null;
  }
}
function ut(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, o = 0;
  if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, o |= l.subtreeFlags & 14680064, o |= l.flags & 14680064, l.return = e, l = l.sibling;
  else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, o |= l.subtreeFlags, o |= l.flags, l.return = e, l = l.sibling;
  return e.subtreeFlags |= o, e.childLanes = n, t;
}
function D_(e, t, n) {
  var o = t.pendingProps;
  switch (dd(t), t.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ut(t), null;
    case 1:
      return Lt(t.type) && cu(), ut(t), null;
    case 3:
      return o = t.stateNode, Ji(), Te(At), Te(ft), _d(), o.pendingContext && (o.context = o.pendingContext, o.pendingContext = null), (e === null || e.child === null) && (Ls(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, yn !== null && (Uf(yn), yn = null))), Nf(e, t), ut(t), null;
    case 5:
      wd(t);
      var l = Xr(dl.current);
      if (n = t.type, e !== null && t.stateNode != null) gv(e, t, n, o, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!o) {
          if (t.stateNode === null) throw Error(U(166));
          return ut(t), null;
        }
        if (e = Xr(Mn.current), Ls(t)) {
          o = t.stateNode, n = t.type;
          var s = t.memoizedProps;
          switch (o[Ln] = t, o[cl] = s, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              ke("cancel", o), ke("close", o);
              break;
            case "iframe":
            case "object":
            case "embed":
              ke("load", o);
              break;
            case "video":
            case "audio":
              for (l = 0; l < Wo.length; l++) ke(Wo[l], o);
              break;
            case "source":
              ke("error", o);
              break;
            case "img":
            case "image":
            case "link":
              ke(
                "error",
                o
              ), ke("load", o);
              break;
            case "details":
              ke("toggle", o);
              break;
            case "input":
              Wh(o, s), ke("invalid", o);
              break;
            case "select":
              o._wrapperState = { wasMultiple: !!s.multiple }, ke("invalid", o);
              break;
            case "textarea":
              Gh(o, s), ke("invalid", o);
          }
          rf(n, s), l = null;
          for (var a in s) if (s.hasOwnProperty(a)) {
            var d = s[a];
            a === "children" ? typeof d == "string" ? o.textContent !== d && (s.suppressHydrationWarning !== !0 && As(o.textContent, d, e), l = ["children", d]) : typeof d == "number" && o.textContent !== "" + d && (s.suppressHydrationWarning !== !0 && As(
              o.textContent,
              d,
              e
            ), l = ["children", "" + d]) : el.hasOwnProperty(a) && d != null && a === "onScroll" && ke("scroll", o);
          }
          switch (n) {
            case "input":
              _s(o), Vh(o, s, !0);
              break;
            case "textarea":
              _s(o), Kh(o);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof s.onClick == "function" && (o.onclick = au);
          }
          o = l, t.updateQueue = o, o !== null && (t.flags |= 4);
        } else {
          a = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Kg(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = a.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof o.is == "string" ? e = a.createElement(n, { is: o.is }) : (e = a.createElement(n), n === "select" && (a = e, o.multiple ? a.multiple = !0 : o.size && (a.size = o.size))) : e = a.createElementNS(e, n), e[Ln] = t, e[cl] = o, mv(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (a = of(n, o), n) {
              case "dialog":
                ke("cancel", e), ke("close", e), l = o;
                break;
              case "iframe":
              case "object":
              case "embed":
                ke("load", e), l = o;
                break;
              case "video":
              case "audio":
                for (l = 0; l < Wo.length; l++) ke(Wo[l], e);
                l = o;
                break;
              case "source":
                ke("error", e), l = o;
                break;
              case "img":
              case "image":
              case "link":
                ke(
                  "error",
                  e
                ), ke("load", e), l = o;
                break;
              case "details":
                ke("toggle", e), l = o;
                break;
              case "input":
                Wh(e, o), l = $c(e, o), ke("invalid", e);
                break;
              case "option":
                l = o;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!o.multiple }, l = Ne({}, o, { value: void 0 }), ke("invalid", e);
                break;
              case "textarea":
                Gh(e, o), l = tf(e, o), ke("invalid", e);
                break;
              default:
                l = o;
            }
            rf(n, l), d = l;
            for (s in d) if (d.hasOwnProperty(s)) {
              var p = d[s];
              s === "style" ? Yg(e, p) : s === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, p != null && Qg(e, p)) : s === "children" ? typeof p == "string" ? (n !== "textarea" || p !== "") && tl(e, p) : typeof p == "number" && tl(e, "" + p) : s !== "suppressContentEditableWarning" && s !== "suppressHydrationWarning" && s !== "autoFocus" && (el.hasOwnProperty(s) ? p != null && s === "onScroll" && ke("scroll", e) : p != null && qf(e, s, p, a));
            }
            switch (n) {
              case "input":
                _s(e), Vh(e, o, !1);
                break;
              case "textarea":
                _s(e), Kh(e);
                break;
              case "option":
                o.value != null && e.setAttribute("value", "" + Cr(o.value));
                break;
              case "select":
                e.multiple = !!o.multiple, s = o.value, s != null ? Ui(e, !!o.multiple, s, !1) : o.defaultValue != null && Ui(
                  e,
                  !!o.multiple,
                  o.defaultValue,
                  !0
                );
                break;
              default:
                typeof l.onClick == "function" && (e.onclick = au);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                o = !!o.autoFocus;
                break e;
              case "img":
                o = !0;
                break e;
              default:
                o = !1;
            }
          }
          o && (t.flags |= 4);
        }
        t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
      }
      return ut(t), null;
    case 6:
      if (e && t.stateNode != null) yv(e, t, e.memoizedProps, o);
      else {
        if (typeof o != "string" && t.stateNode === null) throw Error(U(166));
        if (n = Xr(dl.current), Xr(Mn.current), Ls(t)) {
          if (o = t.stateNode, n = t.memoizedProps, o[Ln] = t, (s = o.nodeValue !== n) && (e = Bt, e !== null)) switch (e.tag) {
            case 3:
              As(o.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && As(o.nodeValue, n, (e.mode & 1) !== 0);
          }
          s && (t.flags |= 4);
        } else o = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(o), o[Ln] = t, t.stateNode = o;
      }
      return ut(t), null;
    case 13:
      if (Te(Ae), o = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (Ce && Ht !== null && t.mode & 1 && !(t.flags & 128)) Oy(), Yi(), t.flags |= 98560, s = !1;
        else if (s = Ls(t), o !== null && o.dehydrated !== null) {
          if (e === null) {
            if (!s) throw Error(U(318));
            if (s = t.memoizedState, s = s !== null ? s.dehydrated : null, !s) throw Error(U(317));
            s[Ln] = t;
          } else Yi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ut(t), s = !1;
        } else yn !== null && (Uf(yn), yn = null), s = !0;
        if (!s) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (o = o !== null, o !== (e !== null && e.memoizedState !== null) && o && (t.child.flags |= 8192, t.mode & 1 && (e === null || Ae.current & 1 ? Ve === 0 && (Ve = 3) : zd())), t.updateQueue !== null && (t.flags |= 4), ut(t), null);
    case 4:
      return Ji(), Nf(e, t), e === null && ul(t.stateNode.containerInfo), ut(t), null;
    case 10:
      return gd(t.type._context), ut(t), null;
    case 17:
      return Lt(t.type) && cu(), ut(t), null;
    case 19:
      if (Te(Ae), s = t.memoizedState, s === null) return ut(t), null;
      if (o = (t.flags & 128) !== 0, a = s.rendering, a === null) if (o) zo(s, !1);
      else {
        if (Ve !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (a = yu(e), a !== null) {
            for (t.flags |= 128, zo(s, !1), o = a.updateQueue, o !== null && (t.updateQueue = o, t.flags |= 4), t.subtreeFlags = 0, o = n, n = t.child; n !== null; ) s = n, e = o, s.flags &= 14680066, a = s.alternate, a === null ? (s.childLanes = 0, s.lanes = e, s.child = null, s.subtreeFlags = 0, s.memoizedProps = null, s.memoizedState = null, s.updateQueue = null, s.dependencies = null, s.stateNode = null) : (s.childLanes = a.childLanes, s.lanes = a.lanes, s.child = a.child, s.subtreeFlags = 0, s.deletions = null, s.memoizedProps = a.memoizedProps, s.memoizedState = a.memoizedState, s.updateQueue = a.updateQueue, s.type = a.type, e = a.dependencies, s.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return Ee(Ae, Ae.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        s.tail !== null && De() > $i && (t.flags |= 128, o = !0, zo(s, !1), t.lanes = 4194304);
      }
      else {
        if (!o) if (e = yu(a), e !== null) {
          if (t.flags |= 128, o = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), zo(s, !0), s.tail === null && s.tailMode === "hidden" && !a.alternate && !Ce) return ut(t), null;
        } else 2 * De() - s.renderingStartTime > $i && n !== 1073741824 && (t.flags |= 128, o = !0, zo(s, !1), t.lanes = 4194304);
        s.isBackwards ? (a.sibling = t.child, t.child = a) : (n = s.last, n !== null ? n.sibling = a : t.child = a, s.last = a);
      }
      return s.tail !== null ? (t = s.tail, s.rendering = t, s.tail = t.sibling, s.renderingStartTime = De(), t.sibling = null, n = Ae.current, Ee(Ae, o ? n & 1 | 2 : n & 1), t) : (ut(t), null);
    case 22:
    case 23:
      return Md(), o = t.memoizedState !== null, e !== null && e.memoizedState !== null !== o && (t.flags |= 8192), o && t.mode & 1 ? Ut & 1073741824 && (ut(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ut(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(U(156, t.tag));
}
function j_(e, t) {
  switch (dd(t), t.tag) {
    case 1:
      return Lt(t.type) && cu(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return Ji(), Te(At), Te(ft), _d(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return wd(t), null;
    case 13:
      if (Te(Ae), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(U(340));
        Yi();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return Te(Ae), null;
    case 4:
      return Ji(), null;
    case 10:
      return gd(t.type._context), null;
    case 22:
    case 23:
      return Md(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var zs = !1, ct = !1, F_ = typeof WeakSet == "function" ? WeakSet : Set, Y = null;
function Oi(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (o) {
    Ie(e, t, o);
  }
  else n.current = null;
}
function Mf(e, t, n) {
  try {
    n();
  } catch (o) {
    Ie(e, t, o);
  }
}
var Im = !1;
function U_(e, t) {
  if (mf = lu, e = Ey(), cd(e)) {
    if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else e: {
      n = (n = e.ownerDocument) && n.defaultView || window;
      var o = n.getSelection && n.getSelection();
      if (o && o.rangeCount !== 0) {
        n = o.anchorNode;
        var l = o.anchorOffset, s = o.focusNode;
        o = o.focusOffset;
        try {
          n.nodeType, s.nodeType;
        } catch {
          n = null;
          break e;
        }
        var a = 0, d = -1, p = -1, m = 0, g = 0, y = e, v = null;
        t: for (; ; ) {
          for (var _; y !== n || l !== 0 && y.nodeType !== 3 || (d = a + l), y !== s || o !== 0 && y.nodeType !== 3 || (p = a + o), y.nodeType === 3 && (a += y.nodeValue.length), (_ = y.firstChild) !== null; )
            v = y, y = _;
          for (; ; ) {
            if (y === e) break t;
            if (v === n && ++m === l && (d = a), v === s && ++g === o && (p = a), (_ = y.nextSibling) !== null) break;
            y = v, v = y.parentNode;
          }
          y = _;
        }
        n = d === -1 || p === -1 ? null : { start: d, end: p };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (gf = { focusedElem: e, selectionRange: n }, lu = !1, Y = t; Y !== null; ) if (t = Y, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, Y = e;
  else for (; Y !== null; ) {
    t = Y;
    try {
      var k = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (k !== null) {
            var R = k.memoizedProps, A = k.memoizedState, w = t.stateNode, S = w.getSnapshotBeforeUpdate(t.elementType === t.type ? R : mn(t.type, R), A);
            w.__reactInternalSnapshotBeforeUpdate = S;
          }
          break;
        case 3:
          var E = t.stateNode.containerInfo;
          E.nodeType === 1 ? E.textContent = "" : E.nodeType === 9 && E.documentElement && E.removeChild(E.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(U(163));
      }
    } catch (C) {
      Ie(t, t.return, C);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, Y = e;
      break;
    }
    Y = t.return;
  }
  return k = Im, Im = !1, k;
}
function qo(e, t, n) {
  var o = t.updateQueue;
  if (o = o !== null ? o.lastEffect : null, o !== null) {
    var l = o = o.next;
    do {
      if ((l.tag & e) === e) {
        var s = l.destroy;
        l.destroy = void 0, s !== void 0 && Mf(t, n, s);
      }
      l = l.next;
    } while (l !== o);
  }
}
function Du(e, t) {
  if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
    var n = t = t.next;
    do {
      if ((n.tag & e) === e) {
        var o = n.create;
        n.destroy = o();
      }
      n = n.next;
    } while (n !== t);
  }
}
function zf(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == "function" ? t(e) : t.current = e;
  }
}
function vv(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, vv(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Ln], delete t[cl], delete t[Sf], delete t[__], delete t[E_])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function Sv(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Om(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || Sv(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function If(e, t, n) {
  var o = e.tag;
  if (o === 5 || o === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = au));
  else if (o !== 4 && (e = e.child, e !== null)) for (If(e, t, n), e = e.sibling; e !== null; ) If(e, t, n), e = e.sibling;
}
function Of(e, t, n) {
  var o = e.tag;
  if (o === 5 || o === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (o !== 4 && (e = e.child, e !== null)) for (Of(e, t, n), e = e.sibling; e !== null; ) Of(e, t, n), e = e.sibling;
}
var $e = null, gn = !1;
function ur(e, t, n) {
  for (n = n.child; n !== null; ) wv(e, t, n), n = n.sibling;
}
function wv(e, t, n) {
  if (Nn && typeof Nn.onCommitFiberUnmount == "function") try {
    Nn.onCommitFiberUnmount(Ru, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      ct || Oi(n, t);
    case 6:
      var o = $e, l = gn;
      $e = null, ur(e, t, n), $e = o, gn = l, $e !== null && (gn ? (e = $e, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : $e.removeChild(n.stateNode));
      break;
    case 18:
      $e !== null && (gn ? (e = $e, n = n.stateNode, e.nodeType === 8 ? vc(e.parentNode, n) : e.nodeType === 1 && vc(e, n), ol(e)) : vc($e, n.stateNode));
      break;
    case 4:
      o = $e, l = gn, $e = n.stateNode.containerInfo, gn = !0, ur(e, t, n), $e = o, gn = l;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!ct && (o = n.updateQueue, o !== null && (o = o.lastEffect, o !== null))) {
        l = o = o.next;
        do {
          var s = l, a = s.destroy;
          s = s.tag, a !== void 0 && (s & 2 || s & 4) && Mf(n, t, a), l = l.next;
        } while (l !== o);
      }
      ur(e, t, n);
      break;
    case 1:
      if (!ct && (Oi(n, t), o = n.stateNode, typeof o.componentWillUnmount == "function")) try {
        o.props = n.memoizedProps, o.state = n.memoizedState, o.componentWillUnmount();
      } catch (d) {
        Ie(n, t, d);
      }
      ur(e, t, n);
      break;
    case 21:
      ur(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (ct = (o = ct) || n.memoizedState !== null, ur(e, t, n), ct = o) : ur(e, t, n);
      break;
    default:
      ur(e, t, n);
  }
}
function Dm(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new F_()), t.forEach(function(o) {
      var l = Y_.bind(null, e, o);
      n.has(o) || (n.add(o), o.then(l, l));
    });
  }
}
function pn(e, t) {
  var n = t.deletions;
  if (n !== null) for (var o = 0; o < n.length; o++) {
    var l = n[o];
    try {
      var s = e, a = t, d = a;
      e: for (; d !== null; ) {
        switch (d.tag) {
          case 5:
            $e = d.stateNode, gn = !1;
            break e;
          case 3:
            $e = d.stateNode.containerInfo, gn = !0;
            break e;
          case 4:
            $e = d.stateNode.containerInfo, gn = !0;
            break e;
        }
        d = d.return;
      }
      if ($e === null) throw Error(U(160));
      wv(s, a, l), $e = null, gn = !1;
      var p = l.alternate;
      p !== null && (p.return = null), l.return = null;
    } catch (m) {
      Ie(l, t, m);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) _v(t, e), t = t.sibling;
}
function _v(e, t) {
  var n = e.alternate, o = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (pn(t, e), Rn(e), o & 4) {
        try {
          qo(3, e, e.return), Du(3, e);
        } catch (R) {
          Ie(e, e.return, R);
        }
        try {
          qo(5, e, e.return);
        } catch (R) {
          Ie(e, e.return, R);
        }
      }
      break;
    case 1:
      pn(t, e), Rn(e), o & 512 && n !== null && Oi(n, n.return);
      break;
    case 5:
      if (pn(t, e), Rn(e), o & 512 && n !== null && Oi(n, n.return), e.flags & 32) {
        var l = e.stateNode;
        try {
          tl(l, "");
        } catch (R) {
          Ie(e, e.return, R);
        }
      }
      if (o & 4 && (l = e.stateNode, l != null)) {
        var s = e.memoizedProps, a = n !== null ? n.memoizedProps : s, d = e.type, p = e.updateQueue;
        if (e.updateQueue = null, p !== null) try {
          d === "input" && s.type === "radio" && s.name != null && Vg(l, s), of(d, a);
          var m = of(d, s);
          for (a = 0; a < p.length; a += 2) {
            var g = p[a], y = p[a + 1];
            g === "style" ? Yg(l, y) : g === "dangerouslySetInnerHTML" ? Qg(l, y) : g === "children" ? tl(l, y) : qf(l, g, y, m);
          }
          switch (d) {
            case "input":
              bc(l, s);
              break;
            case "textarea":
              Gg(l, s);
              break;
            case "select":
              var v = l._wrapperState.wasMultiple;
              l._wrapperState.wasMultiple = !!s.multiple;
              var _ = s.value;
              _ != null ? Ui(l, !!s.multiple, _, !1) : v !== !!s.multiple && (s.defaultValue != null ? Ui(
                l,
                !!s.multiple,
                s.defaultValue,
                !0
              ) : Ui(l, !!s.multiple, s.multiple ? [] : "", !1));
          }
          l[cl] = s;
        } catch (R) {
          Ie(e, e.return, R);
        }
      }
      break;
    case 6:
      if (pn(t, e), Rn(e), o & 4) {
        if (e.stateNode === null) throw Error(U(162));
        l = e.stateNode, s = e.memoizedProps;
        try {
          l.nodeValue = s;
        } catch (R) {
          Ie(e, e.return, R);
        }
      }
      break;
    case 3:
      if (pn(t, e), Rn(e), o & 4 && n !== null && n.memoizedState.isDehydrated) try {
        ol(t.containerInfo);
      } catch (R) {
        Ie(e, e.return, R);
      }
      break;
    case 4:
      pn(t, e), Rn(e);
      break;
    case 13:
      pn(t, e), Rn(e), l = e.child, l.flags & 8192 && (s = l.memoizedState !== null, l.stateNode.isHidden = s, !s || l.alternate !== null && l.alternate.memoizedState !== null || (Ld = De())), o & 4 && Dm(e);
      break;
    case 22:
      if (g = n !== null && n.memoizedState !== null, e.mode & 1 ? (ct = (m = ct) || g, pn(t, e), ct = m) : pn(t, e), Rn(e), o & 8192) {
        if (m = e.memoizedState !== null, (e.stateNode.isHidden = m) && !g && e.mode & 1) for (Y = e, g = e.child; g !== null; ) {
          for (y = Y = g; Y !== null; ) {
            switch (v = Y, _ = v.child, v.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                qo(4, v, v.return);
                break;
              case 1:
                Oi(v, v.return);
                var k = v.stateNode;
                if (typeof k.componentWillUnmount == "function") {
                  o = v, n = v.return;
                  try {
                    t = o, k.props = t.memoizedProps, k.state = t.memoizedState, k.componentWillUnmount();
                  } catch (R) {
                    Ie(o, n, R);
                  }
                }
                break;
              case 5:
                Oi(v, v.return);
                break;
              case 22:
                if (v.memoizedState !== null) {
                  Fm(y);
                  continue;
                }
            }
            _ !== null ? (_.return = v, Y = _) : Fm(y);
          }
          g = g.sibling;
        }
        e: for (g = null, y = e; ; ) {
          if (y.tag === 5) {
            if (g === null) {
              g = y;
              try {
                l = y.stateNode, m ? (s = l.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none") : (d = y.stateNode, p = y.memoizedProps.style, a = p != null && p.hasOwnProperty("display") ? p.display : null, d.style.display = Xg("display", a));
              } catch (R) {
                Ie(e, e.return, R);
              }
            }
          } else if (y.tag === 6) {
            if (g === null) try {
              y.stateNode.nodeValue = m ? "" : y.memoizedProps;
            } catch (R) {
              Ie(e, e.return, R);
            }
          } else if ((y.tag !== 22 && y.tag !== 23 || y.memoizedState === null || y === e) && y.child !== null) {
            y.child.return = y, y = y.child;
            continue;
          }
          if (y === e) break e;
          for (; y.sibling === null; ) {
            if (y.return === null || y.return === e) break e;
            g === y && (g = null), y = y.return;
          }
          g === y && (g = null), y.sibling.return = y.return, y = y.sibling;
        }
      }
      break;
    case 19:
      pn(t, e), Rn(e), o & 4 && Dm(e);
      break;
    case 21:
      break;
    default:
      pn(
        t,
        e
      ), Rn(e);
  }
}
function Rn(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (Sv(n)) {
            var o = n;
            break e;
          }
          n = n.return;
        }
        throw Error(U(160));
      }
      switch (o.tag) {
        case 5:
          var l = o.stateNode;
          o.flags & 32 && (tl(l, ""), o.flags &= -33);
          var s = Om(e);
          Of(e, s, l);
          break;
        case 3:
        case 4:
          var a = o.stateNode.containerInfo, d = Om(e);
          If(e, d, a);
          break;
        default:
          throw Error(U(161));
      }
    } catch (p) {
      Ie(e, e.return, p);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function H_(e, t, n) {
  Y = e, Ev(e);
}
function Ev(e, t, n) {
  for (var o = (e.mode & 1) !== 0; Y !== null; ) {
    var l = Y, s = l.child;
    if (l.tag === 22 && o) {
      var a = l.memoizedState !== null || zs;
      if (!a) {
        var d = l.alternate, p = d !== null && d.memoizedState !== null || ct;
        d = zs;
        var m = ct;
        if (zs = a, (ct = p) && !m) for (Y = l; Y !== null; ) a = Y, p = a.child, a.tag === 22 && a.memoizedState !== null ? Um(l) : p !== null ? (p.return = a, Y = p) : Um(l);
        for (; s !== null; ) Y = s, Ev(s), s = s.sibling;
        Y = l, zs = d, ct = m;
      }
      jm(e);
    } else l.subtreeFlags & 8772 && s !== null ? (s.return = l, Y = s) : jm(e);
  }
}
function jm(e) {
  for (; Y !== null; ) {
    var t = Y;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            ct || Du(5, t);
            break;
          case 1:
            var o = t.stateNode;
            if (t.flags & 4 && !ct) if (n === null) o.componentDidMount();
            else {
              var l = t.elementType === t.type ? n.memoizedProps : mn(t.type, n.memoizedProps);
              o.componentDidUpdate(l, n.memoizedState, o.__reactInternalSnapshotBeforeUpdate);
            }
            var s = t.updateQueue;
            s !== null && _m(t, s, o);
            break;
          case 3:
            var a = t.updateQueue;
            if (a !== null) {
              if (n = null, t.child !== null) switch (t.child.tag) {
                case 5:
                  n = t.child.stateNode;
                  break;
                case 1:
                  n = t.child.stateNode;
              }
              _m(t, a, n);
            }
            break;
          case 5:
            var d = t.stateNode;
            if (n === null && t.flags & 4) {
              n = d;
              var p = t.memoizedProps;
              switch (t.type) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  p.autoFocus && n.focus();
                  break;
                case "img":
                  p.src && (n.src = p.src);
              }
            }
            break;
          case 6:
            break;
          case 4:
            break;
          case 12:
            break;
          case 13:
            if (t.memoizedState === null) {
              var m = t.alternate;
              if (m !== null) {
                var g = m.memoizedState;
                if (g !== null) {
                  var y = g.dehydrated;
                  y !== null && ol(y);
                }
              }
            }
            break;
          case 19:
          case 17:
          case 21:
          case 22:
          case 23:
          case 25:
            break;
          default:
            throw Error(U(163));
        }
        ct || t.flags & 512 && zf(t);
      } catch (v) {
        Ie(t, t.return, v);
      }
    }
    if (t === e) {
      Y = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, Y = n;
      break;
    }
    Y = t.return;
  }
}
function Fm(e) {
  for (; Y !== null; ) {
    var t = Y;
    if (t === e) {
      Y = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, Y = n;
      break;
    }
    Y = t.return;
  }
}
function Um(e) {
  for (; Y !== null; ) {
    var t = Y;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Du(4, t);
          } catch (p) {
            Ie(t, n, p);
          }
          break;
        case 1:
          var o = t.stateNode;
          if (typeof o.componentDidMount == "function") {
            var l = t.return;
            try {
              o.componentDidMount();
            } catch (p) {
              Ie(t, l, p);
            }
          }
          var s = t.return;
          try {
            zf(t);
          } catch (p) {
            Ie(t, s, p);
          }
          break;
        case 5:
          var a = t.return;
          try {
            zf(t);
          } catch (p) {
            Ie(t, a, p);
          }
      }
    } catch (p) {
      Ie(t, t.return, p);
    }
    if (t === e) {
      Y = null;
      break;
    }
    var d = t.sibling;
    if (d !== null) {
      d.return = t.return, Y = d;
      break;
    }
    Y = t.return;
  }
}
var B_ = Math.ceil, wu = qn.ReactCurrentDispatcher, Rd = qn.ReactCurrentOwner, ln = qn.ReactCurrentBatchConfig, ce = 0, Ze = null, Ue = null, be = 0, Ut = 0, Di = Lr(0), Ve = 0, gl = null, ei = 0, ju = 0, Ad = 0, $o = null, Ct = null, Ld = 0, $i = 1 / 0, Bn = null, _u = !1, Df = null, xr = null, Is = !1, gr = null, Eu = 0, bo = 0, jf = null, Ys = -1, Zs = 0;
function mt() {
  return ce & 6 ? De() : Ys !== -1 ? Ys : Ys = De();
}
function kr(e) {
  return e.mode & 1 ? ce & 2 && be !== 0 ? be & -be : k_.transition !== null ? (Zs === 0 && (Zs = ly()), Zs) : (e = me, e !== 0 || (e = window.event, e = e === void 0 ? 16 : py(e.type)), e) : 1;
}
function Sn(e, t, n, o) {
  if (50 < bo) throw bo = 0, jf = null, Error(U(185));
  vl(e, n, o), (!(ce & 2) || e !== Ze) && (e === Ze && (!(ce & 2) && (ju |= n), Ve === 4 && hr(e, be)), Nt(e, o), n === 1 && ce === 0 && !(t.mode & 1) && ($i = De() + 500, zu && Nr()));
}
function Nt(e, t) {
  var n = e.callbackNode;
  kw(e, t);
  var o = ou(e, e === Ze ? be : 0);
  if (o === 0) n !== null && Yh(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = o & -o, e.callbackPriority !== t) {
    if (n != null && Yh(n), t === 1) e.tag === 0 ? x_(Hm.bind(null, e)) : My(Hm.bind(null, e)), S_(function() {
      !(ce & 6) && Nr();
    }), n = null;
    else {
      switch (sy(o)) {
        case 1:
          n = nd;
          break;
        case 4:
          n = iy;
          break;
        case 16:
          n = iu;
          break;
        case 536870912:
          n = oy;
          break;
        default:
          n = iu;
      }
      n = Lv(n, xv.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function xv(e, t) {
  if (Ys = -1, Zs = 0, ce & 6) throw Error(U(327));
  var n = e.callbackNode;
  if (Gi() && e.callbackNode !== n) return null;
  var o = ou(e, e === Ze ? be : 0);
  if (o === 0) return null;
  if (o & 30 || o & e.expiredLanes || t) t = xu(e, o);
  else {
    t = o;
    var l = ce;
    ce |= 2;
    var s = Tv();
    (Ze !== e || be !== t) && (Bn = null, $i = De() + 500, Zr(e, t));
    do
      try {
        G_();
        break;
      } catch (d) {
        kv(e, d);
      }
    while (!0);
    md(), wu.current = s, ce = l, Ue !== null ? t = 0 : (Ze = null, be = 0, t = Ve);
  }
  if (t !== 0) {
    if (t === 2 && (l = cf(e), l !== 0 && (o = l, t = Ff(e, l))), t === 1) throw n = gl, Zr(e, 0), hr(e, o), Nt(e, De()), n;
    if (t === 6) hr(e, o);
    else {
      if (l = e.current.alternate, !(o & 30) && !W_(l) && (t = xu(e, o), t === 2 && (s = cf(e), s !== 0 && (o = s, t = Ff(e, s))), t === 1)) throw n = gl, Zr(e, 0), hr(e, o), Nt(e, De()), n;
      switch (e.finishedWork = l, e.finishedLanes = o, t) {
        case 0:
        case 1:
          throw Error(U(345));
        case 2:
          Gr(e, Ct, Bn);
          break;
        case 3:
          if (hr(e, o), (o & 130023424) === o && (t = Ld + 500 - De(), 10 < t)) {
            if (ou(e, 0) !== 0) break;
            if (l = e.suspendedLanes, (l & o) !== o) {
              mt(), e.pingedLanes |= e.suspendedLanes & l;
              break;
            }
            e.timeoutHandle = vf(Gr.bind(null, e, Ct, Bn), t);
            break;
          }
          Gr(e, Ct, Bn);
          break;
        case 4:
          if (hr(e, o), (o & 4194240) === o) break;
          for (t = e.eventTimes, l = -1; 0 < o; ) {
            var a = 31 - vn(o);
            s = 1 << a, a = t[a], a > l && (l = a), o &= ~s;
          }
          if (o = l, o = De() - o, o = (120 > o ? 120 : 480 > o ? 480 : 1080 > o ? 1080 : 1920 > o ? 1920 : 3e3 > o ? 3e3 : 4320 > o ? 4320 : 1960 * B_(o / 1960)) - o, 10 < o) {
            e.timeoutHandle = vf(Gr.bind(null, e, Ct, Bn), o);
            break;
          }
          Gr(e, Ct, Bn);
          break;
        case 5:
          Gr(e, Ct, Bn);
          break;
        default:
          throw Error(U(329));
      }
    }
  }
  return Nt(e, De()), e.callbackNode === n ? xv.bind(null, e) : null;
}
function Ff(e, t) {
  var n = $o;
  return e.current.memoizedState.isDehydrated && (Zr(e, t).flags |= 256), e = xu(e, t), e !== 2 && (t = Ct, Ct = n, t !== null && Uf(t)), e;
}
function Uf(e) {
  Ct === null ? Ct = e : Ct.push.apply(Ct, e);
}
function W_(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var o = 0; o < n.length; o++) {
        var l = n[o], s = l.getSnapshot;
        l = l.value;
        try {
          if (!wn(s(), l)) return !1;
        } catch {
          return !1;
        }
      }
    }
    if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      t.sibling.return = t.return, t = t.sibling;
    }
  }
  return !0;
}
function hr(e, t) {
  for (t &= ~Ad, t &= ~ju, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - vn(t), o = 1 << n;
    e[n] = -1, t &= ~o;
  }
}
function Hm(e) {
  if (ce & 6) throw Error(U(327));
  Gi();
  var t = ou(e, 0);
  if (!(t & 1)) return Nt(e, De()), null;
  var n = xu(e, t);
  if (e.tag !== 0 && n === 2) {
    var o = cf(e);
    o !== 0 && (t = o, n = Ff(e, o));
  }
  if (n === 1) throw n = gl, Zr(e, 0), hr(e, t), Nt(e, De()), n;
  if (n === 6) throw Error(U(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, Gr(e, Ct, Bn), Nt(e, De()), null;
}
function Nd(e, t) {
  var n = ce;
  ce |= 1;
  try {
    return e(t);
  } finally {
    ce = n, ce === 0 && ($i = De() + 500, zu && Nr());
  }
}
function ti(e) {
  gr !== null && gr.tag === 0 && !(ce & 6) && Gi();
  var t = ce;
  ce |= 1;
  var n = ln.transition, o = me;
  try {
    if (ln.transition = null, me = 1, e) return e();
  } finally {
    me = o, ln.transition = n, ce = t, !(ce & 6) && Nr();
  }
}
function Md() {
  Ut = Di.current, Te(Di);
}
function Zr(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, v_(n)), Ue !== null) for (n = Ue.return; n !== null; ) {
    var o = n;
    switch (dd(o), o.tag) {
      case 1:
        o = o.type.childContextTypes, o != null && cu();
        break;
      case 3:
        Ji(), Te(At), Te(ft), _d();
        break;
      case 5:
        wd(o);
        break;
      case 4:
        Ji();
        break;
      case 13:
        Te(Ae);
        break;
      case 19:
        Te(Ae);
        break;
      case 10:
        gd(o.type._context);
        break;
      case 22:
      case 23:
        Md();
    }
    n = n.return;
  }
  if (Ze = e, Ue = e = Tr(e.current, null), be = Ut = t, Ve = 0, gl = null, Ad = ju = ei = 0, Ct = $o = null, Qr !== null) {
    for (t = 0; t < Qr.length; t++) if (n = Qr[t], o = n.interleaved, o !== null) {
      n.interleaved = null;
      var l = o.next, s = n.pending;
      if (s !== null) {
        var a = s.next;
        s.next = l, o.next = a;
      }
      n.pending = o;
    }
    Qr = null;
  }
  return e;
}
function kv(e, t) {
  do {
    var n = Ue;
    try {
      if (md(), Ks.current = Su, vu) {
        for (var o = Le.memoizedState; o !== null; ) {
          var l = o.queue;
          l !== null && (l.pending = null), o = o.next;
        }
        vu = !1;
      }
      if (br = 0, Ye = We = Le = null, Jo = !1, pl = 0, Rd.current = null, n === null || n.return === null) {
        Ve = 1, gl = t, Ue = null;
        break;
      }
      e: {
        var s = e, a = n.return, d = n, p = t;
        if (t = be, d.flags |= 32768, p !== null && typeof p == "object" && typeof p.then == "function") {
          var m = p, g = d, y = g.tag;
          if (!(g.mode & 1) && (y === 0 || y === 11 || y === 15)) {
            var v = g.alternate;
            v ? (g.updateQueue = v.updateQueue, g.memoizedState = v.memoizedState, g.lanes = v.lanes) : (g.updateQueue = null, g.memoizedState = null);
          }
          var _ = Cm(a);
          if (_ !== null) {
            _.flags &= -257, Rm(_, a, d, s, t), _.mode & 1 && Pm(s, m, t), t = _, p = m;
            var k = t.updateQueue;
            if (k === null) {
              var R = /* @__PURE__ */ new Set();
              R.add(p), t.updateQueue = R;
            } else k.add(p);
            break e;
          } else {
            if (!(t & 1)) {
              Pm(s, m, t), zd();
              break e;
            }
            p = Error(U(426));
          }
        } else if (Ce && d.mode & 1) {
          var A = Cm(a);
          if (A !== null) {
            !(A.flags & 65536) && (A.flags |= 256), Rm(A, a, d, s, t), pd(qi(p, d));
            break e;
          }
        }
        s = p = qi(p, d), Ve !== 4 && (Ve = 2), $o === null ? $o = [s] : $o.push(s), s = a;
        do {
          switch (s.tag) {
            case 3:
              s.flags |= 65536, t &= -t, s.lanes |= t;
              var w = sv(s, p, t);
              wm(s, w);
              break e;
            case 1:
              d = p;
              var S = s.type, E = s.stateNode;
              if (!(s.flags & 128) && (typeof S.getDerivedStateFromError == "function" || E !== null && typeof E.componentDidCatch == "function" && (xr === null || !xr.has(E)))) {
                s.flags |= 65536, t &= -t, s.lanes |= t;
                var C = uv(s, d, t);
                wm(s, C);
                break e;
              }
          }
          s = s.return;
        } while (s !== null);
      }
      Cv(n);
    } catch (I) {
      t = I, Ue === n && n !== null && (Ue = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function Tv() {
  var e = wu.current;
  return wu.current = Su, e === null ? Su : e;
}
function zd() {
  (Ve === 0 || Ve === 3 || Ve === 2) && (Ve = 4), Ze === null || !(ei & 268435455) && !(ju & 268435455) || hr(Ze, be);
}
function xu(e, t) {
  var n = ce;
  ce |= 2;
  var o = Tv();
  (Ze !== e || be !== t) && (Bn = null, Zr(e, t));
  do
    try {
      V_();
      break;
    } catch (l) {
      kv(e, l);
    }
  while (!0);
  if (md(), ce = n, wu.current = o, Ue !== null) throw Error(U(261));
  return Ze = null, be = 0, Ve;
}
function V_() {
  for (; Ue !== null; ) Pv(Ue);
}
function G_() {
  for (; Ue !== null && !mw(); ) Pv(Ue);
}
function Pv(e) {
  var t = Av(e.alternate, e, Ut);
  e.memoizedProps = e.pendingProps, t === null ? Cv(e) : Ue = t, Rd.current = null;
}
function Cv(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = j_(n, t), n !== null) {
        n.flags &= 32767, Ue = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        Ve = 6, Ue = null;
        return;
      }
    } else if (n = D_(n, t, Ut), n !== null) {
      Ue = n;
      return;
    }
    if (t = t.sibling, t !== null) {
      Ue = t;
      return;
    }
    Ue = t = e;
  } while (t !== null);
  Ve === 0 && (Ve = 5);
}
function Gr(e, t, n) {
  var o = me, l = ln.transition;
  try {
    ln.transition = null, me = 1, K_(e, t, n, o);
  } finally {
    ln.transition = l, me = o;
  }
  return null;
}
function K_(e, t, n, o) {
  do
    Gi();
  while (gr !== null);
  if (ce & 6) throw Error(U(327));
  n = e.finishedWork;
  var l = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(U(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var s = n.lanes | n.childLanes;
  if (Tw(e, s), e === Ze && (Ue = Ze = null, be = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Is || (Is = !0, Lv(iu, function() {
    return Gi(), null;
  })), s = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || s) {
    s = ln.transition, ln.transition = null;
    var a = me;
    me = 1;
    var d = ce;
    ce |= 4, Rd.current = null, U_(e, n), _v(n, e), f_(gf), lu = !!mf, gf = mf = null, e.current = n, H_(n), gw(), ce = d, me = a, ln.transition = s;
  } else e.current = n;
  if (Is && (Is = !1, gr = e, Eu = l), s = e.pendingLanes, s === 0 && (xr = null), Sw(n.stateNode), Nt(e, De()), t !== null) for (o = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], o(l.value, { componentStack: l.stack, digest: l.digest });
  if (_u) throw _u = !1, e = Df, Df = null, e;
  return Eu & 1 && e.tag !== 0 && Gi(), s = e.pendingLanes, s & 1 ? e === jf ? bo++ : (bo = 0, jf = e) : bo = 0, Nr(), null;
}
function Gi() {
  if (gr !== null) {
    var e = sy(Eu), t = ln.transition, n = me;
    try {
      if (ln.transition = null, me = 16 > e ? 16 : e, gr === null) var o = !1;
      else {
        if (e = gr, gr = null, Eu = 0, ce & 6) throw Error(U(331));
        var l = ce;
        for (ce |= 4, Y = e.current; Y !== null; ) {
          var s = Y, a = s.child;
          if (Y.flags & 16) {
            var d = s.deletions;
            if (d !== null) {
              for (var p = 0; p < d.length; p++) {
                var m = d[p];
                for (Y = m; Y !== null; ) {
                  var g = Y;
                  switch (g.tag) {
                    case 0:
                    case 11:
                    case 15:
                      qo(8, g, s);
                  }
                  var y = g.child;
                  if (y !== null) y.return = g, Y = y;
                  else for (; Y !== null; ) {
                    g = Y;
                    var v = g.sibling, _ = g.return;
                    if (vv(g), g === m) {
                      Y = null;
                      break;
                    }
                    if (v !== null) {
                      v.return = _, Y = v;
                      break;
                    }
                    Y = _;
                  }
                }
              }
              var k = s.alternate;
              if (k !== null) {
                var R = k.child;
                if (R !== null) {
                  k.child = null;
                  do {
                    var A = R.sibling;
                    R.sibling = null, R = A;
                  } while (R !== null);
                }
              }
              Y = s;
            }
          }
          if (s.subtreeFlags & 2064 && a !== null) a.return = s, Y = a;
          else e: for (; Y !== null; ) {
            if (s = Y, s.flags & 2048) switch (s.tag) {
              case 0:
              case 11:
              case 15:
                qo(9, s, s.return);
            }
            var w = s.sibling;
            if (w !== null) {
              w.return = s.return, Y = w;
              break e;
            }
            Y = s.return;
          }
        }
        var S = e.current;
        for (Y = S; Y !== null; ) {
          a = Y;
          var E = a.child;
          if (a.subtreeFlags & 2064 && E !== null) E.return = a, Y = E;
          else e: for (a = S; Y !== null; ) {
            if (d = Y, d.flags & 2048) try {
              switch (d.tag) {
                case 0:
                case 11:
                case 15:
                  Du(9, d);
              }
            } catch (I) {
              Ie(d, d.return, I);
            }
            if (d === a) {
              Y = null;
              break e;
            }
            var C = d.sibling;
            if (C !== null) {
              C.return = d.return, Y = C;
              break e;
            }
            Y = d.return;
          }
        }
        if (ce = l, Nr(), Nn && typeof Nn.onPostCommitFiberRoot == "function") try {
          Nn.onPostCommitFiberRoot(Ru, e);
        } catch {
        }
        o = !0;
      }
      return o;
    } finally {
      me = n, ln.transition = t;
    }
  }
  return !1;
}
function Bm(e, t, n) {
  t = qi(n, t), t = sv(e, t, 1), e = Er(e, t, 1), t = mt(), e !== null && (vl(e, 1, t), Nt(e, t));
}
function Ie(e, t, n) {
  if (e.tag === 3) Bm(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      Bm(t, e, n);
      break;
    } else if (t.tag === 1) {
      var o = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof o.componentDidCatch == "function" && (xr === null || !xr.has(o))) {
        e = qi(n, e), e = uv(t, e, 1), t = Er(t, e, 1), e = mt(), t !== null && (vl(t, 1, e), Nt(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function Q_(e, t, n) {
  var o = e.pingCache;
  o !== null && o.delete(t), t = mt(), e.pingedLanes |= e.suspendedLanes & n, Ze === e && (be & n) === n && (Ve === 4 || Ve === 3 && (be & 130023424) === be && 500 > De() - Ld ? Zr(e, 0) : Ad |= n), Nt(e, t);
}
function Rv(e, t) {
  t === 0 && (e.mode & 1 ? (t = ks, ks <<= 1, !(ks & 130023424) && (ks = 4194304)) : t = 1);
  var n = mt();
  e = Zn(e, t), e !== null && (vl(e, t, n), Nt(e, n));
}
function X_(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), Rv(e, n);
}
function Y_(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var o = e.stateNode, l = e.memoizedState;
      l !== null && (n = l.retryLane);
      break;
    case 19:
      o = e.stateNode;
      break;
    default:
      throw Error(U(314));
  }
  o !== null && o.delete(t), Rv(e, n);
}
var Av;
Av = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || At.current) Rt = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return Rt = !1, O_(e, t, n);
    Rt = !!(e.flags & 131072);
  }
  else Rt = !1, Ce && t.flags & 1048576 && zy(t, pu, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var o = t.type;
      Xs(e, t), e = t.pendingProps;
      var l = Xi(t, ft.current);
      Vi(t, n), l = xd(null, t, o, e, l, n);
      var s = kd();
      return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Lt(o) ? (s = !0, fu(t)) : s = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, vd(t), l.updater = Ou, t.stateNode = l, l._reactInternals = t, Tf(t, o, e, n), t = Rf(null, t, o, !0, s, n)) : (t.tag = 0, Ce && s && fd(t), ht(null, t, l, n), t = t.child), t;
    case 16:
      o = t.elementType;
      e: {
        switch (Xs(e, t), e = t.pendingProps, l = o._init, o = l(o._payload), t.type = o, l = t.tag = J_(o), e = mn(o, e), l) {
          case 0:
            t = Cf(null, t, o, e, n);
            break e;
          case 1:
            t = Nm(null, t, o, e, n);
            break e;
          case 11:
            t = Am(null, t, o, e, n);
            break e;
          case 14:
            t = Lm(null, t, o, mn(o.type, e), n);
            break e;
        }
        throw Error(U(
          306,
          o,
          ""
        ));
      }
      return t;
    case 0:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : mn(o, l), Cf(e, t, o, l, n);
    case 1:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : mn(o, l), Nm(e, t, o, l, n);
    case 3:
      e: {
        if (dv(t), e === null) throw Error(U(387));
        o = t.pendingProps, s = t.memoizedState, l = s.element, Uy(e, t), gu(t, o, null, n);
        var a = t.memoizedState;
        if (o = a.element, s.isDehydrated) if (s = { element: o, isDehydrated: !1, cache: a.cache, pendingSuspenseBoundaries: a.pendingSuspenseBoundaries, transitions: a.transitions }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
          l = qi(Error(U(423)), t), t = Mm(e, t, o, n, l);
          break e;
        } else if (o !== l) {
          l = qi(Error(U(424)), t), t = Mm(e, t, o, n, l);
          break e;
        } else for (Ht = _r(t.stateNode.containerInfo.firstChild), Bt = t, Ce = !0, yn = null, n = jy(t, null, o, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (Yi(), o === l) {
            t = Jn(e, t, n);
            break e;
          }
          ht(e, t, o, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return Hy(t), e === null && Ef(t), o = t.type, l = t.pendingProps, s = e !== null ? e.memoizedProps : null, a = l.children, yf(o, l) ? a = null : s !== null && yf(o, s) && (t.flags |= 32), fv(e, t), ht(e, t, a, n), t.child;
    case 6:
      return e === null && Ef(t), null;
    case 13:
      return pv(e, t, n);
    case 4:
      return Sd(t, t.stateNode.containerInfo), o = t.pendingProps, e === null ? t.child = Zi(t, null, o, n) : ht(e, t, o, n), t.child;
    case 11:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : mn(o, l), Am(e, t, o, l, n);
    case 7:
      return ht(e, t, t.pendingProps, n), t.child;
    case 8:
      return ht(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return ht(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (o = t.type._context, l = t.pendingProps, s = t.memoizedProps, a = l.value, Ee(hu, o._currentValue), o._currentValue = a, s !== null) if (wn(s.value, a)) {
          if (s.children === l.children && !At.current) {
            t = Jn(e, t, n);
            break e;
          }
        } else for (s = t.child, s !== null && (s.return = t); s !== null; ) {
          var d = s.dependencies;
          if (d !== null) {
            a = s.child;
            for (var p = d.firstContext; p !== null; ) {
              if (p.context === o) {
                if (s.tag === 1) {
                  p = Qn(-1, n & -n), p.tag = 2;
                  var m = s.updateQueue;
                  if (m !== null) {
                    m = m.shared;
                    var g = m.pending;
                    g === null ? p.next = p : (p.next = g.next, g.next = p), m.pending = p;
                  }
                }
                s.lanes |= n, p = s.alternate, p !== null && (p.lanes |= n), xf(
                  s.return,
                  n,
                  t
                ), d.lanes |= n;
                break;
              }
              p = p.next;
            }
          } else if (s.tag === 10) a = s.type === t.type ? null : s.child;
          else if (s.tag === 18) {
            if (a = s.return, a === null) throw Error(U(341));
            a.lanes |= n, d = a.alternate, d !== null && (d.lanes |= n), xf(a, n, t), a = s.sibling;
          } else a = s.child;
          if (a !== null) a.return = s;
          else for (a = s; a !== null; ) {
            if (a === t) {
              a = null;
              break;
            }
            if (s = a.sibling, s !== null) {
              s.return = a.return, a = s;
              break;
            }
            a = a.return;
          }
          s = a;
        }
        ht(e, t, l.children, n), t = t.child;
      }
      return t;
    case 9:
      return l = t.type, o = t.pendingProps.children, Vi(t, n), l = sn(l), o = o(l), t.flags |= 1, ht(e, t, o, n), t.child;
    case 14:
      return o = t.type, l = mn(o, t.pendingProps), l = mn(o.type, l), Lm(e, t, o, l, n);
    case 15:
      return av(e, t, t.type, t.pendingProps, n);
    case 17:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : mn(o, l), Xs(e, t), t.tag = 1, Lt(o) ? (e = !0, fu(t)) : e = !1, Vi(t, n), lv(t, o, l), Tf(t, o, l, n), Rf(null, t, o, !0, e, n);
    case 19:
      return hv(e, t, n);
    case 22:
      return cv(e, t, n);
  }
  throw Error(U(156, t.tag));
};
function Lv(e, t) {
  return ry(e, t);
}
function Z_(e, t, n, o) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = o, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function on(e, t, n, o) {
  return new Z_(e, t, n, o);
}
function Id(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function J_(e) {
  if (typeof e == "function") return Id(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === bf) return 11;
    if (e === ed) return 14;
  }
  return 2;
}
function Tr(e, t) {
  var n = e.alternate;
  return n === null ? (n = on(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function Js(e, t, n, o, l, s) {
  var a = 2;
  if (o = e, typeof e == "function") Id(e) && (a = 1);
  else if (typeof e == "string") a = 5;
  else e: switch (e) {
    case Pi:
      return Jr(n.children, l, s, t);
    case $f:
      a = 8, l |= 8;
      break;
    case Yc:
      return e = on(12, n, t, l | 2), e.elementType = Yc, e.lanes = s, e;
    case Zc:
      return e = on(13, n, t, l), e.elementType = Zc, e.lanes = s, e;
    case Jc:
      return e = on(19, n, t, l), e.elementType = Jc, e.lanes = s, e;
    case Hg:
      return Fu(n, l, s, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case Fg:
          a = 10;
          break e;
        case Ug:
          a = 9;
          break e;
        case bf:
          a = 11;
          break e;
        case ed:
          a = 14;
          break e;
        case fr:
          a = 16, o = null;
          break e;
      }
      throw Error(U(130, e == null ? e : typeof e, ""));
  }
  return t = on(a, n, t, l), t.elementType = e, t.type = o, t.lanes = s, t;
}
function Jr(e, t, n, o) {
  return e = on(7, e, o, t), e.lanes = n, e;
}
function Fu(e, t, n, o) {
  return e = on(22, e, o, t), e.elementType = Hg, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function Pc(e, t, n) {
  return e = on(6, e, null, t), e.lanes = n, e;
}
function Cc(e, t, n) {
  return t = on(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function q_(e, t, n, o, l) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = sc(0), this.expirationTimes = sc(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = sc(0), this.identifierPrefix = o, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
}
function Od(e, t, n, o, l, s, a, d, p) {
  return e = new q_(e, t, n, d, p), t === 1 ? (t = 1, s === !0 && (t |= 8)) : t = 0, s = on(3, null, null, t), e.current = s, s.stateNode = e, s.memoizedState = { element: o, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, vd(s), e;
}
function $_(e, t, n) {
  var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Ti, key: o == null ? null : "" + o, children: e, containerInfo: t, implementation: n };
}
function Nv(e) {
  if (!e) return Rr;
  e = e._reactInternals;
  e: {
    if (ri(e) !== e || e.tag !== 1) throw Error(U(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Lt(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(U(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (Lt(n)) return Ny(e, n, t);
  }
  return t;
}
function Mv(e, t, n, o, l, s, a, d, p) {
  return e = Od(n, o, !0, e, l, s, a, d, p), e.context = Nv(null), n = e.current, o = mt(), l = kr(n), s = Qn(o, l), s.callback = t ?? null, Er(n, s, l), e.current.lanes = l, vl(e, l, o), Nt(e, o), e;
}
function Uu(e, t, n, o) {
  var l = t.current, s = mt(), a = kr(l);
  return n = Nv(n), t.context === null ? t.context = n : t.pendingContext = n, t = Qn(s, a), t.payload = { element: e }, o = o === void 0 ? null : o, o !== null && (t.callback = o), e = Er(l, t, a), e !== null && (Sn(e, l, a, s), Gs(e, l, a)), a;
}
function ku(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Wm(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Dd(e, t) {
  Wm(e, t), (e = e.alternate) && Wm(e, t);
}
function b_() {
  return null;
}
var zv = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function jd(e) {
  this._internalRoot = e;
}
Hu.prototype.render = jd.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(U(409));
  Uu(e, t, null, null);
};
Hu.prototype.unmount = jd.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    ti(function() {
      Uu(null, e, null, null);
    }), t[Yn] = null;
  }
};
function Hu(e) {
  this._internalRoot = e;
}
Hu.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = cy();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < pr.length && t !== 0 && t < pr[n].priority; n++) ;
    pr.splice(n, 0, e), n === 0 && dy(e);
  }
};
function Fd(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function Bu(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function Vm() {
}
function eE(e, t, n, o, l) {
  if (l) {
    if (typeof o == "function") {
      var s = o;
      o = function() {
        var m = ku(a);
        s.call(m);
      };
    }
    var a = Mv(t, o, e, 0, null, !1, !1, "", Vm);
    return e._reactRootContainer = a, e[Yn] = a.current, ul(e.nodeType === 8 ? e.parentNode : e), ti(), a;
  }
  for (; l = e.lastChild; ) e.removeChild(l);
  if (typeof o == "function") {
    var d = o;
    o = function() {
      var m = ku(p);
      d.call(m);
    };
  }
  var p = Od(e, 0, !1, null, null, !1, !1, "", Vm);
  return e._reactRootContainer = p, e[Yn] = p.current, ul(e.nodeType === 8 ? e.parentNode : e), ti(function() {
    Uu(t, p, n, o);
  }), p;
}
function Wu(e, t, n, o, l) {
  var s = n._reactRootContainer;
  if (s) {
    var a = s;
    if (typeof l == "function") {
      var d = l;
      l = function() {
        var p = ku(a);
        d.call(p);
      };
    }
    Uu(t, a, e, l);
  } else a = eE(n, t, e, l, o);
  return ku(a);
}
uy = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = Bo(t.pendingLanes);
        n !== 0 && (rd(t, n | 1), Nt(t, De()), !(ce & 6) && ($i = De() + 500, Nr()));
      }
      break;
    case 13:
      ti(function() {
        var o = Zn(e, 1);
        if (o !== null) {
          var l = mt();
          Sn(o, e, 1, l);
        }
      }), Dd(e, 1);
  }
};
id = function(e) {
  if (e.tag === 13) {
    var t = Zn(e, 134217728);
    if (t !== null) {
      var n = mt();
      Sn(t, e, 134217728, n);
    }
    Dd(e, 134217728);
  }
};
ay = function(e) {
  if (e.tag === 13) {
    var t = kr(e), n = Zn(e, t);
    if (n !== null) {
      var o = mt();
      Sn(n, e, t, o);
    }
    Dd(e, t);
  }
};
cy = function() {
  return me;
};
fy = function(e, t) {
  var n = me;
  try {
    return me = e, t();
  } finally {
    me = n;
  }
};
sf = function(e, t, n) {
  switch (t) {
    case "input":
      if (bc(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var o = n[t];
          if (o !== e && o.form === e.form) {
            var l = Mu(o);
            if (!l) throw Error(U(90));
            Wg(o), bc(o, l);
          }
        }
      }
      break;
    case "textarea":
      Gg(e, n);
      break;
    case "select":
      t = n.value, t != null && Ui(e, !!n.multiple, t, !1);
  }
};
qg = Nd;
$g = ti;
var tE = { usingClientEntryPoint: !1, Events: [wl, Li, Mu, Zg, Jg, Nd] }, Io = { findFiberByHostInstance: Kr, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, nE = { bundleType: Io.bundleType, version: Io.version, rendererPackageName: Io.rendererPackageName, rendererConfig: Io.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: qn.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = ty(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Io.findFiberByHostInstance || b_, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Os = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Os.isDisabled && Os.supportsFiber) try {
    Ru = Os.inject(nE), Nn = Os;
  } catch {
  }
}
Vt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = tE;
Vt.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Fd(t)) throw Error(U(200));
  return $_(e, t, null, n);
};
Vt.createRoot = function(e, t) {
  if (!Fd(e)) throw Error(U(299));
  var n = !1, o = "", l = zv;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (o = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = Od(e, 1, !1, null, null, n, !1, o, l), e[Yn] = t.current, ul(e.nodeType === 8 ? e.parentNode : e), new jd(t);
};
Vt.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(U(188)) : (e = Object.keys(e).join(","), Error(U(268, e)));
  return e = ty(t), e = e === null ? null : e.stateNode, e;
};
Vt.flushSync = function(e) {
  return ti(e);
};
Vt.hydrate = function(e, t, n) {
  if (!Bu(t)) throw Error(U(200));
  return Wu(null, e, t, !0, n);
};
Vt.hydrateRoot = function(e, t, n) {
  if (!Fd(e)) throw Error(U(405));
  var o = n != null && n.hydratedSources || null, l = !1, s = "", a = zv;
  if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (s = n.identifierPrefix), n.onRecoverableError !== void 0 && (a = n.onRecoverableError)), t = Mv(t, null, e, 1, n ?? null, l, !1, s, a), e[Yn] = t.current, ul(e), o) for (e = 0; e < o.length; e++) n = o[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
    n,
    l
  );
  return new Hu(t);
};
Vt.render = function(e, t, n) {
  if (!Bu(t)) throw Error(U(200));
  return Wu(null, e, t, !1, n);
};
Vt.unmountComponentAtNode = function(e) {
  if (!Bu(e)) throw Error(U(40));
  return e._reactRootContainer ? (ti(function() {
    Wu(null, null, e, !1, function() {
      e._reactRootContainer = null, e[Yn] = null;
    });
  }), !0) : !1;
};
Vt.unstable_batchedUpdates = Nd;
Vt.unstable_renderSubtreeIntoContainer = function(e, t, n, o) {
  if (!Bu(n)) throw Error(U(200));
  if (e == null || e._reactInternals === void 0) throw Error(U(38));
  return Wu(e, t, n, !1, o);
};
Vt.version = "18.3.1-next-f1338f8080-20240426";
function Iv() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Iv);
    } catch (e) {
      console.error(e);
    }
}
Iv(), Ig.exports = Vt;
var rE = Ig.exports, Ov, Gm = rE;
Ov = Gm.createRoot, Gm.hydrateRoot;
var Dv = { exports: {} }, ii = {};
/**
 * @license React
 * react-reconciler-constants.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
ii.ConcurrentRoot = 1;
ii.ContinuousEventPriority = 4;
ii.DefaultEventPriority = 16;
ii.DiscreteEventPriority = 1;
ii.IdleEventPriority = 536870912;
ii.LegacyRoot = 0;
Dv.exports = ii;
var ji = Dv.exports;
function iE(e) {
  let t;
  const n = /* @__PURE__ */ new Set(), o = (m, g) => {
    const y = typeof m == "function" ? m(t) : m;
    if (y !== t) {
      const v = t;
      t = g ? y : Object.assign({}, t, y), n.forEach((_) => _(t, v));
    }
  }, l = () => t, s = (m, g = l, y = Object.is) => {
    console.warn("[DEPRECATED] Please use `subscribeWithSelector` middleware");
    let v = g(t);
    function _() {
      const k = g(t);
      if (!y(v, k)) {
        const R = v;
        m(v = k, R);
      }
    }
    return n.add(_), () => n.delete(_);
  }, p = { setState: o, getState: l, subscribe: (m, g, y) => g || y ? s(m, g, y) : (n.add(m), () => n.delete(m)), destroy: () => n.clear() };
  return t = e(o, l, p), p;
}
const oE = typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), Km = oE ? Q.useEffect : Q.useLayoutEffect;
function lE(e) {
  const t = typeof e == "function" ? iE(e) : e, n = (o = t.getState, l = Object.is) => {
    const [, s] = Q.useReducer((A) => A + 1, 0), a = t.getState(), d = Q.useRef(a), p = Q.useRef(o), m = Q.useRef(l), g = Q.useRef(!1), y = Q.useRef();
    y.current === void 0 && (y.current = o(a));
    let v, _ = !1;
    (d.current !== a || p.current !== o || m.current !== l || g.current) && (v = o(a), _ = !l(y.current, v)), Km(() => {
      _ && (y.current = v), d.current = a, p.current = o, m.current = l, g.current = !1;
    });
    const k = Q.useRef(a);
    Km(() => {
      const A = () => {
        try {
          const S = t.getState(), E = p.current(S);
          m.current(y.current, E) || (d.current = S, y.current = E, s());
        } catch {
          g.current = !0, s();
        }
      }, w = t.subscribe(A);
      return t.getState() !== k.current && A(), w;
    }, []);
    const R = _ ? v : y.current;
    return Q.useDebugValue(R), R;
  };
  return Object.assign(n, t), n[Symbol.iterator] = function() {
    console.warn("[useStore, api] = create() is deprecated and will be removed in v4");
    const o = [n, t];
    return {
      next() {
        const l = o.length <= 0;
        return { value: o.shift(), done: l };
      }
    };
  }, n;
}
const sE = (e) => typeof e == "object" && typeof e.then == "function", Yr = [];
function jv(e, t, n = (o, l) => o === l) {
  if (e === t) return !0;
  if (!e || !t) return !1;
  const o = e.length;
  if (t.length !== o) return !1;
  for (let l = 0; l < o; l++) if (!n(e[l], t[l])) return !1;
  return !0;
}
function Fv(e, t = null, n = !1, o = {}) {
  t === null && (t = [e]);
  for (const s of Yr)
    if (jv(t, s.keys, s.equal)) {
      if (n) return;
      if (Object.prototype.hasOwnProperty.call(s, "error")) throw s.error;
      if (Object.prototype.hasOwnProperty.call(s, "response"))
        return o.lifespan && o.lifespan > 0 && (s.timeout && clearTimeout(s.timeout), s.timeout = setTimeout(s.remove, o.lifespan)), s.response;
      if (!n) throw s.promise;
    }
  const l = {
    keys: t,
    equal: o.equal,
    remove: () => {
      const s = Yr.indexOf(l);
      s !== -1 && Yr.splice(s, 1);
    },
    promise: (
      // Execute the promise
      (sE(e) ? e : e(...t)).then((s) => {
        l.response = s, o.lifespan && o.lifespan > 0 && (l.timeout = setTimeout(l.remove, o.lifespan));
      }).catch((s) => l.error = s)
    )
  };
  if (Yr.push(l), !n) throw l.promise;
}
const uE = (e, t, n) => Fv(e, t, !1, n), aE = (e, t, n) => void Fv(e, t, !0, n), cE = (e) => {
  if (e === void 0 || e.length === 0) Yr.splice(0, Yr.length);
  else {
    const t = Yr.find((n) => jv(e, n.keys, n.equal));
    t && t.remove();
  }
};
var Uv = { exports: {} }, Hv = { exports: {} }, Bv = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
(function(e) {
  function t(N, F) {
    var j = N.length;
    N.push(F);
    e: for (; 0 < j; ) {
      var X = j - 1 >>> 1, te = N[X];
      if (0 < l(te, F)) N[X] = F, N[j] = te, j = X;
      else break e;
    }
  }
  function n(N) {
    return N.length === 0 ? null : N[0];
  }
  function o(N) {
    if (N.length === 0) return null;
    var F = N[0], j = N.pop();
    if (j !== F) {
      N[0] = j;
      e: for (var X = 0, te = N.length, ae = te >>> 1; X < ae; ) {
        var Me = 2 * (X + 1) - 1, tt = N[Me], Ge = Me + 1, Kt = N[Ge];
        if (0 > l(tt, j)) Ge < te && 0 > l(Kt, tt) ? (N[X] = Kt, N[Ge] = j, X = Ge) : (N[X] = tt, N[Me] = j, X = Me);
        else if (Ge < te && 0 > l(Kt, j)) N[X] = Kt, N[Ge] = j, X = Ge;
        else break e;
      }
    }
    return F;
  }
  function l(N, F) {
    var j = N.sortIndex - F.sortIndex;
    return j !== 0 ? j : N.id - F.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var s = performance;
    e.unstable_now = function() {
      return s.now();
    };
  } else {
    var a = Date, d = a.now();
    e.unstable_now = function() {
      return a.now() - d;
    };
  }
  var p = [], m = [], g = 1, y = null, v = 3, _ = !1, k = !1, R = !1, A = typeof setTimeout == "function" ? setTimeout : null, w = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function E(N) {
    for (var F = n(m); F !== null; ) {
      if (F.callback === null) o(m);
      else if (F.startTime <= N) o(m), F.sortIndex = F.expirationTime, t(p, F);
      else break;
      F = n(m);
    }
  }
  function C(N) {
    if (R = !1, E(N), !k) if (n(p) !== null) k = !0, Je(I);
    else {
      var F = n(m);
      F !== null && St(C, F.startTime - N);
    }
  }
  function I(N, F) {
    k = !1, R && (R = !1, w(H), H = -1), _ = !0;
    var j = v;
    try {
      for (E(F), y = n(p); y !== null && (!(y.expirationTime > F) || N && !G()); ) {
        var X = y.callback;
        if (typeof X == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = X(y.expirationTime <= F);
          F = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && o(p), E(F);
        } else o(p);
        y = n(p);
      }
      if (y !== null) var ae = !0;
      else {
        var Me = n(m);
        Me !== null && St(C, Me.startTime - F), ae = !1;
      }
      return ae;
    } finally {
      y = null, v = j, _ = !1;
    }
  }
  var O = !1, D = null, H = -1, J = 5, W = -1;
  function G() {
    return !(e.unstable_now() - W < J);
  }
  function le() {
    if (D !== null) {
      var N = e.unstable_now();
      W = N;
      var F = !0;
      try {
        F = D(!0, N);
      } finally {
        F ? ve() : (O = !1, D = null);
      }
    } else O = !1;
  }
  var ve;
  if (typeof S == "function") ve = function() {
    S(le);
  };
  else if (typeof MessageChannel < "u") {
    var vt = new MessageChannel(), Mt = vt.port2;
    vt.port1.onmessage = le, ve = function() {
      Mt.postMessage(null);
    };
  } else ve = function() {
    A(le, 0);
  };
  function Je(N) {
    D = N, O || (O = !0, ve());
  }
  function St(N, F) {
    H = A(function() {
      N(e.unstable_now());
    }, F);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    k || _ || (k = !0, Je(I));
  }, e.unstable_forceFrameRate = function(N) {
    0 > N || 125 < N ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : J = 0 < N ? Math.floor(1e3 / N) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return v;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(p);
  }, e.unstable_next = function(N) {
    switch (v) {
      case 1:
      case 2:
      case 3:
        var F = 3;
        break;
      default:
        F = v;
    }
    var j = v;
    v = F;
    try {
      return N();
    } finally {
      v = j;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(N, F) {
    switch (N) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        break;
      default:
        N = 3;
    }
    var j = v;
    v = N;
    try {
      return F();
    } finally {
      v = j;
    }
  }, e.unstable_scheduleCallback = function(N, F, j) {
    var X = e.unstable_now();
    switch (typeof j == "object" && j !== null ? (j = j.delay, j = typeof j == "number" && 0 < j ? X + j : X) : j = X, N) {
      case 1:
        var te = -1;
        break;
      case 2:
        te = 250;
        break;
      case 5:
        te = 1073741823;
        break;
      case 4:
        te = 1e4;
        break;
      default:
        te = 5e3;
    }
    return te = j + te, N = { id: g++, callback: F, priorityLevel: N, startTime: j, expirationTime: te, sortIndex: -1 }, j > X ? (N.sortIndex = j, t(m, N), n(p) === null && N === n(m) && (R ? (w(H), H = -1) : R = !0, St(C, j - X))) : (N.sortIndex = te, t(p, N), k || _ || (k = !0, Je(I))), N;
  }, e.unstable_shouldYield = G, e.unstable_wrapCallback = function(N) {
    var F = v;
    return function() {
      var j = v;
      v = F;
      try {
        return N.apply(this, arguments);
      } finally {
        v = j;
      }
    };
  };
})(Bv);
Hv.exports = Bv;
var Hf = Hv.exports;
/**
 * @license React
 * react-reconciler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var fE = function(t) {
  var n = {}, o = Q, l = Hf, s = Object.assign;
  function a(r) {
    for (var i = "https://reactjs.org/docs/error-decoder.html?invariant=" + r, u = 1; u < arguments.length; u++) i += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + r + "; visit " + i + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var d = o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, p = Symbol.for("react.element"), m = Symbol.for("react.portal"), g = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), v = Symbol.for("react.profiler"), _ = Symbol.for("react.provider"), k = Symbol.for("react.context"), R = Symbol.for("react.forward_ref"), A = Symbol.for("react.suspense"), w = Symbol.for("react.suspense_list"), S = Symbol.for("react.memo"), E = Symbol.for("react.lazy"), C = Symbol.for("react.offscreen"), I = Symbol.iterator;
  function O(r) {
    return r === null || typeof r != "object" ? null : (r = I && r[I] || r["@@iterator"], typeof r == "function" ? r : null);
  }
  function D(r) {
    if (r == null) return null;
    if (typeof r == "function") return r.displayName || r.name || null;
    if (typeof r == "string") return r;
    switch (r) {
      case g:
        return "Fragment";
      case m:
        return "Portal";
      case v:
        return "Profiler";
      case y:
        return "StrictMode";
      case A:
        return "Suspense";
      case w:
        return "SuspenseList";
    }
    if (typeof r == "object") switch (r.$$typeof) {
      case k:
        return (r.displayName || "Context") + ".Consumer";
      case _:
        return (r._context.displayName || "Context") + ".Provider";
      case R:
        var i = r.render;
        return r = r.displayName, r || (r = i.displayName || i.name || "", r = r !== "" ? "ForwardRef(" + r + ")" : "ForwardRef"), r;
      case S:
        return i = r.displayName || null, i !== null ? i : D(r.type) || "Memo";
      case E:
        i = r._payload, r = r._init;
        try {
          return D(r(i));
        } catch {
        }
    }
    return null;
  }
  function H(r) {
    var i = r.type;
    switch (r.tag) {
      case 24:
        return "Cache";
      case 9:
        return (i.displayName || "Context") + ".Consumer";
      case 10:
        return (i._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return r = i.render, r = r.displayName || r.name || "", i.displayName || (r !== "" ? "ForwardRef(" + r + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return i;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return D(i);
      case 8:
        return i === y ? "StrictMode" : "Mode";
      case 22:
        return "Offscreen";
      case 12:
        return "Profiler";
      case 21:
        return "Scope";
      case 13:
        return "Suspense";
      case 19:
        return "SuspenseList";
      case 25:
        return "TracingMarker";
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if (typeof i == "function") return i.displayName || i.name || null;
        if (typeof i == "string") return i;
    }
    return null;
  }
  function J(r) {
    var i = r, u = r;
    if (r.alternate) for (; i.return; ) i = i.return;
    else {
      r = i;
      do
        i = r, i.flags & 4098 && (u = i.return), r = i.return;
      while (r);
    }
    return i.tag === 3 ? u : null;
  }
  function W(r) {
    if (J(r) !== r) throw Error(a(188));
  }
  function G(r) {
    var i = r.alternate;
    if (!i) {
      if (i = J(r), i === null) throw Error(a(188));
      return i !== r ? null : r;
    }
    for (var u = r, c = i; ; ) {
      var f = u.return;
      if (f === null) break;
      var h = f.alternate;
      if (h === null) {
        if (c = f.return, c !== null) {
          u = c;
          continue;
        }
        break;
      }
      if (f.child === h.child) {
        for (h = f.child; h; ) {
          if (h === u) return W(f), r;
          if (h === c) return W(f), i;
          h = h.sibling;
        }
        throw Error(a(188));
      }
      if (u.return !== c.return) u = f, c = h;
      else {
        for (var x = !1, T = f.child; T; ) {
          if (T === u) {
            x = !0, u = f, c = h;
            break;
          }
          if (T === c) {
            x = !0, c = f, u = h;
            break;
          }
          T = T.sibling;
        }
        if (!x) {
          for (T = h.child; T; ) {
            if (T === u) {
              x = !0, u = h, c = f;
              break;
            }
            if (T === c) {
              x = !0, c = h, u = f;
              break;
            }
            T = T.sibling;
          }
          if (!x) throw Error(a(189));
        }
      }
      if (u.alternate !== c) throw Error(a(190));
    }
    if (u.tag !== 3) throw Error(a(188));
    return u.stateNode.current === u ? r : i;
  }
  function le(r) {
    return r = G(r), r !== null ? ve(r) : null;
  }
  function ve(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      var i = ve(r);
      if (i !== null) return i;
      r = r.sibling;
    }
    return null;
  }
  function vt(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      if (r.tag !== 4) {
        var i = vt(r);
        if (i !== null) return i;
      }
      r = r.sibling;
    }
    return null;
  }
  var Mt = Array.isArray, Je = t.getPublicInstance, St = t.getRootHostContext, N = t.getChildHostContext, F = t.prepareForCommit, j = t.resetAfterCommit, X = t.createInstance, te = t.appendInitialChild, ae = t.finalizeInitialChildren, Me = t.prepareUpdate, tt = t.shouldSetTextContent, Ge = t.createTextInstance, Kt = t.scheduleTimeout, a0 = t.cancelTimeout, Gu = t.noTimeout, xl = t.isPrimaryRenderer, an = t.supportsMutation, kl = t.supportsPersistence, zt = t.supportsHydration, c0 = t.getInstanceFromNode, f0 = t.preparePortalMount, d0 = t.getCurrentEventPriority, p0 = t.detachDeletedInstance, h0 = t.supportsMicrotasks, m0 = t.scheduleMicrotask, ro = t.supportsTestSelectors, g0 = t.findFiberRoot, y0 = t.getBoundingRect, v0 = t.getTextContent, io = t.isHiddenSubtree, S0 = t.matchAccessibilityRole, w0 = t.setFocusIfFocusable, _0 = t.setupIntersectionObserver, E0 = t.appendChild, x0 = t.appendChildToContainer, k0 = t.commitTextUpdate, T0 = t.commitMount, P0 = t.commitUpdate, C0 = t.insertBefore, R0 = t.insertInContainerBefore, A0 = t.removeChild, L0 = t.removeChildFromContainer, Vd = t.resetTextContent, N0 = t.hideInstance, M0 = t.hideTextInstance, z0 = t.unhideInstance, I0 = t.unhideTextInstance, O0 = t.clearContainer, D0 = t.cloneInstance, Gd = t.createContainerChildSet, Kd = t.appendChildToContainerChildSet, j0 = t.finalizeContainerChildren, Qd = t.replaceContainerChildren, Xd = t.cloneHiddenInstance, Yd = t.cloneHiddenTextInstance, F0 = t.canHydrateInstance, U0 = t.canHydrateTextInstance, H0 = t.canHydrateSuspenseInstance, Zd = t.isSuspenseInstancePending, Ku = t.isSuspenseInstanceFallback, B0 = t.registerSuspenseInstanceRetry, oo = t.getNextHydratableSibling, W0 = t.getFirstHydratableChild, V0 = t.getFirstHydratableChildWithinContainer, G0 = t.getFirstHydratableChildWithinSuspenseInstance, K0 = t.hydrateInstance, Q0 = t.hydrateTextInstance, X0 = t.hydrateSuspenseInstance, Y0 = t.getNextHydratableInstanceAfterSuspenseInstance, Jd = t.commitHydratedContainer, Z0 = t.commitHydratedSuspenseInstance, J0 = t.clearSuspenseBoundary, q0 = t.clearSuspenseBoundaryFromContainer, $0 = t.shouldDeleteUnhydratedTailInstances, b0 = t.didNotMatchHydratedContainerTextInstance, e1 = t.didNotMatchHydratedTextInstance, Qu;
  function lo(r) {
    if (Qu === void 0) try {
      throw Error();
    } catch (u) {
      var i = u.stack.trim().match(/\n( *(at )?)/);
      Qu = i && i[1] || "";
    }
    return `
` + Qu + r;
  }
  var Xu = !1;
  function Yu(r, i) {
    if (!r || Xu) return "";
    Xu = !0;
    var u = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (i) if (i = function() {
        throw Error();
      }, Object.defineProperty(i.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(i, []);
        } catch (B) {
          var c = B;
        }
        Reflect.construct(r, [], i);
      } else {
        try {
          i.call();
        } catch (B) {
          c = B;
        }
        r.call(i.prototype);
      }
      else {
        try {
          throw Error();
        } catch (B) {
          c = B;
        }
        r();
      }
    } catch (B) {
      if (B && c && typeof B.stack == "string") {
        for (var f = B.stack.split(`
`), h = c.stack.split(`
`), x = f.length - 1, T = h.length - 1; 1 <= x && 0 <= T && f[x] !== h[T]; ) T--;
        for (; 1 <= x && 0 <= T; x--, T--) if (f[x] !== h[T]) {
          if (x !== 1 || T !== 1)
            do
              if (x--, T--, 0 > T || f[x] !== h[T]) {
                var z = `
` + f[x].replace(" at new ", " at ");
                return r.displayName && z.includes("<anonymous>") && (z = z.replace("<anonymous>", r.displayName)), z;
              }
            while (1 <= x && 0 <= T);
          break;
        }
      }
    } finally {
      Xu = !1, Error.prepareStackTrace = u;
    }
    return (r = r ? r.displayName || r.name : "") ? lo(r) : "";
  }
  var t1 = Object.prototype.hasOwnProperty, Zu = [], oi = -1;
  function $n(r) {
    return { current: r };
  }
  function xe(r) {
    0 > oi || (r.current = Zu[oi], Zu[oi] = null, oi--);
  }
  function Se(r, i) {
    oi++, Zu[oi] = r.current, r.current = i;
  }
  var bn = {}, nt = $n(bn), wt = $n(!1), Mr = bn;
  function li(r, i) {
    var u = r.type.contextTypes;
    if (!u) return bn;
    var c = r.stateNode;
    if (c && c.__reactInternalMemoizedUnmaskedChildContext === i) return c.__reactInternalMemoizedMaskedChildContext;
    var f = {}, h;
    for (h in u) f[h] = i[h];
    return c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = i, r.__reactInternalMemoizedMaskedChildContext = f), f;
  }
  function _t(r) {
    return r = r.childContextTypes, r != null;
  }
  function Tl() {
    xe(wt), xe(nt);
  }
  function qd(r, i, u) {
    if (nt.current !== bn) throw Error(a(168));
    Se(nt, i), Se(wt, u);
  }
  function $d(r, i, u) {
    var c = r.stateNode;
    if (i = i.childContextTypes, typeof c.getChildContext != "function") return u;
    c = c.getChildContext();
    for (var f in c) if (!(f in i)) throw Error(a(108, H(r) || "Unknown", f));
    return s({}, u, c);
  }
  function Pl(r) {
    return r = (r = r.stateNode) && r.__reactInternalMemoizedMergedChildContext || bn, Mr = nt.current, Se(nt, r), Se(wt, wt.current), !0;
  }
  function bd(r, i, u) {
    var c = r.stateNode;
    if (!c) throw Error(a(169));
    u ? (r = $d(r, i, Mr), c.__reactInternalMemoizedMergedChildContext = r, xe(wt), xe(nt), Se(nt, r)) : xe(wt), Se(wt, u);
  }
  var cn = Math.clz32 ? Math.clz32 : i1, n1 = Math.log, r1 = Math.LN2;
  function i1(r) {
    return r >>>= 0, r === 0 ? 32 : 31 - (n1(r) / r1 | 0) | 0;
  }
  var Cl = 64, Rl = 4194304;
  function so(r) {
    switch (r & -r) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return r & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return r & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return r;
    }
  }
  function Al(r, i) {
    var u = r.pendingLanes;
    if (u === 0) return 0;
    var c = 0, f = r.suspendedLanes, h = r.pingedLanes, x = u & 268435455;
    if (x !== 0) {
      var T = x & ~f;
      T !== 0 ? c = so(T) : (h &= x, h !== 0 && (c = so(h)));
    } else x = u & ~f, x !== 0 ? c = so(x) : h !== 0 && (c = so(h));
    if (c === 0) return 0;
    if (i !== 0 && i !== c && !(i & f) && (f = c & -c, h = i & -i, f >= h || f === 16 && (h & 4194240) !== 0)) return i;
    if (c & 4 && (c |= u & 16), i = r.entangledLanes, i !== 0) for (r = r.entanglements, i &= c; 0 < i; ) u = 31 - cn(i), f = 1 << u, c |= r[u], i &= ~f;
    return c;
  }
  function o1(r, i) {
    switch (r) {
      case 1:
      case 2:
      case 4:
        return i + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return i + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function l1(r, i) {
    for (var u = r.suspendedLanes, c = r.pingedLanes, f = r.expirationTimes, h = r.pendingLanes; 0 < h; ) {
      var x = 31 - cn(h), T = 1 << x, z = f[x];
      z === -1 ? (!(T & u) || T & c) && (f[x] = o1(T, i)) : z <= i && (r.expiredLanes |= T), h &= ~T;
    }
  }
  function Ju(r) {
    return r = r.pendingLanes & -1073741825, r !== 0 ? r : r & 1073741824 ? 1073741824 : 0;
  }
  function qu(r) {
    for (var i = [], u = 0; 31 > u; u++) i.push(r);
    return i;
  }
  function uo(r, i, u) {
    r.pendingLanes |= i, i !== 536870912 && (r.suspendedLanes = 0, r.pingedLanes = 0), r = r.eventTimes, i = 31 - cn(i), r[i] = u;
  }
  function s1(r, i) {
    var u = r.pendingLanes & ~i;
    r.pendingLanes = i, r.suspendedLanes = 0, r.pingedLanes = 0, r.expiredLanes &= i, r.mutableReadLanes &= i, r.entangledLanes &= i, i = r.entanglements;
    var c = r.eventTimes;
    for (r = r.expirationTimes; 0 < u; ) {
      var f = 31 - cn(u), h = 1 << f;
      i[f] = 0, c[f] = -1, r[f] = -1, u &= ~h;
    }
  }
  function $u(r, i) {
    var u = r.entangledLanes |= i;
    for (r = r.entanglements; u; ) {
      var c = 31 - cn(u), f = 1 << c;
      f & i | r[c] & i && (r[c] |= i), u &= ~f;
    }
  }
  var fe = 0;
  function ep(r) {
    return r &= -r, 1 < r ? 4 < r ? r & 268435455 ? 16 : 536870912 : 4 : 1;
  }
  var bu = l.unstable_scheduleCallback, tp = l.unstable_cancelCallback, u1 = l.unstable_shouldYield, a1 = l.unstable_requestPaint, Ke = l.unstable_now, ea = l.unstable_ImmediatePriority, c1 = l.unstable_UserBlockingPriority, ta = l.unstable_NormalPriority, f1 = l.unstable_IdlePriority, Ll = null, _n = null;
  function d1(r) {
    if (_n && typeof _n.onCommitFiberRoot == "function") try {
      _n.onCommitFiberRoot(Ll, r, void 0, (r.current.flags & 128) === 128);
    } catch {
    }
  }
  function p1(r, i) {
    return r === i && (r !== 0 || 1 / r === 1 / i) || r !== r && i !== i;
  }
  var En = typeof Object.is == "function" ? Object.is : p1, On = null, Nl = !1, na = !1;
  function np(r) {
    On === null ? On = [r] : On.push(r);
  }
  function h1(r) {
    Nl = !0, np(r);
  }
  function xn() {
    if (!na && On !== null) {
      na = !0;
      var r = 0, i = fe;
      try {
        var u = On;
        for (fe = 1; r < u.length; r++) {
          var c = u[r];
          do
            c = c(!0);
          while (c !== null);
        }
        On = null, Nl = !1;
      } catch (f) {
        throw On !== null && (On = On.slice(r + 1)), bu(ea, xn), f;
      } finally {
        fe = i, na = !1;
      }
    }
    return null;
  }
  var m1 = d.ReactCurrentBatchConfig;
  function Ml(r, i) {
    if (En(r, i)) return !0;
    if (typeof r != "object" || r === null || typeof i != "object" || i === null) return !1;
    var u = Object.keys(r), c = Object.keys(i);
    if (u.length !== c.length) return !1;
    for (c = 0; c < u.length; c++) {
      var f = u[c];
      if (!t1.call(i, f) || !En(r[f], i[f])) return !1;
    }
    return !0;
  }
  function g1(r) {
    switch (r.tag) {
      case 5:
        return lo(r.type);
      case 16:
        return lo("Lazy");
      case 13:
        return lo("Suspense");
      case 19:
        return lo("SuspenseList");
      case 0:
      case 2:
      case 15:
        return r = Yu(r.type, !1), r;
      case 11:
        return r = Yu(r.type.render, !1), r;
      case 1:
        return r = Yu(r.type, !0), r;
      default:
        return "";
    }
  }
  function fn(r, i) {
    if (r && r.defaultProps) {
      i = s({}, i), r = r.defaultProps;
      for (var u in r) i[u] === void 0 && (i[u] = r[u]);
      return i;
    }
    return i;
  }
  var zl = $n(null), Il = null, si = null, ra = null;
  function ia() {
    ra = si = Il = null;
  }
  function rp(r, i, u) {
    xl ? (Se(zl, i._currentValue), i._currentValue = u) : (Se(zl, i._currentValue2), i._currentValue2 = u);
  }
  function oa(r) {
    var i = zl.current;
    xe(zl), xl ? r._currentValue = i : r._currentValue2 = i;
  }
  function la(r, i, u) {
    for (; r !== null; ) {
      var c = r.alternate;
      if ((r.childLanes & i) !== i ? (r.childLanes |= i, c !== null && (c.childLanes |= i)) : c !== null && (c.childLanes & i) !== i && (c.childLanes |= i), r === u) break;
      r = r.return;
    }
  }
  function ui(r, i) {
    Il = r, ra = si = null, r = r.dependencies, r !== null && r.firstContext !== null && (r.lanes & i && (Dt = !0), r.firstContext = null);
  }
  function Qt(r) {
    var i = xl ? r._currentValue : r._currentValue2;
    if (ra !== r) if (r = { context: r, memoizedValue: i, next: null }, si === null) {
      if (Il === null) throw Error(a(308));
      si = r, Il.dependencies = { lanes: 0, firstContext: r };
    } else si = si.next = r;
    return i;
  }
  var kn = null, er = !1;
  function sa(r) {
    r.updateQueue = { baseState: r.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function ip(r, i) {
    r = r.updateQueue, i.updateQueue === r && (i.updateQueue = { baseState: r.baseState, firstBaseUpdate: r.firstBaseUpdate, lastBaseUpdate: r.lastBaseUpdate, shared: r.shared, effects: r.effects });
  }
  function Dn(r, i) {
    return { eventTime: r, lane: i, tag: 0, payload: null, callback: null, next: null };
  }
  function tr(r, i) {
    var u = r.updateQueue;
    u !== null && (u = u.shared, je !== null && r.mode & 1 && !(oe & 2) ? (r = u.interleaved, r === null ? (i.next = i, kn === null ? kn = [u] : kn.push(u)) : (i.next = r.next, r.next = i), u.interleaved = i) : (r = u.pending, r === null ? i.next = i : (i.next = r.next, r.next = i), u.pending = i));
  }
  function Ol(r, i, u) {
    if (i = i.updateQueue, i !== null && (i = i.shared, (u & 4194240) !== 0)) {
      var c = i.lanes;
      c &= r.pendingLanes, u |= c, i.lanes = u, $u(r, u);
    }
  }
  function op(r, i) {
    var u = r.updateQueue, c = r.alternate;
    if (c !== null && (c = c.updateQueue, u === c)) {
      var f = null, h = null;
      if (u = u.firstBaseUpdate, u !== null) {
        do {
          var x = { eventTime: u.eventTime, lane: u.lane, tag: u.tag, payload: u.payload, callback: u.callback, next: null };
          h === null ? f = h = x : h = h.next = x, u = u.next;
        } while (u !== null);
        h === null ? f = h = i : h = h.next = i;
      } else f = h = i;
      u = { baseState: c.baseState, firstBaseUpdate: f, lastBaseUpdate: h, shared: c.shared, effects: c.effects }, r.updateQueue = u;
      return;
    }
    r = u.lastBaseUpdate, r === null ? u.firstBaseUpdate = i : r.next = i, u.lastBaseUpdate = i;
  }
  function Dl(r, i, u, c) {
    var f = r.updateQueue;
    er = !1;
    var h = f.firstBaseUpdate, x = f.lastBaseUpdate, T = f.shared.pending;
    if (T !== null) {
      f.shared.pending = null;
      var z = T, B = z.next;
      z.next = null, x === null ? h = B : x.next = B, x = z;
      var Z = r.alternate;
      Z !== null && (Z = Z.updateQueue, T = Z.lastBaseUpdate, T !== x && (T === null ? Z.firstBaseUpdate = B : T.next = B, Z.lastBaseUpdate = z));
    }
    if (h !== null) {
      var ne = f.baseState;
      x = 0, Z = B = z = null, T = h;
      do {
        var ee = T.lane, ye = T.eventTime;
        if ((c & ee) === ee) {
          Z !== null && (Z = Z.next = {
            eventTime: ye,
            lane: 0,
            tag: T.tag,
            payload: T.payload,
            callback: T.callback,
            next: null
          });
          e: {
            var b = r, lt = T;
            switch (ee = i, ye = u, lt.tag) {
              case 1:
                if (b = lt.payload, typeof b == "function") {
                  ne = b.call(ye, ne, ee);
                  break e;
                }
                ne = b;
                break e;
              case 3:
                b.flags = b.flags & -65537 | 128;
              case 0:
                if (b = lt.payload, ee = typeof b == "function" ? b.call(ye, ne, ee) : b, ee == null) break e;
                ne = s({}, ne, ee);
                break e;
              case 2:
                er = !0;
            }
          }
          T.callback !== null && T.lane !== 0 && (r.flags |= 64, ee = f.effects, ee === null ? f.effects = [T] : ee.push(T));
        } else ye = { eventTime: ye, lane: ee, tag: T.tag, payload: T.payload, callback: T.callback, next: null }, Z === null ? (B = Z = ye, z = ne) : Z = Z.next = ye, x |= ee;
        if (T = T.next, T === null) {
          if (T = f.shared.pending, T === null) break;
          ee = T, T = ee.next, ee.next = null, f.lastBaseUpdate = ee, f.shared.pending = null;
        }
      } while (!0);
      if (Z === null && (z = ne), f.baseState = z, f.firstBaseUpdate = B, f.lastBaseUpdate = Z, i = f.shared.interleaved, i !== null) {
        f = i;
        do
          x |= f.lane, f = f.next;
        while (f !== i);
      } else h === null && (f.shared.lanes = 0);
      yi |= x, r.lanes = x, r.memoizedState = ne;
    }
  }
  function lp(r, i, u) {
    if (r = i.effects, i.effects = null, r !== null) for (i = 0; i < r.length; i++) {
      var c = r[i], f = c.callback;
      if (f !== null) {
        if (c.callback = null, c = u, typeof f != "function") throw Error(a(191, f));
        f.call(c);
      }
    }
  }
  var sp = new o.Component().refs;
  function ua(r, i, u, c) {
    i = r.memoizedState, u = u(c, i), u = u == null ? i : s({}, i, u), r.memoizedState = u, r.lanes === 0 && (r.updateQueue.baseState = u);
  }
  var jl = { isMounted: function(r) {
    return (r = r._reactInternals) ? J(r) === r : !1;
  }, enqueueSetState: function(r, i, u) {
    r = r._reactInternals;
    var c = pt(), f = ir(r), h = Dn(c, f);
    h.payload = i, u != null && (h.callback = u), tr(r, h), i = qt(r, f, c), i !== null && Ol(i, r, f);
  }, enqueueReplaceState: function(r, i, u) {
    r = r._reactInternals;
    var c = pt(), f = ir(r), h = Dn(c, f);
    h.tag = 1, h.payload = i, u != null && (h.callback = u), tr(r, h), i = qt(r, f, c), i !== null && Ol(i, r, f);
  }, enqueueForceUpdate: function(r, i) {
    r = r._reactInternals;
    var u = pt(), c = ir(r), f = Dn(
      u,
      c
    );
    f.tag = 2, i != null && (f.callback = i), tr(r, f), i = qt(r, c, u), i !== null && Ol(i, r, c);
  } };
  function up(r, i, u, c, f, h, x) {
    return r = r.stateNode, typeof r.shouldComponentUpdate == "function" ? r.shouldComponentUpdate(c, h, x) : i.prototype && i.prototype.isPureReactComponent ? !Ml(u, c) || !Ml(f, h) : !0;
  }
  function ap(r, i, u) {
    var c = !1, f = bn, h = i.contextType;
    return typeof h == "object" && h !== null ? h = Qt(h) : (f = _t(i) ? Mr : nt.current, c = i.contextTypes, h = (c = c != null) ? li(r, f) : bn), i = new i(u, h), r.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, i.updater = jl, r.stateNode = i, i._reactInternals = r, c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = f, r.__reactInternalMemoizedMaskedChildContext = h), i;
  }
  function cp(r, i, u, c) {
    r = i.state, typeof i.componentWillReceiveProps == "function" && i.componentWillReceiveProps(u, c), typeof i.UNSAFE_componentWillReceiveProps == "function" && i.UNSAFE_componentWillReceiveProps(u, c), i.state !== r && jl.enqueueReplaceState(i, i.state, null);
  }
  function aa(r, i, u, c) {
    var f = r.stateNode;
    f.props = u, f.state = r.memoizedState, f.refs = sp, sa(r);
    var h = i.contextType;
    typeof h == "object" && h !== null ? f.context = Qt(h) : (h = _t(i) ? Mr : nt.current, f.context = li(r, h)), f.state = r.memoizedState, h = i.getDerivedStateFromProps, typeof h == "function" && (ua(r, i, h, u), f.state = r.memoizedState), typeof i.getDerivedStateFromProps == "function" || typeof f.getSnapshotBeforeUpdate == "function" || typeof f.UNSAFE_componentWillMount != "function" && typeof f.componentWillMount != "function" || (i = f.state, typeof f.componentWillMount == "function" && f.componentWillMount(), typeof f.UNSAFE_componentWillMount == "function" && f.UNSAFE_componentWillMount(), i !== f.state && jl.enqueueReplaceState(f, f.state, null), Dl(r, u, f, c), f.state = r.memoizedState), typeof f.componentDidMount == "function" && (r.flags |= 4194308);
  }
  var ai = [], ci = 0, Fl = null, Ul = 0, Xt = [], Yt = 0, zr = null, jn = 1, Fn = "";
  function Ir(r, i) {
    ai[ci++] = Ul, ai[ci++] = Fl, Fl = r, Ul = i;
  }
  function fp(r, i, u) {
    Xt[Yt++] = jn, Xt[Yt++] = Fn, Xt[Yt++] = zr, zr = r;
    var c = jn;
    r = Fn;
    var f = 32 - cn(c) - 1;
    c &= ~(1 << f), u += 1;
    var h = 32 - cn(i) + f;
    if (30 < h) {
      var x = f - f % 5;
      h = (c & (1 << x) - 1).toString(32), c >>= x, f -= x, jn = 1 << 32 - cn(i) + f | u << f | c, Fn = h + r;
    } else jn = 1 << h | u << f | c, Fn = r;
  }
  function ca(r) {
    r.return !== null && (Ir(r, 1), fp(r, 1, 0));
  }
  function fa(r) {
    for (; r === Fl; ) Fl = ai[--ci], ai[ci] = null, Ul = ai[--ci], ai[ci] = null;
    for (; r === zr; ) zr = Xt[--Yt], Xt[Yt] = null, Fn = Xt[--Yt], Xt[Yt] = null, jn = Xt[--Yt], Xt[Yt] = null;
  }
  var It = null, Ot = null, Pe = !1, ao = !1, dn = null;
  function dp(r, i) {
    var u = $t(5, null, null, 0);
    u.elementType = "DELETED", u.stateNode = i, u.return = r, i = r.deletions, i === null ? (r.deletions = [u], r.flags |= 16) : i.push(u);
  }
  function pp(r, i) {
    switch (r.tag) {
      case 5:
        return i = F0(i, r.type, r.pendingProps), i !== null ? (r.stateNode = i, It = r, Ot = W0(i), !0) : !1;
      case 6:
        return i = U0(i, r.pendingProps), i !== null ? (r.stateNode = i, It = r, Ot = null, !0) : !1;
      case 13:
        if (i = H0(i), i !== null) {
          var u = zr !== null ? { id: jn, overflow: Fn } : null;
          return r.memoizedState = { dehydrated: i, treeContext: u, retryLane: 1073741824 }, u = $t(18, null, null, 0), u.stateNode = i, u.return = r, r.child = u, It = r, Ot = null, !0;
        }
        return !1;
      default:
        return !1;
    }
  }
  function da(r) {
    return (r.mode & 1) !== 0 && (r.flags & 128) === 0;
  }
  function pa(r) {
    if (Pe) {
      var i = Ot;
      if (i) {
        var u = i;
        if (!pp(r, i)) {
          if (da(r)) throw Error(a(418));
          i = oo(u);
          var c = It;
          i && pp(r, i) ? dp(c, u) : (r.flags = r.flags & -4097 | 2, Pe = !1, It = r);
        }
      } else {
        if (da(r)) throw Error(a(418));
        r.flags = r.flags & -4097 | 2, Pe = !1, It = r;
      }
    }
  }
  function hp(r) {
    for (r = r.return; r !== null && r.tag !== 5 && r.tag !== 3 && r.tag !== 13; ) r = r.return;
    It = r;
  }
  function co(r) {
    if (!zt || r !== It) return !1;
    if (!Pe) return hp(r), Pe = !0, !1;
    if (r.tag !== 3 && (r.tag !== 5 || $0(r.type) && !tt(r.type, r.memoizedProps))) {
      var i = Ot;
      if (i) {
        if (da(r)) {
          for (r = Ot; r; ) r = oo(r);
          throw Error(a(418));
        }
        for (; i; ) dp(r, i), i = oo(i);
      }
    }
    if (hp(r), r.tag === 13) {
      if (!zt) throw Error(a(316));
      if (r = r.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
      Ot = Y0(r);
    } else Ot = It ? oo(r.stateNode) : null;
    return !0;
  }
  function fi() {
    zt && (Ot = It = null, ao = Pe = !1);
  }
  function ha(r) {
    dn === null ? dn = [r] : dn.push(r);
  }
  function fo(r, i, u) {
    if (r = u.ref, r !== null && typeof r != "function" && typeof r != "object") {
      if (u._owner) {
        if (u = u._owner, u) {
          if (u.tag !== 1) throw Error(a(309));
          var c = u.stateNode;
        }
        if (!c) throw Error(a(147, r));
        var f = c, h = "" + r;
        return i !== null && i.ref !== null && typeof i.ref == "function" && i.ref._stringRef === h ? i.ref : (i = function(x) {
          var T = f.refs;
          T === sp && (T = f.refs = {}), x === null ? delete T[h] : T[h] = x;
        }, i._stringRef = h, i);
      }
      if (typeof r != "string") throw Error(a(284));
      if (!u._owner) throw Error(a(290, r));
    }
    return r;
  }
  function Hl(r, i) {
    throw r = Object.prototype.toString.call(i), Error(a(31, r === "[object Object]" ? "object with keys {" + Object.keys(i).join(", ") + "}" : r));
  }
  function mp(r) {
    var i = r._init;
    return i(r._payload);
  }
  function gp(r) {
    function i(L, P) {
      if (r) {
        var M = L.deletions;
        M === null ? (L.deletions = [P], L.flags |= 16) : M.push(P);
      }
    }
    function u(L, P) {
      if (!r) return null;
      for (; P !== null; ) i(L, P), P = P.sibling;
      return null;
    }
    function c(L, P) {
      for (L = /* @__PURE__ */ new Map(); P !== null; ) P.key !== null ? L.set(P.key, P) : L.set(P.index, P), P = P.sibling;
      return L;
    }
    function f(L, P) {
      return L = lr(L, P), L.index = 0, L.sibling = null, L;
    }
    function h(L, P, M) {
      return L.index = M, r ? (M = L.alternate, M !== null ? (M = M.index, M < P ? (L.flags |= 2, P) : M) : (L.flags |= 2, P)) : (L.flags |= 1048576, P);
    }
    function x(L) {
      return r && L.alternate === null && (L.flags |= 2), L;
    }
    function T(L, P, M, K) {
      return P === null || P.tag !== 6 ? (P = qa(M, L.mode, K), P.return = L, P) : (P = f(P, M), P.return = L, P);
    }
    function z(L, P, M, K) {
      var $ = M.type;
      return $ === g ? Z(L, P, M.props.children, K, M.key) : P !== null && (P.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === E && mp($) === P.type) ? (K = f(P, M.props), K.ref = fo(L, P, M), K.return = L, K) : (K = ys(M.type, M.key, M.props, null, L.mode, K), K.ref = fo(L, P, M), K.return = L, K);
    }
    function B(L, P, M, K) {
      return P === null || P.tag !== 4 || P.stateNode.containerInfo !== M.containerInfo || P.stateNode.implementation !== M.implementation ? (P = $a(M, L.mode, K), P.return = L, P) : (P = f(P, M.children || []), P.return = L, P);
    }
    function Z(L, P, M, K, $) {
      return P === null || P.tag !== 7 ? (P = Br(M, L.mode, K, $), P.return = L, P) : (P = f(P, M), P.return = L, P);
    }
    function ne(L, P, M) {
      if (typeof P == "string" && P !== "" || typeof P == "number") return P = qa("" + P, L.mode, M), P.return = L, P;
      if (typeof P == "object" && P !== null) {
        switch (P.$$typeof) {
          case p:
            return M = ys(P.type, P.key, P.props, null, L.mode, M), M.ref = fo(L, null, P), M.return = L, M;
          case m:
            return P = $a(P, L.mode, M), P.return = L, P;
          case E:
            var K = P._init;
            return ne(L, K(P._payload), M);
        }
        if (Mt(P) || O(P)) return P = Br(P, L.mode, M, null), P.return = L, P;
        Hl(L, P);
      }
      return null;
    }
    function ee(L, P, M, K) {
      var $ = P !== null ? P.key : null;
      if (typeof M == "string" && M !== "" || typeof M == "number") return $ !== null ? null : T(L, P, "" + M, K);
      if (typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case p:
            return M.key === $ ? z(L, P, M, K) : null;
          case m:
            return M.key === $ ? B(L, P, M, K) : null;
          case E:
            return $ = M._init, ee(
              L,
              P,
              $(M._payload),
              K
            );
        }
        if (Mt(M) || O(M)) return $ !== null ? null : Z(L, P, M, K, null);
        Hl(L, M);
      }
      return null;
    }
    function ye(L, P, M, K, $) {
      if (typeof K == "string" && K !== "" || typeof K == "number") return L = L.get(M) || null, T(P, L, "" + K, $);
      if (typeof K == "object" && K !== null) {
        switch (K.$$typeof) {
          case p:
            return L = L.get(K.key === null ? M : K.key) || null, z(P, L, K, $);
          case m:
            return L = L.get(K.key === null ? M : K.key) || null, B(P, L, K, $);
          case E:
            var ie = K._init;
            return ye(L, P, M, ie(K._payload), $);
        }
        if (Mt(K) || O(K)) return L = L.get(M) || null, Z(P, L, K, $, null);
        Hl(P, K);
      }
      return null;
    }
    function b(L, P, M, K) {
      for (var $ = null, ie = null, re = P, de = P = 0, Xe = null; re !== null && de < M.length; de++) {
        re.index > de ? (Xe = re, re = null) : Xe = re.sibling;
        var pe = ee(L, re, M[de], K);
        if (pe === null) {
          re === null && (re = Xe);
          break;
        }
        r && re && pe.alternate === null && i(L, re), P = h(pe, P, de), ie === null ? $ = pe : ie.sibling = pe, ie = pe, re = Xe;
      }
      if (de === M.length) return u(L, re), Pe && Ir(L, de), $;
      if (re === null) {
        for (; de < M.length; de++) re = ne(L, M[de], K), re !== null && (P = h(re, P, de), ie === null ? $ = re : ie.sibling = re, ie = re);
        return Pe && Ir(L, de), $;
      }
      for (re = c(L, re); de < M.length; de++) Xe = ye(re, L, de, M[de], K), Xe !== null && (r && Xe.alternate !== null && re.delete(Xe.key === null ? de : Xe.key), P = h(Xe, P, de), ie === null ? $ = Xe : ie.sibling = Xe, ie = Xe);
      return r && re.forEach(function(sr) {
        return i(L, sr);
      }), Pe && Ir(L, de), $;
    }
    function lt(L, P, M, K) {
      var $ = O(M);
      if (typeof $ != "function") throw Error(a(150));
      if (M = $.call(M), M == null) throw Error(a(151));
      for (var ie = $ = null, re = P, de = P = 0, Xe = null, pe = M.next(); re !== null && !pe.done; de++, pe = M.next()) {
        re.index > de ? (Xe = re, re = null) : Xe = re.sibling;
        var sr = ee(L, re, pe.value, K);
        if (sr === null) {
          re === null && (re = Xe);
          break;
        }
        r && re && sr.alternate === null && i(L, re), P = h(sr, P, de), ie === null ? $ = sr : ie.sibling = sr, ie = sr, re = Xe;
      }
      if (pe.done) return u(
        L,
        re
      ), Pe && Ir(L, de), $;
      if (re === null) {
        for (; !pe.done; de++, pe = M.next()) pe = ne(L, pe.value, K), pe !== null && (P = h(pe, P, de), ie === null ? $ = pe : ie.sibling = pe, ie = pe);
        return Pe && Ir(L, de), $;
      }
      for (re = c(L, re); !pe.done; de++, pe = M.next()) pe = ye(re, L, de, pe.value, K), pe !== null && (r && pe.alternate !== null && re.delete(pe.key === null ? de : pe.key), P = h(pe, P, de), ie === null ? $ = pe : ie.sibling = pe, ie = pe);
      return r && re.forEach(function(Q1) {
        return i(L, Q1);
      }), Pe && Ir(L, de), $;
    }
    function bt(L, P, M, K) {
      if (typeof M == "object" && M !== null && M.type === g && M.key === null && (M = M.props.children), typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case p:
            e: {
              for (var $ = M.key, ie = P; ie !== null; ) {
                if (ie.key === $) {
                  if ($ = M.type, $ === g) {
                    if (ie.tag === 7) {
                      u(L, ie.sibling), P = f(ie, M.props.children), P.return = L, L = P;
                      break e;
                    }
                  } else if (ie.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === E && mp($) === ie.type) {
                    u(L, ie.sibling), P = f(ie, M.props), P.ref = fo(L, ie, M), P.return = L, L = P;
                    break e;
                  }
                  u(L, ie);
                  break;
                } else i(L, ie);
                ie = ie.sibling;
              }
              M.type === g ? (P = Br(M.props.children, L.mode, K, M.key), P.return = L, L = P) : (K = ys(M.type, M.key, M.props, null, L.mode, K), K.ref = fo(L, P, M), K.return = L, L = K);
            }
            return x(L);
          case m:
            e: {
              for (ie = M.key; P !== null; ) {
                if (P.key === ie) if (P.tag === 4 && P.stateNode.containerInfo === M.containerInfo && P.stateNode.implementation === M.implementation) {
                  u(L, P.sibling), P = f(P, M.children || []), P.return = L, L = P;
                  break e;
                } else {
                  u(L, P);
                  break;
                }
                else i(L, P);
                P = P.sibling;
              }
              P = $a(M, L.mode, K), P.return = L, L = P;
            }
            return x(L);
          case E:
            return ie = M._init, bt(L, P, ie(M._payload), K);
        }
        if (Mt(M)) return b(L, P, M, K);
        if (O(M)) return lt(L, P, M, K);
        Hl(L, M);
      }
      return typeof M == "string" && M !== "" || typeof M == "number" ? (M = "" + M, P !== null && P.tag === 6 ? (u(L, P.sibling), P = f(P, M), P.return = L, L = P) : (u(L, P), P = qa(M, L.mode, K), P.return = L, L = P), x(L)) : u(L, P);
    }
    return bt;
  }
  var di = gp(!0), yp = gp(!1), po = {}, Zt = $n(po), ho = $n(po), pi = $n(po);
  function Tn(r) {
    if (r === po) throw Error(a(174));
    return r;
  }
  function ma(r, i) {
    Se(pi, i), Se(ho, r), Se(Zt, po), r = St(i), xe(Zt), Se(Zt, r);
  }
  function hi() {
    xe(Zt), xe(ho), xe(pi);
  }
  function vp(r) {
    var i = Tn(pi.current), u = Tn(Zt.current);
    i = N(u, r.type, i), u !== i && (Se(ho, r), Se(Zt, i));
  }
  function ga(r) {
    ho.current === r && (xe(Zt), xe(ho));
  }
  var Re = $n(0);
  function Bl(r) {
    for (var i = r; i !== null; ) {
      if (i.tag === 13) {
        var u = i.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || Zd(u) || Ku(u))) return i;
      } else if (i.tag === 19 && i.memoizedProps.revealOrder !== void 0) {
        if (i.flags & 128) return i;
      } else if (i.child !== null) {
        i.child.return = i, i = i.child;
        continue;
      }
      if (i === r) break;
      for (; i.sibling === null; ) {
        if (i.return === null || i.return === r) return null;
        i = i.return;
      }
      i.sibling.return = i.return, i = i.sibling;
    }
    return null;
  }
  var ya = [];
  function va() {
    for (var r = 0; r < ya.length; r++) {
      var i = ya[r];
      xl ? i._workInProgressVersionPrimary = null : i._workInProgressVersionSecondary = null;
    }
    ya.length = 0;
  }
  var Wl = d.ReactCurrentDispatcher, Jt = d.ReactCurrentBatchConfig, mi = 0, ze = null, rt = null, Qe = null, Vl = !1, mo = !1, go = 0, y1 = 0;
  function it() {
    throw Error(a(321));
  }
  function Sa(r, i) {
    if (i === null) return !1;
    for (var u = 0; u < i.length && u < r.length; u++) if (!En(r[u], i[u])) return !1;
    return !0;
  }
  function wa(r, i, u, c, f, h) {
    if (mi = h, ze = i, i.memoizedState = null, i.updateQueue = null, i.lanes = 0, Wl.current = r === null || r.memoizedState === null ? _1 : E1, r = u(c, f), mo) {
      h = 0;
      do {
        if (mo = !1, go = 0, 25 <= h) throw Error(a(301));
        h += 1, Qe = rt = null, i.updateQueue = null, Wl.current = x1, r = u(c, f);
      } while (mo);
    }
    if (Wl.current = Yl, i = rt !== null && rt.next !== null, mi = 0, Qe = rt = ze = null, Vl = !1, i) throw Error(a(300));
    return r;
  }
  function _a() {
    var r = go !== 0;
    return go = 0, r;
  }
  function Un() {
    var r = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Qe === null ? ze.memoizedState = Qe = r : Qe = Qe.next = r, Qe;
  }
  function Pn() {
    if (rt === null) {
      var r = ze.alternate;
      r = r !== null ? r.memoizedState : null;
    } else r = rt.next;
    var i = Qe === null ? ze.memoizedState : Qe.next;
    if (i !== null) Qe = i, rt = r;
    else {
      if (r === null) throw Error(a(310));
      rt = r, r = { memoizedState: rt.memoizedState, baseState: rt.baseState, baseQueue: rt.baseQueue, queue: rt.queue, next: null }, Qe === null ? ze.memoizedState = Qe = r : Qe = Qe.next = r;
    }
    return Qe;
  }
  function Or(r, i) {
    return typeof i == "function" ? i(r) : i;
  }
  function Gl(r) {
    var i = Pn(), u = i.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = rt, f = c.baseQueue, h = u.pending;
    if (h !== null) {
      if (f !== null) {
        var x = f.next;
        f.next = h.next, h.next = x;
      }
      c.baseQueue = f = h, u.pending = null;
    }
    if (f !== null) {
      h = f.next, c = c.baseState;
      var T = x = null, z = null, B = h;
      do {
        var Z = B.lane;
        if ((mi & Z) === Z) z !== null && (z = z.next = { lane: 0, action: B.action, hasEagerState: B.hasEagerState, eagerState: B.eagerState, next: null }), c = B.hasEagerState ? B.eagerState : r(c, B.action);
        else {
          var ne = {
            lane: Z,
            action: B.action,
            hasEagerState: B.hasEagerState,
            eagerState: B.eagerState,
            next: null
          };
          z === null ? (T = z = ne, x = c) : z = z.next = ne, ze.lanes |= Z, yi |= Z;
        }
        B = B.next;
      } while (B !== null && B !== h);
      z === null ? x = c : z.next = T, En(c, i.memoizedState) || (Dt = !0), i.memoizedState = c, i.baseState = x, i.baseQueue = z, u.lastRenderedState = c;
    }
    if (r = u.interleaved, r !== null) {
      f = r;
      do
        h = f.lane, ze.lanes |= h, yi |= h, f = f.next;
      while (f !== r);
    } else f === null && (u.lanes = 0);
    return [i.memoizedState, u.dispatch];
  }
  function Kl(r) {
    var i = Pn(), u = i.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = u.dispatch, f = u.pending, h = i.memoizedState;
    if (f !== null) {
      u.pending = null;
      var x = f = f.next;
      do
        h = r(h, x.action), x = x.next;
      while (x !== f);
      En(h, i.memoizedState) || (Dt = !0), i.memoizedState = h, i.baseQueue === null && (i.baseState = h), u.lastRenderedState = h;
    }
    return [h, c];
  }
  function Sp() {
  }
  function wp(r, i) {
    var u = ze, c = Pn(), f = i(), h = !En(c.memoizedState, f);
    if (h && (c.memoizedState = f, Dt = !0), c = c.queue, vo(xp.bind(null, u, c, r), [r]), c.getSnapshot !== i || h || Qe !== null && Qe.memoizedState.tag & 1) {
      if (u.flags |= 2048, yo(9, Ep.bind(null, u, c, f, i), void 0, null), je === null) throw Error(a(349));
      mi & 30 || _p(u, i, f);
    }
    return f;
  }
  function _p(r, i, u) {
    r.flags |= 16384, r = { getSnapshot: i, value: u }, i = ze.updateQueue, i === null ? (i = { lastEffect: null, stores: null }, ze.updateQueue = i, i.stores = [r]) : (u = i.stores, u === null ? i.stores = [r] : u.push(r));
  }
  function Ep(r, i, u, c) {
    i.value = u, i.getSnapshot = c, kp(i) && qt(r, 1, -1);
  }
  function xp(r, i, u) {
    return u(function() {
      kp(i) && qt(r, 1, -1);
    });
  }
  function kp(r) {
    var i = r.getSnapshot;
    r = r.value;
    try {
      var u = i();
      return !En(r, u);
    } catch {
      return !0;
    }
  }
  function Ea(r) {
    var i = Un();
    return typeof r == "function" && (r = r()), i.memoizedState = i.baseState = r, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Or, lastRenderedState: r }, i.queue = r, r = r.dispatch = w1.bind(null, ze, r), [i.memoizedState, r];
  }
  function yo(r, i, u, c) {
    return r = { tag: r, create: i, destroy: u, deps: c, next: null }, i = ze.updateQueue, i === null ? (i = { lastEffect: null, stores: null }, ze.updateQueue = i, i.lastEffect = r.next = r) : (u = i.lastEffect, u === null ? i.lastEffect = r.next = r : (c = u.next, u.next = r, r.next = c, i.lastEffect = r)), r;
  }
  function Tp() {
    return Pn().memoizedState;
  }
  function Ql(r, i, u, c) {
    var f = Un();
    ze.flags |= r, f.memoizedState = yo(1 | i, u, void 0, c === void 0 ? null : c);
  }
  function Xl(r, i, u, c) {
    var f = Pn();
    c = c === void 0 ? null : c;
    var h = void 0;
    if (rt !== null) {
      var x = rt.memoizedState;
      if (h = x.destroy, c !== null && Sa(c, x.deps)) {
        f.memoizedState = yo(i, u, h, c);
        return;
      }
    }
    ze.flags |= r, f.memoizedState = yo(1 | i, u, h, c);
  }
  function xa(r, i) {
    return Ql(8390656, 8, r, i);
  }
  function vo(r, i) {
    return Xl(2048, 8, r, i);
  }
  function Pp(r, i) {
    return Xl(4, 2, r, i);
  }
  function Cp(r, i) {
    return Xl(4, 4, r, i);
  }
  function Rp(r, i) {
    if (typeof i == "function") return r = r(), i(r), function() {
      i(null);
    };
    if (i != null) return r = r(), i.current = r, function() {
      i.current = null;
    };
  }
  function Ap(r, i, u) {
    return u = u != null ? u.concat([r]) : null, Xl(4, 4, Rp.bind(null, i, r), u);
  }
  function ka() {
  }
  function Lp(r, i) {
    var u = Pn();
    i = i === void 0 ? null : i;
    var c = u.memoizedState;
    return c !== null && i !== null && Sa(i, c[1]) ? c[0] : (u.memoizedState = [r, i], r);
  }
  function Np(r, i) {
    var u = Pn();
    i = i === void 0 ? null : i;
    var c = u.memoizedState;
    return c !== null && i !== null && Sa(i, c[1]) ? c[0] : (r = r(), u.memoizedState = [r, i], r);
  }
  function v1(r, i) {
    var u = fe;
    fe = u !== 0 && 4 > u ? u : 4, r(!0);
    var c = Jt.transition;
    Jt.transition = {};
    try {
      r(!1), i();
    } finally {
      fe = u, Jt.transition = c;
    }
  }
  function Mp() {
    return Pn().memoizedState;
  }
  function S1(r, i, u) {
    var c = ir(r);
    u = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null }, zp(r) ? Ip(i, u) : (Op(r, i, u), u = pt(), r = qt(r, c, u), r !== null && Dp(r, i, c));
  }
  function w1(r, i, u) {
    var c = ir(r), f = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null };
    if (zp(r)) Ip(i, f);
    else {
      Op(r, i, f);
      var h = r.alternate;
      if (r.lanes === 0 && (h === null || h.lanes === 0) && (h = i.lastRenderedReducer, h !== null)) try {
        var x = i.lastRenderedState, T = h(x, u);
        if (f.hasEagerState = !0, f.eagerState = T, En(T, x)) return;
      } catch {
      } finally {
      }
      u = pt(), r = qt(r, c, u), r !== null && Dp(r, i, c);
    }
  }
  function zp(r) {
    var i = r.alternate;
    return r === ze || i !== null && i === ze;
  }
  function Ip(r, i) {
    mo = Vl = !0;
    var u = r.pending;
    u === null ? i.next = i : (i.next = u.next, u.next = i), r.pending = i;
  }
  function Op(r, i, u) {
    je !== null && r.mode & 1 && !(oe & 2) ? (r = i.interleaved, r === null ? (u.next = u, kn === null ? kn = [i] : kn.push(i)) : (u.next = r.next, r.next = u), i.interleaved = u) : (r = i.pending, r === null ? u.next = u : (u.next = r.next, r.next = u), i.pending = u);
  }
  function Dp(r, i, u) {
    if (u & 4194240) {
      var c = i.lanes;
      c &= r.pendingLanes, u |= c, i.lanes = u, $u(r, u);
    }
  }
  var Yl = { readContext: Qt, useCallback: it, useContext: it, useEffect: it, useImperativeHandle: it, useInsertionEffect: it, useLayoutEffect: it, useMemo: it, useReducer: it, useRef: it, useState: it, useDebugValue: it, useDeferredValue: it, useTransition: it, useMutableSource: it, useSyncExternalStore: it, useId: it, unstable_isNewReconciler: !1 }, _1 = { readContext: Qt, useCallback: function(r, i) {
    return Un().memoizedState = [r, i === void 0 ? null : i], r;
  }, useContext: Qt, useEffect: xa, useImperativeHandle: function(r, i, u) {
    return u = u != null ? u.concat([r]) : null, Ql(
      4194308,
      4,
      Rp.bind(null, i, r),
      u
    );
  }, useLayoutEffect: function(r, i) {
    return Ql(4194308, 4, r, i);
  }, useInsertionEffect: function(r, i) {
    return Ql(4, 2, r, i);
  }, useMemo: function(r, i) {
    var u = Un();
    return i = i === void 0 ? null : i, r = r(), u.memoizedState = [r, i], r;
  }, useReducer: function(r, i, u) {
    var c = Un();
    return i = u !== void 0 ? u(i) : i, c.memoizedState = c.baseState = i, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: r, lastRenderedState: i }, c.queue = r, r = r.dispatch = S1.bind(null, ze, r), [c.memoizedState, r];
  }, useRef: function(r) {
    var i = Un();
    return r = { current: r }, i.memoizedState = r;
  }, useState: Ea, useDebugValue: ka, useDeferredValue: function(r) {
    var i = Ea(r), u = i[0], c = i[1];
    return xa(function() {
      var f = Jt.transition;
      Jt.transition = {};
      try {
        c(r);
      } finally {
        Jt.transition = f;
      }
    }, [r]), u;
  }, useTransition: function() {
    var r = Ea(!1), i = r[0];
    return r = v1.bind(null, r[1]), Un().memoizedState = r, [i, r];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(r, i, u) {
    var c = ze, f = Un();
    if (Pe) {
      if (u === void 0) throw Error(a(407));
      u = u();
    } else {
      if (u = i(), je === null) throw Error(a(349));
      mi & 30 || _p(c, i, u);
    }
    f.memoizedState = u;
    var h = { value: u, getSnapshot: i };
    return f.queue = h, xa(xp.bind(null, c, h, r), [r]), c.flags |= 2048, yo(9, Ep.bind(null, c, h, u, i), void 0, null), u;
  }, useId: function() {
    var r = Un(), i = je.identifierPrefix;
    if (Pe) {
      var u = Fn, c = jn;
      u = (c & ~(1 << 32 - cn(c) - 1)).toString(32) + u, i = ":" + i + "R" + u, u = go++, 0 < u && (i += "H" + u.toString(32)), i += ":";
    } else u = y1++, i = ":" + i + "r" + u.toString(32) + ":";
    return r.memoizedState = i;
  }, unstable_isNewReconciler: !1 }, E1 = {
    readContext: Qt,
    useCallback: Lp,
    useContext: Qt,
    useEffect: vo,
    useImperativeHandle: Ap,
    useInsertionEffect: Pp,
    useLayoutEffect: Cp,
    useMemo: Np,
    useReducer: Gl,
    useRef: Tp,
    useState: function() {
      return Gl(Or);
    },
    useDebugValue: ka,
    useDeferredValue: function(r) {
      var i = Gl(Or), u = i[0], c = i[1];
      return vo(function() {
        var f = Jt.transition;
        Jt.transition = {};
        try {
          c(r);
        } finally {
          Jt.transition = f;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = Gl(Or)[0], i = Pn().memoizedState;
      return [r, i];
    },
    useMutableSource: Sp,
    useSyncExternalStore: wp,
    useId: Mp,
    unstable_isNewReconciler: !1
  }, x1 = {
    readContext: Qt,
    useCallback: Lp,
    useContext: Qt,
    useEffect: vo,
    useImperativeHandle: Ap,
    useInsertionEffect: Pp,
    useLayoutEffect: Cp,
    useMemo: Np,
    useReducer: Kl,
    useRef: Tp,
    useState: function() {
      return Kl(Or);
    },
    useDebugValue: ka,
    useDeferredValue: function(r) {
      var i = Kl(Or), u = i[0], c = i[1];
      return vo(function() {
        var f = Jt.transition;
        Jt.transition = {};
        try {
          c(r);
        } finally {
          Jt.transition = f;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = Kl(Or)[0], i = Pn().memoizedState;
      return [r, i];
    },
    useMutableSource: Sp,
    useSyncExternalStore: wp,
    useId: Mp,
    unstable_isNewReconciler: !1
  };
  function Ta(r, i) {
    try {
      var u = "", c = i;
      do
        u += g1(c), c = c.return;
      while (c);
      var f = u;
    } catch (h) {
      f = `
Error generating stack: ` + h.message + `
` + h.stack;
    }
    return { value: r, source: i, stack: f };
  }
  function Pa(r, i) {
    try {
      console.error(i.value);
    } catch (u) {
      setTimeout(function() {
        throw u;
      });
    }
  }
  var k1 = typeof WeakMap == "function" ? WeakMap : Map;
  function jp(r, i, u) {
    u = Dn(-1, u), u.tag = 3, u.payload = { element: null };
    var c = i.value;
    return u.callback = function() {
      cs || (cs = !0, Ga = c), Pa(r, i);
    }, u;
  }
  function Fp(r, i, u) {
    u = Dn(-1, u), u.tag = 3;
    var c = r.type.getDerivedStateFromError;
    if (typeof c == "function") {
      var f = i.value;
      u.payload = function() {
        return c(f);
      }, u.callback = function() {
        Pa(r, i);
      };
    }
    var h = r.stateNode;
    return h !== null && typeof h.componentDidCatch == "function" && (u.callback = function() {
      Pa(r, i), typeof c != "function" && (nr === null ? nr = /* @__PURE__ */ new Set([this]) : nr.add(this));
      var x = i.stack;
      this.componentDidCatch(i.value, { componentStack: x !== null ? x : "" });
    }), u;
  }
  function Up(r, i, u) {
    var c = r.pingCache;
    if (c === null) {
      c = r.pingCache = new k1();
      var f = /* @__PURE__ */ new Set();
      c.set(i, f);
    } else f = c.get(i), f === void 0 && (f = /* @__PURE__ */ new Set(), c.set(i, f));
    f.has(u) || (f.add(u), r = F1.bind(null, r, i, u), i.then(r, r));
  }
  function Hp(r) {
    do {
      var i;
      if ((i = r.tag === 13) && (i = r.memoizedState, i = i !== null ? i.dehydrated !== null : !0), i) return r;
      r = r.return;
    } while (r !== null);
    return null;
  }
  function Bp(r, i, u, c, f) {
    return r.mode & 1 ? (r.flags |= 65536, r.lanes = f, r) : (r === i ? r.flags |= 65536 : (r.flags |= 128, u.flags |= 131072, u.flags &= -52805, u.tag === 1 && (u.alternate === null ? u.tag = 17 : (i = Dn(-1, 1), i.tag = 2, tr(u, i))), u.lanes |= 1), r);
  }
  function Cn(r) {
    r.flags |= 4;
  }
  function Wp(r, i) {
    if (r !== null && r.child === i.child) return !0;
    if (i.flags & 16) return !1;
    for (r = i.child; r !== null; ) {
      if (r.flags & 12854 || r.subtreeFlags & 12854) return !1;
      r = r.sibling;
    }
    return !0;
  }
  var So, wo, Zl, Jl;
  if (an) So = function(r, i) {
    for (var u = i.child; u !== null; ) {
      if (u.tag === 5 || u.tag === 6) te(r, u.stateNode);
      else if (u.tag !== 4 && u.child !== null) {
        u.child.return = u, u = u.child;
        continue;
      }
      if (u === i) break;
      for (; u.sibling === null; ) {
        if (u.return === null || u.return === i) return;
        u = u.return;
      }
      u.sibling.return = u.return, u = u.sibling;
    }
  }, wo = function() {
  }, Zl = function(r, i, u, c, f) {
    if (r = r.memoizedProps, r !== c) {
      var h = i.stateNode, x = Tn(Zt.current);
      u = Me(h, u, r, c, f, x), (i.updateQueue = u) && Cn(i);
    }
  }, Jl = function(r, i, u, c) {
    u !== c && Cn(i);
  };
  else if (kl) {
    So = function(r, i, u, c) {
      for (var f = i.child; f !== null; ) {
        if (f.tag === 5) {
          var h = f.stateNode;
          u && c && (h = Xd(h, f.type, f.memoizedProps, f)), te(r, h);
        } else if (f.tag === 6) h = f.stateNode, u && c && (h = Yd(h, f.memoizedProps, f)), te(r, h);
        else if (f.tag !== 4) {
          if (f.tag === 22 && f.memoizedState !== null) h = f.child, h !== null && (h.return = f), So(r, f, !0, !0);
          else if (f.child !== null) {
            f.child.return = f, f = f.child;
            continue;
          }
        }
        if (f === i) break;
        for (; f.sibling === null; ) {
          if (f.return === null || f.return === i) return;
          f = f.return;
        }
        f.sibling.return = f.return, f = f.sibling;
      }
    };
    var Vp = function(r, i, u, c) {
      for (var f = i.child; f !== null; ) {
        if (f.tag === 5) {
          var h = f.stateNode;
          u && c && (h = Xd(h, f.type, f.memoizedProps, f)), Kd(r, h);
        } else if (f.tag === 6) h = f.stateNode, u && c && (h = Yd(h, f.memoizedProps, f)), Kd(r, h);
        else if (f.tag !== 4) {
          if (f.tag === 22 && f.memoizedState !== null) h = f.child, h !== null && (h.return = f), Vp(r, f, !0, !0);
          else if (f.child !== null) {
            f.child.return = f, f = f.child;
            continue;
          }
        }
        if (f === i) break;
        for (; f.sibling === null; ) {
          if (f.return === null || f.return === i) return;
          f = f.return;
        }
        f.sibling.return = f.return, f = f.sibling;
      }
    };
    wo = function(r, i) {
      var u = i.stateNode;
      if (!Wp(r, i)) {
        r = u.containerInfo;
        var c = Gd(r);
        Vp(c, i, !1, !1), u.pendingChildren = c, Cn(i), j0(r, c);
      }
    }, Zl = function(r, i, u, c, f) {
      var h = r.stateNode, x = r.memoizedProps;
      if ((r = Wp(r, i)) && x === c) i.stateNode = h;
      else {
        var T = i.stateNode, z = Tn(Zt.current), B = null;
        x !== c && (B = Me(T, u, x, c, f, z)), r && B === null ? i.stateNode = h : (h = D0(h, B, u, x, c, i, r, T), ae(h, u, c, f, z) && Cn(i), i.stateNode = h, r ? Cn(i) : So(h, i, !1, !1));
      }
    }, Jl = function(r, i, u, c) {
      u !== c ? (r = Tn(pi.current), u = Tn(Zt.current), i.stateNode = Ge(c, r, u, i), Cn(i)) : i.stateNode = r.stateNode;
    };
  } else wo = function() {
  }, Zl = function() {
  }, Jl = function() {
  };
  function _o(r, i) {
    if (!Pe) switch (r.tailMode) {
      case "hidden":
        i = r.tail;
        for (var u = null; i !== null; ) i.alternate !== null && (u = i), i = i.sibling;
        u === null ? r.tail = null : u.sibling = null;
        break;
      case "collapsed":
        u = r.tail;
        for (var c = null; u !== null; ) u.alternate !== null && (c = u), u = u.sibling;
        c === null ? i || r.tail === null ? r.tail = null : r.tail.sibling = null : c.sibling = null;
    }
  }
  function ot(r) {
    var i = r.alternate !== null && r.alternate.child === r.child, u = 0, c = 0;
    if (i) for (var f = r.child; f !== null; ) u |= f.lanes | f.childLanes, c |= f.subtreeFlags & 14680064, c |= f.flags & 14680064, f.return = r, f = f.sibling;
    else for (f = r.child; f !== null; ) u |= f.lanes | f.childLanes, c |= f.subtreeFlags, c |= f.flags, f.return = r, f = f.sibling;
    return r.subtreeFlags |= c, r.childLanes = u, i;
  }
  function T1(r, i, u) {
    var c = i.pendingProps;
    switch (fa(i), i.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return ot(i), null;
      case 1:
        return _t(i.type) && Tl(), ot(i), null;
      case 3:
        return c = i.stateNode, hi(), xe(wt), xe(nt), va(), c.pendingContext && (c.context = c.pendingContext, c.pendingContext = null), (r === null || r.child === null) && (co(i) ? Cn(i) : r === null || r.memoizedState.isDehydrated && !(i.flags & 256) || (i.flags |= 1024, dn !== null && (Xa(dn), dn = null))), wo(r, i), ot(i), null;
      case 5:
        ga(i), u = Tn(pi.current);
        var f = i.type;
        if (r !== null && i.stateNode != null) Zl(r, i, f, c, u), r.ref !== i.ref && (i.flags |= 512, i.flags |= 2097152);
        else {
          if (!c) {
            if (i.stateNode === null) throw Error(a(166));
            return ot(i), null;
          }
          if (r = Tn(Zt.current), co(i)) {
            if (!zt) throw Error(a(175));
            r = K0(i.stateNode, i.type, i.memoizedProps, u, r, i, !ao), i.updateQueue = r, r !== null && Cn(i);
          } else {
            var h = X(f, c, u, r, i);
            So(h, i, !1, !1), i.stateNode = h, ae(h, f, c, u, r) && Cn(i);
          }
          i.ref !== null && (i.flags |= 512, i.flags |= 2097152);
        }
        return ot(i), null;
      case 6:
        if (r && i.stateNode != null) Jl(r, i, r.memoizedProps, c);
        else {
          if (typeof c != "string" && i.stateNode === null) throw Error(a(166));
          if (r = Tn(pi.current), u = Tn(Zt.current), co(i)) {
            if (!zt) throw Error(a(176));
            if (r = i.stateNode, c = i.memoizedProps, (u = Q0(r, c, i, !ao)) && (f = It, f !== null)) switch (h = (f.mode & 1) !== 0, f.tag) {
              case 3:
                b0(f.stateNode.containerInfo, r, c, h);
                break;
              case 5:
                e1(f.type, f.memoizedProps, f.stateNode, r, c, h);
            }
            u && Cn(i);
          } else i.stateNode = Ge(c, r, u, i);
        }
        return ot(i), null;
      case 13:
        if (xe(Re), c = i.memoizedState, Pe && Ot !== null && i.mode & 1 && !(i.flags & 128)) {
          for (r = Ot; r; ) r = oo(r);
          return fi(), i.flags |= 98560, i;
        }
        if (c !== null && c.dehydrated !== null) {
          if (c = co(i), r === null) {
            if (!c) throw Error(a(318));
            if (!zt) throw Error(a(344));
            if (r = i.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
            X0(r, i);
          } else fi(), !(i.flags & 128) && (i.memoizedState = null), i.flags |= 4;
          return ot(i), null;
        }
        return dn !== null && (Xa(dn), dn = null), i.flags & 128 ? (i.lanes = u, i) : (c = c !== null, u = !1, r === null ? co(i) : u = r.memoizedState !== null, c && !u && (i.child.flags |= 8192, i.mode & 1 && (r === null || Re.current & 1 ? He === 0 && (He = 3) : Za())), i.updateQueue !== null && (i.flags |= 4), ot(i), null);
      case 4:
        return hi(), wo(r, i), r === null && f0(i.stateNode.containerInfo), ot(i), null;
      case 10:
        return oa(i.type._context), ot(i), null;
      case 17:
        return _t(i.type) && Tl(), ot(i), null;
      case 19:
        if (xe(Re), f = i.memoizedState, f === null) return ot(i), null;
        if (c = (i.flags & 128) !== 0, h = f.rendering, h === null) if (c) _o(f, !1);
        else {
          if (He !== 0 || r !== null && r.flags & 128) for (r = i.child; r !== null; ) {
            if (h = Bl(r), h !== null) {
              for (i.flags |= 128, _o(f, !1), r = h.updateQueue, r !== null && (i.updateQueue = r, i.flags |= 4), i.subtreeFlags = 0, r = u, c = i.child; c !== null; ) u = c, f = r, u.flags &= 14680066, h = u.alternate, h === null ? (u.childLanes = 0, u.lanes = f, u.child = null, u.subtreeFlags = 0, u.memoizedProps = null, u.memoizedState = null, u.updateQueue = null, u.dependencies = null, u.stateNode = null) : (u.childLanes = h.childLanes, u.lanes = h.lanes, u.child = h.child, u.subtreeFlags = 0, u.deletions = null, u.memoizedProps = h.memoizedProps, u.memoizedState = h.memoizedState, u.updateQueue = h.updateQueue, u.type = h.type, f = h.dependencies, u.dependencies = f === null ? null : { lanes: f.lanes, firstContext: f.firstContext }), c = c.sibling;
              return Se(Re, Re.current & 1 | 2), i.child;
            }
            r = r.sibling;
          }
          f.tail !== null && Ke() > Va && (i.flags |= 128, c = !0, _o(f, !1), i.lanes = 4194304);
        }
        else {
          if (!c) if (r = Bl(h), r !== null) {
            if (i.flags |= 128, c = !0, r = r.updateQueue, r !== null && (i.updateQueue = r, i.flags |= 4), _o(f, !0), f.tail === null && f.tailMode === "hidden" && !h.alternate && !Pe) return ot(i), null;
          } else 2 * Ke() - f.renderingStartTime > Va && u !== 1073741824 && (i.flags |= 128, c = !0, _o(f, !1), i.lanes = 4194304);
          f.isBackwards ? (h.sibling = i.child, i.child = h) : (r = f.last, r !== null ? r.sibling = h : i.child = h, f.last = h);
        }
        return f.tail !== null ? (i = f.tail, f.rendering = i, f.tail = i.sibling, f.renderingStartTime = Ke(), i.sibling = null, r = Re.current, Se(Re, c ? r & 1 | 2 : r & 1), i) : (ot(i), null);
      case 22:
      case 23:
        return Ya(), c = i.memoizedState !== null, r !== null && r.memoizedState !== null !== c && (i.flags |= 8192), c && i.mode & 1 ? jt & 1073741824 && (ot(i), an && i.subtreeFlags & 6 && (i.flags |= 8192)) : ot(i), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(a(156, i.tag));
  }
  var P1 = d.ReactCurrentOwner, Dt = !1;
  function dt(r, i, u, c) {
    i.child = r === null ? yp(i, null, u, c) : di(i, r.child, u, c);
  }
  function Gp(r, i, u, c, f) {
    u = u.render;
    var h = i.ref;
    return ui(i, f), c = wa(r, i, u, c, h, f), u = _a(), r !== null && !Dt ? (i.updateQueue = r.updateQueue, i.flags &= -2053, r.lanes &= ~f, Hn(r, i, f)) : (Pe && u && ca(i), i.flags |= 1, dt(r, i, c, f), i.child);
  }
  function Kp(r, i, u, c, f) {
    if (r === null) {
      var h = u.type;
      return typeof h == "function" && !Ja(h) && h.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (i.tag = 15, i.type = h, Qp(r, i, h, c, f)) : (r = ys(u.type, null, c, i, i.mode, f), r.ref = i.ref, r.return = i, i.child = r);
    }
    if (h = r.child, !(r.lanes & f)) {
      var x = h.memoizedProps;
      if (u = u.compare, u = u !== null ? u : Ml, u(x, c) && r.ref === i.ref) return Hn(r, i, f);
    }
    return i.flags |= 1, r = lr(h, c), r.ref = i.ref, r.return = i, i.child = r;
  }
  function Qp(r, i, u, c, f) {
    if (r !== null && Ml(r.memoizedProps, c) && r.ref === i.ref) if (Dt = !1, (r.lanes & f) !== 0) r.flags & 131072 && (Dt = !0);
    else return i.lanes = r.lanes, Hn(r, i, f);
    return Ca(r, i, u, c, f);
  }
  function Xp(r, i, u) {
    var c = i.pendingProps, f = c.children, h = r !== null ? r.memoizedState : null;
    if (c.mode === "hidden") if (!(i.mode & 1)) i.memoizedState = { baseLanes: 0, cachePool: null }, Se(gi, jt), jt |= u;
    else if (u & 1073741824) i.memoizedState = { baseLanes: 0, cachePool: null }, c = h !== null ? h.baseLanes : u, Se(gi, jt), jt |= c;
    else return r = h !== null ? h.baseLanes | u : u, i.lanes = i.childLanes = 1073741824, i.memoizedState = { baseLanes: r, cachePool: null }, i.updateQueue = null, Se(gi, jt), jt |= r, null;
    else h !== null ? (c = h.baseLanes | u, i.memoizedState = null) : c = u, Se(gi, jt), jt |= c;
    return dt(r, i, f, u), i.child;
  }
  function Yp(r, i) {
    var u = i.ref;
    (r === null && u !== null || r !== null && r.ref !== u) && (i.flags |= 512, i.flags |= 2097152);
  }
  function Ca(r, i, u, c, f) {
    var h = _t(u) ? Mr : nt.current;
    return h = li(i, h), ui(i, f), u = wa(r, i, u, c, h, f), c = _a(), r !== null && !Dt ? (i.updateQueue = r.updateQueue, i.flags &= -2053, r.lanes &= ~f, Hn(r, i, f)) : (Pe && c && ca(i), i.flags |= 1, dt(r, i, u, f), i.child);
  }
  function Zp(r, i, u, c, f) {
    if (_t(u)) {
      var h = !0;
      Pl(i);
    } else h = !1;
    if (ui(i, f), i.stateNode === null) r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), ap(i, u, c), aa(i, u, c, f), c = !0;
    else if (r === null) {
      var x = i.stateNode, T = i.memoizedProps;
      x.props = T;
      var z = x.context, B = u.contextType;
      typeof B == "object" && B !== null ? B = Qt(B) : (B = _t(u) ? Mr : nt.current, B = li(i, B));
      var Z = u.getDerivedStateFromProps, ne = typeof Z == "function" || typeof x.getSnapshotBeforeUpdate == "function";
      ne || typeof x.UNSAFE_componentWillReceiveProps != "function" && typeof x.componentWillReceiveProps != "function" || (T !== c || z !== B) && cp(i, x, c, B), er = !1;
      var ee = i.memoizedState;
      x.state = ee, Dl(i, c, x, f), z = i.memoizedState, T !== c || ee !== z || wt.current || er ? (typeof Z == "function" && (ua(i, u, Z, c), z = i.memoizedState), (T = er || up(i, u, T, c, ee, z, B)) ? (ne || typeof x.UNSAFE_componentWillMount != "function" && typeof x.componentWillMount != "function" || (typeof x.componentWillMount == "function" && x.componentWillMount(), typeof x.UNSAFE_componentWillMount == "function" && x.UNSAFE_componentWillMount()), typeof x.componentDidMount == "function" && (i.flags |= 4194308)) : (typeof x.componentDidMount == "function" && (i.flags |= 4194308), i.memoizedProps = c, i.memoizedState = z), x.props = c, x.state = z, x.context = B, c = T) : (typeof x.componentDidMount == "function" && (i.flags |= 4194308), c = !1);
    } else {
      x = i.stateNode, ip(r, i), T = i.memoizedProps, B = i.type === i.elementType ? T : fn(i.type, T), x.props = B, ne = i.pendingProps, ee = x.context, z = u.contextType, typeof z == "object" && z !== null ? z = Qt(z) : (z = _t(u) ? Mr : nt.current, z = li(i, z));
      var ye = u.getDerivedStateFromProps;
      (Z = typeof ye == "function" || typeof x.getSnapshotBeforeUpdate == "function") || typeof x.UNSAFE_componentWillReceiveProps != "function" && typeof x.componentWillReceiveProps != "function" || (T !== ne || ee !== z) && cp(i, x, c, z), er = !1, ee = i.memoizedState, x.state = ee, Dl(i, c, x, f);
      var b = i.memoizedState;
      T !== ne || ee !== b || wt.current || er ? (typeof ye == "function" && (ua(i, u, ye, c), b = i.memoizedState), (B = er || up(i, u, B, c, ee, b, z) || !1) ? (Z || typeof x.UNSAFE_componentWillUpdate != "function" && typeof x.componentWillUpdate != "function" || (typeof x.componentWillUpdate == "function" && x.componentWillUpdate(
        c,
        b,
        z
      ), typeof x.UNSAFE_componentWillUpdate == "function" && x.UNSAFE_componentWillUpdate(c, b, z)), typeof x.componentDidUpdate == "function" && (i.flags |= 4), typeof x.getSnapshotBeforeUpdate == "function" && (i.flags |= 1024)) : (typeof x.componentDidUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 4), typeof x.getSnapshotBeforeUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 1024), i.memoizedProps = c, i.memoizedState = b), x.props = c, x.state = b, x.context = z, c = B) : (typeof x.componentDidUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 4), typeof x.getSnapshotBeforeUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 1024), c = !1);
    }
    return Ra(r, i, u, c, h, f);
  }
  function Ra(r, i, u, c, f, h) {
    Yp(r, i);
    var x = (i.flags & 128) !== 0;
    if (!c && !x) return f && bd(i, u, !1), Hn(r, i, h);
    c = i.stateNode, P1.current = i;
    var T = x && typeof u.getDerivedStateFromError != "function" ? null : c.render();
    return i.flags |= 1, r !== null && x ? (i.child = di(i, r.child, null, h), i.child = di(i, null, T, h)) : dt(r, i, T, h), i.memoizedState = c.state, f && bd(i, u, !0), i.child;
  }
  function Jp(r) {
    var i = r.stateNode;
    i.pendingContext ? qd(r, i.pendingContext, i.pendingContext !== i.context) : i.context && qd(r, i.context, !1), ma(r, i.containerInfo);
  }
  function qp(r, i, u, c, f) {
    return fi(), ha(f), i.flags |= 256, dt(r, i, u, c), i.child;
  }
  var ql = { dehydrated: null, treeContext: null, retryLane: 0 };
  function $l(r) {
    return { baseLanes: r, cachePool: null };
  }
  function $p(r, i, u) {
    var c = i.pendingProps, f = Re.current, h = !1, x = (i.flags & 128) !== 0, T;
    if ((T = x) || (T = r !== null && r.memoizedState === null ? !1 : (f & 2) !== 0), T ? (h = !0, i.flags &= -129) : (r === null || r.memoizedState !== null) && (f |= 1), Se(Re, f & 1), r === null)
      return pa(i), r = i.memoizedState, r !== null && (r = r.dehydrated, r !== null) ? (i.mode & 1 ? Ku(r) ? i.lanes = 8 : i.lanes = 1073741824 : i.lanes = 1, null) : (f = c.children, r = c.fallback, h ? (c = i.mode, h = i.child, f = { mode: "hidden", children: f }, !(c & 1) && h !== null ? (h.childLanes = 0, h.pendingProps = f) : h = vs(f, c, 0, null), r = Br(r, c, u, null), h.return = i, r.return = i, h.sibling = r, i.child = h, i.child.memoizedState = $l(u), i.memoizedState = ql, r) : Aa(i, f));
    if (f = r.memoizedState, f !== null) {
      if (T = f.dehydrated, T !== null) {
        if (x)
          return i.flags & 256 ? (i.flags &= -257, bl(r, i, u, Error(a(422)))) : i.memoizedState !== null ? (i.child = r.child, i.flags |= 128, null) : (h = c.fallback, f = i.mode, c = vs({ mode: "visible", children: c.children }, f, 0, null), h = Br(h, f, u, null), h.flags |= 2, c.return = i, h.return = i, c.sibling = h, i.child = c, i.mode & 1 && di(
            i,
            r.child,
            null,
            u
          ), i.child.memoizedState = $l(u), i.memoizedState = ql, h);
        if (!(i.mode & 1)) i = bl(r, i, u, null);
        else if (Ku(T)) i = bl(r, i, u, Error(a(419)));
        else if (c = (u & r.childLanes) !== 0, Dt || c) {
          if (c = je, c !== null) {
            switch (u & -u) {
              case 4:
                h = 2;
                break;
              case 16:
                h = 8;
                break;
              case 64:
              case 128:
              case 256:
              case 512:
              case 1024:
              case 2048:
              case 4096:
              case 8192:
              case 16384:
              case 32768:
              case 65536:
              case 131072:
              case 262144:
              case 524288:
              case 1048576:
              case 2097152:
              case 4194304:
              case 8388608:
              case 16777216:
              case 33554432:
              case 67108864:
                h = 32;
                break;
              case 536870912:
                h = 268435456;
                break;
              default:
                h = 0;
            }
            c = h & (c.suspendedLanes | u) ? 0 : h, c !== 0 && c !== f.retryLane && (f.retryLane = c, qt(r, c, -1));
          }
          Za(), i = bl(r, i, u, Error(a(421)));
        } else Zd(T) ? (i.flags |= 128, i.child = r.child, i = U1.bind(null, r), B0(T, i), i = null) : (u = f.treeContext, zt && (Ot = G0(T), It = i, Pe = !0, dn = null, ao = !1, u !== null && (Xt[Yt++] = jn, Xt[Yt++] = Fn, Xt[Yt++] = zr, jn = u.id, Fn = u.overflow, zr = i)), i = Aa(i, i.pendingProps.children), i.flags |= 4096);
        return i;
      }
      return h ? (c = eh(r, i, c.children, c.fallback, u), h = i.child, f = r.child.memoizedState, h.memoizedState = f === null ? $l(u) : { baseLanes: f.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, i.memoizedState = ql, c) : (u = bp(r, i, c.children, u), i.memoizedState = null, u);
    }
    return h ? (c = eh(r, i, c.children, c.fallback, u), h = i.child, f = r.child.memoizedState, h.memoizedState = f === null ? $l(u) : { baseLanes: f.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, i.memoizedState = ql, c) : (u = bp(r, i, c.children, u), i.memoizedState = null, u);
  }
  function Aa(r, i) {
    return i = vs({ mode: "visible", children: i }, r.mode, 0, null), i.return = r, r.child = i;
  }
  function bp(r, i, u, c) {
    var f = r.child;
    return r = f.sibling, u = lr(f, { mode: "visible", children: u }), !(i.mode & 1) && (u.lanes = c), u.return = i, u.sibling = null, r !== null && (c = i.deletions, c === null ? (i.deletions = [r], i.flags |= 16) : c.push(r)), i.child = u;
  }
  function eh(r, i, u, c, f) {
    var h = i.mode;
    r = r.child;
    var x = r.sibling, T = { mode: "hidden", children: u };
    return !(h & 1) && i.child !== r ? (u = i.child, u.childLanes = 0, u.pendingProps = T, i.deletions = null) : (u = lr(r, T), u.subtreeFlags = r.subtreeFlags & 14680064), x !== null ? c = lr(x, c) : (c = Br(c, h, f, null), c.flags |= 2), c.return = i, u.return = i, u.sibling = c, i.child = u, c;
  }
  function bl(r, i, u, c) {
    return c !== null && ha(c), di(i, r.child, null, u), r = Aa(i, i.pendingProps.children), r.flags |= 2, i.memoizedState = null, r;
  }
  function th(r, i, u) {
    r.lanes |= i;
    var c = r.alternate;
    c !== null && (c.lanes |= i), la(r.return, i, u);
  }
  function La(r, i, u, c, f) {
    var h = r.memoizedState;
    h === null ? r.memoizedState = { isBackwards: i, rendering: null, renderingStartTime: 0, last: c, tail: u, tailMode: f } : (h.isBackwards = i, h.rendering = null, h.renderingStartTime = 0, h.last = c, h.tail = u, h.tailMode = f);
  }
  function nh(r, i, u) {
    var c = i.pendingProps, f = c.revealOrder, h = c.tail;
    if (dt(r, i, c.children, u), c = Re.current, c & 2) c = c & 1 | 2, i.flags |= 128;
    else {
      if (r !== null && r.flags & 128) e: for (r = i.child; r !== null; ) {
        if (r.tag === 13) r.memoizedState !== null && th(r, u, i);
        else if (r.tag === 19) th(r, u, i);
        else if (r.child !== null) {
          r.child.return = r, r = r.child;
          continue;
        }
        if (r === i) break e;
        for (; r.sibling === null; ) {
          if (r.return === null || r.return === i) break e;
          r = r.return;
        }
        r.sibling.return = r.return, r = r.sibling;
      }
      c &= 1;
    }
    if (Se(Re, c), !(i.mode & 1)) i.memoizedState = null;
    else switch (f) {
      case "forwards":
        for (u = i.child, f = null; u !== null; ) r = u.alternate, r !== null && Bl(r) === null && (f = u), u = u.sibling;
        u = f, u === null ? (f = i.child, i.child = null) : (f = u.sibling, u.sibling = null), La(i, !1, f, u, h);
        break;
      case "backwards":
        for (u = null, f = i.child, i.child = null; f !== null; ) {
          if (r = f.alternate, r !== null && Bl(r) === null) {
            i.child = f;
            break;
          }
          r = f.sibling, f.sibling = u, u = f, f = r;
        }
        La(i, !0, u, null, h);
        break;
      case "together":
        La(i, !1, null, null, void 0);
        break;
      default:
        i.memoizedState = null;
    }
    return i.child;
  }
  function Hn(r, i, u) {
    if (r !== null && (i.dependencies = r.dependencies), yi |= i.lanes, !(u & i.childLanes)) return null;
    if (r !== null && i.child !== r.child) throw Error(a(153));
    if (i.child !== null) {
      for (r = i.child, u = lr(r, r.pendingProps), i.child = u, u.return = i; r.sibling !== null; ) r = r.sibling, u = u.sibling = lr(r, r.pendingProps), u.return = i;
      u.sibling = null;
    }
    return i.child;
  }
  function C1(r, i, u) {
    switch (i.tag) {
      case 3:
        Jp(i), fi();
        break;
      case 5:
        vp(i);
        break;
      case 1:
        _t(i.type) && Pl(i);
        break;
      case 4:
        ma(i, i.stateNode.containerInfo);
        break;
      case 10:
        rp(i, i.type._context, i.memoizedProps.value);
        break;
      case 13:
        var c = i.memoizedState;
        if (c !== null)
          return c.dehydrated !== null ? (Se(Re, Re.current & 1), i.flags |= 128, null) : u & i.child.childLanes ? $p(r, i, u) : (Se(Re, Re.current & 1), r = Hn(r, i, u), r !== null ? r.sibling : null);
        Se(Re, Re.current & 1);
        break;
      case 19:
        if (c = (u & i.childLanes) !== 0, r.flags & 128) {
          if (c) return nh(
            r,
            i,
            u
          );
          i.flags |= 128;
        }
        var f = i.memoizedState;
        if (f !== null && (f.rendering = null, f.tail = null, f.lastEffect = null), Se(Re, Re.current), c) break;
        return null;
      case 22:
      case 23:
        return i.lanes = 0, Xp(r, i, u);
    }
    return Hn(r, i, u);
  }
  function R1(r, i) {
    switch (fa(i), i.tag) {
      case 1:
        return _t(i.type) && Tl(), r = i.flags, r & 65536 ? (i.flags = r & -65537 | 128, i) : null;
      case 3:
        return hi(), xe(wt), xe(nt), va(), r = i.flags, r & 65536 && !(r & 128) ? (i.flags = r & -65537 | 128, i) : null;
      case 5:
        return ga(i), null;
      case 13:
        if (xe(Re), r = i.memoizedState, r !== null && r.dehydrated !== null) {
          if (i.alternate === null) throw Error(a(340));
          fi();
        }
        return r = i.flags, r & 65536 ? (i.flags = r & -65537 | 128, i) : null;
      case 19:
        return xe(Re), null;
      case 4:
        return hi(), null;
      case 10:
        return oa(i.type._context), null;
      case 22:
      case 23:
        return Ya(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var es = !1, Dr = !1, A1 = typeof WeakSet == "function" ? WeakSet : Set, V = null;
  function ts(r, i) {
    var u = r.ref;
    if (u !== null) if (typeof u == "function") try {
      u(null);
    } catch (c) {
      kt(r, i, c);
    }
    else u.current = null;
  }
  function Na(r, i, u) {
    try {
      u();
    } catch (c) {
      kt(r, i, c);
    }
  }
  var rh = !1;
  function L1(r, i) {
    for (F(r.containerInfo), V = i; V !== null; ) if (r = V, i = r.child, (r.subtreeFlags & 1028) !== 0 && i !== null) i.return = r, V = i;
    else for (; V !== null; ) {
      r = V;
      try {
        var u = r.alternate;
        if (r.flags & 1024) switch (r.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (u !== null) {
              var c = u.memoizedProps, f = u.memoizedState, h = r.stateNode, x = h.getSnapshotBeforeUpdate(r.elementType === r.type ? c : fn(r.type, c), f);
              h.__reactInternalSnapshotBeforeUpdate = x;
            }
            break;
          case 3:
            an && O0(r.stateNode.containerInfo);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(a(163));
        }
      } catch (T) {
        kt(r, r.return, T);
      }
      if (i = r.sibling, i !== null) {
        i.return = r.return, V = i;
        break;
      }
      V = r.return;
    }
    return u = rh, rh = !1, u;
  }
  function jr(r, i, u) {
    var c = i.updateQueue;
    if (c = c !== null ? c.lastEffect : null, c !== null) {
      var f = c = c.next;
      do {
        if ((f.tag & r) === r) {
          var h = f.destroy;
          f.destroy = void 0, h !== void 0 && Na(i, u, h);
        }
        f = f.next;
      } while (f !== c);
    }
  }
  function Eo(r, i) {
    if (i = i.updateQueue, i = i !== null ? i.lastEffect : null, i !== null) {
      var u = i = i.next;
      do {
        if ((u.tag & r) === r) {
          var c = u.create;
          u.destroy = c();
        }
        u = u.next;
      } while (u !== i);
    }
  }
  function Ma(r) {
    var i = r.ref;
    if (i !== null) {
      var u = r.stateNode;
      switch (r.tag) {
        case 5:
          r = Je(u);
          break;
        default:
          r = u;
      }
      typeof i == "function" ? i(r) : i.current = r;
    }
  }
  function ih(r, i, u) {
    if (_n && typeof _n.onCommitFiberUnmount == "function") try {
      _n.onCommitFiberUnmount(Ll, i);
    } catch {
    }
    switch (i.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (r = i.updateQueue, r !== null && (r = r.lastEffect, r !== null)) {
          var c = r = r.next;
          do {
            var f = c, h = f.destroy;
            f = f.tag, h !== void 0 && (f & 2 || f & 4) && Na(i, u, h), c = c.next;
          } while (c !== r);
        }
        break;
      case 1:
        if (ts(i, u), r = i.stateNode, typeof r.componentWillUnmount == "function") try {
          r.props = i.memoizedProps, r.state = i.memoizedState, r.componentWillUnmount();
        } catch (x) {
          kt(
            i,
            u,
            x
          );
        }
        break;
      case 5:
        ts(i, u);
        break;
      case 4:
        an ? ch(r, i, u) : kl && kl && (i = i.stateNode.containerInfo, u = Gd(i), Qd(i, u));
    }
  }
  function oh(r, i, u) {
    for (var c = i; ; ) if (ih(r, c, u), c.child === null || an && c.tag === 4) {
      if (c === i) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === i) return;
        c = c.return;
      }
      c.sibling.return = c.return, c = c.sibling;
    } else c.child.return = c, c = c.child;
  }
  function lh(r) {
    var i = r.alternate;
    i !== null && (r.alternate = null, lh(i)), r.child = null, r.deletions = null, r.sibling = null, r.tag === 5 && (i = r.stateNode, i !== null && p0(i)), r.stateNode = null, r.return = null, r.dependencies = null, r.memoizedProps = null, r.memoizedState = null, r.pendingProps = null, r.stateNode = null, r.updateQueue = null;
  }
  function sh(r) {
    return r.tag === 5 || r.tag === 3 || r.tag === 4;
  }
  function uh(r) {
    e: for (; ; ) {
      for (; r.sibling === null; ) {
        if (r.return === null || sh(r.return)) return null;
        r = r.return;
      }
      for (r.sibling.return = r.return, r = r.sibling; r.tag !== 5 && r.tag !== 6 && r.tag !== 18; ) {
        if (r.flags & 2 || r.child === null || r.tag === 4) continue e;
        r.child.return = r, r = r.child;
      }
      if (!(r.flags & 2)) return r.stateNode;
    }
  }
  function ah(r) {
    if (an) {
      e: {
        for (var i = r.return; i !== null; ) {
          if (sh(i)) break e;
          i = i.return;
        }
        throw Error(a(160));
      }
      var u = i;
      switch (u.tag) {
        case 5:
          i = u.stateNode, u.flags & 32 && (Vd(i), u.flags &= -33), u = uh(r), Ia(r, u, i);
          break;
        case 3:
        case 4:
          i = u.stateNode.containerInfo, u = uh(r), za(r, u, i);
          break;
        default:
          throw Error(a(161));
      }
    }
  }
  function za(r, i, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, i ? R0(u, r, i) : x0(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (za(r, i, u), r = r.sibling; r !== null; ) za(r, i, u), r = r.sibling;
  }
  function Ia(r, i, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, i ? C0(u, r, i) : E0(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (Ia(r, i, u), r = r.sibling; r !== null; ) Ia(r, i, u), r = r.sibling;
  }
  function ch(r, i, u) {
    for (var c = i, f = !1, h, x; ; ) {
      if (!f) {
        f = c.return;
        e: for (; ; ) {
          if (f === null) throw Error(a(160));
          switch (h = f.stateNode, f.tag) {
            case 5:
              x = !1;
              break e;
            case 3:
              h = h.containerInfo, x = !0;
              break e;
            case 4:
              h = h.containerInfo, x = !0;
              break e;
          }
          f = f.return;
        }
        f = !0;
      }
      if (c.tag === 5 || c.tag === 6) oh(r, c, u), x ? L0(h, c.stateNode) : A0(h, c.stateNode);
      else if (c.tag === 18) x ? q0(h, c.stateNode) : J0(h, c.stateNode);
      else if (c.tag === 4) {
        if (c.child !== null) {
          h = c.stateNode.containerInfo, x = !0, c.child.return = c, c = c.child;
          continue;
        }
      } else if (ih(r, c, u), c.child !== null) {
        c.child.return = c, c = c.child;
        continue;
      }
      if (c === i) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === i) return;
        c = c.return, c.tag === 4 && (f = !1);
      }
      c.sibling.return = c.return, c = c.sibling;
    }
  }
  function Oa(r, i) {
    if (an) {
      switch (i.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          jr(3, i, i.return), Eo(3, i), jr(5, i, i.return);
          return;
        case 1:
          return;
        case 5:
          var u = i.stateNode;
          if (u != null) {
            var c = i.memoizedProps;
            r = r !== null ? r.memoizedProps : c;
            var f = i.type, h = i.updateQueue;
            i.updateQueue = null, h !== null && P0(u, h, f, r, c, i);
          }
          return;
        case 6:
          if (i.stateNode === null) throw Error(a(162));
          u = i.memoizedProps, k0(i.stateNode, r !== null ? r.memoizedProps : u, u);
          return;
        case 3:
          zt && r !== null && r.memoizedState.isDehydrated && Jd(i.stateNode.containerInfo);
          return;
        case 12:
          return;
        case 13:
          ns(i);
          return;
        case 19:
          ns(i);
          return;
        case 17:
          return;
      }
      throw Error(a(163));
    }
    switch (i.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        jr(3, i, i.return), Eo(3, i), jr(5, i, i.return);
        return;
      case 12:
        return;
      case 13:
        ns(i);
        return;
      case 19:
        ns(i);
        return;
      case 3:
        zt && r !== null && r.memoizedState.isDehydrated && Jd(i.stateNode.containerInfo);
        break;
      case 22:
      case 23:
        return;
    }
    e: if (kl) {
      switch (i.tag) {
        case 1:
        case 5:
        case 6:
          break e;
        case 3:
        case 4:
          i = i.stateNode, Qd(i.containerInfo, i.pendingChildren);
          break e;
      }
      throw Error(a(163));
    }
  }
  function ns(r) {
    var i = r.updateQueue;
    if (i !== null) {
      r.updateQueue = null;
      var u = r.stateNode;
      u === null && (u = r.stateNode = new A1()), i.forEach(function(c) {
        var f = H1.bind(null, r, c);
        u.has(c) || (u.add(c), c.then(f, f));
      });
    }
  }
  function N1(r, i) {
    for (V = i; V !== null; ) {
      i = V;
      var u = i.deletions;
      if (u !== null) for (var c = 0; c < u.length; c++) {
        var f = u[c];
        try {
          var h = r;
          an ? ch(h, f, i) : oh(h, f, i);
          var x = f.alternate;
          x !== null && (x.return = null), f.return = null;
        } catch ($) {
          kt(f, i, $);
        }
      }
      if (u = i.child, i.subtreeFlags & 12854 && u !== null) u.return = i, V = u;
      else for (; V !== null; ) {
        i = V;
        try {
          var T = i.flags;
          if (T & 32 && an && Vd(i.stateNode), T & 512) {
            var z = i.alternate;
            if (z !== null) {
              var B = z.ref;
              B !== null && (typeof B == "function" ? B(null) : B.current = null);
            }
          }
          if (T & 8192) switch (i.tag) {
            case 13:
              if (i.memoizedState !== null) {
                var Z = i.alternate;
                (Z === null || Z.memoizedState === null) && (Wa = Ke());
              }
              break;
            case 22:
              var ne = i.memoizedState !== null, ee = i.alternate, ye = ee !== null && ee.memoizedState !== null;
              if (u = i, an) {
                e: if (c = u, f = ne, h = null, an) for (var b = c; ; ) {
                  if (b.tag === 5) {
                    if (h === null) {
                      h = b;
                      var lt = b.stateNode;
                      f ? N0(lt) : z0(b.stateNode, b.memoizedProps);
                    }
                  } else if (b.tag === 6) {
                    if (h === null) {
                      var bt = b.stateNode;
                      f ? M0(bt) : I0(bt, b.memoizedProps);
                    }
                  } else if ((b.tag !== 22 && b.tag !== 23 || b.memoizedState === null || b === c) && b.child !== null) {
                    b.child.return = b, b = b.child;
                    continue;
                  }
                  if (b === c) break;
                  for (; b.sibling === null; ) {
                    if (b.return === null || b.return === c) break e;
                    h === b && (h = null), b = b.return;
                  }
                  h === b && (h = null), b.sibling.return = b.return, b = b.sibling;
                }
              }
              if (ne && !ye && u.mode & 1) {
                V = u;
                for (var L = u.child; L !== null; ) {
                  for (u = V = L; V !== null; ) {
                    c = V;
                    var P = c.child;
                    switch (c.tag) {
                      case 0:
                      case 11:
                      case 14:
                      case 15:
                        jr(4, c, c.return);
                        break;
                      case 1:
                        ts(c, c.return);
                        var M = c.stateNode;
                        if (typeof M.componentWillUnmount == "function") {
                          var K = c.return;
                          try {
                            M.props = c.memoizedProps, M.state = c.memoizedState, M.componentWillUnmount();
                          } catch ($) {
                            kt(
                              c,
                              K,
                              $
                            );
                          }
                        }
                        break;
                      case 5:
                        ts(c, c.return);
                        break;
                      case 22:
                        if (c.memoizedState !== null) {
                          ph(u);
                          continue;
                        }
                    }
                    P !== null ? (P.return = c, V = P) : ph(u);
                  }
                  L = L.sibling;
                }
              }
          }
          switch (T & 4102) {
            case 2:
              ah(i), i.flags &= -3;
              break;
            case 6:
              ah(i), i.flags &= -3, Oa(i.alternate, i);
              break;
            case 4096:
              i.flags &= -4097;
              break;
            case 4100:
              i.flags &= -4097, Oa(i.alternate, i);
              break;
            case 4:
              Oa(i.alternate, i);
          }
        } catch ($) {
          kt(i, i.return, $);
        }
        if (u = i.sibling, u !== null) {
          u.return = i.return, V = u;
          break;
        }
        V = i.return;
      }
    }
  }
  function M1(r, i, u) {
    V = r, fh(r);
  }
  function fh(r, i, u) {
    for (var c = (r.mode & 1) !== 0; V !== null; ) {
      var f = V, h = f.child;
      if (f.tag === 22 && c) {
        var x = f.memoizedState !== null || es;
        if (!x) {
          var T = f.alternate, z = T !== null && T.memoizedState !== null || Dr;
          T = es;
          var B = Dr;
          if (es = x, (Dr = z) && !B) for (V = f; V !== null; ) x = V, z = x.child, x.tag === 22 && x.memoizedState !== null ? hh(f) : z !== null ? (z.return = x, V = z) : hh(f);
          for (; h !== null; ) V = h, fh(h), h = h.sibling;
          V = f, es = T, Dr = B;
        }
        dh(r);
      } else f.subtreeFlags & 8772 && h !== null ? (h.return = f, V = h) : dh(r);
    }
  }
  function dh(r) {
    for (; V !== null; ) {
      var i = V;
      if (i.flags & 8772) {
        var u = i.alternate;
        try {
          if (i.flags & 8772) switch (i.tag) {
            case 0:
            case 11:
            case 15:
              Dr || Eo(5, i);
              break;
            case 1:
              var c = i.stateNode;
              if (i.flags & 4 && !Dr) if (u === null) c.componentDidMount();
              else {
                var f = i.elementType === i.type ? u.memoizedProps : fn(i.type, u.memoizedProps);
                c.componentDidUpdate(f, u.memoizedState, c.__reactInternalSnapshotBeforeUpdate);
              }
              var h = i.updateQueue;
              h !== null && lp(i, h, c);
              break;
            case 3:
              var x = i.updateQueue;
              if (x !== null) {
                if (u = null, i.child !== null) switch (i.child.tag) {
                  case 5:
                    u = Je(i.child.stateNode);
                    break;
                  case 1:
                    u = i.child.stateNode;
                }
                lp(i, x, u);
              }
              break;
            case 5:
              var T = i.stateNode;
              u === null && i.flags & 4 && T0(T, i.type, i.memoizedProps, i);
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (zt && i.memoizedState === null) {
                var z = i.alternate;
                if (z !== null) {
                  var B = z.memoizedState;
                  if (B !== null) {
                    var Z = B.dehydrated;
                    Z !== null && Z0(Z);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
              break;
            default:
              throw Error(a(163));
          }
          Dr || i.flags & 512 && Ma(i);
        } catch (ne) {
          kt(i, i.return, ne);
        }
      }
      if (i === r) {
        V = null;
        break;
      }
      if (u = i.sibling, u !== null) {
        u.return = i.return, V = u;
        break;
      }
      V = i.return;
    }
  }
  function ph(r) {
    for (; V !== null; ) {
      var i = V;
      if (i === r) {
        V = null;
        break;
      }
      var u = i.sibling;
      if (u !== null) {
        u.return = i.return, V = u;
        break;
      }
      V = i.return;
    }
  }
  function hh(r) {
    for (; V !== null; ) {
      var i = V;
      try {
        switch (i.tag) {
          case 0:
          case 11:
          case 15:
            var u = i.return;
            try {
              Eo(4, i);
            } catch (z) {
              kt(i, u, z);
            }
            break;
          case 1:
            var c = i.stateNode;
            if (typeof c.componentDidMount == "function") {
              var f = i.return;
              try {
                c.componentDidMount();
              } catch (z) {
                kt(i, f, z);
              }
            }
            var h = i.return;
            try {
              Ma(i);
            } catch (z) {
              kt(i, h, z);
            }
            break;
          case 5:
            var x = i.return;
            try {
              Ma(i);
            } catch (z) {
              kt(i, x, z);
            }
        }
      } catch (z) {
        kt(i, i.return, z);
      }
      if (i === r) {
        V = null;
        break;
      }
      var T = i.sibling;
      if (T !== null) {
        T.return = i.return, V = T;
        break;
      }
      V = i.return;
    }
  }
  var rs = 0, is = 1, os = 2, ls = 3, ss = 4;
  if (typeof Symbol == "function" && Symbol.for) {
    var xo = Symbol.for;
    rs = xo("selector.component"), is = xo("selector.has_pseudo_class"), os = xo("selector.role"), ls = xo("selector.test_id"), ss = xo("selector.text");
  }
  function Da(r) {
    var i = c0(r);
    if (i != null) {
      if (typeof i.memoizedProps["data-testname"] != "string") throw Error(a(364));
      return i;
    }
    if (r = g0(r), r === null) throw Error(a(362));
    return r.stateNode.current;
  }
  function ja(r, i) {
    switch (i.$$typeof) {
      case rs:
        if (r.type === i.value) return !0;
        break;
      case is:
        e: {
          i = i.value, r = [r, 0];
          for (var u = 0; u < r.length; ) {
            var c = r[u++], f = r[u++], h = i[f];
            if (c.tag !== 5 || !io(c)) {
              for (; h != null && ja(c, h); ) f++, h = i[f];
              if (f === i.length) {
                i = !0;
                break e;
              } else for (c = c.child; c !== null; ) r.push(c, f), c = c.sibling;
            }
          }
          i = !1;
        }
        return i;
      case os:
        if (r.tag === 5 && S0(r.stateNode, i.value)) return !0;
        break;
      case ss:
        if ((r.tag === 5 || r.tag === 6) && (r = v0(r), r !== null && 0 <= r.indexOf(i.value))) return !0;
        break;
      case ls:
        if (r.tag === 5 && (r = r.memoizedProps["data-testname"], typeof r == "string" && r.toLowerCase() === i.value.toLowerCase())) return !0;
        break;
      default:
        throw Error(a(365));
    }
    return !1;
  }
  function Fa(r) {
    switch (r.$$typeof) {
      case rs:
        return "<" + (D(r.value) || "Unknown") + ">";
      case is:
        return ":has(" + (Fa(r) || "") + ")";
      case os:
        return '[role="' + r.value + '"]';
      case ss:
        return '"' + r.value + '"';
      case ls:
        return '[data-testname="' + r.value + '"]';
      default:
        throw Error(a(365));
    }
  }
  function mh(r, i) {
    var u = [];
    r = [r, 0];
    for (var c = 0; c < r.length; ) {
      var f = r[c++], h = r[c++], x = i[h];
      if (f.tag !== 5 || !io(f)) {
        for (; x != null && ja(f, x); ) h++, x = i[h];
        if (h === i.length) u.push(f);
        else for (f = f.child; f !== null; ) r.push(f, h), f = f.sibling;
      }
    }
    return u;
  }
  function Ua(r, i) {
    if (!ro) throw Error(a(363));
    r = Da(r), r = mh(r, i), i = [], r = Array.from(r);
    for (var u = 0; u < r.length; ) {
      var c = r[u++];
      if (c.tag === 5) io(c) || i.push(c.stateNode);
      else for (c = c.child; c !== null; ) r.push(c), c = c.sibling;
    }
    return i;
  }
  var z1 = Math.ceil, us = d.ReactCurrentDispatcher, Ha = d.ReactCurrentOwner, Oe = d.ReactCurrentBatchConfig, oe = 0, je = null, Fe = null, qe = 0, jt = 0, gi = $n(0), He = 0, ko = null, yi = 0, as = 0, Ba = 0, To = null, Et = null, Wa = 0, Va = 1 / 0;
  function vi() {
    Va = Ke() + 500;
  }
  var cs = !1, Ga = null, nr = null, fs = !1, rr = null, ds = 0, Po = 0, Ka = null, ps = -1, hs = 0;
  function pt() {
    return oe & 6 ? Ke() : ps !== -1 ? ps : ps = Ke();
  }
  function ir(r) {
    return r.mode & 1 ? oe & 2 && qe !== 0 ? qe & -qe : m1.transition !== null ? (hs === 0 && (r = Cl, Cl <<= 1, !(Cl & 4194240) && (Cl = 64), hs = r), hs) : (r = fe, r !== 0 ? r : d0()) : 1;
  }
  function qt(r, i, u) {
    if (50 < Po) throw Po = 0, Ka = null, Error(a(185));
    var c = ms(r, i);
    return c === null ? null : (uo(c, i, u), (!(oe & 2) || c !== je) && (c === je && (!(oe & 2) && (as |= i), He === 4 && or(c, qe)), xt(c, u), i === 1 && oe === 0 && !(r.mode & 1) && (vi(), Nl && xn())), c);
  }
  function ms(r, i) {
    r.lanes |= i;
    var u = r.alternate;
    for (u !== null && (u.lanes |= i), u = r, r = r.return; r !== null; ) r.childLanes |= i, u = r.alternate, u !== null && (u.childLanes |= i), u = r, r = r.return;
    return u.tag === 3 ? u.stateNode : null;
  }
  function xt(r, i) {
    var u = r.callbackNode;
    l1(r, i);
    var c = Al(r, r === je ? qe : 0);
    if (c === 0) u !== null && tp(u), r.callbackNode = null, r.callbackPriority = 0;
    else if (i = c & -c, r.callbackPriority !== i) {
      if (u != null && tp(u), i === 1) r.tag === 0 ? h1(yh.bind(null, r)) : np(yh.bind(null, r)), h0 ? m0(function() {
        oe === 0 && xn();
      }) : bu(ea, xn), u = null;
      else {
        switch (ep(c)) {
          case 1:
            u = ea;
            break;
          case 4:
            u = c1;
            break;
          case 16:
            u = ta;
            break;
          case 536870912:
            u = f1;
            break;
          default:
            u = ta;
        }
        u = Ph(u, gh.bind(null, r));
      }
      r.callbackPriority = i, r.callbackNode = u;
    }
  }
  function gh(r, i) {
    if (ps = -1, hs = 0, oe & 6) throw Error(a(327));
    var u = r.callbackNode;
    if (Hr() && r.callbackNode !== u) return null;
    var c = Al(r, r === je ? qe : 0);
    if (c === 0) return null;
    if (c & 30 || c & r.expiredLanes || i) i = gs(r, c);
    else {
      i = c;
      var f = oe;
      oe |= 2;
      var h = wh();
      (je !== r || qe !== i) && (vi(), Fr(r, i));
      do
        try {
          D1();
          break;
        } catch (T) {
          Sh(r, T);
        }
      while (!0);
      ia(), us.current = h, oe = f, Fe !== null ? i = 0 : (je = null, qe = 0, i = He);
    }
    if (i !== 0) {
      if (i === 2 && (f = Ju(r), f !== 0 && (c = f, i = Qa(r, f))), i === 1) throw u = ko, Fr(r, 0), or(r, c), xt(r, Ke()), u;
      if (i === 6) or(r, c);
      else {
        if (f = r.current.alternate, !(c & 30) && !I1(f) && (i = gs(r, c), i === 2 && (h = Ju(r), h !== 0 && (c = h, i = Qa(r, h))), i === 1)) throw u = ko, Fr(r, 0), or(r, c), xt(r, Ke()), u;
        switch (r.finishedWork = f, r.finishedLanes = c, i) {
          case 0:
          case 1:
            throw Error(a(345));
          case 2:
            Ur(r, Et);
            break;
          case 3:
            if (or(r, c), (c & 130023424) === c && (i = Wa + 500 - Ke(), 10 < i)) {
              if (Al(r, 0) !== 0) break;
              if (f = r.suspendedLanes, (f & c) !== c) {
                pt(), r.pingedLanes |= r.suspendedLanes & f;
                break;
              }
              r.timeoutHandle = Kt(Ur.bind(null, r, Et), i);
              break;
            }
            Ur(r, Et);
            break;
          case 4:
            if (or(r, c), (c & 4194240) === c) break;
            for (i = r.eventTimes, f = -1; 0 < c; ) {
              var x = 31 - cn(c);
              h = 1 << x, x = i[x], x > f && (f = x), c &= ~h;
            }
            if (c = f, c = Ke() - c, c = (120 > c ? 120 : 480 > c ? 480 : 1080 > c ? 1080 : 1920 > c ? 1920 : 3e3 > c ? 3e3 : 4320 > c ? 4320 : 1960 * z1(c / 1960)) - c, 10 < c) {
              r.timeoutHandle = Kt(Ur.bind(null, r, Et), c);
              break;
            }
            Ur(r, Et);
            break;
          case 5:
            Ur(r, Et);
            break;
          default:
            throw Error(a(329));
        }
      }
    }
    return xt(r, Ke()), r.callbackNode === u ? gh.bind(null, r) : null;
  }
  function Qa(r, i) {
    var u = To;
    return r.current.memoizedState.isDehydrated && (Fr(r, i).flags |= 256), r = gs(r, i), r !== 2 && (i = Et, Et = u, i !== null && Xa(i)), r;
  }
  function Xa(r) {
    Et === null ? Et = r : Et.push.apply(Et, r);
  }
  function I1(r) {
    for (var i = r; ; ) {
      if (i.flags & 16384) {
        var u = i.updateQueue;
        if (u !== null && (u = u.stores, u !== null)) for (var c = 0; c < u.length; c++) {
          var f = u[c], h = f.getSnapshot;
          f = f.value;
          try {
            if (!En(h(), f)) return !1;
          } catch {
            return !1;
          }
        }
      }
      if (u = i.child, i.subtreeFlags & 16384 && u !== null) u.return = i, i = u;
      else {
        if (i === r) break;
        for (; i.sibling === null; ) {
          if (i.return === null || i.return === r) return !0;
          i = i.return;
        }
        i.sibling.return = i.return, i = i.sibling;
      }
    }
    return !0;
  }
  function or(r, i) {
    for (i &= ~Ba, i &= ~as, r.suspendedLanes |= i, r.pingedLanes &= ~i, r = r.expirationTimes; 0 < i; ) {
      var u = 31 - cn(i), c = 1 << u;
      r[u] = -1, i &= ~c;
    }
  }
  function yh(r) {
    if (oe & 6) throw Error(a(327));
    Hr();
    var i = Al(r, 0);
    if (!(i & 1)) return xt(r, Ke()), null;
    var u = gs(r, i);
    if (r.tag !== 0 && u === 2) {
      var c = Ju(r);
      c !== 0 && (i = c, u = Qa(r, c));
    }
    if (u === 1) throw u = ko, Fr(r, 0), or(r, i), xt(r, Ke()), u;
    if (u === 6) throw Error(a(345));
    return r.finishedWork = r.current.alternate, r.finishedLanes = i, Ur(r, Et), xt(r, Ke()), null;
  }
  function vh(r) {
    rr !== null && rr.tag === 0 && !(oe & 6) && Hr();
    var i = oe;
    oe |= 1;
    var u = Oe.transition, c = fe;
    try {
      if (Oe.transition = null, fe = 1, r) return r();
    } finally {
      fe = c, Oe.transition = u, oe = i, !(oe & 6) && xn();
    }
  }
  function Ya() {
    jt = gi.current, xe(gi);
  }
  function Fr(r, i) {
    r.finishedWork = null, r.finishedLanes = 0;
    var u = r.timeoutHandle;
    if (u !== Gu && (r.timeoutHandle = Gu, a0(u)), Fe !== null) for (u = Fe.return; u !== null; ) {
      var c = u;
      switch (fa(c), c.tag) {
        case 1:
          c = c.type.childContextTypes, c != null && Tl();
          break;
        case 3:
          hi(), xe(wt), xe(nt), va();
          break;
        case 5:
          ga(c);
          break;
        case 4:
          hi();
          break;
        case 13:
          xe(Re);
          break;
        case 19:
          xe(Re);
          break;
        case 10:
          oa(c.type._context);
          break;
        case 22:
        case 23:
          Ya();
      }
      u = u.return;
    }
    if (je = r, Fe = r = lr(r.current, null), qe = jt = i, He = 0, ko = null, Ba = as = yi = 0, Et = To = null, kn !== null) {
      for (i = 0; i < kn.length; i++) if (u = kn[i], c = u.interleaved, c !== null) {
        u.interleaved = null;
        var f = c.next, h = u.pending;
        if (h !== null) {
          var x = h.next;
          h.next = f, c.next = x;
        }
        u.pending = c;
      }
      kn = null;
    }
    return r;
  }
  function Sh(r, i) {
    do {
      var u = Fe;
      try {
        if (ia(), Wl.current = Yl, Vl) {
          for (var c = ze.memoizedState; c !== null; ) {
            var f = c.queue;
            f !== null && (f.pending = null), c = c.next;
          }
          Vl = !1;
        }
        if (mi = 0, Qe = rt = ze = null, mo = !1, go = 0, Ha.current = null, u === null || u.return === null) {
          He = 1, ko = i, Fe = null;
          break;
        }
        e: {
          var h = r, x = u.return, T = u, z = i;
          if (i = qe, T.flags |= 32768, z !== null && typeof z == "object" && typeof z.then == "function") {
            var B = z, Z = T, ne = Z.tag;
            if (!(Z.mode & 1) && (ne === 0 || ne === 11 || ne === 15)) {
              var ee = Z.alternate;
              ee ? (Z.updateQueue = ee.updateQueue, Z.memoizedState = ee.memoizedState, Z.lanes = ee.lanes) : (Z.updateQueue = null, Z.memoizedState = null);
            }
            var ye = Hp(x);
            if (ye !== null) {
              ye.flags &= -257, Bp(ye, x, T, h, i), ye.mode & 1 && Up(h, B, i), i = ye, z = B;
              var b = i.updateQueue;
              if (b === null) {
                var lt = /* @__PURE__ */ new Set();
                lt.add(z), i.updateQueue = lt;
              } else b.add(z);
              break e;
            } else {
              if (!(i & 1)) {
                Up(h, B, i), Za();
                break e;
              }
              z = Error(a(426));
            }
          } else if (Pe && T.mode & 1) {
            var bt = Hp(x);
            if (bt !== null) {
              !(bt.flags & 65536) && (bt.flags |= 256), Bp(bt, x, T, h, i), ha(z);
              break e;
            }
          }
          h = z, He !== 4 && (He = 2), To === null ? To = [h] : To.push(h), z = Ta(z, T), T = x;
          do {
            switch (T.tag) {
              case 3:
                T.flags |= 65536, i &= -i, T.lanes |= i;
                var L = jp(T, z, i);
                op(T, L);
                break e;
              case 1:
                h = z;
                var P = T.type, M = T.stateNode;
                if (!(T.flags & 128) && (typeof P.getDerivedStateFromError == "function" || M !== null && typeof M.componentDidCatch == "function" && (nr === null || !nr.has(M)))) {
                  T.flags |= 65536, i &= -i, T.lanes |= i;
                  var K = Fp(T, h, i);
                  op(T, K);
                  break e;
                }
            }
            T = T.return;
          } while (T !== null);
        }
        Eh(u);
      } catch ($) {
        i = $, Fe === u && u !== null && (Fe = u = u.return);
        continue;
      }
      break;
    } while (!0);
  }
  function wh() {
    var r = us.current;
    return us.current = Yl, r === null ? Yl : r;
  }
  function Za() {
    (He === 0 || He === 3 || He === 2) && (He = 4), je === null || !(yi & 268435455) && !(as & 268435455) || or(je, qe);
  }
  function gs(r, i) {
    var u = oe;
    oe |= 2;
    var c = wh();
    je === r && qe === i || Fr(r, i);
    do
      try {
        O1();
        break;
      } catch (f) {
        Sh(r, f);
      }
    while (!0);
    if (ia(), oe = u, us.current = c, Fe !== null) throw Error(a(261));
    return je = null, qe = 0, He;
  }
  function O1() {
    for (; Fe !== null; ) _h(Fe);
  }
  function D1() {
    for (; Fe !== null && !u1(); ) _h(Fe);
  }
  function _h(r) {
    var i = Th(r.alternate, r, jt);
    r.memoizedProps = r.pendingProps, i === null ? Eh(r) : Fe = i, Ha.current = null;
  }
  function Eh(r) {
    var i = r;
    do {
      var u = i.alternate;
      if (r = i.return, i.flags & 32768) {
        if (u = R1(u, i), u !== null) {
          u.flags &= 32767, Fe = u;
          return;
        }
        if (r !== null) r.flags |= 32768, r.subtreeFlags = 0, r.deletions = null;
        else {
          He = 6, Fe = null;
          return;
        }
      } else if (u = T1(u, i, jt), u !== null) {
        Fe = u;
        return;
      }
      if (i = i.sibling, i !== null) {
        Fe = i;
        return;
      }
      Fe = i = r;
    } while (i !== null);
    He === 0 && (He = 5);
  }
  function Ur(r, i) {
    var u = fe, c = Oe.transition;
    try {
      Oe.transition = null, fe = 1, j1(r, i, u);
    } finally {
      Oe.transition = c, fe = u;
    }
    return null;
  }
  function j1(r, i, u) {
    do
      Hr();
    while (rr !== null);
    if (oe & 6) throw Error(a(327));
    var c = r.finishedWork, f = r.finishedLanes;
    if (c === null) return null;
    if (r.finishedWork = null, r.finishedLanes = 0, c === r.current) throw Error(a(177));
    r.callbackNode = null, r.callbackPriority = 0;
    var h = c.lanes | c.childLanes;
    if (s1(r, h), r === je && (Fe = je = null, qe = 0), !(c.subtreeFlags & 2064) && !(c.flags & 2064) || fs || (fs = !0, Ph(ta, function() {
      return Hr(), null;
    })), h = (c.flags & 15990) !== 0, c.subtreeFlags & 15990 || h) {
      h = Oe.transition, Oe.transition = null;
      var x = fe;
      fe = 1;
      var T = oe;
      oe |= 4, Ha.current = null, L1(r, c), N1(r, c), j(r.containerInfo), r.current = c, M1(c), a1(), oe = T, fe = x, Oe.transition = h;
    } else r.current = c;
    if (fs && (fs = !1, rr = r, ds = f), h = r.pendingLanes, h === 0 && (nr = null), d1(c.stateNode), xt(r, Ke()), i !== null) for (u = r.onRecoverableError, c = 0; c < i.length; c++) u(i[c]);
    if (cs) throw cs = !1, r = Ga, Ga = null, r;
    return ds & 1 && r.tag !== 0 && Hr(), h = r.pendingLanes, h & 1 ? r === Ka ? Po++ : (Po = 0, Ka = r) : Po = 0, xn(), null;
  }
  function Hr() {
    if (rr !== null) {
      var r = ep(ds), i = Oe.transition, u = fe;
      try {
        if (Oe.transition = null, fe = 16 > r ? 16 : r, rr === null) var c = !1;
        else {
          if (r = rr, rr = null, ds = 0, oe & 6) throw Error(a(331));
          var f = oe;
          for (oe |= 4, V = r.current; V !== null; ) {
            var h = V, x = h.child;
            if (V.flags & 16) {
              var T = h.deletions;
              if (T !== null) {
                for (var z = 0; z < T.length; z++) {
                  var B = T[z];
                  for (V = B; V !== null; ) {
                    var Z = V;
                    switch (Z.tag) {
                      case 0:
                      case 11:
                      case 15:
                        jr(8, Z, h);
                    }
                    var ne = Z.child;
                    if (ne !== null) ne.return = Z, V = ne;
                    else for (; V !== null; ) {
                      Z = V;
                      var ee = Z.sibling, ye = Z.return;
                      if (lh(Z), Z === B) {
                        V = null;
                        break;
                      }
                      if (ee !== null) {
                        ee.return = ye, V = ee;
                        break;
                      }
                      V = ye;
                    }
                  }
                }
                var b = h.alternate;
                if (b !== null) {
                  var lt = b.child;
                  if (lt !== null) {
                    b.child = null;
                    do {
                      var bt = lt.sibling;
                      lt.sibling = null, lt = bt;
                    } while (lt !== null);
                  }
                }
                V = h;
              }
            }
            if (h.subtreeFlags & 2064 && x !== null) x.return = h, V = x;
            else e: for (; V !== null; ) {
              if (h = V, h.flags & 2048) switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  jr(9, h, h.return);
              }
              var L = h.sibling;
              if (L !== null) {
                L.return = h.return, V = L;
                break e;
              }
              V = h.return;
            }
          }
          var P = r.current;
          for (V = P; V !== null; ) {
            x = V;
            var M = x.child;
            if (x.subtreeFlags & 2064 && M !== null) M.return = x, V = M;
            else e: for (x = P; V !== null; ) {
              if (T = V, T.flags & 2048) try {
                switch (T.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Eo(9, T);
                }
              } catch ($) {
                kt(T, T.return, $);
              }
              if (T === x) {
                V = null;
                break e;
              }
              var K = T.sibling;
              if (K !== null) {
                K.return = T.return, V = K;
                break e;
              }
              V = T.return;
            }
          }
          if (oe = f, xn(), _n && typeof _n.onPostCommitFiberRoot == "function") try {
            _n.onPostCommitFiberRoot(Ll, r);
          } catch {
          }
          c = !0;
        }
        return c;
      } finally {
        fe = u, Oe.transition = i;
      }
    }
    return !1;
  }
  function xh(r, i, u) {
    i = Ta(u, i), i = jp(r, i, 1), tr(r, i), i = pt(), r = ms(r, 1), r !== null && (uo(r, 1, i), xt(r, i));
  }
  function kt(r, i, u) {
    if (r.tag === 3) xh(r, r, u);
    else for (; i !== null; ) {
      if (i.tag === 3) {
        xh(i, r, u);
        break;
      } else if (i.tag === 1) {
        var c = i.stateNode;
        if (typeof i.type.getDerivedStateFromError == "function" || typeof c.componentDidCatch == "function" && (nr === null || !nr.has(c))) {
          r = Ta(u, r), r = Fp(i, r, 1), tr(i, r), r = pt(), i = ms(i, 1), i !== null && (uo(i, 1, r), xt(i, r));
          break;
        }
      }
      i = i.return;
    }
  }
  function F1(r, i, u) {
    var c = r.pingCache;
    c !== null && c.delete(i), i = pt(), r.pingedLanes |= r.suspendedLanes & u, je === r && (qe & u) === u && (He === 4 || He === 3 && (qe & 130023424) === qe && 500 > Ke() - Wa ? Fr(r, 0) : Ba |= u), xt(r, i);
  }
  function kh(r, i) {
    i === 0 && (r.mode & 1 ? (i = Rl, Rl <<= 1, !(Rl & 130023424) && (Rl = 4194304)) : i = 1);
    var u = pt();
    r = ms(r, i), r !== null && (uo(r, i, u), xt(r, u));
  }
  function U1(r) {
    var i = r.memoizedState, u = 0;
    i !== null && (u = i.retryLane), kh(r, u);
  }
  function H1(r, i) {
    var u = 0;
    switch (r.tag) {
      case 13:
        var c = r.stateNode, f = r.memoizedState;
        f !== null && (u = f.retryLane);
        break;
      case 19:
        c = r.stateNode;
        break;
      default:
        throw Error(a(314));
    }
    c !== null && c.delete(i), kh(r, u);
  }
  var Th;
  Th = function(r, i, u) {
    if (r !== null) if (r.memoizedProps !== i.pendingProps || wt.current) Dt = !0;
    else {
      if (!(r.lanes & u) && !(i.flags & 128)) return Dt = !1, C1(r, i, u);
      Dt = !!(r.flags & 131072);
    }
    else Dt = !1, Pe && i.flags & 1048576 && fp(i, Ul, i.index);
    switch (i.lanes = 0, i.tag) {
      case 2:
        var c = i.type;
        r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), r = i.pendingProps;
        var f = li(i, nt.current);
        ui(i, u), f = wa(null, i, c, r, f, u);
        var h = _a();
        return i.flags |= 1, typeof f == "object" && f !== null && typeof f.render == "function" && f.$$typeof === void 0 ? (i.tag = 1, i.memoizedState = null, i.updateQueue = null, _t(c) ? (h = !0, Pl(i)) : h = !1, i.memoizedState = f.state !== null && f.state !== void 0 ? f.state : null, sa(i), f.updater = jl, i.stateNode = f, f._reactInternals = i, aa(i, c, r, u), i = Ra(null, i, c, !0, h, u)) : (i.tag = 0, Pe && h && ca(i), dt(null, i, f, u), i = i.child), i;
      case 16:
        c = i.elementType;
        e: {
          switch (r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), r = i.pendingProps, f = c._init, c = f(c._payload), i.type = c, f = i.tag = W1(c), r = fn(c, r), f) {
            case 0:
              i = Ca(null, i, c, r, u);
              break e;
            case 1:
              i = Zp(
                null,
                i,
                c,
                r,
                u
              );
              break e;
            case 11:
              i = Gp(null, i, c, r, u);
              break e;
            case 14:
              i = Kp(null, i, c, fn(c.type, r), u);
              break e;
          }
          throw Error(a(306, c, ""));
        }
        return i;
      case 0:
        return c = i.type, f = i.pendingProps, f = i.elementType === c ? f : fn(c, f), Ca(r, i, c, f, u);
      case 1:
        return c = i.type, f = i.pendingProps, f = i.elementType === c ? f : fn(c, f), Zp(r, i, c, f, u);
      case 3:
        e: {
          if (Jp(i), r === null) throw Error(a(387));
          c = i.pendingProps, h = i.memoizedState, f = h.element, ip(r, i), Dl(i, c, null, u);
          var x = i.memoizedState;
          if (c = x.element, zt && h.isDehydrated) if (h = {
            element: c,
            isDehydrated: !1,
            cache: x.cache,
            transitions: x.transitions
          }, i.updateQueue.baseState = h, i.memoizedState = h, i.flags & 256) {
            f = Error(a(423)), i = qp(r, i, c, u, f);
            break e;
          } else if (c !== f) {
            f = Error(a(424)), i = qp(r, i, c, u, f);
            break e;
          } else for (zt && (Ot = V0(i.stateNode.containerInfo), It = i, Pe = !0, dn = null, ao = !1), u = yp(i, null, c, u), i.child = u; u; ) u.flags = u.flags & -3 | 4096, u = u.sibling;
          else {
            if (fi(), c === f) {
              i = Hn(r, i, u);
              break e;
            }
            dt(r, i, c, u);
          }
          i = i.child;
        }
        return i;
      case 5:
        return vp(i), r === null && pa(i), c = i.type, f = i.pendingProps, h = r !== null ? r.memoizedProps : null, x = f.children, tt(c, f) ? x = null : h !== null && tt(c, h) && (i.flags |= 32), Yp(r, i), dt(r, i, x, u), i.child;
      case 6:
        return r === null && pa(i), null;
      case 13:
        return $p(r, i, u);
      case 4:
        return ma(i, i.stateNode.containerInfo), c = i.pendingProps, r === null ? i.child = di(i, null, c, u) : dt(r, i, c, u), i.child;
      case 11:
        return c = i.type, f = i.pendingProps, f = i.elementType === c ? f : fn(c, f), Gp(r, i, c, f, u);
      case 7:
        return dt(r, i, i.pendingProps, u), i.child;
      case 8:
        return dt(r, i, i.pendingProps.children, u), i.child;
      case 12:
        return dt(r, i, i.pendingProps.children, u), i.child;
      case 10:
        e: {
          if (c = i.type._context, f = i.pendingProps, h = i.memoizedProps, x = f.value, rp(i, c, x), h !== null) if (En(h.value, x)) {
            if (h.children === f.children && !wt.current) {
              i = Hn(r, i, u);
              break e;
            }
          } else for (h = i.child, h !== null && (h.return = i); h !== null; ) {
            var T = h.dependencies;
            if (T !== null) {
              x = h.child;
              for (var z = T.firstContext; z !== null; ) {
                if (z.context === c) {
                  if (h.tag === 1) {
                    z = Dn(-1, u & -u), z.tag = 2;
                    var B = h.updateQueue;
                    if (B !== null) {
                      B = B.shared;
                      var Z = B.pending;
                      Z === null ? z.next = z : (z.next = Z.next, Z.next = z), B.pending = z;
                    }
                  }
                  h.lanes |= u, z = h.alternate, z !== null && (z.lanes |= u), la(h.return, u, i), T.lanes |= u;
                  break;
                }
                z = z.next;
              }
            } else if (h.tag === 10) x = h.type === i.type ? null : h.child;
            else if (h.tag === 18) {
              if (x = h.return, x === null) throw Error(a(341));
              x.lanes |= u, T = x.alternate, T !== null && (T.lanes |= u), la(x, u, i), x = h.sibling;
            } else x = h.child;
            if (x !== null) x.return = h;
            else for (x = h; x !== null; ) {
              if (x === i) {
                x = null;
                break;
              }
              if (h = x.sibling, h !== null) {
                h.return = x.return, x = h;
                break;
              }
              x = x.return;
            }
            h = x;
          }
          dt(r, i, f.children, u), i = i.child;
        }
        return i;
      case 9:
        return f = i.type, c = i.pendingProps.children, ui(i, u), f = Qt(f), c = c(f), i.flags |= 1, dt(r, i, c, u), i.child;
      case 14:
        return c = i.type, f = fn(c, i.pendingProps), f = fn(c.type, f), Kp(r, i, c, f, u);
      case 15:
        return Qp(r, i, i.type, i.pendingProps, u);
      case 17:
        return c = i.type, f = i.pendingProps, f = i.elementType === c ? f : fn(c, f), r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), i.tag = 1, _t(c) ? (r = !0, Pl(i)) : r = !1, ui(i, u), ap(i, c, f), aa(i, c, f, u), Ra(null, i, c, !0, r, u);
      case 19:
        return nh(r, i, u);
      case 22:
        return Xp(r, i, u);
    }
    throw Error(a(156, i.tag));
  };
  function Ph(r, i) {
    return bu(r, i);
  }
  function B1(r, i, u, c) {
    this.tag = r, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = i, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = c, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function $t(r, i, u, c) {
    return new B1(r, i, u, c);
  }
  function Ja(r) {
    return r = r.prototype, !(!r || !r.isReactComponent);
  }
  function W1(r) {
    if (typeof r == "function") return Ja(r) ? 1 : 0;
    if (r != null) {
      if (r = r.$$typeof, r === R) return 11;
      if (r === S) return 14;
    }
    return 2;
  }
  function lr(r, i) {
    var u = r.alternate;
    return u === null ? (u = $t(r.tag, i, r.key, r.mode), u.elementType = r.elementType, u.type = r.type, u.stateNode = r.stateNode, u.alternate = r, r.alternate = u) : (u.pendingProps = i, u.type = r.type, u.flags = 0, u.subtreeFlags = 0, u.deletions = null), u.flags = r.flags & 14680064, u.childLanes = r.childLanes, u.lanes = r.lanes, u.child = r.child, u.memoizedProps = r.memoizedProps, u.memoizedState = r.memoizedState, u.updateQueue = r.updateQueue, i = r.dependencies, u.dependencies = i === null ? null : { lanes: i.lanes, firstContext: i.firstContext }, u.sibling = r.sibling, u.index = r.index, u.ref = r.ref, u;
  }
  function ys(r, i, u, c, f, h) {
    var x = 2;
    if (c = r, typeof r == "function") Ja(r) && (x = 1);
    else if (typeof r == "string") x = 5;
    else e: switch (r) {
      case g:
        return Br(u.children, f, h, i);
      case y:
        x = 8, f |= 8;
        break;
      case v:
        return r = $t(12, u, i, f | 2), r.elementType = v, r.lanes = h, r;
      case A:
        return r = $t(13, u, i, f), r.elementType = A, r.lanes = h, r;
      case w:
        return r = $t(19, u, i, f), r.elementType = w, r.lanes = h, r;
      case C:
        return vs(u, f, h, i);
      default:
        if (typeof r == "object" && r !== null) switch (r.$$typeof) {
          case _:
            x = 10;
            break e;
          case k:
            x = 9;
            break e;
          case R:
            x = 11;
            break e;
          case S:
            x = 14;
            break e;
          case E:
            x = 16, c = null;
            break e;
        }
        throw Error(a(130, r == null ? r : typeof r, ""));
    }
    return i = $t(x, u, i, f), i.elementType = r, i.type = c, i.lanes = h, i;
  }
  function Br(r, i, u, c) {
    return r = $t(7, r, c, i), r.lanes = u, r;
  }
  function vs(r, i, u, c) {
    return r = $t(22, r, c, i), r.elementType = C, r.lanes = u, r.stateNode = {}, r;
  }
  function qa(r, i, u) {
    return r = $t(6, r, null, i), r.lanes = u, r;
  }
  function $a(r, i, u) {
    return i = $t(4, r.children !== null ? r.children : [], r.key, i), i.lanes = u, i.stateNode = { containerInfo: r.containerInfo, pendingChildren: null, implementation: r.implementation }, i;
  }
  function V1(r, i, u, c, f) {
    this.tag = i, this.containerInfo = r, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = Gu, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = qu(0), this.expirationTimes = qu(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = qu(0), this.identifierPrefix = c, this.onRecoverableError = f, zt && (this.mutableSourceEagerHydrationData = null);
  }
  function Ch(r, i, u, c, f, h, x, T, z) {
    return r = new V1(r, i, u, T, z), i === 1 ? (i = 1, h === !0 && (i |= 8)) : i = 0, h = $t(3, null, null, i), r.current = h, h.stateNode = r, h.memoizedState = { element: c, isDehydrated: u, cache: null, transitions: null }, sa(h), r;
  }
  function Rh(r) {
    if (!r) return bn;
    r = r._reactInternals;
    e: {
      if (J(r) !== r || r.tag !== 1) throw Error(a(170));
      var i = r;
      do {
        switch (i.tag) {
          case 3:
            i = i.stateNode.context;
            break e;
          case 1:
            if (_t(i.type)) {
              i = i.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        i = i.return;
      } while (i !== null);
      throw Error(a(171));
    }
    if (r.tag === 1) {
      var u = r.type;
      if (_t(u)) return $d(r, u, i);
    }
    return i;
  }
  function Ah(r) {
    var i = r._reactInternals;
    if (i === void 0)
      throw typeof r.render == "function" ? Error(a(188)) : (r = Object.keys(r).join(","), Error(a(268, r)));
    return r = le(i), r === null ? null : r.stateNode;
  }
  function Lh(r, i) {
    if (r = r.memoizedState, r !== null && r.dehydrated !== null) {
      var u = r.retryLane;
      r.retryLane = u !== 0 && u < i ? u : i;
    }
  }
  function ba(r, i) {
    Lh(r, i), (r = r.alternate) && Lh(r, i);
  }
  function G1(r) {
    return r = le(r), r === null ? null : r.stateNode;
  }
  function K1() {
    return null;
  }
  return n.attemptContinuousHydration = function(r) {
    if (r.tag === 13) {
      var i = pt();
      qt(r, 134217728, i), ba(r, 134217728);
    }
  }, n.attemptHydrationAtCurrentPriority = function(r) {
    if (r.tag === 13) {
      var i = pt(), u = ir(r);
      qt(r, u, i), ba(r, u);
    }
  }, n.attemptSynchronousHydration = function(r) {
    switch (r.tag) {
      case 3:
        var i = r.stateNode;
        if (i.current.memoizedState.isDehydrated) {
          var u = so(i.pendingLanes);
          u !== 0 && ($u(i, u | 1), xt(i, Ke()), !(oe & 6) && (vi(), xn()));
        }
        break;
      case 13:
        var c = pt();
        vh(function() {
          return qt(r, 1, c);
        }), ba(r, 1);
    }
  }, n.batchedUpdates = function(r, i) {
    var u = oe;
    oe |= 1;
    try {
      return r(i);
    } finally {
      oe = u, oe === 0 && (vi(), Nl && xn());
    }
  }, n.createComponentSelector = function(r) {
    return { $$typeof: rs, value: r };
  }, n.createContainer = function(r, i, u, c, f, h, x) {
    return Ch(r, i, !1, null, u, c, f, h, x);
  }, n.createHasPseudoClassSelector = function(r) {
    return { $$typeof: is, value: r };
  }, n.createHydrationContainer = function(r, i, u, c, f, h, x, T, z) {
    return r = Ch(u, c, !0, r, f, h, x, T, z), r.context = Rh(null), u = r.current, c = pt(), f = ir(u), h = Dn(c, f), h.callback = i ?? null, tr(u, h), r.current.lanes = f, uo(r, f, c), xt(r, c), r;
  }, n.createPortal = function(r, i, u) {
    var c = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: m, key: c == null ? null : "" + c, children: r, containerInfo: i, implementation: u };
  }, n.createRoleSelector = function(r) {
    return { $$typeof: os, value: r };
  }, n.createTestNameSelector = function(r) {
    return { $$typeof: ls, value: r };
  }, n.createTextSelector = function(r) {
    return { $$typeof: ss, value: r };
  }, n.deferredUpdates = function(r) {
    var i = fe, u = Oe.transition;
    try {
      return Oe.transition = null, fe = 16, r();
    } finally {
      fe = i, Oe.transition = u;
    }
  }, n.discreteUpdates = function(r, i, u, c, f) {
    var h = fe, x = Oe.transition;
    try {
      return Oe.transition = null, fe = 1, r(i, u, c, f);
    } finally {
      fe = h, Oe.transition = x, oe === 0 && vi();
    }
  }, n.findAllNodes = Ua, n.findBoundingRects = function(r, i) {
    if (!ro) throw Error(a(363));
    i = Ua(r, i), r = [];
    for (var u = 0; u < i.length; u++) r.push(y0(i[u]));
    for (i = r.length - 1; 0 < i; i--) {
      u = r[i];
      for (var c = u.x, f = c + u.width, h = u.y, x = h + u.height, T = i - 1; 0 <= T; T--) if (i !== T) {
        var z = r[T], B = z.x, Z = B + z.width, ne = z.y, ee = ne + z.height;
        if (c >= B && h >= ne && f <= Z && x <= ee) {
          r.splice(i, 1);
          break;
        } else if (c !== B || u.width !== z.width || ee < h || ne > x) {
          if (!(h !== ne || u.height !== z.height || Z < c || B > f)) {
            B > c && (z.width += B - c, z.x = c), Z < f && (z.width = f - B), r.splice(i, 1);
            break;
          }
        } else {
          ne > h && (z.height += ne - h, z.y = h), ee < x && (z.height = x - ne), r.splice(i, 1);
          break;
        }
      }
    }
    return r;
  }, n.findHostInstance = Ah, n.findHostInstanceWithNoPortals = function(r) {
    return r = G(r), r = r !== null ? vt(r) : null, r === null ? null : r.stateNode;
  }, n.findHostInstanceWithWarning = function(r) {
    return Ah(r);
  }, n.flushControlled = function(r) {
    var i = oe;
    oe |= 1;
    var u = Oe.transition, c = fe;
    try {
      Oe.transition = null, fe = 1, r();
    } finally {
      fe = c, Oe.transition = u, oe = i, oe === 0 && (vi(), xn());
    }
  }, n.flushPassiveEffects = Hr, n.flushSync = vh, n.focusWithin = function(r, i) {
    if (!ro) throw Error(a(363));
    for (r = Da(r), i = mh(r, i), i = Array.from(i), r = 0; r < i.length; ) {
      var u = i[r++];
      if (!io(u)) {
        if (u.tag === 5 && w0(u.stateNode)) return !0;
        for (u = u.child; u !== null; ) i.push(u), u = u.sibling;
      }
    }
    return !1;
  }, n.getCurrentUpdatePriority = function() {
    return fe;
  }, n.getFindAllNodesFailureDescription = function(r, i) {
    if (!ro) throw Error(a(363));
    var u = 0, c = [];
    r = [Da(r), 0];
    for (var f = 0; f < r.length; ) {
      var h = r[f++], x = r[f++], T = i[x];
      if ((h.tag !== 5 || !io(h)) && (ja(h, T) && (c.push(Fa(T)), x++, x > u && (u = x)), x < i.length)) for (h = h.child; h !== null; ) r.push(h, x), h = h.sibling;
    }
    if (u < i.length) {
      for (r = []; u < i.length; u++) r.push(Fa(i[u]));
      return `findAllNodes was able to match part of the selector:
  ` + (c.join(" > ") + `

No matching component was found for:
  `) + r.join(" > ");
    }
    return null;
  }, n.getPublicRootInstance = function(r) {
    if (r = r.current, !r.child) return null;
    switch (r.child.tag) {
      case 5:
        return Je(r.child.stateNode);
      default:
        return r.child.stateNode;
    }
  }, n.injectIntoDevTools = function(r) {
    if (r = { bundleType: r.bundleType, version: r.version, rendererPackageName: r.rendererPackageName, rendererConfig: r.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: d.ReactCurrentDispatcher, findHostInstanceByFiber: G1, findFiberByHostInstance: r.findFiberByHostInstance || K1, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.0.0-fc46dba67-20220329" }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") r = !1;
    else {
      var i = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (i.isDisabled || !i.supportsFiber) r = !0;
      else {
        try {
          Ll = i.inject(r), _n = i;
        } catch {
        }
        r = !!i.checkDCE;
      }
    }
    return r;
  }, n.isAlreadyRendering = function() {
    return !1;
  }, n.observeVisibleRects = function(r, i, u, c) {
    if (!ro) throw Error(a(363));
    r = Ua(r, i);
    var f = _0(r, u, c).disconnect;
    return { disconnect: function() {
      f();
    } };
  }, n.registerMutableSourceForHydration = function(r, i) {
    var u = i._getVersion;
    u = u(i._source), r.mutableSourceEagerHydrationData == null ? r.mutableSourceEagerHydrationData = [i, u] : r.mutableSourceEagerHydrationData.push(i, u);
  }, n.runWithPriority = function(r, i) {
    var u = fe;
    try {
      return fe = r, i();
    } finally {
      fe = u;
    }
  }, n.shouldError = function() {
    return null;
  }, n.shouldSuspend = function() {
    return !1;
  }, n.updateContainer = function(r, i, u, c) {
    var f = i.current, h = pt(), x = ir(f);
    return u = Rh(u), i.context === null ? i.context = u : i.pendingContext = u, i = Dn(h, x), i.payload = { element: r }, c = c === void 0 ? null : c, c !== null && (i.callback = c), tr(f, i), r = qt(f, x, h), r !== null && Ol(r, f, x), x;
  }, n;
};
Uv.exports = fE;
var dE = Uv.exports;
const pE = /* @__PURE__ */ NS(dE), Ud = {}, hE = (e) => void Object.assign(Ud, e);
function mE(e, t) {
  function n(g, {
    args: y = [],
    attach: v,
    ..._
  }, k) {
    let R = `${g[0].toUpperCase()}${g.slice(1)}`, A;
    if (g === "primitive") {
      if (_.object === void 0) throw new Error("R3F: Primitives without 'object' are invalid!");
      const w = _.object;
      A = Ei(w, {
        type: g,
        root: k,
        attach: v,
        primitive: !0
      });
    } else {
      const w = Ud[R];
      if (!w)
        throw new Error(`R3F: ${R} is not part of the THREE namespace! Did you forget to extend? See: https://docs.pmnd.rs/react-three-fiber/api/objects#using-3rd-party-objects-declaratively`);
      if (!Array.isArray(y)) throw new Error("R3F: The args prop must be an array!");
      A = Ei(new w(...y), {
        type: g,
        root: k,
        attach: v,
        // Save args in case we need to reconstruct later for HMR
        memoizedProps: {
          args: y
        }
      });
    }
    return A.__r3f.attach === void 0 && (A.isBufferGeometry ? A.__r3f.attach = "geometry" : A.isMaterial && (A.__r3f.attach = "material")), R !== "inject" && Lc(A, _), A;
  }
  function o(g, y) {
    let v = !1;
    if (y) {
      var _, k;
      (_ = y.__r3f) != null && _.attach ? Ac(g, y, y.__r3f.attach) : y.isObject3D && g.isObject3D && (g.add(y), v = !0), v || (k = g.__r3f) == null || k.objects.push(y), y.__r3f || Ei(y, {}), y.__r3f.parent = g, Wf(y), xi(y);
    }
  }
  function l(g, y, v) {
    let _ = !1;
    if (y) {
      var k, R;
      if ((k = y.__r3f) != null && k.attach)
        Ac(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        y.parent = g, y.dispatchEvent({
          type: "added"
        }), g.dispatchEvent({
          type: "childadded",
          child: y
        });
        const A = g.children.filter((S) => S !== y), w = A.indexOf(v);
        g.children = [...A.slice(0, w), y, ...A.slice(w)], _ = !0;
      }
      _ || (R = g.__r3f) == null || R.objects.push(y), y.__r3f || Ei(y, {}), y.__r3f.parent = g, Wf(y), xi(y);
    }
  }
  function s(g, y, v = !1) {
    g && [...g].forEach((_) => a(y, _, v));
  }
  function a(g, y, v) {
    if (y) {
      var _, k, R;
      if (y.__r3f && (y.__r3f.parent = null), (_ = g.__r3f) != null && _.objects && (g.__r3f.objects = g.__r3f.objects.filter((C) => C !== y)), (k = y.__r3f) != null && k.attach)
        Jm(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        var A;
        g.remove(y), (A = y.__r3f) != null && A.root && xE(qs(y), y);
      }
      const S = (R = y.__r3f) == null ? void 0 : R.primitive, E = !S && (v === void 0 ? y.dispose !== null : v);
      if (!S) {
        var w;
        s((w = y.__r3f) == null ? void 0 : w.objects, y, E), s(y.children, y, E);
      }
      if (delete y.__r3f, E && y.dispose && y.type !== "Scene") {
        const C = () => {
          try {
            y.dispose();
          } catch {
          }
        };
        typeof IS_REACT_ACT_ENVIRONMENT > "u" ? Hf.unstable_scheduleCallback(Hf.unstable_IdlePriority, C) : C();
      }
      xi(g);
    }
  }
  function d(g, y, v, _) {
    var k;
    const R = (k = g.__r3f) == null ? void 0 : k.parent;
    if (!R) return;
    const A = n(y, v, g.__r3f.root);
    if (g.children) {
      for (const w of g.children)
        w.__r3f && o(A, w);
      g.children = g.children.filter((w) => !w.__r3f);
    }
    g.__r3f.objects.forEach((w) => o(A, w)), g.__r3f.objects = [], g.__r3f.autoRemovedBeforeAppend || a(R, g), A.parent && (A.__r3f.autoRemovedBeforeAppend = !0), o(R, A), A.raycast && A.__r3f.eventCount && qs(A).getState().internal.interaction.push(A), [_, _.alternate].forEach((w) => {
      w !== null && (w.stateNode = A, w.ref && (typeof w.ref == "function" ? w.ref(A) : w.ref.current = A));
    });
  }
  const p = () => {
  };
  return {
    reconciler: pE({
      createInstance: n,
      removeChild: a,
      appendChild: o,
      appendInitialChild: o,
      insertBefore: l,
      supportsMutation: !0,
      isPrimaryRenderer: !1,
      supportsPersistence: !1,
      supportsHydration: !1,
      noTimeout: -1,
      appendChildToContainer: (g, y) => {
        if (!y) return;
        const v = g.getState().scene;
        v.__r3f && (v.__r3f.root = g, o(v, y));
      },
      removeChildFromContainer: (g, y) => {
        y && a(g.getState().scene, y);
      },
      insertInContainerBefore: (g, y, v) => {
        if (!y || !v) return;
        const _ = g.getState().scene;
        _.__r3f && l(_, y, v);
      },
      getRootHostContext: () => null,
      getChildHostContext: (g) => g,
      finalizeInitialChildren(g) {
        var y;
        return !!((y = g == null ? void 0 : g.__r3f) != null ? y : {}).handlers;
      },
      prepareUpdate(g, y, v, _) {
        var k;
        if (((k = g == null ? void 0 : g.__r3f) != null ? k : {}).primitive && _.object && _.object !== g)
          return [!0];
        {
          const {
            args: A = [],
            children: w,
            ...S
          } = _, {
            args: E = [],
            children: C,
            ...I
          } = v;
          if (!Array.isArray(A)) throw new Error("R3F: the args prop must be an array!");
          if (A.some((D, H) => D !== E[H])) return [!0];
          const O = Yv(g, S, I, !0);
          return O.changes.length ? [!1, O] : null;
        }
      },
      commitUpdate(g, [y, v], _, k, R, A) {
        y ? d(g, _, R, A) : Lc(g, v);
      },
      commitMount(g, y, v, _) {
        var k;
        const R = (k = g.__r3f) != null ? k : {};
        g.raycast && R.handlers && R.eventCount && qs(g).getState().internal.interaction.push(g);
      },
      getPublicInstance: (g) => g,
      prepareForCommit: () => null,
      preparePortalMount: (g) => Ei(g.getState().scene),
      resetAfterCommit: () => {
      },
      shouldSetTextContent: () => !1,
      clearContainer: () => !1,
      hideInstance(g) {
        var y;
        const {
          attach: v,
          parent: _
        } = (y = g.__r3f) != null ? y : {};
        v && _ && Jm(_, g, v), g.isObject3D && (g.visible = !1), xi(g);
      },
      unhideInstance(g, y) {
        var v;
        const {
          attach: _,
          parent: k
        } = (v = g.__r3f) != null ? v : {};
        _ && k && Ac(k, g, _), (g.isObject3D && y.visible == null || y.visible) && (g.visible = !0), xi(g);
      },
      createTextInstance: p,
      hideTextInstance: p,
      unhideTextInstance: p,
      // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r916356874
      // @ts-expect-error
      getCurrentEventPriority: () => t ? t() : ji.DefaultEventPriority,
      beforeActiveInstanceBlur: () => {
      },
      afterActiveInstanceBlur: () => {
      },
      detachDeletedInstance: () => {
      },
      now: typeof performance < "u" && _e.fun(performance.now) ? performance.now : _e.fun(Date.now) ? Date.now : () => 0,
      // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r920883503
      scheduleTimeout: _e.fun(setTimeout) ? setTimeout : void 0,
      cancelTimeout: _e.fun(clearTimeout) ? clearTimeout : void 0
    }),
    applyProps: Lc
  };
}
var Qm, Xm;
const Rc = (e) => "colorSpace" in e || "outputColorSpace" in e, Wv = () => {
  var e;
  return (e = Ud.ColorManagement) != null ? e : null;
}, Vv = (e) => e && e.isOrthographicCamera, gE = (e) => e && e.hasOwnProperty("current"), El = typeof window < "u" && ((Qm = window.document) != null && Qm.createElement || ((Xm = window.navigator) == null ? void 0 : Xm.product) === "ReactNative") ? Q.useLayoutEffect : Q.useEffect;
function Gv(e) {
  const t = Q.useRef(e);
  return El(() => void (t.current = e), [e]), t;
}
function yE({
  set: e
}) {
  return El(() => (e(new Promise(() => null)), () => e(!1)), [e]), null;
}
class Kv extends Q.Component {
  constructor(...t) {
    super(...t), this.state = {
      error: !1
    };
  }
  componentDidCatch(t) {
    this.props.set(t);
  }
  render() {
    return this.state.error ? null : this.props.children;
  }
}
Kv.getDerivedStateFromError = () => ({
  error: !0
});
const Qv = "__default", Ym = /* @__PURE__ */ new Map(), vE = (e) => e && !!e.memoized && !!e.changes;
function Xv(e) {
  var t;
  const n = typeof window < "u" ? (t = window.devicePixelRatio) != null ? t : 2 : 1;
  return Array.isArray(e) ? Math.min(Math.max(e[0], n), e[1]) : e;
}
const Oo = (e) => {
  var t;
  return (t = e.__r3f) == null ? void 0 : t.root.getState();
};
function qs(e) {
  let t = e.__r3f.root;
  for (; t.getState().previousRoot; ) t = t.getState().previousRoot;
  return t;
}
const _e = {
  obj: (e) => e === Object(e) && !_e.arr(e) && typeof e != "function",
  fun: (e) => typeof e == "function",
  str: (e) => typeof e == "string",
  num: (e) => typeof e == "number",
  boo: (e) => typeof e == "boolean",
  und: (e) => e === void 0,
  arr: (e) => Array.isArray(e),
  equ(e, t, {
    arrays: n = "shallow",
    objects: o = "reference",
    strict: l = !0
  } = {}) {
    if (typeof e != typeof t || !!e != !!t) return !1;
    if (_e.str(e) || _e.num(e) || _e.boo(e)) return e === t;
    const s = _e.obj(e);
    if (s && o === "reference") return e === t;
    const a = _e.arr(e);
    if (a && n === "reference") return e === t;
    if ((a || s) && e === t) return !0;
    let d;
    for (d in e) if (!(d in t)) return !1;
    if (s && n === "shallow" && o === "shallow") {
      for (d in l ? t : e) if (!_e.equ(e[d], t[d], {
        strict: l,
        objects: "reference"
      })) return !1;
    } else
      for (d in l ? t : e) if (e[d] !== t[d]) return !1;
    if (_e.und(d)) {
      if (a && e.length === 0 && t.length === 0 || s && Object.keys(e).length === 0 && Object.keys(t).length === 0) return !0;
      if (e !== t) return !1;
    }
    return !0;
  }
};
function SE(e) {
  const t = {
    nodes: {},
    materials: {}
  };
  return e && e.traverse((n) => {
    n.name && (t.nodes[n.name] = n), n.material && !t.materials[n.material.name] && (t.materials[n.material.name] = n.material);
  }), t;
}
function wE(e) {
  e.dispose && e.type !== "Scene" && e.dispose();
  for (const t in e)
    t.dispose == null || t.dispose(), delete e[t];
}
function Ei(e, t) {
  const n = e;
  return n.__r3f = {
    type: "",
    root: null,
    previousAttach: null,
    memoizedProps: {},
    eventCount: 0,
    handlers: {},
    objects: [],
    parent: null,
    ...t
  }, e;
}
function Bf(e, t) {
  let n = e;
  if (t.includes("-")) {
    const o = t.split("-"), l = o.pop();
    return n = o.reduce((s, a) => s[a], e), {
      target: n,
      key: l
    };
  } else return {
    target: n,
    key: t
  };
}
const Zm = /-\d+$/;
function Ac(e, t, n) {
  if (_e.str(n)) {
    if (Zm.test(n)) {
      const s = n.replace(Zm, ""), {
        target: a,
        key: d
      } = Bf(e, s);
      Array.isArray(a[d]) || (a[d] = []);
    }
    const {
      target: o,
      key: l
    } = Bf(e, n);
    t.__r3f.previousAttach = o[l], o[l] = t;
  } else t.__r3f.previousAttach = n(e, t);
}
function Jm(e, t, n) {
  var o, l;
  if (_e.str(n)) {
    const {
      target: s,
      key: a
    } = Bf(e, n), d = t.__r3f.previousAttach;
    d === void 0 ? delete s[a] : s[a] = d;
  } else (o = t.__r3f) == null || o.previousAttach == null || o.previousAttach(e, t);
  (l = t.__r3f) == null || delete l.previousAttach;
}
function Yv(e, {
  children: t,
  key: n,
  ref: o,
  ...l
}, {
  children: s,
  key: a,
  ref: d,
  ...p
} = {}, m = !1) {
  const g = e.__r3f, y = Object.entries(l), v = [];
  if (m) {
    const k = Object.keys(p);
    for (let R = 0; R < k.length; R++)
      l.hasOwnProperty(k[R]) || y.unshift([k[R], Qv + "remove"]);
  }
  y.forEach(([k, R]) => {
    var A;
    if ((A = e.__r3f) != null && A.primitive && k === "object" || _e.equ(R, p[k])) return;
    if (/^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/.test(k)) return v.push([k, R, !0, []]);
    let w = [];
    k.includes("-") && (w = k.split("-")), v.push([k, R, !1, w]);
    for (const S in l) {
      const E = l[S];
      S.startsWith(`${k}-`) && v.push([S, E, !1, S.split("-")]);
    }
  });
  const _ = {
    ...l
  };
  return g != null && g.memoizedProps && g != null && g.memoizedProps.args && (_.args = g.memoizedProps.args), g != null && g.memoizedProps && g != null && g.memoizedProps.attach && (_.attach = g.memoizedProps.attach), {
    memoized: _,
    changes: v
  };
}
function Lc(e, t) {
  var n;
  const o = e.__r3f, l = o == null ? void 0 : o.root, s = l == null || l.getState == null ? void 0 : l.getState(), {
    memoized: a,
    changes: d
  } = vE(t) ? t : Yv(e, t), p = o == null ? void 0 : o.eventCount;
  e.__r3f && (e.__r3f.memoizedProps = a);
  for (let v = 0; v < d.length; v++) {
    let [_, k, R, A] = d[v];
    if (Rc(e)) {
      const C = "srgb", I = "srgb-linear";
      _ === "encoding" ? (_ = "colorSpace", k = k === 3001 ? C : I) : _ === "outputEncoding" && (_ = "outputColorSpace", k = k === 3001 ? C : I);
    }
    let w = e, S = w[_];
    if (A.length && (S = A.reduce((E, C) => E[C], e), !(S && S.set))) {
      const [E, ...C] = A.reverse();
      w = C.reverse().reduce((I, O) => I[O], e), _ = E;
    }
    if (k === Qv + "remove")
      if (w.constructor) {
        let E = Ym.get(w.constructor);
        E || (E = new w.constructor(), Ym.set(w.constructor, E)), k = E[_];
      } else
        k = 0;
    if (R && o)
      k ? o.handlers[_] = k : delete o.handlers[_], o.eventCount = Object.keys(o.handlers).length;
    else if (S && S.set && (S.copy || S instanceof he.Layers)) {
      if (Array.isArray(k))
        S.fromArray ? S.fromArray(k) : S.set(...k);
      else if (S.copy && k && k.constructor && // Some environments may break strict identity checks by duplicating versions of three.js.
      // Loosen to unminified names, ignoring descendents.
      // https://github.com/pmndrs/react-three-fiber/issues/2856
      // TODO: fix upstream and remove in v9
      S.constructor === k.constructor)
        S.copy(k);
      else if (k !== void 0) {
        var m;
        const E = (m = S) == null ? void 0 : m.isColor;
        !E && S.setScalar ? S.setScalar(k) : S instanceof he.Layers && k instanceof he.Layers ? S.mask = k.mask : S.set(k), !Wv() && s && !s.linear && E && S.convertSRGBToLinear();
      }
    } else {
      var g;
      if (w[_] = k, (g = w[_]) != null && g.isTexture && // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
      w[_].format === he.RGBAFormat && w[_].type === he.UnsignedByteType && s) {
        const E = w[_];
        Rc(E) && Rc(s.gl) ? E.colorSpace = s.gl.outputColorSpace : E.encoding = s.gl.outputEncoding;
      }
    }
    xi(e);
  }
  if (o && o.parent && e.raycast && p !== o.eventCount) {
    const v = qs(e).getState().internal, _ = v.interaction.indexOf(e);
    _ > -1 && v.interaction.splice(_, 1), o.eventCount && v.interaction.push(e);
  }
  return !(d.length === 1 && d[0][0] === "onUpdate") && d.length && (n = e.__r3f) != null && n.parent && Wf(e), e;
}
function xi(e) {
  var t, n;
  const o = (t = e.__r3f) == null || (n = t.root) == null || n.getState == null ? void 0 : n.getState();
  o && o.internal.frames === 0 && o.invalidate();
}
function Wf(e) {
  e.onUpdate == null || e.onUpdate(e);
}
function _E(e, t) {
  e.manual || (Vv(e) ? (e.left = t.width / -2, e.right = t.width / 2, e.top = t.height / 2, e.bottom = t.height / -2) : e.aspect = t.width / t.height, e.updateProjectionMatrix(), e.updateMatrixWorld());
}
function Ds(e) {
  return (e.eventObject || e.object).uuid + "/" + e.index + e.instanceId;
}
function EE() {
  var e;
  const t = typeof self < "u" && self || typeof window < "u" && window;
  if (!t) return ji.DefaultEventPriority;
  switch ((e = t.event) == null ? void 0 : e.type) {
    case "click":
    case "contextmenu":
    case "dblclick":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
      return ji.DiscreteEventPriority;
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "pointerenter":
    case "pointerleave":
    case "wheel":
      return ji.ContinuousEventPriority;
    default:
      return ji.DefaultEventPriority;
  }
}
function Zv(e, t, n, o) {
  const l = n.get(t);
  l && (n.delete(t), n.size === 0 && (e.delete(o), l.target.releasePointerCapture(o)));
}
function xE(e, t) {
  const {
    internal: n
  } = e.getState();
  n.interaction = n.interaction.filter((o) => o !== t), n.initialHits = n.initialHits.filter((o) => o !== t), n.hovered.forEach((o, l) => {
    (o.eventObject === t || o.object === t) && n.hovered.delete(l);
  }), n.capturedMap.forEach((o, l) => {
    Zv(n.capturedMap, t, o, l);
  });
}
function kE(e) {
  function t(p) {
    const {
      internal: m
    } = e.getState(), g = p.offsetX - m.initialClick[0], y = p.offsetY - m.initialClick[1];
    return Math.round(Math.sqrt(g * g + y * y));
  }
  function n(p) {
    return p.filter((m) => ["Move", "Over", "Enter", "Out", "Leave"].some((g) => {
      var y;
      return (y = m.__r3f) == null ? void 0 : y.handlers["onPointer" + g];
    }));
  }
  function o(p, m) {
    const g = e.getState(), y = /* @__PURE__ */ new Set(), v = [], _ = m ? m(g.internal.interaction) : g.internal.interaction;
    for (let w = 0; w < _.length; w++) {
      const S = Oo(_[w]);
      S && (S.raycaster.camera = void 0);
    }
    g.previousRoot || g.events.compute == null || g.events.compute(p, g);
    function k(w) {
      const S = Oo(w);
      if (!S || !S.events.enabled || S.raycaster.camera === null) return [];
      if (S.raycaster.camera === void 0) {
        var E;
        S.events.compute == null || S.events.compute(p, S, (E = S.previousRoot) == null ? void 0 : E.getState()), S.raycaster.camera === void 0 && (S.raycaster.camera = null);
      }
      return S.raycaster.camera ? S.raycaster.intersectObject(w, !0) : [];
    }
    let R = _.flatMap(k).sort((w, S) => {
      const E = Oo(w.object), C = Oo(S.object);
      return !E || !C ? w.distance - S.distance : C.events.priority - E.events.priority || w.distance - S.distance;
    }).filter((w) => {
      const S = Ds(w);
      return y.has(S) ? !1 : (y.add(S), !0);
    });
    g.events.filter && (R = g.events.filter(R, g));
    for (const w of R) {
      let S = w.object;
      for (; S; ) {
        var A;
        (A = S.__r3f) != null && A.eventCount && v.push({
          ...w,
          eventObject: S
        }), S = S.parent;
      }
    }
    if ("pointerId" in p && g.internal.capturedMap.has(p.pointerId))
      for (let w of g.internal.capturedMap.get(p.pointerId).values())
        y.has(Ds(w.intersection)) || v.push(w.intersection);
    return v;
  }
  function l(p, m, g, y) {
    const v = e.getState();
    if (p.length) {
      const _ = {
        stopped: !1
      };
      for (const k of p) {
        const R = Oo(k.object) || v, {
          raycaster: A,
          pointer: w,
          camera: S,
          internal: E
        } = R, C = new he.Vector3(w.x, w.y, 0).unproject(S), I = (W) => {
          var G, le;
          return (G = (le = E.capturedMap.get(W)) == null ? void 0 : le.has(k.eventObject)) != null ? G : !1;
        }, O = (W) => {
          const G = {
            intersection: k,
            target: m.target
          };
          E.capturedMap.has(W) ? E.capturedMap.get(W).set(k.eventObject, G) : E.capturedMap.set(W, /* @__PURE__ */ new Map([[k.eventObject, G]])), m.target.setPointerCapture(W);
        }, D = (W) => {
          const G = E.capturedMap.get(W);
          G && Zv(E.capturedMap, k.eventObject, G, W);
        };
        let H = {};
        for (let W in m) {
          let G = m[W];
          typeof G != "function" && (H[W] = G);
        }
        let J = {
          ...k,
          ...H,
          pointer: w,
          intersections: p,
          stopped: _.stopped,
          delta: g,
          unprojectedPoint: C,
          ray: A.ray,
          camera: S,
          // Hijack stopPropagation, which just sets a flag
          stopPropagation() {
            const W = "pointerId" in m && E.capturedMap.get(m.pointerId);
            if (
              // ...if this pointer hasn't been captured
              (!W || // ... or if the hit object is capturing the pointer
              W.has(k.eventObject)) && (J.stopped = _.stopped = !0, E.hovered.size && Array.from(E.hovered.values()).find((G) => G.eventObject === k.eventObject))
            ) {
              const G = p.slice(0, p.indexOf(k));
              s([...G, k]);
            }
          },
          // there should be a distinction between target and currentTarget
          target: {
            hasPointerCapture: I,
            setPointerCapture: O,
            releasePointerCapture: D
          },
          currentTarget: {
            hasPointerCapture: I,
            setPointerCapture: O,
            releasePointerCapture: D
          },
          nativeEvent: m
        };
        if (y(J), _.stopped === !0) break;
      }
    }
    return p;
  }
  function s(p) {
    const {
      internal: m
    } = e.getState();
    for (const g of m.hovered.values())
      if (!p.length || !p.find((y) => y.object === g.object && y.index === g.index && y.instanceId === g.instanceId)) {
        const v = g.eventObject.__r3f, _ = v == null ? void 0 : v.handlers;
        if (m.hovered.delete(Ds(g)), v != null && v.eventCount) {
          const k = {
            ...g,
            intersections: p
          };
          _.onPointerOut == null || _.onPointerOut(k), _.onPointerLeave == null || _.onPointerLeave(k);
        }
      }
  }
  function a(p, m) {
    for (let g = 0; g < m.length; g++) {
      const y = m[g].__r3f;
      y == null || y.handlers.onPointerMissed == null || y.handlers.onPointerMissed(p);
    }
  }
  function d(p) {
    switch (p) {
      case "onPointerLeave":
      case "onPointerCancel":
        return () => s([]);
      case "onLostPointerCapture":
        return (m) => {
          const {
            internal: g
          } = e.getState();
          "pointerId" in m && g.capturedMap.has(m.pointerId) && requestAnimationFrame(() => {
            g.capturedMap.has(m.pointerId) && (g.capturedMap.delete(m.pointerId), s([]));
          });
        };
    }
    return function(g) {
      const {
        onPointerMissed: y,
        internal: v
      } = e.getState();
      v.lastEvent.current = g;
      const _ = p === "onPointerMove", k = p === "onClick" || p === "onContextMenu" || p === "onDoubleClick", A = o(g, _ ? n : void 0), w = k ? t(g) : 0;
      p === "onPointerDown" && (v.initialClick = [g.offsetX, g.offsetY], v.initialHits = A.map((E) => E.eventObject)), k && !A.length && w <= 2 && (a(g, v.interaction), y && y(g)), _ && s(A);
      function S(E) {
        const C = E.eventObject, I = C.__r3f, O = I == null ? void 0 : I.handlers;
        if (I != null && I.eventCount)
          if (_) {
            if (O.onPointerOver || O.onPointerEnter || O.onPointerOut || O.onPointerLeave) {
              const D = Ds(E), H = v.hovered.get(D);
              H ? H.stopped && E.stopPropagation() : (v.hovered.set(D, E), O.onPointerOver == null || O.onPointerOver(E), O.onPointerEnter == null || O.onPointerEnter(E));
            }
            O.onPointerMove == null || O.onPointerMove(E);
          } else {
            const D = O[p];
            D ? (!k || v.initialHits.includes(C)) && (a(g, v.interaction.filter((H) => !v.initialHits.includes(H))), D(E)) : k && v.initialHits.includes(C) && a(g, v.interaction.filter((H) => !v.initialHits.includes(H)));
          }
      }
      l(A, g, w, S);
    };
  }
  return {
    handlePointer: d
  };
}
const Jv = (e) => !!(e != null && e.render), qv = /* @__PURE__ */ Q.createContext(null), TE = (e, t) => {
  const n = lE((d, p) => {
    const m = new he.Vector3(), g = new he.Vector3(), y = new he.Vector3();
    function v(w = p().camera, S = g, E = p().size) {
      const {
        width: C,
        height: I,
        top: O,
        left: D
      } = E, H = C / I;
      S.isVector3 ? y.copy(S) : y.set(...S);
      const J = w.getWorldPosition(m).distanceTo(y);
      if (Vv(w))
        return {
          width: C / w.zoom,
          height: I / w.zoom,
          top: O,
          left: D,
          factor: 1,
          distance: J,
          aspect: H
        };
      {
        const W = w.fov * Math.PI / 180, G = 2 * Math.tan(W / 2) * J, le = G * (C / I);
        return {
          width: le,
          height: G,
          top: O,
          left: D,
          factor: C / le,
          distance: J,
          aspect: H
        };
      }
    }
    let _;
    const k = (w) => d((S) => ({
      performance: {
        ...S.performance,
        current: w
      }
    })), R = new he.Vector2();
    return {
      set: d,
      get: p,
      // Mock objects that have to be configured
      gl: null,
      camera: null,
      raycaster: null,
      events: {
        priority: 1,
        enabled: !0,
        connected: !1
      },
      xr: null,
      scene: null,
      invalidate: (w = 1) => e(p(), w),
      advance: (w, S) => t(w, S, p()),
      legacy: !1,
      linear: !1,
      flat: !1,
      controls: null,
      clock: new he.Clock(),
      pointer: R,
      mouse: R,
      frameloop: "always",
      onPointerMissed: void 0,
      performance: {
        current: 1,
        min: 0.5,
        max: 1,
        debounce: 200,
        regress: () => {
          const w = p();
          _ && clearTimeout(_), w.performance.current !== w.performance.min && k(w.performance.min), _ = setTimeout(() => k(p().performance.max), w.performance.debounce);
        }
      },
      size: {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        updateStyle: !1
      },
      viewport: {
        initialDpr: 0,
        dpr: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        aspect: 0,
        distance: 0,
        factor: 0,
        getCurrentViewport: v
      },
      setEvents: (w) => d((S) => ({
        ...S,
        events: {
          ...S.events,
          ...w
        }
      })),
      setSize: (w, S, E, C, I) => {
        const O = p().camera, D = {
          width: w,
          height: S,
          top: C || 0,
          left: I || 0,
          updateStyle: E
        };
        d((H) => ({
          size: D,
          viewport: {
            ...H.viewport,
            ...v(O, g, D)
          }
        }));
      },
      setDpr: (w) => d((S) => {
        const E = Xv(w);
        return {
          viewport: {
            ...S.viewport,
            dpr: E,
            initialDpr: S.viewport.initialDpr || E
          }
        };
      }),
      setFrameloop: (w = "always") => {
        const S = p().clock;
        S.stop(), S.elapsedTime = 0, w !== "never" && (S.start(), S.elapsedTime = 0), d(() => ({
          frameloop: w
        }));
      },
      previousRoot: void 0,
      internal: {
        active: !1,
        priority: 0,
        frames: 0,
        lastEvent: /* @__PURE__ */ Q.createRef(),
        interaction: [],
        hovered: /* @__PURE__ */ new Map(),
        subscribers: [],
        initialClick: [0, 0],
        initialHits: [],
        capturedMap: /* @__PURE__ */ new Map(),
        subscribe: (w, S, E) => {
          const C = p().internal;
          return C.priority = C.priority + (S > 0 ? 1 : 0), C.subscribers.push({
            ref: w,
            priority: S,
            store: E
          }), C.subscribers = C.subscribers.sort((I, O) => I.priority - O.priority), () => {
            const I = p().internal;
            I != null && I.subscribers && (I.priority = I.priority - (S > 0 ? 1 : 0), I.subscribers = I.subscribers.filter((O) => O.ref !== w));
          };
        }
      }
    };
  }), o = n.getState();
  let l = o.size, s = o.viewport.dpr, a = o.camera;
  return n.subscribe(() => {
    const {
      camera: d,
      size: p,
      viewport: m,
      gl: g,
      set: y
    } = n.getState();
    if (p.width !== l.width || p.height !== l.height || m.dpr !== s) {
      var v;
      l = p, s = m.dpr, _E(d, p), g.setPixelRatio(m.dpr);
      const _ = (v = p.updateStyle) != null ? v : typeof HTMLCanvasElement < "u" && g.domElement instanceof HTMLCanvasElement;
      g.setSize(p.width, p.height, _);
    }
    d !== a && (a = d, y((_) => ({
      viewport: {
        ..._.viewport,
        ..._.viewport.getCurrentViewport(d)
      }
    })));
  }), n.subscribe((d) => e(d)), n;
};
let js, PE = /* @__PURE__ */ new Set(), CE = /* @__PURE__ */ new Set(), RE = /* @__PURE__ */ new Set();
function Nc(e, t) {
  if (e.size)
    for (const {
      callback: n
    } of e.values())
      n(t);
}
function Do(e, t) {
  switch (e) {
    case "before":
      return Nc(PE, t);
    case "after":
      return Nc(CE, t);
    case "tail":
      return Nc(RE, t);
  }
}
let Mc, zc;
function Ic(e, t, n) {
  let o = t.clock.getDelta();
  for (t.frameloop === "never" && typeof e == "number" && (o = e - t.clock.elapsedTime, t.clock.oldTime = t.clock.elapsedTime, t.clock.elapsedTime = e), Mc = t.internal.subscribers, js = 0; js < Mc.length; js++)
    zc = Mc[js], zc.ref.current(zc.store.getState(), o, n);
  return !t.internal.priority && t.gl.render && t.gl.render(t.scene, t.camera), t.internal.frames = Math.max(0, t.internal.frames - 1), t.frameloop === "always" ? 1 : t.internal.frames;
}
function AE(e) {
  let t = !1, n = !1, o, l, s;
  function a(m) {
    l = requestAnimationFrame(a), t = !0, o = 0, Do("before", m), n = !0;
    for (const y of e.values()) {
      var g;
      s = y.store.getState(), s.internal.active && (s.frameloop === "always" || s.internal.frames > 0) && !((g = s.gl.xr) != null && g.isPresenting) && (o += Ic(m, s));
    }
    if (n = !1, Do("after", m), o === 0)
      return Do("tail", m), t = !1, cancelAnimationFrame(l);
  }
  function d(m, g = 1) {
    var y;
    if (!m) return e.forEach((v) => d(v.store.getState(), g));
    (y = m.gl.xr) != null && y.isPresenting || !m.internal.active || m.frameloop === "never" || (g > 1 ? m.internal.frames = Math.min(60, m.internal.frames + g) : n ? m.internal.frames = 2 : m.internal.frames = 1, t || (t = !0, requestAnimationFrame(a)));
  }
  function p(m, g = !0, y, v) {
    if (g && Do("before", m), y) Ic(m, y, v);
    else for (const _ of e.values()) Ic(m, _.store.getState());
    g && Do("after", m);
  }
  return {
    loop: a,
    invalidate: d,
    advance: p
  };
}
function $v() {
  const e = Q.useContext(qv);
  if (!e) throw new Error("R3F: Hooks can only be used within the Canvas component!");
  return e;
}
function LE(e = (n) => n, t) {
  return $v()(e, t);
}
function Vu(e, t = 0) {
  const n = $v(), o = n.getState().internal.subscribe, l = Gv(e);
  return El(() => o(l, t, n), [t, o, n]), null;
}
const qm = /* @__PURE__ */ new WeakMap();
function bv(e, t) {
  return function(n, ...o) {
    let l = qm.get(n);
    return l || (l = new n(), qm.set(n, l)), e && e(l), Promise.all(o.map((s) => new Promise((a, d) => l.load(s, (p) => {
      p.scene && Object.assign(p, SE(p.scene)), a(p);
    }, t, (p) => d(new Error(`Could not load ${s}: ${p == null ? void 0 : p.message}`))))));
  };
}
function Hd(e, t, n, o) {
  const l = Array.isArray(t) ? t : [t], s = uE(bv(n, o), [e, ...l], {
    equal: _e.equ
  });
  return Array.isArray(t) ? s : s[0];
}
Hd.preload = function(e, t, n) {
  const o = Array.isArray(t) ? t : [t];
  return aE(bv(n), [e, ...o]);
};
Hd.clear = function(e, t) {
  const n = Array.isArray(t) ? t : [t];
  return cE([e, ...n]);
};
const bi = /* @__PURE__ */ new Map(), {
  invalidate: $m,
  advance: bm
} = AE(bi), {
  reconciler: Tu,
  applyProps: wi
} = mE(bi, EE), _i = {
  objects: "shallow",
  strict: !1
}, NE = (e, t) => {
  const n = typeof e == "function" ? e(t) : e;
  return Jv(n) ? n : new he.WebGLRenderer({
    powerPreference: "high-performance",
    canvas: t,
    antialias: !0,
    alpha: !0,
    ...e
  });
};
function ME(e, t) {
  const n = typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
  if (t) {
    const {
      width: o,
      height: l,
      top: s,
      left: a,
      updateStyle: d = n
    } = t;
    return {
      width: o,
      height: l,
      top: s,
      left: a,
      updateStyle: d
    };
  } else if (typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement && e.parentElement) {
    const {
      width: o,
      height: l,
      top: s,
      left: a
    } = e.parentElement.getBoundingClientRect();
    return {
      width: o,
      height: l,
      top: s,
      left: a,
      updateStyle: n
    };
  } else if (typeof OffscreenCanvas < "u" && e instanceof OffscreenCanvas)
    return {
      width: e.width,
      height: e.height,
      top: 0,
      left: 0,
      updateStyle: n
    };
  return {
    width: 0,
    height: 0,
    top: 0,
    left: 0
  };
}
function zE(e) {
  const t = bi.get(e), n = t == null ? void 0 : t.fiber, o = t == null ? void 0 : t.store;
  t && console.warn("R3F.createRoot should only be called once!");
  const l = typeof reportError == "function" ? (
    // In modern browsers, reportError will dispatch an error event,
    // emulating an uncaught JavaScript error.
    reportError
  ) : (
    // In older browsers and test environments, fallback to console.error.
    console.error
  ), s = o || TE($m, bm), a = n || Tu.createContainer(s, ji.ConcurrentRoot, null, !1, null, "", l, null);
  t || bi.set(e, {
    fiber: a,
    store: s
  });
  let d, p = !1, m;
  return {
    configure(g = {}) {
      let {
        gl: y,
        size: v,
        scene: _,
        events: k,
        onCreated: R,
        shadows: A = !1,
        linear: w = !1,
        flat: S = !1,
        legacy: E = !1,
        orthographic: C = !1,
        frameloop: I = "always",
        dpr: O = [1, 2],
        performance: D,
        raycaster: H,
        camera: J,
        onPointerMissed: W
      } = g, G = s.getState(), le = G.gl;
      G.gl || G.set({
        gl: le = NE(y, e)
      });
      let ve = G.raycaster;
      ve || G.set({
        raycaster: ve = new he.Raycaster()
      });
      const {
        params: vt,
        ...Mt
      } = H || {};
      if (_e.equ(Mt, ve, _i) || wi(ve, {
        ...Mt
      }), _e.equ(vt, ve.params, _i) || wi(ve, {
        params: {
          ...ve.params,
          ...vt
        }
      }), !G.camera || G.camera === m && !_e.equ(m, J, _i)) {
        m = J;
        const j = J instanceof he.Camera, X = j ? J : C ? new he.OrthographicCamera(0, 0, 0, 0, 0.1, 1e3) : new he.PerspectiveCamera(75, 0, 0.1, 1e3);
        j || (X.position.z = 5, J && (wi(X, J), ("aspect" in J || "left" in J || "right" in J || "bottom" in J || "top" in J) && (X.manual = !0, X.updateProjectionMatrix())), !G.camera && !(J != null && J.rotation) && X.lookAt(0, 0, 0)), G.set({
          camera: X
        }), ve.camera = X;
      }
      if (!G.scene) {
        let j;
        _ != null && _.isScene ? j = _ : (j = new he.Scene(), _ && wi(j, _)), G.set({
          scene: Ei(j)
        });
      }
      if (!G.xr) {
        var Je;
        const j = (ae, Me) => {
          const tt = s.getState();
          tt.frameloop !== "never" && bm(ae, !0, tt, Me);
        }, X = () => {
          const ae = s.getState();
          ae.gl.xr.enabled = ae.gl.xr.isPresenting, ae.gl.xr.setAnimationLoop(ae.gl.xr.isPresenting ? j : null), ae.gl.xr.isPresenting || $m(ae);
        }, te = {
          connect() {
            const ae = s.getState().gl;
            ae.xr.addEventListener("sessionstart", X), ae.xr.addEventListener("sessionend", X);
          },
          disconnect() {
            const ae = s.getState().gl;
            ae.xr.removeEventListener("sessionstart", X), ae.xr.removeEventListener("sessionend", X);
          }
        };
        typeof ((Je = le.xr) == null ? void 0 : Je.addEventListener) == "function" && te.connect(), G.set({
          xr: te
        });
      }
      if (le.shadowMap) {
        const j = le.shadowMap.enabled, X = le.shadowMap.type;
        if (le.shadowMap.enabled = !!A, _e.boo(A))
          le.shadowMap.type = he.PCFSoftShadowMap;
        else if (_e.str(A)) {
          var St;
          const te = {
            basic: he.BasicShadowMap,
            percentage: he.PCFShadowMap,
            soft: he.PCFSoftShadowMap,
            variance: he.VSMShadowMap
          };
          le.shadowMap.type = (St = te[A]) != null ? St : he.PCFSoftShadowMap;
        } else _e.obj(A) && Object.assign(le.shadowMap, A);
        (j !== le.shadowMap.enabled || X !== le.shadowMap.type) && (le.shadowMap.needsUpdate = !0);
      }
      const N = Wv();
      N && ("enabled" in N ? N.enabled = !E : "legacyMode" in N && (N.legacyMode = E)), p || wi(le, {
        outputEncoding: w ? 3e3 : 3001,
        toneMapping: S ? he.NoToneMapping : he.ACESFilmicToneMapping
      }), G.legacy !== E && G.set(() => ({
        legacy: E
      })), G.linear !== w && G.set(() => ({
        linear: w
      })), G.flat !== S && G.set(() => ({
        flat: S
      })), y && !_e.fun(y) && !Jv(y) && !_e.equ(y, le, _i) && wi(le, y), k && !G.events.handlers && G.set({
        events: k(s)
      });
      const F = ME(e, v);
      return _e.equ(F, G.size, _i) || G.setSize(F.width, F.height, F.updateStyle, F.top, F.left), O && G.viewport.dpr !== Xv(O) && G.setDpr(O), G.frameloop !== I && G.setFrameloop(I), G.onPointerMissed || G.set({
        onPointerMissed: W
      }), D && !_e.equ(D, G.performance, _i) && G.set((j) => ({
        performance: {
          ...j.performance,
          ...D
        }
      })), d = R, p = !0, this;
    },
    render(g) {
      return p || this.configure(), Tu.updateContainer(/* @__PURE__ */ q.jsx(IE, {
        store: s,
        children: g,
        onCreated: d,
        rootElement: e
      }), a, null, () => {
      }), s;
    },
    unmount() {
      e0(e);
    }
  };
}
function IE({
  store: e,
  children: t,
  onCreated: n,
  rootElement: o
}) {
  return El(() => {
    const l = e.getState();
    l.set((s) => ({
      internal: {
        ...s.internal,
        active: !0
      }
    })), n && n(l), e.getState().events.connected || l.events.connect == null || l.events.connect(o);
  }, []), /* @__PURE__ */ q.jsx(qv.Provider, {
    value: e,
    children: t
  });
}
function e0(e, t) {
  const n = bi.get(e), o = n == null ? void 0 : n.fiber;
  if (o) {
    const l = n == null ? void 0 : n.store.getState();
    l && (l.internal.active = !1), Tu.updateContainer(null, o, null, () => {
      l && setTimeout(() => {
        try {
          var s, a, d, p;
          l.events.disconnect == null || l.events.disconnect(), (s = l.gl) == null || (a = s.renderLists) == null || a.dispose == null || a.dispose(), (d = l.gl) == null || d.forceContextLoss == null || d.forceContextLoss(), (p = l.gl) != null && p.xr && l.xr.disconnect(), wE(l), bi.delete(e);
        } catch {
        }
      }, 500);
    });
  }
}
Tu.injectIntoDevTools({
  bundleType: 0,
  rendererPackageName: "@react-three/fiber",
  version: Q.version
});
const Oc = {
  onClick: ["click", !1],
  onContextMenu: ["contextmenu", !1],
  onDoubleClick: ["dblclick", !1],
  onWheel: ["wheel", !0],
  onPointerDown: ["pointerdown", !0],
  onPointerUp: ["pointerup", !0],
  onPointerLeave: ["pointerleave", !0],
  onPointerMove: ["pointermove", !0],
  onPointerCancel: ["pointercancel", !0],
  onLostPointerCapture: ["lostpointercapture", !0]
};
function OE(e) {
  const {
    handlePointer: t
  } = kE(e);
  return {
    priority: 1,
    enabled: !0,
    compute(n, o, l) {
      o.pointer.set(n.offsetX / o.size.width * 2 - 1, -(n.offsetY / o.size.height) * 2 + 1), o.raycaster.setFromCamera(o.pointer, o.camera);
    },
    connected: void 0,
    handlers: Object.keys(Oc).reduce((n, o) => ({
      ...n,
      [o]: t(o)
    }), {}),
    update: () => {
      var n;
      const {
        events: o,
        internal: l
      } = e.getState();
      (n = l.lastEvent) != null && n.current && o.handlers && o.handlers.onPointerMove(l.lastEvent.current);
    },
    connect: (n) => {
      var o;
      const {
        set: l,
        events: s
      } = e.getState();
      s.disconnect == null || s.disconnect(), l((a) => ({
        events: {
          ...a.events,
          connected: n
        }
      })), Object.entries((o = s.handlers) != null ? o : []).forEach(([a, d]) => {
        const [p, m] = Oc[a];
        n.addEventListener(p, d, {
          passive: m
        });
      });
    },
    disconnect: () => {
      const {
        set: n,
        events: o
      } = e.getState();
      if (o.connected) {
        var l;
        Object.entries((l = o.handlers) != null ? l : []).forEach(([s, a]) => {
          if (o && o.connected instanceof HTMLElement) {
            const [d] = Oc[s];
            o.connected.removeEventListener(d, a);
          }
        }), n((s) => ({
          events: {
            ...s.events,
            connected: void 0
          }
        }));
      }
    }
  };
}
function eg(e, t) {
  let n;
  return (...o) => {
    window.clearTimeout(n), n = window.setTimeout(() => e(...o), t);
  };
}
function DE({ debounce: e, scroll: t, polyfill: n, offsetSize: o } = { debounce: 0, scroll: !1, offsetSize: !1 }) {
  const l = n || (typeof window > "u" ? class {
  } : window.ResizeObserver);
  if (!l) throw new Error("This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills");
  const [s, a] = Q.useState({ left: 0, top: 0, width: 0, height: 0, bottom: 0, right: 0, x: 0, y: 0 }), d = Q.useRef({ element: null, scrollContainers: null, resizeObserver: null, lastBounds: s, orientationHandler: null }), p = e ? typeof e == "number" ? e : e.scroll : null, m = e ? typeof e == "number" ? e : e.resize : null, g = Q.useRef(!1);
  Q.useEffect(() => (g.current = !0, () => void (g.current = !1)));
  const [y, v, _] = Q.useMemo(() => {
    const w = () => {
      if (!d.current.element) return;
      const { left: S, top: E, width: C, height: I, bottom: O, right: D, x: H, y: J } = d.current.element.getBoundingClientRect(), W = { left: S, top: E, width: C, height: I, bottom: O, right: D, x: H, y: J };
      d.current.element instanceof HTMLElement && o && (W.height = d.current.element.offsetHeight, W.width = d.current.element.offsetWidth), Object.freeze(W), g.current && !HE(d.current.lastBounds, W) && a(d.current.lastBounds = W);
    };
    return [w, m ? eg(w, m) : w, p ? eg(w, p) : w];
  }, [a, o, p, m]);
  function k() {
    d.current.scrollContainers && (d.current.scrollContainers.forEach((w) => w.removeEventListener("scroll", _, !0)), d.current.scrollContainers = null), d.current.resizeObserver && (d.current.resizeObserver.disconnect(), d.current.resizeObserver = null), d.current.orientationHandler && ("orientation" in screen && "removeEventListener" in screen.orientation ? screen.orientation.removeEventListener("change", d.current.orientationHandler) : "onorientationchange" in window && window.removeEventListener("orientationchange", d.current.orientationHandler));
  }
  function R() {
    d.current.element && (d.current.resizeObserver = new l(_), d.current.resizeObserver.observe(d.current.element), t && d.current.scrollContainers && d.current.scrollContainers.forEach((w) => w.addEventListener("scroll", _, { capture: !0, passive: !0 })), d.current.orientationHandler = () => {
      _();
    }, "orientation" in screen && "addEventListener" in screen.orientation ? screen.orientation.addEventListener("change", d.current.orientationHandler) : "onorientationchange" in window && window.addEventListener("orientationchange", d.current.orientationHandler));
  }
  const A = (w) => {
    !w || w === d.current.element || (k(), d.current.element = w, d.current.scrollContainers = t0(w), R());
  };
  return FE(_, !!t), jE(v), Q.useEffect(() => {
    k(), R();
  }, [t, _, v]), Q.useEffect(() => k, []), [A, s, y];
}
function jE(e) {
  Q.useEffect(() => {
    const t = e;
    return window.addEventListener("resize", t), () => void window.removeEventListener("resize", t);
  }, [e]);
}
function FE(e, t) {
  Q.useEffect(() => {
    if (t) {
      const n = e;
      return window.addEventListener("scroll", n, { capture: !0, passive: !0 }), () => void window.removeEventListener("scroll", n, !0);
    }
  }, [e, t]);
}
function t0(e) {
  const t = [];
  if (!e || e === document.body) return t;
  const { overflow: n, overflowX: o, overflowY: l } = window.getComputedStyle(e);
  return [n, o, l].some((s) => s === "auto" || s === "scroll") && t.push(e), [...t, ...t0(e.parentElement)];
}
const UE = ["x", "y", "top", "bottom", "left", "right", "width", "height"], HE = (e, t) => UE.every((n) => e[n] === t[n]);
var BE = Object.defineProperty, WE = Object.defineProperties, VE = Object.getOwnPropertyDescriptors, tg = Object.getOwnPropertySymbols, GE = Object.prototype.hasOwnProperty, KE = Object.prototype.propertyIsEnumerable, ng = (e, t, n) => t in e ? BE(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, rg = (e, t) => {
  for (var n in t || (t = {}))
    GE.call(t, n) && ng(e, n, t[n]);
  if (tg)
    for (var n of tg(t))
      KE.call(t, n) && ng(e, n, t[n]);
  return e;
}, QE = (e, t) => WE(e, VE(t)), ig, og;
typeof window < "u" && ((ig = window.document) != null && ig.createElement || ((og = window.navigator) == null ? void 0 : og.product) === "ReactNative") ? Q.useLayoutEffect : Q.useEffect;
function n0(e, t, n) {
  if (!e)
    return;
  if (n(e) === !0)
    return e;
  let o = e.child;
  for (; o; ) {
    const l = n0(o, t, n);
    if (l)
      return l;
    o = o.sibling;
  }
}
function r0(e) {
  try {
    return Object.defineProperties(e, {
      _currentRenderer: {
        get() {
          return null;
        },
        set() {
        }
      },
      _currentRenderer2: {
        get() {
          return null;
        },
        set() {
        }
      }
    });
  } catch {
    return e;
  }
}
const lg = console.error;
console.error = function() {
  const e = [...arguments].join("");
  if (e != null && e.startsWith("Warning:") && e.includes("useContext")) {
    console.error = lg;
    return;
  }
  return lg.apply(this, arguments);
};
const Bd = r0(Q.createContext(null));
class i0 extends Q.Component {
  render() {
    return /* @__PURE__ */ Q.createElement(Bd.Provider, {
      value: this._reactInternals
    }, this.props.children);
  }
}
function XE() {
  const e = Q.useContext(Bd);
  if (e === null)
    throw new Error("its-fine: useFiber must be called within a <FiberProvider />!");
  const t = Q.useId();
  return Q.useMemo(() => {
    for (const o of [e, e == null ? void 0 : e.alternate]) {
      if (!o)
        continue;
      const l = n0(o, !1, (s) => {
        let a = s.memoizedState;
        for (; a; ) {
          if (a.memoizedState === t)
            return !0;
          a = a.next;
        }
      });
      if (l)
        return l;
    }
  }, [e, t]);
}
function YE() {
  const e = XE(), [t] = Q.useState(() => /* @__PURE__ */ new Map());
  t.clear();
  let n = e;
  for (; n; ) {
    if (n.type && typeof n.type == "object") {
      const l = n.type._context === void 0 && n.type.Provider === n.type ? n.type : n.type._context;
      l && l !== Bd && !t.has(l) && t.set(l, Q.useContext(r0(l)));
    }
    n = n.return;
  }
  return t;
}
function ZE() {
  const e = YE();
  return Q.useMemo(
    () => Array.from(e.keys()).reduce(
      (t, n) => (o) => /* @__PURE__ */ Q.createElement(t, null, /* @__PURE__ */ Q.createElement(n.Provider, QE(rg({}, o), {
        value: e.get(n)
      }))),
      (t) => /* @__PURE__ */ Q.createElement(i0, rg({}, t))
    ),
    [e]
  );
}
const JE = /* @__PURE__ */ Q.forwardRef(function({
  children: t,
  fallback: n,
  resize: o,
  style: l,
  gl: s,
  events: a = OE,
  eventSource: d,
  eventPrefix: p,
  shadows: m,
  linear: g,
  flat: y,
  legacy: v,
  orthographic: _,
  frameloop: k,
  dpr: R,
  performance: A,
  raycaster: w,
  camera: S,
  scene: E,
  onPointerMissed: C,
  onCreated: I,
  ...O
}, D) {
  Q.useMemo(() => hE(he), []);
  const H = ZE(), [J, W] = DE({
    scroll: !0,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...o
  }), G = Q.useRef(null), le = Q.useRef(null);
  Q.useImperativeHandle(D, () => G.current);
  const ve = Gv(C), [vt, Mt] = Q.useState(!1), [Je, St] = Q.useState(!1);
  if (vt) throw vt;
  if (Je) throw Je;
  const N = Q.useRef(null);
  El(() => {
    const j = G.current;
    W.width > 0 && W.height > 0 && j && (N.current || (N.current = zE(j)), N.current.configure({
      gl: s,
      events: a,
      shadows: m,
      linear: g,
      flat: y,
      legacy: v,
      orthographic: _,
      frameloop: k,
      dpr: R,
      performance: A,
      raycaster: w,
      camera: S,
      scene: E,
      size: W,
      // Pass mutable reference to onPointerMissed so it's free to update
      onPointerMissed: (...X) => ve.current == null ? void 0 : ve.current(...X),
      onCreated: (X) => {
        X.events.connect == null || X.events.connect(d ? gE(d) ? d.current : d : le.current), p && X.setEvents({
          compute: (te, ae) => {
            const Me = te[p + "X"], tt = te[p + "Y"];
            ae.pointer.set(Me / ae.size.width * 2 - 1, -(tt / ae.size.height) * 2 + 1), ae.raycaster.setFromCamera(ae.pointer, ae.camera);
          }
        }), I == null || I(X);
      }
    }), N.current.render(/* @__PURE__ */ q.jsx(H, {
      children: /* @__PURE__ */ q.jsx(Kv, {
        set: St,
        children: /* @__PURE__ */ q.jsx(Q.Suspense, {
          fallback: /* @__PURE__ */ q.jsx(yE, {
            set: Mt
          }),
          children: t ?? null
        })
      })
    })));
  }), Q.useEffect(() => {
    const j = G.current;
    if (j) return () => e0(j);
  }, []);
  const F = d ? "none" : "auto";
  return /* @__PURE__ */ q.jsx("div", {
    ref: le,
    style: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      pointerEvents: F,
      ...l
    },
    ...O,
    children: /* @__PURE__ */ q.jsx("div", {
      ref: J,
      style: {
        width: "100%",
        height: "100%"
      },
      children: /* @__PURE__ */ q.jsx("canvas", {
        ref: G,
        style: {
          display: "block"
        },
        children: n
      })
    })
  });
}), qE = /* @__PURE__ */ Q.forwardRef(function(t, n) {
  return /* @__PURE__ */ q.jsx(i0, {
    children: /* @__PURE__ */ q.jsx(JE, {
      ...t,
      ref: n
    })
  });
});
function sg(e, t) {
  if (t === X1)
    return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), e;
  if (t === Vc || t === hg) {
    let n = e.getIndex();
    if (n === null) {
      const a = [], d = e.getAttribute("position");
      if (d !== void 0) {
        for (let p = 0; p < d.count; p++)
          a.push(p);
        e.setIndex(a), n = e.getIndex();
      } else
        return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."), e;
    }
    const o = n.count - 2, l = [];
    if (t === Vc)
      for (let a = 1; a <= o; a++)
        l.push(n.getX(0)), l.push(n.getX(a)), l.push(n.getX(a + 1));
    else
      for (let a = 0; a < o; a++)
        a % 2 === 0 ? (l.push(n.getX(a)), l.push(n.getX(a + 1)), l.push(n.getX(a + 2))) : (l.push(n.getX(a + 2)), l.push(n.getX(a + 1)), l.push(n.getX(a)));
    l.length / 3 !== o && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    const s = e.clone();
    return s.setIndex(l), s.clearGroups(), s;
  } else
    return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", t), e;
}
class $E extends mg {
  constructor(t) {
    super(t), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function(n) {
      return new rx(n);
    }), this.register(function(n) {
      return new ix(n);
    }), this.register(function(n) {
      return new px(n);
    }), this.register(function(n) {
      return new hx(n);
    }), this.register(function(n) {
      return new mx(n);
    }), this.register(function(n) {
      return new lx(n);
    }), this.register(function(n) {
      return new sx(n);
    }), this.register(function(n) {
      return new ux(n);
    }), this.register(function(n) {
      return new ax(n);
    }), this.register(function(n) {
      return new nx(n);
    }), this.register(function(n) {
      return new cx(n);
    }), this.register(function(n) {
      return new ox(n);
    }), this.register(function(n) {
      return new dx(n);
    }), this.register(function(n) {
      return new fx(n);
    }), this.register(function(n) {
      return new ex(n);
    }), this.register(function(n) {
      return new gx(n);
    }), this.register(function(n) {
      return new yx(n);
    });
  }
  load(t, n, o, l) {
    const s = this;
    let a;
    if (this.resourcePath !== "")
      a = this.resourcePath;
    else if (this.path !== "") {
      const m = Vo.extractUrlBase(t);
      a = Vo.resolveURL(m, this.path);
    } else
      a = Vo.extractUrlBase(t);
    this.manager.itemStart(t);
    const d = function(m) {
      l ? l(m) : console.error(m), s.manager.itemError(t), s.manager.itemEnd(t);
    }, p = new $s(this.manager);
    p.setPath(this.path), p.setResponseType("arraybuffer"), p.setRequestHeader(this.requestHeader), p.setWithCredentials(this.withCredentials), p.load(t, function(m) {
      try {
        s.parse(m, a, function(g) {
          n(g), s.manager.itemEnd(t);
        }, d);
      } catch (g) {
        d(g);
      }
    }, o, d);
  }
  setDRACOLoader(t) {
    return this.dracoLoader = t, this;
  }
  setKTX2Loader(t) {
    return this.ktx2Loader = t, this;
  }
  setMeshoptDecoder(t) {
    return this.meshoptDecoder = t, this;
  }
  register(t) {
    return this.pluginCallbacks.indexOf(t) === -1 && this.pluginCallbacks.push(t), this;
  }
  unregister(t) {
    return this.pluginCallbacks.indexOf(t) !== -1 && this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(t), 1), this;
  }
  parse(t, n, o, l) {
    let s;
    const a = {}, d = {}, p = new TextDecoder();
    if (typeof t == "string")
      s = JSON.parse(t);
    else if (t instanceof ArrayBuffer)
      if (p.decode(new Uint8Array(t, 0, 4)) === o0) {
        try {
          a[se.KHR_BINARY_GLTF] = new vx(t);
        } catch (y) {
          l && l(y);
          return;
        }
        s = JSON.parse(a[se.KHR_BINARY_GLTF].content);
      } else
        s = JSON.parse(p.decode(t));
    else
      s = t;
    if (s.asset === void 0 || s.asset.version[0] < 2) {
      l && l(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));
      return;
    }
    const m = new Nx(s, {
      path: n || this.resourcePath || "",
      crossOrigin: this.crossOrigin,
      requestHeader: this.requestHeader,
      manager: this.manager,
      ktx2Loader: this.ktx2Loader,
      meshoptDecoder: this.meshoptDecoder
    });
    m.fileLoader.setRequestHeader(this.requestHeader);
    for (let g = 0; g < this.pluginCallbacks.length; g++) {
      const y = this.pluginCallbacks[g](m);
      y.name || console.error("THREE.GLTFLoader: Invalid plugin found: missing name"), d[y.name] = y, a[y.name] = !0;
    }
    if (s.extensionsUsed)
      for (let g = 0; g < s.extensionsUsed.length; ++g) {
        const y = s.extensionsUsed[g], v = s.extensionsRequired || [];
        switch (y) {
          case se.KHR_MATERIALS_UNLIT:
            a[y] = new tx();
            break;
          case se.KHR_DRACO_MESH_COMPRESSION:
            a[y] = new Sx(s, this.dracoLoader);
            break;
          case se.KHR_TEXTURE_TRANSFORM:
            a[y] = new wx();
            break;
          case se.KHR_MESH_QUANTIZATION:
            a[y] = new _x();
            break;
          default:
            v.indexOf(y) >= 0 && d[y] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + y + '".');
        }
      }
    m.setExtensions(a), m.setPlugins(d), m.parse(o, l);
  }
  parseAsync(t, n) {
    const o = this;
    return new Promise(function(l, s) {
      o.parse(t, n, l, s);
    });
  }
}
function bE() {
  let e = {};
  return {
    get: function(t) {
      return e[t];
    },
    add: function(t, n) {
      e[t] = n;
    },
    remove: function(t) {
      delete e[t];
    },
    removeAll: function() {
      e = {};
    }
  };
}
const se = {
  KHR_BINARY_GLTF: "KHR_binary_glTF",
  KHR_DRACO_MESH_COMPRESSION: "KHR_draco_mesh_compression",
  KHR_LIGHTS_PUNCTUAL: "KHR_lights_punctual",
  KHR_MATERIALS_CLEARCOAT: "KHR_materials_clearcoat",
  KHR_MATERIALS_DISPERSION: "KHR_materials_dispersion",
  KHR_MATERIALS_IOR: "KHR_materials_ior",
  KHR_MATERIALS_SHEEN: "KHR_materials_sheen",
  KHR_MATERIALS_SPECULAR: "KHR_materials_specular",
  KHR_MATERIALS_TRANSMISSION: "KHR_materials_transmission",
  KHR_MATERIALS_IRIDESCENCE: "KHR_materials_iridescence",
  KHR_MATERIALS_ANISOTROPY: "KHR_materials_anisotropy",
  KHR_MATERIALS_UNLIT: "KHR_materials_unlit",
  KHR_MATERIALS_VOLUME: "KHR_materials_volume",
  KHR_TEXTURE_BASISU: "KHR_texture_basisu",
  KHR_TEXTURE_TRANSFORM: "KHR_texture_transform",
  KHR_MESH_QUANTIZATION: "KHR_mesh_quantization",
  KHR_MATERIALS_EMISSIVE_STRENGTH: "KHR_materials_emissive_strength",
  EXT_MATERIALS_BUMP: "EXT_materials_bump",
  EXT_TEXTURE_WEBP: "EXT_texture_webp",
  EXT_TEXTURE_AVIF: "EXT_texture_avif",
  EXT_MESHOPT_COMPRESSION: "EXT_meshopt_compression",
  EXT_MESH_GPU_INSTANCING: "EXT_mesh_gpu_instancing"
};
class ex {
  constructor(t) {
    this.parser = t, this.name = se.KHR_LIGHTS_PUNCTUAL, this.cache = { refs: {}, uses: {} };
  }
  _markDefs() {
    const t = this.parser, n = this.parser.json.nodes || [];
    for (let o = 0, l = n.length; o < l; o++) {
      const s = n[o];
      s.extensions && s.extensions[this.name] && s.extensions[this.name].light !== void 0 && t._addNodeRef(this.cache, s.extensions[this.name].light);
    }
  }
  _loadLight(t) {
    const n = this.parser, o = "light:" + t;
    let l = n.cache.get(o);
    if (l) return l;
    const s = n.json, p = ((s.extensions && s.extensions[this.name] || {}).lights || [])[t];
    let m;
    const g = new Pr(16777215);
    p.color !== void 0 && g.setRGB(p.color[0], p.color[1], p.color[2], zn);
    const y = p.range !== void 0 ? p.range : 0;
    switch (p.type) {
      case "directional":
        m = new J1(g), m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      case "point":
        m = new Z1(g), m.distance = y;
        break;
      case "spot":
        m = new Y1(g), m.distance = y, p.spot = p.spot || {}, p.spot.innerConeAngle = p.spot.innerConeAngle !== void 0 ? p.spot.innerConeAngle : 0, p.spot.outerConeAngle = p.spot.outerConeAngle !== void 0 ? p.spot.outerConeAngle : Math.PI / 4, m.angle = p.spot.outerConeAngle, m.penumbra = 1 - p.spot.innerConeAngle / p.spot.outerConeAngle, m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + p.type);
    }
    return m.position.set(0, 0, 0), m.decay = 2, Wn(m, p), p.intensity !== void 0 && (m.intensity = p.intensity), m.name = n.createUniqueName(p.name || "light_" + t), l = Promise.resolve(m), n.cache.add(o, l), l;
  }
  getDependency(t, n) {
    if (t === "light")
      return this._loadLight(n);
  }
  createNodeAttachment(t) {
    const n = this, o = this.parser, s = o.json.nodes[t], d = (s.extensions && s.extensions[this.name] || {}).light;
    return d === void 0 ? null : this._loadLight(d).then(function(p) {
      return o._getNodeRef(n.cache, d, p);
    });
  }
}
class tx {
  constructor() {
    this.name = se.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return Fo;
  }
  extendParams(t, n, o) {
    const l = [];
    t.color = new Pr(1, 1, 1), t.opacity = 1;
    const s = n.pbrMetallicRoughness;
    if (s) {
      if (Array.isArray(s.baseColorFactor)) {
        const a = s.baseColorFactor;
        t.color.setRGB(a[0], a[1], a[2], zn), t.opacity = a[3];
      }
      s.baseColorTexture !== void 0 && l.push(o.assignTexture(t, "map", s.baseColorTexture, yr));
    }
    return Promise.all(l);
  }
}
class nx {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_EMISSIVE_STRENGTH;
  }
  extendMaterialParams(t, n) {
    const l = this.parser.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = l.extensions[this.name].emissiveStrength;
    return s !== void 0 && (n.emissiveIntensity = s), Promise.resolve();
  }
}
class rx {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    if (a.clearcoatFactor !== void 0 && (n.clearcoat = a.clearcoatFactor), a.clearcoatTexture !== void 0 && s.push(o.assignTexture(n, "clearcoatMap", a.clearcoatTexture)), a.clearcoatRoughnessFactor !== void 0 && (n.clearcoatRoughness = a.clearcoatRoughnessFactor), a.clearcoatRoughnessTexture !== void 0 && s.push(o.assignTexture(n, "clearcoatRoughnessMap", a.clearcoatRoughnessTexture)), a.clearcoatNormalTexture !== void 0 && (s.push(o.assignTexture(n, "clearcoatNormalMap", a.clearcoatNormalTexture)), a.clearcoatNormalTexture.scale !== void 0)) {
      const d = a.clearcoatNormalTexture.scale;
      n.clearcoatNormalScale = new Ft(d, d);
    }
    return Promise.all(s);
  }
}
class ix {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_DISPERSION;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const l = this.parser.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = l.extensions[this.name];
    return n.dispersion = s.dispersion !== void 0 ? s.dispersion : 0, Promise.resolve();
  }
}
class ox {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return a.iridescenceFactor !== void 0 && (n.iridescence = a.iridescenceFactor), a.iridescenceTexture !== void 0 && s.push(o.assignTexture(n, "iridescenceMap", a.iridescenceTexture)), a.iridescenceIor !== void 0 && (n.iridescenceIOR = a.iridescenceIor), n.iridescenceThicknessRange === void 0 && (n.iridescenceThicknessRange = [100, 400]), a.iridescenceThicknessMinimum !== void 0 && (n.iridescenceThicknessRange[0] = a.iridescenceThicknessMinimum), a.iridescenceThicknessMaximum !== void 0 && (n.iridescenceThicknessRange[1] = a.iridescenceThicknessMaximum), a.iridescenceThicknessTexture !== void 0 && s.push(o.assignTexture(n, "iridescenceThicknessMap", a.iridescenceThicknessTexture)), Promise.all(s);
  }
}
class lx {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [];
    n.sheenColor = new Pr(0, 0, 0), n.sheenRoughness = 0, n.sheen = 1;
    const a = l.extensions[this.name];
    if (a.sheenColorFactor !== void 0) {
      const d = a.sheenColorFactor;
      n.sheenColor.setRGB(d[0], d[1], d[2], zn);
    }
    return a.sheenRoughnessFactor !== void 0 && (n.sheenRoughness = a.sheenRoughnessFactor), a.sheenColorTexture !== void 0 && s.push(o.assignTexture(n, "sheenColorMap", a.sheenColorTexture, yr)), a.sheenRoughnessTexture !== void 0 && s.push(o.assignTexture(n, "sheenRoughnessMap", a.sheenRoughnessTexture)), Promise.all(s);
  }
}
class sx {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return a.transmissionFactor !== void 0 && (n.transmission = a.transmissionFactor), a.transmissionTexture !== void 0 && s.push(o.assignTexture(n, "transmissionMap", a.transmissionTexture)), Promise.all(s);
  }
}
class ux {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    n.thickness = a.thicknessFactor !== void 0 ? a.thicknessFactor : 0, a.thicknessTexture !== void 0 && s.push(o.assignTexture(n, "thicknessMap", a.thicknessTexture)), n.attenuationDistance = a.attenuationDistance || 1 / 0;
    const d = a.attenuationColor || [1, 1, 1];
    return n.attenuationColor = new Pr().setRGB(d[0], d[1], d[2], zn), Promise.all(s);
  }
}
class ax {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_IOR;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const l = this.parser.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = l.extensions[this.name];
    return n.ior = s.ior !== void 0 ? s.ior : 1.5, Promise.resolve();
  }
}
class cx {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    n.specularIntensity = a.specularFactor !== void 0 ? a.specularFactor : 1, a.specularTexture !== void 0 && s.push(o.assignTexture(n, "specularIntensityMap", a.specularTexture));
    const d = a.specularColorFactor || [1, 1, 1];
    return n.specularColor = new Pr().setRGB(d[0], d[1], d[2], zn), a.specularColorTexture !== void 0 && s.push(o.assignTexture(n, "specularColorMap", a.specularColorTexture, yr)), Promise.all(s);
  }
}
class fx {
  constructor(t) {
    this.parser = t, this.name = se.EXT_MATERIALS_BUMP;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return n.bumpScale = a.bumpFactor !== void 0 ? a.bumpFactor : 1, a.bumpTexture !== void 0 && s.push(o.assignTexture(n, "bumpMap", a.bumpTexture)), Promise.all(s);
  }
}
class dx {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : In;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return a.anisotropyStrength !== void 0 && (n.anisotropy = a.anisotropyStrength), a.anisotropyRotation !== void 0 && (n.anisotropyRotation = a.anisotropyRotation), a.anisotropyTexture !== void 0 && s.push(o.assignTexture(n, "anisotropyMap", a.anisotropyTexture)), Promise.all(s);
  }
}
class px {
  constructor(t) {
    this.parser = t, this.name = se.KHR_TEXTURE_BASISU;
  }
  loadTexture(t) {
    const n = this.parser, o = n.json, l = o.textures[t];
    if (!l.extensions || !l.extensions[this.name])
      return null;
    const s = l.extensions[this.name], a = n.options.ktx2Loader;
    if (!a) {
      if (o.extensionsRequired && o.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
      return null;
    }
    return n.loadTextureImage(t, s.source, a);
  }
}
class hx {
  constructor(t) {
    this.parser = t, this.name = se.EXT_TEXTURE_WEBP, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, o = this.parser, l = o.json, s = l.textures[t];
    if (!s.extensions || !s.extensions[n])
      return null;
    const a = s.extensions[n], d = l.images[a.source];
    let p = o.textureLoader;
    if (d.uri) {
      const m = o.options.manager.getHandler(d.uri);
      m !== null && (p = m);
    }
    return this.detectSupport().then(function(m) {
      if (m) return o.loadTextureImage(t, a.source, p);
      if (l.extensionsRequired && l.extensionsRequired.indexOf(n) >= 0)
        throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");
      return o.loadTexture(t);
    });
  }
  detectSupport() {
    return this.isSupported || (this.isSupported = new Promise(function(t) {
      const n = new Image();
      n.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", n.onload = n.onerror = function() {
        t(n.height === 1);
      };
    })), this.isSupported;
  }
}
class mx {
  constructor(t) {
    this.parser = t, this.name = se.EXT_TEXTURE_AVIF, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, o = this.parser, l = o.json, s = l.textures[t];
    if (!s.extensions || !s.extensions[n])
      return null;
    const a = s.extensions[n], d = l.images[a.source];
    let p = o.textureLoader;
    if (d.uri) {
      const m = o.options.manager.getHandler(d.uri);
      m !== null && (p = m);
    }
    return this.detectSupport().then(function(m) {
      if (m) return o.loadTextureImage(t, a.source, p);
      if (l.extensionsRequired && l.extensionsRequired.indexOf(n) >= 0)
        throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");
      return o.loadTexture(t);
    });
  }
  detectSupport() {
    return this.isSupported || (this.isSupported = new Promise(function(t) {
      const n = new Image();
      n.src = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=", n.onload = n.onerror = function() {
        t(n.height === 1);
      };
    })), this.isSupported;
  }
}
class gx {
  constructor(t) {
    this.name = se.EXT_MESHOPT_COMPRESSION, this.parser = t;
  }
  loadBufferView(t) {
    const n = this.parser.json, o = n.bufferViews[t];
    if (o.extensions && o.extensions[this.name]) {
      const l = o.extensions[this.name], s = this.parser.getDependency("buffer", l.buffer), a = this.parser.options.meshoptDecoder;
      if (!a || !a.supported) {
        if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
          throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
        return null;
      }
      return s.then(function(d) {
        const p = l.byteOffset || 0, m = l.byteLength || 0, g = l.count, y = l.byteStride, v = new Uint8Array(d, p, m);
        return a.decodeGltfBufferAsync ? a.decodeGltfBufferAsync(g, y, v, l.mode, l.filter).then(function(_) {
          return _.buffer;
        }) : a.ready.then(function() {
          const _ = new ArrayBuffer(g * y);
          return a.decodeGltfBuffer(new Uint8Array(_), g, y, v, l.mode, l.filter), _;
        });
      });
    } else
      return null;
  }
}
class yx {
  constructor(t) {
    this.name = se.EXT_MESH_GPU_INSTANCING, this.parser = t;
  }
  createNodeMesh(t) {
    const n = this.parser.json, o = n.nodes[t];
    if (!o.extensions || !o.extensions[this.name] || o.mesh === void 0)
      return null;
    const l = n.meshes[o.mesh];
    for (const m of l.primitives)
      if (m.mode !== tn.TRIANGLES && m.mode !== tn.TRIANGLE_STRIP && m.mode !== tn.TRIANGLE_FAN && m.mode !== void 0)
        return null;
    const a = o.extensions[this.name].attributes, d = [], p = {};
    for (const m in a)
      d.push(this.parser.getDependency("accessor", a[m]).then((g) => (p[m] = g, p[m])));
    return d.length < 1 ? null : (d.push(this.parser.createNodeMesh(t)), Promise.all(d).then((m) => {
      const g = m.pop(), y = g.isGroup ? g.children : [g], v = m[0].count, _ = [];
      for (const k of y) {
        const R = new bs(), A = new at(), w = new eu(), S = new at(1, 1, 1), E = new q1(k.geometry, k.material, v);
        for (let C = 0; C < v; C++)
          p.TRANSLATION && A.fromBufferAttribute(p.TRANSLATION, C), p.ROTATION && w.fromBufferAttribute(p.ROTATION, C), p.SCALE && S.fromBufferAttribute(p.SCALE, C), E.setMatrixAt(C, R.compose(A, w, S));
        for (const C in p)
          if (C === "_COLOR_0") {
            const I = p[C];
            E.instanceColor = new $1(I.array, I.itemSize, I.normalized);
          } else C !== "TRANSLATION" && C !== "ROTATION" && C !== "SCALE" && k.geometry.setAttribute(C, p[C]);
        gg.prototype.copy.call(E, k), this.parser.assignFinalMaterial(E), _.push(E);
      }
      return g.isGroup ? (g.clear(), g.add(..._), g) : _[0];
    }));
  }
}
const o0 = "glTF", jo = 12, ug = { JSON: 1313821514, BIN: 5130562 };
class vx {
  constructor(t) {
    this.name = se.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const n = new DataView(t, 0, jo), o = new TextDecoder();
    if (this.header = {
      magic: o.decode(new Uint8Array(t.slice(0, 4))),
      version: n.getUint32(4, !0),
      length: n.getUint32(8, !0)
    }, this.header.magic !== o0)
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const l = this.header.length - jo, s = new DataView(t, jo);
    let a = 0;
    for (; a < l; ) {
      const d = s.getUint32(a, !0);
      a += 4;
      const p = s.getUint32(a, !0);
      if (a += 4, p === ug.JSON) {
        const m = new Uint8Array(t, jo + a, d);
        this.content = o.decode(m);
      } else if (p === ug.BIN) {
        const m = jo + a;
        this.body = t.slice(m, m + d);
      }
      a += d;
    }
    if (this.content === null)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class Sx {
  constructor(t, n) {
    if (!n)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = se.KHR_DRACO_MESH_COMPRESSION, this.json = t, this.dracoLoader = n, this.dracoLoader.preload();
  }
  decodePrimitive(t, n) {
    const o = this.json, l = this.dracoLoader, s = t.extensions[this.name].bufferView, a = t.extensions[this.name].attributes, d = {}, p = {}, m = {};
    for (const g in a) {
      const y = Vf[g] || g.toLowerCase();
      d[y] = a[g];
    }
    for (const g in t.attributes) {
      const y = Vf[g] || g.toLowerCase();
      if (a[g] !== void 0) {
        const v = o.accessors[t.attributes[g]], _ = Ki[v.componentType];
        m[y] = _.name, p[y] = v.normalized === !0;
      }
    }
    return n.getDependency("bufferView", s).then(function(g) {
      return new Promise(function(y, v) {
        l.decodeDracoFile(g, function(_) {
          for (const k in _.attributes) {
            const R = _.attributes[k], A = p[k];
            A !== void 0 && (R.normalized = A);
          }
          y(_);
        }, d, m, zn, v);
      });
    });
  }
}
class wx {
  constructor() {
    this.name = se.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(t, n) {
    return (n.texCoord === void 0 || n.texCoord === t.channel) && n.offset === void 0 && n.rotation === void 0 && n.scale === void 0 || (t = t.clone(), n.texCoord !== void 0 && (t.channel = n.texCoord), n.offset !== void 0 && t.offset.fromArray(n.offset), n.rotation !== void 0 && (t.rotation = n.rotation), n.scale !== void 0 && t.repeat.fromArray(n.scale), t.needsUpdate = !0), t;
  }
}
class _x {
  constructor() {
    this.name = se.KHR_MESH_QUANTIZATION;
  }
}
class l0 extends TS {
  constructor(t, n, o, l) {
    super(t, n, o, l);
  }
  copySampleValue_(t) {
    const n = this.resultBuffer, o = this.sampleValues, l = this.valueSize, s = t * l * 3 + l;
    for (let a = 0; a !== l; a++)
      n[a] = o[s + a];
    return n;
  }
  interpolate_(t, n, o, l) {
    const s = this.resultBuffer, a = this.sampleValues, d = this.valueSize, p = d * 2, m = d * 3, g = l - n, y = (o - n) / g, v = y * y, _ = v * y, k = t * m, R = k - m, A = -2 * _ + 3 * v, w = _ - v, S = 1 - A, E = w - v + y;
    for (let C = 0; C !== d; C++) {
      const I = a[R + C + d], O = a[R + C + p] * g, D = a[k + C + d], H = a[k + C] * g;
      s[C] = S * I + E * O + A * D + w * H;
    }
    return s;
  }
}
const Ex = new eu();
class xx extends l0 {
  interpolate_(t, n, o, l) {
    const s = super.interpolate_(t, n, o, l);
    return Ex.fromArray(s).normalize().toArray(s), s;
  }
}
const tn = {
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6
}, Ki = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
}, ag = {
  9728: vg,
  9729: Gc,
  9984: oS,
  9985: iS,
  9986: rS,
  9987: yg
}, cg = {
  33071: sS,
  33648: lS,
  10497: Kc
}, Dc = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
}, Vf = {
  POSITION: "position",
  NORMAL: "normal",
  TANGENT: "tangent",
  TEXCOORD_0: "uv",
  TEXCOORD_1: "uv1",
  TEXCOORD_2: "uv2",
  TEXCOORD_3: "uv3",
  COLOR_0: "color",
  WEIGHTS_0: "skinWeight",
  JOINTS_0: "skinIndex"
}, ar = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences"
}, kx = {
  CUBICSPLINE: void 0,
  // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: Eg,
  STEP: xS
}, jc = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND"
};
function Tx(e) {
  return e.DefaultMaterial === void 0 && (e.DefaultMaterial = new Sg({
    color: 16777215,
    emissive: 0,
    metalness: 1,
    roughness: 1,
    transparent: !1,
    depthTest: !0,
    side: kS
  })), e.DefaultMaterial;
}
function Wr(e, t, n) {
  for (const o in n.extensions)
    e[o] === void 0 && (t.userData.gltfExtensions = t.userData.gltfExtensions || {}, t.userData.gltfExtensions[o] = n.extensions[o]);
}
function Wn(e, t) {
  t.extras !== void 0 && (typeof t.extras == "object" ? Object.assign(e.userData, t.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + t.extras));
}
function Px(e, t, n) {
  let o = !1, l = !1, s = !1;
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (y.POSITION !== void 0 && (o = !0), y.NORMAL !== void 0 && (l = !0), y.COLOR_0 !== void 0 && (s = !0), o && l && s) break;
  }
  if (!o && !l && !s) return Promise.resolve(e);
  const a = [], d = [], p = [];
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (o) {
      const v = y.POSITION !== void 0 ? n.getDependency("accessor", y.POSITION) : e.attributes.position;
      a.push(v);
    }
    if (l) {
      const v = y.NORMAL !== void 0 ? n.getDependency("accessor", y.NORMAL) : e.attributes.normal;
      d.push(v);
    }
    if (s) {
      const v = y.COLOR_0 !== void 0 ? n.getDependency("accessor", y.COLOR_0) : e.attributes.color;
      p.push(v);
    }
  }
  return Promise.all([
    Promise.all(a),
    Promise.all(d),
    Promise.all(p)
  ]).then(function(m) {
    const g = m[0], y = m[1], v = m[2];
    return o && (e.morphAttributes.position = g), l && (e.morphAttributes.normal = y), s && (e.morphAttributes.color = v), e.morphTargetsRelative = !0, e;
  });
}
function Cx(e, t) {
  if (e.updateMorphTargets(), t.weights !== void 0)
    for (let n = 0, o = t.weights.length; n < o; n++)
      e.morphTargetInfluences[n] = t.weights[n];
  if (t.extras && Array.isArray(t.extras.targetNames)) {
    const n = t.extras.targetNames;
    if (e.morphTargetInfluences.length === n.length) {
      e.morphTargetDictionary = {};
      for (let o = 0, l = n.length; o < l; o++)
        e.morphTargetDictionary[n[o]] = o;
    } else
      console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
  }
}
function Rx(e) {
  let t;
  const n = e.extensions && e.extensions[se.KHR_DRACO_MESH_COMPRESSION];
  if (n ? t = "draco:" + n.bufferView + ":" + n.indices + ":" + Fc(n.attributes) : t = e.indices + ":" + Fc(e.attributes) + ":" + e.mode, e.targets !== void 0)
    for (let o = 0, l = e.targets.length; o < l; o++)
      t += ":" + Fc(e.targets[o]);
  return t;
}
function Fc(e) {
  let t = "";
  const n = Object.keys(e).sort();
  for (let o = 0, l = n.length; o < l; o++)
    t += n[o] + ":" + e[n[o]] + ";";
  return t;
}
function Gf(e) {
  switch (e) {
    case Int8Array:
      return 1 / 127;
    case Uint8Array:
      return 1 / 255;
    case Int16Array:
      return 1 / 32767;
    case Uint16Array:
      return 1 / 65535;
    default:
      throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.");
  }
}
function Ax(e) {
  return e.search(/\.jpe?g($|\?)/i) > 0 || e.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : e.search(/\.webp($|\?)/i) > 0 || e.search(/^data\:image\/webp/) === 0 ? "image/webp" : e.search(/\.ktx2($|\?)/i) > 0 || e.search(/^data\:image\/ktx2/) === 0 ? "image/ktx2" : "image/png";
}
const Lx = new bs();
class Nx {
  constructor(t = {}, n = {}) {
    this.json = t, this.extensions = {}, this.plugins = {}, this.options = n, this.cache = new bE(), this.associations = /* @__PURE__ */ new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = { refs: {}, uses: {} }, this.cameraCache = { refs: {}, uses: {} }, this.lightCache = { refs: {}, uses: {} }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let o = !1, l = -1, s = !1, a = -1;
    if (typeof navigator < "u") {
      const d = navigator.userAgent;
      o = /^((?!chrome|android).)*safari/i.test(d) === !0;
      const p = d.match(/Version\/(\d+)/);
      l = o && p ? parseInt(p[1], 10) : -1, s = d.indexOf("Firefox") > -1, a = s ? d.match(/Firefox\/([0-9]+)\./)[1] : -1;
    }
    typeof createImageBitmap > "u" || o && l < 17 || s && a < 98 ? this.textureLoader = new b1(this.options.manager) : this.textureLoader = new eS(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new $s(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
  }
  setExtensions(t) {
    this.extensions = t;
  }
  setPlugins(t) {
    this.plugins = t;
  }
  parse(t, n) {
    const o = this, l = this.json, s = this.extensions;
    this.cache.removeAll(), this.nodeCache = {}, this._invokeAll(function(a) {
      return a._markDefs && a._markDefs();
    }), Promise.all(this._invokeAll(function(a) {
      return a.beforeRoot && a.beforeRoot();
    })).then(function() {
      return Promise.all([
        o.getDependencies("scene"),
        o.getDependencies("animation"),
        o.getDependencies("camera")
      ]);
    }).then(function(a) {
      const d = {
        scene: a[0][l.scene || 0],
        scenes: a[0],
        animations: a[1],
        cameras: a[2],
        asset: l.asset,
        parser: o,
        userData: {}
      };
      return Wr(s, d, l), Wn(d, l), Promise.all(o._invokeAll(function(p) {
        return p.afterRoot && p.afterRoot(d);
      })).then(function() {
        for (const p of d.scenes)
          p.updateMatrixWorld();
        t(d);
      });
    }).catch(n);
  }
  /**
   * Marks the special nodes/meshes in json for efficient parse.
   */
  _markDefs() {
    const t = this.json.nodes || [], n = this.json.skins || [], o = this.json.meshes || [];
    for (let l = 0, s = n.length; l < s; l++) {
      const a = n[l].joints;
      for (let d = 0, p = a.length; d < p; d++)
        t[a[d]].isBone = !0;
    }
    for (let l = 0, s = t.length; l < s; l++) {
      const a = t[l];
      a.mesh !== void 0 && (this._addNodeRef(this.meshCache, a.mesh), a.skin !== void 0 && (o[a.mesh].isSkinnedMesh = !0)), a.camera !== void 0 && this._addNodeRef(this.cameraCache, a.camera);
    }
  }
  /**
   * Counts references to shared node / Object3D resources. These resources
   * can be reused, or "instantiated", at multiple nodes in the scene
   * hierarchy. Mesh, Camera, and Light instances are instantiated and must
   * be marked. Non-scenegraph resources (like Materials, Geometries, and
   * Textures) can be reused directly and are not marked here.
   *
   * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
   */
  _addNodeRef(t, n) {
    n !== void 0 && (t.refs[n] === void 0 && (t.refs[n] = t.uses[n] = 0), t.refs[n]++);
  }
  /** Returns a reference to a shared resource, cloning it if necessary. */
  _getNodeRef(t, n, o) {
    if (t.refs[n] <= 1) return o;
    const l = o.clone(), s = (a, d) => {
      const p = this.associations.get(a);
      p != null && this.associations.set(d, p);
      for (const [m, g] of a.children.entries())
        s(g, d.children[m]);
    };
    return s(o, l), l.name += "_instance_" + t.uses[n]++, l;
  }
  _invokeOne(t) {
    const n = Object.values(this.plugins);
    n.push(this);
    for (let o = 0; o < n.length; o++) {
      const l = t(n[o]);
      if (l) return l;
    }
    return null;
  }
  _invokeAll(t) {
    const n = Object.values(this.plugins);
    n.unshift(this);
    const o = [];
    for (let l = 0; l < n.length; l++) {
      const s = t(n[l]);
      s && o.push(s);
    }
    return o;
  }
  /**
   * Requests the specified dependency asynchronously, with caching.
   * @param {string} type
   * @param {number} index
   * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
   */
  getDependency(t, n) {
    const o = t + ":" + n;
    let l = this.cache.get(o);
    if (!l) {
      switch (t) {
        case "scene":
          l = this.loadScene(n);
          break;
        case "node":
          l = this._invokeOne(function(s) {
            return s.loadNode && s.loadNode(n);
          });
          break;
        case "mesh":
          l = this._invokeOne(function(s) {
            return s.loadMesh && s.loadMesh(n);
          });
          break;
        case "accessor":
          l = this.loadAccessor(n);
          break;
        case "bufferView":
          l = this._invokeOne(function(s) {
            return s.loadBufferView && s.loadBufferView(n);
          });
          break;
        case "buffer":
          l = this.loadBuffer(n);
          break;
        case "material":
          l = this._invokeOne(function(s) {
            return s.loadMaterial && s.loadMaterial(n);
          });
          break;
        case "texture":
          l = this._invokeOne(function(s) {
            return s.loadTexture && s.loadTexture(n);
          });
          break;
        case "skin":
          l = this.loadSkin(n);
          break;
        case "animation":
          l = this._invokeOne(function(s) {
            return s.loadAnimation && s.loadAnimation(n);
          });
          break;
        case "camera":
          l = this.loadCamera(n);
          break;
        default:
          if (l = this._invokeOne(function(s) {
            return s != this && s.getDependency && s.getDependency(t, n);
          }), !l)
            throw new Error("Unknown type: " + t);
          break;
      }
      this.cache.add(o, l);
    }
    return l;
  }
  /**
   * Requests all dependencies of the specified type asynchronously, with caching.
   * @param {string} type
   * @return {Promise<Array<Object>>}
   */
  getDependencies(t) {
    let n = this.cache.get(t);
    if (!n) {
      const o = this, l = this.json[t + (t === "mesh" ? "es" : "s")] || [];
      n = Promise.all(l.map(function(s, a) {
        return o.getDependency(t, a);
      })), this.cache.add(t, n);
    }
    return n;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */
  loadBuffer(t) {
    const n = this.json.buffers[t], o = this.fileLoader;
    if (n.type && n.type !== "arraybuffer")
      throw new Error("THREE.GLTFLoader: " + n.type + " buffer type is not supported.");
    if (n.uri === void 0 && t === 0)
      return Promise.resolve(this.extensions[se.KHR_BINARY_GLTF].body);
    const l = this.options;
    return new Promise(function(s, a) {
      o.load(Vo.resolveURL(n.uri, l.path), s, void 0, function() {
        a(new Error('THREE.GLTFLoader: Failed to load buffer "' + n.uri + '".'));
      });
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */
  loadBufferView(t) {
    const n = this.json.bufferViews[t];
    return this.getDependency("buffer", n.buffer).then(function(o) {
      const l = n.byteLength || 0, s = n.byteOffset || 0;
      return o.slice(s, s + l);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */
  loadAccessor(t) {
    const n = this, o = this.json, l = this.json.accessors[t];
    if (l.bufferView === void 0 && l.sparse === void 0) {
      const a = Dc[l.type], d = Ki[l.componentType], p = l.normalized === !0, m = new d(l.count * a);
      return Promise.resolve(new Go(m, a, p));
    }
    const s = [];
    return l.bufferView !== void 0 ? s.push(this.getDependency("bufferView", l.bufferView)) : s.push(null), l.sparse !== void 0 && (s.push(this.getDependency("bufferView", l.sparse.indices.bufferView)), s.push(this.getDependency("bufferView", l.sparse.values.bufferView))), Promise.all(s).then(function(a) {
      const d = a[0], p = Dc[l.type], m = Ki[l.componentType], g = m.BYTES_PER_ELEMENT, y = g * p, v = l.byteOffset || 0, _ = l.bufferView !== void 0 ? o.bufferViews[l.bufferView].byteStride : void 0, k = l.normalized === !0;
      let R, A;
      if (_ && _ !== y) {
        const w = Math.floor(v / _), S = "InterleavedBuffer:" + l.bufferView + ":" + l.componentType + ":" + w + ":" + l.count;
        let E = n.cache.get(S);
        E || (R = new m(d, w * _, l.count * _ / g), E = new tS(R, _ / g), n.cache.add(S, E)), A = new nS(E, p, v % _ / g, k);
      } else
        d === null ? R = new m(l.count * p) : R = new m(d, v, l.count * p), A = new Go(R, p, k);
      if (l.sparse !== void 0) {
        const w = Dc.SCALAR, S = Ki[l.sparse.indices.componentType], E = l.sparse.indices.byteOffset || 0, C = l.sparse.values.byteOffset || 0, I = new S(a[1], E, l.sparse.count * w), O = new m(a[2], C, l.sparse.count * p);
        d !== null && (A = new Go(A.array.slice(), A.itemSize, A.normalized)), A.normalized = !1;
        for (let D = 0, H = I.length; D < H; D++) {
          const J = I[D];
          if (A.setX(J, O[D * p]), p >= 2 && A.setY(J, O[D * p + 1]), p >= 3 && A.setZ(J, O[D * p + 2]), p >= 4 && A.setW(J, O[D * p + 3]), p >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
        }
        A.normalized = k;
      }
      return A;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   * @param {number} textureIndex
   * @return {Promise<THREE.Texture|null>}
   */
  loadTexture(t) {
    const n = this.json, o = this.options, s = n.textures[t].source, a = n.images[s];
    let d = this.textureLoader;
    if (a.uri) {
      const p = o.manager.getHandler(a.uri);
      p !== null && (d = p);
    }
    return this.loadTextureImage(t, s, d);
  }
  loadTextureImage(t, n, o) {
    const l = this, s = this.json, a = s.textures[t], d = s.images[n], p = (d.uri || d.bufferView) + ":" + a.sampler;
    if (this.textureCache[p])
      return this.textureCache[p];
    const m = this.loadImageSource(n, o).then(function(g) {
      g.flipY = !1, g.name = a.name || d.name || "", g.name === "" && typeof d.uri == "string" && d.uri.startsWith("data:image/") === !1 && (g.name = d.uri);
      const v = (s.samplers || {})[a.sampler] || {};
      return g.magFilter = ag[v.magFilter] || Gc, g.minFilter = ag[v.minFilter] || yg, g.wrapS = cg[v.wrapS] || Kc, g.wrapT = cg[v.wrapT] || Kc, g.generateMipmaps = !g.isCompressedTexture && g.minFilter !== vg && g.minFilter !== Gc, l.associations.set(g, { textures: t }), g;
    }).catch(function() {
      return null;
    });
    return this.textureCache[p] = m, m;
  }
  loadImageSource(t, n) {
    const o = this, l = this.json, s = this.options;
    if (this.sourceCache[t] !== void 0)
      return this.sourceCache[t].then((y) => y.clone());
    const a = l.images[t], d = self.URL || self.webkitURL;
    let p = a.uri || "", m = !1;
    if (a.bufferView !== void 0)
      p = o.getDependency("bufferView", a.bufferView).then(function(y) {
        m = !0;
        const v = new Blob([y], { type: a.mimeType });
        return p = d.createObjectURL(v), p;
      });
    else if (a.uri === void 0)
      throw new Error("THREE.GLTFLoader: Image " + t + " is missing URI and bufferView");
    const g = Promise.resolve(p).then(function(y) {
      return new Promise(function(v, _) {
        let k = v;
        n.isImageBitmapLoader === !0 && (k = function(R) {
          const A = new Nh(R);
          A.needsUpdate = !0, v(A);
        }), n.load(Vo.resolveURL(y, s.path), k, void 0, _);
      });
    }).then(function(y) {
      return m === !0 && d.revokeObjectURL(p), Wn(y, a), y.userData.mimeType = a.mimeType || Ax(a.uri), y;
    }).catch(function(y) {
      throw console.error("THREE.GLTFLoader: Couldn't load texture", p), y;
    });
    return this.sourceCache[t] = g, g;
  }
  /**
   * Asynchronously assigns a texture to the given material parameters.
   * @param {Object} materialParams
   * @param {string} mapName
   * @param {Object} mapDef
   * @return {Promise<Texture>}
   */
  assignTexture(t, n, o, l) {
    const s = this;
    return this.getDependency("texture", o.index).then(function(a) {
      if (!a) return null;
      if (o.texCoord !== void 0 && o.texCoord > 0 && (a = a.clone(), a.channel = o.texCoord), s.extensions[se.KHR_TEXTURE_TRANSFORM]) {
        const d = o.extensions !== void 0 ? o.extensions[se.KHR_TEXTURE_TRANSFORM] : void 0;
        if (d) {
          const p = s.associations.get(a);
          a = s.extensions[se.KHR_TEXTURE_TRANSFORM].extendTexture(a, d), s.associations.set(a, p);
        }
      }
      return l !== void 0 && (a.colorSpace = l), t[n] = a, a;
    });
  }
  /**
   * Assigns final material to a Mesh, Line, or Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accommodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   * @param  {Object3D} mesh Mesh, Line, or Points instance.
   */
  assignFinalMaterial(t) {
    const n = t.geometry;
    let o = t.material;
    const l = n.attributes.tangent === void 0, s = n.attributes.color !== void 0, a = n.attributes.normal === void 0;
    if (t.isPoints) {
      const d = "PointsMaterial:" + o.uuid;
      let p = this.cache.get(d);
      p || (p = new uS(), ec.prototype.copy.call(p, o), p.color.copy(o.color), p.map = o.map, p.sizeAttenuation = !1, this.cache.add(d, p)), o = p;
    } else if (t.isLine) {
      const d = "LineBasicMaterial:" + o.uuid;
      let p = this.cache.get(d);
      p || (p = new aS(), ec.prototype.copy.call(p, o), p.color.copy(o.color), p.map = o.map, this.cache.add(d, p)), o = p;
    }
    if (l || s || a) {
      let d = "ClonedMaterial:" + o.uuid + ":";
      l && (d += "derivative-tangents:"), s && (d += "vertex-colors:"), a && (d += "flat-shading:");
      let p = this.cache.get(d);
      p || (p = o.clone(), s && (p.vertexColors = !0), a && (p.flatShading = !0), l && (p.normalScale && (p.normalScale.y *= -1), p.clearcoatNormalScale && (p.clearcoatNormalScale.y *= -1)), this.cache.add(d, p), this.associations.set(p, this.associations.get(o))), o = p;
    }
    t.material = o;
  }
  getMaterialType() {
    return Sg;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  loadMaterial(t) {
    const n = this, o = this.json, l = this.extensions, s = o.materials[t];
    let a;
    const d = {}, p = s.extensions || {}, m = [];
    if (p[se.KHR_MATERIALS_UNLIT]) {
      const y = l[se.KHR_MATERIALS_UNLIT];
      a = y.getMaterialType(), m.push(y.extendParams(d, s, n));
    } else {
      const y = s.pbrMetallicRoughness || {};
      if (d.color = new Pr(1, 1, 1), d.opacity = 1, Array.isArray(y.baseColorFactor)) {
        const v = y.baseColorFactor;
        d.color.setRGB(v[0], v[1], v[2], zn), d.opacity = v[3];
      }
      y.baseColorTexture !== void 0 && m.push(n.assignTexture(d, "map", y.baseColorTexture, yr)), d.metalness = y.metallicFactor !== void 0 ? y.metallicFactor : 1, d.roughness = y.roughnessFactor !== void 0 ? y.roughnessFactor : 1, y.metallicRoughnessTexture !== void 0 && (m.push(n.assignTexture(d, "metalnessMap", y.metallicRoughnessTexture)), m.push(n.assignTexture(d, "roughnessMap", y.metallicRoughnessTexture))), a = this._invokeOne(function(v) {
        return v.getMaterialType && v.getMaterialType(t);
      }), m.push(Promise.all(this._invokeAll(function(v) {
        return v.extendMaterialParams && v.extendMaterialParams(t, d);
      })));
    }
    s.doubleSided === !0 && (d.side = cS);
    const g = s.alphaMode || jc.OPAQUE;
    if (g === jc.BLEND ? (d.transparent = !0, d.depthWrite = !1) : (d.transparent = !1, g === jc.MASK && (d.alphaTest = s.alphaCutoff !== void 0 ? s.alphaCutoff : 0.5)), s.normalTexture !== void 0 && a !== Fo && (m.push(n.assignTexture(d, "normalMap", s.normalTexture)), d.normalScale = new Ft(1, 1), s.normalTexture.scale !== void 0)) {
      const y = s.normalTexture.scale;
      d.normalScale.set(y, y);
    }
    if (s.occlusionTexture !== void 0 && a !== Fo && (m.push(n.assignTexture(d, "aoMap", s.occlusionTexture)), s.occlusionTexture.strength !== void 0 && (d.aoMapIntensity = s.occlusionTexture.strength)), s.emissiveFactor !== void 0 && a !== Fo) {
      const y = s.emissiveFactor;
      d.emissive = new Pr().setRGB(y[0], y[1], y[2], zn);
    }
    return s.emissiveTexture !== void 0 && a !== Fo && m.push(n.assignTexture(d, "emissiveMap", s.emissiveTexture, yr)), Promise.all(m).then(function() {
      const y = new a(d);
      return s.name && (y.name = s.name), Wn(y, s), n.associations.set(y, { materials: t }), s.extensions && Wr(l, y, s), y;
    });
  }
  /** When Object3D instances are targeted by animation, they need unique names. */
  createUniqueName(t) {
    const n = fS.sanitizeNodeName(t || "");
    return n in this.nodeNamesUsed ? n + "_" + ++this.nodeNamesUsed[n] : (this.nodeNamesUsed[n] = 0, n);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */
  loadGeometries(t) {
    const n = this, o = this.extensions, l = this.primitiveCache;
    function s(d) {
      return o[se.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(d, n).then(function(p) {
        return fg(p, d, n);
      });
    }
    const a = [];
    for (let d = 0, p = t.length; d < p; d++) {
      const m = t[d], g = Rx(m), y = l[g];
      if (y)
        a.push(y.promise);
      else {
        let v;
        m.extensions && m.extensions[se.KHR_DRACO_MESH_COMPRESSION] ? v = s(m) : v = fg(new wg(), m, n), l[g] = { primitive: m, promise: v }, a.push(v);
      }
    }
    return Promise.all(a);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   * @param {number} meshIndex
   * @return {Promise<Group|Mesh|SkinnedMesh>}
   */
  loadMesh(t) {
    const n = this, o = this.json, l = this.extensions, s = o.meshes[t], a = s.primitives, d = [];
    for (let p = 0, m = a.length; p < m; p++) {
      const g = a[p].material === void 0 ? Tx(this.cache) : this.getDependency("material", a[p].material);
      d.push(g);
    }
    return d.push(n.loadGeometries(a)), Promise.all(d).then(function(p) {
      const m = p.slice(0, p.length - 1), g = p[p.length - 1], y = [];
      for (let _ = 0, k = g.length; _ < k; _++) {
        const R = g[_], A = a[_];
        let w;
        const S = m[_];
        if (A.mode === tn.TRIANGLES || A.mode === tn.TRIANGLE_STRIP || A.mode === tn.TRIANGLE_FAN || A.mode === void 0)
          w = s.isSkinnedMesh === !0 ? new dS(R, S) : new pS(R, S), w.isSkinnedMesh === !0 && w.normalizeSkinWeights(), A.mode === tn.TRIANGLE_STRIP ? w.geometry = sg(w.geometry, hg) : A.mode === tn.TRIANGLE_FAN && (w.geometry = sg(w.geometry, Vc));
        else if (A.mode === tn.LINES)
          w = new hS(R, S);
        else if (A.mode === tn.LINE_STRIP)
          w = new mS(R, S);
        else if (A.mode === tn.LINE_LOOP)
          w = new gS(R, S);
        else if (A.mode === tn.POINTS)
          w = new yS(R, S);
        else
          throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + A.mode);
        Object.keys(w.geometry.morphAttributes).length > 0 && Cx(w, s), w.name = n.createUniqueName(s.name || "mesh_" + t), Wn(w, s), A.extensions && Wr(l, w, A), n.assignFinalMaterial(w), y.push(w);
      }
      for (let _ = 0, k = y.length; _ < k; _++)
        n.associations.set(y[_], {
          meshes: t,
          primitives: _
        });
      if (y.length === 1)
        return s.extensions && Wr(l, y[0], s), y[0];
      const v = new tc();
      s.extensions && Wr(l, v, s), n.associations.set(v, { meshes: t });
      for (let _ = 0, k = y.length; _ < k; _++)
        v.add(y[_]);
      return v;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   * @param {number} cameraIndex
   * @return {Promise<THREE.Camera>}
   */
  loadCamera(t) {
    let n;
    const o = this.json.cameras[t], l = o[o.type];
    if (!l) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }
    return o.type === "perspective" ? n = new vS(_g.radToDeg(l.yfov), l.aspectRatio || 1, l.znear || 1, l.zfar || 2e6) : o.type === "orthographic" && (n = new SS(-l.xmag, l.xmag, l.ymag, -l.ymag, l.znear, l.zfar)), o.name && (n.name = this.createUniqueName(o.name)), Wn(n, o), Promise.resolve(n);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Skeleton>}
   */
  loadSkin(t) {
    const n = this.json.skins[t], o = [];
    for (let l = 0, s = n.joints.length; l < s; l++)
      o.push(this._loadNodeShallow(n.joints[l]));
    return n.inverseBindMatrices !== void 0 ? o.push(this.getDependency("accessor", n.inverseBindMatrices)) : o.push(null), Promise.all(o).then(function(l) {
      const s = l.pop(), a = l, d = [], p = [];
      for (let m = 0, g = a.length; m < g; m++) {
        const y = a[m];
        if (y) {
          d.push(y);
          const v = new bs();
          s !== null && v.fromArray(s.array, m * 16), p.push(v);
        } else
          console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', n.joints[m]);
      }
      return new wS(d, p);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */
  loadAnimation(t) {
    const n = this.json, o = this, l = n.animations[t], s = l.name ? l.name : "animation_" + t, a = [], d = [], p = [], m = [], g = [];
    for (let y = 0, v = l.channels.length; y < v; y++) {
      const _ = l.channels[y], k = l.samplers[_.sampler], R = _.target, A = R.node, w = l.parameters !== void 0 ? l.parameters[k.input] : k.input, S = l.parameters !== void 0 ? l.parameters[k.output] : k.output;
      R.node !== void 0 && (a.push(this.getDependency("node", A)), d.push(this.getDependency("accessor", w)), p.push(this.getDependency("accessor", S)), m.push(k), g.push(R));
    }
    return Promise.all([
      Promise.all(a),
      Promise.all(d),
      Promise.all(p),
      Promise.all(m),
      Promise.all(g)
    ]).then(function(y) {
      const v = y[0], _ = y[1], k = y[2], R = y[3], A = y[4], w = [];
      for (let S = 0, E = v.length; S < E; S++) {
        const C = v[S], I = _[S], O = k[S], D = R[S], H = A[S];
        if (C === void 0) continue;
        C.updateMatrix && C.updateMatrix();
        const J = o._createAnimationTracks(C, I, O, D, H);
        if (J)
          for (let W = 0; W < J.length; W++)
            w.push(J[W]);
      }
      return new _S(s, void 0, w);
    });
  }
  createNodeMesh(t) {
    const n = this.json, o = this, l = n.nodes[t];
    return l.mesh === void 0 ? null : o.getDependency("mesh", l.mesh).then(function(s) {
      const a = o._getNodeRef(o.meshCache, l.mesh, s);
      return l.weights !== void 0 && a.traverse(function(d) {
        if (d.isMesh)
          for (let p = 0, m = l.weights.length; p < m; p++)
            d.morphTargetInfluences[p] = l.weights[p];
      }), a;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */
  loadNode(t) {
    const n = this.json, o = this, l = n.nodes[t], s = o._loadNodeShallow(t), a = [], d = l.children || [];
    for (let m = 0, g = d.length; m < g; m++)
      a.push(o.getDependency("node", d[m]));
    const p = l.skin === void 0 ? Promise.resolve(null) : o.getDependency("skin", l.skin);
    return Promise.all([
      s,
      Promise.all(a),
      p
    ]).then(function(m) {
      const g = m[0], y = m[1], v = m[2];
      v !== null && g.traverse(function(_) {
        _.isSkinnedMesh && _.bind(v, Lx);
      });
      for (let _ = 0, k = y.length; _ < k; _++)
        g.add(y[_]);
      return g;
    });
  }
  // ._loadNodeShallow() parses a single node.
  // skin and child nodes are created and added in .loadNode() (no '_' prefix).
  _loadNodeShallow(t) {
    const n = this.json, o = this.extensions, l = this;
    if (this.nodeCache[t] !== void 0)
      return this.nodeCache[t];
    const s = n.nodes[t], a = s.name ? l.createUniqueName(s.name) : "", d = [], p = l._invokeOne(function(m) {
      return m.createNodeMesh && m.createNodeMesh(t);
    });
    return p && d.push(p), s.camera !== void 0 && d.push(l.getDependency("camera", s.camera).then(function(m) {
      return l._getNodeRef(l.cameraCache, s.camera, m);
    })), l._invokeAll(function(m) {
      return m.createNodeAttachment && m.createNodeAttachment(t);
    }).forEach(function(m) {
      d.push(m);
    }), this.nodeCache[t] = Promise.all(d).then(function(m) {
      let g;
      if (s.isBone === !0 ? g = new ES() : m.length > 1 ? g = new tc() : m.length === 1 ? g = m[0] : g = new gg(), g !== m[0])
        for (let y = 0, v = m.length; y < v; y++)
          g.add(m[y]);
      if (s.name && (g.userData.name = s.name, g.name = a), Wn(g, s), s.extensions && Wr(o, g, s), s.matrix !== void 0) {
        const y = new bs();
        y.fromArray(s.matrix), g.applyMatrix4(y);
      } else
        s.translation !== void 0 && g.position.fromArray(s.translation), s.rotation !== void 0 && g.quaternion.fromArray(s.rotation), s.scale !== void 0 && g.scale.fromArray(s.scale);
      return l.associations.has(g) || l.associations.set(g, {}), l.associations.get(g).nodes = t, g;
    }), this.nodeCache[t];
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   * @param {number} sceneIndex
   * @return {Promise<Group>}
   */
  loadScene(t) {
    const n = this.extensions, o = this.json.scenes[t], l = this, s = new tc();
    o.name && (s.name = l.createUniqueName(o.name)), Wn(s, o), o.extensions && Wr(n, s, o);
    const a = o.nodes || [], d = [];
    for (let p = 0, m = a.length; p < m; p++)
      d.push(l.getDependency("node", a[p]));
    return Promise.all(d).then(function(p) {
      for (let g = 0, y = p.length; g < y; g++)
        s.add(p[g]);
      const m = (g) => {
        const y = /* @__PURE__ */ new Map();
        for (const [v, _] of l.associations)
          (v instanceof ec || v instanceof Nh) && y.set(v, _);
        return g.traverse((v) => {
          const _ = l.associations.get(v);
          _ != null && y.set(v, _);
        }), y;
      };
      return l.associations = m(s), s;
    });
  }
  _createAnimationTracks(t, n, o, l, s) {
    const a = [], d = t.name ? t.name : t.uuid, p = [];
    ar[s.path] === ar.weights ? t.traverse(function(v) {
      v.morphTargetInfluences && p.push(v.name ? v.name : v.uuid);
    }) : p.push(d);
    let m;
    switch (ar[s.path]) {
      case ar.weights:
        m = zh;
        break;
      case ar.rotation:
        m = Ih;
        break;
      case ar.position:
      case ar.scale:
        m = Mh;
        break;
      default:
        switch (o.itemSize) {
          case 1:
            m = zh;
            break;
          case 2:
          case 3:
          default:
            m = Mh;
            break;
        }
        break;
    }
    const g = l.interpolation !== void 0 ? kx[l.interpolation] : Eg, y = this._getArrayFromAccessor(o);
    for (let v = 0, _ = p.length; v < _; v++) {
      const k = new m(
        p[v] + "." + ar[s.path],
        n.array,
        y,
        g
      );
      l.interpolation === "CUBICSPLINE" && this._createCubicSplineTrackInterpolant(k), a.push(k);
    }
    return a;
  }
  _getArrayFromAccessor(t) {
    let n = t.array;
    if (t.normalized) {
      const o = Gf(n.constructor), l = new Float32Array(n.length);
      for (let s = 0, a = n.length; s < a; s++)
        l[s] = n[s] * o;
      n = l;
    }
    return n;
  }
  _createCubicSplineTrackInterpolant(t) {
    t.createInterpolant = function(o) {
      const l = this instanceof Ih ? xx : l0;
      return new l(this.times, this.values, this.getValueSize() / 3, o);
    }, t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function Mx(e, t, n) {
  const o = t.attributes, l = new PS();
  if (o.POSITION !== void 0) {
    const d = n.json.accessors[o.POSITION], p = d.min, m = d.max;
    if (p !== void 0 && m !== void 0) {
      if (l.set(
        new at(p[0], p[1], p[2]),
        new at(m[0], m[1], m[2])
      ), d.normalized) {
        const g = Gf(Ki[d.componentType]);
        l.min.multiplyScalar(g), l.max.multiplyScalar(g);
      }
    } else {
      console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      return;
    }
  } else
    return;
  const s = t.targets;
  if (s !== void 0) {
    const d = new at(), p = new at();
    for (let m = 0, g = s.length; m < g; m++) {
      const y = s[m];
      if (y.POSITION !== void 0) {
        const v = n.json.accessors[y.POSITION], _ = v.min, k = v.max;
        if (_ !== void 0 && k !== void 0) {
          if (p.setX(Math.max(Math.abs(_[0]), Math.abs(k[0]))), p.setY(Math.max(Math.abs(_[1]), Math.abs(k[1]))), p.setZ(Math.max(Math.abs(_[2]), Math.abs(k[2]))), v.normalized) {
            const R = Gf(Ki[v.componentType]);
            p.multiplyScalar(R);
          }
          d.max(p);
        } else
          console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      }
    }
    l.expandByVector(d);
  }
  e.boundingBox = l;
  const a = new CS();
  l.getCenter(a.center), a.radius = l.min.distanceTo(l.max) / 2, e.boundingSphere = a;
}
function fg(e, t, n) {
  const o = t.attributes, l = [];
  function s(a, d) {
    return n.getDependency("accessor", a).then(function(p) {
      e.setAttribute(d, p);
    });
  }
  for (const a in o) {
    const d = Vf[a] || a.toLowerCase();
    d in e.attributes || l.push(s(o[a], d));
  }
  if (t.indices !== void 0 && !e.index) {
    const a = n.getDependency("accessor", t.indices).then(function(d) {
      e.setIndex(d);
    });
    l.push(a);
  }
  return Qc.workingColorSpace !== zn && "COLOR_0" in o && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Qc.workingColorSpace}" not supported.`), Wn(e, t), Mx(e, t, n), Promise.all(l).then(function() {
    return t.targets !== void 0 ? Px(e, t.targets, n) : e;
  });
}
const Uc = /* @__PURE__ */ new WeakMap();
class zx extends mg {
  constructor(t) {
    super(t), this.decoderPath = "", this.decoderConfig = {}, this.decoderBinary = null, this.decoderPending = null, this.workerLimit = 4, this.workerPool = [], this.workerNextTaskID = 1, this.workerSourceURL = "", this.defaultAttributeIDs = {
      position: "POSITION",
      normal: "NORMAL",
      color: "COLOR",
      uv: "TEX_COORD"
    }, this.defaultAttributeTypes = {
      position: "Float32Array",
      normal: "Float32Array",
      color: "Float32Array",
      uv: "Float32Array"
    };
  }
  setDecoderPath(t) {
    return this.decoderPath = t, this;
  }
  setDecoderConfig(t) {
    return this.decoderConfig = t, this;
  }
  setWorkerLimit(t) {
    return this.workerLimit = t, this;
  }
  load(t, n, o, l) {
    const s = new $s(this.manager);
    s.setPath(this.path), s.setResponseType("arraybuffer"), s.setRequestHeader(this.requestHeader), s.setWithCredentials(this.withCredentials), s.load(t, (a) => {
      this.parse(a, n, l);
    }, o, l);
  }
  parse(t, n, o = () => {
  }) {
    this.decodeDracoFile(t, n, null, null, yr, o).catch(o);
  }
  decodeDracoFile(t, n, o, l, s = zn, a = () => {
  }) {
    const d = {
      attributeIDs: o || this.defaultAttributeIDs,
      attributeTypes: l || this.defaultAttributeTypes,
      useUniqueIDs: !!o,
      vertexColorSpace: s
    };
    return this.decodeGeometry(t, d).then(n).catch(a);
  }
  decodeGeometry(t, n) {
    const o = JSON.stringify(n);
    if (Uc.has(t)) {
      const p = Uc.get(t);
      if (p.key === o)
        return p.promise;
      if (t.byteLength === 0)
        throw new Error(
          "THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred."
        );
    }
    let l;
    const s = this.workerNextTaskID++, a = t.byteLength, d = this._getWorker(s, a).then((p) => (l = p, new Promise((m, g) => {
      l._callbacks[s] = { resolve: m, reject: g }, l.postMessage({ type: "decode", id: s, taskConfig: n, buffer: t }, [t]);
    }))).then((p) => this._createGeometry(p.geometry));
    return d.catch(() => !0).then(() => {
      l && s && this._releaseTask(l, s);
    }), Uc.set(t, {
      key: o,
      promise: d
    }), d;
  }
  _createGeometry(t) {
    const n = new wg();
    t.index && n.setIndex(new Go(t.index.array, 1));
    for (let o = 0; o < t.attributes.length; o++) {
      const l = t.attributes[o], s = l.name, a = l.array, d = l.itemSize, p = new Go(a, d);
      s === "color" && (this._assignVertexColorSpace(p, l.vertexColorSpace), p.normalized = !(a instanceof Float32Array)), n.setAttribute(s, p);
    }
    return n;
  }
  _assignVertexColorSpace(t, n) {
    if (n !== yr) return;
    const o = new Pr();
    for (let l = 0, s = t.count; l < s; l++)
      o.fromBufferAttribute(t, l), Qc.toWorkingColorSpace(o, yr), t.setXYZ(l, o.r, o.g, o.b);
  }
  _loadLibrary(t, n) {
    const o = new $s(this.manager);
    return o.setPath(this.decoderPath), o.setResponseType(n), o.setWithCredentials(this.withCredentials), new Promise((l, s) => {
      o.load(t, l, void 0, s);
    });
  }
  preload() {
    return this._initDecoder(), this;
  }
  _initDecoder() {
    if (this.decoderPending) return this.decoderPending;
    const t = typeof WebAssembly != "object" || this.decoderConfig.type === "js", n = [];
    return t ? n.push(this._loadLibrary("draco_decoder.js", "text")) : (n.push(this._loadLibrary("draco_wasm_wrapper.js", "text")), n.push(this._loadLibrary("draco_decoder.wasm", "arraybuffer"))), this.decoderPending = Promise.all(n).then((o) => {
      const l = o[0];
      t || (this.decoderConfig.wasmBinary = o[1]);
      const s = Ix.toString(), a = [
        "/* draco decoder */",
        l,
        "",
        "/* worker */",
        s.substring(s.indexOf("{") + 1, s.lastIndexOf("}"))
      ].join(`
`);
      this.workerSourceURL = URL.createObjectURL(new Blob([a]));
    }), this.decoderPending;
  }
  _getWorker(t, n) {
    return this._initDecoder().then(() => {
      if (this.workerPool.length < this.workerLimit) {
        const l = new Worker(this.workerSourceURL);
        l._callbacks = {}, l._taskCosts = {}, l._taskLoad = 0, l.postMessage({ type: "init", decoderConfig: this.decoderConfig }), l.onmessage = function(s) {
          const a = s.data;
          switch (a.type) {
            case "decode":
              l._callbacks[a.id].resolve(a);
              break;
            case "error":
              l._callbacks[a.id].reject(a);
              break;
            default:
              console.error('THREE.DRACOLoader: Unexpected message, "' + a.type + '"');
          }
        }, this.workerPool.push(l);
      } else
        this.workerPool.sort(function(l, s) {
          return l._taskLoad > s._taskLoad ? -1 : 1;
        });
      const o = this.workerPool[this.workerPool.length - 1];
      return o._taskCosts[t] = n, o._taskLoad += n, o;
    });
  }
  _releaseTask(t, n) {
    t._taskLoad -= t._taskCosts[n], delete t._callbacks[n], delete t._taskCosts[n];
  }
  debug() {
    console.log("Task load: ", this.workerPool.map((t) => t._taskLoad));
  }
  dispose() {
    for (let t = 0; t < this.workerPool.length; ++t)
      this.workerPool[t].terminate();
    return this.workerPool.length = 0, this.workerSourceURL !== "" && URL.revokeObjectURL(this.workerSourceURL), this;
  }
}
function Ix() {
  let e, t;
  onmessage = function(a) {
    const d = a.data;
    switch (d.type) {
      case "init":
        e = d.decoderConfig, t = new Promise(function(g) {
          e.onModuleLoaded = function(y) {
            g({ draco: y });
          }, DracoDecoderModule(e);
        });
        break;
      case "decode":
        const p = d.buffer, m = d.taskConfig;
        t.then((g) => {
          const y = g.draco, v = new y.Decoder();
          try {
            const _ = n(y, v, new Int8Array(p), m), k = _.attributes.map((R) => R.array.buffer);
            _.index && k.push(_.index.array.buffer), self.postMessage({ type: "decode", id: d.id, geometry: _ }, k);
          } catch (_) {
            console.error(_), self.postMessage({ type: "error", id: d.id, error: _.message });
          } finally {
            y.destroy(v);
          }
        });
        break;
    }
  };
  function n(a, d, p, m) {
    const g = m.attributeIDs, y = m.attributeTypes;
    let v, _;
    const k = d.GetEncodedGeometryType(p);
    if (k === a.TRIANGULAR_MESH)
      v = new a.Mesh(), _ = d.DecodeArrayToMesh(p, p.byteLength, v);
    else if (k === a.POINT_CLOUD)
      v = new a.PointCloud(), _ = d.DecodeArrayToPointCloud(p, p.byteLength, v);
    else
      throw new Error("THREE.DRACOLoader: Unexpected geometry type.");
    if (!_.ok() || v.ptr === 0)
      throw new Error("THREE.DRACOLoader: Decoding failed: " + _.error_msg());
    const R = { index: null, attributes: [] };
    for (const A in g) {
      const w = self[y[A]];
      let S, E;
      if (m.useUniqueIDs)
        E = g[A], S = d.GetAttributeByUniqueId(v, E);
      else {
        if (E = d.GetAttributeId(v, a[g[A]]), E === -1) continue;
        S = d.GetAttribute(v, E);
      }
      const C = l(a, d, v, A, w, S);
      A === "color" && (C.vertexColorSpace = m.vertexColorSpace), R.attributes.push(C);
    }
    return k === a.TRIANGULAR_MESH && (R.index = o(a, d, v)), a.destroy(v), R;
  }
  function o(a, d, p) {
    const g = p.num_faces() * 3, y = g * 4, v = a._malloc(y);
    d.GetTrianglesUInt32Array(p, y, v);
    const _ = new Uint32Array(a.HEAPF32.buffer, v, g).slice();
    return a._free(v), { array: _, itemSize: 1 };
  }
  function l(a, d, p, m, g, y) {
    const v = y.num_components(), k = p.num_points() * v, R = k * g.BYTES_PER_ELEMENT, A = s(a, g), w = a._malloc(R);
    d.GetAttributeDataArrayForAllPoints(p, y, A, R, w);
    const S = new g(a.HEAPF32.buffer, w, k).slice();
    return a._free(w), {
      name: m,
      array: S,
      itemSize: v
    };
  }
  function s(a, d) {
    switch (d) {
      case Float32Array:
        return a.DT_FLOAT32;
      case Int8Array:
        return a.DT_INT8;
      case Int16Array:
        return a.DT_INT16;
      case Int32Array:
        return a.DT_INT32;
      case Uint8Array:
        return a.DT_UINT8;
      case Uint16Array:
        return a.DT_UINT16;
      case Uint32Array:
        return a.DT_UINT32;
    }
  }
}
const s0 = new zx();
s0.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
function Ox({ path: e, onSize: t }) {
  const n = Hd($E, e, (s) => {
    s.setDRACOLoader(s0);
  }), { obj: o, size: l } = Q.useMemo(() => {
    const s = n.scene.clone(!0), a = new he.Box3().setFromObject(s), d = a.getSize(new he.Vector3());
    return s.position.sub(a.getCenter(new he.Vector3())), s.position.y += d.y / 2, { obj: s, size: d };
  }, [n]);
  return Q.useLayoutEffect(() => {
    t(l);
  }, [l]), /* @__PURE__ */ q.jsx("primitive", { object: o });
}
function Dx({ dims: e }) {
  const t = Q.useRef(null);
  Vu(() => {
    t.current.rotation.y += 5e-3;
  });
  const [n, o, l] = [e.w / 10, e.h / 10, e.d / 10];
  return /* @__PURE__ */ q.jsxs("mesh", { ref: t, position: [0, o / 2, 0], children: [
    /* @__PURE__ */ q.jsx("boxGeometry", { args: [n, o, l] }),
    /* @__PURE__ */ q.jsx("meshStandardMaterial", { color: "#2255aa", opacity: 0.55, transparent: !0 })
  ] });
}
function jx() {
  const e = Q.useRef(null);
  return Vu(({ clock: t }) => {
    e.current.rotation.y = t.getElapsedTime() * 2;
  }), /* @__PURE__ */ q.jsxs("mesh", { ref: e, children: [
    /* @__PURE__ */ q.jsx("torusGeometry", { args: [12, 3, 8, 24] }),
    /* @__PURE__ */ q.jsx("meshStandardMaterial", { color: "#ffd700", wireframe: !0 })
  ] });
}
const dg = { type: "change" }, Wd = { type: "start" }, u0 = { type: "end" }, Fs = new AS(), pg = new LS(), Fx = Math.cos(70 * _g.DEG2RAD), Be = new at(), Tt = 2 * Math.PI, ge = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, Hc = 1e-6;
class Ux extends RS {
  constructor(t, n = null) {
    super(t, n), this.state = ge.NONE, this.enabled = !0, this.target = new at(), this.cursor = new at(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: Fi.ROTATE, MIDDLE: Fi.DOLLY, RIGHT: Fi.PAN }, this.touches = { ONE: ki.ROTATE, TWO: ki.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new at(), this._lastQuaternion = new eu(), this._lastTargetPosition = new at(), this._quat = new eu().setFromUnitVectors(t.up, new at(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Oh(), this._sphericalDelta = new Oh(), this._scale = 1, this._panOffset = new at(), this._rotateStart = new Ft(), this._rotateEnd = new Ft(), this._rotateDelta = new Ft(), this._panStart = new Ft(), this._panEnd = new Ft(), this._panDelta = new Ft(), this._dollyStart = new Ft(), this._dollyEnd = new Ft(), this._dollyDelta = new Ft(), this._dollyDirection = new at(), this._mouse = new Ft(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = Bx.bind(this), this._onPointerDown = Hx.bind(this), this._onPointerUp = Wx.bind(this), this._onContextMenu = Zx.bind(this), this._onMouseWheel = Kx.bind(this), this._onKeyDown = Qx.bind(this), this._onTouchStart = Xx.bind(this), this._onTouchMove = Yx.bind(this), this._onMouseDown = Vx.bind(this), this._onMouseMove = Gx.bind(this), this._interceptControlDown = Jx.bind(this), this._interceptControlUp = qx.bind(this), this.domElement !== null && this.connect(), this.update();
  }
  connect() {
    this.domElement.addEventListener("pointerdown", this._onPointerDown), this.domElement.addEventListener("pointercancel", this._onPointerUp), this.domElement.addEventListener("contextmenu", this._onContextMenu), this.domElement.addEventListener("wheel", this._onMouseWheel, { passive: !1 }), this.domElement.getRootNode().addEventListener("keydown", this._interceptControlDown, { passive: !0, capture: !0 }), this.domElement.style.touchAction = "none";
  }
  disconnect() {
    this.domElement.removeEventListener("pointerdown", this._onPointerDown), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.domElement.removeEventListener("pointercancel", this._onPointerUp), this.domElement.removeEventListener("wheel", this._onMouseWheel), this.domElement.removeEventListener("contextmenu", this._onContextMenu), this.stopListenToKeyEvents(), this.domElement.getRootNode().removeEventListener("keydown", this._interceptControlDown, { capture: !0 }), this.domElement.style.touchAction = "auto";
  }
  dispose() {
    this.disconnect();
  }
  getPolarAngle() {
    return this._spherical.phi;
  }
  getAzimuthalAngle() {
    return this._spherical.theta;
  }
  getDistance() {
    return this.object.position.distanceTo(this.target);
  }
  listenToKeyEvents(t) {
    t.addEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = t;
  }
  stopListenToKeyEvents() {
    this._domElementKeyEvents !== null && (this._domElementKeyEvents.removeEventListener("keydown", this._onKeyDown), this._domElementKeyEvents = null);
  }
  saveState() {
    this.target0.copy(this.target), this.position0.copy(this.object.position), this.zoom0 = this.object.zoom;
  }
  reset() {
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(dg), this.update(), this.state = ge.NONE;
  }
  update(t = null) {
    const n = this.object.position;
    Be.copy(n).sub(this.target), Be.applyQuaternion(this._quat), this._spherical.setFromVector3(Be), this.autoRotate && this.state === ge.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let o = this.minAzimuthAngle, l = this.maxAzimuthAngle;
    isFinite(o) && isFinite(l) && (o < -Math.PI ? o += Tt : o > Math.PI && (o -= Tt), l < -Math.PI ? l += Tt : l > Math.PI && (l -= Tt), o <= l ? this._spherical.theta = Math.max(o, Math.min(l, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (o + l) / 2 ? Math.max(o, this._spherical.theta) : Math.min(l, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let s = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const a = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), s = a != this._spherical.radius;
    }
    if (Be.setFromSpherical(this._spherical), Be.applyQuaternion(this._quatInverse), n.copy(this.target).add(Be), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let a = null;
      if (this.object.isPerspectiveCamera) {
        const d = Be.length();
        a = this._clampDistance(d * this._scale);
        const p = d - a;
        this.object.position.addScaledVector(this._dollyDirection, p), this.object.updateMatrixWorld(), s = !!p;
      } else if (this.object.isOrthographicCamera) {
        const d = new at(this._mouse.x, this._mouse.y, 0);
        d.unproject(this.object);
        const p = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), s = p !== this.object.zoom;
        const m = new at(this._mouse.x, this._mouse.y, 0);
        m.unproject(this.object), this.object.position.sub(m).add(d), this.object.updateMatrixWorld(), a = Be.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      a !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position) : (Fs.origin.copy(this.object.position), Fs.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(Fs.direction)) < Fx ? this.object.lookAt(this.target) : (pg.setFromNormalAndCoplanarPoint(this.object.up, this.target), Fs.intersectPlane(pg, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const a = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), a !== this.object.zoom && (this.object.updateProjectionMatrix(), s = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, s || this._lastPosition.distanceToSquared(this.object.position) > Hc || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > Hc || this._lastTargetPosition.distanceToSquared(this.target) > Hc ? (this.dispatchEvent(dg), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? Tt / 60 * this.autoRotateSpeed * t : Tt / 60 / 60 * this.autoRotateSpeed;
  }
  _getZoomScale(t) {
    const n = Math.abs(t * 0.01);
    return Math.pow(0.95, this.zoomSpeed * n);
  }
  _rotateLeft(t) {
    this._sphericalDelta.theta -= t;
  }
  _rotateUp(t) {
    this._sphericalDelta.phi -= t;
  }
  _panLeft(t, n) {
    Be.setFromMatrixColumn(n, 0), Be.multiplyScalar(-t), this._panOffset.add(Be);
  }
  _panUp(t, n) {
    this.screenSpacePanning === !0 ? Be.setFromMatrixColumn(n, 1) : (Be.setFromMatrixColumn(n, 0), Be.crossVectors(this.object.up, Be)), Be.multiplyScalar(t), this._panOffset.add(Be);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, n) {
    const o = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const l = this.object.position;
      Be.copy(l).sub(this.target);
      let s = Be.length();
      s *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * s / o.clientHeight, this.object.matrix), this._panUp(2 * n * s / o.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / o.clientWidth, this.object.matrix), this._panUp(n * (this.object.top - this.object.bottom) / this.object.zoom / o.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
  }
  _dollyOut(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale /= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _dollyIn(t) {
    this.object.isPerspectiveCamera || this.object.isOrthographicCamera ? this._scale *= t : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), this.enableZoom = !1);
  }
  _updateZoomParameters(t, n) {
    if (!this.zoomToCursor)
      return;
    this._performCursorZoom = !0;
    const o = this.domElement.getBoundingClientRect(), l = t - o.left, s = n - o.top, a = o.width, d = o.height;
    this._mouse.x = l / a * 2 - 1, this._mouse.y = -(s / d) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
  }
  _clampDistance(t) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, t));
  }
  //
  // event callbacks - update the object state
  //
  _handleMouseDownRotate(t) {
    this._rotateStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownDolly(t) {
    this._updateZoomParameters(t.clientX, t.clientX), this._dollyStart.set(t.clientX, t.clientY);
  }
  _handleMouseDownPan(t) {
    this._panStart.set(t.clientX, t.clientY);
  }
  _handleMouseMoveRotate(t) {
    this._rotateEnd.set(t.clientX, t.clientY), this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n = this.domElement;
    this._rotateLeft(Tt * this._rotateDelta.x / n.clientHeight), this._rotateUp(Tt * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
  }
  _handleMouseMoveDolly(t) {
    this._dollyEnd.set(t.clientX, t.clientY), this._dollyDelta.subVectors(this._dollyEnd, this._dollyStart), this._dollyDelta.y > 0 ? this._dollyOut(this._getZoomScale(this._dollyDelta.y)) : this._dollyDelta.y < 0 && this._dollyIn(this._getZoomScale(this._dollyDelta.y)), this._dollyStart.copy(this._dollyEnd), this.update();
  }
  _handleMouseMovePan(t) {
    this._panEnd.set(t.clientX, t.clientY), this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd), this.update();
  }
  _handleMouseWheel(t) {
    this._updateZoomParameters(t.clientX, t.clientY), t.deltaY < 0 ? this._dollyIn(this._getZoomScale(t.deltaY)) : t.deltaY > 0 && this._dollyOut(this._getZoomScale(t.deltaY)), this.update();
  }
  _handleKeyDown(t) {
    let n = !1;
    switch (t.code) {
      case this.keys.UP:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateUp(Tt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(0, this.keyPanSpeed), n = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateUp(-Tt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(0, -this.keyPanSpeed), n = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateLeft(Tt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(this.keyPanSpeed, 0), n = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateLeft(-Tt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(-this.keyPanSpeed, 0), n = !0;
        break;
    }
    n && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + n.x), l = 0.5 * (t.pageY + n.y);
      this._rotateStart.set(o, l);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + n.x), l = 0.5 * (t.pageY + n.y);
      this._panStart.set(o, l);
    }
  }
  _handleTouchStartDolly(t) {
    const n = this._getSecondPointerPosition(t), o = t.pageX - n.x, l = t.pageY - n.y, s = Math.sqrt(o * o + l * l);
    this._dollyStart.set(0, s);
  }
  _handleTouchStartDollyPan(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enablePan && this._handleTouchStartPan(t);
  }
  _handleTouchStartDollyRotate(t) {
    this.enableZoom && this._handleTouchStartDolly(t), this.enableRotate && this._handleTouchStartRotate(t);
  }
  _handleTouchMoveRotate(t) {
    if (this._pointers.length == 1)
      this._rotateEnd.set(t.pageX, t.pageY);
    else {
      const o = this._getSecondPointerPosition(t), l = 0.5 * (t.pageX + o.x), s = 0.5 * (t.pageY + o.y);
      this._rotateEnd.set(l, s);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n = this.domElement;
    this._rotateLeft(Tt * this._rotateDelta.x / n.clientHeight), this._rotateUp(Tt * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + n.x), l = 0.5 * (t.pageY + n.y);
      this._panEnd.set(o, l);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const n = this._getSecondPointerPosition(t), o = t.pageX - n.x, l = t.pageY - n.y, s = Math.sqrt(o * o + l * l);
    this._dollyEnd.set(0, s), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
    const a = (t.pageX + n.x) * 0.5, d = (t.pageY + n.y) * 0.5;
    this._updateZoomParameters(a, d);
  }
  _handleTouchMoveDollyPan(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enablePan && this._handleTouchMovePan(t);
  }
  _handleTouchMoveDollyRotate(t) {
    this.enableZoom && this._handleTouchMoveDolly(t), this.enableRotate && this._handleTouchMoveRotate(t);
  }
  // pointers
  _addPointer(t) {
    this._pointers.push(t.pointerId);
  }
  _removePointer(t) {
    delete this._pointerPositions[t.pointerId];
    for (let n = 0; n < this._pointers.length; n++)
      if (this._pointers[n] == t.pointerId) {
        this._pointers.splice(n, 1);
        return;
      }
  }
  _isTrackingPointer(t) {
    for (let n = 0; n < this._pointers.length; n++)
      if (this._pointers[n] == t.pointerId) return !0;
    return !1;
  }
  _trackPointer(t) {
    let n = this._pointerPositions[t.pointerId];
    n === void 0 && (n = new Ft(), this._pointerPositions[t.pointerId] = n), n.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const n = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[n];
  }
  //
  _customWheelEvent(t) {
    const n = t.deltaMode, o = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (n) {
      case 1:
        o.deltaY *= 16;
        break;
      case 2:
        o.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (o.deltaY *= 10), o;
  }
}
function Hx(e) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e)));
}
function Bx(e) {
  this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function Wx(e) {
  switch (this._removePointer(e), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(e.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(u0), this.state = ge.NONE;
      break;
    case 1:
      const t = this._pointers[0], n = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: n.x, pageY: n.y });
      break;
  }
}
function Vx(e) {
  let t;
  switch (e.button) {
    case 0:
      t = this.mouseButtons.LEFT;
      break;
    case 1:
      t = this.mouseButtons.MIDDLE;
      break;
    case 2:
      t = this.mouseButtons.RIGHT;
      break;
    default:
      t = -1;
  }
  switch (t) {
    case Fi.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(e), this.state = ge.DOLLY;
      break;
    case Fi.ROTATE:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = ge.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = ge.ROTATE;
      }
      break;
    case Fi.PAN:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = ge.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = ge.PAN;
      }
      break;
    default:
      this.state = ge.NONE;
  }
  this.state !== ge.NONE && this.dispatchEvent(Wd);
}
function Gx(e) {
  switch (this.state) {
    case ge.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(e);
      break;
    case ge.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(e);
      break;
    case ge.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(e);
      break;
  }
}
function Kx(e) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== ge.NONE || (e.preventDefault(), this.dispatchEvent(Wd), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(u0));
}
function Qx(e) {
  this.enabled === !1 || this.enablePan === !1 || this._handleKeyDown(e);
}
function Xx(e) {
  switch (this._trackPointer(e), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case ki.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(e), this.state = ge.TOUCH_ROTATE;
          break;
        case ki.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(e), this.state = ge.TOUCH_PAN;
          break;
        default:
          this.state = ge.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case ki.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(e), this.state = ge.TOUCH_DOLLY_PAN;
          break;
        case ki.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(e), this.state = ge.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = ge.NONE;
      }
      break;
    default:
      this.state = ge.NONE;
  }
  this.state !== ge.NONE && this.dispatchEvent(Wd);
}
function Yx(e) {
  switch (this._trackPointer(e), this.state) {
    case ge.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(e), this.update();
      break;
    case ge.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(e), this.update();
      break;
    case ge.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(e), this.update();
      break;
    case ge.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(e), this.update();
      break;
    default:
      this.state = ge.NONE;
  }
}
function Zx(e) {
  this.enabled !== !1 && e.preventDefault();
}
function Jx(e) {
  e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function qx(e) {
  e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function $x({ size: e }) {
  const { camera: t, gl: n } = LE(), o = Q.useRef(null);
  return Q.useEffect(() => {
    const l = new Ux(t, n.domElement);
    return l.enableDamping = !0, l.dampingFactor = 0.08, l.autoRotate = !0, l.autoRotateSpeed = 1.5, o.current = l, () => l.dispose();
  }, [t, n]), Q.useEffect(() => {
    if (!o.current) return;
    const l = Math.max(e.x, e.y, e.z), s = t, a = he.MathUtils.degToRad(s.fov), d = l / 2 / Math.tan(a / 2) * 1.9;
    t.position.set(d * 0.6, d * 0.5, d), s.near = Math.max(0.01, d * 0.01), s.far = d * 20, s.updateProjectionMatrix(), o.current.target.set(0, 0, 0), o.current.update();
  }, [e]), Vu(() => {
    var l;
    return (l = o.current) == null ? void 0 : l.update();
  }), null;
}
const en = 45, hn = 47, Pt = 50, we = 1.5, Bc = Pt - we * 2, Wc = en - we * 2;
function bx({ actionState: e, onSize: t }) {
  const n = Q.useRef(null), o = e["freezer-toggle"] ?? !1;
  return Q.useLayoutEffect(() => {
    t(new he.Vector3(hn, Pt, en));
  }, []), Vu(() => {
    const l = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (l - n.current.rotation.y) * 0.12;
  }), // Centré sur X et Z, centré verticalement (décalage -FRZ_H/2)
  /* @__PURE__ */ q.jsxs("group", { position: [0, -Pt / 2, 0], children: [
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: we,
        sy: Pt,
        sz: en,
        x: -hn / 2 + we / 2,
        y: Pt / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: hn,
        sy: we,
        sz: en,
        x: 0,
        y: Pt - we / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: hn,
        sy: we,
        sz: en,
        x: 0,
        y: we / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: hn - we,
        sy: Bc,
        sz: we,
        x: we / 2,
        y: Pt / 2,
        z: -en / 2 + we / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: hn - we,
        sy: Bc,
        sz: we,
        x: we / 2,
        y: Pt / 2,
        z: en / 2 - we / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: 0.5,
        sy: Bc,
        sz: Wc,
        x: -hn / 2 + we + 0.25,
        y: Pt / 2,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: hn - we - 1,
        sy: we,
        sz: Wc,
        x: we / 2 - 0.5,
        y: Pt * 0.35,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ q.jsx(
      cr,
      {
        sx: hn - we - 1,
        sy: we,
        sz: Wc,
        x: we / 2 - 0.5,
        y: Pt * 0.6,
        z: 0,
        col: "#dddddd"
      }
    ),
    [-1, 1].flatMap(
      (l) => [-1, 1].map((s) => /* @__PURE__ */ q.jsxs(
        "mesh",
        {
          position: [s * (hn / 2 - 3), 1, l * (en / 2 - 3)],
          children: [
            /* @__PURE__ */ q.jsx("cylinderGeometry", { args: [1.5, 1.5, 2, 8] }),
            /* @__PURE__ */ q.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
          ]
        },
        `${s}${l}`
      ))
    ),
    /* @__PURE__ */ q.jsxs("group", { ref: n, position: [hn / 2, 0, -en / 2], children: [
      /* @__PURE__ */ q.jsxs("mesh", { position: [0, Pt / 2, en / 2], children: [
        /* @__PURE__ */ q.jsx("boxGeometry", { args: [we, Pt - 2, en - we] }),
        /* @__PURE__ */ q.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.3, metalness: 0.2 })
      ] }),
      /* @__PURE__ */ q.jsxs("mesh", { position: [we / 2 + 0.9, Pt / 2, en - 7], children: [
        /* @__PURE__ */ q.jsx("boxGeometry", { args: [1.5, 25, 1.5] }),
        /* @__PURE__ */ q.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function cr({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: l,
  z: s,
  col: a
}) {
  return /* @__PURE__ */ q.jsxs("mesh", { position: [o, l, s], children: [
    /* @__PURE__ */ q.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ q.jsx("meshStandardMaterial", { color: a, roughness: 0.3, metalness: 0.1 })
  ] });
}
const ek = {
  freezer: bx
}, tk = {
  "freezer-toggle": ["Ouvrir", "Fermer"]
};
function nk({ item: e, actionState: t }) {
  const [n, o] = Q.useState(null), l = Q.useMemo(() => {
    const a = (e == null ? void 0 : e.dims) ?? { w: 50, h: 50, d: 50 };
    return new he.Vector3(a.w / 10, a.h / 10, a.d / 10);
  }, []), s = e != null && e.id ? ek[e.id] : void 0;
  return /* @__PURE__ */ q.jsxs(q.Fragment, { children: [
    /* @__PURE__ */ q.jsx("ambientLight", { intensity: 0.7 }),
    /* @__PURE__ */ q.jsx("directionalLight", { position: [200, 400, 300], intensity: 1.3 }),
    /* @__PURE__ */ q.jsx("directionalLight", { position: [-150, 80, -200], intensity: 0.4 }),
    /* @__PURE__ */ q.jsx($x, { size: n ?? l }),
    s ? (
      // Composant TSX dédié (géométrie procédurale + interactivité)
      /* @__PURE__ */ q.jsx(s, { item: e, actionState: t, onSize: o })
    ) : e != null && e.glbPath ? (
      // Chargement GLB générique
      /* @__PURE__ */ q.jsx(Q.Suspense, { fallback: /* @__PURE__ */ q.jsx(jx, {}), children: /* @__PURE__ */ q.jsx(Ox, { path: e.glbPath, onSize: o }) })
    ) : e ? (
      // Fallback : boîte aux dimensions de l'inventaire
      /* @__PURE__ */ q.jsx(Dx, { dims: e.dims })
    ) : null
  ] });
}
function rk({ item: e, onAction: t }) {
  var s;
  const [n, o] = Q.useState({});
  Q.useEffect(() => {
    o({});
  }, [e == null ? void 0 : e.id]);
  const l = (a) => {
    o((d) => ({ ...d, [a]: !d[a] })), t == null || t(a);
  };
  return /* @__PURE__ */ q.jsxs("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#111118",
    fontFamily: "'Segoe UI', sans-serif"
  }, children: [
    /* @__PURE__ */ q.jsx("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ q.jsx(
      qE,
      {
        style: { width: "100%", height: "100%" },
        camera: { position: [0, 50, 200], fov: 45 },
        gl: { antialias: !0 },
        children: /* @__PURE__ */ q.jsx(
          nk,
          {
            item: e,
            actionState: n
          },
          (e == null ? void 0 : e.id) ?? "__empty__"
        )
      }
    ) }),
    /* @__PURE__ */ q.jsx("div", { style: {
      fontSize: 11,
      color: "#888",
      textAlign: "center",
      padding: "6px 8px",
      minHeight: 32
    }, children: e ? /* @__PURE__ */ q.jsxs(q.Fragment, { children: [
      /* @__PURE__ */ q.jsx("strong", { style: { color: "#fff" }, children: e.name }),
      e.dims && /* @__PURE__ */ q.jsxs("span", { style: { color: "#666", marginLeft: 6, fontFamily: "monospace" }, children: [
        e.dims.w,
        " × ",
        e.dims.d,
        " × ",
        e.dims.h,
        " cm"
      ] })
    ] }) : "Clique sur un objet" }),
    (s = e == null ? void 0 : e.actions) != null && s.length ? /* @__PURE__ */ q.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 8px 8px" }, children: e.actions.map((a) => {
      const [d, p] = tk[a] ?? [a, a], m = n[a] ?? !1;
      return /* @__PURE__ */ q.jsx(
        "button",
        {
          onClick: () => l(a),
          style: {
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid #555",
            borderRadius: 6,
            color: "#ccc",
            fontSize: 11,
            padding: "4px 12px",
            cursor: "pointer"
          },
          children: m ? p : d
        },
        a
      );
    }) }) : null
  ] });
}
const Pu = /* @__PURE__ */ new WeakMap();
function ok(e, t, n) {
  let o = Pu.get(e);
  o || (o = Ov(e), Pu.set(e, o)), o.render(/* @__PURE__ */ q.jsx(rk, { item: t, onAction: n }));
}
function lk(e) {
  const t = Pu.get(e);
  t && (t.unmount(), Pu.delete(e));
}
export {
  ok as mountPreview,
  lk as unmountPreview
};
