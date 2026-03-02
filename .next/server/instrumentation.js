"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\n/**\n * instrumentation.ts\n * รันก่อน Next.js app start — ใช้สำหรับตั้งค่า Node.js runtime\n * ไฟล์นี้ไม่ถูก bundle โดย webpack, รันใน Node.js จริงๆ\n */ async function register() {\n    if (true) {\n        const dns = await Promise.resolve(/*! import() */).then(__webpack_require__.t.bind(__webpack_require__, /*! dns */ \"dns\", 23));\n        dns.setDefaultResultOrder?.('ipv4first');\n        // ใช้ Google DNS เฉพาะเมื่อ MONGODB_USE_GOOGLE_DNS=1 — ตอน Deploy ไม่ตั้ง จะใช้ DNS ของเซิร์ฟเวอร์ (ไม่ผูก IP/DNS)\n        const useGoogleDns = process.env.MONGODB_USE_GOOGLE_DNS === '1' || process.env.MONGODB_USE_GOOGLE_DNS === 'true';\n        if (useGoogleDns) {\n            dns.setServers([\n                '8.8.8.8',\n                '8.8.4.4'\n            ]);\n            console.log('[instrumentation] DNS servers set to Google DNS (8.8.8.8, 8.8.4.4)');\n        }\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztDQUlDLEdBQ00sZUFBZUE7SUFDcEIsSUFBSUMsSUFBcUMsRUFBRTtRQUN6QyxNQUFNRyxNQUFNLE1BQU0sNEdBQWE7UUFDL0JBLElBQUlDLHFCQUFxQixHQUFHO1FBQzVCLG1IQUFtSDtRQUNuSCxNQUFNQyxlQUNKTCxRQUFRQyxHQUFHLENBQUNLLHNCQUFzQixLQUFLLE9BQU9OLFFBQVFDLEdBQUcsQ0FBQ0ssc0JBQXNCLEtBQUs7UUFDdkYsSUFBSUQsY0FBYztZQUNoQkYsSUFBSUksVUFBVSxDQUFDO2dCQUFDO2dCQUFXO2FBQVU7WUFDckNDLFFBQVFDLEdBQUcsQ0FBQztRQUNkO0lBQ0Y7QUFDRiIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxtYWhhd1xcRGVza3RvcFxcQm9zcyBQaGlyaXlha29yblxcQ29kZWluZ1dvcmtcXEZsb3JhXFxmbG9yYVxcaW5zdHJ1bWVudGF0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogaW5zdHJ1bWVudGF0aW9uLnRzXG4gKiDguKPguLHguJnguIHguYjguK3guJkgTmV4dC5qcyBhcHAgc3RhcnQg4oCUIOC5g+C4iuC5ieC4quC4s+C4q+C4o+C4seC4muC4leC4seC5ieC4h+C4hOC5iOC4siBOb2RlLmpzIHJ1bnRpbWVcbiAqIOC5hOC4n+C4peC5jOC4meC4teC5ieC5hOC4oeC5iOC4luC4ueC4gSBidW5kbGUg4LmC4LiU4LiiIHdlYnBhY2ssIOC4o+C4seC4meC5g+C4mSBOb2RlLmpzIOC4iOC4o+C4tOC4h+C5hlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XG4gIGlmIChwcm9jZXNzLmVudi5ORVhUX1JVTlRJTUUgPT09ICdub2RlanMnKSB7XG4gICAgY29uc3QgZG5zID0gYXdhaXQgaW1wb3J0KCdkbnMnKTtcbiAgICBkbnMuc2V0RGVmYXVsdFJlc3VsdE9yZGVyPy4oJ2lwdjRmaXJzdCcpO1xuICAgIC8vIOC5g+C4iuC5iSBHb29nbGUgRE5TIOC5gOC4ieC4nuC4suC4sOC5gOC4oeC4t+C5iOC4rSBNT05HT0RCX1VTRV9HT09HTEVfRE5TPTEg4oCUIOC4leC4reC4mSBEZXBsb3kg4LmE4Lih4LmI4LiV4Lix4LmJ4LiHIOC4iOC4sOC5g+C4iuC5iSBETlMg4LiC4Lit4LiH4LmA4LiL4Li04Lij4LmM4Lif4LmA4Lin4Lit4Lij4LmMICjguYTguKHguYjguJzguLnguIEgSVAvRE5TKVxuICAgIGNvbnN0IHVzZUdvb2dsZURucyA9XG4gICAgICBwcm9jZXNzLmVudi5NT05HT0RCX1VTRV9HT09HTEVfRE5TID09PSAnMScgfHwgcHJvY2Vzcy5lbnYuTU9OR09EQl9VU0VfR09PR0xFX0ROUyA9PT0gJ3RydWUnO1xuICAgIGlmICh1c2VHb29nbGVEbnMpIHtcbiAgICAgIGRucy5zZXRTZXJ2ZXJzKFsnOC44LjguOCcsICc4LjguNC40J10pO1xuICAgICAgY29uc29sZS5sb2coJ1tpbnN0cnVtZW50YXRpb25dIEROUyBzZXJ2ZXJzIHNldCB0byBHb29nbGUgRE5TICg4LjguOC44LCA4LjguNC40KScpO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUlVOVElNRSIsImRucyIsInNldERlZmF1bHRSZXN1bHRPcmRlciIsInVzZUdvb2dsZURucyIsIk1PTkdPREJfVVNFX0dPT0dMRV9ETlMiLCJzZXRTZXJ2ZXJzIiwiY29uc29sZSIsImxvZyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ }),

/***/ "dns":
/*!**********************!*\
  !*** external "dns" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("dns");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();