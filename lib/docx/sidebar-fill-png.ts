import { crc32, deflateSync } from "node:zlib";

/**
 * Tiny PNG writer for the DOCX sidebar rail. Word cannot paint a table-cell
 * fill across every page, so the HTML/PDF gradient (or solid color) is baked
 * into a strip that the header draws behind the document.
 */

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function mixStops(stops: string[], t: number): [number, number, number] {
  if (stops.length === 1) return hexRgb(stops[0]!);
  const scaled = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(Math.floor(scaled), stops.length - 2);
  const local = scaled - i;
  const a = hexRgb(stops[i]!);
  const b = hexRgb(stops[i + 1]!);
  return [lerp(a[0], b[0], local), lerp(a[1], b[1], local), lerp(a[2], b[2], local)];
}

function chunk(type: string, data: Buffer): Buffer {
  const payload = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(payload) >>> 0);
  return Buffer.concat([len, payload, crc]);
}

function encodeRgbPng(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number]
): Buffer {
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const o = 1 + x * 3;
      row[o] = r;
      row[o + 1] = g;
      row[o + 2] = b;
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const STRIP_HEIGHT = 297;

/** Vertical strip matching `colors.sidebar` (solid or gradient). */
export function sidebarFillPng(stops: string[]): Buffer {
  const colors = stops.length > 0 ? stops : ["#1f3550"];
  if (colors.length === 1) {
    const rgb = hexRgb(colors[0]!);
    return encodeRgbPng(1, 1, () => rgb);
  }
  return encodeRgbPng(1, STRIP_HEIGHT, (_x, y) => mixStops(colors, y / (STRIP_HEIGHT - 1)));
}
