// src/wasm.ts — Placeholder WASM loader.
import { readFile } from 'node:fs/promises';
const wasmURL = /* #__PURE__ */ new URL('./release.wasm', import.meta.url);
const wasm = /* #__PURE__ */ readFile(wasmURL);
export default wasm;