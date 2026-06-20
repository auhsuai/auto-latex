/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/shared/ai-service.ts":
/*!**********************************!*\
  !*** ./src/shared/ai-service.ts ***!
  \**********************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getAISettings: function() { return /* binding */ getAISettings; },
/* harmony export */   saveAISettings: function() { return /* binding */ saveAISettings; },
/* harmony export */   sendChatMessage: function() { return /* binding */ sendChatMessage; }
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var SETTINGS_KEY = 'auto_latex_ai_settings';
function getAISettings() {
  var raw = localStorage.getItem(SETTINGS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse AI Settings", e);
    }
  }
  return {
    provider: 'gemini',
    apiKey: ''
  };
}
function saveAISettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
var SYSTEM_PROMPT = "B\u1EA1n l\xE0 tr\u1EE3 l\xFD AI t\xEAn l\xE0 Auto-LaTeX Copilot, h\u1ED7 tr\u1EE3 ng\u01B0\u1EDDi d\xF9ng so\u1EA1n th\u1EA3o v\xE0 ch\u1EC9nh s\u1EEDa c\xF4ng th\u1EE9c to\xE1n h\u1ECDc LaTeX trong Microsoft Word.\nB\u1EA1n c\xF3 th\u1EC3 tr\xF2 chuy\u1EC7n b\xECnh th\u01B0\u1EDDng v\xE0 gi\u1EA3i \u0111\xE1p th\u1EAFc m\u1EAFc c\u1EE7a ng\u01B0\u1EDDi d\xF9ng.\n\nKHI NG\u01AF\u1EDCI D\xD9NG Y\xCAU C\u1EA6U T\u1EA0O HO\u1EB6C CH\u1EC8NH S\u1EECA C\xD4NG TH\u1EE8C TO\xC1N H\u1ECCC:\n1. B\u1EA1n ph\u1EA3i xu\u1EA5t c\xF4ng th\u1EE9c to\xE1n h\u1ECDc b\u1EB1ng ng\xF4n ng\u1EEF LaTeX.\n2. B\u1EA1n B\u1EAET BU\u1ED8C ph\u1EA3i b\u1ECDc to\xE0n b\u1ED9 m\xE3 LaTeX c\u1EE7a c\xF4ng th\u1EE9c \u0111\xF3 b\xEAn trong c\u1EB7p th\u1EBB <formula> v\xE0 </formula>. \nV\xED d\u1EE5: <formula>x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}</formula>\n3. KH\xD4NG s\u1EED d\u1EE5ng k\xFD hi\u1EC7u \u0111\xF4 la ($ ho\u1EB7c $$) b\xEAn trong th\u1EBB <formula> tr\u1EEB khi th\u1EADt s\u1EF1 c\u1EA7n thi\u1EBFt.\n4. M\u1ECDi v\u0103n b\u1EA3n gi\u1EA3i th\xEDch c\xF3 th\u1EC3 \u0111\u1EC3 \u1EDF ngo\xE0i th\u1EBB <formula>.\nH\u1EC7 th\u1ED1ng s\u1EBD t\u1EF1 \u0111\u1ED9ng t\xECm th\u1EBB <formula> v\xE0 ch\xE8n v\xE0o v\u0103n b\u1EA3n c\u1EE7a ng\u01B0\u1EDDi d\xF9ng.";
function sendChatMessage(_x) {
  return _sendChatMessage.apply(this, arguments);
}
function _sendChatMessage() {
  _sendChatMessage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(history) {
    var contextText,
      settings,
      messagesToSend,
      lastUserMsgIndex,
      _args = arguments;
    return _regenerator().w(function (_context) {
      while (1) switch (_context.n) {
        case 0:
          contextText = _args.length > 1 && _args[1] !== undefined ? _args[1] : "";
          settings = getAISettings();
          if (settings.apiKey) {
            _context.n = 1;
            break;
          }
          throw new Error("Missing API Key. Please open Settings to set your API Key.");
        case 1:
          // Clone history to avoid modifying original array
          messagesToSend = _toConsumableArray(history); // If contextText exists, append it to the LAST user message
          if (contextText && contextText.trim() !== "") {
            lastUserMsgIndex = messagesToSend.findLastIndex(function (m) {
              return m.role === "user";
            });
            if (lastUserMsgIndex >= 0) {
              messagesToSend[lastUserMsgIndex] = _objectSpread(_objectSpread({}, messagesToSend[lastUserMsgIndex]), {}, {
                content: "".concat(messagesToSend[lastUserMsgIndex].content, "\n\n[B\u1ED1i c\u1EA3nh v\u0103n b\u1EA3n \u0111ang b\xF4i \u0111en]:\n").concat(contextText)
              });
            }
          }
          if (!(settings.provider === 'openai')) {
            _context.n = 2;
            break;
          }
          return _context.a(2, callOpenAICompatible(messagesToSend, settings.apiKey, "https://api.openai.com/v1/chat/completions", "gpt-4o-mini"));
        case 2:
          if (!(settings.provider === 'deepseek')) {
            _context.n = 3;
            break;
          }
          return _context.a(2, callOpenAICompatible(messagesToSend, settings.apiKey, "https://api.deepseek.com/chat/completions", "deepseek-reasoner", {
            thinking: {
              type: "enabled"
            },
            reasoning_effort: "high"
          }));
        case 3:
          return _context.a(2, callGemini(messagesToSend, settings.apiKey));
        case 4:
          return _context.a(2);
      }
    }, _callee);
  }));
  return _sendChatMessage.apply(this, arguments);
}
function callOpenAICompatible(_x2, _x3, _x4, _x5) {
  return _callOpenAICompatible.apply(this, arguments);
}
function _callOpenAICompatible() {
  _callOpenAICompatible = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(history, apiKey, endpoint, model) {
    var _data$choices$;
    var extraBodyParams,
      apiMessages,
      body,
      response,
      _error$error,
      error,
      data,
      content,
      _args2 = arguments;
    return _regenerator().w(function (_context2) {
      while (1) switch (_context2.n) {
        case 0:
          extraBodyParams = _args2.length > 4 && _args2[4] !== undefined ? _args2[4] : {};
          apiMessages = [{
            role: "system",
            content: SYSTEM_PROMPT
          }].concat(_toConsumableArray(history));
          body = _objectSpread({
            model: model,
            messages: apiMessages,
            temperature: 0.2
          }, extraBodyParams); // Deepseek thinking mode does not support temperature, so we remove it if thinking is enabled
          if (extraBodyParams.thinking && extraBodyParams.thinking.type === "enabled") {
            delete body.temperature;
          }
          _context2.n = 1;
          return fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer ".concat(apiKey)
            },
            body: JSON.stringify(body)
          });
        case 1:
          response = _context2.v;
          if (response.ok) {
            _context2.n = 3;
            break;
          }
          _context2.n = 2;
          return response.json();
        case 2:
          error = _context2.v;
          throw new Error(((_error$error = error.error) === null || _error$error === void 0 ? void 0 : _error$error.message) || "OpenAI API Error");
        case 3:
          _context2.n = 4;
          return response.json();
        case 4:
          data = _context2.v;
          content = ((_data$choices$ = data.choices[0]) === null || _data$choices$ === void 0 || (_data$choices$ = _data$choices$.message) === null || _data$choices$ === void 0 ? void 0 : _data$choices$.content) || "";
          return _context2.a(2, content.trim());
      }
    }, _callee2);
  }));
  return _callOpenAICompatible.apply(this, arguments);
}
function callGemini(_x6, _x7) {
  return _callGemini.apply(this, arguments);
}
function _callGemini() {
  _callGemini = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(history, apiKey) {
    var _data$candidates;
    var url, geminiContents, response, _error$error2, error, data, content;
    return _regenerator().w(function (_context3) {
      while (1) switch (_context3.n) {
        case 0:
          // Using Gemini 1.5 Flash for speed
          url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=".concat(apiKey); // Convert history format to Gemini format (user/model)
          geminiContents = history.map(function (msg) {
            return {
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{
                text: msg.content
              }]
            };
          });
          _context3.n = 1;
          return fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              system_instruction: {
                parts: [{
                  text: SYSTEM_PROMPT
                }]
              },
              contents: geminiContents,
              generationConfig: {
                temperature: 0.2
              }
            })
          });
        case 1:
          response = _context3.v;
          if (response.ok) {
            _context3.n = 3;
            break;
          }
          _context3.n = 2;
          return response.json();
        case 2:
          error = _context3.v;
          throw new Error(((_error$error2 = error.error) === null || _error$error2 === void 0 ? void 0 : _error$error2.message) || "Gemini API Error");
        case 3:
          _context3.n = 4;
          return response.json();
        case 4:
          data = _context3.v;
          content = ((_data$candidates = data.candidates) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates[0]) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates.content) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates.parts) === null || _data$candidates === void 0 || (_data$candidates = _data$candidates[0]) === null || _data$candidates === void 0 ? void 0 : _data$candidates.text) || "";
          return _context3.a(2, content.trim());
      }
    }, _callee3);
  }));
  return _callGemini.apply(this, arguments);
}

/***/ }),

/***/ "./src/taskpane/taskpane.css":
/*!***********************************!*\
  !*** ./src/taskpane/taskpane.css ***!
  \***********************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__.p + "5caa4534b55e32dcee71.css";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	!function() {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = function(chunkId) {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce(function(promises, key) {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	!function() {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "auto-latex:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = function(url, done, key, chunkId) {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = function(prev, event) {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach(function(fn) { return fn(event); });
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	!function() {
/******/ 		__webpack_require__.b = (typeof document !== 'undefined' && document.baseURI) || self.location.href;
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"taskpane": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = function(chunkId, promises) {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise(function(resolve, reject) { installedChunkData = installedChunks[chunkId] = [resolve, reject]; });
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = function(event) {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = function(parentChunkLoadingFunction, data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some(function(id) { return installedChunks[id] !== 0; })) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkauto_latex"] = self["webpackChunkauto_latex"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other entry modules.
!function() {
var __webpack_exports__ = {};
/*!**********************************!*\
  !*** ./src/taskpane/taskpane.ts ***!
  \**********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _shared_ai_service__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../shared/ai-service */ "./src/shared/ai-service.ts");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }

Office.onReady(function (info) {
  if (info.host === Office.HostType.Word) {
    // ---- Elements Setup ----
    var mainView = document.getElementById("main-view");
    var chatView = document.getElementById("chat-view");
    var fabChat = document.getElementById("fab-chat");
    var appBody = document.getElementById("app-body");

    // Converter UI elements
    var convertDocBtn = document.getElementById("convert-doc");
    var convertSelBtn = document.getElementById("convert-sel");
    var cancelMsg = document.getElementById("cancel-msg");
    var cancelLink = document.getElementById("cancel-link");

    // Chat UI elements
    var btnBack = document.getElementById("btn-back");
    var btnSettings = document.getElementById("btn-settings");
    var btnSendChat = document.getElementById("btn-send-chat");
    var chatInput = document.getElementById("chat-input");
    var chatMessages = document.getElementById("chat-messages");

    // Settings UI elements
    var settingsModal = document.getElementById("settings-modal");
    var btnCloseSettings = document.getElementById("btn-close-settings");
    var btnSaveSettings = document.getElementById("btn-save-settings");
    var providerSelect = document.getElementById("ai-provider");
    var apiKeyInput = document.getElementById("ai-api-key");
    if (appBody) {
      appBody.style.display = "flex";
    }

    // ---- View Toggles ----
    fabChat === null || fabChat === void 0 || fabChat.addEventListener("click", function () {
      if (mainView) mainView.style.display = "none";
      if (fabChat) fabChat.style.display = "none";
      if (chatView) chatView.style.display = "flex";
    });
    btnBack === null || btnBack === void 0 || btnBack.addEventListener("click", function () {
      if (chatView) chatView.style.display = "none";
      if (mainView) mainView.style.display = "flex";
      if (fabChat) fabChat.style.display = "flex";
    });

    // ---- Settings Logic ----
    var loadSettingsToUI = function loadSettingsToUI() {
      var settings = (0,_shared_ai_service__WEBPACK_IMPORTED_MODULE_0__.getAISettings)();
      if (providerSelect) providerSelect.value = settings.provider;
      if (apiKeyInput) apiKeyInput.value = settings.apiKey;
    };
    btnSettings === null || btnSettings === void 0 || btnSettings.addEventListener("click", function () {
      loadSettingsToUI();
      if (settingsModal) settingsModal.style.display = "flex";
    });
    btnCloseSettings === null || btnCloseSettings === void 0 || btnCloseSettings.addEventListener("click", function () {
      if (settingsModal) settingsModal.style.display = "none";
    });
    btnSaveSettings === null || btnSaveSettings === void 0 || btnSaveSettings.addEventListener("click", function () {
      var settings = {
        provider: providerSelect.value,
        apiKey: apiKeyInput.value.trim()
      };
      (0,_shared_ai_service__WEBPACK_IMPORTED_MODULE_0__.saveAISettings)(settings);
      if (settingsModal) settingsModal.style.display = "none";
    });

    // ---- Original Converter Logic ----
    var handleConversion = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(btn, isSelection) {
        var originalText, progressSpan, timeoutId, state, _yield$import, runConversion;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              originalText = btn.innerText;
              progressSpan = document.getElementById("progress-text");
              timeoutId = null;
              state = {
                isCancelled: false,
                onProgress: function onProgress(remaining, total) {
                  if (cancelMsg && progressSpan) {
                    if (total > 0 && remaining > 0) {
                      btn.innerText = "Converting, ".concat(remaining, " left...");
                      progressSpan.innerText = "So long? ";
                    } else if (remaining === 0) {
                      cancelMsg.style.display = "none";
                      btn.innerText = "Finishing...";
                    }
                  }
                }
              };
              _context.p = 1;
              btn.disabled = true;
              btn.innerText = "Converting...";
              if (cancelMsg && cancelLink) {
                timeoutId = setTimeout(function () {
                  if (!state.isCancelled && btn.innerText.includes("Converting")) {
                    cancelMsg.style.display = "block";
                  }
                }, 5000);
                cancelLink.onclick = function (e) {
                  e.preventDefault();
                  state.isCancelled = true;
                  btn.innerText = "Cancelling...";
                  cancelMsg.style.display = "none";
                };
              }
              _context.n = 2;
              return Promise.all(/*! import() */[__webpack_require__.e("vendors-node_modules_katex_dist_katex_mjs-node_modules_remark-math_lib_index_js-node_modules_-62e92d"), __webpack_require__.e("src_shared_converter_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../shared/converter */ "./src/shared/converter.ts"));
            case 2:
              _yield$import = _context.v;
              runConversion = _yield$import.runConversion;
              _context.n = 3;
              return runConversion(isSelection, state);
            case 3:
              _context.p = 3;
              if (timeoutId) clearTimeout(timeoutId);
              if (cancelMsg) cancelMsg.style.display = "none";
              btn.disabled = false;
              btn.innerText = originalText;
              return _context.f(3);
            case 4:
              return _context.a(2);
          }
        }, _callee, null, [[1,, 3, 4]]);
      }));
      return function handleConversion(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();
    if (convertDocBtn) {
      convertDocBtn.onclick = function () {
        return handleConversion(convertDocBtn, false);
      };
    }
    if (convertSelBtn) {
      convertSelBtn.onclick = function () {
        return handleConversion(convertSelBtn, true);
      };
    }

    // ---- Chat AI Logic ----
    var chatHistory = [];
    var appendUserMessage = function appendUserMessage(text) {
      if (!chatMessages) return;
      var div = document.createElement("div");
      div.className = "chat-msg user-msg";
      div.innerHTML = "<div class=\"msg-bubble\">".concat(escapeHtml(text), "</div>");
      chatMessages.appendChild(div);
      scrollToBottom();
    };
    var appendAIMessage = function appendAIMessage(textPart, latexPart, mathMLHtml) {
      if (!chatMessages) return;
      var div = document.createElement("div");
      div.className = "chat-msg ai-msg";
      var html = '<div class="msg-bubble">';
      if (textPart && textPart.trim() !== "") {
        html += "<div style=\"margin-bottom: ".concat(mathMLHtml ? '12px' : '0', ";\">").concat(escapeHtml(textPart).replace(/\n/g, '<br>'), "</div>");
      }
      if (mathMLHtml) {
        html += "<div style=\"font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px;\">Created Formula:</div>";
        html += mathMLHtml;
      }
      html += '</div>';
      div.innerHTML = html;
      chatMessages.appendChild(div);
      scrollToBottom();
    };
    var appendAIError = function appendAIError(errorStr) {
      if (!chatMessages) return;
      var div = document.createElement("div");
      div.className = "chat-msg ai-msg";
      div.innerHTML = "<div class=\"msg-bubble\" style=\"color: #d83b01;\">Error: ".concat(escapeHtml(errorStr), "</div>");
      chatMessages.appendChild(div);
      scrollToBottom();
    };
    var skeletonEl = null;
    var showSkeleton = function showSkeleton() {
      if (!chatMessages) return;
      skeletonEl = document.createElement("div");
      skeletonEl.className = "chat-msg ai-msg";
      skeletonEl.innerHTML = "\n            <div class=\"skeleton-loader\">\n                <div class=\"skeleton-line\"></div>\n                <div class=\"skeleton-line\"></div>\n                <div class=\"skeleton-line\"></div>\n            </div>";
      chatMessages.appendChild(skeletonEl);
      scrollToBottom();
    };
    var removeSkeleton = function removeSkeleton() {
      if (skeletonEl && skeletonEl.parentNode) {
        skeletonEl.parentNode.removeChild(skeletonEl);
      }
      skeletonEl = null;
    };
    var scrollToBottom = function scrollToBottom() {
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    };
    var escapeHtml = function escapeHtml(unsafe) {
      return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    var handleSendChat = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var prompt, selectedText, aiResponseText, formulaRegex, match, lastIndex, textParts, formulas, normalText, _yield$import2, sanitizeLaTeX, getMathML, _loop, i, _t;
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.p = _context5.n) {
            case 0:
              prompt = chatInput === null || chatInput === void 0 ? void 0 : chatInput.value.trim();
              if (prompt) {
                _context5.n = 1;
                break;
              }
              return _context5.a(2);
            case 1:
              chatInput.value = "";
              btnSendChat.disabled = true;
              appendUserMessage(prompt);
              showSkeleton();
              _context5.p = 2;
              selectedText = ""; // Get currently selected text to provide context
              _context5.n = 3;
              return Word.run(/*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(context) {
                  var selection;
                  return _regenerator().w(function (_context2) {
                    while (1) switch (_context2.n) {
                      case 0:
                        selection = context.document.getSelection();
                        selection.load("text");
                        _context2.n = 1;
                        return context.sync();
                      case 1:
                        selectedText = selection.text;
                      case 2:
                        return _context2.a(2);
                    }
                  }, _callee2);
                }));
                return function (_x3) {
                  return _ref3.apply(this, arguments);
                };
              }());
            case 3:
              // Add user message to history
              chatHistory.push({
                role: "user",
                content: prompt
              });

              // Call AI with full history
              _context5.n = 4;
              return (0,_shared_ai_service__WEBPACK_IMPORTED_MODULE_0__.sendChatMessage)(chatHistory, selectedText);
            case 4:
              aiResponseText = _context5.v;
              removeSkeleton();

              // Add AI response to history
              chatHistory.push({
                role: "assistant",
                content: aiResponseText
              });

              // Parse response for <formula> tags
              formulaRegex = /<formula>([\s\S]*?)<\/formula>/g;
              lastIndex = 0;
              textParts = [];
              formulas = [];
              while ((match = formulaRegex.exec(aiResponseText)) !== null) {
                textParts.push(aiResponseText.substring(lastIndex, match.index));
                formulas.push(match[1]);
                lastIndex = formulaRegex.lastIndex;
              }
              textParts.push(aiResponseText.substring(lastIndex));
              normalText = textParts.join("").trim();
              if (!(formulas.length === 0)) {
                _context5.n = 5;
                break;
              }
              appendAIMessage(normalText, null, null);
              _context5.n = 9;
              break;
            case 5:
              _context5.n = 6;
              return Promise.all(/*! import() */[__webpack_require__.e("vendors-node_modules_katex_dist_katex_mjs-node_modules_remark-math_lib_index_js-node_modules_-62e92d"), __webpack_require__.e("src_shared_converter_ts")]).then(__webpack_require__.bind(__webpack_require__, /*! ../shared/converter */ "./src/shared/converter.ts"));
            case 6:
              _yield$import2 = _context5.v;
              sanitizeLaTeX = _yield$import2.sanitizeLaTeX;
              getMathML = _yield$import2.getMathML;
              _loop = /*#__PURE__*/_regenerator().m(function _loop() {
                var rawLatex, isBlock, latexClean, mathML;
                return _regenerator().w(function (_context4) {
                  while (1) switch (_context4.n) {
                    case 0:
                      rawLatex = formulas[i].trim(); // Optional cleaning
                      if (rawLatex.startsWith("$$") && rawLatex.endsWith("$$")) {
                        rawLatex = rawLatex.substring(2, rawLatex.length - 2).trim();
                      }
                      isBlock = rawLatex.includes("$$") || rawLatex.includes("\\begin{");
                      latexClean = sanitizeLaTeX(rawLatex, isBlock);
                      mathML = getMathML(latexClean, isBlock);
                      if (!mathML) {
                        _context4.n = 2;
                        break;
                      }
                      appendAIMessage(i === 0 ? normalText : "", latexClean, mathML);
                      // Insert into Word Document replacing selection
                      _context4.n = 1;
                      return Word.run(/*#__PURE__*/function () {
                        var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(context) {
                          var selection, wrappedMathML;
                          return _regenerator().w(function (_context3) {
                            while (1) switch (_context3.n) {
                              case 0:
                                selection = context.document.getSelection();
                                wrappedMathML = "<html><body>".concat(mathML, "</body></html>");
                                selection.insertHtml(wrappedMathML, Word.InsertLocation.replace);
                                _context3.n = 1;
                                return context.sync();
                              case 1:
                                return _context3.a(2);
                            }
                          }, _callee3);
                        }));
                        return function (_x4) {
                          return _ref4.apply(this, arguments);
                        };
                      }());
                    case 1:
                      _context4.n = 3;
                      break;
                    case 2:
                      appendAIError("Failed to render LaTeX formula.");
                    case 3:
                      return _context4.a(2);
                  }
                }, _loop);
              });
              i = 0;
            case 7:
              if (!(i < formulas.length)) {
                _context5.n = 9;
                break;
              }
              return _context5.d(_regeneratorValues(_loop()), 8);
            case 8:
              i++;
              _context5.n = 7;
              break;
            case 9:
              _context5.n = 11;
              break;
            case 10:
              _context5.p = 10;
              _t = _context5.v;
              removeSkeleton();
              chatHistory.pop(); // remove user message if failed
              appendAIError(_t.message || "Unknown error");
            case 11:
              _context5.p = 11;
              btnSendChat.disabled = false;
              return _context5.f(11);
            case 12:
              return _context5.a(2);
          }
        }, _callee4, null, [[2, 10, 11, 12]]);
      }));
      return function handleSendChat() {
        return _ref2.apply(this, arguments);
      };
    }();
    btnSendChat === null || btnSendChat === void 0 || btnSendChat.addEventListener("click", handleSendChat);
    chatInput === null || chatInput === void 0 || chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendChat();
      }
    });
  }
});
}();
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other entry modules.
!function() {
/*!************************************!*\
  !*** ./src/taskpane/taskpane.html ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
// Imports
var ___HTML_LOADER_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! ./taskpane.css */ "./src/taskpane/taskpane.css"), __webpack_require__.b);
// Module
var code = "<!DOCTYPE html>\n<html>\n<head>\n    <meta charset=\"UTF-8\" />\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=Edge\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n    <title>Auto LaTeX</title>\n    <!-- Office JavaScript API -->\n    <" + "script type=\"text/javascript\" src=\"https://appsforoffice.microsoft.com/lib/1/hosted/office.js\"><" + "/script>\n    <!-- Inter Font -->\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap\" rel=\"stylesheet\">\n    <link href=\"" + ___HTML_LOADER_IMPORT_0___ + "\" rel=\"stylesheet\" type=\"text/css\" />\n</head>\n<body>\n    <!-- Main Converter View -->\n    <div id=\"main-view\" class=\"app-container\">\n        <header class=\"app-header\">\n            <svg class=\"app-logo\" xmlns=\"http://www.w3.org/2000/svg\" width=\"36\" height=\"36\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 7V4h16v3\"/><path d=\"M9 20h6\"/><path d=\"M12 4v16\"/></svg>\n            <h1>Auto LaTeX</h1>\n        </header>\n        \n        <main id=\"app-body\" class=\"app-main\" style=\"display: none;\">\n            <p class=\"app-description\">Accurate and high-performance Math formula converter for Microsoft&nbsp;Word.</p>\n            \n            <div class=\"action-group\">\n                <button id=\"convert-doc\" class=\"btn btn-primary\" aria-label=\"Convert entire document\">\n                    <svg class=\"btn-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"/><polyline points=\"14 2 14 8 20 8\"/><path d=\"M16 13H8\"/><path d=\"M16 17H8\"/><path d=\"M10 9H8\"/></svg>\n                    <span>Convert All</span>\n                </button>\n                \n                <button id=\"convert-sel\" class=\"btn btn-secondary\" aria-label=\"Convert selection\">\n                    <svg class=\"btn-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z\"/><path d=\"M3.3 7 8.7 10\"/><path d=\"M8.7 17 3.3 14\"/><path d=\"M20.7 14 15.3 17\"/><path d=\"M15.3 10l5.4-3\"/><path d=\"M12 22v-8\"/><path d=\"M12 10V2\"/></svg>\n                    <span>Convert Selection</span>\n                </button>\n            </div>\n            \n            <p id=\"cancel-msg\" style=\"display: none; text-align: center; font-size: 13px; color: var(--color-text-muted); margin-top: 8px;\">\n                <span id=\"progress-text\">So long? </span><span id=\"cancel-link\" class=\"cancel-link\">Cancel here</span>\n            </p>\n            \n            <footer class=\"app-footer\">\n                <p>Created by <strong>auhsuai</strong></p>\n                <div class=\"footer-links\">\n                    <a href=\"https://github.com/auhsuai/auto-latex\" target=\"_blank\" aria-label=\"GitHub\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4\"/><path d=\"M9 18c-4.51 2-5-2-7-2\"/></svg>\n                        GitHub\n                    </a>\n                    <span class=\"separator\">•</span>\n                    <a href=\"https://t.me/nguyen_tan_an\" target=\"_blank\" aria-label=\"Telegram\">\n                        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m15 10-4 4 6 6 4-16-18 7 4 2 2 6 3-4\"/></svg>\n                        Telegram\n                    </a>\n                </div>\n            </footer>\n        </main>\n    </div>\n\n    <!-- Chat View (Hidden by Default) -->\n    <div id=\"chat-view\" class=\"app-container\" style=\"display: none;\">\n        <header class=\"chat-header\">\n            <button id=\"btn-back\" class=\"icon-btn\" aria-label=\"Back to main view\">\n                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m12 19-7-7 7-7\"/><path d=\"M19 12H5\"/></svg>\n            </button>\n            <h2>AI Copilot</h2>\n            <button id=\"btn-settings\" class=\"icon-btn\" aria-label=\"Settings\">\n                <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>\n            </button>\n        </header>\n\n        <div id=\"chat-messages\" class=\"chat-messages\">\n            <!-- Messages will be injected here -->\n            <div class=\"chat-msg ai-msg\">\n                <div class=\"msg-bubble\">\n                    Xin chào! Tôi là AI Math Copilot. Bôi đen văn bản/công thức trên Word hoặc gõ yêu cầu ở dưới để tôi tạo mã LaTeX cho bạn nhé.\n                </div>\n            </div>\n        </div>\n\n        <div class=\"chat-input-area\">\n            <div class=\"chat-input-wrapper\">\n                <textarea id=\"chat-input\" placeholder=\"Yêu cầu AI...\" rows=\"1\"></textarea>\n                <button id=\"btn-send-chat\" aria-label=\"Send message\">\n                    <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m22 2-7 20-4-9-9-4Z\"/><path d=\"M22 2 11 13\"/></svg>\n                </button>\n            </div>\n            <p class=\"chat-hint\">Tự động chèn kết quả vào tài liệu</p>\n        </div>\n    </div>\n\n    <!-- Floating Action Button (FAB) -->\n    <button id=\"fab-chat\" class=\"fab\" aria-label=\"Open AI Copilot\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7.9 20A9 9 0 1 0 4 16.1L2 22Z\"/><path d=\"M8 12h.01\"/><path d=\"M12 12h.01\"/><path d=\"M16 12h.01\"/></svg>\n    </button>\n\n    <!-- Settings Modal -->\n    <div id=\"settings-modal\" class=\"modal-overlay\" style=\"display: none;\">\n        <div class=\"modal-content\">\n            <h3 class=\"modal-title\">AI Settings</h3>\n            \n            <div class=\"form-group\">\n                <label for=\"ai-provider\">AI Provider</label>\n                <select id=\"ai-provider\" class=\"form-control\">\n                    <option value=\"gemini\">Google Gemini (Flash)</option>\n                    <option value=\"openai\">OpenAI (GPT-4o/mini)</option>\n                    <option value=\"deepseek\">DeepSeek (Reasoner/Chat)</option>\n                </select>\n            </div>\n\n            <div class=\"form-group\">\n                <label for=\"ai-api-key\">API Key (Saved locally)</label>\n                <input type=\"password\" id=\"ai-api-key\" class=\"form-control\" placeholder=\"Paste your API key here...\">\n            </div>\n\n            <div class=\"modal-actions\">\n                <button id=\"btn-close-settings\" class=\"btn btn-secondary\" style=\"padding: 8px 16px; font-size: 14px;\">Cancel</button>\n                <button id=\"btn-save-settings\" class=\"btn btn-primary\" style=\"padding: 8px 16px; font-size: 14px;\">Save Key</button>\n            </div>\n        </div>\n    </div>\n</body>\n</html>\n";
// Exports
/* harmony default export */ __webpack_exports__["default"] = (code);
}();
/******/ })()
;
//# sourceMappingURL=taskpane.js.map