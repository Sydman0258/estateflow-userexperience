import type { CSSProperties } from "react";

/**
 * Hero illustration: a three-storey Newari brick house at dusk, under a string of
 * prayer flags, with the Himalaya behind it. The windows light up one by one on page
 * load (see .win / .glow in globals.css), then stay lit.
 */

const TIMBER = "#2a1109";

type Win = { x: number; y: number; w: number; h: number; d: number };

// d = animation delay in seconds. Ground floor, then the carved middle window, then the top floor.
const WINDOWS: Win[] = [
  { x: 120, y: 548, w: 40, h: 36, d: 0.6 },
  { x: 360, y: 548, w: 40, h: 36, d: 1.0 },
  { x: 170, y: 452, w: 56, h: 48, d: 1.3 },
  { x: 232, y: 452, w: 56, h: 48, d: 1.45 },
  { x: 294, y: 452, w: 56, h: 48, d: 1.6 },
  { x: 104, y: 456, w: 32, h: 40, d: 1.9 },
  { x: 384, y: 456, w: 32, h: 40, d: 2.05 },
  { x: 140, y: 356, w: 34, h: 48, d: 2.4 },
  { x: 243, y: 356, w: 34, h: 48, d: 2.55 },
  { x: 346, y: 356, w: 34, h: 48, d: 2.7 },
];

const FLAG_COLORS = ["#2f6fd0", "#f4f6f8", "#d6402f", "#2f9e5a", "#f4b63f"];

/** Prayer flags hung along a quadratic curve. */
function flags() {
  const P0 = [30, 160];
  const P1 = [260, 250];
  const P2 = [490, 150];
  const out: { x: number; y: number; angle: number; color: string }[] = [];
  const count = 15;
  for (let i = 0; i < count; i++) {
    const t = 0.07 + (0.86 * i) / (count - 1);
    const x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0];
    const y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1];
    const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
    const dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
    out.push({
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      angle: Math.round((Math.atan2(dy, dx) * 180) / Math.PI * 100) / 100,
      color: FLAG_COLORS[i % FLAG_COLORS.length],
    });
  }
  return out;
}

export default function Facade() {
  const delay = (d: number) => ({ "--d": `${d}s` }) as CSSProperties;

  return (
    <svg
      viewBox="0 0 520 640"
      role="img"
      aria-label="Illustration of a three-storey Newari brick house at dusk, its windows lighting up one by one beneath prayer flags and the Himalaya"
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="ef-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1730" />
          <stop offset="0.55" stopColor="#223f6e" />
          <stop offset="0.82" stopColor="#c46a52" />
        </linearGradient>
        <pattern id="ef-brick" width="28" height="12" patternUnits="userSpaceOnUse">
          <rect width="28" height="12" fill="#b8402a" />
          <path
            d="M0 .75H28M0 6.75H28M.75 0V6M14.75 6V12"
            stroke="#8f2f1d"
            strokeWidth="1.4"
            fill="none"
            opacity=".7"
          />
        </pattern>
        <pattern id="ef-tiles" width="16" height="10" patternUnits="userSpaceOnUse">
          <rect width="16" height="10" fill="#3a1a12" />
          <path d="M0 9.5Q8 3.5 16 9.5" stroke="#6a3322" strokeWidth="1.3" fill="none" />
        </pattern>
        <linearGradient id="ef-shade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".32" />
          <stop offset=".18" stopColor="#000" stopOpacity="0" />
          <stop offset=".82" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".32" />
        </linearGradient>
        <filter id="ef-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width="520" height="640" fill="url(#ef-sky)" />

      {/* घर — "ghar", home */}
      <text
        x="260"
        y="252"
        textAnchor="middle"
        fontSize="215"
        fill="#dde5ee"
        fillOpacity=".2"
        style={{ fontFamily: "var(--font-deva), serif" }}
        aria-hidden="true"
      >
        घर
      </text>

      {/* Prayer flags */}
      {flags().map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.angle})`}>
          <rect x="-7" y="0" width="14" height="17" rx="1" fill={f.color} opacity=".92" />
        </g>
      ))}
      <path
        d="M30 160Q260 250 490 150"
        fill="none"
        stroke="#dde5ee"
        strokeOpacity=".45"
        strokeWidth="1.2"
      />

      {/* Mountains: far, mid, near */}
      <polygon
        points="0,430 70,370 120,402 190,318 250,392 320,300 392,386 450,340 520,410 520,640 0,640"
        fill="#3b5b8f"
      />
      <polygon points="190,318 177.5,333 185,330 191,340 198,331 202,333" fill="#e8eef5" />
      <polygon points="320,300 303,322 312,317 320,328 328,318 338,322" fill="#e8eef5" />
      <polygon
        points="0,470 60,430 130,462 210,420 290,470 360,438 430,468 520,430 520,640 0,640"
        fill="#29487d"
      />
      <polygon
        points="0,520 100,490 220,520 330,500 440,525 520,500 520,640 0,640"
        fill="#162a4e"
      />

      {/* ── The house ── */}
      {/* Roof */}
      <polygon points="58,336 462,336 404,280 116,280" fill="url(#ef-tiles)" />
      <rect x="110" y="274" width="300" height="8" fill={TIMBER} />
      <polygon points="260,258 253,274 267,274" fill="#f4b63f" />

      {/* Walls */}
      {[344, 436, 524].map((y, i) => {
        const h = i === 0 ? 72 : i === 1 ? 80 : 76;
        return (
          <g key={y}>
            <rect x="80" y={y} width="360" height={h} fill="url(#ef-brick)" />
            <rect x="80" y={y} width="360" height={h} fill="url(#ef-shade)" />
          </g>
        );
      })}

      {/* Timber beams and the tiled eave between storeys */}
      <rect x="64" y="336" width="392" height="8" fill={TIMBER} />
      <rect x="62" y="416" width="396" height="14" fill="url(#ef-tiles)" />
      <rect x="64" y="430" width="392" height="6" fill={TIMBER} />
      <rect x="70" y="516" width="380" height="8" fill={TIMBER} />

      {/* Window glow (blurred, behind the panes) */}
      <g filter="url(#ef-blur)">
        {WINDOWS.map((w, i) => (
          <rect
            key={i}
            className="glow"
            x={w.x - 4}
            y={w.y - 4}
            width={w.w + 8}
            height={w.h + 8}
            style={delay(w.d)}
          />
        ))}
      </g>

      {/* Frames, panes and lattice */}
      {WINDOWS.map((w, i) => (
        <g key={i}>
          <rect x={w.x - 4} y={w.y - 4} width={w.w + 8} height={w.h + 8} fill={TIMBER} />
          <rect className="win" x={w.x} y={w.y} width={w.w} height={w.h} style={delay(w.d)} />
          <path
            d={`M${w.x + w.w / 3} ${w.y}V${w.y + w.h}M${w.x + (2 * w.w) / 3} ${w.y}V${w.y + w.h}M${w.x} ${w.y + w.h / 3}H${w.x + w.w}M${w.x} ${w.y + (2 * w.h) / 3}H${w.x + w.w}`}
            stroke={TIMBER}
            strokeWidth="1.6"
            fill="none"
          />
        </g>
      ))}

      {/* Door with a lantern */}
      <path d="M228 600V560A32 32 0 0 1 292 560V600Z" fill={TIMBER} />
      <path d="M244 600V562A16 16 0 0 1 276 562V600Z" fill="#1a0b06" />
      <path d="M260 546V600M252 556V600M268 556V600" stroke="#3a1a12" strokeWidth="1.2" />
      <circle className="win" cx="260" cy="538" r="5" style={delay(0.8)} />

      {/* Street and step */}
      <rect x="0" y="600" width="520" height="40" fill="#0b1730" />
      <rect x="206" y="600" width="108" height="7" fill="#3a1a12" />
    </svg>
  );
}
