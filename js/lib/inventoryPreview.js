import * as se from "three";
import { TrianglesDrawMode as ZS, TriangleFanDrawMode as zf, TriangleStripDrawMode as cy, Loader as fy, LoaderUtils as Cs, FileLoader as Gu, MeshPhysicalMaterial as Jn, Vector2 as Qt, Color as Kr, LinearSRGBColorSpace as Zn, SRGBColorSpace as Or, SpotLight as JS, PointLight as qS, DirectionalLight as $S, Matrix4 as Wu, Vector3 as pt, Quaternion as Vu, InstancedMesh as bS, InstancedBufferAttribute as ew, Object3D as dy, TextureLoader as tw, ImageBitmapLoader as nw, BufferAttribute as Rs, InterleavedBuffer as rw, InterleavedBufferAttribute as iw, LinearMipmapLinearFilter as py, NearestMipmapLinearFilter as ow, LinearMipmapNearestFilter as sw, NearestMipmapNearestFilter as lw, LinearFilter as If, NearestFilter as hy, RepeatWrapping as Of, MirroredRepeatWrapping as uw, ClampToEdgeWrapping as aw, PointsMaterial as cw, Material as Wc, LineBasicMaterial as fw, MeshStandardMaterial as my, DoubleSide as dw, MeshBasicMaterial as ws, PropertyBinding as pw, BufferGeometry as gy, SkinnedMesh as hw, Mesh as mw, LineSegments as gw, Line as yw, LineLoop as vw, Points as Sw, Group as Vc, PerspectiveCamera as ww, MathUtils as yy, OrthographicCamera as xw, Skeleton as _w, AnimationClip as Ew, Bone as Tw, InterpolateDiscrete as kw, InterpolateLinear as vy, Texture as xm, VectorKeyframeTrack as _m, NumberKeyframeTrack as Em, QuaternionKeyframeTrack as Tm, ColorManagement as Df, FrontSide as Pw, Interpolant as Cw, Box3 as Rw, Sphere as Lw, Controls as Aw, MOUSE as vo, TOUCH as no, Spherical as km, Ray as Mw, Plane as Nw } from "three";
function jw(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Sy = { exports: {} }, ya = {}, wy = { exports: {} }, ae = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nl = Symbol.for("react.element"), zw = Symbol.for("react.portal"), Iw = Symbol.for("react.fragment"), Ow = Symbol.for("react.strict_mode"), Dw = Symbol.for("react.profiler"), Fw = Symbol.for("react.provider"), Uw = Symbol.for("react.context"), Hw = Symbol.for("react.forward_ref"), Bw = Symbol.for("react.suspense"), Gw = Symbol.for("react.memo"), Ww = Symbol.for("react.lazy"), Pm = Symbol.iterator;
function Vw(e) {
  return e === null || typeof e != "object" ? null : (e = Pm && e[Pm] || e["@@iterator"], typeof e == "function" ? e : null);
}
var xy = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, _y = Object.assign, Ey = {};
function Io(e, t, n) {
  this.props = e, this.context = t, this.refs = Ey, this.updater = n || xy;
}
Io.prototype.isReactComponent = {};
Io.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Io.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function Ty() {
}
Ty.prototype = Io.prototype;
function Id(e, t, n) {
  this.props = e, this.context = t, this.refs = Ey, this.updater = n || xy;
}
var Od = Id.prototype = new Ty();
Od.constructor = Id;
_y(Od, Io.prototype);
Od.isPureReactComponent = !0;
var Cm = Array.isArray, ky = Object.prototype.hasOwnProperty, Dd = { current: null }, Py = { key: !0, ref: !0, __self: !0, __source: !0 };
function Cy(e, t, n) {
  var o, s = {}, l = null, a = null;
  if (t != null) for (o in t.ref !== void 0 && (a = t.ref), t.key !== void 0 && (l = "" + t.key), t) ky.call(t, o) && !Py.hasOwnProperty(o) && (s[o] = t[o]);
  var f = arguments.length - 2;
  if (f === 1) s.children = n;
  else if (1 < f) {
    for (var p = Array(f), m = 0; m < f; m++) p[m] = arguments[m + 2];
    s.children = p;
  }
  if (e && e.defaultProps) for (o in f = e.defaultProps, f) s[o] === void 0 && (s[o] = f[o]);
  return { $$typeof: nl, type: e, key: l, ref: a, props: s, _owner: Dd.current };
}
function Kw(e, t) {
  return { $$typeof: nl, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Fd(e) {
  return typeof e == "object" && e !== null && e.$$typeof === nl;
}
function Qw(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var Rm = /\/+/g;
function Kc(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? Qw("" + e.key) : t.toString(36);
}
function Pu(e, t, n, o, s) {
  var l = typeof e;
  (l === "undefined" || l === "boolean") && (e = null);
  var a = !1;
  if (e === null) a = !0;
  else switch (l) {
    case "string":
    case "number":
      a = !0;
      break;
    case "object":
      switch (e.$$typeof) {
        case nl:
        case zw:
          a = !0;
      }
  }
  if (a) return a = e, s = s(a), e = o === "" ? "." + Kc(a, 0) : o, Cm(s) ? (n = "", e != null && (n = e.replace(Rm, "$&/") + "/"), Pu(s, t, n, "", function(m) {
    return m;
  })) : s != null && (Fd(s) && (s = Kw(s, n + (!s.key || a && a.key === s.key ? "" : ("" + s.key).replace(Rm, "$&/") + "/") + e)), t.push(s)), 1;
  if (a = 0, o = o === "" ? "." : o + ":", Cm(e)) for (var f = 0; f < e.length; f++) {
    l = e[f];
    var p = o + Kc(l, f);
    a += Pu(l, t, n, p, s);
  }
  else if (p = Vw(e), typeof p == "function") for (e = p.call(e), f = 0; !(l = e.next()).done; ) l = l.value, p = o + Kc(l, f++), a += Pu(l, t, n, p, s);
  else if (l === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return a;
}
function iu(e, t, n) {
  if (e == null) return e;
  var o = [], s = 0;
  return Pu(e, o, "", "", function(l) {
    return t.call(n, l, s++);
  }), o;
}
function Xw(e) {
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
var xt = { current: null }, Cu = { transition: null }, Yw = { ReactCurrentDispatcher: xt, ReactCurrentBatchConfig: Cu, ReactCurrentOwner: Dd };
function Ry() {
  throw Error("act(...) is not supported in production builds of React.");
}
ae.Children = { map: iu, forEach: function(e, t, n) {
  iu(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return iu(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return iu(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!Fd(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
ae.Component = Io;
ae.Fragment = Iw;
ae.Profiler = Dw;
ae.PureComponent = Id;
ae.StrictMode = Ow;
ae.Suspense = Bw;
ae.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Yw;
ae.act = Ry;
ae.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var o = _y({}, e.props), s = e.key, l = e.ref, a = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (l = t.ref, a = Dd.current), t.key !== void 0 && (s = "" + t.key), e.type && e.type.defaultProps) var f = e.type.defaultProps;
    for (p in t) ky.call(t, p) && !Py.hasOwnProperty(p) && (o[p] = t[p] === void 0 && f !== void 0 ? f[p] : t[p]);
  }
  var p = arguments.length - 2;
  if (p === 1) o.children = n;
  else if (1 < p) {
    f = Array(p);
    for (var m = 0; m < p; m++) f[m] = arguments[m + 2];
    o.children = f;
  }
  return { $$typeof: nl, type: e.type, key: s, ref: l, props: o, _owner: a };
};
ae.createContext = function(e) {
  return e = { $$typeof: Uw, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: Fw, _context: e }, e.Consumer = e;
};
ae.createElement = Cy;
ae.createFactory = function(e) {
  var t = Cy.bind(null, e);
  return t.type = e, t;
};
ae.createRef = function() {
  return { current: null };
};
ae.forwardRef = function(e) {
  return { $$typeof: Hw, render: e };
};
ae.isValidElement = Fd;
ae.lazy = function(e) {
  return { $$typeof: Ww, _payload: { _status: -1, _result: e }, _init: Xw };
};
ae.memo = function(e, t) {
  return { $$typeof: Gw, type: e, compare: t === void 0 ? null : t };
};
ae.startTransition = function(e) {
  var t = Cu.transition;
  Cu.transition = {};
  try {
    e();
  } finally {
    Cu.transition = t;
  }
};
ae.unstable_act = Ry;
ae.useCallback = function(e, t) {
  return xt.current.useCallback(e, t);
};
ae.useContext = function(e) {
  return xt.current.useContext(e);
};
ae.useDebugValue = function() {
};
ae.useDeferredValue = function(e) {
  return xt.current.useDeferredValue(e);
};
ae.useEffect = function(e, t) {
  return xt.current.useEffect(e, t);
};
ae.useId = function() {
  return xt.current.useId();
};
ae.useImperativeHandle = function(e, t, n) {
  return xt.current.useImperativeHandle(e, t, n);
};
ae.useInsertionEffect = function(e, t) {
  return xt.current.useInsertionEffect(e, t);
};
ae.useLayoutEffect = function(e, t) {
  return xt.current.useLayoutEffect(e, t);
};
ae.useMemo = function(e, t) {
  return xt.current.useMemo(e, t);
};
ae.useReducer = function(e, t, n) {
  return xt.current.useReducer(e, t, n);
};
ae.useRef = function(e) {
  return xt.current.useRef(e);
};
ae.useState = function(e) {
  return xt.current.useState(e);
};
ae.useSyncExternalStore = function(e, t, n) {
  return xt.current.useSyncExternalStore(e, t, n);
};
ae.useTransition = function() {
  return xt.current.useTransition();
};
ae.version = "18.3.1";
wy.exports = ae;
var W = wy.exports;
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Zw = W, Jw = Symbol.for("react.element"), qw = Symbol.for("react.fragment"), $w = Object.prototype.hasOwnProperty, bw = Zw.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, ex = { key: !0, ref: !0, __self: !0, __source: !0 };
function Ly(e, t, n) {
  var o, s = {}, l = null, a = null;
  n !== void 0 && (l = "" + n), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (a = t.ref);
  for (o in t) $w.call(t, o) && !ex.hasOwnProperty(o) && (s[o] = t[o]);
  if (e && e.defaultProps) for (o in t = e.defaultProps, t) s[o] === void 0 && (s[o] = t[o]);
  return { $$typeof: Jw, type: e, key: l, ref: a, props: s, _owner: bw.current };
}
ya.Fragment = qw;
ya.jsx = Ly;
ya.jsxs = Ly;
Sy.exports = ya;
var T = Sy.exports, Ay = { exports: {} }, qt = {}, My = { exports: {} }, Ny = {};
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
      if (0 < s(te, U)) N[Y] = U, N[F] = te, F = Y;
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
      e: for (var Y = 0, te = N.length, ce = te >>> 1; Y < ce; ) {
        var ze = 2 * (Y + 1) - 1, it = N[ze], Xe = ze + 1, bt = N[Xe];
        if (0 > s(it, F)) Xe < te && 0 > s(bt, it) ? (N[Y] = bt, N[Xe] = F, Y = Xe) : (N[Y] = it, N[ze] = F, Y = ze);
        else if (Xe < te && 0 > s(bt, F)) N[Y] = bt, N[Xe] = F, Y = Xe;
        else break e;
      }
    }
    return U;
  }
  function s(N, U) {
    var F = N.sortIndex - U.sortIndex;
    return F !== 0 ? F : N.id - U.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var l = performance;
    e.unstable_now = function() {
      return l.now();
    };
  } else {
    var a = Date, f = a.now();
    e.unstable_now = function() {
      return a.now() - f;
    };
  }
  var p = [], m = [], g = 1, y = null, v = 3, x = !1, k = !1, L = !1, A = typeof setTimeout == "function" ? setTimeout : null, w = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function _(N) {
    for (var U = n(m); U !== null; ) {
      if (U.callback === null) o(m);
      else if (U.startTime <= N) o(m), U.sortIndex = U.expirationTime, t(p, U);
      else break;
      U = n(m);
    }
  }
  function R(N) {
    if (L = !1, _(N), !k) if (n(p) !== null) k = !0, be(I);
    else {
      var U = n(m);
      U !== null && Tt(R, U.startTime - N);
    }
  }
  function I(N, U) {
    k = !1, L && (L = !1, w(B), B = -1), x = !0;
    var F = v;
    try {
      for (_(U), y = n(p); y !== null && (!(y.expirationTime > U) || N && !Q()); ) {
        var Y = y.callback;
        if (typeof Y == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = Y(y.expirationTime <= U);
          U = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && o(p), _(U);
        } else o(p);
        y = n(p);
      }
      if (y !== null) var ce = !0;
      else {
        var ze = n(m);
        ze !== null && Tt(R, ze.startTime - U), ce = !1;
      }
      return ce;
    } finally {
      y = null, v = F, x = !1;
    }
  }
  var O = !1, D = null, B = -1, q = 5, V = -1;
  function Q() {
    return !(e.unstable_now() - V < q);
  }
  function le() {
    if (D !== null) {
      var N = e.unstable_now();
      V = N;
      var U = !0;
      try {
        U = D(!0, N);
      } finally {
        U ? Se() : (O = !1, D = null);
      }
    } else O = !1;
  }
  var Se;
  if (typeof S == "function") Se = function() {
    S(le);
  };
  else if (typeof MessageChannel < "u") {
    var Et = new MessageChannel(), Ht = Et.port2;
    Et.port1.onmessage = le, Se = function() {
      Ht.postMessage(null);
    };
  } else Se = function() {
    A(le, 0);
  };
  function be(N) {
    D = N, O || (O = !0, Se());
  }
  function Tt(N, U) {
    B = A(function() {
      N(e.unstable_now());
    }, U);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    k || x || (k = !0, be(I));
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
    return te = F + te, N = { id: g++, callback: U, priorityLevel: N, startTime: F, expirationTime: te, sortIndex: -1 }, F > Y ? (N.sortIndex = F, t(m, N), n(p) === null && N === n(m) && (L ? (w(B), B = -1) : L = !0, Tt(R, F - Y))) : (N.sortIndex = te, t(p, N), k || x || (k = !0, be(I))), N;
  }, e.unstable_shouldYield = Q, e.unstable_wrapCallback = function(N) {
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
})(Ny);
My.exports = Ny;
var tx = My.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nx = W, Jt = tx;
function H(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var jy = /* @__PURE__ */ new Set(), Fs = {};
function Ni(e, t) {
  Po(e, t), Po(e + "Capture", t);
}
function Po(e, t) {
  for (Fs[e] = t, e = 0; e < t.length; e++) jy.add(t[e]);
}
var fr = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Ff = Object.prototype.hasOwnProperty, rx = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Lm = {}, Am = {};
function ix(e) {
  return Ff.call(Am, e) ? !0 : Ff.call(Lm, e) ? !1 : rx.test(e) ? Am[e] = !0 : (Lm[e] = !0, !1);
}
function ox(e, t, n, o) {
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
function sx(e, t, n, o) {
  if (t === null || typeof t > "u" || ox(e, t, n, o)) return !0;
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
function _t(e, t, n, o, s, l, a) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = o, this.attributeNamespace = s, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = l, this.removeEmptyString = a;
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
var Ud = /[\-:]([a-z])/g;
function Hd(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    Ud,
    Hd
  );
  rt[t] = new _t(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(Ud, Hd);
  rt[t] = new _t(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(Ud, Hd);
  rt[t] = new _t(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  rt[e] = new _t(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
rt.xlinkHref = new _t("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  rt[e] = new _t(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Bd(e, t, n, o) {
  var s = rt.hasOwnProperty(t) ? rt[t] : null;
  (s !== null ? s.type !== 0 : o || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (sx(t, n, s, o) && (n = null), o || s === null ? ix(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : s.mustUseProperty ? e[s.propertyName] = n === null ? s.type === 3 ? !1 : "" : n : (t = s.attributeName, o = s.attributeNamespace, n === null ? e.removeAttribute(t) : (s = s.type, n = s === 3 || s === 4 && n === !0 ? "" : "" + n, o ? e.setAttributeNS(o, t, n) : e.setAttribute(t, n))));
}
var mr = nx.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, ou = Symbol.for("react.element"), ro = Symbol.for("react.portal"), io = Symbol.for("react.fragment"), Gd = Symbol.for("react.strict_mode"), Uf = Symbol.for("react.profiler"), zy = Symbol.for("react.provider"), Iy = Symbol.for("react.context"), Wd = Symbol.for("react.forward_ref"), Hf = Symbol.for("react.suspense"), Bf = Symbol.for("react.suspense_list"), Vd = Symbol.for("react.memo"), Ar = Symbol.for("react.lazy"), Oy = Symbol.for("react.offscreen"), Mm = Symbol.iterator;
function ls(e) {
  return e === null || typeof e != "object" ? null : (e = Mm && e[Mm] || e["@@iterator"], typeof e == "function" ? e : null);
}
var je = Object.assign, Qc;
function xs(e) {
  if (Qc === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    Qc = t && t[1] || "";
  }
  return `
` + Qc + e;
}
var Xc = !1;
function Yc(e, t) {
  if (!e || Xc) return "";
  Xc = !0;
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
      for (var s = m.stack.split(`
`), l = o.stack.split(`
`), a = s.length - 1, f = l.length - 1; 1 <= a && 0 <= f && s[a] !== l[f]; ) f--;
      for (; 1 <= a && 0 <= f; a--, f--) if (s[a] !== l[f]) {
        if (a !== 1 || f !== 1)
          do
            if (a--, f--, 0 > f || s[a] !== l[f]) {
              var p = `
` + s[a].replace(" at new ", " at ");
              return e.displayName && p.includes("<anonymous>") && (p = p.replace("<anonymous>", e.displayName)), p;
            }
          while (1 <= a && 0 <= f);
        break;
      }
    }
  } finally {
    Xc = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? xs(e) : "";
}
function lx(e) {
  switch (e.tag) {
    case 5:
      return xs(e.type);
    case 16:
      return xs("Lazy");
    case 13:
      return xs("Suspense");
    case 19:
      return xs("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = Yc(e.type, !1), e;
    case 11:
      return e = Yc(e.type.render, !1), e;
    case 1:
      return e = Yc(e.type, !0), e;
    default:
      return "";
  }
}
function Gf(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case io:
      return "Fragment";
    case ro:
      return "Portal";
    case Uf:
      return "Profiler";
    case Gd:
      return "StrictMode";
    case Hf:
      return "Suspense";
    case Bf:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Iy:
      return (e.displayName || "Context") + ".Consumer";
    case zy:
      return (e._context.displayName || "Context") + ".Provider";
    case Wd:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case Vd:
      return t = e.displayName || null, t !== null ? t : Gf(e.type) || "Memo";
    case Ar:
      t = e._payload, e = e._init;
      try {
        return Gf(e(t));
      } catch {
      }
  }
  return null;
}
function ux(e) {
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
      return Gf(t);
    case 8:
      return t === Gd ? "StrictMode" : "Mode";
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
function Qr(e) {
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
function Dy(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function ax(e) {
  var t = Dy(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), o = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var s = n.get, l = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return s.call(this);
    }, set: function(a) {
      o = "" + a, l.call(this, a);
    } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
      return o;
    }, setValue: function(a) {
      o = "" + a;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function su(e) {
  e._valueTracker || (e._valueTracker = ax(e));
}
function Fy(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), o = "";
  return e && (o = Dy(e) ? e.checked ? "true" : "false" : e.value), e = o, e !== n ? (t.setValue(e), !0) : !1;
}
function Ku(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Wf(e, t) {
  var n = t.checked;
  return je({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function Nm(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, o = t.checked != null ? t.checked : t.defaultChecked;
  n = Qr(t.value != null ? t.value : n), e._wrapperState = { initialChecked: o, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Uy(e, t) {
  t = t.checked, t != null && Bd(e, "checked", t, !1);
}
function Vf(e, t) {
  Uy(e, t);
  var n = Qr(t.value), o = t.type;
  if (n != null) o === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (o === "submit" || o === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? Kf(e, t.type, n) : t.hasOwnProperty("defaultValue") && Kf(e, t.type, Qr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function jm(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var o = t.type;
    if (!(o !== "submit" && o !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function Kf(e, t, n) {
  (t !== "number" || Ku(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var _s = Array.isArray;
function So(e, t, n, o) {
  if (e = e.options, t) {
    t = {};
    for (var s = 0; s < n.length; s++) t["$" + n[s]] = !0;
    for (n = 0; n < e.length; n++) s = t.hasOwnProperty("$" + e[n].value), e[n].selected !== s && (e[n].selected = s), s && o && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + Qr(n), t = null, s = 0; s < e.length; s++) {
      if (e[s].value === n) {
        e[s].selected = !0, o && (e[s].defaultSelected = !0);
        return;
      }
      t !== null || e[s].disabled || (t = e[s]);
    }
    t !== null && (t.selected = !0);
  }
}
function Qf(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(H(91));
  return je({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function zm(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(H(92));
      if (_s(n)) {
        if (1 < n.length) throw Error(H(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: Qr(n) };
}
function Hy(e, t) {
  var n = Qr(t.value), o = Qr(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), o != null && (e.defaultValue = "" + o);
}
function Im(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function By(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function Xf(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? By(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var lu, Gy = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, o, s) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, o, s);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (lu = lu || document.createElement("div"), lu.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = lu.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function Us(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Ls = {
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
}, cx = ["Webkit", "ms", "Moz", "O"];
Object.keys(Ls).forEach(function(e) {
  cx.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), Ls[t] = Ls[e];
  });
});
function Wy(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Ls.hasOwnProperty(e) && Ls[e] ? ("" + t).trim() : t + "px";
}
function Vy(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var o = n.indexOf("--") === 0, s = Wy(n, t[n], o);
    n === "float" && (n = "cssFloat"), o ? e.setProperty(n, s) : e[n] = s;
  }
}
var fx = je({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function Yf(e, t) {
  if (t) {
    if (fx[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(H(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(H(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(H(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(H(62));
  }
}
function Zf(e, t) {
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
var Jf = null;
function Kd(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var qf = null, wo = null, xo = null;
function Om(e) {
  if (e = ol(e)) {
    if (typeof qf != "function") throw Error(H(280));
    var t = e.stateNode;
    t && (t = _a(t), qf(e.stateNode, e.type, t));
  }
}
function Ky(e) {
  wo ? xo ? xo.push(e) : xo = [e] : wo = e;
}
function Qy() {
  if (wo) {
    var e = wo, t = xo;
    if (xo = wo = null, Om(e), t) for (e = 0; e < t.length; e++) Om(t[e]);
  }
}
function Xy(e, t) {
  return e(t);
}
function Yy() {
}
var Zc = !1;
function Zy(e, t, n) {
  if (Zc) return e(t, n);
  Zc = !0;
  try {
    return Xy(e, t, n);
  } finally {
    Zc = !1, (wo !== null || xo !== null) && (Yy(), Qy());
  }
}
function Hs(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var o = _a(n);
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
var $f = !1;
if (fr) try {
  var us = {};
  Object.defineProperty(us, "passive", { get: function() {
    $f = !0;
  } }), window.addEventListener("test", us, us), window.removeEventListener("test", us, us);
} catch {
  $f = !1;
}
function dx(e, t, n, o, s, l, a, f, p) {
  var m = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, m);
  } catch (g) {
    this.onError(g);
  }
}
var As = !1, Qu = null, Xu = !1, bf = null, px = { onError: function(e) {
  As = !0, Qu = e;
} };
function hx(e, t, n, o, s, l, a, f, p) {
  As = !1, Qu = null, dx.apply(px, arguments);
}
function mx(e, t, n, o, s, l, a, f, p) {
  if (hx.apply(this, arguments), As) {
    if (As) {
      var m = Qu;
      As = !1, Qu = null;
    } else throw Error(H(198));
    Xu || (Xu = !0, bf = m);
  }
}
function ji(e) {
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
function Jy(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function Dm(e) {
  if (ji(e) !== e) throw Error(H(188));
}
function gx(e) {
  var t = e.alternate;
  if (!t) {
    if (t = ji(e), t === null) throw Error(H(188));
    return t !== e ? null : e;
  }
  for (var n = e, o = t; ; ) {
    var s = n.return;
    if (s === null) break;
    var l = s.alternate;
    if (l === null) {
      if (o = s.return, o !== null) {
        n = o;
        continue;
      }
      break;
    }
    if (s.child === l.child) {
      for (l = s.child; l; ) {
        if (l === n) return Dm(s), e;
        if (l === o) return Dm(s), t;
        l = l.sibling;
      }
      throw Error(H(188));
    }
    if (n.return !== o.return) n = s, o = l;
    else {
      for (var a = !1, f = s.child; f; ) {
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
      if (!a) {
        for (f = l.child; f; ) {
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
        if (!a) throw Error(H(189));
      }
    }
    if (n.alternate !== o) throw Error(H(190));
  }
  if (n.tag !== 3) throw Error(H(188));
  return n.stateNode.current === n ? e : t;
}
function qy(e) {
  return e = gx(e), e !== null ? $y(e) : null;
}
function $y(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = $y(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var by = Jt.unstable_scheduleCallback, Fm = Jt.unstable_cancelCallback, yx = Jt.unstable_shouldYield, vx = Jt.unstable_requestPaint, Ue = Jt.unstable_now, Sx = Jt.unstable_getCurrentPriorityLevel, Qd = Jt.unstable_ImmediatePriority, e0 = Jt.unstable_UserBlockingPriority, Yu = Jt.unstable_NormalPriority, wx = Jt.unstable_LowPriority, t0 = Jt.unstable_IdlePriority, va = null, Xn = null;
function xx(e) {
  if (Xn && typeof Xn.onCommitFiberRoot == "function") try {
    Xn.onCommitFiberRoot(va, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var Rn = Math.clz32 ? Math.clz32 : Tx, _x = Math.log, Ex = Math.LN2;
function Tx(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (_x(e) / Ex | 0) | 0;
}
var uu = 64, au = 4194304;
function Es(e) {
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
function Zu(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var o = 0, s = e.suspendedLanes, l = e.pingedLanes, a = n & 268435455;
  if (a !== 0) {
    var f = a & ~s;
    f !== 0 ? o = Es(f) : (l &= a, l !== 0 && (o = Es(l)));
  } else a = n & ~s, a !== 0 ? o = Es(a) : l !== 0 && (o = Es(l));
  if (o === 0) return 0;
  if (t !== 0 && t !== o && !(t & s) && (s = o & -o, l = t & -t, s >= l || s === 16 && (l & 4194240) !== 0)) return t;
  if (o & 4 && (o |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= o; 0 < t; ) n = 31 - Rn(t), s = 1 << n, o |= e[n], t &= ~s;
  return o;
}
function kx(e, t) {
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
function Px(e, t) {
  for (var n = e.suspendedLanes, o = e.pingedLanes, s = e.expirationTimes, l = e.pendingLanes; 0 < l; ) {
    var a = 31 - Rn(l), f = 1 << a, p = s[a];
    p === -1 ? (!(f & n) || f & o) && (s[a] = kx(f, t)) : p <= t && (e.expiredLanes |= f), l &= ~f;
  }
}
function ed(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function n0() {
  var e = uu;
  return uu <<= 1, !(uu & 4194240) && (uu = 64), e;
}
function Jc(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function rl(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - Rn(t), e[t] = n;
}
function Cx(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var o = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var s = 31 - Rn(n), l = 1 << s;
    t[s] = 0, o[s] = -1, e[s] = -1, n &= ~l;
  }
}
function Xd(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var o = 31 - Rn(n), s = 1 << o;
    s & t | e[o] & t && (e[o] |= t), n &= ~s;
  }
}
var ge = 0;
function r0(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var i0, Yd, o0, s0, l0, td = !1, cu = [], Dr = null, Fr = null, Ur = null, Bs = /* @__PURE__ */ new Map(), Gs = /* @__PURE__ */ new Map(), Nr = [], Rx = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Um(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      Dr = null;
      break;
    case "dragenter":
    case "dragleave":
      Fr = null;
      break;
    case "mouseover":
    case "mouseout":
      Ur = null;
      break;
    case "pointerover":
    case "pointerout":
      Bs.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Gs.delete(t.pointerId);
  }
}
function as(e, t, n, o, s, l) {
  return e === null || e.nativeEvent !== l ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: o, nativeEvent: l, targetContainers: [s] }, t !== null && (t = ol(t), t !== null && Yd(t)), e) : (e.eventSystemFlags |= o, t = e.targetContainers, s !== null && t.indexOf(s) === -1 && t.push(s), e);
}
function Lx(e, t, n, o, s) {
  switch (t) {
    case "focusin":
      return Dr = as(Dr, e, t, n, o, s), !0;
    case "dragenter":
      return Fr = as(Fr, e, t, n, o, s), !0;
    case "mouseover":
      return Ur = as(Ur, e, t, n, o, s), !0;
    case "pointerover":
      var l = s.pointerId;
      return Bs.set(l, as(Bs.get(l) || null, e, t, n, o, s)), !0;
    case "gotpointercapture":
      return l = s.pointerId, Gs.set(l, as(Gs.get(l) || null, e, t, n, o, s)), !0;
  }
  return !1;
}
function u0(e) {
  var t = gi(e.target);
  if (t !== null) {
    var n = ji(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = Jy(n), t !== null) {
          e.blockedOn = t, l0(e.priority, function() {
            o0(n);
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
function Ru(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = nd(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var o = new n.constructor(n.type, n);
      Jf = o, n.target.dispatchEvent(o), Jf = null;
    } else return t = ol(n), t !== null && Yd(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function Hm(e, t, n) {
  Ru(e) && n.delete(t);
}
function Ax() {
  td = !1, Dr !== null && Ru(Dr) && (Dr = null), Fr !== null && Ru(Fr) && (Fr = null), Ur !== null && Ru(Ur) && (Ur = null), Bs.forEach(Hm), Gs.forEach(Hm);
}
function cs(e, t) {
  e.blockedOn === t && (e.blockedOn = null, td || (td = !0, Jt.unstable_scheduleCallback(Jt.unstable_NormalPriority, Ax)));
}
function Ws(e) {
  function t(s) {
    return cs(s, e);
  }
  if (0 < cu.length) {
    cs(cu[0], e);
    for (var n = 1; n < cu.length; n++) {
      var o = cu[n];
      o.blockedOn === e && (o.blockedOn = null);
    }
  }
  for (Dr !== null && cs(Dr, e), Fr !== null && cs(Fr, e), Ur !== null && cs(Ur, e), Bs.forEach(t), Gs.forEach(t), n = 0; n < Nr.length; n++) o = Nr[n], o.blockedOn === e && (o.blockedOn = null);
  for (; 0 < Nr.length && (n = Nr[0], n.blockedOn === null); ) u0(n), n.blockedOn === null && Nr.shift();
}
var _o = mr.ReactCurrentBatchConfig, Ju = !0;
function Mx(e, t, n, o) {
  var s = ge, l = _o.transition;
  _o.transition = null;
  try {
    ge = 1, Zd(e, t, n, o);
  } finally {
    ge = s, _o.transition = l;
  }
}
function Nx(e, t, n, o) {
  var s = ge, l = _o.transition;
  _o.transition = null;
  try {
    ge = 4, Zd(e, t, n, o);
  } finally {
    ge = s, _o.transition = l;
  }
}
function Zd(e, t, n, o) {
  if (Ju) {
    var s = nd(e, t, n, o);
    if (s === null) lf(e, t, o, qu, n), Um(e, o);
    else if (Lx(s, e, t, n, o)) o.stopPropagation();
    else if (Um(e, o), t & 4 && -1 < Rx.indexOf(e)) {
      for (; s !== null; ) {
        var l = ol(s);
        if (l !== null && i0(l), l = nd(e, t, n, o), l === null && lf(e, t, o, qu, n), l === s) break;
        s = l;
      }
      s !== null && o.stopPropagation();
    } else lf(e, t, o, null, n);
  }
}
var qu = null;
function nd(e, t, n, o) {
  if (qu = null, e = Kd(o), e = gi(e), e !== null) if (t = ji(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = Jy(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return qu = e, null;
}
function a0(e) {
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
      switch (Sx()) {
        case Qd:
          return 1;
        case e0:
          return 4;
        case Yu:
        case wx:
          return 16;
        case t0:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var zr = null, Jd = null, Lu = null;
function c0() {
  if (Lu) return Lu;
  var e, t = Jd, n = t.length, o, s = "value" in zr ? zr.value : zr.textContent, l = s.length;
  for (e = 0; e < n && t[e] === s[e]; e++) ;
  var a = n - e;
  for (o = 1; o <= a && t[n - o] === s[l - o]; o++) ;
  return Lu = s.slice(e, 1 < o ? 1 - o : void 0);
}
function Au(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function fu() {
  return !0;
}
function Bm() {
  return !1;
}
function $t(e) {
  function t(n, o, s, l, a) {
    this._reactName = n, this._targetInst = s, this.type = o, this.nativeEvent = l, this.target = a, this.currentTarget = null;
    for (var f in e) e.hasOwnProperty(f) && (n = e[f], this[f] = n ? n(l) : l[f]);
    return this.isDefaultPrevented = (l.defaultPrevented != null ? l.defaultPrevented : l.returnValue === !1) ? fu : Bm, this.isPropagationStopped = Bm, this;
  }
  return je(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = fu);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = fu);
  }, persist: function() {
  }, isPersistent: fu }), t;
}
var Oo = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, qd = $t(Oo), il = je({}, Oo, { view: 0, detail: 0 }), jx = $t(il), qc, $c, fs, Sa = je({}, il, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: $d, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== fs && (fs && e.type === "mousemove" ? (qc = e.screenX - fs.screenX, $c = e.screenY - fs.screenY) : $c = qc = 0, fs = e), qc);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : $c;
} }), Gm = $t(Sa), zx = je({}, Sa, { dataTransfer: 0 }), Ix = $t(zx), Ox = je({}, il, { relatedTarget: 0 }), bc = $t(Ox), Dx = je({}, Oo, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Fx = $t(Dx), Ux = je({}, Oo, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), Hx = $t(Ux), Bx = je({}, Oo, { data: 0 }), Wm = $t(Bx), Gx = {
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
}, Wx = {
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
}, Vx = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function Kx(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Vx[e]) ? !!t[e] : !1;
}
function $d() {
  return Kx;
}
var Qx = je({}, il, { key: function(e) {
  if (e.key) {
    var t = Gx[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = Au(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Wx[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: $d, charCode: function(e) {
  return e.type === "keypress" ? Au(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Au(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), Xx = $t(Qx), Yx = je({}, Sa, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Vm = $t(Yx), Zx = je({}, il, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: $d }), Jx = $t(Zx), qx = je({}, Oo, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), $x = $t(qx), bx = je({}, Sa, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), e_ = $t(bx), t_ = [9, 13, 27, 32], bd = fr && "CompositionEvent" in window, Ms = null;
fr && "documentMode" in document && (Ms = document.documentMode);
var n_ = fr && "TextEvent" in window && !Ms, f0 = fr && (!bd || Ms && 8 < Ms && 11 >= Ms), Km = " ", Qm = !1;
function d0(e, t) {
  switch (e) {
    case "keyup":
      return t_.indexOf(t.keyCode) !== -1;
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
function p0(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var oo = !1;
function r_(e, t) {
  switch (e) {
    case "compositionend":
      return p0(t);
    case "keypress":
      return t.which !== 32 ? null : (Qm = !0, Km);
    case "textInput":
      return e = t.data, e === Km && Qm ? null : e;
    default:
      return null;
  }
}
function i_(e, t) {
  if (oo) return e === "compositionend" || !bd && d0(e, t) ? (e = c0(), Lu = Jd = zr = null, oo = !1, e) : null;
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
      return f0 && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var o_ = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function Xm(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!o_[e.type] : t === "textarea";
}
function h0(e, t, n, o) {
  Ky(o), t = $u(t, "onChange"), 0 < t.length && (n = new qd("onChange", "change", null, n, o), e.push({ event: n, listeners: t }));
}
var Ns = null, Vs = null;
function s_(e) {
  k0(e, 0);
}
function wa(e) {
  var t = uo(e);
  if (Fy(t)) return e;
}
function l_(e, t) {
  if (e === "change") return t;
}
var m0 = !1;
if (fr) {
  var ef;
  if (fr) {
    var tf = "oninput" in document;
    if (!tf) {
      var Ym = document.createElement("div");
      Ym.setAttribute("oninput", "return;"), tf = typeof Ym.oninput == "function";
    }
    ef = tf;
  } else ef = !1;
  m0 = ef && (!document.documentMode || 9 < document.documentMode);
}
function Zm() {
  Ns && (Ns.detachEvent("onpropertychange", g0), Vs = Ns = null);
}
function g0(e) {
  if (e.propertyName === "value" && wa(Vs)) {
    var t = [];
    h0(t, Vs, e, Kd(e)), Zy(s_, t);
  }
}
function u_(e, t, n) {
  e === "focusin" ? (Zm(), Ns = t, Vs = n, Ns.attachEvent("onpropertychange", g0)) : e === "focusout" && Zm();
}
function a_(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return wa(Vs);
}
function c_(e, t) {
  if (e === "click") return wa(t);
}
function f_(e, t) {
  if (e === "input" || e === "change") return wa(t);
}
function d_(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Mn = typeof Object.is == "function" ? Object.is : d_;
function Ks(e, t) {
  if (Mn(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), o = Object.keys(t);
  if (n.length !== o.length) return !1;
  for (o = 0; o < n.length; o++) {
    var s = n[o];
    if (!Ff.call(t, s) || !Mn(e[s], t[s])) return !1;
  }
  return !0;
}
function Jm(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function qm(e, t) {
  var n = Jm(e);
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
    n = Jm(n);
  }
}
function y0(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? y0(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function v0() {
  for (var e = window, t = Ku(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = Ku(e.document);
  }
  return t;
}
function ep(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function p_(e) {
  var t = v0(), n = e.focusedElem, o = e.selectionRange;
  if (t !== n && n && n.ownerDocument && y0(n.ownerDocument.documentElement, n)) {
    if (o !== null && ep(n)) {
      if (t = o.start, e = o.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var s = n.textContent.length, l = Math.min(o.start, s);
        o = o.end === void 0 ? l : Math.min(o.end, s), !e.extend && l > o && (s = o, o = l, l = s), s = qm(n, l);
        var a = qm(
          n,
          o
        );
        s && a && (e.rangeCount !== 1 || e.anchorNode !== s.node || e.anchorOffset !== s.offset || e.focusNode !== a.node || e.focusOffset !== a.offset) && (t = t.createRange(), t.setStart(s.node, s.offset), e.removeAllRanges(), l > o ? (e.addRange(t), e.extend(a.node, a.offset)) : (t.setEnd(a.node, a.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var h_ = fr && "documentMode" in document && 11 >= document.documentMode, so = null, rd = null, js = null, id = !1;
function $m(e, t, n) {
  var o = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  id || so == null || so !== Ku(o) || (o = so, "selectionStart" in o && ep(o) ? o = { start: o.selectionStart, end: o.selectionEnd } : (o = (o.ownerDocument && o.ownerDocument.defaultView || window).getSelection(), o = { anchorNode: o.anchorNode, anchorOffset: o.anchorOffset, focusNode: o.focusNode, focusOffset: o.focusOffset }), js && Ks(js, o) || (js = o, o = $u(rd, "onSelect"), 0 < o.length && (t = new qd("onSelect", "select", null, t, n), e.push({ event: t, listeners: o }), t.target = so)));
}
function du(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var lo = { animationend: du("Animation", "AnimationEnd"), animationiteration: du("Animation", "AnimationIteration"), animationstart: du("Animation", "AnimationStart"), transitionend: du("Transition", "TransitionEnd") }, nf = {}, S0 = {};
fr && (S0 = document.createElement("div").style, "AnimationEvent" in window || (delete lo.animationend.animation, delete lo.animationiteration.animation, delete lo.animationstart.animation), "TransitionEvent" in window || delete lo.transitionend.transition);
function xa(e) {
  if (nf[e]) return nf[e];
  if (!lo[e]) return e;
  var t = lo[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in S0) return nf[e] = t[n];
  return e;
}
var w0 = xa("animationend"), x0 = xa("animationiteration"), _0 = xa("animationstart"), E0 = xa("transitionend"), T0 = /* @__PURE__ */ new Map(), bm = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function Yr(e, t) {
  T0.set(e, t), Ni(t, [e]);
}
for (var rf = 0; rf < bm.length; rf++) {
  var of = bm[rf], m_ = of.toLowerCase(), g_ = of[0].toUpperCase() + of.slice(1);
  Yr(m_, "on" + g_);
}
Yr(w0, "onAnimationEnd");
Yr(x0, "onAnimationIteration");
Yr(_0, "onAnimationStart");
Yr("dblclick", "onDoubleClick");
Yr("focusin", "onFocus");
Yr("focusout", "onBlur");
Yr(E0, "onTransitionEnd");
Po("onMouseEnter", ["mouseout", "mouseover"]);
Po("onMouseLeave", ["mouseout", "mouseover"]);
Po("onPointerEnter", ["pointerout", "pointerover"]);
Po("onPointerLeave", ["pointerout", "pointerover"]);
Ni("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Ni("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Ni("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Ni("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Ni("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Ni("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var Ts = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), y_ = new Set("cancel close invalid load scroll toggle".split(" ").concat(Ts));
function eg(e, t, n) {
  var o = e.type || "unknown-event";
  e.currentTarget = n, mx(o, t, void 0, e), e.currentTarget = null;
}
function k0(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var o = e[n], s = o.event;
    o = o.listeners;
    e: {
      var l = void 0;
      if (t) for (var a = o.length - 1; 0 <= a; a--) {
        var f = o[a], p = f.instance, m = f.currentTarget;
        if (f = f.listener, p !== l && s.isPropagationStopped()) break e;
        eg(s, f, m), l = p;
      }
      else for (a = 0; a < o.length; a++) {
        if (f = o[a], p = f.instance, m = f.currentTarget, f = f.listener, p !== l && s.isPropagationStopped()) break e;
        eg(s, f, m), l = p;
      }
    }
  }
  if (Xu) throw e = bf, Xu = !1, bf = null, e;
}
function Pe(e, t) {
  var n = t[ad];
  n === void 0 && (n = t[ad] = /* @__PURE__ */ new Set());
  var o = e + "__bubble";
  n.has(o) || (P0(t, e, 2, !1), n.add(o));
}
function sf(e, t, n) {
  var o = 0;
  t && (o |= 4), P0(n, e, o, t);
}
var pu = "_reactListening" + Math.random().toString(36).slice(2);
function Qs(e) {
  if (!e[pu]) {
    e[pu] = !0, jy.forEach(function(n) {
      n !== "selectionchange" && (y_.has(n) || sf(n, !1, e), sf(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[pu] || (t[pu] = !0, sf("selectionchange", !1, t));
  }
}
function P0(e, t, n, o) {
  switch (a0(t)) {
    case 1:
      var s = Mx;
      break;
    case 4:
      s = Nx;
      break;
    default:
      s = Zd;
  }
  n = s.bind(null, t, n, e), s = void 0, !$f || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (s = !0), o ? s !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: s }) : e.addEventListener(t, n, !0) : s !== void 0 ? e.addEventListener(t, n, { passive: s }) : e.addEventListener(t, n, !1);
}
function lf(e, t, n, o, s) {
  var l = o;
  if (!(t & 1) && !(t & 2) && o !== null) e: for (; ; ) {
    if (o === null) return;
    var a = o.tag;
    if (a === 3 || a === 4) {
      var f = o.stateNode.containerInfo;
      if (f === s || f.nodeType === 8 && f.parentNode === s) break;
      if (a === 4) for (a = o.return; a !== null; ) {
        var p = a.tag;
        if ((p === 3 || p === 4) && (p = a.stateNode.containerInfo, p === s || p.nodeType === 8 && p.parentNode === s)) return;
        a = a.return;
      }
      for (; f !== null; ) {
        if (a = gi(f), a === null) return;
        if (p = a.tag, p === 5 || p === 6) {
          o = l = a;
          continue e;
        }
        f = f.parentNode;
      }
    }
    o = o.return;
  }
  Zy(function() {
    var m = l, g = Kd(n), y = [];
    e: {
      var v = T0.get(e);
      if (v !== void 0) {
        var x = qd, k = e;
        switch (e) {
          case "keypress":
            if (Au(n) === 0) break e;
          case "keydown":
          case "keyup":
            x = Xx;
            break;
          case "focusin":
            k = "focus", x = bc;
            break;
          case "focusout":
            k = "blur", x = bc;
            break;
          case "beforeblur":
          case "afterblur":
            x = bc;
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
            x = Gm;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            x = Ix;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            x = Jx;
            break;
          case w0:
          case x0:
          case _0:
            x = Fx;
            break;
          case E0:
            x = $x;
            break;
          case "scroll":
            x = jx;
            break;
          case "wheel":
            x = e_;
            break;
          case "copy":
          case "cut":
          case "paste":
            x = Hx;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            x = Vm;
        }
        var L = (t & 4) !== 0, A = !L && e === "scroll", w = L ? v !== null ? v + "Capture" : null : v;
        L = [];
        for (var S = m, _; S !== null; ) {
          _ = S;
          var R = _.stateNode;
          if (_.tag === 5 && R !== null && (_ = R, w !== null && (R = Hs(S, w), R != null && L.push(Xs(S, R, _)))), A) break;
          S = S.return;
        }
        0 < L.length && (v = new x(v, k, null, n, g), y.push({ event: v, listeners: L }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (v = e === "mouseover" || e === "pointerover", x = e === "mouseout" || e === "pointerout", v && n !== Jf && (k = n.relatedTarget || n.fromElement) && (gi(k) || k[dr])) break e;
        if ((x || v) && (v = g.window === g ? g : (v = g.ownerDocument) ? v.defaultView || v.parentWindow : window, x ? (k = n.relatedTarget || n.toElement, x = m, k = k ? gi(k) : null, k !== null && (A = ji(k), k !== A || k.tag !== 5 && k.tag !== 6) && (k = null)) : (x = null, k = m), x !== k)) {
          if (L = Gm, R = "onMouseLeave", w = "onMouseEnter", S = "mouse", (e === "pointerout" || e === "pointerover") && (L = Vm, R = "onPointerLeave", w = "onPointerEnter", S = "pointer"), A = x == null ? v : uo(x), _ = k == null ? v : uo(k), v = new L(R, S + "leave", x, n, g), v.target = A, v.relatedTarget = _, R = null, gi(g) === m && (L = new L(w, S + "enter", k, n, g), L.target = _, L.relatedTarget = A, R = L), A = R, x && k) t: {
            for (L = x, w = k, S = 0, _ = L; _; _ = Zi(_)) S++;
            for (_ = 0, R = w; R; R = Zi(R)) _++;
            for (; 0 < S - _; ) L = Zi(L), S--;
            for (; 0 < _ - S; ) w = Zi(w), _--;
            for (; S--; ) {
              if (L === w || w !== null && L === w.alternate) break t;
              L = Zi(L), w = Zi(w);
            }
            L = null;
          }
          else L = null;
          x !== null && tg(y, v, x, L, !1), k !== null && A !== null && tg(y, A, k, L, !0);
        }
      }
      e: {
        if (v = m ? uo(m) : window, x = v.nodeName && v.nodeName.toLowerCase(), x === "select" || x === "input" && v.type === "file") var I = l_;
        else if (Xm(v)) if (m0) I = f_;
        else {
          I = a_;
          var O = u_;
        }
        else (x = v.nodeName) && x.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (I = c_);
        if (I && (I = I(e, m))) {
          h0(y, I, n, g);
          break e;
        }
        O && O(e, v, m), e === "focusout" && (O = v._wrapperState) && O.controlled && v.type === "number" && Kf(v, "number", v.value);
      }
      switch (O = m ? uo(m) : window, e) {
        case "focusin":
          (Xm(O) || O.contentEditable === "true") && (so = O, rd = m, js = null);
          break;
        case "focusout":
          js = rd = so = null;
          break;
        case "mousedown":
          id = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          id = !1, $m(y, n, g);
          break;
        case "selectionchange":
          if (h_) break;
        case "keydown":
        case "keyup":
          $m(y, n, g);
      }
      var D;
      if (bd) e: {
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
      else oo ? d0(e, n) && (B = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (B = "onCompositionStart");
      B && (f0 && n.locale !== "ko" && (oo || B !== "onCompositionStart" ? B === "onCompositionEnd" && oo && (D = c0()) : (zr = g, Jd = "value" in zr ? zr.value : zr.textContent, oo = !0)), O = $u(m, B), 0 < O.length && (B = new Wm(B, e, null, n, g), y.push({ event: B, listeners: O }), D ? B.data = D : (D = p0(n), D !== null && (B.data = D)))), (D = n_ ? r_(e, n) : i_(e, n)) && (m = $u(m, "onBeforeInput"), 0 < m.length && (g = new Wm("onBeforeInput", "beforeinput", null, n, g), y.push({ event: g, listeners: m }), g.data = D));
    }
    k0(y, t);
  });
}
function Xs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function $u(e, t) {
  for (var n = t + "Capture", o = []; e !== null; ) {
    var s = e, l = s.stateNode;
    s.tag === 5 && l !== null && (s = l, l = Hs(e, n), l != null && o.unshift(Xs(e, l, s)), l = Hs(e, t), l != null && o.push(Xs(e, l, s))), e = e.return;
  }
  return o;
}
function Zi(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function tg(e, t, n, o, s) {
  for (var l = t._reactName, a = []; n !== null && n !== o; ) {
    var f = n, p = f.alternate, m = f.stateNode;
    if (p !== null && p === o) break;
    f.tag === 5 && m !== null && (f = m, s ? (p = Hs(n, l), p != null && a.unshift(Xs(n, p, f))) : s || (p = Hs(n, l), p != null && a.push(Xs(n, p, f)))), n = n.return;
  }
  a.length !== 0 && e.push({ event: t, listeners: a });
}
var v_ = /\r\n?/g, S_ = /\u0000|\uFFFD/g;
function ng(e) {
  return (typeof e == "string" ? e : "" + e).replace(v_, `
`).replace(S_, "");
}
function hu(e, t, n) {
  if (t = ng(t), ng(e) !== t && n) throw Error(H(425));
}
function bu() {
}
var od = null, sd = null;
function ld(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var ud = typeof setTimeout == "function" ? setTimeout : void 0, w_ = typeof clearTimeout == "function" ? clearTimeout : void 0, rg = typeof Promise == "function" ? Promise : void 0, x_ = typeof queueMicrotask == "function" ? queueMicrotask : typeof rg < "u" ? function(e) {
  return rg.resolve(null).then(e).catch(__);
} : ud;
function __(e) {
  setTimeout(function() {
    throw e;
  });
}
function uf(e, t) {
  var n = t, o = 0;
  do {
    var s = n.nextSibling;
    if (e.removeChild(n), s && s.nodeType === 8) if (n = s.data, n === "/$") {
      if (o === 0) {
        e.removeChild(s), Ws(t);
        return;
      }
      o--;
    } else n !== "$" && n !== "$?" && n !== "$!" || o++;
    n = s;
  } while (n);
  Ws(t);
}
function Hr(e) {
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
function ig(e) {
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
var Do = Math.random().toString(36).slice(2), Vn = "__reactFiber$" + Do, Ys = "__reactProps$" + Do, dr = "__reactContainer$" + Do, ad = "__reactEvents$" + Do, E_ = "__reactListeners$" + Do, T_ = "__reactHandles$" + Do;
function gi(e) {
  var t = e[Vn];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[dr] || n[Vn]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = ig(e); e !== null; ) {
        if (n = e[Vn]) return n;
        e = ig(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function ol(e) {
  return e = e[Vn] || e[dr], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function uo(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(H(33));
}
function _a(e) {
  return e[Ys] || null;
}
var cd = [], ao = -1;
function Zr(e) {
  return { current: e };
}
function Ce(e) {
  0 > ao || (e.current = cd[ao], cd[ao] = null, ao--);
}
function Te(e, t) {
  ao++, cd[ao] = e.current, e.current = t;
}
var Xr = {}, mt = Zr(Xr), Dt = Zr(!1), Ci = Xr;
function Co(e, t) {
  var n = e.type.contextTypes;
  if (!n) return Xr;
  var o = e.stateNode;
  if (o && o.__reactInternalMemoizedUnmaskedChildContext === t) return o.__reactInternalMemoizedMaskedChildContext;
  var s = {}, l;
  for (l in n) s[l] = t[l];
  return o && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = s), s;
}
function Ft(e) {
  return e = e.childContextTypes, e != null;
}
function ea() {
  Ce(Dt), Ce(mt);
}
function og(e, t, n) {
  if (mt.current !== Xr) throw Error(H(168));
  Te(mt, t), Te(Dt, n);
}
function C0(e, t, n) {
  var o = e.stateNode;
  if (t = t.childContextTypes, typeof o.getChildContext != "function") return n;
  o = o.getChildContext();
  for (var s in o) if (!(s in t)) throw Error(H(108, ux(e) || "Unknown", s));
  return je({}, n, o);
}
function ta(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || Xr, Ci = mt.current, Te(mt, e), Te(Dt, Dt.current), !0;
}
function sg(e, t, n) {
  var o = e.stateNode;
  if (!o) throw Error(H(169));
  n ? (e = C0(e, t, Ci), o.__reactInternalMemoizedMergedChildContext = e, Ce(Dt), Ce(mt), Te(mt, e)) : Ce(Dt), Te(Dt, n);
}
var sr = null, Ea = !1, af = !1;
function R0(e) {
  sr === null ? sr = [e] : sr.push(e);
}
function k_(e) {
  Ea = !0, R0(e);
}
function Jr() {
  if (!af && sr !== null) {
    af = !0;
    var e = 0, t = ge;
    try {
      var n = sr;
      for (ge = 1; e < n.length; e++) {
        var o = n[e];
        do
          o = o(!0);
        while (o !== null);
      }
      sr = null, Ea = !1;
    } catch (s) {
      throw sr !== null && (sr = sr.slice(e + 1)), by(Qd, Jr), s;
    } finally {
      ge = t, af = !1;
    }
  }
  return null;
}
var co = [], fo = 0, na = null, ra = 0, fn = [], dn = 0, Ri = null, ur = 1, ar = "";
function ci(e, t) {
  co[fo++] = ra, co[fo++] = na, na = e, ra = t;
}
function L0(e, t, n) {
  fn[dn++] = ur, fn[dn++] = ar, fn[dn++] = Ri, Ri = e;
  var o = ur;
  e = ar;
  var s = 32 - Rn(o) - 1;
  o &= ~(1 << s), n += 1;
  var l = 32 - Rn(t) + s;
  if (30 < l) {
    var a = s - s % 5;
    l = (o & (1 << a) - 1).toString(32), o >>= a, s -= a, ur = 1 << 32 - Rn(t) + s | n << s | o, ar = l + e;
  } else ur = 1 << l | n << s | o, ar = e;
}
function tp(e) {
  e.return !== null && (ci(e, 1), L0(e, 1, 0));
}
function np(e) {
  for (; e === na; ) na = co[--fo], co[fo] = null, ra = co[--fo], co[fo] = null;
  for (; e === Ri; ) Ri = fn[--dn], fn[dn] = null, ar = fn[--dn], fn[dn] = null, ur = fn[--dn], fn[dn] = null;
}
var Zt = null, Yt = null, Le = !1, Cn = null;
function A0(e, t) {
  var n = pn(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function lg(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Zt = e, Yt = Hr(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Zt = e, Yt = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = Ri !== null ? { id: ur, overflow: ar } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = pn(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Zt = e, Yt = null, !0) : !1;
    default:
      return !1;
  }
}
function fd(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function dd(e) {
  if (Le) {
    var t = Yt;
    if (t) {
      var n = t;
      if (!lg(e, t)) {
        if (fd(e)) throw Error(H(418));
        t = Hr(n.nextSibling);
        var o = Zt;
        t && lg(e, t) ? A0(o, n) : (e.flags = e.flags & -4097 | 2, Le = !1, Zt = e);
      }
    } else {
      if (fd(e)) throw Error(H(418));
      e.flags = e.flags & -4097 | 2, Le = !1, Zt = e;
    }
  }
}
function ug(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Zt = e;
}
function mu(e) {
  if (e !== Zt) return !1;
  if (!Le) return ug(e), Le = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !ld(e.type, e.memoizedProps)), t && (t = Yt)) {
    if (fd(e)) throw M0(), Error(H(418));
    for (; t; ) A0(e, t), t = Hr(t.nextSibling);
  }
  if (ug(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(H(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Yt = Hr(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Yt = null;
    }
  } else Yt = Zt ? Hr(e.stateNode.nextSibling) : null;
  return !0;
}
function M0() {
  for (var e = Yt; e; ) e = Hr(e.nextSibling);
}
function Ro() {
  Yt = Zt = null, Le = !1;
}
function rp(e) {
  Cn === null ? Cn = [e] : Cn.push(e);
}
var P_ = mr.ReactCurrentBatchConfig;
function ds(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(H(309));
        var o = n.stateNode;
      }
      if (!o) throw Error(H(147, e));
      var s = o, l = "" + e;
      return t !== null && t.ref !== null && typeof t.ref == "function" && t.ref._stringRef === l ? t.ref : (t = function(a) {
        var f = s.refs;
        a === null ? delete f[l] : f[l] = a;
      }, t._stringRef = l, t);
    }
    if (typeof e != "string") throw Error(H(284));
    if (!n._owner) throw Error(H(290, e));
  }
  return e;
}
function gu(e, t) {
  throw e = Object.prototype.toString.call(t), Error(H(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function ag(e) {
  var t = e._init;
  return t(e._payload);
}
function N0(e) {
  function t(w, S) {
    if (e) {
      var _ = w.deletions;
      _ === null ? (w.deletions = [S], w.flags |= 16) : _.push(S);
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
  function s(w, S) {
    return w = Vr(w, S), w.index = 0, w.sibling = null, w;
  }
  function l(w, S, _) {
    return w.index = _, e ? (_ = w.alternate, _ !== null ? (_ = _.index, _ < S ? (w.flags |= 2, S) : _) : (w.flags |= 2, S)) : (w.flags |= 1048576, S);
  }
  function a(w) {
    return e && w.alternate === null && (w.flags |= 2), w;
  }
  function f(w, S, _, R) {
    return S === null || S.tag !== 6 ? (S = gf(_, w.mode, R), S.return = w, S) : (S = s(S, _), S.return = w, S);
  }
  function p(w, S, _, R) {
    var I = _.type;
    return I === io ? g(w, S, _.props.children, R, _.key) : S !== null && (S.elementType === I || typeof I == "object" && I !== null && I.$$typeof === Ar && ag(I) === S.type) ? (R = s(S, _.props), R.ref = ds(w, S, _), R.return = w, R) : (R = Du(_.type, _.key, _.props, null, w.mode, R), R.ref = ds(w, S, _), R.return = w, R);
  }
  function m(w, S, _, R) {
    return S === null || S.tag !== 4 || S.stateNode.containerInfo !== _.containerInfo || S.stateNode.implementation !== _.implementation ? (S = yf(_, w.mode, R), S.return = w, S) : (S = s(S, _.children || []), S.return = w, S);
  }
  function g(w, S, _, R, I) {
    return S === null || S.tag !== 7 ? (S = Pi(_, w.mode, R, I), S.return = w, S) : (S = s(S, _), S.return = w, S);
  }
  function y(w, S, _) {
    if (typeof S == "string" && S !== "" || typeof S == "number") return S = gf("" + S, w.mode, _), S.return = w, S;
    if (typeof S == "object" && S !== null) {
      switch (S.$$typeof) {
        case ou:
          return _ = Du(S.type, S.key, S.props, null, w.mode, _), _.ref = ds(w, null, S), _.return = w, _;
        case ro:
          return S = yf(S, w.mode, _), S.return = w, S;
        case Ar:
          var R = S._init;
          return y(w, R(S._payload), _);
      }
      if (_s(S) || ls(S)) return S = Pi(S, w.mode, _, null), S.return = w, S;
      gu(w, S);
    }
    return null;
  }
  function v(w, S, _, R) {
    var I = S !== null ? S.key : null;
    if (typeof _ == "string" && _ !== "" || typeof _ == "number") return I !== null ? null : f(w, S, "" + _, R);
    if (typeof _ == "object" && _ !== null) {
      switch (_.$$typeof) {
        case ou:
          return _.key === I ? p(w, S, _, R) : null;
        case ro:
          return _.key === I ? m(w, S, _, R) : null;
        case Ar:
          return I = _._init, v(
            w,
            S,
            I(_._payload),
            R
          );
      }
      if (_s(_) || ls(_)) return I !== null ? null : g(w, S, _, R, null);
      gu(w, _);
    }
    return null;
  }
  function x(w, S, _, R, I) {
    if (typeof R == "string" && R !== "" || typeof R == "number") return w = w.get(_) || null, f(S, w, "" + R, I);
    if (typeof R == "object" && R !== null) {
      switch (R.$$typeof) {
        case ou:
          return w = w.get(R.key === null ? _ : R.key) || null, p(S, w, R, I);
        case ro:
          return w = w.get(R.key === null ? _ : R.key) || null, m(S, w, R, I);
        case Ar:
          var O = R._init;
          return x(w, S, _, O(R._payload), I);
      }
      if (_s(R) || ls(R)) return w = w.get(_) || null, g(S, w, R, I, null);
      gu(S, R);
    }
    return null;
  }
  function k(w, S, _, R) {
    for (var I = null, O = null, D = S, B = S = 0, q = null; D !== null && B < _.length; B++) {
      D.index > B ? (q = D, D = null) : q = D.sibling;
      var V = v(w, D, _[B], R);
      if (V === null) {
        D === null && (D = q);
        break;
      }
      e && D && V.alternate === null && t(w, D), S = l(V, S, B), O === null ? I = V : O.sibling = V, O = V, D = q;
    }
    if (B === _.length) return n(w, D), Le && ci(w, B), I;
    if (D === null) {
      for (; B < _.length; B++) D = y(w, _[B], R), D !== null && (S = l(D, S, B), O === null ? I = D : O.sibling = D, O = D);
      return Le && ci(w, B), I;
    }
    for (D = o(w, D); B < _.length; B++) q = x(D, w, B, _[B], R), q !== null && (e && q.alternate !== null && D.delete(q.key === null ? B : q.key), S = l(q, S, B), O === null ? I = q : O.sibling = q, O = q);
    return e && D.forEach(function(Q) {
      return t(w, Q);
    }), Le && ci(w, B), I;
  }
  function L(w, S, _, R) {
    var I = ls(_);
    if (typeof I != "function") throw Error(H(150));
    if (_ = I.call(_), _ == null) throw Error(H(151));
    for (var O = I = null, D = S, B = S = 0, q = null, V = _.next(); D !== null && !V.done; B++, V = _.next()) {
      D.index > B ? (q = D, D = null) : q = D.sibling;
      var Q = v(w, D, V.value, R);
      if (Q === null) {
        D === null && (D = q);
        break;
      }
      e && D && Q.alternate === null && t(w, D), S = l(Q, S, B), O === null ? I = Q : O.sibling = Q, O = Q, D = q;
    }
    if (V.done) return n(
      w,
      D
    ), Le && ci(w, B), I;
    if (D === null) {
      for (; !V.done; B++, V = _.next()) V = y(w, V.value, R), V !== null && (S = l(V, S, B), O === null ? I = V : O.sibling = V, O = V);
      return Le && ci(w, B), I;
    }
    for (D = o(w, D); !V.done; B++, V = _.next()) V = x(D, w, B, V.value, R), V !== null && (e && V.alternate !== null && D.delete(V.key === null ? B : V.key), S = l(V, S, B), O === null ? I = V : O.sibling = V, O = V);
    return e && D.forEach(function(le) {
      return t(w, le);
    }), Le && ci(w, B), I;
  }
  function A(w, S, _, R) {
    if (typeof _ == "object" && _ !== null && _.type === io && _.key === null && (_ = _.props.children), typeof _ == "object" && _ !== null) {
      switch (_.$$typeof) {
        case ou:
          e: {
            for (var I = _.key, O = S; O !== null; ) {
              if (O.key === I) {
                if (I = _.type, I === io) {
                  if (O.tag === 7) {
                    n(w, O.sibling), S = s(O, _.props.children), S.return = w, w = S;
                    break e;
                  }
                } else if (O.elementType === I || typeof I == "object" && I !== null && I.$$typeof === Ar && ag(I) === O.type) {
                  n(w, O.sibling), S = s(O, _.props), S.ref = ds(w, O, _), S.return = w, w = S;
                  break e;
                }
                n(w, O);
                break;
              } else t(w, O);
              O = O.sibling;
            }
            _.type === io ? (S = Pi(_.props.children, w.mode, R, _.key), S.return = w, w = S) : (R = Du(_.type, _.key, _.props, null, w.mode, R), R.ref = ds(w, S, _), R.return = w, w = R);
          }
          return a(w);
        case ro:
          e: {
            for (O = _.key; S !== null; ) {
              if (S.key === O) if (S.tag === 4 && S.stateNode.containerInfo === _.containerInfo && S.stateNode.implementation === _.implementation) {
                n(w, S.sibling), S = s(S, _.children || []), S.return = w, w = S;
                break e;
              } else {
                n(w, S);
                break;
              }
              else t(w, S);
              S = S.sibling;
            }
            S = yf(_, w.mode, R), S.return = w, w = S;
          }
          return a(w);
        case Ar:
          return O = _._init, A(w, S, O(_._payload), R);
      }
      if (_s(_)) return k(w, S, _, R);
      if (ls(_)) return L(w, S, _, R);
      gu(w, _);
    }
    return typeof _ == "string" && _ !== "" || typeof _ == "number" ? (_ = "" + _, S !== null && S.tag === 6 ? (n(w, S.sibling), S = s(S, _), S.return = w, w = S) : (n(w, S), S = gf(_, w.mode, R), S.return = w, w = S), a(w)) : n(w, S);
  }
  return A;
}
var Lo = N0(!0), j0 = N0(!1), ia = Zr(null), oa = null, po = null, ip = null;
function op() {
  ip = po = oa = null;
}
function sp(e) {
  var t = ia.current;
  Ce(ia), e._currentValue = t;
}
function pd(e, t, n) {
  for (; e !== null; ) {
    var o = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, o !== null && (o.childLanes |= t)) : o !== null && (o.childLanes & t) !== t && (o.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function Eo(e, t) {
  oa = e, ip = po = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (Ot = !0), e.firstContext = null);
}
function mn(e) {
  var t = e._currentValue;
  if (ip !== e) if (e = { context: e, memoizedValue: t, next: null }, po === null) {
    if (oa === null) throw Error(H(308));
    po = e, oa.dependencies = { lanes: 0, firstContext: e };
  } else po = po.next = e;
  return t;
}
var yi = null;
function lp(e) {
  yi === null ? yi = [e] : yi.push(e);
}
function z0(e, t, n, o) {
  var s = t.interleaved;
  return s === null ? (n.next = n, lp(t)) : (n.next = s.next, s.next = n), t.interleaved = n, pr(e, o);
}
function pr(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var Mr = !1;
function up(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function I0(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function cr(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Br(e, t, n) {
  var o = e.updateQueue;
  if (o === null) return null;
  if (o = o.shared, fe & 2) {
    var s = o.pending;
    return s === null ? t.next = t : (t.next = s.next, s.next = t), o.pending = t, pr(e, n);
  }
  return s = o.interleaved, s === null ? (t.next = t, lp(o)) : (t.next = s.next, s.next = t), o.interleaved = t, pr(e, n);
}
function Mu(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var o = t.lanes;
    o &= e.pendingLanes, n |= o, t.lanes = n, Xd(e, n);
  }
}
function cg(e, t) {
  var n = e.updateQueue, o = e.alternate;
  if (o !== null && (o = o.updateQueue, n === o)) {
    var s = null, l = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var a = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        l === null ? s = l = a : l = l.next = a, n = n.next;
      } while (n !== null);
      l === null ? s = l = t : l = l.next = t;
    } else s = l = t;
    n = { baseState: o.baseState, firstBaseUpdate: s, lastBaseUpdate: l, shared: o.shared, effects: o.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function sa(e, t, n, o) {
  var s = e.updateQueue;
  Mr = !1;
  var l = s.firstBaseUpdate, a = s.lastBaseUpdate, f = s.shared.pending;
  if (f !== null) {
    s.shared.pending = null;
    var p = f, m = p.next;
    p.next = null, a === null ? l = m : a.next = m, a = p;
    var g = e.alternate;
    g !== null && (g = g.updateQueue, f = g.lastBaseUpdate, f !== a && (f === null ? g.firstBaseUpdate = m : f.next = m, g.lastBaseUpdate = p));
  }
  if (l !== null) {
    var y = s.baseState;
    a = 0, g = m = p = null, f = l;
    do {
      var v = f.lane, x = f.eventTime;
      if ((o & v) === v) {
        g !== null && (g = g.next = {
          eventTime: x,
          lane: 0,
          tag: f.tag,
          payload: f.payload,
          callback: f.callback,
          next: null
        });
        e: {
          var k = e, L = f;
          switch (v = t, x = n, L.tag) {
            case 1:
              if (k = L.payload, typeof k == "function") {
                y = k.call(x, y, v);
                break e;
              }
              y = k;
              break e;
            case 3:
              k.flags = k.flags & -65537 | 128;
            case 0:
              if (k = L.payload, v = typeof k == "function" ? k.call(x, y, v) : k, v == null) break e;
              y = je({}, y, v);
              break e;
            case 2:
              Mr = !0;
          }
        }
        f.callback !== null && f.lane !== 0 && (e.flags |= 64, v = s.effects, v === null ? s.effects = [f] : v.push(f));
      } else x = { eventTime: x, lane: v, tag: f.tag, payload: f.payload, callback: f.callback, next: null }, g === null ? (m = g = x, p = y) : g = g.next = x, a |= v;
      if (f = f.next, f === null) {
        if (f = s.shared.pending, f === null) break;
        v = f, f = v.next, v.next = null, s.lastBaseUpdate = v, s.shared.pending = null;
      }
    } while (!0);
    if (g === null && (p = y), s.baseState = p, s.firstBaseUpdate = m, s.lastBaseUpdate = g, t = s.shared.interleaved, t !== null) {
      s = t;
      do
        a |= s.lane, s = s.next;
      while (s !== t);
    } else l === null && (s.shared.lanes = 0);
    Ai |= a, e.lanes = a, e.memoizedState = y;
  }
}
function fg(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var o = e[t], s = o.callback;
    if (s !== null) {
      if (o.callback = null, o = n, typeof s != "function") throw Error(H(191, s));
      s.call(o);
    }
  }
}
var sl = {}, Yn = Zr(sl), Zs = Zr(sl), Js = Zr(sl);
function vi(e) {
  if (e === sl) throw Error(H(174));
  return e;
}
function ap(e, t) {
  switch (Te(Js, t), Te(Zs, e), Te(Yn, sl), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : Xf(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = Xf(t, e);
  }
  Ce(Yn), Te(Yn, t);
}
function Ao() {
  Ce(Yn), Ce(Zs), Ce(Js);
}
function O0(e) {
  vi(Js.current);
  var t = vi(Yn.current), n = Xf(t, e.type);
  t !== n && (Te(Zs, e), Te(Yn, n));
}
function cp(e) {
  Zs.current === e && (Ce(Yn), Ce(Zs));
}
var Me = Zr(0);
function la(e) {
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
var cf = [];
function fp() {
  for (var e = 0; e < cf.length; e++) cf[e]._workInProgressVersionPrimary = null;
  cf.length = 0;
}
var Nu = mr.ReactCurrentDispatcher, ff = mr.ReactCurrentBatchConfig, Li = 0, Ne = null, Ke = null, qe = null, ua = !1, zs = !1, qs = 0, C_ = 0;
function ct() {
  throw Error(H(321));
}
function dp(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!Mn(e[n], t[n])) return !1;
  return !0;
}
function pp(e, t, n, o, s, l) {
  if (Li = l, Ne = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Nu.current = e === null || e.memoizedState === null ? M_ : N_, e = n(o, s), zs) {
    l = 0;
    do {
      if (zs = !1, qs = 0, 25 <= l) throw Error(H(301));
      l += 1, qe = Ke = null, t.updateQueue = null, Nu.current = j_, e = n(o, s);
    } while (zs);
  }
  if (Nu.current = aa, t = Ke !== null && Ke.next !== null, Li = 0, qe = Ke = Ne = null, ua = !1, t) throw Error(H(300));
  return e;
}
function hp() {
  var e = qs !== 0;
  return qs = 0, e;
}
function Wn() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return qe === null ? Ne.memoizedState = qe = e : qe = qe.next = e, qe;
}
function gn() {
  if (Ke === null) {
    var e = Ne.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = Ke.next;
  var t = qe === null ? Ne.memoizedState : qe.next;
  if (t !== null) qe = t, Ke = e;
  else {
    if (e === null) throw Error(H(310));
    Ke = e, e = { memoizedState: Ke.memoizedState, baseState: Ke.baseState, baseQueue: Ke.baseQueue, queue: Ke.queue, next: null }, qe === null ? Ne.memoizedState = qe = e : qe = qe.next = e;
  }
  return qe;
}
function $s(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function df(e) {
  var t = gn(), n = t.queue;
  if (n === null) throw Error(H(311));
  n.lastRenderedReducer = e;
  var o = Ke, s = o.baseQueue, l = n.pending;
  if (l !== null) {
    if (s !== null) {
      var a = s.next;
      s.next = l.next, l.next = a;
    }
    o.baseQueue = s = l, n.pending = null;
  }
  if (s !== null) {
    l = s.next, o = o.baseState;
    var f = a = null, p = null, m = l;
    do {
      var g = m.lane;
      if ((Li & g) === g) p !== null && (p = p.next = { lane: 0, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), o = m.hasEagerState ? m.eagerState : e(o, m.action);
      else {
        var y = {
          lane: g,
          action: m.action,
          hasEagerState: m.hasEagerState,
          eagerState: m.eagerState,
          next: null
        };
        p === null ? (f = p = y, a = o) : p = p.next = y, Ne.lanes |= g, Ai |= g;
      }
      m = m.next;
    } while (m !== null && m !== l);
    p === null ? a = o : p.next = f, Mn(o, t.memoizedState) || (Ot = !0), t.memoizedState = o, t.baseState = a, t.baseQueue = p, n.lastRenderedState = o;
  }
  if (e = n.interleaved, e !== null) {
    s = e;
    do
      l = s.lane, Ne.lanes |= l, Ai |= l, s = s.next;
    while (s !== e);
  } else s === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function pf(e) {
  var t = gn(), n = t.queue;
  if (n === null) throw Error(H(311));
  n.lastRenderedReducer = e;
  var o = n.dispatch, s = n.pending, l = t.memoizedState;
  if (s !== null) {
    n.pending = null;
    var a = s = s.next;
    do
      l = e(l, a.action), a = a.next;
    while (a !== s);
    Mn(l, t.memoizedState) || (Ot = !0), t.memoizedState = l, t.baseQueue === null && (t.baseState = l), n.lastRenderedState = l;
  }
  return [l, o];
}
function D0() {
}
function F0(e, t) {
  var n = Ne, o = gn(), s = t(), l = !Mn(o.memoizedState, s);
  if (l && (o.memoizedState = s, Ot = !0), o = o.queue, mp(B0.bind(null, n, o, e), [e]), o.getSnapshot !== t || l || qe !== null && qe.memoizedState.tag & 1) {
    if (n.flags |= 2048, bs(9, H0.bind(null, n, o, s, t), void 0, null), $e === null) throw Error(H(349));
    Li & 30 || U0(n, t, s);
  }
  return s;
}
function U0(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = Ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Ne.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function H0(e, t, n, o) {
  t.value = n, t.getSnapshot = o, G0(t) && W0(e);
}
function B0(e, t, n) {
  return n(function() {
    G0(t) && W0(e);
  });
}
function G0(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Mn(e, n);
  } catch {
    return !0;
  }
}
function W0(e) {
  var t = pr(e, 1);
  t !== null && Ln(t, e, 1, -1);
}
function dg(e) {
  var t = Wn();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: $s, lastRenderedState: e }, t.queue = e, e = e.dispatch = A_.bind(null, Ne, e), [t.memoizedState, e];
}
function bs(e, t, n, o) {
  return e = { tag: e, create: t, destroy: n, deps: o, next: null }, t = Ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Ne.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (o = n.next, n.next = e, e.next = o, t.lastEffect = e)), e;
}
function V0() {
  return gn().memoizedState;
}
function ju(e, t, n, o) {
  var s = Wn();
  Ne.flags |= e, s.memoizedState = bs(1 | t, n, void 0, o === void 0 ? null : o);
}
function Ta(e, t, n, o) {
  var s = gn();
  o = o === void 0 ? null : o;
  var l = void 0;
  if (Ke !== null) {
    var a = Ke.memoizedState;
    if (l = a.destroy, o !== null && dp(o, a.deps)) {
      s.memoizedState = bs(t, n, l, o);
      return;
    }
  }
  Ne.flags |= e, s.memoizedState = bs(1 | t, n, l, o);
}
function pg(e, t) {
  return ju(8390656, 8, e, t);
}
function mp(e, t) {
  return Ta(2048, 8, e, t);
}
function K0(e, t) {
  return Ta(4, 2, e, t);
}
function Q0(e, t) {
  return Ta(4, 4, e, t);
}
function X0(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function Y0(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Ta(4, 4, X0.bind(null, t, e), n);
}
function gp() {
}
function Z0(e, t) {
  var n = gn();
  t = t === void 0 ? null : t;
  var o = n.memoizedState;
  return o !== null && t !== null && dp(t, o[1]) ? o[0] : (n.memoizedState = [e, t], e);
}
function J0(e, t) {
  var n = gn();
  t = t === void 0 ? null : t;
  var o = n.memoizedState;
  return o !== null && t !== null && dp(t, o[1]) ? o[0] : (e = e(), n.memoizedState = [e, t], e);
}
function q0(e, t, n) {
  return Li & 21 ? (Mn(n, t) || (n = n0(), Ne.lanes |= n, Ai |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Ot = !0), e.memoizedState = n);
}
function R_(e, t) {
  var n = ge;
  ge = n !== 0 && 4 > n ? n : 4, e(!0);
  var o = ff.transition;
  ff.transition = {};
  try {
    e(!1), t();
  } finally {
    ge = n, ff.transition = o;
  }
}
function $0() {
  return gn().memoizedState;
}
function L_(e, t, n) {
  var o = Wr(e);
  if (n = { lane: o, action: n, hasEagerState: !1, eagerState: null, next: null }, b0(e)) ev(t, n);
  else if (n = z0(e, t, n, o), n !== null) {
    var s = wt();
    Ln(n, e, o, s), tv(n, t, o);
  }
}
function A_(e, t, n) {
  var o = Wr(e), s = { lane: o, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (b0(e)) ev(t, s);
  else {
    var l = e.alternate;
    if (e.lanes === 0 && (l === null || l.lanes === 0) && (l = t.lastRenderedReducer, l !== null)) try {
      var a = t.lastRenderedState, f = l(a, n);
      if (s.hasEagerState = !0, s.eagerState = f, Mn(f, a)) {
        var p = t.interleaved;
        p === null ? (s.next = s, lp(t)) : (s.next = p.next, p.next = s), t.interleaved = s;
        return;
      }
    } catch {
    } finally {
    }
    n = z0(e, t, s, o), n !== null && (s = wt(), Ln(n, e, o, s), tv(n, t, o));
  }
}
function b0(e) {
  var t = e.alternate;
  return e === Ne || t !== null && t === Ne;
}
function ev(e, t) {
  zs = ua = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function tv(e, t, n) {
  if (n & 4194240) {
    var o = t.lanes;
    o &= e.pendingLanes, n |= o, t.lanes = n, Xd(e, n);
  }
}
var aa = { readContext: mn, useCallback: ct, useContext: ct, useEffect: ct, useImperativeHandle: ct, useInsertionEffect: ct, useLayoutEffect: ct, useMemo: ct, useReducer: ct, useRef: ct, useState: ct, useDebugValue: ct, useDeferredValue: ct, useTransition: ct, useMutableSource: ct, useSyncExternalStore: ct, useId: ct, unstable_isNewReconciler: !1 }, M_ = { readContext: mn, useCallback: function(e, t) {
  return Wn().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: mn, useEffect: pg, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, ju(
    4194308,
    4,
    X0.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return ju(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return ju(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = Wn();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var o = Wn();
  return t = n !== void 0 ? n(t) : t, o.memoizedState = o.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, o.queue = e, e = e.dispatch = L_.bind(null, Ne, e), [o.memoizedState, e];
}, useRef: function(e) {
  var t = Wn();
  return e = { current: e }, t.memoizedState = e;
}, useState: dg, useDebugValue: gp, useDeferredValue: function(e) {
  return Wn().memoizedState = e;
}, useTransition: function() {
  var e = dg(!1), t = e[0];
  return e = R_.bind(null, e[1]), Wn().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var o = Ne, s = Wn();
  if (Le) {
    if (n === void 0) throw Error(H(407));
    n = n();
  } else {
    if (n = t(), $e === null) throw Error(H(349));
    Li & 30 || U0(o, t, n);
  }
  s.memoizedState = n;
  var l = { value: n, getSnapshot: t };
  return s.queue = l, pg(B0.bind(
    null,
    o,
    l,
    e
  ), [e]), o.flags |= 2048, bs(9, H0.bind(null, o, l, n, t), void 0, null), n;
}, useId: function() {
  var e = Wn(), t = $e.identifierPrefix;
  if (Le) {
    var n = ar, o = ur;
    n = (o & ~(1 << 32 - Rn(o) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = qs++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = C_++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, N_ = {
  readContext: mn,
  useCallback: Z0,
  useContext: mn,
  useEffect: mp,
  useImperativeHandle: Y0,
  useInsertionEffect: K0,
  useLayoutEffect: Q0,
  useMemo: J0,
  useReducer: df,
  useRef: V0,
  useState: function() {
    return df($s);
  },
  useDebugValue: gp,
  useDeferredValue: function(e) {
    var t = gn();
    return q0(t, Ke.memoizedState, e);
  },
  useTransition: function() {
    var e = df($s)[0], t = gn().memoizedState;
    return [e, t];
  },
  useMutableSource: D0,
  useSyncExternalStore: F0,
  useId: $0,
  unstable_isNewReconciler: !1
}, j_ = { readContext: mn, useCallback: Z0, useContext: mn, useEffect: mp, useImperativeHandle: Y0, useInsertionEffect: K0, useLayoutEffect: Q0, useMemo: J0, useReducer: pf, useRef: V0, useState: function() {
  return pf($s);
}, useDebugValue: gp, useDeferredValue: function(e) {
  var t = gn();
  return Ke === null ? t.memoizedState = e : q0(t, Ke.memoizedState, e);
}, useTransition: function() {
  var e = pf($s)[0], t = gn().memoizedState;
  return [e, t];
}, useMutableSource: D0, useSyncExternalStore: F0, useId: $0, unstable_isNewReconciler: !1 };
function kn(e, t) {
  if (e && e.defaultProps) {
    t = je({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function hd(e, t, n, o) {
  t = e.memoizedState, n = n(o, t), n = n == null ? t : je({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var ka = { isMounted: function(e) {
  return (e = e._reactInternals) ? ji(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var o = wt(), s = Wr(e), l = cr(o, s);
  l.payload = t, n != null && (l.callback = n), t = Br(e, l, s), t !== null && (Ln(t, e, s, o), Mu(t, e, s));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var o = wt(), s = Wr(e), l = cr(o, s);
  l.tag = 1, l.payload = t, n != null && (l.callback = n), t = Br(e, l, s), t !== null && (Ln(t, e, s, o), Mu(t, e, s));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = wt(), o = Wr(e), s = cr(n, o);
  s.tag = 2, t != null && (s.callback = t), t = Br(e, s, o), t !== null && (Ln(t, e, o, n), Mu(t, e, o));
} };
function hg(e, t, n, o, s, l, a) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(o, l, a) : t.prototype && t.prototype.isPureReactComponent ? !Ks(n, o) || !Ks(s, l) : !0;
}
function nv(e, t, n) {
  var o = !1, s = Xr, l = t.contextType;
  return typeof l == "object" && l !== null ? l = mn(l) : (s = Ft(t) ? Ci : mt.current, o = t.contextTypes, l = (o = o != null) ? Co(e, s) : Xr), t = new t(n, l), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = ka, e.stateNode = t, t._reactInternals = e, o && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = s, e.__reactInternalMemoizedMaskedChildContext = l), t;
}
function mg(e, t, n, o) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, o), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, o), t.state !== e && ka.enqueueReplaceState(t, t.state, null);
}
function md(e, t, n, o) {
  var s = e.stateNode;
  s.props = n, s.state = e.memoizedState, s.refs = {}, up(e);
  var l = t.contextType;
  typeof l == "object" && l !== null ? s.context = mn(l) : (l = Ft(t) ? Ci : mt.current, s.context = Co(e, l)), s.state = e.memoizedState, l = t.getDerivedStateFromProps, typeof l == "function" && (hd(e, t, l, n), s.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (t = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), t !== s.state && ka.enqueueReplaceState(s, s.state, null), sa(e, n, s, o), s.state = e.memoizedState), typeof s.componentDidMount == "function" && (e.flags |= 4194308);
}
function Mo(e, t) {
  try {
    var n = "", o = t;
    do
      n += lx(o), o = o.return;
    while (o);
    var s = n;
  } catch (l) {
    s = `
Error generating stack: ` + l.message + `
` + l.stack;
  }
  return { value: e, source: t, stack: s, digest: null };
}
function hf(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function gd(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var z_ = typeof WeakMap == "function" ? WeakMap : Map;
function rv(e, t, n) {
  n = cr(-1, n), n.tag = 3, n.payload = { element: null };
  var o = t.value;
  return n.callback = function() {
    fa || (fa = !0, Pd = o), gd(e, t);
  }, n;
}
function iv(e, t, n) {
  n = cr(-1, n), n.tag = 3;
  var o = e.type.getDerivedStateFromError;
  if (typeof o == "function") {
    var s = t.value;
    n.payload = function() {
      return o(s);
    }, n.callback = function() {
      gd(e, t);
    };
  }
  var l = e.stateNode;
  return l !== null && typeof l.componentDidCatch == "function" && (n.callback = function() {
    gd(e, t), typeof o != "function" && (Gr === null ? Gr = /* @__PURE__ */ new Set([this]) : Gr.add(this));
    var a = t.stack;
    this.componentDidCatch(t.value, { componentStack: a !== null ? a : "" });
  }), n;
}
function gg(e, t, n) {
  var o = e.pingCache;
  if (o === null) {
    o = e.pingCache = new z_();
    var s = /* @__PURE__ */ new Set();
    o.set(t, s);
  } else s = o.get(t), s === void 0 && (s = /* @__PURE__ */ new Set(), o.set(t, s));
  s.has(n) || (s.add(n), e = Y_.bind(null, e, t, n), t.then(e, e));
}
function yg(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function vg(e, t, n, o, s) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = s, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = cr(-1, 1), t.tag = 2, Br(n, t, 1))), n.lanes |= 1), e);
}
var I_ = mr.ReactCurrentOwner, Ot = !1;
function St(e, t, n, o) {
  t.child = e === null ? j0(t, null, n, o) : Lo(t, e.child, n, o);
}
function Sg(e, t, n, o, s) {
  n = n.render;
  var l = t.ref;
  return Eo(t, s), o = pp(e, t, n, o, l, s), n = hp(), e !== null && !Ot ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~s, hr(e, t, s)) : (Le && n && tp(t), t.flags |= 1, St(e, t, o, s), t.child);
}
function wg(e, t, n, o, s) {
  if (e === null) {
    var l = n.type;
    return typeof l == "function" && !Tp(l) && l.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = l, ov(e, t, l, o, s)) : (e = Du(n.type, null, o, t, t.mode, s), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (l = e.child, !(e.lanes & s)) {
    var a = l.memoizedProps;
    if (n = n.compare, n = n !== null ? n : Ks, n(a, o) && e.ref === t.ref) return hr(e, t, s);
  }
  return t.flags |= 1, e = Vr(l, o), e.ref = t.ref, e.return = t, t.child = e;
}
function ov(e, t, n, o, s) {
  if (e !== null) {
    var l = e.memoizedProps;
    if (Ks(l, o) && e.ref === t.ref) if (Ot = !1, t.pendingProps = o = l, (e.lanes & s) !== 0) e.flags & 131072 && (Ot = !0);
    else return t.lanes = e.lanes, hr(e, t, s);
  }
  return yd(e, t, n, o, s);
}
function sv(e, t, n) {
  var o = t.pendingProps, s = o.children, l = e !== null ? e.memoizedState : null;
  if (o.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, Te(mo, Xt), Xt |= n;
  else {
    if (!(n & 1073741824)) return e = l !== null ? l.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, Te(mo, Xt), Xt |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, o = l !== null ? l.baseLanes : n, Te(mo, Xt), Xt |= o;
  }
  else l !== null ? (o = l.baseLanes | n, t.memoizedState = null) : o = n, Te(mo, Xt), Xt |= o;
  return St(e, t, s, n), t.child;
}
function lv(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function yd(e, t, n, o, s) {
  var l = Ft(n) ? Ci : mt.current;
  return l = Co(t, l), Eo(t, s), n = pp(e, t, n, o, l, s), o = hp(), e !== null && !Ot ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~s, hr(e, t, s)) : (Le && o && tp(t), t.flags |= 1, St(e, t, n, s), t.child);
}
function xg(e, t, n, o, s) {
  if (Ft(n)) {
    var l = !0;
    ta(t);
  } else l = !1;
  if (Eo(t, s), t.stateNode === null) zu(e, t), nv(t, n, o), md(t, n, o, s), o = !0;
  else if (e === null) {
    var a = t.stateNode, f = t.memoizedProps;
    a.props = f;
    var p = a.context, m = n.contextType;
    typeof m == "object" && m !== null ? m = mn(m) : (m = Ft(n) ? Ci : mt.current, m = Co(t, m));
    var g = n.getDerivedStateFromProps, y = typeof g == "function" || typeof a.getSnapshotBeforeUpdate == "function";
    y || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (f !== o || p !== m) && mg(t, a, o, m), Mr = !1;
    var v = t.memoizedState;
    a.state = v, sa(t, o, a, s), p = t.memoizedState, f !== o || v !== p || Dt.current || Mr ? (typeof g == "function" && (hd(t, n, g, o), p = t.memoizedState), (f = Mr || hg(t, n, f, o, v, p, m)) ? (y || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = o, t.memoizedState = p), a.props = o, a.state = p, a.context = m, o = f) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), o = !1);
  } else {
    a = t.stateNode, I0(e, t), f = t.memoizedProps, m = t.type === t.elementType ? f : kn(t.type, f), a.props = m, y = t.pendingProps, v = a.context, p = n.contextType, typeof p == "object" && p !== null ? p = mn(p) : (p = Ft(n) ? Ci : mt.current, p = Co(t, p));
    var x = n.getDerivedStateFromProps;
    (g = typeof x == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (f !== y || v !== p) && mg(t, a, o, p), Mr = !1, v = t.memoizedState, a.state = v, sa(t, o, a, s);
    var k = t.memoizedState;
    f !== y || v !== k || Dt.current || Mr ? (typeof x == "function" && (hd(t, n, x, o), k = t.memoizedState), (m = Mr || hg(t, n, m, o, v, k, p) || !1) ? (g || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(o, k, p), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(o, k, p)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = o, t.memoizedState = k), a.props = o, a.state = k, a.context = p, o = m) : (typeof a.componentDidUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), o = !1);
  }
  return vd(e, t, n, o, l, s);
}
function vd(e, t, n, o, s, l) {
  lv(e, t);
  var a = (t.flags & 128) !== 0;
  if (!o && !a) return s && sg(t, n, !1), hr(e, t, l);
  o = t.stateNode, I_.current = t;
  var f = a && typeof n.getDerivedStateFromError != "function" ? null : o.render();
  return t.flags |= 1, e !== null && a ? (t.child = Lo(t, e.child, null, l), t.child = Lo(t, null, f, l)) : St(e, t, f, l), t.memoizedState = o.state, s && sg(t, n, !0), t.child;
}
function uv(e) {
  var t = e.stateNode;
  t.pendingContext ? og(e, t.pendingContext, t.pendingContext !== t.context) : t.context && og(e, t.context, !1), ap(e, t.containerInfo);
}
function _g(e, t, n, o, s) {
  return Ro(), rp(s), t.flags |= 256, St(e, t, n, o), t.child;
}
var Sd = { dehydrated: null, treeContext: null, retryLane: 0 };
function wd(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function av(e, t, n) {
  var o = t.pendingProps, s = Me.current, l = !1, a = (t.flags & 128) !== 0, f;
  if ((f = a) || (f = e !== null && e.memoizedState === null ? !1 : (s & 2) !== 0), f ? (l = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (s |= 1), Te(Me, s & 1), e === null)
    return dd(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (a = o.children, e = o.fallback, l ? (o = t.mode, l = t.child, a = { mode: "hidden", children: a }, !(o & 1) && l !== null ? (l.childLanes = 0, l.pendingProps = a) : l = Ra(a, o, 0, null), e = Pi(e, o, n, null), l.return = t, e.return = t, l.sibling = e, t.child = l, t.child.memoizedState = wd(n), t.memoizedState = Sd, e) : yp(t, a));
  if (s = e.memoizedState, s !== null && (f = s.dehydrated, f !== null)) return O_(e, t, a, o, f, s, n);
  if (l) {
    l = o.fallback, a = t.mode, s = e.child, f = s.sibling;
    var p = { mode: "hidden", children: o.children };
    return !(a & 1) && t.child !== s ? (o = t.child, o.childLanes = 0, o.pendingProps = p, t.deletions = null) : (o = Vr(s, p), o.subtreeFlags = s.subtreeFlags & 14680064), f !== null ? l = Vr(f, l) : (l = Pi(l, a, n, null), l.flags |= 2), l.return = t, o.return = t, o.sibling = l, t.child = o, o = l, l = t.child, a = e.child.memoizedState, a = a === null ? wd(n) : { baseLanes: a.baseLanes | n, cachePool: null, transitions: a.transitions }, l.memoizedState = a, l.childLanes = e.childLanes & ~n, t.memoizedState = Sd, o;
  }
  return l = e.child, e = l.sibling, o = Vr(l, { mode: "visible", children: o.children }), !(t.mode & 1) && (o.lanes = n), o.return = t, o.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = o, t.memoizedState = null, o;
}
function yp(e, t) {
  return t = Ra({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function yu(e, t, n, o) {
  return o !== null && rp(o), Lo(t, e.child, null, n), e = yp(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function O_(e, t, n, o, s, l, a) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, o = hf(Error(H(422))), yu(e, t, a, o)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (l = o.fallback, s = t.mode, o = Ra({ mode: "visible", children: o.children }, s, 0, null), l = Pi(l, s, a, null), l.flags |= 2, o.return = t, l.return = t, o.sibling = l, t.child = o, t.mode & 1 && Lo(t, e.child, null, a), t.child.memoizedState = wd(a), t.memoizedState = Sd, l);
  if (!(t.mode & 1)) return yu(e, t, a, null);
  if (s.data === "$!") {
    if (o = s.nextSibling && s.nextSibling.dataset, o) var f = o.dgst;
    return o = f, l = Error(H(419)), o = hf(l, o, void 0), yu(e, t, a, o);
  }
  if (f = (a & e.childLanes) !== 0, Ot || f) {
    if (o = $e, o !== null) {
      switch (a & -a) {
        case 4:
          s = 2;
          break;
        case 16:
          s = 8;
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
          s = 32;
          break;
        case 536870912:
          s = 268435456;
          break;
        default:
          s = 0;
      }
      s = s & (o.suspendedLanes | a) ? 0 : s, s !== 0 && s !== l.retryLane && (l.retryLane = s, pr(e, s), Ln(o, e, s, -1));
    }
    return Ep(), o = hf(Error(H(421))), yu(e, t, a, o);
  }
  return s.data === "$?" ? (t.flags |= 128, t.child = e.child, t = Z_.bind(null, e), s._reactRetry = t, null) : (e = l.treeContext, Yt = Hr(s.nextSibling), Zt = t, Le = !0, Cn = null, e !== null && (fn[dn++] = ur, fn[dn++] = ar, fn[dn++] = Ri, ur = e.id, ar = e.overflow, Ri = t), t = yp(t, o.children), t.flags |= 4096, t);
}
function Eg(e, t, n) {
  e.lanes |= t;
  var o = e.alternate;
  o !== null && (o.lanes |= t), pd(e.return, t, n);
}
function mf(e, t, n, o, s) {
  var l = e.memoizedState;
  l === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: o, tail: n, tailMode: s } : (l.isBackwards = t, l.rendering = null, l.renderingStartTime = 0, l.last = o, l.tail = n, l.tailMode = s);
}
function cv(e, t, n) {
  var o = t.pendingProps, s = o.revealOrder, l = o.tail;
  if (St(e, t, o.children, n), o = Me.current, o & 2) o = o & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Eg(e, n, t);
      else if (e.tag === 19) Eg(e, n, t);
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
  if (Te(Me, o), !(t.mode & 1)) t.memoizedState = null;
  else switch (s) {
    case "forwards":
      for (n = t.child, s = null; n !== null; ) e = n.alternate, e !== null && la(e) === null && (s = n), n = n.sibling;
      n = s, n === null ? (s = t.child, t.child = null) : (s = n.sibling, n.sibling = null), mf(t, !1, s, n, l);
      break;
    case "backwards":
      for (n = null, s = t.child, t.child = null; s !== null; ) {
        if (e = s.alternate, e !== null && la(e) === null) {
          t.child = s;
          break;
        }
        e = s.sibling, s.sibling = n, n = s, s = e;
      }
      mf(t, !0, n, null, l);
      break;
    case "together":
      mf(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function zu(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function hr(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), Ai |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(H(153));
  if (t.child !== null) {
    for (e = t.child, n = Vr(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Vr(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function D_(e, t, n) {
  switch (t.tag) {
    case 3:
      uv(t), Ro();
      break;
    case 5:
      O0(t);
      break;
    case 1:
      Ft(t.type) && ta(t);
      break;
    case 4:
      ap(t, t.stateNode.containerInfo);
      break;
    case 10:
      var o = t.type._context, s = t.memoizedProps.value;
      Te(ia, o._currentValue), o._currentValue = s;
      break;
    case 13:
      if (o = t.memoizedState, o !== null)
        return o.dehydrated !== null ? (Te(Me, Me.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? av(e, t, n) : (Te(Me, Me.current & 1), e = hr(e, t, n), e !== null ? e.sibling : null);
      Te(Me, Me.current & 1);
      break;
    case 19:
      if (o = (n & t.childLanes) !== 0, e.flags & 128) {
        if (o) return cv(e, t, n);
        t.flags |= 128;
      }
      if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null, s.lastEffect = null), Te(Me, Me.current), o) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, sv(e, t, n);
  }
  return hr(e, t, n);
}
var fv, xd, dv, pv;
fv = function(e, t) {
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
xd = function() {
};
dv = function(e, t, n, o) {
  var s = e.memoizedProps;
  if (s !== o) {
    e = t.stateNode, vi(Yn.current);
    var l = null;
    switch (n) {
      case "input":
        s = Wf(e, s), o = Wf(e, o), l = [];
        break;
      case "select":
        s = je({}, s, { value: void 0 }), o = je({}, o, { value: void 0 }), l = [];
        break;
      case "textarea":
        s = Qf(e, s), o = Qf(e, o), l = [];
        break;
      default:
        typeof s.onClick != "function" && typeof o.onClick == "function" && (e.onclick = bu);
    }
    Yf(n, o);
    var a;
    n = null;
    for (m in s) if (!o.hasOwnProperty(m) && s.hasOwnProperty(m) && s[m] != null) if (m === "style") {
      var f = s[m];
      for (a in f) f.hasOwnProperty(a) && (n || (n = {}), n[a] = "");
    } else m !== "dangerouslySetInnerHTML" && m !== "children" && m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && m !== "autoFocus" && (Fs.hasOwnProperty(m) ? l || (l = []) : (l = l || []).push(m, null));
    for (m in o) {
      var p = o[m];
      if (f = s != null ? s[m] : void 0, o.hasOwnProperty(m) && p !== f && (p != null || f != null)) if (m === "style") if (f) {
        for (a in f) !f.hasOwnProperty(a) || p && p.hasOwnProperty(a) || (n || (n = {}), n[a] = "");
        for (a in p) p.hasOwnProperty(a) && f[a] !== p[a] && (n || (n = {}), n[a] = p[a]);
      } else n || (l || (l = []), l.push(
        m,
        n
      )), n = p;
      else m === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, f = f ? f.__html : void 0, p != null && f !== p && (l = l || []).push(m, p)) : m === "children" ? typeof p != "string" && typeof p != "number" || (l = l || []).push(m, "" + p) : m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && (Fs.hasOwnProperty(m) ? (p != null && m === "onScroll" && Pe("scroll", e), l || f === p || (l = [])) : (l = l || []).push(m, p));
    }
    n && (l = l || []).push("style", n);
    var m = l;
    (t.updateQueue = m) && (t.flags |= 4);
  }
};
pv = function(e, t, n, o) {
  n !== o && (t.flags |= 4);
};
function ps(e, t) {
  if (!Le) switch (e.tailMode) {
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
  if (t) for (var s = e.child; s !== null; ) n |= s.lanes | s.childLanes, o |= s.subtreeFlags & 14680064, o |= s.flags & 14680064, s.return = e, s = s.sibling;
  else for (s = e.child; s !== null; ) n |= s.lanes | s.childLanes, o |= s.subtreeFlags, o |= s.flags, s.return = e, s = s.sibling;
  return e.subtreeFlags |= o, e.childLanes = n, t;
}
function F_(e, t, n) {
  var o = t.pendingProps;
  switch (np(t), t.tag) {
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
      return Ft(t.type) && ea(), ft(t), null;
    case 3:
      return o = t.stateNode, Ao(), Ce(Dt), Ce(mt), fp(), o.pendingContext && (o.context = o.pendingContext, o.pendingContext = null), (e === null || e.child === null) && (mu(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Cn !== null && (Ld(Cn), Cn = null))), xd(e, t), ft(t), null;
    case 5:
      cp(t);
      var s = vi(Js.current);
      if (n = t.type, e !== null && t.stateNode != null) dv(e, t, n, o, s), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!o) {
          if (t.stateNode === null) throw Error(H(166));
          return ft(t), null;
        }
        if (e = vi(Yn.current), mu(t)) {
          o = t.stateNode, n = t.type;
          var l = t.memoizedProps;
          switch (o[Vn] = t, o[Ys] = l, e = (t.mode & 1) !== 0, n) {
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
              for (s = 0; s < Ts.length; s++) Pe(Ts[s], o);
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
              Nm(o, l), Pe("invalid", o);
              break;
            case "select":
              o._wrapperState = { wasMultiple: !!l.multiple }, Pe("invalid", o);
              break;
            case "textarea":
              zm(o, l), Pe("invalid", o);
          }
          Yf(n, l), s = null;
          for (var a in l) if (l.hasOwnProperty(a)) {
            var f = l[a];
            a === "children" ? typeof f == "string" ? o.textContent !== f && (l.suppressHydrationWarning !== !0 && hu(o.textContent, f, e), s = ["children", f]) : typeof f == "number" && o.textContent !== "" + f && (l.suppressHydrationWarning !== !0 && hu(
              o.textContent,
              f,
              e
            ), s = ["children", "" + f]) : Fs.hasOwnProperty(a) && f != null && a === "onScroll" && Pe("scroll", o);
          }
          switch (n) {
            case "input":
              su(o), jm(o, l, !0);
              break;
            case "textarea":
              su(o), Im(o);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof l.onClick == "function" && (o.onclick = bu);
          }
          o = s, t.updateQueue = o, o !== null && (t.flags |= 4);
        } else {
          a = s.nodeType === 9 ? s : s.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = By(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = a.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof o.is == "string" ? e = a.createElement(n, { is: o.is }) : (e = a.createElement(n), n === "select" && (a = e, o.multiple ? a.multiple = !0 : o.size && (a.size = o.size))) : e = a.createElementNS(e, n), e[Vn] = t, e[Ys] = o, fv(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (a = Zf(n, o), n) {
              case "dialog":
                Pe("cancel", e), Pe("close", e), s = o;
                break;
              case "iframe":
              case "object":
              case "embed":
                Pe("load", e), s = o;
                break;
              case "video":
              case "audio":
                for (s = 0; s < Ts.length; s++) Pe(Ts[s], e);
                s = o;
                break;
              case "source":
                Pe("error", e), s = o;
                break;
              case "img":
              case "image":
              case "link":
                Pe(
                  "error",
                  e
                ), Pe("load", e), s = o;
                break;
              case "details":
                Pe("toggle", e), s = o;
                break;
              case "input":
                Nm(e, o), s = Wf(e, o), Pe("invalid", e);
                break;
              case "option":
                s = o;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!o.multiple }, s = je({}, o, { value: void 0 }), Pe("invalid", e);
                break;
              case "textarea":
                zm(e, o), s = Qf(e, o), Pe("invalid", e);
                break;
              default:
                s = o;
            }
            Yf(n, s), f = s;
            for (l in f) if (f.hasOwnProperty(l)) {
              var p = f[l];
              l === "style" ? Vy(e, p) : l === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, p != null && Gy(e, p)) : l === "children" ? typeof p == "string" ? (n !== "textarea" || p !== "") && Us(e, p) : typeof p == "number" && Us(e, "" + p) : l !== "suppressContentEditableWarning" && l !== "suppressHydrationWarning" && l !== "autoFocus" && (Fs.hasOwnProperty(l) ? p != null && l === "onScroll" && Pe("scroll", e) : p != null && Bd(e, l, p, a));
            }
            switch (n) {
              case "input":
                su(e), jm(e, o, !1);
                break;
              case "textarea":
                su(e), Im(e);
                break;
              case "option":
                o.value != null && e.setAttribute("value", "" + Qr(o.value));
                break;
              case "select":
                e.multiple = !!o.multiple, l = o.value, l != null ? So(e, !!o.multiple, l, !1) : o.defaultValue != null && So(
                  e,
                  !!o.multiple,
                  o.defaultValue,
                  !0
                );
                break;
              default:
                typeof s.onClick == "function" && (e.onclick = bu);
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
      if (e && t.stateNode != null) pv(e, t, e.memoizedProps, o);
      else {
        if (typeof o != "string" && t.stateNode === null) throw Error(H(166));
        if (n = vi(Js.current), vi(Yn.current), mu(t)) {
          if (o = t.stateNode, n = t.memoizedProps, o[Vn] = t, (l = o.nodeValue !== n) && (e = Zt, e !== null)) switch (e.tag) {
            case 3:
              hu(o.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && hu(o.nodeValue, n, (e.mode & 1) !== 0);
          }
          l && (t.flags |= 4);
        } else o = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(o), o[Vn] = t, t.stateNode = o;
      }
      return ft(t), null;
    case 13:
      if (Ce(Me), o = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (Le && Yt !== null && t.mode & 1 && !(t.flags & 128)) M0(), Ro(), t.flags |= 98560, l = !1;
        else if (l = mu(t), o !== null && o.dehydrated !== null) {
          if (e === null) {
            if (!l) throw Error(H(318));
            if (l = t.memoizedState, l = l !== null ? l.dehydrated : null, !l) throw Error(H(317));
            l[Vn] = t;
          } else Ro(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ft(t), l = !1;
        } else Cn !== null && (Ld(Cn), Cn = null), l = !0;
        if (!l) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (o = o !== null, o !== (e !== null && e.memoizedState !== null) && o && (t.child.flags |= 8192, t.mode & 1 && (e === null || Me.current & 1 ? Qe === 0 && (Qe = 3) : Ep())), t.updateQueue !== null && (t.flags |= 4), ft(t), null);
    case 4:
      return Ao(), xd(e, t), e === null && Qs(t.stateNode.containerInfo), ft(t), null;
    case 10:
      return sp(t.type._context), ft(t), null;
    case 17:
      return Ft(t.type) && ea(), ft(t), null;
    case 19:
      if (Ce(Me), l = t.memoizedState, l === null) return ft(t), null;
      if (o = (t.flags & 128) !== 0, a = l.rendering, a === null) if (o) ps(l, !1);
      else {
        if (Qe !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (a = la(e), a !== null) {
            for (t.flags |= 128, ps(l, !1), o = a.updateQueue, o !== null && (t.updateQueue = o, t.flags |= 4), t.subtreeFlags = 0, o = n, n = t.child; n !== null; ) l = n, e = o, l.flags &= 14680066, a = l.alternate, a === null ? (l.childLanes = 0, l.lanes = e, l.child = null, l.subtreeFlags = 0, l.memoizedProps = null, l.memoizedState = null, l.updateQueue = null, l.dependencies = null, l.stateNode = null) : (l.childLanes = a.childLanes, l.lanes = a.lanes, l.child = a.child, l.subtreeFlags = 0, l.deletions = null, l.memoizedProps = a.memoizedProps, l.memoizedState = a.memoizedState, l.updateQueue = a.updateQueue, l.type = a.type, e = a.dependencies, l.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return Te(Me, Me.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        l.tail !== null && Ue() > No && (t.flags |= 128, o = !0, ps(l, !1), t.lanes = 4194304);
      }
      else {
        if (!o) if (e = la(a), e !== null) {
          if (t.flags |= 128, o = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), ps(l, !0), l.tail === null && l.tailMode === "hidden" && !a.alternate && !Le) return ft(t), null;
        } else 2 * Ue() - l.renderingStartTime > No && n !== 1073741824 && (t.flags |= 128, o = !0, ps(l, !1), t.lanes = 4194304);
        l.isBackwards ? (a.sibling = t.child, t.child = a) : (n = l.last, n !== null ? n.sibling = a : t.child = a, l.last = a);
      }
      return l.tail !== null ? (t = l.tail, l.rendering = t, l.tail = t.sibling, l.renderingStartTime = Ue(), t.sibling = null, n = Me.current, Te(Me, o ? n & 1 | 2 : n & 1), t) : (ft(t), null);
    case 22:
    case 23:
      return _p(), o = t.memoizedState !== null, e !== null && e.memoizedState !== null !== o && (t.flags |= 8192), o && t.mode & 1 ? Xt & 1073741824 && (ft(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ft(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(H(156, t.tag));
}
function U_(e, t) {
  switch (np(t), t.tag) {
    case 1:
      return Ft(t.type) && ea(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return Ao(), Ce(Dt), Ce(mt), fp(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return cp(t), null;
    case 13:
      if (Ce(Me), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(H(340));
        Ro();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return Ce(Me), null;
    case 4:
      return Ao(), null;
    case 10:
      return sp(t.type._context), null;
    case 22:
    case 23:
      return _p(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var vu = !1, ht = !1, H_ = typeof WeakSet == "function" ? WeakSet : Set, Z = null;
function ho(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (o) {
    Oe(e, t, o);
  }
  else n.current = null;
}
function _d(e, t, n) {
  try {
    n();
  } catch (o) {
    Oe(e, t, o);
  }
}
var Tg = !1;
function B_(e, t) {
  if (od = Ju, e = v0(), ep(e)) {
    if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else e: {
      n = (n = e.ownerDocument) && n.defaultView || window;
      var o = n.getSelection && n.getSelection();
      if (o && o.rangeCount !== 0) {
        n = o.anchorNode;
        var s = o.anchorOffset, l = o.focusNode;
        o = o.focusOffset;
        try {
          n.nodeType, l.nodeType;
        } catch {
          n = null;
          break e;
        }
        var a = 0, f = -1, p = -1, m = 0, g = 0, y = e, v = null;
        t: for (; ; ) {
          for (var x; y !== n || s !== 0 && y.nodeType !== 3 || (f = a + s), y !== l || o !== 0 && y.nodeType !== 3 || (p = a + o), y.nodeType === 3 && (a += y.nodeValue.length), (x = y.firstChild) !== null; )
            v = y, y = x;
          for (; ; ) {
            if (y === e) break t;
            if (v === n && ++m === s && (f = a), v === l && ++g === o && (p = a), (x = y.nextSibling) !== null) break;
            y = v, v = y.parentNode;
          }
          y = x;
        }
        n = f === -1 || p === -1 ? null : { start: f, end: p };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (sd = { focusedElem: e, selectionRange: n }, Ju = !1, Z = t; Z !== null; ) if (t = Z, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, Z = e;
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
            var L = k.memoizedProps, A = k.memoizedState, w = t.stateNode, S = w.getSnapshotBeforeUpdate(t.elementType === t.type ? L : kn(t.type, L), A);
            w.__reactInternalSnapshotBeforeUpdate = S;
          }
          break;
        case 3:
          var _ = t.stateNode.containerInfo;
          _.nodeType === 1 ? _.textContent = "" : _.nodeType === 9 && _.documentElement && _.removeChild(_.documentElement);
          break;
        case 5:
        case 6:
        case 4:
        case 17:
          break;
        default:
          throw Error(H(163));
      }
    } catch (R) {
      Oe(t, t.return, R);
    }
    if (e = t.sibling, e !== null) {
      e.return = t.return, Z = e;
      break;
    }
    Z = t.return;
  }
  return k = Tg, Tg = !1, k;
}
function Is(e, t, n) {
  var o = t.updateQueue;
  if (o = o !== null ? o.lastEffect : null, o !== null) {
    var s = o = o.next;
    do {
      if ((s.tag & e) === e) {
        var l = s.destroy;
        s.destroy = void 0, l !== void 0 && _d(t, n, l);
      }
      s = s.next;
    } while (s !== o);
  }
}
function Pa(e, t) {
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
function Ed(e) {
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
function hv(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, hv(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Vn], delete t[Ys], delete t[ad], delete t[E_], delete t[T_])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function mv(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function kg(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || mv(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Td(e, t, n) {
  var o = e.tag;
  if (o === 5 || o === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = bu));
  else if (o !== 4 && (e = e.child, e !== null)) for (Td(e, t, n), e = e.sibling; e !== null; ) Td(e, t, n), e = e.sibling;
}
function kd(e, t, n) {
  var o = e.tag;
  if (o === 5 || o === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (o !== 4 && (e = e.child, e !== null)) for (kd(e, t, n), e = e.sibling; e !== null; ) kd(e, t, n), e = e.sibling;
}
var tt = null, Pn = !1;
function Pr(e, t, n) {
  for (n = n.child; n !== null; ) gv(e, t, n), n = n.sibling;
}
function gv(e, t, n) {
  if (Xn && typeof Xn.onCommitFiberUnmount == "function") try {
    Xn.onCommitFiberUnmount(va, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      ht || ho(n, t);
    case 6:
      var o = tt, s = Pn;
      tt = null, Pr(e, t, n), tt = o, Pn = s, tt !== null && (Pn ? (e = tt, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : tt.removeChild(n.stateNode));
      break;
    case 18:
      tt !== null && (Pn ? (e = tt, n = n.stateNode, e.nodeType === 8 ? uf(e.parentNode, n) : e.nodeType === 1 && uf(e, n), Ws(e)) : uf(tt, n.stateNode));
      break;
    case 4:
      o = tt, s = Pn, tt = n.stateNode.containerInfo, Pn = !0, Pr(e, t, n), tt = o, Pn = s;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!ht && (o = n.updateQueue, o !== null && (o = o.lastEffect, o !== null))) {
        s = o = o.next;
        do {
          var l = s, a = l.destroy;
          l = l.tag, a !== void 0 && (l & 2 || l & 4) && _d(n, t, a), s = s.next;
        } while (s !== o);
      }
      Pr(e, t, n);
      break;
    case 1:
      if (!ht && (ho(n, t), o = n.stateNode, typeof o.componentWillUnmount == "function")) try {
        o.props = n.memoizedProps, o.state = n.memoizedState, o.componentWillUnmount();
      } catch (f) {
        Oe(n, t, f);
      }
      Pr(e, t, n);
      break;
    case 21:
      Pr(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (ht = (o = ht) || n.memoizedState !== null, Pr(e, t, n), ht = o) : Pr(e, t, n);
      break;
    default:
      Pr(e, t, n);
  }
}
function Pg(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new H_()), t.forEach(function(o) {
      var s = J_.bind(null, e, o);
      n.has(o) || (n.add(o), o.then(s, s));
    });
  }
}
function xn(e, t) {
  var n = t.deletions;
  if (n !== null) for (var o = 0; o < n.length; o++) {
    var s = n[o];
    try {
      var l = e, a = t, f = a;
      e: for (; f !== null; ) {
        switch (f.tag) {
          case 5:
            tt = f.stateNode, Pn = !1;
            break e;
          case 3:
            tt = f.stateNode.containerInfo, Pn = !0;
            break e;
          case 4:
            tt = f.stateNode.containerInfo, Pn = !0;
            break e;
        }
        f = f.return;
      }
      if (tt === null) throw Error(H(160));
      gv(l, a, s), tt = null, Pn = !1;
      var p = s.alternate;
      p !== null && (p.return = null), s.return = null;
    } catch (m) {
      Oe(s, t, m);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) yv(t, e), t = t.sibling;
}
function yv(e, t) {
  var n = e.alternate, o = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (xn(t, e), Un(e), o & 4) {
        try {
          Is(3, e, e.return), Pa(3, e);
        } catch (L) {
          Oe(e, e.return, L);
        }
        try {
          Is(5, e, e.return);
        } catch (L) {
          Oe(e, e.return, L);
        }
      }
      break;
    case 1:
      xn(t, e), Un(e), o & 512 && n !== null && ho(n, n.return);
      break;
    case 5:
      if (xn(t, e), Un(e), o & 512 && n !== null && ho(n, n.return), e.flags & 32) {
        var s = e.stateNode;
        try {
          Us(s, "");
        } catch (L) {
          Oe(e, e.return, L);
        }
      }
      if (o & 4 && (s = e.stateNode, s != null)) {
        var l = e.memoizedProps, a = n !== null ? n.memoizedProps : l, f = e.type, p = e.updateQueue;
        if (e.updateQueue = null, p !== null) try {
          f === "input" && l.type === "radio" && l.name != null && Uy(s, l), Zf(f, a);
          var m = Zf(f, l);
          for (a = 0; a < p.length; a += 2) {
            var g = p[a], y = p[a + 1];
            g === "style" ? Vy(s, y) : g === "dangerouslySetInnerHTML" ? Gy(s, y) : g === "children" ? Us(s, y) : Bd(s, g, y, m);
          }
          switch (f) {
            case "input":
              Vf(s, l);
              break;
            case "textarea":
              Hy(s, l);
              break;
            case "select":
              var v = s._wrapperState.wasMultiple;
              s._wrapperState.wasMultiple = !!l.multiple;
              var x = l.value;
              x != null ? So(s, !!l.multiple, x, !1) : v !== !!l.multiple && (l.defaultValue != null ? So(
                s,
                !!l.multiple,
                l.defaultValue,
                !0
              ) : So(s, !!l.multiple, l.multiple ? [] : "", !1));
          }
          s[Ys] = l;
        } catch (L) {
          Oe(e, e.return, L);
        }
      }
      break;
    case 6:
      if (xn(t, e), Un(e), o & 4) {
        if (e.stateNode === null) throw Error(H(162));
        s = e.stateNode, l = e.memoizedProps;
        try {
          s.nodeValue = l;
        } catch (L) {
          Oe(e, e.return, L);
        }
      }
      break;
    case 3:
      if (xn(t, e), Un(e), o & 4 && n !== null && n.memoizedState.isDehydrated) try {
        Ws(t.containerInfo);
      } catch (L) {
        Oe(e, e.return, L);
      }
      break;
    case 4:
      xn(t, e), Un(e);
      break;
    case 13:
      xn(t, e), Un(e), s = e.child, s.flags & 8192 && (l = s.memoizedState !== null, s.stateNode.isHidden = l, !l || s.alternate !== null && s.alternate.memoizedState !== null || (wp = Ue())), o & 4 && Pg(e);
      break;
    case 22:
      if (g = n !== null && n.memoizedState !== null, e.mode & 1 ? (ht = (m = ht) || g, xn(t, e), ht = m) : xn(t, e), Un(e), o & 8192) {
        if (m = e.memoizedState !== null, (e.stateNode.isHidden = m) && !g && e.mode & 1) for (Z = e, g = e.child; g !== null; ) {
          for (y = Z = g; Z !== null; ) {
            switch (v = Z, x = v.child, v.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Is(4, v, v.return);
                break;
              case 1:
                ho(v, v.return);
                var k = v.stateNode;
                if (typeof k.componentWillUnmount == "function") {
                  o = v, n = v.return;
                  try {
                    t = o, k.props = t.memoizedProps, k.state = t.memoizedState, k.componentWillUnmount();
                  } catch (L) {
                    Oe(o, n, L);
                  }
                }
                break;
              case 5:
                ho(v, v.return);
                break;
              case 22:
                if (v.memoizedState !== null) {
                  Rg(y);
                  continue;
                }
            }
            x !== null ? (x.return = v, Z = x) : Rg(y);
          }
          g = g.sibling;
        }
        e: for (g = null, y = e; ; ) {
          if (y.tag === 5) {
            if (g === null) {
              g = y;
              try {
                s = y.stateNode, m ? (l = s.style, typeof l.setProperty == "function" ? l.setProperty("display", "none", "important") : l.display = "none") : (f = y.stateNode, p = y.memoizedProps.style, a = p != null && p.hasOwnProperty("display") ? p.display : null, f.style.display = Wy("display", a));
              } catch (L) {
                Oe(e, e.return, L);
              }
            }
          } else if (y.tag === 6) {
            if (g === null) try {
              y.stateNode.nodeValue = m ? "" : y.memoizedProps;
            } catch (L) {
              Oe(e, e.return, L);
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
      xn(t, e), Un(e), o & 4 && Pg(e);
      break;
    case 21:
      break;
    default:
      xn(
        t,
        e
      ), Un(e);
  }
}
function Un(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (mv(n)) {
            var o = n;
            break e;
          }
          n = n.return;
        }
        throw Error(H(160));
      }
      switch (o.tag) {
        case 5:
          var s = o.stateNode;
          o.flags & 32 && (Us(s, ""), o.flags &= -33);
          var l = kg(e);
          kd(e, l, s);
          break;
        case 3:
        case 4:
          var a = o.stateNode.containerInfo, f = kg(e);
          Td(e, f, a);
          break;
        default:
          throw Error(H(161));
      }
    } catch (p) {
      Oe(e, e.return, p);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function G_(e, t, n) {
  Z = e, vv(e);
}
function vv(e, t, n) {
  for (var o = (e.mode & 1) !== 0; Z !== null; ) {
    var s = Z, l = s.child;
    if (s.tag === 22 && o) {
      var a = s.memoizedState !== null || vu;
      if (!a) {
        var f = s.alternate, p = f !== null && f.memoizedState !== null || ht;
        f = vu;
        var m = ht;
        if (vu = a, (ht = p) && !m) for (Z = s; Z !== null; ) a = Z, p = a.child, a.tag === 22 && a.memoizedState !== null ? Lg(s) : p !== null ? (p.return = a, Z = p) : Lg(s);
        for (; l !== null; ) Z = l, vv(l), l = l.sibling;
        Z = s, vu = f, ht = m;
      }
      Cg(e);
    } else s.subtreeFlags & 8772 && l !== null ? (l.return = s, Z = l) : Cg(e);
  }
}
function Cg(e) {
  for (; Z !== null; ) {
    var t = Z;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            ht || Pa(5, t);
            break;
          case 1:
            var o = t.stateNode;
            if (t.flags & 4 && !ht) if (n === null) o.componentDidMount();
            else {
              var s = t.elementType === t.type ? n.memoizedProps : kn(t.type, n.memoizedProps);
              o.componentDidUpdate(s, n.memoizedState, o.__reactInternalSnapshotBeforeUpdate);
            }
            var l = t.updateQueue;
            l !== null && fg(t, l, o);
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
              fg(t, a, n);
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
                  y !== null && Ws(y);
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
        ht || t.flags & 512 && Ed(t);
      } catch (v) {
        Oe(t, t.return, v);
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
function Rg(e) {
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
function Lg(e) {
  for (; Z !== null; ) {
    var t = Z;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Pa(4, t);
          } catch (p) {
            Oe(t, n, p);
          }
          break;
        case 1:
          var o = t.stateNode;
          if (typeof o.componentDidMount == "function") {
            var s = t.return;
            try {
              o.componentDidMount();
            } catch (p) {
              Oe(t, s, p);
            }
          }
          var l = t.return;
          try {
            Ed(t);
          } catch (p) {
            Oe(t, l, p);
          }
          break;
        case 5:
          var a = t.return;
          try {
            Ed(t);
          } catch (p) {
            Oe(t, a, p);
          }
      }
    } catch (p) {
      Oe(t, t.return, p);
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
var W_ = Math.ceil, ca = mr.ReactCurrentDispatcher, vp = mr.ReactCurrentOwner, hn = mr.ReactCurrentBatchConfig, fe = 0, $e = null, Ge = null, nt = 0, Xt = 0, mo = Zr(0), Qe = 0, el = null, Ai = 0, Ca = 0, Sp = 0, Os = null, It = null, wp = 0, No = 1 / 0, ir = null, fa = !1, Pd = null, Gr = null, Su = !1, Ir = null, da = 0, Ds = 0, Cd = null, Iu = -1, Ou = 0;
function wt() {
  return fe & 6 ? Ue() : Iu !== -1 ? Iu : Iu = Ue();
}
function Wr(e) {
  return e.mode & 1 ? fe & 2 && nt !== 0 ? nt & -nt : P_.transition !== null ? (Ou === 0 && (Ou = n0()), Ou) : (e = ge, e !== 0 || (e = window.event, e = e === void 0 ? 16 : a0(e.type)), e) : 1;
}
function Ln(e, t, n, o) {
  if (50 < Ds) throw Ds = 0, Cd = null, Error(H(185));
  rl(e, n, o), (!(fe & 2) || e !== $e) && (e === $e && (!(fe & 2) && (Ca |= n), Qe === 4 && jr(e, nt)), Ut(e, o), n === 1 && fe === 0 && !(t.mode & 1) && (No = Ue() + 500, Ea && Jr()));
}
function Ut(e, t) {
  var n = e.callbackNode;
  Px(e, t);
  var o = Zu(e, e === $e ? nt : 0);
  if (o === 0) n !== null && Fm(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = o & -o, e.callbackPriority !== t) {
    if (n != null && Fm(n), t === 1) e.tag === 0 ? k_(Ag.bind(null, e)) : R0(Ag.bind(null, e)), x_(function() {
      !(fe & 6) && Jr();
    }), n = null;
    else {
      switch (r0(o)) {
        case 1:
          n = Qd;
          break;
        case 4:
          n = e0;
          break;
        case 16:
          n = Yu;
          break;
        case 536870912:
          n = t0;
          break;
        default:
          n = Yu;
      }
      n = Pv(n, Sv.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function Sv(e, t) {
  if (Iu = -1, Ou = 0, fe & 6) throw Error(H(327));
  var n = e.callbackNode;
  if (To() && e.callbackNode !== n) return null;
  var o = Zu(e, e === $e ? nt : 0);
  if (o === 0) return null;
  if (o & 30 || o & e.expiredLanes || t) t = pa(e, o);
  else {
    t = o;
    var s = fe;
    fe |= 2;
    var l = xv();
    ($e !== e || nt !== t) && (ir = null, No = Ue() + 500, ki(e, t));
    do
      try {
        Q_();
        break;
      } catch (f) {
        wv(e, f);
      }
    while (!0);
    op(), ca.current = l, fe = s, Ge !== null ? t = 0 : ($e = null, nt = 0, t = Qe);
  }
  if (t !== 0) {
    if (t === 2 && (s = ed(e), s !== 0 && (o = s, t = Rd(e, s))), t === 1) throw n = el, ki(e, 0), jr(e, o), Ut(e, Ue()), n;
    if (t === 6) jr(e, o);
    else {
      if (s = e.current.alternate, !(o & 30) && !V_(s) && (t = pa(e, o), t === 2 && (l = ed(e), l !== 0 && (o = l, t = Rd(e, l))), t === 1)) throw n = el, ki(e, 0), jr(e, o), Ut(e, Ue()), n;
      switch (e.finishedWork = s, e.finishedLanes = o, t) {
        case 0:
        case 1:
          throw Error(H(345));
        case 2:
          fi(e, It, ir);
          break;
        case 3:
          if (jr(e, o), (o & 130023424) === o && (t = wp + 500 - Ue(), 10 < t)) {
            if (Zu(e, 0) !== 0) break;
            if (s = e.suspendedLanes, (s & o) !== o) {
              wt(), e.pingedLanes |= e.suspendedLanes & s;
              break;
            }
            e.timeoutHandle = ud(fi.bind(null, e, It, ir), t);
            break;
          }
          fi(e, It, ir);
          break;
        case 4:
          if (jr(e, o), (o & 4194240) === o) break;
          for (t = e.eventTimes, s = -1; 0 < o; ) {
            var a = 31 - Rn(o);
            l = 1 << a, a = t[a], a > s && (s = a), o &= ~l;
          }
          if (o = s, o = Ue() - o, o = (120 > o ? 120 : 480 > o ? 480 : 1080 > o ? 1080 : 1920 > o ? 1920 : 3e3 > o ? 3e3 : 4320 > o ? 4320 : 1960 * W_(o / 1960)) - o, 10 < o) {
            e.timeoutHandle = ud(fi.bind(null, e, It, ir), o);
            break;
          }
          fi(e, It, ir);
          break;
        case 5:
          fi(e, It, ir);
          break;
        default:
          throw Error(H(329));
      }
    }
  }
  return Ut(e, Ue()), e.callbackNode === n ? Sv.bind(null, e) : null;
}
function Rd(e, t) {
  var n = Os;
  return e.current.memoizedState.isDehydrated && (ki(e, t).flags |= 256), e = pa(e, t), e !== 2 && (t = It, It = n, t !== null && Ld(t)), e;
}
function Ld(e) {
  It === null ? It = e : It.push.apply(It, e);
}
function V_(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var o = 0; o < n.length; o++) {
        var s = n[o], l = s.getSnapshot;
        s = s.value;
        try {
          if (!Mn(l(), s)) return !1;
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
function jr(e, t) {
  for (t &= ~Sp, t &= ~Ca, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Rn(t), o = 1 << n;
    e[n] = -1, t &= ~o;
  }
}
function Ag(e) {
  if (fe & 6) throw Error(H(327));
  To();
  var t = Zu(e, 0);
  if (!(t & 1)) return Ut(e, Ue()), null;
  var n = pa(e, t);
  if (e.tag !== 0 && n === 2) {
    var o = ed(e);
    o !== 0 && (t = o, n = Rd(e, o));
  }
  if (n === 1) throw n = el, ki(e, 0), jr(e, t), Ut(e, Ue()), n;
  if (n === 6) throw Error(H(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, fi(e, It, ir), Ut(e, Ue()), null;
}
function xp(e, t) {
  var n = fe;
  fe |= 1;
  try {
    return e(t);
  } finally {
    fe = n, fe === 0 && (No = Ue() + 500, Ea && Jr());
  }
}
function Mi(e) {
  Ir !== null && Ir.tag === 0 && !(fe & 6) && To();
  var t = fe;
  fe |= 1;
  var n = hn.transition, o = ge;
  try {
    if (hn.transition = null, ge = 1, e) return e();
  } finally {
    ge = o, hn.transition = n, fe = t, !(fe & 6) && Jr();
  }
}
function _p() {
  Xt = mo.current, Ce(mo);
}
function ki(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, w_(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
    var o = n;
    switch (np(o), o.tag) {
      case 1:
        o = o.type.childContextTypes, o != null && ea();
        break;
      case 3:
        Ao(), Ce(Dt), Ce(mt), fp();
        break;
      case 5:
        cp(o);
        break;
      case 4:
        Ao();
        break;
      case 13:
        Ce(Me);
        break;
      case 19:
        Ce(Me);
        break;
      case 10:
        sp(o.type._context);
        break;
      case 22:
      case 23:
        _p();
    }
    n = n.return;
  }
  if ($e = e, Ge = e = Vr(e.current, null), nt = Xt = t, Qe = 0, el = null, Sp = Ca = Ai = 0, It = Os = null, yi !== null) {
    for (t = 0; t < yi.length; t++) if (n = yi[t], o = n.interleaved, o !== null) {
      n.interleaved = null;
      var s = o.next, l = n.pending;
      if (l !== null) {
        var a = l.next;
        l.next = s, o.next = a;
      }
      n.pending = o;
    }
    yi = null;
  }
  return e;
}
function wv(e, t) {
  do {
    var n = Ge;
    try {
      if (op(), Nu.current = aa, ua) {
        for (var o = Ne.memoizedState; o !== null; ) {
          var s = o.queue;
          s !== null && (s.pending = null), o = o.next;
        }
        ua = !1;
      }
      if (Li = 0, qe = Ke = Ne = null, zs = !1, qs = 0, vp.current = null, n === null || n.return === null) {
        Qe = 1, el = t, Ge = null;
        break;
      }
      e: {
        var l = e, a = n.return, f = n, p = t;
        if (t = nt, f.flags |= 32768, p !== null && typeof p == "object" && typeof p.then == "function") {
          var m = p, g = f, y = g.tag;
          if (!(g.mode & 1) && (y === 0 || y === 11 || y === 15)) {
            var v = g.alternate;
            v ? (g.updateQueue = v.updateQueue, g.memoizedState = v.memoizedState, g.lanes = v.lanes) : (g.updateQueue = null, g.memoizedState = null);
          }
          var x = yg(a);
          if (x !== null) {
            x.flags &= -257, vg(x, a, f, l, t), x.mode & 1 && gg(l, m, t), t = x, p = m;
            var k = t.updateQueue;
            if (k === null) {
              var L = /* @__PURE__ */ new Set();
              L.add(p), t.updateQueue = L;
            } else k.add(p);
            break e;
          } else {
            if (!(t & 1)) {
              gg(l, m, t), Ep();
              break e;
            }
            p = Error(H(426));
          }
        } else if (Le && f.mode & 1) {
          var A = yg(a);
          if (A !== null) {
            !(A.flags & 65536) && (A.flags |= 256), vg(A, a, f, l, t), rp(Mo(p, f));
            break e;
          }
        }
        l = p = Mo(p, f), Qe !== 4 && (Qe = 2), Os === null ? Os = [l] : Os.push(l), l = a;
        do {
          switch (l.tag) {
            case 3:
              l.flags |= 65536, t &= -t, l.lanes |= t;
              var w = rv(l, p, t);
              cg(l, w);
              break e;
            case 1:
              f = p;
              var S = l.type, _ = l.stateNode;
              if (!(l.flags & 128) && (typeof S.getDerivedStateFromError == "function" || _ !== null && typeof _.componentDidCatch == "function" && (Gr === null || !Gr.has(_)))) {
                l.flags |= 65536, t &= -t, l.lanes |= t;
                var R = iv(l, f, t);
                cg(l, R);
                break e;
              }
          }
          l = l.return;
        } while (l !== null);
      }
      Ev(n);
    } catch (I) {
      t = I, Ge === n && n !== null && (Ge = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function xv() {
  var e = ca.current;
  return ca.current = aa, e === null ? aa : e;
}
function Ep() {
  (Qe === 0 || Qe === 3 || Qe === 2) && (Qe = 4), $e === null || !(Ai & 268435455) && !(Ca & 268435455) || jr($e, nt);
}
function pa(e, t) {
  var n = fe;
  fe |= 2;
  var o = xv();
  ($e !== e || nt !== t) && (ir = null, ki(e, t));
  do
    try {
      K_();
      break;
    } catch (s) {
      wv(e, s);
    }
  while (!0);
  if (op(), fe = n, ca.current = o, Ge !== null) throw Error(H(261));
  return $e = null, nt = 0, Qe;
}
function K_() {
  for (; Ge !== null; ) _v(Ge);
}
function Q_() {
  for (; Ge !== null && !yx(); ) _v(Ge);
}
function _v(e) {
  var t = kv(e.alternate, e, Xt);
  e.memoizedProps = e.pendingProps, t === null ? Ev(e) : Ge = t, vp.current = null;
}
function Ev(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = U_(n, t), n !== null) {
        n.flags &= 32767, Ge = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        Qe = 6, Ge = null;
        return;
      }
    } else if (n = F_(n, t, Xt), n !== null) {
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
function fi(e, t, n) {
  var o = ge, s = hn.transition;
  try {
    hn.transition = null, ge = 1, X_(e, t, n, o);
  } finally {
    hn.transition = s, ge = o;
  }
  return null;
}
function X_(e, t, n, o) {
  do
    To();
  while (Ir !== null);
  if (fe & 6) throw Error(H(327));
  n = e.finishedWork;
  var s = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(H(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var l = n.lanes | n.childLanes;
  if (Cx(e, l), e === $e && (Ge = $e = null, nt = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Su || (Su = !0, Pv(Yu, function() {
    return To(), null;
  })), l = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || l) {
    l = hn.transition, hn.transition = null;
    var a = ge;
    ge = 1;
    var f = fe;
    fe |= 4, vp.current = null, B_(e, n), yv(n, e), p_(sd), Ju = !!od, sd = od = null, e.current = n, G_(n), vx(), fe = f, ge = a, hn.transition = l;
  } else e.current = n;
  if (Su && (Su = !1, Ir = e, da = s), l = e.pendingLanes, l === 0 && (Gr = null), xx(n.stateNode), Ut(e, Ue()), t !== null) for (o = e.onRecoverableError, n = 0; n < t.length; n++) s = t[n], o(s.value, { componentStack: s.stack, digest: s.digest });
  if (fa) throw fa = !1, e = Pd, Pd = null, e;
  return da & 1 && e.tag !== 0 && To(), l = e.pendingLanes, l & 1 ? e === Cd ? Ds++ : (Ds = 0, Cd = e) : Ds = 0, Jr(), null;
}
function To() {
  if (Ir !== null) {
    var e = r0(da), t = hn.transition, n = ge;
    try {
      if (hn.transition = null, ge = 16 > e ? 16 : e, Ir === null) var o = !1;
      else {
        if (e = Ir, Ir = null, da = 0, fe & 6) throw Error(H(331));
        var s = fe;
        for (fe |= 4, Z = e.current; Z !== null; ) {
          var l = Z, a = l.child;
          if (Z.flags & 16) {
            var f = l.deletions;
            if (f !== null) {
              for (var p = 0; p < f.length; p++) {
                var m = f[p];
                for (Z = m; Z !== null; ) {
                  var g = Z;
                  switch (g.tag) {
                    case 0:
                    case 11:
                    case 15:
                      Is(8, g, l);
                  }
                  var y = g.child;
                  if (y !== null) y.return = g, Z = y;
                  else for (; Z !== null; ) {
                    g = Z;
                    var v = g.sibling, x = g.return;
                    if (hv(g), g === m) {
                      Z = null;
                      break;
                    }
                    if (v !== null) {
                      v.return = x, Z = v;
                      break;
                    }
                    Z = x;
                  }
                }
              }
              var k = l.alternate;
              if (k !== null) {
                var L = k.child;
                if (L !== null) {
                  k.child = null;
                  do {
                    var A = L.sibling;
                    L.sibling = null, L = A;
                  } while (L !== null);
                }
              }
              Z = l;
            }
          }
          if (l.subtreeFlags & 2064 && a !== null) a.return = l, Z = a;
          else e: for (; Z !== null; ) {
            if (l = Z, l.flags & 2048) switch (l.tag) {
              case 0:
              case 11:
              case 15:
                Is(9, l, l.return);
            }
            var w = l.sibling;
            if (w !== null) {
              w.return = l.return, Z = w;
              break e;
            }
            Z = l.return;
          }
        }
        var S = e.current;
        for (Z = S; Z !== null; ) {
          a = Z;
          var _ = a.child;
          if (a.subtreeFlags & 2064 && _ !== null) _.return = a, Z = _;
          else e: for (a = S; Z !== null; ) {
            if (f = Z, f.flags & 2048) try {
              switch (f.tag) {
                case 0:
                case 11:
                case 15:
                  Pa(9, f);
              }
            } catch (I) {
              Oe(f, f.return, I);
            }
            if (f === a) {
              Z = null;
              break e;
            }
            var R = f.sibling;
            if (R !== null) {
              R.return = f.return, Z = R;
              break e;
            }
            Z = f.return;
          }
        }
        if (fe = s, Jr(), Xn && typeof Xn.onPostCommitFiberRoot == "function") try {
          Xn.onPostCommitFiberRoot(va, e);
        } catch {
        }
        o = !0;
      }
      return o;
    } finally {
      ge = n, hn.transition = t;
    }
  }
  return !1;
}
function Mg(e, t, n) {
  t = Mo(n, t), t = rv(e, t, 1), e = Br(e, t, 1), t = wt(), e !== null && (rl(e, 1, t), Ut(e, t));
}
function Oe(e, t, n) {
  if (e.tag === 3) Mg(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      Mg(t, e, n);
      break;
    } else if (t.tag === 1) {
      var o = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof o.componentDidCatch == "function" && (Gr === null || !Gr.has(o))) {
        e = Mo(n, e), e = iv(t, e, 1), t = Br(t, e, 1), e = wt(), t !== null && (rl(t, 1, e), Ut(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function Y_(e, t, n) {
  var o = e.pingCache;
  o !== null && o.delete(t), t = wt(), e.pingedLanes |= e.suspendedLanes & n, $e === e && (nt & n) === n && (Qe === 4 || Qe === 3 && (nt & 130023424) === nt && 500 > Ue() - wp ? ki(e, 0) : Sp |= n), Ut(e, t);
}
function Tv(e, t) {
  t === 0 && (e.mode & 1 ? (t = au, au <<= 1, !(au & 130023424) && (au = 4194304)) : t = 1);
  var n = wt();
  e = pr(e, t), e !== null && (rl(e, t, n), Ut(e, n));
}
function Z_(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), Tv(e, n);
}
function J_(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var o = e.stateNode, s = e.memoizedState;
      s !== null && (n = s.retryLane);
      break;
    case 19:
      o = e.stateNode;
      break;
    default:
      throw Error(H(314));
  }
  o !== null && o.delete(t), Tv(e, n);
}
var kv;
kv = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || Dt.current) Ot = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return Ot = !1, D_(e, t, n);
    Ot = !!(e.flags & 131072);
  }
  else Ot = !1, Le && t.flags & 1048576 && L0(t, ra, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var o = t.type;
      zu(e, t), e = t.pendingProps;
      var s = Co(t, mt.current);
      Eo(t, n), s = pp(null, t, o, e, s, n);
      var l = hp();
      return t.flags |= 1, typeof s == "object" && s !== null && typeof s.render == "function" && s.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ft(o) ? (l = !0, ta(t)) : l = !1, t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, up(t), s.updater = ka, t.stateNode = s, s._reactInternals = t, md(t, o, e, n), t = vd(null, t, o, !0, l, n)) : (t.tag = 0, Le && l && tp(t), St(null, t, s, n), t = t.child), t;
    case 16:
      o = t.elementType;
      e: {
        switch (zu(e, t), e = t.pendingProps, s = o._init, o = s(o._payload), t.type = o, s = t.tag = $_(o), e = kn(o, e), s) {
          case 0:
            t = yd(null, t, o, e, n);
            break e;
          case 1:
            t = xg(null, t, o, e, n);
            break e;
          case 11:
            t = Sg(null, t, o, e, n);
            break e;
          case 14:
            t = wg(null, t, o, kn(o.type, e), n);
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
      return o = t.type, s = t.pendingProps, s = t.elementType === o ? s : kn(o, s), yd(e, t, o, s, n);
    case 1:
      return o = t.type, s = t.pendingProps, s = t.elementType === o ? s : kn(o, s), xg(e, t, o, s, n);
    case 3:
      e: {
        if (uv(t), e === null) throw Error(H(387));
        o = t.pendingProps, l = t.memoizedState, s = l.element, I0(e, t), sa(t, o, null, n);
        var a = t.memoizedState;
        if (o = a.element, l.isDehydrated) if (l = { element: o, isDehydrated: !1, cache: a.cache, pendingSuspenseBoundaries: a.pendingSuspenseBoundaries, transitions: a.transitions }, t.updateQueue.baseState = l, t.memoizedState = l, t.flags & 256) {
          s = Mo(Error(H(423)), t), t = _g(e, t, o, n, s);
          break e;
        } else if (o !== s) {
          s = Mo(Error(H(424)), t), t = _g(e, t, o, n, s);
          break e;
        } else for (Yt = Hr(t.stateNode.containerInfo.firstChild), Zt = t, Le = !0, Cn = null, n = j0(t, null, o, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (Ro(), o === s) {
            t = hr(e, t, n);
            break e;
          }
          St(e, t, o, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return O0(t), e === null && dd(t), o = t.type, s = t.pendingProps, l = e !== null ? e.memoizedProps : null, a = s.children, ld(o, s) ? a = null : l !== null && ld(o, l) && (t.flags |= 32), lv(e, t), St(e, t, a, n), t.child;
    case 6:
      return e === null && dd(t), null;
    case 13:
      return av(e, t, n);
    case 4:
      return ap(t, t.stateNode.containerInfo), o = t.pendingProps, e === null ? t.child = Lo(t, null, o, n) : St(e, t, o, n), t.child;
    case 11:
      return o = t.type, s = t.pendingProps, s = t.elementType === o ? s : kn(o, s), Sg(e, t, o, s, n);
    case 7:
      return St(e, t, t.pendingProps, n), t.child;
    case 8:
      return St(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return St(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (o = t.type._context, s = t.pendingProps, l = t.memoizedProps, a = s.value, Te(ia, o._currentValue), o._currentValue = a, l !== null) if (Mn(l.value, a)) {
          if (l.children === s.children && !Dt.current) {
            t = hr(e, t, n);
            break e;
          }
        } else for (l = t.child, l !== null && (l.return = t); l !== null; ) {
          var f = l.dependencies;
          if (f !== null) {
            a = l.child;
            for (var p = f.firstContext; p !== null; ) {
              if (p.context === o) {
                if (l.tag === 1) {
                  p = cr(-1, n & -n), p.tag = 2;
                  var m = l.updateQueue;
                  if (m !== null) {
                    m = m.shared;
                    var g = m.pending;
                    g === null ? p.next = p : (p.next = g.next, g.next = p), m.pending = p;
                  }
                }
                l.lanes |= n, p = l.alternate, p !== null && (p.lanes |= n), pd(
                  l.return,
                  n,
                  t
                ), f.lanes |= n;
                break;
              }
              p = p.next;
            }
          } else if (l.tag === 10) a = l.type === t.type ? null : l.child;
          else if (l.tag === 18) {
            if (a = l.return, a === null) throw Error(H(341));
            a.lanes |= n, f = a.alternate, f !== null && (f.lanes |= n), pd(a, n, t), a = l.sibling;
          } else a = l.child;
          if (a !== null) a.return = l;
          else for (a = l; a !== null; ) {
            if (a === t) {
              a = null;
              break;
            }
            if (l = a.sibling, l !== null) {
              l.return = a.return, a = l;
              break;
            }
            a = a.return;
          }
          l = a;
        }
        St(e, t, s.children, n), t = t.child;
      }
      return t;
    case 9:
      return s = t.type, o = t.pendingProps.children, Eo(t, n), s = mn(s), o = o(s), t.flags |= 1, St(e, t, o, n), t.child;
    case 14:
      return o = t.type, s = kn(o, t.pendingProps), s = kn(o.type, s), wg(e, t, o, s, n);
    case 15:
      return ov(e, t, t.type, t.pendingProps, n);
    case 17:
      return o = t.type, s = t.pendingProps, s = t.elementType === o ? s : kn(o, s), zu(e, t), t.tag = 1, Ft(o) ? (e = !0, ta(t)) : e = !1, Eo(t, n), nv(t, o, s), md(t, o, s, n), vd(null, t, o, !0, e, n);
    case 19:
      return cv(e, t, n);
    case 22:
      return sv(e, t, n);
  }
  throw Error(H(156, t.tag));
};
function Pv(e, t) {
  return by(e, t);
}
function q_(e, t, n, o) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = o, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function pn(e, t, n, o) {
  return new q_(e, t, n, o);
}
function Tp(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function $_(e) {
  if (typeof e == "function") return Tp(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === Wd) return 11;
    if (e === Vd) return 14;
  }
  return 2;
}
function Vr(e, t) {
  var n = e.alternate;
  return n === null ? (n = pn(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function Du(e, t, n, o, s, l) {
  var a = 2;
  if (o = e, typeof e == "function") Tp(e) && (a = 1);
  else if (typeof e == "string") a = 5;
  else e: switch (e) {
    case io:
      return Pi(n.children, s, l, t);
    case Gd:
      a = 8, s |= 8;
      break;
    case Uf:
      return e = pn(12, n, t, s | 2), e.elementType = Uf, e.lanes = l, e;
    case Hf:
      return e = pn(13, n, t, s), e.elementType = Hf, e.lanes = l, e;
    case Bf:
      return e = pn(19, n, t, s), e.elementType = Bf, e.lanes = l, e;
    case Oy:
      return Ra(n, s, l, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case zy:
          a = 10;
          break e;
        case Iy:
          a = 9;
          break e;
        case Wd:
          a = 11;
          break e;
        case Vd:
          a = 14;
          break e;
        case Ar:
          a = 16, o = null;
          break e;
      }
      throw Error(H(130, e == null ? e : typeof e, ""));
  }
  return t = pn(a, n, t, s), t.elementType = e, t.type = o, t.lanes = l, t;
}
function Pi(e, t, n, o) {
  return e = pn(7, e, o, t), e.lanes = n, e;
}
function Ra(e, t, n, o) {
  return e = pn(22, e, o, t), e.elementType = Oy, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function gf(e, t, n) {
  return e = pn(6, e, null, t), e.lanes = n, e;
}
function yf(e, t, n) {
  return t = pn(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function b_(e, t, n, o, s) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Jc(0), this.expirationTimes = Jc(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Jc(0), this.identifierPrefix = o, this.onRecoverableError = s, this.mutableSourceEagerHydrationData = null;
}
function kp(e, t, n, o, s, l, a, f, p) {
  return e = new b_(e, t, n, f, p), t === 1 ? (t = 1, l === !0 && (t |= 8)) : t = 0, l = pn(3, null, null, t), e.current = l, l.stateNode = e, l.memoizedState = { element: o, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, up(l), e;
}
function e2(e, t, n) {
  var o = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: ro, key: o == null ? null : "" + o, children: e, containerInfo: t, implementation: n };
}
function Cv(e) {
  if (!e) return Xr;
  e = e._reactInternals;
  e: {
    if (ji(e) !== e || e.tag !== 1) throw Error(H(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Ft(t.type)) {
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
    if (Ft(n)) return C0(e, n, t);
  }
  return t;
}
function Rv(e, t, n, o, s, l, a, f, p) {
  return e = kp(n, o, !0, e, s, l, a, f, p), e.context = Cv(null), n = e.current, o = wt(), s = Wr(n), l = cr(o, s), l.callback = t ?? null, Br(n, l, s), e.current.lanes = s, rl(e, s, o), Ut(e, o), e;
}
function La(e, t, n, o) {
  var s = t.current, l = wt(), a = Wr(s);
  return n = Cv(n), t.context === null ? t.context = n : t.pendingContext = n, t = cr(l, a), t.payload = { element: e }, o = o === void 0 ? null : o, o !== null && (t.callback = o), e = Br(s, t, a), e !== null && (Ln(e, s, a, l), Mu(e, s, a)), a;
}
function ha(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Ng(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Pp(e, t) {
  Ng(e, t), (e = e.alternate) && Ng(e, t);
}
function t2() {
  return null;
}
var Lv = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function Cp(e) {
  this._internalRoot = e;
}
Aa.prototype.render = Cp.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(H(409));
  La(e, t, null, null);
};
Aa.prototype.unmount = Cp.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Mi(function() {
      La(null, e, null, null);
    }), t[dr] = null;
  }
};
function Aa(e) {
  this._internalRoot = e;
}
Aa.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = s0();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < Nr.length && t !== 0 && t < Nr[n].priority; n++) ;
    Nr.splice(n, 0, e), n === 0 && u0(e);
  }
};
function Rp(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function Ma(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function jg() {
}
function n2(e, t, n, o, s) {
  if (s) {
    if (typeof o == "function") {
      var l = o;
      o = function() {
        var m = ha(a);
        l.call(m);
      };
    }
    var a = Rv(t, o, e, 0, null, !1, !1, "", jg);
    return e._reactRootContainer = a, e[dr] = a.current, Qs(e.nodeType === 8 ? e.parentNode : e), Mi(), a;
  }
  for (; s = e.lastChild; ) e.removeChild(s);
  if (typeof o == "function") {
    var f = o;
    o = function() {
      var m = ha(p);
      f.call(m);
    };
  }
  var p = kp(e, 0, !1, null, null, !1, !1, "", jg);
  return e._reactRootContainer = p, e[dr] = p.current, Qs(e.nodeType === 8 ? e.parentNode : e), Mi(function() {
    La(t, p, n, o);
  }), p;
}
function Na(e, t, n, o, s) {
  var l = n._reactRootContainer;
  if (l) {
    var a = l;
    if (typeof s == "function") {
      var f = s;
      s = function() {
        var p = ha(a);
        f.call(p);
      };
    }
    La(t, a, e, s);
  } else a = n2(n, t, e, s, o);
  return ha(a);
}
i0 = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = Es(t.pendingLanes);
        n !== 0 && (Xd(t, n | 1), Ut(t, Ue()), !(fe & 6) && (No = Ue() + 500, Jr()));
      }
      break;
    case 13:
      Mi(function() {
        var o = pr(e, 1);
        if (o !== null) {
          var s = wt();
          Ln(o, e, 1, s);
        }
      }), Pp(e, 1);
  }
};
Yd = function(e) {
  if (e.tag === 13) {
    var t = pr(e, 134217728);
    if (t !== null) {
      var n = wt();
      Ln(t, e, 134217728, n);
    }
    Pp(e, 134217728);
  }
};
o0 = function(e) {
  if (e.tag === 13) {
    var t = Wr(e), n = pr(e, t);
    if (n !== null) {
      var o = wt();
      Ln(n, e, t, o);
    }
    Pp(e, t);
  }
};
s0 = function() {
  return ge;
};
l0 = function(e, t) {
  var n = ge;
  try {
    return ge = e, t();
  } finally {
    ge = n;
  }
};
qf = function(e, t, n) {
  switch (t) {
    case "input":
      if (Vf(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var o = n[t];
          if (o !== e && o.form === e.form) {
            var s = _a(o);
            if (!s) throw Error(H(90));
            Fy(o), Vf(o, s);
          }
        }
      }
      break;
    case "textarea":
      Hy(e, n);
      break;
    case "select":
      t = n.value, t != null && So(e, !!n.multiple, t, !1);
  }
};
Xy = xp;
Yy = Mi;
var r2 = { usingClientEntryPoint: !1, Events: [ol, uo, _a, Ky, Qy, xp] }, hs = { findFiberByHostInstance: gi, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, i2 = { bundleType: hs.bundleType, version: hs.version, rendererPackageName: hs.rendererPackageName, rendererConfig: hs.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: mr.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = qy(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: hs.findFiberByHostInstance || t2, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var wu = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!wu.isDisabled && wu.supportsFiber) try {
    va = wu.inject(i2), Xn = wu;
  } catch {
  }
}
qt.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = r2;
qt.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Rp(t)) throw Error(H(200));
  return e2(e, t, null, n);
};
qt.createRoot = function(e, t) {
  if (!Rp(e)) throw Error(H(299));
  var n = !1, o = "", s = Lv;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (o = t.identifierPrefix), t.onRecoverableError !== void 0 && (s = t.onRecoverableError)), t = kp(e, 1, !1, null, null, n, !1, o, s), e[dr] = t.current, Qs(e.nodeType === 8 ? e.parentNode : e), new Cp(t);
};
qt.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(H(188)) : (e = Object.keys(e).join(","), Error(H(268, e)));
  return e = qy(t), e = e === null ? null : e.stateNode, e;
};
qt.flushSync = function(e) {
  return Mi(e);
};
qt.hydrate = function(e, t, n) {
  if (!Ma(t)) throw Error(H(200));
  return Na(null, e, t, !0, n);
};
qt.hydrateRoot = function(e, t, n) {
  if (!Rp(e)) throw Error(H(405));
  var o = n != null && n.hydratedSources || null, s = !1, l = "", a = Lv;
  if (n != null && (n.unstable_strictMode === !0 && (s = !0), n.identifierPrefix !== void 0 && (l = n.identifierPrefix), n.onRecoverableError !== void 0 && (a = n.onRecoverableError)), t = Rv(t, null, e, 1, n ?? null, s, !1, l, a), e[dr] = t.current, Qs(e), o) for (e = 0; e < o.length; e++) n = o[e], s = n._getVersion, s = s(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, s] : t.mutableSourceEagerHydrationData.push(
    n,
    s
  );
  return new Aa(t);
};
qt.render = function(e, t, n) {
  if (!Ma(t)) throw Error(H(200));
  return Na(null, e, t, !1, n);
};
qt.unmountComponentAtNode = function(e) {
  if (!Ma(e)) throw Error(H(40));
  return e._reactRootContainer ? (Mi(function() {
    Na(null, null, e, !1, function() {
      e._reactRootContainer = null, e[dr] = null;
    });
  }), !0) : !1;
};
qt.unstable_batchedUpdates = xp;
qt.unstable_renderSubtreeIntoContainer = function(e, t, n, o) {
  if (!Ma(n)) throw Error(H(200));
  if (e == null || e._reactInternals === void 0) throw Error(H(38));
  return Na(e, t, n, !1, o);
};
qt.version = "18.3.1-next-f1338f8080-20240426";
function Av() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Av);
    } catch (e) {
      console.error(e);
    }
}
Av(), Ay.exports = qt;
var o2 = Ay.exports, Mv, zg = o2;
Mv = zg.createRoot, zg.hydrateRoot;
var Nv = { exports: {} }, zi = {};
/**
 * @license React
 * react-reconciler-constants.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
zi.ConcurrentRoot = 1;
zi.ContinuousEventPriority = 4;
zi.DefaultEventPriority = 16;
zi.DiscreteEventPriority = 1;
zi.IdleEventPriority = 536870912;
zi.LegacyRoot = 0;
Nv.exports = zi;
var go = Nv.exports;
function s2(e) {
  let t;
  const n = /* @__PURE__ */ new Set(), o = (m, g) => {
    const y = typeof m == "function" ? m(t) : m;
    if (y !== t) {
      const v = t;
      t = g ? y : Object.assign({}, t, y), n.forEach((x) => x(t, v));
    }
  }, s = () => t, l = (m, g = s, y = Object.is) => {
    console.warn("[DEPRECATED] Please use `subscribeWithSelector` middleware");
    let v = g(t);
    function x() {
      const k = g(t);
      if (!y(v, k)) {
        const L = v;
        m(v = k, L);
      }
    }
    return n.add(x), () => n.delete(x);
  }, p = { setState: o, getState: s, subscribe: (m, g, y) => g || y ? l(m, g, y) : (n.add(m), () => n.delete(m)), destroy: () => n.clear() };
  return t = e(o, s, p), p;
}
const l2 = typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), Ig = l2 ? W.useEffect : W.useLayoutEffect;
function u2(e) {
  const t = typeof e == "function" ? s2(e) : e, n = (o = t.getState, s = Object.is) => {
    const [, l] = W.useReducer((A) => A + 1, 0), a = t.getState(), f = W.useRef(a), p = W.useRef(o), m = W.useRef(s), g = W.useRef(!1), y = W.useRef();
    y.current === void 0 && (y.current = o(a));
    let v, x = !1;
    (f.current !== a || p.current !== o || m.current !== s || g.current) && (v = o(a), x = !s(y.current, v)), Ig(() => {
      x && (y.current = v), f.current = a, p.current = o, m.current = s, g.current = !1;
    });
    const k = W.useRef(a);
    Ig(() => {
      const A = () => {
        try {
          const S = t.getState(), _ = p.current(S);
          m.current(y.current, _) || (f.current = S, y.current = _, l());
        } catch {
          g.current = !0, l();
        }
      }, w = t.subscribe(A);
      return t.getState() !== k.current && A(), w;
    }, []);
    const L = x ? v : y.current;
    return W.useDebugValue(L), L;
  };
  return Object.assign(n, t), n[Symbol.iterator] = function() {
    console.warn("[useStore, api] = create() is deprecated and will be removed in v4");
    const o = [n, t];
    return {
      next() {
        const s = o.length <= 0;
        return { value: o.shift(), done: s };
      }
    };
  }, n;
}
const a2 = (e) => typeof e == "object" && typeof e.then == "function", Si = [];
function jv(e, t, n = (o, s) => o === s) {
  if (e === t) return !0;
  if (!e || !t) return !1;
  const o = e.length;
  if (t.length !== o) return !1;
  for (let s = 0; s < o; s++) if (!n(e[s], t[s])) return !1;
  return !0;
}
function zv(e, t = null, n = !1, o = {}) {
  t === null && (t = [e]);
  for (const l of Si)
    if (jv(t, l.keys, l.equal)) {
      if (n) return;
      if (Object.prototype.hasOwnProperty.call(l, "error")) throw l.error;
      if (Object.prototype.hasOwnProperty.call(l, "response"))
        return o.lifespan && o.lifespan > 0 && (l.timeout && clearTimeout(l.timeout), l.timeout = setTimeout(l.remove, o.lifespan)), l.response;
      if (!n) throw l.promise;
    }
  const s = {
    keys: t,
    equal: o.equal,
    remove: () => {
      const l = Si.indexOf(s);
      l !== -1 && Si.splice(l, 1);
    },
    promise: (
      // Execute the promise
      (a2(e) ? e : e(...t)).then((l) => {
        s.response = l, o.lifespan && o.lifespan > 0 && (s.timeout = setTimeout(s.remove, o.lifespan));
      }).catch((l) => s.error = l)
    )
  };
  if (Si.push(s), !n) throw s.promise;
}
const c2 = (e, t, n) => zv(e, t, !1, n), f2 = (e, t, n) => void zv(e, t, !0, n), d2 = (e) => {
  if (e === void 0 || e.length === 0) Si.splice(0, Si.length);
  else {
    const t = Si.find((n) => jv(e, n.keys, n.equal));
    t && t.remove();
  }
};
var Iv = { exports: {} }, Ov = { exports: {} }, Dv = {};
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
      if (0 < s(te, U)) N[Y] = U, N[F] = te, F = Y;
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
      e: for (var Y = 0, te = N.length, ce = te >>> 1; Y < ce; ) {
        var ze = 2 * (Y + 1) - 1, it = N[ze], Xe = ze + 1, bt = N[Xe];
        if (0 > s(it, F)) Xe < te && 0 > s(bt, it) ? (N[Y] = bt, N[Xe] = F, Y = Xe) : (N[Y] = it, N[ze] = F, Y = ze);
        else if (Xe < te && 0 > s(bt, F)) N[Y] = bt, N[Xe] = F, Y = Xe;
        else break e;
      }
    }
    return U;
  }
  function s(N, U) {
    var F = N.sortIndex - U.sortIndex;
    return F !== 0 ? F : N.id - U.id;
  }
  if (typeof performance == "object" && typeof performance.now == "function") {
    var l = performance;
    e.unstable_now = function() {
      return l.now();
    };
  } else {
    var a = Date, f = a.now();
    e.unstable_now = function() {
      return a.now() - f;
    };
  }
  var p = [], m = [], g = 1, y = null, v = 3, x = !1, k = !1, L = !1, A = typeof setTimeout == "function" ? setTimeout : null, w = typeof clearTimeout == "function" ? clearTimeout : null, S = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function _(N) {
    for (var U = n(m); U !== null; ) {
      if (U.callback === null) o(m);
      else if (U.startTime <= N) o(m), U.sortIndex = U.expirationTime, t(p, U);
      else break;
      U = n(m);
    }
  }
  function R(N) {
    if (L = !1, _(N), !k) if (n(p) !== null) k = !0, be(I);
    else {
      var U = n(m);
      U !== null && Tt(R, U.startTime - N);
    }
  }
  function I(N, U) {
    k = !1, L && (L = !1, w(B), B = -1), x = !0;
    var F = v;
    try {
      for (_(U), y = n(p); y !== null && (!(y.expirationTime > U) || N && !Q()); ) {
        var Y = y.callback;
        if (typeof Y == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = Y(y.expirationTime <= U);
          U = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && o(p), _(U);
        } else o(p);
        y = n(p);
      }
      if (y !== null) var ce = !0;
      else {
        var ze = n(m);
        ze !== null && Tt(R, ze.startTime - U), ce = !1;
      }
      return ce;
    } finally {
      y = null, v = F, x = !1;
    }
  }
  var O = !1, D = null, B = -1, q = 5, V = -1;
  function Q() {
    return !(e.unstable_now() - V < q);
  }
  function le() {
    if (D !== null) {
      var N = e.unstable_now();
      V = N;
      var U = !0;
      try {
        U = D(!0, N);
      } finally {
        U ? Se() : (O = !1, D = null);
      }
    } else O = !1;
  }
  var Se;
  if (typeof S == "function") Se = function() {
    S(le);
  };
  else if (typeof MessageChannel < "u") {
    var Et = new MessageChannel(), Ht = Et.port2;
    Et.port1.onmessage = le, Se = function() {
      Ht.postMessage(null);
    };
  } else Se = function() {
    A(le, 0);
  };
  function be(N) {
    D = N, O || (O = !0, Se());
  }
  function Tt(N, U) {
    B = A(function() {
      N(e.unstable_now());
    }, U);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    k || x || (k = !0, be(I));
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
    return te = F + te, N = { id: g++, callback: U, priorityLevel: N, startTime: F, expirationTime: te, sortIndex: -1 }, F > Y ? (N.sortIndex = F, t(m, N), n(p) === null && N === n(m) && (L ? (w(B), B = -1) : L = !0, Tt(R, F - Y))) : (N.sortIndex = te, t(p, N), k || x || (k = !0, be(I))), N;
  }, e.unstable_shouldYield = Q, e.unstable_wrapCallback = function(N) {
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
})(Dv);
Ov.exports = Dv;
var Ad = Ov.exports;
/**
 * @license React
 * react-reconciler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var p2 = function(t) {
  var n = {}, o = W, s = Ad, l = Object.assign;
  function a(r) {
    for (var i = "https://reactjs.org/docs/error-decoder.html?invariant=" + r, u = 1; u < arguments.length; u++) i += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + r + "; visit " + i + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var f = o.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, p = Symbol.for("react.element"), m = Symbol.for("react.portal"), g = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), v = Symbol.for("react.profiler"), x = Symbol.for("react.provider"), k = Symbol.for("react.context"), L = Symbol.for("react.forward_ref"), A = Symbol.for("react.suspense"), w = Symbol.for("react.suspense_list"), S = Symbol.for("react.memo"), _ = Symbol.for("react.lazy"), R = Symbol.for("react.offscreen"), I = Symbol.iterator;
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
      case x:
        return (r._context.displayName || "Context") + ".Provider";
      case L:
        var i = r.render;
        return r = r.displayName, r || (r = i.displayName || i.name || "", r = r !== "" ? "ForwardRef(" + r + ")" : "ForwardRef"), r;
      case S:
        return i = r.displayName || null, i !== null ? i : D(r.type) || "Memo";
      case _:
        i = r._payload, r = r._init;
        try {
          return D(r(i));
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
  function V(r) {
    if (q(r) !== r) throw Error(a(188));
  }
  function Q(r) {
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
          if (h === u) return V(d), r;
          if (h === c) return V(d), i;
          h = h.sibling;
        }
        throw Error(a(188));
      }
      if (u.return !== c.return) u = d, c = h;
      else {
        for (var E = !1, P = d.child; P; ) {
          if (P === u) {
            E = !0, u = d, c = h;
            break;
          }
          if (P === c) {
            E = !0, c = d, u = h;
            break;
          }
          P = P.sibling;
        }
        if (!E) {
          for (P = h.child; P; ) {
            if (P === u) {
              E = !0, u = h, c = d;
              break;
            }
            if (P === c) {
              E = !0, c = h, u = d;
              break;
            }
            P = P.sibling;
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
    return r = Q(r), r !== null ? Se(r) : null;
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
  function Et(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      if (r.tag !== 4) {
        var i = Et(r);
        if (i !== null) return i;
      }
      r = r.sibling;
    }
    return null;
  }
  var Ht = Array.isArray, be = t.getPublicInstance, Tt = t.getRootHostContext, N = t.getChildHostContext, U = t.prepareForCommit, F = t.resetAfterCommit, Y = t.createInstance, te = t.appendInitialChild, ce = t.finalizeInitialChildren, ze = t.prepareUpdate, it = t.shouldSetTextContent, Xe = t.createTextInstance, bt = t.scheduleTimeout, f1 = t.cancelTimeout, ja = t.noTimeout, ul = t.isPrimaryRenderer, yn = t.supportsMutation, al = t.supportsPersistence, Bt = t.supportsHydration, d1 = t.getInstanceFromNode, p1 = t.preparePortalMount, h1 = t.getCurrentEventPriority, m1 = t.detachDeletedInstance, g1 = t.supportsMicrotasks, y1 = t.scheduleMicrotask, Fo = t.supportsTestSelectors, v1 = t.findFiberRoot, S1 = t.getBoundingRect, w1 = t.getTextContent, Uo = t.isHiddenSubtree, x1 = t.matchAccessibilityRole, _1 = t.setFocusIfFocusable, E1 = t.setupIntersectionObserver, T1 = t.appendChild, k1 = t.appendChildToContainer, P1 = t.commitTextUpdate, C1 = t.commitMount, R1 = t.commitUpdate, L1 = t.insertBefore, A1 = t.insertInContainerBefore, M1 = t.removeChild, N1 = t.removeChildFromContainer, jp = t.resetTextContent, j1 = t.hideInstance, z1 = t.hideTextInstance, I1 = t.unhideInstance, O1 = t.unhideTextInstance, D1 = t.clearContainer, F1 = t.cloneInstance, zp = t.createContainerChildSet, Ip = t.appendChildToContainerChildSet, U1 = t.finalizeContainerChildren, Op = t.replaceContainerChildren, Dp = t.cloneHiddenInstance, Fp = t.cloneHiddenTextInstance, H1 = t.canHydrateInstance, B1 = t.canHydrateTextInstance, G1 = t.canHydrateSuspenseInstance, Up = t.isSuspenseInstancePending, za = t.isSuspenseInstanceFallback, W1 = t.registerSuspenseInstanceRetry, Ho = t.getNextHydratableSibling, V1 = t.getFirstHydratableChild, K1 = t.getFirstHydratableChildWithinContainer, Q1 = t.getFirstHydratableChildWithinSuspenseInstance, X1 = t.hydrateInstance, Y1 = t.hydrateTextInstance, Z1 = t.hydrateSuspenseInstance, J1 = t.getNextHydratableInstanceAfterSuspenseInstance, Hp = t.commitHydratedContainer, q1 = t.commitHydratedSuspenseInstance, $1 = t.clearSuspenseBoundary, b1 = t.clearSuspenseBoundaryFromContainer, eS = t.shouldDeleteUnhydratedTailInstances, tS = t.didNotMatchHydratedContainerTextInstance, nS = t.didNotMatchHydratedTextInstance, Ia;
  function Bo(r) {
    if (Ia === void 0) try {
      throw Error();
    } catch (u) {
      var i = u.stack.trim().match(/\n( *(at )?)/);
      Ia = i && i[1] || "";
    }
    return `
` + Ia + r;
  }
  var Oa = !1;
  function Da(r, i) {
    if (!r || Oa) return "";
    Oa = !0;
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
`), E = d.length - 1, P = h.length - 1; 1 <= E && 0 <= P && d[E] !== h[P]; ) P--;
        for (; 1 <= E && 0 <= P; E--, P--) if (d[E] !== h[P]) {
          if (E !== 1 || P !== 1)
            do
              if (E--, P--, 0 > P || d[E] !== h[P]) {
                var z = `
` + d[E].replace(" at new ", " at ");
                return r.displayName && z.includes("<anonymous>") && (z = z.replace("<anonymous>", r.displayName)), z;
              }
            while (1 <= E && 0 <= P);
          break;
        }
      }
    } finally {
      Oa = !1, Error.prepareStackTrace = u;
    }
    return (r = r ? r.displayName || r.name : "") ? Bo(r) : "";
  }
  var rS = Object.prototype.hasOwnProperty, Fa = [], Ii = -1;
  function gr(r) {
    return { current: r };
  }
  function ke(r) {
    0 > Ii || (r.current = Fa[Ii], Fa[Ii] = null, Ii--);
  }
  function we(r, i) {
    Ii++, Fa[Ii] = r.current, r.current = i;
  }
  var yr = {}, ot = gr(yr), kt = gr(!1), qr = yr;
  function Oi(r, i) {
    var u = r.type.contextTypes;
    if (!u) return yr;
    var c = r.stateNode;
    if (c && c.__reactInternalMemoizedUnmaskedChildContext === i) return c.__reactInternalMemoizedMaskedChildContext;
    var d = {}, h;
    for (h in u) d[h] = i[h];
    return c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = i, r.__reactInternalMemoizedMaskedChildContext = d), d;
  }
  function Pt(r) {
    return r = r.childContextTypes, r != null;
  }
  function cl() {
    ke(kt), ke(ot);
  }
  function Bp(r, i, u) {
    if (ot.current !== yr) throw Error(a(168));
    we(ot, i), we(kt, u);
  }
  function Gp(r, i, u) {
    var c = r.stateNode;
    if (i = i.childContextTypes, typeof c.getChildContext != "function") return u;
    c = c.getChildContext();
    for (var d in c) if (!(d in i)) throw Error(a(108, B(r) || "Unknown", d));
    return l({}, u, c);
  }
  function fl(r) {
    return r = (r = r.stateNode) && r.__reactInternalMemoizedMergedChildContext || yr, qr = ot.current, we(ot, r), we(kt, kt.current), !0;
  }
  function Wp(r, i, u) {
    var c = r.stateNode;
    if (!c) throw Error(a(169));
    u ? (r = Gp(r, i, qr), c.__reactInternalMemoizedMergedChildContext = r, ke(kt), ke(ot), we(ot, r)) : ke(kt), we(kt, u);
  }
  var vn = Math.clz32 ? Math.clz32 : sS, iS = Math.log, oS = Math.LN2;
  function sS(r) {
    return r >>>= 0, r === 0 ? 32 : 31 - (iS(r) / oS | 0) | 0;
  }
  var dl = 64, pl = 4194304;
  function Go(r) {
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
  function hl(r, i) {
    var u = r.pendingLanes;
    if (u === 0) return 0;
    var c = 0, d = r.suspendedLanes, h = r.pingedLanes, E = u & 268435455;
    if (E !== 0) {
      var P = E & ~d;
      P !== 0 ? c = Go(P) : (h &= E, h !== 0 && (c = Go(h)));
    } else E = u & ~d, E !== 0 ? c = Go(E) : h !== 0 && (c = Go(h));
    if (c === 0) return 0;
    if (i !== 0 && i !== c && !(i & d) && (d = c & -c, h = i & -i, d >= h || d === 16 && (h & 4194240) !== 0)) return i;
    if (c & 4 && (c |= u & 16), i = r.entangledLanes, i !== 0) for (r = r.entanglements, i &= c; 0 < i; ) u = 31 - vn(i), d = 1 << u, c |= r[u], i &= ~d;
    return c;
  }
  function lS(r, i) {
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
  function uS(r, i) {
    for (var u = r.suspendedLanes, c = r.pingedLanes, d = r.expirationTimes, h = r.pendingLanes; 0 < h; ) {
      var E = 31 - vn(h), P = 1 << E, z = d[E];
      z === -1 ? (!(P & u) || P & c) && (d[E] = lS(P, i)) : z <= i && (r.expiredLanes |= P), h &= ~P;
    }
  }
  function Ua(r) {
    return r = r.pendingLanes & -1073741825, r !== 0 ? r : r & 1073741824 ? 1073741824 : 0;
  }
  function Ha(r) {
    for (var i = [], u = 0; 31 > u; u++) i.push(r);
    return i;
  }
  function Wo(r, i, u) {
    r.pendingLanes |= i, i !== 536870912 && (r.suspendedLanes = 0, r.pingedLanes = 0), r = r.eventTimes, i = 31 - vn(i), r[i] = u;
  }
  function aS(r, i) {
    var u = r.pendingLanes & ~i;
    r.pendingLanes = i, r.suspendedLanes = 0, r.pingedLanes = 0, r.expiredLanes &= i, r.mutableReadLanes &= i, r.entangledLanes &= i, i = r.entanglements;
    var c = r.eventTimes;
    for (r = r.expirationTimes; 0 < u; ) {
      var d = 31 - vn(u), h = 1 << d;
      i[d] = 0, c[d] = -1, r[d] = -1, u &= ~h;
    }
  }
  function Ba(r, i) {
    var u = r.entangledLanes |= i;
    for (r = r.entanglements; u; ) {
      var c = 31 - vn(u), d = 1 << c;
      d & i | r[c] & i && (r[c] |= i), u &= ~d;
    }
  }
  var de = 0;
  function Vp(r) {
    return r &= -r, 1 < r ? 4 < r ? r & 268435455 ? 16 : 536870912 : 4 : 1;
  }
  var Ga = s.unstable_scheduleCallback, Kp = s.unstable_cancelCallback, cS = s.unstable_shouldYield, fS = s.unstable_requestPaint, Ye = s.unstable_now, Wa = s.unstable_ImmediatePriority, dS = s.unstable_UserBlockingPriority, Va = s.unstable_NormalPriority, pS = s.unstable_IdlePriority, ml = null, Nn = null;
  function hS(r) {
    if (Nn && typeof Nn.onCommitFiberRoot == "function") try {
      Nn.onCommitFiberRoot(ml, r, void 0, (r.current.flags & 128) === 128);
    } catch {
    }
  }
  function mS(r, i) {
    return r === i && (r !== 0 || 1 / r === 1 / i) || r !== r && i !== i;
  }
  var jn = typeof Object.is == "function" ? Object.is : mS, $n = null, gl = !1, Ka = !1;
  function Qp(r) {
    $n === null ? $n = [r] : $n.push(r);
  }
  function gS(r) {
    gl = !0, Qp(r);
  }
  function zn() {
    if (!Ka && $n !== null) {
      Ka = !0;
      var r = 0, i = de;
      try {
        var u = $n;
        for (de = 1; r < u.length; r++) {
          var c = u[r];
          do
            c = c(!0);
          while (c !== null);
        }
        $n = null, gl = !1;
      } catch (d) {
        throw $n !== null && ($n = $n.slice(r + 1)), Ga(Wa, zn), d;
      } finally {
        de = i, Ka = !1;
      }
    }
    return null;
  }
  var yS = f.ReactCurrentBatchConfig;
  function yl(r, i) {
    if (jn(r, i)) return !0;
    if (typeof r != "object" || r === null || typeof i != "object" || i === null) return !1;
    var u = Object.keys(r), c = Object.keys(i);
    if (u.length !== c.length) return !1;
    for (c = 0; c < u.length; c++) {
      var d = u[c];
      if (!rS.call(i, d) || !jn(r[d], i[d])) return !1;
    }
    return !0;
  }
  function vS(r) {
    switch (r.tag) {
      case 5:
        return Bo(r.type);
      case 16:
        return Bo("Lazy");
      case 13:
        return Bo("Suspense");
      case 19:
        return Bo("SuspenseList");
      case 0:
      case 2:
      case 15:
        return r = Da(r.type, !1), r;
      case 11:
        return r = Da(r.type.render, !1), r;
      case 1:
        return r = Da(r.type, !0), r;
      default:
        return "";
    }
  }
  function Sn(r, i) {
    if (r && r.defaultProps) {
      i = l({}, i), r = r.defaultProps;
      for (var u in r) i[u] === void 0 && (i[u] = r[u]);
      return i;
    }
    return i;
  }
  var vl = gr(null), Sl = null, Di = null, Qa = null;
  function Xa() {
    Qa = Di = Sl = null;
  }
  function Xp(r, i, u) {
    ul ? (we(vl, i._currentValue), i._currentValue = u) : (we(vl, i._currentValue2), i._currentValue2 = u);
  }
  function Ya(r) {
    var i = vl.current;
    ke(vl), ul ? r._currentValue = i : r._currentValue2 = i;
  }
  function Za(r, i, u) {
    for (; r !== null; ) {
      var c = r.alternate;
      if ((r.childLanes & i) !== i ? (r.childLanes |= i, c !== null && (c.childLanes |= i)) : c !== null && (c.childLanes & i) !== i && (c.childLanes |= i), r === u) break;
      r = r.return;
    }
  }
  function Fi(r, i) {
    Sl = r, Qa = Di = null, r = r.dependencies, r !== null && r.firstContext !== null && (r.lanes & i && (Vt = !0), r.firstContext = null);
  }
  function en(r) {
    var i = ul ? r._currentValue : r._currentValue2;
    if (Qa !== r) if (r = { context: r, memoizedValue: i, next: null }, Di === null) {
      if (Sl === null) throw Error(a(308));
      Di = r, Sl.dependencies = { lanes: 0, firstContext: r };
    } else Di = Di.next = r;
    return i;
  }
  var In = null, vr = !1;
  function Ja(r) {
    r.updateQueue = { baseState: r.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function Yp(r, i) {
    r = r.updateQueue, i.updateQueue === r && (i.updateQueue = { baseState: r.baseState, firstBaseUpdate: r.firstBaseUpdate, lastBaseUpdate: r.lastBaseUpdate, shared: r.shared, effects: r.effects });
  }
  function bn(r, i) {
    return { eventTime: r, lane: i, tag: 0, payload: null, callback: null, next: null };
  }
  function Sr(r, i) {
    var u = r.updateQueue;
    u !== null && (u = u.shared, He !== null && r.mode & 1 && !(oe & 2) ? (r = u.interleaved, r === null ? (i.next = i, In === null ? In = [u] : In.push(u)) : (i.next = r.next, r.next = i), u.interleaved = i) : (r = u.pending, r === null ? i.next = i : (i.next = r.next, r.next = i), u.pending = i));
  }
  function wl(r, i, u) {
    if (i = i.updateQueue, i !== null && (i = i.shared, (u & 4194240) !== 0)) {
      var c = i.lanes;
      c &= r.pendingLanes, u |= c, i.lanes = u, Ba(r, u);
    }
  }
  function Zp(r, i) {
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
  function xl(r, i, u, c) {
    var d = r.updateQueue;
    vr = !1;
    var h = d.firstBaseUpdate, E = d.lastBaseUpdate, P = d.shared.pending;
    if (P !== null) {
      d.shared.pending = null;
      var z = P, G = z.next;
      z.next = null, E === null ? h = G : E.next = G, E = z;
      var J = r.alternate;
      J !== null && (J = J.updateQueue, P = J.lastBaseUpdate, P !== E && (P === null ? J.firstBaseUpdate = G : P.next = G, J.lastBaseUpdate = z));
    }
    if (h !== null) {
      var ne = d.baseState;
      E = 0, J = G = z = null, P = h;
      do {
        var ee = P.lane, ve = P.eventTime;
        if ((c & ee) === ee) {
          J !== null && (J = J.next = {
            eventTime: ve,
            lane: 0,
            tag: P.tag,
            payload: P.payload,
            callback: P.callback,
            next: null
          });
          e: {
            var b = r, at = P;
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
                ne = l({}, ne, ee);
                break e;
              case 2:
                vr = !0;
            }
          }
          P.callback !== null && P.lane !== 0 && (r.flags |= 64, ee = d.effects, ee === null ? d.effects = [P] : ee.push(P));
        } else ve = { eventTime: ve, lane: ee, tag: P.tag, payload: P.payload, callback: P.callback, next: null }, J === null ? (G = J = ve, z = ne) : J = J.next = ve, E |= ee;
        if (P = P.next, P === null) {
          if (P = d.shared.pending, P === null) break;
          ee = P, P = ee.next, ee.next = null, d.lastBaseUpdate = ee, d.shared.pending = null;
        }
      } while (!0);
      if (J === null && (z = ne), d.baseState = z, d.firstBaseUpdate = G, d.lastBaseUpdate = J, i = d.shared.interleaved, i !== null) {
        d = i;
        do
          E |= d.lane, d = d.next;
        while (d !== i);
      } else h === null && (d.shared.lanes = 0);
      Xi |= E, r.lanes = E, r.memoizedState = ne;
    }
  }
  function Jp(r, i, u) {
    if (r = i.effects, i.effects = null, r !== null) for (i = 0; i < r.length; i++) {
      var c = r[i], d = c.callback;
      if (d !== null) {
        if (c.callback = null, c = u, typeof d != "function") throw Error(a(191, d));
        d.call(c);
      }
    }
  }
  var qp = new o.Component().refs;
  function qa(r, i, u, c) {
    i = r.memoizedState, u = u(c, i), u = u == null ? i : l({}, i, u), r.memoizedState = u, r.lanes === 0 && (r.updateQueue.baseState = u);
  }
  var _l = { isMounted: function(r) {
    return (r = r._reactInternals) ? q(r) === r : !1;
  }, enqueueSetState: function(r, i, u) {
    r = r._reactInternals;
    var c = yt(), d = _r(r), h = bn(c, d);
    h.payload = i, u != null && (h.callback = u), Sr(r, h), i = sn(r, d, c), i !== null && wl(i, r, d);
  }, enqueueReplaceState: function(r, i, u) {
    r = r._reactInternals;
    var c = yt(), d = _r(r), h = bn(c, d);
    h.tag = 1, h.payload = i, u != null && (h.callback = u), Sr(r, h), i = sn(r, d, c), i !== null && wl(i, r, d);
  }, enqueueForceUpdate: function(r, i) {
    r = r._reactInternals;
    var u = yt(), c = _r(r), d = bn(
      u,
      c
    );
    d.tag = 2, i != null && (d.callback = i), Sr(r, d), i = sn(r, c, u), i !== null && wl(i, r, c);
  } };
  function $p(r, i, u, c, d, h, E) {
    return r = r.stateNode, typeof r.shouldComponentUpdate == "function" ? r.shouldComponentUpdate(c, h, E) : i.prototype && i.prototype.isPureReactComponent ? !yl(u, c) || !yl(d, h) : !0;
  }
  function bp(r, i, u) {
    var c = !1, d = yr, h = i.contextType;
    return typeof h == "object" && h !== null ? h = en(h) : (d = Pt(i) ? qr : ot.current, c = i.contextTypes, h = (c = c != null) ? Oi(r, d) : yr), i = new i(u, h), r.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null, i.updater = _l, r.stateNode = i, i._reactInternals = r, c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = d, r.__reactInternalMemoizedMaskedChildContext = h), i;
  }
  function eh(r, i, u, c) {
    r = i.state, typeof i.componentWillReceiveProps == "function" && i.componentWillReceiveProps(u, c), typeof i.UNSAFE_componentWillReceiveProps == "function" && i.UNSAFE_componentWillReceiveProps(u, c), i.state !== r && _l.enqueueReplaceState(i, i.state, null);
  }
  function $a(r, i, u, c) {
    var d = r.stateNode;
    d.props = u, d.state = r.memoizedState, d.refs = qp, Ja(r);
    var h = i.contextType;
    typeof h == "object" && h !== null ? d.context = en(h) : (h = Pt(i) ? qr : ot.current, d.context = Oi(r, h)), d.state = r.memoizedState, h = i.getDerivedStateFromProps, typeof h == "function" && (qa(r, i, h, u), d.state = r.memoizedState), typeof i.getDerivedStateFromProps == "function" || typeof d.getSnapshotBeforeUpdate == "function" || typeof d.UNSAFE_componentWillMount != "function" && typeof d.componentWillMount != "function" || (i = d.state, typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), i !== d.state && _l.enqueueReplaceState(d, d.state, null), xl(r, u, d, c), d.state = r.memoizedState), typeof d.componentDidMount == "function" && (r.flags |= 4194308);
  }
  var Ui = [], Hi = 0, El = null, Tl = 0, tn = [], nn = 0, $r = null, er = 1, tr = "";
  function br(r, i) {
    Ui[Hi++] = Tl, Ui[Hi++] = El, El = r, Tl = i;
  }
  function th(r, i, u) {
    tn[nn++] = er, tn[nn++] = tr, tn[nn++] = $r, $r = r;
    var c = er;
    r = tr;
    var d = 32 - vn(c) - 1;
    c &= ~(1 << d), u += 1;
    var h = 32 - vn(i) + d;
    if (30 < h) {
      var E = d - d % 5;
      h = (c & (1 << E) - 1).toString(32), c >>= E, d -= E, er = 1 << 32 - vn(i) + d | u << d | c, tr = h + r;
    } else er = 1 << h | u << d | c, tr = r;
  }
  function ba(r) {
    r.return !== null && (br(r, 1), th(r, 1, 0));
  }
  function ec(r) {
    for (; r === El; ) El = Ui[--Hi], Ui[Hi] = null, Tl = Ui[--Hi], Ui[Hi] = null;
    for (; r === $r; ) $r = tn[--nn], tn[nn] = null, tr = tn[--nn], tn[nn] = null, er = tn[--nn], tn[nn] = null;
  }
  var Gt = null, Wt = null, Re = !1, Vo = !1, wn = null;
  function nh(r, i) {
    var u = ln(5, null, null, 0);
    u.elementType = "DELETED", u.stateNode = i, u.return = r, i = r.deletions, i === null ? (r.deletions = [u], r.flags |= 16) : i.push(u);
  }
  function rh(r, i) {
    switch (r.tag) {
      case 5:
        return i = H1(i, r.type, r.pendingProps), i !== null ? (r.stateNode = i, Gt = r, Wt = V1(i), !0) : !1;
      case 6:
        return i = B1(i, r.pendingProps), i !== null ? (r.stateNode = i, Gt = r, Wt = null, !0) : !1;
      case 13:
        if (i = G1(i), i !== null) {
          var u = $r !== null ? { id: er, overflow: tr } : null;
          return r.memoizedState = { dehydrated: i, treeContext: u, retryLane: 1073741824 }, u = ln(18, null, null, 0), u.stateNode = i, u.return = r, r.child = u, Gt = r, Wt = null, !0;
        }
        return !1;
      default:
        return !1;
    }
  }
  function tc(r) {
    return (r.mode & 1) !== 0 && (r.flags & 128) === 0;
  }
  function nc(r) {
    if (Re) {
      var i = Wt;
      if (i) {
        var u = i;
        if (!rh(r, i)) {
          if (tc(r)) throw Error(a(418));
          i = Ho(u);
          var c = Gt;
          i && rh(r, i) ? nh(c, u) : (r.flags = r.flags & -4097 | 2, Re = !1, Gt = r);
        }
      } else {
        if (tc(r)) throw Error(a(418));
        r.flags = r.flags & -4097 | 2, Re = !1, Gt = r;
      }
    }
  }
  function ih(r) {
    for (r = r.return; r !== null && r.tag !== 5 && r.tag !== 3 && r.tag !== 13; ) r = r.return;
    Gt = r;
  }
  function Ko(r) {
    if (!Bt || r !== Gt) return !1;
    if (!Re) return ih(r), Re = !0, !1;
    if (r.tag !== 3 && (r.tag !== 5 || eS(r.type) && !it(r.type, r.memoizedProps))) {
      var i = Wt;
      if (i) {
        if (tc(r)) {
          for (r = Wt; r; ) r = Ho(r);
          throw Error(a(418));
        }
        for (; i; ) nh(r, i), i = Ho(i);
      }
    }
    if (ih(r), r.tag === 13) {
      if (!Bt) throw Error(a(316));
      if (r = r.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
      Wt = J1(r);
    } else Wt = Gt ? Ho(r.stateNode) : null;
    return !0;
  }
  function Bi() {
    Bt && (Wt = Gt = null, Vo = Re = !1);
  }
  function rc(r) {
    wn === null ? wn = [r] : wn.push(r);
  }
  function Qo(r, i, u) {
    if (r = u.ref, r !== null && typeof r != "function" && typeof r != "object") {
      if (u._owner) {
        if (u = u._owner, u) {
          if (u.tag !== 1) throw Error(a(309));
          var c = u.stateNode;
        }
        if (!c) throw Error(a(147, r));
        var d = c, h = "" + r;
        return i !== null && i.ref !== null && typeof i.ref == "function" && i.ref._stringRef === h ? i.ref : (i = function(E) {
          var P = d.refs;
          P === qp && (P = d.refs = {}), E === null ? delete P[h] : P[h] = E;
        }, i._stringRef = h, i);
      }
      if (typeof r != "string") throw Error(a(284));
      if (!u._owner) throw Error(a(290, r));
    }
    return r;
  }
  function kl(r, i) {
    throw r = Object.prototype.toString.call(i), Error(a(31, r === "[object Object]" ? "object with keys {" + Object.keys(i).join(", ") + "}" : r));
  }
  function oh(r) {
    var i = r._init;
    return i(r._payload);
  }
  function sh(r) {
    function i(M, C) {
      if (r) {
        var j = M.deletions;
        j === null ? (M.deletions = [C], M.flags |= 16) : j.push(C);
      }
    }
    function u(M, C) {
      if (!r) return null;
      for (; C !== null; ) i(M, C), C = C.sibling;
      return null;
    }
    function c(M, C) {
      for (M = /* @__PURE__ */ new Map(); C !== null; ) C.key !== null ? M.set(C.key, C) : M.set(C.index, C), C = C.sibling;
      return M;
    }
    function d(M, C) {
      return M = Tr(M, C), M.index = 0, M.sibling = null, M;
    }
    function h(M, C, j) {
      return M.index = j, r ? (j = M.alternate, j !== null ? (j = j.index, j < C ? (M.flags |= 2, C) : j) : (M.flags |= 2, C)) : (M.flags |= 1048576, C);
    }
    function E(M) {
      return r && M.alternate === null && (M.flags |= 2), M;
    }
    function P(M, C, j, X) {
      return C === null || C.tag !== 6 ? (C = Hc(j, M.mode, X), C.return = M, C) : (C = d(C, j), C.return = M, C);
    }
    function z(M, C, j, X) {
      var $ = j.type;
      return $ === g ? J(M, C, j.props.children, X, j.key) : C !== null && (C.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === _ && oh($) === C.type) ? (X = d(C, j.props), X.ref = Qo(M, C, j), X.return = M, X) : (X = nu(j.type, j.key, j.props, null, M.mode, X), X.ref = Qo(M, C, j), X.return = M, X);
    }
    function G(M, C, j, X) {
      return C === null || C.tag !== 4 || C.stateNode.containerInfo !== j.containerInfo || C.stateNode.implementation !== j.implementation ? (C = Bc(j, M.mode, X), C.return = M, C) : (C = d(C, j.children || []), C.return = M, C);
    }
    function J(M, C, j, X, $) {
      return C === null || C.tag !== 7 ? (C = si(j, M.mode, X, $), C.return = M, C) : (C = d(C, j), C.return = M, C);
    }
    function ne(M, C, j) {
      if (typeof C == "string" && C !== "" || typeof C == "number") return C = Hc("" + C, M.mode, j), C.return = M, C;
      if (typeof C == "object" && C !== null) {
        switch (C.$$typeof) {
          case p:
            return j = nu(C.type, C.key, C.props, null, M.mode, j), j.ref = Qo(M, null, C), j.return = M, j;
          case m:
            return C = Bc(C, M.mode, j), C.return = M, C;
          case _:
            var X = C._init;
            return ne(M, X(C._payload), j);
        }
        if (Ht(C) || O(C)) return C = si(C, M.mode, j, null), C.return = M, C;
        kl(M, C);
      }
      return null;
    }
    function ee(M, C, j, X) {
      var $ = C !== null ? C.key : null;
      if (typeof j == "string" && j !== "" || typeof j == "number") return $ !== null ? null : P(M, C, "" + j, X);
      if (typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case p:
            return j.key === $ ? z(M, C, j, X) : null;
          case m:
            return j.key === $ ? G(M, C, j, X) : null;
          case _:
            return $ = j._init, ee(
              M,
              C,
              $(j._payload),
              X
            );
        }
        if (Ht(j) || O(j)) return $ !== null ? null : J(M, C, j, X, null);
        kl(M, j);
      }
      return null;
    }
    function ve(M, C, j, X, $) {
      if (typeof X == "string" && X !== "" || typeof X == "number") return M = M.get(j) || null, P(C, M, "" + X, $);
      if (typeof X == "object" && X !== null) {
        switch (X.$$typeof) {
          case p:
            return M = M.get(X.key === null ? j : X.key) || null, z(C, M, X, $);
          case m:
            return M = M.get(X.key === null ? j : X.key) || null, G(C, M, X, $);
          case _:
            var ie = X._init;
            return ve(M, C, j, ie(X._payload), $);
        }
        if (Ht(X) || O(X)) return M = M.get(j) || null, J(C, M, X, $, null);
        kl(C, X);
      }
      return null;
    }
    function b(M, C, j, X) {
      for (var $ = null, ie = null, re = C, pe = C = 0, Je = null; re !== null && pe < j.length; pe++) {
        re.index > pe ? (Je = re, re = null) : Je = re.sibling;
        var he = ee(M, re, j[pe], X);
        if (he === null) {
          re === null && (re = Je);
          break;
        }
        r && re && he.alternate === null && i(M, re), C = h(he, C, pe), ie === null ? $ = he : ie.sibling = he, ie = he, re = Je;
      }
      if (pe === j.length) return u(M, re), Re && br(M, pe), $;
      if (re === null) {
        for (; pe < j.length; pe++) re = ne(M, j[pe], X), re !== null && (C = h(re, C, pe), ie === null ? $ = re : ie.sibling = re, ie = re);
        return Re && br(M, pe), $;
      }
      for (re = c(M, re); pe < j.length; pe++) Je = ve(re, M, pe, j[pe], X), Je !== null && (r && Je.alternate !== null && re.delete(Je.key === null ? pe : Je.key), C = h(Je, C, pe), ie === null ? $ = Je : ie.sibling = Je, ie = Je);
      return r && re.forEach(function(kr) {
        return i(M, kr);
      }), Re && br(M, pe), $;
    }
    function at(M, C, j, X) {
      var $ = O(j);
      if (typeof $ != "function") throw Error(a(150));
      if (j = $.call(j), j == null) throw Error(a(151));
      for (var ie = $ = null, re = C, pe = C = 0, Je = null, he = j.next(); re !== null && !he.done; pe++, he = j.next()) {
        re.index > pe ? (Je = re, re = null) : Je = re.sibling;
        var kr = ee(M, re, he.value, X);
        if (kr === null) {
          re === null && (re = Je);
          break;
        }
        r && re && kr.alternate === null && i(M, re), C = h(kr, C, pe), ie === null ? $ = kr : ie.sibling = kr, ie = kr, re = Je;
      }
      if (he.done) return u(
        M,
        re
      ), Re && br(M, pe), $;
      if (re === null) {
        for (; !he.done; pe++, he = j.next()) he = ne(M, he.value, X), he !== null && (C = h(he, C, pe), ie === null ? $ = he : ie.sibling = he, ie = he);
        return Re && br(M, pe), $;
      }
      for (re = c(M, re); !he.done; pe++, he = j.next()) he = ve(re, M, pe, he.value, X), he !== null && (r && he.alternate !== null && re.delete(he.key === null ? pe : he.key), C = h(he, C, pe), ie === null ? $ = he : ie.sibling = he, ie = he);
      return r && re.forEach(function(YS) {
        return i(M, YS);
      }), Re && br(M, pe), $;
    }
    function un(M, C, j, X) {
      if (typeof j == "object" && j !== null && j.type === g && j.key === null && (j = j.props.children), typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case p:
            e: {
              for (var $ = j.key, ie = C; ie !== null; ) {
                if (ie.key === $) {
                  if ($ = j.type, $ === g) {
                    if (ie.tag === 7) {
                      u(M, ie.sibling), C = d(ie, j.props.children), C.return = M, M = C;
                      break e;
                    }
                  } else if (ie.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === _ && oh($) === ie.type) {
                    u(M, ie.sibling), C = d(ie, j.props), C.ref = Qo(M, ie, j), C.return = M, M = C;
                    break e;
                  }
                  u(M, ie);
                  break;
                } else i(M, ie);
                ie = ie.sibling;
              }
              j.type === g ? (C = si(j.props.children, M.mode, X, j.key), C.return = M, M = C) : (X = nu(j.type, j.key, j.props, null, M.mode, X), X.ref = Qo(M, C, j), X.return = M, M = X);
            }
            return E(M);
          case m:
            e: {
              for (ie = j.key; C !== null; ) {
                if (C.key === ie) if (C.tag === 4 && C.stateNode.containerInfo === j.containerInfo && C.stateNode.implementation === j.implementation) {
                  u(M, C.sibling), C = d(C, j.children || []), C.return = M, M = C;
                  break e;
                } else {
                  u(M, C);
                  break;
                }
                else i(M, C);
                C = C.sibling;
              }
              C = Bc(j, M.mode, X), C.return = M, M = C;
            }
            return E(M);
          case _:
            return ie = j._init, un(M, C, ie(j._payload), X);
        }
        if (Ht(j)) return b(M, C, j, X);
        if (O(j)) return at(M, C, j, X);
        kl(M, j);
      }
      return typeof j == "string" && j !== "" || typeof j == "number" ? (j = "" + j, C !== null && C.tag === 6 ? (u(M, C.sibling), C = d(C, j), C.return = M, M = C) : (u(M, C), C = Hc(j, M.mode, X), C.return = M, M = C), E(M)) : u(M, C);
    }
    return un;
  }
  var Gi = sh(!0), lh = sh(!1), Xo = {}, rn = gr(Xo), Yo = gr(Xo), Wi = gr(Xo);
  function On(r) {
    if (r === Xo) throw Error(a(174));
    return r;
  }
  function ic(r, i) {
    we(Wi, i), we(Yo, r), we(rn, Xo), r = Tt(i), ke(rn), we(rn, r);
  }
  function Vi() {
    ke(rn), ke(Yo), ke(Wi);
  }
  function uh(r) {
    var i = On(Wi.current), u = On(rn.current);
    i = N(u, r.type, i), u !== i && (we(Yo, r), we(rn, i));
  }
  function oc(r) {
    Yo.current === r && (ke(rn), ke(Yo));
  }
  var Ae = gr(0);
  function Pl(r) {
    for (var i = r; i !== null; ) {
      if (i.tag === 13) {
        var u = i.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || Up(u) || za(u))) return i;
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
  var sc = [];
  function lc() {
    for (var r = 0; r < sc.length; r++) {
      var i = sc[r];
      ul ? i._workInProgressVersionPrimary = null : i._workInProgressVersionSecondary = null;
    }
    sc.length = 0;
  }
  var Cl = f.ReactCurrentDispatcher, on = f.ReactCurrentBatchConfig, Ki = 0, Ie = null, st = null, Ze = null, Rl = !1, Zo = !1, Jo = 0, SS = 0;
  function lt() {
    throw Error(a(321));
  }
  function uc(r, i) {
    if (i === null) return !1;
    for (var u = 0; u < i.length && u < r.length; u++) if (!jn(r[u], i[u])) return !1;
    return !0;
  }
  function ac(r, i, u, c, d, h) {
    if (Ki = h, Ie = i, i.memoizedState = null, i.updateQueue = null, i.lanes = 0, Cl.current = r === null || r.memoizedState === null ? ES : TS, r = u(c, d), Zo) {
      h = 0;
      do {
        if (Zo = !1, Jo = 0, 25 <= h) throw Error(a(301));
        h += 1, Ze = st = null, i.updateQueue = null, Cl.current = kS, r = u(c, d);
      } while (Zo);
    }
    if (Cl.current = jl, i = st !== null && st.next !== null, Ki = 0, Ze = st = Ie = null, Rl = !1, i) throw Error(a(300));
    return r;
  }
  function cc() {
    var r = Jo !== 0;
    return Jo = 0, r;
  }
  function nr() {
    var r = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Ze === null ? Ie.memoizedState = Ze = r : Ze = Ze.next = r, Ze;
  }
  function Dn() {
    if (st === null) {
      var r = Ie.alternate;
      r = r !== null ? r.memoizedState : null;
    } else r = st.next;
    var i = Ze === null ? Ie.memoizedState : Ze.next;
    if (i !== null) Ze = i, st = r;
    else {
      if (r === null) throw Error(a(310));
      st = r, r = { memoizedState: st.memoizedState, baseState: st.baseState, baseQueue: st.baseQueue, queue: st.queue, next: null }, Ze === null ? Ie.memoizedState = Ze = r : Ze = Ze.next = r;
    }
    return Ze;
  }
  function ei(r, i) {
    return typeof i == "function" ? i(r) : i;
  }
  function Ll(r) {
    var i = Dn(), u = i.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = st, d = c.baseQueue, h = u.pending;
    if (h !== null) {
      if (d !== null) {
        var E = d.next;
        d.next = h.next, h.next = E;
      }
      c.baseQueue = d = h, u.pending = null;
    }
    if (d !== null) {
      h = d.next, c = c.baseState;
      var P = E = null, z = null, G = h;
      do {
        var J = G.lane;
        if ((Ki & J) === J) z !== null && (z = z.next = { lane: 0, action: G.action, hasEagerState: G.hasEagerState, eagerState: G.eagerState, next: null }), c = G.hasEagerState ? G.eagerState : r(c, G.action);
        else {
          var ne = {
            lane: J,
            action: G.action,
            hasEagerState: G.hasEagerState,
            eagerState: G.eagerState,
            next: null
          };
          z === null ? (P = z = ne, E = c) : z = z.next = ne, Ie.lanes |= J, Xi |= J;
        }
        G = G.next;
      } while (G !== null && G !== h);
      z === null ? E = c : z.next = P, jn(c, i.memoizedState) || (Vt = !0), i.memoizedState = c, i.baseState = E, i.baseQueue = z, u.lastRenderedState = c;
    }
    if (r = u.interleaved, r !== null) {
      d = r;
      do
        h = d.lane, Ie.lanes |= h, Xi |= h, d = d.next;
      while (d !== r);
    } else d === null && (u.lanes = 0);
    return [i.memoizedState, u.dispatch];
  }
  function Al(r) {
    var i = Dn(), u = i.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = u.dispatch, d = u.pending, h = i.memoizedState;
    if (d !== null) {
      u.pending = null;
      var E = d = d.next;
      do
        h = r(h, E.action), E = E.next;
      while (E !== d);
      jn(h, i.memoizedState) || (Vt = !0), i.memoizedState = h, i.baseQueue === null && (i.baseState = h), u.lastRenderedState = h;
    }
    return [h, c];
  }
  function ah() {
  }
  function ch(r, i) {
    var u = Ie, c = Dn(), d = i(), h = !jn(c.memoizedState, d);
    if (h && (c.memoizedState = d, Vt = !0), c = c.queue, $o(ph.bind(null, u, c, r), [r]), c.getSnapshot !== i || h || Ze !== null && Ze.memoizedState.tag & 1) {
      if (u.flags |= 2048, qo(9, dh.bind(null, u, c, d, i), void 0, null), He === null) throw Error(a(349));
      Ki & 30 || fh(u, i, d);
    }
    return d;
  }
  function fh(r, i, u) {
    r.flags |= 16384, r = { getSnapshot: i, value: u }, i = Ie.updateQueue, i === null ? (i = { lastEffect: null, stores: null }, Ie.updateQueue = i, i.stores = [r]) : (u = i.stores, u === null ? i.stores = [r] : u.push(r));
  }
  function dh(r, i, u, c) {
    i.value = u, i.getSnapshot = c, hh(i) && sn(r, 1, -1);
  }
  function ph(r, i, u) {
    return u(function() {
      hh(i) && sn(r, 1, -1);
    });
  }
  function hh(r) {
    var i = r.getSnapshot;
    r = r.value;
    try {
      var u = i();
      return !jn(r, u);
    } catch {
      return !0;
    }
  }
  function fc(r) {
    var i = nr();
    return typeof r == "function" && (r = r()), i.memoizedState = i.baseState = r, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: ei, lastRenderedState: r }, i.queue = r, r = r.dispatch = _S.bind(null, Ie, r), [i.memoizedState, r];
  }
  function qo(r, i, u, c) {
    return r = { tag: r, create: i, destroy: u, deps: c, next: null }, i = Ie.updateQueue, i === null ? (i = { lastEffect: null, stores: null }, Ie.updateQueue = i, i.lastEffect = r.next = r) : (u = i.lastEffect, u === null ? i.lastEffect = r.next = r : (c = u.next, u.next = r, r.next = c, i.lastEffect = r)), r;
  }
  function mh() {
    return Dn().memoizedState;
  }
  function Ml(r, i, u, c) {
    var d = nr();
    Ie.flags |= r, d.memoizedState = qo(1 | i, u, void 0, c === void 0 ? null : c);
  }
  function Nl(r, i, u, c) {
    var d = Dn();
    c = c === void 0 ? null : c;
    var h = void 0;
    if (st !== null) {
      var E = st.memoizedState;
      if (h = E.destroy, c !== null && uc(c, E.deps)) {
        d.memoizedState = qo(i, u, h, c);
        return;
      }
    }
    Ie.flags |= r, d.memoizedState = qo(1 | i, u, h, c);
  }
  function dc(r, i) {
    return Ml(8390656, 8, r, i);
  }
  function $o(r, i) {
    return Nl(2048, 8, r, i);
  }
  function gh(r, i) {
    return Nl(4, 2, r, i);
  }
  function yh(r, i) {
    return Nl(4, 4, r, i);
  }
  function vh(r, i) {
    if (typeof i == "function") return r = r(), i(r), function() {
      i(null);
    };
    if (i != null) return r = r(), i.current = r, function() {
      i.current = null;
    };
  }
  function Sh(r, i, u) {
    return u = u != null ? u.concat([r]) : null, Nl(4, 4, vh.bind(null, i, r), u);
  }
  function pc() {
  }
  function wh(r, i) {
    var u = Dn();
    i = i === void 0 ? null : i;
    var c = u.memoizedState;
    return c !== null && i !== null && uc(i, c[1]) ? c[0] : (u.memoizedState = [r, i], r);
  }
  function xh(r, i) {
    var u = Dn();
    i = i === void 0 ? null : i;
    var c = u.memoizedState;
    return c !== null && i !== null && uc(i, c[1]) ? c[0] : (r = r(), u.memoizedState = [r, i], r);
  }
  function wS(r, i) {
    var u = de;
    de = u !== 0 && 4 > u ? u : 4, r(!0);
    var c = on.transition;
    on.transition = {};
    try {
      r(!1), i();
    } finally {
      de = u, on.transition = c;
    }
  }
  function _h() {
    return Dn().memoizedState;
  }
  function xS(r, i, u) {
    var c = _r(r);
    u = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null }, Eh(r) ? Th(i, u) : (kh(r, i, u), u = yt(), r = sn(r, c, u), r !== null && Ph(r, i, c));
  }
  function _S(r, i, u) {
    var c = _r(r), d = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null };
    if (Eh(r)) Th(i, d);
    else {
      kh(r, i, d);
      var h = r.alternate;
      if (r.lanes === 0 && (h === null || h.lanes === 0) && (h = i.lastRenderedReducer, h !== null)) try {
        var E = i.lastRenderedState, P = h(E, u);
        if (d.hasEagerState = !0, d.eagerState = P, jn(P, E)) return;
      } catch {
      } finally {
      }
      u = yt(), r = sn(r, c, u), r !== null && Ph(r, i, c);
    }
  }
  function Eh(r) {
    var i = r.alternate;
    return r === Ie || i !== null && i === Ie;
  }
  function Th(r, i) {
    Zo = Rl = !0;
    var u = r.pending;
    u === null ? i.next = i : (i.next = u.next, u.next = i), r.pending = i;
  }
  function kh(r, i, u) {
    He !== null && r.mode & 1 && !(oe & 2) ? (r = i.interleaved, r === null ? (u.next = u, In === null ? In = [i] : In.push(i)) : (u.next = r.next, r.next = u), i.interleaved = u) : (r = i.pending, r === null ? u.next = u : (u.next = r.next, r.next = u), i.pending = u);
  }
  function Ph(r, i, u) {
    if (u & 4194240) {
      var c = i.lanes;
      c &= r.pendingLanes, u |= c, i.lanes = u, Ba(r, u);
    }
  }
  var jl = { readContext: en, useCallback: lt, useContext: lt, useEffect: lt, useImperativeHandle: lt, useInsertionEffect: lt, useLayoutEffect: lt, useMemo: lt, useReducer: lt, useRef: lt, useState: lt, useDebugValue: lt, useDeferredValue: lt, useTransition: lt, useMutableSource: lt, useSyncExternalStore: lt, useId: lt, unstable_isNewReconciler: !1 }, ES = { readContext: en, useCallback: function(r, i) {
    return nr().memoizedState = [r, i === void 0 ? null : i], r;
  }, useContext: en, useEffect: dc, useImperativeHandle: function(r, i, u) {
    return u = u != null ? u.concat([r]) : null, Ml(
      4194308,
      4,
      vh.bind(null, i, r),
      u
    );
  }, useLayoutEffect: function(r, i) {
    return Ml(4194308, 4, r, i);
  }, useInsertionEffect: function(r, i) {
    return Ml(4, 2, r, i);
  }, useMemo: function(r, i) {
    var u = nr();
    return i = i === void 0 ? null : i, r = r(), u.memoizedState = [r, i], r;
  }, useReducer: function(r, i, u) {
    var c = nr();
    return i = u !== void 0 ? u(i) : i, c.memoizedState = c.baseState = i, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: r, lastRenderedState: i }, c.queue = r, r = r.dispatch = xS.bind(null, Ie, r), [c.memoizedState, r];
  }, useRef: function(r) {
    var i = nr();
    return r = { current: r }, i.memoizedState = r;
  }, useState: fc, useDebugValue: pc, useDeferredValue: function(r) {
    var i = fc(r), u = i[0], c = i[1];
    return dc(function() {
      var d = on.transition;
      on.transition = {};
      try {
        c(r);
      } finally {
        on.transition = d;
      }
    }, [r]), u;
  }, useTransition: function() {
    var r = fc(!1), i = r[0];
    return r = wS.bind(null, r[1]), nr().memoizedState = r, [i, r];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(r, i, u) {
    var c = Ie, d = nr();
    if (Re) {
      if (u === void 0) throw Error(a(407));
      u = u();
    } else {
      if (u = i(), He === null) throw Error(a(349));
      Ki & 30 || fh(c, i, u);
    }
    d.memoizedState = u;
    var h = { value: u, getSnapshot: i };
    return d.queue = h, dc(ph.bind(null, c, h, r), [r]), c.flags |= 2048, qo(9, dh.bind(null, c, h, u, i), void 0, null), u;
  }, useId: function() {
    var r = nr(), i = He.identifierPrefix;
    if (Re) {
      var u = tr, c = er;
      u = (c & ~(1 << 32 - vn(c) - 1)).toString(32) + u, i = ":" + i + "R" + u, u = Jo++, 0 < u && (i += "H" + u.toString(32)), i += ":";
    } else u = SS++, i = ":" + i + "r" + u.toString(32) + ":";
    return r.memoizedState = i;
  }, unstable_isNewReconciler: !1 }, TS = {
    readContext: en,
    useCallback: wh,
    useContext: en,
    useEffect: $o,
    useImperativeHandle: Sh,
    useInsertionEffect: gh,
    useLayoutEffect: yh,
    useMemo: xh,
    useReducer: Ll,
    useRef: mh,
    useState: function() {
      return Ll(ei);
    },
    useDebugValue: pc,
    useDeferredValue: function(r) {
      var i = Ll(ei), u = i[0], c = i[1];
      return $o(function() {
        var d = on.transition;
        on.transition = {};
        try {
          c(r);
        } finally {
          on.transition = d;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = Ll(ei)[0], i = Dn().memoizedState;
      return [r, i];
    },
    useMutableSource: ah,
    useSyncExternalStore: ch,
    useId: _h,
    unstable_isNewReconciler: !1
  }, kS = {
    readContext: en,
    useCallback: wh,
    useContext: en,
    useEffect: $o,
    useImperativeHandle: Sh,
    useInsertionEffect: gh,
    useLayoutEffect: yh,
    useMemo: xh,
    useReducer: Al,
    useRef: mh,
    useState: function() {
      return Al(ei);
    },
    useDebugValue: pc,
    useDeferredValue: function(r) {
      var i = Al(ei), u = i[0], c = i[1];
      return $o(function() {
        var d = on.transition;
        on.transition = {};
        try {
          c(r);
        } finally {
          on.transition = d;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = Al(ei)[0], i = Dn().memoizedState;
      return [r, i];
    },
    useMutableSource: ah,
    useSyncExternalStore: ch,
    useId: _h,
    unstable_isNewReconciler: !1
  };
  function hc(r, i) {
    try {
      var u = "", c = i;
      do
        u += vS(c), c = c.return;
      while (c);
      var d = u;
    } catch (h) {
      d = `
Error generating stack: ` + h.message + `
` + h.stack;
    }
    return { value: r, source: i, stack: d };
  }
  function mc(r, i) {
    try {
      console.error(i.value);
    } catch (u) {
      setTimeout(function() {
        throw u;
      });
    }
  }
  var PS = typeof WeakMap == "function" ? WeakMap : Map;
  function Ch(r, i, u) {
    u = bn(-1, u), u.tag = 3, u.payload = { element: null };
    var c = i.value;
    return u.callback = function() {
      Zl || (Zl = !0, jc = c), mc(r, i);
    }, u;
  }
  function Rh(r, i, u) {
    u = bn(-1, u), u.tag = 3;
    var c = r.type.getDerivedStateFromError;
    if (typeof c == "function") {
      var d = i.value;
      u.payload = function() {
        return c(d);
      }, u.callback = function() {
        mc(r, i);
      };
    }
    var h = r.stateNode;
    return h !== null && typeof h.componentDidCatch == "function" && (u.callback = function() {
      mc(r, i), typeof c != "function" && (wr === null ? wr = /* @__PURE__ */ new Set([this]) : wr.add(this));
      var E = i.stack;
      this.componentDidCatch(i.value, { componentStack: E !== null ? E : "" });
    }), u;
  }
  function Lh(r, i, u) {
    var c = r.pingCache;
    if (c === null) {
      c = r.pingCache = new PS();
      var d = /* @__PURE__ */ new Set();
      c.set(i, d);
    } else d = c.get(i), d === void 0 && (d = /* @__PURE__ */ new Set(), c.set(i, d));
    d.has(u) || (d.add(u), r = HS.bind(null, r, i, u), i.then(r, r));
  }
  function Ah(r) {
    do {
      var i;
      if ((i = r.tag === 13) && (i = r.memoizedState, i = i !== null ? i.dehydrated !== null : !0), i) return r;
      r = r.return;
    } while (r !== null);
    return null;
  }
  function Mh(r, i, u, c, d) {
    return r.mode & 1 ? (r.flags |= 65536, r.lanes = d, r) : (r === i ? r.flags |= 65536 : (r.flags |= 128, u.flags |= 131072, u.flags &= -52805, u.tag === 1 && (u.alternate === null ? u.tag = 17 : (i = bn(-1, 1), i.tag = 2, Sr(u, i))), u.lanes |= 1), r);
  }
  function Fn(r) {
    r.flags |= 4;
  }
  function Nh(r, i) {
    if (r !== null && r.child === i.child) return !0;
    if (i.flags & 16) return !1;
    for (r = i.child; r !== null; ) {
      if (r.flags & 12854 || r.subtreeFlags & 12854) return !1;
      r = r.sibling;
    }
    return !0;
  }
  var bo, es, zl, Il;
  if (yn) bo = function(r, i) {
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
  }, es = function() {
  }, zl = function(r, i, u, c, d) {
    if (r = r.memoizedProps, r !== c) {
      var h = i.stateNode, E = On(rn.current);
      u = ze(h, u, r, c, d, E), (i.updateQueue = u) && Fn(i);
    }
  }, Il = function(r, i, u, c) {
    u !== c && Fn(i);
  };
  else if (al) {
    bo = function(r, i, u, c) {
      for (var d = i.child; d !== null; ) {
        if (d.tag === 5) {
          var h = d.stateNode;
          u && c && (h = Dp(h, d.type, d.memoizedProps, d)), te(r, h);
        } else if (d.tag === 6) h = d.stateNode, u && c && (h = Fp(h, d.memoizedProps, d)), te(r, h);
        else if (d.tag !== 4) {
          if (d.tag === 22 && d.memoizedState !== null) h = d.child, h !== null && (h.return = d), bo(r, d, !0, !0);
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
    var jh = function(r, i, u, c) {
      for (var d = i.child; d !== null; ) {
        if (d.tag === 5) {
          var h = d.stateNode;
          u && c && (h = Dp(h, d.type, d.memoizedProps, d)), Ip(r, h);
        } else if (d.tag === 6) h = d.stateNode, u && c && (h = Fp(h, d.memoizedProps, d)), Ip(r, h);
        else if (d.tag !== 4) {
          if (d.tag === 22 && d.memoizedState !== null) h = d.child, h !== null && (h.return = d), jh(r, d, !0, !0);
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
    es = function(r, i) {
      var u = i.stateNode;
      if (!Nh(r, i)) {
        r = u.containerInfo;
        var c = zp(r);
        jh(c, i, !1, !1), u.pendingChildren = c, Fn(i), U1(r, c);
      }
    }, zl = function(r, i, u, c, d) {
      var h = r.stateNode, E = r.memoizedProps;
      if ((r = Nh(r, i)) && E === c) i.stateNode = h;
      else {
        var P = i.stateNode, z = On(rn.current), G = null;
        E !== c && (G = ze(P, u, E, c, d, z)), r && G === null ? i.stateNode = h : (h = F1(h, G, u, E, c, i, r, P), ce(h, u, c, d, z) && Fn(i), i.stateNode = h, r ? Fn(i) : bo(h, i, !1, !1));
      }
    }, Il = function(r, i, u, c) {
      u !== c ? (r = On(Wi.current), u = On(rn.current), i.stateNode = Xe(c, r, u, i), Fn(i)) : i.stateNode = r.stateNode;
    };
  } else es = function() {
  }, zl = function() {
  }, Il = function() {
  };
  function ts(r, i) {
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
  function CS(r, i, u) {
    var c = i.pendingProps;
    switch (ec(i), i.tag) {
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
        return Pt(i.type) && cl(), ut(i), null;
      case 3:
        return c = i.stateNode, Vi(), ke(kt), ke(ot), lc(), c.pendingContext && (c.context = c.pendingContext, c.pendingContext = null), (r === null || r.child === null) && (Ko(i) ? Fn(i) : r === null || r.memoizedState.isDehydrated && !(i.flags & 256) || (i.flags |= 1024, wn !== null && (Oc(wn), wn = null))), es(r, i), ut(i), null;
      case 5:
        oc(i), u = On(Wi.current);
        var d = i.type;
        if (r !== null && i.stateNode != null) zl(r, i, d, c, u), r.ref !== i.ref && (i.flags |= 512, i.flags |= 2097152);
        else {
          if (!c) {
            if (i.stateNode === null) throw Error(a(166));
            return ut(i), null;
          }
          if (r = On(rn.current), Ko(i)) {
            if (!Bt) throw Error(a(175));
            r = X1(i.stateNode, i.type, i.memoizedProps, u, r, i, !Vo), i.updateQueue = r, r !== null && Fn(i);
          } else {
            var h = Y(d, c, u, r, i);
            bo(h, i, !1, !1), i.stateNode = h, ce(h, d, c, u, r) && Fn(i);
          }
          i.ref !== null && (i.flags |= 512, i.flags |= 2097152);
        }
        return ut(i), null;
      case 6:
        if (r && i.stateNode != null) Il(r, i, r.memoizedProps, c);
        else {
          if (typeof c != "string" && i.stateNode === null) throw Error(a(166));
          if (r = On(Wi.current), u = On(rn.current), Ko(i)) {
            if (!Bt) throw Error(a(176));
            if (r = i.stateNode, c = i.memoizedProps, (u = Y1(r, c, i, !Vo)) && (d = Gt, d !== null)) switch (h = (d.mode & 1) !== 0, d.tag) {
              case 3:
                tS(d.stateNode.containerInfo, r, c, h);
                break;
              case 5:
                nS(d.type, d.memoizedProps, d.stateNode, r, c, h);
            }
            u && Fn(i);
          } else i.stateNode = Xe(c, r, u, i);
        }
        return ut(i), null;
      case 13:
        if (ke(Ae), c = i.memoizedState, Re && Wt !== null && i.mode & 1 && !(i.flags & 128)) {
          for (r = Wt; r; ) r = Ho(r);
          return Bi(), i.flags |= 98560, i;
        }
        if (c !== null && c.dehydrated !== null) {
          if (c = Ko(i), r === null) {
            if (!c) throw Error(a(318));
            if (!Bt) throw Error(a(344));
            if (r = i.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
            Z1(r, i);
          } else Bi(), !(i.flags & 128) && (i.memoizedState = null), i.flags |= 4;
          return ut(i), null;
        }
        return wn !== null && (Oc(wn), wn = null), i.flags & 128 ? (i.lanes = u, i) : (c = c !== null, u = !1, r === null ? Ko(i) : u = r.memoizedState !== null, c && !u && (i.child.flags |= 8192, i.mode & 1 && (r === null || Ae.current & 1 ? We === 0 && (We = 3) : Fc())), i.updateQueue !== null && (i.flags |= 4), ut(i), null);
      case 4:
        return Vi(), es(r, i), r === null && p1(i.stateNode.containerInfo), ut(i), null;
      case 10:
        return Ya(i.type._context), ut(i), null;
      case 17:
        return Pt(i.type) && cl(), ut(i), null;
      case 19:
        if (ke(Ae), d = i.memoizedState, d === null) return ut(i), null;
        if (c = (i.flags & 128) !== 0, h = d.rendering, h === null) if (c) ts(d, !1);
        else {
          if (We !== 0 || r !== null && r.flags & 128) for (r = i.child; r !== null; ) {
            if (h = Pl(r), h !== null) {
              for (i.flags |= 128, ts(d, !1), r = h.updateQueue, r !== null && (i.updateQueue = r, i.flags |= 4), i.subtreeFlags = 0, r = u, c = i.child; c !== null; ) u = c, d = r, u.flags &= 14680066, h = u.alternate, h === null ? (u.childLanes = 0, u.lanes = d, u.child = null, u.subtreeFlags = 0, u.memoizedProps = null, u.memoizedState = null, u.updateQueue = null, u.dependencies = null, u.stateNode = null) : (u.childLanes = h.childLanes, u.lanes = h.lanes, u.child = h.child, u.subtreeFlags = 0, u.deletions = null, u.memoizedProps = h.memoizedProps, u.memoizedState = h.memoizedState, u.updateQueue = h.updateQueue, u.type = h.type, d = h.dependencies, u.dependencies = d === null ? null : { lanes: d.lanes, firstContext: d.firstContext }), c = c.sibling;
              return we(Ae, Ae.current & 1 | 2), i.child;
            }
            r = r.sibling;
          }
          d.tail !== null && Ye() > Nc && (i.flags |= 128, c = !0, ts(d, !1), i.lanes = 4194304);
        }
        else {
          if (!c) if (r = Pl(h), r !== null) {
            if (i.flags |= 128, c = !0, r = r.updateQueue, r !== null && (i.updateQueue = r, i.flags |= 4), ts(d, !0), d.tail === null && d.tailMode === "hidden" && !h.alternate && !Re) return ut(i), null;
          } else 2 * Ye() - d.renderingStartTime > Nc && u !== 1073741824 && (i.flags |= 128, c = !0, ts(d, !1), i.lanes = 4194304);
          d.isBackwards ? (h.sibling = i.child, i.child = h) : (r = d.last, r !== null ? r.sibling = h : i.child = h, d.last = h);
        }
        return d.tail !== null ? (i = d.tail, d.rendering = i, d.tail = i.sibling, d.renderingStartTime = Ye(), i.sibling = null, r = Ae.current, we(Ae, c ? r & 1 | 2 : r & 1), i) : (ut(i), null);
      case 22:
      case 23:
        return Dc(), c = i.memoizedState !== null, r !== null && r.memoizedState !== null !== c && (i.flags |= 8192), c && i.mode & 1 ? Kt & 1073741824 && (ut(i), yn && i.subtreeFlags & 6 && (i.flags |= 8192)) : ut(i), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(a(156, i.tag));
  }
  var RS = f.ReactCurrentOwner, Vt = !1;
  function gt(r, i, u, c) {
    i.child = r === null ? lh(i, null, u, c) : Gi(i, r.child, u, c);
  }
  function zh(r, i, u, c, d) {
    u = u.render;
    var h = i.ref;
    return Fi(i, d), c = ac(r, i, u, c, h, d), u = cc(), r !== null && !Vt ? (i.updateQueue = r.updateQueue, i.flags &= -2053, r.lanes &= ~d, rr(r, i, d)) : (Re && u && ba(i), i.flags |= 1, gt(r, i, c, d), i.child);
  }
  function Ih(r, i, u, c, d) {
    if (r === null) {
      var h = u.type;
      return typeof h == "function" && !Uc(h) && h.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (i.tag = 15, i.type = h, Oh(r, i, h, c, d)) : (r = nu(u.type, null, c, i, i.mode, d), r.ref = i.ref, r.return = i, i.child = r);
    }
    if (h = r.child, !(r.lanes & d)) {
      var E = h.memoizedProps;
      if (u = u.compare, u = u !== null ? u : yl, u(E, c) && r.ref === i.ref) return rr(r, i, d);
    }
    return i.flags |= 1, r = Tr(h, c), r.ref = i.ref, r.return = i, i.child = r;
  }
  function Oh(r, i, u, c, d) {
    if (r !== null && yl(r.memoizedProps, c) && r.ref === i.ref) if (Vt = !1, (r.lanes & d) !== 0) r.flags & 131072 && (Vt = !0);
    else return i.lanes = r.lanes, rr(r, i, d);
    return gc(r, i, u, c, d);
  }
  function Dh(r, i, u) {
    var c = i.pendingProps, d = c.children, h = r !== null ? r.memoizedState : null;
    if (c.mode === "hidden") if (!(i.mode & 1)) i.memoizedState = { baseLanes: 0, cachePool: null }, we(Qi, Kt), Kt |= u;
    else if (u & 1073741824) i.memoizedState = { baseLanes: 0, cachePool: null }, c = h !== null ? h.baseLanes : u, we(Qi, Kt), Kt |= c;
    else return r = h !== null ? h.baseLanes | u : u, i.lanes = i.childLanes = 1073741824, i.memoizedState = { baseLanes: r, cachePool: null }, i.updateQueue = null, we(Qi, Kt), Kt |= r, null;
    else h !== null ? (c = h.baseLanes | u, i.memoizedState = null) : c = u, we(Qi, Kt), Kt |= c;
    return gt(r, i, d, u), i.child;
  }
  function Fh(r, i) {
    var u = i.ref;
    (r === null && u !== null || r !== null && r.ref !== u) && (i.flags |= 512, i.flags |= 2097152);
  }
  function gc(r, i, u, c, d) {
    var h = Pt(u) ? qr : ot.current;
    return h = Oi(i, h), Fi(i, d), u = ac(r, i, u, c, h, d), c = cc(), r !== null && !Vt ? (i.updateQueue = r.updateQueue, i.flags &= -2053, r.lanes &= ~d, rr(r, i, d)) : (Re && c && ba(i), i.flags |= 1, gt(r, i, u, d), i.child);
  }
  function Uh(r, i, u, c, d) {
    if (Pt(u)) {
      var h = !0;
      fl(i);
    } else h = !1;
    if (Fi(i, d), i.stateNode === null) r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), bp(i, u, c), $a(i, u, c, d), c = !0;
    else if (r === null) {
      var E = i.stateNode, P = i.memoizedProps;
      E.props = P;
      var z = E.context, G = u.contextType;
      typeof G == "object" && G !== null ? G = en(G) : (G = Pt(u) ? qr : ot.current, G = Oi(i, G));
      var J = u.getDerivedStateFromProps, ne = typeof J == "function" || typeof E.getSnapshotBeforeUpdate == "function";
      ne || typeof E.UNSAFE_componentWillReceiveProps != "function" && typeof E.componentWillReceiveProps != "function" || (P !== c || z !== G) && eh(i, E, c, G), vr = !1;
      var ee = i.memoizedState;
      E.state = ee, xl(i, c, E, d), z = i.memoizedState, P !== c || ee !== z || kt.current || vr ? (typeof J == "function" && (qa(i, u, J, c), z = i.memoizedState), (P = vr || $p(i, u, P, c, ee, z, G)) ? (ne || typeof E.UNSAFE_componentWillMount != "function" && typeof E.componentWillMount != "function" || (typeof E.componentWillMount == "function" && E.componentWillMount(), typeof E.UNSAFE_componentWillMount == "function" && E.UNSAFE_componentWillMount()), typeof E.componentDidMount == "function" && (i.flags |= 4194308)) : (typeof E.componentDidMount == "function" && (i.flags |= 4194308), i.memoizedProps = c, i.memoizedState = z), E.props = c, E.state = z, E.context = G, c = P) : (typeof E.componentDidMount == "function" && (i.flags |= 4194308), c = !1);
    } else {
      E = i.stateNode, Yp(r, i), P = i.memoizedProps, G = i.type === i.elementType ? P : Sn(i.type, P), E.props = G, ne = i.pendingProps, ee = E.context, z = u.contextType, typeof z == "object" && z !== null ? z = en(z) : (z = Pt(u) ? qr : ot.current, z = Oi(i, z));
      var ve = u.getDerivedStateFromProps;
      (J = typeof ve == "function" || typeof E.getSnapshotBeforeUpdate == "function") || typeof E.UNSAFE_componentWillReceiveProps != "function" && typeof E.componentWillReceiveProps != "function" || (P !== ne || ee !== z) && eh(i, E, c, z), vr = !1, ee = i.memoizedState, E.state = ee, xl(i, c, E, d);
      var b = i.memoizedState;
      P !== ne || ee !== b || kt.current || vr ? (typeof ve == "function" && (qa(i, u, ve, c), b = i.memoizedState), (G = vr || $p(i, u, G, c, ee, b, z) || !1) ? (J || typeof E.UNSAFE_componentWillUpdate != "function" && typeof E.componentWillUpdate != "function" || (typeof E.componentWillUpdate == "function" && E.componentWillUpdate(
        c,
        b,
        z
      ), typeof E.UNSAFE_componentWillUpdate == "function" && E.UNSAFE_componentWillUpdate(c, b, z)), typeof E.componentDidUpdate == "function" && (i.flags |= 4), typeof E.getSnapshotBeforeUpdate == "function" && (i.flags |= 1024)) : (typeof E.componentDidUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (i.flags |= 4), typeof E.getSnapshotBeforeUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (i.flags |= 1024), i.memoizedProps = c, i.memoizedState = b), E.props = c, E.state = b, E.context = z, c = G) : (typeof E.componentDidUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (i.flags |= 4), typeof E.getSnapshotBeforeUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (i.flags |= 1024), c = !1);
    }
    return yc(r, i, u, c, h, d);
  }
  function yc(r, i, u, c, d, h) {
    Fh(r, i);
    var E = (i.flags & 128) !== 0;
    if (!c && !E) return d && Wp(i, u, !1), rr(r, i, h);
    c = i.stateNode, RS.current = i;
    var P = E && typeof u.getDerivedStateFromError != "function" ? null : c.render();
    return i.flags |= 1, r !== null && E ? (i.child = Gi(i, r.child, null, h), i.child = Gi(i, null, P, h)) : gt(r, i, P, h), i.memoizedState = c.state, d && Wp(i, u, !0), i.child;
  }
  function Hh(r) {
    var i = r.stateNode;
    i.pendingContext ? Bp(r, i.pendingContext, i.pendingContext !== i.context) : i.context && Bp(r, i.context, !1), ic(r, i.containerInfo);
  }
  function Bh(r, i, u, c, d) {
    return Bi(), rc(d), i.flags |= 256, gt(r, i, u, c), i.child;
  }
  var Ol = { dehydrated: null, treeContext: null, retryLane: 0 };
  function Dl(r) {
    return { baseLanes: r, cachePool: null };
  }
  function Gh(r, i, u) {
    var c = i.pendingProps, d = Ae.current, h = !1, E = (i.flags & 128) !== 0, P;
    if ((P = E) || (P = r !== null && r.memoizedState === null ? !1 : (d & 2) !== 0), P ? (h = !0, i.flags &= -129) : (r === null || r.memoizedState !== null) && (d |= 1), we(Ae, d & 1), r === null)
      return nc(i), r = i.memoizedState, r !== null && (r = r.dehydrated, r !== null) ? (i.mode & 1 ? za(r) ? i.lanes = 8 : i.lanes = 1073741824 : i.lanes = 1, null) : (d = c.children, r = c.fallback, h ? (c = i.mode, h = i.child, d = { mode: "hidden", children: d }, !(c & 1) && h !== null ? (h.childLanes = 0, h.pendingProps = d) : h = ru(d, c, 0, null), r = si(r, c, u, null), h.return = i, r.return = i, h.sibling = r, i.child = h, i.child.memoizedState = Dl(u), i.memoizedState = Ol, r) : vc(i, d));
    if (d = r.memoizedState, d !== null) {
      if (P = d.dehydrated, P !== null) {
        if (E)
          return i.flags & 256 ? (i.flags &= -257, Fl(r, i, u, Error(a(422)))) : i.memoizedState !== null ? (i.child = r.child, i.flags |= 128, null) : (h = c.fallback, d = i.mode, c = ru({ mode: "visible", children: c.children }, d, 0, null), h = si(h, d, u, null), h.flags |= 2, c.return = i, h.return = i, c.sibling = h, i.child = c, i.mode & 1 && Gi(
            i,
            r.child,
            null,
            u
          ), i.child.memoizedState = Dl(u), i.memoizedState = Ol, h);
        if (!(i.mode & 1)) i = Fl(r, i, u, null);
        else if (za(P)) i = Fl(r, i, u, Error(a(419)));
        else if (c = (u & r.childLanes) !== 0, Vt || c) {
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
            c = h & (c.suspendedLanes | u) ? 0 : h, c !== 0 && c !== d.retryLane && (d.retryLane = c, sn(r, c, -1));
          }
          Fc(), i = Fl(r, i, u, Error(a(421)));
        } else Up(P) ? (i.flags |= 128, i.child = r.child, i = BS.bind(null, r), W1(P, i), i = null) : (u = d.treeContext, Bt && (Wt = Q1(P), Gt = i, Re = !0, wn = null, Vo = !1, u !== null && (tn[nn++] = er, tn[nn++] = tr, tn[nn++] = $r, er = u.id, tr = u.overflow, $r = i)), i = vc(i, i.pendingProps.children), i.flags |= 4096);
        return i;
      }
      return h ? (c = Vh(r, i, c.children, c.fallback, u), h = i.child, d = r.child.memoizedState, h.memoizedState = d === null ? Dl(u) : { baseLanes: d.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, i.memoizedState = Ol, c) : (u = Wh(r, i, c.children, u), i.memoizedState = null, u);
    }
    return h ? (c = Vh(r, i, c.children, c.fallback, u), h = i.child, d = r.child.memoizedState, h.memoizedState = d === null ? Dl(u) : { baseLanes: d.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, i.memoizedState = Ol, c) : (u = Wh(r, i, c.children, u), i.memoizedState = null, u);
  }
  function vc(r, i) {
    return i = ru({ mode: "visible", children: i }, r.mode, 0, null), i.return = r, r.child = i;
  }
  function Wh(r, i, u, c) {
    var d = r.child;
    return r = d.sibling, u = Tr(d, { mode: "visible", children: u }), !(i.mode & 1) && (u.lanes = c), u.return = i, u.sibling = null, r !== null && (c = i.deletions, c === null ? (i.deletions = [r], i.flags |= 16) : c.push(r)), i.child = u;
  }
  function Vh(r, i, u, c, d) {
    var h = i.mode;
    r = r.child;
    var E = r.sibling, P = { mode: "hidden", children: u };
    return !(h & 1) && i.child !== r ? (u = i.child, u.childLanes = 0, u.pendingProps = P, i.deletions = null) : (u = Tr(r, P), u.subtreeFlags = r.subtreeFlags & 14680064), E !== null ? c = Tr(E, c) : (c = si(c, h, d, null), c.flags |= 2), c.return = i, u.return = i, u.sibling = c, i.child = u, c;
  }
  function Fl(r, i, u, c) {
    return c !== null && rc(c), Gi(i, r.child, null, u), r = vc(i, i.pendingProps.children), r.flags |= 2, i.memoizedState = null, r;
  }
  function Kh(r, i, u) {
    r.lanes |= i;
    var c = r.alternate;
    c !== null && (c.lanes |= i), Za(r.return, i, u);
  }
  function Sc(r, i, u, c, d) {
    var h = r.memoizedState;
    h === null ? r.memoizedState = { isBackwards: i, rendering: null, renderingStartTime: 0, last: c, tail: u, tailMode: d } : (h.isBackwards = i, h.rendering = null, h.renderingStartTime = 0, h.last = c, h.tail = u, h.tailMode = d);
  }
  function Qh(r, i, u) {
    var c = i.pendingProps, d = c.revealOrder, h = c.tail;
    if (gt(r, i, c.children, u), c = Ae.current, c & 2) c = c & 1 | 2, i.flags |= 128;
    else {
      if (r !== null && r.flags & 128) e: for (r = i.child; r !== null; ) {
        if (r.tag === 13) r.memoizedState !== null && Kh(r, u, i);
        else if (r.tag === 19) Kh(r, u, i);
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
    if (we(Ae, c), !(i.mode & 1)) i.memoizedState = null;
    else switch (d) {
      case "forwards":
        for (u = i.child, d = null; u !== null; ) r = u.alternate, r !== null && Pl(r) === null && (d = u), u = u.sibling;
        u = d, u === null ? (d = i.child, i.child = null) : (d = u.sibling, u.sibling = null), Sc(i, !1, d, u, h);
        break;
      case "backwards":
        for (u = null, d = i.child, i.child = null; d !== null; ) {
          if (r = d.alternate, r !== null && Pl(r) === null) {
            i.child = d;
            break;
          }
          r = d.sibling, d.sibling = u, u = d, d = r;
        }
        Sc(i, !0, u, null, h);
        break;
      case "together":
        Sc(i, !1, null, null, void 0);
        break;
      default:
        i.memoizedState = null;
    }
    return i.child;
  }
  function rr(r, i, u) {
    if (r !== null && (i.dependencies = r.dependencies), Xi |= i.lanes, !(u & i.childLanes)) return null;
    if (r !== null && i.child !== r.child) throw Error(a(153));
    if (i.child !== null) {
      for (r = i.child, u = Tr(r, r.pendingProps), i.child = u, u.return = i; r.sibling !== null; ) r = r.sibling, u = u.sibling = Tr(r, r.pendingProps), u.return = i;
      u.sibling = null;
    }
    return i.child;
  }
  function LS(r, i, u) {
    switch (i.tag) {
      case 3:
        Hh(i), Bi();
        break;
      case 5:
        uh(i);
        break;
      case 1:
        Pt(i.type) && fl(i);
        break;
      case 4:
        ic(i, i.stateNode.containerInfo);
        break;
      case 10:
        Xp(i, i.type._context, i.memoizedProps.value);
        break;
      case 13:
        var c = i.memoizedState;
        if (c !== null)
          return c.dehydrated !== null ? (we(Ae, Ae.current & 1), i.flags |= 128, null) : u & i.child.childLanes ? Gh(r, i, u) : (we(Ae, Ae.current & 1), r = rr(r, i, u), r !== null ? r.sibling : null);
        we(Ae, Ae.current & 1);
        break;
      case 19:
        if (c = (u & i.childLanes) !== 0, r.flags & 128) {
          if (c) return Qh(
            r,
            i,
            u
          );
          i.flags |= 128;
        }
        var d = i.memoizedState;
        if (d !== null && (d.rendering = null, d.tail = null, d.lastEffect = null), we(Ae, Ae.current), c) break;
        return null;
      case 22:
      case 23:
        return i.lanes = 0, Dh(r, i, u);
    }
    return rr(r, i, u);
  }
  function AS(r, i) {
    switch (ec(i), i.tag) {
      case 1:
        return Pt(i.type) && cl(), r = i.flags, r & 65536 ? (i.flags = r & -65537 | 128, i) : null;
      case 3:
        return Vi(), ke(kt), ke(ot), lc(), r = i.flags, r & 65536 && !(r & 128) ? (i.flags = r & -65537 | 128, i) : null;
      case 5:
        return oc(i), null;
      case 13:
        if (ke(Ae), r = i.memoizedState, r !== null && r.dehydrated !== null) {
          if (i.alternate === null) throw Error(a(340));
          Bi();
        }
        return r = i.flags, r & 65536 ? (i.flags = r & -65537 | 128, i) : null;
      case 19:
        return ke(Ae), null;
      case 4:
        return Vi(), null;
      case 10:
        return Ya(i.type._context), null;
      case 22:
      case 23:
        return Dc(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Ul = !1, ti = !1, MS = typeof WeakSet == "function" ? WeakSet : Set, K = null;
  function Hl(r, i) {
    var u = r.ref;
    if (u !== null) if (typeof u == "function") try {
      u(null);
    } catch (c) {
      Lt(r, i, c);
    }
    else u.current = null;
  }
  function wc(r, i, u) {
    try {
      u();
    } catch (c) {
      Lt(r, i, c);
    }
  }
  var Xh = !1;
  function NS(r, i) {
    for (U(r.containerInfo), K = i; K !== null; ) if (r = K, i = r.child, (r.subtreeFlags & 1028) !== 0 && i !== null) i.return = r, K = i;
    else for (; K !== null; ) {
      r = K;
      try {
        var u = r.alternate;
        if (r.flags & 1024) switch (r.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (u !== null) {
              var c = u.memoizedProps, d = u.memoizedState, h = r.stateNode, E = h.getSnapshotBeforeUpdate(r.elementType === r.type ? c : Sn(r.type, c), d);
              h.__reactInternalSnapshotBeforeUpdate = E;
            }
            break;
          case 3:
            yn && D1(r.stateNode.containerInfo);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(a(163));
        }
      } catch (P) {
        Lt(r, r.return, P);
      }
      if (i = r.sibling, i !== null) {
        i.return = r.return, K = i;
        break;
      }
      K = r.return;
    }
    return u = Xh, Xh = !1, u;
  }
  function ni(r, i, u) {
    var c = i.updateQueue;
    if (c = c !== null ? c.lastEffect : null, c !== null) {
      var d = c = c.next;
      do {
        if ((d.tag & r) === r) {
          var h = d.destroy;
          d.destroy = void 0, h !== void 0 && wc(i, u, h);
        }
        d = d.next;
      } while (d !== c);
    }
  }
  function ns(r, i) {
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
  function xc(r) {
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
  function Yh(r, i, u) {
    if (Nn && typeof Nn.onCommitFiberUnmount == "function") try {
      Nn.onCommitFiberUnmount(ml, i);
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
            d = d.tag, h !== void 0 && (d & 2 || d & 4) && wc(i, u, h), c = c.next;
          } while (c !== r);
        }
        break;
      case 1:
        if (Hl(i, u), r = i.stateNode, typeof r.componentWillUnmount == "function") try {
          r.props = i.memoizedProps, r.state = i.memoizedState, r.componentWillUnmount();
        } catch (E) {
          Lt(
            i,
            u,
            E
          );
        }
        break;
      case 5:
        Hl(i, u);
        break;
      case 4:
        yn ? em(r, i, u) : al && al && (i = i.stateNode.containerInfo, u = zp(i), Op(i, u));
    }
  }
  function Zh(r, i, u) {
    for (var c = i; ; ) if (Yh(r, c, u), c.child === null || yn && c.tag === 4) {
      if (c === i) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === i) return;
        c = c.return;
      }
      c.sibling.return = c.return, c = c.sibling;
    } else c.child.return = c, c = c.child;
  }
  function Jh(r) {
    var i = r.alternate;
    i !== null && (r.alternate = null, Jh(i)), r.child = null, r.deletions = null, r.sibling = null, r.tag === 5 && (i = r.stateNode, i !== null && m1(i)), r.stateNode = null, r.return = null, r.dependencies = null, r.memoizedProps = null, r.memoizedState = null, r.pendingProps = null, r.stateNode = null, r.updateQueue = null;
  }
  function qh(r) {
    return r.tag === 5 || r.tag === 3 || r.tag === 4;
  }
  function $h(r) {
    e: for (; ; ) {
      for (; r.sibling === null; ) {
        if (r.return === null || qh(r.return)) return null;
        r = r.return;
      }
      for (r.sibling.return = r.return, r = r.sibling; r.tag !== 5 && r.tag !== 6 && r.tag !== 18; ) {
        if (r.flags & 2 || r.child === null || r.tag === 4) continue e;
        r.child.return = r, r = r.child;
      }
      if (!(r.flags & 2)) return r.stateNode;
    }
  }
  function bh(r) {
    if (yn) {
      e: {
        for (var i = r.return; i !== null; ) {
          if (qh(i)) break e;
          i = i.return;
        }
        throw Error(a(160));
      }
      var u = i;
      switch (u.tag) {
        case 5:
          i = u.stateNode, u.flags & 32 && (jp(i), u.flags &= -33), u = $h(r), Ec(r, u, i);
          break;
        case 3:
        case 4:
          i = u.stateNode.containerInfo, u = $h(r), _c(r, u, i);
          break;
        default:
          throw Error(a(161));
      }
    }
  }
  function _c(r, i, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, i ? A1(u, r, i) : k1(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (_c(r, i, u), r = r.sibling; r !== null; ) _c(r, i, u), r = r.sibling;
  }
  function Ec(r, i, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, i ? L1(u, r, i) : T1(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (Ec(r, i, u), r = r.sibling; r !== null; ) Ec(r, i, u), r = r.sibling;
  }
  function em(r, i, u) {
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
      if (c.tag === 5 || c.tag === 6) Zh(r, c, u), E ? N1(h, c.stateNode) : M1(h, c.stateNode);
      else if (c.tag === 18) E ? b1(h, c.stateNode) : $1(h, c.stateNode);
      else if (c.tag === 4) {
        if (c.child !== null) {
          h = c.stateNode.containerInfo, E = !0, c.child.return = c, c = c.child;
          continue;
        }
      } else if (Yh(r, c, u), c.child !== null) {
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
  function Tc(r, i) {
    if (yn) {
      switch (i.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          ni(3, i, i.return), ns(3, i), ni(5, i, i.return);
          return;
        case 1:
          return;
        case 5:
          var u = i.stateNode;
          if (u != null) {
            var c = i.memoizedProps;
            r = r !== null ? r.memoizedProps : c;
            var d = i.type, h = i.updateQueue;
            i.updateQueue = null, h !== null && R1(u, h, d, r, c, i);
          }
          return;
        case 6:
          if (i.stateNode === null) throw Error(a(162));
          u = i.memoizedProps, P1(i.stateNode, r !== null ? r.memoizedProps : u, u);
          return;
        case 3:
          Bt && r !== null && r.memoizedState.isDehydrated && Hp(i.stateNode.containerInfo);
          return;
        case 12:
          return;
        case 13:
          Bl(i);
          return;
        case 19:
          Bl(i);
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
        ni(3, i, i.return), ns(3, i), ni(5, i, i.return);
        return;
      case 12:
        return;
      case 13:
        Bl(i);
        return;
      case 19:
        Bl(i);
        return;
      case 3:
        Bt && r !== null && r.memoizedState.isDehydrated && Hp(i.stateNode.containerInfo);
        break;
      case 22:
      case 23:
        return;
    }
    e: if (al) {
      switch (i.tag) {
        case 1:
        case 5:
        case 6:
          break e;
        case 3:
        case 4:
          i = i.stateNode, Op(i.containerInfo, i.pendingChildren);
          break e;
      }
      throw Error(a(163));
    }
  }
  function Bl(r) {
    var i = r.updateQueue;
    if (i !== null) {
      r.updateQueue = null;
      var u = r.stateNode;
      u === null && (u = r.stateNode = new MS()), i.forEach(function(c) {
        var d = GS.bind(null, r, c);
        u.has(c) || (u.add(c), c.then(d, d));
      });
    }
  }
  function jS(r, i) {
    for (K = i; K !== null; ) {
      i = K;
      var u = i.deletions;
      if (u !== null) for (var c = 0; c < u.length; c++) {
        var d = u[c];
        try {
          var h = r;
          yn ? em(h, d, i) : Zh(h, d, i);
          var E = d.alternate;
          E !== null && (E.return = null), d.return = null;
        } catch ($) {
          Lt(d, i, $);
        }
      }
      if (u = i.child, i.subtreeFlags & 12854 && u !== null) u.return = i, K = u;
      else for (; K !== null; ) {
        i = K;
        try {
          var P = i.flags;
          if (P & 32 && yn && jp(i.stateNode), P & 512) {
            var z = i.alternate;
            if (z !== null) {
              var G = z.ref;
              G !== null && (typeof G == "function" ? G(null) : G.current = null);
            }
          }
          if (P & 8192) switch (i.tag) {
            case 13:
              if (i.memoizedState !== null) {
                var J = i.alternate;
                (J === null || J.memoizedState === null) && (Mc = Ye());
              }
              break;
            case 22:
              var ne = i.memoizedState !== null, ee = i.alternate, ve = ee !== null && ee.memoizedState !== null;
              if (u = i, yn) {
                e: if (c = u, d = ne, h = null, yn) for (var b = c; ; ) {
                  if (b.tag === 5) {
                    if (h === null) {
                      h = b;
                      var at = b.stateNode;
                      d ? j1(at) : I1(b.stateNode, b.memoizedProps);
                    }
                  } else if (b.tag === 6) {
                    if (h === null) {
                      var un = b.stateNode;
                      d ? z1(un) : O1(un, b.memoizedProps);
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
                K = u;
                for (var M = u.child; M !== null; ) {
                  for (u = K = M; K !== null; ) {
                    c = K;
                    var C = c.child;
                    switch (c.tag) {
                      case 0:
                      case 11:
                      case 14:
                      case 15:
                        ni(4, c, c.return);
                        break;
                      case 1:
                        Hl(c, c.return);
                        var j = c.stateNode;
                        if (typeof j.componentWillUnmount == "function") {
                          var X = c.return;
                          try {
                            j.props = c.memoizedProps, j.state = c.memoizedState, j.componentWillUnmount();
                          } catch ($) {
                            Lt(
                              c,
                              X,
                              $
                            );
                          }
                        }
                        break;
                      case 5:
                        Hl(c, c.return);
                        break;
                      case 22:
                        if (c.memoizedState !== null) {
                          rm(u);
                          continue;
                        }
                    }
                    C !== null ? (C.return = c, K = C) : rm(u);
                  }
                  M = M.sibling;
                }
              }
          }
          switch (P & 4102) {
            case 2:
              bh(i), i.flags &= -3;
              break;
            case 6:
              bh(i), i.flags &= -3, Tc(i.alternate, i);
              break;
            case 4096:
              i.flags &= -4097;
              break;
            case 4100:
              i.flags &= -4097, Tc(i.alternate, i);
              break;
            case 4:
              Tc(i.alternate, i);
          }
        } catch ($) {
          Lt(i, i.return, $);
        }
        if (u = i.sibling, u !== null) {
          u.return = i.return, K = u;
          break;
        }
        K = i.return;
      }
    }
  }
  function zS(r, i, u) {
    K = r, tm(r);
  }
  function tm(r, i, u) {
    for (var c = (r.mode & 1) !== 0; K !== null; ) {
      var d = K, h = d.child;
      if (d.tag === 22 && c) {
        var E = d.memoizedState !== null || Ul;
        if (!E) {
          var P = d.alternate, z = P !== null && P.memoizedState !== null || ti;
          P = Ul;
          var G = ti;
          if (Ul = E, (ti = z) && !G) for (K = d; K !== null; ) E = K, z = E.child, E.tag === 22 && E.memoizedState !== null ? im(d) : z !== null ? (z.return = E, K = z) : im(d);
          for (; h !== null; ) K = h, tm(h), h = h.sibling;
          K = d, Ul = P, ti = G;
        }
        nm(r);
      } else d.subtreeFlags & 8772 && h !== null ? (h.return = d, K = h) : nm(r);
    }
  }
  function nm(r) {
    for (; K !== null; ) {
      var i = K;
      if (i.flags & 8772) {
        var u = i.alternate;
        try {
          if (i.flags & 8772) switch (i.tag) {
            case 0:
            case 11:
            case 15:
              ti || ns(5, i);
              break;
            case 1:
              var c = i.stateNode;
              if (i.flags & 4 && !ti) if (u === null) c.componentDidMount();
              else {
                var d = i.elementType === i.type ? u.memoizedProps : Sn(i.type, u.memoizedProps);
                c.componentDidUpdate(d, u.memoizedState, c.__reactInternalSnapshotBeforeUpdate);
              }
              var h = i.updateQueue;
              h !== null && Jp(i, h, c);
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
                Jp(i, E, u);
              }
              break;
            case 5:
              var P = i.stateNode;
              u === null && i.flags & 4 && C1(P, i.type, i.memoizedProps, i);
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (Bt && i.memoizedState === null) {
                var z = i.alternate;
                if (z !== null) {
                  var G = z.memoizedState;
                  if (G !== null) {
                    var J = G.dehydrated;
                    J !== null && q1(J);
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
          ti || i.flags & 512 && xc(i);
        } catch (ne) {
          Lt(i, i.return, ne);
        }
      }
      if (i === r) {
        K = null;
        break;
      }
      if (u = i.sibling, u !== null) {
        u.return = i.return, K = u;
        break;
      }
      K = i.return;
    }
  }
  function rm(r) {
    for (; K !== null; ) {
      var i = K;
      if (i === r) {
        K = null;
        break;
      }
      var u = i.sibling;
      if (u !== null) {
        u.return = i.return, K = u;
        break;
      }
      K = i.return;
    }
  }
  function im(r) {
    for (; K !== null; ) {
      var i = K;
      try {
        switch (i.tag) {
          case 0:
          case 11:
          case 15:
            var u = i.return;
            try {
              ns(4, i);
            } catch (z) {
              Lt(i, u, z);
            }
            break;
          case 1:
            var c = i.stateNode;
            if (typeof c.componentDidMount == "function") {
              var d = i.return;
              try {
                c.componentDidMount();
              } catch (z) {
                Lt(i, d, z);
              }
            }
            var h = i.return;
            try {
              xc(i);
            } catch (z) {
              Lt(i, h, z);
            }
            break;
          case 5:
            var E = i.return;
            try {
              xc(i);
            } catch (z) {
              Lt(i, E, z);
            }
        }
      } catch (z) {
        Lt(i, i.return, z);
      }
      if (i === r) {
        K = null;
        break;
      }
      var P = i.sibling;
      if (P !== null) {
        P.return = i.return, K = P;
        break;
      }
      K = i.return;
    }
  }
  var Gl = 0, Wl = 1, Vl = 2, Kl = 3, Ql = 4;
  if (typeof Symbol == "function" && Symbol.for) {
    var rs = Symbol.for;
    Gl = rs("selector.component"), Wl = rs("selector.has_pseudo_class"), Vl = rs("selector.role"), Kl = rs("selector.test_id"), Ql = rs("selector.text");
  }
  function kc(r) {
    var i = d1(r);
    if (i != null) {
      if (typeof i.memoizedProps["data-testname"] != "string") throw Error(a(364));
      return i;
    }
    if (r = v1(r), r === null) throw Error(a(362));
    return r.stateNode.current;
  }
  function Pc(r, i) {
    switch (i.$$typeof) {
      case Gl:
        if (r.type === i.value) return !0;
        break;
      case Wl:
        e: {
          i = i.value, r = [r, 0];
          for (var u = 0; u < r.length; ) {
            var c = r[u++], d = r[u++], h = i[d];
            if (c.tag !== 5 || !Uo(c)) {
              for (; h != null && Pc(c, h); ) d++, h = i[d];
              if (d === i.length) {
                i = !0;
                break e;
              } else for (c = c.child; c !== null; ) r.push(c, d), c = c.sibling;
            }
          }
          i = !1;
        }
        return i;
      case Vl:
        if (r.tag === 5 && x1(r.stateNode, i.value)) return !0;
        break;
      case Ql:
        if ((r.tag === 5 || r.tag === 6) && (r = w1(r), r !== null && 0 <= r.indexOf(i.value))) return !0;
        break;
      case Kl:
        if (r.tag === 5 && (r = r.memoizedProps["data-testname"], typeof r == "string" && r.toLowerCase() === i.value.toLowerCase())) return !0;
        break;
      default:
        throw Error(a(365));
    }
    return !1;
  }
  function Cc(r) {
    switch (r.$$typeof) {
      case Gl:
        return "<" + (D(r.value) || "Unknown") + ">";
      case Wl:
        return ":has(" + (Cc(r) || "") + ")";
      case Vl:
        return '[role="' + r.value + '"]';
      case Ql:
        return '"' + r.value + '"';
      case Kl:
        return '[data-testname="' + r.value + '"]';
      default:
        throw Error(a(365));
    }
  }
  function om(r, i) {
    var u = [];
    r = [r, 0];
    for (var c = 0; c < r.length; ) {
      var d = r[c++], h = r[c++], E = i[h];
      if (d.tag !== 5 || !Uo(d)) {
        for (; E != null && Pc(d, E); ) h++, E = i[h];
        if (h === i.length) u.push(d);
        else for (d = d.child; d !== null; ) r.push(d, h), d = d.sibling;
      }
    }
    return u;
  }
  function Rc(r, i) {
    if (!Fo) throw Error(a(363));
    r = kc(r), r = om(r, i), i = [], r = Array.from(r);
    for (var u = 0; u < r.length; ) {
      var c = r[u++];
      if (c.tag === 5) Uo(c) || i.push(c.stateNode);
      else for (c = c.child; c !== null; ) r.push(c), c = c.sibling;
    }
    return i;
  }
  var IS = Math.ceil, Xl = f.ReactCurrentDispatcher, Lc = f.ReactCurrentOwner, De = f.ReactCurrentBatchConfig, oe = 0, He = null, Be = null, et = 0, Kt = 0, Qi = gr(0), We = 0, is = null, Xi = 0, Yl = 0, Ac = 0, os = null, Ct = null, Mc = 0, Nc = 1 / 0;
  function Yi() {
    Nc = Ye() + 500;
  }
  var Zl = !1, jc = null, wr = null, Jl = !1, xr = null, ql = 0, ss = 0, zc = null, $l = -1, bl = 0;
  function yt() {
    return oe & 6 ? Ye() : $l !== -1 ? $l : $l = Ye();
  }
  function _r(r) {
    return r.mode & 1 ? oe & 2 && et !== 0 ? et & -et : yS.transition !== null ? (bl === 0 && (r = dl, dl <<= 1, !(dl & 4194240) && (dl = 64), bl = r), bl) : (r = de, r !== 0 ? r : h1()) : 1;
  }
  function sn(r, i, u) {
    if (50 < ss) throw ss = 0, zc = null, Error(a(185));
    var c = eu(r, i);
    return c === null ? null : (Wo(c, i, u), (!(oe & 2) || c !== He) && (c === He && (!(oe & 2) && (Yl |= i), We === 4 && Er(c, et)), Rt(c, u), i === 1 && oe === 0 && !(r.mode & 1) && (Yi(), gl && zn())), c);
  }
  function eu(r, i) {
    r.lanes |= i;
    var u = r.alternate;
    for (u !== null && (u.lanes |= i), u = r, r = r.return; r !== null; ) r.childLanes |= i, u = r.alternate, u !== null && (u.childLanes |= i), u = r, r = r.return;
    return u.tag === 3 ? u.stateNode : null;
  }
  function Rt(r, i) {
    var u = r.callbackNode;
    uS(r, i);
    var c = hl(r, r === He ? et : 0);
    if (c === 0) u !== null && Kp(u), r.callbackNode = null, r.callbackPriority = 0;
    else if (i = c & -c, r.callbackPriority !== i) {
      if (u != null && Kp(u), i === 1) r.tag === 0 ? gS(lm.bind(null, r)) : Qp(lm.bind(null, r)), g1 ? y1(function() {
        oe === 0 && zn();
      }) : Ga(Wa, zn), u = null;
      else {
        switch (Vp(c)) {
          case 1:
            u = Wa;
            break;
          case 4:
            u = dS;
            break;
          case 16:
            u = Va;
            break;
          case 536870912:
            u = pS;
            break;
          default:
            u = Va;
        }
        u = gm(u, sm.bind(null, r));
      }
      r.callbackPriority = i, r.callbackNode = u;
    }
  }
  function sm(r, i) {
    if ($l = -1, bl = 0, oe & 6) throw Error(a(327));
    var u = r.callbackNode;
    if (oi() && r.callbackNode !== u) return null;
    var c = hl(r, r === He ? et : 0);
    if (c === 0) return null;
    if (c & 30 || c & r.expiredLanes || i) i = tu(r, c);
    else {
      i = c;
      var d = oe;
      oe |= 2;
      var h = cm();
      (He !== r || et !== i) && (Yi(), ri(r, i));
      do
        try {
          FS();
          break;
        } catch (P) {
          am(r, P);
        }
      while (!0);
      Xa(), Xl.current = h, oe = d, Be !== null ? i = 0 : (He = null, et = 0, i = We);
    }
    if (i !== 0) {
      if (i === 2 && (d = Ua(r), d !== 0 && (c = d, i = Ic(r, d))), i === 1) throw u = is, ri(r, 0), Er(r, c), Rt(r, Ye()), u;
      if (i === 6) Er(r, c);
      else {
        if (d = r.current.alternate, !(c & 30) && !OS(d) && (i = tu(r, c), i === 2 && (h = Ua(r), h !== 0 && (c = h, i = Ic(r, h))), i === 1)) throw u = is, ri(r, 0), Er(r, c), Rt(r, Ye()), u;
        switch (r.finishedWork = d, r.finishedLanes = c, i) {
          case 0:
          case 1:
            throw Error(a(345));
          case 2:
            ii(r, Ct);
            break;
          case 3:
            if (Er(r, c), (c & 130023424) === c && (i = Mc + 500 - Ye(), 10 < i)) {
              if (hl(r, 0) !== 0) break;
              if (d = r.suspendedLanes, (d & c) !== c) {
                yt(), r.pingedLanes |= r.suspendedLanes & d;
                break;
              }
              r.timeoutHandle = bt(ii.bind(null, r, Ct), i);
              break;
            }
            ii(r, Ct);
            break;
          case 4:
            if (Er(r, c), (c & 4194240) === c) break;
            for (i = r.eventTimes, d = -1; 0 < c; ) {
              var E = 31 - vn(c);
              h = 1 << E, E = i[E], E > d && (d = E), c &= ~h;
            }
            if (c = d, c = Ye() - c, c = (120 > c ? 120 : 480 > c ? 480 : 1080 > c ? 1080 : 1920 > c ? 1920 : 3e3 > c ? 3e3 : 4320 > c ? 4320 : 1960 * IS(c / 1960)) - c, 10 < c) {
              r.timeoutHandle = bt(ii.bind(null, r, Ct), c);
              break;
            }
            ii(r, Ct);
            break;
          case 5:
            ii(r, Ct);
            break;
          default:
            throw Error(a(329));
        }
      }
    }
    return Rt(r, Ye()), r.callbackNode === u ? sm.bind(null, r) : null;
  }
  function Ic(r, i) {
    var u = os;
    return r.current.memoizedState.isDehydrated && (ri(r, i).flags |= 256), r = tu(r, i), r !== 2 && (i = Ct, Ct = u, i !== null && Oc(i)), r;
  }
  function Oc(r) {
    Ct === null ? Ct = r : Ct.push.apply(Ct, r);
  }
  function OS(r) {
    for (var i = r; ; ) {
      if (i.flags & 16384) {
        var u = i.updateQueue;
        if (u !== null && (u = u.stores, u !== null)) for (var c = 0; c < u.length; c++) {
          var d = u[c], h = d.getSnapshot;
          d = d.value;
          try {
            if (!jn(h(), d)) return !1;
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
  function Er(r, i) {
    for (i &= ~Ac, i &= ~Yl, r.suspendedLanes |= i, r.pingedLanes &= ~i, r = r.expirationTimes; 0 < i; ) {
      var u = 31 - vn(i), c = 1 << u;
      r[u] = -1, i &= ~c;
    }
  }
  function lm(r) {
    if (oe & 6) throw Error(a(327));
    oi();
    var i = hl(r, 0);
    if (!(i & 1)) return Rt(r, Ye()), null;
    var u = tu(r, i);
    if (r.tag !== 0 && u === 2) {
      var c = Ua(r);
      c !== 0 && (i = c, u = Ic(r, c));
    }
    if (u === 1) throw u = is, ri(r, 0), Er(r, i), Rt(r, Ye()), u;
    if (u === 6) throw Error(a(345));
    return r.finishedWork = r.current.alternate, r.finishedLanes = i, ii(r, Ct), Rt(r, Ye()), null;
  }
  function um(r) {
    xr !== null && xr.tag === 0 && !(oe & 6) && oi();
    var i = oe;
    oe |= 1;
    var u = De.transition, c = de;
    try {
      if (De.transition = null, de = 1, r) return r();
    } finally {
      de = c, De.transition = u, oe = i, !(oe & 6) && zn();
    }
  }
  function Dc() {
    Kt = Qi.current, ke(Qi);
  }
  function ri(r, i) {
    r.finishedWork = null, r.finishedLanes = 0;
    var u = r.timeoutHandle;
    if (u !== ja && (r.timeoutHandle = ja, f1(u)), Be !== null) for (u = Be.return; u !== null; ) {
      var c = u;
      switch (ec(c), c.tag) {
        case 1:
          c = c.type.childContextTypes, c != null && cl();
          break;
        case 3:
          Vi(), ke(kt), ke(ot), lc();
          break;
        case 5:
          oc(c);
          break;
        case 4:
          Vi();
          break;
        case 13:
          ke(Ae);
          break;
        case 19:
          ke(Ae);
          break;
        case 10:
          Ya(c.type._context);
          break;
        case 22:
        case 23:
          Dc();
      }
      u = u.return;
    }
    if (He = r, Be = r = Tr(r.current, null), et = Kt = i, We = 0, is = null, Ac = Yl = Xi = 0, Ct = os = null, In !== null) {
      for (i = 0; i < In.length; i++) if (u = In[i], c = u.interleaved, c !== null) {
        u.interleaved = null;
        var d = c.next, h = u.pending;
        if (h !== null) {
          var E = h.next;
          h.next = d, c.next = E;
        }
        u.pending = c;
      }
      In = null;
    }
    return r;
  }
  function am(r, i) {
    do {
      var u = Be;
      try {
        if (Xa(), Cl.current = jl, Rl) {
          for (var c = Ie.memoizedState; c !== null; ) {
            var d = c.queue;
            d !== null && (d.pending = null), c = c.next;
          }
          Rl = !1;
        }
        if (Ki = 0, Ze = st = Ie = null, Zo = !1, Jo = 0, Lc.current = null, u === null || u.return === null) {
          We = 1, is = i, Be = null;
          break;
        }
        e: {
          var h = r, E = u.return, P = u, z = i;
          if (i = et, P.flags |= 32768, z !== null && typeof z == "object" && typeof z.then == "function") {
            var G = z, J = P, ne = J.tag;
            if (!(J.mode & 1) && (ne === 0 || ne === 11 || ne === 15)) {
              var ee = J.alternate;
              ee ? (J.updateQueue = ee.updateQueue, J.memoizedState = ee.memoizedState, J.lanes = ee.lanes) : (J.updateQueue = null, J.memoizedState = null);
            }
            var ve = Ah(E);
            if (ve !== null) {
              ve.flags &= -257, Mh(ve, E, P, h, i), ve.mode & 1 && Lh(h, G, i), i = ve, z = G;
              var b = i.updateQueue;
              if (b === null) {
                var at = /* @__PURE__ */ new Set();
                at.add(z), i.updateQueue = at;
              } else b.add(z);
              break e;
            } else {
              if (!(i & 1)) {
                Lh(h, G, i), Fc();
                break e;
              }
              z = Error(a(426));
            }
          } else if (Re && P.mode & 1) {
            var un = Ah(E);
            if (un !== null) {
              !(un.flags & 65536) && (un.flags |= 256), Mh(un, E, P, h, i), rc(z);
              break e;
            }
          }
          h = z, We !== 4 && (We = 2), os === null ? os = [h] : os.push(h), z = hc(z, P), P = E;
          do {
            switch (P.tag) {
              case 3:
                P.flags |= 65536, i &= -i, P.lanes |= i;
                var M = Ch(P, z, i);
                Zp(P, M);
                break e;
              case 1:
                h = z;
                var C = P.type, j = P.stateNode;
                if (!(P.flags & 128) && (typeof C.getDerivedStateFromError == "function" || j !== null && typeof j.componentDidCatch == "function" && (wr === null || !wr.has(j)))) {
                  P.flags |= 65536, i &= -i, P.lanes |= i;
                  var X = Rh(P, h, i);
                  Zp(P, X);
                  break e;
                }
            }
            P = P.return;
          } while (P !== null);
        }
        dm(u);
      } catch ($) {
        i = $, Be === u && u !== null && (Be = u = u.return);
        continue;
      }
      break;
    } while (!0);
  }
  function cm() {
    var r = Xl.current;
    return Xl.current = jl, r === null ? jl : r;
  }
  function Fc() {
    (We === 0 || We === 3 || We === 2) && (We = 4), He === null || !(Xi & 268435455) && !(Yl & 268435455) || Er(He, et);
  }
  function tu(r, i) {
    var u = oe;
    oe |= 2;
    var c = cm();
    He === r && et === i || ri(r, i);
    do
      try {
        DS();
        break;
      } catch (d) {
        am(r, d);
      }
    while (!0);
    if (Xa(), oe = u, Xl.current = c, Be !== null) throw Error(a(261));
    return He = null, et = 0, We;
  }
  function DS() {
    for (; Be !== null; ) fm(Be);
  }
  function FS() {
    for (; Be !== null && !cS(); ) fm(Be);
  }
  function fm(r) {
    var i = mm(r.alternate, r, Kt);
    r.memoizedProps = r.pendingProps, i === null ? dm(r) : Be = i, Lc.current = null;
  }
  function dm(r) {
    var i = r;
    do {
      var u = i.alternate;
      if (r = i.return, i.flags & 32768) {
        if (u = AS(u, i), u !== null) {
          u.flags &= 32767, Be = u;
          return;
        }
        if (r !== null) r.flags |= 32768, r.subtreeFlags = 0, r.deletions = null;
        else {
          We = 6, Be = null;
          return;
        }
      } else if (u = CS(u, i, Kt), u !== null) {
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
  function ii(r, i) {
    var u = de, c = De.transition;
    try {
      De.transition = null, de = 1, US(r, i, u);
    } finally {
      De.transition = c, de = u;
    }
    return null;
  }
  function US(r, i, u) {
    do
      oi();
    while (xr !== null);
    if (oe & 6) throw Error(a(327));
    var c = r.finishedWork, d = r.finishedLanes;
    if (c === null) return null;
    if (r.finishedWork = null, r.finishedLanes = 0, c === r.current) throw Error(a(177));
    r.callbackNode = null, r.callbackPriority = 0;
    var h = c.lanes | c.childLanes;
    if (aS(r, h), r === He && (Be = He = null, et = 0), !(c.subtreeFlags & 2064) && !(c.flags & 2064) || Jl || (Jl = !0, gm(Va, function() {
      return oi(), null;
    })), h = (c.flags & 15990) !== 0, c.subtreeFlags & 15990 || h) {
      h = De.transition, De.transition = null;
      var E = de;
      de = 1;
      var P = oe;
      oe |= 4, Lc.current = null, NS(r, c), jS(r, c), F(r.containerInfo), r.current = c, zS(c), fS(), oe = P, de = E, De.transition = h;
    } else r.current = c;
    if (Jl && (Jl = !1, xr = r, ql = d), h = r.pendingLanes, h === 0 && (wr = null), hS(c.stateNode), Rt(r, Ye()), i !== null) for (u = r.onRecoverableError, c = 0; c < i.length; c++) u(i[c]);
    if (Zl) throw Zl = !1, r = jc, jc = null, r;
    return ql & 1 && r.tag !== 0 && oi(), h = r.pendingLanes, h & 1 ? r === zc ? ss++ : (ss = 0, zc = r) : ss = 0, zn(), null;
  }
  function oi() {
    if (xr !== null) {
      var r = Vp(ql), i = De.transition, u = de;
      try {
        if (De.transition = null, de = 16 > r ? 16 : r, xr === null) var c = !1;
        else {
          if (r = xr, xr = null, ql = 0, oe & 6) throw Error(a(331));
          var d = oe;
          for (oe |= 4, K = r.current; K !== null; ) {
            var h = K, E = h.child;
            if (K.flags & 16) {
              var P = h.deletions;
              if (P !== null) {
                for (var z = 0; z < P.length; z++) {
                  var G = P[z];
                  for (K = G; K !== null; ) {
                    var J = K;
                    switch (J.tag) {
                      case 0:
                      case 11:
                      case 15:
                        ni(8, J, h);
                    }
                    var ne = J.child;
                    if (ne !== null) ne.return = J, K = ne;
                    else for (; K !== null; ) {
                      J = K;
                      var ee = J.sibling, ve = J.return;
                      if (Jh(J), J === G) {
                        K = null;
                        break;
                      }
                      if (ee !== null) {
                        ee.return = ve, K = ee;
                        break;
                      }
                      K = ve;
                    }
                  }
                }
                var b = h.alternate;
                if (b !== null) {
                  var at = b.child;
                  if (at !== null) {
                    b.child = null;
                    do {
                      var un = at.sibling;
                      at.sibling = null, at = un;
                    } while (at !== null);
                  }
                }
                K = h;
              }
            }
            if (h.subtreeFlags & 2064 && E !== null) E.return = h, K = E;
            else e: for (; K !== null; ) {
              if (h = K, h.flags & 2048) switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  ni(9, h, h.return);
              }
              var M = h.sibling;
              if (M !== null) {
                M.return = h.return, K = M;
                break e;
              }
              K = h.return;
            }
          }
          var C = r.current;
          for (K = C; K !== null; ) {
            E = K;
            var j = E.child;
            if (E.subtreeFlags & 2064 && j !== null) j.return = E, K = j;
            else e: for (E = C; K !== null; ) {
              if (P = K, P.flags & 2048) try {
                switch (P.tag) {
                  case 0:
                  case 11:
                  case 15:
                    ns(9, P);
                }
              } catch ($) {
                Lt(P, P.return, $);
              }
              if (P === E) {
                K = null;
                break e;
              }
              var X = P.sibling;
              if (X !== null) {
                X.return = P.return, K = X;
                break e;
              }
              K = P.return;
            }
          }
          if (oe = d, zn(), Nn && typeof Nn.onPostCommitFiberRoot == "function") try {
            Nn.onPostCommitFiberRoot(ml, r);
          } catch {
          }
          c = !0;
        }
        return c;
      } finally {
        de = u, De.transition = i;
      }
    }
    return !1;
  }
  function pm(r, i, u) {
    i = hc(u, i), i = Ch(r, i, 1), Sr(r, i), i = yt(), r = eu(r, 1), r !== null && (Wo(r, 1, i), Rt(r, i));
  }
  function Lt(r, i, u) {
    if (r.tag === 3) pm(r, r, u);
    else for (; i !== null; ) {
      if (i.tag === 3) {
        pm(i, r, u);
        break;
      } else if (i.tag === 1) {
        var c = i.stateNode;
        if (typeof i.type.getDerivedStateFromError == "function" || typeof c.componentDidCatch == "function" && (wr === null || !wr.has(c))) {
          r = hc(u, r), r = Rh(i, r, 1), Sr(i, r), r = yt(), i = eu(i, 1), i !== null && (Wo(i, 1, r), Rt(i, r));
          break;
        }
      }
      i = i.return;
    }
  }
  function HS(r, i, u) {
    var c = r.pingCache;
    c !== null && c.delete(i), i = yt(), r.pingedLanes |= r.suspendedLanes & u, He === r && (et & u) === u && (We === 4 || We === 3 && (et & 130023424) === et && 500 > Ye() - Mc ? ri(r, 0) : Ac |= u), Rt(r, i);
  }
  function hm(r, i) {
    i === 0 && (r.mode & 1 ? (i = pl, pl <<= 1, !(pl & 130023424) && (pl = 4194304)) : i = 1);
    var u = yt();
    r = eu(r, i), r !== null && (Wo(r, i, u), Rt(r, u));
  }
  function BS(r) {
    var i = r.memoizedState, u = 0;
    i !== null && (u = i.retryLane), hm(r, u);
  }
  function GS(r, i) {
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
    c !== null && c.delete(i), hm(r, u);
  }
  var mm;
  mm = function(r, i, u) {
    if (r !== null) if (r.memoizedProps !== i.pendingProps || kt.current) Vt = !0;
    else {
      if (!(r.lanes & u) && !(i.flags & 128)) return Vt = !1, LS(r, i, u);
      Vt = !!(r.flags & 131072);
    }
    else Vt = !1, Re && i.flags & 1048576 && th(i, Tl, i.index);
    switch (i.lanes = 0, i.tag) {
      case 2:
        var c = i.type;
        r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), r = i.pendingProps;
        var d = Oi(i, ot.current);
        Fi(i, u), d = ac(null, i, c, r, d, u);
        var h = cc();
        return i.flags |= 1, typeof d == "object" && d !== null && typeof d.render == "function" && d.$$typeof === void 0 ? (i.tag = 1, i.memoizedState = null, i.updateQueue = null, Pt(c) ? (h = !0, fl(i)) : h = !1, i.memoizedState = d.state !== null && d.state !== void 0 ? d.state : null, Ja(i), d.updater = _l, i.stateNode = d, d._reactInternals = i, $a(i, c, r, u), i = yc(null, i, c, !0, h, u)) : (i.tag = 0, Re && h && ba(i), gt(null, i, d, u), i = i.child), i;
      case 16:
        c = i.elementType;
        e: {
          switch (r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), r = i.pendingProps, d = c._init, c = d(c._payload), i.type = c, d = i.tag = VS(c), r = Sn(c, r), d) {
            case 0:
              i = gc(null, i, c, r, u);
              break e;
            case 1:
              i = Uh(
                null,
                i,
                c,
                r,
                u
              );
              break e;
            case 11:
              i = zh(null, i, c, r, u);
              break e;
            case 14:
              i = Ih(null, i, c, Sn(c.type, r), u);
              break e;
          }
          throw Error(a(306, c, ""));
        }
        return i;
      case 0:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : Sn(c, d), gc(r, i, c, d, u);
      case 1:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : Sn(c, d), Uh(r, i, c, d, u);
      case 3:
        e: {
          if (Hh(i), r === null) throw Error(a(387));
          c = i.pendingProps, h = i.memoizedState, d = h.element, Yp(r, i), xl(i, c, null, u);
          var E = i.memoizedState;
          if (c = E.element, Bt && h.isDehydrated) if (h = {
            element: c,
            isDehydrated: !1,
            cache: E.cache,
            transitions: E.transitions
          }, i.updateQueue.baseState = h, i.memoizedState = h, i.flags & 256) {
            d = Error(a(423)), i = Bh(r, i, c, u, d);
            break e;
          } else if (c !== d) {
            d = Error(a(424)), i = Bh(r, i, c, u, d);
            break e;
          } else for (Bt && (Wt = K1(i.stateNode.containerInfo), Gt = i, Re = !0, wn = null, Vo = !1), u = lh(i, null, c, u), i.child = u; u; ) u.flags = u.flags & -3 | 4096, u = u.sibling;
          else {
            if (Bi(), c === d) {
              i = rr(r, i, u);
              break e;
            }
            gt(r, i, c, u);
          }
          i = i.child;
        }
        return i;
      case 5:
        return uh(i), r === null && nc(i), c = i.type, d = i.pendingProps, h = r !== null ? r.memoizedProps : null, E = d.children, it(c, d) ? E = null : h !== null && it(c, h) && (i.flags |= 32), Fh(r, i), gt(r, i, E, u), i.child;
      case 6:
        return r === null && nc(i), null;
      case 13:
        return Gh(r, i, u);
      case 4:
        return ic(i, i.stateNode.containerInfo), c = i.pendingProps, r === null ? i.child = Gi(i, null, c, u) : gt(r, i, c, u), i.child;
      case 11:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : Sn(c, d), zh(r, i, c, d, u);
      case 7:
        return gt(r, i, i.pendingProps, u), i.child;
      case 8:
        return gt(r, i, i.pendingProps.children, u), i.child;
      case 12:
        return gt(r, i, i.pendingProps.children, u), i.child;
      case 10:
        e: {
          if (c = i.type._context, d = i.pendingProps, h = i.memoizedProps, E = d.value, Xp(i, c, E), h !== null) if (jn(h.value, E)) {
            if (h.children === d.children && !kt.current) {
              i = rr(r, i, u);
              break e;
            }
          } else for (h = i.child, h !== null && (h.return = i); h !== null; ) {
            var P = h.dependencies;
            if (P !== null) {
              E = h.child;
              for (var z = P.firstContext; z !== null; ) {
                if (z.context === c) {
                  if (h.tag === 1) {
                    z = bn(-1, u & -u), z.tag = 2;
                    var G = h.updateQueue;
                    if (G !== null) {
                      G = G.shared;
                      var J = G.pending;
                      J === null ? z.next = z : (z.next = J.next, J.next = z), G.pending = z;
                    }
                  }
                  h.lanes |= u, z = h.alternate, z !== null && (z.lanes |= u), Za(h.return, u, i), P.lanes |= u;
                  break;
                }
                z = z.next;
              }
            } else if (h.tag === 10) E = h.type === i.type ? null : h.child;
            else if (h.tag === 18) {
              if (E = h.return, E === null) throw Error(a(341));
              E.lanes |= u, P = E.alternate, P !== null && (P.lanes |= u), Za(E, u, i), E = h.sibling;
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
        return d = i.type, c = i.pendingProps.children, Fi(i, u), d = en(d), c = c(d), i.flags |= 1, gt(r, i, c, u), i.child;
      case 14:
        return c = i.type, d = Sn(c, i.pendingProps), d = Sn(c.type, d), Ih(r, i, c, d, u);
      case 15:
        return Oh(r, i, i.type, i.pendingProps, u);
      case 17:
        return c = i.type, d = i.pendingProps, d = i.elementType === c ? d : Sn(c, d), r !== null && (r.alternate = null, i.alternate = null, i.flags |= 2), i.tag = 1, Pt(c) ? (r = !0, fl(i)) : r = !1, Fi(i, u), bp(i, c, d), $a(i, c, d, u), yc(null, i, c, !0, r, u);
      case 19:
        return Qh(r, i, u);
      case 22:
        return Dh(r, i, u);
    }
    throw Error(a(156, i.tag));
  };
  function gm(r, i) {
    return Ga(r, i);
  }
  function WS(r, i, u, c) {
    this.tag = r, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = i, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = c, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function ln(r, i, u, c) {
    return new WS(r, i, u, c);
  }
  function Uc(r) {
    return r = r.prototype, !(!r || !r.isReactComponent);
  }
  function VS(r) {
    if (typeof r == "function") return Uc(r) ? 1 : 0;
    if (r != null) {
      if (r = r.$$typeof, r === L) return 11;
      if (r === S) return 14;
    }
    return 2;
  }
  function Tr(r, i) {
    var u = r.alternate;
    return u === null ? (u = ln(r.tag, i, r.key, r.mode), u.elementType = r.elementType, u.type = r.type, u.stateNode = r.stateNode, u.alternate = r, r.alternate = u) : (u.pendingProps = i, u.type = r.type, u.flags = 0, u.subtreeFlags = 0, u.deletions = null), u.flags = r.flags & 14680064, u.childLanes = r.childLanes, u.lanes = r.lanes, u.child = r.child, u.memoizedProps = r.memoizedProps, u.memoizedState = r.memoizedState, u.updateQueue = r.updateQueue, i = r.dependencies, u.dependencies = i === null ? null : { lanes: i.lanes, firstContext: i.firstContext }, u.sibling = r.sibling, u.index = r.index, u.ref = r.ref, u;
  }
  function nu(r, i, u, c, d, h) {
    var E = 2;
    if (c = r, typeof r == "function") Uc(r) && (E = 1);
    else if (typeof r == "string") E = 5;
    else e: switch (r) {
      case g:
        return si(u.children, d, h, i);
      case y:
        E = 8, d |= 8;
        break;
      case v:
        return r = ln(12, u, i, d | 2), r.elementType = v, r.lanes = h, r;
      case A:
        return r = ln(13, u, i, d), r.elementType = A, r.lanes = h, r;
      case w:
        return r = ln(19, u, i, d), r.elementType = w, r.lanes = h, r;
      case R:
        return ru(u, d, h, i);
      default:
        if (typeof r == "object" && r !== null) switch (r.$$typeof) {
          case x:
            E = 10;
            break e;
          case k:
            E = 9;
            break e;
          case L:
            E = 11;
            break e;
          case S:
            E = 14;
            break e;
          case _:
            E = 16, c = null;
            break e;
        }
        throw Error(a(130, r == null ? r : typeof r, ""));
    }
    return i = ln(E, u, i, d), i.elementType = r, i.type = c, i.lanes = h, i;
  }
  function si(r, i, u, c) {
    return r = ln(7, r, c, i), r.lanes = u, r;
  }
  function ru(r, i, u, c) {
    return r = ln(22, r, c, i), r.elementType = R, r.lanes = u, r.stateNode = {}, r;
  }
  function Hc(r, i, u) {
    return r = ln(6, r, null, i), r.lanes = u, r;
  }
  function Bc(r, i, u) {
    return i = ln(4, r.children !== null ? r.children : [], r.key, i), i.lanes = u, i.stateNode = { containerInfo: r.containerInfo, pendingChildren: null, implementation: r.implementation }, i;
  }
  function KS(r, i, u, c, d) {
    this.tag = i, this.containerInfo = r, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = ja, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Ha(0), this.expirationTimes = Ha(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Ha(0), this.identifierPrefix = c, this.onRecoverableError = d, Bt && (this.mutableSourceEagerHydrationData = null);
  }
  function ym(r, i, u, c, d, h, E, P, z) {
    return r = new KS(r, i, u, P, z), i === 1 ? (i = 1, h === !0 && (i |= 8)) : i = 0, h = ln(3, null, null, i), r.current = h, h.stateNode = r, h.memoizedState = { element: c, isDehydrated: u, cache: null, transitions: null }, Ja(h), r;
  }
  function vm(r) {
    if (!r) return yr;
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
            if (Pt(i.type)) {
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
      if (Pt(u)) return Gp(r, u, i);
    }
    return i;
  }
  function Sm(r) {
    var i = r._reactInternals;
    if (i === void 0)
      throw typeof r.render == "function" ? Error(a(188)) : (r = Object.keys(r).join(","), Error(a(268, r)));
    return r = le(i), r === null ? null : r.stateNode;
  }
  function wm(r, i) {
    if (r = r.memoizedState, r !== null && r.dehydrated !== null) {
      var u = r.retryLane;
      r.retryLane = u !== 0 && u < i ? u : i;
    }
  }
  function Gc(r, i) {
    wm(r, i), (r = r.alternate) && wm(r, i);
  }
  function QS(r) {
    return r = le(r), r === null ? null : r.stateNode;
  }
  function XS() {
    return null;
  }
  return n.attemptContinuousHydration = function(r) {
    if (r.tag === 13) {
      var i = yt();
      sn(r, 134217728, i), Gc(r, 134217728);
    }
  }, n.attemptHydrationAtCurrentPriority = function(r) {
    if (r.tag === 13) {
      var i = yt(), u = _r(r);
      sn(r, u, i), Gc(r, u);
    }
  }, n.attemptSynchronousHydration = function(r) {
    switch (r.tag) {
      case 3:
        var i = r.stateNode;
        if (i.current.memoizedState.isDehydrated) {
          var u = Go(i.pendingLanes);
          u !== 0 && (Ba(i, u | 1), Rt(i, Ye()), !(oe & 6) && (Yi(), zn()));
        }
        break;
      case 13:
        var c = yt();
        um(function() {
          return sn(r, 1, c);
        }), Gc(r, 1);
    }
  }, n.batchedUpdates = function(r, i) {
    var u = oe;
    oe |= 1;
    try {
      return r(i);
    } finally {
      oe = u, oe === 0 && (Yi(), gl && zn());
    }
  }, n.createComponentSelector = function(r) {
    return { $$typeof: Gl, value: r };
  }, n.createContainer = function(r, i, u, c, d, h, E) {
    return ym(r, i, !1, null, u, c, d, h, E);
  }, n.createHasPseudoClassSelector = function(r) {
    return { $$typeof: Wl, value: r };
  }, n.createHydrationContainer = function(r, i, u, c, d, h, E, P, z) {
    return r = ym(u, c, !0, r, d, h, E, P, z), r.context = vm(null), u = r.current, c = yt(), d = _r(u), h = bn(c, d), h.callback = i ?? null, Sr(u, h), r.current.lanes = d, Wo(r, d, c), Rt(r, c), r;
  }, n.createPortal = function(r, i, u) {
    var c = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: m, key: c == null ? null : "" + c, children: r, containerInfo: i, implementation: u };
  }, n.createRoleSelector = function(r) {
    return { $$typeof: Vl, value: r };
  }, n.createTestNameSelector = function(r) {
    return { $$typeof: Kl, value: r };
  }, n.createTextSelector = function(r) {
    return { $$typeof: Ql, value: r };
  }, n.deferredUpdates = function(r) {
    var i = de, u = De.transition;
    try {
      return De.transition = null, de = 16, r();
    } finally {
      de = i, De.transition = u;
    }
  }, n.discreteUpdates = function(r, i, u, c, d) {
    var h = de, E = De.transition;
    try {
      return De.transition = null, de = 1, r(i, u, c, d);
    } finally {
      de = h, De.transition = E, oe === 0 && Yi();
    }
  }, n.findAllNodes = Rc, n.findBoundingRects = function(r, i) {
    if (!Fo) throw Error(a(363));
    i = Rc(r, i), r = [];
    for (var u = 0; u < i.length; u++) r.push(S1(i[u]));
    for (i = r.length - 1; 0 < i; i--) {
      u = r[i];
      for (var c = u.x, d = c + u.width, h = u.y, E = h + u.height, P = i - 1; 0 <= P; P--) if (i !== P) {
        var z = r[P], G = z.x, J = G + z.width, ne = z.y, ee = ne + z.height;
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
  }, n.findHostInstance = Sm, n.findHostInstanceWithNoPortals = function(r) {
    return r = Q(r), r = r !== null ? Et(r) : null, r === null ? null : r.stateNode;
  }, n.findHostInstanceWithWarning = function(r) {
    return Sm(r);
  }, n.flushControlled = function(r) {
    var i = oe;
    oe |= 1;
    var u = De.transition, c = de;
    try {
      De.transition = null, de = 1, r();
    } finally {
      de = c, De.transition = u, oe = i, oe === 0 && (Yi(), zn());
    }
  }, n.flushPassiveEffects = oi, n.flushSync = um, n.focusWithin = function(r, i) {
    if (!Fo) throw Error(a(363));
    for (r = kc(r), i = om(r, i), i = Array.from(i), r = 0; r < i.length; ) {
      var u = i[r++];
      if (!Uo(u)) {
        if (u.tag === 5 && _1(u.stateNode)) return !0;
        for (u = u.child; u !== null; ) i.push(u), u = u.sibling;
      }
    }
    return !1;
  }, n.getCurrentUpdatePriority = function() {
    return de;
  }, n.getFindAllNodesFailureDescription = function(r, i) {
    if (!Fo) throw Error(a(363));
    var u = 0, c = [];
    r = [kc(r), 0];
    for (var d = 0; d < r.length; ) {
      var h = r[d++], E = r[d++], P = i[E];
      if ((h.tag !== 5 || !Uo(h)) && (Pc(h, P) && (c.push(Cc(P)), E++, E > u && (u = E)), E < i.length)) for (h = h.child; h !== null; ) r.push(h, E), h = h.sibling;
    }
    if (u < i.length) {
      for (r = []; u < i.length; u++) r.push(Cc(i[u]));
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
    if (r = { bundleType: r.bundleType, version: r.version, rendererPackageName: r.rendererPackageName, rendererConfig: r.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: f.ReactCurrentDispatcher, findHostInstanceByFiber: QS, findFiberByHostInstance: r.findFiberByHostInstance || XS, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.0.0-fc46dba67-20220329" }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") r = !1;
    else {
      var i = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (i.isDisabled || !i.supportsFiber) r = !0;
      else {
        try {
          ml = i.inject(r), Nn = i;
        } catch {
        }
        r = !!i.checkDCE;
      }
    }
    return r;
  }, n.isAlreadyRendering = function() {
    return !1;
  }, n.observeVisibleRects = function(r, i, u, c) {
    if (!Fo) throw Error(a(363));
    r = Rc(r, i);
    var d = E1(r, u, c).disconnect;
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
    var d = i.current, h = yt(), E = _r(d);
    return u = vm(u), i.context === null ? i.context = u : i.pendingContext = u, i = bn(h, E), i.payload = { element: r }, c = c === void 0 ? null : c, c !== null && (i.callback = c), Sr(d, i), r = sn(d, E, h), r !== null && wl(r, d, E), E;
  }, n;
};
Iv.exports = p2;
var h2 = Iv.exports;
const m2 = /* @__PURE__ */ jw(h2), Lp = {}, g2 = (e) => void Object.assign(Lp, e);
function y2(e, t) {
  function n(g, {
    args: y = [],
    attach: v,
    ...x
  }, k) {
    let L = `${g[0].toUpperCase()}${g.slice(1)}`, A;
    if (g === "primitive") {
      if (x.object === void 0) throw new Error("R3F: Primitives without 'object' are invalid!");
      const w = x.object;
      A = eo(w, {
        type: g,
        root: k,
        attach: v,
        primitive: !0
      });
    } else {
      const w = Lp[L];
      if (!w)
        throw new Error(`R3F: ${L} is not part of the THREE namespace! Did you forget to extend? See: https://docs.pmnd.rs/react-three-fiber/api/objects#using-3rd-party-objects-declaratively`);
      if (!Array.isArray(y)) throw new Error("R3F: The args prop must be an array!");
      A = eo(new w(...y), {
        type: g,
        root: k,
        attach: v,
        // Save args in case we need to reconstruct later for HMR
        memoizedProps: {
          args: y
        }
      });
    }
    return A.__r3f.attach === void 0 && (A.isBufferGeometry ? A.__r3f.attach = "geometry" : A.isMaterial && (A.__r3f.attach = "material")), L !== "inject" && wf(A, x), A;
  }
  function o(g, y) {
    let v = !1;
    if (y) {
      var x, k;
      (x = y.__r3f) != null && x.attach ? Sf(g, y, y.__r3f.attach) : y.isObject3D && g.isObject3D && (g.add(y), v = !0), v || (k = g.__r3f) == null || k.objects.push(y), y.__r3f || eo(y, {}), y.__r3f.parent = g, Nd(y), to(y);
    }
  }
  function s(g, y, v) {
    let x = !1;
    if (y) {
      var k, L;
      if ((k = y.__r3f) != null && k.attach)
        Sf(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        y.parent = g, y.dispatchEvent({
          type: "added"
        }), g.dispatchEvent({
          type: "childadded",
          child: y
        });
        const A = g.children.filter((S) => S !== y), w = A.indexOf(v);
        g.children = [...A.slice(0, w), y, ...A.slice(w)], x = !0;
      }
      x || (L = g.__r3f) == null || L.objects.push(y), y.__r3f || eo(y, {}), y.__r3f.parent = g, Nd(y), to(y);
    }
  }
  function l(g, y, v = !1) {
    g && [...g].forEach((x) => a(y, x, v));
  }
  function a(g, y, v) {
    if (y) {
      var x, k, L;
      if (y.__r3f && (y.__r3f.parent = null), (x = g.__r3f) != null && x.objects && (g.__r3f.objects = g.__r3f.objects.filter((R) => R !== y)), (k = y.__r3f) != null && k.attach)
        Hg(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        var A;
        g.remove(y), (A = y.__r3f) != null && A.root && k2(Fu(y), y);
      }
      const S = (L = y.__r3f) == null ? void 0 : L.primitive, _ = !S && (v === void 0 ? y.dispose !== null : v);
      if (!S) {
        var w;
        l((w = y.__r3f) == null ? void 0 : w.objects, y, _), l(y.children, y, _);
      }
      if (delete y.__r3f, _ && y.dispose && y.type !== "Scene") {
        const R = () => {
          try {
            y.dispose();
          } catch {
          }
        };
        typeof IS_REACT_ACT_ENVIRONMENT > "u" ? Ad.unstable_scheduleCallback(Ad.unstable_IdlePriority, R) : R();
      }
      to(g);
    }
  }
  function f(g, y, v, x) {
    var k;
    const L = (k = g.__r3f) == null ? void 0 : k.parent;
    if (!L) return;
    const A = n(y, v, g.__r3f.root);
    if (g.children) {
      for (const w of g.children)
        w.__r3f && o(A, w);
      g.children = g.children.filter((w) => !w.__r3f);
    }
    g.__r3f.objects.forEach((w) => o(A, w)), g.__r3f.objects = [], g.__r3f.autoRemovedBeforeAppend || a(L, g), A.parent && (A.__r3f.autoRemovedBeforeAppend = !0), o(L, A), A.raycast && A.__r3f.eventCount && Fu(A).getState().internal.interaction.push(A), [x, x.alternate].forEach((w) => {
      w !== null && (w.stateNode = A, w.ref && (typeof w.ref == "function" ? w.ref(A) : w.ref.current = A));
    });
  }
  const p = () => {
  };
  return {
    reconciler: m2({
      createInstance: n,
      removeChild: a,
      appendChild: o,
      appendInitialChild: o,
      insertBefore: s,
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
        const x = g.getState().scene;
        x.__r3f && s(x, y, v);
      },
      getRootHostContext: () => null,
      getChildHostContext: (g) => g,
      finalizeInitialChildren(g) {
        var y;
        return !!((y = g == null ? void 0 : g.__r3f) != null ? y : {}).handlers;
      },
      prepareUpdate(g, y, v, x) {
        var k;
        if (((k = g == null ? void 0 : g.__r3f) != null ? k : {}).primitive && x.object && x.object !== g)
          return [!0];
        {
          const {
            args: A = [],
            children: w,
            ...S
          } = x, {
            args: _ = [],
            children: R,
            ...I
          } = v;
          if (!Array.isArray(A)) throw new Error("R3F: the args prop must be an array!");
          if (A.some((D, B) => D !== _[B])) return [!0];
          const O = Vv(g, S, I, !0);
          return O.changes.length ? [!1, O] : null;
        }
      },
      commitUpdate(g, [y, v], x, k, L, A) {
        y ? f(g, x, L, A) : wf(g, v);
      },
      commitMount(g, y, v, x) {
        var k;
        const L = (k = g.__r3f) != null ? k : {};
        g.raycast && L.handlers && L.eventCount && Fu(g).getState().internal.interaction.push(g);
      },
      getPublicInstance: (g) => g,
      prepareForCommit: () => null,
      preparePortalMount: (g) => eo(g.getState().scene),
      resetAfterCommit: () => {
      },
      shouldSetTextContent: () => !1,
      clearContainer: () => !1,
      hideInstance(g) {
        var y;
        const {
          attach: v,
          parent: x
        } = (y = g.__r3f) != null ? y : {};
        v && x && Hg(x, g, v), g.isObject3D && (g.visible = !1), to(g);
      },
      unhideInstance(g, y) {
        var v;
        const {
          attach: x,
          parent: k
        } = (v = g.__r3f) != null ? v : {};
        x && k && Sf(k, g, x), (g.isObject3D && y.visible == null || y.visible) && (g.visible = !0), to(g);
      },
      createTextInstance: p,
      hideTextInstance: p,
      unhideTextInstance: p,
      // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r916356874
      // @ts-expect-error
      getCurrentEventPriority: () => t ? t() : go.DefaultEventPriority,
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
    applyProps: wf
  };
}
var Og, Dg;
const vf = (e) => "colorSpace" in e || "outputColorSpace" in e, Fv = () => {
  var e;
  return (e = Lp.ColorManagement) != null ? e : null;
}, Uv = (e) => e && e.isOrthographicCamera, v2 = (e) => e && e.hasOwnProperty("current"), ll = typeof window < "u" && ((Og = window.document) != null && Og.createElement || ((Dg = window.navigator) == null ? void 0 : Dg.product) === "ReactNative") ? W.useLayoutEffect : W.useEffect;
function Hv(e) {
  const t = W.useRef(e);
  return ll(() => void (t.current = e), [e]), t;
}
function S2({
  set: e
}) {
  return ll(() => (e(new Promise(() => null)), () => e(!1)), [e]), null;
}
class Bv extends W.Component {
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
Bv.getDerivedStateFromError = () => ({
  error: !0
});
const Gv = "__default", Fg = /* @__PURE__ */ new Map(), w2 = (e) => e && !!e.memoized && !!e.changes;
function Wv(e) {
  var t;
  const n = typeof window < "u" ? (t = window.devicePixelRatio) != null ? t : 2 : 1;
  return Array.isArray(e) ? Math.min(Math.max(e[0], n), e[1]) : e;
}
const ms = (e) => {
  var t;
  return (t = e.__r3f) == null ? void 0 : t.root.getState();
};
function Fu(e) {
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
    strict: s = !0
  } = {}) {
    if (typeof e != typeof t || !!e != !!t) return !1;
    if (Ee.str(e) || Ee.num(e) || Ee.boo(e)) return e === t;
    const l = Ee.obj(e);
    if (l && o === "reference") return e === t;
    const a = Ee.arr(e);
    if (a && n === "reference") return e === t;
    if ((a || l) && e === t) return !0;
    let f;
    for (f in e) if (!(f in t)) return !1;
    if (l && n === "shallow" && o === "shallow") {
      for (f in s ? t : e) if (!Ee.equ(e[f], t[f], {
        strict: s,
        objects: "reference"
      })) return !1;
    } else
      for (f in s ? t : e) if (e[f] !== t[f]) return !1;
    if (Ee.und(f)) {
      if (a && e.length === 0 && t.length === 0 || l && Object.keys(e).length === 0 && Object.keys(t).length === 0) return !0;
      if (e !== t) return !1;
    }
    return !0;
  }
};
function x2(e) {
  const t = {
    nodes: {},
    materials: {}
  };
  return e && e.traverse((n) => {
    n.name && (t.nodes[n.name] = n), n.material && !t.materials[n.material.name] && (t.materials[n.material.name] = n.material);
  }), t;
}
function _2(e) {
  e.dispose && e.type !== "Scene" && e.dispose();
  for (const t in e)
    t.dispose == null || t.dispose(), delete e[t];
}
function eo(e, t) {
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
function Md(e, t) {
  let n = e;
  if (t.includes("-")) {
    const o = t.split("-"), s = o.pop();
    return n = o.reduce((l, a) => l[a], e), {
      target: n,
      key: s
    };
  } else return {
    target: n,
    key: t
  };
}
const Ug = /-\d+$/;
function Sf(e, t, n) {
  if (Ee.str(n)) {
    if (Ug.test(n)) {
      const l = n.replace(Ug, ""), {
        target: a,
        key: f
      } = Md(e, l);
      Array.isArray(a[f]) || (a[f] = []);
    }
    const {
      target: o,
      key: s
    } = Md(e, n);
    t.__r3f.previousAttach = o[s], o[s] = t;
  } else t.__r3f.previousAttach = n(e, t);
}
function Hg(e, t, n) {
  var o, s;
  if (Ee.str(n)) {
    const {
      target: l,
      key: a
    } = Md(e, n), f = t.__r3f.previousAttach;
    f === void 0 ? delete l[a] : l[a] = f;
  } else (o = t.__r3f) == null || o.previousAttach == null || o.previousAttach(e, t);
  (s = t.__r3f) == null || delete s.previousAttach;
}
function Vv(e, {
  children: t,
  key: n,
  ref: o,
  ...s
}, {
  children: l,
  key: a,
  ref: f,
  ...p
} = {}, m = !1) {
  const g = e.__r3f, y = Object.entries(s), v = [];
  if (m) {
    const k = Object.keys(p);
    for (let L = 0; L < k.length; L++)
      s.hasOwnProperty(k[L]) || y.unshift([k[L], Gv + "remove"]);
  }
  y.forEach(([k, L]) => {
    var A;
    if ((A = e.__r3f) != null && A.primitive && k === "object" || Ee.equ(L, p[k])) return;
    if (/^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/.test(k)) return v.push([k, L, !0, []]);
    let w = [];
    k.includes("-") && (w = k.split("-")), v.push([k, L, !1, w]);
    for (const S in s) {
      const _ = s[S];
      S.startsWith(`${k}-`) && v.push([S, _, !1, S.split("-")]);
    }
  });
  const x = {
    ...s
  };
  return g != null && g.memoizedProps && g != null && g.memoizedProps.args && (x.args = g.memoizedProps.args), g != null && g.memoizedProps && g != null && g.memoizedProps.attach && (x.attach = g.memoizedProps.attach), {
    memoized: x,
    changes: v
  };
}
function wf(e, t) {
  var n;
  const o = e.__r3f, s = o == null ? void 0 : o.root, l = s == null || s.getState == null ? void 0 : s.getState(), {
    memoized: a,
    changes: f
  } = w2(t) ? t : Vv(e, t), p = o == null ? void 0 : o.eventCount;
  e.__r3f && (e.__r3f.memoizedProps = a);
  for (let v = 0; v < f.length; v++) {
    let [x, k, L, A] = f[v];
    if (vf(e)) {
      const R = "srgb", I = "srgb-linear";
      x === "encoding" ? (x = "colorSpace", k = k === 3001 ? R : I) : x === "outputEncoding" && (x = "outputColorSpace", k = k === 3001 ? R : I);
    }
    let w = e, S = w[x];
    if (A.length && (S = A.reduce((_, R) => _[R], e), !(S && S.set))) {
      const [_, ...R] = A.reverse();
      w = R.reverse().reduce((I, O) => I[O], e), x = _;
    }
    if (k === Gv + "remove")
      if (w.constructor) {
        let _ = Fg.get(w.constructor);
        _ || (_ = new w.constructor(), Fg.set(w.constructor, _)), k = _[x];
      } else
        k = 0;
    if (L && o)
      k ? o.handlers[x] = k : delete o.handlers[x], o.eventCount = Object.keys(o.handlers).length;
    else if (S && S.set && (S.copy || S instanceof se.Layers)) {
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
        const _ = (m = S) == null ? void 0 : m.isColor;
        !_ && S.setScalar ? S.setScalar(k) : S instanceof se.Layers && k instanceof se.Layers ? S.mask = k.mask : S.set(k), !Fv() && l && !l.linear && _ && S.convertSRGBToLinear();
      }
    } else {
      var g;
      if (w[x] = k, (g = w[x]) != null && g.isTexture && // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
      w[x].format === se.RGBAFormat && w[x].type === se.UnsignedByteType && l) {
        const _ = w[x];
        vf(_) && vf(l.gl) ? _.colorSpace = l.gl.outputColorSpace : _.encoding = l.gl.outputEncoding;
      }
    }
    to(e);
  }
  if (o && o.parent && e.raycast && p !== o.eventCount) {
    const v = Fu(e).getState().internal, x = v.interaction.indexOf(e);
    x > -1 && v.interaction.splice(x, 1), o.eventCount && v.interaction.push(e);
  }
  return !(f.length === 1 && f[0][0] === "onUpdate") && f.length && (n = e.__r3f) != null && n.parent && Nd(e), e;
}
function to(e) {
  var t, n;
  const o = (t = e.__r3f) == null || (n = t.root) == null || n.getState == null ? void 0 : n.getState();
  o && o.internal.frames === 0 && o.invalidate();
}
function Nd(e) {
  e.onUpdate == null || e.onUpdate(e);
}
function E2(e, t) {
  e.manual || (Uv(e) ? (e.left = t.width / -2, e.right = t.width / 2, e.top = t.height / 2, e.bottom = t.height / -2) : e.aspect = t.width / t.height, e.updateProjectionMatrix(), e.updateMatrixWorld());
}
function xu(e) {
  return (e.eventObject || e.object).uuid + "/" + e.index + e.instanceId;
}
function T2() {
  var e;
  const t = typeof self < "u" && self || typeof window < "u" && window;
  if (!t) return go.DefaultEventPriority;
  switch ((e = t.event) == null ? void 0 : e.type) {
    case "click":
    case "contextmenu":
    case "dblclick":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
      return go.DiscreteEventPriority;
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "pointerenter":
    case "pointerleave":
    case "wheel":
      return go.ContinuousEventPriority;
    default:
      return go.DefaultEventPriority;
  }
}
function Kv(e, t, n, o) {
  const s = n.get(t);
  s && (n.delete(t), n.size === 0 && (e.delete(o), s.target.releasePointerCapture(o)));
}
function k2(e, t) {
  const {
    internal: n
  } = e.getState();
  n.interaction = n.interaction.filter((o) => o !== t), n.initialHits = n.initialHits.filter((o) => o !== t), n.hovered.forEach((o, s) => {
    (o.eventObject === t || o.object === t) && n.hovered.delete(s);
  }), n.capturedMap.forEach((o, s) => {
    Kv(n.capturedMap, t, o, s);
  });
}
function P2(e) {
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
    const g = e.getState(), y = /* @__PURE__ */ new Set(), v = [], x = m ? m(g.internal.interaction) : g.internal.interaction;
    for (let w = 0; w < x.length; w++) {
      const S = ms(x[w]);
      S && (S.raycaster.camera = void 0);
    }
    g.previousRoot || g.events.compute == null || g.events.compute(p, g);
    function k(w) {
      const S = ms(w);
      if (!S || !S.events.enabled || S.raycaster.camera === null) return [];
      if (S.raycaster.camera === void 0) {
        var _;
        S.events.compute == null || S.events.compute(p, S, (_ = S.previousRoot) == null ? void 0 : _.getState()), S.raycaster.camera === void 0 && (S.raycaster.camera = null);
      }
      return S.raycaster.camera ? S.raycaster.intersectObject(w, !0) : [];
    }
    let L = x.flatMap(k).sort((w, S) => {
      const _ = ms(w.object), R = ms(S.object);
      return !_ || !R ? w.distance - S.distance : R.events.priority - _.events.priority || w.distance - S.distance;
    }).filter((w) => {
      const S = xu(w);
      return y.has(S) ? !1 : (y.add(S), !0);
    });
    g.events.filter && (L = g.events.filter(L, g));
    for (const w of L) {
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
        y.has(xu(w.intersection)) || v.push(w.intersection);
    return v;
  }
  function s(p, m, g, y) {
    const v = e.getState();
    if (p.length) {
      const x = {
        stopped: !1
      };
      for (const k of p) {
        const L = ms(k.object) || v, {
          raycaster: A,
          pointer: w,
          camera: S,
          internal: _
        } = L, R = new se.Vector3(w.x, w.y, 0).unproject(S), I = (V) => {
          var Q, le;
          return (Q = (le = _.capturedMap.get(V)) == null ? void 0 : le.has(k.eventObject)) != null ? Q : !1;
        }, O = (V) => {
          const Q = {
            intersection: k,
            target: m.target
          };
          _.capturedMap.has(V) ? _.capturedMap.get(V).set(k.eventObject, Q) : _.capturedMap.set(V, /* @__PURE__ */ new Map([[k.eventObject, Q]])), m.target.setPointerCapture(V);
        }, D = (V) => {
          const Q = _.capturedMap.get(V);
          Q && Kv(_.capturedMap, k.eventObject, Q, V);
        };
        let B = {};
        for (let V in m) {
          let Q = m[V];
          typeof Q != "function" && (B[V] = Q);
        }
        let q = {
          ...k,
          ...B,
          pointer: w,
          intersections: p,
          stopped: x.stopped,
          delta: g,
          unprojectedPoint: R,
          ray: A.ray,
          camera: S,
          // Hijack stopPropagation, which just sets a flag
          stopPropagation() {
            const V = "pointerId" in m && _.capturedMap.get(m.pointerId);
            if (
              // ...if this pointer hasn't been captured
              (!V || // ... or if the hit object is capturing the pointer
              V.has(k.eventObject)) && (q.stopped = x.stopped = !0, _.hovered.size && Array.from(_.hovered.values()).find((Q) => Q.eventObject === k.eventObject))
            ) {
              const Q = p.slice(0, p.indexOf(k));
              l([...Q, k]);
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
        if (y(q), x.stopped === !0) break;
      }
    }
    return p;
  }
  function l(p) {
    const {
      internal: m
    } = e.getState();
    for (const g of m.hovered.values())
      if (!p.length || !p.find((y) => y.object === g.object && y.index === g.index && y.instanceId === g.instanceId)) {
        const v = g.eventObject.__r3f, x = v == null ? void 0 : v.handlers;
        if (m.hovered.delete(xu(g)), v != null && v.eventCount) {
          const k = {
            ...g,
            intersections: p
          };
          x.onPointerOut == null || x.onPointerOut(k), x.onPointerLeave == null || x.onPointerLeave(k);
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
        return () => l([]);
      case "onLostPointerCapture":
        return (m) => {
          const {
            internal: g
          } = e.getState();
          "pointerId" in m && g.capturedMap.has(m.pointerId) && requestAnimationFrame(() => {
            g.capturedMap.has(m.pointerId) && (g.capturedMap.delete(m.pointerId), l([]));
          });
        };
    }
    return function(g) {
      const {
        onPointerMissed: y,
        internal: v
      } = e.getState();
      v.lastEvent.current = g;
      const x = p === "onPointerMove", k = p === "onClick" || p === "onContextMenu" || p === "onDoubleClick", A = o(g, x ? n : void 0), w = k ? t(g) : 0;
      p === "onPointerDown" && (v.initialClick = [g.offsetX, g.offsetY], v.initialHits = A.map((_) => _.eventObject)), k && !A.length && w <= 2 && (a(g, v.interaction), y && y(g)), x && l(A);
      function S(_) {
        const R = _.eventObject, I = R.__r3f, O = I == null ? void 0 : I.handlers;
        if (I != null && I.eventCount)
          if (x) {
            if (O.onPointerOver || O.onPointerEnter || O.onPointerOut || O.onPointerLeave) {
              const D = xu(_), B = v.hovered.get(D);
              B ? B.stopped && _.stopPropagation() : (v.hovered.set(D, _), O.onPointerOver == null || O.onPointerOver(_), O.onPointerEnter == null || O.onPointerEnter(_));
            }
            O.onPointerMove == null || O.onPointerMove(_);
          } else {
            const D = O[p];
            D ? (!k || v.initialHits.includes(R)) && (a(g, v.interaction.filter((B) => !v.initialHits.includes(B))), D(_)) : k && v.initialHits.includes(R) && a(g, v.interaction.filter((B) => !v.initialHits.includes(B)));
          }
      }
      s(A, g, w, S);
    };
  }
  return {
    handlePointer: f
  };
}
const Qv = (e) => !!(e != null && e.render), Xv = /* @__PURE__ */ W.createContext(null), C2 = (e, t) => {
  const n = u2((f, p) => {
    const m = new se.Vector3(), g = new se.Vector3(), y = new se.Vector3();
    function v(w = p().camera, S = g, _ = p().size) {
      const {
        width: R,
        height: I,
        top: O,
        left: D
      } = _, B = R / I;
      S.isVector3 ? y.copy(S) : y.set(...S);
      const q = w.getWorldPosition(m).distanceTo(y);
      if (Uv(w))
        return {
          width: R / w.zoom,
          height: I / w.zoom,
          top: O,
          left: D,
          factor: 1,
          distance: q,
          aspect: B
        };
      {
        const V = w.fov * Math.PI / 180, Q = 2 * Math.tan(V / 2) * q, le = Q * (R / I);
        return {
          width: le,
          height: Q,
          top: O,
          left: D,
          factor: R / le,
          distance: q,
          aspect: B
        };
      }
    }
    let x;
    const k = (w) => f((S) => ({
      performance: {
        ...S.performance,
        current: w
      }
    })), L = new se.Vector2();
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
      clock: new se.Clock(),
      pointer: L,
      mouse: L,
      frameloop: "always",
      onPointerMissed: void 0,
      performance: {
        current: 1,
        min: 0.5,
        max: 1,
        debounce: 200,
        regress: () => {
          const w = p();
          x && clearTimeout(x), w.performance.current !== w.performance.min && k(w.performance.min), x = setTimeout(() => k(p().performance.max), w.performance.debounce);
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
      setSize: (w, S, _, R, I) => {
        const O = p().camera, D = {
          width: w,
          height: S,
          top: R || 0,
          left: I || 0,
          updateStyle: _
        };
        f((B) => ({
          size: D,
          viewport: {
            ...B.viewport,
            ...v(O, g, D)
          }
        }));
      },
      setDpr: (w) => f((S) => {
        const _ = Wv(w);
        return {
          viewport: {
            ...S.viewport,
            dpr: _,
            initialDpr: S.viewport.initialDpr || _
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
        lastEvent: /* @__PURE__ */ W.createRef(),
        interaction: [],
        hovered: /* @__PURE__ */ new Map(),
        subscribers: [],
        initialClick: [0, 0],
        initialHits: [],
        capturedMap: /* @__PURE__ */ new Map(),
        subscribe: (w, S, _) => {
          const R = p().internal;
          return R.priority = R.priority + (S > 0 ? 1 : 0), R.subscribers.push({
            ref: w,
            priority: S,
            store: _
          }), R.subscribers = R.subscribers.sort((I, O) => I.priority - O.priority), () => {
            const I = p().internal;
            I != null && I.subscribers && (I.priority = I.priority - (S > 0 ? 1 : 0), I.subscribers = I.subscribers.filter((O) => O.ref !== w));
          };
        }
      }
    };
  }), o = n.getState();
  let s = o.size, l = o.viewport.dpr, a = o.camera;
  return n.subscribe(() => {
    const {
      camera: f,
      size: p,
      viewport: m,
      gl: g,
      set: y
    } = n.getState();
    if (p.width !== s.width || p.height !== s.height || m.dpr !== l) {
      var v;
      s = p, l = m.dpr, E2(f, p), g.setPixelRatio(m.dpr);
      const x = (v = p.updateStyle) != null ? v : typeof HTMLCanvasElement < "u" && g.domElement instanceof HTMLCanvasElement;
      g.setSize(p.width, p.height, x);
    }
    f !== a && (a = f, y((x) => ({
      viewport: {
        ...x.viewport,
        ...x.viewport.getCurrentViewport(f)
      }
    })));
  }), n.subscribe((f) => e(f)), n;
};
let _u, R2 = /* @__PURE__ */ new Set(), L2 = /* @__PURE__ */ new Set(), A2 = /* @__PURE__ */ new Set();
function xf(e, t) {
  if (e.size)
    for (const {
      callback: n
    } of e.values())
      n(t);
}
function gs(e, t) {
  switch (e) {
    case "before":
      return xf(R2, t);
    case "after":
      return xf(L2, t);
    case "tail":
      return xf(A2, t);
  }
}
let _f, Ef;
function Tf(e, t, n) {
  let o = t.clock.getDelta();
  for (t.frameloop === "never" && typeof e == "number" && (o = e - t.clock.elapsedTime, t.clock.oldTime = t.clock.elapsedTime, t.clock.elapsedTime = e), _f = t.internal.subscribers, _u = 0; _u < _f.length; _u++)
    Ef = _f[_u], Ef.ref.current(Ef.store.getState(), o, n);
  return !t.internal.priority && t.gl.render && t.gl.render(t.scene, t.camera), t.internal.frames = Math.max(0, t.internal.frames - 1), t.frameloop === "always" ? 1 : t.internal.frames;
}
function M2(e) {
  let t = !1, n = !1, o, s, l;
  function a(m) {
    s = requestAnimationFrame(a), t = !0, o = 0, gs("before", m), n = !0;
    for (const y of e.values()) {
      var g;
      l = y.store.getState(), l.internal.active && (l.frameloop === "always" || l.internal.frames > 0) && !((g = l.gl.xr) != null && g.isPresenting) && (o += Tf(m, l));
    }
    if (n = !1, gs("after", m), o === 0)
      return gs("tail", m), t = !1, cancelAnimationFrame(s);
  }
  function f(m, g = 1) {
    var y;
    if (!m) return e.forEach((v) => f(v.store.getState(), g));
    (y = m.gl.xr) != null && y.isPresenting || !m.internal.active || m.frameloop === "never" || (g > 1 ? m.internal.frames = Math.min(60, m.internal.frames + g) : n ? m.internal.frames = 2 : m.internal.frames = 1, t || (t = !0, requestAnimationFrame(a)));
  }
  function p(m, g = !0, y, v) {
    if (g && gs("before", m), y) Tf(m, y, v);
    else for (const x of e.values()) Tf(m, x.store.getState());
    g && gs("after", m);
  }
  return {
    loop: a,
    invalidate: f,
    advance: p
  };
}
function Yv() {
  const e = W.useContext(Xv);
  if (!e) throw new Error("R3F: Hooks can only be used within the Canvas component!");
  return e;
}
function N2(e = (n) => n, t) {
  return Yv()(e, t);
}
function qn(e, t = 0) {
  const n = Yv(), o = n.getState().internal.subscribe, s = Hv(e);
  return ll(() => o(s, t, n), [t, o, n]), null;
}
const Bg = /* @__PURE__ */ new WeakMap();
function Zv(e, t) {
  return function(n, ...o) {
    let s = Bg.get(n);
    return s || (s = new n(), Bg.set(n, s)), e && e(s), Promise.all(o.map((l) => new Promise((a, f) => s.load(l, (p) => {
      p.scene && Object.assign(p, x2(p.scene)), a(p);
    }, t, (p) => f(new Error(`Could not load ${l}: ${p == null ? void 0 : p.message}`))))));
  };
}
function Ap(e, t, n, o) {
  const s = Array.isArray(t) ? t : [t], l = c2(Zv(n, o), [e, ...s], {
    equal: Ee.equ
  });
  return Array.isArray(t) ? l : l[0];
}
Ap.preload = function(e, t, n) {
  const o = Array.isArray(t) ? t : [t];
  return f2(Zv(n), [e, ...o]);
};
Ap.clear = function(e, t) {
  const n = Array.isArray(t) ? t : [t];
  return d2([e, ...n]);
};
const jo = /* @__PURE__ */ new Map(), {
  invalidate: Gg,
  advance: Wg
} = M2(jo), {
  reconciler: ma,
  applyProps: Ji
} = y2(jo, T2), qi = {
  objects: "shallow",
  strict: !1
}, j2 = (e, t) => {
  const n = typeof e == "function" ? e(t) : e;
  return Qv(n) ? n : new se.WebGLRenderer({
    powerPreference: "high-performance",
    canvas: t,
    antialias: !0,
    alpha: !0,
    ...e
  });
};
function z2(e, t) {
  const n = typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
  if (t) {
    const {
      width: o,
      height: s,
      top: l,
      left: a,
      updateStyle: f = n
    } = t;
    return {
      width: o,
      height: s,
      top: l,
      left: a,
      updateStyle: f
    };
  } else if (typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement && e.parentElement) {
    const {
      width: o,
      height: s,
      top: l,
      left: a
    } = e.parentElement.getBoundingClientRect();
    return {
      width: o,
      height: s,
      top: l,
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
function I2(e) {
  const t = jo.get(e), n = t == null ? void 0 : t.fiber, o = t == null ? void 0 : t.store;
  t && console.warn("R3F.createRoot should only be called once!");
  const s = typeof reportError == "function" ? (
    // In modern browsers, reportError will dispatch an error event,
    // emulating an uncaught JavaScript error.
    reportError
  ) : (
    // In older browsers and test environments, fallback to console.error.
    console.error
  ), l = o || C2(Gg, Wg), a = n || ma.createContainer(l, go.ConcurrentRoot, null, !1, null, "", s, null);
  t || jo.set(e, {
    fiber: a,
    store: l
  });
  let f, p = !1, m;
  return {
    configure(g = {}) {
      let {
        gl: y,
        size: v,
        scene: x,
        events: k,
        onCreated: L,
        shadows: A = !1,
        linear: w = !1,
        flat: S = !1,
        legacy: _ = !1,
        orthographic: R = !1,
        frameloop: I = "always",
        dpr: O = [1, 2],
        performance: D,
        raycaster: B,
        camera: q,
        onPointerMissed: V
      } = g, Q = l.getState(), le = Q.gl;
      Q.gl || Q.set({
        gl: le = j2(y, e)
      });
      let Se = Q.raycaster;
      Se || Q.set({
        raycaster: Se = new se.Raycaster()
      });
      const {
        params: Et,
        ...Ht
      } = B || {};
      if (Ee.equ(Ht, Se, qi) || Ji(Se, {
        ...Ht
      }), Ee.equ(Et, Se.params, qi) || Ji(Se, {
        params: {
          ...Se.params,
          ...Et
        }
      }), !Q.camera || Q.camera === m && !Ee.equ(m, q, qi)) {
        m = q;
        const F = q instanceof se.Camera, Y = F ? q : R ? new se.OrthographicCamera(0, 0, 0, 0, 0.1, 1e3) : new se.PerspectiveCamera(75, 0, 0.1, 1e3);
        F || (Y.position.z = 5, q && (Ji(Y, q), ("aspect" in q || "left" in q || "right" in q || "bottom" in q || "top" in q) && (Y.manual = !0, Y.updateProjectionMatrix())), !Q.camera && !(q != null && q.rotation) && Y.lookAt(0, 0, 0)), Q.set({
          camera: Y
        }), Se.camera = Y;
      }
      if (!Q.scene) {
        let F;
        x != null && x.isScene ? F = x : (F = new se.Scene(), x && Ji(F, x)), Q.set({
          scene: eo(F)
        });
      }
      if (!Q.xr) {
        var be;
        const F = (ce, ze) => {
          const it = l.getState();
          it.frameloop !== "never" && Wg(ce, !0, it, ze);
        }, Y = () => {
          const ce = l.getState();
          ce.gl.xr.enabled = ce.gl.xr.isPresenting, ce.gl.xr.setAnimationLoop(ce.gl.xr.isPresenting ? F : null), ce.gl.xr.isPresenting || Gg(ce);
        }, te = {
          connect() {
            const ce = l.getState().gl;
            ce.xr.addEventListener("sessionstart", Y), ce.xr.addEventListener("sessionend", Y);
          },
          disconnect() {
            const ce = l.getState().gl;
            ce.xr.removeEventListener("sessionstart", Y), ce.xr.removeEventListener("sessionend", Y);
          }
        };
        typeof ((be = le.xr) == null ? void 0 : be.addEventListener) == "function" && te.connect(), Q.set({
          xr: te
        });
      }
      if (le.shadowMap) {
        const F = le.shadowMap.enabled, Y = le.shadowMap.type;
        if (le.shadowMap.enabled = !!A, Ee.boo(A))
          le.shadowMap.type = se.PCFSoftShadowMap;
        else if (Ee.str(A)) {
          var Tt;
          const te = {
            basic: se.BasicShadowMap,
            percentage: se.PCFShadowMap,
            soft: se.PCFSoftShadowMap,
            variance: se.VSMShadowMap
          };
          le.shadowMap.type = (Tt = te[A]) != null ? Tt : se.PCFSoftShadowMap;
        } else Ee.obj(A) && Object.assign(le.shadowMap, A);
        (F !== le.shadowMap.enabled || Y !== le.shadowMap.type) && (le.shadowMap.needsUpdate = !0);
      }
      const N = Fv();
      N && ("enabled" in N ? N.enabled = !_ : "legacyMode" in N && (N.legacyMode = _)), p || Ji(le, {
        outputEncoding: w ? 3e3 : 3001,
        toneMapping: S ? se.NoToneMapping : se.ACESFilmicToneMapping
      }), Q.legacy !== _ && Q.set(() => ({
        legacy: _
      })), Q.linear !== w && Q.set(() => ({
        linear: w
      })), Q.flat !== S && Q.set(() => ({
        flat: S
      })), y && !Ee.fun(y) && !Qv(y) && !Ee.equ(y, le, qi) && Ji(le, y), k && !Q.events.handlers && Q.set({
        events: k(l)
      });
      const U = z2(e, v);
      return Ee.equ(U, Q.size, qi) || Q.setSize(U.width, U.height, U.updateStyle, U.top, U.left), O && Q.viewport.dpr !== Wv(O) && Q.setDpr(O), Q.frameloop !== I && Q.setFrameloop(I), Q.onPointerMissed || Q.set({
        onPointerMissed: V
      }), D && !Ee.equ(D, Q.performance, qi) && Q.set((F) => ({
        performance: {
          ...F.performance,
          ...D
        }
      })), f = L, p = !0, this;
    },
    render(g) {
      return p || this.configure(), ma.updateContainer(/* @__PURE__ */ T.jsx(O2, {
        store: l,
        children: g,
        onCreated: f,
        rootElement: e
      }), a, null, () => {
      }), l;
    },
    unmount() {
      Jv(e);
    }
  };
}
function O2({
  store: e,
  children: t,
  onCreated: n,
  rootElement: o
}) {
  return ll(() => {
    const s = e.getState();
    s.set((l) => ({
      internal: {
        ...l.internal,
        active: !0
      }
    })), n && n(s), e.getState().events.connected || s.events.connect == null || s.events.connect(o);
  }, []), /* @__PURE__ */ T.jsx(Xv.Provider, {
    value: e,
    children: t
  });
}
function Jv(e, t) {
  const n = jo.get(e), o = n == null ? void 0 : n.fiber;
  if (o) {
    const s = n == null ? void 0 : n.store.getState();
    s && (s.internal.active = !1), ma.updateContainer(null, o, null, () => {
      s && setTimeout(() => {
        try {
          var l, a, f, p;
          s.events.disconnect == null || s.events.disconnect(), (l = s.gl) == null || (a = l.renderLists) == null || a.dispose == null || a.dispose(), (f = s.gl) == null || f.forceContextLoss == null || f.forceContextLoss(), (p = s.gl) != null && p.xr && s.xr.disconnect(), _2(s), jo.delete(e);
        } catch {
        }
      }, 500);
    });
  }
}
ma.injectIntoDevTools({
  bundleType: 0,
  rendererPackageName: "@react-three/fiber",
  version: W.version
});
const kf = {
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
function D2(e) {
  const {
    handlePointer: t
  } = P2(e);
  return {
    priority: 1,
    enabled: !0,
    compute(n, o, s) {
      o.pointer.set(n.offsetX / o.size.width * 2 - 1, -(n.offsetY / o.size.height) * 2 + 1), o.raycaster.setFromCamera(o.pointer, o.camera);
    },
    connected: void 0,
    handlers: Object.keys(kf).reduce((n, o) => ({
      ...n,
      [o]: t(o)
    }), {}),
    update: () => {
      var n;
      const {
        events: o,
        internal: s
      } = e.getState();
      (n = s.lastEvent) != null && n.current && o.handlers && o.handlers.onPointerMove(s.lastEvent.current);
    },
    connect: (n) => {
      var o;
      const {
        set: s,
        events: l
      } = e.getState();
      l.disconnect == null || l.disconnect(), s((a) => ({
        events: {
          ...a.events,
          connected: n
        }
      })), Object.entries((o = l.handlers) != null ? o : []).forEach(([a, f]) => {
        const [p, m] = kf[a];
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
        var s;
        Object.entries((s = o.handlers) != null ? s : []).forEach(([l, a]) => {
          if (o && o.connected instanceof HTMLElement) {
            const [f] = kf[l];
            o.connected.removeEventListener(f, a);
          }
        }), n((l) => ({
          events: {
            ...l.events,
            connected: void 0
          }
        }));
      }
    }
  };
}
function Vg(e, t) {
  let n;
  return (...o) => {
    window.clearTimeout(n), n = window.setTimeout(() => e(...o), t);
  };
}
function F2({ debounce: e, scroll: t, polyfill: n, offsetSize: o } = { debounce: 0, scroll: !1, offsetSize: !1 }) {
  const s = n || (typeof window > "u" ? class {
  } : window.ResizeObserver);
  if (!s) throw new Error("This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills");
  const [l, a] = W.useState({ left: 0, top: 0, width: 0, height: 0, bottom: 0, right: 0, x: 0, y: 0 }), f = W.useRef({ element: null, scrollContainers: null, resizeObserver: null, lastBounds: l, orientationHandler: null }), p = e ? typeof e == "number" ? e : e.scroll : null, m = e ? typeof e == "number" ? e : e.resize : null, g = W.useRef(!1);
  W.useEffect(() => (g.current = !0, () => void (g.current = !1)));
  const [y, v, x] = W.useMemo(() => {
    const w = () => {
      if (!f.current.element) return;
      const { left: S, top: _, width: R, height: I, bottom: O, right: D, x: B, y: q } = f.current.element.getBoundingClientRect(), V = { left: S, top: _, width: R, height: I, bottom: O, right: D, x: B, y: q };
      f.current.element instanceof HTMLElement && o && (V.height = f.current.element.offsetHeight, V.width = f.current.element.offsetWidth), Object.freeze(V), g.current && !G2(f.current.lastBounds, V) && a(f.current.lastBounds = V);
    };
    return [w, m ? Vg(w, m) : w, p ? Vg(w, p) : w];
  }, [a, o, p, m]);
  function k() {
    f.current.scrollContainers && (f.current.scrollContainers.forEach((w) => w.removeEventListener("scroll", x, !0)), f.current.scrollContainers = null), f.current.resizeObserver && (f.current.resizeObserver.disconnect(), f.current.resizeObserver = null), f.current.orientationHandler && ("orientation" in screen && "removeEventListener" in screen.orientation ? screen.orientation.removeEventListener("change", f.current.orientationHandler) : "onorientationchange" in window && window.removeEventListener("orientationchange", f.current.orientationHandler));
  }
  function L() {
    f.current.element && (f.current.resizeObserver = new s(x), f.current.resizeObserver.observe(f.current.element), t && f.current.scrollContainers && f.current.scrollContainers.forEach((w) => w.addEventListener("scroll", x, { capture: !0, passive: !0 })), f.current.orientationHandler = () => {
      x();
    }, "orientation" in screen && "addEventListener" in screen.orientation ? screen.orientation.addEventListener("change", f.current.orientationHandler) : "onorientationchange" in window && window.addEventListener("orientationchange", f.current.orientationHandler));
  }
  const A = (w) => {
    !w || w === f.current.element || (k(), f.current.element = w, f.current.scrollContainers = qv(w), L());
  };
  return H2(x, !!t), U2(v), W.useEffect(() => {
    k(), L();
  }, [t, x, v]), W.useEffect(() => k, []), [A, l, y];
}
function U2(e) {
  W.useEffect(() => {
    const t = e;
    return window.addEventListener("resize", t), () => void window.removeEventListener("resize", t);
  }, [e]);
}
function H2(e, t) {
  W.useEffect(() => {
    if (t) {
      const n = e;
      return window.addEventListener("scroll", n, { capture: !0, passive: !0 }), () => void window.removeEventListener("scroll", n, !0);
    }
  }, [e, t]);
}
function qv(e) {
  const t = [];
  if (!e || e === document.body) return t;
  const { overflow: n, overflowX: o, overflowY: s } = window.getComputedStyle(e);
  return [n, o, s].some((l) => l === "auto" || l === "scroll") && t.push(e), [...t, ...qv(e.parentElement)];
}
const B2 = ["x", "y", "top", "bottom", "left", "right", "width", "height"], G2 = (e, t) => B2.every((n) => e[n] === t[n]);
var W2 = Object.defineProperty, V2 = Object.defineProperties, K2 = Object.getOwnPropertyDescriptors, Kg = Object.getOwnPropertySymbols, Q2 = Object.prototype.hasOwnProperty, X2 = Object.prototype.propertyIsEnumerable, Qg = (e, t, n) => t in e ? W2(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, Xg = (e, t) => {
  for (var n in t || (t = {}))
    Q2.call(t, n) && Qg(e, n, t[n]);
  if (Kg)
    for (var n of Kg(t))
      X2.call(t, n) && Qg(e, n, t[n]);
  return e;
}, Y2 = (e, t) => V2(e, K2(t)), Yg, Zg;
typeof window < "u" && ((Yg = window.document) != null && Yg.createElement || ((Zg = window.navigator) == null ? void 0 : Zg.product) === "ReactNative") ? W.useLayoutEffect : W.useEffect;
function $v(e, t, n) {
  if (!e)
    return;
  if (n(e) === !0)
    return e;
  let o = e.child;
  for (; o; ) {
    const s = $v(o, t, n);
    if (s)
      return s;
    o = o.sibling;
  }
}
function bv(e) {
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
const Jg = console.error;
console.error = function() {
  const e = [...arguments].join("");
  if (e != null && e.startsWith("Warning:") && e.includes("useContext")) {
    console.error = Jg;
    return;
  }
  return Jg.apply(this, arguments);
};
const Mp = bv(W.createContext(null));
class e1 extends W.Component {
  render() {
    return /* @__PURE__ */ W.createElement(Mp.Provider, {
      value: this._reactInternals
    }, this.props.children);
  }
}
function Z2() {
  const e = W.useContext(Mp);
  if (e === null)
    throw new Error("its-fine: useFiber must be called within a <FiberProvider />!");
  const t = W.useId();
  return W.useMemo(() => {
    for (const o of [e, e == null ? void 0 : e.alternate]) {
      if (!o)
        continue;
      const s = $v(o, !1, (l) => {
        let a = l.memoizedState;
        for (; a; ) {
          if (a.memoizedState === t)
            return !0;
          a = a.next;
        }
      });
      if (s)
        return s;
    }
  }, [e, t]);
}
function J2() {
  const e = Z2(), [t] = W.useState(() => /* @__PURE__ */ new Map());
  t.clear();
  let n = e;
  for (; n; ) {
    if (n.type && typeof n.type == "object") {
      const s = n.type._context === void 0 && n.type.Provider === n.type ? n.type : n.type._context;
      s && s !== Mp && !t.has(s) && t.set(s, W.useContext(bv(s)));
    }
    n = n.return;
  }
  return t;
}
function q2() {
  const e = J2();
  return W.useMemo(
    () => Array.from(e.keys()).reduce(
      (t, n) => (o) => /* @__PURE__ */ W.createElement(t, null, /* @__PURE__ */ W.createElement(n.Provider, Y2(Xg({}, o), {
        value: e.get(n)
      }))),
      (t) => /* @__PURE__ */ W.createElement(e1, Xg({}, t))
    ),
    [e]
  );
}
const $2 = /* @__PURE__ */ W.forwardRef(function({
  children: t,
  fallback: n,
  resize: o,
  style: s,
  gl: l,
  events: a = D2,
  eventSource: f,
  eventPrefix: p,
  shadows: m,
  linear: g,
  flat: y,
  legacy: v,
  orthographic: x,
  frameloop: k,
  dpr: L,
  performance: A,
  raycaster: w,
  camera: S,
  scene: _,
  onPointerMissed: R,
  onCreated: I,
  ...O
}, D) {
  W.useMemo(() => g2(se), []);
  const B = q2(), [q, V] = F2({
    scroll: !0,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...o
  }), Q = W.useRef(null), le = W.useRef(null);
  W.useImperativeHandle(D, () => Q.current);
  const Se = Hv(R), [Et, Ht] = W.useState(!1), [be, Tt] = W.useState(!1);
  if (Et) throw Et;
  if (be) throw be;
  const N = W.useRef(null);
  ll(() => {
    const F = Q.current;
    V.width > 0 && V.height > 0 && F && (N.current || (N.current = I2(F)), N.current.configure({
      gl: l,
      events: a,
      shadows: m,
      linear: g,
      flat: y,
      legacy: v,
      orthographic: x,
      frameloop: k,
      dpr: L,
      performance: A,
      raycaster: w,
      camera: S,
      scene: _,
      size: V,
      // Pass mutable reference to onPointerMissed so it's free to update
      onPointerMissed: (...Y) => Se.current == null ? void 0 : Se.current(...Y),
      onCreated: (Y) => {
        Y.events.connect == null || Y.events.connect(f ? v2(f) ? f.current : f : le.current), p && Y.setEvents({
          compute: (te, ce) => {
            const ze = te[p + "X"], it = te[p + "Y"];
            ce.pointer.set(ze / ce.size.width * 2 - 1, -(it / ce.size.height) * 2 + 1), ce.raycaster.setFromCamera(ce.pointer, ce.camera);
          }
        }), I == null || I(Y);
      }
    }), N.current.render(/* @__PURE__ */ T.jsx(B, {
      children: /* @__PURE__ */ T.jsx(Bv, {
        set: Tt,
        children: /* @__PURE__ */ T.jsx(W.Suspense, {
          fallback: /* @__PURE__ */ T.jsx(S2, {
            set: Ht
          }),
          children: t ?? null
        })
      })
    })));
  }), W.useEffect(() => {
    const F = Q.current;
    if (F) return () => Jv(F);
  }, []);
  const U = f ? "none" : "auto";
  return /* @__PURE__ */ T.jsx("div", {
    ref: le,
    style: {
      position: "relative",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      pointerEvents: U,
      ...s
    },
    ...O,
    children: /* @__PURE__ */ T.jsx("div", {
      ref: q,
      style: {
        width: "100%",
        height: "100%"
      },
      children: /* @__PURE__ */ T.jsx("canvas", {
        ref: Q,
        style: {
          display: "block"
        },
        children: n
      })
    })
  });
}), b2 = /* @__PURE__ */ W.forwardRef(function(t, n) {
  return /* @__PURE__ */ T.jsx(e1, {
    children: /* @__PURE__ */ T.jsx($2, {
      ...t,
      ref: n
    })
  });
});
function qg(e, t) {
  if (t === ZS)
    return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), e;
  if (t === zf || t === cy) {
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
    const o = n.count - 2, s = [];
    if (t === zf)
      for (let a = 1; a <= o; a++)
        s.push(n.getX(0)), s.push(n.getX(a)), s.push(n.getX(a + 1));
    else
      for (let a = 0; a < o; a++)
        a % 2 === 0 ? (s.push(n.getX(a)), s.push(n.getX(a + 1)), s.push(n.getX(a + 2))) : (s.push(n.getX(a + 2)), s.push(n.getX(a + 1)), s.push(n.getX(a)));
    s.length / 3 !== o && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    const l = e.clone();
    return l.setIndex(s), l.clearGroups(), l;
  } else
    return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", t), e;
}
class eE extends fy {
  constructor(t) {
    super(t), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function(n) {
      return new oE(n);
    }), this.register(function(n) {
      return new sE(n);
    }), this.register(function(n) {
      return new mE(n);
    }), this.register(function(n) {
      return new gE(n);
    }), this.register(function(n) {
      return new yE(n);
    }), this.register(function(n) {
      return new uE(n);
    }), this.register(function(n) {
      return new aE(n);
    }), this.register(function(n) {
      return new cE(n);
    }), this.register(function(n) {
      return new fE(n);
    }), this.register(function(n) {
      return new iE(n);
    }), this.register(function(n) {
      return new dE(n);
    }), this.register(function(n) {
      return new lE(n);
    }), this.register(function(n) {
      return new hE(n);
    }), this.register(function(n) {
      return new pE(n);
    }), this.register(function(n) {
      return new nE(n);
    }), this.register(function(n) {
      return new vE(n);
    }), this.register(function(n) {
      return new SE(n);
    });
  }
  load(t, n, o, s) {
    const l = this;
    let a;
    if (this.resourcePath !== "")
      a = this.resourcePath;
    else if (this.path !== "") {
      const m = Cs.extractUrlBase(t);
      a = Cs.resolveURL(m, this.path);
    } else
      a = Cs.extractUrlBase(t);
    this.manager.itemStart(t);
    const f = function(m) {
      s ? s(m) : console.error(m), l.manager.itemError(t), l.manager.itemEnd(t);
    }, p = new Gu(this.manager);
    p.setPath(this.path), p.setResponseType("arraybuffer"), p.setRequestHeader(this.requestHeader), p.setWithCredentials(this.withCredentials), p.load(t, function(m) {
      try {
        l.parse(m, a, function(g) {
          n(g), l.manager.itemEnd(t);
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
  parse(t, n, o, s) {
    let l;
    const a = {}, f = {}, p = new TextDecoder();
    if (typeof t == "string")
      l = JSON.parse(t);
    else if (t instanceof ArrayBuffer)
      if (p.decode(new Uint8Array(t, 0, 4)) === t1) {
        try {
          a[ue.KHR_BINARY_GLTF] = new wE(t);
        } catch (y) {
          s && s(y);
          return;
        }
        l = JSON.parse(a[ue.KHR_BINARY_GLTF].content);
      } else
        l = JSON.parse(p.decode(t));
    else
      l = t;
    if (l.asset === void 0 || l.asset.version[0] < 2) {
      s && s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));
      return;
    }
    const m = new jE(l, {
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
    if (l.extensionsUsed)
      for (let g = 0; g < l.extensionsUsed.length; ++g) {
        const y = l.extensionsUsed[g], v = l.extensionsRequired || [];
        switch (y) {
          case ue.KHR_MATERIALS_UNLIT:
            a[y] = new rE();
            break;
          case ue.KHR_DRACO_MESH_COMPRESSION:
            a[y] = new xE(l, this.dracoLoader);
            break;
          case ue.KHR_TEXTURE_TRANSFORM:
            a[y] = new _E();
            break;
          case ue.KHR_MESH_QUANTIZATION:
            a[y] = new EE();
            break;
          default:
            v.indexOf(y) >= 0 && f[y] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + y + '".');
        }
      }
    m.setExtensions(a), m.setPlugins(f), m.parse(o, s);
  }
  parseAsync(t, n) {
    const o = this;
    return new Promise(function(s, l) {
      o.parse(t, n, s, l);
    });
  }
}
function tE() {
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
const ue = {
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
class nE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_LIGHTS_PUNCTUAL, this.cache = { refs: {}, uses: {} };
  }
  _markDefs() {
    const t = this.parser, n = this.parser.json.nodes || [];
    for (let o = 0, s = n.length; o < s; o++) {
      const l = n[o];
      l.extensions && l.extensions[this.name] && l.extensions[this.name].light !== void 0 && t._addNodeRef(this.cache, l.extensions[this.name].light);
    }
  }
  _loadLight(t) {
    const n = this.parser, o = "light:" + t;
    let s = n.cache.get(o);
    if (s) return s;
    const l = n.json, p = ((l.extensions && l.extensions[this.name] || {}).lights || [])[t];
    let m;
    const g = new Kr(16777215);
    p.color !== void 0 && g.setRGB(p.color[0], p.color[1], p.color[2], Zn);
    const y = p.range !== void 0 ? p.range : 0;
    switch (p.type) {
      case "directional":
        m = new $S(g), m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      case "point":
        m = new qS(g), m.distance = y;
        break;
      case "spot":
        m = new JS(g), m.distance = y, p.spot = p.spot || {}, p.spot.innerConeAngle = p.spot.innerConeAngle !== void 0 ? p.spot.innerConeAngle : 0, p.spot.outerConeAngle = p.spot.outerConeAngle !== void 0 ? p.spot.outerConeAngle : Math.PI / 4, m.angle = p.spot.outerConeAngle, m.penumbra = 1 - p.spot.innerConeAngle / p.spot.outerConeAngle, m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + p.type);
    }
    return m.position.set(0, 0, 0), m.decay = 2, or(m, p), p.intensity !== void 0 && (m.intensity = p.intensity), m.name = n.createUniqueName(p.name || "light_" + t), s = Promise.resolve(m), n.cache.add(o, s), s;
  }
  getDependency(t, n) {
    if (t === "light")
      return this._loadLight(n);
  }
  createNodeAttachment(t) {
    const n = this, o = this.parser, l = o.json.nodes[t], f = (l.extensions && l.extensions[this.name] || {}).light;
    return f === void 0 ? null : this._loadLight(f).then(function(p) {
      return o._getNodeRef(n.cache, f, p);
    });
  }
}
class rE {
  constructor() {
    this.name = ue.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return ws;
  }
  extendParams(t, n, o) {
    const s = [];
    t.color = new Kr(1, 1, 1), t.opacity = 1;
    const l = n.pbrMetallicRoughness;
    if (l) {
      if (Array.isArray(l.baseColorFactor)) {
        const a = l.baseColorFactor;
        t.color.setRGB(a[0], a[1], a[2], Zn), t.opacity = a[3];
      }
      l.baseColorTexture !== void 0 && s.push(o.assignTexture(t, "map", l.baseColorTexture, Or));
    }
    return Promise.all(s);
  }
}
class iE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_EMISSIVE_STRENGTH;
  }
  extendMaterialParams(t, n) {
    const s = this.parser.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = s.extensions[this.name].emissiveStrength;
    return l !== void 0 && (n.emissiveIntensity = l), Promise.resolve();
  }
}
class oE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    if (a.clearcoatFactor !== void 0 && (n.clearcoat = a.clearcoatFactor), a.clearcoatTexture !== void 0 && l.push(o.assignTexture(n, "clearcoatMap", a.clearcoatTexture)), a.clearcoatRoughnessFactor !== void 0 && (n.clearcoatRoughness = a.clearcoatRoughnessFactor), a.clearcoatRoughnessTexture !== void 0 && l.push(o.assignTexture(n, "clearcoatRoughnessMap", a.clearcoatRoughnessTexture)), a.clearcoatNormalTexture !== void 0 && (l.push(o.assignTexture(n, "clearcoatNormalMap", a.clearcoatNormalTexture)), a.clearcoatNormalTexture.scale !== void 0)) {
      const f = a.clearcoatNormalTexture.scale;
      n.clearcoatNormalScale = new Qt(f, f);
    }
    return Promise.all(l);
  }
}
class sE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_DISPERSION;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const s = this.parser.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = s.extensions[this.name];
    return n.dispersion = l.dispersion !== void 0 ? l.dispersion : 0, Promise.resolve();
  }
}
class lE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return a.iridescenceFactor !== void 0 && (n.iridescence = a.iridescenceFactor), a.iridescenceTexture !== void 0 && l.push(o.assignTexture(n, "iridescenceMap", a.iridescenceTexture)), a.iridescenceIor !== void 0 && (n.iridescenceIOR = a.iridescenceIor), n.iridescenceThicknessRange === void 0 && (n.iridescenceThicknessRange = [100, 400]), a.iridescenceThicknessMinimum !== void 0 && (n.iridescenceThicknessRange[0] = a.iridescenceThicknessMinimum), a.iridescenceThicknessMaximum !== void 0 && (n.iridescenceThicknessRange[1] = a.iridescenceThicknessMaximum), a.iridescenceThicknessTexture !== void 0 && l.push(o.assignTexture(n, "iridescenceThicknessMap", a.iridescenceThicknessTexture)), Promise.all(l);
  }
}
class uE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [];
    n.sheenColor = new Kr(0, 0, 0), n.sheenRoughness = 0, n.sheen = 1;
    const a = s.extensions[this.name];
    if (a.sheenColorFactor !== void 0) {
      const f = a.sheenColorFactor;
      n.sheenColor.setRGB(f[0], f[1], f[2], Zn);
    }
    return a.sheenRoughnessFactor !== void 0 && (n.sheenRoughness = a.sheenRoughnessFactor), a.sheenColorTexture !== void 0 && l.push(o.assignTexture(n, "sheenColorMap", a.sheenColorTexture, Or)), a.sheenRoughnessTexture !== void 0 && l.push(o.assignTexture(n, "sheenRoughnessMap", a.sheenRoughnessTexture)), Promise.all(l);
  }
}
class aE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return a.transmissionFactor !== void 0 && (n.transmission = a.transmissionFactor), a.transmissionTexture !== void 0 && l.push(o.assignTexture(n, "transmissionMap", a.transmissionTexture)), Promise.all(l);
  }
}
class cE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    n.thickness = a.thicknessFactor !== void 0 ? a.thicknessFactor : 0, a.thicknessTexture !== void 0 && l.push(o.assignTexture(n, "thicknessMap", a.thicknessTexture)), n.attenuationDistance = a.attenuationDistance || 1 / 0;
    const f = a.attenuationColor || [1, 1, 1];
    return n.attenuationColor = new Kr().setRGB(f[0], f[1], f[2], Zn), Promise.all(l);
  }
}
class fE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_IOR;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const s = this.parser.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = s.extensions[this.name];
    return n.ior = l.ior !== void 0 ? l.ior : 1.5, Promise.resolve();
  }
}
class dE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    n.specularIntensity = a.specularFactor !== void 0 ? a.specularFactor : 1, a.specularTexture !== void 0 && l.push(o.assignTexture(n, "specularIntensityMap", a.specularTexture));
    const f = a.specularColorFactor || [1, 1, 1];
    return n.specularColor = new Kr().setRGB(f[0], f[1], f[2], Zn), a.specularColorTexture !== void 0 && l.push(o.assignTexture(n, "specularColorMap", a.specularColorTexture, Or)), Promise.all(l);
  }
}
class pE {
  constructor(t) {
    this.parser = t, this.name = ue.EXT_MATERIALS_BUMP;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return n.bumpScale = a.bumpFactor !== void 0 ? a.bumpFactor : 1, a.bumpTexture !== void 0 && l.push(o.assignTexture(n, "bumpMap", a.bumpTexture)), Promise.all(l);
  }
}
class hE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(t) {
    const o = this.parser.json.materials[t];
    return !o.extensions || !o.extensions[this.name] ? null : Jn;
  }
  extendMaterialParams(t, n) {
    const o = this.parser, s = o.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return a.anisotropyStrength !== void 0 && (n.anisotropy = a.anisotropyStrength), a.anisotropyRotation !== void 0 && (n.anisotropyRotation = a.anisotropyRotation), a.anisotropyTexture !== void 0 && l.push(o.assignTexture(n, "anisotropyMap", a.anisotropyTexture)), Promise.all(l);
  }
}
class mE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_TEXTURE_BASISU;
  }
  loadTexture(t) {
    const n = this.parser, o = n.json, s = o.textures[t];
    if (!s.extensions || !s.extensions[this.name])
      return null;
    const l = s.extensions[this.name], a = n.options.ktx2Loader;
    if (!a) {
      if (o.extensionsRequired && o.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
      return null;
    }
    return n.loadTextureImage(t, l.source, a);
  }
}
class gE {
  constructor(t) {
    this.parser = t, this.name = ue.EXT_TEXTURE_WEBP, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, o = this.parser, s = o.json, l = s.textures[t];
    if (!l.extensions || !l.extensions[n])
      return null;
    const a = l.extensions[n], f = s.images[a.source];
    let p = o.textureLoader;
    if (f.uri) {
      const m = o.options.manager.getHandler(f.uri);
      m !== null && (p = m);
    }
    return this.detectSupport().then(function(m) {
      if (m) return o.loadTextureImage(t, a.source, p);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(n) >= 0)
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
class yE {
  constructor(t) {
    this.parser = t, this.name = ue.EXT_TEXTURE_AVIF, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, o = this.parser, s = o.json, l = s.textures[t];
    if (!l.extensions || !l.extensions[n])
      return null;
    const a = l.extensions[n], f = s.images[a.source];
    let p = o.textureLoader;
    if (f.uri) {
      const m = o.options.manager.getHandler(f.uri);
      m !== null && (p = m);
    }
    return this.detectSupport().then(function(m) {
      if (m) return o.loadTextureImage(t, a.source, p);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(n) >= 0)
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
class vE {
  constructor(t) {
    this.name = ue.EXT_MESHOPT_COMPRESSION, this.parser = t;
  }
  loadBufferView(t) {
    const n = this.parser.json, o = n.bufferViews[t];
    if (o.extensions && o.extensions[this.name]) {
      const s = o.extensions[this.name], l = this.parser.getDependency("buffer", s.buffer), a = this.parser.options.meshoptDecoder;
      if (!a || !a.supported) {
        if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
          throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
        return null;
      }
      return l.then(function(f) {
        const p = s.byteOffset || 0, m = s.byteLength || 0, g = s.count, y = s.byteStride, v = new Uint8Array(f, p, m);
        return a.decodeGltfBufferAsync ? a.decodeGltfBufferAsync(g, y, v, s.mode, s.filter).then(function(x) {
          return x.buffer;
        }) : a.ready.then(function() {
          const x = new ArrayBuffer(g * y);
          return a.decodeGltfBuffer(new Uint8Array(x), g, y, v, s.mode, s.filter), x;
        });
      });
    } else
      return null;
  }
}
class SE {
  constructor(t) {
    this.name = ue.EXT_MESH_GPU_INSTANCING, this.parser = t;
  }
  createNodeMesh(t) {
    const n = this.parser.json, o = n.nodes[t];
    if (!o.extensions || !o.extensions[this.name] || o.mesh === void 0)
      return null;
    const s = n.meshes[o.mesh];
    for (const m of s.primitives)
      if (m.mode !== cn.TRIANGLES && m.mode !== cn.TRIANGLE_STRIP && m.mode !== cn.TRIANGLE_FAN && m.mode !== void 0)
        return null;
    const a = o.extensions[this.name].attributes, f = [], p = {};
    for (const m in a)
      f.push(this.parser.getDependency("accessor", a[m]).then((g) => (p[m] = g, p[m])));
    return f.length < 1 ? null : (f.push(this.parser.createNodeMesh(t)), Promise.all(f).then((m) => {
      const g = m.pop(), y = g.isGroup ? g.children : [g], v = m[0].count, x = [];
      for (const k of y) {
        const L = new Wu(), A = new pt(), w = new Vu(), S = new pt(1, 1, 1), _ = new bS(k.geometry, k.material, v);
        for (let R = 0; R < v; R++)
          p.TRANSLATION && A.fromBufferAttribute(p.TRANSLATION, R), p.ROTATION && w.fromBufferAttribute(p.ROTATION, R), p.SCALE && S.fromBufferAttribute(p.SCALE, R), _.setMatrixAt(R, L.compose(A, w, S));
        for (const R in p)
          if (R === "_COLOR_0") {
            const I = p[R];
            _.instanceColor = new ew(I.array, I.itemSize, I.normalized);
          } else R !== "TRANSLATION" && R !== "ROTATION" && R !== "SCALE" && k.geometry.setAttribute(R, p[R]);
        dy.prototype.copy.call(_, k), this.parser.assignFinalMaterial(_), x.push(_);
      }
      return g.isGroup ? (g.clear(), g.add(...x), g) : x[0];
    }));
  }
}
const t1 = "glTF", ys = 12, $g = { JSON: 1313821514, BIN: 5130562 };
class wE {
  constructor(t) {
    this.name = ue.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const n = new DataView(t, 0, ys), o = new TextDecoder();
    if (this.header = {
      magic: o.decode(new Uint8Array(t.slice(0, 4))),
      version: n.getUint32(4, !0),
      length: n.getUint32(8, !0)
    }, this.header.magic !== t1)
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const s = this.header.length - ys, l = new DataView(t, ys);
    let a = 0;
    for (; a < s; ) {
      const f = l.getUint32(a, !0);
      a += 4;
      const p = l.getUint32(a, !0);
      if (a += 4, p === $g.JSON) {
        const m = new Uint8Array(t, ys + a, f);
        this.content = o.decode(m);
      } else if (p === $g.BIN) {
        const m = ys + a;
        this.body = t.slice(m, m + f);
      }
      a += f;
    }
    if (this.content === null)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class xE {
  constructor(t, n) {
    if (!n)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = ue.KHR_DRACO_MESH_COMPRESSION, this.json = t, this.dracoLoader = n, this.dracoLoader.preload();
  }
  decodePrimitive(t, n) {
    const o = this.json, s = this.dracoLoader, l = t.extensions[this.name].bufferView, a = t.extensions[this.name].attributes, f = {}, p = {}, m = {};
    for (const g in a) {
      const y = jd[g] || g.toLowerCase();
      f[y] = a[g];
    }
    for (const g in t.attributes) {
      const y = jd[g] || g.toLowerCase();
      if (a[g] !== void 0) {
        const v = o.accessors[t.attributes[g]], x = ko[v.componentType];
        m[y] = x.name, p[y] = v.normalized === !0;
      }
    }
    return n.getDependency("bufferView", l).then(function(g) {
      return new Promise(function(y, v) {
        s.decodeDracoFile(g, function(x) {
          for (const k in x.attributes) {
            const L = x.attributes[k], A = p[k];
            A !== void 0 && (L.normalized = A);
          }
          y(x);
        }, f, m, Zn, v);
      });
    });
  }
}
class _E {
  constructor() {
    this.name = ue.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(t, n) {
    return (n.texCoord === void 0 || n.texCoord === t.channel) && n.offset === void 0 && n.rotation === void 0 && n.scale === void 0 || (t = t.clone(), n.texCoord !== void 0 && (t.channel = n.texCoord), n.offset !== void 0 && t.offset.fromArray(n.offset), n.rotation !== void 0 && (t.rotation = n.rotation), n.scale !== void 0 && t.repeat.fromArray(n.scale), t.needsUpdate = !0), t;
  }
}
class EE {
  constructor() {
    this.name = ue.KHR_MESH_QUANTIZATION;
  }
}
class n1 extends Cw {
  constructor(t, n, o, s) {
    super(t, n, o, s);
  }
  copySampleValue_(t) {
    const n = this.resultBuffer, o = this.sampleValues, s = this.valueSize, l = t * s * 3 + s;
    for (let a = 0; a !== s; a++)
      n[a] = o[l + a];
    return n;
  }
  interpolate_(t, n, o, s) {
    const l = this.resultBuffer, a = this.sampleValues, f = this.valueSize, p = f * 2, m = f * 3, g = s - n, y = (o - n) / g, v = y * y, x = v * y, k = t * m, L = k - m, A = -2 * x + 3 * v, w = x - v, S = 1 - A, _ = w - v + y;
    for (let R = 0; R !== f; R++) {
      const I = a[L + R + f], O = a[L + R + p] * g, D = a[k + R + f], B = a[k + R] * g;
      l[R] = S * I + _ * O + A * D + w * B;
    }
    return l;
  }
}
const TE = new Vu();
class kE extends n1 {
  interpolate_(t, n, o, s) {
    const l = super.interpolate_(t, n, o, s);
    return TE.fromArray(l).normalize().toArray(l), l;
  }
}
const cn = {
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6
}, ko = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
}, bg = {
  9728: hy,
  9729: If,
  9984: lw,
  9985: sw,
  9986: ow,
  9987: py
}, ey = {
  33071: aw,
  33648: uw,
  10497: Of
}, Pf = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
}, jd = {
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
}, Cr = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences"
}, PE = {
  CUBICSPLINE: void 0,
  // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: vy,
  STEP: kw
}, Cf = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND"
};
function CE(e) {
  return e.DefaultMaterial === void 0 && (e.DefaultMaterial = new my({
    color: 16777215,
    emissive: 0,
    metalness: 1,
    roughness: 1,
    transparent: !1,
    depthTest: !0,
    side: Pw
  })), e.DefaultMaterial;
}
function li(e, t, n) {
  for (const o in n.extensions)
    e[o] === void 0 && (t.userData.gltfExtensions = t.userData.gltfExtensions || {}, t.userData.gltfExtensions[o] = n.extensions[o]);
}
function or(e, t) {
  t.extras !== void 0 && (typeof t.extras == "object" ? Object.assign(e.userData, t.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + t.extras));
}
function RE(e, t, n) {
  let o = !1, s = !1, l = !1;
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (y.POSITION !== void 0 && (o = !0), y.NORMAL !== void 0 && (s = !0), y.COLOR_0 !== void 0 && (l = !0), o && s && l) break;
  }
  if (!o && !s && !l) return Promise.resolve(e);
  const a = [], f = [], p = [];
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (o) {
      const v = y.POSITION !== void 0 ? n.getDependency("accessor", y.POSITION) : e.attributes.position;
      a.push(v);
    }
    if (s) {
      const v = y.NORMAL !== void 0 ? n.getDependency("accessor", y.NORMAL) : e.attributes.normal;
      f.push(v);
    }
    if (l) {
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
    return o && (e.morphAttributes.position = g), s && (e.morphAttributes.normal = y), l && (e.morphAttributes.color = v), e.morphTargetsRelative = !0, e;
  });
}
function LE(e, t) {
  if (e.updateMorphTargets(), t.weights !== void 0)
    for (let n = 0, o = t.weights.length; n < o; n++)
      e.morphTargetInfluences[n] = t.weights[n];
  if (t.extras && Array.isArray(t.extras.targetNames)) {
    const n = t.extras.targetNames;
    if (e.morphTargetInfluences.length === n.length) {
      e.morphTargetDictionary = {};
      for (let o = 0, s = n.length; o < s; o++)
        e.morphTargetDictionary[n[o]] = o;
    } else
      console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
  }
}
function AE(e) {
  let t;
  const n = e.extensions && e.extensions[ue.KHR_DRACO_MESH_COMPRESSION];
  if (n ? t = "draco:" + n.bufferView + ":" + n.indices + ":" + Rf(n.attributes) : t = e.indices + ":" + Rf(e.attributes) + ":" + e.mode, e.targets !== void 0)
    for (let o = 0, s = e.targets.length; o < s; o++)
      t += ":" + Rf(e.targets[o]);
  return t;
}
function Rf(e) {
  let t = "";
  const n = Object.keys(e).sort();
  for (let o = 0, s = n.length; o < s; o++)
    t += n[o] + ":" + e[n[o]] + ";";
  return t;
}
function zd(e) {
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
function ME(e) {
  return e.search(/\.jpe?g($|\?)/i) > 0 || e.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : e.search(/\.webp($|\?)/i) > 0 || e.search(/^data\:image\/webp/) === 0 ? "image/webp" : e.search(/\.ktx2($|\?)/i) > 0 || e.search(/^data\:image\/ktx2/) === 0 ? "image/ktx2" : "image/png";
}
const NE = new Wu();
class jE {
  constructor(t = {}, n = {}) {
    this.json = t, this.extensions = {}, this.plugins = {}, this.options = n, this.cache = new tE(), this.associations = /* @__PURE__ */ new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = { refs: {}, uses: {} }, this.cameraCache = { refs: {}, uses: {} }, this.lightCache = { refs: {}, uses: {} }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let o = !1, s = -1, l = !1, a = -1;
    if (typeof navigator < "u") {
      const f = navigator.userAgent;
      o = /^((?!chrome|android).)*safari/i.test(f) === !0;
      const p = f.match(/Version\/(\d+)/);
      s = o && p ? parseInt(p[1], 10) : -1, l = f.indexOf("Firefox") > -1, a = l ? f.match(/Firefox\/([0-9]+)\./)[1] : -1;
    }
    typeof createImageBitmap > "u" || o && s < 17 || l && a < 98 ? this.textureLoader = new tw(this.options.manager) : this.textureLoader = new nw(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new Gu(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
  }
  setExtensions(t) {
    this.extensions = t;
  }
  setPlugins(t) {
    this.plugins = t;
  }
  parse(t, n) {
    const o = this, s = this.json, l = this.extensions;
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
        scene: a[0][s.scene || 0],
        scenes: a[0],
        animations: a[1],
        cameras: a[2],
        asset: s.asset,
        parser: o,
        userData: {}
      };
      return li(l, f, s), or(f, s), Promise.all(o._invokeAll(function(p) {
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
    for (let s = 0, l = n.length; s < l; s++) {
      const a = n[s].joints;
      for (let f = 0, p = a.length; f < p; f++)
        t[a[f]].isBone = !0;
    }
    for (let s = 0, l = t.length; s < l; s++) {
      const a = t[s];
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
    const s = o.clone(), l = (a, f) => {
      const p = this.associations.get(a);
      p != null && this.associations.set(f, p);
      for (const [m, g] of a.children.entries())
        l(g, f.children[m]);
    };
    return l(o, s), s.name += "_instance_" + t.uses[n]++, s;
  }
  _invokeOne(t) {
    const n = Object.values(this.plugins);
    n.push(this);
    for (let o = 0; o < n.length; o++) {
      const s = t(n[o]);
      if (s) return s;
    }
    return null;
  }
  _invokeAll(t) {
    const n = Object.values(this.plugins);
    n.unshift(this);
    const o = [];
    for (let s = 0; s < n.length; s++) {
      const l = t(n[s]);
      l && o.push(l);
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
    let s = this.cache.get(o);
    if (!s) {
      switch (t) {
        case "scene":
          s = this.loadScene(n);
          break;
        case "node":
          s = this._invokeOne(function(l) {
            return l.loadNode && l.loadNode(n);
          });
          break;
        case "mesh":
          s = this._invokeOne(function(l) {
            return l.loadMesh && l.loadMesh(n);
          });
          break;
        case "accessor":
          s = this.loadAccessor(n);
          break;
        case "bufferView":
          s = this._invokeOne(function(l) {
            return l.loadBufferView && l.loadBufferView(n);
          });
          break;
        case "buffer":
          s = this.loadBuffer(n);
          break;
        case "material":
          s = this._invokeOne(function(l) {
            return l.loadMaterial && l.loadMaterial(n);
          });
          break;
        case "texture":
          s = this._invokeOne(function(l) {
            return l.loadTexture && l.loadTexture(n);
          });
          break;
        case "skin":
          s = this.loadSkin(n);
          break;
        case "animation":
          s = this._invokeOne(function(l) {
            return l.loadAnimation && l.loadAnimation(n);
          });
          break;
        case "camera":
          s = this.loadCamera(n);
          break;
        default:
          if (s = this._invokeOne(function(l) {
            return l != this && l.getDependency && l.getDependency(t, n);
          }), !s)
            throw new Error("Unknown type: " + t);
          break;
      }
      this.cache.add(o, s);
    }
    return s;
  }
  /**
   * Requests all dependencies of the specified type asynchronously, with caching.
   * @param {string} type
   * @return {Promise<Array<Object>>}
   */
  getDependencies(t) {
    let n = this.cache.get(t);
    if (!n) {
      const o = this, s = this.json[t + (t === "mesh" ? "es" : "s")] || [];
      n = Promise.all(s.map(function(l, a) {
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
      return Promise.resolve(this.extensions[ue.KHR_BINARY_GLTF].body);
    const s = this.options;
    return new Promise(function(l, a) {
      o.load(Cs.resolveURL(n.uri, s.path), l, void 0, function() {
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
      const s = n.byteLength || 0, l = n.byteOffset || 0;
      return o.slice(l, l + s);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */
  loadAccessor(t) {
    const n = this, o = this.json, s = this.json.accessors[t];
    if (s.bufferView === void 0 && s.sparse === void 0) {
      const a = Pf[s.type], f = ko[s.componentType], p = s.normalized === !0, m = new f(s.count * a);
      return Promise.resolve(new Rs(m, a, p));
    }
    const l = [];
    return s.bufferView !== void 0 ? l.push(this.getDependency("bufferView", s.bufferView)) : l.push(null), s.sparse !== void 0 && (l.push(this.getDependency("bufferView", s.sparse.indices.bufferView)), l.push(this.getDependency("bufferView", s.sparse.values.bufferView))), Promise.all(l).then(function(a) {
      const f = a[0], p = Pf[s.type], m = ko[s.componentType], g = m.BYTES_PER_ELEMENT, y = g * p, v = s.byteOffset || 0, x = s.bufferView !== void 0 ? o.bufferViews[s.bufferView].byteStride : void 0, k = s.normalized === !0;
      let L, A;
      if (x && x !== y) {
        const w = Math.floor(v / x), S = "InterleavedBuffer:" + s.bufferView + ":" + s.componentType + ":" + w + ":" + s.count;
        let _ = n.cache.get(S);
        _ || (L = new m(f, w * x, s.count * x / g), _ = new rw(L, x / g), n.cache.add(S, _)), A = new iw(_, p, v % x / g, k);
      } else
        f === null ? L = new m(s.count * p) : L = new m(f, v, s.count * p), A = new Rs(L, p, k);
      if (s.sparse !== void 0) {
        const w = Pf.SCALAR, S = ko[s.sparse.indices.componentType], _ = s.sparse.indices.byteOffset || 0, R = s.sparse.values.byteOffset || 0, I = new S(a[1], _, s.sparse.count * w), O = new m(a[2], R, s.sparse.count * p);
        f !== null && (A = new Rs(A.array.slice(), A.itemSize, A.normalized)), A.normalized = !1;
        for (let D = 0, B = I.length; D < B; D++) {
          const q = I[D];
          if (A.setX(q, O[D * p]), p >= 2 && A.setY(q, O[D * p + 1]), p >= 3 && A.setZ(q, O[D * p + 2]), p >= 4 && A.setW(q, O[D * p + 3]), p >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
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
    const n = this.json, o = this.options, l = n.textures[t].source, a = n.images[l];
    let f = this.textureLoader;
    if (a.uri) {
      const p = o.manager.getHandler(a.uri);
      p !== null && (f = p);
    }
    return this.loadTextureImage(t, l, f);
  }
  loadTextureImage(t, n, o) {
    const s = this, l = this.json, a = l.textures[t], f = l.images[n], p = (f.uri || f.bufferView) + ":" + a.sampler;
    if (this.textureCache[p])
      return this.textureCache[p];
    const m = this.loadImageSource(n, o).then(function(g) {
      g.flipY = !1, g.name = a.name || f.name || "", g.name === "" && typeof f.uri == "string" && f.uri.startsWith("data:image/") === !1 && (g.name = f.uri);
      const v = (l.samplers || {})[a.sampler] || {};
      return g.magFilter = bg[v.magFilter] || If, g.minFilter = bg[v.minFilter] || py, g.wrapS = ey[v.wrapS] || Of, g.wrapT = ey[v.wrapT] || Of, g.generateMipmaps = !g.isCompressedTexture && g.minFilter !== hy && g.minFilter !== If, s.associations.set(g, { textures: t }), g;
    }).catch(function() {
      return null;
    });
    return this.textureCache[p] = m, m;
  }
  loadImageSource(t, n) {
    const o = this, s = this.json, l = this.options;
    if (this.sourceCache[t] !== void 0)
      return this.sourceCache[t].then((y) => y.clone());
    const a = s.images[t], f = self.URL || self.webkitURL;
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
      return new Promise(function(v, x) {
        let k = v;
        n.isImageBitmapLoader === !0 && (k = function(L) {
          const A = new xm(L);
          A.needsUpdate = !0, v(A);
        }), n.load(Cs.resolveURL(y, l.path), k, void 0, x);
      });
    }).then(function(y) {
      return m === !0 && f.revokeObjectURL(p), or(y, a), y.userData.mimeType = a.mimeType || ME(a.uri), y;
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
  assignTexture(t, n, o, s) {
    const l = this;
    return this.getDependency("texture", o.index).then(function(a) {
      if (!a) return null;
      if (o.texCoord !== void 0 && o.texCoord > 0 && (a = a.clone(), a.channel = o.texCoord), l.extensions[ue.KHR_TEXTURE_TRANSFORM]) {
        const f = o.extensions !== void 0 ? o.extensions[ue.KHR_TEXTURE_TRANSFORM] : void 0;
        if (f) {
          const p = l.associations.get(a);
          a = l.extensions[ue.KHR_TEXTURE_TRANSFORM].extendTexture(a, f), l.associations.set(a, p);
        }
      }
      return s !== void 0 && (a.colorSpace = s), t[n] = a, a;
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
    const s = n.attributes.tangent === void 0, l = n.attributes.color !== void 0, a = n.attributes.normal === void 0;
    if (t.isPoints) {
      const f = "PointsMaterial:" + o.uuid;
      let p = this.cache.get(f);
      p || (p = new cw(), Wc.prototype.copy.call(p, o), p.color.copy(o.color), p.map = o.map, p.sizeAttenuation = !1, this.cache.add(f, p)), o = p;
    } else if (t.isLine) {
      const f = "LineBasicMaterial:" + o.uuid;
      let p = this.cache.get(f);
      p || (p = new fw(), Wc.prototype.copy.call(p, o), p.color.copy(o.color), p.map = o.map, this.cache.add(f, p)), o = p;
    }
    if (s || l || a) {
      let f = "ClonedMaterial:" + o.uuid + ":";
      s && (f += "derivative-tangents:"), l && (f += "vertex-colors:"), a && (f += "flat-shading:");
      let p = this.cache.get(f);
      p || (p = o.clone(), l && (p.vertexColors = !0), a && (p.flatShading = !0), s && (p.normalScale && (p.normalScale.y *= -1), p.clearcoatNormalScale && (p.clearcoatNormalScale.y *= -1)), this.cache.add(f, p), this.associations.set(p, this.associations.get(o))), o = p;
    }
    t.material = o;
  }
  getMaterialType() {
    return my;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  loadMaterial(t) {
    const n = this, o = this.json, s = this.extensions, l = o.materials[t];
    let a;
    const f = {}, p = l.extensions || {}, m = [];
    if (p[ue.KHR_MATERIALS_UNLIT]) {
      const y = s[ue.KHR_MATERIALS_UNLIT];
      a = y.getMaterialType(), m.push(y.extendParams(f, l, n));
    } else {
      const y = l.pbrMetallicRoughness || {};
      if (f.color = new Kr(1, 1, 1), f.opacity = 1, Array.isArray(y.baseColorFactor)) {
        const v = y.baseColorFactor;
        f.color.setRGB(v[0], v[1], v[2], Zn), f.opacity = v[3];
      }
      y.baseColorTexture !== void 0 && m.push(n.assignTexture(f, "map", y.baseColorTexture, Or)), f.metalness = y.metallicFactor !== void 0 ? y.metallicFactor : 1, f.roughness = y.roughnessFactor !== void 0 ? y.roughnessFactor : 1, y.metallicRoughnessTexture !== void 0 && (m.push(n.assignTexture(f, "metalnessMap", y.metallicRoughnessTexture)), m.push(n.assignTexture(f, "roughnessMap", y.metallicRoughnessTexture))), a = this._invokeOne(function(v) {
        return v.getMaterialType && v.getMaterialType(t);
      }), m.push(Promise.all(this._invokeAll(function(v) {
        return v.extendMaterialParams && v.extendMaterialParams(t, f);
      })));
    }
    l.doubleSided === !0 && (f.side = dw);
    const g = l.alphaMode || Cf.OPAQUE;
    if (g === Cf.BLEND ? (f.transparent = !0, f.depthWrite = !1) : (f.transparent = !1, g === Cf.MASK && (f.alphaTest = l.alphaCutoff !== void 0 ? l.alphaCutoff : 0.5)), l.normalTexture !== void 0 && a !== ws && (m.push(n.assignTexture(f, "normalMap", l.normalTexture)), f.normalScale = new Qt(1, 1), l.normalTexture.scale !== void 0)) {
      const y = l.normalTexture.scale;
      f.normalScale.set(y, y);
    }
    if (l.occlusionTexture !== void 0 && a !== ws && (m.push(n.assignTexture(f, "aoMap", l.occlusionTexture)), l.occlusionTexture.strength !== void 0 && (f.aoMapIntensity = l.occlusionTexture.strength)), l.emissiveFactor !== void 0 && a !== ws) {
      const y = l.emissiveFactor;
      f.emissive = new Kr().setRGB(y[0], y[1], y[2], Zn);
    }
    return l.emissiveTexture !== void 0 && a !== ws && m.push(n.assignTexture(f, "emissiveMap", l.emissiveTexture, Or)), Promise.all(m).then(function() {
      const y = new a(f);
      return l.name && (y.name = l.name), or(y, l), n.associations.set(y, { materials: t }), l.extensions && li(s, y, l), y;
    });
  }
  /** When Object3D instances are targeted by animation, they need unique names. */
  createUniqueName(t) {
    const n = pw.sanitizeNodeName(t || "");
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
    const n = this, o = this.extensions, s = this.primitiveCache;
    function l(f) {
      return o[ue.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(f, n).then(function(p) {
        return ty(p, f, n);
      });
    }
    const a = [];
    for (let f = 0, p = t.length; f < p; f++) {
      const m = t[f], g = AE(m), y = s[g];
      if (y)
        a.push(y.promise);
      else {
        let v;
        m.extensions && m.extensions[ue.KHR_DRACO_MESH_COMPRESSION] ? v = l(m) : v = ty(new gy(), m, n), s[g] = { primitive: m, promise: v }, a.push(v);
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
    const n = this, o = this.json, s = this.extensions, l = o.meshes[t], a = l.primitives, f = [];
    for (let p = 0, m = a.length; p < m; p++) {
      const g = a[p].material === void 0 ? CE(this.cache) : this.getDependency("material", a[p].material);
      f.push(g);
    }
    return f.push(n.loadGeometries(a)), Promise.all(f).then(function(p) {
      const m = p.slice(0, p.length - 1), g = p[p.length - 1], y = [];
      for (let x = 0, k = g.length; x < k; x++) {
        const L = g[x], A = a[x];
        let w;
        const S = m[x];
        if (A.mode === cn.TRIANGLES || A.mode === cn.TRIANGLE_STRIP || A.mode === cn.TRIANGLE_FAN || A.mode === void 0)
          w = l.isSkinnedMesh === !0 ? new hw(L, S) : new mw(L, S), w.isSkinnedMesh === !0 && w.normalizeSkinWeights(), A.mode === cn.TRIANGLE_STRIP ? w.geometry = qg(w.geometry, cy) : A.mode === cn.TRIANGLE_FAN && (w.geometry = qg(w.geometry, zf));
        else if (A.mode === cn.LINES)
          w = new gw(L, S);
        else if (A.mode === cn.LINE_STRIP)
          w = new yw(L, S);
        else if (A.mode === cn.LINE_LOOP)
          w = new vw(L, S);
        else if (A.mode === cn.POINTS)
          w = new Sw(L, S);
        else
          throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + A.mode);
        Object.keys(w.geometry.morphAttributes).length > 0 && LE(w, l), w.name = n.createUniqueName(l.name || "mesh_" + t), or(w, l), A.extensions && li(s, w, A), n.assignFinalMaterial(w), y.push(w);
      }
      for (let x = 0, k = y.length; x < k; x++)
        n.associations.set(y[x], {
          meshes: t,
          primitives: x
        });
      if (y.length === 1)
        return l.extensions && li(s, y[0], l), y[0];
      const v = new Vc();
      l.extensions && li(s, v, l), n.associations.set(v, { meshes: t });
      for (let x = 0, k = y.length; x < k; x++)
        v.add(y[x]);
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
    const o = this.json.cameras[t], s = o[o.type];
    if (!s) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }
    return o.type === "perspective" ? n = new ww(yy.radToDeg(s.yfov), s.aspectRatio || 1, s.znear || 1, s.zfar || 2e6) : o.type === "orthographic" && (n = new xw(-s.xmag, s.xmag, s.ymag, -s.ymag, s.znear, s.zfar)), o.name && (n.name = this.createUniqueName(o.name)), or(n, o), Promise.resolve(n);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Skeleton>}
   */
  loadSkin(t) {
    const n = this.json.skins[t], o = [];
    for (let s = 0, l = n.joints.length; s < l; s++)
      o.push(this._loadNodeShallow(n.joints[s]));
    return n.inverseBindMatrices !== void 0 ? o.push(this.getDependency("accessor", n.inverseBindMatrices)) : o.push(null), Promise.all(o).then(function(s) {
      const l = s.pop(), a = s, f = [], p = [];
      for (let m = 0, g = a.length; m < g; m++) {
        const y = a[m];
        if (y) {
          f.push(y);
          const v = new Wu();
          l !== null && v.fromArray(l.array, m * 16), p.push(v);
        } else
          console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', n.joints[m]);
      }
      return new _w(f, p);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */
  loadAnimation(t) {
    const n = this.json, o = this, s = n.animations[t], l = s.name ? s.name : "animation_" + t, a = [], f = [], p = [], m = [], g = [];
    for (let y = 0, v = s.channels.length; y < v; y++) {
      const x = s.channels[y], k = s.samplers[x.sampler], L = x.target, A = L.node, w = s.parameters !== void 0 ? s.parameters[k.input] : k.input, S = s.parameters !== void 0 ? s.parameters[k.output] : k.output;
      L.node !== void 0 && (a.push(this.getDependency("node", A)), f.push(this.getDependency("accessor", w)), p.push(this.getDependency("accessor", S)), m.push(k), g.push(L));
    }
    return Promise.all([
      Promise.all(a),
      Promise.all(f),
      Promise.all(p),
      Promise.all(m),
      Promise.all(g)
    ]).then(function(y) {
      const v = y[0], x = y[1], k = y[2], L = y[3], A = y[4], w = [];
      for (let S = 0, _ = v.length; S < _; S++) {
        const R = v[S], I = x[S], O = k[S], D = L[S], B = A[S];
        if (R === void 0) continue;
        R.updateMatrix && R.updateMatrix();
        const q = o._createAnimationTracks(R, I, O, D, B);
        if (q)
          for (let V = 0; V < q.length; V++)
            w.push(q[V]);
      }
      return new Ew(l, void 0, w);
    });
  }
  createNodeMesh(t) {
    const n = this.json, o = this, s = n.nodes[t];
    return s.mesh === void 0 ? null : o.getDependency("mesh", s.mesh).then(function(l) {
      const a = o._getNodeRef(o.meshCache, s.mesh, l);
      return s.weights !== void 0 && a.traverse(function(f) {
        if (f.isMesh)
          for (let p = 0, m = s.weights.length; p < m; p++)
            f.morphTargetInfluences[p] = s.weights[p];
      }), a;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */
  loadNode(t) {
    const n = this.json, o = this, s = n.nodes[t], l = o._loadNodeShallow(t), a = [], f = s.children || [];
    for (let m = 0, g = f.length; m < g; m++)
      a.push(o.getDependency("node", f[m]));
    const p = s.skin === void 0 ? Promise.resolve(null) : o.getDependency("skin", s.skin);
    return Promise.all([
      l,
      Promise.all(a),
      p
    ]).then(function(m) {
      const g = m[0], y = m[1], v = m[2];
      v !== null && g.traverse(function(x) {
        x.isSkinnedMesh && x.bind(v, NE);
      });
      for (let x = 0, k = y.length; x < k; x++)
        g.add(y[x]);
      return g;
    });
  }
  // ._loadNodeShallow() parses a single node.
  // skin and child nodes are created and added in .loadNode() (no '_' prefix).
  _loadNodeShallow(t) {
    const n = this.json, o = this.extensions, s = this;
    if (this.nodeCache[t] !== void 0)
      return this.nodeCache[t];
    const l = n.nodes[t], a = l.name ? s.createUniqueName(l.name) : "", f = [], p = s._invokeOne(function(m) {
      return m.createNodeMesh && m.createNodeMesh(t);
    });
    return p && f.push(p), l.camera !== void 0 && f.push(s.getDependency("camera", l.camera).then(function(m) {
      return s._getNodeRef(s.cameraCache, l.camera, m);
    })), s._invokeAll(function(m) {
      return m.createNodeAttachment && m.createNodeAttachment(t);
    }).forEach(function(m) {
      f.push(m);
    }), this.nodeCache[t] = Promise.all(f).then(function(m) {
      let g;
      if (l.isBone === !0 ? g = new Tw() : m.length > 1 ? g = new Vc() : m.length === 1 ? g = m[0] : g = new dy(), g !== m[0])
        for (let y = 0, v = m.length; y < v; y++)
          g.add(m[y]);
      if (l.name && (g.userData.name = l.name, g.name = a), or(g, l), l.extensions && li(o, g, l), l.matrix !== void 0) {
        const y = new Wu();
        y.fromArray(l.matrix), g.applyMatrix4(y);
      } else
        l.translation !== void 0 && g.position.fromArray(l.translation), l.rotation !== void 0 && g.quaternion.fromArray(l.rotation), l.scale !== void 0 && g.scale.fromArray(l.scale);
      return s.associations.has(g) || s.associations.set(g, {}), s.associations.get(g).nodes = t, g;
    }), this.nodeCache[t];
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   * @param {number} sceneIndex
   * @return {Promise<Group>}
   */
  loadScene(t) {
    const n = this.extensions, o = this.json.scenes[t], s = this, l = new Vc();
    o.name && (l.name = s.createUniqueName(o.name)), or(l, o), o.extensions && li(n, l, o);
    const a = o.nodes || [], f = [];
    for (let p = 0, m = a.length; p < m; p++)
      f.push(s.getDependency("node", a[p]));
    return Promise.all(f).then(function(p) {
      for (let g = 0, y = p.length; g < y; g++)
        l.add(p[g]);
      const m = (g) => {
        const y = /* @__PURE__ */ new Map();
        for (const [v, x] of s.associations)
          (v instanceof Wc || v instanceof xm) && y.set(v, x);
        return g.traverse((v) => {
          const x = s.associations.get(v);
          x != null && y.set(v, x);
        }), y;
      };
      return s.associations = m(l), l;
    });
  }
  _createAnimationTracks(t, n, o, s, l) {
    const a = [], f = t.name ? t.name : t.uuid, p = [];
    Cr[l.path] === Cr.weights ? t.traverse(function(v) {
      v.morphTargetInfluences && p.push(v.name ? v.name : v.uuid);
    }) : p.push(f);
    let m;
    switch (Cr[l.path]) {
      case Cr.weights:
        m = Em;
        break;
      case Cr.rotation:
        m = Tm;
        break;
      case Cr.position:
      case Cr.scale:
        m = _m;
        break;
      default:
        switch (o.itemSize) {
          case 1:
            m = Em;
            break;
          case 2:
          case 3:
          default:
            m = _m;
            break;
        }
        break;
    }
    const g = s.interpolation !== void 0 ? PE[s.interpolation] : vy, y = this._getArrayFromAccessor(o);
    for (let v = 0, x = p.length; v < x; v++) {
      const k = new m(
        p[v] + "." + Cr[l.path],
        n.array,
        y,
        g
      );
      s.interpolation === "CUBICSPLINE" && this._createCubicSplineTrackInterpolant(k), a.push(k);
    }
    return a;
  }
  _getArrayFromAccessor(t) {
    let n = t.array;
    if (t.normalized) {
      const o = zd(n.constructor), s = new Float32Array(n.length);
      for (let l = 0, a = n.length; l < a; l++)
        s[l] = n[l] * o;
      n = s;
    }
    return n;
  }
  _createCubicSplineTrackInterpolant(t) {
    t.createInterpolant = function(o) {
      const s = this instanceof Tm ? kE : n1;
      return new s(this.times, this.values, this.getValueSize() / 3, o);
    }, t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function zE(e, t, n) {
  const o = t.attributes, s = new Rw();
  if (o.POSITION !== void 0) {
    const f = n.json.accessors[o.POSITION], p = f.min, m = f.max;
    if (p !== void 0 && m !== void 0) {
      if (s.set(
        new pt(p[0], p[1], p[2]),
        new pt(m[0], m[1], m[2])
      ), f.normalized) {
        const g = zd(ko[f.componentType]);
        s.min.multiplyScalar(g), s.max.multiplyScalar(g);
      }
    } else {
      console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      return;
    }
  } else
    return;
  const l = t.targets;
  if (l !== void 0) {
    const f = new pt(), p = new pt();
    for (let m = 0, g = l.length; m < g; m++) {
      const y = l[m];
      if (y.POSITION !== void 0) {
        const v = n.json.accessors[y.POSITION], x = v.min, k = v.max;
        if (x !== void 0 && k !== void 0) {
          if (p.setX(Math.max(Math.abs(x[0]), Math.abs(k[0]))), p.setY(Math.max(Math.abs(x[1]), Math.abs(k[1]))), p.setZ(Math.max(Math.abs(x[2]), Math.abs(k[2]))), v.normalized) {
            const L = zd(ko[v.componentType]);
            p.multiplyScalar(L);
          }
          f.max(p);
        } else
          console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      }
    }
    s.expandByVector(f);
  }
  e.boundingBox = s;
  const a = new Lw();
  s.getCenter(a.center), a.radius = s.min.distanceTo(s.max) / 2, e.boundingSphere = a;
}
function ty(e, t, n) {
  const o = t.attributes, s = [];
  function l(a, f) {
    return n.getDependency("accessor", a).then(function(p) {
      e.setAttribute(f, p);
    });
  }
  for (const a in o) {
    const f = jd[a] || a.toLowerCase();
    f in e.attributes || s.push(l(o[a], f));
  }
  if (t.indices !== void 0 && !e.index) {
    const a = n.getDependency("accessor", t.indices).then(function(f) {
      e.setIndex(f);
    });
    s.push(a);
  }
  return Df.workingColorSpace !== Zn && "COLOR_0" in o && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Df.workingColorSpace}" not supported.`), or(e, t), zE(e, t, n), Promise.all(s).then(function() {
    return t.targets !== void 0 ? RE(e, t.targets, n) : e;
  });
}
const Lf = /* @__PURE__ */ new WeakMap();
class IE extends fy {
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
  load(t, n, o, s) {
    const l = new Gu(this.manager);
    l.setPath(this.path), l.setResponseType("arraybuffer"), l.setRequestHeader(this.requestHeader), l.setWithCredentials(this.withCredentials), l.load(t, (a) => {
      this.parse(a, n, s);
    }, o, s);
  }
  parse(t, n, o = () => {
  }) {
    this.decodeDracoFile(t, n, null, null, Or, o).catch(o);
  }
  decodeDracoFile(t, n, o, s, l = Zn, a = () => {
  }) {
    const f = {
      attributeIDs: o || this.defaultAttributeIDs,
      attributeTypes: s || this.defaultAttributeTypes,
      useUniqueIDs: !!o,
      vertexColorSpace: l
    };
    return this.decodeGeometry(t, f).then(n).catch(a);
  }
  decodeGeometry(t, n) {
    const o = JSON.stringify(n);
    if (Lf.has(t)) {
      const p = Lf.get(t);
      if (p.key === o)
        return p.promise;
      if (t.byteLength === 0)
        throw new Error(
          "THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred."
        );
    }
    let s;
    const l = this.workerNextTaskID++, a = t.byteLength, f = this._getWorker(l, a).then((p) => (s = p, new Promise((m, g) => {
      s._callbacks[l] = { resolve: m, reject: g }, s.postMessage({ type: "decode", id: l, taskConfig: n, buffer: t }, [t]);
    }))).then((p) => this._createGeometry(p.geometry));
    return f.catch(() => !0).then(() => {
      s && l && this._releaseTask(s, l);
    }), Lf.set(t, {
      key: o,
      promise: f
    }), f;
  }
  _createGeometry(t) {
    const n = new gy();
    t.index && n.setIndex(new Rs(t.index.array, 1));
    for (let o = 0; o < t.attributes.length; o++) {
      const s = t.attributes[o], l = s.name, a = s.array, f = s.itemSize, p = new Rs(a, f);
      l === "color" && (this._assignVertexColorSpace(p, s.vertexColorSpace), p.normalized = !(a instanceof Float32Array)), n.setAttribute(l, p);
    }
    return n;
  }
  _assignVertexColorSpace(t, n) {
    if (n !== Or) return;
    const o = new Kr();
    for (let s = 0, l = t.count; s < l; s++)
      o.fromBufferAttribute(t, s), Df.toWorkingColorSpace(o, Or), t.setXYZ(s, o.r, o.g, o.b);
  }
  _loadLibrary(t, n) {
    const o = new Gu(this.manager);
    return o.setPath(this.decoderPath), o.setResponseType(n), o.setWithCredentials(this.withCredentials), new Promise((s, l) => {
      o.load(t, s, void 0, l);
    });
  }
  preload() {
    return this._initDecoder(), this;
  }
  _initDecoder() {
    if (this.decoderPending) return this.decoderPending;
    const t = typeof WebAssembly != "object" || this.decoderConfig.type === "js", n = [];
    return t ? n.push(this._loadLibrary("draco_decoder.js", "text")) : (n.push(this._loadLibrary("draco_wasm_wrapper.js", "text")), n.push(this._loadLibrary("draco_decoder.wasm", "arraybuffer"))), this.decoderPending = Promise.all(n).then((o) => {
      const s = o[0];
      t || (this.decoderConfig.wasmBinary = o[1]);
      const l = OE.toString(), a = [
        "/* draco decoder */",
        s,
        "",
        "/* worker */",
        l.substring(l.indexOf("{") + 1, l.lastIndexOf("}"))
      ].join(`
`);
      this.workerSourceURL = URL.createObjectURL(new Blob([a]));
    }), this.decoderPending;
  }
  _getWorker(t, n) {
    return this._initDecoder().then(() => {
      if (this.workerPool.length < this.workerLimit) {
        const s = new Worker(this.workerSourceURL);
        s._callbacks = {}, s._taskCosts = {}, s._taskLoad = 0, s.postMessage({ type: "init", decoderConfig: this.decoderConfig }), s.onmessage = function(l) {
          const a = l.data;
          switch (a.type) {
            case "decode":
              s._callbacks[a.id].resolve(a);
              break;
            case "error":
              s._callbacks[a.id].reject(a);
              break;
            default:
              console.error('THREE.DRACOLoader: Unexpected message, "' + a.type + '"');
          }
        }, this.workerPool.push(s);
      } else
        this.workerPool.sort(function(s, l) {
          return s._taskLoad > l._taskLoad ? -1 : 1;
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
function OE() {
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
            const x = n(y, v, new Int8Array(p), m), k = x.attributes.map((L) => L.array.buffer);
            x.index && k.push(x.index.array.buffer), self.postMessage({ type: "decode", id: f.id, geometry: x }, k);
          } catch (x) {
            console.error(x), self.postMessage({ type: "error", id: f.id, error: x.message });
          } finally {
            y.destroy(v);
          }
        });
        break;
    }
  };
  function n(a, f, p, m) {
    const g = m.attributeIDs, y = m.attributeTypes;
    let v, x;
    const k = f.GetEncodedGeometryType(p);
    if (k === a.TRIANGULAR_MESH)
      v = new a.Mesh(), x = f.DecodeArrayToMesh(p, p.byteLength, v);
    else if (k === a.POINT_CLOUD)
      v = new a.PointCloud(), x = f.DecodeArrayToPointCloud(p, p.byteLength, v);
    else
      throw new Error("THREE.DRACOLoader: Unexpected geometry type.");
    if (!x.ok() || v.ptr === 0)
      throw new Error("THREE.DRACOLoader: Decoding failed: " + x.error_msg());
    const L = { index: null, attributes: [] };
    for (const A in g) {
      const w = self[y[A]];
      let S, _;
      if (m.useUniqueIDs)
        _ = g[A], S = f.GetAttributeByUniqueId(v, _);
      else {
        if (_ = f.GetAttributeId(v, a[g[A]]), _ === -1) continue;
        S = f.GetAttribute(v, _);
      }
      const R = s(a, f, v, A, w, S);
      A === "color" && (R.vertexColorSpace = m.vertexColorSpace), L.attributes.push(R);
    }
    return k === a.TRIANGULAR_MESH && (L.index = o(a, f, v)), a.destroy(v), L;
  }
  function o(a, f, p) {
    const g = p.num_faces() * 3, y = g * 4, v = a._malloc(y);
    f.GetTrianglesUInt32Array(p, y, v);
    const x = new Uint32Array(a.HEAPF32.buffer, v, g).slice();
    return a._free(v), { array: x, itemSize: 1 };
  }
  function s(a, f, p, m, g, y) {
    const v = y.num_components(), k = p.num_points() * v, L = k * g.BYTES_PER_ELEMENT, A = l(a, g), w = a._malloc(L);
    f.GetAttributeDataArrayForAllPoints(p, y, A, L, w);
    const S = new g(a.HEAPF32.buffer, w, k).slice();
    return a._free(w), {
      name: m,
      array: S,
      itemSize: v
    };
  }
  function l(a, f) {
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
const r1 = new IE();
r1.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
function DE({ path: e, onSize: t }) {
  const n = Ap(eE, e, (l) => {
    l.setDRACOLoader(r1);
  }), { obj: o, size: s } = W.useMemo(() => {
    const l = n.scene.clone(!0), a = new se.Box3().setFromObject(l), f = a.getSize(new se.Vector3());
    return l.position.sub(a.getCenter(new se.Vector3())), l.position.y += f.y / 2, { obj: l, size: f };
  }, [n]);
  return W.useLayoutEffect(() => {
    t(s);
  }, [s]), /* @__PURE__ */ T.jsx("primitive", { object: o });
}
function FE({ dims: e }) {
  const t = W.useRef(null);
  qn(() => {
    t.current.rotation.y += 5e-3;
  });
  const [n, o, s] = [e.w / 10, e.h / 10, e.d / 10];
  return /* @__PURE__ */ T.jsxs("mesh", { ref: t, position: [0, o / 2, 0], children: [
    /* @__PURE__ */ T.jsx("boxGeometry", { args: [n, o, s] }),
    /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#2255aa", opacity: 0.55, transparent: !0 })
  ] });
}
function UE() {
  const e = W.useRef(null);
  return qn(({ clock: t }) => {
    e.current.rotation.y = t.getElapsedTime() * 2;
  }), /* @__PURE__ */ T.jsxs("mesh", { ref: e, children: [
    /* @__PURE__ */ T.jsx("torusGeometry", { args: [12, 3, 8, 24] }),
    /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#ffd700", wireframe: !0 })
  ] });
}
const ny = { type: "change" }, Np = { type: "start" }, i1 = { type: "end" }, Eu = new Mw(), ry = new Nw(), HE = Math.cos(70 * yy.DEG2RAD), Ve = new pt(), At = 2 * Math.PI, ye = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, Af = 1e-6;
class BE extends Aw {
  constructor(t, n = null) {
    super(t, n), this.state = ye.NONE, this.enabled = !0, this.target = new pt(), this.cursor = new pt(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: vo.ROTATE, MIDDLE: vo.DOLLY, RIGHT: vo.PAN }, this.touches = { ONE: no.ROTATE, TWO: no.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new pt(), this._lastQuaternion = new Vu(), this._lastTargetPosition = new pt(), this._quat = new Vu().setFromUnitVectors(t.up, new pt(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new km(), this._sphericalDelta = new km(), this._scale = 1, this._panOffset = new pt(), this._rotateStart = new Qt(), this._rotateEnd = new Qt(), this._rotateDelta = new Qt(), this._panStart = new Qt(), this._panEnd = new Qt(), this._panDelta = new Qt(), this._dollyStart = new Qt(), this._dollyEnd = new Qt(), this._dollyDelta = new Qt(), this._dollyDirection = new pt(), this._mouse = new Qt(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = WE.bind(this), this._onPointerDown = GE.bind(this), this._onPointerUp = VE.bind(this), this._onContextMenu = qE.bind(this), this._onMouseWheel = XE.bind(this), this._onKeyDown = YE.bind(this), this._onTouchStart = ZE.bind(this), this._onTouchMove = JE.bind(this), this._onMouseDown = KE.bind(this), this._onMouseMove = QE.bind(this), this._interceptControlDown = $E.bind(this), this._interceptControlUp = bE.bind(this), this.domElement !== null && this.connect(), this.update();
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(ny), this.update(), this.state = ye.NONE;
  }
  update(t = null) {
    const n = this.object.position;
    Ve.copy(n).sub(this.target), Ve.applyQuaternion(this._quat), this._spherical.setFromVector3(Ve), this.autoRotate && this.state === ye.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let o = this.minAzimuthAngle, s = this.maxAzimuthAngle;
    isFinite(o) && isFinite(s) && (o < -Math.PI ? o += At : o > Math.PI && (o -= At), s < -Math.PI ? s += At : s > Math.PI && (s -= At), o <= s ? this._spherical.theta = Math.max(o, Math.min(s, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (o + s) / 2 ? Math.max(o, this._spherical.theta) : Math.min(s, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
    let l = !1;
    if (this.zoomToCursor && this._performCursorZoom || this.object.isOrthographicCamera)
      this._spherical.radius = this._clampDistance(this._spherical.radius);
    else {
      const a = this._spherical.radius;
      this._spherical.radius = this._clampDistance(this._spherical.radius * this._scale), l = a != this._spherical.radius;
    }
    if (Ve.setFromSpherical(this._spherical), Ve.applyQuaternion(this._quatInverse), n.copy(this.target).add(Ve), this.object.lookAt(this.target), this.enableDamping === !0 ? (this._sphericalDelta.theta *= 1 - this.dampingFactor, this._sphericalDelta.phi *= 1 - this.dampingFactor, this._panOffset.multiplyScalar(1 - this.dampingFactor)) : (this._sphericalDelta.set(0, 0, 0), this._panOffset.set(0, 0, 0)), this.zoomToCursor && this._performCursorZoom) {
      let a = null;
      if (this.object.isPerspectiveCamera) {
        const f = Ve.length();
        a = this._clampDistance(f * this._scale);
        const p = f - a;
        this.object.position.addScaledVector(this._dollyDirection, p), this.object.updateMatrixWorld(), l = !!p;
      } else if (this.object.isOrthographicCamera) {
        const f = new pt(this._mouse.x, this._mouse.y, 0);
        f.unproject(this.object);
        const p = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), l = p !== this.object.zoom;
        const m = new pt(this._mouse.x, this._mouse.y, 0);
        m.unproject(this.object), this.object.position.sub(m).add(f), this.object.updateMatrixWorld(), a = Ve.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      a !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position) : (Eu.origin.copy(this.object.position), Eu.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(Eu.direction)) < HE ? this.object.lookAt(this.target) : (ry.setFromNormalAndCoplanarPoint(this.object.up, this.target), Eu.intersectPlane(ry, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const a = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), a !== this.object.zoom && (this.object.updateProjectionMatrix(), l = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, l || this._lastPosition.distanceToSquared(this.object.position) > Af || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > Af || this._lastTargetPosition.distanceToSquared(this.target) > Af ? (this.dispatchEvent(ny), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
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
      const s = this.object.position;
      Ve.copy(s).sub(this.target);
      let l = Ve.length();
      l *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * l / o.clientHeight, this.object.matrix), this._panUp(2 * n * l / o.clientHeight, this.object.matrix);
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
    const o = this.domElement.getBoundingClientRect(), s = t - o.left, l = n - o.top, a = o.width, f = o.height;
    this._mouse.x = s / a * 2 - 1, this._mouse.y = -(l / f) * 2 + 1, this._dollyDirection.set(this._mouse.x, this._mouse.y, 1).unproject(this.object).sub(this.object.position).normalize();
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
      const n = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + n.x), s = 0.5 * (t.pageY + n.y);
      this._rotateStart.set(o, s);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + n.x), s = 0.5 * (t.pageY + n.y);
      this._panStart.set(o, s);
    }
  }
  _handleTouchStartDolly(t) {
    const n = this._getSecondPointerPosition(t), o = t.pageX - n.x, s = t.pageY - n.y, l = Math.sqrt(o * o + s * s);
    this._dollyStart.set(0, l);
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
      const o = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + o.x), l = 0.5 * (t.pageY + o.y);
      this._rotateEnd.set(s, l);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n = this.domElement;
    this._rotateLeft(At * this._rotateDelta.x / n.clientHeight), this._rotateUp(At * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), o = 0.5 * (t.pageX + n.x), s = 0.5 * (t.pageY + n.y);
      this._panEnd.set(o, s);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const n = this._getSecondPointerPosition(t), o = t.pageX - n.x, s = t.pageY - n.y, l = Math.sqrt(o * o + s * s);
    this._dollyEnd.set(0, l), this._dollyDelta.set(0, Math.pow(this._dollyEnd.y / this._dollyStart.y, this.zoomSpeed)), this._dollyOut(this._dollyDelta.y), this._dollyStart.copy(this._dollyEnd);
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
    n === void 0 && (n = new Qt(), this._pointerPositions[t.pointerId] = n), n.set(t.pageX, t.pageY);
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
function GE(e) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e)));
}
function WE(e) {
  this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function VE(e) {
  switch (this._removePointer(e), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(e.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(i1), this.state = ye.NONE;
      break;
    case 1:
      const t = this._pointers[0], n = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: n.x, pageY: n.y });
      break;
  }
}
function KE(e) {
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
    case vo.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(e), this.state = ye.DOLLY;
      break;
    case vo.ROTATE:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = ye.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = ye.ROTATE;
      }
      break;
    case vo.PAN:
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
  this.state !== ye.NONE && this.dispatchEvent(Np);
}
function QE(e) {
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
function XE(e) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== ye.NONE || (e.preventDefault(), this.dispatchEvent(Np), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(i1));
}
function YE(e) {
  this.enabled === !1 || this.enablePan === !1 || this._handleKeyDown(e);
}
function ZE(e) {
  switch (this._trackPointer(e), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case no.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(e), this.state = ye.TOUCH_ROTATE;
          break;
        case no.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(e), this.state = ye.TOUCH_PAN;
          break;
        default:
          this.state = ye.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case no.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(e), this.state = ye.TOUCH_DOLLY_PAN;
          break;
        case no.DOLLY_ROTATE:
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
  this.state !== ye.NONE && this.dispatchEvent(Np);
}
function JE(e) {
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
function qE(e) {
  this.enabled !== !1 && e.preventDefault();
}
function $E(e) {
  e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function bE(e) {
  e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function eT({ size: e }) {
  const { camera: t, gl: n } = N2(), o = W.useRef(null);
  return W.useEffect(() => {
    const s = new BE(t, n.domElement);
    return s.enableDamping = !0, s.dampingFactor = 0.08, s.autoRotate = !0, s.autoRotateSpeed = 1.5, o.current = s, () => s.dispose();
  }, [t, n]), W.useEffect(() => {
    if (!o.current) return;
    const s = Math.max(e.x, e.y, e.z), l = t, a = se.MathUtils.degToRad(l.fov), f = s / 2 / Math.tan(a / 2) * 1.9;
    t.position.set(f * 0.6, f * 0.5, f), l.near = Math.max(0.01, f * 0.01), l.far = f * 20, l.updateProjectionMatrix(), o.current.target.set(0, 0, 0), o.current.update();
  }, [e]), qn(() => {
    var s;
    return (s = o.current) == null ? void 0 : s.update();
  }), null;
}
const an = 45, _n = 47, Nt = 50, _e = 1.5, Mf = Nt - _e * 2, Nf = an - _e * 2;
function tT({ actionState: e, onSize: t }) {
  const n = W.useRef(null), o = e["freezer-toggle"] ?? !1;
  return W.useLayoutEffect(() => {
    t(new se.Vector3(_n, Nt, an));
  }, []), qn(() => {
    const s = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (s - n.current.rotation.y) * 0.12;
  }), // Centré sur X et Z, centré verticalement (décalage -FRZ_H/2)
  /* @__PURE__ */ T.jsxs("group", { position: [0, -Nt / 2, 0], children: [
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _e,
        sy: Nt,
        sz: an,
        x: -_n / 2 + _e / 2,
        y: Nt / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _n,
        sy: _e,
        sz: an,
        x: 0,
        y: Nt - _e / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _n,
        sy: _e,
        sz: an,
        x: 0,
        y: _e / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _n - _e,
        sy: Mf,
        sz: _e,
        x: _e / 2,
        y: Nt / 2,
        z: -an / 2 + _e / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _n - _e,
        sy: Mf,
        sz: _e,
        x: _e / 2,
        y: Nt / 2,
        z: an / 2 - _e / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: 0.5,
        sy: Mf,
        sz: Nf,
        x: -_n / 2 + _e + 0.25,
        y: Nt / 2,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _n - _e - 1,
        sy: _e,
        sz: Nf,
        x: _e / 2 - 0.5,
        y: Nt * 0.35,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ T.jsx(
      Rr,
      {
        sx: _n - _e - 1,
        sy: _e,
        sz: Nf,
        x: _e / 2 - 0.5,
        y: Nt * 0.6,
        z: 0,
        col: "#dddddd"
      }
    ),
    [-1, 1].flatMap(
      (s) => [-1, 1].map((l) => /* @__PURE__ */ T.jsxs(
        "mesh",
        {
          position: [l * (_n / 2 - 3), 1, s * (an / 2 - 3)],
          children: [
            /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [1.5, 1.5, 2, 8] }),
            /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
          ]
        },
        `${l}${s}`
      ))
    ),
    /* @__PURE__ */ T.jsxs("group", { ref: n, position: [_n / 2, 0, -an / 2], children: [
      /* @__PURE__ */ T.jsxs("mesh", { position: [0, Nt / 2, an / 2], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [_e, Nt - 2, an - _e] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.3, metalness: 0.2 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [_e / 2 + 0.9, Nt / 2, an - 7], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [1.5, 25, 1.5] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function Rr({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: s,
  z: l,
  col: a
}) {
  return /* @__PURE__ */ T.jsxs("mesh", { position: [o, s, l], children: [
    /* @__PURE__ */ T.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: a, roughness: 0.3, metalness: 0.1 })
  ] });
}
const xe = 60, En = 60, dt = 90, me = 1.5, Hn = 8, Tu = 10, di = 1.2, iy = 6, $i = 5 + di + 1;
function nT({ actionState: e, onSize: t }) {
  const n = W.useRef(null), o = e["fridge-toggle"] ?? !1;
  return W.useLayoutEffect(() => {
    t(new se.Vector3(xe, dt, En));
  }, []), qn(() => {
    const s = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (s - n.current.rotation.y) * 0.12;
  }), // Centré en X/Z, centré verticalement
  /* @__PURE__ */ T.jsxs("group", { position: [0, -dt / 2, 0], children: [
    /* @__PURE__ */ T.jsx(Bn, { sx: xe, sy: dt, sz: me, x: 0, y: dt / 2, z: En / 2 - me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ T.jsx(Bn, { sx: xe, sy: me, sz: En, x: 0, y: dt - me / 2, z: 0, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ T.jsx(Bn, { sx: xe, sy: me, sz: En, x: 0, y: me / 2, z: 0, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ T.jsx(Bn, { sx: me, sy: dt - me * 2, sz: En - me, x: -xe / 2 + me / 2, y: dt / 2, z: -me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ T.jsx(Bn, { sx: me, sy: dt - me * 2, sz: En - me, x: xe / 2 - me / 2, y: dt / 2, z: -me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ T.jsx(Bn, { sx: xe - me * 2, sy: dt - me * 2, sz: 0.5, x: 0, y: dt / 2, z: En / 2 - me - 0.3, col: "#e0e0e0" }),
    /* @__PURE__ */ T.jsx(Bn, { sx: xe - me * 2 - 2, sy: me, sz: En - me * 2, x: 0, y: dt * 0.35, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ T.jsx(Bn, { sx: xe - me * 2 - 2, sy: me, sz: En - me * 2, x: 0, y: dt * 0.62, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ T.jsx(Bn, { sx: xe - me * 2 - 4, sy: 10, sz: En - me * 2 - 4, x: 0, y: me + 5, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ T.jsxs("group", { ref: n, position: [-xe / 2, 0, -En / 2], children: [
      /* @__PURE__ */ T.jsx(Bn, { sx: xe - 2, sy: dt - 2, sz: Hn, x: xe / 2, y: dt / 2, z: Hn / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe - 10, dt * 0.6, -1.5], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [1.5, 30, 2.5] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.2 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, $i + di / 2, Hn + Tu / 2], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [xe - 8, di, Tu] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, $i + di + iy / 2, Hn + 0.6], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [xe - 8, iy, 1.2] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, 56 + di / 2, Hn + Tu / 2], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [xe - 8, di, Tu] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, 56 + di + 2, Hn + 0.6], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [xe - 8, 4, 1.2] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, $i + 22, Hn + 5], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [3.8, 4.5, 44, 20] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.3, transparent: !0, opacity: 0.88 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, $i + 22, Hn + 5], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [4.51, 4.51, 20, 20] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#ff8c00", roughness: 0.3 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, $i + 44 + 2, Hn + 5], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [2, 3.5, 4, 16] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.3, transparent: !0, opacity: 0.88 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [xe / 2, $i + 44 + 4 + 1, Hn + 5], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [2.2, 2.2, 2, 16] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#ffcc00", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function Bn({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: s,
  z: l,
  col: a,
  r: f = 0.3,
  m: p = 0.1
}) {
  return /* @__PURE__ */ T.jsxs("mesh", { position: [o, s, l], children: [
    /* @__PURE__ */ T.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: a, roughness: f, metalness: p })
  ] });
}
const Tn = 40, Lr = 60, Mt = 90, Fe = 1.5, oy = 1.5;
function rT({ actionState: e, onSize: t }) {
  const n = W.useRef(null), o = e["cabinet-toggle"] ?? !1;
  return W.useLayoutEffect(() => {
    t(new se.Vector3(Tn, Mt, Lr));
  }, []), qn(() => {
    const s = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (s - n.current.rotation.y) * 0.12;
  }), // Centré en X/Z, centré verticalement
  /* @__PURE__ */ T.jsxs("group", { position: [0, -Mt / 2, 0], children: [
    /* @__PURE__ */ T.jsx(ui, { sx: Tn, sy: Mt, sz: Fe, x: 0, y: Mt / 2, z: Lr / 2 - Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ T.jsx(ui, { sx: Tn, sy: Fe, sz: Lr, x: 0, y: Fe / 2, z: 0, col: "#ffffff" }),
    /* @__PURE__ */ T.jsx(ui, { sx: Fe, sy: Mt - Fe * 2, sz: Lr - Fe, x: -Tn / 2 + Fe / 2, y: Mt / 2, z: -Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ T.jsx(ui, { sx: Fe, sy: Mt - Fe * 2, sz: Lr - Fe, x: Tn / 2 - Fe / 2, y: Mt / 2, z: -Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ T.jsx(ui, { sx: Tn - Fe * 2, sy: Mt - Fe * 2, sz: 0.5, x: 0, y: Mt / 2, z: Lr / 2 - Fe - 0.3, col: "#eeeeee" }),
    /* @__PURE__ */ T.jsx(ui, { sx: Tn - Fe * 2 - 2, sy: Fe, sz: Lr - Fe * 2, x: 0, y: Mt * 0.3, z: -Fe / 2, col: "#eeeeee" }),
    /* @__PURE__ */ T.jsxs("group", { ref: n, position: [-Tn / 2, 0, -Lr / 2], children: [
      /* @__PURE__ */ T.jsx(ui, { sx: Tn - 2, sy: Mt - 2, sz: oy, x: Tn / 2, y: Mt / 2, z: oy / 2, col: "#ffffff" }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [Tn - 8, Mt / 2, -1.5], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [1.5, 15, 2] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.2 })
      ] })
    ] })
  ] });
}
function ui({
  sx: e,
  sy: t,
  sz: n,
  x: o,
  y: s,
  z: l,
  col: a
}) {
  return /* @__PURE__ */ T.jsxs("mesh", { position: [o, s, l], children: [
    /* @__PURE__ */ T.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: a, roughness: 0.35, metalness: 0 })
  ] });
}
const Kn = 40, ku = 37, Gn = 60, ai = 2;
function o1({
  actionKey: e,
  pivotX: t,
  panelX: n,
  handleX: o,
  openAngle: s,
  actionState: l,
  onSize: a
}) {
  const f = W.useRef(null), p = l[e] ?? !1;
  W.useLayoutEffect(() => {
    a(new se.Vector3(Kn, Gn, ku));
  }, []), qn(() => {
    const y = p ? s : 0;
    f.current.rotation.y += (y - f.current.rotation.y) * 0.12;
  });
  const m = { color: "#f0f0f0", roughness: 0.3 }, g = { color: "#eeeeee", roughness: 0.4 };
  return /* @__PURE__ */ T.jsxs("group", { position: [0, -Gn / 2, 0], children: [
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, Gn / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Kn, Gn, ku] }),
      /* @__PURE__ */ T.jsx("meshStandardMaterial", { ...m })
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, Gn / 2, ku / 2 - 0.4], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Kn - ai * 2, Gn - ai * 2, 0.5] }),
      /* @__PURE__ */ T.jsx("meshStandardMaterial", { ...g })
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, Gn * 0.5, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Kn - ai * 2 - 2, ai, ku - ai * 2] }),
      /* @__PURE__ */ T.jsx("meshStandardMaterial", { ...g })
    ] }),
    /* @__PURE__ */ T.jsxs("group", { ref: f, position: [t, 0, -19.5], children: [
      /* @__PURE__ */ T.jsxs("mesh", { position: [n, Gn / 2, 0], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [Kn - 2, Gn - 2, ai] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#f5f5f5", roughness: 0.2 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [o, Gn * 0.6, ai / 2 + 0.75], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [2, 12, 1.5] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.3 })
      ] })
    ] })
  ] });
}
function iT({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ T.jsx(
    o1,
    {
      actionKey: "cbn-west-toggle",
      pivotX: -Kn / 2,
      panelX: Kn / 2,
      handleX: Kn - 6,
      openAngle: -Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
function oT({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ T.jsx(
    o1,
    {
      actionKey: "cbn-east-toggle",
      pivotX: Kn / 2,
      panelX: -Kn / 2,
      handleX: -34,
      openAngle: Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
const Qn = 90, vt = 204, jf = 4, vs = 1.3, jt = 3, pi = 10, wi = 250, Uu = 20, s1 = Qn + jt * 2 + Uu * 2, sy = wi - vt;
function sT() {
  const e = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#e8e4dc", roughness: 0.9 }), t = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#cc0000", roughness: 0.5 }), n = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#f5f5f0", roughness: 0.3 });
  return /* @__PURE__ */ T.jsxs(T.Fragment, { children: [
    /* @__PURE__ */ T.jsxs("mesh", { position: [-58, wi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Uu, wi, pi] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [Qn / 2 + jt + Uu / 2, wi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Uu, wi, pi] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, vt + sy / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [s1, sy, pi] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [-46.5, vt / 2, -5.5], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [jt, vt, 1] }),
      t
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [Qn / 2 + jt / 2, vt / 2, -5.5], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [jt, vt, 1] }),
      t
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, vt + jt / 2, -5.5], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Qn + jt * 2, jt, 1] }),
      t
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [-46.5, vt / 2, pi / 2 + 0.5], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [jt, vt, 1] }),
      n
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [Qn / 2 + jt / 2, vt / 2, pi / 2 + 0.5], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [jt, vt, 1] }),
      n
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, vt + jt / 2, pi / 2 + 0.5], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Qn + jt * 2, jt, 1] }),
      n
    ] })
  ] });
}
function lT({ actionState: e, onSize: t }) {
  const n = W.useRef(null), o = e["entry-door-toggle"] ?? !1;
  W.useLayoutEffect(() => {
    t(new se.Vector3(s1, wi, pi));
  }, []), qn(() => {
    const f = o ? -(2 * Math.PI / 3) : 0;
    n.current.rotation.y += (f - n.current.rotation.y) * 0.12;
  });
  const s = 70, l = 100, a = jf / 2;
  return /* @__PURE__ */ T.jsxs("group", { position: [0, -wi / 2, 0], children: [
    /* @__PURE__ */ T.jsx(sT, {}),
    /* @__PURE__ */ T.jsxs("group", { ref: n, position: [-Qn / 2, 0, 0], children: [
      /* @__PURE__ */ T.jsxs("mesh", { position: [Qn / 2, vt / 2, 0], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [Qn, vt, jf] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#cc0000", roughness: 0.5, metalness: 0.1 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [s, l, a + 0.5], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [3, 3, 1, 12] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [s, l, a + 3.5], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [vs, vs, 5, 8] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [s - 7, l, a + 6], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [vs, vs, 14, 8] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }),
      [s, s - 14].map((f, p) => /* @__PURE__ */ T.jsxs("mesh", { position: [f, l, a + 6], children: [
        /* @__PURE__ */ T.jsx("sphereGeometry", { args: [vs, 8, 6] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }, p)),
      /* @__PURE__ */ T.jsxs("mesh", { position: [Qn / 2, vt / 2, -jf / 2 - 5], children: [
        /* @__PURE__ */ T.jsx("sphereGeometry", { args: [5, 16, 12] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#cc0000", metalness: 0.3, roughness: 0.4 })
      ] })
    ] })
  ] });
}
const An = 83, lr = 204, ks = 4, Ss = 1.3, hi = 2.5, mi = 10, xi = 250, Hu = 20, l1 = An + hi * 2 + Hu * 2, ly = xi - lr;
function uT() {
  const e = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#e8e4dc", roughness: 0.9 }), t = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#f0ede8", roughness: 0.35 });
  return /* @__PURE__ */ T.jsxs(T.Fragment, { children: [
    /* @__PURE__ */ T.jsxs("mesh", { position: [-54, xi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Hu, xi, mi] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [An / 2 + hi + Hu / 2, xi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Hu, xi, mi] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, lr + ly / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [l1, ly, mi] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [-42.75, lr / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [hi, lr, mi] }),
      t
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [An / 2 + hi / 2, lr / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [hi, lr, mi] }),
      t
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, lr + hi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [An, hi, mi] }),
      t
    ] })
  ] });
}
function aT({ handleX: e, mancheDir: t }) {
  const o = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 });
  return /* @__PURE__ */ T.jsx(T.Fragment, { children: [-1, 1].map((s) => /* @__PURE__ */ T.jsxs("group", { children: [
    /* @__PURE__ */ T.jsxs("mesh", { position: [e, 100, s * (ks / 2 + 0.5)], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [3, 3, 1, 12] }),
      o
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [e, 100, s * (ks / 2 + 3.5)], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [Ss, Ss, 5, 8] }),
      o
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [e + t * 7, 100, s * (ks / 2 + 6)], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ T.jsx("cylinderGeometry", { args: [Ss, Ss, 14, 8] }),
      o
    ] }),
    [0, t * 14].map((l, a) => /* @__PURE__ */ T.jsxs("mesh", { position: [e + l, 100, s * (ks / 2 + 6)], children: [
      /* @__PURE__ */ T.jsx("sphereGeometry", { args: [Ss, 8, 6] }),
      o
    ] }, a))
  ] }, s)) });
}
function u1({
  actionKey: e,
  pivotX: t,
  panelX: n,
  handleX: o,
  mancheDir: s,
  openAngle: l,
  actionState: a,
  onSize: f
}) {
  const p = W.useRef(null), m = a[e] ?? !1;
  return W.useLayoutEffect(() => {
    f(new se.Vector3(l1, xi, mi));
  }, []), qn(() => {
    const g = m ? l : 0;
    p.current.rotation.y += (g - p.current.rotation.y) * 0.12;
  }), /* @__PURE__ */ T.jsxs("group", { position: [0, -xi / 2, 0], children: [
    /* @__PURE__ */ T.jsx(uT, {}),
    /* @__PURE__ */ T.jsxs("group", { ref: p, position: [t, 0, 0], children: [
      /* @__PURE__ */ T.jsxs("mesh", { position: [n, lr / 2, 0], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [An, lr, ks] }),
        /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#f5f5f5", roughness: 0.4 })
      ] }),
      /* @__PURE__ */ T.jsx(aT, { handleX: o, mancheDir: s })
    ] })
  ] });
}
function cT({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ T.jsx(
    u1,
    {
      actionKey: "living-door-toggle",
      pivotX: An / 2,
      panelX: -An / 2,
      handleX: -An + 15,
      mancheDir: 1,
      openAngle: -Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
function fT({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ T.jsx(
    u1,
    {
      actionKey: "bathroom-door-toggle",
      pivotX: -An / 2,
      panelX: An / 2,
      handleX: An - 15,
      mancheDir: -1,
      openAngle: Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
const zo = 160, _i = zo / 2, Ei = 20, tl = 190, a1 = Ei + tl, zt = 8, yo = 5, bi = tl - zt * 2, dT = _i - zt * 2, Ps = 10, Ti = 250, Bu = 20, c1 = zo + Bu * 2, uy = Ti - a1;
function ay({ cx: e, baseY: t }) {
  const n = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#f0f0f0", roughness: 0.3 }), o = /* @__PURE__ */ T.jsx(
    "meshPhysicalMaterial",
    {
      color: "#88ccff",
      transparent: !0,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.1,
      side: se.DoubleSide
    }
  );
  return /* @__PURE__ */ T.jsxs(T.Fragment, { children: [
    /* @__PURE__ */ T.jsxs("mesh", { position: [e, t + tl - zt / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [_i, zt, yo] }),
      n
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [e, t + zt / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [_i, zt, yo] }),
      n
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [e - _i / 2 + zt / 2, t + zt + bi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [zt, bi, yo] }),
      n
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [e + _i / 2 - zt / 2, t + zt + bi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [zt, bi, yo] }),
      n
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [e, t + zt + bi / 2, 0], children: [
      /* @__PURE__ */ T.jsx("planeGeometry", { args: [dT, bi] }),
      o
    ] })
  ] });
}
function pT() {
  const e = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#e0dbd4", roughness: 0.9 });
  return /* @__PURE__ */ T.jsxs(T.Fragment, { children: [
    /* @__PURE__ */ T.jsxs("mesh", { position: [-90, Ti / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Bu, Ti, Ps] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [zo / 2 + Bu / 2, Ti / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [Bu, Ti, Ps] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, a1 + uy / 2, 0], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [c1, uy, Ps] }),
      e
    ] }),
    /* @__PURE__ */ T.jsxs("mesh", { position: [0, Ei / 2, -4], children: [
      /* @__PURE__ */ T.jsx("boxGeometry", { args: [zo, Ei, Ps + 4] }),
      e
    ] })
  ] });
}
function hT({ actionState: e, onSize: t }) {
  const n = W.useRef(null), o = e["door-toggle"] ?? !1;
  W.useLayoutEffect(() => {
    t(new se.Vector3(c1, Ti, Ps));
  }, []), qn(() => {
    const a = o ? Math.PI / 2 : 0;
    n.current.rotation.y += (a - n.current.rotation.y) * 0.12;
  });
  const s = /* @__PURE__ */ T.jsx("meshStandardMaterial", { color: "#888888", metalness: 0.6, roughness: 0.3 }), l = -_i + zt + 4;
  return /* @__PURE__ */ T.jsxs("group", { position: [0, -Ti / 2, 0], children: [
    /* @__PURE__ */ T.jsx(pT, {}),
    /* @__PURE__ */ T.jsx(ay, { cx: -zo / 4, baseY: Ei }),
    /* @__PURE__ */ T.jsxs("group", { ref: n, position: [zo / 2, 0, 0], children: [
      /* @__PURE__ */ T.jsx(ay, { cx: -_i / 2, baseY: Ei }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [l, Ei + tl * 0.5, yo / 2 + 0.5], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [3, 20, 1] }),
        s
      ] }),
      /* @__PURE__ */ T.jsxs("mesh", { position: [l - 1, Ei + tl * 0.5, yo / 2 + 4], children: [
        /* @__PURE__ */ T.jsx("boxGeometry", { args: [1.5, 1.5, 8] }),
        s
      ] })
    ] })
  ] });
}
const mT = {
  freezer: tT,
  fridge: nT,
  "cabinet-wood": rT,
  "bathroom-cabinet-west": iT,
  "bathroom-cabinet-east": oT,
  "door-entry": lT,
  "door-living": cT,
  "door-sdb": fT,
  "door-glass": hT
}, gT = {
  "freezer-toggle": ["Ouvrir", "Fermer"],
  "fridge-toggle": ["Ouvrir", "Fermer"],
  "cabinet-toggle": ["Ouvrir", "Fermer"],
  "cbn-west-toggle": ["Ouvrir", "Fermer"],
  "cbn-east-toggle": ["Ouvrir", "Fermer"],
  "entry-door-toggle": ["Ouvrir", "Fermer"],
  "living-door-toggle": ["Ouvrir", "Fermer"],
  "bathroom-door-toggle": ["Ouvrir", "Fermer"],
  "door-toggle": ["Ouvrir", "Fermer"]
};
function yT({ item: e, actionState: t }) {
  const [n, o] = W.useState(null), s = W.useMemo(() => {
    const a = (e == null ? void 0 : e.dims) ?? { w: 50, h: 50, d: 50 };
    return new se.Vector3(a.w / 10, a.h / 10, a.d / 10);
  }, []), l = e != null && e.id ? mT[e.id] : void 0;
  return /* @__PURE__ */ T.jsxs(T.Fragment, { children: [
    /* @__PURE__ */ T.jsx("ambientLight", { intensity: 0.7 }),
    /* @__PURE__ */ T.jsx("directionalLight", { position: [200, 400, 300], intensity: 1.3 }),
    /* @__PURE__ */ T.jsx("directionalLight", { position: [-150, 80, -200], intensity: 0.4 }),
    /* @__PURE__ */ T.jsx(eT, { size: n ?? s }),
    l ? (
      // Composant TSX dédié (géométrie procédurale + interactivité)
      /* @__PURE__ */ T.jsx(l, { item: e, actionState: t, onSize: o })
    ) : e != null && e.glbPath ? (
      // Chargement GLB générique
      /* @__PURE__ */ T.jsx(W.Suspense, { fallback: /* @__PURE__ */ T.jsx(UE, {}), children: /* @__PURE__ */ T.jsx(DE, { path: e.glbPath, onSize: o }) })
    ) : e ? (
      // Fallback : boîte aux dimensions de l'inventaire (dims peut être absent pour les espaces)
      /* @__PURE__ */ T.jsx(FE, { dims: e.dims ?? { w: 50, h: 50, d: 50 } })
    ) : null
  ] });
}
function vT({ item: e, onAction: t }) {
  var l;
  const [n, o] = W.useState({});
  W.useEffect(() => {
    o({});
  }, [e == null ? void 0 : e.id]);
  const s = (a) => {
    o((f) => ({ ...f, [a]: !f[a] })), t == null || t(a);
  };
  return /* @__PURE__ */ T.jsxs("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#111118",
    fontFamily: "'Segoe UI', sans-serif"
  }, children: [
    /* @__PURE__ */ T.jsx("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ T.jsx(
      b2,
      {
        style: { width: "100%", height: "100%" },
        camera: { position: [0, 50, 200], fov: 45 },
        gl: { antialias: !0 },
        children: /* @__PURE__ */ T.jsx(
          yT,
          {
            item: e,
            actionState: n
          },
          (e == null ? void 0 : e.id) ?? "__empty__"
        )
      }
    ) }),
    /* @__PURE__ */ T.jsx("div", { style: {
      fontSize: 11,
      color: "#888",
      textAlign: "center",
      padding: "6px 8px",
      minHeight: 32
    }, children: e ? /* @__PURE__ */ T.jsxs(T.Fragment, { children: [
      /* @__PURE__ */ T.jsx("strong", { style: { color: "#fff" }, children: e.name }),
      e.dims && /* @__PURE__ */ T.jsxs("span", { style: { color: "#666", marginLeft: 6, fontFamily: "monospace" }, children: [
        e.dims.w,
        " × ",
        e.dims.d,
        " × ",
        e.dims.h,
        " cm"
      ] })
    ] }) : "Clique sur un objet" }),
    (l = e == null ? void 0 : e.actions) != null && l.length ? /* @__PURE__ */ T.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 8px 8px" }, children: e.actions.map((a) => {
      const [f, p] = gT[a] ?? [a, a], m = n[a] ?? !1;
      return /* @__PURE__ */ T.jsx(
        "button",
        {
          onClick: () => s(a),
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
const ga = /* @__PURE__ */ new WeakMap();
function wT(e, t, n) {
  let o = ga.get(e);
  o || (o = Mv(e), ga.set(e, o)), o.render(/* @__PURE__ */ T.jsx(vT, { item: t, onAction: n }));
}
function xT(e) {
  const t = ga.get(e);
  t && (t.unmount(), ga.delete(e));
}
export {
  wT as mountPreview,
  xT as unmountPreview
};
