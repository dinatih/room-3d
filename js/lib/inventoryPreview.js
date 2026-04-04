import * as ce from "three";
import { TrianglesDrawMode as aS, TriangleFanDrawMode as rf, TriangleStripDrawMode as Lg, Loader as Ng, LoaderUtils as rl, FileLoader as pu, MeshPhysicalMaterial as Wn, Vector2 as Wt, Color as Dr, LinearSRGBColorSpace as Gn, SRGBColorSpace as Cr, SpotLight as cS, PointLight as fS, DirectionalLight as dS, Matrix4 as hu, Vector3 as pt, Quaternion as mu, InstancedMesh as pS, InstancedBufferAttribute as hS, Object3D as Mg, TextureLoader as mS, ImageBitmapLoader as gS, BufferAttribute as il, InterleavedBuffer as yS, InterleavedBufferAttribute as vS, LinearMipmapLinearFilter as zg, NearestMipmapLinearFilter as SS, LinearMipmapNearestFilter as wS, NearestMipmapNearestFilter as _S, LinearFilter as of, NearestFilter as Ig, RepeatWrapping as lf, MirroredRepeatWrapping as xS, ClampToEdgeWrapping as ES, PointsMaterial as kS, Material as hc, LineBasicMaterial as TS, MeshStandardMaterial as Og, DoubleSide as PS, MeshBasicMaterial as $o, PropertyBinding as CS, BufferGeometry as Dg, SkinnedMesh as RS, Mesh as AS, LineSegments as LS, Line as NS, LineLoop as MS, Points as zS, Group as mc, PerspectiveCamera as IS, MathUtils as jg, OrthographicCamera as OS, Skeleton as DS, AnimationClip as jS, Bone as FS, InterpolateDiscrete as US, InterpolateLinear as Fg, Texture as Kh, VectorKeyframeTrack as Qh, NumberKeyframeTrack as Xh, QuaternionKeyframeTrack as Yh, ColorManagement as sf, FrontSide as HS, Interpolant as BS, Box3 as GS, Sphere as WS, Controls as VS, MOUSE as qi, TOUCH as ji, Spherical as Zh, Ray as KS, Plane as QS } from "three";
function XS(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Ug = { exports: {} }, Gu = {}, Hg = { exports: {} }, ue = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Nl = Symbol.for("react.element"), YS = Symbol.for("react.portal"), ZS = Symbol.for("react.fragment"), JS = Symbol.for("react.strict_mode"), qS = Symbol.for("react.profiler"), $S = Symbol.for("react.provider"), bS = Symbol.for("react.context"), ew = Symbol.for("react.forward_ref"), tw = Symbol.for("react.suspense"), nw = Symbol.for("react.memo"), rw = Symbol.for("react.lazy"), Jh = Symbol.iterator;
function iw(e) {
  return e === null || typeof e != "object" ? null : (e = Jh && e[Jh] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Bg = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, Gg = Object.assign, Wg = {};
function ho(e, t, n) {
  this.props = e, this.context = t, this.refs = Wg, this.updater = n || Bg;
}
ho.prototype.isReactComponent = {};
ho.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
ho.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Vg() {
}
Vg.prototype = ho.prototype;
function od(e, t, n) {
  this.props = e, this.context = t, this.refs = Wg, this.updater = n || Bg;
}
var ld = od.prototype = new Vg();
ld.constructor = od;
Gg(ld, ho.prototype);
ld.isPureReactComponent = !0;
var qh = Array.isArray, Kg = Object.prototype.hasOwnProperty, sd = { current: null }, Qg = { key: !0, ref: !0, __self: !0, __source: !0 };
function Xg(e, t, n) {
  var o, l = {}, s = null, a = null;
  if (t != null) for (o in t.ref !== void 0 && (a = t.ref), t.key !== void 0 && (s = "" + t.key), t) Kg.call(t, o) && !Qg.hasOwnProperty(o) && (l[o] = t[o]);
  var f = arguments.length - 2;
  if (f === 1) l.children = n;
  else if (1 < f) {
    for (var p = Array(f), m = 0; m < f; m++) p[m] = arguments[m + 2];
    l.children = p;
  }
  if (e && e.defaultProps) for (o in f = e.defaultProps, f) l[o] === void 0 && (l[o] = f[o]);
  return { $$typeof: Nl, type: e, key: s, ref: a, props: l, _owner: sd.current };
}
function ow(e, t) {
  return { $$typeof: Nl, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function ud(e) {
  return typeof e == "object" && e !== null && e.$$typeof === Nl;
}
function lw(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var $h = /\/+/g;
function gc(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? lw("" + e.key) : t.toString(36);
}
function eu(e, t, n, o, l) {
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
        case Nl:
        case YS:
          a = !0;
      }
  }
  if (a) return a = e, l = l(a), e = o === "" ? "." + gc(a, 0) : o, qh(l) ? (n = "", e != null && (n = e.replace($h, "$&/") + "/"), eu(l, t, n, "", function(m) {
    return m;
  })) : l != null && (ud(l) && (l = ow(l, n + (!l.key || a && a.key === l.key ? "" : ("" + l.key).replace($h, "$&/") + "/") + e)), t.push(l)), 1;
  if (a = 0, o = o === "" ? "." : o + ":", qh(e)) for (var f = 0; f < e.length; f++) {
    s = e[f];
    var p = o + gc(s, f);
    a += eu(s, t, n, p, l);
  }
  else if (p = iw(e), typeof p == "function") for (e = p.call(e), f = 0; !(s = e.next()).done; ) s = s.value, p = o + gc(s, f++), a += eu(s, t, n, p, l);
  else if (s === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return a;
}
function zs(e, t, n) {
  if (e == null) return e;
  var o = [], l = 0;
  return eu(e, o, "", "", function(s) {
    return t.call(n, s, l++);
  }), o;
}
function sw(e) {
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
var wt = { current: null }, tu = { transition: null }, uw = { ReactCurrentDispatcher: wt, ReactCurrentBatchConfig: tu, ReactCurrentOwner: sd };
function Yg() {
  throw Error("act(...) is not supported in production builds of React.");
}
ue.Children = { map: zs, forEach: function(e, t, n) {
  zs(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return zs(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return zs(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!ud(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
ue.Component = ho;
ue.Fragment = ZS;
ue.Profiler = qS;
ue.PureComponent = od;
ue.StrictMode = JS;
ue.Suspense = tw;
ue.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = uw;
ue.act = Yg;
ue.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var o = Gg({}, e.props), l = e.key, s = e.ref, a = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (s = t.ref, a = sd.current), t.key !== void 0 && (l = "" + t.key), e.type && e.type.defaultProps) var f = e.type.defaultProps;
    for (p in t) Kg.call(t, p) && !Qg.hasOwnProperty(p) && (o[p] = t[p] === void 0 && f !== void 0 ? f[p] : t[p]);
  }
  var p = arguments.length - 2;
  if (p === 1) o.children = n;
  else if (1 < p) {
    f = Array(p);
    for (var m = 0; m < p; m++) f[m] = arguments[m + 2];
    o.children = f;
  }
  return { $$typeof: Nl, type: e.type, key: l, ref: s, props: o, _owner: a };
};
ue.createContext = function(e) {
  return e = { $$typeof: bS, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: $S, _context: e }, e.Consumer = e;
};
ue.createElement = Xg;
ue.createFactory = function(e) {
  var t = Xg.bind(null, e);
  return t.type = e, t;
};
ue.createRef = function() {
  return { current: null };
};
ue.forwardRef = function(e) {
  return { $$typeof: ew, render: e };
};
ue.isValidElement = ud;
ue.lazy = function(e) {
  return { $$typeof: rw, _payload: { _status: -1, _result: e }, _init: sw };
};
ue.memo = function(e, t) {
  return { $$typeof: nw, type: e, compare: t === void 0 ? null : t };
};
ue.startTransition = function(e) {
  var t = tu.transition;
  tu.transition = {};
  try {
    e();
  } finally {
    tu.transition = t;
  }
};
ue.unstable_act = Yg;
ue.useCallback = function(e, t) {
  return wt.current.useCallback(e, t);
};
ue.useContext = function(e) {
  return wt.current.useContext(e);
};
ue.useDebugValue = function() {
};
ue.useDeferredValue = function(e) {
  return wt.current.useDeferredValue(e);
};
ue.useEffect = function(e, t) {
  return wt.current.useEffect(e, t);
};
ue.useId = function() {
  return wt.current.useId();
};
ue.useImperativeHandle = function(e, t, n) {
  return wt.current.useImperativeHandle(e, t, n);
};
ue.useInsertionEffect = function(e, t) {
  return wt.current.useInsertionEffect(e, t);
};
ue.useLayoutEffect = function(e, t) {
  return wt.current.useLayoutEffect(e, t);
};
ue.useMemo = function(e, t) {
  return wt.current.useMemo(e, t);
};
ue.useReducer = function(e, t, n) {
  return wt.current.useReducer(e, t, n);
};
ue.useRef = function(e) {
  return wt.current.useRef(e);
};
ue.useState = function(e) {
  return wt.current.useState(e);
};
ue.useSyncExternalStore = function(e, t, n) {
  return wt.current.useSyncExternalStore(e, t, n);
};
ue.useTransition = function() {
  return wt.current.useTransition();
};
ue.version = "18.3.1";
Hg.exports = ue;
var Q = Hg.exports;
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aw = Q, cw = Symbol.for("react.element"), fw = Symbol.for("react.fragment"), dw = Object.prototype.hasOwnProperty, pw = aw.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, hw = { key: !0, ref: !0, __self: !0, __source: !0 };
function Zg(e, t, n) {
  var o, l = {}, s = null, a = null;
  n !== void 0 && (s = "" + n), t.key !== void 0 && (s = "" + t.key), t.ref !== void 0 && (a = t.ref);
  for (o in t) dw.call(t, o) && !hw.hasOwnProperty(o) && (l[o] = t[o]);
  if (e && e.defaultProps) for (o in t = e.defaultProps, t) l[o] === void 0 && (l[o] = t[o]);
  return { $$typeof: cw, type: e, key: s, ref: a, props: l, _owner: pw.current };
}
Gu.Fragment = fw;
Gu.jsx = Zg;
Gu.jsxs = Zg;
Ug.exports = Gu;
var O = Ug.exports, Jg = { exports: {} }, Yt = {}, qg = { exports: {} }, $g = {};
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
  function t(N, U) {
    var F = N.length;
    N.push(U);
    e: for (; 0 < F; ) {
      var Y = F - 1 >>> 1, te = N[Y];
      if (0 < l(te, U)) N[Y] = U, N[F] = te, F = Y;
      else break e;
    }
  }
  function n(N) {
    return N.length === 0 ? null : N[0];
  }
  function o(N) {
    if (N.length === 0) return null;
    var U = N[0], F = N.pop();
    if (F !== U) {
      N[0] = F;
      e: for (var Y = 0, te = N.length, ae = te >>> 1; Y < ae; ) {
        var Ie = 2 * (Y + 1) - 1, it = N[Ie], Xe = Ie + 1, Jt = N[Xe];
        if (0 > l(it, F)) Xe < te && 0 > l(Jt, it) ? (N[Y] = Jt, N[Xe] = F, Y = Xe) : (N[Y] = it, N[Ie] = F, Y = Ie);
        else if (Xe < te && 0 > l(Jt, F)) N[Y] = Jt, N[Xe] = F, Y = Xe;
        else break e;
      }
    }
    return U;
  }
  function l(N, U) {
    var F = N.sortIndex - U.sortIndex;
    return F !== 0 ? F : N.id - U.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var s = performance;
    e.unstable_now = function() {
      return s.now();
    };
  } else {
    var a = Date, f = a.now();
    e.unstable_now = function() {
      return a.now() - f;
    };
  }
  var p = [], m = [], g = 1, y = null, v = 3, _ = !1, k = !1, R = !1, A = typeof setTimeout == "function" ? setTimeout : null, w = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function x(N) {
    for (var U = n(m); U !== null; ) {
      if (U.callback === null) o(m);
      else if (U.startTime <= N) o(m), U.sortIndex = U.expirationTime, t(p, U);
      else break;
      U = n(m);
    }
  }
  function C(N) {
    if (R = !1, x(N), !k) if (n(p) !== null) k = !0, be(I);
    else {
      var U = n(m);
      U !== null && Et(C, U.startTime - N);
    }
  }
  function I(N, U) {
    k = !1, R && (R = !1, w(B), B = -1), _ = !0;
    var F = v;
    try {
      for (x(U), y = n(p); y !== null && (!(y.expirationTime > U) || N && !K()); ) {
        var Y = y.callback;
        if (typeof Y == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = Y(y.expirationTime <= U);
          U = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && o(p), x(U);
        } else o(p);
        y = n(p);
      }
      if (y !== null) var ae = !0;
      else {
        var Ie = n(m);
        Ie !== null && Et(C, Ie.startTime - U), ae = !1;
      }
      return ae;
    } finally {
      y = null, v = F, _ = !1;
    }
  }
  var D = !1, j = null, B = -1, q = 5, W = -1;
  function K() {
    return !(e.unstable_now() - W < q);
  }
  function le() {
    if (j !== null) {
      var N = e.unstable_now();
      W = N;
      var U = !0;
      try {
        U = j(!0, N);
      } finally {
        U ? Se() : (D = !1, j = null);
      }
    } else D = !1;
  }
  var Se;
  if (typeof S == "function") Se = function() {
    S(le);
  };
  else if (typeof MessageChannel < "u") {
    var xt = new MessageChannel(), jt = xt.port2;
    xt.port1.onmessage = le, Se = function() {
      jt.postMessage(null);
    };
  } else Se = function() {
    A(le, 0);
  };
  function be(N) {
    j = N, D || (D = !0, Se());
  }
  function Et(N, U) {
    B = A(function() {
      N(e.unstable_now());
    }, U);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    k || _ || (k = !0, be(I));
  }, e.unstable_forceFrameRate = function(N) {
    0 > N || 125 < N ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : q = 0 < N ? Math.floor(1e3 / N) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return v;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(p);
  }, e.unstable_next = function(N) {
    switch (v) {
      case 1:
      case 2:
      case 3:
        var U = 3;
        break;
      default:
        U = v;
    }
    var F = v;
    v = U;
    try {
      return N();
    } finally {
      v = F;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(N, U) {
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
    var F = v;
    v = N;
    try {
      return U();
    } finally {
      v = F;
    }
  }, e.unstable_scheduleCallback = function(N, U, F) {
    var Y = e.unstable_now();
    switch (typeof F == "object" && F !== null ? (F = F.delay, F = typeof F == "number" && 0 < F ? Y + F : Y) : F = Y, N) {
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
    return te = F + te, N = { id: g++, callback: U, priorityLevel: N, startTime: F, expirationTime: te, sortIndex: -1 }, F > Y ? (N.sortIndex = F, t(m, N), n(p) === null && N === n(m) && (R ? (w(B), B = -1) : R = !0, Et(C, F - Y))) : (N.sortIndex = te, t(p, N), k || _ || (k = !0, be(I))), N;
  }, e.unstable_shouldYield = K, e.unstable_wrapCallback = function(N) {
    var U = v;
    return function() {
      var F = v;
      v = U;
      try {
        return N.apply(this, arguments);
      } finally {
        v = F;
      }
    };
  };
})($g);
qg.exports = $g;
var mw = qg.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var gw = Q, Xt = mw;
function H(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var bg = /* @__PURE__ */ new Set(), hl = {};
function hi(e, t) {
  oo(e, t), oo(e + "Capture", t);
}
function oo(e, t) {
  for (hl[e] = t, e = 0; e < t.length; e++) bg.add(t[e]);
}
var nr = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), uf = Object.prototype.hasOwnProperty, yw = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, bh = {}, em = {};
function vw(e) {
  return uf.call(em, e) ? !0 : uf.call(bh, e) ? !1 : yw.test(e) ? em[e] = !0 : (bh[e] = !0, !1);
}
function Sw(e, t, n, o) {
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
function ww(e, t, n, o) {
  if (t === null || typeof t > "u" || Sw(e, t, n, o)) return !0;
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
function _t(e, t, n, o, l, s, a) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = o, this.attributeNamespace = l, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = s, this.removeEmptyString = a;
}
var rt = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  rt[e] = new _t(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  rt[t] = new _t(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  rt[e] = new _t(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  rt[e] = new _t(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  rt[e] = new _t(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  rt[e] = new _t(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  rt[e] = new _t(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  rt[e] = new _t(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  rt[e] = new _t(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var ad = /[\-:]([a-z])/g;
function cd(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    ad,
    cd
  );
  rt[t] = new _t(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(ad, cd);
  rt[t] = new _t(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(ad, cd);
  rt[t] = new _t(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  rt[e] = new _t(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
rt.xlinkHref = new _t("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  rt[e] = new _t(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function fd(e, t, n, o) {
  var l = rt.hasOwnProperty(t) ? rt[t] : null;
  (l !== null ? l.type !== 0 : o || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (ww(t, n, l, o) && (n = null), o || l === null ? vw(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : l.mustUseProperty ? e[l.propertyName] = n === null ? l.type === 3 ? !1 : "" : n : (t = l.attributeName, o = l.attributeNamespace, n === null ? e.removeAttribute(t) : (l = l.type, n = l === 3 || l === 4 && n === !0 ? "" : "" + n, o ? e.setAttributeNS(o, t, n) : e.setAttribute(t, n))));
}
var lr = gw.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, Is = Symbol.for("react.element"), Fi = Symbol.for("react.portal"), Ui = Symbol.for("react.fragment"), dd = Symbol.for("react.strict_mode"), af = Symbol.for("react.profiler"), ey = Symbol.for("react.provider"), ty = Symbol.for("react.context"), pd = Symbol.for("react.forward_ref"), cf = Symbol.for("react.suspense"), ff = Symbol.for("react.suspense_list"), hd = Symbol.for("react.memo"), _r = Symbol.for("react.lazy"), ny = Symbol.for("react.offscreen"), tm = Symbol.iterator;
function Bo(e) {
  return e === null || typeof e != "object" ? null : (e = tm && e[tm] || e["@@iterator"], typeof e == "function" ? e : null);
}
var ze = Object.assign, yc;
function bo(e) {
  if (yc === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    yc = t && t[1] || "";
  }
  return `
` + yc + e;
}
var vc = !1;
function Sc(e, t) {
  if (!e || vc) return "";
  vc = !0;
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
`), a = l.length - 1, f = s.length - 1; 1 <= a && 0 <= f && l[a] !== s[f]; ) f--;
      for (; 1 <= a && 0 <= f; a--, f--) if (l[a] !== s[f]) {
        if (a !== 1 || f !== 1)
          do
            if (a--, f--, 0 > f || l[a] !== s[f]) {
              var p = `
` + l[a].replace(" at new ", " at ");
              return e.displayName && p.includes("<anonymous>") && (p = p.replace("<anonymous>", e.displayName)), p;
            }
          while (1 <= a && 0 <= f);
        break;
      }
    }
  } finally {
    vc = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? bo(e) : "";
}
function _w(e) {
  switch (e.tag) {
    case 5:
      return bo(e.type);
    case 16:
      return bo("Lazy");
    case 13:
      return bo("Suspense");
    case 19:
      return bo("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = Sc(e.type, !1), e;
    case 11:
      return e = Sc(e.type.render, !1), e;
    case 1:
      return e = Sc(e.type, !0), e;
    default:
      return "";
  }
}
function df(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case Ui:
      return "Fragment";
    case Fi:
      return "Portal";
    case af:
      return "Profiler";
    case dd:
      return "StrictMode";
    case cf:
      return "Suspense";
    case ff:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case ty:
      return (e.displayName || "Context") + ".Consumer";
    case ey:
      return (e._context.displayName || "Context") + ".Provider";
    case pd:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case hd:
      return t = e.displayName || null, t !== null ? t : df(e.type) || "Memo";
    case _r:
      t = e._payload, e = e._init;
      try {
        return df(e(t));
      } catch {
      }
  }
  return null;
}
function xw(e) {
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
      return df(t);
    case 8:
      return t === dd ? "StrictMode" : "Mode";
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
function jr(e) {
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
function ry(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function Ew(e) {
  var t = ry(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), o = "" + e[t];
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
function Os(e) {
  e._valueTracker || (e._valueTracker = Ew(e));
}
function iy(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), o = "";
  return e && (o = ry(e) ? e.checked ? "true" : "false" : e.value), e = o, e !== n ? (t.setValue(e), !0) : !1;
}
function gu(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function pf(e, t) {
  var n = t.checked;
  return ze({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function nm(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, o = t.checked != null ? t.checked : t.defaultChecked;
  n = jr(t.value != null ? t.value : n), e._wrapperState = { initialChecked: o, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function oy(e, t) {
  t = t.checked, t != null && fd(e, "checked", t, !1);
}
function hf(e, t) {
  oy(e, t);
  var n = jr(t.value), o = t.type;
  if (n != null) o === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (o === "submit" || o === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? mf(e, t.type, n) : t.hasOwnProperty("defaultValue") && mf(e, t.type, jr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function rm(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var o = t.type;
    if (!(o !== "submit" && o !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function mf(e, t, n) {
  (t !== "number" || gu(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var el = Array.isArray;
function $i(e, t, n, o) {
  if (e = e.options, t) {
    t = {};
    for (var l = 0; l < n.length; l++) t["$" + n[l]] = !0;
    for (n = 0; n < e.length; n++) l = t.hasOwnProperty("$" + e[n].value), e[n].selected !== l && (e[n].selected = l), l && o && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + jr(n), t = null, l = 0; l < e.length; l++) {
      if (e[l].value === n) {
        e[l].selected = !0, o && (e[l].defaultSelected = !0);
        return;
      }
      t !== null || e[l].disabled || (t = e[l]);
    }
    t !== null && (t.selected = !0);
  }
}
function gf(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(H(91));
  return ze({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function im(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(H(92));
      if (el(n)) {
        if (1 < n.length) throw Error(H(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: jr(n) };
}
function ly(e, t) {
  var n = jr(t.value), o = jr(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), o != null && (e.defaultValue = "" + o);
}
function om(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function sy(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function yf(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? sy(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var Ds, uy = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, o, l) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, o, l);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (Ds = Ds || document.createElement("div"), Ds.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = Ds.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function ml(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var ol = {
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
}, kw = ["Webkit", "ms", "Moz", "O"];
Object.keys(ol).forEach(function(e) {
  kw.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), ol[t] = ol[e];
  });
});
function ay(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || ol.hasOwnProperty(e) && ol[e] ? ("" + t).trim() : t + "px";
}
function cy(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var o = n.indexOf("--") === 0, l = ay(n, t[n], o);
    n === "float" && (n = "cssFloat"), o ? e.setProperty(n, l) : e[n] = l;
  }
}
var Tw = ze({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function vf(e, t) {
  if (t) {
    if (Tw[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(H(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(H(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(H(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(H(62));
  }
}
function Sf(e, t) {
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
var wf = null;
function md(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var _f = null, bi = null, eo = null;
function lm(e) {
  if (e = Il(e)) {
    if (typeof _f != "function") throw Error(H(280));
    var t = e.stateNode;
    t && (t = Xu(t), _f(e.stateNode, e.type, t));
  }
}
function fy(e) {
  bi ? eo ? eo.push(e) : eo = [e] : bi = e;
}
function dy() {
  if (bi) {
    var e = bi, t = eo;
    if (eo = bi = null, lm(e), t) for (e = 0; e < t.length; e++) lm(t[e]);
  }
}
function py(e, t) {
  return e(t);
}
function hy() {
}
var wc = !1;
function my(e, t, n) {
  if (wc) return e(t, n);
  wc = !0;
  try {
    return py(e, t, n);
  } finally {
    wc = !1, (bi !== null || eo !== null) && (hy(), dy());
  }
}
function gl(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var o = Xu(n);
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
  if (n && typeof n != "function") throw Error(H(231, t, typeof n));
  return n;
}
var xf = !1;
if (nr) try {
  var Go = {};
  Object.defineProperty(Go, "passive", { get: function() {
    xf = !0;
  } }), window.addEventListener("test", Go, Go), window.removeEventListener("test", Go, Go);
} catch {
  xf = !1;
}
function Pw(e, t, n, o, l, s, a, f, p) {
  var m = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, m);
  } catch (g) {
    this.onError(g);
  }
}
var ll = !1, yu = null, vu = !1, Ef = null, Cw = { onError: function(e) {
  ll = !0, yu = e;
} };
function Rw(e, t, n, o, l, s, a, f, p) {
  ll = !1, yu = null, Pw.apply(Cw, arguments);
}
function Aw(e, t, n, o, l, s, a, f, p) {
  if (Rw.apply(this, arguments), ll) {
    if (ll) {
      var m = yu;
      ll = !1, yu = null;
    } else throw Error(H(198));
    vu || (vu = !0, Ef = m);
  }
}
function mi(e) {
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
function gy(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function sm(e) {
  if (mi(e) !== e) throw Error(H(188));
}
function Lw(e) {
  var t = e.alternate;
  if (!t) {
    if (t = mi(e), t === null) throw Error(H(188));
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
        if (s === n) return sm(l), e;
        if (s === o) return sm(l), t;
        s = s.sibling;
      }
      throw Error(H(188));
    }
    if (n.return !== o.return) n = l, o = s;
    else {
      for (var a = !1, f = l.child; f; ) {
        if (f === n) {
          a = !0, n = l, o = s;
          break;
        }
        if (f === o) {
          a = !0, o = l, n = s;
          break;
        }
        f = f.sibling;
      }
      if (!a) {
        for (f = s.child; f; ) {
          if (f === n) {
            a = !0, n = s, o = l;
            break;
          }
          if (f === o) {
            a = !0, o = s, n = l;
            break;
          }
          f = f.sibling;
        }
        if (!a) throw Error(H(189));
      }
    }
    if (n.alternate !== o) throw Error(H(190));
  }
  if (n.tag !== 3) throw Error(H(188));
  return n.stateNode.current === n ? e : t;
}
function yy(e) {
  return e = Lw(e), e !== null ? vy(e) : null;
}
function vy(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = vy(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var Sy = Xt.unstable_scheduleCallback, um = Xt.unstable_cancelCallback, Nw = Xt.unstable_shouldYield, Mw = Xt.unstable_requestPaint, Ue = Xt.unstable_now, zw = Xt.unstable_getCurrentPriorityLevel, gd = Xt.unstable_ImmediatePriority, wy = Xt.unstable_UserBlockingPriority, Su = Xt.unstable_NormalPriority, Iw = Xt.unstable_LowPriority, _y = Xt.unstable_IdlePriority, Wu = null, Hn = null;
function Ow(e) {
  if (Hn && typeof Hn.onCommitFiberRoot == "function") try {
    Hn.onCommitFiberRoot(Wu, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var Tn = Math.clz32 ? Math.clz32 : Fw, Dw = Math.log, jw = Math.LN2;
function Fw(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (Dw(e) / jw | 0) | 0;
}
var js = 64, Fs = 4194304;
function tl(e) {
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
function wu(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var o = 0, l = e.suspendedLanes, s = e.pingedLanes, a = n & 268435455;
  if (a !== 0) {
    var f = a & ~l;
    f !== 0 ? o = tl(f) : (s &= a, s !== 0 && (o = tl(s)));
  } else a = n & ~l, a !== 0 ? o = tl(a) : s !== 0 && (o = tl(s));
  if (o === 0) return 0;
  if (t !== 0 && t !== o && !(t & l) && (l = o & -o, s = t & -t, l >= s || l === 16 && (s & 4194240) !== 0)) return t;
  if (o & 4 && (o |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= o; 0 < t; ) n = 31 - Tn(t), l = 1 << n, o |= e[n], t &= ~l;
  return o;
}
function Uw(e, t) {
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
function Hw(e, t) {
  for (var n = e.suspendedLanes, o = e.pingedLanes, l = e.expirationTimes, s = e.pendingLanes; 0 < s; ) {
    var a = 31 - Tn(s), f = 1 << a, p = l[a];
    p === -1 ? (!(f & n) || f & o) && (l[a] = Uw(f, t)) : p <= t && (e.expiredLanes |= f), s &= ~f;
  }
}
function kf(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function xy() {
  var e = js;
  return js <<= 1, !(js & 4194240) && (js = 64), e;
}
function _c(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function Ml(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Tn(t), e[t] = n;
}
function Bw(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var o = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var l = 31 - Tn(n), s = 1 << l;
    t[l] = 0, o[l] = -1, e[l] = -1, n &= ~s;
  }
}
function yd(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var o = 31 - Tn(n), l = 1 << o;
    l & t | e[o] & t && (e[o] |= t), n &= ~l;
  }
}
var ge = 0;
function Ey(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var ky, vd, Ty, Py, Cy, Tf = !1, Us = [], Rr = null, Ar = null, Lr = null, yl = /* @__PURE__ */ new Map(), vl = /* @__PURE__ */ new Map(), Er = [], Gw = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function am(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      Rr = null;
      break;
    case "dragenter":
    case "dragleave":
      Ar = null;
      break;
    case "mouseover":
    case "mouseout":
      Lr = null;
      break;
    case "pointerover":
    case "pointerout":
      yl.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      vl.delete(t.pointerId);
  }
}
function Wo(e, t, n, o, l, s) {
  return e === null || e.nativeEvent !== s ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: o, nativeEvent: s, targetContainers: [l] }, t !== null && (t = Il(t), t !== null && vd(t)), e) : (e.eventSystemFlags |= o, t = e.targetContainers, l !== null && t.indexOf(l) === -1 && t.push(l), e);
}
function Ww(e, t, n, o, l) {
  switch (t) {
    case "focusin":
      return Rr = Wo(Rr, e, t, n, o, l), !0;
    case "dragenter":
      return Ar = Wo(Ar, e, t, n, o, l), !0;
    case "mouseover":
      return Lr = Wo(Lr, e, t, n, o, l), !0;
    case "pointerover":
      var s = l.pointerId;
      return yl.set(s, Wo(yl.get(s) || null, e, t, n, o, l)), !0;
    case "gotpointercapture":
      return s = l.pointerId, vl.set(s, Wo(vl.get(s) || null, e, t, n, o, l)), !0;
  }
  return !1;
}
function Ry(e) {
  var t = ri(e.target);
  if (t !== null) {
    var n = mi(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = gy(n), t !== null) {
          e.blockedOn = t, Cy(e.priority, function() {
            Ty(n);
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
function nu(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = Pf(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var o = new n.constructor(n.type, n);
      wf = o, n.target.dispatchEvent(o), wf = null;
    } else return t = Il(n), t !== null && vd(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function cm(e, t, n) {
  nu(e) && n.delete(t);
}
function Vw() {
  Tf = !1, Rr !== null && nu(Rr) && (Rr = null), Ar !== null && nu(Ar) && (Ar = null), Lr !== null && nu(Lr) && (Lr = null), yl.forEach(cm), vl.forEach(cm);
}
function Vo(e, t) {
  e.blockedOn === t && (e.blockedOn = null, Tf || (Tf = !0, Xt.unstable_scheduleCallback(Xt.unstable_NormalPriority, Vw)));
}
function Sl(e) {
  function t(l) {
    return Vo(l, e);
  }
  if (0 < Us.length) {
    Vo(Us[0], e);
    for (var n = 1; n < Us.length; n++) {
      var o = Us[n];
      o.blockedOn === e && (o.blockedOn = null);
    }
  }
  for (Rr !== null && Vo(Rr, e), Ar !== null && Vo(Ar, e), Lr !== null && Vo(Lr, e), yl.forEach(t), vl.forEach(t), n = 0; n < Er.length; n++) o = Er[n], o.blockedOn === e && (o.blockedOn = null);
  for (; 0 < Er.length && (n = Er[0], n.blockedOn === null); ) Ry(n), n.blockedOn === null && Er.shift();
}
var to = lr.ReactCurrentBatchConfig, _u = !0;
function Kw(e, t, n, o) {
  var l = ge, s = to.transition;
  to.transition = null;
  try {
    ge = 1, Sd(e, t, n, o);
  } finally {
    ge = l, to.transition = s;
  }
}
function Qw(e, t, n, o) {
  var l = ge, s = to.transition;
  to.transition = null;
  try {
    ge = 4, Sd(e, t, n, o);
  } finally {
    ge = l, to.transition = s;
  }
}
function Sd(e, t, n, o) {
  if (_u) {
    var l = Pf(e, t, n, o);
    if (l === null) Nc(e, t, o, xu, n), am(e, o);
    else if (Ww(l, e, t, n, o)) o.stopPropagation();
    else if (am(e, o), t & 4 && -1 < Gw.indexOf(e)) {
      for (; l !== null; ) {
        var s = Il(l);
        if (s !== null && ky(s), s = Pf(e, t, n, o), s === null && Nc(e, t, o, xu, n), s === l) break;
        l = s;
      }
      l !== null && o.stopPropagation();
    } else Nc(e, t, o, null, n);
  }
}
var xu = null;
function Pf(e, t, n, o) {
  if (xu = null, e = md(o), e = ri(e), e !== null) if (t = mi(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = gy(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return xu = e, null;
}
function Ay(e) {
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
      switch (zw()) {
        case gd:
          return 1;
        case wy:
          return 4;
        case Su:
        case Iw:
          return 16;
        case _y:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var Tr = null, wd = null, ru = null;
function Ly() {
  if (ru) return ru;
  var e, t = wd, n = t.length, o, l = "value" in Tr ? Tr.value : Tr.textContent, s = l.length;
  for (e = 0; e < n && t[e] === l[e]; e++) ;
  var a = n - e;
  for (o = 1; o <= a && t[n - o] === l[s - o]; o++) ;
  return ru = l.slice(e, 1 < o ? 1 - o : void 0);
}
function iu(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function Hs() {
  return !0;
}
function fm() {
  return !1;
}
function Zt(e) {
  function t(n, o, l, s, a) {
    this._reactName = n, this._targetInst = l, this.type = o, this.nativeEvent = s, this.target = a, this.currentTarget = null;
    for (var f in e) e.hasOwnProperty(f) && (n = e[f], this[f] = n ? n(s) : s[f]);
    return this.isDefaultPrevented = (s.defaultPrevented != null ? s.defaultPrevented : s.returnValue === !1) ? Hs : fm, this.isPropagationStopped = fm, this;
  }
  return ze(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Hs);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Hs);
  }, persist: function() {
  }, isPersistent: Hs }), t;
}
var mo = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, _d = Zt(mo), zl = ze({}, mo, { view: 0, detail: 0 }), Xw = Zt(zl), xc, Ec, Ko, Vu = ze({}, zl, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: xd, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== Ko && (Ko && e.type === "mousemove" ? (xc = e.screenX - Ko.screenX, Ec = e.screenY - Ko.screenY) : Ec = xc = 0, Ko = e), xc);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : Ec;
} }), dm = Zt(Vu), Yw = ze({}, Vu, { dataTransfer: 0 }), Zw = Zt(Yw), Jw = ze({}, zl, { relatedTarget: 0 }), kc = Zt(Jw), qw = ze({}, mo, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), $w = Zt(qw), bw = ze({}, mo, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), e_ = Zt(bw), t_ = ze({}, mo, { data: 0 }), pm = Zt(t_), n_ = {
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
}, r_ = {
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
}, i_ = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function o_(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = i_[e]) ? !!t[e] : !1;
}
function xd() {
  return o_;
}
var l_ = ze({}, zl, { key: function(e) {
  if (e.key) {
    var t = n_[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = iu(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? r_[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: xd, charCode: function(e) {
  return e.type === "keypress" ? iu(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? iu(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), s_ = Zt(l_), u_ = ze({}, Vu, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), hm = Zt(u_), a_ = ze({}, zl, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: xd }), c_ = Zt(a_), f_ = ze({}, mo, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), d_ = Zt(f_), p_ = ze({}, Vu, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), h_ = Zt(p_), m_ = [9, 13, 27, 32], Ed = nr && "CompositionEvent" in window, sl = null;
nr && "documentMode" in document && (sl = document.documentMode);
var g_ = nr && "TextEvent" in window && !sl, Ny = nr && (!Ed || sl && 8 < sl && 11 >= sl), mm = " ", gm = !1;
function My(e, t) {
  switch (e) {
    case "keyup":
      return m_.indexOf(t.keyCode) !== -1;
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
function zy(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var Hi = !1;
function y_(e, t) {
  switch (e) {
    case "compositionend":
      return zy(t);
    case "keypress":
      return t.which !== 32 ? null : (gm = !0, mm);
    case "textInput":
      return e = t.data, e === mm && gm ? null : e;
    default:
      return null;
  }
}
function v_(e, t) {
  if (Hi) return e === "compositionend" || !Ed && My(e, t) ? (e = Ly(), ru = wd = Tr = null, Hi = !1, e) : null;
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
      return Ny && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var S_ = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function ym(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!S_[e.type] : t === "textarea";
}
function Iy(e, t, n, o) {
  fy(o), t = Eu(t, "onChange"), 0 < t.length && (n = new _d("onChange", "change", null, n, o), e.push({ event: n, listeners: t }));
}
var ul = null, wl = null;
function w_(e) {
  Ky(e, 0);
}
function Ku(e) {
  var t = Wi(e);
  if (iy(t)) return e;
}
function __(e, t) {
  if (e === "change") return t;
}
var Oy = !1;
if (nr) {
  var Tc;
  if (nr) {
    var Pc = "oninput" in document;
    if (!Pc) {
      var vm = document.createElement("div");
      vm.setAttribute("oninput", "return;"), Pc = typeof vm.oninput == "function";
    }
    Tc = Pc;
  } else Tc = !1;
  Oy = Tc && (!document.documentMode || 9 < document.documentMode);
}
function Sm() {
  ul && (ul.detachEvent("onpropertychange", Dy), wl = ul = null);
}
function Dy(e) {
  if (e.propertyName === "value" && Ku(wl)) {
    var t = [];
    Iy(t, wl, e, md(e)), my(w_, t);
  }
}
function x_(e, t, n) {
  e === "focusin" ? (Sm(), ul = t, wl = n, ul.attachEvent("onpropertychange", Dy)) : e === "focusout" && Sm();
}
function E_(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return Ku(wl);
}
function k_(e, t) {
  if (e === "click") return Ku(t);
}
function T_(e, t) {
  if (e === "input" || e === "change") return Ku(t);
}
function P_(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Cn = typeof Object.is == "function" ? Object.is : P_;
function _l(e, t) {
  if (Cn(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), o = Object.keys(t);
  if (n.length !== o.length) return !1;
  for (o = 0; o < n.length; o++) {
    var l = n[o];
    if (!uf.call(t, l) || !Cn(e[l], t[l])) return !1;
  }
  return !0;
}
function wm(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function _m(e, t) {
  var n = wm(e);
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
    n = wm(n);
  }
}
function jy(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? jy(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function Fy() {
  for (var e = window, t = gu(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = gu(e.document);
  }
  return t;
}
function kd(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function C_(e) {
  var t = Fy(), n = e.focusedElem, o = e.selectionRange;
  if (t !== n && n && n.ownerDocument && jy(n.ownerDocument.documentElement, n)) {
    if (o !== null && kd(n)) {
      if (t = o.start, e = o.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var l = n.textContent.length, s = Math.min(o.start, l);
        o = o.end === void 0 ? s : Math.min(o.end, l), !e.extend && s > o && (l = o, o = s, s = l), l = _m(n, s);
        var a = _m(
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
var R_ = nr && "documentMode" in document && 11 >= document.documentMode, Bi = null, Cf = null, al = null, Rf = !1;
function xm(e, t, n) {
  var o = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  Rf || Bi == null || Bi !== gu(o) || (o = Bi, "selectionStart" in o && kd(o) ? o = { start: o.selectionStart, end: o.selectionEnd } : (o = (o.ownerDocument && o.ownerDocument.defaultView || window).getSelection(), o = { anchorNode: o.anchorNode, anchorOffset: o.anchorOffset, focusNode: o.focusNode, focusOffset: o.focusOffset }), al && _l(al, o) || (al = o, o = Eu(Cf, "onSelect"), 0 < o.length && (t = new _d("onSelect", "select", null, t, n), e.push({ event: t, listeners: o }), t.target = Bi)));
}
function Bs(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var Gi = { animationend: Bs("Animation", "AnimationEnd"), animationiteration: Bs("Animation", "AnimationIteration"), animationstart: Bs("Animation", "AnimationStart"), transitionend: Bs("Transition", "TransitionEnd") }, Cc = {}, Uy = {};
nr && (Uy = document.createElement("div").style, "AnimationEvent" in window || (delete Gi.animationend.animation, delete Gi.animationiteration.animation, delete Gi.animationstart.animation), "TransitionEvent" in window || delete Gi.transitionend.transition);
function Qu(e) {
  if (Cc[e]) return Cc[e];
  if (!Gi[e]) return e;
  var t = Gi[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in Uy) return Cc[e] = t[n];
  return e;
}
var Hy = Qu("animationend"), By = Qu("animationiteration"), Gy = Qu("animationstart"), Wy = Qu("transitionend"), Vy = /* @__PURE__ */ new Map(), Em = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Ur(e, t) {
  Vy.set(e, t), hi(t, [e]);
}
for (var Rc = 0; Rc < Em.length; Rc++) {
  var Ac = Em[Rc], A_ = Ac.toLowerCase(), L_ = Ac[0].toUpperCase() + Ac.slice(1);
  Ur(A_, "on" + L_);
}
Ur(Hy, "onAnimationEnd");
Ur(By, "onAnimationIteration");
Ur(Gy, "onAnimationStart");
Ur("dblclick", "onDoubleClick");
Ur("focusin", "onFocus");
Ur("focusout", "onBlur");
Ur(Wy, "onTransitionEnd");
oo("onMouseEnter", ["mouseout", "mouseover"]);
oo("onMouseLeave", ["mouseout", "mouseover"]);
oo("onPointerEnter", ["pointerout", "pointerover"]);
oo("onPointerLeave", ["pointerout", "pointerover"]);
hi("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
hi("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
hi("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
hi("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
hi("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
hi("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var nl = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), N_ = new Set("cancel close invalid load scroll toggle".split(" ").concat(nl));
function km(e, t, n) {
  var o = e.type || "unknown-event";
  e.currentTarget = n, Aw(o, t, void 0, e), e.currentTarget = null;
}
function Ky(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var o = e[n], l = o.event;
    o = o.listeners;
    e: {
      var s = void 0;
      if (t) for (var a = o.length - 1; 0 <= a; a--) {
        var f = o[a], p = f.instance, m = f.currentTarget;
        if (f = f.listener, p !== s && l.isPropagationStopped()) break e;
        km(l, f, m), s = p;
      }
      else for (a = 0; a < o.length; a++) {
        if (f = o[a], p = f.instance, m = f.currentTarget, f = f.listener, p !== s && l.isPropagationStopped()) break e;
        km(l, f, m), s = p;
      }
    }
  }
  if (vu) throw e = Ef, vu = !1, Ef = null, e;
}
function Pe(e, t) {
  var n = t[zf];
  n === void 0 && (n = t[zf] = /* @__PURE__ */ new Set());
  var o = e + "__bubble";
  n.has(o) || (Qy(t, e, 2, !1), n.add(o));
}
function Lc(e, t, n) {
  var o = 0;
  t && (o |= 4), Qy(n, e, o, t);
}
var Gs = "_reactListening" + Math.random().toString(36).slice(2);
function xl(e) {
  if (!e[Gs]) {
    e[Gs] = !0, bg.forEach(function(n) {
      n !== "selectionchange" && (N_.has(n) || Lc(n, !1, e), Lc(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[Gs] || (t[Gs] = !0, Lc("selectionchange", !1, t));
  }
}
function Qy(e, t, n, o) {
  switch (Ay(t)) {
    case 1:
      var l = Kw;
      break;
    case 4:
      l = Qw;
      break;
    default:
      l = Sd;
  }
  n = l.bind(null, t, n, e), l = void 0, !xf || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0), o ? l !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: l }) : e.addEventListener(t, n, !0) : l !== void 0 ? e.addEventListener(t, n, { passive: l }) : e.addEventListener(t, n, !1);
}
function Nc(e, t, n, o, l) {
  var s = o;
  if (!(t & 1) && !(t & 2) && o !== null) e: for (; ; ) {
    if (o === null) return;
    var a = o.tag;
    if (a === 3 || a === 4) {
      var f = o.stateNode.containerInfo;
      if (f === l || f.nodeType === 8 && f.parentNode === l) break;
      if (a === 4) for (a = o.return; a !== null; ) {
        var p = a.tag;
        if ((p === 3 || p === 4) && (p = a.stateNode.containerInfo, p === l || p.nodeType === 8 && p.parentNode === l)) return;
        a = a.return;
      }
      for (; f !== null; ) {
        if (a = ri(f), a === null) return;
        if (p = a.tag, p === 5 || p === 6) {
          o = s = a;
          continue e;
        }
        f = f.parentNode;
      }
    }
    o = o.return;
  }
  my(function() {
    var m = s, g = md(n), y = [];
    e: {
      var v = Vy.get(e);
      if (v !== void 0) {
        var _ = _d, k = e;
        switch (e) {
          case "keypress":
            if (iu(n) === 0) break e;
          case "keydown":
          case "keyup":
            _ = s_;
            break;
          case "focusin":
            k = "focus", _ = kc;
            break;
          case "focusout":
            k = "blur", _ = kc;
            break;
          case "beforeblur":
          case "afterblur":
            _ = kc;
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
            _ = dm;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            _ = Zw;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            _ = c_;
            break;
          case Hy:
          case By:
          case Gy:
            _ = $w;
            break;
          case Wy:
            _ = d_;
            break;
          case "scroll":
            _ = Xw;
            break;
          case "wheel":
            _ = h_;
            break;
          case "copy":
          case "cut":
          case "paste":
            _ = e_;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            _ = hm;
        }
        var R = (t & 4) !== 0, A = !R && e === "scroll", w = R ? v !== null ? v + "Capture" : null : v;
        R = [];
        for (var S = m, x; S !== null; ) {
          x = S;
          var C = x.stateNode;
          if (x.tag === 5 && C !== null && (x = C, w !== null && (C = gl(S, w), C != null && R.push(El(S, C, x)))), A) break;
          S = S.return;
        }
        0 < R.length && (v = new _(v, k, null, n, g), y.push({ event: v, listeners: R }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (v = e === "mouseover" || e === "pointerover", _ = e === "mouseout" || e === "pointerout", v && n !== wf && (k = n.relatedTarget || n.fromElement) && (ri(k) || k[rr])) break e;
        if ((_ || v) && (v = g.window === g ? g : (v = g.ownerDocument) ? v.defaultView || v.parentWindow : window, _ ? (k = n.relatedTarget || n.toElement, _ = m, k = k ? ri(k) : null, k !== null && (A = mi(k), k !== A || k.tag !== 5 && k.tag !== 6) && (k = null)) : (_ = null, k = m), _ !== k)) {
          if (R = dm, C = "onMouseLeave", w = "onMouseEnter", S = "mouse", (e === "pointerout" || e === "pointerover") && (R = hm, C = "onPointerLeave", w = "onPointerEnter", S = "pointer"), A = _ == null ? v : Wi(_), x = k == null ? v : Wi(k), v = new R(C, S + "leave", _, n, g), v.target = A, v.relatedTarget = x, C = null, ri(g) === m && (R = new R(w, S + "enter", k, n, g), R.target = x, R.relatedTarget = A, C = R), A = C, _ && k) t: {
            for (R = _, w = k, S = 0, x = R; x; x = Ni(x)) S++;
            for (x = 0, C = w; C; C = Ni(C)) x++;
            for (; 0 < S - x; ) R = Ni(R), S--;
            for (; 0 < x - S; ) w = Ni(w), x--;
            for (; S--; ) {
              if (R === w || w !== null && R === w.alternate) break t;
              R = Ni(R), w = Ni(w);
            }
            R = null;
          }
          else R = null;
          _ !== null && Tm(y, v, _, R, !1), k !== null && A !== null && Tm(y, A, k, R, !0);
        }
      }
      e: {
        if (v = m ? Wi(m) : window, _ = v.nodeName && v.nodeName.toLowerCase(), _ === "select" || _ === "input" && v.type === "file") var I = __;
        else if (ym(v)) if (Oy) I = T_;
        else {
          I = E_;
          var D = x_;
        }
        else (_ = v.nodeName) && _.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (I = k_);
        if (I && (I = I(e, m))) {
          Iy(y, I, n, g);
          break e;
        }
        D && D(e, v, m), e === "focusout" && (D = v._wrapperState) && D.controlled && v.type === "number" && mf(v, "number", v.value);
      }
      switch (D = m ? Wi(m) : window, e) {
        case "focusin":
          (ym(D) || D.contentEditable === "true") && (Bi = D, Cf = m, al = null);
          break;
        case "focusout":
          al = Cf = Bi = null;
          break;
        case "mousedown":
          Rf = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          Rf = !1, xm(y, n, g);
          break;
        case "selectionchange":
          if (R_) break;
        case "keydown":
        case "keyup":
          xm(y, n, g);
      }
      var j;
      if (Ed) e: {
        switch (e) {
          case "compositionstart":
            var B = "onCompositionStart";
            break e;
          case "compositionend":
            B = "onCompositionEnd";
            break e;
          case "compositionupdate":
            B = "onCompositionUpdate";
            break e;
        }
        B = void 0;
      }
      else Hi ? My(e, n) && (B = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (B = "onCompositionStart");
      B && (Ny && n.locale !== "ko" && (Hi || B !== "onCompositionStart" ? B === "onCompositionEnd" && Hi && (j = Ly()) : (Tr = g, wd = "value" in Tr ? Tr.value : Tr.textContent, Hi = !0)), D = Eu(m, B), 0 < D.length && (B = new pm(B, e, null, n, g), y.push({ event: B, listeners: D }), j ? B.data = j : (j = zy(n), j !== null && (B.data = j)))), (j = g_ ? y_(e, n) : v_(e, n)) && (m = Eu(m, "onBeforeInput"), 0 < m.length && (g = new pm("onBeforeInput", "beforeinput", null, n, g), y.push({ event: g, listeners: m }), g.data = j));
    }
    Ky(y, t);
  });
}
function El(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function Eu(e, t) {
  for (var n = t + "Capture", o = []; e !== null; ) {
    var l = e, s = l.stateNode;
    l.tag === 5 && s !== null && (l = s, s = gl(e, n), s != null && o.unshift(El(e, s, l)), s = gl(e, t), s != null && o.push(El(e, s, l))), e = e.return;
  }
  return o;
}
function Ni(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function Tm(e, t, n, o, l) {
  for (var s = t._reactName, a = []; n !== null && n !== o; ) {
    var f = n, p = f.alternate, m = f.stateNode;
    if (p !== null && p === o) break;
    f.tag === 5 && m !== null && (f = m, l ? (p = gl(n, s), p != null && a.unshift(El(n, p, f))) : l || (p = gl(n, s), p != null && a.push(El(n, p, f)))), n = n.return;
  }
  a.length !== 0 && e.push({ event: t, listeners: a });
}
var M_ = /\r\n?/g, z_ = /\u0000|\uFFFD/g;
function Pm(e) {
  return (typeof e == "string" ? e : "" + e).replace(M_, `
`).replace(z_, "");
}
function Ws(e, t, n) {
  if (t = Pm(t), Pm(e) !== t && n) throw Error(H(425));
}
function ku() {
}
var Af = null, Lf = null;
function Nf(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var Mf = typeof setTimeout == "function" ? setTimeout : void 0, I_ = typeof clearTimeout == "function" ? clearTimeout : void 0, Cm = typeof Promise == "function" ? Promise : void 0, O_ = typeof queueMicrotask == "function" ? queueMicrotask : typeof Cm < "u" ? function(e) {
  return Cm.resolve(null).then(e).catch(D_);
} : Mf;
function D_(e) {
  setTimeout(function() {
    throw e;
  });
}
function Mc(e, t) {
  var n = t, o = 0;
  do {
    var l = n.nextSibling;
    if (e.removeChild(n), l && l.nodeType === 8) if (n = l.data, n === "/$") {
      if (o === 0) {
        e.removeChild(l), Sl(t);
        return;
      }
      o--;
    } else n !== "$" && n !== "$?" && n !== "$!" || o++;
    n = l;
  } while (n);
  Sl(t);
}
function Nr(e) {
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
function Rm(e) {
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
var go = Math.random().toString(36).slice(2), Un = "__reactFiber$" + go, kl = "__reactProps$" + go, rr = "__reactContainer$" + go, zf = "__reactEvents$" + go, j_ = "__reactListeners$" + go, F_ = "__reactHandles$" + go;
function ri(e) {
  var t = e[Un];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[rr] || n[Un]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = Rm(e); e !== null; ) {
        if (n = e[Un]) return n;
        e = Rm(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function Il(e) {
  return e = e[Un] || e[rr], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function Wi(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(H(33));
}
function Xu(e) {
  return e[kl] || null;
}
var If = [], Vi = -1;
function Hr(e) {
  return { current: e };
}
function Ce(e) {
  0 > Vi || (e.current = If[Vi], If[Vi] = null, Vi--);
}
function ke(e, t) {
  Vi++, If[Vi] = e.current, e.current = t;
}
var Fr = {}, mt = Hr(Fr), It = Hr(!1), ai = Fr;
function lo(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Fr;
  var o = e.stateNode;
  if (o && o.__reactInternalMemoizedUnmaskedChildContext === t) return o.__reactInternalMemoizedMaskedChildContext;
  var l = {}, s;
  for (s in n) l[s] = t[s];
  return o && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = l), l;
}
function Ot(e) {
  return e = e.childContextTypes, e != null;
}
function Tu() {
  Ce(It), Ce(mt);
}
function Am(e, t, n) {
  if (mt.current !== Fr) throw Error(H(168));
  ke(mt, t), ke(It, n);
}
function Xy(e, t, n) {
  var o = e.stateNode;
  if (t = t.childContextTypes, typeof o.getChildContext != "function") return n;
  o = o.getChildContext();
  for (var l in o) if (!(l in t)) throw Error(H(108, xw(e) || "Unknown", l));
  return ze({}, n, o);
}
function Pu(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Fr, ai = mt.current, ke(mt, e), ke(It, It.current), !0;
}
function Lm(e, t, n) {
  var o = e.stateNode;
  if (!o) throw Error(H(169));
  n ? (e = Xy(e, t, ai), o.__reactInternalMemoizedMergedChildContext = e, Ce(It), Ce(mt), ke(mt, e)) : Ce(It), ke(It, n);
}
var $n = null, Yu = !1, zc = !1;
function Yy(e) {
  $n === null ? $n = [e] : $n.push(e);
}
function U_(e) {
  Yu = !0, Yy(e);
}
function Br() {
  if (!zc && $n !== null) {
    zc = !0;
    var e = 0, t = ge;
    try {
      var n = $n;
      for (ge = 1; e < n.length; e++) {
        var o = n[e];
        do
          o = o(!0);
        while (o !== null);
      }
      $n = null, Yu = !1;
    } catch (l) {
      throw $n !== null && ($n = $n.slice(e + 1)), Sy(gd, Br), l;
    } finally {
      ge = t, zc = !1;
    }
  }
  return null;
}
var Ki = [], Qi = 0, Cu = null, Ru = 0, un = [], an = 0, ci = null, bn = 1, er = "";
function ei(e, t) {
  Ki[Qi++] = Ru, Ki[Qi++] = Cu, Cu = e, Ru = t;
}
function Zy(e, t, n) {
  un[an++] = bn, un[an++] = er, un[an++] = ci, ci = e;
  var o = bn;
  e = er;
  var l = 32 - Tn(o) - 1;
  o &= ~(1 << l), n += 1;
  var s = 32 - Tn(t) + l;
  if (30 < s) {
    var a = l - l % 5;
    s = (o & (1 << a) - 1).toString(32), o >>= a, l -= a, bn = 1 << 32 - Tn(t) + l | n << l | o, er = s + e;
  } else bn = 1 << s | n << l | o, er = e;
}
function Td(e) {
  e.return !== null && (ei(e, 1), Zy(e, 1, 0));
}
function Pd(e) {
  for (; e === Cu; ) Cu = Ki[--Qi], Ki[Qi] = null, Ru = Ki[--Qi], Ki[Qi] = null;
  for (; e === ci; ) ci = un[--an], un[an] = null, er = un[--an], un[an] = null, bn = un[--an], un[an] = null;
}
var Qt = null, Kt = null, Ae = !1, kn = null;
function Jy(e, t) {
  var n = cn(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function Nm(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Qt = e, Kt = Nr(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Qt = e, Kt = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = ci !== null ? { id: bn, overflow: er } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = cn(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Qt = e, Kt = null, !0) : !1;
    default:
      return !1;
  }
}
function Of(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Df(e) {
  if (Ae) {
    var t = Kt;
    if (t) {
      var n = t;
      if (!Nm(e, t)) {
        if (Of(e)) throw Error(H(418));
        t = Nr(n.nextSibling);
        var o = Qt;
        t && Nm(e, t) ? Jy(o, n) : (e.flags = e.flags & -4097 | 2, Ae = !1, Qt = e);
      }
    } else {
      if (Of(e)) throw Error(H(418));
      e.flags = e.flags & -4097 | 2, Ae = !1, Qt = e;
    }
  }
}
function Mm(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Qt = e;
}
function Vs(e) {
  if (e !== Qt) return !1;
  if (!Ae) return Mm(e), Ae = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !Nf(e.type, e.memoizedProps)), t && (t = Kt)) {
    if (Of(e)) throw qy(), Error(H(418));
    for (; t; ) Jy(e, t), t = Nr(t.nextSibling);
  }
  if (Mm(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(H(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Kt = Nr(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Kt = null;
    }
  } else Kt = Qt ? Nr(e.stateNode.nextSibling) : null;
  return !0;
}
function qy() {
  for (var e = Kt; e; ) e = Nr(e.nextSibling);
}
function so() {
  Kt = Qt = null, Ae = !1;
}
function Cd(e) {
  kn === null ? kn = [e] : kn.push(e);
}
var H_ = lr.ReactCurrentBatchConfig;
function Qo(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(H(309));
        var o = n.stateNode;
      }
      if (!o) throw Error(H(147, e));
      var l = o, s = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === s ? t.ref : (t = function(a) {
        var f = l.refs;
        a === null ? delete f[s] : f[s] = a;
      }, t._stringRef = s, t);
    }
    if (typeof e != "string") throw Error(H(284));
    if (!n._owner) throw Error(H(290, e));
  }
  return e;
}
function Ks(e, t) {
  throw e = Object.prototype.toString.call(t), Error(H(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function zm(e) {
  var t = e._init;
  return t(e._payload);
}
function $y(e) {
  function t(w, S) {
    if (e) {
      var x = w.deletions;
      x === null ? (w.deletions = [S], w.flags |= 16) : x.push(S);
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
    return w = Or(w, S), w.index = 0, w.sibling = null, w;
  }
  function s(w, S, x) {
    return w.index = x, e ? (x = w.alternate, x !== null ? (x = x.index, x < S ? (w.flags |= 2, S) : x) : (w.flags |= 2, S)) : (w.flags |= 1048576, S);
  }
  function a(w) {
    return e && w.alternate === null && (w.flags |= 2), w;
  }
  function f(w, S, x, C) {
    return S === null || S.tag !== 6 ? (S = Hc(x, w.mode, C), S.return = w, S) : (S = l(S, x), S.return = w, S);
  }
  function p(w, S, x, C) {
    var I = x.type;
    return I === Ui ? g(w, S, x.props.children, C, x.key) : S !== null && (S.elementType === I || typeof I == "object" && I !== null && I.$$typeof === _r && zm(I) === S.type) ? (C = l(S, x.props), C.ref = Qo(w, S, x), C.return = w, C) : (C = fu(x.type, x.key, x.props, null, w.mode, C), C.ref = Qo(w, S, x), C.return = w, C);
  }
  function m(w, S, x, C) {
    return S === null || S.tag !== 4 || S.stateNode.containerInfo !== x.containerInfo || S.stateNode.implementation !== x.implementation ? (S = Bc(x, w.mode, C), S.return = w, S) : (S = l(S, x.children || []), S.return = w, S);
  }
  function g(w, S, x, C, I) {
    return S === null || S.tag !== 7 ? (S = ui(x, w.mode, C, I), S.return = w, S) : (S = l(S, x), S.return = w, S);
  }
  function y(w, S, x) {
    if (typeof S == "string" && S !== "" || typeof S == "number") return S = Hc("" + S, w.mode, x), S.return = w, S;
    if (typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case Is:
          return x = fu(S.type, S.key, S.props, null, w.mode, x), x.ref = Qo(w, null, S), x.return = w, x;
        case Fi:
          return S = Bc(S, w.mode, x), S.return = w, S;
        case _r:
          var C = S._init;
          return y(w, C(S._payload), x);
      }
      if (el(S) || Bo(S)) return S = ui(S, w.mode, x, null), S.return = w, S;
      Ks(w, S);
    }
    return null;
  }
  function v(w, S, x, C) {
    var I = S !== null ? S.key : null;
    if (typeof x == "string" && x !== "" || typeof x == "number") return I !== null ? null : f(w, S, "" + x, C);
    if (typeof x == "object" && x !== null) {
      switch (x.$$typeof) {
        case Is:
          return x.key === I ? p(w, S, x, C) : null;
        case Fi:
          return x.key === I ? m(w, S, x, C) : null;
        case _r:
          return I = x._init, v(
            w,
            S,
            I(x._payload),
            C
          );
      }
      if (el(x) || Bo(x)) return I !== null ? null : g(w, S, x, C, null);
      Ks(w, x);
    }
    return null;
  }
  function _(w, S, x, C, I) {
    if (typeof C == "string" && C !== "" || typeof C == "number") return w = w.get(x) || null, f(S, w, "" + C, I);
    if (typeof C == "object" && C !== null) {
      switch (C.$$typeof) {
        case Is:
          return w = w.get(C.key === null ? x : C.key) || null, p(S, w, C, I);
        case Fi:
          return w = w.get(C.key === null ? x : C.key) || null, m(S, w, C, I);
        case _r:
          var D = C._init;
          return _(w, S, x, D(C._payload), I);
      }
      if (el(C) || Bo(C)) return w = w.get(x) || null, g(S, w, C, I, null);
      Ks(S, C);
    }
    return null;
  }
  function k(w, S, x, C) {
    for (var I = null, D = null, j = S, B = S = 0, q = null; j !== null && B < x.length; B++) {
      j.index > B ? (q = j, j = null) : q = j.sibling;
      var W = v(w, j, x[B], C);
      if (W === null) {
        j === null && (j = q);
        break;
      }
      e && j && W.alternate === null && t(w, j), S = s(W, S, B), D === null ? I = W : D.sibling = W, D = W, j = q;
    }
    if (B === x.length) return n(w, j), Ae && ei(w, B), I;
    if (j === null) {
      for (; B < x.length; B++) j = y(w, x[B], C), j !== null && (S = s(j, S, B), D === null ? I = j : D.sibling = j, D = j);
      return Ae && ei(w, B), I;
    }
    for (j = o(w, j); B < x.length; B++) q = _(j, w, B, x[B], C), q !== null && (e && q.alternate !== null && j.delete(q.key === null ? B : q.key), S = s(q, S, B), D === null ? I = q : D.sibling = q, D = q);
    return e && j.forEach(function(K) {
      return t(w, K);
    }), Ae && ei(w, B), I;
  }
  function R(w, S, x, C) {
    var I = Bo(x);
    if (typeof I != "function") throw Error(H(150));
    if (x = I.call(x), x == null) throw Error(H(151));
    for (var D = I = null, j = S, B = S = 0, q = null, W = x.next(); j !== null && !W.done; B++, W = x.next()) {
      j.index > B ? (q = j, j = null) : q = j.sibling;
      var K = v(w, j, W.value, C);
      if (K === null) {
        j === null && (j = q);
        break;
      }
      e && j && K.alternate === null && t(w, j), S = s(K, S, B), D === null ? I = K : D.sibling = K, D = K, j = q;
    }
    if (W.done) return n(
      w,
      j
    ), Ae && ei(w, B), I;
    if (j === null) {
      for (; !W.done; B++, W = x.next()) W = y(w, W.value, C), W !== null && (S = s(W, S, B), D === null ? I = W : D.sibling = W, D = W);
      return Ae && ei(w, B), I;
    }
    for (j = o(w, j); !W.done; B++, W = x.next()) W = _(j, w, B, W.value, C), W !== null && (e && W.alternate !== null && j.delete(W.key === null ? B : W.key), S = s(W, S, B), D === null ? I = W : D.sibling = W, D = W);
    return e && j.forEach(function(le) {
      return t(w, le);
    }), Ae && ei(w, B), I;
  }
  function A(w, S, x, C) {
    if (typeof x == "object" && x !== null && x.type === Ui && x.key === null && (x = x.props.children), typeof x == "object" && x !== null) {
      switch (x.$$typeof) {
        case Is:
          e: {
            for (var I = x.key, D = S; D !== null; ) {
              if (D.key === I) {
                if (I = x.type, I === Ui) {
                  if (D.tag === 7) {
                    n(w, D.sibling), S = l(D, x.props.children), S.return = w, w = S;
                    break e;
                  }
                } else if (D.elementType === I || typeof I == "object" && I !== null && I.$$typeof === _r && zm(I) === D.type) {
                  n(w, D.sibling), S = l(D, x.props), S.ref = Qo(w, D, x), S.return = w, w = S;
                  break e;
                }
                n(w, D);
                break;
              } else t(w, D);
              D = D.sibling;
            }
            x.type === Ui ? (S = ui(x.props.children, w.mode, C, x.key), S.return = w, w = S) : (C = fu(x.type, x.key, x.props, null, w.mode, C), C.ref = Qo(w, S, x), C.return = w, w = C);
          }
          return a(w);
        case Fi:
          e: {
            for (D = x.key; S !== null; ) {
              if (S.key === D) if (S.tag === 4 && S.stateNode.containerInfo === x.containerInfo && S.stateNode.implementation === x.implementation) {
                n(w, S.sibling), S = l(S, x.children || []), S.return = w, w = S;
                break e;
              } else {
                n(w, S);
                break;
              }
              else t(w, S);
              S = S.sibling;
            }
            S = Bc(x, w.mode, C), S.return = w, w = S;
          }
          return a(w);
        case _r:
          return D = x._init, A(w, S, D(x._payload), C);
      }
      if (el(x)) return k(w, S, x, C);
      if (Bo(x)) return R(w, S, x, C);
      Ks(w, x);
    }
    return typeof x == "string" && x !== "" || typeof x == "number" ? (x = "" + x, S !== null && S.tag === 6 ? (n(w, S.sibling), S = l(S, x), S.return = w, w = S) : (n(w, S), S = Hc(x, w.mode, C), S.return = w, w = S), a(w)) : n(w, S);
  }
  return A;
}
var uo = $y(!0), by = $y(!1), Au = Hr(null), Lu = null, Xi = null, Rd = null;
function Ad() {
  Rd = Xi = Lu = null;
}
function Ld(e) {
  var t = Au.current;
  Ce(Au), e._currentValue = t;
}
function jf(e, t, n) {
  for (; e !== null; ) {
    var o = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, o !== null && (o.childLanes |= t)) : o !== null && (o.childLanes & t) !== t && (o.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function no(e, t) {
  Lu = e, Rd = Xi = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (zt = !0), e.firstContext = null);
}
function dn(e) {
  var t = e._currentValue;
  if (Rd !== e) if (e = { context: e, memoizedValue: t, next: null }, Xi === null) {
    if (Lu === null) throw Error(H(308));
    Xi = e, Lu.dependencies = { lanes: 0, firstContext: e };
  } else Xi = Xi.next = e;
  return t;
}
var ii = null;
function Nd(e) {
  ii === null ? ii = [e] : ii.push(e);
}
function ev(e, t, n, o) {
  var l = t.interleaved;
  return l === null ? (n.next = n, Nd(t)) : (n.next = l.next, l.next = n), t.interleaved = n, ir(e, o);
}
function ir(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var xr = !1;
function Md(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function tv(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function tr(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Mr(e, t, n) {
  var o = e.updateQueue;
  if (o === null) return null;
  if (o = o.shared, fe & 2) {
    var l = o.pending;
    return l === null ? t.next = t : (t.next = l.next, l.next = t), o.pending = t, ir(e, n);
  }
  return l = o.interleaved, l === null ? (t.next = t, Nd(o)) : (t.next = l.next, l.next = t), o.interleaved = t, ir(e, n);
}
function ou(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var o = t.lanes;
    o &= e.pendingLanes, n |= o, t.lanes = n, yd(e, n);
  }
}
function Im(e, t) {
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
function Nu(e, t, n, o) {
  var l = e.updateQueue;
  xr = !1;
  var s = l.firstBaseUpdate, a = l.lastBaseUpdate, f = l.shared.pending;
  if (f !== null) {
    l.shared.pending = null;
    var p = f, m = p.next;
    p.next = null, a === null ? s = m : a.next = m, a = p;
    var g = e.alternate;
    g !== null && (g = g.updateQueue, f = g.lastBaseUpdate, f !== a && (f === null ? g.firstBaseUpdate = m : f.next = m, g.lastBaseUpdate = p));
  }
  if (s !== null) {
    var y = l.baseState;
    a = 0, g = m = p = null, f = s;
    do {
      var v = f.lane, _ = f.eventTime;
      if ((o & v) === v) {
        g !== null && (g = g.next = {
          eventTime: _,
          lane: 0,
          tag: f.tag,
          payload: f.payload,
          callback: f.callback,
          next: null
        });
        e: {
          var k = e, R = f;
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
              y = ze({}, y, v);
              break e;
            case 2:
              xr = !0;
          }
        }
        f.callback !== null && f.lane !== 0 && (e.flags |= 64, v = l.effects, v === null ? l.effects = [f] : v.push(f));
      } else _ = { eventTime: _, lane: v, tag: f.tag, payload: f.payload, callback: f.callback, next: null }, g === null ? (m = g = _, p = y) : g = g.next = _, a |= v;
      if (f = f.next, f === null) {
        if (f = l.shared.pending, f === null) break;
        v = f, f = v.next, v.next = null, l.lastBaseUpdate = v, l.shared.pending = null;
      }
    } while (!0);
    if (g === null && (p = y), l.baseState = p, l.firstBaseUpdate = m, l.lastBaseUpdate = g, t = l.shared.interleaved, t !== null) {
      l = t;
      do
        a |= l.lane, l = l.next;
      while (l !== t);
    } else s === null && (l.shared.lanes = 0);
    di |= a, e.lanes = a, e.memoizedState = y;
  }
}
function Om(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var o = e[t], l = o.callback;
    if (l !== null) {
      if (o.callback = null, o = n, typeof l != "function") throw Error(H(191, l));
      l.call(o);
    }
  }
}
var Ol = {}, Bn = Hr(Ol), Tl = Hr(Ol), Pl = Hr(Ol);
function oi(e) {
  if (e === Ol) throw Error(H(174));
  return e;
}
function zd(e, t) {
  switch (ke(Pl, t), ke(Tl, e), ke(Bn, Ol), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : yf(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = yf(t, e);
  }
  Ce(Bn), ke(Bn, t);
}
function ao() {
  Ce(Bn), Ce(Tl), Ce(Pl);
}
function nv(e) {
  oi(Pl.current);
  var t = oi(Bn.current), n = yf(t, e.type);
  t !== n && (ke(Tl, e), ke(Bn, n));
}
function Id(e) {
  Tl.current === e && (Ce(Bn), Ce(Tl));
}
var Ne = Hr(0);
function Mu(e) {
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
var Ic = [];
function Od() {
  for (var e = 0; e < Ic.length; e++) Ic[e]._workInProgressVersionPrimary = null;
  Ic.length = 0;
}
var lu = lr.ReactCurrentDispatcher, Oc = lr.ReactCurrentBatchConfig, fi = 0, Me = null, Ke = null, qe = null, zu = !1, cl = !1, Cl = 0, B_ = 0;
function ct() {
  throw Error(H(321));
}
function Dd(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!Cn(e[n], t[n])) return !1;
  return !0;
}
function jd(e, t, n, o, l, s) {
  if (fi = s, Me = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, lu.current = e === null || e.memoizedState === null ? K_ : Q_, e = n(o, l), cl) {
    s = 0;
    do {
      if (cl = !1, Cl = 0, 25 <= s) throw Error(H(301));
      s += 1, qe = Ke = null, t.updateQueue = null, lu.current = X_, e = n(o, l);
    } while (cl);
  }
  if (lu.current = Iu, t = Ke !== null && Ke.next !== null, fi = 0, qe = Ke = Me = null, zu = !1, t) throw Error(H(300));
  return e;
}
function Fd() {
  var e = Cl !== 0;
  return Cl = 0, e;
}
function Fn() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return qe === null ? Me.memoizedState = qe = e : qe = qe.next = e, qe;
}
function pn() {
  if (Ke === null) {
    var e = Me.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = Ke.next;
  var t = qe === null ? Me.memoizedState : qe.next;
  if (t !== null) qe = t, Ke = e;
  else {
    if (e === null) throw Error(H(310));
    Ke = e, e = { memoizedState: Ke.memoizedState, baseState: Ke.baseState, baseQueue: Ke.baseQueue, queue: Ke.queue, next: null }, qe === null ? Me.memoizedState = qe = e : qe = qe.next = e;
  }
  return qe;
}
function Rl(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function Dc(e) {
  var t = pn(), n = t.queue;
  if (n === null) throw Error(H(311));
  n.lastRenderedReducer = e;
  var o = Ke, l = o.baseQueue, s = n.pending;
  if (s !== null) {
    if (l !== null) {
      var a = l.next;
      l.next = s.next, s.next = a;
    }
    o.baseQueue = l = s, n.pending = null;
  }
  if (l !== null) {
    s = l.next, o = o.baseState;
    var f = a = null, p = null, m = s;
    do {
      var g = m.lane;
      if ((fi & g) === g) p !== null && (p = p.next = { lane: 0, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), o = m.hasEagerState ? m.eagerState : e(o, m.action);
      else {
        var y = {
          lane: g,
          action: m.action,
          hasEagerState: m.hasEagerState,
          eagerState: m.eagerState,
          next: null
        };
        p === null ? (f = p = y, a = o) : p = p.next = y, Me.lanes |= g, di |= g;
      }
      m = m.next;
    } while (m !== null && m !== s);
    p === null ? a = o : p.next = f, Cn(o, t.memoizedState) || (zt = !0), t.memoizedState = o, t.baseState = a, t.baseQueue = p, n.lastRenderedState = o;
  }
  if (e = n.interleaved, e !== null) {
    l = e;
    do
      s = l.lane, Me.lanes |= s, di |= s, l = l.next;
    while (l !== e);
  } else l === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function jc(e) {
  var t = pn(), n = t.queue;
  if (n === null) throw Error(H(311));
  n.lastRenderedReducer = e;
  var o = n.dispatch, l = n.pending, s = t.memoizedState;
  if (l !== null) {
    n.pending = null;
    var a = l = l.next;
    do
      s = e(s, a.action), a = a.next;
    while (a !== l);
    Cn(s, t.memoizedState) || (zt = !0), t.memoizedState = s, t.baseQueue === null && (t.baseState = s), n.lastRenderedState = s;
  }
  return [s, o];
}
function rv() {
}
function iv(e, t) {
  var n = Me, o = pn(), l = t(), s = !Cn(o.memoizedState, l);
  if (s && (o.memoizedState = l, zt = !0), o = o.queue, Ud(sv.bind(null, n, o, e), [e]), o.getSnapshot !== t || s || qe !== null && qe.memoizedState.tag & 1) {
    if (n.flags |= 2048, Al(9, lv.bind(null, n, o, l, t), void 0, null), $e === null) throw Error(H(349));
    fi & 30 || ov(n, t, l);
  }
  return l;
}
function ov(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = Me.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Me.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function lv(e, t, n, o) {
  t.value = n, t.getSnapshot = o, uv(t) && av(e);
}
function sv(e, t, n) {
  return n(function() {
    uv(t) && av(e);
  });
}
function uv(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Cn(e, n);
  } catch {
    return !0;
  }
}
function av(e) {
  var t = ir(e, 1);
  t !== null && Pn(t, e, 1, -1);
}
function Dm(e) {
  var t = Fn();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Rl, lastRenderedState: e }, t.queue = e, e = e.dispatch = V_.bind(null, Me, e), [t.memoizedState, e];
}
function Al(e, t, n, o) {
  return e = { tag: e, create: t, destroy: n, deps: o, next: null }, t = Me.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Me.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (o = n.next, n.next = e, e.next = o, t.lastEffect = e)), e;
}
function cv() {
  return pn().memoizedState;
}
function su(e, t, n, o) {
  var l = Fn();
  Me.flags |= e, l.memoizedState = Al(1 | t, n, void 0, o === void 0 ? null : o);
}
function Zu(e, t, n, o) {
  var l = pn();
  o = o === void 0 ? null : o;
  var s = void 0;
  if (Ke !== null) {
    var a = Ke.memoizedState;
    if (s = a.destroy, o !== null && Dd(o, a.deps)) {
      l.memoizedState = Al(t, n, s, o);
      return;
    }
  }
  Me.flags |= e, l.memoizedState = Al(1 | t, n, s, o);
}
function jm(e, t) {
  return su(8390656, 8, e, t);
}
function Ud(e, t) {
  return Zu(2048, 8, e, t);
}
function fv(e, t) {
  return Zu(4, 2, e, t);
}
function dv(e, t) {
  return Zu(4, 4, e, t);
}
function pv(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function hv(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Zu(4, 4, pv.bind(null, t, e), n);
}
function Hd() {
}
function mv(e, t) {
  var n = pn();
  t = t === void 0 ? null : t;
  var o = n.memoizedState;
  return o !== null && t !== null && Dd(t, o[1]) ? o[0] : (n.memoizedState = [e, t], e);
}
function gv(e, t) {
  var n = pn();
  t = t === void 0 ? null : t;
  var o = n.memoizedState;
  return o !== null && t !== null && Dd(t, o[1]) ? o[0] : (e = e(), n.memoizedState = [e, t], e);
}
function yv(e, t, n) {
  return fi & 21 ? (Cn(n, t) || (n = xy(), Me.lanes |= n, di |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, zt = !0), e.memoizedState = n);
}
function G_(e, t) {
  var n = ge;
  ge = n !== 0 && 4 > n ? n : 4, e(!0);
  var o = Oc.transition;
  Oc.transition = {};
  try {
    e(!1), t();
  } finally {
    ge = n, Oc.transition = o;
  }
}
function vv() {
  return pn().memoizedState;
}
function W_(e, t, n) {
  var o = Ir(e);
  if (n = { lane: o, action: n, hasEagerState: !1, eagerState: null, next: null }, Sv(e)) wv(t, n);
  else if (n = ev(e, t, n, o), n !== null) {
    var l = St();
    Pn(n, e, o, l), _v(n, t, o);
  }
}
function V_(e, t, n) {
  var o = Ir(e), l = { lane: o, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (Sv(e)) wv(t, l);
  else {
    var s = e.alternate;
    if (e.lanes === 0 && (s === null || s.lanes === 0) && (s = t.lastRenderedReducer, s !== null)) try {
      var a = t.lastRenderedState, f = s(a, n);
      if (l.hasEagerState = !0, l.eagerState = f, Cn(f, a)) {
        var p = t.interleaved;
        p === null ? (l.next = l, Nd(t)) : (l.next = p.next, p.next = l), t.interleaved = l;
        return;
      }
    } catch {
    } finally {
    }
    n = ev(e, t, l, o), n !== null && (l = St(), Pn(n, e, o, l), _v(n, t, o));
  }
}
function Sv(e) {
  var t = e.alternate;
  return e === Me || t !== null && t === Me;
}
function wv(e, t) {
  cl = zu = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function _v(e, t, n) {
  if (n & 4194240) {
    var o = t.lanes;
    o &= e.pendingLanes, n |= o, t.lanes = n, yd(e, n);
  }
}
var Iu = { readContext: dn, useCallback: ct, useContext: ct, useEffect: ct, useImperativeHandle: ct, useInsertionEffect: ct, useLayoutEffect: ct, useMemo: ct, useReducer: ct, useRef: ct, useState: ct, useDebugValue: ct, useDeferredValue: ct, useTransition: ct, useMutableSource: ct, useSyncExternalStore: ct, useId: ct, unstable_isNewReconciler: !1 }, K_ = { readContext: dn, useCallback: function(e, t) {
  return Fn().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: dn, useEffect: jm, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, su(
    4194308,
    4,
    pv.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return su(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return su(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = Fn();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var o = Fn();
  return t = n !== void 0 ? n(t) : t, o.memoizedState = o.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, o.queue = e, e = e.dispatch = W_.bind(null, Me, e), [o.memoizedState, e];
}, useRef: function(e) {
  var t = Fn();
  return e = { current: e }, t.memoizedState = e;
}, useState: Dm, useDebugValue: Hd, useDeferredValue: function(e) {
  return Fn().memoizedState = e;
}, useTransition: function() {
  var e = Dm(!1), t = e[0];
  return e = G_.bind(null, e[1]), Fn().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var o = Me, l = Fn();
  if (Ae) {
    if (n === void 0) throw Error(H(407));
    n = n();
  } else {
    if (n = t(), $e === null) throw Error(H(349));
    fi & 30 || ov(o, t, n);
  }
  l.memoizedState = n;
  var s = { value: n, getSnapshot: t };
  return l.queue = s, jm(sv.bind(
    null,
    o,
    s,
    e
  ), [e]), o.flags |= 2048, Al(9, lv.bind(null, o, s, n, t), void 0, null), n;
}, useId: function() {
  var e = Fn(), t = $e.identifierPrefix;
  if (Ae) {
    var n = er, o = bn;
    n = (o & ~(1 << 32 - Tn(o) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = Cl++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = B_++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, Q_ = {
  readContext: dn,
  useCallback: mv,
  useContext: dn,
  useEffect: Ud,
  useImperativeHandle: hv,
  useInsertionEffect: fv,
  useLayoutEffect: dv,
  useMemo: gv,
  useReducer: Dc,
  useRef: cv,
  useState: function() {
    return Dc(Rl);
  },
  useDebugValue: Hd,
  useDeferredValue: function(e) {
    var t = pn();
    return yv(t, Ke.memoizedState, e);
  },
  useTransition: function() {
    var e = Dc(Rl)[0], t = pn().memoizedState;
    return [e, t];
  },
  useMutableSource: rv,
  useSyncExternalStore: iv,
  useId: vv,
  unstable_isNewReconciler: !1
}, X_ = { readContext: dn, useCallback: mv, useContext: dn, useEffect: Ud, useImperativeHandle: hv, useInsertionEffect: fv, useLayoutEffect: dv, useMemo: gv, useReducer: jc, useRef: cv, useState: function() {
  return jc(Rl);
}, useDebugValue: Hd, useDeferredValue: function(e) {
  var t = pn();
  return Ke === null ? t.memoizedState = e : yv(t, Ke.memoizedState, e);
}, useTransition: function() {
  var e = jc(Rl)[0], t = pn().memoizedState;
  return [e, t];
}, useMutableSource: rv, useSyncExternalStore: iv, useId: vv, unstable_isNewReconciler: !1 };
function xn(e, t) {
  if (e && e.defaultProps) {
    t = ze({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function Ff(e, t, n, o) {
  t = e.memoizedState, n = n(o, t), n = n == null ? t : ze({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var Ju = { isMounted: function(e) {
  return (e = e._reactInternals) ? mi(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var o = St(), l = Ir(e), s = tr(o, l);
  s.payload = t, n != null && (s.callback = n), t = Mr(e, s, l), t !== null && (Pn(t, e, l, o), ou(t, e, l));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var o = St(), l = Ir(e), s = tr(o, l);
  s.tag = 1, s.payload = t, n != null && (s.callback = n), t = Mr(e, s, l), t !== null && (Pn(t, e, l, o), ou(t, e, l));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = St(), o = Ir(e), l = tr(n, o);
  l.tag = 2, t != null && (l.callback = t), t = Mr(e, l, o), t !== null && (Pn(t, e, o, n), ou(t, e, o));
} };
function Fm(e, t, n, o, l, s, a) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(o, s, a) : t.prototype && t.prototype.isPureReactComponent ? !_l(n, o) || !_l(l, s) : !0;
}
function xv(e, t, n) {
  var o = !1, l = Fr, s = t.contextType;
  return typeof s == "object" && s !== null ? s = dn(s) : (l = Ot(t) ? ai : mt.current, o = t.contextTypes, s = (o = o != null) ? lo(e, l) : Fr), t = new t(n, s), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Ju, e.stateNode = t, t._reactInternals = e, o && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = l, e.__reactInternalMemoizedMaskedChildContext = s), t;
}
function Um(e, t, n, o) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, o), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, o), t.state !== e && Ju.enqueueReplaceState(t, t.state, null);
}
function Uf(e, t, n, o) {
  var l = e.stateNode;
  l.props = n, l.state = e.memoizedState, l.refs = {}, Md(e);
  var s = t.contextType;
  typeof s == "object" && s !== null ? l.context = dn(s) : (s = Ot(t) ? ai : mt.current, l.context = lo(e, s)), l.state = e.memoizedState, s = t.getDerivedStateFromProps, typeof s == "function" && (Ff(e, t, s, n), l.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof l.getSnapshotBeforeUpdate == "function" || typeof l.UNSAFE_componentWillMount != "function" && typeof l.componentWillMount != "function" || (t = l.state, typeof l.componentWillMount == "function" && l.componentWillMount(), typeof l.UNSAFE_componentWillMount == "function" && l.UNSAFE_componentWillMount(), t !== l.state && Ju.enqueueReplaceState(l, l.state, null), Nu(e, n, l, o), l.state = e.memoizedState), typeof l.componentDidMount == "function" && (e.flags |= 4194308);
}
function co(e, t) {
  try {
    var n = "", o = t;
    do
      n += _w(o), o = o.return;
    while (o);
    var l = n;
  } catch (s) {
    l = `
Error generating stack: ` + s.message + `
` + s.stack;
  }
  return { value: e, source: t, stack: l, digest: null };
}
function Fc(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Hf(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var Y_ = typeof WeakMap == "function" ? WeakMap : Map;
function Ev(e, t, n) {
  n = tr(-1, n), n.tag = 3, n.payload = { element: null };
  var o = t.value;
  return n.callback = function() {
    Du || (Du = !0, Jf = o), Hf(e, t);
  }, n;
}
function kv(e, t, n) {
  n = tr(-1, n), n.tag = 3;
  var o = e.type.getDerivedStateFromError;
  if (typeof o == "function") {
    var l = t.value;
    n.payload = function() {
      return o(l);
    }, n.callback = function() {
      Hf(e, t);
    };
  }
  var s = e.stateNode;
  return s !== null && typeof s.componentDidCatch == "function" && (n.callback = function() {
    Hf(e, t), typeof o != "function" && (zr === null ? zr = /* @__PURE__ */ new Set([this]) : zr.add(this));
    var a = t.stack;
    this.componentDidCatch(t.value, { componentStack: a !== null ? a : "" });
  }), n;
}
function Hm(e, t, n) {
  var o = e.pingCache;
  if (o === null) {
    o = e.pingCache = new Y_();
    var l = /* @__PURE__ */ new Set();
    o.set(t, l);
  } else l = o.get(t), l === void 0 && (l = /* @__PURE__ */ new Set(), o.set(t, l));
  l.has(n) || (l.add(n), e = ux.bind(null, e, t, n), t.then(e, e));
}
function Bm(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Gm(e, t, n, o, l) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = l, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = tr(-1, 1), t.tag = 2, Mr(n, t, 1))), n.lanes |= 1), e);
}
var Z_ = lr.ReactCurrentOwner, zt = !1;
function vt(e, t, n, o) {
  t.child = e === null ? by(t, null, n, o) : uo(t, e.child, n, o);
}
function Wm(e, t, n, o, l) {
  n = n.render;
  var s = t.ref;
  return no(t, l), o = jd(e, t, n, o, s, l), n = Fd(), e !== null && !zt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, or(e, t, l)) : (Ae && n && Td(t), t.flags |= 1, vt(e, t, o, l), t.child);
}
function Vm(e, t, n, o, l) {
  if (e === null) {
    var s = n.type;
    return typeof s == "function" && !Yd(s) && s.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = s, Tv(e, t, s, o, l)) : (e = fu(n.type, null, o, t, t.mode, l), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (s = e.child, !(e.lanes & l)) {
    var a = s.memoizedProps;
    if (n = n.compare, n = n !== null ? n : _l, n(a, o) && e.ref === t.ref) return or(e, t, l);
  }
  return t.flags |= 1, e = Or(s, o), e.ref = t.ref, e.return = t, t.child = e;
}
function Tv(e, t, n, o, l) {
  if (e !== null) {
    var s = e.memoizedProps;
    if (_l(s, o) && e.ref === t.ref) if (zt = !1, t.pendingProps = o = s, (e.lanes & l) !== 0) e.flags & 131072 && (zt = !0);
    else return t.lanes = e.lanes, or(e, t, l);
  }
  return Bf(e, t, n, o, l);
}
function Pv(e, t, n) {
  var o = t.pendingProps, l = o.children, s = e !== null ? e.memoizedState : null;
  if (o.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, ke(Zi, Vt), Vt |= n;
  else {
    if (!(n & 1073741824)) return e = s !== null ? s.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, ke(Zi, Vt), Vt |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, o = s !== null ? s.baseLanes : n, ke(Zi, Vt), Vt |= o;
  }
  else s !== null ? (o = s.baseLanes | n, t.memoizedState = null) : o = n, ke(Zi, Vt), Vt |= o;
  return vt(e, t, l, n), t.child;
}
function Cv(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function Bf(e, t, n, o, l) {
  var s = Ot(n) ? ai : mt.current;
  return s = lo(t, s), no(t, l), n = jd(e, t, n, o, s, l), o = Fd(), e !== null && !zt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~l, or(e, t, l)) : (Ae && o && Td(t), t.flags |= 1, vt(e, t, n, l), t.child);
}
function Km(e, t, n, o, l) {
  if (Ot(n)) {
    var s = !0;
    Pu(t);
  } else s = !1;
  if (no(t, l), t.stateNode === null) uu(e, t), xv(t, n, o), Uf(t, n, o, l), o = !0;
  else if (e === null) {
    var a = t.stateNode, f = t.memoizedProps;
    a.props = f;
    var p = a.context, m = n.contextType;
    typeof m == "object" && m !== null ? m = dn(m) : (m = Ot(n) ? ai : mt.current, m = lo(t, m));
    var g = n.getDerivedStateFromProps, y = typeof g == "function" || typeof a.getSnapshotBeforeUpdate == "function";
    y || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (f !== o || p !== m) && Um(t, a, o, m), xr = !1;
    var v = t.memoizedState;
    a.state = v, Nu(t, o, a, l), p = t.memoizedState, f !== o || v !== p || It.current || xr ? (typeof g == "function" && (Ff(t, n, g, o), p = t.memoizedState), (f = xr || Fm(t, n, f, o, v, p, m)) ? (y || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = o, t.memoizedState = p), a.props = o, a.state = p, a.context = m, o = f) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), o = !1);
  } else {
    a = t.stateNode, tv(e, t), f = t.memoizedProps, m = t.type === t.elementType ? f : xn(t.type, f), a.props = m, y = t.pendingProps, v = a.context, p = n.contextType, typeof p == "object" && p !== null ? p = dn(p) : (p = Ot(n) ? ai : mt.current, p = lo(t, p));
    var _ = n.getDerivedStateFromProps;
    (g = typeof _ == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (f !== y || v !== p) && Um(t, a, o, p), xr = !1, v = t.memoizedState, a.state = v, Nu(t, o, a, l);
    var k = t.memoizedState;
    f !== y || v !== k || It.current || xr ? (typeof _ == "function" && (Ff(t, n, _, o), k = t.memoizedState), (m = xr || Fm(t, n, m, o, v, k, p) || !1) ? (g || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(o, k, p), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(o, k, p)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = o, t.memoizedState = k), a.props = o, a.state = k, a.context = p, o = m) : (typeof a.componentDidUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), o = !1);
  }
  return Gf(e, t, n, o, s, l);
}
function Gf(e, t, n, o, l, s) {
  Cv(e, t);
  var a = (t.flags & 128) !== 0;
  if (!o && !a) return l && Lm(t, n, !1), or(e, t, s);
  o = t.stateNode, Z_.current = t;
  var f = a && typeof n.getDerivedStateFromError != "function" ? null : o.render();
  return t.flags |= 1, e !== null && a ? (t.child = uo(t, e.child, null, s), t.child = uo(t, null, f, s)) : vt(e, t, f, s), t.memoizedState = o.state, l && Lm(t, n, !0), t.child;
}
function Rv(e) {
  var t = e.stateNode;
  t.pendingContext ? Am(e, t.pendingContext, t.pendingContext !== t.context) : t.context && Am(e, t.context, !1), zd(e, t.containerInfo);
}
function Qm(e, t, n, o, l) {
  return so(), Cd(l), t.flags |= 256, vt(e, t, n, o), t.child;
}
var Wf = { dehydrated: null, treeContext: null, retryLane: 0 };
function Vf(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Av(e, t, n) {
  var o = t.pendingProps, l = Ne.current, s = !1, a = (t.flags & 128) !== 0, f;
  if ((f = a) || (f = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0), f ? (s = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (l |= 1), ke(Ne, l & 1), e === null)
    return Df(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (a = o.children, e = o.fallback, s ? (o = t.mode, s = t.child, a = { mode: "hidden", children: a }, !(o & 1) && s !== null ? (s.childLanes = 0, s.pendingProps = a) : s = bu(a, o, 0, null), e = ui(e, o, n, null), s.return = t, e.return = t, s.sibling = e, t.child = s, t.child.memoizedState = Vf(n), t.memoizedState = Wf, e) : Bd(t, a));
  if (l = e.memoizedState, l !== null && (f = l.dehydrated, f !== null)) return J_(e, t, a, o, f, l, n);
  if (s) {
    s = o.fallback, a = t.mode, l = e.child, f = l.sibling;
    var p = { mode: "hidden", children: o.children };
    return !(a & 1) && t.child !== l ? (o = t.child, o.childLanes = 0, o.pendingProps = p, t.deletions = null) : (o = Or(l, p), o.subtreeFlags = l.subtreeFlags & 14680064), f !== null ? s = Or(f, s) : (s = ui(s, a, n, null), s.flags |= 2), s.return = t, o.return = t, o.sibling = s, t.child = o, o = s, s = t.child, a = e.child.memoizedState, a = a === null ? Vf(n) : { baseLanes: a.baseLanes | n, cachePool: null, transitions: a.transitions }, s.memoizedState = a, s.childLanes = e.childLanes & ~n, t.memoizedState = Wf, o;
  }
  return s = e.child, e = s.sibling, o = Or(s, { mode: "visible", children: o.children }), !(t.mode & 1) && (o.lanes = n), o.return = t, o.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = o, t.memoizedState = null, o;
}
function Bd(e, t) {
  return t = bu({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function Qs(e, t, n, o) {
  return o !== null && Cd(o), uo(t, e.child, null, n), e = Bd(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function J_(e, t, n, o, l, s, a) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, o = Fc(Error(H(422))), Qs(e, t, a, o)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (s = o.fallback, l = t.mode, o = bu({ mode: "visible", children: o.children }, l, 0, null), s = ui(s, l, a, null), s.flags |= 2, o.return = t, s.return = t, o.sibling = s, t.child = o, t.mode & 1 && uo(t, e.child, null, a), t.child.memoizedState = Vf(a), t.memoizedState = Wf, s);
  if (!(t.mode & 1)) return Qs(e, t, a, null);
  if (l.data === "$!") {
    if (o = l.nextSibling && l.nextSibling.dataset, o) var f = o.dgst;
    return o = f, s = Error(H(419)), o = Fc(s, o, void 0), Qs(e, t, a, o);
  }
  if (f = (a & e.childLanes) !== 0, zt || f) {
    if (o = $e, o !== null) {
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
      l = l & (o.suspendedLanes | a) ? 0 : l, l !== 0 && l !== s.retryLane && (s.retryLane = l, ir(e, l), Pn(o, e, l, -1));
    }
    return Xd(), o = Fc(Error(H(421))), Qs(e, t, a, o);
  }
  return l.data === "$?" ? (t.flags |= 128, t.child = e.child, t = ax.bind(null, e), l._reactRetry = t, null) : (e = s.treeContext, Kt = Nr(l.nextSibling), Qt = t, Ae = !0, kn = null, e !== null && (un[an++] = bn, un[an++] = er, un[an++] = ci, bn = e.id, er = e.overflow, ci = t), t = Bd(t, o.children), t.flags |= 4096, t);
}
function Xm(e, t, n) {
  e.lanes |= t;
  var o = e.alternate;
  o !== null && (o.lanes |= t), jf(e.return, t, n);
}
function Uc(e, t, n, o, l) {
  var s = e.memoizedState;
  s === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: o, tail: n, tailMode: l } : (s.isBackwards = t, s.rendering = null, s.renderingStartTime = 0, s.last = o, s.tail = n, s.tailMode = l);
}
function Lv(e, t, n) {
  var o = t.pendingProps, l = o.revealOrder, s = o.tail;
  if (vt(e, t, o.children, n), o = Ne.current, o & 2) o = o & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Xm(e, n, t);
      else if (e.tag === 19) Xm(e, n, t);
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
  if (ke(Ne, o), !(t.mode & 1)) t.memoizedState = null;
  else switch (l) {
    case "forwards":
      for (n = t.child, l = null; n !== null; ) e = n.alternate, e !== null && Mu(e) === null && (l = n), n = n.sibling;
      n = l, n === null ? (l = t.child, t.child = null) : (l = n.sibling, n.sibling = null), Uc(t, !1, l, n, s);
      break;
    case "backwards":
      for (n = null, l = t.child, t.child = null; l !== null; ) {
        if (e = l.alternate, e !== null && Mu(e) === null) {
          t.child = l;
          break;
        }
        e = l.sibling, l.sibling = n, n = l, l = e;
      }
      Uc(t, !0, n, null, s);
      break;
    case "together":
      Uc(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function uu(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function or(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), di |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(H(153));
  if (t.child !== null) {
    for (e = t.child, n = Or(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Or(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function q_(e, t, n) {
  switch (t.tag) {
    case 3:
      Rv(t), so();
      break;
    case 5:
      nv(t);
      break;
    case 1:
      Ot(t.type) && Pu(t);
      break;
    case 4:
      zd(t, t.stateNode.containerInfo);
      break;
    case 10:
      var o = t.type._context, l = t.memoizedProps.value;
      ke(Au, o._currentValue), o._currentValue = l;
      break;
    case 13:
      if (o = t.memoizedState, o !== null)
        return o.dehydrated !== null ? (ke(Ne, Ne.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? Av(e, t, n) : (ke(Ne, Ne.current & 1), e = or(e, t, n), e !== null ? e.sibling : null);
      ke(Ne, Ne.current & 1);
      break;
    case 19:
      if (o = (n & t.childLanes) !== 0, e.flags & 128) {
        if (o) return Lv(e, t, n);
        t.flags |= 128;
      }
      if (l = t.memoizedState, l !== null && (l.rendering = null, l.tail = null, l.lastEffect = null), ke(Ne, Ne.current), o) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, Pv(e, t, n);
  }
  return or(e, t, n);
}
var Nv, Kf, Mv, zv;
Nv = function(e, t) {
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
Kf = function() {
};
Mv = function(e, t, n, o) {
  var l = e.memoizedProps;
  if (l !== o) {
    e = t.stateNode, oi(Bn.current);
    var s = null;
    switch (n) {
      case "input":
        l = pf(e, l), o = pf(e, o), s = [];
        break;
      case "select":
        l = ze({}, l, { value: void 0 }), o = ze({}, o, { value: void 0 }), s = [];
        break;
      case "textarea":
        l = gf(e, l), o = gf(e, o), s = [];
        break;
      default:
        typeof l.onClick != "function" && typeof o.onClick == "function" && (e.onclick = ku);
    }
    vf(n, o);
    var a;
    n = null;
    for (m in l) if (!o.hasOwnProperty(m) && l.hasOwnProperty(m) && l[m] != null) if (m === "style") {
      var f = l[m];
      for (a in f) f.hasOwnProperty(a) && (n || (n = {}), n[a] = "");
    } else m !== "dangerouslySetInnerHTML" && m !== "children" && m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && m !== "autoFocus" && (hl.hasOwnProperty(m) ? s || (s = []) : (s = s || []).push(m, null));
    for (m in o) {
      var p = o[m];
      if (f = l != null ? l[m] : void 0, o.hasOwnProperty(m) && p !== f && (p != null || f != null)) if (m === "style") if (f) {
        for (a in f) !f.hasOwnProperty(a) || p && p.hasOwnProperty(a) || (n || (n = {}), n[a] = "");
        for (a in p) p.hasOwnProperty(a) && f[a] !== p[a] && (n || (n = {}), n[a] = p[a]);
      } else n || (s || (s = []), s.push(
        m,
        n
      )), n = p;
      else m === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, f = f ? f.__html : void 0, p != null && f !== p && (s = s || []).push(m, p)) : m === "children" ? typeof p != "string" && typeof p != "number" || (s = s || []).push(m, "" + p) : m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && (hl.hasOwnProperty(m) ? (p != null && m === "onScroll" && Pe("scroll", e), s || f === p || (s = [])) : (s = s || []).push(m, p));
    }
    n && (s = s || []).push("style", n);
    var m = s;
    (t.updateQueue = m) && (t.flags |= 4);
  }
};
zv = function(e, t, n, o) {
  n !== o && (t.flags |= 4);
};
function Xo(e, t) {
  if (!Ae) switch (e.tailMode) {
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
function ft(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, o = 0;
  if (t) for (var l = e.child; l !== null; ) n |= l.lanes | l.childLanes, o |= l.subtreeFlags & 14680064, o |= l.flags & 14680064, l.return = e, l = l.sibling;
  else for (l = e.child; l !== null; ) n |= l.lanes | l.childLanes, o |= l.subtreeFlags, o |= l.flags, l.return = e, l = l.sibling;
  return e.subtreeFlags |= o, e.childLanes = n, t;
}
function $_(e, t, n) {
  var o = t.pendingProps;
  switch (Pd(t), t.tag) {
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
      return ft(t), null;
    case 1:
      return Ot(t.type) && Tu(), ft(t), null;
    case 3:
      return o = t.stateNode, ao(), Ce(It), Ce(mt), Od(), o.pendingContext && (o.context = o.pendingContext, o.pendingContext = null), (e === null || e.child === null) && (Vs(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, kn !== null && (bf(kn), kn = null))), Kf(e, t), ft(t), null;
    case 5:
      Id(t);
      var l = oi(Pl.current);
      if (n = t.type, e !== null && t.stateNode != null) Mv(e, t, n, o, l), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!o) {
          if (t.stateNode === null) throw Error(H(166));
          return ft(t), null;
        }
        if (e = oi(Bn.current), Vs(t)) {
          o = t.stateNode, n = t.type;
          var s = t.memoizedProps;
          switch (o[Un] = t, o[kl] = s, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              Pe("cancel", o), Pe("close", o);
              break;
            case "iframe":
            case "object":
            case "embed":
              Pe("load", o);
              break;
            case "video":
            case "audio":
              for (l = 0; l < nl.length; l++) Pe(nl[l], o);
              break;
            case "source":
              Pe("error", o);
              break;
            case "img":
            case "image":
            case "link":
              Pe(
                "error",
                o
              ), Pe("load", o);
              break;
            case "details":
              Pe("toggle", o);
              break;
            case "input":
              nm(o, s), Pe("invalid", o);
              break;
            case "select":
              o._wrapperState = { wasMultiple: !!s.multiple }, Pe("invalid", o);
              break;
            case "textarea":
              im(o, s), Pe("invalid", o);
          }
          vf(n, s), l = null;
          for (var a in s) if (s.hasOwnProperty(a)) {
            var f = s[a];
            a === "children" ? typeof f == "string" ? o.textContent !== f && (s.suppressHydrationWarning !== !0 && Ws(o.textContent, f, e), l = ["children", f]) : typeof f == "number" && o.textContent !== "" + f && (s.suppressHydrationWarning !== !0 && Ws(
              o.textContent,
              f,
              e
            ), l = ["children", "" + f]) : hl.hasOwnProperty(a) && f != null && a === "onScroll" && Pe("scroll", o);
          }
          switch (n) {
            case "input":
              Os(o), rm(o, s, !0);
              break;
            case "textarea":
              Os(o), om(o);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof s.onClick == "function" && (o.onclick = ku);
          }
          o = l, t.updateQueue = o, o !== null && (t.flags |= 4);
        } else {
          a = l.nodeType === 9 ? l : l.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = sy(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = a.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof o.is == "string" ? e = a.createElement(n, { is: o.is }) : (e = a.createElement(n), n === "select" && (a = e, o.multiple ? a.multiple = !0 : o.size && (a.size = o.size))) : e = a.createElementNS(e, n), e[Un] = t, e[kl] = o, Nv(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (a = Sf(n, o), n) {
              case "dialog":
                Pe("cancel", e), Pe("close", e), l = o;
                break;
              case "iframe":
              case "object":
              case "embed":
                Pe("load", e), l = o;
                break;
              case "video":
              case "audio":
                for (l = 0; l < nl.length; l++) Pe(nl[l], e);
                l = o;
                break;
              case "source":
                Pe("error", e), l = o;
                break;
              case "img":
              case "image":
              case "link":
                Pe(
                  "error",
                  e
                ), Pe("load", e), l = o;
                break;
              case "details":
                Pe("toggle", e), l = o;
                break;
              case "input":
                nm(e, o), l = pf(e, o), Pe("invalid", e);
                break;
              case "option":
                l = o;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!o.multiple }, l = ze({}, o, { value: void 0 }), Pe("invalid", e);
                break;
              case "textarea":
                im(e, o), l = gf(e, o), Pe("invalid", e);
                break;
              default:
                l = o;
            }
            vf(n, l), f = l;
            for (s in f) if (f.hasOwnProperty(s)) {
              var p = f[s];
              s === "style" ? cy(e, p) : s === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, p != null && uy(e, p)) : s === "children" ? typeof p == "string" ? (n !== "textarea" || p !== "") && ml(e, p) : typeof p == "number" && ml(e, "" + p) : s !== "suppressContentEditableWarning" && s !== "suppressHydrationWarning" && s !== "autoFocus" && (hl.hasOwnProperty(s) ? p != null && s === "onScroll" && Pe("scroll", e) : p != null && fd(e, s, p, a));
            }
            switch (n) {
              case "input":
                Os(e), rm(e, o, !1);
                break;
              case "textarea":
                Os(e), om(e);
                break;
              case "option":
                o.value != null && e.setAttribute("value", "" + jr(o.value));
                break;
              case "select":
                e.multiple = !!o.multiple, s = o.value, s != null ? $i(e, !!o.multiple, s, !1) : o.defaultValue != null && $i(
                  e,
                  !!o.multiple,
                  o.defaultValue,
                  !0
                );
                break;
              default:
                typeof l.onClick == "function" && (e.onclick = ku);
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
      return ft(t), null;
    case 6:
      if (e && t.stateNode != null) zv(e, t, e.memoizedProps, o);
      else {
        if (typeof o != "string" && t.stateNode === null) throw Error(H(166));
        if (n = oi(Pl.current), oi(Bn.current), Vs(t)) {
          if (o = t.stateNode, n = t.memoizedProps, o[Un] = t, (s = o.nodeValue !== n) && (e = Qt, e !== null)) switch (e.tag) {
            case 3:
              Ws(o.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && Ws(o.nodeValue, n, (e.mode & 1) !== 0);
          }
          s && (t.flags |= 4);
        } else o = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(o), o[Un] = t, t.stateNode = o;
      }
      return ft(t), null;
    case 13:
      if (Ce(Ne), o = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (Ae && Kt !== null && t.mode & 1 && !(t.flags & 128)) qy(), so(), t.flags |= 98560, s = !1;
        else if (s = Vs(t), o !== null && o.dehydrated !== null) {
          if (e === null) {
            if (!s) throw Error(H(318));
            if (s = t.memoizedState, s = s !== null ? s.dehydrated : null, !s) throw Error(H(317));
            s[Un] = t;
          } else so(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ft(t), s = !1;
        } else kn !== null && (bf(kn), kn = null), s = !0;
        if (!s) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (o = o !== null, o !== (e !== null && e.memoizedState !== null) && o && (t.child.flags |= 8192, t.mode & 1 && (e === null || Ne.current & 1 ? Qe === 0 && (Qe = 3) : Xd())), t.updateQueue !== null && (t.flags |= 4), ft(t), null);
    case 4:
      return ao(), Kf(e, t), e === null && xl(t.stateNode.containerInfo), ft(t), null;
    case 10:
      return Ld(t.type._context), ft(t), null;
    case 17:
      return Ot(t.type) && Tu(), ft(t), null;
    case 19:
      if (Ce(Ne), s = t.memoizedState, s === null) return ft(t), null;
      if (o = (t.flags & 128) !== 0, a = s.rendering, a === null) if (o) Xo(s, !1);
      else {
        if (Qe !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (a = Mu(e), a !== null) {
            for (t.flags |= 128, Xo(s, !1), o = a.updateQueue, o !== null && (t.updateQueue = o, t.flags |= 4), t.subtreeFlags = 0, o = n, n = t.child; n !== null; ) s = n, e = o, s.flags &= 14680066, a = s.alternate, a === null ? (s.childLanes = 0, s.lanes = e, s.child = null, s.subtreeFlags = 0, s.memoizedProps = null, s.memoizedState = null, s.updateQueue = null, s.dependencies = null, s.stateNode = null) : (s.childLanes = a.childLanes, s.lanes = a.lanes, s.child = a.child, s.subtreeFlags = 0, s.deletions = null, s.memoizedProps = a.memoizedProps, s.memoizedState = a.memoizedState, s.updateQueue = a.updateQueue, s.type = a.type, e = a.dependencies, s.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return ke(Ne, Ne.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        s.tail !== null && Ue() > fo && (t.flags |= 128, o = !0, Xo(s, !1), t.lanes = 4194304);
      }
      else {
        if (!o) if (e = Mu(a), e !== null) {
          if (t.flags |= 128, o = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), Xo(s, !0), s.tail === null && s.tailMode === "hidden" && !a.alternate && !Ae) return ft(t), null;
        } else 2 * Ue() - s.renderingStartTime > fo && n !== 1073741824 && (t.flags |= 128, o = !0, Xo(s, !1), t.lanes = 4194304);
        s.isBackwards ? (a.sibling = t.child, t.child = a) : (n = s.last, n !== null ? n.sibling = a : t.child = a, s.last = a);
      }
      return s.tail !== null ? (t = s.tail, s.rendering = t, s.tail = t.sibling, s.renderingStartTime = Ue(), t.sibling = null, n = Ne.current, ke(Ne, o ? n & 1 | 2 : n & 1), t) : (ft(t), null);
    case 22:
    case 23:
      return Qd(), o = t.memoizedState !== null, e !== null && e.memoizedState !== null !== o && (t.flags |= 8192), o && t.mode & 1 ? Vt & 1073741824 && (ft(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ft(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(H(156, t.tag));
}
function b_(e, t) {
  switch (Pd(t), t.tag) {
    case 1:
      return Ot(t.type) && Tu(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return ao(), Ce(It), Ce(mt), Od(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return Id(t), null;
    case 13:
      if (Ce(Ne), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(H(340));
        so();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return Ce(Ne), null;
    case 4:
      return ao(), null;
    case 10:
      return Ld(t.type._context), null;
    case 22:
    case 23:
      return Qd(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var Xs = !1, ht = !1, ex = typeof WeakSet == "function" ? WeakSet : Set, Z = null;
function Yi(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (o) {
    De(e, t, o);
  }
  else n.current = null;
}
function Qf(e, t, n) {
  try {
    n();
  } catch (o) {
    De(e, t, o);
  }
}
var Ym = !1;
function tx(e, t) {
  if (Af = _u, e = Fy(), kd(e)) {
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
        var a = 0, f = -1, p = -1, m = 0, g = 0, y = e, v = null;
        t: for (; ; ) {
          for (var _; y !== n || l !== 0 && y.nodeType !== 3 || (f = a + l), y !== s || o !== 0 && y.nodeType !== 3 || (p = a + o), y.nodeType === 3 && (a += y.nodeValue.length), (_ = y.firstChild) !== null; )
            v = y, y = _;
          for (; ; ) {
            if (y === e) break t;
            if (v === n && ++m === l && (f = a), v === s && ++g === o && (p = a), (_ = y.nextSibling) !== null) break;
            y = v, v = y.parentNode;
          }
          y = _;
        }
        n = f === -1 || p === -1 ? null : { start: f, end: p };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (Lf = { focusedElem: e, selectionRange: n }, _u = !1, Z = t; Z !== null; ) if (t = Z, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, Z = e;
  else for (; Z !== null; ) {
    t = Z;
    try {
      var k = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (k !== null) {
            var R = k.memoizedProps, A = k.memoizedState, w = t.stateNode, S = w.getSnapshotBeforeUpdate(t.elementType === t.type ? R : xn(t.type, R), A);
            w.__reactInternalSnapshotBeforeUpdate = S;
          }
          break;
        case 3:
          var x = t.stateNode.containerInfo;
          x.nodeType === 1 ? x.textContent = "" : x.nodeType === 9 && x.documentElement && x.removeChild(x.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(H(163));
      }
    } catch (C) {
      De(t, t.return, C);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, Z = e;
      break;
    }
    Z = t.return;
  }
  return k = Ym, Ym = !1, k;
}
function fl(e, t, n) {
  var o = t.updateQueue;
  if (o = o !== null ? o.lastEffect : null, o !== null) {
    var l = o = o.next;
    do {
      if ((l.tag & e) === e) {
        var s = l.destroy;
        l.destroy = void 0, s !== void 0 && Qf(t, n, s);
      }
      l = l.next;
    } while (l !== o);
  }
}
function qu(e, t) {
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
function Xf(e) {
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
function Iv(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, Iv(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Un], delete t[kl], delete t[zf], delete t[j_], delete t[F_])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function Ov(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Zm(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || Ov(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Yf(e, t, n) {
  var o = e.tag;
  if (o === 5 || o === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = ku));
  else if (o !== 4 && (e = e.child, e !== null)) for (Yf(e, t, n), e = e.sibling; e !== null; ) Yf(e, t, n), e = e.sibling;
}
function Zf(e, t, n) {
  var o = e.tag;
  if (o === 5 || o === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (o !== 4 && (e = e.child, e !== null)) for (Zf(e, t, n), e = e.sibling; e !== null; ) Zf(e, t, n), e = e.sibling;
}
var tt = null, En = !1;
function yr(e, t, n) {
  for (n = n.child; n !== null; ) Dv(e, t, n), n = n.sibling;
}
function Dv(e, t, n) {
  if (Hn && typeof Hn.onCommitFiberUnmount == "function") try {
    Hn.onCommitFiberUnmount(Wu, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      ht || Yi(n, t);
    case 6:
      var o = tt, l = En;
      tt = null, yr(e, t, n), tt = o, En = l, tt !== null && (En ? (e = tt, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : tt.removeChild(n.stateNode));
      break;
    case 18:
      tt !== null && (En ? (e = tt, n = n.stateNode, e.nodeType === 8 ? Mc(e.parentNode, n) : e.nodeType === 1 && Mc(e, n), Sl(e)) : Mc(tt, n.stateNode));
      break;
    case 4:
      o = tt, l = En, tt = n.stateNode.containerInfo, En = !0, yr(e, t, n), tt = o, En = l;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!ht && (o = n.updateQueue, o !== null && (o = o.lastEffect, o !== null))) {
        l = o = o.next;
        do {
          var s = l, a = s.destroy;
          s = s.tag, a !== void 0 && (s & 2 || s & 4) && Qf(n, t, a), l = l.next;
        } while (l !== o);
      }
      yr(e, t, n);
      break;
    case 1:
      if (!ht && (Yi(n, t), o = n.stateNode, typeof o.componentWillUnmount == "function")) try {
        o.props = n.memoizedProps, o.state = n.memoizedState, o.componentWillUnmount();
      } catch (f) {
        De(n, t, f);
      }
      yr(e, t, n);
      break;
    case 21:
      yr(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (ht = (o = ht) || n.memoizedState !== null, yr(e, t, n), ht = o) : yr(e, t, n);
      break;
    default:
      yr(e, t, n);
  }
}
function Jm(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new ex()), t.forEach(function(o) {
      var l = cx.bind(null, e, o);
      n.has(o) || (n.add(o), o.then(l, l));
    });
  }
}
function vn(e, t) {
  var n = t.deletions;
  if (n !== null) for (var o = 0; o < n.length; o++) {
    var l = n[o];
    try {
      var s = e, a = t, f = a;
      e: for (; f !== null; ) {
        switch (f.tag) {
          case 5:
            tt = f.stateNode, En = !1;
            break e;
          case 3:
            tt = f.stateNode.containerInfo, En = !0;
            break e;
          case 4:
            tt = f.stateNode.containerInfo, En = !0;
            break e;
        }
        f = f.return;
      }
      if (tt === null) throw Error(H(160));
      Dv(s, a, l), tt = null, En = !1;
      var p = l.alternate;
      p !== null && (p.return = null), l.return = null;
    } catch (m) {
      De(l, t, m);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) jv(t, e), t = t.sibling;
}
function jv(e, t) {
  var n = e.alternate, o = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (vn(t, e), On(e), o & 4) {
        try {
          fl(3, e, e.return), qu(3, e);
        } catch (R) {
          De(e, e.return, R);
        }
        try {
          fl(5, e, e.return);
        } catch (R) {
          De(e, e.return, R);
        }
      }
      break;
    case 1:
      vn(t, e), On(e), o & 512 && n !== null && Yi(n, n.return);
      break;
    case 5:
      if (vn(t, e), On(e), o & 512 && n !== null && Yi(n, n.return), e.flags & 32) {
        var l = e.stateNode;
        try {
          ml(l, "");
        } catch (R) {
          De(e, e.return, R);
        }
      }
      if (o & 4 && (l = e.stateNode, l != null)) {
        var s = e.memoizedProps, a = n !== null ? n.memoizedProps : s, f = e.type, p = e.updateQueue;
        if (e.updateQueue = null, p !== null) try {
          f === "input" && s.type === "radio" && s.name != null && oy(l, s), Sf(f, a);
          var m = Sf(f, s);
          for (a = 0; a < p.length; a += 2) {
            var g = p[a], y = p[a + 1];
            g === "style" ? cy(l, y) : g === "dangerouslySetInnerHTML" ? uy(l, y) : g === "children" ? ml(l, y) : fd(l, g, y, m);
          }
          switch (f) {
            case "input":
              hf(l, s);
              break;
            case "textarea":
              ly(l, s);
              break;
            case "select":
              var v = l._wrapperState.wasMultiple;
              l._wrapperState.wasMultiple = !!s.multiple;
              var _ = s.value;
              _ != null ? $i(l, !!s.multiple, _, !1) : v !== !!s.multiple && (s.defaultValue != null ? $i(
                l,
                !!s.multiple,
                s.defaultValue,
                !0
              ) : $i(l, !!s.multiple, s.multiple ? [] : "", !1));
          }
          l[kl] = s;
        } catch (R) {
          De(e, e.return, R);
        }
      }
      break;
    case 6:
      if (vn(t, e), On(e), o & 4) {
        if (e.stateNode === null) throw Error(H(162));
        l = e.stateNode, s = e.memoizedProps;
        try {
          l.nodeValue = s;
        } catch (R) {
          De(e, e.return, R);
        }
      }
      break;
    case 3:
      if (vn(t, e), On(e), o & 4 && n !== null && n.memoizedState.isDehydrated) try {
        Sl(t.containerInfo);
      } catch (R) {
        De(e, e.return, R);
      }
      break;
    case 4:
      vn(t, e), On(e);
      break;
    case 13:
      vn(t, e), On(e), l = e.child, l.flags & 8192 && (s = l.memoizedState !== null, l.stateNode.isHidden = s, !s || l.alternate !== null && l.alternate.memoizedState !== null || (Vd = Ue())), o & 4 && Jm(e);
      break;
    case 22:
      if (g = n !== null && n.memoizedState !== null, e.mode & 1 ? (ht = (m = ht) || g, vn(t, e), ht = m) : vn(t, e), On(e), o & 8192) {
        if (m = e.memoizedState !== null, (e.stateNode.isHidden = m) && !g && e.mode & 1) for (Z = e, g = e.child; g !== null; ) {
          for (y = Z = g; Z !== null; ) {
            switch (v = Z, _ = v.child, v.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                fl(4, v, v.return);
                break;
              case 1:
                Yi(v, v.return);
                var k = v.stateNode;
                if (typeof k.componentWillUnmount == "function") {
                  o = v, n = v.return;
                  try {
                    t = o, k.props = t.memoizedProps, k.state = t.memoizedState, k.componentWillUnmount();
                  } catch (R) {
                    De(o, n, R);
                  }
                }
                break;
              case 5:
                Yi(v, v.return);
                break;
              case 22:
                if (v.memoizedState !== null) {
                  $m(y);
                  continue;
                }
            }
            _ !== null ? (_.return = v, Z = _) : $m(y);
          }
          g = g.sibling;
        }
        e: for (g = null, y = e; ; ) {
          if (y.tag === 5) {
            if (g === null) {
              g = y;
              try {
                l = y.stateNode, m ? (s = l.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none") : (f = y.stateNode, p = y.memoizedProps.style, a = p != null && p.hasOwnProperty("display") ? p.display : null, f.style.display = ay("display", a));
              } catch (R) {
                De(e, e.return, R);
              }
            }
          } else if (y.tag === 6) {
            if (g === null) try {
              y.stateNode.nodeValue = m ? "" : y.memoizedProps;
            } catch (R) {
              De(e, e.return, R);
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
      vn(t, e), On(e), o & 4 && Jm(e);
      break;
    case 21:
      break;
    default:
      vn(
        t,
        e
      ), On(e);
  }
}
function On(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (Ov(n)) {
            var o = n;
            break e;
          }
          n = n.return;
        }
        throw Error(H(160));
      }
      switch (o.tag) {
        case 5:
          var l = o.stateNode;
          o.flags & 32 && (ml(l, ""), o.flags &= -33);
          var s = Zm(e);
          Zf(e, s, l);
          break;
        case 3:
        case 4:
          var a = o.stateNode.containerInfo, f = Zm(e);
          Yf(e, f, a);
          break;
        default:
          throw Error(H(161));
      }
    } catch (p) {
      De(e, e.return, p);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function nx(e, t, n) {
  Z = e, Fv(e);
}
function Fv(e, t, n) {
  for (var o = (e.mode & 1) !== 0; Z !== null; ) {
    var l = Z, s = l.child;
    if (l.tag === 22 && o) {
      var a = l.memoizedState !== null || Xs;
      if (!a) {
        var f = l.alternate, p = f !== null && f.memoizedState !== null || ht;
        f = Xs;
        var m = ht;
        if (Xs = a, (ht = p) && !m) for (Z = l; Z !== null; ) a = Z, p = a.child, a.tag === 22 && a.memoizedState !== null ? bm(l) : p !== null ? (p.return = a, Z = p) : bm(l);
        for (; s !== null; ) Z = s, Fv(s), s = s.sibling;
        Z = l, Xs = f, ht = m;
      }
      qm(e);
    } else l.subtreeFlags & 8772 && s !== null ? (s.return = l, Z = s) : qm(e);
  }
}
function qm(e) {
  for (; Z !== null; ) {
    var t = Z;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            ht || qu(5, t);
            break;
          case 1:
            var o = t.stateNode;
            if (t.flags & 4 && !ht) if (n === null) o.componentDidMount();
            else {
              var l = t.elementType === t.type ? n.memoizedProps : xn(t.type, n.memoizedProps);
              o.componentDidUpdate(l, n.memoizedState, o.__reactInternalSnapshotBeforeUpdate);
            }
            var s = t.updateQueue;
            s !== null && Om(t, s, o);
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
              Om(t, a, n);
            }
            break;
          case 5:
            var f = t.stateNode;
            if (n === null && t.flags & 4) {
              n = f;
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
                  y !== null && Sl(y);
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
            throw Error(H(163));
        }
        ht || t.flags & 512 && Xf(t);
      } catch (v) {
        De(t, t.return, v);
      }
    }
    if (t === e) {
      Z = null;
      break;
    }
    if (n = t.sibling, n !== null) {
      n.return = t.return, Z = n;
      break;
    }
    Z = t.return;
  }
}
function $m(e) {
  for (; Z !== null; ) {
    var t = Z;
    if (t === e) {
      Z = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      n.return = t.return, Z = n;
      break;
    }
    Z = t.return;
  }
}
function bm(e) {
  for (; Z !== null; ) {
    var t = Z;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            qu(4, t);
          } catch (p) {
            De(t, n, p);
          }
          break;
        case 1:
          var o = t.stateNode;
          if (typeof o.componentDidMount == "function") {
            var l = t.return;
            try {
              o.componentDidMount();
            } catch (p) {
              De(t, l, p);
            }
          }
          var s = t.return;
          try {
            Xf(t);
          } catch (p) {
            De(t, s, p);
          }
          break;
        case 5:
          var a = t.return;
          try {
            Xf(t);
          } catch (p) {
            De(t, a, p);
          }
      }
    } catch (p) {
      De(t, t.return, p);
    }
    if (t === e) {
      Z = null;
      break;
    }
    var f = t.sibling;
    if (f !== null) {
      f.return = t.return, Z = f;
      break;
    }
    Z = t.return;
  }
}
var rx = Math.ceil, Ou = lr.ReactCurrentDispatcher, Gd = lr.ReactCurrentOwner, fn = lr.ReactCurrentBatchConfig, fe = 0, $e = null, Ge = null, nt = 0, Vt = 0, Zi = Hr(0), Qe = 0, Ll = null, di = 0, $u = 0, Wd = 0, dl = null, Mt = null, Vd = 0, fo = 1 / 0, Jn = null, Du = !1, Jf = null, zr = null, Ys = !1, Pr = null, ju = 0, pl = 0, qf = null, au = -1, cu = 0;
function St() {
  return fe & 6 ? Ue() : au !== -1 ? au : au = Ue();
}
function Ir(e) {
  return e.mode & 1 ? fe & 2 && nt !== 0 ? nt & -nt : H_.transition !== null ? (cu === 0 && (cu = xy()), cu) : (e = ge, e !== 0 || (e = window.event, e = e === void 0 ? 16 : Ay(e.type)), e) : 1;
}
function Pn(e, t, n, o) {
  if (50 < pl) throw pl = 0, qf = null, Error(H(185));
  Ml(e, n, o), (!(fe & 2) || e !== $e) && (e === $e && (!(fe & 2) && ($u |= n), Qe === 4 && kr(e, nt)), Dt(e, o), n === 1 && fe === 0 && !(t.mode & 1) && (fo = Ue() + 500, Yu && Br()));
}
function Dt(e, t) {
  var n = e.callbackNode;
  Hw(e, t);
  var o = wu(e, e === $e ? nt : 0);
  if (o === 0) n !== null && um(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = o & -o, e.callbackPriority !== t) {
    if (n != null && um(n), t === 1) e.tag === 0 ? U_(eg.bind(null, e)) : Yy(eg.bind(null, e)), O_(function() {
      !(fe & 6) && Br();
    }), n = null;
    else {
      switch (Ey(o)) {
        case 1:
          n = gd;
          break;
        case 4:
          n = wy;
          break;
        case 16:
          n = Su;
          break;
        case 536870912:
          n = _y;
          break;
        default:
          n = Su;
      }
      n = Qv(n, Uv.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function Uv(e, t) {
  if (au = -1, cu = 0, fe & 6) throw Error(H(327));
  var n = e.callbackNode;
  if (ro() && e.callbackNode !== n) return null;
  var o = wu(e, e === $e ? nt : 0);
  if (o === 0) return null;
  if (o & 30 || o & e.expiredLanes || t) t = Fu(e, o);
  else {
    t = o;
    var l = fe;
    fe |= 2;
    var s = Bv();
    ($e !== e || nt !== t) && (Jn = null, fo = Ue() + 500, si(e, t));
    do
      try {
        lx();
        break;
      } catch (f) {
        Hv(e, f);
      }
    while (!0);
    Ad(), Ou.current = s, fe = l, Ge !== null ? t = 0 : ($e = null, nt = 0, t = Qe);
  }
  if (t !== 0) {
    if (t === 2 && (l = kf(e), l !== 0 && (o = l, t = $f(e, l))), t === 1) throw n = Ll, si(e, 0), kr(e, o), Dt(e, Ue()), n;
    if (t === 6) kr(e, o);
    else {
      if (l = e.current.alternate, !(o & 30) && !ix(l) && (t = Fu(e, o), t === 2 && (s = kf(e), s !== 0 && (o = s, t = $f(e, s))), t === 1)) throw n = Ll, si(e, 0), kr(e, o), Dt(e, Ue()), n;
      switch (e.finishedWork = l, e.finishedLanes = o, t) {
        case 0:
        case 1:
          throw Error(H(345));
        case 2:
          ti(e, Mt, Jn);
          break;
        case 3:
          if (kr(e, o), (o & 130023424) === o && (t = Vd + 500 - Ue(), 10 < t)) {
            if (wu(e, 0) !== 0) break;
            if (l = e.suspendedLanes, (l & o) !== o) {
              St(), e.pingedLanes |= e.suspendedLanes & l;
              break;
            }
            e.timeoutHandle = Mf(ti.bind(null, e, Mt, Jn), t);
            break;
          }
          ti(e, Mt, Jn);
          break;
        case 4:
          if (kr(e, o), (o & 4194240) === o) break;
          for (t = e.eventTimes, l = -1; 0 < o; ) {
            var a = 31 - Tn(o);
            s = 1 << a, a = t[a], a > l && (l = a), o &= ~s;
          }
          if (o = l, o = Ue() - o, o = (120 > o ? 120 : 480 > o ? 480 : 1080 > o ? 1080 : 1920 > o ? 1920 : 3e3 > o ? 3e3 : 4320 > o ? 4320 : 1960 * rx(o / 1960)) - o, 10 < o) {
            e.timeoutHandle = Mf(ti.bind(null, e, Mt, Jn), o);
            break;
          }
          ti(e, Mt, Jn);
          break;
        case 5:
          ti(e, Mt, Jn);
          break;
        default:
          throw Error(H(329));
      }
    }
  }
  return Dt(e, Ue()), e.callbackNode === n ? Uv.bind(null, e) : null;
}
function $f(e, t) {
  var n = dl;
  return e.current.memoizedState.isDehydrated && (si(e, t).flags |= 256), e = Fu(e, t), e !== 2 && (t = Mt, Mt = n, t !== null && bf(t)), e;
}
function bf(e) {
  Mt === null ? Mt = e : Mt.push.apply(Mt, e);
}
function ix(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var o = 0; o < n.length; o++) {
        var l = n[o], s = l.getSnapshot;
        l = l.value;
        try {
          if (!Cn(s(), l)) return !1;
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
function kr(e, t) {
  for (t &= ~Wd, t &= ~$u, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Tn(t), o = 1 << n;
    e[n] = -1, t &= ~o;
  }
}
function eg(e) {
  if (fe & 6) throw Error(H(327));
  ro();
  var t = wu(e, 0);
  if (!(t & 1)) return Dt(e, Ue()), null;
  var n = Fu(e, t);
  if (e.tag !== 0 && n === 2) {
    var o = kf(e);
    o !== 0 && (t = o, n = $f(e, o));
  }
  if (n === 1) throw n = Ll, si(e, 0), kr(e, t), Dt(e, Ue()), n;
  if (n === 6) throw Error(H(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, ti(e, Mt, Jn), Dt(e, Ue()), null;
}
function Kd(e, t) {
  var n = fe;
  fe |= 1;
  try {
    return e(t);
  } finally {
    fe = n, fe === 0 && (fo = Ue() + 500, Yu && Br());
  }
}
function pi(e) {
  Pr !== null && Pr.tag === 0 && !(fe & 6) && ro();
  var t = fe;
  fe |= 1;
  var n = fn.transition, o = ge;
  try {
    if (fn.transition = null, ge = 1, e) return e();
  } finally {
    ge = o, fn.transition = n, fe = t, !(fe & 6) && Br();
  }
}
function Qd() {
  Vt = Zi.current, Ce(Zi);
}
function si(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, I_(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
    var o = n;
    switch (Pd(o), o.tag) {
      case 1:
        o = o.type.childContextTypes, o != null && Tu();
        break;
      case 3:
        ao(), Ce(It), Ce(mt), Od();
        break;
      case 5:
        Id(o);
        break;
      case 4:
        ao();
        break;
      case 13:
        Ce(Ne);
        break;
      case 19:
        Ce(Ne);
        break;
      case 10:
        Ld(o.type._context);
        break;
      case 22:
      case 23:
        Qd();
    }
    n = n.return;
  }
  if ($e = e, Ge = e = Or(e.current, null), nt = Vt = t, Qe = 0, Ll = null, Wd = $u = di = 0, Mt = dl = null, ii !== null) {
    for (t = 0; t < ii.length; t++) if (n = ii[t], o = n.interleaved, o !== null) {
      n.interleaved = null;
      var l = o.next, s = n.pending;
      if (s !== null) {
        var a = s.next;
        s.next = l, o.next = a;
      }
      n.pending = o;
    }
    ii = null;
  }
  return e;
}
function Hv(e, t) {
  do {
    var n = Ge;
    try {
      if (Ad(), lu.current = Iu, zu) {
        for (var o = Me.memoizedState; o !== null; ) {
          var l = o.queue;
          l !== null && (l.pending = null), o = o.next;
        }
        zu = !1;
      }
      if (fi = 0, qe = Ke = Me = null, cl = !1, Cl = 0, Gd.current = null, n === null || n.return === null) {
        Qe = 1, Ll = t, Ge = null;
        break;
      }
      e: {
        var s = e, a = n.return, f = n, p = t;
        if (t = nt, f.flags |= 32768, p !== null && typeof p == "object" && typeof p.then == "function") {
          var m = p, g = f, y = g.tag;
          if (!(g.mode & 1) && (y === 0 || y === 11 || y === 15)) {
            var v = g.alternate;
            v ? (g.updateQueue = v.updateQueue, g.memoizedState = v.memoizedState, g.lanes = v.lanes) : (g.updateQueue = null, g.memoizedState = null);
          }
          var _ = Bm(a);
          if (_ !== null) {
            _.flags &= -257, Gm(_, a, f, s, t), _.mode & 1 && Hm(s, m, t), t = _, p = m;
            var k = t.updateQueue;
            if (k === null) {
              var R = /* @__PURE__ */ new Set();
              R.add(p), t.updateQueue = R;
            } else k.add(p);
            break e;
          } else {
            if (!(t & 1)) {
              Hm(s, m, t), Xd();
              break e;
            }
            p = Error(H(426));
          }
        } else if (Ae && f.mode & 1) {
          var A = Bm(a);
          if (A !== null) {
            !(A.flags & 65536) && (A.flags |= 256), Gm(A, a, f, s, t), Cd(co(p, f));
            break e;
          }
        }
        s = p = co(p, f), Qe !== 4 && (Qe = 2), dl === null ? dl = [s] : dl.push(s), s = a;
        do {
          switch (s.tag) {
            case 3:
              s.flags |= 65536, t &= -t, s.lanes |= t;
              var w = Ev(s, p, t);
              Im(s, w);
              break e;
            case 1:
              f = p;
              var S = s.type, x = s.stateNode;
              if (!(s.flags & 128) && (typeof S.getDerivedStateFromError == "function" || x !== null && typeof x.componentDidCatch == "function" && (zr === null || !zr.has(x)))) {
                s.flags |= 65536, t &= -t, s.lanes |= t;
                var C = kv(s, f, t);
                Im(s, C);
                break e;
              }
          }
          s = s.return;
        } while (s !== null);
      }
      Wv(n);
    } catch (I) {
      t = I, Ge === n && n !== null && (Ge = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function Bv() {
  var e = Ou.current;
  return Ou.current = Iu, e === null ? Iu : e;
}
function Xd() {
  (Qe === 0 || Qe === 3 || Qe === 2) && (Qe = 4), $e === null || !(di & 268435455) && !($u & 268435455) || kr($e, nt);
}
function Fu(e, t) {
  var n = fe;
  fe |= 2;
  var o = Bv();
  ($e !== e || nt !== t) && (Jn = null, si(e, t));
  do
    try {
      ox();
      break;
    } catch (l) {
      Hv(e, l);
    }
  while (!0);
  if (Ad(), fe = n, Ou.current = o, Ge !== null) throw Error(H(261));
  return $e = null, nt = 0, Qe;
}
function ox() {
  for (; Ge !== null; ) Gv(Ge);
}
function lx() {
  for (; Ge !== null && !Nw(); ) Gv(Ge);
}
function Gv(e) {
  var t = Kv(e.alternate, e, Vt);
  e.memoizedProps = e.pendingProps, t === null ? Wv(e) : Ge = t, Gd.current = null;
}
function Wv(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = b_(n, t), n !== null) {
        n.flags &= 32767, Ge = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        Qe = 6, Ge = null;
        return;
      }
    } else if (n = $_(n, t, Vt), n !== null) {
      Ge = n;
      return;
    }
    if (t = t.sibling, t !== null) {
      Ge = t;
      return;
    }
    Ge = t = e;
  } while (t !== null);
  Qe === 0 && (Qe = 5);
}
function ti(e, t, n) {
  var o = ge, l = fn.transition;
  try {
    fn.transition = null, ge = 1, sx(e, t, n, o);
  } finally {
    fn.transition = l, ge = o;
  }
  return null;
}
function sx(e, t, n, o) {
  do
    ro();
  while (Pr !== null);
  if (fe & 6) throw Error(H(327));
  n = e.finishedWork;
  var l = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(H(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var s = n.lanes | n.childLanes;
  if (Bw(e, s), e === $e && (Ge = $e = null, nt = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Ys || (Ys = !0, Qv(Su, function() {
    return ro(), null;
  })), s = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || s) {
    s = fn.transition, fn.transition = null;
    var a = ge;
    ge = 1;
    var f = fe;
    fe |= 4, Gd.current = null, tx(e, n), jv(n, e), C_(Lf), _u = !!Af, Lf = Af = null, e.current = n, nx(n), Mw(), fe = f, ge = a, fn.transition = s;
  } else e.current = n;
  if (Ys && (Ys = !1, Pr = e, ju = l), s = e.pendingLanes, s === 0 && (zr = null), Ow(n.stateNode), Dt(e, Ue()), t !== null) for (o = e.onRecoverableError, n = 0; n < t.length; n++) l = t[n], o(l.value, { componentStack: l.stack, digest: l.digest });
  if (Du) throw Du = !1, e = Jf, Jf = null, e;
  return ju & 1 && e.tag !== 0 && ro(), s = e.pendingLanes, s & 1 ? e === qf ? pl++ : (pl = 0, qf = e) : pl = 0, Br(), null;
}
function ro() {
  if (Pr !== null) {
    var e = Ey(ju), t = fn.transition, n = ge;
    try {
      if (fn.transition = null, ge = 16 > e ? 16 : e, Pr === null) var o = !1;
      else {
        if (e = Pr, Pr = null, ju = 0, fe & 6) throw Error(H(331));
        var l = fe;
        for (fe |= 4, Z = e.current; Z !== null; ) {
          var s = Z, a = s.child;
          if (Z.flags & 16) {
            var f = s.deletions;
            if (f !== null) {
              for (var p = 0; p < f.length; p++) {
                var m = f[p];
                for (Z = m; Z !== null; ) {
                  var g = Z;
                  switch (g.tag) {
                    case 0:
                    case 11:
                    case 15:
                      fl(8, g, s);
                  }
                  var y = g.child;
                  if (y !== null) y.return = g, Z = y;
                  else for (; Z !== null; ) {
                    g = Z;
                    var v = g.sibling, _ = g.return;
                    if (Iv(g), g === m) {
                      Z = null;
                      break;
                    }
                    if (v !== null) {
                      v.return = _, Z = v;
                      break;
                    }
                    Z = _;
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
              Z = s;
            }
          }
          if (s.subtreeFlags & 2064 && a !== null) a.return = s, Z = a;
          else e: for (; Z !== null; ) {
            if (s = Z, s.flags & 2048) switch (s.tag) {
              case 0:
              case 11:
              case 15:
                fl(9, s, s.return);
            }
            var w = s.sibling;
            if (w !== null) {
              w.return = s.return, Z = w;
              break e;
            }
            Z = s.return;
          }
        }
        var S = e.current;
        for (Z = S; Z !== null; ) {
          a = Z;
          var x = a.child;
          if (a.subtreeFlags & 2064 && x !== null) x.return = a, Z = x;
          else e: for (a = S; Z !== null; ) {
            if (f = Z, f.flags & 2048) try {
              switch (f.tag) {
                case 0:
                case 11:
                case 15:
                  qu(9, f);
              }
            } catch (I) {
              De(f, f.return, I);
            }
            if (f === a) {
              Z = null;
              break e;
            }
            var C = f.sibling;
            if (C !== null) {
              C.return = f.return, Z = C;
              break e;
            }
            Z = f.return;
          }
        }
        if (fe = l, Br(), Hn && typeof Hn.onPostCommitFiberRoot == "function") try {
          Hn.onPostCommitFiberRoot(Wu, e);
        } catch {
        }
        o = !0;
      }
      return o;
    } finally {
      ge = n, fn.transition = t;
    }
  }
  return !1;
}
function tg(e, t, n) {
  t = co(n, t), t = Ev(e, t, 1), e = Mr(e, t, 1), t = St(), e !== null && (Ml(e, 1, t), Dt(e, t));
}
function De(e, t, n) {
  if (e.tag === 3) tg(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      tg(t, e, n);
      break;
    } else if (t.tag === 1) {
      var o = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof o.componentDidCatch == "function" && (zr === null || !zr.has(o))) {
        e = co(n, e), e = kv(t, e, 1), t = Mr(t, e, 1), e = St(), t !== null && (Ml(t, 1, e), Dt(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function ux(e, t, n) {
  var o = e.pingCache;
  o !== null && o.delete(t), t = St(), e.pingedLanes |= e.suspendedLanes & n, $e === e && (nt & n) === n && (Qe === 4 || Qe === 3 && (nt & 130023424) === nt && 500 > Ue() - Vd ? si(e, 0) : Wd |= n), Dt(e, t);
}
function Vv(e, t) {
  t === 0 && (e.mode & 1 ? (t = Fs, Fs <<= 1, !(Fs & 130023424) && (Fs = 4194304)) : t = 1);
  var n = St();
  e = ir(e, t), e !== null && (Ml(e, t, n), Dt(e, n));
}
function ax(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), Vv(e, n);
}
function cx(e, t) {
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
      throw Error(H(314));
  }
  o !== null && o.delete(t), Vv(e, n);
}
var Kv;
Kv = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || It.current) zt = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return zt = !1, q_(e, t, n);
    zt = !!(e.flags & 131072);
  }
  else zt = !1, Ae && t.flags & 1048576 && Zy(t, Ru, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var o = t.type;
      uu(e, t), e = t.pendingProps;
      var l = lo(t, mt.current);
      no(t, n), l = jd(null, t, o, e, l, n);
      var s = Fd();
      return t.flags |= 1, typeof l == "object" && l !== null && typeof l.render == "function" && l.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ot(o) ? (s = !0, Pu(t)) : s = !1, t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null, Md(t), l.updater = Ju, t.stateNode = l, l._reactInternals = t, Uf(t, o, e, n), t = Gf(null, t, o, !0, s, n)) : (t.tag = 0, Ae && s && Td(t), vt(null, t, l, n), t = t.child), t;
    case 16:
      o = t.elementType;
      e: {
        switch (uu(e, t), e = t.pendingProps, l = o._init, o = l(o._payload), t.type = o, l = t.tag = dx(o), e = xn(o, e), l) {
          case 0:
            t = Bf(null, t, o, e, n);
            break e;
          case 1:
            t = Km(null, t, o, e, n);
            break e;
          case 11:
            t = Wm(null, t, o, e, n);
            break e;
          case 14:
            t = Vm(null, t, o, xn(o.type, e), n);
            break e;
        }
        throw Error(H(
          306,
          o,
          ""
        ));
      }
      return t;
    case 0:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : xn(o, l), Bf(e, t, o, l, n);
    case 1:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : xn(o, l), Km(e, t, o, l, n);
    case 3:
      e: {
        if (Rv(t), e === null) throw Error(H(387));
        o = t.pendingProps, s = t.memoizedState, l = s.element, tv(e, t), Nu(t, o, null, n);
        var a = t.memoizedState;
        if (o = a.element, s.isDehydrated) if (s = { element: o, isDehydrated: !1, cache: a.cache, pendingSuspenseBoundaries: a.pendingSuspenseBoundaries, transitions: a.transitions }, t.updateQueue.baseState = s, t.memoizedState = s, t.flags & 256) {
          l = co(Error(H(423)), t), t = Qm(e, t, o, n, l);
          break e;
        } else if (o !== l) {
          l = co(Error(H(424)), t), t = Qm(e, t, o, n, l);
          break e;
        } else for (Kt = Nr(t.stateNode.containerInfo.firstChild), Qt = t, Ae = !0, kn = null, n = by(t, null, o, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (so(), o === l) {
            t = or(e, t, n);
            break e;
          }
          vt(e, t, o, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return nv(t), e === null && Df(t), o = t.type, l = t.pendingProps, s = e !== null ? e.memoizedProps : null, a = l.children, Nf(o, l) ? a = null : s !== null && Nf(o, s) && (t.flags |= 32), Cv(e, t), vt(e, t, a, n), t.child;
    case 6:
      return e === null && Df(t), null;
    case 13:
      return Av(e, t, n);
    case 4:
      return zd(t, t.stateNode.containerInfo), o = t.pendingProps, e === null ? t.child = uo(t, null, o, n) : vt(e, t, o, n), t.child;
    case 11:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : xn(o, l), Wm(e, t, o, l, n);
    case 7:
      return vt(e, t, t.pendingProps, n), t.child;
    case 8:
      return vt(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return vt(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (o = t.type._context, l = t.pendingProps, s = t.memoizedProps, a = l.value, ke(Au, o._currentValue), o._currentValue = a, s !== null) if (Cn(s.value, a)) {
          if (s.children === l.children && !It.current) {
            t = or(e, t, n);
            break e;
          }
        } else for (s = t.child, s !== null && (s.return = t); s !== null; ) {
          var f = s.dependencies;
          if (f !== null) {
            a = s.child;
            for (var p = f.firstContext; p !== null; ) {
              if (p.context === o) {
                if (s.tag === 1) {
                  p = tr(-1, n & -n), p.tag = 2;
                  var m = s.updateQueue;
                  if (m !== null) {
                    m = m.shared;
                    var g = m.pending;
                    g === null ? p.next = p : (p.next = g.next, g.next = p), m.pending = p;
                  }
                }
                s.lanes |= n, p = s.alternate, p !== null && (p.lanes |= n), jf(
                  s.return,
                  n,
                  t
                ), f.lanes |= n;
                break;
              }
              p = p.next;
            }
          } else if (s.tag === 10) a = s.type === t.type ? null : s.child;
          else if (s.tag === 18) {
            if (a = s.return, a === null) throw Error(H(341));
            a.lanes |= n, f = a.alternate, f !== null && (f.lanes |= n), jf(a, n, t), a = s.sibling;
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
        vt(e, t, l.children, n), t = t.child;
      }
      return t;
    case 9:
      return l = t.type, o = t.pendingProps.children, no(t, n), l = dn(l), o = o(l), t.flags |= 1, vt(e, t, o, n), t.child;
    case 14:
      return o = t.type, l = xn(o, t.pendingProps), l = xn(o.type, l), Vm(e, t, o, l, n);
    case 15:
      return Tv(e, t, t.type, t.pendingProps, n);
    case 17:
      return o = t.type, l = t.pendingProps, l = t.elementType === o ? l : xn(o, l), uu(e, t), t.tag = 1, Ot(o) ? (e = !0, Pu(t)) : e = !1, no(t, n), xv(t, o, l), Uf(t, o, l, n), Gf(null, t, o, !0, e, n);
    case 19:
      return Lv(e, t, n);
    case 22:
      return Pv(e, t, n);
  }
  throw Error(H(156, t.tag));
};
function Qv(e, t) {
  return Sy(e, t);
}
function fx(e, t, n, o) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = o, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function cn(e, t, n, o) {
  return new fx(e, t, n, o);
}
function Yd(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function dx(e) {
  if (typeof e == "function") return Yd(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === pd) return 11;
    if (e === hd) return 14;
  }
  return 2;
}
function Or(e, t) {
  var n = e.alternate;
  return n === null ? (n = cn(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function fu(e, t, n, o, l, s) {
  var a = 2;
  if (o = e, typeof e == "function") Yd(e) && (a = 1);
  else if (typeof e == "string") a = 5;
  else e: switch (e) {
    case Ui:
      return ui(n.children, l, s, t);
    case dd:
      a = 8, l |= 8;
      break;
    case af:
      return e = cn(12, n, t, l | 2), e.elementType = af, e.lanes = s, e;
    case cf:
      return e = cn(13, n, t, l), e.elementType = cf, e.lanes = s, e;
    case ff:
      return e = cn(19, n, t, l), e.elementType = ff, e.lanes = s, e;
    case ny:
      return bu(n, l, s, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case ey:
          a = 10;
          break e;
        case ty:
          a = 9;
          break e;
        case pd:
          a = 11;
          break e;
        case hd:
          a = 14;
          break e;
        case _r:
          a = 16, o = null;
          break e;
      }
      throw Error(H(130, e == null ? e : typeof e, ""));
  }
  return t = cn(a, n, t, l), t.elementType = e, t.type = o, t.lanes = s, t;
}
function ui(e, t, n, o) {
  return e = cn(7, e, o, t), e.lanes = n, e;
}
function bu(e, t, n, o) {
  return e = cn(22, e, o, t), e.elementType = ny, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function Hc(e, t, n) {
  return e = cn(6, e, null, t), e.lanes = n, e;
}
function Bc(e, t, n) {
  return t = cn(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function px(e, t, n, o, l) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = _c(0), this.expirationTimes = _c(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = _c(0), this.identifierPrefix = o, this.onRecoverableError = l, this.mutableSourceEagerHydrationData = null;
}
function Zd(e, t, n, o, l, s, a, f, p) {
  return e = new px(e, t, n, f, p), t === 1 ? (t = 1, s === !0 && (t |= 8)) : t = 0, s = cn(3, null, null, t), e.current = s, s.stateNode = e, s.memoizedState = { element: o, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, Md(s), e;
}
function hx(e, t, n) {
  var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Fi, key: o == null ? null : "" + o, children: e, containerInfo: t, implementation: n };
}
function Xv(e) {
  if (!e) return Fr;
  e = e._reactInternals;
  e: {
    if (mi(e) !== e || e.tag !== 1) throw Error(H(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Ot(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(H(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (Ot(n)) return Xy(e, n, t);
  }
  return t;
}
function Yv(e, t, n, o, l, s, a, f, p) {
  return e = Zd(n, o, !0, e, l, s, a, f, p), e.context = Xv(null), n = e.current, o = St(), l = Ir(n), s = tr(o, l), s.callback = t ?? null, Mr(n, s, l), e.current.lanes = l, Ml(e, l, o), Dt(e, o), e;
}
function ea(e, t, n, o) {
  var l = t.current, s = St(), a = Ir(l);
  return n = Xv(n), t.context === null ? t.context = n : t.pendingContext = n, t = tr(s, a), t.payload = { element: e }, o = o === void 0 ? null : o, o !== null && (t.callback = o), e = Mr(l, t, a), e !== null && (Pn(e, l, a, s), ou(e, l, a)), a;
}
function Uu(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function ng(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Jd(e, t) {
  ng(e, t), (e = e.alternate) && ng(e, t);
}
function mx() {
  return null;
}
var Zv = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function qd(e) {
  this._internalRoot = e;
}
ta.prototype.render = qd.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(H(409));
  ea(e, t, null, null);
};
ta.prototype.unmount = qd.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    pi(function() {
      ea(null, e, null, null);
    }), t[rr] = null;
  }
};
function ta(e) {
  this._internalRoot = e;
}
ta.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = Py();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < Er.length && t !== 0 && t < Er[n].priority; n++) ;
    Er.splice(n, 0, e), n === 0 && Ry(e);
  }
};
function $d(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function na(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function rg() {
}
function gx(e, t, n, o, l) {
  if (l) {
    if (typeof o == "function") {
      var s = o;
      o = function() {
        var m = Uu(a);
        s.call(m);
      };
    }
    var a = Yv(t, o, e, 0, null, !1, !1, "", rg);
    return e._reactRootContainer = a, e[rr] = a.current, xl(e.nodeType === 8 ? e.parentNode : e), pi(), a;
  }
  for (; l = e.lastChild; ) e.removeChild(l);
  if (typeof o == "function") {
    var f = o;
    o = function() {
      var m = Uu(p);
      f.call(m);
    };
  }
  var p = Zd(e, 0, !1, null, null, !1, !1, "", rg);
  return e._reactRootContainer = p, e[rr] = p.current, xl(e.nodeType === 8 ? e.parentNode : e), pi(function() {
    ea(t, p, n, o);
  }), p;
}
function ra(e, t, n, o, l) {
  var s = n._reactRootContainer;
  if (s) {
    var a = s;
    if (typeof l == "function") {
      var f = l;
      l = function() {
        var p = Uu(a);
        f.call(p);
      };
    }
    ea(t, a, e, l);
  } else a = gx(n, t, e, l, o);
  return Uu(a);
}
ky = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = tl(t.pendingLanes);
        n !== 0 && (yd(t, n | 1), Dt(t, Ue()), !(fe & 6) && (fo = Ue() + 500, Br()));
      }
      break;
    case 13:
      pi(function() {
        var o = ir(e, 1);
        if (o !== null) {
          var l = St();
          Pn(o, e, 1, l);
        }
      }), Jd(e, 1);
  }
};
vd = function(e) {
  if (e.tag === 13) {
    var t = ir(e, 134217728);
    if (t !== null) {
      var n = St();
      Pn(t, e, 134217728, n);
    }
    Jd(e, 134217728);
  }
};
Ty = function(e) {
  if (e.tag === 13) {
    var t = Ir(e), n = ir(e, t);
    if (n !== null) {
      var o = St();
      Pn(n, e, t, o);
    }
    Jd(e, t);
  }
};
Py = function() {
  return ge;
};
Cy = function(e, t) {
  var n = ge;
  try {
    return ge = e, t();
  } finally {
    ge = n;
  }
};
_f = function(e, t, n) {
  switch (t) {
    case "input":
      if (hf(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var o = n[t];
          if (o !== e && o.form === e.form) {
            var l = Xu(o);
            if (!l) throw Error(H(90));
            iy(o), hf(o, l);
          }
        }
      }
      break;
    case "textarea":
      ly(e, n);
      break;
    case "select":
      t = n.value, t != null && $i(e, !!n.multiple, t, !1);
  }
};
py = Kd;
hy = pi;
var yx = { usingClientEntryPoint: !1, Events: [Il, Wi, Xu, fy, dy, Kd] }, Yo = { findFiberByHostInstance: ri, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, vx = { bundleType: Yo.bundleType, version: Yo.version, rendererPackageName: Yo.rendererPackageName, rendererConfig: Yo.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: lr.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = yy(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: Yo.findFiberByHostInstance || mx, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Zs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Zs.isDisabled && Zs.supportsFiber) try {
    Wu = Zs.inject(vx), Hn = Zs;
  } catch {
  }
}
Yt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = yx;
Yt.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!$d(t)) throw Error(H(200));
  return hx(e, t, null, n);
};
Yt.createRoot = function(e, t) {
  if (!$d(e)) throw Error(H(299));
  var n = !1, o = "", l = Zv;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (o = t.identifierPrefix), t.onRecoverableError !== void 0 && (l = t.onRecoverableError)), t = Zd(e, 1, !1, null, null, n, !1, o, l), e[rr] = t.current, xl(e.nodeType === 8 ? e.parentNode : e), new qd(t);
};
Yt.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(H(188)) : (e = Object.keys(e).join(","), Error(H(268, e)));
  return e = yy(t), e = e === null ? null : e.stateNode, e;
};
Yt.flushSync = function(e) {
  return pi(e);
};
Yt.hydrate = function(e, t, n) {
  if (!na(t)) throw Error(H(200));
  return ra(null, e, t, !0, n);
};
Yt.hydrateRoot = function(e, t, n) {
  if (!$d(e)) throw Error(H(405));
  var o = n != null && n.hydratedSources || null, l = !1, s = "", a = Zv;
  if (n != null && (n.unstable_strictMode === !0 && (l = !0), n.identifierPrefix !== void 0 && (s = n.identifierPrefix), n.onRecoverableError !== void 0 && (a = n.onRecoverableError)), t = Yv(t, null, e, 1, n ?? null, l, !1, s, a), e[rr] = t.current, xl(e), o) for (e = 0; e < o.length; e++) n = o[e], l = n._getVersion, l = l(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, l] : t.mutableSourceEagerHydrationData.push(
    n,
    l
  );
  return new ta(t);
};
Yt.render = function(e, t, n) {
  if (!na(t)) throw Error(H(200));
  return ra(null, e, t, !1, n);
};
Yt.unmountComponentAtNode = function(e) {
  if (!na(e)) throw Error(H(40));
  return e._reactRootContainer ? (pi(function() {
    ra(null, null, e, !1, function() {
      e._reactRootContainer = null, e[rr] = null;
    });
  }), !0) : !1;
};
Yt.unstable_batchedUpdates = Kd;
Yt.unstable_renderSubtreeIntoContainer = function(e, t, n, o) {
  if (!na(n)) throw Error(H(200));
  if (e == null || e._reactInternals === void 0) throw Error(H(38));
  return ra(e, t, n, !1, o);
};
Yt.version = "18.3.1-next-f1338f8080-20240426";
function Jv() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Jv);
    } catch (e) {
      console.error(e);
    }
}
Jv(), Jg.exports = Yt;
var Sx = Jg.exports, qv, ig = Sx;
qv = ig.createRoot, ig.hydrateRoot;
var $v = { exports: {} }, gi = {};
/**
 * @license React
 * react-reconciler-constants.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
gi.ConcurrentRoot = 1;
gi.ContinuousEventPriority = 4;
gi.DefaultEventPriority = 16;
gi.DiscreteEventPriority = 1;
gi.IdleEventPriority = 536870912;
gi.LegacyRoot = 0;
$v.exports = gi;
var Ji = $v.exports;
function wx(e) {
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
const _x = typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), og = _x ? Q.useEffect : Q.useLayoutEffect;
function xx(e) {
  const t = typeof e == "function" ? wx(e) : e, n = (o = t.getState, l = Object.is) => {
    const [, s] = Q.useReducer((A) => A + 1, 0), a = t.getState(), f = Q.useRef(a), p = Q.useRef(o), m = Q.useRef(l), g = Q.useRef(!1), y = Q.useRef();
    y.current === void 0 && (y.current = o(a));
    let v, _ = !1;
    (f.current !== a || p.current !== o || m.current !== l || g.current) && (v = o(a), _ = !l(y.current, v)), og(() => {
      _ && (y.current = v), f.current = a, p.current = o, m.current = l, g.current = !1;
    });
    const k = Q.useRef(a);
    og(() => {
      const A = () => {
        try {
          const S = t.getState(), x = p.current(S);
          m.current(y.current, x) || (f.current = S, y.current = x, s());
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
const Ex = (e) => typeof e == "object" && typeof e.then == "function", li = [];
function bv(e, t, n = (o, l) => o === l) {
  if (e === t) return !0;
  if (!e || !t) return !1;
  const o = e.length;
  if (t.length !== o) return !1;
  for (let l = 0; l < o; l++) if (!n(e[l], t[l])) return !1;
  return !0;
}
function e0(e, t = null, n = !1, o = {}) {
  t === null && (t = [e]);
  for (const s of li)
    if (bv(t, s.keys, s.equal)) {
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
      const s = li.indexOf(l);
      s !== -1 && li.splice(s, 1);
    },
    promise: (
      // Execute the promise
      (Ex(e) ? e : e(...t)).then((s) => {
        l.response = s, o.lifespan && o.lifespan > 0 && (l.timeout = setTimeout(l.remove, o.lifespan));
      }).catch((s) => l.error = s)
    )
  };
  if (li.push(l), !n) throw l.promise;
}
const kx = (e, t, n) => e0(e, t, !1, n), Tx = (e, t, n) => void e0(e, t, !0, n), Px = (e) => {
  if (e === void 0 || e.length === 0) li.splice(0, li.length);
  else {
    const t = li.find((n) => bv(e, n.keys, n.equal));
    t && t.remove();
  }
};
var t0 = { exports: {} }, n0 = { exports: {} }, r0 = {};
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
  function t(N, U) {
    var F = N.length;
    N.push(U);
    e: for (; 0 < F; ) {
      var Y = F - 1 >>> 1, te = N[Y];
      if (0 < l(te, U)) N[Y] = U, N[F] = te, F = Y;
      else break e;
    }
  }
  function n(N) {
    return N.length === 0 ? null : N[0];
  }
  function o(N) {
    if (N.length === 0) return null;
    var U = N[0], F = N.pop();
    if (F !== U) {
      N[0] = F;
      e: for (var Y = 0, te = N.length, ae = te >>> 1; Y < ae; ) {
        var Ie = 2 * (Y + 1) - 1, it = N[Ie], Xe = Ie + 1, Jt = N[Xe];
        if (0 > l(it, F)) Xe < te && 0 > l(Jt, it) ? (N[Y] = Jt, N[Xe] = F, Y = Xe) : (N[Y] = it, N[Ie] = F, Y = Ie);
        else if (Xe < te && 0 > l(Jt, F)) N[Y] = Jt, N[Xe] = F, Y = Xe;
        else break e;
      }
    }
    return U;
  }
  function l(N, U) {
    var F = N.sortIndex - U.sortIndex;
    return F !== 0 ? F : N.id - U.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var s = performance;
    e.unstable_now = function() {
      return s.now();
    };
  } else {
    var a = Date, f = a.now();
    e.unstable_now = function() {
      return a.now() - f;
    };
  }
  var p = [], m = [], g = 1, y = null, v = 3, _ = !1, k = !1, R = !1, A = typeof setTimeout == "function" ? setTimeout : null, w = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function x(N) {
    for (var U = n(m); U !== null; ) {
      if (U.callback === null) o(m);
      else if (U.startTime <= N) o(m), U.sortIndex = U.expirationTime, t(p, U);
      else break;
      U = n(m);
    }
  }
  function C(N) {
    if (R = !1, x(N), !k) if (n(p) !== null) k = !0, be(I);
    else {
      var U = n(m);
      U !== null && Et(C, U.startTime - N);
    }
  }
  function I(N, U) {
    k = !1, R && (R = !1, w(B), B = -1), _ = !0;
    var F = v;
    try {
      for (x(U), y = n(p); y !== null && (!(y.expirationTime > U) || N && !K()); ) {
        var Y = y.callback;
        if (typeof Y == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = Y(y.expirationTime <= U);
          U = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && o(p), x(U);
        } else o(p);
        y = n(p);
      }
      if (y !== null) var ae = !0;
      else {
        var Ie = n(m);
        Ie !== null && Et(C, Ie.startTime - U), ae = !1;
      }
      return ae;
    } finally {
      y = null, v = F, _ = !1;
    }
  }
  var D = !1, j = null, B = -1, q = 5, W = -1;
  function K() {
    return !(e.unstable_now() - W < q);
  }
  function le() {
    if (j !== null) {
      var N = e.unstable_now();
      W = N;
      var U = !0;
      try {
        U = j(!0, N);
      } finally {
        U ? Se() : (D = !1, j = null);
      }
    } else D = !1;
  }
  var Se;
  if (typeof S == "function") Se = function() {
    S(le);
  };
  else if (typeof MessageChannel < "u") {
    var xt = new MessageChannel(), jt = xt.port2;
    xt.port1.onmessage = le, Se = function() {
      jt.postMessage(null);
    };
  } else Se = function() {
    A(le, 0);
  };
  function be(N) {
    j = N, D || (D = !0, Se());
  }
  function Et(N, U) {
    B = A(function() {
      N(e.unstable_now());
    }, U);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    k || _ || (k = !0, be(I));
  }, e.unstable_forceFrameRate = function(N) {
    0 > N || 125 < N ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : q = 0 < N ? Math.floor(1e3 / N) : 5;
  }, e.unstable_getCurrentPriorityLevel = function() {
    return v;
  }, e.unstable_getFirstCallbackNode = function() {
    return n(p);
  }, e.unstable_next = function(N) {
    switch (v) {
      case 1:
      case 2:
      case 3:
        var U = 3;
        break;
      default:
        U = v;
    }
    var F = v;
    v = U;
    try {
      return N();
    } finally {
      v = F;
    }
  }, e.unstable_pauseExecution = function() {
  }, e.unstable_requestPaint = function() {
  }, e.unstable_runWithPriority = function(N, U) {
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
    var F = v;
    v = N;
    try {
      return U();
    } finally {
      v = F;
    }
  }, e.unstable_scheduleCallback = function(N, U, F) {
    var Y = e.unstable_now();
    switch (typeof F == "object" && F !== null ? (F = F.delay, F = typeof F == "number" && 0 < F ? Y + F : Y) : F = Y, N) {
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
    return te = F + te, N = { id: g++, callback: U, priorityLevel: N, startTime: F, expirationTime: te, sortIndex: -1 }, F > Y ? (N.sortIndex = F, t(m, N), n(p) === null && N === n(m) && (R ? (w(B), B = -1) : R = !0, Et(C, F - Y))) : (N.sortIndex = te, t(p, N), k || _ || (k = !0, be(I))), N;
  }, e.unstable_shouldYield = K, e.unstable_wrapCallback = function(N) {
    var U = v;
    return function() {
      var F = v;
      v = U;
      try {
        return N.apply(this, arguments);
      } finally {
        v = F;
      }
    };
  };
})(r0);
n0.exports = r0;
var ed = n0.exports;
/**
 * @license React
 * react-reconciler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Cx = function(t) {
  var n = {}, o = Q, l = ed, s = Object.assign;
  function a(r) {
    for (var i = "https://reactjs.org/docs/error-decoder.html?invariant=" + r, u = 1; u < arguments.length; u++) i += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + r + "; visit " + i + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var f = o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, p = Symbol.for("react.element"), m = Symbol.for("react.portal"), g = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), v = Symbol.for("react.profiler"), _ = Symbol.for("react.provider"), k = Symbol.for("react.context"), R = Symbol.for("react.forward_ref"), A = Symbol.for("react.suspense"), w = Symbol.for("react.suspense_list"), S = Symbol.for("react.memo"), x = Symbol.for("react.lazy"), C = Symbol.for("react.offscreen"), I = Symbol.iterator;
  function D(r) {
    return r === null || typeof r != "object" ? null : (r = I && r[I] || r["@@iterator"], typeof r == "function" ? r : null);
  }
  function j(r) {
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
        return i = r.displayName || null, i !== null ? i : j(r.type) || "Memo";
      case x:
        i = r._payload, r = r._init;
        try {
          return j(r(i));
        } catch {
        }
    }
    return null;
  }
  function B(r) {
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
        return j(i);
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
  function q(r) {
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
    if (q(r) !== r) throw Error(a(188));
  }
  function K(r) {
    var i = r.alternate;
    if (!i) {
      if (i = q(r), i === null) throw Error(a(188));
      return i !== r ? null : r;
    }
    for (var u = r, c = i; ; ) {
      var d = u.return;
      if (d === null) break;
      var h = d.alternate;
      if (h === null) {
        if (c = d.return, c !== null) {
          u = c;
          continue;
        }
        break;
      }
      if (d.child === h.child) {
        for (h = d.child; h; ) {
          if (h === u) return W(d), r;
          if (h === c) return W(d), i;
          h = h.sibling;
        }
        throw Error(a(188));
      }
      if (u.return !== c.return) u = d, c = h;
      else {
        for (var E = !1, T = d.child; T; ) {
          if (T === u) {
            E = !0, u = d, c = h;
            break;
          }
          if (T === c) {
            E = !0, c = d, u = h;
            break;
          }
          T = T.sibling;
        }
        if (!E) {
          for (T = h.child; T; ) {
            if (T === u) {
              E = !0, u = h, c = d;
              break;
            }
            if (T === c) {
              E = !0, c = h, u = d;
              break;
            }
            T = T.sibling;
          }
          if (!E) throw Error(a(189));
        }
      }
      if (u.alternate !== c) throw Error(a(190));
    }
    if (u.tag !== 3) throw Error(a(188));
    return u.stateNode.current === u ? r : i;
  }
  function le(r) {
    return r = K(r), r !== null ? Se(r) : null;
  }
  function Se(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      var i = Se(r);
      if (i !== null) return i;
      r = r.sibling;
    }
    return null;
  }
  function xt(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      if (r.tag !== 4) {
        var i = xt(r);
        if (i !== null) return i;
      }
      r = r.sibling;
    }
    return null;
  }
  var jt = Array.isArray, be = t.getPublicInstance, Et = t.getRootHostContext, N = t.getChildHostContext, U = t.prepareForCommit, F = t.resetAfterCommit, Y = t.createInstance, te = t.appendInitialChild, ae = t.finalizeInitialChildren, Ie = t.prepareUpdate, it = t.shouldSetTextContent, Xe = t.createTextInstance, Jt = t.scheduleTimeout, T0 = t.cancelTimeout, ia = t.noTimeout, jl = t.isPrimaryRenderer, hn = t.supportsMutation, Fl = t.supportsPersistence, Ft = t.supportsHydration, P0 = t.getInstanceFromNode, C0 = t.preparePortalMount, R0 = t.getCurrentEventPriority, A0 = t.detachDeletedInstance, L0 = t.supportsMicrotasks, N0 = t.scheduleMicrotask, vo = t.supportsTestSelectors, M0 = t.findFiberRoot, z0 = t.getBoundingRect, I0 = t.getTextContent, So = t.isHiddenSubtree, O0 = t.matchAccessibilityRole, D0 = t.setFocusIfFocusable, j0 = t.setupIntersectionObserver, F0 = t.appendChild, U0 = t.appendChildToContainer, H0 = t.commitTextUpdate, B0 = t.commitMount, G0 = t.commitUpdate, W0 = t.insertBefore, V0 = t.insertInContainerBefore, K0 = t.removeChild, Q0 = t.removeChildFromContainer, rp = t.resetTextContent, X0 = t.hideInstance, Y0 = t.hideTextInstance, Z0 = t.unhideInstance, J0 = t.unhideTextInstance, q0 = t.clearContainer, $0 = t.cloneInstance, ip = t.createContainerChildSet, op = t.appendChildToContainerChildSet, b0 = t.finalizeContainerChildren, lp = t.replaceContainerChildren, sp = t.cloneHiddenInstance, up = t.cloneHiddenTextInstance, e1 = t.canHydrateInstance, t1 = t.canHydrateTextInstance, n1 = t.canHydrateSuspenseInstance, ap = t.isSuspenseInstancePending, oa = t.isSuspenseInstanceFallback, r1 = t.registerSuspenseInstanceRetry, wo = t.getNextHydratableSibling, i1 = t.getFirstHydratableChild, o1 = t.getFirstHydratableChildWithinContainer, l1 = t.getFirstHydratableChildWithinSuspenseInstance, s1 = t.hydrateInstance, u1 = t.hydrateTextInstance, a1 = t.hydrateSuspenseInstance, c1 = t.getNextHydratableInstanceAfterSuspenseInstance, cp = t.commitHydratedContainer, f1 = t.commitHydratedSuspenseInstance, d1 = t.clearSuspenseBoundary, p1 = t.clearSuspenseBoundaryFromContainer, h1 = t.shouldDeleteUnhydratedTailInstances, m1 = t.didNotMatchHydratedContainerTextInstance, g1 = t.didNotMatchHydratedTextInstance, la;
  function _o(r) {
    if (la === void 0) try {
      throw Error();
    } catch (u) {
      var i = u.stack.trim().match(/\n( *(at )?)/);
      la = i && i[1] || "";
    }
    return `
` + la + r;
  }
  var sa = !1;
  function ua(r, i) {
    if (!r || sa) return "";
    sa = !0;
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
        } catch (G) {
          var c = G;
        }
        Reflect.construct(r, [], i);
      } else {
        try {
          i.call();
        } catch (G) {
          c = G;
        }
        r.call(i.prototype);
      }
      else {
        try {
          throw Error();
        } catch (G) {
          c = G;
        }
        r();
      }
    } catch (G) {
      if (G && c && typeof G.stack == "string") {
        for (var d = G.stack.split(`
`), h = c.stack.split(`
`), E = d.length - 1, T = h.length - 1; 1 <= E && 0 <= T && d[E] !== h[T]; ) T--;
        for (; 1 <= E && 0 <= T; E--, T--) if (d[E] !== h[T]) {
          if (E !== 1 || T !== 1)
            do
              if (E--, T--, 0 > T || d[E] !== h[T]) {
                var z = `
` + d[E].replace(" at new ", " at ");
                return r.displayName && z.includes("<anonymous>") && (z = z.replace("<anonymous>", r.displayName)), z;
              }
            while (1 <= E && 0 <= T);
          break;
        }
      }
    } finally {
      sa = !1, Error.prepareStackTrace = u;
    }
    return (r = r ? r.displayName || r.name : "") ? _o(r) : "";
  }
  var y1 = Object.prototype.hasOwnProperty, aa = [], yi = -1;
  function sr(r) {
    return { current: r };
  }
  function Te(r) {
    0 > yi || (r.current = aa[yi], aa[yi] = null, yi--);
  }
  function we(r, i) {
    yi++, aa[yi] = r.current, r.current = i;
  }
  var ur = {}, ot = sr(ur), kt = sr(!1), Gr = ur;
  function vi(r, i) {
    var u = r.type.contextTypes;
    if (!u) return ur;
    var c = r.stateNode;
    if (c && c.__reactInternalMemoizedUnmaskedChildContext === i) return c.__reactInternalMemoizedMaskedChildContext;
    var d = {}, h;
    for (h in u) d[h] = i[h];
    return c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = i, r.__reactInternalMemoizedMaskedChildContext = d), d;
  }
  function Tt(r) {
    return r = r.childContextTypes, r != null;
  }
  function Ul() {
    Te(kt), Te(ot);
  }
  function fp(r, i, u) {
    if (ot.current !== ur) throw Error(a(168));
    we(ot, i), we(kt, u);
  }
  function dp(r, i, u) {
    var c = r.stateNode;
    if (i = i.childContextTypes, typeof c.getChildContext != "function") return u;
    c = c.getChildContext();
    for (var d in c) if (!(d in i)) throw Error(a(108, B(r) || "Unknown", d));
    return s({}, u, c);
  }
  function Hl(r) {
    return r = (r = r.stateNode) && r.__reactInternalMemoizedMergedChildContext || ur, Gr = ot.current, we(ot, r), we(kt, kt.current), !0;
  }
  function pp(r, i, u) {
    var c = r.stateNode;
    if (!c) throw Error(a(169));
    u ? (r = dp(r, i, Gr), c.__reactInternalMemoizedMergedChildContext = r, Te(kt), Te(ot), we(ot, r)) : Te(kt), we(kt, u);
  }
  var mn = Math.clz32 ? Math.clz32 : w1, v1 = Math.log, S1 = Math.LN2;
  function w1(r) {
    return r >>>= 0, r === 0 ? 32 : 31 - (v1(r) / S1 | 0) | 0;
  }
  var Bl = 64, Gl = 4194304;
  function xo(r) {
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
  function Wl(r, i) {
    var u = r.pendingLanes;
    if (u === 0) return 0;
    var c = 0, d = r.suspendedLanes, h = r.pingedLanes, E = u & 268435455;
    if (E !== 0) {
      var T = E & ~d;
      T !== 0 ? c = xo(T) : (h &= E, h !== 0 && (c = xo(h)));
    } else E = u & ~d, E !== 0 ? c = xo(E) : h !== 0 && (c = xo(h));
    if (c === 0) return 0;
    if (i !== 0 && i !== c && !(i & d) && (d = c & -c, h = i & -i, d >= h || d === 16 && (h & 4194240) !== 0)) return i;
    if (c & 4 && (c |= u & 16), i = r.entangledLanes, i !== 0) for (r = r.entanglements, i &= c; 0 < i; ) u = 31 - mn(i), d = 1 << u, c |= r[u], i &= ~d;
    return c;
  }
  function _1(r, i) {
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
  function x1(r, i) {
    for (var u = r.suspendedLanes, c = r.pingedLanes, d = r.expirationTimes, h = r.pendingLanes; 0 < h; ) {
      var E = 31 - mn(h), T = 1 << E, z = d[E];
      z === -1 ? (!(T & u) || T & c) && (d[E] = _1(T, i)) : z <= i && (r.expiredLanes |= T), h &= ~T;
    }
  }
  function ca(r) {
    return r = r.pendingLanes & -1073741825, r !== 0 ? r : r & 1073741824 ? 1073741824 : 0;
  }
  function fa(r) {
    for (var i = [], u = 0; 31 > u; u++) i.push(r);
    return i;
  }
  function Eo(r, i, u) {
    r.pendingLanes |= i, i !== 536870912 && (r.suspendedLanes = 0, r.pingedLanes = 0), r = r.eventTimes, i = 31 - mn(i), r[i] = u;
  }
  function E1(r, i) {
    var u = r.pendingLanes & ~i;
    r.pendingLanes = i, r.suspendedLanes = 0, r.pingedLanes = 0, r.expiredLanes &= i, r.mutableReadLanes &= i, r.entangledLanes &= i, i = r.entanglements;
    var c = r.eventTimes;
    for (r = r.expirationTimes; 0 < u; ) {
      var d = 31 - mn(u), h = 1 << d;
      i[d] = 0, c[d] = -1, r[d] = -1, u &= ~h;
    }
  }
  function da(r, i) {
    var u = r.entangledLanes |= i;
    for (r = r.entanglements; u; ) {
      var c = 31 - mn(u), d = 1 << c;
      d & i | r[c] & i && (r[c] |= i), u &= ~d;
    }
  }
  var de = 0;
  function hp(r) {
    return r &= -r, 1 < r ? 4 < r ? r & 268435455 ? 16 : 536870912 : 4 : 1;
  }
  var pa = l.unstable_scheduleCallback, mp = l.unstable_cancelCallback, k1 = l.unstable_shouldYield, T1 = l.unstable_requestPaint, Ye = l.unstable_now, ha = l.unstable_ImmediatePriority, P1 = l.unstable_UserBlockingPriority, ma = l.unstable_NormalPriority, C1 = l.unstable_IdlePriority, Vl = null, Rn = null;
  function R1(r) {
    if (Rn && typeof Rn.onCommitFiberRoot == "function") try {
      Rn.onCommitFiberRoot(Vl, r, void 0, (r.current.flags & 128) === 128);
    } catch {
    }
  }
  function A1(r, i) {
    return r === i && (r !== 0 || 1 / r === 1 / i) || r !== r && i !== i;
  }
  var An = typeof Object.is == "function" ? Object.is : A1, Vn = null, Kl = !1, ga = !1;
  function gp(r) {
    Vn === null ? Vn = [r] : Vn.push(r);
  }
  function L1(r) {
    Kl = !0, gp(r);
  }
  function Ln() {
    if (!ga && Vn !== null) {
      ga = !0;
      var r = 0, i = de;
      try {
        var u = Vn;
        for (de = 1; r < u.length; r++) {
          var c = u[r];
          do
            c = c(!0);
          while (c !== null);
        }
        Vn = null, Kl = !1;
      } catch (d) {
        throw Vn !== null && (Vn = Vn.slice(r + 1)), pa(ha, Ln), d;
      } finally {
        de = i, ga = !1;
      }
    }
    return null;
  }
  var N1 = f.ReactCurrentBatchConfig;
  function Ql(r, i) {
    if (An(r, i)) return !0;
    if (typeof r != "object" || r === null || typeof i != "object" || i === null) return !1;
    var u = Object.keys(r), c = Object.keys(i);
    if (u.length !== c.length) return !1;
    for (c = 0; c < u.length; c++) {
      var d = u[c];
      if (!y1.call(i, d) || !An(r[d], i[d])) return !1;
    }
    return !0;
  }
  function M1(r) {
    switch (r.tag) {
      case 5:
        return _o(r.type);
      case 16:
        return _o("Lazy");
      case 13:
        return _o("Suspense");
      case 19:
        return _o("SuspenseList");
      case 0:
      case 2:
      case 15:
        return r = ua(r.type, !1), r;
      case 11:
        return r = ua(r.type.render, !1), r;
      case 1:
        return r = ua(r.type, !0), r;
      default:
        return "";
    }
  }
  function gn(r, i) {
    if (r && r.defaultProps) {
      i = s({}, i), r = r.defaultProps;
      for (var u in r) i[u] === void 0 && (i[u] = r[u]);
      return i;
    }
    return i;
  }
  var Xl = sr(null), Yl = null, Si = null, ya = null;
  function va() {
    ya = Si = Yl = null;
  }
  function yp(r, i, u) {
    jl ? (we(Xl, i._currentValue), i._currentValue = u) : (we(Xl, i._currentValue2), i._currentValue2 = u);
  }
  function Sa(r) {
    var i = Xl.current;
    Te(Xl), jl ? r._currentValue = i : r._currentValue2 = i;
  }
  function wa(r, i, u) {
    for (; r !== null; ) {
      var c = r.alternate;
      if ((r.childLanes & i) !== i ? (r.childLanes |= i, c !== null && (c.childLanes |= i)) : c !== null && (c.childLanes & i) !== i && (c.childLanes |= i), r === u) break;
      r = r.return;
    }
  }
  function wi(r, i) {
    Yl = r, ya = Si = null, r = r.dependencies, r !== null && r.firstContext !== null && (r.lanes & i && (Bt = !0), r.firstContext = null);
  }
  function qt(r) {
    var i = jl ? r._currentValue : r._currentValue2;
    if (ya !== r) if (r = { context: r, memoizedValue: i, next: null }, Si === null) {
      if (Yl === null) throw Error(a(308));
      Si = r, Yl.dependencies = { lanes: 0, firstContext: r };
    } else Si = Si.next = r;
    return i;
  }
  var Nn = null, ar = !1;
  function _a(r) {
    r.updateQueue = { baseState: r.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function vp(r, i) {
    r = r.updateQueue, i.updateQueue === r && (i.updateQueue = { baseState: r.baseState, firstBaseUpdate: r.firstBaseUpdate, lastBaseUpdate: r.lastBaseUpdate, shared: r.shared, effects: r.effects });
  }
  function Kn(r, i) {
    return { eventTime: r, lane: i, tag: 0, payload: null, callback: null, next: null };
  }
  function cr(r, i) {
    var u = r.updateQueue;
    u !== null && (u = u.shared, He !== null && r.mode & 1 && !(oe & 2) ? (r = u.interleaved, r === null ? (i.next = i, Nn === null ? Nn = [u] : Nn.push(u)) : (i.next = r.next, r.next = i), u.interleaved = i) : (r = u.pending, r === null ? i.next = i : (i.next = r.next, r.next = i), u.pending = i));
  }
  function Zl(r, i, u) {
    if (i = i.updateQueue, i !== null && (i = i.shared, (u & 4194240) !== 0)) {
      var c = i.lanes;
      c &= r.pendingLanes, u |= c, i.lanes = u, da(r, u);
    }
  }
  function Sp(r, i) {
    var u = r.updateQueue, c = r.alternate;
    if (c !== null && (c = c.updateQueue, u === c)) {
      var d = null, h = null;
      if (u = u.firstBaseUpdate, u !== null) {
        do {
          var E = { eventTime: u.eventTime, lane: u.lane, tag: u.tag, payload: u.payload, callback: u.callback, next: null };
          h === null ? d = h = E : h = h.next = E, u = u.next;
        } while (u !== null);
        h === null ? d = h = i : h = h.next = i;
      } else d = h = i;
      u = { baseState: c.baseState, firstBaseUpdate: d, lastBaseUpdate: h, shared: c.shared, effects: c.effects }, r.updateQueue = u;
      return;
    }
    r = u.lastBaseUpdate, r === null ? u.firstBaseUpdate = i : r.next = i, u.lastBaseUpdate = i;
  }
  function Jl(r, i, u, c) {
    var d = r.updateQueue;
    ar = !1;
    var h = d.firstBaseUpdate, E = d.lastBaseUpdate, T = d.shared.pending;
    if (T !== null) {
      d.shared.pending = null;
      var z = T, G = z.next;
      z.next = null, E === null ? h = G : E.next = G, E = z;
      var J = r.alternate;
      J !== null && (J = J.updateQueue, T = J.lastBaseUpdate, T !== E && (T === null ? J.firstBaseUpdate = G : T.next = G, J.lastBaseUpdate = z));
    }
    if (h !== null) {
      var ne = d.baseState;
      E = 0, J = G = z = null, T = h;
      do {
        var ee = T.lane, ve = T.eventTime;
        if ((c & ee) === ee) {
          J !== null && (J = J.next = {
            eventTime: ve,
            lane: 0,
            tag: T.tag,
            payload: T.payload,
            callback: T.callback,
            next: null
          });
          e: {
            var b = r, at = T;
            switch (ee = i, ve = u, at.tag) {
              case 1:
                if (b = at.payload, typeof b == "function") {
                  ne = b.call(ve, ne, ee);
                  break e;
                }
                ne = b;
                break e;
              case 3:
                b.flags = b.flags & -65537 | 128;
              case 0:
                if (b = at.payload, ee = typeof b == "function" ? b.call(ve, ne, ee) : b, ee == null) break e;
                ne = s({}, ne, ee);
                break e;
              case 2:
                ar = !0;
            }
          }
          T.callback !== null && T.lane !== 0 && (r.flags |= 64, ee = d.effects, ee === null ? d.effects = [T] : ee.push(T));
        } else ve = { eventTime: ve, lane: ee, tag: T.tag, payload: T.payload, callback: T.callback, next: null }, J === null ? (G = J = ve, z = ne) : J = J.next = ve, E |= ee;
        if (T = T.next, T === null) {
          if (T = d.shared.pending, T === null) break;
          ee = T, T = ee.next, ee.next = null, d.lastBaseUpdate = ee, d.shared.pending = null;
        }
      } while (!0);
      if (J === null && (z = ne), d.baseState = z, d.firstBaseUpdate = G, d.lastBaseUpdate = J, i = d.shared.interleaved, i !== null) {
        d = i;
        do
          E |= d.lane, d = d.next;
        while (d !== i);
      } else h === null && (d.shared.lanes = 0);
      Ai |= E, r.lanes = E, r.memoizedState = ne;
    }
  }
  function wp(r, i, u) {
    if (r = i.effects, i.effects = null, r !== null) for (i = 0; i < r.length; i++) {
      var c = r[i], d = c.callback;
      if (d !== null) {
        if (c.callback = null, c = u, typeof d != "function") throw Error(a(191, d));
        d.call(c);
      }
    }
  }
  var _p = new o.Component().refs;
  function xa(r, i, u, c) {
    i = r.memoizedState, u = u(c, i), u = u == null ? i : s({}, i, u), r.memoizedState = u, r.lanes === 0 && (r.updateQueue.baseState = u);
  }
  var ql = { isMounted: function(r) {
    return (r = r._reactInternals) ? q(r) === r : !1;
  }, enqueueSetState: function(r, i, u) {
    r = r._reactInternals;
    var c = yt(), d = pr(r), h = Kn(c, d);
    h.payload = i, u != null && (h.callback = u), cr(r, h), i = nn(r, d, c), i !== null && Zl(i, r, d);
  }, enqueueReplaceState: function(r, i, u) {
    r = r._reactInternals;
    var c = yt(), d = pr(r), h = Kn(c, d);
    h.tag = 1, h.payload = i, u != null && (h.callback = u), cr(r, h), i = nn(r, d, c), i !== null && Zl(i, r, d);
  }, enqueueForceUpdate: function(r, i) {
    r = r._reactInternals;
    var u = yt(), c = pr(r), d = Kn(
      u,
      c
    );
    d.tag = 2, i != null && (d.callback = i), cr(r, d), i = nn(r, c, u), i !== null && Zl(i, r, c);
  } };
  function xp(r, i, u, c, d, h, E) {
    return r = r.stateNode, typeof r.shouldComponentUpdate == "function" ? r.shouldComponentUpdate(c, h, E) : i.prototype && i.prototype.isPureReactComponent ? !Ql(u, c) || !Ql(d, h) : !0;
  }
  function Ep(r, i, u) {
    var c = !1, d = ur, h = i.contextType;
    return typeof h == "object" && h !== null ? h = qt(h) : (d = Tt(i) ? Gr : ot.current, c = i.contextTypes, h = (c = c != null) ? vi(r, d) : ur), i = new i(u, h), r.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, i.updater = ql, r.stateNode = i, i._reactInternals = r, c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = d, r.__reactInternalMemoizedMaskedChildContext = h), i;
  }
  function kp(r, i, u, c) {
    r = i.state, typeof i.componentWillReceiveProps == "function" && i.componentWillReceiveProps(u, c), typeof i.UNSAFE_componentWillReceiveProps == "function" && i.UNSAFE_componentWillReceiveProps(u, c), i.state !== r && ql.enqueueReplaceState(i, i.state, null);
  }
  function Ea(r, i, u, c) {
    var d = r.stateNode;
    d.props = u, d.state = r.memoizedState, d.refs = _p, _a(r);
    var h = i.contextType;
    typeof h == "object" && h !== null ? d.context = qt(h) : (h = Tt(i) ? Gr : ot.current, d.context = vi(r, h)), d.state = r.memoizedState, h = i.getDerivedStateFromProps, typeof h == "function" && (xa(r, i, h, u), d.state = r.memoizedState), typeof i.getDerivedStateFromProps == "function" || typeof d.getSnapshotBeforeUpdate == "function" || typeof d.UNSAFE_componentWillMount != "function" && typeof d.componentWillMount != "function" || (i = d.state, typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), i !== d.state && ql.enqueueReplaceState(d, d.state, null), Jl(r, u, d, c), d.state = r.memoizedState), typeof d.componentDidMount == "function" && (r.flags |= 4194308);
  }
  var _i = [], xi = 0, $l = null, bl = 0, $t = [], bt = 0, Wr = null, Qn = 1, Xn = "";
  function Vr(r, i) {
    _i[xi++] = bl, _i[xi++] = $l, $l = r, bl = i;
  }
  function Tp(r, i, u) {
    $t[bt++] = Qn, $t[bt++] = Xn, $t[bt++] = Wr, Wr = r;
    var c = Qn;
    r = Xn;
    var d = 32 - mn(c) - 1;
    c &= ~(1 << d), u += 1;
    var h = 32 - mn(i) + d;
    if (30 < h) {
      var E = d - d % 5;
      h = (c & (1 << E) - 1).toString(32), c >>= E, d -= E, Qn = 1 << 32 - mn(i) + d | u << d | c, Xn = h + r;
    } else Qn = 1 << h | u << d | c, Xn = r;
  }
  function ka(r) {
    r.return !== null && (Vr(r, 1), Tp(r, 1, 0));
  }
  function Ta(r) {
    for (; r === $l; ) $l = _i[--xi], _i[xi] = null, bl = _i[--xi], _i[xi] = null;
    for (; r === Wr; ) Wr = $t[--bt], $t[bt] = null, Xn = $t[--bt], $t[bt] = null, Qn = $t[--bt], $t[bt] = null;
  }
  var Ut = null, Ht = null, Re = !1, ko = !1, yn = null;
  function Pp(r, i) {
    var u = rn(5, null, null, 0);
    u.elementType = "DELETED", u.stateNode = i, u.return = r, i = r.deletions, i === null ? (r.deletions = [u], r.flags |= 16) : i.push(u);
  }
  function Cp(r, i) {
    switch (r.tag) {
      case 5:
        return i = e1(i, r.type, r.pendingProps), i !== null ? (r.stateNode = i, Ut = r, Ht = i1(i), !0) : !1;
      case 6:
        return i = t1(i, r.pendingProps), i !== null ? (r.stateNode = i, Ut = r, Ht = null, !0) : !1;
      case 13:
        if (i = n1(i), i !== null) {
          var u = Wr !== null ? { id: Qn, overflow: Xn } : null;
          return r.memoizedState = { dehydrated: i, treeContext: u, retryLane: 1073741824 }, u = rn(18, null, null, 0), u.stateNode = i, u.return = r, r.child = u, Ut = r, Ht = null, !0;
        }
        return !1;
      default:
        return !1;
    }
  }
  function Pa(r) {
    return (r.mode & 1) !== 0 && (r.flags & 128) === 0;
  }
  function Ca(r) {
    if (Re) {
      var i = Ht;
      if (i) {
        var u = i;
        if (!Cp(r, i)) {
          if (Pa(r)) throw Error(a(418));
          i = wo(u);
          var c = Ut;
          i && Cp(r, i) ? Pp(c, u) : (r.flags = r.flags & -4097 | 2, Re = !1, Ut = r);
        }
      } else {
        if (Pa(r)) throw Error(a(418));
        r.flags = r.flags & -4097 | 2, Re = !1, Ut = r;
      }
    }
  }
  function Rp(r) {
    for (r = r.return; r !== null && r.tag !== 5 && r.tag !== 3 && r.tag !== 13; ) r = r.return;
    Ut = r;
  }
  function To(r) {
    if (!Ft || r !== Ut) return !1;
    if (!Re) return Rp(r), Re = !0, !1;
    if (r.tag !== 3 && (r.tag !== 5 || h1(r.type) && !it(r.type, r.memoizedProps))) {
      var i = Ht;
      if (i) {
        if (Pa(r)) {
          for (r = Ht; r; ) r = wo(r);
          throw Error(a(418));
        }
        for (; i; ) Pp(r, i), i = wo(i);
      }
    }
    if (Rp(r), r.tag === 13) {
      if (!Ft) throw Error(a(316));
      if (r = r.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
      Ht = c1(r);
    } else Ht = Ut ? wo(r.stateNode) : null;
    return !0;
  }
  function Ei() {
    Ft && (Ht = Ut = null, ko = Re = !1);
  }
  function Ra(r) {
    yn === null ? yn = [r] : yn.push(r);
  }
  function Po(r, i, u) {
    if (r = u.ref, r !== null && typeof r != "function" && typeof r != "object") {
      if (u._owner) {
        if (u = u._owner, u) {
          if (u.tag !== 1) throw Error(a(309));
          var c = u.stateNode;
        }
        if (!c) throw Error(a(147, r));
        var d = c, h = "" + r;
        return i !== null && i.ref !== null && typeof i.ref == "function" && i.ref._stringRef === h ? i.ref : (i = function(E) {
          var T = d.refs;
          T === _p && (T = d.refs = {}), E === null ? delete T[h] : T[h] = E;
        }, i._stringRef = h, i);
      }
      if (typeof r != "string") throw Error(a(284));
      if (!u._owner) throw Error(a(290, r));
    }
    return r;
  }
  function es(r, i) {
    throw r = Object.prototype.toString.call(i), Error(a(31, r === "[object Object]" ? "object with keys {" + Object.keys(i).join(", ") + "}" : r));
  }
  function Ap(r) {
    var i = r._init;
    return i(r._payload);
  }
  function Lp(r) {
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
    function d(L, P) {
      return L = mr(L, P), L.index = 0, L.sibling = null, L;
    }
    function h(L, P, M) {
      return L.index = M, r ? (M = L.alternate, M !== null ? (M = M.index, M < P ? (L.flags |= 2, P) : M) : (L.flags |= 2, P)) : (L.flags |= 1048576, P);
    }
    function E(L) {
      return r && L.alternate === null && (L.flags |= 2), L;
    }
    function T(L, P, M, X) {
      return P === null || P.tag !== 6 ? (P = fc(M, L.mode, X), P.return = L, P) : (P = d(P, M), P.return = L, P);
    }
    function z(L, P, M, X) {
      var $ = M.type;
      return $ === g ? J(L, P, M.props.children, X, M.key) : P !== null && (P.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === x && Ap($) === P.type) ? (X = d(P, M.props), X.ref = Po(L, P, M), X.return = L, X) : (X = Ns(M.type, M.key, M.props, null, L.mode, X), X.ref = Po(L, P, M), X.return = L, X);
    }
    function G(L, P, M, X) {
      return P === null || P.tag !== 4 || P.stateNode.containerInfo !== M.containerInfo || P.stateNode.implementation !== M.implementation ? (P = dc(M, L.mode, X), P.return = L, P) : (P = d(P, M.children || []), P.return = L, P);
    }
    function J(L, P, M, X, $) {
      return P === null || P.tag !== 7 ? (P = qr(M, L.mode, X, $), P.return = L, P) : (P = d(P, M), P.return = L, P);
    }
    function ne(L, P, M) {
      if (typeof P == "string" && P !== "" || typeof P == "number") return P = fc("" + P, L.mode, M), P.return = L, P;
      if (typeof P == "object" && P !== null) {
        switch (P.$$typeof) {
          case p:
            return M = Ns(P.type, P.key, P.props, null, L.mode, M), M.ref = Po(L, null, P), M.return = L, M;
          case m:
            return P = dc(P, L.mode, M), P.return = L, P;
          case x:
            var X = P._init;
            return ne(L, X(P._payload), M);
        }
        if (jt(P) || D(P)) return P = qr(P, L.mode, M, null), P.return = L, P;
        es(L, P);
      }
      return null;
    }
    function ee(L, P, M, X) {
      var $ = P !== null ? P.key : null;
      if (typeof M == "string" && M !== "" || typeof M == "number") return $ !== null ? null : T(L, P, "" + M, X);
      if (typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case p:
            return M.key === $ ? z(L, P, M, X) : null;
          case m:
            return M.key === $ ? G(L, P, M, X) : null;
          case x:
            return $ = M._init, ee(
              L,
              P,
              $(M._payload),
              X
            );
        }
        if (jt(M) || D(M)) return $ !== null ? null : J(L, P, M, X, null);
        es(L, M);
      }
      return null;
    }
    function ve(L, P, M, X, $) {
      if (typeof X == "string" && X !== "" || typeof X == "number") return L = L.get(M) || null, T(P, L, "" + X, $);
      if (typeof X == "object" && X !== null) {
        switch (X.$$typeof) {
          case p:
            return L = L.get(X.key === null ? M : X.key) || null, z(P, L, X, $);
          case m:
            return L = L.get(X.key === null ? M : X.key) || null, G(P, L, X, $);
          case x:
            var ie = X._init;
            return ve(L, P, M, ie(X._payload), $);
        }
        if (jt(X) || D(X)) return L = L.get(M) || null, J(P, L, X, $, null);
        es(P, X);
      }
      return null;
    }
    function b(L, P, M, X) {
      for (var $ = null, ie = null, re = P, pe = P = 0, Je = null; re !== null && pe < M.length; pe++) {
        re.index > pe ? (Je = re, re = null) : Je = re.sibling;
        var he = ee(L, re, M[pe], X);
        if (he === null) {
          re === null && (re = Je);
          break;
        }
        r && re && he.alternate === null && i(L, re), P = h(he, P, pe), ie === null ? $ = he : ie.sibling = he, ie = he, re = Je;
      }
      if (pe === M.length) return u(L, re), Re && Vr(L, pe), $;
      if (re === null) {
        for (; pe < M.length; pe++) re = ne(L, M[pe], X), re !== null && (P = h(re, P, pe), ie === null ? $ = re : ie.sibling = re, ie = re);
        return Re && Vr(L, pe), $;
      }
      for (re = c(L, re); pe < M.length; pe++) Je = ve(re, L, pe, M[pe], X), Je !== null && (r && Je.alternate !== null && re.delete(Je.key === null ? pe : Je.key), P = h(Je, P, pe), ie === null ? $ = Je : ie.sibling = Je, ie = Je);
      return r && re.forEach(function(gr) {
        return i(L, gr);
      }), Re && Vr(L, pe), $;
    }
    function at(L, P, M, X) {
      var $ = D(M);
      if (typeof $ != "function") throw Error(a(150));
      if (M = $.call(M), M == null) throw Error(a(151));
      for (var ie = $ = null, re = P, pe = P = 0, Je = null, he = M.next(); re !== null && !he.done; pe++, he = M.next()) {
        re.index > pe ? (Je = re, re = null) : Je = re.sibling;
        var gr = ee(L, re, he.value, X);
        if (gr === null) {
          re === null && (re = Je);
          break;
        }
        r && re && gr.alternate === null && i(L, re), P = h(gr, P, pe), ie === null ? $ = gr : ie.sibling = gr, ie = gr, re = Je;
      }
      if (he.done) return u(
        L,
        re
      ), Re && Vr(L, pe), $;
      if (re === null) {
        for (; !he.done; pe++, he = M.next()) he = ne(L, he.value, X), he !== null && (P = h(he, P, pe), ie === null ? $ = he : ie.sibling = he, ie = he);
        return Re && Vr(L, pe), $;
      }
      for (re = c(L, re); !he.done; pe++, he = M.next()) he = ve(re, L, pe, he.value, X), he !== null && (r && he.alternate !== null && re.delete(he.key === null ? pe : he.key), P = h(he, P, pe), ie === null ? $ = he : ie.sibling = he, ie = he);
      return r && re.forEach(function(uS) {
        return i(L, uS);
      }), Re && Vr(L, pe), $;
    }
    function on(L, P, M, X) {
      if (typeof M == "object" && M !== null && M.type === g && M.key === null && (M = M.props.children), typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case p:
            e: {
              for (var $ = M.key, ie = P; ie !== null; ) {
                if (ie.key === $) {
                  if ($ = M.type, $ === g) {
                    if (ie.tag === 7) {
                      u(L, ie.sibling), P = d(ie, M.props.children), P.return = L, L = P;
                      break e;
                    }
                  } else if (ie.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === x && Ap($) === ie.type) {
                    u(L, ie.sibling), P = d(ie, M.props), P.ref = Po(L, ie, M), P.return = L, L = P;
                    break e;
                  }
                  u(L, ie);
                  break;
                } else i(L, ie);
                ie = ie.sibling;
              }
              M.type === g ? (P = qr(M.props.children, L.mode, X, M.key), P.return = L, L = P) : (X = Ns(M.type, M.key, M.props, null, L.mode, X), X.ref = Po(L, P, M), X.return = L, L = X);
            }
            return E(L);
          case m:
            e: {
              for (ie = M.key; P !== null; ) {
                if (P.key === ie) if (P.tag === 4 && P.stateNode.containerInfo === M.containerInfo && P.stateNode.implementation === M.implementation) {
                  u(L, P.sibling), P = d(P, M.children || []), P.return = L, L = P;
                  break e;
                } else {
                  u(L, P);
                  break;
                }
                else i(L, P);
                P = P.sibling;
              }
              P = dc(M, L.mode, X), P.return = L, L = P;
            }
            return E(L);
          case x:
            return ie = M._init, on(L, P, ie(M._payload), X);
        }
        if (jt(M)) return b(L, P, M, X);
        if (D(M)) return at(L, P, M, X);
        es(L, M);
      }
      return typeof M == "string" && M !== "" || typeof M == "number" ? (M = "" + M, P !== null && P.tag === 6 ? (u(L, P.sibling), P = d(P, M), P.return = L, L = P) : (u(L, P), P = fc(M, L.mode, X), P.return = L, L = P), E(L)) : u(L, P);
    }
    return on;
  }
  var ki = Lp(!0), Np = Lp(!1), Co = {}, en = sr(Co), Ro = sr(Co), Ti = sr(Co);
  function Mn(r) {
    if (r === Co) throw Error(a(174));
    return r;
  }
  function Aa(r, i) {
    we(Ti, i), we(Ro, r), we(en, Co), r = Et(i), Te(en), we(en, r);
  }
  function Pi() {
    Te(en), Te(Ro), Te(Ti);
  }
  function Mp(r) {
    var i = Mn(Ti.current), u = Mn(en.current);
    i = N(u, r.type, i), u !== i && (we(Ro, r), we(en, i));
  }
  function La(r) {
    Ro.current === r && (Te(en), Te(Ro));
  }
  var Le = sr(0);
  function ts(r) {
    for (var i = r; i !== null; ) {
      if (i.tag === 13) {
        var u = i.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || ap(u) || oa(u))) return i;
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
  var Na = [];
  function Ma() {
    for (var r = 0; r < Na.length; r++) {
      var i = Na[r];
      jl ? i._workInProgressVersionPrimary = null : i._workInProgressVersionSecondary = null;
    }
    Na.length = 0;
  }
  var ns = f.ReactCurrentDispatcher, tn = f.ReactCurrentBatchConfig, Ci = 0, Oe = null, lt = null, Ze = null, rs = !1, Ao = !1, Lo = 0, z1 = 0;
  function st() {
    throw Error(a(321));
  }
  function za(r, i) {
    if (i === null) return !1;
    for (var u = 0; u < i.length && u < r.length; u++) if (!An(r[u], i[u])) return !1;
    return !0;
  }
  function Ia(r, i, u, c, d, h) {
    if (Ci = h, Oe = i, i.memoizedState = null, i.updateQueue = null, i.lanes = 0, ns.current = r === null || r.memoizedState === null ? j1 : F1, r = u(c, d), Ao) {
      h = 0;
      do {
        if (Ao = !1, Lo = 0, 25 <= h) throw Error(a(301));
        h += 1, Ze = lt = null, i.updateQueue = null, ns.current = U1, r = u(c, d);
      } while (Ao);
    }
    if (ns.current = us, i = lt !== null && lt.next !== null, Ci = 0, Ze = lt = Oe = null, rs = !1, i) throw Error(a(300));
    return r;
  }
  function Oa() {
    var r = Lo !== 0;
    return Lo = 0, r;
  }
  function Yn() {
    var r = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Ze === null ? Oe.memoizedState = Ze = r : Ze = Ze.next = r, Ze;
  }
  function zn() {
    if (lt === null) {
      var r = Oe.alternate;
      r = r !== null ? r.memoizedState : null;
    } else r = lt.next;
    var i = Ze === null ? Oe.memoizedState : Ze.next;
    if (i !== null) Ze = i, lt = r;
    else {
      if (r === null) throw Error(a(310));
      lt = r, r = { memoizedState: lt.memoizedState, baseState: lt.baseState, baseQueue: lt.baseQueue, queue: lt.queue, next: null }, Ze === null ? Oe.memoizedState = Ze = r : Ze = Ze.next = r;
    }
    return Ze;
  }
  function Kr(r, i) {
    return typeof i == "function" ? i(r) : i;
  }
  function is(r) {
    var i = zn(), u = i.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = lt, d = c.baseQueue, h = u.pending;
    if (h !== null) {
      if (d !== null) {
        var E = d.next;
        d.next = h.next, h.next = E;
      }
      c.baseQueue = d = h, u.pending = null;
    }
    if (d !== null) {
      h = d.next, c = c.baseState;
      var T = E = null, z = null, G = h;
      do {
        var J = G.lane;
        if ((Ci & J) === J) z !== null && (z = z.next = { lane: 0, action: G.action, hasEagerState: G.hasEagerState, eagerState: G.eagerState, next: null }), c = G.hasEagerState ? G.eagerState : r(c, G.action);
        else {
          var ne = {
            lane: J,
            action: G.action,
            hasEagerState: G.hasEagerState,
            eagerState: G.eagerState,
            next: null
          };
          z === null ? (T = z = ne, E = c) : z = z.next = ne, Oe.lanes |= J, Ai |= J;
        }
        G = G.next;
      } while (G !== null && G !== h);
      z === null ? E = c : z.next = T, An(c, i.memoizedState) || (Bt = !0), i.memoizedState = c, i.baseState = E, i.baseQueue = z, u.lastRenderedState = c;
    }
    if (r = u.interleaved, r !== null) {
      d = r;
      do
        h = d.lane, Oe.lanes |= h, Ai |= h, d = d.next;
      while (d !== r);
    } else d === null && (u.lanes = 0);
    return [i.memoizedState, u.dispatch];
  }
  function os(r) {
    var i = zn(), u = i.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = u.dispatch, d = u.pending, h = i.memoizedState;
    if (d !== null) {
      u.pending = null;
      var E = d = d.next;
      do
        h = r(h, E.action), E = E.next;
      while (E !== d);
      An(h, i.memoizedState) || (Bt = !0), i.memoizedState = h, i.baseQueue === null && (i.baseState = h), u.lastRenderedState = h;
    }
    return [h, c];
  }
  function zp() {
  }
  function Ip(r, i) {
    var u = Oe, c = zn(), d = i(), h = !An(c.memoizedState, d);
    if (h && (c.memoizedState = d, Bt = !0), c = c.queue, Mo(jp.bind(null, u, c, r), [r]), c.getSnapshot !== i || h || Ze !== null && Ze.memoizedState.tag & 1) {
      if (u.flags |= 2048, No(9, Dp.bind(null, u, c, d, i), void 0, null), He === null) throw Error(a(349));
      Ci & 30 || Op(u, i, d);
    }
    return d;
  }
  function Op(r, i, u) {
    r.flags |= 16384, r = { getSnapshot: i, value: u }, i = Oe.updateQueue, i === null ? (i = { lastEffect: null, stores: null }, Oe.updateQueue = i, i.stores = [r]) : (u = i.stores, u === null ? i.stores = [r] : u.push(r));
  }
  function Dp(r, i, u, c) {
    i.value = u, i.getSnapshot = c, Fp(i) && nn(r, 1, -1);
  }
  function jp(r, i, u) {
    return u(function() {
      Fp(i) && nn(r, 1, -1);
    });
  }
  function Fp(r) {
    var i = r.getSnapshot;
    r = r.value;
    try {
      var u = i();
      return !An(r, u);
    } catch {
      return !0;
    }
  }
  function Da(r) {
    var i = Yn();
    return typeof r == "function" && (r = r()), i.memoizedState = i.baseState = r, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Kr, lastRenderedState: r }, i.queue = r, r = r.dispatch = D1.bind(null, Oe, r), [i.memoizedState, r];
  }
  function No(r, i, u, c) {
    return r = { tag: r, create: i, destroy: u, deps: c, next: null }, i = Oe.updateQueue, i === null ? (i = { lastEffect: null, stores: null }, Oe.updateQueue = i, i.lastEffect = r.next = r) : (u = i.lastEffect, u === null ? i.lastEffect = r.next = r : (c = u.next, u.next = r, r.next = c, i.lastEffect = r)), r;
  }
  function Up() {
    return zn().memoizedState;
  }
  function ls(r, i, u, c) {
    var d = Yn();
    Oe.flags |= r, d.memoizedState = No(1 | i, u, void 0, c === void 0 ? null : c);
  }
  function ss(r, i, u, c) {
    var d = zn();
    c = c === void 0 ? null : c;
    var h = void 0;
    if (lt !== null) {
      var E = lt.memoizedState;
      if (h = E.destroy, c !== null && za(c, E.deps)) {
        d.memoizedState = No(i, u, h, c);
        return;
      }
    }
    Oe.flags |= r, d.memoizedState = No(1 | i, u, h, c);
  }
  function ja(r, i) {
    return ls(8390656, 8, r, i);
  }
  function Mo(r, i) {
    return ss(2048, 8, r, i);
  }
  function Hp(r, i) {
    return ss(4, 2, r, i);
  }
  function Bp(r, i) {
    return ss(4, 4, r, i);
  }
  function Gp(r, i) {
    if (typeof i == "function") return r = r(), i(r), function() {
      i(null);
    };
    if (i != null) return r = r(), i.current = r, function() {
      i.current = null;
    };
  }
  function Wp(r, i, u) {
    return u = u != null ? u.concat([r]) : null, ss(4, 4, Gp.bind(null, i, r), u);
  }
  function Fa() {
  }
  function Vp(r, i) {
    var u = zn();
    i = i === void 0 ? null : i;
    var c = u.memoizedState;
    return c !== null && i !== null && za(i, c[1]) ? c[0] : (u.memoizedState = [r, i], r);
  }
  function Kp(r, i) {
    var u = zn();
    i = i === void 0 ? null : i;
    var c = u.memoizedState;
    return c !== null && i !== null && za(i, c[1]) ? c[0] : (r = r(), u.memoizedState = [r, i], r);
  }
  function I1(r, i) {
    var u = de;
    de = u !== 0 && 4 > u ? u : 4, r(!0);
    var c = tn.transition;
    tn.transition = {};
    try {
      r(!1), i();
    } finally {
      de = u, tn.transition = c;
    }
  }
  function Qp() {
    return zn().memoizedState;
  }
  function O1(r, i, u) {
    var c = pr(r);
    u = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null }, Xp(r) ? Yp(i, u) : (Zp(r, i, u), u = yt(), r = nn(r, c, u), r !== null && Jp(r, i, c));
  }
  function D1(r, i, u) {
    var c = pr(r), d = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null };
    if (Xp(r)) Yp(i, d);
    else {
      Zp(r, i, d);
      var h = r.alternate;
      if (r.lanes === 0 && (h === null || h.lanes === 0) && (h = i.lastRenderedReducer, h !== null)) try {
        var E = i.lastRenderedState, T = h(E, u);
        if (d.hasEagerState = !0, d.eagerState = T, An(T, E)) return;
      } catch {
      } finally {
      }
      u = yt(), r = nn(r, c, u), r !== null && Jp(r, i, c);
    }
  }
  function Xp(r) {
    var i = r.alternate;
    return r === Oe || i !== null && i === Oe;
  }
  function Yp(r, i) {
    Ao = rs = !0;
    var u = r.pending;
    u === null ? i.next = i : (i.next = u.next, u.next = i), r.pending = i;
  }
  function Zp(r, i, u) {
    He !== null && r.mode & 1 && !(oe & 2) ? (r = i.interleaved, r === null ? (u.next = u, Nn === null ? Nn = [i] : Nn.push(i)) : (u.next = r.next, r.next = u), i.interleaved = u) : (r = i.pending, r === null ? u.next = u : (u.next = r.next, r.next = u), i.pending = u);
  }
  function Jp(r, i, u) {
    if (u & 4194240) {
      var c = i.lanes;
      c &= r.pendingLanes, u |= c, i.lanes = u, da(r, u);
    }
  }
  var us = { readContext: qt, useCallback: st, useContext: st, useEffect: st, useImperativeHandle: st, useInsertionEffect: st, useLayoutEffect: st, useMemo: st, useReducer: st, useRef: st, useState: st, useDebugValue: st, useDeferredValue: st, useTransition: st, useMutableSource: st, useSyncExternalStore: st, useId: st, unstable_isNewReconciler: !1 }, j1 = { readContext: qt, useCallback: function(r, i) {
    return Yn().memoizedState = [r, i === void 0 ? null : i], r;
  }, useContext: qt, useEffect: ja, useImperativeHandle: function(r, i, u) {
    return u = u != null ? u.concat([r]) : null, ls(
      4194308,
      4,
      Gp.bind(null, i, r),
      u
    );
  }, useLayoutEffect: function(r, i) {
    return ls(4194308, 4, r, i);
  }, useInsertionEffect: function(r, i) {
    return ls(4, 2, r, i);
  }, useMemo: function(r, i) {
    var u = Yn();
    return i = i === void 0 ? null : i, r = r(), u.memoizedState = [r, i], r;
  }, useReducer: function(r, i, u) {
    var c = Yn();
    return i = u !== void 0 ? u(i) : i, c.memoizedState = c.baseState = i, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: r, lastRenderedState: i }, c.queue = r, r = r.dispatch = O1.bind(null, Oe, r), [c.memoizedState, r];
  }, useRef: function(r) {
    var i = Yn();
    return r = { current: r }, i.memoizedState = r;
  }, useState: Da, useDebugValue: Fa, useDeferredValue: function(r) {
    var i = Da(r), u = i[0], c = i[1];
    return ja(function() {
      var d = tn.transition;
      tn.transition = {};
      try {
        c(r);
      } finally {
        tn.transition = d;
      }
    }, [r]), u;
  }, useTransition: function() {
    var r = Da(!1), i = r[0];
    return r = I1.bind(null, r[1]), Yn().memoizedState = r, [i, r];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(r, i, u) {
    var c = Oe, d = Yn();
    if (Re) {
      if (u === void 0) throw Error(a(407));
      u = u();
    } else {
      if (u = i(), He === null) throw Error(a(349));
      Ci & 30 || Op(c, i, u);
    }
    d.memoizedState = u;
    var h = { value: u, getSnapshot: i };
    return d.queue = h, ja(jp.bind(null, c, h, r), [r]), c.flags |= 2048, No(9, Dp.bind(null, c, h, u, i), void 0, null), u;
  }, useId: function() {
    var r = Yn(), i = He.identifierPrefix;
    if (Re) {
      var u = Xn, c = Qn;
      u = (c & ~(1 << 32 - mn(c) - 1)).toString(32) + u, i = ":" + i + "R" + u, u = Lo++, 0 < u && (i += "H" + u.toString(32)), i += ":";
    } else u = z1++, i = ":" + i + "r" + u.toString(32) + ":";
    return r.memoizedState = i;
  }, unstable_isNewReconciler: !1 }, F1 = {
    readContext: qt,
    useCallback: Vp,
    useContext: qt,
    useEffect: Mo,
    useImperativeHandle: Wp,
    useInsertionEffect: Hp,
    useLayoutEffect: Bp,
    useMemo: Kp,
    useReducer: is,
    useRef: Up,
    useState: function() {
      return is(Kr);
    },
    useDebugValue: Fa,
    useDeferredValue: function(r) {
      var i = is(Kr), u = i[0], c = i[1];
      return Mo(function() {
        var d = tn.transition;
        tn.transition = {};
        try {
          c(r);
        } finally {
          tn.transition = d;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = is(Kr)[0], i = zn().memoizedState;
      return [r, i];
    },
    useMutableSource: zp,
    useSyncExternalStore: Ip,
    useId: Qp,
    unstable_isNewReconciler: !1
  }, U1 = {
    readContext: qt,
    useCallback: Vp,
    useContext: qt,
    useEffect: Mo,
    useImperativeHandle: Wp,
    useInsertionEffect: Hp,
    useLayoutEffect: Bp,
    useMemo: Kp,
    useReducer: os,
    useRef: Up,
    useState: function() {
      return os(Kr);
    },
    useDebugValue: Fa,
    useDeferredValue: function(r) {
      var i = os(Kr), u = i[0], c = i[1];
      return Mo(function() {
        var d = tn.transition;
        tn.transition = {};
        try {
          c(r);
        } finally {
          tn.transition = d;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = os(Kr)[0], i = zn().memoizedState;
      return [r, i];
    },
    useMutableSource: zp,
    useSyncExternalStore: Ip,
    useId: Qp,
    unstable_isNewReconciler: !1
  };
  function Ua(r, i) {
    try {
      var u = "", c = i;
      do
        u += M1(c), c = c.return;
      while (c);
      var d = u;
    } catch (h) {
      d = `
Error generating stack: ` + h.message + `
` + h.stack;
    }
    return { value: r, source: i, stack: d };
  }
  function Ha(r, i) {
    try {
      console.error(i.value);
    } catch (u) {
      setTimeout(function() {
        throw u;
      });
    }
  }
  var H1 = typeof WeakMap == "function" ? WeakMap : Map;
  function qp(r, i, u) {
    u = Kn(-1, u), u.tag = 3, u.payload = { element: null };
    var c = i.value;
    return u.callback = function() {
      ks || (ks = !0, ic = c), Ha(r, i);
    }, u;
  }
  function $p(r, i, u) {
    u = Kn(-1, u), u.tag = 3;
    var c = r.type.getDerivedStateFromError;
    if (typeof c == "function") {
      var d = i.value;
      u.payload = function() {
        return c(d);
      }, u.callback = function() {
        Ha(r, i);
      };
    }
    var h = r.stateNode;
    return h !== null && typeof h.componentDidCatch == "function" && (u.callback = function() {
      Ha(r, i), typeof c != "function" && (fr === null ? fr = /* @__PURE__ */ new Set([this]) : fr.add(this));
      var E = i.stack;
      this.componentDidCatch(i.value, { componentStack: E !== null ? E : "" });
    }), u;
  }
  function bp(r, i, u) {
    var c = r.pingCache;
    if (c === null) {
      c = r.pingCache = new H1();
      var d = /* @__PURE__ */ new Set();
      c.set(i, d);
    } else d = c.get(i), d === void 0 && (d = /* @__PURE__ */ new Set(), c.set(i, d));
    d.has(u) || (d.add(u), r = eS.bind(null, r, i, u), i.then(r, r));
  }
  function eh(r) {
    do {
      var i;
      if ((i = r.tag === 13) && (i = r.memoizedState, i = i !== null ? i.dehydrated !== null : !0), i) return r;
      r = r.return;
    } while (r !== null);
    return null;
  }
  function th(r, i, u, c, d) {
    return r.mode & 1 ? (r.flags |= 65536, r.lanes = d, r) : (r === i ? r.flags |= 65536 : (r.flags |= 128, u.flags |= 131072, u.flags &= -52805, u.tag === 1 && (u.alternate === null ? u.tag = 17 : (i = Kn(-1, 1), i.tag = 2, cr(u, i))), u.lanes |= 1), r);
  }
  function In(r) {
    r.flags |= 4;
  }
  function nh(r, i) {
    if (r !== null && r.child === i.child) return !0;
    if (i.flags & 16) return !1;
    for (r = i.child; r !== null; ) {
      if (r.flags & 12854 || r.subtreeFlags & 12854) return !1;
      r = r.sibling;
    }
    return !0;
  }
  var zo, Io, as, cs;
  if (hn) zo = function(r, i) {
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
  }, Io = function() {
  }, as = function(r, i, u, c, d) {
    if (r = r.memoizedProps, r !== c) {
      var h = i.stateNode, E = Mn(en.current);
      u = Ie(h, u, r, c, d, E), (i.updateQueue = u) && In(i);
    }
  }, cs = function(r, i, u, c) {
    u !== c && In(i);
  };
  else if (Fl) {
    zo = function(r, i, u, c) {
      for (var d = i.child; d !== null; ) {
        if (d.tag === 5) {
          var h = d.stateNode;
          u && c && (h = sp(h, d.type, d.memoizedProps, d)), te(r, h);
        } else if (d.tag === 6) h = d.stateNode, u && c && (h = up(h, d.memoizedProps, d)), te(r, h);
        else if (d.tag !== 4) {
          if (d.tag === 22 && d.memoizedState !== null) h = d.child, h !== null && (h.return = d), zo(r, d, !0, !0);
          else if (d.child !== null) {
            d.child.return = d, d = d.child;
            continue;
          }
        }
        if (d === i) break;
        for (; d.sibling === null; ) {
          if (d.return === null || d.return === i) return;
          d = d.return;
        }
        d.sibling.return = d.return, d = d.sibling;
      }
    };
    var rh = function(r, i, u, c) {
      for (var d = i.child; d !== null; ) {
        if (d.tag === 5) {
          var h = d.stateNode;
          u && c && (h = sp(h, d.type, d.memoizedProps, d)), op(r, h);
        } else if (d.tag === 6) h = d.stateNode, u && c && (h = up(h, d.memoizedProps, d)), op(r, h);
        else if (d.tag !== 4) {
          if (d.tag === 22 && d.memoizedState !== null) h = d.child, h !== null && (h.return = d), rh(r, d, !0, !0);
          else if (d.child !== null) {
            d.child.return = d, d = d.child;
            continue;
          }
        }
        if (d === i) break;
        for (; d.sibling === null; ) {
          if (d.return === null || d.return === i) return;
          d = d.return;
        }
        d.sibling.return = d.return, d = d.sibling;
      }
    };
    Io = function(r, i) {
      var u = i.stateNode;
      if (!nh(r, i)) {
        r = u.containerInfo;
        var c = ip(r);
        rh(c, i, !1, !1), u.pendingChildren = c, In(i), b0(r, c);
      }
    }, as = function(r, i, u, c, d) {
      var h = r.stateNode, E = r.memoizedProps;
      if ((r = nh(r, i)) && E === c) i.stateNode = h;
      else {
        var T = i.stateNode, z = Mn(en.current), G = null;
        E !== c && (G = Ie(T, u, E, c, d, z)), r && G === null ? i.stateNode = h : (h = $0(h, G, u, E, c, i, r, T), ae(h, u, c, d, z) && In(i), i.stateNode = h, r ? In(i) : zo(h, i, !1, !1));
      }
    }, cs = function(r, i, u, c) {
      u !== c ? (r = Mn(Ti.current), u = Mn(en.current), i.stateNode = Xe(c, r, u, i), In(i)) : i.stateNode = r.stateNode;
    };
  } else Io = function() {
  }, as = function() {
  }, cs = function() {
  };
  function Oo(r, i) {
    if (!Re) switch (r.tailMode) {
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
  function ut(r) {
    var i = r.alternate !== null && r.alternate.child === r.child, u = 0, c = 0;
    if (i) for (var d = r.child; d !== null; ) u |= d.lanes | d.childLanes, c |= d.subtreeFlags & 14680064, c |= d.flags & 14680064, d.return = r, d = d.sibling;
    else for (d = r.child; d !== null; ) u |= d.lanes | d.childLanes, c |= d.subtreeFlags, c |= d.flags, d.return = r, d = d.sibling;
    return r.subtreeFlags |= c, r.childLanes = u, i;
  }
  function B1(r, i, u) {
    var c = i.pendingProps;
    switch (Ta(i), i.tag) {
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
        return ut(i), null;
      case 1:
        return Tt(i.type) && Ul(), ut(i), null;
      case 3:
        return c = i.stateNode, Pi(), Te(kt), Te(ot), Ma(), c.pendingContext && (c.context = c.pendingContext, c.pendingContext = null), (r === null || r.child === null) && (To(i) ? In(i) : r === null || r.memoizedState.isDehydrated && !(i.flags & 256) || (i.flags |= 1024, yn !== null && (sc(yn), yn = null))), Io(r, i), ut(i), null;
      case 5:
        La(i), u = Mn(Ti.current);
        var d = i.type;
        if (r !== null && i.stateNode != null) as(r, i, d, c, u), r.ref !== i.ref && (i.flags |= 512, i.flags |= 2097152);
        else {
          if (!c) {
            if (i.stateNode === null) throw Error(a(166));
            return ut(i), null;
          }
          if (r = Mn(en.current), To(i)) {
            if (!Ft) throw Error(a(175));
            r = s1(i.stateNode, i.type, i.memoizedProps, u, r, i, !ko), i.updateQueue = r, r !== null && In(i);
          } else {
            var h = Y(d, c, u, r, i);
            zo(h, i, !1, !1), i.stateNode = h, ae(h, d, c, u, r) && In(i);
          }
          i.ref !== null && (i.flags |= 512, i.flags |= 2097152);
        }
        return ut(i), null;
      case 6:
        if (r && i.stateNode != null) cs(r, i, r.memoizedProps, c);
        else {
          if (typeof c != "string" && i.stateNode === null) throw Error(a(166));
          if (r = Mn(Ti.current), u = Mn(en.current), To(i)) {
            if (!Ft) throw Error(a(176));
            if (r = i.stateNode, c = i.memoizedProps, (u = u1(r, c, i, !ko)) && (d = Ut, d !== null)) switch (h = (d.mode & 1) !== 0, d.tag) {
              case 3:
                m1(d.stateNode.containerInfo, r, c, h);
                break;
              case 5:
                g1(d.type, d.memoizedProps, d.stateNode, r, c, h);
            }
            u && In(i);
          } else i.stateNode = Xe(c, r, u, i);
        }
        return ut(i), null;
      case 13:
        if (Te(Le), c = i.memoizedState, Re && Ht !== null && i.mode & 1 && !(i.flags & 128)) {
          for (r = Ht; r; ) r = wo(r);
          return Ei(), i.flags |= 98560, i;
        }
        if (c !== null && c.dehydrated !== null) {
          if (c = To(i), r === null) {
            if (!c) throw Error(a(318));
            if (!Ft) throw Error(a(344));
            if (r = i.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
            a1(r, i);
          } else Ei(), !(i.flags & 128) && (i.memoizedState = null), i.flags |= 4;
          return ut(i), null;
        }
        return yn !== null && (sc(yn), yn = null), i.flags & 128 ? (i.lanes = u, i) : (c = c !== null, u = !1, r === null ? To(i) : u = r.memoizedState !== null, c && !u && (i.child.flags |= 8192, i.mode & 1 && (r === null || Le.current & 1 ? We === 0 && (We = 3) : ac())), i.updateQueue !== null && (i.flags |= 4), ut(i), null);
      case 4:
        return Pi(), Io(r, i), r === null && C0(i.stateNode.containerInfo), ut(i), null;
      case 10:
        return Sa(i.type._context), ut(i), null;
      case 17:
        return Tt(i.type) && Ul(), ut(i), null;
      case 19:
        if (Te(Le), d = i.memoizedState, d === null) return ut(i), null;
        if (c = (i.flags & 128) !== 0, h = d.rendering, h === null) if (c) Oo(d, !1);
        else {
          if (We !== 0 || r !== null && r.flags & 128) for (r = i.child; r !== null; ) {
            if (h = ts(r), h !== null) {
              for (i.flags |= 128, Oo(d, !1), r = h.updateQueue, r !== null && (i.updateQueue = r, i.flags |= 4), i.subtreeFlags = 0, r = u, c = i.child; c !== null; ) u = c, d = r, u.flags &= 14680066, h = u.alternate, h === null ? (u.childLanes = 0, u.lanes = d, u.child = null, u.subtreeFlags = 0, u.memoizedProps = null, u.memoizedState = null, u.updateQueue = null, u.dependencies = null, u.stateNode = null) : (u.childLanes = h.childLanes, u.lanes = h.lanes, u.child = h.child, u.subtreeFlags = 0, u.deletions = null, u.memoizedProps = h.memoizedProps, u.memoizedState = h.memoizedState, u.updateQueue = h.updateQueue, u.type = h.type, d = h.dependencies, u.dependencies = d === null ? null : { lanes: d.lanes, firstContext: d.firstContext }), c = c.sibling;
              return we(Le, Le.current & 1 | 2), i.child;
            }
            r = r.sibling;
          }
          d.tail !== null && Ye() > rc && (i.flags |= 128, c = !0, Oo(d, !1), i.lanes = 4194304);
        }
        else {
          if (!c) if (r = ts(h), r !== null) {
            if (i.flags |= 128, c = !0, r = r.updateQueue, r !== null && (i.updateQueue = r, i.flags |= 4), Oo(d, !0), d.tail === null && d.tailMode === "hidden" && !h.alternate && !Re) return ut(i), null;
          } else 2 * Ye() - d.renderingStartTime > rc && u !== 1073741824 && (i.flags |= 128, c = !0, Oo(d, !1), i.lanes = 4194304);
          d.isBackwards ? (h.sibling = i.child, i.child = h) : (r = d.last, r !== null ? r.sibling = h : i.child = h, d.last = h);
        }
        return d.tail !== null ? (i = d.tail, d.rendering = i, d.tail = i.sibling, d.renderingStartTime = Ye(), i.sibling = null, r = Le.current, we(Le, c ? r & 1 | 2 : r & 1), i) : (ut(i), null);
      case 22:
      case 23:
        return uc(), c = i.memoizedState !== null, r !== null && r.memoizedState !== null !== c && (i.flags |= 8192), c && i.mode & 1 ? Gt & 1073741824 && (ut(i), hn && i.subtreeFlags & 6 && (i.flags |= 8192)) : ut(i), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(a(156, i.tag));
  }
  var G1 = f.ReactCurrentOwner, Bt = !1;
  function gt(r, i, u, c) {
    i.child = r === null ? Np(i, null, u, c) : ki(i, r.child, u, c);
  }
  function ih(r, i, u, c, d) {
    u = u.render;
    var h = i.ref;
    return wi(i, d), c = Ia(r, i, u, c, h, d), u = Oa(), r !== null && !Bt ? (i.updateQueue = r.updateQueue, i.flags &= -2053, r.lanes &= ~d, Zn(r, i, d)) : (Re && u && ka(i), i.flags |= 1, gt(r, i, c, d), i.child);
  }
  function oh(r, i, u, c, d) {
    if (r === null) {
      var h = u.type;
      return typeof h == "function" && !cc(h) && h.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (i.tag = 15, i.type = h, lh(r, i, h, c, d)) : (r = Ns(u.type, null, c, i, i.mode, d), r.ref = i.ref, r.return = i, i.child = r);
    }
    if (h = r.child, !(r.lanes & d)) {
      var E = h.memoizedProps;
      if (u = u.compare, u = u !== null ? u : Ql, u(E, c) && r.ref === i.ref) return Zn(r, i, d);
    }
    return i.flags |= 1, r = mr(h, c), r.ref = i.ref, r.return = i, i.child = r;
  }
  function lh(r, i, u, c, d) {
    if (r !== null && Ql(r.memoizedProps, c) && r.ref === i.ref) if (Bt = !1, (r.lanes & d) !== 0) r.flags & 131072 && (Bt = !0);
    else return i.lanes = r.lanes, Zn(r, i, d);
    return Ba(r, i, u, c, d);
  }
  function sh(r, i, u) {
    var c = i.pendingProps, d = c.children, h = r !== null ? r.memoizedState : null;
    if (c.mode === "hidden") if (!(i.mode & 1)) i.memoizedState = { baseLanes: 0, cachePool: null }, we(Ri, Gt), Gt |= u;
    else if (u & 1073741824) i.memoizedState = { baseLanes: 0, cachePool: null }, c = h !== null ? h.baseLanes : u, we(Ri, Gt), Gt |= c;
    else return r = h !== null ? h.baseLanes | u : u, i.lanes = i.childLanes = 1073741824, i.memoizedState = { baseLanes: r, cachePool: null }, i.updateQueue = null, we(Ri, Gt), Gt |= r, null;
    else h !== null ? (c = h.baseLanes | u, i.memoizedState = null) : c = u, we(Ri, Gt), Gt |= c;
    return gt(r, i, d, u), i.child;
  }
  function uh(r, i) {
    var u = i.ref;
    (r === null && u !== null || r !== null && r.ref !== u) && (i.flags |= 512, i.flags |= 2097152);
  }
  function Ba(r, i, u, c, d) {
    var h = Tt(u) ? Gr : ot.current;
    return h = vi(i, h), wi(i, d), u = Ia(r, i, u, c, h, d), c = Oa(), r !== null && !Bt ? (i.updateQueue = r.updateQueue, i.flags &= -2053, r.lanes &= ~d, Zn(r, i, d)) : (Re && c && ka(i), i.flags |= 1, gt(r, i, u, d), i.child);
  }
  function ah(r, i, u, c, d) {
    if (Tt(u)) {
      var h = !0;
      Hl(i);
    } else h = !1;
    if (wi(i, d), i.stateNode === null) r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), Ep(i, u, c), Ea(i, u, c, d), c = !0;
    else if (r === null) {
      var E = i.stateNode, T = i.memoizedProps;
      E.props = T;
      var z = E.context, G = u.contextType;
      typeof G == "object" && G !== null ? G = qt(G) : (G = Tt(u) ? Gr : ot.current, G = vi(i, G));
      var J = u.getDerivedStateFromProps, ne = typeof J == "function" || typeof E.getSnapshotBeforeUpdate == "function";
      ne || typeof E.UNSAFE_componentWillReceiveProps != "function" && typeof E.componentWillReceiveProps != "function" || (T !== c || z !== G) && kp(i, E, c, G), ar = !1;
      var ee = i.memoizedState;
      E.state = ee, Jl(i, c, E, d), z = i.memoizedState, T !== c || ee !== z || kt.current || ar ? (typeof J == "function" && (xa(i, u, J, c), z = i.memoizedState), (T = ar || xp(i, u, T, c, ee, z, G)) ? (ne || typeof E.UNSAFE_componentWillMount != "function" && typeof E.componentWillMount != "function" || (typeof E.componentWillMount == "function" && E.componentWillMount(), typeof E.UNSAFE_componentWillMount == "function" && E.UNSAFE_componentWillMount()), typeof E.componentDidMount == "function" && (i.flags |= 4194308)) : (typeof E.componentDidMount == "function" && (i.flags |= 4194308), i.memoizedProps = c, i.memoizedState = z), E.props = c, E.state = z, E.context = G, c = T) : (typeof E.componentDidMount == "function" && (i.flags |= 4194308), c = !1);
    } else {
      E = i.stateNode, vp(r, i), T = i.memoizedProps, G = i.type === i.elementType ? T : gn(i.type, T), E.props = G, ne = i.pendingProps, ee = E.context, z = u.contextType, typeof z == "object" && z !== null ? z = qt(z) : (z = Tt(u) ? Gr : ot.current, z = vi(i, z));
      var ve = u.getDerivedStateFromProps;
      (J = typeof ve == "function" || typeof E.getSnapshotBeforeUpdate == "function") || typeof E.UNSAFE_componentWillReceiveProps != "function" && typeof E.componentWillReceiveProps != "function" || (T !== ne || ee !== z) && kp(i, E, c, z), ar = !1, ee = i.memoizedState, E.state = ee, Jl(i, c, E, d);
      var b = i.memoizedState;
      T !== ne || ee !== b || kt.current || ar ? (typeof ve == "function" && (xa(i, u, ve, c), b = i.memoizedState), (G = ar || xp(i, u, G, c, ee, b, z) || !1) ? (J || typeof E.UNSAFE_componentWillUpdate != "function" && typeof E.componentWillUpdate != "function" || (typeof E.componentWillUpdate == "function" && E.componentWillUpdate(
        c,
        b,
        z
      ), typeof E.UNSAFE_componentWillUpdate == "function" && E.UNSAFE_componentWillUpdate(c, b, z)), typeof E.componentDidUpdate == "function" && (i.flags |= 4), typeof E.getSnapshotBeforeUpdate == "function" && (i.flags |= 1024)) : (typeof E.componentDidUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 4), typeof E.getSnapshotBeforeUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 1024), i.memoizedProps = c, i.memoizedState = b), E.props = c, E.state = b, E.context = z, c = G) : (typeof E.componentDidUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 4), typeof E.getSnapshotBeforeUpdate != "function" || T === r.memoizedProps && ee === r.memoizedState || (i.flags |= 1024), c = !1);
    }
    return Ga(r, i, u, c, h, d);
  }
  function Ga(r, i, u, c, d, h) {
    uh(r, i);
    var E = (i.flags & 128) !== 0;
    if (!c && !E) return d && pp(i, u, !1), Zn(r, i, h);
    c = i.stateNode, G1.current = i;
    var T = E && typeof u.getDerivedStateFromError != "function" ? null : c.render();
    return i.flags |= 1, r !== null && E ? (i.child = ki(i, r.child, null, h), i.child = ki(i, null, T, h)) : gt(r, i, T, h), i.memoizedState = c.state, d && pp(i, u, !0), i.child;
  }
  function ch(r) {
    var i = r.stateNode;
    i.pendingContext ? fp(r, i.pendingContext, i.pendingContext !== i.context) : i.context && fp(r, i.context, !1), Aa(r, i.containerInfo);
  }
  function fh(r, i, u, c, d) {
    return Ei(), Ra(d), i.flags |= 256, gt(r, i, u, c), i.child;
  }
  var fs = { dehydrated: null, treeContext: null, retryLane: 0 };
  function ds(r) {
    return { baseLanes: r, cachePool: null };
  }
  function dh(r, i, u) {
    var c = i.pendingProps, d = Le.current, h = !1, E = (i.flags & 128) !== 0, T;
    if ((T = E) || (T = r !== null && r.memoizedState === null ? !1 : (d & 2) !== 0), T ? (h = !0, i.flags &= -129) : (r === null || r.memoizedState !== null) && (d |= 1), we(Le, d & 1), r === null)
      return Ca(i), r = i.memoizedState, r !== null && (r = r.dehydrated, r !== null) ? (i.mode & 1 ? oa(r) ? i.lanes = 8 : i.lanes = 1073741824 : i.lanes = 1, null) : (d = c.children, r = c.fallback, h ? (c = i.mode, h = i.child, d = { mode: "hidden", children: d }, !(c & 1) && h !== null ? (h.childLanes = 0, h.pendingProps = d) : h = Ms(d, c, 0, null), r = qr(r, c, u, null), h.return = i, r.return = i, h.sibling = r, i.child = h, i.child.memoizedState = ds(u), i.memoizedState = fs, r) : Wa(i, d));
    if (d = r.memoizedState, d !== null) {
      if (T = d.dehydrated, T !== null) {
        if (E)
          return i.flags & 256 ? (i.flags &= -257, ps(r, i, u, Error(a(422)))) : i.memoizedState !== null ? (i.child = r.child, i.flags |= 128, null) : (h = c.fallback, d = i.mode, c = Ms({ mode: "visible", children: c.children }, d, 0, null), h = qr(h, d, u, null), h.flags |= 2, c.return = i, h.return = i, c.sibling = h, i.child = c, i.mode & 1 && ki(
            i,
            r.child,
            null,
            u
          ), i.child.memoizedState = ds(u), i.memoizedState = fs, h);
        if (!(i.mode & 1)) i = ps(r, i, u, null);
        else if (oa(T)) i = ps(r, i, u, Error(a(419)));
        else if (c = (u & r.childLanes) !== 0, Bt || c) {
          if (c = He, c !== null) {
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
            c = h & (c.suspendedLanes | u) ? 0 : h, c !== 0 && c !== d.retryLane && (d.retryLane = c, nn(r, c, -1));
          }
          ac(), i = ps(r, i, u, Error(a(421)));
        } else ap(T) ? (i.flags |= 128, i.child = r.child, i = tS.bind(null, r), r1(T, i), i = null) : (u = d.treeContext, Ft && (Ht = l1(T), Ut = i, Re = !0, yn = null, ko = !1, u !== null && ($t[bt++] = Qn, $t[bt++] = Xn, $t[bt++] = Wr, Qn = u.id, Xn = u.overflow, Wr = i)), i = Wa(i, i.pendingProps.children), i.flags |= 4096);
        return i;
      }
      return h ? (c = hh(r, i, c.children, c.fallback, u), h = i.child, d = r.child.memoizedState, h.memoizedState = d === null ? ds(u) : { baseLanes: d.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, i.memoizedState = fs, c) : (u = ph(r, i, c.children, u), i.memoizedState = null, u);
    }
    return h ? (c = hh(r, i, c.children, c.fallback, u), h = i.child, d = r.child.memoizedState, h.memoizedState = d === null ? ds(u) : { baseLanes: d.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, i.memoizedState = fs, c) : (u = ph(r, i, c.children, u), i.memoizedState = null, u);
  }
  function Wa(r, i) {
    return i = Ms({ mode: "visible", children: i }, r.mode, 0, null), i.return = r, r.child = i;
  }
  function ph(r, i, u, c) {
    var d = r.child;
    return r = d.sibling, u = mr(d, { mode: "visible", children: u }), !(i.mode & 1) && (u.lanes = c), u.return = i, u.sibling = null, r !== null && (c = i.deletions, c === null ? (i.deletions = [r], i.flags |= 16) : c.push(r)), i.child = u;
  }
  function hh(r, i, u, c, d) {
    var h = i.mode;
    r = r.child;
    var E = r.sibling, T = { mode: "hidden", children: u };
    return !(h & 1) && i.child !== r ? (u = i.child, u.childLanes = 0, u.pendingProps = T, i.deletions = null) : (u = mr(r, T), u.subtreeFlags = r.subtreeFlags & 14680064), E !== null ? c = mr(E, c) : (c = qr(c, h, d, null), c.flags |= 2), c.return = i, u.return = i, u.sibling = c, i.child = u, c;
  }
  function ps(r, i, u, c) {
    return c !== null && Ra(c), ki(i, r.child, null, u), r = Wa(i, i.pendingProps.children), r.flags |= 2, i.memoizedState = null, r;
  }
  function mh(r, i, u) {
    r.lanes |= i;
    var c = r.alternate;
    c !== null && (c.lanes |= i), wa(r.return, i, u);
  }
  function Va(r, i, u, c, d) {
    var h = r.memoizedState;
    h === null ? r.memoizedState = { isBackwards: i, rendering: null, renderingStartTime: 0, last: c, tail: u, tailMode: d } : (h.isBackwards = i, h.rendering = null, h.renderingStartTime = 0, h.last = c, h.tail = u, h.tailMode = d);
  }
  function gh(r, i, u) {
    var c = i.pendingProps, d = c.revealOrder, h = c.tail;
    if (gt(r, i, c.children, u), c = Le.current, c & 2) c = c & 1 | 2, i.flags |= 128;
    else {
      if (r !== null && r.flags & 128) e: for (r = i.child; r !== null; ) {
        if (r.tag === 13) r.memoizedState !== null && mh(r, u, i);
        else if (r.tag === 19) mh(r, u, i);
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
    if (we(Le, c), !(i.mode & 1)) i.memoizedState = null;
    else switch (d) {
      case "forwards":
        for (u = i.child, d = null; u !== null; ) r = u.alternate, r !== null && ts(r) === null && (d = u), u = u.sibling;
        u = d, u === null ? (d = i.child, i.child = null) : (d = u.sibling, u.sibling = null), Va(i, !1, d, u, h);
        break;
      case "backwards":
        for (u = null, d = i.child, i.child = null; d !== null; ) {
          if (r = d.alternate, r !== null && ts(r) === null) {
            i.child = d;
            break;
          }
          r = d.sibling, d.sibling = u, u = d, d = r;
        }
        Va(i, !0, u, null, h);
        break;
      case "together":
        Va(i, !1, null, null, void 0);
        break;
      default:
        i.memoizedState = null;
    }
    return i.child;
  }
  function Zn(r, i, u) {
    if (r !== null && (i.dependencies = r.dependencies), Ai |= i.lanes, !(u & i.childLanes)) return null;
    if (r !== null && i.child !== r.child) throw Error(a(153));
    if (i.child !== null) {
      for (r = i.child, u = mr(r, r.pendingProps), i.child = u, u.return = i; r.sibling !== null; ) r = r.sibling, u = u.sibling = mr(r, r.pendingProps), u.return = i;
      u.sibling = null;
    }
    return i.child;
  }
  function W1(r, i, u) {
    switch (i.tag) {
      case 3:
        ch(i), Ei();
        break;
      case 5:
        Mp(i);
        break;
      case 1:
        Tt(i.type) && Hl(i);
        break;
      case 4:
        Aa(i, i.stateNode.containerInfo);
        break;
      case 10:
        yp(i, i.type._context, i.memoizedProps.value);
        break;
      case 13:
        var c = i.memoizedState;
        if (c !== null)
          return c.dehydrated !== null ? (we(Le, Le.current & 1), i.flags |= 128, null) : u & i.child.childLanes ? dh(r, i, u) : (we(Le, Le.current & 1), r = Zn(r, i, u), r !== null ? r.sibling : null);
        we(Le, Le.current & 1);
        break;
      case 19:
        if (c = (u & i.childLanes) !== 0, r.flags & 128) {
          if (c) return gh(
            r,
            i,
            u
          );
          i.flags |= 128;
        }
        var d = i.memoizedState;
        if (d !== null && (d.rendering = null, d.tail = null, d.lastEffect = null), we(Le, Le.current), c) break;
        return null;
      case 22:
      case 23:
        return i.lanes = 0, sh(r, i, u);
    }
    return Zn(r, i, u);
  }
  function V1(r, i) {
    switch (Ta(i), i.tag) {
      case 1:
        return Tt(i.type) && Ul(), r = i.flags, r & 65536 ? (i.flags = r & -65537 | 128, i) : null;
      case 3:
        return Pi(), Te(kt), Te(ot), Ma(), r = i.flags, r & 65536 && !(r & 128) ? (i.flags = r & -65537 | 128, i) : null;
      case 5:
        return La(i), null;
      case 13:
        if (Te(Le), r = i.memoizedState, r !== null && r.dehydrated !== null) {
          if (i.alternate === null) throw Error(a(340));
          Ei();
        }
        return r = i.flags, r & 65536 ? (i.flags = r & -65537 | 128, i) : null;
      case 19:
        return Te(Le), null;
      case 4:
        return Pi(), null;
      case 10:
        return Sa(i.type._context), null;
      case 22:
      case 23:
        return uc(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var hs = !1, Qr = !1, K1 = typeof WeakSet == "function" ? WeakSet : Set, V = null;
  function ms(r, i) {
    var u = r.ref;
    if (u !== null) if (typeof u == "function") try {
      u(null);
    } catch (c) {
      Rt(r, i, c);
    }
    else u.current = null;
  }
  function Ka(r, i, u) {
    try {
      u();
    } catch (c) {
      Rt(r, i, c);
    }
  }
  var yh = !1;
  function Q1(r, i) {
    for (U(r.containerInfo), V = i; V !== null; ) if (r = V, i = r.child, (r.subtreeFlags & 1028) !== 0 && i !== null) i.return = r, V = i;
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
              var c = u.memoizedProps, d = u.memoizedState, h = r.stateNode, E = h.getSnapshotBeforeUpdate(r.elementType === r.type ? c : gn(r.type, c), d);
              h.__reactInternalSnapshotBeforeUpdate = E;
            }
            break;
          case 3:
            hn && q0(r.stateNode.containerInfo);
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
        Rt(r, r.return, T);
      }
      if (i = r.sibling, i !== null) {
        i.return = r.return, V = i;
        break;
      }
      V = r.return;
    }
    return u = yh, yh = !1, u;
  }
  function Xr(r, i, u) {
    var c = i.updateQueue;
    if (c = c !== null ? c.lastEffect : null, c !== null) {
      var d = c = c.next;
      do {
        if ((d.tag & r) === r) {
          var h = d.destroy;
          d.destroy = void 0, h !== void 0 && Ka(i, u, h);
        }
        d = d.next;
      } while (d !== c);
    }
  }
  function Do(r, i) {
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
  function Qa(r) {
    var i = r.ref;
    if (i !== null) {
      var u = r.stateNode;
      switch (r.tag) {
        case 5:
          r = be(u);
          break;
        default:
          r = u;
      }
      typeof i == "function" ? i(r) : i.current = r;
    }
  }
  function vh(r, i, u) {
    if (Rn && typeof Rn.onCommitFiberUnmount == "function") try {
      Rn.onCommitFiberUnmount(Vl, i);
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
            var d = c, h = d.destroy;
            d = d.tag, h !== void 0 && (d & 2 || d & 4) && Ka(i, u, h), c = c.next;
          } while (c !== r);
        }
        break;
      case 1:
        if (ms(i, u), r = i.stateNode, typeof r.componentWillUnmount == "function") try {
          r.props = i.memoizedProps, r.state = i.memoizedState, r.componentWillUnmount();
        } catch (E) {
          Rt(
            i,
            u,
            E
          );
        }
        break;
      case 5:
        ms(i, u);
        break;
      case 4:
        hn ? kh(r, i, u) : Fl && Fl && (i = i.stateNode.containerInfo, u = ip(i), lp(i, u));
    }
  }
  function Sh(r, i, u) {
    for (var c = i; ; ) if (vh(r, c, u), c.child === null || hn && c.tag === 4) {
      if (c === i) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === i) return;
        c = c.return;
      }
      c.sibling.return = c.return, c = c.sibling;
    } else c.child.return = c, c = c.child;
  }
  function wh(r) {
    var i = r.alternate;
    i !== null && (r.alternate = null, wh(i)), r.child = null, r.deletions = null, r.sibling = null, r.tag === 5 && (i = r.stateNode, i !== null && A0(i)), r.stateNode = null, r.return = null, r.dependencies = null, r.memoizedProps = null, r.memoizedState = null, r.pendingProps = null, r.stateNode = null, r.updateQueue = null;
  }
  function _h(r) {
    return r.tag === 5 || r.tag === 3 || r.tag === 4;
  }
  function xh(r) {
    e: for (; ; ) {
      for (; r.sibling === null; ) {
        if (r.return === null || _h(r.return)) return null;
        r = r.return;
      }
      for (r.sibling.return = r.return, r = r.sibling; r.tag !== 5 && r.tag !== 6 && r.tag !== 18; ) {
        if (r.flags & 2 || r.child === null || r.tag === 4) continue e;
        r.child.return = r, r = r.child;
      }
      if (!(r.flags & 2)) return r.stateNode;
    }
  }
  function Eh(r) {
    if (hn) {
      e: {
        for (var i = r.return; i !== null; ) {
          if (_h(i)) break e;
          i = i.return;
        }
        throw Error(a(160));
      }
      var u = i;
      switch (u.tag) {
        case 5:
          i = u.stateNode, u.flags & 32 && (rp(i), u.flags &= -33), u = xh(r), Ya(r, u, i);
          break;
        case 3:
        case 4:
          i = u.stateNode.containerInfo, u = xh(r), Xa(r, u, i);
          break;
        default:
          throw Error(a(161));
      }
    }
  }
  function Xa(r, i, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, i ? V0(u, r, i) : U0(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (Xa(r, i, u), r = r.sibling; r !== null; ) Xa(r, i, u), r = r.sibling;
  }
  function Ya(r, i, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, i ? W0(u, r, i) : F0(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (Ya(r, i, u), r = r.sibling; r !== null; ) Ya(r, i, u), r = r.sibling;
  }
  function kh(r, i, u) {
    for (var c = i, d = !1, h, E; ; ) {
      if (!d) {
        d = c.return;
        e: for (; ; ) {
          if (d === null) throw Error(a(160));
          switch (h = d.stateNode, d.tag) {
            case 5:
              E = !1;
              break e;
            case 3:
              h = h.containerInfo, E = !0;
              break e;
            case 4:
              h = h.containerInfo, E = !0;
              break e;
          }
          d = d.return;
        }
        d = !0;
      }
      if (c.tag === 5 || c.tag === 6) Sh(r, c, u), E ? Q0(h, c.stateNode) : K0(h, c.stateNode);
      else if (c.tag === 18) E ? p1(h, c.stateNode) : d1(h, c.stateNode);
      else if (c.tag === 4) {
        if (c.child !== null) {
          h = c.stateNode.containerInfo, E = !0, c.child.return = c, c = c.child;
          continue;
        }
      } else if (vh(r, c, u), c.child !== null) {
        c.child.return = c, c = c.child;
        continue;
      }
      if (c === i) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === i) return;
        c = c.return, c.tag === 4 && (d = !1);
      }
      c.sibling.return = c.return, c = c.sibling;
    }
  }
  function Za(r, i) {
    if (hn) {
      switch (i.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          Xr(3, i, i.return), Do(3, i), Xr(5, i, i.return);
          return;
        case 1:
          return;
        case 5:
          var u = i.stateNode;
          if (u != null) {
            var c = i.memoizedProps;
            r = r !== null ? r.memoizedProps : c;
            var d = i.type, h = i.updateQueue;
            i.updateQueue = null, h !== null && G0(u, h, d, r, c, i);
          }
          return;
        case 6:
          if (i.stateNode === null) throw Error(a(162));
          u = i.memoizedProps, H0(i.stateNode, r !== null ? r.memoizedProps : u, u);
          return;
        case 3:
          Ft && r !== null && r.memoizedState.isDehydrated && cp(i.stateNode.containerInfo);
          return;
        case 12:
          return;
        case 13:
          gs(i);
          return;
        case 19:
          gs(i);
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
        Xr(3, i, i.return), Do(3, i), Xr(5, i, i.return);
        return;
      case 12:
        return;
      case 13:
        gs(i);
        return;
      case 19:
        gs(i);
        return;
      case 3:
        Ft && r !== null && r.memoizedState.isDehydrated && cp(i.stateNode.containerInfo);
        break;
      case 22:
      case 23:
        return;
    }
    e: if (Fl) {
      switch (i.tag) {
        case 1:
        case 5:
        case 6:
          break e;
        case 3:
        case 4:
          i = i.stateNode, lp(i.containerInfo, i.pendingChildren);
          break e;
      }
      throw Error(a(163));
    }
  }
  function gs(r) {
    var i = r.updateQueue;
    if (i !== null) {
      r.updateQueue = null;
      var u = r.stateNode;
      u === null && (u = r.stateNode = new K1()), i.forEach(function(c) {
        var d = nS.bind(null, r, c);
        u.has(c) || (u.add(c), c.then(d, d));
      });
    }
  }
  function X1(r, i) {
    for (V = i; V !== null; ) {
      i = V;
      var u = i.deletions;
      if (u !== null) for (var c = 0; c < u.length; c++) {
        var d = u[c];
        try {
          var h = r;
          hn ? kh(h, d, i) : Sh(h, d, i);
          var E = d.alternate;
          E !== null && (E.return = null), d.return = null;
        } catch ($) {
          Rt(d, i, $);
        }
      }
      if (u = i.child, i.subtreeFlags & 12854 && u !== null) u.return = i, V = u;
      else for (; V !== null; ) {
        i = V;
        try {
          var T = i.flags;
          if (T & 32 && hn && rp(i.stateNode), T & 512) {
            var z = i.alternate;
            if (z !== null) {
              var G = z.ref;
              G !== null && (typeof G == "function" ? G(null) : G.current = null);
            }
          }
          if (T & 8192) switch (i.tag) {
            case 13:
              if (i.memoizedState !== null) {
                var J = i.alternate;
                (J === null || J.memoizedState === null) && (nc = Ye());
              }
              break;
            case 22:
              var ne = i.memoizedState !== null, ee = i.alternate, ve = ee !== null && ee.memoizedState !== null;
              if (u = i, hn) {
                e: if (c = u, d = ne, h = null, hn) for (var b = c; ; ) {
                  if (b.tag === 5) {
                    if (h === null) {
                      h = b;
                      var at = b.stateNode;
                      d ? X0(at) : Z0(b.stateNode, b.memoizedProps);
                    }
                  } else if (b.tag === 6) {
                    if (h === null) {
                      var on = b.stateNode;
                      d ? Y0(on) : J0(on, b.memoizedProps);
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
              if (ne && !ve && u.mode & 1) {
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
                        Xr(4, c, c.return);
                        break;
                      case 1:
                        ms(c, c.return);
                        var M = c.stateNode;
                        if (typeof M.componentWillUnmount == "function") {
                          var X = c.return;
                          try {
                            M.props = c.memoizedProps, M.state = c.memoizedState, M.componentWillUnmount();
                          } catch ($) {
                            Rt(
                              c,
                              X,
                              $
                            );
                          }
                        }
                        break;
                      case 5:
                        ms(c, c.return);
                        break;
                      case 22:
                        if (c.memoizedState !== null) {
                          Ch(u);
                          continue;
                        }
                    }
                    P !== null ? (P.return = c, V = P) : Ch(u);
                  }
                  L = L.sibling;
                }
              }
          }
          switch (T & 4102) {
            case 2:
              Eh(i), i.flags &= -3;
              break;
            case 6:
              Eh(i), i.flags &= -3, Za(i.alternate, i);
              break;
            case 4096:
              i.flags &= -4097;
              break;
            case 4100:
              i.flags &= -4097, Za(i.alternate, i);
              break;
            case 4:
              Za(i.alternate, i);
          }
        } catch ($) {
          Rt(i, i.return, $);
        }
        if (u = i.sibling, u !== null) {
          u.return = i.return, V = u;
          break;
        }
        V = i.return;
      }
    }
  }
  function Y1(r, i, u) {
    V = r, Th(r);
  }
  function Th(r, i, u) {
    for (var c = (r.mode & 1) !== 0; V !== null; ) {
      var d = V, h = d.child;
      if (d.tag === 22 && c) {
        var E = d.memoizedState !== null || hs;
        if (!E) {
          var T = d.alternate, z = T !== null && T.memoizedState !== null || Qr;
          T = hs;
          var G = Qr;
          if (hs = E, (Qr = z) && !G) for (V = d; V !== null; ) E = V, z = E.child, E.tag === 22 && E.memoizedState !== null ? Rh(d) : z !== null ? (z.return = E, V = z) : Rh(d);
          for (; h !== null; ) V = h, Th(h), h = h.sibling;
          V = d, hs = T, Qr = G;
        }
        Ph(r);
      } else d.subtreeFlags & 8772 && h !== null ? (h.return = d, V = h) : Ph(r);
    }
  }
  function Ph(r) {
    for (; V !== null; ) {
      var i = V;
      if (i.flags & 8772) {
        var u = i.alternate;
        try {
          if (i.flags & 8772) switch (i.tag) {
            case 0:
            case 11:
            case 15:
              Qr || Do(5, i);
              break;
            case 1:
              var c = i.stateNode;
              if (i.flags & 4 && !Qr) if (u === null) c.componentDidMount();
              else {
                var d = i.elementType === i.type ? u.memoizedProps : gn(i.type, u.memoizedProps);
                c.componentDidUpdate(d, u.memoizedState, c.__reactInternalSnapshotBeforeUpdate);
              }
              var h = i.updateQueue;
              h !== null && wp(i, h, c);
              break;
            case 3:
              var E = i.updateQueue;
              if (E !== null) {
                if (u = null, i.child !== null) switch (i.child.tag) {
                  case 5:
                    u = be(i.child.stateNode);
                    break;
                  case 1:
                    u = i.child.stateNode;
                }
                wp(i, E, u);
              }
              break;
            case 5:
              var T = i.stateNode;
              u === null && i.flags & 4 && B0(T, i.type, i.memoizedProps, i);
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (Ft && i.memoizedState === null) {
                var z = i.alternate;
                if (z !== null) {
                  var G = z.memoizedState;
                  if (G !== null) {
                    var J = G.dehydrated;
                    J !== null && f1(J);
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
          Qr || i.flags & 512 && Qa(i);
        } catch (ne) {
          Rt(i, i.return, ne);
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
  function Ch(r) {
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
  function Rh(r) {
    for (; V !== null; ) {
      var i = V;
      try {
        switch (i.tag) {
          case 0:
          case 11:
          case 15:
            var u = i.return;
            try {
              Do(4, i);
            } catch (z) {
              Rt(i, u, z);
            }
            break;
          case 1:
            var c = i.stateNode;
            if (typeof c.componentDidMount == "function") {
              var d = i.return;
              try {
                c.componentDidMount();
              } catch (z) {
                Rt(i, d, z);
              }
            }
            var h = i.return;
            try {
              Qa(i);
            } catch (z) {
              Rt(i, h, z);
            }
            break;
          case 5:
            var E = i.return;
            try {
              Qa(i);
            } catch (z) {
              Rt(i, E, z);
            }
        }
      } catch (z) {
        Rt(i, i.return, z);
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
  var ys = 0, vs = 1, Ss = 2, ws = 3, _s = 4;
  if (typeof Symbol == "function" && Symbol.for) {
    var jo = Symbol.for;
    ys = jo("selector.component"), vs = jo("selector.has_pseudo_class"), Ss = jo("selector.role"), ws = jo("selector.test_id"), _s = jo("selector.text");
  }
  function Ja(r) {
    var i = P0(r);
    if (i != null) {
      if (typeof i.memoizedProps["data-testname"] != "string") throw Error(a(364));
      return i;
    }
    if (r = M0(r), r === null) throw Error(a(362));
    return r.stateNode.current;
  }
  function qa(r, i) {
    switch (i.$$typeof) {
      case ys:
        if (r.type === i.value) return !0;
        break;
      case vs:
        e: {
          i = i.value, r = [r, 0];
          for (var u = 0; u < r.length; ) {
            var c = r[u++], d = r[u++], h = i[d];
            if (c.tag !== 5 || !So(c)) {
              for (; h != null && qa(c, h); ) d++, h = i[d];
              if (d === i.length) {
                i = !0;
                break e;
              } else for (c = c.child; c !== null; ) r.push(c, d), c = c.sibling;
            }
          }
          i = !1;
        }
        return i;
      case Ss:
        if (r.tag === 5 && O0(r.stateNode, i.value)) return !0;
        break;
      case _s:
        if ((r.tag === 5 || r.tag === 6) && (r = I0(r), r !== null && 0 <= r.indexOf(i.value))) return !0;
        break;
      case ws:
        if (r.tag === 5 && (r = r.memoizedProps["data-testname"], typeof r == "string" && r.toLowerCase() === i.value.toLowerCase())) return !0;
        break;
      default:
        throw Error(a(365));
    }
    return !1;
  }
  function $a(r) {
    switch (r.$$typeof) {
      case ys:
        return "<" + (j(r.value) || "Unknown") + ">";
      case vs:
        return ":has(" + ($a(r) || "") + ")";
      case Ss:
        return '[role="' + r.value + '"]';
      case _s:
        return '"' + r.value + '"';
      case ws:
        return '[data-testname="' + r.value + '"]';
      default:
        throw Error(a(365));
    }
  }
  function Ah(r, i) {
    var u = [];
    r = [r, 0];
    for (var c = 0; c < r.length; ) {
      var d = r[c++], h = r[c++], E = i[h];
      if (d.tag !== 5 || !So(d)) {
        for (; E != null && qa(d, E); ) h++, E = i[h];
        if (h === i.length) u.push(d);
        else for (d = d.child; d !== null; ) r.push(d, h), d = d.sibling;
      }
    }
    return u;
  }
  function ba(r, i) {
    if (!vo) throw Error(a(363));
    r = Ja(r), r = Ah(r, i), i = [], r = Array.from(r);
    for (var u = 0; u < r.length; ) {
      var c = r[u++];
      if (c.tag === 5) So(c) || i.push(c.stateNode);
      else for (c = c.child; c !== null; ) r.push(c), c = c.sibling;
    }
    return i;
  }
  var Z1 = Math.ceil, xs = f.ReactCurrentDispatcher, ec = f.ReactCurrentOwner, je = f.ReactCurrentBatchConfig, oe = 0, He = null, Be = null, et = 0, Gt = 0, Ri = sr(0), We = 0, Fo = null, Ai = 0, Es = 0, tc = 0, Uo = null, Pt = null, nc = 0, rc = 1 / 0;
  function Li() {
    rc = Ye() + 500;
  }
  var ks = !1, ic = null, fr = null, Ts = !1, dr = null, Ps = 0, Ho = 0, oc = null, Cs = -1, Rs = 0;
  function yt() {
    return oe & 6 ? Ye() : Cs !== -1 ? Cs : Cs = Ye();
  }
  function pr(r) {
    return r.mode & 1 ? oe & 2 && et !== 0 ? et & -et : N1.transition !== null ? (Rs === 0 && (r = Bl, Bl <<= 1, !(Bl & 4194240) && (Bl = 64), Rs = r), Rs) : (r = de, r !== 0 ? r : R0()) : 1;
  }
  function nn(r, i, u) {
    if (50 < Ho) throw Ho = 0, oc = null, Error(a(185));
    var c = As(r, i);
    return c === null ? null : (Eo(c, i, u), (!(oe & 2) || c !== He) && (c === He && (!(oe & 2) && (Es |= i), We === 4 && hr(c, et)), Ct(c, u), i === 1 && oe === 0 && !(r.mode & 1) && (Li(), Kl && Ln())), c);
  }
  function As(r, i) {
    r.lanes |= i;
    var u = r.alternate;
    for (u !== null && (u.lanes |= i), u = r, r = r.return; r !== null; ) r.childLanes |= i, u = r.alternate, u !== null && (u.childLanes |= i), u = r, r = r.return;
    return u.tag === 3 ? u.stateNode : null;
  }
  function Ct(r, i) {
    var u = r.callbackNode;
    x1(r, i);
    var c = Wl(r, r === He ? et : 0);
    if (c === 0) u !== null && mp(u), r.callbackNode = null, r.callbackPriority = 0;
    else if (i = c & -c, r.callbackPriority !== i) {
      if (u != null && mp(u), i === 1) r.tag === 0 ? L1(Nh.bind(null, r)) : gp(Nh.bind(null, r)), L0 ? N0(function() {
        oe === 0 && Ln();
      }) : pa(ha, Ln), u = null;
      else {
        switch (hp(c)) {
          case 1:
            u = ha;
            break;
          case 4:
            u = P1;
            break;
          case 16:
            u = ma;
            break;
          case 536870912:
            u = C1;
            break;
          default:
            u = ma;
        }
        u = Hh(u, Lh.bind(null, r));
      }
      r.callbackPriority = i, r.callbackNode = u;
    }
  }
  function Lh(r, i) {
    if (Cs = -1, Rs = 0, oe & 6) throw Error(a(327));
    var u = r.callbackNode;
    if (Jr() && r.callbackNode !== u) return null;
    var c = Wl(r, r === He ? et : 0);
    if (c === 0) return null;
    if (c & 30 || c & r.expiredLanes || i) i = Ls(r, c);
    else {
      i = c;
      var d = oe;
      oe |= 2;
      var h = Ih();
      (He !== r || et !== i) && (Li(), Yr(r, i));
      do
        try {
          $1();
          break;
        } catch (T) {
          zh(r, T);
        }
      while (!0);
      va(), xs.current = h, oe = d, Be !== null ? i = 0 : (He = null, et = 0, i = We);
    }
    if (i !== 0) {
      if (i === 2 && (d = ca(r), d !== 0 && (c = d, i = lc(r, d))), i === 1) throw u = Fo, Yr(r, 0), hr(r, c), Ct(r, Ye()), u;
      if (i === 6) hr(r, c);
      else {
        if (d = r.current.alternate, !(c & 30) && !J1(d) && (i = Ls(r, c), i === 2 && (h = ca(r), h !== 0 && (c = h, i = lc(r, h))), i === 1)) throw u = Fo, Yr(r, 0), hr(r, c), Ct(r, Ye()), u;
        switch (r.finishedWork = d, r.finishedLanes = c, i) {
          case 0:
          case 1:
            throw Error(a(345));
          case 2:
            Zr(r, Pt);
            break;
          case 3:
            if (hr(r, c), (c & 130023424) === c && (i = nc + 500 - Ye(), 10 < i)) {
              if (Wl(r, 0) !== 0) break;
              if (d = r.suspendedLanes, (d & c) !== c) {
                yt(), r.pingedLanes |= r.suspendedLanes & d;
                break;
              }
              r.timeoutHandle = Jt(Zr.bind(null, r, Pt), i);
              break;
            }
            Zr(r, Pt);
            break;
          case 4:
            if (hr(r, c), (c & 4194240) === c) break;
            for (i = r.eventTimes, d = -1; 0 < c; ) {
              var E = 31 - mn(c);
              h = 1 << E, E = i[E], E > d && (d = E), c &= ~h;
            }
            if (c = d, c = Ye() - c, c = (120 > c ? 120 : 480 > c ? 480 : 1080 > c ? 1080 : 1920 > c ? 1920 : 3e3 > c ? 3e3 : 4320 > c ? 4320 : 1960 * Z1(c / 1960)) - c, 10 < c) {
              r.timeoutHandle = Jt(Zr.bind(null, r, Pt), c);
              break;
            }
            Zr(r, Pt);
            break;
          case 5:
            Zr(r, Pt);
            break;
          default:
            throw Error(a(329));
        }
      }
    }
    return Ct(r, Ye()), r.callbackNode === u ? Lh.bind(null, r) : null;
  }
  function lc(r, i) {
    var u = Uo;
    return r.current.memoizedState.isDehydrated && (Yr(r, i).flags |= 256), r = Ls(r, i), r !== 2 && (i = Pt, Pt = u, i !== null && sc(i)), r;
  }
  function sc(r) {
    Pt === null ? Pt = r : Pt.push.apply(Pt, r);
  }
  function J1(r) {
    for (var i = r; ; ) {
      if (i.flags & 16384) {
        var u = i.updateQueue;
        if (u !== null && (u = u.stores, u !== null)) for (var c = 0; c < u.length; c++) {
          var d = u[c], h = d.getSnapshot;
          d = d.value;
          try {
            if (!An(h(), d)) return !1;
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
  function hr(r, i) {
    for (i &= ~tc, i &= ~Es, r.suspendedLanes |= i, r.pingedLanes &= ~i, r = r.expirationTimes; 0 < i; ) {
      var u = 31 - mn(i), c = 1 << u;
      r[u] = -1, i &= ~c;
    }
  }
  function Nh(r) {
    if (oe & 6) throw Error(a(327));
    Jr();
    var i = Wl(r, 0);
    if (!(i & 1)) return Ct(r, Ye()), null;
    var u = Ls(r, i);
    if (r.tag !== 0 && u === 2) {
      var c = ca(r);
      c !== 0 && (i = c, u = lc(r, c));
    }
    if (u === 1) throw u = Fo, Yr(r, 0), hr(r, i), Ct(r, Ye()), u;
    if (u === 6) throw Error(a(345));
    return r.finishedWork = r.current.alternate, r.finishedLanes = i, Zr(r, Pt), Ct(r, Ye()), null;
  }
  function Mh(r) {
    dr !== null && dr.tag === 0 && !(oe & 6) && Jr();
    var i = oe;
    oe |= 1;
    var u = je.transition, c = de;
    try {
      if (je.transition = null, de = 1, r) return r();
    } finally {
      de = c, je.transition = u, oe = i, !(oe & 6) && Ln();
    }
  }
  function uc() {
    Gt = Ri.current, Te(Ri);
  }
  function Yr(r, i) {
    r.finishedWork = null, r.finishedLanes = 0;
    var u = r.timeoutHandle;
    if (u !== ia && (r.timeoutHandle = ia, T0(u)), Be !== null) for (u = Be.return; u !== null; ) {
      var c = u;
      switch (Ta(c), c.tag) {
        case 1:
          c = c.type.childContextTypes, c != null && Ul();
          break;
        case 3:
          Pi(), Te(kt), Te(ot), Ma();
          break;
        case 5:
          La(c);
          break;
        case 4:
          Pi();
          break;
        case 13:
          Te(Le);
          break;
        case 19:
          Te(Le);
          break;
        case 10:
          Sa(c.type._context);
          break;
        case 22:
        case 23:
          uc();
      }
      u = u.return;
    }
    if (He = r, Be = r = mr(r.current, null), et = Gt = i, We = 0, Fo = null, tc = Es = Ai = 0, Pt = Uo = null, Nn !== null) {
      for (i = 0; i < Nn.length; i++) if (u = Nn[i], c = u.interleaved, c !== null) {
        u.interleaved = null;
        var d = c.next, h = u.pending;
        if (h !== null) {
          var E = h.next;
          h.next = d, c.next = E;
        }
        u.pending = c;
      }
      Nn = null;
    }
    return r;
  }
  function zh(r, i) {
    do {
      var u = Be;
      try {
        if (va(), ns.current = us, rs) {
          for (var c = Oe.memoizedState; c !== null; ) {
            var d = c.queue;
            d !== null && (d.pending = null), c = c.next;
          }
          rs = !1;
        }
        if (Ci = 0, Ze = lt = Oe = null, Ao = !1, Lo = 0, ec.current = null, u === null || u.return === null) {
          We = 1, Fo = i, Be = null;
          break;
        }
        e: {
          var h = r, E = u.return, T = u, z = i;
          if (i = et, T.flags |= 32768, z !== null && typeof z == "object" && typeof z.then == "function") {
            var G = z, J = T, ne = J.tag;
            if (!(J.mode & 1) && (ne === 0 || ne === 11 || ne === 15)) {
              var ee = J.alternate;
              ee ? (J.updateQueue = ee.updateQueue, J.memoizedState = ee.memoizedState, J.lanes = ee.lanes) : (J.updateQueue = null, J.memoizedState = null);
            }
            var ve = eh(E);
            if (ve !== null) {
              ve.flags &= -257, th(ve, E, T, h, i), ve.mode & 1 && bp(h, G, i), i = ve, z = G;
              var b = i.updateQueue;
              if (b === null) {
                var at = /* @__PURE__ */ new Set();
                at.add(z), i.updateQueue = at;
              } else b.add(z);
              break e;
            } else {
              if (!(i & 1)) {
                bp(h, G, i), ac();
                break e;
              }
              z = Error(a(426));
            }
          } else if (Re && T.mode & 1) {
            var on = eh(E);
            if (on !== null) {
              !(on.flags & 65536) && (on.flags |= 256), th(on, E, T, h, i), Ra(z);
              break e;
            }
          }
          h = z, We !== 4 && (We = 2), Uo === null ? Uo = [h] : Uo.push(h), z = Ua(z, T), T = E;
          do {
            switch (T.tag) {
              case 3:
                T.flags |= 65536, i &= -i, T.lanes |= i;
                var L = qp(T, z, i);
                Sp(T, L);
                break e;
              case 1:
                h = z;
                var P = T.type, M = T.stateNode;
                if (!(T.flags & 128) && (typeof P.getDerivedStateFromError == "function" || M !== null && typeof M.componentDidCatch == "function" && (fr === null || !fr.has(M)))) {
                  T.flags |= 65536, i &= -i, T.lanes |= i;
                  var X = $p(T, h, i);
                  Sp(T, X);
                  break e;
                }
            }
            T = T.return;
          } while (T !== null);
        }
        Dh(u);
      } catch ($) {
        i = $, Be === u && u !== null && (Be = u = u.return);
        continue;
      }
      break;
    } while (!0);
  }
  function Ih() {
    var r = xs.current;
    return xs.current = us, r === null ? us : r;
  }
  function ac() {
    (We === 0 || We === 3 || We === 2) && (We = 4), He === null || !(Ai & 268435455) && !(Es & 268435455) || hr(He, et);
  }
  function Ls(r, i) {
    var u = oe;
    oe |= 2;
    var c = Ih();
    He === r && et === i || Yr(r, i);
    do
      try {
        q1();
        break;
      } catch (d) {
        zh(r, d);
      }
    while (!0);
    if (va(), oe = u, xs.current = c, Be !== null) throw Error(a(261));
    return He = null, et = 0, We;
  }
  function q1() {
    for (; Be !== null; ) Oh(Be);
  }
  function $1() {
    for (; Be !== null && !k1(); ) Oh(Be);
  }
  function Oh(r) {
    var i = Uh(r.alternate, r, Gt);
    r.memoizedProps = r.pendingProps, i === null ? Dh(r) : Be = i, ec.current = null;
  }
  function Dh(r) {
    var i = r;
    do {
      var u = i.alternate;
      if (r = i.return, i.flags & 32768) {
        if (u = V1(u, i), u !== null) {
          u.flags &= 32767, Be = u;
          return;
        }
        if (r !== null) r.flags |= 32768, r.subtreeFlags = 0, r.deletions = null;
        else {
          We = 6, Be = null;
          return;
        }
      } else if (u = B1(u, i, Gt), u !== null) {
        Be = u;
        return;
      }
      if (i = i.sibling, i !== null) {
        Be = i;
        return;
      }
      Be = i = r;
    } while (i !== null);
    We === 0 && (We = 5);
  }
  function Zr(r, i) {
    var u = de, c = je.transition;
    try {
      je.transition = null, de = 1, b1(r, i, u);
    } finally {
      je.transition = c, de = u;
    }
    return null;
  }
  function b1(r, i, u) {
    do
      Jr();
    while (dr !== null);
    if (oe & 6) throw Error(a(327));
    var c = r.finishedWork, d = r.finishedLanes;
    if (c === null) return null;
    if (r.finishedWork = null, r.finishedLanes = 0, c === r.current) throw Error(a(177));
    r.callbackNode = null, r.callbackPriority = 0;
    var h = c.lanes | c.childLanes;
    if (E1(r, h), r === He && (Be = He = null, et = 0), !(c.subtreeFlags & 2064) && !(c.flags & 2064) || Ts || (Ts = !0, Hh(ma, function() {
      return Jr(), null;
    })), h = (c.flags & 15990) !== 0, c.subtreeFlags & 15990 || h) {
      h = je.transition, je.transition = null;
      var E = de;
      de = 1;
      var T = oe;
      oe |= 4, ec.current = null, Q1(r, c), X1(r, c), F(r.containerInfo), r.current = c, Y1(c), T1(), oe = T, de = E, je.transition = h;
    } else r.current = c;
    if (Ts && (Ts = !1, dr = r, Ps = d), h = r.pendingLanes, h === 0 && (fr = null), R1(c.stateNode), Ct(r, Ye()), i !== null) for (u = r.onRecoverableError, c = 0; c < i.length; c++) u(i[c]);
    if (ks) throw ks = !1, r = ic, ic = null, r;
    return Ps & 1 && r.tag !== 0 && Jr(), h = r.pendingLanes, h & 1 ? r === oc ? Ho++ : (Ho = 0, oc = r) : Ho = 0, Ln(), null;
  }
  function Jr() {
    if (dr !== null) {
      var r = hp(Ps), i = je.transition, u = de;
      try {
        if (je.transition = null, de = 16 > r ? 16 : r, dr === null) var c = !1;
        else {
          if (r = dr, dr = null, Ps = 0, oe & 6) throw Error(a(331));
          var d = oe;
          for (oe |= 4, V = r.current; V !== null; ) {
            var h = V, E = h.child;
            if (V.flags & 16) {
              var T = h.deletions;
              if (T !== null) {
                for (var z = 0; z < T.length; z++) {
                  var G = T[z];
                  for (V = G; V !== null; ) {
                    var J = V;
                    switch (J.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Xr(8, J, h);
                    }
                    var ne = J.child;
                    if (ne !== null) ne.return = J, V = ne;
                    else for (; V !== null; ) {
                      J = V;
                      var ee = J.sibling, ve = J.return;
                      if (wh(J), J === G) {
                        V = null;
                        break;
                      }
                      if (ee !== null) {
                        ee.return = ve, V = ee;
                        break;
                      }
                      V = ve;
                    }
                  }
                }
                var b = h.alternate;
                if (b !== null) {
                  var at = b.child;
                  if (at !== null) {
                    b.child = null;
                    do {
                      var on = at.sibling;
                      at.sibling = null, at = on;
                    } while (at !== null);
                  }
                }
                V = h;
              }
            }
            if (h.subtreeFlags & 2064 && E !== null) E.return = h, V = E;
            else e: for (; V !== null; ) {
              if (h = V, h.flags & 2048) switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  Xr(9, h, h.return);
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
            E = V;
            var M = E.child;
            if (E.subtreeFlags & 2064 && M !== null) M.return = E, V = M;
            else e: for (E = P; V !== null; ) {
              if (T = V, T.flags & 2048) try {
                switch (T.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Do(9, T);
                }
              } catch ($) {
                Rt(T, T.return, $);
              }
              if (T === E) {
                V = null;
                break e;
              }
              var X = T.sibling;
              if (X !== null) {
                X.return = T.return, V = X;
                break e;
              }
              V = T.return;
            }
          }
          if (oe = d, Ln(), Rn && typeof Rn.onPostCommitFiberRoot == "function") try {
            Rn.onPostCommitFiberRoot(Vl, r);
          } catch {
          }
          c = !0;
        }
        return c;
      } finally {
        de = u, je.transition = i;
      }
    }
    return !1;
  }
  function jh(r, i, u) {
    i = Ua(u, i), i = qp(r, i, 1), cr(r, i), i = yt(), r = As(r, 1), r !== null && (Eo(r, 1, i), Ct(r, i));
  }
  function Rt(r, i, u) {
    if (r.tag === 3) jh(r, r, u);
    else for (; i !== null; ) {
      if (i.tag === 3) {
        jh(i, r, u);
        break;
      } else if (i.tag === 1) {
        var c = i.stateNode;
        if (typeof i.type.getDerivedStateFromError == "function" || typeof c.componentDidCatch == "function" && (fr === null || !fr.has(c))) {
          r = Ua(u, r), r = $p(i, r, 1), cr(i, r), r = yt(), i = As(i, 1), i !== null && (Eo(i, 1, r), Ct(i, r));
          break;
        }
      }
      i = i.return;
    }
  }
  function eS(r, i, u) {
    var c = r.pingCache;
    c !== null && c.delete(i), i = yt(), r.pingedLanes |= r.suspendedLanes & u, He === r && (et & u) === u && (We === 4 || We === 3 && (et & 130023424) === et && 500 > Ye() - nc ? Yr(r, 0) : tc |= u), Ct(r, i);
  }
  function Fh(r, i) {
    i === 0 && (r.mode & 1 ? (i = Gl, Gl <<= 1, !(Gl & 130023424) && (Gl = 4194304)) : i = 1);
    var u = yt();
    r = As(r, i), r !== null && (Eo(r, i, u), Ct(r, u));
  }
  function tS(r) {
    var i = r.memoizedState, u = 0;
    i !== null && (u = i.retryLane), Fh(r, u);
  }
  function nS(r, i) {
    var u = 0;
    switch (r.tag) {
      case 13:
        var c = r.stateNode, d = r.memoizedState;
        d !== null && (u = d.retryLane);
        break;
      case 19:
        c = r.stateNode;
        break;
      default:
        throw Error(a(314));
    }
    c !== null && c.delete(i), Fh(r, u);
  }
  var Uh;
  Uh = function(r, i, u) {
    if (r !== null) if (r.memoizedProps !== i.pendingProps || kt.current) Bt = !0;
    else {
      if (!(r.lanes & u) && !(i.flags & 128)) return Bt = !1, W1(r, i, u);
      Bt = !!(r.flags & 131072);
    }
    else Bt = !1, Re && i.flags & 1048576 && Tp(i, bl, i.index);
    switch (i.lanes = 0, i.tag) {
      case 2:
        var c = i.type;
        r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), r = i.pendingProps;
        var d = vi(i, ot.current);
        wi(i, u), d = Ia(null, i, c, r, d, u);
        var h = Oa();
        return i.flags |= 1, typeof d == "object" && d !== null && typeof d.render == "function" && d.$$typeof === void 0 ? (i.tag = 1, i.memoizedState = null, i.updateQueue = null, Tt(c) ? (h = !0, Hl(i)) : h = !1, i.memoizedState = d.state !== null && d.state !== void 0 ? d.state : null, _a(i), d.updater = ql, i.stateNode = d, d._reactInternals = i, Ea(i, c, r, u), i = Ga(null, i, c, !0, h, u)) : (i.tag = 0, Re && h && ka(i), gt(null, i, d, u), i = i.child), i;
      case 16:
        c = i.elementType;
        e: {
          switch (r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), r = i.pendingProps, d = c._init, c = d(c._payload), i.type = c, d = i.tag = iS(c), r = gn(c, r), d) {
            case 0:
              i = Ba(null, i, c, r, u);
              break e;
            case 1:
              i = ah(
                null,
                i,
                c,
                r,
                u
              );
              break e;
            case 11:
              i = ih(null, i, c, r, u);
              break e;
            case 14:
              i = oh(null, i, c, gn(c.type, r), u);
              break e;
          }
          throw Error(a(306, c, ""));
        }
        return i;
      case 0:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : gn(c, d), Ba(r, i, c, d, u);
      case 1:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : gn(c, d), ah(r, i, c, d, u);
      case 3:
        e: {
          if (ch(i), r === null) throw Error(a(387));
          c = i.pendingProps, h = i.memoizedState, d = h.element, vp(r, i), Jl(i, c, null, u);
          var E = i.memoizedState;
          if (c = E.element, Ft && h.isDehydrated) if (h = {
            element: c,
            isDehydrated: !1,
            cache: E.cache,
            transitions: E.transitions
          }, i.updateQueue.baseState = h, i.memoizedState = h, i.flags & 256) {
            d = Error(a(423)), i = fh(r, i, c, u, d);
            break e;
          } else if (c !== d) {
            d = Error(a(424)), i = fh(r, i, c, u, d);
            break e;
          } else for (Ft && (Ht = o1(i.stateNode.containerInfo), Ut = i, Re = !0, yn = null, ko = !1), u = Np(i, null, c, u), i.child = u; u; ) u.flags = u.flags & -3 | 4096, u = u.sibling;
          else {
            if (Ei(), c === d) {
              i = Zn(r, i, u);
              break e;
            }
            gt(r, i, c, u);
          }
          i = i.child;
        }
        return i;
      case 5:
        return Mp(i), r === null && Ca(i), c = i.type, d = i.pendingProps, h = r !== null ? r.memoizedProps : null, E = d.children, it(c, d) ? E = null : h !== null && it(c, h) && (i.flags |= 32), uh(r, i), gt(r, i, E, u), i.child;
      case 6:
        return r === null && Ca(i), null;
      case 13:
        return dh(r, i, u);
      case 4:
        return Aa(i, i.stateNode.containerInfo), c = i.pendingProps, r === null ? i.child = ki(i, null, c, u) : gt(r, i, c, u), i.child;
      case 11:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : gn(c, d), ih(r, i, c, d, u);
      case 7:
        return gt(r, i, i.pendingProps, u), i.child;
      case 8:
        return gt(r, i, i.pendingProps.children, u), i.child;
      case 12:
        return gt(r, i, i.pendingProps.children, u), i.child;
      case 10:
        e: {
          if (c = i.type._context, d = i.pendingProps, h = i.memoizedProps, E = d.value, yp(i, c, E), h !== null) if (An(h.value, E)) {
            if (h.children === d.children && !kt.current) {
              i = Zn(r, i, u);
              break e;
            }
          } else for (h = i.child, h !== null && (h.return = i); h !== null; ) {
            var T = h.dependencies;
            if (T !== null) {
              E = h.child;
              for (var z = T.firstContext; z !== null; ) {
                if (z.context === c) {
                  if (h.tag === 1) {
                    z = Kn(-1, u & -u), z.tag = 2;
                    var G = h.updateQueue;
                    if (G !== null) {
                      G = G.shared;
                      var J = G.pending;
                      J === null ? z.next = z : (z.next = J.next, J.next = z), G.pending = z;
                    }
                  }
                  h.lanes |= u, z = h.alternate, z !== null && (z.lanes |= u), wa(h.return, u, i), T.lanes |= u;
                  break;
                }
                z = z.next;
              }
            } else if (h.tag === 10) E = h.type === i.type ? null : h.child;
            else if (h.tag === 18) {
              if (E = h.return, E === null) throw Error(a(341));
              E.lanes |= u, T = E.alternate, T !== null && (T.lanes |= u), wa(E, u, i), E = h.sibling;
            } else E = h.child;
            if (E !== null) E.return = h;
            else for (E = h; E !== null; ) {
              if (E === i) {
                E = null;
                break;
              }
              if (h = E.sibling, h !== null) {
                h.return = E.return, E = h;
                break;
              }
              E = E.return;
            }
            h = E;
          }
          gt(r, i, d.children, u), i = i.child;
        }
        return i;
      case 9:
        return d = i.type, c = i.pendingProps.children, wi(i, u), d = qt(d), c = c(d), i.flags |= 1, gt(r, i, c, u), i.child;
      case 14:
        return c = i.type, d = gn(c, i.pendingProps), d = gn(c.type, d), oh(r, i, c, d, u);
      case 15:
        return lh(r, i, i.type, i.pendingProps, u);
      case 17:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : gn(c, d), r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), i.tag = 1, Tt(c) ? (r = !0, Hl(i)) : r = !1, wi(i, u), Ep(i, c, d), Ea(i, c, d, u), Ga(null, i, c, !0, r, u);
      case 19:
        return gh(r, i, u);
      case 22:
        return sh(r, i, u);
    }
    throw Error(a(156, i.tag));
  };
  function Hh(r, i) {
    return pa(r, i);
  }
  function rS(r, i, u, c) {
    this.tag = r, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = i, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = c, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function rn(r, i, u, c) {
    return new rS(r, i, u, c);
  }
  function cc(r) {
    return r = r.prototype, !(!r || !r.isReactComponent);
  }
  function iS(r) {
    if (typeof r == "function") return cc(r) ? 1 : 0;
    if (r != null) {
      if (r = r.$$typeof, r === R) return 11;
      if (r === S) return 14;
    }
    return 2;
  }
  function mr(r, i) {
    var u = r.alternate;
    return u === null ? (u = rn(r.tag, i, r.key, r.mode), u.elementType = r.elementType, u.type = r.type, u.stateNode = r.stateNode, u.alternate = r, r.alternate = u) : (u.pendingProps = i, u.type = r.type, u.flags = 0, u.subtreeFlags = 0, u.deletions = null), u.flags = r.flags & 14680064, u.childLanes = r.childLanes, u.lanes = r.lanes, u.child = r.child, u.memoizedProps = r.memoizedProps, u.memoizedState = r.memoizedState, u.updateQueue = r.updateQueue, i = r.dependencies, u.dependencies = i === null ? null : { lanes: i.lanes, firstContext: i.firstContext }, u.sibling = r.sibling, u.index = r.index, u.ref = r.ref, u;
  }
  function Ns(r, i, u, c, d, h) {
    var E = 2;
    if (c = r, typeof r == "function") cc(r) && (E = 1);
    else if (typeof r == "string") E = 5;
    else e: switch (r) {
      case g:
        return qr(u.children, d, h, i);
      case y:
        E = 8, d |= 8;
        break;
      case v:
        return r = rn(12, u, i, d | 2), r.elementType = v, r.lanes = h, r;
      case A:
        return r = rn(13, u, i, d), r.elementType = A, r.lanes = h, r;
      case w:
        return r = rn(19, u, i, d), r.elementType = w, r.lanes = h, r;
      case C:
        return Ms(u, d, h, i);
      default:
        if (typeof r == "object" && r !== null) switch (r.$$typeof) {
          case _:
            E = 10;
            break e;
          case k:
            E = 9;
            break e;
          case R:
            E = 11;
            break e;
          case S:
            E = 14;
            break e;
          case x:
            E = 16, c = null;
            break e;
        }
        throw Error(a(130, r == null ? r : typeof r, ""));
    }
    return i = rn(E, u, i, d), i.elementType = r, i.type = c, i.lanes = h, i;
  }
  function qr(r, i, u, c) {
    return r = rn(7, r, c, i), r.lanes = u, r;
  }
  function Ms(r, i, u, c) {
    return r = rn(22, r, c, i), r.elementType = C, r.lanes = u, r.stateNode = {}, r;
  }
  function fc(r, i, u) {
    return r = rn(6, r, null, i), r.lanes = u, r;
  }
  function dc(r, i, u) {
    return i = rn(4, r.children !== null ? r.children : [], r.key, i), i.lanes = u, i.stateNode = { containerInfo: r.containerInfo, pendingChildren: null, implementation: r.implementation }, i;
  }
  function oS(r, i, u, c, d) {
    this.tag = i, this.containerInfo = r, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = ia, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = fa(0), this.expirationTimes = fa(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = fa(0), this.identifierPrefix = c, this.onRecoverableError = d, Ft && (this.mutableSourceEagerHydrationData = null);
  }
  function Bh(r, i, u, c, d, h, E, T, z) {
    return r = new oS(r, i, u, T, z), i === 1 ? (i = 1, h === !0 && (i |= 8)) : i = 0, h = rn(3, null, null, i), r.current = h, h.stateNode = r, h.memoizedState = { element: c, isDehydrated: u, cache: null, transitions: null }, _a(h), r;
  }
  function Gh(r) {
    if (!r) return ur;
    r = r._reactInternals;
    e: {
      if (q(r) !== r || r.tag !== 1) throw Error(a(170));
      var i = r;
      do {
        switch (i.tag) {
          case 3:
            i = i.stateNode.context;
            break e;
          case 1:
            if (Tt(i.type)) {
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
      if (Tt(u)) return dp(r, u, i);
    }
    return i;
  }
  function Wh(r) {
    var i = r._reactInternals;
    if (i === void 0)
      throw typeof r.render == "function" ? Error(a(188)) : (r = Object.keys(r).join(","), Error(a(268, r)));
    return r = le(i), r === null ? null : r.stateNode;
  }
  function Vh(r, i) {
    if (r = r.memoizedState, r !== null && r.dehydrated !== null) {
      var u = r.retryLane;
      r.retryLane = u !== 0 && u < i ? u : i;
    }
  }
  function pc(r, i) {
    Vh(r, i), (r = r.alternate) && Vh(r, i);
  }
  function lS(r) {
    return r = le(r), r === null ? null : r.stateNode;
  }
  function sS() {
    return null;
  }
  return n.attemptContinuousHydration = function(r) {
    if (r.tag === 13) {
      var i = yt();
      nn(r, 134217728, i), pc(r, 134217728);
    }
  }, n.attemptHydrationAtCurrentPriority = function(r) {
    if (r.tag === 13) {
      var i = yt(), u = pr(r);
      nn(r, u, i), pc(r, u);
    }
  }, n.attemptSynchronousHydration = function(r) {
    switch (r.tag) {
      case 3:
        var i = r.stateNode;
        if (i.current.memoizedState.isDehydrated) {
          var u = xo(i.pendingLanes);
          u !== 0 && (da(i, u | 1), Ct(i, Ye()), !(oe & 6) && (Li(), Ln()));
        }
        break;
      case 13:
        var c = yt();
        Mh(function() {
          return nn(r, 1, c);
        }), pc(r, 1);
    }
  }, n.batchedUpdates = function(r, i) {
    var u = oe;
    oe |= 1;
    try {
      return r(i);
    } finally {
      oe = u, oe === 0 && (Li(), Kl && Ln());
    }
  }, n.createComponentSelector = function(r) {
    return { $$typeof: ys, value: r };
  }, n.createContainer = function(r, i, u, c, d, h, E) {
    return Bh(r, i, !1, null, u, c, d, h, E);
  }, n.createHasPseudoClassSelector = function(r) {
    return { $$typeof: vs, value: r };
  }, n.createHydrationContainer = function(r, i, u, c, d, h, E, T, z) {
    return r = Bh(u, c, !0, r, d, h, E, T, z), r.context = Gh(null), u = r.current, c = yt(), d = pr(u), h = Kn(c, d), h.callback = i ?? null, cr(u, h), r.current.lanes = d, Eo(r, d, c), Ct(r, c), r;
  }, n.createPortal = function(r, i, u) {
    var c = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: m, key: c == null ? null : "" + c, children: r, containerInfo: i, implementation: u };
  }, n.createRoleSelector = function(r) {
    return { $$typeof: Ss, value: r };
  }, n.createTestNameSelector = function(r) {
    return { $$typeof: ws, value: r };
  }, n.createTextSelector = function(r) {
    return { $$typeof: _s, value: r };
  }, n.deferredUpdates = function(r) {
    var i = de, u = je.transition;
    try {
      return je.transition = null, de = 16, r();
    } finally {
      de = i, je.transition = u;
    }
  }, n.discreteUpdates = function(r, i, u, c, d) {
    var h = de, E = je.transition;
    try {
      return je.transition = null, de = 1, r(i, u, c, d);
    } finally {
      de = h, je.transition = E, oe === 0 && Li();
    }
  }, n.findAllNodes = ba, n.findBoundingRects = function(r, i) {
    if (!vo) throw Error(a(363));
    i = ba(r, i), r = [];
    for (var u = 0; u < i.length; u++) r.push(z0(i[u]));
    for (i = r.length - 1; 0 < i; i--) {
      u = r[i];
      for (var c = u.x, d = c + u.width, h = u.y, E = h + u.height, T = i - 1; 0 <= T; T--) if (i !== T) {
        var z = r[T], G = z.x, J = G + z.width, ne = z.y, ee = ne + z.height;
        if (c >= G && h >= ne && d <= J && E <= ee) {
          r.splice(i, 1);
          break;
        } else if (c !== G || u.width !== z.width || ee < h || ne > E) {
          if (!(h !== ne || u.height !== z.height || J < c || G > d)) {
            G > c && (z.width += G - c, z.x = c), J < d && (z.width = d - G), r.splice(i, 1);
            break;
          }
        } else {
          ne > h && (z.height += ne - h, z.y = h), ee < E && (z.height = E - ne), r.splice(i, 1);
          break;
        }
      }
    }
    return r;
  }, n.findHostInstance = Wh, n.findHostInstanceWithNoPortals = function(r) {
    return r = K(r), r = r !== null ? xt(r) : null, r === null ? null : r.stateNode;
  }, n.findHostInstanceWithWarning = function(r) {
    return Wh(r);
  }, n.flushControlled = function(r) {
    var i = oe;
    oe |= 1;
    var u = je.transition, c = de;
    try {
      je.transition = null, de = 1, r();
    } finally {
      de = c, je.transition = u, oe = i, oe === 0 && (Li(), Ln());
    }
  }, n.flushPassiveEffects = Jr, n.flushSync = Mh, n.focusWithin = function(r, i) {
    if (!vo) throw Error(a(363));
    for (r = Ja(r), i = Ah(r, i), i = Array.from(i), r = 0; r < i.length; ) {
      var u = i[r++];
      if (!So(u)) {
        if (u.tag === 5 && D0(u.stateNode)) return !0;
        for (u = u.child; u !== null; ) i.push(u), u = u.sibling;
      }
    }
    return !1;
  }, n.getCurrentUpdatePriority = function() {
    return de;
  }, n.getFindAllNodesFailureDescription = function(r, i) {
    if (!vo) throw Error(a(363));
    var u = 0, c = [];
    r = [Ja(r), 0];
    for (var d = 0; d < r.length; ) {
      var h = r[d++], E = r[d++], T = i[E];
      if ((h.tag !== 5 || !So(h)) && (qa(h, T) && (c.push($a(T)), E++, E > u && (u = E)), E < i.length)) for (h = h.child; h !== null; ) r.push(h, E), h = h.sibling;
    }
    if (u < i.length) {
      for (r = []; u < i.length; u++) r.push($a(i[u]));
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
        return be(r.child.stateNode);
      default:
        return r.child.stateNode;
    }
  }, n.injectIntoDevTools = function(r) {
    if (r = { bundleType: r.bundleType, version: r.version, rendererPackageName: r.rendererPackageName, rendererConfig: r.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: f.ReactCurrentDispatcher, findHostInstanceByFiber: lS, findFiberByHostInstance: r.findFiberByHostInstance || sS, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.0.0-fc46dba67-20220329" }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") r = !1;
    else {
      var i = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (i.isDisabled || !i.supportsFiber) r = !0;
      else {
        try {
          Vl = i.inject(r), Rn = i;
        } catch {
        }
        r = !!i.checkDCE;
      }
    }
    return r;
  }, n.isAlreadyRendering = function() {
    return !1;
  }, n.observeVisibleRects = function(r, i, u, c) {
    if (!vo) throw Error(a(363));
    r = ba(r, i);
    var d = j0(r, u, c).disconnect;
    return { disconnect: function() {
      d();
    } };
  }, n.registerMutableSourceForHydration = function(r, i) {
    var u = i._getVersion;
    u = u(i._source), r.mutableSourceEagerHydrationData == null ? r.mutableSourceEagerHydrationData = [i, u] : r.mutableSourceEagerHydrationData.push(i, u);
  }, n.runWithPriority = function(r, i) {
    var u = de;
    try {
      return de = r, i();
    } finally {
      de = u;
    }
  }, n.shouldError = function() {
    return null;
  }, n.shouldSuspend = function() {
    return !1;
  }, n.updateContainer = function(r, i, u, c) {
    var d = i.current, h = yt(), E = pr(d);
    return u = Gh(u), i.context === null ? i.context = u : i.pendingContext = u, i = Kn(h, E), i.payload = { element: r }, c = c === void 0 ? null : c, c !== null && (i.callback = c), cr(d, i), r = nn(d, E, h), r !== null && Zl(r, d, E), E;
  }, n;
};
t0.exports = Cx;
var Rx = t0.exports;
const Ax = /* @__PURE__ */ XS(Rx), bd = {}, Lx = (e) => void Object.assign(bd, e);
function Nx(e, t) {
  function n(g, {
    args: y = [],
    attach: v,
    ..._
  }, k) {
    let R = `${g[0].toUpperCase()}${g.slice(1)}`, A;
    if (g === "primitive") {
      if (_.object === void 0) throw new Error("R3F: Primitives without 'object' are invalid!");
      const w = _.object;
      A = Oi(w, {
        type: g,
        root: k,
        attach: v,
        primitive: !0
      });
    } else {
      const w = bd[R];
      if (!w)
        throw new Error(`R3F: ${R} is not part of the THREE namespace! Did you forget to extend? See: https://docs.pmnd.rs/react-three-fiber/api/objects#using-3rd-party-objects-declaratively`);
      if (!Array.isArray(y)) throw new Error("R3F: The args prop must be an array!");
      A = Oi(new w(...y), {
        type: g,
        root: k,
        attach: v,
        // Save args in case we need to reconstruct later for HMR
        memoizedProps: {
          args: y
        }
      });
    }
    return A.__r3f.attach === void 0 && (A.isBufferGeometry ? A.__r3f.attach = "geometry" : A.isMaterial && (A.__r3f.attach = "material")), R !== "inject" && Vc(A, _), A;
  }
  function o(g, y) {
    let v = !1;
    if (y) {
      var _, k;
      (_ = y.__r3f) != null && _.attach ? Wc(g, y, y.__r3f.attach) : y.isObject3D && g.isObject3D && (g.add(y), v = !0), v || (k = g.__r3f) == null || k.objects.push(y), y.__r3f || Oi(y, {}), y.__r3f.parent = g, nd(y), Di(y);
    }
  }
  function l(g, y, v) {
    let _ = !1;
    if (y) {
      var k, R;
      if ((k = y.__r3f) != null && k.attach)
        Wc(g, y, y.__r3f.attach);
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
      _ || (R = g.__r3f) == null || R.objects.push(y), y.__r3f || Oi(y, {}), y.__r3f.parent = g, nd(y), Di(y);
    }
  }
  function s(g, y, v = !1) {
    g && [...g].forEach((_) => a(y, _, v));
  }
  function a(g, y, v) {
    if (y) {
      var _, k, R;
      if (y.__r3f && (y.__r3f.parent = null), (_ = g.__r3f) != null && _.objects && (g.__r3f.objects = g.__r3f.objects.filter((C) => C !== y)), (k = y.__r3f) != null && k.attach)
        cg(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        var A;
        g.remove(y), (A = y.__r3f) != null && A.root && Ux(du(y), y);
      }
      const S = (R = y.__r3f) == null ? void 0 : R.primitive, x = !S && (v === void 0 ? y.dispose !== null : v);
      if (!S) {
        var w;
        s((w = y.__r3f) == null ? void 0 : w.objects, y, x), s(y.children, y, x);
      }
      if (delete y.__r3f, x && y.dispose && y.type !== "Scene") {
        const C = () => {
          try {
            y.dispose();
          } catch {
          }
        };
        typeof IS_REACT_ACT_ENVIRONMENT > "u" ? ed.unstable_scheduleCallback(ed.unstable_IdlePriority, C) : C();
      }
      Di(g);
    }
  }
  function f(g, y, v, _) {
    var k;
    const R = (k = g.__r3f) == null ? void 0 : k.parent;
    if (!R) return;
    const A = n(y, v, g.__r3f.root);
    if (g.children) {
      for (const w of g.children)
        w.__r3f && o(A, w);
      g.children = g.children.filter((w) => !w.__r3f);
    }
    g.__r3f.objects.forEach((w) => o(A, w)), g.__r3f.objects = [], g.__r3f.autoRemovedBeforeAppend || a(R, g), A.parent && (A.__r3f.autoRemovedBeforeAppend = !0), o(R, A), A.raycast && A.__r3f.eventCount && du(A).getState().internal.interaction.push(A), [_, _.alternate].forEach((w) => {
      w !== null && (w.stateNode = A, w.ref && (typeof w.ref == "function" ? w.ref(A) : w.ref.current = A));
    });
  }
  const p = () => {
  };
  return {
    reconciler: Ax({
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
            args: x = [],
            children: C,
            ...I
          } = v;
          if (!Array.isArray(A)) throw new Error("R3F: the args prop must be an array!");
          if (A.some((j, B) => j !== x[B])) return [!0];
          const D = c0(g, S, I, !0);
          return D.changes.length ? [!1, D] : null;
        }
      },
      commitUpdate(g, [y, v], _, k, R, A) {
        y ? f(g, _, R, A) : Vc(g, v);
      },
      commitMount(g, y, v, _) {
        var k;
        const R = (k = g.__r3f) != null ? k : {};
        g.raycast && R.handlers && R.eventCount && du(g).getState().internal.interaction.push(g);
      },
      getPublicInstance: (g) => g,
      prepareForCommit: () => null,
      preparePortalMount: (g) => Oi(g.getState().scene),
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
        v && _ && cg(_, g, v), g.isObject3D && (g.visible = !1), Di(g);
      },
      unhideInstance(g, y) {
        var v;
        const {
          attach: _,
          parent: k
        } = (v = g.__r3f) != null ? v : {};
        _ && k && Wc(k, g, _), (g.isObject3D && y.visible == null || y.visible) && (g.visible = !0), Di(g);
      },
      createTextInstance: p,
      hideTextInstance: p,
      unhideTextInstance: p,
      // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r916356874
      // @ts-expect-error
      getCurrentEventPriority: () => t ? t() : Ji.DefaultEventPriority,
      beforeActiveInstanceBlur: () => {
      },
      afterActiveInstanceBlur: () => {
      },
      detachDeletedInstance: () => {
      },
      now: typeof performance < "u" && Ee.fun(performance.now) ? performance.now : Ee.fun(Date.now) ? Date.now : () => 0,
      // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r920883503
      scheduleTimeout: Ee.fun(setTimeout) ? setTimeout : void 0,
      cancelTimeout: Ee.fun(clearTimeout) ? clearTimeout : void 0
    }),
    applyProps: Vc
  };
}
var lg, sg;
const Gc = (e) => "colorSpace" in e || "outputColorSpace" in e, i0 = () => {
  var e;
  return (e = bd.ColorManagement) != null ? e : null;
}, o0 = (e) => e && e.isOrthographicCamera, Mx = (e) => e && e.hasOwnProperty("current"), Dl = typeof window < "u" && ((lg = window.document) != null && lg.createElement || ((sg = window.navigator) == null ? void 0 : sg.product) === "ReactNative") ? Q.useLayoutEffect : Q.useEffect;
function l0(e) {
  const t = Q.useRef(e);
  return Dl(() => void (t.current = e), [e]), t;
}
function zx({
  set: e
}) {
  return Dl(() => (e(new Promise(() => null)), () => e(!1)), [e]), null;
}
class s0 extends Q.Component {
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
s0.getDerivedStateFromError = () => ({
  error: !0
});
const u0 = "__default", ug = /* @__PURE__ */ new Map(), Ix = (e) => e && !!e.memoized && !!e.changes;
function a0(e) {
  var t;
  const n = typeof window < "u" ? (t = window.devicePixelRatio) != null ? t : 2 : 1;
  return Array.isArray(e) ? Math.min(Math.max(e[0], n), e[1]) : e;
}
const Zo = (e) => {
  var t;
  return (t = e.__r3f) == null ? void 0 : t.root.getState();
};
function du(e) {
  let t = e.__r3f.root;
  for (; t.getState().previousRoot; ) t = t.getState().previousRoot;
  return t;
}
const Ee = {
  obj: (e) => e === Object(e) && !Ee.arr(e) && typeof e != "function",
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
    if (Ee.str(e) || Ee.num(e) || Ee.boo(e)) return e === t;
    const s = Ee.obj(e);
    if (s && o === "reference") return e === t;
    const a = Ee.arr(e);
    if (a && n === "reference") return e === t;
    if ((a || s) && e === t) return !0;
    let f;
    for (f in e) if (!(f in t)) return !1;
    if (s && n === "shallow" && o === "shallow") {
      for (f in l ? t : e) if (!Ee.equ(e[f], t[f], {
        strict: l,
        objects: "reference"
      })) return !1;
    } else
      for (f in l ? t : e) if (e[f] !== t[f]) return !1;
    if (Ee.und(f)) {
      if (a && e.length === 0 && t.length === 0 || s && Object.keys(e).length === 0 && Object.keys(t).length === 0) return !0;
      if (e !== t) return !1;
    }
    return !0;
  }
};
function Ox(e) {
  const t = {
    nodes: {},
    materials: {}
  };
  return e && e.traverse((n) => {
    n.name && (t.nodes[n.name] = n), n.material && !t.materials[n.material.name] && (t.materials[n.material.name] = n.material);
  }), t;
}
function Dx(e) {
  e.dispose && e.type !== "Scene" && e.dispose();
  for (const t in e)
    t.dispose == null || t.dispose(), delete e[t];
}
function Oi(e, t) {
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
function td(e, t) {
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
const ag = /-\d+$/;
function Wc(e, t, n) {
  if (Ee.str(n)) {
    if (ag.test(n)) {
      const s = n.replace(ag, ""), {
        target: a,
        key: f
      } = td(e, s);
      Array.isArray(a[f]) || (a[f] = []);
    }
    const {
      target: o,
      key: l
    } = td(e, n);
    t.__r3f.previousAttach = o[l], o[l] = t;
  } else t.__r3f.previousAttach = n(e, t);
}
function cg(e, t, n) {
  var o, l;
  if (Ee.str(n)) {
    const {
      target: s,
      key: a
    } = td(e, n), f = t.__r3f.previousAttach;
    f === void 0 ? delete s[a] : s[a] = f;
  } else (o = t.__r3f) == null || o.previousAttach == null || o.previousAttach(e, t);
  (l = t.__r3f) == null || delete l.previousAttach;
}
function c0(e, {
  children: t,
  key: n,
  ref: o,
  ...l
}, {
  children: s,
  key: a,
  ref: f,
  ...p
} = {}, m = !1) {
  const g = e.__r3f, y = Object.entries(l), v = [];
  if (m) {
    const k = Object.keys(p);
    for (let R = 0; R < k.length; R++)
      l.hasOwnProperty(k[R]) || y.unshift([k[R], u0 + "remove"]);
  }
  y.forEach(([k, R]) => {
    var A;
    if ((A = e.__r3f) != null && A.primitive && k === "object" || Ee.equ(R, p[k])) return;
    if (/^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/.test(k)) return v.push([k, R, !0, []]);
    let w = [];
    k.includes("-") && (w = k.split("-")), v.push([k, R, !1, w]);
    for (const S in l) {
      const x = l[S];
      S.startsWith(`${k}-`) && v.push([S, x, !1, S.split("-")]);
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
function Vc(e, t) {
  var n;
  const o = e.__r3f, l = o == null ? void 0 : o.root, s = l == null || l.getState == null ? void 0 : l.getState(), {
    memoized: a,
    changes: f
  } = Ix(t) ? t : c0(e, t), p = o == null ? void 0 : o.eventCount;
  e.__r3f && (e.__r3f.memoizedProps = a);
  for (let v = 0; v < f.length; v++) {
    let [_, k, R, A] = f[v];
    if (Gc(e)) {
      const C = "srgb", I = "srgb-linear";
      _ === "encoding" ? (_ = "colorSpace", k = k === 3001 ? C : I) : _ === "outputEncoding" && (_ = "outputColorSpace", k = k === 3001 ? C : I);
    }
    let w = e, S = w[_];
    if (A.length && (S = A.reduce((x, C) => x[C], e), !(S && S.set))) {
      const [x, ...C] = A.reverse();
      w = C.reverse().reduce((I, D) => I[D], e), _ = x;
    }
    if (k === u0 + "remove")
      if (w.constructor) {
        let x = ug.get(w.constructor);
        x || (x = new w.constructor(), ug.set(w.constructor, x)), k = x[_];
      } else
        k = 0;
    if (R && o)
      k ? o.handlers[_] = k : delete o.handlers[_], o.eventCount = Object.keys(o.handlers).length;
    else if (S && S.set && (S.copy || S instanceof ce.Layers)) {
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
        const x = (m = S) == null ? void 0 : m.isColor;
        !x && S.setScalar ? S.setScalar(k) : S instanceof ce.Layers && k instanceof ce.Layers ? S.mask = k.mask : S.set(k), !i0() && s && !s.linear && x && S.convertSRGBToLinear();
      }
    } else {
      var g;
      if (w[_] = k, (g = w[_]) != null && g.isTexture && // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
      w[_].format === ce.RGBAFormat && w[_].type === ce.UnsignedByteType && s) {
        const x = w[_];
        Gc(x) && Gc(s.gl) ? x.colorSpace = s.gl.outputColorSpace : x.encoding = s.gl.outputEncoding;
      }
    }
    Di(e);
  }
  if (o && o.parent && e.raycast && p !== o.eventCount) {
    const v = du(e).getState().internal, _ = v.interaction.indexOf(e);
    _ > -1 && v.interaction.splice(_, 1), o.eventCount && v.interaction.push(e);
  }
  return !(f.length === 1 && f[0][0] === "onUpdate") && f.length && (n = e.__r3f) != null && n.parent && nd(e), e;
}
function Di(e) {
  var t, n;
  const o = (t = e.__r3f) == null || (n = t.root) == null || n.getState == null ? void 0 : n.getState();
  o && o.internal.frames === 0 && o.invalidate();
}
function nd(e) {
  e.onUpdate == null || e.onUpdate(e);
}
function jx(e, t) {
  e.manual || (o0(e) ? (e.left = t.width / -2, e.right = t.width / 2, e.top = t.height / 2, e.bottom = t.height / -2) : e.aspect = t.width / t.height, e.updateProjectionMatrix(), e.updateMatrixWorld());
}
function Js(e) {
  return (e.eventObject || e.object).uuid + "/" + e.index + e.instanceId;
}
function Fx() {
  var e;
  const t = typeof self < "u" && self || typeof window < "u" && window;
  if (!t) return Ji.DefaultEventPriority;
  switch ((e = t.event) == null ? void 0 : e.type) {
    case "click":
    case "contextmenu":
    case "dblclick":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
      return Ji.DiscreteEventPriority;
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "pointerenter":
    case "pointerleave":
    case "wheel":
      return Ji.ContinuousEventPriority;
    default:
      return Ji.DefaultEventPriority;
  }
}
function f0(e, t, n, o) {
  const l = n.get(t);
  l && (n.delete(t), n.size === 0 && (e.delete(o), l.target.releasePointerCapture(o)));
}
function Ux(e, t) {
  const {
    internal: n
  } = e.getState();
  n.interaction = n.interaction.filter((o) => o !== t), n.initialHits = n.initialHits.filter((o) => o !== t), n.hovered.forEach((o, l) => {
    (o.eventObject === t || o.object === t) && n.hovered.delete(l);
  }), n.capturedMap.forEach((o, l) => {
    f0(n.capturedMap, t, o, l);
  });
}
function Hx(e) {
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
      const S = Zo(_[w]);
      S && (S.raycaster.camera = void 0);
    }
    g.previousRoot || g.events.compute == null || g.events.compute(p, g);
    function k(w) {
      const S = Zo(w);
      if (!S || !S.events.enabled || S.raycaster.camera === null) return [];
      if (S.raycaster.camera === void 0) {
        var x;
        S.events.compute == null || S.events.compute(p, S, (x = S.previousRoot) == null ? void 0 : x.getState()), S.raycaster.camera === void 0 && (S.raycaster.camera = null);
      }
      return S.raycaster.camera ? S.raycaster.intersectObject(w, !0) : [];
    }
    let R = _.flatMap(k).sort((w, S) => {
      const x = Zo(w.object), C = Zo(S.object);
      return !x || !C ? w.distance - S.distance : C.events.priority - x.events.priority || w.distance - S.distance;
    }).filter((w) => {
      const S = Js(w);
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
        y.has(Js(w.intersection)) || v.push(w.intersection);
    return v;
  }
  function l(p, m, g, y) {
    const v = e.getState();
    if (p.length) {
      const _ = {
        stopped: !1
      };
      for (const k of p) {
        const R = Zo(k.object) || v, {
          raycaster: A,
          pointer: w,
          camera: S,
          internal: x
        } = R, C = new ce.Vector3(w.x, w.y, 0).unproject(S), I = (W) => {
          var K, le;
          return (K = (le = x.capturedMap.get(W)) == null ? void 0 : le.has(k.eventObject)) != null ? K : !1;
        }, D = (W) => {
          const K = {
            intersection: k,
            target: m.target
          };
          x.capturedMap.has(W) ? x.capturedMap.get(W).set(k.eventObject, K) : x.capturedMap.set(W, /* @__PURE__ */ new Map([[k.eventObject, K]])), m.target.setPointerCapture(W);
        }, j = (W) => {
          const K = x.capturedMap.get(W);
          K && f0(x.capturedMap, k.eventObject, K, W);
        };
        let B = {};
        for (let W in m) {
          let K = m[W];
          typeof K != "function" && (B[W] = K);
        }
        let q = {
          ...k,
          ...B,
          pointer: w,
          intersections: p,
          stopped: _.stopped,
          delta: g,
          unprojectedPoint: C,
          ray: A.ray,
          camera: S,
          // Hijack stopPropagation, which just sets a flag
          stopPropagation() {
            const W = "pointerId" in m && x.capturedMap.get(m.pointerId);
            if (
              // ...if this pointer hasn't been captured
              (!W || // ... or if the hit object is capturing the pointer
              W.has(k.eventObject)) && (q.stopped = _.stopped = !0, x.hovered.size && Array.from(x.hovered.values()).find((K) => K.eventObject === k.eventObject))
            ) {
              const K = p.slice(0, p.indexOf(k));
              s([...K, k]);
            }
          },
          // there should be a distinction between target and currentTarget
          target: {
            hasPointerCapture: I,
            setPointerCapture: D,
            releasePointerCapture: j
          },
          currentTarget: {
            hasPointerCapture: I,
            setPointerCapture: D,
            releasePointerCapture: j
          },
          nativeEvent: m
        };
        if (y(q), _.stopped === !0) break;
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
        if (m.hovered.delete(Js(g)), v != null && v.eventCount) {
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
  function f(p) {
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
      p === "onPointerDown" && (v.initialClick = [g.offsetX, g.offsetY], v.initialHits = A.map((x) => x.eventObject)), k && !A.length && w <= 2 && (a(g, v.interaction), y && y(g)), _ && s(A);
      function S(x) {
        const C = x.eventObject, I = C.__r3f, D = I == null ? void 0 : I.handlers;
        if (I != null && I.eventCount)
          if (_) {
            if (D.onPointerOver || D.onPointerEnter || D.onPointerOut || D.onPointerLeave) {
              const j = Js(x), B = v.hovered.get(j);
              B ? B.stopped && x.stopPropagation() : (v.hovered.set(j, x), D.onPointerOver == null || D.onPointerOver(x), D.onPointerEnter == null || D.onPointerEnter(x));
            }
            D.onPointerMove == null || D.onPointerMove(x);
          } else {
            const j = D[p];
            j ? (!k || v.initialHits.includes(C)) && (a(g, v.interaction.filter((B) => !v.initialHits.includes(B))), j(x)) : k && v.initialHits.includes(C) && a(g, v.interaction.filter((B) => !v.initialHits.includes(B)));
          }
      }
      l(A, g, w, S);
    };
  }
  return {
    handlePointer: f
  };
}
const d0 = (e) => !!(e != null && e.render), p0 = /* @__PURE__ */ Q.createContext(null), Bx = (e, t) => {
  const n = xx((f, p) => {
    const m = new ce.Vector3(), g = new ce.Vector3(), y = new ce.Vector3();
    function v(w = p().camera, S = g, x = p().size) {
      const {
        width: C,
        height: I,
        top: D,
        left: j
      } = x, B = C / I;
      S.isVector3 ? y.copy(S) : y.set(...S);
      const q = w.getWorldPosition(m).distanceTo(y);
      if (o0(w))
        return {
          width: C / w.zoom,
          height: I / w.zoom,
          top: D,
          left: j,
          factor: 1,
          distance: q,
          aspect: B
        };
      {
        const W = w.fov * Math.PI / 180, K = 2 * Math.tan(W / 2) * q, le = K * (C / I);
        return {
          width: le,
          height: K,
          top: D,
          left: j,
          factor: C / le,
          distance: q,
          aspect: B
        };
      }
    }
    let _;
    const k = (w) => f((S) => ({
      performance: {
        ...S.performance,
        current: w
      }
    })), R = new ce.Vector2();
    return {
      set: f,
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
      clock: new ce.Clock(),
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
      setEvents: (w) => f((S) => ({
        ...S,
        events: {
          ...S.events,
          ...w
        }
      })),
      setSize: (w, S, x, C, I) => {
        const D = p().camera, j = {
          width: w,
          height: S,
          top: C || 0,
          left: I || 0,
          updateStyle: x
        };
        f((B) => ({
          size: j,
          viewport: {
            ...B.viewport,
            ...v(D, g, j)
          }
        }));
      },
      setDpr: (w) => f((S) => {
        const x = a0(w);
        return {
          viewport: {
            ...S.viewport,
            dpr: x,
            initialDpr: S.viewport.initialDpr || x
          }
        };
      }),
      setFrameloop: (w = "always") => {
        const S = p().clock;
        S.stop(), S.elapsedTime = 0, w !== "never" && (S.start(), S.elapsedTime = 0), f(() => ({
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
        subscribe: (w, S, x) => {
          const C = p().internal;
          return C.priority = C.priority + (S > 0 ? 1 : 0), C.subscribers.push({
            ref: w,
            priority: S,
            store: x
          }), C.subscribers = C.subscribers.sort((I, D) => I.priority - D.priority), () => {
            const I = p().internal;
            I != null && I.subscribers && (I.priority = I.priority - (S > 0 ? 1 : 0), I.subscribers = I.subscribers.filter((D) => D.ref !== w));
          };
        }
      }
    };
  }), o = n.getState();
  let l = o.size, s = o.viewport.dpr, a = o.camera;
  return n.subscribe(() => {
    const {
      camera: f,
      size: p,
      viewport: m,
      gl: g,
      set: y
    } = n.getState();
    if (p.width !== l.width || p.height !== l.height || m.dpr !== s) {
      var v;
      l = p, s = m.dpr, jx(f, p), g.setPixelRatio(m.dpr);
      const _ = (v = p.updateStyle) != null ? v : typeof HTMLCanvasElement < "u" && g.domElement instanceof HTMLCanvasElement;
      g.setSize(p.width, p.height, _);
    }
    f !== a && (a = f, y((_) => ({
      viewport: {
        ..._.viewport,
        ..._.viewport.getCurrentViewport(f)
      }
    })));
  }), n.subscribe((f) => e(f)), n;
};
let qs, Gx = /* @__PURE__ */ new Set(), Wx = /* @__PURE__ */ new Set(), Vx = /* @__PURE__ */ new Set();
function Kc(e, t) {
  if (e.size)
    for (const {
      callback: n
    } of e.values())
      n(t);
}
function Jo(e, t) {
  switch (e) {
    case "before":
      return Kc(Gx, t);
    case "after":
      return Kc(Wx, t);
    case "tail":
      return Kc(Vx, t);
  }
}
let Qc, Xc;
function Yc(e, t, n) {
  let o = t.clock.getDelta();
  for (t.frameloop === "never" && typeof e == "number" && (o = e - t.clock.elapsedTime, t.clock.oldTime = t.clock.elapsedTime, t.clock.elapsedTime = e), Qc = t.internal.subscribers, qs = 0; qs < Qc.length; qs++)
    Xc = Qc[qs], Xc.ref.current(Xc.store.getState(), o, n);
  return !t.internal.priority && t.gl.render && t.gl.render(t.scene, t.camera), t.internal.frames = Math.max(0, t.internal.frames - 1), t.frameloop === "always" ? 1 : t.internal.frames;
}
function Kx(e) {
  let t = !1, n = !1, o, l, s;
  function a(m) {
    l = requestAnimationFrame(a), t = !0, o = 0, Jo("before", m), n = !0;
    for (const y of e.values()) {
      var g;
      s = y.store.getState(), s.internal.active && (s.frameloop === "always" || s.internal.frames > 0) && !((g = s.gl.xr) != null && g.isPresenting) && (o += Yc(m, s));
    }
    if (n = !1, Jo("after", m), o === 0)
      return Jo("tail", m), t = !1, cancelAnimationFrame(l);
  }
  function f(m, g = 1) {
    var y;
    if (!m) return e.forEach((v) => f(v.store.getState(), g));
    (y = m.gl.xr) != null && y.isPresenting || !m.internal.active || m.frameloop === "never" || (g > 1 ? m.internal.frames = Math.min(60, m.internal.frames + g) : n ? m.internal.frames = 2 : m.internal.frames = 1, t || (t = !0, requestAnimationFrame(a)));
  }
  function p(m, g = !0, y, v) {
    if (g && Jo("before", m), y) Yc(m, y, v);
    else for (const _ of e.values()) Yc(m, _.store.getState());
    g && Jo("after", m);
  }
  return {
    loop: a,
    invalidate: f,
    advance: p
  };
}
function h0() {
  const e = Q.useContext(p0);
  if (!e) throw new Error("R3F: Hooks can only be used within the Canvas component!");
  return e;
}
function Qx(e = (n) => n, t) {
  return h0()(e, t);
}
function yo(e, t = 0) {
  const n = h0(), o = n.getState().internal.subscribe, l = l0(e);
  return Dl(() => o(l, t, n), [t, o, n]), null;
}
const fg = /* @__PURE__ */ new WeakMap();
function m0(e, t) {
  return function(n, ...o) {
    let l = fg.get(n);
    return l || (l = new n(), fg.set(n, l)), e && e(l), Promise.all(o.map((s) => new Promise((a, f) => l.load(s, (p) => {
      p.scene && Object.assign(p, Ox(p.scene)), a(p);
    }, t, (p) => f(new Error(`Could not load ${s}: ${p == null ? void 0 : p.message}`))))));
  };
}
function ep(e, t, n, o) {
  const l = Array.isArray(t) ? t : [t], s = kx(m0(n, o), [e, ...l], {
    equal: Ee.equ
  });
  return Array.isArray(t) ? s : s[0];
}
ep.preload = function(e, t, n) {
  const o = Array.isArray(t) ? t : [t];
  return Tx(m0(n), [e, ...o]);
};
ep.clear = function(e, t) {
  const n = Array.isArray(t) ? t : [t];
  return Px([e, ...n]);
};
const po = /* @__PURE__ */ new Map(), {
  invalidate: dg,
  advance: pg
} = Kx(po), {
  reconciler: Hu,
  applyProps: Mi
} = Nx(po, Fx), zi = {
  objects: "shallow",
  strict: !1
}, Xx = (e, t) => {
  const n = typeof e == "function" ? e(t) : e;
  return d0(n) ? n : new ce.WebGLRenderer({
    powerPreference: "high-performance",
    canvas: t,
    antialias: !0,
    alpha: !0,
    ...e
  });
};
function Yx(e, t) {
  const n = typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
  if (t) {
    const {
      width: o,
      height: l,
      top: s,
      left: a,
      updateStyle: f = n
    } = t;
    return {
      width: o,
      height: l,
      top: s,
      left: a,
      updateStyle: f
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
function Zx(e) {
  const t = po.get(e), n = t == null ? void 0 : t.fiber, o = t == null ? void 0 : t.store;
  t && console.warn("R3F.createRoot should only be called once!");
  const l = typeof reportError == "function" ? (
    // In modern browsers, reportError will dispatch an error event,
    // emulating an uncaught JavaScript error.
    reportError
  ) : (
    // In older browsers and test environments, fallback to console.error.
    console.error
  ), s = o || Bx(dg, pg), a = n || Hu.createContainer(s, Ji.ConcurrentRoot, null, !1, null, "", l, null);
  t || po.set(e, {
    fiber: a,
    store: s
  });
  let f, p = !1, m;
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
        legacy: x = !1,
        orthographic: C = !1,
        frameloop: I = "always",
        dpr: D = [1, 2],
        performance: j,
        raycaster: B,
        camera: q,
        onPointerMissed: W
      } = g, K = s.getState(), le = K.gl;
      K.gl || K.set({
        gl: le = Xx(y, e)
      });
      let Se = K.raycaster;
      Se || K.set({
        raycaster: Se = new ce.Raycaster()
      });
      const {
        params: xt,
        ...jt
      } = B || {};
      if (Ee.equ(jt, Se, zi) || Mi(Se, {
        ...jt
      }), Ee.equ(xt, Se.params, zi) || Mi(Se, {
        params: {
          ...Se.params,
          ...xt
        }
      }), !K.camera || K.camera === m && !Ee.equ(m, q, zi)) {
        m = q;
        const F = q instanceof ce.Camera, Y = F ? q : C ? new ce.OrthographicCamera(0, 0, 0, 0, 0.1, 1e3) : new ce.PerspectiveCamera(75, 0, 0.1, 1e3);
        F || (Y.position.z = 5, q && (Mi(Y, q), ("aspect" in q || "left" in q || "right" in q || "bottom" in q || "top" in q) && (Y.manual = !0, Y.updateProjectionMatrix())), !K.camera && !(q != null && q.rotation) && Y.lookAt(0, 0, 0)), K.set({
          camera: Y
        }), Se.camera = Y;
      }
      if (!K.scene) {
        let F;
        _ != null && _.isScene ? F = _ : (F = new ce.Scene(), _ && Mi(F, _)), K.set({
          scene: Oi(F)
        });
      }
      if (!K.xr) {
        var be;
        const F = (ae, Ie) => {
          const it = s.getState();
          it.frameloop !== "never" && pg(ae, !0, it, Ie);
        }, Y = () => {
          const ae = s.getState();
          ae.gl.xr.enabled = ae.gl.xr.isPresenting, ae.gl.xr.setAnimationLoop(ae.gl.xr.isPresenting ? F : null), ae.gl.xr.isPresenting || dg(ae);
        }, te = {
          connect() {
            const ae = s.getState().gl;
            ae.xr.addEventListener("sessionstart", Y), ae.xr.addEventListener("sessionend", Y);
          },
          disconnect() {
            const ae = s.getState().gl;
            ae.xr.removeEventListener("sessionstart", Y), ae.xr.removeEventListener("sessionend", Y);
          }
        };
        typeof ((be = le.xr) == null ? void 0 : be.addEventListener) == "function" && te.connect(), K.set({
          xr: te
        });
      }
      if (le.shadowMap) {
        const F = le.shadowMap.enabled, Y = le.shadowMap.type;
        if (le.shadowMap.enabled = !!A, Ee.boo(A))
          le.shadowMap.type = ce.PCFSoftShadowMap;
        else if (Ee.str(A)) {
          var Et;
          const te = {
            basic: ce.BasicShadowMap,
            percentage: ce.PCFShadowMap,
            soft: ce.PCFSoftShadowMap,
            variance: ce.VSMShadowMap
          };
          le.shadowMap.type = (Et = te[A]) != null ? Et : ce.PCFSoftShadowMap;
        } else Ee.obj(A) && Object.assign(le.shadowMap, A);
        (F !== le.shadowMap.enabled || Y !== le.shadowMap.type) && (le.shadowMap.needsUpdate = !0);
      }
      const N = i0();
      N && ("enabled" in N ? N.enabled = !x : "legacyMode" in N && (N.legacyMode = x)), p || Mi(le, {
        outputEncoding: w ? 3e3 : 3001,
        toneMapping: S ? ce.NoToneMapping : ce.ACESFilmicToneMapping
      }), K.legacy !== x && K.set(() => ({
        legacy: x
      })), K.linear !== w && K.set(() => ({
        linear: w
      })), K.flat !== S && K.set(() => ({
        flat: S
      })), y && !Ee.fun(y) && !d0(y) && !Ee.equ(y, le, zi) && Mi(le, y), k && !K.events.handlers && K.set({
        events: k(s)
      });
      const U = Yx(e, v);
      return Ee.equ(U, K.size, zi) || K.setSize(U.width, U.height, U.updateStyle, U.top, U.left), D && K.viewport.dpr !== a0(D) && K.setDpr(D), K.frameloop !== I && K.setFrameloop(I), K.onPointerMissed || K.set({
        onPointerMissed: W
      }), j && !Ee.equ(j, K.performance, zi) && K.set((F) => ({
        performance: {
          ...F.performance,
          ...j
        }
      })), f = R, p = !0, this;
    },
    render(g) {
      return p || this.configure(), Hu.updateContainer(/* @__PURE__ */ O.jsx(Jx, {
        store: s,
        children: g,
        onCreated: f,
        rootElement: e
      }), a, null, () => {
      }), s;
    },
    unmount() {
      g0(e);
    }
  };
}
function Jx({
  store: e,
  children: t,
  onCreated: n,
  rootElement: o
}) {
  return Dl(() => {
    const l = e.getState();
    l.set((s) => ({
      internal: {
        ...s.internal,
        active: !0
      }
    })), n && n(l), e.getState().events.connected || l.events.connect == null || l.events.connect(o);
  }, []), /* @__PURE__ */ O.jsx(p0.Provider, {
    value: e,
    children: t
  });
}
function g0(e, t) {
  const n = po.get(e), o = n == null ? void 0 : n.fiber;
  if (o) {
    const l = n == null ? void 0 : n.store.getState();
    l && (l.internal.active = !1), Hu.updateContainer(null, o, null, () => {
      l && setTimeout(() => {
        try {
          var s, a, f, p;
          l.events.disconnect == null || l.events.disconnect(), (s = l.gl) == null || (a = s.renderLists) == null || a.dispose == null || a.dispose(), (f = l.gl) == null || f.forceContextLoss == null || f.forceContextLoss(), (p = l.gl) != null && p.xr && l.xr.disconnect(), Dx(l), po.delete(e);
        } catch {
        }
      }, 500);
    });
  }
}
Hu.injectIntoDevTools({
  bundleType: 0,
  rendererPackageName: "@react-three/fiber",
  version: Q.version
});
const Zc = {
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
function qx(e) {
  const {
    handlePointer: t
  } = Hx(e);
  return {
    priority: 1,
    enabled: !0,
    compute(n, o, l) {
      o.pointer.set(n.offsetX / o.size.width * 2 - 1, -(n.offsetY / o.size.height) * 2 + 1), o.raycaster.setFromCamera(o.pointer, o.camera);
    },
    connected: void 0,
    handlers: Object.keys(Zc).reduce((n, o) => ({
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
      })), Object.entries((o = s.handlers) != null ? o : []).forEach(([a, f]) => {
        const [p, m] = Zc[a];
        n.addEventListener(p, f, {
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
            const [f] = Zc[s];
            o.connected.removeEventListener(f, a);
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
function hg(e, t) {
  let n;
  return (...o) => {
    window.clearTimeout(n), n = window.setTimeout(() => e(...o), t);
  };
}
function $x({ debounce: e, scroll: t, polyfill: n, offsetSize: o } = { debounce: 0, scroll: !1, offsetSize: !1 }) {
  const l = n || (typeof window > "u" ? class {
  } : window.ResizeObserver);
  if (!l) throw new Error("This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills");
  const [s, a] = Q.useState({ left: 0, top: 0, width: 0, height: 0, bottom: 0, right: 0, x: 0, y: 0 }), f = Q.useRef({ element: null, scrollContainers: null, resizeObserver: null, lastBounds: s, orientationHandler: null }), p = e ? typeof e == "number" ? e : e.scroll : null, m = e ? typeof e == "number" ? e : e.resize : null, g = Q.useRef(!1);
  Q.useEffect(() => (g.current = !0, () => void (g.current = !1)));
  const [y, v, _] = Q.useMemo(() => {
    const w = () => {
      if (!f.current.element) return;
      const { left: S, top: x, width: C, height: I, bottom: D, right: j, x: B, y: q } = f.current.element.getBoundingClientRect(), W = { left: S, top: x, width: C, height: I, bottom: D, right: j, x: B, y: q };
      f.current.element instanceof HTMLElement && o && (W.height = f.current.element.offsetHeight, W.width = f.current.element.offsetWidth), Object.freeze(W), g.current && !nE(f.current.lastBounds, W) && a(f.current.lastBounds = W);
    };
    return [w, m ? hg(w, m) : w, p ? hg(w, p) : w];
  }, [a, o, p, m]);
  function k() {
    f.current.scrollContainers && (f.current.scrollContainers.forEach((w) => w.removeEventListener("scroll", _, !0)), f.current.scrollContainers = null), f.current.resizeObserver && (f.current.resizeObserver.disconnect(), f.current.resizeObserver = null), f.current.orientationHandler && ("orientation" in screen && "removeEventListener" in screen.orientation ? screen.orientation.removeEventListener("change", f.current.orientationHandler) : "onorientationchange" in window && window.removeEventListener("orientationchange", f.current.orientationHandler));
  }
  function R() {
    f.current.element && (f.current.resizeObserver = new l(_), f.current.resizeObserver.observe(f.current.element), t && f.current.scrollContainers && f.current.scrollContainers.forEach((w) => w.addEventListener("scroll", _, { capture: !0, passive: !0 })), f.current.orientationHandler = () => {
      _();
    }, "orientation" in screen && "addEventListener" in screen.orientation ? screen.orientation.addEventListener("change", f.current.orientationHandler) : "onorientationchange" in window && window.addEventListener("orientationchange", f.current.orientationHandler));
  }
  const A = (w) => {
    !w || w === f.current.element || (k(), f.current.element = w, f.current.scrollContainers = y0(w), R());
  };
  return eE(_, !!t), bx(v), Q.useEffect(() => {
    k(), R();
  }, [t, _, v]), Q.useEffect(() => k, []), [A, s, y];
}
function bx(e) {
  Q.useEffect(() => {
    const t = e;
    return window.addEventListener("resize", t), () => void window.removeEventListener("resize", t);
  }, [e]);
}
function eE(e, t) {
  Q.useEffect(() => {
    if (t) {
      const n = e;
      return window.addEventListener("scroll", n, { capture: !0, passive: !0 }), () => void window.removeEventListener("scroll", n, !0);
    }
  }, [e, t]);
}
function y0(e) {
  const t = [];
  if (!e || e === document.body) return t;
  const { overflow: n, overflowX: o, overflowY: l } = window.getComputedStyle(e);
  return [n, o, l].some((s) => s === "auto" || s === "scroll") && t.push(e), [...t, ...y0(e.parentElement)];
}
const tE = ["x", "y", "top", "bottom", "left", "right", "width", "height"], nE = (e, t) => tE.every((n) => e[n] === t[n]);
var rE = Object.defineProperty, iE = Object.defineProperties, oE = Object.getOwnPropertyDescriptors, mg = Object.getOwnPropertySymbols, lE = Object.prototype.hasOwnProperty, sE = Object.prototype.propertyIsEnumerable, gg = (e, t, n) => t in e ? rE(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, yg = (e, t) => {
  for (var n in t || (t = {}))
    lE.call(t, n) && gg(e, n, t[n]);
  if (mg)
    for (var n of mg(t))
      sE.call(t, n) && gg(e, n, t[n]);
  return e;
}, uE = (e, t) => iE(e, oE(t)), vg, Sg;
typeof window < "u" && ((vg = window.document) != null && vg.createElement || ((Sg = window.navigator) == null ? void 0 : Sg.product) === "ReactNative") ? Q.useLayoutEffect : Q.useEffect;
function v0(e, t, n) {
  if (!e)
    return;
  if (n(e) === !0)
    return e;
  let o = e.child;
  for (; o; ) {
    const l = v0(o, t, n);
    if (l)
      return l;
    o = o.sibling;
  }
}
function S0(e) {
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
const wg = console.error;
console.error = function() {
  const e = [...arguments].join("");
  if (e != null && e.startsWith("Warning:") && e.includes("useContext")) {
    console.error = wg;
    return;
  }
  return wg.apply(this, arguments);
};
const tp = S0(Q.createContext(null));
class w0 extends Q.Component {
  render() {
    return /* @__PURE__ */ Q.createElement(tp.Provider, {
      value: this._reactInternals
    }, this.props.children);
  }
}
function aE() {
  const e = Q.useContext(tp);
  if (e === null)
    throw new Error("its-fine: useFiber must be called within a <FiberProvider />!");
  const t = Q.useId();
  return Q.useMemo(() => {
    for (const o of [e, e == null ? void 0 : e.alternate]) {
      if (!o)
        continue;
      const l = v0(o, !1, (s) => {
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
function cE() {
  const e = aE(), [t] = Q.useState(() => /* @__PURE__ */ new Map());
  t.clear();
  let n = e;
  for (; n; ) {
    if (n.type && typeof n.type == "object") {
      const l = n.type._context === void 0 && n.type.Provider === n.type ? n.type : n.type._context;
      l && l !== tp && !t.has(l) && t.set(l, Q.useContext(S0(l)));
    }
    n = n.return;
  }
  return t;
}
function fE() {
  const e = cE();
  return Q.useMemo(
    () => Array.from(e.keys()).reduce(
      (t, n) => (o) => /* @__PURE__ */ Q.createElement(t, null, /* @__PURE__ */ Q.createElement(n.Provider, uE(yg({}, o), {
        value: e.get(n)
      }))),
      (t) => /* @__PURE__ */ Q.createElement(w0, yg({}, t))
    ),
    [e]
  );
}
const dE = /* @__PURE__ */ Q.forwardRef(function({
  children: t,
  fallback: n,
  resize: o,
  style: l,
  gl: s,
  events: a = qx,
  eventSource: f,
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
  scene: x,
  onPointerMissed: C,
  onCreated: I,
  ...D
}, j) {
  Q.useMemo(() => Lx(ce), []);
  const B = fE(), [q, W] = $x({
    scroll: !0,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...o
  }), K = Q.useRef(null), le = Q.useRef(null);
  Q.useImperativeHandle(j, () => K.current);
  const Se = l0(C), [xt, jt] = Q.useState(!1), [be, Et] = Q.useState(!1);
  if (xt) throw xt;
  if (be) throw be;
  const N = Q.useRef(null);
  Dl(() => {
    const F = K.current;
    W.width > 0 && W.height > 0 && F && (N.current || (N.current = Zx(F)), N.current.configure({
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
      scene: x,
      size: W,
      // Pass mutable reference to onPointerMissed so it's free to update
      onPointerMissed: (...Y) => Se.current == null ? void 0 : Se.current(...Y),
      onCreated: (Y) => {
        Y.events.connect == null || Y.events.connect(f ? Mx(f) ? f.current : f : le.current), p && Y.setEvents({
          compute: (te, ae) => {
            const Ie = te[p + "X"], it = te[p + "Y"];
            ae.pointer.set(Ie / ae.size.width * 2 - 1, -(it / ae.size.height) * 2 + 1), ae.raycaster.setFromCamera(ae.pointer, ae.camera);
          }
        }), I == null || I(Y);
      }
    }), N.current.render(/* @__PURE__ */ O.jsx(B, {
      children: /* @__PURE__ */ O.jsx(s0, {
        set: Et,
        children: /* @__PURE__ */ O.jsx(Q.Suspense, {
          fallback: /* @__PURE__ */ O.jsx(zx, {
            set: jt
          }),
          children: t ?? null
        })
      })
    })));
  }), Q.useEffect(() => {
    const F = K.current;
    if (F) return () => g0(F);
  }, []);
  const U = f ? "none" : "auto";
  return /* @__PURE__ */ O.jsx("div", {
    ref: le,
    style: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      pointerEvents: U,
      ...l
    },
    ...D,
    children: /* @__PURE__ */ O.jsx("div", {
      ref: q,
      style: {
        width: "100%",
        height: "100%"
      },
      children: /* @__PURE__ */ O.jsx("canvas", {
        ref: K,
        style: {
          display: "block"
        },
        children: n
      })
    })
  });
}), pE = /* @__PURE__ */ Q.forwardRef(function(t, n) {
  return /* @__PURE__ */ O.jsx(w0, {
    children: /* @__PURE__ */ O.jsx(dE, {
      ...t,
      ref: n
    })
  });
});
function _g(e, t) {
  if (t === aS)
    return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), e;
  if (t === rf || t === Lg) {
    let n = e.getIndex();
    if (n === null) {
      const a = [], f = e.getAttribute("position");
      if (f !== void 0) {
        for (let p = 0; p < f.count; p++)
          a.push(p);
        e.setIndex(a), n = e.getIndex();
      } else
        return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."), e;
    }
    const o = n.count - 2, l = [];
    if (t === rf)
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
class hE extends Ng {
  constructor(t) {
    super(t), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function(n) {
      return new SE(n);
    }), this.register(function(n) {
      return new wE(n);
    }), this.register(function(n) {
      return new AE(n);
    }), this.register(function(n) {
      return new LE(n);
    }), this.register(function(n) {
      return new NE(n);
    }), this.register(function(n) {
      return new xE(n);
    }), this.register(function(n) {
      return new EE(n);
    }), this.register(function(n) {
      return new kE(n);
    }), this.register(function(n) {
      return new TE(n);
    }), this.register(function(n) {
      return new vE(n);
    }), this.register(function(n) {
      return new PE(n);
    }), this.register(function(n) {
      return new _E(n);
    }), this.register(function(n) {
      return new RE(n);
    }), this.register(function(n) {
      return new CE(n);
    }), this.register(function(n) {
      return new gE(n);
    }), this.register(function(n) {
      return new ME(n);
    }), this.register(function(n) {
      return new zE(n);
    });
  }
  load(t, n, o, l) {
    const s = this;
    let a;
    if (this.resourcePath !== "")
      a = this.resourcePath;
    else if (this.path !== "") {
      const m = rl.extractUrlBase(t);
      a = rl.resolveURL(m, this.path);
    } else
      a = rl.extractUrlBase(t);
    this.manager.itemStart(t);
    const f = function(m) {
      l ? l(m) : console.error(m), s.manager.itemError(t), s.manager.itemEnd(t);
    }, p = new pu(this.manager);
    p.setPath(this.path), p.setResponseType("arraybuffer"), p.setRequestHeader(this.requestHeader), p.setWithCredentials(this.withCredentials), p.load(t, function(m) {
      try {
        s.parse(m, a, function(g) {
          n(g), s.manager.itemEnd(t);
        }, f);
      } catch (g) {
        f(g);
      }
    }, o, f);
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
    const a = {}, f = {}, p = new TextDecoder();
    if (typeof t == "string")
      s = JSON.parse(t);
    else if (t instanceof ArrayBuffer)
      if (p.decode(new Uint8Array(t, 0, 4)) === _0) {
        try {
          a[se.KHR_BINARY_GLTF] = new IE(t);
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
    const m = new XE(s, {
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
      y.name || console.error("THREE.GLTFLoader: Invalid plugin found: missing name"), f[y.name] = y, a[y.name] = !0;
    }
    if (s.extensionsUsed)
      for (let g = 0; g < s.extensionsUsed.length; ++g) {
        const y = s.extensionsUsed[g], v = s.extensionsRequired || [];
        switch (y) {
          case se.KHR_MATERIALS_UNLIT:
            a[y] = new yE();
            break;
          case se.KHR_DRACO_MESH_COMPRESSION:
            a[y] = new OE(s, this.dracoLoader);
            break;
          case se.KHR_TEXTURE_TRANSFORM:
            a[y] = new DE();
            break;
          case se.KHR_MESH_QUANTIZATION:
            a[y] = new jE();
            break;
          default:
            v.indexOf(y) >= 0 && f[y] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + y + '".');
        }
      }
    m.setExtensions(a), m.setPlugins(f), m.parse(o, l);
  }
  parseAsync(t, n) {
    const o = this;
    return new Promise(function(l, s) {
      o.parse(t, n, l, s);
    });
  }
}
function mE() {
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
class gE {
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
    const g = new Dr(16777215);
    p.color !== void 0 && g.setRGB(p.color[0], p.color[1], p.color[2], Gn);
    const y = p.range !== void 0 ? p.range : 0;
    switch (p.type) {
      case "directional":
        m = new dS(g), m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      case "point":
        m = new fS(g), m.distance = y;
        break;
      case "spot":
        m = new cS(g), m.distance = y, p.spot = p.spot || {}, p.spot.innerConeAngle = p.spot.innerConeAngle !== void 0 ? p.spot.innerConeAngle : 0, p.spot.outerConeAngle = p.spot.outerConeAngle !== void 0 ? p.spot.outerConeAngle : Math.PI / 4, m.angle = p.spot.outerConeAngle, m.penumbra = 1 - p.spot.innerConeAngle / p.spot.outerConeAngle, m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + p.type);
    }
    return m.position.set(0, 0, 0), m.decay = 2, qn(m, p), p.intensity !== void 0 && (m.intensity = p.intensity), m.name = n.createUniqueName(p.name || "light_" + t), l = Promise.resolve(m), n.cache.add(o, l), l;
  }
  getDependency(t, n) {
    if (t === "light")
      return this._loadLight(n);
  }
  createNodeAttachment(t) {
    const n = this, o = this.parser, s = o.json.nodes[t], f = (s.extensions && s.extensions[this.name] || {}).light;
    return f === void 0 ? null : this._loadLight(f).then(function(p) {
      return o._getNodeRef(n.cache, f, p);
    });
  }
}
class yE {
  constructor() {
    this.name = se.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return $o;
  }
  extendParams(t, n, o) {
    const l = [];
    t.color = new Dr(1, 1, 1), t.opacity = 1;
    const s = n.pbrMetallicRoughness;
    if (s) {
      if (Array.isArray(s.baseColorFactor)) {
        const a = s.baseColorFactor;
        t.color.setRGB(a[0], a[1], a[2], Gn), t.opacity = a[3];
      }
      s.baseColorTexture !== void 0 && l.push(o.assignTexture(t, "map", s.baseColorTexture, Cr));
    }
    return Promise.all(l);
  }
}
class vE {
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
class SE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    if (a.clearcoatFactor !== void 0 && (n.clearcoat = a.clearcoatFactor), a.clearcoatTexture !== void 0 && s.push(o.assignTexture(n, "clearcoatMap", a.clearcoatTexture)), a.clearcoatRoughnessFactor !== void 0 && (n.clearcoatRoughness = a.clearcoatRoughnessFactor), a.clearcoatRoughnessTexture !== void 0 && s.push(o.assignTexture(n, "clearcoatRoughnessMap", a.clearcoatRoughnessTexture)), a.clearcoatNormalTexture !== void 0 && (s.push(o.assignTexture(n, "clearcoatNormalMap", a.clearcoatNormalTexture)), a.clearcoatNormalTexture.scale !== void 0)) {
      const f = a.clearcoatNormalTexture.scale;
      n.clearcoatNormalScale = new Wt(f, f);
    }
    return Promise.all(s);
  }
}
class wE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_DISPERSION;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const l = this.parser.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = l.extensions[this.name];
    return n.dispersion = s.dispersion !== void 0 ? s.dispersion : 0, Promise.resolve();
  }
}
class _E {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return a.iridescenceFactor !== void 0 && (n.iridescence = a.iridescenceFactor), a.iridescenceTexture !== void 0 && s.push(o.assignTexture(n, "iridescenceMap", a.iridescenceTexture)), a.iridescenceIor !== void 0 && (n.iridescenceIOR = a.iridescenceIor), n.iridescenceThicknessRange === void 0 && (n.iridescenceThicknessRange = [100, 400]), a.iridescenceThicknessMinimum !== void 0 && (n.iridescenceThicknessRange[0] = a.iridescenceThicknessMinimum), a.iridescenceThicknessMaximum !== void 0 && (n.iridescenceThicknessRange[1] = a.iridescenceThicknessMaximum), a.iridescenceThicknessTexture !== void 0 && s.push(o.assignTexture(n, "iridescenceThicknessMap", a.iridescenceThicknessTexture)), Promise.all(s);
  }
}
class xE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [];
    n.sheenColor = new Dr(0, 0, 0), n.sheenRoughness = 0, n.sheen = 1;
    const a = l.extensions[this.name];
    if (a.sheenColorFactor !== void 0) {
      const f = a.sheenColorFactor;
      n.sheenColor.setRGB(f[0], f[1], f[2], Gn);
    }
    return a.sheenRoughnessFactor !== void 0 && (n.sheenRoughness = a.sheenRoughnessFactor), a.sheenColorTexture !== void 0 && s.push(o.assignTexture(n, "sheenColorMap", a.sheenColorTexture, Cr)), a.sheenRoughnessTexture !== void 0 && s.push(o.assignTexture(n, "sheenRoughnessMap", a.sheenRoughnessTexture)), Promise.all(s);
  }
}
class EE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return a.transmissionFactor !== void 0 && (n.transmission = a.transmissionFactor), a.transmissionTexture !== void 0 && s.push(o.assignTexture(n, "transmissionMap", a.transmissionTexture)), Promise.all(s);
  }
}
class kE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    n.thickness = a.thicknessFactor !== void 0 ? a.thicknessFactor : 0, a.thicknessTexture !== void 0 && s.push(o.assignTexture(n, "thicknessMap", a.thicknessTexture)), n.attenuationDistance = a.attenuationDistance || 1 / 0;
    const f = a.attenuationColor || [1, 1, 1];
    return n.attenuationColor = new Dr().setRGB(f[0], f[1], f[2], Gn), Promise.all(s);
  }
}
class TE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_IOR;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const l = this.parser.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = l.extensions[this.name];
    return n.ior = s.ior !== void 0 ? s.ior : 1.5, Promise.resolve();
  }
}
class PE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    n.specularIntensity = a.specularFactor !== void 0 ? a.specularFactor : 1, a.specularTexture !== void 0 && s.push(o.assignTexture(n, "specularIntensityMap", a.specularTexture));
    const f = a.specularColorFactor || [1, 1, 1];
    return n.specularColor = new Dr().setRGB(f[0], f[1], f[2], Gn), a.specularColorTexture !== void 0 && s.push(o.assignTexture(n, "specularColorMap", a.specularColorTexture, Cr)), Promise.all(s);
  }
}
class CE {
  constructor(t) {
    this.parser = t, this.name = se.EXT_MATERIALS_BUMP;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return n.bumpScale = a.bumpFactor !== void 0 ? a.bumpFactor : 1, a.bumpTexture !== void 0 && s.push(o.assignTexture(n, "bumpMap", a.bumpTexture)), Promise.all(s);
  }
}
class RE {
  constructor(t) {
    this.parser = t, this.name = se.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Wn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, l = o.json.materials[t];
    if (!l.extensions || !l.extensions[this.name])
      return Promise.resolve();
    const s = [], a = l.extensions[this.name];
    return a.anisotropyStrength !== void 0 && (n.anisotropy = a.anisotropyStrength), a.anisotropyRotation !== void 0 && (n.anisotropyRotation = a.anisotropyRotation), a.anisotropyTexture !== void 0 && s.push(o.assignTexture(n, "anisotropyMap", a.anisotropyTexture)), Promise.all(s);
  }
}
class AE {
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
class LE {
  constructor(t) {
    this.parser = t, this.name = se.EXT_TEXTURE_WEBP, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, o = this.parser, l = o.json, s = l.textures[t];
    if (!s.extensions || !s.extensions[n])
      return null;
    const a = s.extensions[n], f = l.images[a.source];
    let p = o.textureLoader;
    if (f.uri) {
      const m = o.options.manager.getHandler(f.uri);
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
class NE {
  constructor(t) {
    this.parser = t, this.name = se.EXT_TEXTURE_AVIF, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, o = this.parser, l = o.json, s = l.textures[t];
    if (!s.extensions || !s.extensions[n])
      return null;
    const a = s.extensions[n], f = l.images[a.source];
    let p = o.textureLoader;
    if (f.uri) {
      const m = o.options.manager.getHandler(f.uri);
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
class ME {
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
      return s.then(function(f) {
        const p = l.byteOffset || 0, m = l.byteLength || 0, g = l.count, y = l.byteStride, v = new Uint8Array(f, p, m);
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
class zE {
  constructor(t) {
    this.name = se.EXT_MESH_GPU_INSTANCING, this.parser = t;
  }
  createNodeMesh(t) {
    const n = this.parser.json, o = n.nodes[t];
    if (!o.extensions || !o.extensions[this.name] || o.mesh === void 0)
      return null;
    const l = n.meshes[o.mesh];
    for (const m of l.primitives)
      if (m.mode !== sn.TRIANGLES && m.mode !== sn.TRIANGLE_STRIP && m.mode !== sn.TRIANGLE_FAN && m.mode !== void 0)
        return null;
    const a = o.extensions[this.name].attributes, f = [], p = {};
    for (const m in a)
      f.push(this.parser.getDependency("accessor", a[m]).then((g) => (p[m] = g, p[m])));
    return f.length < 1 ? null : (f.push(this.parser.createNodeMesh(t)), Promise.all(f).then((m) => {
      const g = m.pop(), y = g.isGroup ? g.children : [g], v = m[0].count, _ = [];
      for (const k of y) {
        const R = new hu(), A = new pt(), w = new mu(), S = new pt(1, 1, 1), x = new pS(k.geometry, k.material, v);
        for (let C = 0; C < v; C++)
          p.TRANSLATION && A.fromBufferAttribute(p.TRANSLATION, C), p.ROTATION && w.fromBufferAttribute(p.ROTATION, C), p.SCALE && S.fromBufferAttribute(p.SCALE, C), x.setMatrixAt(C, R.compose(A, w, S));
        for (const C in p)
          if (C === "_COLOR_0") {
            const I = p[C];
            x.instanceColor = new hS(I.array, I.itemSize, I.normalized);
          } else C !== "TRANSLATION" && C !== "ROTATION" && C !== "SCALE" && k.geometry.setAttribute(C, p[C]);
        Mg.prototype.copy.call(x, k), this.parser.assignFinalMaterial(x), _.push(x);
      }
      return g.isGroup ? (g.clear(), g.add(..._), g) : _[0];
    }));
  }
}
const _0 = "glTF", qo = 12, xg = { JSON: 1313821514, BIN: 5130562 };
class IE {
  constructor(t) {
    this.name = se.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const n = new DataView(t, 0, qo), o = new TextDecoder();
    if (this.header = {
      magic: o.decode(new Uint8Array(t.slice(0, 4))),
      version: n.getUint32(4, !0),
      length: n.getUint32(8, !0)
    }, this.header.magic !== _0)
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const l = this.header.length - qo, s = new DataView(t, qo);
    let a = 0;
    for (; a < l; ) {
      const f = s.getUint32(a, !0);
      a += 4;
      const p = s.getUint32(a, !0);
      if (a += 4, p === xg.JSON) {
        const m = new Uint8Array(t, qo + a, f);
        this.content = o.decode(m);
      } else if (p === xg.BIN) {
        const m = qo + a;
        this.body = t.slice(m, m + f);
      }
      a += f;
    }
    if (this.content === null)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class OE {
  constructor(t, n) {
    if (!n)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = se.KHR_DRACO_MESH_COMPRESSION, this.json = t, this.dracoLoader = n, this.dracoLoader.preload();
  }
  decodePrimitive(t, n) {
    const o = this.json, l = this.dracoLoader, s = t.extensions[this.name].bufferView, a = t.extensions[this.name].attributes, f = {}, p = {}, m = {};
    for (const g in a) {
      const y = rd[g] || g.toLowerCase();
      f[y] = a[g];
    }
    for (const g in t.attributes) {
      const y = rd[g] || g.toLowerCase();
      if (a[g] !== void 0) {
        const v = o.accessors[t.attributes[g]], _ = io[v.componentType];
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
        }, f, m, Gn, v);
      });
    });
  }
}
class DE {
  constructor() {
    this.name = se.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(t, n) {
    return (n.texCoord === void 0 || n.texCoord === t.channel) && n.offset === void 0 && n.rotation === void 0 && n.scale === void 0 || (t = t.clone(), n.texCoord !== void 0 && (t.channel = n.texCoord), n.offset !== void 0 && t.offset.fromArray(n.offset), n.rotation !== void 0 && (t.rotation = n.rotation), n.scale !== void 0 && t.repeat.fromArray(n.scale), t.needsUpdate = !0), t;
  }
}
class jE {
  constructor() {
    this.name = se.KHR_MESH_QUANTIZATION;
  }
}
class x0 extends BS {
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
    const s = this.resultBuffer, a = this.sampleValues, f = this.valueSize, p = f * 2, m = f * 3, g = l - n, y = (o - n) / g, v = y * y, _ = v * y, k = t * m, R = k - m, A = -2 * _ + 3 * v, w = _ - v, S = 1 - A, x = w - v + y;
    for (let C = 0; C !== f; C++) {
      const I = a[R + C + f], D = a[R + C + p] * g, j = a[k + C + f], B = a[k + C] * g;
      s[C] = S * I + x * D + A * j + w * B;
    }
    return s;
  }
}
const FE = new mu();
class UE extends x0 {
  interpolate_(t, n, o, l) {
    const s = super.interpolate_(t, n, o, l);
    return FE.fromArray(s).normalize().toArray(s), s;
  }
}
const sn = {
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6
}, io = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
}, Eg = {
  9728: Ig,
  9729: of,
  9984: _S,
  9985: wS,
  9986: SS,
  9987: zg
}, kg = {
  33071: ES,
  33648: xS,
  10497: lf
}, Jc = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
}, rd = {
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
}, vr = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences"
}, HE = {
  CUBICSPLINE: void 0,
  // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: Fg,
  STEP: US
}, qc = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND"
};
function BE(e) {
  return e.DefaultMaterial === void 0 && (e.DefaultMaterial = new Og({
    color: 16777215,
    emissive: 0,
    metalness: 1,
    roughness: 1,
    transparent: !1,
    depthTest: !0,
    side: HS
  })), e.DefaultMaterial;
}
function $r(e, t, n) {
  for (const o in n.extensions)
    e[o] === void 0 && (t.userData.gltfExtensions = t.userData.gltfExtensions || {}, t.userData.gltfExtensions[o] = n.extensions[o]);
}
function qn(e, t) {
  t.extras !== void 0 && (typeof t.extras == "object" ? Object.assign(e.userData, t.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + t.extras));
}
function GE(e, t, n) {
  let o = !1, l = !1, s = !1;
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (y.POSITION !== void 0 && (o = !0), y.NORMAL !== void 0 && (l = !0), y.COLOR_0 !== void 0 && (s = !0), o && l && s) break;
  }
  if (!o && !l && !s) return Promise.resolve(e);
  const a = [], f = [], p = [];
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (o) {
      const v = y.POSITION !== void 0 ? n.getDependency("accessor", y.POSITION) : e.attributes.position;
      a.push(v);
    }
    if (l) {
      const v = y.NORMAL !== void 0 ? n.getDependency("accessor", y.NORMAL) : e.attributes.normal;
      f.push(v);
    }
    if (s) {
      const v = y.COLOR_0 !== void 0 ? n.getDependency("accessor", y.COLOR_0) : e.attributes.color;
      p.push(v);
    }
  }
  return Promise.all([
    Promise.all(a),
    Promise.all(f),
    Promise.all(p)
  ]).then(function(m) {
    const g = m[0], y = m[1], v = m[2];
    return o && (e.morphAttributes.position = g), l && (e.morphAttributes.normal = y), s && (e.morphAttributes.color = v), e.morphTargetsRelative = !0, e;
  });
}
function WE(e, t) {
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
function VE(e) {
  let t;
  const n = e.extensions && e.extensions[se.KHR_DRACO_MESH_COMPRESSION];
  if (n ? t = "draco:" + n.bufferView + ":" + n.indices + ":" + $c(n.attributes) : t = e.indices + ":" + $c(e.attributes) + ":" + e.mode, e.targets !== void 0)
    for (let o = 0, l = e.targets.length; o < l; o++)
      t += ":" + $c(e.targets[o]);
  return t;
}
function $c(e) {
  let t = "";
  const n = Object.keys(e).sort();
  for (let o = 0, l = n.length; o < l; o++)
    t += n[o] + ":" + e[n[o]] + ";";
  return t;
}
function id(e) {
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
function KE(e) {
  return e.search(/\.jpe?g($|\?)/i) > 0 || e.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : e.search(/\.webp($|\?)/i) > 0 || e.search(/^data\:image\/webp/) === 0 ? "image/webp" : e.search(/\.ktx2($|\?)/i) > 0 || e.search(/^data\:image\/ktx2/) === 0 ? "image/ktx2" : "image/png";
}
const QE = new hu();
class XE {
  constructor(t = {}, n = {}) {
    this.json = t, this.extensions = {}, this.plugins = {}, this.options = n, this.cache = new mE(), this.associations = /* @__PURE__ */ new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = { refs: {}, uses: {} }, this.cameraCache = { refs: {}, uses: {} }, this.lightCache = { refs: {}, uses: {} }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let o = !1, l = -1, s = !1, a = -1;
    if (typeof navigator < "u") {
      const f = navigator.userAgent;
      o = /^((?!chrome|android).)*safari/i.test(f) === !0;
      const p = f.match(/Version\/(\d+)/);
      l = o && p ? parseInt(p[1], 10) : -1, s = f.indexOf("Firefox") > -1, a = s ? f.match(/Firefox\/([0-9]+)\./)[1] : -1;
    }
    typeof createImageBitmap > "u" || o && l < 17 || s && a < 98 ? this.textureLoader = new mS(this.options.manager) : this.textureLoader = new gS(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new pu(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
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
      const f = {
        scene: a[0][l.scene || 0],
        scenes: a[0],
        animations: a[1],
        cameras: a[2],
        asset: l.asset,
        parser: o,
        userData: {}
      };
      return $r(s, f, l), qn(f, l), Promise.all(o._invokeAll(function(p) {
        return p.afterRoot && p.afterRoot(f);
      })).then(function() {
        for (const p of f.scenes)
          p.updateMatrixWorld();
        t(f);
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
      for (let f = 0, p = a.length; f < p; f++)
        t[a[f]].isBone = !0;
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
    const l = o.clone(), s = (a, f) => {
      const p = this.associations.get(a);
      p != null && this.associations.set(f, p);
      for (const [m, g] of a.children.entries())
        s(g, f.children[m]);
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
      o.load(rl.resolveURL(n.uri, l.path), s, void 0, function() {
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
      const a = Jc[l.type], f = io[l.componentType], p = l.normalized === !0, m = new f(l.count * a);
      return Promise.resolve(new il(m, a, p));
    }
    const s = [];
    return l.bufferView !== void 0 ? s.push(this.getDependency("bufferView", l.bufferView)) : s.push(null), l.sparse !== void 0 && (s.push(this.getDependency("bufferView", l.sparse.indices.bufferView)), s.push(this.getDependency("bufferView", l.sparse.values.bufferView))), Promise.all(s).then(function(a) {
      const f = a[0], p = Jc[l.type], m = io[l.componentType], g = m.BYTES_PER_ELEMENT, y = g * p, v = l.byteOffset || 0, _ = l.bufferView !== void 0 ? o.bufferViews[l.bufferView].byteStride : void 0, k = l.normalized === !0;
      let R, A;
      if (_ && _ !== y) {
        const w = Math.floor(v / _), S = "InterleavedBuffer:" + l.bufferView + ":" + l.componentType + ":" + w + ":" + l.count;
        let x = n.cache.get(S);
        x || (R = new m(f, w * _, l.count * _ / g), x = new yS(R, _ / g), n.cache.add(S, x)), A = new vS(x, p, v % _ / g, k);
      } else
        f === null ? R = new m(l.count * p) : R = new m(f, v, l.count * p), A = new il(R, p, k);
      if (l.sparse !== void 0) {
        const w = Jc.SCALAR, S = io[l.sparse.indices.componentType], x = l.sparse.indices.byteOffset || 0, C = l.sparse.values.byteOffset || 0, I = new S(a[1], x, l.sparse.count * w), D = new m(a[2], C, l.sparse.count * p);
        f !== null && (A = new il(A.array.slice(), A.itemSize, A.normalized)), A.normalized = !1;
        for (let j = 0, B = I.length; j < B; j++) {
          const q = I[j];
          if (A.setX(q, D[j * p]), p >= 2 && A.setY(q, D[j * p + 1]), p >= 3 && A.setZ(q, D[j * p + 2]), p >= 4 && A.setW(q, D[j * p + 3]), p >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
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
    let f = this.textureLoader;
    if (a.uri) {
      const p = o.manager.getHandler(a.uri);
      p !== null && (f = p);
    }
    return this.loadTextureImage(t, s, f);
  }
  loadTextureImage(t, n, o) {
    const l = this, s = this.json, a = s.textures[t], f = s.images[n], p = (f.uri || f.bufferView) + ":" + a.sampler;
    if (this.textureCache[p])
      return this.textureCache[p];
    const m = this.loadImageSource(n, o).then(function(g) {
      g.flipY = !1, g.name = a.name || f.name || "", g.name === "" && typeof f.uri == "string" && f.uri.startsWith("data:image/") === !1 && (g.name = f.uri);
      const v = (s.samplers || {})[a.sampler] || {};
      return g.magFilter = Eg[v.magFilter] || of, g.minFilter = Eg[v.minFilter] || zg, g.wrapS = kg[v.wrapS] || lf, g.wrapT = kg[v.wrapT] || lf, g.generateMipmaps = !g.isCompressedTexture && g.minFilter !== Ig && g.minFilter !== of, l.associations.set(g, { textures: t }), g;
    }).catch(function() {
      return null;
    });
    return this.textureCache[p] = m, m;
  }
  loadImageSource(t, n) {
    const o = this, l = this.json, s = this.options;
    if (this.sourceCache[t] !== void 0)
      return this.sourceCache[t].then((y) => y.clone());
    const a = l.images[t], f = self.URL || self.webkitURL;
    let p = a.uri || "", m = !1;
    if (a.bufferView !== void 0)
      p = o.getDependency("bufferView", a.bufferView).then(function(y) {
        m = !0;
        const v = new Blob([y], { type: a.mimeType });
        return p = f.createObjectURL(v), p;
      });
    else if (a.uri === void 0)
      throw new Error("THREE.GLTFLoader: Image " + t + " is missing URI and bufferView");
    const g = Promise.resolve(p).then(function(y) {
      return new Promise(function(v, _) {
        let k = v;
        n.isImageBitmapLoader === !0 && (k = function(R) {
          const A = new Kh(R);
          A.needsUpdate = !0, v(A);
        }), n.load(rl.resolveURL(y, s.path), k, void 0, _);
      });
    }).then(function(y) {
      return m === !0 && f.revokeObjectURL(p), qn(y, a), y.userData.mimeType = a.mimeType || KE(a.uri), y;
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
        const f = o.extensions !== void 0 ? o.extensions[se.KHR_TEXTURE_TRANSFORM] : void 0;
        if (f) {
          const p = s.associations.get(a);
          a = s.extensions[se.KHR_TEXTURE_TRANSFORM].extendTexture(a, f), s.associations.set(a, p);
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
      const f = "PointsMaterial:" + o.uuid;
      let p = this.cache.get(f);
      p || (p = new kS(), hc.prototype.copy.call(p, o), p.color.copy(o.color), p.map = o.map, p.sizeAttenuation = !1, this.cache.add(f, p)), o = p;
    } else if (t.isLine) {
      const f = "LineBasicMaterial:" + o.uuid;
      let p = this.cache.get(f);
      p || (p = new TS(), hc.prototype.copy.call(p, o), p.color.copy(o.color), p.map = o.map, this.cache.add(f, p)), o = p;
    }
    if (l || s || a) {
      let f = "ClonedMaterial:" + o.uuid + ":";
      l && (f += "derivative-tangents:"), s && (f += "vertex-colors:"), a && (f += "flat-shading:");
      let p = this.cache.get(f);
      p || (p = o.clone(), s && (p.vertexColors = !0), a && (p.flatShading = !0), l && (p.normalScale && (p.normalScale.y *= -1), p.clearcoatNormalScale && (p.clearcoatNormalScale.y *= -1)), this.cache.add(f, p), this.associations.set(p, this.associations.get(o))), o = p;
    }
    t.material = o;
  }
  getMaterialType() {
    return Og;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  loadMaterial(t) {
    const n = this, o = this.json, l = this.extensions, s = o.materials[t];
    let a;
    const f = {}, p = s.extensions || {}, m = [];
    if (p[se.KHR_MATERIALS_UNLIT]) {
      const y = l[se.KHR_MATERIALS_UNLIT];
      a = y.getMaterialType(), m.push(y.extendParams(f, s, n));
    } else {
      const y = s.pbrMetallicRoughness || {};
      if (f.color = new Dr(1, 1, 1), f.opacity = 1, Array.isArray(y.baseColorFactor)) {
        const v = y.baseColorFactor;
        f.color.setRGB(v[0], v[1], v[2], Gn), f.opacity = v[3];
      }
      y.baseColorTexture !== void 0 && m.push(n.assignTexture(f, "map", y.baseColorTexture, Cr)), f.metalness = y.metallicFactor !== void 0 ? y.metallicFactor : 1, f.roughness = y.roughnessFactor !== void 0 ? y.roughnessFactor : 1, y.metallicRoughnessTexture !== void 0 && (m.push(n.assignTexture(f, "metalnessMap", y.metallicRoughnessTexture)), m.push(n.assignTexture(f, "roughnessMap", y.metallicRoughnessTexture))), a = this._invokeOne(function(v) {
        return v.getMaterialType && v.getMaterialType(t);
      }), m.push(Promise.all(this._invokeAll(function(v) {
        return v.extendMaterialParams && v.extendMaterialParams(t, f);
      })));
    }
    s.doubleSided === !0 && (f.side = PS);
    const g = s.alphaMode || qc.OPAQUE;
    if (g === qc.BLEND ? (f.transparent = !0, f.depthWrite = !1) : (f.transparent = !1, g === qc.MASK && (f.alphaTest = s.alphaCutoff !== void 0 ? s.alphaCutoff : 0.5)), s.normalTexture !== void 0 && a !== $o && (m.push(n.assignTexture(f, "normalMap", s.normalTexture)), f.normalScale = new Wt(1, 1), s.normalTexture.scale !== void 0)) {
      const y = s.normalTexture.scale;
      f.normalScale.set(y, y);
    }
    if (s.occlusionTexture !== void 0 && a !== $o && (m.push(n.assignTexture(f, "aoMap", s.occlusionTexture)), s.occlusionTexture.strength !== void 0 && (f.aoMapIntensity = s.occlusionTexture.strength)), s.emissiveFactor !== void 0 && a !== $o) {
      const y = s.emissiveFactor;
      f.emissive = new Dr().setRGB(y[0], y[1], y[2], Gn);
    }
    return s.emissiveTexture !== void 0 && a !== $o && m.push(n.assignTexture(f, "emissiveMap", s.emissiveTexture, Cr)), Promise.all(m).then(function() {
      const y = new a(f);
      return s.name && (y.name = s.name), qn(y, s), n.associations.set(y, { materials: t }), s.extensions && $r(l, y, s), y;
    });
  }
  /** When Object3D instances are targeted by animation, they need unique names. */
  createUniqueName(t) {
    const n = CS.sanitizeNodeName(t || "");
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
    function s(f) {
      return o[se.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(f, n).then(function(p) {
        return Tg(p, f, n);
      });
    }
    const a = [];
    for (let f = 0, p = t.length; f < p; f++) {
      const m = t[f], g = VE(m), y = l[g];
      if (y)
        a.push(y.promise);
      else {
        let v;
        m.extensions && m.extensions[se.KHR_DRACO_MESH_COMPRESSION] ? v = s(m) : v = Tg(new Dg(), m, n), l[g] = { primitive: m, promise: v }, a.push(v);
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
    const n = this, o = this.json, l = this.extensions, s = o.meshes[t], a = s.primitives, f = [];
    for (let p = 0, m = a.length; p < m; p++) {
      const g = a[p].material === void 0 ? BE(this.cache) : this.getDependency("material", a[p].material);
      f.push(g);
    }
    return f.push(n.loadGeometries(a)), Promise.all(f).then(function(p) {
      const m = p.slice(0, p.length - 1), g = p[p.length - 1], y = [];
      for (let _ = 0, k = g.length; _ < k; _++) {
        const R = g[_], A = a[_];
        let w;
        const S = m[_];
        if (A.mode === sn.TRIANGLES || A.mode === sn.TRIANGLE_STRIP || A.mode === sn.TRIANGLE_FAN || A.mode === void 0)
          w = s.isSkinnedMesh === !0 ? new RS(R, S) : new AS(R, S), w.isSkinnedMesh === !0 && w.normalizeSkinWeights(), A.mode === sn.TRIANGLE_STRIP ? w.geometry = _g(w.geometry, Lg) : A.mode === sn.TRIANGLE_FAN && (w.geometry = _g(w.geometry, rf));
        else if (A.mode === sn.LINES)
          w = new LS(R, S);
        else if (A.mode === sn.LINE_STRIP)
          w = new NS(R, S);
        else if (A.mode === sn.LINE_LOOP)
          w = new MS(R, S);
        else if (A.mode === sn.POINTS)
          w = new zS(R, S);
        else
          throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + A.mode);
        Object.keys(w.geometry.morphAttributes).length > 0 && WE(w, s), w.name = n.createUniqueName(s.name || "mesh_" + t), qn(w, s), A.extensions && $r(l, w, A), n.assignFinalMaterial(w), y.push(w);
      }
      for (let _ = 0, k = y.length; _ < k; _++)
        n.associations.set(y[_], {
          meshes: t,
          primitives: _
        });
      if (y.length === 1)
        return s.extensions && $r(l, y[0], s), y[0];
      const v = new mc();
      s.extensions && $r(l, v, s), n.associations.set(v, { meshes: t });
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
    return o.type === "perspective" ? n = new IS(jg.radToDeg(l.yfov), l.aspectRatio || 1, l.znear || 1, l.zfar || 2e6) : o.type === "orthographic" && (n = new OS(-l.xmag, l.xmag, l.ymag, -l.ymag, l.znear, l.zfar)), o.name && (n.name = this.createUniqueName(o.name)), qn(n, o), Promise.resolve(n);
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
      const s = l.pop(), a = l, f = [], p = [];
      for (let m = 0, g = a.length; m < g; m++) {
        const y = a[m];
        if (y) {
          f.push(y);
          const v = new hu();
          s !== null && v.fromArray(s.array, m * 16), p.push(v);
        } else
          console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', n.joints[m]);
      }
      return new DS(f, p);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */
  loadAnimation(t) {
    const n = this.json, o = this, l = n.animations[t], s = l.name ? l.name : "animation_" + t, a = [], f = [], p = [], m = [], g = [];
    for (let y = 0, v = l.channels.length; y < v; y++) {
      const _ = l.channels[y], k = l.samplers[_.sampler], R = _.target, A = R.node, w = l.parameters !== void 0 ? l.parameters[k.input] : k.input, S = l.parameters !== void 0 ? l.parameters[k.output] : k.output;
      R.node !== void 0 && (a.push(this.getDependency("node", A)), f.push(this.getDependency("accessor", w)), p.push(this.getDependency("accessor", S)), m.push(k), g.push(R));
    }
    return Promise.all([
      Promise.all(a),
      Promise.all(f),
      Promise.all(p),
      Promise.all(m),
      Promise.all(g)
    ]).then(function(y) {
      const v = y[0], _ = y[1], k = y[2], R = y[3], A = y[4], w = [];
      for (let S = 0, x = v.length; S < x; S++) {
        const C = v[S], I = _[S], D = k[S], j = R[S], B = A[S];
        if (C === void 0) continue;
        C.updateMatrix && C.updateMatrix();
        const q = o._createAnimationTracks(C, I, D, j, B);
        if (q)
          for (let W = 0; W < q.length; W++)
            w.push(q[W]);
      }
      return new jS(s, void 0, w);
    });
  }
  createNodeMesh(t) {
    const n = this.json, o = this, l = n.nodes[t];
    return l.mesh === void 0 ? null : o.getDependency("mesh", l.mesh).then(function(s) {
      const a = o._getNodeRef(o.meshCache, l.mesh, s);
      return l.weights !== void 0 && a.traverse(function(f) {
        if (f.isMesh)
          for (let p = 0, m = l.weights.length; p < m; p++)
            f.morphTargetInfluences[p] = l.weights[p];
      }), a;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */
  loadNode(t) {
    const n = this.json, o = this, l = n.nodes[t], s = o._loadNodeShallow(t), a = [], f = l.children || [];
    for (let m = 0, g = f.length; m < g; m++)
      a.push(o.getDependency("node", f[m]));
    const p = l.skin === void 0 ? Promise.resolve(null) : o.getDependency("skin", l.skin);
    return Promise.all([
      s,
      Promise.all(a),
      p
    ]).then(function(m) {
      const g = m[0], y = m[1], v = m[2];
      v !== null && g.traverse(function(_) {
        _.isSkinnedMesh && _.bind(v, QE);
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
    const s = n.nodes[t], a = s.name ? l.createUniqueName(s.name) : "", f = [], p = l._invokeOne(function(m) {
      return m.createNodeMesh && m.createNodeMesh(t);
    });
    return p && f.push(p), s.camera !== void 0 && f.push(l.getDependency("camera", s.camera).then(function(m) {
      return l._getNodeRef(l.cameraCache, s.camera, m);
    })), l._invokeAll(function(m) {
      return m.createNodeAttachment && m.createNodeAttachment(t);
    }).forEach(function(m) {
      f.push(m);
    }), this.nodeCache[t] = Promise.all(f).then(function(m) {
      let g;
      if (s.isBone === !0 ? g = new FS() : m.length > 1 ? g = new mc() : m.length === 1 ? g = m[0] : g = new Mg(), g !== m[0])
        for (let y = 0, v = m.length; y < v; y++)
          g.add(m[y]);
      if (s.name && (g.userData.name = s.name, g.name = a), qn(g, s), s.extensions && $r(o, g, s), s.matrix !== void 0) {
        const y = new hu();
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
    const n = this.extensions, o = this.json.scenes[t], l = this, s = new mc();
    o.name && (s.name = l.createUniqueName(o.name)), qn(s, o), o.extensions && $r(n, s, o);
    const a = o.nodes || [], f = [];
    for (let p = 0, m = a.length; p < m; p++)
      f.push(l.getDependency("node", a[p]));
    return Promise.all(f).then(function(p) {
      for (let g = 0, y = p.length; g < y; g++)
        s.add(p[g]);
      const m = (g) => {
        const y = /* @__PURE__ */ new Map();
        for (const [v, _] of l.associations)
          (v instanceof hc || v instanceof Kh) && y.set(v, _);
        return g.traverse((v) => {
          const _ = l.associations.get(v);
          _ != null && y.set(v, _);
        }), y;
      };
      return l.associations = m(s), s;
    });
  }
  _createAnimationTracks(t, n, o, l, s) {
    const a = [], f = t.name ? t.name : t.uuid, p = [];
    vr[s.path] === vr.weights ? t.traverse(function(v) {
      v.morphTargetInfluences && p.push(v.name ? v.name : v.uuid);
    }) : p.push(f);
    let m;
    switch (vr[s.path]) {
      case vr.weights:
        m = Xh;
        break;
      case vr.rotation:
        m = Yh;
        break;
      case vr.position:
      case vr.scale:
        m = Qh;
        break;
      default:
        switch (o.itemSize) {
          case 1:
            m = Xh;
            break;
          case 2:
          case 3:
          default:
            m = Qh;
            break;
        }
        break;
    }
    const g = l.interpolation !== void 0 ? HE[l.interpolation] : Fg, y = this._getArrayFromAccessor(o);
    for (let v = 0, _ = p.length; v < _; v++) {
      const k = new m(
        p[v] + "." + vr[s.path],
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
      const o = id(n.constructor), l = new Float32Array(n.length);
      for (let s = 0, a = n.length; s < a; s++)
        l[s] = n[s] * o;
      n = l;
    }
    return n;
  }
  _createCubicSplineTrackInterpolant(t) {
    t.createInterpolant = function(o) {
      const l = this instanceof Yh ? UE : x0;
      return new l(this.times, this.values, this.getValueSize() / 3, o);
    }, t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function YE(e, t, n) {
  const o = t.attributes, l = new GS();
  if (o.POSITION !== void 0) {
    const f = n.json.accessors[o.POSITION], p = f.min, m = f.max;
    if (p !== void 0 && m !== void 0) {
      if (l.set(
        new pt(p[0], p[1], p[2]),
        new pt(m[0], m[1], m[2])
      ), f.normalized) {
        const g = id(io[f.componentType]);
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
    const f = new pt(), p = new pt();
    for (let m = 0, g = s.length; m < g; m++) {
      const y = s[m];
      if (y.POSITION !== void 0) {
        const v = n.json.accessors[y.POSITION], _ = v.min, k = v.max;
        if (_ !== void 0 && k !== void 0) {
          if (p.setX(Math.max(Math.abs(_[0]), Math.abs(k[0]))), p.setY(Math.max(Math.abs(_[1]), Math.abs(k[1]))), p.setZ(Math.max(Math.abs(_[2]), Math.abs(k[2]))), v.normalized) {
            const R = id(io[v.componentType]);
            p.multiplyScalar(R);
          }
          f.max(p);
        } else
          console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      }
    }
    l.expandByVector(f);
  }
  e.boundingBox = l;
  const a = new WS();
  l.getCenter(a.center), a.radius = l.min.distanceTo(l.max) / 2, e.boundingSphere = a;
}
function Tg(e, t, n) {
  const o = t.attributes, l = [];
  function s(a, f) {
    return n.getDependency("accessor", a).then(function(p) {
      e.setAttribute(f, p);
    });
  }
  for (const a in o) {
    const f = rd[a] || a.toLowerCase();
    f in e.attributes || l.push(s(o[a], f));
  }
  if (t.indices !== void 0 && !e.index) {
    const a = n.getDependency("accessor", t.indices).then(function(f) {
      e.setIndex(f);
    });
    l.push(a);
  }
  return sf.workingColorSpace !== Gn && "COLOR_0" in o && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${sf.workingColorSpace}" not supported.`), qn(e, t), YE(e, t, n), Promise.all(l).then(function() {
    return t.targets !== void 0 ? GE(e, t.targets, n) : e;
  });
}
const bc = /* @__PURE__ */ new WeakMap();
class ZE extends Ng {
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
    const s = new pu(this.manager);
    s.setPath(this.path), s.setResponseType("arraybuffer"), s.setRequestHeader(this.requestHeader), s.setWithCredentials(this.withCredentials), s.load(t, (a) => {
      this.parse(a, n, l);
    }, o, l);
  }
  parse(t, n, o = () => {
  }) {
    this.decodeDracoFile(t, n, null, null, Cr, o).catch(o);
  }
  decodeDracoFile(t, n, o, l, s = Gn, a = () => {
  }) {
    const f = {
      attributeIDs: o || this.defaultAttributeIDs,
      attributeTypes: l || this.defaultAttributeTypes,
      useUniqueIDs: !!o,
      vertexColorSpace: s
    };
    return this.decodeGeometry(t, f).then(n).catch(a);
  }
  decodeGeometry(t, n) {
    const o = JSON.stringify(n);
    if (bc.has(t)) {
      const p = bc.get(t);
      if (p.key === o)
        return p.promise;
      if (t.byteLength === 0)
        throw new Error(
          "THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred."
        );
    }
    let l;
    const s = this.workerNextTaskID++, a = t.byteLength, f = this._getWorker(s, a).then((p) => (l = p, new Promise((m, g) => {
      l._callbacks[s] = { resolve: m, reject: g }, l.postMessage({ type: "decode", id: s, taskConfig: n, buffer: t }, [t]);
    }))).then((p) => this._createGeometry(p.geometry));
    return f.catch(() => !0).then(() => {
      l && s && this._releaseTask(l, s);
    }), bc.set(t, {
      key: o,
      promise: f
    }), f;
  }
  _createGeometry(t) {
    const n = new Dg();
    t.index && n.setIndex(new il(t.index.array, 1));
    for (let o = 0; o < t.attributes.length; o++) {
      const l = t.attributes[o], s = l.name, a = l.array, f = l.itemSize, p = new il(a, f);
      s === "color" && (this._assignVertexColorSpace(p, l.vertexColorSpace), p.normalized = !(a instanceof Float32Array)), n.setAttribute(s, p);
    }
    return n;
  }
  _assignVertexColorSpace(t, n) {
    if (n !== Cr) return;
    const o = new Dr();
    for (let l = 0, s = t.count; l < s; l++)
      o.fromBufferAttribute(t, l), sf.toWorkingColorSpace(o, Cr), t.setXYZ(l, o.r, o.g, o.b);
  }
  _loadLibrary(t, n) {
    const o = new pu(this.manager);
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
      const s = JE.toString(), a = [
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
function JE() {
  let e, t;
  onmessage = function(a) {
    const f = a.data;
    switch (f.type) {
      case "init":
        e = f.decoderConfig, t = new Promise(function(g) {
          e.onModuleLoaded = function(y) {
            g({ draco: y });
          }, DracoDecoderModule(e);
        });
        break;
      case "decode":
        const p = f.buffer, m = f.taskConfig;
        t.then((g) => {
          const y = g.draco, v = new y.Decoder();
          try {
            const _ = n(y, v, new Int8Array(p), m), k = _.attributes.map((R) => R.array.buffer);
            _.index && k.push(_.index.array.buffer), self.postMessage({ type: "decode", id: f.id, geometry: _ }, k);
          } catch (_) {
            console.error(_), self.postMessage({ type: "error", id: f.id, error: _.message });
          } finally {
            y.destroy(v);
          }
        });
        break;
    }
  };
  function n(a, f, p, m) {
    const g = m.attributeIDs, y = m.attributeTypes;
    let v, _;
    const k = f.GetEncodedGeometryType(p);
    if (k === a.TRIANGULAR_MESH)
      v = new a.Mesh(), _ = f.DecodeArrayToMesh(p, p.byteLength, v);
    else if (k === a.POINT_CLOUD)
      v = new a.PointCloud(), _ = f.DecodeArrayToPointCloud(p, p.byteLength, v);
    else
      throw new Error("THREE.DRACOLoader: Unexpected geometry type.");
    if (!_.ok() || v.ptr === 0)
      throw new Error("THREE.DRACOLoader: Decoding failed: " + _.error_msg());
    const R = { index: null, attributes: [] };
    for (const A in g) {
      const w = self[y[A]];
      let S, x;
      if (m.useUniqueIDs)
        x = g[A], S = f.GetAttributeByUniqueId(v, x);
      else {
        if (x = f.GetAttributeId(v, a[g[A]]), x === -1) continue;
        S = f.GetAttribute(v, x);
      }
      const C = l(a, f, v, A, w, S);
      A === "color" && (C.vertexColorSpace = m.vertexColorSpace), R.attributes.push(C);
    }
    return k === a.TRIANGULAR_MESH && (R.index = o(a, f, v)), a.destroy(v), R;
  }
  function o(a, f, p) {
    const g = p.num_faces() * 3, y = g * 4, v = a._malloc(y);
    f.GetTrianglesUInt32Array(p, y, v);
    const _ = new Uint32Array(a.HEAPF32.buffer, v, g).slice();
    return a._free(v), { array: _, itemSize: 1 };
  }
  function l(a, f, p, m, g, y) {
    const v = y.num_components(), k = p.num_points() * v, R = k * g.BYTES_PER_ELEMENT, A = s(a, g), w = a._malloc(R);
    f.GetAttributeDataArrayForAllPoints(p, y, A, R, w);
    const S = new g(a.HEAPF32.buffer, w, k).slice();
    return a._free(w), {
      name: m,
      array: S,
      itemSize: v
    };
  }
  function s(a, f) {
    switch (f) {
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
const E0 = new ZE();
E0.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
function qE({ path: e, onSize: t }) {
  const n = ep(hE, e, (s) => {
    s.setDRACOLoader(E0);
  }), { obj: o, size: l } = Q.useMemo(() => {
    const s = n.scene.clone(!0), a = new ce.Box3().setFromObject(s), f = a.getSize(new ce.Vector3());
    return s.position.sub(a.getCenter(new ce.Vector3())), s.position.y += f.y / 2, { obj: s, size: f };
  }, [n]);
  return Q.useLayoutEffect(() => {
    t(l);
  }, [l]), /* @__PURE__ */ O.jsx("primitive", { object: o });
}
function $E({ dims: e }) {
  const t = Q.useRef(null);
  yo(() => {
    t.current.rotation.y += 5e-3;
  });
  const [n, o, l] = [e.w / 10, e.h / 10, e.d / 10];
  return /* @__PURE__ */ O.jsxs("mesh", { ref: t, position: [0, o / 2, 0], children: [
    /* @__PURE__ */ O.jsx("boxGeometry", { args: [n, o, l] }),
    /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#2255aa", opacity: 0.55, transparent: !0 })
  ] });
}
function bE() {
  const e = Q.useRef(null);
  return yo(({ clock: t }) => {
    e.current.rotation.y = t.getElapsedTime() * 2;
  }), /* @__PURE__ */ O.jsxs("mesh", { ref: e, children: [
    /* @__PURE__ */ O.jsx("torusGeometry", { args: [12, 3, 8, 24] }),
    /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#ffd700", wireframe: !0 })
  ] });
}
const Pg = { type: "change" }, np = { type: "start" }, k0 = { type: "end" }, $s = new KS(), Cg = new QS(), e2 = Math.cos(70 * jg.DEG2RAD), Ve = new pt(), At = 2 * Math.PI, ye = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, ef = 1e-6;
class t2 extends VS {
  constructor(t, n = null) {
    super(t, n), this.state = ye.NONE, this.enabled = !0, this.target = new pt(), this.cursor = new pt(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: qi.ROTATE, MIDDLE: qi.DOLLY, RIGHT: qi.PAN }, this.touches = { ONE: ji.ROTATE, TWO: ji.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new pt(), this._lastQuaternion = new mu(), this._lastTargetPosition = new pt(), this._quat = new mu().setFromUnitVectors(t.up, new pt(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Zh(), this._sphericalDelta = new Zh(), this._scale = 1, this._panOffset = new pt(), this._rotateStart = new Wt(), this._rotateEnd = new Wt(), this._rotateDelta = new Wt(), this._panStart = new Wt(), this._panEnd = new Wt(), this._panDelta = new Wt(), this._dollyStart = new Wt(), this._dollyEnd = new Wt(), this._dollyDelta = new Wt(), this._dollyDirection = new pt(), this._mouse = new Wt(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = r2.bind(this), this._onPointerDown = n2.bind(this), this._onPointerUp = i2.bind(this), this._onContextMenu = f2.bind(this), this._onMouseWheel = s2.bind(this), this._onKeyDown = u2.bind(this), this._onTouchStart = a2.bind(this), this._onTouchMove = c2.bind(this), this._onMouseDown = o2.bind(this), this._onMouseMove = l2.bind(this), this._interceptControlDown = d2.bind(this), this._interceptControlUp = p2.bind(this), this.domElement !== null && this.connect(), this.update();
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(Pg), this.update(), this.state = ye.NONE;
  }
  update(t = null) {
    const n = this.object.position;
    Ve.copy(n).sub(this.target), Ve.applyQuaternion(this._quat), this._spherical.setFromVector3(Ve), this.autoRotate && this.state === ye.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let o = this.minAzimuthAngle, l = this.maxAzimuthAngle;
    isFinite(o) && isFinite(l) && (o < -Math.PI ? o += At : o > Math.PI && (o -= At), l < -Math.PI ? l += At : l > Math.PI && (l -= At), o <= l ? this._spherical.theta = Math.max(o, Math.min(l, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (o + l) / 2 ? Math.max(o, this._spherical.theta) : Math.min(l, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let s = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const a = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), s = a != this._spherical.radius;
    }
    if (Ve.setFromSpherical(this._spherical), Ve.applyQuaternion(this._quatInverse), n.copy(this.target).add(Ve), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let a = null;
      if (this.object.isPerspectiveCamera) {
        const f = Ve.length();
        a = this._clampDistance(f * this._scale);
        const p = f - a;
        this.object.position.addScaledVector(this._dollyDirection, p), this.object.updateMatrixWorld(), s = !!p;
      } else if (this.object.isOrthographicCamera) {
        const f = new pt(this._mouse.x, this._mouse.y, 0);
        f.unproject(this.object);
        const p = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), s = p !== this.object.zoom;
        const m = new pt(this._mouse.x, this._mouse.y, 0);
        m.unproject(this.object), this.object.position.sub(m).add(f), this.object.updateMatrixWorld(), a = Ve.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      a !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position) : ($s.origin.copy(this.object.position), $s.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot($s.direction)) < e2 ? this.object.lookAt(this.target) : (Cg.setFromNormalAndCoplanarPoint(this.object.up, this.target), $s.intersectPlane(Cg, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const a = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), a !== this.object.zoom && (this.object.updateProjectionMatrix(), s = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, s || this._lastPosition.distanceToSquared(this.object.position) > ef || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > ef || this._lastTargetPosition.distanceToSquared(this.target) > ef ? (this.dispatchEvent(Pg), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? At / 60 * this.autoRotateSpeed * t : At / 60 / 60 * this.autoRotateSpeed;
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
    Ve.setFromMatrixColumn(n, 0), Ve.multiplyScalar(-t), this._panOffset.add(Ve);
  }
  _panUp(t, n) {
    this.screenSpacePanning === !0 ? Ve.setFromMatrixColumn(n, 1) : (Ve.setFromMatrixColumn(n, 0), Ve.crossVectors(this.object.up, Ve)), Ve.multiplyScalar(t), this._panOffset.add(Ve);
  }
  // deltaX and deltaY are in pixels; right and down are positive
  _pan(t, n) {
    const o = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const l = this.object.position;
      Ve.copy(l).sub(this.target);
      let s = Ve.length();
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
    const o = this.domElement.getBoundingClientRect(), l = t - o.left, s = n - o.top, a = o.width, f = o.height;
    this._mouse.x = l / a * 2 - 1, this._mouse.y = -(s / f) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
    this._rotateLeft(At * this._rotateDelta.x / n.clientHeight), this._rotateUp(At * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
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
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateUp(At * this.rotateSpeed / this.domElement.clientHeight) : this._pan(0, this.keyPanSpeed), n = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateUp(-At * this.rotateSpeed / this.domElement.clientHeight) : this._pan(0, -this.keyPanSpeed), n = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateLeft(At * this.rotateSpeed / this.domElement.clientHeight) : this._pan(this.keyPanSpeed, 0), n = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateLeft(-At * this.rotateSpeed / this.domElement.clientHeight) : this._pan(-this.keyPanSpeed, 0), n = !0;
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
    this._rotateLeft(At * this._rotateDelta.x / n.clientHeight), this._rotateUp(At * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd);
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
    const a = (t.pageX + n.x) * 0.5, f = (t.pageY + n.y) * 0.5;
    this._updateZoomParameters(a, f);
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
    n === void 0 && (n = new Wt(), this._pointerPositions[t.pointerId] = n), n.set(t.pageX, t.pageY);
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
function n2(e) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e)));
}
function r2(e) {
  this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function i2(e) {
  switch (this._removePointer(e), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(e.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(k0), this.state = ye.NONE;
      break;
    case 1:
      const t = this._pointers[0], n = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: n.x, pageY: n.y });
      break;
  }
}
function o2(e) {
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
    case qi.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(e), this.state = ye.DOLLY;
      break;
    case qi.ROTATE:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = ye.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = ye.ROTATE;
      }
      break;
    case qi.PAN:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = ye.ROTATE;
      } else {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = ye.PAN;
      }
      break;
    default:
      this.state = ye.NONE;
  }
  this.state !== ye.NONE && this.dispatchEvent(np);
}
function l2(e) {
  switch (this.state) {
    case ye.ROTATE:
      if (this.enableRotate === !1) return;
      this._handleMouseMoveRotate(e);
      break;
    case ye.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseMoveDolly(e);
      break;
    case ye.PAN:
      if (this.enablePan === !1) return;
      this._handleMouseMovePan(e);
      break;
  }
}
function s2(e) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== ye.NONE || (e.preventDefault(), this.dispatchEvent(np), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(k0));
}
function u2(e) {
  this.enabled === !1 || this.enablePan === !1 || this._handleKeyDown(e);
}
function a2(e) {
  switch (this._trackPointer(e), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case ji.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(e), this.state = ye.TOUCH_ROTATE;
          break;
        case ji.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(e), this.state = ye.TOUCH_PAN;
          break;
        default:
          this.state = ye.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case ji.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(e), this.state = ye.TOUCH_DOLLY_PAN;
          break;
        case ji.DOLLY_ROTATE:
          if (this.enableZoom === !1 && this.enableRotate === !1) return;
          this._handleTouchStartDollyRotate(e), this.state = ye.TOUCH_DOLLY_ROTATE;
          break;
        default:
          this.state = ye.NONE;
      }
      break;
    default:
      this.state = ye.NONE;
  }
  this.state !== ye.NONE && this.dispatchEvent(np);
}
function c2(e) {
  switch (this._trackPointer(e), this.state) {
    case ye.TOUCH_ROTATE:
      if (this.enableRotate === !1) return;
      this._handleTouchMoveRotate(e), this.update();
      break;
    case ye.TOUCH_PAN:
      if (this.enablePan === !1) return;
      this._handleTouchMovePan(e), this.update();
      break;
    case ye.TOUCH_DOLLY_PAN:
      if (this.enableZoom === !1 && this.enablePan === !1) return;
      this._handleTouchMoveDollyPan(e), this.update();
      break;
    case ye.TOUCH_DOLLY_ROTATE:
      if (this.enableZoom === !1 && this.enableRotate === !1) return;
      this._handleTouchMoveDollyRotate(e), this.update();
      break;
    default:
      this.state = ye.NONE;
  }
}
function f2(e) {
  this.enabled !== !1 && e.preventDefault();
}
function d2(e) {
  e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function p2(e) {
  e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function h2({ size: e }) {
  const { camera: t, gl: n } = Qx(), o = Q.useRef(null);
  return Q.useEffect(() => {
    const l = new t2(t, n.domElement);
    return l.enableDamping = !0, l.dampingFactor = 0.08, l.autoRotate = !0, l.autoRotateSpeed = 1.5, o.current = l, () => l.dispose();
  }, [t, n]), Q.useEffect(() => {
    if (!o.current) return;
    const l = Math.max(e.x, e.y, e.z), s = t, a = ce.MathUtils.degToRad(s.fov), f = l / 2 / Math.tan(a / 2) * 1.9;
    t.position.set(f * 0.6, f * 0.5, f), s.near = Math.max(0.01, f * 0.01), s.far = f * 20, s.updateProjectionMatrix(), o.current.target.set(0, 0, 0), o.current.update();
  }, [e]), yo(() => {
    var l;
    return (l = o.current) == null ? void 0 : l.update();
  }), null;
}
const ln = 45, Sn = 47, Nt = 50, xe = 1.5, tf = Nt - xe * 2, nf = ln - xe * 2;
function m2({ actionState: e, onSize: t }) {
  const n = Q.useRef(null), o = e["freezer-toggle"] ?? !1;
  return Q.useLayoutEffect(() => {
    t(new ce.Vector3(Sn, Nt, ln));
  }, []), yo(() => {
    const l = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (l - n.current.rotation.y) * 0.12;
  }), // Centré sur X et Z, centré verticalement (décalage -FRZ_H/2)
  /* @__PURE__ */ O.jsxs("group", { position: [0, -Nt / 2, 0], children: [
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: xe,
        sy: Nt,
        sz: ln,
        x: -Sn / 2 + xe / 2,
        y: Nt / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: Sn,
        sy: xe,
        sz: ln,
        x: 0,
        y: Nt - xe / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: Sn,
        sy: xe,
        sz: ln,
        x: 0,
        y: xe / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: Sn - xe,
        sy: tf,
        sz: xe,
        x: xe / 2,
        y: Nt / 2,
        z: -ln / 2 + xe / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: Sn - xe,
        sy: tf,
        sz: xe,
        x: xe / 2,
        y: Nt / 2,
        z: ln / 2 - xe / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: 0.5,
        sy: tf,
        sz: nf,
        x: -Sn / 2 + xe + 0.25,
        y: Nt / 2,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: Sn - xe - 1,
        sy: xe,
        sz: nf,
        x: xe / 2 - 0.5,
        y: Nt * 0.35,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ O.jsx(
      Sr,
      {
        sx: Sn - xe - 1,
        sy: xe,
        sz: nf,
        x: xe / 2 - 0.5,
        y: Nt * 0.6,
        z: 0,
        col: "#dddddd"
      }
    ),
    [-1, 1].flatMap(
      (l) => [-1, 1].map((s) => /* @__PURE__ */ O.jsxs(
        "mesh",
        {
          position: [s * (Sn / 2 - 3), 1, l * (ln / 2 - 3)],
          children: [
            /* @__PURE__ */ O.jsx("cylinderGeometry", { args: [1.5, 1.5, 2, 8] }),
            /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
          ]
        },
        `${s}${l}`
      ))
    ),
    /* @__PURE__ */ O.jsxs("group", { ref: n, position: [Sn / 2, 0, -ln / 2], children: [
      /* @__PURE__ */ O.jsxs("mesh", { position: [0, Nt / 2, ln / 2], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [xe, Nt - 2, ln - xe] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.3, metalness: 0.2 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [xe / 2 + 0.9, Nt / 2, ln - 7], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [1.5, 25, 1.5] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function Sr({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: l,
  z: s,
  col: a
}) {
  return /* @__PURE__ */ O.jsxs("mesh", { position: [o, l, s], children: [
    /* @__PURE__ */ O.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: a, roughness: 0.3, metalness: 0.1 })
  ] });
}
const _e = 60, wn = 60, dt = 90, me = 1.5, Dn = 8, bs = 10, ni = 1.2, Rg = 6, Ii = 5 + ni + 1;
function g2({ actionState: e, onSize: t }) {
  const n = Q.useRef(null), o = e["fridge-toggle"] ?? !1;
  return Q.useLayoutEffect(() => {
    t(new ce.Vector3(_e, dt, wn));
  }, []), yo(() => {
    const l = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (l - n.current.rotation.y) * 0.12;
  }), // Centré en X/Z, centré verticalement
  /* @__PURE__ */ O.jsxs("group", { position: [0, -dt / 2, 0], children: [
    /* @__PURE__ */ O.jsx(jn, { sx: _e, sy: dt, sz: me, x: 0, y: dt / 2, z: wn / 2 - me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ O.jsx(jn, { sx: _e, sy: me, sz: wn, x: 0, y: dt - me / 2, z: 0, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ O.jsx(jn, { sx: _e, sy: me, sz: wn, x: 0, y: me / 2, z: 0, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ O.jsx(jn, { sx: me, sy: dt - me * 2, sz: wn - me, x: -_e / 2 + me / 2, y: dt / 2, z: -me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ O.jsx(jn, { sx: me, sy: dt - me * 2, sz: wn - me, x: _e / 2 - me / 2, y: dt / 2, z: -me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ O.jsx(jn, { sx: _e - me * 2, sy: dt - me * 2, sz: 0.5, x: 0, y: dt / 2, z: wn / 2 - me - 0.3, col: "#e0e0e0" }),
    /* @__PURE__ */ O.jsx(jn, { sx: _e - me * 2 - 2, sy: me, sz: wn - me * 2, x: 0, y: dt * 0.35, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ O.jsx(jn, { sx: _e - me * 2 - 2, sy: me, sz: wn - me * 2, x: 0, y: dt * 0.62, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ O.jsx(jn, { sx: _e - me * 2 - 4, sy: 10, sz: wn - me * 2 - 4, x: 0, y: me + 5, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ O.jsxs("group", { ref: n, position: [-_e / 2, 0, -wn / 2], children: [
      /* @__PURE__ */ O.jsx(jn, { sx: _e - 2, sy: dt - 2, sz: Dn, x: _e / 2, y: dt / 2, z: Dn / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e - 10, dt * 0.6, -1.5], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [1.5, 30, 2.5] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.2 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, Ii + ni / 2, Dn + bs / 2], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [_e - 8, ni, bs] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, Ii + ni + Rg / 2, Dn + 0.6], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [_e - 8, Rg, 1.2] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, 56 + ni / 2, Dn + bs / 2], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [_e - 8, ni, bs] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, 56 + ni + 2, Dn + 0.6], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [_e - 8, 4, 1.2] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, Ii + 22, Dn + 5], children: [
        /* @__PURE__ */ O.jsx("cylinderGeometry", { args: [3.8, 4.5, 44, 20] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.3, transparent: !0, opacity: 0.88 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, Ii + 22, Dn + 5], children: [
        /* @__PURE__ */ O.jsx("cylinderGeometry", { args: [4.51, 4.51, 20, 20] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#ff8c00", roughness: 0.3 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, Ii + 44 + 2, Dn + 5], children: [
        /* @__PURE__ */ O.jsx("cylinderGeometry", { args: [2, 3.5, 4, 16] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.3, transparent: !0, opacity: 0.88 })
      ] }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_e / 2, Ii + 44 + 4 + 1, Dn + 5], children: [
        /* @__PURE__ */ O.jsx("cylinderGeometry", { args: [2.2, 2.2, 2, 16] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#ffcc00", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function jn({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: l,
  z: s,
  col: a,
  r: f = 0.3,
  m: p = 0.1
}) {
  return /* @__PURE__ */ O.jsxs("mesh", { position: [o, l, s], children: [
    /* @__PURE__ */ O.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: a, roughness: f, metalness: p })
  ] });
}
const _n = 40, wr = 60, Lt = 90, Fe = 1.5, Ag = 1.5;
function y2({ actionState: e, onSize: t }) {
  const n = Q.useRef(null), o = e["cabinet-toggle"] ?? !1;
  return Q.useLayoutEffect(() => {
    t(new ce.Vector3(_n, Lt, wr));
  }, []), yo(() => {
    const l = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (l - n.current.rotation.y) * 0.12;
  }), // Centré en X/Z, centré verticalement
  /* @__PURE__ */ O.jsxs("group", { position: [0, -Lt / 2, 0], children: [
    /* @__PURE__ */ O.jsx(br, { sx: _n, sy: Lt, sz: Fe, x: 0, y: Lt / 2, z: wr / 2 - Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ O.jsx(br, { sx: _n, sy: Fe, sz: wr, x: 0, y: Fe / 2, z: 0, col: "#ffffff" }),
    /* @__PURE__ */ O.jsx(br, { sx: Fe, sy: Lt - Fe * 2, sz: wr - Fe, x: -_n / 2 + Fe / 2, y: Lt / 2, z: -Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ O.jsx(br, { sx: Fe, sy: Lt - Fe * 2, sz: wr - Fe, x: _n / 2 - Fe / 2, y: Lt / 2, z: -Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ O.jsx(br, { sx: _n - Fe * 2, sy: Lt - Fe * 2, sz: 0.5, x: 0, y: Lt / 2, z: wr / 2 - Fe - 0.3, col: "#eeeeee" }),
    /* @__PURE__ */ O.jsx(br, { sx: _n - Fe * 2 - 2, sy: Fe, sz: wr - Fe * 2, x: 0, y: Lt * 0.3, z: -Fe / 2, col: "#eeeeee" }),
    /* @__PURE__ */ O.jsxs("group", { ref: n, position: [-_n / 2, 0, -wr / 2], children: [
      /* @__PURE__ */ O.jsx(br, { sx: _n - 2, sy: Lt - 2, sz: Ag, x: _n / 2, y: Lt / 2, z: Ag / 2, col: "#ffffff" }),
      /* @__PURE__ */ O.jsxs("mesh", { position: [_n - 8, Lt / 2, -1.5], children: [
        /* @__PURE__ */ O.jsx("boxGeometry", { args: [1.5, 15, 2] }),
        /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.2 })
      ] })
    ] })
  ] });
}
function br({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: l,
  z: s,
  col: a
}) {
  return /* @__PURE__ */ O.jsxs("mesh", { position: [o, l, s], children: [
    /* @__PURE__ */ O.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ O.jsx("meshStandardMaterial", { color: a, roughness: 0.35, metalness: 0 })
  ] });
}
const v2 = {
  freezer: m2,
  fridge: g2,
  "cabinet-wood": y2
}, S2 = {
  "freezer-toggle": ["Ouvrir", "Fermer"],
  "fridge-toggle": ["Ouvrir", "Fermer"],
  "cabinet-toggle": ["Ouvrir", "Fermer"]
};
function w2({ item: e, actionState: t }) {
  const [n, o] = Q.useState(null), l = Q.useMemo(() => {
    const a = (e == null ? void 0 : e.dims) ?? { w: 50, h: 50, d: 50 };
    return new ce.Vector3(a.w / 10, a.h / 10, a.d / 10);
  }, []), s = e != null && e.id ? v2[e.id] : void 0;
  return /* @__PURE__ */ O.jsxs(O.Fragment, { children: [
    /* @__PURE__ */ O.jsx("ambientLight", { intensity: 0.7 }),
    /* @__PURE__ */ O.jsx("directionalLight", { position: [200, 400, 300], intensity: 1.3 }),
    /* @__PURE__ */ O.jsx("directionalLight", { position: [-150, 80, -200], intensity: 0.4 }),
    /* @__PURE__ */ O.jsx(h2, { size: n ?? l }),
    s ? (
      // Composant TSX dédié (géométrie procédurale + interactivité)
      /* @__PURE__ */ O.jsx(s, { item: e, actionState: t, onSize: o })
    ) : e != null && e.glbPath ? (
      // Chargement GLB générique
      /* @__PURE__ */ O.jsx(Q.Suspense, { fallback: /* @__PURE__ */ O.jsx(bE, {}), children: /* @__PURE__ */ O.jsx(qE, { path: e.glbPath, onSize: o }) })
    ) : e ? (
      // Fallback : boîte aux dimensions de l'inventaire
      /* @__PURE__ */ O.jsx($E, { dims: e.dims })
    ) : null
  ] });
}
function _2({ item: e, onAction: t }) {
  var s;
  const [n, o] = Q.useState({});
  Q.useEffect(() => {
    o({});
  }, [e == null ? void 0 : e.id]);
  const l = (a) => {
    o((f) => ({ ...f, [a]: !f[a] })), t == null || t(a);
  };
  return /* @__PURE__ */ O.jsxs("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#111118",
    fontFamily: "'Segoe UI', sans-serif"
  }, children: [
    /* @__PURE__ */ O.jsx("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ O.jsx(
      pE,
      {
        style: { width: "100%", height: "100%" },
        camera: { position: [0, 50, 200], fov: 45 },
        gl: { antialias: !0 },
        children: /* @__PURE__ */ O.jsx(
          w2,
          {
            item: e,
            actionState: n
          },
          (e == null ? void 0 : e.id) ?? "__empty__"
        )
      }
    ) }),
    /* @__PURE__ */ O.jsx("div", { style: {
      fontSize: 11,
      color: "#888",
      textAlign: "center",
      padding: "6px 8px",
      minHeight: 32
    }, children: e ? /* @__PURE__ */ O.jsxs(O.Fragment, { children: [
      /* @__PURE__ */ O.jsx("strong", { style: { color: "#fff" }, children: e.name }),
      e.dims && /* @__PURE__ */ O.jsxs("span", { style: { color: "#666", marginLeft: 6, fontFamily: "monospace" }, children: [
        e.dims.w,
        " × ",
        e.dims.d,
        " × ",
        e.dims.h,
        " cm"
      ] })
    ] }) : "Clique sur un objet" }),
    (s = e == null ? void 0 : e.actions) != null && s.length ? /* @__PURE__ */ O.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 8px 8px" }, children: e.actions.map((a) => {
      const [f, p] = S2[a] ?? [a, a], m = n[a] ?? !1;
      return /* @__PURE__ */ O.jsx(
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
          children: m ? p : f
        },
        a
      );
    }) }) : null
  ] });
}
const Bu = /* @__PURE__ */ new WeakMap();
function E2(e, t, n) {
  let o = Bu.get(e);
  o || (o = qv(e), Bu.set(e, o)), o.render(/* @__PURE__ */ O.jsx(_2, { item: t, onAction: n }));
}
function k2(e) {
  const t = Bu.get(e);
  t && (t.unmount(), Bu.delete(e));
}
export {
  E2 as mountPreview,
  k2 as unmountPreview
};
