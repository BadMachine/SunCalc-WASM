import wasm from './wasm';
import { instantiate, __AdaptedExports } from '../build/suncalc';


interface Illumination {
	fraction: number;
	phase: number;
	angle: number;
}

interface Position {
	azimuth: number;
	altitude: number;
	distance: number;
	parallacticAngle: number;
}

interface Coords {
	rightAscension: number;
	declination: number;
	distance: number;
}

interface SunTimes {
	solarNoon: bigint;
	nadir: bigint;
	sunrise: bigint;
	sunset: bigint;
	sunrise_end: bigint;
	sunsetStart: bigint;
	dawn: bigint;
	dusk: bigint;
	nauticalDawn: bigint;
	nauticalDusk: bigint;
	nightEnd: bigint;
	night: bigint;
	goldenHourEnd: bigint;
	goldenHour: bigint;
}
// Initialization.

let exports: typeof __AdaptedExports;

/* Promise resolving when WebAssembly is ready. */
export const ready = /* #__PURE__ */ new Promise<void>(async (resolve, reject) => {
	try {
		const module = await WebAssembly.compile(await wasm);
		exports = await instantiate(module as BufferSource, { env: undefined });
		resolve();
	} catch (e) {
		reject(e);
	}
});

// Wrapper API.

export function getMoonIllumination(timestamp: number): Illumination {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.getMoonIllumination(timestamp);
}

export function getMoonPosition(timestamp: number, latitude: number, longitude: number): Position {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.getMoonPosition(timestamp, latitude, longitude);
}

export function getMoonCoords(d: number): Coords { //geocentric ecliptic coordinates of the moon
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.moonCoords(d);
}

export function getTimes(timestamp: number, latitude: number, longitude: number, height: number = 0): SunTimes {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.getTimes(timestamp, latitude, longitude, height);
}

export function getPosition(timestamp: number, latitude: number, longitude: number): Position {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.getPosition(timestamp, latitude, longitude);
}

export function sunCoords(timestamp: number): Coords {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.sunCoords(timestamp);
}

export function fromJulian(timestamp: number): bigint {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.fromJulian(timestamp);
}

export function toJulian(timestamp: number): number {
	if (!exports) {
		throw new Error('WebAssembly not yet initialized: await "ready" export.');
	}
	return exports.toJulian(timestamp);
}



