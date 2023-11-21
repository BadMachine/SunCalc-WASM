/** WASM loader for Web environments. */
const wasm = /* #__PURE__ */ fetch(/* #__PURE__ */ new URL('./suncalc.wasm', import.meta.url));
export default wasm;
