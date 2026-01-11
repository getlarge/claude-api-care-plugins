#!/usr/bin/env node
import { createRequire as __bundleCreateRequire } from 'node:module';
const require = __bundleCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../node_modules/@apidevtools/swagger-parser/lib/util.js
var require_util = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/lib/util.js"(exports) {
    "use strict";
    var util = __require("util");
    exports.format = util.format;
    exports.inherits = util.inherits;
    var parse = (u) => new URL(u);
    exports.swaggerParamRegExp = /\{([^/}]+)}/g;
    var operationsList = ["get", "post", "put", "delete", "patch", "options", "head", "trace"];
    function fixServers(server, path) {
      if (server.url && server.url.startsWith("/")) {
        const inUrl = parse(path);
        const finalUrl = inUrl.protocol + "//" + inUrl.hostname + server.url;
        server.url = finalUrl;
        return server;
      }
    }
    function fixOasRelativeServers(schema, filePath) {
      if (schema.openapi && (filePath && (filePath.startsWith("http:") || filePath.startsWith("https:")))) {
        if (schema.servers) {
          schema.servers.map((server) => fixServers(server, filePath));
        }
        ["paths", "webhooks"].forEach((component) => {
          Object.keys(schema[component] || []).forEach((path) => {
            const pathItem = schema[component][path];
            Object.keys(pathItem).forEach((opItem) => {
              if (opItem === "servers") {
                pathItem[opItem].map((server) => fixServers(server, filePath));
              } else if (operationsList.includes(opItem)) {
                if (pathItem[opItem].servers) {
                  pathItem[opItem].servers.map((server) => fixServers(server, filePath));
                }
              }
            });
          });
        });
      } else {
      }
    }
    exports.fixOasRelativeServers = fixOasRelativeServers;
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/to-json.js
var require_to_json = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/to-json.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getDeepKeys = exports.toJSON = void 0;
    var nonJsonTypes = ["function", "symbol", "undefined"];
    var protectedProps = ["constructor", "prototype", "__proto__"];
    var objectPrototype = Object.getPrototypeOf({});
    function toJSON() {
      let pojo = {};
      let error = this;
      for (let key of getDeepKeys(error)) {
        if (typeof key === "string") {
          let value = error[key];
          let type = typeof value;
          if (!nonJsonTypes.includes(type)) {
            pojo[key] = value;
          }
        }
      }
      return pojo;
    }
    exports.toJSON = toJSON;
    function getDeepKeys(obj, omit = []) {
      let keys = [];
      while (obj && obj !== objectPrototype) {
        keys = keys.concat(Object.getOwnPropertyNames(obj), Object.getOwnPropertySymbols(obj));
        obj = Object.getPrototypeOf(obj);
      }
      let uniqueKeys = new Set(keys);
      for (let key of omit.concat(protectedProps)) {
        uniqueKeys.delete(key);
      }
      return uniqueKeys;
    }
    exports.getDeepKeys = getDeepKeys;
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/isomorphic.node.js
var require_isomorphic_node = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/isomorphic.node.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.addInspectMethod = exports.format = void 0;
    var util = __require("util");
    var to_json_1 = require_to_json();
    var inspectMethod = util.inspect.custom || Symbol.for("nodejs.util.inspect.custom");
    exports.format = util.format;
    function addInspectMethod(newError) {
      newError[inspectMethod] = inspect;
    }
    exports.addInspectMethod = addInspectMethod;
    function inspect() {
      let pojo = {};
      let error = this;
      for (let key of to_json_1.getDeepKeys(error)) {
        let value = error[key];
        pojo[key] = value;
      }
      delete pojo[inspectMethod];
      return pojo;
    }
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/stack.js
var require_stack = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/stack.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.lazyJoinStacks = exports.joinStacks = exports.isWritableStack = exports.isLazyStack = void 0;
    var newline = /\r?\n/;
    var onoCall = /\bono[ @]/;
    function isLazyStack(stackProp) {
      return Boolean(stackProp && stackProp.configurable && typeof stackProp.get === "function");
    }
    exports.isLazyStack = isLazyStack;
    function isWritableStack(stackProp) {
      return Boolean(
        // If there is no stack property, then it's writable, since assigning it will create it
        !stackProp || stackProp.writable || typeof stackProp.set === "function"
      );
    }
    exports.isWritableStack = isWritableStack;
    function joinStacks(newError, originalError) {
      let newStack = popStack(newError.stack);
      let originalStack = originalError ? originalError.stack : void 0;
      if (newStack && originalStack) {
        return newStack + "\n\n" + originalStack;
      } else {
        return newStack || originalStack;
      }
    }
    exports.joinStacks = joinStacks;
    function lazyJoinStacks(lazyStack, newError, originalError) {
      if (originalError) {
        Object.defineProperty(newError, "stack", {
          get: () => {
            let newStack = lazyStack.get.apply(newError);
            return joinStacks({ stack: newStack }, originalError);
          },
          enumerable: false,
          configurable: true
        });
      } else {
        lazyPopStack(newError, lazyStack);
      }
    }
    exports.lazyJoinStacks = lazyJoinStacks;
    function popStack(stack) {
      if (stack) {
        let lines = stack.split(newline);
        let onoStart;
        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          if (onoCall.test(line)) {
            if (onoStart === void 0) {
              onoStart = i;
            }
          } else if (onoStart !== void 0) {
            lines.splice(onoStart, i - onoStart);
            break;
          }
        }
        if (lines.length > 0) {
          return lines.join("\n");
        }
      }
      return stack;
    }
    function lazyPopStack(error, lazyStack) {
      Object.defineProperty(error, "stack", {
        get: () => popStack(lazyStack.get.apply(error)),
        enumerable: false,
        configurable: true
      });
    }
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/extend-error.js
var require_extend_error = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/extend-error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendError = void 0;
    var isomorphic_node_1 = require_isomorphic_node();
    var stack_1 = require_stack();
    var to_json_1 = require_to_json();
    var protectedProps = ["name", "message", "stack"];
    function extendError(error, originalError, props) {
      let onoError = error;
      extendStack(onoError, originalError);
      if (originalError && typeof originalError === "object") {
        mergeErrors(onoError, originalError);
      }
      onoError.toJSON = to_json_1.toJSON;
      if (isomorphic_node_1.addInspectMethod) {
        isomorphic_node_1.addInspectMethod(onoError);
      }
      if (props && typeof props === "object") {
        Object.assign(onoError, props);
      }
      return onoError;
    }
    exports.extendError = extendError;
    function extendStack(newError, originalError) {
      let stackProp = Object.getOwnPropertyDescriptor(newError, "stack");
      if (stack_1.isLazyStack(stackProp)) {
        stack_1.lazyJoinStacks(stackProp, newError, originalError);
      } else if (stack_1.isWritableStack(stackProp)) {
        newError.stack = stack_1.joinStacks(newError, originalError);
      }
    }
    function mergeErrors(newError, originalError) {
      let keys = to_json_1.getDeepKeys(originalError, protectedProps);
      let _newError = newError;
      let _originalError = originalError;
      for (let key of keys) {
        if (_newError[key] === void 0) {
          try {
            _newError[key] = _originalError[key];
          } catch (e) {
          }
        }
      }
    }
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/normalize.js
var require_normalize = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/normalize.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeArgs = exports.normalizeOptions = void 0;
    var isomorphic_node_1 = require_isomorphic_node();
    function normalizeOptions(options) {
      options = options || {};
      return {
        concatMessages: options.concatMessages === void 0 ? true : Boolean(options.concatMessages),
        format: options.format === void 0 ? isomorphic_node_1.format : typeof options.format === "function" ? options.format : false
      };
    }
    exports.normalizeOptions = normalizeOptions;
    function normalizeArgs(args, options) {
      let originalError;
      let props;
      let formatArgs;
      let message = "";
      if (typeof args[0] === "string") {
        formatArgs = args;
      } else if (typeof args[1] === "string") {
        if (args[0] instanceof Error) {
          originalError = args[0];
        } else {
          props = args[0];
        }
        formatArgs = args.slice(1);
      } else {
        originalError = args[0];
        props = args[1];
        formatArgs = args.slice(2);
      }
      if (formatArgs.length > 0) {
        if (options.format) {
          message = options.format.apply(void 0, formatArgs);
        } else {
          message = formatArgs.join(" ");
        }
      }
      if (options.concatMessages && originalError && originalError.message) {
        message += (message ? " \n" : "") + originalError.message;
      }
      return { originalError, props, message };
    }
    exports.normalizeArgs = normalizeArgs;
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/constructor.js
var require_constructor = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/constructor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Ono = void 0;
    var extend_error_1 = require_extend_error();
    var normalize_1 = require_normalize();
    var to_json_1 = require_to_json();
    var constructor = Ono;
    exports.Ono = constructor;
    function Ono(ErrorConstructor, options) {
      options = normalize_1.normalizeOptions(options);
      function ono(...args) {
        let { originalError, props, message } = normalize_1.normalizeArgs(args, options);
        let newError = new ErrorConstructor(message);
        return extend_error_1.extendError(newError, originalError, props);
      }
      ono[Symbol.species] = ErrorConstructor;
      return ono;
    }
    Ono.toJSON = function toJSON(error) {
      return to_json_1.toJSON.call(error);
    };
    Ono.extend = function extend(error, originalError, props) {
      if (props || originalError instanceof Error) {
        return extend_error_1.extendError(error, originalError, props);
      } else if (originalError) {
        return extend_error_1.extendError(error, void 0, originalError);
      } else {
        return extend_error_1.extendError(error);
      }
    };
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/singleton.js
var require_singleton = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/singleton.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ono = void 0;
    var constructor_1 = require_constructor();
    var singleton = ono;
    exports.ono = singleton;
    ono.error = new constructor_1.Ono(Error);
    ono.eval = new constructor_1.Ono(EvalError);
    ono.range = new constructor_1.Ono(RangeError);
    ono.reference = new constructor_1.Ono(ReferenceError);
    ono.syntax = new constructor_1.Ono(SyntaxError);
    ono.type = new constructor_1.Ono(TypeError);
    ono.uri = new constructor_1.Ono(URIError);
    var onoMap = ono;
    function ono(...args) {
      let originalError = args[0];
      if (typeof originalError === "object" && typeof originalError.name === "string") {
        for (let typedOno of Object.values(onoMap)) {
          if (typeof typedOno === "function" && typedOno.name === "ono") {
            let species = typedOno[Symbol.species];
            if (species && species !== Error && (originalError instanceof species || originalError.name === species.name)) {
              return typedOno.apply(void 0, args);
            }
          }
        }
      }
      return ono.error.apply(void 0, args);
    }
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/types.js
var require_types = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = __require("util");
  }
});

// ../../../node_modules/@jsdevtools/ono/cjs/index.js
var require_cjs = __commonJS({
  "../../../node_modules/@jsdevtools/ono/cjs/index.js"(exports, module) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      Object.defineProperty(o, k2, { enumerable: true, get: function() {
        return m[k];
      } });
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !exports2.hasOwnProperty(p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ono = void 0;
    var singleton_1 = require_singleton();
    Object.defineProperty(exports, "ono", { enumerable: true, get: function() {
      return singleton_1.ono;
    } });
    var constructor_1 = require_constructor();
    Object.defineProperty(exports, "Ono", { enumerable: true, get: function() {
      return constructor_1.Ono;
    } });
    __exportStar(require_types(), exports);
    exports.default = singleton_1.ono;
    if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = Object.assign(module.exports.default, module.exports);
    }
  }
});

// ../../../node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS({
  "../../../node_modules/ajv/dist/compile/codegen/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
    var _CodeOrName = class {
    };
    exports._CodeOrName = _CodeOrName;
    exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var Name = class extends _CodeOrName {
      constructor(s) {
        super();
        if (!exports.IDENTIFIER.test(s))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return false;
      }
      get names() {
        return { [this.str]: 1 };
      }
    };
    exports.Name = Name;
    var _Code = class extends _CodeOrName {
      constructor(code) {
        super();
        this._items = typeof code === "string" ? [code] : code;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return false;
        const item = this._items[0];
        return item === "" || item === '""';
      }
      get str() {
        var _a;
        return (_a = this._str) !== null && _a !== void 0 ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
      }
      get names() {
        var _a;
        return (_a = this._names) !== null && _a !== void 0 ? _a : this._names = this._items.reduce((names, c) => {
          if (c instanceof Name)
            names[c.str] = (names[c.str] || 0) + 1;
          return names;
        }, {});
      }
    };
    exports._Code = _Code;
    exports.nil = new _Code("");
    function _(strs, ...args) {
      const code = [strs[0]];
      let i = 0;
      while (i < args.length) {
        addCodeArg(code, args[i]);
        code.push(strs[++i]);
      }
      return new _Code(code);
    }
    exports._ = _;
    var plus = new _Code("+");
    function str(strs, ...args) {
      const expr = [safeStringify(strs[0])];
      let i = 0;
      while (i < args.length) {
        expr.push(plus);
        addCodeArg(expr, args[i]);
        expr.push(plus, safeStringify(strs[++i]));
      }
      optimize(expr);
      return new _Code(expr);
    }
    exports.str = str;
    function addCodeArg(code, arg) {
      if (arg instanceof _Code)
        code.push(...arg._items);
      else if (arg instanceof Name)
        code.push(arg);
      else
        code.push(interpolate(arg));
    }
    exports.addCodeArg = addCodeArg;
    function optimize(expr) {
      let i = 1;
      while (i < expr.length - 1) {
        if (expr[i] === plus) {
          const res = mergeExprItems(expr[i - 1], expr[i + 1]);
          if (res !== void 0) {
            expr.splice(i - 1, 3, res);
            continue;
          }
          expr[i++] = "+";
        }
        i++;
      }
    }
    function mergeExprItems(a, b) {
      if (b === '""')
        return a;
      if (a === '""')
        return b;
      if (typeof a == "string") {
        if (b instanceof Name || a[a.length - 1] !== '"')
          return;
        if (typeof b != "string")
          return `${a.slice(0, -1)}${b}"`;
        if (b[0] === '"')
          return a.slice(0, -1) + b.slice(1);
        return;
      }
      if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
      return;
    }
    function strConcat(c1, c2) {
      return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
    }
    exports.strConcat = strConcat;
    function interpolate(x) {
      return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
    }
    function stringify(x) {
      return new _Code(safeStringify(x));
    }
    exports.stringify = stringify;
    function safeStringify(x) {
      return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    exports.safeStringify = safeStringify;
    function getProperty(key) {
      return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
    }
    exports.getProperty = getProperty;
    function getEsmExportName(key) {
      if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
        return new _Code(`${key}`);
      }
      throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
    }
    exports.getEsmExportName = getEsmExportName;
    function regexpCode(rx) {
      return new _Code(rx.toString());
    }
    exports.regexpCode = regexpCode;
  }
});

// ../../../node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS({
  "../../../node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
    var code_1 = require_code();
    var ValueError = class extends Error {
      constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`);
        this.value = name.value;
      }
    };
    var UsedValueState;
    (function(UsedValueState2) {
      UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
      UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
    })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
    exports.varKinds = {
      const: new code_1.Name("const"),
      let: new code_1.Name("let"),
      var: new code_1.Name("var")
    };
    var Scope = class {
      constructor({ prefixes, parent } = {}) {
        this._names = {};
        this._prefixes = prefixes;
        this._parent = parent;
      }
      toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
      }
      name(prefix) {
        return new code_1.Name(this._newName(prefix));
      }
      _newName(prefix) {
        const ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
      }
      _nameGroup(prefix) {
        var _a, _b;
        if (((_b = (_a = this._parent) === null || _a === void 0 ? void 0 : _a._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
          throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        }
        return this._names[prefix] = { prefix, index: 0 };
      }
    };
    exports.Scope = Scope;
    var ValueScopeName = class extends code_1.Name {
      constructor(prefix, nameStr) {
        super(nameStr);
        this.prefix = prefix;
      }
      setValue(value, { property, itemIndex }) {
        this.value = value;
        this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
      }
    };
    exports.ValueScopeName = ValueScopeName;
    var line = (0, code_1._)`\n`;
    var ValueScope = class extends Scope {
      constructor(opts) {
        super(opts);
        this._values = {};
        this._scope = opts.scope;
        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
      }
      get() {
        return this._scope;
      }
      name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
      }
      value(nameOrPrefix, value) {
        var _a;
        if (value.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const name = this.toName(nameOrPrefix);
        const { prefix } = name;
        const valueKey = (_a = value.key) !== null && _a !== void 0 ? _a : value.ref;
        let vs = this._values[prefix];
        if (vs) {
          const _name = vs.get(valueKey);
          if (_name)
            return _name;
        } else {
          vs = this._values[prefix] = /* @__PURE__ */ new Map();
        }
        vs.set(valueKey, name);
        const s = this._scope[prefix] || (this._scope[prefix] = []);
        const itemIndex = s.length;
        s[itemIndex] = value.ref;
        name.setValue(value, { property: prefix, itemIndex });
        return name;
      }
      getValue(prefix, keyOrRef) {
        const vs = this._values[prefix];
        if (!vs)
          return;
        return vs.get(keyOrRef);
      }
      scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
          if (name.scopePath === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return (0, code_1._)`${scopeName}${name.scopePath}`;
        });
      }
      scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
          if (name.value === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return name.value.code;
        }, usedValues, getCode);
      }
      _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (const prefix in values) {
          const vs = values[prefix];
          if (!vs)
            continue;
          const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          vs.forEach((name) => {
            if (nameSet.has(name))
              return;
            nameSet.set(name, UsedValueState.Started);
            let c = valueCode(name);
            if (c) {
              const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
              code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
            } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
              code = (0, code_1._)`${code}${c}${this.opts._n}`;
            } else {
              throw new ValueError(name);
            }
            nameSet.set(name, UsedValueState.Completed);
          });
        }
        return code;
      }
    };
    exports.ValueScope = ValueScope;
  }
});

// ../../../node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS({
  "../../../node_modules/ajv/dist/compile/codegen/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
    var code_1 = require_code();
    var scope_1 = require_scope();
    var code_2 = require_code();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return code_2._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return code_2.str;
    } });
    Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
      return code_2.strConcat;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return code_2.nil;
    } });
    Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
      return code_2.getProperty;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return code_2.stringify;
    } });
    Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
      return code_2.regexpCode;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return code_2.Name;
    } });
    var scope_2 = require_scope();
    Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
      return scope_2.Scope;
    } });
    Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
      return scope_2.ValueScope;
    } });
    Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
      return scope_2.ValueScopeName;
    } });
    Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
      return scope_2.varKinds;
    } });
    exports.operators = {
      GT: new code_1._Code(">"),
      GTE: new code_1._Code(">="),
      LT: new code_1._Code("<"),
      LTE: new code_1._Code("<="),
      EQ: new code_1._Code("==="),
      NEQ: new code_1._Code("!=="),
      NOT: new code_1._Code("!"),
      OR: new code_1._Code("||"),
      AND: new code_1._Code("&&"),
      ADD: new code_1._Code("+")
    };
    var Node = class {
      optimizeNodes() {
        return this;
      }
      optimizeNames(_names, _constants) {
        return this;
      }
    };
    var Def = class extends Node {
      constructor(varKind, name, rhs) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.rhs = rhs;
      }
      render({ es5, _n }) {
        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
        const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (!names[this.name.str])
          return;
        if (this.rhs)
          this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
      }
    };
    var Assign = class extends Node {
      constructor(lhs, rhs, sideEffects) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.sideEffects = sideEffects;
      }
      render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
          return;
        this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
      }
    };
    var AssignOp = class extends Assign {
      constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects);
        this.op = op;
      }
      render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
      }
    };
    var Label = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        return `${this.label}:` + _n;
      }
    };
    var Break = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        const label = this.label ? ` ${this.label}` : "";
        return `break${label};` + _n;
      }
    };
    var Throw = class extends Node {
      constructor(error) {
        super();
        this.error = error;
      }
      render({ _n }) {
        return `throw ${this.error};` + _n;
      }
      get names() {
        return this.error.names;
      }
    };
    var AnyCode = class extends Node {
      constructor(code) {
        super();
        this.code = code;
      }
      render({ _n }) {
        return `${this.code};` + _n;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(names, constants) {
        this.code = optimizeExpr(this.code, names, constants);
        return this;
      }
      get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
      }
    };
    var ParentNode = class extends Node {
      constructor(nodes = []) {
        super();
        this.nodes = nodes;
      }
      render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
      }
      optimizeNodes() {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i].optimizeNodes();
          if (Array.isArray(n))
            nodes.splice(i, 1, ...n);
          else if (n)
            nodes[i] = n;
          else
            nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      optimizeNames(names, constants) {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i];
          if (n.optimizeNames(names, constants))
            continue;
          subtractNames(names, n.names);
          nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
      }
    };
    var BlockNode = class extends ParentNode {
      render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
      }
    };
    var Root = class extends ParentNode {
    };
    var Else = class extends BlockNode {
    };
    Else.kind = "else";
    var If = class _If extends BlockNode {
      constructor(condition, nodes) {
        super(nodes);
        this.condition = condition;
      }
      render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        if (this.else)
          code += "else " + this.else.render(opts);
        return code;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const cond = this.condition;
        if (cond === true)
          return this.nodes;
        let e = this.else;
        if (e) {
          const ns = e.optimizeNodes();
          e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e) {
          if (cond === false)
            return e instanceof _If ? e : e.nodes;
          if (this.nodes.length)
            return this;
          return new _If(not(cond), e instanceof _If ? [e] : e.nodes);
        }
        if (cond === false || !this.nodes.length)
          return void 0;
        return this;
      }
      optimizeNames(names, constants) {
        var _a;
        this.else = (_a = this.else) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        if (!(super.optimizeNames(names, constants) || this.else))
          return;
        this.condition = optimizeExpr(this.condition, names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        addExprNames(names, this.condition);
        if (this.else)
          addNames(names, this.else.names);
        return names;
      }
    };
    If.kind = "if";
    var For = class extends BlockNode {
    };
    For.kind = "for";
    var ForLoop = class extends For {
      constructor(iteration) {
        super();
        this.iteration = iteration;
      }
      render(opts) {
        return `for(${this.iteration})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iteration = optimizeExpr(this.iteration, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iteration.names);
      }
    };
    var ForRange = class extends For {
      constructor(varKind, name, from, to) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.from = from;
        this.to = to;
      }
      render(opts) {
        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
        const { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
      }
      get names() {
        const names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
      }
    };
    var ForIter = class extends For {
      constructor(loop, varKind, name, iterable) {
        super();
        this.loop = loop;
        this.varKind = varKind;
        this.name = name;
        this.iterable = iterable;
      }
      render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iterable = optimizeExpr(this.iterable, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iterable.names);
      }
    };
    var Func = class extends BlockNode {
      constructor(name, args, async) {
        super();
        this.name = name;
        this.args = args;
        this.async = async;
      }
      render(opts) {
        const _async = this.async ? "async " : "";
        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
      }
    };
    Func.kind = "func";
    var Return = class extends ParentNode {
      render(opts) {
        return "return " + super.render(opts);
      }
    };
    Return.kind = "return";
    var Try = class extends BlockNode {
      render(opts) {
        let code = "try" + super.render(opts);
        if (this.catch)
          code += this.catch.render(opts);
        if (this.finally)
          code += this.finally.render(opts);
        return code;
      }
      optimizeNodes() {
        var _a, _b;
        super.optimizeNodes();
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNodes();
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
        return this;
      }
      optimizeNames(names, constants) {
        var _a, _b;
        super.optimizeNames(names, constants);
        (_a = this.catch) === null || _a === void 0 ? void 0 : _a.optimizeNames(names, constants);
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        if (this.catch)
          addNames(names, this.catch.names);
        if (this.finally)
          addNames(names, this.finally.names);
        return names;
      }
    };
    var Catch = class extends BlockNode {
      constructor(error) {
        super();
        this.error = error;
      }
      render(opts) {
        return `catch(${this.error})` + super.render(opts);
      }
    };
    Catch.kind = "catch";
    var Finally = class extends BlockNode {
      render(opts) {
        return "finally" + super.render(opts);
      }
    };
    Finally.kind = "finally";
    var CodeGen = class {
      constructor(extScope, opts = {}) {
        this._values = {};
        this._blockStarts = [];
        this._constants = {};
        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
        this._extScope = extScope;
        this._scope = new scope_1.Scope({ parent: extScope });
        this._nodes = [new Root()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(prefix) {
        return this._scope.name(prefix);
      }
      // reserves unique name in the external scope
      scopeName(prefix) {
        return this._extScope.name(prefix);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(prefixOrName, value) {
        const name = this._extScope.value(prefixOrName, value);
        const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
        vs.add(name);
        return name;
      }
      getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(varKind, nameOrPrefix, rhs, constant) {
        const name = this._scope.toName(nameOrPrefix);
        if (rhs !== void 0 && constant)
          this._constants[name.str] = rhs;
        this._leafNode(new Def(varKind, name, rhs));
        return name;
      }
      // `const` declaration (`var` in es5 mode)
      const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
      }
      // `var` declaration with optional assignment
      var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
      }
      // assignment code
      assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
      }
      // `+=` code
      add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
      }
      // appends passed SafeExpr to code or executes Block
      code(c) {
        if (typeof c == "function")
          c();
        else if (c !== code_1.nil)
          this._leafNode(new AnyCode(c));
        return this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...keyValues) {
        const code = ["{"];
        for (const [key, value] of keyValues) {
          if (code.length > 1)
            code.push(",");
          code.push(key);
          if (key !== value || this.opts.es5) {
            code.push(":");
            (0, code_1.addCodeArg)(code, value);
          }
        }
        code.push("}");
        return new code_1._Code(code);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(condition, thenBody, elseBody) {
        this._blockNode(new If(condition));
        if (thenBody && elseBody) {
          this.code(thenBody).else().code(elseBody).endIf();
        } else if (thenBody) {
          this.code(thenBody).endIf();
        } else if (elseBody) {
          throw new Error('CodeGen: "else" body without "then" body');
        }
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(condition) {
        return this._elseNode(new If(condition));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new Else());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(If, Else);
      }
      _for(node, forBody) {
        this._blockNode(node);
        if (forBody)
          this.code(forBody).endFor();
        return this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
      }
      // `for` statement for a range of values
      forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        const name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
          const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
          return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
            this.var(name, (0, code_1._)`${arr}[${i}]`);
            forBody(name);
          });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties) {
          return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
        }
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(For);
      }
      // `label` statement
      label(label) {
        return this._leafNode(new Label(label));
      }
      // `break` statement
      break(label) {
        return this._leafNode(new Break(label));
      }
      // `return` statement
      return(value) {
        const node = new Return();
        this._blockNode(node);
        this.code(value);
        if (node.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
      }
      // `try` statement
      try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const node = new Try();
        this._blockNode(node);
        this.code(tryBody);
        if (catchCode) {
          const error = this.name("e");
          this._currNode = node.catch = new Catch(error);
          catchCode(error);
        }
        if (finallyCode) {
          this._currNode = node.finally = new Finally();
          this.code(finallyCode);
        }
        return this._endBlockNode(Catch, Finally);
      }
      // `throw` statement
      throw(error) {
        return this._leafNode(new Throw(error));
      }
      // start self-balancing block
      block(body, nodeCount) {
        this._blockStarts.push(this._nodes.length);
        if (body)
          this.code(body).endBlock(nodeCount);
        return this;
      }
      // end the current self-balancing block
      endBlock(nodeCount) {
        const len = this._blockStarts.pop();
        if (len === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const toClose = this._nodes.length - len;
        if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
          throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        }
        this._nodes.length = len;
        return this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(name, args = code_1.nil, async, funcBody) {
        this._blockNode(new Func(name, args, async));
        if (funcBody)
          this.code(funcBody).endFunc();
        return this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(Func);
      }
      optimize(n = 1) {
        while (n-- > 0) {
          this._root.optimizeNodes();
          this._root.optimizeNames(this._root.names, this._constants);
        }
      }
      _leafNode(node) {
        this._currNode.nodes.push(node);
        return this;
      }
      _blockNode(node) {
        this._currNode.nodes.push(node);
        this._nodes.push(node);
      }
      _endBlockNode(N1, N2) {
        const n = this._currNode;
        if (n instanceof N1 || N2 && n instanceof N2) {
          this._nodes.pop();
          return this;
        }
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
      }
      _elseNode(node) {
        const n = this._currNode;
        if (!(n instanceof If)) {
          throw new Error('CodeGen: "else" without "if"');
        }
        this._currNode = n.else = node;
        return this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const ns = this._nodes;
        return ns[ns.length - 1];
      }
      set _currNode(node) {
        const ns = this._nodes;
        ns[ns.length - 1] = node;
      }
    };
    exports.CodeGen = CodeGen;
    function addNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
      return names;
    }
    function addExprNames(names, from) {
      return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
    }
    function optimizeExpr(expr, names, constants) {
      if (expr instanceof code_1.Name)
        return replaceName(expr);
      if (!canOptimize(expr))
        return expr;
      return new code_1._Code(expr._items.reduce((items, c) => {
        if (c instanceof code_1.Name)
          c = replaceName(c);
        if (c instanceof code_1._Code)
          items.push(...c._items);
        else
          items.push(c);
        return items;
      }, []));
      function replaceName(n) {
        const c = constants[n.str];
        if (c === void 0 || names[n.str] !== 1)
          return n;
        delete names[n.str];
        return c;
      }
      function canOptimize(e) {
        return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
      }
    }
    function subtractNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
    }
    function not(x) {
      return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
    }
    exports.not = not;
    var andCode = mappend(exports.operators.AND);
    function and(...args) {
      return args.reduce(andCode);
    }
    exports.and = and;
    var orCode = mappend(exports.operators.OR);
    function or(...args) {
      return args.reduce(orCode);
    }
    exports.or = or;
    function mappend(op) {
      return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
    }
    function par(x) {
      return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
    }
  }
});

// ../../../node_modules/ajv/dist/compile/util.js
var require_util2 = __commonJS({
  "../../../node_modules/ajv/dist/compile/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
    var codegen_1 = require_codegen();
    var code_1 = require_code();
    function toHash(arr) {
      const hash = {};
      for (const item of arr)
        hash[item] = true;
      return hash;
    }
    exports.toHash = toHash;
    function alwaysValidSchema(it, schema) {
      if (typeof schema == "boolean")
        return schema;
      if (Object.keys(schema).length === 0)
        return true;
      checkUnknownRules(it, schema);
      return !schemaHasRules(schema, it.self.RULES.all);
    }
    exports.alwaysValidSchema = alwaysValidSchema;
    function checkUnknownRules(it, schema = it.schema) {
      const { opts, self } = it;
      if (!opts.strictSchema)
        return;
      if (typeof schema === "boolean")
        return;
      const rules = self.RULES.keywords;
      for (const key in schema) {
        if (!rules[key])
          checkStrictMode(it, `unknown keyword: "${key}"`);
      }
    }
    exports.checkUnknownRules = checkUnknownRules;
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (rules[key])
          return true;
      return false;
    }
    exports.schemaHasRules = schemaHasRules;
    function schemaHasRulesButRef(schema, RULES) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (key !== "$ref" && RULES.all[key])
          return true;
      return false;
    }
    exports.schemaHasRulesButRef = schemaHasRulesButRef;
    function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
      if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
          return schema;
        if (typeof schema == "string")
          return (0, codegen_1._)`${schema}`;
      }
      return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
    }
    exports.schemaRefOrVal = schemaRefOrVal;
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    exports.unescapeFragment = unescapeFragment;
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    exports.escapeFragment = escapeFragment;
    function escapeJsonPointer(str) {
      if (typeof str == "number")
        return `${str}`;
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    exports.escapeJsonPointer = escapeJsonPointer;
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    exports.unescapeJsonPointer = unescapeJsonPointer;
    function eachItem(xs, f) {
      if (Array.isArray(xs)) {
        for (const x of xs)
          f(x);
      } else {
        f(xs);
      }
    }
    exports.eachItem = eachItem;
    function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues, resultToName }) {
      return (gen, from, to, toName) => {
        const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
      };
    }
    exports.mergeEvaluated = {
      props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
          gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
          if (from === true) {
            gen.assign(to, true);
          } else {
            gen.assign(to, (0, codegen_1._)`${to} || {}`);
            setEvaluated(gen, to, from);
          }
        }),
        mergeValues: (from, to) => from === true ? true : { ...from, ...to },
        resultToName: evaluatedPropsToName
      }),
      items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => from === true ? true : Math.max(from, to),
        resultToName: (gen, items) => gen.var("items", items)
      })
    };
    function evaluatedPropsToName(gen, ps) {
      if (ps === true)
        return gen.var("props", true);
      const props = gen.var("props", (0, codegen_1._)`{}`);
      if (ps !== void 0)
        setEvaluated(gen, props, ps);
      return props;
    }
    exports.evaluatedPropsToName = evaluatedPropsToName;
    function setEvaluated(gen, props, ps) {
      Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
    }
    exports.setEvaluated = setEvaluated;
    var snippets = {};
    function useFunc(gen, f) {
      return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
      });
    }
    exports.useFunc = useFunc;
    var Type;
    (function(Type2) {
      Type2[Type2["Num"] = 0] = "Num";
      Type2[Type2["Str"] = 1] = "Str";
    })(Type || (exports.Type = Type = {}));
    function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
      if (dataProp instanceof codegen_1.Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
    }
    exports.getErrorPath = getErrorPath;
    function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
      if (!mode)
        return;
      msg = `strict mode: ${msg}`;
      if (mode === true)
        throw new Error(msg);
      it.self.logger.warn(msg);
    }
    exports.checkStrictMode = checkStrictMode;
  }
});

// ../../../node_modules/ajv/dist/compile/names.js
var require_names = __commonJS({
  "../../../node_modules/ajv/dist/compile/names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var names = {
      // validation function arguments
      data: new codegen_1.Name("data"),
      // data passed to validation function
      // args passed from referencing schema
      valCxt: new codegen_1.Name("valCxt"),
      // validation/data context - should not be used directly, it is destructured to the names below
      instancePath: new codegen_1.Name("instancePath"),
      parentData: new codegen_1.Name("parentData"),
      parentDataProperty: new codegen_1.Name("parentDataProperty"),
      rootData: new codegen_1.Name("rootData"),
      // root data - same as the data passed to the first/top validation function
      dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
      // used to support recursiveRef and dynamicRef
      // function scoped variables
      vErrors: new codegen_1.Name("vErrors"),
      // null or array of validation errors
      errors: new codegen_1.Name("errors"),
      // counter of validation errors
      this: new codegen_1.Name("this"),
      // "globals"
      self: new codegen_1.Name("self"),
      scope: new codegen_1.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new codegen_1.Name("json"),
      jsonPos: new codegen_1.Name("jsonPos"),
      jsonLen: new codegen_1.Name("jsonLen"),
      jsonPart: new codegen_1.Name("jsonPart")
    };
    exports.default = names;
  }
});

// ../../../node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS({
  "../../../node_modules/ajv/dist/compile/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var names_1 = require_names();
    exports.keywordError = {
      message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
    };
    exports.keyword$DataError = {
      message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
    };
    function reportError(cxt, error = exports.keywordError, errorPaths, overrideAllErrors) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
        addError(gen, errObj);
      } else {
        returnErrors(it, (0, codegen_1._)`[${errObj}]`);
      }
    }
    exports.reportError = reportError;
    function reportExtraError(cxt, error = exports.keywordError, errorPaths) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error, errorPaths);
      addError(gen, errObj);
      if (!(compositeRule || allErrors)) {
        returnErrors(it, names_1.default.vErrors);
      }
    }
    exports.reportExtraError = reportExtraError;
    function resetErrorsCount(gen, errsCount) {
      gen.assign(names_1.default.errors, errsCount);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
    }
    exports.resetErrorsCount = resetErrorsCount;
    function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
      if (errsCount === void 0)
        throw new Error("ajv implementation error");
      const err = gen.name("err");
      gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
        gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
        gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
        if (it.opts.verbose) {
          gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
          gen.assign((0, codegen_1._)`${err}.data`, data);
        }
      });
    }
    exports.extendErrors = extendErrors;
    function addError(gen, errObj) {
      const err = gen.const("err", errObj);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
      gen.code((0, codegen_1._)`${names_1.default.errors}++`);
    }
    function returnErrors(it, errs) {
      const { gen, validateName, schemaEnv } = it;
      if (schemaEnv.$async) {
        gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
        gen.return(false);
      }
    }
    var E = {
      keyword: new codegen_1.Name("keyword"),
      schemaPath: new codegen_1.Name("schemaPath"),
      // also used in JTD errors
      params: new codegen_1.Name("params"),
      propertyName: new codegen_1.Name("propertyName"),
      message: new codegen_1.Name("message"),
      schema: new codegen_1.Name("schema"),
      parentSchema: new codegen_1.Name("parentSchema")
    };
    function errorObjectCode(cxt, error, errorPaths) {
      const { createErrors } = cxt.it;
      if (createErrors === false)
        return (0, codegen_1._)`{}`;
      return errorObject(cxt, error, errorPaths);
    }
    function errorObject(cxt, error, errorPaths = {}) {
      const { gen, it } = cxt;
      const keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths)
      ];
      extraErrorProps(cxt, error, keyValues);
      return gen.object(...keyValues);
    }
    function errorInstancePath({ errorPath }, { instancePath }) {
      const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
      return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
    }
    function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
      let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
      if (schemaPath) {
        schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
      }
      return [E.schemaPath, schPath];
    }
    function extraErrorProps(cxt, { params, message }, keyValues) {
      const { keyword, data, schemaValue, it } = cxt;
      const { opts, propertyName, topSchemaRef, schemaPath } = it;
      keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
      if (opts.messages) {
        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
      }
      if (opts.verbose) {
        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
      }
      if (propertyName)
        keyValues.push([E.propertyName, propertyName]);
    }
  }
});

// ../../../node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var boolError = {
      message: "boolean schema is false"
    };
    function topBoolOrEmptySchema(it) {
      const { gen, schema, validateName } = it;
      if (schema === false) {
        falseSchemaError(it, false);
      } else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, null);
        gen.return(true);
      }
    }
    exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
    function boolOrEmptySchema(it, valid) {
      const { gen, schema } = it;
      if (schema === false) {
        gen.var(valid, false);
        falseSchemaError(it);
      } else {
        gen.var(valid, true);
      }
    }
    exports.boolOrEmptySchema = boolOrEmptySchema;
    function falseSchemaError(it, overrideAllErrors) {
      const { gen, data } = it;
      const cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it
      };
      (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
    }
  }
});

// ../../../node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS({
  "../../../node_modules/ajv/dist/compile/rules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRules = exports.isJSONType = void 0;
    var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
    var jsonTypes = new Set(_jsonTypes);
    function isJSONType(x) {
      return typeof x == "string" && jsonTypes.has(x);
    }
    exports.isJSONType = isJSONType;
    function getRules() {
      const groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] }
      };
      return {
        types: { ...groups, integer: true, boolean: true, null: true },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {}
      };
    }
    exports.getRules = getRules;
  }
});

// ../../../node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
    function schemaHasRulesForType({ schema, self }, type) {
      const group = self.RULES.types[type];
      return group && group !== true && shouldUseGroup(schema, group);
    }
    exports.schemaHasRulesForType = schemaHasRulesForType;
    function shouldUseGroup(schema, group) {
      return group.rules.some((rule) => shouldUseRule(schema, rule));
    }
    exports.shouldUseGroup = shouldUseGroup;
    function shouldUseRule(schema, rule) {
      var _a;
      return schema[rule.keyword] !== void 0 || ((_a = rule.definition.implements) === null || _a === void 0 ? void 0 : _a.some((kwd) => schema[kwd] !== void 0));
    }
    exports.shouldUseRule = shouldUseRule;
  }
});

// ../../../node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
    var rules_1 = require_rules();
    var applicability_1 = require_applicability();
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var DataType;
    (function(DataType2) {
      DataType2[DataType2["Correct"] = 0] = "Correct";
      DataType2[DataType2["Wrong"] = 1] = "Wrong";
    })(DataType || (exports.DataType = DataType = {}));
    function getSchemaTypes(schema) {
      const types = getJSONTypes(schema.type);
      const hasNull = types.includes("null");
      if (hasNull) {
        if (schema.nullable === false)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!types.length && schema.nullable !== void 0) {
          throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
          types.push("null");
      }
      return types;
    }
    exports.getSchemaTypes = getSchemaTypes;
    function getJSONTypes(ts) {
      const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
      if (types.every(rules_1.isJSONType))
        return types;
      throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
    }
    exports.getJSONTypes = getJSONTypes;
    function coerceAndCheckDataType(it, types) {
      const { gen, data, opts } = it;
      const coerceTo = coerceToTypes(types, opts.coerceTypes);
      const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
      if (checkTypes) {
        const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
          if (coerceTo.length)
            coerceData(it, types, coerceTo);
          else
            reportTypeError(it);
        });
      }
      return checkTypes;
    }
    exports.coerceAndCheckDataType = coerceAndCheckDataType;
    var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(types, coerceTypes) {
      return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
    }
    function coerceData(it, types, coerceTo) {
      const { gen, data, opts } = it;
      const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
      const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
      if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
      }
      gen.if((0, codegen_1._)`${coerced} !== undefined`);
      for (const t of coerceTo) {
        if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
          coerceSpecificType(t);
        }
      }
      gen.else();
      reportTypeError(it);
      gen.endIf();
      gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
      });
      function coerceSpecificType(t) {
        switch (t) {
          case "string":
            gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
            return;
          case "number":
            gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "integer":
            gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "boolean":
            gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
            return;
          case "null":
            gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
            gen.assign(coerced, null);
            return;
          case "array":
            gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
        }
      }
    }
    function assignParentData({ gen, parentData, parentDataProperty }, expr) {
      gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
    }
    function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
      const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
      let cond;
      switch (dataType) {
        case "null":
          return (0, codegen_1._)`${data} ${EQ} null`;
        case "array":
          cond = (0, codegen_1._)`Array.isArray(${data})`;
          break;
        case "object":
          cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
          break;
        case "integer":
          cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
          break;
        case "number":
          cond = numCond();
          break;
        default:
          return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
      }
      return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
      function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
      }
    }
    exports.checkDataType = checkDataType;
    function checkDataTypes(dataTypes, data, strictNums, correct) {
      if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
      }
      let cond;
      const types = (0, util_1.toHash)(dataTypes);
      if (types.array && types.object) {
        const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
        cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
        delete types.null;
        delete types.array;
        delete types.object;
      } else {
        cond = codegen_1.nil;
      }
      if (types.number)
        delete types.integer;
      for (const t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
      return cond;
    }
    exports.checkDataTypes = checkDataTypes;
    var typeError = {
      message: ({ schema }) => `must be ${schema}`,
      params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
    };
    function reportTypeError(it) {
      const cxt = getTypeErrorContext(it);
      (0, errors_1.reportError)(cxt, typeError);
    }
    exports.reportTypeError = reportTypeError;
    function getTypeErrorContext(it) {
      const { gen, data, schema } = it;
      const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
      return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it
      };
    }
  }
});

// ../../../node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assignDefaults = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    function assignDefaults(it, ty) {
      const { properties, items } = it.schema;
      if (ty === "object" && properties) {
        for (const key in properties) {
          assignDefault(it, key, properties[key].default);
        }
      } else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
      }
    }
    exports.assignDefaults = assignDefaults;
    function assignDefault(it, prop, defaultValue) {
      const { gen, compositeRule, data, opts } = it;
      if (defaultValue === void 0)
        return;
      const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
      if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
      }
      let condition = (0, codegen_1._)`${childData} === undefined`;
      if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
      }
      gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
    }
  }
});

// ../../../node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var names_1 = require_names();
    var util_2 = require_util2();
    function checkReportMissingProp(cxt, prop) {
      const { gen, data, it } = cxt;
      gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
        cxt.error();
      });
    }
    exports.checkReportMissingProp = checkReportMissingProp;
    function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
      return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
    }
    exports.checkMissingProp = checkMissingProp;
    function reportMissingProp(cxt, missing) {
      cxt.setParams({ missingProperty: missing }, true);
      cxt.error();
    }
    exports.reportMissingProp = reportMissingProp;
    function hasPropFunc(gen) {
      return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
      });
    }
    exports.hasPropFunc = hasPropFunc;
    function isOwnProperty(gen, data, property) {
      return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
    }
    exports.isOwnProperty = isOwnProperty;
    function propertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
      return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
    }
    exports.propertyInData = propertyInData;
    function noPropertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
      return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
    }
    exports.noPropertyInData = noPropertyInData;
    function allSchemaProperties(schemaMap) {
      return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
    }
    exports.allSchemaProperties = allSchemaProperties;
    function schemaProperties(it, schemaMap) {
      return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
    }
    exports.schemaProperties = schemaProperties;
    function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
      const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
      const valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData]
      ];
      if (it.opts.dynamicRef)
        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
      const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
      return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
    }
    exports.callValidateCode = callValidateCode;
    var newRegExp = (0, codegen_1._)`new RegExp`;
    function usePattern({ gen, it: { opts } }, pattern) {
      const u = opts.unicodeRegExp ? "u" : "";
      const { regExp } = opts.code;
      const rx = regExp(pattern, u);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
      });
    }
    exports.usePattern = usePattern;
    function validateArray(cxt) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
      }
      gen.var(valid, true);
      validateItems(() => gen.break());
      return valid;
      function validateItems(notValid) {
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword,
            dataProp: i,
            dataPropType: util_1.Type.Num
          }, valid);
          gen.if((0, codegen_1.not)(valid), notValid);
        });
      }
    }
    exports.validateArray = validateArray;
    function validateUnion(cxt) {
      const { gen, schema, keyword, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
      if (alwaysValid && !it.opts.unevaluated)
        return;
      const valid = gen.let("valid", false);
      const schValid = gen.name("_valid");
      gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
          keyword,
          schemaProp: i,
          compositeRule: true
        }, schValid);
        gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        if (!merged)
          gen.if((0, codegen_1.not)(valid));
      }));
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
    }
    exports.validateUnion = validateUnion;
  }
});

// ../../../node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var code_1 = require_code2();
    var errors_1 = require_errors();
    function macroKeywordCode(cxt, def) {
      const { gen, keyword, schema, parentSchema, it } = cxt;
      const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
      const schemaRef = useKeyword(gen, keyword, macroSchema);
      if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
      const valid = gen.name("valid");
      cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: true
      }, valid);
      cxt.pass(valid, () => cxt.error(true));
    }
    exports.macroKeywordCode = macroKeywordCode;
    function funcKeywordCode(cxt, def) {
      var _a;
      const { gen, keyword, schema, parentSchema, $data, it } = cxt;
      checkAsyncKeyword(it, def);
      const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
      const validateRef = useKeyword(gen, keyword, validate);
      const valid = gen.let("valid");
      cxt.block$data(valid, validateKeyword);
      cxt.ok((_a = def.valid) !== null && _a !== void 0 ? _a : valid);
      function validateKeyword() {
        if (def.errors === false) {
          assignValid();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => cxt.error());
        } else {
          const ruleErrs = def.async ? validateAsync() : validateSync();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => addErrs(cxt, ruleErrs));
        }
      }
      function validateAsync() {
        const ruleErrs = gen.let("ruleErrs", null);
        gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
        return ruleErrs;
      }
      function validateSync() {
        const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
      }
      function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        const passSchema = !("compile" in def && !$data || def.schema === false);
        gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
      }
      function reportErrs(errors) {
        var _a2;
        gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== void 0 ? _a2 : valid), errors);
      }
    }
    exports.funcKeywordCode = funcKeywordCode;
    function modifyData(cxt) {
      const { gen, data, it } = cxt;
      gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
    }
    function addErrs(cxt, errs) {
      const { gen } = cxt;
      gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
        (0, errors_1.extendErrors)(cxt);
      }, () => cxt.error());
    }
    function checkAsyncKeyword({ schemaEnv }, def) {
      if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
    }
    function useKeyword(gen, keyword, result) {
      if (result === void 0)
        throw new Error(`keyword "${keyword}" failed to compile`);
      return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
    }
    function validSchemaType(schema, schemaType, allowUndefined = false) {
      return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
    }
    exports.validSchemaType = validSchemaType;
    function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
      if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
      }
      const deps = def.dependencies;
      if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
      }
      if (def.validateSchema) {
        const valid = def.validateSchema(schema[keyword]);
        if (!valid) {
          const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
          if (opts.validateSchema === "log")
            self.logger.error(msg);
          else
            throw new Error(msg);
        }
      }
    }
    exports.validateKeywordUsage = validateKeywordUsage;
  }
});

// ../../../node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
      if (keyword !== void 0 && schema !== void 0) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
      }
      if (keyword !== void 0) {
        const sch = it.schema[keyword];
        return schemaProp === void 0 ? {
          schema: sch,
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`
        } : {
          schema: sch[schemaProp],
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
        };
      }
      if (schema !== void 0) {
        if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
          throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
          schema,
          schemaPath,
          topSchemaRef,
          errSchemaPath
        };
      }
      throw new Error('either "keyword" or "schema" must be passed');
    }
    exports.getSubschema = getSubschema;
    function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
      if (data !== void 0 && dataProp !== void 0) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
      }
      const { gen } = it;
      if (dataProp !== void 0) {
        const { errorPath, dataPathArr, opts } = it;
        const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
        subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
      }
      if (data !== void 0) {
        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
        dataContextProps(nextData);
        if (propertyName !== void 0)
          subschema.propertyName = propertyName;
      }
      if (dataTypes)
        subschema.dataTypes = dataTypes;
      function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = /* @__PURE__ */ new Set();
        subschema.parentData = it.data;
        subschema.dataNames = [...it.dataNames, _nextData];
      }
    }
    exports.extendSubschemaData = extendSubschemaData;
    function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
      if (compositeRule !== void 0)
        subschema.compositeRule = compositeRule;
      if (createErrors !== void 0)
        subschema.createErrors = createErrors;
      if (allErrors !== void 0)
        subschema.allErrors = allErrors;
      subschema.jtdDiscriminator = jtdDiscriminator;
      subschema.jtdMetadata = jtdMetadata;
    }
    exports.extendSubschemaMode = extendSubschemaMode;
  }
});

// ../../../node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "../../../node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key = keys[i];
          if (!equal(a[key], b[key])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// ../../../node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS({
  "../../../node_modules/json-schema-traverse/index.js"(exports, module) {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      };
      var post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: true,
      items: true,
      contains: true,
      additionalProperties: true,
      propertyNames: true,
      not: true,
      if: true,
      then: true,
      else: true
    };
    traverse.arrayKeywords = {
      items: true,
      allOf: true,
      anyOf: true,
      oneOf: true
    };
    traverse.propsKeywords = {
      $defs: true,
      definitions: true,
      properties: true,
      patternProperties: true,
      dependencies: true
    };
    traverse.skipKeywords = {
      default: true,
      enum: true,
      const: true,
      required: true,
      maximum: true,
      minimum: true,
      exclusiveMaximum: true,
      exclusiveMinimum: true,
      multipleOf: true,
      maxLength: true,
      minLength: true,
      pattern: true,
      format: true,
      maxItems: true,
      minItems: true,
      uniqueItems: true,
      maxProperties: true,
      minProperties: true
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key in schema) {
          var sch = schema[key];
          if (Array.isArray(sch)) {
            if (key in traverse.arrayKeywords) {
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
            }
          } else if (key in traverse.propsKeywords) {
            if (sch && typeof sch == "object") {
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
            }
          } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
            _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
          }
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  }
});

// ../../../node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS({
  "../../../node_modules/ajv/dist/compile/resolve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
    var util_1 = require_util2();
    var equal = require_fast_deep_equal();
    var traverse = require_json_schema_traverse();
    var SIMPLE_INLINED = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const"
    ]);
    function inlineRef(schema, limit = true) {
      if (typeof schema == "boolean")
        return true;
      if (limit === true)
        return !hasRef(schema);
      if (!limit)
        return false;
      return countKeys(schema) <= limit;
    }
    exports.inlineRef = inlineRef;
    var REF_KEYWORDS = /* @__PURE__ */ new Set([
      "$ref",
      "$recursiveRef",
      "$recursiveAnchor",
      "$dynamicRef",
      "$dynamicAnchor"
    ]);
    function hasRef(schema) {
      for (const key in schema) {
        if (REF_KEYWORDS.has(key))
          return true;
        const sch = schema[key];
        if (Array.isArray(sch) && sch.some(hasRef))
          return true;
        if (typeof sch == "object" && hasRef(sch))
          return true;
      }
      return false;
    }
    function countKeys(schema) {
      let count = 0;
      for (const key in schema) {
        if (key === "$ref")
          return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key))
          continue;
        if (typeof schema[key] == "object") {
          (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
        }
        if (count === Infinity)
          return Infinity;
      }
      return count;
    }
    function getFullPath(resolver, id = "", normalize) {
      if (normalize !== false)
        id = normalizeId(id);
      const p = resolver.parse(id);
      return _getFullPath(resolver, p);
    }
    exports.getFullPath = getFullPath;
    function _getFullPath(resolver, p) {
      const serialized = resolver.serialize(p);
      return serialized.split("#")[0] + "#";
    }
    exports._getFullPath = _getFullPath;
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    exports.normalizeId = normalizeId;
    function resolveUrl(resolver, baseId, id) {
      id = normalizeId(id);
      return resolver.resolve(baseId, id);
    }
    exports.resolveUrl = resolveUrl;
    var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
    function getSchemaRefs(schema, baseId) {
      if (typeof schema == "boolean")
        return {};
      const { schemaId, uriResolver } = this.opts;
      const schId = normalizeId(schema[schemaId] || baseId);
      const baseIds = { "": schId };
      const pathPrefix = getFullPath(uriResolver, schId, false);
      const localRefs = {};
      const schemaRefs = /* @__PURE__ */ new Set();
      traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === void 0)
          return;
        const fullPath = pathPrefix + jsonPtr;
        let innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
          innerBaseId = addRef.call(this, sch[schemaId]);
        addAnchor.call(this, sch.$anchor);
        addAnchor.call(this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
          const _resolve = this.opts.uriResolver.resolve;
          ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
          if (schemaRefs.has(ref))
            throw ambiguos(ref);
          schemaRefs.add(ref);
          let schOrRef = this.refs[ref];
          if (typeof schOrRef == "string")
            schOrRef = this.refs[schOrRef];
          if (typeof schOrRef == "object") {
            checkAmbiguosRef(sch, schOrRef.schema, ref);
          } else if (ref !== normalizeId(fullPath)) {
            if (ref[0] === "#") {
              checkAmbiguosRef(sch, localRefs[ref], ref);
              localRefs[ref] = sch;
            } else {
              this.refs[ref] = fullPath;
            }
          }
          return ref;
        }
        function addAnchor(anchor) {
          if (typeof anchor == "string") {
            if (!ANCHOR.test(anchor))
              throw new Error(`invalid anchor "${anchor}"`);
            addRef.call(this, `#${anchor}`);
          }
        }
      });
      return localRefs;
      function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== void 0 && !equal(sch1, sch2))
          throw ambiguos(ref);
      }
      function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
      }
    }
    exports.getSchemaRefs = getSchemaRefs;
  }
});

// ../../../node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS({
  "../../../node_modules/ajv/dist/compile/validate/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
    var boolSchema_1 = require_boolSchema();
    var dataType_1 = require_dataType();
    var applicability_1 = require_applicability();
    var dataType_2 = require_dataType();
    var defaults_1 = require_defaults();
    var keyword_1 = require_keyword();
    var subschema_1 = require_subschema();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util2();
    var errors_1 = require_errors();
    function validateFunctionCode(it) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          topSchemaObjCode(it);
          return;
        }
      }
      validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
    }
    exports.validateFunctionCode = validateFunctionCode;
    function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
      if (opts.code.es5) {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
          gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
          destructureValCxtES5(gen, opts);
          gen.code(body);
        });
      } else {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
      }
    }
    function destructureValCxt(opts) {
      return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
    }
    function destructureValCxtES5(gen, opts) {
      gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
        gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
      }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.rootData, names_1.default.data);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
      });
    }
    function topSchemaObjCode(it) {
      const { schema, opts, gen } = it;
      validateFunction(it, () => {
        if (opts.$comment && schema.$comment)
          commentKeyword(it);
        checkNoDefault(it);
        gen.let(names_1.default.vErrors, null);
        gen.let(names_1.default.errors, 0);
        if (opts.unevaluated)
          resetEvaluated(it);
        typeAndKeywords(it);
        returnResults(it);
      });
      return;
    }
    function resetEvaluated(it) {
      const { gen, validateName } = it;
      it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
    }
    function funcSourceUrl(schema, opts) {
      const schId = typeof schema == "object" && schema[opts.schemaId];
      return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
    }
    function subschemaCode(it, valid) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          subSchemaObjCode(it, valid);
          return;
        }
      }
      (0, boolSchema_1.boolOrEmptySchema)(it, valid);
    }
    function schemaCxtHasRules({ schema, self }) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key in schema)
        if (self.RULES.all[key])
          return true;
      return false;
    }
    function isSchemaObj(it) {
      return typeof it.schema != "boolean";
    }
    function subSchemaObjCode(it, valid) {
      const { schema, gen, opts } = it;
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      updateContext(it);
      checkAsyncSchema(it);
      const errsCount = gen.const("_errs", names_1.default.errors);
      typeAndKeywords(it, errsCount);
      gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
    }
    function checkKeywords(it) {
      (0, util_1.checkUnknownRules)(it);
      checkRefsAndKeywords(it);
    }
    function typeAndKeywords(it, errsCount) {
      if (it.opts.jtd)
        return schemaKeywords(it, [], false, errsCount);
      const types = (0, dataType_1.getSchemaTypes)(it.schema);
      const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
      schemaKeywords(it, types, !checkedTypes, errsCount);
    }
    function checkRefsAndKeywords(it) {
      const { schema, errSchemaPath, opts, self } = it;
      if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
      }
    }
    function checkNoDefault(it) {
      const { schema, opts } = it;
      if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) {
        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
      }
    }
    function updateContext(it) {
      const schId = it.schema[it.opts.schemaId];
      if (schId)
        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
    }
    function checkAsyncSchema(it) {
      if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
    }
    function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
      const msg = schema.$comment;
      if (opts.$comment === true) {
        gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
      } else if (typeof opts.$comment == "function") {
        const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
      }
    }
    function returnResults(it) {
      const { gen, schemaEnv, validateName, ValidationError, opts } = it;
      if (schemaEnv.$async) {
        gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
        if (opts.unevaluated)
          assignEvaluated(it);
        gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
      }
    }
    function assignEvaluated({ gen, evaluated, props, items }) {
      if (props instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.props`, props);
      if (items instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.items`, items);
    }
    function schemaKeywords(it, types, typeErrors, errsCount) {
      const { gen, schema, data, allErrors, opts, self } = it;
      const { RULES } = self;
      if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
        return;
      }
      if (!opts.jtd)
        checkStrictTypes(it, types);
      gen.block(() => {
        for (const group of RULES.rules)
          groupKeywords(group);
        groupKeywords(RULES.post);
      });
      function groupKeywords(group) {
        if (!(0, applicability_1.shouldUseGroup)(schema, group))
          return;
        if (group.type) {
          gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
          iterateKeywords(it, group);
          if (types.length === 1 && types[0] === group.type && typeErrors) {
            gen.else();
            (0, dataType_2.reportTypeError)(it);
          }
          gen.endIf();
        } else {
          iterateKeywords(it, group);
        }
        if (!allErrors)
          gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
      }
    }
    function iterateKeywords(it, group) {
      const { gen, schema, opts: { useDefaults } } = it;
      if (useDefaults)
        (0, defaults_1.assignDefaults)(it, group.type);
      gen.block(() => {
        for (const rule of group.rules) {
          if ((0, applicability_1.shouldUseRule)(schema, rule)) {
            keywordCode(it, rule.keyword, rule.definition, group.type);
          }
        }
      });
    }
    function checkStrictTypes(it, types) {
      if (it.schemaEnv.meta || !it.opts.strictTypes)
        return;
      checkContextTypes(it, types);
      if (!it.opts.allowUnionTypes)
        checkMultipleTypes(it, types);
      checkKeywordTypes(it, it.dataTypes);
    }
    function checkContextTypes(it, types) {
      if (!types.length)
        return;
      if (!it.dataTypes.length) {
        it.dataTypes = types;
        return;
      }
      types.forEach((t) => {
        if (!includesType(it.dataTypes, t)) {
          strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }
      });
      narrowSchemaTypes(it, types);
    }
    function checkMultipleTypes(it, ts) {
      if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
      }
    }
    function checkKeywordTypes(it, ts) {
      const rules = it.self.RULES.all;
      for (const keyword in rules) {
        const rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
          const { type } = rule.definition;
          if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
            strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
          }
        }
      }
    }
    function hasApplicableType(schTs, kwdT) {
      return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
    }
    function includesType(ts, t) {
      return ts.includes(t) || t === "integer" && ts.includes("number");
    }
    function narrowSchemaTypes(it, withTypes) {
      const ts = [];
      for (const t of it.dataTypes) {
        if (includesType(withTypes, t))
          ts.push(t);
        else if (withTypes.includes("integer") && t === "number")
          ts.push("integer");
      }
      it.dataTypes = ts;
    }
    function strictTypesError(it, msg) {
      const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
      msg += ` at "${schemaPath}" (strictTypes)`;
      (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
    }
    var KeywordCxt = class {
      constructor(it, def, keyword) {
        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
        this.gen = it.gen;
        this.allErrors = it.allErrors;
        this.keyword = keyword;
        this.data = it.data;
        this.schema = it.schema[keyword];
        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
        this.schemaType = def.schemaType;
        this.parentSchema = it.schema;
        this.params = {};
        this.it = it;
        this.def = def;
        if (this.$data) {
          this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        } else {
          this.schemaCode = this.schemaValue;
          if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
            throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
          }
        }
        if ("code" in def ? def.trackErrors : def.errors !== false) {
          this.errsCount = it.gen.const("_errs", names_1.default.errors);
        }
      }
      result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
      }
      failResult(condition, successAction, failAction) {
        this.gen.if(condition);
        if (failAction)
          failAction();
        else
          this.error();
        if (successAction) {
          this.gen.else();
          successAction();
          if (this.allErrors)
            this.gen.endIf();
        } else {
          if (this.allErrors)
            this.gen.endIf();
          else
            this.gen.else();
        }
      }
      pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), void 0, failAction);
      }
      fail(condition) {
        if (condition === void 0) {
          this.error();
          if (!this.allErrors)
            this.gen.if(false);
          return;
        }
        this.gen.if(condition);
        this.error();
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
      fail$data(condition) {
        if (!this.$data)
          return this.fail(condition);
        const { schemaCode } = this;
        this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
      }
      error(append, errorParams, errorPaths) {
        if (errorParams) {
          this.setParams(errorParams);
          this._error(append, errorPaths);
          this.setParams({});
          return;
        }
        this._error(append, errorPaths);
      }
      _error(append, errorPaths) {
        ;
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
      }
      $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
      }
      reset() {
        if (this.errsCount === void 0)
          throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
      }
      ok(cond) {
        if (!this.allErrors)
          this.gen.if(cond);
      }
      setParams(obj, assign) {
        if (assign)
          Object.assign(this.params, obj);
        else
          this.params = obj;
      }
      block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
          this.check$data(valid, $dataValid);
          codeBlock();
        });
      }
      check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
          return;
        const { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
        if (valid !== codegen_1.nil)
          gen.assign(valid, true);
        if (schemaType.length || def.validateSchema) {
          gen.elseIf(this.invalid$data());
          this.$dataError();
          if (valid !== codegen_1.nil)
            gen.assign(valid, false);
        }
        gen.else();
      }
      invalid$data() {
        const { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
          if (schemaType.length) {
            if (!(schemaCode instanceof codegen_1.Name))
              throw new Error("ajv implementation error");
            const st = Array.isArray(schemaType) ? schemaType : [schemaType];
            return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
          }
          return codegen_1.nil;
        }
        function invalid$DataSchema() {
          if (def.validateSchema) {
            const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
            return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
          }
          return codegen_1.nil;
        }
      }
      subschema(appl, valid) {
        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
        (0, subschema_1.extendSubschemaMode)(subschema, appl);
        const nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
        subschemaCode(nextContext, valid);
        return nextContext;
      }
      mergeEvaluated(schemaCxt, toName) {
        const { it, gen } = this;
        if (!it.opts.unevaluated)
          return;
        if (it.props !== true && schemaCxt.props !== void 0) {
          it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
        }
        if (it.items !== true && schemaCxt.items !== void 0) {
          it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
        }
      }
      mergeValidEvaluated(schemaCxt, valid) {
        const { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
          return true;
        }
      }
    };
    exports.KeywordCxt = KeywordCxt;
    function keywordCode(it, keyword, def, ruleType) {
      const cxt = new KeywordCxt(it, def, keyword);
      if ("code" in def) {
        def.code(cxt, ruleType);
      } else if (cxt.$data && def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      } else if ("macro" in def) {
        (0, keyword_1.macroKeywordCode)(cxt, def);
      } else if (def.compile || def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      }
    }
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
    var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, { dataLevel, dataNames, dataPathArr }) {
      let jsonPointer;
      let data;
      if ($data === "")
        return names_1.default.rootData;
      if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data;
        data = names_1.default.rootData;
      } else {
        const matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        const up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer === "#") {
          if (up >= dataLevel)
            throw new Error(errorMsg("property/index", up));
          return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
          throw new Error(errorMsg("data", up));
        data = dataNames[dataLevel - up];
        if (!jsonPointer)
          return data;
      }
      let expr = data;
      const segments = jsonPointer.split("/");
      for (const segment of segments) {
        if (segment) {
          data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
          expr = (0, codegen_1._)`${expr} && ${data}`;
        }
      }
      return expr;
      function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
      }
    }
    exports.getData = getData;
  }
});

// ../../../node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS({
  "../../../node_modules/ajv/dist/runtime/validation_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ValidationError = class extends Error {
      constructor(errors) {
        super("validation failed");
        this.errors = errors;
        this.ajv = this.validation = true;
      }
    };
    exports.default = ValidationError;
  }
});

// ../../../node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS({
  "../../../node_modules/ajv/dist/compile/ref_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var resolve_1 = require_resolve();
    var MissingRefError = class extends Error {
      constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
      }
    };
    exports.default = MissingRefError;
  }
});

// ../../../node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS({
  "../../../node_modules/ajv/dist/compile/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
    var codegen_1 = require_codegen();
    var validation_error_1 = require_validation_error();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util2();
    var validate_1 = require_validate();
    var SchemaEnv = class {
      constructor(env) {
        var _a;
        this.refs = {};
        this.dynamicAnchors = {};
        let schema;
        if (typeof env.schema == "object")
          schema = env.schema;
        this.schema = env.schema;
        this.schemaId = env.schemaId;
        this.root = env.root || this;
        this.baseId = (_a = env.baseId) !== null && _a !== void 0 ? _a : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
        this.schemaPath = env.schemaPath;
        this.localRefs = env.localRefs;
        this.meta = env.meta;
        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
        this.refs = {};
      }
    };
    exports.SchemaEnv = SchemaEnv;
    function compileSchema(sch) {
      const _sch = getCompilingSchema.call(this, sch);
      if (_sch)
        return _sch;
      const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
      const { es5, lines } = this.opts.code;
      const { ownProperties } = this.opts;
      const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
      let _ValidationError;
      if (sch.$async) {
        _ValidationError = gen.scopeValue("Error", {
          ref: validation_error_1.default,
          code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
        });
      }
      const validateName = gen.scopeName("validate");
      sch.validateName = validateName;
      const schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil],
        // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: /* @__PURE__ */ new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._)`""`,
        opts: this.opts,
        self: this
      };
      let sourceCode;
      try {
        this._compilations.add(sch);
        (0, validate_1.validateFunctionCode)(schemaCxt);
        gen.optimize(this.opts.code.optimize);
        const validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
        if (this.opts.code.process)
          sourceCode = this.opts.code.process(sourceCode, sch);
        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
        const validate = makeValidate(this, this.scope.get());
        this.scope.value(validateName, { ref: validate });
        validate.errors = null;
        validate.schema = sch.schema;
        validate.schemaEnv = sch;
        if (sch.$async)
          validate.$async = true;
        if (this.opts.code.source === true) {
          validate.source = { validateName, validateCode, scopeValues: gen._values };
        }
        if (this.opts.unevaluated) {
          const { props, items } = schemaCxt;
          validate.evaluated = {
            props: props instanceof codegen_1.Name ? void 0 : props,
            items: items instanceof codegen_1.Name ? void 0 : items,
            dynamicProps: props instanceof codegen_1.Name,
            dynamicItems: items instanceof codegen_1.Name
          };
          if (validate.source)
            validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
        }
        sch.validate = validate;
        return sch;
      } catch (e) {
        delete sch.validate;
        delete sch.validateName;
        if (sourceCode)
          this.logger.error("Error compiling schema, function code:", sourceCode);
        throw e;
      } finally {
        this._compilations.delete(sch);
      }
    }
    exports.compileSchema = compileSchema;
    function resolveRef(root, baseId, ref) {
      var _a;
      ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
      const schOrFunc = root.refs[ref];
      if (schOrFunc)
        return schOrFunc;
      let _sch = resolve2.call(this, root, ref);
      if (_sch === void 0) {
        const schema = (_a = root.localRefs) === null || _a === void 0 ? void 0 : _a[ref];
        const { schemaId } = this.opts;
        if (schema)
          _sch = new SchemaEnv({ schema, schemaId, root, baseId });
      }
      if (_sch === void 0)
        return;
      return root.refs[ref] = inlineOrCompile.call(this, _sch);
    }
    exports.resolveRef = resolveRef;
    function inlineOrCompile(sch) {
      if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
        return sch.schema;
      return sch.validate ? sch : compileSchema.call(this, sch);
    }
    function getCompilingSchema(schEnv) {
      for (const sch of this._compilations) {
        if (sameSchemaEnv(sch, schEnv))
          return sch;
      }
    }
    exports.getCompilingSchema = getCompilingSchema;
    function sameSchemaEnv(s1, s2) {
      return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
    }
    function resolve2(root, ref) {
      let sch;
      while (typeof (sch = this.refs[ref]) == "string")
        ref = sch;
      return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
    }
    function resolveSchema(root, ref) {
      const p = this.opts.uriResolver.parse(ref);
      const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
      let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
      if (Object.keys(root.schema).length > 0 && refPath === baseId) {
        return getJsonPointer.call(this, p, root);
      }
      const id = (0, resolve_1.normalizeId)(refPath);
      const schOrRef = this.refs[id] || this.schemas[id];
      if (typeof schOrRef == "string") {
        const sch = resolveSchema.call(this, root, schOrRef);
        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
          return;
        return getJsonPointer.call(this, p, sch);
      }
      if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
        return;
      if (!schOrRef.validate)
        compileSchema.call(this, schOrRef);
      if (id === (0, resolve_1.normalizeId)(ref)) {
        const { schema } = schOrRef;
        const { schemaId } = this.opts;
        const schId = schema[schemaId];
        if (schId)
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        return new SchemaEnv({ schema, schemaId, root, baseId });
      }
      return getJsonPointer.call(this, p, schOrRef);
    }
    exports.resolveSchema = resolveSchema;
    var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
      "properties",
      "patternProperties",
      "enum",
      "dependencies",
      "definitions"
    ]);
    function getJsonPointer(parsedRef, { baseId, schema, root }) {
      var _a;
      if (((_a = parsedRef.fragment) === null || _a === void 0 ? void 0 : _a[0]) !== "/")
        return;
      for (const part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema === "boolean")
          return;
        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === void 0)
          return;
        schema = partSchema;
        const schId = typeof schema === "object" && schema[this.opts.schemaId];
        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        }
      }
      let env;
      if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
      }
      const { schemaId } = this.opts;
      env = env || new SchemaEnv({ schema, schemaId, root, baseId });
      if (env.schema !== env.root.schema)
        return env;
      return void 0;
    }
  }
});

// ../../../node_modules/ajv/dist/refs/data.json
var require_data = __commonJS({
  "../../../node_modules/ajv/dist/refs/data.json"(exports, module) {
    module.exports = {
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
        }
      },
      additionalProperties: false
    };
  }
});

// ../../../node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS({
  "../../../node_modules/fast-uri/lib/utils.js"(exports, module) {
    "use strict";
    var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
    var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
    function stringArrayToHexStripped(input) {
      let acc = "";
      let code = 0;
      let i = 0;
      for (i = 0; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (code === 48) {
          continue;
        }
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
        break;
      }
      for (i += 1; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
      }
      return acc;
    }
    var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
    function consumeIsZone(buffer) {
      buffer.length = 0;
      return true;
    }
    function consumeHextets(buffer, address, output) {
      if (buffer.length) {
        const hex = stringArrayToHexStripped(buffer);
        if (hex !== "") {
          address.push(hex);
        } else {
          output.error = true;
          return false;
        }
        buffer.length = 0;
      }
      return true;
    }
    function getIPV6(input) {
      let tokenCount = 0;
      const output = { error: false, address: "", zone: "" };
      const address = [];
      const buffer = [];
      let endipv6Encountered = false;
      let endIpv6 = false;
      let consume = consumeHextets;
      for (let i = 0; i < input.length; i++) {
        const cursor = input[i];
        if (cursor === "[" || cursor === "]") {
          continue;
        }
        if (cursor === ":") {
          if (endipv6Encountered === true) {
            endIpv6 = true;
          }
          if (!consume(buffer, address, output)) {
            break;
          }
          if (++tokenCount > 7) {
            output.error = true;
            break;
          }
          if (i > 0 && input[i - 1] === ":") {
            endipv6Encountered = true;
          }
          address.push(":");
          continue;
        } else if (cursor === "%") {
          if (!consume(buffer, address, output)) {
            break;
          }
          consume = consumeIsZone;
        } else {
          buffer.push(cursor);
          continue;
        }
      }
      if (buffer.length) {
        if (consume === consumeIsZone) {
          output.zone = buffer.join("");
        } else if (endIpv6) {
          address.push(buffer.join(""));
        } else {
          address.push(stringArrayToHexStripped(buffer));
        }
      }
      output.address = address.join("");
      return output;
    }
    function normalizeIPv6(host) {
      if (findToken(host, ":") < 2) {
        return { host, isIPV6: false };
      }
      const ipv6 = getIPV6(host);
      if (!ipv6.error) {
        let newHost = ipv6.address;
        let escapedHost = ipv6.address;
        if (ipv6.zone) {
          newHost += "%" + ipv6.zone;
          escapedHost += "%25" + ipv6.zone;
        }
        return { host: newHost, isIPV6: true, escapedHost };
      } else {
        return { host, isIPV6: false };
      }
    }
    function findToken(str, token) {
      let ind = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === token) ind++;
      }
      return ind;
    }
    function removeDotSegments(path) {
      let input = path;
      const output = [];
      let nextSlash = -1;
      let len = 0;
      while (len = input.length) {
        if (len === 1) {
          if (input === ".") {
            break;
          } else if (input === "/") {
            output.push("/");
            break;
          } else {
            output.push(input);
            break;
          }
        } else if (len === 2) {
          if (input[0] === ".") {
            if (input[1] === ".") {
              break;
            } else if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/") {
            if (input[1] === "." || input[1] === "/") {
              output.push("/");
              break;
            }
          }
        } else if (len === 3) {
          if (input === "/..") {
            if (output.length !== 0) {
              output.pop();
            }
            output.push("/");
            break;
          }
        }
        if (input[0] === ".") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(3);
              continue;
            }
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(2);
              continue;
            } else if (input[2] === ".") {
              if (input[3] === "/") {
                input = input.slice(3);
                if (output.length !== 0) {
                  output.pop();
                }
                continue;
              }
            }
          }
        }
        if ((nextSlash = input.indexOf("/", 1)) === -1) {
          output.push(input);
          break;
        } else {
          output.push(input.slice(0, nextSlash));
          input = input.slice(nextSlash);
        }
      }
      return output.join("");
    }
    function normalizeComponentEncoding(component, esc) {
      const func = esc !== true ? escape : unescape;
      if (component.scheme !== void 0) {
        component.scheme = func(component.scheme);
      }
      if (component.userinfo !== void 0) {
        component.userinfo = func(component.userinfo);
      }
      if (component.host !== void 0) {
        component.host = func(component.host);
      }
      if (component.path !== void 0) {
        component.path = func(component.path);
      }
      if (component.query !== void 0) {
        component.query = func(component.query);
      }
      if (component.fragment !== void 0) {
        component.fragment = func(component.fragment);
      }
      return component;
    }
    function recomposeAuthority(component) {
      const uriTokens = [];
      if (component.userinfo !== void 0) {
        uriTokens.push(component.userinfo);
        uriTokens.push("@");
      }
      if (component.host !== void 0) {
        let host = unescape(component.host);
        if (!isIPv4(host)) {
          const ipV6res = normalizeIPv6(host);
          if (ipV6res.isIPV6 === true) {
            host = `[${ipV6res.escapedHost}]`;
          } else {
            host = component.host;
          }
        }
        uriTokens.push(host);
      }
      if (typeof component.port === "number" || typeof component.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(component.port));
      }
      return uriTokens.length ? uriTokens.join("") : void 0;
    }
    module.exports = {
      nonSimpleDomain,
      recomposeAuthority,
      normalizeComponentEncoding,
      removeDotSegments,
      isIPv4,
      isUUID,
      normalizeIPv6,
      stringArrayToHexStripped
    };
  }
});

// ../../../node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS({
  "../../../node_modules/fast-uri/lib/schemes.js"(exports, module) {
    "use strict";
    var { isUUID } = require_utils();
    var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
    var supportedSchemeNames = (
      /** @type {const} */
      [
        "http",
        "https",
        "ws",
        "wss",
        "urn",
        "urn:uuid"
      ]
    );
    function isValidSchemeName(name) {
      return supportedSchemeNames.indexOf(
        /** @type {*} */
        name
      ) !== -1;
    }
    function wsIsSecure(wsComponent) {
      if (wsComponent.secure === true) {
        return true;
      } else if (wsComponent.secure === false) {
        return false;
      } else if (wsComponent.scheme) {
        return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
      } else {
        return false;
      }
    }
    function httpParse(component) {
      if (!component.host) {
        component.error = component.error || "HTTP URIs must have a host.";
      }
      return component;
    }
    function httpSerialize(component) {
      const secure = String(component.scheme).toLowerCase() === "https";
      if (component.port === (secure ? 443 : 80) || component.port === "") {
        component.port = void 0;
      }
      if (!component.path) {
        component.path = "/";
      }
      return component;
    }
    function wsParse(wsComponent) {
      wsComponent.secure = wsIsSecure(wsComponent);
      wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
      wsComponent.path = void 0;
      wsComponent.query = void 0;
      return wsComponent;
    }
    function wsSerialize(wsComponent) {
      if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
        wsComponent.port = void 0;
      }
      if (typeof wsComponent.secure === "boolean") {
        wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
        wsComponent.secure = void 0;
      }
      if (wsComponent.resourceName) {
        const [path, query] = wsComponent.resourceName.split("?");
        wsComponent.path = path && path !== "/" ? path : void 0;
        wsComponent.query = query;
        wsComponent.resourceName = void 0;
      }
      wsComponent.fragment = void 0;
      return wsComponent;
    }
    function urnParse(urnComponent, options) {
      if (!urnComponent.path) {
        urnComponent.error = "URN can not be parsed";
        return urnComponent;
      }
      const matches = urnComponent.path.match(URN_REG);
      if (matches) {
        const scheme = options.scheme || urnComponent.scheme || "urn";
        urnComponent.nid = matches[1].toLowerCase();
        urnComponent.nss = matches[2];
        const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
        const schemeHandler = getSchemeHandler(urnScheme);
        urnComponent.path = void 0;
        if (schemeHandler) {
          urnComponent = schemeHandler.parse(urnComponent, options);
        }
      } else {
        urnComponent.error = urnComponent.error || "URN can not be parsed.";
      }
      return urnComponent;
    }
    function urnSerialize(urnComponent, options) {
      if (urnComponent.nid === void 0) {
        throw new Error("URN without nid cannot be serialized");
      }
      const scheme = options.scheme || urnComponent.scheme || "urn";
      const nid = urnComponent.nid.toLowerCase();
      const urnScheme = `${scheme}:${options.nid || nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      if (schemeHandler) {
        urnComponent = schemeHandler.serialize(urnComponent, options);
      }
      const uriComponent = urnComponent;
      const nss = urnComponent.nss;
      uriComponent.path = `${nid || options.nid}:${nss}`;
      options.skipEscape = true;
      return uriComponent;
    }
    function urnuuidParse(urnComponent, options) {
      const uuidComponent = urnComponent;
      uuidComponent.uuid = uuidComponent.nss;
      uuidComponent.nss = void 0;
      if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
        uuidComponent.error = uuidComponent.error || "UUID is not valid.";
      }
      return uuidComponent;
    }
    function urnuuidSerialize(uuidComponent) {
      const urnComponent = uuidComponent;
      urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
      return urnComponent;
    }
    var http = (
      /** @type {SchemeHandler} */
      {
        scheme: "http",
        domainHost: true,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var https = (
      /** @type {SchemeHandler} */
      {
        scheme: "https",
        domainHost: http.domainHost,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var ws = (
      /** @type {SchemeHandler} */
      {
        scheme: "ws",
        domainHost: true,
        parse: wsParse,
        serialize: wsSerialize
      }
    );
    var wss = (
      /** @type {SchemeHandler} */
      {
        scheme: "wss",
        domainHost: ws.domainHost,
        parse: ws.parse,
        serialize: ws.serialize
      }
    );
    var urn = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn",
        parse: urnParse,
        serialize: urnSerialize,
        skipNormalize: true
      }
    );
    var urnuuid = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn:uuid",
        parse: urnuuidParse,
        serialize: urnuuidSerialize,
        skipNormalize: true
      }
    );
    var SCHEMES = (
      /** @type {Record<SchemeName, SchemeHandler>} */
      {
        http,
        https,
        ws,
        wss,
        urn,
        "urn:uuid": urnuuid
      }
    );
    Object.setPrototypeOf(SCHEMES, null);
    function getSchemeHandler(scheme) {
      return scheme && (SCHEMES[
        /** @type {SchemeName} */
        scheme
      ] || SCHEMES[
        /** @type {SchemeName} */
        scheme.toLowerCase()
      ]) || void 0;
    }
    module.exports = {
      wsIsSecure,
      SCHEMES,
      isValidSchemeName,
      getSchemeHandler
    };
  }
});

// ../../../node_modules/fast-uri/index.js
var require_fast_uri = __commonJS({
  "../../../node_modules/fast-uri/index.js"(exports, module) {
    "use strict";
    var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = require_utils();
    var { SCHEMES, getSchemeHandler } = require_schemes();
    function normalize(uri, options) {
      if (typeof uri === "string") {
        uri = /** @type {T} */
        serialize(parse(uri, options), options);
      } else if (typeof uri === "object") {
        uri = /** @type {T} */
        parse(serialize(uri, options), options);
      }
      return uri;
    }
    function resolve2(baseURI, relativeURI, options) {
      const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
      const resolved = resolveComponent(parse(baseURI, schemelessOptions), parse(relativeURI, schemelessOptions), schemelessOptions, true);
      schemelessOptions.skipEscape = true;
      return serialize(resolved, schemelessOptions);
    }
    function resolveComponent(base, relative2, options, skipNormalization) {
      const target = {};
      if (!skipNormalization) {
        base = parse(serialize(base, options), options);
        relative2 = parse(serialize(relative2, options), options);
      }
      options = options || {};
      if (!options.tolerant && relative2.scheme) {
        target.scheme = relative2.scheme;
        target.userinfo = relative2.userinfo;
        target.host = relative2.host;
        target.port = relative2.port;
        target.path = removeDotSegments(relative2.path || "");
        target.query = relative2.query;
      } else {
        if (relative2.userinfo !== void 0 || relative2.host !== void 0 || relative2.port !== void 0) {
          target.userinfo = relative2.userinfo;
          target.host = relative2.host;
          target.port = relative2.port;
          target.path = removeDotSegments(relative2.path || "");
          target.query = relative2.query;
        } else {
          if (!relative2.path) {
            target.path = base.path;
            if (relative2.query !== void 0) {
              target.query = relative2.query;
            } else {
              target.query = base.query;
            }
          } else {
            if (relative2.path[0] === "/") {
              target.path = removeDotSegments(relative2.path);
            } else {
              if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
                target.path = "/" + relative2.path;
              } else if (!base.path) {
                target.path = relative2.path;
              } else {
                target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative2.path;
              }
              target.path = removeDotSegments(target.path);
            }
            target.query = relative2.query;
          }
          target.userinfo = base.userinfo;
          target.host = base.host;
          target.port = base.port;
        }
        target.scheme = base.scheme;
      }
      target.fragment = relative2.fragment;
      return target;
    }
    function equal(uriA, uriB, options) {
      if (typeof uriA === "string") {
        uriA = unescape(uriA);
        uriA = serialize(normalizeComponentEncoding(parse(uriA, options), true), { ...options, skipEscape: true });
      } else if (typeof uriA === "object") {
        uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
      }
      if (typeof uriB === "string") {
        uriB = unescape(uriB);
        uriB = serialize(normalizeComponentEncoding(parse(uriB, options), true), { ...options, skipEscape: true });
      } else if (typeof uriB === "object") {
        uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
      }
      return uriA.toLowerCase() === uriB.toLowerCase();
    }
    function serialize(cmpts, opts) {
      const component = {
        host: cmpts.host,
        scheme: cmpts.scheme,
        userinfo: cmpts.userinfo,
        port: cmpts.port,
        path: cmpts.path,
        query: cmpts.query,
        nid: cmpts.nid,
        nss: cmpts.nss,
        uuid: cmpts.uuid,
        fragment: cmpts.fragment,
        reference: cmpts.reference,
        resourceName: cmpts.resourceName,
        secure: cmpts.secure,
        error: ""
      };
      const options = Object.assign({}, opts);
      const uriTokens = [];
      const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
      if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
      if (component.path !== void 0) {
        if (!options.skipEscape) {
          component.path = escape(component.path);
          if (component.scheme !== void 0) {
            component.path = component.path.split("%3A").join(":");
          }
        } else {
          component.path = unescape(component.path);
        }
      }
      if (options.reference !== "suffix" && component.scheme) {
        uriTokens.push(component.scheme, ":");
      }
      const authority = recomposeAuthority(component);
      if (authority !== void 0) {
        if (options.reference !== "suffix") {
          uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (component.path && component.path[0] !== "/") {
          uriTokens.push("/");
        }
      }
      if (component.path !== void 0) {
        let s = component.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
          s = removeDotSegments(s);
        }
        if (authority === void 0 && s[0] === "/" && s[1] === "/") {
          s = "/%2F" + s.slice(2);
        }
        uriTokens.push(s);
      }
      if (component.query !== void 0) {
        uriTokens.push("?", component.query);
      }
      if (component.fragment !== void 0) {
        uriTokens.push("#", component.fragment);
      }
      return uriTokens.join("");
    }
    var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
    function parse(uri, opts) {
      const options = Object.assign({}, opts);
      const parsed = {
        scheme: void 0,
        userinfo: void 0,
        host: "",
        port: void 0,
        path: "",
        query: void 0,
        fragment: void 0
      };
      let isIP = false;
      if (options.reference === "suffix") {
        if (options.scheme) {
          uri = options.scheme + ":" + uri;
        } else {
          uri = "//" + uri;
        }
      }
      const matches = uri.match(URI_PARSE);
      if (matches) {
        parsed.scheme = matches[1];
        parsed.userinfo = matches[3];
        parsed.host = matches[4];
        parsed.port = parseInt(matches[5], 10);
        parsed.path = matches[6] || "";
        parsed.query = matches[7];
        parsed.fragment = matches[8];
        if (isNaN(parsed.port)) {
          parsed.port = matches[5];
        }
        if (parsed.host) {
          const ipv4result = isIPv4(parsed.host);
          if (ipv4result === false) {
            const ipv6result = normalizeIPv6(parsed.host);
            parsed.host = ipv6result.host.toLowerCase();
            isIP = ipv6result.isIPV6;
          } else {
            isIP = true;
          }
        }
        if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
          parsed.reference = "same-document";
        } else if (parsed.scheme === void 0) {
          parsed.reference = "relative";
        } else if (parsed.fragment === void 0) {
          parsed.reference = "absolute";
        } else {
          parsed.reference = "uri";
        }
        if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
          parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
        }
        const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
          if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
            try {
              parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
            } catch (e) {
              parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
            }
          }
        }
        if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
          if (uri.indexOf("%") !== -1) {
            if (parsed.scheme !== void 0) {
              parsed.scheme = unescape(parsed.scheme);
            }
            if (parsed.host !== void 0) {
              parsed.host = unescape(parsed.host);
            }
          }
          if (parsed.path) {
            parsed.path = escape(unescape(parsed.path));
          }
          if (parsed.fragment) {
            parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
          }
        }
        if (schemeHandler && schemeHandler.parse) {
          schemeHandler.parse(parsed, options);
        }
      } else {
        parsed.error = parsed.error || "URI can not be parsed.";
      }
      return parsed;
    }
    var fastUri = {
      SCHEMES,
      normalize,
      resolve: resolve2,
      resolveComponent,
      equal,
      serialize,
      parse
    };
    module.exports = fastUri;
    module.exports.default = fastUri;
    module.exports.fastUri = fastUri;
  }
});

// ../../../node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS({
  "../../../node_modules/ajv/dist/runtime/uri.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var uri = require_fast_uri();
    uri.code = 'require("ajv/dist/runtime/uri").default';
    exports.default = uri;
  }
});

// ../../../node_modules/ajv/dist/core.js
var require_core = __commonJS({
  "../../../node_modules/ajv/dist/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    var ref_error_1 = require_ref_error();
    var rules_1 = require_rules();
    var compile_1 = require_compile();
    var codegen_2 = require_codegen();
    var resolve_1 = require_resolve();
    var dataType_1 = require_dataType();
    var util_1 = require_util2();
    var $dataRefSchema = require_data();
    var uri_1 = require_uri();
    var defaultRegExp = (str, flags) => new RegExp(str, flags);
    defaultRegExp.code = "new RegExp";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
    var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]);
    var removedOptions = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    };
    var deprecatedOptions = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    };
    var MAX_EXPRESSION = 200;
    function requiredOptions(o) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
      const s = o.strict;
      const _optz = (_a = o.code) === null || _a === void 0 ? void 0 : _a.optimize;
      const optimize = _optz === true || _optz === void 0 ? 1 : _optz || 0;
      const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
      const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
      return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver
      };
    }
    var Ajv = class {
      constructor(opts = {}) {
        this.schemas = {};
        this.refs = {};
        this.formats = {};
        this._compilations = /* @__PURE__ */ new Set();
        this._loading = {};
        this._cache = /* @__PURE__ */ new Map();
        opts = this.opts = { ...opts, ...requiredOptions(opts) };
        const { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
        this.logger = getLogger(opts.logger);
        const formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_1.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
          addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
          addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
          this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data, meta, schemaId } = this.opts;
        let _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
          _dataRefSchema = { ...$dataRefSchema };
          _dataRefSchema.id = _dataRefSchema.$id;
          delete _dataRefSchema.$id;
        }
        if (meta && $data)
          this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
      }
      defaultMeta() {
        const { meta, schemaId } = this.opts;
        return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : void 0;
      }
      validate(schemaKeyRef, data) {
        let v;
        if (typeof schemaKeyRef == "string") {
          v = this.getSchema(schemaKeyRef);
          if (!v)
            throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        } else {
          v = this.compile(schemaKeyRef);
        }
        const valid = v(data);
        if (!("$async" in v))
          this.errors = v.errors;
        return valid;
      }
      compile(schema, _meta) {
        const sch = this._addSchema(schema, _meta);
        return sch.validate || this._compileSchemaEnv(sch);
      }
      compileAsync(schema, meta) {
        if (typeof this.opts.loadSchema != "function") {
          throw new Error("options.loadSchema should be a function");
        }
        const { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta);
        async function runCompileAsync(_schema, _meta) {
          await loadMetaSchema.call(this, _schema.$schema);
          const sch = this._addSchema(_schema, _meta);
          return sch.validate || _compileAsync.call(this, sch);
        }
        async function loadMetaSchema($ref) {
          if ($ref && !this.getSchema($ref)) {
            await runCompileAsync.call(this, { $ref }, true);
          }
        }
        async function _compileAsync(sch) {
          try {
            return this._compileSchemaEnv(sch);
          } catch (e) {
            if (!(e instanceof ref_error_1.default))
              throw e;
            checkLoaded.call(this, e);
            await loadMissingSchema.call(this, e.missingSchema);
            return _compileAsync.call(this, sch);
          }
        }
        function checkLoaded({ missingSchema: ref, missingRef }) {
          if (this.refs[ref]) {
            throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
          }
        }
        async function loadMissingSchema(ref) {
          const _schema = await _loadSchema.call(this, ref);
          if (!this.refs[ref])
            await loadMetaSchema.call(this, _schema.$schema);
          if (!this.refs[ref])
            this.addSchema(_schema, ref, meta);
        }
        async function _loadSchema(ref) {
          const p = this._loading[ref];
          if (p)
            return p;
          try {
            return await (this._loading[ref] = loadSchema(ref));
          } finally {
            delete this._loading[ref];
          }
        }
      }
      // Adds schema to the instance
      addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
        if (Array.isArray(schema)) {
          for (const sch of schema)
            this.addSchema(sch, void 0, _meta, _validateSchema);
          return this;
        }
        let id;
        if (typeof schema === "object") {
          const { schemaId } = this.opts;
          id = schema[schemaId];
          if (id !== void 0 && typeof id != "string") {
            throw new Error(`schema ${schemaId} must be string`);
          }
        }
        key = (0, resolve_1.normalizeId)(key || id);
        this._checkUnique(key);
        this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
        return this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
        this.addSchema(schema, key, true, _validateSchema);
        return this;
      }
      //  Validate schema against its meta-schema
      validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
          return true;
        let $schema;
        $schema = schema.$schema;
        if ($schema !== void 0 && typeof $schema != "string") {
          throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
          this.logger.warn("meta-schema not available");
          this.errors = null;
          return true;
        }
        const valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
          const message = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(message);
          else
            throw new Error(message);
        }
        return valid;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(keyRef) {
        let sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
          keyRef = sch;
        if (sch === void 0) {
          const { schemaId } = this.opts;
          const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
          sch = compile_1.resolveSchema.call(this, root, keyRef);
          if (!sch)
            return;
          this.refs[keyRef] = sch;
        }
        return sch.validate || this._compileSchemaEnv(sch);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
          this._removeAllSchemas(this.schemas, schemaKeyRef);
          this._removeAllSchemas(this.refs, schemaKeyRef);
          return this;
        }
        switch (typeof schemaKeyRef) {
          case "undefined":
            this._removeAllSchemas(this.schemas);
            this._removeAllSchemas(this.refs);
            this._cache.clear();
            return this;
          case "string": {
            const sch = getSchEnv.call(this, schemaKeyRef);
            if (typeof sch == "object")
              this._cache.delete(sch.schema);
            delete this.schemas[schemaKeyRef];
            delete this.refs[schemaKeyRef];
            return this;
          }
          case "object": {
            const cacheKey = schemaKeyRef;
            this._cache.delete(cacheKey);
            let id = schemaKeyRef[this.opts.schemaId];
            if (id) {
              id = (0, resolve_1.normalizeId)(id);
              delete this.schemas[id];
              delete this.refs[id];
            }
            return this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(definitions) {
        for (const def of definitions)
          this.addKeyword(def);
        return this;
      }
      addKeyword(kwdOrDef, def) {
        let keyword;
        if (typeof kwdOrDef == "string") {
          keyword = kwdOrDef;
          if (typeof def == "object") {
            this.logger.warn("these parameters are deprecated, see docs for addKeyword");
            def.keyword = keyword;
          }
        } else if (typeof kwdOrDef == "object" && def === void 0) {
          def = kwdOrDef;
          keyword = def.keyword;
          if (Array.isArray(keyword) && !keyword.length) {
            throw new Error("addKeywords: keyword must be string or non-empty array");
          }
        } else {
          throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
          (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
          return this;
        }
        keywordMetaschema.call(this, def);
        const definition = {
          ...def,
          type: (0, dataType_1.getJSONTypes)(def.type),
          schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
        };
        (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
        return this;
      }
      getKeyword(keyword) {
        const rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
      }
      // Remove keyword
      removeKeyword(keyword) {
        const { RULES } = this;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (const group of RULES.rules) {
          const i = group.rules.findIndex((rule) => rule.keyword === keyword);
          if (i >= 0)
            group.rules.splice(i, 1);
        }
        return this;
      }
      // Add format
      addFormat(name, format) {
        if (typeof format == "string")
          format = new RegExp(format);
        this.formats[name] = format;
        return this;
      }
      errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
        if (!errors || errors.length === 0)
          return "No errors";
        return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
      }
      $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        const rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (const jsonPointer of keywordsJsonPointers) {
          const segments = jsonPointer.split("/").slice(1);
          let keywords = metaSchema;
          for (const seg of segments)
            keywords = keywords[seg];
          for (const key in rules) {
            const rule = rules[key];
            if (typeof rule != "object")
              continue;
            const { $data } = rule.definition;
            const schema = keywords[key];
            if ($data && schema)
              keywords[key] = schemaOrData(schema);
          }
        }
        return metaSchema;
      }
      _removeAllSchemas(schemas, regex) {
        for (const keyRef in schemas) {
          const sch = schemas[keyRef];
          if (!regex || regex.test(keyRef)) {
            if (typeof sch == "string") {
              delete schemas[keyRef];
            } else if (sch && !sch.meta) {
              this._cache.delete(sch.schema);
              delete schemas[keyRef];
            }
          }
        }
      }
      _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id;
        const { schemaId } = this.opts;
        if (typeof schema == "object") {
          id = schema[schemaId];
        } else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          else if (typeof schema != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== void 0)
          return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
          if (baseId)
            this._checkUnique(baseId);
          this.refs[baseId] = sch;
        }
        if (validateSchema)
          this.validateSchema(schema, true);
        return sch;
      }
      _checkUnique(id) {
        if (this.schemas[id] || this.refs[id]) {
          throw new Error(`schema with key or id "${id}" already exists`);
        }
      }
      _compileSchemaEnv(sch) {
        if (sch.meta)
          this._compileMetaSchema(sch);
        else
          compile_1.compileSchema.call(this, sch);
        if (!sch.validate)
          throw new Error("ajv implementation error");
        return sch.validate;
      }
      _compileMetaSchema(sch) {
        const currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
          compile_1.compileSchema.call(this, sch);
        } finally {
          this.opts = currentOpts;
        }
      }
    };
    Ajv.ValidationError = validation_error_1.default;
    Ajv.MissingRefError = ref_error_1.default;
    exports.default = Ajv;
    function checkOptions(checkOpts, options, msg, log = "error") {
      for (const key in checkOpts) {
        const opt = key;
        if (opt in options)
          this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
      }
    }
    function getSchEnv(keyRef) {
      keyRef = (0, resolve_1.normalizeId)(keyRef);
      return this.schemas[keyRef] || this.refs[keyRef];
    }
    function addInitialSchemas() {
      const optsSchemas = this.opts.schemas;
      if (!optsSchemas)
        return;
      if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
      else
        for (const key in optsSchemas)
          this.addSchema(optsSchemas[key], key);
    }
    function addInitialFormats() {
      for (const name in this.opts.formats) {
        const format = this.opts.formats[name];
        if (format)
          this.addFormat(name, format);
      }
    }
    function addInitialKeywords(defs) {
      if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const keyword in defs) {
        const def = defs[keyword];
        if (!def.keyword)
          def.keyword = keyword;
        this.addKeyword(def);
      }
    }
    function getMetaSchemaOptions() {
      const metaOpts = { ...this.opts };
      for (const opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
      return metaOpts;
    }
    var noLogs = { log() {
    }, warn() {
    }, error() {
    } };
    function getLogger(logger) {
      if (logger === false)
        return noLogs;
      if (logger === void 0)
        return console;
      if (logger.log && logger.warn && logger.error)
        return logger;
      throw new Error("logger must implement log, warn and error methods");
    }
    var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
    function checkKeyword(keyword, def) {
      const { RULES } = this;
      (0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
          throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
          throw new Error(`Keyword ${kwd} has invalid name`);
      });
      if (!def)
        return;
      if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
      }
    }
    function addRule(keyword, definition, dataType) {
      var _a;
      const post = definition === null || definition === void 0 ? void 0 : definition.post;
      if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES } = this;
      let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
      if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
      }
      RULES.keywords[keyword] = true;
      if (!definition)
        return;
      const rule = {
        keyword,
        definition: {
          ...definition,
          type: (0, dataType_1.getJSONTypes)(definition.type),
          schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
        }
      };
      if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
      else
        ruleGroup.rules.push(rule);
      RULES.all[keyword] = rule;
      (_a = definition.implements) === null || _a === void 0 ? void 0 : _a.forEach((kwd) => this.addKeyword(kwd));
    }
    function addBeforeRule(ruleGroup, rule, before) {
      const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
      if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
      } else {
        ruleGroup.rules.push(rule);
        this.logger.warn(`rule ${before} is not defined`);
      }
    }
    function keywordMetaschema(def) {
      let { metaSchema } = def;
      if (metaSchema === void 0)
        return;
      if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
      def.validateSchema = this.compile(metaSchema, true);
    }
    var $dataRef = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function schemaOrData(schema) {
      return { anyOf: [schema, $dataRef] };
    }
  }
});

// ../../../node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.callRef = exports.getValidate = void 0;
    var ref_error_1 = require_ref_error();
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var util_1 = require_util2();
    var def = {
      keyword: "$ref",
      schemaType: "string",
      code(cxt) {
        const { gen, schema: $ref, it } = cxt;
        const { baseId, schemaEnv: env, validateName, opts, self } = it;
        const { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
          return callRootRef();
        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === void 0)
          throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
          return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
          if (env === root)
            return callRef(cxt, validateName, env, env.$async);
          const rootName = gen.scopeValue("root", { ref: root });
          return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
        }
        function callValidate(sch) {
          const v = getValidate(cxt, sch);
          callRef(cxt, v, sch, sch.$async);
        }
        function inlineRefSchema(sch) {
          const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
          const valid = gen.name("valid");
          const schCxt = cxt.subschema({
            schema: sch,
            dataTypes: [],
            schemaPath: codegen_1.nil,
            topSchemaRef: schName,
            errSchemaPath: $ref
          }, valid);
          cxt.mergeEvaluated(schCxt);
          cxt.ok(valid);
        }
      }
    };
    function getValidate(cxt, sch) {
      const { gen } = cxt;
      return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
    }
    exports.getValidate = getValidate;
    function callRef(cxt, v, sch, $async) {
      const { gen, it } = cxt;
      const { allErrors, schemaEnv: env, opts } = it;
      const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
      if ($async)
        callAsyncRef();
      else
        callSyncRef();
      function callAsyncRef() {
        if (!env.$async)
          throw new Error("async schema referenced by sync schema");
        const valid = gen.let("valid");
        gen.try(() => {
          gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
          addEvaluatedFrom(v);
          if (!allErrors)
            gen.assign(valid, true);
        }, (e) => {
          gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
          addErrorsFrom(e);
          if (!allErrors)
            gen.assign(valid, false);
        });
        cxt.ok(valid);
      }
      function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
      }
      function addErrorsFrom(source) {
        const errs = (0, codegen_1._)`${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
        gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      }
      function addEvaluatedFrom(source) {
        var _a;
        if (!it.opts.unevaluated)
          return;
        const schEvaluated = (_a = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a === void 0 ? void 0 : _a.evaluated;
        if (it.props !== true) {
          if (schEvaluated && !schEvaluated.dynamicProps) {
            if (schEvaluated.props !== void 0) {
              it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
            }
          } else {
            const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
            it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
          }
        }
        if (it.items !== true) {
          if (schEvaluated && !schEvaluated.dynamicItems) {
            if (schEvaluated.items !== void 0) {
              it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
            }
          } else {
            const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
            it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
          }
        }
      }
    }
    exports.callRef = callRef;
    exports.default = def;
  }
});

// ../../../node_modules/ajv-draft-04/dist/vocabulary/core.js
var require_core2 = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/vocabulary/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ref_1 = require_ref();
    var core = [
      "$schema",
      "id",
      "$defs",
      { keyword: "$comment" },
      "definitions",
      ref_1.default
    ];
    exports.default = core;
  }
});

// ../../../node_modules/ajv-draft-04/dist/vocabulary/validation/limitNumber.js
var require_limitNumber = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/vocabulary/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core();
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      maximum: {
        exclusive: "exclusiveMaximum",
        ops: [
          { okStr: "<=", ok: ops.LTE, fail: ops.GT },
          { okStr: "<", ok: ops.LT, fail: ops.GTE }
        ]
      },
      minimum: {
        exclusive: "exclusiveMinimum",
        ops: [
          { okStr: ">=", ok: ops.GTE, fail: ops.LT },
          { okStr: ">", ok: ops.GT, fail: ops.LTE }
        ]
      }
    };
    var error = {
      message: (cxt) => core_1.str`must be ${kwdOp(cxt).okStr} ${cxt.schemaCode}`,
      params: (cxt) => core_1._`{comparison: ${kwdOp(cxt).okStr}, limit: ${cxt.schemaCode}}`
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { data, schemaCode } = cxt;
        cxt.fail$data(core_1._`${data} ${kwdOp(cxt).fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    function kwdOp(cxt) {
      var _a;
      const keyword = cxt.keyword;
      const opsIdx = ((_a = cxt.parentSchema) === null || _a === void 0 ? void 0 : _a[KWDs[keyword].exclusive]) ? 1 : 0;
      return KWDs[keyword].ops[opsIdx];
    }
    exports.default = def;
  }
});

// ../../../node_modules/ajv-draft-04/dist/vocabulary/validation/limitNumberExclusive.js
var require_limitNumberExclusive = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/vocabulary/validation/limitNumberExclusive.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KWDs = {
      exclusiveMaximum: "maximum",
      exclusiveMinimum: "minimum"
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "boolean",
      code({ keyword, parentSchema }) {
        const limitKwd = KWDs[keyword];
        if (parentSchema[limitKwd] === void 0) {
          throw new Error(`${keyword} can only be used with ${limitKwd}`);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
      params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
    };
    var def = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "../../../node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var ucs2length_1 = require_ucs2length();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
    };
    var def = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: true,
      error,
      code(cxt) {
        const { data, $data, schema, schemaCode, it } = cxt;
        const u = it.opts.unicodeRegExp ? "u" : "";
        const regExp = $data ? (0, codegen_1._)`(new RegExp(${schemaCode}, ${u}))` : (0, code_1.usePattern)(cxt, schema);
        cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
      params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
    };
    var def = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, schema, schemaCode, data, $data, it } = cxt;
        const { opts } = it;
        if (!$data && schema.length === 0)
          return;
        const useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
          allErrorsMode();
        else
          exitOnErrorMode();
        if (opts.strictRequired) {
          const props = cxt.parentSchema.properties;
          const { definedProperties } = cxt.it;
          for (const requiredKey of schema) {
            if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
              const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
              const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
              (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
            }
          }
        }
        function allErrorsMode() {
          if (useLoop || $data) {
            cxt.block$data(codegen_1.nil, loopAllRequired);
          } else {
            for (const prop of schema) {
              (0, code_1.checkReportMissingProp)(cxt, prop);
            }
          }
        }
        function exitOnErrorMode() {
          const missing = gen.let("missing");
          if (useLoop || $data) {
            const valid = gen.let("valid", true);
            cxt.block$data(valid, () => loopUntilMissing(missing, valid));
            cxt.ok(valid);
          } else {
            gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
          }
        }
        function loopAllRequired() {
          gen.forOf("prop", schemaCode, (prop) => {
            cxt.setParams({ missingProperty: prop });
            gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
          });
        }
        function loopUntilMissing(missing, valid) {
          cxt.setParams({ missingProperty: missing });
          gen.forOf(missing, schemaCode, () => {
            gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.error();
              gen.break();
            });
          }, codegen_1.nil);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "../../../node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dataType_1 = require_dataType();
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var equal_1 = require_equal();
    var error = {
      message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
      params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
    };
    var def = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
          return;
        const valid = gen.let("valid");
        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
        cxt.ok(valid);
        function validateUniqueItems() {
          const i = gen.let("i", (0, codegen_1._)`${data}.length`);
          const j = gen.let("j");
          cxt.setParams({ i, j });
          gen.assign(valid, true);
          gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        function canOptimize() {
          return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        function loopN(i, j) {
          const item = gen.name("item");
          const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
          const indices = gen.const("indices", (0, codegen_1._)`{}`);
          gen.for((0, codegen_1._)`;${i}--;`, () => {
            gen.let(item, (0, codegen_1._)`${data}[${i}]`);
            gen.if(wrongType, (0, codegen_1._)`continue`);
            if (itemTypes.length > 1)
              gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
            gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
              gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
              cxt.error();
              gen.assign(valid, false).break();
            }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
          });
        }
        function loopN2(i, j) {
          const eql = (0, util_1.useFunc)(gen, equal_1.default);
          const outer = gen.name("outer");
          gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error();
            gen.assign(valid, false).break(outer);
          })));
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to constant",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
    };
    var def = {
      keyword: "const",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || schema && typeof schema == "object") {
          cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
        } else {
          cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var equal_1 = require_equal();
    var error = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
    };
    var def = {
      keyword: "enum",
      schemaType: "array",
      $data: true,
      error,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
          throw new Error("enum must have non-empty array");
        const useLoop = schema.length >= it.opts.loopEnum;
        let eql;
        const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
        let valid;
        if (useLoop || $data) {
          valid = gen.let("valid");
          cxt.block$data(valid, loopEnum);
        } else {
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          const vSchema = gen.const("vSchema", schemaCode);
          valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
          gen.assign(valid, false);
          gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
        }
        function equalCode(vSchema, i) {
          const sch = schema[i];
          return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv-draft-04/dist/vocabulary/validation/index.js
var require_validation = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/vocabulary/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var limitNumber_1 = require_limitNumber();
    var limitNumberExclusive_1 = require_limitNumberExclusive();
    var multipleOf_1 = require_multipleOf();
    var limitLength_1 = require_limitLength();
    var pattern_1 = require_pattern();
    var limitProperties_1 = require_limitProperties();
    var required_1 = require_required();
    var limitItems_1 = require_limitItems();
    var uniqueItems_1 = require_uniqueItems();
    var const_1 = require_const();
    var enum_1 = require_enum();
    var validation = [
      // number
      limitNumber_1.default,
      limitNumberExclusive_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAdditionalItems = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
          (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
          return;
        }
        validateAdditionalItems(cxt, items);
      }
    };
    function validateAdditionalItems(cxt, items) {
      const { gen, schema, data, keyword, it } = cxt;
      it.items = true;
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
      } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
        cxt.ok(valid);
      }
      function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
          cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
          if (!it.allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
    }
    exports.validateAdditionalItems = validateAdditionalItems;
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateTuple = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var code_1 = require_code2();
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(cxt) {
        const { schema, it } = cxt;
        if (Array.isArray(schema))
          return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    function validateTuple(cxt, extraItems, schArr = cxt.schema) {
      const { gen, parentSchema, data, keyword, it } = cxt;
      checkStrictTuple(parentSchema);
      if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
      }
      const valid = gen.name("valid");
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      schArr.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
          keyword,
          schemaProp: i,
          dataProp: i
        }, valid));
        cxt.ok(valid);
      });
      function checkStrictTuple(sch) {
        const { opts, errSchemaPath } = it;
        const l = schArr.length;
        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
          const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
          (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
      }
    }
    exports.validateTuple = validateTuple;
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var items_1 = require_items();
    var def = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var code_1 = require_code2();
    var additionalItems_1 = require_additionalItems();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error,
      code(cxt) {
        const { schema, parentSchema, it } = cxt;
        const { prefixItems } = parentSchema;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        if (prefixItems)
          (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
          cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
      params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
    };
    var def = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        let min;
        let max;
        const { minContains, maxContains } = parentSchema;
        if (it.opts.next) {
          min = minContains === void 0 ? 1 : minContains;
          max = maxContains;
        } else {
          min = 1;
        }
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        cxt.setParams({ min, max });
        if (max === void 0 && min === 0) {
          (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
          return;
        }
        if (max !== void 0 && min > max) {
          (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
          cxt.fail();
          return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          let cond = (0, codegen_1._)`${len} >= ${min}`;
          if (max !== void 0)
            cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
          cxt.pass(cond);
          return;
        }
        it.items = true;
        const valid = gen.name("valid");
        if (max === void 0 && min === 1) {
          validateItems(valid, () => gen.if(valid, () => gen.break()));
        } else if (min === 0) {
          gen.let(valid, true);
          if (max !== void 0)
            gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
        } else {
          gen.let(valid, false);
          validateItemsWithCount();
        }
        cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
          const schValid = gen.name("_valid");
          const count = gen.let("count", 0);
          validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        function validateItems(_valid, block) {
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword: "contains",
              dataProp: i,
              dataPropType: util_1.Type.Num,
              compositeRule: true
            }, _valid);
            block();
          });
        }
        function checkLimits(count) {
          gen.code((0, codegen_1._)`${count}++`);
          if (max === void 0) {
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
          } else {
            gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
            if (min === 1)
              gen.assign(valid, true);
            else
              gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
          }
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var code_1 = require_code2();
    exports.error = {
      message: ({ params: { property, depsCount, deps } }) => {
        const property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
      },
      params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
      // TODO change to reference
    };
    var def = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: exports.error,
      code(cxt) {
        const [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
      }
    };
    function splitDependencies({ schema }) {
      const propertyDeps = {};
      const schemaDeps = {};
      for (const key in schema) {
        if (key === "__proto__")
          continue;
        const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
        deps[key] = schema[key];
      }
      return [propertyDeps, schemaDeps];
    }
    function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
      const { gen, data, it } = cxt;
      if (Object.keys(propertyDeps).length === 0)
        return;
      const missing = gen.let("missing");
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop];
        if (deps.length === 0)
          continue;
        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", ")
        });
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              (0, code_1.checkReportMissingProp)(cxt, depProp);
            }
          });
        } else {
          gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
    }
    exports.validatePropertyDeps = validatePropertyDeps;
    function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      for (const prop in schemaDeps) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
          continue;
        gen.if(
          (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
          () => {
            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
          },
          () => gen.var(valid, true)
          // TODO var
        );
        cxt.ok(valid);
      }
    }
    exports.validateSchemaDeps = validateSchemaDeps;
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: "property name must be valid",
      params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
    };
    var def = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        const valid = gen.name("valid");
        gen.forIn("key", data, (key) => {
          cxt.setParams({ propertyName: key });
          cxt.subschema({
            keyword: "propertyNames",
            data: key,
            dataTypes: ["string"],
            propertyName: key,
            compositeRule: true
          }, valid);
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error(true);
            if (!it.allErrors)
              gen.break();
          });
        });
        cxt.ok(valid);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var util_1 = require_util2();
    var error = {
      message: "must NOT have additional properties",
      params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
    };
    var def = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: true,
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, opts } = it;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
          return;
        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
          gen.forIn("key", data, (key) => {
            if (!props.length && !patProps.length)
              additionalPropertyCode(key);
            else
              gen.if(isAdditional(key), () => additionalPropertyCode(key));
          });
        }
        function isAdditional(key) {
          let definedProp;
          if (props.length > 8) {
            const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
            definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
          } else if (props.length) {
            definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
          } else {
            definedProp = codegen_1.nil;
          }
          if (patProps.length) {
            definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
          }
          return (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key) {
          gen.code((0, codegen_1._)`delete ${data}[${key}]`);
        }
        function additionalPropertyCode(key) {
          if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
            deleteAdditional(key);
            return;
          }
          if (schema === false) {
            cxt.setParams({ additionalProperty: key });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            if (opts.removeAdditional === "failing") {
              applyAdditionalSchema(key, valid, false);
              gen.if((0, codegen_1.not)(valid), () => {
                cxt.reset();
                deleteAdditional(key);
              });
            } else {
              applyAdditionalSchema(key, valid);
              if (!allErrors)
                gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          }
        }
        function applyAdditionalSchema(key, valid, errors) {
          const subschema = {
            keyword: "additionalProperties",
            dataProp: key,
            dataPropType: util_1.Type.Str
          };
          if (errors === false) {
            Object.assign(subschema, {
              compositeRule: true,
              createErrors: false,
              allErrors: false
            });
          }
          cxt.subschema(subschema, valid);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var validate_1 = require_validate();
    var code_1 = require_code2();
    var util_1 = require_util2();
    var additionalProperties_1 = require_additionalProperties();
    var def = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
          additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        }
        const allProps = (0, code_1.allSchemaProperties)(schema);
        for (const prop of allProps) {
          it.definedProperties.add(prop);
        }
        if (it.opts.unevaluated && allProps.length && it.props !== true) {
          it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
        }
        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
          return;
        const valid = gen.name("valid");
        for (const prop of properties) {
          if (hasDefault(prop)) {
            applyPropertySchema(prop);
          } else {
            gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
            applyPropertySchema(prop);
            if (!it.allErrors)
              gen.else().var(valid, true);
            gen.endIf();
          }
          cxt.it.definedProperties.add(prop);
          cxt.ok(valid);
        }
        function hasDefault(prop) {
          return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
        }
        function applyPropertySchema(prop) {
          cxt.subschema({
            keyword: "properties",
            schemaProp: prop,
            dataProp: prop
          }, valid);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var util_2 = require_util2();
    var def = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, data, parentSchema, it } = cxt;
        const { opts } = it;
        const patterns = (0, code_1.allSchemaProperties)(schema);
        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
          return;
        }
        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        const valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
          it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        const { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
          for (const pat of patterns) {
            if (checkProperties)
              checkMatchingProperties(pat);
            if (it.allErrors) {
              validateProperties(pat);
            } else {
              gen.var(valid, true);
              validateProperties(pat);
              gen.if(valid);
            }
          }
        }
        function checkMatchingProperties(pat) {
          for (const prop in checkProperties) {
            if (new RegExp(pat).test(prop)) {
              (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
            }
          }
        }
        function validateProperties(pat) {
          gen.forIn("key", data, (key) => {
            gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
              const alwaysValid = alwaysValidPatterns.includes(pat);
              if (!alwaysValid) {
                cxt.subschema({
                  keyword: "patternProperties",
                  schemaProp: pat,
                  dataProp: key,
                  dataPropType: util_2.Type.Str
                }, valid);
              }
              if (it.opts.unevaluated && props !== true) {
                gen.assign((0, codegen_1._)`${props}[${key}]`, true);
              } else if (!alwaysValid && !it.allErrors) {
                gen.if((0, codegen_1.not)(valid), () => gen.break());
              }
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util2();
    var def = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      code(cxt) {
        const { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          cxt.fail();
          return;
        }
        const valid = gen.name("valid");
        cxt.subschema({
          keyword: "not",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, valid);
        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
      },
      error: { message: "must NOT be valid" }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var def = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: true,
      code: code_1.validateUnion,
      error: { message: "must match a schema in anyOf" }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: "must match exactly one schema in oneOf",
      params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
    };
    var def = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, parentSchema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
          return;
        const schArr = schema;
        const valid = gen.let("valid", false);
        const passing = gen.let("passing", null);
        const schValid = gen.name("_valid");
        cxt.setParams({ passing });
        gen.block(validateOneOf);
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
        function validateOneOf() {
          schArr.forEach((sch, i) => {
            let schCxt;
            if ((0, util_1.alwaysValidSchema)(it, sch)) {
              gen.var(schValid, true);
            } else {
              schCxt = cxt.subschema({
                keyword: "oneOf",
                schemaProp: i,
                compositeRule: true
              }, schValid);
            }
            if (i > 0) {
              gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
            }
            gen.if(schValid, () => {
              gen.assign(valid, true);
              gen.assign(passing, i);
              if (schCxt)
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util2();
    var def = {
      keyword: "allOf",
      schemaType: "array",
      code(cxt) {
        const { gen, schema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const valid = gen.name("valid");
        schema.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
          cxt.ok(valid);
          cxt.mergeEvaluated(schCxt);
        });
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
      params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
    };
    var def = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, parentSchema, it } = cxt;
        if (parentSchema.then === void 0 && parentSchema.else === void 0) {
          (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        const hasThen = hasSchema(it, "then");
        const hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
          return;
        const valid = gen.let("valid", true);
        const schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
          const ifClause = gen.let("ifClause");
          cxt.setParams({ ifClause });
          gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        } else if (hasThen) {
          gen.if(schValid, validateClause("then"));
        } else {
          gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, () => cxt.error(true));
        function validateIf() {
          const schCxt = cxt.subschema({
            keyword: "if",
            compositeRule: true,
            createErrors: false,
            allErrors: false
          }, schValid);
          cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
          return () => {
            const schCxt = cxt.subschema({ keyword }, schValid);
            gen.assign(valid, schValid);
            cxt.mergeValidEvaluated(schCxt, valid);
            if (ifClause)
              gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
            else
              cxt.setParams({ ifClause: keyword });
          };
        }
      }
    };
    function hasSchema(it, keyword) {
      const schema = it.schema[keyword];
      return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
    }
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util2();
    var def = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword, parentSchema, it }) {
        if (parentSchema.if === void 0)
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var additionalItems_1 = require_additionalItems();
    var prefixItems_1 = require_prefixItems();
    var items_1 = require_items();
    var items2020_1 = require_items2020();
    var contains_1 = require_contains();
    var dependencies_1 = require_dependencies();
    var propertyNames_1 = require_propertyNames();
    var additionalProperties_1 = require_additionalProperties();
    var properties_1 = require_properties();
    var patternProperties_1 = require_patternProperties();
    var not_1 = require_not();
    var anyOf_1 = require_anyOf();
    var oneOf_1 = require_oneOf();
    var allOf_1 = require_allOf();
    var if_1 = require_if();
    var thenElse_1 = require_thenElse();
    function getApplicator(draft2020 = false) {
      const applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default
      ];
      if (draft2020)
        applicator.push(prefixItems_1.default, items2020_1.default);
      else
        applicator.push(additionalItems_1.default, items_1.default);
      applicator.push(contains_1.default);
      return applicator;
    }
    exports.default = getApplicator;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
    };
    var def = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: true,
      error,
      code(cxt, ruleType) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
          return;
        if ($data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
          const fType = gen.let("fType");
          const format = gen.let("format");
          gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
          cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
          function unknownFmt() {
            if (opts.strictSchema === false)
              return codegen_1.nil;
            return (0, codegen_1._)`${schemaCode} && !${format}`;
          }
          function invalidFmt() {
            const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
            const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
            return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
          }
        }
        function validateFormat() {
          const formatDef = self.formats[schema];
          if (!formatDef) {
            unknownFormat();
            return;
          }
          if (formatDef === true)
            return;
          const [fmtType, format, fmtRef] = getFormat(formatDef);
          if (fmtType === ruleType)
            cxt.pass(validCondition());
          function unknownFormat() {
            if (opts.strictSchema === false) {
              self.logger.warn(unknownMsg());
              return;
            }
            throw new Error(unknownMsg());
            function unknownMsg() {
              return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
            }
          }
          function getFormat(fmtDef) {
            const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
            const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
            if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
              return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
            }
            return ["string", fmtDef, fmt];
          }
          function validCondition() {
            if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
              if (!schemaEnv.$async)
                throw new Error("async format in sync schema");
              return (0, codegen_1._)`await ${fmtRef}(${data})`;
            }
            return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
          }
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = require_format();
    var format = [format_1.default];
    exports.default = format;
  }
});

// ../../../node_modules/ajv-draft-04/dist/vocabulary/draft4.js
var require_draft4 = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/vocabulary/draft4.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core2();
    var validation_1 = require_validation();
    var applicator_1 = require_applicator();
    var format_1 = require_format2();
    var metadataVocabulary = ["title", "description", "default"];
    var draft4Vocabularies = [
      core_1.default,
      validation_1.default,
      applicator_1.default(),
      format_1.default,
      metadataVocabulary
    ];
    exports.default = draft4Vocabularies;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types2 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscrError = void 0;
    var DiscrError;
    (function(DiscrError2) {
      DiscrError2["Tag"] = "tag";
      DiscrError2["Mapping"] = "mapping";
    })(DiscrError || (exports.DiscrError = DiscrError = {}));
  }
});

// ../../../node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var types_1 = require_types2();
    var compile_1 = require_compile();
    var ref_error_1 = require_ref_error();
    var util_1 = require_util2();
    var error = {
      message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
      params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
    };
    var def = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error,
      code(cxt) {
        const { gen, data, schema, parentSchema, it } = cxt;
        const { oneOf } = parentSchema;
        if (!it.opts.discriminator) {
          throw new Error("discriminator: requires discriminator option");
        }
        const tagName = schema.propertyName;
        if (typeof tagName != "string")
          throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
          throw new Error("discriminator: requires oneOf keyword");
        const valid = gen.let("valid", false);
        const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
        cxt.ok(valid);
        function validateMapping() {
          const mapping = getMapping();
          gen.if(false);
          for (const tagValue in mapping) {
            gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
            gen.assign(valid, applyTagSchema(mapping[tagValue]));
          }
          gen.else();
          cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
          gen.endIf();
        }
        function applyTagSchema(schemaProp) {
          const _valid = gen.name("valid");
          const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
          cxt.mergeEvaluated(schCxt, codegen_1.Name);
          return _valid;
        }
        function getMapping() {
          var _a;
          const oneOfMapping = {};
          const topRequired = hasRequired(parentSchema);
          let tagRequired = true;
          for (let i = 0; i < oneOf.length; i++) {
            let sch = oneOf[i];
            if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
              const ref = sch.$ref;
              sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
              if (sch instanceof compile_1.SchemaEnv)
                sch = sch.schema;
              if (sch === void 0)
                throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
            }
            const propSch = (_a = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a === void 0 ? void 0 : _a[tagName];
            if (typeof propSch != "object") {
              throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
            }
            tagRequired = tagRequired && (topRequired || hasRequired(sch));
            addMappings(propSch, i);
          }
          if (!tagRequired)
            throw new Error(`discriminator: "${tagName}" must be required`);
          return oneOfMapping;
          function hasRequired({ required }) {
            return Array.isArray(required) && required.includes(tagName);
          }
          function addMappings(sch, i) {
            if (sch.const) {
              addMapping(sch.const, i);
            } else if (sch.enum) {
              for (const tagValue of sch.enum) {
                addMapping(tagValue, i);
              }
            } else {
              throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
            }
          }
          function addMapping(tagValue, i) {
            if (typeof tagValue != "string" || tagValue in oneOfMapping) {
              throw new Error(`discriminator: "${tagName}" values must be unique strings`);
            }
            oneOfMapping[tagValue] = i;
          }
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv-draft-04/dist/refs/json-schema-draft-04.json
var require_json_schema_draft_04 = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/refs/json-schema-draft-04.json"(exports, module) {
    module.exports = {
      id: "http://json-schema.org/draft-04/schema#",
      $schema: "http://json-schema.org/draft-04/schema#",
      description: "Core schema meta-schema",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $ref: "#" }
        },
        positiveInteger: {
          type: "integer",
          minimum: 0
        },
        positiveIntegerDefault0: {
          allOf: [{ $ref: "#/definitions/positiveInteger" }, { default: 0 }]
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          uniqueItems: true
        }
      },
      type: "object",
      properties: {
        id: {
          type: "string",
          format: "uri"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: {},
        multipleOf: {
          type: "number",
          minimum: 0,
          exclusiveMinimum: true
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "boolean",
          default: false
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "boolean",
          default: false
        },
        maxLength: { $ref: "#/definitions/positiveInteger" },
        minLength: { $ref: "#/definitions/positiveIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: {
          anyOf: [{ type: "boolean" }, { $ref: "#" }],
          default: {}
        },
        items: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
          default: {}
        },
        maxItems: { $ref: "#/definitions/positiveInteger" },
        minItems: { $ref: "#/definitions/positiveIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        maxProperties: { $ref: "#/definitions/positiveInteger" },
        minProperties: { $ref: "#/definitions/positiveIntegerDefault0" },
        required: { $ref: "#/definitions/stringArray" },
        additionalProperties: {
          anyOf: [{ type: "boolean" }, { $ref: "#" }],
          default: {}
        },
        definitions: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
          }
        },
        enum: {
          type: "array",
          minItems: 1,
          uniqueItems: true
        },
        type: {
          anyOf: [
            { $ref: "#/definitions/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/definitions/simpleTypes" },
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        allOf: { $ref: "#/definitions/schemaArray" },
        anyOf: { $ref: "#/definitions/schemaArray" },
        oneOf: { $ref: "#/definitions/schemaArray" },
        not: { $ref: "#" }
      },
      dependencies: {
        exclusiveMaximum: ["maximum"],
        exclusiveMinimum: ["minimum"]
      },
      default: {}
    };
  }
});

// ../../../node_modules/ajv-draft-04/dist/index.js
var require_dist = __commonJS({
  "../../../node_modules/ajv-draft-04/dist/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var core_1 = require_core();
    var draft4_1 = require_draft4();
    var discriminator_1 = require_discriminator();
    var draft4MetaSchema = require_json_schema_draft_04();
    var META_SUPPORT_DATA = ["/properties"];
    var META_SCHEMA_ID = "http://json-schema.org/draft-04/schema";
    var Ajv = class extends core_1.default {
      constructor(opts = {}) {
        super({
          ...opts,
          schemaId: "id"
        });
      }
      _addVocabularies() {
        super._addVocabularies();
        draft4_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
          this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        if (!this.opts.meta)
          return;
        const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft4MetaSchema, META_SUPPORT_DATA) : draft4MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    module.exports = exports = Ajv;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Ajv;
    var core_2 = require_core();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return core_2.KeywordCxt;
    } });
    var core_3 = require_core();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return core_3._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return core_3.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return core_3.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return core_3.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return core_3.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return core_3.CodeGen;
    } });
  }
});

// ../../../node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var def = {
      keyword: "id",
      code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/core/index.js
var require_core3 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id_1 = require_id();
    var ref_1 = require_ref();
    var core = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      id_1.default,
      ref_1.default
    ];
    exports.default = core;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber2 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: true,
      error,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation2 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var limitNumber_1 = require_limitNumber2();
    var multipleOf_1 = require_multipleOf();
    var limitLength_1 = require_limitLength();
    var pattern_1 = require_pattern();
    var limitProperties_1 = require_limitProperties();
    var required_1 = require_required();
    var limitItems_1 = require_limitItems();
    var uniqueItems_1 = require_uniqueItems();
    var const_1 = require_const();
    var enum_1 = require_enum();
    var validation = [
      // number
      limitNumber_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/dynamic/dynamicAnchor.js
var require_dynamicAnchor = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/dynamic/dynamicAnchor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dynamicAnchor = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var ref_1 = require_ref();
    var def = {
      keyword: "$dynamicAnchor",
      schemaType: "string",
      code: (cxt) => dynamicAnchor(cxt, cxt.schema)
    };
    function dynamicAnchor(cxt, anchor) {
      const { gen, it } = cxt;
      it.schemaEnv.root.dynamicAnchors[anchor] = true;
      const v = (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`;
      const validate = it.errSchemaPath === "#" ? it.validateName : _getValidate(cxt);
      gen.if((0, codegen_1._)`!${v}`, () => gen.assign(v, validate));
    }
    exports.dynamicAnchor = dynamicAnchor;
    function _getValidate(cxt) {
      const { schemaEnv, schema, self } = cxt.it;
      const { root, baseId, localRefs, meta } = schemaEnv.root;
      const { schemaId } = self.opts;
      const sch = new compile_1.SchemaEnv({ schema, schemaId, root, baseId, localRefs, meta });
      compile_1.compileSchema.call(self, sch);
      return (0, ref_1.getValidate)(cxt, sch);
    }
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/dynamic/dynamicRef.js
var require_dynamicRef = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/dynamic/dynamicRef.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dynamicRef = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var ref_1 = require_ref();
    var def = {
      keyword: "$dynamicRef",
      schemaType: "string",
      code: (cxt) => dynamicRef(cxt, cxt.schema)
    };
    function dynamicRef(cxt, ref) {
      const { gen, keyword, it } = cxt;
      if (ref[0] !== "#")
        throw new Error(`"${keyword}" only supports hash fragment reference`);
      const anchor = ref.slice(1);
      if (it.allErrors) {
        _dynamicRef();
      } else {
        const valid = gen.let("valid", false);
        _dynamicRef(valid);
        cxt.ok(valid);
      }
      function _dynamicRef(valid) {
        if (it.schemaEnv.root.dynamicAnchors[anchor]) {
          const v = gen.let("_v", (0, codegen_1._)`${names_1.default.dynamicAnchors}${(0, codegen_1.getProperty)(anchor)}`);
          gen.if(v, _callRef(v, valid), _callRef(it.validateName, valid));
        } else {
          _callRef(it.validateName, valid)();
        }
      }
      function _callRef(validate, valid) {
        return valid ? () => gen.block(() => {
          (0, ref_1.callRef)(cxt, validate);
          gen.let(valid, true);
        }) : () => (0, ref_1.callRef)(cxt, validate);
      }
    }
    exports.dynamicRef = dynamicRef;
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/dynamic/recursiveAnchor.js
var require_recursiveAnchor = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/dynamic/recursiveAnchor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicAnchor_1 = require_dynamicAnchor();
    var util_1 = require_util2();
    var def = {
      keyword: "$recursiveAnchor",
      schemaType: "boolean",
      code(cxt) {
        if (cxt.schema)
          (0, dynamicAnchor_1.dynamicAnchor)(cxt, "");
        else
          (0, util_1.checkStrictMode)(cxt.it, "$recursiveAnchor: false is ignored");
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/dynamic/recursiveRef.js
var require_recursiveRef = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/dynamic/recursiveRef.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicRef_1 = require_dynamicRef();
    var def = {
      keyword: "$recursiveRef",
      schemaType: "string",
      code: (cxt) => (0, dynamicRef_1.dynamicRef)(cxt, cxt.schema)
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/dynamic/index.js
var require_dynamic = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/dynamic/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dynamicAnchor_1 = require_dynamicAnchor();
    var dynamicRef_1 = require_dynamicRef();
    var recursiveAnchor_1 = require_recursiveAnchor();
    var recursiveRef_1 = require_recursiveRef();
    var dynamic = [dynamicAnchor_1.default, dynamicRef_1.default, recursiveAnchor_1.default, recursiveRef_1.default];
    exports.default = dynamic;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/dependentRequired.js
var require_dependentRequired = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/dependentRequired.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dependencies_1 = require_dependencies();
    var def = {
      keyword: "dependentRequired",
      type: "object",
      schemaType: "object",
      error: dependencies_1.error,
      code: (cxt) => (0, dependencies_1.validatePropertyDeps)(cxt)
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/applicator/dependentSchemas.js
var require_dependentSchemas = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/applicator/dependentSchemas.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dependencies_1 = require_dependencies();
    var def = {
      keyword: "dependentSchemas",
      type: "object",
      schemaType: "object",
      code: (cxt) => (0, dependencies_1.validateSchemaDeps)(cxt)
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/validation/limitContains.js
var require_limitContains = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/validation/limitContains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util2();
    var def = {
      keyword: ["maxContains", "minContains"],
      type: "array",
      schemaType: "number",
      code({ keyword, parentSchema, it }) {
        if (parentSchema.contains === void 0) {
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "contains" is ignored`);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/next.js
var require_next = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/next.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dependentRequired_1 = require_dependentRequired();
    var dependentSchemas_1 = require_dependentSchemas();
    var limitContains_1 = require_limitContains();
    var next = [dependentRequired_1.default, dependentSchemas_1.default, limitContains_1.default];
    exports.default = next;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedProperties.js
var require_unevaluatedProperties = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var names_1 = require_names();
    var error = {
      message: "must NOT have unevaluated properties",
      params: ({ params }) => (0, codegen_1._)`{unevaluatedProperty: ${params.unevaluatedProperty}}`
    };
    var def = {
      keyword: "unevaluatedProperties",
      type: "object",
      schemaType: ["boolean", "object"],
      trackErrors: true,
      error,
      code(cxt) {
        const { gen, schema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, props } = it;
        if (props instanceof codegen_1.Name) {
          gen.if((0, codegen_1._)`${props} !== true`, () => gen.forIn("key", data, (key) => gen.if(unevaluatedDynamic(props, key), () => unevaluatedPropCode(key))));
        } else if (props !== true) {
          gen.forIn("key", data, (key) => props === void 0 ? unevaluatedPropCode(key) : gen.if(unevaluatedStatic(props, key), () => unevaluatedPropCode(key)));
        }
        it.props = true;
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function unevaluatedPropCode(key) {
          if (schema === false) {
            cxt.setParams({ unevaluatedProperty: key });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (!(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            cxt.subschema({
              keyword: "unevaluatedProperties",
              dataProp: key,
              dataPropType: util_1.Type.Str
            }, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
        function unevaluatedDynamic(evaluatedProps, key) {
          return (0, codegen_1._)`!${evaluatedProps} || !${evaluatedProps}[${key}]`;
        }
        function unevaluatedStatic(evaluatedProps, key) {
          const ps = [];
          for (const p in evaluatedProps) {
            if (evaluatedProps[p] === true)
              ps.push((0, codegen_1._)`${key} !== ${p}`);
          }
          return (0, codegen_1.and)(...ps);
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedItems.js
var require_unevaluatedItems = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/unevaluated/unevaluatedItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util2();
    var error = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "unevaluatedItems",
      type: "array",
      schemaType: ["boolean", "object"],
      error,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        const items = it.items || 0;
        if (items === true)
          return;
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        if (schema === false) {
          cxt.setParams({ len: items });
          cxt.fail((0, codegen_1._)`${len} > ${items}`);
        } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items}`);
          gen.if((0, codegen_1.not)(valid), () => validateItems(valid, items));
          cxt.ok(valid);
        }
        it.items = true;
        function validateItems(valid, from) {
          gen.forRange("i", from, len, (i) => {
            cxt.subschema({ keyword: "unevaluatedItems", dataProp: i, dataPropType: util_1.Type.Num }, valid);
            if (!it.allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          });
        }
      }
    };
    exports.default = def;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/unevaluated/index.js
var require_unevaluated = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/unevaluated/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var unevaluatedProperties_1 = require_unevaluatedProperties();
    var unevaluatedItems_1 = require_unevaluatedItems();
    var unevaluated = [unevaluatedProperties_1.default, unevaluatedItems_1.default];
    exports.default = unevaluated;
  }
});

// ../../../node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentVocabulary = exports.metadataVocabulary = void 0;
    exports.metadataVocabulary = [
      "title",
      "description",
      "default",
      "deprecated",
      "readOnly",
      "writeOnly",
      "examples"
    ];
    exports.contentVocabulary = [
      "contentMediaType",
      "contentEncoding",
      "contentSchema"
    ];
  }
});

// ../../../node_modules/ajv/dist/vocabularies/draft2020.js
var require_draft2020 = __commonJS({
  "../../../node_modules/ajv/dist/vocabularies/draft2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core3();
    var validation_1 = require_validation2();
    var applicator_1 = require_applicator();
    var dynamic_1 = require_dynamic();
    var next_1 = require_next();
    var unevaluated_1 = require_unevaluated();
    var format_1 = require_format2();
    var metadata_1 = require_metadata();
    var draft2020Vocabularies = [
      dynamic_1.default,
      core_1.default,
      validation_1.default,
      (0, applicator_1.default)(true),
      format_1.default,
      metadata_1.metadataVocabulary,
      metadata_1.contentVocabulary,
      next_1.default,
      unevaluated_1.default
    ];
    exports.default = draft2020Vocabularies;
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/schema.json
var require_schema = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/schema.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/schema",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/core": true,
        "https://json-schema.org/draft/2020-12/vocab/applicator": true,
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
        "https://json-schema.org/draft/2020-12/vocab/validation": true,
        "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
        "https://json-schema.org/draft/2020-12/vocab/content": true
      },
      $dynamicAnchor: "meta",
      title: "Core and Validation specifications meta-schema",
      allOf: [
        { $ref: "meta/core" },
        { $ref: "meta/applicator" },
        { $ref: "meta/unevaluated" },
        { $ref: "meta/validation" },
        { $ref: "meta/meta-data" },
        { $ref: "meta/format-annotation" },
        { $ref: "meta/content" }
      ],
      type: ["object", "boolean"],
      $comment: "This meta-schema also defines keywords that have appeared in previous drafts in order to prevent incompatible extensions as they remain in common use.",
      properties: {
        definitions: {
          $comment: '"definitions" has been replaced by "$defs".',
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          deprecated: true,
          default: {}
        },
        dependencies: {
          $comment: '"dependencies" has been split and replaced by "dependentSchemas" and "dependentRequired" in order to serve their differing semantics.',
          type: "object",
          additionalProperties: {
            anyOf: [{ $dynamicRef: "#meta" }, { $ref: "meta/validation#/$defs/stringArray" }]
          },
          deprecated: true,
          default: {}
        },
        $recursiveAnchor: {
          $comment: '"$recursiveAnchor" has been replaced by "$dynamicAnchor".',
          $ref: "meta/core#/$defs/anchorString",
          deprecated: true
        },
        $recursiveRef: {
          $comment: '"$recursiveRef" has been replaced by "$dynamicRef".',
          $ref: "meta/core#/$defs/uriReferenceString",
          deprecated: true
        }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/applicator.json
var require_applicator2 = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/applicator.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/applicator",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/applicator": true
      },
      $dynamicAnchor: "meta",
      title: "Applicator vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        prefixItems: { $ref: "#/$defs/schemaArray" },
        items: { $dynamicRef: "#meta" },
        contains: { $dynamicRef: "#meta" },
        additionalProperties: { $dynamicRef: "#meta" },
        properties: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependentSchemas: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" },
          default: {}
        },
        propertyNames: { $dynamicRef: "#meta" },
        if: { $dynamicRef: "#meta" },
        then: { $dynamicRef: "#meta" },
        else: { $dynamicRef: "#meta" },
        allOf: { $ref: "#/$defs/schemaArray" },
        anyOf: { $ref: "#/$defs/schemaArray" },
        oneOf: { $ref: "#/$defs/schemaArray" },
        not: { $dynamicRef: "#meta" }
      },
      $defs: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $dynamicRef: "#meta" }
        }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/unevaluated.json
var require_unevaluated2 = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/unevaluated.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/unevaluated",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/unevaluated": true
      },
      $dynamicAnchor: "meta",
      title: "Unevaluated applicator vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        unevaluatedItems: { $dynamicRef: "#meta" },
        unevaluatedProperties: { $dynamicRef: "#meta" }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/content.json
var require_content = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/content.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/content",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/content": true
      },
      $dynamicAnchor: "meta",
      title: "Content vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        contentEncoding: { type: "string" },
        contentMediaType: { type: "string" },
        contentSchema: { $dynamicRef: "#meta" }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/core.json
var require_core4 = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/core.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/core",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/core": true
      },
      $dynamicAnchor: "meta",
      title: "Core vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        $id: {
          $ref: "#/$defs/uriReferenceString",
          $comment: "Non-empty fragments not allowed.",
          pattern: "^[^#]*#?$"
        },
        $schema: { $ref: "#/$defs/uriString" },
        $ref: { $ref: "#/$defs/uriReferenceString" },
        $anchor: { $ref: "#/$defs/anchorString" },
        $dynamicRef: { $ref: "#/$defs/uriReferenceString" },
        $dynamicAnchor: { $ref: "#/$defs/anchorString" },
        $vocabulary: {
          type: "object",
          propertyNames: { $ref: "#/$defs/uriString" },
          additionalProperties: {
            type: "boolean"
          }
        },
        $comment: {
          type: "string"
        },
        $defs: {
          type: "object",
          additionalProperties: { $dynamicRef: "#meta" }
        }
      },
      $defs: {
        anchorString: {
          type: "string",
          pattern: "^[A-Za-z_][-A-Za-z0-9._]*$"
        },
        uriString: {
          type: "string",
          format: "uri"
        },
        uriReferenceString: {
          type: "string",
          format: "uri-reference"
        }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/format-annotation.json
var require_format_annotation = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/format-annotation.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/format-annotation",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/format-annotation": true
      },
      $dynamicAnchor: "meta",
      title: "Format vocabulary meta-schema for annotation results",
      type: ["object", "boolean"],
      properties: {
        format: { type: "string" }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/meta-data.json
var require_meta_data = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/meta-data.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/meta-data",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/meta-data": true
      },
      $dynamicAnchor: "meta",
      title: "Meta-data vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: true,
        deprecated: {
          type: "boolean",
          default: false
        },
        readOnly: {
          type: "boolean",
          default: false
        },
        writeOnly: {
          type: "boolean",
          default: false
        },
        examples: {
          type: "array",
          items: true
        }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/validation.json
var require_validation3 = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/meta/validation.json"(exports, module) {
    module.exports = {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://json-schema.org/draft/2020-12/meta/validation",
      $vocabulary: {
        "https://json-schema.org/draft/2020-12/vocab/validation": true
      },
      $dynamicAnchor: "meta",
      title: "Validation vocabulary meta-schema",
      type: ["object", "boolean"],
      properties: {
        type: {
          anyOf: [
            { $ref: "#/$defs/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/$defs/simpleTypes" },
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        const: true,
        enum: {
          type: "array",
          items: true
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/$defs/nonNegativeInteger" },
        minLength: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        maxItems: { $ref: "#/$defs/nonNegativeInteger" },
        minItems: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        maxContains: { $ref: "#/$defs/nonNegativeInteger" },
        minContains: {
          $ref: "#/$defs/nonNegativeInteger",
          default: 1
        },
        maxProperties: { $ref: "#/$defs/nonNegativeInteger" },
        minProperties: { $ref: "#/$defs/nonNegativeIntegerDefault0" },
        required: { $ref: "#/$defs/stringArray" },
        dependentRequired: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/stringArray"
          }
        }
      },
      $defs: {
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          $ref: "#/$defs/nonNegativeInteger",
          default: 0
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
          default: []
        }
      }
    };
  }
});

// ../../../node_modules/ajv/dist/refs/json-schema-2020-12/index.js
var require_json_schema_2020_12 = __commonJS({
  "../../../node_modules/ajv/dist/refs/json-schema-2020-12/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var metaSchema = require_schema();
    var applicator = require_applicator2();
    var unevaluated = require_unevaluated2();
    var content = require_content();
    var core = require_core4();
    var format = require_format_annotation();
    var metadata = require_meta_data();
    var validation = require_validation3();
    var META_SUPPORT_DATA = ["/properties"];
    function addMetaSchema2020($data) {
      ;
      [
        metaSchema,
        applicator,
        unevaluated,
        content,
        core,
        with$data(this, format),
        metadata,
        with$data(this, validation)
      ].forEach((sch) => this.addMetaSchema(sch, void 0, false));
      return this;
      function with$data(ajv, sch) {
        return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch;
      }
    }
    exports.default = addMetaSchema2020;
  }
});

// ../../../node_modules/ajv/dist/2020.js
var require__ = __commonJS({
  "../../../node_modules/ajv/dist/2020.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv2020 = void 0;
    var core_1 = require_core();
    var draft2020_1 = require_draft2020();
    var discriminator_1 = require_discriminator();
    var json_schema_2020_12_1 = require_json_schema_2020_12();
    var META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema";
    var Ajv2020 = class extends core_1.default {
      constructor(opts = {}) {
        super({
          ...opts,
          dynamicRef: true,
          next: true,
          unevaluated: true
        });
      }
      _addVocabularies() {
        super._addVocabularies();
        draft2020_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
          this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        const { $data, meta } = this.opts;
        if (!meta)
          return;
        json_schema_2020_12_1.default.call(this, $data);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    exports.Ajv2020 = Ajv2020;
    module.exports = exports = Ajv2020;
    module.exports.Ajv2020 = Ajv2020;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Ajv2020;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
      return validation_error_1.default;
    } });
    var ref_error_1 = require_ref_error();
    Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
      return ref_error_1.default;
    } });
  }
});

// ../../../node_modules/@apidevtools/openapi-schemas/schemas/v1.2/apiDeclaration.json
var require_apiDeclaration = __commonJS({
  "../../../node_modules/@apidevtools/openapi-schemas/schemas/v1.2/apiDeclaration.json"(exports, module) {
    module.exports = {
      id: "https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/schemas/v1.2/apiDeclaration.json#",
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      required: ["swaggerVersion", "basePath", "apis"],
      properties: {
        swaggerVersion: { enum: ["1.2"] },
        apiVersion: { type: "string" },
        basePath: {
          type: "string",
          format: "uri",
          pattern: "^https?://"
        },
        resourcePath: {
          type: "string",
          format: "uri",
          pattern: "^/"
        },
        apis: {
          type: "array",
          items: { $ref: "#/definitions/apiObject" }
        },
        models: {
          type: "object",
          additionalProperties: {
            $ref: "modelsObject.json#"
          }
        },
        produces: { $ref: "#/definitions/mimeTypeArray" },
        consumes: { $ref: "#/definitions/mimeTypeArray" },
        authorizations: { $ref: "authorizationObject.json#" }
      },
      additionalProperties: false,
      definitions: {
        apiObject: {
          type: "object",
          required: ["path", "operations"],
          properties: {
            path: {
              type: "string",
              format: "uri-template",
              pattern: "^/"
            },
            description: { type: "string" },
            operations: {
              type: "array",
              items: { $ref: "operationObject.json#" }
            }
          },
          additionalProperties: false
        },
        mimeTypeArray: {
          type: "array",
          items: {
            type: "string",
            format: "mime-type"
          },
          uniqueItems: true
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/openapi-schemas/schemas/v2.0/schema.json
var require_schema2 = __commonJS({
  "../../../node_modules/@apidevtools/openapi-schemas/schemas/v2.0/schema.json"(exports, module) {
    module.exports = {
      title: "A JSON Schema for Swagger 2.0 API.",
      id: "http://swagger.io/v2/schema.json#",
      $schema: "http://json-schema.org/draft-04/schema#",
      type: "object",
      required: [
        "swagger",
        "info",
        "paths"
      ],
      additionalProperties: false,
      patternProperties: {
        "^x-": {
          $ref: "#/definitions/vendorExtension"
        }
      },
      properties: {
        swagger: {
          type: "string",
          enum: [
            "2.0"
          ],
          description: "The Swagger version of this document."
        },
        info: {
          $ref: "#/definitions/info"
        },
        host: {
          type: "string",
          pattern: "^[^{}/ :\\\\]+(?::\\d+)?$",
          description: "The host (name or ip) of the API. Example: 'swagger.io'"
        },
        basePath: {
          type: "string",
          pattern: "^/",
          description: "The base path to the API. Example: '/api'."
        },
        schemes: {
          $ref: "#/definitions/schemesList"
        },
        consumes: {
          description: "A list of MIME types accepted by the API.",
          allOf: [
            {
              $ref: "#/definitions/mediaTypeList"
            }
          ]
        },
        produces: {
          description: "A list of MIME types the API can produce.",
          allOf: [
            {
              $ref: "#/definitions/mediaTypeList"
            }
          ]
        },
        paths: {
          $ref: "#/definitions/paths"
        },
        definitions: {
          $ref: "#/definitions/definitions"
        },
        parameters: {
          $ref: "#/definitions/parameterDefinitions"
        },
        responses: {
          $ref: "#/definitions/responseDefinitions"
        },
        security: {
          $ref: "#/definitions/security"
        },
        securityDefinitions: {
          $ref: "#/definitions/securityDefinitions"
        },
        tags: {
          type: "array",
          items: {
            $ref: "#/definitions/tag"
          },
          uniqueItems: true
        },
        externalDocs: {
          $ref: "#/definitions/externalDocs"
        }
      },
      definitions: {
        info: {
          type: "object",
          description: "General information about the API.",
          required: [
            "version",
            "title"
          ],
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            title: {
              type: "string",
              description: "A unique and precise title of the API."
            },
            version: {
              type: "string",
              description: "A semantic version number of the API."
            },
            description: {
              type: "string",
              description: "A longer description of the API. Should be different from the title.  GitHub Flavored Markdown is allowed."
            },
            termsOfService: {
              type: "string",
              description: "The terms of service for the API."
            },
            contact: {
              $ref: "#/definitions/contact"
            },
            license: {
              $ref: "#/definitions/license"
            }
          }
        },
        contact: {
          type: "object",
          description: "Contact information for the owners of the API.",
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              description: "The identifying name of the contact person/organization."
            },
            url: {
              type: "string",
              description: "The URL pointing to the contact information.",
              format: "uri"
            },
            email: {
              type: "string",
              description: "The email address of the contact person/organization.",
              format: "email"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        license: {
          type: "object",
          required: [
            "name"
          ],
          additionalProperties: false,
          properties: {
            name: {
              type: "string",
              description: "The name of the license type. It's encouraged to use an OSI compatible license."
            },
            url: {
              type: "string",
              description: "The URL pointing to the license.",
              format: "uri"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        paths: {
          type: "object",
          description: "Relative paths to the individual endpoints. They must be relative to the 'basePath'.",
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            },
            "^/": {
              $ref: "#/definitions/pathItem"
            }
          },
          additionalProperties: false
        },
        definitions: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/schema"
          },
          description: "One or more JSON objects describing the schemas being consumed and produced by the API."
        },
        parameterDefinitions: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/parameter"
          },
          description: "One or more JSON representations for parameters"
        },
        responseDefinitions: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/response"
          },
          description: "One or more JSON representations for responses"
        },
        externalDocs: {
          type: "object",
          additionalProperties: false,
          description: "information about external documentation",
          required: [
            "url"
          ],
          properties: {
            description: {
              type: "string"
            },
            url: {
              type: "string",
              format: "uri"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        examples: {
          type: "object",
          additionalProperties: true
        },
        mimeType: {
          type: "string",
          description: "The MIME type of the HTTP message."
        },
        operation: {
          type: "object",
          required: [
            "responses"
          ],
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            tags: {
              type: "array",
              items: {
                type: "string"
              },
              uniqueItems: true
            },
            summary: {
              type: "string",
              description: "A brief summary of the operation."
            },
            description: {
              type: "string",
              description: "A longer description of the operation, GitHub Flavored Markdown is allowed."
            },
            externalDocs: {
              $ref: "#/definitions/externalDocs"
            },
            operationId: {
              type: "string",
              description: "A unique identifier of the operation."
            },
            produces: {
              description: "A list of MIME types the API can produce.",
              allOf: [
                {
                  $ref: "#/definitions/mediaTypeList"
                }
              ]
            },
            consumes: {
              description: "A list of MIME types the API can consume.",
              allOf: [
                {
                  $ref: "#/definitions/mediaTypeList"
                }
              ]
            },
            parameters: {
              $ref: "#/definitions/parametersList"
            },
            responses: {
              $ref: "#/definitions/responses"
            },
            schemes: {
              $ref: "#/definitions/schemesList"
            },
            deprecated: {
              type: "boolean",
              default: false
            },
            security: {
              $ref: "#/definitions/security"
            }
          }
        },
        pathItem: {
          type: "object",
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            $ref: {
              type: "string"
            },
            get: {
              $ref: "#/definitions/operation"
            },
            put: {
              $ref: "#/definitions/operation"
            },
            post: {
              $ref: "#/definitions/operation"
            },
            delete: {
              $ref: "#/definitions/operation"
            },
            options: {
              $ref: "#/definitions/operation"
            },
            head: {
              $ref: "#/definitions/operation"
            },
            patch: {
              $ref: "#/definitions/operation"
            },
            parameters: {
              $ref: "#/definitions/parametersList"
            }
          }
        },
        responses: {
          type: "object",
          description: "Response objects names can either be any valid HTTP status code or 'default'.",
          minProperties: 1,
          additionalProperties: false,
          patternProperties: {
            "^([0-9]{3})$|^(default)$": {
              $ref: "#/definitions/responseValue"
            },
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          not: {
            type: "object",
            additionalProperties: false,
            patternProperties: {
              "^x-": {
                $ref: "#/definitions/vendorExtension"
              }
            }
          }
        },
        responseValue: {
          oneOf: [
            {
              $ref: "#/definitions/response"
            },
            {
              $ref: "#/definitions/jsonReference"
            }
          ]
        },
        response: {
          type: "object",
          required: [
            "description"
          ],
          properties: {
            description: {
              type: "string"
            },
            schema: {
              oneOf: [
                {
                  $ref: "#/definitions/schema"
                },
                {
                  $ref: "#/definitions/fileSchema"
                }
              ]
            },
            headers: {
              $ref: "#/definitions/headers"
            },
            examples: {
              $ref: "#/definitions/examples"
            }
          },
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        headers: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/header"
          }
        },
        header: {
          type: "object",
          additionalProperties: false,
          required: [
            "type"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "string",
                "number",
                "integer",
                "boolean",
                "array"
              ]
            },
            format: {
              type: "string"
            },
            items: {
              $ref: "#/definitions/primitivesItems"
            },
            collectionFormat: {
              $ref: "#/definitions/collectionFormat"
            },
            default: {
              $ref: "#/definitions/default"
            },
            maximum: {
              $ref: "#/definitions/maximum"
            },
            exclusiveMaximum: {
              $ref: "#/definitions/exclusiveMaximum"
            },
            minimum: {
              $ref: "#/definitions/minimum"
            },
            exclusiveMinimum: {
              $ref: "#/definitions/exclusiveMinimum"
            },
            maxLength: {
              $ref: "#/definitions/maxLength"
            },
            minLength: {
              $ref: "#/definitions/minLength"
            },
            pattern: {
              $ref: "#/definitions/pattern"
            },
            maxItems: {
              $ref: "#/definitions/maxItems"
            },
            minItems: {
              $ref: "#/definitions/minItems"
            },
            uniqueItems: {
              $ref: "#/definitions/uniqueItems"
            },
            enum: {
              $ref: "#/definitions/enum"
            },
            multipleOf: {
              $ref: "#/definitions/multipleOf"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        vendorExtension: {
          description: "Any property starting with x- is valid.",
          additionalProperties: true,
          additionalItems: true
        },
        bodyParameter: {
          type: "object",
          required: [
            "name",
            "in",
            "schema"
          ],
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            description: {
              type: "string",
              description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
            },
            name: {
              type: "string",
              description: "The name of the parameter."
            },
            in: {
              type: "string",
              description: "Determines the location of the parameter.",
              enum: [
                "body"
              ]
            },
            required: {
              type: "boolean",
              description: "Determines whether or not this parameter is required or optional.",
              default: false
            },
            schema: {
              $ref: "#/definitions/schema"
            }
          },
          additionalProperties: false
        },
        headerParameterSubSchema: {
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            required: {
              type: "boolean",
              description: "Determines whether or not this parameter is required or optional.",
              default: false
            },
            in: {
              type: "string",
              description: "Determines the location of the parameter.",
              enum: [
                "header"
              ]
            },
            description: {
              type: "string",
              description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
            },
            name: {
              type: "string",
              description: "The name of the parameter."
            },
            type: {
              type: "string",
              enum: [
                "string",
                "number",
                "boolean",
                "integer",
                "array"
              ]
            },
            format: {
              type: "string"
            },
            items: {
              $ref: "#/definitions/primitivesItems"
            },
            collectionFormat: {
              $ref: "#/definitions/collectionFormat"
            },
            default: {
              $ref: "#/definitions/default"
            },
            maximum: {
              $ref: "#/definitions/maximum"
            },
            exclusiveMaximum: {
              $ref: "#/definitions/exclusiveMaximum"
            },
            minimum: {
              $ref: "#/definitions/minimum"
            },
            exclusiveMinimum: {
              $ref: "#/definitions/exclusiveMinimum"
            },
            maxLength: {
              $ref: "#/definitions/maxLength"
            },
            minLength: {
              $ref: "#/definitions/minLength"
            },
            pattern: {
              $ref: "#/definitions/pattern"
            },
            maxItems: {
              $ref: "#/definitions/maxItems"
            },
            minItems: {
              $ref: "#/definitions/minItems"
            },
            uniqueItems: {
              $ref: "#/definitions/uniqueItems"
            },
            enum: {
              $ref: "#/definitions/enum"
            },
            multipleOf: {
              $ref: "#/definitions/multipleOf"
            }
          }
        },
        queryParameterSubSchema: {
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            required: {
              type: "boolean",
              description: "Determines whether or not this parameter is required or optional.",
              default: false
            },
            in: {
              type: "string",
              description: "Determines the location of the parameter.",
              enum: [
                "query"
              ]
            },
            description: {
              type: "string",
              description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
            },
            name: {
              type: "string",
              description: "The name of the parameter."
            },
            allowEmptyValue: {
              type: "boolean",
              default: false,
              description: "allows sending a parameter by name only or with an empty value."
            },
            type: {
              type: "string",
              enum: [
                "string",
                "number",
                "boolean",
                "integer",
                "array"
              ]
            },
            format: {
              type: "string"
            },
            items: {
              $ref: "#/definitions/primitivesItems"
            },
            collectionFormat: {
              $ref: "#/definitions/collectionFormatWithMulti"
            },
            default: {
              $ref: "#/definitions/default"
            },
            maximum: {
              $ref: "#/definitions/maximum"
            },
            exclusiveMaximum: {
              $ref: "#/definitions/exclusiveMaximum"
            },
            minimum: {
              $ref: "#/definitions/minimum"
            },
            exclusiveMinimum: {
              $ref: "#/definitions/exclusiveMinimum"
            },
            maxLength: {
              $ref: "#/definitions/maxLength"
            },
            minLength: {
              $ref: "#/definitions/minLength"
            },
            pattern: {
              $ref: "#/definitions/pattern"
            },
            maxItems: {
              $ref: "#/definitions/maxItems"
            },
            minItems: {
              $ref: "#/definitions/minItems"
            },
            uniqueItems: {
              $ref: "#/definitions/uniqueItems"
            },
            enum: {
              $ref: "#/definitions/enum"
            },
            multipleOf: {
              $ref: "#/definitions/multipleOf"
            }
          }
        },
        formDataParameterSubSchema: {
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            required: {
              type: "boolean",
              description: "Determines whether or not this parameter is required or optional.",
              default: false
            },
            in: {
              type: "string",
              description: "Determines the location of the parameter.",
              enum: [
                "formData"
              ]
            },
            description: {
              type: "string",
              description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
            },
            name: {
              type: "string",
              description: "The name of the parameter."
            },
            allowEmptyValue: {
              type: "boolean",
              default: false,
              description: "allows sending a parameter by name only or with an empty value."
            },
            type: {
              type: "string",
              enum: [
                "string",
                "number",
                "boolean",
                "integer",
                "array",
                "file"
              ]
            },
            format: {
              type: "string"
            },
            items: {
              $ref: "#/definitions/primitivesItems"
            },
            collectionFormat: {
              $ref: "#/definitions/collectionFormatWithMulti"
            },
            default: {
              $ref: "#/definitions/default"
            },
            maximum: {
              $ref: "#/definitions/maximum"
            },
            exclusiveMaximum: {
              $ref: "#/definitions/exclusiveMaximum"
            },
            minimum: {
              $ref: "#/definitions/minimum"
            },
            exclusiveMinimum: {
              $ref: "#/definitions/exclusiveMinimum"
            },
            maxLength: {
              $ref: "#/definitions/maxLength"
            },
            minLength: {
              $ref: "#/definitions/minLength"
            },
            pattern: {
              $ref: "#/definitions/pattern"
            },
            maxItems: {
              $ref: "#/definitions/maxItems"
            },
            minItems: {
              $ref: "#/definitions/minItems"
            },
            uniqueItems: {
              $ref: "#/definitions/uniqueItems"
            },
            enum: {
              $ref: "#/definitions/enum"
            },
            multipleOf: {
              $ref: "#/definitions/multipleOf"
            }
          }
        },
        pathParameterSubSchema: {
          additionalProperties: false,
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          required: [
            "required"
          ],
          properties: {
            required: {
              type: "boolean",
              enum: [
                true
              ],
              description: "Determines whether or not this parameter is required or optional."
            },
            in: {
              type: "string",
              description: "Determines the location of the parameter.",
              enum: [
                "path"
              ]
            },
            description: {
              type: "string",
              description: "A brief description of the parameter. This could contain examples of use.  GitHub Flavored Markdown is allowed."
            },
            name: {
              type: "string",
              description: "The name of the parameter."
            },
            type: {
              type: "string",
              enum: [
                "string",
                "number",
                "boolean",
                "integer",
                "array"
              ]
            },
            format: {
              type: "string"
            },
            items: {
              $ref: "#/definitions/primitivesItems"
            },
            collectionFormat: {
              $ref: "#/definitions/collectionFormat"
            },
            default: {
              $ref: "#/definitions/default"
            },
            maximum: {
              $ref: "#/definitions/maximum"
            },
            exclusiveMaximum: {
              $ref: "#/definitions/exclusiveMaximum"
            },
            minimum: {
              $ref: "#/definitions/minimum"
            },
            exclusiveMinimum: {
              $ref: "#/definitions/exclusiveMinimum"
            },
            maxLength: {
              $ref: "#/definitions/maxLength"
            },
            minLength: {
              $ref: "#/definitions/minLength"
            },
            pattern: {
              $ref: "#/definitions/pattern"
            },
            maxItems: {
              $ref: "#/definitions/maxItems"
            },
            minItems: {
              $ref: "#/definitions/minItems"
            },
            uniqueItems: {
              $ref: "#/definitions/uniqueItems"
            },
            enum: {
              $ref: "#/definitions/enum"
            },
            multipleOf: {
              $ref: "#/definitions/multipleOf"
            }
          }
        },
        nonBodyParameter: {
          type: "object",
          required: [
            "name",
            "in",
            "type"
          ],
          oneOf: [
            {
              $ref: "#/definitions/headerParameterSubSchema"
            },
            {
              $ref: "#/definitions/formDataParameterSubSchema"
            },
            {
              $ref: "#/definitions/queryParameterSubSchema"
            },
            {
              $ref: "#/definitions/pathParameterSubSchema"
            }
          ]
        },
        parameter: {
          oneOf: [
            {
              $ref: "#/definitions/bodyParameter"
            },
            {
              $ref: "#/definitions/nonBodyParameter"
            }
          ]
        },
        schema: {
          type: "object",
          description: "A deterministic version of a JSON Schema object.",
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          properties: {
            $ref: {
              type: "string"
            },
            format: {
              type: "string"
            },
            title: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/title"
            },
            description: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/description"
            },
            default: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/default"
            },
            multipleOf: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/multipleOf"
            },
            maximum: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/maximum"
            },
            exclusiveMaximum: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMaximum"
            },
            minimum: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/minimum"
            },
            exclusiveMinimum: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMinimum"
            },
            maxLength: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
            },
            minLength: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
            },
            pattern: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/pattern"
            },
            maxItems: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
            },
            minItems: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
            },
            uniqueItems: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/uniqueItems"
            },
            maxProperties: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
            },
            minProperties: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
            },
            required: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/stringArray"
            },
            enum: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/enum"
            },
            additionalProperties: {
              anyOf: [
                {
                  $ref: "#/definitions/schema"
                },
                {
                  type: "boolean"
                }
              ],
              default: {}
            },
            type: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/type"
            },
            items: {
              anyOf: [
                {
                  $ref: "#/definitions/schema"
                },
                {
                  type: "array",
                  minItems: 1,
                  items: {
                    $ref: "#/definitions/schema"
                  }
                }
              ],
              default: {}
            },
            allOf: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/definitions/schema"
              }
            },
            properties: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/schema"
              },
              default: {}
            },
            discriminator: {
              type: "string"
            },
            readOnly: {
              type: "boolean",
              default: false
            },
            xml: {
              $ref: "#/definitions/xml"
            },
            externalDocs: {
              $ref: "#/definitions/externalDocs"
            },
            example: {}
          },
          additionalProperties: false
        },
        fileSchema: {
          type: "object",
          description: "A deterministic version of a JSON Schema object.",
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          },
          required: [
            "type"
          ],
          properties: {
            format: {
              type: "string"
            },
            title: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/title"
            },
            description: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/description"
            },
            default: {
              $ref: "http://json-schema.org/draft-04/schema#/properties/default"
            },
            required: {
              $ref: "http://json-schema.org/draft-04/schema#/definitions/stringArray"
            },
            type: {
              type: "string",
              enum: [
                "file"
              ]
            },
            readOnly: {
              type: "boolean",
              default: false
            },
            externalDocs: {
              $ref: "#/definitions/externalDocs"
            },
            example: {}
          },
          additionalProperties: false
        },
        primitivesItems: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: [
                "string",
                "number",
                "integer",
                "boolean",
                "array"
              ]
            },
            format: {
              type: "string"
            },
            items: {
              $ref: "#/definitions/primitivesItems"
            },
            collectionFormat: {
              $ref: "#/definitions/collectionFormat"
            },
            default: {
              $ref: "#/definitions/default"
            },
            maximum: {
              $ref: "#/definitions/maximum"
            },
            exclusiveMaximum: {
              $ref: "#/definitions/exclusiveMaximum"
            },
            minimum: {
              $ref: "#/definitions/minimum"
            },
            exclusiveMinimum: {
              $ref: "#/definitions/exclusiveMinimum"
            },
            maxLength: {
              $ref: "#/definitions/maxLength"
            },
            minLength: {
              $ref: "#/definitions/minLength"
            },
            pattern: {
              $ref: "#/definitions/pattern"
            },
            maxItems: {
              $ref: "#/definitions/maxItems"
            },
            minItems: {
              $ref: "#/definitions/minItems"
            },
            uniqueItems: {
              $ref: "#/definitions/uniqueItems"
            },
            enum: {
              $ref: "#/definitions/enum"
            },
            multipleOf: {
              $ref: "#/definitions/multipleOf"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        security: {
          type: "array",
          items: {
            $ref: "#/definitions/securityRequirement"
          },
          uniqueItems: true
        },
        securityRequirement: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: {
              type: "string"
            },
            uniqueItems: true
          }
        },
        xml: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: {
              type: "string"
            },
            namespace: {
              type: "string"
            },
            prefix: {
              type: "string"
            },
            attribute: {
              type: "boolean",
              default: false
            },
            wrapped: {
              type: "boolean",
              default: false
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        tag: {
          type: "object",
          additionalProperties: false,
          required: [
            "name"
          ],
          properties: {
            name: {
              type: "string"
            },
            description: {
              type: "string"
            },
            externalDocs: {
              $ref: "#/definitions/externalDocs"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        securityDefinitions: {
          type: "object",
          additionalProperties: {
            oneOf: [
              {
                $ref: "#/definitions/basicAuthenticationSecurity"
              },
              {
                $ref: "#/definitions/apiKeySecurity"
              },
              {
                $ref: "#/definitions/oauth2ImplicitSecurity"
              },
              {
                $ref: "#/definitions/oauth2PasswordSecurity"
              },
              {
                $ref: "#/definitions/oauth2ApplicationSecurity"
              },
              {
                $ref: "#/definitions/oauth2AccessCodeSecurity"
              }
            ]
          }
        },
        basicAuthenticationSecurity: {
          type: "object",
          additionalProperties: false,
          required: [
            "type"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "basic"
              ]
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        apiKeySecurity: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "name",
            "in"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "apiKey"
              ]
            },
            name: {
              type: "string"
            },
            in: {
              type: "string",
              enum: [
                "header",
                "query"
              ]
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        oauth2ImplicitSecurity: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "flow",
            "authorizationUrl"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "oauth2"
              ]
            },
            flow: {
              type: "string",
              enum: [
                "implicit"
              ]
            },
            scopes: {
              $ref: "#/definitions/oauth2Scopes"
            },
            authorizationUrl: {
              type: "string",
              format: "uri"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        oauth2PasswordSecurity: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "flow",
            "tokenUrl"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "oauth2"
              ]
            },
            flow: {
              type: "string",
              enum: [
                "password"
              ]
            },
            scopes: {
              $ref: "#/definitions/oauth2Scopes"
            },
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        oauth2ApplicationSecurity: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "flow",
            "tokenUrl"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "oauth2"
              ]
            },
            flow: {
              type: "string",
              enum: [
                "application"
              ]
            },
            scopes: {
              $ref: "#/definitions/oauth2Scopes"
            },
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        oauth2AccessCodeSecurity: {
          type: "object",
          additionalProperties: false,
          required: [
            "type",
            "flow",
            "authorizationUrl",
            "tokenUrl"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "oauth2"
              ]
            },
            flow: {
              type: "string",
              enum: [
                "accessCode"
              ]
            },
            scopes: {
              $ref: "#/definitions/oauth2Scopes"
            },
            authorizationUrl: {
              type: "string",
              format: "uri"
            },
            tokenUrl: {
              type: "string",
              format: "uri"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {
              $ref: "#/definitions/vendorExtension"
            }
          }
        },
        oauth2Scopes: {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        },
        mediaTypeList: {
          type: "array",
          items: {
            $ref: "#/definitions/mimeType"
          },
          uniqueItems: true
        },
        parametersList: {
          type: "array",
          description: "The parameters needed to send a valid API call.",
          additionalItems: false,
          items: {
            oneOf: [
              {
                $ref: "#/definitions/parameter"
              },
              {
                $ref: "#/definitions/jsonReference"
              }
            ]
          },
          uniqueItems: true
        },
        schemesList: {
          type: "array",
          description: "The transfer protocol of the API.",
          items: {
            type: "string",
            enum: [
              "http",
              "https",
              "ws",
              "wss"
            ]
          },
          uniqueItems: true
        },
        collectionFormat: {
          type: "string",
          enum: [
            "csv",
            "ssv",
            "tsv",
            "pipes"
          ],
          default: "csv"
        },
        collectionFormatWithMulti: {
          type: "string",
          enum: [
            "csv",
            "ssv",
            "tsv",
            "pipes",
            "multi"
          ],
          default: "csv"
        },
        title: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/title"
        },
        description: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/description"
        },
        default: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/default"
        },
        multipleOf: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/multipleOf"
        },
        maximum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/maximum"
        },
        exclusiveMaximum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMaximum"
        },
        minimum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/minimum"
        },
        exclusiveMinimum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/exclusiveMinimum"
        },
        maxLength: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
        },
        minLength: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
        },
        pattern: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/pattern"
        },
        maxItems: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveInteger"
        },
        minItems: {
          $ref: "http://json-schema.org/draft-04/schema#/definitions/positiveIntegerDefault0"
        },
        uniqueItems: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/uniqueItems"
        },
        enum: {
          $ref: "http://json-schema.org/draft-04/schema#/properties/enum"
        },
        jsonReference: {
          type: "object",
          required: [
            "$ref"
          ],
          additionalProperties: false,
          properties: {
            $ref: {
              type: "string"
            }
          }
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/openapi-schemas/schemas/v3.0/schema.json
var require_schema3 = __commonJS({
  "../../../node_modules/@apidevtools/openapi-schemas/schemas/v3.0/schema.json"(exports, module) {
    module.exports = {
      id: "https://spec.openapis.org/oas/3.0/schema/2019-04-02",
      $schema: "http://json-schema.org/draft-04/schema#",
      description: "Validation schema for OpenAPI Specification 3.0.X.",
      type: "object",
      required: [
        "openapi",
        "info",
        "paths"
      ],
      properties: {
        openapi: {
          type: "string",
          pattern: "^3\\.0\\.\\d(-.+)?$"
        },
        info: {
          $ref: "#/definitions/Info"
        },
        externalDocs: {
          $ref: "#/definitions/ExternalDocumentation"
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/definitions/Server"
          }
        },
        security: {
          type: "array",
          items: {
            $ref: "#/definitions/SecurityRequirement"
          }
        },
        tags: {
          type: "array",
          items: {
            $ref: "#/definitions/Tag"
          },
          uniqueItems: true
        },
        paths: {
          $ref: "#/definitions/Paths"
        },
        components: {
          $ref: "#/definitions/Components"
        }
      },
      patternProperties: {
        "^x-": {}
      },
      additionalProperties: false,
      definitions: {
        Reference: {
          type: "object",
          required: [
            "$ref"
          ],
          patternProperties: {
            "^\\$ref$": {
              type: "string",
              format: "uri-reference"
            }
          }
        },
        Info: {
          type: "object",
          required: [
            "title",
            "version"
          ],
          properties: {
            title: {
              type: "string"
            },
            description: {
              type: "string"
            },
            termsOfService: {
              type: "string",
              format: "uri-reference"
            },
            contact: {
              $ref: "#/definitions/Contact"
            },
            license: {
              $ref: "#/definitions/License"
            },
            version: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Contact: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            url: {
              type: "string",
              format: "uri-reference"
            },
            email: {
              type: "string",
              format: "email"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        License: {
          type: "object",
          required: [
            "name"
          ],
          properties: {
            name: {
              type: "string"
            },
            url: {
              type: "string",
              format: "uri-reference"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Server: {
          type: "object",
          required: [
            "url"
          ],
          properties: {
            url: {
              type: "string"
            },
            description: {
              type: "string"
            },
            variables: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/ServerVariable"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        ServerVariable: {
          type: "object",
          required: [
            "default"
          ],
          properties: {
            enum: {
              type: "array",
              items: {
                type: "string"
              }
            },
            default: {
              type: "string"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Components: {
          type: "object",
          properties: {
            schemas: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Schema"
                    },
                    {
                      $ref: "#/definitions/Reference"
                    }
                  ]
                }
              }
            },
            responses: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/Response"
                    }
                  ]
                }
              }
            },
            parameters: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/Parameter"
                    }
                  ]
                }
              }
            },
            examples: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/Example"
                    }
                  ]
                }
              }
            },
            requestBodies: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/RequestBody"
                    }
                  ]
                }
              }
            },
            headers: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/Header"
                    }
                  ]
                }
              }
            },
            securitySchemes: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/SecurityScheme"
                    }
                  ]
                }
              }
            },
            links: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/Link"
                    }
                  ]
                }
              }
            },
            callbacks: {
              type: "object",
              patternProperties: {
                "^[a-zA-Z0-9\\.\\-_]+$": {
                  oneOf: [
                    {
                      $ref: "#/definitions/Reference"
                    },
                    {
                      $ref: "#/definitions/Callback"
                    }
                  ]
                }
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Schema: {
          type: "object",
          properties: {
            title: {
              type: "string"
            },
            multipleOf: {
              type: "number",
              minimum: 0,
              exclusiveMinimum: true
            },
            maximum: {
              type: "number"
            },
            exclusiveMaximum: {
              type: "boolean",
              default: false
            },
            minimum: {
              type: "number"
            },
            exclusiveMinimum: {
              type: "boolean",
              default: false
            },
            maxLength: {
              type: "integer",
              minimum: 0
            },
            minLength: {
              type: "integer",
              minimum: 0,
              default: 0
            },
            pattern: {
              type: "string",
              format: "regex"
            },
            maxItems: {
              type: "integer",
              minimum: 0
            },
            minItems: {
              type: "integer",
              minimum: 0,
              default: 0
            },
            uniqueItems: {
              type: "boolean",
              default: false
            },
            maxProperties: {
              type: "integer",
              minimum: 0
            },
            minProperties: {
              type: "integer",
              minimum: 0,
              default: 0
            },
            required: {
              type: "array",
              items: {
                type: "string"
              },
              minItems: 1,
              uniqueItems: true
            },
            enum: {
              type: "array",
              items: {},
              minItems: 1,
              uniqueItems: false
            },
            type: {
              type: "string",
              enum: [
                "array",
                "boolean",
                "integer",
                "number",
                "object",
                "string"
              ]
            },
            not: {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            allOf: {
              type: "array",
              items: {
                oneOf: [
                  {
                    $ref: "#/definitions/Schema"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            oneOf: {
              type: "array",
              items: {
                oneOf: [
                  {
                    $ref: "#/definitions/Schema"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            anyOf: {
              type: "array",
              items: {
                oneOf: [
                  {
                    $ref: "#/definitions/Schema"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            items: {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            properties: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Schema"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            additionalProperties: {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                },
                {
                  type: "boolean"
                }
              ],
              default: true
            },
            description: {
              type: "string"
            },
            format: {
              type: "string"
            },
            default: {},
            nullable: {
              type: "boolean",
              default: false
            },
            discriminator: {
              $ref: "#/definitions/Discriminator"
            },
            readOnly: {
              type: "boolean",
              default: false
            },
            writeOnly: {
              type: "boolean",
              default: false
            },
            example: {},
            externalDocs: {
              $ref: "#/definitions/ExternalDocumentation"
            },
            deprecated: {
              type: "boolean",
              default: false
            },
            xml: {
              $ref: "#/definitions/XML"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Discriminator: {
          type: "object",
          required: [
            "propertyName"
          ],
          properties: {
            propertyName: {
              type: "string"
            },
            mapping: {
              type: "object",
              additionalProperties: {
                type: "string"
              }
            }
          }
        },
        XML: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            namespace: {
              type: "string",
              format: "uri"
            },
            prefix: {
              type: "string"
            },
            attribute: {
              type: "boolean",
              default: false
            },
            wrapped: {
              type: "boolean",
              default: false
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Response: {
          type: "object",
          required: [
            "description"
          ],
          properties: {
            description: {
              type: "string"
            },
            headers: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Header"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            content: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/MediaType"
              }
            },
            links: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Link"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        MediaType: {
          type: "object",
          properties: {
            schema: {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            example: {},
            examples: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Example"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            encoding: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/Encoding"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false,
          allOf: [
            {
              $ref: "#/definitions/ExampleXORExamples"
            }
          ]
        },
        Example: {
          type: "object",
          properties: {
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            value: {},
            externalValue: {
              type: "string",
              format: "uri-reference"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Header: {
          type: "object",
          properties: {
            description: {
              type: "string"
            },
            required: {
              type: "boolean",
              default: false
            },
            deprecated: {
              type: "boolean",
              default: false
            },
            allowEmptyValue: {
              type: "boolean",
              default: false
            },
            style: {
              type: "string",
              enum: [
                "simple"
              ],
              default: "simple"
            },
            explode: {
              type: "boolean"
            },
            allowReserved: {
              type: "boolean",
              default: false
            },
            schema: {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            content: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/MediaType"
              },
              minProperties: 1,
              maxProperties: 1
            },
            example: {},
            examples: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Example"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false,
          allOf: [
            {
              $ref: "#/definitions/ExampleXORExamples"
            },
            {
              $ref: "#/definitions/SchemaXORContent"
            }
          ]
        },
        Paths: {
          type: "object",
          patternProperties: {
            "^\\/": {
              $ref: "#/definitions/PathItem"
            },
            "^x-": {}
          },
          additionalProperties: false
        },
        PathItem: {
          type: "object",
          properties: {
            $ref: {
              type: "string"
            },
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            servers: {
              type: "array",
              items: {
                $ref: "#/definitions/Server"
              }
            },
            parameters: {
              type: "array",
              items: {
                oneOf: [
                  {
                    $ref: "#/definitions/Parameter"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              },
              uniqueItems: true
            }
          },
          patternProperties: {
            "^(get|put|post|delete|options|head|patch|trace)$": {
              $ref: "#/definitions/Operation"
            },
            "^x-": {}
          },
          additionalProperties: false
        },
        Operation: {
          type: "object",
          required: [
            "responses"
          ],
          properties: {
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            },
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            externalDocs: {
              $ref: "#/definitions/ExternalDocumentation"
            },
            operationId: {
              type: "string"
            },
            parameters: {
              type: "array",
              items: {
                oneOf: [
                  {
                    $ref: "#/definitions/Parameter"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              },
              uniqueItems: true
            },
            requestBody: {
              oneOf: [
                {
                  $ref: "#/definitions/RequestBody"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            responses: {
              $ref: "#/definitions/Responses"
            },
            callbacks: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Callback"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            },
            deprecated: {
              type: "boolean",
              default: false
            },
            security: {
              type: "array",
              items: {
                $ref: "#/definitions/SecurityRequirement"
              }
            },
            servers: {
              type: "array",
              items: {
                $ref: "#/definitions/Server"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Responses: {
          type: "object",
          properties: {
            default: {
              oneOf: [
                {
                  $ref: "#/definitions/Response"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            }
          },
          patternProperties: {
            "^[1-5](?:\\d{2}|XX)$": {
              oneOf: [
                {
                  $ref: "#/definitions/Response"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            "^x-": {}
          },
          minProperties: 1,
          additionalProperties: false
        },
        SecurityRequirement: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },
        Tag: {
          type: "object",
          required: [
            "name"
          ],
          properties: {
            name: {
              type: "string"
            },
            description: {
              type: "string"
            },
            externalDocs: {
              $ref: "#/definitions/ExternalDocumentation"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        ExternalDocumentation: {
          type: "object",
          required: [
            "url"
          ],
          properties: {
            description: {
              type: "string"
            },
            url: {
              type: "string",
              format: "uri-reference"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        ExampleXORExamples: {
          description: "Example and examples are mutually exclusive",
          not: {
            required: [
              "example",
              "examples"
            ]
          }
        },
        SchemaXORContent: {
          description: "Schema and content are mutually exclusive, at least one is required",
          not: {
            required: [
              "schema",
              "content"
            ]
          },
          oneOf: [
            {
              required: [
                "schema"
              ]
            },
            {
              required: [
                "content"
              ],
              description: "Some properties are not allowed if content is present",
              allOf: [
                {
                  not: {
                    required: [
                      "style"
                    ]
                  }
                },
                {
                  not: {
                    required: [
                      "explode"
                    ]
                  }
                },
                {
                  not: {
                    required: [
                      "allowReserved"
                    ]
                  }
                },
                {
                  not: {
                    required: [
                      "example"
                    ]
                  }
                },
                {
                  not: {
                    required: [
                      "examples"
                    ]
                  }
                }
              ]
            }
          ]
        },
        Parameter: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            in: {
              type: "string"
            },
            description: {
              type: "string"
            },
            required: {
              type: "boolean",
              default: false
            },
            deprecated: {
              type: "boolean",
              default: false
            },
            allowEmptyValue: {
              type: "boolean",
              default: false
            },
            style: {
              type: "string"
            },
            explode: {
              type: "boolean"
            },
            allowReserved: {
              type: "boolean",
              default: false
            },
            schema: {
              oneOf: [
                {
                  $ref: "#/definitions/Schema"
                },
                {
                  $ref: "#/definitions/Reference"
                }
              ]
            },
            content: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/MediaType"
              },
              minProperties: 1,
              maxProperties: 1
            },
            example: {},
            examples: {
              type: "object",
              additionalProperties: {
                oneOf: [
                  {
                    $ref: "#/definitions/Example"
                  },
                  {
                    $ref: "#/definitions/Reference"
                  }
                ]
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false,
          required: [
            "name",
            "in"
          ],
          allOf: [
            {
              $ref: "#/definitions/ExampleXORExamples"
            },
            {
              $ref: "#/definitions/SchemaXORContent"
            },
            {
              $ref: "#/definitions/ParameterLocation"
            }
          ]
        },
        ParameterLocation: {
          description: "Parameter location",
          oneOf: [
            {
              description: "Parameter in path",
              required: [
                "required"
              ],
              properties: {
                in: {
                  enum: [
                    "path"
                  ]
                },
                style: {
                  enum: [
                    "matrix",
                    "label",
                    "simple"
                  ],
                  default: "simple"
                },
                required: {
                  enum: [
                    true
                  ]
                }
              }
            },
            {
              description: "Parameter in query",
              properties: {
                in: {
                  enum: [
                    "query"
                  ]
                },
                style: {
                  enum: [
                    "form",
                    "spaceDelimited",
                    "pipeDelimited",
                    "deepObject"
                  ],
                  default: "form"
                }
              }
            },
            {
              description: "Parameter in header",
              properties: {
                in: {
                  enum: [
                    "header"
                  ]
                },
                style: {
                  enum: [
                    "simple"
                  ],
                  default: "simple"
                }
              }
            },
            {
              description: "Parameter in cookie",
              properties: {
                in: {
                  enum: [
                    "cookie"
                  ]
                },
                style: {
                  enum: [
                    "form"
                  ],
                  default: "form"
                }
              }
            }
          ]
        },
        RequestBody: {
          type: "object",
          required: [
            "content"
          ],
          properties: {
            description: {
              type: "string"
            },
            content: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/MediaType"
              }
            },
            required: {
              type: "boolean",
              default: false
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        SecurityScheme: {
          oneOf: [
            {
              $ref: "#/definitions/APIKeySecurityScheme"
            },
            {
              $ref: "#/definitions/HTTPSecurityScheme"
            },
            {
              $ref: "#/definitions/OAuth2SecurityScheme"
            },
            {
              $ref: "#/definitions/OpenIdConnectSecurityScheme"
            }
          ]
        },
        APIKeySecurityScheme: {
          type: "object",
          required: [
            "type",
            "name",
            "in"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "apiKey"
              ]
            },
            name: {
              type: "string"
            },
            in: {
              type: "string",
              enum: [
                "header",
                "query",
                "cookie"
              ]
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        HTTPSecurityScheme: {
          type: "object",
          required: [
            "scheme",
            "type"
          ],
          properties: {
            scheme: {
              type: "string"
            },
            bearerFormat: {
              type: "string"
            },
            description: {
              type: "string"
            },
            type: {
              type: "string",
              enum: [
                "http"
              ]
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false,
          oneOf: [
            {
              description: "Bearer",
              properties: {
                scheme: {
                  enum: [
                    "bearer"
                  ]
                }
              }
            },
            {
              description: "Non Bearer",
              not: {
                required: [
                  "bearerFormat"
                ]
              },
              properties: {
                scheme: {
                  not: {
                    enum: [
                      "bearer"
                    ]
                  }
                }
              }
            }
          ]
        },
        OAuth2SecurityScheme: {
          type: "object",
          required: [
            "type",
            "flows"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "oauth2"
              ]
            },
            flows: {
              $ref: "#/definitions/OAuthFlows"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        OpenIdConnectSecurityScheme: {
          type: "object",
          required: [
            "type",
            "openIdConnectUrl"
          ],
          properties: {
            type: {
              type: "string",
              enum: [
                "openIdConnect"
              ]
            },
            openIdConnectUrl: {
              type: "string",
              format: "uri-reference"
            },
            description: {
              type: "string"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        OAuthFlows: {
          type: "object",
          properties: {
            implicit: {
              $ref: "#/definitions/ImplicitOAuthFlow"
            },
            password: {
              $ref: "#/definitions/PasswordOAuthFlow"
            },
            clientCredentials: {
              $ref: "#/definitions/ClientCredentialsFlow"
            },
            authorizationCode: {
              $ref: "#/definitions/AuthorizationCodeOAuthFlow"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        ImplicitOAuthFlow: {
          type: "object",
          required: [
            "authorizationUrl",
            "scopes"
          ],
          properties: {
            authorizationUrl: {
              type: "string",
              format: "uri-reference"
            },
            refreshUrl: {
              type: "string",
              format: "uri-reference"
            },
            scopes: {
              type: "object",
              additionalProperties: {
                type: "string"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        PasswordOAuthFlow: {
          type: "object",
          required: [
            "tokenUrl"
          ],
          properties: {
            tokenUrl: {
              type: "string",
              format: "uri-reference"
            },
            refreshUrl: {
              type: "string",
              format: "uri-reference"
            },
            scopes: {
              type: "object",
              additionalProperties: {
                type: "string"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        ClientCredentialsFlow: {
          type: "object",
          required: [
            "tokenUrl"
          ],
          properties: {
            tokenUrl: {
              type: "string",
              format: "uri-reference"
            },
            refreshUrl: {
              type: "string",
              format: "uri-reference"
            },
            scopes: {
              type: "object",
              additionalProperties: {
                type: "string"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        AuthorizationCodeOAuthFlow: {
          type: "object",
          required: [
            "authorizationUrl",
            "tokenUrl"
          ],
          properties: {
            authorizationUrl: {
              type: "string",
              format: "uri-reference"
            },
            tokenUrl: {
              type: "string",
              format: "uri-reference"
            },
            refreshUrl: {
              type: "string",
              format: "uri-reference"
            },
            scopes: {
              type: "object",
              additionalProperties: {
                type: "string"
              }
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false
        },
        Link: {
          type: "object",
          properties: {
            operationId: {
              type: "string"
            },
            operationRef: {
              type: "string",
              format: "uri-reference"
            },
            parameters: {
              type: "object",
              additionalProperties: {}
            },
            requestBody: {},
            description: {
              type: "string"
            },
            server: {
              $ref: "#/definitions/Server"
            }
          },
          patternProperties: {
            "^x-": {}
          },
          additionalProperties: false,
          not: {
            description: "Operation Id and Operation Ref are mutually exclusive",
            required: [
              "operationId",
              "operationRef"
            ]
          }
        },
        Callback: {
          type: "object",
          additionalProperties: {
            $ref: "#/definitions/PathItem"
          },
          patternProperties: {
            "^x-": {}
          }
        },
        Encoding: {
          type: "object",
          properties: {
            contentType: {
              type: "string"
            },
            headers: {
              type: "object",
              additionalProperties: {
                $ref: "#/definitions/Header"
              }
            },
            style: {
              type: "string",
              enum: [
                "form",
                "spaceDelimited",
                "pipeDelimited",
                "deepObject"
              ]
            },
            explode: {
              type: "boolean"
            },
            allowReserved: {
              type: "boolean",
              default: false
            }
          },
          additionalProperties: false
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/openapi-schemas/schemas/v3.1/schema.json
var require_schema4 = __commonJS({
  "../../../node_modules/@apidevtools/openapi-schemas/schemas/v3.1/schema.json"(exports, module) {
    module.exports = {
      $id: "https://spec.openapis.org/oas/3.1/schema/2021-04-15",
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        openapi: {
          type: "string",
          pattern: "^3\\.1\\.\\d+(-.+)?$"
        },
        info: {
          $ref: "#/$defs/info"
        },
        jsonSchemaDialect: {
          $ref: "#/$defs/uri",
          default: "https://spec.openapis.org/oas/3.1/dialect/base"
        },
        servers: {
          type: "array",
          items: {
            $ref: "#/$defs/server"
          }
        },
        paths: {
          $ref: "#/$defs/paths"
        },
        webhooks: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/path-item-or-reference"
          }
        },
        components: {
          $ref: "#/$defs/components"
        },
        security: {
          type: "array",
          items: {
            $ref: "#/$defs/security-requirement"
          }
        },
        tags: {
          type: "array",
          items: {
            $ref: "#/$defs/tag"
          }
        },
        externalDocs: {
          $ref: "#/$defs/external-documentation"
        }
      },
      required: [
        "openapi",
        "info"
      ],
      anyOf: [
        {
          required: [
            "paths"
          ]
        },
        {
          required: [
            "components"
          ]
        },
        {
          required: [
            "webhooks"
          ]
        }
      ],
      $ref: "#/$defs/specification-extensions",
      unevaluatedProperties: false,
      $defs: {
        info: {
          type: "object",
          properties: {
            title: {
              type: "string"
            },
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            termsOfService: {
              type: "string"
            },
            contact: {
              $ref: "#/$defs/contact"
            },
            license: {
              $ref: "#/$defs/license"
            },
            version: {
              type: "string"
            }
          },
          required: [
            "title",
            "version"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        contact: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            url: {
              type: "string"
            },
            email: {
              type: "string"
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        license: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            identifier: {
              type: "string"
            },
            url: {
              $ref: "#/$defs/uri"
            }
          },
          required: [
            "name"
          ],
          oneOf: [
            {
              required: [
                "identifier"
              ]
            },
            {
              required: [
                "url"
              ]
            }
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        server: {
          type: "object",
          properties: {
            url: {
              $ref: "#/$defs/uri"
            },
            description: {
              type: "string"
            },
            variables: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/server-variable"
              }
            }
          },
          required: [
            "url"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "server-variable": {
          type: "object",
          properties: {
            enum: {
              type: "array",
              items: {
                type: "string"
              },
              minItems: 1
            },
            default: {
              type: "string"
            },
            descriptions: {
              type: "string"
            }
          },
          required: [
            "default"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        components: {
          type: "object",
          properties: {
            schemas: {
              type: "object",
              additionalProperties: {
                $dynamicRef: "#meta"
              }
            },
            responses: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/response-or-reference"
              }
            },
            parameters: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/parameter-or-reference"
              }
            },
            examples: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/example-or-reference"
              }
            },
            requestBodies: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/request-body-or-reference"
              }
            },
            headers: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/header-or-reference"
              }
            },
            securitySchemes: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/security-scheme-or-reference"
              }
            },
            links: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/link-or-reference"
              }
            },
            callbacks: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/callbacks-or-reference"
              }
            },
            pathItems: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/path-item-or-reference"
              }
            }
          },
          patternProperties: {
            "^(schemas|responses|parameters|examples|requestBodies|headers|securitySchemes|links|callbacks|pathItems)$": {
              $comment: "Enumerating all of the property names in the regex above is necessary for unevaluatedProperties to work as expected",
              propertyNames: {
                pattern: "^[a-zA-Z0-9._-]+$"
              }
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        paths: {
          type: "object",
          patternProperties: {
            "^/": {
              $ref: "#/$defs/path-item"
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "path-item": {
          type: "object",
          properties: {
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            servers: {
              type: "array",
              items: {
                $ref: "#/$defs/server"
              }
            },
            parameters: {
              type: "array",
              items: {
                $ref: "#/$defs/parameter-or-reference"
              }
            }
          },
          patternProperties: {
            "^(get|put|post|delete|options|head|patch|trace)$": {
              $ref: "#/$defs/operation"
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "path-item-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/path-item"
          }
        },
        operation: {
          type: "object",
          properties: {
            tags: {
              type: "array",
              items: {
                type: "string"
              }
            },
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            externalDocs: {
              $ref: "#/$defs/external-documentation"
            },
            operationId: {
              type: "string"
            },
            parameters: {
              type: "array",
              items: {
                $ref: "#/$defs/parameter-or-reference"
              }
            },
            requestBody: {
              $ref: "#/$defs/request-body-or-reference"
            },
            responses: {
              $ref: "#/$defs/responses"
            },
            callbacks: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/callbacks-or-reference"
              }
            },
            deprecated: {
              default: false,
              type: "boolean"
            },
            security: {
              type: "array",
              items: {
                $ref: "#/$defs/security-requirement"
              }
            },
            servers: {
              type: "array",
              items: {
                $ref: "#/$defs/server"
              }
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "external-documentation": {
          type: "object",
          properties: {
            description: {
              type: "string"
            },
            url: {
              $ref: "#/$defs/uri"
            }
          },
          required: [
            "url"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        parameter: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            in: {
              enum: [
                "query",
                "header",
                "path",
                "cookie"
              ]
            },
            description: {
              type: "string"
            },
            required: {
              default: false,
              type: "boolean"
            },
            deprecated: {
              default: false,
              type: "boolean"
            },
            allowEmptyValue: {
              default: false,
              type: "boolean"
            },
            schema: {
              $dynamicRef: "#meta"
            },
            content: {
              $ref: "#/$defs/content"
            }
          },
          required: [
            "in"
          ],
          oneOf: [
            {
              required: [
                "schema"
              ]
            },
            {
              required: [
                "content"
              ]
            }
          ],
          dependentSchemas: {
            schema: {
              properties: {
                style: {
                  type: "string"
                },
                explode: {
                  type: "boolean"
                },
                allowReserved: {
                  default: false,
                  type: "boolean"
                }
              },
              allOf: [
                {
                  $ref: "#/$defs/examples"
                },
                {
                  $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-path"
                },
                {
                  $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-header"
                },
                {
                  $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-query"
                },
                {
                  $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-cookie"
                },
                {
                  $ref: "#/$defs/parameter/dependentSchemas/schema/$defs/styles-for-form"
                }
              ],
              $defs: {
                "styles-for-path": {
                  if: {
                    properties: {
                      in: {
                        const: "path"
                      }
                    },
                    required: [
                      "in"
                    ]
                  },
                  then: {
                    properties: {
                      style: {
                        default: "simple",
                        enum: [
                          "matrix",
                          "label",
                          "simple"
                        ]
                      },
                      required: {
                        const: true
                      }
                    },
                    required: [
                      "required"
                    ]
                  }
                },
                "styles-for-header": {
                  if: {
                    properties: {
                      in: {
                        const: "header"
                      }
                    },
                    required: [
                      "in"
                    ]
                  },
                  then: {
                    properties: {
                      style: {
                        default: "simple",
                        enum: [
                          "simple"
                        ]
                      }
                    }
                  }
                },
                "styles-for-query": {
                  if: {
                    properties: {
                      in: {
                        const: "query"
                      }
                    },
                    required: [
                      "in"
                    ]
                  },
                  then: {
                    properties: {
                      style: {
                        default: "form",
                        enum: [
                          "form",
                          "spaceDelimited",
                          "pipeDelimited",
                          "deepObject"
                        ]
                      }
                    }
                  }
                },
                "styles-for-cookie": {
                  if: {
                    properties: {
                      in: {
                        const: "cookie"
                      }
                    },
                    required: [
                      "in"
                    ]
                  },
                  then: {
                    properties: {
                      style: {
                        default: "form",
                        enum: [
                          "form"
                        ]
                      }
                    }
                  }
                },
                "styles-for-form": {
                  if: {
                    properties: {
                      style: {
                        const: "form"
                      }
                    },
                    required: [
                      "style"
                    ]
                  },
                  then: {
                    properties: {
                      explode: {
                        default: true
                      }
                    }
                  },
                  else: {
                    properties: {
                      explode: {
                        default: false
                      }
                    }
                  }
                }
              }
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "parameter-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/parameter"
          }
        },
        "request-body": {
          type: "object",
          properties: {
            description: {
              type: "string"
            },
            content: {
              $ref: "#/$defs/content"
            },
            required: {
              default: false,
              type: "boolean"
            }
          },
          required: [
            "content"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "request-body-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/request-body"
          }
        },
        content: {
          type: "object",
          additionalProperties: {
            $ref: "#/$defs/media-type"
          },
          propertyNames: {
            format: "media-range"
          }
        },
        "media-type": {
          type: "object",
          properties: {
            schema: {
              $dynamicRef: "#meta"
            },
            encoding: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/encoding"
              }
            }
          },
          allOf: [
            {
              $ref: "#/$defs/specification-extensions"
            },
            {
              $ref: "#/$defs/examples"
            }
          ],
          unevaluatedProperties: false
        },
        encoding: {
          type: "object",
          properties: {
            contentType: {
              type: "string",
              format: "media-range"
            },
            headers: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/header-or-reference"
              }
            },
            style: {
              default: "form",
              enum: [
                "form",
                "spaceDelimited",
                "pipeDelimited",
                "deepObject"
              ]
            },
            explode: {
              type: "boolean"
            },
            allowReserved: {
              default: false,
              type: "boolean"
            }
          },
          allOf: [
            {
              $ref: "#/$defs/specification-extensions"
            },
            {
              $ref: "#/$defs/encoding/$defs/explode-default"
            }
          ],
          unevaluatedProperties: false,
          $defs: {
            "explode-default": {
              if: {
                properties: {
                  style: {
                    const: "form"
                  }
                },
                required: [
                  "style"
                ]
              },
              then: {
                properties: {
                  explode: {
                    default: true
                  }
                }
              },
              else: {
                properties: {
                  explode: {
                    default: false
                  }
                }
              }
            }
          }
        },
        responses: {
          type: "object",
          properties: {
            default: {
              $ref: "#/$defs/response-or-reference"
            }
          },
          patternProperties: {
            "^[1-5][0-9X]{2}$": {
              $ref: "#/$defs/response-or-reference"
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        response: {
          type: "object",
          properties: {
            description: {
              type: "string"
            },
            headers: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/header-or-reference"
              }
            },
            content: {
              $ref: "#/$defs/content"
            },
            links: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/link-or-reference"
              }
            }
          },
          required: [
            "description"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "response-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/response"
          }
        },
        callbacks: {
          type: "object",
          $ref: "#/$defs/specification-extensions",
          additionalProperties: {
            $ref: "#/$defs/path-item-or-reference"
          }
        },
        "callbacks-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/callbacks"
          }
        },
        example: {
          type: "object",
          properties: {
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            },
            value: true,
            externalValue: {
              $ref: "#/$defs/uri"
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "example-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/example"
          }
        },
        link: {
          type: "object",
          properties: {
            operationRef: {
              $ref: "#/$defs/uri"
            },
            operationId: true,
            parameters: {
              $ref: "#/$defs/map-of-strings"
            },
            requestBody: true,
            description: {
              type: "string"
            },
            body: {
              $ref: "#/$defs/server"
            }
          },
          oneOf: [
            {
              required: [
                "operationRef"
              ]
            },
            {
              required: [
                "operationId"
              ]
            }
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "link-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/link"
          }
        },
        header: {
          type: "object",
          properties: {
            description: {
              type: "string"
            },
            required: {
              default: false,
              type: "boolean"
            },
            deprecated: {
              default: false,
              type: "boolean"
            },
            allowEmptyValue: {
              default: false,
              type: "boolean"
            }
          },
          dependentSchemas: {
            schema: {
              properties: {
                style: {
                  default: "simple",
                  enum: [
                    "simple"
                  ]
                },
                explode: {
                  default: false,
                  type: "boolean"
                },
                allowReserved: {
                  default: false,
                  type: "boolean"
                },
                schema: {
                  $dynamicRef: "#meta"
                }
              },
              $ref: "#/$defs/examples"
            },
            content: {
              properties: {
                content: {
                  $ref: "#/$defs/content"
                }
              }
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        "header-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/header"
          }
        },
        tag: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            description: {
              type: "string"
            },
            externalDocs: {
              $ref: "#/$defs/external-documentation"
            }
          },
          required: [
            "name"
          ],
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false
        },
        reference: {
          type: "object",
          properties: {
            $ref: {
              $ref: "#/$defs/uri"
            },
            summary: {
              type: "string"
            },
            description: {
              type: "string"
            }
          },
          unevaluatedProperties: false
        },
        schema: {
          $dynamicAnchor: "meta",
          type: [
            "object",
            "boolean"
          ]
        },
        "security-scheme": {
          type: "object",
          properties: {
            type: {
              enum: [
                "apiKey",
                "http",
                "mutualTLS",
                "oauth2",
                "openIdConnect"
              ]
            },
            description: {
              type: "string"
            }
          },
          required: [
            "type"
          ],
          allOf: [
            {
              $ref: "#/$defs/specification-extensions"
            },
            {
              $ref: "#/$defs/security-scheme/$defs/type-apikey"
            },
            {
              $ref: "#/$defs/security-scheme/$defs/type-http"
            },
            {
              $ref: "#/$defs/security-scheme/$defs/type-http-bearer"
            },
            {
              $ref: "#/$defs/security-scheme/$defs/type-oauth2"
            },
            {
              $ref: "#/$defs/security-scheme/$defs/type-oidc"
            }
          ],
          unevaluatedProperties: false,
          $defs: {
            "type-apikey": {
              if: {
                properties: {
                  type: {
                    const: "apiKey"
                  }
                },
                required: [
                  "type"
                ]
              },
              then: {
                properties: {
                  name: {
                    type: "string"
                  },
                  in: {
                    enum: [
                      "query",
                      "header",
                      "cookie"
                    ]
                  }
                },
                required: [
                  "name",
                  "in"
                ]
              }
            },
            "type-http": {
              if: {
                properties: {
                  type: {
                    const: "http"
                  }
                },
                required: [
                  "type"
                ]
              },
              then: {
                properties: {
                  scheme: {
                    type: "string"
                  }
                },
                required: [
                  "scheme"
                ]
              }
            },
            "type-http-bearer": {
              if: {
                properties: {
                  type: {
                    const: "http"
                  },
                  scheme: {
                    const: "bearer"
                  }
                },
                required: [
                  "type",
                  "scheme"
                ]
              },
              then: {
                properties: {
                  bearerFormat: {
                    type: "string"
                  }
                },
                required: [
                  "scheme"
                ]
              }
            },
            "type-oauth2": {
              if: {
                properties: {
                  type: {
                    const: "oauth2"
                  }
                },
                required: [
                  "type"
                ]
              },
              then: {
                properties: {
                  flows: {
                    $ref: "#/$defs/oauth-flows"
                  }
                },
                required: [
                  "flows"
                ]
              }
            },
            "type-oidc": {
              if: {
                properties: {
                  type: {
                    const: "openIdConnect"
                  }
                },
                required: [
                  "type"
                ]
              },
              then: {
                properties: {
                  openIdConnectUrl: {
                    $ref: "#/$defs/uri"
                  }
                },
                required: [
                  "openIdConnectUrl"
                ]
              }
            }
          }
        },
        "security-scheme-or-reference": {
          if: {
            required: [
              "$ref"
            ]
          },
          then: {
            $ref: "#/$defs/reference"
          },
          else: {
            $ref: "#/$defs/security-scheme"
          }
        },
        "oauth-flows": {
          type: "object",
          properties: {
            implicit: {
              $ref: "#/$defs/oauth-flows/$defs/implicit"
            },
            password: {
              $ref: "#/$defs/oauth-flows/$defs/password"
            },
            clientCredentials: {
              $ref: "#/$defs/oauth-flows/$defs/client-credentials"
            },
            authorizationCode: {
              $ref: "#/$defs/oauth-flows/$defs/authorization-code"
            }
          },
          $ref: "#/$defs/specification-extensions",
          unevaluatedProperties: false,
          $defs: {
            implicit: {
              type: "object",
              properties: {
                authorizationUrl: {
                  type: "string"
                },
                refreshUrl: {
                  type: "string"
                },
                scopes: {
                  $ref: "#/$defs/map-of-strings"
                }
              },
              required: [
                "authorizationUrl",
                "scopes"
              ],
              $ref: "#/$defs/specification-extensions",
              unevaluatedProperties: false
            },
            password: {
              type: "object",
              properties: {
                tokenUrl: {
                  type: "string"
                },
                refreshUrl: {
                  type: "string"
                },
                scopes: {
                  $ref: "#/$defs/map-of-strings"
                }
              },
              required: [
                "tokenUrl",
                "scopes"
              ],
              $ref: "#/$defs/specification-extensions",
              unevaluatedProperties: false
            },
            "client-credentials": {
              type: "object",
              properties: {
                tokenUrl: {
                  type: "string"
                },
                refreshUrl: {
                  type: "string"
                },
                scopes: {
                  $ref: "#/$defs/map-of-strings"
                }
              },
              required: [
                "tokenUrl",
                "scopes"
              ],
              $ref: "#/$defs/specification-extensions",
              unevaluatedProperties: false
            },
            "authorization-code": {
              type: "object",
              properties: {
                authorizationUrl: {
                  type: "string"
                },
                tokenUrl: {
                  type: "string"
                },
                refreshUrl: {
                  type: "string"
                },
                scopes: {
                  $ref: "#/$defs/map-of-strings"
                }
              },
              required: [
                "authorizationUrl",
                "tokenUrl",
                "scopes"
              ],
              $ref: "#/$defs/specification-extensions",
              unevaluatedProperties: false
            }
          }
        },
        "security-requirement": {
          type: "object",
          additionalProperties: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },
        "specification-extensions": {
          patternProperties: {
            "^x-": true
          }
        },
        examples: {
          properties: {
            example: true,
            examples: {
              type: "object",
              additionalProperties: {
                $ref: "#/$defs/example-or-reference"
              }
            }
          }
        },
        uri: {
          type: "string",
          format: "uri"
        },
        "map-of-strings": {
          type: "object",
          additionalProperties: {
            type: "string"
          }
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/openapi-schemas/lib/index.js
var require_lib = __commonJS({
  "../../../node_modules/@apidevtools/openapi-schemas/lib/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openapi = exports.openapiV31 = exports.openapiV3 = exports.openapiV2 = exports.openapiV1 = void 0;
    exports.openapiV1 = require_apiDeclaration();
    exports.openapiV2 = require_schema2();
    exports.openapiV3 = require_schema3();
    exports.openapiV31 = require_schema4();
    exports.openapi = {
      v1: exports.openapiV1,
      v2: exports.openapiV2,
      v3: exports.openapiV3,
      v31: exports.openapiV31
    };
    exports.default = exports.openapi;
    if (typeof module === "object" && typeof module.exports === "object") {
      module.exports = Object.assign(module.exports.default, module.exports);
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/lib/validators/schema.js
var require_schema5 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/lib/validators/schema.js"(exports, module) {
    "use strict";
    var util = require_util();
    var { ono } = require_cjs();
    var AjvDraft4 = require_dist();
    var Ajv = require__();
    var { openapi } = require_lib();
    module.exports = validateSchema;
    function validateSchema(api) {
      let ajv;
      let schema;
      if (api.swagger) {
        schema = openapi.v2;
        ajv = initializeAjv();
      } else {
        if (api.openapi.startsWith("3.1")) {
          schema = openapi.v31;
          const schemaDynamicRef = schema.$defs.schema;
          delete schemaDynamicRef.$dynamicAnchor;
          schema.$defs.components.properties.schemas.additionalProperties = schemaDynamicRef;
          schema.$defs.header.dependentSchemas.schema.properties.schema = schemaDynamicRef;
          schema.$defs["media-type"].properties.schema = schemaDynamicRef;
          schema.$defs.parameter.properties.schema = schemaDynamicRef;
          ajv = initializeAjv(false);
        } else {
          schema = openapi.v3;
          ajv = initializeAjv();
        }
      }
      let isValid = ajv.validate(schema, api);
      if (!isValid) {
        let err = ajv.errors;
        let message = "Swagger schema validation failed.\n" + formatAjvError(err);
        throw ono.syntax(err, { details: err }, message);
      }
    }
    function initializeAjv(draft04 = true) {
      const opts = {
        allErrors: true,
        strict: false,
        validateFormats: false
      };
      if (draft04) {
        return new AjvDraft4(opts);
      }
      return new Ajv(opts);
    }
    function formatAjvError(errors, indent) {
      indent = indent || "  ";
      let message = "";
      for (let error of errors) {
        message += util.format(`${indent}#${error.instancePath.length ? error.instancePath : "/"} ${error.message}
`);
      }
      return message;
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-methods/lib/index.js
var require_lib2 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-methods/lib/index.js"(exports, module) {
    "use strict";
    module.exports = [
      "get",
      "put",
      "post",
      "delete",
      "options",
      "head",
      "patch"
    ];
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/lib/validators/spec.js
var require_spec = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/lib/validators/spec.js"(exports, module) {
    "use strict";
    var util = require_util();
    var { ono } = require_cjs();
    var swaggerMethods = require_lib2();
    var primitiveTypes = ["array", "boolean", "integer", "number", "string"];
    var schemaTypes = ["array", "boolean", "integer", "number", "string", "object", "null", void 0];
    module.exports = validateSpec;
    function validateSpec(api) {
      if (api.openapi) {
        return;
      }
      let paths = Object.keys(api.paths || {});
      let operationIds = [];
      for (let pathName of paths) {
        let path = api.paths[pathName];
        let pathId = "/paths" + pathName;
        if (path && pathName.indexOf("/") === 0) {
          validatePath(api, path, pathId, operationIds);
        }
      }
      let definitions = Object.keys(api.definitions || {});
      for (let definitionName of definitions) {
        let definition = api.definitions[definitionName];
        let definitionId = "/definitions/" + definitionName;
        validateRequiredPropertiesExist(definition, definitionId);
      }
    }
    function validatePath(api, path, pathId, operationIds) {
      for (let operationName of swaggerMethods) {
        let operation = path[operationName];
        let operationId = pathId + "/" + operationName;
        if (operation) {
          let declaredOperationId = operation.operationId;
          if (declaredOperationId) {
            if (operationIds.indexOf(declaredOperationId) === -1) {
              operationIds.push(declaredOperationId);
            } else {
              throw ono.syntax(`Validation failed. Duplicate operation id '${declaredOperationId}'`);
            }
          }
          validateParameters(api, path, pathId, operation, operationId);
          let responses = Object.keys(operation.responses || {});
          for (let responseName of responses) {
            let response = operation.responses[responseName];
            let responseId = operationId + "/responses/" + responseName;
            validateResponse(responseName, response || {}, responseId);
          }
        }
      }
    }
    function validateParameters(api, path, pathId, operation, operationId) {
      let pathParams = path.parameters || [];
      let operationParams = operation.parameters || [];
      try {
        checkForDuplicates(pathParams);
      } catch (e) {
        throw ono.syntax(e, `Validation failed. ${pathId} has duplicate parameters`);
      }
      try {
        checkForDuplicates(operationParams);
      } catch (e) {
        throw ono.syntax(e, `Validation failed. ${operationId} has duplicate parameters`);
      }
      let params = pathParams.reduce((combinedParams, value) => {
        let duplicate = combinedParams.some((param) => {
          return param.in === value.in && param.name === value.name;
        });
        if (!duplicate) {
          combinedParams.push(value);
        }
        return combinedParams;
      }, operationParams.slice());
      validateBodyParameters(params, operationId);
      validatePathParameters(params, pathId, operationId);
      validateParameterTypes(params, api, operation, operationId);
    }
    function validateBodyParameters(params, operationId) {
      let bodyParams = params.filter((param) => {
        return param.in === "body";
      });
      let formParams = params.filter((param) => {
        return param.in === "formData";
      });
      if (bodyParams.length > 1) {
        throw ono.syntax(
          `Validation failed. ${operationId} has ${bodyParams.length} body parameters. Only one is allowed.`
        );
      } else if (bodyParams.length > 0 && formParams.length > 0) {
        throw ono.syntax(
          `Validation failed. ${operationId} has body parameters and formData parameters. Only one or the other is allowed.`
        );
      }
    }
    function validatePathParameters(params, pathId, operationId) {
      let placeholders = pathId.match(util.swaggerParamRegExp) || [];
      for (let i = 0; i < placeholders.length; i++) {
        for (let j = i + 1; j < placeholders.length; j++) {
          if (placeholders[i] === placeholders[j]) {
            throw ono.syntax(
              `Validation failed. ${operationId} has multiple path placeholders named ${placeholders[i]}`
            );
          }
        }
      }
      params = params.filter((param) => {
        return param.in === "path";
      });
      for (let param of params) {
        if (param.required !== true) {
          throw ono.syntax(
            `Validation failed. Path parameters cannot be optional. Set required=true for the "${param.name}" parameter at ${operationId}`
          );
        }
        let match = placeholders.indexOf("{" + param.name + "}");
        if (match === -1) {
          throw ono.syntax(
            `Validation failed. ${operationId} has a path parameter named "${param.name}", but there is no corresponding {${param.name}} in the path string`
          );
        }
        placeholders.splice(match, 1);
      }
      if (placeholders.length > 0) {
        throw ono.syntax(`Validation failed. ${operationId} is missing path parameter(s) for ${placeholders}`);
      }
    }
    function validateParameterTypes(params, api, operation, operationId) {
      for (let param of params) {
        let parameterId = operationId + "/parameters/" + param.name;
        let schema, validTypes;
        switch (param.in) {
          case "body":
            schema = param.schema;
            validTypes = schemaTypes;
            break;
          case "formData":
            schema = param;
            validTypes = primitiveTypes.concat("file");
            break;
          default:
            schema = param;
            validTypes = primitiveTypes;
        }
        validateSchema(schema, parameterId, validTypes);
        validateRequiredPropertiesExist(schema, parameterId);
        if (schema.type === "file") {
          let formData = /multipart\/(.*\+)?form-data/;
          let urlEncoded = /application\/(.*\+)?x-www-form-urlencoded/;
          let consumes = operation.consumes || api.consumes || [];
          let hasValidMimeType = consumes.some((consume) => {
            return formData.test(consume) || urlEncoded.test(consume);
          });
          if (!hasValidMimeType) {
            throw ono.syntax(
              `Validation failed. ${operationId} has a file parameter, so it must consume multipart/form-data or application/x-www-form-urlencoded`
            );
          }
        }
      }
    }
    function checkForDuplicates(params) {
      for (let i = 0; i < params.length - 1; i++) {
        let outer = params[i];
        for (let j = i + 1; j < params.length; j++) {
          let inner = params[j];
          if (outer.name === inner.name && outer.in === inner.in) {
            throw ono.syntax(`Validation failed. Found multiple ${outer.in} parameters named "${outer.name}"`);
          }
        }
      }
    }
    function validateResponse(code, response, responseId) {
      if (code !== "default" && (code < 100 || code > 599)) {
        throw ono.syntax(`Validation failed. ${responseId} has an invalid response code (${code})`);
      }
      let headers = Object.keys(response.headers || {});
      for (let headerName of headers) {
        let header = response.headers[headerName];
        let headerId = responseId + "/headers/" + headerName;
        validateSchema(header, headerId, primitiveTypes);
      }
      if (response.schema) {
        let validTypes = schemaTypes.concat("file");
        if (validTypes.indexOf(response.schema.type) === -1) {
          throw ono.syntax(
            `Validation failed. ${responseId} has an invalid response schema type (${response.schema.type})`
          );
        } else {
          validateSchema(response.schema, responseId + "/schema", validTypes);
        }
      }
    }
    function validateSchema(schema, schemaId, validTypes) {
      if (validTypes.indexOf(schema.type) === -1) {
        throw ono.syntax(
          `Validation failed. ${schemaId} has an invalid type (${schema.type})`
        );
      }
      if (schema.type === "array" && !schema.items) {
        throw ono.syntax(`Validation failed. ${schemaId} is an array, so it must include an "items" schema`);
      }
    }
    function validateRequiredPropertiesExist(schema, schemaId) {
      function collectProperties(schemaObj, props) {
        if (schemaObj.properties) {
          for (let property in schemaObj.properties) {
            if (schemaObj.properties.hasOwnProperty(property)) {
              props[property] = schemaObj.properties[property];
            }
          }
        }
        if (schemaObj.allOf) {
          for (let parent of schemaObj.allOf) {
            collectProperties(parent, props);
          }
        }
      }
      if (Array.isArray(schema.type) && !schema.type.includes("object")) {
        return;
      } else if (!Array.isArray(schema.type) && schema.type !== "object") {
        return;
      }
      if (schema.required && Array.isArray(schema.required)) {
        let props = {};
        collectProperties(schema, props);
        for (let requiredProperty of schema.required) {
          if (!props[requiredProperty]) {
            throw ono.syntax(
              `Validation failed. Property '${requiredProperty}' listed as required but does not exist in '${schemaId}'`
            );
          }
        }
      }
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/convert-path-to-posix.js
var require_convert_path_to_posix = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/convert-path-to-posix.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = convertPathToPosix;
    var path_1 = __importDefault(__require("path"));
    function convertPathToPosix(filePath) {
      const isExtendedLengthPath = filePath.startsWith("\\\\?\\");
      if (isExtendedLengthPath) {
        return filePath;
      }
      return filePath.split(path_1.default?.win32?.sep).join(path_1.default?.posix?.sep ?? "/");
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/is-windows.js
var require_is_windows = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/is-windows.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isWindows = void 0;
    var isWindowsConst = /^win/.test(globalThis.process ? globalThis.process.platform : "");
    var isWindows = () => isWindowsConst;
    exports.isWindows = isWindows;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/url.js
var require_url = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/url.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parse = void 0;
    exports.resolve = resolve2;
    exports.cwd = cwd;
    exports.getProtocol = getProtocol;
    exports.getExtension = getExtension;
    exports.stripQuery = stripQuery;
    exports.getHash = getHash;
    exports.stripHash = stripHash;
    exports.isHttp = isHttp;
    exports.isFileSystemPath = isFileSystemPath;
    exports.fromFileSystemPath = fromFileSystemPath;
    exports.toFileSystemPath = toFileSystemPath;
    exports.safePointerToPath = safePointerToPath;
    exports.relative = relative2;
    var convert_path_to_posix_1 = __importDefault(require_convert_path_to_posix());
    var path_1 = __importStar(__require("path"));
    var forwardSlashPattern = /\//g;
    var protocolPattern = /^(\w{2,}):\/\//i;
    var jsonPointerSlash = /~1/g;
    var jsonPointerTilde = /~0/g;
    var path_2 = __require("path");
    var is_windows_1 = require_is_windows();
    var urlEncodePatterns = [
      [/\?/g, "%3F"],
      [/#/g, "%23"]
    ];
    var urlDecodePatterns = [/%23/g, "#", /%24/g, "$", /%26/g, "&", /%2C/g, ",", /%40/g, "@"];
    var parse = (u) => new URL(u);
    exports.parse = parse;
    function resolve2(from, to) {
      const fromUrl = new URL((0, convert_path_to_posix_1.default)(from), "resolve://");
      const resolvedUrl = new URL((0, convert_path_to_posix_1.default)(to), fromUrl);
      const endSpaces = to.match(/(\s*)$/)?.[1] || "";
      if (resolvedUrl.protocol === "resolve:") {
        const { pathname, search, hash } = resolvedUrl;
        return pathname + search + hash + endSpaces;
      }
      return resolvedUrl.toString() + endSpaces;
    }
    function cwd() {
      if (typeof window !== "undefined") {
        return location.href;
      }
      const path = process.cwd();
      const lastChar = path.slice(-1);
      if (lastChar === "/" || lastChar === "\\") {
        return path;
      } else {
        return path + "/";
      }
    }
    function getProtocol(path) {
      const match = protocolPattern.exec(path || "");
      if (match) {
        return match[1].toLowerCase();
      }
      return void 0;
    }
    function getExtension(path) {
      const lastDot = path.lastIndexOf(".");
      if (lastDot >= 0) {
        return stripQuery(path.substr(lastDot).toLowerCase());
      }
      return "";
    }
    function stripQuery(path) {
      const queryIndex = path.indexOf("?");
      if (queryIndex >= 0) {
        path = path.substr(0, queryIndex);
      }
      return path;
    }
    function getHash(path) {
      if (!path) {
        return "#";
      }
      const hashIndex = path.indexOf("#");
      if (hashIndex >= 0) {
        return path.substring(hashIndex);
      }
      return "#";
    }
    function stripHash(path) {
      if (!path) {
        return "";
      }
      const hashIndex = path.indexOf("#");
      if (hashIndex >= 0) {
        path = path.substring(0, hashIndex);
      }
      return path;
    }
    function isHttp(path) {
      const protocol = getProtocol(path);
      if (protocol === "http" || protocol === "https") {
        return true;
      } else if (protocol === void 0) {
        return typeof window !== "undefined";
      } else {
        return false;
      }
    }
    function isFileSystemPath(path) {
      if (typeof window !== "undefined" || typeof process !== "undefined" && process.browser) {
        return false;
      }
      const protocol = getProtocol(path);
      return protocol === void 0 || protocol === "file";
    }
    function fromFileSystemPath(path) {
      if ((0, is_windows_1.isWindows)()) {
        const projectDir = cwd();
        const upperPath = path.toUpperCase();
        const projectDirPosixPath = (0, convert_path_to_posix_1.default)(projectDir);
        const posixUpper = projectDirPosixPath.toUpperCase();
        const hasProjectDir = upperPath.includes(posixUpper);
        const hasProjectUri = upperPath.includes(posixUpper);
        const isAbsolutePath = path_1.win32?.isAbsolute(path) || path.startsWith("http://") || path.startsWith("https://") || path.startsWith("file://");
        if (!(hasProjectDir || hasProjectUri || isAbsolutePath) && !projectDir.startsWith("http")) {
          path = (0, path_2.join)(projectDir, path);
        }
        path = (0, convert_path_to_posix_1.default)(path);
      }
      path = encodeURI(path);
      for (const pattern of urlEncodePatterns) {
        path = path.replace(pattern[0], pattern[1]);
      }
      return path;
    }
    function toFileSystemPath(path, keepFileProtocol) {
      path = decodeURI(path);
      for (let i = 0; i < urlDecodePatterns.length; i += 2) {
        path = path.replace(urlDecodePatterns[i], urlDecodePatterns[i + 1]);
      }
      let isFileUrl = path.substr(0, 7).toLowerCase() === "file://";
      if (isFileUrl) {
        path = path[7] === "/" ? path.substr(8) : path.substr(7);
        if ((0, is_windows_1.isWindows)() && path[1] === "/") {
          path = path[0] + ":" + path.substr(1);
        }
        if (keepFileProtocol) {
          path = "file:///" + path;
        } else {
          isFileUrl = false;
          path = (0, is_windows_1.isWindows)() ? path : "/" + path;
        }
      }
      if ((0, is_windows_1.isWindows)() && !isFileUrl) {
        path = path.replace(forwardSlashPattern, "\\");
        if (path.substr(1, 2) === ":\\") {
          path = path[0].toUpperCase() + path.substr(1);
        }
      }
      return path;
    }
    function safePointerToPath(pointer) {
      if (pointer.length <= 1 || pointer[0] !== "#" || pointer[1] !== "/") {
        return [];
      }
      return pointer.slice(2).split("/").map((value) => {
        return decodeURIComponent(value).replace(jsonPointerSlash, "/").replace(jsonPointerTilde, "~");
      });
    }
    function relative2(from, to) {
      if (!isFileSystemPath(from) || !isFileSystemPath(to)) {
        return resolve2(from, to);
      }
      const fromDir = path_1.default.dirname(stripHash(from));
      const toPath = stripHash(to);
      const result = path_1.default.relative(fromDir, toPath);
      return result + getHash(to);
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/errors.js
var require_errors2 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InvalidPointerError = exports.TimeoutError = exports.MissingPointerError = exports.UnmatchedResolverError = exports.ResolverError = exports.UnmatchedParserError = exports.ParserError = exports.JSONParserErrorGroup = exports.JSONParserError = void 0;
    exports.isHandledError = isHandledError;
    exports.normalizeError = normalizeError;
    var ono_1 = require_cjs();
    var url_js_1 = require_url();
    var JSONParserError = class extends Error {
      constructor(message, source) {
        super();
        this.code = "EUNKNOWN";
        this.name = "JSONParserError";
        this.message = message;
        this.source = source;
        this.path = null;
        ono_1.Ono.extend(this);
      }
      get footprint() {
        return `${this.path}+${this.source}+${this.code}+${this.message}`;
      }
    };
    exports.JSONParserError = JSONParserError;
    var JSONParserErrorGroup = class _JSONParserErrorGroup extends Error {
      constructor(parser) {
        super();
        this.files = parser;
        this.name = "JSONParserErrorGroup";
        this.message = `${this.errors.length} error${this.errors.length > 1 ? "s" : ""} occurred while reading '${(0, url_js_1.toFileSystemPath)(parser.$refs._root$Ref.path)}'`;
        ono_1.Ono.extend(this);
      }
      static getParserErrors(parser) {
        const errors = [];
        for (const $ref of Object.values(parser.$refs._$refs)) {
          if ($ref.errors) {
            errors.push(...$ref.errors);
          }
        }
        return errors;
      }
      get errors() {
        return _JSONParserErrorGroup.getParserErrors(this.files);
      }
    };
    exports.JSONParserErrorGroup = JSONParserErrorGroup;
    var ParserError = class extends JSONParserError {
      constructor(message, source) {
        super(`Error parsing ${source}: ${message}`, source);
        this.code = "EPARSER";
        this.name = "ParserError";
      }
    };
    exports.ParserError = ParserError;
    var UnmatchedParserError = class extends JSONParserError {
      constructor(source) {
        super(`Could not find parser for "${source}"`, source);
        this.code = "EUNMATCHEDPARSER";
        this.name = "UnmatchedParserError";
      }
    };
    exports.UnmatchedParserError = UnmatchedParserError;
    var ResolverError = class extends JSONParserError {
      constructor(ex, source) {
        super(ex.message || `Error reading file "${source}"`, source);
        this.code = "ERESOLVER";
        this.name = "ResolverError";
        if ("code" in ex) {
          this.ioErrorCode = String(ex.code);
        }
      }
    };
    exports.ResolverError = ResolverError;
    var UnmatchedResolverError = class extends JSONParserError {
      constructor(source) {
        super(`Could not find resolver for "${source}"`, source);
        this.code = "EUNMATCHEDRESOLVER";
        this.name = "UnmatchedResolverError";
      }
    };
    exports.UnmatchedResolverError = UnmatchedResolverError;
    var MissingPointerError = class extends JSONParserError {
      constructor(token, path) {
        super(`Token "${token}" does not exist.`, (0, url_js_1.stripHash)(path));
        this.code = "EUNMATCHEDRESOLVER";
        this.name = "MissingPointerError";
      }
    };
    exports.MissingPointerError = MissingPointerError;
    var TimeoutError = class extends JSONParserError {
      constructor(timeout) {
        super(`Dereferencing timeout reached: ${timeout}ms`);
        this.code = "ETIMEOUT";
        this.name = "TimeoutError";
      }
    };
    exports.TimeoutError = TimeoutError;
    var InvalidPointerError = class extends JSONParserError {
      constructor(pointer, path) {
        super(`Invalid $ref pointer "${pointer}". Pointers must begin with "#/"`, (0, url_js_1.stripHash)(path));
        this.code = "EUNMATCHEDRESOLVER";
        this.name = "InvalidPointerError";
      }
    };
    exports.InvalidPointerError = InvalidPointerError;
    function isHandledError(err) {
      return err instanceof JSONParserError || err instanceof JSONParserErrorGroup;
    }
    function normalizeError(err) {
      if (err.path === null) {
        err.path = [];
      }
      return err;
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/pointer.js
var require_pointer = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/pointer.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ref_js_1 = __importDefault(require_ref2());
    var url = __importStar(require_url());
    var errors_js_1 = require_errors2();
    var slashes = /\//g;
    var tildes = /~/g;
    var escapedSlash = /~1/g;
    var escapedTilde = /~0/g;
    var safeDecodeURIComponent = (encodedURIComponent) => {
      try {
        return decodeURIComponent(encodedURIComponent);
      } catch {
        return encodedURIComponent;
      }
    };
    var Pointer = class _Pointer {
      constructor($ref, path, friendlyPath) {
        this.$ref = $ref;
        this.path = path;
        this.originalPath = friendlyPath || path;
        this.value = void 0;
        this.circular = false;
        this.indirections = 0;
      }
      /**
       * Resolves the value of a nested property within the given object.
       *
       * @param obj - The object that will be crawled
       * @param options
       * @param pathFromRoot - the path of place that initiated resolving
       *
       * @returns
       * Returns a JSON pointer whose {@link Pointer#value} is the resolved value.
       * If resolving this value required resolving other JSON references, then
       * the {@link Pointer#$ref} and {@link Pointer#path} will reflect the resolution path
       * of the resolved value.
       */
      resolve(obj, options, pathFromRoot) {
        const tokens = _Pointer.parse(this.path, this.originalPath);
        this.value = unwrapOrThrow(obj);
        for (let i = 0; i < tokens.length; i++) {
          if (resolveIf$Ref(this, options, pathFromRoot)) {
            this.path = _Pointer.join(this.path, tokens.slice(i));
          }
          if (typeof this.value === "object" && this.value !== null && !isRootPath(pathFromRoot) && "$ref" in this.value) {
            return this;
          }
          const token = tokens[i];
          if (this.value[token] === void 0 || this.value[token] === null && i === tokens.length - 1) {
            let didFindSubstringSlashMatch = false;
            for (let j = tokens.length - 1; j > i; j--) {
              const joinedToken = tokens.slice(i, j + 1).join("/");
              if (this.value[joinedToken] !== void 0) {
                this.value = this.value[joinedToken];
                i = j;
                didFindSubstringSlashMatch = true;
                break;
              }
            }
            if (didFindSubstringSlashMatch) {
              continue;
            }
            this.value = null;
            throw new errors_js_1.MissingPointerError(token, decodeURI(this.originalPath));
          } else {
            this.value = this.value[token];
          }
        }
        if (!this.value || this.value.$ref && url.resolve(this.path, this.value.$ref) !== pathFromRoot) {
          resolveIf$Ref(this, options, pathFromRoot);
        }
        return this;
      }
      /**
       * Sets the value of a nested property within the given object.
       *
       * @param obj - The object that will be crawled
       * @param value - the value to assign
       * @param options
       *
       * @returns
       * Returns the modified object, or an entirely new object if the entire object is overwritten.
       */
      set(obj, value, options) {
        const tokens = _Pointer.parse(this.path);
        let token;
        if (tokens.length === 0) {
          this.value = value;
          return value;
        }
        this.value = unwrapOrThrow(obj);
        for (let i = 0; i < tokens.length - 1; i++) {
          resolveIf$Ref(this, options);
          token = tokens[i];
          if (this.value && this.value[token] !== void 0) {
            this.value = this.value[token];
          } else {
            this.value = setValue(this, token, {});
          }
        }
        resolveIf$Ref(this, options);
        token = tokens[tokens.length - 1];
        setValue(this, token, value);
        return obj;
      }
      /**
       * Parses a JSON pointer (or a path containing a JSON pointer in the hash)
       * and returns an array of the pointer's tokens.
       * (e.g. "schema.json#/definitions/person/name" => ["definitions", "person", "name"])
       *
       * The pointer is parsed according to RFC 6901
       * {@link https://tools.ietf.org/html/rfc6901#section-3}
       *
       * @param path
       * @param [originalPath]
       * @returns
       */
      static parse(path, originalPath) {
        const pointer = url.getHash(path).substring(1);
        if (!pointer) {
          return [];
        }
        const split = pointer.split("/");
        for (let i = 0; i < split.length; i++) {
          split[i] = safeDecodeURIComponent(split[i].replace(escapedSlash, "/").replace(escapedTilde, "~"));
        }
        if (split[0] !== "") {
          throw new errors_js_1.InvalidPointerError(split, originalPath === void 0 ? path : originalPath);
        }
        return split.slice(1);
      }
      /**
       * Creates a JSON pointer path, by joining one or more tokens to a base path.
       *
       * @param base - The base path (e.g. "schema.json#/definitions/person")
       * @param tokens - The token(s) to append (e.g. ["name", "first"])
       * @returns
       */
      static join(base, tokens) {
        if (base.indexOf("#") === -1) {
          base += "#";
        }
        tokens = Array.isArray(tokens) ? tokens : [tokens];
        for (let i = 0; i < tokens.length; i++) {
          const token = tokens[i];
          base += "/" + encodeURIComponent(token.replace(tildes, "~0").replace(slashes, "~1"));
        }
        return base;
      }
    };
    function resolveIf$Ref(pointer, options, pathFromRoot) {
      if (ref_js_1.default.isAllowed$Ref(pointer.value, options)) {
        const $refPath = url.resolve(pointer.path, pointer.value.$ref);
        if ($refPath === pointer.path && !isRootPath(pathFromRoot)) {
          pointer.circular = true;
        } else {
          const resolved = pointer.$ref.$refs._resolve($refPath, pointer.path, options);
          if (resolved === null) {
            return false;
          }
          pointer.indirections += resolved.indirections + 1;
          if (ref_js_1.default.isExtended$Ref(pointer.value)) {
            pointer.value = ref_js_1.default.dereference(pointer.value, resolved.value);
            return false;
          } else {
            pointer.$ref = resolved.$ref;
            pointer.path = resolved.path;
            pointer.value = resolved.value;
          }
          return true;
        }
      }
      return void 0;
    }
    exports.default = Pointer;
    function setValue(pointer, token, value) {
      if (pointer.value && typeof pointer.value === "object") {
        if (token === "-" && Array.isArray(pointer.value)) {
          pointer.value.push(value);
        } else {
          pointer.value[token] = value;
        }
      } else {
        throw new errors_js_1.JSONParserError(`Error assigning $ref pointer "${pointer.path}". 
Cannot set "${token}" of a non-object.`);
      }
      return value;
    }
    function unwrapOrThrow(value) {
      if ((0, errors_js_1.isHandledError)(value)) {
        throw value;
      }
      return value;
    }
    function isRootPath(pathFromRoot) {
      return typeof pathFromRoot == "string" && Pointer.parse(pathFromRoot).length == 0;
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/ref.js
var require_ref2 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/ref.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var pointer_js_1 = __importDefault(require_pointer());
    var errors_js_1 = require_errors2();
    var url_js_1 = require_url();
    var $Ref = class _$Ref {
      constructor($refs) {
        this.errors = [];
        this.$refs = $refs;
      }
      /**
       * Pushes an error to errors array.
       *
       * @param err - The error to be pushed
       * @returns
       */
      addError(err) {
        if (this.errors === void 0) {
          this.errors = [];
        }
        const existingErrors = this.errors.map(({ footprint }) => footprint);
        if ("errors" in err && Array.isArray(err.errors)) {
          this.errors.push(...err.errors.map(errors_js_1.normalizeError).filter(({ footprint }) => !existingErrors.includes(footprint)));
        } else if (!("footprint" in err) || !existingErrors.includes(err.footprint)) {
          this.errors.push((0, errors_js_1.normalizeError)(err));
        }
      }
      /**
       * Determines whether the given JSON reference exists within this {@link $Ref#value}.
       *
       * @param path - The full path being resolved, optionally with a JSON pointer in the hash
       * @param options
       * @returns
       */
      exists(path, options) {
        try {
          this.resolve(path, options);
          return true;
        } catch {
          return false;
        }
      }
      /**
       * Resolves the given JSON reference within this {@link $Ref#value} and returns the resolved value.
       *
       * @param path - The full path being resolved, optionally with a JSON pointer in the hash
       * @param options
       * @returns - Returns the resolved value
       */
      get(path, options) {
        return this.resolve(path, options)?.value;
      }
      /**
       * Resolves the given JSON reference within this {@link $Ref#value}.
       *
       * @param path - The full path being resolved, optionally with a JSON pointer in the hash
       * @param options
       * @param friendlyPath - The original user-specified path (used for error messages)
       * @param pathFromRoot - The path of `obj` from the schema root
       * @returns
       */
      resolve(path, options, friendlyPath, pathFromRoot) {
        const pointer = new pointer_js_1.default(this, path, friendlyPath);
        try {
          return pointer.resolve(this.value, options, pathFromRoot);
        } catch (err) {
          if (!options || !options.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
            throw err;
          }
          if (err.path === null) {
            err.path = (0, url_js_1.safePointerToPath)((0, url_js_1.getHash)(pathFromRoot));
          }
          if (err instanceof errors_js_1.InvalidPointerError) {
            err.source = decodeURI((0, url_js_1.stripHash)(pathFromRoot));
          }
          this.addError(err);
          return null;
        }
      }
      /**
       * Sets the value of a nested property within this {@link $Ref#value}.
       * If the property, or any of its parents don't exist, they will be created.
       *
       * @param path - The full path of the property to set, optionally with a JSON pointer in the hash
       * @param value - The value to assign
       */
      set(path, value) {
        const pointer = new pointer_js_1.default(this, path);
        this.value = pointer.set(this.value, value);
      }
      /**
       * Determines whether the given value is a JSON reference.
       *
       * @param value - The value to inspect
       * @returns
       */
      static is$Ref(value) {
        return Boolean(value) && typeof value === "object" && value !== null && "$ref" in value && typeof value.$ref === "string" && value.$ref.length > 0;
      }
      /**
       * Determines whether the given value is an external JSON reference.
       *
       * @param value - The value to inspect
       * @returns
       */
      static isExternal$Ref(value) {
        return _$Ref.is$Ref(value) && value.$ref[0] !== "#";
      }
      /**
       * Determines whether the given value is a JSON reference, and whether it is allowed by the options.
       * For example, if it references an external file, then options.resolve.external must be true.
       *
       * @param value - The value to inspect
       * @param options
       * @returns
       */
      static isAllowed$Ref(value, options) {
        if (this.is$Ref(value)) {
          if (value.$ref.substring(0, 2) === "#/" || value.$ref === "#") {
            return true;
          } else if (value.$ref[0] !== "#" && (!options || options.resolve?.external)) {
            return true;
          }
        }
        return void 0;
      }
      /**
       * Determines whether the given value is a JSON reference that "extends" its resolved value.
       * That is, it has extra properties (in addition to "$ref"), so rather than simply pointing to
       * an existing value, this $ref actually creates a NEW value that is a shallow copy of the resolved
       * value, plus the extra properties.
       *
       * @example: {
         person: {
           properties: {
             firstName: { type: string }
             lastName: { type: string }
           }
         }
         employee: {
           properties: {
             $ref: #/person/properties
             salary: { type: number }
           }
         }
       }
       *  In this example, "employee" is an extended $ref, since it extends "person" with an additional
       *  property (salary).  The result is a NEW value that looks like this:
       *
       *  {
       *    properties: {
       *      firstName: { type: string }
       *      lastName: { type: string }
       *      salary: { type: number }
       *    }
       *  }
       *
       * @param value - The value to inspect
       * @returns
       */
      static isExtended$Ref(value) {
        return _$Ref.is$Ref(value) && Object.keys(value).length > 1;
      }
      /**
       * Returns the resolved value of a JSON Reference.
       * If necessary, the resolved value is merged with the JSON Reference to create a new object
       *
       * @example: {
      person: {
        properties: {
          firstName: { type: string }
          lastName: { type: string }
        }
      }
      employee: {
        properties: {
          $ref: #/person/properties
          salary: { type: number }
        }
      }
      } When "person" and "employee" are merged, you end up with the following object:
       *
       *  {
       *    properties: {
       *      firstName: { type: string }
       *      lastName: { type: string }
       *      salary: { type: number }
       *    }
       *  }
       *
       * @param $ref - The JSON reference object (the one with the "$ref" property)
       * @param resolvedValue - The resolved value, which can be any type
       * @returns - Returns the dereferenced value
       */
      static dereference($ref, resolvedValue) {
        if (resolvedValue && typeof resolvedValue === "object" && _$Ref.isExtended$Ref($ref)) {
          const merged = {};
          for (const key of Object.keys($ref)) {
            if (key !== "$ref") {
              merged[key] = $ref[key];
            }
          }
          for (const key of Object.keys(resolvedValue)) {
            if (!(key in merged)) {
              merged[key] = resolvedValue[key];
            }
          }
          return merged;
        } else {
          return resolvedValue;
        }
      }
    };
    exports.default = $Ref;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/refs.js
var require_refs = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/refs.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ono_1 = require_cjs();
    var ref_js_1 = __importDefault(require_ref2());
    var url = __importStar(require_url());
    var convert_path_to_posix_1 = __importDefault(require_convert_path_to_posix());
    var $Refs = class {
      /**
       * Returns the paths/URLs of all the files in your schema (including the main schema file).
       *
       * See https://apitools.dev/json-schema-ref-parser/docs/refs.html#pathstypes
       *
       * @param types (optional) Optionally only return certain types of paths ("file", "http", etc.)
       */
      paths(...types) {
        const paths = getPaths(this._$refs, types.flat());
        return paths.map((path) => {
          return (0, convert_path_to_posix_1.default)(path.decoded);
        });
      }
      /**
       * Returns a map of paths/URLs and their correspond values.
       *
       * See https://apitools.dev/json-schema-ref-parser/docs/refs.html#valuestypes
       *
       * @param types (optional) Optionally only return values from certain locations ("file", "http", etc.)
       */
      values(...types) {
        const $refs = this._$refs;
        const paths = getPaths($refs, types.flat());
        return paths.reduce((obj, path) => {
          obj[(0, convert_path_to_posix_1.default)(path.decoded)] = $refs[path.encoded].value;
          return obj;
        }, {});
      }
      /**
       * Returns `true` if the given path exists in the schema; otherwise, returns `false`
       *
       * See https://apitools.dev/json-schema-ref-parser/docs/refs.html#existsref
       *
       * @param $ref The JSON Reference path, optionally with a JSON Pointer in the hash
       */
      /**
       * Determines whether the given JSON reference exists.
       *
       * @param path - The path being resolved, optionally with a JSON pointer in the hash
       * @param [options]
       * @returns
       */
      exists(path, options) {
        try {
          this._resolve(path, "", options);
          return true;
        } catch {
          return false;
        }
      }
      /**
       * Resolves the given JSON reference and returns the resolved value.
       *
       * @param path - The path being resolved, with a JSON pointer in the hash
       * @param [options]
       * @returns - Returns the resolved value
       */
      get(path, options) {
        return this._resolve(path, "", options).value;
      }
      /**
       * Sets the value at the given path in the schema. If the property, or any of its parents, don't exist, they will be created.
       *
       * @param path The JSON Reference path, optionally with a JSON Pointer in the hash
       * @param value The value to assign. Can be anything (object, string, number, etc.)
       */
      set(path, value) {
        const absPath = url.resolve(this._root$Ref.path, path);
        const withoutHash = url.stripHash(absPath);
        const $ref = this._$refs[withoutHash];
        if (!$ref) {
          throw (0, ono_1.ono)(`Error resolving $ref pointer "${path}". 
"${withoutHash}" not found.`);
        }
        $ref.set(absPath, value);
      }
      /**
       * Returns the specified {@link $Ref} object, or undefined.
       *
       * @param path - The path being resolved, optionally with a JSON pointer in the hash
       * @returns
       * @protected
       */
      _get$Ref(path) {
        path = url.resolve(this._root$Ref.path, path);
        const withoutHash = url.stripHash(path);
        return this._$refs[withoutHash];
      }
      /**
       * Creates a new {@link $Ref} object and adds it to this {@link $Refs} object.
       *
       * @param path  - The file path or URL of the referenced file
       */
      _add(path) {
        const withoutHash = url.stripHash(path);
        const $ref = new ref_js_1.default(this);
        $ref.path = withoutHash;
        this._$refs[withoutHash] = $ref;
        this._root$Ref = this._root$Ref || $ref;
        return $ref;
      }
      /**
       * Resolves the given JSON reference.
       *
       * @param path - The path being resolved, optionally with a JSON pointer in the hash
       * @param pathFromRoot - The path of `obj` from the schema root
       * @param [options]
       * @returns
       * @protected
       */
      _resolve(path, pathFromRoot, options) {
        const absPath = url.resolve(this._root$Ref.path, path);
        const withoutHash = url.stripHash(absPath);
        const $ref = this._$refs[withoutHash];
        if (!$ref) {
          throw (0, ono_1.ono)(`Error resolving $ref pointer "${path}". 
"${withoutHash}" not found.`);
        }
        return $ref.resolve(absPath, options, path, pathFromRoot);
      }
      constructor() {
        this._$refs = {};
        this.toJSON = this.values;
        this.circular = false;
        this._$refs = {};
        this._root$Ref = null;
      }
    };
    exports.default = $Refs;
    function getPaths($refs, types) {
      let paths = Object.keys($refs);
      types = Array.isArray(types[0]) ? types[0] : Array.prototype.slice.call(types);
      if (types.length > 0 && types[0]) {
        paths = paths.filter((key) => {
          return types.includes($refs[key].pathType);
        });
      }
      return paths.map((path) => {
        return {
          encoded: path,
          decoded: $refs[path].pathType === "file" ? url.toFileSystemPath(path, true) : path
        };
      });
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/plugins.js
var require_plugins = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/plugins.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.all = all;
    exports.filter = filter;
    exports.sort = sort;
    exports.run = run;
    function all(plugins) {
      return Object.keys(plugins || {}).filter((key) => {
        return typeof plugins[key] === "object";
      }).map((key) => {
        plugins[key].name = key;
        return plugins[key];
      });
    }
    function filter(plugins, method, file) {
      return plugins.filter((plugin) => {
        return !!getResult(plugin, method, file);
      });
    }
    function sort(plugins) {
      for (const plugin of plugins) {
        plugin.order = plugin.order || Number.MAX_SAFE_INTEGER;
      }
      return plugins.sort((a, b) => {
        return a.order - b.order;
      });
    }
    async function run(plugins, method, file, $refs) {
      let plugin;
      let lastError;
      let index = 0;
      return new Promise((resolve2, reject) => {
        runNextPlugin();
        function runNextPlugin() {
          plugin = plugins[index++];
          if (!plugin) {
            return reject(lastError);
          }
          try {
            const result = getResult(plugin, method, file, callback, $refs);
            if (result && typeof result.then === "function") {
              result.then(onSuccess, onError);
            } else if (result !== void 0) {
              onSuccess(result);
            } else if (index === plugins.length) {
              throw new Error("No promise has been returned or callback has been called.");
            }
          } catch (e) {
            onError(e);
          }
        }
        function callback(err, result) {
          if (err) {
            onError(err);
          } else {
            onSuccess(result);
          }
        }
        function onSuccess(result) {
          resolve2({
            plugin,
            result
          });
        }
        function onError(error) {
          lastError = {
            plugin,
            error
          };
          runNextPlugin();
        }
      });
    }
    function getResult(obj, prop, file, callback, $refs) {
      const value = obj[prop];
      if (typeof value === "function") {
        return value.apply(obj, [file, callback, $refs]);
      }
      if (!callback) {
        if (value instanceof RegExp) {
          return value.test(file.url);
        } else if (typeof value === "string") {
          return value === file.extension;
        } else if (Array.isArray(value)) {
          return value.indexOf(file.extension) !== -1;
        }
      }
      return value;
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parse.js
var require_parse = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parse.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ono_1 = require_cjs();
    var url = __importStar(require_url());
    var plugins = __importStar(require_plugins());
    var errors_js_1 = require_errors2();
    async function parse(path, $refs, options) {
      const hashIndex = path.indexOf("#");
      let hash = "";
      if (hashIndex >= 0) {
        hash = path.substring(hashIndex);
        path = path.substring(0, hashIndex);
      }
      const $ref = $refs._add(path);
      const file = {
        url: path,
        hash,
        extension: url.getExtension(path)
      };
      try {
        const resolver = await readFile2(file, options, $refs);
        $ref.pathType = resolver.plugin.name;
        file.data = resolver.result;
        const parser = await parseFile(file, options, $refs);
        $ref.value = parser.result;
        return parser.result;
      } catch (err) {
        if ((0, errors_js_1.isHandledError)(err)) {
          $ref.value = err;
        }
        throw err;
      }
    }
    async function readFile2(file, options, $refs) {
      let resolvers = plugins.all(options.resolve);
      resolvers = plugins.filter(resolvers, "canRead", file);
      plugins.sort(resolvers);
      try {
        const data = await plugins.run(resolvers, "read", file, $refs);
        return data;
      } catch (err) {
        if (!err && options.continueOnError) {
          throw new errors_js_1.UnmatchedResolverError(file.url);
        } else if (!err || !("error" in err)) {
          throw ono_1.ono.syntax(`Unable to resolve $ref pointer "${file.url}"`);
        } else if (err.error instanceof errors_js_1.ResolverError) {
          throw err.error;
        } else {
          throw new errors_js_1.ResolverError(err, file.url);
        }
      }
    }
    async function parseFile(file, options, $refs) {
      const allParsers = plugins.all(options.parse);
      const filteredParsers = plugins.filter(allParsers, "canParse", file);
      const parsers = filteredParsers.length > 0 ? filteredParsers : allParsers;
      plugins.sort(parsers);
      try {
        const parser = await plugins.run(parsers, "parse", file, $refs);
        if (!parser.plugin.allowEmpty && isEmpty(parser.result)) {
          throw ono_1.ono.syntax(`Error parsing "${file.url}" as ${parser.plugin.name}. 
Parsed value is empty`);
        } else {
          return parser;
        }
      } catch (err) {
        if (!err && options.continueOnError) {
          throw new errors_js_1.UnmatchedParserError(file.url);
        } else if (err && err.message && err.message.startsWith("Error parsing")) {
          throw err;
        } else if (!err || !("error" in err)) {
          throw ono_1.ono.syntax(`Unable to parse ${file.url}`);
        } else if (err.error instanceof errors_js_1.ParserError) {
          throw err.error;
        } else {
          throw new errors_js_1.ParserError(err.error.message, file.url);
        }
      }
    }
    function isEmpty(value) {
      return value === void 0 || typeof value === "object" && Object.keys(value).length === 0 || typeof value === "string" && value.trim().length === 0 || Buffer.isBuffer(value) && value.length === 0;
    }
    exports.default = parse;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/json.js
var require_json = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/json.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    exports.default = {
      /**
       * The order that this parser will run, in relation to other parsers.
       */
      order: 100,
      /**
       * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
       */
      allowEmpty: true,
      /**
       * Determines whether this parser can parse a given file reference.
       * Parsers that match will be tried, in order, until one successfully parses the file.
       * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
       * every parser will be tried.
       */
      canParse: ".json",
      /**
       * Allow JSON files with byte order marks (BOM)
       */
      allowBOM: true,
      /**
       * Parses the given file as JSON
       */
      async parse(file) {
        let data = file.data;
        if (Buffer.isBuffer(data)) {
          data = data.toString();
        }
        if (typeof data === "string") {
          if (data.trim().length === 0) {
            return;
          } else {
            try {
              return JSON.parse(data);
            } catch (e) {
              if (this.allowBOM) {
                try {
                  const firstCurlyBrace = data.indexOf("{");
                  data = data.slice(firstCurlyBrace);
                  return JSON.parse(data);
                } catch (e2) {
                  throw new errors_js_1.ParserError(e2.message, file.url);
                }
              }
              throw new errors_js_1.ParserError(e.message, file.url);
            }
          }
        } else {
          return data;
        }
      }
    };
  }
});

// ../../../node_modules/js-yaml/lib/common.js
var require_common = __commonJS({
  "../../../node_modules/js-yaml/lib/common.js"(exports, module) {
    "use strict";
    function isNothing(subject) {
      return typeof subject === "undefined" || subject === null;
    }
    function isObject(subject) {
      return typeof subject === "object" && subject !== null;
    }
    function toArray(sequence) {
      if (Array.isArray(sequence)) return sequence;
      else if (isNothing(sequence)) return [];
      return [sequence];
    }
    function extend(target, source) {
      var index, length, key, sourceKeys;
      if (source) {
        sourceKeys = Object.keys(source);
        for (index = 0, length = sourceKeys.length; index < length; index += 1) {
          key = sourceKeys[index];
          target[key] = source[key];
        }
      }
      return target;
    }
    function repeat(string, count) {
      var result = "", cycle;
      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }
      return result;
    }
    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }
    module.exports.isNothing = isNothing;
    module.exports.isObject = isObject;
    module.exports.toArray = toArray;
    module.exports.repeat = repeat;
    module.exports.isNegativeZero = isNegativeZero;
    module.exports.extend = extend;
  }
});

// ../../../node_modules/js-yaml/lib/exception.js
var require_exception = __commonJS({
  "../../../node_modules/js-yaml/lib/exception.js"(exports, module) {
    "use strict";
    function formatError(exception, compact) {
      var where = "", message = exception.reason || "(unknown reason)";
      if (!exception.mark) return message;
      if (exception.mark.name) {
        where += 'in "' + exception.mark.name + '" ';
      }
      where += "(" + (exception.mark.line + 1) + ":" + (exception.mark.column + 1) + ")";
      if (!compact && exception.mark.snippet) {
        where += "\n\n" + exception.mark.snippet;
      }
      return message + " " + where;
    }
    function YAMLException(reason, mark) {
      Error.call(this);
      this.name = "YAMLException";
      this.reason = reason;
      this.mark = mark;
      this.message = formatError(this, false);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error().stack || "";
      }
    }
    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;
    YAMLException.prototype.toString = function toString(compact) {
      return this.name + ": " + formatError(this, compact);
    };
    module.exports = YAMLException;
  }
});

// ../../../node_modules/js-yaml/lib/snippet.js
var require_snippet = __commonJS({
  "../../../node_modules/js-yaml/lib/snippet.js"(exports, module) {
    "use strict";
    var common = require_common();
    function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
      var head = "";
      var tail = "";
      var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
      if (position - lineStart > maxHalfLength) {
        head = " ... ";
        lineStart = position - maxHalfLength + head.length;
      }
      if (lineEnd - position > maxHalfLength) {
        tail = " ...";
        lineEnd = position + maxHalfLength - tail.length;
      }
      return {
        str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
        pos: position - lineStart + head.length
        // relative position
      };
    }
    function padStart(string, max) {
      return common.repeat(" ", max - string.length) + string;
    }
    function makeSnippet(mark, options) {
      options = Object.create(options || null);
      if (!mark.buffer) return null;
      if (!options.maxLength) options.maxLength = 79;
      if (typeof options.indent !== "number") options.indent = 1;
      if (typeof options.linesBefore !== "number") options.linesBefore = 3;
      if (typeof options.linesAfter !== "number") options.linesAfter = 2;
      var re = /\r?\n|\r|\0/g;
      var lineStarts = [0];
      var lineEnds = [];
      var match;
      var foundLineNo = -1;
      while (match = re.exec(mark.buffer)) {
        lineEnds.push(match.index);
        lineStarts.push(match.index + match[0].length);
        if (mark.position <= match.index && foundLineNo < 0) {
          foundLineNo = lineStarts.length - 2;
        }
      }
      if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
      var result = "", i, line;
      var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
      var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
      for (i = 1; i <= options.linesBefore; i++) {
        if (foundLineNo - i < 0) break;
        line = getLine(
          mark.buffer,
          lineStarts[foundLineNo - i],
          lineEnds[foundLineNo - i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
          maxLineLength
        );
        result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
      }
      line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
      result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
      result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
      for (i = 1; i <= options.linesAfter; i++) {
        if (foundLineNo + i >= lineEnds.length) break;
        line = getLine(
          mark.buffer,
          lineStarts[foundLineNo + i],
          lineEnds[foundLineNo + i],
          mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
          maxLineLength
        );
        result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
      }
      return result.replace(/\n$/, "");
    }
    module.exports = makeSnippet;
  }
});

// ../../../node_modules/js-yaml/lib/type.js
var require_type = __commonJS({
  "../../../node_modules/js-yaml/lib/type.js"(exports, module) {
    "use strict";
    var YAMLException = require_exception();
    var TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "multi",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "representName",
      "defaultStyle",
      "styleAliases"
    ];
    var YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    function compileStyleAliases(map) {
      var result = {};
      if (map !== null) {
        Object.keys(map).forEach(function(style) {
          map[style].forEach(function(alias) {
            result[String(alias)] = style;
          });
        });
      }
      return result;
    }
    function Type(tag, options) {
      options = options || {};
      Object.keys(options).forEach(function(name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });
      this.options = options;
      this.tag = tag;
      this.kind = options["kind"] || null;
      this.resolve = options["resolve"] || function() {
        return true;
      };
      this.construct = options["construct"] || function(data) {
        return data;
      };
      this.instanceOf = options["instanceOf"] || null;
      this.predicate = options["predicate"] || null;
      this.represent = options["represent"] || null;
      this.representName = options["representName"] || null;
      this.defaultStyle = options["defaultStyle"] || null;
      this.multi = options["multi"] || false;
      this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }
    module.exports = Type;
  }
});

// ../../../node_modules/js-yaml/lib/schema.js
var require_schema6 = __commonJS({
  "../../../node_modules/js-yaml/lib/schema.js"(exports, module) {
    "use strict";
    var YAMLException = require_exception();
    var Type = require_type();
    function compileList(schema, name) {
      var result = [];
      schema[name].forEach(function(currentType) {
        var newIndex = result.length;
        result.forEach(function(previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
            newIndex = previousIndex;
          }
        });
        result[newIndex] = currentType;
      });
      return result;
    }
    function compileMap() {
      var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      }, index, length;
      function collectType(type) {
        if (type.multi) {
          result.multi[type.kind].push(type);
          result.multi["fallback"].push(type);
        } else {
          result[type.kind][type.tag] = result["fallback"][type.tag] = type;
        }
      }
      for (index = 0, length = arguments.length; index < length; index += 1) {
        arguments[index].forEach(collectType);
      }
      return result;
    }
    function Schema(definition) {
      return this.extend(definition);
    }
    Schema.prototype.extend = function extend(definition) {
      var implicit = [];
      var explicit = [];
      if (definition instanceof Type) {
        explicit.push(definition);
      } else if (Array.isArray(definition)) {
        explicit = explicit.concat(definition);
      } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
        if (definition.implicit) implicit = implicit.concat(definition.implicit);
        if (definition.explicit) explicit = explicit.concat(definition.explicit);
      } else {
        throw new YAMLException("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
      }
      implicit.forEach(function(type) {
        if (!(type instanceof Type)) {
          throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
        if (type.loadKind && type.loadKind !== "scalar") {
          throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
        if (type.multi) {
          throw new YAMLException("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
        }
      });
      explicit.forEach(function(type) {
        if (!(type instanceof Type)) {
          throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
        }
      });
      var result = Object.create(Schema.prototype);
      result.implicit = (this.implicit || []).concat(implicit);
      result.explicit = (this.explicit || []).concat(explicit);
      result.compiledImplicit = compileList(result, "implicit");
      result.compiledExplicit = compileList(result, "explicit");
      result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
      return result;
    };
    module.exports = Schema;
  }
});

// ../../../node_modules/js-yaml/lib/type/str.js
var require_str = __commonJS({
  "../../../node_modules/js-yaml/lib/type/str.js"(exports, module) {
    "use strict";
    var Type = require_type();
    module.exports = new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/seq.js
var require_seq = __commonJS({
  "../../../node_modules/js-yaml/lib/type/seq.js"(exports, module) {
    "use strict";
    var Type = require_type();
    module.exports = new Type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/map.js
var require_map = __commonJS({
  "../../../node_modules/js-yaml/lib/type/map.js"(exports, module) {
    "use strict";
    var Type = require_type();
    module.exports = new Type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
  }
});

// ../../../node_modules/js-yaml/lib/schema/failsafe.js
var require_failsafe = __commonJS({
  "../../../node_modules/js-yaml/lib/schema/failsafe.js"(exports, module) {
    "use strict";
    var Schema = require_schema6();
    module.exports = new Schema({
      explicit: [
        require_str(),
        require_seq(),
        require_map()
      ]
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/null.js
var require_null = __commonJS({
  "../../../node_modules/js-yaml/lib/type/null.js"(exports, module) {
    "use strict";
    var Type = require_type();
    function resolveYamlNull(data) {
      if (data === null) return true;
      var max = data.length;
      return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
    }
    function constructYamlNull() {
      return null;
    }
    function isNull(object) {
      return object === null;
    }
    module.exports = new Type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        },
        empty: function() {
          return "";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/bool.js
var require_bool = __commonJS({
  "../../../node_modules/js-yaml/lib/type/bool.js"(exports, module) {
    "use strict";
    var Type = require_type();
    function resolveYamlBoolean(data) {
      if (data === null) return false;
      var max = data.length;
      return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
    }
    function constructYamlBoolean(data) {
      return data === "true" || data === "True" || data === "TRUE";
    }
    function isBoolean(object) {
      return Object.prototype.toString.call(object) === "[object Boolean]";
    }
    module.exports = new Type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/int.js
var require_int = __commonJS({
  "../../../node_modules/js-yaml/lib/type/int.js"(exports, module) {
    "use strict";
    var common = require_common();
    var Type = require_type();
    function isHexCode(c) {
      return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
    }
    function isOctCode(c) {
      return 48 <= c && c <= 55;
    }
    function isDecCode(c) {
      return 48 <= c && c <= 57;
    }
    function resolveYamlInteger(data) {
      if (data === null) return false;
      var max = data.length, index = 0, hasDigits = false, ch;
      if (!max) return false;
      ch = data[index];
      if (ch === "-" || ch === "+") {
        ch = data[++index];
      }
      if (ch === "0") {
        if (index + 1 === max) return true;
        ch = data[++index];
        if (ch === "b") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (ch !== "0" && ch !== "1") return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "x") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (!isHexCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "o") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (!isOctCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
      }
      if (ch === "_") return false;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isDecCode(data.charCodeAt(index))) {
          return false;
        }
        hasDigits = true;
      }
      if (!hasDigits || ch === "_") return false;
      return true;
    }
    function constructYamlInteger(data) {
      var value = data, sign = 1, ch;
      if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
      }
      ch = value[0];
      if (ch === "-" || ch === "+") {
        if (ch === "-") sign = -1;
        value = value.slice(1);
        ch = value[0];
      }
      if (value === "0") return 0;
      if (ch === "0") {
        if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
        if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
      }
      return sign * parseInt(value, 10);
    }
    function isInteger(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
    }
    module.exports = new Type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        /* eslint-disable max-len */
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/float.js
var require_float = __commonJS({
  "../../../node_modules/js-yaml/lib/type/float.js"(exports, module) {
    "use strict";
    var common = require_common();
    var Type = require_type();
    var YAML_FLOAT_PATTERN = new RegExp(
      // 2.5e4, 2.5 and integers
      "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
    );
    function resolveYamlFloat(data) {
      if (data === null) return false;
      if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === "_") {
        return false;
      }
      return true;
    }
    function constructYamlFloat(data) {
      var value, sign;
      value = data.replace(/_/g, "").toLowerCase();
      sign = value[0] === "-" ? -1 : 1;
      if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }
      if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === ".nan") {
        return NaN;
      }
      return sign * parseFloat(value, 10);
    }
    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    function representYamlFloat(object, style) {
      var res;
      if (isNaN(object)) {
        switch (style) {
          case "lowercase":
            return ".nan";
          case "uppercase":
            return ".NAN";
          case "camelcase":
            return ".NaN";
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return ".inf";
          case "uppercase":
            return ".INF";
          case "camelcase":
            return ".Inf";
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return "-.inf";
          case "uppercase":
            return "-.INF";
          case "camelcase":
            return "-.Inf";
        }
      } else if (common.isNegativeZero(object)) {
        return "-0.0";
      }
      res = object.toString(10);
      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
    }
    function isFloat(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
    }
    module.exports = new Type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
  }
});

// ../../../node_modules/js-yaml/lib/schema/json.js
var require_json2 = __commonJS({
  "../../../node_modules/js-yaml/lib/schema/json.js"(exports, module) {
    "use strict";
    module.exports = require_failsafe().extend({
      implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ]
    });
  }
});

// ../../../node_modules/js-yaml/lib/schema/core.js
var require_core5 = __commonJS({
  "../../../node_modules/js-yaml/lib/schema/core.js"(exports, module) {
    "use strict";
    module.exports = require_json2();
  }
});

// ../../../node_modules/js-yaml/lib/type/timestamp.js
var require_timestamp = __commonJS({
  "../../../node_modules/js-yaml/lib/type/timestamp.js"(exports, module) {
    "use strict";
    var Type = require_type();
    var YAML_DATE_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
    );
    var YAML_TIMESTAMP_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
    );
    function resolveYamlTimestamp(data) {
      if (data === null) return false;
      if (YAML_DATE_REGEXP.exec(data) !== null) return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
      return false;
    }
    function constructYamlTimestamp(data) {
      var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
      match = YAML_DATE_REGEXP.exec(data);
      if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null) throw new Error("Date resolve error");
      year = +match[1];
      month = +match[2] - 1;
      day = +match[3];
      if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
      }
      hour = +match[4];
      minute = +match[5];
      second = +match[6];
      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) {
          fraction += "0";
        }
        fraction = +fraction;
      }
      if (match[9]) {
        tz_hour = +match[10];
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 6e4;
        if (match[9] === "-") delta = -delta;
      }
      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta) date.setTime(date.getTime() - delta);
      return date;
    }
    function representYamlTimestamp(object) {
      return object.toISOString();
    }
    module.exports = new Type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/merge.js
var require_merge = __commonJS({
  "../../../node_modules/js-yaml/lib/type/merge.js"(exports, module) {
    "use strict";
    var Type = require_type();
    function resolveYamlMerge(data) {
      return data === "<<" || data === null;
    }
    module.exports = new Type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/binary.js
var require_binary = __commonJS({
  "../../../node_modules/js-yaml/lib/type/binary.js"(exports, module) {
    "use strict";
    var Type = require_type();
    var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    function resolveYamlBinary(data) {
      if (data === null) return false;
      var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));
        if (code > 64) continue;
        if (code < 0) return false;
        bitlen += 6;
      }
      return bitlen % 8 === 0;
    }
    function constructYamlBinary(data) {
      var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
      for (idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        }
        bits = bits << 6 | map.indexOf(input.charAt(idx));
      }
      tailbits = max % 4 * 6;
      if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
      }
      return new Uint8Array(result);
    }
    function representYamlBinary(object) {
      var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        }
        bits = (bits << 8) + object[idx];
      }
      tail = max % 3;
      if (tail === 0) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      } else if (tail === 2) {
        result += map[bits >> 10 & 63];
        result += map[bits >> 4 & 63];
        result += map[bits << 2 & 63];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 63];
        result += map[bits << 4 & 63];
        result += map[64];
        result += map[64];
      }
      return result;
    }
    function isBinary(obj) {
      return Object.prototype.toString.call(obj) === "[object Uint8Array]";
    }
    module.exports = new Type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/omap.js
var require_omap = __commonJS({
  "../../../node_modules/js-yaml/lib/type/omap.js"(exports, module) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;
    function resolveYamlOmap(data) {
      if (data === null) return true;
      var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]") return false;
        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;
            else return false;
          }
        }
        if (!pairHasKey) return false;
        if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
        else return false;
      }
      return true;
    }
    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }
    module.exports = new Type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/pairs.js
var require_pairs = __commonJS({
  "../../../node_modules/js-yaml/lib/type/pairs.js"(exports, module) {
    "use strict";
    var Type = require_type();
    var _toString = Object.prototype.toString;
    function resolveYamlPairs(data) {
      if (data === null) return true;
      var index, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        if (_toString.call(pair) !== "[object Object]") return false;
        keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [keys[0], pair[keys[0]]];
      }
      return true;
    }
    function constructYamlPairs(data) {
      if (data === null) return [];
      var index, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        keys = Object.keys(pair);
        result[index] = [keys[0], pair[keys[0]]];
      }
      return result;
    }
    module.exports = new Type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
  }
});

// ../../../node_modules/js-yaml/lib/type/set.js
var require_set = __commonJS({
  "../../../node_modules/js-yaml/lib/type/set.js"(exports, module) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    function resolveYamlSet(data) {
      if (data === null) return true;
      var key, object = data;
      for (key in object) {
        if (_hasOwnProperty.call(object, key)) {
          if (object[key] !== null) return false;
        }
      }
      return true;
    }
    function constructYamlSet(data) {
      return data !== null ? data : {};
    }
    module.exports = new Type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
  }
});

// ../../../node_modules/js-yaml/lib/schema/default.js
var require_default = __commonJS({
  "../../../node_modules/js-yaml/lib/schema/default.js"(exports, module) {
    "use strict";
    module.exports = require_core5().extend({
      implicit: [
        require_timestamp(),
        require_merge()
      ],
      explicit: [
        require_binary(),
        require_omap(),
        require_pairs(),
        require_set()
      ]
    });
  }
});

// ../../../node_modules/js-yaml/lib/loader.js
var require_loader = __commonJS({
  "../../../node_modules/js-yaml/lib/loader.js"(exports, module) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var makeSnippet = require_snippet();
    var DEFAULT_SCHEMA = require_default();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }
    function is_EOL(c) {
      return c === 10 || c === 13;
    }
    function is_WHITE_SPACE(c) {
      return c === 9 || c === 32;
    }
    function is_WS_OR_EOL(c) {
      return c === 9 || c === 32 || c === 10 || c === 13;
    }
    function is_FLOW_INDICATOR(c) {
      return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
    }
    function fromHexCode(c) {
      var lc;
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      lc = c | 32;
      if (97 <= lc && lc <= 102) {
        return lc - 97 + 10;
      }
      return -1;
    }
    function escapedHexLen(c) {
      if (c === 120) {
        return 2;
      }
      if (c === 117) {
        return 4;
      }
      if (c === 85) {
        return 8;
      }
      return 0;
    }
    function fromDecimalCode(c) {
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      return -1;
    }
    function simpleEscapeSequence(c) {
      return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
    }
    function charFromCodepoint(c) {
      if (c <= 65535) {
        return String.fromCharCode(c);
      }
      return String.fromCharCode(
        (c - 65536 >> 10) + 55296,
        (c - 65536 & 1023) + 56320
      );
    }
    function setProperty(object, key, value) {
      if (key === "__proto__") {
        Object.defineProperty(object, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value
        });
      } else {
        object[key] = value;
      }
    }
    var simpleEscapeCheck = new Array(256);
    var simpleEscapeMap = new Array(256);
    for (i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    var i;
    function State(input, options) {
      this.input = input;
      this.filename = options["filename"] || null;
      this.schema = options["schema"] || DEFAULT_SCHEMA;
      this.onWarning = options["onWarning"] || null;
      this.legacy = options["legacy"] || false;
      this.json = options["json"] || false;
      this.listener = options["listener"] || null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.firstTabInLine = -1;
      this.documents = [];
    }
    function generateError(state, message) {
      var mark = {
        name: state.filename,
        buffer: state.input.slice(0, -1),
        // omit trailing \0
        position: state.position,
        line: state.line,
        column: state.position - state.lineStart
      };
      mark.snippet = makeSnippet(mark);
      return new YAMLException(message, mark);
    }
    function throwError(state, message) {
      throw generateError(state, message);
    }
    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }
    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        var match, major, minor;
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        var handle, prefix;
        if (args.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        handle = args[0];
        prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        try {
          prefix = decodeURIComponent(prefix);
        } catch (err) {
          throwError(state, "tag prefix is malformed: " + prefix);
        }
        state.tagMap[handle] = prefix;
      }
    };
    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;
      if (start < end) {
        _result = state.input.slice(start, end);
        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);
            if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
              throwError(state, "expected valid JSON character");
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, "the stream contains non-printable characters");
        }
        state.result += _result;
      }
    }
    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index, quantity;
      if (!common.isObject(source)) {
        throwError(state, "cannot merge mappings; the provided source object is unacceptable");
      }
      sourceKeys = Object.keys(source);
      for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        key = sourceKeys[index];
        if (!_hasOwnProperty.call(destination, key)) {
          setProperty(destination, key, source[key]);
          overridableKeys[key] = true;
        }
      }
    }
    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
      var index, quantity;
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
          if (Array.isArray(keyNode[index])) {
            throwError(state, "nested arrays are not supported inside keys");
          }
          if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
            keyNode[index] = "[object Object]";
          }
        }
      }
      if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
      }
      keyNode = String(keyNode);
      if (_result === null) {
        _result = {};
      }
      if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
          for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.lineStart = startLineStart || state.lineStart;
          state.position = startPos || state.position;
          throwError(state, "duplicated mapping key");
        }
        setProperty(_result, keyNode, valueNode);
        delete overridableKeys[keyNode];
      }
      return _result;
    }
    function readLineBreak(state) {
      var ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 10) {
        state.position++;
      } else if (ch === 13) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10) {
          state.position++;
        }
      } else {
        throwError(state, "a line break is expected");
      }
      state.line += 1;
      state.lineStart = state.position;
      state.firstTabInLine = -1;
    }
    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          if (ch === 9 && state.firstTabInLine === -1) {
            state.firstTabInLine = state.position;
          }
          ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 10 && ch !== 13 && ch !== 0);
        }
        if (is_EOL(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;
          while (ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }
      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
      }
      return lineBreaks;
    }
    function testDocumentSeparator(state) {
      var _position = state.position, ch;
      ch = state.input.charCodeAt(_position);
      if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }
      return false;
    }
    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += " ";
      } else if (count > 1) {
        state.result += common.repeat("\n", count - 1);
      }
    }
    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
      ch = state.input.charCodeAt(state.position);
      if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
      }
      if (ch === 63 || ch === 45) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          return false;
        }
      }
      state.kind = "scalar";
      state.result = "";
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
      while (ch !== 0) {
        if (ch === 58) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
            break;
          }
        } else if (ch === 35) {
          preceding = state.input.charCodeAt(state.position - 1);
          if (is_WS_OR_EOL(preceding)) {
            break;
          }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;
        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);
          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }
        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }
        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, captureEnd, false);
      if (state.result) {
        return true;
      }
      state.kind = _kind;
      state.result = _result;
      return false;
    }
    function readSingleQuotedScalar(state, nodeIndent) {
      var ch, captureStart, captureEnd;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 39) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 39) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (ch === 39) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a single quoted scalar");
    }
    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 34) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 34) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;
        } else if (ch === 92) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (is_EOL(ch)) {
            skipSeparationSpace(state, false, nodeIndent);
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;
          } else if ((tmp = escapedHexLen(ch)) > 0) {
            hexLength = tmp;
            hexResult = 0;
            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);
              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;
              } else {
                throwError(state, "expected hexadecimal character");
              }
            }
            state.result += charFromCodepoint(hexResult);
            state.position++;
          } else {
            throwError(state, "unknown escape sequence");
          }
          captureStart = captureEnd = state.position;
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a double quoted scalar");
    }
    function readFlowCollection(state, nodeIndent) {
      var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 91) {
        terminator = 93;
        isMapping = false;
        _result = [];
      } else if (ch === 123) {
        terminator = 125;
        isMapping = true;
        _result = {};
      } else {
        return false;
      }
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(++state.position);
      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? "mapping" : "sequence";
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, "missed comma between flow collection entries");
        } else if (ch === 44) {
          throwError(state, "expected the node content, but found ','");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }
        _line = state.line;
        _lineStart = state.lineStart;
        _pos = state.position;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === _line) && ch === 58) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }
        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
        } else {
          _result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }
      throwError(state, "unexpected end of the stream within a flow collection");
    }
    function readBlockScalar(state, nodeIndent) {
      var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 124) {
        folding = false;
      } else if (ch === 62) {
        folding = true;
      } else {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || ch === 45) {
          if (CHOMPING_CLIP === chomping) {
            chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, "repeat of a chomping mode identifier");
          }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, "repeat of an indentation width identifier");
          }
        } else {
          break;
        }
      }
      if (is_WHITE_SPACE(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (is_WHITE_SPACE(ch));
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (!is_EOL(ch) && ch !== 0);
        }
      }
      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }
        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        }
        if (state.lineIndent < textIndent) {
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              state.result += "\n";
            }
          }
          break;
        }
        if (folding) {
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true;
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat("\n", emptyLines + 1);
          } else if (emptyLines === 0) {
            if (didReadContent) {
              state.result += " ";
            }
          } else {
            state.result += common.repeat("\n", emptyLines);
          }
        } else {
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;
        while (!is_EOL(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
      }
      return true;
    }
    function readBlockSequence(state, nodeIndent) {
      var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
      if (state.firstTabInLine !== -1) return false;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, "tab characters must not be used in indentation");
        }
        if (ch !== 45) {
          break;
        }
        following = state.input.charCodeAt(state.position + 1);
        if (!is_WS_OR_EOL(following)) {
          break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "sequence";
        state.result = _result;
        return true;
      }
      return false;
    }
    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
      if (state.firstTabInLine !== -1) return false;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (!atExplicitKey && state.firstTabInLine !== -1) {
          state.position = state.firstTabInLine;
          throwError(state, "tab characters must not be used in indentation");
        }
        following = state.input.charCodeAt(state.position + 1);
        _line = state.line;
        if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
          if (ch === 63) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = true;
            allowCompact = true;
          } else if (atExplicitKey) {
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
          }
          state.position += 1;
          ch = following;
        } else {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
          if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
            break;
          }
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);
            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 58) {
              ch = state.input.charCodeAt(++state.position);
              if (!is_WS_OR_EOL(ch)) {
                throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
              }
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;
            } else if (detected) {
              throwError(state, "can not read an implicit mapping pair; a colon is missed");
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          } else if (detected) {
            throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        }
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (atExplicitKey) {
            _keyLine = state.line;
            _keyLineStart = state.lineStart;
            _keyPos = state.position;
          }
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }
          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "mapping";
        state.result = _result;
      }
      return detected;
    }
    function readTagProperty(state) {
      var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 33) return false;
      if (state.tag !== null) {
        throwError(state, "duplication of a tag property");
      }
      ch = state.input.charCodeAt(++state.position);
      if (ch === 60) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
      } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
      } else {
        tagHandle = "!";
      }
      _position = state.position;
      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 62);
        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, "unexpected end of the stream within a verbatim tag");
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          if (ch === 33) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);
              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, "named tag handle cannot contain such characters");
              }
              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, "tag suffix cannot contain exclamation marks");
            }
          }
          ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(_position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, "tag suffix cannot contain flow indicator characters");
        }
      }
      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, "tag name cannot contain such characters: " + tagName);
      }
      try {
        tagName = decodeURIComponent(tagName);
      } catch (err) {
        throwError(state, "tag name is malformed: " + tagName);
      }
      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === "!") {
        state.tag = "!" + tagName;
      } else if (tagHandle === "!!") {
        state.tag = "tag:yaml.org,2002:" + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }
      return true;
    }
    function readAnchorProperty(state) {
      var _position, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 38) return false;
      if (state.anchor !== null) {
        throwError(state, "duplication of an anchor property");
      }
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an anchor node must contain at least one character");
      }
      state.anchor = state.input.slice(_position, state.position);
      return true;
    }
    function readAlias(state) {
      var _position, alias, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 42) return false;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an alias node must contain at least one character");
      }
      alias = state.input.slice(_position, state.position);
      if (!_hasOwnProperty.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }
      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }
    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type, flowIndent, blockIndent;
      if (state.listener !== null) {
        state.listener("open", state);
      }
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }
      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;
            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }
      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }
      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;
              if (state.tag !== null || state.anchor !== null) {
                throwError(state, "alias node should not have any properties");
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;
              if (state.tag === null) {
                state.tag = "?";
              }
            }
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }
      if (state.tag === null) {
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      } else if (state.tag === "?") {
        if (state.result !== null && state.kind !== "scalar") {
          throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
        }
        for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
          type = state.implicitTypes[typeIndex];
          if (type.resolve(state.result)) {
            state.result = type.construct(state.result);
            state.tag = type.tag;
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
            break;
          }
        }
      } else if (state.tag !== "!") {
        if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
          type = state.typeMap[state.kind || "fallback"][state.tag];
        } else {
          type = null;
          typeList = state.typeMap.multi[state.kind || "fallback"];
          for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
            if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
              type = typeList[typeIndex];
              break;
            }
          }
        }
        if (!type) {
          throwError(state, "unknown tag !<" + state.tag + ">");
        }
        if (state.result !== null && type.kind !== state.kind) {
          throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
        }
        if (!type.resolve(state.result, state.tag)) {
          throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
        } else {
          state.result = type.construct(state.result, state.tag);
          if (state.anchor !== null) {
            state.anchorMap[state.anchor] = state.result;
          }
        }
      }
      if (state.listener !== null) {
        state.listener("close", state);
      }
      return state.tag !== null || state.anchor !== null || hasContent;
    }
    function readDocument(state) {
      var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = /* @__PURE__ */ Object.create(null);
      state.anchorMap = /* @__PURE__ */ Object.create(null);
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37) {
          break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
          throwError(state, "directive name must not be less than one character in length");
        }
        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 35) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0 && !is_EOL(ch));
            break;
          }
          if (is_EOL(ch)) break;
          _position = state.position;
          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          directiveArgs.push(state.input.slice(_position, state.position));
        }
        if (ch !== 0) readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }
      skipSeparationSpace(state, true, -1);
      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      } else if (hasDirectives) {
        throwError(state, "directives end mark is expected");
      }
      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);
      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
      }
      state.documents.push(state.result);
      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }
      if (state.position < state.length - 1) {
        throwError(state, "end of the stream or a document separator is expected");
      } else {
        return;
      }
    }
    function loadDocuments(input, options) {
      input = String(input);
      options = options || {};
      if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
          input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
          input = input.slice(1);
        }
      }
      var state = new State(input, options);
      var nullpos = input.indexOf("\0");
      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, "null byte is not allowed in input");
      }
      state.input += "\0";
      while (state.input.charCodeAt(state.position) === 32) {
        state.lineIndent += 1;
        state.position += 1;
      }
      while (state.position < state.length - 1) {
        readDocument(state);
      }
      return state.documents;
    }
    function loadAll(input, iterator, options) {
      if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
        options = iterator;
        iterator = null;
      }
      var documents = loadDocuments(input, options);
      if (typeof iterator !== "function") {
        return documents;
      }
      for (var index = 0, length = documents.length; index < length; index += 1) {
        iterator(documents[index]);
      }
    }
    function load(input, options) {
      var documents = loadDocuments(input, options);
      if (documents.length === 0) {
        return void 0;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new YAMLException("expected a single document in the stream, but found more");
    }
    module.exports.loadAll = loadAll;
    module.exports.load = load;
  }
});

// ../../../node_modules/js-yaml/lib/dumper.js
var require_dumper = __commonJS({
  "../../../node_modules/js-yaml/lib/dumper.js"(exports, module) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var DEFAULT_SCHEMA = require_default();
    var _toString = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CHAR_BOM = 65279;
    var CHAR_TAB = 9;
    var CHAR_LINE_FEED = 10;
    var CHAR_CARRIAGE_RETURN = 13;
    var CHAR_SPACE = 32;
    var CHAR_EXCLAMATION = 33;
    var CHAR_DOUBLE_QUOTE = 34;
    var CHAR_SHARP = 35;
    var CHAR_PERCENT = 37;
    var CHAR_AMPERSAND = 38;
    var CHAR_SINGLE_QUOTE = 39;
    var CHAR_ASTERISK = 42;
    var CHAR_COMMA = 44;
    var CHAR_MINUS = 45;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_GREATER_THAN = 62;
    var CHAR_QUESTION = 63;
    var CHAR_COMMERCIAL_AT = 64;
    var CHAR_LEFT_SQUARE_BRACKET = 91;
    var CHAR_RIGHT_SQUARE_BRACKET = 93;
    var CHAR_GRAVE_ACCENT = 96;
    var CHAR_LEFT_CURLY_BRACKET = 123;
    var CHAR_VERTICAL_LINE = 124;
    var CHAR_RIGHT_CURLY_BRACKET = 125;
    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    var DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
    function compileStyleMap(schema, map) {
      var result, keys, index, length, tag, style, type;
      if (map === null) return {};
      result = {};
      keys = Object.keys(map);
      for (index = 0, length = keys.length; index < length; index += 1) {
        tag = keys[index];
        style = String(map[tag]);
        if (tag.slice(0, 2) === "!!") {
          tag = "tag:yaml.org,2002:" + tag.slice(2);
        }
        type = schema.compiledTypeMap["fallback"][tag];
        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }
        result[tag] = style;
      }
      return result;
    }
    function encodeHex(character) {
      var string, handle, length;
      string = character.toString(16).toUpperCase();
      if (character <= 255) {
        handle = "x";
        length = 2;
      } else if (character <= 65535) {
        handle = "u";
        length = 4;
      } else if (character <= 4294967295) {
        handle = "U";
        length = 8;
      } else {
        throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
      }
      return "\\" + handle + common.repeat("0", length - string.length) + string;
    }
    var QUOTING_TYPE_SINGLE = 1;
    var QUOTING_TYPE_DOUBLE = 2;
    function State(options) {
      this.schema = options["schema"] || DEFAULT_SCHEMA;
      this.indent = Math.max(1, options["indent"] || 2);
      this.noArrayIndent = options["noArrayIndent"] || false;
      this.skipInvalid = options["skipInvalid"] || false;
      this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
      this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
      this.sortKeys = options["sortKeys"] || false;
      this.lineWidth = options["lineWidth"] || 80;
      this.noRefs = options["noRefs"] || false;
      this.noCompatMode = options["noCompatMode"] || false;
      this.condenseFlow = options["condenseFlow"] || false;
      this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
      this.forceQuotes = options["forceQuotes"] || false;
      this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = "";
      this.duplicates = [];
      this.usedDuplicates = null;
    }
    function indentString(string, spaces) {
      var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
      while (position < length) {
        next = string.indexOf("\n", position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }
        if (line.length && line !== "\n") result += ind;
        result += line;
      }
      return result;
    }
    function generateNextLine(state, level) {
      return "\n" + common.repeat(" ", state.indent * level);
    }
    function testImplicitResolving(state, str) {
      var index, length, type;
      for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        type = state.implicitTypes[index];
        if (type.resolve(str)) {
          return true;
        }
      }
      return false;
    }
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }
    function isPrintable(c) {
      return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
    }
    function isNsCharOrWhitespace(c) {
      return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    }
    function isPlainSafe(c, prev, inblock) {
      var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
      var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
      return (
        // ns-plain-safe
        (inblock ? (
          // c = flow-in
          cIsNsCharOrWhitespace
        ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
      );
    }
    function isPlainSafeFirst(c) {
      return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    }
    function isPlainSafeLast(c) {
      return !isWhitespace(c) && c !== CHAR_COLON;
    }
    function codePointAt(string, pos) {
      var first = string.charCodeAt(pos), second;
      if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
        second = string.charCodeAt(pos + 1);
        if (second >= 56320 && second <= 57343) {
          return (first - 55296) * 1024 + second - 56320 + 65536;
        }
      }
      return first;
    }
    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }
    var STYLE_PLAIN = 1;
    var STYLE_SINGLE = 2;
    var STYLE_LITERAL = 3;
    var STYLE_FOLDED = 4;
    var STYLE_DOUBLE = 5;
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
      var i;
      var char = 0;
      var prevChar = null;
      var hasLineBreak = false;
      var hasFoldableLine = false;
      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1;
      var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
      if (singleLineOnly || forceQuotes) {
        for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
      } else {
        for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
          char = codePointAt(string, i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
              i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          plain = plain && isPlainSafe(char, prevChar, inblock);
          prevChar = char;
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
      }
      if (!hasLineBreak && !hasFoldableLine) {
        if (plain && !forceQuotes && !testAmbiguousType(string)) {
          return STYLE_PLAIN;
        }
        return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
      }
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      if (!forceQuotes) {
        return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    function writeScalar(state, string, level, iskey, inblock) {
      state.dump = function() {
        if (string.length === 0) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
        }
        if (!state.noCompatMode) {
          if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
            return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
          }
        }
        var indent = state.indent * Math.max(1, level);
        var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
        function testAmbiguity(string2) {
          return testImplicitResolving(state, string2);
        }
        switch (chooseScalarStyle(
          string,
          singleLineOnly,
          state.indent,
          lineWidth,
          testAmbiguity,
          state.quotingType,
          state.forceQuotes && !iskey,
          inblock
        )) {
          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string, lineWidth) + '"';
          default:
            throw new YAMLException("impossible error: invalid scalar style");
        }
      }();
    }
    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
      var clip = string[string.length - 1] === "\n";
      var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
      var chomp = keep ? "+" : clip ? "" : "-";
      return indentIndicator + chomp + "\n";
    }
    function dropEndingNewline(string) {
      return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
    }
    function foldString(string, width) {
      var lineRe = /(\n+)([^\n]*)/g;
      var result = function() {
        var nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      }();
      var prevMoreIndented = string[0] === "\n" || string[0] === " ";
      var moreIndented;
      var match;
      while (match = lineRe.exec(string)) {
        var prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }
      return result;
    }
    function foldLine(line, width) {
      if (line === "" || line[0] === " ") return line;
      var breakRe = / [^ ]/g;
      var match;
      var start = 0, end, curr = 0, next = 0;
      var result = "";
      while (match = breakRe.exec(line)) {
        next = match.index;
        if (next - start > width) {
          end = curr > start ? curr : next;
          result += "\n" + line.slice(start, end);
          start = end + 1;
        }
        curr = next;
      }
      result += "\n";
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }
      return result.slice(1);
    }
    function escapeString(string) {
      var result = "";
      var char = 0;
      var escapeSeq;
      for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        escapeSeq = ESCAPE_SEQUENCES[char];
        if (!escapeSeq && isPrintable(char)) {
          result += string[i];
          if (char >= 65536) result += string[i + 1];
        } else {
          result += escapeSeq || encodeHex(char);
        }
      }
      return result;
    }
    function writeFlowSequence(state, level, object) {
      var _result = "", _tag = state.tag, index, length, value;
      for (index = 0, length = object.length; index < length; index += 1) {
        value = object[index];
        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }
        if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
          if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = "[" + _result + "]";
    }
    function writeBlockSequence(state, level, object, compact) {
      var _result = "", _tag = state.tag, index, length, value;
      for (index = 0, length = object.length; index < length; index += 1) {
        value = object[index];
        if (state.replacer) {
          value = state.replacer.call(object, String(index), value);
        }
        if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
          if (!compact || _result !== "") {
            _result += generateNextLine(state, level);
          }
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += "-";
          } else {
            _result += "- ";
          }
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = _result || "[]";
    }
    function writeFlowMapping(state, level, object) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (_result !== "") pairBuffer += ", ";
        if (state.condenseFlow) pairBuffer += '"';
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }
        if (!writeNode(state, level, objectKey, false, false)) {
          continue;
        }
        if (state.dump.length > 1024) pairBuffer += "? ";
        pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
        if (!writeNode(state, level, objectValue, false, false)) {
          continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = "{" + _result + "}";
    }
    function writeBlockMapping(state, level, object, compact) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
      if (state.sortKeys === true) {
        objectKeyList.sort();
      } else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        throw new YAMLException("sortKeys must be a boolean or a function");
      }
      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (!compact || _result !== "") {
          pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (state.replacer) {
          objectValue = state.replacer.call(object, objectKey, objectValue);
        }
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue;
        }
        explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += "?";
          } else {
            pairBuffer += "? ";
          }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ":";
        } else {
          pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = _result || "{}";
    }
    function detectType(state, object, explicit) {
      var _result, typeList, index, length, type, style;
      typeList = explicit ? state.explicitTypes : state.implicitTypes;
      for (index = 0, length = typeList.length; index < length; index += 1) {
        type = typeList[index];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          if (explicit) {
            if (type.multi && type.representName) {
              state.tag = type.representName(object);
            } else {
              state.tag = type.tag;
            }
          } else {
            state.tag = "?";
          }
          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;
            if (_toString.call(type.represent) === "[object Function]") {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
            }
            state.dump = _result;
          }
          return true;
        }
      }
      return false;
    }
    function writeNode(state, level, object, block, compact, iskey, isblockseq) {
      state.tag = null;
      state.dump = object;
      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }
      var type = _toString.call(state.dump);
      var inblock = block;
      var tagStr;
      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }
      var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }
      if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }
      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = "*ref_" + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object Array]") {
          if (block && state.dump.length !== 0) {
            if (state.noArrayIndent && !isblockseq && level > 0) {
              writeBlockSequence(state, level - 1, state.dump, compact);
            } else {
              writeBlockSequence(state, level, state.dump, compact);
            }
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object String]") {
          if (state.tag !== "?") {
            writeScalar(state, state.dump, level, iskey, inblock);
          }
        } else if (type === "[object Undefined]") {
          return false;
        } else {
          if (state.skipInvalid) return false;
          throw new YAMLException("unacceptable kind of an object to dump " + type);
        }
        if (state.tag !== null && state.tag !== "?") {
          tagStr = encodeURI(
            state.tag[0] === "!" ? state.tag.slice(1) : state.tag
          ).replace(/!/g, "%21");
          if (state.tag[0] === "!") {
            tagStr = "!" + tagStr;
          } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
            tagStr = "!!" + tagStr.slice(18);
          } else {
            tagStr = "!<" + tagStr + ">";
          }
          state.dump = tagStr + " " + state.dump;
        }
      }
      return true;
    }
    function getDuplicateReferences(object, state) {
      var objects = [], duplicatesIndexes = [], index, length;
      inspectNode(object, objects, duplicatesIndexes);
      for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
      }
      state.usedDuplicates = new Array(length);
    }
    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList, index, length;
      if (object !== null && typeof object === "object") {
        index = objects.indexOf(object);
        if (index !== -1) {
          if (duplicatesIndexes.indexOf(index) === -1) {
            duplicatesIndexes.push(index);
          }
        } else {
          objects.push(object);
          if (Array.isArray(object)) {
            for (index = 0, length = object.length; index < length; index += 1) {
              inspectNode(object[index], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);
            for (index = 0, length = objectKeyList.length; index < length; index += 1) {
              inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }
    function dump(input, options) {
      options = options || {};
      var state = new State(options);
      if (!state.noRefs) getDuplicateReferences(input, state);
      var value = input;
      if (state.replacer) {
        value = state.replacer.call({ "": value }, "", value);
      }
      if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
      return "";
    }
    module.exports.dump = dump;
  }
});

// ../../../node_modules/js-yaml/index.js
var require_js_yaml = __commonJS({
  "../../../node_modules/js-yaml/index.js"(exports, module) {
    "use strict";
    var loader = require_loader();
    var dumper = require_dumper();
    function renamed(from, to) {
      return function() {
        throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
      };
    }
    module.exports.Type = require_type();
    module.exports.Schema = require_schema6();
    module.exports.FAILSAFE_SCHEMA = require_failsafe();
    module.exports.JSON_SCHEMA = require_json2();
    module.exports.CORE_SCHEMA = require_core5();
    module.exports.DEFAULT_SCHEMA = require_default();
    module.exports.load = loader.load;
    module.exports.loadAll = loader.loadAll;
    module.exports.dump = dumper.dump;
    module.exports.YAMLException = require_exception();
    module.exports.types = {
      binary: require_binary(),
      float: require_float(),
      map: require_map(),
      null: require_null(),
      pairs: require_pairs(),
      set: require_set(),
      timestamp: require_timestamp(),
      bool: require_bool(),
      int: require_int(),
      merge: require_merge(),
      omap: require_omap(),
      seq: require_seq(),
      str: require_str()
    };
    module.exports.safeLoad = renamed("safeLoad", "load");
    module.exports.safeLoadAll = renamed("safeLoadAll", "loadAll");
    module.exports.safeDump = renamed("safeDump", "dump");
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/yaml.js
var require_yaml = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/yaml.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    var js_yaml_1 = __importDefault(require_js_yaml());
    var js_yaml_2 = require_js_yaml();
    exports.default = {
      /**
       * The order that this parser will run, in relation to other parsers.
       */
      order: 200,
      /**
       * Whether to allow "empty" files. This includes zero-byte files, as well as empty JSON objects.
       */
      allowEmpty: true,
      /**
       * Determines whether this parser can parse a given file reference.
       * Parsers that match will be tried, in order, until one successfully parses the file.
       * Parsers that don't match will be skipped, UNLESS none of the parsers match, in which case
       * every parser will be tried.
       */
      canParse: [".yaml", ".yml", ".json"],
      // JSON is valid YAML
      /**
       * Parses the given file as YAML
       *
       * @param file           - An object containing information about the referenced file
       * @param file.url       - The full URL of the referenced file
       * @param file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
       * @param file.data      - The file contents. This will be whatever data type was returned by the resolver
       * @returns
       */
      async parse(file) {
        let data = file.data;
        if (Buffer.isBuffer(data)) {
          data = data.toString();
        }
        if (typeof data === "string") {
          try {
            return js_yaml_1.default.load(data, { schema: js_yaml_2.JSON_SCHEMA });
          } catch (e) {
            throw new errors_js_1.ParserError(e?.message || "Parser Error", file.url);
          }
        } else {
          return data;
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/text.js
var require_text = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/text.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    var TEXT_REGEXP = /\.(txt|htm|html|md|xml|js|min|map|css|scss|less|svg)$/i;
    exports.default = {
      /**
       * The order that this parser will run, in relation to other parsers.
       */
      order: 300,
      /**
       * Whether to allow "empty" files (zero bytes).
       */
      allowEmpty: true,
      /**
       * The encoding that the text is expected to be in.
       */
      encoding: "utf8",
      /**
       * Determines whether this parser can parse a given file reference.
       * Parsers that return true will be tried, in order, until one successfully parses the file.
       * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
       * every parser will be tried.
       */
      canParse(file) {
        return (typeof file.data === "string" || Buffer.isBuffer(file.data)) && TEXT_REGEXP.test(file.url);
      },
      /**
       * Parses the given file as text
       */
      parse(file) {
        if (typeof file.data === "string") {
          return file.data;
        } else if (Buffer.isBuffer(file.data)) {
          return file.data.toString(this.encoding);
        } else {
          throw new errors_js_1.ParserError("data is not text", file.url);
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/binary.js
var require_binary2 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/parsers/binary.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var BINARY_REGEXP = /\.(jpeg|jpg|gif|png|bmp|ico)$/i;
    exports.default = {
      /**
       * The order that this parser will run, in relation to other parsers.
       */
      order: 400,
      /**
       * Whether to allow "empty" files (zero bytes).
       */
      allowEmpty: true,
      /**
       * Determines whether this parser can parse a given file reference.
       * Parsers that return true will be tried, in order, until one successfully parses the file.
       * Parsers that return false will be skipped, UNLESS all parsers returned false, in which case
       * every parser will be tried.
       */
      canParse(file) {
        return Buffer.isBuffer(file.data) && BINARY_REGEXP.test(file.url);
      },
      /**
       * Parses the given data as a Buffer (byte array).
       */
      parse(file) {
        if (Buffer.isBuffer(file.data)) {
          return file.data;
        } else {
          return Buffer.from(file.data);
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/resolvers/file.js
var require_file = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/resolvers/file.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var fs_1 = __importDefault(__require("fs"));
    var ono_1 = require_cjs();
    var url = __importStar(require_url());
    var errors_js_1 = require_errors2();
    exports.default = {
      /**
       * The order that this resolver will run, in relation to other resolvers.
       */
      order: 100,
      /**
       * Determines whether this resolver can read a given file reference.
       * Resolvers that return true will be tried, in order, until one successfully resolves the file.
       * Resolvers that return false will not be given a chance to resolve the file.
       */
      canRead(file) {
        return url.isFileSystemPath(file.url);
      },
      /**
       * Reads the given file and returns its raw contents as a Buffer.
       */
      async read(file) {
        let path;
        try {
          path = url.toFileSystemPath(file.url);
        } catch (err) {
          throw new errors_js_1.ResolverError(ono_1.ono.uri(err, `Malformed URI: ${file.url}`), file.url);
        }
        try {
          return await fs_1.default.promises.readFile(path);
        } catch (err) {
          throw new errors_js_1.ResolverError((0, ono_1.ono)(err, `Error opening file "${path}"`), path);
        }
      }
    };
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/resolvers/http.js
var require_http = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/resolvers/http.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ono_1 = require_cjs();
    var url = __importStar(require_url());
    var errors_js_1 = require_errors2();
    exports.default = {
      /**
       * The order that this resolver will run, in relation to other resolvers.
       */
      order: 200,
      /**
       * HTTP headers to send when downloading files.
       *
       * @example:
       * {
       *   "User-Agent": "JSON Schema $Ref Parser",
       *   Accept: "application/json"
       * }
       */
      headers: null,
      /**
       * HTTP request timeout (in milliseconds).
       */
      timeout: 6e4,
      // 60 seconds
      /**
       * The maximum number of HTTP redirects to follow.
       * To disable automatic following of redirects, set this to zero.
       */
      redirects: 5,
      /**
       * The `withCredentials` option of XMLHttpRequest.
       * Set this to `true` if you're downloading files from a CORS-enabled server that requires authentication
       */
      withCredentials: false,
      /**
       * Determines whether this resolver can read a given file reference.
       * Resolvers that return true will be tried in order, until one successfully resolves the file.
       * Resolvers that return false will not be given a chance to resolve the file.
       */
      canRead(file) {
        return url.isHttp(file.url);
      },
      /**
       * Reads the given URL and returns its raw contents as a Buffer.
       */
      read(file) {
        const u = url.parse(file.url);
        if (typeof window !== "undefined" && !u.protocol) {
          u.protocol = url.parse(location.href).protocol;
        }
        return download(u, this);
      }
    };
    async function download(u, httpOptions, _redirects) {
      u = url.parse(u);
      const redirects = _redirects || [];
      redirects.push(u.href);
      try {
        const res = await get(u, httpOptions);
        if (res.status >= 400) {
          throw (0, ono_1.ono)({ status: res.status }, `HTTP ERROR ${res.status}`);
        } else if (res.status >= 300) {
          if (!Number.isNaN(httpOptions.redirects) && redirects.length > httpOptions.redirects) {
            throw new errors_js_1.ResolverError((0, ono_1.ono)({ status: res.status }, `Error downloading ${redirects[0]}. 
Too many redirects: 
  ${redirects.join(" \n  ")}`));
          } else if (!("location" in res.headers) || !res.headers.location) {
            throw (0, ono_1.ono)({ status: res.status }, `HTTP ${res.status} redirect with no location header`);
          } else {
            const redirectTo = url.resolve(u.href, res.headers.location);
            return download(redirectTo, httpOptions, redirects);
          }
        } else {
          if (res.body) {
            const buf = await res.arrayBuffer();
            return Buffer.from(buf);
          }
          return Buffer.alloc(0);
        }
      } catch (err) {
        throw new errors_js_1.ResolverError((0, ono_1.ono)(err, `Error downloading ${u.href}`), u.href);
      }
    }
    async function get(u, httpOptions) {
      let controller;
      let timeoutId;
      if (httpOptions.timeout) {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), httpOptions.timeout);
      }
      const response = await fetch(u, {
        method: "GET",
        headers: httpOptions.headers || {},
        credentials: httpOptions.withCredentials ? "include" : "same-origin",
        signal: controller ? controller.signal : null
      });
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      return response;
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/options.js
var require_options = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/options.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getNewOptions = exports.getJsonSchemaRefParserDefaultOptions = void 0;
    var json_js_1 = __importDefault(require_json());
    var yaml_js_1 = __importDefault(require_yaml());
    var text_js_1 = __importDefault(require_text());
    var binary_js_1 = __importDefault(require_binary2());
    var file_js_1 = __importDefault(require_file());
    var http_js_1 = __importDefault(require_http());
    var getJsonSchemaRefParserDefaultOptions = () => {
      const defaults = {
        /**
         * Determines how different types of files will be parsed.
         *
         * You can add additional parsers of your own, replace an existing one with
         * your own implementation, or disable any parser by setting it to false.
         */
        parse: {
          json: { ...json_js_1.default },
          yaml: { ...yaml_js_1.default },
          text: { ...text_js_1.default },
          binary: { ...binary_js_1.default }
        },
        /**
         * Determines how JSON References will be resolved.
         *
         * You can add additional resolvers of your own, replace an existing one with
         * your own implementation, or disable any resolver by setting it to false.
         */
        resolve: {
          file: { ...file_js_1.default },
          http: { ...http_js_1.default },
          /**
           * Determines whether external $ref pointers will be resolved.
           * If this option is disabled, then none of above resolvers will be called.
           * Instead, external $ref pointers will simply be ignored.
           *
           * @type {boolean}
           */
          external: true
        },
        /**
         * By default, JSON Schema $Ref Parser throws the first error it encounters. Setting `continueOnError` to `true`
         * causes it to keep processing as much as possible and then throw a single error that contains all errors
         * that were encountered.
         */
        continueOnError: false,
        /**
         * Determines the types of JSON references that are allowed.
         */
        dereference: {
          /**
           * Dereference circular (recursive) JSON references?
           * If false, then a {@link ReferenceError} will be thrown if a circular reference is found.
           * If "ignore", then circular references will not be dereferenced.
           *
           * @type {boolean|string}
           */
          circular: true,
          /**
           * A function, called for each path, which can return true to stop this path and all
           * subpaths from being dereferenced further. This is useful in schemas where some
           * subpaths contain literal $ref keys that should not be dereferenced.
           *
           * @type {function}
           */
          excludedPathMatcher: () => false,
          referenceResolution: "relative"
        },
        mutateInputSchema: true
      };
      return defaults;
    };
    exports.getJsonSchemaRefParserDefaultOptions = getJsonSchemaRefParserDefaultOptions;
    var getNewOptions = (options) => {
      const newOptions = (0, exports.getJsonSchemaRefParserDefaultOptions)();
      if (options) {
        merge(newOptions, options);
      }
      return newOptions;
    };
    exports.getNewOptions = getNewOptions;
    function merge(target, source) {
      if (isMergeable(source)) {
        const keys = Object.keys(source).filter((key) => !["__proto__", "constructor", "prototype"].includes(key));
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const sourceSetting = source[key];
          const targetSetting = target[key];
          if (isMergeable(sourceSetting)) {
            target[key] = merge(targetSetting || {}, sourceSetting);
          } else if (sourceSetting !== void 0) {
            target[key] = sourceSetting;
          }
        }
      }
      return target;
    }
    function isMergeable(val) {
      return val && typeof val === "object" && !Array.isArray(val) && !(val instanceof RegExp) && !(val instanceof Date);
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/normalize-args.js
var require_normalize_args = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/normalize-args.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeArgs = normalizeArgs;
    var options_js_1 = require_options();
    function normalizeArgs(_args) {
      let path;
      let schema;
      let options;
      let callback;
      const args = Array.prototype.slice.call(_args);
      if (typeof args[args.length - 1] === "function") {
        callback = args.pop();
      }
      if (typeof args[0] === "string") {
        path = args[0];
        if (typeof args[2] === "object") {
          schema = args[1];
          options = args[2];
        } else {
          schema = void 0;
          options = args[1];
        }
      } else {
        path = "";
        schema = args[0];
        options = args[1];
      }
      try {
        options = (0, options_js_1.getNewOptions)(options);
      } catch (e) {
        console.error(`JSON Schema Ref Parser: Error normalizing options: ${e}`);
      }
      if (!options.mutateInputSchema && typeof schema === "object") {
        schema = JSON.parse(JSON.stringify(schema));
      }
      return {
        path,
        schema,
        options,
        callback
      };
    }
    exports.default = normalizeArgs;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/resolve-external.js
var require_resolve_external = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/resolve-external.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ref_js_1 = __importDefault(require_ref2());
    var pointer_js_1 = __importDefault(require_pointer());
    var parse_js_1 = __importDefault(require_parse());
    var url = __importStar(require_url());
    var errors_js_1 = require_errors2();
    function resolveExternal(parser, options) {
      if (!options.resolve?.external) {
        return Promise.resolve();
      }
      try {
        const promises = crawl(parser.schema, parser.$refs._root$Ref.path + "#", parser.$refs, options);
        return Promise.all(promises);
      } catch (e) {
        return Promise.reject(e);
      }
    }
    function crawl(obj, path, $refs, options, seen, external) {
      seen || (seen = /* @__PURE__ */ new Set());
      let promises = [];
      if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !seen.has(obj)) {
        seen.add(obj);
        if (ref_js_1.default.isExternal$Ref(obj)) {
          promises.push(resolve$Ref(obj, path, $refs, options));
        }
        const keys = Object.keys(obj);
        for (const key of keys) {
          const keyPath = pointer_js_1.default.join(path, key);
          const value = obj[key];
          promises = promises.concat(crawl(value, keyPath, $refs, options, seen, external));
        }
      }
      return promises;
    }
    async function resolve$Ref($ref, path, $refs, options) {
      const shouldResolveOnCwd = options.dereference?.externalReferenceResolution === "root";
      const resolvedPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);
      const withoutHash = url.stripHash(resolvedPath);
      const ref = $refs._$refs[withoutHash];
      if (ref) {
        return Promise.resolve(ref.value);
      }
      try {
        const result = await (0, parse_js_1.default)(resolvedPath, $refs, options);
        const promises = crawl(result, withoutHash + "#", $refs, options, /* @__PURE__ */ new Set(), true);
        return Promise.all(promises);
      } catch (err) {
        if (!options?.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
          throw err;
        }
        if ($refs._$refs[withoutHash]) {
          err.source = decodeURI(url.stripHash(path));
          err.path = url.safePointerToPath(url.getHash(path));
        }
        return [];
      }
    }
    exports.default = resolveExternal;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/bundle.js
var require_bundle = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/bundle.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ref_js_1 = __importDefault(require_ref2());
    var pointer_js_1 = __importDefault(require_pointer());
    var url = __importStar(require_url());
    function bundle(parser, options) {
      const inventory = [];
      crawl(parser, "schema", parser.$refs._root$Ref.path + "#", "#", 0, inventory, parser.$refs, options);
      remap(inventory);
    }
    function crawl(parent, key, path, pathFromRoot, indirections, inventory, $refs, options) {
      const obj = key === null ? parent : parent[key];
      if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj)) {
        if (ref_js_1.default.isAllowed$Ref(obj)) {
          inventory$Ref(parent, key, path, pathFromRoot, indirections, inventory, $refs, options);
        } else {
          const keys = Object.keys(obj).sort((a, b) => {
            if (a === "definitions") {
              return -1;
            } else if (b === "definitions") {
              return 1;
            } else {
              return a.length - b.length;
            }
          });
          for (const key2 of keys) {
            const keyPath = pointer_js_1.default.join(path, key2);
            const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key2);
            const value = obj[key2];
            if (ref_js_1.default.isAllowed$Ref(value)) {
              inventory$Ref(obj, key2, path, keyPathFromRoot, indirections, inventory, $refs, options);
            } else {
              crawl(obj, key2, keyPath, keyPathFromRoot, indirections, inventory, $refs, options);
            }
          }
        }
      }
    }
    function inventory$Ref($refParent, $refKey, path, pathFromRoot, indirections, inventory, $refs, options) {
      const $ref = $refKey === null ? $refParent : $refParent[$refKey];
      const $refPath = url.resolve(path, $ref.$ref);
      const pointer = $refs._resolve($refPath, pathFromRoot, options);
      if (pointer === null) {
        return;
      }
      const parsed = pointer_js_1.default.parse(pathFromRoot);
      const depth = parsed.length;
      const file = url.stripHash(pointer.path);
      const hash = url.getHash(pointer.path);
      const external = file !== $refs._root$Ref.path;
      const extended = ref_js_1.default.isExtended$Ref($ref);
      indirections += pointer.indirections;
      const existingEntry = findInInventory(inventory, $refParent, $refKey);
      if (existingEntry) {
        if (depth < existingEntry.depth || indirections < existingEntry.indirections) {
          removeFromInventory(inventory, existingEntry);
        } else {
          return;
        }
      }
      inventory.push({
        $ref,
        // The JSON Reference (e.g. {$ref: string})
        parent: $refParent,
        // The object that contains this $ref pointer
        key: $refKey,
        // The key in `parent` that is the $ref pointer
        pathFromRoot,
        // The path to the $ref pointer, from the JSON Schema root
        depth,
        // How far from the JSON Schema root is this $ref pointer?
        file,
        // The file that the $ref pointer resolves to
        hash,
        // The hash within `file` that the $ref pointer resolves to
        value: pointer.value,
        // The resolved value of the $ref pointer
        circular: pointer.circular,
        // Is this $ref pointer DIRECTLY circular? (i.e. it references itself)
        extended,
        // Does this $ref extend its resolved value? (i.e. it has extra properties, in addition to "$ref")
        external,
        // Does this $ref pointer point to a file other than the main JSON Schema file?
        indirections
        // The number of indirect references that were traversed to resolve the value
      });
      if (!existingEntry || external) {
        crawl(pointer.value, null, pointer.path, pathFromRoot, indirections + 1, inventory, $refs, options);
      }
    }
    function remap(inventory) {
      inventory.sort((a, b) => {
        if (a.file !== b.file) {
          return a.file < b.file ? -1 : 1;
        } else if (a.hash !== b.hash) {
          return a.hash < b.hash ? -1 : 1;
        } else if (a.circular !== b.circular) {
          return a.circular ? -1 : 1;
        } else if (a.extended !== b.extended) {
          return a.extended ? 1 : -1;
        } else if (a.indirections !== b.indirections) {
          return a.indirections - b.indirections;
        } else if (a.depth !== b.depth) {
          return a.depth - b.depth;
        } else {
          const aDefinitionsIndex = a.pathFromRoot.lastIndexOf("/definitions");
          const bDefinitionsIndex = b.pathFromRoot.lastIndexOf("/definitions");
          if (aDefinitionsIndex !== bDefinitionsIndex) {
            return bDefinitionsIndex - aDefinitionsIndex;
          } else {
            return a.pathFromRoot.length - b.pathFromRoot.length;
          }
        }
      });
      let file, hash, pathFromRoot;
      for (const entry of inventory) {
        if (!entry.external) {
          entry.$ref.$ref = entry.hash;
        } else if (entry.file === file && entry.hash === hash) {
          entry.$ref.$ref = pathFromRoot;
        } else if (entry.file === file && entry.hash.indexOf(hash + "/") === 0) {
          entry.$ref.$ref = pointer_js_1.default.join(pathFromRoot, pointer_js_1.default.parse(entry.hash.replace(hash, "#")));
        } else {
          file = entry.file;
          hash = entry.hash;
          pathFromRoot = entry.pathFromRoot;
          entry.$ref = entry.parent[entry.key] = ref_js_1.default.dereference(entry.$ref, entry.value);
          if (entry.circular) {
            entry.$ref.$ref = entry.pathFromRoot;
          }
        }
      }
    }
    function findInInventory(inventory, $refParent, $refKey) {
      for (const existingEntry of inventory) {
        if (existingEntry && existingEntry.parent === $refParent && existingEntry.key === $refKey) {
          return existingEntry;
        }
      }
      return void 0;
    }
    function removeFromInventory(inventory, entry) {
      const index = inventory.indexOf(entry);
      inventory.splice(index, 1);
    }
    exports.default = bundle;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/dereference.js
var require_dereference = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/dereference.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    var ref_js_1 = __importDefault(require_ref2());
    var pointer_js_1 = __importDefault(require_pointer());
    var ono_1 = require_cjs();
    var url = __importStar(require_url());
    var errors_1 = require_errors2();
    exports.default = dereference;
    function dereference(parser, options) {
      const start = Date.now();
      const dereferenced = crawl(parser.schema, parser.$refs._root$Ref.path, "#", /* @__PURE__ */ new Set(), /* @__PURE__ */ new Set(), /* @__PURE__ */ new Map(), parser.$refs, options, start);
      parser.$refs.circular = dereferenced.circular;
      parser.schema = dereferenced.value;
    }
    function crawl(obj, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime) {
      let dereferenced;
      const result = {
        value: obj,
        circular: false
      };
      if (options && options.timeoutMs) {
        if (Date.now() - startTime > options.timeoutMs) {
          throw new errors_1.TimeoutError(options.timeoutMs);
        }
      }
      const derefOptions = options.dereference || {};
      const isExcludedPath = derefOptions.excludedPathMatcher || (() => false);
      if (derefOptions?.circular === "ignore" || !processedObjects.has(obj)) {
        if (obj && typeof obj === "object" && !ArrayBuffer.isView(obj) && !isExcludedPath(pathFromRoot)) {
          parents.add(obj);
          processedObjects.add(obj);
          if (ref_js_1.default.isAllowed$Ref(obj, options)) {
            dereferenced = dereference$Ref(obj, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
            result.circular = dereferenced.circular;
            result.value = dereferenced.value;
          } else {
            for (const key of Object.keys(obj)) {
              const keyPath = pointer_js_1.default.join(path, key);
              const keyPathFromRoot = pointer_js_1.default.join(pathFromRoot, key);
              if (isExcludedPath(keyPathFromRoot)) {
                continue;
              }
              const value = obj[key];
              let circular = false;
              if (ref_js_1.default.isAllowed$Ref(value, options)) {
                dereferenced = dereference$Ref(value, keyPath, keyPathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
                circular = dereferenced.circular;
                if (obj[key] !== dereferenced.value) {
                  obj[key] = dereferenced.value;
                  derefOptions?.onDereference?.(value.$ref, obj[key], obj, key);
                }
              } else {
                if (!parents.has(value)) {
                  dereferenced = crawl(value, keyPath, keyPathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
                  circular = dereferenced.circular;
                  if (obj[key] !== dereferenced.value) {
                    obj[key] = dereferenced.value;
                  }
                } else {
                  circular = foundCircularReference(keyPath, $refs, options);
                }
              }
              result.circular = result.circular || circular;
            }
          }
          parents.delete(obj);
        }
      }
      return result;
    }
    function dereference$Ref($ref, path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime) {
      const isExternalRef = ref_js_1.default.isExternal$Ref($ref);
      const shouldResolveOnCwd = isExternalRef && options?.dereference?.externalReferenceResolution === "root";
      const $refPath = url.resolve(shouldResolveOnCwd ? url.cwd() : path, $ref.$ref);
      const cache = dereferencedCache.get($refPath);
      if (cache && !cache.circular) {
        const refKeys = Object.keys($ref);
        if (refKeys.length > 1) {
          const extraKeys = {};
          for (const key of refKeys) {
            if (key !== "$ref" && !(key in cache.value)) {
              extraKeys[key] = $ref[key];
            }
          }
          return {
            circular: cache.circular,
            value: Object.assign({}, cache.value, extraKeys)
          };
        }
        return cache;
      }
      const pointer = $refs._resolve($refPath, path, options);
      if (pointer === null) {
        return {
          circular: false,
          value: null
        };
      }
      const directCircular = pointer.circular;
      let circular = directCircular || parents.has(pointer.value);
      if (circular) {
        foundCircularReference(path, $refs, options);
      }
      let dereferencedValue = ref_js_1.default.dereference($ref, pointer.value);
      if (!circular) {
        const dereferenced = crawl(dereferencedValue, pointer.path, pathFromRoot, parents, processedObjects, dereferencedCache, $refs, options, startTime);
        circular = dereferenced.circular;
        dereferencedValue = dereferenced.value;
      }
      if (circular && !directCircular && options.dereference?.circular === "ignore") {
        dereferencedValue = $ref;
      }
      if (directCircular) {
        dereferencedValue.$ref = pathFromRoot;
      }
      const dereferencedObject = {
        circular,
        value: dereferencedValue
      };
      if (Object.keys($ref).length === 1) {
        dereferencedCache.set($refPath, dereferencedObject);
      }
      return dereferencedObject;
    }
    function foundCircularReference(keyPath, $refs, options) {
      $refs.circular = true;
      if (!options.dereference.circular) {
        throw ono_1.ono.reference(`Circular $ref pointer found at ${keyPath}`);
      }
      return true;
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/next.js
var require_next2 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/next.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function makeNext() {
      if (typeof process === "object" && typeof process.nextTick === "function") {
        return process.nextTick;
      } else if (typeof setImmediate === "function") {
        return setImmediate;
      } else {
        return function next(f) {
          setTimeout(f, 0);
        };
      }
    }
    exports.default = makeNext();
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/maybe.js
var require_maybe = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/util/maybe.js"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = maybe;
    var next_js_1 = __importDefault(require_next2());
    function maybe(cb, promise) {
      if (cb) {
        promise.then(function(result) {
          (0, next_js_1.default)(function() {
            cb(null, result);
          });
        }, function(err) {
          (0, next_js_1.default)(function() {
            cb(err);
          });
        });
        return void 0;
      } else {
        return promise;
      }
    }
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/index.js
var require_lib3 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/node_modules/@apidevtools/json-schema-ref-parser/dist/lib/index.js"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getJsonSchemaRefParserDefaultOptions = exports.jsonSchemaParserNormalizeArgs = exports.dereferenceInternal = exports.JSONParserErrorGroup = exports.isHandledError = exports.UnmatchedParserError = exports.ParserError = exports.ResolverError = exports.MissingPointerError = exports.InvalidPointerError = exports.JSONParserError = exports.UnmatchedResolverError = exports.dereference = exports.bundle = exports.resolve = exports.parse = exports.$RefParser = void 0;
    var refs_js_1 = __importDefault(require_refs());
    var parse_js_1 = __importDefault(require_parse());
    var normalize_args_js_1 = __importDefault(require_normalize_args());
    exports.jsonSchemaParserNormalizeArgs = normalize_args_js_1.default;
    var resolve_external_js_1 = __importDefault(require_resolve_external());
    var bundle_js_1 = __importDefault(require_bundle());
    var dereference_js_1 = __importDefault(require_dereference());
    exports.dereferenceInternal = dereference_js_1.default;
    var url = __importStar(require_url());
    var errors_js_1 = require_errors2();
    Object.defineProperty(exports, "JSONParserError", { enumerable: true, get: function() {
      return errors_js_1.JSONParserError;
    } });
    Object.defineProperty(exports, "InvalidPointerError", { enumerable: true, get: function() {
      return errors_js_1.InvalidPointerError;
    } });
    Object.defineProperty(exports, "MissingPointerError", { enumerable: true, get: function() {
      return errors_js_1.MissingPointerError;
    } });
    Object.defineProperty(exports, "ResolverError", { enumerable: true, get: function() {
      return errors_js_1.ResolverError;
    } });
    Object.defineProperty(exports, "ParserError", { enumerable: true, get: function() {
      return errors_js_1.ParserError;
    } });
    Object.defineProperty(exports, "UnmatchedParserError", { enumerable: true, get: function() {
      return errors_js_1.UnmatchedParserError;
    } });
    Object.defineProperty(exports, "UnmatchedResolverError", { enumerable: true, get: function() {
      return errors_js_1.UnmatchedResolverError;
    } });
    Object.defineProperty(exports, "isHandledError", { enumerable: true, get: function() {
      return errors_js_1.isHandledError;
    } });
    Object.defineProperty(exports, "JSONParserErrorGroup", { enumerable: true, get: function() {
      return errors_js_1.JSONParserErrorGroup;
    } });
    var ono_1 = require_cjs();
    var maybe_js_1 = __importDefault(require_maybe());
    var options_js_1 = require_options();
    Object.defineProperty(exports, "getJsonSchemaRefParserDefaultOptions", { enumerable: true, get: function() {
      return options_js_1.getJsonSchemaRefParserDefaultOptions;
    } });
    var $RefParser = class _$RefParser {
      constructor() {
        this.schema = null;
        this.$refs = new refs_js_1.default();
      }
      async parse() {
        const args = (0, normalize_args_js_1.default)(arguments);
        let promise;
        if (!args.path && !args.schema) {
          const err = (0, ono_1.ono)(`Expected a file path, URL, or object. Got ${args.path || args.schema}`);
          return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
        this.schema = null;
        this.$refs = new refs_js_1.default();
        let pathType = "http";
        if (url.isFileSystemPath(args.path)) {
          args.path = url.fromFileSystemPath(args.path);
          pathType = "file";
        } else if (!args.path && args.schema && "$id" in args.schema && args.schema.$id) {
          const params = url.parse(args.schema.$id);
          const port = params.protocol === "https:" ? 443 : 80;
          args.path = `${params.protocol}//${params.hostname}:${port}`;
        }
        args.path = url.resolve(url.cwd(), args.path);
        if (args.schema && typeof args.schema === "object") {
          const $ref = this.$refs._add(args.path);
          $ref.value = args.schema;
          $ref.pathType = pathType;
          promise = Promise.resolve(args.schema);
        } else {
          promise = (0, parse_js_1.default)(args.path, this.$refs, args.options);
        }
        try {
          const result = await promise;
          if (result !== null && typeof result === "object" && !Buffer.isBuffer(result)) {
            this.schema = result;
            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
          } else if (args.options.continueOnError) {
            this.schema = null;
            return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
          } else {
            throw ono_1.ono.syntax(`"${this.$refs._root$Ref.path || result}" is not a valid JSON Schema`);
          }
        } catch (err) {
          if (!args.options.continueOnError || !(0, errors_js_1.isHandledError)(err)) {
            return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
          }
          if (this.$refs._$refs[url.stripHash(args.path)]) {
            this.$refs._$refs[url.stripHash(args.path)].addError(err);
          }
          return (0, maybe_js_1.default)(args.callback, Promise.resolve(null));
        }
      }
      static parse() {
        const parser = new _$RefParser();
        return parser.parse.apply(parser, arguments);
      }
      async resolve() {
        const args = (0, normalize_args_js_1.default)(arguments);
        try {
          await this.parse(args.path, args.schema, args.options);
          await (0, resolve_external_js_1.default)(this, args.options);
          finalize(this);
          return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.$refs));
        } catch (err) {
          return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
      }
      static resolve() {
        const instance = new _$RefParser();
        return instance.resolve.apply(instance, arguments);
      }
      static bundle() {
        const instance = new _$RefParser();
        return instance.bundle.apply(instance, arguments);
      }
      async bundle() {
        const args = (0, normalize_args_js_1.default)(arguments);
        try {
          await this.resolve(args.path, args.schema, args.options);
          (0, bundle_js_1.default)(this, args.options);
          finalize(this);
          return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
        } catch (err) {
          return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
      }
      static dereference() {
        const instance = new _$RefParser();
        return instance.dereference.apply(instance, arguments);
      }
      async dereference() {
        const args = (0, normalize_args_js_1.default)(arguments);
        try {
          await this.resolve(args.path, args.schema, args.options);
          (0, dereference_js_1.default)(this, args.options);
          finalize(this);
          return (0, maybe_js_1.default)(args.callback, Promise.resolve(this.schema));
        } catch (err) {
          return (0, maybe_js_1.default)(args.callback, Promise.reject(err));
        }
      }
    };
    exports.$RefParser = $RefParser;
    exports.default = $RefParser;
    function finalize(parser) {
      const errors = errors_js_1.JSONParserErrorGroup.getParserErrors(parser);
      if (errors.length > 0) {
        throw new errors_js_1.JSONParserErrorGroup(parser);
      }
    }
    exports.parse = $RefParser.parse;
    exports.resolve = $RefParser.resolve;
    exports.bundle = $RefParser.bundle;
    exports.dereference = $RefParser.dereference;
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/lib/options.js
var require_options2 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/lib/options.js"(exports, module) {
    "use strict";
    var { getJsonSchemaRefParserDefaultOptions } = require_lib3();
    var schemaValidator = require_schema5();
    var specValidator = require_spec();
    module.exports = ParserOptions;
    function merge(target, source) {
      if (isMergeable(source)) {
        const keys = Object.keys(source).filter((key) => !["__proto__", "constructor", "prototype"].includes(key));
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const sourceSetting = source[key];
          const targetSetting = target[key];
          if (isMergeable(sourceSetting)) {
            target[key] = merge(targetSetting || {}, sourceSetting);
          } else if (sourceSetting !== void 0) {
            target[key] = sourceSetting;
          }
        }
      }
      return target;
    }
    function isMergeable(val) {
      return val && typeof val === "object" && !Array.isArray(val) && !(val instanceof RegExp) && !(val instanceof Date);
    }
    function ParserOptions(_options) {
      const defaultOptions = getJsonSchemaRefParserDefaultOptions();
      const options = merge(defaultOptions, ParserOptions.defaults);
      return merge(options, _options);
    }
    ParserOptions.defaults = {
      /**
       * Determines how the API definition will be validated.
       *
       * You can add additional validators of your own, replace an existing one with
       * your own implemenation, or disable any validator by setting it to false.
       */
      validate: {
        schema: schemaValidator,
        spec: specValidator
      }
    };
  }
});

// ../../../node_modules/call-me-maybe/src/next.js
var require_next3 = __commonJS({
  "../../../node_modules/call-me-maybe/src/next.js"(exports, module) {
    "use strict";
    function makeNext() {
      if (typeof process === "object" && typeof process.nextTick === "function") {
        return process.nextTick;
      } else if (typeof setImmediate === "function") {
        return setImmediate;
      } else {
        return function next(f) {
          setTimeout(f, 0);
        };
      }
    }
    module.exports = makeNext();
  }
});

// ../../../node_modules/call-me-maybe/src/maybe.js
var require_maybe2 = __commonJS({
  "../../../node_modules/call-me-maybe/src/maybe.js"(exports, module) {
    "use strict";
    var next = require_next3();
    module.exports = function maybe(cb, promise) {
      if (cb) {
        promise.then(function(result) {
          next(function() {
            cb(null, result);
          });
        }, function(err) {
          next(function() {
            cb(err);
          });
        });
        return void 0;
      } else {
        return promise;
      }
    };
  }
});

// ../../../node_modules/@apidevtools/swagger-parser/lib/index.js
var require_lib4 = __commonJS({
  "../../../node_modules/@apidevtools/swagger-parser/lib/index.js"(exports, module) {
    "use strict";
    var validateSchema = require_schema5();
    var validateSpec = require_spec();
    var { jsonSchemaParserNormalizeArgs: normalizeArgs } = require_lib3();
    var util = require_util();
    var Options = require_options2();
    var maybe = require_maybe2();
    var { ono } = require_cjs();
    var { $RefParser } = require_lib3();
    var { dereferenceInternal: dereference } = require_lib3();
    var supported31Versions = ["3.1.0", "3.1.1"];
    var supported30Versions = ["3.0.0", "3.0.1", "3.0.2", "3.0.3", "3.0.4"];
    var supportedVersions = [...supported31Versions, ...supported30Versions];
    var SwaggerParser2 = class extends $RefParser {
      /**
       * Parses the given Swagger API.
       * This method does not resolve any JSON references.
       * It just reads a single file in JSON or YAML format, and parse it as a JavaScript object.
       *
       * @param {string} [path] - The file path or URL of the JSON schema
       * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
       * @param {ParserOptions} [options] - Options that determine how the API is parsed
       * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
       * @returns {Promise} - The returned promise resolves with the parsed API object.
       */
      async parse(path, api, options, callback) {
        let args = normalizeArgs(arguments);
        args.options = new Options(args.options);
        try {
          let schema = await super.parse(args.path, args.schema, args.options);
          if (schema.swagger) {
            if (schema.swagger === void 0 || schema.info === void 0 || schema.paths === void 0) {
              throw ono.syntax(`${args.path || args.schema} is not a valid Swagger API definition`);
            } else if (typeof schema.swagger === "number") {
              throw ono.syntax('Swagger version number must be a string (e.g. "2.0") not a number.');
            } else if (typeof schema.info.version === "number") {
              throw ono.syntax('API version number must be a string (e.g. "1.0.0") not a number.');
            } else if (schema.swagger !== "2.0") {
              throw ono.syntax(`Unrecognized Swagger version: ${schema.swagger}. Expected 2.0`);
            }
          } else {
            if (schema.openapi === void 0 || schema.info === void 0) {
              throw ono.syntax(`${args.path || args.schema} is not a valid Openapi API definition`);
            } else if (schema.paths === void 0) {
              if (supported31Versions.indexOf(schema.openapi) !== -1) {
                if (schema.webhooks === void 0) {
                  throw ono.syntax(`${args.path || args.schema} is not a valid Openapi API definition`);
                }
              } else {
                throw ono.syntax(`${args.path || args.schema} is not a valid Openapi API definition`);
              }
            } else if (typeof schema.openapi === "number") {
              throw ono.syntax('Openapi version number must be a string (e.g. "3.0.0") not a number.');
            } else if (typeof schema.info.version === "number") {
              throw ono.syntax('API version number must be a string (e.g. "1.0.0") not a number.');
            } else if (supportedVersions.indexOf(schema.openapi) === -1) {
              throw ono.syntax(
                `Unsupported OpenAPI version: ${schema.openapi}. Swagger Parser only supports versions ${supportedVersions.join(", ")}`
              );
            }
            util.fixOasRelativeServers(schema, args.path);
          }
          return maybe(args.callback, Promise.resolve(schema));
        } catch (err) {
          return maybe(args.callback, Promise.reject(err));
        }
      }
      /**
       * Parses, dereferences, and validates the given Swagger API.
       * Depending on the options, validation can include JSON Schema validation and/or Swagger Spec validation.
       *
       * @param {string} [path] - The file path or URL of the JSON schema
       * @param {object} [api] - The Swagger API object. This object will be used instead of reading from `path`.
       * @param {ParserOptions} [options] - Options that determine how the API is parsed, dereferenced, and validated
       * @param {Function} [callback] - An error-first callback. The second parameter is the parsed API object.
       * @returns {Promise} - The returned promise resolves with the parsed API object.
       */
      async validate(path, api, options, callback) {
        let me = this;
        let args = normalizeArgs(arguments);
        args.options = new Options(args.options);
        let circular$RefOption = args.options.dereference.circular;
        args.options.validate.schema && (args.options.dereference.circular = "ignore");
        try {
          await this.dereference(args.path, args.schema, args.options);
          args.options.dereference.circular = circular$RefOption;
          if (args.options.validate.schema) {
            validateSchema(me.api);
            if (me.$refs.circular) {
              if (circular$RefOption === true) {
                dereference(me, args.options);
              } else if (circular$RefOption === false) {
                throw ono.reference("The API contains circular references");
              }
            }
          }
          if (args.options.validate.spec) {
            validateSpec(me.api);
          }
          return maybe(args.callback, Promise.resolve(me.schema));
        } catch (err) {
          return maybe(args.callback, Promise.reject(err));
        }
      }
    };
    Object.defineProperty(SwaggerParser2.prototype, "api", {
      configurable: true,
      enumerable: true,
      get() {
        return this.schema;
      }
    });
    var defaultExport = SwaggerParser2;
    defaultExport.validate = (...args) => {
      const defaultInstance = new SwaggerParser2();
      return defaultInstance.validate(...args);
    };
    defaultExport.dereference = (...args) => {
      const defaultInstance = new SwaggerParser2();
      return defaultInstance.dereference(...args);
    };
    defaultExport.bundle = (...args) => {
      const defaultInstance = new SwaggerParser2();
      return defaultInstance.bundle(...args);
    };
    defaultExport.parse = (...args) => {
      const defaultInstance = new SwaggerParser2();
      return defaultInstance.parse(...args);
    };
    defaultExport.resolve = (...args) => {
      const defaultInstance = new SwaggerParser2();
      return defaultInstance.resolve(...args);
    };
    defaultExport.default = defaultExport;
    defaultExport.SwaggerParser = defaultExport;
    module.exports = defaultExport;
  }
});

// src/discover.js
var import_swagger_parser = __toESM(require_lib4(), 1);
import { glob, readFile } from "node:fs/promises";
import { resolve, relative, basename } from "node:path";
import { parseArgs } from "node:util";
var argsConfig = {
  options: {
    help: { type: "boolean", short: "h", default: false },
    format: { type: "string", short: "f", default: "markdown" },
    ignore: { type: "string", short: "i", multiple: true, default: [] }
  },
  allowPositionals: true,
  strict: false
};
var DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/.next/**",
  "**/.nuxt/**"
];
var GLOB_PATTERNS = [
  "**/openapi.{yaml,yml,json}",
  "**/swagger.{yaml,yml,json}",
  "**/api.{yaml,yml,json}",
  "**/*openapi*.{yaml,yml,json}",
  "**/*swagger*.{yaml,yml,json}"
];
async function findSpecFiles(dir, ignores = DEFAULT_IGNORES) {
  const results = /* @__PURE__ */ new Set();
  const matches = glob(GLOB_PATTERNS, { cwd: dir, exclude: ignores });
  for await (const match of matches) {
    results.add(resolve(dir, match));
  }
  return [...results];
}
function looksLikeSpec(content) {
  return content.includes("openapi:") || content.includes('"openapi":') || content.includes("swagger:") || content.includes('"swagger":');
}
function detectGenerated(content) {
  const patterns = [
    /# Generated by/i,
    /<!-- Generated by/i,
    /"x-generator":/i,
    /x-generator:/i,
    /Generated with/i,
    /Auto-generated/i,
    /DO NOT EDIT/i
  ];
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const lines = content.split("\n");
      const line = lines.find((l) => pattern.test(l));
      return { isGenerated: true, comment: line?.trim() };
    }
  }
  return { isGenerated: false };
}
async function analyzeSpec(filePath, basePath) {
  const relativePath = relative(basePath, filePath);
  const content = await readFile(filePath, "utf-8");
  const info = {
    path: relativePath,
    absolutePath: filePath,
    filename: basename(filePath),
    type: "unknown",
    version: "",
    title: "",
    apiVersion: "",
    pathCount: 0,
    operationCount: 0,
    isGenerated: false
  };
  if (!looksLikeSpec(content)) {
    info.error = new Error(
      "File does not appear to be an OpenAPI/Swagger specification"
    );
    return info;
  }
  const generated = detectGenerated(content);
  info.isGenerated = generated.isGenerated;
  if (generated.comment) {
    info.generatorComment = generated.comment;
  }
  try {
    const api = (
      /** @type {any} */
      await import_swagger_parser.default.dereference(filePath)
    );
    if (api.openapi) {
      info.version = api.openapi;
      info.type = api.openapi.startsWith("3.1") ? "openapi-3.1" : "openapi-3.x";
    } else if (api.swagger) {
      info.version = api.swagger;
      info.type = "swagger-2.x";
    }
    info.title = api.info?.title || "Untitled";
    info.apiVersion = api.info?.version || "";
    info.description = api.info?.description;
    const paths = api.paths || {};
    info.pathCount = Object.keys(paths).length;
    info.operationCount = Object.values(paths).reduce((total, pathItem) => {
      const operations = [
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "options",
        "head",
        "trace"
      ];
      return total + operations.filter((op) => pathItem[op]).length;
    }, 0);
    if (api.tags && api.tags.length > 0) {
      info.tags = api.tags.map((t) => t.name);
    }
    if (api.servers && api.servers.length > 0) {
      info.servers = api.servers.map((s) => s.url);
    }
  } catch (err) {
    info.error = err instanceof Error ? err : new Error(String(err));
  }
  return info;
}
function formatMarkdown(result) {
  const lines = [
    "---",
    `date: ${result.discoveredAt}`,
    "discovered_by: aip-discover",
    "status: complete",
    "---",
    "",
    "# API Discovery Report",
    "",
    `**Date:** ${result.discoveredAt}`,
    `**Search Path:** \`${result.searchPath}\``,
    "",
    "## Summary",
    "",
    "| Type | Count |",
    "| ---- | ----- |",
    `| OpenAPI 3.x | ${result.summary.openapi3} |`,
    `| Swagger 2.x | ${result.summary.swagger2} |`,
    `| Parse Errors | ${result.summary.parseErrors} |`,
    `| **Total** | **${result.summary.total}** |`,
    ""
  ];
  if (result.specs.length === 0) {
    lines.push(
      "## No Specifications Found",
      "",
      "No OpenAPI or Swagger specifications were found in this directory.",
      ""
    );
  } else {
    lines.push("## Specifications Found", "");
    for (const spec of result.specs) {
      lines.push(`### ${spec.title || spec.filename}`, "");
      if (spec.error) {
        lines.push(`- **Path:** \`${spec.path}\``);
        lines.push(`- **Status:** Parse Error`);
        lines.push(`- **Error:** ${spec.error.message}`);
      } else {
        lines.push(`- **Path:** \`${spec.path}\``);
        lines.push(`- **Type:** ${spec.type}`);
        lines.push(`- **Version:** ${spec.version}`);
        if (spec.apiVersion)
          lines.push(`- **API Version:** ${spec.apiVersion}`);
        lines.push(`- **Paths:** ${spec.pathCount}`);
        lines.push(`- **Operations:** ${spec.operationCount}`);
        if (spec.servers?.length) {
          lines.push(`- **Servers:** ${spec.servers.join(", ")}`);
        }
        if (spec.tags?.length) {
          lines.push(`- **Tags:** ${spec.tags.join(", ")}`);
        }
        if (spec.isGenerated) {
          lines.push(
            `- **Generated:** Yes${spec.generatorComment ? ` (${spec.generatorComment})` : ""}`
          );
        }
        if (spec.description) {
          lines.push(
            `- **Description:** ${spec.description.split("\n")[0].substring(0, 100)}...`
          );
        }
      }
      lines.push("");
    }
  }
  lines.push("## Next Steps", "");
  if (result.specs.length > 0) {
    const validSpecs = result.specs.filter((s) => !s.error);
    if (validSpecs.length > 0) {
      lines.push(
        `Run \`/api-review ${validSpecs[0].path}\` to analyze against AIP rules.`
      );
    }
  } else {
    lines.push("- Check if specs are in a different location");
    lines.push(
      "- Generate specs from code annotations if using a code-first approach"
    );
  }
  lines.push("");
  return lines.join("\n");
}
function formatJSON(result) {
  return JSON.stringify(result, null, 2);
}
function printHelp() {
  console.log(`
AIP OpenAPI Discovery
Find OpenAPI specifications in a codebase.

USAGE:
  aip-discover [directory] [options]

ARGUMENTS:
  [directory]         Directory to search (default: current directory)

OPTIONS:
  -h, --help            Show this help message
  -f, --format <fmt>    Output format: markdown (default), json
  -i, --ignore <glob>   Glob pattern to ignore (can be repeated)

DEFAULT IGNORES:
  **/node_modules/**, **/.git/**, **/dist/**, **/build/**,
  **/coverage/**, **/.next/**, **/.nuxt/**

EXAMPLES:
  # Discover in current directory
  aip-discover

  # Discover in specific path
  aip-discover ./api

  # JSON output
  aip-discover --format json

  # Ignore additional patterns
  aip-discover -i '**/vendor/**' -i '**/tmp/**'
`);
}
async function main(args) {
  const { values, positionals } = parseArgs({ ...argsConfig, args });
  if (values.help) {
    printHelp();
    return 0;
  }
  const searchPath = resolve(positionals[0] || ".");
  const format = (
    /** @type {string} */
    values.format
  );
  const extraIgnores = (
    /** @type {string[]} */
    values.ignore
  );
  const ignores = [...DEFAULT_IGNORES, ...extraIgnores];
  const files = await findSpecFiles(searchPath, ignores);
  const specs = [];
  for (const file of files) {
    const info = await analyzeSpec(file, searchPath);
    specs.push(info);
  }
  const result = {
    searchPath,
    discoveredAt: (/* @__PURE__ */ new Date()).toISOString(),
    specs,
    summary: {
      total: specs.length,
      openapi3: specs.filter((s) => s.type.startsWith("openapi-3")).length,
      swagger2: specs.filter((s) => s.type === "swagger-2.x").length,
      parseErrors: specs.filter((s) => s.error).length
    }
  };
  const output = format === "json" ? formatJSON(result) : formatMarkdown(result);
  console.log(output);
  return 0;
}
var isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const exitCode = await main(process.argv.slice(2));
  process.exit(exitCode);
}
export {
  DEFAULT_IGNORES,
  GLOB_PATTERNS,
  analyzeSpec,
  detectGenerated,
  findSpecFiles,
  formatJSON,
  formatMarkdown,
  looksLikeSpec,
  main
};
//# sourceMappingURL=discover.bundle.js.map
