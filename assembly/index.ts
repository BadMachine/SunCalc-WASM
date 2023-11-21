declare function print(n: i32): void;

class Position {
  azimuth: f64;
  altitude: f64;
  distance: f64 = 0;
  parallacticAngle: f64 = 0;
}

class SunTimes {
  solarNoon: Timestamp;
  nadir: Timestamp;
  sunrise: Timestamp;
  sunset: Timestamp;
  sunrise_end: Timestamp;
  sunsetStart: Timestamp;
  dawn: Timestamp;
  dusk: Timestamp;
  nauticalDawn: Timestamp;
  nauticalDusk: Timestamp;
  nightEnd: Timestamp;
  night: Timestamp;
  goldenHourEnd: Timestamp;
  goldenHour: Timestamp;
}

class Coords {
  rightAscension: f64;
  declination: f64;
  distance: f64  = 0;
}

class Illumination {
  fraction: f64;
  phase: f64;
  angle: f64;
}

type Timestamp = u64;

// date/time constants and conversions
const MILLISECONDS_PER_DAY: u32 = 1000 * 60 * 60 * 24;
const J1970: u32 = 2_440_588;
const J2000: u32 = 2_451_545;
const TO_RAD: f64 = Math.PI / 180.0;
const OBLIQUITY_OF_EARTH: f64 = 23.4397 * TO_RAD;
const PERIHELION_OF_EARTH: f64 = 102.9372 * TO_RAD;
const PI = Math.PI;
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const atan2 = Math.atan2;
const asin = Math.asin;
const acos = Math.acos;
const round = Math.round;
function toJulian(timestamp: number): f64 {
  return <f64>timestamp / <f64>MILLISECONDS_PER_DAY - 0.5 as f64 + <f64>J1970
}

function fromJulian(j: f64): Timestamp {
  return round((j + 0.5 - J1970 as f64) * MILLISECONDS_PER_DAY as f64) as i64
}

function toDays(timestamp: number): f64 {
  return toJulian(timestamp) - <f64>J2000;
}

// general calculations for position

function rightAscension(l: f64, b: f64): f64 {

  return atan2(sin(l) * cos(OBLIQUITY_OF_EARTH) - tan(b) * sin(OBLIQUITY_OF_EARTH), cos(l) );
}

function declination(l: f64, b: f64): f64 {
  return asin((sin(b) * cos(OBLIQUITY_OF_EARTH) + cos(b) * sin(OBLIQUITY_OF_EARTH) * sin(l)))
}

function azimuth(h: f64, phi: f64, dec: f64): f64 {
  return atan2(sin(h), cos(h) * sin(phi) - tan(dec) * cos(phi))
}

function altitude(h: f64, phi: f64, dec: f64): f64 {
  return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(h));
}

function siderealTime(d: f64, lw: f64): f64 {
  return ((280.16 + 360.985_623_5 * d) * TO_RAD) - lw
}

function astro_refraction(h: f64): f64 {
  let hh = h < 0.0 ? 0.0 : h;

  return tan(0.0002967 / (hh + 0.00312536 / (hh + 0.08901179)))
}

// general sun calculations

function solar_mean_anomaly(d: f64): f64 {
  return (357.5291 + 0.985_600_28 * d) * TO_RAD
}

function equationOfCenter(m: f64): f64 {
  return (1.9148 * sin(1.0 * m) + 0.02 * sin(2.0 * m) + 0.0003 * sin(3.0 * m)) * TO_RAD;
}

function eclipticLongitude(m: f64): f64 {
  return m + equationOfCenter(m) + PERIHELION_OF_EARTH + PI;
}

// calculations for sun times

const J0: f64 = 0.0009;

function julianCycle(d: f64, lw: f64): f64 {
  return round(d - J0 - lw / (2.0 * PI))
}

function approxTransit(h_t: f64, lw: f64, n: f64): f64 {
  return J0 + (h_t + lw) / (2.0 * PI) + n;
}

function solarTransitJ(ds: f64, m: f64, l: f64): f64 {
  return J2000 as f64 + ds + 0.0053 * sin(m) - 0.0069 * sin(2.0 * l)
}

function hourAngle(h: f64, phi: f64, dec: f64): f64 {

  return acos( (sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec)) );
}

function observerAngle(height: f64): f64 {
  return -2.076 * sqrt(height) / 60.0
}

function get_set_j(h: f64, lw: f64, phi: f64, dec: f64, n: f64, m: f64, l: f64): f64 {
  let w = hourAngle(h, phi, dec);
  let a = approxTransit(w, lw, n);

  return solarTransitJ(a, m, l);
}

export function sunCoords(d: f64): Coords {
  let m = solar_mean_anomaly(d);
  let l = eclipticLongitude(m);

  const coords = new Coords();
  coords.rightAscension = rightAscension(l, 0.0);
  coords.declination = declination(l, 0.0);

  return coords;
}

/// Calculates the sun position for a given date and latitude/longitude.
/// The angles are calculated as [radians](https://en.wikipedia.org/wiki/Radian).
///
/// * `unixtime`  - [unix time](https://en.wikipedia.org/wiki/Unix_time) in milliseconds.
/// * `lat`       - [latitude](https://en.wikipedia.org/wiki/Latitude) in degrees.
/// * `lon`       - [longitude](https://en.wikipedia.org/wiki/Longitude) in degrees.
/// calculates the sun position for a given date and latitude/longitude
function getPosition(timestamp: number, lat: f64, lon: f64): Position {
  let lw = -lon * TO_RAD;
  let phi = lat * TO_RAD;
  let d = toDays(<f64>timestamp);
  let m = solar_mean_anomaly(d);
  let l = eclipticLongitude(m);
  let dec = declination(l, 0.0);
  let ra = rightAscension(l, 0.0);
  let h = siderealTime(d, lw) - ra;

  const position = new Position();
  position.azimuth = azimuth(h, phi, dec);
  position.altitude = altitude(h, phi, dec);

  return position;
}

class SunTime {
  constructor(public value: f64) {}

  // Define constants
  static SUNRISE_SUNSET: SunTime = new SunTime(-0.833);
  static SUNRISE_END_SUNSET_START: SunTime = new SunTime(-0.3);
  static DAWN_DUSK: SunTime = new SunTime(-6.0);
  static NAUTICAL_DAWN_NAUTICAL_DUSK: SunTime = new SunTime(-12.0);
  static NIGHT_END_NIGHT: SunTime = new SunTime(-18.0);
  static GOLDEN_HOUR_END_GOLDEN_HOUR: SunTime = new SunTime(6.0);

  // Define calc method
  public calc(
    j_noon: f64,
    dh: f64,
    lw: f64,
    phi: f64,
    dec: f64,
    n: f64,
    m: f64,
    l: f64,
  ): Array<Timestamp> {
    let h0 = (this.value + dh) * Math.PI / 180.0;
    let j_set = get_set_j(h0, lw, phi, dec, n, m, l);
    let j_rise = j_noon - (j_set - j_noon);
    return [fromJulian(j_rise), fromJulian(j_set)];
  }
}

function getTimes(timestamp: number, lat: f64, lon: f64, h: f64 = 0): SunTimes {
  let height = h;
  let lw = -lon * TO_RAD;
  let phi = lat * TO_RAD;
  let dh = observerAngle(height);

  let d = toDays(<f64>timestamp);
  let n = julianCycle(d, lw);
  let ds = approxTransit(0.0, lw, n);

  let m = solar_mean_anomaly(ds);
  let l = eclipticLongitude(m);
  let dec = declination(l, 0.0);

  let j_noon = solarTransitJ(ds, m, l);



  let time = SunTime.SUNRISE_SUNSET.calc(j_noon, dh, lw, phi, dec, n, m, l);
  const sunrise = time[0];
  const sunset = time[1];

  const timeStart = SunTime.SUNRISE_END_SUNSET_START.calc(j_noon, dh, lw, phi, dec, n, m, l);
  const sunrise_end = timeStart[0];
  const sunsetStart = timeStart[1];
  const dawnDusk = SunTime.DAWN_DUSK.calc(j_noon, dh, lw, phi, dec, n, m, l);
  const dawn = dawnDusk[0];
  const dusk = dawnDusk[1];
  const nautical = SunTime.NAUTICAL_DAWN_NAUTICAL_DUSK.calc(j_noon, dh, lw, phi, dec, n, m, l);
  const nauticalDawn = nautical[0];
  const nauticalDusk = nautical[1]
  const nightTime = SunTime.NIGHT_END_NIGHT.calc(j_noon, dh, lw, phi, dec, n, m, l);
  const nightEnd = nightTime[0];
  const night = nightTime[1];
  const golden = SunTime.GOLDEN_HOUR_END_GOLDEN_HOUR.calc(j_noon, dh, lw, phi, dec, n, m, l);
  const goldenHourEnd = golden[0];
  const goldenHour = golden[1]

  const result = new SunTimes();
  result.solarNoon = fromJulian(j_noon);
  result.nadir = fromJulian(j_noon - 0.5);
  result.sunrise = sunrise;
  result.sunset = sunset;
  result.sunsetStart = sunsetStart;
  result.sunrise_end = sunrise_end;
  result.dawn = dawn;
  result.dusk = dusk;
  result.nauticalDawn = nauticalDawn;
  result.nauticalDusk = nauticalDusk;
  result.nightEnd = nightEnd;
  result.night = night;
  result.goldenHour = goldenHour;
  result.goldenHourEnd = goldenHourEnd;

  return result;
}

// general moon calculations, based on http://aa.quae.nl/en/reken/hemelpositie.html formulas

function lunarMeanAnomaly(d: f64): f64 {
  return (134.963 + 13.064993 * d) * TO_RAD;
}

function lunarEclipticLongitude(d: f64): f64 {
  return (218.316 + 13.176396 * d) * TO_RAD;
}

function lunarMeanDistance(d: f64): f64 {
  return (93.272 + 13.229350 * d) * TO_RAD;
}

function moonCoords(d: f64): Coords {
  let l = lunarEclipticLongitude(d);
  let m = lunarMeanAnomaly(d);
  let f = lunarMeanDistance(d);

  let lng = l + TO_RAD * 6.289 * sin(m);
  let lat = TO_RAD * 5.128 * sin(f);
  let distance = 385001.0 - 20905.0 * cos(m); // in km

  const coords = new Coords();
  coords.rightAscension = rightAscension(lng, lat);
  coords.declination = declination(lng, lat)
  coords.distance = distance || 0;

  return coords;
}

/// Calculates the moon position for a given date and latitude/longitude
function getMoonPosition(timestamp: number, lat: f64, lon: f64): Position {
  let lw = TO_RAD * -lon;
  let phi = TO_RAD * lat;
  let d = toDays(<f64>timestamp);

  let c = moonCoords(d);

  let h = siderealTime(d, lw) - c.rightAscension;
  let alt = altitude(h, phi, c.declination);
  alt = alt + astro_refraction(alt);

  // formula 14.1 of "Astronomical Algorithms" 2nd edition by Jean Meeus (Willmann-Bell, Richmond) 1998.

  const pa = atan2(sin(h), tan(phi) * cos(c.declination) - sin(c.declination) * cos(h));

  const position = new Position();
  position.azimuth = azimuth(h, phi, c.declination);
  position.altitude = alt;
  position.distance = c.distance || 0;
  position.parallacticAngle = pa || 0;

  return position;
}


/// Calculates the moon illumination, phase, and angle for a given date
function getMoonIllumination(timestamp: number): Illumination {
  let d = toDays(<f64>timestamp);
  let s = sunCoords(d);
  let m = moonCoords(d);
  let a = lunarMeanAnomaly(d);


  let sdist = 149598000 as f64;

  let phi = acos(sin(s.declination) * sin(m.declination) + cos(s.declination) * cos(m.declination) * cos(s.rightAscension - m.rightAscension))

  let inc = atan2(sdist * sin(phi), m.distance - sdist * cos(phi))

  let angle = atan2(
    cos(s.declination) * sin(s.rightAscension - m.rightAscension),
    sin(s.declination) * cos(m.declination) - cos(s.declination) * sin(m.declination) * cos(s.rightAscension - m.rightAscension)
  );

  let sign = angle < 0.0 ? -1.0 : 1.0;

  const illumination = new Illumination();
  illumination.angle = angle;
  illumination.phase = 0.5 + 0.5 * inc * sign / PI;
  illumination.fraction = (1.0 + cos(inc)) / 2.0;


  return illumination
}

export default {
  memory,
  toJulian,
  fromJulian,
  toDays,
  azimuth,
  sunCoords,
  getPosition,
  getTimes,
  lunarMeanAnomaly,
  lunarEclipticLongitude,
  lunarMeanDistance,
  moonCoords,
  getMoonPosition,
  getMoonIllumination,
};
