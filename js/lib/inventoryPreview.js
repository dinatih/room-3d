import * as ie from "three";
import { TrianglesDrawMode as nS, TriangleFanDrawMode as Bf, TriangleStripDrawMode as yy, Loader as vy, LoaderUtils as js, FileLoader as Yu, MeshPhysicalMaterial as qn, Vector2 as Xt, Color as Zr, LinearSRGBColorSpace as Jn, SRGBColorSpace as Hr, SpotLight as rS, PointLight as oS, DirectionalLight as iS, Matrix4 as Zu, Vector3 as ht, Quaternion as Ju, InstancedMesh as sS, InstancedBufferAttribute as lS, Object3D as xy, TextureLoader as uS, ImageBitmapLoader as aS, BufferAttribute as zs, InterleavedBuffer as cS, InterleavedBufferAttribute as fS, LinearMipmapLinearFilter as Sy, NearestMipmapLinearFilter as dS, LinearMipmapNearestFilter as pS, NearestMipmapNearestFilter as hS, LinearFilter as Gf, NearestFilter as wy, RepeatWrapping as Wf, MirroredRepeatWrapping as mS, ClampToEdgeWrapping as gS, PointsMaterial as yS, Material as Zc, LineBasicMaterial as vS, MeshStandardMaterial as _y, DoubleSide as xS, MeshBasicMaterial as Ts, PropertyBinding as SS, BufferGeometry as Ey, SkinnedMesh as wS, Mesh as _S, LineSegments as ES, Line as kS, LineLoop as TS, Points as PS, Group as Jc, PerspectiveCamera as CS, MathUtils as ky, OrthographicCamera as RS, Skeleton as AS, AnimationClip as LS, Bone as MS, InterpolateDiscrete as NS, InterpolateLinear as Ty, Texture as Rm, VectorKeyframeTrack as Am, NumberKeyframeTrack as Lm, QuaternionKeyframeTrack as Mm, ColorManagement as Vf, FrontSide as jS, Interpolant as zS, Box3 as IS, Sphere as OS, Controls as DS, MOUSE as Ei, TOUCH as ui, Spherical as Nm, Ray as FS, Plane as US } from "three";
function HS(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Py = { exports: {} }, Ea = {}, Cy = { exports: {} }, ae = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ul = Symbol.for("react.element"), BS = Symbol.for("react.portal"), GS = Symbol.for("react.fragment"), WS = Symbol.for("react.strict_mode"), VS = Symbol.for("react.profiler"), KS = Symbol.for("react.provider"), QS = Symbol.for("react.context"), XS = Symbol.for("react.forward_ref"), YS = Symbol.for("react.suspense"), ZS = Symbol.for("react.memo"), JS = Symbol.for("react.lazy"), jm = Symbol.iterator;
function qS(e) {
  return e === null || typeof e != "object" ? null : (e = jm && e[jm] || e["@@iterator"], typeof e == "function" ? e : null);
}
var Ry = { isMounted: function() {
  return !1;
}, enqueueForceUpdate: function() {
}, enqueueReplaceState: function() {
}, enqueueSetState: function() {
} }, Ay = Object.assign, Ly = {};
function Hi(e, t, n) {
  this.props = e, this.context = t, this.refs = Ly, this.updater = n || Ry;
}
Hi.prototype.isReactComponent = {};
Hi.prototype.setState = function(e, t) {
  if (typeof e != "object" && typeof e != "function" && e != null) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
  this.updater.enqueueSetState(this, e, t, "setState");
};
Hi.prototype.forceUpdate = function(e) {
  this.updater.enqueueForceUpdate(this, e, "forceUpdate");
};
function My() {
}
My.prototype = Hi.prototype;
function Gd(e, t, n) {
  this.props = e, this.context = t, this.refs = Ly, this.updater = n || Ry;
}
var Wd = Gd.prototype = new My();
Wd.constructor = Gd;
Ay(Wd, Hi.prototype);
Wd.isPureReactComponent = !0;
var zm = Array.isArray, Ny = Object.prototype.hasOwnProperty, Vd = { current: null }, jy = { key: !0, ref: !0, __self: !0, __source: !0 };
function zy(e, t, n) {
  var i, s = {}, l = null, a = null;
  if (t != null) for (i in t.ref !== void 0 && (a = t.ref), t.key !== void 0 && (l = "" + t.key), t) Ny.call(t, i) && !jy.hasOwnProperty(i) && (s[i] = t[i]);
  var f = arguments.length - 2;
  if (f === 1) s.children = n;
  else if (1 < f) {
    for (var p = Array(f), m = 0; m < f; m++) p[m] = arguments[m + 2];
    s.children = p;
  }
  if (e && e.defaultProps) for (i in f = e.defaultProps, f) s[i] === void 0 && (s[i] = f[i]);
  return { $$typeof: ul, type: e, key: l, ref: a, props: s, _owner: Vd.current };
}
function $S(e, t) {
  return { $$typeof: ul, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Kd(e) {
  return typeof e == "object" && e !== null && e.$$typeof === ul;
}
function bS(e) {
  var t = { "=": "=0", ":": "=2" };
  return "$" + e.replace(/[=:]/g, function(n) {
    return t[n];
  });
}
var Im = /\/+/g;
function qc(e, t) {
  return typeof e == "object" && e !== null && e.key != null ? bS("" + e.key) : t.toString(36);
}
function Nu(e, t, n, i, s) {
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
        case ul:
        case BS:
          a = !0;
      }
  }
  if (a) return a = e, s = s(a), e = i === "" ? "." + qc(a, 0) : i, zm(s) ? (n = "", e != null && (n = e.replace(Im, "$&/") + "/"), Nu(s, t, n, "", function(m) {
    return m;
  })) : s != null && (Kd(s) && (s = $S(s, n + (!s.key || a && a.key === s.key ? "" : ("" + s.key).replace(Im, "$&/") + "/") + e)), t.push(s)), 1;
  if (a = 0, i = i === "" ? "." : i + ":", zm(e)) for (var f = 0; f < e.length; f++) {
    l = e[f];
    var p = i + qc(l, f);
    a += Nu(l, t, n, p, s);
  }
  else if (p = qS(e), typeof p == "function") for (e = p.call(e), f = 0; !(l = e.next()).done; ) l = l.value, p = i + qc(l, f++), a += Nu(l, t, n, p, s);
  else if (l === "object") throw t = String(e), Error("Objects are not valid as a React child (found: " + (t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t) + "). If you meant to render a collection of children, use an array instead.");
  return a;
}
function cu(e, t, n) {
  if (e == null) return e;
  var i = [], s = 0;
  return Nu(e, i, "", "", function(l) {
    return t.call(n, l, s++);
  }), i;
}
function ew(e) {
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
var _t = { current: null }, ju = { transition: null }, tw = { ReactCurrentDispatcher: _t, ReactCurrentBatchConfig: ju, ReactCurrentOwner: Vd };
function Iy() {
  throw Error("act(...) is not supported in production builds of React.");
}
ae.Children = { map: cu, forEach: function(e, t, n) {
  cu(e, function() {
    t.apply(this, arguments);
  }, n);
}, count: function(e) {
  var t = 0;
  return cu(e, function() {
    t++;
  }), t;
}, toArray: function(e) {
  return cu(e, function(t) {
    return t;
  }) || [];
}, only: function(e) {
  if (!Kd(e)) throw Error("React.Children.only expected to receive a single React element child.");
  return e;
} };
ae.Component = Hi;
ae.Fragment = GS;
ae.Profiler = VS;
ae.PureComponent = Gd;
ae.StrictMode = WS;
ae.Suspense = YS;
ae.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = tw;
ae.act = Iy;
ae.cloneElement = function(e, t, n) {
  if (e == null) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + e + ".");
  var i = Ay({}, e.props), s = e.key, l = e.ref, a = e._owner;
  if (t != null) {
    if (t.ref !== void 0 && (l = t.ref, a = Vd.current), t.key !== void 0 && (s = "" + t.key), e.type && e.type.defaultProps) var f = e.type.defaultProps;
    for (p in t) Ny.call(t, p) && !jy.hasOwnProperty(p) && (i[p] = t[p] === void 0 && f !== void 0 ? f[p] : t[p]);
  }
  var p = arguments.length - 2;
  if (p === 1) i.children = n;
  else if (1 < p) {
    f = Array(p);
    for (var m = 0; m < p; m++) f[m] = arguments[m + 2];
    i.children = f;
  }
  return { $$typeof: ul, type: e.type, key: s, ref: l, props: i, _owner: a };
};
ae.createContext = function(e) {
  return e = { $$typeof: QS, _currentValue: e, _currentValue2: e, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null }, e.Provider = { $$typeof: KS, _context: e }, e.Consumer = e;
};
ae.createElement = zy;
ae.createFactory = function(e) {
  var t = zy.bind(null, e);
  return t.type = e, t;
};
ae.createRef = function() {
  return { current: null };
};
ae.forwardRef = function(e) {
  return { $$typeof: XS, render: e };
};
ae.isValidElement = Kd;
ae.lazy = function(e) {
  return { $$typeof: JS, _payload: { _status: -1, _result: e }, _init: ew };
};
ae.memo = function(e, t) {
  return { $$typeof: ZS, type: e, compare: t === void 0 ? null : t };
};
ae.startTransition = function(e) {
  var t = ju.transition;
  ju.transition = {};
  try {
    e();
  } finally {
    ju.transition = t;
  }
};
ae.unstable_act = Iy;
ae.useCallback = function(e, t) {
  return _t.current.useCallback(e, t);
};
ae.useContext = function(e) {
  return _t.current.useContext(e);
};
ae.useDebugValue = function() {
};
ae.useDeferredValue = function(e) {
  return _t.current.useDeferredValue(e);
};
ae.useEffect = function(e, t) {
  return _t.current.useEffect(e, t);
};
ae.useId = function() {
  return _t.current.useId();
};
ae.useImperativeHandle = function(e, t, n) {
  return _t.current.useImperativeHandle(e, t, n);
};
ae.useInsertionEffect = function(e, t) {
  return _t.current.useInsertionEffect(e, t);
};
ae.useLayoutEffect = function(e, t) {
  return _t.current.useLayoutEffect(e, t);
};
ae.useMemo = function(e, t) {
  return _t.current.useMemo(e, t);
};
ae.useReducer = function(e, t, n) {
  return _t.current.useReducer(e, t, n);
};
ae.useRef = function(e) {
  return _t.current.useRef(e);
};
ae.useState = function(e) {
  return _t.current.useState(e);
};
ae.useSyncExternalStore = function(e, t, n) {
  return _t.current.useSyncExternalStore(e, t, n);
};
ae.useTransition = function() {
  return _t.current.useTransition();
};
ae.version = "18.3.1";
Cy.exports = ae;
var W = Cy.exports;
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var nw = W, rw = Symbol.for("react.element"), ow = Symbol.for("react.fragment"), iw = Object.prototype.hasOwnProperty, sw = nw.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, lw = { key: !0, ref: !0, __self: !0, __source: !0 };
function Oy(e, t, n) {
  var i, s = {}, l = null, a = null;
  n !== void 0 && (l = "" + n), t.key !== void 0 && (l = "" + t.key), t.ref !== void 0 && (a = t.ref);
  for (i in t) iw.call(t, i) && !lw.hasOwnProperty(i) && (s[i] = t[i]);
  if (e && e.defaultProps) for (i in t = e.defaultProps, t) s[i] === void 0 && (s[i] = t[i]);
  return { $$typeof: rw, type: e, key: l, ref: a, props: s, _owner: sw.current };
}
Ea.Fragment = ow;
Ea.jsx = Oy;
Ea.jsxs = Oy;
Py.exports = Ea;
var E = Py.exports, Dy = { exports: {} }, $t = {}, Fy = { exports: {} }, Uy = {};
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
  function i(N) {
    if (N.length === 0) return null;
    var U = N[0], F = N.pop();
    if (F !== U) {
      N[0] = F;
      e: for (var Y = 0, te = N.length, ce = te >>> 1; Y < ce; ) {
        var ze = 2 * (Y + 1) - 1, ot = N[ze], Xe = ze + 1, en = N[Xe];
        if (0 > s(ot, F)) Xe < te && 0 > s(en, ot) ? (N[Y] = en, N[Xe] = F, Y = Xe) : (N[Y] = ot, N[ze] = F, Y = ze);
        else if (Xe < te && 0 > s(en, F)) N[Y] = en, N[Xe] = F, Y = Xe;
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
  var p = [], m = [], g = 1, y = null, v = 3, w = !1, T = !1, A = !1, L = typeof setTimeout == "function" ? setTimeout : null, S = typeof clearTimeout == "function" ? clearTimeout : null, x = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function _(N) {
    for (var U = n(m); U !== null; ) {
      if (U.callback === null) i(m);
      else if (U.startTime <= N) i(m), U.sortIndex = U.expirationTime, t(p, U);
      else break;
      U = n(m);
    }
  }
  function R(N) {
    if (A = !1, _(N), !T) if (n(p) !== null) T = !0, be(I);
    else {
      var U = n(m);
      U !== null && Tt(R, U.startTime - N);
    }
  }
  function I(N, U) {
    T = !1, A && (A = !1, S(B), B = -1), w = !0;
    var F = v;
    try {
      for (_(U), y = n(p); y !== null && (!(y.expirationTime > U) || N && !Q()); ) {
        var Y = y.callback;
        if (typeof Y == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = Y(y.expirationTime <= U);
          U = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && i(p), _(U);
        } else i(p);
        y = n(p);
      }
      if (y !== null) var ce = !0;
      else {
        var ze = n(m);
        ze !== null && Tt(R, ze.startTime - U), ce = !1;
      }
      return ce;
    } finally {
      y = null, v = F, w = !1;
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
        U ? xe() : (O = !1, D = null);
      }
    } else O = !1;
  }
  var xe;
  if (typeof x == "function") xe = function() {
    x(le);
  };
  else if (typeof MessageChannel < "u") {
    var kt = new MessageChannel(), Bt = kt.port2;
    kt.port1.onmessage = le, xe = function() {
      Bt.postMessage(null);
    };
  } else xe = function() {
    L(le, 0);
  };
  function be(N) {
    D = N, O || (O = !0, xe());
  }
  function Tt(N, U) {
    B = L(function() {
      N(e.unstable_now());
    }, U);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    T || w || (T = !0, be(I));
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
    return te = F + te, N = { id: g++, callback: U, priorityLevel: N, startTime: F, expirationTime: te, sortIndex: -1 }, F > Y ? (N.sortIndex = F, t(m, N), n(p) === null && N === n(m) && (A ? (S(B), B = -1) : A = !0, Tt(R, F - Y))) : (N.sortIndex = te, t(p, N), T || w || (T = !0, be(I))), N;
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
})(Uy);
Fy.exports = Uy;
var uw = Fy.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aw = W, qt = uw;
function H(e) {
  for (var t = "https://reactjs.org/docs/error-decoder.html?invariant=" + e, n = 1; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
  return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var Hy = /* @__PURE__ */ new Set(), Vs = {};
function Do(e, t) {
  Mi(e, t), Mi(e + "Capture", t);
}
function Mi(e, t) {
  for (Vs[e] = t, e = 0; e < t.length; e++) Hy.add(t[e]);
}
var pr = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Kf = Object.prototype.hasOwnProperty, cw = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, Om = {}, Dm = {};
function fw(e) {
  return Kf.call(Dm, e) ? !0 : Kf.call(Om, e) ? !1 : cw.test(e) ? Dm[e] = !0 : (Om[e] = !0, !1);
}
function dw(e, t, n, i) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      return i ? !1 : n !== null ? !n.acceptsBooleans : (e = e.toLowerCase().slice(0, 5), e !== "data-" && e !== "aria-");
    default:
      return !1;
  }
}
function pw(e, t, n, i) {
  if (t === null || typeof t > "u" || dw(e, t, n, i)) return !0;
  if (i) return !1;
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
function Et(e, t, n, i, s, l, a) {
  this.acceptsBooleans = t === 2 || t === 3 || t === 4, this.attributeName = i, this.attributeNamespace = s, this.mustUseProperty = n, this.propertyName = e, this.type = t, this.sanitizeURL = l, this.removeEmptyString = a;
}
var rt = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(e) {
  rt[e] = new Et(e, 0, !1, e, null, !1, !1);
});
[["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(e) {
  var t = e[0];
  rt[t] = new Et(t, 1, !1, e[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(e) {
  rt[e] = new Et(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(e) {
  rt[e] = new Et(e, 2, !1, e, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(e) {
  rt[e] = new Et(e, 3, !1, e.toLowerCase(), null, !1, !1);
});
["checked", "multiple", "muted", "selected"].forEach(function(e) {
  rt[e] = new Et(e, 3, !0, e, null, !1, !1);
});
["capture", "download"].forEach(function(e) {
  rt[e] = new Et(e, 4, !1, e, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(e) {
  rt[e] = new Et(e, 6, !1, e, null, !1, !1);
});
["rowSpan", "start"].forEach(function(e) {
  rt[e] = new Et(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Qd = /[\-:]([a-z])/g;
function Xd(e) {
  return e[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(e) {
  var t = e.replace(
    Qd,
    Xd
  );
  rt[t] = new Et(t, 1, !1, e, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(e) {
  var t = e.replace(Qd, Xd);
  rt[t] = new Et(t, 1, !1, e, "http://www.w3.org/1999/xlink", !1, !1);
});
["xml:base", "xml:lang", "xml:space"].forEach(function(e) {
  var t = e.replace(Qd, Xd);
  rt[t] = new Et(t, 1, !1, e, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
["tabIndex", "crossOrigin"].forEach(function(e) {
  rt[e] = new Et(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
rt.xlinkHref = new Et("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
["src", "href", "action", "formAction"].forEach(function(e) {
  rt[e] = new Et(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Yd(e, t, n, i) {
  var s = rt.hasOwnProperty(t) ? rt[t] : null;
  (s !== null ? s.type !== 0 : i || !(2 < t.length) || t[0] !== "o" && t[0] !== "O" || t[1] !== "n" && t[1] !== "N") && (pw(t, n, s, i) && (n = null), i || s === null ? fw(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, "" + n)) : s.mustUseProperty ? e[s.propertyName] = n === null ? s.type === 3 ? !1 : "" : n : (t = s.attributeName, i = s.attributeNamespace, n === null ? e.removeAttribute(t) : (s = s.type, n = s === 3 || s === 4 && n === !0 ? "" : "" + n, i ? e.setAttributeNS(i, t, n) : e.setAttribute(t, n))));
}
var yr = aw.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, fu = Symbol.for("react.element"), ai = Symbol.for("react.portal"), ci = Symbol.for("react.fragment"), Zd = Symbol.for("react.strict_mode"), Qf = Symbol.for("react.profiler"), By = Symbol.for("react.provider"), Gy = Symbol.for("react.context"), Jd = Symbol.for("react.forward_ref"), Xf = Symbol.for("react.suspense"), Yf = Symbol.for("react.suspense_list"), qd = Symbol.for("react.memo"), zr = Symbol.for("react.lazy"), Wy = Symbol.for("react.offscreen"), Fm = Symbol.iterator;
function ds(e) {
  return e === null || typeof e != "object" ? null : (e = Fm && e[Fm] || e["@@iterator"], typeof e == "function" ? e : null);
}
var je = Object.assign, $c;
function Ps(e) {
  if ($c === void 0) try {
    throw Error();
  } catch (n) {
    var t = n.stack.trim().match(/\n( *(at )?)/);
    $c = t && t[1] || "";
  }
  return `
` + $c + e;
}
var bc = !1;
function ef(e, t) {
  if (!e || bc) return "";
  bc = !0;
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
        var i = m;
      }
      Reflect.construct(e, [], t);
    } else {
      try {
        t.call();
      } catch (m) {
        i = m;
      }
      e.call(t.prototype);
    }
    else {
      try {
        throw Error();
      } catch (m) {
        i = m;
      }
      e();
    }
  } catch (m) {
    if (m && i && typeof m.stack == "string") {
      for (var s = m.stack.split(`
`), l = i.stack.split(`
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
    bc = !1, Error.prepareStackTrace = n;
  }
  return (e = e ? e.displayName || e.name : "") ? Ps(e) : "";
}
function hw(e) {
  switch (e.tag) {
    case 5:
      return Ps(e.type);
    case 16:
      return Ps("Lazy");
    case 13:
      return Ps("Suspense");
    case 19:
      return Ps("SuspenseList");
    case 0:
    case 2:
    case 15:
      return e = ef(e.type, !1), e;
    case 11:
      return e = ef(e.type.render, !1), e;
    case 1:
      return e = ef(e.type, !0), e;
    default:
      return "";
  }
}
function Zf(e) {
  if (e == null) return null;
  if (typeof e == "function") return e.displayName || e.name || null;
  if (typeof e == "string") return e;
  switch (e) {
    case ci:
      return "Fragment";
    case ai:
      return "Portal";
    case Qf:
      return "Profiler";
    case Zd:
      return "StrictMode";
    case Xf:
      return "Suspense";
    case Yf:
      return "SuspenseList";
  }
  if (typeof e == "object") switch (e.$$typeof) {
    case Gy:
      return (e.displayName || "Context") + ".Consumer";
    case By:
      return (e._context.displayName || "Context") + ".Provider";
    case Jd:
      var t = e.render;
      return e = e.displayName, e || (e = t.displayName || t.name || "", e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"), e;
    case qd:
      return t = e.displayName || null, t !== null ? t : Zf(e.type) || "Memo";
    case zr:
      t = e._payload, e = e._init;
      try {
        return Zf(e(t));
      } catch {
      }
  }
  return null;
}
function mw(e) {
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
      return Zf(t);
    case 8:
      return t === Zd ? "StrictMode" : "Mode";
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
function Jr(e) {
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
function Vy(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
}
function gw(e) {
  var t = Vy(e) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t), i = "" + e[t];
  if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
    var s = n.get, l = n.set;
    return Object.defineProperty(e, t, { configurable: !0, get: function() {
      return s.call(this);
    }, set: function(a) {
      i = "" + a, l.call(this, a);
    } }), Object.defineProperty(e, t, { enumerable: n.enumerable }), { getValue: function() {
      return i;
    }, setValue: function(a) {
      i = "" + a;
    }, stopTracking: function() {
      e._valueTracker = null, delete e[t];
    } };
  }
}
function du(e) {
  e._valueTracker || (e._valueTracker = gw(e));
}
function Ky(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(), i = "";
  return e && (i = Vy(e) ? e.checked ? "true" : "false" : e.value), e = i, e !== n ? (t.setValue(e), !0) : !1;
}
function qu(e) {
  if (e = e || (typeof document < "u" ? document : void 0), typeof e > "u") return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function Jf(e, t) {
  var n = t.checked;
  return je({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function Um(e, t) {
  var n = t.defaultValue == null ? "" : t.defaultValue, i = t.checked != null ? t.checked : t.defaultChecked;
  n = Jr(t.value != null ? t.value : n), e._wrapperState = { initialChecked: i, initialValue: n, controlled: t.type === "checkbox" || t.type === "radio" ? t.checked != null : t.value != null };
}
function Qy(e, t) {
  t = t.checked, t != null && Yd(e, "checked", t, !1);
}
function qf(e, t) {
  Qy(e, t);
  var n = Jr(t.value), i = t.type;
  if (n != null) i === "number" ? (n === 0 && e.value === "" || e.value != n) && (e.value = "" + n) : e.value !== "" + n && (e.value = "" + n);
  else if (i === "submit" || i === "reset") {
    e.removeAttribute("value");
    return;
  }
  t.hasOwnProperty("value") ? $f(e, t.type, n) : t.hasOwnProperty("defaultValue") && $f(e, t.type, Jr(t.defaultValue)), t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function Hm(e, t, n) {
  if (t.hasOwnProperty("value") || t.hasOwnProperty("defaultValue")) {
    var i = t.type;
    if (!(i !== "submit" && i !== "reset" || t.value !== void 0 && t.value !== null)) return;
    t = "" + e._wrapperState.initialValue, n || t === e.value || (e.value = t), e.defaultValue = t;
  }
  n = e.name, n !== "" && (e.name = ""), e.defaultChecked = !!e._wrapperState.initialChecked, n !== "" && (e.name = n);
}
function $f(e, t, n) {
  (t !== "number" || qu(e.ownerDocument) !== e) && (n == null ? e.defaultValue = "" + e._wrapperState.initialValue : e.defaultValue !== "" + n && (e.defaultValue = "" + n));
}
var Cs = Array.isArray;
function ki(e, t, n, i) {
  if (e = e.options, t) {
    t = {};
    for (var s = 0; s < n.length; s++) t["$" + n[s]] = !0;
    for (n = 0; n < e.length; n++) s = t.hasOwnProperty("$" + e[n].value), e[n].selected !== s && (e[n].selected = s), s && i && (e[n].defaultSelected = !0);
  } else {
    for (n = "" + Jr(n), t = null, s = 0; s < e.length; s++) {
      if (e[s].value === n) {
        e[s].selected = !0, i && (e[s].defaultSelected = !0);
        return;
      }
      t !== null || e[s].disabled || (t = e[s]);
    }
    t !== null && (t.selected = !0);
  }
}
function bf(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(H(91));
  return je({}, t, { value: void 0, defaultValue: void 0, children: "" + e._wrapperState.initialValue });
}
function Bm(e, t) {
  var n = t.value;
  if (n == null) {
    if (n = t.children, t = t.defaultValue, n != null) {
      if (t != null) throw Error(H(92));
      if (Cs(n)) {
        if (1 < n.length) throw Error(H(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ""), n = t;
  }
  e._wrapperState = { initialValue: Jr(n) };
}
function Xy(e, t) {
  var n = Jr(t.value), i = Jr(t.defaultValue);
  n != null && (n = "" + n, n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)), i != null && (e.defaultValue = "" + i);
}
function Gm(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== "" && t !== null && (e.value = t);
}
function Yy(e) {
  switch (e) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function ed(e, t) {
  return e == null || e === "http://www.w3.org/1999/xhtml" ? Yy(t) : e === "http://www.w3.org/2000/svg" && t === "foreignObject" ? "http://www.w3.org/1999/xhtml" : e;
}
var pu, Zy = function(e) {
  return typeof MSApp < "u" && MSApp.execUnsafeLocalFunction ? function(t, n, i, s) {
    MSApp.execUnsafeLocalFunction(function() {
      return e(t, n, i, s);
    });
  } : e;
}(function(e, t) {
  if (e.namespaceURI !== "http://www.w3.org/2000/svg" || "innerHTML" in e) e.innerHTML = t;
  else {
    for (pu = pu || document.createElement("div"), pu.innerHTML = "<svg>" + t.valueOf().toString() + "</svg>", t = pu.firstChild; e.firstChild; ) e.removeChild(e.firstChild);
    for (; t.firstChild; ) e.appendChild(t.firstChild);
  }
});
function Ks(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var Is = {
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
}, yw = ["Webkit", "ms", "Moz", "O"];
Object.keys(Is).forEach(function(e) {
  yw.forEach(function(t) {
    t = t + e.charAt(0).toUpperCase() + e.substring(1), Is[t] = Is[e];
  });
});
function Jy(e, t, n) {
  return t == null || typeof t == "boolean" || t === "" ? "" : n || typeof t != "number" || t === 0 || Is.hasOwnProperty(e) && Is[e] ? ("" + t).trim() : t + "px";
}
function qy(e, t) {
  e = e.style;
  for (var n in t) if (t.hasOwnProperty(n)) {
    var i = n.indexOf("--") === 0, s = Jy(n, t[n], i);
    n === "float" && (n = "cssFloat"), i ? e.setProperty(n, s) : e[n] = s;
  }
}
var vw = je({ menuitem: !0 }, { area: !0, base: !0, br: !0, col: !0, embed: !0, hr: !0, img: !0, input: !0, keygen: !0, link: !0, meta: !0, param: !0, source: !0, track: !0, wbr: !0 });
function td(e, t) {
  if (t) {
    if (vw[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(H(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(H(60));
      if (typeof t.dangerouslySetInnerHTML != "object" || !("__html" in t.dangerouslySetInnerHTML)) throw Error(H(61));
    }
    if (t.style != null && typeof t.style != "object") throw Error(H(62));
  }
}
function nd(e, t) {
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
var rd = null;
function $d(e) {
  return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
}
var od = null, Ti = null, Pi = null;
function Wm(e) {
  if (e = fl(e)) {
    if (typeof od != "function") throw Error(H(280));
    var t = e.stateNode;
    t && (t = Ra(t), od(e.stateNode, e.type, t));
  }
}
function $y(e) {
  Ti ? Pi ? Pi.push(e) : Pi = [e] : Ti = e;
}
function by() {
  if (Ti) {
    var e = Ti, t = Pi;
    if (Pi = Ti = null, Wm(e), t) for (e = 0; e < t.length; e++) Wm(t[e]);
  }
}
function e0(e, t) {
  return e(t);
}
function t0() {
}
var tf = !1;
function n0(e, t, n) {
  if (tf) return e(t, n);
  tf = !0;
  try {
    return e0(e, t, n);
  } finally {
    tf = !1, (Ti !== null || Pi !== null) && (t0(), by());
  }
}
function Qs(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var i = Ra(n);
  if (i === null) return null;
  n = i[t];
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
      (i = !i.disabled) || (e = e.type, i = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !i;
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != "function") throw Error(H(231, t, typeof n));
  return n;
}
var id = !1;
if (pr) try {
  var ps = {};
  Object.defineProperty(ps, "passive", { get: function() {
    id = !0;
  } }), window.addEventListener("test", ps, ps), window.removeEventListener("test", ps, ps);
} catch {
  id = !1;
}
function xw(e, t, n, i, s, l, a, f, p) {
  var m = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, m);
  } catch (g) {
    this.onError(g);
  }
}
var Os = !1, $u = null, bu = !1, sd = null, Sw = { onError: function(e) {
  Os = !0, $u = e;
} };
function ww(e, t, n, i, s, l, a, f, p) {
  Os = !1, $u = null, xw.apply(Sw, arguments);
}
function _w(e, t, n, i, s, l, a, f, p) {
  if (ww.apply(this, arguments), Os) {
    if (Os) {
      var m = $u;
      Os = !1, $u = null;
    } else throw Error(H(198));
    bu || (bu = !0, sd = m);
  }
}
function Fo(e) {
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
function r0(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
  }
  return null;
}
function Vm(e) {
  if (Fo(e) !== e) throw Error(H(188));
}
function Ew(e) {
  var t = e.alternate;
  if (!t) {
    if (t = Fo(e), t === null) throw Error(H(188));
    return t !== e ? null : e;
  }
  for (var n = e, i = t; ; ) {
    var s = n.return;
    if (s === null) break;
    var l = s.alternate;
    if (l === null) {
      if (i = s.return, i !== null) {
        n = i;
        continue;
      }
      break;
    }
    if (s.child === l.child) {
      for (l = s.child; l; ) {
        if (l === n) return Vm(s), e;
        if (l === i) return Vm(s), t;
        l = l.sibling;
      }
      throw Error(H(188));
    }
    if (n.return !== i.return) n = s, i = l;
    else {
      for (var a = !1, f = s.child; f; ) {
        if (f === n) {
          a = !0, n = s, i = l;
          break;
        }
        if (f === i) {
          a = !0, i = s, n = l;
          break;
        }
        f = f.sibling;
      }
      if (!a) {
        for (f = l.child; f; ) {
          if (f === n) {
            a = !0, n = l, i = s;
            break;
          }
          if (f === i) {
            a = !0, i = l, n = s;
            break;
          }
          f = f.sibling;
        }
        if (!a) throw Error(H(189));
      }
    }
    if (n.alternate !== i) throw Error(H(190));
  }
  if (n.tag !== 3) throw Error(H(188));
  return n.stateNode.current === n ? e : t;
}
function o0(e) {
  return e = Ew(e), e !== null ? i0(e) : null;
}
function i0(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = i0(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var s0 = qt.unstable_scheduleCallback, Km = qt.unstable_cancelCallback, kw = qt.unstable_shouldYield, Tw = qt.unstable_requestPaint, Ue = qt.unstable_now, Pw = qt.unstable_getCurrentPriorityLevel, bd = qt.unstable_ImmediatePriority, l0 = qt.unstable_UserBlockingPriority, ea = qt.unstable_NormalPriority, Cw = qt.unstable_LowPriority, u0 = qt.unstable_IdlePriority, ka = null, Yn = null;
function Rw(e) {
  if (Yn && typeof Yn.onCommitFiberRoot == "function") try {
    Yn.onCommitFiberRoot(ka, e, void 0, (e.current.flags & 128) === 128);
  } catch {
  }
}
var An = Math.clz32 ? Math.clz32 : Mw, Aw = Math.log, Lw = Math.LN2;
function Mw(e) {
  return e >>>= 0, e === 0 ? 32 : 31 - (Aw(e) / Lw | 0) | 0;
}
var hu = 64, mu = 4194304;
function Rs(e) {
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
function ta(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var i = 0, s = e.suspendedLanes, l = e.pingedLanes, a = n & 268435455;
  if (a !== 0) {
    var f = a & ~s;
    f !== 0 ? i = Rs(f) : (l &= a, l !== 0 && (i = Rs(l)));
  } else a = n & ~s, a !== 0 ? i = Rs(a) : l !== 0 && (i = Rs(l));
  if (i === 0) return 0;
  if (t !== 0 && t !== i && !(t & s) && (s = i & -i, l = t & -t, s >= l || s === 16 && (l & 4194240) !== 0)) return t;
  if (i & 4 && (i |= n & 16), t = e.entangledLanes, t !== 0) for (e = e.entanglements, t &= i; 0 < t; ) n = 31 - An(t), s = 1 << n, i |= e[n], t &= ~s;
  return i;
}
function Nw(e, t) {
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
function jw(e, t) {
  for (var n = e.suspendedLanes, i = e.pingedLanes, s = e.expirationTimes, l = e.pendingLanes; 0 < l; ) {
    var a = 31 - An(l), f = 1 << a, p = s[a];
    p === -1 ? (!(f & n) || f & i) && (s[a] = Nw(f, t)) : p <= t && (e.expiredLanes |= f), l &= ~f;
  }
}
function ld(e) {
  return e = e.pendingLanes & -1073741825, e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function a0() {
  var e = hu;
  return hu <<= 1, !(hu & 4194240) && (hu = 64), e;
}
function nf(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function al(e, t, n) {
  e.pendingLanes |= t, t !== 536870912 && (e.suspendedLanes = 0, e.pingedLanes = 0), e = e.eventTimes, t = 31 - An(t), e[t] = n;
}
function zw(e, t) {
  var n = e.pendingLanes & ~t;
  e.pendingLanes = t, e.suspendedLanes = 0, e.pingedLanes = 0, e.expiredLanes &= t, e.mutableReadLanes &= t, e.entangledLanes &= t, t = e.entanglements;
  var i = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var s = 31 - An(n), l = 1 << s;
    t[s] = 0, i[s] = -1, e[s] = -1, n &= ~l;
  }
}
function ep(e, t) {
  var n = e.entangledLanes |= t;
  for (e = e.entanglements; n; ) {
    var i = 31 - An(n), s = 1 << i;
    s & t | e[i] & t && (e[i] |= t), n &= ~s;
  }
}
var ge = 0;
function c0(e) {
  return e &= -e, 1 < e ? 4 < e ? e & 268435455 ? 16 : 536870912 : 4 : 1;
}
var f0, tp, d0, p0, h0, ud = !1, gu = [], Br = null, Gr = null, Wr = null, Xs = /* @__PURE__ */ new Map(), Ys = /* @__PURE__ */ new Map(), Or = [], Iw = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Qm(e, t) {
  switch (e) {
    case "focusin":
    case "focusout":
      Br = null;
      break;
    case "dragenter":
    case "dragleave":
      Gr = null;
      break;
    case "mouseover":
    case "mouseout":
      Wr = null;
      break;
    case "pointerover":
    case "pointerout":
      Xs.delete(t.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      Ys.delete(t.pointerId);
  }
}
function hs(e, t, n, i, s, l) {
  return e === null || e.nativeEvent !== l ? (e = { blockedOn: t, domEventName: n, eventSystemFlags: i, nativeEvent: l, targetContainers: [s] }, t !== null && (t = fl(t), t !== null && tp(t)), e) : (e.eventSystemFlags |= i, t = e.targetContainers, s !== null && t.indexOf(s) === -1 && t.push(s), e);
}
function Ow(e, t, n, i, s) {
  switch (t) {
    case "focusin":
      return Br = hs(Br, e, t, n, i, s), !0;
    case "dragenter":
      return Gr = hs(Gr, e, t, n, i, s), !0;
    case "mouseover":
      return Wr = hs(Wr, e, t, n, i, s), !0;
    case "pointerover":
      var l = s.pointerId;
      return Xs.set(l, hs(Xs.get(l) || null, e, t, n, i, s)), !0;
    case "gotpointercapture":
      return l = s.pointerId, Ys.set(l, hs(Ys.get(l) || null, e, t, n, i, s)), !0;
  }
  return !1;
}
function m0(e) {
  var t = wo(e.target);
  if (t !== null) {
    var n = Fo(t);
    if (n !== null) {
      if (t = n.tag, t === 13) {
        if (t = r0(n), t !== null) {
          e.blockedOn = t, h0(e.priority, function() {
            d0(n);
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
function zu(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = ad(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var i = new n.constructor(n.type, n);
      rd = i, n.target.dispatchEvent(i), rd = null;
    } else return t = fl(n), t !== null && tp(t), e.blockedOn = n, !1;
    t.shift();
  }
  return !0;
}
function Xm(e, t, n) {
  zu(e) && n.delete(t);
}
function Dw() {
  ud = !1, Br !== null && zu(Br) && (Br = null), Gr !== null && zu(Gr) && (Gr = null), Wr !== null && zu(Wr) && (Wr = null), Xs.forEach(Xm), Ys.forEach(Xm);
}
function ms(e, t) {
  e.blockedOn === t && (e.blockedOn = null, ud || (ud = !0, qt.unstable_scheduleCallback(qt.unstable_NormalPriority, Dw)));
}
function Zs(e) {
  function t(s) {
    return ms(s, e);
  }
  if (0 < gu.length) {
    ms(gu[0], e);
    for (var n = 1; n < gu.length; n++) {
      var i = gu[n];
      i.blockedOn === e && (i.blockedOn = null);
    }
  }
  for (Br !== null && ms(Br, e), Gr !== null && ms(Gr, e), Wr !== null && ms(Wr, e), Xs.forEach(t), Ys.forEach(t), n = 0; n < Or.length; n++) i = Or[n], i.blockedOn === e && (i.blockedOn = null);
  for (; 0 < Or.length && (n = Or[0], n.blockedOn === null); ) m0(n), n.blockedOn === null && Or.shift();
}
var Ci = yr.ReactCurrentBatchConfig, na = !0;
function Fw(e, t, n, i) {
  var s = ge, l = Ci.transition;
  Ci.transition = null;
  try {
    ge = 1, np(e, t, n, i);
  } finally {
    ge = s, Ci.transition = l;
  }
}
function Uw(e, t, n, i) {
  var s = ge, l = Ci.transition;
  Ci.transition = null;
  try {
    ge = 4, np(e, t, n, i);
  } finally {
    ge = s, Ci.transition = l;
  }
}
function np(e, t, n, i) {
  if (na) {
    var s = ad(e, t, n, i);
    if (s === null) pf(e, t, i, ra, n), Qm(e, i);
    else if (Ow(s, e, t, n, i)) i.stopPropagation();
    else if (Qm(e, i), t & 4 && -1 < Iw.indexOf(e)) {
      for (; s !== null; ) {
        var l = fl(s);
        if (l !== null && f0(l), l = ad(e, t, n, i), l === null && pf(e, t, i, ra, n), l === s) break;
        s = l;
      }
      s !== null && i.stopPropagation();
    } else pf(e, t, i, null, n);
  }
}
var ra = null;
function ad(e, t, n, i) {
  if (ra = null, e = $d(i), e = wo(e), e !== null) if (t = Fo(e), t === null) e = null;
  else if (n = t.tag, n === 13) {
    if (e = r0(t), e !== null) return e;
    e = null;
  } else if (n === 3) {
    if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
    e = null;
  } else t !== e && (e = null);
  return ra = e, null;
}
function g0(e) {
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
      switch (Pw()) {
        case bd:
          return 1;
        case l0:
          return 4;
        case ea:
        case Cw:
          return 16;
        case u0:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var Fr = null, rp = null, Iu = null;
function y0() {
  if (Iu) return Iu;
  var e, t = rp, n = t.length, i, s = "value" in Fr ? Fr.value : Fr.textContent, l = s.length;
  for (e = 0; e < n && t[e] === s[e]; e++) ;
  var a = n - e;
  for (i = 1; i <= a && t[n - i] === s[l - i]; i++) ;
  return Iu = s.slice(e, 1 < i ? 1 - i : void 0);
}
function Ou(e) {
  var t = e.keyCode;
  return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function yu() {
  return !0;
}
function Ym() {
  return !1;
}
function bt(e) {
  function t(n, i, s, l, a) {
    this._reactName = n, this._targetInst = s, this.type = i, this.nativeEvent = l, this.target = a, this.currentTarget = null;
    for (var f in e) e.hasOwnProperty(f) && (n = e[f], this[f] = n ? n(l) : l[f]);
    return this.isDefaultPrevented = (l.defaultPrevented != null ? l.defaultPrevented : l.returnValue === !1) ? yu : Ym, this.isPropagationStopped = Ym, this;
  }
  return je(t.prototype, { preventDefault: function() {
    this.defaultPrevented = !0;
    var n = this.nativeEvent;
    n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = yu);
  }, stopPropagation: function() {
    var n = this.nativeEvent;
    n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = yu);
  }, persist: function() {
  }, isPersistent: yu }), t;
}
var Bi = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(e) {
  return e.timeStamp || Date.now();
}, defaultPrevented: 0, isTrusted: 0 }, op = bt(Bi), cl = je({}, Bi, { view: 0, detail: 0 }), Hw = bt(cl), rf, of, gs, Ta = je({}, cl, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: ip, button: 0, buttons: 0, relatedTarget: function(e) {
  return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
}, movementX: function(e) {
  return "movementX" in e ? e.movementX : (e !== gs && (gs && e.type === "mousemove" ? (rf = e.screenX - gs.screenX, of = e.screenY - gs.screenY) : of = rf = 0, gs = e), rf);
}, movementY: function(e) {
  return "movementY" in e ? e.movementY : of;
} }), Zm = bt(Ta), Bw = je({}, Ta, { dataTransfer: 0 }), Gw = bt(Bw), Ww = je({}, cl, { relatedTarget: 0 }), sf = bt(Ww), Vw = je({}, Bi, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Kw = bt(Vw), Qw = je({}, Bi, { clipboardData: function(e) {
  return "clipboardData" in e ? e.clipboardData : window.clipboardData;
} }), Xw = bt(Qw), Yw = je({}, Bi, { data: 0 }), Jm = bt(Yw), Zw = {
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
}, Jw = {
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
}, qw = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
function $w(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = qw[e]) ? !!t[e] : !1;
}
function ip() {
  return $w;
}
var bw = je({}, cl, { key: function(e) {
  if (e.key) {
    var t = Zw[e.key] || e.key;
    if (t !== "Unidentified") return t;
  }
  return e.type === "keypress" ? (e = Ou(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Jw[e.keyCode] || "Unidentified" : "";
}, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: ip, charCode: function(e) {
  return e.type === "keypress" ? Ou(e) : 0;
}, keyCode: function(e) {
  return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
}, which: function(e) {
  return e.type === "keypress" ? Ou(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
} }), e_ = bt(bw), t_ = je({}, Ta, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), qm = bt(t_), n_ = je({}, cl, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: ip }), r_ = bt(n_), o_ = je({}, Bi, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), i_ = bt(o_), s_ = je({}, Ta, {
  deltaX: function(e) {
    return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
  },
  deltaY: function(e) {
    return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
  },
  deltaZ: 0,
  deltaMode: 0
}), l_ = bt(s_), u_ = [9, 13, 27, 32], sp = pr && "CompositionEvent" in window, Ds = null;
pr && "documentMode" in document && (Ds = document.documentMode);
var a_ = pr && "TextEvent" in window && !Ds, v0 = pr && (!sp || Ds && 8 < Ds && 11 >= Ds), $m = " ", bm = !1;
function x0(e, t) {
  switch (e) {
    case "keyup":
      return u_.indexOf(t.keyCode) !== -1;
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
function S0(e) {
  return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
}
var fi = !1;
function c_(e, t) {
  switch (e) {
    case "compositionend":
      return S0(t);
    case "keypress":
      return t.which !== 32 ? null : (bm = !0, $m);
    case "textInput":
      return e = t.data, e === $m && bm ? null : e;
    default:
      return null;
  }
}
function f_(e, t) {
  if (fi) return e === "compositionend" || !sp && x0(e, t) ? (e = y0(), Iu = rp = Fr = null, fi = !1, e) : null;
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
      return v0 && t.locale !== "ko" ? null : t.data;
    default:
      return null;
  }
}
var d_ = { color: !0, date: !0, datetime: !0, "datetime-local": !0, email: !0, month: !0, number: !0, password: !0, range: !0, search: !0, tel: !0, text: !0, time: !0, url: !0, week: !0 };
function eg(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === "input" ? !!d_[e.type] : t === "textarea";
}
function w0(e, t, n, i) {
  $y(i), t = oa(t, "onChange"), 0 < t.length && (n = new op("onChange", "change", null, n, i), e.push({ event: n, listeners: t }));
}
var Fs = null, Js = null;
function p_(e) {
  N0(e, 0);
}
function Pa(e) {
  var t = hi(e);
  if (Ky(t)) return e;
}
function h_(e, t) {
  if (e === "change") return t;
}
var _0 = !1;
if (pr) {
  var lf;
  if (pr) {
    var uf = "oninput" in document;
    if (!uf) {
      var tg = document.createElement("div");
      tg.setAttribute("oninput", "return;"), uf = typeof tg.oninput == "function";
    }
    lf = uf;
  } else lf = !1;
  _0 = lf && (!document.documentMode || 9 < document.documentMode);
}
function ng() {
  Fs && (Fs.detachEvent("onpropertychange", E0), Js = Fs = null);
}
function E0(e) {
  if (e.propertyName === "value" && Pa(Js)) {
    var t = [];
    w0(t, Js, e, $d(e)), n0(p_, t);
  }
}
function m_(e, t, n) {
  e === "focusin" ? (ng(), Fs = t, Js = n, Fs.attachEvent("onpropertychange", E0)) : e === "focusout" && ng();
}
function g_(e) {
  if (e === "selectionchange" || e === "keyup" || e === "keydown") return Pa(Js);
}
function y_(e, t) {
  if (e === "click") return Pa(t);
}
function v_(e, t) {
  if (e === "input" || e === "change") return Pa(t);
}
function x_(e, t) {
  return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t;
}
var Nn = typeof Object.is == "function" ? Object.is : x_;
function qs(e, t) {
  if (Nn(e, t)) return !0;
  if (typeof e != "object" || e === null || typeof t != "object" || t === null) return !1;
  var n = Object.keys(e), i = Object.keys(t);
  if (n.length !== i.length) return !1;
  for (i = 0; i < n.length; i++) {
    var s = n[i];
    if (!Kf.call(t, s) || !Nn(e[s], t[s])) return !1;
  }
  return !0;
}
function rg(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function og(e, t) {
  var n = rg(e);
  e = 0;
  for (var i; n; ) {
    if (n.nodeType === 3) {
      if (i = e + n.textContent.length, e <= t && i >= t) return { node: n, offset: t - e };
      e = i;
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
    n = rg(n);
  }
}
function k0(e, t) {
  return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? k0(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
}
function T0() {
  for (var e = window, t = qu(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == "string";
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = qu(e.document);
  }
  return t;
}
function lp(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
}
function S_(e) {
  var t = T0(), n = e.focusedElem, i = e.selectionRange;
  if (t !== n && n && n.ownerDocument && k0(n.ownerDocument.documentElement, n)) {
    if (i !== null && lp(n)) {
      if (t = i.start, e = i.end, e === void 0 && (e = t), "selectionStart" in n) n.selectionStart = t, n.selectionEnd = Math.min(e, n.value.length);
      else if (e = (t = n.ownerDocument || document) && t.defaultView || window, e.getSelection) {
        e = e.getSelection();
        var s = n.textContent.length, l = Math.min(i.start, s);
        i = i.end === void 0 ? l : Math.min(i.end, s), !e.extend && l > i && (s = i, i = l, l = s), s = og(n, l);
        var a = og(
          n,
          i
        );
        s && a && (e.rangeCount !== 1 || e.anchorNode !== s.node || e.anchorOffset !== s.offset || e.focusNode !== a.node || e.focusOffset !== a.offset) && (t = t.createRange(), t.setStart(s.node, s.offset), e.removeAllRanges(), l > i ? (e.addRange(t), e.extend(a.node, a.offset)) : (t.setEnd(a.node, a.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; e = e.parentNode; ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == "function" && n.focus(), n = 0; n < t.length; n++) e = t[n], e.element.scrollLeft = e.left, e.element.scrollTop = e.top;
  }
}
var w_ = pr && "documentMode" in document && 11 >= document.documentMode, di = null, cd = null, Us = null, fd = !1;
function ig(e, t, n) {
  var i = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  fd || di == null || di !== qu(i) || (i = di, "selectionStart" in i && lp(i) ? i = { start: i.selectionStart, end: i.selectionEnd } : (i = (i.ownerDocument && i.ownerDocument.defaultView || window).getSelection(), i = { anchorNode: i.anchorNode, anchorOffset: i.anchorOffset, focusNode: i.focusNode, focusOffset: i.focusOffset }), Us && qs(Us, i) || (Us = i, i = oa(cd, "onSelect"), 0 < i.length && (t = new op("onSelect", "select", null, t, n), e.push({ event: t, listeners: i }), t.target = di)));
}
function vu(e, t) {
  var n = {};
  return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
}
var pi = { animationend: vu("Animation", "AnimationEnd"), animationiteration: vu("Animation", "AnimationIteration"), animationstart: vu("Animation", "AnimationStart"), transitionend: vu("Transition", "TransitionEnd") }, af = {}, P0 = {};
pr && (P0 = document.createElement("div").style, "AnimationEvent" in window || (delete pi.animationend.animation, delete pi.animationiteration.animation, delete pi.animationstart.animation), "TransitionEvent" in window || delete pi.transitionend.transition);
function Ca(e) {
  if (af[e]) return af[e];
  if (!pi[e]) return e;
  var t = pi[e], n;
  for (n in t) if (t.hasOwnProperty(n) && n in P0) return af[e] = t[n];
  return e;
}
var C0 = Ca("animationend"), R0 = Ca("animationiteration"), A0 = Ca("animationstart"), L0 = Ca("transitionend"), M0 = /* @__PURE__ */ new Map(), sg = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function $r(e, t) {
  M0.set(e, t), Do(t, [e]);
}
for (var cf = 0; cf < sg.length; cf++) {
  var ff = sg[cf], __ = ff.toLowerCase(), E_ = ff[0].toUpperCase() + ff.slice(1);
  $r(__, "on" + E_);
}
$r(C0, "onAnimationEnd");
$r(R0, "onAnimationIteration");
$r(A0, "onAnimationStart");
$r("dblclick", "onDoubleClick");
$r("focusin", "onFocus");
$r("focusout", "onBlur");
$r(L0, "onTransitionEnd");
Mi("onMouseEnter", ["mouseout", "mouseover"]);
Mi("onMouseLeave", ["mouseout", "mouseover"]);
Mi("onPointerEnter", ["pointerout", "pointerover"]);
Mi("onPointerLeave", ["pointerout", "pointerover"]);
Do("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
Do("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
Do("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
Do("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
Do("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
Do("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var As = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), k_ = new Set("cancel close invalid load scroll toggle".split(" ").concat(As));
function lg(e, t, n) {
  var i = e.type || "unknown-event";
  e.currentTarget = n, _w(i, t, void 0, e), e.currentTarget = null;
}
function N0(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var i = e[n], s = i.event;
    i = i.listeners;
    e: {
      var l = void 0;
      if (t) for (var a = i.length - 1; 0 <= a; a--) {
        var f = i[a], p = f.instance, m = f.currentTarget;
        if (f = f.listener, p !== l && s.isPropagationStopped()) break e;
        lg(s, f, m), l = p;
      }
      else for (a = 0; a < i.length; a++) {
        if (f = i[a], p = f.instance, m = f.currentTarget, f = f.listener, p !== l && s.isPropagationStopped()) break e;
        lg(s, f, m), l = p;
      }
    }
  }
  if (bu) throw e = sd, bu = !1, sd = null, e;
}
function Pe(e, t) {
  var n = t[gd];
  n === void 0 && (n = t[gd] = /* @__PURE__ */ new Set());
  var i = e + "__bubble";
  n.has(i) || (j0(t, e, 2, !1), n.add(i));
}
function df(e, t, n) {
  var i = 0;
  t && (i |= 4), j0(n, e, i, t);
}
var xu = "_reactListening" + Math.random().toString(36).slice(2);
function $s(e) {
  if (!e[xu]) {
    e[xu] = !0, Hy.forEach(function(n) {
      n !== "selectionchange" && (k_.has(n) || df(n, !1, e), df(n, !0, e));
    });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[xu] || (t[xu] = !0, df("selectionchange", !1, t));
  }
}
function j0(e, t, n, i) {
  switch (g0(t)) {
    case 1:
      var s = Fw;
      break;
    case 4:
      s = Uw;
      break;
    default:
      s = np;
  }
  n = s.bind(null, t, n, e), s = void 0, !id || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (s = !0), i ? s !== void 0 ? e.addEventListener(t, n, { capture: !0, passive: s }) : e.addEventListener(t, n, !0) : s !== void 0 ? e.addEventListener(t, n, { passive: s }) : e.addEventListener(t, n, !1);
}
function pf(e, t, n, i, s) {
  var l = i;
  if (!(t & 1) && !(t & 2) && i !== null) e: for (; ; ) {
    if (i === null) return;
    var a = i.tag;
    if (a === 3 || a === 4) {
      var f = i.stateNode.containerInfo;
      if (f === s || f.nodeType === 8 && f.parentNode === s) break;
      if (a === 4) for (a = i.return; a !== null; ) {
        var p = a.tag;
        if ((p === 3 || p === 4) && (p = a.stateNode.containerInfo, p === s || p.nodeType === 8 && p.parentNode === s)) return;
        a = a.return;
      }
      for (; f !== null; ) {
        if (a = wo(f), a === null) return;
        if (p = a.tag, p === 5 || p === 6) {
          i = l = a;
          continue e;
        }
        f = f.parentNode;
      }
    }
    i = i.return;
  }
  n0(function() {
    var m = l, g = $d(n), y = [];
    e: {
      var v = M0.get(e);
      if (v !== void 0) {
        var w = op, T = e;
        switch (e) {
          case "keypress":
            if (Ou(n) === 0) break e;
          case "keydown":
          case "keyup":
            w = e_;
            break;
          case "focusin":
            T = "focus", w = sf;
            break;
          case "focusout":
            T = "blur", w = sf;
            break;
          case "beforeblur":
          case "afterblur":
            w = sf;
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
            w = Zm;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            w = Gw;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            w = r_;
            break;
          case C0:
          case R0:
          case A0:
            w = Kw;
            break;
          case L0:
            w = i_;
            break;
          case "scroll":
            w = Hw;
            break;
          case "wheel":
            w = l_;
            break;
          case "copy":
          case "cut":
          case "paste":
            w = Xw;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            w = qm;
        }
        var A = (t & 4) !== 0, L = !A && e === "scroll", S = A ? v !== null ? v + "Capture" : null : v;
        A = [];
        for (var x = m, _; x !== null; ) {
          _ = x;
          var R = _.stateNode;
          if (_.tag === 5 && R !== null && (_ = R, S !== null && (R = Qs(x, S), R != null && A.push(bs(x, R, _)))), L) break;
          x = x.return;
        }
        0 < A.length && (v = new w(v, T, null, n, g), y.push({ event: v, listeners: A }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (v = e === "mouseover" || e === "pointerover", w = e === "mouseout" || e === "pointerout", v && n !== rd && (T = n.relatedTarget || n.fromElement) && (wo(T) || T[hr])) break e;
        if ((w || v) && (v = g.window === g ? g : (v = g.ownerDocument) ? v.defaultView || v.parentWindow : window, w ? (T = n.relatedTarget || n.toElement, w = m, T = T ? wo(T) : null, T !== null && (L = Fo(T), T !== L || T.tag !== 5 && T.tag !== 6) && (T = null)) : (w = null, T = m), w !== T)) {
          if (A = Zm, R = "onMouseLeave", S = "onMouseEnter", x = "mouse", (e === "pointerout" || e === "pointerover") && (A = qm, R = "onPointerLeave", S = "onPointerEnter", x = "pointer"), L = w == null ? v : hi(w), _ = T == null ? v : hi(T), v = new A(R, x + "leave", w, n, g), v.target = L, v.relatedTarget = _, R = null, wo(g) === m && (A = new A(S, x + "enter", T, n, g), A.target = _, A.relatedTarget = L, R = A), L = R, w && T) t: {
            for (A = w, S = T, x = 0, _ = A; _; _ = ei(_)) x++;
            for (_ = 0, R = S; R; R = ei(R)) _++;
            for (; 0 < x - _; ) A = ei(A), x--;
            for (; 0 < _ - x; ) S = ei(S), _--;
            for (; x--; ) {
              if (A === S || S !== null && A === S.alternate) break t;
              A = ei(A), S = ei(S);
            }
            A = null;
          }
          else A = null;
          w !== null && ug(y, v, w, A, !1), T !== null && L !== null && ug(y, L, T, A, !0);
        }
      }
      e: {
        if (v = m ? hi(m) : window, w = v.nodeName && v.nodeName.toLowerCase(), w === "select" || w === "input" && v.type === "file") var I = h_;
        else if (eg(v)) if (_0) I = v_;
        else {
          I = g_;
          var O = m_;
        }
        else (w = v.nodeName) && w.toLowerCase() === "input" && (v.type === "checkbox" || v.type === "radio") && (I = y_);
        if (I && (I = I(e, m))) {
          w0(y, I, n, g);
          break e;
        }
        O && O(e, v, m), e === "focusout" && (O = v._wrapperState) && O.controlled && v.type === "number" && $f(v, "number", v.value);
      }
      switch (O = m ? hi(m) : window, e) {
        case "focusin":
          (eg(O) || O.contentEditable === "true") && (di = O, cd = m, Us = null);
          break;
        case "focusout":
          Us = cd = di = null;
          break;
        case "mousedown":
          fd = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          fd = !1, ig(y, n, g);
          break;
        case "selectionchange":
          if (w_) break;
        case "keydown":
        case "keyup":
          ig(y, n, g);
      }
      var D;
      if (sp) e: {
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
      else fi ? x0(e, n) && (B = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (B = "onCompositionStart");
      B && (v0 && n.locale !== "ko" && (fi || B !== "onCompositionStart" ? B === "onCompositionEnd" && fi && (D = y0()) : (Fr = g, rp = "value" in Fr ? Fr.value : Fr.textContent, fi = !0)), O = oa(m, B), 0 < O.length && (B = new Jm(B, e, null, n, g), y.push({ event: B, listeners: O }), D ? B.data = D : (D = S0(n), D !== null && (B.data = D)))), (D = a_ ? c_(e, n) : f_(e, n)) && (m = oa(m, "onBeforeInput"), 0 < m.length && (g = new Jm("onBeforeInput", "beforeinput", null, n, g), y.push({ event: g, listeners: m }), g.data = D));
    }
    N0(y, t);
  });
}
function bs(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function oa(e, t) {
  for (var n = t + "Capture", i = []; e !== null; ) {
    var s = e, l = s.stateNode;
    s.tag === 5 && l !== null && (s = l, l = Qs(e, n), l != null && i.unshift(bs(e, l, s)), l = Qs(e, t), l != null && i.push(bs(e, l, s))), e = e.return;
  }
  return i;
}
function ei(e) {
  if (e === null) return null;
  do
    e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function ug(e, t, n, i, s) {
  for (var l = t._reactName, a = []; n !== null && n !== i; ) {
    var f = n, p = f.alternate, m = f.stateNode;
    if (p !== null && p === i) break;
    f.tag === 5 && m !== null && (f = m, s ? (p = Qs(n, l), p != null && a.unshift(bs(n, p, f))) : s || (p = Qs(n, l), p != null && a.push(bs(n, p, f)))), n = n.return;
  }
  a.length !== 0 && e.push({ event: t, listeners: a });
}
var T_ = /\r\n?/g, P_ = /\u0000|\uFFFD/g;
function ag(e) {
  return (typeof e == "string" ? e : "" + e).replace(T_, `
`).replace(P_, "");
}
function Su(e, t, n) {
  if (t = ag(t), ag(e) !== t && n) throw Error(H(425));
}
function ia() {
}
var dd = null, pd = null;
function hd(e, t) {
  return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
}
var md = typeof setTimeout == "function" ? setTimeout : void 0, C_ = typeof clearTimeout == "function" ? clearTimeout : void 0, cg = typeof Promise == "function" ? Promise : void 0, R_ = typeof queueMicrotask == "function" ? queueMicrotask : typeof cg < "u" ? function(e) {
  return cg.resolve(null).then(e).catch(A_);
} : md;
function A_(e) {
  setTimeout(function() {
    throw e;
  });
}
function hf(e, t) {
  var n = t, i = 0;
  do {
    var s = n.nextSibling;
    if (e.removeChild(n), s && s.nodeType === 8) if (n = s.data, n === "/$") {
      if (i === 0) {
        e.removeChild(s), Zs(t);
        return;
      }
      i--;
    } else n !== "$" && n !== "$?" && n !== "$!" || i++;
    n = s;
  } while (n);
  Zs(t);
}
function Vr(e) {
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
function fg(e) {
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
var Gi = Math.random().toString(36).slice(2), Kn = "__reactFiber$" + Gi, el = "__reactProps$" + Gi, hr = "__reactContainer$" + Gi, gd = "__reactEvents$" + Gi, L_ = "__reactListeners$" + Gi, M_ = "__reactHandles$" + Gi;
function wo(e) {
  var t = e[Kn];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if (t = n[hr] || n[Kn]) {
      if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = fg(e); e !== null; ) {
        if (n = e[Kn]) return n;
        e = fg(e);
      }
      return t;
    }
    e = n, n = e.parentNode;
  }
  return null;
}
function fl(e) {
  return e = e[Kn] || e[hr], !e || e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3 ? null : e;
}
function hi(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(H(33));
}
function Ra(e) {
  return e[el] || null;
}
var yd = [], mi = -1;
function br(e) {
  return { current: e };
}
function Ce(e) {
  0 > mi || (e.current = yd[mi], yd[mi] = null, mi--);
}
function ke(e, t) {
  mi++, yd[mi] = e.current, e.current = t;
}
var qr = {}, gt = br(qr), Ft = br(!1), No = qr;
function Ni(e, t) {
  var n = e.type.contextTypes;
  if (!n) return qr;
  var i = e.stateNode;
  if (i && i.__reactInternalMemoizedUnmaskedChildContext === t) return i.__reactInternalMemoizedMaskedChildContext;
  var s = {}, l;
  for (l in n) s[l] = t[l];
  return i && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = t, e.__reactInternalMemoizedMaskedChildContext = s), s;
}
function Ut(e) {
  return e = e.childContextTypes, e != null;
}
function sa() {
  Ce(Ft), Ce(gt);
}
function dg(e, t, n) {
  if (gt.current !== qr) throw Error(H(168));
  ke(gt, t), ke(Ft, n);
}
function z0(e, t, n) {
  var i = e.stateNode;
  if (t = t.childContextTypes, typeof i.getChildContext != "function") return n;
  i = i.getChildContext();
  for (var s in i) if (!(s in t)) throw Error(H(108, mw(e) || "Unknown", s));
  return je({}, n, i);
}
function la(e) {
  return e = (e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext || qr, No = gt.current, ke(gt, e), ke(Ft, Ft.current), !0;
}
function pg(e, t, n) {
  var i = e.stateNode;
  if (!i) throw Error(H(169));
  n ? (e = z0(e, t, No), i.__reactInternalMemoizedMergedChildContext = e, Ce(Ft), Ce(gt), ke(gt, e)) : Ce(Ft), ke(Ft, n);
}
var ur = null, Aa = !1, mf = !1;
function I0(e) {
  ur === null ? ur = [e] : ur.push(e);
}
function N_(e) {
  Aa = !0, I0(e);
}
function eo() {
  if (!mf && ur !== null) {
    mf = !0;
    var e = 0, t = ge;
    try {
      var n = ur;
      for (ge = 1; e < n.length; e++) {
        var i = n[e];
        do
          i = i(!0);
        while (i !== null);
      }
      ur = null, Aa = !1;
    } catch (s) {
      throw ur !== null && (ur = ur.slice(e + 1)), s0(bd, eo), s;
    } finally {
      ge = t, mf = !1;
    }
  }
  return null;
}
var gi = [], yi = 0, ua = null, aa = 0, dn = [], pn = 0, jo = null, cr = 1, fr = "";
function mo(e, t) {
  gi[yi++] = aa, gi[yi++] = ua, ua = e, aa = t;
}
function O0(e, t, n) {
  dn[pn++] = cr, dn[pn++] = fr, dn[pn++] = jo, jo = e;
  var i = cr;
  e = fr;
  var s = 32 - An(i) - 1;
  i &= ~(1 << s), n += 1;
  var l = 32 - An(t) + s;
  if (30 < l) {
    var a = s - s % 5;
    l = (i & (1 << a) - 1).toString(32), i >>= a, s -= a, cr = 1 << 32 - An(t) + s | n << s | i, fr = l + e;
  } else cr = 1 << l | n << s | i, fr = e;
}
function up(e) {
  e.return !== null && (mo(e, 1), O0(e, 1, 0));
}
function ap(e) {
  for (; e === ua; ) ua = gi[--yi], gi[yi] = null, aa = gi[--yi], gi[yi] = null;
  for (; e === jo; ) jo = dn[--pn], dn[pn] = null, fr = dn[--pn], dn[pn] = null, cr = dn[--pn], dn[pn] = null;
}
var Jt = null, Zt = null, Ae = !1, Rn = null;
function D0(e, t) {
  var n = hn(5, null, null, 0);
  n.elementType = "DELETED", n.stateNode = t, n.return = e, t = e.deletions, t === null ? (e.deletions = [n], e.flags |= 16) : t.push(n);
}
function hg(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t, t !== null ? (e.stateNode = t, Jt = e, Zt = Vr(t.firstChild), !0) : !1;
    case 6:
      return t = e.pendingProps === "" || t.nodeType !== 3 ? null : t, t !== null ? (e.stateNode = t, Jt = e, Zt = null, !0) : !1;
    case 13:
      return t = t.nodeType !== 8 ? null : t, t !== null ? (n = jo !== null ? { id: cr, overflow: fr } : null, e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }, n = hn(18, null, null, 0), n.stateNode = t, n.return = e, e.child = n, Jt = e, Zt = null, !0) : !1;
    default:
      return !1;
  }
}
function vd(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function xd(e) {
  if (Ae) {
    var t = Zt;
    if (t) {
      var n = t;
      if (!hg(e, t)) {
        if (vd(e)) throw Error(H(418));
        t = Vr(n.nextSibling);
        var i = Jt;
        t && hg(e, t) ? D0(i, n) : (e.flags = e.flags & -4097 | 2, Ae = !1, Jt = e);
      }
    } else {
      if (vd(e)) throw Error(H(418));
      e.flags = e.flags & -4097 | 2, Ae = !1, Jt = e;
    }
  }
}
function mg(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  Jt = e;
}
function wu(e) {
  if (e !== Jt) return !1;
  if (!Ae) return mg(e), Ae = !0, !1;
  var t;
  if ((t = e.tag !== 3) && !(t = e.tag !== 5) && (t = e.type, t = t !== "head" && t !== "body" && !hd(e.type, e.memoizedProps)), t && (t = Zt)) {
    if (vd(e)) throw F0(), Error(H(418));
    for (; t; ) D0(e, t), t = Vr(t.nextSibling);
  }
  if (mg(e), e.tag === 13) {
    if (e = e.memoizedState, e = e !== null ? e.dehydrated : null, !e) throw Error(H(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === "/$") {
            if (t === 0) {
              Zt = Vr(e.nextSibling);
              break e;
            }
            t--;
          } else n !== "$" && n !== "$!" && n !== "$?" || t++;
        }
        e = e.nextSibling;
      }
      Zt = null;
    }
  } else Zt = Jt ? Vr(e.stateNode.nextSibling) : null;
  return !0;
}
function F0() {
  for (var e = Zt; e; ) e = Vr(e.nextSibling);
}
function ji() {
  Zt = Jt = null, Ae = !1;
}
function cp(e) {
  Rn === null ? Rn = [e] : Rn.push(e);
}
var j_ = yr.ReactCurrentBatchConfig;
function ys(e, t, n) {
  if (e = n.ref, e !== null && typeof e != "function" && typeof e != "object") {
    if (n._owner) {
      if (n = n._owner, n) {
        if (n.tag !== 1) throw Error(H(309));
        var i = n.stateNode;
      }
      if (!i) throw Error(H(147, e));
      var s = i, l = "" + e;
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
function _u(e, t) {
  throw e = Object.prototype.toString.call(t), Error(H(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e));
}
function gg(e) {
  var t = e._init;
  return t(e._payload);
}
function U0(e) {
  function t(S, x) {
    if (e) {
      var _ = S.deletions;
      _ === null ? (S.deletions = [x], S.flags |= 16) : _.push(x);
    }
  }
  function n(S, x) {
    if (!e) return null;
    for (; x !== null; ) t(S, x), x = x.sibling;
    return null;
  }
  function i(S, x) {
    for (S = /* @__PURE__ */ new Map(); x !== null; ) x.key !== null ? S.set(x.key, x) : S.set(x.index, x), x = x.sibling;
    return S;
  }
  function s(S, x) {
    return S = Yr(S, x), S.index = 0, S.sibling = null, S;
  }
  function l(S, x, _) {
    return S.index = _, e ? (_ = S.alternate, _ !== null ? (_ = _.index, _ < x ? (S.flags |= 2, x) : _) : (S.flags |= 2, x)) : (S.flags |= 1048576, x);
  }
  function a(S) {
    return e && S.alternate === null && (S.flags |= 2), S;
  }
  function f(S, x, _, R) {
    return x === null || x.tag !== 6 ? (x = _f(_, S.mode, R), x.return = S, x) : (x = s(x, _), x.return = S, x);
  }
  function p(S, x, _, R) {
    var I = _.type;
    return I === ci ? g(S, x, _.props.children, R, _.key) : x !== null && (x.elementType === I || typeof I == "object" && I !== null && I.$$typeof === zr && gg(I) === x.type) ? (R = s(x, _.props), R.ref = ys(S, x, _), R.return = S, R) : (R = Wu(_.type, _.key, _.props, null, S.mode, R), R.ref = ys(S, x, _), R.return = S, R);
  }
  function m(S, x, _, R) {
    return x === null || x.tag !== 4 || x.stateNode.containerInfo !== _.containerInfo || x.stateNode.implementation !== _.implementation ? (x = Ef(_, S.mode, R), x.return = S, x) : (x = s(x, _.children || []), x.return = S, x);
  }
  function g(S, x, _, R, I) {
    return x === null || x.tag !== 7 ? (x = Mo(_, S.mode, R, I), x.return = S, x) : (x = s(x, _), x.return = S, x);
  }
  function y(S, x, _) {
    if (typeof x == "string" && x !== "" || typeof x == "number") return x = _f("" + x, S.mode, _), x.return = S, x;
    if (typeof x == "object" && x !== null) {
      switch (x.$$typeof) {
        case fu:
          return _ = Wu(x.type, x.key, x.props, null, S.mode, _), _.ref = ys(S, null, x), _.return = S, _;
        case ai:
          return x = Ef(x, S.mode, _), x.return = S, x;
        case zr:
          var R = x._init;
          return y(S, R(x._payload), _);
      }
      if (Cs(x) || ds(x)) return x = Mo(x, S.mode, _, null), x.return = S, x;
      _u(S, x);
    }
    return null;
  }
  function v(S, x, _, R) {
    var I = x !== null ? x.key : null;
    if (typeof _ == "string" && _ !== "" || typeof _ == "number") return I !== null ? null : f(S, x, "" + _, R);
    if (typeof _ == "object" && _ !== null) {
      switch (_.$$typeof) {
        case fu:
          return _.key === I ? p(S, x, _, R) : null;
        case ai:
          return _.key === I ? m(S, x, _, R) : null;
        case zr:
          return I = _._init, v(
            S,
            x,
            I(_._payload),
            R
          );
      }
      if (Cs(_) || ds(_)) return I !== null ? null : g(S, x, _, R, null);
      _u(S, _);
    }
    return null;
  }
  function w(S, x, _, R, I) {
    if (typeof R == "string" && R !== "" || typeof R == "number") return S = S.get(_) || null, f(x, S, "" + R, I);
    if (typeof R == "object" && R !== null) {
      switch (R.$$typeof) {
        case fu:
          return S = S.get(R.key === null ? _ : R.key) || null, p(x, S, R, I);
        case ai:
          return S = S.get(R.key === null ? _ : R.key) || null, m(x, S, R, I);
        case zr:
          var O = R._init;
          return w(S, x, _, O(R._payload), I);
      }
      if (Cs(R) || ds(R)) return S = S.get(_) || null, g(x, S, R, I, null);
      _u(x, R);
    }
    return null;
  }
  function T(S, x, _, R) {
    for (var I = null, O = null, D = x, B = x = 0, q = null; D !== null && B < _.length; B++) {
      D.index > B ? (q = D, D = null) : q = D.sibling;
      var V = v(S, D, _[B], R);
      if (V === null) {
        D === null && (D = q);
        break;
      }
      e && D && V.alternate === null && t(S, D), x = l(V, x, B), O === null ? I = V : O.sibling = V, O = V, D = q;
    }
    if (B === _.length) return n(S, D), Ae && mo(S, B), I;
    if (D === null) {
      for (; B < _.length; B++) D = y(S, _[B], R), D !== null && (x = l(D, x, B), O === null ? I = D : O.sibling = D, O = D);
      return Ae && mo(S, B), I;
    }
    for (D = i(S, D); B < _.length; B++) q = w(D, S, B, _[B], R), q !== null && (e && q.alternate !== null && D.delete(q.key === null ? B : q.key), x = l(q, x, B), O === null ? I = q : O.sibling = q, O = q);
    return e && D.forEach(function(Q) {
      return t(S, Q);
    }), Ae && mo(S, B), I;
  }
  function A(S, x, _, R) {
    var I = ds(_);
    if (typeof I != "function") throw Error(H(150));
    if (_ = I.call(_), _ == null) throw Error(H(151));
    for (var O = I = null, D = x, B = x = 0, q = null, V = _.next(); D !== null && !V.done; B++, V = _.next()) {
      D.index > B ? (q = D, D = null) : q = D.sibling;
      var Q = v(S, D, V.value, R);
      if (Q === null) {
        D === null && (D = q);
        break;
      }
      e && D && Q.alternate === null && t(S, D), x = l(Q, x, B), O === null ? I = Q : O.sibling = Q, O = Q, D = q;
    }
    if (V.done) return n(
      S,
      D
    ), Ae && mo(S, B), I;
    if (D === null) {
      for (; !V.done; B++, V = _.next()) V = y(S, V.value, R), V !== null && (x = l(V, x, B), O === null ? I = V : O.sibling = V, O = V);
      return Ae && mo(S, B), I;
    }
    for (D = i(S, D); !V.done; B++, V = _.next()) V = w(D, S, B, V.value, R), V !== null && (e && V.alternate !== null && D.delete(V.key === null ? B : V.key), x = l(V, x, B), O === null ? I = V : O.sibling = V, O = V);
    return e && D.forEach(function(le) {
      return t(S, le);
    }), Ae && mo(S, B), I;
  }
  function L(S, x, _, R) {
    if (typeof _ == "object" && _ !== null && _.type === ci && _.key === null && (_ = _.props.children), typeof _ == "object" && _ !== null) {
      switch (_.$$typeof) {
        case fu:
          e: {
            for (var I = _.key, O = x; O !== null; ) {
              if (O.key === I) {
                if (I = _.type, I === ci) {
                  if (O.tag === 7) {
                    n(S, O.sibling), x = s(O, _.props.children), x.return = S, S = x;
                    break e;
                  }
                } else if (O.elementType === I || typeof I == "object" && I !== null && I.$$typeof === zr && gg(I) === O.type) {
                  n(S, O.sibling), x = s(O, _.props), x.ref = ys(S, O, _), x.return = S, S = x;
                  break e;
                }
                n(S, O);
                break;
              } else t(S, O);
              O = O.sibling;
            }
            _.type === ci ? (x = Mo(_.props.children, S.mode, R, _.key), x.return = S, S = x) : (R = Wu(_.type, _.key, _.props, null, S.mode, R), R.ref = ys(S, x, _), R.return = S, S = R);
          }
          return a(S);
        case ai:
          e: {
            for (O = _.key; x !== null; ) {
              if (x.key === O) if (x.tag === 4 && x.stateNode.containerInfo === _.containerInfo && x.stateNode.implementation === _.implementation) {
                n(S, x.sibling), x = s(x, _.children || []), x.return = S, S = x;
                break e;
              } else {
                n(S, x);
                break;
              }
              else t(S, x);
              x = x.sibling;
            }
            x = Ef(_, S.mode, R), x.return = S, S = x;
          }
          return a(S);
        case zr:
          return O = _._init, L(S, x, O(_._payload), R);
      }
      if (Cs(_)) return T(S, x, _, R);
      if (ds(_)) return A(S, x, _, R);
      _u(S, _);
    }
    return typeof _ == "string" && _ !== "" || typeof _ == "number" ? (_ = "" + _, x !== null && x.tag === 6 ? (n(S, x.sibling), x = s(x, _), x.return = S, S = x) : (n(S, x), x = _f(_, S.mode, R), x.return = S, S = x), a(S)) : n(S, x);
  }
  return L;
}
var zi = U0(!0), H0 = U0(!1), ca = br(null), fa = null, vi = null, fp = null;
function dp() {
  fp = vi = fa = null;
}
function pp(e) {
  var t = ca.current;
  Ce(ca), e._currentValue = t;
}
function Sd(e, t, n) {
  for (; e !== null; ) {
    var i = e.alternate;
    if ((e.childLanes & t) !== t ? (e.childLanes |= t, i !== null && (i.childLanes |= t)) : i !== null && (i.childLanes & t) !== t && (i.childLanes |= t), e === n) break;
    e = e.return;
  }
}
function Ri(e, t) {
  fa = e, fp = vi = null, e = e.dependencies, e !== null && e.firstContext !== null && (e.lanes & t && (Dt = !0), e.firstContext = null);
}
function gn(e) {
  var t = e._currentValue;
  if (fp !== e) if (e = { context: e, memoizedValue: t, next: null }, vi === null) {
    if (fa === null) throw Error(H(308));
    vi = e, fa.dependencies = { lanes: 0, firstContext: e };
  } else vi = vi.next = e;
  return t;
}
var _o = null;
function hp(e) {
  _o === null ? _o = [e] : _o.push(e);
}
function B0(e, t, n, i) {
  var s = t.interleaved;
  return s === null ? (n.next = n, hp(t)) : (n.next = s.next, s.next = n), t.interleaved = n, mr(e, i);
}
function mr(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; ) e.childLanes |= t, n = e.alternate, n !== null && (n.childLanes |= t), n = e, e = e.return;
  return n.tag === 3 ? n.stateNode : null;
}
var Ir = !1;
function mp(e) {
  e.updateQueue = { baseState: e.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
}
function G0(e, t) {
  e = e.updateQueue, t.updateQueue === e && (t.updateQueue = { baseState: e.baseState, firstBaseUpdate: e.firstBaseUpdate, lastBaseUpdate: e.lastBaseUpdate, shared: e.shared, effects: e.effects });
}
function dr(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function Kr(e, t, n) {
  var i = e.updateQueue;
  if (i === null) return null;
  if (i = i.shared, fe & 2) {
    var s = i.pending;
    return s === null ? t.next = t : (t.next = s.next, s.next = t), i.pending = t, mr(e, n);
  }
  return s = i.interleaved, s === null ? (t.next = t, hp(i)) : (t.next = s.next, s.next = t), i.interleaved = t, mr(e, n);
}
function Du(e, t, n) {
  if (t = t.updateQueue, t !== null && (t = t.shared, (n & 4194240) !== 0)) {
    var i = t.lanes;
    i &= e.pendingLanes, n |= i, t.lanes = n, ep(e, n);
  }
}
function yg(e, t) {
  var n = e.updateQueue, i = e.alternate;
  if (i !== null && (i = i.updateQueue, n === i)) {
    var s = null, l = null;
    if (n = n.firstBaseUpdate, n !== null) {
      do {
        var a = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        l === null ? s = l = a : l = l.next = a, n = n.next;
      } while (n !== null);
      l === null ? s = l = t : l = l.next = t;
    } else s = l = t;
    n = { baseState: i.baseState, firstBaseUpdate: s, lastBaseUpdate: l, shared: i.shared, effects: i.effects }, e.updateQueue = n;
    return;
  }
  e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
}
function da(e, t, n, i) {
  var s = e.updateQueue;
  Ir = !1;
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
      var v = f.lane, w = f.eventTime;
      if ((i & v) === v) {
        g !== null && (g = g.next = {
          eventTime: w,
          lane: 0,
          tag: f.tag,
          payload: f.payload,
          callback: f.callback,
          next: null
        });
        e: {
          var T = e, A = f;
          switch (v = t, w = n, A.tag) {
            case 1:
              if (T = A.payload, typeof T == "function") {
                y = T.call(w, y, v);
                break e;
              }
              y = T;
              break e;
            case 3:
              T.flags = T.flags & -65537 | 128;
            case 0:
              if (T = A.payload, v = typeof T == "function" ? T.call(w, y, v) : T, v == null) break e;
              y = je({}, y, v);
              break e;
            case 2:
              Ir = !0;
          }
        }
        f.callback !== null && f.lane !== 0 && (e.flags |= 64, v = s.effects, v === null ? s.effects = [f] : v.push(f));
      } else w = { eventTime: w, lane: v, tag: f.tag, payload: f.payload, callback: f.callback, next: null }, g === null ? (m = g = w, p = y) : g = g.next = w, a |= v;
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
    Io |= a, e.lanes = a, e.memoizedState = y;
  }
}
function vg(e, t, n) {
  if (e = t.effects, t.effects = null, e !== null) for (t = 0; t < e.length; t++) {
    var i = e[t], s = i.callback;
    if (s !== null) {
      if (i.callback = null, i = n, typeof s != "function") throw Error(H(191, s));
      s.call(i);
    }
  }
}
var dl = {}, Zn = br(dl), tl = br(dl), nl = br(dl);
function Eo(e) {
  if (e === dl) throw Error(H(174));
  return e;
}
function gp(e, t) {
  switch (ke(nl, t), ke(tl, e), ke(Zn, dl), e = t.nodeType, e) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : ed(null, "");
      break;
    default:
      e = e === 8 ? t.parentNode : t, t = e.namespaceURI || null, e = e.tagName, t = ed(t, e);
  }
  Ce(Zn), ke(Zn, t);
}
function Ii() {
  Ce(Zn), Ce(tl), Ce(nl);
}
function W0(e) {
  Eo(nl.current);
  var t = Eo(Zn.current), n = ed(t, e.type);
  t !== n && (ke(tl, e), ke(Zn, n));
}
function yp(e) {
  tl.current === e && (Ce(Zn), Ce(tl));
}
var Me = br(0);
function pa(e) {
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
var gf = [];
function vp() {
  for (var e = 0; e < gf.length; e++) gf[e]._workInProgressVersionPrimary = null;
  gf.length = 0;
}
var Fu = yr.ReactCurrentDispatcher, yf = yr.ReactCurrentBatchConfig, zo = 0, Ne = null, Ke = null, qe = null, ha = !1, Hs = !1, rl = 0, z_ = 0;
function ct() {
  throw Error(H(321));
}
function xp(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!Nn(e[n], t[n])) return !1;
  return !0;
}
function Sp(e, t, n, i, s, l) {
  if (zo = l, Ne = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, Fu.current = e === null || e.memoizedState === null ? F_ : U_, e = n(i, s), Hs) {
    l = 0;
    do {
      if (Hs = !1, rl = 0, 25 <= l) throw Error(H(301));
      l += 1, qe = Ke = null, t.updateQueue = null, Fu.current = H_, e = n(i, s);
    } while (Hs);
  }
  if (Fu.current = ma, t = Ke !== null && Ke.next !== null, zo = 0, qe = Ke = Ne = null, ha = !1, t) throw Error(H(300));
  return e;
}
function wp() {
  var e = rl !== 0;
  return rl = 0, e;
}
function Vn() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return qe === null ? Ne.memoizedState = qe = e : qe = qe.next = e, qe;
}
function yn() {
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
function ol(e, t) {
  return typeof t == "function" ? t(e) : t;
}
function vf(e) {
  var t = yn(), n = t.queue;
  if (n === null) throw Error(H(311));
  n.lastRenderedReducer = e;
  var i = Ke, s = i.baseQueue, l = n.pending;
  if (l !== null) {
    if (s !== null) {
      var a = s.next;
      s.next = l.next, l.next = a;
    }
    i.baseQueue = s = l, n.pending = null;
  }
  if (s !== null) {
    l = s.next, i = i.baseState;
    var f = a = null, p = null, m = l;
    do {
      var g = m.lane;
      if ((zo & g) === g) p !== null && (p = p.next = { lane: 0, action: m.action, hasEagerState: m.hasEagerState, eagerState: m.eagerState, next: null }), i = m.hasEagerState ? m.eagerState : e(i, m.action);
      else {
        var y = {
          lane: g,
          action: m.action,
          hasEagerState: m.hasEagerState,
          eagerState: m.eagerState,
          next: null
        };
        p === null ? (f = p = y, a = i) : p = p.next = y, Ne.lanes |= g, Io |= g;
      }
      m = m.next;
    } while (m !== null && m !== l);
    p === null ? a = i : p.next = f, Nn(i, t.memoizedState) || (Dt = !0), t.memoizedState = i, t.baseState = a, t.baseQueue = p, n.lastRenderedState = i;
  }
  if (e = n.interleaved, e !== null) {
    s = e;
    do
      l = s.lane, Ne.lanes |= l, Io |= l, s = s.next;
    while (s !== e);
  } else s === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function xf(e) {
  var t = yn(), n = t.queue;
  if (n === null) throw Error(H(311));
  n.lastRenderedReducer = e;
  var i = n.dispatch, s = n.pending, l = t.memoizedState;
  if (s !== null) {
    n.pending = null;
    var a = s = s.next;
    do
      l = e(l, a.action), a = a.next;
    while (a !== s);
    Nn(l, t.memoizedState) || (Dt = !0), t.memoizedState = l, t.baseQueue === null && (t.baseState = l), n.lastRenderedState = l;
  }
  return [l, i];
}
function V0() {
}
function K0(e, t) {
  var n = Ne, i = yn(), s = t(), l = !Nn(i.memoizedState, s);
  if (l && (i.memoizedState = s, Dt = !0), i = i.queue, _p(Y0.bind(null, n, i, e), [e]), i.getSnapshot !== t || l || qe !== null && qe.memoizedState.tag & 1) {
    if (n.flags |= 2048, il(9, X0.bind(null, n, i, s, t), void 0, null), $e === null) throw Error(H(349));
    zo & 30 || Q0(n, t, s);
  }
  return s;
}
function Q0(e, t, n) {
  e.flags |= 16384, e = { getSnapshot: t, value: n }, t = Ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Ne.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
}
function X0(e, t, n, i) {
  t.value = n, t.getSnapshot = i, Z0(t) && J0(e);
}
function Y0(e, t, n) {
  return n(function() {
    Z0(t) && J0(e);
  });
}
function Z0(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Nn(e, n);
  } catch {
    return !0;
  }
}
function J0(e) {
  var t = mr(e, 1);
  t !== null && Ln(t, e, 1, -1);
}
function xg(e) {
  var t = Vn();
  return typeof e == "function" && (e = e()), t.memoizedState = t.baseState = e, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: ol, lastRenderedState: e }, t.queue = e, e = e.dispatch = D_.bind(null, Ne, e), [t.memoizedState, e];
}
function il(e, t, n, i) {
  return e = { tag: e, create: t, destroy: n, deps: i, next: null }, t = Ne.updateQueue, t === null ? (t = { lastEffect: null, stores: null }, Ne.updateQueue = t, t.lastEffect = e.next = e) : (n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (i = n.next, n.next = e, e.next = i, t.lastEffect = e)), e;
}
function q0() {
  return yn().memoizedState;
}
function Uu(e, t, n, i) {
  var s = Vn();
  Ne.flags |= e, s.memoizedState = il(1 | t, n, void 0, i === void 0 ? null : i);
}
function La(e, t, n, i) {
  var s = yn();
  i = i === void 0 ? null : i;
  var l = void 0;
  if (Ke !== null) {
    var a = Ke.memoizedState;
    if (l = a.destroy, i !== null && xp(i, a.deps)) {
      s.memoizedState = il(t, n, l, i);
      return;
    }
  }
  Ne.flags |= e, s.memoizedState = il(1 | t, n, l, i);
}
function Sg(e, t) {
  return Uu(8390656, 8, e, t);
}
function _p(e, t) {
  return La(2048, 8, e, t);
}
function $0(e, t) {
  return La(4, 2, e, t);
}
function b0(e, t) {
  return La(4, 4, e, t);
}
function ev(e, t) {
  if (typeof t == "function") return e = e(), t(e), function() {
    t(null);
  };
  if (t != null) return e = e(), t.current = e, function() {
    t.current = null;
  };
}
function tv(e, t, n) {
  return n = n != null ? n.concat([e]) : null, La(4, 4, ev.bind(null, t, e), n);
}
function Ep() {
}
function nv(e, t) {
  var n = yn();
  t = t === void 0 ? null : t;
  var i = n.memoizedState;
  return i !== null && t !== null && xp(t, i[1]) ? i[0] : (n.memoizedState = [e, t], e);
}
function rv(e, t) {
  var n = yn();
  t = t === void 0 ? null : t;
  var i = n.memoizedState;
  return i !== null && t !== null && xp(t, i[1]) ? i[0] : (e = e(), n.memoizedState = [e, t], e);
}
function ov(e, t, n) {
  return zo & 21 ? (Nn(n, t) || (n = a0(), Ne.lanes |= n, Io |= n, e.baseState = !0), t) : (e.baseState && (e.baseState = !1, Dt = !0), e.memoizedState = n);
}
function I_(e, t) {
  var n = ge;
  ge = n !== 0 && 4 > n ? n : 4, e(!0);
  var i = yf.transition;
  yf.transition = {};
  try {
    e(!1), t();
  } finally {
    ge = n, yf.transition = i;
  }
}
function iv() {
  return yn().memoizedState;
}
function O_(e, t, n) {
  var i = Xr(e);
  if (n = { lane: i, action: n, hasEagerState: !1, eagerState: null, next: null }, sv(e)) lv(t, n);
  else if (n = B0(e, t, n, i), n !== null) {
    var s = wt();
    Ln(n, e, i, s), uv(n, t, i);
  }
}
function D_(e, t, n) {
  var i = Xr(e), s = { lane: i, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (sv(e)) lv(t, s);
  else {
    var l = e.alternate;
    if (e.lanes === 0 && (l === null || l.lanes === 0) && (l = t.lastRenderedReducer, l !== null)) try {
      var a = t.lastRenderedState, f = l(a, n);
      if (s.hasEagerState = !0, s.eagerState = f, Nn(f, a)) {
        var p = t.interleaved;
        p === null ? (s.next = s, hp(t)) : (s.next = p.next, p.next = s), t.interleaved = s;
        return;
      }
    } catch {
    } finally {
    }
    n = B0(e, t, s, i), n !== null && (s = wt(), Ln(n, e, i, s), uv(n, t, i));
  }
}
function sv(e) {
  var t = e.alternate;
  return e === Ne || t !== null && t === Ne;
}
function lv(e, t) {
  Hs = ha = !0;
  var n = e.pending;
  n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
}
function uv(e, t, n) {
  if (n & 4194240) {
    var i = t.lanes;
    i &= e.pendingLanes, n |= i, t.lanes = n, ep(e, n);
  }
}
var ma = { readContext: gn, useCallback: ct, useContext: ct, useEffect: ct, useImperativeHandle: ct, useInsertionEffect: ct, useLayoutEffect: ct, useMemo: ct, useReducer: ct, useRef: ct, useState: ct, useDebugValue: ct, useDeferredValue: ct, useTransition: ct, useMutableSource: ct, useSyncExternalStore: ct, useId: ct, unstable_isNewReconciler: !1 }, F_ = { readContext: gn, useCallback: function(e, t) {
  return Vn().memoizedState = [e, t === void 0 ? null : t], e;
}, useContext: gn, useEffect: Sg, useImperativeHandle: function(e, t, n) {
  return n = n != null ? n.concat([e]) : null, Uu(
    4194308,
    4,
    ev.bind(null, t, e),
    n
  );
}, useLayoutEffect: function(e, t) {
  return Uu(4194308, 4, e, t);
}, useInsertionEffect: function(e, t) {
  return Uu(4, 2, e, t);
}, useMemo: function(e, t) {
  var n = Vn();
  return t = t === void 0 ? null : t, e = e(), n.memoizedState = [e, t], e;
}, useReducer: function(e, t, n) {
  var i = Vn();
  return t = n !== void 0 ? n(t) : t, i.memoizedState = i.baseState = t, e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }, i.queue = e, e = e.dispatch = O_.bind(null, Ne, e), [i.memoizedState, e];
}, useRef: function(e) {
  var t = Vn();
  return e = { current: e }, t.memoizedState = e;
}, useState: xg, useDebugValue: Ep, useDeferredValue: function(e) {
  return Vn().memoizedState = e;
}, useTransition: function() {
  var e = xg(!1), t = e[0];
  return e = I_.bind(null, e[1]), Vn().memoizedState = e, [t, e];
}, useMutableSource: function() {
}, useSyncExternalStore: function(e, t, n) {
  var i = Ne, s = Vn();
  if (Ae) {
    if (n === void 0) throw Error(H(407));
    n = n();
  } else {
    if (n = t(), $e === null) throw Error(H(349));
    zo & 30 || Q0(i, t, n);
  }
  s.memoizedState = n;
  var l = { value: n, getSnapshot: t };
  return s.queue = l, Sg(Y0.bind(
    null,
    i,
    l,
    e
  ), [e]), i.flags |= 2048, il(9, X0.bind(null, i, l, n, t), void 0, null), n;
}, useId: function() {
  var e = Vn(), t = $e.identifierPrefix;
  if (Ae) {
    var n = fr, i = cr;
    n = (i & ~(1 << 32 - An(i) - 1)).toString(32) + n, t = ":" + t + "R" + n, n = rl++, 0 < n && (t += "H" + n.toString(32)), t += ":";
  } else n = z_++, t = ":" + t + "r" + n.toString(32) + ":";
  return e.memoizedState = t;
}, unstable_isNewReconciler: !1 }, U_ = {
  readContext: gn,
  useCallback: nv,
  useContext: gn,
  useEffect: _p,
  useImperativeHandle: tv,
  useInsertionEffect: $0,
  useLayoutEffect: b0,
  useMemo: rv,
  useReducer: vf,
  useRef: q0,
  useState: function() {
    return vf(ol);
  },
  useDebugValue: Ep,
  useDeferredValue: function(e) {
    var t = yn();
    return ov(t, Ke.memoizedState, e);
  },
  useTransition: function() {
    var e = vf(ol)[0], t = yn().memoizedState;
    return [e, t];
  },
  useMutableSource: V0,
  useSyncExternalStore: K0,
  useId: iv,
  unstable_isNewReconciler: !1
}, H_ = { readContext: gn, useCallback: nv, useContext: gn, useEffect: _p, useImperativeHandle: tv, useInsertionEffect: $0, useLayoutEffect: b0, useMemo: rv, useReducer: xf, useRef: q0, useState: function() {
  return xf(ol);
}, useDebugValue: Ep, useDeferredValue: function(e) {
  var t = yn();
  return Ke === null ? t.memoizedState = e : ov(t, Ke.memoizedState, e);
}, useTransition: function() {
  var e = xf(ol)[0], t = yn().memoizedState;
  return [e, t];
}, useMutableSource: V0, useSyncExternalStore: K0, useId: iv, unstable_isNewReconciler: !1 };
function Pn(e, t) {
  if (e && e.defaultProps) {
    t = je({}, t), e = e.defaultProps;
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
function wd(e, t, n, i) {
  t = e.memoizedState, n = n(i, t), n = n == null ? t : je({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
}
var Ma = { isMounted: function(e) {
  return (e = e._reactInternals) ? Fo(e) === e : !1;
}, enqueueSetState: function(e, t, n) {
  e = e._reactInternals;
  var i = wt(), s = Xr(e), l = dr(i, s);
  l.payload = t, n != null && (l.callback = n), t = Kr(e, l, s), t !== null && (Ln(t, e, s, i), Du(t, e, s));
}, enqueueReplaceState: function(e, t, n) {
  e = e._reactInternals;
  var i = wt(), s = Xr(e), l = dr(i, s);
  l.tag = 1, l.payload = t, n != null && (l.callback = n), t = Kr(e, l, s), t !== null && (Ln(t, e, s, i), Du(t, e, s));
}, enqueueForceUpdate: function(e, t) {
  e = e._reactInternals;
  var n = wt(), i = Xr(e), s = dr(n, i);
  s.tag = 2, t != null && (s.callback = t), t = Kr(e, s, i), t !== null && (Ln(t, e, i, n), Du(t, e, i));
} };
function wg(e, t, n, i, s, l, a) {
  return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(i, l, a) : t.prototype && t.prototype.isPureReactComponent ? !qs(n, i) || !qs(s, l) : !0;
}
function av(e, t, n) {
  var i = !1, s = qr, l = t.contextType;
  return typeof l == "object" && l !== null ? l = gn(l) : (s = Ut(t) ? No : gt.current, i = t.contextTypes, l = (i = i != null) ? Ni(e, s) : qr), t = new t(n, l), e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null, t.updater = Ma, e.stateNode = t, t._reactInternals = e, i && (e = e.stateNode, e.__reactInternalMemoizedUnmaskedChildContext = s, e.__reactInternalMemoizedMaskedChildContext = l), t;
}
function _g(e, t, n, i) {
  e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, i), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, i), t.state !== e && Ma.enqueueReplaceState(t, t.state, null);
}
function _d(e, t, n, i) {
  var s = e.stateNode;
  s.props = n, s.state = e.memoizedState, s.refs = {}, mp(e);
  var l = t.contextType;
  typeof l == "object" && l !== null ? s.context = gn(l) : (l = Ut(t) ? No : gt.current, s.context = Ni(e, l)), s.state = e.memoizedState, l = t.getDerivedStateFromProps, typeof l == "function" && (wd(e, t, l, n), s.state = e.memoizedState), typeof t.getDerivedStateFromProps == "function" || typeof s.getSnapshotBeforeUpdate == "function" || typeof s.UNSAFE_componentWillMount != "function" && typeof s.componentWillMount != "function" || (t = s.state, typeof s.componentWillMount == "function" && s.componentWillMount(), typeof s.UNSAFE_componentWillMount == "function" && s.UNSAFE_componentWillMount(), t !== s.state && Ma.enqueueReplaceState(s, s.state, null), da(e, n, s, i), s.state = e.memoizedState), typeof s.componentDidMount == "function" && (e.flags |= 4194308);
}
function Oi(e, t) {
  try {
    var n = "", i = t;
    do
      n += hw(i), i = i.return;
    while (i);
    var s = n;
  } catch (l) {
    s = `
Error generating stack: ` + l.message + `
` + l.stack;
  }
  return { value: e, source: t, stack: s, digest: null };
}
function Sf(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function Ed(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function() {
      throw n;
    });
  }
}
var B_ = typeof WeakMap == "function" ? WeakMap : Map;
function cv(e, t, n) {
  n = dr(-1, n), n.tag = 3, n.payload = { element: null };
  var i = t.value;
  return n.callback = function() {
    ya || (ya = !0, jd = i), Ed(e, t);
  }, n;
}
function fv(e, t, n) {
  n = dr(-1, n), n.tag = 3;
  var i = e.type.getDerivedStateFromError;
  if (typeof i == "function") {
    var s = t.value;
    n.payload = function() {
      return i(s);
    }, n.callback = function() {
      Ed(e, t);
    };
  }
  var l = e.stateNode;
  return l !== null && typeof l.componentDidCatch == "function" && (n.callback = function() {
    Ed(e, t), typeof i != "function" && (Qr === null ? Qr = /* @__PURE__ */ new Set([this]) : Qr.add(this));
    var a = t.stack;
    this.componentDidCatch(t.value, { componentStack: a !== null ? a : "" });
  }), n;
}
function Eg(e, t, n) {
  var i = e.pingCache;
  if (i === null) {
    i = e.pingCache = new B_();
    var s = /* @__PURE__ */ new Set();
    i.set(t, s);
  } else s = i.get(t), s === void 0 && (s = /* @__PURE__ */ new Set(), i.set(t, s));
  s.has(n) || (s.add(n), e = t2.bind(null, e, t, n), t.then(e, e));
}
function kg(e) {
  do {
    var t;
    if ((t = e.tag === 13) && (t = e.memoizedState, t = t !== null ? t.dehydrated !== null : !0), t) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function Tg(e, t, n, i, s) {
  return e.mode & 1 ? (e.flags |= 65536, e.lanes = s, e) : (e === t ? e.flags |= 65536 : (e.flags |= 128, n.flags |= 131072, n.flags &= -52805, n.tag === 1 && (n.alternate === null ? n.tag = 17 : (t = dr(-1, 1), t.tag = 2, Kr(n, t, 1))), n.lanes |= 1), e);
}
var G_ = yr.ReactCurrentOwner, Dt = !1;
function St(e, t, n, i) {
  t.child = e === null ? H0(t, null, n, i) : zi(t, e.child, n, i);
}
function Pg(e, t, n, i, s) {
  n = n.render;
  var l = t.ref;
  return Ri(t, s), i = Sp(e, t, n, i, l, s), n = wp(), e !== null && !Dt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~s, gr(e, t, s)) : (Ae && n && up(t), t.flags |= 1, St(e, t, i, s), t.child);
}
function Cg(e, t, n, i, s) {
  if (e === null) {
    var l = n.type;
    return typeof l == "function" && !Mp(l) && l.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0 ? (t.tag = 15, t.type = l, dv(e, t, l, i, s)) : (e = Wu(n.type, null, i, t, t.mode, s), e.ref = t.ref, e.return = t, t.child = e);
  }
  if (l = e.child, !(e.lanes & s)) {
    var a = l.memoizedProps;
    if (n = n.compare, n = n !== null ? n : qs, n(a, i) && e.ref === t.ref) return gr(e, t, s);
  }
  return t.flags |= 1, e = Yr(l, i), e.ref = t.ref, e.return = t, t.child = e;
}
function dv(e, t, n, i, s) {
  if (e !== null) {
    var l = e.memoizedProps;
    if (qs(l, i) && e.ref === t.ref) if (Dt = !1, t.pendingProps = i = l, (e.lanes & s) !== 0) e.flags & 131072 && (Dt = !0);
    else return t.lanes = e.lanes, gr(e, t, s);
  }
  return kd(e, t, n, i, s);
}
function pv(e, t, n) {
  var i = t.pendingProps, s = i.children, l = e !== null ? e.memoizedState : null;
  if (i.mode === "hidden") if (!(t.mode & 1)) t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, ke(Si, Yt), Yt |= n;
  else {
    if (!(n & 1073741824)) return e = l !== null ? l.baseLanes | n : n, t.lanes = t.childLanes = 1073741824, t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }, t.updateQueue = null, ke(Si, Yt), Yt |= e, null;
    t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, i = l !== null ? l.baseLanes : n, ke(Si, Yt), Yt |= i;
  }
  else l !== null ? (i = l.baseLanes | n, t.memoizedState = null) : i = n, ke(Si, Yt), Yt |= i;
  return St(e, t, s, n), t.child;
}
function hv(e, t) {
  var n = t.ref;
  (e === null && n !== null || e !== null && e.ref !== n) && (t.flags |= 512, t.flags |= 2097152);
}
function kd(e, t, n, i, s) {
  var l = Ut(n) ? No : gt.current;
  return l = Ni(t, l), Ri(t, s), n = Sp(e, t, n, i, l, s), i = wp(), e !== null && !Dt ? (t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~s, gr(e, t, s)) : (Ae && i && up(t), t.flags |= 1, St(e, t, n, s), t.child);
}
function Rg(e, t, n, i, s) {
  if (Ut(n)) {
    var l = !0;
    la(t);
  } else l = !1;
  if (Ri(t, s), t.stateNode === null) Hu(e, t), av(t, n, i), _d(t, n, i, s), i = !0;
  else if (e === null) {
    var a = t.stateNode, f = t.memoizedProps;
    a.props = f;
    var p = a.context, m = n.contextType;
    typeof m == "object" && m !== null ? m = gn(m) : (m = Ut(n) ? No : gt.current, m = Ni(t, m));
    var g = n.getDerivedStateFromProps, y = typeof g == "function" || typeof a.getSnapshotBeforeUpdate == "function";
    y || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (f !== i || p !== m) && _g(t, a, i, m), Ir = !1;
    var v = t.memoizedState;
    a.state = v, da(t, i, a, s), p = t.memoizedState, f !== i || v !== p || Ft.current || Ir ? (typeof g == "function" && (wd(t, n, g, i), p = t.memoizedState), (f = Ir || wg(t, n, f, i, v, p, m)) ? (y || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = i, t.memoizedState = p), a.props = i, a.state = p, a.context = m, i = f) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), i = !1);
  } else {
    a = t.stateNode, G0(e, t), f = t.memoizedProps, m = t.type === t.elementType ? f : Pn(t.type, f), a.props = m, y = t.pendingProps, v = a.context, p = n.contextType, typeof p == "object" && p !== null ? p = gn(p) : (p = Ut(n) ? No : gt.current, p = Ni(t, p));
    var w = n.getDerivedStateFromProps;
    (g = typeof w == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (f !== y || v !== p) && _g(t, a, i, p), Ir = !1, v = t.memoizedState, a.state = v, da(t, i, a, s);
    var T = t.memoizedState;
    f !== y || v !== T || Ft.current || Ir ? (typeof w == "function" && (wd(t, n, w, i), T = t.memoizedState), (m = Ir || wg(t, n, m, i, v, T, p) || !1) ? (g || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(i, T, p), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(i, T, p)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), t.memoizedProps = i, t.memoizedState = T), a.props = i, a.state = T, a.context = p, i = m) : (typeof a.componentDidUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || f === e.memoizedProps && v === e.memoizedState || (t.flags |= 1024), i = !1);
  }
  return Td(e, t, n, i, l, s);
}
function Td(e, t, n, i, s, l) {
  hv(e, t);
  var a = (t.flags & 128) !== 0;
  if (!i && !a) return s && pg(t, n, !1), gr(e, t, l);
  i = t.stateNode, G_.current = t;
  var f = a && typeof n.getDerivedStateFromError != "function" ? null : i.render();
  return t.flags |= 1, e !== null && a ? (t.child = zi(t, e.child, null, l), t.child = zi(t, null, f, l)) : St(e, t, f, l), t.memoizedState = i.state, s && pg(t, n, !0), t.child;
}
function mv(e) {
  var t = e.stateNode;
  t.pendingContext ? dg(e, t.pendingContext, t.pendingContext !== t.context) : t.context && dg(e, t.context, !1), gp(e, t.containerInfo);
}
function Ag(e, t, n, i, s) {
  return ji(), cp(s), t.flags |= 256, St(e, t, n, i), t.child;
}
var Pd = { dehydrated: null, treeContext: null, retryLane: 0 };
function Cd(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function gv(e, t, n) {
  var i = t.pendingProps, s = Me.current, l = !1, a = (t.flags & 128) !== 0, f;
  if ((f = a) || (f = e !== null && e.memoizedState === null ? !1 : (s & 2) !== 0), f ? (l = !0, t.flags &= -129) : (e === null || e.memoizedState !== null) && (s |= 1), ke(Me, s & 1), e === null)
    return xd(t), e = t.memoizedState, e !== null && (e = e.dehydrated, e !== null) ? (t.mode & 1 ? e.data === "$!" ? t.lanes = 8 : t.lanes = 1073741824 : t.lanes = 1, null) : (a = i.children, e = i.fallback, l ? (i = t.mode, l = t.child, a = { mode: "hidden", children: a }, !(i & 1) && l !== null ? (l.childLanes = 0, l.pendingProps = a) : l = za(a, i, 0, null), e = Mo(e, i, n, null), l.return = t, e.return = t, l.sibling = e, t.child = l, t.child.memoizedState = Cd(n), t.memoizedState = Pd, e) : kp(t, a));
  if (s = e.memoizedState, s !== null && (f = s.dehydrated, f !== null)) return W_(e, t, a, i, f, s, n);
  if (l) {
    l = i.fallback, a = t.mode, s = e.child, f = s.sibling;
    var p = { mode: "hidden", children: i.children };
    return !(a & 1) && t.child !== s ? (i = t.child, i.childLanes = 0, i.pendingProps = p, t.deletions = null) : (i = Yr(s, p), i.subtreeFlags = s.subtreeFlags & 14680064), f !== null ? l = Yr(f, l) : (l = Mo(l, a, n, null), l.flags |= 2), l.return = t, i.return = t, i.sibling = l, t.child = i, i = l, l = t.child, a = e.child.memoizedState, a = a === null ? Cd(n) : { baseLanes: a.baseLanes | n, cachePool: null, transitions: a.transitions }, l.memoizedState = a, l.childLanes = e.childLanes & ~n, t.memoizedState = Pd, i;
  }
  return l = e.child, e = l.sibling, i = Yr(l, { mode: "visible", children: i.children }), !(t.mode & 1) && (i.lanes = n), i.return = t, i.sibling = null, e !== null && (n = t.deletions, n === null ? (t.deletions = [e], t.flags |= 16) : n.push(e)), t.child = i, t.memoizedState = null, i;
}
function kp(e, t) {
  return t = za({ mode: "visible", children: t }, e.mode, 0, null), t.return = e, e.child = t;
}
function Eu(e, t, n, i) {
  return i !== null && cp(i), zi(t, e.child, null, n), e = kp(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
}
function W_(e, t, n, i, s, l, a) {
  if (n)
    return t.flags & 256 ? (t.flags &= -257, i = Sf(Error(H(422))), Eu(e, t, a, i)) : t.memoizedState !== null ? (t.child = e.child, t.flags |= 128, null) : (l = i.fallback, s = t.mode, i = za({ mode: "visible", children: i.children }, s, 0, null), l = Mo(l, s, a, null), l.flags |= 2, i.return = t, l.return = t, i.sibling = l, t.child = i, t.mode & 1 && zi(t, e.child, null, a), t.child.memoizedState = Cd(a), t.memoizedState = Pd, l);
  if (!(t.mode & 1)) return Eu(e, t, a, null);
  if (s.data === "$!") {
    if (i = s.nextSibling && s.nextSibling.dataset, i) var f = i.dgst;
    return i = f, l = Error(H(419)), i = Sf(l, i, void 0), Eu(e, t, a, i);
  }
  if (f = (a & e.childLanes) !== 0, Dt || f) {
    if (i = $e, i !== null) {
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
      s = s & (i.suspendedLanes | a) ? 0 : s, s !== 0 && s !== l.retryLane && (l.retryLane = s, mr(e, s), Ln(i, e, s, -1));
    }
    return Lp(), i = Sf(Error(H(421))), Eu(e, t, a, i);
  }
  return s.data === "$?" ? (t.flags |= 128, t.child = e.child, t = n2.bind(null, e), s._reactRetry = t, null) : (e = l.treeContext, Zt = Vr(s.nextSibling), Jt = t, Ae = !0, Rn = null, e !== null && (dn[pn++] = cr, dn[pn++] = fr, dn[pn++] = jo, cr = e.id, fr = e.overflow, jo = t), t = kp(t, i.children), t.flags |= 4096, t);
}
function Lg(e, t, n) {
  e.lanes |= t;
  var i = e.alternate;
  i !== null && (i.lanes |= t), Sd(e.return, t, n);
}
function wf(e, t, n, i, s) {
  var l = e.memoizedState;
  l === null ? e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: i, tail: n, tailMode: s } : (l.isBackwards = t, l.rendering = null, l.renderingStartTime = 0, l.last = i, l.tail = n, l.tailMode = s);
}
function yv(e, t, n) {
  var i = t.pendingProps, s = i.revealOrder, l = i.tail;
  if (St(e, t, i.children, n), i = Me.current, i & 2) i = i & 1 | 2, t.flags |= 128;
  else {
    if (e !== null && e.flags & 128) e: for (e = t.child; e !== null; ) {
      if (e.tag === 13) e.memoizedState !== null && Lg(e, n, t);
      else if (e.tag === 19) Lg(e, n, t);
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
    i &= 1;
  }
  if (ke(Me, i), !(t.mode & 1)) t.memoizedState = null;
  else switch (s) {
    case "forwards":
      for (n = t.child, s = null; n !== null; ) e = n.alternate, e !== null && pa(e) === null && (s = n), n = n.sibling;
      n = s, n === null ? (s = t.child, t.child = null) : (s = n.sibling, n.sibling = null), wf(t, !1, s, n, l);
      break;
    case "backwards":
      for (n = null, s = t.child, t.child = null; s !== null; ) {
        if (e = s.alternate, e !== null && pa(e) === null) {
          t.child = s;
          break;
        }
        e = s.sibling, s.sibling = n, n = s, s = e;
      }
      wf(t, !0, n, null, l);
      break;
    case "together":
      wf(t, !1, null, null, void 0);
      break;
    default:
      t.memoizedState = null;
  }
  return t.child;
}
function Hu(e, t) {
  !(t.mode & 1) && e !== null && (e.alternate = null, t.alternate = null, t.flags |= 2);
}
function gr(e, t, n) {
  if (e !== null && (t.dependencies = e.dependencies), Io |= t.lanes, !(n & t.childLanes)) return null;
  if (e !== null && t.child !== e.child) throw Error(H(153));
  if (t.child !== null) {
    for (e = t.child, n = Yr(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; ) e = e.sibling, n = n.sibling = Yr(e, e.pendingProps), n.return = t;
    n.sibling = null;
  }
  return t.child;
}
function V_(e, t, n) {
  switch (t.tag) {
    case 3:
      mv(t), ji();
      break;
    case 5:
      W0(t);
      break;
    case 1:
      Ut(t.type) && la(t);
      break;
    case 4:
      gp(t, t.stateNode.containerInfo);
      break;
    case 10:
      var i = t.type._context, s = t.memoizedProps.value;
      ke(ca, i._currentValue), i._currentValue = s;
      break;
    case 13:
      if (i = t.memoizedState, i !== null)
        return i.dehydrated !== null ? (ke(Me, Me.current & 1), t.flags |= 128, null) : n & t.child.childLanes ? gv(e, t, n) : (ke(Me, Me.current & 1), e = gr(e, t, n), e !== null ? e.sibling : null);
      ke(Me, Me.current & 1);
      break;
    case 19:
      if (i = (n & t.childLanes) !== 0, e.flags & 128) {
        if (i) return yv(e, t, n);
        t.flags |= 128;
      }
      if (s = t.memoizedState, s !== null && (s.rendering = null, s.tail = null, s.lastEffect = null), ke(Me, Me.current), i) break;
      return null;
    case 22:
    case 23:
      return t.lanes = 0, pv(e, t, n);
  }
  return gr(e, t, n);
}
var vv, Rd, xv, Sv;
vv = function(e, t) {
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
Rd = function() {
};
xv = function(e, t, n, i) {
  var s = e.memoizedProps;
  if (s !== i) {
    e = t.stateNode, Eo(Zn.current);
    var l = null;
    switch (n) {
      case "input":
        s = Jf(e, s), i = Jf(e, i), l = [];
        break;
      case "select":
        s = je({}, s, { value: void 0 }), i = je({}, i, { value: void 0 }), l = [];
        break;
      case "textarea":
        s = bf(e, s), i = bf(e, i), l = [];
        break;
      default:
        typeof s.onClick != "function" && typeof i.onClick == "function" && (e.onclick = ia);
    }
    td(n, i);
    var a;
    n = null;
    for (m in s) if (!i.hasOwnProperty(m) && s.hasOwnProperty(m) && s[m] != null) if (m === "style") {
      var f = s[m];
      for (a in f) f.hasOwnProperty(a) && (n || (n = {}), n[a] = "");
    } else m !== "dangerouslySetInnerHTML" && m !== "children" && m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && m !== "autoFocus" && (Vs.hasOwnProperty(m) ? l || (l = []) : (l = l || []).push(m, null));
    for (m in i) {
      var p = i[m];
      if (f = s != null ? s[m] : void 0, i.hasOwnProperty(m) && p !== f && (p != null || f != null)) if (m === "style") if (f) {
        for (a in f) !f.hasOwnProperty(a) || p && p.hasOwnProperty(a) || (n || (n = {}), n[a] = "");
        for (a in p) p.hasOwnProperty(a) && f[a] !== p[a] && (n || (n = {}), n[a] = p[a]);
      } else n || (l || (l = []), l.push(
        m,
        n
      )), n = p;
      else m === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, f = f ? f.__html : void 0, p != null && f !== p && (l = l || []).push(m, p)) : m === "children" ? typeof p != "string" && typeof p != "number" || (l = l || []).push(m, "" + p) : m !== "suppressContentEditableWarning" && m !== "suppressHydrationWarning" && (Vs.hasOwnProperty(m) ? (p != null && m === "onScroll" && Pe("scroll", e), l || f === p || (l = [])) : (l = l || []).push(m, p));
    }
    n && (l = l || []).push("style", n);
    var m = l;
    (t.updateQueue = m) && (t.flags |= 4);
  }
};
Sv = function(e, t, n, i) {
  n !== i && (t.flags |= 4);
};
function vs(e, t) {
  if (!Ae) switch (e.tailMode) {
    case "hidden":
      t = e.tail;
      for (var n = null; t !== null; ) t.alternate !== null && (n = t), t = t.sibling;
      n === null ? e.tail = null : n.sibling = null;
      break;
    case "collapsed":
      n = e.tail;
      for (var i = null; n !== null; ) n.alternate !== null && (i = n), n = n.sibling;
      i === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : i.sibling = null;
  }
}
function ft(e) {
  var t = e.alternate !== null && e.alternate.child === e.child, n = 0, i = 0;
  if (t) for (var s = e.child; s !== null; ) n |= s.lanes | s.childLanes, i |= s.subtreeFlags & 14680064, i |= s.flags & 14680064, s.return = e, s = s.sibling;
  else for (s = e.child; s !== null; ) n |= s.lanes | s.childLanes, i |= s.subtreeFlags, i |= s.flags, s.return = e, s = s.sibling;
  return e.subtreeFlags |= i, e.childLanes = n, t;
}
function K_(e, t, n) {
  var i = t.pendingProps;
  switch (ap(t), t.tag) {
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
      return Ut(t.type) && sa(), ft(t), null;
    case 3:
      return i = t.stateNode, Ii(), Ce(Ft), Ce(gt), vp(), i.pendingContext && (i.context = i.pendingContext, i.pendingContext = null), (e === null || e.child === null) && (wu(t) ? t.flags |= 4 : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Rn !== null && (Od(Rn), Rn = null))), Rd(e, t), ft(t), null;
    case 5:
      yp(t);
      var s = Eo(nl.current);
      if (n = t.type, e !== null && t.stateNode != null) xv(e, t, n, i, s), e.ref !== t.ref && (t.flags |= 512, t.flags |= 2097152);
      else {
        if (!i) {
          if (t.stateNode === null) throw Error(H(166));
          return ft(t), null;
        }
        if (e = Eo(Zn.current), wu(t)) {
          i = t.stateNode, n = t.type;
          var l = t.memoizedProps;
          switch (i[Kn] = t, i[el] = l, e = (t.mode & 1) !== 0, n) {
            case "dialog":
              Pe("cancel", i), Pe("close", i);
              break;
            case "iframe":
            case "object":
            case "embed":
              Pe("load", i);
              break;
            case "video":
            case "audio":
              for (s = 0; s < As.length; s++) Pe(As[s], i);
              break;
            case "source":
              Pe("error", i);
              break;
            case "img":
            case "image":
            case "link":
              Pe(
                "error",
                i
              ), Pe("load", i);
              break;
            case "details":
              Pe("toggle", i);
              break;
            case "input":
              Um(i, l), Pe("invalid", i);
              break;
            case "select":
              i._wrapperState = { wasMultiple: !!l.multiple }, Pe("invalid", i);
              break;
            case "textarea":
              Bm(i, l), Pe("invalid", i);
          }
          td(n, l), s = null;
          for (var a in l) if (l.hasOwnProperty(a)) {
            var f = l[a];
            a === "children" ? typeof f == "string" ? i.textContent !== f && (l.suppressHydrationWarning !== !0 && Su(i.textContent, f, e), s = ["children", f]) : typeof f == "number" && i.textContent !== "" + f && (l.suppressHydrationWarning !== !0 && Su(
              i.textContent,
              f,
              e
            ), s = ["children", "" + f]) : Vs.hasOwnProperty(a) && f != null && a === "onScroll" && Pe("scroll", i);
          }
          switch (n) {
            case "input":
              du(i), Hm(i, l, !0);
              break;
            case "textarea":
              du(i), Gm(i);
              break;
            case "select":
            case "option":
              break;
            default:
              typeof l.onClick == "function" && (i.onclick = ia);
          }
          i = s, t.updateQueue = i, i !== null && (t.flags |= 4);
        } else {
          a = s.nodeType === 9 ? s : s.ownerDocument, e === "http://www.w3.org/1999/xhtml" && (e = Yy(n)), e === "http://www.w3.org/1999/xhtml" ? n === "script" ? (e = a.createElement("div"), e.innerHTML = "<script><\/script>", e = e.removeChild(e.firstChild)) : typeof i.is == "string" ? e = a.createElement(n, { is: i.is }) : (e = a.createElement(n), n === "select" && (a = e, i.multiple ? a.multiple = !0 : i.size && (a.size = i.size))) : e = a.createElementNS(e, n), e[Kn] = t, e[el] = i, vv(e, t, !1, !1), t.stateNode = e;
          e: {
            switch (a = nd(n, i), n) {
              case "dialog":
                Pe("cancel", e), Pe("close", e), s = i;
                break;
              case "iframe":
              case "object":
              case "embed":
                Pe("load", e), s = i;
                break;
              case "video":
              case "audio":
                for (s = 0; s < As.length; s++) Pe(As[s], e);
                s = i;
                break;
              case "source":
                Pe("error", e), s = i;
                break;
              case "img":
              case "image":
              case "link":
                Pe(
                  "error",
                  e
                ), Pe("load", e), s = i;
                break;
              case "details":
                Pe("toggle", e), s = i;
                break;
              case "input":
                Um(e, i), s = Jf(e, i), Pe("invalid", e);
                break;
              case "option":
                s = i;
                break;
              case "select":
                e._wrapperState = { wasMultiple: !!i.multiple }, s = je({}, i, { value: void 0 }), Pe("invalid", e);
                break;
              case "textarea":
                Bm(e, i), s = bf(e, i), Pe("invalid", e);
                break;
              default:
                s = i;
            }
            td(n, s), f = s;
            for (l in f) if (f.hasOwnProperty(l)) {
              var p = f[l];
              l === "style" ? qy(e, p) : l === "dangerouslySetInnerHTML" ? (p = p ? p.__html : void 0, p != null && Zy(e, p)) : l === "children" ? typeof p == "string" ? (n !== "textarea" || p !== "") && Ks(e, p) : typeof p == "number" && Ks(e, "" + p) : l !== "suppressContentEditableWarning" && l !== "suppressHydrationWarning" && l !== "autoFocus" && (Vs.hasOwnProperty(l) ? p != null && l === "onScroll" && Pe("scroll", e) : p != null && Yd(e, l, p, a));
            }
            switch (n) {
              case "input":
                du(e), Hm(e, i, !1);
                break;
              case "textarea":
                du(e), Gm(e);
                break;
              case "option":
                i.value != null && e.setAttribute("value", "" + Jr(i.value));
                break;
              case "select":
                e.multiple = !!i.multiple, l = i.value, l != null ? ki(e, !!i.multiple, l, !1) : i.defaultValue != null && ki(
                  e,
                  !!i.multiple,
                  i.defaultValue,
                  !0
                );
                break;
              default:
                typeof s.onClick == "function" && (e.onclick = ia);
            }
            switch (n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                i = !!i.autoFocus;
                break e;
              case "img":
                i = !0;
                break e;
              default:
                i = !1;
            }
          }
          i && (t.flags |= 4);
        }
        t.ref !== null && (t.flags |= 512, t.flags |= 2097152);
      }
      return ft(t), null;
    case 6:
      if (e && t.stateNode != null) Sv(e, t, e.memoizedProps, i);
      else {
        if (typeof i != "string" && t.stateNode === null) throw Error(H(166));
        if (n = Eo(nl.current), Eo(Zn.current), wu(t)) {
          if (i = t.stateNode, n = t.memoizedProps, i[Kn] = t, (l = i.nodeValue !== n) && (e = Jt, e !== null)) switch (e.tag) {
            case 3:
              Su(i.nodeValue, n, (e.mode & 1) !== 0);
              break;
            case 5:
              e.memoizedProps.suppressHydrationWarning !== !0 && Su(i.nodeValue, n, (e.mode & 1) !== 0);
          }
          l && (t.flags |= 4);
        } else i = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(i), i[Kn] = t, t.stateNode = i;
      }
      return ft(t), null;
    case 13:
      if (Ce(Me), i = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
        if (Ae && Zt !== null && t.mode & 1 && !(t.flags & 128)) F0(), ji(), t.flags |= 98560, l = !1;
        else if (l = wu(t), i !== null && i.dehydrated !== null) {
          if (e === null) {
            if (!l) throw Error(H(318));
            if (l = t.memoizedState, l = l !== null ? l.dehydrated : null, !l) throw Error(H(317));
            l[Kn] = t;
          } else ji(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
          ft(t), l = !1;
        } else Rn !== null && (Od(Rn), Rn = null), l = !0;
        if (!l) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128 ? (t.lanes = n, t) : (i = i !== null, i !== (e !== null && e.memoizedState !== null) && i && (t.child.flags |= 8192, t.mode & 1 && (e === null || Me.current & 1 ? Qe === 0 && (Qe = 3) : Lp())), t.updateQueue !== null && (t.flags |= 4), ft(t), null);
    case 4:
      return Ii(), Rd(e, t), e === null && $s(t.stateNode.containerInfo), ft(t), null;
    case 10:
      return pp(t.type._context), ft(t), null;
    case 17:
      return Ut(t.type) && sa(), ft(t), null;
    case 19:
      if (Ce(Me), l = t.memoizedState, l === null) return ft(t), null;
      if (i = (t.flags & 128) !== 0, a = l.rendering, a === null) if (i) vs(l, !1);
      else {
        if (Qe !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null; ) {
          if (a = pa(e), a !== null) {
            for (t.flags |= 128, vs(l, !1), i = a.updateQueue, i !== null && (t.updateQueue = i, t.flags |= 4), t.subtreeFlags = 0, i = n, n = t.child; n !== null; ) l = n, e = i, l.flags &= 14680066, a = l.alternate, a === null ? (l.childLanes = 0, l.lanes = e, l.child = null, l.subtreeFlags = 0, l.memoizedProps = null, l.memoizedState = null, l.updateQueue = null, l.dependencies = null, l.stateNode = null) : (l.childLanes = a.childLanes, l.lanes = a.lanes, l.child = a.child, l.subtreeFlags = 0, l.deletions = null, l.memoizedProps = a.memoizedProps, l.memoizedState = a.memoizedState, l.updateQueue = a.updateQueue, l.type = a.type, e = a.dependencies, l.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }), n = n.sibling;
            return ke(Me, Me.current & 1 | 2), t.child;
          }
          e = e.sibling;
        }
        l.tail !== null && Ue() > Di && (t.flags |= 128, i = !0, vs(l, !1), t.lanes = 4194304);
      }
      else {
        if (!i) if (e = pa(a), e !== null) {
          if (t.flags |= 128, i = !0, n = e.updateQueue, n !== null && (t.updateQueue = n, t.flags |= 4), vs(l, !0), l.tail === null && l.tailMode === "hidden" && !a.alternate && !Ae) return ft(t), null;
        } else 2 * Ue() - l.renderingStartTime > Di && n !== 1073741824 && (t.flags |= 128, i = !0, vs(l, !1), t.lanes = 4194304);
        l.isBackwards ? (a.sibling = t.child, t.child = a) : (n = l.last, n !== null ? n.sibling = a : t.child = a, l.last = a);
      }
      return l.tail !== null ? (t = l.tail, l.rendering = t, l.tail = t.sibling, l.renderingStartTime = Ue(), t.sibling = null, n = Me.current, ke(Me, i ? n & 1 | 2 : n & 1), t) : (ft(t), null);
    case 22:
    case 23:
      return Ap(), i = t.memoizedState !== null, e !== null && e.memoizedState !== null !== i && (t.flags |= 8192), i && t.mode & 1 ? Yt & 1073741824 && (ft(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : ft(t), null;
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(H(156, t.tag));
}
function Q_(e, t) {
  switch (ap(t), t.tag) {
    case 1:
      return Ut(t.type) && sa(), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 3:
      return Ii(), Ce(Ft), Ce(gt), vp(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
    case 5:
      return yp(t), null;
    case 13:
      if (Ce(Me), e = t.memoizedState, e !== null && e.dehydrated !== null) {
        if (t.alternate === null) throw Error(H(340));
        ji();
      }
      return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
    case 19:
      return Ce(Me), null;
    case 4:
      return Ii(), null;
    case 10:
      return pp(t.type._context), null;
    case 22:
    case 23:
      return Ap(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var ku = !1, mt = !1, X_ = typeof WeakSet == "function" ? WeakSet : Set, Z = null;
function xi(e, t) {
  var n = e.ref;
  if (n !== null) if (typeof n == "function") try {
    n(null);
  } catch (i) {
    Oe(e, t, i);
  }
  else n.current = null;
}
function Ad(e, t, n) {
  try {
    n();
  } catch (i) {
    Oe(e, t, i);
  }
}
var Mg = !1;
function Y_(e, t) {
  if (dd = na, e = T0(), lp(e)) {
    if ("selectionStart" in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else e: {
      n = (n = e.ownerDocument) && n.defaultView || window;
      var i = n.getSelection && n.getSelection();
      if (i && i.rangeCount !== 0) {
        n = i.anchorNode;
        var s = i.anchorOffset, l = i.focusNode;
        i = i.focusOffset;
        try {
          n.nodeType, l.nodeType;
        } catch {
          n = null;
          break e;
        }
        var a = 0, f = -1, p = -1, m = 0, g = 0, y = e, v = null;
        t: for (; ; ) {
          for (var w; y !== n || s !== 0 && y.nodeType !== 3 || (f = a + s), y !== l || i !== 0 && y.nodeType !== 3 || (p = a + i), y.nodeType === 3 && (a += y.nodeValue.length), (w = y.firstChild) !== null; )
            v = y, y = w;
          for (; ; ) {
            if (y === e) break t;
            if (v === n && ++m === s && (f = a), v === l && ++g === i && (p = a), (w = y.nextSibling) !== null) break;
            y = v, v = y.parentNode;
          }
          y = w;
        }
        n = f === -1 || p === -1 ? null : { start: f, end: p };
      } else n = null;
    }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (pd = { focusedElem: e, selectionRange: n }, na = !1, Z = t; Z !== null; ) if (t = Z, e = t.child, (t.subtreeFlags & 1028) !== 0 && e !== null) e.return = t, Z = e;
  else for (; Z !== null; ) {
    t = Z;
    try {
      var T = t.alternate;
      if (t.flags & 1024) switch (t.tag) {
        case 0:
        case 11:
        case 15:
          break;
        case 1:
          if (T !== null) {
            var A = T.memoizedProps, L = T.memoizedState, S = t.stateNode, x = S.getSnapshotBeforeUpdate(t.elementType === t.type ? A : Pn(t.type, A), L);
            S.__reactInternalSnapshotBeforeUpdate = x;
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
  return T = Mg, Mg = !1, T;
}
function Bs(e, t, n) {
  var i = t.updateQueue;
  if (i = i !== null ? i.lastEffect : null, i !== null) {
    var s = i = i.next;
    do {
      if ((s.tag & e) === e) {
        var l = s.destroy;
        s.destroy = void 0, l !== void 0 && Ad(t, n, l);
      }
      s = s.next;
    } while (s !== i);
  }
}
function Na(e, t) {
  if (t = t.updateQueue, t = t !== null ? t.lastEffect : null, t !== null) {
    var n = t = t.next;
    do {
      if ((n.tag & e) === e) {
        var i = n.create;
        n.destroy = i();
      }
      n = n.next;
    } while (n !== t);
  }
}
function Ld(e) {
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
function wv(e) {
  var t = e.alternate;
  t !== null && (e.alternate = null, wv(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && (delete t[Kn], delete t[el], delete t[gd], delete t[L_], delete t[M_])), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
}
function _v(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Ng(e) {
  e: for (; ; ) {
    for (; e.sibling === null; ) {
      if (e.return === null || _v(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      e.child.return = e, e = e.child;
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Md(e, t, n) {
  var i = e.tag;
  if (i === 5 || i === 6) e = e.stateNode, t ? n.nodeType === 8 ? n.parentNode.insertBefore(e, t) : n.insertBefore(e, t) : (n.nodeType === 8 ? (t = n.parentNode, t.insertBefore(e, n)) : (t = n, t.appendChild(e)), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = ia));
  else if (i !== 4 && (e = e.child, e !== null)) for (Md(e, t, n), e = e.sibling; e !== null; ) Md(e, t, n), e = e.sibling;
}
function Nd(e, t, n) {
  var i = e.tag;
  if (i === 5 || i === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (i !== 4 && (e = e.child, e !== null)) for (Nd(e, t, n), e = e.sibling; e !== null; ) Nd(e, t, n), e = e.sibling;
}
var tt = null, Cn = !1;
function Rr(e, t, n) {
  for (n = n.child; n !== null; ) Ev(e, t, n), n = n.sibling;
}
function Ev(e, t, n) {
  if (Yn && typeof Yn.onCommitFiberUnmount == "function") try {
    Yn.onCommitFiberUnmount(ka, n);
  } catch {
  }
  switch (n.tag) {
    case 5:
      mt || xi(n, t);
    case 6:
      var i = tt, s = Cn;
      tt = null, Rr(e, t, n), tt = i, Cn = s, tt !== null && (Cn ? (e = tt, n = n.stateNode, e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n)) : tt.removeChild(n.stateNode));
      break;
    case 18:
      tt !== null && (Cn ? (e = tt, n = n.stateNode, e.nodeType === 8 ? hf(e.parentNode, n) : e.nodeType === 1 && hf(e, n), Zs(e)) : hf(tt, n.stateNode));
      break;
    case 4:
      i = tt, s = Cn, tt = n.stateNode.containerInfo, Cn = !0, Rr(e, t, n), tt = i, Cn = s;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!mt && (i = n.updateQueue, i !== null && (i = i.lastEffect, i !== null))) {
        s = i = i.next;
        do {
          var l = s, a = l.destroy;
          l = l.tag, a !== void 0 && (l & 2 || l & 4) && Ad(n, t, a), s = s.next;
        } while (s !== i);
      }
      Rr(e, t, n);
      break;
    case 1:
      if (!mt && (xi(n, t), i = n.stateNode, typeof i.componentWillUnmount == "function")) try {
        i.props = n.memoizedProps, i.state = n.memoizedState, i.componentWillUnmount();
      } catch (f) {
        Oe(n, t, f);
      }
      Rr(e, t, n);
      break;
    case 21:
      Rr(e, t, n);
      break;
    case 22:
      n.mode & 1 ? (mt = (i = mt) || n.memoizedState !== null, Rr(e, t, n), mt = i) : Rr(e, t, n);
      break;
    default:
      Rr(e, t, n);
  }
}
function jg(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new X_()), t.forEach(function(i) {
      var s = r2.bind(null, e, i);
      n.has(i) || (n.add(i), i.then(s, s));
    });
  }
}
function _n(e, t) {
  var n = t.deletions;
  if (n !== null) for (var i = 0; i < n.length; i++) {
    var s = n[i];
    try {
      var l = e, a = t, f = a;
      e: for (; f !== null; ) {
        switch (f.tag) {
          case 5:
            tt = f.stateNode, Cn = !1;
            break e;
          case 3:
            tt = f.stateNode.containerInfo, Cn = !0;
            break e;
          case 4:
            tt = f.stateNode.containerInfo, Cn = !0;
            break e;
        }
        f = f.return;
      }
      if (tt === null) throw Error(H(160));
      Ev(l, a, s), tt = null, Cn = !1;
      var p = s.alternate;
      p !== null && (p.return = null), s.return = null;
    } catch (m) {
      Oe(s, t, m);
    }
  }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) kv(t, e), t = t.sibling;
}
function kv(e, t) {
  var n = e.alternate, i = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if (_n(t, e), Hn(e), i & 4) {
        try {
          Bs(3, e, e.return), Na(3, e);
        } catch (A) {
          Oe(e, e.return, A);
        }
        try {
          Bs(5, e, e.return);
        } catch (A) {
          Oe(e, e.return, A);
        }
      }
      break;
    case 1:
      _n(t, e), Hn(e), i & 512 && n !== null && xi(n, n.return);
      break;
    case 5:
      if (_n(t, e), Hn(e), i & 512 && n !== null && xi(n, n.return), e.flags & 32) {
        var s = e.stateNode;
        try {
          Ks(s, "");
        } catch (A) {
          Oe(e, e.return, A);
        }
      }
      if (i & 4 && (s = e.stateNode, s != null)) {
        var l = e.memoizedProps, a = n !== null ? n.memoizedProps : l, f = e.type, p = e.updateQueue;
        if (e.updateQueue = null, p !== null) try {
          f === "input" && l.type === "radio" && l.name != null && Qy(s, l), nd(f, a);
          var m = nd(f, l);
          for (a = 0; a < p.length; a += 2) {
            var g = p[a], y = p[a + 1];
            g === "style" ? qy(s, y) : g === "dangerouslySetInnerHTML" ? Zy(s, y) : g === "children" ? Ks(s, y) : Yd(s, g, y, m);
          }
          switch (f) {
            case "input":
              qf(s, l);
              break;
            case "textarea":
              Xy(s, l);
              break;
            case "select":
              var v = s._wrapperState.wasMultiple;
              s._wrapperState.wasMultiple = !!l.multiple;
              var w = l.value;
              w != null ? ki(s, !!l.multiple, w, !1) : v !== !!l.multiple && (l.defaultValue != null ? ki(
                s,
                !!l.multiple,
                l.defaultValue,
                !0
              ) : ki(s, !!l.multiple, l.multiple ? [] : "", !1));
          }
          s[el] = l;
        } catch (A) {
          Oe(e, e.return, A);
        }
      }
      break;
    case 6:
      if (_n(t, e), Hn(e), i & 4) {
        if (e.stateNode === null) throw Error(H(162));
        s = e.stateNode, l = e.memoizedProps;
        try {
          s.nodeValue = l;
        } catch (A) {
          Oe(e, e.return, A);
        }
      }
      break;
    case 3:
      if (_n(t, e), Hn(e), i & 4 && n !== null && n.memoizedState.isDehydrated) try {
        Zs(t.containerInfo);
      } catch (A) {
        Oe(e, e.return, A);
      }
      break;
    case 4:
      _n(t, e), Hn(e);
      break;
    case 13:
      _n(t, e), Hn(e), s = e.child, s.flags & 8192 && (l = s.memoizedState !== null, s.stateNode.isHidden = l, !l || s.alternate !== null && s.alternate.memoizedState !== null || (Cp = Ue())), i & 4 && jg(e);
      break;
    case 22:
      if (g = n !== null && n.memoizedState !== null, e.mode & 1 ? (mt = (m = mt) || g, _n(t, e), mt = m) : _n(t, e), Hn(e), i & 8192) {
        if (m = e.memoizedState !== null, (e.stateNode.isHidden = m) && !g && e.mode & 1) for (Z = e, g = e.child; g !== null; ) {
          for (y = Z = g; Z !== null; ) {
            switch (v = Z, w = v.child, v.tag) {
              case 0:
              case 11:
              case 14:
              case 15:
                Bs(4, v, v.return);
                break;
              case 1:
                xi(v, v.return);
                var T = v.stateNode;
                if (typeof T.componentWillUnmount == "function") {
                  i = v, n = v.return;
                  try {
                    t = i, T.props = t.memoizedProps, T.state = t.memoizedState, T.componentWillUnmount();
                  } catch (A) {
                    Oe(i, n, A);
                  }
                }
                break;
              case 5:
                xi(v, v.return);
                break;
              case 22:
                if (v.memoizedState !== null) {
                  Ig(y);
                  continue;
                }
            }
            w !== null ? (w.return = v, Z = w) : Ig(y);
          }
          g = g.sibling;
        }
        e: for (g = null, y = e; ; ) {
          if (y.tag === 5) {
            if (g === null) {
              g = y;
              try {
                s = y.stateNode, m ? (l = s.style, typeof l.setProperty == "function" ? l.setProperty("display", "none", "important") : l.display = "none") : (f = y.stateNode, p = y.memoizedProps.style, a = p != null && p.hasOwnProperty("display") ? p.display : null, f.style.display = Jy("display", a));
              } catch (A) {
                Oe(e, e.return, A);
              }
            }
          } else if (y.tag === 6) {
            if (g === null) try {
              y.stateNode.nodeValue = m ? "" : y.memoizedProps;
            } catch (A) {
              Oe(e, e.return, A);
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
      _n(t, e), Hn(e), i & 4 && jg(e);
      break;
    case 21:
      break;
    default:
      _n(
        t,
        e
      ), Hn(e);
  }
}
function Hn(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (_v(n)) {
            var i = n;
            break e;
          }
          n = n.return;
        }
        throw Error(H(160));
      }
      switch (i.tag) {
        case 5:
          var s = i.stateNode;
          i.flags & 32 && (Ks(s, ""), i.flags &= -33);
          var l = Ng(e);
          Nd(e, l, s);
          break;
        case 3:
        case 4:
          var a = i.stateNode.containerInfo, f = Ng(e);
          Md(e, f, a);
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
function Z_(e, t, n) {
  Z = e, Tv(e);
}
function Tv(e, t, n) {
  for (var i = (e.mode & 1) !== 0; Z !== null; ) {
    var s = Z, l = s.child;
    if (s.tag === 22 && i) {
      var a = s.memoizedState !== null || ku;
      if (!a) {
        var f = s.alternate, p = f !== null && f.memoizedState !== null || mt;
        f = ku;
        var m = mt;
        if (ku = a, (mt = p) && !m) for (Z = s; Z !== null; ) a = Z, p = a.child, a.tag === 22 && a.memoizedState !== null ? Og(s) : p !== null ? (p.return = a, Z = p) : Og(s);
        for (; l !== null; ) Z = l, Tv(l), l = l.sibling;
        Z = s, ku = f, mt = m;
      }
      zg(e);
    } else s.subtreeFlags & 8772 && l !== null ? (l.return = s, Z = l) : zg(e);
  }
}
function zg(e) {
  for (; Z !== null; ) {
    var t = Z;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772) switch (t.tag) {
          case 0:
          case 11:
          case 15:
            mt || Na(5, t);
            break;
          case 1:
            var i = t.stateNode;
            if (t.flags & 4 && !mt) if (n === null) i.componentDidMount();
            else {
              var s = t.elementType === t.type ? n.memoizedProps : Pn(t.type, n.memoizedProps);
              i.componentDidUpdate(s, n.memoizedState, i.__reactInternalSnapshotBeforeUpdate);
            }
            var l = t.updateQueue;
            l !== null && vg(t, l, i);
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
              vg(t, a, n);
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
                  y !== null && Zs(y);
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
        mt || t.flags & 512 && Ld(t);
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
function Ig(e) {
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
function Og(e) {
  for (; Z !== null; ) {
    var t = Z;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            Na(4, t);
          } catch (p) {
            Oe(t, n, p);
          }
          break;
        case 1:
          var i = t.stateNode;
          if (typeof i.componentDidMount == "function") {
            var s = t.return;
            try {
              i.componentDidMount();
            } catch (p) {
              Oe(t, s, p);
            }
          }
          var l = t.return;
          try {
            Ld(t);
          } catch (p) {
            Oe(t, l, p);
          }
          break;
        case 5:
          var a = t.return;
          try {
            Ld(t);
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
var J_ = Math.ceil, ga = yr.ReactCurrentDispatcher, Tp = yr.ReactCurrentOwner, mn = yr.ReactCurrentBatchConfig, fe = 0, $e = null, Ge = null, nt = 0, Yt = 0, Si = br(0), Qe = 0, sl = null, Io = 0, ja = 0, Pp = 0, Gs = null, Ot = null, Cp = 0, Di = 1 / 0, ir = null, ya = !1, jd = null, Qr = null, Tu = !1, Ur = null, va = 0, Ws = 0, zd = null, Bu = -1, Gu = 0;
function wt() {
  return fe & 6 ? Ue() : Bu !== -1 ? Bu : Bu = Ue();
}
function Xr(e) {
  return e.mode & 1 ? fe & 2 && nt !== 0 ? nt & -nt : j_.transition !== null ? (Gu === 0 && (Gu = a0()), Gu) : (e = ge, e !== 0 || (e = window.event, e = e === void 0 ? 16 : g0(e.type)), e) : 1;
}
function Ln(e, t, n, i) {
  if (50 < Ws) throw Ws = 0, zd = null, Error(H(185));
  al(e, n, i), (!(fe & 2) || e !== $e) && (e === $e && (!(fe & 2) && (ja |= n), Qe === 4 && Dr(e, nt)), Ht(e, i), n === 1 && fe === 0 && !(t.mode & 1) && (Di = Ue() + 500, Aa && eo()));
}
function Ht(e, t) {
  var n = e.callbackNode;
  jw(e, t);
  var i = ta(e, e === $e ? nt : 0);
  if (i === 0) n !== null && Km(n), e.callbackNode = null, e.callbackPriority = 0;
  else if (t = i & -i, e.callbackPriority !== t) {
    if (n != null && Km(n), t === 1) e.tag === 0 ? N_(Dg.bind(null, e)) : I0(Dg.bind(null, e)), R_(function() {
      !(fe & 6) && eo();
    }), n = null;
    else {
      switch (c0(i)) {
        case 1:
          n = bd;
          break;
        case 4:
          n = l0;
          break;
        case 16:
          n = ea;
          break;
        case 536870912:
          n = u0;
          break;
        default:
          n = ea;
      }
      n = jv(n, Pv.bind(null, e));
    }
    e.callbackPriority = t, e.callbackNode = n;
  }
}
function Pv(e, t) {
  if (Bu = -1, Gu = 0, fe & 6) throw Error(H(327));
  var n = e.callbackNode;
  if (Ai() && e.callbackNode !== n) return null;
  var i = ta(e, e === $e ? nt : 0);
  if (i === 0) return null;
  if (i & 30 || i & e.expiredLanes || t) t = xa(e, i);
  else {
    t = i;
    var s = fe;
    fe |= 2;
    var l = Rv();
    ($e !== e || nt !== t) && (ir = null, Di = Ue() + 500, Lo(e, t));
    do
      try {
        b_();
        break;
      } catch (f) {
        Cv(e, f);
      }
    while (!0);
    dp(), ga.current = l, fe = s, Ge !== null ? t = 0 : ($e = null, nt = 0, t = Qe);
  }
  if (t !== 0) {
    if (t === 2 && (s = ld(e), s !== 0 && (i = s, t = Id(e, s))), t === 1) throw n = sl, Lo(e, 0), Dr(e, i), Ht(e, Ue()), n;
    if (t === 6) Dr(e, i);
    else {
      if (s = e.current.alternate, !(i & 30) && !q_(s) && (t = xa(e, i), t === 2 && (l = ld(e), l !== 0 && (i = l, t = Id(e, l))), t === 1)) throw n = sl, Lo(e, 0), Dr(e, i), Ht(e, Ue()), n;
      switch (e.finishedWork = s, e.finishedLanes = i, t) {
        case 0:
        case 1:
          throw Error(H(345));
        case 2:
          go(e, Ot, ir);
          break;
        case 3:
          if (Dr(e, i), (i & 130023424) === i && (t = Cp + 500 - Ue(), 10 < t)) {
            if (ta(e, 0) !== 0) break;
            if (s = e.suspendedLanes, (s & i) !== i) {
              wt(), e.pingedLanes |= e.suspendedLanes & s;
              break;
            }
            e.timeoutHandle = md(go.bind(null, e, Ot, ir), t);
            break;
          }
          go(e, Ot, ir);
          break;
        case 4:
          if (Dr(e, i), (i & 4194240) === i) break;
          for (t = e.eventTimes, s = -1; 0 < i; ) {
            var a = 31 - An(i);
            l = 1 << a, a = t[a], a > s && (s = a), i &= ~l;
          }
          if (i = s, i = Ue() - i, i = (120 > i ? 120 : 480 > i ? 480 : 1080 > i ? 1080 : 1920 > i ? 1920 : 3e3 > i ? 3e3 : 4320 > i ? 4320 : 1960 * J_(i / 1960)) - i, 10 < i) {
            e.timeoutHandle = md(go.bind(null, e, Ot, ir), i);
            break;
          }
          go(e, Ot, ir);
          break;
        case 5:
          go(e, Ot, ir);
          break;
        default:
          throw Error(H(329));
      }
    }
  }
  return Ht(e, Ue()), e.callbackNode === n ? Pv.bind(null, e) : null;
}
function Id(e, t) {
  var n = Gs;
  return e.current.memoizedState.isDehydrated && (Lo(e, t).flags |= 256), e = xa(e, t), e !== 2 && (t = Ot, Ot = n, t !== null && Od(t)), e;
}
function Od(e) {
  Ot === null ? Ot = e : Ot.push.apply(Ot, e);
}
function q_(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && (n = n.stores, n !== null)) for (var i = 0; i < n.length; i++) {
        var s = n[i], l = s.getSnapshot;
        s = s.value;
        try {
          if (!Nn(l(), s)) return !1;
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
function Dr(e, t) {
  for (t &= ~Pp, t &= ~ja, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - An(t), i = 1 << n;
    e[n] = -1, t &= ~i;
  }
}
function Dg(e) {
  if (fe & 6) throw Error(H(327));
  Ai();
  var t = ta(e, 0);
  if (!(t & 1)) return Ht(e, Ue()), null;
  var n = xa(e, t);
  if (e.tag !== 0 && n === 2) {
    var i = ld(e);
    i !== 0 && (t = i, n = Id(e, i));
  }
  if (n === 1) throw n = sl, Lo(e, 0), Dr(e, t), Ht(e, Ue()), n;
  if (n === 6) throw Error(H(345));
  return e.finishedWork = e.current.alternate, e.finishedLanes = t, go(e, Ot, ir), Ht(e, Ue()), null;
}
function Rp(e, t) {
  var n = fe;
  fe |= 1;
  try {
    return e(t);
  } finally {
    fe = n, fe === 0 && (Di = Ue() + 500, Aa && eo());
  }
}
function Oo(e) {
  Ur !== null && Ur.tag === 0 && !(fe & 6) && Ai();
  var t = fe;
  fe |= 1;
  var n = mn.transition, i = ge;
  try {
    if (mn.transition = null, ge = 1, e) return e();
  } finally {
    ge = i, mn.transition = n, fe = t, !(fe & 6) && eo();
  }
}
function Ap() {
  Yt = Si.current, Ce(Si);
}
function Lo(e, t) {
  e.finishedWork = null, e.finishedLanes = 0;
  var n = e.timeoutHandle;
  if (n !== -1 && (e.timeoutHandle = -1, C_(n)), Ge !== null) for (n = Ge.return; n !== null; ) {
    var i = n;
    switch (ap(i), i.tag) {
      case 1:
        i = i.type.childContextTypes, i != null && sa();
        break;
      case 3:
        Ii(), Ce(Ft), Ce(gt), vp();
        break;
      case 5:
        yp(i);
        break;
      case 4:
        Ii();
        break;
      case 13:
        Ce(Me);
        break;
      case 19:
        Ce(Me);
        break;
      case 10:
        pp(i.type._context);
        break;
      case 22:
      case 23:
        Ap();
    }
    n = n.return;
  }
  if ($e = e, Ge = e = Yr(e.current, null), nt = Yt = t, Qe = 0, sl = null, Pp = ja = Io = 0, Ot = Gs = null, _o !== null) {
    for (t = 0; t < _o.length; t++) if (n = _o[t], i = n.interleaved, i !== null) {
      n.interleaved = null;
      var s = i.next, l = n.pending;
      if (l !== null) {
        var a = l.next;
        l.next = s, i.next = a;
      }
      n.pending = i;
    }
    _o = null;
  }
  return e;
}
function Cv(e, t) {
  do {
    var n = Ge;
    try {
      if (dp(), Fu.current = ma, ha) {
        for (var i = Ne.memoizedState; i !== null; ) {
          var s = i.queue;
          s !== null && (s.pending = null), i = i.next;
        }
        ha = !1;
      }
      if (zo = 0, qe = Ke = Ne = null, Hs = !1, rl = 0, Tp.current = null, n === null || n.return === null) {
        Qe = 1, sl = t, Ge = null;
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
          var w = kg(a);
          if (w !== null) {
            w.flags &= -257, Tg(w, a, f, l, t), w.mode & 1 && Eg(l, m, t), t = w, p = m;
            var T = t.updateQueue;
            if (T === null) {
              var A = /* @__PURE__ */ new Set();
              A.add(p), t.updateQueue = A;
            } else T.add(p);
            break e;
          } else {
            if (!(t & 1)) {
              Eg(l, m, t), Lp();
              break e;
            }
            p = Error(H(426));
          }
        } else if (Ae && f.mode & 1) {
          var L = kg(a);
          if (L !== null) {
            !(L.flags & 65536) && (L.flags |= 256), Tg(L, a, f, l, t), cp(Oi(p, f));
            break e;
          }
        }
        l = p = Oi(p, f), Qe !== 4 && (Qe = 2), Gs === null ? Gs = [l] : Gs.push(l), l = a;
        do {
          switch (l.tag) {
            case 3:
              l.flags |= 65536, t &= -t, l.lanes |= t;
              var S = cv(l, p, t);
              yg(l, S);
              break e;
            case 1:
              f = p;
              var x = l.type, _ = l.stateNode;
              if (!(l.flags & 128) && (typeof x.getDerivedStateFromError == "function" || _ !== null && typeof _.componentDidCatch == "function" && (Qr === null || !Qr.has(_)))) {
                l.flags |= 65536, t &= -t, l.lanes |= t;
                var R = fv(l, f, t);
                yg(l, R);
                break e;
              }
          }
          l = l.return;
        } while (l !== null);
      }
      Lv(n);
    } catch (I) {
      t = I, Ge === n && n !== null && (Ge = n = n.return);
      continue;
    }
    break;
  } while (!0);
}
function Rv() {
  var e = ga.current;
  return ga.current = ma, e === null ? ma : e;
}
function Lp() {
  (Qe === 0 || Qe === 3 || Qe === 2) && (Qe = 4), $e === null || !(Io & 268435455) && !(ja & 268435455) || Dr($e, nt);
}
function xa(e, t) {
  var n = fe;
  fe |= 2;
  var i = Rv();
  ($e !== e || nt !== t) && (ir = null, Lo(e, t));
  do
    try {
      $_();
      break;
    } catch (s) {
      Cv(e, s);
    }
  while (!0);
  if (dp(), fe = n, ga.current = i, Ge !== null) throw Error(H(261));
  return $e = null, nt = 0, Qe;
}
function $_() {
  for (; Ge !== null; ) Av(Ge);
}
function b_() {
  for (; Ge !== null && !kw(); ) Av(Ge);
}
function Av(e) {
  var t = Nv(e.alternate, e, Yt);
  e.memoizedProps = e.pendingProps, t === null ? Lv(e) : Ge = t, Tp.current = null;
}
function Lv(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (e = t.return, t.flags & 32768) {
      if (n = Q_(n, t), n !== null) {
        n.flags &= 32767, Ge = n;
        return;
      }
      if (e !== null) e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null;
      else {
        Qe = 6, Ge = null;
        return;
      }
    } else if (n = K_(n, t, Yt), n !== null) {
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
function go(e, t, n) {
  var i = ge, s = mn.transition;
  try {
    mn.transition = null, ge = 1, e2(e, t, n, i);
  } finally {
    mn.transition = s, ge = i;
  }
  return null;
}
function e2(e, t, n, i) {
  do
    Ai();
  while (Ur !== null);
  if (fe & 6) throw Error(H(327));
  n = e.finishedWork;
  var s = e.finishedLanes;
  if (n === null) return null;
  if (e.finishedWork = null, e.finishedLanes = 0, n === e.current) throw Error(H(177));
  e.callbackNode = null, e.callbackPriority = 0;
  var l = n.lanes | n.childLanes;
  if (zw(e, l), e === $e && (Ge = $e = null, nt = 0), !(n.subtreeFlags & 2064) && !(n.flags & 2064) || Tu || (Tu = !0, jv(ea, function() {
    return Ai(), null;
  })), l = (n.flags & 15990) !== 0, n.subtreeFlags & 15990 || l) {
    l = mn.transition, mn.transition = null;
    var a = ge;
    ge = 1;
    var f = fe;
    fe |= 4, Tp.current = null, Y_(e, n), kv(n, e), S_(pd), na = !!dd, pd = dd = null, e.current = n, Z_(n), Tw(), fe = f, ge = a, mn.transition = l;
  } else e.current = n;
  if (Tu && (Tu = !1, Ur = e, va = s), l = e.pendingLanes, l === 0 && (Qr = null), Rw(n.stateNode), Ht(e, Ue()), t !== null) for (i = e.onRecoverableError, n = 0; n < t.length; n++) s = t[n], i(s.value, { componentStack: s.stack, digest: s.digest });
  if (ya) throw ya = !1, e = jd, jd = null, e;
  return va & 1 && e.tag !== 0 && Ai(), l = e.pendingLanes, l & 1 ? e === zd ? Ws++ : (Ws = 0, zd = e) : Ws = 0, eo(), null;
}
function Ai() {
  if (Ur !== null) {
    var e = c0(va), t = mn.transition, n = ge;
    try {
      if (mn.transition = null, ge = 16 > e ? 16 : e, Ur === null) var i = !1;
      else {
        if (e = Ur, Ur = null, va = 0, fe & 6) throw Error(H(331));
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
                      Bs(8, g, l);
                  }
                  var y = g.child;
                  if (y !== null) y.return = g, Z = y;
                  else for (; Z !== null; ) {
                    g = Z;
                    var v = g.sibling, w = g.return;
                    if (wv(g), g === m) {
                      Z = null;
                      break;
                    }
                    if (v !== null) {
                      v.return = w, Z = v;
                      break;
                    }
                    Z = w;
                  }
                }
              }
              var T = l.alternate;
              if (T !== null) {
                var A = T.child;
                if (A !== null) {
                  T.child = null;
                  do {
                    var L = A.sibling;
                    A.sibling = null, A = L;
                  } while (A !== null);
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
                Bs(9, l, l.return);
            }
            var S = l.sibling;
            if (S !== null) {
              S.return = l.return, Z = S;
              break e;
            }
            Z = l.return;
          }
        }
        var x = e.current;
        for (Z = x; Z !== null; ) {
          a = Z;
          var _ = a.child;
          if (a.subtreeFlags & 2064 && _ !== null) _.return = a, Z = _;
          else e: for (a = x; Z !== null; ) {
            if (f = Z, f.flags & 2048) try {
              switch (f.tag) {
                case 0:
                case 11:
                case 15:
                  Na(9, f);
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
        if (fe = s, eo(), Yn && typeof Yn.onPostCommitFiberRoot == "function") try {
          Yn.onPostCommitFiberRoot(ka, e);
        } catch {
        }
        i = !0;
      }
      return i;
    } finally {
      ge = n, mn.transition = t;
    }
  }
  return !1;
}
function Fg(e, t, n) {
  t = Oi(n, t), t = cv(e, t, 1), e = Kr(e, t, 1), t = wt(), e !== null && (al(e, 1, t), Ht(e, t));
}
function Oe(e, t, n) {
  if (e.tag === 3) Fg(e, e, n);
  else for (; t !== null; ) {
    if (t.tag === 3) {
      Fg(t, e, n);
      break;
    } else if (t.tag === 1) {
      var i = t.stateNode;
      if (typeof t.type.getDerivedStateFromError == "function" || typeof i.componentDidCatch == "function" && (Qr === null || !Qr.has(i))) {
        e = Oi(n, e), e = fv(t, e, 1), t = Kr(t, e, 1), e = wt(), t !== null && (al(t, 1, e), Ht(t, e));
        break;
      }
    }
    t = t.return;
  }
}
function t2(e, t, n) {
  var i = e.pingCache;
  i !== null && i.delete(t), t = wt(), e.pingedLanes |= e.suspendedLanes & n, $e === e && (nt & n) === n && (Qe === 4 || Qe === 3 && (nt & 130023424) === nt && 500 > Ue() - Cp ? Lo(e, 0) : Pp |= n), Ht(e, t);
}
function Mv(e, t) {
  t === 0 && (e.mode & 1 ? (t = mu, mu <<= 1, !(mu & 130023424) && (mu = 4194304)) : t = 1);
  var n = wt();
  e = mr(e, t), e !== null && (al(e, t, n), Ht(e, n));
}
function n2(e) {
  var t = e.memoizedState, n = 0;
  t !== null && (n = t.retryLane), Mv(e, n);
}
function r2(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var i = e.stateNode, s = e.memoizedState;
      s !== null && (n = s.retryLane);
      break;
    case 19:
      i = e.stateNode;
      break;
    default:
      throw Error(H(314));
  }
  i !== null && i.delete(t), Mv(e, n);
}
var Nv;
Nv = function(e, t, n) {
  if (e !== null) if (e.memoizedProps !== t.pendingProps || Ft.current) Dt = !0;
  else {
    if (!(e.lanes & n) && !(t.flags & 128)) return Dt = !1, V_(e, t, n);
    Dt = !!(e.flags & 131072);
  }
  else Dt = !1, Ae && t.flags & 1048576 && O0(t, aa, t.index);
  switch (t.lanes = 0, t.tag) {
    case 2:
      var i = t.type;
      Hu(e, t), e = t.pendingProps;
      var s = Ni(t, gt.current);
      Ri(t, n), s = Sp(null, t, i, e, s, n);
      var l = wp();
      return t.flags |= 1, typeof s == "object" && s !== null && typeof s.render == "function" && s.$$typeof === void 0 ? (t.tag = 1, t.memoizedState = null, t.updateQueue = null, Ut(i) ? (l = !0, la(t)) : l = !1, t.memoizedState = s.state !== null && s.state !== void 0 ? s.state : null, mp(t), s.updater = Ma, t.stateNode = s, s._reactInternals = t, _d(t, i, e, n), t = Td(null, t, i, !0, l, n)) : (t.tag = 0, Ae && l && up(t), St(null, t, s, n), t = t.child), t;
    case 16:
      i = t.elementType;
      e: {
        switch (Hu(e, t), e = t.pendingProps, s = i._init, i = s(i._payload), t.type = i, s = t.tag = i2(i), e = Pn(i, e), s) {
          case 0:
            t = kd(null, t, i, e, n);
            break e;
          case 1:
            t = Rg(null, t, i, e, n);
            break e;
          case 11:
            t = Pg(null, t, i, e, n);
            break e;
          case 14:
            t = Cg(null, t, i, Pn(i.type, e), n);
            break e;
        }
        throw Error(H(
          306,
          i,
          ""
        ));
      }
      return t;
    case 0:
      return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pn(i, s), kd(e, t, i, s, n);
    case 1:
      return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pn(i, s), Rg(e, t, i, s, n);
    case 3:
      e: {
        if (mv(t), e === null) throw Error(H(387));
        i = t.pendingProps, l = t.memoizedState, s = l.element, G0(e, t), da(t, i, null, n);
        var a = t.memoizedState;
        if (i = a.element, l.isDehydrated) if (l = { element: i, isDehydrated: !1, cache: a.cache, pendingSuspenseBoundaries: a.pendingSuspenseBoundaries, transitions: a.transitions }, t.updateQueue.baseState = l, t.memoizedState = l, t.flags & 256) {
          s = Oi(Error(H(423)), t), t = Ag(e, t, i, n, s);
          break e;
        } else if (i !== s) {
          s = Oi(Error(H(424)), t), t = Ag(e, t, i, n, s);
          break e;
        } else for (Zt = Vr(t.stateNode.containerInfo.firstChild), Jt = t, Ae = !0, Rn = null, n = H0(t, null, i, n), t.child = n; n; ) n.flags = n.flags & -3 | 4096, n = n.sibling;
        else {
          if (ji(), i === s) {
            t = gr(e, t, n);
            break e;
          }
          St(e, t, i, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return W0(t), e === null && xd(t), i = t.type, s = t.pendingProps, l = e !== null ? e.memoizedProps : null, a = s.children, hd(i, s) ? a = null : l !== null && hd(i, l) && (t.flags |= 32), hv(e, t), St(e, t, a, n), t.child;
    case 6:
      return e === null && xd(t), null;
    case 13:
      return gv(e, t, n);
    case 4:
      return gp(t, t.stateNode.containerInfo), i = t.pendingProps, e === null ? t.child = zi(t, null, i, n) : St(e, t, i, n), t.child;
    case 11:
      return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pn(i, s), Pg(e, t, i, s, n);
    case 7:
      return St(e, t, t.pendingProps, n), t.child;
    case 8:
      return St(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return St(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (i = t.type._context, s = t.pendingProps, l = t.memoizedProps, a = s.value, ke(ca, i._currentValue), i._currentValue = a, l !== null) if (Nn(l.value, a)) {
          if (l.children === s.children && !Ft.current) {
            t = gr(e, t, n);
            break e;
          }
        } else for (l = t.child, l !== null && (l.return = t); l !== null; ) {
          var f = l.dependencies;
          if (f !== null) {
            a = l.child;
            for (var p = f.firstContext; p !== null; ) {
              if (p.context === i) {
                if (l.tag === 1) {
                  p = dr(-1, n & -n), p.tag = 2;
                  var m = l.updateQueue;
                  if (m !== null) {
                    m = m.shared;
                    var g = m.pending;
                    g === null ? p.next = p : (p.next = g.next, g.next = p), m.pending = p;
                  }
                }
                l.lanes |= n, p = l.alternate, p !== null && (p.lanes |= n), Sd(
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
            a.lanes |= n, f = a.alternate, f !== null && (f.lanes |= n), Sd(a, n, t), a = l.sibling;
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
      return s = t.type, i = t.pendingProps.children, Ri(t, n), s = gn(s), i = i(s), t.flags |= 1, St(e, t, i, n), t.child;
    case 14:
      return i = t.type, s = Pn(i, t.pendingProps), s = Pn(i.type, s), Cg(e, t, i, s, n);
    case 15:
      return dv(e, t, t.type, t.pendingProps, n);
    case 17:
      return i = t.type, s = t.pendingProps, s = t.elementType === i ? s : Pn(i, s), Hu(e, t), t.tag = 1, Ut(i) ? (e = !0, la(t)) : e = !1, Ri(t, n), av(t, i, s), _d(t, i, s, n), Td(null, t, i, !0, e, n);
    case 19:
      return yv(e, t, n);
    case 22:
      return pv(e, t, n);
  }
  throw Error(H(156, t.tag));
};
function jv(e, t) {
  return s0(e, t);
}
function o2(e, t, n, i) {
  this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = i, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
}
function hn(e, t, n, i) {
  return new o2(e, t, n, i);
}
function Mp(e) {
  return e = e.prototype, !(!e || !e.isReactComponent);
}
function i2(e) {
  if (typeof e == "function") return Mp(e) ? 1 : 0;
  if (e != null) {
    if (e = e.$$typeof, e === Jd) return 11;
    if (e === qd) return 14;
  }
  return 2;
}
function Yr(e, t) {
  var n = e.alternate;
  return n === null ? (n = hn(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 14680064, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n;
}
function Wu(e, t, n, i, s, l) {
  var a = 2;
  if (i = e, typeof e == "function") Mp(e) && (a = 1);
  else if (typeof e == "string") a = 5;
  else e: switch (e) {
    case ci:
      return Mo(n.children, s, l, t);
    case Zd:
      a = 8, s |= 8;
      break;
    case Qf:
      return e = hn(12, n, t, s | 2), e.elementType = Qf, e.lanes = l, e;
    case Xf:
      return e = hn(13, n, t, s), e.elementType = Xf, e.lanes = l, e;
    case Yf:
      return e = hn(19, n, t, s), e.elementType = Yf, e.lanes = l, e;
    case Wy:
      return za(n, s, l, t);
    default:
      if (typeof e == "object" && e !== null) switch (e.$$typeof) {
        case By:
          a = 10;
          break e;
        case Gy:
          a = 9;
          break e;
        case Jd:
          a = 11;
          break e;
        case qd:
          a = 14;
          break e;
        case zr:
          a = 16, i = null;
          break e;
      }
      throw Error(H(130, e == null ? e : typeof e, ""));
  }
  return t = hn(a, n, t, s), t.elementType = e, t.type = i, t.lanes = l, t;
}
function Mo(e, t, n, i) {
  return e = hn(7, e, i, t), e.lanes = n, e;
}
function za(e, t, n, i) {
  return e = hn(22, e, i, t), e.elementType = Wy, e.lanes = n, e.stateNode = { isHidden: !1 }, e;
}
function _f(e, t, n) {
  return e = hn(6, e, null, t), e.lanes = n, e;
}
function Ef(e, t, n) {
  return t = hn(4, e.children !== null ? e.children : [], e.key, t), t.lanes = n, t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }, t;
}
function s2(e, t, n, i, s) {
  this.tag = t, this.containerInfo = e, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = nf(0), this.expirationTimes = nf(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = nf(0), this.identifierPrefix = i, this.onRecoverableError = s, this.mutableSourceEagerHydrationData = null;
}
function Np(e, t, n, i, s, l, a, f, p) {
  return e = new s2(e, t, n, f, p), t === 1 ? (t = 1, l === !0 && (t |= 8)) : t = 0, l = hn(3, null, null, t), e.current = l, l.stateNode = e, l.memoizedState = { element: i, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }, mp(l), e;
}
function l2(e, t, n) {
  var i = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: ai, key: i == null ? null : "" + i, children: e, containerInfo: t, implementation: n };
}
function zv(e) {
  if (!e) return qr;
  e = e._reactInternals;
  e: {
    if (Fo(e) !== e || e.tag !== 1) throw Error(H(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (Ut(t.type)) {
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
    if (Ut(n)) return z0(e, n, t);
  }
  return t;
}
function Iv(e, t, n, i, s, l, a, f, p) {
  return e = Np(n, i, !0, e, s, l, a, f, p), e.context = zv(null), n = e.current, i = wt(), s = Xr(n), l = dr(i, s), l.callback = t ?? null, Kr(n, l, s), e.current.lanes = s, al(e, s, i), Ht(e, i), e;
}
function Ia(e, t, n, i) {
  var s = t.current, l = wt(), a = Xr(s);
  return n = zv(n), t.context === null ? t.context = n : t.pendingContext = n, t = dr(l, a), t.payload = { element: e }, i = i === void 0 ? null : i, i !== null && (t.callback = i), e = Kr(s, t, a), e !== null && (Ln(e, s, a, l), Du(e, s, a)), a;
}
function Sa(e) {
  if (e = e.current, !e.child) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Ug(e, t) {
  if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function jp(e, t) {
  Ug(e, t), (e = e.alternate) && Ug(e, t);
}
function u2() {
  return null;
}
var Ov = typeof reportError == "function" ? reportError : function(e) {
  console.error(e);
};
function zp(e) {
  this._internalRoot = e;
}
Oa.prototype.render = zp.prototype.render = function(e) {
  var t = this._internalRoot;
  if (t === null) throw Error(H(409));
  Ia(e, t, null, null);
};
Oa.prototype.unmount = zp.prototype.unmount = function() {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Oo(function() {
      Ia(null, e, null, null);
    }), t[hr] = null;
  }
};
function Oa(e) {
  this._internalRoot = e;
}
Oa.prototype.unstable_scheduleHydration = function(e) {
  if (e) {
    var t = p0();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < Or.length && t !== 0 && t < Or[n].priority; n++) ;
    Or.splice(n, 0, e), n === 0 && m0(e);
  }
};
function Ip(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
}
function Da(e) {
  return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== " react-mount-point-unstable "));
}
function Hg() {
}
function a2(e, t, n, i, s) {
  if (s) {
    if (typeof i == "function") {
      var l = i;
      i = function() {
        var m = Sa(a);
        l.call(m);
      };
    }
    var a = Iv(t, i, e, 0, null, !1, !1, "", Hg);
    return e._reactRootContainer = a, e[hr] = a.current, $s(e.nodeType === 8 ? e.parentNode : e), Oo(), a;
  }
  for (; s = e.lastChild; ) e.removeChild(s);
  if (typeof i == "function") {
    var f = i;
    i = function() {
      var m = Sa(p);
      f.call(m);
    };
  }
  var p = Np(e, 0, !1, null, null, !1, !1, "", Hg);
  return e._reactRootContainer = p, e[hr] = p.current, $s(e.nodeType === 8 ? e.parentNode : e), Oo(function() {
    Ia(t, p, n, i);
  }), p;
}
function Fa(e, t, n, i, s) {
  var l = n._reactRootContainer;
  if (l) {
    var a = l;
    if (typeof s == "function") {
      var f = s;
      s = function() {
        var p = Sa(a);
        f.call(p);
      };
    }
    Ia(t, a, e, s);
  } else a = a2(n, t, e, s, i);
  return Sa(a);
}
f0 = function(e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = Rs(t.pendingLanes);
        n !== 0 && (ep(t, n | 1), Ht(t, Ue()), !(fe & 6) && (Di = Ue() + 500, eo()));
      }
      break;
    case 13:
      Oo(function() {
        var i = mr(e, 1);
        if (i !== null) {
          var s = wt();
          Ln(i, e, 1, s);
        }
      }), jp(e, 1);
  }
};
tp = function(e) {
  if (e.tag === 13) {
    var t = mr(e, 134217728);
    if (t !== null) {
      var n = wt();
      Ln(t, e, 134217728, n);
    }
    jp(e, 134217728);
  }
};
d0 = function(e) {
  if (e.tag === 13) {
    var t = Xr(e), n = mr(e, t);
    if (n !== null) {
      var i = wt();
      Ln(n, e, t, i);
    }
    jp(e, t);
  }
};
p0 = function() {
  return ge;
};
h0 = function(e, t) {
  var n = ge;
  try {
    return ge = e, t();
  } finally {
    ge = n;
  }
};
od = function(e, t, n) {
  switch (t) {
    case "input":
      if (qf(e, n), t = n.name, n.type === "radio" && t != null) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll("input[name=" + JSON.stringify("" + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var i = n[t];
          if (i !== e && i.form === e.form) {
            var s = Ra(i);
            if (!s) throw Error(H(90));
            Ky(i), qf(i, s);
          }
        }
      }
      break;
    case "textarea":
      Xy(e, n);
      break;
    case "select":
      t = n.value, t != null && ki(e, !!n.multiple, t, !1);
  }
};
e0 = Rp;
t0 = Oo;
var c2 = { usingClientEntryPoint: !1, Events: [fl, hi, Ra, $y, by, Rp] }, xs = { findFiberByHostInstance: wo, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" }, f2 = { bundleType: xs.bundleType, version: xs.version, rendererPackageName: xs.rendererPackageName, rendererConfig: xs.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: yr.ReactCurrentDispatcher, findHostInstanceByFiber: function(e) {
  return e = o0(e), e === null ? null : e.stateNode;
}, findFiberByHostInstance: xs.findFiberByHostInstance || u2, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
  var Pu = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!Pu.isDisabled && Pu.supportsFiber) try {
    ka = Pu.inject(f2), Yn = Pu;
  } catch {
  }
}
$t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = c2;
$t.createPortal = function(e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Ip(t)) throw Error(H(200));
  return l2(e, t, null, n);
};
$t.createRoot = function(e, t) {
  if (!Ip(e)) throw Error(H(299));
  var n = !1, i = "", s = Ov;
  return t != null && (t.unstable_strictMode === !0 && (n = !0), t.identifierPrefix !== void 0 && (i = t.identifierPrefix), t.onRecoverableError !== void 0 && (s = t.onRecoverableError)), t = Np(e, 1, !1, null, null, n, !1, i, s), e[hr] = t.current, $s(e.nodeType === 8 ? e.parentNode : e), new zp(t);
};
$t.findDOMNode = function(e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0)
    throw typeof e.render == "function" ? Error(H(188)) : (e = Object.keys(e).join(","), Error(H(268, e)));
  return e = o0(t), e = e === null ? null : e.stateNode, e;
};
$t.flushSync = function(e) {
  return Oo(e);
};
$t.hydrate = function(e, t, n) {
  if (!Da(t)) throw Error(H(200));
  return Fa(null, e, t, !0, n);
};
$t.hydrateRoot = function(e, t, n) {
  if (!Ip(e)) throw Error(H(405));
  var i = n != null && n.hydratedSources || null, s = !1, l = "", a = Ov;
  if (n != null && (n.unstable_strictMode === !0 && (s = !0), n.identifierPrefix !== void 0 && (l = n.identifierPrefix), n.onRecoverableError !== void 0 && (a = n.onRecoverableError)), t = Iv(t, null, e, 1, n ?? null, s, !1, l, a), e[hr] = t.current, $s(e), i) for (e = 0; e < i.length; e++) n = i[e], s = n._getVersion, s = s(n._source), t.mutableSourceEagerHydrationData == null ? t.mutableSourceEagerHydrationData = [n, s] : t.mutableSourceEagerHydrationData.push(
    n,
    s
  );
  return new Oa(t);
};
$t.render = function(e, t, n) {
  if (!Da(t)) throw Error(H(200));
  return Fa(null, e, t, !1, n);
};
$t.unmountComponentAtNode = function(e) {
  if (!Da(e)) throw Error(H(40));
  return e._reactRootContainer ? (Oo(function() {
    Fa(null, null, e, !1, function() {
      e._reactRootContainer = null, e[hr] = null;
    });
  }), !0) : !1;
};
$t.unstable_batchedUpdates = Rp;
$t.unstable_renderSubtreeIntoContainer = function(e, t, n, i) {
  if (!Da(n)) throw Error(H(200));
  if (e == null || e._reactInternals === void 0) throw Error(H(38));
  return Fa(e, t, n, !1, i);
};
$t.version = "18.3.1-next-f1338f8080-20240426";
function Dv() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Dv);
    } catch (e) {
      console.error(e);
    }
}
Dv(), Dy.exports = $t;
var d2 = Dy.exports, Fv, Bg = d2;
Fv = Bg.createRoot, Bg.hydrateRoot;
var Uv = { exports: {} }, Uo = {};
/**
 * @license React
 * react-reconciler-constants.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Uo.ConcurrentRoot = 1;
Uo.ContinuousEventPriority = 4;
Uo.DefaultEventPriority = 16;
Uo.DiscreteEventPriority = 1;
Uo.IdleEventPriority = 536870912;
Uo.LegacyRoot = 0;
Uv.exports = Uo;
var wi = Uv.exports;
function p2(e) {
  let t;
  const n = /* @__PURE__ */ new Set(), i = (m, g) => {
    const y = typeof m == "function" ? m(t) : m;
    if (y !== t) {
      const v = t;
      t = g ? y : Object.assign({}, t, y), n.forEach((w) => w(t, v));
    }
  }, s = () => t, l = (m, g = s, y = Object.is) => {
    console.warn("[DEPRECATED] Please use `subscribeWithSelector` middleware");
    let v = g(t);
    function w() {
      const T = g(t);
      if (!y(v, T)) {
        const A = v;
        m(v = T, A);
      }
    }
    return n.add(w), () => n.delete(w);
  }, p = { setState: i, getState: s, subscribe: (m, g, y) => g || y ? l(m, g, y) : (n.add(m), () => n.delete(m)), destroy: () => n.clear() };
  return t = e(i, s, p), p;
}
const h2 = typeof window > "u" || !window.navigator || /ServerSideRendering|^Deno\//.test(window.navigator.userAgent), Gg = h2 ? W.useEffect : W.useLayoutEffect;
function m2(e) {
  const t = typeof e == "function" ? p2(e) : e, n = (i = t.getState, s = Object.is) => {
    const [, l] = W.useReducer((L) => L + 1, 0), a = t.getState(), f = W.useRef(a), p = W.useRef(i), m = W.useRef(s), g = W.useRef(!1), y = W.useRef();
    y.current === void 0 && (y.current = i(a));
    let v, w = !1;
    (f.current !== a || p.current !== i || m.current !== s || g.current) && (v = i(a), w = !s(y.current, v)), Gg(() => {
      w && (y.current = v), f.current = a, p.current = i, m.current = s, g.current = !1;
    });
    const T = W.useRef(a);
    Gg(() => {
      const L = () => {
        try {
          const x = t.getState(), _ = p.current(x);
          m.current(y.current, _) || (f.current = x, y.current = _, l());
        } catch {
          g.current = !0, l();
        }
      }, S = t.subscribe(L);
      return t.getState() !== T.current && L(), S;
    }, []);
    const A = w ? v : y.current;
    return W.useDebugValue(A), A;
  };
  return Object.assign(n, t), n[Symbol.iterator] = function() {
    console.warn("[useStore, api] = create() is deprecated and will be removed in v4");
    const i = [n, t];
    return {
      next() {
        const s = i.length <= 0;
        return { value: i.shift(), done: s };
      }
    };
  }, n;
}
const g2 = (e) => typeof e == "object" && typeof e.then == "function", ko = [];
function Hv(e, t, n = (i, s) => i === s) {
  if (e === t) return !0;
  if (!e || !t) return !1;
  const i = e.length;
  if (t.length !== i) return !1;
  for (let s = 0; s < i; s++) if (!n(e[s], t[s])) return !1;
  return !0;
}
function Bv(e, t = null, n = !1, i = {}) {
  t === null && (t = [e]);
  for (const l of ko)
    if (Hv(t, l.keys, l.equal)) {
      if (n) return;
      if (Object.prototype.hasOwnProperty.call(l, "error")) throw l.error;
      if (Object.prototype.hasOwnProperty.call(l, "response"))
        return i.lifespan && i.lifespan > 0 && (l.timeout && clearTimeout(l.timeout), l.timeout = setTimeout(l.remove, i.lifespan)), l.response;
      if (!n) throw l.promise;
    }
  const s = {
    keys: t,
    equal: i.equal,
    remove: () => {
      const l = ko.indexOf(s);
      l !== -1 && ko.splice(l, 1);
    },
    promise: (
      // Execute the promise
      (g2(e) ? e : e(...t)).then((l) => {
        s.response = l, i.lifespan && i.lifespan > 0 && (s.timeout = setTimeout(s.remove, i.lifespan));
      }).catch((l) => s.error = l)
    )
  };
  if (ko.push(s), !n) throw s.promise;
}
const y2 = (e, t, n) => Bv(e, t, !1, n), v2 = (e, t, n) => void Bv(e, t, !0, n), x2 = (e) => {
  if (e === void 0 || e.length === 0) ko.splice(0, ko.length);
  else {
    const t = ko.find((n) => Hv(e, n.keys, n.equal));
    t && t.remove();
  }
};
var Gv = { exports: {} }, Wv = { exports: {} }, Vv = {};
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
  function i(N) {
    if (N.length === 0) return null;
    var U = N[0], F = N.pop();
    if (F !== U) {
      N[0] = F;
      e: for (var Y = 0, te = N.length, ce = te >>> 1; Y < ce; ) {
        var ze = 2 * (Y + 1) - 1, ot = N[ze], Xe = ze + 1, en = N[Xe];
        if (0 > s(ot, F)) Xe < te && 0 > s(en, ot) ? (N[Y] = en, N[Xe] = F, Y = Xe) : (N[Y] = ot, N[ze] = F, Y = ze);
        else if (Xe < te && 0 > s(en, F)) N[Y] = en, N[Xe] = F, Y = Xe;
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
  var p = [], m = [], g = 1, y = null, v = 3, w = !1, T = !1, A = !1, L = typeof setTimeout == "function" ? setTimeout : null, S = typeof clearTimeout == "function" ? clearTimeout : null, x = typeof setImmediate < "u" ? setImmediate : null;
  typeof navigator < "u" && navigator.scheduling !== void 0 && navigator.scheduling.isInputPending !== void 0 && navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function _(N) {
    for (var U = n(m); U !== null; ) {
      if (U.callback === null) i(m);
      else if (U.startTime <= N) i(m), U.sortIndex = U.expirationTime, t(p, U);
      else break;
      U = n(m);
    }
  }
  function R(N) {
    if (A = !1, _(N), !T) if (n(p) !== null) T = !0, be(I);
    else {
      var U = n(m);
      U !== null && Tt(R, U.startTime - N);
    }
  }
  function I(N, U) {
    T = !1, A && (A = !1, S(B), B = -1), w = !0;
    var F = v;
    try {
      for (_(U), y = n(p); y !== null && (!(y.expirationTime > U) || N && !Q()); ) {
        var Y = y.callback;
        if (typeof Y == "function") {
          y.callback = null, v = y.priorityLevel;
          var te = Y(y.expirationTime <= U);
          U = e.unstable_now(), typeof te == "function" ? y.callback = te : y === n(p) && i(p), _(U);
        } else i(p);
        y = n(p);
      }
      if (y !== null) var ce = !0;
      else {
        var ze = n(m);
        ze !== null && Tt(R, ze.startTime - U), ce = !1;
      }
      return ce;
    } finally {
      y = null, v = F, w = !1;
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
        U ? xe() : (O = !1, D = null);
      }
    } else O = !1;
  }
  var xe;
  if (typeof x == "function") xe = function() {
    x(le);
  };
  else if (typeof MessageChannel < "u") {
    var kt = new MessageChannel(), Bt = kt.port2;
    kt.port1.onmessage = le, xe = function() {
      Bt.postMessage(null);
    };
  } else xe = function() {
    L(le, 0);
  };
  function be(N) {
    D = N, O || (O = !0, xe());
  }
  function Tt(N, U) {
    B = L(function() {
      N(e.unstable_now());
    }, U);
  }
  e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(N) {
    N.callback = null;
  }, e.unstable_continueExecution = function() {
    T || w || (T = !0, be(I));
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
    return te = F + te, N = { id: g++, callback: U, priorityLevel: N, startTime: F, expirationTime: te, sortIndex: -1 }, F > Y ? (N.sortIndex = F, t(m, N), n(p) === null && N === n(m) && (A ? (S(B), B = -1) : A = !0, Tt(R, F - Y))) : (N.sortIndex = te, t(p, N), T || w || (T = !0, be(I))), N;
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
})(Vv);
Wv.exports = Vv;
var Dd = Wv.exports;
/**
 * @license React
 * react-reconciler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var S2 = function(t) {
  var n = {}, i = W, s = Dd, l = Object.assign;
  function a(r) {
    for (var o = "https://reactjs.org/docs/error-decoder.html?invariant=" + r, u = 1; u < arguments.length; u++) o += "&args[]=" + encodeURIComponent(arguments[u]);
    return "Minified React error #" + r + "; visit " + o + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var f = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, p = Symbol.for("react.element"), m = Symbol.for("react.portal"), g = Symbol.for("react.fragment"), y = Symbol.for("react.strict_mode"), v = Symbol.for("react.profiler"), w = Symbol.for("react.provider"), T = Symbol.for("react.context"), A = Symbol.for("react.forward_ref"), L = Symbol.for("react.suspense"), S = Symbol.for("react.suspense_list"), x = Symbol.for("react.memo"), _ = Symbol.for("react.lazy"), R = Symbol.for("react.offscreen"), I = Symbol.iterator;
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
      case L:
        return "Suspense";
      case S:
        return "SuspenseList";
    }
    if (typeof r == "object") switch (r.$$typeof) {
      case T:
        return (r.displayName || "Context") + ".Consumer";
      case w:
        return (r._context.displayName || "Context") + ".Provider";
      case A:
        var o = r.render;
        return r = r.displayName, r || (r = o.displayName || o.name || "", r = r !== "" ? "ForwardRef(" + r + ")" : "ForwardRef"), r;
      case x:
        return o = r.displayName || null, o !== null ? o : D(r.type) || "Memo";
      case _:
        o = r._payload, r = r._init;
        try {
          return D(r(o));
        } catch {
        }
    }
    return null;
  }
  function B(r) {
    var o = r.type;
    switch (r.tag) {
      case 24:
        return "Cache";
      case 9:
        return (o.displayName || "Context") + ".Consumer";
      case 10:
        return (o._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return r = o.render, r = r.displayName || r.name || "", o.displayName || (r !== "" ? "ForwardRef(" + r + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return o;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return D(o);
      case 8:
        return o === y ? "StrictMode" : "Mode";
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
        if (typeof o == "function") return o.displayName || o.name || null;
        if (typeof o == "string") return o;
    }
    return null;
  }
  function q(r) {
    var o = r, u = r;
    if (r.alternate) for (; o.return; ) o = o.return;
    else {
      r = o;
      do
        o = r, o.flags & 4098 && (u = o.return), r = o.return;
      while (r);
    }
    return o.tag === 3 ? u : null;
  }
  function V(r) {
    if (q(r) !== r) throw Error(a(188));
  }
  function Q(r) {
    var o = r.alternate;
    if (!o) {
      if (o = q(r), o === null) throw Error(a(188));
      return o !== r ? null : r;
    }
    for (var u = r, c = o; ; ) {
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
          if (h === c) return V(d), o;
          h = h.sibling;
        }
        throw Error(a(188));
      }
      if (u.return !== c.return) u = d, c = h;
      else {
        for (var k = !1, P = d.child; P; ) {
          if (P === u) {
            k = !0, u = d, c = h;
            break;
          }
          if (P === c) {
            k = !0, c = d, u = h;
            break;
          }
          P = P.sibling;
        }
        if (!k) {
          for (P = h.child; P; ) {
            if (P === u) {
              k = !0, u = h, c = d;
              break;
            }
            if (P === c) {
              k = !0, c = h, u = d;
              break;
            }
            P = P.sibling;
          }
          if (!k) throw Error(a(189));
        }
      }
      if (u.alternate !== c) throw Error(a(190));
    }
    if (u.tag !== 3) throw Error(a(188));
    return u.stateNode.current === u ? r : o;
  }
  function le(r) {
    return r = Q(r), r !== null ? xe(r) : null;
  }
  function xe(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      var o = xe(r);
      if (o !== null) return o;
      r = r.sibling;
    }
    return null;
  }
  function kt(r) {
    if (r.tag === 5 || r.tag === 6) return r;
    for (r = r.child; r !== null; ) {
      if (r.tag !== 4) {
        var o = kt(r);
        if (o !== null) return o;
      }
      r = r.sibling;
    }
    return null;
  }
  var Bt = Array.isArray, be = t.getPublicInstance, Tt = t.getRootHostContext, N = t.getChildHostContext, U = t.prepareForCommit, F = t.resetAfterCommit, Y = t.createInstance, te = t.appendInitialChild, ce = t.finalizeInitialChildren, ze = t.prepareUpdate, ot = t.shouldSetTextContent, Xe = t.createTextInstance, en = t.scheduleTimeout, v1 = t.cancelTimeout, Ua = t.noTimeout, hl = t.isPrimaryRenderer, vn = t.supportsMutation, ml = t.supportsPersistence, Gt = t.supportsHydration, x1 = t.getInstanceFromNode, S1 = t.preparePortalMount, w1 = t.getCurrentEventPriority, _1 = t.detachDeletedInstance, E1 = t.supportsMicrotasks, k1 = t.scheduleMicrotask, Wi = t.supportsTestSelectors, T1 = t.findFiberRoot, P1 = t.getBoundingRect, C1 = t.getTextContent, Vi = t.isHiddenSubtree, R1 = t.matchAccessibilityRole, A1 = t.setFocusIfFocusable, L1 = t.setupIntersectionObserver, M1 = t.appendChild, N1 = t.appendChildToContainer, j1 = t.commitTextUpdate, z1 = t.commitMount, I1 = t.commitUpdate, O1 = t.insertBefore, D1 = t.insertInContainerBefore, F1 = t.removeChild, U1 = t.removeChildFromContainer, Hp = t.resetTextContent, H1 = t.hideInstance, B1 = t.hideTextInstance, G1 = t.unhideInstance, W1 = t.unhideTextInstance, V1 = t.clearContainer, K1 = t.cloneInstance, Bp = t.createContainerChildSet, Gp = t.appendChildToContainerChildSet, Q1 = t.finalizeContainerChildren, Wp = t.replaceContainerChildren, Vp = t.cloneHiddenInstance, Kp = t.cloneHiddenTextInstance, X1 = t.canHydrateInstance, Y1 = t.canHydrateTextInstance, Z1 = t.canHydrateSuspenseInstance, Qp = t.isSuspenseInstancePending, Ha = t.isSuspenseInstanceFallback, J1 = t.registerSuspenseInstanceRetry, Ki = t.getNextHydratableSibling, q1 = t.getFirstHydratableChild, $1 = t.getFirstHydratableChildWithinContainer, b1 = t.getFirstHydratableChildWithinSuspenseInstance, ex = t.hydrateInstance, tx = t.hydrateTextInstance, nx = t.hydrateSuspenseInstance, rx = t.getNextHydratableInstanceAfterSuspenseInstance, Xp = t.commitHydratedContainer, ox = t.commitHydratedSuspenseInstance, ix = t.clearSuspenseBoundary, sx = t.clearSuspenseBoundaryFromContainer, lx = t.shouldDeleteUnhydratedTailInstances, ux = t.didNotMatchHydratedContainerTextInstance, ax = t.didNotMatchHydratedTextInstance, Ba;
  function Qi(r) {
    if (Ba === void 0) try {
      throw Error();
    } catch (u) {
      var o = u.stack.trim().match(/\n( *(at )?)/);
      Ba = o && o[1] || "";
    }
    return `
` + Ba + r;
  }
  var Ga = !1;
  function Wa(r, o) {
    if (!r || Ga) return "";
    Ga = !0;
    var u = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (o) if (o = function() {
        throw Error();
      }, Object.defineProperty(o.prototype, "props", { set: function() {
        throw Error();
      } }), typeof Reflect == "object" && Reflect.construct) {
        try {
          Reflect.construct(o, []);
        } catch (G) {
          var c = G;
        }
        Reflect.construct(r, [], o);
      } else {
        try {
          o.call();
        } catch (G) {
          c = G;
        }
        r.call(o.prototype);
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
`), k = d.length - 1, P = h.length - 1; 1 <= k && 0 <= P && d[k] !== h[P]; ) P--;
        for (; 1 <= k && 0 <= P; k--, P--) if (d[k] !== h[P]) {
          if (k !== 1 || P !== 1)
            do
              if (k--, P--, 0 > P || d[k] !== h[P]) {
                var z = `
` + d[k].replace(" at new ", " at ");
                return r.displayName && z.includes("<anonymous>") && (z = z.replace("<anonymous>", r.displayName)), z;
              }
            while (1 <= k && 0 <= P);
          break;
        }
      }
    } finally {
      Ga = !1, Error.prepareStackTrace = u;
    }
    return (r = r ? r.displayName || r.name : "") ? Qi(r) : "";
  }
  var cx = Object.prototype.hasOwnProperty, Va = [], Ho = -1;
  function vr(r) {
    return { current: r };
  }
  function Te(r) {
    0 > Ho || (r.current = Va[Ho], Va[Ho] = null, Ho--);
  }
  function Se(r, o) {
    Ho++, Va[Ho] = r.current, r.current = o;
  }
  var xr = {}, it = vr(xr), Pt = vr(!1), to = xr;
  function Bo(r, o) {
    var u = r.type.contextTypes;
    if (!u) return xr;
    var c = r.stateNode;
    if (c && c.__reactInternalMemoizedUnmaskedChildContext === o) return c.__reactInternalMemoizedMaskedChildContext;
    var d = {}, h;
    for (h in u) d[h] = o[h];
    return c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = o, r.__reactInternalMemoizedMaskedChildContext = d), d;
  }
  function Ct(r) {
    return r = r.childContextTypes, r != null;
  }
  function gl() {
    Te(Pt), Te(it);
  }
  function Yp(r, o, u) {
    if (it.current !== xr) throw Error(a(168));
    Se(it, o), Se(Pt, u);
  }
  function Zp(r, o, u) {
    var c = r.stateNode;
    if (o = o.childContextTypes, typeof c.getChildContext != "function") return u;
    c = c.getChildContext();
    for (var d in c) if (!(d in o)) throw Error(a(108, B(r) || "Unknown", d));
    return l({}, u, c);
  }
  function yl(r) {
    return r = (r = r.stateNode) && r.__reactInternalMemoizedMergedChildContext || xr, to = it.current, Se(it, r), Se(Pt, Pt.current), !0;
  }
  function Jp(r, o, u) {
    var c = r.stateNode;
    if (!c) throw Error(a(169));
    u ? (r = Zp(r, o, to), c.__reactInternalMemoizedMergedChildContext = r, Te(Pt), Te(it), Se(it, r)) : Te(Pt), Se(Pt, u);
  }
  var xn = Math.clz32 ? Math.clz32 : px, fx = Math.log, dx = Math.LN2;
  function px(r) {
    return r >>>= 0, r === 0 ? 32 : 31 - (fx(r) / dx | 0) | 0;
  }
  var vl = 64, xl = 4194304;
  function Xi(r) {
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
  function Sl(r, o) {
    var u = r.pendingLanes;
    if (u === 0) return 0;
    var c = 0, d = r.suspendedLanes, h = r.pingedLanes, k = u & 268435455;
    if (k !== 0) {
      var P = k & ~d;
      P !== 0 ? c = Xi(P) : (h &= k, h !== 0 && (c = Xi(h)));
    } else k = u & ~d, k !== 0 ? c = Xi(k) : h !== 0 && (c = Xi(h));
    if (c === 0) return 0;
    if (o !== 0 && o !== c && !(o & d) && (d = c & -c, h = o & -o, d >= h || d === 16 && (h & 4194240) !== 0)) return o;
    if (c & 4 && (c |= u & 16), o = r.entangledLanes, o !== 0) for (r = r.entanglements, o &= c; 0 < o; ) u = 31 - xn(o), d = 1 << u, c |= r[u], o &= ~d;
    return c;
  }
  function hx(r, o) {
    switch (r) {
      case 1:
      case 2:
      case 4:
        return o + 250;
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
        return o + 5e3;
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
  function mx(r, o) {
    for (var u = r.suspendedLanes, c = r.pingedLanes, d = r.expirationTimes, h = r.pendingLanes; 0 < h; ) {
      var k = 31 - xn(h), P = 1 << k, z = d[k];
      z === -1 ? (!(P & u) || P & c) && (d[k] = hx(P, o)) : z <= o && (r.expiredLanes |= P), h &= ~P;
    }
  }
  function Ka(r) {
    return r = r.pendingLanes & -1073741825, r !== 0 ? r : r & 1073741824 ? 1073741824 : 0;
  }
  function Qa(r) {
    for (var o = [], u = 0; 31 > u; u++) o.push(r);
    return o;
  }
  function Yi(r, o, u) {
    r.pendingLanes |= o, o !== 536870912 && (r.suspendedLanes = 0, r.pingedLanes = 0), r = r.eventTimes, o = 31 - xn(o), r[o] = u;
  }
  function gx(r, o) {
    var u = r.pendingLanes & ~o;
    r.pendingLanes = o, r.suspendedLanes = 0, r.pingedLanes = 0, r.expiredLanes &= o, r.mutableReadLanes &= o, r.entangledLanes &= o, o = r.entanglements;
    var c = r.eventTimes;
    for (r = r.expirationTimes; 0 < u; ) {
      var d = 31 - xn(u), h = 1 << d;
      o[d] = 0, c[d] = -1, r[d] = -1, u &= ~h;
    }
  }
  function Xa(r, o) {
    var u = r.entangledLanes |= o;
    for (r = r.entanglements; u; ) {
      var c = 31 - xn(u), d = 1 << c;
      d & o | r[c] & o && (r[c] |= o), u &= ~d;
    }
  }
  var de = 0;
  function qp(r) {
    return r &= -r, 1 < r ? 4 < r ? r & 268435455 ? 16 : 536870912 : 4 : 1;
  }
  var Ya = s.unstable_scheduleCallback, $p = s.unstable_cancelCallback, yx = s.unstable_shouldYield, vx = s.unstable_requestPaint, Ye = s.unstable_now, Za = s.unstable_ImmediatePriority, xx = s.unstable_UserBlockingPriority, Ja = s.unstable_NormalPriority, Sx = s.unstable_IdlePriority, wl = null, jn = null;
  function wx(r) {
    if (jn && typeof jn.onCommitFiberRoot == "function") try {
      jn.onCommitFiberRoot(wl, r, void 0, (r.current.flags & 128) === 128);
    } catch {
    }
  }
  function _x(r, o) {
    return r === o && (r !== 0 || 1 / r === 1 / o) || r !== r && o !== o;
  }
  var zn = typeof Object.is == "function" ? Object.is : _x, bn = null, _l = !1, qa = !1;
  function bp(r) {
    bn === null ? bn = [r] : bn.push(r);
  }
  function Ex(r) {
    _l = !0, bp(r);
  }
  function In() {
    if (!qa && bn !== null) {
      qa = !0;
      var r = 0, o = de;
      try {
        var u = bn;
        for (de = 1; r < u.length; r++) {
          var c = u[r];
          do
            c = c(!0);
          while (c !== null);
        }
        bn = null, _l = !1;
      } catch (d) {
        throw bn !== null && (bn = bn.slice(r + 1)), Ya(Za, In), d;
      } finally {
        de = o, qa = !1;
      }
    }
    return null;
  }
  var kx = f.ReactCurrentBatchConfig;
  function El(r, o) {
    if (zn(r, o)) return !0;
    if (typeof r != "object" || r === null || typeof o != "object" || o === null) return !1;
    var u = Object.keys(r), c = Object.keys(o);
    if (u.length !== c.length) return !1;
    for (c = 0; c < u.length; c++) {
      var d = u[c];
      if (!cx.call(o, d) || !zn(r[d], o[d])) return !1;
    }
    return !0;
  }
  function Tx(r) {
    switch (r.tag) {
      case 5:
        return Qi(r.type);
      case 16:
        return Qi("Lazy");
      case 13:
        return Qi("Suspense");
      case 19:
        return Qi("SuspenseList");
      case 0:
      case 2:
      case 15:
        return r = Wa(r.type, !1), r;
      case 11:
        return r = Wa(r.type.render, !1), r;
      case 1:
        return r = Wa(r.type, !0), r;
      default:
        return "";
    }
  }
  function Sn(r, o) {
    if (r && r.defaultProps) {
      o = l({}, o), r = r.defaultProps;
      for (var u in r) o[u] === void 0 && (o[u] = r[u]);
      return o;
    }
    return o;
  }
  var kl = vr(null), Tl = null, Go = null, $a = null;
  function ba() {
    $a = Go = Tl = null;
  }
  function eh(r, o, u) {
    hl ? (Se(kl, o._currentValue), o._currentValue = u) : (Se(kl, o._currentValue2), o._currentValue2 = u);
  }
  function ec(r) {
    var o = kl.current;
    Te(kl), hl ? r._currentValue = o : r._currentValue2 = o;
  }
  function tc(r, o, u) {
    for (; r !== null; ) {
      var c = r.alternate;
      if ((r.childLanes & o) !== o ? (r.childLanes |= o, c !== null && (c.childLanes |= o)) : c !== null && (c.childLanes & o) !== o && (c.childLanes |= o), r === u) break;
      r = r.return;
    }
  }
  function Wo(r, o) {
    Tl = r, $a = Go = null, r = r.dependencies, r !== null && r.firstContext !== null && (r.lanes & o && (Kt = !0), r.firstContext = null);
  }
  function tn(r) {
    var o = hl ? r._currentValue : r._currentValue2;
    if ($a !== r) if (r = { context: r, memoizedValue: o, next: null }, Go === null) {
      if (Tl === null) throw Error(a(308));
      Go = r, Tl.dependencies = { lanes: 0, firstContext: r };
    } else Go = Go.next = r;
    return o;
  }
  var On = null, Sr = !1;
  function nc(r) {
    r.updateQueue = { baseState: r.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function th(r, o) {
    r = r.updateQueue, o.updateQueue === r && (o.updateQueue = { baseState: r.baseState, firstBaseUpdate: r.firstBaseUpdate, lastBaseUpdate: r.lastBaseUpdate, shared: r.shared, effects: r.effects });
  }
  function er(r, o) {
    return { eventTime: r, lane: o, tag: 0, payload: null, callback: null, next: null };
  }
  function wr(r, o) {
    var u = r.updateQueue;
    u !== null && (u = u.shared, He !== null && r.mode & 1 && !(se & 2) ? (r = u.interleaved, r === null ? (o.next = o, On === null ? On = [u] : On.push(u)) : (o.next = r.next, r.next = o), u.interleaved = o) : (r = u.pending, r === null ? o.next = o : (o.next = r.next, r.next = o), u.pending = o));
  }
  function Pl(r, o, u) {
    if (o = o.updateQueue, o !== null && (o = o.shared, (u & 4194240) !== 0)) {
      var c = o.lanes;
      c &= r.pendingLanes, u |= c, o.lanes = u, Xa(r, u);
    }
  }
  function nh(r, o) {
    var u = r.updateQueue, c = r.alternate;
    if (c !== null && (c = c.updateQueue, u === c)) {
      var d = null, h = null;
      if (u = u.firstBaseUpdate, u !== null) {
        do {
          var k = { eventTime: u.eventTime, lane: u.lane, tag: u.tag, payload: u.payload, callback: u.callback, next: null };
          h === null ? d = h = k : h = h.next = k, u = u.next;
        } while (u !== null);
        h === null ? d = h = o : h = h.next = o;
      } else d = h = o;
      u = { baseState: c.baseState, firstBaseUpdate: d, lastBaseUpdate: h, shared: c.shared, effects: c.effects }, r.updateQueue = u;
      return;
    }
    r = u.lastBaseUpdate, r === null ? u.firstBaseUpdate = o : r.next = o, u.lastBaseUpdate = o;
  }
  function Cl(r, o, u, c) {
    var d = r.updateQueue;
    Sr = !1;
    var h = d.firstBaseUpdate, k = d.lastBaseUpdate, P = d.shared.pending;
    if (P !== null) {
      d.shared.pending = null;
      var z = P, G = z.next;
      z.next = null, k === null ? h = G : k.next = G, k = z;
      var J = r.alternate;
      J !== null && (J = J.updateQueue, P = J.lastBaseUpdate, P !== k && (P === null ? J.firstBaseUpdate = G : P.next = G, J.lastBaseUpdate = z));
    }
    if (h !== null) {
      var ne = d.baseState;
      k = 0, J = G = z = null, P = h;
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
            switch (ee = o, ve = u, at.tag) {
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
                Sr = !0;
            }
          }
          P.callback !== null && P.lane !== 0 && (r.flags |= 64, ee = d.effects, ee === null ? d.effects = [P] : ee.push(P));
        } else ve = { eventTime: ve, lane: ee, tag: P.tag, payload: P.payload, callback: P.callback, next: null }, J === null ? (G = J = ve, z = ne) : J = J.next = ve, k |= ee;
        if (P = P.next, P === null) {
          if (P = d.shared.pending, P === null) break;
          ee = P, P = ee.next, ee.next = null, d.lastBaseUpdate = ee, d.shared.pending = null;
        }
      } while (!0);
      if (J === null && (z = ne), d.baseState = z, d.firstBaseUpdate = G, d.lastBaseUpdate = J, o = d.shared.interleaved, o !== null) {
        d = o;
        do
          k |= d.lane, d = d.next;
        while (d !== o);
      } else h === null && (d.shared.lanes = 0);
      $o |= k, r.lanes = k, r.memoizedState = ne;
    }
  }
  function rh(r, o, u) {
    if (r = o.effects, o.effects = null, r !== null) for (o = 0; o < r.length; o++) {
      var c = r[o], d = c.callback;
      if (d !== null) {
        if (c.callback = null, c = u, typeof d != "function") throw Error(a(191, d));
        d.call(c);
      }
    }
  }
  var oh = new i.Component().refs;
  function rc(r, o, u, c) {
    o = r.memoizedState, u = u(c, o), u = u == null ? o : l({}, o, u), r.memoizedState = u, r.lanes === 0 && (r.updateQueue.baseState = u);
  }
  var Rl = { isMounted: function(r) {
    return (r = r._reactInternals) ? q(r) === r : !1;
  }, enqueueSetState: function(r, o, u) {
    r = r._reactInternals;
    var c = vt(), d = kr(r), h = er(c, d);
    h.payload = o, u != null && (h.callback = u), wr(r, h), o = ln(r, d, c), o !== null && Pl(o, r, d);
  }, enqueueReplaceState: function(r, o, u) {
    r = r._reactInternals;
    var c = vt(), d = kr(r), h = er(c, d);
    h.tag = 1, h.payload = o, u != null && (h.callback = u), wr(r, h), o = ln(r, d, c), o !== null && Pl(o, r, d);
  }, enqueueForceUpdate: function(r, o) {
    r = r._reactInternals;
    var u = vt(), c = kr(r), d = er(
      u,
      c
    );
    d.tag = 2, o != null && (d.callback = o), wr(r, d), o = ln(r, c, u), o !== null && Pl(o, r, c);
  } };
  function ih(r, o, u, c, d, h, k) {
    return r = r.stateNode, typeof r.shouldComponentUpdate == "function" ? r.shouldComponentUpdate(c, h, k) : o.prototype && o.prototype.isPureReactComponent ? !El(u, c) || !El(d, h) : !0;
  }
  function sh(r, o, u) {
    var c = !1, d = xr, h = o.contextType;
    return typeof h == "object" && h !== null ? h = tn(h) : (d = Ct(o) ? to : it.current, c = o.contextTypes, h = (c = c != null) ? Bo(r, d) : xr), o = new o(u, h), r.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null, o.updater = Rl, r.stateNode = o, o._reactInternals = r, c && (r = r.stateNode, r.__reactInternalMemoizedUnmaskedChildContext = d, r.__reactInternalMemoizedMaskedChildContext = h), o;
  }
  function lh(r, o, u, c) {
    r = o.state, typeof o.componentWillReceiveProps == "function" && o.componentWillReceiveProps(u, c), typeof o.UNSAFE_componentWillReceiveProps == "function" && o.UNSAFE_componentWillReceiveProps(u, c), o.state !== r && Rl.enqueueReplaceState(o, o.state, null);
  }
  function oc(r, o, u, c) {
    var d = r.stateNode;
    d.props = u, d.state = r.memoizedState, d.refs = oh, nc(r);
    var h = o.contextType;
    typeof h == "object" && h !== null ? d.context = tn(h) : (h = Ct(o) ? to : it.current, d.context = Bo(r, h)), d.state = r.memoizedState, h = o.getDerivedStateFromProps, typeof h == "function" && (rc(r, o, h, u), d.state = r.memoizedState), typeof o.getDerivedStateFromProps == "function" || typeof d.getSnapshotBeforeUpdate == "function" || typeof d.UNSAFE_componentWillMount != "function" && typeof d.componentWillMount != "function" || (o = d.state, typeof d.componentWillMount == "function" && d.componentWillMount(), typeof d.UNSAFE_componentWillMount == "function" && d.UNSAFE_componentWillMount(), o !== d.state && Rl.enqueueReplaceState(d, d.state, null), Cl(r, u, d, c), d.state = r.memoizedState), typeof d.componentDidMount == "function" && (r.flags |= 4194308);
  }
  var Vo = [], Ko = 0, Al = null, Ll = 0, nn = [], rn = 0, no = null, tr = 1, nr = "";
  function ro(r, o) {
    Vo[Ko++] = Ll, Vo[Ko++] = Al, Al = r, Ll = o;
  }
  function uh(r, o, u) {
    nn[rn++] = tr, nn[rn++] = nr, nn[rn++] = no, no = r;
    var c = tr;
    r = nr;
    var d = 32 - xn(c) - 1;
    c &= ~(1 << d), u += 1;
    var h = 32 - xn(o) + d;
    if (30 < h) {
      var k = d - d % 5;
      h = (c & (1 << k) - 1).toString(32), c >>= k, d -= k, tr = 1 << 32 - xn(o) + d | u << d | c, nr = h + r;
    } else tr = 1 << h | u << d | c, nr = r;
  }
  function ic(r) {
    r.return !== null && (ro(r, 1), uh(r, 1, 0));
  }
  function sc(r) {
    for (; r === Al; ) Al = Vo[--Ko], Vo[Ko] = null, Ll = Vo[--Ko], Vo[Ko] = null;
    for (; r === no; ) no = nn[--rn], nn[rn] = null, nr = nn[--rn], nn[rn] = null, tr = nn[--rn], nn[rn] = null;
  }
  var Wt = null, Vt = null, Re = !1, Zi = !1, wn = null;
  function ah(r, o) {
    var u = un(5, null, null, 0);
    u.elementType = "DELETED", u.stateNode = o, u.return = r, o = r.deletions, o === null ? (r.deletions = [u], r.flags |= 16) : o.push(u);
  }
  function ch(r, o) {
    switch (r.tag) {
      case 5:
        return o = X1(o, r.type, r.pendingProps), o !== null ? (r.stateNode = o, Wt = r, Vt = q1(o), !0) : !1;
      case 6:
        return o = Y1(o, r.pendingProps), o !== null ? (r.stateNode = o, Wt = r, Vt = null, !0) : !1;
      case 13:
        if (o = Z1(o), o !== null) {
          var u = no !== null ? { id: tr, overflow: nr } : null;
          return r.memoizedState = { dehydrated: o, treeContext: u, retryLane: 1073741824 }, u = un(18, null, null, 0), u.stateNode = o, u.return = r, r.child = u, Wt = r, Vt = null, !0;
        }
        return !1;
      default:
        return !1;
    }
  }
  function lc(r) {
    return (r.mode & 1) !== 0 && (r.flags & 128) === 0;
  }
  function uc(r) {
    if (Re) {
      var o = Vt;
      if (o) {
        var u = o;
        if (!ch(r, o)) {
          if (lc(r)) throw Error(a(418));
          o = Ki(u);
          var c = Wt;
          o && ch(r, o) ? ah(c, u) : (r.flags = r.flags & -4097 | 2, Re = !1, Wt = r);
        }
      } else {
        if (lc(r)) throw Error(a(418));
        r.flags = r.flags & -4097 | 2, Re = !1, Wt = r;
      }
    }
  }
  function fh(r) {
    for (r = r.return; r !== null && r.tag !== 5 && r.tag !== 3 && r.tag !== 13; ) r = r.return;
    Wt = r;
  }
  function Ji(r) {
    if (!Gt || r !== Wt) return !1;
    if (!Re) return fh(r), Re = !0, !1;
    if (r.tag !== 3 && (r.tag !== 5 || lx(r.type) && !ot(r.type, r.memoizedProps))) {
      var o = Vt;
      if (o) {
        if (lc(r)) {
          for (r = Vt; r; ) r = Ki(r);
          throw Error(a(418));
        }
        for (; o; ) ah(r, o), o = Ki(o);
      }
    }
    if (fh(r), r.tag === 13) {
      if (!Gt) throw Error(a(316));
      if (r = r.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
      Vt = rx(r);
    } else Vt = Wt ? Ki(r.stateNode) : null;
    return !0;
  }
  function Qo() {
    Gt && (Vt = Wt = null, Zi = Re = !1);
  }
  function ac(r) {
    wn === null ? wn = [r] : wn.push(r);
  }
  function qi(r, o, u) {
    if (r = u.ref, r !== null && typeof r != "function" && typeof r != "object") {
      if (u._owner) {
        if (u = u._owner, u) {
          if (u.tag !== 1) throw Error(a(309));
          var c = u.stateNode;
        }
        if (!c) throw Error(a(147, r));
        var d = c, h = "" + r;
        return o !== null && o.ref !== null && typeof o.ref == "function" && o.ref._stringRef === h ? o.ref : (o = function(k) {
          var P = d.refs;
          P === oh && (P = d.refs = {}), k === null ? delete P[h] : P[h] = k;
        }, o._stringRef = h, o);
      }
      if (typeof r != "string") throw Error(a(284));
      if (!u._owner) throw Error(a(290, r));
    }
    return r;
  }
  function Ml(r, o) {
    throw r = Object.prototype.toString.call(o), Error(a(31, r === "[object Object]" ? "object with keys {" + Object.keys(o).join(", ") + "}" : r));
  }
  function dh(r) {
    var o = r._init;
    return o(r._payload);
  }
  function ph(r) {
    function o(M, C) {
      if (r) {
        var j = M.deletions;
        j === null ? (M.deletions = [C], M.flags |= 16) : j.push(C);
      }
    }
    function u(M, C) {
      if (!r) return null;
      for (; C !== null; ) o(M, C), C = C.sibling;
      return null;
    }
    function c(M, C) {
      for (M = /* @__PURE__ */ new Map(); C !== null; ) C.key !== null ? M.set(C.key, C) : M.set(C.index, C), C = C.sibling;
      return M;
    }
    function d(M, C) {
      return M = Pr(M, C), M.index = 0, M.sibling = null, M;
    }
    function h(M, C, j) {
      return M.index = j, r ? (j = M.alternate, j !== null ? (j = j.index, j < C ? (M.flags |= 2, C) : j) : (M.flags |= 2, C)) : (M.flags |= 1048576, C);
    }
    function k(M) {
      return r && M.alternate === null && (M.flags |= 2), M;
    }
    function P(M, C, j, X) {
      return C === null || C.tag !== 6 ? (C = Qc(j, M.mode, X), C.return = M, C) : (C = d(C, j), C.return = M, C);
    }
    function z(M, C, j, X) {
      var $ = j.type;
      return $ === g ? J(M, C, j.props.children, X, j.key) : C !== null && (C.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === _ && dh($) === C.type) ? (X = d(C, j.props), X.ref = qi(M, C, j), X.return = M, X) : (X = uu(j.type, j.key, j.props, null, M.mode, X), X.ref = qi(M, C, j), X.return = M, X);
    }
    function G(M, C, j, X) {
      return C === null || C.tag !== 4 || C.stateNode.containerInfo !== j.containerInfo || C.stateNode.implementation !== j.implementation ? (C = Xc(j, M.mode, X), C.return = M, C) : (C = d(C, j.children || []), C.return = M, C);
    }
    function J(M, C, j, X, $) {
      return C === null || C.tag !== 7 ? (C = co(j, M.mode, X, $), C.return = M, C) : (C = d(C, j), C.return = M, C);
    }
    function ne(M, C, j) {
      if (typeof C == "string" && C !== "" || typeof C == "number") return C = Qc("" + C, M.mode, j), C.return = M, C;
      if (typeof C == "object" && C !== null) {
        switch (C.$$typeof) {
          case p:
            return j = uu(C.type, C.key, C.props, null, M.mode, j), j.ref = qi(M, null, C), j.return = M, j;
          case m:
            return C = Xc(C, M.mode, j), C.return = M, C;
          case _:
            var X = C._init;
            return ne(M, X(C._payload), j);
        }
        if (Bt(C) || O(C)) return C = co(C, M.mode, j, null), C.return = M, C;
        Ml(M, C);
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
        if (Bt(j) || O(j)) return $ !== null ? null : J(M, C, j, X, null);
        Ml(M, j);
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
            var oe = X._init;
            return ve(M, C, j, oe(X._payload), $);
        }
        if (Bt(X) || O(X)) return M = M.get(j) || null, J(C, M, X, $, null);
        Ml(C, X);
      }
      return null;
    }
    function b(M, C, j, X) {
      for (var $ = null, oe = null, re = C, pe = C = 0, Je = null; re !== null && pe < j.length; pe++) {
        re.index > pe ? (Je = re, re = null) : Je = re.sibling;
        var he = ee(M, re, j[pe], X);
        if (he === null) {
          re === null && (re = Je);
          break;
        }
        r && re && he.alternate === null && o(M, re), C = h(he, C, pe), oe === null ? $ = he : oe.sibling = he, oe = he, re = Je;
      }
      if (pe === j.length) return u(M, re), Re && ro(M, pe), $;
      if (re === null) {
        for (; pe < j.length; pe++) re = ne(M, j[pe], X), re !== null && (C = h(re, C, pe), oe === null ? $ = re : oe.sibling = re, oe = re);
        return Re && ro(M, pe), $;
      }
      for (re = c(M, re); pe < j.length; pe++) Je = ve(re, M, pe, j[pe], X), Je !== null && (r && Je.alternate !== null && re.delete(Je.key === null ? pe : Je.key), C = h(Je, C, pe), oe === null ? $ = Je : oe.sibling = Je, oe = Je);
      return r && re.forEach(function(Cr) {
        return o(M, Cr);
      }), Re && ro(M, pe), $;
    }
    function at(M, C, j, X) {
      var $ = O(j);
      if (typeof $ != "function") throw Error(a(150));
      if (j = $.call(j), j == null) throw Error(a(151));
      for (var oe = $ = null, re = C, pe = C = 0, Je = null, he = j.next(); re !== null && !he.done; pe++, he = j.next()) {
        re.index > pe ? (Je = re, re = null) : Je = re.sibling;
        var Cr = ee(M, re, he.value, X);
        if (Cr === null) {
          re === null && (re = Je);
          break;
        }
        r && re && Cr.alternate === null && o(M, re), C = h(Cr, C, pe), oe === null ? $ = Cr : oe.sibling = Cr, oe = Cr, re = Je;
      }
      if (he.done) return u(
        M,
        re
      ), Re && ro(M, pe), $;
      if (re === null) {
        for (; !he.done; pe++, he = j.next()) he = ne(M, he.value, X), he !== null && (C = h(he, C, pe), oe === null ? $ = he : oe.sibling = he, oe = he);
        return Re && ro(M, pe), $;
      }
      for (re = c(M, re); !he.done; pe++, he = j.next()) he = ve(re, M, pe, he.value, X), he !== null && (r && he.alternate !== null && re.delete(he.key === null ? pe : he.key), C = h(he, C, pe), oe === null ? $ = he : oe.sibling = he, oe = he);
      return r && re.forEach(function(tS) {
        return o(M, tS);
      }), Re && ro(M, pe), $;
    }
    function an(M, C, j, X) {
      if (typeof j == "object" && j !== null && j.type === g && j.key === null && (j = j.props.children), typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case p:
            e: {
              for (var $ = j.key, oe = C; oe !== null; ) {
                if (oe.key === $) {
                  if ($ = j.type, $ === g) {
                    if (oe.tag === 7) {
                      u(M, oe.sibling), C = d(oe, j.props.children), C.return = M, M = C;
                      break e;
                    }
                  } else if (oe.elementType === $ || typeof $ == "object" && $ !== null && $.$$typeof === _ && dh($) === oe.type) {
                    u(M, oe.sibling), C = d(oe, j.props), C.ref = qi(M, oe, j), C.return = M, M = C;
                    break e;
                  }
                  u(M, oe);
                  break;
                } else o(M, oe);
                oe = oe.sibling;
              }
              j.type === g ? (C = co(j.props.children, M.mode, X, j.key), C.return = M, M = C) : (X = uu(j.type, j.key, j.props, null, M.mode, X), X.ref = qi(M, C, j), X.return = M, M = X);
            }
            return k(M);
          case m:
            e: {
              for (oe = j.key; C !== null; ) {
                if (C.key === oe) if (C.tag === 4 && C.stateNode.containerInfo === j.containerInfo && C.stateNode.implementation === j.implementation) {
                  u(M, C.sibling), C = d(C, j.children || []), C.return = M, M = C;
                  break e;
                } else {
                  u(M, C);
                  break;
                }
                else o(M, C);
                C = C.sibling;
              }
              C = Xc(j, M.mode, X), C.return = M, M = C;
            }
            return k(M);
          case _:
            return oe = j._init, an(M, C, oe(j._payload), X);
        }
        if (Bt(j)) return b(M, C, j, X);
        if (O(j)) return at(M, C, j, X);
        Ml(M, j);
      }
      return typeof j == "string" && j !== "" || typeof j == "number" ? (j = "" + j, C !== null && C.tag === 6 ? (u(M, C.sibling), C = d(C, j), C.return = M, M = C) : (u(M, C), C = Qc(j, M.mode, X), C.return = M, M = C), k(M)) : u(M, C);
    }
    return an;
  }
  var Xo = ph(!0), hh = ph(!1), $i = {}, on = vr($i), bi = vr($i), Yo = vr($i);
  function Dn(r) {
    if (r === $i) throw Error(a(174));
    return r;
  }
  function cc(r, o) {
    Se(Yo, o), Se(bi, r), Se(on, $i), r = Tt(o), Te(on), Se(on, r);
  }
  function Zo() {
    Te(on), Te(bi), Te(Yo);
  }
  function mh(r) {
    var o = Dn(Yo.current), u = Dn(on.current);
    o = N(u, r.type, o), u !== o && (Se(bi, r), Se(on, o));
  }
  function fc(r) {
    bi.current === r && (Te(on), Te(bi));
  }
  var Le = vr(0);
  function Nl(r) {
    for (var o = r; o !== null; ) {
      if (o.tag === 13) {
        var u = o.memoizedState;
        if (u !== null && (u = u.dehydrated, u === null || Qp(u) || Ha(u))) return o;
      } else if (o.tag === 19 && o.memoizedProps.revealOrder !== void 0) {
        if (o.flags & 128) return o;
      } else if (o.child !== null) {
        o.child.return = o, o = o.child;
        continue;
      }
      if (o === r) break;
      for (; o.sibling === null; ) {
        if (o.return === null || o.return === r) return null;
        o = o.return;
      }
      o.sibling.return = o.return, o = o.sibling;
    }
    return null;
  }
  var dc = [];
  function pc() {
    for (var r = 0; r < dc.length; r++) {
      var o = dc[r];
      hl ? o._workInProgressVersionPrimary = null : o._workInProgressVersionSecondary = null;
    }
    dc.length = 0;
  }
  var jl = f.ReactCurrentDispatcher, sn = f.ReactCurrentBatchConfig, Jo = 0, Ie = null, st = null, Ze = null, zl = !1, es = !1, ts = 0, Px = 0;
  function lt() {
    throw Error(a(321));
  }
  function hc(r, o) {
    if (o === null) return !1;
    for (var u = 0; u < o.length && u < r.length; u++) if (!zn(r[u], o[u])) return !1;
    return !0;
  }
  function mc(r, o, u, c, d, h) {
    if (Jo = h, Ie = o, o.memoizedState = null, o.updateQueue = null, o.lanes = 0, jl.current = r === null || r.memoizedState === null ? Lx : Mx, r = u(c, d), es) {
      h = 0;
      do {
        if (es = !1, ts = 0, 25 <= h) throw Error(a(301));
        h += 1, Ze = st = null, o.updateQueue = null, jl.current = Nx, r = u(c, d);
      } while (es);
    }
    if (jl.current = Ul, o = st !== null && st.next !== null, Jo = 0, Ze = st = Ie = null, zl = !1, o) throw Error(a(300));
    return r;
  }
  function gc() {
    var r = ts !== 0;
    return ts = 0, r;
  }
  function rr() {
    var r = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return Ze === null ? Ie.memoizedState = Ze = r : Ze = Ze.next = r, Ze;
  }
  function Fn() {
    if (st === null) {
      var r = Ie.alternate;
      r = r !== null ? r.memoizedState : null;
    } else r = st.next;
    var o = Ze === null ? Ie.memoizedState : Ze.next;
    if (o !== null) Ze = o, st = r;
    else {
      if (r === null) throw Error(a(310));
      st = r, r = { memoizedState: st.memoizedState, baseState: st.baseState, baseQueue: st.baseQueue, queue: st.queue, next: null }, Ze === null ? Ie.memoizedState = Ze = r : Ze = Ze.next = r;
    }
    return Ze;
  }
  function oo(r, o) {
    return typeof o == "function" ? o(r) : o;
  }
  function Il(r) {
    var o = Fn(), u = o.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = st, d = c.baseQueue, h = u.pending;
    if (h !== null) {
      if (d !== null) {
        var k = d.next;
        d.next = h.next, h.next = k;
      }
      c.baseQueue = d = h, u.pending = null;
    }
    if (d !== null) {
      h = d.next, c = c.baseState;
      var P = k = null, z = null, G = h;
      do {
        var J = G.lane;
        if ((Jo & J) === J) z !== null && (z = z.next = { lane: 0, action: G.action, hasEagerState: G.hasEagerState, eagerState: G.eagerState, next: null }), c = G.hasEagerState ? G.eagerState : r(c, G.action);
        else {
          var ne = {
            lane: J,
            action: G.action,
            hasEagerState: G.hasEagerState,
            eagerState: G.eagerState,
            next: null
          };
          z === null ? (P = z = ne, k = c) : z = z.next = ne, Ie.lanes |= J, $o |= J;
        }
        G = G.next;
      } while (G !== null && G !== h);
      z === null ? k = c : z.next = P, zn(c, o.memoizedState) || (Kt = !0), o.memoizedState = c, o.baseState = k, o.baseQueue = z, u.lastRenderedState = c;
    }
    if (r = u.interleaved, r !== null) {
      d = r;
      do
        h = d.lane, Ie.lanes |= h, $o |= h, d = d.next;
      while (d !== r);
    } else d === null && (u.lanes = 0);
    return [o.memoizedState, u.dispatch];
  }
  function Ol(r) {
    var o = Fn(), u = o.queue;
    if (u === null) throw Error(a(311));
    u.lastRenderedReducer = r;
    var c = u.dispatch, d = u.pending, h = o.memoizedState;
    if (d !== null) {
      u.pending = null;
      var k = d = d.next;
      do
        h = r(h, k.action), k = k.next;
      while (k !== d);
      zn(h, o.memoizedState) || (Kt = !0), o.memoizedState = h, o.baseQueue === null && (o.baseState = h), u.lastRenderedState = h;
    }
    return [h, c];
  }
  function gh() {
  }
  function yh(r, o) {
    var u = Ie, c = Fn(), d = o(), h = !zn(c.memoizedState, d);
    if (h && (c.memoizedState = d, Kt = !0), c = c.queue, rs(Sh.bind(null, u, c, r), [r]), c.getSnapshot !== o || h || Ze !== null && Ze.memoizedState.tag & 1) {
      if (u.flags |= 2048, ns(9, xh.bind(null, u, c, d, o), void 0, null), He === null) throw Error(a(349));
      Jo & 30 || vh(u, o, d);
    }
    return d;
  }
  function vh(r, o, u) {
    r.flags |= 16384, r = { getSnapshot: o, value: u }, o = Ie.updateQueue, o === null ? (o = { lastEffect: null, stores: null }, Ie.updateQueue = o, o.stores = [r]) : (u = o.stores, u === null ? o.stores = [r] : u.push(r));
  }
  function xh(r, o, u, c) {
    o.value = u, o.getSnapshot = c, wh(o) && ln(r, 1, -1);
  }
  function Sh(r, o, u) {
    return u(function() {
      wh(o) && ln(r, 1, -1);
    });
  }
  function wh(r) {
    var o = r.getSnapshot;
    r = r.value;
    try {
      var u = o();
      return !zn(r, u);
    } catch {
      return !0;
    }
  }
  function yc(r) {
    var o = rr();
    return typeof r == "function" && (r = r()), o.memoizedState = o.baseState = r, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: oo, lastRenderedState: r }, o.queue = r, r = r.dispatch = Ax.bind(null, Ie, r), [o.memoizedState, r];
  }
  function ns(r, o, u, c) {
    return r = { tag: r, create: o, destroy: u, deps: c, next: null }, o = Ie.updateQueue, o === null ? (o = { lastEffect: null, stores: null }, Ie.updateQueue = o, o.lastEffect = r.next = r) : (u = o.lastEffect, u === null ? o.lastEffect = r.next = r : (c = u.next, u.next = r, r.next = c, o.lastEffect = r)), r;
  }
  function _h() {
    return Fn().memoizedState;
  }
  function Dl(r, o, u, c) {
    var d = rr();
    Ie.flags |= r, d.memoizedState = ns(1 | o, u, void 0, c === void 0 ? null : c);
  }
  function Fl(r, o, u, c) {
    var d = Fn();
    c = c === void 0 ? null : c;
    var h = void 0;
    if (st !== null) {
      var k = st.memoizedState;
      if (h = k.destroy, c !== null && hc(c, k.deps)) {
        d.memoizedState = ns(o, u, h, c);
        return;
      }
    }
    Ie.flags |= r, d.memoizedState = ns(1 | o, u, h, c);
  }
  function vc(r, o) {
    return Dl(8390656, 8, r, o);
  }
  function rs(r, o) {
    return Fl(2048, 8, r, o);
  }
  function Eh(r, o) {
    return Fl(4, 2, r, o);
  }
  function kh(r, o) {
    return Fl(4, 4, r, o);
  }
  function Th(r, o) {
    if (typeof o == "function") return r = r(), o(r), function() {
      o(null);
    };
    if (o != null) return r = r(), o.current = r, function() {
      o.current = null;
    };
  }
  function Ph(r, o, u) {
    return u = u != null ? u.concat([r]) : null, Fl(4, 4, Th.bind(null, o, r), u);
  }
  function xc() {
  }
  function Ch(r, o) {
    var u = Fn();
    o = o === void 0 ? null : o;
    var c = u.memoizedState;
    return c !== null && o !== null && hc(o, c[1]) ? c[0] : (u.memoizedState = [r, o], r);
  }
  function Rh(r, o) {
    var u = Fn();
    o = o === void 0 ? null : o;
    var c = u.memoizedState;
    return c !== null && o !== null && hc(o, c[1]) ? c[0] : (r = r(), u.memoizedState = [r, o], r);
  }
  function Cx(r, o) {
    var u = de;
    de = u !== 0 && 4 > u ? u : 4, r(!0);
    var c = sn.transition;
    sn.transition = {};
    try {
      r(!1), o();
    } finally {
      de = u, sn.transition = c;
    }
  }
  function Ah() {
    return Fn().memoizedState;
  }
  function Rx(r, o, u) {
    var c = kr(r);
    u = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null }, Lh(r) ? Mh(o, u) : (Nh(r, o, u), u = vt(), r = ln(r, c, u), r !== null && jh(r, o, c));
  }
  function Ax(r, o, u) {
    var c = kr(r), d = { lane: c, action: u, hasEagerState: !1, eagerState: null, next: null };
    if (Lh(r)) Mh(o, d);
    else {
      Nh(r, o, d);
      var h = r.alternate;
      if (r.lanes === 0 && (h === null || h.lanes === 0) && (h = o.lastRenderedReducer, h !== null)) try {
        var k = o.lastRenderedState, P = h(k, u);
        if (d.hasEagerState = !0, d.eagerState = P, zn(P, k)) return;
      } catch {
      } finally {
      }
      u = vt(), r = ln(r, c, u), r !== null && jh(r, o, c);
    }
  }
  function Lh(r) {
    var o = r.alternate;
    return r === Ie || o !== null && o === Ie;
  }
  function Mh(r, o) {
    es = zl = !0;
    var u = r.pending;
    u === null ? o.next = o : (o.next = u.next, u.next = o), r.pending = o;
  }
  function Nh(r, o, u) {
    He !== null && r.mode & 1 && !(se & 2) ? (r = o.interleaved, r === null ? (u.next = u, On === null ? On = [o] : On.push(o)) : (u.next = r.next, r.next = u), o.interleaved = u) : (r = o.pending, r === null ? u.next = u : (u.next = r.next, r.next = u), o.pending = u);
  }
  function jh(r, o, u) {
    if (u & 4194240) {
      var c = o.lanes;
      c &= r.pendingLanes, u |= c, o.lanes = u, Xa(r, u);
    }
  }
  var Ul = { readContext: tn, useCallback: lt, useContext: lt, useEffect: lt, useImperativeHandle: lt, useInsertionEffect: lt, useLayoutEffect: lt, useMemo: lt, useReducer: lt, useRef: lt, useState: lt, useDebugValue: lt, useDeferredValue: lt, useTransition: lt, useMutableSource: lt, useSyncExternalStore: lt, useId: lt, unstable_isNewReconciler: !1 }, Lx = { readContext: tn, useCallback: function(r, o) {
    return rr().memoizedState = [r, o === void 0 ? null : o], r;
  }, useContext: tn, useEffect: vc, useImperativeHandle: function(r, o, u) {
    return u = u != null ? u.concat([r]) : null, Dl(
      4194308,
      4,
      Th.bind(null, o, r),
      u
    );
  }, useLayoutEffect: function(r, o) {
    return Dl(4194308, 4, r, o);
  }, useInsertionEffect: function(r, o) {
    return Dl(4, 2, r, o);
  }, useMemo: function(r, o) {
    var u = rr();
    return o = o === void 0 ? null : o, r = r(), u.memoizedState = [r, o], r;
  }, useReducer: function(r, o, u) {
    var c = rr();
    return o = u !== void 0 ? u(o) : o, c.memoizedState = c.baseState = o, r = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: r, lastRenderedState: o }, c.queue = r, r = r.dispatch = Rx.bind(null, Ie, r), [c.memoizedState, r];
  }, useRef: function(r) {
    var o = rr();
    return r = { current: r }, o.memoizedState = r;
  }, useState: yc, useDebugValue: xc, useDeferredValue: function(r) {
    var o = yc(r), u = o[0], c = o[1];
    return vc(function() {
      var d = sn.transition;
      sn.transition = {};
      try {
        c(r);
      } finally {
        sn.transition = d;
      }
    }, [r]), u;
  }, useTransition: function() {
    var r = yc(!1), o = r[0];
    return r = Cx.bind(null, r[1]), rr().memoizedState = r, [o, r];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(r, o, u) {
    var c = Ie, d = rr();
    if (Re) {
      if (u === void 0) throw Error(a(407));
      u = u();
    } else {
      if (u = o(), He === null) throw Error(a(349));
      Jo & 30 || vh(c, o, u);
    }
    d.memoizedState = u;
    var h = { value: u, getSnapshot: o };
    return d.queue = h, vc(Sh.bind(null, c, h, r), [r]), c.flags |= 2048, ns(9, xh.bind(null, c, h, u, o), void 0, null), u;
  }, useId: function() {
    var r = rr(), o = He.identifierPrefix;
    if (Re) {
      var u = nr, c = tr;
      u = (c & ~(1 << 32 - xn(c) - 1)).toString(32) + u, o = ":" + o + "R" + u, u = ts++, 0 < u && (o += "H" + u.toString(32)), o += ":";
    } else u = Px++, o = ":" + o + "r" + u.toString(32) + ":";
    return r.memoizedState = o;
  }, unstable_isNewReconciler: !1 }, Mx = {
    readContext: tn,
    useCallback: Ch,
    useContext: tn,
    useEffect: rs,
    useImperativeHandle: Ph,
    useInsertionEffect: Eh,
    useLayoutEffect: kh,
    useMemo: Rh,
    useReducer: Il,
    useRef: _h,
    useState: function() {
      return Il(oo);
    },
    useDebugValue: xc,
    useDeferredValue: function(r) {
      var o = Il(oo), u = o[0], c = o[1];
      return rs(function() {
        var d = sn.transition;
        sn.transition = {};
        try {
          c(r);
        } finally {
          sn.transition = d;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = Il(oo)[0], o = Fn().memoizedState;
      return [r, o];
    },
    useMutableSource: gh,
    useSyncExternalStore: yh,
    useId: Ah,
    unstable_isNewReconciler: !1
  }, Nx = {
    readContext: tn,
    useCallback: Ch,
    useContext: tn,
    useEffect: rs,
    useImperativeHandle: Ph,
    useInsertionEffect: Eh,
    useLayoutEffect: kh,
    useMemo: Rh,
    useReducer: Ol,
    useRef: _h,
    useState: function() {
      return Ol(oo);
    },
    useDebugValue: xc,
    useDeferredValue: function(r) {
      var o = Ol(oo), u = o[0], c = o[1];
      return rs(function() {
        var d = sn.transition;
        sn.transition = {};
        try {
          c(r);
        } finally {
          sn.transition = d;
        }
      }, [r]), u;
    },
    useTransition: function() {
      var r = Ol(oo)[0], o = Fn().memoizedState;
      return [r, o];
    },
    useMutableSource: gh,
    useSyncExternalStore: yh,
    useId: Ah,
    unstable_isNewReconciler: !1
  };
  function Sc(r, o) {
    try {
      var u = "", c = o;
      do
        u += Tx(c), c = c.return;
      while (c);
      var d = u;
    } catch (h) {
      d = `
Error generating stack: ` + h.message + `
` + h.stack;
    }
    return { value: r, source: o, stack: d };
  }
  function wc(r, o) {
    try {
      console.error(o.value);
    } catch (u) {
      setTimeout(function() {
        throw u;
      });
    }
  }
  var jx = typeof WeakMap == "function" ? WeakMap : Map;
  function zh(r, o, u) {
    u = er(-1, u), u.tag = 3, u.payload = { element: null };
    var c = o.value;
    return u.callback = function() {
      tu || (tu = !0, Uc = c), wc(r, o);
    }, u;
  }
  function Ih(r, o, u) {
    u = er(-1, u), u.tag = 3;
    var c = r.type.getDerivedStateFromError;
    if (typeof c == "function") {
      var d = o.value;
      u.payload = function() {
        return c(d);
      }, u.callback = function() {
        wc(r, o);
      };
    }
    var h = r.stateNode;
    return h !== null && typeof h.componentDidCatch == "function" && (u.callback = function() {
      wc(r, o), typeof c != "function" && (_r === null ? _r = /* @__PURE__ */ new Set([this]) : _r.add(this));
      var k = o.stack;
      this.componentDidCatch(o.value, { componentStack: k !== null ? k : "" });
    }), u;
  }
  function Oh(r, o, u) {
    var c = r.pingCache;
    if (c === null) {
      c = r.pingCache = new jx();
      var d = /* @__PURE__ */ new Set();
      c.set(o, d);
    } else d = c.get(o), d === void 0 && (d = /* @__PURE__ */ new Set(), c.set(o, d));
    d.has(u) || (d.add(u), r = Xx.bind(null, r, o, u), o.then(r, r));
  }
  function Dh(r) {
    do {
      var o;
      if ((o = r.tag === 13) && (o = r.memoizedState, o = o !== null ? o.dehydrated !== null : !0), o) return r;
      r = r.return;
    } while (r !== null);
    return null;
  }
  function Fh(r, o, u, c, d) {
    return r.mode & 1 ? (r.flags |= 65536, r.lanes = d, r) : (r === o ? r.flags |= 65536 : (r.flags |= 128, u.flags |= 131072, u.flags &= -52805, u.tag === 1 && (u.alternate === null ? u.tag = 17 : (o = er(-1, 1), o.tag = 2, wr(u, o))), u.lanes |= 1), r);
  }
  function Un(r) {
    r.flags |= 4;
  }
  function Uh(r, o) {
    if (r !== null && r.child === o.child) return !0;
    if (o.flags & 16) return !1;
    for (r = o.child; r !== null; ) {
      if (r.flags & 12854 || r.subtreeFlags & 12854) return !1;
      r = r.sibling;
    }
    return !0;
  }
  var os, is, Hl, Bl;
  if (vn) os = function(r, o) {
    for (var u = o.child; u !== null; ) {
      if (u.tag === 5 || u.tag === 6) te(r, u.stateNode);
      else if (u.tag !== 4 && u.child !== null) {
        u.child.return = u, u = u.child;
        continue;
      }
      if (u === o) break;
      for (; u.sibling === null; ) {
        if (u.return === null || u.return === o) return;
        u = u.return;
      }
      u.sibling.return = u.return, u = u.sibling;
    }
  }, is = function() {
  }, Hl = function(r, o, u, c, d) {
    if (r = r.memoizedProps, r !== c) {
      var h = o.stateNode, k = Dn(on.current);
      u = ze(h, u, r, c, d, k), (o.updateQueue = u) && Un(o);
    }
  }, Bl = function(r, o, u, c) {
    u !== c && Un(o);
  };
  else if (ml) {
    os = function(r, o, u, c) {
      for (var d = o.child; d !== null; ) {
        if (d.tag === 5) {
          var h = d.stateNode;
          u && c && (h = Vp(h, d.type, d.memoizedProps, d)), te(r, h);
        } else if (d.tag === 6) h = d.stateNode, u && c && (h = Kp(h, d.memoizedProps, d)), te(r, h);
        else if (d.tag !== 4) {
          if (d.tag === 22 && d.memoizedState !== null) h = d.child, h !== null && (h.return = d), os(r, d, !0, !0);
          else if (d.child !== null) {
            d.child.return = d, d = d.child;
            continue;
          }
        }
        if (d === o) break;
        for (; d.sibling === null; ) {
          if (d.return === null || d.return === o) return;
          d = d.return;
        }
        d.sibling.return = d.return, d = d.sibling;
      }
    };
    var Hh = function(r, o, u, c) {
      for (var d = o.child; d !== null; ) {
        if (d.tag === 5) {
          var h = d.stateNode;
          u && c && (h = Vp(h, d.type, d.memoizedProps, d)), Gp(r, h);
        } else if (d.tag === 6) h = d.stateNode, u && c && (h = Kp(h, d.memoizedProps, d)), Gp(r, h);
        else if (d.tag !== 4) {
          if (d.tag === 22 && d.memoizedState !== null) h = d.child, h !== null && (h.return = d), Hh(r, d, !0, !0);
          else if (d.child !== null) {
            d.child.return = d, d = d.child;
            continue;
          }
        }
        if (d === o) break;
        for (; d.sibling === null; ) {
          if (d.return === null || d.return === o) return;
          d = d.return;
        }
        d.sibling.return = d.return, d = d.sibling;
      }
    };
    is = function(r, o) {
      var u = o.stateNode;
      if (!Uh(r, o)) {
        r = u.containerInfo;
        var c = Bp(r);
        Hh(c, o, !1, !1), u.pendingChildren = c, Un(o), Q1(r, c);
      }
    }, Hl = function(r, o, u, c, d) {
      var h = r.stateNode, k = r.memoizedProps;
      if ((r = Uh(r, o)) && k === c) o.stateNode = h;
      else {
        var P = o.stateNode, z = Dn(on.current), G = null;
        k !== c && (G = ze(P, u, k, c, d, z)), r && G === null ? o.stateNode = h : (h = K1(h, G, u, k, c, o, r, P), ce(h, u, c, d, z) && Un(o), o.stateNode = h, r ? Un(o) : os(h, o, !1, !1));
      }
    }, Bl = function(r, o, u, c) {
      u !== c ? (r = Dn(Yo.current), u = Dn(on.current), o.stateNode = Xe(c, r, u, o), Un(o)) : o.stateNode = r.stateNode;
    };
  } else is = function() {
  }, Hl = function() {
  }, Bl = function() {
  };
  function ss(r, o) {
    if (!Re) switch (r.tailMode) {
      case "hidden":
        o = r.tail;
        for (var u = null; o !== null; ) o.alternate !== null && (u = o), o = o.sibling;
        u === null ? r.tail = null : u.sibling = null;
        break;
      case "collapsed":
        u = r.tail;
        for (var c = null; u !== null; ) u.alternate !== null && (c = u), u = u.sibling;
        c === null ? o || r.tail === null ? r.tail = null : r.tail.sibling = null : c.sibling = null;
    }
  }
  function ut(r) {
    var o = r.alternate !== null && r.alternate.child === r.child, u = 0, c = 0;
    if (o) for (var d = r.child; d !== null; ) u |= d.lanes | d.childLanes, c |= d.subtreeFlags & 14680064, c |= d.flags & 14680064, d.return = r, d = d.sibling;
    else for (d = r.child; d !== null; ) u |= d.lanes | d.childLanes, c |= d.subtreeFlags, c |= d.flags, d.return = r, d = d.sibling;
    return r.subtreeFlags |= c, r.childLanes = u, o;
  }
  function zx(r, o, u) {
    var c = o.pendingProps;
    switch (sc(o), o.tag) {
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
        return ut(o), null;
      case 1:
        return Ct(o.type) && gl(), ut(o), null;
      case 3:
        return c = o.stateNode, Zo(), Te(Pt), Te(it), pc(), c.pendingContext && (c.context = c.pendingContext, c.pendingContext = null), (r === null || r.child === null) && (Ji(o) ? Un(o) : r === null || r.memoizedState.isDehydrated && !(o.flags & 256) || (o.flags |= 1024, wn !== null && (Gc(wn), wn = null))), is(r, o), ut(o), null;
      case 5:
        fc(o), u = Dn(Yo.current);
        var d = o.type;
        if (r !== null && o.stateNode != null) Hl(r, o, d, c, u), r.ref !== o.ref && (o.flags |= 512, o.flags |= 2097152);
        else {
          if (!c) {
            if (o.stateNode === null) throw Error(a(166));
            return ut(o), null;
          }
          if (r = Dn(on.current), Ji(o)) {
            if (!Gt) throw Error(a(175));
            r = ex(o.stateNode, o.type, o.memoizedProps, u, r, o, !Zi), o.updateQueue = r, r !== null && Un(o);
          } else {
            var h = Y(d, c, u, r, o);
            os(h, o, !1, !1), o.stateNode = h, ce(h, d, c, u, r) && Un(o);
          }
          o.ref !== null && (o.flags |= 512, o.flags |= 2097152);
        }
        return ut(o), null;
      case 6:
        if (r && o.stateNode != null) Bl(r, o, r.memoizedProps, c);
        else {
          if (typeof c != "string" && o.stateNode === null) throw Error(a(166));
          if (r = Dn(Yo.current), u = Dn(on.current), Ji(o)) {
            if (!Gt) throw Error(a(176));
            if (r = o.stateNode, c = o.memoizedProps, (u = tx(r, c, o, !Zi)) && (d = Wt, d !== null)) switch (h = (d.mode & 1) !== 0, d.tag) {
              case 3:
                ux(d.stateNode.containerInfo, r, c, h);
                break;
              case 5:
                ax(d.type, d.memoizedProps, d.stateNode, r, c, h);
            }
            u && Un(o);
          } else o.stateNode = Xe(c, r, u, o);
        }
        return ut(o), null;
      case 13:
        if (Te(Le), c = o.memoizedState, Re && Vt !== null && o.mode & 1 && !(o.flags & 128)) {
          for (r = Vt; r; ) r = Ki(r);
          return Qo(), o.flags |= 98560, o;
        }
        if (c !== null && c.dehydrated !== null) {
          if (c = Ji(o), r === null) {
            if (!c) throw Error(a(318));
            if (!Gt) throw Error(a(344));
            if (r = o.memoizedState, r = r !== null ? r.dehydrated : null, !r) throw Error(a(317));
            nx(r, o);
          } else Qo(), !(o.flags & 128) && (o.memoizedState = null), o.flags |= 4;
          return ut(o), null;
        }
        return wn !== null && (Gc(wn), wn = null), o.flags & 128 ? (o.lanes = u, o) : (c = c !== null, u = !1, r === null ? Ji(o) : u = r.memoizedState !== null, c && !u && (o.child.flags |= 8192, o.mode & 1 && (r === null || Le.current & 1 ? We === 0 && (We = 3) : Vc())), o.updateQueue !== null && (o.flags |= 4), ut(o), null);
      case 4:
        return Zo(), is(r, o), r === null && S1(o.stateNode.containerInfo), ut(o), null;
      case 10:
        return ec(o.type._context), ut(o), null;
      case 17:
        return Ct(o.type) && gl(), ut(o), null;
      case 19:
        if (Te(Le), d = o.memoizedState, d === null) return ut(o), null;
        if (c = (o.flags & 128) !== 0, h = d.rendering, h === null) if (c) ss(d, !1);
        else {
          if (We !== 0 || r !== null && r.flags & 128) for (r = o.child; r !== null; ) {
            if (h = Nl(r), h !== null) {
              for (o.flags |= 128, ss(d, !1), r = h.updateQueue, r !== null && (o.updateQueue = r, o.flags |= 4), o.subtreeFlags = 0, r = u, c = o.child; c !== null; ) u = c, d = r, u.flags &= 14680066, h = u.alternate, h === null ? (u.childLanes = 0, u.lanes = d, u.child = null, u.subtreeFlags = 0, u.memoizedProps = null, u.memoizedState = null, u.updateQueue = null, u.dependencies = null, u.stateNode = null) : (u.childLanes = h.childLanes, u.lanes = h.lanes, u.child = h.child, u.subtreeFlags = 0, u.deletions = null, u.memoizedProps = h.memoizedProps, u.memoizedState = h.memoizedState, u.updateQueue = h.updateQueue, u.type = h.type, d = h.dependencies, u.dependencies = d === null ? null : { lanes: d.lanes, firstContext: d.firstContext }), c = c.sibling;
              return Se(Le, Le.current & 1 | 2), o.child;
            }
            r = r.sibling;
          }
          d.tail !== null && Ye() > Fc && (o.flags |= 128, c = !0, ss(d, !1), o.lanes = 4194304);
        }
        else {
          if (!c) if (r = Nl(h), r !== null) {
            if (o.flags |= 128, c = !0, r = r.updateQueue, r !== null && (o.updateQueue = r, o.flags |= 4), ss(d, !0), d.tail === null && d.tailMode === "hidden" && !h.alternate && !Re) return ut(o), null;
          } else 2 * Ye() - d.renderingStartTime > Fc && u !== 1073741824 && (o.flags |= 128, c = !0, ss(d, !1), o.lanes = 4194304);
          d.isBackwards ? (h.sibling = o.child, o.child = h) : (r = d.last, r !== null ? r.sibling = h : o.child = h, d.last = h);
        }
        return d.tail !== null ? (o = d.tail, d.rendering = o, d.tail = o.sibling, d.renderingStartTime = Ye(), o.sibling = null, r = Le.current, Se(Le, c ? r & 1 | 2 : r & 1), o) : (ut(o), null);
      case 22:
      case 23:
        return Wc(), c = o.memoizedState !== null, r !== null && r.memoizedState !== null !== c && (o.flags |= 8192), c && o.mode & 1 ? Qt & 1073741824 && (ut(o), vn && o.subtreeFlags & 6 && (o.flags |= 8192)) : ut(o), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(a(156, o.tag));
  }
  var Ix = f.ReactCurrentOwner, Kt = !1;
  function yt(r, o, u, c) {
    o.child = r === null ? hh(o, null, u, c) : Xo(o, r.child, u, c);
  }
  function Bh(r, o, u, c, d) {
    u = u.render;
    var h = o.ref;
    return Wo(o, d), c = mc(r, o, u, c, h, d), u = gc(), r !== null && !Kt ? (o.updateQueue = r.updateQueue, o.flags &= -2053, r.lanes &= ~d, or(r, o, d)) : (Re && u && ic(o), o.flags |= 1, yt(r, o, c, d), o.child);
  }
  function Gh(r, o, u, c, d) {
    if (r === null) {
      var h = u.type;
      return typeof h == "function" && !Kc(h) && h.defaultProps === void 0 && u.compare === null && u.defaultProps === void 0 ? (o.tag = 15, o.type = h, Wh(r, o, h, c, d)) : (r = uu(u.type, null, c, o, o.mode, d), r.ref = o.ref, r.return = o, o.child = r);
    }
    if (h = r.child, !(r.lanes & d)) {
      var k = h.memoizedProps;
      if (u = u.compare, u = u !== null ? u : El, u(k, c) && r.ref === o.ref) return or(r, o, d);
    }
    return o.flags |= 1, r = Pr(h, c), r.ref = o.ref, r.return = o, o.child = r;
  }
  function Wh(r, o, u, c, d) {
    if (r !== null && El(r.memoizedProps, c) && r.ref === o.ref) if (Kt = !1, (r.lanes & d) !== 0) r.flags & 131072 && (Kt = !0);
    else return o.lanes = r.lanes, or(r, o, d);
    return _c(r, o, u, c, d);
  }
  function Vh(r, o, u) {
    var c = o.pendingProps, d = c.children, h = r !== null ? r.memoizedState : null;
    if (c.mode === "hidden") if (!(o.mode & 1)) o.memoizedState = { baseLanes: 0, cachePool: null }, Se(qo, Qt), Qt |= u;
    else if (u & 1073741824) o.memoizedState = { baseLanes: 0, cachePool: null }, c = h !== null ? h.baseLanes : u, Se(qo, Qt), Qt |= c;
    else return r = h !== null ? h.baseLanes | u : u, o.lanes = o.childLanes = 1073741824, o.memoizedState = { baseLanes: r, cachePool: null }, o.updateQueue = null, Se(qo, Qt), Qt |= r, null;
    else h !== null ? (c = h.baseLanes | u, o.memoizedState = null) : c = u, Se(qo, Qt), Qt |= c;
    return yt(r, o, d, u), o.child;
  }
  function Kh(r, o) {
    var u = o.ref;
    (r === null && u !== null || r !== null && r.ref !== u) && (o.flags |= 512, o.flags |= 2097152);
  }
  function _c(r, o, u, c, d) {
    var h = Ct(u) ? to : it.current;
    return h = Bo(o, h), Wo(o, d), u = mc(r, o, u, c, h, d), c = gc(), r !== null && !Kt ? (o.updateQueue = r.updateQueue, o.flags &= -2053, r.lanes &= ~d, or(r, o, d)) : (Re && c && ic(o), o.flags |= 1, yt(r, o, u, d), o.child);
  }
  function Qh(r, o, u, c, d) {
    if (Ct(u)) {
      var h = !0;
      yl(o);
    } else h = !1;
    if (Wo(o, d), o.stateNode === null) r !== null && (r.alternate = null, o.alternate = null, o.flags |= 2), sh(o, u, c), oc(o, u, c, d), c = !0;
    else if (r === null) {
      var k = o.stateNode, P = o.memoizedProps;
      k.props = P;
      var z = k.context, G = u.contextType;
      typeof G == "object" && G !== null ? G = tn(G) : (G = Ct(u) ? to : it.current, G = Bo(o, G));
      var J = u.getDerivedStateFromProps, ne = typeof J == "function" || typeof k.getSnapshotBeforeUpdate == "function";
      ne || typeof k.UNSAFE_componentWillReceiveProps != "function" && typeof k.componentWillReceiveProps != "function" || (P !== c || z !== G) && lh(o, k, c, G), Sr = !1;
      var ee = o.memoizedState;
      k.state = ee, Cl(o, c, k, d), z = o.memoizedState, P !== c || ee !== z || Pt.current || Sr ? (typeof J == "function" && (rc(o, u, J, c), z = o.memoizedState), (P = Sr || ih(o, u, P, c, ee, z, G)) ? (ne || typeof k.UNSAFE_componentWillMount != "function" && typeof k.componentWillMount != "function" || (typeof k.componentWillMount == "function" && k.componentWillMount(), typeof k.UNSAFE_componentWillMount == "function" && k.UNSAFE_componentWillMount()), typeof k.componentDidMount == "function" && (o.flags |= 4194308)) : (typeof k.componentDidMount == "function" && (o.flags |= 4194308), o.memoizedProps = c, o.memoizedState = z), k.props = c, k.state = z, k.context = G, c = P) : (typeof k.componentDidMount == "function" && (o.flags |= 4194308), c = !1);
    } else {
      k = o.stateNode, th(r, o), P = o.memoizedProps, G = o.type === o.elementType ? P : Sn(o.type, P), k.props = G, ne = o.pendingProps, ee = k.context, z = u.contextType, typeof z == "object" && z !== null ? z = tn(z) : (z = Ct(u) ? to : it.current, z = Bo(o, z));
      var ve = u.getDerivedStateFromProps;
      (J = typeof ve == "function" || typeof k.getSnapshotBeforeUpdate == "function") || typeof k.UNSAFE_componentWillReceiveProps != "function" && typeof k.componentWillReceiveProps != "function" || (P !== ne || ee !== z) && lh(o, k, c, z), Sr = !1, ee = o.memoizedState, k.state = ee, Cl(o, c, k, d);
      var b = o.memoizedState;
      P !== ne || ee !== b || Pt.current || Sr ? (typeof ve == "function" && (rc(o, u, ve, c), b = o.memoizedState), (G = Sr || ih(o, u, G, c, ee, b, z) || !1) ? (J || typeof k.UNSAFE_componentWillUpdate != "function" && typeof k.componentWillUpdate != "function" || (typeof k.componentWillUpdate == "function" && k.componentWillUpdate(
        c,
        b,
        z
      ), typeof k.UNSAFE_componentWillUpdate == "function" && k.UNSAFE_componentWillUpdate(c, b, z)), typeof k.componentDidUpdate == "function" && (o.flags |= 4), typeof k.getSnapshotBeforeUpdate == "function" && (o.flags |= 1024)) : (typeof k.componentDidUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (o.flags |= 4), typeof k.getSnapshotBeforeUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (o.flags |= 1024), o.memoizedProps = c, o.memoizedState = b), k.props = c, k.state = b, k.context = z, c = G) : (typeof k.componentDidUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (o.flags |= 4), typeof k.getSnapshotBeforeUpdate != "function" || P === r.memoizedProps && ee === r.memoizedState || (o.flags |= 1024), c = !1);
    }
    return Ec(r, o, u, c, h, d);
  }
  function Ec(r, o, u, c, d, h) {
    Kh(r, o);
    var k = (o.flags & 128) !== 0;
    if (!c && !k) return d && Jp(o, u, !1), or(r, o, h);
    c = o.stateNode, Ix.current = o;
    var P = k && typeof u.getDerivedStateFromError != "function" ? null : c.render();
    return o.flags |= 1, r !== null && k ? (o.child = Xo(o, r.child, null, h), o.child = Xo(o, null, P, h)) : yt(r, o, P, h), o.memoizedState = c.state, d && Jp(o, u, !0), o.child;
  }
  function Xh(r) {
    var o = r.stateNode;
    o.pendingContext ? Yp(r, o.pendingContext, o.pendingContext !== o.context) : o.context && Yp(r, o.context, !1), cc(r, o.containerInfo);
  }
  function Yh(r, o, u, c, d) {
    return Qo(), ac(d), o.flags |= 256, yt(r, o, u, c), o.child;
  }
  var Gl = { dehydrated: null, treeContext: null, retryLane: 0 };
  function Wl(r) {
    return { baseLanes: r, cachePool: null };
  }
  function Zh(r, o, u) {
    var c = o.pendingProps, d = Le.current, h = !1, k = (o.flags & 128) !== 0, P;
    if ((P = k) || (P = r !== null && r.memoizedState === null ? !1 : (d & 2) !== 0), P ? (h = !0, o.flags &= -129) : (r === null || r.memoizedState !== null) && (d |= 1), Se(Le, d & 1), r === null)
      return uc(o), r = o.memoizedState, r !== null && (r = r.dehydrated, r !== null) ? (o.mode & 1 ? Ha(r) ? o.lanes = 8 : o.lanes = 1073741824 : o.lanes = 1, null) : (d = c.children, r = c.fallback, h ? (c = o.mode, h = o.child, d = { mode: "hidden", children: d }, !(c & 1) && h !== null ? (h.childLanes = 0, h.pendingProps = d) : h = au(d, c, 0, null), r = co(r, c, u, null), h.return = o, r.return = o, h.sibling = r, o.child = h, o.child.memoizedState = Wl(u), o.memoizedState = Gl, r) : kc(o, d));
    if (d = r.memoizedState, d !== null) {
      if (P = d.dehydrated, P !== null) {
        if (k)
          return o.flags & 256 ? (o.flags &= -257, Vl(r, o, u, Error(a(422)))) : o.memoizedState !== null ? (o.child = r.child, o.flags |= 128, null) : (h = c.fallback, d = o.mode, c = au({ mode: "visible", children: c.children }, d, 0, null), h = co(h, d, u, null), h.flags |= 2, c.return = o, h.return = o, c.sibling = h, o.child = c, o.mode & 1 && Xo(
            o,
            r.child,
            null,
            u
          ), o.child.memoizedState = Wl(u), o.memoizedState = Gl, h);
        if (!(o.mode & 1)) o = Vl(r, o, u, null);
        else if (Ha(P)) o = Vl(r, o, u, Error(a(419)));
        else if (c = (u & r.childLanes) !== 0, Kt || c) {
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
            c = h & (c.suspendedLanes | u) ? 0 : h, c !== 0 && c !== d.retryLane && (d.retryLane = c, ln(r, c, -1));
          }
          Vc(), o = Vl(r, o, u, Error(a(421)));
        } else Qp(P) ? (o.flags |= 128, o.child = r.child, o = Yx.bind(null, r), J1(P, o), o = null) : (u = d.treeContext, Gt && (Vt = b1(P), Wt = o, Re = !0, wn = null, Zi = !1, u !== null && (nn[rn++] = tr, nn[rn++] = nr, nn[rn++] = no, tr = u.id, nr = u.overflow, no = o)), o = kc(o, o.pendingProps.children), o.flags |= 4096);
        return o;
      }
      return h ? (c = qh(r, o, c.children, c.fallback, u), h = o.child, d = r.child.memoizedState, h.memoizedState = d === null ? Wl(u) : { baseLanes: d.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, o.memoizedState = Gl, c) : (u = Jh(r, o, c.children, u), o.memoizedState = null, u);
    }
    return h ? (c = qh(r, o, c.children, c.fallback, u), h = o.child, d = r.child.memoizedState, h.memoizedState = d === null ? Wl(u) : { baseLanes: d.baseLanes | u, cachePool: null }, h.childLanes = r.childLanes & ~u, o.memoizedState = Gl, c) : (u = Jh(r, o, c.children, u), o.memoizedState = null, u);
  }
  function kc(r, o) {
    return o = au({ mode: "visible", children: o }, r.mode, 0, null), o.return = r, r.child = o;
  }
  function Jh(r, o, u, c) {
    var d = r.child;
    return r = d.sibling, u = Pr(d, { mode: "visible", children: u }), !(o.mode & 1) && (u.lanes = c), u.return = o, u.sibling = null, r !== null && (c = o.deletions, c === null ? (o.deletions = [r], o.flags |= 16) : c.push(r)), o.child = u;
  }
  function qh(r, o, u, c, d) {
    var h = o.mode;
    r = r.child;
    var k = r.sibling, P = { mode: "hidden", children: u };
    return !(h & 1) && o.child !== r ? (u = o.child, u.childLanes = 0, u.pendingProps = P, o.deletions = null) : (u = Pr(r, P), u.subtreeFlags = r.subtreeFlags & 14680064), k !== null ? c = Pr(k, c) : (c = co(c, h, d, null), c.flags |= 2), c.return = o, u.return = o, u.sibling = c, o.child = u, c;
  }
  function Vl(r, o, u, c) {
    return c !== null && ac(c), Xo(o, r.child, null, u), r = kc(o, o.pendingProps.children), r.flags |= 2, o.memoizedState = null, r;
  }
  function $h(r, o, u) {
    r.lanes |= o;
    var c = r.alternate;
    c !== null && (c.lanes |= o), tc(r.return, o, u);
  }
  function Tc(r, o, u, c, d) {
    var h = r.memoizedState;
    h === null ? r.memoizedState = { isBackwards: o, rendering: null, renderingStartTime: 0, last: c, tail: u, tailMode: d } : (h.isBackwards = o, h.rendering = null, h.renderingStartTime = 0, h.last = c, h.tail = u, h.tailMode = d);
  }
  function bh(r, o, u) {
    var c = o.pendingProps, d = c.revealOrder, h = c.tail;
    if (yt(r, o, c.children, u), c = Le.current, c & 2) c = c & 1 | 2, o.flags |= 128;
    else {
      if (r !== null && r.flags & 128) e: for (r = o.child; r !== null; ) {
        if (r.tag === 13) r.memoizedState !== null && $h(r, u, o);
        else if (r.tag === 19) $h(r, u, o);
        else if (r.child !== null) {
          r.child.return = r, r = r.child;
          continue;
        }
        if (r === o) break e;
        for (; r.sibling === null; ) {
          if (r.return === null || r.return === o) break e;
          r = r.return;
        }
        r.sibling.return = r.return, r = r.sibling;
      }
      c &= 1;
    }
    if (Se(Le, c), !(o.mode & 1)) o.memoizedState = null;
    else switch (d) {
      case "forwards":
        for (u = o.child, d = null; u !== null; ) r = u.alternate, r !== null && Nl(r) === null && (d = u), u = u.sibling;
        u = d, u === null ? (d = o.child, o.child = null) : (d = u.sibling, u.sibling = null), Tc(o, !1, d, u, h);
        break;
      case "backwards":
        for (u = null, d = o.child, o.child = null; d !== null; ) {
          if (r = d.alternate, r !== null && Nl(r) === null) {
            o.child = d;
            break;
          }
          r = d.sibling, d.sibling = u, u = d, d = r;
        }
        Tc(o, !0, u, null, h);
        break;
      case "together":
        Tc(o, !1, null, null, void 0);
        break;
      default:
        o.memoizedState = null;
    }
    return o.child;
  }
  function or(r, o, u) {
    if (r !== null && (o.dependencies = r.dependencies), $o |= o.lanes, !(u & o.childLanes)) return null;
    if (r !== null && o.child !== r.child) throw Error(a(153));
    if (o.child !== null) {
      for (r = o.child, u = Pr(r, r.pendingProps), o.child = u, u.return = o; r.sibling !== null; ) r = r.sibling, u = u.sibling = Pr(r, r.pendingProps), u.return = o;
      u.sibling = null;
    }
    return o.child;
  }
  function Ox(r, o, u) {
    switch (o.tag) {
      case 3:
        Xh(o), Qo();
        break;
      case 5:
        mh(o);
        break;
      case 1:
        Ct(o.type) && yl(o);
        break;
      case 4:
        cc(o, o.stateNode.containerInfo);
        break;
      case 10:
        eh(o, o.type._context, o.memoizedProps.value);
        break;
      case 13:
        var c = o.memoizedState;
        if (c !== null)
          return c.dehydrated !== null ? (Se(Le, Le.current & 1), o.flags |= 128, null) : u & o.child.childLanes ? Zh(r, o, u) : (Se(Le, Le.current & 1), r = or(r, o, u), r !== null ? r.sibling : null);
        Se(Le, Le.current & 1);
        break;
      case 19:
        if (c = (u & o.childLanes) !== 0, r.flags & 128) {
          if (c) return bh(
            r,
            o,
            u
          );
          o.flags |= 128;
        }
        var d = o.memoizedState;
        if (d !== null && (d.rendering = null, d.tail = null, d.lastEffect = null), Se(Le, Le.current), c) break;
        return null;
      case 22:
      case 23:
        return o.lanes = 0, Vh(r, o, u);
    }
    return or(r, o, u);
  }
  function Dx(r, o) {
    switch (sc(o), o.tag) {
      case 1:
        return Ct(o.type) && gl(), r = o.flags, r & 65536 ? (o.flags = r & -65537 | 128, o) : null;
      case 3:
        return Zo(), Te(Pt), Te(it), pc(), r = o.flags, r & 65536 && !(r & 128) ? (o.flags = r & -65537 | 128, o) : null;
      case 5:
        return fc(o), null;
      case 13:
        if (Te(Le), r = o.memoizedState, r !== null && r.dehydrated !== null) {
          if (o.alternate === null) throw Error(a(340));
          Qo();
        }
        return r = o.flags, r & 65536 ? (o.flags = r & -65537 | 128, o) : null;
      case 19:
        return Te(Le), null;
      case 4:
        return Zo(), null;
      case 10:
        return ec(o.type._context), null;
      case 22:
      case 23:
        return Wc(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Kl = !1, io = !1, Fx = typeof WeakSet == "function" ? WeakSet : Set, K = null;
  function Ql(r, o) {
    var u = r.ref;
    if (u !== null) if (typeof u == "function") try {
      u(null);
    } catch (c) {
      Lt(r, o, c);
    }
    else u.current = null;
  }
  function Pc(r, o, u) {
    try {
      u();
    } catch (c) {
      Lt(r, o, c);
    }
  }
  var em = !1;
  function Ux(r, o) {
    for (U(r.containerInfo), K = o; K !== null; ) if (r = K, o = r.child, (r.subtreeFlags & 1028) !== 0 && o !== null) o.return = r, K = o;
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
              var c = u.memoizedProps, d = u.memoizedState, h = r.stateNode, k = h.getSnapshotBeforeUpdate(r.elementType === r.type ? c : Sn(r.type, c), d);
              h.__reactInternalSnapshotBeforeUpdate = k;
            }
            break;
          case 3:
            vn && V1(r.stateNode.containerInfo);
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
      if (o = r.sibling, o !== null) {
        o.return = r.return, K = o;
        break;
      }
      K = r.return;
    }
    return u = em, em = !1, u;
  }
  function so(r, o, u) {
    var c = o.updateQueue;
    if (c = c !== null ? c.lastEffect : null, c !== null) {
      var d = c = c.next;
      do {
        if ((d.tag & r) === r) {
          var h = d.destroy;
          d.destroy = void 0, h !== void 0 && Pc(o, u, h);
        }
        d = d.next;
      } while (d !== c);
    }
  }
  function ls(r, o) {
    if (o = o.updateQueue, o = o !== null ? o.lastEffect : null, o !== null) {
      var u = o = o.next;
      do {
        if ((u.tag & r) === r) {
          var c = u.create;
          u.destroy = c();
        }
        u = u.next;
      } while (u !== o);
    }
  }
  function Cc(r) {
    var o = r.ref;
    if (o !== null) {
      var u = r.stateNode;
      switch (r.tag) {
        case 5:
          r = be(u);
          break;
        default:
          r = u;
      }
      typeof o == "function" ? o(r) : o.current = r;
    }
  }
  function tm(r, o, u) {
    if (jn && typeof jn.onCommitFiberUnmount == "function") try {
      jn.onCommitFiberUnmount(wl, o);
    } catch {
    }
    switch (o.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        if (r = o.updateQueue, r !== null && (r = r.lastEffect, r !== null)) {
          var c = r = r.next;
          do {
            var d = c, h = d.destroy;
            d = d.tag, h !== void 0 && (d & 2 || d & 4) && Pc(o, u, h), c = c.next;
          } while (c !== r);
        }
        break;
      case 1:
        if (Ql(o, u), r = o.stateNode, typeof r.componentWillUnmount == "function") try {
          r.props = o.memoizedProps, r.state = o.memoizedState, r.componentWillUnmount();
        } catch (k) {
          Lt(
            o,
            u,
            k
          );
        }
        break;
      case 5:
        Ql(o, u);
        break;
      case 4:
        vn ? lm(r, o, u) : ml && ml && (o = o.stateNode.containerInfo, u = Bp(o), Wp(o, u));
    }
  }
  function nm(r, o, u) {
    for (var c = o; ; ) if (tm(r, c, u), c.child === null || vn && c.tag === 4) {
      if (c === o) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === o) return;
        c = c.return;
      }
      c.sibling.return = c.return, c = c.sibling;
    } else c.child.return = c, c = c.child;
  }
  function rm(r) {
    var o = r.alternate;
    o !== null && (r.alternate = null, rm(o)), r.child = null, r.deletions = null, r.sibling = null, r.tag === 5 && (o = r.stateNode, o !== null && _1(o)), r.stateNode = null, r.return = null, r.dependencies = null, r.memoizedProps = null, r.memoizedState = null, r.pendingProps = null, r.stateNode = null, r.updateQueue = null;
  }
  function om(r) {
    return r.tag === 5 || r.tag === 3 || r.tag === 4;
  }
  function im(r) {
    e: for (; ; ) {
      for (; r.sibling === null; ) {
        if (r.return === null || om(r.return)) return null;
        r = r.return;
      }
      for (r.sibling.return = r.return, r = r.sibling; r.tag !== 5 && r.tag !== 6 && r.tag !== 18; ) {
        if (r.flags & 2 || r.child === null || r.tag === 4) continue e;
        r.child.return = r, r = r.child;
      }
      if (!(r.flags & 2)) return r.stateNode;
    }
  }
  function sm(r) {
    if (vn) {
      e: {
        for (var o = r.return; o !== null; ) {
          if (om(o)) break e;
          o = o.return;
        }
        throw Error(a(160));
      }
      var u = o;
      switch (u.tag) {
        case 5:
          o = u.stateNode, u.flags & 32 && (Hp(o), u.flags &= -33), u = im(r), Ac(r, u, o);
          break;
        case 3:
        case 4:
          o = u.stateNode.containerInfo, u = im(r), Rc(r, u, o);
          break;
        default:
          throw Error(a(161));
      }
    }
  }
  function Rc(r, o, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, o ? D1(u, r, o) : N1(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (Rc(r, o, u), r = r.sibling; r !== null; ) Rc(r, o, u), r = r.sibling;
  }
  function Ac(r, o, u) {
    var c = r.tag;
    if (c === 5 || c === 6) r = r.stateNode, o ? O1(u, r, o) : M1(u, r);
    else if (c !== 4 && (r = r.child, r !== null)) for (Ac(r, o, u), r = r.sibling; r !== null; ) Ac(r, o, u), r = r.sibling;
  }
  function lm(r, o, u) {
    for (var c = o, d = !1, h, k; ; ) {
      if (!d) {
        d = c.return;
        e: for (; ; ) {
          if (d === null) throw Error(a(160));
          switch (h = d.stateNode, d.tag) {
            case 5:
              k = !1;
              break e;
            case 3:
              h = h.containerInfo, k = !0;
              break e;
            case 4:
              h = h.containerInfo, k = !0;
              break e;
          }
          d = d.return;
        }
        d = !0;
      }
      if (c.tag === 5 || c.tag === 6) nm(r, c, u), k ? U1(h, c.stateNode) : F1(h, c.stateNode);
      else if (c.tag === 18) k ? sx(h, c.stateNode) : ix(h, c.stateNode);
      else if (c.tag === 4) {
        if (c.child !== null) {
          h = c.stateNode.containerInfo, k = !0, c.child.return = c, c = c.child;
          continue;
        }
      } else if (tm(r, c, u), c.child !== null) {
        c.child.return = c, c = c.child;
        continue;
      }
      if (c === o) break;
      for (; c.sibling === null; ) {
        if (c.return === null || c.return === o) return;
        c = c.return, c.tag === 4 && (d = !1);
      }
      c.sibling.return = c.return, c = c.sibling;
    }
  }
  function Lc(r, o) {
    if (vn) {
      switch (o.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          so(3, o, o.return), ls(3, o), so(5, o, o.return);
          return;
        case 1:
          return;
        case 5:
          var u = o.stateNode;
          if (u != null) {
            var c = o.memoizedProps;
            r = r !== null ? r.memoizedProps : c;
            var d = o.type, h = o.updateQueue;
            o.updateQueue = null, h !== null && I1(u, h, d, r, c, o);
          }
          return;
        case 6:
          if (o.stateNode === null) throw Error(a(162));
          u = o.memoizedProps, j1(o.stateNode, r !== null ? r.memoizedProps : u, u);
          return;
        case 3:
          Gt && r !== null && r.memoizedState.isDehydrated && Xp(o.stateNode.containerInfo);
          return;
        case 12:
          return;
        case 13:
          Xl(o);
          return;
        case 19:
          Xl(o);
          return;
        case 17:
          return;
      }
      throw Error(a(163));
    }
    switch (o.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        so(3, o, o.return), ls(3, o), so(5, o, o.return);
        return;
      case 12:
        return;
      case 13:
        Xl(o);
        return;
      case 19:
        Xl(o);
        return;
      case 3:
        Gt && r !== null && r.memoizedState.isDehydrated && Xp(o.stateNode.containerInfo);
        break;
      case 22:
      case 23:
        return;
    }
    e: if (ml) {
      switch (o.tag) {
        case 1:
        case 5:
        case 6:
          break e;
        case 3:
        case 4:
          o = o.stateNode, Wp(o.containerInfo, o.pendingChildren);
          break e;
      }
      throw Error(a(163));
    }
  }
  function Xl(r) {
    var o = r.updateQueue;
    if (o !== null) {
      r.updateQueue = null;
      var u = r.stateNode;
      u === null && (u = r.stateNode = new Fx()), o.forEach(function(c) {
        var d = Zx.bind(null, r, c);
        u.has(c) || (u.add(c), c.then(d, d));
      });
    }
  }
  function Hx(r, o) {
    for (K = o; K !== null; ) {
      o = K;
      var u = o.deletions;
      if (u !== null) for (var c = 0; c < u.length; c++) {
        var d = u[c];
        try {
          var h = r;
          vn ? lm(h, d, o) : nm(h, d, o);
          var k = d.alternate;
          k !== null && (k.return = null), d.return = null;
        } catch ($) {
          Lt(d, o, $);
        }
      }
      if (u = o.child, o.subtreeFlags & 12854 && u !== null) u.return = o, K = u;
      else for (; K !== null; ) {
        o = K;
        try {
          var P = o.flags;
          if (P & 32 && vn && Hp(o.stateNode), P & 512) {
            var z = o.alternate;
            if (z !== null) {
              var G = z.ref;
              G !== null && (typeof G == "function" ? G(null) : G.current = null);
            }
          }
          if (P & 8192) switch (o.tag) {
            case 13:
              if (o.memoizedState !== null) {
                var J = o.alternate;
                (J === null || J.memoizedState === null) && (Dc = Ye());
              }
              break;
            case 22:
              var ne = o.memoizedState !== null, ee = o.alternate, ve = ee !== null && ee.memoizedState !== null;
              if (u = o, vn) {
                e: if (c = u, d = ne, h = null, vn) for (var b = c; ; ) {
                  if (b.tag === 5) {
                    if (h === null) {
                      h = b;
                      var at = b.stateNode;
                      d ? H1(at) : G1(b.stateNode, b.memoizedProps);
                    }
                  } else if (b.tag === 6) {
                    if (h === null) {
                      var an = b.stateNode;
                      d ? B1(an) : W1(an, b.memoizedProps);
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
                        so(4, c, c.return);
                        break;
                      case 1:
                        Ql(c, c.return);
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
                        Ql(c, c.return);
                        break;
                      case 22:
                        if (c.memoizedState !== null) {
                          cm(u);
                          continue;
                        }
                    }
                    C !== null ? (C.return = c, K = C) : cm(u);
                  }
                  M = M.sibling;
                }
              }
          }
          switch (P & 4102) {
            case 2:
              sm(o), o.flags &= -3;
              break;
            case 6:
              sm(o), o.flags &= -3, Lc(o.alternate, o);
              break;
            case 4096:
              o.flags &= -4097;
              break;
            case 4100:
              o.flags &= -4097, Lc(o.alternate, o);
              break;
            case 4:
              Lc(o.alternate, o);
          }
        } catch ($) {
          Lt(o, o.return, $);
        }
        if (u = o.sibling, u !== null) {
          u.return = o.return, K = u;
          break;
        }
        K = o.return;
      }
    }
  }
  function Bx(r, o, u) {
    K = r, um(r);
  }
  function um(r, o, u) {
    for (var c = (r.mode & 1) !== 0; K !== null; ) {
      var d = K, h = d.child;
      if (d.tag === 22 && c) {
        var k = d.memoizedState !== null || Kl;
        if (!k) {
          var P = d.alternate, z = P !== null && P.memoizedState !== null || io;
          P = Kl;
          var G = io;
          if (Kl = k, (io = z) && !G) for (K = d; K !== null; ) k = K, z = k.child, k.tag === 22 && k.memoizedState !== null ? fm(d) : z !== null ? (z.return = k, K = z) : fm(d);
          for (; h !== null; ) K = h, um(h), h = h.sibling;
          K = d, Kl = P, io = G;
        }
        am(r);
      } else d.subtreeFlags & 8772 && h !== null ? (h.return = d, K = h) : am(r);
    }
  }
  function am(r) {
    for (; K !== null; ) {
      var o = K;
      if (o.flags & 8772) {
        var u = o.alternate;
        try {
          if (o.flags & 8772) switch (o.tag) {
            case 0:
            case 11:
            case 15:
              io || ls(5, o);
              break;
            case 1:
              var c = o.stateNode;
              if (o.flags & 4 && !io) if (u === null) c.componentDidMount();
              else {
                var d = o.elementType === o.type ? u.memoizedProps : Sn(o.type, u.memoizedProps);
                c.componentDidUpdate(d, u.memoizedState, c.__reactInternalSnapshotBeforeUpdate);
              }
              var h = o.updateQueue;
              h !== null && rh(o, h, c);
              break;
            case 3:
              var k = o.updateQueue;
              if (k !== null) {
                if (u = null, o.child !== null) switch (o.child.tag) {
                  case 5:
                    u = be(o.child.stateNode);
                    break;
                  case 1:
                    u = o.child.stateNode;
                }
                rh(o, k, u);
              }
              break;
            case 5:
              var P = o.stateNode;
              u === null && o.flags & 4 && z1(P, o.type, o.memoizedProps, o);
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (Gt && o.memoizedState === null) {
                var z = o.alternate;
                if (z !== null) {
                  var G = z.memoizedState;
                  if (G !== null) {
                    var J = G.dehydrated;
                    J !== null && ox(J);
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
          io || o.flags & 512 && Cc(o);
        } catch (ne) {
          Lt(o, o.return, ne);
        }
      }
      if (o === r) {
        K = null;
        break;
      }
      if (u = o.sibling, u !== null) {
        u.return = o.return, K = u;
        break;
      }
      K = o.return;
    }
  }
  function cm(r) {
    for (; K !== null; ) {
      var o = K;
      if (o === r) {
        K = null;
        break;
      }
      var u = o.sibling;
      if (u !== null) {
        u.return = o.return, K = u;
        break;
      }
      K = o.return;
    }
  }
  function fm(r) {
    for (; K !== null; ) {
      var o = K;
      try {
        switch (o.tag) {
          case 0:
          case 11:
          case 15:
            var u = o.return;
            try {
              ls(4, o);
            } catch (z) {
              Lt(o, u, z);
            }
            break;
          case 1:
            var c = o.stateNode;
            if (typeof c.componentDidMount == "function") {
              var d = o.return;
              try {
                c.componentDidMount();
              } catch (z) {
                Lt(o, d, z);
              }
            }
            var h = o.return;
            try {
              Cc(o);
            } catch (z) {
              Lt(o, h, z);
            }
            break;
          case 5:
            var k = o.return;
            try {
              Cc(o);
            } catch (z) {
              Lt(o, k, z);
            }
        }
      } catch (z) {
        Lt(o, o.return, z);
      }
      if (o === r) {
        K = null;
        break;
      }
      var P = o.sibling;
      if (P !== null) {
        P.return = o.return, K = P;
        break;
      }
      K = o.return;
    }
  }
  var Yl = 0, Zl = 1, Jl = 2, ql = 3, $l = 4;
  if (typeof Symbol == "function" && Symbol.for) {
    var us = Symbol.for;
    Yl = us("selector.component"), Zl = us("selector.has_pseudo_class"), Jl = us("selector.role"), ql = us("selector.test_id"), $l = us("selector.text");
  }
  function Mc(r) {
    var o = x1(r);
    if (o != null) {
      if (typeof o.memoizedProps["data-testname"] != "string") throw Error(a(364));
      return o;
    }
    if (r = T1(r), r === null) throw Error(a(362));
    return r.stateNode.current;
  }
  function Nc(r, o) {
    switch (o.$$typeof) {
      case Yl:
        if (r.type === o.value) return !0;
        break;
      case Zl:
        e: {
          o = o.value, r = [r, 0];
          for (var u = 0; u < r.length; ) {
            var c = r[u++], d = r[u++], h = o[d];
            if (c.tag !== 5 || !Vi(c)) {
              for (; h != null && Nc(c, h); ) d++, h = o[d];
              if (d === o.length) {
                o = !0;
                break e;
              } else for (c = c.child; c !== null; ) r.push(c, d), c = c.sibling;
            }
          }
          o = !1;
        }
        return o;
      case Jl:
        if (r.tag === 5 && R1(r.stateNode, o.value)) return !0;
        break;
      case $l:
        if ((r.tag === 5 || r.tag === 6) && (r = C1(r), r !== null && 0 <= r.indexOf(o.value))) return !0;
        break;
      case ql:
        if (r.tag === 5 && (r = r.memoizedProps["data-testname"], typeof r == "string" && r.toLowerCase() === o.value.toLowerCase())) return !0;
        break;
      default:
        throw Error(a(365));
    }
    return !1;
  }
  function jc(r) {
    switch (r.$$typeof) {
      case Yl:
        return "<" + (D(r.value) || "Unknown") + ">";
      case Zl:
        return ":has(" + (jc(r) || "") + ")";
      case Jl:
        return '[role="' + r.value + '"]';
      case $l:
        return '"' + r.value + '"';
      case ql:
        return '[data-testname="' + r.value + '"]';
      default:
        throw Error(a(365));
    }
  }
  function dm(r, o) {
    var u = [];
    r = [r, 0];
    for (var c = 0; c < r.length; ) {
      var d = r[c++], h = r[c++], k = o[h];
      if (d.tag !== 5 || !Vi(d)) {
        for (; k != null && Nc(d, k); ) h++, k = o[h];
        if (h === o.length) u.push(d);
        else for (d = d.child; d !== null; ) r.push(d, h), d = d.sibling;
      }
    }
    return u;
  }
  function zc(r, o) {
    if (!Wi) throw Error(a(363));
    r = Mc(r), r = dm(r, o), o = [], r = Array.from(r);
    for (var u = 0; u < r.length; ) {
      var c = r[u++];
      if (c.tag === 5) Vi(c) || o.push(c.stateNode);
      else for (c = c.child; c !== null; ) r.push(c), c = c.sibling;
    }
    return o;
  }
  var Gx = Math.ceil, bl = f.ReactCurrentDispatcher, Ic = f.ReactCurrentOwner, De = f.ReactCurrentBatchConfig, se = 0, He = null, Be = null, et = 0, Qt = 0, qo = vr(0), We = 0, as = null, $o = 0, eu = 0, Oc = 0, cs = null, Rt = null, Dc = 0, Fc = 1 / 0;
  function bo() {
    Fc = Ye() + 500;
  }
  var tu = !1, Uc = null, _r = null, nu = !1, Er = null, ru = 0, fs = 0, Hc = null, ou = -1, iu = 0;
  function vt() {
    return se & 6 ? Ye() : ou !== -1 ? ou : ou = Ye();
  }
  function kr(r) {
    return r.mode & 1 ? se & 2 && et !== 0 ? et & -et : kx.transition !== null ? (iu === 0 && (r = vl, vl <<= 1, !(vl & 4194240) && (vl = 64), iu = r), iu) : (r = de, r !== 0 ? r : w1()) : 1;
  }
  function ln(r, o, u) {
    if (50 < fs) throw fs = 0, Hc = null, Error(a(185));
    var c = su(r, o);
    return c === null ? null : (Yi(c, o, u), (!(se & 2) || c !== He) && (c === He && (!(se & 2) && (eu |= o), We === 4 && Tr(c, et)), At(c, u), o === 1 && se === 0 && !(r.mode & 1) && (bo(), _l && In())), c);
  }
  function su(r, o) {
    r.lanes |= o;
    var u = r.alternate;
    for (u !== null && (u.lanes |= o), u = r, r = r.return; r !== null; ) r.childLanes |= o, u = r.alternate, u !== null && (u.childLanes |= o), u = r, r = r.return;
    return u.tag === 3 ? u.stateNode : null;
  }
  function At(r, o) {
    var u = r.callbackNode;
    mx(r, o);
    var c = Sl(r, r === He ? et : 0);
    if (c === 0) u !== null && $p(u), r.callbackNode = null, r.callbackPriority = 0;
    else if (o = c & -c, r.callbackPriority !== o) {
      if (u != null && $p(u), o === 1) r.tag === 0 ? Ex(hm.bind(null, r)) : bp(hm.bind(null, r)), E1 ? k1(function() {
        se === 0 && In();
      }) : Ya(Za, In), u = null;
      else {
        switch (qp(c)) {
          case 1:
            u = Za;
            break;
          case 4:
            u = xx;
            break;
          case 16:
            u = Ja;
            break;
          case 536870912:
            u = Sx;
            break;
          default:
            u = Ja;
        }
        u = Em(u, pm.bind(null, r));
      }
      r.callbackPriority = o, r.callbackNode = u;
    }
  }
  function pm(r, o) {
    if (ou = -1, iu = 0, se & 6) throw Error(a(327));
    var u = r.callbackNode;
    if (ao() && r.callbackNode !== u) return null;
    var c = Sl(r, r === He ? et : 0);
    if (c === 0) return null;
    if (c & 30 || c & r.expiredLanes || o) o = lu(r, c);
    else {
      o = c;
      var d = se;
      se |= 2;
      var h = ym();
      (He !== r || et !== o) && (bo(), lo(r, o));
      do
        try {
          Kx();
          break;
        } catch (P) {
          gm(r, P);
        }
      while (!0);
      ba(), bl.current = h, se = d, Be !== null ? o = 0 : (He = null, et = 0, o = We);
    }
    if (o !== 0) {
      if (o === 2 && (d = Ka(r), d !== 0 && (c = d, o = Bc(r, d))), o === 1) throw u = as, lo(r, 0), Tr(r, c), At(r, Ye()), u;
      if (o === 6) Tr(r, c);
      else {
        if (d = r.current.alternate, !(c & 30) && !Wx(d) && (o = lu(r, c), o === 2 && (h = Ka(r), h !== 0 && (c = h, o = Bc(r, h))), o === 1)) throw u = as, lo(r, 0), Tr(r, c), At(r, Ye()), u;
        switch (r.finishedWork = d, r.finishedLanes = c, o) {
          case 0:
          case 1:
            throw Error(a(345));
          case 2:
            uo(r, Rt);
            break;
          case 3:
            if (Tr(r, c), (c & 130023424) === c && (o = Dc + 500 - Ye(), 10 < o)) {
              if (Sl(r, 0) !== 0) break;
              if (d = r.suspendedLanes, (d & c) !== c) {
                vt(), r.pingedLanes |= r.suspendedLanes & d;
                break;
              }
              r.timeoutHandle = en(uo.bind(null, r, Rt), o);
              break;
            }
            uo(r, Rt);
            break;
          case 4:
            if (Tr(r, c), (c & 4194240) === c) break;
            for (o = r.eventTimes, d = -1; 0 < c; ) {
              var k = 31 - xn(c);
              h = 1 << k, k = o[k], k > d && (d = k), c &= ~h;
            }
            if (c = d, c = Ye() - c, c = (120 > c ? 120 : 480 > c ? 480 : 1080 > c ? 1080 : 1920 > c ? 1920 : 3e3 > c ? 3e3 : 4320 > c ? 4320 : 1960 * Gx(c / 1960)) - c, 10 < c) {
              r.timeoutHandle = en(uo.bind(null, r, Rt), c);
              break;
            }
            uo(r, Rt);
            break;
          case 5:
            uo(r, Rt);
            break;
          default:
            throw Error(a(329));
        }
      }
    }
    return At(r, Ye()), r.callbackNode === u ? pm.bind(null, r) : null;
  }
  function Bc(r, o) {
    var u = cs;
    return r.current.memoizedState.isDehydrated && (lo(r, o).flags |= 256), r = lu(r, o), r !== 2 && (o = Rt, Rt = u, o !== null && Gc(o)), r;
  }
  function Gc(r) {
    Rt === null ? Rt = r : Rt.push.apply(Rt, r);
  }
  function Wx(r) {
    for (var o = r; ; ) {
      if (o.flags & 16384) {
        var u = o.updateQueue;
        if (u !== null && (u = u.stores, u !== null)) for (var c = 0; c < u.length; c++) {
          var d = u[c], h = d.getSnapshot;
          d = d.value;
          try {
            if (!zn(h(), d)) return !1;
          } catch {
            return !1;
          }
        }
      }
      if (u = o.child, o.subtreeFlags & 16384 && u !== null) u.return = o, o = u;
      else {
        if (o === r) break;
        for (; o.sibling === null; ) {
          if (o.return === null || o.return === r) return !0;
          o = o.return;
        }
        o.sibling.return = o.return, o = o.sibling;
      }
    }
    return !0;
  }
  function Tr(r, o) {
    for (o &= ~Oc, o &= ~eu, r.suspendedLanes |= o, r.pingedLanes &= ~o, r = r.expirationTimes; 0 < o; ) {
      var u = 31 - xn(o), c = 1 << u;
      r[u] = -1, o &= ~c;
    }
  }
  function hm(r) {
    if (se & 6) throw Error(a(327));
    ao();
    var o = Sl(r, 0);
    if (!(o & 1)) return At(r, Ye()), null;
    var u = lu(r, o);
    if (r.tag !== 0 && u === 2) {
      var c = Ka(r);
      c !== 0 && (o = c, u = Bc(r, c));
    }
    if (u === 1) throw u = as, lo(r, 0), Tr(r, o), At(r, Ye()), u;
    if (u === 6) throw Error(a(345));
    return r.finishedWork = r.current.alternate, r.finishedLanes = o, uo(r, Rt), At(r, Ye()), null;
  }
  function mm(r) {
    Er !== null && Er.tag === 0 && !(se & 6) && ao();
    var o = se;
    se |= 1;
    var u = De.transition, c = de;
    try {
      if (De.transition = null, de = 1, r) return r();
    } finally {
      de = c, De.transition = u, se = o, !(se & 6) && In();
    }
  }
  function Wc() {
    Qt = qo.current, Te(qo);
  }
  function lo(r, o) {
    r.finishedWork = null, r.finishedLanes = 0;
    var u = r.timeoutHandle;
    if (u !== Ua && (r.timeoutHandle = Ua, v1(u)), Be !== null) for (u = Be.return; u !== null; ) {
      var c = u;
      switch (sc(c), c.tag) {
        case 1:
          c = c.type.childContextTypes, c != null && gl();
          break;
        case 3:
          Zo(), Te(Pt), Te(it), pc();
          break;
        case 5:
          fc(c);
          break;
        case 4:
          Zo();
          break;
        case 13:
          Te(Le);
          break;
        case 19:
          Te(Le);
          break;
        case 10:
          ec(c.type._context);
          break;
        case 22:
        case 23:
          Wc();
      }
      u = u.return;
    }
    if (He = r, Be = r = Pr(r.current, null), et = Qt = o, We = 0, as = null, Oc = eu = $o = 0, Rt = cs = null, On !== null) {
      for (o = 0; o < On.length; o++) if (u = On[o], c = u.interleaved, c !== null) {
        u.interleaved = null;
        var d = c.next, h = u.pending;
        if (h !== null) {
          var k = h.next;
          h.next = d, c.next = k;
        }
        u.pending = c;
      }
      On = null;
    }
    return r;
  }
  function gm(r, o) {
    do {
      var u = Be;
      try {
        if (ba(), jl.current = Ul, zl) {
          for (var c = Ie.memoizedState; c !== null; ) {
            var d = c.queue;
            d !== null && (d.pending = null), c = c.next;
          }
          zl = !1;
        }
        if (Jo = 0, Ze = st = Ie = null, es = !1, ts = 0, Ic.current = null, u === null || u.return === null) {
          We = 1, as = o, Be = null;
          break;
        }
        e: {
          var h = r, k = u.return, P = u, z = o;
          if (o = et, P.flags |= 32768, z !== null && typeof z == "object" && typeof z.then == "function") {
            var G = z, J = P, ne = J.tag;
            if (!(J.mode & 1) && (ne === 0 || ne === 11 || ne === 15)) {
              var ee = J.alternate;
              ee ? (J.updateQueue = ee.updateQueue, J.memoizedState = ee.memoizedState, J.lanes = ee.lanes) : (J.updateQueue = null, J.memoizedState = null);
            }
            var ve = Dh(k);
            if (ve !== null) {
              ve.flags &= -257, Fh(ve, k, P, h, o), ve.mode & 1 && Oh(h, G, o), o = ve, z = G;
              var b = o.updateQueue;
              if (b === null) {
                var at = /* @__PURE__ */ new Set();
                at.add(z), o.updateQueue = at;
              } else b.add(z);
              break e;
            } else {
              if (!(o & 1)) {
                Oh(h, G, o), Vc();
                break e;
              }
              z = Error(a(426));
            }
          } else if (Re && P.mode & 1) {
            var an = Dh(k);
            if (an !== null) {
              !(an.flags & 65536) && (an.flags |= 256), Fh(an, k, P, h, o), ac(z);
              break e;
            }
          }
          h = z, We !== 4 && (We = 2), cs === null ? cs = [h] : cs.push(h), z = Sc(z, P), P = k;
          do {
            switch (P.tag) {
              case 3:
                P.flags |= 65536, o &= -o, P.lanes |= o;
                var M = zh(P, z, o);
                nh(P, M);
                break e;
              case 1:
                h = z;
                var C = P.type, j = P.stateNode;
                if (!(P.flags & 128) && (typeof C.getDerivedStateFromError == "function" || j !== null && typeof j.componentDidCatch == "function" && (_r === null || !_r.has(j)))) {
                  P.flags |= 65536, o &= -o, P.lanes |= o;
                  var X = Ih(P, h, o);
                  nh(P, X);
                  break e;
                }
            }
            P = P.return;
          } while (P !== null);
        }
        xm(u);
      } catch ($) {
        o = $, Be === u && u !== null && (Be = u = u.return);
        continue;
      }
      break;
    } while (!0);
  }
  function ym() {
    var r = bl.current;
    return bl.current = Ul, r === null ? Ul : r;
  }
  function Vc() {
    (We === 0 || We === 3 || We === 2) && (We = 4), He === null || !($o & 268435455) && !(eu & 268435455) || Tr(He, et);
  }
  function lu(r, o) {
    var u = se;
    se |= 2;
    var c = ym();
    He === r && et === o || lo(r, o);
    do
      try {
        Vx();
        break;
      } catch (d) {
        gm(r, d);
      }
    while (!0);
    if (ba(), se = u, bl.current = c, Be !== null) throw Error(a(261));
    return He = null, et = 0, We;
  }
  function Vx() {
    for (; Be !== null; ) vm(Be);
  }
  function Kx() {
    for (; Be !== null && !yx(); ) vm(Be);
  }
  function vm(r) {
    var o = _m(r.alternate, r, Qt);
    r.memoizedProps = r.pendingProps, o === null ? xm(r) : Be = o, Ic.current = null;
  }
  function xm(r) {
    var o = r;
    do {
      var u = o.alternate;
      if (r = o.return, o.flags & 32768) {
        if (u = Dx(u, o), u !== null) {
          u.flags &= 32767, Be = u;
          return;
        }
        if (r !== null) r.flags |= 32768, r.subtreeFlags = 0, r.deletions = null;
        else {
          We = 6, Be = null;
          return;
        }
      } else if (u = zx(u, o, Qt), u !== null) {
        Be = u;
        return;
      }
      if (o = o.sibling, o !== null) {
        Be = o;
        return;
      }
      Be = o = r;
    } while (o !== null);
    We === 0 && (We = 5);
  }
  function uo(r, o) {
    var u = de, c = De.transition;
    try {
      De.transition = null, de = 1, Qx(r, o, u);
    } finally {
      De.transition = c, de = u;
    }
    return null;
  }
  function Qx(r, o, u) {
    do
      ao();
    while (Er !== null);
    if (se & 6) throw Error(a(327));
    var c = r.finishedWork, d = r.finishedLanes;
    if (c === null) return null;
    if (r.finishedWork = null, r.finishedLanes = 0, c === r.current) throw Error(a(177));
    r.callbackNode = null, r.callbackPriority = 0;
    var h = c.lanes | c.childLanes;
    if (gx(r, h), r === He && (Be = He = null, et = 0), !(c.subtreeFlags & 2064) && !(c.flags & 2064) || nu || (nu = !0, Em(Ja, function() {
      return ao(), null;
    })), h = (c.flags & 15990) !== 0, c.subtreeFlags & 15990 || h) {
      h = De.transition, De.transition = null;
      var k = de;
      de = 1;
      var P = se;
      se |= 4, Ic.current = null, Ux(r, c), Hx(r, c), F(r.containerInfo), r.current = c, Bx(c), vx(), se = P, de = k, De.transition = h;
    } else r.current = c;
    if (nu && (nu = !1, Er = r, ru = d), h = r.pendingLanes, h === 0 && (_r = null), wx(c.stateNode), At(r, Ye()), o !== null) for (u = r.onRecoverableError, c = 0; c < o.length; c++) u(o[c]);
    if (tu) throw tu = !1, r = Uc, Uc = null, r;
    return ru & 1 && r.tag !== 0 && ao(), h = r.pendingLanes, h & 1 ? r === Hc ? fs++ : (fs = 0, Hc = r) : fs = 0, In(), null;
  }
  function ao() {
    if (Er !== null) {
      var r = qp(ru), o = De.transition, u = de;
      try {
        if (De.transition = null, de = 16 > r ? 16 : r, Er === null) var c = !1;
        else {
          if (r = Er, Er = null, ru = 0, se & 6) throw Error(a(331));
          var d = se;
          for (se |= 4, K = r.current; K !== null; ) {
            var h = K, k = h.child;
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
                        so(8, J, h);
                    }
                    var ne = J.child;
                    if (ne !== null) ne.return = J, K = ne;
                    else for (; K !== null; ) {
                      J = K;
                      var ee = J.sibling, ve = J.return;
                      if (rm(J), J === G) {
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
                      var an = at.sibling;
                      at.sibling = null, at = an;
                    } while (at !== null);
                  }
                }
                K = h;
              }
            }
            if (h.subtreeFlags & 2064 && k !== null) k.return = h, K = k;
            else e: for (; K !== null; ) {
              if (h = K, h.flags & 2048) switch (h.tag) {
                case 0:
                case 11:
                case 15:
                  so(9, h, h.return);
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
            k = K;
            var j = k.child;
            if (k.subtreeFlags & 2064 && j !== null) j.return = k, K = j;
            else e: for (k = C; K !== null; ) {
              if (P = K, P.flags & 2048) try {
                switch (P.tag) {
                  case 0:
                  case 11:
                  case 15:
                    ls(9, P);
                }
              } catch ($) {
                Lt(P, P.return, $);
              }
              if (P === k) {
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
          if (se = d, In(), jn && typeof jn.onPostCommitFiberRoot == "function") try {
            jn.onPostCommitFiberRoot(wl, r);
          } catch {
          }
          c = !0;
        }
        return c;
      } finally {
        de = u, De.transition = o;
      }
    }
    return !1;
  }
  function Sm(r, o, u) {
    o = Sc(u, o), o = zh(r, o, 1), wr(r, o), o = vt(), r = su(r, 1), r !== null && (Yi(r, 1, o), At(r, o));
  }
  function Lt(r, o, u) {
    if (r.tag === 3) Sm(r, r, u);
    else for (; o !== null; ) {
      if (o.tag === 3) {
        Sm(o, r, u);
        break;
      } else if (o.tag === 1) {
        var c = o.stateNode;
        if (typeof o.type.getDerivedStateFromError == "function" || typeof c.componentDidCatch == "function" && (_r === null || !_r.has(c))) {
          r = Sc(u, r), r = Ih(o, r, 1), wr(o, r), r = vt(), o = su(o, 1), o !== null && (Yi(o, 1, r), At(o, r));
          break;
        }
      }
      o = o.return;
    }
  }
  function Xx(r, o, u) {
    var c = r.pingCache;
    c !== null && c.delete(o), o = vt(), r.pingedLanes |= r.suspendedLanes & u, He === r && (et & u) === u && (We === 4 || We === 3 && (et & 130023424) === et && 500 > Ye() - Dc ? lo(r, 0) : Oc |= u), At(r, o);
  }
  function wm(r, o) {
    o === 0 && (r.mode & 1 ? (o = xl, xl <<= 1, !(xl & 130023424) && (xl = 4194304)) : o = 1);
    var u = vt();
    r = su(r, o), r !== null && (Yi(r, o, u), At(r, u));
  }
  function Yx(r) {
    var o = r.memoizedState, u = 0;
    o !== null && (u = o.retryLane), wm(r, u);
  }
  function Zx(r, o) {
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
    c !== null && c.delete(o), wm(r, u);
  }
  var _m;
  _m = function(r, o, u) {
    if (r !== null) if (r.memoizedProps !== o.pendingProps || Pt.current) Kt = !0;
    else {
      if (!(r.lanes & u) && !(o.flags & 128)) return Kt = !1, Ox(r, o, u);
      Kt = !!(r.flags & 131072);
    }
    else Kt = !1, Re && o.flags & 1048576 && uh(o, Ll, o.index);
    switch (o.lanes = 0, o.tag) {
      case 2:
        var c = o.type;
        r !== null && (r.alternate = null, o.alternate = null, o.flags |= 2), r = o.pendingProps;
        var d = Bo(o, it.current);
        Wo(o, u), d = mc(null, o, c, r, d, u);
        var h = gc();
        return o.flags |= 1, typeof d == "object" && d !== null && typeof d.render == "function" && d.$$typeof === void 0 ? (o.tag = 1, o.memoizedState = null, o.updateQueue = null, Ct(c) ? (h = !0, yl(o)) : h = !1, o.memoizedState = d.state !== null && d.state !== void 0 ? d.state : null, nc(o), d.updater = Rl, o.stateNode = d, d._reactInternals = o, oc(o, c, r, u), o = Ec(null, o, c, !0, h, u)) : (o.tag = 0, Re && h && ic(o), yt(null, o, d, u), o = o.child), o;
      case 16:
        c = o.elementType;
        e: {
          switch (r !== null && (r.alternate = null, o.alternate = null, o.flags |= 2), r = o.pendingProps, d = c._init, c = d(c._payload), o.type = c, d = o.tag = qx(c), r = Sn(c, r), d) {
            case 0:
              o = _c(null, o, c, r, u);
              break e;
            case 1:
              o = Qh(
                null,
                o,
                c,
                r,
                u
              );
              break e;
            case 11:
              o = Bh(null, o, c, r, u);
              break e;
            case 14:
              o = Gh(null, o, c, Sn(c.type, r), u);
              break e;
          }
          throw Error(a(306, c, ""));
        }
        return o;
      case 0:
        return c = o.type, d = o.pendingProps, d = o.elementType === c ? d : Sn(c, d), _c(r, o, c, d, u);
      case 1:
        return c = o.type, d = o.pendingProps, d = o.elementType === c ? d : Sn(c, d), Qh(r, o, c, d, u);
      case 3:
        e: {
          if (Xh(o), r === null) throw Error(a(387));
          c = o.pendingProps, h = o.memoizedState, d = h.element, th(r, o), Cl(o, c, null, u);
          var k = o.memoizedState;
          if (c = k.element, Gt && h.isDehydrated) if (h = {
            element: c,
            isDehydrated: !1,
            cache: k.cache,
            transitions: k.transitions
          }, o.updateQueue.baseState = h, o.memoizedState = h, o.flags & 256) {
            d = Error(a(423)), o = Yh(r, o, c, u, d);
            break e;
          } else if (c !== d) {
            d = Error(a(424)), o = Yh(r, o, c, u, d);
            break e;
          } else for (Gt && (Vt = $1(o.stateNode.containerInfo), Wt = o, Re = !0, wn = null, Zi = !1), u = hh(o, null, c, u), o.child = u; u; ) u.flags = u.flags & -3 | 4096, u = u.sibling;
          else {
            if (Qo(), c === d) {
              o = or(r, o, u);
              break e;
            }
            yt(r, o, c, u);
          }
          o = o.child;
        }
        return o;
      case 5:
        return mh(o), r === null && uc(o), c = o.type, d = o.pendingProps, h = r !== null ? r.memoizedProps : null, k = d.children, ot(c, d) ? k = null : h !== null && ot(c, h) && (o.flags |= 32), Kh(r, o), yt(r, o, k, u), o.child;
      case 6:
        return r === null && uc(o), null;
      case 13:
        return Zh(r, o, u);
      case 4:
        return cc(o, o.stateNode.containerInfo), c = o.pendingProps, r === null ? o.child = Xo(o, null, c, u) : yt(r, o, c, u), o.child;
      case 11:
        return c = o.type, d = o.pendingProps, d = o.elementType === c ? d : Sn(c, d), Bh(r, o, c, d, u);
      case 7:
        return yt(r, o, o.pendingProps, u), o.child;
      case 8:
        return yt(r, o, o.pendingProps.children, u), o.child;
      case 12:
        return yt(r, o, o.pendingProps.children, u), o.child;
      case 10:
        e: {
          if (c = o.type._context, d = o.pendingProps, h = o.memoizedProps, k = d.value, eh(o, c, k), h !== null) if (zn(h.value, k)) {
            if (h.children === d.children && !Pt.current) {
              o = or(r, o, u);
              break e;
            }
          } else for (h = o.child, h !== null && (h.return = o); h !== null; ) {
            var P = h.dependencies;
            if (P !== null) {
              k = h.child;
              for (var z = P.firstContext; z !== null; ) {
                if (z.context === c) {
                  if (h.tag === 1) {
                    z = er(-1, u & -u), z.tag = 2;
                    var G = h.updateQueue;
                    if (G !== null) {
                      G = G.shared;
                      var J = G.pending;
                      J === null ? z.next = z : (z.next = J.next, J.next = z), G.pending = z;
                    }
                  }
                  h.lanes |= u, z = h.alternate, z !== null && (z.lanes |= u), tc(h.return, u, o), P.lanes |= u;
                  break;
                }
                z = z.next;
              }
            } else if (h.tag === 10) k = h.type === o.type ? null : h.child;
            else if (h.tag === 18) {
              if (k = h.return, k === null) throw Error(a(341));
              k.lanes |= u, P = k.alternate, P !== null && (P.lanes |= u), tc(k, u, o), k = h.sibling;
            } else k = h.child;
            if (k !== null) k.return = h;
            else for (k = h; k !== null; ) {
              if (k === o) {
                k = null;
                break;
              }
              if (h = k.sibling, h !== null) {
                h.return = k.return, k = h;
                break;
              }
              k = k.return;
            }
            h = k;
          }
          yt(r, o, d.children, u), o = o.child;
        }
        return o;
      case 9:
        return d = o.type, c = o.pendingProps.children, Wo(o, u), d = tn(d), c = c(d), o.flags |= 1, yt(r, o, c, u), o.child;
      case 14:
        return c = o.type, d = Sn(c, o.pendingProps), d = Sn(c.type, d), Gh(r, o, c, d, u);
      case 15:
        return Wh(r, o, o.type, o.pendingProps, u);
      case 17:
        return c = o.type, d = o.pendingProps, d = o.elementType === c ? d : Sn(c, d), r !== null && (r.alternate = null, o.alternate = null, o.flags |= 2), o.tag = 1, Ct(c) ? (r = !0, yl(o)) : r = !1, Wo(o, u), sh(o, c, d), oc(o, c, d, u), Ec(null, o, c, !0, r, u);
      case 19:
        return bh(r, o, u);
      case 22:
        return Vh(r, o, u);
    }
    throw Error(a(156, o.tag));
  };
  function Em(r, o) {
    return Ya(r, o);
  }
  function Jx(r, o, u, c) {
    this.tag = r, this.key = u, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.ref = null, this.pendingProps = o, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = c, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function un(r, o, u, c) {
    return new Jx(r, o, u, c);
  }
  function Kc(r) {
    return r = r.prototype, !(!r || !r.isReactComponent);
  }
  function qx(r) {
    if (typeof r == "function") return Kc(r) ? 1 : 0;
    if (r != null) {
      if (r = r.$$typeof, r === A) return 11;
      if (r === x) return 14;
    }
    return 2;
  }
  function Pr(r, o) {
    var u = r.alternate;
    return u === null ? (u = un(r.tag, o, r.key, r.mode), u.elementType = r.elementType, u.type = r.type, u.stateNode = r.stateNode, u.alternate = r, r.alternate = u) : (u.pendingProps = o, u.type = r.type, u.flags = 0, u.subtreeFlags = 0, u.deletions = null), u.flags = r.flags & 14680064, u.childLanes = r.childLanes, u.lanes = r.lanes, u.child = r.child, u.memoizedProps = r.memoizedProps, u.memoizedState = r.memoizedState, u.updateQueue = r.updateQueue, o = r.dependencies, u.dependencies = o === null ? null : { lanes: o.lanes, firstContext: o.firstContext }, u.sibling = r.sibling, u.index = r.index, u.ref = r.ref, u;
  }
  function uu(r, o, u, c, d, h) {
    var k = 2;
    if (c = r, typeof r == "function") Kc(r) && (k = 1);
    else if (typeof r == "string") k = 5;
    else e: switch (r) {
      case g:
        return co(u.children, d, h, o);
      case y:
        k = 8, d |= 8;
        break;
      case v:
        return r = un(12, u, o, d | 2), r.elementType = v, r.lanes = h, r;
      case L:
        return r = un(13, u, o, d), r.elementType = L, r.lanes = h, r;
      case S:
        return r = un(19, u, o, d), r.elementType = S, r.lanes = h, r;
      case R:
        return au(u, d, h, o);
      default:
        if (typeof r == "object" && r !== null) switch (r.$$typeof) {
          case w:
            k = 10;
            break e;
          case T:
            k = 9;
            break e;
          case A:
            k = 11;
            break e;
          case x:
            k = 14;
            break e;
          case _:
            k = 16, c = null;
            break e;
        }
        throw Error(a(130, r == null ? r : typeof r, ""));
    }
    return o = un(k, u, o, d), o.elementType = r, o.type = c, o.lanes = h, o;
  }
  function co(r, o, u, c) {
    return r = un(7, r, c, o), r.lanes = u, r;
  }
  function au(r, o, u, c) {
    return r = un(22, r, c, o), r.elementType = R, r.lanes = u, r.stateNode = {}, r;
  }
  function Qc(r, o, u) {
    return r = un(6, r, null, o), r.lanes = u, r;
  }
  function Xc(r, o, u) {
    return o = un(4, r.children !== null ? r.children : [], r.key, o), o.lanes = u, o.stateNode = { containerInfo: r.containerInfo, pendingChildren: null, implementation: r.implementation }, o;
  }
  function $x(r, o, u, c, d) {
    this.tag = o, this.containerInfo = r, this.finishedWork = this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = Ua, this.callbackNode = this.pendingContext = this.context = null, this.callbackPriority = 0, this.eventTimes = Qa(0), this.expirationTimes = Qa(-1), this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Qa(0), this.identifierPrefix = c, this.onRecoverableError = d, Gt && (this.mutableSourceEagerHydrationData = null);
  }
  function km(r, o, u, c, d, h, k, P, z) {
    return r = new $x(r, o, u, P, z), o === 1 ? (o = 1, h === !0 && (o |= 8)) : o = 0, h = un(3, null, null, o), r.current = h, h.stateNode = r, h.memoizedState = { element: c, isDehydrated: u, cache: null, transitions: null }, nc(h), r;
  }
  function Tm(r) {
    if (!r) return xr;
    r = r._reactInternals;
    e: {
      if (q(r) !== r || r.tag !== 1) throw Error(a(170));
      var o = r;
      do {
        switch (o.tag) {
          case 3:
            o = o.stateNode.context;
            break e;
          case 1:
            if (Ct(o.type)) {
              o = o.stateNode.__reactInternalMemoizedMergedChildContext;
              break e;
            }
        }
        o = o.return;
      } while (o !== null);
      throw Error(a(171));
    }
    if (r.tag === 1) {
      var u = r.type;
      if (Ct(u)) return Zp(r, u, o);
    }
    return o;
  }
  function Pm(r) {
    var o = r._reactInternals;
    if (o === void 0)
      throw typeof r.render == "function" ? Error(a(188)) : (r = Object.keys(r).join(","), Error(a(268, r)));
    return r = le(o), r === null ? null : r.stateNode;
  }
  function Cm(r, o) {
    if (r = r.memoizedState, r !== null && r.dehydrated !== null) {
      var u = r.retryLane;
      r.retryLane = u !== 0 && u < o ? u : o;
    }
  }
  function Yc(r, o) {
    Cm(r, o), (r = r.alternate) && Cm(r, o);
  }
  function bx(r) {
    return r = le(r), r === null ? null : r.stateNode;
  }
  function eS() {
    return null;
  }
  return n.attemptContinuousHydration = function(r) {
    if (r.tag === 13) {
      var o = vt();
      ln(r, 134217728, o), Yc(r, 134217728);
    }
  }, n.attemptHydrationAtCurrentPriority = function(r) {
    if (r.tag === 13) {
      var o = vt(), u = kr(r);
      ln(r, u, o), Yc(r, u);
    }
  }, n.attemptSynchronousHydration = function(r) {
    switch (r.tag) {
      case 3:
        var o = r.stateNode;
        if (o.current.memoizedState.isDehydrated) {
          var u = Xi(o.pendingLanes);
          u !== 0 && (Xa(o, u | 1), At(o, Ye()), !(se & 6) && (bo(), In()));
        }
        break;
      case 13:
        var c = vt();
        mm(function() {
          return ln(r, 1, c);
        }), Yc(r, 1);
    }
  }, n.batchedUpdates = function(r, o) {
    var u = se;
    se |= 1;
    try {
      return r(o);
    } finally {
      se = u, se === 0 && (bo(), _l && In());
    }
  }, n.createComponentSelector = function(r) {
    return { $$typeof: Yl, value: r };
  }, n.createContainer = function(r, o, u, c, d, h, k) {
    return km(r, o, !1, null, u, c, d, h, k);
  }, n.createHasPseudoClassSelector = function(r) {
    return { $$typeof: Zl, value: r };
  }, n.createHydrationContainer = function(r, o, u, c, d, h, k, P, z) {
    return r = km(u, c, !0, r, d, h, k, P, z), r.context = Tm(null), u = r.current, c = vt(), d = kr(u), h = er(c, d), h.callback = o ?? null, wr(u, h), r.current.lanes = d, Yi(r, d, c), At(r, c), r;
  }, n.createPortal = function(r, o, u) {
    var c = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return { $$typeof: m, key: c == null ? null : "" + c, children: r, containerInfo: o, implementation: u };
  }, n.createRoleSelector = function(r) {
    return { $$typeof: Jl, value: r };
  }, n.createTestNameSelector = function(r) {
    return { $$typeof: ql, value: r };
  }, n.createTextSelector = function(r) {
    return { $$typeof: $l, value: r };
  }, n.deferredUpdates = function(r) {
    var o = de, u = De.transition;
    try {
      return De.transition = null, de = 16, r();
    } finally {
      de = o, De.transition = u;
    }
  }, n.discreteUpdates = function(r, o, u, c, d) {
    var h = de, k = De.transition;
    try {
      return De.transition = null, de = 1, r(o, u, c, d);
    } finally {
      de = h, De.transition = k, se === 0 && bo();
    }
  }, n.findAllNodes = zc, n.findBoundingRects = function(r, o) {
    if (!Wi) throw Error(a(363));
    o = zc(r, o), r = [];
    for (var u = 0; u < o.length; u++) r.push(P1(o[u]));
    for (o = r.length - 1; 0 < o; o--) {
      u = r[o];
      for (var c = u.x, d = c + u.width, h = u.y, k = h + u.height, P = o - 1; 0 <= P; P--) if (o !== P) {
        var z = r[P], G = z.x, J = G + z.width, ne = z.y, ee = ne + z.height;
        if (c >= G && h >= ne && d <= J && k <= ee) {
          r.splice(o, 1);
          break;
        } else if (c !== G || u.width !== z.width || ee < h || ne > k) {
          if (!(h !== ne || u.height !== z.height || J < c || G > d)) {
            G > c && (z.width += G - c, z.x = c), J < d && (z.width = d - G), r.splice(o, 1);
            break;
          }
        } else {
          ne > h && (z.height += ne - h, z.y = h), ee < k && (z.height = k - ne), r.splice(o, 1);
          break;
        }
      }
    }
    return r;
  }, n.findHostInstance = Pm, n.findHostInstanceWithNoPortals = function(r) {
    return r = Q(r), r = r !== null ? kt(r) : null, r === null ? null : r.stateNode;
  }, n.findHostInstanceWithWarning = function(r) {
    return Pm(r);
  }, n.flushControlled = function(r) {
    var o = se;
    se |= 1;
    var u = De.transition, c = de;
    try {
      De.transition = null, de = 1, r();
    } finally {
      de = c, De.transition = u, se = o, se === 0 && (bo(), In());
    }
  }, n.flushPassiveEffects = ao, n.flushSync = mm, n.focusWithin = function(r, o) {
    if (!Wi) throw Error(a(363));
    for (r = Mc(r), o = dm(r, o), o = Array.from(o), r = 0; r < o.length; ) {
      var u = o[r++];
      if (!Vi(u)) {
        if (u.tag === 5 && A1(u.stateNode)) return !0;
        for (u = u.child; u !== null; ) o.push(u), u = u.sibling;
      }
    }
    return !1;
  }, n.getCurrentUpdatePriority = function() {
    return de;
  }, n.getFindAllNodesFailureDescription = function(r, o) {
    if (!Wi) throw Error(a(363));
    var u = 0, c = [];
    r = [Mc(r), 0];
    for (var d = 0; d < r.length; ) {
      var h = r[d++], k = r[d++], P = o[k];
      if ((h.tag !== 5 || !Vi(h)) && (Nc(h, P) && (c.push(jc(P)), k++, k > u && (u = k)), k < o.length)) for (h = h.child; h !== null; ) r.push(h, k), h = h.sibling;
    }
    if (u < o.length) {
      for (r = []; u < o.length; u++) r.push(jc(o[u]));
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
    if (r = { bundleType: r.bundleType, version: r.version, rendererPackageName: r.rendererPackageName, rendererConfig: r.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: f.ReactCurrentDispatcher, findHostInstanceByFiber: bx, findFiberByHostInstance: r.findFiberByHostInstance || eS, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.0.0-fc46dba67-20220329" }, typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u") r = !1;
    else {
      var o = __REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (o.isDisabled || !o.supportsFiber) r = !0;
      else {
        try {
          wl = o.inject(r), jn = o;
        } catch {
        }
        r = !!o.checkDCE;
      }
    }
    return r;
  }, n.isAlreadyRendering = function() {
    return !1;
  }, n.observeVisibleRects = function(r, o, u, c) {
    if (!Wi) throw Error(a(363));
    r = zc(r, o);
    var d = L1(r, u, c).disconnect;
    return { disconnect: function() {
      d();
    } };
  }, n.registerMutableSourceForHydration = function(r, o) {
    var u = o._getVersion;
    u = u(o._source), r.mutableSourceEagerHydrationData == null ? r.mutableSourceEagerHydrationData = [o, u] : r.mutableSourceEagerHydrationData.push(o, u);
  }, n.runWithPriority = function(r, o) {
    var u = de;
    try {
      return de = r, o();
    } finally {
      de = u;
    }
  }, n.shouldError = function() {
    return null;
  }, n.shouldSuspend = function() {
    return !1;
  }, n.updateContainer = function(r, o, u, c) {
    var d = o.current, h = vt(), k = kr(d);
    return u = Tm(u), o.context === null ? o.context = u : o.pendingContext = u, o = er(h, k), o.payload = { element: r }, c = c === void 0 ? null : c, c !== null && (o.callback = c), wr(d, o), r = ln(d, k, h), r !== null && Pl(r, d, k), k;
  }, n;
};
Gv.exports = S2;
var w2 = Gv.exports;
const _2 = /* @__PURE__ */ HS(w2), Op = {}, E2 = (e) => void Object.assign(Op, e);
function k2(e, t) {
  function n(g, {
    args: y = [],
    attach: v,
    ...w
  }, T) {
    let A = `${g[0].toUpperCase()}${g.slice(1)}`, L;
    if (g === "primitive") {
      if (w.object === void 0) throw new Error("R3F: Primitives without 'object' are invalid!");
      const S = w.object;
      L = si(S, {
        type: g,
        root: T,
        attach: v,
        primitive: !0
      });
    } else {
      const S = Op[A];
      if (!S)
        throw new Error(`R3F: ${A} is not part of the THREE namespace! Did you forget to extend? See: https://docs.pmnd.rs/react-three-fiber/api/objects#using-3rd-party-objects-declaratively`);
      if (!Array.isArray(y)) throw new Error("R3F: The args prop must be an array!");
      L = si(new S(...y), {
        type: g,
        root: T,
        attach: v,
        // Save args in case we need to reconstruct later for HMR
        memoizedProps: {
          args: y
        }
      });
    }
    return L.__r3f.attach === void 0 && (L.isBufferGeometry ? L.__r3f.attach = "geometry" : L.isMaterial && (L.__r3f.attach = "material")), A !== "inject" && Pf(L, w), L;
  }
  function i(g, y) {
    let v = !1;
    if (y) {
      var w, T;
      (w = y.__r3f) != null && w.attach ? Tf(g, y, y.__r3f.attach) : y.isObject3D && g.isObject3D && (g.add(y), v = !0), v || (T = g.__r3f) == null || T.objects.push(y), y.__r3f || si(y, {}), y.__r3f.parent = g, Ud(y), li(y);
    }
  }
  function s(g, y, v) {
    let w = !1;
    if (y) {
      var T, A;
      if ((T = y.__r3f) != null && T.attach)
        Tf(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        y.parent = g, y.dispatchEvent({
          type: "added"
        }), g.dispatchEvent({
          type: "childadded",
          child: y
        });
        const L = g.children.filter((x) => x !== y), S = L.indexOf(v);
        g.children = [...L.slice(0, S), y, ...L.slice(S)], w = !0;
      }
      w || (A = g.__r3f) == null || A.objects.push(y), y.__r3f || si(y, {}), y.__r3f.parent = g, Ud(y), li(y);
    }
  }
  function l(g, y, v = !1) {
    g && [...g].forEach((w) => a(y, w, v));
  }
  function a(g, y, v) {
    if (y) {
      var w, T, A;
      if (y.__r3f && (y.__r3f.parent = null), (w = g.__r3f) != null && w.objects && (g.__r3f.objects = g.__r3f.objects.filter((R) => R !== y)), (T = y.__r3f) != null && T.attach)
        Xg(g, y, y.__r3f.attach);
      else if (y.isObject3D && g.isObject3D) {
        var L;
        g.remove(y), (L = y.__r3f) != null && L.root && N2(Vu(y), y);
      }
      const x = (A = y.__r3f) == null ? void 0 : A.primitive, _ = !x && (v === void 0 ? y.dispose !== null : v);
      if (!x) {
        var S;
        l((S = y.__r3f) == null ? void 0 : S.objects, y, _), l(y.children, y, _);
      }
      if (delete y.__r3f, _ && y.dispose && y.type !== "Scene") {
        const R = () => {
          try {
            y.dispose();
          } catch {
          }
        };
        typeof IS_REACT_ACT_ENVIRONMENT > "u" ? Dd.unstable_scheduleCallback(Dd.unstable_IdlePriority, R) : R();
      }
      li(g);
    }
  }
  function f(g, y, v, w) {
    var T;
    const A = (T = g.__r3f) == null ? void 0 : T.parent;
    if (!A) return;
    const L = n(y, v, g.__r3f.root);
    if (g.children) {
      for (const S of g.children)
        S.__r3f && i(L, S);
      g.children = g.children.filter((S) => !S.__r3f);
    }
    g.__r3f.objects.forEach((S) => i(L, S)), g.__r3f.objects = [], g.__r3f.autoRemovedBeforeAppend || a(A, g), L.parent && (L.__r3f.autoRemovedBeforeAppend = !0), i(A, L), L.raycast && L.__r3f.eventCount && Vu(L).getState().internal.interaction.push(L), [w, w.alternate].forEach((S) => {
      S !== null && (S.stateNode = L, S.ref && (typeof S.ref == "function" ? S.ref(L) : S.ref.current = L));
    });
  }
  const p = () => {
  };
  return {
    reconciler: _2({
      createInstance: n,
      removeChild: a,
      appendChild: i,
      appendInitialChild: i,
      insertBefore: s,
      supportsMutation: !0,
      isPrimaryRenderer: !1,
      supportsPersistence: !1,
      supportsHydration: !1,
      noTimeout: -1,
      appendChildToContainer: (g, y) => {
        if (!y) return;
        const v = g.getState().scene;
        v.__r3f && (v.__r3f.root = g, i(v, y));
      },
      removeChildFromContainer: (g, y) => {
        y && a(g.getState().scene, y);
      },
      insertInContainerBefore: (g, y, v) => {
        if (!y || !v) return;
        const w = g.getState().scene;
        w.__r3f && s(w, y, v);
      },
      getRootHostContext: () => null,
      getChildHostContext: (g) => g,
      finalizeInitialChildren(g) {
        var y;
        return !!((y = g == null ? void 0 : g.__r3f) != null ? y : {}).handlers;
      },
      prepareUpdate(g, y, v, w) {
        var T;
        if (((T = g == null ? void 0 : g.__r3f) != null ? T : {}).primitive && w.object && w.object !== g)
          return [!0];
        {
          const {
            args: L = [],
            children: S,
            ...x
          } = w, {
            args: _ = [],
            children: R,
            ...I
          } = v;
          if (!Array.isArray(L)) throw new Error("R3F: the args prop must be an array!");
          if (L.some((D, B) => D !== _[B])) return [!0];
          const O = qv(g, x, I, !0);
          return O.changes.length ? [!1, O] : null;
        }
      },
      commitUpdate(g, [y, v], w, T, A, L) {
        y ? f(g, w, A, L) : Pf(g, v);
      },
      commitMount(g, y, v, w) {
        var T;
        const A = (T = g.__r3f) != null ? T : {};
        g.raycast && A.handlers && A.eventCount && Vu(g).getState().internal.interaction.push(g);
      },
      getPublicInstance: (g) => g,
      prepareForCommit: () => null,
      preparePortalMount: (g) => si(g.getState().scene),
      resetAfterCommit: () => {
      },
      shouldSetTextContent: () => !1,
      clearContainer: () => !1,
      hideInstance(g) {
        var y;
        const {
          attach: v,
          parent: w
        } = (y = g.__r3f) != null ? y : {};
        v && w && Xg(w, g, v), g.isObject3D && (g.visible = !1), li(g);
      },
      unhideInstance(g, y) {
        var v;
        const {
          attach: w,
          parent: T
        } = (v = g.__r3f) != null ? v : {};
        w && T && Tf(T, g, w), (g.isObject3D && y.visible == null || y.visible) && (g.visible = !0), li(g);
      },
      createTextInstance: p,
      hideTextInstance: p,
      unhideTextInstance: p,
      // https://github.com/pmndrs/react-three-fiber/pull/2360#discussion_r916356874
      // @ts-expect-error
      getCurrentEventPriority: () => t ? t() : wi.DefaultEventPriority,
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
    applyProps: Pf
  };
}
var Wg, Vg;
const kf = (e) => "colorSpace" in e || "outputColorSpace" in e, Kv = () => {
  var e;
  return (e = Op.ColorManagement) != null ? e : null;
}, Qv = (e) => e && e.isOrthographicCamera, T2 = (e) => e && e.hasOwnProperty("current"), pl = typeof window < "u" && ((Wg = window.document) != null && Wg.createElement || ((Vg = window.navigator) == null ? void 0 : Vg.product) === "ReactNative") ? W.useLayoutEffect : W.useEffect;
function Xv(e) {
  const t = W.useRef(e);
  return pl(() => void (t.current = e), [e]), t;
}
function P2({
  set: e
}) {
  return pl(() => (e(new Promise(() => null)), () => e(!1)), [e]), null;
}
class Yv extends W.Component {
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
Yv.getDerivedStateFromError = () => ({
  error: !0
});
const Zv = "__default", Kg = /* @__PURE__ */ new Map(), C2 = (e) => e && !!e.memoized && !!e.changes;
function Jv(e) {
  var t;
  const n = typeof window < "u" ? (t = window.devicePixelRatio) != null ? t : 2 : 1;
  return Array.isArray(e) ? Math.min(Math.max(e[0], n), e[1]) : e;
}
const Ss = (e) => {
  var t;
  return (t = e.__r3f) == null ? void 0 : t.root.getState();
};
function Vu(e) {
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
    objects: i = "reference",
    strict: s = !0
  } = {}) {
    if (typeof e != typeof t || !!e != !!t) return !1;
    if (Ee.str(e) || Ee.num(e) || Ee.boo(e)) return e === t;
    const l = Ee.obj(e);
    if (l && i === "reference") return e === t;
    const a = Ee.arr(e);
    if (a && n === "reference") return e === t;
    if ((a || l) && e === t) return !0;
    let f;
    for (f in e) if (!(f in t)) return !1;
    if (l && n === "shallow" && i === "shallow") {
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
function R2(e) {
  const t = {
    nodes: {},
    materials: {}
  };
  return e && e.traverse((n) => {
    n.name && (t.nodes[n.name] = n), n.material && !t.materials[n.material.name] && (t.materials[n.material.name] = n.material);
  }), t;
}
function A2(e) {
  e.dispose && e.type !== "Scene" && e.dispose();
  for (const t in e)
    t.dispose == null || t.dispose(), delete e[t];
}
function si(e, t) {
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
function Fd(e, t) {
  let n = e;
  if (t.includes("-")) {
    const i = t.split("-"), s = i.pop();
    return n = i.reduce((l, a) => l[a], e), {
      target: n,
      key: s
    };
  } else return {
    target: n,
    key: t
  };
}
const Qg = /-\d+$/;
function Tf(e, t, n) {
  if (Ee.str(n)) {
    if (Qg.test(n)) {
      const l = n.replace(Qg, ""), {
        target: a,
        key: f
      } = Fd(e, l);
      Array.isArray(a[f]) || (a[f] = []);
    }
    const {
      target: i,
      key: s
    } = Fd(e, n);
    t.__r3f.previousAttach = i[s], i[s] = t;
  } else t.__r3f.previousAttach = n(e, t);
}
function Xg(e, t, n) {
  var i, s;
  if (Ee.str(n)) {
    const {
      target: l,
      key: a
    } = Fd(e, n), f = t.__r3f.previousAttach;
    f === void 0 ? delete l[a] : l[a] = f;
  } else (i = t.__r3f) == null || i.previousAttach == null || i.previousAttach(e, t);
  (s = t.__r3f) == null || delete s.previousAttach;
}
function qv(e, {
  children: t,
  key: n,
  ref: i,
  ...s
}, {
  children: l,
  key: a,
  ref: f,
  ...p
} = {}, m = !1) {
  const g = e.__r3f, y = Object.entries(s), v = [];
  if (m) {
    const T = Object.keys(p);
    for (let A = 0; A < T.length; A++)
      s.hasOwnProperty(T[A]) || y.unshift([T[A], Zv + "remove"]);
  }
  y.forEach(([T, A]) => {
    var L;
    if ((L = e.__r3f) != null && L.primitive && T === "object" || Ee.equ(A, p[T])) return;
    if (/^on(Pointer|Click|DoubleClick|ContextMenu|Wheel)/.test(T)) return v.push([T, A, !0, []]);
    let S = [];
    T.includes("-") && (S = T.split("-")), v.push([T, A, !1, S]);
    for (const x in s) {
      const _ = s[x];
      x.startsWith(`${T}-`) && v.push([x, _, !1, x.split("-")]);
    }
  });
  const w = {
    ...s
  };
  return g != null && g.memoizedProps && g != null && g.memoizedProps.args && (w.args = g.memoizedProps.args), g != null && g.memoizedProps && g != null && g.memoizedProps.attach && (w.attach = g.memoizedProps.attach), {
    memoized: w,
    changes: v
  };
}
function Pf(e, t) {
  var n;
  const i = e.__r3f, s = i == null ? void 0 : i.root, l = s == null || s.getState == null ? void 0 : s.getState(), {
    memoized: a,
    changes: f
  } = C2(t) ? t : qv(e, t), p = i == null ? void 0 : i.eventCount;
  e.__r3f && (e.__r3f.memoizedProps = a);
  for (let v = 0; v < f.length; v++) {
    let [w, T, A, L] = f[v];
    if (kf(e)) {
      const R = "srgb", I = "srgb-linear";
      w === "encoding" ? (w = "colorSpace", T = T === 3001 ? R : I) : w === "outputEncoding" && (w = "outputColorSpace", T = T === 3001 ? R : I);
    }
    let S = e, x = S[w];
    if (L.length && (x = L.reduce((_, R) => _[R], e), !(x && x.set))) {
      const [_, ...R] = L.reverse();
      S = R.reverse().reduce((I, O) => I[O], e), w = _;
    }
    if (T === Zv + "remove")
      if (S.constructor) {
        let _ = Kg.get(S.constructor);
        _ || (_ = new S.constructor(), Kg.set(S.constructor, _)), T = _[w];
      } else
        T = 0;
    if (A && i)
      T ? i.handlers[w] = T : delete i.handlers[w], i.eventCount = Object.keys(i.handlers).length;
    else if (x && x.set && (x.copy || x instanceof ie.Layers)) {
      if (Array.isArray(T))
        x.fromArray ? x.fromArray(T) : x.set(...T);
      else if (x.copy && T && T.constructor && // Some environments may break strict identity checks by duplicating versions of three.js.
      // Loosen to unminified names, ignoring descendents.
      // https://github.com/pmndrs/react-three-fiber/issues/2856
      // TODO: fix upstream and remove in v9
      x.constructor === T.constructor)
        x.copy(T);
      else if (T !== void 0) {
        var m;
        const _ = (m = x) == null ? void 0 : m.isColor;
        !_ && x.setScalar ? x.setScalar(T) : x instanceof ie.Layers && T instanceof ie.Layers ? x.mask = T.mask : x.set(T), !Kv() && l && !l.linear && _ && x.convertSRGBToLinear();
      }
    } else {
      var g;
      if (S[w] = T, (g = S[w]) != null && g.isTexture && // sRGB textures must be RGBA8 since r137 https://github.com/mrdoob/three.js/pull/23129
      S[w].format === ie.RGBAFormat && S[w].type === ie.UnsignedByteType && l) {
        const _ = S[w];
        kf(_) && kf(l.gl) ? _.colorSpace = l.gl.outputColorSpace : _.encoding = l.gl.outputEncoding;
      }
    }
    li(e);
  }
  if (i && i.parent && e.raycast && p !== i.eventCount) {
    const v = Vu(e).getState().internal, w = v.interaction.indexOf(e);
    w > -1 && v.interaction.splice(w, 1), i.eventCount && v.interaction.push(e);
  }
  return !(f.length === 1 && f[0][0] === "onUpdate") && f.length && (n = e.__r3f) != null && n.parent && Ud(e), e;
}
function li(e) {
  var t, n;
  const i = (t = e.__r3f) == null || (n = t.root) == null || n.getState == null ? void 0 : n.getState();
  i && i.internal.frames === 0 && i.invalidate();
}
function Ud(e) {
  e.onUpdate == null || e.onUpdate(e);
}
function L2(e, t) {
  e.manual || (Qv(e) ? (e.left = t.width / -2, e.right = t.width / 2, e.top = t.height / 2, e.bottom = t.height / -2) : e.aspect = t.width / t.height, e.updateProjectionMatrix(), e.updateMatrixWorld());
}
function Cu(e) {
  return (e.eventObject || e.object).uuid + "/" + e.index + e.instanceId;
}
function M2() {
  var e;
  const t = typeof self < "u" && self || typeof window < "u" && window;
  if (!t) return wi.DefaultEventPriority;
  switch ((e = t.event) == null ? void 0 : e.type) {
    case "click":
    case "contextmenu":
    case "dblclick":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
      return wi.DiscreteEventPriority;
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "pointerenter":
    case "pointerleave":
    case "wheel":
      return wi.ContinuousEventPriority;
    default:
      return wi.DefaultEventPriority;
  }
}
function $v(e, t, n, i) {
  const s = n.get(t);
  s && (n.delete(t), n.size === 0 && (e.delete(i), s.target.releasePointerCapture(i)));
}
function N2(e, t) {
  const {
    internal: n
  } = e.getState();
  n.interaction = n.interaction.filter((i) => i !== t), n.initialHits = n.initialHits.filter((i) => i !== t), n.hovered.forEach((i, s) => {
    (i.eventObject === t || i.object === t) && n.hovered.delete(s);
  }), n.capturedMap.forEach((i, s) => {
    $v(n.capturedMap, t, i, s);
  });
}
function j2(e) {
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
  function i(p, m) {
    const g = e.getState(), y = /* @__PURE__ */ new Set(), v = [], w = m ? m(g.internal.interaction) : g.internal.interaction;
    for (let S = 0; S < w.length; S++) {
      const x = Ss(w[S]);
      x && (x.raycaster.camera = void 0);
    }
    g.previousRoot || g.events.compute == null || g.events.compute(p, g);
    function T(S) {
      const x = Ss(S);
      if (!x || !x.events.enabled || x.raycaster.camera === null) return [];
      if (x.raycaster.camera === void 0) {
        var _;
        x.events.compute == null || x.events.compute(p, x, (_ = x.previousRoot) == null ? void 0 : _.getState()), x.raycaster.camera === void 0 && (x.raycaster.camera = null);
      }
      return x.raycaster.camera ? x.raycaster.intersectObject(S, !0) : [];
    }
    let A = w.flatMap(T).sort((S, x) => {
      const _ = Ss(S.object), R = Ss(x.object);
      return !_ || !R ? S.distance - x.distance : R.events.priority - _.events.priority || S.distance - x.distance;
    }).filter((S) => {
      const x = Cu(S);
      return y.has(x) ? !1 : (y.add(x), !0);
    });
    g.events.filter && (A = g.events.filter(A, g));
    for (const S of A) {
      let x = S.object;
      for (; x; ) {
        var L;
        (L = x.__r3f) != null && L.eventCount && v.push({
          ...S,
          eventObject: x
        }), x = x.parent;
      }
    }
    if ("pointerId" in p && g.internal.capturedMap.has(p.pointerId))
      for (let S of g.internal.capturedMap.get(p.pointerId).values())
        y.has(Cu(S.intersection)) || v.push(S.intersection);
    return v;
  }
  function s(p, m, g, y) {
    const v = e.getState();
    if (p.length) {
      const w = {
        stopped: !1
      };
      for (const T of p) {
        const A = Ss(T.object) || v, {
          raycaster: L,
          pointer: S,
          camera: x,
          internal: _
        } = A, R = new ie.Vector3(S.x, S.y, 0).unproject(x), I = (V) => {
          var Q, le;
          return (Q = (le = _.capturedMap.get(V)) == null ? void 0 : le.has(T.eventObject)) != null ? Q : !1;
        }, O = (V) => {
          const Q = {
            intersection: T,
            target: m.target
          };
          _.capturedMap.has(V) ? _.capturedMap.get(V).set(T.eventObject, Q) : _.capturedMap.set(V, /* @__PURE__ */ new Map([[T.eventObject, Q]])), m.target.setPointerCapture(V);
        }, D = (V) => {
          const Q = _.capturedMap.get(V);
          Q && $v(_.capturedMap, T.eventObject, Q, V);
        };
        let B = {};
        for (let V in m) {
          let Q = m[V];
          typeof Q != "function" && (B[V] = Q);
        }
        let q = {
          ...T,
          ...B,
          pointer: S,
          intersections: p,
          stopped: w.stopped,
          delta: g,
          unprojectedPoint: R,
          ray: L.ray,
          camera: x,
          // Hijack stopPropagation, which just sets a flag
          stopPropagation() {
            const V = "pointerId" in m && _.capturedMap.get(m.pointerId);
            if (
              // ...if this pointer hasn't been captured
              (!V || // ... or if the hit object is capturing the pointer
              V.has(T.eventObject)) && (q.stopped = w.stopped = !0, _.hovered.size && Array.from(_.hovered.values()).find((Q) => Q.eventObject === T.eventObject))
            ) {
              const Q = p.slice(0, p.indexOf(T));
              l([...Q, T]);
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
        if (y(q), w.stopped === !0) break;
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
        const v = g.eventObject.__r3f, w = v == null ? void 0 : v.handlers;
        if (m.hovered.delete(Cu(g)), v != null && v.eventCount) {
          const T = {
            ...g,
            intersections: p
          };
          w.onPointerOut == null || w.onPointerOut(T), w.onPointerLeave == null || w.onPointerLeave(T);
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
      const w = p === "onPointerMove", T = p === "onClick" || p === "onContextMenu" || p === "onDoubleClick", L = i(g, w ? n : void 0), S = T ? t(g) : 0;
      p === "onPointerDown" && (v.initialClick = [g.offsetX, g.offsetY], v.initialHits = L.map((_) => _.eventObject)), T && !L.length && S <= 2 && (a(g, v.interaction), y && y(g)), w && l(L);
      function x(_) {
        const R = _.eventObject, I = R.__r3f, O = I == null ? void 0 : I.handlers;
        if (I != null && I.eventCount)
          if (w) {
            if (O.onPointerOver || O.onPointerEnter || O.onPointerOut || O.onPointerLeave) {
              const D = Cu(_), B = v.hovered.get(D);
              B ? B.stopped && _.stopPropagation() : (v.hovered.set(D, _), O.onPointerOver == null || O.onPointerOver(_), O.onPointerEnter == null || O.onPointerEnter(_));
            }
            O.onPointerMove == null || O.onPointerMove(_);
          } else {
            const D = O[p];
            D ? (!T || v.initialHits.includes(R)) && (a(g, v.interaction.filter((B) => !v.initialHits.includes(B))), D(_)) : T && v.initialHits.includes(R) && a(g, v.interaction.filter((B) => !v.initialHits.includes(B)));
          }
      }
      s(L, g, S, x);
    };
  }
  return {
    handlePointer: f
  };
}
const bv = (e) => !!(e != null && e.render), e1 = /* @__PURE__ */ W.createContext(null), z2 = (e, t) => {
  const n = m2((f, p) => {
    const m = new ie.Vector3(), g = new ie.Vector3(), y = new ie.Vector3();
    function v(S = p().camera, x = g, _ = p().size) {
      const {
        width: R,
        height: I,
        top: O,
        left: D
      } = _, B = R / I;
      x.isVector3 ? y.copy(x) : y.set(...x);
      const q = S.getWorldPosition(m).distanceTo(y);
      if (Qv(S))
        return {
          width: R / S.zoom,
          height: I / S.zoom,
          top: O,
          left: D,
          factor: 1,
          distance: q,
          aspect: B
        };
      {
        const V = S.fov * Math.PI / 180, Q = 2 * Math.tan(V / 2) * q, le = Q * (R / I);
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
    let w;
    const T = (S) => f((x) => ({
      performance: {
        ...x.performance,
        current: S
      }
    })), A = new ie.Vector2();
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
      invalidate: (S = 1) => e(p(), S),
      advance: (S, x) => t(S, x, p()),
      legacy: !1,
      linear: !1,
      flat: !1,
      controls: null,
      clock: new ie.Clock(),
      pointer: A,
      mouse: A,
      frameloop: "always",
      onPointerMissed: void 0,
      performance: {
        current: 1,
        min: 0.5,
        max: 1,
        debounce: 200,
        regress: () => {
          const S = p();
          w && clearTimeout(w), S.performance.current !== S.performance.min && T(S.performance.min), w = setTimeout(() => T(p().performance.max), S.performance.debounce);
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
      setEvents: (S) => f((x) => ({
        ...x,
        events: {
          ...x.events,
          ...S
        }
      })),
      setSize: (S, x, _, R, I) => {
        const O = p().camera, D = {
          width: S,
          height: x,
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
      setDpr: (S) => f((x) => {
        const _ = Jv(S);
        return {
          viewport: {
            ...x.viewport,
            dpr: _,
            initialDpr: x.viewport.initialDpr || _
          }
        };
      }),
      setFrameloop: (S = "always") => {
        const x = p().clock;
        x.stop(), x.elapsedTime = 0, S !== "never" && (x.start(), x.elapsedTime = 0), f(() => ({
          frameloop: S
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
        subscribe: (S, x, _) => {
          const R = p().internal;
          return R.priority = R.priority + (x > 0 ? 1 : 0), R.subscribers.push({
            ref: S,
            priority: x,
            store: _
          }), R.subscribers = R.subscribers.sort((I, O) => I.priority - O.priority), () => {
            const I = p().internal;
            I != null && I.subscribers && (I.priority = I.priority - (x > 0 ? 1 : 0), I.subscribers = I.subscribers.filter((O) => O.ref !== S));
          };
        }
      }
    };
  }), i = n.getState();
  let s = i.size, l = i.viewport.dpr, a = i.camera;
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
      s = p, l = m.dpr, L2(f, p), g.setPixelRatio(m.dpr);
      const w = (v = p.updateStyle) != null ? v : typeof HTMLCanvasElement < "u" && g.domElement instanceof HTMLCanvasElement;
      g.setSize(p.width, p.height, w);
    }
    f !== a && (a = f, y((w) => ({
      viewport: {
        ...w.viewport,
        ...w.viewport.getCurrentViewport(f)
      }
    })));
  }), n.subscribe((f) => e(f)), n;
};
let Ru, I2 = /* @__PURE__ */ new Set(), O2 = /* @__PURE__ */ new Set(), D2 = /* @__PURE__ */ new Set();
function Cf(e, t) {
  if (e.size)
    for (const {
      callback: n
    } of e.values())
      n(t);
}
function ws(e, t) {
  switch (e) {
    case "before":
      return Cf(I2, t);
    case "after":
      return Cf(O2, t);
    case "tail":
      return Cf(D2, t);
  }
}
let Rf, Af;
function Lf(e, t, n) {
  let i = t.clock.getDelta();
  for (t.frameloop === "never" && typeof e == "number" && (i = e - t.clock.elapsedTime, t.clock.oldTime = t.clock.elapsedTime, t.clock.elapsedTime = e), Rf = t.internal.subscribers, Ru = 0; Ru < Rf.length; Ru++)
    Af = Rf[Ru], Af.ref.current(Af.store.getState(), i, n);
  return !t.internal.priority && t.gl.render && t.gl.render(t.scene, t.camera), t.internal.frames = Math.max(0, t.internal.frames - 1), t.frameloop === "always" ? 1 : t.internal.frames;
}
function F2(e) {
  let t = !1, n = !1, i, s, l;
  function a(m) {
    s = requestAnimationFrame(a), t = !0, i = 0, ws("before", m), n = !0;
    for (const y of e.values()) {
      var g;
      l = y.store.getState(), l.internal.active && (l.frameloop === "always" || l.internal.frames > 0) && !((g = l.gl.xr) != null && g.isPresenting) && (i += Lf(m, l));
    }
    if (n = !1, ws("after", m), i === 0)
      return ws("tail", m), t = !1, cancelAnimationFrame(s);
  }
  function f(m, g = 1) {
    var y;
    if (!m) return e.forEach((v) => f(v.store.getState(), g));
    (y = m.gl.xr) != null && y.isPresenting || !m.internal.active || m.frameloop === "never" || (g > 1 ? m.internal.frames = Math.min(60, m.internal.frames + g) : n ? m.internal.frames = 2 : m.internal.frames = 1, t || (t = !0, requestAnimationFrame(a)));
  }
  function p(m, g = !0, y, v) {
    if (g && ws("before", m), y) Lf(m, y, v);
    else for (const w of e.values()) Lf(m, w.store.getState());
    g && ws("after", m);
  }
  return {
    loop: a,
    invalidate: f,
    advance: p
  };
}
function t1() {
  const e = W.useContext(e1);
  if (!e) throw new Error("R3F: Hooks can only be used within the Canvas component!");
  return e;
}
function U2(e = (n) => n, t) {
  return t1()(e, t);
}
function $n(e, t = 0) {
  const n = t1(), i = n.getState().internal.subscribe, s = Xv(e);
  return pl(() => i(s, t, n), [t, i, n]), null;
}
const Yg = /* @__PURE__ */ new WeakMap();
function n1(e, t) {
  return function(n, ...i) {
    let s = Yg.get(n);
    return s || (s = new n(), Yg.set(n, s)), e && e(s), Promise.all(i.map((l) => new Promise((a, f) => s.load(l, (p) => {
      p.scene && Object.assign(p, R2(p.scene)), a(p);
    }, t, (p) => f(new Error(`Could not load ${l}: ${p == null ? void 0 : p.message}`))))));
  };
}
function Dp(e, t, n, i) {
  const s = Array.isArray(t) ? t : [t], l = y2(n1(n, i), [e, ...s], {
    equal: Ee.equ
  });
  return Array.isArray(t) ? l : l[0];
}
Dp.preload = function(e, t, n) {
  const i = Array.isArray(t) ? t : [t];
  return v2(n1(n), [e, ...i]);
};
Dp.clear = function(e, t) {
  const n = Array.isArray(t) ? t : [t];
  return x2([e, ...n]);
};
const Fi = /* @__PURE__ */ new Map(), {
  invalidate: Zg,
  advance: Jg
} = F2(Fi), {
  reconciler: wa,
  applyProps: ti
} = k2(Fi, M2), ni = {
  objects: "shallow",
  strict: !1
}, H2 = (e, t) => {
  const n = typeof e == "function" ? e(t) : e;
  return bv(n) ? n : new ie.WebGLRenderer({
    powerPreference: "high-performance",
    canvas: t,
    antialias: !0,
    alpha: !0,
    ...e
  });
};
function B2(e, t) {
  const n = typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement;
  if (t) {
    const {
      width: i,
      height: s,
      top: l,
      left: a,
      updateStyle: f = n
    } = t;
    return {
      width: i,
      height: s,
      top: l,
      left: a,
      updateStyle: f
    };
  } else if (typeof HTMLCanvasElement < "u" && e instanceof HTMLCanvasElement && e.parentElement) {
    const {
      width: i,
      height: s,
      top: l,
      left: a
    } = e.parentElement.getBoundingClientRect();
    return {
      width: i,
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
function G2(e) {
  const t = Fi.get(e), n = t == null ? void 0 : t.fiber, i = t == null ? void 0 : t.store;
  t && console.warn("R3F.createRoot should only be called once!");
  const s = typeof reportError == "function" ? (
    // In modern browsers, reportError will dispatch an error event,
    // emulating an uncaught JavaScript error.
    reportError
  ) : (
    // In older browsers and test environments, fallback to console.error.
    console.error
  ), l = i || z2(Zg, Jg), a = n || wa.createContainer(l, wi.ConcurrentRoot, null, !1, null, "", s, null);
  t || Fi.set(e, {
    fiber: a,
    store: l
  });
  let f, p = !1, m;
  return {
    configure(g = {}) {
      let {
        gl: y,
        size: v,
        scene: w,
        events: T,
        onCreated: A,
        shadows: L = !1,
        linear: S = !1,
        flat: x = !1,
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
        gl: le = H2(y, e)
      });
      let xe = Q.raycaster;
      xe || Q.set({
        raycaster: xe = new ie.Raycaster()
      });
      const {
        params: kt,
        ...Bt
      } = B || {};
      if (Ee.equ(Bt, xe, ni) || ti(xe, {
        ...Bt
      }), Ee.equ(kt, xe.params, ni) || ti(xe, {
        params: {
          ...xe.params,
          ...kt
        }
      }), !Q.camera || Q.camera === m && !Ee.equ(m, q, ni)) {
        m = q;
        const F = q instanceof ie.Camera, Y = F ? q : R ? new ie.OrthographicCamera(0, 0, 0, 0, 0.1, 1e3) : new ie.PerspectiveCamera(75, 0, 0.1, 1e3);
        F || (Y.position.z = 5, q && (ti(Y, q), ("aspect" in q || "left" in q || "right" in q || "bottom" in q || "top" in q) && (Y.manual = !0, Y.updateProjectionMatrix())), !Q.camera && !(q != null && q.rotation) && Y.lookAt(0, 0, 0)), Q.set({
          camera: Y
        }), xe.camera = Y;
      }
      if (!Q.scene) {
        let F;
        w != null && w.isScene ? F = w : (F = new ie.Scene(), w && ti(F, w)), Q.set({
          scene: si(F)
        });
      }
      if (!Q.xr) {
        var be;
        const F = (ce, ze) => {
          const ot = l.getState();
          ot.frameloop !== "never" && Jg(ce, !0, ot, ze);
        }, Y = () => {
          const ce = l.getState();
          ce.gl.xr.enabled = ce.gl.xr.isPresenting, ce.gl.xr.setAnimationLoop(ce.gl.xr.isPresenting ? F : null), ce.gl.xr.isPresenting || Zg(ce);
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
        if (le.shadowMap.enabled = !!L, Ee.boo(L))
          le.shadowMap.type = ie.PCFSoftShadowMap;
        else if (Ee.str(L)) {
          var Tt;
          const te = {
            basic: ie.BasicShadowMap,
            percentage: ie.PCFShadowMap,
            soft: ie.PCFSoftShadowMap,
            variance: ie.VSMShadowMap
          };
          le.shadowMap.type = (Tt = te[L]) != null ? Tt : ie.PCFSoftShadowMap;
        } else Ee.obj(L) && Object.assign(le.shadowMap, L);
        (F !== le.shadowMap.enabled || Y !== le.shadowMap.type) && (le.shadowMap.needsUpdate = !0);
      }
      const N = Kv();
      N && ("enabled" in N ? N.enabled = !_ : "legacyMode" in N && (N.legacyMode = _)), p || ti(le, {
        outputEncoding: S ? 3e3 : 3001,
        toneMapping: x ? ie.NoToneMapping : ie.ACESFilmicToneMapping
      }), Q.legacy !== _ && Q.set(() => ({
        legacy: _
      })), Q.linear !== S && Q.set(() => ({
        linear: S
      })), Q.flat !== x && Q.set(() => ({
        flat: x
      })), y && !Ee.fun(y) && !bv(y) && !Ee.equ(y, le, ni) && ti(le, y), T && !Q.events.handlers && Q.set({
        events: T(l)
      });
      const U = B2(e, v);
      return Ee.equ(U, Q.size, ni) || Q.setSize(U.width, U.height, U.updateStyle, U.top, U.left), O && Q.viewport.dpr !== Jv(O) && Q.setDpr(O), Q.frameloop !== I && Q.setFrameloop(I), Q.onPointerMissed || Q.set({
        onPointerMissed: V
      }), D && !Ee.equ(D, Q.performance, ni) && Q.set((F) => ({
        performance: {
          ...F.performance,
          ...D
        }
      })), f = A, p = !0, this;
    },
    render(g) {
      return p || this.configure(), wa.updateContainer(/* @__PURE__ */ E.jsx(W2, {
        store: l,
        children: g,
        onCreated: f,
        rootElement: e
      }), a, null, () => {
      }), l;
    },
    unmount() {
      r1(e);
    }
  };
}
function W2({
  store: e,
  children: t,
  onCreated: n,
  rootElement: i
}) {
  return pl(() => {
    const s = e.getState();
    s.set((l) => ({
      internal: {
        ...l.internal,
        active: !0
      }
    })), n && n(s), e.getState().events.connected || s.events.connect == null || s.events.connect(i);
  }, []), /* @__PURE__ */ E.jsx(e1.Provider, {
    value: e,
    children: t
  });
}
function r1(e, t) {
  const n = Fi.get(e), i = n == null ? void 0 : n.fiber;
  if (i) {
    const s = n == null ? void 0 : n.store.getState();
    s && (s.internal.active = !1), wa.updateContainer(null, i, null, () => {
      s && setTimeout(() => {
        try {
          var l, a, f, p;
          s.events.disconnect == null || s.events.disconnect(), (l = s.gl) == null || (a = l.renderLists) == null || a.dispose == null || a.dispose(), (f = s.gl) == null || f.forceContextLoss == null || f.forceContextLoss(), (p = s.gl) != null && p.xr && s.xr.disconnect(), A2(s), Fi.delete(e);
        } catch {
        }
      }, 500);
    });
  }
}
wa.injectIntoDevTools({
  bundleType: 0,
  rendererPackageName: "@react-three/fiber",
  version: W.version
});
const Mf = {
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
function V2(e) {
  const {
    handlePointer: t
  } = j2(e);
  return {
    priority: 1,
    enabled: !0,
    compute(n, i, s) {
      i.pointer.set(n.offsetX / i.size.width * 2 - 1, -(n.offsetY / i.size.height) * 2 + 1), i.raycaster.setFromCamera(i.pointer, i.camera);
    },
    connected: void 0,
    handlers: Object.keys(Mf).reduce((n, i) => ({
      ...n,
      [i]: t(i)
    }), {}),
    update: () => {
      var n;
      const {
        events: i,
        internal: s
      } = e.getState();
      (n = s.lastEvent) != null && n.current && i.handlers && i.handlers.onPointerMove(s.lastEvent.current);
    },
    connect: (n) => {
      var i;
      const {
        set: s,
        events: l
      } = e.getState();
      l.disconnect == null || l.disconnect(), s((a) => ({
        events: {
          ...a.events,
          connected: n
        }
      })), Object.entries((i = l.handlers) != null ? i : []).forEach(([a, f]) => {
        const [p, m] = Mf[a];
        n.addEventListener(p, f, {
          passive: m
        });
      });
    },
    disconnect: () => {
      const {
        set: n,
        events: i
      } = e.getState();
      if (i.connected) {
        var s;
        Object.entries((s = i.handlers) != null ? s : []).forEach(([l, a]) => {
          if (i && i.connected instanceof HTMLElement) {
            const [f] = Mf[l];
            i.connected.removeEventListener(f, a);
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
function qg(e, t) {
  let n;
  return (...i) => {
    window.clearTimeout(n), n = window.setTimeout(() => e(...i), t);
  };
}
function K2({ debounce: e, scroll: t, polyfill: n, offsetSize: i } = { debounce: 0, scroll: !1, offsetSize: !1 }) {
  const s = n || (typeof window > "u" ? class {
  } : window.ResizeObserver);
  if (!s) throw new Error("This browser does not support ResizeObserver out of the box. See: https://github.com/react-spring/react-use-measure/#resize-observer-polyfills");
  const [l, a] = W.useState({ left: 0, top: 0, width: 0, height: 0, bottom: 0, right: 0, x: 0, y: 0 }), f = W.useRef({ element: null, scrollContainers: null, resizeObserver: null, lastBounds: l, orientationHandler: null }), p = e ? typeof e == "number" ? e : e.scroll : null, m = e ? typeof e == "number" ? e : e.resize : null, g = W.useRef(!1);
  W.useEffect(() => (g.current = !0, () => void (g.current = !1)));
  const [y, v, w] = W.useMemo(() => {
    const S = () => {
      if (!f.current.element) return;
      const { left: x, top: _, width: R, height: I, bottom: O, right: D, x: B, y: q } = f.current.element.getBoundingClientRect(), V = { left: x, top: _, width: R, height: I, bottom: O, right: D, x: B, y: q };
      f.current.element instanceof HTMLElement && i && (V.height = f.current.element.offsetHeight, V.width = f.current.element.offsetWidth), Object.freeze(V), g.current && !Z2(f.current.lastBounds, V) && a(f.current.lastBounds = V);
    };
    return [S, m ? qg(S, m) : S, p ? qg(S, p) : S];
  }, [a, i, p, m]);
  function T() {
    f.current.scrollContainers && (f.current.scrollContainers.forEach((S) => S.removeEventListener("scroll", w, !0)), f.current.scrollContainers = null), f.current.resizeObserver && (f.current.resizeObserver.disconnect(), f.current.resizeObserver = null), f.current.orientationHandler && ("orientation" in screen && "removeEventListener" in screen.orientation ? screen.orientation.removeEventListener("change", f.current.orientationHandler) : "onorientationchange" in window && window.removeEventListener("orientationchange", f.current.orientationHandler));
  }
  function A() {
    f.current.element && (f.current.resizeObserver = new s(w), f.current.resizeObserver.observe(f.current.element), t && f.current.scrollContainers && f.current.scrollContainers.forEach((S) => S.addEventListener("scroll", w, { capture: !0, passive: !0 })), f.current.orientationHandler = () => {
      w();
    }, "orientation" in screen && "addEventListener" in screen.orientation ? screen.orientation.addEventListener("change", f.current.orientationHandler) : "onorientationchange" in window && window.addEventListener("orientationchange", f.current.orientationHandler));
  }
  const L = (S) => {
    !S || S === f.current.element || (T(), f.current.element = S, f.current.scrollContainers = o1(S), A());
  };
  return X2(w, !!t), Q2(v), W.useEffect(() => {
    T(), A();
  }, [t, w, v]), W.useEffect(() => T, []), [L, l, y];
}
function Q2(e) {
  W.useEffect(() => {
    const t = e;
    return window.addEventListener("resize", t), () => void window.removeEventListener("resize", t);
  }, [e]);
}
function X2(e, t) {
  W.useEffect(() => {
    if (t) {
      const n = e;
      return window.addEventListener("scroll", n, { capture: !0, passive: !0 }), () => void window.removeEventListener("scroll", n, !0);
    }
  }, [e, t]);
}
function o1(e) {
  const t = [];
  if (!e || e === document.body) return t;
  const { overflow: n, overflowX: i, overflowY: s } = window.getComputedStyle(e);
  return [n, i, s].some((l) => l === "auto" || l === "scroll") && t.push(e), [...t, ...o1(e.parentElement)];
}
const Y2 = ["x", "y", "top", "bottom", "left", "right", "width", "height"], Z2 = (e, t) => Y2.every((n) => e[n] === t[n]);
var J2 = Object.defineProperty, q2 = Object.defineProperties, $2 = Object.getOwnPropertyDescriptors, $g = Object.getOwnPropertySymbols, b2 = Object.prototype.hasOwnProperty, eE = Object.prototype.propertyIsEnumerable, bg = (e, t, n) => t in e ? J2(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : e[t] = n, ey = (e, t) => {
  for (var n in t || (t = {}))
    b2.call(t, n) && bg(e, n, t[n]);
  if ($g)
    for (var n of $g(t))
      eE.call(t, n) && bg(e, n, t[n]);
  return e;
}, tE = (e, t) => q2(e, $2(t)), ty, ny;
typeof window < "u" && ((ty = window.document) != null && ty.createElement || ((ny = window.navigator) == null ? void 0 : ny.product) === "ReactNative") ? W.useLayoutEffect : W.useEffect;
function i1(e, t, n) {
  if (!e)
    return;
  if (n(e) === !0)
    return e;
  let i = e.child;
  for (; i; ) {
    const s = i1(i, t, n);
    if (s)
      return s;
    i = i.sibling;
  }
}
function s1(e) {
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
const ry = console.error;
console.error = function() {
  const e = [...arguments].join("");
  if (e != null && e.startsWith("Warning:") && e.includes("useContext")) {
    console.error = ry;
    return;
  }
  return ry.apply(this, arguments);
};
const Fp = s1(W.createContext(null));
class l1 extends W.Component {
  render() {
    return /* @__PURE__ */ W.createElement(Fp.Provider, {
      value: this._reactInternals
    }, this.props.children);
  }
}
function nE() {
  const e = W.useContext(Fp);
  if (e === null)
    throw new Error("its-fine: useFiber must be called within a <FiberProvider />!");
  const t = W.useId();
  return W.useMemo(() => {
    for (const i of [e, e == null ? void 0 : e.alternate]) {
      if (!i)
        continue;
      const s = i1(i, !1, (l) => {
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
function rE() {
  const e = nE(), [t] = W.useState(() => /* @__PURE__ */ new Map());
  t.clear();
  let n = e;
  for (; n; ) {
    if (n.type && typeof n.type == "object") {
      const s = n.type._context === void 0 && n.type.Provider === n.type ? n.type : n.type._context;
      s && s !== Fp && !t.has(s) && t.set(s, W.useContext(s1(s)));
    }
    n = n.return;
  }
  return t;
}
function oE() {
  const e = rE();
  return W.useMemo(
    () => Array.from(e.keys()).reduce(
      (t, n) => (i) => /* @__PURE__ */ W.createElement(t, null, /* @__PURE__ */ W.createElement(n.Provider, tE(ey({}, i), {
        value: e.get(n)
      }))),
      (t) => /* @__PURE__ */ W.createElement(l1, ey({}, t))
    ),
    [e]
  );
}
const iE = /* @__PURE__ */ W.forwardRef(function({
  children: t,
  fallback: n,
  resize: i,
  style: s,
  gl: l,
  events: a = V2,
  eventSource: f,
  eventPrefix: p,
  shadows: m,
  linear: g,
  flat: y,
  legacy: v,
  orthographic: w,
  frameloop: T,
  dpr: A,
  performance: L,
  raycaster: S,
  camera: x,
  scene: _,
  onPointerMissed: R,
  onCreated: I,
  ...O
}, D) {
  W.useMemo(() => E2(ie), []);
  const B = oE(), [q, V] = K2({
    scroll: !0,
    debounce: {
      scroll: 50,
      resize: 0
    },
    ...i
  }), Q = W.useRef(null), le = W.useRef(null);
  W.useImperativeHandle(D, () => Q.current);
  const xe = Xv(R), [kt, Bt] = W.useState(!1), [be, Tt] = W.useState(!1);
  if (kt) throw kt;
  if (be) throw be;
  const N = W.useRef(null);
  pl(() => {
    const F = Q.current;
    V.width > 0 && V.height > 0 && F && (N.current || (N.current = G2(F)), N.current.configure({
      gl: l,
      events: a,
      shadows: m,
      linear: g,
      flat: y,
      legacy: v,
      orthographic: w,
      frameloop: T,
      dpr: A,
      performance: L,
      raycaster: S,
      camera: x,
      scene: _,
      size: V,
      // Pass mutable reference to onPointerMissed so it's free to update
      onPointerMissed: (...Y) => xe.current == null ? void 0 : xe.current(...Y),
      onCreated: (Y) => {
        Y.events.connect == null || Y.events.connect(f ? T2(f) ? f.current : f : le.current), p && Y.setEvents({
          compute: (te, ce) => {
            const ze = te[p + "X"], ot = te[p + "Y"];
            ce.pointer.set(ze / ce.size.width * 2 - 1, -(ot / ce.size.height) * 2 + 1), ce.raycaster.setFromCamera(ce.pointer, ce.camera);
          }
        }), I == null || I(Y);
      }
    }), N.current.render(/* @__PURE__ */ E.jsx(B, {
      children: /* @__PURE__ */ E.jsx(Yv, {
        set: Tt,
        children: /* @__PURE__ */ E.jsx(W.Suspense, {
          fallback: /* @__PURE__ */ E.jsx(P2, {
            set: Bt
          }),
          children: t ?? null
        })
      })
    })));
  }), W.useEffect(() => {
    const F = Q.current;
    if (F) return () => r1(F);
  }, []);
  const U = f ? "none" : "auto";
  return /* @__PURE__ */ E.jsx("div", {
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
    children: /* @__PURE__ */ E.jsx("div", {
      ref: q,
      style: {
        width: "100%",
        height: "100%"
      },
      children: /* @__PURE__ */ E.jsx("canvas", {
        ref: Q,
        style: {
          display: "block"
        },
        children: n
      })
    })
  });
}), sE = /* @__PURE__ */ W.forwardRef(function(t, n) {
  return /* @__PURE__ */ E.jsx(l1, {
    children: /* @__PURE__ */ E.jsx(iE, {
      ...t,
      ref: n
    })
  });
});
function oy(e, t) {
  if (t === nS)
    return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."), e;
  if (t === Bf || t === yy) {
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
    const i = n.count - 2, s = [];
    if (t === Bf)
      for (let a = 1; a <= i; a++)
        s.push(n.getX(0)), s.push(n.getX(a)), s.push(n.getX(a + 1));
    else
      for (let a = 0; a < i; a++)
        a % 2 === 0 ? (s.push(n.getX(a)), s.push(n.getX(a + 1)), s.push(n.getX(a + 2))) : (s.push(n.getX(a + 2)), s.push(n.getX(a + 1)), s.push(n.getX(a)));
    s.length / 3 !== i && console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");
    const l = e.clone();
    return l.setIndex(s), l.clearGroups(), l;
  } else
    return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:", t), e;
}
class lE extends vy {
  constructor(t) {
    super(t), this.dracoLoader = null, this.ktx2Loader = null, this.meshoptDecoder = null, this.pluginCallbacks = [], this.register(function(n) {
      return new dE(n);
    }), this.register(function(n) {
      return new pE(n);
    }), this.register(function(n) {
      return new _E(n);
    }), this.register(function(n) {
      return new EE(n);
    }), this.register(function(n) {
      return new kE(n);
    }), this.register(function(n) {
      return new mE(n);
    }), this.register(function(n) {
      return new gE(n);
    }), this.register(function(n) {
      return new yE(n);
    }), this.register(function(n) {
      return new vE(n);
    }), this.register(function(n) {
      return new fE(n);
    }), this.register(function(n) {
      return new xE(n);
    }), this.register(function(n) {
      return new hE(n);
    }), this.register(function(n) {
      return new wE(n);
    }), this.register(function(n) {
      return new SE(n);
    }), this.register(function(n) {
      return new aE(n);
    }), this.register(function(n) {
      return new TE(n);
    }), this.register(function(n) {
      return new PE(n);
    });
  }
  load(t, n, i, s) {
    const l = this;
    let a;
    if (this.resourcePath !== "")
      a = this.resourcePath;
    else if (this.path !== "") {
      const m = js.extractUrlBase(t);
      a = js.resolveURL(m, this.path);
    } else
      a = js.extractUrlBase(t);
    this.manager.itemStart(t);
    const f = function(m) {
      s ? s(m) : console.error(m), l.manager.itemError(t), l.manager.itemEnd(t);
    }, p = new Yu(this.manager);
    p.setPath(this.path), p.setResponseType("arraybuffer"), p.setRequestHeader(this.requestHeader), p.setWithCredentials(this.withCredentials), p.load(t, function(m) {
      try {
        l.parse(m, a, function(g) {
          n(g), l.manager.itemEnd(t);
        }, f);
      } catch (g) {
        f(g);
      }
    }, i, f);
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
  parse(t, n, i, s) {
    let l;
    const a = {}, f = {}, p = new TextDecoder();
    if (typeof t == "string")
      l = JSON.parse(t);
    else if (t instanceof ArrayBuffer)
      if (p.decode(new Uint8Array(t, 0, 4)) === u1) {
        try {
          a[ue.KHR_BINARY_GLTF] = new CE(t);
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
    const m = new HE(l, {
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
            a[y] = new cE();
            break;
          case ue.KHR_DRACO_MESH_COMPRESSION:
            a[y] = new RE(l, this.dracoLoader);
            break;
          case ue.KHR_TEXTURE_TRANSFORM:
            a[y] = new AE();
            break;
          case ue.KHR_MESH_QUANTIZATION:
            a[y] = new LE();
            break;
          default:
            v.indexOf(y) >= 0 && f[y] === void 0 && console.warn('THREE.GLTFLoader: Unknown extension "' + y + '".');
        }
      }
    m.setExtensions(a), m.setPlugins(f), m.parse(i, s);
  }
  parseAsync(t, n) {
    const i = this;
    return new Promise(function(s, l) {
      i.parse(t, n, s, l);
    });
  }
}
function uE() {
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
class aE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_LIGHTS_PUNCTUAL, this.cache = { refs: {}, uses: {} };
  }
  _markDefs() {
    const t = this.parser, n = this.parser.json.nodes || [];
    for (let i = 0, s = n.length; i < s; i++) {
      const l = n[i];
      l.extensions && l.extensions[this.name] && l.extensions[this.name].light !== void 0 && t._addNodeRef(this.cache, l.extensions[this.name].light);
    }
  }
  _loadLight(t) {
    const n = this.parser, i = "light:" + t;
    let s = n.cache.get(i);
    if (s) return s;
    const l = n.json, p = ((l.extensions && l.extensions[this.name] || {}).lights || [])[t];
    let m;
    const g = new Zr(16777215);
    p.color !== void 0 && g.setRGB(p.color[0], p.color[1], p.color[2], Jn);
    const y = p.range !== void 0 ? p.range : 0;
    switch (p.type) {
      case "directional":
        m = new iS(g), m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      case "point":
        m = new oS(g), m.distance = y;
        break;
      case "spot":
        m = new rS(g), m.distance = y, p.spot = p.spot || {}, p.spot.innerConeAngle = p.spot.innerConeAngle !== void 0 ? p.spot.innerConeAngle : 0, p.spot.outerConeAngle = p.spot.outerConeAngle !== void 0 ? p.spot.outerConeAngle : Math.PI / 4, m.angle = p.spot.outerConeAngle, m.penumbra = 1 - p.spot.innerConeAngle / p.spot.outerConeAngle, m.target.position.set(0, 0, -1), m.add(m.target);
        break;
      default:
        throw new Error("THREE.GLTFLoader: Unexpected light type: " + p.type);
    }
    return m.position.set(0, 0, 0), m.decay = 2, sr(m, p), p.intensity !== void 0 && (m.intensity = p.intensity), m.name = n.createUniqueName(p.name || "light_" + t), s = Promise.resolve(m), n.cache.add(i, s), s;
  }
  getDependency(t, n) {
    if (t === "light")
      return this._loadLight(n);
  }
  createNodeAttachment(t) {
    const n = this, i = this.parser, l = i.json.nodes[t], f = (l.extensions && l.extensions[this.name] || {}).light;
    return f === void 0 ? null : this._loadLight(f).then(function(p) {
      return i._getNodeRef(n.cache, f, p);
    });
  }
}
class cE {
  constructor() {
    this.name = ue.KHR_MATERIALS_UNLIT;
  }
  getMaterialType() {
    return Ts;
  }
  extendParams(t, n, i) {
    const s = [];
    t.color = new Zr(1, 1, 1), t.opacity = 1;
    const l = n.pbrMetallicRoughness;
    if (l) {
      if (Array.isArray(l.baseColorFactor)) {
        const a = l.baseColorFactor;
        t.color.setRGB(a[0], a[1], a[2], Jn), t.opacity = a[3];
      }
      l.baseColorTexture !== void 0 && s.push(i.assignTexture(t, "map", l.baseColorTexture, Hr));
    }
    return Promise.all(s);
  }
}
class fE {
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
class dE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_CLEARCOAT;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    if (a.clearcoatFactor !== void 0 && (n.clearcoat = a.clearcoatFactor), a.clearcoatTexture !== void 0 && l.push(i.assignTexture(n, "clearcoatMap", a.clearcoatTexture)), a.clearcoatRoughnessFactor !== void 0 && (n.clearcoatRoughness = a.clearcoatRoughnessFactor), a.clearcoatRoughnessTexture !== void 0 && l.push(i.assignTexture(n, "clearcoatRoughnessMap", a.clearcoatRoughnessTexture)), a.clearcoatNormalTexture !== void 0 && (l.push(i.assignTexture(n, "clearcoatNormalMap", a.clearcoatNormalTexture)), a.clearcoatNormalTexture.scale !== void 0)) {
      const f = a.clearcoatNormalTexture.scale;
      n.clearcoatNormalScale = new Xt(f, f);
    }
    return Promise.all(l);
  }
}
class pE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_DISPERSION;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const s = this.parser.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = s.extensions[this.name];
    return n.dispersion = l.dispersion !== void 0 ? l.dispersion : 0, Promise.resolve();
  }
}
class hE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_IRIDESCENCE;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return a.iridescenceFactor !== void 0 && (n.iridescence = a.iridescenceFactor), a.iridescenceTexture !== void 0 && l.push(i.assignTexture(n, "iridescenceMap", a.iridescenceTexture)), a.iridescenceIor !== void 0 && (n.iridescenceIOR = a.iridescenceIor), n.iridescenceThicknessRange === void 0 && (n.iridescenceThicknessRange = [100, 400]), a.iridescenceThicknessMinimum !== void 0 && (n.iridescenceThicknessRange[0] = a.iridescenceThicknessMinimum), a.iridescenceThicknessMaximum !== void 0 && (n.iridescenceThicknessRange[1] = a.iridescenceThicknessMaximum), a.iridescenceThicknessTexture !== void 0 && l.push(i.assignTexture(n, "iridescenceThicknessMap", a.iridescenceThicknessTexture)), Promise.all(l);
  }
}
class mE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_SHEEN;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [];
    n.sheenColor = new Zr(0, 0, 0), n.sheenRoughness = 0, n.sheen = 1;
    const a = s.extensions[this.name];
    if (a.sheenColorFactor !== void 0) {
      const f = a.sheenColorFactor;
      n.sheenColor.setRGB(f[0], f[1], f[2], Jn);
    }
    return a.sheenRoughnessFactor !== void 0 && (n.sheenRoughness = a.sheenRoughnessFactor), a.sheenColorTexture !== void 0 && l.push(i.assignTexture(n, "sheenColorMap", a.sheenColorTexture, Hr)), a.sheenRoughnessTexture !== void 0 && l.push(i.assignTexture(n, "sheenRoughnessMap", a.sheenRoughnessTexture)), Promise.all(l);
  }
}
class gE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_TRANSMISSION;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return a.transmissionFactor !== void 0 && (n.transmission = a.transmissionFactor), a.transmissionTexture !== void 0 && l.push(i.assignTexture(n, "transmissionMap", a.transmissionTexture)), Promise.all(l);
  }
}
class yE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_VOLUME;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    n.thickness = a.thicknessFactor !== void 0 ? a.thicknessFactor : 0, a.thicknessTexture !== void 0 && l.push(i.assignTexture(n, "thicknessMap", a.thicknessTexture)), n.attenuationDistance = a.attenuationDistance || 1 / 0;
    const f = a.attenuationColor || [1, 1, 1];
    return n.attenuationColor = new Zr().setRGB(f[0], f[1], f[2], Jn), Promise.all(l);
  }
}
class vE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_IOR;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const s = this.parser.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = s.extensions[this.name];
    return n.ior = l.ior !== void 0 ? l.ior : 1.5, Promise.resolve();
  }
}
class xE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_SPECULAR;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    n.specularIntensity = a.specularFactor !== void 0 ? a.specularFactor : 1, a.specularTexture !== void 0 && l.push(i.assignTexture(n, "specularIntensityMap", a.specularTexture));
    const f = a.specularColorFactor || [1, 1, 1];
    return n.specularColor = new Zr().setRGB(f[0], f[1], f[2], Jn), a.specularColorTexture !== void 0 && l.push(i.assignTexture(n, "specularColorMap", a.specularColorTexture, Hr)), Promise.all(l);
  }
}
class SE {
  constructor(t) {
    this.parser = t, this.name = ue.EXT_MATERIALS_BUMP;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return n.bumpScale = a.bumpFactor !== void 0 ? a.bumpFactor : 1, a.bumpTexture !== void 0 && l.push(i.assignTexture(n, "bumpMap", a.bumpTexture)), Promise.all(l);
  }
}
class wE {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_MATERIALS_ANISOTROPY;
  }
  getMaterialType(t) {
    const i = this.parser.json.materials[t];
    return !i.extensions || !i.extensions[this.name] ? null : qn;
  }
  extendMaterialParams(t, n) {
    const i = this.parser, s = i.json.materials[t];
    if (!s.extensions || !s.extensions[this.name])
      return Promise.resolve();
    const l = [], a = s.extensions[this.name];
    return a.anisotropyStrength !== void 0 && (n.anisotropy = a.anisotropyStrength), a.anisotropyRotation !== void 0 && (n.anisotropyRotation = a.anisotropyRotation), a.anisotropyTexture !== void 0 && l.push(i.assignTexture(n, "anisotropyMap", a.anisotropyTexture)), Promise.all(l);
  }
}
class _E {
  constructor(t) {
    this.parser = t, this.name = ue.KHR_TEXTURE_BASISU;
  }
  loadTexture(t) {
    const n = this.parser, i = n.json, s = i.textures[t];
    if (!s.extensions || !s.extensions[this.name])
      return null;
    const l = s.extensions[this.name], a = n.options.ktx2Loader;
    if (!a) {
      if (i.extensionsRequired && i.extensionsRequired.indexOf(this.name) >= 0)
        throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");
      return null;
    }
    return n.loadTextureImage(t, l.source, a);
  }
}
class EE {
  constructor(t) {
    this.parser = t, this.name = ue.EXT_TEXTURE_WEBP, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, i = this.parser, s = i.json, l = s.textures[t];
    if (!l.extensions || !l.extensions[n])
      return null;
    const a = l.extensions[n], f = s.images[a.source];
    let p = i.textureLoader;
    if (f.uri) {
      const m = i.options.manager.getHandler(f.uri);
      m !== null && (p = m);
    }
    return this.detectSupport().then(function(m) {
      if (m) return i.loadTextureImage(t, a.source, p);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(n) >= 0)
        throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");
      return i.loadTexture(t);
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
class kE {
  constructor(t) {
    this.parser = t, this.name = ue.EXT_TEXTURE_AVIF, this.isSupported = null;
  }
  loadTexture(t) {
    const n = this.name, i = this.parser, s = i.json, l = s.textures[t];
    if (!l.extensions || !l.extensions[n])
      return null;
    const a = l.extensions[n], f = s.images[a.source];
    let p = i.textureLoader;
    if (f.uri) {
      const m = i.options.manager.getHandler(f.uri);
      m !== null && (p = m);
    }
    return this.detectSupport().then(function(m) {
      if (m) return i.loadTextureImage(t, a.source, p);
      if (s.extensionsRequired && s.extensionsRequired.indexOf(n) >= 0)
        throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");
      return i.loadTexture(t);
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
class TE {
  constructor(t) {
    this.name = ue.EXT_MESHOPT_COMPRESSION, this.parser = t;
  }
  loadBufferView(t) {
    const n = this.parser.json, i = n.bufferViews[t];
    if (i.extensions && i.extensions[this.name]) {
      const s = i.extensions[this.name], l = this.parser.getDependency("buffer", s.buffer), a = this.parser.options.meshoptDecoder;
      if (!a || !a.supported) {
        if (n.extensionsRequired && n.extensionsRequired.indexOf(this.name) >= 0)
          throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");
        return null;
      }
      return l.then(function(f) {
        const p = s.byteOffset || 0, m = s.byteLength || 0, g = s.count, y = s.byteStride, v = new Uint8Array(f, p, m);
        return a.decodeGltfBufferAsync ? a.decodeGltfBufferAsync(g, y, v, s.mode, s.filter).then(function(w) {
          return w.buffer;
        }) : a.ready.then(function() {
          const w = new ArrayBuffer(g * y);
          return a.decodeGltfBuffer(new Uint8Array(w), g, y, v, s.mode, s.filter), w;
        });
      });
    } else
      return null;
  }
}
class PE {
  constructor(t) {
    this.name = ue.EXT_MESH_GPU_INSTANCING, this.parser = t;
  }
  createNodeMesh(t) {
    const n = this.parser.json, i = n.nodes[t];
    if (!i.extensions || !i.extensions[this.name] || i.mesh === void 0)
      return null;
    const s = n.meshes[i.mesh];
    for (const m of s.primitives)
      if (m.mode !== fn.TRIANGLES && m.mode !== fn.TRIANGLE_STRIP && m.mode !== fn.TRIANGLE_FAN && m.mode !== void 0)
        return null;
    const a = i.extensions[this.name].attributes, f = [], p = {};
    for (const m in a)
      f.push(this.parser.getDependency("accessor", a[m]).then((g) => (p[m] = g, p[m])));
    return f.length < 1 ? null : (f.push(this.parser.createNodeMesh(t)), Promise.all(f).then((m) => {
      const g = m.pop(), y = g.isGroup ? g.children : [g], v = m[0].count, w = [];
      for (const T of y) {
        const A = new Zu(), L = new ht(), S = new Ju(), x = new ht(1, 1, 1), _ = new sS(T.geometry, T.material, v);
        for (let R = 0; R < v; R++)
          p.TRANSLATION && L.fromBufferAttribute(p.TRANSLATION, R), p.ROTATION && S.fromBufferAttribute(p.ROTATION, R), p.SCALE && x.fromBufferAttribute(p.SCALE, R), _.setMatrixAt(R, A.compose(L, S, x));
        for (const R in p)
          if (R === "_COLOR_0") {
            const I = p[R];
            _.instanceColor = new lS(I.array, I.itemSize, I.normalized);
          } else R !== "TRANSLATION" && R !== "ROTATION" && R !== "SCALE" && T.geometry.setAttribute(R, p[R]);
        xy.prototype.copy.call(_, T), this.parser.assignFinalMaterial(_), w.push(_);
      }
      return g.isGroup ? (g.clear(), g.add(...w), g) : w[0];
    }));
  }
}
const u1 = "glTF", _s = 12, iy = { JSON: 1313821514, BIN: 5130562 };
class CE {
  constructor(t) {
    this.name = ue.KHR_BINARY_GLTF, this.content = null, this.body = null;
    const n = new DataView(t, 0, _s), i = new TextDecoder();
    if (this.header = {
      magic: i.decode(new Uint8Array(t.slice(0, 4))),
      version: n.getUint32(4, !0),
      length: n.getUint32(8, !0)
    }, this.header.magic !== u1)
      throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");
    if (this.header.version < 2)
      throw new Error("THREE.GLTFLoader: Legacy binary file detected.");
    const s = this.header.length - _s, l = new DataView(t, _s);
    let a = 0;
    for (; a < s; ) {
      const f = l.getUint32(a, !0);
      a += 4;
      const p = l.getUint32(a, !0);
      if (a += 4, p === iy.JSON) {
        const m = new Uint8Array(t, _s + a, f);
        this.content = i.decode(m);
      } else if (p === iy.BIN) {
        const m = _s + a;
        this.body = t.slice(m, m + f);
      }
      a += f;
    }
    if (this.content === null)
      throw new Error("THREE.GLTFLoader: JSON content not found.");
  }
}
class RE {
  constructor(t, n) {
    if (!n)
      throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");
    this.name = ue.KHR_DRACO_MESH_COMPRESSION, this.json = t, this.dracoLoader = n, this.dracoLoader.preload();
  }
  decodePrimitive(t, n) {
    const i = this.json, s = this.dracoLoader, l = t.extensions[this.name].bufferView, a = t.extensions[this.name].attributes, f = {}, p = {}, m = {};
    for (const g in a) {
      const y = Hd[g] || g.toLowerCase();
      f[y] = a[g];
    }
    for (const g in t.attributes) {
      const y = Hd[g] || g.toLowerCase();
      if (a[g] !== void 0) {
        const v = i.accessors[t.attributes[g]], w = Li[v.componentType];
        m[y] = w.name, p[y] = v.normalized === !0;
      }
    }
    return n.getDependency("bufferView", l).then(function(g) {
      return new Promise(function(y, v) {
        s.decodeDracoFile(g, function(w) {
          for (const T in w.attributes) {
            const A = w.attributes[T], L = p[T];
            L !== void 0 && (A.normalized = L);
          }
          y(w);
        }, f, m, Jn, v);
      });
    });
  }
}
class AE {
  constructor() {
    this.name = ue.KHR_TEXTURE_TRANSFORM;
  }
  extendTexture(t, n) {
    return (n.texCoord === void 0 || n.texCoord === t.channel) && n.offset === void 0 && n.rotation === void 0 && n.scale === void 0 || (t = t.clone(), n.texCoord !== void 0 && (t.channel = n.texCoord), n.offset !== void 0 && t.offset.fromArray(n.offset), n.rotation !== void 0 && (t.rotation = n.rotation), n.scale !== void 0 && t.repeat.fromArray(n.scale), t.needsUpdate = !0), t;
  }
}
class LE {
  constructor() {
    this.name = ue.KHR_MESH_QUANTIZATION;
  }
}
class a1 extends zS {
  constructor(t, n, i, s) {
    super(t, n, i, s);
  }
  copySampleValue_(t) {
    const n = this.resultBuffer, i = this.sampleValues, s = this.valueSize, l = t * s * 3 + s;
    for (let a = 0; a !== s; a++)
      n[a] = i[l + a];
    return n;
  }
  interpolate_(t, n, i, s) {
    const l = this.resultBuffer, a = this.sampleValues, f = this.valueSize, p = f * 2, m = f * 3, g = s - n, y = (i - n) / g, v = y * y, w = v * y, T = t * m, A = T - m, L = -2 * w + 3 * v, S = w - v, x = 1 - L, _ = S - v + y;
    for (let R = 0; R !== f; R++) {
      const I = a[A + R + f], O = a[A + R + p] * g, D = a[T + R + f], B = a[T + R] * g;
      l[R] = x * I + _ * O + L * D + S * B;
    }
    return l;
  }
}
const ME = new Ju();
class NE extends a1 {
  interpolate_(t, n, i, s) {
    const l = super.interpolate_(t, n, i, s);
    return ME.fromArray(l).normalize().toArray(l), l;
  }
}
const fn = {
  POINTS: 0,
  LINES: 1,
  LINE_LOOP: 2,
  LINE_STRIP: 3,
  TRIANGLES: 4,
  TRIANGLE_STRIP: 5,
  TRIANGLE_FAN: 6
}, Li = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array
}, sy = {
  9728: wy,
  9729: Gf,
  9984: hS,
  9985: pS,
  9986: dS,
  9987: Sy
}, ly = {
  33071: gS,
  33648: mS,
  10497: Wf
}, Nf = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
}, Hd = {
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
}, Ar = {
  scale: "scale",
  translation: "position",
  rotation: "quaternion",
  weights: "morphTargetInfluences"
}, jE = {
  CUBICSPLINE: void 0,
  // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
  // keyframe track will be initialized with a default interpolation type, then modified.
  LINEAR: Ty,
  STEP: NS
}, jf = {
  OPAQUE: "OPAQUE",
  MASK: "MASK",
  BLEND: "BLEND"
};
function zE(e) {
  return e.DefaultMaterial === void 0 && (e.DefaultMaterial = new _y({
    color: 16777215,
    emissive: 0,
    metalness: 1,
    roughness: 1,
    transparent: !1,
    depthTest: !0,
    side: jS
  })), e.DefaultMaterial;
}
function fo(e, t, n) {
  for (const i in n.extensions)
    e[i] === void 0 && (t.userData.gltfExtensions = t.userData.gltfExtensions || {}, t.userData.gltfExtensions[i] = n.extensions[i]);
}
function sr(e, t) {
  t.extras !== void 0 && (typeof t.extras == "object" ? Object.assign(e.userData, t.extras) : console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, " + t.extras));
}
function IE(e, t, n) {
  let i = !1, s = !1, l = !1;
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (y.POSITION !== void 0 && (i = !0), y.NORMAL !== void 0 && (s = !0), y.COLOR_0 !== void 0 && (l = !0), i && s && l) break;
  }
  if (!i && !s && !l) return Promise.resolve(e);
  const a = [], f = [], p = [];
  for (let m = 0, g = t.length; m < g; m++) {
    const y = t[m];
    if (i) {
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
    return i && (e.morphAttributes.position = g), s && (e.morphAttributes.normal = y), l && (e.morphAttributes.color = v), e.morphTargetsRelative = !0, e;
  });
}
function OE(e, t) {
  if (e.updateMorphTargets(), t.weights !== void 0)
    for (let n = 0, i = t.weights.length; n < i; n++)
      e.morphTargetInfluences[n] = t.weights[n];
  if (t.extras && Array.isArray(t.extras.targetNames)) {
    const n = t.extras.targetNames;
    if (e.morphTargetInfluences.length === n.length) {
      e.morphTargetDictionary = {};
      for (let i = 0, s = n.length; i < s; i++)
        e.morphTargetDictionary[n[i]] = i;
    } else
      console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.");
  }
}
function DE(e) {
  let t;
  const n = e.extensions && e.extensions[ue.KHR_DRACO_MESH_COMPRESSION];
  if (n ? t = "draco:" + n.bufferView + ":" + n.indices + ":" + zf(n.attributes) : t = e.indices + ":" + zf(e.attributes) + ":" + e.mode, e.targets !== void 0)
    for (let i = 0, s = e.targets.length; i < s; i++)
      t += ":" + zf(e.targets[i]);
  return t;
}
function zf(e) {
  let t = "";
  const n = Object.keys(e).sort();
  for (let i = 0, s = n.length; i < s; i++)
    t += n[i] + ":" + e[n[i]] + ";";
  return t;
}
function Bd(e) {
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
function FE(e) {
  return e.search(/\.jpe?g($|\?)/i) > 0 || e.search(/^data\:image\/jpeg/) === 0 ? "image/jpeg" : e.search(/\.webp($|\?)/i) > 0 || e.search(/^data\:image\/webp/) === 0 ? "image/webp" : e.search(/\.ktx2($|\?)/i) > 0 || e.search(/^data\:image\/ktx2/) === 0 ? "image/ktx2" : "image/png";
}
const UE = new Zu();
class HE {
  constructor(t = {}, n = {}) {
    this.json = t, this.extensions = {}, this.plugins = {}, this.options = n, this.cache = new uE(), this.associations = /* @__PURE__ */ new Map(), this.primitiveCache = {}, this.nodeCache = {}, this.meshCache = { refs: {}, uses: {} }, this.cameraCache = { refs: {}, uses: {} }, this.lightCache = { refs: {}, uses: {} }, this.sourceCache = {}, this.textureCache = {}, this.nodeNamesUsed = {};
    let i = !1, s = -1, l = !1, a = -1;
    if (typeof navigator < "u") {
      const f = navigator.userAgent;
      i = /^((?!chrome|android).)*safari/i.test(f) === !0;
      const p = f.match(/Version\/(\d+)/);
      s = i && p ? parseInt(p[1], 10) : -1, l = f.indexOf("Firefox") > -1, a = l ? f.match(/Firefox\/([0-9]+)\./)[1] : -1;
    }
    typeof createImageBitmap > "u" || i && s < 17 || l && a < 98 ? this.textureLoader = new uS(this.options.manager) : this.textureLoader = new aS(this.options.manager), this.textureLoader.setCrossOrigin(this.options.crossOrigin), this.textureLoader.setRequestHeader(this.options.requestHeader), this.fileLoader = new Yu(this.options.manager), this.fileLoader.setResponseType("arraybuffer"), this.options.crossOrigin === "use-credentials" && this.fileLoader.setWithCredentials(!0);
  }
  setExtensions(t) {
    this.extensions = t;
  }
  setPlugins(t) {
    this.plugins = t;
  }
  parse(t, n) {
    const i = this, s = this.json, l = this.extensions;
    this.cache.removeAll(), this.nodeCache = {}, this._invokeAll(function(a) {
      return a._markDefs && a._markDefs();
    }), Promise.all(this._invokeAll(function(a) {
      return a.beforeRoot && a.beforeRoot();
    })).then(function() {
      return Promise.all([
        i.getDependencies("scene"),
        i.getDependencies("animation"),
        i.getDependencies("camera")
      ]);
    }).then(function(a) {
      const f = {
        scene: a[0][s.scene || 0],
        scenes: a[0],
        animations: a[1],
        cameras: a[2],
        asset: s.asset,
        parser: i,
        userData: {}
      };
      return fo(l, f, s), sr(f, s), Promise.all(i._invokeAll(function(p) {
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
    const t = this.json.nodes || [], n = this.json.skins || [], i = this.json.meshes || [];
    for (let s = 0, l = n.length; s < l; s++) {
      const a = n[s].joints;
      for (let f = 0, p = a.length; f < p; f++)
        t[a[f]].isBone = !0;
    }
    for (let s = 0, l = t.length; s < l; s++) {
      const a = t[s];
      a.mesh !== void 0 && (this._addNodeRef(this.meshCache, a.mesh), a.skin !== void 0 && (i[a.mesh].isSkinnedMesh = !0)), a.camera !== void 0 && this._addNodeRef(this.cameraCache, a.camera);
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
  _getNodeRef(t, n, i) {
    if (t.refs[n] <= 1) return i;
    const s = i.clone(), l = (a, f) => {
      const p = this.associations.get(a);
      p != null && this.associations.set(f, p);
      for (const [m, g] of a.children.entries())
        l(g, f.children[m]);
    };
    return l(i, s), s.name += "_instance_" + t.uses[n]++, s;
  }
  _invokeOne(t) {
    const n = Object.values(this.plugins);
    n.push(this);
    for (let i = 0; i < n.length; i++) {
      const s = t(n[i]);
      if (s) return s;
    }
    return null;
  }
  _invokeAll(t) {
    const n = Object.values(this.plugins);
    n.unshift(this);
    const i = [];
    for (let s = 0; s < n.length; s++) {
      const l = t(n[s]);
      l && i.push(l);
    }
    return i;
  }
  /**
   * Requests the specified dependency asynchronously, with caching.
   * @param {string} type
   * @param {number} index
   * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
   */
  getDependency(t, n) {
    const i = t + ":" + n;
    let s = this.cache.get(i);
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
      this.cache.add(i, s);
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
      const i = this, s = this.json[t + (t === "mesh" ? "es" : "s")] || [];
      n = Promise.all(s.map(function(l, a) {
        return i.getDependency(t, a);
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
    const n = this.json.buffers[t], i = this.fileLoader;
    if (n.type && n.type !== "arraybuffer")
      throw new Error("THREE.GLTFLoader: " + n.type + " buffer type is not supported.");
    if (n.uri === void 0 && t === 0)
      return Promise.resolve(this.extensions[ue.KHR_BINARY_GLTF].body);
    const s = this.options;
    return new Promise(function(l, a) {
      i.load(js.resolveURL(n.uri, s.path), l, void 0, function() {
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
    return this.getDependency("buffer", n.buffer).then(function(i) {
      const s = n.byteLength || 0, l = n.byteOffset || 0;
      return i.slice(l, l + s);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */
  loadAccessor(t) {
    const n = this, i = this.json, s = this.json.accessors[t];
    if (s.bufferView === void 0 && s.sparse === void 0) {
      const a = Nf[s.type], f = Li[s.componentType], p = s.normalized === !0, m = new f(s.count * a);
      return Promise.resolve(new zs(m, a, p));
    }
    const l = [];
    return s.bufferView !== void 0 ? l.push(this.getDependency("bufferView", s.bufferView)) : l.push(null), s.sparse !== void 0 && (l.push(this.getDependency("bufferView", s.sparse.indices.bufferView)), l.push(this.getDependency("bufferView", s.sparse.values.bufferView))), Promise.all(l).then(function(a) {
      const f = a[0], p = Nf[s.type], m = Li[s.componentType], g = m.BYTES_PER_ELEMENT, y = g * p, v = s.byteOffset || 0, w = s.bufferView !== void 0 ? i.bufferViews[s.bufferView].byteStride : void 0, T = s.normalized === !0;
      let A, L;
      if (w && w !== y) {
        const S = Math.floor(v / w), x = "InterleavedBuffer:" + s.bufferView + ":" + s.componentType + ":" + S + ":" + s.count;
        let _ = n.cache.get(x);
        _ || (A = new m(f, S * w, s.count * w / g), _ = new cS(A, w / g), n.cache.add(x, _)), L = new fS(_, p, v % w / g, T);
      } else
        f === null ? A = new m(s.count * p) : A = new m(f, v, s.count * p), L = new zs(A, p, T);
      if (s.sparse !== void 0) {
        const S = Nf.SCALAR, x = Li[s.sparse.indices.componentType], _ = s.sparse.indices.byteOffset || 0, R = s.sparse.values.byteOffset || 0, I = new x(a[1], _, s.sparse.count * S), O = new m(a[2], R, s.sparse.count * p);
        f !== null && (L = new zs(L.array.slice(), L.itemSize, L.normalized)), L.normalized = !1;
        for (let D = 0, B = I.length; D < B; D++) {
          const q = I[D];
          if (L.setX(q, O[D * p]), p >= 2 && L.setY(q, O[D * p + 1]), p >= 3 && L.setZ(q, O[D * p + 2]), p >= 4 && L.setW(q, O[D * p + 3]), p >= 5) throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.");
        }
        L.normalized = T;
      }
      return L;
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   * @param {number} textureIndex
   * @return {Promise<THREE.Texture|null>}
   */
  loadTexture(t) {
    const n = this.json, i = this.options, l = n.textures[t].source, a = n.images[l];
    let f = this.textureLoader;
    if (a.uri) {
      const p = i.manager.getHandler(a.uri);
      p !== null && (f = p);
    }
    return this.loadTextureImage(t, l, f);
  }
  loadTextureImage(t, n, i) {
    const s = this, l = this.json, a = l.textures[t], f = l.images[n], p = (f.uri || f.bufferView) + ":" + a.sampler;
    if (this.textureCache[p])
      return this.textureCache[p];
    const m = this.loadImageSource(n, i).then(function(g) {
      g.flipY = !1, g.name = a.name || f.name || "", g.name === "" && typeof f.uri == "string" && f.uri.startsWith("data:image/") === !1 && (g.name = f.uri);
      const v = (l.samplers || {})[a.sampler] || {};
      return g.magFilter = sy[v.magFilter] || Gf, g.minFilter = sy[v.minFilter] || Sy, g.wrapS = ly[v.wrapS] || Wf, g.wrapT = ly[v.wrapT] || Wf, g.generateMipmaps = !g.isCompressedTexture && g.minFilter !== wy && g.minFilter !== Gf, s.associations.set(g, { textures: t }), g;
    }).catch(function() {
      return null;
    });
    return this.textureCache[p] = m, m;
  }
  loadImageSource(t, n) {
    const i = this, s = this.json, l = this.options;
    if (this.sourceCache[t] !== void 0)
      return this.sourceCache[t].then((y) => y.clone());
    const a = s.images[t], f = self.URL || self.webkitURL;
    let p = a.uri || "", m = !1;
    if (a.bufferView !== void 0)
      p = i.getDependency("bufferView", a.bufferView).then(function(y) {
        m = !0;
        const v = new Blob([y], { type: a.mimeType });
        return p = f.createObjectURL(v), p;
      });
    else if (a.uri === void 0)
      throw new Error("THREE.GLTFLoader: Image " + t + " is missing URI and bufferView");
    const g = Promise.resolve(p).then(function(y) {
      return new Promise(function(v, w) {
        let T = v;
        n.isImageBitmapLoader === !0 && (T = function(A) {
          const L = new Rm(A);
          L.needsUpdate = !0, v(L);
        }), n.load(js.resolveURL(y, l.path), T, void 0, w);
      });
    }).then(function(y) {
      return m === !0 && f.revokeObjectURL(p), sr(y, a), y.userData.mimeType = a.mimeType || FE(a.uri), y;
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
  assignTexture(t, n, i, s) {
    const l = this;
    return this.getDependency("texture", i.index).then(function(a) {
      if (!a) return null;
      if (i.texCoord !== void 0 && i.texCoord > 0 && (a = a.clone(), a.channel = i.texCoord), l.extensions[ue.KHR_TEXTURE_TRANSFORM]) {
        const f = i.extensions !== void 0 ? i.extensions[ue.KHR_TEXTURE_TRANSFORM] : void 0;
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
    let i = t.material;
    const s = n.attributes.tangent === void 0, l = n.attributes.color !== void 0, a = n.attributes.normal === void 0;
    if (t.isPoints) {
      const f = "PointsMaterial:" + i.uuid;
      let p = this.cache.get(f);
      p || (p = new yS(), Zc.prototype.copy.call(p, i), p.color.copy(i.color), p.map = i.map, p.sizeAttenuation = !1, this.cache.add(f, p)), i = p;
    } else if (t.isLine) {
      const f = "LineBasicMaterial:" + i.uuid;
      let p = this.cache.get(f);
      p || (p = new vS(), Zc.prototype.copy.call(p, i), p.color.copy(i.color), p.map = i.map, this.cache.add(f, p)), i = p;
    }
    if (s || l || a) {
      let f = "ClonedMaterial:" + i.uuid + ":";
      s && (f += "derivative-tangents:"), l && (f += "vertex-colors:"), a && (f += "flat-shading:");
      let p = this.cache.get(f);
      p || (p = i.clone(), l && (p.vertexColors = !0), a && (p.flatShading = !0), s && (p.normalScale && (p.normalScale.y *= -1), p.clearcoatNormalScale && (p.clearcoatNormalScale.y *= -1)), this.cache.add(f, p), this.associations.set(p, this.associations.get(i))), i = p;
    }
    t.material = i;
  }
  getMaterialType() {
    return _y;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */
  loadMaterial(t) {
    const n = this, i = this.json, s = this.extensions, l = i.materials[t];
    let a;
    const f = {}, p = l.extensions || {}, m = [];
    if (p[ue.KHR_MATERIALS_UNLIT]) {
      const y = s[ue.KHR_MATERIALS_UNLIT];
      a = y.getMaterialType(), m.push(y.extendParams(f, l, n));
    } else {
      const y = l.pbrMetallicRoughness || {};
      if (f.color = new Zr(1, 1, 1), f.opacity = 1, Array.isArray(y.baseColorFactor)) {
        const v = y.baseColorFactor;
        f.color.setRGB(v[0], v[1], v[2], Jn), f.opacity = v[3];
      }
      y.baseColorTexture !== void 0 && m.push(n.assignTexture(f, "map", y.baseColorTexture, Hr)), f.metalness = y.metallicFactor !== void 0 ? y.metallicFactor : 1, f.roughness = y.roughnessFactor !== void 0 ? y.roughnessFactor : 1, y.metallicRoughnessTexture !== void 0 && (m.push(n.assignTexture(f, "metalnessMap", y.metallicRoughnessTexture)), m.push(n.assignTexture(f, "roughnessMap", y.metallicRoughnessTexture))), a = this._invokeOne(function(v) {
        return v.getMaterialType && v.getMaterialType(t);
      }), m.push(Promise.all(this._invokeAll(function(v) {
        return v.extendMaterialParams && v.extendMaterialParams(t, f);
      })));
    }
    l.doubleSided === !0 && (f.side = xS);
    const g = l.alphaMode || jf.OPAQUE;
    if (g === jf.BLEND ? (f.transparent = !0, f.depthWrite = !1) : (f.transparent = !1, g === jf.MASK && (f.alphaTest = l.alphaCutoff !== void 0 ? l.alphaCutoff : 0.5)), l.normalTexture !== void 0 && a !== Ts && (m.push(n.assignTexture(f, "normalMap", l.normalTexture)), f.normalScale = new Xt(1, 1), l.normalTexture.scale !== void 0)) {
      const y = l.normalTexture.scale;
      f.normalScale.set(y, y);
    }
    if (l.occlusionTexture !== void 0 && a !== Ts && (m.push(n.assignTexture(f, "aoMap", l.occlusionTexture)), l.occlusionTexture.strength !== void 0 && (f.aoMapIntensity = l.occlusionTexture.strength)), l.emissiveFactor !== void 0 && a !== Ts) {
      const y = l.emissiveFactor;
      f.emissive = new Zr().setRGB(y[0], y[1], y[2], Jn);
    }
    return l.emissiveTexture !== void 0 && a !== Ts && m.push(n.assignTexture(f, "emissiveMap", l.emissiveTexture, Hr)), Promise.all(m).then(function() {
      const y = new a(f);
      return l.name && (y.name = l.name), sr(y, l), n.associations.set(y, { materials: t }), l.extensions && fo(s, y, l), y;
    });
  }
  /** When Object3D instances are targeted by animation, they need unique names. */
  createUniqueName(t) {
    const n = SS.sanitizeNodeName(t || "");
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
    const n = this, i = this.extensions, s = this.primitiveCache;
    function l(f) {
      return i[ue.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(f, n).then(function(p) {
        return uy(p, f, n);
      });
    }
    const a = [];
    for (let f = 0, p = t.length; f < p; f++) {
      const m = t[f], g = DE(m), y = s[g];
      if (y)
        a.push(y.promise);
      else {
        let v;
        m.extensions && m.extensions[ue.KHR_DRACO_MESH_COMPRESSION] ? v = l(m) : v = uy(new Ey(), m, n), s[g] = { primitive: m, promise: v }, a.push(v);
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
    const n = this, i = this.json, s = this.extensions, l = i.meshes[t], a = l.primitives, f = [];
    for (let p = 0, m = a.length; p < m; p++) {
      const g = a[p].material === void 0 ? zE(this.cache) : this.getDependency("material", a[p].material);
      f.push(g);
    }
    return f.push(n.loadGeometries(a)), Promise.all(f).then(function(p) {
      const m = p.slice(0, p.length - 1), g = p[p.length - 1], y = [];
      for (let w = 0, T = g.length; w < T; w++) {
        const A = g[w], L = a[w];
        let S;
        const x = m[w];
        if (L.mode === fn.TRIANGLES || L.mode === fn.TRIANGLE_STRIP || L.mode === fn.TRIANGLE_FAN || L.mode === void 0)
          S = l.isSkinnedMesh === !0 ? new wS(A, x) : new _S(A, x), S.isSkinnedMesh === !0 && S.normalizeSkinWeights(), L.mode === fn.TRIANGLE_STRIP ? S.geometry = oy(S.geometry, yy) : L.mode === fn.TRIANGLE_FAN && (S.geometry = oy(S.geometry, Bf));
        else if (L.mode === fn.LINES)
          S = new ES(A, x);
        else if (L.mode === fn.LINE_STRIP)
          S = new kS(A, x);
        else if (L.mode === fn.LINE_LOOP)
          S = new TS(A, x);
        else if (L.mode === fn.POINTS)
          S = new PS(A, x);
        else
          throw new Error("THREE.GLTFLoader: Primitive mode unsupported: " + L.mode);
        Object.keys(S.geometry.morphAttributes).length > 0 && OE(S, l), S.name = n.createUniqueName(l.name || "mesh_" + t), sr(S, l), L.extensions && fo(s, S, L), n.assignFinalMaterial(S), y.push(S);
      }
      for (let w = 0, T = y.length; w < T; w++)
        n.associations.set(y[w], {
          meshes: t,
          primitives: w
        });
      if (y.length === 1)
        return l.extensions && fo(s, y[0], l), y[0];
      const v = new Jc();
      l.extensions && fo(s, v, l), n.associations.set(v, { meshes: t });
      for (let w = 0, T = y.length; w < T; w++)
        v.add(y[w]);
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
    const i = this.json.cameras[t], s = i[i.type];
    if (!s) {
      console.warn("THREE.GLTFLoader: Missing camera parameters.");
      return;
    }
    return i.type === "perspective" ? n = new CS(ky.radToDeg(s.yfov), s.aspectRatio || 1, s.znear || 1, s.zfar || 2e6) : i.type === "orthographic" && (n = new RS(-s.xmag, s.xmag, s.ymag, -s.ymag, s.znear, s.zfar)), i.name && (n.name = this.createUniqueName(i.name)), sr(n, i), Promise.resolve(n);
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Skeleton>}
   */
  loadSkin(t) {
    const n = this.json.skins[t], i = [];
    for (let s = 0, l = n.joints.length; s < l; s++)
      i.push(this._loadNodeShallow(n.joints[s]));
    return n.inverseBindMatrices !== void 0 ? i.push(this.getDependency("accessor", n.inverseBindMatrices)) : i.push(null), Promise.all(i).then(function(s) {
      const l = s.pop(), a = s, f = [], p = [];
      for (let m = 0, g = a.length; m < g; m++) {
        const y = a[m];
        if (y) {
          f.push(y);
          const v = new Zu();
          l !== null && v.fromArray(l.array, m * 16), p.push(v);
        } else
          console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', n.joints[m]);
      }
      return new AS(f, p);
    });
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */
  loadAnimation(t) {
    const n = this.json, i = this, s = n.animations[t], l = s.name ? s.name : "animation_" + t, a = [], f = [], p = [], m = [], g = [];
    for (let y = 0, v = s.channels.length; y < v; y++) {
      const w = s.channels[y], T = s.samplers[w.sampler], A = w.target, L = A.node, S = s.parameters !== void 0 ? s.parameters[T.input] : T.input, x = s.parameters !== void 0 ? s.parameters[T.output] : T.output;
      A.node !== void 0 && (a.push(this.getDependency("node", L)), f.push(this.getDependency("accessor", S)), p.push(this.getDependency("accessor", x)), m.push(T), g.push(A));
    }
    return Promise.all([
      Promise.all(a),
      Promise.all(f),
      Promise.all(p),
      Promise.all(m),
      Promise.all(g)
    ]).then(function(y) {
      const v = y[0], w = y[1], T = y[2], A = y[3], L = y[4], S = [];
      for (let x = 0, _ = v.length; x < _; x++) {
        const R = v[x], I = w[x], O = T[x], D = A[x], B = L[x];
        if (R === void 0) continue;
        R.updateMatrix && R.updateMatrix();
        const q = i._createAnimationTracks(R, I, O, D, B);
        if (q)
          for (let V = 0; V < q.length; V++)
            S.push(q[V]);
      }
      return new LS(l, void 0, S);
    });
  }
  createNodeMesh(t) {
    const n = this.json, i = this, s = n.nodes[t];
    return s.mesh === void 0 ? null : i.getDependency("mesh", s.mesh).then(function(l) {
      const a = i._getNodeRef(i.meshCache, s.mesh, l);
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
    const n = this.json, i = this, s = n.nodes[t], l = i._loadNodeShallow(t), a = [], f = s.children || [];
    for (let m = 0, g = f.length; m < g; m++)
      a.push(i.getDependency("node", f[m]));
    const p = s.skin === void 0 ? Promise.resolve(null) : i.getDependency("skin", s.skin);
    return Promise.all([
      l,
      Promise.all(a),
      p
    ]).then(function(m) {
      const g = m[0], y = m[1], v = m[2];
      v !== null && g.traverse(function(w) {
        w.isSkinnedMesh && w.bind(v, UE);
      });
      for (let w = 0, T = y.length; w < T; w++)
        g.add(y[w]);
      return g;
    });
  }
  // ._loadNodeShallow() parses a single node.
  // skin and child nodes are created and added in .loadNode() (no '_' prefix).
  _loadNodeShallow(t) {
    const n = this.json, i = this.extensions, s = this;
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
      if (l.isBone === !0 ? g = new MS() : m.length > 1 ? g = new Jc() : m.length === 1 ? g = m[0] : g = new xy(), g !== m[0])
        for (let y = 0, v = m.length; y < v; y++)
          g.add(m[y]);
      if (l.name && (g.userData.name = l.name, g.name = a), sr(g, l), l.extensions && fo(i, g, l), l.matrix !== void 0) {
        const y = new Zu();
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
    const n = this.extensions, i = this.json.scenes[t], s = this, l = new Jc();
    i.name && (l.name = s.createUniqueName(i.name)), sr(l, i), i.extensions && fo(n, l, i);
    const a = i.nodes || [], f = [];
    for (let p = 0, m = a.length; p < m; p++)
      f.push(s.getDependency("node", a[p]));
    return Promise.all(f).then(function(p) {
      for (let g = 0, y = p.length; g < y; g++)
        l.add(p[g]);
      const m = (g) => {
        const y = /* @__PURE__ */ new Map();
        for (const [v, w] of s.associations)
          (v instanceof Zc || v instanceof Rm) && y.set(v, w);
        return g.traverse((v) => {
          const w = s.associations.get(v);
          w != null && y.set(v, w);
        }), y;
      };
      return s.associations = m(l), l;
    });
  }
  _createAnimationTracks(t, n, i, s, l) {
    const a = [], f = t.name ? t.name : t.uuid, p = [];
    Ar[l.path] === Ar.weights ? t.traverse(function(v) {
      v.morphTargetInfluences && p.push(v.name ? v.name : v.uuid);
    }) : p.push(f);
    let m;
    switch (Ar[l.path]) {
      case Ar.weights:
        m = Lm;
        break;
      case Ar.rotation:
        m = Mm;
        break;
      case Ar.position:
      case Ar.scale:
        m = Am;
        break;
      default:
        switch (i.itemSize) {
          case 1:
            m = Lm;
            break;
          case 2:
          case 3:
          default:
            m = Am;
            break;
        }
        break;
    }
    const g = s.interpolation !== void 0 ? jE[s.interpolation] : Ty, y = this._getArrayFromAccessor(i);
    for (let v = 0, w = p.length; v < w; v++) {
      const T = new m(
        p[v] + "." + Ar[l.path],
        n.array,
        y,
        g
      );
      s.interpolation === "CUBICSPLINE" && this._createCubicSplineTrackInterpolant(T), a.push(T);
    }
    return a;
  }
  _getArrayFromAccessor(t) {
    let n = t.array;
    if (t.normalized) {
      const i = Bd(n.constructor), s = new Float32Array(n.length);
      for (let l = 0, a = n.length; l < a; l++)
        s[l] = n[l] * i;
      n = s;
    }
    return n;
  }
  _createCubicSplineTrackInterpolant(t) {
    t.createInterpolant = function(i) {
      const s = this instanceof Mm ? NE : a1;
      return new s(this.times, this.values, this.getValueSize() / 3, i);
    }, t.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = !0;
  }
}
function BE(e, t, n) {
  const i = t.attributes, s = new IS();
  if (i.POSITION !== void 0) {
    const f = n.json.accessors[i.POSITION], p = f.min, m = f.max;
    if (p !== void 0 && m !== void 0) {
      if (s.set(
        new ht(p[0], p[1], p[2]),
        new ht(m[0], m[1], m[2])
      ), f.normalized) {
        const g = Bd(Li[f.componentType]);
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
    const f = new ht(), p = new ht();
    for (let m = 0, g = l.length; m < g; m++) {
      const y = l[m];
      if (y.POSITION !== void 0) {
        const v = n.json.accessors[y.POSITION], w = v.min, T = v.max;
        if (w !== void 0 && T !== void 0) {
          if (p.setX(Math.max(Math.abs(w[0]), Math.abs(T[0]))), p.setY(Math.max(Math.abs(w[1]), Math.abs(T[1]))), p.setZ(Math.max(Math.abs(w[2]), Math.abs(T[2]))), v.normalized) {
            const A = Bd(Li[v.componentType]);
            p.multiplyScalar(A);
          }
          f.max(p);
        } else
          console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");
      }
    }
    s.expandByVector(f);
  }
  e.boundingBox = s;
  const a = new OS();
  s.getCenter(a.center), a.radius = s.min.distanceTo(s.max) / 2, e.boundingSphere = a;
}
function uy(e, t, n) {
  const i = t.attributes, s = [];
  function l(a, f) {
    return n.getDependency("accessor", a).then(function(p) {
      e.setAttribute(f, p);
    });
  }
  for (const a in i) {
    const f = Hd[a] || a.toLowerCase();
    f in e.attributes || s.push(l(i[a], f));
  }
  if (t.indices !== void 0 && !e.index) {
    const a = n.getDependency("accessor", t.indices).then(function(f) {
      e.setIndex(f);
    });
    s.push(a);
  }
  return Vf.workingColorSpace !== Jn && "COLOR_0" in i && console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Vf.workingColorSpace}" not supported.`), sr(e, t), BE(e, t, n), Promise.all(s).then(function() {
    return t.targets !== void 0 ? IE(e, t.targets, n) : e;
  });
}
const If = /* @__PURE__ */ new WeakMap();
class GE extends vy {
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
  load(t, n, i, s) {
    const l = new Yu(this.manager);
    l.setPath(this.path), l.setResponseType("arraybuffer"), l.setRequestHeader(this.requestHeader), l.setWithCredentials(this.withCredentials), l.load(t, (a) => {
      this.parse(a, n, s);
    }, i, s);
  }
  parse(t, n, i = () => {
  }) {
    this.decodeDracoFile(t, n, null, null, Hr, i).catch(i);
  }
  decodeDracoFile(t, n, i, s, l = Jn, a = () => {
  }) {
    const f = {
      attributeIDs: i || this.defaultAttributeIDs,
      attributeTypes: s || this.defaultAttributeTypes,
      useUniqueIDs: !!i,
      vertexColorSpace: l
    };
    return this.decodeGeometry(t, f).then(n).catch(a);
  }
  decodeGeometry(t, n) {
    const i = JSON.stringify(n);
    if (If.has(t)) {
      const p = If.get(t);
      if (p.key === i)
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
    }), If.set(t, {
      key: i,
      promise: f
    }), f;
  }
  _createGeometry(t) {
    const n = new Ey();
    t.index && n.setIndex(new zs(t.index.array, 1));
    for (let i = 0; i < t.attributes.length; i++) {
      const s = t.attributes[i], l = s.name, a = s.array, f = s.itemSize, p = new zs(a, f);
      l === "color" && (this._assignVertexColorSpace(p, s.vertexColorSpace), p.normalized = !(a instanceof Float32Array)), n.setAttribute(l, p);
    }
    return n;
  }
  _assignVertexColorSpace(t, n) {
    if (n !== Hr) return;
    const i = new Zr();
    for (let s = 0, l = t.count; s < l; s++)
      i.fromBufferAttribute(t, s), Vf.toWorkingColorSpace(i, Hr), t.setXYZ(s, i.r, i.g, i.b);
  }
  _loadLibrary(t, n) {
    const i = new Yu(this.manager);
    return i.setPath(this.decoderPath), i.setResponseType(n), i.setWithCredentials(this.withCredentials), new Promise((s, l) => {
      i.load(t, s, void 0, l);
    });
  }
  preload() {
    return this._initDecoder(), this;
  }
  _initDecoder() {
    if (this.decoderPending) return this.decoderPending;
    const t = typeof WebAssembly != "object" || this.decoderConfig.type === "js", n = [];
    return t ? n.push(this._loadLibrary("draco_decoder.js", "text")) : (n.push(this._loadLibrary("draco_wasm_wrapper.js", "text")), n.push(this._loadLibrary("draco_decoder.wasm", "arraybuffer"))), this.decoderPending = Promise.all(n).then((i) => {
      const s = i[0];
      t || (this.decoderConfig.wasmBinary = i[1]);
      const l = WE.toString(), a = [
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
      const i = this.workerPool[this.workerPool.length - 1];
      return i._taskCosts[t] = n, i._taskLoad += n, i;
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
function WE() {
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
            const w = n(y, v, new Int8Array(p), m), T = w.attributes.map((A) => A.array.buffer);
            w.index && T.push(w.index.array.buffer), self.postMessage({ type: "decode", id: f.id, geometry: w }, T);
          } catch (w) {
            console.error(w), self.postMessage({ type: "error", id: f.id, error: w.message });
          } finally {
            y.destroy(v);
          }
        });
        break;
    }
  };
  function n(a, f, p, m) {
    const g = m.attributeIDs, y = m.attributeTypes;
    let v, w;
    const T = f.GetEncodedGeometryType(p);
    if (T === a.TRIANGULAR_MESH)
      v = new a.Mesh(), w = f.DecodeArrayToMesh(p, p.byteLength, v);
    else if (T === a.POINT_CLOUD)
      v = new a.PointCloud(), w = f.DecodeArrayToPointCloud(p, p.byteLength, v);
    else
      throw new Error("THREE.DRACOLoader: Unexpected geometry type.");
    if (!w.ok() || v.ptr === 0)
      throw new Error("THREE.DRACOLoader: Decoding failed: " + w.error_msg());
    const A = { index: null, attributes: [] };
    for (const L in g) {
      const S = self[y[L]];
      let x, _;
      if (m.useUniqueIDs)
        _ = g[L], x = f.GetAttributeByUniqueId(v, _);
      else {
        if (_ = f.GetAttributeId(v, a[g[L]]), _ === -1) continue;
        x = f.GetAttribute(v, _);
      }
      const R = s(a, f, v, L, S, x);
      L === "color" && (R.vertexColorSpace = m.vertexColorSpace), A.attributes.push(R);
    }
    return T === a.TRIANGULAR_MESH && (A.index = i(a, f, v)), a.destroy(v), A;
  }
  function i(a, f, p) {
    const g = p.num_faces() * 3, y = g * 4, v = a._malloc(y);
    f.GetTrianglesUInt32Array(p, y, v);
    const w = new Uint32Array(a.HEAPF32.buffer, v, g).slice();
    return a._free(v), { array: w, itemSize: 1 };
  }
  function s(a, f, p, m, g, y) {
    const v = y.num_components(), T = p.num_points() * v, A = T * g.BYTES_PER_ELEMENT, L = l(a, g), S = a._malloc(A);
    f.GetAttributeDataArrayForAllPoints(p, y, L, A, S);
    const x = new g(a.HEAPF32.buffer, S, T).slice();
    return a._free(S), {
      name: m,
      array: x,
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
const c1 = new GE();
c1.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
function VE({ path: e, onSize: t }) {
  const n = Dp(lE, e, (l) => {
    l.setDRACOLoader(c1);
  }), { obj: i, size: s } = W.useMemo(() => {
    const l = n.scene.clone(!0), a = new ie.Box3().setFromObject(l), f = a.getSize(new ie.Vector3());
    return l.position.sub(a.getCenter(new ie.Vector3())), l.position.y += f.y / 2, { obj: l, size: f };
  }, [n]);
  return W.useLayoutEffect(() => {
    t(s);
  }, [s]), /* @__PURE__ */ E.jsx("primitive", { object: i });
}
function KE({ dims: e }) {
  const t = W.useRef(null);
  $n(() => {
    t.current.rotation.y += 5e-3;
  });
  const [n, i, s] = [e.w / 10, e.h / 10, e.d / 10];
  return /* @__PURE__ */ E.jsxs("mesh", { ref: t, position: [0, i / 2, 0], children: [
    /* @__PURE__ */ E.jsx("boxGeometry", { args: [n, i, s] }),
    /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#2255aa", opacity: 0.55, transparent: !0 })
  ] });
}
function QE() {
  const e = W.useRef(null);
  return $n(({ clock: t }) => {
    e.current.rotation.y = t.getElapsedTime() * 2;
  }), /* @__PURE__ */ E.jsxs("mesh", { ref: e, children: [
    /* @__PURE__ */ E.jsx("torusGeometry", { args: [12, 3, 8, 24] }),
    /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#ffd700", wireframe: !0 })
  ] });
}
const ay = { type: "change" }, Up = { type: "start" }, f1 = { type: "end" }, Au = new FS(), cy = new US(), XE = Math.cos(70 * ky.DEG2RAD), Ve = new ht(), Mt = 2 * Math.PI, ye = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6
}, Of = 1e-6;
class YE extends DS {
  constructor(t, n = null) {
    super(t, n), this.state = ye.NONE, this.enabled = !0, this.target = new ht(), this.cursor = new ht(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: Ei.ROTATE, MIDDLE: Ei.DOLLY, RIGHT: Ei.PAN }, this.touches = { ONE: ui.ROTATE, TWO: ui.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this._lastPosition = new ht(), this._lastQuaternion = new Ju(), this._lastTargetPosition = new ht(), this._quat = new Ju().setFromUnitVectors(t.up, new ht(0, 1, 0)), this._quatInverse = this._quat.clone().invert(), this._spherical = new Nm(), this._sphericalDelta = new Nm(), this._scale = 1, this._panOffset = new ht(), this._rotateStart = new Xt(), this._rotateEnd = new Xt(), this._rotateDelta = new Xt(), this._panStart = new Xt(), this._panEnd = new Xt(), this._panDelta = new Xt(), this._dollyStart = new Xt(), this._dollyEnd = new Xt(), this._dollyDelta = new Xt(), this._dollyDirection = new ht(), this._mouse = new Xt(), this._performCursorZoom = !1, this._pointers = [], this._pointerPositions = {}, this._controlActive = !1, this._onPointerMove = JE.bind(this), this._onPointerDown = ZE.bind(this), this._onPointerUp = qE.bind(this), this._onContextMenu = ok.bind(this), this._onMouseWheel = ek.bind(this), this._onKeyDown = tk.bind(this), this._onTouchStart = nk.bind(this), this._onTouchMove = rk.bind(this), this._onMouseDown = $E.bind(this), this._onMouseMove = bE.bind(this), this._interceptControlDown = ik.bind(this), this._interceptControlUp = sk.bind(this), this.domElement !== null && this.connect(), this.update();
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
    this.target.copy(this.target0), this.object.position.copy(this.position0), this.object.zoom = this.zoom0, this.object.updateProjectionMatrix(), this.dispatchEvent(ay), this.update(), this.state = ye.NONE;
  }
  update(t = null) {
    const n = this.object.position;
    Ve.copy(n).sub(this.target), Ve.applyQuaternion(this._quat), this._spherical.setFromVector3(Ve), this.autoRotate && this.state === ye.NONE && this._rotateLeft(this._getAutoRotationAngle(t)), this.enableDamping ? (this._spherical.theta += this._sphericalDelta.theta * this.dampingFactor, this._spherical.phi += this._sphericalDelta.phi * this.dampingFactor) : (this._spherical.theta += this._sphericalDelta.theta, this._spherical.phi += this._sphericalDelta.phi);
    let i = this.minAzimuthAngle, s = this.maxAzimuthAngle;
    isFinite(i) && isFinite(s) && (i < -Math.PI ? i += Mt : i > Math.PI && (i -= Mt), s < -Math.PI ? s += Mt : s > Math.PI && (s -= Mt), i <= s ? this._spherical.theta = Math.max(i, Math.min(s, this._spherical.theta)) : this._spherical.theta = this._spherical.theta > (i + s) / 2 ? Math.max(i, this._spherical.theta) : Math.min(s, this._spherical.theta)), this._spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this._spherical.phi)), this._spherical.makeSafe(), this.enableDamping === !0 ? this.target.addScaledVector(this._panOffset, this.dampingFactor) : this.target.add(this._panOffset), this.target.sub(this.cursor), this.target.clampLength(this.minTargetRadius, this.maxTargetRadius), this.target.add(this.cursor);
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
        const f = new ht(this._mouse.x, this._mouse.y, 0);
        f.unproject(this.object);
        const p = this.object.zoom;
        this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), this.object.updateProjectionMatrix(), l = p !== this.object.zoom;
        const m = new ht(this._mouse.x, this._mouse.y, 0);
        m.unproject(this.object), this.object.position.sub(m).add(f), this.object.updateMatrixWorld(), a = Ve.length();
      } else
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), this.zoomToCursor = !1;
      a !== null && (this.screenSpacePanning ? this.target.set(0, 0, -1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position) : (Au.origin.copy(this.object.position), Au.direction.set(0, 0, -1).transformDirection(this.object.matrix), Math.abs(this.object.up.dot(Au.direction)) < XE ? this.object.lookAt(this.target) : (cy.setFromNormalAndCoplanarPoint(this.object.up, this.target), Au.intersectPlane(cy, this.target))));
    } else if (this.object.isOrthographicCamera) {
      const a = this.object.zoom;
      this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / this._scale)), a !== this.object.zoom && (this.object.updateProjectionMatrix(), l = !0);
    }
    return this._scale = 1, this._performCursorZoom = !1, l || this._lastPosition.distanceToSquared(this.object.position) > Of || 8 * (1 - this._lastQuaternion.dot(this.object.quaternion)) > Of || this._lastTargetPosition.distanceToSquared(this.target) > Of ? (this.dispatchEvent(ay), this._lastPosition.copy(this.object.position), this._lastQuaternion.copy(this.object.quaternion), this._lastTargetPosition.copy(this.target), !0) : !1;
  }
  _getAutoRotationAngle(t) {
    return t !== null ? Mt / 60 * this.autoRotateSpeed * t : Mt / 60 / 60 * this.autoRotateSpeed;
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
    const i = this.domElement;
    if (this.object.isPerspectiveCamera) {
      const s = this.object.position;
      Ve.copy(s).sub(this.target);
      let l = Ve.length();
      l *= Math.tan(this.object.fov / 2 * Math.PI / 180), this._panLeft(2 * t * l / i.clientHeight, this.object.matrix), this._panUp(2 * n * l / i.clientHeight, this.object.matrix);
    } else this.object.isOrthographicCamera ? (this._panLeft(t * (this.object.right - this.object.left) / this.object.zoom / i.clientWidth, this.object.matrix), this._panUp(n * (this.object.top - this.object.bottom) / this.object.zoom / i.clientHeight, this.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), this.enablePan = !1);
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
    const i = this.domElement.getBoundingClientRect(), s = t - i.left, l = n - i.top, a = i.width, f = i.height;
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
    this._rotateLeft(Mt * this._rotateDelta.x / n.clientHeight), this._rotateUp(Mt * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd), this.update();
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
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateUp(Mt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(0, this.keyPanSpeed), n = !0;
        break;
      case this.keys.BOTTOM:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateUp(-Mt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(0, -this.keyPanSpeed), n = !0;
        break;
      case this.keys.LEFT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateLeft(Mt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(this.keyPanSpeed, 0), n = !0;
        break;
      case this.keys.RIGHT:
        t.ctrlKey || t.metaKey || t.shiftKey ? this._rotateLeft(-Mt * this.rotateSpeed / this.domElement.clientHeight) : this._pan(-this.keyPanSpeed, 0), n = !0;
        break;
    }
    n && (t.preventDefault(), this.update());
  }
  _handleTouchStartRotate(t) {
    if (this._pointers.length === 1)
      this._rotateStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + n.x), s = 0.5 * (t.pageY + n.y);
      this._rotateStart.set(i, s);
    }
  }
  _handleTouchStartPan(t) {
    if (this._pointers.length === 1)
      this._panStart.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + n.x), s = 0.5 * (t.pageY + n.y);
      this._panStart.set(i, s);
    }
  }
  _handleTouchStartDolly(t) {
    const n = this._getSecondPointerPosition(t), i = t.pageX - n.x, s = t.pageY - n.y, l = Math.sqrt(i * i + s * s);
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
      const i = this._getSecondPointerPosition(t), s = 0.5 * (t.pageX + i.x), l = 0.5 * (t.pageY + i.y);
      this._rotateEnd.set(s, l);
    }
    this._rotateDelta.subVectors(this._rotateEnd, this._rotateStart).multiplyScalar(this.rotateSpeed);
    const n = this.domElement;
    this._rotateLeft(Mt * this._rotateDelta.x / n.clientHeight), this._rotateUp(Mt * this._rotateDelta.y / n.clientHeight), this._rotateStart.copy(this._rotateEnd);
  }
  _handleTouchMovePan(t) {
    if (this._pointers.length === 1)
      this._panEnd.set(t.pageX, t.pageY);
    else {
      const n = this._getSecondPointerPosition(t), i = 0.5 * (t.pageX + n.x), s = 0.5 * (t.pageY + n.y);
      this._panEnd.set(i, s);
    }
    this._panDelta.subVectors(this._panEnd, this._panStart).multiplyScalar(this.panSpeed), this._pan(this._panDelta.x, this._panDelta.y), this._panStart.copy(this._panEnd);
  }
  _handleTouchMoveDolly(t) {
    const n = this._getSecondPointerPosition(t), i = t.pageX - n.x, s = t.pageY - n.y, l = Math.sqrt(i * i + s * s);
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
    n === void 0 && (n = new Xt(), this._pointerPositions[t.pointerId] = n), n.set(t.pageX, t.pageY);
  }
  _getSecondPointerPosition(t) {
    const n = t.pointerId === this._pointers[0] ? this._pointers[1] : this._pointers[0];
    return this._pointerPositions[n];
  }
  //
  _customWheelEvent(t) {
    const n = t.deltaMode, i = {
      clientX: t.clientX,
      clientY: t.clientY,
      deltaY: t.deltaY
    };
    switch (n) {
      case 1:
        i.deltaY *= 16;
        break;
      case 2:
        i.deltaY *= 100;
        break;
    }
    return t.ctrlKey && !this._controlActive && (i.deltaY *= 10), i;
  }
}
function ZE(e) {
  this.enabled !== !1 && (this._pointers.length === 0 && (this.domElement.setPointerCapture(e.pointerId), this.domElement.addEventListener("pointermove", this._onPointerMove), this.domElement.addEventListener("pointerup", this._onPointerUp)), !this._isTrackingPointer(e) && (this._addPointer(e), e.pointerType === "touch" ? this._onTouchStart(e) : this._onMouseDown(e)));
}
function JE(e) {
  this.enabled !== !1 && (e.pointerType === "touch" ? this._onTouchMove(e) : this._onMouseMove(e));
}
function qE(e) {
  switch (this._removePointer(e), this._pointers.length) {
    case 0:
      this.domElement.releasePointerCapture(e.pointerId), this.domElement.removeEventListener("pointermove", this._onPointerMove), this.domElement.removeEventListener("pointerup", this._onPointerUp), this.dispatchEvent(f1), this.state = ye.NONE;
      break;
    case 1:
      const t = this._pointers[0], n = this._pointerPositions[t];
      this._onTouchStart({ pointerId: t, pageX: n.x, pageY: n.y });
      break;
  }
}
function $E(e) {
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
    case Ei.DOLLY:
      if (this.enableZoom === !1) return;
      this._handleMouseDownDolly(e), this.state = ye.DOLLY;
      break;
    case Ei.ROTATE:
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (this.enablePan === !1) return;
        this._handleMouseDownPan(e), this.state = ye.PAN;
      } else {
        if (this.enableRotate === !1) return;
        this._handleMouseDownRotate(e), this.state = ye.ROTATE;
      }
      break;
    case Ei.PAN:
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
  this.state !== ye.NONE && this.dispatchEvent(Up);
}
function bE(e) {
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
function ek(e) {
  this.enabled === !1 || this.enableZoom === !1 || this.state !== ye.NONE || (e.preventDefault(), this.dispatchEvent(Up), this._handleMouseWheel(this._customWheelEvent(e)), this.dispatchEvent(f1));
}
function tk(e) {
  this.enabled === !1 || this.enablePan === !1 || this._handleKeyDown(e);
}
function nk(e) {
  switch (this._trackPointer(e), this._pointers.length) {
    case 1:
      switch (this.touches.ONE) {
        case ui.ROTATE:
          if (this.enableRotate === !1) return;
          this._handleTouchStartRotate(e), this.state = ye.TOUCH_ROTATE;
          break;
        case ui.PAN:
          if (this.enablePan === !1) return;
          this._handleTouchStartPan(e), this.state = ye.TOUCH_PAN;
          break;
        default:
          this.state = ye.NONE;
      }
      break;
    case 2:
      switch (this.touches.TWO) {
        case ui.DOLLY_PAN:
          if (this.enableZoom === !1 && this.enablePan === !1) return;
          this._handleTouchStartDollyPan(e), this.state = ye.TOUCH_DOLLY_PAN;
          break;
        case ui.DOLLY_ROTATE:
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
  this.state !== ye.NONE && this.dispatchEvent(Up);
}
function rk(e) {
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
function ok(e) {
  this.enabled !== !1 && e.preventDefault();
}
function ik(e) {
  e.key === "Control" && (this._controlActive = !0, this.domElement.getRootNode().addEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function sk(e) {
  e.key === "Control" && (this._controlActive = !1, this.domElement.getRootNode().removeEventListener("keyup", this._interceptControlUp, { passive: !0, capture: !0 }));
}
function lk({ size: e }) {
  const { camera: t, gl: n } = U2(), i = W.useRef(null);
  return W.useEffect(() => {
    const s = new YE(t, n.domElement);
    return s.enableDamping = !0, s.dampingFactor = 0.08, s.autoRotate = !0, s.autoRotateSpeed = 1.5, i.current = s, () => s.dispose();
  }, [t, n]), W.useEffect(() => {
    if (!i.current) return;
    const s = Math.max(e.x, e.y, e.z), l = t, a = ie.MathUtils.degToRad(l.fov), f = s / 2 / Math.tan(a / 2) * 1.9;
    t.position.set(f * 0.6, f * 0.5, f), l.near = Math.max(0.01, f * 0.01), l.far = f * 20, l.updateProjectionMatrix(), i.current.target.set(0, 0, 0), i.current.update();
  }, [e]), $n(() => {
    var s;
    return (s = i.current) == null ? void 0 : s.update();
  }), null;
}
const cn = 45, En = 47, jt = 50, _e = 1.5, Df = jt - _e * 2, Ff = cn - _e * 2;
function uk({ actionState: e, onSize: t }) {
  const n = W.useRef(null), i = e["freezer-toggle"] ?? !1;
  return W.useLayoutEffect(() => {
    t(new ie.Vector3(En, jt, cn));
  }, []), $n(() => {
    const s = i ? Math.PI / 2 : 0;
    n.current.rotation.y += (s - n.current.rotation.y) * 0.12;
  }), // Centré sur X et Z, centré verticalement (décalage -FRZ_H/2)
  /* @__PURE__ */ E.jsxs("group", { position: [0, -jt / 2, 0], children: [
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: _e,
        sy: jt,
        sz: cn,
        x: -En / 2 + _e / 2,
        y: jt / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: En,
        sy: _e,
        sz: cn,
        x: 0,
        y: jt - _e / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: En,
        sy: _e,
        sz: cn,
        x: 0,
        y: _e / 2,
        z: 0,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: En - _e,
        sy: Df,
        sz: _e,
        x: _e / 2,
        y: jt / 2,
        z: -cn / 2 + _e / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: En - _e,
        sy: Df,
        sz: _e,
        x: _e / 2,
        y: jt / 2,
        z: cn / 2 - _e / 2,
        col: "#1a1a1a"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: 0.5,
        sy: Df,
        sz: Ff,
        x: -En / 2 + _e + 0.25,
        y: jt / 2,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: En - _e - 1,
        sy: _e,
        sz: Ff,
        x: _e / 2 - 0.5,
        y: jt * 0.35,
        z: 0,
        col: "#dddddd"
      }
    ),
    /* @__PURE__ */ E.jsx(
      Lr,
      {
        sx: En - _e - 1,
        sy: _e,
        sz: Ff,
        x: _e / 2 - 0.5,
        y: jt * 0.6,
        z: 0,
        col: "#dddddd"
      }
    ),
    [-1, 1].flatMap(
      (s) => [-1, 1].map((l) => /* @__PURE__ */ E.jsxs(
        "mesh",
        {
          position: [l * (En / 2 - 3), 1, s * (cn / 2 - 3)],
          children: [
            /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [1.5, 1.5, 2, 8] }),
            /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
          ]
        },
        `${l}${s}`
      ))
    ),
    /* @__PURE__ */ E.jsxs("group", { ref: n, position: [En / 2, 0, -cn / 2], children: [
      /* @__PURE__ */ E.jsxs("mesh", { position: [0, jt / 2, cn / 2], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [_e, jt - 2, cn - _e] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#1a1a1a", roughness: 0.3, metalness: 0.2 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [_e / 2 + 0.9, jt / 2, cn - 7], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [1.5, 25, 1.5] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#111111", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function Lr({
  sx: e,
  sy: t,
  sz: n,
  x: i,
  y: s,
  z: l,
  col: a
}) {
  return /* @__PURE__ */ E.jsxs("mesh", { position: [i, s, l], children: [
    /* @__PURE__ */ E.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: a, roughness: 0.3, metalness: 0.1 })
  ] });
}
const we = 60, kn = 60, dt = 90, me = 1.5, Bn = 8, Lu = 10, yo = 1.2, fy = 6, ri = 5 + yo + 1;
function ak({ actionState: e, onSize: t }) {
  const n = W.useRef(null), i = e["fridge-toggle"] ?? !1;
  return W.useLayoutEffect(() => {
    t(new ie.Vector3(we, dt, kn));
  }, []), $n(() => {
    const s = i ? Math.PI / 2 : 0;
    n.current.rotation.y += (s - n.current.rotation.y) * 0.12;
  }), // Centré en X/Z, centré verticalement
  /* @__PURE__ */ E.jsxs("group", { position: [0, -dt / 2, 0], children: [
    /* @__PURE__ */ E.jsx(Gn, { sx: we, sy: dt, sz: me, x: 0, y: dt / 2, z: kn / 2 - me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ E.jsx(Gn, { sx: we, sy: me, sz: kn, x: 0, y: dt - me / 2, z: 0, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ E.jsx(Gn, { sx: we, sy: me, sz: kn, x: 0, y: me / 2, z: 0, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ E.jsx(Gn, { sx: me, sy: dt - me * 2, sz: kn - me, x: -we / 2 + me / 2, y: dt / 2, z: -me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ E.jsx(Gn, { sx: me, sy: dt - me * 2, sz: kn - me, x: we / 2 - me / 2, y: dt / 2, z: -me / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
    /* @__PURE__ */ E.jsx(Gn, { sx: we - me * 2, sy: dt - me * 2, sz: 0.5, x: 0, y: dt / 2, z: kn / 2 - me - 0.3, col: "#e0e0e0" }),
    /* @__PURE__ */ E.jsx(Gn, { sx: we - me * 2 - 2, sy: me, sz: kn - me * 2, x: 0, y: dt * 0.35, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ E.jsx(Gn, { sx: we - me * 2 - 2, sy: me, sz: kn - me * 2, x: 0, y: dt * 0.62, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ E.jsx(Gn, { sx: we - me * 2 - 4, sy: 10, sz: kn - me * 2 - 4, x: 0, y: me + 5, z: -me / 2, col: "#e0e0e0" }),
    /* @__PURE__ */ E.jsxs("group", { ref: n, position: [-we / 2, 0, -kn / 2], children: [
      /* @__PURE__ */ E.jsx(Gn, { sx: we - 2, sy: dt - 2, sz: Bn, x: we / 2, y: dt / 2, z: Bn / 2, col: "#f5f5f5", m: 0.05, r: 0.2 }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we - 10, dt * 0.6, -1.5], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [1.5, 30, 2.5] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.2 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, ri + yo / 2, Bn + Lu / 2], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [we - 8, yo, Lu] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, ri + yo + fy / 2, Bn + 0.6], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [we - 8, fy, 1.2] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, 56 + yo / 2, Bn + Lu / 2], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [we - 8, yo, Lu] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, 56 + yo + 2, Bn + 0.6], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [we - 8, 4, 1.2] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#dddddd", roughness: 0.4, transparent: !0, opacity: 0.85 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, ri + 22, Bn + 5], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [3.8, 4.5, 44, 20] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.3, transparent: !0, opacity: 0.88 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, ri + 22, Bn + 5], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [4.51, 4.51, 20, 20] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#ff8c00", roughness: 0.3 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, ri + 44 + 2, Bn + 5], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [2, 3.5, 4, 16] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#ff6600", roughness: 0.3, transparent: !0, opacity: 0.88 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [we / 2, ri + 44 + 4 + 1, Bn + 5], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [2.2, 2.2, 2, 16] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#ffcc00", roughness: 0.4 })
      ] })
    ] })
  ] });
}
function Gn({
  sx: e,
  sy: t,
  sz: n,
  x: i,
  y: s,
  z: l,
  col: a,
  r: f = 0.3,
  m: p = 0.1
}) {
  return /* @__PURE__ */ E.jsxs("mesh", { position: [i, s, l], children: [
    /* @__PURE__ */ E.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: a, roughness: f, metalness: p })
  ] });
}
const Tn = 40, Mr = 60, Nt = 90, Fe = 1.5, dy = 1.5;
function ck({ actionState: e, onSize: t }) {
  const n = W.useRef(null), i = e["cabinet-toggle"] ?? !1;
  return W.useLayoutEffect(() => {
    t(new ie.Vector3(Tn, Nt, Mr));
  }, []), $n(() => {
    const s = i ? Math.PI / 2 : 0;
    n.current.rotation.y += (s - n.current.rotation.y) * 0.12;
  }), // Centré en X/Z, centré verticalement
  /* @__PURE__ */ E.jsxs("group", { position: [0, -Nt / 2, 0], children: [
    /* @__PURE__ */ E.jsx(po, { sx: Tn, sy: Nt, sz: Fe, x: 0, y: Nt / 2, z: Mr / 2 - Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ E.jsx(po, { sx: Tn, sy: Fe, sz: Mr, x: 0, y: Fe / 2, z: 0, col: "#ffffff" }),
    /* @__PURE__ */ E.jsx(po, { sx: Fe, sy: Nt - Fe * 2, sz: Mr - Fe, x: -Tn / 2 + Fe / 2, y: Nt / 2, z: -Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ E.jsx(po, { sx: Fe, sy: Nt - Fe * 2, sz: Mr - Fe, x: Tn / 2 - Fe / 2, y: Nt / 2, z: -Fe / 2, col: "#ffffff" }),
    /* @__PURE__ */ E.jsx(po, { sx: Tn - Fe * 2, sy: Nt - Fe * 2, sz: 0.5, x: 0, y: Nt / 2, z: Mr / 2 - Fe - 0.3, col: "#eeeeee" }),
    /* @__PURE__ */ E.jsx(po, { sx: Tn - Fe * 2 - 2, sy: Fe, sz: Mr - Fe * 2, x: 0, y: Nt * 0.3, z: -Fe / 2, col: "#eeeeee" }),
    /* @__PURE__ */ E.jsxs("group", { ref: n, position: [-Tn / 2, 0, -Mr / 2], children: [
      /* @__PURE__ */ E.jsx(po, { sx: Tn - 2, sy: Nt - 2, sz: dy, x: Tn / 2, y: Nt / 2, z: dy / 2, col: "#ffffff" }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [Tn - 8, Nt / 2, -1.5], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [1.5, 15, 2] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.2 })
      ] })
    ] })
  ] });
}
function po({
  sx: e,
  sy: t,
  sz: n,
  x: i,
  y: s,
  z: l,
  col: a
}) {
  return /* @__PURE__ */ E.jsxs("mesh", { position: [i, s, l], children: [
    /* @__PURE__ */ E.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: a, roughness: 0.35, metalness: 0 })
  ] });
}
const Qn = 40, Mu = 37, Wn = 60, ho = 2;
function d1({
  actionKey: e,
  pivotX: t,
  panelX: n,
  handleX: i,
  openAngle: s,
  actionState: l,
  onSize: a
}) {
  const f = W.useRef(null), p = l[e] ?? !1;
  W.useLayoutEffect(() => {
    a(new ie.Vector3(Qn, Wn, Mu));
  }, []), $n(() => {
    const y = p ? s : 0;
    f.current.rotation.y += (y - f.current.rotation.y) * 0.12;
  });
  const m = { color: "#f0f0f0", roughness: 0.3 }, g = { color: "#eeeeee", roughness: 0.4 };
  return /* @__PURE__ */ E.jsxs("group", { position: [0, -Wn / 2, 0], children: [
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, Wn / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Qn, Wn, Mu] }),
      /* @__PURE__ */ E.jsx("meshStandardMaterial", { ...m })
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, Wn / 2, Mu / 2 - 0.4], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Qn - ho * 2, Wn - ho * 2, 0.5] }),
      /* @__PURE__ */ E.jsx("meshStandardMaterial", { ...g })
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, Wn * 0.5, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Qn - ho * 2 - 2, ho, Mu - ho * 2] }),
      /* @__PURE__ */ E.jsx("meshStandardMaterial", { ...g })
    ] }),
    /* @__PURE__ */ E.jsxs("group", { ref: f, position: [t, 0, -19.5], children: [
      /* @__PURE__ */ E.jsxs("mesh", { position: [n, Wn / 2, 0], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [Qn - 2, Wn - 2, ho] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#f5f5f5", roughness: 0.2 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [i, Wn * 0.6, ho / 2 + 0.75], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [2, 12, 1.5] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.5, roughness: 0.3 })
      ] })
    ] })
  ] });
}
function fk({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ E.jsx(
    d1,
    {
      actionKey: "cbn-west-toggle",
      pivotX: -Qn / 2,
      panelX: Qn / 2,
      handleX: Qn - 6,
      openAngle: -Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
function dk({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ E.jsx(
    d1,
    {
      actionKey: "cbn-east-toggle",
      pivotX: Qn / 2,
      panelX: -Qn / 2,
      handleX: -34,
      openAngle: Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
const Xn = 90, xt = 204, Uf = 4, Es = 1.3, zt = 3, vo = 10, To = 250, Ku = 20, p1 = Xn + zt * 2 + Ku * 2, py = To - xt;
function pk() {
  const e = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#e8e4dc", roughness: 0.9 }), t = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#cc0000", roughness: 0.5 }), n = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#f5f5f0", roughness: 0.3 });
  return /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
    /* @__PURE__ */ E.jsxs("mesh", { position: [-58, To / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Ku, To, vo] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [Xn / 2 + zt + Ku / 2, To / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Ku, To, vo] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, xt + py / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [p1, py, vo] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [-46.5, xt / 2, -5.5], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [zt, xt, 1] }),
      t
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [Xn / 2 + zt / 2, xt / 2, -5.5], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [zt, xt, 1] }),
      t
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, xt + zt / 2, -5.5], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Xn + zt * 2, zt, 1] }),
      t
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [-46.5, xt / 2, vo / 2 + 0.5], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [zt, xt, 1] }),
      n
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [Xn / 2 + zt / 2, xt / 2, vo / 2 + 0.5], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [zt, xt, 1] }),
      n
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, xt + zt / 2, vo / 2 + 0.5], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Xn + zt * 2, zt, 1] }),
      n
    ] })
  ] });
}
function hk({ actionState: e, onSize: t }) {
  const n = W.useRef(null), i = e["entry-door-toggle"] ?? !1;
  W.useLayoutEffect(() => {
    t(new ie.Vector3(p1, To, vo));
  }, []), $n(() => {
    const f = i ? -(2 * Math.PI / 3) : 0;
    n.current.rotation.y += (f - n.current.rotation.y) * 0.12;
  });
  const s = 70, l = 100, a = Uf / 2;
  return /* @__PURE__ */ E.jsxs("group", { position: [0, -To / 2, 0], children: [
    /* @__PURE__ */ E.jsx(pk, {}),
    /* @__PURE__ */ E.jsxs("group", { ref: n, position: [-Xn / 2, 0, 0], children: [
      /* @__PURE__ */ E.jsxs("mesh", { position: [Xn / 2, xt / 2, 0], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [Xn, xt, Uf] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#cc0000", roughness: 0.5, metalness: 0.1 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [s, l, a + 0.5], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [3, 3, 1, 12] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [s, l, a + 3.5], rotation: [Math.PI / 2, 0, 0], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [Es, Es, 5, 8] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [s - 7, l, a + 6], rotation: [0, 0, Math.PI / 2], children: [
        /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [Es, Es, 14, 8] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }),
      [s, s - 14].map((f, p) => /* @__PURE__ */ E.jsxs("mesh", { position: [f, l, a + 6], children: [
        /* @__PURE__ */ E.jsx("sphereGeometry", { args: [Es, 8, 6] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 })
      ] }, p)),
      /* @__PURE__ */ E.jsxs("mesh", { position: [Xn / 2, xt / 2, -Uf / 2 - 5], children: [
        /* @__PURE__ */ E.jsx("sphereGeometry", { args: [5, 16, 12] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#cc0000", metalness: 0.3, roughness: 0.4 })
      ] })
    ] })
  ] });
}
const Mn = 83, ar = 204, Ls = 4, ks = 1.3, xo = 2.5, So = 10, Po = 250, Qu = 20, h1 = Mn + xo * 2 + Qu * 2, hy = Po - ar;
function mk() {
  const e = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#e8e4dc", roughness: 0.9 }), t = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#f0ede8", roughness: 0.35 });
  return /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
    /* @__PURE__ */ E.jsxs("mesh", { position: [-54, Po / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Qu, Po, So] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [Mn / 2 + xo + Qu / 2, Po / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Qu, Po, So] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, ar + hy / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [h1, hy, So] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [-42.75, ar / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [xo, ar, So] }),
      t
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [Mn / 2 + xo / 2, ar / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [xo, ar, So] }),
      t
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, ar + xo / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Mn, xo, So] }),
      t
    ] })
  ] });
}
function gk({ handleX: e, mancheDir: t }) {
  const i = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#999999", metalness: 0.85, roughness: 0.15 });
  return /* @__PURE__ */ E.jsx(E.Fragment, { children: [-1, 1].map((s) => /* @__PURE__ */ E.jsxs("group", { children: [
    /* @__PURE__ */ E.jsxs("mesh", { position: [e, 100, s * (Ls / 2 + 0.5)], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [3, 3, 1, 12] }),
      i
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [e, 100, s * (Ls / 2 + 3.5)], rotation: [Math.PI / 2, 0, 0], children: [
      /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [ks, ks, 5, 8] }),
      i
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [e + t * 7, 100, s * (Ls / 2 + 6)], rotation: [0, 0, Math.PI / 2], children: [
      /* @__PURE__ */ E.jsx("cylinderGeometry", { args: [ks, ks, 14, 8] }),
      i
    ] }),
    [0, t * 14].map((l, a) => /* @__PURE__ */ E.jsxs("mesh", { position: [e + l, 100, s * (Ls / 2 + 6)], children: [
      /* @__PURE__ */ E.jsx("sphereGeometry", { args: [ks, 8, 6] }),
      i
    ] }, a))
  ] }, s)) });
}
function m1({
  actionKey: e,
  pivotX: t,
  panelX: n,
  handleX: i,
  mancheDir: s,
  openAngle: l,
  actionState: a,
  onSize: f
}) {
  const p = W.useRef(null), m = a[e] ?? !1;
  return W.useLayoutEffect(() => {
    f(new ie.Vector3(h1, Po, So));
  }, []), $n(() => {
    const g = m ? l : 0;
    p.current.rotation.y += (g - p.current.rotation.y) * 0.12;
  }), /* @__PURE__ */ E.jsxs("group", { position: [0, -Po / 2, 0], children: [
    /* @__PURE__ */ E.jsx(mk, {}),
    /* @__PURE__ */ E.jsxs("group", { ref: p, position: [t, 0, 0], children: [
      /* @__PURE__ */ E.jsxs("mesh", { position: [n, ar / 2, 0], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [Mn, ar, Ls] }),
        /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#f5f5f5", roughness: 0.4 })
      ] }),
      /* @__PURE__ */ E.jsx(gk, { handleX: i, mancheDir: s })
    ] })
  ] });
}
function yk({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ E.jsx(
    m1,
    {
      actionKey: "living-door-toggle",
      pivotX: Mn / 2,
      panelX: -Mn / 2,
      handleX: -Mn + 15,
      mancheDir: 1,
      openAngle: -Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
function vk({ actionState: e, onSize: t }) {
  return /* @__PURE__ */ E.jsx(
    m1,
    {
      actionKey: "bathroom-door-toggle",
      pivotX: -Mn / 2,
      panelX: Mn / 2,
      handleX: Mn - 15,
      mancheDir: -1,
      openAngle: Math.PI / 2,
      actionState: e,
      onSize: t
    }
  );
}
const Ui = 160, Co = Ui / 2, Ro = 20, ll = 190, g1 = Ro + ll, It = 8, _i = 5, oi = ll - It * 2, xk = Co - It * 2, Ms = 10, Ao = 250, Xu = 20, y1 = Ui + Xu * 2, my = Ao - g1;
function gy({ cx: e, baseY: t }) {
  const n = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#f0f0f0", roughness: 0.3 }), i = /* @__PURE__ */ E.jsx(
    "meshPhysicalMaterial",
    {
      color: "#88ccff",
      transparent: !0,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.1,
      side: ie.DoubleSide
    }
  );
  return /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
    /* @__PURE__ */ E.jsxs("mesh", { position: [e, t + ll - It / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Co, It, _i] }),
      n
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [e, t + It / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Co, It, _i] }),
      n
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [e - Co / 2 + It / 2, t + It + oi / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [It, oi, _i] }),
      n
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [e + Co / 2 - It / 2, t + It + oi / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [It, oi, _i] }),
      n
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [e, t + It + oi / 2, 0], children: [
      /* @__PURE__ */ E.jsx("planeGeometry", { args: [xk, oi] }),
      i
    ] })
  ] });
}
function Sk() {
  const e = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#e0dbd4", roughness: 0.9 });
  return /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
    /* @__PURE__ */ E.jsxs("mesh", { position: [-90, Ao / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Xu, Ao, Ms] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [Ui / 2 + Xu / 2, Ao / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Xu, Ao, Ms] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, g1 + my / 2, 0], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [y1, my, Ms] }),
      e
    ] }),
    /* @__PURE__ */ E.jsxs("mesh", { position: [0, Ro / 2, -4], children: [
      /* @__PURE__ */ E.jsx("boxGeometry", { args: [Ui, Ro, Ms + 4] }),
      e
    ] })
  ] });
}
function wk({ actionState: e, onSize: t }) {
  const n = W.useRef(null), i = e["door-toggle"] ?? !1;
  W.useLayoutEffect(() => {
    t(new ie.Vector3(y1, Ao, Ms));
  }, []), $n(() => {
    const a = i ? Math.PI / 2 : 0;
    n.current.rotation.y += (a - n.current.rotation.y) * 0.12;
  });
  const s = /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#888888", metalness: 0.6, roughness: 0.3 }), l = -Co + It + 4;
  return /* @__PURE__ */ E.jsxs("group", { position: [0, -Ao / 2, 0], children: [
    /* @__PURE__ */ E.jsx(Sk, {}),
    /* @__PURE__ */ E.jsx(gy, { cx: -Ui / 4, baseY: Ro }),
    /* @__PURE__ */ E.jsxs("group", { ref: n, position: [Ui / 2, 0, 0], children: [
      /* @__PURE__ */ E.jsx(gy, { cx: -Co / 2, baseY: Ro }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [l, Ro + ll * 0.5, _i / 2 + 0.5], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [3, 20, 1] }),
        s
      ] }),
      /* @__PURE__ */ E.jsxs("mesh", { position: [l - 1, Ro + ll * 0.5, _i / 2 + 4], children: [
        /* @__PURE__ */ E.jsx("boxGeometry", { args: [1.5, 1.5, 8] }),
        s
      ] })
    ] })
  ] });
}
const pt = 3.5, lr = 1.5, Hf = 39, jr = 34, Ns = 33.5;
function _k(e) {
  return e * Ns + 2 * pt + (e - 1) * lr;
}
function Ek(e) {
  return e * jr + 2 * pt + (e - 1) * lr;
}
const kk = {
  "kallax-ne-2x1": { cols: 2, rows: 1, dronas: !0 },
  "kallax-ne-2x2": { cols: 2, rows: 2, dronas: !0 },
  "kallax-se-2x1": { cols: 2, rows: 1, dronas: !0 },
  "kallax-nw-2x1": { cols: 2, rows: 1, dronas: !0 },
  "kallax-nw-1x1-a": { cols: 1, rows: 1, dronas: !0 },
  "kallax-nw-1x1-b": { cols: 1, rows: 1, dronas: !0 },
  "kallax-sw-2x2": { cols: 2, rows: 2, dronas: !0 },
  "kallax-sw-2x1": { cols: 2, rows: 1, dronas: !1 }
};
function ii({ sx: e, sy: t, sz: n, x: i, y: s, z: l }) {
  return /* @__PURE__ */ E.jsxs("mesh", { position: [i, s, l], children: [
    /* @__PURE__ */ E.jsx("boxGeometry", { args: [e, t, n] }),
    /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#ffffff", roughness: 0.7 })
  ] });
}
function Nr({ item: e, onSize: t }) {
  const n = kk[e.id] ?? { cols: 2, rows: 1, dronas: !1 }, i = _k(n.cols), s = Ek(n.rows);
  W.useLayoutEffect(() => {
    t(new ie.Vector3(i, s, Hf));
  }, []);
  const l = s - 2 * pt, a = i / 2 - pt / 2 - 0.1;
  return /* @__PURE__ */ E.jsxs("group", { position: [0, -s / 2, 0], children: [
    /* @__PURE__ */ E.jsx(ii, { sx: i, sy: pt, sz: Hf, x: 0, y: s / 2 - pt / 2, z: 0 }),
    /* @__PURE__ */ E.jsx(ii, { sx: i, sy: pt, sz: Hf, x: 0, y: -s / 2 + pt / 2, z: 0 }),
    /* @__PURE__ */ E.jsx(ii, { sx: pt, sy: l, sz: 38.8, x: -a, y: 0, z: 0 }),
    /* @__PURE__ */ E.jsx(ii, { sx: pt, sy: l, sz: 38.8, x: a, y: 0, z: 0 }),
    Array.from({ length: n.rows - 1 }, (f, p) => {
      const m = s / 2 - pt - (p + 1) * jr - (p + 0.5) * lr;
      return /* @__PURE__ */ E.jsx(
        ii,
        {
          sx: i - 2 * pt - 0.2,
          sy: lr,
          sz: 38.6,
          x: 0,
          y: m,
          z: 0
        },
        `h${p}`
      );
    }),
    Array.from({ length: n.cols - 1 }, (f, p) => {
      const m = -i / 2 + pt + (p + 1) * Ns + (p + 0.5) * lr;
      return Array.from({ length: n.rows }, (g, y) => {
        const v = s / 2 - pt - jr / 2 - y * (jr + lr);
        return /* @__PURE__ */ E.jsx(
          ii,
          {
            sx: lr,
            sy: jr,
            sz: 38.4,
            x: m,
            y: v,
            z: 0
          },
          `v${p}${y}`
        );
      });
    }),
    n.dronas && Array.from(
      { length: n.rows },
      (f, p) => Array.from({ length: n.cols }, (m, g) => {
        const y = -i / 2 + pt + Ns / 2 + g * (Ns + lr), v = s / 2 - pt - jr / 2 - p * (jr + lr);
        return /* @__PURE__ */ E.jsxs("mesh", { position: [y, v, 0], children: [
          /* @__PURE__ */ E.jsx("boxGeometry", { args: [Ns - 1, jr - 1, 33] }),
          /* @__PURE__ */ E.jsx("meshStandardMaterial", { color: "#c4a882", roughness: 0.8 })
        ] }, `drona${p}${g}`);
      })
    )
  ] });
}
const Tk = {
  freezer: uk,
  fridge: ak,
  "cabinet-wood": ck,
  "bathroom-cabinet-west": fk,
  "bathroom-cabinet-east": dk,
  "door-entry": hk,
  "door-living": yk,
  "door-sdb": vk,
  "door-glass": wk,
  "kallax-ne-2x1": Nr,
  "kallax-ne-2x2": Nr,
  "kallax-se-2x1": Nr,
  "kallax-nw-2x1": Nr,
  "kallax-nw-1x1-a": Nr,
  "kallax-nw-1x1-b": Nr,
  "kallax-sw-2x2": Nr,
  "kallax-sw-2x1": Nr
}, Pk = {
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
function Ck({ item: e, actionState: t }) {
  const [n, i] = W.useState(null), s = W.useMemo(() => {
    const a = (e == null ? void 0 : e.dims) ?? { w: 50, h: 50, d: 50 };
    return new ie.Vector3(a.w / 10, a.h / 10, a.d / 10);
  }, []), l = e != null && e.id ? Tk[e.id] : void 0;
  return /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
    /* @__PURE__ */ E.jsx("ambientLight", { intensity: 0.7 }),
    /* @__PURE__ */ E.jsx("directionalLight", { position: [200, 400, 300], intensity: 1.3 }),
    /* @__PURE__ */ E.jsx("directionalLight", { position: [-150, 80, -200], intensity: 0.4 }),
    /* @__PURE__ */ E.jsx(lk, { size: n ?? s }),
    l ? (
      // Composant TSX dédié (géométrie procédurale + interactivité)
      /* @__PURE__ */ E.jsx(l, { item: e, actionState: t, onSize: i })
    ) : e != null && e.glbPath ? (
      // Chargement GLB générique
      /* @__PURE__ */ E.jsx(W.Suspense, { fallback: /* @__PURE__ */ E.jsx(QE, {}), children: /* @__PURE__ */ E.jsx(VE, { path: e.glbPath, onSize: i }) })
    ) : e ? (
      // Fallback : boîte aux dimensions de l'inventaire (dims peut être absent pour les espaces)
      /* @__PURE__ */ E.jsx(KE, { dims: e.dims ?? { w: 50, h: 50, d: 50 } })
    ) : null
  ] });
}
function Rk({ item: e, onAction: t }) {
  var l;
  const [n, i] = W.useState({});
  W.useEffect(() => {
    i({});
  }, [e == null ? void 0 : e.id]);
  const s = (a) => {
    i((f) => ({ ...f, [a]: !f[a] })), t == null || t(a);
  };
  return /* @__PURE__ */ E.jsxs("div", { style: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    background: "#111118",
    fontFamily: "'Segoe UI', sans-serif"
  }, children: [
    /* @__PURE__ */ E.jsx("div", { style: { flex: 1, minHeight: 0 }, children: /* @__PURE__ */ E.jsx(
      sE,
      {
        style: { width: "100%", height: "100%" },
        camera: { position: [0, 50, 200], fov: 45 },
        gl: { antialias: !0 },
        children: /* @__PURE__ */ E.jsx(
          Ck,
          {
            item: e,
            actionState: n
          },
          (e == null ? void 0 : e.id) ?? "__empty__"
        )
      }
    ) }),
    /* @__PURE__ */ E.jsx("div", { style: {
      fontSize: 11,
      color: "#888",
      textAlign: "center",
      padding: "6px 8px",
      minHeight: 32
    }, children: e ? /* @__PURE__ */ E.jsxs(E.Fragment, { children: [
      /* @__PURE__ */ E.jsx("strong", { style: { color: "#fff" }, children: e.name }),
      e.dims && /* @__PURE__ */ E.jsxs("span", { style: { color: "#666", marginLeft: 6, fontFamily: "monospace" }, children: [
        e.dims.w,
        " × ",
        e.dims.d,
        " × ",
        e.dims.h,
        " cm"
      ] })
    ] }) : "Clique sur un objet" }),
    (l = e == null ? void 0 : e.actions) != null && l.length ? /* @__PURE__ */ E.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "0 8px 8px" }, children: e.actions.map((a) => {
      const [f, p] = Pk[a] ?? [a, a], m = n[a] ?? !1;
      return /* @__PURE__ */ E.jsx(
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
const _a = /* @__PURE__ */ new WeakMap();
function Lk(e, t, n) {
  let i = _a.get(e);
  i || (i = Fv(e), _a.set(e, i)), i.render(/* @__PURE__ */ E.jsx(Rk, { item: t, onAction: n }));
}
function Mk(e) {
  const t = _a.get(e);
  t && (t.unmount(), _a.delete(e));
}
export {
  Lk as mountPreview,
  Mk as unmountPreview
};
